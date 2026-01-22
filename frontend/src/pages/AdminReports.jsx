import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { LogOut, Car, PlusCircle, Trash2, MapPin, Settings } from 'lucide-react';

const AdminReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [brands, setBrands] = useState([]);
  const [locations, setLocations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCompany, setNewCompany] = useState({ name: '', contact_person: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('valetpro_user') || '{}');

  useEffect(() => {
    if (user.role !== 'admin') {
      toast.error('Bu sayfaya erişim yetkiniz yok');
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, brandsRes, locationsRes, usersRes, companiesRes] = await Promise.all([
        api.get('/reports/user-summary'),
        api.get('/brands'),
        api.get('/locations'),
        api.get('/users'),
        api.get('/companies')
      ]);
      setUserReports(reportsRes.data);
      setBrands(brandsRes.data);
      setLocations(locationsRes.data);
      setUsers(usersRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.trim()) return;

    try {
      await api.post('/brands', { name: newBrand.trim() });
      toast.success('Marka eklendi');
      setNewBrand('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Marka eklenemedi');
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (!confirm('Bu markayı silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/brands/${brandId}`);
      toast.success('Marka silindi');
      fetchData();
    } catch (error) {
      toast.error('Marka silinemedi');
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;

    try {
      await api.post('/locations', { name: newLocation.trim() });
      toast.success('Lokasyon eklendi');
      setNewLocation('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lokasyon eklenemedi');
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('Bu lokasyonu silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/locations/${locationId}`);
      toast.success('Lokasyon silindi');
      fetchData();
    } catch (error) {
      toast.error('Lokasyon silinemedi');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('valetpro_token');
    localStorage.removeItem('valetpro_user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-sm">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Yönetici Paneli</h1>
                <p className="text-xs text-slate-500">TAFF OTOPARK</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">Yönetici</p>
              </div>
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users">Kullanıcı Yönetimi</TabsTrigger>
            <TabsTrigger value="reports">Kullanıcı Raporları</TabsTrigger>
            <TabsTrigger value="brands">Marka Yönetimi</TabsTrigger>
            <TabsTrigger value="locations">Lokasyon Yönetimi</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Tüm Kullanıcılar ({users.length})</CardTitle>
                <CardDescription>Kullanıcı yetkileri sadece admin tarafından değiştirilebilir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        {user.company_name && (
                          <p className="text-xs text-slate-500">Firma: {user.company_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {!user.approved && user.role === 'company' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await api.put(`/users/${user.id}/approve`);
                                toast.success('Kullanıcı onaylandı');
                                fetchData();
                              } catch (error) {
                                toast.error('Onaylama başarısız');
                              }
                            }}
                          >
                            Onayla
                          </Button>
                        )}
                        <select
                          value={user.role}
                          onChange={async (e) => {
                            try {
                              await api.put(`/users/${user.id}/role?role=${e.target.value}`);
                              toast.success('Yetki güncellendi');
                              fetchData();
                            } catch (error) {
                              toast.error('Yetki güncellenemedi');
                            }
                          }}
                          className="flex h-10 rounded-sm border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="company">Firma</option>
                          <option value="taff_staff">TAFF Personel</option>
                          <option value="admin">Yönetici</option>
                        </select>
                        <Badge variant={
                          user.role === 'admin' ? 'default' : 
                          user.role === 'taff_staff' ? 'secondary' : 
                          'outline'
                        }>
                          {user.role === 'admin' ? 'Admin' : 
                           user.role === 'taff_staff' ? 'TAFF Personel' : 
                           'Firma'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Kullanıcı Bazlı Raporlar</h2>
              {userReports.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-slate-500">Henüz rapor bulunmuyor</p>
                  </CardContent>
                </Card>
              ) : (
                userReports.map((report) => (
                  <Card key={report.user_id} className="border-slate-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{report.user_name}</CardTitle>
                        <div className="flex gap-4">
                          <Badge variant="outline">{report.total_vehicles} Araç</Badge>
                          <Badge variant="outline">{report.total_km?.toLocaleString('tr-TR')} km</Badge>
                          <Badge variant="outline">₺{report.total_fuel?.toLocaleString('tr-TR')} Yakıt</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-slate-700">Araç Detayları:</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200">
                                <th className="text-left py-2">Plaka</th>
                                <th className="text-left py-2">Marka/Model</th>
                                <th className="text-right py-2">Başlangıç KM</th>
                                <th className="text-right py-2">Bitiş KM</th>
                                <th className="text-right py-2">Toplam KM</th>
                                <th className="text-right py-2">Yakıt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.vehicles.map((v, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                  <td className="py-2 font-mono font-bold">{v.plate}</td>
                                  <td className="py-2">{v.brand} {v.model}</td>
                                  <td className="text-right py-2">{v.km_start?.toLocaleString('tr-TR')}</td>
                                  <td className="text-right py-2">{v.km_end?.toLocaleString('tr-TR')}</td>
                                  <td className="text-right py-2 font-bold">{v.total_km?.toLocaleString('tr-TR')}</td>
                                  <td className="text-right py-2">₺{v.total_fuel?.toLocaleString('tr-TR')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands">
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Yeni Marka Ekle</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddBrand} className="flex gap-4">
                    <Input
                      placeholder="Marka adı (örn: Tesla)"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      className="h-12"
                    />
                    <Button type="submit" className="h-12">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ekle
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Mevcut Markalar ({brands.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {brands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-sm">
                        <span className="font-medium">{brand.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBrand(brand.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Yeni Lokasyon Ekle</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddLocation} className="flex gap-4">
                    <Input
                      placeholder="Lokasyon adı (örn: D Kapı)"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="h-12"
                    />
                    <Button type="submit" className="h-12">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ekle
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Mevcut Lokasyonlar ({locations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{location.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLocation(location.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminReports;
