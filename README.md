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
- **Storage:** Firebase Storage
- **Hosting:** Firebase Hosting
- **Messaging:** Firebase Cloud Messaging
- **Payment Integration:** PhonePe UPI

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

