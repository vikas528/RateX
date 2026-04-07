package config

import "github.com/redis/go-redis/v9"

type Server struct {
	config *AppConfig
	client *redis.Client
}

func InitServer(config *AppConfig, client *redis.Client) *Server {
	return &Server{
		config: config,
		client: client,
	}
}