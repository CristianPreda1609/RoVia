using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.Models;

namespace RoVia.API.Services;

public class ChallengeProgressService
{
    private readonly AppDbContext _context;

    public ChallengeProgressService(AppDbContext context)
    {
        _context = context;
    }

    public async Task IncrementProgressAsync(int userId, ChallengeType type, int amount = 1)
    {
        var activeChallenges = await _context.UserChallenges
            .Include(uc => uc.Challenge)
            .Where(uc => uc.UserId == userId && uc.Type == type && !uc.IsCompleted)
            .ToListAsync();

        foreach (var userChallenge in activeChallenges)
        {
            userChallenge.Progress += amount;

            // Verifică dacă a fost completată
            if (userChallenge.Progress >= userChallenge.Target && !userChallenge.IsCompleted)
            {
                userChallenge.IsCompleted = true;
                userChallenge.CompletedAt = DateTime.UtcNow;

                // Award XP
                await AwardXpAsync(userId, userChallenge.Challenge.RewardXp);
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task TrackAttractionVisitAsync(int userId, int attractionId)
    {
        // Incrementează progress pentru VisitAttractions challenges
        await IncrementProgressAsync(userId, ChallengeType.VisitAttractions);

        // Track pentru ExploreRegions dacă e regiune nouă
        var attraction = await _context.Attractions.FindAsync(attractionId);
        if (attraction != null)
        {
            var today = DateTime.UtcNow.Date;
            
            // Obține toate regiunile vizitate astăzi
            var visitedRegionsToday = await _context.UserAttractionVisits
                .Where(v => v.UserId == userId && v.VisitedAt >= today)
                .Include(v => v.Attraction)
                .Select(v => v.Attraction.Region)
                .Distinct()
                .ToListAsync();

            // Dacă această regiune NU a fost vizitată astăzi, incrementează ExploreRegions
            if (!visitedRegionsToday.Contains(attraction.Region))
            {
                await IncrementProgressAsync(userId, ChallengeType.ExploreRegions);
            }
        }
    }

    public async Task TrackQuizCompletionAsync(int userId)
    {
        await IncrementProgressAsync(userId, ChallengeType.CompleteQuiz);
    }

    public async Task TrackFavoriteSaveAsync(int userId)
    {
        await IncrementProgressAsync(userId, ChallengeType.SaveFavorites);
    }

    public async Task TrackBadgeEarnedAsync(int userId)
    {
        await IncrementProgressAsync(userId, ChallengeType.EarnBadges);
    }

    public async Task TrackFriendInviteAsync(int userId)
    {
        await IncrementProgressAsync(userId, ChallengeType.InviteFriends);
    }

    private async Task AwardXpAsync(int userId, int xpAmount)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return;

        user.TotalPoints += xpAmount;
        user.MonthlyPoints += xpAmount;
        
        await _context.SaveChangesAsync();
    }
}
