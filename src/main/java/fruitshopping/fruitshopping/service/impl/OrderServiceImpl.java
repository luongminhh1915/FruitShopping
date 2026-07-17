package fruitshopping.fruitshopping.service.impl;

import fruitshopping.fruitshopping.dto.request.CreateOrderRequest;
import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.OrderResponse;
import fruitshopping.fruitshopping.entity.*;
import fruitshopping.fruitshopping.repository.*;
import fruitshopping.fruitshopping.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    /* =============================================
     * HELPER – chuyển đổi status code → label
     * ============================================= */
    private static String statusLabel(int status) {
        return switch (status) {
            case 1 -> "Đang chuẩn bị hàng";
            case 2 -> "Đang giao hàng";
            case 3 -> "Đã thanh toán";
            default -> "Không xác định";
        };
    }

    /* =============================================
     * HELPER – convert Order entity → OrderResponse
     * ============================================= */
    private OrderResponse toResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findAllByOrder(order);

        List<OrderResponse.OrderItemResponse> itemResponses = items.stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                        .productName(item.getProduct() != null ? item.getProduct().getName() : "Sản phẩm")
                        .productImage(item.getProduct() != null ? item.getProduct().getImgUrl() : null)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        // Lấy phương thức thanh toán từ Payment
        String payMethod = paymentRepository.findFirstByOrder(order)
                .map(Payment::getPaymentMethod)
                .orElse("N/A");

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .customerName(order.getUser() != null ? order.getUser().getFullName() : "Khách hàng")
                .customerEmail(order.getUser() != null ? order.getUser().getEmail() : "")
                .address(order.getNote())
                .totalPrice(order.getTotal())
                .payMethod(payMethod)
                .status(order.getStatus())
                .statusLabel(statusLabel(order.getStatus()))
                .orderTime(order.getOrderTime())
                .items(itemResponses)
                .build();
    }

    /* =============================================
     * CREATE ORDER – status = 1 (Đang chuẩn bị)
     * ============================================= */
    @Override
    @Transactional
    public ApiResponse<OrderResponse> createOrder(CreateOrderRequest request) {
        // Xác định User
        User user = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                user = userRepository.findByEmail(auth.getName()).orElse(null);
            }
        } catch (Exception ignored) {}

        if (user == null) {
            List<User> users = userRepository.findAll();
            if (!users.isEmpty()) {
                user = users.get(0);
            } else {
                user = userRepository.save(User.builder()
                        .email("customer@fruitfresh.vn")
                        .fullName("Khách hàng")
                        .build());
            }
        }

        // Xác định Shop
        Shop shop;
        List<Shop> shops = shopRepository.findAll();
        if (!shops.isEmpty()) {
            shop = shops.get(0);
        } else {
            shop = shopRepository.save(Shop.builder().shopName("FruitFresh Store").owner(user).build());
        }

        BigDecimal totalAmt = request.getNumericTotal();
        if (totalAmt == null) totalAmt = request.getTotalPrice();
        if (totalAmt == null) totalAmt = BigDecimal.valueOf(100000);

        // Tạo Order với status = 1 (Đang chuẩn bị hàng)
        Order order = Order.builder()
                .user(user)
                .shop(shop)
                .status(1)  // Đang chuẩn bị hàng
                .total(totalAmt)
                .note(request.getAddress() != null ? request.getAddress() : "Địa chỉ giao hàng")
                .orderTime(LocalDateTime.now())
                .build();

        order = orderRepository.save(order);

        // Tạo Payment – paymentStatus = 0 (chưa thanh toán)
        String payMethod = request.getPayMethod() != null
                ? request.getPayMethod()
                : "Thanh toán khi nhận hàng (COD)";
        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(payMethod)
                .amount(totalAmt)
                .paymentStatus(0)  // Chưa thanh toán
                .paymentDate(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        // Tạo OrderItems & trừ tồn kho
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            List<Product> products = productRepository.findAll();
            Product defaultProduct = !products.isEmpty() ? products.get(0) : null;

            for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
                Product product = defaultProduct;
                if (itemReq.getProductId() != null) {
                    product = productRepository.findById(itemReq.getProductId()).orElse(defaultProduct);
                }
                if (product == null) continue;

                final BigDecimal price = itemReq.getPrice() != null ? itemReq.getPrice() : BigDecimal.valueOf(50000);
                final int qty = itemReq.getQuantity() != null ? itemReq.getQuantity() : 1;
                final BigDecimal subtotal = price.multiply(BigDecimal.valueOf(qty));

                // === KIỂM TRA & TRỪ TỒN KHO ===
                Inventory inv = inventoryRepository.findByProduct(product).orElse(null);
                if (inv != null) {
                    int currentStock = inv.getQuantityInStock();
                    String unit = product.getUnit() != null ? product.getUnit() : "kg";
                    if (currentStock < qty) {
                        throw new RuntimeException(
                            "Sản phẩm '" + product.getName() + "' chỉ còn " + currentStock +
                            " " + unit + " trong kho, không đủ để đặt " + qty + " " + unit + "!"
                        );
                    }
                    inv.setQuantityInStock(currentStock - qty);
                    inventoryRepository.save(inv);
                }

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .quantity(qty)
                        .unitPrice(price)
                        .subtotal(subtotal)
                        .build();
                orderItemRepository.save(orderItem);
            }
        }

        return ApiResponse.ok(toResponse(order));
    }

    /* =============================================
     * GET MY ORDERS – cho Customer
     * ============================================= */
    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<OrderResponse>> getMyOrders(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng.");
        }
        List<OrderResponse> responses = orderRepository.findAllByUserOrderByOrderTimeDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    /* =============================================
     * GET ALL ORDERS – cho Admin
     * ============================================= */
    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<OrderResponse>> getAllOrders() {
        List<OrderResponse> responses = orderRepository.findAllByOrderByOrderTimeDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    /* =============================================
     * UPDATE ORDER STATUS – cho Admin
     * ============================================= */
    @Override
    @Transactional
    public ApiResponse<OrderResponse> updateOrderStatus(Integer orderId, Integer newStatus) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ApiResponse.error("Không tìm thấy đơn hàng #" + orderId);
        }
        if (newStatus < 1 || newStatus > 3) {
            return ApiResponse.error("Trạng thái không hợp lệ. Chỉ chấp nhận 1, 2, 3.");
        }
        order.setStatus(newStatus);
        orderRepository.save(order);
        return ApiResponse.ok(toResponse(order));
    }
}
