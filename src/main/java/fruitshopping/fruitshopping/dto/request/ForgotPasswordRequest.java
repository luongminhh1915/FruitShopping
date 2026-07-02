package fruitshopping.fruitshopping.dto.request;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ForgotPasswordRequest {
    private String email;
}
