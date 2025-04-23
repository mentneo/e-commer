import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Button, Table, Alert, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaCheckCircle, FaBox, FaTruck, FaHome } from 'react-icons/fa';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { currentUser } = useAuth();
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isSuccess = queryParams.get('success') === 'true';
  const highlightedOrderId = queryParams.get('orderId');

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toLocaleString() || new Date().toLocaleString()
      }));
      
      setOrders(ordersData);
      
      // If there's a highlighted order, pre-select it
      if (highlightedOrderId) {
        const highlightedOrder = ordersData.find(order => order.id === highlightedOrderId);
        if (highlightedOrder) {
          setSelectedOrder(highlightedOrder);
        }
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError('Failed to fetch your orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get badge color based on status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <FaBox className="me-2" />;
      case 'shipped':
        return <FaTruck className="me-2" />;
      case 'delivered':
        return <FaCheckCircle className="me-2" />;
      case 'cancelled':
        return <FaHome className="me-2" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <Container className="py-5">
        <h1 className="mb-4">My Orders</h1>
        
        {isSuccess && (
          <Alert variant="success" className="mb-4">
            <FaCheckCircle className="me-2" />
            Your order has been placed successfully! We'll process it shortly.
          </Alert>
        )}
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center p-5">
            <Card.Body>
              <h3>You haven't placed any orders yet</h3>
              <p className="text-muted">Browse our products and place your first order!</p>
              <Link to="/products" className="btn btn-primary mt-3">
                Shop Now
              </Link>
            </Card.Body>
          </Card>
        ) : (
          <Row>
            <Col md={5} lg={4} className="mb-4">
              <Card>
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Order History</h5>
                </Card.Header>
                <div className="order-list">
                  {orders.map(order => (
                    <div
                      key={order.id}
                      className={`order-item p-3 ${selectedOrder?.id === order.id ? 'bg-light' : ''} ${order.id === highlightedOrderId ? 'border-primary' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="mb-1 fw-bold">Order #{order.id.substring(0, 8)}</p>
                          <p className="mb-1 small text-muted">{order.createdAt}</p>
                        </div>
                        <Badge bg={getStatusBadge(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <span className="fw-bold">₹{order.total?.toFixed(2)}</span>
                        <span className="small text-muted ms-2">({order.items?.length} items)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            
            <Col md={7} lg={8}>
              {selectedOrder ? (
                <Card>
                  <Card.Header className="bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        Order Details <span className="text-muted">#{selectedOrder.id.substring(0, 8)}</span>
                      </h5>
                      <Badge bg={getStatusBadge(selectedOrder.status)} className="py-2 px-3">
                        {getStatusIcon(selectedOrder.status)}
                        {selectedOrder.status}
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-4">
                      <Col md={6}>
                        <h6>Order Information</h6>
                        <p className="mb-1">Date: {selectedOrder.createdAt}</p>
                        <p className="mb-1">Payment: {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                        {selectedOrder.transactionId && (
                          <p className="mb-1">Transaction: {selectedOrder.transactionId}</p>
                        )}
                        <p className="mb-1">Payment Status: {selectedOrder.paymentStatus || 'pending'}</p>
                      </Col>
                      <Col md={6}>
                        <h6>Shipping Information</h6>
                        <p className="mb-1">{selectedOrder.customerName}</p>
                        <p className="mb-1">{selectedOrder.address?.street}</p>
                        <p className="mb-1">{selectedOrder.address?.city}, {selectedOrder.address?.state} {selectedOrder.address?.pincode}</p>
                        <p className="mb-1">{selectedOrder.address?.country}</p>
                        <p className="mb-1">Phone: {selectedOrder.customerPhone}</p>
                      </Col>
                    </Row>
                    
                    <h6>Order Items</h6>
                    <Table responsive className="mt-3">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items?.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <img 
                                  src={item.imageURL || 'https://via.placeholder.com/50'} 
                                  alt={item.name}
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  className="me-3"
                                />
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td>₹{item.price?.toFixed(2)}</td>
                            <td>{item.quantity}</td>
                            <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    
                    <div className="mt-4">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Shipping:</span>
                        <span>₹{selectedOrder.shipping?.toFixed(2)}</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-bold">Total:</span>
                        <span className="fw-bold">₹{selectedOrder.total?.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button as={Link} to="/products" variant="primary">
                        Shop More
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="h-100 d-flex align-items-center justify-content-center text-center p-5">
                  <Card.Body>
                    <h4>Select an order to view details</h4>
                    <p className="text-muted">Click on any order from the list to view its details</p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        )}
      </Container>
      <Footer />
    </>
  );
}

export default Orders;
