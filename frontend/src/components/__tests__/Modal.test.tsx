import { render, screen, fireEvent } from '@/test/test-utils';
import Modal from '../Modal';

describe('Modal', () => {
  it('renders title and children', () => {
    render(
      <Modal title="Test Title" onClose={vi.fn()}>
        <p>Child content</p>
      </Modal>,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Close Test" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
