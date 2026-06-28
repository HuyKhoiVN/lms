namespace lms.Application.DTOs.Identity;

/// <summary>
/// Thông tin user hiện tại lấy từ JWT claims.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 1 Identity - DTO.
/// </summary>
public sealed class CurrentUserResponse
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
