import { DashboardSummary } from '@/types';

interface BreakdownDetailsProps {
  data: DashboardSummary;
}

export default function BreakdownDetails({ data }: BreakdownDetailsProps) {
  return (
    <div className="card">
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: '1rem', borderBottom: '2px solid #000000', paddingBottom: 6 }}>Service Breakdown Details</div>

      <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Affidavits by authorizer</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
        <span className="badge badge-blue">Magistrate: {data.breakdown.byAuthorizer['magistrate'] || 0}</span>
        <span className="badge badge-amber">Notary: {data.breakdown.byAuthorizer['Notary'] || 0}</span>
      </div>

      <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Affidavits by paper type</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
        <span className="badge badge-green">₹500 Stamp: {data.breakdown.byPaper['stamp500'] || 0}</span>
        <span className="badge badge-blue">Plain: {data.breakdown.byPaper['Plain'] || 0}</span>
      </div>

      <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Birth/Death certificates</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
        <span className="badge badge-green">Birth: {data.breakdown.byType['Birth'] || 0}</span>
        <span className="badge badge-amber">Death: {data.breakdown.byType['Death'] || 0}</span>
      </div>

      <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Property cards by type</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
        <span className="badge badge-blue">Property Card: {data.breakdown.byCardType?.['Property Card'] || 0}</span>
        <span className="badge badge-blue">7/12 Card: {data.breakdown.byCardType?.['7/12 Card'] || 0}</span>
        <span className="badge badge-blue">8A: {data.breakdown.byCardType?.['8A'] || 0}</span>
      </div>

      <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Marriages by act</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {[
          ['Hindu Marriage Act', 'Hindu'],
          ['Muslim Personal Law (Shariat)', 'Muslim'],
          ['Indian Christian Marriage Act', 'Christian'],
        ].map(([key, label]) => (
          <span key={key} className="badge badge-blue">
            {label}: {data.breakdown.byAct[key] || 0}
          </span>
        ))}
      </div>
    </div>
  );
}
