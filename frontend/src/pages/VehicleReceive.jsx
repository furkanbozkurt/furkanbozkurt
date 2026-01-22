import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, Camera, Upload, X } from 'lucide-react';

const photoCategories = [
  { id: 'general', label: 'Genel Görünüm' },
  { id: 'dashboard', label: 'Gösterge Paneli' },
  { id: 'seats', label: 'Ön ve Arka Koltuk' },
  { id: 'hood', label: 'Kaput İçi' },
  { id: 'coolant', label: 'Motor Soğutma Sıvısı' }
];

const VehicleReceive = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plate: '',
    brand: '',
    model: '',
    company: '',
    fuel_status: '',
    notes: '',
    customer_email: ''
  });
  const [photos, setPhotos] = useState({});

  const handlePhotoUpload = (category, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const existingPhotos = photos[category] || [];
      const newPhotosPromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newPhotosPromises).then(results => {
        setPhotos({ 
          ...photos, 
          [category]: [...existingPhotos, ...results] 
        });
      });
    }
  };

  const removePhoto = (category, index) => {
    const categoryPhotos = [...(photos[category] || [])];
    categoryPhotos.splice(index, 1);
    
    if (categoryPhotos.length === 0) {
      const newPhotos = { ...photos };
      delete newPhotos[category];
      setPhotos(newPhotos);
    } else {
      setPhotos({ ...photos, [category]: categoryPhotos });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Object.keys(photos).length < 5) {
      toast.error('Lütfen 5 kategori için de fotoğraf yükleyin');
      return;
    }

    setLoading(true);
    try {
      // Flatten all photos with their categories
      const allPhotos = [];
      Object.entries(photos).forEach(([category, urls]) => {
        const urlArray = Array.isArray(urls) ? urls : [urls];
        urlArray.forEach(url => {
          allPhotos.push({ category, url });
        });
      });

      const vehicleData = {
        ...formData,
        plate: formData.plate.toUpperCase(),
        photos: allPhotos
      };

      await api.post('/vehicles', vehicleData);
      toast.success('Araç başarıyla teslim alındı!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Araç teslim alınamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} data-testid="back-btn">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Araç Teslim Al</h1>
              <p className="text-sm text-slate-500">Yeni araç kayıt formu</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="receive-form">
          {/* Vehicle Info */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Araç Bilgileri</CardTitle>
              <CardDescription>Araç detaylarını girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plate">Plaka *</Label>
                  <Input
                    id="plate"
                    placeholder="34 ABC 123"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    required
                    data-testid="plate-input"
                    className="h-12 font-mono font-bold uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marka *</Label>
                  <Input
                    id="brand"
                    placeholder="BMW"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    data-testid="brand-input"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="320i"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    data-testid="model-input"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Firma *</Label>
                  <Input
                    id="company"
                    placeholder="ABC Şirket"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                    data-testid="company-input"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel_status">Yakıt Durumu *</Label>
                  <select
                    id="fuel_status"
                    value={formData.fuel_status}
                    onChange={(e) => setFormData({ ...formData, fuel_status: e.target.value })}
                    required
                    className="flex h-12 w-full rounded-sm border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    data-testid="fuel-status-select"
                  >
                    <option value="">Seçin</option>
                    <option value="full">Dolu</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="empty">Boş</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_email">Müşteri E-posta (Opsiyonel)</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    placeholder="musteri@email.com"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    data-testid="customer-email-input"
                    className="h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  placeholder="Araçla ilgili özel notlar..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  data-testid="notes-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Araç Fotoğrafları (5 Kategori)</CardTitle>
              <CardDescription>Her kategori için birden fazla fotoğraf yükleyebilirsiniz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {photoCategories.map((category) => {
                  const categoryPhotos = photos[category.id] || [];
                  const hasPhotos = categoryPhotos.length > 0;
                  
                  return (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-slate-900">{category.label}</Label>
                        <Badge variant={hasPhotos ? "default" : "outline"} className={hasPhotos ? "bg-green-100 text-green-700" : ""}>
                          {hasPhotos ? `${categoryPhotos.length} fotoğraf` : 'Fotoğraf yok'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Existing photos */}
                        {categoryPhotos.map((photoUrl, index) => (
                          <div key={index} className="photo-upload-box has-image" data-testid={`photo-preview-${category.id}-${index}`}>
                            <div className="relative w-full h-full">
                              <img src={photoUrl} alt={`${category.label} ${index + 1}`} className="photo-preview" />
                              <button
                                type="button"
                                onClick={() => removePhoto(category.id, index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                data-testid={`remove-photo-${category.id}-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Upload button */}
                        <div className="photo-upload-box" data-testid={`photo-upload-${category.id}`}>
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            <Camera className="h-8 w-8 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-500 text-center px-2">
                              {hasPhotos ? 'Daha fazla ekle' : 'Fotoğraf ekle'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handlePhotoUpload(category.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/')} className="flex-1 h-12" data-testid="cancel-btn">
              İptal
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12" data-testid="submit-btn">
              <Upload className="mr-2 h-5 w-5" />
              {loading ? 'Kaydediliyor...' : 'Araç Teslim Al'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default VehicleReceive;