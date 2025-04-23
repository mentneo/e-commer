import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Form, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { addToCart } = useCart();
  
  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const productData = {
            id: productSnap.id,
            ...productSnap.data()
          };
          setProduct(productData);
          
          // Fetch related products from the same category
          if (productData.category) {
            const relatedQuery = query(
              collection(db, 'products'),
              where('category', '==', productData.category),
              where('__name__', '!=', id),
              limit(4)
            );
            
            const relatedQuerySnapshot = await getDocs(relatedQuery);
            const relatedProductsData = relatedQuerySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            setRelatedProducts(relatedProductsData);
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.stock || 10)) {
      setQuantity(value);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast.success(`${quantity} ${quantity > 1 ? 'items' : 'item'} added to cart!`);
    }
  };
  
  // Handle related product click (add to cart)
  const handleRelatedProductAdd = (relatedProduct) => {
    addToCart(relatedProduct, 1);
    toast.success(`${relatedProduct.name} added to cart!`);
  };
  
  if (loading) {
    return (
      <>
        <Header />
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading product details...</p>
        </Container>
        <Footer />
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Header />
        <Container className="py-5">
          <Alert variant="danger">{error}</Alert>
          <div className="text-center mt-4">
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </Container>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Header />
      <Container className="py-5">
        {product && (
          <>
            <Row>
              <Col md={5} className="mb-4">
                <img 
                  src={product.imageURL || 'https://via.placeholder.com/600'} 
                  alt={product.name} 
                  className="img-fluid rounded"
                  style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }}
                />
              </Col>
              
              <Col md={7}>
                <h2 className="mb-3">{product.name}</h2>
                <h4 className="text-primary mb-3">₹{product.price?.toFixed(2)}</h4>
                
                <p className="mb-1"><strong>Category:</strong> {product.category}</p>
                {product.stock > 0 ? (
                  <p className="text-success mb-3"><strong>Status:</strong> In Stock ({product.stock} available)</p>
                ) : (
                  <p className="text-danger mb-3"><strong>Status:</strong> Out of Stock</p>
                )}
                
                <div className="mb-4">
                  <h5>Description</h5>
                  <p>{product.description}</p>
                </div>
                
                {product.stock > 0 && (
                  <div className="d-flex mb-4 align-items-center">
                    <Form.Label className="me-3 mb-0">Quantity:</Form.Label>
                    <div style={{ width: '100px' }}>
                      <Form.Control
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={handleQuantityChange}
                      />
                    </div>
                  </div>
                )}
                
                <div className="d-grid gap-2 d-md-block">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="me-md-2"
                  >
                    {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                  <Button 
                    as={Link}
                    to="/cart"
                    variant="success" 
                    size="lg"
                    disabled={product.stock <= 0}
                    className="mt-2 mt-md-0"
                  >
                    Buy Now
                  </Button>
                </div>
              </Col>
            </Row>
            
            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-4">Related Products</h3>
                <Row>
                  {relatedProducts.map(relatedProduct => (
                    <Col md={3} sm={6} className="mb-4" key={relatedProduct.id}>
                      <Card className="h-100">
                        <Card.Img 
                          variant="top" 
                          src={relatedProduct.imageURL || 'https://via.placeholder.com/300'} 
                          alt={relatedProduct.name}
                          style={{ height: '180px', objectFit: 'contain' }}
                        />
                        <Card.Body>
                          <Card.Title className="h6">{relatedProduct.name}</Card.Title>
                          <Card.Text className="fw-bold">₹{relatedProduct.price?.toFixed(2)}</Card.Text>
                        </Card.Body>
                        <Card.Footer className="bg-white border-top-0 d-flex justify-content-between">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleRelatedProductAdd(relatedProduct)}
                            disabled={relatedProduct.stock <= 0}
                          >
                            Add to Cart
                          </Button>
                          <Button 
                            as={Link}
                            to={`/product/${relatedProduct.id}`}
                            variant="outline-secondary" 
                            size="sm"
                          >
                            View
                          </Button>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </>
        )}
      </Container>
      <Footer />
    </>
  );
}

export default ProductDetail;
