package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.UserAdminResponse;
import fruitshopping.fruitshopping.entity.Role;
import fruitshopping.fruitshopping.repository.RoleRepository;
import fruitshopping.fruitshopping.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final RoleRepository roleRepository;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            checkAdminAccess();
            List<UserAdminResponse> users = userService.getAllUsers();
            return ResponseEntity.ok(ApiResponse.ok(users));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/roles")
    public ResponseEntity<?> getAllRoles() {
        try {
            checkAdminAccess();
            List<Role> roles = roleRepository.findAll();
            return ResponseEntity.ok(ApiResponse.ok(roles));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Integer id) {
        try {
            checkAdminAccess();
            UserAdminResponse updated = userService.toggleUserStatus(id);
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Integer id, @RequestBody Map<String, Integer> body) {
        try {
            checkAdminAccess();
            Integer roleId = body.get("roleId");
            if (roleId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Thiếu thông tin roleId!"));
            }
            UserAdminResponse updated = userService.updateUserRole(id, roleId);
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private void checkAdminAccess() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new SecurityException("Bạn cần đăng nhập để thực hiện tác vụ này!");
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_ADMIN") 
                            || a.getAuthority().equalsIgnoreCase("ADMIN"));
        if (!isAdmin) {
            throw new SecurityException("Bạn không có quyền thực hiện tác vụ này! Quyền của bạn: " + authentication.getAuthorities());
        }
    }
}
