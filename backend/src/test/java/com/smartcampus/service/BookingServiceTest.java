package com.smartcampus.service;

import com.smartcampus.entity.Booking;
import com.smartcampus.entity.Booking.BookingStatus;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.Resource.ResourceStatus;
import com.smartcampus.entity.User;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private ResourceService resourceService;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BookingService bookingService;

    private Resource resource;
    private User user;

    @BeforeEach
    void setUp() {
        resource = Resource.builder()
                .id(1L).name("Room A").status(ResourceStatus.ACTIVE).build();
        user = User.builder()
                .id(1L).email("test@test.com").role(User.Role.USER).build();
    }

    @Test
    void createBooking_success() {
        when(resourceService.getById(1L)).thenReturn(resource);
        when(bookingRepository.findConflictingBookings(any(), any(), any(), any()))
                .thenReturn(List.of());
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Booking booking = bookingService.createBooking(1L,
                LocalDate.now().plusDays(1),
                LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Meeting", 5, user);

        assertNotNull(booking);
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        verify(bookingRepository).save(any());
    }

    @Test
    void createBooking_conflictThrowsException() {
        Booking existing = Booking.builder().id(99L).status(BookingStatus.APPROVED).build();
        when(resourceService.getById(1L)).thenReturn(resource);
        when(bookingRepository.findConflictingBookings(any(), any(), any(), any()))
                .thenReturn(List.of(existing));

        assertThrows(ConflictException.class, () -> bookingService.createBooking(1L,
                LocalDate.now().plusDays(1),
                LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Meeting", 5, user));
    }

    @Test
    void createBooking_pastDateThrowsException() {
        assertThrows(BadRequestException.class, () -> bookingService.createBooking(1L,
                LocalDate.now().minusDays(1),
                LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Meeting", 5, user));
    }

    @Test
    void createBooking_invalidTimeRange() {
        assertThrows(BadRequestException.class, () -> bookingService.createBooking(1L,
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0), LocalTime.of(9, 0),
                "Meeting", 5, user));
    }

    @Test
    void createBooking_resourceOutOfService() {
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);
        when(resourceService.getById(1L)).thenReturn(resource);

        assertThrows(BadRequestException.class, () -> bookingService.createBooking(1L,
                LocalDate.now().plusDays(1),
                LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Meeting", 5, user));
    }
}
