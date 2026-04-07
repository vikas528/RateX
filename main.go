package main

import (
	"log"
	"net/http"

	"github.com/redis/go-redis/v9"
	"github.com/vikas528/RateX/common"
	"github.com/vikas528/RateX/config"
	"github.com/vikas528/RateX/middleware"
	"github.com/vikas528/RateX/mock"
	"github.com/vikas528/RateX/utils"
)

func main() {
	log.Printf("Welcome to RateX - A Redis-based Rate Limiter in Go!")

	initConfig := config.InitDefaultConfig()

	redisClient := redis.NewClient(&redis.Options{Addr: utils.EnvOr("REDIS_ADDR", "redis:6379")})

	limiter := common.BuildLimiter(redisClient, initConfig)

	server := config.InitServer(initConfig, redisClient, limiter)

	log.Printf("Starting: algo=%s limit=%d window=%ds redis=%s",
		initConfig.Algo, initConfig.Limit, initConfig.WindowSecs, utils.EnvOr("REDIS_ADDR", "redis:6379"))

	rateLimiter := middleware.RateLimit(server.GetLimiterConfig)

	mux := http.NewServeMux()

	// Health check endpoint - not rate limited
	mux.HandleFunc("/ratex/health", mock.HandleMockHealthCheck)

	mux.HandleFunc("/ratex/config", func(resw http.ResponseWriter, req *http.Request) {
		switch req.Method {
		case http.MethodGet:
			mock.HandleGetConfig(resw, req, server)
		case http.MethodPost:
			mock.HandleUpdateConfig(resw, req, server)
		default:
			utils.JsonResponse(resw, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		}
	})

	// Rate limited endpoint
	mux.Handle("/api/products", rateLimiter(http.HandlerFunc(mock.HandleListProducts)))
	mux.Handle("/api/products/", rateLimiter(http.HandlerFunc(mock.HandleGetProduct)))
	mux.Handle("/api/orders", rateLimiter(http.HandlerFunc(mock.HandleCreateOrder)))
	mux.Handle("/api/users/me", rateLimiter(http.HandlerFunc(mock.HandleGetMe)))

	mux.HandleFunc("/", func(resw http.ResponseWriter, req *http.Request) {
		mock.HandleRoot(resw, req, server)
	})

	log.Fatal(http.ListenAndServe(":8080", middleware.CorsMiddleware(mux)))
}

