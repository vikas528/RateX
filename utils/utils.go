package utils

import (
	"encoding/json"
	"net/http"
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

func EnvFloatOr(key string, defaultValue float64) float64 {
	if v:= os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil && f > 0 {
			return f
		}
	}
	return defaultValue
}

func JsonResponse(resw http.ResponseWriter, status int, data any) {
	resw.Header().Set("Content-Type", "application/json")
	resw.WriteHeader(status)
	json.NewEncoder(resw).Encode(data)
}