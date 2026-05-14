export interface SubscriptionBillingJob {
  subscriptionId?: string;
  period?: {
    startDate: Date;
    endDate: Date;
  };
}
