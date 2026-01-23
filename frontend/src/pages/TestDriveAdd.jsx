import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, Car, Camera, X } from 'lucide-react';

const TestDriveAdd = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastKm, setLastKm] = useState(0);
  const [formData, setFormData] = useState({
    km_start: '',
    km_end: '',
    fuel_added: '0',
    notes: ''
  });
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchVehicleAndLastKm();
  }, [vehicleId]);

  const fetchVehicleAndLastKm = async () => {
    try {
      const [vehicleRes, testDrivesRes] = await Promise.all([
        api.get(`/vehicles/${vehicleId}`),
        api.get(`/test-drives/vehicle/${vehicleId}`)
      ]);
      
      const veh = vehicleRes.data;
      setVehicle(veh);
      
      // Get current KM from vehicle (backend calculates this)
      const currentKm = veh.current_km || veh.km_start;
      setLastKm(currentKm);
      setFormData(prev => ({ ...prev, km_start: currentKm.toString() }));
    } catch (error) {
      toast.error('Araç bilgisi yüklenemedi');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotosPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPhotosPromises).then(results => {
      setPhotos([...photos, ...results]);
    });
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const kmStart = parseInt(formData.km_start);
    const kmEnd = parseInt(formData.km_end);
    const fuelAdded = parseInt(formData.fuel_added) || 0;

    if (kmEnd <= kmStart) {
      toast.error('Bitiş KM başlangıç KM\'den büyük olmalıdır');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/test-drives', {
        vehicle_id: vehicleId,
        km_start: kmStart,
        km_end: kmEnd,
        fuel_added: fuelAdded,
        notes: formData.notes,
        photos
      });
      toast.success('Test sürüşü kaydedildi!');
      navigate(`/vehicle/${vehicleId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Test sürüşü kaydedilemedi');
    } finally {
      setSubmitting(false);
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicle/${vehicleId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Test Sürüşü Ekle</h1>
              <p className="text-sm text-slate-500">{vehicle.plate} - {vehicle.brand} {vehicle.model}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>KM Bilgileri</CardTitle>
              <CardDescription>Son kayıt: {lastKm.toLocaleString('tr-TR')} km</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="km_start">Başlangıç KM</Label>
                  <Input
                    id="km_start"
                    type="number"
                    value={formData.km_start}
                    onChange={(e) => setFormData({ ...formData, km_start: e.target.value })}
                    required
                    min={lastKm}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="km_end">Bitiş KM *</Label>
                  <Input
                    id="km_end"
                    type="number"
                    value={formData.km_end}
                    onChange={(e) => setFormData({ ...formData, km_end: e.target.value })}
                    required
                    min={parseInt(formData.km_start) + 1}
                    className="h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel_added">Eklenen Yakıt (₺)</Label>
                <Input
                  id="fuel_added"
                  type="number"
                  value={formData.fuel_added}
                  onChange={(e) => setFormData({ ...formData, fuel_added: e.target.value })}
                  min="0"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Test sürüşü notları..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Fotoğraflar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-upload-box has-image">
                    <div className="relative w-full h-full">
                      <img src={photo} alt={`Test ${index + 1}`} className="photo-preview" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="photo-upload-box">
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                    <Camera className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500 text-center">Fotoğraf Ekle</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(`/vehicle/${vehicleId}`)} className="flex-1 h-12">
              İptal
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 h-12">
              <Car className="mr-2 h-5 w-5" />
              {submitting ? 'Kaydediliyor...' : 'Test Sürüşünü Kaydet'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TestDriveAdd;