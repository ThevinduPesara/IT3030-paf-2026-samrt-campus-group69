package com.smartcampus.service;

import com.smartcampus.entity.*;
import com.smartcampus.entity.Ticket.TicketStatus;
import com.smartcampus.entity.User.Role;
import com.smartcampus.event.CommentAddedEvent;
import com.smartcampus.event.TicketStatusChangedEvent;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.TicketCommentRepository;
import com.smartcampus.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final ResourceService resourceService;
    private final FileStorageService fileStorageService;
    private final ApplicationEventPublisher eventPublisher;

    public List<Ticket> getTicketsForUser(User user) {
        if (user.getRole() == Role.ADMIN)
            return ticketRepository.findAllByOrderByCreatedAtDesc();
        if (user.getRole() == Role.TECHNICIAN)
            return ticketRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId());
        return ticketRepository.findByReportedByIdOrderByCreatedAtDesc(user.getId());
    }

    public Ticket getById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
    }

    @Transactional
    public Ticket createTicket(Long resourceId, String category, String description,
            Ticket.Priority priority, String contactDetails,
            List<MultipartFile> files, User user) {
        if (files != null && files.size() > 3) {
            throw new BadRequestException("Maximum 3 image attachments allowed");
        }

        Ticket ticket = Ticket.builder()
                .reportedBy(user)
                .category(category)
                .description(description)
                .priority(priority)
                .contactDetails(contactDetails)
                .status(TicketStatus.OPEN)
                .build();

        if (resourceId != null) {
            ticket.setResource(resourceService.getById(resourceId));
        }

        Ticket saved = ticketRepository.save(ticket);

        if (files != null) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String filePath = fileStorageService.store(file);
                    TicketAttachment attachment = TicketAttachment.builder()
                            .ticket(saved)
                            .fileName(file.getOriginalFilename())
                            .filePath(filePath)
                            .contentType(file.getContentType())
                            .build();
                    saved.getAttachments().add(attachment);
                }
            }
            ticketRepository.save(saved);
        }

        return saved;
    }

    @Transactional
    public Ticket updateStatus(Long id, TicketStatus newStatus, String note, User actor) {
        Ticket ticket = getById(id);
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.TECHNICIAN) {
            throw new ForbiddenException("Only ADMIN or TECHNICIAN can update ticket status");
        }
        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(newStatus);
        if (newStatus == TicketStatus.RESOLVED && note != null)
            ticket.setResolutionNote(note);
        if (newStatus == TicketStatus.REJECTED && note != null)
            ticket.setRejectionReason(note);
        Ticket saved = ticketRepository.save(ticket);
        eventPublisher.publishEvent(new TicketStatusChangedEvent(this, saved, oldStatus));
        return saved;
    }

    @Transactional
    public Ticket assignTechnician(Long ticketId, Long technicianId, User admin) {
        if (admin.getRole() != Role.ADMIN)
            throw new ForbiddenException("Only ADMIN can assign technicians");
        Ticket ticket = getById(ticketId);
        // We'll accept any user as technician target; service validates via UserService
        ticket.setAssignedTo(User.builder().id(technicianId).build());
        return ticketRepository.save(ticket);
    }

    @Transactional
    public TicketComment addComment(Long ticketId, String content, User author) {
        Ticket ticket = getById(ticketId);
        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(author)
                .content(content)
                .build();
        TicketComment saved = commentRepository.save(comment);
        eventPublisher.publishEvent(new CommentAddedEvent(this, ticket, author));
        return saved;
    }

    @Transactional
    public TicketComment updateComment(Long commentId, String content, User actor) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthor().getId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You can only edit your own comments");
        }
        comment.setContent(content);
        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, User actor) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthor().getId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
    }

    public long countByStatus(TicketStatus status) {
        return ticketRepository.countByStatus(status);
    }
}
