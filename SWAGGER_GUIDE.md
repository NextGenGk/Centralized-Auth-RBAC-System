# Auth RBAC System - Complete Swagger API Guide

## 📖 Table of Contents

1. [System Overview](#-system-overview)
2. [What is Swagger?](#-what-is-swagger)
3. [Architecture](#-architecture)
4. [Getting Started](#-getting-started)
5. [Authentication Flow](#-authentication-flow)
6. [Auth Service API](#-auth-service-api-localhost3001)
7. [Orders Service API](#-orders-service-api-localhost3002)
8. [RBAC Permissions](#-rbac-permissions)
9. [Complete User Journey (Start to Finish)](#-complete-user-journey-start-to-finish)
10. [Step-by-Step Tutorials](#-step-by-step-tutorials)
11. [Complete API Testing Flow](#-complete-api-testing-flow-all-endpoints)
12. [Troubleshooting](#-troubleshooting)

---

## 📖 System Overview

### What is this system?

The **Auth RBAC System** is a microservices-based authentication and authorization platform that provides:

- **Centralized Authentication** - Single sign-on (SSO) using JWT tokens
- **Role-Based Access Control (RBAC)** - Fine-grained permission management
- **Multi-Service Architecture** - Auth service + protected resource services

### Key Concepts

| Concept | Description |
|---------|-------------|
| **JWT (JSON Web Token)** | A secure token that contains user identity and permissions. Used to authenticate API requests. |
| **Access Token** | Short-lived token (15 min) used for API calls. Include in `Authorization` header. |
| **Refresh Token** | Long-lived token (7 days) used to get new access tokens without re-login. |
| **Role** | A named group of permissions (e.g., "admin", "manager", "user"). |
| **Permission** | A specific action on a resource (e.g., "orders:read", "orders:delete"). |
| **RBAC** | Role-Based Access Control - users get permissions through their assigned roles. |

---

## 🔧 What is Swagger?

**Swagger (OpenAPI)** is an interactive API documentation tool that allows you to:

✅ **Browse** - See all available API endpoints in one place  
✅ **Understand** - View request/response schemas and examples  
✅ **Test** - Execute API calls directly from your browser  
✅ **Debug** - See actual HTTP requests and responses  

### Why use Swagger instead of Postman?

| Feature | Swagger | Postman |
|---------|---------|---------|
| Setup required | None (browser only) | Install app |
| Documentation | Auto-generated | Manual |
| Learning curve | Very easy | Moderate |
| Collaboration | Share URL | Export/Import |
| Offline use | ❌ | ✅ |
| Advanced features | Basic | Advanced |

**Recommendation:** Use Swagger for quick testing and learning the API. Use Postman for complex workflows and automation.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser/App)                    │
└─────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│      AUTH SERVICE           │    │     ORDERS SERVICE          │
│      localhost:3001         │    │     localhost:3002          │
├─────────────────────────────┤    ├─────────────────────────────┤
│ • User Registration         │    │ • List Orders               │
│ • Login / Logout            │    │ • Create Order              │
│ • Token Management          │    │ • Update Order              │
│ • User Management (Admin)   │    │ • Delete Order              │
│ • Role Management (Admin)   │    │                             │
│ • Permission Management     │    │ Validates JWT tokens from   │
│ • Audit Logs                │    │ Auth Service                │
└─────────────────────────────┘    └─────────────────────────────┘
              │                                  │
              ▼                                  │
┌─────────────────────────────┐                  │
│        PostgreSQL           │                  │
│   (Users, Roles, Perms)     │                  │
└─────────────────────────────┘                  │
              │                                  │
              ▼                                  │
┌─────────────────────────────┐                  │
│          Redis              │◄─────────────────┘
│   (Token Blacklist/Cache)   │
└─────────────────────────────┘
```

### How Authentication Works

1. **User logs in** → Auth Service validates credentials → Returns JWT tokens
2. **User makes API request** → Includes access token in header
3. **Orders Service** → Validates token using Auth Service's public key
4. **If valid** → Checks user permissions → Allows/Denies request

---

## 🚀 Getting Started

### Prerequisites

Make sure the services are running:

```bash
docker-compose up --build
```

### Swagger UI URLs

| Service | Swagger URL | Description |
|---------|-------------|-------------|
| **Auth Service** | http://localhost:3001/api-docs | Authentication, Users, Roles, Permissions |
| **Orders Service** | http://localhost:3002/api-docs | Order management (CRUD operations) |

### Health Check URLs

| Service | Health URL | Expected Response |
|---------|------------|-------------------|
| Auth Service | http://localhost:3001/health | `{"status":"ok"}` |
| Orders Service | http://localhost:3002/health | `{"status":"ok"}` |

---

## 🔐 Authentication Flow

### Step 1: Login to Get Access Token

1. Open **Auth Service Swagger**: http://localhost:3001/api-docs
2. Expand **POST /auth/login**
3. Click **"Try it out"**
4. Enter credentials:
```json
{
  "email": "admin@example.com",
  "password": "Admin@1234"
}
```
5. Click **"Execute"**
6. Copy the `accessToken` from the response

### Step 2: Authorize Swagger UI

1. Click the **"Authorize"** button (green lock icon, top-right)
2. Enter: `Bearer <your-access-token>`
3. Click **"Authorize"** then **"Close"**

Now all protected endpoints will include your JWT automatically!

---

## 👥 Test Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | `admin@example.com` | `Admin@1234` | Full access to everything |
| Manager | `manager@example.com` | `Manager@1234` | orders:read, orders:write, orders:delete, reports:read |
| User | `user@example.com` | `User@1234` | orders:read only |

---

## 📚 Auth Service API (`localhost:3001`)

### Auth Endpoints (Public)

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "MyPassword@123"
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "isActive": true,
    "createdAt": "2026-04-21T00:00:00.000Z",
    "roles": ["user"]
  }
}
```

---

#### POST /auth/login
Login and receive JWT tokens.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@1234"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
  }
}
```

---

#### POST /auth/refresh
Get new tokens using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

---

#### GET /auth/public-key
Get the RSA public key for token verification (used by other services).

---

### Auth Endpoints (Protected - requires JWT)

#### POST /auth/logout
Revoke both access and refresh tokens.

**Headers:** `Authorization: Bearer <accessToken>`

---

#### GET /auth/me
Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "admin@example.com",
    "isActive": true,
    "createdAt": "2026-04-21T00:00:00.000Z",
    "roles": ["admin"]
  }
}
```

---

### Admin Endpoints (Admin role required)

#### GET /admin/users
List all users (paginated).

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)

---

#### POST /admin/users/{userId}/roles
Assign a role to a user.

**Path Parameter:** `userId` (UUID)

**Request Body:**
```json
{
  "roleId": "uuid-of-role"
}
```

---

#### PATCH /admin/users/{userId}/status
Enable or disable a user account.

**Request Body:**
```json
{
  "isActive": false
}
```

---

#### GET /admin/roles
List all roles with their permissions.

---

#### POST /admin/roles
Create a new role.

**Request Body:**
```json
{
  "name": "analyst",
  "description": "Read-only analyst role"
}
```

---

#### POST /admin/roles/{roleId}/permissions
Assign a permission to a role.

**Request Body:**
```json
{
  "permissionId": "uuid-of-permission"
}
```

---

#### GET /admin/permissions
List all permissions.

---

#### POST /admin/permissions
Create a new permission.

**Request Body:**
```json
{
  "resource": "invoices",
  "action": "read"
}
```

**Valid actions:** `read`, `write`, `delete`, `manage`

---

#### GET /admin/audit-logs
Retrieve audit logs.

**Query Parameters:**
- `userId` - Filter by user ID
- `page` (default: 1)
- `limit` (default: 50)

---

## 📦 Orders Service API (`localhost:3002`)

> **Note:** All Orders Service endpoints require a valid JWT from the Auth Service.

### Orders Endpoints

#### GET /orders
List all orders (paginated).

**Required Permission:** `orders:read`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "order-1",
        "userId": "user-uuid",
        "product": "Mechanical Keyboard",
        "quantity": 1,
        "price": 149.99,
        "status": "pending",
        "createdAt": "2026-04-21T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

#### GET /orders/{id}
Get a single order by ID.

**Required Permission:** `orders:read`

---

#### POST /orders
Create a new order.

**Required Permission:** `orders:write`

**Request Body:**
```json
{
  "product": "Mechanical Keyboard",
  "quantity": 1,
  "price": 149.99
}
```

---

#### PUT /orders/{id}
Update an existing order.

**Required Permission:** `orders:write`

**Request Body:**
```json
{
  "product": "Gaming Keyboard",
  "quantity": 2,
  "price": 199.99,
  "status": "processing"
}
```

**Valid statuses:** `pending`, `processing`, `completed`, `cancelled`

---

#### DELETE /orders/{id}
Delete an order.

**Required Permission:** `orders:delete`

**Response (200):**
```json
{
  "status": "success",
  "message": "Order deleted"
}
```

---

## 🔒 RBAC Permissions

### Permission Matrix

| Endpoint | Admin | Manager | User | Description |
|----------|:-----:|:-------:|:----:|-------------|
| GET /orders | ✅ | ✅ | ✅ | View orders list |
| GET /orders/{id} | ✅ | ✅ | ✅ | View single order |
| POST /orders | ✅ | ✅ | ❌ | Create new order |
| PUT /orders/{id} | ✅ | ✅ | ❌ | Update existing order |
| DELETE /orders/{id} | ✅ | ✅ | ❌ | Delete an order |
| GET /admin/users | ✅ | ❌ | ❌ | List all users |
| POST /admin/roles | ✅ | ❌ | ❌ | Create roles |
| GET /admin/audit-logs | ✅ | ❌ | ❌ | View system logs |

### Role Definitions

| Role | Permissions | Use Case |
|------|-------------|----------|
| **admin** | All permissions | System administrators who manage users, roles, and full CRUD access |
| **manager** | orders:read, orders:write, orders:delete, reports:read | Team leads who manage orders and view reports |
| **user** | orders:read | Regular users who can only view orders |

### Permission Format

Permissions follow the pattern: `resource:action`

| Resource | Actions | Examples |
|----------|---------|----------|
| orders | read, write, delete | `orders:read`, `orders:write`, `orders:delete` |
| reports | read | `reports:read` |
| users | read, write | `users:read`, `users:write` |

---

## � Complete User Journey (Start to Finish)

This section provides a **complete end-to-end walkthrough** from creating your first account to logging out. Follow these steps in order to understand how the entire authentication and authorization system works.

### 📋 What You'll Learn

By following this guide, you will:
- ✅ Create a new user account
- ✅ Understand how new users get default permissions
- ✅ Login and receive JWT tokens
- ✅ Use tokens to access protected resources
- ✅ See how permission restrictions work
- ✅ Get elevated permissions through role assignment
- ✅ Test your new permissions
- ✅ Manage your tokens (refresh/revoke)
- ✅ Properly logout and invalidate tokens

### 📌 Prerequisites

Before starting:
1. Docker containers must be running: `docker-compose up --build`
2. Open **two browser tabs**:
   - Auth Service Swagger: http://localhost:3001/api-docs
   - Orders Service Swagger: http://localhost:3002/api-docs

---

### 🔵 STAGE 1: Account Creation

**What is Account Creation?**
> When you register, the system creates a new user record in the database. Every new user automatically gets assigned the **"user" role**, which has minimal permissions (read-only access to orders).

#### Step 1.1: Open Auth Service Swagger

1. Go to http://localhost:3001/api-docs
2. You'll see the Swagger UI with all available endpoints
3. Look for the **Auth** section - these are public endpoints anyone can use

#### Step 1.2: Register a New Account

**Why:** This creates your identity in the system. Without an account, you cannot authenticate or access protected resources.

1. Find and expand **POST /auth/register**
2. Click **"Try it out"** button
3. In the request body, enter your details:

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass@123"
}
```

> **Password Requirements:**
> - Minimum 8 characters
> - At least one uppercase letter
> - At least one lowercase letter
> - At least one number
> - At least one special character (@, #, $, etc.)

4. Click **"Execute"**
5. Check the response (should be `201 Created`):

```json
{
  "status": "success",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "john.doe@example.com",
    "isActive": true,
    "createdAt": "2026-04-21T10:30:00.000Z",
    "roles": ["user"]
  }
}
```

> **📝 Important:** Save the `id` value - you'll need it later for role assignment!
> 
> **Notice:** The user automatically has `roles: ["user"]` - this is the default role with limited permissions.

---

### 🔵 STAGE 2: Authentication (Login)

**What is Authentication?**
> Authentication verifies your identity. When you login, the system checks your credentials and issues **JWT tokens** that prove who you are. These tokens must be included with every protected API request.

#### Step 2.1: Login to Your Account

**Why:** You need a valid token to access any protected endpoints. The login process gives you two tokens:
- **Access Token** (15 min): Used for API calls
- **Refresh Token** (7 days): Used to get new access tokens

1. Find and expand **POST /auth/login**
2. Click **"Try it out"**
3. Enter your credentials:

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass@123"
}
```

4. Click **"Execute"**
5. You'll receive a response like:

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> **🔐 CRITICAL:** Copy the `accessToken` value immediately! You'll need it for the next step.

#### Step 2.2: Authorize Swagger UI (Auth Service)

**Why:** Swagger needs your token to send authenticated requests. This step adds your token to all subsequent API calls.

1. Click the green **"Authorize"** button (top-right corner of the page)
2. In the popup dialog, enter:
   ```
   Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   > **Important:** Include the word "Bearer" followed by a space, then your token
3. Click **"Authorize"**
4. Click **"Close"**

> **✅ You're now authenticated!** Notice the lock icons next to endpoints are now closed (locked).

#### Step 2.3: Verify Your Identity

**Why:** Confirm that your token works and see your user profile.

1. Find and expand **GET /auth/me**
2. Click **"Try it out"**
3. Click **"Execute"**
4. Check the response:

```json
{
  "status": "success",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "john.doe@example.com",
    "isActive": true,
    "createdAt": "2026-04-21T10:30:00.000Z",
    "roles": ["user"]
  }
}
```

> **📋 Observation:** Your roles array shows `["user"]`. This role only has `orders:read` permission.

---

### 🔵 STAGE 3: Testing Initial Permissions (User Role)

**What are Permissions?**
> Permissions control what actions you can perform. The "user" role only has `orders:read`, meaning you can **view** orders but **cannot create, update, or delete** them.

#### Step 3.1: Authorize Orders Service Swagger

**Why:** The Orders Service is a separate microservice. You need to authorize it separately with your token.

1. Open a new tab: http://localhost:3002/api-docs
2. Click **"Authorize"** button
3. Enter the same token: `Bearer eyJhbGciOiJSUzI1NiIs...`
4. Click **"Authorize"** then **"Close"**

#### Step 3.2: Test READ Permission (Should Work ✅)

**Why:** Users with `orders:read` permission can view orders.

1. Find and expand **GET /orders**
2. Click **"Try it out"**
3. Click **"Execute"**
4. **Expected Result:** `200 OK` with a list of orders (may be empty)

```json
{
  "status": "success",
  "data": {
    "orders": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 10,
      "pages": 0
    }
  }
}
```

> **✅ Success!** You can read orders because the "user" role has `orders:read` permission.

#### Step 3.3: Test CREATE Permission (Should Fail ❌)

**Why:** Users with only `orders:read` cannot create orders - they need `orders:write`.

1. Find and expand **POST /orders**
2. Click **"Try it out"**
3. Enter:

```json
{
  "product": "Gaming Mouse",
  "quantity": 2,
  "price": 59.99
}
```

4. Click **"Execute"**
5. **Expected Result:** `403 Forbidden`

```json
{
  "status": "error",
  "message": "Permission denied: orders:write required"
}
```

> **❌ Access Denied!** This proves RBAC is working. You need the `orders:write` permission to create orders.

#### Step 3.4: Test Admin Endpoint (Should Fail ❌)

**Why:** Admin endpoints require the "admin" role, not just permissions.

1. Go back to Auth Service Swagger (http://localhost:3001/api-docs)
2. Find and expand **GET /admin/users**
3. Click **"Try it out"**
4. Click **"Execute"**
5. **Expected Result:** `403 Forbidden`

```json
{
  "status": "error",
  "message": "Admin role required"
}
```

> **❌ Access Denied!** Only users with the "admin" role can access admin endpoints.

---

### 🔵 STAGE 4: Role Assignment (Elevating Permissions)

**What is Role Assignment?**
> An administrator can assign additional roles to users. Each role comes with a set of permissions. When you get a new role, you gain all permissions associated with that role.

> **⚠️ This stage requires admin access.** You'll need to login as an admin to assign roles.

#### Step 4.1: Login as Admin

**Why:** Only admins can assign roles to other users.

1. In Auth Service Swagger, find **POST /auth/login**
2. Click **"Try it out"**
3. Enter admin credentials:

```json
{
  "email": "admin@example.com",
  "password": "Admin@1234"
}
```

4. Click **"Execute"**
5. Copy the new `accessToken`

#### Step 4.2: Re-Authorize as Admin

1. Click **"Authorize"** button
2. Click **"Logout"** (to clear the old token)
3. Enter the admin token: `Bearer <admin-access-token>`
4. Click **"Authorize"** then **"Close"**

#### Step 4.3: View Available Roles

**Why:** You need to know the role IDs to assign them.

1. Find and expand **GET /admin/roles**
2. Click **"Try it out"**
3. Click **"Execute"**
4. Note the role information:

```json
{
  "status": "success",
  "data": [
    {
      "id": "role-admin-uuid",
      "name": "admin",
      "description": "Full system access",
      "permissions": ["orders:read", "orders:write", "orders:delete", ...]
    },
    {
      "id": "role-manager-uuid",
      "name": "manager",
      "description": "Order management access",
      "permissions": ["orders:read", "orders:write", "orders:delete", "reports:read"]
    },
    {
      "id": "role-user-uuid",
      "name": "user",
      "description": "Basic read access",
      "permissions": ["orders:read"]
    }
  ]
}
```

> **📝 Save:** Copy the **manager role ID** (e.g., `role-manager-uuid`)

#### Step 4.4: Assign Manager Role to Your User

**Why:** By assigning the "manager" role, your user will gain `orders:write` and `orders:delete` permissions.

1. Find and expand **POST /admin/users/{userId}/roles**
2. Click **"Try it out"**
3. In the `userId` field, enter your user ID from Stage 1 (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
4. In the request body:

```json
{
  "roleId": "role-manager-uuid"
}
```

> **Replace** `role-manager-uuid` with the actual manager role ID from step 4.3

5. Click **"Execute"**
6. **Expected Result:** `200 OK`

```json
{
  "status": "success",
  "message": "Role assigned successfully"
}
```

> **✅ Role Assigned!** Your user now has both "user" and "manager" roles.

---

### 🔵 STAGE 5: Using Elevated Permissions + Complete CRUD Operations

**What Happens After Role Assignment?**
> Your user now has the "manager" role in addition to "user". This means you have:
> - `orders:read` (from user role)
> - `orders:write` (from manager role)
> - `orders:delete` (from manager role)
> - `reports:read` (from manager role)

**What is CRUD?**
> CRUD stands for **Create, Read, Update, Delete** - the four basic operations you can perform on any resource. In this stage, you'll perform all CRUD operations on orders to see your new permissions in action.

#### Step 5.1: Login as Your User Again

**Why:** You need a fresh token that includes your new roles. The old token doesn't have the manager role because it was issued before the role assignment.

1. Find **POST /auth/login**
2. Login with your user credentials:

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass@123"
}
```

3. Copy the new `accessToken` and `refreshToken`

> **📝 Important:** Save both tokens - you'll need the refresh token later in Stage 6.

#### Step 5.2: Re-Authorize Both Services

**Why:** Both Swagger UIs need the new token to access protected endpoints.

1. **Auth Service Swagger** (http://localhost:3001/api-docs):
   - Click **"Authorize"** button
   - Click **"Logout"** to clear old token
   - Enter: `Bearer <new-access-token>`
   - Click **"Authorize"** → **"Close"**

2. **Orders Service Swagger** (http://localhost:3002/api-docs):
   - Click **"Authorize"** button
   - Enter: `Bearer <new-access-token>`
   - Click **"Authorize"** → **"Close"**

#### Step 5.3: Verify New Roles

**Why:** Confirm that your token now includes the manager role.

1. In Auth Service Swagger, execute **GET /auth/me**
2. Check the response:

```json
{
  "status": "success",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "john.doe@example.com",
    "isActive": true,
    "roles": ["user", "manager"]
  }
}
```

> **📋 Notice:** Your `roles` array now shows `["user", "manager"]`! You have both roles.

---

### 📦 CRUD Operations - Complete Walkthrough

Now let's perform all four CRUD operations on orders. This demonstrates your full capabilities as a manager.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRUD OPERATIONS OVERVIEW                      │
├─────────────────────────────────────────────────────────────────┤
│  C - CREATE   │  POST /orders         │  orders:write required  │
│  R - READ     │  GET /orders          │  orders:read required   │
│               │  GET /orders/{id}     │  orders:read required   │
│  U - UPDATE   │  PUT /orders/{id}     │  orders:write required  │
│  D - DELETE   │  DELETE /orders/{id}  │  orders:delete required │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 🟢 CRUD Step 1: CREATE - Add a New Order

**What is CREATE?**
> The CREATE operation adds a new record to the database. In REST APIs, this is typically done with a POST request.

**Permission Required:** `orders:write`

1. Go to **Orders Service Swagger** (http://localhost:3002/api-docs)
2. Find and expand **POST /orders**
3. Click **"Try it out"**
4. Enter the order details:

```json
{
  "product": "Mechanical Keyboard",
  "quantity": 1,
  "price": 149.99
}
```

5. Click **"Execute"**
6. **Expected Result:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "id": "ord-abc123-def456-ghi789",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "product": "Mechanical Keyboard",
    "quantity": 1,
    "price": 149.99,
    "status": "pending",
    "createdAt": "2026-04-21T11:00:00.000Z"
  }
}
```

> **✅ Order Created!**
>
> **📝 CRITICAL:** Copy and save the order `id` (e.g., `ord-abc123-def456-ghi789`) - you'll need it for all subsequent operations!

**Let's create two more orders for testing:**

**Order 2:**
```json
{
  "product": "Gaming Mouse",
  "quantity": 2,
  "price": 59.99
}
```

**Order 3:**
```json
{
  "product": "USB-C Hub",
  "quantity": 1,
  "price": 39.99
}
```

> **📝 Save all three order IDs:**
> - Order 1 ID: `______________` (Keyboard)
> - Order 2 ID: `______________` (Mouse)
> - Order 3 ID: `______________` (USB Hub)

---

#### 🔵 CRUD Step 2: READ - View Orders

**What is READ?**
> The READ operation retrieves data without modifying it. REST APIs use GET requests for reading. There are typically two types: list all records, or get a single record by ID.

**Permission Required:** `orders:read`

##### 2a. Read All Orders (List)

**Why:** See all orders in the system with pagination.

1. Find and expand **GET /orders**
2. Click **"Try it out"**
3. Set query parameters:
   - `page`: 1
   - `limit`: 10
4. Click **"Execute"**
5. **Expected Result:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "ord-abc123-def456-ghi789",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "product": "Mechanical Keyboard",
        "quantity": 1,
        "price": 149.99,
        "status": "pending",
        "createdAt": "2026-04-21T11:00:00.000Z"
      },
      {
        "id": "ord-xyz789-uvw456",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "product": "Gaming Mouse",
        "quantity": 2,
        "price": 59.99,
        "status": "pending",
        "createdAt": "2026-04-21T11:01:00.000Z"
      },
      {
        "id": "ord-lmn456-opq123",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "product": "USB-C Hub",
        "quantity": 1,
        "price": 39.99,
        "status": "pending",
        "createdAt": "2026-04-21T11:02:00.000Z"
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

> **✅ Listed All Orders!** You can see all three orders you created.

##### 2b. Read Single Order (By ID)

**Why:** Get detailed information about a specific order.

1. Find and expand **GET /orders/{id}**
2. Click **"Try it out"**
3. In the `id` field, enter your first order ID (the Keyboard order)
4. Click **"Execute"**
5. **Expected Result:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "ord-abc123-def456-ghi789",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "product": "Mechanical Keyboard",
    "quantity": 1,
    "price": 149.99,
    "status": "pending",
    "createdAt": "2026-04-21T11:00:00.000Z"
  }
}
```

> **✅ Single Order Retrieved!**

##### 2c. Test Non-Existent Order (Error Case)

**Why:** See how the API handles requests for orders that don't exist.

1. In **GET /orders/{id}**
2. Enter a fake ID: `non-existent-order-id`
3. Click **"Execute"**
4. **Expected Result:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Order not found"
}
```

> **📋 Observation:** The API properly returns 404 for non-existent resources.

---

#### 🟡 CRUD Step 3: UPDATE - Modify an Existing Order

**What is UPDATE?**
> The UPDATE operation modifies an existing record. REST APIs typically use PUT (full replacement) or PATCH (partial update) requests.

**Permission Required:** `orders:write`

##### 3a. Update Order Status

**Scenario:** The keyboard order is being processed - update its status.

1. Find and expand **PUT /orders/{id}**
2. Click **"Try it out"**
3. In the `id` field, enter your Keyboard order ID
4. Enter the update:

```json
{
  "status": "processing"
}
```

5. Click **"Execute"**
6. **Expected Result:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "ord-abc123-def456-ghi789",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "product": "Mechanical Keyboard",
    "quantity": 1,
    "price": 149.99,
    "status": "processing",
    "createdAt": "2026-04-21T11:00:00.000Z",
    "updatedAt": "2026-04-21T11:10:00.000Z"
  }
}
```

> **✅ Status Updated!** Notice the `status` changed from "pending" to "processing".

##### 3b. Update Multiple Fields

**Scenario:** Customer wants to increase their mouse order quantity.

1. In **PUT /orders/{id}**, enter your Mouse order ID
2. Enter:

```json
{
  "quantity": 5,
  "price": 299.95
}
```

> **Note:** Price updated to reflect new quantity (5 × $59.99 = $299.95)

3. Click **"Execute"**
4. **Expected Result:** `200 OK` - Both quantity and price updated

##### 3c. Complete an Order

**Scenario:** The keyboard has been shipped - mark it as completed.

1. In **PUT /orders/{id}**, enter your Keyboard order ID
2. Enter:

```json
{
  "status": "completed"
}
```

3. Click **"Execute"**
4. **Expected Result:** `200 OK`

> **✅ Order Completed!** 

##### 3d. Verify Updates

**Why:** Confirm all your updates were saved correctly.

1. Execute **GET /orders** to see all orders
2. Check that:
   - Keyboard order: `status: "completed"`
   - Mouse order: `quantity: 5`, `price: 299.95`
   - USB Hub order: `status: "pending"` (unchanged)

**Valid Order Statuses:**
| Status | Description |
|--------|-------------|
| `pending` | Order created, awaiting processing |
| `processing` | Order is being prepared/shipped |
| `completed` | Order fulfilled successfully |
| `cancelled` | Order was cancelled |

---

#### 🔴 CRUD Step 4: DELETE - Remove an Order

**What is DELETE?**
> The DELETE operation permanently removes a record from the database. This is typically irreversible, so use with caution!

**Permission Required:** `orders:delete`

##### 4a. Delete the USB Hub Order

**Scenario:** Customer cancelled their USB Hub order - delete it.

1. Find and expand **DELETE /orders/{id}**
2. Click **"Try it out"**
3. In the `id` field, enter your USB Hub order ID
4. Click **"Execute"**
5. **Expected Result:** `200 OK`

```json
{
  "status": "success",
  "message": "Order deleted"
}
```

> **✅ Order Deleted!**

##### 4b. Verify Deletion

**Why:** Confirm the order was actually removed.

1. Try to access the deleted order: **GET /orders/{id}** with the USB Hub ID
2. **Expected Result:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Order not found"
}
```

> **✅ Confirmed!** The order no longer exists.

##### 4c. Check Remaining Orders

1. Execute **GET /orders**
2. You should now see only 2 orders (Keyboard and Mouse)
3. The USB Hub order is gone

---

### 📊 CRUD Operations Summary

| Operation | Endpoint | Permission | What You Did |
|-----------|----------|------------|--------------|
| **CREATE** | POST /orders | orders:write | Created 3 orders (Keyboard, Mouse, USB Hub) |
| **READ** | GET /orders | orders:read | Listed all orders |
| **READ** | GET /orders/{id} | orders:read | Retrieved single order by ID |
| **UPDATE** | PUT /orders/{id} | orders:write | Changed status and quantity |
| **DELETE** | DELETE /orders/{id} | orders:delete | Removed USB Hub order |

### ✅ CRUD Checklist

Track your progress:

| # | Operation | Action | Done |
|---|-----------|--------|------|
| 1 | CREATE | Create Keyboard order | ☐ |
| 2 | CREATE | Create Mouse order | ☐ |
| 3 | CREATE | Create USB Hub order | ☐ |
| 4 | READ | List all orders | ☐ |
| 5 | READ | Get Keyboard order by ID | ☐ |
| 6 | READ | Test non-existent order (404) | ☐ |
| 7 | UPDATE | Change Keyboard status to "processing" | ☐ |
| 8 | UPDATE | Update Mouse quantity and price | ☐ |
| 9 | UPDATE | Complete Keyboard order | ☐ |
| 10 | UPDATE | Verify all updates | ☐ |
| 11 | DELETE | Delete USB Hub order | ☐ |
| 12 | DELETE | Verify deletion (404) | ☐ |
| 13 | READ | Confirm only 2 orders remain | ☐ |

> **🎉 Congratulations!** You've completed all CRUD operations and understand how your manager permissions work!

---

### 🔵 STAGE 6: Token Management

**What is Token Management?**
> Tokens expire for security reasons. The access token expires in 15 minutes. Instead of logging in again, you can use your refresh token to get new tokens.

#### Step 6.1: Refresh Your Tokens

**Why:** When your access token expires, use this instead of logging in again.

1. In Auth Service Swagger, find **POST /auth/refresh**
2. Click **"Try it out"**
3. Enter your refresh token (from when you logged in):

```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

4. Click **"Execute"**
5. **Expected Result:** `200 OK` with new tokens:

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...(NEW)...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs...(NEW)..."
  }
}
```

> **📝 Important:** 
> - The OLD tokens are now **invalidated**
> - Use the NEW tokens for future requests
> - Update your Swagger authorization with the new access token

---

### 🔵 STAGE 7: Advanced Admin Operations

**What are Advanced Admin Operations?**
> Beyond basic user management, admins can create custom roles and permissions, view system audit logs, and access the RSA public key used for token verification. This stage demonstrates the full power of administrative access.

> **⚠️ Admin Access Required:** You must be logged in as an admin to perform these operations.

#### Step 7.1: Switch to Admin Account

**Why:** Only admins can perform these advanced operations.

1. In Auth Service Swagger, find **POST /auth/login**
2. Login with admin credentials:

```json
{
  "email": "admin@example.com",
  "password": "Admin@1234"
}
```

3. Copy the `accessToken`
4. Click **"Authorize"** → **"Logout"** → Enter `Bearer <admin-token>` → **"Authorize"**

---

### 🔐 Public Key Management

#### Step 7.2: Retrieve RSA Public Key

**What is the Public Key?**
> The RSA public key is used by other microservices (like Orders Service) to verify JWT tokens without needing to contact the Auth Service. This enables distributed authentication - each service can independently verify tokens using the public key.

**Why This Matters:**
- **Security:** Tokens are signed with a private key, verified with the public key
- **Performance:** Services don't need to call Auth Service for every request
- **Scalability:** Stateless authentication across microservices

1. Find and expand **GET /auth/public-key**
2. Click **"Try it out"**
3. Click **"Execute"**
4. **Expected Result:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"
  }
}
```

> **📋 Technical Note:** 
> - This is the same key that Orders Service uses to verify your JWT
> - The private key (used to sign tokens) is kept secret in Auth Service only
> - This endpoint is public - anyone can access it without authentication

**How This Works in Practice:**

```
┌──────────────────────────────────────────────────────────────┐
│                  JWT VERIFICATION FLOW                        │
└──────────────────────────────────────────────────────────────┘

1. Auth Service signs token with PRIVATE KEY
   └── Only Auth Service has the private key

2. Orders Service receives request with token
   └── Calls GET /auth/public-key ONCE at startup

3. Orders Service verifies token with PUBLIC KEY
   ├── No need to contact Auth Service for each request
   └── Fast, efficient, scalable

4. If signature is valid → Request is authenticated
   If signature is invalid → 401 Unauthorized
```

---

### 📊 Audit Log Management

#### Step 7.3: View System Audit Logs

**What are Audit Logs?**
> Audit logs record every significant action in the system - user registrations, logins, role assignments, permission changes, etc. They're essential for security monitoring, compliance, and debugging.

**Why Audit Logs Matter:**
- **Security:** Detect suspicious activity or unauthorized access attempts
- **Compliance:** Many regulations require audit trails (GDPR, SOC2, etc.)
- **Debugging:** Trace what happened when things go wrong
- **Accountability:** Know who did what and when

##### 7.3a. View All Audit Logs

1. Find and expand **GET /admin/audit-logs**
2. Click **"Try it out"**
3. Set parameters:
   - `page`: 1
   - `limit`: 20
4. Click **"Execute"**
5. **Expected Result:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "log-uuid-1",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "userEmail": "john.doe@example.com",
        "action": "LOGIN",
        "details": "User logged in successfully",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2026-04-21T11:15:00.000Z"
      },
      {
        "id": "log-uuid-2",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "userEmail": "john.doe@example.com",
        "action": "ROLE_ASSIGNED",
        "details": "Role 'manager' assigned to user",
        "performedBy": "admin@example.com",
        "createdAt": "2026-04-21T10:50:00.000Z"
      },
      {
        "id": "log-uuid-3",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "userEmail": "john.doe@example.com",
        "action": "REGISTER",
        "details": "New user registered",
        "createdAt": "2026-04-21T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

> **📋 Observation:** You can see your entire journey:
> 1. Account registration
> 2. Role assignment (by admin)
> 3. Login events
> 4. And more...

**Common Audit Log Actions:**
| Action | Description |
|--------|-------------|
| `REGISTER` | New user account created |
| `LOGIN` | User logged in successfully |
| `LOGOUT` | User logged out |
| `TOKEN_REFRESHED` | User refreshed their tokens |
| `ROLE_ASSIGNED` | Role was assigned to a user |
| `ROLE_REMOVED` | Role was removed from a user |
| `PERMISSION_CREATED` | New permission created |
| `USER_DISABLED` | User account was disabled |
| `USER_ENABLED` | User account was re-enabled |

##### 7.3b. Filter Audit Logs by User

**Why:** Track all actions performed by a specific user.

1. In **GET /admin/audit-logs**
2. Set parameters:
   - `userId`: `a1b2c3d4-e5f6-7890-abcd-ef1234567890` (your user ID)
   - `page`: 1
   - `limit`: 50
3. Click **"Execute"**
4. **Expected Result:** Only logs for that specific user

> **💡 Use Case:** If you suspect a user's account was compromised, check their audit logs for unusual activity.

---

### 🎭 Custom Role & Permission Creation

Now let's create a completely custom role from scratch - perfect for understanding how RBAC works!

#### Step 7.4: Create Custom Permissions

**Scenario:** You want to add invoice management to your system. Create permissions for it.

**What are Permissions?**
> Permissions are the atomic units of access control. They follow the format `resource:action`, where:
> - **resource** = What you're accessing (e.g., "invoices", "orders", "reports")
> - **action** = What you can do (read, write, delete, manage)

##### 7.4a. Create "Invoices Read" Permission

1. Find and expand **POST /admin/permissions**
2. Click **"Try it out"**
3. Enter:

```json
{
  "resource": "invoices",
  "action": "read"
}
```

4. Click **"Execute"**
5. **Expected Result:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "id": "perm-invoices-read-uuid",
    "resource": "invoices",
    "action": "read",
    "name": "invoices:read",
    "createdAt": "2026-04-21T11:30:00.000Z"
  }
}
```

> **📝 Save:** Copy the permission ID: `perm-invoices-read-uuid`

##### 7.4b. Create "Invoices Write" Permission

```json
{
  "resource": "invoices",
  "action": "write"
}
```

> **📝 Save:** Permission ID: `________________`

##### 7.4c. Create "Invoices Delete" Permission

```json
{
  "resource": "invoices",
  "action": "delete"
}
```

> **📝 Save:** Permission ID: `________________`

##### 7.4d. Create "Reports Read" Permission

**Scenario:** Analysts need to view reports but not modify them.

```json
{
  "resource": "reports",
  "action": "read"
}
```

> **📝 Save:** Permission ID: `________________`

##### 7.4e. View All Permissions

**Why:** See all available permissions in the system, including the ones you just created.

1. Find and expand **GET /admin/permissions**
2. Click **"Try it out"**
3. Click **"Execute"**
4. **Expected Result:** List of all permissions

```json
{
  "status": "success",
  "data": [
    {
      "id": "perm-orders-read-uuid",
      "resource": "orders",
      "action": "read",
      "name": "orders:read"
    },
    {
      "id": "perm-orders-write-uuid",
      "resource": "orders",
      "action": "write",
      "name": "orders:write"
    },
    {
      "id": "perm-invoices-read-uuid",
      "resource": "invoices",
      "action": "read",
      "name": "invoices:read"
    },
    // ... your newly created permissions appear here
  ]
}
```

**Valid Permission Actions:**
| Action | Description | Example Use Case |
|--------|-------------|------------------|
| `read` | View/retrieve data | View invoices, read reports |
| `write` | Create or update data | Create/edit invoices |
| `delete` | Remove data | Delete invoices |
| `manage` | Full control (admin-level) | Manage system settings |

---

#### Step 7.5: Create a Custom Role

**Scenario:** Create an "Accountant" role for users who manage invoices and view financial reports.

**What are Roles?**
> Roles are collections of permissions. Instead of assigning 10 permissions to each user individually, you create a role with those 10 permissions and assign the role. This makes permission management much easier.

##### 7.5a. Create "Accountant" Role

1. Find and expand **POST /admin/roles**
2. Click **"Try it out"**
3. Enter:

```json
{
  "name": "accountant",
  "description": "Financial data access - invoices and reports"
}
```

4. Click **"Execute"**
5. **Expected Result:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "id": "role-accountant-uuid",
    "name": "accountant",
    "description": "Financial data access - invoices and reports",
    "createdAt": "2026-04-21T11:35:00.000Z"
  }
}
```

