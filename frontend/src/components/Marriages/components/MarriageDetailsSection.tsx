import { Controller, useFormContext } from 'react-hook-form';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

interface MarriageDetailsSectionProps {
  today: string;
}

export default function MarriageDetailsSection({ today }: MarriageDetailsSectionProps) {
  const { register, control } = useFormContext();

  return (
    <>
      <div className="section-label">Marriage details</div>
      <div className="grid-2">
        <div className="form-group">
          <label>Husband name <span className="required-star">*</span></label>
          <input {...register('spouse1Name', { required: true })} />
        </div>
        <div className="form-group">
          <label>Wife name <span className="required-star">*</span></label>
          <input {...register('spouse2Name', { required: true })} />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>Marriage act <span className="required-star">*</span></label>
          <Controller
            control={control}
            name="marriageAct"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <NeoSelect
                value={value || ''}
                onChange={onChange}
                options={[
                  { value: 'Hindu Marriage Act', label: 'Hindu Marriage Act' },
                  {
                    value: 'Muslim Personal Law (Shariat)',
                    label: 'Muslim Personal Law (Shariat)',
                  },
                  {
                    value: 'Indian Christian Marriage Act',
                    label: 'Indian Christian Marriage Act',
                  },
                ]}
                placeholder="Select act"
              />
            )}
          />
        </div>
        <div className="form-group">
          <label>Date of marriage <span className="required-star">*</span></label>
          <Controller
            control={control}
            name="marriageDate"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <NeoDatePicker value={value} onChange={onChange} />
            )}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Place of marriage</label>
          <input {...register('marriagePlace')} placeholder="Venue / city" />
        </div>
        <div className="form-group">
          <label>Application No.</label>
          <input {...register('applicationNo')} placeholder="e.g. application number" />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Date of our service <span className="required-star">*</span></label>
          <Controller
            control={control}
            name="dateOfService"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <NeoDatePicker value={value} onChange={onChange} max={today} />
            )}
          />
        </div>
        <div className="form-group">
          <label>Appointment Date</label>
          <Controller
            control={control}
            name="appointmentDate"
            render={({ field: { value, onChange } }) => (
              <NeoDatePicker value={value || ''} onChange={onChange} />
            )}
          />
        </div>
      </div>
    </>
  );
}
