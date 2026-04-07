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
	"github.com/vikas528/RateX/utils"
)

func HandleMockHealthCheck(resw http.ResponseWriter, req *http.Request) {
	utils.JsonResponse(resw, http.StatusOK, map[string]string{"status": "ok", "time": time.Now().UTC().Format(time.RFC3339)})
}

func HandleListProducts(resw http.ResponseWriter, req *http.Request) {
	category := req.URL.Query().Get("category")

	if category == "" {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{"error": "category query param is required"})
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

func HandleGetProduct(resw http.ResponseWriter, req *http.Request) {
	idStr := strings.TrimPrefix(req.URL.Path, "/api/products/")
	id, err := strconv.Atoi(idStr)
	if err != nil || idStr == "" {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{"error": "invalid product id"})
		return
	}
	for _, p := range mockProducts {
		if p.ID == id {
			utils.JsonResponse(resw, http.StatusOK, p)
			return
		}
	}
	utils.JsonResponse(resw, http.StatusNotFound, map[string]string{"error": "product not found"})
}

func HandleCreateOrder(resw http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		utils.JsonResponse(resw, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var body struct {
		ProductID int `json:"product_id"`
		Quantity  int `json:"quantity"`
	}
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil || body.ProductID == 0 {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{"error": "product_id is required"})
		return
	}
	if body.Quantity <= 0 {
		body.Quantity = 1
	}
	for _, p := range mockProducts {
		if p.ID == body.ProductID {
			if !p.InStock {
				utils.JsonResponse(resw, http.StatusConflict, map[string]string{"error": "product is out of stock"})
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
	utils.JsonResponse(resw, http.StatusNotFound, map[string]string{"error": "product not found"})
}

func HandleGetMe(resw http.ResponseWriter, req *http.Request) {
	utils.JsonResponse(resw, http.StatusOK, currentUser)
}

func HandleRoot(resw http.ResponseWriter, req *http.Request, server *config.Server) {
	config := server.GetConfig()
	utils.JsonResponse(resw, http.StatusOK, map[string]any{
		"message": "Welcome to the Mock API Server",
		"service": "RateX Mock API",
		"active_algo": fmt.Sprintf("%s (%d req / %d sec)", config.Algo, config.Limit, config.WindowSecs),
		"endpoints": []string {
			"GET  /api/ping",
			"GET  /api/config",
			"POST /api/config       {algo, limit, window_seconds}",
			"GET  /api/products     ?category=",
			"GET  /api/products/{id}",
			"POST /api/orders       {product_id, quantity}",
			"GET  /api/users/me",
		},
	})
}

func HandleGetConfig(resw http.ResponseWriter, req *http.Request, server *config.Server) {
	config := server.GetConfig()
	utils.JsonResponse(resw, http.StatusOK, config)
}

func HandleUpdateConfig(resw http.ResponseWriter, req *http.Request, server *config.Server) {
	var reqBody *config.AppConfig
	if err := json.NewDecoder(req.Body).Decode(&reqBody); err != nil {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	valid := map[string]bool{"fixed_window": true, "sliding_window": true, "token_bucket": true}

	if !valid[reqBody.Algo] {
		utils.JsonResponse(resw, http.StatusBadRequest, map[string]string{
			"error": "algo must be fixed_window, sliding_window, or token_bucket",
		})
		return
	}

	if reqBody.Limit <= 0 {
		// default to 10 if invalid limit provided
		reqBody.Limit = 10
	}

	if reqBody.WindowSecs <= 0 {
		// default to 60 seconds if invalid window provided
		reqBody.WindowSecs = 60
	}

	// Flush old Redis keys so the new config starts with a clean slate
	server.FlushAllKeys()

	newLimiter := common.BuildLimiter(server.GetRedisClient(), reqBody)

	server.SetLimitAndConfig(newLimiter, reqBody)
	log.Printf("Config updated: algo=%s limit=%d window=%ds refill_rate=%.2f", reqBody.Algo, reqBody.Limit, reqBody.WindowSecs, reqBody.RefillRate,)
	utils.JsonResponse(resw, http.StatusOK, reqBody)
}