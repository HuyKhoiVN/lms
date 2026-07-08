using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(User user, List<string> roles)
    {
        var secret = _configuration["Jwt:Secret"] ?? "this_is_a_very_secret_key_for_lms_api_development_2026_06_25";
        var issuer = _configuration["Jwt:Issuer"] ?? "lms.Api";
        var audience = _configuration["Jwt:Audience"] ?? "lms.WebMvc";
        var expiryMinutesStr = _configuration["Jwt:AccessTokenExpiryMinutes"] ?? _configuration["Jwt:ExpiryMinutes"] ?? "60";
        if (!double.TryParse(expiryMinutesStr, out double expiryMinutes) || expiryMinutes <= 0)
        {
            expiryMinutes = 60;
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new("FullName", user.FullName ?? string.Empty)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}
