// ── Quick Message — Template Registry & URL Generation ─────────────────────

export type MessageChannel = 'whatsapp' | 'sms';

export type MessageModule =
  | 'general'
  | 'tradeLicenses'
  | 'waterSupplies'
  | 'propertyTaxes'
  | 'marriages'
  | 'birthDeath'
  | 'panCards'
  | 'passports'
  | 'affidavits'
  | 'propertyCards'
  | 'shopAct'
  | 'gazettes'
  | 'voterCards';

export interface MessageTemplate {
  id: string;
  label: string;
  modules: (MessageModule | '*')[];
  body: string;
}

// ── Signature Block ────────────────────────────────────────────────────────
const SIGNATURE = `\nThank you.\nGURAV ONLINE SERVICES`;

// ── Template Registry ──────────────────────────────────────────────────────
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // ── Global Templates (all modules) ───────────────────────────────────────
  {
    id: 'payment_reminder',
    label: 'Payment Reminder',
    modules: ['*'],
    body:
      `Dear {CustomerName},\n\n` +
      `This is a gentle reminder that a payment of ₹{DueAmount} is pending for your {ServiceType} service.\n\n` +
      `Kindly clear the dues at your earliest convenience.\n\n` +
      `Application No: {ApplicationNo}` +
      SIGNATURE,
  },
  {
    id: 'pending_documents',
    label: 'Pending Documents',
    modules: ['*'],
    body:
      `Dear {CustomerName},\n\n` +
      `We require some additional documents for your {ServiceType} application.\n\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please visit our office with the necessary documents at your earliest convenience.` +
      SIGNATURE,
  },
  {
    id: 'visit_office',
    label: 'Visit Office Reminder',
    modules: ['*'],
    body:
      `Dear {CustomerName},\n\n` +
      `Please visit {OfficeName} regarding your recent {ServiceType} application.\n\n` +
      `Application No: {ApplicationNo}` +
      SIGNATURE,
  },

  // ── Trade License Templates ──────────────────────────────────────────────
  {
    id: 'tl_application_submitted',
    label: 'Application Submitted',
    modules: ['tradeLicenses'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Trade License Application has been submitted successfully.\n\n` +
      `Application No: {ApplicationNo}\n` +
      `Service Type: {ServiceType}` +
      SIGNATURE,
  },
  {
    id: 'tl_license_approved',
    label: 'License Approved',
    modules: ['tradeLicenses'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Trade License has been approved.\n\n` +
      `License No: {TradeLicenseNo}\n\n` +
      `Please visit our office to collect your license.` +
      SIGNATURE,
  },
  {
    id: 'tl_renewal_reminder',
    label: 'Renewal Reminder',
    modules: ['tradeLicenses'],
    body:
      `Dear {CustomerName},\n\n` +
      `This is a reminder that your Trade License (No: {TradeLicenseNo}) is due for renewal.\n\n` +
      `Please visit our office or contact us to initiate the renewal process.` +
      SIGNATURE,
  },
  {
    id: 'tl_license_ready',
    label: 'License Ready for Collection',
    modules: ['tradeLicenses'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Trade License is ready for collection.\n\n` +
      `License No: {TradeLicenseNo}\n\n` +
      `Please visit our office to collect it.` +
      SIGNATURE,
  },

  // ── Water Supply Templates ───────────────────────────────────────────────
  {
    id: 'ws_connection_submitted',
    label: 'New Connection Submitted',
    modules: ['waterSupplies'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Water Supply application has been submitted successfully.\n\n` +
      `Application Token: {ApplicationNo}\n` +
      `Service Type: {ServiceType}` +
      SIGNATURE,
  },
  {
    id: 'ws_connection_approved',
    label: 'Connection Approved',
    modules: ['waterSupplies'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Water Supply connection has been approved.\n\n` +
      `Connection No: {ConnectionNo}` +
      SIGNATURE,
  },
  {
    id: 'ws_transfer_completed',
    label: 'Transfer Completed',
    modules: ['waterSupplies'],
    body:
      `Dear {CustomerName},\n\n` +
      `The transfer of your Water Supply connection has been completed successfully.\n\n` +
      `Connection No: {ConnectionNo}` +
      SIGNATURE,
  },
  {
    id: 'ws_inspection_scheduled',
    label: 'Inspection Scheduled',
    modules: ['waterSupplies'],
    body:
      `Dear {CustomerName},\n\n` +
      `A water meter inspection has been scheduled for your connection.\n\n` +
      `Connection No: {ConnectionNo}\n\n` +
      `Please ensure someone is available at the premises.` +
      SIGNATURE,
  },
  {
    id: 'ws_no_dues_ready',
    label: 'No Dues Certificate Ready',
    modules: ['waterSupplies'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Water Supply No Dues Certificate is ready for collection.\n\n` +
      `Connection No: {ConnectionNo}\n\n` +
      `Please visit our office to collect it.` +
      SIGNATURE,
  },

  // ── Property Tax Templates ──────────────────────────────────────────────
  {
    id: 'pt_application_submitted',
    label: 'Application Submitted',
    modules: ['propertyTaxes'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Property Tax application has been submitted successfully.\n\n` +
      `Property Tax No: {PropertyTaxNo}\n` +
      `Service Type: {ServiceType}` +
      SIGNATURE,
  },
  {
    id: 'pt_certificate_ready',
    label: 'Certificate Ready',
    modules: ['propertyTaxes'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Property Tax certificate is ready for collection.\n\n` +
      `Property Tax No: {PropertyTaxNo}\n\n` +
      `Please visit our office to collect it.` +
      SIGNATURE,
  },
  {
    id: 'pt_no_dues_ready',
    label: 'No Dues Certificate Ready',
    modules: ['propertyTaxes'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Property Tax No Dues Certificate is ready.\n\n` +
      `Property Tax No: {PropertyTaxNo}\n\n` +
      `Please visit our office to collect it.` +
      SIGNATURE,
  },

  // ── Marriage Registration Templates ───────────────────────────────────────
  {
    id: 'mr_application_submitted',
    label: 'Application Submitted',
    modules: ['marriages'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Marriage Registration application has been submitted successfully.\n\n` +
      `Application No: {ApplicationNo}\n` +
      `Service Type: {ServiceType}` +
      SIGNATURE,
  },
  {
    id: 'mr_appointment_scheduled',
    label: 'Appointment Scheduled',
    modules: ['marriages'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Marriage Registration appointment has been scheduled.\n\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please visit the KMC office on {AppointmentDate} at {AppointmentTime} with both parties and witnesses.` +
      SIGNATURE,
  },
  {
    id: 'mr_certificate_ready',
    label: 'Certificate Ready',
    modules: ['marriages'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Marriage Certificate is ready for collection.\n\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please visit our office to collect it.` +
      SIGNATURE,
  },
  {
    id: 'mr_appointment_reminder',
    label: 'Appointment Reminder',
    modules: ['marriages'],
    body:
      `Dear {CustomerName},\n\n` +
      `This is a reminder for your upcoming Marriage Registration appointment.\n\n` +
      `Appointment Date: {AppointmentDate}\n` +
      `Appointment Time: {AppointmentTime}\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please visit the KMC office on time with both parties, 3 witnesses, and all required documents.` +
      SIGNATURE,
  },

  // ── Birth/Death Certificate Templates ─────────────────────────────────────
  {
    id: 'bd_application_submitted',
    label: 'Application Submitted',
    modules: ['birthDeath'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Birth/Death Certificate application has been submitted successfully.\n\n` +
      `Application No: {ApplicationNo}\n` +
      `Service Type: {ServiceType}` +
      SIGNATURE,
  },
  {
    id: 'bd_certificate_ready',
    label: 'Certificate Ready',
    modules: ['birthDeath'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Birth/Death Certificate is ready for collection.\n\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please visit our office to collect it.` +
      SIGNATURE,
  },

  // ── PAN Card Templates ────────────────────────────────────────────────────
  {
    id: 'pan_application_submitted',
    label: 'Application Submitted',
    modules: ['panCards'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your PAN Card application has been submitted successfully.\n\n` +
      `Application No: {ApplicationNo}` +
      SIGNATURE,
  },
  {
    id: 'pan_card_ready',
    label: 'PAN Card Ready',
    modules: ['panCards'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your PAN Card has been received at our office.\n\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please visit Gurav Online Services to collect it.` +
      SIGNATURE,
  },

  // ── Passport Templates ────────────────────────────────────────────────────
  {
    id: 'pass_appointment_scheduled',
    label: 'Appointment Scheduled',
    modules: ['passports'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Passport appointment has been scheduled.\n\n` +
      `Appointment Date: {AppointmentDate}\n` +
      `Appointment Time: {AppointmentTime}\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please carry all original documents and visit the Passport Office on time.` +
      SIGNATURE,
  },
  {
    id: 'pass_application_submitted',
    label: 'Application Submitted',
    modules: ['passports'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Passport application has been submitted successfully.\n\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please attend the document verification appointment on time.` +
      SIGNATURE,
  },

  // ── Affidavit Templates ───────────────────────────────────────────────────
  {
    id: 'aff_affidavit_ready',
    label: 'Affidavit Ready',
    modules: ['affidavits'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your affidavit is ready for signing and collection.\n\n` +
      `Service Type: {ServiceType}\n\n` +
      `Please visit Gurav Online Services to sign and collect it.` +
      SIGNATURE,
  },

  // ── Property Card Templates ───────────────────────────────────────────────
  {
    id: 'pc_card_ready',
    label: 'Property Card Ready',
    modules: ['propertyCards'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Property Card has been generated.\n\n` +
      `Service Type: {ServiceType}\n\n` +
      `Please visit our office to collect it.` +
      SIGNATURE,
  },

  // ── Shop Act Templates ────────────────────────────────────────────────────
  {
    id: 'sa_license_ready',
    label: 'Shop Act Ready',
    modules: ['shopAct'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Shop Act License is ready.\n\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please visit our office to collect it.` +
      SIGNATURE,
  },

  // ── Gazette Templates ─────────────────────────────────────────────────────
  {
    id: 'gz_published',
    label: 'Gazette Published',
    modules: ['gazettes'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Gazette notification has been published successfully.\n\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please visit our office to collect your copy.` +
      SIGNATURE,
  },

  // ── Voter Card Templates ──────────────────────────────────────────────────
  {
    id: 'vc_card_ready',
    label: 'Voter Card Ready',
    modules: ['voterCards'],
    body:
      `Dear {CustomerName},\n\n` +
      `Your Voter Card is ready.\n\n` +
      `Application No: {ApplicationNo}\n\n` +
      `Please visit our office to collect it.` +
      SIGNATURE,
  },
  {
    id: 'tl_receipt_shared',
    label: 'Receipt Shared',
    modules: ['tradeLicenses'],
    body:
      `Dear {CustomerName},\n\n` +
      `Please find the link to download/view the receipt for your Trade License ({ServiceType}) service:\n` +
      `{ReceiptUrl}` +
      SIGNATURE,
  },
];

// ── Utility Functions ──────────────────────────────────────────────────────

/**
 * Returns templates relevant to the given module.
 * Includes templates tagged with '*' (global) plus module-specific ones.
 */
export function getTemplatesForModule(module: MessageModule): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter(
    (t) => t.modules.includes('*') || t.modules.includes(module),
  );
}

/**
 * Replaces all `{Placeholder}` tokens in the body with provided values.
 * Unreplaced tokens are left as-is for visibility.
 */
export function replacePlaceholders(
  body: string,
  variables: Record<string, string>,
): string {
  let result = body;
  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }
  return result;
}

/**
 * Returns an array of unreplaced placeholder names in the message.
 */
export function getUnreplacedPlaceholders(message: string): string[] {
  const matches = message.match(/\{[A-Za-z]+\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

/**
 * Generates a WhatsApp or SMS URL with the message pre-filled.
 * Phone should be digits only (no spaces/dashes). CountryCode should include the '+'.
 */
export function generateMessageUrl(
  channel: MessageChannel,
  countryCode: string,
  phone: string,
  message: string,
): string {
  // Strip any non-digit characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  // Strip '+' from country code for wa.me format
  const cleanCode = countryCode.replace(/\+/g, '');
  const encodedMessage = encodeURIComponent(message);

  if (channel === 'whatsapp') {
    return `https://api.whatsapp.com/send?phone=${cleanCode}${cleanPhone}&text=${encodedMessage}`;
  }

  // SMS — use sms: URI scheme
  return `sms:+${cleanCode}${cleanPhone}?body=${encodedMessage}`;
}
