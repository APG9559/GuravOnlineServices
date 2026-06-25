import { Link } from 'react-router-dom';

export default function SnoopyPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '2.5rem', background: '#ffffff', border: '3px solid #000000', boxShadow: 'var(--neo-shadow-lg)' }}>
        <div style={{ marginBottom: '1rem' }}>
          {/* <img src='/Snoopy.png' height={300} width={300} alt='SNOOPY' /> */}
          {/* <img src='https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTZ2Z3BtMjR6OGhlMHRnOHd4Z3UxMGFiZm82OHRnMGxxNjM2cSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/jpbnoe3UIa8TU8LM13/giphy.gif' height={300} width={300} alt='SNOOPY' style={{ borderRadius: 12 }} /> */}
          <img src="/cat.gif" height="300" width="300" alt="Snoopy" />
        </div>
        <h2 style={{ fontSize: '24px', marginBottom: '1.25rem', fontWeight: 900, fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
          You shouldn't be so snoopy!
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '14.5px', lineHeight: '1.6', fontWeight: 500 }}>
          This path is protected. You cannot list digital receipts without a valid secure transaction code.
        </p>
      </div>
    </div>
  );
}
