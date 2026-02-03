namespace RoVia.API.DTOs;

public class ChallengeWithProgressDto
{
    public int Id { get; set; }
    public string Kind { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RewardXp { get; set; }
    public string Type { get; set; } = string.Empty;
    public int Target { get; set; }
    public bool IsAccepted { get; set; }
    public int Progress { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}
