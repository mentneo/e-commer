import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Modal } from 'react-bootstrap';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle image change
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };
  
  // Reset form
  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setStock('');
    setImage(null);
    setImagePreview('');
    setEditMode(false);
    setCurrentProduct(null);
  };
  
  // Open modal for adding a product
  const handleAddProduct = () => {
    resetForm();
    setShowModal(true);
  };
  
  // Open modal for editing a product
  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price);
    setCategory(product.category);
    setStock(product.stock);
    setImagePreview(product.imageURL);
    setEditMode(true);
    setShowModal(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        updatedAt: new Date().toISOString()
      };
      
      // Upload image if selected
      if (image) {
        const storageRef = ref(storage, `products/${uuidv4()}`);
        await uploadBytes(storageRef, image);
        const downloadURL = await getDownloadURL(storageRef);
        productData.imageURL = downloadURL;
      }
      
      if (editMode && currentProduct) {
        // Update existing product
        const productRef = doc(db, 'products', currentProduct.id);
        await updateDoc(productRef, productData);
        toast.success("Product updated successfully");
      } else {
        // Add new product
        productData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'products'), productData);
        toast.success("Product added successfully");
      }
      
      fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };
  
  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        toast.success("Product deleted successfully");
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    }
  };

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="flex-grow-1">
        <AdminHeader title="Product Management" />
        <Container fluid className="py-3">
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Products</h5>
              <Button variant="primary" onClick={handleAddProduct}>
                Add New Product
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading products...</p>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length > 0 ? (
                        products.map(product => (
                          <tr key={product.id}>
                            <td>
                              <img 
                                src={product.imageURL || 'https://via.placeholder.com/50'} 
                                alt={product.name}
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            </td>
                            <td>{product.name}</td>
                            <td>{product.category}</td>
                            <td>₹{product.price?.toFixed(2)}</td>
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">No products found</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
        
        {/* Add/Edit Product Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? 'Edit Product' : 'Add New Product'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    />
                  </Form.Group>
                  
                  <Row>
                    <Col>
                      <Form.Group className="mb-3">
                        <Form.Label>Price (₹)</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group className="mb-3">
                        <Form.Label>Stock</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          min="0"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Image</Form.Label>
                    <Form.Control 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      {...(editMode ? {} : { required: true })}
                    />
                    {imagePreview && (
                      <div className="mt-3">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ maxWidth: '100%', maxHeight: '200px' }} 
                        />
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editMode ? 'Update Product' : 'Add Product'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default ProductManagement;
