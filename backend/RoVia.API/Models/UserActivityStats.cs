namespace RoVia.API.Models;

public class UserActivityStats
{
    public int UserId { get; set; }
    public int AttractionsCreated { get; set; }
    public int AttractionsUpdated { get; set; }
    public int QuizzesCreated { get; set; }
    public int QuizzesUpdated { get; set; }
    public int SuggestionsSubmitted { get; set; }
    public int SuggestionsApproved { get; set; }
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; }
}
