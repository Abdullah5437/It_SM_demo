import { centsToCurrency, currencyToCents, formatCurrency, bpsToPercentage, percentageToBps, calculateTax, generateIdempotencyKey } from '../utils/formatters';

describe('Formatters Utilities', () => {
  describe('centsToCurrency', () => {
    it('should convert cents to currency', () => {
      expect(centsToCurrency(10050)).toBe(100.5);
      expect(centsToCurrency(5000)).toBe(50);
      expect(centsToCurrency(1)).toBe(0.01);
    });
  });

  describe('currencyToCents', () => {
    it('should convert currency to cents', () => {
      expect(currencyToCents(100.5)).toBe(10050);
      expect(currencyToCents(50)).toBe(5000);
      expect(currencyToCents(0.01)).toBe(1);
    });
  });

  describe('formatCurrency', () => {
    it('should format cents as currency string', () => {
      const formatted = formatCurrency(10050, 'EUR');
      expect(formatted).toContain('100.50');
    });

    it('should use default currency EUR', () => {
      const formatted = formatCurrency(5000);
      expect(formatted).toContain('50');
    });
  });

  describe('bpsToPercentage', () => {
    it('should convert basis points to percentage', () => {
      expect(bpsToPercentage(2100)).toBe(21); // 21%
      expect(bpsToPercentage(1000)).toBe(10); // 10%
      expect(bpsToPercentage(50)).toBe(0.5); // 0.5%
    });
  });

  describe('percentageToBps', () => {
    it('should convert percentage to basis points', () => {
      expect(percentageToBps(21)).toBe(2100);
      expect(percentageToBps(10)).toBe(1000);
      expect(percentageToBps(0.5)).toBe(50);
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax amount', () => {
      const subtotal = 10000; // 100 EUR
      const taxRate = 2100; // 21%
      const tax = calculateTax(subtotal, taxRate);

      expect(tax).toBe(2100); // 21 EUR
    });

    it('should round correctly', () => {
      const subtotal = 1000; // 10 EUR
      const taxRate = 333; // 3.33%
      const tax = calculateTax(subtotal, taxRate);

      expect(typeof tax).toBe('number');
      expect(tax).toBeGreaterThan(0);
    });
  });

  describe('generateIdempotencyKey', () => {
    it('should generate unique key from parts', () => {
      const key = generateIdempotencyKey('invoice', '123', 'send-email');
      expect(key).toBe('invoice::123::send-email');
    });

    it('should handle numeric parts', () => {
      const key = generateIdempotencyKey('payment', 456, 'allocate', 789);
      expect(key).toContain('456');
      expect(key).toContain('789');
    });
  });
});
