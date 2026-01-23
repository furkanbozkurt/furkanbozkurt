import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, Check, Eye, FileText, Car } from 'lucide-react';

const PendingApprovals = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('valetpro_user') || '{}');

  useEffect(() => {
    if (user.role !== 'admin' && user.role !== 'taff_manager') {
      toast.error('Bu sayfaya erişim yetkiniz yok');
      navigate('/');
      return;
    }
    fetchPendingVehicles();
  }, []);

  const fetchPendingVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      // Filter only pending approval vehicles
      const pendingVehicles = response.data.filter(v => v.status === 'pending_approval');
      setVehicles(pendingVehicles);
    } catch (error) {
      toast.error('Araçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vehicleId) => {
    try {
      await api.put(`/vehicles/${vehicleId}/approve`);
      toast.success('Rapor onaylandı!');
      fetchPendingVehicles();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Onaylama başarısız');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-primary tracking-tight">Onay Bekleyen Araçlar</h1>
                <p className="text-sm text-slate-500">{vehicles.length} araç onay bekliyor</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Yükleniyor...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center">
              <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-slate-500">Onay bekleyen araç bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <Car className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-bold text-lg">{vehicle.plate}</span>
                          <Badge className="bg-orange-100 text-orange-700">Onay Bekliyor</Badge>
                        </div>
                        <p className="text-slate-600">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-sm text-slate-500">{vehicle.company}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                          <span>Teslim Alan: <strong>{vehicle.received_by_name}</strong></span>
                          <span>Toplam KM: <strong>{vehicle.total_km?.toLocaleString('tr-TR')} km</strong></span>
                          {vehicle.early_delivery_reason && (
                            <span className="text-orange-600">
                              Erken Teslim: <strong>{vehicle.early_delivery_reason}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Detay
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/vehicle/${vehicle.id}/final-report`, '_blank')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Rapor
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(vehicle.id)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Onayla
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PendingApprovals;
