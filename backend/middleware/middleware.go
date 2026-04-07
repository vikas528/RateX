package middleware

import (
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/vikas528/RateX/constants"
	"github.com/vikas528/RateX/limiter"
)

// RateLimit returns a middleware that applies the Limiter returned by getConfig.
// It adds X-RateLimit-Remaining and X-RateLimit-Reset response headers and
// replies with 429 when the limit is exceeded.
func RateLimit(getConfig func() (limiter.Limiter, time.Duration)) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(resw http.ResponseWriter, req *http.Request) {
			l, window := getConfig()

			ip, _, err := net.SplitHostPort(req.RemoteAddr)
			if err != nil {
				ip = req.RemoteAddr
			}
			// Use the left-most (client) IP from a proxy chain, consistent with
			// the approach used in visualizer.go.
			if forwarded := req.Header.Get("X-Forwarded-For"); forwarded != "" {
				ip = strings.TrimSpace(strings.Split(forwarded, ",")[0])
			}

			allowed, remaining, err := l.Allow(req.Context(), ip)
			if err != nil {
				http.Error(resw, constants.ErrRateLimiter, http.StatusInternalServerError)
				return
			}

			resw.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
			resw.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(window).Unix()))

			if !allowed {
				resw.Header().Set("Retry-After", strconv.Itoa(int(window.Seconds())))
				http.Error(resw, constants.ErrRateLimitExceeded, http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(resw, req)
		})
	}
}
