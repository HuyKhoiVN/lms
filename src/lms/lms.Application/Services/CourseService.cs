using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Courses;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public class CourseService : ICourseService
{
    private readonly ICourseRepository _courseRepository;
    private readonly IAuditLogService _auditLogService;

    public CourseService(
        ICourseRepository courseRepository,
        IAuditLogService auditLogService)
    {
        _courseRepository = courseRepository;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResponse<CourseDetailResponse>> CreateCourseAsync(CreateCourseRequest request, int? adminId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Tên khóa học không được để trống.");
        }

        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var existingCode = await _courseRepository.GetByCodeAsync(request.Code);
            if (existingCode != null)
            {
                return ApiResponse<CourseDetailResponse>.FailureResult($"Mã khóa học '{request.Code}' đã tồn tại.");
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
            $"{{\"Code\":\"{course.Code}\",\"Name\":\"{course.Name}\",\"IsPublished\":{course.IsPublished}}}"
        );

        var response = new CourseDetailResponse
        {
            Id = course.Id,
            Code = course.Code,
            Name = course.Name,
            Description = course.Description,
            IsPublished = course.IsPublished,
            CreatedDate = course.CreatedDate
        };

        return ApiResponse<CourseDetailResponse>.SuccessResult(response, "Tạo khóa học thành công.");
    }

    public async Task<ApiResponse<CourseDetailResponse>> UpdateCourseAsync(int id, UpdateCourseRequest request, int? adminId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Tên khóa học không được để trống.");
        }

        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Không tìm thấy khóa học.");
        }

        if (!string.IsNullOrWhiteSpace(request.Code) && !string.Equals(course.Code, request.Code, StringComparison.OrdinalIgnoreCase))
        {
            var existingCode = await _courseRepository.GetByCodeAsync(request.Code);
            if (existingCode != null)
            {
                return ApiResponse<CourseDetailResponse>.FailureResult($"Mã khóa học '{request.Code}' đã tồn tại.");
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
            $"{{\"Code\":\"{course.Code}\",\"Name\":\"{course.Name}\",\"IsPublished\":{course.IsPublished}}}"
        );

        var response = new CourseDetailResponse
        {
            Id = course.Id,
            Code = course.Code,
            Name = course.Name,
            Description = course.Description,
            IsPublished = course.IsPublished,
            CreatedDate = course.CreatedDate
        };

        return ApiResponse<CourseDetailResponse>.SuccessResult(response, "Cập nhật khóa học thành công.");
    }

    public async Task<ApiResponse<object>> DeleteCourseAsync(int id, int? adminId)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy khóa học.");
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
            null
        );

        return ApiResponse<object>.SuccessResult(null!, "Xóa khóa học thành công.");
    }

    public async Task<ApiResponse<CourseDetailResponse>> GetByIdAsync(int id)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Không tìm thấy khóa học.");
        }

        var response = new CourseDetailResponse
        {
            Id = course.Id,
            Code = course.Code,
            Name = course.Name,
            Description = course.Description,
            IsPublished = course.IsPublished,
            CreatedDate = course.CreatedDate
        };

        return ApiResponse<CourseDetailResponse>.SuccessResult(response);
    }

    public async Task<ApiResponse<PagedResult<CourseListItemResponse>>> GetPagedAsync(CourseFilterRequest filter, int? studentId)
    {
        List<Course> courses;
        int total;

        if (studentId.HasValue)
        {
            courses = await _courseRepository.GetPagedAssignedToUserAsync(studentId.Value, filter.Keyword, filter.Page, filter.PageSize);
            total = await _courseRepository.GetCountAssignedToUserAsync(studentId.Value, filter.Keyword);
        }
        else
        {
            courses = await _courseRepository.GetPagedAsync(filter.Keyword, filter.IsPublished, filter.Page, filter.PageSize);
            total = await _courseRepository.GetCountAsync(filter.Keyword, filter.IsPublished);
        }

        var items = courses.Select(c => new CourseListItemResponse
        {
            Id = c.Id,
            Code = c.Code,
            Name = c.Name,
            Description = c.Description,
            IsPublished = c.IsPublished
        }).ToList();

        var pagedResult = new PagedResult<CourseListItemResponse>(items, total, filter.Page, filter.PageSize);
        return ApiResponse<PagedResult<CourseListItemResponse>>.SuccessResult(pagedResult);
    }

    public async Task<ApiResponse<CourseDetailResponse>> PublishCourseAsync(int id, bool published, int? adminId)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null)
        {
            return ApiResponse<CourseDetailResponse>.FailureResult("Không tìm thấy khóa học.");
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
            $"{{\"IsPublished\":{published.ToString().ToLower()}}}"
        );

        var response = new CourseDetailResponse
        {
            Id = course.Id,
            Code = course.Code,
            Name = course.Name,
            Description = course.Description,
            IsPublished = course.IsPublished,
            CreatedDate = course.CreatedDate
        };

        return ApiResponse<CourseDetailResponse>.SuccessResult(
            response,
            published ? "Đã publish khóa học thành công." : "Đã unpublish khóa học thành công.");
    }
}
