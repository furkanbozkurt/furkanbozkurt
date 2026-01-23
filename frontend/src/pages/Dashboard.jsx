import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Plus, Car, LogOut, User, Clock, Search, Settings, Gauge } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ADMIN_ROLES = ['admin', 'taff_manager'];
const TAFF_ROLES = ['admin', 'taff_manager', 'taff_staff'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const user = JSON.parse(localStorage.getItem('valetpro_user') || '{}');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      toast.error('Araçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('valetpro_token');
    localStorage.removeItem('valetpro_user');
    navigate('/login');
  };

  // Filter only active vehicles (received, in_pool, in_testing)
  const filteredVehicles = vehicles
    .filter(v => ['received', 'in_pool', 'in_testing'].includes(v.status))
    .filter(v => 
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.company || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  const receivedCount = vehicles.filter(v => ['received', 'in_pool', 'in_testing'].includes(v.status)).length;
  const deliveredCount = vehicles.filter(v => v.status === 'delivered').length;
  const pendingApprovalCount = vehicles.filter(v => v.status === 'pending_approval').length;

  const getRoleName = (role) => {
    const roleNames = {
      'admin': 'Admin',
      'taff_manager': 'TAFF Yönetici',
      'taff_staff': 'TAFF Personel',
      'company_manager': 'Firma Yönetici',
      'company_staff': 'Firma Personel'
    };
    return roleNames[role] || role;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'received': { label: 'Teslimdeki', class: 'bg-green-100 text-green-700' },
      'in_pool': { label: 'Havuzda', class: 'bg-blue-100 text-blue-700' },
      'in_testing': { label: 'Test Sürüşünde', class: 'bg-yellow-100 text-yellow-700' },
      'pending_approval': { label: 'Onay Bekliyor', class: 'bg-orange-100 text-orange-700' },
      'delivered': { label: 'Teslim Edildi', class: 'bg-slate-100 text-slate-700' }
    };
    return statusConfig[status] || { label: status, class: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-sm">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">TAFF OTOPARK</h1>
                <p className="text-xs text-slate-500">Otopark Yönetim</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {ADMIN_ROLES.includes(user.role) && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/reports')}
                  data-testid="admin-panel-btn"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Yönetim Paneli
                </Button>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900" data-testid="user-name">{user.name}</p>
                <p className="text-xs text-slate-500">{getRoleName(user.role)}</p>
              </div>
              <Button variant="outline" size="icon" onClick={handleLogout} data-testid="logout-btn">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">Toplam Araç</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-slate-900" data-testid="total-vehicles">{vehicles.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">Aktif Araçlar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-green-600" data-testid="received-vehicles">{receivedCount}</p>
            </CardContent>
          </Card>
          {ADMIN_ROLES.includes(user.role) && pendingApprovalCount > 0 && (
            <Card 
              className="border-orange-200 bg-orange-50 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate('/pending-approvals')}
              data-testid="pending-approvals-card"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-600">Onay Bekleyen →</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-orange-600">{pendingApprovalCount}</p>
              </CardContent>
            </Card>
          )}
          <Card 
            className="border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
            onClick={() => navigate('/delivered')}
            data-testid="delivered-vehicles-card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">Teslim Edilenler →</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-blue-600" data-testid="delivered-vehicles">{deliveredCount}</p>
              <p className="text-xs text-slate-400 mt-1">Tıklayarak listeleyin</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button onClick={() => navigate('/receive')} className="h-12 flex-1" data-testid="receive-vehicle-btn">
            <Plus className="mr-2 h-5 w-5" />
            Araç Teslim Al
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Plaka, marka, model veya firma ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Vehicle List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Teslimdeki Araçlar</h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Yükleniyor...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Henüz araç bulunmuyor</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => {
                const statusBadge = getStatusBadge(vehicle.status);
                return (
                <Card 
                  key={vehicle.id} 
                  className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                  data-testid={`vehicle-card-${vehicle.plate}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="license-plate">
                        <span className="license-plate-content">{vehicle.plate}</span>
                      </div>
                      <Badge 
                        variant="default"
                        className={statusBadge.class}
                        data-testid={`vehicle-status-${vehicle.plate}`}
                      >
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-slate-900">{vehicle.brand} {vehicle.model}</p>
                      <p className="text-sm text-slate-600">{vehicle.company}</p>
                      
                      {/* Kalan KM gösterimi - sadece TAFF için */}
                      {TAFF_ROLES.includes(user.role) && vehicle.estimated_test_km && (
                        <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-lg">
                          <Gauge className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">Kalan Test KM:</span>
                              <span className={`font-bold ${(vehicle.remaining_test_km || 0) <= 50 ? 'text-red-600' : 'text-primary'}`}>
                                {(vehicle.remaining_test_km || 0).toLocaleString('tr-TR')} km
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full ${(vehicle.remaining_test_km || 0) <= 50 ? 'bg-red-500' : 'bg-primary'}`}
                                style={{ width: `${Math.min(100, ((vehicle.remaining_test_km || 0) / vehicle.estimated_test_km) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <User className="h-3 w-3" />
                        <span>{vehicle.received_by_name || 'Bilinmeyen'}</span>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3" />
                        <span>{new Date(vehicle.received_at).toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;