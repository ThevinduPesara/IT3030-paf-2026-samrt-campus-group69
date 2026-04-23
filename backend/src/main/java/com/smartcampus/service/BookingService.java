package com.smartcampus.service;

import com.smartcampus.entity.Booking;
import com.smartcampus.entity.Booking.BookingStatus;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.User;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.event.BookingStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceService resourceService;
    private final ApplicationEventPublisher eventPublisher;

    public List<Booking> getBookingsForUser(User user) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    public Booking getById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    @Transactional
    public Booking createBooking(Long resourceId, LocalDate date, LocalTime startTime,
            LocalTime endTime, String purpose, Integer expectedAttendees,
            User user) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Start time must be before end time");
        }
        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Booking date cannot be in the past");
        }

        Resource resource = resourceService.getById(resourceId);
        if (resource.getStatus() == Resource.ResourceStatus.OUT_OF_SERVICE) {
            throw new BadRequestException("Resource is currently out of service");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                resourceId, date, startTime, endTime);
        if (!conflicts.isEmpty()) {
            throw new ConflictException("Time slot is already booked for this resource");
        }

        Booking booking = Booking.builder()
                .resource(resource)
                .user(user)
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .purpose(purpose)
                .expectedAttendees(expectedAttendees)
                .status(BookingStatus.PENDING)
                .build();

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking updateStatus(Long id, BookingStatus newStatus, String adminNote, User actor) {
        Booking booking = getById(id);

        // Determine if actor is ADMIN
        boolean isAdmin = actor.getRole() == User.Role.ADMIN;
        boolean isOwner = booking.getUser().getId().equals(actor.getId());

        if (newStatus == BookingStatus.CANCELLED) {
            if (!isOwner && !isAdmin) {
                throw new ForbiddenException("Only the booking owner or admin can cancel");
            }
            if (booking.getStatus() != BookingStatus.APPROVED && booking.getStatus() != BookingStatus.PENDING) {
                throw new BadRequestException("Only PENDING or APPROVED bookings can be cancelled");
            }
        } else if (newStatus == BookingStatus.APPROVED || newStatus == BookingStatus.REJECTED) {
            if (!isAdmin)
                throw new ForbiddenException("Only admins can approve or reject bookings");
        }

        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(newStatus);
        if (adminNote != null)
            booking.setAdminNote(adminNote);
        Booking saved = bookingRepository.save(booking);

        eventPublisher.publishEvent(new BookingStatusChangedEvent(this, saved, oldStatus));
        return saved;
    }

    public long countByStatus(BookingStatus status) {
        return bookingRepository.countByStatus(status);
    }

    public List<java.util.Map<String, Object>> getTopResources(int limit) {
        return bookingRepository.findTopResources(org.springframework.data.domain.PageRequest.of(0, limit));
    }

    public List<java.util.Map<String, Object>> getPeakBookingHours() {
        List<Booking> activeBookings = bookingRepository.findAllActiveBookings();
        java.util.Map<Integer, Long> hourCounts = new java.util.HashMap<>();
        // Initialize typical campus working hours (8 AM to 8 PM)
        for (int i = 8; i <= 20; i++) {
            hourCounts.put(i, 0L);
        }
        
        for (Booking b : activeBookings) {
            int hour = b.getStartTime().getHour();
            hourCounts.put(hour, hourCounts.getOrDefault(hour, 0L) + 1);
        }
        
        return hourCounts.entrySet().stream()
                .sorted(java.util.Map.Entry.comparingByKey())
                .map(e -> java.util.Map.<String, Object>of(
                        "hour", String.format("%02d:00", e.getKey()), 
                        "count", e.getValue()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public Booking checkIn(Long id) {
        Booking booking = getById(id);
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException("Only approved bookings can be checked in");
        }
        if (booking.isCheckedIn()) {
            throw new BadRequestException("Booking is already checked in");
        }
        // Simplified check-in validation: just ensure the date matches today
        if (!booking.getDate().equals(java.time.LocalDate.now())) {
            throw new BadRequestException("Check-in is only available on the day of the booking");
        }

        booking.setCheckedIn(true);
        booking.setCheckedInAt(java.time.LocalDateTime.now());
        return bookingRepository.save(booking);
    }
}
