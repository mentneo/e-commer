import React from 'react';
import { Navbar, Container, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaStore, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import './Header.css';

function Header() {
  const { currentUser, logout, userRole } = useAuth();
  const { itemsCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">Supermarket</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/products">Products</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/cart" className="cart-icon-container">
              <FaShoppingCart size={20} />
              {itemsCount > 0 && (
                <Badge 
                  bg="danger" 
                  pill 
                  className="cart-badge"
                >
                  {itemsCount}
                </Badge>
              )}
            </Nav.Link>
            
            {currentUser ? (
              <NavDropdown 
                title={
                  <span>
                    <FaUser className="me-1" /> 
                    {currentUser.displayName || currentUser.email || currentUser.phoneNumber || 'User'}
                  </span>
                } 
                id="basic-nav-dropdown"
                className="user-dropdown"
              >
                {userRole === 'admin' && (
                  <NavDropdown.Item as={Link} to="/admin/dashboard">
                    <FaStore /> Admin Dashboard
                  </NavDropdown.Item>
                )}
                <NavDropdown.Item as={Link} to="/profile">
                  <FaUser /> Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/orders">
                  <FaClipboardList /> My Orders
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
