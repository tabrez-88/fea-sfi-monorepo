import { render, screen } from '@testing-library/react';

import HomePage from '../page';

jest.mock('embla-carousel-react', () => ({
  __esModule: true,
  default: () => [
    jest.fn(),
    {
      scrollPrev: jest.fn(),
      scrollNext: jest.fn(),
      scrollTo: jest.fn(),
      canScrollPrev: jest.fn().mockReturnValue(false),
      canScrollNext: jest.fn().mockReturnValue(false),
      selectedScrollSnap: jest.fn().mockReturnValue(0),
      scrollSnapList: jest.fn().mockReturnValue([0]),
      on: jest.fn().mockReturnThis(),
      off: jest.fn(),
    },
  ],
}));

jest.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: () => ({}),
}));

describe('HomePage', () => {
  it('renders the jumbotron heading', () => {
    render(<HomePage />);
    expect(screen.getByText(/the Future of Entertainment/i)).toBeInTheDocument();
  });

  it('displays the why choose FEA section', () => {
    render(<HomePage />);
    expect(screen.getByText(/Why Creator & Bakers Choose FEA/i)).toBeInTheDocument();
  });

  it('displays featured projects section', () => {
    render(<HomePage />);
    expect(screen.getByText('Featured Deals')).toBeInTheDocument();
  });
});
