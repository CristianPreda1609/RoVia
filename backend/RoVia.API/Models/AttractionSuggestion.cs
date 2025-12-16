namespace RoVia.API.Models;

public enum SuggestionStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public class AttractionSuggestion
{
    public int Id { get; set; }
    public int PromoterId { get; set; }
    public int? AttractionId { get; set; }
    public bool CreatesNewAttraction { get; set; }
    public string Title { get; set; }
    public string Details { get; set; }
    public string ProposedName { get; set; }
    public string ProposedDescription { get; set; }
    public string ProposedRegion { get; set; }
    public AttractionType? ProposedType { get; set; }
    public double? ProposedLatitude { get; set; }
    public double? ProposedLongitude { get; set; }
    public string ProposedImageUrl { get; set; }
    public SuggestionStatus Status { get; set; } = SuggestionStatus.Pending;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public int? ReviewedByUserId { get; set; }
    public string AdminResponse { get; set; } = string.Empty;

    // Navigation
    public User Promoter { get; set; }
    public User ReviewedBy { get; set; }
    public Attraction Attraction { get; set; }
}
