package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
	"github.com/vikas528/RateX/common"
	"github.com/vikas528/RateX/config"
	"github.com/vikas528/RateX/constants"
	"github.com/vikas528/RateX/middleware"
	"github.com/vikas528/RateX/mock"
	"github.com/vikas528/RateX/utils"
	"github.com/vikas528/RateX/visualizer"
)

func main() {
	log.Printf("Welcome to RateX - A Redis-based Rate Limiter in Go!")

	initConfig := config.InitDefaultConfig()

	// Support both REDIS_URL (rediss://host:port — Upstash / Render managed Redis)
	// and the legacy REDIS_ADDR (host:port) for local / Docker Compose setups.
	var redisClient *redis.Client
	if redisURL := os.Getenv("REDIS_URL"); redisURL != "" {
		opt, err := redis.ParseURL(redisURL)
		if err != nil {
			log.Fatalf("Invalid REDIS_URL: %v", err)
		}
		redisClient = redis.NewClient(opt)
		log.Printf("Redis: connecting via REDIS_URL")
	} else {
		redisAddr := utils.EnvOr(constants.EnvRedisAddr, constants.DefaultRedisAddr)
		redisClient = redis.NewClient(&redis.Options{Addr: redisAddr})
		log.Printf("Redis: connecting via REDIS_ADDR=%s", redisAddr)
	}

	// Verify Redis is reachable before accepting traffic. A failed Ping here
	// causes the process to exit with a clear log message, which surfaces
	// immediately in Render logs instead of silently returning 500s.
	if err := redisClient.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("Redis ping failed — check REDIS_URL / REDIS_ADDR: %v", err)
	}
	log.Printf("Redis: connection OK")

	limiter := common.BuildLimiter(redisClient, initConfig)
	server := config.InitServer(initConfig, redisClient, limiter)

	log.Printf("Starting: algo=%s limit=%d window=%ds",
		initConfig.Algo, initConfig.Limit, initConfig.WindowSecs)

	mux := http.NewServeMux()

	// ── All routes — rate-limited by default ─────────────────────────────────
	// Exceptions are declared in config.ExcludedFromRateLimit.
	mux.HandleFunc(constants.RouteHealth, mock.HandleMockHealthCheck)

	mux.HandleFunc(constants.RouteVisualizerState, func(resw http.ResponseWriter, req *http.Request) {
		if req.Method != http.MethodGet {
			utils.JsonResponse(resw, http.StatusMethodNotAllowed, map[string]string{"error": constants.ErrMethodNotAllowed})
			return
		}
		visualizer.HandleGetVisualizerState(resw, req, server)
	})

	mux.HandleFunc(constants.RouteConfig, func(resw http.ResponseWriter, req *http.Request) {
		switch req.Method {
		case http.MethodGet:
			mock.HandleGetConfig(resw, req, server)
		case http.MethodPost:
			mock.HandleUpdateConfig(resw, req, server)
		default:
			utils.JsonResponse(resw, http.StatusMethodNotAllowed, map[string]string{"error": constants.ErrMethodNotAllowed})
		}
	})

	mux.HandleFunc(constants.RouteProducts, mock.HandleListProducts)
	mux.HandleFunc(constants.RouteProductByID, mock.HandleGetProduct)
	mux.HandleFunc(constants.RouteOrders, mock.HandleCreateOrder)
	mux.HandleFunc(constants.RouteUsersMe, mock.HandleGetMe)

	mux.HandleFunc(constants.RouteRoot, func(resw http.ResponseWriter, req *http.Request) {
		mock.HandleRoot(resw, req, server)
	})

	// Wrap the whole mux: every route is rate-limited unless its path is in
	// config.ExcludedFromRateLimit.  Add new rate-limited routes to the mux above;
	// add management/utility routes to ExcludedFromRateLimit to skip limiting.
	handler := middleware.RateLimitAll(server.GetLimiterConfig, config.ExcludedFromRateLimit)(mux)
	log.Fatal(http.ListenAndServe(constants.ServerListenAddr, middleware.CorsMiddleware(handler)))
}
