import { render, screen, fireEvent } from '@/test/test-utils';
import SuccessModal from '../SuccessModal';

describe('SuccessModal', () => {
  const defaultProps = {
    title: 'Success!',
    customerName: 'John Doe',
    onClose: vi.fn(),
    onPrint: vi.fn(),
  };

  it('renders title and customer name', () => {
    render(<SuccessModal {...defaultProps} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it('fires onPrint and onClose when print button clicked', () => {
    const onPrint = vi.fn();
    const onClose = vi.fn();
    render(<SuccessModal {...defaultProps} onPrint={onPrint} onClose={onClose} />);
    fireEvent.click(screen.getByText('🖨 Print Receipt'));
    expect(onPrint).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onShare and onClose when share button clicked', () => {
    const onShare = vi.fn();
    const onClose = vi.fn();
    render(<SuccessModal {...defaultProps} onShare={onShare} onClose={onClose} />);
    fireEvent.click(screen.getByText('💬 Share'));
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<SuccessModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render share button when onShare is not provided', () => {
    render(<SuccessModal {...defaultProps} />);
    expect(screen.queryByText('💬 Share')).not.toBeInTheDocument();
  });
});
