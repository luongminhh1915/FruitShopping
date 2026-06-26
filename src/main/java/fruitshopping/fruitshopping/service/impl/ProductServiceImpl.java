package fruitshopping.fruitshopping.service.impl;

import fruitshopping.fruitshopping.dto.response.ProductResponse;
import fruitshopping.fruitshopping.entity.Product;
import fruitshopping.fruitshopping.repository.ProductRepository;
import fruitshopping.fruitshopping.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public List<ProductResponse> getFeaturedProducts(int limit) {
        return productRepository
                .findByStatusOrderByCreateAtDesc(1, PageRequest.of(0, limit))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getNewProducts(int limit) {
        return productRepository
                .findByStatusOrderByCreateAtDesc(1, PageRequest.of(0, limit, Sort.by("createAt").descending()))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getProductsByCategory(Integer categoryId, int limit) {
        return productRepository
                .findByCategoryCategoryIdAndStatus(categoryId, 1, PageRequest.of(0, limit))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ProductResponse> searchProducts(String keyword, int page, int size) {
        return productRepository
                .searchByName(keyword, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .imgUrl(product.getImgUrl())
                .description(product.getDescription())
                .origin(product.getOrigin())
                .unit(product.getUnit())
                .price(product.getPrice())
                .status(product.getStatus())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .shopName(product.getShop() != null ? product.getShop().getShopName() : null)
                .createAt(product.getCreateAt())
                .build();
    }
}
