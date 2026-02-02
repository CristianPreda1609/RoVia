using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RoVia.API.DTOs;
using RoVia.API.Services;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ProfileService _profileService;

    public ProfileController(ProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId == 0) return Unauthorized();

        var profile = await _profileService.GetUserProfileAsync(userId);
        if (profile == null) return NotFound();

        return Ok(profile);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId == 0) return Unauthorized();

        var success = await _profileService.UpdateUserProfileAsync(userId, request.Username, request.Email);
        if (!success) return BadRequest(new { message = "Username sau email deja utilizat" });

        var profile = await _profileService.GetUserProfileAsync(userId);
        return Ok(profile);
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUserProfile(int userId)
    {
        var profile = await _profileService.GetUserProfileAsync(userId);
        if (profile == null) return NotFound();

        return Ok(profile);
    }

    [AllowAnonymous]
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int take = 50, [FromQuery] bool monthly = false)
    {
        var leaderboard = await _profileService.GetLeaderboardAsync(take, monthly);
        return Ok(leaderboard);
    }

    [HttpGet("leaderboard/me")]
    public async Task<IActionResult> GetMyLeaderboardEntry()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId == 0) return Unauthorized();

        var entry = await _profileService.GetUserLeaderboardEntryAsync(userId);
        if (entry == null) return NotFound();

        return Ok(entry);
    }

    [Authorize(Roles = "Administrator")]
    [HttpPost("leaderboard/reset")]
    public async Task<IActionResult> ResetMonthlyLeaderboard()
    {
        await _profileService.ResetMonthlyLeaderboardAsync();
        return Ok(new { message = "Leaderboard-ul lunar a fost resetat cu succes" });
    }
}
