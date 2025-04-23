import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Accordion, Table, Button, Alert, Spinner, Nav } from 'react-bootstrap';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaBoxOpen, FaTruck, FaMapMarkerAlt, FaPhoneAlt, FaCheckCircle, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [indexCreating, setIndexCreating] = useState(false);
  const { currentUser } = useAuth();

  // Status badge colors
  const statusColors = {
    'pending': 'warning',
    'processing': 'info',
    'shipped': 'primary',
    'delivered': 'success',
    'cancelled': 'danger'
  };

  // Tracking steps based on order status
  const trackingSteps = [
    { status: 'pending', label: 'Order Placed', icon: <FaShoppingBag /> },
    { status: 'processing', label: 'Processing', icon: <FaBoxOpen /> },
    { status: 'shipped', label: 'Shipped', icon: <FaTruck /> },
    { status: 'delivered', label: 'Delivered', icon: <FaCheckCircle /> }
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Try fetching with simpler query first (without orderBy) to avoid index errors for first-time users
        let ordersData = [];
        try {
          const simpleQuery = query(
            collection(db, 'orders'),
            where('userId', '==', currentUser.uid)
          );
          
          const querySnapshot = await getDocs(simpleQuery);
          querySnapshot.forEach((doc) => {
            ordersData.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            });
          });
          
          // Sort client-side since we didn't use orderBy
          ordersData.sort((a, b) => b.createdAt - a.createdAt);
          
        } catch (simpleQueryError) {
          console.error("Simple query failed, trying with orderBy:", simpleQueryError);
          
          try {
            // Try with orderBy - requires the composite index
            const complexQuery = query(
              collection(db, 'orders'),
              where('userId', '==', currentUser.uid),
              orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(complexQuery);
            ordersData = [];
            querySnapshot.forEach((doc) => {
              ordersData.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
              });
            });
          } catch (complexQueryError) {
            console.error("Complex query failed:", complexQueryError);
            throw complexQueryError;
          }
        }
        
        // Format dates for display
        ordersData = ordersData.map(order => ({
          ...order,
          createdAtDisplay: formatDate(order.createdAt)
        }));
        
        setOrders(ordersData);
        
        // Set the first order as selected by default if available
        if (ordersData.length > 0) {
          setSelectedOrder(ordersData[0]);
        }
        
        setError('');
        setIndexCreating(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        
        // Check if the error is related to missing index
        if (err.message && err.message.includes('index')) {
          setIndexCreating(true);
          setError('The necessary database index is being created. This may take a few minutes. Please check back soon.');
        } else {
          setError('Failed to load your orders. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [currentUser]);

  // Format the order date
  const formatDate = (dateObj) => {
    if (!dateObj) return 'Unknown date';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return dateObj instanceof Date 
        ? dateObj.toLocaleDateString(undefined, options)
        : new Date(dateObj).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Date formatting error:", e);
      return String(dateObj);
    }
  };

  // Get the current step index based on order status
  const getCurrentStepIndex = (status) => {
    if (status === 'cancelled') return -1;
    return trackingSteps.findIndex(step => step.status === status);
  };

  // Handle selecting an order for details view
  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
  };

  // Track order delivery status
  const OrderTracking = ({ order }) => {
    const currentStepIndex = getCurrentStepIndex(order.status);
    
    if (order.status === 'cancelled') {
      return (
        <Alert variant="danger" className="mt-3">
          <FaInfoCircle className="me-2" /> This order has been cancelled.
        </Alert>
      );
    }
    
    return (
      <div className="order-tracking mt-4">
        <h5 className="mb-3">Order Tracking</h5>
        <div className="d-flex justify-content-between position-relative tracking-steps my-4">
          {/* Progress bar */}
          <div 
            className="tracking-progress-bar"
            style={{ 
              width: `${currentStepIndex >= 0 ? (currentStepIndex / (trackingSteps.length - 1)) * 100 : 0}%` 
            }}
          ></div>
          
          {/* Steps */}
          {trackingSteps.map((step, index) => (
            <div 
              key={step.status} 
              className={`tracking-step ${index <= currentStepIndex ? 'completed' : ''}`}
            >
              <div className="step-icon">
                {step.icon}
              </div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>
        
        {/* Delivery Information */}
        {order.status === 'shipped' && order.delivery && (
          <Card className="mt-3 delivery-card">
            <Card.Body>
              <Card.Title className="delivery-title">
                <FaTruck className="me-2 text-primary" /> Delivery Information
              </Card.Title>
              <div className="delivery-info mt-3">
                <Row>
                  <Col md={6}>
                    <div className="info-item">
                      <span className="info-label">Delivery Partner:</span>
                      <span className="info-value">{order.delivery.partnerName || 'Not assigned yet'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label"><FaPhoneAlt className="text-success" /> Agent Contact:</span>
                      <span className="info-value">{order.delivery.agentPhone || 'Not available yet'}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="info-item">
                      <span className="info-label">Expected Delivery:</span>
                      <span className="info-value">{formatDate(order.delivery.expectedDelivery) || 'Estimating...'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Tracking ID:</span>
                      <span className="info-value">{order.delivery.trackingId || 'Not available yet'}</span>
                    </div>
                  </Col>
                </Row>
                {order.delivery.trackingUrl && (
                  <div className="text-center mt-3">
                    <Button 
                      variant="outline-primary" 
                      href={order.delivery.trackingUrl}
                      target="_blank"
                      className="tracking-btn"
                    >
                      <FaMapMarkerAlt className="me-1" /> Track Your Package
                    </Button>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    );
  };

  // Fix the Payment Information section in the Accordion
  const PaymentInformation = ({ order }) => (
    <div className="payment-info">
      <div className="payment-method mb-3">
        <h6>Payment Method</h6>
        <p>
          {order.payment.method === 'cod' 
            ? '💵 Cash on Delivery' 
            : '💳 Online Payment'}
        </p>
        <p>
          Status: <Badge 
            bg={order.payment.status === 'completed' ? 'success' : 'warning'}
          >
            {order.payment.status}
          </Badge>
        </p>
      </div>
      
      <div className="order-summary">
        <h6>Order Summary</h6>
        <div className="summary-item">
          <span>Subtotal:</span>
          <span>₹{order.amounts.subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span>Shipping:</span>
          <span>₹{order.amounts.shipping.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span>Tax:</span>
          <span>₹{order.amounts.tax.toFixed(2)}</span>
        </div>
        <div className="summary-item total">
          <span>Total:</span>
          <span>₹{order.amounts.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  // Show loading spinner
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="loading-spinner">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your orders...</p>
        </div>
      </Container>
    );
  }

  // Show index creation message
  if (indexCreating) {
    return (
      <Container className="py-5">
        <Alert variant="info" className="index-creating-alert">
          <h4><FaInfoCircle className="me-2" /> Setting Up Your Order History</h4>
          <p>We're preparing your order history view for the first time. This may take a few minutes.</p>
          <p>Please try again in a moment.</p>
          <div className="mt-3">
            <Button variant="primary" as={Link} to="/">
              <FaArrowLeft className="me-2" /> Go to Homepage
            </Button>
            <Button variant="outline-primary" className="ms-2" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="orders-header mb-4">
        <h2 className="orders-title">My Orders</h2>
        <p className="text-muted">View and track all your orders</p>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {orders.length === 0 ? (
        <Card className="text-center p-5 no-orders-card">
          <Card.Body>
            <div className="empty-orders-icon">
              <FaShoppingBag size={60} className="text-muted mb-3" />
            </div>
            <Card.Title className="mb-3">No orders found</Card.Title>
            <Card.Text className="mb-4">
              You haven't placed any orders yet. Start shopping to place your first order!
            </Card.Text>
            <Button 
              variant="primary" 
              as={Link} 
              to="/products"
              size="lg"
              className="shop-now-btn"
            >
              Start Shopping
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          <Col lg={4}>
            <Card className="mb-4 mb-lg-0 orders-list-card">
              <Card.Header className="orders-list-header">
                <h5 className="mb-0">Order History</h5>
              </Card.Header>
              <Nav className="order-list" variant="pills" defaultActiveKey={orders[0]?.id}>
                {orders.map(order => (
                  <Nav.Item key={order.id} className="order-nav-item">
                    <Nav.Link 
                      eventKey={order.id}
                      className={`order-item p-3 ${selectedOrder?.id === order.id ? 'active' : ''}`}
                      onClick={() => handleSelectOrder(order)}
                    >
                      <div className="d-flex justify-content-between">
                        <div>
                          <p className="mb-0 fw-bold">Order #{order.id.substring(0, 8)}</p>
                          <small>{order.createdAtDisplay}</small>
                        </div>
                        <div>
                          <Badge bg={statusColors[order.status] || 'secondary'} className="status-badge">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <small>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</small>
                        <p className="mb-0 fw-bold">₹{order.amounts.total.toFixed(2)}</p>
                      </div>
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </Card>
          </Col>
          
          <Col lg={8}>
            {selectedOrder ? (
              <Card className="order-details-card">
                <Card.Header className="order-details-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Order #{selectedOrder.id.substring(0, 8)}</h5>
                    <Badge 
                      bg={statusColors[selectedOrder.status] || 'secondary'} 
                      className="py-2 px-3 status-badge-lg"
                    >
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </Badge>
                  </div>
                  <small className="text-muted">Placed on {selectedOrder.createdAtDisplay}</small>
                </Card.Header>
                <Card.Body>
                  {/* Order Tracking */}
                  <OrderTracking order={selectedOrder} />
                  
                  {/* Order Info */}
                  <Accordion defaultActiveKey="0" className="mt-4 order-accordion">
                    <Accordion.Item eventKey="0" className="order-accordion-item">
                      <Accordion.Header>Items in your order</Accordion.Header>
                      <Accordion.Body>
                        <Table responsive className="mb-0 order-items-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {item.image && (
                                      <img 
                                        src={item.image} 
                                        alt={item.name}
                                        width="50"
                                        height="50"
                                        className="me-2 rounded product-thumbnail"
                                      />
                                    )}
                                    <span className="product-name">{item.name}</span>
                                  </div>
                                </td>
                                <td className="text-center">{item.quantity}</td>
                                <td>₹{item.price.toFixed(2)}</td>
                                <td className="fw-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                    
                    <Accordion.Item eventKey="1" className="order-accordion-item">
                      <Accordion.Header>Shipping Information</Accordion.Header>
                      <Accordion.Body>
                        <div className="shipping-info">
                          <Row>
                            <Col md={6}>
                              <div className="info-group">
                                <h6>Contact Information</h6>
                                <p><strong>Name:</strong> {selectedOrder.shipping.fullName}</p>
                                <p><strong>Email:</strong> {selectedOrder.shipping.email}</p>
                                <p><strong>Phone:</strong> {selectedOrder.shipping.phone}</p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="info-group">
                                <h6>Delivery Address</h6>
                                <p>{selectedOrder.shipping.address}</p>
                                <p>{selectedOrder.shipping.city}, {selectedOrder.shipping.state}</p>
                                <p>PIN: {selectedOrder.shipping.postalCode}</p>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                    
                    <Accordion.Item eventKey="2" className="order-accordion-item">
                      <Accordion.Header>Payment Information</Accordion.Header>
                      <Accordion.Body>
                        <PaymentInformation order={selectedOrder} />
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                  
                  {/* Support Section */}
                  <div className="mt-4 text-center support-section">
                    <p>Need help with this order?</p>
                    <Button 
                      variant="outline-primary" 
                      as={Link}
                      to="/support"
                      className="support-btn"
                    >
                      Contact Support
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <Card className="text-center p-5 select-order-card">
                <Card.Body>
                  <Card.Text>
                    Select an order from the left to view details
                  </Card.Text>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Orders;
