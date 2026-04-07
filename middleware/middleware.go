package middleware

import (
	"fmt"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/vikas528/RateX/limiter"
)

func RateLimit(getConfig func() (limiter.Limiter, time.Duration)) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(resw http.ResponseWriter, req *http.Request) {
			limiter, window := getConfig()
			ip, _, err := net.SplitHostPort(req.RemoteAddr)
			if err != nil {
				ip = req.RemoteAddr
			}

			if forwareded := req.Header.Get("X-Forwarded-For"); forwareded != "" {
				ip = forwareded
			}

			allowed, err := limiter.Allow(req.Context(), ip)

			if err != nil {
				http.Error(resw, "rate limiter error", http.StatusInternalServerError)
				return
			}

			resw.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(window).Unix()))

			if !allowed {
				resw.Header().Set("Retry-After", strconv.Itoa(int(window.Seconds())))
				http.Error(resw, "rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(resw, req)
		})
	}
}