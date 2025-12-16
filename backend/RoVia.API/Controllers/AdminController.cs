using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RoVia.API.DTOs;
using RoVia.API.Models;
using RoVia.API.Services;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator")]
public class AdminController : ControllerBase
{
    private readonly AdminWorkflowService _adminService;

    public AdminController(AdminWorkflowService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var info = await _adminService.GetDashboardAsync();
        return Ok(info);
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications([FromQuery] PromoterApplicationStatus? status)
    {
        var applications = await _adminService.GetApplicationsAsync(status);
        return Ok(applications);
    }

    [HttpPost("applications/{applicationId:int}/approve")]
    public async Task<IActionResult> ApproveApplication(int applicationId, [FromBody] AdminDecisionRequest request)
    {
        if (request == null) return BadRequest(new { message = "Cererea este goală." });
        try
        {
            var result = await _adminService.ApproveApplicationAsync(applicationId, ResolveUserId(), request.Notes);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("applications/{applicationId:int}/reject")]
    public async Task<IActionResult> RejectApplication(int applicationId, [FromBody] AdminDecisionRequest request)
    {
        if (request == null) return BadRequest(new { message = "Cererea este goală." });
        try
        {
            var result = await _adminService.RejectApplicationAsync(applicationId, ResolveUserId(), request.Notes);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions([FromQuery] SuggestionStatus? status)
    {
        var suggestions = await _adminService.GetSuggestionsAsync(status);
        return Ok(suggestions);
    }

    [HttpPost("suggestions/{suggestionId:int}/approve")]
    public async Task<IActionResult> ApproveSuggestion(int suggestionId, [FromBody] AdminDecisionRequest request)
    {
        if (request == null) return BadRequest(new { message = "Cererea este goală." });
        try
        {
            var result = await _adminService.ApproveSuggestionAsync(suggestionId, ResolveUserId(), request.Notes);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("suggestions/{suggestionId:int}/reject")]
    public async Task<IActionResult> RejectSuggestion(int suggestionId, [FromBody] AdminDecisionRequest request)
    {
        if (request == null) return BadRequest(new { message = "Cererea este goală." });
        try
        {
            var result = await _adminService.RejectSuggestionAsync(suggestionId, ResolveUserId(), request.Notes);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private int ResolveUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
