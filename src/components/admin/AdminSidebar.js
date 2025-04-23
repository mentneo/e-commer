import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { FaTachometerAlt, FaBox, FaShoppingCart, FaTag, FaUsers, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/super-admin-secret-login-portal');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="bg-dark text-white" style={{ width: '250px', minHeight: '100vh', position: 'sticky', top: 0 }}>
      <div className="p-4">
        <h3 className="mb-4">Admin Panel</h3>
        <Nav className="flex-column">
          <Nav.Item>
            <Link to="/admin/dashboard" className="nav-link text-white">
              <FaTachometerAlt className="me-2" /> Dashboard
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/admin/products" className="nav-link text-white">
              <FaBox className="me-2" /> Products
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/admin/orders" className="nav-link text-white">
              <FaShoppingCart className="me-2" /> Orders
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/admin/discounts" className="nav-link text-white">
              <FaTag className="me-2" /> Discounts
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/admin/customers" className="nav-link text-white">
              <FaUsers className="me-2" /> Customers
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/admin/notifications" className="nav-link text-white">
              <FaBell className="me-2" /> Notifications
            </Link>
          </Nav.Item>
          <hr />
          <Nav.Item>
            <button 
              onClick={handleLogout} 
              className="nav-link text-white bg-transparent border-0"
            >
              <FaSignOutAlt className="me-2" /> Logout
            </button>
          </Nav.Item>
        </Nav>
      </div>
    </div>
  );
}

export default AdminSidebar;
