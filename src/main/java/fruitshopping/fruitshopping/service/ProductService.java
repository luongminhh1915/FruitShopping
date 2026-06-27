package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.response.ProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductService {

    List<ProductResponse> getFeaturedProducts(int limit);

    List<ProductResponse> getNewProducts(int limit);

    List<ProductResponse> getProductsByCategory(Integer categoryId, int limit);

    Page<ProductResponse> searchProducts(String keyword, int page, int size);

    ProductResponse getProductById(Integer id);
}
