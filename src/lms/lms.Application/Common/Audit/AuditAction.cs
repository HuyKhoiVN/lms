namespace lms.Application.Common.Audit;

/// <summary>
/// Các hành động audit được chuẩn hóa theo doc/17_BACKEND_MODULE_DESIGN/README.md - "Audit logging chung".
/// Dùng các hằng số này thay cho chuỗi tùy hứng để giữ tính nhất quán giữa các module.
/// </summary>
public static class AuditAction
{
    // Identity / User
    public const string Login = "LOGIN";
    public const string LoginFailed = "LOGIN_FAILED";
    public const string LoginLocked = "LOGIN_LOCKED";
    public const string Logout = "LOGOUT";
    public const string RefreshToken = "REFRESH_TOKEN";
    public const string ChangePassword = "CHANGE_PASSWORD";
    public const string ResetPassword = "RESET_PASSWORD";

    // CRUD chung
    public const string Create = "CREATE";
    public const string Update = "UPDATE";
    public const string Delete = "DELETE";

    // User state
    public const string Lock = "LOCK";
    public const string Unlock = "UNLOCK";

    // Assignment
    public const string Assign = "ASSIGN";
    public const string RemoveAssignment = "REMOVE_ASSIGNMENT";

    // Publish
    public const string Publish = "PUBLISH";
    public const string Unpublish = "UNPUBLISH";

    // Exam runtime
    public const string StartExam = "START_EXAM";
    public const string AutosaveExam = "AUTOSAVE_EXAM";
    public const string SubmitExam = "SUBMIT_EXAM";
    public const string AutoSubmitExam = "AUTO_SUBMIT_EXAM";
    public const string Rescore = "RESCORE";

    // Certificate
    public const string GenerateCertificate = "GENERATE_CERTIFICATE";
    public const string DownloadCertificate = "DOWNLOAD_CERTIFICATE";

    // Reporting / File
    public const string ExportReport = "EXPORT_REPORT";
    public const string UploadFile = "UPLOAD_FILE";
    public const string DownloadFile = "DOWNLOAD_FILE";
    public const string DeleteFile = "DELETE_FILE";
}
