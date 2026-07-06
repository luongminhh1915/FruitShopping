package fruitshopping.fruitshopping.repository;

import fruitshopping.fruitshopping.entity.Order;
import fruitshopping.fruitshopping.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    List<OrderItem> findAllByOrder(Order order);
}
