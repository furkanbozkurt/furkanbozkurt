import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, FileText, Camera, X } from 'lucide-react';

const InterimReportAdd = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportType, setReportType] = useState('inspection');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}`);
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

    if (!notes.trim()) {
      toast.error('Lütfen rapor notlarını girin');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/interim-reports', {
        vehicle_id: vehicleId,
        report_type: reportType,
        notes,
        photos
      });
      toast.success('Ara rapor oluşturuldu!');
      navigate(`/vehicle/${vehicleId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Rapor oluşturulamadı');
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
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ara Rapor Oluştur</h1>
              <p className="text-sm text-slate-500">{vehicle.plate} - {vehicle.brand} {vehicle.model}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Rapor Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report_type">Rapor Tipi</Label>
                <select
                  id="report_type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="flex h-12 w-full rounded-sm border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="inspection">Denetim</option>
                  <option value="test_drive">Test Sürüşü</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Rapor Notları *</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  placeholder="Detaylı rapor notları..."
                  required
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
                      <img src={photo} alt={`Rapor ${index + 1}`} className="photo-preview" />
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
              <FileText className="mr-2 h-5 w-5" />
              {submitting ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default InterimReportAdd;