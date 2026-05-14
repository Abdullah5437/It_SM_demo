export interface ProrationResult {
  creditCents: number;
  adjustmentCents: number;
}

class SubscriptionProrationService {
  calculateProrationCredit(
    oldQuantity: number,
    newQuantity: number,
    oldPrice: number,
    newPrice: number,
    daysUsed: number,
    totalDaysInPeriod: number
  ): ProrationResult {
    const oldPeriodCost = oldQuantity * oldPrice;
    const newPeriodCost = newQuantity * newPrice;

    const oldProRataCents = Math.round((oldPeriodCost * daysUsed) / totalDaysInPeriod);
    const newProRataCents = Math.round((newPeriodCost * daysUsed) / totalDaysInPeriod);

    return {
      creditCents: oldProRataCents,
      adjustmentCents: newProRataCents - oldProRataCents,
    };
  }

  getDaysUsed(startDate: Date, asOfDate: Date = new Date()): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((asOfDate.getTime() - startDate.getTime()) / oneDay));
  }

  getTotalDays(startDate: Date, endDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / oneDay));
  }
}

export default new SubscriptionProrationService();
