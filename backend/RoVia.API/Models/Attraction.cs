namespace RoVia.API.Models;

public class Attraction
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public AttractionType Type { get; set; }
    public string Region { get; set; }
    public string ImageUrl { get; set; }
    public double Rating { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int? CreatedByUserId { get; set; }
    public bool IsApproved { get; set; } = true;

    // Navigation
    public User CreatedByUser { get; set; }
    public ICollection<AttractionSuggestion> Suggestions { get; set; } = new List<AttractionSuggestion>();
}

public enum AttractionType
{
    Natural = 1,
    Cultural = 2,
    Historic = 3,
    Entertainment = 4,
    Religious = 5
}
