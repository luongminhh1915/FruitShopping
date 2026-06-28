package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.request.CreateOrderRequest;
import fruitshopping.fruitshopping.dto.response.ApiResponse;

public interface OrderService {
    ApiResponse<String> createOrder(CreateOrderRequest request);
}
