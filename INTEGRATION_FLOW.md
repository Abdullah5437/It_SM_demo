# Frontend-Backend Integration Flow

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  Pages         Components              State Management     │
│  ├─ users.tsx  ├─ UserForm             ├─ useState()       │
│  ├─ products   ├─ ProductForm          ├─ fetch/axios     │
│  └─...         └─ UI Components        └─ AuthContext     │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP API Calls
        ┌──────────────────────────────────────────┐
        │        API Gateway & Middleware          │
        │  ├─ Authentication (JWT)                 │
        │  ├─ Request Validation                   │
        │  └─ Error Handling                       │
        └──────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express)                        │
├─────────────────────────────────────────────────────────────┤
│  Routes            Controllers      Services     Models     │
│  ├─ POST /users    ├─ createUser   ├─ create  ├─ User    │
│  ├─ GET /users     ├─ getUser      ├─ get     ├─ Product │
│  ├─ PATCH /users   ├─ updateUser   ├─ update  │           │
│  ├─ DELETE /users  ├─ deleteUser   ├─ delete  │           │
│  └─ (products)     └─ ...          └─ list    │           │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌──────────────────────────────────────────┐
        │    Database (MongoDB) + Audit Logs       │
        │    ├─ users collection                   │
        │    ├─ products collection                │
        │    └─ audit logs collection              │
        └──────────────────────────────────────────┘
```

## User Creation Flow

### 1. User Initiates Form Submission
```
┌─────────────────────────────────────────────────────┐
│  UserForm Component (apps/web/src/components/...)  │
│                                                     │
│  1. Form displays with fields:                     │
│     - name, email, password, roles, status        │
│  2. User fills form                                │
│  3. User clicks "Create User"                      │
│  4. Form validation runs client-side              │
│     - Email format                                 │
│     - Password strength (8+ chars)                │
│     - Required fields                              │
└─────────────────────────────────────────────────────┘
                      ↓
```

### 2. API Request
```
POST /api/v1/users
Content-Type: application/json
Authorization: Bearer <admin_jwt_token>

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "roles": ["sales", "support"],
  "status": "active"
}
```

### 3. Backend Processing
```
┌────────────────────────────────────────────────────┐
│  Middleware Chain                                  │
│  1. Authentication Middleware                      │
│     ├─ Extract JWT from Authorization header      │
│     ├─ Verify token signature                     │
│     └─ Check token expiration                     │
│  2. Request Validation                             │
│     ├─ Apply userCreateSchema (Zod)              │
│     ├─ Check all required fields                  │
│     └─ Validate email format                      │
│  3. Authorization Check (requireRole)              │
│     └─ Verify user has 'admin' role              │
└────────────────────────────────────────────────────┘
                      ↓
       ┌──────────────────────────────────┐
       │  UsersController.createUser()    │
       │  ├─ Receive validated data       │
       │  └─ Call usersService            │
       └──────────────────────────────────┘
                      ↓
       ┌──────────────────────────────────┐
       │  UsersService.createUser()       │
       │  1. Check email uniqueness       │
       │  2. Hash password with bcryptjs │
       │  3. Create User document        │
       │  4. Save to MongoDB             │
       │  5. Log audit event             │
       │  6. Return user (no password)   │
       └──────────────────────────────────┘
```

### 4. API Response
```json
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

### 5. Frontend Handles Response
```typescript
// In UserForm component
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(submitData)
    });
    
    if (response.ok) {
      const result = await response.json();
      // Success: result.data contains new user
      setShowForm(false); // Hide form
      // Refresh user list
    } else {
      const error = await response.json();
      // Display error.error message
    }
  } catch (error) {
    // Network error handling
  }
};
```

## Product Creation Flow

Similar to user creation, with hierarchical category handling:

```
Product Form Submission
         ↓
    Form Validation
    (category hierarchy)
         ↓
    POST /api/v1/inventory/products
         ↓
    Controller → Service → Database
         ↓
    Audit Log Entry
         ↓
    Response with Product Data
```

## Database Schema Relationships

```
┌────────────────┐         ┌─────────────────┐
│    User        │         │     Product     │
├────────────────┤         ├─────────────────┤
│ _id (PK)       │         │ _id (PK)        │
│ email (unique) │         │ sku (unique)    │
│ name           │         │ name            │
│ roles[]        │         │ title           │
│ status         │         │ description     │
│ passwordHash   │         │ category        │
│ createdAt      │         │ subcategory     │
│ updatedAt      │         │ subsubcategory  │
│ lastLoginAt    │         │ image           │
└────────────────┘         │ type            │
                           │ pricing...      │
                           │ createdAt       │
                           │ updatedAt       │
                           └─────────────────┘

┌──────────────────────────┐
│   Audit Log Entry        │
├──────────────────────────┤
│ _id                      │
│ action (create/update...)│
│ entity (User/Product)    │
│ entityId                 │
│ userId (who did it)      │
│ changes                  │
│ timestamp                │
└──────────────────────────┘
```

