import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <Container>
        <Row>
          <Col md={4} className="mb-4 mb-md-0">
            <h5>Supermarket</h5>
            <p className="mt-3">
              Your one-stop shop for all grocery and household needs. We deliver quality products at affordable prices.
            </p>
            <div className="d-flex mt-4">
              <a href="#" className="text-light me-3"><FaFacebook size={24} /></a>
              <a href="#" className="text-light me-3"><FaTwitter size={24} /></a>
              <a href="#" className="text-light"><FaInstagram size={24} /></a>
            </div>
          </Col>
          
          <Col md={4} className="mb-4 mb-md-0">
            <h5>Quick Links</h5>
            <ul className="list-unstyled mt-3">
              <li className="mb-2"><Link to="/" className="text-light text-decoration-none">Home</Link></li>
              <li className="mb-2"><Link to="/products" className="text-light text-decoration-none">Products</Link></li>
              <li className="mb-2"><Link to="/cart" className="text-light text-decoration-none">Cart</Link></li>
              <li className="mb-2"><Link to="/login" className="text-light text-decoration-none">Login</Link></li>
              <li><Link to="/register" className="text-light text-decoration-none">Register</Link></li>
            </ul>
          </Col>
          
          <Col md={4}>
            <h5>Contact Us</h5>
            <ul className="list-unstyled mt-3">
              <li className="mb-2"><FaMapMarkerAlt className="me-2" /> 123 Market Street, Anytown, India</li>
              <li className="mb-2"><FaPhone className="me-2" /> +91 9182146476</li>
              <li className="mb-2"><FaEnvelope className="me-2" /> info@supermarket.com</li>
            </ul>
          </Col>
        </Row>
        
        <hr className="mt-4 mb-4" />
        
        <Row>
          <Col className="text-center">
            <p className="mb-0">© {new Date().getFullYear()} Supermarket. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
