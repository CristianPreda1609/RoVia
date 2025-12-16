using RoVia.API.Models;

namespace RoVia.API.DTOs;

public class AttractionSuggestionRequest
{
    public int? AttractionId { get; set; }
    public bool CreatesNewAttraction { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string ProposedName { get; set; } = string.Empty;
    public string ProposedDescription { get; set; } = string.Empty;
    public string ProposedRegion { get; set; } = string.Empty;
    public AttractionType? ProposedType { get; set; }
    public double? ProposedLatitude { get; set; }
    public double? ProposedLongitude { get; set; }
    public string ProposedImageUrl { get; set; } = string.Empty;
}
