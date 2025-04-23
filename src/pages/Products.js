import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Pagination, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy, startAfter, limit } from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const { addToCart } = useCart();
  const location = useLocation();
  const PRODUCTS_PER_PAGE = 12;
  
  // Check if a category was passed via URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location]);
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        
        // Extract unique categories
        const uniqueCategories = new Set();
        productsSnapshot.docs.forEach(doc => {
          const product = doc.data();
          if (product.category) {
            uniqueCategories.add(product.category);
          }
        });
        
        setCategories(Array.from(uniqueCategories).sort());
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch products
  useEffect(() => {
    const fetchProducts = async (isFirstPage = true) => {
      try {
        setLoading(true);
        
        let productsQuery;
        const productsRef = collection(db, 'products');
        
        // Build query based on filters
        let baseQuery = [];
        
        if (selectedCategory) {
          baseQuery.push(where('category', '==', selectedCategory));
        }
        
        // Determine sort order
        let sortField, sortDirection;
        switch (sortBy) {
          case 'price-asc':
            sortField = 'price';
            sortDirection = 'asc';
            break;
          case 'price-desc':
            sortField = 'price';
            sortDirection = 'desc';
            break;
          case 'name-desc':
            sortField = 'name';
            sortDirection = 'desc';
            break;
          case 'name-asc':
          default:
            sortField = 'name';
            sortDirection = 'asc';
        }
        
        baseQuery.push(orderBy(sortField, sortDirection));
        
        // For pagination, if not first page, start after last visible document
        if (!isFirstPage && lastVisible) {
          productsQuery = query(
            productsRef,
            ...baseQuery,
            startAfter(lastVisible),
            limit(PRODUCTS_PER_PAGE)
          );
        } else {
          productsQuery = query(
            productsRef,
            ...baseQuery,
            limit(PRODUCTS_PER_PAGE)
          );
        }
        
        const productsSnapshot = await getDocs(productsQuery);
        
        // Set last document for pagination
        const lastDoc = productsSnapshot.docs[productsSnapshot.docs.length - 1];
        setLastVisible(lastDoc || null);
        
        // Check if there are more results
        setHasMore(productsSnapshot.docs.length === PRODUCTS_PER_PAGE);
        
        // Map documents to products
        let productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter by search term if provided
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          productsData = productsData.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term)
          );
        }
        
        // Update or append products based on whether this is the first page
        if (isFirstPage) {
          setProducts(productsData);
        } else {
          setProducts(prev => [...prev, ...productsData]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Reset pagination and fetch first page when filters change
    setLastVisible(null);
    fetchProducts(true);
  }, [selectedCategory, sortBy, searchTerm]);
  
  // Load more products
  const loadMoreProducts = () => {
    if (hasMore && !loading) {
      const fetchNextPage = async () => {
        await fetchProducts(false);
      };
      fetchNextPage();
    }
  };
  
  // Handle add to cart
  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };
  
  return (
    <>
      <Header />
      <Container className="py-4">
        <h1 className="mb-4">Products</h1>
        
        {/* Filters and Search */}
        <Row className="mb-4">
          <Col md={3} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={3} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label>Sort By</Form.Label>
              <Form.Select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group>
              <Form.Label>Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        
        {/* Products Grid */}
        {loading && products.length === 0 ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center my-5">
            <p>No products found. Try changing your filters.</p>
          </div>
        ) : (
          <>
            <Row>
              {products.map(product => (
                <Col lg={3} md={4} sm={6} className="mb-4" key={product.id}>
                  <Card className="h-100 product-card">
                    <div className="product-img-wrapper">
                      <Card.Img 
                        variant="top" 
                        src={product.imageURL || 'https://via.placeholder.com/300'} 
                        alt={product.name}
                        className="product-img"
                      />
                      {product.stock <= 0 && (
                        <span className="badge bg-danger position-absolute top-0 end-0 m-2">Out of Stock</span>
                      )}
                    </div>
                    <Card.Body>
                      <Card.Title>{product.name}</Card.Title>
                      <Card.Text className="text-muted small">{product.category}</Card.Text>
                      <Card.Text className="fw-bold">₹{product.price?.toFixed(2)}</Card.Text>
                    </Card.Body>
                    <Card.Footer className="bg-white border-top-0 d-flex justify-content-between">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
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
              ))}
            </Row>
            
            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-4">
                <Button 
                  variant="primary" 
                  onClick={loadMoreProducts}
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
                      Loading...
                    </>
                  ) : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
      <Footer />
    </>
  );
}

export default Products;
