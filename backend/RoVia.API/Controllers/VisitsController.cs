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

        // Verifică dacă a vizitat deja astăzi
        var today = DateTime.UtcNow.Date;
        var alreadyVisited = await _context.UserAttractionVisits
            .AnyAsync(v => v.UserId == userId && v.AttractionId == attractionId && v.VisitedAt >= today);

        if (alreadyVisited)
        {
            return Ok(new { message = "Already tracked today" });
        }

        // Track visit
        _context.UserAttractionVisits.Add(new UserAttractionVisit
        {
            UserId = userId,
            AttractionId = attractionId
        });
        await _context.SaveChangesAsync();

        // Track challenge progress
        await _challengeProgress.TrackAttractionVisitAsync(userId, attractionId);

        return Ok(new { message = "Visit tracked" });
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetTodayVisits()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Ok(new List<int>());
        }

        var today = DateTime.UtcNow.Date;
        var visits = await _context.UserAttractionVisits
            .Where(v => v.UserId == userId && v.VisitedAt >= today)
            .Select(v => v.AttractionId)
            .ToListAsync();

        return Ok(visits);
    }
}
