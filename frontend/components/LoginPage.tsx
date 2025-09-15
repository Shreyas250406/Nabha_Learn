import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Globe, Wifi, Smartphone } from 'lucide-react';
import backend from '~backend/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { TTSButton } from './TTSButton';
import { InputWithTTS } from './InputWithTTS';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpMessage, setOtpMessage] = useState('');

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure phone number starts with + if not already provided
      const formattedPhone = phoneNumber.trim().startsWith('+') ? phoneNumber.trim() : `+${phoneNumber.trim()}`;
      
      const response = await backend.auth.sendOTP({
        phone_number: formattedPhone
      });
      
      setOtpMessage(response.message);
      setStep('otp');
      toast({
        title: t('common.success'),
        description: 'OTP sent successfully',
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      toast({
        title: t('common.error'),
        description: 'Phone number not found',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure phone number starts with + if not already provided
      const formattedPhone = phoneNumber.trim().startsWith('+') ? phoneNumber.trim() : `+${phoneNumber.trim()}`;
      
      const response = await backend.auth.verifyOTP({
        phone_number: formattedPhone,
        otp_code: otpCode.trim()
      });
      
      login(response.user, response.token);
      toast({
        title: t('common.success'),
        description: `${t('dashboard.welcome')}, ${response.user.name}!`,
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast({
        title: t('common.error'),
        description: 'Invalid or expired OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtpCode('');
    setOtpMessage('');
  };

  const demoCredentials = [
    { phone: '+1234567890', role: 'Admin' },
    { phone: '+1234567891', role: 'Teacher' },
    { phone: '+1234567892', role: 'Student' },
    { phone: '+1234567893', role: 'Parent' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{t('header.title')}</h1>
          <p className="text-lg text-gray-600 mt-2">Digital Literacy for Everyone</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Features */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">{t('features.essential_digital_skills')}</h3>
                  </div>
                  <div className="flex items-start space-x-2">
                    <p className="text-gray-600 flex-1">{t('features.essential_digital_skills_desc')}</p>
                    <TTSButton text={t('features.essential_digital_skills_desc')} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Globe className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">{t('features.multilingual')}</h3>
                  </div>
                  <div className="flex items-start space-x-2">
                    <p className="text-gray-600 flex-1">{t('features.multilingual_desc')}</p>
                    <TTSButton text={t('features.multilingual_desc')} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 hover:border-purple-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Wifi className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">{t('features.offline_first')}</h3>
                  </div>
                  <div className="flex items-start space-x-2">
                    <p className="text-gray-600 flex-1">{t('features.offline_first_desc')}</p>
                    <TTSButton text={t('features.offline_first_desc')} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 hover:border-orange-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Smartphone className="h-8 w-8 text-orange-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">{t('features.mobile_optimized')}</h3>
                  </div>
                  <div className="flex items-start space-x-2">
                    <p className="text-gray-600 flex-1">{t('features.mobile_optimized_desc')}</p>
                    <TTSButton text={t('features.mobile_optimized_desc')} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Demo Credentials */}
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">{t('demo.title')}</CardTitle>
                <p className="text-gray-600">{t('demo.description')}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demoCredentials.map((cred, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{cred.role}:</span>
                      <span className="text-sm text-gray-600">{cred.phone}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800"><strong>{t('demo.note')}</strong></p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Login form */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-gray-900">{t('login.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {step === 'phone' ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <InputWithTTS
                      type="tel"
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      placeholder={t('login.phonePlaceholder')}
                      label={t('login.phoneLabel')}
                      required
                      className="w-full"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('common.language')}
                      </label>
                      <Select value={i18n.language} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">{t('languages.english')}</SelectItem>
                          <SelectItem value="hi">{t('languages.hindi')}</SelectItem>
                          <SelectItem value="pa">{t('languages.punjabi')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={loading}
                    >
                      {loading ? t('common.loading') : t('login.submitButton')}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <InputWithTTS
                      type="text"
                      value={otpCode}
                      onChange={setOtpCode}
                      placeholder={t('otp.placeholder')}
                      label={t('otp.title')}
                      required
                      maxLength={6}
                      className="w-full"
                      ttsText={t('otp.message')}
                    />

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">{otpMessage || t('otp.message')}</p>
                    </div>

                    <div className="space-y-2">
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={loading}
                      >
                        {loading ? t('common.loading') : t('otp.verify')}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleBackToPhone}
                      >
                        {t('otp.back')}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
