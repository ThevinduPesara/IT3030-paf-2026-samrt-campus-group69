package com.smartcampus.repository;

import com.smartcampus.entity.Booking;
import com.smartcampus.entity.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
            "AND b.date = :date " +
            "AND b.status = 'APPROVED' " +
            "AND b.startTime < :endTime " +
            "AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    long countByStatus(BookingStatus status);

    @Query("SELECT new map(b.resource.name as name, COUNT(b) as count) " +
            "FROM Booking b WHERE b.status IN ('APPROVED', 'PENDING') " +
            "GROUP BY b.resource.name ORDER BY COUNT(b) DESC")
    List<java.util.Map<String, Object>> findTopResources(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.status IN ('APPROVED', 'PENDING')")
    List<Booking> findAllActiveBookings();
}

