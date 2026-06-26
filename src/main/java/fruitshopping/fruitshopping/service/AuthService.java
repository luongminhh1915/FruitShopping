package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.request.*;
import fruitshopping.fruitshopping.dto.response.AuthResponse;

public interface AuthService {
    // Đăng nhập → trả về JWT
    AuthResponse login(LoginRequest request);

    // Đăng ký bước 1: gửi OTP về email
    void register(RegisterRequest request);

    // Đăng ký bước 2: xác nhận OTP
    AuthResponse verifyOtp(VerifyOtpRequest request);

    // Gửi lại OTP
    void resendOtp(String email, String otpType);
}