> **📝 Save:** Role ID: `role-accountant-uuid`

##### 7.5b. Create "Analyst" Role

**Scenario:** Create a read-only role for data analysts.

```json
{
  "name": "analyst",
  "description": "Read-only access to orders, invoices, and reports"
}
```

> **📝 Save:** Role ID: `________________`

---

#### Step 7.6: Assign Permissions to Custom Role

**Now connect the permissions to the role!**

**What This Does:**
> When you assign permissions to a role, any user who has that role automatically gets all those permissions. This is the core of Role-Based Access Control (RBAC).

##### 7.6a. Assign "Invoices Read" to Accountant

1. Find and expand **POST /admin/roles/{roleId}/permissions**
2. Click **"Try it out"**
3. In `roleId` field, enter: `role-accountant-uuid` (your accountant role ID)
4. In request body:

```json
{
  "permissionId": "perm-invoices-read-uuid"
}
```

5. Click **"Execute"**
6. **Expected Result:** `200 OK`

```json
{
  "status": "success",
  "message": "Permission assigned to role"
}
```

##### 7.6b. Assign "Invoices Write" to Accountant

```json
{
  "permissionId": "perm-invoices-write-uuid"
}
```

##### 7.6c. Assign "Invoices Delete" to Accountant

```json
{
  "permissionId": "perm-invoices-delete-uuid"
}
```

