package fruitshopping.fruitshopping.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfileResponse {
    private Integer userId;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String avatar;
    private String roleName;
}
