namespace lms.Application.Interfaces.Services;

public interface IPasswordHasherService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hashedPassword);
}
