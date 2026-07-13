import { useFormContext } from 'react-hook-form';

interface CustomerSectionProps {
  showAutoFillIndicator: boolean;
}

export default function CustomerSection({ showAutoFillIndicator }: CustomerSectionProps) {
  const { register, watch } = useFormContext();
  const watchIsPrimaryContactSpouse = watch('isPrimaryContactSpouse') ?? true;

  return (
    <>
      <div className="section-label">Contact details</div>
      <div className="grid-2">
        <div className="form-group">
          <label>Primary contact name *</label>
          <input {...register('contactName', { required: true })} placeholder="Bride or groom" />
          {showAutoFillIndicator && (
            <span style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}>
              ✓ Auto-filled from customer profile
            </span>
          )}
        </div>
        <div className="form-group">
          <label>Phone number</label>
          <input {...register('phone', { required: false })} placeholder="Mobile number" />
        </div>
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" {...register('contactEmail')} placeholder="Contact email address" />
      </div>
      <div className="form-group">
        <label>Address</label>
        <input {...register('address')} placeholder="Full address" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <div className="checkbox-row" style={{ marginBottom: 0 }}>
          <input
            type="checkbox"
            id="f-primary-contact-check"
            {...register('isPrimaryContactSpouse')}
          />
          <label
            htmlFor="f-primary-contact-check"
            style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}
          >
            Primary contact is one of the spouses
          </label>
        </div>
        {watchIsPrimaryContactSpouse ? (
          <div
            style={{ display: 'flex', gap: 20, marginLeft: 24, marginTop: 4, alignItems: 'center' }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Spouse type:</span>
            <label
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <input type="radio" value="husband" {...register('primaryContactSpouseType')} />
              Husband
            </label>
            <label
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <input type="radio" value="wife" {...register('primaryContactSpouseType')} />
              Wife
            </label>
          </div>
        ) : (
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginLeft: 24,
              fontStyle: 'italic',
            }}
          >
            ℹ Primary contact is someone who came to enquire for spouses
          </div>
        )}
      </div>
    </>
  );
}
