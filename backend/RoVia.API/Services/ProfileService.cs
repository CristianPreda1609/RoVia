using System;
using System.Collections.Generic;
using System.Linq;
using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;
using Microsoft.EntityFrameworkCore;

namespace RoVia.API.Services;

public class ProfileService
{
    private readonly AppDbContext _context;
    private readonly ChallengeProgressService _challengeProgress;

    public ProfileService(AppDbContext context, ChallengeProgressService challengeProgress)
    {
        _context = context;
        _challengeProgress = challengeProgress;
    }

    public async Task<dynamic> GetUserProfileAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        // Ensure Role is loaded
        if (user.Role == null && user.RoleId > 0)
        {
            user.Role = await _context.Roles.FindAsync(user.RoleId);
        }

        var quizzesCompleted = await _context.UserProgresses
            .Where(up => up.UserId == userId && up.IsCompleted)
            .CountAsync();

        var badges = await _context.UserBadges
            .Where(ub => ub.UserId == userId)
            .Include(ub => ub.Badge)
            .ToListAsync();
        var unlockedBadgeIds = badges.Select(b => b.BadgeId).ToHashSet();

        var nextBadge = await _context.Badges
            .Where(b => !unlockedBadgeIds.Contains(b.Id))
            .OrderBy(b => b.RequiredPoints)
            .FirstOrDefaultAsync();

        var recentProgress = await _context.UserProgresses
            .Where(up => up.UserId == userId)
            .OrderByDescending(up => up.CompletedAt)
            .Take(6)
            .Include(up => up.Quiz)
            .ThenInclude(q => q.Attraction)
            .ToListAsync();

        var levelInfo = CalculateLevel(user.TotalPoints);
        var activityStats = await _context.UserActivityStats
            .FirstOrDefaultAsync(s => s.UserId == userId) ?? new UserActivityStats { UserId = userId };
        var roleName = user.Role?.Name ?? "User";
        var activityPoints = 0;

        if (roleName == "Promoter")
        {
            activityPoints += activityStats.AttractionsCreated * 60;
            activityPoints += activityStats.AttractionsUpdated * 25;
            activityPoints += activityStats.QuizzesCreated * 45;
            activityPoints += activityStats.QuizzesUpdated * 20;
            activityPoints += activityStats.SuggestionsSubmitted * 10;
            activityPoints += activityStats.SuggestionsApproved * 20;
        }
        else if (roleName == "Administrator")
        {
            activityPoints += activityStats.AttractionsCreated * 35;
            activityPoints += activityStats.AttractionsUpdated * 15;
            activityPoints += activityStats.QuizzesCreated * 25;
            activityPoints += activityStats.QuizzesUpdated * 10;
            activityPoints += activityStats.SuggestionsApproved * 10;
        }
        var nextBadgeInfo = nextBadge == null ? null : new
        {
            nextBadge.Id,
            nextBadge.Name,
            nextBadge.Description,
            nextBadge.IconUrl,
            nextBadge.RequiredPoints,
            PointsRemaining = Math.Max(0, nextBadge.RequiredPoints - user.TotalPoints)
        };

