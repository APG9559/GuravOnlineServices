import { SubTab } from '@/types';

interface PersonalFieldsProps {
  type: SubTab;
  getStr: (key: string) => string;
  handleChange: (key: string, val: unknown) => void;
}

export default function PersonalFields({ type, getStr, handleChange }: PersonalFieldsProps) {
  const isMarriages = type === 'marriages';
  const isGazetteOrTax = type === 'gazettes' || type === 'propertyTaxes';

  return (
    <div className="grid-2">
      <div className="form-group">
        <label>
          {isMarriages ? 'Contact name' : isGazetteOrTax ? 'Applicant name' : 'Customer name'}
        </label>
        <input
          value={getStr('customerName') || getStr('contactName')}
          onChange={(e) =>
            handleChange(isMarriages ? 'contactName' : 'customerName', e.target.value)
          }
        />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input value={getStr('phone')} onChange={(e) => handleChange('phone', e.target.value)} />
      </div>
    </div>
  );
}
