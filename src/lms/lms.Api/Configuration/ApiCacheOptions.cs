using System.Collections.Generic;

namespace lms.Api.Configuration;

public sealed class ApiCacheOptions
{
    public const string SectionName = "ApiCache";

    public bool Enabled { get; set; } = true;

    public int DefaultTtlSeconds { get; set; } = 300;

    public Dictionary<string, int> RouteTtlSeconds { get; set; } = new();
}
