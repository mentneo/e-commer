import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Fetch cart from Firestore or local storage
  useEffect(() => {
    async function fetchCart() {
      try {
        if (currentUser) {
          // User is logged in, fetch cart from Firestore
          const cartRef = doc(db, 'carts', currentUser.uid);
          const cartDoc = await getDoc(cartRef);
          
          if (cartDoc.exists()) {
            setCart(cartDoc.data().items || []);
          } else {
            // Create an empty cart document for the user
            await setDoc(cartRef, { items: [] });
            setCart([]);
          }
        } else {
          // User is not logged in, get cart from local storage
          const localCart = localStorage.getItem('ecommerCart');
          if (localCart) {
            setCart(JSON.parse(localCart));
          }
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching cart:', err);
        // Handle permission denied errors by falling back to local storage
        if (err.code === 'permission-denied') {
          const localCart = localStorage.getItem('ecommerCart');
          if (localCart) {
            setCart(JSON.parse(localCart));
          }
          setError("Using local cart: You'll need to log in to save your cart.");
        } else {
          setError('Failed to load cart. Please try again.');
          toast.error('Failed to load cart. Please try again.', {
            position: "top-right",
            autoClose: 3000
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCart();
  }, [currentUser]);

  // Save cart to Firestore or local storage
  useEffect(() => {
    if (loading) return;

    async function saveCart() {
      try {
        if (currentUser) {
          // User is logged in, save cart to Firestore
          const cartRef = doc(db, 'carts', currentUser.uid);
          await setDoc(cartRef, { items: cart }, { merge: true });
        } else {
          // User is not logged in, save to local storage
          localStorage.setItem('ecommerCart', JSON.stringify(cart));
        }
      } catch (err) {
        console.error('Error saving cart:', err);
        // If there's a permission error, save to local storage as fallback
        if (err.code === 'permission-denied') {
          localStorage.setItem('ecommerCart', JSON.stringify(cart));
          setError("Using local cart: You'll need to log in to save your cart.");
        } else {
          toast.error('Failed to save cart. Please try again.', {
            position: "top-right",
            autoClose: 3000
          });
        }
      }
    }

    // Skip initial empty cart save
    if (cart.length > 0 || currentUser) {
      saveCart();
    }
  }, [cart, currentUser, loading]);

  // Add product to cart
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.id === product.id);
      
      if (existingItemIndex !== -1) {
        // Item already in cart, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += product.quantity || 1;
        return updatedCart;
      } else {
        // Item not in cart, add it
        return [...prevCart, { ...product, quantity: product.quantity || 1 }];
      }
    });
    
    toast.success('Added to cart!', {
      position: "top-right",
      autoClose: 2000
    });
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    
    toast.info('Removed from cart', {
      position: "top-right",
      autoClose: 2000
    });
  };

  // Update product quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate total price
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate items count
  const itemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    calculateTotal,
    itemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
