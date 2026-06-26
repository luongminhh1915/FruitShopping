package fruitshopping.fruitshopping.dto.request;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String address;
    private String avatar;
}
