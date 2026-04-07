package utils

import (
	"os"
	"strconv"
)


func EnvOr(key, defaultValue string) string {
	if v:= os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

func EnvIntOr(key string, defaultValue int) int {
	if v:= os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultValue
}