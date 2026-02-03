using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.Models;
using RoVia.API.Services;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavoritesController : ControllerBase
{
    private readonly ChallengeProgressService _challengeProgress;
    private readonly AppDbContext _context;

    public FavoritesController(ChallengeProgressService challengeProgress, AppDbContext context)
    {
        _challengeProgress = challengeProgress;
        _context = context;
    }

    [HttpPost("{attractionId}")]
    public async Task<IActionResult> ToggleFavorite(int attractionId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var existing = await _context.UserFavorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.AttractionId == attractionId);

        if (existing != null)
        {
            // Remove favorite
            _context.UserFavorites.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { isFavorite = false });
        }

        // Add favorite
        _context.UserFavorites.Add(new UserFavorite
        {
            UserId = userId,
            AttractionId = attractionId
        });
        await _context.SaveChangesAsync();

        // Track challenge progress
        await _challengeProgress.TrackFavoriteSaveAsync(userId);

        return Ok(new { isFavorite = true });
    }

    [HttpGet]
    public async Task<IActionResult> GetUserFavorites()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var favorites = await _context.UserFavorites
            .Where(f => f.UserId == userId)
            .Select(f => f.AttractionId)
            .ToListAsync();

        return Ok(favorites);
    }

    [HttpGet("check/{attractionId}")]
    public async Task<IActionResult> CheckFavorite(int attractionId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Ok(new { isFavorite = false });
        }

        var isFavorite = await _context.UserFavorites
            .AnyAsync(f => f.UserId == userId && f.AttractionId == attractionId);

        return Ok(new { isFavorite });
    }
}
