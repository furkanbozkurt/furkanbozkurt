import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, Download, Car, Mail, Camera, Image } from 'lucide-react';

const photoLabels = {
  general: 'Genel Görünüm',
  dashboard: 'Gösterge Paneli',
  seats: 'Koltuklar',
  hood: 'Kaput İçi',
  coolant: 'Soğutma Sıvısı'
};

const FinalReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMailDialog, setShowMailDialog] = useState(false);
  const [mailTo, setMailTo] = useState('');
  const [sendingMail, setSendingMail] = useState(false);

  useEffect(() => {
    fetchFinalReport();
  }, [id]);

  const fetchFinalReport = async () => {
    try {
      const response = await api.get(`/vehicles/${id}/final-report`);
      setReport(response.data);
      // Pre-fill email if customer_email exists
      if (response.data.vehicle?.customer_email) {
        setMailTo(response.data.vehicle.customer_email);
      }
    } catch (error) {
      toast.error('Rapor yüklenemedi');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendMail = async () => {
    if (!mailTo || !mailTo.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }
    
    setSendingMail(true);
    try {
      await api.post(`/vehicles/${id}/send-report`, { email: mailTo });
      toast.success('Rapor başarıyla gönderildi!');
      setShowMailDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Rapor gönderilemedi');
    } finally {
      setSendingMail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  if (!report) return null;

  const { vehicle, test_drives, fuel_records, summary } = report;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Hide on print */}
      <header className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicle/${id}`)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Final Rapor</h1>
                <p className="text-sm text-slate-500">{vehicle.plate} - {vehicle.brand} {vehicle.model}</p>
              </div>
            </div>
            <Button onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              PDF Olarak Kaydet
            </Button>
            <Button variant="outline" onClick={() => setShowMailDialog(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Mail Gönder
            </Button>
          </div>
        </div>
      </header>

      {/* Print-friendly content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        {/* Print Header */}
        <div className="hidden print:block mb-8 text-center border-b-2 border-primary pb-4">
          <h1 className="text-3xl font-black text-primary">TAFF OTOPARK</h1>
          <p className="text-lg font-bold mt-2">ARAÇ TESLİM RAPORU</p>
        </div>

        {/* Vehicle Info */}
        <Card className="border-slate-200 mb-6 print:shadow-none">
          <CardHeader className="bg-slate-50">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Araç Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Plaka</p>
                <p className="font-bold text-lg">{vehicle.plate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Marka/Model</p>
                <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Firma</p>
                <p className="font-semibold">{vehicle.company}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Durum</p>
                <Badge className={vehicle.status === 'delivered' ? 'bg-blue-100 text-blue-700' : ''}>
                  {vehicle.status === 'delivered' ? 'Teslim Edildi' : vehicle.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-slate-200 mb-6 print:shadow-none">
          <CardHeader className="bg-primary text-white print:bg-slate-100 print:text-slate-900">
            <CardTitle>Özet</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded">
                <p className="text-3xl font-black text-primary">{summary.total_test_drives}</p>
                <p className="text-sm text-slate-600 mt-1">Test Sürüşü</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded">
                <p className="text-3xl font-black text-primary">{summary.total_test_km?.toLocaleString('tr-TR')}</p>
                <p className="text-sm text-slate-600 mt-1">Test KM</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded">
                <p className="text-3xl font-black text-primary">{summary.total_km?.toLocaleString('tr-TR')}</p>
                <p className="text-sm text-slate-600 mt-1">Toplam KM</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded">
                <p className="text-3xl font-black text-primary">₺{summary.total_fuel_spent?.toLocaleString('tr-TR')}</p>
                <p className="text-sm text-slate-600 mt-1">Toplam Yakıt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locations & KM */}
        <Card className="border-slate-200 mb-6 print:shadow-none">
          <CardHeader>
            <CardTitle>Teslim Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Teslim Alma</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nokta:</span>
                    <span className="font-medium">{vehicle.receive_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Başlangıç KM:</span>
                    <span className="font-medium">{vehicle.km_start?.toLocaleString('tr-TR')} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tarih:</span>
                    <span className="font-medium">{new Date(vehicle.received_at).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Teslim Alan:</span>
                    <span className="font-medium">{vehicle.received_by_name || 'Bilinmeyen'}</span>
                  </div>
                </div>
              </div>
              {vehicle.delivered_at && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Teslim Etme</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nokta:</span>
                      <span className="font-medium">{vehicle.deliver_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bitiş KM:</span>
                      <span className="font-medium">{vehicle.km_end?.toLocaleString('tr-TR')} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tarih:</span>
                      <span className="font-medium">{new Date(vehicle.delivered_at).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photos Section */}
        {vehicle.photos && vehicle.photos.length > 0 && (
          <Card className="border-slate-200 mb-6 print:shadow-none print:break-inside-avoid">
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Araç Fotoğrafları
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {vehicle.photos.map((photo, index) => (
                  <div key={index} className="space-y-2">
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      {photo.data && photo.data.startsWith('data:image') ? (
                        <img
                          src={photo.data}
                          alt={photoLabels[photo.category] || photo.category}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                      <div className="w-full h-full items-center justify-center hidden">
                        <Image className="h-8 w-8 text-slate-300" />
                      </div>
                    </div>
                    <p className="text-xs text-center font-medium text-slate-600">
                      {photoLabels[photo.category] || photo.category}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Drives */}
        {test_drives.length > 0 && (
          <Card className="border-slate-200 mb-6 print:shadow-none print:break-inside-avoid">
            <CardHeader>
              <CardTitle>Test Sürüşleri ({test_drives.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2">Kullanıcı</th>
                      <th className="text-right py-2">Başlangıç KM</th>
                      <th className="text-right py-2">Bitiş KM</th>
                      <th className="text-right py-2">Yapılan KM</th>
                      <th className="text-right py-2">Yakıt</th>
                      <th className="text-left py-2">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {test_drives.map((td) => (
                      <tr key={td.id} className="border-b border-slate-100">
                        <td className="py-2">{td.user_name}</td>
                        <td className="text-right py-2">{td.km_start.toLocaleString('tr-TR')}</td>
                        <td className="text-right py-2">{td.km_end.toLocaleString('tr-TR')}</td>
                        <td className="text-right py-2 font-bold">{td.km_driven.toLocaleString('tr-TR')}</td>
                        <td className="text-right py-2">₺{td.fuel_added.toLocaleString('tr-TR')}</td>
                        <td className="py-2">{new Date(td.created_at).toLocaleDateString('tr-TR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fuel Records */}
        {fuel_records.length > 0 && (
          <Card className="border-slate-200 mb-6 print:shadow-none">
            <CardHeader>
              <CardTitle>Yakıt Kayıtları ({fuel_records.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fuel_records.map((fr) => (
                  <div key={fr.id} className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <p className="font-medium">{fr.user_name}</p>
                      <p className="text-xs text-slate-500">{new Date(fr.created_at).toLocaleString('tr-TR')}</p>
                    </div>
                    <p className="text-lg font-bold text-primary">₺{fr.amount.toLocaleString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer for print */}
        <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-200 text-center text-sm text-slate-600">
          <p>TAFF OTOPARK - Otopark Yönetim Sistemi</p>
          <p className="mt-1">Rapor Tarihi: {new Date().toLocaleString('tr-TR')}</p>
        </div>
      </main>

      {/* Mail Dialog */}
      <Dialog open={showMailDialog} onOpenChange={setShowMailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raporu Mail ile Gönder</DialogTitle>
            <DialogDescription>
              Final raporunu belirtilen e-posta adresine gönderin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta Adresi</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@firma.com"
                value={mailTo}
                onChange={(e) => setMailTo(e.target.value)}
                data-testid="email-input"
              />
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
              <p className="font-medium mb-1">Gönderilecek içerik:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Araç bilgileri ({vehicle.plate})</li>
                <li>Test sürüşü özeti</li>
                <li>Teslim bilgileri</li>
                <li>Yakıt kayıtları</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMailDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSendMail} disabled={sendingMail}>
              <Mail className="mr-2 h-4 w-4" />
              {sendingMail ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinalReport;
