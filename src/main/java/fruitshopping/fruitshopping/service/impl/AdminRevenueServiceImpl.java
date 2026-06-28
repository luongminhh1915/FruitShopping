package fruitshopping.fruitshopping.service.impl;

import fruitshopping.fruitshopping.dto.response.RevenueStatsResponse;
import fruitshopping.fruitshopping.dto.response.RevenueTransactionResponse;
import fruitshopping.fruitshopping.entity.Order;
import fruitshopping.fruitshopping.repository.OrderRepository;
import fruitshopping.fruitshopping.repository.PaymentRepository;
import fruitshopping.fruitshopping.service.AdminRevenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminRevenueServiceImpl implements AdminRevenueService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public RevenueStatsResponse getRevenueStats(String period) {
        LocalDateTime startDate = null;
        LocalDateTime now = LocalDateTime.now();

        if ("TODAY".equalsIgnoreCase(period)) {
            startDate = now.toLocalDate().atStartOfDay();
        } else if ("WEEK".equalsIgnoreCase(period)) {
            startDate = now.minusDays(7);
        } else if ("MONTH".equalsIgnoreCase(period)) {
            startDate = now.minusDays(30);
        }

        BigDecimal totalRev = orderRepository.sumTotalRevenue(startDate);
        Long countOrders = orderRepository.countOrders(startDate);
        BigDecimal vnPayRev = paymentRepository.sumVnPayRevenue(startDate);
        BigDecimal codRev = paymentRepository.sumCodRevenue(startDate);

        if (totalRev == null)
            totalRev = BigDecimal.ZERO;
        if (countOrders == null)
            countOrders = 0L;
        if (vnPayRev == null)
            vnPayRev = BigDecimal.ZERO;
        if (codRev == null)
            codRev = BigDecimal.ZERO;

        return RevenueStatsResponse.builder()
                .totalRevenue(totalRev)
                .totalOrders(countOrders)
                .vnpayRevenue(vnPayRev)
                .codRevenue(codRev)
                .build();
    }

    @Override
    public List<RevenueTransactionResponse> getRevenueTransactions() {
        List<Order> orders = orderRepository.findAllByOrderByOrderTimeDesc();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        return orders.stream().map(order -> {
            String dateStr = order.getOrderTime() != null ? order.getOrderTime().format(formatter) : "Vừa xong";
            String payMethod = "Thanh toán khi nhận hàng (COD)";

            return RevenueTransactionResponse.builder()
                    .orderId("DH" + order.getOrderId())
                    .date(dateStr)
                    .address(order.getNote() != null ? order.getNote() : "Hà Nội")
                    .payMethod(payMethod)
                    .totalPrice(order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO)
                    .status("DELIVERED")
                    .build();
        }).collect(Collectors.toList());
    }
}
