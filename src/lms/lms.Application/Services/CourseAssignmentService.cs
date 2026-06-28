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

public class CourseAssignmentService : ICourseAssignmentService
{
    private readonly ICourseRepository _courseRepository;
    private readonly IUserRepository _userRepository;
    private readonly IGroupRepository _groupRepository;
    private readonly ICourseAssignmentRepository _courseAssignmentRepository;
    private readonly IGroupCourseAssignmentRepository _groupCourseAssignmentRepository;
    private readonly IAuditLogService _auditLogService;

    public CourseAssignmentService(
        ICourseRepository courseRepository,
        IUserRepository userRepository,
        IGroupRepository groupRepository,
        ICourseAssignmentRepository courseAssignmentRepository,
        IGroupCourseAssignmentRepository groupCourseAssignmentRepository,
        IAuditLogService auditLogService)
    {
        _courseRepository = courseRepository;
        _userRepository = userRepository;
        _groupRepository = groupRepository;
        _courseAssignmentRepository = courseAssignmentRepository;
        _groupCourseAssignmentRepository = groupCourseAssignmentRepository;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResponse<object>> AssignCourseAsync(int courseId, AssignCourseRequest request, int? adminId)
    {
        var course = await _courseRepository.GetByIdAsync(courseId);
        if (course == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy khóa học.");
        }

        var assignedUsersCount = 0;
        var assignedGroupsCount = 0;

        // 1. Assign to Users
        if (request.UserIds != null && request.UserIds.Any())
        {
            foreach (var userId in request.UserIds)
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponse<object>.FailureResult($"Không tìm thấy người dùng với ID {userId}.");
                }

                var existingAssignment = await _courseAssignmentRepository.GetByCourseIdAndUserIdAsync(courseId, userId);
                if (existingAssignment == null)
                {
                    var assignment = new CourseAssignment
                    {
                        CourseId = courseId,
                        UserId = userId
                    };
                    await _courseAssignmentRepository.AddAsync(assignment);
                    assignedUsersCount++;
                }
            }
        }

        // 2. Assign to Groups
        if (request.GroupIds != null && request.GroupIds.Any())
        {
            foreach (var groupId in request.GroupIds)
            {
                var group = await _groupRepository.GetByIdAsync(groupId);
                if (group == null)
                {
                    return ApiResponse<object>.FailureResult($"Không tìm thấy nhóm học viên với ID {groupId}.");
                }

                var existingAssignment = await _groupCourseAssignmentRepository.GetByGroupIdAndCourseIdAsync(groupId, courseId);
                if (existingAssignment == null)
                {
                    var assignment = new GroupCourseAssignment
                    {
                        GroupId = groupId,
                        CourseId = courseId
                    };
                    await _groupCourseAssignmentRepository.AddAsync(assignment);
                    assignedGroupsCount++;
                }
            }
        }

        await _auditLogService.LogActionAsync(
            adminId,
            "ASSIGN_COURSE",
            "Course",
            courseId,
            null,
            $"{{\"AssignedUsersCount\":{assignedUsersCount},\"AssignedGroupsCount\":{assignedGroupsCount}}}"
        );

        return ApiResponse<object>.SuccessResult(null!, "Gán khóa học thành công.");
    }

    public async Task<ApiResponse<object>> RemoveAssignmentAsync(int assignmentId, int? adminId)
    {
        var assignment = await _courseAssignmentRepository.GetByIdAsync(assignmentId);
        if (assignment == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy thông tin gán khóa học.");
        }

        await _courseAssignmentRepository.RemoveAsync(assignment);

        await _auditLogService.LogActionAsync(
            adminId,
            "REMOVE_COURSE_ASSIGNMENT",
            "Course",
            assignment.CourseId,
            $"{{\"UserId\":{assignment.UserId}}}",
            null
        );

        return ApiResponse<object>.SuccessResult(null!, "Hủy gán khóa học thành công.");
    }
}
