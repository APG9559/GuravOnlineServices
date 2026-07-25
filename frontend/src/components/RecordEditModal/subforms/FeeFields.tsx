import { SubTab } from '@/types';

interface FeeFieldsProps {
  type: SubTab;
  hasAutoFees: boolean;
  getStr: (key: string) => string;
  getNum: (key: string) => number;
  handleChange: (key: string, val: unknown) => void;
}

export default function FeeFields({
  type,
  hasAutoFees,
  getStr,
  getNum,
  handleChange,
}: FeeFieldsProps) {
  if (type === 'tradeLicenses') return null;

  if (hasAutoFees) {
    const isTax = type === 'propertyTaxes';
    const isWater = type === 'waterSupplies';
    return (
      <>
        <div className={isTax || isWater ? 'grid-3' : 'grid-2'}>
          <div className="form-group">
            <label>Official Fee (₹)</label>
            <input
              type="number"
              value={getNum('officialFee')}
              onChange={(e) => handleChange('officialFee', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label>Service Fee (₹)</label>
            <input
              type="number"
              value={getNum('serviceFee')}
              onChange={(e) => handleChange('serviceFee', parseFloat(e.target.value) || 0)}
            />
          </div>
          {(isTax || isWater) && (
            <div className="form-group">
              <label>Protocol Fee (₹)</label>
              <input
                type="number"
                value={getNum('protocolFee')}
                onChange={(e) => handleChange('protocolFee', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        </div>
        {isWater && (
          <div className="grid-2">
            <div className="form-group">
              <label>Misc Fee (₹)</label>
              <input
                type="number"
                value={getNum('miscFee')}
                onChange={(e) => handleChange('miscFee', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label>Discount (₹)</label>
              <input
                type="number"
                value={getNum('discount')}
                onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        )}
        <div className="form-group">
          <label>Total Amount Charged (₹)</label>
          <input
            type="number"
            value={getNum('amountCharged')}
            onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)}
          />
        </div>
      </>
    );
  }

  if (type === 'affidavits' && getStr('authorizerType') === 'Notary') {
    return (
      <div className="grid-2">
        <div className="form-group">
          <label>Notary Public Fee (₹)</label>
          <input
            type="number"
            value={getNum('notaryPublicFee')}
            onChange={(e) => handleChange('notaryPublicFee', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            value={getNum('amountCharged')}
            onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label>Amount (₹)</label>
      <input
        type="number"
        value={getNum('amountCharged')}
        onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}
