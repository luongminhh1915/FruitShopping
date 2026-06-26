package fruitshopping.fruitshopping.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Role")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Integer roleId;

    @Column(name = "role_name", nullable = false, length = 50)
    private String roleName;
}
