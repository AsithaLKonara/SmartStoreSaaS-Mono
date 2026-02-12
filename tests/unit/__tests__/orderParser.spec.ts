import { OrderParser } from '../../../src/lib/ai/orderParser';

describe('OrderParser', () => {
    describe('parseOrderText', () => {
        it('parses simple order with quantity and product', () => {
            const text = 'I want 2 burgers';
            const result = OrderParser.parseOrderText(text);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual({
                productName: 'burgers',
                quantity: 2
            });
            expect(result.intent).toBe('ORDER');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('parses multiple items correctly', () => {
            const text = 'I need 2 burgers and 1 coke';
            const result = OrderParser.parseOrderText(text);

            expect(result.items).toHaveLength(2);
            expect(result.items).toContainEqual({ productName: 'burgers', quantity: 2 });
            expect(result.items).toContainEqual({ productName: 'coke', quantity: 1 });
        });

        it('handles explicit "x" notation', () => {
            const text = '3 x pizza';
            const result = OrderParser.parseOrderText(text);

            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toEqual({ productName: 'pizza', quantity: 3 });
        });

        it('identifies inquiry intent when no quantities found', () => {
            const text = 'Do you have vegan options?';
            const result = OrderParser.parseOrderText(text);

            expect(result.items).toHaveLength(0);
            expect(result.intent).toBe('INQUIRY'); // Assuming basic keyword 'have' triggers inquiry or default fallback
        });

        it('returns empty for empty input', () => {
            const result = OrderParser.parseOrderText('');
            expect(result.items).toHaveLength(0);
            expect(result.intent).toBe('UNKNOWN');
        });
    });
});
