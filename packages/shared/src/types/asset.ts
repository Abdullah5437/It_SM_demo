import { Document } from 'mongoose';

// Asset Types
export interface ClientAssetPurchase {
    invoiceId?: string;
    invoiceLineId?: string;
}

export interface ClientAsset extends Document {
    clientId: string;
    clientSiteId?: string;
    productId: string;
    serializedItemId?: string;
    assetTag: string;
    status: 'active' | 'replaced' | 'returned' | 'retired';
    warrantyStart: Date;
    warrantyEnd: Date;
    purchase?: ClientAssetPurchase;
    createdBy?: string;
    createdAt: Date;
}

// Asset Query Types
export interface ClientAssetFilters {
    clientId?: string;
    clientSiteId?: string;
    productId?: string;
    status?: string;
    warrantyEndBefore?: Date;
    warrantyEndAfter?: Date;
}

// Asset Analytics Types
export interface AssetAudit {
    assetId: string;
    action: 'created' | 'updated' | 'retired' | 'returned';
    previousStatus?: string;
    newStatus: string;
    changedBy: string;
    changedAt: Date;
    changeReason?: string;
}

export interface WarrantyStatus {
    assetId: string;
    assetTag: string;
    productName: string;
    warrantyStart: Date;
    warrantyEnd: Date;
    daysRemaining: number;
    isExpired: boolean;
    expiringWithin30Days: boolean;
}

export interface ClientAssetSummary {
    clientId: string;
    totalAssets: number;
    activeAssets: number;
    retiredAssets: number;
    expiredWarrantyCount: number;
    expiringWithin30Days: number;
    totalAssetValue: number;
}
