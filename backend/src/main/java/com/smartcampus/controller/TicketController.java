package com.smartcampus.controller;

import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.Ticket.Priority;
import com.smartcampus.entity.Ticket.TicketStatus;
import com.smartcampus.entity.TicketComment;
import com.smartcampus.entity.User;
import com.smartcampus.service.TicketService;
import com.smartcampus.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Ticket>> getTickets() {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(ticketService.getTicketsForUser(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Ticket> createTicket(
            @RequestParam(required = false) Long resourceId,
            @RequestParam String category,
            @RequestParam String description,
            @RequestParam(defaultValue = "MEDIUM") Priority priority,
            @RequestParam(required = false) String contactDetails,
            @RequestParam(required = false) List<MultipartFile> files) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketService.createTicket(resourceId, category, description,
                priority, contactDetails, files, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User currentUser = userService.getCurrentUser();
        TicketStatus status = TicketStatus.valueOf(body.get("status").toUpperCase());
        String note = body.get("note");
        return ResponseEntity.ok(ticketService.updateStatus(id, status, note, currentUser));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTechnician(@PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(ticketService.assignTechnician(id, body.get("technicianId"), currentUser));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketComment> addComment(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, body.get("content"), currentUser));
    }

    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<TicketComment> updateComment(@PathVariable Long id,
            @PathVariable Long commentId,
            @RequestBody Map<String, String> body) {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(ticketService.updateComment(commentId, body.get("content"), currentUser));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, @PathVariable Long commentId) {
        User currentUser = userService.getCurrentUser();
        ticketService.deleteComment(commentId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
