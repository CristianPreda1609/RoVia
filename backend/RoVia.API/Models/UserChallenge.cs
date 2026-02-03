using System;

namespace RoVia.API.Models;

public enum ChallengeType
{
    VisitAttractions = 0,
    CompleteQuiz = 1,
    SaveFavorites = 2,
    InviteFriends = 3,
    ExploreRegions = 4,
    EarnBadges = 5
}

public class UserChallenge
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int ChallengeId { get; set; }
    public Challenge Challenge { get; set; } = null!;
    public int Progress { get; set; } = 0;
    public int Target { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
    public ChallengeType Type { get; set; }
    public string? Metadata { get; set; } // JSON pentru trackingdetaliat
}
