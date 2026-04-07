package config

import (
	"time"
	"sync"

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