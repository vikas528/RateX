package middleware

import (
	"net/http"
)

func CorsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(resw http.ResponseWriter, req *http.Request) {
		resw.Header().Set("Access-Control-Allow-Origin", "*")
		resw.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		resw.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if req.Method == http.MethodOptions {
			resw.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(resw, req)
	})
}