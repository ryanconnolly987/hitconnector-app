import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StaticPageShell from '@/components/StaticPageShell';

describe('StaticPageShell', () => {
  it('renders title correctly', () => {
    render(
      <StaticPageShell title="Test Title">
        <p>Test content</p>
      </StaticPageShell>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Title');
  });

  it('renders children correctly', () => {
    render(
      <StaticPageShell title="Test Title">
        <p>Test content paragraph</p>
        <div>Test div content</div>
      </StaticPageShell>
    );
    
    expect(screen.getByText('Test content paragraph')).toBeInTheDocument();
    expect(screen.getByText('Test div content')).toBeInTheDocument();
  });

  it('has correct semantic structure', () => {
    render(
      <StaticPageShell title="Test Title">
        <p>Test content</p>
      </StaticPageShell>
    );
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('container', 'mx-auto', 'max-w-3xl', 'py-16', 'space-y-6');
  });

  it('renders with multiple children elements', () => {
    render(
      <StaticPageShell title="Multiple Children">
        <section data-testid="section-1">Section 1</section>
        <section data-testid="section-2">Section 2</section>
        <section data-testid="section-3">Section 3</section>
      </StaticPageShell>
    );
    
    expect(screen.getByTestId('section-1')).toBeInTheDocument();
    expect(screen.getByTestId('section-2')).toBeInTheDocument();
    expect(screen.getByTestId('section-3')).toBeInTheDocument();
  });
}); 