import React from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

function Cart() {
  const { cart, updateQuantity, removeFromCart, subtotal, loading } = useCart();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId, productName) => {
    removeFromCart(productId);
    toast.success(`${productName} removed from cart`);
  };

  // Calculate shipping fee (free over ₹500)
  const shippingFee = subtotal >= 500 || subtotal === 0 ? 0 : 50;
  
  // Calculate total amount
  const totalAmount = subtotal + shippingFee;

  return (
    <>
      <Header />
      <Container className="py-5">
        <h1 className="mb-4">Shopping Cart</h1>
        
        {loading ? (
          <p>Loading your cart...</p>
        ) : cart.length === 0 ? (
          <Card className="text-center p-5">
            <Card.Body>
              <FaShoppingCart size={50} className="text-muted mb-3" />
              <h3>Your cart is empty</h3>
              <p className="text-muted">Add items to your cart to continue shopping</p>
              <Link to="/products" className="btn btn-primary mt-3">
                Continue Shopping
              </Link>
            </Card.Body>
          </Card>
        ) : (
          <Row>
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Body>
                  <Table responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img 
                                src={item.imageURL || 'https://via.placeholder.com/80'} 
                                alt={item.name}
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                className="me-3"
                              />
                              <div>
                                <h6 className="mb-0">{item.name}</h6>
                                <small className="text-muted">{item.category}</small>
                              </div>
                            </div>
                          </td>
                          <td>₹{item.price?.toFixed(2)}</td>
                          <td style={{ width: '150px' }}>
                            <div className="d-flex align-items-center">
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <Form.Control
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                min="1"
                                className="mx-2 text-center"
                                style={{ width: '60px' }}
                              />
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </td>
                          <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                          <td>
                            <Button 
                              variant="link" 
                              className="text-danger p-0"
                              onClick={() => handleRemoveItem(item.id, item.name)}
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
              
              <div className="d-flex justify-content-between">
                <Link to="/products" className="btn btn-outline-primary">
                  <FaArrowLeft className="me-2" /> Continue Shopping
                </Link>
              </div>
            </Col>
            
            <Col lg={4}>
              <Card>
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Order Summary</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping:</span>
                    <span>{shippingFee > 0 ? `₹${shippingFee.toFixed(2)}` : 'Free'}</span>
                  </div>
                  {subtotal < 500 && subtotal > 0 && (
                    <Alert variant="info" className="mt-2 mb-3 py-2 small">
                      Add ₹{(500 - subtotal).toFixed(2)} more to get free shipping!
                    </Alert>
                  )}
                  <hr />
                  <div className="d-flex justify-content-between mb-3">
                    <h5>Total:</h5>
                    <h5>₹{totalAmount.toFixed(2)}</h5>
                  </div>
                  <Link 
                    to="/checkout" 
                    className="btn btn-success w-100"
                  >
                    Proceed to Checkout
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
      <Footer />
    </>
  );
}

export default Cart;
