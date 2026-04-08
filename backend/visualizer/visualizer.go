package visualizer

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/vikas528/RateX/config"
	"github.com/vikas528/RateX/utils"
)

func HandleGetVisualizerState(resw http.ResponseWriter, req *http.Request, server *config.Server) {
	config := server.GetConfig()

	ip := utils.ClientIP(req)
	ctx := context.Background()

	out := map[string]any{"algo": config.Algo, "limit": config.Limit}

	switch config.Algo {
	case "token_bucket":
		out["capacity"] = float64(server.GetConfig().Limit)
		out["refill_rate"] = server.GetConfig().RefillRate
		out["tokens"], out["percent_full"] = getVisualizerStateForTokenBucket(ip, server, ctx)

	case "fixed_window":
		out["count"], out["ttl_ms"], out["window_ms"], out["percent_used"] = getVisualizerStateForFixedWindow(ip, server, ctx)

	case "sliding_window":
		out["window_seconds"] = server.GetConfig().WindowSecs

		out["count"], out["request_ages_ms"], out["percent_used"] = getVisualizerStateForSlidingWindow(ip, server, ctx)
	}

	utils.JsonResponse(resw, http.StatusOK, out)
}

func getVisualizerStateForTokenBucket(ip string, server *config.Server, ctx context.Context) (token float64, percentFull float64) {
	key := fmt.Sprintf("tb:%s", ip)
	data, _ := server.GetRedisClient().HMGet(ctx, key, "tokens", "last_refill").Result()
	now := float64(time.Now().UnixNano()) / 1e9 // seconds as float
	capacity := float64(server.GetConfig().Limit)
	tokens := capacity

	if data[0] != nil && data[1] != nil {
		t, _ := strconv.ParseFloat(fmt.Sprintf("%v", data[0]), 64)
		lr, _ := strconv.ParseFloat(fmt.Sprintf("%v", data[1]), 64)
		tokens = math.Min(capacity, t+((now-lr)*server.GetConfig().RefillRate))
	}

	tokens = math.Round(tokens*100) / 100
	percentFull = math.Round((tokens/capacity)*1000) / 10
	return tokens, percentFull
}

func getVisualizerStateForFixedWindow(ip string, server *config.Server, ctx context.Context) (count int64, ttlMs int64, windowMs int64, percentUsed float64) {
	bucket := time.Now().Truncate(time.Duration(server.GetConfig().WindowSecs) * time.Second).Unix()
	key := fmt.Sprintf("fw:%s:%d", ip, bucket)
	count, _ = server.GetRedisClient().Get(ctx, key).Int64()
	ttl, _ := server.GetRedisClient().PTTL(ctx, key).Result()
	windowMs = int64(server.GetConfig().WindowSecs) * 1000
	ttlMs = ttl.Milliseconds()
	if ttlMs <= 0 {
		ttlMs = windowMs
	}
	return count, ttlMs, windowMs, math.Round(float64(count)/float64(server.GetConfig().Limit)*1000) / 10
}

func getVisualizerStateForSlidingWindow(ip string, server *config.Server, ctx context.Context) (count int64, requestAgesMs []float64, percentUsed float64) {
	// Scores in the sorted-set are stored as seconds (float64), matching sliding_window.go (UnixNano / 1e9).
	windowStart := float64(time.Now().Add(-time.Duration(server.GetConfig().WindowSecs)*time.Second).UnixNano()) / 1e9
	minStr := fmt.Sprintf("%f", windowStart)
	key := "sw:" + ip
	total, _ := server.GetRedisClient().ZCount(ctx, key, minStr, "+inf").Result()
	// Get up to 500 most-recent members for the timeline (non-destructive ZRevRangeByScore)
	recent, _ := server.GetRedisClient().ZRevRangeByScore(ctx, key, &redis.ZRangeBy{
		Max: "+inf", Min: minStr, Count: 500,
	}).Result()
	// scores and members are both seconds (float64); compute age in milliseconds
	nowSec := float64(time.Now().UnixNano()) / 1e9
	ages := make([]float64, 0, len(recent))
	for _, m := range recent {
		ts, _ := strconv.ParseFloat(m, 64)
		ageMs := math.Round((nowSec-ts)*10000) / 10 // round to 0.1 ms
		if ageMs >= 0 {
			ages = append(ages, ageMs)
		}
	}
	return total, ages, math.Round(float64(total)/float64(server.GetConfig().Limit)*1000) / 10
}
