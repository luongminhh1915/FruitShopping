package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.service.OrderService;
import fruitshopping.fruitshopping.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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

    /**
     * POST /api/payment/vnpay/create
     * Body: { "orderId": 12, "amount": 150000 }
     */
    @PostMapping("/create")
    public ResponseEntity<?> createPayment(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        try {
            int orderId = Integer.parseInt(body.get("orderId").toString());
            long amount = Long.parseLong(body.get("amount").toString());
            String orderInfo = "Thanh toan don hang #" + orderId;
            String ipAddr = request.getRemoteAddr();

            String payUrl = vnPayService.createPaymentUrl(orderId, amount, orderInfo, ipAddr);

            Map<String, String> response = new HashMap<>();
            response.put("payUrl", payUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Lỗi tạo URL thanh toán: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET /api/payment/vnpay/ipn
     * VNPay gọi trực tiếp về đây để cập nhật trạng thái đơn hàng bất kể trình duyệt của user tắt/mở
     */
    @GetMapping("/ipn")
    public ResponseEntity<String> ipnCallback(@RequestParam Map<String, String> params) {
        boolean isValid = vnPayService.verifySignature(params);
        if (!isValid) {
            return ResponseEntity.ok("{\"RspCode\":\"97\",\"Message\":\"Invalid Checksum\"}");
        }

        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef"); // Chính là orderId

        if ("00".equals(responseCode)) {
            try {
                int orderId = Integer.parseInt(txnRef);
                // 3 = Đã thanh toán
                orderService.updateOrderStatus(orderId, 3);
            } catch (Exception e) {
                return ResponseEntity.ok("{\"RspCode\":\"01\",\"Message\":\"Order not found\"}");
            }
        }

        return ResponseEntity.ok("{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}");
    }

    /**
     * GET /api/payment/vnpay/return
     * VNPay điều hướng user quay về trình duyệt tại đây
     */
    @GetMapping("/return")
    public void returnCallback(
            @RequestParam Map<String, String> params,
            HttpServletResponse response) throws Exception {

        boolean isValid = vnPayService.verifySignature(params);
        String responseCode = params.get("vnp_ResponseCode");

        if (isValid && "00".equals(responseCode)) {
            // Redirect về homepage với params success để frontend hiện thông báo thành công
            response.sendRedirect("/?payment=success&orderId=" + params.get("vnp_TxnRef"));
        } else {
            // Redirect về homepage với params thất bại
            response.sendRedirect("/?payment=failed");
        }
    }
}
