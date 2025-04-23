import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

function AdminHeader({ title }) {
  const { currentUser } = useAuth();

  return (
    <Container fluid className="bg-light py-3 border-bottom">
      <Row>
        <Col>
          <h1 className="h3 mb-0">{title}</h1>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <span className="me-3">Welcome, Admin</span>
          <img 
            src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=Admin&background=random`} 
            alt="Admin" 
            className="rounded-circle" 
            style={{ width: '40px', height: '40px' }} 
          />
        </Col>
      </Row>
    </Container>
  );
}

export default AdminHeader;
