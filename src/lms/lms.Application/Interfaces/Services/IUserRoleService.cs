using System.Threading.Tasks;

namespace lms.Application.Interfaces.Services;

public interface IUserRoleService
{
    Task AssignRoleAsync(int userId, string roleName);
    Task RemoveRoleAsync(int userId, string roleName);
}
