package fruitshopping.fruitshopping.service.impl;

import fruitshopping.fruitshopping.dto.request.ProductRequest;
import fruitshopping.fruitshopping.dto.response.ProductResponse;
import fruitshopping.fruitshopping.entity.Product;
import fruitshopping.fruitshopping.entity.Category;
import fruitshopping.fruitshopping.entity.Shop;
import fruitshopping.fruitshopping.repository.ProductRepository;
import fruitshopping.fruitshopping.repository.CategoryRepository;
import fruitshopping.fruitshopping.repository.ShopRepository;
import fruitshopping.fruitshopping.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ShopRepository shopRepository;


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

    @Override
    public ProductResponse getProductById(Integer id) {
        return productRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với id: " + id));
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll(Sort.by("productId").descending())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Category với id: " + request.getCategoryId()));
        
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Shop với id: " + request.getShopId()));

        Product product = Product.builder()
                .name(request.getName())
                .category(category)
                .shop(shop)
                .imgUrl(request.getImgUrl())
                .description(request.getDescription())
                .origin(request.getOrigin())
                .unit(request.getUnit())
                .price(request.getPrice())
                .status(request.getStatus() != null ? request.getStatus() : 1)
                .build();

        Product saved = productRepository.save(product);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Integer id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với id: " + id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Category với id: " + request.getCategoryId()));
        
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Shop với id: " + request.getShopId()));

        product.setName(request.getName());
        product.setCategory(category);
        product.setShop(shop);
        product.setImgUrl(request.getImgUrl());
        product.setDescription(request.getDescription());
        product.setOrigin(request.getOrigin());
        product.setUnit(request.getUnit());
        product.setPrice(request.getPrice());
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }

        Product saved = productRepository.save(product);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteProduct(Integer id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy sản phẩm với id: " + id);
        }
        productRepository.deleteById(id);
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
                .categoryId(product.getCategory() != null ? product.getCategory().getCategoryId() : null)
                .shopName(product.getShop() != null ? product.getShop().getShopName() : null)
                .shopId(product.getShop() != null ? product.getShop().getShopId() : null)
                .createAt(product.getCreateAt())
                .build();
    }
}

