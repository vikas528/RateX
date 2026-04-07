package limiter

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type FixedWindow struct {
	client *redis.Client
	limit int
	window time.Duration
}

func NewFixedWindow(client *redis.Client, limit int, window time.Duration) *FixedWindow {
	return &FixedWindow{client: client, limit: limit, window: window}
}

func (fw *FixedWindow) Allow(ctx context.Context, key string) (bool, error) {
	bucket := time.Now().Truncate(fw.window).Unix()
	redisKey := fmt.Sprintf("fw:%s:%d", key, bucket)

	count, err := fw.client.Incr(ctx, redisKey).Result()

	if err != nil {
		return false, err
	}

	if count == 1 {
		fw.client.Expire(ctx, redisKey, fw.window)
	}

	return count <= int64(fw.limit), nil
}