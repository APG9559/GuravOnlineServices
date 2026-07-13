import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marriagesApi } from '@/api';
import { MarriageTicket } from '@/types';
import NeoSelect from '@/components/NeoSelect';
import ConfirmTicketModal from './ConfirmTicketModal';
import useDebounce from '@/hooks/useDebounce';

interface TicketsTabProps {
  onView: (ticket: MarriageTicket) => void;
  onProceed: (ticket: MarriageTicket) => void;
  onProceedComplete: (ticket: MarriageTicket) => void;
  onEdit: (ticket: MarriageTicket) => void;
  onShowAlert?: (title: string, message: React.ReactNode) => void;
  onShowConfirm?: (title: string, message: React.ReactNode, onConfirm: () => void) => void;
}

export default function TicketsTab({
  onView,
  onProceed,
  onProceedComplete,
  onEdit,
  onShowAlert,
  onShowConfirm,
}: TicketsTabProps) {
  const qc = useQueryClient();
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);
  const [confirmingTicket, setConfirmingTicket] = useState<MarriageTicket | null>(null);

  const { data: tickets = [] } = useQuery({
    queryKey: ['marriage-tickets', ticketStatusFilter, debouncedSearch],
    queryFn: () =>
      marriagesApi
        .getAllTickets({
          ...(ticketStatusFilter ? { status: ticketStatusFilter } : {}),
          ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        })
        .then((r) => r.data),
    staleTime: 15_000,
  });

  const confirmTicketMut = useMutation({
    mutationFn: ({ id, payment }: { id: string; payment?: unknown }) =>
      marriagesApi.confirmTicket(id, { payment }).then((r) => r.data),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      setConfirmingTicket(null);
      onProceed(ticket);
    },
  });

  const failTicketMut = useMutation({
    mutationFn: (id: string) => marriagesApi.failTicket(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
    },
    onError: () => {
      alert('Failed to mark ticket as failed.');
    },
  });

  const handleFailClick = (ticket: MarriageTicket) => {
    if (onShowConfirm) {
      onShowConfirm(
        'Confirm Action',
        `Are you sure you want to mark ticket ${ticket.ticketNumber} as Failed?`,
        () => failTicketMut.mutate(ticket.id),
      );
    } else {
      if (
        window.confirm(`Are you sure you want to mark ticket ${ticket.ticketNumber} as Failed?`)
      ) {
        failTicketMut.mutate(ticket.id);
      }
    }
  };

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16 }}>Estimation Tickets</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by ticket #, contact name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '2px solid var(--border)',
              borderRadius: '4px',
              width: '240px',
              height: '42px',
              fontSize: '13px',
            }}
          />
          <NeoSelect
            value={ticketStatusFilter}
            onChange={(val) => setTicketStatusFilter(val)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'Inquired', label: 'Inquired' },
              { value: 'Confirmed', label: 'Confirmed' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Failed', label: 'Failed' },
            ]}
            style={{ width: '160px' }}
          />
        </div>
      </div>

      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No tickets found.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Ticket Status</th>
                <th>Payment Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {ticket.ticketNumber}
                  </td>
                  <td>{ticket.contactName}</td>
                  <td>{ticket.phone}</td>
                  <td>₹{Number(ticket.amountCharged).toLocaleString('en-IN')}</td>
                  <td>
                    <span
                      className={`badge ${
                        ticket.status === 'Completed'
                          ? 'badge-green'
                          : ticket.status === 'Confirmed'
                            ? 'badge-amber'
                            : ticket.status === 'Failed'
                              ? 'badge-red'
                              : 'badge-blue'
                      }`}
                    >
                      {ticket.status}
                    </span>
                    {new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime() >
                      5000 && (
                      <span
                        className="badge"
                        style={{ background: 'var(--surface)', marginLeft: 6, fontSize: 9 }}
                        title={`Last edited: ${new Date(ticket.updatedAt).toLocaleString('en-IN')}`}
                      >
                        edited
                      </span>
                    )}
                  </td>
                  <td>
                    {ticket.status !== 'Inquired' ? (
                      (() => {
                        const payBadge = getPaymentStatus(ticket);
                        return (
                          <span className={`badge ${payBadge.class}`} style={payBadge.style}>
                            {payBadge.label}
                          </span>
                        );
                      })()
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => onView(ticket)}>
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
                      {ticket.status === 'Confirmed' &&
                        (() => {
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
                                        Cannot complete ticket. There is a remaining balance of{' '}
                                        <strong style={{ fontWeight: 700 }}>
                                          ₹{(amountCharged - totalPaid).toLocaleString('en-IN')}
                                        </strong>
                                        .
                                        <br />
                                        <br />
                                        Please record the remaining payment first via the View
                                        modal.
                                      </span>,
                                    );
                                  } else {
                                    alert(
                                      `Cannot complete ticket. There is a remaining balance of ₹${(amountCharged - totalPaid).toLocaleString('en-IN')}.\n\nPlease record the remaining payment first via the View modal.`,
                                    );
                                  }
                                  return;
                                }
                                handleProceedClick(ticket);
                              }}
                              style={
                                !isFullyPaid ? { opacity: 0.6, cursor: 'not-allowed' } : undefined
                              }
                            >
                              Complete
                            </button>
                          );
                        })()}
                      {(ticket.status === 'Inquired' || ticket.status === 'Confirmed') && (
                        <>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => onEdit(ticket)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleFailClick(ticket)}
                            disabled={failTicketMut.isPending}
                          >
                            Fail
                          </button>
                        </>
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
