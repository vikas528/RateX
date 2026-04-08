package config

import "github.com/vikas528/RateX/constants"

// ExcludedFromRateLimit lists every route that bypasses the global rate limiter.
// All other routes under /* are rate-limited by default.
//
// Add a path here when it is a management/utility endpoint that should never
// count against a client's quota (e.g. health probes, visualizer polling, config).
var ExcludedFromRateLimit = []string{
	constants.RouteHealth,          // liveness probe — must never be blocked
	constants.RouteVisualizerState, // UI polls this at ~350 ms; rate-limiting it would break the visualizer
	constants.RouteConfig,          // config read/write — internal management endpoint
	constants.RouteRoot,            // catch-all root handler
}
