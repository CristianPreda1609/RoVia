using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.Models;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FriendsController : ControllerBase
{
    private readonly AppDbContext _context;

    public FriendsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("request/{targetUserId}")]
    public async Task<IActionResult> SendRequest(int targetUserId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        if (userId.Value == targetUserId)
        {
            return BadRequest(new { message = "Nu poți trimite cerere către tine." });
        }

        var targetExists = await _context.Users.AnyAsync(u => u.Id == targetUserId);
        if (!targetExists)
        {
            return NotFound(new { message = "Utilizatorul nu există." });
        }

        var existing = await _context.Friendships
            .FirstOrDefaultAsync(f =>
                (f.RequesterId == userId.Value && f.AddresseeId == targetUserId) ||
                (f.RequesterId == targetUserId && f.AddresseeId == userId.Value));

        if (existing != null)
        {
            if (existing.Status == FriendshipStatus.Accepted)
            {
                return BadRequest(new { message = "Sunteți deja prieteni." });
            }

            if (existing.Status == FriendshipStatus.Pending)
            {
                return BadRequest(new { message = "Există deja o cerere în așteptare." });
            }

            _context.Friendships.Remove(existing);
        }

        var request = new Friendship
        {
            RequesterId = userId.Value,
            AddresseeId = targetUserId,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Friendships.Add(request);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Cerere trimisă." });
    }

    [HttpPost("accept/{requestId}")]
    public async Task<IActionResult> AcceptRequest(int requestId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var request = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == requestId && f.AddresseeId == userId.Value && f.Status == FriendshipStatus.Pending);

        if (request == null)
        {
            return NotFound(new { message = "Cererea nu există." });
        }

        request.Status = FriendshipStatus.Accepted;
        request.RespondedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Cerere acceptată." });
    }

    [HttpPost("reject/{requestId}")]
    public async Task<IActionResult> RejectRequest(int requestId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var request = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == requestId && f.AddresseeId == userId.Value && f.Status == FriendshipStatus.Pending);

        if (request == null)
        {
            return NotFound(new { message = "Cererea nu există." });
        }

        request.Status = FriendshipStatus.Rejected;
        request.RespondedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Cerere respinsă." });
    }

    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var friends = await _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Accepted &&
                        (f.RequesterId == userId.Value || f.AddresseeId == userId.Value))
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .Select(f => f.RequesterId == userId.Value ? f.Addressee : f.Requester)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.TotalPoints,
                u.MonthlyPoints,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(friends);
    }

    [HttpDelete("{friendUserId}")]
    public async Task<IActionResult> Unfriend(int friendUserId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Status == FriendshipStatus.Accepted &&
                                      ((f.RequesterId == userId.Value && f.AddresseeId == friendUserId) ||
                                       (f.RequesterId == friendUserId && f.AddresseeId == userId.Value)));

        if (friendship == null)
        {
            return NotFound(new { message = "Prietenul nu a fost găsit." });
        }

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Prieten șters." });
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetPendingRequests()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var requests = await _context.Friendships
            .Where(f => f.AddresseeId == userId.Value && f.Status == FriendshipStatus.Pending)
            .Include(f => f.Requester)
            .Select(f => new
            {
                f.Id,
                f.CreatedAt,
                Requester = new
                {
                    f.Requester.Id,
                    f.Requester.Username,
                    f.Requester.TotalPoints,
                    f.Requester.MonthlyPoints
                }
            })
            .ToListAsync();

        return Ok(requests);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string query)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(new List<object>());
        }

        var results = await _context.Users
            .Where(u => u.Id != userId.Value && (u.Username.Contains(query) || u.Email.Contains(query)))
            .OrderBy(u => u.Username)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.TotalPoints,
                u.MonthlyPoints
            })
            .Take(10)
            .ToListAsync();

        return Ok(results);
    }

    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }

        return null;
    }
}