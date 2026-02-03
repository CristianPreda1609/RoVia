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
            Role = user.Role?.Name ?? "User",
            Level = levelInfo.Level,
            LevelName = levelInfo.Name,
            LevelProgress = levelInfo.Progress,
            PointsToNextLevel = levelInfo.PointsToNextLevel,
            QuizzesCompleted = quizzesCompleted,
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

    public async Task CheckAndUnlockBadgesAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        var allBadges = await _context.Badges.ToListAsync();

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

    private sealed class LevelInfo
    {
        public int Level { get; init; }
        public string Name { get; init; } = string.Empty;
        public double Progress { get; init; }
        public int PointsToNextLevel { get; init; }
    }
}
