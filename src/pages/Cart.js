import React from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

function Cart() {
  const { cart, loading, error, removeFromCart, updateQuantity, calculateTotal, itemsCount } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <Container className="my-5">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your cart...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="my-5">
      <h2 className="mb-4">Your Shopping Cart</h2>
      
      {error && (
        <Alert variant="warning">
          {error}
        </Alert>
      )}
      
      {itemsCount === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <FaShoppingCart size={50} className="text-muted mb-3" />
            <Card.Title>Your cart is empty</Card.Title>
            <Card.Text>
              Looks like you haven't added anything to your cart yet.
            </Card.Text>
            <Link to="/products" className="btn btn-primary mt-3">
              <FaArrowLeft className="me-2" /> Continue Shopping
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Cart Items ({itemsCount})</h5>
                </Card.Header>
                <Card.Body>
                  {cart.map(item => (
                    <Row key={item.id} className="mb-4 border-bottom pb-4">
                      <Col xs={3} md={2}>
                        <img 
                          src={item.image || '/placeholder.jpg'} 
                          alt={item.name} 
                          className="img-fluid rounded"
                          style={{ maxHeight: '80px', objectFit: 'contain' }}
                        />
                      </Col>
                      <Col xs={9} md={5}>
                        <h6 className="text-truncate">{item.name}</h6>
                        <p className="text-muted small mb-0">
                          Price: ₹{item.price.toLocaleString()}
                        </p>
                      </Col>
                      <Col xs={6} md={3} className="mt-3 mt-md-0">
                        <div className="d-flex align-items-center">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          >
                            -
                          </Button>
                          <Form.Control
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="text-center mx-2"
                            style={{ width: '60px' }}
                          />
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </Col>
                      <Col xs={6} md={2} className="text-end mt-3 mt-md-0">
                        <p className="fw-bold mb-2">₹{(item.price * item.quantity).toLocaleString()}</p>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <FaTrash /> Remove
                        </Button>
                      </Col>
                    </Row>
                  ))}
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Order Summary</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Subtotal:</span>
                    <span>₹{calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Shipping:</span>
                    <span>₹{(calculateTotal() > 999 ? 0 : 49).toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Tax (GST 18%):</span>
                    <span>₹{(calculateTotal() * 0.18).toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-3 fw-bold">
                    <span>Total:</span>
                    <span>₹{(calculateTotal() + (calculateTotal() > 999 ? 0 : 49) + calculateTotal() * 0.18).toLocaleString()}</span>
                  </div>
                  
                  <Button 
                    variant="primary" 
                    className="w-100 mt-3"
                    onClick={() => {
                      if (currentUser) {
                        navigate('/checkout');
                      } else {
                        navigate('/login', { state: { from: '/checkout' } });
                      }
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Link to="/products" className="btn btn-outline-secondary w-100 mt-3">
                    <FaArrowLeft className="me-2" /> Continue Shopping
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}

export default Cart;
