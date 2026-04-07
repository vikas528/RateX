package config

import (
	"github.com/vikas528/RateX/constants"
	"github.com/vikas528/RateX/utils"
)

// AppConfig holds the active rate-limiter configuration.
// Values come from environment variables at startup and can be hot-swapped
// at runtime via the /ratex/config endpoint.
type AppConfig struct {
	Algo       string  `json:"algo"`
	Limit      int     `json:"limit"`
	WindowSecs int     `json:"window_seconds"`
	RefillRate float64 `json:"refill_rate"` // tokens/sec — token_bucket only
}

// InitDefaultConfig reads rate-limiter settings from environment variables,
// falling back to the defaults declared in constants/env.go.
func InitDefaultConfig() *AppConfig {
	return &AppConfig{
		Algo:       utils.EnvOr(constants.EnvRateLimiterAlgo, constants.DefaultAlgo),
		Limit:      utils.EnvIntOr(constants.EnvRateLimiterLimit, constants.DefaultLimitEnv),
		WindowSecs: utils.EnvIntOr(constants.EnvRateLimiterWindow, constants.DefaultWindowSecsEnv),
		RefillRate: utils.EnvFloatOr(constants.EnvRateLimiterRefill, constants.DefaultRefillRate),
	}
}
