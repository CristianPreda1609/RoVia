using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RoVia.API.Services;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VoucherController : ControllerBase
{
    private readonly VoucherService _voucherService;

    public VoucherController(VoucherService voucherService)
    {
        _voucherService = voucherService;
    }

    private int ResolveUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    /// <summary>
    /// Obține lista de vouchere disponibile
    /// </summary>
    [AllowAnonymous]
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableVouchers()
    {
        var vouchers = await _voucherService.GetAvailableVouchersAsync();
        return Ok(vouchers);
    }

    /// <summary>
    /// Obține vouchere cumpărate de utilizatorul curent
    /// </summary>
    [Authorize]
    [HttpGet("my-vouchers")]
    public async Task<IActionResult> GetMyVouchers()
    {
        int userId = ResolveUserId();
        if (userId == 0) return Unauthorized();

        var vouchers = await _voucherService.GetUserVouchersAsync(userId);
        return Ok(vouchers);
    }

    /// <summary>
    /// Cumpără un voucher (scade puncte din TotalPoints și MonthlyPoints)
    /// </summary>
    [Authorize]
    [HttpPost("{voucherId}/purchase")]
    public async Task<IActionResult> PurchaseVoucher(int voucherId)
    {
        int userId = ResolveUserId();
        if (userId == 0) return Unauthorized();

        var (success, message, userVoucherId) = await _voucherService.PurchaseVoucherAsync(userId, voucherId);
        
        if (!success)
            return BadRequest(new { message });

        return Ok(new { message, userVoucherId });
    }

    /// <summary>
    /// Marchează un voucher ca folosit (redeem)
    /// </summary>
    [Authorize]
    [HttpPost("{userVoucherId}/redeem")]
    public async Task<IActionResult> RedeemVoucher(int userVoucherId)
    {
        int userId = ResolveUserId();
        if (userId == 0) return Unauthorized();

        var (success, message) = await _voucherService.RedeemVoucherAsync(userId, userVoucherId);
        
        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    /// <summary>
    /// Admin: Crea voucher nou
    /// </summary>
    [Authorize(Roles = "Administrator")]
    [HttpPost("create")]
    public async Task<IActionResult> CreateVoucher([FromBody] CreateVoucherRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (success, message, voucherId) = await _voucherService.CreateVoucherAsync(
            request.Code,
            request.Title,
            request.Description,
            request.CostPoints,
            request.DiscountValue,
            request.DiscountType,
            request.MaxUses,
            request.ExpiryDate,
            request.ImageUrl,
            request.Category
        );

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message, voucherId });
    }
}

public class CreateVoucherRequest
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CostPoints { get; set; }
    public decimal DiscountValue { get; set; }
    public string DiscountType { get; set; } = "PERCENTAGE"; // PERCENTAGE sau FIXED_AMOUNT
    public int? MaxUses { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
}
