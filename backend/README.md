# Car Wash Backend

Backend service for the Car Wash application.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file in the root directory using `.env.example` as a template.

3. Make sure MongoDB is running locally or update your `.env` file with the correct MongoDB URI.

## Seeding the Database

To populate the database with test data:

```
npm run seed
```

This will create:

- 1 admin user
- 3 customer users
- 8 car wash services
- 15 bookings (5 for each customer)

### Test User Credentials

**Admin User:**

- Phone: 111222333
- Password: password123

**Customer User:**

- Phone: 123456789
- Password: password123

## Running the Application

Development mode:

```
npm run dev
```

Production mode:

```
npm start
```

## API Routes

The API is organized into the following sections:

- `/api/auth` - Authentication endpoints
- `/api/admin` - Admin-only endpoints
- `/api/customer` - Customer endpoints
