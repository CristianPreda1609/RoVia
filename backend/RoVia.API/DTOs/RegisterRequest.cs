namespace RoVia.API.DTOs;

public class RegisterRequest
{
    public string Username { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string? InviteCode { get; set; } // Opțional: codul de invitație
}
