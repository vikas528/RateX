package mock


type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Plan  string `json:"plan"`
}

var currentUser = User{ID: 42, Name: "Alice Smith", Email: "alice@example.com", Plan: "pro"}

type Product struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Price    float64 `json:"price"`
	InStock  bool    `json:"in_stock"`
}

var mockProducts = []Product{
	{ID: 1, Name: "Mechanical Keyboard", Category: "Electronics", Price: 129.99, InStock: true},
	{ID: 2, Name: "USB-C Hub", Category: "Electronics", Price: 49.99, InStock: true},
	{ID: 3, Name: "Ergonomic Mouse", Category: "Electronics", Price: 79.99, InStock: false},
	{ID: 4, Name: "Standing Desk", Category: "Furniture", Price: 399.00, InStock: true},
	{ID: 5, Name: "Monitor Stand", Category: "Furniture", Price: 59.99, InStock: true},
}

type Order struct {
	ID        int    `json:"id"`
	ProductID int    `json:"product_id"`
	Quantity  int    `json:"quantity"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}