## API Endpoints Summary

### User Management
```
Method   Endpoint               Role Required  Description
────────────────────────────────────────────────────────────
POST     /api/v1/users         admin          Create user
GET      /api/v1/users         admin/accounts List all users
GET      /api/v1/users/:id     admin/self     Get user details
PATCH    /api/v1/users/:id     admin          Update user
DELETE   /api/v1/users/:id     admin          Delete user
PATCH    /api/v1/users/:id/status admin       Change status
```

### Product Management
```
Method   Endpoint                      Role Required    Description
──────────────────────────────────────────────────────────────────
POST     /api/v1/inventory/products    admin/sales      Create product
GET      /api/v1/inventory/products    authenticated    List products
GET      /api/v1/inventory/products/:id authenticated   Get product details
PATCH    /api/v1/inventory/products/:id admin/sales    Update product
DELETE   /api/v1/inventory/products/:id admin           Delete product
```

## Error Handling Flow

```
Form Submission
      ↓
Client-side Validation
├─ PASS → Send to API
└─ FAIL → Show error messages
           (don't send request)
      ↓
Server-side Validation
├─ PASS → Process request
└─ FAIL → Return 400 Bad Request
         {
           "success": false,
           "error": "Email already exists"
         }
      ↓
Business Logic
├─ PASS → Save to DB
└─ FAIL → Return 400 Bad Request
         with specific error
      ↓
Frontend
├─ Error Response → Show in UI
└─ Success → Update state, show confirmation
```

## Authentication Flow

```
┌─────────────────────────────────────┐
│  Login Page (login.tsx)             │
│  Select Role → Login                │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  AuthContext                        │
│  ├─ Stores JWT token               │
│  ├─ Manages user info               │
│  └─ Provides logout method          │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Protected Routes                   │
│  <RequireAuth roles={['admin']}>   │
│    <UserForm />                     │
│  </RequireAuth>                     │
└─────────────────────────────────────┘
           ↓
Each API Request includes:
Authorization: Bearer <jwt_token>
           ↓
Backend authenticates:
├─ Verify JWT signature
├─ Check token expiration
├─ Extract user ID & roles
└─ Verify RBAC permissions
```

## Form Submission - Code Example

### User Form Submission
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Step 1: Client-side validation
  if (!validateForm()) {
    setErrors(newErrors);
    return; // Don't proceed if validation fails
  }

  // Step 2: Prepare data
  const submitData = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    roles: formData.roles,
    status: formData.status,
  };

  // Step 3: Get token from auth context
  const { token } = useAuth();

  // Step 4: Make API request
  try {
    const response = await fetch('/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(submitData)
    });

    // Step 5: Handle response
    if (response.ok) {
      const result = await response.json();
      // Success!
      console.log('User created:', result.data);
      // Show success message
      // Refresh user list
      // Hide form
    } else if (response.status === 400) {
      const error = await response.json();
      // Validation error
      console.error('Validation error:', error.error);
      // Show error in UI
    } else if (response.status === 403) {
      // Permission denied
      console.error('Insufficient permissions');
    } else {
      console.error('Unexpected error');
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

## Testing the Complete Flow

### Step 1: Login as Admin
```bash
curl http://localhost:3000/login
# Select 'admin' role
```

### Step 2: Create User via Form
- Navigate to /users
- Click "Create New User"
- Fill form with:
  - Name: Test User
  - Email: test@example.com
  - Password: TestPassword123
  - Roles: user, sales
  - Status: active
- Click Submit

### Step 3: Verify via API
```bash
curl http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Check Database
```bash
# Connect to MongoDB
db.users.find({ email: "test@example.com" })

# Check audit logs
db.auditlogs.find({ entity: "User" }).sort({ timestamp: -1 })
```

## Performance Considerations

1. **Database Indexing**
   - User: email (unique), status, createdAt
   - Product: sku (unique), status, type, category

2. **Pagination**
   - Use skip/limit for large lists
   - Default: 10 items per page

3. **Caching**
   - Products list could be cached
   - Invalidate on create/update/delete

4. **Query Optimization**
   - Use .lean() in MongoDB queries
   - Select only needed fields in responses

## Security Considerations

1. **Password Security**
   - Hashed with bcryptjs
   - Minimum 8 characters required
   - Never returned in API responses

2. **Token Management**
   - JWT expires in 15 minutes
   - Refresh token for new access token
   - Clear token on logout

3. **RBAC**
   - Admin-only operations protected
   - Sales role for products
   - User-specific operations validated

4. **Input Validation**
   - Zod schemas at shared layer
   - Type-safe request handling
   - Prevent injection attacks

5. **Audit Logging**
   - All mutations logged
   - Track who changed what and when
   - For compliance and debugging
