import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';

function SecretAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, currentUser, userRole, checkUserRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as admin
    if (currentUser && userRole === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      // Attempt login
      await login(email, password);
      
      // Check if user has admin role
      const role = await checkUserRole(currentUser.uid);
      
      if (role !== 'admin') {
        // Log out if not admin
        throw new Error('Unauthorized access. This portal is for admins only.');
      }
      
      toast.success('Admin login successful');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Admin Portal</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </Form.Group>
              
              <Form.Group id="password" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </Form.Group>
              
              <Button 
                disabled={loading} 
                className="w-100" 
                type="submit"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

export default SecretAdminLogin;
