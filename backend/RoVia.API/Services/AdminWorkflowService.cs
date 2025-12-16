using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;

namespace RoVia.API.Services;

public class AdminWorkflowService
{
    private readonly AppDbContext _context;

    public AdminWorkflowService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PromoterApplicationResponse>> GetApplicationsAsync(PromoterApplicationStatus? status)
    {
        var query = _context.PromoterApplications.AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        var applications = await query
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync();

        return applications.Select(MapApplication).ToList();
    }

    public async Task<PromoterApplicationResponse?> ApproveApplicationAsync(int applicationId, int adminUserId, string? notes)
    {
        var application = await _context.PromoterApplications
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == applicationId);

        if (application == null)
            return null;

        if (application.Status != PromoterApplicationStatus.Pending)
            throw new InvalidOperationException("Aplicația a fost deja procesată.");

        var promoterRoleId = await ResolveRoleIdAsync("Promoter");

        application.Status = PromoterApplicationStatus.Approved;
        application.ReviewedAt = DateTime.UtcNow;
        application.ReviewedByUserId = adminUserId;
        application.AdminNotes = notes ?? string.Empty;
        application.User.RoleId = promoterRoleId;

        await _context.SaveChangesAsync();

        return MapApplication(application);
    }

    public async Task<PromoterApplicationResponse?> RejectApplicationAsync(int applicationId, int adminUserId, string? notes)
    {
        var application = await _context.PromoterApplications
            .FirstOrDefaultAsync(a => a.Id == applicationId);

        if (application == null)
            return null;

        if (application.Status != PromoterApplicationStatus.Pending)
            throw new InvalidOperationException("Aplicația a fost deja procesată.");

        application.Status = PromoterApplicationStatus.Rejected;
        application.ReviewedAt = DateTime.UtcNow;
        application.ReviewedByUserId = adminUserId;
        application.AdminNotes = notes ?? string.Empty;

        await _context.SaveChangesAsync();

        return MapApplication(application);
    }

    public async Task<List<AttractionSuggestionResponse>> GetSuggestionsAsync(SuggestionStatus? status)
    {
        var query = _context.AttractionSuggestions
            .Include(s => s.Promoter)
            .Include(s => s.Attraction)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        var suggestions = await query
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return suggestions.Select(MapSuggestion).ToList();
    }

    public async Task<AttractionSuggestionResponse?> ApproveSuggestionAsync(int suggestionId, int adminUserId, string? notes)
    {
        var suggestion = await _context.AttractionSuggestions
            .Include(s => s.Attraction)
            .Include(s => s.Promoter)
            .FirstOrDefaultAsync(s => s.Id == suggestionId);

        if (suggestion == null)
            return null;

        if (suggestion.Status != SuggestionStatus.Pending)
            throw new InvalidOperationException("Sugestia a fost deja procesată.");

        if (suggestion.CreatesNewAttraction)
        {
            if (!suggestion.ProposedLatitude.HasValue || !suggestion.ProposedLongitude.HasValue || suggestion.ProposedType == null)
                throw new InvalidOperationException("Sugestia nu conține toate datele pentru o atracție nouă.");

            var attraction = new Attraction
            {
                Name = suggestion.ProposedName,
                Description = suggestion.ProposedDescription,
                Latitude = suggestion.ProposedLatitude.Value,
                Longitude = suggestion.ProposedLongitude.Value,
                Type = suggestion.ProposedType.Value,
                Region = suggestion.ProposedRegion,
                ImageUrl = suggestion.ProposedImageUrl,
                Rating = 5.0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedByUserId = suggestion.PromoterId,
                IsApproved = true
            };

            _context.Attractions.Add(attraction);
            suggestion.Attraction = attraction;
        }
        else
        {
            if (!suggestion.AttractionId.HasValue)
                throw new InvalidOperationException("Sugestia nu indică atracția de actualizat.");

            var attraction = suggestion.Attraction ?? await _context.Attractions
                .FirstOrDefaultAsync(a => a.Id == suggestion.AttractionId.Value)
                ?? throw new InvalidOperationException("Atracția vizată nu există.");

            attraction.Name = suggestion.ProposedName;
            attraction.Description = suggestion.ProposedDescription;
            attraction.Region = suggestion.ProposedRegion;
            attraction.ImageUrl = suggestion.ProposedImageUrl;
            attraction.UpdatedAt = DateTime.UtcNow;
            attraction.IsApproved = true;

            if (suggestion.ProposedType.HasValue)
            {
                attraction.Type = suggestion.ProposedType.Value;
            }

            if (suggestion.ProposedLatitude.HasValue)
            {
                attraction.Latitude = suggestion.ProposedLatitude.Value;
            }

            if (suggestion.ProposedLongitude.HasValue)
            {
                attraction.Longitude = suggestion.ProposedLongitude.Value;
            }
        }

        suggestion.Status = SuggestionStatus.Approved;
        suggestion.ReviewedAt = DateTime.UtcNow;
        suggestion.ReviewedByUserId = adminUserId;
        suggestion.AdminResponse = notes ?? string.Empty;

        await _context.SaveChangesAsync();

        await _context.Entry(suggestion).Reference(s => s.Attraction).LoadAsync();
        await _context.Entry(suggestion).Reference(s => s.Promoter).LoadAsync();

        return MapSuggestion(suggestion);
    }

    public async Task<AttractionSuggestionResponse?> RejectSuggestionAsync(int suggestionId, int adminUserId, string? notes)
    {
        var suggestion = await _context.AttractionSuggestions
            .Include(s => s.Promoter)
            .FirstOrDefaultAsync(s => s.Id == suggestionId);

        if (suggestion == null)
            return null;

        if (suggestion.Status != SuggestionStatus.Pending)
            throw new InvalidOperationException("Sugestia a fost deja procesată.");

        suggestion.Status = SuggestionStatus.Rejected;
        suggestion.ReviewedAt = DateTime.UtcNow;
        suggestion.ReviewedByUserId = adminUserId;
        suggestion.AdminResponse = notes ?? string.Empty;

        await _context.SaveChangesAsync();

        await _context.Entry(suggestion).Reference(s => s.Attraction).LoadAsync();

        return MapSuggestion(suggestion);
    }

    public async Task<object> GetDashboardAsync()
    {
        var pendingApplications = await _context.PromoterApplications
            .CountAsync(a => a.Status == PromoterApplicationStatus.Pending);
        var approvedApplications = await _context.PromoterApplications
            .CountAsync(a => a.Status == PromoterApplicationStatus.Approved);
        var rejectedApplications = await _context.PromoterApplications
            .CountAsync(a => a.Status == PromoterApplicationStatus.Rejected);

        var pendingSuggestions = await _context.AttractionSuggestions
            .CountAsync(s => s.Status == SuggestionStatus.Pending);
        var approvedSuggestions = await _context.AttractionSuggestions
            .CountAsync(s => s.Status == SuggestionStatus.Approved);
        var rejectedSuggestions = await _context.AttractionSuggestions
            .CountAsync(s => s.Status == SuggestionStatus.Rejected);
        var approvedThisWeek = await _context.AttractionSuggestions
            .CountAsync(s => s.Status == SuggestionStatus.Approved && s.ReviewedAt >= DateTime.UtcNow.AddDays(-7));

        return new
        {
            PendingApplications = pendingApplications,
            ApprovedApplications = approvedApplications,
            RejectedApplications = rejectedApplications,
            PendingSuggestions = pendingSuggestions,
            ApprovedSuggestions = approvedSuggestions,
            RejectedSuggestions = rejectedSuggestions,
            ApprovedThisWeek = approvedThisWeek
        };
    }

    private async Task<int> ResolveRoleIdAsync(string roleName)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName)
            ?? throw new InvalidOperationException($"Rolul {roleName} nu este configurat.");
        return role.Id;
    }

    private static PromoterApplicationResponse MapApplication(PromoterApplication application) => new()
    {
        Id = application.Id,
        CompanyName = application.CompanyName,
        CompanyWebsite = application.CompanyWebsite,
        ContactEmail = application.ContactEmail,
        Motivation = application.Motivation,
        Status = application.Status,
        SubmittedAt = application.SubmittedAt,
        ReviewedAt = application.ReviewedAt,
        AdminNotes = application.AdminNotes
    };

    private static AttractionSuggestionResponse MapSuggestion(AttractionSuggestion suggestion) => new()
    {
        Id = suggestion.Id,
        PromoterId = suggestion.PromoterId,
        PromoterName = suggestion.Promoter?.Username ?? string.Empty,
        AttractionId = suggestion.AttractionId,
        CreatesNewAttraction = suggestion.CreatesNewAttraction,
        Title = suggestion.Title,
        Details = suggestion.Details,
        ProposedName = suggestion.ProposedName,
        ProposedDescription = suggestion.ProposedDescription,
        ProposedRegion = suggestion.ProposedRegion,
        ProposedType = suggestion.ProposedType,
        ProposedLatitude = suggestion.ProposedLatitude,
        ProposedLongitude = suggestion.ProposedLongitude,
        ProposedImageUrl = suggestion.ProposedImageUrl,
        Status = suggestion.Status,
        SubmittedAt = suggestion.SubmittedAt,
        ReviewedAt = suggestion.ReviewedAt,
        ReviewedByUserId = suggestion.ReviewedByUserId,
        AdminResponse = suggestion.AdminResponse
    };
}