##### 7.6d. Assign "Reports Read" to Accountant

```json
{
  "permissionId": "perm-reports-read-uuid"
}
```

> **✅ Complete!** The "accountant" role now has:
> - `invoices:read`
> - `invoices:write`
> - `invoices:delete`
> - `reports:read`

---

#### Step 7.7: Verify Role Configuration

**Why:** Confirm the role has all the permissions you assigned.

1. Find and expand **GET /admin/roles**
2. Click **"Try it out"**
3. Click **"Execute"**
4. Look for your "accountant" role in the response:

```json
{
  "status": "success",
  "data": [
    {
      "id": "role-accountant-uuid",
      "name": "accountant",
      "description": "Financial data access - invoices and reports",
      "permissions": [
        "invoices:read",
        "invoices:write",
        "invoices:delete",
        "reports:read"
      ],
      "createdAt": "2026-04-21T11:35:00.000Z"
    },
    // ... other roles
  ]
}
```

> **✅ Perfect!** Your custom role is ready to be assigned to users.

---

#### Step 7.8: Assign Custom Role to a User (Optional)

**Test your new role in action!**

1. Find **POST /admin/users/{userId}/roles**
2. Enter your user ID (john.doe@example.com)
3. Enter:

```json
{
  "roleId": "role-accountant-uuid"
}
```

