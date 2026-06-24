import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marriagesApi } from '@/api';
import { MarriageTicket } from '@/types';
import NeoSelect from '@/components/NeoSelect';
import ConfirmTicketModal from './ConfirmTicketModal';

interface TicketsTabProps {
  onView: (ticket: MarriageTicket) => void;
  onProceed: (ticket: MarriageTicket) => void;
  onProceedComplete: (ticket: MarriageTicket) => void;
  onEdit: (ticket: MarriageTicket) => void;
  onShowAlert?: (title: string, message: React.ReactNode) => void;
}

export default function TicketsTab({
  onView,
  onProceed,
  onProceedComplete,
  onEdit,
  onShowAlert,
}: TicketsTabProps) {
  const qc = useQueryClient();
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');
  const [confirmingTicket, setConfirmingTicket] = useState<MarriageTicket | null>(null);

  const { data: tickets = [] } = useQuery({
    queryKey: ['marriage-tickets', ticketStatusFilter],
    queryFn: () => marriagesApi.getAllTickets(ticketStatusFilter ? { status: ticketStatusFilter } : {}).then((r) => r.data),
    staleTime: 15_000,
  });

  const confirmTicketMut = useMutation({
    mutationFn: ({ id, payment }: { id: string; payment?: any }) => marriagesApi.confirmTicket(id, { payment }).then((r) => r.data),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      setConfirmingTicket(null);
      onProceed(ticket);
    },
  });

  const handleProceedClick = (ticket: MarriageTicket) => {
    if (ticket.status === 'Inquired') {
      setConfirmingTicket(ticket);
    } else if (ticket.status === 'Confirmed') {
      onProceedComplete(ticket);
    }
  };

  const getPaymentStatus = (t: MarriageTicket) => {
    const payments = t.payments || [];
    if (payments.length === 0) {
      return { label: 'Unpaid', class: 'badge-red', style: {} };
    }
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const amountCharged = Number(t.amountCharged);
    if (totalPaid >= amountCharged) {
      return { label: 'Fully Paid', class: 'badge-green', style: {} };
    }
    return { label: 'Partial', class: 'badge-amber', style: {} };
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span className={`badge ${ticket.status === 'Completed'
                        ? 'badge-green'
                        : ticket.status === 'Confirmed'
                          ? 'badge-amber'
                          : 'badge-blue'
                        }`}>
                        {ticket.status}
                      </span>
                      {ticket.status !== 'Inquired' && (() => {
                        const payBadge = getPaymentStatus(ticket);
                        return (
                          <span className={`badge ${payBadge.class}`} style={payBadge.style}>
                            {payBadge.label}
                          </span>
                        );
                      })()}
                    </div>
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
                      {ticket.status === 'Confirmed' && (() => {
                        const payments = ticket.payments || [];
                        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
                        const amountCharged = Number(ticket.amountCharged);
                        const isFullyPaid = totalPaid >= amountCharged;
                        return (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              if (!isFullyPaid) {
                                if (onShowAlert) {
                                  onShowAlert(
                                    'Payment Balance Remaining',
                                    <span>
                                      Cannot complete ticket. There is a remaining balance of <strong style={{ fontWeight: 700 }}>₹{(amountCharged - totalPaid).toLocaleString('en-IN')}</strong>.
                                      <br /><br />
                                      Please record the remaining payment first via the View modal.
                                    </span>
                                  );
                                } else {
                                  alert(`Cannot complete ticket. There is a remaining balance of ₹${(amountCharged - totalPaid).toLocaleString('en-IN')}.\n\nPlease record the remaining payment first via the View modal.`);
                                }
                                return;
                              }
                              handleProceedClick(ticket);
                            }}
                            style={!isFullyPaid ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                          >
                            Complete
                          </button>
                        );
                      })()}
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

      {confirmingTicket && (
        <ConfirmTicketModal
          ticket={confirmingTicket}
          onClose={() => setConfirmingTicket(null)}
          onConfirm={(payment) => {
            confirmTicketMut.mutate({ id: confirmingTicket.id, payment });
          }}
          isLoading={confirmTicketMut.isPending}
        />
      )}
    </div>
  );
}
