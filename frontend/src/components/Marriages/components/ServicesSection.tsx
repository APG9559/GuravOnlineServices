import { useFormContext } from 'react-hook-form';

interface ServicesSectionProps {
  servicesDef: { key: string; cost: number }[];
  pricing: Record<string, number>;
  officialFeeAmount: number;
  watchMarriageDate: string;
  includeOfficialFee: boolean;
  setIncludeOfficialFee: (val: boolean) => void;
  includeCourtFeeTickets: boolean;
  setIncludeCourtFeeTickets: (val: boolean) => void;
}

export default function ServicesSection({
  servicesDef,
  pricing,
  officialFeeAmount,
  watchMarriageDate,
  includeOfficialFee,
  setIncludeOfficialFee,
  includeCourtFeeTickets,
  setIncludeCourtFeeTickets,
}: ServicesSectionProps) {
  const { register, watch, setValue } = useFormContext();
  const watchSvcs = watch('servicesProvided') || [];

  return (
    <>
      <hr className="divider" />
      <div className="section-label">Services provided</div>
      {servicesDef.map((s) => {
        const isMisc = s.key === 'Misc (Form - Xerox Copies)';
        const isChecked = watchSvcs.includes(s.key);

        return (
          <div key={s.key} style={{ marginBottom: 12 }}>
            <div className="checkbox-row" style={{ marginBottom: 0 }}>
              <input
                type="checkbox"
                id={`f-${s.key}`}
                value={s.key}
                checked={isChecked}
                onChange={(e) => {
                  const next = e.target.checked ? [...watchSvcs, s.key] : watchSvcs.filter((x: string) => x !== s.key);
                  setValue('servicesProvided', next);
                  if (isMisc) {
                    setValue('miscFee', e.target.checked ? (pricing.marriage_misc_fee ?? 0) : 0);
                  }
                }}
              />
              <label htmlFor={`f-${s.key}`} style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
                {s.key} {isMisc ? '' : `(₹${s.cost})`}
              </label>
            </div>

            {isMisc && isChecked && (
              <div style={{ marginLeft: 24, marginTop: 6 }} className="form-group">
                <label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Misc Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  style={{ maxWidth: 150 }}
                  {...register('miscFee', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            )}
          </div>
        );
      })}

      <div key="consultancy" style={{ marginBottom: 12 }}>
        <div className="checkbox-row" style={{ marginBottom: 0 }}>
          <input
            type="checkbox"
            id="f-consultancy"
            checked={watchSvcs.includes('Marriage Registration Consultancy Fee') || watchSvcs.includes('Marriage Consultancy Fee')}
            onChange={(e) => {
              const next = e.target.checked
                ? [...watchSvcs.filter((x: string) => x !== 'Marriage Consultancy Fee'), 'Marriage Registration Consultancy Fee']
                : watchSvcs.filter((x: string) => x !== 'Marriage Consultancy Fee' && x !== 'Marriage Registration Consultancy Fee');
              setValue('servicesProvided', next);
              if (e.target.checked) {
                setValue('consultancyFee', pricing.marriage_consultancy_fee ?? 500);
              } else {
                setValue('consultancyFee', 0);
              }
            }}
          />
          <label htmlFor="f-consultancy" style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
            Marriage Registration Consultancy Fee
          </label>
        </div>

        {(watchSvcs.includes('Marriage Registration Consultancy Fee') || watchSvcs.includes('Marriage Consultancy Fee')) && (
          <div style={{ marginLeft: 24, marginTop: 6 }} className="form-group">
            <label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Marriage Consultancy Fee (₹)</label>
            <input
              type="number"
              min={0}
              style={{ maxWidth: 150 }}
              {...register('consultancyFee', { valueAsNumber: true })}
              placeholder="500"
            />
          </div>
        )}
      </div>

      <div className="checkbox-row" key="official-fee">
        <input
          type="checkbox"
          id="f-official-fee"
          checked={includeOfficialFee}
          onChange={(e) => setIncludeOfficialFee(e.target.checked)}
        />
        <label htmlFor="f-official-fee" style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
          Official Fee {watchMarriageDate ? `(Auto-calculated: ₹${officialFeeAmount})` : '(Select Marriage Date to calculate)'}
        </label>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8, marginBottom: 8 }} key="court-fee-tickets">
        <span style={{ fontSize: 14, color: 'var(--text)' }}>Court Fee Tickets (₹{pricing.marriage_court_fee_tickets ?? 110}):</span>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
          <input
            type="radio"
            name="f-court-fee-tickets"
            checked={includeCourtFeeTickets === true}
            onChange={() => setIncludeCourtFeeTickets(true)}
          />
          Yes
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
          <input
            type="radio"
            name="f-court-fee-tickets"
            checked={includeCourtFeeTickets === false}
            onChange={() => setIncludeCourtFeeTickets(false)}
          />
          No
        </label>
      </div>
    </>
  );
}
