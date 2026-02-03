namespace RoVia.API.DTOs;

public class AttractionRecommendationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public double Rating { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsPromoterHighlight { get; set; }
    public string HighlightLabel { get; set; } = string.Empty;
}
