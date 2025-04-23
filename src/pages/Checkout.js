import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaCreditCard, FaMoneyBill, FaCheckCircle } from 'react-icons/fa';

function Checkout() {
  const { currentUser } = useAuth();
  const { cart, calculateTotal, clearCart, itemsCount } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    paymentMethod: 'cod'
  });
  
  // Calculate order amounts
  const subtotal = calculateTotal() || 0; // Ensure subtotal is never undefined
  const shipping = subtotal > 999 ? 0 : 49;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;
  
  // Redirect if cart is empty
  useEffect(() => {
    if (itemsCount === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [itemsCount, orderSuccess, navigate]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to place an order');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Validate form data
      if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Create order object
      const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null
        })),
        shipping: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode
        },
        payment: {
          method: formData.paymentMethod,
          status: formData.paymentMethod === 'cod' ? 'pending' : 'processing'
        },
        amounts: {
          subtotal,
          shipping,
          tax,
          total
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add order to Firestore
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      setOrderId(orderRef.id);
      setOrderSuccess(true);
      clearCart();
      
      toast.success('Order placed successfully!', {
        position: 'top-right',
        autoClose: 3000
      });
      
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Display order success message
  if (orderSuccess) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <FaCheckCircle size={60} className="text-success mx-auto mb-4" />
          <Card.Body>
            <Card.Title as="h2">Order Placed Successfully!</Card.Title>
            <Card.Text>
              Thank you for your order. Your order ID is: <strong>{orderId}</strong>
            </Card.Text>
            <Card.Text>
              We have sent a confirmation email to <strong>{formData.email}</strong>
            </Card.Text>
            <Card.Text>
              Payment Method: <strong>{formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</strong>
            </Card.Text>
            <Button 
              variant="primary" 
              className="mt-3"
              onClick={() => navigate('/orders')}
            >
              View Your Orders
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Checkout</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Header>
                <h4 className="mb-0">Shipping Information</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name*</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email*</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number*</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Postal Code*</Form.Label>
                      <Form.Control
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Address*</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City*</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State*</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            <Card className="mb-4">
              <Card.Header>
                <h4 className="mb-0">Payment Method</h4>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                  <div className="mb-3">
                    <Form.Check
                      type="radio"
                      id="cod"
                      name="paymentMethod"
                      value="cod"
                      label={
                        <span>
                          <FaMoneyBill className="me-2" /> Cash on Delivery
                        </span>
                      }
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Form.Check
                      type="radio"
                      id="online"
                      name="paymentMethod"
                      value="online"
                      label={
                        <span>
                          <FaCreditCard className="me-2" /> Pay Online (UPI, Card, NetBanking)
                        </span>
                      }
                      checked={formData.paymentMethod === 'online'}
                      onChange={handleInputChange}
                    />
                    {formData.paymentMethod === 'online' && (
                      <div className="mt-3 ms-4">
                        <p className="text-muted">
                          You will be redirected to the payment gateway after order confirmation.
                        </p>
                      </div>
                    )}
                  </div>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="mb-4">
              <Card.Header>
                <h4 className="mb-0">Order Summary</h4>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  {cart.map(item => (
                    <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-bold">{item.quantity} x </span>
                        {item.name}
                      </div>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
              <Card.Footer>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping:</span>
                  <span>₹{shipping.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Tax (18%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                
                <div className="d-grid gap-2 mt-4">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}

export default Checkout;
