package fruitshopping.fruitshopping.service.impl;

import fruitshopping.fruitshopping.dto.request.CreateReviewRequest;
import fruitshopping.fruitshopping.dto.response.ApiResponse;
import fruitshopping.fruitshopping.dto.response.ReviewResponse;
import fruitshopping.fruitshopping.entity.*;
import fruitshopping.fruitshopping.repository.*;
import fruitshopping.fruitshopping.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getProductReviews(Integer productId) {
        List<Review> reviews = reviewRepository.findByProductProductIdOrderByCreateAtDesc(productId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        return reviews.stream().map(r -> {
            String userName = r.getUser() != null ? (r.getUser().getFullName() != null ? r.getUser().getFullName() : r.getUser().getEmail()) : "Khách hàng";
            String avatar = r.getUser() != null && r.getUser().getAvatar() != null ? r.getUser().getAvatar() : "👤";
            String dateStr = r.getCreateAt() != null ? r.getCreateAt().format(formatter) : "Vừa xong";
            
            // Format comment to include star count tag if saved inside
            int stars = 5;
            String commentText = r.getComment() != null ? r.getComment() : "";
            if (commentText.startsWith("[STARS:") && commentText.contains("]")) {
                try {
                    int idx = commentText.indexOf("]");
                    stars = Integer.parseInt(commentText.substring(7, idx));
                    commentText = commentText.substring(idx + 1).trim();
                } catch (Exception e) { }
            }

            return ReviewResponse.builder()
                    .reviewId(r.getReviewId())
                    .name(userName)
                    .avatar(avatar)
                    .stars(stars)
                    .comment(commentText)
                    .date(dateStr)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ApiResponse<ReviewResponse> addProductReview(Integer productId, CreateReviewRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId));

        User user = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                user = userRepository.findByEmail(auth.getName()).orElse(null);
            }
        } catch (Exception e) { }

        if (user == null) {
            List<User> users = userRepository.findAll();
            if (!users.isEmpty()) {
                user = users.get(0);
            } else {
                user = userRepository.save(User.builder().email("customer@fruitfresh.vn").fullName("Khách hàng").build());
            }
        }

        Order order = null;
        List<Order> orders = orderRepository.findAll();
        if (!orders.isEmpty()) {
            order = orders.get(0);
        } else {
            Shop shop = Shop.builder().shopName("FruitFresh Store").owner(user).build();
            order = orderRepository.save(Order.builder().user(user).shop(shop).total(java.math.BigDecimal.valueOf(100000)).status(1).build());
        }

        int stars = request.getStars() != null ? request.getStars() : 5;
        String fullComment = "[STARS:" + stars + "] " + (request.getComment() != null ? request.getComment() : "");

        Review review = Review.builder()
                .product(product)
                .user(user)
                .order(order)
                .comment(fullComment)
                .createAt(LocalDateTime.now())
                .build();

        review = reviewRepository.save(review);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        ReviewResponse response = ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .name(user.getFullName() != null ? user.getFullName() : user.getEmail())
                .avatar(user.getAvatar() != null ? user.getAvatar() : "👤")
                .stars(stars)
                .comment(request.getComment())
                .date(review.getCreateAt().format(formatter))
                .build();

        return ApiResponse.ok(response);
    }
}
