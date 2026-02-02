namespace RoVia.API.Models;

public class Voucher
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CostPoints { get; set; } // Puncte necesare pentru a cumpăra
    public decimal DiscountValue { get; set; } // Valoare discount (ex: 10% sau €5)
    public string DiscountType { get; set; } = "PERCENTAGE"; // PERCENTAGE sau FIXED_AMOUNT
    public int? MaxUses { get; set; } // null = unlimited
    public int CurrentUses { get; set; } = 0; // Câte ori a fost folosit
    public DateTime ExpiryDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string ImageUrl { get; set; } = string.Empty;
    public string Category { get; set; } = "General"; // HOTEL, RESTAURANT, TRANSPORT, etc.
    
    // Navigation
    public ICollection<UserVoucher> UserVouchers { get; set; } = new List<UserVoucher>();
}
