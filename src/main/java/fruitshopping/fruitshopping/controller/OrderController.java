package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.dto.request.CreateOrderRequest;
import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<String>> createOrder(@RequestBody CreateOrderRequest request) {
        try {
            ApiResponse<String> response = orderService.createOrder(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi khi lưu đơn hàng: " + e.getMessage()));
        }
    }
}
