// ...existing code...
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/dashboard';
import OrderPage from './pages/order';
import MenusPage from './pages/menus';
import BranchAdmin from './pages/branchadmin';
import CanteenPage from './pages/canteen';
import UserOrder from './user/user';
import UserMenu from './user/usermenu';
import UserCheckout from './user/usercheckout';
import Login from './components/login';
import Signup from './components/signup';
import Adminmag from './components/Adminmag';
import OrderDetailsPage from './pages/orderdetails';
import QRPage from './pages/qr';
import OrderDetails from './user/OrderDetails';
import { API_URL } from './config/api';

function App() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(() => {
    // Initialize user state from localStorage
    const savedUser = localStorage.getItem('adminUser');
    return savedUser ? JSON.parse(savedUser) : null;
  }); // Admin user state

  // Persistent setUser function
  const setUserPersistent = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('adminUser', JSON.stringify(userData));
    } else {
      localStorage.removeItem('adminUser');
    }
  };

  // Logout function
  const handleLogout = () => {
    setUserPersistent(null);
  };


  useEffect(() => {
    // Only fetch orders if user is logged in (or for public view if needed, but here we filter for admin)
    let url = `${API_URL}/api/canteen_orders`;
    if (user) {
      if (user.role === 'branch_admin') url += `?branch_id=${user.branch_id}`;
      if (user.role === 'canteen_admin') url += `?canteen_id=${user.canteen_id}`;
    }

    fetch(url)
      .then(res => {
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          if (res.status === 404) throw new Error('API endpoint not found. Please restart your backend server.');
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        } else {
          throw new Error("Backend API not reachable (received HTML instead of JSON). Check Vercel logs.");
        }
      })
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          console.error('API returned non-array data for orders:', data);
          setOrders([]);
        }
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setOrders([]);
      });
  }, [user]); // Re-fetch when user changes

  const handlePlaceOrder = (newOrder) => {
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
  };

  const handleOrderStatusUpdate = (updatedOrder) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
      )
    );
  };

  const stats = {
    totalOrders: orders.length,
    totalEarnings: orders.reduce((sum, order) => sum + (parseFloat(order.total.replace(/[^\d.-]/g, '')) || 0), 0),
    avgTicket: orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + (parseFloat(order.total.replace(/[^\d.-]/g, '')) || 0), 0) / orders.length) : 0,
    activeMenus: 0 // Placeholder, or fetch menu count if needed
  };

  // Protected Route wrapper
  const ProtectedRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={setUserPersistent} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/user-order" element={<UserOrder />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard
                orders={orders}
                stats={stats}
                user={user}
                onOrderUpdate={handleOrderStatusUpdate}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/usermenu" element={<UserMenu />} />
        <Route path="/user-checkout" element={<UserCheckout onPlaceOrder={handlePlaceOrder} />} />
        <Route
          path="/order-details/:orderId"
          element={
              <OrderDetailsPage user={user} />
          }
        />
        <Route path="/orders" element={<ProtectedRoute><OrderPage user={user} /></ProtectedRoute>} />
        <Route path="/menus" element={<ProtectedRoute><MenusPage user={user} /></ProtectedRoute>} />
        <Route path="/branches" element={<ProtectedRoute><BranchAdmin user={user} /></ProtectedRoute>} />
        <Route path="/canteen" element={<ProtectedRoute><CanteenPage user={user} /></ProtectedRoute>} />
        <Route path="/adminmag" element={<ProtectedRoute><Adminmag user={user} /></ProtectedRoute>} />
        <Route path="/page/qr" element={<ProtectedRoute><QRPage user={user} /></ProtectedRoute>} />
        <Route path="/menu/:canteenId" element={<UserMenu />} />
        <Route path="/orderdetails" element={<OrderDetails />} />
        <Route path="/" element={<Navigate to="/user-order" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
// ...existing code...