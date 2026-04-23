package com.smartcampus.controller;

import com.smartcampus.entity.Booking;
import com.smartcampus.entity.Booking.BookingStatus;
import com.smartcampus.entity.User;
import com.smartcampus.service.BookingService;
import com.smartcampus.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Booking>> getBookings() {
        User currentUser = userService.getCurrentUser();
        if (currentUser.getRole() == User.Role.ADMIN) {
            return ResponseEntity.ok(bookingService.getAllBookings());
        }
        return ResponseEntity.ok(bookingService.getBookingsForUser(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBooking(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        Booking booking = bookingService.getById(id);
        // Access control: owner or admin
        if (!booking.getUser().getId().equals(currentUser.getId()) &&
                currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(booking);
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Map<String, Object> body) {
        User currentUser = userService.getCurrentUser();
        Long resourceId = Long.parseLong(body.get("resourceId").toString());
        LocalDate date = LocalDate.parse(body.get("date").toString());
        LocalTime startTime = LocalTime.parse(body.get("startTime").toString());
        LocalTime endTime = LocalTime.parse(body.get("endTime").toString());
        String purpose = body.get("purpose").toString();
        String attendeesStr = body.containsKey("expectedAttendees") && body.get("expectedAttendees") != null 
                ? body.get("expectedAttendees").toString() : "";
        Integer attendees = !attendeesStr.trim().isEmpty() ? Integer.parseInt(attendeesStr) : null;

        Booking booking = bookingService.createBooking(resourceId, date, startTime, endTime, purpose, attendees,
                currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Booking> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User currentUser = userService.getCurrentUser();
        BookingStatus newStatus = BookingStatus.valueOf(body.get("status").toUpperCase());
        String adminNote = body.get("adminNote");
        return ResponseEntity.ok(bookingService.updateStatus(id, newStatus, adminNote, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(bookingService.updateStatus(id, BookingStatus.CANCELLED, null, currentUser));
    }
    @PatchMapping("/{id}/check-in")
    public ResponseEntity<Booking> checkIn(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        if (currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(bookingService.checkIn(id));
    }

}
