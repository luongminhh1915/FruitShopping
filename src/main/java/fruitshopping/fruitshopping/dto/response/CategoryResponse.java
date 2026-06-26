package fruitshopping.fruitshopping.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryResponse {

    private Integer categoryId;
    private Integer parentId;
    private String name;
    private String image;
    private Integer sortOrder;
}
