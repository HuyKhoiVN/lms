using System;

namespace lms.Api.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class ApiCacheAttribute : Attribute
{
    public int TtlSeconds { get; set; }

    public string[] Tags { get; set; } = Array.Empty<string>();
}
