package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.request.ProductRequest;
import fruitshopping.fruitshopping.dto.response.ProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductService {

    List<ProductResponse> getFeaturedProducts(int limit);

    List<ProductResponse> getNewProducts(int limit);

    List<ProductResponse> getProductsByCategory(Integer categoryId, int limit);

    Page<ProductResponse> searchProducts(String keyword, int page, int size);

    ProductResponse getProductById(Integer id);

    List<ProductResponse> getAllProducts();

    ProductResponse createProduct(ProductRequest request);

    ProductResponse updateProduct(Integer id, ProductRequest request);

    void deleteProduct(Integer id);
}

