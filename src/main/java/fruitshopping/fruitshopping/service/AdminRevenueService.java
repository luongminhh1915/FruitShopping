package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.response.RevenueStatsResponse;
import fruitshopping.fruitshopping.dto.response.RevenueTransactionResponse;

import java.util.List;

public interface AdminRevenueService {
    RevenueStatsResponse getRevenueStats(String period);
    List<RevenueTransactionResponse> getRevenueTransactions();
}
