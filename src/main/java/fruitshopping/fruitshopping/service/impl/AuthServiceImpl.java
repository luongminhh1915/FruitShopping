package fruitshopping.fruitshopping.service.impl;

import fruitshopping.fruitshopping.dto.request.*;
import fruitshopping.fruitshopping.dto.response.AuthResponse;
import fruitshopping.fruitshopping.entity.OtpVerification;
import fruitshopping.fruitshopping.entity.Role;
import fruitshopping.fruitshopping.entity.User;
import fruitshopping.fruitshopping.repository.OtpRepository;
import fruitshopping.fruitshopping.repository.RoleRepository;
import fruitshopping.fruitshopping.repository.UserRepository;
import fruitshopping.fruitshopping.security.JwtService;
import fruitshopping.fruitshopping.service.AuthService;
import fruitshopping.fruitshopping.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OtpRepository otpRepository;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRE_MINUTES = 10;

    /*
     * =============================================
     * ĐĂNG NHẬP
     * =============================================
     */
    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không chính xác!"));

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new BadCredentialsException("Tài khoản của bạn đã bị khóa!");
        }

        try {
            log.info("Attempting authentication for email: {}", email);
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
            log.info("Authentication check successful for email: {}", email);
        } catch (org.springframework.security.authentication.DisabledException e) {
            throw new BadCredentialsException("Tài khoản của bạn đã bị khóa!");
        } catch (Exception e) {
            log.error("Authentication failed for email: {} due to: {}", email, e.getMessage(), e);
            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác!");
        }

        var userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateToken(userDetails);

        return buildAuthResponse(token, user);
    }

    /*
     * =============================================
     * ĐĂNG KÝ – Bước 1: Gửi OTP về email
     * =============================================
     */
    @Override
    @Transactional
    public void register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email " + email + " đã được đăng ký!");
        }

        // Kiểm tra mật khẩu khớp
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp!");
        }

        // Validate độ mạnh mật khẩu
        validatePassword(request.getPassword());

        // Lưu thông tin đăng ký tạm vào OTP (chỉ gửi OTP, user chưa được tạo)
        // Xóa OTP cũ cho email này
        otpRepository.deleteByEmailAndOtpType(email, "REGISTER");

        // Tạo OTP mới
        String otp = generateOtp();
        OtpVerification otpEntity = OtpVerification.builder()
                .email(email)
                .otpCode(otp)
                .otpType("REGISTER")
                .isUsed(false)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES))
                .build();
        otpRepository.save(otpEntity);

        // Lưu pending user data vào một OTP đặc biệt (encode password và lưu vào email
        // field khác)
        // Cách đơn giản: lưu hashed password và fullName vào DB temp
        // Ta sẽ dùng một OTP thứ 2 để lưu user data tạm
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        String userData = request.getFullName() + "|" + encodedPassword + "|" + request.getPhone();
        OtpVerification dataHolder = OtpVerification.builder()
                .email(email)
                .otpCode(userData) // dùng field otpCode để lưu data tạm
                .otpType("REGISTER_DATA")
                .isUsed(false)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();
        otpRepository.save(dataHolder);

        // Gửi email OTP bất đồng bộ
        emailService.sendOtpEmail(email, otp, request.getFullName());

        log.info("📧 Đã tạo OTP {} cho email: {} (expires: {} phút)", otp, email, OTP_EXPIRE_MINUTES);
    }

    /*
     * =============================================
     * ĐĂNG KÝ – Bước 2: Xác nhận OTP
     * =============================================
     */
    @Override
    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otpCode = request.getOtpCode().trim();

        // Tìm OTP trong DB
        OtpVerification otp = otpRepository
                .findTopByEmailAndOtpTypeAndIsUsedFalseOrderByCreatedAtDesc(email, "REGISTER")
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không hợp lệ!"));

        // Kiểm tra hết hạn
        if (otp.isExpired()) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn! Vui lòng yêu cầu mã mới.");
        }

        // Kiểm tra mã đúng
        if (!otp.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("Mã OTP không đúng! Vui lòng kiểm tra lại.");
        }

        // Lấy data đăng ký tạm
        OtpVerification dataHolder = otpRepository
                .findTopByEmailAndOtpTypeAndIsUsedFalseOrderByCreatedAtDesc(email, "REGISTER_DATA")
                .orElseThrow(() -> new IllegalArgumentException("Dữ liệu đăng ký không tồn tại!"));

        String[] parts = dataHolder.getOtpCode().split("\\|", 3);
        String fullName = parts.length > 0 ? parts[0] : email;
        String passwordHash = parts.length > 1 ? parts[1] : "";
        String phone = parts.length > 2 ? parts[2] : "";

        // Tạo User
        Role customerRole = roleRepository.findByRoleName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().roleName("CUSTOMER").build()));

        User newUser = User.builder()
                .email(email)
                .passwordHash(passwordHash)
                .fullName(fullName)
                .phone(phone)
                .role(customerRole)
                .isActive(true)
                .build();
        userRepository.save(newUser);

        // Đánh dấu OTP đã dùng
        otp.setIsUsed(true);
        dataHolder.setIsUsed(true);
        otpRepository.save(otp);
        otpRepository.save(dataHolder);

        // Tạo JWT và trả về
        var userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateToken(userDetails);

        log.info("✅ Đăng ký thành công: {}", email);
        return buildAuthResponse(token, newUser);
    }

    /*
     * =============================================
     * GỬI LẠI OTP
     * =============================================
     */
    @Override
    @Transactional
    public void resendOtp(String email, String otpType) {
        email = email.trim().toLowerCase();

        // Tìm data holder
        Optional<OtpVerification> dataHolderOpt = otpRepository
                .findTopByEmailAndOtpTypeAndIsUsedFalseOrderByCreatedAtDesc(email, "REGISTER_DATA");

        String fullName = "bạn";
        if (dataHolderOpt.isPresent()) {
            String[] parts = dataHolderOpt.get().getOtpCode().split("\\|", 3);
            if (parts.length > 0)
                fullName = parts[0];
        }

        // Xóa OTP cũ
        otpRepository.deleteByEmailAndOtpType(email, otpType);

        // Tạo OTP mới
        String newOtp = generateOtp();
        OtpVerification otpEntity = OtpVerification.builder()
                .email(email)
                .otpCode(newOtp)
                .otpType(otpType)
                .isUsed(false)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES))
                .build();
        otpRepository.save(otpEntity);

        emailService.sendOtpEmail(email, newOtp, fullName);
        log.info("🔄 Đã gửi lại OTP cho: {}", email);
    }

    /*
     * =============================================
     * QUÊN MẬT KHẨU
     * =============================================
     */
    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // 1. Kiểm tra email tồn tại
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại trong hệ thống!"));

        // 2. Xóa các OTP đặt lại mật khẩu cũ của email này
        otpRepository.deleteByEmailAndOtpType(email, "RESET_PASSWORD");

        // 3. Tạo mã OTP mới
        String otp = generateOtp();
        OtpVerification otpEntity = OtpVerification.builder()
                .email(email)
                .otpCode(otp)
                .otpType("RESET_PASSWORD")
                .isUsed(false)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES))
                .build();
        otpRepository.save(otpEntity);

        // 4. Gửi email xác thực đặt lại mật khẩu
        emailService.sendResetPasswordOtpEmail(email, otp, user.getFullName());
        log.info("📧 Đã gửi mã khôi phục mật khẩu OTP {} cho email: {}", otp, email);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otpCode = request.getOtpCode().trim();

        // 1. Tìm User
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản người dùng!"));

        // 2. Tìm OTP mới nhất cho đặt lại mật khẩu
        OtpVerification otp = otpRepository
                .findTopByEmailAndOtpTypeAndIsUsedFalseOrderByCreatedAtDesc(email, "RESET_PASSWORD")
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP khôi phục mật khẩu không hợp lệ hoặc đã sử dụng!"));

        // 3. Kiểm tra hết hạn
        if (otp.isExpired()) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn! Vui lòng gửi lại mã mới.");
        }

        // 4. Kiểm tra mã khớp
        if (!otp.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("Mã OTP không chính xác!");
        }

        // 5. Kiểm tra mật khẩu khớp
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("Mật khẩu mới tối thiểu phải có 8 ký tự!");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp!");
        }

        // 6. Đổi mật khẩu
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 7. Đánh dấu OTP đã sử dụng
        otp.setIsUsed(true);
        otpRepository.save(otp);
        log.info("🔒 Đổi mật khẩu thành công cho tài khoản: {}", email);
    }

    /*
     * =============================================
     * HELPERS
     * =============================================
     */
    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int num = 100000 + random.nextInt(900000);
        return String.valueOf(num);
    }

    private void validatePassword(String password) {
        if (password.length() < 8) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 8 ký tự!");
        }
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .roleName(user.getRole() != null ? user.getRole().getRoleName() : "CUSTOMER")
                .avatar(user.getAvatar())
                .build();
    }
}
