package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.request.CreateOrderRequest;
import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.OrderResponse;

import java.util.List;

public interface OrderService {

    /** Tạo đơn hàng mới – trả về status=1 (Đang chuẩn bị hàng) */
    ApiResponse<String> createOrder(CreateOrderRequest request);

    /** Customer: lấy danh sách đơn hàng của chính mình */
    ApiResponse<List<OrderResponse>> getMyOrders(String email);

    /** Admin: lấy toàn bộ đơn hàng */
    ApiResponse<List<OrderResponse>> getAllOrders();

    /** Admin: cập nhật trạng thái đơn hàng */
    ApiResponse<OrderResponse> updateOrderStatus(Integer orderId, Integer newStatus);
}
