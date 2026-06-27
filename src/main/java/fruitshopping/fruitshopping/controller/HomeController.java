package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.CategoryResponse;
import fruitshopping.fruitshopping.dto.response.ProductResponse;
import fruitshopping.fruitshopping.service.CategoryService;
import fruitshopping.fruitshopping.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HomeController {

    private final CategoryService categoryService;
    private final ProductService productService;

    // -------- Danh mục --------

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllRootCategories()));
    }

    @GetMapping("/categories/all")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategoriesIncludingChildren() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllCategories()));
    }

    // -------- Sản phẩm --------

    @GetMapping("/products/featured")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFeaturedProducts(
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getFeaturedProducts(limit)));
    }

    @GetMapping("/products/new")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getNewProducts(
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getNewProducts(limit)));
    }

    @GetMapping("/products/category/{categoryId}")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByCategory(
            @PathVariable Integer categoryId,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductsByCategory(categoryId, limit)));
    }

    @GetMapping("/products/search")
    public ResponseEntity<ApiResponse<?>> searchProducts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.ok(productService.searchProducts(keyword, page, size)));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductById(id)));
    }
}
