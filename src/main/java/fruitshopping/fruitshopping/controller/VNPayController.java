package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.service.OrderService;
import fruitshopping.fruitshopping.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/vnpay")
@RequiredArgsConstructor
public class VNPayController {

    private final VNPayService vnPayService;
    private final OrderService orderService;

    @Value("${app.url:http://localhost:8080}")
    private String appUrl;

    /**
     * POST /api/payment/vnpay/create
     * Nhận orderId và amount, trả về URL thanh toán VNPay
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createPayment(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String orderId = String.valueOf(body.get("orderId"));
            long amount = Long.parseLong(String.valueOf(body.get("amount")));
            String orderInfo = "Thanh toan don hang " + orderId;
            String clientIp = getClientIp(request);

            String paymentUrl = vnPayService.createPaymentUrl(orderId, amount, orderInfo, clientIp);
            response.put("paymentUrl", paymentUrl);
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi tạo URL thanh toán: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * GET /api/payment/vnpay/return
     * VNPay redirect về đây sau khi khách hàng thanh toán xong
     */
    @GetMapping("/return")
    public void handleReturn(HttpServletRequest request,
            jakarta.servlet.http.HttpServletResponse httpResponse) throws Exception {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                params.put(key, values[0]);
            }
        });

        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");
        boolean validSignature = vnPayService.verifySignature(params);

        if (validSignature && "00".equals(responseCode) && txnRef != null) {
            // Thanh toán thành công → cập nhật trạng thái đơn hàng = 3 (Đã thanh toán)
            try {
                orderService.updateOrderStatus(Integer.parseInt(txnRef), 3);
            } catch (Exception ignored) {}
            httpResponse.sendRedirect(appUrl + "/?payment=success&orderId=" + txnRef);
        } else {
            httpResponse.sendRedirect(appUrl + "/?payment=failed&orderId=" + (txnRef != null ? txnRef : ""));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return (ip == null || ip.isEmpty()) ? "127.0.0.1" : ip;
    }
}
