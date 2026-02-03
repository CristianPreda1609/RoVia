using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;
using RoVia.API.Services;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttractionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityPointsService _activityPoints;

    public AttractionsController(AppDbContext context, ActivityPointsService activityPoints)
    {
        _context = context;
        _activityPoints = activityPoints;
    }

    private int ResolveUserId()
    {
        var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(raw, out var id) ? id : 0;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AttractionDto>>> GetAttractions([FromQuery] AttractionFilterRequest filter)
    {
        var query = _context.Attractions
            .Where(a => a.IsApproved)
            .AsQueryable();

        if (filter.Type.HasValue)
            query = query.Where(a => a.Type == filter.Type.Value);

        if (!string.IsNullOrWhiteSpace(filter.Region))
        {
            var normalizedRegion = filter.Region.Trim().ToLower();
            query = query.Where(a => a.Region != null && a.Region.ToLower() == normalizedRegion);
        }

        if (filter.MinRating.HasValue)
            query = query.Where(a => a.Rating >= filter.MinRating.Value);

        var attractions = await query
            .Select(a => new AttractionDto
            {
                Id = a.Id,
                Name = a.Name,
                Description = a.Description,
                Latitude = a.Latitude,
                Longitude = a.Longitude,
                Type = a.Type,
                TypeName = a.Type.ToString(),
                Region = a.Region,
                ImageUrl = a.ImageUrl,
                Rating = a.Rating
            })
            .ToListAsync();

        return Ok(attractions);
    }

    [HttpGet("recommendations")]
    public async Task<ActionResult<IEnumerable<AttractionRecommendationDto>>> GetRecommendations([FromQuery] int take = 6)
    {
        var cappedTake = Math.Clamp(take, 1, 20);
        var userId = ResolveUserId();

        var isPromoter = false;
        var hasOwnAttractions = false;
        var isActivePromoter = false;

        if (userId > 0)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            isPromoter = user?.Role?.Name == "Promoter";
            if (isPromoter)
            {
                hasOwnAttractions = await _context.Attractions
                    .AnyAsync(a => a.IsApproved && a.CreatedByUserId == userId);

                var stats = await _context.UserActivityStats
                    .FirstOrDefaultAsync(s => s.UserId == userId);

                if (stats != null)
                {
                    var totalActivity = stats.AttractionsCreated + stats.AttractionsUpdated + stats.QuizzesCreated + stats.QuizzesUpdated;
                    isActivePromoter = totalActivity > 0;
                }
            }
        }

        var baseQuery = _context.Attractions
            .Where(a => a.IsApproved)
            .Select(a => new AttractionRecommendationDto
            {
                Id = a.Id,
                Name = a.Name,
                Description = a.Description,
                Region = a.Region,
                ImageUrl = a.ImageUrl,
                Rating = a.Rating,
                TypeName = a.Type.ToString(),
                CreatedAt = a.CreatedAt,
                IsPromoterHighlight = isPromoter && isActivePromoter && a.CreatedByUserId == userId,
                HighlightLabel = isPromoter && isActivePromoter && a.CreatedByUserId == userId ? "De la tine" : "Recomandare"
            });

        var recommendations = hasOwnAttractions
            ? await baseQuery
                .OrderByDescending(a => a.IsPromoterHighlight)
                .ThenByDescending(a => a.Rating)
                .ThenByDescending(a => a.CreatedAt)
                .Take(cappedTake)
                .ToListAsync()
            : await baseQuery
                .OrderByDescending(a => a.Rating)
                .ThenByDescending(a => a.CreatedAt)
                .Take(cappedTake)
                .ToListAsync();

        return Ok(recommendations);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AttractionDto>> GetAttraction(int id)
    {
        var attraction = await _context.Attractions
            .Where(a => a.Id == id && a.IsApproved)
            .Select(a => new AttractionDto
            {
                Id = a.Id,
                Name = a.Name,
                Description = a.Description,
                Latitude = a.Latitude,
                Longitude = a.Longitude,
                Type = a.Type,
                TypeName = a.Type.ToString(),
                Region = a.Region,
                ImageUrl = a.ImageUrl,
                Rating = a.Rating
            })
            .FirstOrDefaultAsync();

        if (attraction == null)
            return NotFound();

        return Ok(attraction);
    }

    [Authorize(Roles = "Administrator")]
    [HttpPost]
    public async Task<IActionResult> CreateAttraction([FromBody] AttractionUpsertRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var attraction = new Attraction
        {
            Name = request.Name,
            Description = request.Description,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Type = request.Type,
            Region = request.Region,
            ImageUrl = request.ImageUrl,
            Rating = request.Rating,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = ResolveUserId(),
            IsApproved = true
        };

        _context.Attractions.Add(attraction);
        await _context.SaveChangesAsync();
        await _activityPoints.AwardActivityAsync(ResolveUserId(), "Administrator", ActivityAction.AttractionCreated);
        return Ok(new { attraction.Id });
    }

    [Authorize(Roles = "Administrator")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAttraction(int id, [FromBody] AttractionUpsertRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var attraction = await _context.Attractions.FirstOrDefaultAsync(a => a.Id == id);
        if (attraction == null)
        {
            return NotFound();
        }

        attraction.Name = request.Name;
        attraction.Description = request.Description;
        attraction.Latitude = request.Latitude;
        attraction.Longitude = request.Longitude;
        attraction.Type = request.Type;
        attraction.Region = request.Region;
        attraction.ImageUrl = request.ImageUrl;
        attraction.Rating = request.Rating;
        attraction.UpdatedAt = DateTime.UtcNow;
        attraction.IsApproved = true;

        await _context.SaveChangesAsync();
        await _activityPoints.AwardActivityAsync(ResolveUserId(), "Administrator", ActivityAction.AttractionUpdated);
        return NoContent();
    }

    [Authorize(Roles = "Administrator")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAttraction(int id)
    {
        var attraction = await _context.Attractions.FirstOrDefaultAsync(a => a.Id == id);
        if (attraction == null)
        {
            return NotFound();
        }

        _context.Attractions.Remove(attraction);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
