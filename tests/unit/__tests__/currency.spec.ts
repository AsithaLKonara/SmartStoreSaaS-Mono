import { convertCurrency, formatCurrency, fetchExchangeRates } from '../../../src/lib/currency';

// Mock global fetch
global.fetch = jest.fn();

describe('Currency Utilities', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        // Default start time
        jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
        (global.fetch as jest.Mock).mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('formatCurrency', () => {
        it('formats LKR correctly', () => {
            expect(formatCurrency(1000, 'LKR')).toMatch(/රු1,000\.00/);
        });

        it('formats USD correctly', () => {
            expect(formatCurrency(50, 'USD')).toBe('$50.00');
        });
    });

    describe('fetchExchangeRates', () => {
        it('fetches rates from API on success', async () => {
            const mockRates = { rates: { LKR: 350, EUR: 0.95 } };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRates,
            });

            const rates = await fetchExchangeRates('USD');
            expect(rates).toEqual(mockRates.rates);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('returns fallback rates on API failure', async () => {
            // Advance time by 2 hours to force cache expiration
            jest.setSystemTime(new Date('2024-01-01T14:00:00Z'));

            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const rates = await fetchExchangeRates('USD');
            expect(rates.LKR).toBe(300); // Check fallback value
            expect(rates.USD).toBe(1);
        });
    });

    describe('convertCurrency', () => {
        it('converts correctly with fetched rates', async () => {
            // Advance time to force refresh
            jest.setSystemTime(new Date('2024-01-02T12:00:00Z'));

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ rates: { LKR: 350, USD: 1 } }),
            });

            const converted = await convertCurrency(10, 'USD', 'LKR');
            // 10 * 350 = 3500
            expect(converted).toBe(3500);
        });

        it('handles same currency conversion', async () => {
            const result = await convertCurrency(100, 'LKR', 'LKR');
            expect(result).toBe(100);
        });
    });
});
