package fruitshopping.fruitshopping.config;

import fruitshopping.fruitshopping.entity.Role;
import fruitshopping.fruitshopping.entity.User;
import fruitshopping.fruitshopping.repository.RoleRepository;
import fruitshopping.fruitshopping.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 Checking database initialization...");

        // Fix column length in case it was created as VARCHAR(6) by Hibernate previously
        try {
            jdbcTemplate.execute("ALTER TABLE otp_verification ALTER COLUMN otp_code VARCHAR(500) NOT NULL");
            log.info("⚙️ Successfully altered otp_verification.otp_code column length to 500");
        } catch (Exception e) {
            log.debug("ℹ️ Alter column check (might already be 500): {}", e.getMessage());
        }

        // 1. Initialize Roles
        Role adminRole = getOrCreateRole("ADMIN");
        Role sellerRole = getOrCreateRole("SELLER");
        Role customerRole = getOrCreateRole("CUSTOMER");

        // 2. Initialize Default Users
        createDefaultUser("admin@fruitfresh.vn", "Admin@123", "Quản Trị Viên", "0901234567", adminRole);
        createDefaultUser("seller@fruitfresh.vn", "Seller@123", "Nguyễn Văn Bán", "0912345678", sellerRole);
        createDefaultUser("customer@fruitfresh.vn", "Test@123", "Trần Thị Mua", "0923456789", customerRole);

        log.info("✅ Database initialization complete!");
    }

    private Role getOrCreateRole(String roleName) {
        return roleRepository.findByRoleName(roleName)
                .orElseGet(() -> {
                    log.info("➕ Creating role: {}", roleName);
                    return roleRepository.save(Role.builder().roleName(roleName).build());
                });
    }

    private void createDefaultUser(String email, String rawPassword, String fullName, String phone, Role role) {
        if (!userRepository.existsByEmail(email)) {
            log.info("➕ Creating default user: {}", email);
            String encodedPassword = passwordEncoder.encode(rawPassword);
            User user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .phone(phone)
                    .passwordHash(encodedPassword)
                    .role(role)
                    .isActive(true)
                    .build();
            userRepository.save(user);
        }
    }
}
