namespace RoVia.API.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public int TotalPoints { get; set; }
    public int MonthlyPoints { get; set; }
    public int CurrentSeasonId { get; set; }
    public DateTime? LastResetDate { get; set; }
    public int RoleId { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Invite system
    public string InviteCode { get; set; } = string.Empty; // Cod unic pentru invitații
    public int? InvitedByUserId { get; set; } // Cine te-a invitat

    // Navigation
    public Role Role { get; set; }
    public User? InvitedBy { get; set; }
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<Attraction> CreatedAttractions { get; set; } = new List<Attraction>();
    public ICollection<PromoterApplication> PromoterApplications { get; set; } = new List<PromoterApplication>();
    public ICollection<PromoterApplication> ReviewedApplications { get; set; } = new List<PromoterApplication>();
    public ICollection<AttractionSuggestion> AttractionSuggestions { get; set; } = new List<AttractionSuggestion>();
    public ICollection<LeaderboardArchive> LeaderboardArchives { get; set; } = new List<LeaderboardArchive>();
    public ICollection<UserVoucher> UserVouchers { get; set; } = new List<UserVoucher>();
    public ICollection<Friendship> FriendRequestsSent { get; set; } = new List<Friendship>();
    public ICollection<Friendship> FriendRequestsReceived { get; set; } = new List<Friendship>();
}
