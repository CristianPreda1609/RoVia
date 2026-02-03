using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RoVia.API.Services;
using RoVia.API.DTOs;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChallengesController : ControllerBase
{
    private readonly ChallengeService _service;

    public ChallengesController(ChallengeService service)
    {
        _service = service;
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive([FromQuery] int? userId = null)
    {
        await _service.EnsureChallengesAsync();
        
        // Dacă userId nu e furnizat, încearcă să-l iei din token
        var userIdValue = userId ?? GetUserIdFromToken();
        
        if (userIdValue.HasValue)
        {
            var dailyWithProgress = await _service.GetActiveDailyWithProgressAsync(userIdValue.Value);
            var weeklyWithProgress = await _service.GetActiveWeeklyWithProgressAsync(userIdValue.Value);
            return Ok(new { Daily = dailyWithProgress, Weekly = weeklyWithProgress });
        }
        
        var daily = await _service.GetActiveDailyAsync();
        var weekly = await _service.GetActiveWeeklyAsync();
        return Ok(new { Daily = daily, Weekly = weekly });
    }

    private int? GetUserIdFromToken()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return null;
    }

    [HttpPost("regenerate")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Regenerate()
    {
        await _service.RegenerateChallengesAsync();
        return Ok(new { message = "Provocări regenerate cu succes!" });
    }

    [HttpPost("{challengeId}/accept")]
    public async Task<IActionResult> AcceptChallenge(int challengeId, [FromBody] int userId)
    {
        await _service.AcceptChallengeAsync(userId, challengeId);
        return Ok();
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserChallenges(int userId)
    {
        var challenges = await _service.GetUserChallengesAsync(userId);
        return Ok(challenges);
    }
}
