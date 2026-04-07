package config

import (
	"github.com/vikas528/RateX/utils"
)

type AppConfig struct {
	Algo       string  `json:"algo"`
	Limit      int     `json:"limit"`
	WindowSecs int     `json:"window_seconds"`
}


func InitDefaultConfig() *AppConfig {
	return &AppConfig{
		Algo:       utils.EnvOr("RATE_LIMITER_ALGO", "fixed_window"),
		Limit:      utils.EnvIntOr("RATE_LIMITER_LIMIT", 100),
		WindowSecs: utils.EnvIntOr("RATE_LIMITER_WINDOW_SECS", 60),
	}
}