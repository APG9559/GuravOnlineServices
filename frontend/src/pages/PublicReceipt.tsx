import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { publicReceiptsApi } from '@/api';
import {
  AffidavitReceipt, MarriageReceipt, BirthDeathReceipt,
  PropertyCardReceipt, ShopActLicenseReceipt,
  TradeLicenseReceipt, PanCardReceipt, PassportReceipt,
  VoterCardReceipt, GazetteReceipt, WaterSupplyReceipt, PropertyTaxReceipt
} from '@/components/ReceiptModal/Receipt';

export default function PublicReceipt() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!type || !id) return;
    setLoading(true);
    setError(null);
    publicReceiptsApi.getOne(type, id)
      .then((res) => {
        setRecord(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load receipt record');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [type, id]);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #000', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'Outfit' }}>Fetching Secure Receipt...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', marginBottom: '1rem', fontWeight: 800 }}>Receipt Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '14px' }}>
            {error || 'The receipt record you are looking for does not exist or has been removed.'}
          </p>
          <div style={{ fontSize: '11px', color: 'var(--text-hint)', background: 'var(--bg)', padding: '8px', borderRadius: '4px', border: '1px solid #000' }}>
            ID: {id}
          </div>
        </div>
      </div>
    );
  }

  const renderReceipt = () => {
    switch (type?.toLowerCase()) {
      case 'affidavit':
        return <AffidavitReceipt ref={receiptRef} record={record} />;
      case 'marriage':
        return <MarriageReceipt ref={receiptRef} record={record} />;
      case 'birth-death':
        return <BirthDeathReceipt ref={receiptRef} record={record} />;
      case 'property-card':
        return <PropertyCardReceipt ref={receiptRef} record={record} />;
      case 'shop-act':
        return <ShopActLicenseReceipt ref={receiptRef} record={record} />;
      case 'trade-license':
        return <TradeLicenseReceipt ref={receiptRef} record={record} />;
      case 'pan-card':
        return <PanCardReceipt ref={receiptRef} record={record} />;
      case 'passport':
        return <PassportReceipt ref={receiptRef} record={record} />;
      case 'voter-card':
        return <VoterCardReceipt ref={receiptRef} record={record} />;
      case 'gazette':
        return <GazetteReceipt ref={receiptRef} record={record} />;
      case 'water-supply':
        return <WaterSupplyReceipt ref={receiptRef} record={record} />;
      case 'property-tax':
        return <PropertyTaxReceipt ref={receiptRef} record={record} />;
      default:
        return <div>Unsupported receipt type: {type}</div>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '3rem' }}>
      <div className="no-print" style={{
        background: '#ffffff',
        borderBottom: '3px solid #000000',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 0px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📄</span>
          <span style={{ fontWeight: 800, fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Digital Receipt
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 12px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>
          {renderReceipt()}
        </div>
      </div>
    </div>
  );
}
