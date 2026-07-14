# 🏦 Hướng Dẫn Cấu Hình VNPay — FruitFresh

> Tài liệu này hướng dẫn từng bước cấu hình cổng thanh toán **VNPay** cho website FruitFresh,
> bao gồm cả môi trường **Sandbox (test)** và **Production (thật)** với tài khoản Techcombank.

---

## 📋 Mục Lục

1. Tổng quan hệ thống
2. Các file liên quan
3. Cấu hình Sandbox (Test)
4. Đăng ký VNPay Production
5. Liên kết Techcombank vào VNPay
6. Cấu hình Production
7. Test thử thanh toán Sandbox
8. Xử lý lỗi thường gặp

---

## 1. Tổng Quan Hệ Thống

### Luồng thanh toán VNPay trong FruitFresh:

    Khách bấm "Thanh toán VNPay"
            ↓
    POST /api/payment/vnpay/create
      → Tạo URL thanh toán có chữ ký HMAC-SHA512
            ↓
    Redirect sang trang VNPay (sandbox hoặc production)
      → Khách nhập thẻ ATM / quét QR / chuyển khoản
            ↓
    VNPay redirect về GET /api/payment/vnpay/return
      → Server xác thực chữ ký
      → Nếu thành công: cập nhật đơn hàng status = 3 (Đã thanh toán)
            ↓
    Redirect về trang chủ với ?payment=success

### Các file đã được code sẵn:

| File | Mô tả |
|------|-------|
| VNPayService.java | Tạo URL thanh toán, xác thực chữ ký |
| VNPayController.java | API /create và /return |
| home.js | Gọi API và redirect khách hàng |
| index.html | UI lựa chọn thanh toán VNPay |
| SecurityConfig.java | Cho phép endpoint VNPay không cần token |
| application.properties | Lưu các key cấu hình VNPay |

---

## 2. Các File Liên Quan

### src/main/resources/application.properties
`
vnpay.tmnCode=YOUR_TMN_CODE
vnpay.hashSecret=YOUR_HASH_SECRET
vnpay.payUrl=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.returnUrl=http://localhost:8080/api/payment/vnpay/return
`

---

## 3. Cấu Hình Sandbox (Test)

### Bước 1: Đăng ký tài khoản Sandbox
1. Truy cập: https://sandbox.vnpayment.vn/devreg/
2. Điền thông tin đăng ký (email, tên website, URL)
3. Sau khi đăng ký thành công, vào trang quản trị Sandbox

### Bước 2: Lấy thông tin Sandbox
Vào https://sandbox.vnpayment.vn → Đăng nhập → Thông tin tài khoản:
- Terminal ID (TmnCode): ví dụ ABCD1234
- Secret Key (HashSecret): ví dụ ABCDE12345FGHIJ67890KLMNO12345PQ

### Bước 3: Dán vào application.properties
`
vnpay.tmnCode=ABCD1234
vnpay.hashSecret=ABCDE12345FGHIJ67890KLMNO12345PQ
vnpay.payUrl=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.returnUrl=http://localhost:8080/api/payment/vnpay/return
`

---

## 4. Đăng Ký VNPay Production

### Bước 1: Đăng ký tại VNPay
1. Truy cập: https://business.vnpay.vn/
2. Nhấn "Đăng ký ngay"
3. Chọn loại tài khoản: Cá nhân hoặc Doanh nghiệp

### Bước 2: Chuẩn bị hồ sơ (Cá nhân)
- CMND/CCCD (2 mặt)
- Số tài khoản ngân hàng (Techcombank: 76488888888)
- Tên chủ tài khoản: LUONG HUU MINH
- URL website đang chạy thật (có domain hoặc IP public)

### Bước 3: Điền thông tin đăng ký
- Tên website: FruitFresh
- URL website: https://yourdomain.com
- Loại hàng hóa: Thực phẩm / Nông sản
- Ngân hàng nhận tiền: Techcombank
- Số tài khoản: 76488888888
- Tên chủ tài khoản: LUONG HUU MINH

### Bước 4: Chờ duyệt
VNPay sẽ xét duyệt trong 3-7 ngày làm việc.
Sau khi duyệt nhận được:
- Terminal ID (TmnCode)
- Secret Key (HashSecret)

---

## 5. Liên Kết Techcombank vào VNPay

