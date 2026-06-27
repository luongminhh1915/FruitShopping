package fruitshopping.fruitshopping.service.impl;

import fruitshopping.fruitshopping.dto.request.UpdateProfileRequest;
import fruitshopping.fruitshopping.dto.response.UserAdminResponse;
import fruitshopping.fruitshopping.dto.response.UserProfileResponse;
import fruitshopping.fruitshopping.entity.Role;
import fruitshopping.fruitshopping.entity.User;
import fruitshopping.fruitshopping.repository.RoleRepository;
import fruitshopping.fruitshopping.repository.UserRepository;
import fruitshopping.fruitshopping.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        return buildProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateUserProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        if (request.getFullName() == null || request.getFullName().trim().isBlank()) {
            throw new IllegalArgumentException("Họ tên không được để trống!");
        }

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);

        if (request.getAvatar() != null && !request.getAvatar().trim().isBlank()) {
            user.setAvatar(request.getAvatar().trim());
        }

        User updatedUser = userRepository.save(user);
        return buildProfileResponse(updatedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserAdminResponse> getAllUsers() {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "userId"));
        return users.stream().map(this::buildAdminResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserAdminResponse toggleUserStatus(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        boolean newStatus = user.getIsActive() == null || !user.getIsActive();
        user.setIsActive(newStatus);
        User savedUser = userRepository.save(user);
        return buildAdminResponse(savedUser);
    }

    @Override
    @Transactional
    public UserAdminResponse updateUserRole(Integer userId, Integer roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò với ID: " + roleId));

        user.setRole(role);
        User savedUser = userRepository.save(user);
        return buildAdminResponse(savedUser);
    }

    private UserProfileResponse buildProfileResponse(User user) {
        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatar(user.getAvatar())
                .roleName(user.getRole() != null ? user.getRole().getRoleName() : "CUSTOMER")
                .build();
    }

    private UserAdminResponse buildAdminResponse(User user) {
        return UserAdminResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatar(user.getAvatar())
                .roleId(user.getRole() != null ? user.getRole().getRoleId() : null)
                .roleName(user.getRole() != null ? user.getRole().getRoleName() : "CUSTOMER")
                .isActive(user.getIsActive() != null ? user.getIsActive() : true)
                .createAt(user.getCreateAt())
                .build();
    }
}

