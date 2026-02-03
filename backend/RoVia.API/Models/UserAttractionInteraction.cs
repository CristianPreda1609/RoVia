using System;

namespace RoVia.API.Models;

public class UserFavorite
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int AttractionId { get; set; }
    public Attraction Attraction { get; set; } = null!;
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
}

public class UserAttractionVisit
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int AttractionId { get; set; }
    public Attraction Attraction { get; set; } = null!;
    public DateTime VisitedAt { get; set; } = DateTime.UtcNow;
}
