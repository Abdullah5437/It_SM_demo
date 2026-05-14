import { Request, Response } from 'express';
import serializedItemService from './serializedItem.service';

export class SerializedItemController {
    // Create serialized item
    async createSerializedItem(req: Request, res: Response): Promise<void> {
        try {
            const item = await serializedItemService.createSerializedItem(req.body);
            res.status(201).send(item);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    // Get serialized item by ID
    async getSerializedItem(req: Request, res: Response): Promise<void> {
        try {
            const item = await serializedItemService.getSerializedItemById(req.params.id);
            if (!item) {
                res.status(404).send({ message: 'Serialized item not found' });
                return;
            }
            res.send(item);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // List serialized items
    async listSerializedItems(req: Request, res: Response): Promise<void> {
        try {
            const items = await serializedItemService.listSerializedItems(req.query);
            res.send(items);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // Update serialized item
    async updateSerializedItem(req: Request, res: Response): Promise<void> {
        try {
            const item = await serializedItemService.updateSerializedItem(req.params.id, req.body);
            if (!item) {
                res.status(404).send({ message: 'Serialized item not found' });
                return;
            }
            res.send(item);
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export default new SerializedItemController();
