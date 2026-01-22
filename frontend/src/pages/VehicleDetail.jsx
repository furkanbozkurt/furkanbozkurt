import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, Package, Calendar, User, Fuel, Building2, FileText, CheckCircle2 } from 'lucide-react';

const photoLabels = {
  general: 'Genel Görünüm',
  dashboard: 'Gösterge Paneli',
  seats: 'Ön ve Arka Koltuk',
  hood: 'Kaput İçi',
  coolant: 'Motor Soğutma Sıvısı'
};

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeliverDialog, setShowDeliverDialog] = useState(false);
  const [deliverNotes, setDeliverNotes] = useState('');
  const [delivering, setDelivering] = useState(false);
  const user = JSON.parse(localStorage.getItem('valetpro_user') || '{}');

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      setVehicle(response.data);
    } catch (error) {
      toast.error('Araç bilgisi yüklenemedi');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    setDelivering(true);
    try {
      await api.put(`/vehicles/${id}/deliver`, { notes: deliverNotes });
      toast.success('Araç başarıyla teslim edildi!');
      setShowDeliverDialog(false);
      fetchVehicle();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Araç teslim edilemedi');
    } finally {
      setDelivering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} data-testid="back-btn">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Araç Detayı</h1>
                <p className="text-sm text-slate-500">Tüm bilgiler ve fotoğraflar</p>
              </div>
            </div>
            {user.role === 'staff' && vehicle.status === 'received' && (
              <Button onClick={() => setShowDeliverDialog(true)} data-testid="deliver-btn">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Teslim Et
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Vehicle Info */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{vehicle.brand} {vehicle.model}</CardTitle>
                <div className="license-plate">
                  <span className="license-plate-content" data-testid="vehicle-plate">{vehicle.plate}</span>
                </div>
              </div>
              <Badge 
                variant={vehicle.status === 'received' ? 'default' : 'secondary'}
                className={`text-lg px-4 py-2 ${vehicle.status === 'received' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}`}
                data-testid="vehicle-status"
              >
                {vehicle.status === 'received' ? 'Teslimdeki' : 'Teslim Edildi'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Firma</p>
                  <p className="text-base font-medium text-slate-900" data-testid="vehicle-company">{vehicle.company}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Fuel className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Yakıt Durumu</p>
                  <p className="text-base font-medium text-slate-900" data-testid="vehicle-fuel">{vehicle.fuel_status}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Teslim Alınma</p>
                  <p className="text-base font-medium text-slate-900" data-testid="received-date">
                    {new Date(vehicle.received_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
              {vehicle.delivered_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Teslim Edilme</p>
                    <p className="text-base font-medium text-slate-900" data-testid="delivered-date">
                      {new Date(vehicle.delivered_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {vehicle.notes && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Notlar</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap" data-testid="vehicle-notes">{vehicle.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Araç Fotoğrafları</CardTitle>
            <CardDescription>Teslim alınma sırasında çekilen fotoğraflar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicle.photos.map((photo, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">{photoLabels[photo.category] || photo.category}</p>
                  <div className="aspect-square rounded-sm overflow-hidden border border-slate-200">
                    <img 
                      src={photo.url} 
                      alt={photoLabels[photo.category]} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      data-testid={`photo-${photo.category}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Deliver Dialog */}
      <Dialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
        <DialogContent data-testid="deliver-dialog">
          <DialogHeader>
            <DialogTitle>Araç Teslim Et</DialogTitle>
            <DialogDescription>
              {vehicle.brand} {vehicle.model} ({vehicle.plate}) plakalı aracı teslim etmek üzeresiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="deliver-notes">Teslim Notu (Opsiyonel)</Label>
            <Textarea
              id="deliver-notes"
              placeholder="Teslim sırasındaki notlar..."
              value={deliverNotes}
              onChange={(e) => setDeliverNotes(e.target.value)}
              rows={3}
              data-testid="deliver-notes-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliverDialog(false)} data-testid="cancel-deliver-btn">
              İptal
            </Button>
            <Button onClick={handleDeliver} disabled={delivering} data-testid="confirm-deliver-btn">
              {delivering ? 'Teslim Ediliyor...' : 'Teslim Et'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleDetail;