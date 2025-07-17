import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HowItWorksModal from '@/components/HowItWorksModal';

describe('HowItWorksModal', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open is true', () => {
    render(<HowItWorksModal open={true} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('For Artists')).toBeInTheDocument();
    expect(screen.getByText('For Studios')).toBeInTheDocument();
  });

  it('does not render modal when open is false', () => {
    render(<HowItWorksModal open={false} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.queryByText('How It Works')).not.toBeInTheDocument();
  });

  it('has two tab triggers', () => {
    render(<HowItWorksModal open={true} onOpenChange={mockOnOpenChange} />);
    
    const artistTab = screen.getByText('For Artists');
    const studioTab = screen.getByText('For Studios');
    
    expect(artistTab).toBeInTheDocument();
    expect(studioTab).toBeInTheDocument();
  });

  it('shows artist content by default', () => {
    render(<HowItWorksModal open={true} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.getByText('Getting Started as an Artist')).toBeInTheDocument();
    expect(screen.getByText(/Create Your Profile/)).toBeInTheDocument();
  });

  it('switches to studio content when studio tab is clicked', () => {
    render(<HowItWorksModal open={true} onOpenChange={mockOnOpenChange} />);
    
    const studioTab = screen.getByText('For Studios');
    fireEvent.click(studioTab);
    
    expect(screen.getByText('Getting Started as a Studio')).toBeInTheDocument();
    expect(screen.getByText(/Register Your Studio/)).toBeInTheDocument();
  });

  it('contains all 7 steps for artists', () => {
    render(<HowItWorksModal open={true} onOpenChange={mockOnOpenChange} />);
    
    // Check for all numbered steps 1-7
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  it('contains all 7 steps for studios', () => {
    render(<HowItWorksModal open={true} onOpenChange={mockOnOpenChange} />);
    
    const studioTab = screen.getByText('For Studios');
    fireEvent.click(studioTab);
    
    // Check for all numbered steps 1-7
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });
}); 