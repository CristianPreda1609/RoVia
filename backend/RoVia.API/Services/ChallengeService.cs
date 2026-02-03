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

    // Pool mare de challenge-uri Daily - cicleaza aleatoriu
    private static readonly List<ChallengeSeed> DailyChallengePool = new()
    {
        // VisitAttractions - baza
        new ChallengeSeed("Explorator rapid", "Vizitează 2 atracții astăzi.", 25, "VisitAttractions", 2),
        new ChallengeSeed("Descoperitor urban", "Vizitează 3 atracții în orașe diferite.", 30, "VisitAttractions", 3),
        new ChallengeSeed("Aventură locală", "Explorează 1 atracție nouă.", 20, "VisitAttractions", 1),
        new ChallengeSeed("Turist activ", "Vizitează 4 locuri istorice.", 35, "VisitAttractions", 4),
        new ChallengeSeed("Pasionat de istorie", "Descoperă 2 situri istorice.", 25, "VisitAttractions", 2),
        
        // CompleteQuiz
        new ChallengeSeed("Mini-quiz", "Finalizează 1 quiz despre România.", 20, "CompleteQuiz", 1),
        new ChallengeSeed("Expert cultura", "Completează 2 quiz-uri culturale.", 30, "CompleteQuiz", 2),
        new ChallengeSeed("Învățător rapid", "Termină 1 quiz cu punctaj perfect.", 25, "CompleteQuiz", 1),
        new ChallengeSeed("Cunoaștere locală", "Rezolvă 1 quiz despre atracții.", 20, "CompleteQuiz", 1),
        
        // ExploreRegions
        new ChallengeSeed("Călător regional", "Explorează 2 județe diferite.", 30, "ExploreRegions", 2),
        new ChallengeSeed("Tur de țară", "Descoperă 1 regiune nouă.", 25, "ExploreRegions", 1),
        new ChallengeSeed("Aventurier român", "Vizitează atracții din 3 regiuni.", 35, "ExploreRegions", 3),
        
        // SaveFavorites
        new ChallengeSeed("Colecționar", "Salvează 2 atracții la favorite.", 20, "SaveFavorites", 2),
        new ChallengeSeed("Pasiune locală", "Adaugă 1 loc preferat.", 15, "SaveFavorites", 1),
        new ChallengeSeed("Liste de călătorii", "Salvează 3 destinații.", 25, "SaveFavorites", 3),
        
        // EarnBadges
        new ChallengeSeed("Vânător de insigne", "Deblochează 1 insignă nouă.", 30, "EarnBadges", 1),
        new ChallengeSeed("Realizări rapide", "Obține 1 achievement.", 25, "EarnBadges", 1),
        
        // InviteFriends
        new ChallengeSeed("Partener de călătorie", "Invită 1 prieten să exploreze.", 35, "InviteFriends", 1),
        new ChallengeSeed("Ambasador RoVia", "Trimite 1 invitație.", 30, "InviteFriends", 1)
    };

    // Pool mare de challenge-uri Weekly - mai grele
    private static readonly List<ChallengeSeed> WeeklyChallengePool = new()
    {
        // VisitAttractions - weekly
        new ChallengeSeed("Săptămâna exploratorului", "Vizitează 10 atracții diferite.", 100, "VisitAttractions", 10),
        new ChallengeSeed("Maratonul turistic", "Descoperă 15 locuri noi.", 120, "VisitAttractions", 15),
        new ChallengeSeed("Colecționarul de monumente", "Explorează 8 situri istorice.", 90, "VisitAttractions", 8),
        new ChallengeSeed("Aventură națională", "Vizitează 12 atracții în 7 zile.", 110, "VisitAttractions", 12),
        new ChallengeSeed("Descoperitor de castele", "Vizitează 5 castele sau cetăți.", 85, "VisitAttractions", 5),
        new ChallengeSeed("Turist religios", "Explorează 6 mănăstiri sau biserici.", 80, "VisitAttractions", 6),
        
        // CompleteQuiz - weekly
        new ChallengeSeed("Cultura românească", "Finalizează 5 quiz-uri culturale.", 80, "CompleteQuiz", 5),
        new ChallengeSeed("Expertul României", "Completează 7 quiz-uri despre țară.", 95, "CompleteQuiz", 7),
        new ChallengeSeed("Învățare intensivă", "Termină 10 quiz-uri.", 110, "CompleteQuiz", 10),
        new ChallengeSeed("Profesor de geografie", "Rezolvă 6 quiz-uri despre regiuni.", 85, "CompleteQuiz", 6),
        new ChallengeSeed("Istoric amator", "Completează 4 quiz-uri despre istorie.", 70, "CompleteQuiz", 4),
        
        // ExploreRegions - weekly
        new ChallengeSeed("Tur regional", "Explorează 5 județe diferite.", 100, "ExploreRegions", 5),
        new ChallengeSeed("Călătorul României", "Descoperă 7 regiuni noi.", 115, "ExploreRegions", 7),
        new ChallengeSeed("De la munte la mare", "Vizitează 6 zone geografice.", 95, "ExploreRegions", 6),
        new ChallengeSeed("Harta României", "Explorează 8 județe.", 105, "ExploreRegions", 8),
        
        // SaveFavorites - weekly
        new ChallengeSeed("Lista dorințelor", "Salvează 8 atracții la favorite.", 65, "SaveFavorites", 8),
        new ChallengeSeed("Planificator de călătorii", "Adaugă 10 destinații preferate.", 75, "SaveFavorites", 10),
        new ChallengeSeed("Colecție personală", "Salvează 12 locuri interesante.", 80, "SaveFavorites", 12),
        
        // EarnBadges - weekly
        new ChallengeSeed("Colecționarul", "Deblochează 3 insigne noi.", 90, "EarnBadges", 3),
        new ChallengeSeed("Maestrul realizărilor", "Obține 4 achievement-uri.", 100, "EarnBadges", 4),
        new ChallengeSeed("Vânător de trofee", "Câștigă 2 insigne săptămâna aceasta.", 80, "EarnBadges", 2),
        
        // InviteFriends - weekly
        new ChallengeSeed("Comunitate activă", "Invită 3 prieteni să exploreze.", 85, "InviteFriends", 3),
        new ChallengeSeed("Lider social", "Trimite 2 invitații.", 70, "InviteFriends", 2),
        new ChallengeSeed("Ambasador regional", "Convinge 1 prieten să se alăture.", 60, "InviteFriends", 1)
    };

    private static List<ChallengeSeed> GetDailyFallback()
    {
        // Selectează 3 challenge-uri random din pool
        var random = new Random();
        return DailyChallengePool
            .OrderBy(x => random.Next())
            .Take(3)
            .ToList();
    }

    private static List<ChallengeSeed> GetWeeklyFallback()
    {
        // Selectează 5 challenge-uri random din pool
        var random = new Random();
        return WeeklyChallengePool
            .OrderBy(x => random.Next())
            .Take(5)
            .ToList();
    }

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
