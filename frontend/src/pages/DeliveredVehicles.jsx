import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, Search, Car, Calendar, User, Eye, FileText, Mail } from 'lucide-react';

const DeliveredVehicles = () => {
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
      // Filter only delivered vehicles
      const deliveredVehicles = response.data.filter(v => v.status === 'delivered');
      setVehicles(deliveredVehicles);
    } catch (error) {
      toast.error('Araçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = searchTerm.toLowerCase();
    return (
      vehicle.plate?.toLowerCase().includes(searchLower) ||
      vehicle.brand?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower) ||
      vehicle.company?.toLowerCase().includes(searchLower)
    );
  });

  const handleLogout = () => {
    localStorage.removeItem('valetpro_token');
    localStorage.removeItem('valetpro_user');
    navigate('/login');
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
                <h1 className="text-2xl font-black text-primary tracking-tight">Teslim Edilen Araçlar</h1>
                <p className="text-sm text-slate-500">{filteredVehicles.length} araç</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{user.name}</span>
              <Button variant="outline" onClick={handleLogout}>Çıkış</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
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
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Yükleniyor...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center">
              <Car className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Teslim edilmiş araç bulunamadı</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Plaka</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Marka/Model</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Firma</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Teslim Alan</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Teslim Tarihi</th>
                  <th className="text-right py-4 px-4 font-semibold text-slate-700">Toplam KM</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr 
                    key={vehicle.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                  >
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-primary">{vehicle.plate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium">{vehicle.brand} {vehicle.model}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{vehicle.company}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>{vehicle.received_by_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span>{vehicle.delivered_at ? new Date(vehicle.delivered_at).toLocaleDateString('tr-TR') : '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {vehicle.total_km?.toLocaleString('tr-TR') || 0} km
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                          title="Detay Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/vehicle/${vehicle.id}/final-report`, '_blank')}
                          title="Final Rapor"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default DeliveredVehicles;
