using System;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;

namespace lms.Application.Services;

public class FileAccessService : IFileAccessService
{
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IFileRecordRepository _fileRecordRepository;
    private readonly ICourseRepository _courseRepository;

    public FileAccessService(
        IUserRoleRepository userRoleRepository,
        IFileRecordRepository fileRecordRepository,
        ICourseRepository courseRepository)
    {
        _userRoleRepository = userRoleRepository;
        _fileRecordRepository = fileRecordRepository;
        _courseRepository = courseRepository;
    }

    public async Task<bool> HasAccessAsync(int userId, string fileKey)
    {
        var roles = await _userRoleRepository.GetRolesByUserIdAsync(userId);
        if (roles.Contains("Admin"))
        {
            return true;
        }

        var fileRecord = await _fileRecordRepository.GetByKeyAsync(fileKey);
        if (fileRecord == null)
        {
            return false;
        }

        if (string.Equals(fileRecord.Purpose, "Certificate", StringComparison.OrdinalIgnoreCase))
        {
            // Certificates are not generated in Phase 2 yet, so students are forbidden
            return false;
        }

        if (string.Equals(fileRecord.Purpose, "LearningMaterial", StringComparison.OrdinalIgnoreCase))
        {
            // In Phase 2, a student is allowed to download learning material files if they are assigned to at least one course
            var assignedCount = await _courseRepository.GetCountAssignedToUserAsync(userId, null);
            return assignedCount > 0;
        }

        if (string.Equals(fileRecord.Purpose, "Report", StringComparison.OrdinalIgnoreCase))
        {
            // Reports are Admin only
            return false;
        }

        return true; 
    }
}
