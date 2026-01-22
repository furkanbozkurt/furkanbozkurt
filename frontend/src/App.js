import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import VehicleReceive from '@/pages/VehicleReceive';
import VehicleDetail from '@/pages/VehicleDetail';
import CustomerPortal from '@/pages/CustomerPortal';
import '@/App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('valetpro_token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/receive" element={<PrivateRoute><VehicleReceive /></PrivateRoute>} />
          <Route path="/vehicle/:id" element={<PrivateRoute><VehicleDetail /></PrivateRoute>} />
          <Route path="/customer" element={<PrivateRoute><CustomerPortal /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;