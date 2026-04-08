package utils

import (
	"encoding/json"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
)

func EnvOr(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

func EnvIntOr(key string, defaultValue int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultValue
}

func EnvFloatOr(key string, defaultValue float64) float64 {
	if v := os.Getenv(key); v != "" {
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

// ClientIP extracts the real client IP from the request.
// When behind a single trusted reverse proxy (Render, nginx), the proxy appends
// the real client IP to X-Forwarded-For; we take the rightmost entry, which is
// appended by our trusted proxy and cannot be spoofed by the client.
// Falls back to RemoteAddr when the header is absent (direct / Docker Compose).
func ClientIP(req *http.Request) string {
	if forwarded := req.Header.Get("X-Forwarded-For"); forwarded != "" {
		parts := strings.Split(forwarded, ",")
		// Rightmost: appended by our trusted proxy, not client-controlled
		if ip := strings.TrimSpace(parts[len(parts)-1]); ip != "" {
			return ip
		}
	}
	ip, _, err := net.SplitHostPort(req.RemoteAddr)
	if err != nil {
		return req.RemoteAddr
	}
	return ip
}
