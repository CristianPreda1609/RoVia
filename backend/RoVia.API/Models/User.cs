namespace RoVia.API.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public int TotalPoints { get; set; }
    public int RoleId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Role Role { get; set; }
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<Attraction> CreatedAttractions { get; set; } = new List<Attraction>();
    public ICollection<PromoterApplication> PromoterApplications { get; set; } = new List<PromoterApplication>();
    public ICollection<PromoterApplication> ReviewedApplications { get; set; } = new List<PromoterApplication>();
    public ICollection<AttractionSuggestion> AttractionSuggestions { get; set; } = new List<AttractionSuggestion>();
}
