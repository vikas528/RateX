// Package constants holds error message strings used across the backend.
// Using named constants prevents typos and makes global renames trivial.
package constants

// HTTP error message strings returned in JSON error responses.
const (
	ErrMethodNotAllowed  = "method not allowed"
	ErrInvalidJSON       = "invalid JSON"
	ErrInvalidProductID  = "invalid product id"
	ErrProductNotFound   = "product not found"
	ErrProductOutOfStock = "product is out of stock"
	ErrCategoryRequired  = "category query param is required"
	ErrProductIDRequired = "product_id is required"
	ErrRateLimiter       = "rate limiter error"
	ErrRateLimitExceeded = "rate limit exceeded"
	ErrInvalidAlgo       = "algo must be fixed_window, sliding_window, or token_bucket"
	ErrLimitOutOfRange   = "limit must be between 1 and 500"
	ErrWindowOutOfRange  = "window_seconds must be between 1 and 120"
	ErrRefillRateRange   = "refill_rate must be between 0.1 and 50"
)

// Valid algorithm identifiers.
const (
	AlgoFixedWindow   = "fixed_window"
	AlgoSlidingWindow = "sliding_window"
	AlgoTokenBucket   = "token_bucket"
)

// Default values used when a config field is missing or invalid.
const (
	DefaultLimit      = 10
	DefaultWindowSecs = 60
)

// ── Config parameter bounds ───────────────────────────────────────────────────
// These are enforced by HandleUpdateConfig and mirror the frontend input limits
// in ConfigPanel so that the UI and API always agree on valid ranges.
const (
	MinLimit      = 1
	MaxLimit      = 500
	MinWindowSecs = 1
	MaxWindowSecs = 120
	MinRefillRate = 0.1
	MaxRefillRate = 50.0
)
