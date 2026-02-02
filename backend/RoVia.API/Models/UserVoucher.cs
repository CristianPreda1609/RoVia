namespace RoVia.API.Models;

public class UserVoucher
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int VoucherId { get; set; }
    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RedeemedAt { get; set; }
    public bool IsRedeemed { get; set; } = false;
    public string RedemptionCode { get; set; } = string.Empty; // Cod unic pentru redeem
    
    // Navigation
    public User User { get; set; }
    public Voucher Voucher { get; set; }
}
