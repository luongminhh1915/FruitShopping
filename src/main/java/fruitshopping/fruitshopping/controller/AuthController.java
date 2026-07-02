package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.dto.request.*;
import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.AuthResponse;
import fruitshopping.fruitshopping.repository.UserRepository;
import fruitshopping.fruitshopping.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    /** POST /api/auth/login */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("Email không được để trống!"));
        if (request.getPassword() == null || request.getPassword().isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("Mật khẩu không được để trống!"));

        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Lỗi hệ thống: " + e.getMessage()));
        }
    }

    /** POST /api/auth/register – Bước 1: Gửi OTP */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // Validate
        if (request.getFullName() == null || request.getFullName().isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng nhập họ tên!"));
        if (request.getEmail() == null || request.getEmail().isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("Email không được để trống!"));
        if (!request.getEmail().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            return ResponseEntity.badRequest().body(ApiResponse.error("Email không đúng định dạng!"));
        if (request.getPassword() == null || request.getPassword().length() < 8)
            return ResponseEntity.badRequest().body(ApiResponse.error("Mật khẩu tối thiểu 8 ký tự!"));
        if (!request.getPassword().equals(request.getConfirmPassword()))
            return ResponseEntity.badRequest().body(ApiResponse.error("Mật khẩu xác nhận không khớp!"));

        try {
            authService.register(request);
            return ResponseEntity.ok(ApiResponse.ok(
                Map.of("message", "Mã OTP đã được gửi đến " + request.getEmail() + ". Vui lòng kiểm tra hộp thư!",
                       "email", request.getEmail())
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /** POST /api/auth/verify-otp – Bước 2: Xác nhận OTP */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        if (request.getEmail() == null || request.getOtpCode() == null)
            return ResponseEntity.badRequest().body(ApiResponse.error("Thiếu thông tin xác nhận!"));

        try {
            AuthResponse response = authService.verifyOtp(request);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /** POST /api/auth/resend-otp */
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        String email   = body.get("email");
        String otpType = body.getOrDefault("otpType", "REGISTER");

        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("Email không được để trống!"));

        try {
            authService.resendOtp(email, otpType);
            return ResponseEntity.ok(ApiResponse.ok(
                Map.of("message", "Mã OTP mới đã được gửi đến " + email)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /** GET /api/auth/check-email?email=... */
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        boolean exists = userRepository.existsByEmail(email.trim().toLowerCase());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("exists", exists)));
    }

    /** POST /api/auth/forgot-password */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng nhập Email!"));
        }

        try {
            authService.forgotPassword(request);
            return ResponseEntity.ok(ApiResponse.ok(
                Map.of("message", "Mã xác thực khôi phục mật khẩu đã được gửi về email của bạn!")
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    /** POST /api/auth/reset-password */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Thiếu thông tin Email!"));
        }
        if (request.getOtpCode() == null || request.getOtpCode().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng nhập mã OTP!"));
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mật khẩu mới tối thiểu 8 ký tự!"));
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mật khẩu xác nhận không khớp!"));
        }

        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(ApiResponse.ok(
                Map.of("message", "Mật khẩu của bạn đã được thay đổi thành công!")
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }
}
