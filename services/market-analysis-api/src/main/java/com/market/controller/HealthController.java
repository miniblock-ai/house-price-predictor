package com.market.controller;

import com.market.dto.ApiResponse;
import com.market.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired(required = false)
    private CacheManager cacheManager;

    @GetMapping("/api/v1/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> data = new HashMap<>();
        data.put("status", propertyRepository.isLoaded() ? "healthy" : "unhealthy");
        data.put("dataset_loaded", propertyRepository.isLoaded());
        data.put("dataset_size", propertyRepository.findAll().size());

        if (cacheManager != null) {
            var cache = cacheManager.getCache("statistics");
            if (cache != null && cache.getNativeCache() instanceof com.github.benmanes.caffeine.cache.Cache<?, ?> caffeineCache) {
                var stats = caffeineCache.stats();
                data.put("cache_hit_ratio", Math.round(stats.hitRate() * 100.0) / 100.0);
            } else {
                data.put("cache_hit_ratio", 0.0);
            }
        }

        return ApiResponse.success(data);
    }
}
