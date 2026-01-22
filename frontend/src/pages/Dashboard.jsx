import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Plus, Car, LogOut, User, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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

  const filteredVehicles = vehicles
    .filter(v => v.status === 'received') // Sadece teslimdeki araçlar
    .filter(v => 
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const receivedCount = vehicles.filter(v => v.status === 'received').length;
  const deliveredCount = vehicles.filter(v => v.status === 'delivered').length;

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
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900" data-testid="user-name">{user.name}</p>
                <p className="text-xs text-slate-500">Personel</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
              <CardTitle className="text-sm font-medium text-slate-500">Teslimdeki Araçlar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-green-600" data-testid="received-vehicles">{receivedCount}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">Teslim Edilenler</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-blue-600" data-testid="delivered-vehicles">{deliveredCount}</p>
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
          <h2 className="text-xl font-bold text-slate-900">Araçlar</h2>
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
              {filteredVehicles.map((vehicle) => (
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
                        variant={vehicle.status === 'received' ? 'default' : 'secondary'}
                        className={vehicle.status === 'received' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}
                        data-testid={`vehicle-status-${vehicle.plate}`}
                      >
                        {vehicle.status === 'received' ? 'Teslimdeki' : 'Teslim Edildi'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-slate-900">{vehicle.brand} {vehicle.model}</p>
                      <p className="text-sm text-slate-600">{vehicle.company}</p>
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;