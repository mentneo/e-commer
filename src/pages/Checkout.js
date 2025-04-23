import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

function Checkout() {
  const { currentUser } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);

  // Calculate shipping fee (free over ₹500)
  const shippingFee = subtotal >= 500 || subtotal === 0 ? 0 : 50;
  
  // Calculate total amount
  const totalAmount = subtotal + shippingFee;

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email || '');
      setPhone(currentUser.phoneNumber?.replace('+91', '') || '');
      setName(currentUser.displayName || '');
    }
  }, [currentUser]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !orderId) {
      navigate('/cart');
    }
  }, [cart, navigate, orderId]);

  // Handle address input change
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (paymentMethod === 'online' && !orderId) {
      try {
        setError('');
        setLoading(true);
        
        // Create pending order first
        const orderData = {
          userId: currentUser?.uid || null,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          address: address,
          items: cart,
          subtotal: subtotal,
          shipping: shippingFee,
          total: totalAmount,
          paymentMethod: 'online',
          status: 'pending',
          createdAt: serverTimestamp(),
          paymentStatus: 'pending'
        };
        
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        setOrderId(orderRef.id);
        
        setLoading(false);
        
        // Now initiate PhonePe payment
        initiatePhonePePayment(orderRef.id);
      } catch (err) {
        console.error("Error creating order:", err);
        setError('Failed to create order. Please try again.');
        setLoading(false);
      }
    } else if (paymentMethod === 'cod') {
      try {
        setError('');
        setLoading(true);
        
        // Create order directly for COD
        const orderData = {
          userId: currentUser?.uid || null,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          address: address,
          items: cart,
          subtotal: subtotal,
          shipping: shippingFee,
          total: totalAmount,
          paymentMethod: 'cod',
          status: 'pending',
          createdAt: serverTimestamp(),
          paymentStatus: 'pending'
        };
        
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        
        // Clear cart after successful order
        clearCart();
        
        toast.success('Order placed successfully!');
        navigate(`/orders?success=true&orderId=${orderRef.id}`);
      } catch (err) {
        console.error("Error creating order:", err);
        setError('Failed to place order. Please try again.');
        setLoading(false);
      }
    }
  };

  // Initiate PhonePe payment
  const initiatePhonePePayment = (orderId) => {
    setPaymentLoading(true);
    
    // In a real implementation, you would call your backend API to create a payment request
    // For this demo, we're simulating the payment process
    
    // Simulate a PhonePe payment with mock data
    // In production, you would:
    // 1. Create a backend API endpoint to generate PhonePe payment request
    // 2. The backend would call PhonePe API to create a payment session
    // 3. Return the payment URL or redirect info to the frontend
    
    setTimeout(() => {
      // Simulate payment popup
      const isPaymentSuccessful = window.confirm(
        `Simulate Payment: \n\nAmount: ₹${totalAmount.toFixed(2)}\nPhone: ${phone}\n\nPress OK to simulate successful payment or Cancel to simulate failed payment.`
      );
      
      if (isPaymentSuccessful) {
        handlePaymentSuccess(orderId);
      } else {
        handlePaymentFailure(orderId);
      }
      
      setPaymentLoading(false);
    }, 2000);
  };

  // Handle successful payment
  const handlePaymentSuccess = async (orderId) => {
    try {
      // Update order with payment success details
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'completed',
        transactionId: 'PHONEPAY' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        updatedAt: serverTimestamp()
      });
      
      // Clear cart after successful payment
      clearCart();
      
      toast.success('Payment successful! Order has been placed.');
      navigate(`/orders?success=true&orderId=${orderId}`);
    } catch (err) {
      console.error("Error updating order after payment:", err);
      setError('Payment was successful, but we encountered an issue updating your order status. Please contact customer support.');
    }
  };

  // Handle failed payment
  const handlePaymentFailure = async (orderId) => {
    try {
      // Update order with payment failure details
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'failed',
        updatedAt: serverTimestamp()
      });
      
      toast.error('Payment failed. Please try again or choose a different payment method.');
      setError('Payment failed. You can try again or choose Cash on Delivery.');
    } catch (err) {
      console.error("Error updating order after payment failure:", err);
      setError('Payment failed. Please try again or choose a different payment method.');
    }
  };

  if (paymentLoading) {
    return (
      <>
        <Header />
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <h3 className="mt-3">Processing Payment...</h3>
          <p>Please do not close this window.</p>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Container className="py-5">
        <h1 className="mb-4">Checkout</h1>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Shipping Information</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Street Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="street"
                      value={address.street}
                      onChange={handleAddressChange}
                      required
                    />
                  </Form.Group>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={address.city}
                          onChange={handleAddressChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          type="text"
                          name="state"
                          value={address.state}
                          onChange={handleAddressChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>PIN Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="pincode"
                          value={address.pincode}
                          onChange={handleAddressChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          type="text"
                          name="country"
                          value={address.country}
                          onChange={handleAddressChange}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <h5 className="mt-4 mb-3">Payment Method</h5>
                  
                  <Form.Group className="mb-3">
                    <div className="d-flex">
                      <Form.Check
                        type="radio"
                        id="payment-cod"
                        name="paymentMethod"
                        label="Cash on Delivery"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="me-4"
                      />
                      <Form.Check
                        type="radio"
                        id="payment-phonepay"
                        name="paymentMethod"
                        label="PhonePe / UPI (Number: 9182146476)"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={() => setPaymentMethod('online')}
                      />
                    </div>
                  </Form.Group>
                  
                  <div className="d-grid gap-2 mt-4">
                    <Button
                      type="submit"
                      variant="success"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Processing...
                        </>
                      ) : (
                        `Place Order - Pay ₹${totalAmount.toFixed(2)}`
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="mb-4">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <Card.Body>
                {cart.map(item => (
                  <div key={item.id} className="d-flex justify-content-between mb-2">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <hr />
                
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping:</span>
                  <span>{shippingFee > 0 ? `₹${shippingFee.toFixed(2)}` : 'Free'}</span>
                </div>
                
                <hr />
                
                <div className="d-flex justify-content-between mb-0">
                  <h5>Total:</h5>
                  <h5>₹{totalAmount.toFixed(2)}</h5>
                </div>
              </Card.Body>
            </Card>
            
            {/* PhonePe Logo */}
            {paymentMethod === 'online' && (
              <Card className="border-0 bg-light">
                <Card.Body className="text-center">
                  <img 
                    src="https://www.logo.wine/a/logo/PhonePe/PhonePe-Logo.wine.svg" 
                    alt="PhonePe" 
                    style={{ height: '60px' }}
                  />
                  <p className="small text-muted mb-0">
                    Secure payments powered by PhonePe
                  </p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
}

export default Checkout;
