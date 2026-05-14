/**
 * Money formatting and conversion utilities
 * All money values are stored as cents (integers) with associated currency
 */

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatMoney(cents: number, currency: string = 'EUR'): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}

export function basisPointsToPercent(bps: number): number {
  return bps / 100;
}

export function percentToBasisPoints(percent: number): number {
  return Math.round(percent * 100);
}

export function calculateTax(amount: number, taxRateBps: number): number {
  return Math.round((amount * taxRateBps) / 10000);
}

export function calculateTotal(subtotal: number, taxAmount: number): number {
  return subtotal + taxAmount;
}

/**
 * Generate unique identifier for idempotency
 */
export function generateIdempotencyKey(...parts: (string | number)[]): string {
  return parts.join('::');
}

// Aliases for backward compatibility
export const centsToCurrency = centsToDollars;
export const currencyToCents = dollarsToCents;
export const formatCurrency = formatMoney;
export const bpsToPercentage = basisPointsToPercent;
export const percentageToBps = percentToBasisPoints;
