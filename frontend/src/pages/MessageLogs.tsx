import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { messageLogsApi, MessageLog } from '@/api';
import { generateMessageUrl } from '@/utils/messageTemplates';
import Modal from '@/components/Modal';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

const MODULE_OPTIONS = [
  { value: 'all', label: 'All Modules' },
  { value: 'general', label: 'General' },
  { value: 'birthDeath', label: 'Birth/Death' },
  { value: 'marriages', label: 'Marriage Registration' },
  { value: 'tradeLicenses', label: 'Trade Licenses' },
  { value: 'waterSupplies', label: 'Water Supply' },
  { value: 'propertyTaxes', label: 'Property Tax' },
  { value: 'panCards', label: 'PAN Cards' },
  { value: 'passports', label: 'Passports' },
  { value: 'affidavits', label: 'Affidavits' },
  { value: 'propertyCards', label: 'Property Cards' },
  { value: 'shopAct', label: 'Shop Act' },
  { value: 'gazettes', label: 'Gazette' },
  { value: 'voterCards', label: 'Voter Cards' },
];

const MODULE_LABEL_MAP: Record<string, string> = {
  general: 'General',
  birthDeath: 'Birth/Death',
  marriages: 'Marriage Registration',
  tradeLicenses: 'Trade Licenses',
  waterSupplies: 'Water Supply',
  propertyTaxes: 'Property Tax',
  panCards: 'PAN Cards',
  passports: 'Passports',
  affidavits: 'Affidavits',
  propertyCards: 'Property Cards',
  shopAct: 'Shop Act',
  gazettes: 'Gazette',
  voterCards: 'Voter Cards',
};

export default function MessageLogsPage() {
  const [page, setPage] = useState(1);
  const [filterModule, setFilterModule] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchName, setSearchName] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Details Modal
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);

  const queryParams = {
    page,
    limit: 20,
    module: filterModule !== 'all' ? filterModule : undefined,
    channel: filterChannel !== 'all' ? filterChannel : undefined,
    phone: searchPhone || undefined,
    name: searchName || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['message-logs', queryParams],
    queryFn: () => messageLogsApi.getAll(queryParams).then((res) => res.data),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const limit = data?.limit || 20;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleResetFilters = () => {
    setFilterModule('all');
    setFilterChannel('all');
    setSearchPhone('');
    setSearchName('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleResend = (log: MessageLog, channel: 'whatsapp' | 'sms') => {
    const cleanPhone = log.recipientPhone.replace(/^\+91/, '').replace(/\D/g, '');
    const url = generateMessageUrl(channel, '+91', cleanPhone, log.messageBody);
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Message Dispatch Logs</div>
        <button className="btn" onClick={handleResetFilters}>
          Clear Filters
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '1.5rem' }}>
        <div className="grid-4" style={{ gap: '12px' }}>
          {/* Module Select */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Module</label>
            <NeoSelect
              value={filterModule}
              onChange={(val) => {
                setFilterModule(val);
                setPage(1);
              }}
              options={MODULE_OPTIONS}
              searchable
            />
          </div>

          {/* Channel Select */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Channel</label>
            <NeoSelect
              value={filterChannel}
              onChange={(val) => {
                setFilterChannel(val);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Channels' },
                { value: 'whatsapp', label: '💬 WhatsApp' },
                { value: 'sms', label: '✉️ SMS' },
              ]}
            />
          </div>

          {/* Search Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Recipient Name</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setPage(1);
              }}
              style={{ padding: '8px', fontSize: 13 }}
            />
          </div>

          {/* Search Phone */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Recipient Phone</label>
            <input
              type="text"
              placeholder="Search by phone..."
              value={searchPhone}
              onChange={(e) => {
                setSearchPhone(e.target.value);
                setPage(1);
              }}
              style={{ padding: '8px', fontSize: 13 }}
            />
          </div>
        </div>

        <div className="grid-2" style={{ gap: '12px', marginTop: '12px' }}>
          {/* From Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>From Date</label>
            <NeoDatePicker
              value={fromDate}
              onChange={(val) => {
                setFromDate(val);
                setPage(1);
              }}
            />
          </div>

          {/* To Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>To Date</label>
            <NeoDatePicker
              value={toDate}
              onChange={(val) => {
                setToDate(val);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading message logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            No message dispatch logs found matching criteria.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Module</th>
                    <th>Template</th>
                    <th>Channel</th>
                    <th>Recipient</th>
                    <th>Phone</th>
                    <th>Sent By</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: MessageLog) => {
                    const localDate = new Date(log.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });
                    const moduleLabel = MODULE_LABEL_MAP[log.module] || log.module;

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                        className="hover-row"
                      >
                        <td style={{ whiteSpace: 'nowrap' }}>{localDate}</td>
                        <td>
                          <span className="badge badge-blue">{moduleLabel}</span>
                        </td>
                        <td>{log.templateLabel || 'Custom/Manual'}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: log.channel === 'whatsapp' ? '#dcfce7' : '#e0e7ff',
                              color: log.channel === 'whatsapp' ? '#166534' : '#3730a3',
                              border: `1px solid ${log.channel === 'whatsapp' ? '#bbf7d0' : '#c7d2fe'}`,
                            }}
                          >
                            {log.channel === 'whatsapp' ? '💬 WA' : '✉️ SMS'}
                          </span>
                        </td>
                        <td>{log.recipientName || '—'}</td>
                        <td>{log.recipientPhone}</td>
                        <td>{log.sentBy?.name || 'System'}</td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-sm"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                              onClick={() => setSelectedLog(log)}
                            >
                              👁 View
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                background: log.channel === 'whatsapp' ? '#25D366' : 'transparent',
                                borderColor:
                                  log.channel === 'whatsapp' ? '#25D366' : 'var(--primary)',
                                color: log.channel === 'whatsapp' ? '#fff' : 'var(--primary)',
                              }}
                              onClick={() => handleResend(log, log.channel as 'whatsapp' | 'sms')}
                            >
                              ↻ Re-send
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderTop: '2px solid var(--border)',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)} of {total}{' '}
                  messages
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <Modal title="💬 Message Dispatch Detail" onClose={() => setSelectedLog(null)}>
          <div style={{ padding: '4px' }}>
            <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                  Recipient Name
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {selectedLog.recipientName || '—'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                  Recipient Phone
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedLog.recipientPhone}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                  Module
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {MODULE_LABEL_MAP[selectedLog.module] || selectedLog.module}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                  Template Used
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {selectedLog.templateLabel || 'Custom/Manual'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                  Sent At
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {new Date(selectedLog.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                  Sent By
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {selectedLog.sentBy?.name || 'System'}
                </span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Message Content</label>
              <textarea
                readOnly
                value={selectedLog.messageBody}
                rows={8}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  background: 'var(--bg)',
                  cursor: 'default',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: '#25D366',
                  borderColor: '#25D366',
                  color: '#fff',
                }}
                onClick={() => {
                  handleResend(selectedLog, 'whatsapp');
                  setSelectedLog(null);
                }}
              >
                💬 Resend via WhatsApp
              </button>
              <button
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                  background: 'transparent',
                }}
                onClick={() => {
                  handleResend(selectedLog, 'sms');
                  setSelectedLog(null);
                }}
              >
                ✉️ Resend via SMS
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
