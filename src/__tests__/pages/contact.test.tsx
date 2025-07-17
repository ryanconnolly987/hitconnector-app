import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactPage from '@/app/contact/page';

describe('Contact Page', () => {
  it('renders page title correctly', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Contact HitConnector')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Contact HitConnector');
  });

  it('contains all contact email links', () => {
    render(<ContactPage />);
    
    const emailAddresses = [
      'support@hitconnector.com',
      'partnerships@hitconnector.com',
      'tech@hitconnector.com',
      'studios@hitconnector.com',
      'legal@hitconnector.com',
      'privacy@hitconnector.com',
      'hello@hitconnector.com'
    ];

    emailAddresses.forEach(email => {
      const emailLink = screen.getByRole('link', { name: email });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', `mailto:${email}`);
    });
  });

  it('contains all major sections', () => {
    render(<ContactPage />);
    
    const expectedSections = [
      'Get in Touch',
      'Specialized Support',
      'Legal & Privacy',
      'Frequently Asked Questions',
      'Company Information'
    ];

    expectedSections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it('contains FAQ section with questions', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
    expect(screen.getByText('How does booking work?')).toBeInTheDocument();
    expect(screen.getByText('What payment methods do you accept?')).toBeInTheDocument();
    expect(screen.getByText('How do I list my studio?')).toBeInTheDocument();
  });

  it('displays company information', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('HitConnector Inc.')).toBeInTheDocument();
    expect(screen.getByText(/123 Music Row, Los Angeles/)).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<ContactPage />);
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('contains response time information', () => {
    render(<ContactPage />);
    
    expect(screen.getByText(/Within 24 hours/)).toBeInTheDocument();
    expect(screen.getByText(/Within 48 hours/)).toBeInTheDocument();
    expect(screen.getByText(/Within 12 hours/)).toBeInTheDocument();
  });
}); 