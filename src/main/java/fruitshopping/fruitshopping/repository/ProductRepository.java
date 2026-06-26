package fruitshopping.fruitshopping.repository;

import fruitshopping.fruitshopping.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    // Sản phẩm theo danh mục
    List<Product> findByCategoryCategoryIdAndStatus(Integer categoryId, Integer status, Pageable pageable);

    // Sản phẩm nổi bật (status = 1), sắp xếp mới nhất
    List<Product> findByStatusOrderByCreateAtDesc(Integer status, Pageable pageable);

    // Tìm kiếm theo tên
    @Query("SELECT p FROM Product p WHERE p.status = 1 AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Product> searchByName(String keyword, Pageable pageable);

    // Sản phẩm theo cửa hàng
    List<Product> findByShopShopIdAndStatus(Integer shopId, Integer status);
}