4. Click **"Execute"**

> **Result:** Your user now has THREE roles:
> - `user` (default)
> - `manager` (assigned in Stage 4)
> - `accountant` (just assigned)
>
> This means you have ALL permissions from all three roles combined!

---

### 📊 Advanced Admin Operations Summary

| Operation | Endpoint | What You Learned |
|-----------|----------|------------------|
| **Get Public Key** | GET /auth/public-key | How microservices verify JWT tokens |
| **View Audit Logs** | GET /admin/audit-logs | Track all system activity |
| **Filter Audit Logs** | GET /admin/audit-logs?userId=... | Monitor specific users |
| **Create Permissions** | POST /admin/permissions | Build custom access controls |
| **List Permissions** | GET /admin/permissions | View all available permissions |
| **Create Role** | POST /admin/roles | Group permissions logically |
| **Assign Permissions** | POST /admin/roles/{id}/permissions | Build role capabilities |
| **Verify Role** | GET /admin/roles | Confirm role configuration |
| **Assign to User** | POST /admin/users/{id}/roles | Grant role to users |

### ✅ Admin Operations Checklist

| # | Operation | Done |
|---|-----------|------|
| 1 | Login as admin | ☐ |
| 2 | Get RSA public key | ☐ |
| 3 | View all audit logs | ☐ |
| 4 | Filter audit logs by user | ☐ |
| 5 | Create "invoices:read" permission | ☐ |
| 6 | Create "invoices:write" permission | ☐ |
| 7 | Create "invoices:delete" permission | ☐ |
| 8 | Create "reports:read" permission | ☐ |
| 9 | List all permissions | ☐ |
| 10 | Create "accountant" role | ☐ |
| 11 | Assign invoices:read to accountant | ☐ |
| 12 | Assign invoices:write to accountant | ☐ |
| 13 | Assign invoices:delete to accountant | ☐ |
| 14 | Assign reports:read to accountant | ☐ |
| 15 | Verify role has all permissions | ☐ |
| 16 | (Optional) Assign role to user | ☐ |

