import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  MessageChannel,
  MessageModule,
  replacePlaceholders,
  getUnreplacedPlaceholders,
  generateMessageUrl,
  MessageTemplate,
  MESSAGE_TEMPLATES,
} from '@/utils/messageTemplates';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, CountryCode } from '@/utils/countryCodes';
import { useCustomerNameSearch } from '@/hooks/useCustomerNameSearch';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';
import NeoSelect from '@/components/NeoSelect';
import { messageLogsApi } from '@/api';

const MODULE_OPTIONS: { value: MessageModule; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'birthDeath', label: 'Birth/Death' },
  { value: 'marriages', label: 'Marriage Registration' },
  { value: 'tradeLicenses', label: 'Trade Licenses' },
  { value: 'waterSupplies', label: 'Water Supply' },
  { value: 'propertyTaxes', label: 'Property Tax' },
  { value: 'panCards', label: 'PAN Cards' },
  { value: 'passports', label: 'Passports' },
  { value: 'affidavits', label: 'Affidavits' },
  { value: 'propertyCards', label: 'Property Cards' },
  { value: 'shopAct', label: 'Shop Act' },
  { value: 'gazettes', label: 'Gazette' },
  { value: 'voterCards', label: 'Voter Cards' },
];

export default function QuickMessageCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Form State ─────────────────────────────────────────────────────────
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedModule, setSelectedModule] = useState<MessageModule>('general');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [channel, setChannel] = useState<MessageChannel>('whatsapp');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY_CODE);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Templates State (loaded from localStorage or fallback defaults)
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('quick_message_templates');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedIds = new Set(parsed.map((t: any) => t.id));
          const missingDefaults = MESSAGE_TEMPLATES.filter((t) => !parsedIds.has(t.id));
          if (missingDefaults.length > 0) {
            const merged = [...parsed, ...missingDefaults];
            localStorage.setItem('quick_message_templates', JSON.stringify(merged));
            setTemplates(merged);
            return;
          }
          setTemplates(parsed);
          return;
        }
      }
    } catch (e) {}
    setTemplates([...MESSAGE_TEMPLATES]);
  }, [isExpanded]);

  // Module-specific variables
  const [applicationNo, setApplicationNo] = useState('');
  const [tradeLicenseNo, setTradeLicenseNo] = useState('');
  const [connectionNo, setConnectionNo] = useState('');
  const [propertyTaxNo, setPropertyTaxNo] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  // Message state
  const [messageText, setMessageText] = useState('');
  const [isManualEdit, setIsManualEdit] = useState(false);

  // ── Customer Autocomplete & Lookup Hooks ──
  const { suggestions, setSuggestions } = useCustomerNameSearch(customerName);
  const { showAutoFillIndicator } = useCustomerLookup(
    phone,
    (customer) => {
      setCustomerName(customer.name);
    }
  );

  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setSuggestions]);

  // Auto-fill phone if name matches exactly and phone is empty
  useEffect(() => {
    if (customerName.trim().length > 1 && !phone) {
      const exactMatch = suggestions.find(
        (c) => c.name.trim().toLowerCase() === customerName.trim().toLowerCase()
      );
      if (exactMatch && exactMatch.phone) {
        let cleanNum = exactMatch.phone.replace(/^\+91/, '').replace(/\s+/g, '');
        setPhone(cleanNum);
      }
    }
  }, [customerName, suggestions, phone]);

  // ── Derived ────────────────────────────────────────────────────────────
  const filteredTemplates = useMemo(() => {
    return templates.filter(
      (t) => t.modules.includes('*') || t.modules.includes(selectedModule),
    );
  }, [templates, selectedModule]);

  const selectedTemplate = useMemo(
    () => filteredTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [filteredTemplates, selectedTemplateId],
  );

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRY_CODES;
    const q = countrySearch.toLowerCase();
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.short.toLowerCase().includes(q),
    );
  }, [countrySearch]);

  // Build the variables map from form values
  const buildVariables = useCallback((): Record<string, string> => {
    const vars: Record<string, string> = {
      CustomerName: customerName,
      Phone: phone,
      OfficeName: 'Gurav Online Services',
      OperatorName: 'Gurav Online Services',
    };

    if (applicationNo) vars.ApplicationNo = applicationNo;
    if (serviceType) vars.ServiceType = serviceType;
    if (dueAmount) vars.DueAmount = dueAmount;

    if (selectedModule === 'tradeLicenses') {
      if (tradeLicenseNo) vars.TradeLicenseNo = tradeLicenseNo;
    } else if (selectedModule === 'waterSupplies') {
      if (connectionNo) vars.ConnectionNo = connectionNo;
    } else if (selectedModule === 'propertyTaxes') {
      if (propertyTaxNo) vars.PropertyTaxNo = propertyTaxNo;
    } else if (selectedModule === 'marriages') {
      if (appointmentDate) vars.AppointmentDate = appointmentDate;
      if (appointmentTime) vars.AppointmentTime = appointmentTime;
    }

    return vars;
  }, [
    customerName, phone, applicationNo, serviceType, dueAmount,
    tradeLicenseNo, connectionNo, propertyTaxNo, appointmentDate, appointmentTime, selectedModule,
  ]);

  // Auto-generate message from template
  const generateMessage = useCallback(() => {
    if (!selectedTemplate) return '';
    return replacePlaceholders(selectedTemplate.body, buildVariables());
  }, [selectedTemplate, buildVariables]);

  // When template changes, regenerate (unless manual)
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsManualEdit(false);
    const tpl = filteredTemplates.find((t) => t.id === templateId);
    if (tpl) {
      setMessageText(replacePlaceholders(tpl.body, buildVariables()));
    } else {
      setMessageText('');
    }
  };

  // Auto-refresh preview when form values change (if not manual)
  const currentPreview = isManualEdit ? messageText : generateMessage();

  // When user types in textarea
  const handleMessageEdit = (value: string) => {
    setMessageText(value);
    setIsManualEdit(true);
  };

  // Refresh from template (reset manual mode)
  const handleRefresh = () => {
    if (selectedTemplate) {
      setMessageText(generateMessage());
      setIsManualEdit(false);
    }
  };

  const cleanPhone = phone.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length >= 7 && cleanPhone.length <= 15;
  const canSend = isPhoneValid && currentPreview.trim().length > 0;

  const unreplaced = getUnreplacedPlaceholders(currentPreview);

  const hasPlaceholder = useCallback((placeholderName: string): boolean => {
    if (!selectedTemplate) return false;
    return selectedTemplate.body.includes(`{${placeholderName}}`);
  }, [selectedTemplate]);

  const handleSend = () => {
    if (!canSend) return;
    messageLogsApi.create({
      module: selectedModule,
      templateId: selectedTemplateId || undefined,
      templateLabel: selectedTemplate?.label || undefined,
      channel,
      recipientName: customerName || undefined,
      recipientPhone: cleanPhone,
      messageBody: currentPreview,
    }).catch(() => { /* non-blocking */ });
    const url = generateMessageUrl(channel, selectedCountry.code, cleanPhone, currentPreview);
    window.open(url, '_blank');
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.5rem',
        border: '3px solid var(--border)',
        boxShadow: 'var(--neo-shadow)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
      }}
    >
      {/* ── Header (click to expand/collapse) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            💬 Quick Message — WhatsApp & SMS
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            {isExpanded
              ? 'Send a pre-written message to a customer via WhatsApp or SMS'
              : 'Click to expand and send a quick message'}
          </p>
        </div>
        <button
          className="btn btn-sm"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* ── Expanded Content ── */}
      {isExpanded && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '2px dashed var(--border)' }}>
          <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
            {/* ── Left Column: Form ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Phone Number with Country Code */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Customer Phone *</span>
                  {showAutoFillIndicator && (
                    <span style={{ color: 'var(--success)', fontSize: 11, fontWeight: 600 }}>
                      ✓ Auto-filled
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: 0 }}>
                  {/* Country Code Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="qm-country-btn"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      title={`${selectedCountry.name} (${selectedCountry.code})`}
                    >
                      <span style={{ fontSize: 18 }}>{selectedCountry.flag}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{selectedCountry.code}</span>
                      <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
                    </button>

                    {showCountryDropdown && (
                      <>
                        {/* Click-away overlay */}
                        <div
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 149,
                          }}
                          onClick={() => {
                            setShowCountryDropdown(false);
                            setCountrySearch('');
                          }}
                        />
                        <div className="qm-country-dropdown">
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              fontSize: 13,
                              border: 'none',
                              borderBottom: '2.5px solid var(--border)',
                              borderRadius: 0,
                              boxShadow: 'none',
                              outline: 'none',
                              background: 'var(--surface)',
                              color: 'var(--text)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {filteredCountries.map((c) => (
                              <button
                                key={`${c.short}-${c.code}`}
                                type="button"
                                className={`qm-country-option ${c.short === selectedCountry.short && c.code === selectedCountry.code ? 'active' : ''}`}
                                onClick={() => handleCountrySelect(c)}
                              >
                                <span style={{ fontSize: 16 }}>{c.flag}</span>
                                <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{c.code}</span>
                              </button>
                            ))}
                            {filteredCountries.length === 0 && (
                              <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                                No countries found
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Phone Input */}
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      flex: 1,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderLeft: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Customer Name */}
              <div ref={suggestionsRef} className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patil"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoComplete="off"
                  onClick={(e) => e.stopPropagation()}
                />
                {suggestions.length > 0 && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--surface)',
                      border: '2.5px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      boxShadow: 'var(--neo-shadow-sm)',
                      zIndex: 50,
                      maxHeight: '180px',
                      overflowY: 'auto',
                      marginTop: 4,
                    }}
                  >
                    {suggestions.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          setCustomerName(cust.name);
                          if (cust.phone) {
                            // Strip country code if present since the input prefix handles it
                            let cleanNum = cust.phone.replace(/^\+91/, '').replace(/\s+/g, '');
                            setPhone(cleanNum);
                          } else {
                            setPhone('');
                          }
                          setSuggestions([]);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1.5px solid var(--border-light)',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{cust.name}</div>
                        {cust.phone && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                            📞 {cust.phone}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Module Selector */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Module</label>
                <NeoSelect
                  value={selectedModule}
                  onChange={(val) => {
                    setSelectedModule(val as MessageModule);
                    setSelectedTemplateId('');
                    setMessageText('');
                    setIsManualEdit(false);
                  }}
                  options={MODULE_OPTIONS}
                />
              </div>

              {/* Template Dropdown */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Message Template</label>
                <NeoSelect
                  value={selectedTemplateId}
                  onChange={(val) => handleTemplateChange(val)}
                  options={filteredTemplates.map((t) => ({ value: t.id, label: t.label }))}
                  placeholder="— Select a template —"
                />
              </div>

              {/* Module-Specific Variables */}
              {(hasPlaceholder('ApplicationNo') ||
                hasPlaceholder('TradeLicenseNo') ||
                hasPlaceholder('ConnectionNo') ||
                hasPlaceholder('PropertyTaxNo') ||
                hasPlaceholder('AppointmentDate') ||
                hasPlaceholder('AppointmentTime') ||
                hasPlaceholder('ServiceType') ||
                hasPlaceholder('DueAmount') ||
                hasPlaceholder('Amount')) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {hasPlaceholder('ApplicationNo') && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Application / Token No</label>
                      <input
                        type="text"
                        placeholder="e.g. 26480"
                        value={applicationNo}
                        onChange={(e) => setApplicationNo(e.target.value)}
                      />
                    </div>
                  )}

                  {hasPlaceholder('TradeLicenseNo') && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Trade License No</label>
                      <input
                        type="text"
                        placeholder="e.g. KMC/TL/12345"
                        value={tradeLicenseNo}
                        onChange={(e) => setTradeLicenseNo(e.target.value)}
                      />
                    </div>
                  )}

                  {hasPlaceholder('ConnectionNo') && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Connection No</label>
                      <input
                        type="text"
                        placeholder="e.g. WS-98765"
                        value={connectionNo}
                        onChange={(e) => setConnectionNo(e.target.value)}
                      />
                    </div>
                  )}

                  {hasPlaceholder('PropertyTaxNo') && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Property Tax No</label>
                      <input
                        type="text"
                        placeholder="e.g. PT/2026/001"
                        value={propertyTaxNo}
                        onChange={(e) => setPropertyTaxNo(e.target.value)}
                      />
                    </div>
                  )}

                  {(hasPlaceholder('AppointmentDate') || hasPlaceholder('AppointmentTime')) && (
                    <div className="grid-2" style={{ gap: 10 }}>
                      {hasPlaceholder('AppointmentDate') && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Appointment Date</label>
                          <input
                            type="date"
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                            style={{ width: '100%' }}
                          />
                        </div>
                      )}
                      {hasPlaceholder('AppointmentTime') && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Appointment Time</label>
                          <input
                            type="time"
                            value={appointmentTime}
                            onChange={(e) => setAppointmentTime(e.target.value)}
                            style={{ width: '100%' }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {(hasPlaceholder('ServiceType') || hasPlaceholder('DueAmount') || hasPlaceholder('Amount')) && (
                    <div className="grid-2" style={{ gap: 10 }}>
                      {hasPlaceholder('ServiceType') && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Service Type</label>
                          <input
                            type="text"
                            placeholder="e.g. Marriage Registration"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                          />
                        </div>
                      )}
                      {(hasPlaceholder('DueAmount') || hasPlaceholder('Amount')) && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>{hasPlaceholder('DueAmount') ? 'Due Amount (₹)' : 'Amount (₹)'}</label>
                          <input
                            type="text"
                            placeholder="e.g. 5000"
                            value={dueAmount}
                            onChange={(e) => setDueAmount(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Right Column: Channel, Preview & Send ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Channel Toggle */}
              <div>
                <label>Channel</label>
                <div className="qm-channel-toggle">
                  <button
                    type="button"
                    className={`qm-channel-btn ${channel === 'whatsapp' ? 'active-whatsapp' : ''}`}
                    onClick={() => setChannel('whatsapp')}
                  >
                    <span style={{ fontSize: 18 }}>📱</span> WhatsApp
                  </button>
                  <button
                    type="button"
                    className={`qm-channel-btn ${channel === 'sms' ? 'active-sms' : ''}`}
                    onClick={() => setChannel('sms')}
                  >
                    <span style={{ fontSize: 18 }}>💬</span> SMS
                  </button>
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>Message Preview</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {isManualEdit && (
                      <span className="badge badge-amber" style={{ fontSize: 10, padding: '2px 6px' }}>
                        Manual Edit
                      </span>
                    )}
                    {isManualEdit && selectedTemplate && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ padding: '2px 8px', fontSize: 11 }}
                        onClick={handleRefresh}
                        title="Re-generate from template"
                      >
                        ↻ Reset
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  className="qm-message-textarea"
                  rows={10}
                  placeholder="Select a template or type your message here..."
                  value={currentPreview}
                  onChange={(e) => handleMessageEdit(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <div>
                    {unreplaced.length > 0 && (
                      <span style={{ fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                        ⚠ Unreplaced: {unreplaced.map((p) => `{${p}}`).join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="qm-char-count">
                    {currentPreview.length} chars
                  </span>
                </div>
              </div>

              {/* Send Button */}
              <button
                type="button"
                className={`btn ${canSend ? '' : ''}`}
                disabled={!canSend}
                onClick={handleSend}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px 20px',
                  fontSize: 15,
                  fontWeight: 800,
                  background: canSend
                    ? channel === 'whatsapp' ? '#25D366' : '#818cf8'
                    : 'var(--bg)',
                  color: canSend ? '#fff' : 'var(--text-muted)',
                  border: '2.5px solid var(--border)',
                  boxShadow: canSend ? 'var(--neo-shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {channel === 'whatsapp' ? '📩 Open WhatsApp' : '📩 Open SMS App'}
              </button>

              {!isPhoneValid && phone.length > 0 && (
                <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                  ⚠ Enter a valid phone number (7–15 digits)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
