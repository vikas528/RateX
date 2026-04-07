package mock

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/vikas528/RateX/common"
	"github.com/vikas528/RateX/config"
	"github.com/vikas528/RateX/constants"
	"github.com/vikas528/RateX/utils"
)

// HandleMockHealthCheck returns a simple liveness probe response.
func HandleMockHealthCheck(resw http.ResponseWriter, req *http.Request) {
	utils.JsonResponse(resw, http.StatusOK, map[string]string{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

// HandleListProducts returns products filtered by the "category" query param.
func HandleListProducts(resw http.ResponseWriter, req *http.Request) {
	category := req.URL.Query().Get("category")
	if category == "" {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{"error": constants.ErrCategoryRequired})
		return
	}

	var filtered []Product
	for _, p := range mockProducts {
		if strings.EqualFold(p.Category, category) {
			filtered = append(filtered, p)
		}
	}

	utils.JsonResponse(resw, http.StatusOK, map[string]any{"data": filtered, "total": len(filtered)})
}

// HandleGetProduct returns a single product by ID from the URL path.
func HandleGetProduct(resw http.ResponseWriter, req *http.Request) {
	idStr := strings.TrimPrefix(req.URL.Path, constants.PathPrefixProducts)
	id, err := strconv.Atoi(idStr)
	if err != nil || idStr == "" {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{"error": constants.ErrInvalidProductID})
		return
	}
	for _, p := range mockProducts {
		if p.ID == id {
			utils.JsonResponse(resw, http.StatusOK, p)
			return
		}
	}
	utils.JsonResponse(resw, http.StatusNotFound, map[string]string{"error": constants.ErrProductNotFound})
}

// HandleCreateOrder validates and creates a mock order.
func HandleCreateOrder(resw http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		utils.JsonResponse(resw, http.StatusMethodNotAllowed, map[string]string{"error": constants.ErrMethodNotAllowed})
		return
	}

	var body struct {
		ProductID int `json:"product_id"`
		Quantity  int `json:"quantity"`
	}
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil || body.ProductID == 0 {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{"error": constants.ErrProductIDRequired})
		return
	}
	if body.Quantity <= 0 {
		body.Quantity = 1
	}

	for _, p := range mockProducts {
		if p.ID == body.ProductID {
			if !p.InStock {
				utils.JsonResponse(resw, http.StatusConflict, map[string]string{"error": constants.ErrProductOutOfStock})
				return
			}
			order := Order{
				ID:        1000 + body.ProductID,
				ProductID: body.ProductID,
				Quantity:  body.Quantity,
				Status:    "confirmed",
				CreatedAt: time.Now().UTC().Format(time.RFC3339),
			}
			utils.JsonResponse(resw, http.StatusCreated, order)
			return
		}
	}
	utils.JsonResponse(resw, http.StatusNotFound, map[string]string{"error": constants.ErrProductNotFound})
}

// HandleGetMe returns the mock authenticated user.
func HandleGetMe(resw http.ResponseWriter, req *http.Request) {
	utils.JsonResponse(resw, http.StatusOK, currentUser)
}

// HandleRoot returns a welcome message with the active rate-limiter config.
func HandleRoot(resw http.ResponseWriter, req *http.Request, server *config.Server) {
	cfg := server.GetConfig()
	utils.JsonResponse(resw, http.StatusOK, map[string]any{
		"message":     "Welcome to the RateX Mock API Server",
		"service":     "RateX Mock API",
		"active_algo": fmt.Sprintf("%s (%d req / %d sec)", cfg.Algo, cfg.Limit, cfg.WindowSecs),
		"endpoints": []string{
			"GET  " + constants.RouteHealth,
			"GET  " + constants.RouteConfig,
			"POST " + constants.RouteConfig + "  {algo, limit, window_seconds}",
			"GET  " + constants.RouteProducts + "  ?category=",
			"GET  " + constants.RouteProductByID + "{id}",
			"POST " + constants.RouteOrders + "  {product_id, quantity}",
			"GET  " + constants.RouteUsersMe,
		},
	})
}

// HandleGetConfig returns the currently active rate-limiter config.
func HandleGetConfig(resw http.ResponseWriter, req *http.Request, server *config.Server) {
	utils.JsonResponse(resw, http.StatusOK, server.GetConfig())
}

// HandleUpdateConfig hot-swaps the rate-limiter algorithm and parameters.
func HandleUpdateConfig(resw http.ResponseWriter, req *http.Request, server *config.Server) {
	var reqBody *config.AppConfig
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{"error": constants.ErrInvalidJSON})
		return
	}

	validAlgos := map[string]bool{
		constants.AlgoFixedWindow:   true,
		constants.AlgoSlidingWindow: true,
		constants.AlgoTokenBucket:   true,
	}
	if !validAlgos[reqBody.Algo] {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{"error": constants.ErrInvalidAlgo})
		return
	}

	if reqBody.Limit <= 0 {
		reqBody.Limit = constants.DefaultLimit
	}
	if reqBody.WindowSecs <= 0 {
		reqBody.WindowSecs = constants.DefaultWindowSecs
	}

	// Flush old Redis keys so the new config starts with a clean slate.
	server.FlushAllKeys()

	newLimiter := common.BuildLimiter(server.GetRedisClient(), reqBody)
	server.SetLimitAndConfig(newLimiter, reqBody)

	log.Printf("Config updated: algo=%s limit=%d window=%ds refill=%.2f",
		reqBody.Algo, reqBody.Limit, reqBody.WindowSecs, reqBody.RefillRate)

	utils.JsonResponse(resw, http.StatusOK, server.GetConfig())
}
