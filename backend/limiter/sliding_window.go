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

// Lua script executes atomically: remove stale entries, count, then conditionally
// add the new request ONLY if the count is within the limit.
// Previously the pipeline always called ZAdd before checking, which meant blocked
// requests were still recorded in the sorted set and inflated visualizer counts.
var slidingWindowScript = redis.NewScript(`
local key          = KEYS[1]
local window_start = ARGV[1]
local now_score    = ARGV[2]
local limit        = tonumber(ARGV[3])
local window_secs  = tonumber(ARGV[4])

redis.call("ZREMRANGEBYSCORE", key, "0", window_start)
local count = tonumber(redis.call("ZCARD", key))

if count < limit then
    redis.call("ZADD", key, now_score, now_score)
    redis.call("EXPIRE", key, window_secs)
    return {1, limit - count - 1}
else
    return {0, 0}
end
`)

func NewSlidingWindow(client *redis.Client, limit int, window time.Duration) *SlidingWindow {
	return &SlidingWindow{client: client, limit: limit, window: window}
}

func (sw *SlidingWindow) Allow(ctx context.Context, key string) (bool, int, error) {
	now := time.Now()
	windowStart := fmt.Sprintf("%f", float64(now.Add(-sw.window).UnixNano())/1e9)
	nowScore := fmt.Sprintf("%f", float64(now.UnixNano())/1e9)
	redisKey := fmt.Sprintf("sw:%s", key)

	result, err := slidingWindowScript.Run(
		ctx,
		sw.client,
		[]string{redisKey},
		windowStart,
		nowScore,
		sw.limit,
		int(sw.window.Seconds()),
	).Int64Slice()

	if err != nil {
		return false, 0, err
	}

	return result[0] == 1, int(result[1]), nil
}
