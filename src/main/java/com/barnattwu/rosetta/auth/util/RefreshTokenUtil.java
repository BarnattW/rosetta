package com.barnattwu.rosetta.auth.util;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenUtil {
    @Value("${jwt.refreshExpiration}")
    private long refreshExpiration;

    private final StringRedisTemplate redisTemplate;

    public RefreshTokenUtil(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    public void storeRefreshToken(String token, UUID userId) {
        redisTemplate.opsForValue().set("refresh" + userId.toString(), token, refreshExpiration);
    }

    public boolean validateRefreshToken(String token, UUID userId) {
        String storedToken = redisTemplate.opsForValue().get("refresh" + userId.toString());
        return token.equals(storedToken);
    }

    public void revokeRefreshToken(UUID userId) {
        redisTemplate.delete("refresh" + userId.toString());
    }
}
