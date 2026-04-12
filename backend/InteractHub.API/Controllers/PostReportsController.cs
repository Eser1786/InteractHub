using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using InteractHub.Application.Interfaces;
using InteractHub.Application.Entities;
using InteractHub.API.DTOs;
using InteractHub.API.DTOs.Response;
using InteractHub.API.Extensions;
using System.Security.Claims;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostReportsController : ControllerBase
{
    private readonly IPostReportService _postReportService;

    public PostReportsController(IPostReportService postReportService)
    {
        _postReportService = postReportService;
    }

    [HttpGet]
    [Authorize(Policy = "AdminOrModerator")] // ✅ Chỉ Admin hoặc Moderator có thể xem tất cả reports
    [ProducesResponseType(typeof(ApiResponse<List<PostReportResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll()
    {
        var reports = await _postReportService.GetAllAsync();
        var reportDtos = reports.Select(r => new PostReportResponseDto
        {
            Id = r.Id,
            Reason = r.Reason,
            PostId = r.PostId,
            UserId = r.UserId,
            CreatedAt = r.CreatedAt
        }).ToList();

        return this.SuccessResponse(reportDtos);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PostReportResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(int id)
    {
        var report = await _postReportService.GetByIdAsync(id);
        if (report == null)
            return this.NotFoundResponse("Report not found");

        var reportDto = new PostReportResponseDto
        {
            Id = report.Id,
            Reason = report.Reason,
            PostId = report.PostId,
            UserId = report.UserId,
            CreatedAt = report.CreatedAt
        };

        return this.SuccessResponse(reportDto);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PostReportResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreatePostReportDto createPostReportDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        var report = new PostReport
        {
            Reason = createPostReportDto.Reason,
            PostId = createPostReportDto.PostId,
            UserId = userId
        };

        var created = await _postReportService.CreateAsync(report);

        var reportDto = new PostReportResponseDto
        {
            Id = created.Id,
            Reason = created.Reason,
            PostId = created.PostId,
            UserId = created.UserId,
            CreatedAt = created.CreatedAt
        };

        return this.CreatedResponse(reportDto);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")] // ✅ Chỉ Admin có thể xóa reports
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var report = await _postReportService.GetByIdAsync(id);
        if (report == null)
            return this.NotFoundResponse("Report not found");

        var result = await _postReportService.DeleteAsync(id);
        if (!result)
            return this.NotFoundResponse("Report not found");

        return this.SuccessResponse(statusCode: 204);
    }
}
