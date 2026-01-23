import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, Package, Calendar, User, Fuel, Building2, FileText, CheckCircle2, MapPin, Trash2 } from 'lucide-react';

const photoCategories = [
  { id: 'general', label: 'Genel Görünüm' },
  { id: 'dashboard', label: 'Gösterge Paneli' },
  { id: 'seats', label: 'Ön ve Arka Koltuk' },
  { id: 'hood', label: 'Kaput İçi' },
  { id: 'coolant', label: 'Motor Soğutma Sıvısı' }
];

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
  const [testDrives, setTestDrives] = useState([]);
  const [interimReports, setInterimReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeliverDialog, setShowDeliverDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEarlyDeliveryWarning, setShowEarlyDeliveryWarning] = useState(false);
  const [deliverNotes, setDeliverNotes] = useState('');
  const [deliverKm, setDeliverKm] = useState('');
  const [deliverLocation, setDeliverLocation] = useState('');
  const [earlyDeliveryReason, setEarlyDeliveryReason] = useState('');
  const [locations, setLocations] = useState([]);
  const [delivering, setDelivering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const user = JSON.parse(localStorage.getItem('valetpro_user') || '{}');

  useEffect(() => {
    fetchVehicle();
    fetchLocations();
    if (user.role === 'admin' || user.role === 'taff_staff') {
      fetchTestDrives();
      fetchInterimReports();
    }
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

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Lokasyonlar yüklenemedi');
    }
  };

  const fetchTestDrives = async () => {
    try {
      const response = await api.get(`/test-drives/vehicle/${id}`);
      setTestDrives(response.data);
    } catch (error) {
      console.error('Test sürüşleri yüklenemedi');
    }
  };

  const fetchInterimReports = async () => {
    try {
      const response = await api.get(`/interim-reports/vehicle/${id}`);
      setInterimReports(response.data);
    } catch (error) {
      console.error('Ara raporlar yüklenemedi');
    }
  };

  const checkEarlyDelivery = () => {
    const kmEnd = parseInt(deliverKm);
    const estimatedKm = vehicle.estimated_test_km || 0;
    const drivenKm = kmEnd - vehicle.km_start;
    
    // Eğer tahmini KM var ve yapılan KM yetersizse uyarı göster
    if (estimatedKm > 0 && drivenKm < estimatedKm) {
      setShowEarlyDeliveryWarning(true);
      return true;
    }
    return false;
  };

  const handleDeliver = async () => {
    if (!deliverKm || parseInt(deliverKm) <= vehicle.km_start) {
      toast.error('Bitiş KM başlangıç KM\'den büyük olmalıdır');
      return;
    }

    if (!deliverLocation) {
      toast.error('Lütfen teslim etme noktasını seçin');
      return;
    }

    // Erken teslim kontrolü - uyarı henüz gösterilmediyse
    if (!showEarlyDeliveryWarning && checkEarlyDelivery()) {
      return;
    }

    // Erken teslimde açıklama zorunlu
    const estimatedKm = vehicle.estimated_test_km || 0;
    const drivenKm = parseInt(deliverKm) - vehicle.km_start;
    if (estimatedKm > 0 && drivenKm < estimatedKm && !earlyDeliveryReason.trim()) {
      toast.error('Erken teslim için açıklama yazmanız zorunludur');
      return;
    }
    
    setDelivering(true);
    try {
      await api.put(`/vehicles/${id}/deliver`, { 
        notes: deliverNotes,
        km_end: parseInt(deliverKm),
        deliver_location: deliverLocation,
        early_delivery_reason: earlyDeliveryReason.trim() || null
      });
      toast.success('Araç başarıyla teslim edildi! Yönetici onayı bekleniyor.');
      setShowDeliverDialog(false);
      setShowEarlyDeliveryWarning(false);
      setEarlyDeliveryReason('');
      fetchVehicle();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Araç teslim edilemedi');
    } finally {
      setDelivering(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Araç başarıyla silindi!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Araç silinemedi');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
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
            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <Button 
                  variant="outline" 
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowDeleteDialog(true)}
                  data-testid="delete-btn"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
                </Button>
              )}
              {(user.role === 'admin' || user.role === 'taff_staff') && vehicle.status !== 'delivered' && (
                <>
                  <Button variant="outline" onClick={() => navigate(`/test-drive/${vehicle.id}`)}>
                    Test Sürüşü
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/interim-report/${vehicle.id}`)}>
                    Ara Rapor
                  </Button>
                  <Button onClick={() => setShowDeliverDialog(true)} data-testid="deliver-btn">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Teslim Et
                  </Button>
                </>
              )}
              {vehicle.status === 'delivered' && (
                <Button onClick={() => window.open(`/vehicle/${vehicle.id}/final-report`, '_blank')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Final Rapor
                </Button>
              )}
            </div>
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
                <Package className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Başlangıç KM</p>
                  <p className="text-base font-medium text-slate-900" data-testid="vehicle-km-start">{vehicle.km_start?.toLocaleString('tr-TR')} km</p>
                </div>
              </div>
              {vehicle.km_end && (
                <>
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Bitiş KM</p>
                      <p className="text-base font-medium text-slate-900" data-testid="vehicle-km-end">{vehicle.km_end?.toLocaleString('tr-TR')} km</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Toplam KM</p>
                      <p className="text-base font-bold text-primary" data-testid="vehicle-total-km">{vehicle.total_km?.toLocaleString('tr-TR')} km</p>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Teslim Alma Noktası</p>
                  <p className="text-base font-medium text-slate-900" data-testid="receive-location">{vehicle.receive_location}</p>
                </div>
              </div>
              {vehicle.deliver_location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Teslim Etme Noktası</p>
                    <p className="text-base font-medium text-slate-900" data-testid="deliver-location">{vehicle.deliver_location}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Teslim Alan</p>
                  <p className="text-base font-medium text-slate-900" data-testid="received-by">{vehicle.received_by_name || 'Bilinmeyen'}</p>
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
            <div className="space-y-6">
              {photoCategories.map((categoryDef) => {
                const categoryPhotos = vehicle.photos.filter(p => p.category === categoryDef.id);
                if (categoryPhotos.length === 0) return null;
                
                return (
                  <div key={categoryDef.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{photoLabels[categoryDef.id]}</h3>
                      <Badge variant="outline">{categoryPhotos.length} fotoğraf</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {categoryPhotos.map((photo, index) => (
                        <div key={index} className="aspect-square rounded-sm overflow-hidden border border-slate-200 group">
                          <img 
                            src={photo.url} 
                            alt={`${photoLabels[photo.category]} ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                            data-testid={`photo-${photo.category}-${index}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Usage Summary - For Admin and TAFF Staff */}
        {(user.role === 'admin' || user.role === 'taff_staff') && (
          <Card className="border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Kullanım Özeti
              </CardTitle>
              <CardDescription>Bu aracı kullanan kişiler ve özet bilgiler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-3xl font-black text-primary">{testDrives.length}</p>
                  <p className="text-sm text-slate-600">Test Sürüşü</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-3xl font-black text-primary">
                    {[...new Set(testDrives.map(td => td.user_id))].length}
                  </p>
                  <p className="text-sm text-slate-600">Farklı Kullanıcı</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-3xl font-black text-primary">
                    {testDrives.reduce((sum, td) => sum + td.km_driven, 0).toLocaleString('tr-TR')}
                  </p>
                  <p className="text-sm text-slate-600">Toplam Test KM</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-3xl font-black text-primary">
                    ₺{testDrives.reduce((sum, td) => sum + td.fuel_added, 0).toLocaleString('tr-TR')}
                  </p>
                  <p className="text-sm text-slate-600">Toplam Yakıt</p>
                </div>
              </div>
              
              {testDrives.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Kullanıcı Bazlı Detay:</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      testDrives.reduce((acc, td) => {
                        if (!acc[td.user_name]) {
                          acc[td.user_name] = { count: 0, km: 0, fuel: 0 };
                        }
                        acc[td.user_name].count++;
                        acc[td.user_name].km += td.km_driven;
                        acc[td.user_name].fuel += td.fuel_added;
                        return acc;
                      }, {})
                    ).map(([userName, stats]) => (
                      <div key={userName} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{userName}</p>
                            <p className="text-xs text-slate-500">{stats.count} test sürüşü</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{stats.km.toLocaleString('tr-TR')} km</p>
                          <p className="text-xs text-slate-500">₺{stats.fuel.toLocaleString('tr-TR')} yakıt</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {testDrives.length === 0 && (
                <p className="text-center text-slate-500 py-4">Henüz test sürüşü yapılmamış</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Test Drives - Only for TAFF Staff and Admin */}
        {(user.role === 'admin' || user.role === 'taff_staff') && testDrives.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Test Sürüşleri ({testDrives.length})</CardTitle>
              <CardDescription>Yapılan test sürüşü kayıtları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testDrives.map((td) => (
                  <div key={td.id} className="border border-slate-200 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-slate-900">{td.user_name}</p>
                      <Badge variant="outline">{td.km_driven.toLocaleString('tr-TR')} km</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Başlangıç</p>
                        <p className="font-medium">{td.km_start.toLocaleString('tr-TR')} km</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Bitiş</p>
                        <p className="font-medium">{td.km_end.toLocaleString('tr-TR')} km</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Yakıt</p>
                        <p className="font-medium">₺{td.fuel_added.toLocaleString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Tarih</p>
                        <p className="font-medium">{new Date(td.created_at).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                    {td.notes && (
                      <p className="mt-3 text-sm text-slate-600">{td.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interim Reports - Only for TAFF Staff and Admin */}
        {(user.role === 'admin' || user.role === 'taff_staff') && interimReports.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Ara Raporlar ({interimReports.length})</CardTitle>
              <CardDescription>Oluşturulan ara denetim raporları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interimReports.map((report) => (
                  <div key={report.id} className="border border-slate-200 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">{report.user_name}</p>
                        <p className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString('tr-TR')}</p>
                      </div>
                      <Badge variant="outline">{report.report_type === 'inspection' ? 'Denetim' : 'Test Sürüşü'}</Badge>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.notes}</p>
                    {report.photos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {report.photos.map((photo, idx) => (
                          <img key={idx} src={photo} alt={`Rapor ${idx + 1}`} className="w-full aspect-square object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deliver-km">Bitiş KM *</Label>
              <Input
                id="deliver-km"
                type="number"
                placeholder={`Başlangıç: ${vehicle.km_start} km`}
                value={deliverKm}
                onChange={(e) => setDeliverKm(e.target.value)}
                required
                min={vehicle.km_start + 1}
                data-testid="deliver-km-input"
                className="h-12"
              />
              <p className="text-xs text-slate-500">
                Başlangıç KM: {vehicle.km_start?.toLocaleString('tr-TR')} km (Bu değerden büyük olmalı)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliver-location">Teslim Etme Noktası *</Label>
              <select
                id="deliver-location"
                value={deliverLocation}
                onChange={(e) => setDeliverLocation(e.target.value)}
                required
                className="flex h-12 w-full rounded-sm border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                data-testid="deliver-location-select"
              >
                <option value="">Nokta Seçin</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.name}>{location.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
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

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle className="text-red-600">Araç Sil</DialogTitle>
            <DialogDescription>
              {vehicle.brand} {vehicle.model} ({vehicle.plate}) plakalı aracı silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz ve ilişkili tüm kayıtlar (test sürüşleri, ara raporlar) da silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} data-testid="cancel-delete-btn">
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={deleting} 
              data-testid="confirm-delete-btn"
            >
              {deleting ? 'Siliniyor...' : 'Evet, Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleDetail;