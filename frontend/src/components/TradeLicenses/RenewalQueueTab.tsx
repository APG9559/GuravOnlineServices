import { useQuery } from '@tanstack/react-query';
import { tradeLicensesApi, messageLogsApi } from '@/api';
import { Business, TradeLicenseRecord } from '@/types';
import { generateMessageUrl, replacePlaceholders } from '@/utils/messageTemplates';

interface RenewalQueueTabProps {
  startServiceForBusiness: (biz: Business, service: TradeLicenseRecord['serviceType']) => void;
}

export default function RenewalQueueTab({ startServiceForBusiness }: RenewalQueueTabProps) {
  const { data: renewalQueue = [], isLoading: renewalLoading } = useQuery({
    queryKey: ['trade-renewal-queue'],
    queryFn: () => tradeLicensesApi.getRenewalQueue().then((r) => r.data),
  });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, color: 'var(--text-muted)' }}>
        Businesses due for license renewal (Active only from March to April)
      </div>
      {renewalLoading ? (
        <div style={{ padding: 20 }}>Loading...</div>
      ) : renewalQueue.length === 0 ? (
        <div style={{ padding: 20, color: 'var(--text-muted)' }}>
          No businesses due for renewal at this time (the queue is active only during March and April).
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>License Number</th>
              <th>Trade category</th>
              <th>Last Renewed Year</th>
              <th>Owners / Partners</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {renewalQueue.map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 500 }}>{b.name}</td>
                <td>
                  <span className="badge badge-green">{b.licenseNo}</span>
                </td>
                <td>
                  {(b.trades && b.trades.length > 0)
                    ? b.trades.map((t: any, i: number) => (
                      <span key={t.id || i} className="badge badge-blue" style={{ fontSize: 11, marginRight: 4, marginBottom: 2 }}>
                        {t.tradeType} / {t.tradeSubtype}
                      </span>
                    ))
                    : b.tradeType
                      ? <span>{b.tradeType} ({b.tradeSubtype})</span>
                      : '—'
                  }
                </td>
                <td>{b.lastRenewalYear || 'Never'}</td>
                <td>{b.customers?.map((c: any) => c.name).join(', ') || '—'}</td>
                <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {(() => {
                    const primaryCustomer = b.customers?.[0];
                    if (!primaryCustomer || !primaryCustomer.phone) return null;

                    // Fetch customized template if available
                    let templateBody = `Dear {CustomerName},\n\nThis is a reminder that your Trade License (No: {TradeLicenseNo}) is due for renewal.\n\nPlease visit our office or contact us to initiate the renewal process.\n\nThank you.\nGURAV ONLINE SERVICES`;
                    const stored = localStorage.getItem('quick_message_templates');
                    if (stored) {
                      try {
                        const parsed = JSON.parse(stored);
                        const found = parsed.find((t: any) => t.id === 'tl_renewal_reminder');
                        if (found) {
                          templateBody = found.body;
                        }
                      } catch (e) {}
                    }

                    const msg = replacePlaceholders(templateBody, {
                      CustomerName: primaryCustomer.name,
                      TradeLicenseNo: b.licenseNo || '',
                    });

                    const handleSend = (channel: 'whatsapp' | 'sms') => {
                      messageLogsApi.create({
                        module: 'tradeLicenses',
                        templateId: 'tl_renewal_reminder',
                        templateLabel: 'Renewal Reminder',
                        channel,
                        recipientName: primaryCustomer.name || undefined,
                        recipientPhone: primaryCustomer.phone.replace(/^\+91/, '').replace(/\D/g, ''),
                        messageBody: msg,
                        recordId: b.id,
                      }).catch(() => {});
                      const url = generateMessageUrl(channel, '+91', primaryCustomer.phone, msg);
                      window.open(url, '_blank');
                    };

                    return (
                      <>
                        <button
                          onClick={() => handleSend('whatsapp')}
                          className="btn btn-sm"
                          style={{
                            borderColor: '#25D366',
                            color: '#25D366',
                            background: 'transparent',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 700,
                            padding: '4px 8px',
                          }}
                        >
                          💬 WA
                        </button>
                        <button
                          onClick={() => handleSend('sms')}
                          className="btn btn-sm"
                          style={{
                            borderColor: 'var(--primary)',
                            color: 'var(--primary)',
                            background: 'transparent',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 700,
                            padding: '4px 8px',
                          }}
                        >
                          ✉️ SMS
                        </button>
                      </>
                    );
                  })()}
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => startServiceForBusiness(b, 'Renew')}
                  >
                    Process Renew
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
