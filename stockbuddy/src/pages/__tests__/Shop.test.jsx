import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Shop from '../Shop';

// vi.mock is hoisted above this declaration, so mockApi must be hoisted too.
const mockApi = vi.hoisted(() => ({
  getShopItems: vi.fn().mockResolvedValue({
    items: [
      {
        id: 1,
        name: 'Test Booster',
        description: 'Boost your XP earnings',
        type: 'booster',
        price: 200,
        icon: '⚡',
        rarity: 'rare',
        effect: {
          type: 'xp_multiplier',
          multiplier: 1.5,
          lessonsRemaining: 3
        }
      }
    ]
  }),
  getPurchases: vi.fn().mockResolvedValue({ purchases: [] }),
  getUserData: vi.fn().mockResolvedValue({
    user: {
      learningProgress: {
        coins: 500
      }
    }
  }),
  purchaseItem: vi.fn(),
  addTestCoins: vi.fn().mockResolvedValue({ success: true, newBalance: 600 })
}));

vi.mock('../../services/api', () => ({
  api: mockApi
}));

describe('Shop page', () => {
  beforeEach(() => {
    window.alert = vi.fn();
  });

  it('displays user coin balance and available shop items', async () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Shop/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/500 Coins/)).toBeInTheDocument();
    expect(screen.getByText('Test Booster')).toBeInTheDocument();
    expect(mockApi.getShopItems).toHaveBeenCalled();
    expect(mockApi.getPurchases).toHaveBeenCalled();
    expect(mockApi.getUserData).toHaveBeenCalled();
  });
});

