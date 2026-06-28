package fruitshopping.fruitshopping.dto.request;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateReviewRequest {
    private String comment;
    private Integer stars;
}