> **🎉 Excellent!** You now understand how to build and manage custom access control systems from scratch!

---

### 🔵 STAGE 8: Logout (Session Termination)

**What is Logout?**
> Logging out invalidates (blacklists) both your access and refresh tokens. Even if someone had copied your tokens, they can no longer use them after logout.

#### Step 7.1: Perform Logout

**Why:** Properly ending your session is a security best practice. It ensures your tokens cannot be reused.

1. In Auth Service Swagger, find **POST /auth/logout**
2. Click **"Try it out"**
3. Click **"Execute"** (no request body needed)
4. **Expected Result:** `200 OK`

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

> **🔐 Security Note:** Both your access token and refresh token are now blacklisted in Redis.

#### Step 7.2: Verify Tokens Are Revoked

**Why:** Confirm that your old tokens no longer work.

1. Try to execute **GET /auth/me**
2. **Expected Result:** `401 Unauthorized`

```json
{
  "status": "error",
  "message": "Token has been revoked"
}
```

> **✅ Session Ended!** Your tokens have been invalidated. You would need to login again to access protected resources.

---

### 🎉 Journey Complete!

**Congratulations!** You've completed the full user journey:

| Stage | What You Did | What You Learned |
|-------|--------------|------------------|
| 1. Account Creation | Registered new account | Users get "user" role by default |
| 2. Authentication | Logged in, got tokens | JWT tokens prove your identity |
| 3. Initial Permissions | Tested read/write/admin | RBAC restricts actions by role |
| 4. Role Assignment | Admin assigned manager role | Admins control user permissions |
| 5. Elevated Permissions | Tested new capabilities | New roles grant new permissions |
| 6. Token Management | Refreshed tokens | Tokens can be renewed without re-login |
| 7. Logout | Ended session securely | Tokens are invalidated on logout |

