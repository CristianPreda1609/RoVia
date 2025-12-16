using RoVia.API.Models;

namespace RoVia.API.DTOs;

public class AttractionSuggestionResponse
{
    public int Id { get; set; }
    public int PromoterId { get; set; }
    public string PromoterName { get; set; } = string.Empty;
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
    public SuggestionStatus Status { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public int? ReviewedByUserId { get; set; }
    public string AdminResponse { get; set; } = string.Empty;
}
