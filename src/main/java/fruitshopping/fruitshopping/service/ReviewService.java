package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.request.CreateReviewRequest;
import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.ReviewResponse;

import java.util.List;

public interface ReviewService {
    List<ReviewResponse> getProductReviews(Integer productId);
    ApiResponse<ReviewResponse> addProductReview(Integer productId, CreateReviewRequest request);
}