### 🔄 Quick Reference: The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE USER JOURNEY                         │
└─────────────────────────────────────────────────────────────────┘

[1] REGISTER ──→ [2] LOGIN ──→ [3] TEST (Limited) ──→ [4] GET ROLE
       │              │               │                     │
       ▼              ▼               ▼                     ▼
   Create user    Get tokens    Try actions         Admin assigns
   Gets "user"    Access +      Read: ✅             manager role
   role           Refresh       Write: ❌            to your user
                                Admin: ❌
                                                           │
                                                           ▼
[7] LOGOUT ◄── [6] REFRESH ◄── [5] TEST (Elevated) ◄──────┘
       │              │               │
       ▼              ▼               ▼
   Tokens         Get new        Try actions again
   blacklisted    tokens         Read: ✅
   Session ends   Stay logged    Write: ✅
                  in             Delete: ✅
```

---

## �📝 Step-by-Step Tutorials

### Tutorial 1: Your First API Call (No Auth Required)

**Goal:** Make a simple API call to check if the service is running.

1. Open http://localhost:3001/api-docs in your browser
2. Find **GET /auth/public-key** (under Auth section)
3. Click to expand it
4. Click **"Try it out"** button
5. Click **"Execute"** button
6. View the response - you should see the RSA public key

✅ **Success!** You just made your first API call using Swagger.

---

### Tutorial 2: Register and Login

**Goal:** Create a new user account and get JWT tokens.

**Step 1: Register a new user**

1. Find **POST /auth/register**
2. Click **"Try it out"**
3. Replace the example with:
```json
{
  "email": "myuser@example.com",
  "password": "MySecure@123"
}
```
4. Click **"Execute"**
5. Check response - should be `201 Created`

**Step 2: Login with your new user**

1. Find **POST /auth/login**
2. Click **"Try it out"**
3. Enter:
```json
{
  "email": "myuser@example.com",
  "password": "MySecure@123"
}
```
4. Click **"Execute"**
5. **Copy the `accessToken`** from the response

**Step 3: Authorize Swagger**

1. Click the green **"Authorize"** button (top-right)
2. In the popup, paste your token: `Bearer eyJhbGciOiJSUzI1NiIs...`
3. Click **"Authorize"**
4. Click **"Close"**

✅ **You're now authenticated!** The lock icons should be closed now.

---

### Tutorial 3: Test Permission Denial

**Goal:** See how RBAC blocks unauthorized access.

1. Make sure you're logged in as `user@example.com` (default role: "user")
2. Go to Orders Service: http://localhost:3002/api-docs
3. Authorize with your token
4. Try **GET /orders** → ✅ Should work (user has `orders:read`)
5. Try **POST /orders** → ❌ Should fail with `403 Forbidden`

**Why?** The "user" role only has `orders:read` permission, not `orders:write`.

---

### Tutorial 4: Full CRUD as Manager

**Goal:** Create, Read, Update, and Delete an order.

1. Login as **manager@example.com** / **Manager@1234**
2. Authorize both Swagger UIs with the token
3. Go to Orders Service Swagger

**Create an order:**
```json
POST /orders
{
  "product": "Gaming Laptop",
  "quantity": 1,
  "price": 1299.99
}
```
→ Note the returned order `id`

**Read the order:**
```
GET /orders/{id}
```
→ Replace `{id}` with the order ID

**Update the order:**
```json
PUT /orders/{id}
{
  "status": "processing",
  "quantity": 2
}
```

**Delete the order:**
```
DELETE /orders/{id}
```

✅ **Complete!** You've performed full CRUD operations.

---

### Tutorial 5: Admin User Management

**Goal:** View users and assign roles as an admin.

1. Login as **admin@example.com** / **Admin@1234**
2. Go to Auth Service Swagger
3. Authorize with admin token

**List all users:**
```
GET /admin/users
```

**List all roles:**
```
GET /admin/roles
```
→ Note down role IDs

**Assign a role to a user:**
```json
POST /admin/users/{userId}/roles
{
  "roleId": "uuid-of-manager-role"
}
```

**Disable a user account:**
```json
PATCH /admin/users/{userId}/status
{
  "isActive": false
}
```

---

## 🧪 Complete API Testing Flow (All Endpoints)

This section provides a **complete step-by-step flow** to test every API endpoint in the system. Follow this sequence to thoroughly test all functionality.

### 📋 Pre-Test Checklist

Before starting, ensure:
- [ ] Docker containers are running: `docker-compose up --build`
- [ ] Auth Service is healthy: http://localhost:3001/health
- [ ] Orders Service is healthy: http://localhost:3002/health
- [ ] You have both Swagger UIs open in browser tabs

---

### Phase 1: Public Endpoints (No Authentication)

**🎯 Goal:** Test endpoints that don't require authentication

#### Step 1.1: Health Check
```
Service: Auth Service (localhost:3001)
Method:  GET
URL:     /health
Expected: 200 OK - {"status":"ok","service":"auth-service"}
```

#### Step 1.2: Get Public Key
```
Service: Auth Service Swagger
Method:  GET /auth/public-key
Expected: 200 OK - Returns RSA public key (used by other services)
```

#### Step 1.3: Register New User
```
Service: Auth Service Swagger
Method:  POST /auth/register
Body:
{
  "email": "testuser@example.com",
  "password": "TestUser@123"
}
Expected: 201 Created - User created with "user" role
Save: Note the user ID from response
```

#### Step 1.4: Try Duplicate Registration (Error Test)
```
Service: Auth Service Swagger
Method:  POST /auth/register
Body:
{
  "email": "testuser@example.com",
  "password": "TestUser@123"
}
Expected: 409 Conflict - "Email already registered"
```

---

### Phase 2: Authentication Flow

**🎯 Goal:** Test login, token management, and logout

#### Step 2.1: Login as Regular User
```
Service: Auth Service Swagger
Method:  POST /auth/login
Body:
{
  "email": "testuser@example.com",
  "password": "TestUser@123"
}
Expected: 200 OK
Save: Copy accessToken and refreshToken
```

#### Step 2.2: Authorize Swagger
```
Action: Click "Authorize" button (top-right)
Enter:  Bearer <paste-your-accessToken>
Click:  "Authorize" → "Close"
```

#### Step 2.3: Get User Profile
```
Service: Auth Service Swagger
Method:  GET /auth/me
Expected: 200 OK - Returns user profile with roles: ["user"]
```

#### Step 2.4: Test Token Refresh
```
Service: Auth Service Swagger
Method:  POST /auth/refresh
Body:
{
  "refreshToken": "<paste-your-refreshToken>"
}
Expected: 200 OK - New accessToken and refreshToken
Action: Re-authorize Swagger with new accessToken
```

#### Step 2.5: Logout
```
Service: Auth Service Swagger
Method:  POST /auth/logout
Expected: 200 OK - "Logged out successfully"
```

#### Step 2.6: Verify Token Revoked
```
Service: Auth Service Swagger
Method:  GET /auth/me
Expected: 401 Unauthorized - Token has been revoked
```

---

### Phase 3: RBAC Testing (User Role)

**🎯 Goal:** Verify permission restrictions for "user" role

#### Step 3.1: Login as User
```
Service: Auth Service Swagger
Method:  POST /auth/login
Body:
{
  "email": "user@example.com",
  "password": "User@1234"
}
Action: Authorize BOTH Swagger UIs with the accessToken
```

#### Step 3.2: Test Allowed - Read Orders ✅
```
Service: Orders Service Swagger (localhost:3002)
Method:  GET /orders
Expected: 200 OK - Returns orders list (may be empty)
```

#### Step 3.3: Test Denied - Create Order ❌
```
Service: Orders Service Swagger
Method:  POST /orders
Body:
{
  "product": "Test Product",
  "quantity": 1,
  "price": 99.99
}
Expected: 403 Forbidden - "Permission denied: orders:write required"
```

#### Step 3.4: Test Denied - Admin Endpoint ❌
```
Service: Auth Service Swagger
Method:  GET /admin/users
Expected: 403 Forbidden - "Admin role required"
```

---

### Phase 4: RBAC Testing (Manager Role)

**🎯 Goal:** Verify manager can manage orders but not admin functions

#### Step 4.1: Login as Manager
```
Service: Auth Service Swagger
Method:  POST /auth/login
Body:
{
  "email": "manager@example.com",
  "password": "Manager@1234"
}
Action: Authorize BOTH Swagger UIs
```

#### Step 4.2: Create Order ✅
```
Service: Orders Service Swagger
Method:  POST /orders
Body:
{
  "product": "Gaming Laptop",
  "quantity": 1,
  "price": 1299.99
}
Expected: 201 Created
Save: Note the order "id" from response
```

#### Step 4.3: Read Order ✅
```
Service: Orders Service Swagger
Method:  GET /orders/{id}
Param:   id = <order-id-from-step-4.2>
Expected: 200 OK - Returns order details
```

#### Step 4.4: Update Order ✅
```
Service: Orders Service Swagger
Method:  PUT /orders/{id}
Param:   id = <order-id>
Body:
{
  "status": "processing",
  "quantity": 2,
  "price": 2499.99
}
Expected: 200 OK - Order updated
```

#### Step 4.5: Delete Order ✅
```
Service: Orders Service Swagger
Method:  DELETE /orders/{id}
Param:   id = <order-id>
Expected: 200 OK - "Order deleted"
```

#### Step 4.6: Verify Deletion
```
Service: Orders Service Swagger
Method:  GET /orders/{id}
Param:   id = <deleted-order-id>
Expected: 404 Not Found - "Order not found"
```

#### Step 4.7: Test Denied - Admin Endpoint ❌
```
Service: Auth Service Swagger
Method:  GET /admin/users
Expected: 403 Forbidden - "Admin role required"
```

---

### Phase 5: Admin Full Access Testing

**🎯 Goal:** Test all admin capabilities

#### Step 5.1: Login as Admin
```
Service: Auth Service Swagger
Method:  POST /auth/login
Body:
{
  "email": "admin@example.com",
  "password": "Admin@1234"
}
Action: Authorize BOTH Swagger UIs
```

#### Step 5.2: List All Users
```
Service: Auth Service Swagger
Method:  GET /admin/users
Params:  page=1, limit=10
Expected: 200 OK - Paginated list of all users
Save: Note user IDs for later tests
```

#### Step 5.3: List All Roles
```
Service: Auth Service Swagger
Method:  GET /admin/roles
Expected: 200 OK - List of roles with permissions
Save: Note role IDs (admin, manager, user)
```

#### Step 5.4: List All Permissions
```
Service: Auth Service Swagger
Method:  GET /admin/permissions
Expected: 200 OK - List of all permissions
Save: Note permission IDs
```

#### Step 5.5: Create New Permission
```
Service: Auth Service Swagger
Method:  POST /admin/permissions
Body:
{
  "resource": "invoices",
  "action": "read"
}
Expected: 201 Created
Save: Note the permission ID
```

#### Step 5.6: Create New Role
```
Service: Auth Service Swagger
Method:  POST /admin/roles
Body:
{
  "name": "analyst",
  "description": "Read-only analyst for reports and invoices"
}
Expected: 201 Created
Save: Note the role ID
```

#### Step 5.7: Assign Permission to Role
```
Service: Auth Service Swagger
Method:  POST /admin/roles/{roleId}/permissions
Param:   roleId = <analyst-role-id>
Body:
{
  "permissionId": "<invoices-read-permission-id>"
}
Expected: 200 OK - Permission assigned
```

#### Step 5.8: Assign Role to User
```
Service: Auth Service Swagger
Method:  POST /admin/users/{userId}/roles
Param:   userId = <testuser-id-from-phase-1>
Body:
{
  "roleId": "<analyst-role-id>"
}
Expected: 200 OK - Role assigned
```

#### Step 5.9: Disable User Account
```
Service: Auth Service Swagger
Method:  PATCH /admin/users/{userId}/status
Param:   userId = <testuser-id>
Body:
{
  "isActive": false
}
Expected: 200 OK - User disabled
```

#### Step 5.10: Verify Disabled User Cannot Login
```
Service: Auth Service Swagger
Method:  POST /auth/login
Body:
{
  "email": "testuser@example.com",
  "password": "TestUser@123"
}
Expected: 403 Forbidden - "Account has been disabled"
```

#### Step 5.11: Re-enable User
```
Service: Auth Service Swagger
Method:  PATCH /admin/users/{userId}/status
Param:   userId = <testuser-id>
Body:
{
  "isActive": true
}
Expected: 200 OK - User enabled
```

#### Step 5.12: View Audit Logs
```
Service: Auth Service Swagger
Method:  GET /admin/audit-logs
Params:  page=1, limit=20
Expected: 200 OK - List of audit events (login, register, etc.)
```

#### Step 5.13: Filter Audit Logs by User
```
Service: Auth Service Swagger
Method:  GET /admin/audit-logs
Params:  userId=<any-user-id>, page=1
Expected: 200 OK - Filtered audit logs for that user
```

---

### Phase 6: Error Handling Tests

**🎯 Goal:** Verify proper error responses

#### Step 6.1: Invalid Login
```
Service: Auth Service Swagger
Method:  POST /auth/login
Body:
{
  "email": "admin@example.com",
  "password": "WrongPassword"
}
Expected: 401 Unauthorized - "Invalid email or password"
```

#### Step 6.2: Invalid Email Format
```
Service: Auth Service Swagger
Method:  POST /auth/register
Body:
{
  "email": "not-an-email",
  "password": "Test@123"
}
Expected: 400 Bad Request - Validation error
```

#### Step 6.3: Weak Password
```
Service: Auth Service Swagger
Method:  POST /auth/register
Body:
{
  "email": "weak@example.com",
  "password": "123"
}
Expected: 400 Bad Request - Password too weak
```

#### Step 6.4: Non-existent Resource
```
Service: Orders Service Swagger
Method:  GET /orders/non-existent-id
Expected: 404 Not Found - "Order not found"
```

#### Step 6.5: Missing Required Fields
```
Service: Orders Service Swagger (as manager)
Method:  POST /orders
Body:
{
  "product": "Incomplete Order"
}
Expected: 400 Bad Request - Missing quantity and price
```

---

### 📊 Test Summary Checklist

Use this checklist to track your testing progress:

| # | Test | Endpoint | Expected | ✓ |
|---|------|----------|----------|---|
| 1.1 | Health Check | GET /health | 200 OK | ☐ |
| 1.2 | Public Key | GET /auth/public-key | 200 OK | ☐ |
| 1.3 | Register | POST /auth/register | 201 Created | ☐ |
| 1.4 | Duplicate Register | POST /auth/register | 409 Conflict | ☐ |
| 2.1 | Login | POST /auth/login | 200 OK | ☐ |
| 2.3 | Get Profile | GET /auth/me | 200 OK | ☐ |
| 2.4 | Refresh Token | POST /auth/refresh | 200 OK | ☐ |
| 2.5 | Logout | POST /auth/logout | 200 OK | ☐ |
| 2.6 | Revoked Token | GET /auth/me | 401 Unauthorized | ☐ |
| 3.2 | User: Read Orders | GET /orders | 200 OK | ☐ |
| 3.3 | User: Create Order | POST /orders | 403 Forbidden | ☐ |
| 3.4 | User: Admin Access | GET /admin/users | 403 Forbidden | ☐ |
| 4.2 | Manager: Create | POST /orders | 201 Created | ☐ |
| 4.3 | Manager: Read | GET /orders/{id} | 200 OK | ☐ |
| 4.4 | Manager: Update | PUT /orders/{id} | 200 OK | ☐ |
| 4.5 | Manager: Delete | DELETE /orders/{id} | 200 OK | ☐ |
| 4.7 | Manager: Admin | GET /admin/users | 403 Forbidden | ☐ |
| 5.2 | Admin: Users | GET /admin/users | 200 OK | ☐ |
| 5.3 | Admin: Roles | GET /admin/roles | 200 OK | ☐ |
| 5.4 | Admin: Permissions | GET /admin/permissions | 200 OK | ☐ |
| 5.5 | Admin: Create Perm | POST /admin/permissions | 201 Created | ☐ |
| 5.6 | Admin: Create Role | POST /admin/roles | 201 Created | ☐ |
| 5.7 | Admin: Assign Perm | POST /admin/roles/{id}/permissions | 200 OK | ☐ |
| 5.8 | Admin: Assign Role | POST /admin/users/{id}/roles | 200 OK | ☐ |
| 5.9 | Admin: Disable User | PATCH /admin/users/{id}/status | 200 OK | ☐ |
| 5.10 | Disabled Login | POST /auth/login | 403 Forbidden | ☐ |
| 5.12 | Admin: Audit Logs | GET /admin/audit-logs | 200 OK | ☐ |
| 6.1 | Invalid Login | POST /auth/login | 401 Unauthorized | ☐ |
| 6.4 | Not Found | GET /orders/{bad-id} | 404 Not Found | ☐ |

---

## ❗ Troubleshooting

### Common Errors and Solutions

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| `Not authenticated` | 401 | Missing or expired token | Login again and re-authorize Swagger |
| `Token expired` | 401 | Access token has expired | Use refresh token or login again |
| `Invalid token` | 401 | Malformed token | Check you included "Bearer " prefix |
| `Forbidden` | 403 | Missing permission | Use account with required permission |
| `Admin role required` | 403 | Not an admin | Login as admin@example.com |
| `Not found` | 404 | Invalid ID | Verify the resource ID exists |
| `Already exists` | 409 | Duplicate entry | Resource with same key already exists |
| `Too many requests` | 429 | Rate limited | Wait 15 minutes before retrying |
| `Validation error` | 400 | Invalid input | Check request body format |

### Swagger Not Showing Endpoints?

If you see "No operations defined in spec!":

1. Rebuild containers: `docker-compose down && docker-compose up --build`
2. Clear browser cache and refresh
3. Check container logs: `docker logs auth_service`

### Token Issues

**Problem:** "Authorization header missing"
- **Solution:** Make sure you clicked "Authorize" and entered `Bearer <token>`

**Problem:** Token works in Postman but not Swagger
- **Solution:** Ensure you include "Bearer " (with space) before the token

**Problem:** Token expired during testing
- **Solution:** Use POST /auth/refresh with your refresh token, or login again

### Connection Issues

**Problem:** Cannot connect to localhost:3001
- **Solution:** Check if Docker containers are running: `docker ps`

**Problem:** Services keep restarting
- **Solution:** Check logs: `docker logs auth_service --tail 100`

---

## 🔄 Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOKEN LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN
   POST /auth/login
   ├── Returns: accessToken (15 min) + refreshToken (7 days)
   └── Store both tokens securely

2. USE ACCESS TOKEN
   Authorization: Bearer <accessToken>
   ├── Include in every API request
   └── Valid for 15 minutes

3. TOKEN EXPIRED?
   ├── YES → Go to step 4
   └── NO  → Continue using

4. REFRESH TOKENS
   POST /auth/refresh { refreshToken: "..." }
   ├── Returns: NEW accessToken + NEW refreshToken
   └── Old tokens are invalidated

5. LOGOUT
   POST /auth/logout
   └── Both tokens are blacklisted immediately
```

