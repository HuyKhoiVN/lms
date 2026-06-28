using System.Threading.Tasks;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public class UserRoleService : IUserRoleService
{
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IRoleRepository _roleRepository;

    public UserRoleService(IUserRoleRepository userRoleRepository, IRoleRepository roleRepository)
    {
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
    }

    public async Task AssignRoleAsync(int userId, string roleName)
    {
        var role = await _roleRepository.GetByNameAsync(roleName);
        if (role == null)
        {
            role = new Role 
            { 
                Name = roleName, 
                Description = $"System-defined role: {roleName}" 
            };
            await _roleRepository.AddAsync(role);
        }

        var existingUserRole = await _userRoleRepository.GetByUserIdAndRoleIdAsync(userId, role.Id);
        if (existingUserRole == null)
        {
            var userRole = new UserRole
            {
                UserId = userId,
                RoleId = role.Id
            };
            await _userRoleRepository.AddAsync(userRole);
        }
    }

    public async Task RemoveRoleAsync(int userId, string roleName)
    {
        var role = await _roleRepository.GetByNameAsync(roleName);
        if (role != null)
        {
            var userRole = await _userRoleRepository.GetByUserIdAndRoleIdAsync(userId, role.Id);
            if (userRole != null)
            {
                await _userRoleRepository.RemoveAsync(userRole);
            }
        }
    }
}
