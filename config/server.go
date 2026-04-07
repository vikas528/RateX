package config

import (
	"context"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/vikas528/RateX/limiter"
)

type Server struct {
	config 	*AppConfig
	client 	*redis.Client
	mu     	sync.RWMutex
	limiter limiter.Limiter
}

func InitServer(config *AppConfig, client *redis.Client, limiter limiter.Limiter) *Server {
	return &Server{
		config: config,
		client: client,
		limiter: limiter,
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

func (s *Server) SetLimitAndConfig(limiter limiter.Limiter, newConfig *AppConfig) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.limiter = limiter
	s.config = newConfig
}

func (s *Server) FlushAllKeys() {
	ctx := context.Background()
	for _, pattern := range []string{"fw:*", "sw:*", "tb:*"} {
		keys, _ := s.client.Keys(ctx, pattern).Result()
		if len(keys) > 0 {
			s.client.Del(ctx, keys...)
		}
	}
}