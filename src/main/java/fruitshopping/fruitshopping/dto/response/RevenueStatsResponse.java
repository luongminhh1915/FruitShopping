package fruitshopping.fruitshopping.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RevenueStatsResponse {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private BigDecimal vnpayRevenue;
    private BigDecimal codRevenue;
}
