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
import PendingApprovals from '@/pages/PendingApprovals';
import '@/App.css';

const ADMIN_ROLES = ['admin', 'taff_manager'];
const TAFF_ROLES = ['admin', 'taff_manager', 'taff_staff'];
const COMPANY_ROLES = ['company_manager', 'company_staff'];
const ALL_ROLES = [...TAFF_ROLES, ...COMPANY_ROLES];

function PrivateRoute({ children, allowedRoles = ALL_ROLES }) {
  const token = localStorage.getItem('valetpro_token');
  const user = JSON.parse(localStorage.getItem('valetpro_user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (COMPANY_ROLES.includes(user.role)) {
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
          <Route path="/" element={<PrivateRoute allowedRoles={TAFF_ROLES}><Dashboard /></PrivateRoute>} />
          <Route path="/receive" element={<PrivateRoute allowedRoles={TAFF_ROLES}><VehicleReceive /></PrivateRoute>} />
          <Route path="/vehicle/:id" element={<PrivateRoute><VehicleDetail /></PrivateRoute>} />
          <Route path="/fuel/:vehicleId" element={<PrivateRoute allowedRoles={TAFF_ROLES}><FuelAdd /></PrivateRoute>} />
          <Route path="/test-drive/:vehicleId" element={<PrivateRoute allowedRoles={TAFF_ROLES}><TestDriveAdd /></PrivateRoute>} />
          <Route path="/interim-report/:vehicleId" element={<PrivateRoute allowedRoles={TAFF_ROLES}><InterimReportAdd /></PrivateRoute>} />
          <Route path="/vehicle/:id/final-report" element={<PrivateRoute><FinalReport /></PrivateRoute>} />
          <Route path="/delivered" element={<PrivateRoute allowedRoles={TAFF_ROLES}><DeliveredVehicles /></PrivateRoute>} />
          <Route path="/pending-approvals" element={<PrivateRoute allowedRoles={ADMIN_ROLES}><PendingApprovals /></PrivateRoute>} />
          <Route path="/customer" element={<PrivateRoute allowedRoles={COMPANY_ROLES}><CustomerPortal /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute allowedRoles={ADMIN_ROLES}><AdminReports /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;