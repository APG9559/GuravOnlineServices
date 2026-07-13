import { render, screen, fireEvent } from '@/test/test-utils';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal', () => {
  it('returns null when show is false', () => {
    const { container } = render(<ConfirmModal show={false} title="Test" message="Hello" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when show is true', () => {
    render(<ConfirmModal show={true} title="Confirm Delete" message="Are you sure?" />);
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons by default', () => {
    render(<ConfirmModal show={true} title="Test" message="Message" onConfirm={vi.fn()} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('fires onConfirm and onCancel when confirm clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        show={true}
        title="Test"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('fires onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        show={true}
        title="Test"
        message="Message"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('hides cancel button when hideCancel is true', () => {
    render(
      <ConfirmModal
        show={true}
        title="Test"
        message="Message"
        onConfirm={vi.fn()}
        hideCancel={true}
      />,
    );
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('shows Okay button when onConfirm is not provided', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal show={true} title="Test" message="Message" onCancel={onCancel} />);
    expect(screen.getByText('Okay')).toBeInTheDocument();
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Okay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders icon when provided', () => {
    render(<ConfirmModal show={true} title="Test" message="Message" icon={<span>⚠️</span>} />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});
