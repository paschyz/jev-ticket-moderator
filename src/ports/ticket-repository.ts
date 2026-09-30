import { Ticket } from '../domain/ticket.js';

export interface TicketRepository {
  save(ticket: Ticket): Promise<void>;
  findById(id: string): Promise<Ticket | null>;
  findAll(): Promise<Ticket[]>;
  deleteById(id: string): Promise<void>;
}
