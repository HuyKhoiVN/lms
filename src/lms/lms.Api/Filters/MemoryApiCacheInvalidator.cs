using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Caching.Memory;

namespace lms.Api.Filters;

public sealed class MemoryApiCacheInvalidator : IApiCacheInvalidator
{
    private readonly IMemoryCache _cache;
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _keysByTag = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, HashSet<string>> _tagsByKey = new(StringComparer.Ordinal);

    public MemoryApiCacheInvalidator(IMemoryCache cache)
    {
        _cache = cache;
    }

    public bool TryGet(string key, out CachedApiResponse? response)
    {
        if (_cache.TryGetValue(key, out CachedApiResponse? cachedResponse))
        {
            response = cachedResponse;
            return true;
        }

        response = null;
        RemoveKeyFromRegistry(key);
        return false;
    }

    public void Set(string key, CachedApiResponse response, int ttlSeconds, IEnumerable<string> tags)
    {
        var normalizedTags = tags
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Select(tag => tag.Trim().ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        RemoveKeyFromRegistry(key);

        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(Math.Max(1, ttlSeconds))
        };

        options.RegisterPostEvictionCallback((evictedKey, _, _, _) =>
        {
            if (evictedKey is string cacheKey)
            {
                RemoveKeyFromRegistry(cacheKey);
            }
        });

        _cache.Set(key, response, options);
        _tagsByKey[key] = normalizedTags.ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var tag in normalizedTags)
        {
            var keys = _keysByTag.GetOrAdd(tag, _ => new ConcurrentDictionary<string, byte>(StringComparer.Ordinal));
            keys[key] = 0;
        }
    }

    public void ClearByTags(IEnumerable<string> tags)
    {
        var normalizedTags = tags
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Select(tag => tag.Trim().ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        foreach (var tag in normalizedTags)
        {
            if (!_keysByTag.TryRemove(tag, out var keys))
            {
                continue;
            }

            foreach (var key in keys.Keys)
            {
                _cache.Remove(key);
                RemoveKeyFromRegistry(key);
            }
        }
    }

    public void ClearAll()
    {
        var keys = _tagsByKey.Keys.ToArray();
        foreach (var key in keys)
        {
            _cache.Remove(key);
            RemoveKeyFromRegistry(key);
        }
    }

    private void RemoveKeyFromRegistry(string key)
    {
        if (!_tagsByKey.TryRemove(key, out var tags))
        {
            return;
        }

        foreach (var tag in tags)
        {
            if (!_keysByTag.TryGetValue(tag, out var keys))
            {
                continue;
            }

            keys.TryRemove(key, out _);
            if (keys.IsEmpty)
            {
                _keysByTag.TryRemove(tag, out _);
            }
        }
    }
}
