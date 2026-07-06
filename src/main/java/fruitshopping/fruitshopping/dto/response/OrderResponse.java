package fruitshopping.fruitshopping.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderResponse {

    private Integer orderId;
    private String customerName;
    private String customerEmail;
    private String address;
    private BigDecimal totalPrice;
    private String payMethod;

    /**
     * status: 1 = Đang chuẩn bị hàng
     *         2 = Đang giao hàng
     *         3 = Đã thanh toán / Hoàn thành
     */
    private Integer status;
    private String statusLabel;
    private LocalDateTime orderTime;

    private List<OrderItemResponse> items;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class OrderItemResponse {
        private Integer productId;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }
}
