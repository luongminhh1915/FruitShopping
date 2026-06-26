package fruitshopping.fruitshopping.service.impl;

import fruitshopping.fruitshopping.dto.response.CategoryResponse;
import fruitshopping.fruitshopping.entity.Category;
import fruitshopping.fruitshopping.repository.CategoryRepository;
import fruitshopping.fruitshopping.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryResponse> getAllRootCategories() {
        return categoryRepository.findByParentIsNullOrderBySortOrderAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .parentId(category.getParent() != null ? category.getParent().getCategoryId() : null)
                .name(category.getName())
                .image(category.getImage())
                .sortOrder(category.getSortOrder())
                .build();
    }
}
