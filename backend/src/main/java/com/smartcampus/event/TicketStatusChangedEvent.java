package com.smartcampus.event;

import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.Ticket.TicketStatus;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TicketStatusChangedEvent extends ApplicationEvent {
    private final Ticket ticket;
    private final TicketStatus oldStatus;

    public TicketStatusChangedEvent(Object source, Ticket ticket, TicketStatus oldStatus) {
        super(source);
        this.ticket = ticket;
        this.oldStatus = oldStatus;
    }
}
