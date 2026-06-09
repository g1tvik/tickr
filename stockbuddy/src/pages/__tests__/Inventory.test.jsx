import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Inventory from '../Inventory';

vi.mock('../../services/api', () => ({
  api: {
    getUserData: vi.fn().mockResolvedValue({
      purchasedItems: [],
      skipTokens: 2,
      streakFreezes: 1,
      learningProgress: { xp: 150, coins: 450 },
      activeEffects: {}
    }),
    getActiveEffects: vi.fn().mockResolvedValue({ success: true, activeEffects: {} }),
    useInventoryItem: vi.fn()
  }
}));

describe('Inventory page', () => {
  it('renders inventory stats from API response', async () => {
    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Inventory/i })).toBeInTheDocument();
    });

    // The value and label live in sibling divs inside a shared stat group.
    const skipTokensStat = screen.getByText('Skip Tokens').closest('div').parentElement;
    expect(skipTokensStat).toHaveTextContent('2');
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });
});

