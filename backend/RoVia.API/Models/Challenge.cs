using System;

namespace RoVia.API.Models;

public enum ChallengeKind
{
    Daily = 0,
    Weekly = 1
}

public class Challenge
{
    public int Id { get; set; }
    public ChallengeKind Kind { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RewardXp { get; set; }
    public string Type { get; set; } = "VisitAttractions";
    public int Target { get; set; } = 1;
    public string Source { get; set; } = "Gemini";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
