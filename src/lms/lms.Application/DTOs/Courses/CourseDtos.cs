using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace lms.Application.DTOs.Courses;

public class CreateCourseRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Code { get; set; }
    public bool IsPublished { get; set; }
}

public class UpdateCourseRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Code { get; set; }
    public bool IsPublished { get; set; }
}

public class CourseDetailResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Code { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? CreatedDate { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? ThumbnailContentType { get; set; }
    public string? ThumbnailOriginalFileName { get; set; }
}

public class CourseListItemResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Code { get; set; }
    public bool IsPublished { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? ThumbnailContentType { get; set; }
    public string? ThumbnailOriginalFileName { get; set; }
}

public sealed class UploadCourseThumbnailForm
{
    public IFormFile? File { get; set; }
}

public class CourseFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public bool? IsPublished { get; set; }
}

public class AssignCourseRequest
{
    public List<int>? UserIds { get; set; }
    public List<int>? GroupIds { get; set; }
}

public class CourseAssignmentResponse
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public int UserId { get; set; }
    public DateTime? CreatedDate { get; set; }
}
