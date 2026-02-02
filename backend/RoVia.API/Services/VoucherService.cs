using System;
using System.Collections.Generic;
using System.Linq;
using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;
using Microsoft.EntityFrameworkCore;

namespace RoVia.API.Services;

public class VoucherService
{
    private readonly AppDbContext _context;

    public VoucherService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Obține vouchere disponibile (active, neexpirate, cu uses disponibile)
    /// </summary>
    public async Task<IReadOnlyList<dynamic>> GetAvailableVouchersAsync()
    {
        var now = DateTime.UtcNow;
        
        var vouchers = await _context.Vouchers
            .Where(v => v.IsActive && v.ExpiryDate > now && (v.MaxUses == null || v.CurrentUses < v.MaxUses))
            .ToListAsync();

        return vouchers.Select(v => new
        {
            v.Id,
            v.Code,
            v.Title,
            v.Description,
            v.CostPoints,
            v.DiscountValue,
            v.DiscountType,
            v.Category,
            v.ImageUrl,
            v.ExpiryDate,
            v.MaxUses,
            v.CurrentUses,
            RemainingUses = v.MaxUses.HasValue ? v.MaxUses.Value - v.CurrentUses : (int?)null,
            DaysUntilExpiry = (int)(v.ExpiryDate - now).TotalDays
        }).ToList();
    }

    /// <summary>
    /// Obține vouchere cumpărate de utilizator (cu detalii din Voucher)
    /// </summary>
    public async Task<IReadOnlyList<dynamic>> GetUserVouchersAsync(int userId)
    {
        var userVouchers = await _context.UserVouchers
            .Where(uv => uv.UserId == userId)
            .Include(uv => uv.Voucher)
            .OrderByDescending(uv => uv.PurchasedAt)
            .Select(uv => new
            {
                uv.Id,
                uv.RedemptionCode,
                uv.IsRedeemed,
                uv.PurchasedAt,
                uv.RedeemedAt,
                Voucher = new
                {
                    uv.Voucher.Id,
                    uv.Voucher.Code,
                    uv.Voucher.Title,
                    uv.Voucher.Description,
                    uv.Voucher.DiscountValue,
                    uv.Voucher.DiscountType,
                    uv.Voucher.Category,
                    uv.Voucher.ImageUrl,
                    uv.Voucher.ExpiryDate,
                    IsExpired = uv.Voucher.ExpiryDate < DateTime.UtcNow
                }
            })
            .ToListAsync();

        return userVouchers;
    }

    /// <summary>
    /// Cumpără un voucher - Validări:
    /// - User să aibă suficiente puncte
    /// - Voucher să fie activ, neexpiran, cu uses disponibile
    /// - User să nu aibă deja voucherul nefolosit
    /// </summary>
    public async Task<(bool Success, string Message, int? UserVoucherId)> PurchaseVoucherAsync(int userId, int voucherId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (false, "Utilizator nu găsit", null);

        var voucher = await _context.Vouchers.FindAsync(voucherId);
        if (voucher == null)
            return (false, "Voucher nu găsit", null);

        var now = DateTime.UtcNow;

        // Validări
        if (!voucher.IsActive)
            return (false, "Voucher-ul nu este activ", null);

        if (voucher.ExpiryDate < now)
            return (false, "Voucher-ul a expirat", null);

        if (voucher.MaxUses.HasValue && voucher.CurrentUses >= voucher.MaxUses.Value)
            return (false, "Voucher-ul nu mai are uses disponibile", null);

        if (user.TotalPoints < voucher.CostPoints)
            return (false, $"Nu ai suficiente puncte. Ai {user.TotalPoints}, trebuie {voucher.CostPoints}", null);

        // Verifică dacă user deja are voucherul nefolosit
        var existingUnused = await _context.UserVouchers
            .FirstOrDefaultAsync(uv => uv.UserId == userId && uv.VoucherId == voucherId && !uv.IsRedeemed);

        if (existingUnused != null)
            return (false, "Deja ai acest voucher nefolosit. Trebuie să-l folosești sau să expire înainte.", null);

        // Creează redemption code unic
        var redemptionCode = GenerateRedemptionCode();

        // Crează UserVoucher
        var userVoucher = new UserVoucher
        {
            UserId = userId,
            VoucherId = voucherId,
            PurchasedAt = now,
            RedemptionCode = redemptionCode,
            IsRedeemed = false
        };

        _context.UserVouchers.Add(userVoucher);

        // Scade puncte
        user.TotalPoints -= voucher.CostPoints;
        user.MonthlyPoints -= voucher.CostPoints; // Scade și din monthly

        // Update voucher uses
        voucher.CurrentUses++;

        await _context.SaveChangesAsync();

        return (true, $"Voucher cumpărat cu succes! Cod redeem: {redemptionCode}", userVoucher.Id);
    }

    /// <summary>
    /// Redemption voucher - marchează ca folosit
    /// </summary>
    public async Task<(bool Success, string Message)> RedeemVoucherAsync(int userId, int userVoucherId)
    {
        var userVoucher = await _context.UserVouchers
            .Include(uv => uv.Voucher)
            .FirstOrDefaultAsync(uv => uv.Id == userVoucherId && uv.UserId == userId);

        if (userVoucher == null)
            return (false, "Voucher-ul nu a fost găsit");

        if (userVoucher.IsRedeemed)
            return (false, "Voucherul a fost deja folosit");

        if (userVoucher.Voucher.ExpiryDate < DateTime.UtcNow)
            return (false, "Voucherul a expirat");

        userVoucher.IsRedeemed = true;
        userVoucher.RedeemedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return (true, $"Voucherul a fost marcat ca folosit! Discount: {userVoucher.Voucher.DiscountValue} {userVoucher.Voucher.DiscountType}");
    }

    /// <summary>
    /// Admin: Crea vouchere noi
    /// </summary>
    public async Task<(bool Success, string Message, int? VoucherId)> CreateVoucherAsync(
        string code, string title, string description, int costPoints, 
        decimal discountValue, string discountType, int? maxUses, 
        DateTime expiryDate, string imageUrl, string category)
    {
        // Verifică dacă codul deja există
        var existing = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == code);
        if (existing != null)
            return (false, $"Codul '{code}' deja există", null);

        var voucher = new Voucher
        {
            Code = code,
            Title = title,
            Description = description,
            CostPoints = costPoints,
            DiscountValue = discountValue,
            DiscountType = discountType,
            MaxUses = maxUses,
            ExpiryDate = expiryDate,
            ImageUrl = imageUrl,
            Category = category,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CurrentUses = 0
        };

        _context.Vouchers.Add(voucher);
        await _context.SaveChangesAsync();

        return (true, "Voucher creat cu succes", voucher.Id);
    }

    /// <summary>
    /// Generează cod de redemption unic
    /// </summary>
    private string GenerateRedemptionCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        var code = new string(Enumerable.Range(0, 12)
            .Select(_ => chars[random.Next(chars.Length)])
            .ToArray());
        
        return $"RV-{code}";
    }
}
