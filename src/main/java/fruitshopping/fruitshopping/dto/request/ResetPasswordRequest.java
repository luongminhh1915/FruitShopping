package fruitshopping.fruitshopping.dto.request;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResetPasswordRequest {
    private String email;
    private String otpCode;
    private String newPassword;
    private String confirmPassword;
}
