import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, limit, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Fetch featured products (can be set by admin or most popular)
        const featuredQuery = query(
          collection(db, 'products'),
          limit(4)
        );
        const featuredSnapshot = await getDocs(featuredQuery);
        const featuredData = featuredSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeaturedProducts(featuredData);
        
        // Fetch new arrivals (newest products)
        const newArrivalsQuery = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(8)
        );
        const newArrivalsSnapshot = await getDocs(newArrivalsQuery);
        const newArrivalsData = newArrivalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNewArrivals(newArrivalsData);
        
        // Get unique categories from products
        const uniqueCategories = new Set();
        [...featuredData, ...newArrivalsData].forEach(product => {
          if (product.category) {
            uniqueCategories.add(product.category);
          }
        });
        setCategories(Array.from(uniqueCategories).slice(0, 6));
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching home data:", error);
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <>
      <Header />
      
      {/* Hero Carousel */}
      <Carousel className="mb-4">
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://via.placeholder.com/1600x500/2196F3/FFFFFF?text=Fresh+Groceries+Delivered"
            alt="Fresh Groceries"
            style={{ objectFit: 'cover', height: '400px' }}
          />
          <Carousel.Caption>
            <h3>Fresh Groceries Delivered</h3>
            <p>Get farm-fresh produce delivered to your doorstep</p>
            <Button as={Link} to="/products" variant="primary" className="mt-2">Shop Now</Button>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://via.placeholder.com/1600x500/4CAF50/FFFFFF?text=Special+Offers"
            alt="Special Offers"
            style={{ objectFit: 'cover', height: '400px' }}
          />
          <Carousel.Caption>
            <h3>Special Offers</h3>
            <p>Exclusive deals and discounts on your favorite products</p>
            <Button as={Link} to="/products" variant="primary" className="mt-2">View Offers</Button>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://via.placeholder.com/1600x500/FF5722/FFFFFF?text=Fast+Delivery"
            alt="Fast Delivery"
            style={{ objectFit: 'cover', height: '400px' }}
          />
          <Carousel.Caption>
            <h3>Fast Delivery</h3>
            <p>Get your essentials delivered within hours</p>
            <Button as={Link} to="/products" variant="primary" className="mt-2">Order Now</Button>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>
      
      <Container>
        {/* Categories Section */}
        <h2 className="mb-4">Shop by Category</h2>
        <Row>
          {loading ? (
            <p>Loading categories...</p>
          ) : (
            categories.map((category, index) => (
              <Col md={2} sm={4} xs={6} key={index} className="mb-4">
                <Card className="h-100 text-center">
                  <Card.Body>
                    <Card.Title>{category}</Card.Title>
                  </Card.Body>
                  <Card.Footer className="bg-white border-top-0">
                    <Link 
                      to={`/products?category=${category}`} 
                      className="btn btn-sm btn-outline-primary"
                    >
                      View Products
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            ))
          )}
        </Row>
        
        {/* Featured Products Section */}
        <h2 className="mt-5 mb-4">Featured Products</h2>
        <Row>
          {loading ? (
            <p>Loading featured products...</p>
          ) : (
            featuredProducts.map(product => (
              <Col md={3} sm={6} className="mb-4" key={product.id}>
                <Card className="h-100 product-card">
                  <div className="product-img-wrapper">
                    <Card.Img 
                      variant="top" 
                      src={product.imageURL || 'https://via.placeholder.com/300'} 
                      alt={product.name}
                      className="product-img"
                    />
                  </div>
                  <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                    <Card.Text className="text-muted">{product.category}</Card.Text>
                    <Card.Text className="fw-bold">₹{product.price?.toFixed(2)}</Card.Text>
                  </Card.Body>
                  <Card.Footer className="bg-white border-top-0 d-flex justify-content-between">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </Button>
                    <Button 
                      as={Link}
                      to={`/product/${product.id}`}
                      variant="outline-secondary" 
                      size="sm"
                    >
                      Details
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))
          )}
        </Row>
        
        {/* New Arrivals Section */}
        <h2 className="mt-5 mb-4">New Arrivals</h2>
        <Row>
          {loading ? (
            <p>Loading new arrivals...</p>
          ) : (
            newArrivals.map(product => (
              <Col md={3} sm={6} className="mb-4" key={product.id}>
                <Card className="h-100 product-card">
                  <div className="product-img-wrapper">
                    <Card.Img 
                      variant="top" 
                      src={product.imageURL || 'https://via.placeholder.com/300'} 
                      alt={product.name}
                      className="product-img"
                    />
                    <span className="badge bg-success position-absolute top-0 end-0 m-2">New</span>
                  </div>
                  <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                    <Card.Text className="text-muted">{product.category}</Card.Text>
                    <Card.Text className="fw-bold">₹{product.price?.toFixed(2)}</Card.Text>
                  </Card.Body>
                  <Card.Footer className="bg-white border-top-0 d-flex justify-content-between">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </Button>
                    <Button 
                      as={Link}
                      to={`/product/${product.id}`}
                      variant="outline-secondary" 
                      size="sm"
                    >
                      Details
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))
          )}
        </Row>
        
        {/* Promotions Section */}
        <Row className="mt-5 mb-4">
          <Col md={6} className="mb-4">
            <Card className="bg-light">
              <Card.Body className="p-4">
                <h3>Free Delivery</h3>
                <p>On orders above ₹500</p>
                <Button as={Link} to="/products" variant="primary">Shop Now</Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="mb-4">
            <Card className="bg-light">
              <Card.Body className="p-4">
                <h3>Special Offers</h3>
                <p>Up to 30% off on selected items</p>
                <Button as={Link} to="/products" variant="primary">View Offers</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      <Footer />
    </>
  );
}

export default Home;
