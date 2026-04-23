package com.smartcampus.repository;

import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.Ticket.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByReportedByIdOrderByCreatedAtDesc(Long userId);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    List<Ticket> findByAssignedToIdOrderByCreatedAtDesc(Long technicianId);

    long countByStatus(TicketStatus status);
}






