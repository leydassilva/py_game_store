CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT,
    notes TEXT,
    status TEXT NOT NULL,
    image_path TEXT,
	supplier_name TEXT
);

CREATE TABLE purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    cost REAL NOT NULL,
    purchase_date TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE maintenances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    date TEXT NOT NULL,
    cost REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    sale_date TEXT NOT NULL,
    sale_price REAL NOT NULL,
    payment_method TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    old_price REAL NOT NULL,
    new_price REAL NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    reason TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
);