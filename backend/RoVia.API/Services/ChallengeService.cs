using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.Models;
using RoVia.API.DTOs;

namespace RoVia.API.Services;

public class ChallengeService
{
    private readonly AppDbContext _context;
    private readonly GeminiClient _gemini;

    public ChallengeService(AppDbContext context, GeminiClient gemini)
    {
        _context = context;
        _gemini = gemini;
    }

    public async Task EnsureChallengesAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var weekStart = GetWeekStart(today);

        var hasDaily = await _context.Challenges.AnyAsync(c => c.Kind == ChallengeKind.Daily && c.StartDate == today, cancellationToken);
        var hasWeekly = await _context.Challenges.AnyAsync(c => c.Kind == ChallengeKind.Weekly && c.StartDate == weekStart, cancellationToken);

        if (!hasDaily)
        {
            var daily = await GenerateChallengesAsync(ChallengeKind.Daily, today, today.AddDays(1).AddTicks(-1), cancellationToken);
            _context.Challenges.AddRange(daily);
        }

        if (!hasWeekly)
        {
            var weekly = await GenerateChallengesAsync(ChallengeKind.Weekly, weekStart, weekStart.AddDays(7).AddTicks(-1), cancellationToken);
            _context.Challenges.AddRange(weekly);
        }

        if (!hasDaily || !hasWeekly)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyList<Challenge>> GetActiveDailyAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        return await _context.Challenges
            .Where(c => c.Kind == ChallengeKind.Daily && c.StartDate == today)
            .OrderBy(c => c.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Challenge>> GetActiveWeeklyAsync(CancellationToken cancellationToken = default)
    {
        var weekStart = GetWeekStart(DateTime.UtcNow.Date);
        return await _context.Challenges
            .Where(c => c.Kind == ChallengeKind.Weekly && c.StartDate == weekStart)
            .OrderBy(c => c.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ChallengeWithProgressDto>> GetActiveDailyWithProgressAsync(int userId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var challenges = await _context.Challenges
            .Where(c => c.Kind == ChallengeKind.Daily && c.StartDate == today)
            .OrderBy(c => c.Id)
            .ToListAsync(cancellationToken);

        var userChallenges = await _context.UserChallenges
            .Where(uc => uc.UserId == userId && challenges.Select(c => c.Id).Contains(uc.ChallengeId))
            .ToListAsync(cancellationToken);

        return challenges.Select(c =>
        {
            var uc = userChallenges.FirstOrDefault(x => x.ChallengeId == c.Id);
            return new ChallengeWithProgressDto
            {
                Id = c.Id,
                Kind = c.Kind.ToString(),
                Title = c.Title,
                Description = c.Description,
                RewardXp = c.RewardXp,
                Type = c.Type,
                Target = c.Target,
                IsAccepted = uc != null,
                Progress = uc?.Progress ?? 0,
                IsCompleted = uc?.IsCompleted ?? false,
                CompletedAt = uc?.CompletedAt
            };
        }).ToList();
    }

    public async Task<IReadOnlyList<ChallengeWithProgressDto>> GetActiveWeeklyWithProgressAsync(int userId, CancellationToken cancellationToken = default)
    {
        var weekStart = GetWeekStart(DateTime.UtcNow.Date);
        var challenges = await _context.Challenges
            .Where(c => c.Kind == ChallengeKind.Weekly && c.StartDate == weekStart)
            .OrderBy(c => c.Id)
            .ToListAsync(cancellationToken);

        var userChallenges = await _context.UserChallenges
            .Where(uc => uc.UserId == userId && challenges.Select(c => c.Id).Contains(uc.ChallengeId))
            .ToListAsync(cancellationToken);

        return challenges.Select(c =>
        {
            var uc = userChallenges.FirstOrDefault(x => x.ChallengeId == c.Id);
            return new ChallengeWithProgressDto
            {
                Id = c.Id,
                Kind = c.Kind.ToString(),
                Title = c.Title,
                Description = c.Description,
                RewardXp = c.RewardXp,
                Type = c.Type,
                Target = c.Target,
                IsAccepted = uc != null,
                Progress = uc?.Progress ?? 0,
                IsCompleted = uc?.IsCompleted ?? false,
                CompletedAt = uc?.CompletedAt
            };
        }).ToList();
    }

    private Task<List<Challenge>> GenerateChallengesAsync(ChallengeKind kind, DateTime startDate, DateTime endDate, CancellationToken cancellationToken)
    {
        var parsed = kind == ChallengeKind.Daily ? GetDailyFallback() : GetWeeklyFallback();

        var results = parsed.Select(item => new Challenge
        {
            Kind = kind,
            StartDate = startDate,
            EndDate = endDate,
            Title = item.Title,
            Description = item.Description,
            RewardXp = item.RewardXp,
            Type = item.Type ?? "VisitAttractions",
            Target = item.Target,
            Source = "Fallback"
        }).ToList();

        return Task.FromResult(results);
    }

    private static List<ChallengeSeed> TryParseChallenges(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new List<ChallengeSeed>();
        }

        var json = ExtractJsonArray(text);
        if (json == null)
        {
            return new List<ChallengeSeed>();
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            AllowTrailingCommas = true
        };

        try
        {
            return JsonSerializer.Deserialize<List<ChallengeSeed>>(json, options) ?? new List<ChallengeSeed>();
        }
        catch
        {
            var repaired = RepairJsonArray(json);
            if (!string.IsNullOrWhiteSpace(repaired))
            {
                try
                {
                    return JsonSerializer.Deserialize<List<ChallengeSeed>>(repaired, options) ?? new List<ChallengeSeed>();
                }
                catch
                {
                    return new List<ChallengeSeed>();
                }
            }

            return new List<ChallengeSeed>();
        }
    }

    private static string? ExtractJsonArray(string text)
    {
        var cleaned = StripCodeFences(text).Trim();

        var start = cleaned.IndexOf('[');
        if (start < 0)
        {
            return null;
        }

        var end = cleaned.LastIndexOf(']');
        if (end > start)
        {
            return cleaned.Substring(start, end - start + 1);
        }

        // Dacă lipsește ']', încearcă să închizi după ultimul obiect valid
        var lastObjectEnd = cleaned.LastIndexOf('}');
        if (lastObjectEnd > start)
        {
            return cleaned.Substring(start, lastObjectEnd - start + 1) + "]";
        }

        return null;
    }

    private static string StripCodeFences(string text)
    {
        var trimmed = text.Trim();
        if (!trimmed.StartsWith("```"))
        {
            return text;
        }

        var firstNewline = trimmed.IndexOf('\n');
        if (firstNewline < 0)
        {
            return text;
        }

        var lastFence = trimmed.LastIndexOf("```");
        if (lastFence <= firstNewline)
        {
            return text;
        }

        return trimmed.Substring(firstNewline + 1, lastFence - firstNewline - 1);
    }

    private static string? RepairJsonArray(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        var start = json.IndexOf('[');
        if (start < 0)
        {
            return null;
        }

        // Taie la ultimul obiect complet și închide array-ul
        var lastObjectEnd = json.LastIndexOf('}');
        if (lastObjectEnd <= start)
        {
            return null;
        }

        var trimmed = json.Substring(start, lastObjectEnd - start + 1);
        trimmed = trimmed.TrimEnd();
        if (!trimmed.EndsWith("]"))
        {
            trimmed += "]";
        }

        return trimmed;
    }

    private static DateTime GetWeekStart(DateTime date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-1 * diff).Date;
    }

    private static List<ChallengeSeed> GetDailyFallback() => new()
    {
        new ChallengeSeed("Explorator rapid", "Vizitează 2 atracții în aceeași regiune.", 25, "VisitAttractions", 2),
        new ChallengeSeed("Mini-quiz", "Finalizează 1 quiz despre România.", 20, "CompleteQuiz", 1),
        new ChallengeSeed("Pasiune locală", "Salvează 1 atracție la favorite.", 15, "SaveFavorites", 1)
    };

    private static List<ChallengeSeed> GetWeeklyFallback() => new()
    {
        new ChallengeSeed("Săptămâna exploratorului", "Vizitează 5 atracții diferite.", 80, "VisitAttractions", 5),
        new ChallengeSeed("Cultura românească", "Finalizează 3 quiz-uri culturale.", 70, "CompleteQuiz", 3),
        new ChallengeSeed("Tur regional", "Explorează 3 regiuni turistice.", 90, "ExploreRegions", 3),
        new ChallengeSeed("Colecționar", "Adună 2 insigne noi.", 60, "EarnBadges", 2),
        new ChallengeSeed("Prietenii călători", "Invită 1 prieten.", 50, "InviteFriends", 1)
    };

    private record ChallengeSeed(string Title, string Description, int RewardXp, string? Type, int Target);

    public async Task RegenerateChallengesAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var weekStart = GetWeekStart(today);

        // Șterge provocările existente
        var oldDaily = await _context.Challenges.Where(c => c.Kind == ChallengeKind.Daily && c.StartDate == today).ToListAsync(cancellationToken);
        var oldWeekly = await _context.Challenges.Where(c => c.Kind == ChallengeKind.Weekly && c.StartDate == weekStart).ToListAsync(cancellationToken);
        _context.Challenges.RemoveRange(oldDaily);
        _context.Challenges.RemoveRange(oldWeekly);

        // Generează noi provocări
        var daily = await GenerateChallengesAsync(ChallengeKind.Daily, today, today.AddDays(1).AddTicks(-1), cancellationToken);
        var weekly = await GenerateChallengesAsync(ChallengeKind.Weekly, weekStart, weekStart.AddDays(7).AddTicks(-1), cancellationToken);
        
        _context.Challenges.AddRange(daily);
        _context.Challenges.AddRange(weekly);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AcceptChallengeAsync(int userId, int challengeId, CancellationToken cancellationToken = default)
    {
        var exists = await _context.UserChallenges.AnyAsync(uc => uc.UserId == userId && uc.ChallengeId == challengeId, cancellationToken);
        if (exists) return;

        var challenge = await _context.Challenges.FindAsync(new object[] { challengeId }, cancellationToken);
        if (challenge == null) return;

        var userChallenge = new UserChallenge
        {
            UserId = userId,
            ChallengeId = challengeId,
            Target = challenge.Target,
            Type = Enum.TryParse<ChallengeType>(challenge.Type, out var type) ? type : ChallengeType.VisitAttractions
        };

        _context.UserChallenges.Add(userChallenge);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<UserChallenge>> GetUserChallengesAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.UserChallenges
            .Include(uc => uc.Challenge)
            .Where(uc => uc.UserId == userId && !uc.IsCompleted)
            .OrderByDescending(uc => uc.AcceptedAt)
            .ToListAsync(cancellationToken);
    }
}
