import { render, screen, fireEvent } from '@/test/test-utils';
import NeoSelect from '../NeoSelect';

const options = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
  { value: 'opt3', label: 'Option 3' },
];

describe('NeoSelect', () => {
  it('renders trigger button with placeholder', () => {
    render(<NeoSelect value="" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Select')).toBeInTheDocument();
  });

  it('shows selected option label', () => {
    render(<NeoSelect value="opt2" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<NeoSelect value="" onChange={vi.fn()} options={options} />);
    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('calls onChange and closes when option clicked', () => {
    const onChange = vi.fn();
    render(<NeoSelect value="" onChange={onChange} options={options} />);
    fireEvent.click(screen.getByText('Select'));
    fireEvent.click(screen.getByText('Option 2'));
    expect(onChange).toHaveBeenCalledWith('opt2');
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('filters options when searchable', () => {
    render(<NeoSelect value="" onChange={vi.fn()} options={options} searchable />);
    fireEvent.click(screen.getByText('Select'));
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Option 2' } });
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
  });

  it('shows no matches message when filter has no results', () => {
    render(<NeoSelect value="" onChange={vi.fn()} options={options} searchable />);
    fireEvent.click(screen.getByText('Select'));
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'zzz' } });
    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });

  it('disables the button when disabled prop is true', () => {
    render(<NeoSelect value="" onChange={vi.fn()} options={options} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
