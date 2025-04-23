import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load cart from localStorage or Firestore
  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (currentUser) {
          // Fetch cart from Firestore for logged-in users
          const cartRef = doc(db, 'carts', currentUser.uid);
          const cartSnap = await getDoc(cartRef);
          
          if (cartSnap.exists()) {
            setCart(cartSnap.data().items || []);
          } else {
            setCart([]);
          }
        } else {
          // Use localStorage for guests
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            setCart(JSON.parse(savedCart));
          }
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [currentUser]);

  // Save cart to localStorage or Firestore whenever it changes
  useEffect(() => {
    if (loading) return;
    
    if (currentUser) {
      // Save to Firestore for logged-in users
      const saveCart = async () => {
        try {
          const cartRef = doc(db, 'carts', currentUser.uid);
          await setDoc(cartRef, { items: cart, updatedAt: new Date().toISOString() });
        } catch (error) {
          console.error("Error saving cart to Firestore:", error);
        }
      };
      saveCart();
    } else {
      // Save to localStorage for guests
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, currentUser, loading]);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
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

  // Calculate total items in cart
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate subtotal
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    loading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
