package fruitshopping.fruitshopping.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name:FruitFresh}")
    private String appName;

    /**
     * Gửi email OTP xác nhận đăng ký
     */
    @Async
    public void sendOtpEmail(String toEmail, String otpCode, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, appName);
            helper.setTo(toEmail);
            helper.setSubject("🍎 " + appName + " – Mã xác nhận đăng ký tài khoản");

            String htmlContent = buildOtpEmailHtml(fullName, otpCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Đã gửi OTP {} đến email: {}", otpCode, toEmail);

        } catch (Exception e) {
            log.error("❌ Không thể gửi email OTP đến {}: {}", toEmail, e.getMessage());
            // Không throw exception – OTP vẫn được tạo trong DB
        }
    }

    /**
     * Gửi email OTP xác nhận khôi phục mật khẩu
     */
    @Async
    public void sendResetPasswordOtpEmail(String toEmail, String otpCode, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, appName);
            helper.setTo(toEmail);
            helper.setSubject("🔒 " + appName + " – Yêu cầu đặt lại mật khẩu");

            String htmlContent = buildResetPasswordEmailHtml(fullName, otpCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Đã gửi OTP đặt lại mật khẩu {} đến email: {}", otpCode, toEmail);

        } catch (Exception e) {
            log.error("❌ Không thể gửi email khôi phục mật khẩu đến {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildResetPasswordEmailHtml(String fullName, String otpCode) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"/></head>
            <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#e11d48,#be123c);padding:32px;text-align:center;">
                        <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">🔒 FruitFresh</h1>
                        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Khôi Phục Mật Khẩu Tài Khoản</p>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 48px;">
                        <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 12px;">Xin chào, %s! 👋</h2>
                        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                          Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>FruitFresh</strong>. 
                          Vui lòng sử dụng mã xác nhận bảo mật dưới đây để hoàn tất việc khôi phục mật khẩu:
                        </p>
                        
                        <!-- OTP Box -->
                        <div style="background:linear-gradient(135deg,#fff1f2,#ffe4e6);border:2px solid #fecdd3;border-radius:16px;padding:32px;text-align:center;margin:24px 0;">
                          <p style="margin:0 0 8px;color:#9f1239;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">Mã khôi phục mật khẩu</p>
                          <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#e11d48;font-family:'Courier New',monospace;">%s</div>
                          <p style="margin:12px 0 0;color:#f43f5e;font-size:13px;">⏰ Mã có hiệu lực trong <strong>10 phút</strong></p>
                        </div>
                        
                        <p style="color:#888;font-size:13px;line-height:1.6;margin:24px 0 0;">
                          Nếu bạn không có yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ ngay với bộ phận chăm sóc khách hàng. 
                          Tuyệt đối <strong>không chia sẻ mã</strong> này cho bất kỳ ai khác để tránh mất tài khoản.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background:#f8f8f8;padding:24px 48px;border-top:1px solid #eee;text-align:center;">
                        <p style="color:#999;font-size:12px;margin:0;">© 2025 FruitFresh. Made with 💚 in Vietnam</p>
                        <p style="color:#bbb;font-size:11px;margin:8px 0 0;">123 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                fullName != null && !fullName.isBlank() ? fullName : "bạn",
                formatOtp(otpCode)
        );
    }

    /**
     * HTML template email OTP đẹp
     */
    private String buildOtpEmailHtml(String fullName, String otpCode) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"/></head>
            <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#1E6332,#2D8B47);padding:32px;text-align:center;">
                        <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">🍎 FruitFresh</h1>
                        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Hoa Quả Tươi Sạch Cao Cấp</p>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 48px;">
                        <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 12px;">Xin chào, %s! 👋</h2>
                        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                          Cảm ơn bạn đã đăng ký tài khoản tại <strong>FruitFresh</strong>. 
                          Vui lòng sử dụng mã xác nhận bên dưới để hoàn tất đăng ký:
                        </p>
                        
                        <!-- OTP Box -->
                        <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:16px;padding:32px;text-align:center;margin:24px 0;">
                          <p style="margin:0 0 8px;color:#166534;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">Mã xác nhận của bạn</p>
                          <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#15803d;font-family:'Courier New',monospace;">%s</div>
                          <p style="margin:12px 0 0;color:#16a34a;font-size:13px;">⏰ Mã có hiệu lực trong <strong>10 phút</strong></p>
                        </div>
                        
                        <p style="color:#888;font-size:13px;line-height:1.6;margin:24px 0 0;">
                          Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này. 
                          Tuyệt đối <strong>không chia sẻ mã</strong> này với người khác.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background:#f8f8f8;padding:24px 48px;border-top:1px solid #eee;text-align:center;">
                        <p style="color:#999;font-size:12px;margin:0;">© 2025 FruitFresh. Made with 💚 in Vietnam</p>
                        <p style="color:#bbb;font-size:11px;margin:8px 0 0;">123 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                fullName != null && !fullName.isBlank() ? fullName : "bạn",
                formatOtp(otpCode)
        );
    }

    /** Thêm khoảng cách giữa các chữ số OTP */
    private String formatOtp(String otp) {
        StringBuilder sb = new StringBuilder();
        for (char c : otp.toCharArray()) {
            sb.append(c).append(' ');
        }
        return sb.toString().trim();
    }
}
