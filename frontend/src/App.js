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
import TestDriveAdd from '@/pages/TestDriveAdd';
import InterimReportAdd from '@/pages/InterimReportAdd';
import FinalReport from '@/pages/FinalReport';
import DeliveredVehicles from '@/pages/DeliveredVehicles';
import '@/App.css';

function PrivateRoute({ children, allowedRoles = ['admin', 'taff_staff', 'company'] }) {
  const token = localStorage.getItem('valetpro_token');
  const user = JSON.parse(localStorage.getItem('valetpro_user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'company') {
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
          <Route path="/" element={<PrivateRoute allowedRoles={['admin', 'taff_staff']}><Dashboard /></PrivateRoute>} />
          <Route path="/receive" element={<PrivateRoute allowedRoles={['admin', 'taff_staff']}><VehicleReceive /></PrivateRoute>} />
          <Route path="/vehicle/:id" element={<PrivateRoute><VehicleDetail /></PrivateRoute>} />
          <Route path="/fuel/:vehicleId" element={<PrivateRoute allowedRoles={['admin', 'taff_staff']}><FuelAdd /></PrivateRoute>} />
          <Route path="/test-drive/:vehicleId" element={<PrivateRoute allowedRoles={['admin', 'taff_staff']}><TestDriveAdd /></PrivateRoute>} />
          <Route path="/interim-report/:vehicleId" element={<PrivateRoute allowedRoles={['admin', 'taff_staff']}><InterimReportAdd /></PrivateRoute>} />
          <Route path="/vehicle/:id/final-report" element={<PrivateRoute><FinalReport /></PrivateRoute>} />
          <Route path="/customer" element={<PrivateRoute allowedRoles={['company']}><CustomerPortal /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute allowedRoles={['admin']}><AdminReports /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;