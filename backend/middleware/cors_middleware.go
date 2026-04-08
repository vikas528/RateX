package middleware

import (
	"net/http"

	"github.com/vikas528/RateX/utils"
)

func CorsMiddleware(next http.Handler) http.Handler {
	// Resolved once at startup. Set CORS_ALLOWED_ORIGIN env var to restrict to
	// a specific origin (e.g. https://vikas528.github.io for GitHub Pages).
	// Defaults to "*" so local Docker Compose works without any extra config.
	allowedOrigin := utils.EnvOr("CORS_ALLOWED_ORIGIN", "*")
	return http.HandlerFunc(func(resw http.ResponseWriter, req *http.Request) {
		resw.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		resw.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		resw.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		resw.Header().Set("Access-Control-Expose-Headers", "X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After")
		if req.Method == http.MethodOptions {
			resw.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(resw, req)
	})
}
