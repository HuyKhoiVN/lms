using System;

namespace lms.Api.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class NoApiCacheAttribute : Attribute
{
}
