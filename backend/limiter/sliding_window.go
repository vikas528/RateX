package limiter

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type SlidingWindow struct {
	client *redis.Client
	limit  int
	window time.Duration
}

func NewSlidingWindow(client *redis.Client, limit int, window time.Duration) *SlidingWindow {
	return &SlidingWindow{client: client, limit: limit, window: window}
}

func (sw *SlidingWindow) Allow(ctx context.Context, key string) (bool, int, error) {
	now := time.Now()
	windowStart := float64(now.Add(-sw.window).UnixNano()) / 1e9 // seconds as float
	nowScore := float64(now.UnixNano()) / 1e9
	redisKey := fmt.Sprintf("sw:%s", key)

	// Redis pipeline to excute multiple commands atomically
	pipe := sw.client.Pipeline()
	pipe.ZRemRangeByScore(ctx, redisKey, "0", fmt.Sprintf("%f", windowStart)) // Remove old entries
	countCmd := pipe.ZCard(ctx, redisKey) // Get current count
	pipe.ZAdd(ctx, redisKey, redis.Z{Score: nowScore, Member: nowScore}) // Add current request
	pipe.Expire(ctx, redisKey, sw.window) // Set expiration for the key

	_, err := pipe.Exec(ctx)
	if err != nil {
		return false, 0, err
	}

	count := countCmd.Val() // Since we added the current request, we check if count is within limit
	remaining := sw.limit - int(count) - 1 // -1 for the current request
	if remaining < 0 {
		remaining = 0
	}

	return count < int64(sw.limit), remaining, nil
}