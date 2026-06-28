package fruitshopping.fruitshopping.controller;

import fruitshopping.fruitshopping.dto.request.CreateReviewRequest;
import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.ReviewResponse;
import fruitshopping.fruitshopping.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/{productId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getProductReviews(@PathVariable Integer productId) {
        try {
            List<ReviewResponse> reviews = reviewService.getProductReviews(productId);
            return ResponseEntity.ok(ApiResponse.ok(reviews));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi khi tải đánh giá: " + e.getMessage()));
        }
    }

    @PostMapping("/{productId}/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> addProductReview(
            @PathVariable Integer productId,
            @RequestBody CreateReviewRequest request) {
        try {
            ApiResponse<ReviewResponse> response = reviewService.addProductReview(productId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi khi gửi đánh giá: " + e.getMessage()));
        }
    }
}
