namespace lms.Domain.Enums;

/// <summary>
/// Trạng thái của ExamAttempt.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 10 Exam Engine.
/// </summary>
public static class AttemptStatus
{
    public const string InProgress   = "InProgress";
    public const string Submitted    = "Submitted";
    public const string AutoSubmitted = "AutoSubmitted";
}
