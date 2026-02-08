# Akulas Backend API

Bus Line Accounting and Management System Backend API built with Node.js, Express, and Firebase Firestore.

## 🚀 Features

- **Vehicle Management (CRUD)**: Manage vehicles with plate numbers, bus numbers, line assignments, owner info, and IBAN details
- **Daily Records**: Create and manage daily accounting records (Weekly/Credit Card types)
- **Comprehensive Reporting**: Date range reports, vehicle-specific reports, line reports, and summary statistics
- **Firebase Authentication**: Secure Firebase token verification
- **Role-Based Access Control**: Three user roles (Admin, Supervisor, Desk)
- **Professional Error Handling**: Centralized error handling with custom error classes
- **Input Validation**: Request validation using express-validator
- **Security**: Helmet, CORS, compression, and rate limiting
- **Pure Node.js**: Clean JavaScript codebase with ES6+ features

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Firebase project with Firestore enabled
- Firebase Admin SDK service account key

## 🛠️ Installation

1. **Clone the repository and install dependencies:**

```bash
cd backend
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
- Set `PORT` to 3003
- Configure `CORS_ORIGIN` with your frontend URLs
- Set `FIREBASE_PROJECT_ID`
- Set `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` to your service account key file path

3. **Add Firebase Service Account Key:**

Download your Firebase service account key JSON file from Firebase Console:
- Go to Project Settings > Service Accounts
- Click "Generate New Private Key"
- Save the file as `serviceAccountKey.json` in the project root (or update the path in `.env`)

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3003` with hot-reload enabled.

### Production Mode

```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3003/api/v1
```

### Authentication

All routes (except health check) require Firebase authentication token in the header:

```
Authorization: Bearer <firebase-id-token>
```

### User Roles

- **admin**: Full access to all operations
- **supervisor**: Can manage vehicles and records, view reports
- **desk**: Can create records and view data

### Endpoints

#### Health Check
```
GET /api/v1/health
```

#### Vehicles

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/vehicles` | All | Get all vehicles |
| GET | `/vehicles/:id` | All | Get vehicle by ID |
| GET | `/vehicles/line/:lineName` | All | Get vehicles by line name |
| POST | `/vehicles` | Admin, Supervisor | Create new vehicle |
| PUT | `/vehicles/:id` | Admin, Supervisor | Update vehicle |
| DELETE | `/vehicles/:id` | Admin | Delete vehicle |

**Vehicle Request Body:**
```json
{
  "plateNumber": "34ABC123",
  "busNumber": "5",
  "lineName": "Makas",
  "ownerName": "John Doe",
  "iban": "TR330006100519786457841326",
  "contactInfo": "+90 555 123 4567"
}
```

#### Records

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/records` | All | Get all records (with filters) |
| GET | `/records/:id` | All | Get record by ID |
| GET | `/records/date/:date` | All | Get records by date |
| POST | `/records` | Admin, Supervisor, Desk | Create new record |
| PUT | `/records/:id` | Admin, Supervisor | Update record |
| DELETE | `/records/:id` | Admin | Delete record |

**Record Request Body:**
```json
{
  "date": "2026-01-10",
  "type": "WEEKLY",
  "lineValues": {
    "Makas": 15000,
    "Sanayi": 12000
  },
  "vehicleValues": {
    "5": 3000,
    "6": 2500
  },
  "raporalAmount": 30000,
  "systemAmount": 29500
}
```

**Query Parameters for GET /records:**
- `startDate`: Filter by start date (YYYY-MM-DD)
- `endDate`: Filter by end date (YYYY-MM-DD)
- `type`: Filter by type (WEEKLY or CREDIT_CARD)

#### Reports

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/reports/date-range?startDate=X&endDate=Y` | All | Get records in date range |
| GET | `/reports/summary` | All | Get summary statistics |
| GET | `/reports/vehicle/:id` | All | Get vehicle report |
| GET | `/reports/line/:lineName` | All | Get line report |

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── firebase.js          # Firebase initialization
│   │   └── index.js             # App configuration
│   ├── constants/
│   │   └── enums.js             # Enums (UserRole, RecordType)
│   ├── controllers/
│   │   ├── vehicle.controller.js
│   │   ├── record.controller.js
│   │   └── report.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Firebase token verification
│   │   ├── error.middleware.js  # Error handling
│   │   └── validation.middleware.js
│   ├── routes/
│   │   ├── vehicle.routes.js
│   │   ├── record.routes.js
│   │   ├── report.routes.js
│   │   └── index.js
│   ├── utils/
│   │   ├── errors.js            # Custom error classes
│   │   └── response.js          # Response helpers
│   ├── validators/
│   │   ├── vehicle.validator.js
│   │   ├── record.validator.js
│   │   └── report.validator.js
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Firestore Collections

### users
```javascript
{
  uid: string,
  email: string,
  role: 'admin' | 'supervisor' | 'desk',
  name: string,
  createdAt: Date,
  updatedAt: Date
}
```

### vehicles
```javascript
{
  id: string,
  plateNumber: string,
  busNumber: string | number,
  lineName: string,
  ownerName: string,
  iban: string,
  contactInfo: string (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### daily_records
```javascript
{
  id: string,
  date: string,
  type: 'WEEKLY' | 'CREDIT_CARD',
  lineValues: Object,
  vehicleValues: Object,
  raporalAmount: number,
  systemAmount: number,
  difference: number,
  createdAt: Date,
  createdBy: string
}
```

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Firebase Auth**: Token-based authentication
- **Role-Based Access Control**: Granular permissions
- **Input Validation**: Request validation and sanitization
- **Rate Limiting**: Prevent abuse (configurable)

## 📝 Scripts

- `npm run dev` - Start development server with hot-reload (nodemon)
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 🔧 Environment Variables

See `.env.example` for all available configuration options.

## 📄 License

ISC

## 🤝 Support

For issues and questions, please create an issue in the repository.

---

**Important Notes:**

1. **Never commit your `.env` file or Firebase service account key to version control**
2. **Set up proper Firestore security rules in Firebase Console**
3. **Configure CORS_ORIGIN properly for production**
4. **Use environment-specific Firebase projects for dev/staging/production**
