package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.dto.request.ProductRequest;
import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.ProductResponse;
import fruitshopping.fruitshopping.entity.Shop;
import fruitshopping.fruitshopping.repository.ShopRepository;
import fruitshopping.fruitshopping.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;
    private final ShopRepository shopRepository;

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllProducts() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getAllProducts()));
    }

    @GetMapping("/shops")
    public ResponseEntity<ApiResponse<List<Shop>>> getActiveShops() {
        return ResponseEntity.ok(ApiResponse.ok(shopRepository.findByIsActiveTrue()));
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody ProductRequest request) {
        try {
            checkAdminAccess();
            ProductResponse created = productService.createProduct(request);
            return ResponseEntity.ok(ApiResponse.ok(created));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Integer id, @RequestBody ProductRequest request) {
        try {
            checkAdminAccess();
            ProductResponse updated = productService.updateProduct(id, request);
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Integer id) {
        try {
            checkAdminAccess();
            productService.deleteProduct(id);
            return ResponseEntity.ok(ApiResponse.ok("Xóa sản phẩm thành công!"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(jakarta.servlet.http.HttpServletRequest request) {
        try {
            checkAdminAccess();
            
            if (!(request instanceof org.springframework.web.multipart.MultipartHttpServletRequest)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Yêu cầu không phải là upload tệp tin (multipart)!"));
            }
            
            org.springframework.web.multipart.MultipartHttpServletRequest multipartRequest = 
                    (org.springframework.web.multipart.MultipartHttpServletRequest) request;
            
            org.springframework.web.multipart.MultipartFile file = multipartRequest.getFile("file");
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Tệp tin rỗng hoặc không tìm thấy tham số 'file'!"));
            }

            String userDir = System.getProperty("user.dir");
            
            // Ensure directory exists in resource folder
            java.io.File uploadDir = new java.io.File(userDir, "src/main/resources/static/assets/images/uploads");
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            java.io.File destFile = new java.io.File(uploadDir, filename);
            file.transferTo(destFile.getAbsoluteFile());

            // Also copy to target directory so it is served instantly
            java.io.File targetDir = new java.io.File(userDir, "target/classes/static/assets/images/uploads");
            if (!targetDir.exists()) {
                targetDir.mkdirs();
            }
            java.io.File targetDestFile = new java.io.File(targetDir, filename);
            org.springframework.util.FileCopyUtils.copy(destFile.getAbsoluteFile(), targetDestFile.getAbsoluteFile());

            String fileUrl = "/assets/images/uploads/" + filename;
            return ResponseEntity.ok(ApiResponse.ok(fileUrl));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Lỗi upload: " + e.getMessage()));
        }
    }


    private void checkAdminAccess() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new SecurityException("Bạn cần đăng nhập để thực hiện tác vụ này!");
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new SecurityException("Bạn không có quyền thực hiện tác vụ này!");
        }
    }
}
