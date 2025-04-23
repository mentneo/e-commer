# Supermarket eCommerce Web Application

A fully functional eCommerce web application for a supermarket built with React and Firebase.

## Features

### Customer Panel
- User authentication with email/password and phone number OTP
- Browse products by category and search functionality
- Add to cart functionality
- Online payment (PhonePe UPI) and Cash on Delivery options
- Order tracking
- User profile management

### Admin Panel
- Secure admin login
- Dashboard with analytics
- Product management (add, update, delete)
- Order management with status updates
- Customer management
- Discount/coupon management
- Notification system for SMS and push notifications

## Technology Stack

- **Frontend:** React.js with React Bootstrap
- **State Management:** React Context API
- **Backend & Database:** Firebase (Firestore)
- **Authentication:** Firebase Authentication
- **Image Storage:** Cloudinary
- **Hosting:** Vercel
- **Messaging:** Firebase Cloud Messaging
- **Payment Integration:** PhonePe UPI

## Deployment

This application is deployed using Vercel. For detailed deployment instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

## Getting Started

### Prerequisites
- Node.js and npm installed
- Firebase account
- PhonePe business account (for production)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd supermarket-ecommerce
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
   - Update the Firebase configuration in `src/firebase.js` with your credentials

4. Start the development server
```bash
npm start
```

### Deployment

```bash
npm run build
firebase deploy
```

## Project Structure

## Firebase Setup Instructions

To fix the current issues with Firebase permissions and storage access, follow these steps:

### 1. Deploy Firestore Rules

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 2. Deploy Storage Rules

```bash
# Deploy Storage rules
firebase deploy --only storage:rules
```

### 3. Configure CORS for Firebase Storage

```bash
# Install gsutil (Google Cloud Storage utility)
# Then configure CORS for your bucket
gsutil cors set cors.json gs://ecommer-3efa3.appspot.com
```

### 4. Create Required Firestore Indexes

Visit the following URL to create the required index for user queries:
https://console.firebase.google.com/v1/r/project/ecommer-3efa3/firestore/indexes?create_composite=Cktwcm9qZWN0cy9lY29tbWVyLTNlZmEzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy91c2Vycy9pbmRleGVzL18QARoICgRyb2xlEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

### 5. Admin Login

Use the following credentials for admin login:
- Email: [create a new account first]
- Password: [your account password]
- Admin Secret Key: "your-super-secret-admin-key"

## Cloudinary Configuration

The application uses Cloudinary for image storage with the following configuration:
- Cloud name: dp8bfdbab
- Upload preset: cryptchat

## Running the Application

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

# Chart.js dependency installation

To use the admin dashboard charts, you need to install Chart.js:

```bash
npm install chart.js
```

Or if you're using yarn:

```bash
yarn add chart.js
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

