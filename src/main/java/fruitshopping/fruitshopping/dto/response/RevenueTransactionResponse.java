package fruitshopping.fruitshopping.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RevenueTransactionResponse {
    private String orderId;
    private String date;
    private String address;
    private String payMethod;
    private BigDecimal totalPrice;
    private String status;
}
