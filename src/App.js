import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';
import './styles/Admin.css';

// Customer Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';

// Admin Pages
import SecretAdminLogin from './pages/admin/SecretAdminLogin';
import Dashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import DiscountManagement from './pages/admin/DiscountManagement';
import NotificationCenter from './pages/admin/NotificationCenter';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Routes with Header & Footer */}
            <Route path="/" element={
              <>
                <Header />
                <Home />
                <Footer />
              </>
            } />
            <Route path="/login" element={
              <>
                <Header />
                <Login />
                <Footer />
              </>
            } />
            <Route path="/register" element={
              <>
                <Header />
                <Register />
                <Footer />
              </>
            } />
            <Route path="/products" element={
              <>
                <Header />
                <Products />
                <Footer />
              </>
            } />
            <Route path="/product/:id" element={
              <>
                <Header />
                <ProductDetail />
                <Footer />
              </>
            } />
            
            {/* Protected Customer Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/cart" element={
                <>
                  <Header />
                  <Cart />
                  <Footer />
                </>
              } />
              <Route path="/checkout" element={
                <>
                  <Header />
                  <Checkout />
                  <Footer />
                </>
              } />
              <Route path="/orders" element={
                <>
                  <Header />
                  <Orders />
                  <Footer />
                </>
              } />
              <Route path="/profile" element={
                <>
                  <Header />
                  <Profile />
                  <Footer />
                </>
              } />
            </Route>
            
            {/* Secret Admin Login */}
            <Route path="/super-admin-secret-login-portal" element={<SecretAdminLogin />} />
            
            {/* Admin Routes with AdminLayout */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/products" element={<ProductManagement />} />
              <Route path="/admin/orders" element={<OrderManagement />} />
              <Route path="/admin/customers" element={<CustomerManagement />} />
              <Route path="/admin/discounts" element={<DiscountManagement />} />
              <Route path="/admin/notifications" element={<NotificationCenter />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
