package com.smartcampus.controller;

import com.smartcampus.entity.User;
import com.smartcampus.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final com.smartcampus.util.JwtUtil jwtUtil;

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/dev-login")
    public ResponseEntity<Map<String, String>> devLogin(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String role = body.getOrDefault("role", "USER");
        
        // Ensure user exists or create mock
        User user;
        try {
            user = userService.getUserByEmail(email);
        } catch (Exception e) {
            user = userService.createDevUser(email, "Dev User", role);
        }
        
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PatchMapping("/me/preferences")
    public ResponseEntity<User> updatePreferences(@RequestBody Map<String, Boolean> payload) {
        boolean nb = payload.getOrDefault("notifyOnBooking", true);
        boolean nt = payload.getOrDefault("notifyOnTicket", true);
        boolean nc = payload.getOrDefault("notifyOnComment", true);
        return ResponseEntity.ok(userService.updatePreferences(nb, nt, nc));
    }
}
