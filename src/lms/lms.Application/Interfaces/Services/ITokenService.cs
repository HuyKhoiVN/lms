using System.Collections.Generic;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user, List<string> roles);
    string GenerateRefreshToken();
}
