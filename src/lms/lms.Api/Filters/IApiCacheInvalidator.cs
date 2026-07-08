using System.Collections.Generic;

namespace lms.Api.Filters;

public interface IApiCacheInvalidator
{
    bool TryGet(string key, out CachedApiResponse? response);

    void Set(string key, CachedApiResponse response, int ttlSeconds, IEnumerable<string> tags);

    void ClearByTags(IEnumerable<string> tags);

    void ClearAll();
}
