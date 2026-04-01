package com.barnattwu.rosetta.auth.services;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.barnattwu.rosetta.auth.dto.AuthResponse;
import com.barnattwu.rosetta.auth.dto.LoginRequest;
import com.barnattwu.rosetta.auth.dto.RegisterRequest;
import com.barnattwu.rosetta.auth.util.JwtUtil;
import com.barnattwu.rosetta.auth.util.RefreshTokenUtil;
import com.barnattwu.rosetta.user.User;
import com.barnattwu.rosetta.user.UserRepository;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final RefreshTokenUtil refreshTokenUtil;

  public AuthService(
    UserRepository userRepository,
    PasswordEncoder passwordEncoder,
    JwtUtil jwtUtil,
    RefreshTokenUtil refreshTokenUtil
  ) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
    this.refreshTokenUtil = refreshTokenUtil;
  }

  public AuthResponse register(RegisterRequest request) {
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
      throw new RuntimeException("Email already in use");
    }

    User newUser = new User();
    newUser.setEmail(request.getEmail());
    newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    userRepository.save(newUser);

    String accessToken = jwtUtil.generateToken(newUser.getId(), newUser.getEmail());
    String refreshToken = refreshTokenUtil.generateRefreshToken();
    refreshTokenUtil.storeRefreshToken(refreshToken, newUser.getId());

    return new AuthResponse(accessToken, refreshToken);
  }

  public AuthResponse login(LoginRequest request) {
    User user = userRepository
      .findByEmail(request.getEmail())
      .orElseThrow(() -> new RuntimeException("Invalid credentials"));

    if (
      !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())
    ) {
      throw new RuntimeException("Invalid credentials");
    }

    String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail());
    String refreshToken = refreshTokenUtil.generateRefreshToken();
    refreshTokenUtil.storeRefreshToken(refreshToken, user.getId());

    return new AuthResponse(accessToken, refreshToken);
  }

  public AuthResponse refresh(String refreshToken, UUID userId) {
    if (!refreshTokenUtil.validateRefreshToken(refreshToken, userId)) {
        throw new RuntimeException("Invalid refresh token");
    }

    User user = userRepository
        .findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found"));

    String newAccessToken = jwtUtil.generateToken(user.getId(), user.getEmail());
    String newRefreshToken = refreshTokenUtil.generateRefreshToken();
    refreshTokenUtil.storeRefreshToken(newRefreshToken, user.getId());

    return new AuthResponse(newAccessToken, newRefreshToken);
  }

  public void logout(UUID userId) {
    refreshTokenUtil.revokeRefreshToken(userId);
  }
}
