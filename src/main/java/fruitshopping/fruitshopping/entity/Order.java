package fruitshopping.fruitshopping.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "[Order]")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(name = "address_id")
    private Integer addressId;

    @Column(name = "status")
    private Integer status = 0;

    @Column(name = "total", nullable = false, precision = 18, scale = 2)
    private BigDecimal total;

    @Column(name = "note", length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "order_time")
    private LocalDateTime orderTime;
}
