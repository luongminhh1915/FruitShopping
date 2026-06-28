package fruitshopping.fruitshopping.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReviewResponse {
    private Integer reviewId;
    private String name;
    private String avatar;
    private Integer stars;
    private String comment;
    private String date;
}
