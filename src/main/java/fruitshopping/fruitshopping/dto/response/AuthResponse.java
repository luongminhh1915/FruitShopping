package fruitshopping.fruitshopping.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String tokenType;
    private Integer userId;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String roleName;
    private String avatar;
}
