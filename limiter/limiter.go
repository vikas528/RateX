package limiter

import (
	"context"
)

type Limiter interface {
	Allow(ctx context.Context, key string) (allowed bool, remaining int, err error)
}