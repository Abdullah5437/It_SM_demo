import { Request, Response } from 'express';
import subscriptionService from './subscription.service';
import logger from '../../utils/logger';

class SubscriptionController {
  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, clientSiteId, servicePlanId, quantity, unitPriceCents, addonItems, startDate, notes, currency } = req.body;

      const subscription = await subscriptionService.createSubscription(
        {
        clientId,
        clientSiteId,
        servicePlanId,
        quantity,
        unitPriceCents,
        addonItems,
        startDate: new Date(startDate),
        notes,
        currency,
        },
        req.user?.userId,
        req.ip
      );

      logger.info({ subscriptionId: subscription._id }, 'Subscription created');

      res.status(201).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      logger.error({ error }, 'Error creating subscription');
      throw error;
    }
  }

  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const subscription = await subscriptionService.getSubscription(id);

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      logger.error({ error }, 'Error fetching subscription');
      throw error;
    }
  }

  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, unitPriceCents, addonItems, notes } = req.body;

      const subscription = await subscriptionService.updateSubscription(
        id,
        {
          quantity,
          unitPriceCents,
          addonItems,
          notes,
        },
        req.user?.userId,
        req.ip
      );

      logger.info({ subscriptionId: id }, 'Subscription updated');

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      logger.error({ error }, 'Error updating subscription');
      throw error;
    }
  }

  async pauseSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const subscription = await subscriptionService.pauseSubscription(
        id,
        req.user?.userId,
        req.ip
      );

      logger.info({ subscriptionId: id }, 'Subscription paused');

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      logger.error({ error }, 'Error pausing subscription');
      throw error;
    }
  }

  async resumeSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const subscription = await subscriptionService.resumeSubscription(
        id,
        req.user?.userId,
        req.ip
      );

      logger.info({ subscriptionId: id }, 'Subscription resumed');

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      logger.error({ error }, 'Error resuming subscription');
      throw error;
    }
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const subscription = await subscriptionService.cancelSubscription(
        id,
        req.user?.userId,
        req.ip
      );

      logger.info({ subscriptionId: id }, 'Subscription cancelled');

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      logger.error({ error }, 'Error cancelling subscription');
      throw error;
    }
  }

  async listSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, status, limit, skip } = req.query;

      const subscriptions = await subscriptionService.listSubscriptions({
        clientId: clientId as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : 50,
        skip: skip ? parseInt(skip as string) : 0,
      });

      res.status(200).json({
        success: true,
        data: subscriptions,
      });
    } catch (error) {
      logger.error({ error }, 'Error listing subscriptions');
      throw error;
    }
  }

  async getSubscriptionSummary(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;

      const summary = await subscriptionService.getSubscriptionSummary(clientId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error({ error }, 'Error fetching subscription summary');
      throw error;
    }
  }
}

export default new SubscriptionController();
