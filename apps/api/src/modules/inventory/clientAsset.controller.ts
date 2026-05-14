import { Request, Response } from 'express';
import clientAssetService from './clientAsset.service';

export class ClientAssetController {
    // Create client asset
    async createClientAsset(req: Request, res: Response): Promise<void> {
        try {
            const asset = await clientAssetService.createClientAsset(req.body);
            // attach user and ip for audit consistency
            asset.createdBy = req.user?.userId || asset.createdBy;
            res.status(201).send(asset);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    // Get client asset by ID
    async getClientAsset(req: Request, res: Response): Promise<void> {
        try {
            const asset = await clientAssetService.getClientAssetById(req.params.id);
            if (!asset) {
                res.status(404).send({ message: 'Client asset not found' });
                return;
            }
            res.send(asset);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // List client assets
    async listClientAssets(req: Request, res: Response): Promise<void> {
        try {
            const assets = await clientAssetService.listClientAssets(req.query);
            res.send(assets);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // Update client asset
    async updateClientAsset(req: Request, res: Response): Promise<void> {
        try {
            const asset = await clientAssetService.updateClientAsset(req.params.id, req.body);
            if (!asset) {
                res.status(404).send({ message: 'Client asset not found' });
                return;
            }
            res.send(asset);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    // Retire asset
    async retireAsset(req: Request, res: Response): Promise<void> {
        try {
            const asset = await clientAssetService.retireAsset(req.params.id, req.ip);
            if (!asset) {
                res.status(404).send({ message: 'Client asset not found' });
                return;
            }
            res.send(asset);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    // Return asset
    async returnAsset(req: Request, res: Response): Promise<void> {
        try {
            const { warehouseId } = req.body;
            const asset = await clientAssetService.returnAsset(req.params.id, warehouseId, req.ip);
            if (!asset) {
                res.status(404).send({ message: 'Client asset not found' });
                return;
            }
            res.send(asset);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    // Get expiring warranties
    async getExpiringWarranties(req: Request, res: Response): Promise<void> {
        try {
            const daysAhead = parseInt(req.query.daysAhead as string) || 30;
            const assets = await clientAssetService.getExpiringWarranties(daysAhead);
            res.send(assets);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // Get client asset summary
    async getClientAssetSummary(req: Request, res: Response): Promise<void> {
        try {
            const { clientId } = req.params;
            if (!clientId) {
                res.status(400).send({ message: 'clientId is required' });
                return;
            }
            const summary = await clientAssetService.getClientAssetSummary(clientId);
            res.send(summary);
        } catch (error) {
            res.status(500).send(error);
        }
    }
}

export default new ClientAssetController();
