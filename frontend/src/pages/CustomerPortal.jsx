import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Car, LogOut, Clock, Building2 } from 'lucide-react';

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
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
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">ValetPro</h1>
                <p className="text-xs text-slate-500">Müşteri Portalı</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900" data-testid="customer-name">{user.name}</p>
                <p className="text-xs text-slate-500">Müşteri</p>
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
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Araçlarınız</h2>
          <p className="text-slate-600">Otoparkta bulunan araçlarınızı görüntüleyin</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Yükleniyor...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center">
              <Car className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Henüz araç yok</h3>
              <p className="text-slate-500">Otoparkta size ait kayıtlı araç bulunmuyor.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card 
                key={vehicle.id} 
                className="border-slate-200 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                data-testid={`customer-vehicle-${vehicle.plate}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="license-plate">
                      <span className="license-plate-content">{vehicle.plate}</span>
                    </div>
                    <Badge 
                      variant={vehicle.status === 'received' ? 'default' : 'secondary'}
                      className={vehicle.status === 'received' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}
                    >
                      {vehicle.status === 'received' ? 'Otoparkta' : 'Teslim Edildi'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{vehicle.brand} {vehicle.model}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {vehicle.company}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vehicle.photos.length > 0 && (
                    <div className="mb-4 rounded-sm overflow-hidden">
                      <img 
                        src={vehicle.photos[0].url} 
                        alt="Araç" 
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>Teslim: {new Date(vehicle.received_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {vehicle.delivered_at && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                      <Clock className="h-4 w-4" />
                      <span>İade: {new Date(vehicle.delivered_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerPortal;