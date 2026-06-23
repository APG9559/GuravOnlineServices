import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marriagesApi } from '@/api';
import { MarriageTicket } from '@/types';
import NeoSelect from '@/components/NeoSelect';

interface TicketsTabProps {
  onView: (ticket: MarriageTicket) => void;
  onProceed: (ticket: MarriageTicket) => void;
  onEdit: (ticket: MarriageTicket) => void;
}

export default function TicketsTab({
  onView,
  onProceed,
  onEdit,
}: TicketsTabProps) {
  const qc = useQueryClient();
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');

  const { data: tickets = [] } = useQuery({
    queryKey: ['marriage-tickets', ticketStatusFilter],
    queryFn: () => marriagesApi.getAllTickets(ticketStatusFilter ? { status: ticketStatusFilter } : {}).then((r) => r.data),
    staleTime: 15_000,
  });

  const confirmTicketMut = useMutation({
    mutationFn: (id: string) => marriagesApi.confirmTicket(id).then((r) => r.data),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      onProceed(ticket);
    },
  });

  const handleProceedClick = (ticket: MarriageTicket) => {
    if (ticket.status === 'Inquired') {
      confirmTicketMut.mutate(ticket.id);
    } else if (ticket.status === 'Confirmed') {
      onProceed(ticket);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 500 }}>Estimation Tickets</div>
        <NeoSelect
          value={ticketStatusFilter}
          onChange={(val) => setTicketStatusFilter(val)}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'Inquired', label: 'Inquired' },
            { value: 'Confirmed', label: 'Confirmed' },
            { value: 'Completed', label: 'Completed' }
          ]}
          style={{ width: '160px' }}
        />
      </div>

      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tickets found.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{ticket.ticketNumber}</td>
                  <td>{ticket.contactName}</td>
                  <td>{ticket.phone}</td>
                  <td>₹{Number(ticket.amountCharged).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge ${ticket.status === 'Completed'
                      ? 'badge-green'
                      : ticket.status === 'Confirmed'
                        ? 'badge-amber'
                        : 'badge-blue'
                      }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td>{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onView(ticket)}
                      >
                        View
                      </button>
                      {ticket.status === 'Inquired' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleProceedClick(ticket)}
                          disabled={confirmTicketMut.isPending}
                        >
                          Proceed
                        </button>
                      )}
                      {ticket.status === 'Confirmed' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleProceedClick(ticket)}>
                          Complete
                        </button>
                      )}
                      {(ticket.status === 'Inquired' || ticket.status === 'Confirmed') && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => onEdit(ticket)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
