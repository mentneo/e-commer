import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Dropdown, DropdownButton, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { FaSearch, FaFilter, FaStar, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [page, setPage] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const productsPerPage = 12;
  
  const { addToCart } = useCart();

  // Define categories and price ranges for filtering
  const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Toys', 'Beauty'];
  const priceRanges = [
    { label: 'Under ₹500', value: 'under500', min: 0, max: 500 },
    { label: '₹500 - ₹1000', value: '500-1000', min: 500, max: 1000 },
    { label: '₹1000 - ₹5000', value: '1000-5000', min: 1000, max: 5000 },
    { label: 'Above ₹5000', value: 'above5000', min: 5000, max: Infinity }
  ];
  
  // Function to fetch products from Firestore
  const fetchProducts = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // If reset is true, reset pagination
      if (reset) {
        setPage(1);
        setLastVisible(null);
      }
      
      let productsQuery = collection(db, 'products');
      let constraints = [];
      
      // Apply category filter
      if (category !== 'all') {
        constraints.push(where('category', '==', category));
      }
      
      // Apply price range filter
      if (priceRange !== 'all') {
        const selectedRange = priceRanges.find(range => range.value === priceRange);
        if (selectedRange) {
          constraints.push(where('price', '>=', selectedRange.min));
          if (selectedRange.max !== Infinity) {
            constraints.push(where('price', '<=', selectedRange.max));
          }
        }
      }
      
      // Apply sorting
      let sortField = 'createdAt';
      let sortDirection = 'desc';
      
      switch (sortBy) {
        case 'priceAsc':
          sortField = 'price';
          sortDirection = 'asc';
          break;
        case 'priceDesc':
          sortField = 'price';
          sortDirection = 'desc';
          break;
        case 'newest':
          sortField = 'createdAt';
          sortDirection = 'desc';
          break;
        case 'popularity':
        default:
          sortField = 'popularity';
          sortDirection = 'desc';
          break;
      }
      
      constraints.push(orderBy(sortField, sortDirection));
      
      // Apply pagination
      constraints.push(limit(productsPerPage));
      if (lastVisible && !reset) {
        constraints.push(startAfter(lastVisible));
      }
      
      const q = query(productsQuery, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const fetchedProducts = [];
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Update lastVisible for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      
      // Check if there are more products
      setHasMore(querySnapshot.docs.length === productsPerPage);
      
      // If it's the first page or a reset, replace products. Otherwise, append.
      if (page === 1 || reset) {
        setProducts(fetchedProducts);
      } else {
        setProducts(prev => [...prev, ...fetchedProducts]);
      }
      
      setPage(prev => reset ? 1 : prev + 1);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search query
  const handleSearch = () => {
    // For a real search with Firestore, you might want to use a Cloud Function
    // For now, we'll just filter client-side or reset filters and fetch all products
    fetchProducts(true);
  };
  
  // Fetch products on initial load and when filters change
  useEffect(() => {
    fetchProducts(true);
  }, [category, priceRange, sortBy]);
  
  // Handle category filter change
  const handleCategoryChange = (cat) => {
    setCategory(cat);
  };
  
  // Handle price range filter change
  const handlePriceRangeChange = (range) => {
    setPriceRange(range);
  };
  
  // Handle sort by change
  const handleSortByChange = (sort) => {
    setSortBy(sort);
  };
  
  // Load more products
  const loadMoreProducts = () => {
    fetchProducts(false);
  };
  
  // Add product to cart
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      quantity: 1
    });
  };
  
  return (
    <Container className="my-5">
      <h2 className="mb-4">Shop Our Products</h2>
      
      {/* Search and Filter Bar */}
      <Row className="mb-4">
        <Col md={6} className="mb-3 mb-md-0">
          <InputGroup>
            <Form.Control
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="primary" onClick={handleSearch}>
              <FaSearch /> Search
            </Button>
          </InputGroup>
        </Col>
        <Col md={2} className="mb-3 mb-md-0">
          <DropdownButton id="category-dropdown" title="Category" variant="outline-secondary" className="w-100">
            <Dropdown.Item active={category === 'all'} onClick={() => handleCategoryChange('all')}>
              All Categories
            </Dropdown.Item>
            {categories.map((cat, index) => (
              <Dropdown.Item 
                key={index} 
                active={category === cat}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </Col>
        <Col md={2} className="mb-3 mb-md-0">
          <DropdownButton id="price-dropdown" title="Price" variant="outline-secondary" className="w-100">
            <Dropdown.Item active={priceRange === 'all'} onClick={() => handlePriceRangeChange('all')}>
              All Prices
            </Dropdown.Item>
            {priceRanges.map((range, index) => (
              <Dropdown.Item 
                key={index} 
                active={priceRange === range.value}
                onClick={() => handlePriceRangeChange(range.value)}
              >
                {range.label}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </Col>
        <Col md={2}>
          <DropdownButton id="sort-dropdown" title="Sort By" variant="outline-secondary" className="w-100">
            <Dropdown.Item active={sortBy === 'popularity'} onClick={() => handleSortByChange('popularity')}>
              Popularity
            </Dropdown.Item>
            <Dropdown.Item active={sortBy === 'priceAsc'} onClick={() => handleSortByChange('priceAsc')}>
              Price: Low to High
            </Dropdown.Item>
            <Dropdown.Item active={sortBy === 'priceDesc'} onClick={() => handleSortByChange('priceDesc')}>
              Price: High to Low
            </Dropdown.Item>
            <Dropdown.Item active={sortBy === 'newest'} onClick={() => handleSortByChange('newest')}>
              Newest First
            </Dropdown.Item>
          </DropdownButton>
        </Col>
      </Row>
      
      {/* Products Grid */}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading && page === 1 ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <Row>
            {products.length > 0 ? (
              products.map(product => (
                <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                  <Card className="product-card h-100">
                    <div className="product-img-wrapper">
                      <Card.Img 
                        variant="top" 
                        src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg'} 
                        alt={product.name}
                        className="product-img"
                      />
                    </div>
                    <Card.Body>
                      <Card.Title className="text-truncate-2">{product.name}</Card.Title>
                      <div className="d-flex justify-content-between">
                        <Card.Text className="fw-bold">₹{product.price.toLocaleString()}</Card.Text>
                        <Card.Text>
                          <FaStar className="text-warning" /> {product.rating || '4.5'}
                        </Card.Text>
                      </div>
                      <Card.Text className="text-truncate-2">{product.description}</Card.Text>
                    </Card.Body>
                    <Card.Footer className="bg-transparent">
                      <div className="d-grid gap-2">
                        <Button variant="primary" onClick={() => handleAddToCart(product)}>
                          <FaShoppingCart className="me-2" /> Add to Cart
                        </Button>
                        <Link to={`/product/${product.id}`} className="btn btn-outline-secondary">
                          View Details
                        </Link>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center my-5">
                <h4>No products found</h4>
                <p>Try changing your filters or search query</p>
              </Col>
            )}
          </Row>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-4">
              <Button 
                variant="outline-primary" 
                onClick={loadMoreProducts}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Products'}
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default Products;
