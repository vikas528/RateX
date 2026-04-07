package main

import (
	"log"
	"net/http"

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

	redisAddr := utils.EnvOr(constants.EnvRedisAddr, constants.DefaultRedisAddr)
	redisClient := redis.NewClient(&redis.Options{Addr: redisAddr})

	limiter := common.BuildLimiter(redisClient, initConfig)
	server := config.InitServer(initConfig, redisClient, limiter)

	log.Printf("Starting: algo=%s limit=%d window=%ds redis=%s",
		initConfig.Algo, initConfig.Limit, initConfig.WindowSecs, redisAddr)

	rateLimiter := middleware.RateLimit(server.GetLimiterConfig)

	mux := http.NewServeMux()

	// ── Non-rate-limited endpoints ───────────────────────────────────────────
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

	// ── Rate-limited endpoints ───────────────────────────────────────────────
	mux.Handle(constants.RouteProducts, rateLimiter(http.HandlerFunc(mock.HandleListProducts)))
	mux.Handle(constants.RouteProductByID, rateLimiter(http.HandlerFunc(mock.HandleGetProduct)))
	mux.Handle(constants.RouteOrders, rateLimiter(http.HandlerFunc(mock.HandleCreateOrder)))
	mux.Handle(constants.RouteUsersMe, rateLimiter(http.HandlerFunc(mock.HandleGetMe)))

	mux.HandleFunc(constants.RouteRoot, func(resw http.ResponseWriter, req *http.Request) {
		mock.HandleRoot(resw, req, server)
	})

	log.Fatal(http.ListenAndServe(constants.ServerListenAddr, middleware.CorsMiddleware(mux)))
}
