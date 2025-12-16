using RoVia.API.Models;

namespace RoVia.API.DTOs;

public class PromoterApplicationResponse
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string CompanyWebsite { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string Motivation { get; set; } = string.Empty;
    public PromoterApplicationStatus Status { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string AdminNotes { get; set; } = string.Empty;
}
