import { useRef } from 'react';
import { FormProvider } from 'react-hook-form';
import { useAppPrint } from '@/hooks/useAppPrint';
import { usePricing } from '@/hooks/usePricing';
import { WaterSupplyReceipt } from '@/components/ReceiptModal/Receipt';

// Hooks & Subcomponents
import { useWaterSupplyForm } from '@/components/WaterSupply/hooks/useWaterSupplyForm';
import WaterConnectionForm from '@/components/WaterSupply/components/WaterConnectionForm';

export default function WaterSupplyPage() {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const {
    methods,
    serviceTypeWatch,
    showAutoFillIndicator,
    defaultOfficial,
    defaultService,
    savedRecord,
    showSuccessModal,
    setShowSuccessModal,
    mutation,
  } = useWaterSupplyForm({ pricing, today });

  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  const handleClear = () => {
    methods.reset({
      serviceType: 'NewConnection',
      customerName: '',
      phone: '',
      connectionAddress: '',
      applicationTokenNo: '',
      applicationDate: today,
      dateOfService: today,
      officialFee: pricing.water_supply_new_official_fee ?? 1000,
      serviceFee: pricing.water_supply_new_service_fee ?? 500,
      amountCharged: (pricing.water_supply_new_official_fee ?? 1000) + (pricing.water_supply_new_service_fee ?? 500),
      plumberName: '',
      plumberPhone: '',
      contactPersonName: '',
      contactPersonPhone: '',
      connectionNo: '',
      currentOwner: '',
      newOwnerName: '',
      newOwnerPhone: '',
      transferSubtype: 'Purchase',
      currentUsage: '',
      newUsage: '',
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Water Supply Services</div>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        <div style={{ fontWeight: 500, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          New Water Supply Application Record
        </div>

        {mutation.isError && (
          <div className="alert-error" style={{ marginBottom: 16 }}>
            Failed to save record. Please try again.
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => mutation.mutate(d))}>
            <WaterConnectionForm
              today={today}
              showAutoFillIndicator={showAutoFillIndicator}
              serviceTypeWatch={serviceTypeWatch}
              defaultOfficial={defaultOfficial}
              defaultService={defaultService}
              isSaving={mutation.isPending}
              onClear={handleClear}
            />
          </form>
        </FormProvider>
      </div>

      {/* Success Modal popup */}
      {showSuccessModal && savedRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card modal-card" style={{ width: '100%', maxWidth: 400, position: 'relative', textAlign: 'center', padding: '2rem' }}>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Water Supply Saved!</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Record for {savedRecord.customerName} has been saved.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => { handlePrint(); setShowSuccessModal(false); }}>
                🖨 Print Receipt
              </button>
              <button className="btn" onClick={() => setShowSuccessModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable template */}
      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <WaterSupplyReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
