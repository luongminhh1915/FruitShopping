package fruitshopping.fruitshopping.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductResponse {

    private Integer productId;
    private String name;
    private String imgUrl;
    private String description;
    private String origin;
    private String unit;
    private BigDecimal price;
    private Integer status;
    private String categoryName;
    private String shopName;
    private LocalDateTime createAt;
}
