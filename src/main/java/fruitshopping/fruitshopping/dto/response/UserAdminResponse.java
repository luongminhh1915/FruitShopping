package fruitshopping.fruitshopping.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAdminResponse {
    private Integer userId;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String avatar;
    private Integer roleId;
    private String roleName;
    private Boolean isActive;
    private LocalDateTime createAt;
}
