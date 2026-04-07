// Package constants holds environment variable key names and their defaults.
// Keeping these here avoids scattered magic strings across the codebase.
package constants

// Environment variable key names read by the application.
const (
	EnvRedisAddr         = "REDIS_ADDR"
	EnvRateLimiterAlgo   = "RATE_LIMITER_ALGO"
	EnvRateLimiterLimit  = "RATE_LIMITER_LIMIT"
	EnvRateLimiterWindow = "RATE_LIMITER_WINDOW_SECS"
	EnvRateLimiterRefill = "RATE_LIMITER_REFILL_RATE"
)

// Default values for the above environment variables.
const (
	DefaultRedisAddr     = "redis:6379"
	DefaultAlgo          = AlgoSlidingWindow
	DefaultLimitEnv      = 100
	DefaultWindowSecsEnv = 60
	DefaultRefillRate    = 1.0
)

// Server constants.
const (
	ServerListenAddr = ":8080"
)

// Redis key prefixes — must stay in sync with the limiter implementations.
const (
	RedisKeyPrefixFixedWindow   = "fw:*"
	RedisKeyPrefixSlidingWindow = "sw:*"
	RedisKeyPrefixTokenBucket   = "tb:*"
)