        return new
        {
            user.Id,
            user.Username,
            user.Email,
            user.TotalPoints,
            user.MonthlyPoints,
            ActivityPoints = activityPoints,
            Role = user.Role?.Name ?? "User",
            Level = levelInfo.Level,
            LevelName = levelInfo.Name,
            LevelProgress = levelInfo.Progress,
            PointsToNextLevel = levelInfo.PointsToNextLevel,
            QuizzesCompleted = quizzesCompleted,
            ActivityStats = new
            {
                activityStats.AttractionsCreated,
                activityStats.AttractionsUpdated,
                activityStats.QuizzesCreated,
                activityStats.QuizzesUpdated,
                activityStats.SuggestionsSubmitted,
                activityStats.SuggestionsApproved
            },
            Badges = badges.Select(b => new
            {
                b.Badge.Id,
                b.Badge.Name,
                b.Badge.Description,
                b.Badge.IconUrl,
                UnlockedAt = b.UnlockedAt
            }),
            NextBadge = nextBadgeInfo,
            RecentProgress = recentProgress.Select(p => new
            {
                Title = p.Quiz.Title,
                Name = p.Quiz.Attraction.Name,
                PointsEarned = p.PointsEarned,
                CorrectAnswers = p.CorrectAnswers,
                TotalQuestions = p.TotalQuestions,
                CompletedAt = p.CompletedAt
            }).ToList()
        };
    }

    public async Task<bool> UpdateUserProfileAsync(int userId, string username, string email)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        bool hasChanges = false;

        // Update username if provided and different
        if (!string.IsNullOrWhiteSpace(username) && username != user.Username)
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username && u.Id != userId);
            if (existingUser != null) return false; // Username already taken
            user.Username = username;
            hasChanges = true;
        }

        // Update email if provided and different
        if (!string.IsNullOrWhiteSpace(email) && email != user.Email)
        {
            var existingEmail = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email && u.Id != userId);
            if (existingEmail != null) return false; // Email already taken
            user.Email = email;
            hasChanges = true;
        }

        if (hasChanges)
        {
            await _context.SaveChangesAsync();
        }
        return true;
    }

    public async Task<string?> GetInviteCodeAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        // Dacă user-ul nu are cod, generează unul
        if (string.IsNullOrWhiteSpace(user.InviteCode))
        {
            user.InviteCode = GenerateInviteCode();
            await _context.SaveChangesAsync();
        }

        return user.InviteCode;
    }

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Range(0, 8)
            .Select(_ => chars[random.Next(chars.Length)])
            .ToArray());
    }

    public async Task CheckAndUnlockBadgesAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        var allBadges = await _context.Badges.ToListAsync();
        var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Id == user.RoleId);
        var isPromoter = userRole?.Name == "Promoter";
        var isAdmin = userRole?.Name == "Administrator";
        var activityStats = await _context.UserActivityStats
            .FirstOrDefaultAsync(s => s.UserId == userId) ?? new UserActivityStats { UserId = userId };

        foreach (var badge in allBadges)
        {
            var alreadyUnlocked = await _context.UserBadges
                .AnyAsync(ub => ub.UserId == userId && ub.BadgeId == badge.Id);

            if (alreadyUnlocked) continue;

            if (string.IsNullOrWhiteSpace(badge.Criteria))
            {
                continue;
            }

            var criteria = System.Text.Json.JsonDocument.Parse(badge.Criteria);
            bool shouldUnlock = true;

            if (criteria.RootElement.TryGetProperty("type", out var typeProperty))
            {
                var typeValue = typeProperty.GetString();
                if (typeValue == "promoter" && !isPromoter)
                    shouldUnlock = false;
                if (typeValue == "admin" && !isAdmin)
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("totalPoints", out var pointsReq))
            {
                if (user.TotalPoints < pointsReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("quizzesCompleted", out var quizzesReq))
            {
                var completed = await _context.UserProgresses
                    .Where(up => up.UserId == userId && up.IsCompleted)
                    .CountAsync();
                
                if (completed < quizzesReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("approvedSuggestions", out var suggestionsReq))
            {
                if (!isPromoter)
                {
                    shouldUnlock = false;
                }
                else
                {
                    var approved = await _context.AttractionSuggestions
                        .Where(s => s.PromoterId == userId && s.Status == Models.SuggestionStatus.Approved)
                        .CountAsync();

                    if (approved < suggestionsReq.GetInt32())
                        shouldUnlock = false;
                }
            }

            if (criteria.RootElement.TryGetProperty("attractionsCreated", out var attractionsCreatedReq))
            {
                if (activityStats.AttractionsCreated < attractionsCreatedReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("attractionsUpdated", out var attractionsUpdatedReq))
            {
                if (activityStats.AttractionsUpdated < attractionsUpdatedReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("quizzesCreated", out var quizzesCreatedReq))
            {
                if (activityStats.QuizzesCreated < quizzesCreatedReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("quizzesUpdated", out var quizzesUpdatedReq))
            {
                if (activityStats.QuizzesUpdated < quizzesUpdatedReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("attractionsVisited", out var attractionsReq))
            {
                var visited = await _context.UserAttractionVisits
                    .Where(v => v.UserId == userId)
                    .Select(v => v.AttractionId)
                    .Distinct()
                    .CountAsync();

                if (visited < attractionsReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("favoritesSaved", out var favoritesReq))
            {
                var favorites = await _context.UserFavorites
                    .Where(f => f.UserId == userId)
                    .CountAsync();

                if (favorites < favoritesReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("friendsAdded", out var friendsReq))
            {
                var friendsCount = await _context.Friendships
                    .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) &&
                           f.Status == Models.FriendshipStatus.Accepted)
                    .CountAsync();

                if (friendsCount < friendsReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("friendsInvited", out var invitedReq))
            {
                var invitedCount = await _context.Users
                    .Where(u => u.InvitedByUserId == userId)
                    .CountAsync();

                if (invitedCount < invitedReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("challengesCompleted", out var challengesReq))
            {
                var completedChallenges = await _context.UserChallenges
                    .Where(uc => uc.UserId == userId && uc.IsCompleted)
                    .CountAsync();

                if (completedChallenges < challengesReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("topContributor", out var topContributorReq) &&
                topContributorReq.GetBoolean())
            {
                // Placeholder: requires monthly leaderboard logic
                shouldUnlock = false;
            }

            if (shouldUnlock)
            {
                _context.UserBadges.Add(new UserBadge
                {
                    UserId = userId,
                    BadgeId = badge.Id,
                    UnlockedAt = DateTime.UtcNow
                });
                
                // Track challenge progress pentru EarnBadges
                await _challengeProgress.TrackBadgeEarnedAsync(userId);
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(int take = 50, bool monthly = false)
    {
        var cappedTake = Math.Clamp(take, 1, 100);
        
        if (monthly)
        {
            return await GetMonthlyLeaderboardAsync(cappedTake);
        }

        var topUsers = await _context.Users
            .OrderByDescending(u => u.TotalPoints)
            .ThenBy(u => u.CreatedAt)
            .Take(cappedTake)
            .Select(u => new { u.Id, u.Username, u.TotalPoints, u.MonthlyPoints, u.CreatedAt })
            .ToListAsync();

        if (topUsers.Count == 0)
        {
            return Array.Empty<LeaderboardEntryDto>();
        }

        var userIds = topUsers.Select(u => u.Id).ToList();

        var completionLookup = await _context.UserProgresses
            .Where(up => userIds.Contains(up.UserId) && up.IsCompleted)
            .GroupBy(up => up.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Count = g.Count(),
                LastCompletedAt = g.Max(x => x.CompletedAt)
            })
            .ToDictionaryAsync(x => x.UserId, x => (x.Count, x.LastCompletedAt));

        var leaderboard = new List<LeaderboardEntryDto>(topUsers.Count);

        for (var index = 0; index < topUsers.Count; index++)
        {
            var user = topUsers[index];
            var levelInfo = CalculateLevel(user.TotalPoints);
            completionLookup.TryGetValue(user.Id, out var progressSnapshot);

            leaderboard.Add(new LeaderboardEntryDto
            {
                UserId = user.Id,
                Username = user.Username,
                TotalPoints = user.TotalPoints,
                MonthlyPoints = user.MonthlyPoints,
                Level = levelInfo.Level,
                LevelName = levelInfo.Name,
                LevelProgress = levelInfo.Progress,
                PointsToNextLevel = levelInfo.PointsToNextLevel,
                Rank = index + 1,
                QuizzesCompleted = progressSnapshot.Count,
                LastCompletedAt = progressSnapshot.LastCompletedAt,
                JoinedAt = user.CreatedAt,
                IsMonthly = false
            });
        }

        return leaderboard;
    }

    public async Task<(IReadOnlyList<LeaderboardEntryDto> Items, int Total)> GetLeaderboardPagedAsync(bool monthly, int page, int pageSize, string? sortBy, string? order)
    {
        var normalized = NormalizeLeaderboardSort(monthly, sortBy, order);
        var (snapshots, total) = await FetchLeaderboardSnapshotsAsync(_context.Users.AsNoTracking(), monthly, page, pageSize, normalized.SortBy, normalized.Desc);
        var items = await BuildLeaderboardEntriesAsync(snapshots, monthly, page, pageSize);
        return (items, total);
    }

    public async Task<(IReadOnlyList<LeaderboardEntryDto> Items, int Total)> GetFriendsLeaderboardPagedAsync(int userId, bool monthly, int page, int pageSize, string? sortBy, string? order)
    {
        var friendIds = await _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == userId || f.AddresseeId == userId))
            .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
            .ToListAsync();

        if (!friendIds.Contains(userId))
        {
            friendIds.Add(userId);
        }

        var normalized = NormalizeLeaderboardSort(monthly, sortBy, order);
        var scopedUsers = _context.Users.AsNoTracking().Where(u => friendIds.Contains(u.Id));
        var (snapshots, total) = await FetchLeaderboardSnapshotsAsync(scopedUsers, monthly, page, pageSize, normalized.SortBy, normalized.Desc);
        var items = await BuildLeaderboardEntriesAsync(snapshots, monthly, page, pageSize);
        return (items, total);
    }

    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetFriendsLeaderboardAsync(int userId, bool monthly)
    {
        var friendIds = await _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == userId || f.AddresseeId == userId))
            .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
            .ToListAsync();

        if (!friendIds.Contains(userId))
        {
            friendIds.Add(userId);
        }

        var users = await _context.Users
            .AsNoTracking()
            .Where(u => friendIds.Contains(u.Id))
            .OrderByDescending(u => monthly ? u.MonthlyPoints : u.TotalPoints)
            .ThenBy(u => u.CreatedAt)
            .ToListAsync();

        if (users.Count == 0)
        {
            return Array.Empty<LeaderboardEntryDto>();
        }

        var userIds = users.Select(u => u.Id).ToList();

        var completionLookup = await _context.UserProgresses
            .Where(up => userIds.Contains(up.UserId) && up.IsCompleted)
            .GroupBy(up => up.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Count = g.Count(),
                LastCompletedAt = g.Max(x => x.CompletedAt)
            })
            .ToDictionaryAsync(x => x.UserId, x => (x.Count, x.LastCompletedAt));

        var leaderboard = new List<LeaderboardEntryDto>(users.Count);

        for (var index = 0; index < users.Count; index++)
        {
            var user = users[index];
            var levelInfo = CalculateLevel(user.TotalPoints);
            completionLookup.TryGetValue(user.Id, out var progressSnapshot);

            leaderboard.Add(new LeaderboardEntryDto
            {
                UserId = user.Id,
                Username = user.Username,
                TotalPoints = user.TotalPoints,
                MonthlyPoints = user.MonthlyPoints,
                Level = levelInfo.Level,
                LevelName = levelInfo.Name,
                LevelProgress = levelInfo.Progress,
                PointsToNextLevel = levelInfo.PointsToNextLevel,
                Rank = index + 1,
                QuizzesCompleted = progressSnapshot.Count,
                LastCompletedAt = progressSnapshot.LastCompletedAt,
                JoinedAt = user.CreatedAt,
                IsMonthly = monthly
            });
        }

        return leaderboard;
    }

    public async Task<LeaderboardEntryDto?> GetUserLeaderboardEntryAsync(int userId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        var rank = await _context.Users.CountAsync(u =>
            u.TotalPoints > user.TotalPoints ||
            (u.TotalPoints == user.TotalPoints && u.CreatedAt < user.CreatedAt)) + 1;

        var quizzesCompleted = await _context.UserProgresses
            .Where(up => up.UserId == userId && up.IsCompleted)
            .CountAsync();

        var lastCompletedAt = await _context.UserProgresses
            .Where(up => up.UserId == userId && up.IsCompleted)
            .OrderByDescending(up => up.CompletedAt)
            .Select(up => up.CompletedAt)
            .FirstOrDefaultAsync();

        var levelInfo = CalculateLevel(user.TotalPoints);

        return new LeaderboardEntryDto
        {
            UserId = user.Id,
            Username = user.Username,
            TotalPoints = user.TotalPoints,
            MonthlyPoints = user.MonthlyPoints,
            Level = levelInfo.Level,
            LevelName = levelInfo.Name,
            LevelProgress = levelInfo.Progress,
            PointsToNextLevel = levelInfo.PointsToNextLevel,
            Rank = rank,
            QuizzesCompleted = quizzesCompleted,
            LastCompletedAt = lastCompletedAt,
            JoinedAt = user.CreatedAt,
            IsMonthly = false
        };
    }

    private static (string SortBy, bool Desc) NormalizeLeaderboardSort(bool monthly, string? sortBy, string? order)
    {
        var normalizedSort = string.IsNullOrWhiteSpace(sortBy)
            ? (monthly ? "monthlyPoints" : "totalPoints")
            : sortBy.Trim().ToLowerInvariant();

        var desc = string.IsNullOrWhiteSpace(order) || order.Trim().Equals("desc", StringComparison.OrdinalIgnoreCase);

        return normalizedSort switch
        {
            "monthlypoints" => ("monthlyPoints", desc),
            "totalpoints" => ("totalPoints", desc),
            "quizzescompleted" => ("quizzesCompleted", desc),
            "joinedat" => ("joinedAt", desc),
            _ => (monthly ? "monthlyPoints" : "totalPoints", desc)
        };
    }

    private async Task<(List<LeaderboardUserSnapshot> Items, int Total)> FetchLeaderboardSnapshotsAsync(
        IQueryable<User> usersQuery,
        bool monthly,
        int page,
        int pageSize,
        string sortBy,
        bool desc)
    {
        var currentPage = Math.Max(1, page);
        var size = Math.Clamp(pageSize, 5, 100);
        var total = await usersQuery.CountAsync();

        if (total == 0)
        {
            return (new List<LeaderboardUserSnapshot>(), 0);
        }

        if (sortBy == "quizzesCompleted")
        {
            var baseUsers = await usersQuery
                .Select(u => new LeaderboardUserSnapshot
                {
                    Id = u.Id,
                    Username = u.Username,
                    TotalPoints = u.TotalPoints,
                    MonthlyPoints = u.MonthlyPoints,
                    CreatedAt = u.CreatedAt,
                    QuizzesCompleted = 0
                })
                .ToListAsync();

            var counts = await _context.UserProgresses
                .Where(up => up.IsCompleted)
                .GroupBy(up => up.UserId)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.Count);

            foreach (var user in baseUsers)
            {
                if (counts.TryGetValue(user.Id, out var count))
                {
                    user.QuizzesCompleted = count;
                }
            }

            var ordered = desc
                ? baseUsers.OrderByDescending(x => x.QuizzesCompleted).ThenBy(x => x.CreatedAt)
                : baseUsers.OrderBy(x => x.QuizzesCompleted).ThenBy(x => x.CreatedAt);

            var items = ordered
                .Skip((currentPage - 1) * size)
                .Take(size)
                .ToList();

            return (items, total);
        }

        var orderedUsers = sortBy switch
        {
            "monthlyPoints" => desc
                ? usersQuery.OrderByDescending(u => u.MonthlyPoints).ThenBy(u => u.CreatedAt)
                : usersQuery.OrderBy(u => u.MonthlyPoints).ThenBy(u => u.CreatedAt),
            "joinedAt" => desc
                ? usersQuery.OrderByDescending(u => u.CreatedAt).ThenByDescending(u => u.TotalPoints)
                : usersQuery.OrderBy(u => u.CreatedAt).ThenByDescending(u => u.TotalPoints),
            _ => desc
                ? usersQuery.OrderByDescending(u => u.TotalPoints).ThenBy(u => u.CreatedAt)
                : usersQuery.OrderBy(u => u.TotalPoints).ThenBy(u => u.CreatedAt)
        };

        var results = await orderedUsers
            .Skip((currentPage - 1) * size)
            .Take(size)
            .Select(u => new LeaderboardUserSnapshot
            {
                Id = u.Id,
                Username = u.Username,
                TotalPoints = u.TotalPoints,
                MonthlyPoints = u.MonthlyPoints,
                CreatedAt = u.CreatedAt,
                QuizzesCompleted = 0
            })
            .ToListAsync();

        return (results, total);
    }

    private async Task<List<LeaderboardEntryDto>> BuildLeaderboardEntriesAsync(
        List<LeaderboardUserSnapshot> snapshots,
        bool monthly,
        int page,
        int pageSize)
    {
        if (snapshots.Count == 0)
        {
            return new List<LeaderboardEntryDto>();
        }

        var userIds = snapshots.Select(s => s.Id).ToList();

        var completionLookup = await _context.UserProgresses
            .Where(up => userIds.Contains(up.UserId) && up.IsCompleted)
            .GroupBy(up => up.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Count = g.Count(),
                LastCompletedAt = g.Max(x => x.CompletedAt)
            })
            .ToDictionaryAsync(x => x.UserId, x => (x.Count, x.LastCompletedAt));

        var leaderboard = new List<LeaderboardEntryDto>(snapshots.Count);
        var baseRank = (Math.Max(1, page) - 1) * Math.Clamp(pageSize, 5, 100);

        for (var index = 0; index < snapshots.Count; index++)
        {
            var user = snapshots[index];
            var levelInfo = CalculateLevel(user.TotalPoints);
            completionLookup.TryGetValue(user.Id, out var progressSnapshot);

            var quizCount = progressSnapshot.Count;
            if (user.QuizzesCompleted > 0)
            {
                quizCount = user.QuizzesCompleted;
            }

            leaderboard.Add(new LeaderboardEntryDto
            {
                UserId = user.Id,
                Username = user.Username,
                TotalPoints = user.TotalPoints,
                MonthlyPoints = user.MonthlyPoints,
                Level = levelInfo.Level,
                LevelName = levelInfo.Name,
                LevelProgress = levelInfo.Progress,
                PointsToNextLevel = levelInfo.PointsToNextLevel,
                Rank = baseRank + index + 1,
                QuizzesCompleted = quizCount,
                LastCompletedAt = progressSnapshot.LastCompletedAt,
                JoinedAt = user.CreatedAt,
                IsMonthly = monthly
            });
        }

        return leaderboard;
    }

    private sealed class LeaderboardUserSnapshot
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public int MonthlyPoints { get; set; }
        public DateTime CreatedAt { get; set; }
        public int QuizzesCompleted { get; set; }
    }

    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetMonthlyLeaderboardAsync(int take = 50)
    {
        var cappedTake = Math.Clamp(take, 1, 100);

        var topUsers = await _context.Users
            .OrderByDescending(u => u.MonthlyPoints)
            .ThenBy(u => u.CreatedAt)
            .Take(cappedTake)
            .Select(u => new { u.Id, u.Username, u.TotalPoints, u.MonthlyPoints, u.CreatedAt })
            .ToListAsync();

        if (topUsers.Count == 0)
        {
            return Array.Empty<LeaderboardEntryDto>();
        }

        var userIds = topUsers.Select(u => u.Id).ToList();

        var completionLookup = await _context.UserProgresses
            .Where(up => userIds.Contains(up.UserId) && up.IsCompleted)
            .GroupBy(up => up.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Count = g.Count(),
                LastCompletedAt = g.Max(x => x.CompletedAt)
            })
            .ToDictionaryAsync(x => x.UserId, x => (x.Count, x.LastCompletedAt));

        var leaderboard = new List<LeaderboardEntryDto>(topUsers.Count);

        for (var index = 0; index < topUsers.Count; index++)
        {
            var user = topUsers[index];
            var levelInfo = CalculateLevel(user.TotalPoints);
            completionLookup.TryGetValue(user.Id, out var progressSnapshot);

            leaderboard.Add(new LeaderboardEntryDto
            {
                UserId = user.Id,
                Username = user.Username,
                TotalPoints = user.TotalPoints,
                MonthlyPoints = user.MonthlyPoints,
                Level = levelInfo.Level,
                LevelName = levelInfo.Name,
                LevelProgress = levelInfo.Progress,
                PointsToNextLevel = levelInfo.PointsToNextLevel,
                Rank = index + 1,
                QuizzesCompleted = progressSnapshot.Count,
                LastCompletedAt = progressSnapshot.LastCompletedAt,
                JoinedAt = user.CreatedAt,
                IsMonthly = true
            });
        }

        return leaderboard;
    }

    public async Task ResetMonthlyLeaderboardAsync()
    {
        var currentDate = DateTime.UtcNow;
        var currentSeason = currentDate.Year * 100 + currentDate.Month;
        var nextSeason = currentDate.Month == 12 
            ? (currentDate.Year + 1) * 100 + 1 
            : currentDate.Year * 100 + (currentDate.Month + 1);

        var allUsers = await _context.Users.ToListAsync();

        foreach (var user in allUsers)
        {
            if (user.MonthlyPoints > 0)
            {
                // Salvează în archive
                _context.LeaderboardArchives.Add(new LeaderboardArchive
                {
                    UserId = user.Id,
                    SeasonId = currentSeason,
                    MonthlyPoints = user.MonthlyPoints,
                    Rank = 0, // Se va calcula după
                    SeasonStart = new DateTime(currentDate.Year, currentDate.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                    SeasonEnd = new DateTime(currentDate.Year, currentDate.Month, DateTime.DaysInMonth(currentDate.Year, currentDate.Month), 23, 59, 59, DateTimeKind.Utc)
                });

                // Resetează lunar points
                user.MonthlyPoints = 0;
            }

            user.CurrentSeasonId = nextSeason;
            user.LastResetDate = currentDate;
        }

        await _context.SaveChangesAsync();
    }

    private static LevelInfo CalculateLevel(int totalPoints)
    {
        const int pointsPerLevel = 250;
        var level = Math.Max(1, (totalPoints / pointsPerLevel) + 1);
        var currentLevelFloor = (level - 1) * pointsPerLevel;
        var progressPoints = totalPoints - currentLevelFloor;
        var progress = pointsPerLevel == 0 ? 0 : Math.Clamp((double)progressPoints / pointsPerLevel, 0, 1);
        var nextLevelTarget = currentLevelFloor + pointsPerLevel;

        return new LevelInfo
        {
            Level = level,
            Name = level switch
            {
                1 => "Începător",
                2 => "Explorer",
                3 => "Călător",
                4 => "Legendă",
                _ => "Maestru"
            },
            Progress = Math.Round(progress, 3),
            PointsToNextLevel = Math.Max(0, nextLevelTarget - totalPoints)
        };
    }

    public async Task<dynamic> GetBadgeProgressAsync(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        // Ensure eligible badges are unlocked before computing progress
        await CheckAndUnlockBadgesAsync(userId);

        // Get all badges
        var allBadges = await _context.Badges.ToListAsync();
        
        // Get user's role info
        var userRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Id == user.RoleId);
        bool isPromoter = userRole?.Name == "Promoter";
        bool isAdmin = userRole?.Name == "Administrator";
        var activityStats = await _context.UserActivityStats
            .FirstOrDefaultAsync(s => s.UserId == userId) ?? new UserActivityStats { UserId = userId };
        
        // Get user's unlocked badges
        var unlockedBadges = await _context.UserBadges
            .Where(ub => ub.UserId == userId)
            .Select(ub => ub.BadgeId)
            .ToListAsync();

        var quizzesCompleted = await _context.UserProgresses
            .Where(up => up.UserId == userId && up.IsCompleted)
            .CountAsync();

        var badgeProgress = new List<dynamic>();

        foreach (var badge in allBadges)
        {
            var isUnlocked = unlockedBadges.Contains(badge.Id);
            
            try
            {
                var options = System.Text.Json.JsonSerializerOptions.Default;
                var criteria = System.Text.Json.JsonDocument.Parse(badge.Criteria);
                
                // Skip promoter badges if user is not a promoter
                if (criteria.RootElement.TryGetProperty("type", out var typeProperty))
                {
                    var typeValue = typeProperty.GetString();
                    if (typeValue == "promoter" && !isPromoter)
                        continue;
                    if (typeValue == "admin" && !isAdmin)
                        continue;
                }
                
                int currentProgress = 0;
                int requiredProgress = 0;
                string progressLabel = "";

                // Handle points requirement
                if (criteria.RootElement.TryGetProperty("totalPoints", out var pointsReq))
                {
                    requiredProgress = pointsReq.GetInt32();
                    currentProgress = user.TotalPoints;
                    progressLabel = "puncte";
                }
                // Handle quizzes requirement
                else if (criteria.RootElement.TryGetProperty("quizzesCompleted", out var quizzesReq))
                {
                    requiredProgress = quizzesReq.GetInt32();
                    currentProgress = quizzesCompleted;
                    progressLabel = "quiz-uri";
                }
                // Handle promoter approved suggestions
                else if (criteria.RootElement.TryGetProperty("approvedSuggestions", out var suggestionsReq))
                {
                    requiredProgress = suggestionsReq.GetInt32();
                    
                    if (isPromoter)
                    {
                        currentProgress = await _context.AttractionSuggestions
                            .Where(s => s.PromoterId == userId && 
                                   s.Status == Models.SuggestionStatus.Approved)
                            .CountAsync();
                    }
                    progressLabel = "sugestii aprobate";
                }
                else if (criteria.RootElement.TryGetProperty("attractionsCreated", out var attractionsCreatedReq))
                {
                    requiredProgress = attractionsCreatedReq.GetInt32();
                    currentProgress = activityStats.AttractionsCreated;
                    progressLabel = "atracții adăugate";
                }
                else if (criteria.RootElement.TryGetProperty("attractionsUpdated", out var attractionsUpdatedReq))
                {
                    requiredProgress = attractionsUpdatedReq.GetInt32();
                    currentProgress = activityStats.AttractionsUpdated;
                    progressLabel = "atracții actualizate";
                }
                else if (criteria.RootElement.TryGetProperty("quizzesCreated", out var quizzesCreatedReq))
                {
                    requiredProgress = quizzesCreatedReq.GetInt32();
                    currentProgress = activityStats.QuizzesCreated;
                    progressLabel = "quiz-uri create";
                }
                else if (criteria.RootElement.TryGetProperty("quizzesUpdated", out var quizzesUpdatedReq))
                {
                    requiredProgress = quizzesUpdatedReq.GetInt32();
                    currentProgress = activityStats.QuizzesUpdated;
                    progressLabel = "quiz-uri editate";
                }
                // Handle top contributor (monthly) placeholder
                else if (criteria.RootElement.TryGetProperty("topContributor", out var topContributorReq) &&
                         topContributorReq.GetBoolean())
                {
                    // Not implemented yet; prevent 0 remaining for locked badge
                    requiredProgress = 1;
                    currentProgress = 0;
                    progressLabel = "lună";
                }
                // Handle attractions visited
                else if (criteria.RootElement.TryGetProperty("attractionsVisited", out var attractionsReq))
                {
                    requiredProgress = attractionsReq.GetInt32();
                    currentProgress = await _context.UserAttractionVisits
                        .Where(v => v.UserId == userId)
                        .Select(v => v.AttractionId)
                        .Distinct()
                        .CountAsync();
                    progressLabel = "locuri vizitate";
                }
                // Handle favorites saved
                else if (criteria.RootElement.TryGetProperty("favoritesSaved", out var favoritesReq))
                {
                    requiredProgress = favoritesReq.GetInt32();
                    currentProgress = await _context.UserFavorites
                        .Where(f => f.UserId == userId)
                        .CountAsync();
                    progressLabel = "favorite salvate";
                }
                // Handle friends added
                else if (criteria.RootElement.TryGetProperty("friendsAdded", out var friendsReq))
                {
                    requiredProgress = friendsReq.GetInt32();
                    currentProgress = await _context.Friendships
                        .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && 
                               f.Status == Models.FriendshipStatus.Accepted)
                        .CountAsync();
                    progressLabel = "prieteni";
                }
                // Handle friends invited
                else if (criteria.RootElement.TryGetProperty("friendsInvited", out var invitedReq))
                {
                    requiredProgress = invitedReq.GetInt32();
                    // Count unique users invited via invite code
                    currentProgress = await _context.Users
                        .Where(u => u.InvitedByUserId == userId)
                        .CountAsync();
                    progressLabel = "prieteni invitați";
                }
                // Handle challenges completed
                else if (criteria.RootElement.TryGetProperty("challengesCompleted", out var challengesReq))
                {
                    requiredProgress = challengesReq.GetInt32();
                    currentProgress = await _context.UserChallenges
                        .Where(uc => uc.UserId == userId && uc.IsCompleted)
                        .CountAsync();
                    progressLabel = "provocări";
                }

                double percentage = requiredProgress > 0 
                    ? Math.Min(100, Math.Round((double)currentProgress / requiredProgress * 100, 1))
                    : 0;

                badgeProgress.Add(new
                {
                    badge.Id,
                    badge.Name,
                    badge.Description,
                    badge.IconUrl,
                    IsUnlocked = isUnlocked,
                    CurrentProgress = currentProgress,
                    RequiredProgress = requiredProgress,
                    Percentage = percentage,
                    ProgressLabel = progressLabel,
                    RemainingToUnlock = Math.Max(0, requiredProgress - currentProgress)
                });
            }
            catch
            {
                // Skip badges with invalid criteria
            }
        }

        return new
        {
            UserId = userId,
            Username = user.Username,
            TotalPoints = user.TotalPoints,
            QuizzesCompleted = quizzesCompleted,
            TotalBadges = badgeProgress.Count,
            UnlockedCount = unlockedBadges.Count(ubId => badgeProgress.Select(b => (int)b.Id).Contains(ubId)),
            Badges = badgeProgress
        };
    }

    private sealed class LevelInfo
    {
        public int Level { get; init; }
        public string Name { get; init; } = string.Empty;
        public double Progress { get; init; }
        public int PointsToNextLevel { get; init; }
    }
}
