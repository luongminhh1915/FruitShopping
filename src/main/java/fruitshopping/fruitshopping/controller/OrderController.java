package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.dto.request.CreateOrderRequest;
import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.OrderResponse;
import fruitshopping.fruitshopping.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** POST /api/orders/create – Tạo đơn hàng mới (trạng thái = 1: Đang chuẩn bị hàng) */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@RequestBody CreateOrderRequest request) {
        try {
            ApiResponse<OrderResponse> response = orderService.createOrder(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi khi lưu đơn hàng: " + e.getMessage()));
        }
    }

    /** GET /api/orders/my – Customer lấy lịch sử đơn hàng của chính mình */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return ResponseEntity.status(401).body(ApiResponse.error("Bạn cần đăng nhập để xem lịch sử đơn hàng."));
            }
            ApiResponse<List<OrderResponse>> response = orderService.getMyOrders(auth.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi khi tải lịch sử đơn hàng: " + e.getMessage()));
        }
    }

    /** GET /api/orders/all – Admin lấy toàn bộ đơn hàng */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        try {
            ApiResponse<List<OrderResponse>> response = orderService.getAllOrders();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi khi tải danh sách đơn hàng: " + e.getMessage()));
        }
    }

    /** PUT /api/orders/{id}/status – Admin cập nhật trạng thái đơn hàng */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> body) {
        try {
            Integer newStatus = body.get("status");
            if (newStatus == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Thiếu trường 'status'."));
            }
            ApiResponse<OrderResponse> response = orderService.updateOrderStatus(id, newStatus);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi khi cập nhật trạng thái: " + e.getMessage()));
        }
    }
}
