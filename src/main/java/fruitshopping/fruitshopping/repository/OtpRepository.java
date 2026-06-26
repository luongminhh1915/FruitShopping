package fruitshopping.fruitshopping.repository;

import fruitshopping.fruitshopping.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<OtpVerification, Integer> {

    Optional<OtpVerification> findTopByEmailAndOtpTypeAndIsUsedFalseOrderByCreatedAtDesc(
            String email, String otpType);

    @Modifying
    @Transactional
    @Query("DELETE FROM OtpVerification o WHERE o.email = :email AND o.otpType = :otpType")
    void deleteByEmailAndOtpType(String email, String otpType);
}
