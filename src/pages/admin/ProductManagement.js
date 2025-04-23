import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Table, Modal, Alert } from 'react-bootstrap';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadMultipleImages } from '../../utils/cloudinary';
import { v4 as uuidv4 } from 'uuid';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: []
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Categories for dropdown
  const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Toys', 'Beauty'];

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const productsData = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      
      setProducts(productsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({
      ...currentProduct,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value
    });
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  // Open modal for adding new product
  const handleAddProduct = () => {
    setCurrentProduct({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      images: []
    });
    setImageFiles([]);
    setIsEditing(false);
    setShowModal(true);
  };

  // Open modal for editing product
  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setImageFiles([]);
    setIsEditing(true);
    setShowModal(true);
  };

  // Upload images to Cloudinary
  const uploadImages = async () => {
    if (imageFiles.length === 0) {
      return currentProduct.images || [];
    }

    try {
      // Upload all image files to Cloudinary
      const uploadedImageUrls = await uploadMultipleImages(imageFiles, (progress) => {
        setUploadProgress(progress);
      });
      
      console.log('Images uploaded successfully:', uploadedImageUrls);
      
      // Combine with existing images if editing
      return [...(currentProduct.images || []), ...uploadedImageUrls];
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  // Save product (add new or update existing)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!currentProduct.name || !currentProduct.price || !currentProduct.category) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Upload images if any
      const imageUrls = await uploadImages();
      
      if (isEditing) {
        // Update existing product
        await updateDoc(doc(db, 'products', currentProduct.id), {
          name: currentProduct.name,
          description: currentProduct.description,
          price: parseFloat(currentProduct.price),
          category: currentProduct.category,
          stock: parseFloat(currentProduct.stock) || 0,
          images: imageUrls,
          updatedAt: new Date().toISOString()
        });
        
        console.log('Product updated successfully');
      } else {
        // Add new product
        await addDoc(collection(db, 'products'), {
          name: currentProduct.name,
          description: currentProduct.description,
          price: parseFloat(currentProduct.price),
          category: currentProduct.category,
          stock: parseFloat(currentProduct.stock) || 0,
          images: imageUrls,
          popularity: 0,
          rating: 5.0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log('Product added successfully');
      }
      
      // Refresh products list
      fetchProducts();
      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'products', productId));
        console.log('Product deleted successfully');
        fetchProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Container className="py-4">
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Product Management</h4>
          <Button variant="light" onClick={handleAddProduct}>Add New Product</Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading && <div className="text-center py-4">Loading products...</div>}
          
          {!loading && products.length === 0 ? (
            <div className="text-center py-4">
              <p>No products found. Add your first product!</p>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>
                      <img 
                        src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg'} 
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        className="rounded"
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>₹{product.price?.toLocaleString()}</td>
                    <td>{product.stock}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEditProduct(product)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Add/Edit Product Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveProduct}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={currentProduct.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category*</Form.Label>
                  <Form.Select
                    name="category"
                    value={currentProduct.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹)*</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={currentProduct.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock"
                    value={currentProduct.stock}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={currentProduct.description}
                onChange={handleInputChange}
                rows={3}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Images</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={handleImageChange}
                accept="image/*"
              />
              <Form.Text className="text-muted">
                You can select multiple images. Current images will be preserved.
              </Form.Text>
            </Form.Group>
            
            {uploadProgress > 0 && (
              <div className="mb-3">
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${uploadProgress}%` }}
                    aria-valuenow={uploadProgress} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {uploadProgress}%
                  </div>
                </div>
              </div>
            )}
            
            {currentProduct.images && currentProduct.images.length > 0 && (
              <div className="mb-3">
                <p>Current Images:</p>
                <div className="d-flex flex-wrap gap-2">
                  {currentProduct.images.map((img, index) => (
                    <img 
                      key={index}
                      src={img} 
                      alt={`Product ${index}`}
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      className="rounded"
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Product'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default ProductManagement;
