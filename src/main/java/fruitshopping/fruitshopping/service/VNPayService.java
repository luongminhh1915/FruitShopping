package fruitshopping.fruitshopping.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VNPayService {

    @Value("${vnpay.tmnCode}")
    private String tmnCode;

    @Value("${vnpay.hashSecret}")
    private String hashSecret;

    @Value("${vnpay.payUrl}")
    private String payUrl;

    @Value("${vnpay.returnUrl}")
    private String returnUrl;

    /**
     * Tạo URL thanh toán VNPay
     */
    public String createPaymentUrl(int orderId, long amount, String orderInfo, String ipAddr) {
        Map<String, String> vnpParams = new TreeMap<>();

        String vnpTxnRef = String.valueOf(orderId);
        String createDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());

        vnpParams.put("vnp_Version",    "2.1.0");
        vnpParams.put("vnp_Command",    "pay");
        vnpParams.put("vnp_TmnCode",    tmnCode);
        vnpParams.put("vnp_Amount",     String.valueOf(amount * 100)); // VNPay uses cents (multiplied by 100)
        vnpParams.put("vnp_CurrCode",   "VND");
        vnpParams.put("vnp_TxnRef",     vnpTxnRef);
        vnpParams.put("vnp_OrderInfo",  orderInfo);
        vnpParams.put("vnp_OrderType",  "other");
        vnpParams.put("vnp_Locale",     "vn");
        vnpParams.put("vnp_ReturnUrl",  returnUrl);
        vnpParams.put("vnp_IpAddr",     ipAddr);
        vnpParams.put("vnp_CreateDate", createDate);

        // Build query string and hash data
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> entry : vnpParams.entrySet()) {
            String value = entry.getValue();
            if (value != null && !value.isEmpty()) {
                String encodedKey   = URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII);
                String encodedValue = URLEncoder.encode(value, StandardCharsets.UTF_8);

                hashData.append(encodedKey).append('=').append(encodedValue).append('&');
                query.append(encodedKey).append('=').append(encodedValue).append('&');
            }
        }
        
        String hashDataStr = hashData.substring(0, hashData.length() - 1);
        String queryStr    = query.substring(0, query.length() - 1);

        String secureHash = hmacSHA512(hashSecret, hashDataStr);
        return payUrl + "?" + queryStr + "&vnp_SecureHash=" + secureHash;
    }

    /**
     * Xác minh chữ ký từ VNPay callback
     */
    public boolean verifySignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null) return false;

        // Loại bỏ vnp_SecureHash và vnp_SecureHashType
        Map<String, String> sortedParams = new TreeMap<>(params);
        sortedParams.remove("vnp_SecureHash");
        sortedParams.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            String value = entry.getValue();
            if (value != null && !value.isEmpty()) {
                hashData.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII))
                        .append('=')
                        .append(URLEncoder.encode(value, StandardCharsets.UTF_8))
                        .append('&');
            }
        }
        
        if (hashData.length() == 0) return false;
        String hashDataStr = hashData.substring(0, hashData.length() - 1);
        String computedHash = hmacSHA512(hashSecret, hashDataStr);

        return computedHash.equalsIgnoreCase(receivedHash);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] result = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : result) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error computing HMAC-SHA512", e);
        }
    }
}
