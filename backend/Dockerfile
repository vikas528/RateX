FROM golang:1.21-alpine AS builder
WORKDIR /app

# Copy all source files first so go mod tidy can resolve indirect deps
COPY . .

# Download deps; generates go.sum if absent, then verify everything is consistent
RUN go mod download && go mod tidy

# Build a fully static binary — required so it runs on musl-based Alpine
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server .

# ── Final image ─────────────────────────────────────────────────────────────
FROM alpine:latest
# ca-certificates lets the app make outbound HTTPS calls if needed
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]