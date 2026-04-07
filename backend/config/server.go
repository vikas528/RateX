package config

import (
	"context"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/vikas528/RateX/constants"
	"github.com/vikas528/RateX/limiter"
)

// Server holds shared, concurrency-safe state: the active AppConfig, the Redis
// client, and the current Limiter implementation.
type Server struct {
	config  *AppConfig
	client  *redis.Client
	mu      sync.RWMutex
	limiter limiter.Limiter
}

func InitServer(cfg *AppConfig, client *redis.Client, l limiter.Limiter) *Server {
	return &Server{
		config:  cfg,
		client:  client,
		limiter: l,
	}
}

func (s *Server) GetConfig() *AppConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config
}

func (s *Server) GetLimiterConfig() (limiter.Limiter, time.Duration) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.limiter, time.Duration(s.config.WindowSecs) * time.Second
}

func (s *Server) GetRedisClient() *redis.Client {
	return s.client
}

func (s *Server) SetLimitAndConfig(l limiter.Limiter, newConfig *AppConfig) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.limiter = l
	s.config = newConfig
}

// FlushAllKeys removes every rate-limiter key from Redis so the new config
// starts with a clean slate. Patterns come from constants to stay in sync with
// the limiter implementations.
func (s *Server) FlushAllKeys() {
	ctx := context.Background()
	for _, pattern := range []string{
		constants.RedisKeyPrefixFixedWindow,
		constants.RedisKeyPrefixSlidingWindow,
		constants.RedisKeyPrefixTokenBucket,
	} {
		keys, _ := s.client.Keys(ctx, pattern).Result()
		if len(keys) > 0 {
			s.client.Del(ctx, keys...)
		}
	}
}
