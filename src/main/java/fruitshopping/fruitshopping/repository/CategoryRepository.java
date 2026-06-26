package fruitshopping.fruitshopping.repository;

import fruitshopping.fruitshopping.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    // Lấy danh mục gốc (không có parent)
    List<Category> findByParentIsNullOrderBySortOrderAsc();

    // Lấy danh mục con theo parent
    List<Category> findByParentCategoryIdOrderBySortOrderAsc(Integer parentId);
}
