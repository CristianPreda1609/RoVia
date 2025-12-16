namespace RoVia.API.Models;

public enum PromoterApplicationStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public class PromoterApplication
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string CompanyName { get; set; }
    public string CompanyWebsite { get; set; }
    public string ContactEmail { get; set; }
    public string Motivation { get; set; }
    public PromoterApplicationStatus Status { get; set; } = PromoterApplicationStatus.Pending;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public int? ReviewedByUserId { get; set; }
    public string AdminNotes { get; set; } = string.Empty;

    // Navigation
    public User User { get; set; }
    public User ReviewedBy { get; set; }
}
