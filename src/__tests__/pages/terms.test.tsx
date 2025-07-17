import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TermsPage from '@/app/terms/page';

describe('Terms Page', () => {
  it('renders page title correctly', () => {
    render(<TermsPage />);
    
    expect(screen.getByText('HitConnector Terms of Service')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('HitConnector Terms of Service');
  });

  it('displays effective date information', () => {
    render(<TermsPage />);
    
    expect(screen.getByText(/Effective Date:/)).toBeInTheDocument();
    expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
  });

  it('contains all required sections', () => {
    render(<TermsPage />);
    
    const expectedSections = [
      'Acceptance of Terms',
      'Use License',
      'User Accounts',
      'Booking and Payment Terms',
      'User Content',
      'Prohibited Uses',
      'Privacy Policy',
      'Termination',
      'Disclaimer',
      'Limitation of Liability',
      'Governing Law',
      'Changes to Terms',
      'Contact Information'
    ];

    expectedSections.forEach(section => {
      expect(screen.getByText(new RegExp(section))).toBeInTheDocument();
    });
  });

  it('has contact email link', () => {
    render(<TermsPage />);
    
    const emailLink = screen.getByRole('link', { name: /legal@hitconnector.com/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:legal@hitconnector.com');
  });

  it('contains numbered sections', () => {
    render(<TermsPage />);
    
    // Check for section numbers 1-13
    for (let i = 1; i <= 13; i++) {
      expect(screen.getByText(new RegExp(`${i}\\.`))).toBeInTheDocument();
    }
  });

  it('has proper semantic structure', () => {
    render(<TermsPage />);
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
}); 