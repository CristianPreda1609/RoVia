using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;

namespace RoVia.API.Services;

public class PromoterWorkflowService
{
    private readonly AppDbContext _context;
    private readonly ActivityPointsService _activityPoints;

    public PromoterWorkflowService(AppDbContext context, ActivityPointsService activityPoints)
    {
        _context = context;
        _activityPoints = activityPoints;
    }

    public async Task<PromoterApplicationResponse> SubmitApplicationAsync(int userId, PromoterApplicationRequest request)
    {
        var user = await _context.Users.Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new InvalidOperationException("Utilizatorul nu există.");

        if (user.Role?.Name is "Promoter" or "Administrator")
            throw new InvalidOperationException("Acest cont are deja privilegii extinse.");

        var hasPending = await _context.PromoterApplications
            .AnyAsync(a => a.UserId == userId && a.Status == PromoterApplicationStatus.Pending);

        if (hasPending)
            throw new InvalidOperationException("Ai deja o aplicație în curs de verificare.");

        var application = new PromoterApplication
        {
            UserId = userId,
            CompanyName = request.CompanyName,
            CompanyWebsite = request.CompanyWebsite,
            ContactEmail = request.ContactEmail,
            Motivation = request.Motivation,
            Status = PromoterApplicationStatus.Pending,
            SubmittedAt = DateTime.UtcNow,
            AdminNotes = string.Empty
        };

        _context.PromoterApplications.Add(application);
        await _context.SaveChangesAsync();

        return MapApplication(application);
    }

    public async Task<List<PromoterApplicationResponse>> GetApplicationsForUserAsync(int userId)
    {
        var applications = await _context.PromoterApplications
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync();

        return applications.Select(MapApplication).ToList();
    }

    public async Task<PromoterApplicationResponse?> GetLatestApplicationAsync(int userId)
    {
        var application = await _context.PromoterApplications
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.SubmittedAt)
            .FirstOrDefaultAsync();

