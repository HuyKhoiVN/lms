using System;
using lms.Application.Common.Time;

namespace lms.Infrastructure.Services;

/// <summary>
/// Mặc định trả về thời gian hệ thống UTC. Có thể swap bằng stub trong unit test
/// thông qua <see cref="IClock"/>.
/// </summary>
public sealed class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
    public DateTimeOffset UtcNowOffset => DateTimeOffset.UtcNow;
}
