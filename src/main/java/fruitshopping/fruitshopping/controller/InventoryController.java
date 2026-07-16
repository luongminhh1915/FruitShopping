package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.entity.Inventory;
import fruitshopping.fruitshopping.entity.Product;
import fruitshopping.fruitshopping.repository.InventoryRepository;
import fruitshopping.fruitshopping.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    /** GET /api/inventory — Lấy toàn bộ danh sách tồn kho */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllInventory() {
        List<Inventory> list = inventoryRepository.findAllWithProduct();
        List<Map<String, Object>> result = list.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** GET /api/inventory/low-stock — Lấy danh sách hàng sắp hết */
    @GetMapping("/low-stock")
    public ResponseEntity<List<Map<String, Object>>> getLowStock() {
        List<Inventory> list = inventoryRepository.findLowStockItems();
        List<Map<String, Object>> result = list.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** GET /api/inventory/{productId} — Lấy tồn kho theo sản phẩm */
    @GetMapping("/{productId}")
    public ResponseEntity<Map<String, Object>> getByProduct(@PathVariable Integer productId) {
        return inventoryRepository.findByProduct_ProductId(productId)
                .map(inv -> ResponseEntity.ok(toMap(inv)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/inventory — Tạo mới hoặc cập nhật tồn kho */
    @PostMapping
    public ResponseEntity<Map<String, Object>> upsertInventory(@RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer productId = (Integer) body.get("productId");
            Integer quantity = (Integer) body.get("quantityInStock");
            Integer threshold = body.get("lowStockThreshold") != null
                    ? (Integer) body.get("lowStockThreshold") : 10;

            if (productId == null || quantity == null) {
                response.put("success", false);
                response.put("message", "Thiếu productId hoặc quantityInStock");
                return ResponseEntity.badRequest().body(response);
            }

            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) {
                response.put("success", false);
                response.put("message", "Không tìm thấy sản phẩm #" + productId);
                return ResponseEntity.badRequest().body(response);
            }

            Inventory inv = inventoryRepository.findByProduct(product)
                    .orElse(Inventory.builder().product(product).build());
            inv.setQuantityInStock(quantity);
            inv.setLowStockThreshold(threshold);
            inventoryRepository.save(inv);

            response.put("success", true);
            response.put("data", toMap(inv));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /** PUT /api/inventory/{productId}/adjust — Điều chỉnh số lượng (+/-) */
    @PutMapping("/{productId}/adjust")
    public ResponseEntity<Map<String, Object>> adjustQuantity(
            @PathVariable Integer productId,
            @RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer delta = (Integer) body.get("delta"); // dương = nhập kho, âm = xuất kho
            if (delta == null) {
                response.put("success", false);
                response.put("message", "Thiếu trường 'delta'");
                return ResponseEntity.badRequest().body(response);
            }

            Inventory inv = inventoryRepository.findByProduct_ProductId(productId).orElse(null);
            if (inv == null) {
                response.put("success", false);
                response.put("message", "Không tìm thấy tồn kho của sản phẩm #" + productId);
                return ResponseEntity.notFound().build();
            }

            int newQty = inv.getQuantityInStock() + delta;
            if (newQty < 0) {
                response.put("success", false);
                response.put("message", "Số lượng tồn kho không thể âm!");
                return ResponseEntity.badRequest().body(response);
            }

            inv.setQuantityInStock(newQty);
            inventoryRepository.save(inv);

            response.put("success", true);
            response.put("data", toMap(inv));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /** DELETE /api/inventory/{productId} — Xóa bản ghi tồn kho */
    @DeleteMapping("/{productId}")
    public ResponseEntity<Map<String, Object>> deleteInventory(@PathVariable Integer productId) {
        Map<String, Object> response = new HashMap<>();
        Inventory inv = inventoryRepository.findByProduct_ProductId(productId).orElse(null);
        if (inv == null) {
            response.put("success", false);
            response.put("message", "Không tìm thấy tồn kho sản phẩm #" + productId);
            return ResponseEntity.notFound().build();
        }
        inventoryRepository.delete(inv);
        response.put("success", true);
        response.put("message", "Đã xóa tồn kho sản phẩm #" + productId);
        return ResponseEntity.ok(response);
    }

    /** POST /api/inventory/init-all — Tự động tạo bản ghi tồn kho cho tất cả sản phẩm chưa có */
    @PostMapping("/init-all")
    public ResponseEntity<Map<String, Object>> initAllInventory() {
        Map<String, Object> response = new HashMap<>();
        List<Product> allProducts = productRepository.findAll();
        int created = 0;
        for (Product p : allProducts) {
            if (inventoryRepository.findByProduct(p).isEmpty()) {
                inventoryRepository.save(Inventory.builder()
                        .product(p)
                        .quantityInStock(0)
                        .lowStockThreshold(10)
                        .build());
                created++;
            }
        }
        response.put("success", true);
        response.put("message", "Đã tạo " + created + " bản ghi tồn kho mới.");
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> toMap(Inventory inv) {
        Map<String, Object> map = new HashMap<>();
        map.put("inventoryId", inv.getInventoryId());
        map.put("productId", inv.getProduct().getProductId());
        map.put("productName", inv.getProduct().getName());
        map.put("productImage", inv.getProduct().getImgUrl());
        map.put("categoryName", inv.getProduct().getCategory() != null
                ? inv.getProduct().getCategory().getName() : "N/A");
        map.put("price", inv.getProduct().getPrice());
        map.put("unit", inv.getProduct().getUnit());
        map.put("quantityInStock", inv.getQuantityInStock());
        map.put("lowStockThreshold", inv.getLowStockThreshold());
        map.put("updatedAt", inv.getUpdatedAt() != null ? inv.getUpdatedAt().toString() : null);
        // Trạng thái tồn kho
        if (inv.getQuantityInStock() == 0) {
            map.put("stockStatus", "out_of_stock");
            map.put("stockStatusLabel", "Hết hàng");
        } else if (inv.getQuantityInStock() <= inv.getLowStockThreshold()) {
            map.put("stockStatus", "low_stock");
            map.put("stockStatusLabel", "Sắp hết hàng");
        } else {
            map.put("stockStatus", "in_stock");
            map.put("stockStatusLabel", "Còn hàng");
        }
        return map;
    }
}
