package fruitshopping.fruitshopping.config;

import fruitshopping.fruitshopping.entity.Role;
import fruitshopping.fruitshopping.entity.User;
import fruitshopping.fruitshopping.entity.Shop;
import fruitshopping.fruitshopping.entity.Category;
import fruitshopping.fruitshopping.repository.RoleRepository;
import fruitshopping.fruitshopping.repository.UserRepository;
import fruitshopping.fruitshopping.repository.ShopRepository;
import fruitshopping.fruitshopping.repository.CategoryRepository;
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
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 Checking database initialization...");

        // Fix column length in case it was created as VARCHAR(6) by Hibernate
        // previously
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
        createDefaultUser("admin@fruitfresh.vn", "minh1812", "Quản Trị Viên", "0901234567", adminRole);
        createDefaultUser("seller@fruitfresh.vn", "Seller@123", "Nguyễn Văn Bán", "0912345678", sellerRole);
        createDefaultUser("customer@fruitfresh.vn", "Test@123", "Trần Thị Mua", "0923456789", customerRole);

        // Force update admin password to minh1812
        userRepository.findByEmail("admin@fruitfresh.vn").ifPresent(admin -> {
            admin.setPasswordHash(passwordEncoder.encode("minh1812"));
            userRepository.save(admin);
        });

        // 3. Ensure a default Shop exists
        if (shopRepository.count() == 0) {
            User admin = userRepository.findByEmail("admin@fruitfresh.vn").orElse(null);
            if (admin != null) {
                log.info("➕ Creating default Shop: FruitFresh Store");
                Shop defaultShop = Shop.builder()
                        .shopName("FruitFresh Store")
                        .owner(admin)
                        .address("123 Đường Hoa Quả, TP. Hồ Chí Minh")
                        .phone("0901234567")
                        .isActive(true)
                        .build();
                shopRepository.save(defaultShop);
            }
        }

        // 4. Ensure default Categories exist
        if (categoryRepository.count() == 0) {
            String[] defaultCats = { "Nhiệt đới", "Nhập khẩu", "Organic", "Trái cây miền Nam", "Cam Quýt", "Dưa hấu",
                    "Khô - Sấy", "Giỏ hoa quả" };
            for (String catName : defaultCats) {
                log.info("➕ Creating default Category: {}", catName);
                categoryRepository.save(Category.builder()
                        .name(catName)
                        .sortOrder(0)
                        .build());
            }
        }

        // Ensure "Giỏ hoa quả" exists individually
        boolean hasGioHoaQua = categoryRepository.findAll().stream()
                .anyMatch(c -> "Giỏ hoa quả".equalsIgnoreCase(c.getName()));
        if (!hasGioHoaQua) {
            log.info("➕ Creating category: Giỏ hoa quả");
            categoryRepository.save(Category.builder()
                    .name("Giỏ hoa quả")
                    .sortOrder(0)
                    .build());
        }

        // Ensure "Các loại hoa quả" exists individually
        boolean hasCácLoại = categoryRepository.findAll().stream()
                .anyMatch(c -> "Các loại hoa quả".equalsIgnoreCase(c.getName()));
        if (!hasCácLoại) {
            log.info("➕ Creating category: Các loại hoa quả");
            categoryRepository.save(Category.builder()
                    .name("Các loại hoa quả")
                    .sortOrder(0)
                    .build());
        }

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
