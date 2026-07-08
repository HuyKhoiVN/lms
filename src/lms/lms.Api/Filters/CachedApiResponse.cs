namespace lms.Api.Filters;

public sealed class CachedApiResponse
{
    public int? StatusCode { get; set; }

    public object? Value { get; set; }
}
