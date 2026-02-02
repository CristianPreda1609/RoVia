namespace RoVia.API.Models;

public class LeaderboardArchive
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int SeasonId { get; set; }
    public int MonthlyPoints { get; set; }
    public int Rank { get; set; }
    public DateTime SeasonStart { get; set; }
    public DateTime SeasonEnd { get; set; }
    
    // Navigation
    public User User { get; set; }
}
