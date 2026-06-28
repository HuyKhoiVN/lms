using System;

namespace lms.Application.Common.Time;

/// <summary>
/// Trừu tượng nguồn thời gian để service không phụ thuộc trực tiếp <see cref="DateTime.UtcNow"/>.
/// Dễ test, dễ stub trong unit test.
/// </summary>
public interface IClock
{
    /// <summary>UTC thời điểm hiện tại.</summary>
    DateTime UtcNow { get; }

    /// <summary>UTC thời điểm hiện tại dưới dạng <see cref="DateTimeOffset"/>.</summary>
    DateTimeOffset UtcNowOffset { get; }
}
