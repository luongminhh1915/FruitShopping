package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.request.UpdateProfileRequest;
import fruitshopping.fruitshopping.dto.response.UserAdminResponse;
import fruitshopping.fruitshopping.dto.response.UserProfileResponse;

import java.util.List;

public interface UserService {
    UserProfileResponse getUserProfile(String email);

    UserProfileResponse updateUserProfile(String email, UpdateProfileRequest request);

    List<UserAdminResponse> getAllUsers();

    UserAdminResponse toggleUserStatus(Integer userId);

    UserAdminResponse updateUserRole(Integer userId, Integer roleId);
}

