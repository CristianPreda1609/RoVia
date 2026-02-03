namespace RoVia.API.Models;

public enum FriendshipStatus
{
    Pending = 0,
    Accepted = 1,
    Rejected = 2
}

public class Friendship
{
    public int Id { get; set; }
    public int RequesterId { get; set; }
    public int AddresseeId { get; set; }
    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }

    // Navigation
    public User Requester { get; set; }
    public User Addressee { get; set; }
}