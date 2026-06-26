package fruitshopping.fruitshopping.dto.request;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VerifyOtpRequest {
    private String email;
    private String otpCode;
    private String otpType; // REGISTER | RESET_PASSWORD
}
