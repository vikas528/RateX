package common

import (
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/vikas528/RateX/config"
	"github.com/vikas528/RateX/limiter"
)

func BuildLimiter(redisClient *redis.Client, config *config.AppConfig) limiter.Limiter {
	window := time.Duration(config.WindowSecs) * time.Second
	switch config.Algo {
	case "fixed_window":
		return limiter.NewFixedWindow(redisClient, config.Limit, window)
	case "token_bucket":
		return limiter.NewTokenBucket(redisClient, config.Limit, config.RefillRate)

	default:
		return limiter.NewSlidingWindow(redisClient, config.Limit, window)
	}
}