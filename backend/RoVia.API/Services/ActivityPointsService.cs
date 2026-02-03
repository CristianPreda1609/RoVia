using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.Models;

namespace RoVia.API.Services;

public enum ActivityAction
{
    AttractionCreated,
    AttractionUpdated,
    QuizCreated,
    QuizUpdated,
    SuggestionSubmitted,
    SuggestionApproved
}

public class ActivityPointsService
{
    private readonly AppDbContext _context;

    private static readonly Dictionary<ActivityAction, int> PromoterPoints = new()
    {
        { ActivityAction.AttractionCreated, 60 },
        { ActivityAction.AttractionUpdated, 25 },
        { ActivityAction.QuizCreated, 45 },
        { ActivityAction.QuizUpdated, 20 },
        { ActivityAction.SuggestionSubmitted, 10 },
        { ActivityAction.SuggestionApproved, 20 }
    };

    private static readonly Dictionary<ActivityAction, int> AdminPoints = new()
    {
        { ActivityAction.AttractionCreated, 35 },
        { ActivityAction.AttractionUpdated, 15 },
        { ActivityAction.QuizCreated, 25 },
        { ActivityAction.QuizUpdated, 10 },
        { ActivityAction.SuggestionApproved, 10 }
    };

    public ActivityPointsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task BackfillActivityStatsAsync()
    {
        var users = await _context.Users
            .Include(u => u.Role)
            .ToListAsync();

        foreach (var user in users)
        {
            var roleName = user.Role?.Name ?? string.Empty;
            if (roleName is not ("Promoter" or "Administrator"))
                continue;

            var hasStats = await _context.UserActivityStats.AnyAsync(s => s.UserId == user.Id);
            if (hasStats)
                continue;

            var attractionsCreated = await _context.Attractions
                .CountAsync(a => a.CreatedByUserId == user.Id && a.IsApproved);
            var quizzesCreated = await _context.Quizzes
                .CountAsync(q => q.CreatedByUserId == user.Id);
            var suggestionsSubmitted = await _context.AttractionSuggestions
                .CountAsync(s => s.PromoterId == user.Id);
            var suggestionsApproved = await _context.AttractionSuggestions
                .CountAsync(s => s.PromoterId == user.Id && s.Status == SuggestionStatus.Approved);

            var stats = new UserActivityStats
            {
                UserId = user.Id,
                AttractionsCreated = attractionsCreated,
                AttractionsUpdated = 0,
                QuizzesCreated = quizzesCreated,
                QuizzesUpdated = 0,
                SuggestionsSubmitted = suggestionsSubmitted,
                SuggestionsApproved = suggestionsApproved,
                LastUpdatedAt = DateTime.UtcNow
            };

            _context.UserActivityStats.Add(stats);

            var points = 0;
            if (roleName == "Promoter")
            {
                points += attractionsCreated * PromoterPoints[ActivityAction.AttractionCreated];
                points += quizzesCreated * PromoterPoints[ActivityAction.QuizCreated];
                points += suggestionsSubmitted * PromoterPoints[ActivityAction.SuggestionSubmitted];
                points += suggestionsApproved * PromoterPoints[ActivityAction.SuggestionApproved];
            }
            else if (roleName == "Administrator")
            {
                points += attractionsCreated * AdminPoints[ActivityAction.AttractionCreated];
                points += quizzesCreated * AdminPoints[ActivityAction.QuizCreated];
                points += suggestionsApproved * AdminPoints[ActivityAction.SuggestionApproved];
            }

            if (points > 0)
            {
                user.TotalPoints += points;
                user.MonthlyPoints += points;
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task AwardActivityAsync(int userId, string roleName, ActivityAction action)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return;

        var stats = await _context.UserActivityStats.FirstOrDefaultAsync(s => s.UserId == userId);
        if (stats == null)
        {
            stats = new UserActivityStats { UserId = userId };
            _context.UserActivityStats.Add(stats);
        }

        var points = roleName == "Administrator"
            ? (AdminPoints.TryGetValue(action, out var adminPoints) ? adminPoints : 0)
            : roleName == "Promoter"
                ? (PromoterPoints.TryGetValue(action, out var promoterPoints) ? promoterPoints : 0)
                : 0;

        if (points > 0)
        {
            user.TotalPoints += points;
            user.MonthlyPoints += points;
        }

        switch (action)
        {
            case ActivityAction.AttractionCreated:
                stats.AttractionsCreated += 1;
                break;
            case ActivityAction.AttractionUpdated:
                stats.AttractionsUpdated += 1;
                break;
            case ActivityAction.QuizCreated:
                stats.QuizzesCreated += 1;
                break;
            case ActivityAction.QuizUpdated:
                stats.QuizzesUpdated += 1;
                break;
            case ActivityAction.SuggestionSubmitted:
                stats.SuggestionsSubmitted += 1;
                break;
            case ActivityAction.SuggestionApproved:
                stats.SuggestionsApproved += 1;
                break;
        }

        stats.LastUpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}
