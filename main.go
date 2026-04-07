package main

import (
	"fmt"

	"github.com/redis/go-redis/v9"
	"github.com/vikas528/RateX/config"
	"github.com/vikas528/RateX/utils"
)

func main() {
	fmt.Println("Welcome to RateX - A Redis-based Rate Limiter in Go!")

	initConfig := config.InitDefaultConfig()

	redisClient := redis.NewClient(&redis.Options{Addr: utils.EnvOr("REDIS_ADDR", "redis:6379")})

	server := config.InitServer(initConfig, redisClient)

	
}
