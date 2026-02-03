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

    [HttpGet("me/invite-code")]
    public async Task<IActionResult> GetMyInviteCode()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId == 0) return Unauthorized();

        var code = await _profileService.GetInviteCodeAsync(userId);
        if (code == null) return NotFound();

        return Ok(new { inviteCode = code });
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

    [AllowAnonymous]
    [HttpGet("leaderboard/paged")]
    public async Task<IActionResult> GetLeaderboardPaged(
        [FromQuery] bool monthly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? order = null)
    {
        if (string.Equals(sortBy, "quizzesCompleted", StringComparison.OrdinalIgnoreCase))
        {
            var all = await _profileService.GetLeaderboardAsync(100, monthly);
            var desc = string.IsNullOrWhiteSpace(order) || order.Equals("desc", StringComparison.OrdinalIgnoreCase);
            var ordered = desc
                ? all.OrderByDescending(x => x.QuizzesCompleted).ThenBy(x => x.JoinedAt)
                : all.OrderBy(x => x.QuizzesCompleted).ThenBy(x => x.JoinedAt);

            var currentPage = Math.Max(1, page);
            var size = Math.Clamp(pageSize, 5, 100);
            var items = ordered.Skip((currentPage - 1) * size).Take(size).ToList();
            return Ok(new { items, total = all.Count, page = currentPage, pageSize = size });
        }

        var result = await _profileService.GetLeaderboardPagedAsync(monthly, page, pageSize, sortBy, order);
        return Ok(new { items = result.Items, total = result.Total, page, pageSize });
    }

    [HttpGet("leaderboard/friends")]
    public async Task<IActionResult> GetFriendsLeaderboard(
        [FromQuery] bool monthly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? order = null)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId == 0) return Unauthorized();

        if (string.Equals(sortBy, "quizzesCompleted", StringComparison.OrdinalIgnoreCase))
        {
            var all = await _profileService.GetFriendsLeaderboardAsync(userId, monthly);
            var desc = string.IsNullOrWhiteSpace(order) || order.Equals("desc", StringComparison.OrdinalIgnoreCase);
            var ordered = desc
                ? all.OrderByDescending(x => x.QuizzesCompleted).ThenBy(x => x.JoinedAt)
                : all.OrderBy(x => x.QuizzesCompleted).ThenBy(x => x.JoinedAt);

            var currentPage = Math.Max(1, page);
            var size = Math.Clamp(pageSize, 5, 100);
            var items = ordered.Skip((currentPage - 1) * size).Take(size).ToList();
            return Ok(new { items, total = all.Count, page = currentPage, pageSize = size });
        }

        var result = await _profileService.GetFriendsLeaderboardPagedAsync(userId, monthly, page, pageSize, sortBy, order);
        return Ok(new { items = result.Items, total = result.Total, page, pageSize });
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

    [HttpGet("me/badge-progress")]
    public async Task<IActionResult> GetMyBadgeProgress()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized();

            var progress = await _profileService.GetBadgeProgressAsync(userId);
            if (progress == null) return NotFound();

            return Ok(progress);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Badge progress error: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{userId}/badges")]
    public async Task<IActionResult> GetUserBadgeProgress(int userId)
    {
        try
        {
            var progress = await _profileService.GetBadgeProgressAsync(userId);
            if (progress == null) return NotFound();

            return Ok(progress);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Badge progress error: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize(Roles = "Administrator")]
    [HttpPost("leaderboard/reset")]
    public async Task<IActionResult> ResetMonthlyLeaderboard()
    {
        await _profileService.ResetMonthlyLeaderboardAsync();
        return Ok(new { message = "Leaderboard-ul lunar a fost resetat cu succes" });
    }
}