### Token Expiry Times

| Token Type | Expiry | Use Case |
|------------|--------|----------|
| Access Token | 15 minutes | Short-lived for security |
| Refresh Token | 7 days | Get new access tokens |

---

## 📊 Rate Limiting

The API has rate limiting to prevent abuse:

| Endpoint | Limit | Window | Description |
|----------|-------|--------|-------------|
| POST /auth/login | 10 requests | 15 minutes | Prevents brute-force attacks |
| All other endpoints | 100 requests | 1 minute | General protection |

**When rate limited:**
- You'll receive `429 Too Many Requests`
- Wait for the window to reset
- Consider using exponential backoff in your applications

---

## 🎯 Best Practices

### Security

1. **Never share tokens** - Treat them like passwords
2. **Use HTTPS in production** - Tokens are sensitive data
3. **Implement token refresh** - Don't make users login repeatedly
4. **Logout properly** - Don't just delete tokens client-side

### Development

1. **Test with minimal permissions first** - Verify RBAC works
2. **Use appropriate roles** - Don't give everyone admin access
3. **Check audit logs** - Monitor for suspicious activity
4. **Handle 401/403 gracefully** - Redirect to login or show error

### Swagger Usage

1. **Authorize once per session** - Token persists until page refresh
2. **Copy tokens immediately** - They're not stored
3. **Test happy path first** - Then test error cases
4. **Check response schemas** - Understand what you'll receive

