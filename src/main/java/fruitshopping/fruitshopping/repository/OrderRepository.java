package fruitshopping.fruitshopping.repository;

import fruitshopping.fruitshopping.entity.Order;
import fruitshopping.fruitshopping.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    /** Tất cả đơn hàng, mới nhất trước – dùng cho Admin */
    List<Order> findAllByOrderByOrderTimeDesc();

    /** Đơn hàng của 1 user cụ thể – dùng cho Customer */
    List<Order> findAllByUserOrderByOrderTimeDesc(User user);

    @Query("SELECT SUM(o.total) FROM Order o WHERE (:startDate IS NULL OR o.orderTime >= :startDate)")
    BigDecimal sumTotalRevenue(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE (:startDate IS NULL OR o.orderTime >= :startDate)")
    Long countOrders(@Param("startDate") LocalDateTime startDate);
}
