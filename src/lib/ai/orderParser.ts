import { logger } from '@/lib/logger';

export interface ParsedOrderItem {
    productName: string;
    quantity: number;
    unit?: string;
}

export interface ParsedOrder {
    items: ParsedOrderItem[];
    rawText: string;
    confidence: number;
    intent: 'ORDER' | 'INQUIRY' | 'UNKNOWN';
}

export class OrderParser {
    /**
     * Parse natural language text into order items
     * Example: "I need 2 burgers and a coke" -> [{product: "burger", quantity: 2}, {product: "coke", quantity: 1}]
     */
    static parseOrderText(text: string): ParsedOrder {
        try {
            if (!text) {
                return { items: [], rawText: '', confidence: 0, intent: 'UNKNOWN' };
            }

            let currentText = text.toLowerCase();
            const items: ParsedOrderItem[] = [];

            // Basic extraction patterns
            // 1. "2 x Product" (explicit)
            // 2. "2 Product" (implicit)
            const quantityPatterns = [
                /(\d+)\s*x\s*([a-z0-9\s]+)/g,
                /(\d+)\s+([a-z0-9\s]+?)(?=$|\s+(?:and|with|plus|\.))/g
            ];

            // Helper to add item and verify
            const addItem = (qty: number, product: string): boolean => {
                const cleanProduct = product.trim();
                // Filter stopwords and single letters (like 'x' if matched wrongly)
                if (['items', 'units', 'pieces'].includes(cleanProduct) || cleanProduct.length < 2) {
                    return false;
                }
                items.push({
                    productName: cleanProduct,
                    quantity: qty
                });
                return true;
            };

            for (const pattern of quantityPatterns) {
                // Reset lastIndex for the new pattern on the (possibly modified) text
                pattern.lastIndex = 0;

                let match;
                // We use a loop but if we modify text, we need to be careful.
                // Approach: Find a match, process it, blank it out, and CONTINUE searching from the same position?
                // Actually if blanked out with spaces, can just continue.

                while ((match = pattern.exec(currentText)) !== null) {
                    const fullMatch = match[0];
                    const qty = parseInt(match[1] || '0');
                    const product = match[2] || '';

                    if (addItem(qty, product)) {
                        // Replace match with spaces to avoid re-matching by subsequent patterns
                        const before = currentText.slice(0, match.index);
                        const after = currentText.slice(match.index + fullMatch.length);
                        const blanks = ' '.repeat(fullMatch.length);
                        currentText = before + blanks + after;

                        // IMPORTANT: Since we modified the string (even if same length, strictly speaking it's a new string), 
                        // verify if regex engine handles it. 
                        // Actually, replacing with spaces ensures we don't match the same digits again.
                        // We do NOT need to reset index if we replaced with same length, 
                        // but if we want to be safe against overlapping patterns matching parts of this match, this works.
                    }
                }
            }

            // Detect intent
            const isOrderIntent = /(want|need|order|buy|get|send)/.test(text.toLowerCase()) || items.length > 0;

            const result: ParsedOrder = {
                items,
                rawText: text,
                confidence: items.length > 0 ? 0.8 : 0.2,
                intent: isOrderIntent ? 'ORDER' : 'INQUIRY'
            };

            logger.info({
                message: 'Parsed natural language order',
                context: {
                    text,
                    itemCount: items.length,
                    intent: result.intent
                }
            });

            return result;

        } catch (error) {
            logger.error({
                message: 'Error parsing order text',
                error: error instanceof Error ? error : new Error(String(error)),
                context: { text }
            });
            return { items: [], rawText: text, confidence: 0, intent: 'UNKNOWN' };
        }
    }
}