1. Đăng nhập: https://merchant.vnpay.vn/
2. Vào Thông tin tài khoản → Tài khoản ngân hàng
3. Kiểm tra tài khoản Techcombank:
   - Ngân hàng: Techcombank
   - Số tài khoản: 76488888888
   - Chủ tài khoản: LUONG HUU MINH
4. Thiết lập lịch quyết toán (settlement):
   - Hàng ngày: tiền được chuyển về Techcombank mỗi ngày
   - Theo tuần: chuyển mỗi thứ 2

---

## 6. Cấu Hình Production

Sau khi có TmnCode và HashSecret Production từ VNPay:

`properties
# application.properties — PRODUCTION

vnpay.tmnCode=FRUIT001
vnpay.hashSecret=ABCXYZ_PRODUCTION_SECRET_KEY
vnpay.payUrl=https://pay.vnpay.vn/vpcpay.html
vnpay.returnUrl=https://yourdomain.com/api/payment/vnpay/return
app.url=https://yourdomain.com
`

QUAN TRỌNG: returnUrl phải là URL có thể truy cập từ Internet.

Khởi động lại server:
`
mvn spring-boot:run
`

---

## 7. Test Thử Thanh Toán Sandbox

### Thẻ test ATM nội địa VNPay:

| Thông tin | Giá trị |
|-----------|---------|
| Ngân hàng | NCB |
| Số thẻ | 9704198526191432198 |
| Tên chủ thẻ | NGUYEN VAN A |
| Ngày phát hành | 07/15 |
| OTP | 123456 |

### Các bước test:
1. Mở http://localhost:8080
2. Thêm hàng vào giỏ → Nhấn Thanh toán
3. Chọn "Thanh toán qua VNPay" → Nhấn Xác Nhận Đặt Hàng
4. Trang chuyển sang Sandbox VNPay → Chọn Thanh toán bằng thẻ ATM
5. Nhập thông tin thẻ test bên trên
6. Nhập OTP: 123456
7. Sau khi thanh toán, trang redirect về http://localhost:8080/?payment=success
8. Vào Admin → Nhật ký giao dịch → Đơn hàng có status "Đã thanh toán"

---

## 8. Xử Lý Lỗi Thường Gặp

### Lỗi "Không tìm thấy website" (mã 72)
Nguyên nhân: TmnCode sai hoặc website chưa được duyệt.
Giải pháp:
1. Kiểm tra vnpay.tmnCode trong application.properties
2. Đăng nhập vào https://sandbox.vnpayment.vn và copy lại TmnCode chính xác

### Lỗi "Chữ ký không hợp lệ" (mã 97)
Nguyên nhân: HashSecret sai, hoặc URL encode không đúng.
Giải pháp:
1. Kiểm tra vnpay.hashSecret trong application.properties
2. Đảm bảo không có khoảng trắng thừa ở đầu/cuối key

### Sau thanh toán không redirect về được
Nguyên nhân: returnUrl trỏ về localhost nhưng VNPay không gọi được.
Giải pháp — dùng ngrok:
`
ngrok http 8080
`
Ngrok sẽ in ra URL: https://abc123.ngrok.io
Cập nhật application.properties:
`
vnpay.returnUrl=https://abc123.ngrok.io/api/payment/vnpay/return
app.url=https://abc123.ngrok.io
`

---

## 📞 Liên Hệ VNPay
- Hotline: 1900 55 55 77
- Email: hotro@vnpay.vn
- Portal Merchant: https://merchant.vnpay.vn
- Sandbox Dev: https://sandbox.vnpayment.vn
- Tài liệu API: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html

---

## ✅ Checklist Hoàn Tất

- [ ] Đã đăng ký tài khoản VNPay Sandbox
- [ ] Đã dán TmnCode và HashSecret vào application.properties
- [ ] Test thẻ sandbox thành công (mã phản hồi 00)
- [ ] Đơn hàng cập nhật status = "Đã thanh toán" sau khi test
- [ ] Đã đăng ký VNPay Production với tài khoản Techcombank 76488888888
- [ ] Đã nhận TmnCode + HashSecret Production từ email VNPay
- [ ] Đã cập nhật application.properties sang Production keys
- [ ] Đã cập nhật returnUrl sang domain thật
- [ ] Test Production thành công
