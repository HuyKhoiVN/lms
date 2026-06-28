using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Exams;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

/// <summary>
/// Business rules theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 9:
/// - Không duplicate assignment.
/// - Chỉ assign exam tồn tại và không bị xóa.
/// - Remove assignment không xóa attempt/result đã có.
/// </summary>
public sealed class ExamAssignmentService : IExamAssignmentService
{
    private readonly IExamAssignmentRepository _assignRepo;
    private readonly IGroupExamAssignmentRepository _groupRepo;
    private readonly ICourseExamRepository _courseExamRepo;
    private readonly IExamRepository _examRepo;
    private readonly IUserRepository _userRepo;
    private readonly IGroupRepository _groupRepo2;
    private readonly ICourseRepository _courseRepo;
    private readonly IAuditLogService _audit;

    public ExamAssignmentService(
        IExamAssignmentRepository assignRepo,
        IGroupExamAssignmentRepository groupRepo,
        ICourseExamRepository courseExamRepo,
        IExamRepository examRepo,
        IUserRepository userRepo,
        IGroupRepository groupRepo2,
        ICourseRepository courseRepo,
        IAuditLogService audit)
    {
        _assignRepo = assignRepo;
        _groupRepo = groupRepo;
        _courseExamRepo = courseExamRepo;
        _examRepo = examRepo;
        _userRepo = userRepo;
        _groupRepo2 = groupRepo2;
        _courseRepo = courseRepo;
        _audit = audit;
    }

    public async Task<ApiResponse<object>> AssignExamAsync(int examId, AssignExamRequest request, int? adminId)
    {
        var exam = await _examRepo.GetByIdAsync(examId);
        if (exam is null) return ApiResponse<object>.FailureResult("Không tìm thấy bài thi.");

        int usersAssigned = 0, groupsAssigned = 0;

        // User assignments
        if (request.UserIds is { Count: > 0 })
        {
            foreach (var uid in request.UserIds)
            {
                var user = await _userRepo.GetByIdAsync(uid);
                if (user is null) return ApiResponse<object>.FailureResult($"Không tìm thấy user {uid}.");

                var dup = await _assignRepo.GetByExamAndUserAsync(examId, uid);
                if (dup is null)
                {
                    await _assignRepo.AddAsync(new ExamAssignment
                    {
                        ExamId = examId, UserId = uid,
                        StartDate = request.StartDate, EndDate = request.EndDate
                    });
                    usersAssigned++;
                }
            }
        }

        // Group assignments
        if (request.GroupIds is { Count: > 0 })
        {
            foreach (var gid in request.GroupIds)
            {
                var group = await _groupRepo2.GetByIdAsync(gid);
                if (group is null) return ApiResponse<object>.FailureResult($"Không tìm thấy nhóm {gid}.");

                var dup = await _groupRepo.GetByExamAndGroupAsync(examId, gid);
                if (dup is null)
                {
                    await _groupRepo.AddAsync(new GroupExamAssignment
                    {
                        ExamId = examId, GroupId = gid,
                        StartDate = request.StartDate, EndDate = request.EndDate
                    });
                    groupsAssigned++;
                }
            }
        }

        await _audit.LogActionAsync(adminId, "ASSIGN", "Exam", examId,
            null, $"{{\"UsersAssigned\":{usersAssigned},\"GroupsAssigned\":{groupsAssigned}}}");

        return ApiResponse<object>.SuccessResult(null!,
            $"Gán bài thi thành công. Users: {usersAssigned}, Groups: {groupsAssigned}.");
    }

    public async Task<ApiResponse<object>> RemoveUserAssignmentAsync(int assignmentId, int? adminId)
    {
        var a = await _assignRepo.GetByIdAsync(assignmentId);
        if (a is null) return ApiResponse<object>.FailureResult("Không tìm thấy assignment.");

        await _assignRepo.RemoveAsync(a);
        await _audit.LogActionAsync(adminId, "REMOVE_ASSIGNMENT", "ExamAssignment", assignmentId,
            $"{{\"ExamId\":{a.ExamId},\"UserId\":{a.UserId}}}", null);

        return ApiResponse<object>.SuccessResult(null!, "Hủy gán bài thi thành công.");
    }

