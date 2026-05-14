# User & Product Management System - API Implementation

## Overview
This document describes the new User Management and Product Management endpoints implemented in the I-ITSM API.

## Frontend Forms

### 1. User Creation Form
Located at: `apps/web/src/components/user_form/form.tsx`

**Features:**
- Full name input
- Email validation
- Password creation with strength requirements (min 8 characters)
- Password confirmation
- Role selection (multiple roles supported)
  - User
  - Sales
  - Support
  - Accounts
  - Admin
- Account status selection (active/inactive/suspended)
- Form validation with error messages
- Password visibility toggle

**Usage:**
The form is integrated into the Users page (`apps/web/src/pages/users.tsx`). Click "Create New User" button to display the form.

### 2. Product Creation Form
Located at: `apps/web/src/components/product_form/form.tsx`

**Features:**
- Product SKU (unique identifier)
- Product Name/Title
- Product Description
- Product Type selector (Hardware, Software, Component, Other)
- Hierarchical Category selection:
  - Main Category
  - Subcategory
  - Sub-Subcategory
- Pricing fields:
  - Sale Price (in cents)
  - Cost Price (in cents)
- Inventory tracking options
- Serial number tracking
- Product image upload
- Form validation with error states

**Usage:**
The form is accessed via the Products page (`apps/web/src/pages/products.tsx`).

## Backend API Endpoints

### User Management Endpoints

#### 1. Create User
```
POST /api/v1/users
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "roles": ["sales", "support"],
  "status": "active"
}

Response (201):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["sales", "support"],
    "status": "active",
    "createdAt": "2026-05-08T10:00:00.000Z",
    "updatedAt": "2026-05-08T10:00:00.000Z"
  }
}
```

#### 2. List Users
```
GET /api/v1/users?page=1&limit=10&status=active&search=john
Authorization: Bearer <admin_token>

Response (200):
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

#### 3. Get User by ID
```
GET /api/v1/users/{userId}
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["sales", "support"],
    "status": "active",
    "lastLoginAt": "2026-05-08T09:30:00.000Z",
    "createdAt": "2026-05-08T10:00:00.000Z",
    "updatedAt": "2026-05-08T10:00:00.000Z"
  }
}
```

#### 4. Update User
```
PATCH /api/v1/users/{userId}
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "roles": ["admin"],
  "status": "active"
}

Response (200):
{
  "success": true,
  "data": { ...updated_user... }
}
```

#### 5. Change User Status
```
PATCH /api/v1/users/{userId}/status
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "status": "suspended"
}

Response (200):
{
  "success": true,
  "data": { ...user_with_new_status... }
}
```

#### 6. Delete User
```
DELETE /api/v1/users/{userId}
Authorization: Bearer <admin_token>

Response (200):
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Product Management Endpoints

#### 1. Create Product
```
POST /api/v1/inventory/products
Content-Type: application/json
Authorization: Bearer <admin_or_sales_token>

{
  "sku": "PROD-001",
  "name": "Dell XPS 13 Laptop",
  "title": "High-Performance Ultrabook",
  "description": "Compact and powerful laptop for professionals",
  "type": "hardware",
  "category": "computers",
  "subcategory": "laptops",
  "subsubcategory": "Laptops",
  "image": "https://example.com/image.jpg",
  "defaultSalePriceCents": 99999,
  "defaultCostCents": 60000,
  "currency": "GBP",
  "trackInventory": true,
  "trackSerial": true,
  "status": "active"
}

Response (201):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "sku": "PROD-001",
    "name": "Dell XPS 13 Laptop",
    "title": "High-Performance Ultrabook",
    "description": "Compact and powerful laptop for professionals",
    "type": "hardware",
    "category": "computers",
    "subcategory": "laptops",
    "subsubcategory": "Laptops",
    "image": "https://example.com/image.jpg",
    "defaultSalePriceCents": 99999,
    "defaultCostCents": 60000,
    "currency": "GBP",
    "trackInventory": true,
    "trackSerial": true,
    "status": "active",
    "createdAt": "2026-05-08T10:00:00.000Z",
    "updatedAt": "2026-05-08T10:00:00.000Z"
  }
}
```

#### 2. List Products
```
GET /api/v1/inventory/products?skip=0&limit=10&status=active&type=hardware
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [...],
  "pagination": {
    "skip": 0,
    "limit": 10,
    "total": 45
  }
}
```

#### 3. Get Product by ID
```
GET /api/v1/inventory/products/{productId}
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": { ...product... }
}
```

