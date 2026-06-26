package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getAllRootCategories();

    List<CategoryResponse> getAllCategories();
}
