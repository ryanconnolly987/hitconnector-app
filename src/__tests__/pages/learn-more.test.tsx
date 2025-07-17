import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LearnMorePage from '@/app/learn-more/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Learn More Page', () => {
  it('renders page title correctly', () => {
    render(<LearnMorePage />);
    
    expect(screen.getByText('Learn More About HitConnector')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Learn More About HitConnector');
  });

  it('renders subtitle correctly', () => {
    render(<LearnMorePage />);
    
    expect(screen.getByText(/Your One‑Stop Platform for Booking/)).toBeInTheDocument();
  });

  it('contains key sections for artists and studios', () => {
    render(<LearnMorePage />);
    
    expect(screen.getByText(/For Artists:/)).toBeInTheDocument();
    expect(screen.getByText(/For Studios:/)).toBeInTheDocument();
    expect(screen.getByText(/Why Choose HitConnector/)).toBeInTheDocument();
  });

  it('has Sign Up button with correct link', () => {
    render(<LearnMorePage />);
    
    const signUpButton = screen.getByRole('link', { name: /Sign Up/i });
    expect(signUpButton).toBeInTheDocument();
    expect(signUpButton).toHaveAttribute('href', '/signup');
  });

  it('has Back to Home button with correct link', () => {
    render(<LearnMorePage />);
    
    const backButton = screen.getByRole('link', { name: /Back to Home/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', '/');
  });

  it('contains comprehensive content about the platform', () => {
    render(<LearnMorePage />);
    
    expect(screen.getByText(/HitConnector is revolutionizing/)).toBeInTheDocument();
    expect(screen.getByText(/Join the growing community/)).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<LearnMorePage />);
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('container', 'mx-auto', 'max-w-3xl');
  });
}); 