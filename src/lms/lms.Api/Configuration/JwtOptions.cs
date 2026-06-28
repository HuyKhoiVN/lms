namespace lms.Api.Configuration;

/// <summary>
/// Tham số JWT bind từ section "Jwt" của appsettings.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "lms.Api";
    public string Audience { get; set; } = "lms.WebMvc";

    /// <summary>Thời gian sống access token (phút). Mặc định 60.</summary>
    public int AccessTokenExpiryMinutes { get; set; } = 60;

    /// <summary>Thời gian sống refresh token (ngày). Mặc định 7.</summary>
    public int RefreshTokenExpiryDays { get; set; } = 7;
}
