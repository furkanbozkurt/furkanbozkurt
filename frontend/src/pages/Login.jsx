import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Car, KeyRound } from 'lucide-react';

const COMPANY_ROLES = ['company_manager', 'company_staff'];

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', loginData);
      localStorage.setItem('valetpro_token', response.data.access_token);
      localStorage.setItem('valetpro_user', JSON.stringify(response.data.user));
      toast.success('Giriş başarılı!');
      
      // Redirect based on role
      const role = response.data.user.role;
      if (COMPANY_ROLES.includes(role)) {
        navigate('/customer');
      } else if (role === 'admin' || role === 'taff_manager') {
        navigate('/reports');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // All new registrations go to pending approval
      const response = await api.post('/auth/register', {
        ...registerData,
        role: 'company_staff'  // Default role, admin will change
      });
      
      toast.success('Kayıt başarılı! Hesabınız yönetici onayı bekliyor.');
    } catch (error) {
      if (error.response?.status === 201) {
        toast.success(error.response.data.detail || 'Kayıt başarılı! Hesabınız yönetici onayı bekliyor.');
      } else {
        toast.error(error.response?.data?.detail || 'Kayıt başarısız');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{
           backgroundImage: 'url(https://images.unsplash.com/photo-1572701190287-8666104be064?crop=entropy&cs=srgb&fm=jpg&q=85)',
           backgroundSize: 'cover',
           backgroundPosition: 'center'
         }}>
      <div className="hero-overlay" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary p-4 rounded-sm">
              <Car className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">TAFF OTOPARK</h1>
          <p className="text-slate-300 text-sm">Otopark Yönetim Sistemi</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Hoş Geldiniz</CardTitle>
            <CardDescription>Hesabınıza giriş yapın veya yeni hesap oluşturun</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">Giriş Yap</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Kayıt Ol</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-posta</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      data-testid="login-email-input"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Şifre</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      data-testid="login-password-input"
                      className="h-12"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={loading} data-testid="login-submit-btn">
                    <KeyRound className="mr-2 h-4 w-4" />
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Ad Soyad</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      data-testid="register-name-input"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-posta</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      data-testid="register-email-input"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Şifre</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      data-testid="register-password-input"
                      className="h-12"
                    />
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                    <p>Kayıt sonrası hesabınız yönetici onayı bekleyecektir.</p>
                    <p>Yönetici size rol ve firma atayacaktır.</p>
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={loading} data-testid="register-submit-btn">
                    {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;