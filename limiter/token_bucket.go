package limiter

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/redis/go-redis/v9"
)

type TokenBucket struct {
	client     *redis.Client
	capacity   float64
    refillRate float64 // tokens per second
}

// Lua script runs atomically on Redis — no race conditions possible
var tokenBucketScript = redis.NewScript(`
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local data = redis.call("HMGET", key, "tokens", "last_refill")
local tokens = tonumber(data[1]) or capacity
local last_refill = tonumber(data[2]) or now

-- Calculate how many tokens have accumulated since last request
local elapsed = now - last_refill
local new_tokens = math.min(capacity, tokens + elapsed * refill_rate)

if new_tokens >= 1 then
    redis.call("HMSET", key, "tokens", new_tokens - 1, "last_refill", now)
    redis.call("EXPIRE", key, 3600)
    return {1, math.floor(new_tokens - 1)}  -- allowed, remaining
else
    redis.call("HMSET", key, "tokens", new_tokens, "last_refill", now)
    redis.call("EXPIRE", key, 3600)
    return {0, 0}  -- blocked
end
`)

func NewTokenBucket(client *redis.Client, capacity int, refillRate float64) *TokenBucket {
	return &TokenBucket{client: client, capacity: float64(capacity), refillRate: refillRate}
}	

func (tb *TokenBucket) Allow(context context.Context, key string) (bool, int, error) {
	redisKey := fmt.Sprintf("tb:%s", key)

	now := float64(time.Now().UnixNano()) / 1e9 // seconds as float

	result, err := tokenBucketScript.Run(
		context, 
		tb.client, 
		[]string{redisKey}, 
		tb.capacity, 
		tb.refillRate, 
		math.Round(now*1000)/1000,
	).Int64Slice()

	if err != nil {
		return false, 0, err
	}

	return result[0] == 1, int(result[1]), nil
}