package fruitshopping.fruitshopping.repository;

import fruitshopping.fruitshopping.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE LOWER(p.paymentMethod) LIKE '%vnpay%' AND (:startDate IS NULL OR p.paymentDate >= :startDate)")
    BigDecimal sumVnPayRevenue(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE LOWER(p.paymentMethod) NOT LIKE '%vnpay%' AND (:startDate IS NULL OR p.paymentDate >= :startDate)")
    BigDecimal sumCodRevenue(@Param("startDate") LocalDateTime startDate);
}
