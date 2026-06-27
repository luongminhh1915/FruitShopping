CREATE DATABASE fruitshopping;
GO

USE fruitshopping;
GO

-- 1. Bảng Role (Vai trò)
CREATE TABLE Role (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(50) NOT NULL
);

-- 2. Bảng User (Người dùng)
CREATE TABLE [User] (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    role_id INT NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    address NVARCHAR(255),
    create_at DATETIME DEFAULT GETDATE(),
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_User_Role FOREIGN KEY (role_id) REFERENCES Role(role_id)
);

-- 3. Bảng Category (Danh mục sản phẩm)
CREATE TABLE Category (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    parent_id INT NULL,
    name NVARCHAR(100) NOT NULL,
    image VARCHAR(255),
    sort_order INT DEFAULT 0,
    CONSTRAINT FK_Category_Parent FOREIGN KEY (parent_id) REFERENCES Category(category_id)
);

-- 4. Bảng Shop (Cửa hàng)
CREATE TABLE Shop (
    shop_id INT IDENTITY(1,1) PRIMARY KEY,
    owner_id INT NOT NULL,
    shop_name NVARCHAR(100) NOT NULL,
    address NVARCHAR(255),
    phone VARCHAR(15),
    logo VARCHAR(255),
    is_active BIT DEFAULT 1,
    create_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Shop_User FOREIGN KEY (owner_id) REFERENCES [User](user_id)
);

-- 5. Bảng Product (Sản phẩm trái cây)
CREATE TABLE Product (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    shop_id INT NOT NULL,
    category_id INT NOT NULL,
    name NVARCHAR(150) NOT NULL,
    img_url VARCHAR(255),
    description NVARCHAR(MAX),
    origin NVARCHAR(100),
    unit NVARCHAR(50), -- Ví dụ: kg, hộp, thùng
    price DECIMAL(18,2) NOT NULL,
    status INT DEFAULT 1,
    create_at DATETIME DEFAULT GETDATE(),
    update_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Product_Shop FOREIGN KEY (shop_id) REFERENCES Shop(shop_id),
    CONSTRAINT FK_Product_Category FOREIGN KEY (category_id) REFERENCES Category(category_id)
);

-- 6. Bảng Order (Đơn hàng)
CREATE TABLE [Order] (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    shop_id INT NOT NULL,
    address_id INT, -- Có thể liên kết với bảng địa chỉ riêng, tạm thời để INT theo sơ đồ
    status INT DEFAULT 0,
    total DECIMAL(18,2) NOT NULL,
    note NVARCHAR(500),
    order_time DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Order_User FOREIGN KEY (user_id) REFERENCES [User](user_id),
    CONSTRAINT FK_Order_Shop FOREIGN KEY (shop_id) REFERENCES Shop(shop_id)
);

-- 7. Bảng Order_item (Chi tiết đơn hàng)
CREATE TABLE Order_item (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(18,2) NOT NULL,
    subtotal DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_OrderItem_Order FOREIGN KEY (order_id) REFERENCES [Order](order_id),
    CONSTRAINT FK_OrderItem_Product FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

-- 8. Bảng Payment (Thanh toán)
CREATE TABLE Payment (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method NVARCHAR(50),
    amount DECIMAL(18,2) NOT NULL,
    payment_status INT DEFAULT 0,
    payment_date DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Payment_Order FOREIGN KEY (order_id) REFERENCES [Order](order_id)
);

-- 9. Bảng Cart (Giỏ hàng)
CREATE TABLE Cart (
    cart_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE, -- Mỗi user thường có 1 giỏ hàng hoạt động
    create_at DATETIME DEFAULT GETDATE(),
    update_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Cart_User FOREIGN KEY (user_id) REFERENCES [User](user_id)
);

-- 10. Bảng Cart_item (Chi tiết giỏ hàng)
CREATE TABLE Cart_item (
    cart_item_id INT IDENTITY(1,1) PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_CartItem_Cart FOREIGN KEY (cart_id) REFERENCES Cart(cart_id),
    CONSTRAINT FK_CartItem_Product FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

-- 11. Bảng Review (Đánh giá sản phẩm)
CREATE TABLE Review (
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    order_id INT NOT NULL,
    comment NVARCHAR(MAX),
    create_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Review_User FOREIGN KEY (user_id) REFERENCES [User](user_id),
    CONSTRAINT FK_Review_Product FOREIGN KEY (product_id) REFERENCES Product(product_id),
    CONSTRAINT FK_Review_Order FOREIGN KEY (order_id) REFERENCES [Order](order_id)
);

-- 12. Bảng Notification (Thông báo)
CREATE TABLE Notification (
    notif_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    type NVARCHAR(50),
    title NVARCHAR(255) NOT NULL,
    create_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Notification_User FOREIGN KEY (user_id) REFERENCES [User](user_id)
);
GO