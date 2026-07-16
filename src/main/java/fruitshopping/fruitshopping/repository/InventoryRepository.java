package fruitshopping.fruitshopping.repository;

import fruitshopping.fruitshopping.entity.Inventory;
import fruitshopping.fruitshopping.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {

    Optional<Inventory> findByProduct(Product product);

    Optional<Inventory> findByProduct_ProductId(Integer productId);

    /** Lấy các sản phẩm có số lượng tồn kho thấp hơn hoặc bằng ngưỡng cảnh báo */
    @Query("SELECT i FROM Inventory i WHERE i.quantityInStock <= i.lowStockThreshold")
    List<Inventory> findLowStockItems();

    /** Lấy toàn bộ inventory kèm thông tin sản phẩm */
    @Query("SELECT i FROM Inventory i JOIN FETCH i.product p JOIN FETCH p.category ORDER BY p.name ASC")
    List<Inventory> findAllWithProduct();
}
