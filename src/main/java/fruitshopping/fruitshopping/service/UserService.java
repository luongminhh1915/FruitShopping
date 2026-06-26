package fruitshopping.fruitshopping.service;

import fruitshopping.fruitshopping.dto.request.UpdateProfileRequest;
import fruitshopping.fruitshopping.dto.response.UserProfileResponse;

public interface UserService {
    UserProfileResponse getUserProfile(String email);
    UserProfileResponse updateUserProfile(String email, UpdateProfileRequest request);
}
