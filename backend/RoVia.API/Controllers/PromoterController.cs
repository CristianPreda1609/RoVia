using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RoVia.API.DTOs;
using RoVia.API.Models;
using RoVia.API.Services;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PromoterController : ControllerBase
{
    private readonly PromoterWorkflowService _promoterService;

    public PromoterController(PromoterWorkflowService promoterService)
    {
        _promoterService = promoterService;
    }

    [HttpPost("applications")]
    public async Task<IActionResult> SubmitApplication([FromBody] PromoterApplicationRequest request)
    {
        if (request == null) return BadRequest(new { message = "Cererea este goală." });
        var userId = ResolveUserId();
        if (userId == 0) return Unauthorized();

        try
        {
            var response = await _promoterService.SubmitApplicationAsync(userId, request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications()
    {
        var userId = ResolveUserId();
        if (userId == 0) return Unauthorized();

        var applications = await _promoterService.GetApplicationsForUserAsync(userId);
        return Ok(applications);
    }

    [HttpGet("applications/latest")]
    public async Task<IActionResult> GetLatestApplication()
    {
        var userId = ResolveUserId();
        if (userId == 0) return Unauthorized();

        var application = await _promoterService.GetLatestApplicationAsync(userId);
        return Ok(application);
    }

    [Authorize(Roles = "Promoter")]
    [HttpPost("suggestions")]
    public async Task<IActionResult> SubmitSuggestion([FromBody] AttractionSuggestionRequest request)
    {
        if (request == null) return BadRequest(new { message = "Cererea este goală." });
        var userId = ResolveUserId();
        if (userId == 0) return Unauthorized();

        try
        {
            var suggestion = await _promoterService.SubmitSuggestionAsync(userId, request);
            return Ok(suggestion);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "Promoter")]
    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions([FromQuery] SuggestionStatus? status)
    {
        var userId = ResolveUserId();
        if (userId == 0) return Unauthorized();

        var suggestions = await _promoterService.GetSuggestionsForPromoterAsync(userId, status);
        return Ok(suggestions);
    }

    [Authorize(Roles = "Promoter")]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = ResolveUserId();
        if (userId == 0) return Unauthorized();

        var summary = await _promoterService.GetDashboardAsync(userId);
        return Ok(summary);
    }

    private int ResolveUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