    public async Task<ApiResponse<object>> RemoveGroupAssignmentAsync(int assignmentId, int? adminId)
    {
        var a = await _groupRepo.GetByIdAsync(assignmentId);
        if (a is null) return ApiResponse<object>.FailureResult("Không tìm thấy group assignment.");

        await _groupRepo.RemoveAsync(a);
        await _audit.LogActionAsync(adminId, "REMOVE_ASSIGNMENT", "GroupExamAssignment", assignmentId,
            $"{{\"ExamId\":{a.ExamId},\"GroupId\":{a.GroupId}}}", null);

        return ApiResponse<object>.SuccessResult(null!, "Hủy gán bài thi cho nhóm thành công.");
    }

    public async Task<ApiResponse<PagedResult<ExamAssignmentResponse>>> GetAssignmentsAsync(ExamAssignmentFilterRequest filter)
    {
        List<ExamAssignment> list;
        if (filter.ExamId.HasValue)
            list = await _assignRepo.GetByExamIdAsync(filter.ExamId.Value);
        else if (filter.UserId.HasValue)
            list = await _assignRepo.GetByUserIdAsync(filter.UserId.Value);
        else
            return ApiResponse<PagedResult<ExamAssignmentResponse>>.FailureResult("Cần filter theo ExamId hoặc UserId.");

        var page = filter.Page < 1 ? 1 : filter.Page;
        var size = filter.PageSize is < 1 or > 200 ? 20 : filter.PageSize;

        var paged = list.Skip((page - 1) * size).Take(size).ToList();
        var items = paged.Select(a => new ExamAssignmentResponse
        {
            Id = a.Id, ExamId = a.ExamId, UserId = a.UserId,
            StartDate = a.StartDate, EndDate = a.EndDate
        }).ToList();

        return ApiResponse<PagedResult<ExamAssignmentResponse>>.SuccessResult(
            new PagedResult<ExamAssignmentResponse>(items, list.Count, page, size));
    }

    public async Task<ApiResponse<CourseExamResponse>> AddCourseExamAsync(int courseId, AddCourseExamRequest request, int? adminId)
    {
        var course = await _courseRepo.GetByIdAsync(courseId);
        if (course is null) return ApiResponse<CourseExamResponse>.FailureResult("Không tìm thấy khóa học.");

        var exam = await _examRepo.GetByIdAsync(request.ExamId);
        if (exam is null) return ApiResponse<CourseExamResponse>.FailureResult("Không tìm thấy bài thi.");

        var dup = await _courseExamRepo.GetByCourseAndExamAsync(courseId, request.ExamId);
        if (dup != null) return ApiResponse<CourseExamResponse>.FailureResult("Bài thi đã có trong khóa học này.");

        var ce = new CourseExam { CourseId = courseId, ExamId = request.ExamId, Order = request.Order };
        await _courseExamRepo.AddAsync(ce);

        await _audit.LogActionAsync(adminId, "ASSIGN", "CourseExam", courseId,
            null, $"{{\"ExamId\":{request.ExamId}}}");

        return ApiResponse<CourseExamResponse>.SuccessResult(new CourseExamResponse
        {
            Id = ce.Id, CourseId = ce.CourseId, ExamId = ce.ExamId,
            ExamName = exam.Name, Order = ce.Order
        }, "Thêm bài thi vào khóa học thành công.");
    }

    public async Task<ApiResponse<object>> RemoveCourseExamAsync(int courseId, int examId, int? adminId)
    {
        var ce = await _courseExamRepo.GetByCourseAndExamAsync(courseId, examId);
        if (ce is null) return ApiResponse<object>.FailureResult("Không tìm thấy liên kết bài thi trong khóa học.");

        await _courseExamRepo.RemoveAsync(ce);
        await _audit.LogActionAsync(adminId, "REMOVE_ASSIGNMENT", "CourseExam", courseId,
            $"{{\"ExamId\":{examId}}}", null);

        return ApiResponse<object>.SuccessResult(null!, "Xóa bài thi khỏi khóa học thành công.");
    }
}
