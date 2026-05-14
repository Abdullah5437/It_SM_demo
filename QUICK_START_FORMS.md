# Quick Start Guide - User & Product Forms

## What Was Built

A complete user management system and enhanced product management system with frontend forms and backend APIs.

## File Locations

### Frontend - User Form Component
- **Form Component**: `apps/web/src/components/user_form/form.tsx`
- **Styles**: `apps/web/src/components/user_form/form.module.css`
- **Export**: `apps/web/src/components/user_form/index.ts`

### Frontend - Product Form Component (Updated)
- **Form Component**: `apps/web/src/components/product_form/form.tsx`
- **Styles**: `apps/web/src/components/product_form/form.module.css`

### Frontend - Pages
- **Users Page**: `apps/web/src/pages/users.tsx` (with toggle to show form)
- **Products Page**: `apps/web/src/pages/products.tsx` (displays form)

### Backend - Users Module (New)
- **Controller**: `apps/api/src/modules/users/users.controller.ts`
- **Service**: `apps/api/src/modules/users/users.service.ts`
- **Routes**: `apps/api/src/modules/users/users.routes.ts`
- **Index**: `apps/api/src/modules/users/index.ts`

### Backend - Shared Schemas (New/Updated)
- **User Schema**: `packages/shared/src/schemas/user.schema.ts`
- **Product Schema**: `packages/shared/src/schemas/product.schema.ts` (updated)
- **Schema Exports**: `packages/shared/src/schemas/index.ts` (updated)

### Backend - Models (Updated)
- **Product Model**: `apps/api/src/modules/inventory/product.model.ts` (new fields added)

### Backend - Services & Controllers (Updated)
- **Product Controller**: `apps/api/src/modules/inventory/product.controller.ts` (improved responses)
- **Product Service**: `apps/api/src/modules/inventory/product.service.ts` (pagination)
- **Product Routes**: `apps/api/src/modules/inventory/product.routes.ts` (NextFunction added)

### Backend - Main API
- **Main File**: `apps/api/src/main.ts` (users routes registered)

### Documentation
- **Complete API Doc**: `docs/API_USER_PRODUCT_MANAGEMENT.md`

## How to Test

### 1. Access the Forms in Browser

#### User Form
1. Start the frontend: `npm run dev --workspace=@i-itsm/web`
2. Navigate to: `http://localhost:3000/users`
3. Click "Create New User" button
4. Fill in the form:
   - Name: e.g., "John Doe"
   - Email: e.g., "john@example.com"
   - Password: At least 8 characters
   - Roles: Select one or more roles
   - Status: Choose active/inactive/suspended
5. Click "Create User"

#### Product Form
1. Navigate to: `http://localhost:3000/products`
2. Fill in the form:
   - SKU: e.g., "PROD-001"
   - Name: e.g., "Dell Laptop"
   - Type: Select hardware/software/component/other
   - Category: Select based on type
   - Subcategory: Select based on category
   - Sub-Subcategory: Select from list
   - Sale Price (cents): e.g., 99999
   - Cost (cents): e.g., 60000
   - Image: Upload or leave empty
3. Click "Create Product"

### 2. Test Backend APIs

#### Start Backend
```bash
npm run dev --workspace=@i-itsm/api
```

#### Create User (requires admin token)
```bash
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123",
    "roles": ["user"],
    "status": "active"
  }'
```

#### Create Product (requires admin or sales token)
```bash
curl -X POST http://localhost:3001/api/v1/inventory/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sku": "TEST-001",
    "name": "Test Product",
    "type": "hardware",
    "category": "computers",
    "subcategory": "laptops",
    "subsubcategory": "Laptops",
    "defaultSalePriceCents": 10000,
    "defaultCostCents": 5000,
    "currency": "GBP"
  }'
```

#### List Users
```bash
curl http://localhost:3001/api/v1/users?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### List Products
```bash
curl http://localhost:3001/api/v1/inventory/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Key Features

### User Form Features
- ✅ Email validation
- ✅ Password strength validation (min 8 chars)
- ✅ Password confirmation
- ✅ Multiple role selection with descriptions
- ✅ Status selection
- ✅ Error messages for validation failures
- ✅ Password visibility toggle

### Product Form Features
- ✅ SKU uniqueness (enforced by database)
- ✅ Hierarchical category system
- ✅ Dependent dropdowns (category → subcategory → subsubcategory)
- ✅ Image upload
- ✅ Pricing in cents
- ✅ Inventory tracking options
- ✅ Form validation
- ✅ Error messaging

### Backend API Features
- ✅ CRUD operations for users
- ✅ CRUD operations for products
- ✅ Role-based access control (RBAC)
- ✅ Form validation with Zod schemas
- ✅ Audit logging for all mutations
- ✅ Consistent API response format
- ✅ Pagination support
- ✅ Search/filter capabilities

## Environment Setup

Ensure these are in your `.env` file:
```
# Database
DATABASE_URL=mongodb://localhost:27017/i-itsm

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# URLs
FRONTEND_URL=http://localhost:3000
API_PORT=3001
NODE_ENV=development
```

## API Response Format

All endpoints return consistent JSON responses:

### Success Response
```json
{
  "success": true,
  "data": { /* entity data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description"
}
```

## User Roles & Permissions

### User Creation
- **Required Role**: admin only

### User Management
- **List Users**: admin, accounts
- **View User**: admin or own profile
- **Update User**: admin
- **Delete User**: admin
- **Change Status**: admin

### Product Management
- **Create Product**: admin, sales
- **List Products**: all authenticated users
- **View Product**: all authenticated users
- **Update Product**: admin, sales
- **Delete Product**: admin only

## Database Changes

### New Collections Created
- users (extends from auth module's User model)

### Updated Schema Fields

#### Product Collection
Added fields:
- `title`: String
- `description`: String
- `image`: String
- `category`: String
- `subcategory`: String
- `subsubcategory`: String

## What's Next?

1. **Image Upload**: Implement actual image upload to cloud storage (S3, etc.)
2. **Email Verification**: Add email confirmation flow for user creation
3. **Bulk Operations**: Add bulk user/product import
4. **CSV Export**: Export users/products to CSV
5. **Advanced Search**: Add full-text search for products
6. **Product Variants**: Support product variations/SKUs
7. **Audit Trail UI**: Display audit logs in dashboard
8. **Two-Factor Auth**: Add optional 2FA for admin users

## Troubleshooting

### Form not appearing
- Check that the components are properly imported in the pages
- Verify the CSS module path is correct
- Check browser console for import errors

### API endpoints returning 401
- Ensure you have a valid authentication token
- Check that the token has the required role (admin/sales for products)
- Verify JWT_SECRET in environment matches token generation

### Validation errors
- Check the schema requirements in API documentation
- Email must be unique
- Password must be at least 8 characters
- Product SKU must be unique
- All required fields must be provided

## Support

For detailed API documentation, see: `docs/API_USER_PRODUCT_MANAGEMENT.md`
