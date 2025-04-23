import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaChartLine, FaBoxOpen, FaShoppingCart, FaUsers, FaPercent, FaBell, FaCog, FaHome } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

function AdminLayout({ children }) {
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const menuItems = [
    { path: '/admin/dashboard', icon: <FaChartLine />, label: 'Dashboard' },
    { path: '/admin/products', icon: <FaBoxOpen />, label: 'Products' },
    { path: '/admin/orders', icon: <FaShoppingCart />, label: 'Orders' },
    { path: '/admin/customers', icon: <FaUsers />, label: 'Customers' },
    { path: '/admin/discounts', icon: <FaPercent />, label: 'Discounts' },
    { path: '/admin/notifications', icon: <FaBell />, label: 'Notifications' },
    { path: '/admin/settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        {/* Sidebar */}
        <Col lg={2} md={3} className="p-0">
          <div className="admin-sidebar py-4">
            <div className="brand text-center text-white mb-4">
              <h4>Admin Panel</h4>
              <small className="text-muted">
                {currentUser?.email || 'Admin User'}
              </small>
            </div>
            
            <Nav className="flex-column px-3">
              <Nav.Link 
                as={Link} 
                to="/" 
                className="mb-2 d-flex align-items-center"
              >
                <FaHome className="me-2" /> Main Site
              </Nav.Link>
              
              <div className="my-2 sidebar-divider"></div>
              
              {menuItems.map((item) => (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={item.path}
                  className={`mb-2 d-flex align-items-center ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="me-2">{item.icon}</span> {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </div>
        </Col>
        
        {/* Main Content */}
        <Col lg={10} md={9} className="p-0 admin-content bg-light min-vh-100">
          <div className="admin-header bg-white shadow-sm p-3">
            <h1 className="h3 mb-0">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
            </h1>
          </div>
          <div className="p-4">
            {children}
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminLayout;
