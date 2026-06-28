using System.Threading.Tasks;

namespace lms.Application.Interfaces.Services;

public interface ICourseAccessService
{
    Task<bool> HasAccessAsync(int studentId, int courseId);
}
