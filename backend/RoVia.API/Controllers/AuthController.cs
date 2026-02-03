using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;
using RoVia.API.Services;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;
    private readonly ChallengeProgressService _challengeProgress;
    private readonly ChallengeService _challengeService;

    public AuthController(AppDbContext context, JwtService jwtService, ChallengeProgressService challengeProgress, ChallengeService challengeService)
    {
        _context = context;
        _jwtService = jwtService;
        _challengeProgress = challengeProgress;
        _challengeService = challengeService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (_context.Users.Any(u => u.Email == request.Email))
            return BadRequest("Email already exists");

        var visitorRole = _context.Roles.FirstOrDefault(r => r.Name == "Visitor") ?? _context.Roles.First();

        // Check if invite code is valid
        int? inviterId = null;
        if (!string.IsNullOrWhiteSpace(request.InviteCode))
        {
            var inviter = await _context.Users.FirstOrDefaultAsync(u => u.InviteCode == request.InviteCode);
            if (inviter != null)
            {
                inviterId = inviter.Id;
            }
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = visitorRole.Id,
            CreatedAt = DateTime.UtcNow,
            InviteCode = GenerateInviteCode(), // Generează cod unic
            InvitedByUserId = inviterId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Auto-accept "InviteFriends" challenge pentru utilizatorul nou
        var today = DateTime.UtcNow.Date;
        var inviteFriendsChallenge = await _context.Challenges
            .FirstOrDefaultAsync(c => c.Type == "InviteFriends" && c.Kind == ChallengeKind.Daily && c.StartDate == today);
        
        if (inviteFriendsChallenge != null)
        {
            await _challengeService.AcceptChallengeAsync(user.Id, inviteFriendsChallenge.Id);
        }

        // Dacă cineva te-a invitat, primește credit la challenge
        if (inviterId.HasValue)
        {
            await _challengeProgress.TrackFriendInviteAsync(inviterId.Value);
        }

        user.Role = visitorRole;
        var token = _jwtService.GenerateToken(user);
        return Ok(new AuthResponse { Token = token });
    }

    private static string GenerateInviteCode()
    {
        // Generează cod unic de 8 caractere
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Range(0, 8)
            .Select(_ => chars[random.Next(chars.Length)])
            .ToArray());
    }

    [HttpPost("login")]
    public IActionResult Login(LoginRequest request)
    {
        var user = _context.Users
            .Include(u => u.Role)
            .FirstOrDefault(u => u.Email == request.Email);
        if (user == null)
            return Unauthorized();

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized();

        var token = _jwtService.GenerateToken(user);
        return Ok(new AuthResponse { Token = token });
    }
}
