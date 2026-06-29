import { DashboardSummary } from '@/types';

interface BreakdownDetailsProps {
  data: DashboardSummary;
}

export default function BreakdownDetails({ data }: BreakdownDetailsProps) {
  const breakdown = data?.breakdown || {
    byAuthorizer: {},
    byPaper: {},
    byType: {},
    byCardType: {},
    byAct: {},
  };

  const byAuthorizer = breakdown.byAuthorizer || {};
  const byPaper = breakdown.byPaper || {};
  const byType = breakdown.byType || {};
  const byCardType = breakdown.byCardType || {};
  const byAct = breakdown.byAct || {};

  return (
    <div className="card">
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: 6 }}>Service Breakdown Details</div>

      <div className="section-label" style={{ fontWeight: 700 }}>Affidavits by authorizer</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
        <span className="badge badge-blue">Magistrate: {byAuthorizer['magistrate'] || 0}</span>
        <span className="badge badge-amber">Notary: {byAuthorizer['Notary'] || 0}</span>
      </div>

      <div className="section-label" style={{ fontWeight: 700 }}>Affidavits by paper type</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
        <span className="badge badge-green">₹500 Stamp: {byPaper['stamp500'] || 0}</span>
        <span className="badge badge-blue">Plain: {byPaper['Plain'] || 0}</span>
      </div>

      <div className="section-label" style={{ fontWeight: 700 }}>Birth/Death certificates</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
        <span className="badge badge-green">Birth: {byType['Birth'] || 0}</span>
        <span className="badge badge-amber">Death: {byType['Death'] || 0}</span>
      </div>

      <div className="section-label" style={{ fontWeight: 700 }}>Property cards by type</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
        <span className="badge badge-blue">Property Card: {byCardType['Property Card'] || 0}</span>
        <span className="badge badge-blue">7/12 Card: {byCardType['7/12 Card'] || 0}</span>
        <span className="badge badge-blue">8A: {byCardType['8A'] || 0}</span>
      </div>

      <div className="section-label" style={{ fontWeight: 700 }}>Marriages by act</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {[
          ['Hindu Marriage Act', 'Hindu'],
          ['Muslim Personal Law (Shariat)', 'Muslim'],
          ['Indian Christian Marriage Act', 'Christian'],
        ].map(([key, label]) => (
          <span key={key} className="badge badge-blue">
            {label}: {byAct[key] || 0}
          </span>
        ))}
      </div>
    </div>
  );
}
