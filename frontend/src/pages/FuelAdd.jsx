import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, Fuel, Camera, X } from 'lucide-react';

const fuelAmounts = [250, 500, 1000, 1500, 2000];

const FuelAdd = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}`);
      if (response.data.status !== 'received') {
        toast.error('Sadece teslimdeki araçlara yakıt eklenebilir');
        navigate('/');
        return;
      }
      setVehicle(response.data);
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

    const amount = selectedAmount === 'custom' ? parseInt(customAmount) : parseInt(selectedAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Lütfen geçerli bir tutar girin');
      return;
    }

    if (photos.length === 0) {
      toast.error('Lütfen en az 1 fotoğraf ekleyin');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/fuel-records', {
        vehicle_id: vehicleId,
        amount,
        photos,
        notes
      });
      toast.success('Yakıt kaydı başarıyla eklendi!');
      navigate(`/vehicle/${vehicleId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Yakıt kaydı eklenemedi');
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
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicle/${vehicleId}`)} data-testid="back-btn">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Yakıt Ekle</h1>
              <p className="text-sm text-slate-500">{vehicle.plate} - {vehicle.brand} {vehicle.model}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="fuel-form">
          {/* Amount Selection */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Yakıt Tutarı</CardTitle>
              <CardDescription>Eklenen yakıt tutarını seçin veya manuel girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fuelAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setSelectedAmount(amount.toString())}
                    className={`h-16 rounded-sm border-2 font-semibold text-lg transition-all ${
                      selectedAmount === amount.toString()
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 bg-white hover:border-primary hover:bg-slate-50'
                    }`}
                    data-testid={`amount-${amount}`}
                  >
                    ₺{amount}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAmount('custom')}
                  className={`h-16 rounded-sm border-2 font-semibold text-lg transition-all ${
                    selectedAmount === 'custom'
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white hover:border-primary hover:bg-slate-50'
                  }`}
                  data-testid="amount-custom"
                >
                  Diğer
                </button>
              </div>
              
              {selectedAmount === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Özel Tutar (₺)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="Örn: 750"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    required
                    min="1"
                    data-testid="custom-amount-input"
                    className="h-12"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Yakıt Fişi Fotoğrafları</CardTitle>
              <CardDescription>Yakıt alımının fotoğraflarını ekleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-upload-box has-image" data-testid={`fuel-photo-${index}`}>
                    <div className="relative w-full h-full">
                      <img src={photo} alt={`Yakıt fişi ${index + 1}`} className="photo-preview" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        data-testid={`remove-fuel-photo-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="photo-upload-box" data-testid="fuel-photo-upload">
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

          {/* Notes */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Notlar (Opsiyonel)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Yakıt alımı ile ilgili notlar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                data-testid="fuel-notes"
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(`/vehicle/${vehicleId}`)} className="flex-1 h-12" data-testid="cancel-btn">
              İptal
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 h-12" data-testid="submit-fuel-btn">
              <Fuel className="mr-2 h-5 w-5" />
              {submitting ? 'Kaydediliyor...' : 'Yakıt Kaydını Ekle'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default FuelAdd;
