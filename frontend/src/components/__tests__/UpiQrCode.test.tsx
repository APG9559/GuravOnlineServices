import { render, screen } from '@/test/test-utils';
import UpiQrCode from '../UpiQrCode';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fake'),
  },
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fake'),
}));

const defaultProps = {
  upiId: 'test@upi',
  payeeName: 'Test Payee',
  amount: 100,
  transactionRef: 'REF001',
  transactionNote: 'Test payment',
};

describe('UpiQrCode', () => {
  it('shows placeholder when upiId is empty', () => {
    render(<UpiQrCode {...defaultProps} upiId="" />);
    expect(screen.getByText(/select\/specify a target UPI ID/i)).toBeInTheDocument();
  });

  it('shows placeholder when amount is zero', () => {
    render(<UpiQrCode {...defaultProps} amount={0} />);
    expect(screen.getByText(/enter a payment amount greater/i)).toBeInTheDocument();
  });

  it('shows placeholder when amount is negative', () => {
    render(<UpiQrCode {...defaultProps} amount={-5} />);
    expect(screen.getByText(/enter a payment amount greater/i)).toBeInTheDocument();
  });

  it('renders scan to pay container with amount and payee', () => {
    render(<UpiQrCode {...defaultProps} />);
    expect(screen.getByText('Scan to Pay')).toBeInTheDocument();
    expect(screen.getByText(/Test Payee/)).toBeInTheDocument();
    expect(screen.getByText(/₹100\.00/)).toBeInTheDocument();
    expect(screen.getByText(/REF001/)).toBeInTheDocument();
  });

  it('renders Scan to Pay section', () => {
    render(<UpiQrCode {...defaultProps} />);
    expect(screen.getByText('Scan to Pay')).toBeInTheDocument();
    expect(screen.getByText(/Test Payee/)).toBeInTheDocument();
    expect(screen.getByText(/UPI ID/)).toBeInTheDocument();
    expect(screen.getByText(/REF001/)).toBeInTheDocument();
  });
});
