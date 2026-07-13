import {
  getTemplatesForModule,
  replacePlaceholders,
  getUnreplacedPlaceholders,
  generateMessageUrl,
} from '../messageTemplates';

describe('getTemplatesForModule', () => {
  it('returns global templates plus module-specific ones', () => {
    const templates = getTemplatesForModule('tradeLicenses');
    const ids = templates.map((t) => t.id);
    expect(ids).toContain('payment_reminder');
    expect(ids).toContain('tl_application_submitted');
    expect(ids).toContain('tl_license_approved');
  });

  it('does not include other module templates', () => {
    const templates = getTemplatesForModule('marriages');
    const ids = templates.map((t) => t.id);
    expect(ids).not.toContain('tl_license_approved');
    expect(ids).toContain('mr_application_submitted');
  });
});

describe('replacePlaceholders', () => {
  it('replaces single placeholder', () => {
    const result = replacePlaceholders('Hello {Name}', { Name: 'John' });
    expect(result).toBe('Hello John');
  });

  it('replaces multiple placeholders', () => {
    const result = replacePlaceholders('{Greeting} {Name}', {
      Greeting: 'Hi',
      Name: 'John',
    });
    expect(result).toBe('Hi John');
  });

  it('replaces same placeholder multiple times', () => {
    const result = replacePlaceholders('{X} + {X} = {Y}', {
      X: '1',
      Y: '2',
    });
    expect(result).toBe('1 + 1 = 2');
  });

  it('leaves unreplaced placeholders as-is', () => {
    const result = replacePlaceholders('Hello {Name}', {});
    expect(result).toBe('Hello {Name}');
  });
});

describe('getUnreplacedPlaceholders', () => {
  it('finds all unique placeholders', () => {
    const result = getUnreplacedPlaceholders('{A} {B} {A}');
    expect(result).toEqual(['A', 'B']);
  });

  it('returns empty array when none found', () => {
    const result = getUnreplacedPlaceholders('No placeholders here');
    expect(result).toEqual([]);
  });
});

describe('generateMessageUrl', () => {
  it('generates WhatsApp URL', () => {
    const url = generateMessageUrl('whatsapp', '+91', '9876543210', 'Hello');
    expect(url).toContain('https://api.whatsapp.com/send?phone=919876543210');
    expect(url).toContain('text=Hello');
  });

  it('generates SMS URL', () => {
    const url = generateMessageUrl('sms', '+91', '9876543210', 'Hello');
    expect(url).toContain('sms:+919876543210?body=Hello');
  });

  it('encodes special characters in message', () => {
    const url = generateMessageUrl('whatsapp', '1', '555', 'Hello & Goodbye');
    expect(url).toContain(encodeURIComponent('Hello & Goodbye'));
  });

  it('strips non-digit characters from phone', () => {
    const url = generateMessageUrl('whatsapp', '1', '(555) 123-4567', 'Hi');
    expect(url).toContain('phone=15551234567');
  });
});
