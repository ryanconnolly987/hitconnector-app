import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacyPage from '@/app/privacy/page';

describe('Privacy Page', () => {
  it('renders page title correctly', () => {
    render(<PrivacyPage />);
    
    expect(screen.getByText('HitConnector Privacy Policy')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('HitConnector Privacy Policy');
  });

  it('displays effective date information', () => {
    render(<PrivacyPage />);
    
    expect(screen.getByText(/Effective Date:/)).toBeInTheDocument();
    expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
  });

  it('contains all required sections', () => {
    render(<PrivacyPage />);
    
    const expectedSections = [
      'Information We Collect',
      'How We Use Your Information',
      'Information Sharing',
      'Data Security',
      'Data Retention',
      'Your Rights',
      'Cookies and Tracking',
      'Third-Party Links',
      "Children's Privacy",
      'International Users',
      'Updates to This Policy',
      'Contact Us'
    ];

    expectedSections.forEach(section => {
      expect(screen.getByText(new RegExp(section))).toBeInTheDocument();
    });
  });

  it('has contact email link', () => {
    render(<PrivacyPage />);
    
    const emailLink = screen.getByRole('link', { name: /privacy@hitconnector.com/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:privacy@hitconnector.com');
  });

  it('contains numbered sections', () => {
    render(<PrivacyPage />);
    
    // Check for section numbers 1-12
    for (let i = 1; i <= 12; i++) {
      expect(screen.getByText(new RegExp(`${i}\\.`))).toBeInTheDocument();
    }
  });

  it('includes information about personal data collection', () => {
    render(<PrivacyPage />);
    
    expect(screen.getByText(/Name, email address, and phone number/)).toBeInTheDocument();
    expect(screen.getByText(/Payment information/)).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<PrivacyPage />);
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
}); 