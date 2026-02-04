import { render, screen } from '@testing-library/react';

import HomePage from '../page';

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SFI-FEA');
  });

  it('displays system status section', () => {
    render(<HomePage />);
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Frontend: Running')).toBeInTheDocument();
  });

  it('displays quick links section', () => {
    render(<HomePage />);
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
  });
});
