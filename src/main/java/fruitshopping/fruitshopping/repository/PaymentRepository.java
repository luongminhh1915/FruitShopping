package fruitshopping.fruitshopping.repository;

import fruitshopping.fruitshopping.entity.Order;
import fruitshopping.fruitshopping.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    /** Lấy payment theo order – dùng trong toResponse() */
    Optional<Payment> findFirstByOrder(Order order);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE LOWER(p.paymentMethod) LIKE '%vnpay%' AND (:startDate IS NULL OR p.paymentDate >= :startDate)")
    BigDecimal sumVnPayRevenue(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE LOWER(p.paymentMethod) NOT LIKE '%vnpay%' AND (:startDate IS NULL OR p.paymentDate >= :startDate)")
    BigDecimal sumCodRevenue(@Param("startDate") LocalDateTime startDate);
}