        return application == null ? null : MapApplication(application);
    }

    public async Task<AttractionSuggestionResponse> SubmitSuggestionAsync(int promoterId, AttractionSuggestionRequest request)
    {
        var user = await _context.Users.Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == promoterId)
            ?? throw new InvalidOperationException("Utilizatorul nu există.");

        if (user.Role?.Name != "Promoter")
            throw new InvalidOperationException("Doar promotorii pot propune atracții.");

        if (!request.CreatesNewAttraction && !request.AttractionId.HasValue)
            throw new InvalidOperationException("Trebuie să selectezi o atracție de actualizat.");

        if (request.CreatesNewAttraction &&
            (!request.ProposedLatitude.HasValue || !request.ProposedLongitude.HasValue || request.ProposedType == null))
        {
            throw new InvalidOperationException("Noile atracții au nevoie de coordonate și tip.");
        }

        if (!request.CreatesNewAttraction && request.AttractionId.HasValue)
        {
            var exists = await _context.Attractions.AnyAsync(a => a.Id == request.AttractionId.Value);
            if (!exists)
                throw new InvalidOperationException("Atracția selectată nu există.");
        }

        var suggestion = new AttractionSuggestion
        {
            PromoterId = promoterId,
            AttractionId = request.AttractionId,
            CreatesNewAttraction = request.CreatesNewAttraction,
            Title = request.Title,
            Details = request.Details,
            ProposedName = request.ProposedName,
            ProposedDescription = request.ProposedDescription,
            ProposedRegion = request.ProposedRegion,
            ProposedType = request.ProposedType,
            ProposedLatitude = request.ProposedLatitude,
            ProposedLongitude = request.ProposedLongitude,
            ProposedImageUrl = request.ProposedImageUrl,
            Status = SuggestionStatus.Pending,
            SubmittedAt = DateTime.UtcNow,
            AdminResponse = string.Empty
        };

        _context.AttractionSuggestions.Add(suggestion);

        var permissions = await GetPromoterPermissionsAsync(promoterId);
        if (request.CreatesNewAttraction && permissions.CanAutoApproveAttractions)
        {
            var attraction = new Attraction
            {
                Name = request.ProposedName,
                Description = request.ProposedDescription,
                Latitude = request.ProposedLatitude ?? 0,
                Longitude = request.ProposedLongitude ?? 0,
                Type = request.ProposedType ?? 0,
                Region = request.ProposedRegion ?? string.Empty,
                ImageUrl = request.ProposedImageUrl ?? string.Empty,
                Rating = 5.0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedByUserId = promoterId,
                IsApproved = true
            };

            _context.Attractions.Add(attraction);
            suggestion.Attraction = attraction;
            suggestion.Status = SuggestionStatus.Approved;
            suggestion.ReviewedAt = DateTime.UtcNow;
            suggestion.ReviewedByUserId = promoterId;
            suggestion.AdminResponse = "Auto-aprobat (promotor de încredere).";
        }

        await _context.SaveChangesAsync();

        await _activityPoints.AwardActivityAsync(promoterId, "Promoter", ActivityAction.SuggestionSubmitted);
        if (suggestion.Status == SuggestionStatus.Approved && suggestion.CreatesNewAttraction)
        {
            await _activityPoints.AwardActivityAsync(promoterId, "Promoter", ActivityAction.AttractionCreated);
            await _activityPoints.AwardActivityAsync(promoterId, "Promoter", ActivityAction.SuggestionApproved);
        }

        suggestion.Promoter = user;
        return MapSuggestion(suggestion);
    }

    public async Task<List<AttractionSuggestionResponse>> GetSuggestionsForPromoterAsync(int promoterId, SuggestionStatus? status)
    {
        var query = _context.AttractionSuggestions
            .Where(s => s.PromoterId == promoterId);

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        var suggestions = await query
            .Include(s => s.Promoter)
            .Include(s => s.Attraction)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return suggestions.Select(MapSuggestion).ToList();
    }

    public async Task<object> GetDashboardAsync(int promoterId)
    {
        var permissions = await GetPromoterPermissionsAsync(promoterId);
        var latestApplication = await GetLatestApplicationAsync(promoterId);
        var pendingSuggestions = await _context.AttractionSuggestions
            .CountAsync(s => s.PromoterId == promoterId && s.Status == SuggestionStatus.Pending);
        var approvedSuggestions = await _context.AttractionSuggestions
            .CountAsync(s => s.PromoterId == promoterId && s.Status == SuggestionStatus.Approved);
        var approvedAttractions = await _context.Attractions
            .CountAsync(a => a.CreatedByUserId == promoterId && a.IsApproved);

        return new
        {
            LatestApplication = latestApplication,
            PendingSuggestions = pendingSuggestions,
            ApprovedSuggestions = approvedSuggestions,
            ApprovedAttractions = approvedAttractions,
            Permissions = new
            {
                permissions.CanCreateGlobalQuizzes,
                permissions.CanAutoApproveAttractions,
                permissions.AttractionsCreated,
                permissions.ActivityScore,
                permissions.PriorityRank,
                permissions.TotalPromoters,
                permissions.PriorityTier
            }
        };
    }

    private async Task<(bool CanCreateGlobalQuizzes, bool CanAutoApproveAttractions, int AttractionsCreated, int ActivityScore, int PriorityRank, int TotalPromoters, string PriorityTier)> GetPromoterPermissionsAsync(int promoterId)
    {
        var stats = await _context.UserActivityStats.FirstOrDefaultAsync(s => s.UserId == promoterId)
            ?? new UserActivityStats { UserId = promoterId };

        var attractionsCreated = stats.AttractionsCreated;
        var activityScore = stats.AttractionsCreated + stats.AttractionsUpdated + stats.QuizzesCreated + stats.QuizzesUpdated + stats.SuggestionsApproved;

        var promoterRoleId = await _context.Roles
            .Where(r => r.Name == "Promoter")
            .Select(r => r.Id)
            .FirstOrDefaultAsync();

        var promoterIds = await _context.Users
            .Where(u => u.RoleId == promoterRoleId)
            .Select(u => u.Id)
            .ToListAsync();

        var totals = await _context.UserActivityStats
            .Where(s => promoterIds.Contains(s.UserId))
            .Select(s => new { s.UserId, Score = s.AttractionsCreated + s.AttractionsUpdated + s.QuizzesCreated + s.QuizzesUpdated + s.SuggestionsApproved })
            .OrderByDescending(s => s.Score)
            .ToListAsync();

        var totalPromoters = totals.Count;
        var rank = 0;
        if (totalPromoters > 0)
        {
            var index = totals.FindIndex(s => s.UserId == promoterId);
            rank = index >= 0 ? index + 1 : totalPromoters + 1;
        }

        var tier = activityScore >= 20 ? "Ridicată" : activityScore >= 10 ? "Mediu" : "Standard";

        return (
            CanCreateGlobalQuizzes: attractionsCreated >= 5,
            CanAutoApproveAttractions: attractionsCreated >= 20,
            AttractionsCreated: attractionsCreated,
            ActivityScore: activityScore,
            PriorityRank: rank,
            TotalPromoters: totalPromoters,
            PriorityTier: tier
        );
    }

    public async Task<List<OwnedAttractionDto>> GetOwnedAttractionsAsync(int promoterId)
    {
        return await _context.Attractions
            .Where(a => a.CreatedByUserId == promoterId)
            .OrderByDescending(a => a.UpdatedAt)
            .Select(a => new OwnedAttractionDto
            {
                Id = a.Id,
                Name = a.Name,
                Region = a.Region,
                IsApproved = a.IsApproved
            })
            .ToListAsync();
    }

    public async Task<bool> UpdateOwnedAttractionAsync(int attractionId, int promoterId, AttractionUpsertRequest request)
    {
        var attraction = await _context.Attractions.FirstOrDefaultAsync(a => a.Id == attractionId);
        if (attraction == null) return false;

        if (attraction.CreatedByUserId != promoterId)
            throw new InvalidOperationException("Nu ai permisiunea să modifici această atracție.");

        attraction.Name = request.Name;
        attraction.Description = request.Description;
        attraction.Region = request.Region;
        attraction.Type = request.Type;
        attraction.Latitude = request.Latitude;
        attraction.Longitude = request.Longitude;
        attraction.ImageUrl = request.ImageUrl;
        attraction.Rating = request.Rating;
        attraction.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _activityPoints.AwardActivityAsync(promoterId, "Promoter", ActivityAction.AttractionUpdated);
        return true;
    }

    public async Task<bool> DeleteOwnedAttractionAsync(int attractionId, int promoterId)
    {
        var attraction = await _context.Attractions.FirstOrDefaultAsync(a => a.Id == attractionId);
        if (attraction == null) return false;

        if (attraction.CreatedByUserId != promoterId)
            throw new InvalidOperationException("Nu ai permisiunea să ștergi această atracție.");

        // Delete related user progress records first
        var quizzes = await _context.Quizzes.Where(q => q.AttractionId == attractionId).ToListAsync();
        foreach (var quiz in quizzes)
        {
            var userProgresses = await _context.UserProgresses.Where(up => up.QuizId == quiz.Id).ToListAsync();
            _context.UserProgresses.RemoveRange(userProgresses);
        }

        // Delete quizzes
        _context.Quizzes.RemoveRange(quizzes);

        // Delete related suggestions
        var suggestions = await _context.AttractionSuggestions.Where(s => s.AttractionId == attractionId).ToListAsync();
        _context.AttractionSuggestions.RemoveRange(suggestions);

        // Finally delete attraction
        _context.Attractions.Remove(attraction);
        await _context.SaveChangesAsync();
        return true;
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
