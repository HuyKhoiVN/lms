using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Courses;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public class CourseService : ICourseService
{
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private readonly ICourseRepository _courseRepository;
    private readonly IAuditLogService _auditLogService;
    private readonly IFileStorageService? _fileStorageService;
    private readonly IConfiguration? _configuration;

    public CourseService(
        ICourseRepository courseRepository,
        IAuditLogService auditLogService,
        IFileStorageService? fileStorageService = null,
        IConfiguration? configuration = null)
    {
        _courseRepository = courseRepository;
        _auditLogService = auditLogService;
        _fileStorageService = fileStorageService;
        _configuration = configuration;
    }

    public async Task<ApiResponse<CourseDetailResponse>> CreateCourseAsync(CreateCourseRequest request, int? adminId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Ten khoa hoc khong duoc de trong.");
        }

        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var existingCode = await _courseRepository.GetByCodeAsync(request.Code);
            if (existingCode != null)
            {
                return ApiResponse<CourseDetailResponse>.FailureResult($"Ma khoa hoc '{request.Code}' da ton tai.");
            }
        }

        var course = new Course
        {
            Code = request.Code ?? string.Empty,
            Name = request.Name,
            Description = request.Description,
            IsPublished = request.IsPublished,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        };

        await _courseRepository.AddAsync(course);

        await _auditLogService.LogActionAsync(
            adminId,
            "CREATE",
            "Course",
            course.Id,
            null,
            $"{{\"Code\":\"{course.Code}\",\"Name\":\"{course.Name}\",\"IsPublished\":{course.IsPublished}}}");

        return ApiResponse<CourseDetailResponse>.SuccessResult(MapDetail(course), "Tao khoa hoc thanh cong.");
    }

    public async Task<ApiResponse<CourseDetailResponse>> UpdateCourseAsync(int id, UpdateCourseRequest request, int? adminId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Ten khoa hoc khong duoc de trong.");
        }

        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Khong tim thay khoa hoc.");
        }

        if (!string.IsNullOrWhiteSpace(request.Code) && !string.Equals(course.Code, request.Code, StringComparison.OrdinalIgnoreCase))
        {
            var existingCode = await _courseRepository.GetByCodeAsync(request.Code);
            if (existingCode != null)
            {
                return ApiResponse<CourseDetailResponse>.FailureResult($"Ma khoa hoc '{request.Code}' da ton tai.");
            }
        }

        var beforeData = $"{{\"Code\":\"{course.Code}\",\"Name\":\"{course.Name}\",\"IsPublished\":{course.IsPublished}}}";

        course.Code = request.Code ?? string.Empty;
        course.Name = request.Name;
        course.Description = request.Description;
        course.IsPublished = request.IsPublished;
        course.UpdateDate = DateTime.UtcNow;
        course.UpdatedBy = adminId;

        await _courseRepository.UpdateAsync(course);

        await _auditLogService.LogActionAsync(
            adminId,
            "UPDATE",
            "Course",
            course.Id,
            beforeData,
            $"{{\"Code\":\"{course.Code}\",\"Name\":\"{course.Name}\",\"IsPublished\":{course.IsPublished}}}");

        return ApiResponse<CourseDetailResponse>.SuccessResult(MapDetail(course), "Cap nhat khoa hoc thanh cong.");
    }

    public async Task<ApiResponse<object>> DeleteCourseAsync(int id, int? adminId)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<object>.FailureResult("Khong tim thay khoa hoc.");
        }

        course.IsDelete = true;
        course.UpdateDate = DateTime.UtcNow;
        course.UpdatedBy = adminId;

        await _courseRepository.UpdateAsync(course);

        await _auditLogService.LogActionAsync(
            adminId,
            "DELETE",
            "Course",
            course.Id,
            $"{{\"Code\":\"{course.Code}\",\"Name\":\"{course.Name}\"}}",
            null);

        return ApiResponse<object>.SuccessResult(null!, "Xoa khoa hoc thanh cong.");
    }

    public async Task<ApiResponse<CourseDetailResponse>> GetByIdAsync(int id)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Khong tim thay khoa hoc.");
        }

        return ApiResponse<CourseDetailResponse>.SuccessResult(MapDetail(course));
    }

    public async Task<ApiResponse<PagedResult<CourseListItemResponse>>> GetPagedAsync(CourseFilterRequest filter, int? studentId)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize is < 1 or > 100 ? 20 : filter.PageSize;

        List<Course> courses;
        int total;

        if (studentId.HasValue)
        {
            courses = await _courseRepository.GetPagedAssignedToUserAsync(studentId.Value, filter.Keyword, page, pageSize);
            total = await _courseRepository.GetCountAssignedToUserAsync(studentId.Value, filter.Keyword);
        }
        else
        {
            courses = await _courseRepository.GetPagedAsync(filter.Keyword, filter.IsPublished, page, pageSize);
            total = await _courseRepository.GetCountAsync(filter.Keyword, filter.IsPublished);
        }

        var items = courses.Select(MapListItem).ToList();
        var pagedResult = new PagedResult<CourseListItemResponse>(items, total, page, pageSize);
        return ApiResponse<PagedResult<CourseListItemResponse>>.SuccessResult(pagedResult);
    }

    public async Task<ApiResponse<CourseDetailResponse>> UploadThumbnailAsync(
        int id, Stream fileStream, string fileName, string contentType, long fileSize, int? adminId)
    {
        if (_fileStorageService == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("File storage chua duoc cau hinh.");
        }

        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Khong tim thay khoa hoc.");
        }

        var validationError = ValidateImage(fileName, fileSize);
        if (validationError != null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult(validationError);
        }

        var oldFileKey = course.ThumbnailFileKey;
        var fileKey = await _fileStorageService.SavePublicFileAsync(fileStream, fileName, "courses");

        course.ThumbnailFileKey = fileKey;
        course.ThumbnailUrl = _fileStorageService.GetPublicUrl(fileKey);
        course.ThumbnailContentType = contentType;
        course.ThumbnailOriginalFileName = fileName;
        course.UpdateDate = DateTime.UtcNow;
        course.UpdatedBy = adminId;

        await _courseRepository.UpdateAsync(course);

        if (!string.IsNullOrWhiteSpace(oldFileKey))
        {
            await _fileStorageService.DeleteFileAsync(oldFileKey);
        }

        await _auditLogService.LogActionAsync(
            adminId, "UPLOAD_COURSE_THUMBNAIL", "Course", course.Id,
            null, $"{{\"FileName\":\"{fileName}\"}}");

        return ApiResponse<CourseDetailResponse>.SuccessResult(MapDetail(course), "Upload anh khoa hoc thanh cong.");
    }

    public async Task<ApiResponse<CourseDetailResponse>> DeleteThumbnailAsync(int id, int? adminId)
    {
        if (_fileStorageService == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("File storage chua duoc cau hinh.");
        }

        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Khong tim thay khoa hoc.");
        }

        var oldFileKey = course.ThumbnailFileKey;
        course.ThumbnailFileKey = null;
        course.ThumbnailUrl = null;
        course.ThumbnailContentType = null;
        course.ThumbnailOriginalFileName = null;
        course.UpdateDate = DateTime.UtcNow;
        course.UpdatedBy = adminId;

        await _courseRepository.UpdateAsync(course);

        if (!string.IsNullOrWhiteSpace(oldFileKey))
        {
            await _fileStorageService.DeleteFileAsync(oldFileKey);
        }

        await _auditLogService.LogActionAsync(
            adminId, "DELETE_COURSE_THUMBNAIL", "Course", course.Id,
            null, null);

        return ApiResponse<CourseDetailResponse>.SuccessResult(MapDetail(course), "Da xoa anh khoa hoc.");
    }

    public async Task<ApiResponse<CourseDetailResponse>> PublishCourseAsync(int id, bool published, int? adminId)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Khong tim thay khoa hoc.");
        }

        var action = published ? "PUBLISH" : "UNPUBLISH";
        var beforeData = $"{{\"IsPublished\":{course.IsPublished.ToString().ToLower()}}}";

        course.IsPublished = published;
        course.UpdateDate = DateTime.UtcNow;
        course.UpdatedBy = adminId;

        await _courseRepository.UpdateAsync(course);

        await _auditLogService.LogActionAsync(
            adminId,
            action,
            "Course",
            course.Id,
            beforeData,
            $"{{\"IsPublished\":{published.ToString().ToLower()}}}");

        return ApiResponse<CourseDetailResponse>.SuccessResult(
            MapDetail(course),
            published ? "Da publish khoa hoc thanh cong." : "Da unpublish khoa hoc thanh cong.");
    }

    private string? ValidateImage(string fileName, long fileSize)
    {
        var extension = Path.GetExtension(fileName);
        if (!AllowedImageExtensions.Contains(extension))
        {
            return "Anh minh hoa chi chap nhan jpg, jpeg, png hoac webp.";
        }

        var maxImageBytes = GetConfiguredLong("Storage:MaxImageBytes", 10 * 1024 * 1024);
        if (fileSize <= 0 || fileSize > maxImageBytes)
        {
            return $"Dung luong anh phai lon hon 0 va khong vuot qua {Math.Round(maxImageBytes / 1024m / 1024m, 0)}MB.";
        }

        return null;
    }

    private long GetConfiguredLong(string key, long fallback)
    {
        if (_configuration == null)
        {
            return fallback;
        }

        return long.TryParse(_configuration[key], out var value) && value > 0 ? value : fallback;
    }

    private static CourseDetailResponse MapDetail(Course course) => new()
    {
        Id = course.Id,
        Code = course.Code,
        Name = course.Name,
        Description = course.Description,
        IsPublished = course.IsPublished,
        CreatedDate = course.CreatedDate,
        ThumbnailUrl = course.ThumbnailUrl,
        ThumbnailContentType = course.ThumbnailContentType,
        ThumbnailOriginalFileName = course.ThumbnailOriginalFileName
    };

    private static CourseListItemResponse MapListItem(Course course) => new()
    {
        Id = course.Id,
        Code = course.Code,
        Name = course.Name,
        Description = course.Description,
        IsPublished = course.IsPublished,
        ThumbnailUrl = course.ThumbnailUrl,
        ThumbnailContentType = course.ThumbnailContentType,
        ThumbnailOriginalFileName = course.ThumbnailOriginalFileName
    };
}
