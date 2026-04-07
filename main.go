package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/vikas528/RateX/config"
	"github.com/vikas528/RateX/limiter"
	"github.com/vikas528/RateX/middleware"
	"github.com/vikas528/RateX/mock"
	"github.com/vikas528/RateX/utils"
)

func main() {
	fmt.Println("Welcome to RateX - A Redis-based Rate Limiter in Go!")

	initConfig := config.InitDefaultConfig()

	redisClient := redis.NewClient(&redis.Options{Addr: utils.EnvOr("REDIS_ADDR", "redis:6379")})

	limiter := buildLimiter(redisClient, initConfig)

	server := config.InitServer(initConfig, redisClient, limiter)

	rateLimiter := middleware.RateLimit(server.GetLimiterConfig)

	mux := http.NewServeMux()

	// Health check endpoint - not rate limited
	mux.HandleFunc("/api/health", mock.HandleMockHealthCheck)

	// Rate limited endpoint
	mux.Handle("/api/products", rateLimiter(http.HandlerFunc(mock.HandleListProducts)))
	mux.Handle("/api/products/", rateLimiter(http.HandlerFunc(mock.HandleGetProduct)))
	mux.Handle("/api/orders", rateLimiter(http.HandlerFunc(mock.HandleCreateOrder)))
	mux.Handle("/api/users/me", rateLimiter(http.HandlerFunc(mock.HandleGetMe)))

	mux.HandleFunc("/", func(resw http.ResponseWriter, req *http.Request) {
		mock.HandleRoot(resw, req, server)
	})

	
}


func buildLimiter(redisClient *redis.Client, config *config.AppConfig) limiter.Limiter {
	window := time.Duration(config.WindowSecs) * time.Second
	switch config.Algo {
	case "fixed_window":
		return limiter.NewFixedWindow(redisClient, config.Limit, window)
	// default to fixed window for now, will add more algorithms later
	default:
		return limiter.NewFixedWindow(redisClient, config.Limit, window)
	}
}

