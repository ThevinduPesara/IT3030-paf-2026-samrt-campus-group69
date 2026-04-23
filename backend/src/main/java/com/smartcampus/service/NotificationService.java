package com.smartcampus.service;

import com.smartcampus.entity.Notification;
import com.smartcampus.entity.User;
import com.smartcampus.event.BookingStatusChangedEvent;
import com.smartcampus.event.CommentAddedEvent;
import com.smartcampus.event.TicketStatusChangedEvent;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Async
    @EventListener
    @Transactional
    public void onBookingStatusChanged(BookingStatusChangedEvent event) {
        var booking = event.getBooking();
        User recipient = booking.getUser();
        if (!recipient.isNotifyOnBooking()) return; 

        String status = booking.getStatus().name();
        createNotification(recipient,
                "BOOKING_STATUS",
                "Booking " + status,
                "Your booking for \"" + booking.getResource().getName() + "\" on " +
                        booking.getDate() + " has been " + status.toLowerCase() + ".",
                booking.getId(), "BOOKING");
    }

    @Async
    @EventListener
    @Transactional
    public void onTicketStatusChanged(TicketStatusChangedEvent event) {
        var ticket = event.getTicket();
        User recipient = ticket.getReportedBy();
        if (!recipient.isNotifyOnTicket()) return; 

        
        String status = ticket.getStatus().name();
        createNotification(recipient,
                "TICKET_STATUS",
                "Ticket Status Updated",
                "Your ticket #" + ticket.getId() + " status changed to " + status + ".",
                ticket.getId(), "TICKET");
    }

    @Async
    @EventListener
    @Transactional
    public void onCommentAdded(CommentAddedEvent event) {
        var ticket = event.getTicket();
        User reporter = ticket.getReportedBy();
        User commenter = event.getCommenter();
        
        if (!reporter.isNotifyOnComment()) return; 

        
        if (!reporter.getId().equals(commenter.getId())) {
            createNotification(reporter,
                    "COMMENT_ADDED",
                    "New Comment on Your Ticket",
                    commenter.getName() + " commented on ticket #" + ticket.getId() + ".",
                    ticket.getId(), "TICKET");
        }
    }

    private void createNotification(User recipient, String type, String title,
            String message, Long relatedEntityId, String relatedEntityType) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .relatedEntityId(relatedEntityId)
                .relatedEntityType(relatedEntityType)
                .read(false)
                .build();
        notificationRepository.save(notification);
    }
}