#### 4. Update Product
```
PATCH /api/v1/inventory/products/{productId}
Content-Type: application/json
Authorization: Bearer <admin_or_sales_token>

{
  "name": "Updated Product Name",
  "defaultSalePriceCents": 120000,
  "status": "inactive"
}

Response (200):
{
  "success": true,
  "data": { ...updated_product... }
}
```

#### 5. Delete Product
```
DELETE /api/v1/inventory/products/{productId}
Authorization: Bearer <admin_token>

Response (200):
{
  "success": true,
  "message": "Product deleted successfully"
}
```

## Validation Rules

### User Creation
- **name**: Required, 2-255 characters
- **email**: Required, valid email format, must be unique
- **password**: Required, minimum 8 characters
- **roles**: Array of enum values (admin, accounts, support, sales, user)
- **status**: Enum (active, inactive, suspended), defaults to 'active'

### Product Creation
- **sku**: Required, unique string identifier
- **name**: Required, minimum 1 character
- **type**: Required, enum (hardware, software, component, other)
- **defaultSalePriceCents**: Required, non-negative integer
- **defaultCostCents**: Required, non-negative integer
- **currency**: Required, 3-character code
- **title**: Optional string
- **description**: Optional string
- **image**: Optional URL string
- **category**: Optional string
- **subcategory**: Optional string
- **subsubcategory**: Optional string
- **trackInventory**: Boolean, defaults to true
- **trackSerial**: Boolean, defaults to false
- **status**: Enum (active, inactive, discontinued), defaults to 'active'

## Database Schema Updates

### User Model (apps/api/src/modules/auth/auth.model.ts)
- Existing fields maintained
- Password hashing implemented with bcryptjs
- Timestamp tracking (createdAt, updatedAt)
- Role-based access control (RBAC)

### Product Model (apps/api/src/modules/inventory/product.model.ts)
New fields added:
- `title`: String (product title/name variant)
- `description`: String (detailed product information)
- `image`: String (image URL)
- `category`: String (main category)
- `subcategory`: String (secondary category)
- `subsubcategory`: String (tertiary category)

## Authentication & Authorization

### User Creation & Management
- Only **admin** role can create/delete users
- Only **admin** and **accounts** roles can list all users
- Users can view their own profile
- Admin only can change status and roles

### Product Management
- **admin** and **sales** roles can create/update products
- **admin** only can delete products
- All authenticated users can list/view products

## Running the Application

### Start the Backend
```bash
# From the workspace root
npm run dev

# Or with specific package
npm run dev --workspace=@i-itsm/api
```

### Start the Frontend
```bash
# From the workspace root
npm run dev --workspace=@i-itsm/web
```

### Environment Variables Required
Ensure these are set in `.env`:
```
DATABASE_URL=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:3000
API_PORT=3001
```

## File Structure

```
apps/api/src/modules/users/
├── users.controller.ts   # HTTP request handlers
├── users.service.ts      # Business logic
├── users.routes.ts       # Route definitions
└── index.ts             # Module exports

apps/web/src/components/
├── user_form/
│   ├── form.tsx         # User creation form
│   ├── form.module.css  # Styles
│   └── index.ts         # Exports
└── product_form/
    ├── form.tsx         # Product creation form
    ├── form.module.css  # Styles
    └── index.ts         # Exports

packages/shared/src/schemas/
├── user.schema.ts       # User validation schemas
└── product.schema.ts    # Product validation schemas
```

## Testing the APIs

### Using curl
```bash
# Create a user
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123",
    "roles": ["user"],
    "status": "active"
  }'

# Create a product
curl -X POST http://localhost:3001/api/v1/inventory/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sku": "TEST-001",
    "name": "Test Product",
    "type": "hardware",
    "defaultSalePriceCents": 10000,
    "defaultCostCents": 5000,
    "currency": "GBP",
    "category": "computers",
    "subcategory": "laptops",
    "subsubcategory": "Laptops"
  }'
```

## Audit Logging
All user and product mutations are logged with:
- Action type (create, update, delete)
- Entity type
- Entity ID
- Timestamp
- User who performed the action

## Error Handling
All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- 201: Created successfully
- 200: Success
- 400: Bad request (validation error)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 500: Server error

## Next Steps
1. Test the forms in the UI
2. Test API endpoints with sample data
3. Implement file upload for product images
4. Add pagination to frontend tables
5. Add search/filter functionality to lists
