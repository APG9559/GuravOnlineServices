import { render, screen, fireEvent } from '@/test/test-utils';
import ProfileModal from '../ProfileModal';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      isFirstLogin: false,
      avatar: undefined,
    },
    loading: false,
    login: vi.fn(),
    loginWithPasskey: vi.fn(),
    logout: vi.fn(),
    isAdmin: true,
    updateUser: vi.fn(),
  }),
}));

vi.mock('@/api', () => ({
  authApi: {
    updateProfile: vi.fn().mockResolvedValue({
      data: { name: 'Test User', signature: undefined, avatar: undefined },
    }),
  },
}));

describe('ProfileModal', () => {
  it('renders the modal with title and form fields', () => {
    render(<ProfileModal onClose={vi.fn()} />);
    expect(screen.getByText('My Profile & Signature')).toBeInTheDocument();
    expect(screen.getByText('Profile Picture')).toBeInTheDocument();
    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Authorized Signature')).toBeInTheDocument();
  });

  it('renders the user email as disabled input', () => {
    render(<ProfileModal onClose={vi.fn()} />);
    const emailInput = screen.getByDisplayValue('test@example.com') as HTMLInputElement;
    expect(emailInput).toBeDisabled();
  });

  it('switches between draw and upload tabs', () => {
    render(<ProfileModal onClose={vi.fn()} />);
    expect(screen.getByText('✏ Draw Signature')).toBeInTheDocument();
    expect(screen.getByText('📤 Upload PNG Image')).toBeInTheDocument();

    fireEvent.click(screen.getByText('📤 Upload PNG Image'));
    expect(screen.getByText('Select Signature Image')).toBeInTheDocument();

    fireEvent.click(screen.getByText('✏ Draw Signature'));
    expect(screen.getByText('Sign here using mouse or touch screen')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ProfileModal onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button (✕) is clicked', () => {
    const onClose = vi.fn();
    render(<ProfileModal onClose={onClose} />);
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error alert when submitted with empty name', async () => {
    render(<ProfileModal onClose={vi.fn()} />);
    const nameInput = screen.getByPlaceholderText('Your full name');
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Save Profile & Signature'));
    expect(await screen.findByText(/Name is required/)).toBeInTheDocument();
  });

  it('submits successfully and calls onClose', async () => {
    const onClose = vi.fn();
    render(<ProfileModal onClose={onClose} />);
    const nameInput = screen.getByPlaceholderText('Your full name');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByText('Save Profile & Signature'));
    expect(await screen.findByText(/Profile and signature updated/)).toBeInTheDocument();
  });
});
