package config

import (
	"github.com/vikas528/RateX/utils"
)

type AppConfig struct {
	Algo       string  `json:"algo"`
	Limit      int     `json:"limit"`
	WindowSecs int     `json:"window_seconds"`
	RefillRate float64 `json:"refill_rate"` // tokens/sec — token_bucket only
}


func InitDefaultConfig() *AppConfig {
	return &AppConfig{
		Algo:       utils.EnvOr("RATE_LIMITER_ALGO", "fixed_window"),
		Limit:      utils.EnvIntOr("RATE_LIMITER_LIMIT", 100),
		WindowSecs: utils.EnvIntOr("RATE_LIMITER_WINDOW_SECS", 60),
		RefillRate: utils.EnvFloatOr("RATE_LIMITER_REFILL_RATE", 1.0),
	}
}