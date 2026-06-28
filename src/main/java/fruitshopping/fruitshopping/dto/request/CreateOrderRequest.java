package fruitshopping.fruitshopping.dto.request;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {
    private String orderId;
    private String payMethod;
    private BigDecimal totalPrice;
    private BigDecimal numericTotal;
    private String address;
    private List<OrderItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemRequest {
        private Integer productId;
        private String name;
        private BigDecimal price;
        private Integer quantity;
    }
}