---

## 📚 Additional Resources

### API Endpoints Quick Reference

**Auth Service (localhost:3001)**
```
POST   /auth/register     - Register new user
POST   /auth/login        - Login, get tokens
POST   /auth/refresh      - Refresh tokens
POST   /auth/logout       - Logout, revoke tokens
GET    /auth/me           - Get current user profile
GET    /auth/public-key   - Get JWT public key

GET    /admin/users       - List users (admin)
POST   /admin/users/:id/roles - Assign role (admin)
PATCH  /admin/users/:id/status - Enable/disable user (admin)
GET    /admin/roles       - List roles (admin)
POST   /admin/roles       - Create role (admin)
GET    /admin/permissions - List permissions (admin)
POST   /admin/permissions - Create permission (admin)
GET    /admin/audit-logs  - View audit logs (admin)
```

**Orders Service (localhost:3002)**
```
GET    /orders            - List orders (orders:read)
GET    /orders/:id        - Get order (orders:read)
POST   /orders            - Create order (orders:write)
PUT    /orders/:id        - Update order (orders:write)
DELETE /orders/:id        - Delete order (orders:delete)
```

---

## 📝 System Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Access Token Expiry | 15 minutes | Short-lived for security |
| Refresh Token Expiry | 7 days | Long-lived for convenience |
| Login Rate Limit | 10/15min | Prevents brute-force |
| Global Rate Limit | 100/min | General protection |
| Password Hash Rounds | 12 | bcrypt security level |
| JWT Algorithm | RS256 | RSA with SHA-256 |

---

**Happy Testing! 🚀**

If you encounter issues not covered here, check the container logs:
```bash
docker logs auth_service --tail 100
docker logs orders_service --tail 100
```
