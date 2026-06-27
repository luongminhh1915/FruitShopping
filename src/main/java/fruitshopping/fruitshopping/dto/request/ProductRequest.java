package fruitshopping.fruitshopping.dto.request;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductRequest {
    private String name;
    private Integer categoryId;
    private Integer shopId;
    private String imgUrl;
    private String description;
    private String origin;
    private String unit;
    private BigDecimal price;
    private Integer status;
}
