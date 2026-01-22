import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import VehicleReceive from '@/pages/VehicleReceive';
import VehicleDetail from '@/pages/VehicleDetail';
import CustomerPortal from '@/pages/CustomerPortal';
import FuelAdd from '@/pages/FuelAdd';
import AdminReports from '@/pages/AdminReports';
import '@/App.css';

function PrivateRoute({ children, allowedRoles = ['staff', 'customer'] }) {
  const token = localStorage.getItem('valetpro_token');
  const user = JSON.parse(localStorage.getItem('valetpro_user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'customer') {
      return <Navigate to="/customer" />;
    } else {
      return <Navigate to="/" />;
    }
  }
  
  return children;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute allowedRoles={['staff']}><Dashboard /></PrivateRoute>} />
          <Route path="/receive" element={<PrivateRoute allowedRoles={['staff']}><VehicleReceive /></PrivateRoute>} />
          <Route path="/vehicle/:id" element={<PrivateRoute><VehicleDetail /></PrivateRoute>} />
          <Route path="/customer" element={<PrivateRoute allowedRoles={['customer']}><CustomerPortal /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;