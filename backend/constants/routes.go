// Package constants holds every API route path used by the backend server.
// Centralising routes here means a single place to rename or version an endpoint.
package constants

// Route path constants.
// All paths are relative to the server root ("/").
const (
	RouteHealth          = "/ratex/health"
	RouteVisualizerState = "/ratex/visualizer-state"
	RouteConfig          = "/ratex/config"
	RouteProducts        = "/ratex/products"
	RouteProductByID     = "/ratex/products/"
	RouteOrders          = "/ratex/orders"
	RouteUsersMe         = "/ratex/users/me"
	RouteRoot            = "/"

	// PathPrefixProducts is used for trimming the product ID from the URL path.
	PathPrefixProducts = "/ratex/products/"
)
