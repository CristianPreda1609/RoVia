using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.Models;
using RoVia.API.Services;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VisitsController : ControllerBase
{
    private readonly ChallengeProgressService _challengeProgress;
    private readonly AppDbContext _context;

    public VisitsController(ChallengeProgressService challengeProgress, AppDbContext context)
    {
        _challengeProgress = challengeProgress;
        _context = context;
    }

    [HttpPost("{attractionId}")]
    public async Task<IActionResult> TrackVisit(int attractionId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Get active challenge IDs
        var today = DateTime.UtcNow.Date;
        var weekStart = GetWeekStart(today);
        
        var dailyChallenge = await _context.Challenges
            .Where(c => c.Kind == ChallengeKind.Daily && c.StartDate == today)
            .Select(c => c.Id)
            .FirstOrDefaultAsync();
            
        var weeklyChallenge = await _context.Challenges
            .Where(c => c.Kind == ChallengeKind.Weekly && c.StartDate == weekStart)
            .Select(c => c.Id)
            .FirstOrDefaultAsync();

        // Verifică dacă a vizitat deja pentru challenge-ul activ
        var alreadyVisited = await _context.UserAttractionVisits
            .AnyAsync(v => v.UserId == userId && v.AttractionId == attractionId && 
                          (v.DailyChallengeId == dailyChallenge || v.WeeklyChallengeId == weeklyChallenge));

        if (alreadyVisited)
        {
            return Ok(new { message = "Already tracked for current challenge" });
        }

        // Track visit linked to active challenges
        _context.UserAttractionVisits.Add(new UserAttractionVisit
        {
            UserId = userId,
            AttractionId = attractionId,
            DailyChallengeId = dailyChallenge,
            WeeklyChallengeId = weeklyChallenge
        });
        await _context.SaveChangesAsync();

        // Track challenge progress
        await _challengeProgress.TrackAttractionVisitAsync(userId, attractionId);

        return Ok(new { message = "Visit tracked" });
    }

    private static DateTime GetWeekStart(DateTime date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-1 * diff).Date;
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetTodayVisits()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Ok(new List<int>());
        }

        // Get today's active daily challenge
        var today = DateTime.UtcNow.Date;
        var dailyChallenge = await _context.Challenges
            .Where(c => c.Kind == ChallengeKind.Daily && c.StartDate == today)
            .Select(c => c.Id)
            .FirstOrDefaultAsync();

        // Only return visits for the current daily challenge
        var visits = await _context.UserAttractionVisits
            .Where(v => v.UserId == userId && v.DailyChallengeId == dailyChallenge)
            .Select(v => v.AttractionId)
            .ToListAsync();

        return Ok(visits);
    }
}
