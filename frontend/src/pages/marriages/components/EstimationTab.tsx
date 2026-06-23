import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { marriagesApi, customersApi } from '@/api';
import { PaperType, AuthorizerType, MarriageTicket, QuestionnaireData, ProofEntry } from '@/types';
import { defaultQuestionnaire, calcEstimationTotal, getEntryAmount } from '../helpers';
import { calcAffidavitTotal } from '@/hooks/usePricing';
import ProofBlock from './ProofBlock';
import SituationBlock from './SituationBlock';

interface EstimationTabProps {
  editingTicket: MarriageTicket | null;
  onCancelEdit: () => void;
  onSuccess: () => void;
  pricing: Record<string, number>;
  servicesDef: { key: string; cost: number }[];
}

export default function EstimationTab({
  editingTicket,
  onCancelEdit,
  onSuccess,
  pricing,
  servicesDef,
}: EstimationTabProps) {
  const qc = useQueryClient();

  const [estName, setEstName] = useState('');
  const [estPhone, setEstPhone] = useState('');
  const [estEmail, setEstEmail] = useState('');
  const [estAddress, setEstAddress] = useState('');
  const [estIsPrimaryContactSpouse, setEstIsPrimaryContactSpouse] = useState(true);
  const [estPrimaryContactSpouseType, setEstPrimaryContactSpouseType] = useState<'husband' | 'wife'>('husband');
  const [estServices, setEstServices] = useState<string[]>([]);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>(defaultQuestionnaire());
  const [estAmountOverride, setEstAmountOverride] = useState<number | null>(null);
  const [showEstAutoFillIndicator, setShowEstAutoFillIndicator] = useState(false);

  // Sync state if editingTicket changes
  useEffect(() => {
    if (editingTicket) {
      setEstName(editingTicket.contactName);
      setEstPhone(editingTicket.phone);
      setEstEmail(editingTicket.contactEmail || '');
      setEstAddress(editingTicket.address || '');
      setEstIsPrimaryContactSpouse(editingTicket.isPrimaryContactSpouse ?? true);
      setEstPrimaryContactSpouseType(editingTicket.primaryContactSpouseType || 'husband');
      setEstServices(editingTicket.servicesProvided || []);
      setQuestionnaire(editingTicket.questionnaireData || defaultQuestionnaire());
      setEstAmountOverride(Number(editingTicket.amountCharged));
    } else {
      // Clear/Reset form
      setEstName('');
      setEstPhone('');
      setEstEmail('');
      setEstAddress('');
      setEstIsPrimaryContactSpouse(true);
      setEstPrimaryContactSpouseType('husband');
      setEstServices([]);
      setQuestionnaire(defaultQuestionnaire());
      setEstAmountOverride(null);
    }
  }, [editingTicket]);

  // Customer auto-fill for Estimation Tab
  useEffect(() => {
    if (editingTicket) return; // Don't override when editing a ticket
    if (estPhone && /^[6-9]\d{9}$/.test(estPhone)) {
      customersApi.lookup(estPhone)
        .then((res) => {
          if (res.data) {
            setEstName(res.data.name);
            if (res.data.email) setEstEmail(res.data.email);
            if (res.data.address) setEstAddress(res.data.address);
            setShowEstAutoFillIndicator(true);
            setTimeout(() => setShowEstAutoFillIndicator(false), 3000);
          }
        })
        .catch(() => { });
    }
  }, [estPhone, editingTicket]);

  const estimatedTotal = calcEstimationTotal(questionnaire, estServices, pricing);
  const ticketAmount = estAmountOverride ?? estimatedTotal;

  const createTicketMut = useMutation({
    mutationFn: (data: any) => marriagesApi.createTicket(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      onSuccess();
    },
  });

  const updateTicketMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      marriagesApi.updateTicket(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      onSuccess();
    },
  });

  const updateProof = (person: 'husband' | 'wife', field: keyof QuestionnaireData['husband'], entry: ProofEntry) => {
    setQuestionnaire((prev) => ({
      ...prev,
      [person]: { ...prev[person], [field]: entry },
    }));
    setEstAmountOverride(null);
  };

  const isAnyAffidavitDiscountedWithoutRemark = () => {
    const checkEntry = (entry?: { affidavit?: string; amountCharged?: number; paperType?: PaperType; authorizer?: AuthorizerType; remark?: string }) => {
      if (!entry || entry.affidavit !== 'Yes' || !entry.paperType || !entry.authorizer) return false;
      const calcAmt = calcAffidavitTotal(entry.paperType, entry.authorizer, pricing).total;
      const charged = entry.amountCharged ?? calcAmt;
      return charged < calcAmt && !entry.remark?.trim();
    };

    const q = questionnaire;
    return (
      checkEntry(q.husband?.birthDateProof) ||
      checkEntry(q.husband?.residenceProof) ||
      checkEntry(q.husband?.identityProof) ||
      checkEntry(q.wife?.birthDateProof) ||
      checkEntry(q.wife?.residenceProof) ||
      checkEntry(q.wife?.identityProof) ||
      checkEntry(q.weddingInvitation) ||
      checkEntry(q.firstMarriage) ||
      checkEntry(q.intercasteMarriage) ||
      checkEntry(q.notRegisteredAnywhereElse)
    );
  };

  const isSubsequentMarriageNameMissing = () => {
    const q = questionnaire;
    return (
      q.firstMarriage &&
      q.firstMarriage.yes === false &&
      q.firstMarriage.affidavit === 'Yes' &&
      !q.firstMarriage.customerName?.trim()
    );
  };

  const handleGenerateTicket = () => {
    if (!estName.trim() || !estPhone.trim()) return;

    const finalQuestionnaire = {
      ...questionnaire,
      consultancyFee: questionnaire.consultancyFee?.included
        ? {
          amountCharged: questionnaire.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500),
          included: true
        }
        : undefined
    };

    const payload = {
      contactName: estName,
      phone: estPhone,
      contactEmail: estEmail || undefined,
      address: estAddress || undefined,
      isPrimaryContactSpouse: estIsPrimaryContactSpouse,
      primaryContactSpouseType: estIsPrimaryContactSpouse ? estPrimaryContactSpouseType : null,
      servicesProvided: estServices,
      amountCharged: ticketAmount,
      questionnaireData: finalQuestionnaire,
    };

    if (editingTicket) {
      updateTicketMut.mutate({ id: editingTicket.id, data: payload });
    } else {
      createTicketMut.mutate(payload);
    }
  };

  const breakdownItems = useMemo(() => {
    const items: { label: string; amount: number; remark?: string }[] = [];
    const q = questionnaire;

    const addEntry = (label: string, entry?: { affidavit?: string; amountCharged?: number; remark?: string; customerName?: string }) => {
      const amt = getEntryAmount(entry, pricing);
      if (amt > 0) {
        let finalLabel = label;
        if (entry?.customerName?.trim()) {
          finalLabel = `${label} (${entry.customerName.trim()})`;
        }
        items.push({ label: finalLabel, amount: amt, remark: entry?.remark });
      }
    };

    addEntry('Husband - Birth Date Proof', q.husband?.birthDateProof);
    addEntry('Husband - Residence Proof', q.husband?.residenceProof);
    addEntry('Husband - Identity Proof', q.husband?.identityProof);
    addEntry('Wife - Birth Date Proof', q.wife?.birthDateProof);
    addEntry('Wife - Residence Proof', q.wife?.residenceProof);
    addEntry('Wife - Identity Proof', q.wife?.identityProof);
    addEntry('Wedding Invitation', q.weddingInvitation);
    addEntry('First Marriage', q.firstMarriage);
    addEntry('Intercaste Marriage', q.intercasteMarriage);
    addEntry('Not Registered Anywhere Else', q.notRegisteredAnywhereElse);

    // Consultancy Fee
    const consultancyAmt = q.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500);
    items.push({ label: 'Marriage Consultancy Fee', amount: consultancyAmt });

    servicesDef.filter((s) => estServices.includes(s.key)).forEach((s) => {
      items.push({ label: s.key, amount: s.cost });
    });

    return items;
  }, [questionnaire, estServices, pricing, servicesDef]);

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div style={{ fontWeight: 500, marginBottom: '1rem' }}>
        {editingTicket ? `Edit Estimation Ticket — ${editingTicket.ticketNumber}` : 'Marriage Registration Estimation'}
      </div>

      {(createTicketMut.isError || updateTicketMut.isError) && (
        <div className="alert-error" style={{ marginBottom: 16 }}>
          Failed to save ticket. Please try again.
        </div>
      )}

      {/* Contact info */}
      <div className="section-label">Customer details</div>
      <div className="grid-2">
        <div className="form-group">
          <label>Customer name *</label>
          <input value={estName} onChange={(e) => setEstName(e.target.value)} placeholder="Customer name" />
          {showEstAutoFillIndicator && (
            <span style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}>✓ Auto-filled from customer profile</span>
          )}
        </div>
        <div className="form-group">
          <label>Phone number *</label>
          <input value={estPhone} onChange={(e) => setEstPhone(e.target.value)} placeholder="10-digit mobile" />
        </div>
      </div>
      <div className="form-group"><label>Email</label><input type="email" value={estEmail} onChange={(e) => setEstEmail(e.target.value)} placeholder="Email address" /></div>
      <div className="form-group"><label>Address</label><input value={estAddress} onChange={(e) => setEstAddress(e.target.value)} placeholder="Full address" /></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <div className="checkbox-row" style={{ marginBottom: 0 }}>
          <input
            type="checkbox"
            id="est-primary-contact-check"
            checked={estIsPrimaryContactSpouse}
            onChange={(e) => {
              setEstIsPrimaryContactSpouse(e.target.checked);
            }}
          />
          <label htmlFor="est-primary-contact-check" style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
            Primary contact is one of the spouses
          </label>
        </div>
        {estIsPrimaryContactSpouse ? (
          <div style={{ display: 'flex', gap: 20, marginLeft: 24, marginTop: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Spouse type:</span>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
              <input
                type="radio"
                name="estSpouseType"
                checked={estPrimaryContactSpouseType === 'husband'}
                onChange={() => setEstPrimaryContactSpouseType('husband')}
              />
              Husband
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
              <input
                type="radio"
                name="estSpouseType"
                checked={estPrimaryContactSpouseType === 'wife'}
                onChange={() => setEstPrimaryContactSpouseType('wife')}
              />
              Wife
            </label>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 24, fontStyle: 'italic' }}>
            ℹ Primary contact is someone who came to enquire for spouses
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* Section 1: Husband */}
      <div className="section-label">Section 1 — Husband</div>
      <ProofBlock label="Birth Date Proof" entry={questionnaire.husband.birthDateProof} pricing={pricing}
        onChange={(e) => updateProof('husband', 'birthDateProof', e)} />
      <ProofBlock label="Residence Proof" entry={questionnaire.husband.residenceProof} pricing={pricing}
        onChange={(e) => updateProof('husband', 'residenceProof', e)} />
      <ProofBlock label="Identity Proof" entry={questionnaire.husband.identityProof} pricing={pricing}
        onChange={(e) => updateProof('husband', 'identityProof', e)} />

      {/* Section 2: Wife */}
      <div className="section-label">Section 2 — Wife</div>
      <ProofBlock label="Birth Date Proof" entry={questionnaire.wife.birthDateProof} pricing={pricing}
        onChange={(e) => updateProof('wife', 'birthDateProof', e)} />
      <ProofBlock label="Residence Proof" entry={questionnaire.wife.residenceProof} pricing={pricing}
        onChange={(e) => updateProof('wife', 'residenceProof', e)} />
      <ProofBlock label="Identity Proof" entry={questionnaire.wife.identityProof} pricing={pricing}
        onChange={(e) => updateProof('wife', 'identityProof', e)} />

      {/* Section 3: Wedding Invitation */}
      <div className="section-label">Section 3 — Wedding Invitation</div>
      <SituationBlock
        label="Do you have a wedding invitation card?"
        radioLabel={['Yes', 'No']}
        entry={questionnaire.weddingInvitation}
        triggerOnValue={false}
        pricing={pricing}
        onChange={(e: any) => { setQuestionnaire((prev) => ({ ...prev, weddingInvitation: e })); setEstAmountOverride(null); }}
      />

      {/* Section 4: First Marriage */}
      <div className="section-label">Section 4 — First Marriage</div>
      <SituationBlock
        label="Is this the first marriage?"
        radioLabel={['Yes', 'No']}
        entry={questionnaire.firstMarriage}
        triggerOnValue={false}
        pricing={pricing}
        showNameInput={true}
        nameInputLabel="Name for subsequent marriage affidavit *"
        onChange={(e: any) => { setQuestionnaire((prev) => ({ ...prev, firstMarriage: e })); setEstAmountOverride(null); }}
      />

      {/* Section 5: Intercaste Marriage */}
      <div className="section-label">Section 5 — Intercaste Marriage</div>
      <SituationBlock
        label="Is this an intercaste marriage?"
        radioLabel={['Yes', 'No']}
        entry={questionnaire.intercasteMarriage}
        triggerOnValue={true}
        pricing={pricing}
        onChange={(e: any) => { setQuestionnaire((prev) => ({ ...prev, intercasteMarriage: e })); setEstAmountOverride(null); }}
      />

      {/* Section 6: Not Registered Anywhere Else */}
      <div className="section-label">Section 6 — Not Registered Anywhere Else</div>
      <SituationBlock
        label="Is the marriage not registered anywhere else?"
        radioLabel={['Yes', 'No']}
        entry={questionnaire.notRegisteredAnywhereElse || { yes: false, affidavit: 'No' }}
        triggerOnValue={true}
        pricing={pricing}
        onChange={(e: any) => { setQuestionnaire((prev) => ({ ...prev, notRegisteredAnywhereElse: e })); setEstAmountOverride(null); }}
      />

      {/* Section 7: Consultancy Fee */}
      <div className="section-label">Section 7 — Consultancy Fee</div>
      <div style={{ marginBottom: 16, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="checkbox-row" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              id="est-consultancy-check"
              checked={questionnaire.consultancyFee?.included ?? false}
              onChange={(e) => {
                const checked = e.target.checked;
                setQuestionnaire((prev) => ({
                  ...prev,
                  consultancyFee: {
                    ...prev.consultancyFee,
                    included: checked,
                    amountCharged: checked ? (prev.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500)) : 0
                  }
                }));
                setEstAmountOverride(null);
              }}
            />
            <label htmlFor="est-consultancy-check" style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
              Charge Marriage Consultancy Fee (₹{pricing.marriage_consultancy_fee ?? 500})
            </label>
          </div>

          {questionnaire.consultancyFee?.included && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Amount (₹)</label>
              <input
                type="number"
                min={0}
                value={questionnaire.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQuestionnaire((prev) => ({
                    ...prev,
                    consultancyFee: { ...prev.consultancyFee, amountCharged: val, included: true }
                  }));
                  setEstAmountOverride(null);
                }}
                style={{ fontSize: 13 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Section 8: Services */}
      <hr className="divider" />
      <div className="section-label">Section 8 — Services</div>
      {servicesDef.map((s) => (
        <div className="checkbox-row" key={s.key}>
          <input
            type="checkbox"
            id={`est-${s.key}`}
            checked={estServices.includes(s.key)}
            onChange={(e) => {
              setEstServices(e.target.checked ? [...estServices, s.key] : estServices.filter((x) => x !== s.key));
              setEstAmountOverride(null);
            }}
          />
          <label htmlFor={`est-${s.key}`} style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
            {s.key} (₹{s.cost})
          </label>
        </div>
      ))}

      {/* Price breakdown */}
      {breakdownItems.length > 0 && (
        <div className="price-box" style={{ marginTop: 16 }}>
          {breakdownItems.map((item, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div className="price-row" style={{ marginBottom: 0 }}>
                <span>{item.label}</span>
                <span>₹{item.amount.toLocaleString('en-IN')}</span>
              </div>
              {item.remark && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2, paddingLeft: 8, fontWeight: 500 }}>
                  ↳ Remark: {item.remark}
                </div>
              )}
            </div>
          ))}
          <div className="price-total">
            <span className="price-total-label">Calculated total</span>
            <span className="price-total-value">₹{estimatedTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Editable amount charged */}
      <div className="form-group" style={{ marginTop: 16 }}>
        <label>Amount Charged (₹) *</label>
        <input
          type="number"
          min={0}
          value={ticketAmount}
          onChange={(e) => setEstAmountOverride(Number(e.target.value))}
          placeholder="Auto-calculated, can edit to charge more"
        />
      </div>

      {isAnyAffidavitDiscountedWithoutRemark() && (
        <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
          ⚠ Please provide a remark for all discounted affidavits before generating a ticket.
        </div>
      )}

      {isSubsequentMarriageNameMissing() && (
        <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
          ⚠ Please provide the name for the subsequent marriage affidavit before generating a ticket.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {editingTicket && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelEdit}
            disabled={updateTicketMut.isPending}
          >
            Cancel Edit
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleGenerateTicket}
          disabled={
            createTicketMut.isPending ||
            updateTicketMut.isPending ||
            !estName.trim() ||
            !estPhone.trim() ||
            isAnyAffidavitDiscountedWithoutRemark() ||
            isSubsequentMarriageNameMissing()
          }
        >
          {editingTicket
            ? (updateTicketMut.isPending ? 'Saving…' : '💾 Save Changes')
            : (createTicketMut.isPending ? 'Creating…' : '📋 Generate Ticket')
          }
        </button>
      </div>
    </div>
  );
}
