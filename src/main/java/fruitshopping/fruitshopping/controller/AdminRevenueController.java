package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.RevenueStatsResponse;
import fruitshopping.fruitshopping.dto.response.RevenueTransactionResponse;
import fruitshopping.fruitshopping.service.AdminRevenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/revenue")
@RequiredArgsConstructor
public class AdminRevenueController {

    private final AdminRevenueService adminRevenueService;

    @GetMapping("/stats")
    public ResponseEntity<?> getRevenueStats(@RequestParam(defaultValue = "ALL") String period) {
        try {
            checkAdminAccess();
            RevenueStatsResponse stats = adminRevenueService.getRevenueStats(period);
            return ResponseEntity.ok(ApiResponse.ok(stats));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getRevenueTransactions() {
        try {
            checkAdminAccess();
            List<RevenueTransactionResponse> transactions = adminRevenueService.getRevenueTransactions();
            return ResponseEntity.ok(ApiResponse.ok(transactions));
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
            throw new SecurityException("Bạn không có quyền thực hiện tác vụ này!");
        }
    }
}
