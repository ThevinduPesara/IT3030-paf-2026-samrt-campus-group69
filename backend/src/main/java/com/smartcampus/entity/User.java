package com.smartcampus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    private String picture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String provider; // "google"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private boolean notifyOnBooking = true;

    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private boolean notifyOnTicket = true;

    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private boolean notifyOnComment = true;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (role == null)
            role = Role.USER;
    }

    public enum Role {
        USER, ADMIN, TECHNICIAN
    }
}
