import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, User, Lock } from 'lucide-react';
import backend from '~backend/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { InputWithTTS } from './InputWithTTS';
import { TTSButton } from './TTSButton';

interface HeaderProps {
  roleColor: string;
}

const Header: React.FC<HeaderProps> = ({ roleColor }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const handlePhoneUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newPhoneNumber.trim()) return;

    setLoading(true);
    try {
      await backend.auth.updatePhone({
        user_id: user.id,
        new_phone_number: newPhoneNumber.trim()
      });

      toast({
        title: t('common.success'),
        description: 'Phone number updated successfully',
      });

      setShowPhoneModal(false);
      setNewPhoneNumber('');
    } catch (error) {
      console.error('Phone update error:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to update phone number',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <header className={`bg-${roleColor}-500 text-black shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">{t('header.title')}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-lg">{t('dashboard.welcome')}, {user?.name}</span>
              
              <Select value={i18n.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32 bg-white text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('languages.english')}</SelectItem>
                  <SelectItem value="hi">{t('languages.hindi')}</SelectItem>
                  <SelectItem value="pa">{t('languages.punjabi')}</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="cursor-pointer bg-white text-black hover:bg-gray-100">
                    <AvatarFallback>{user ? getUserInitials(user.name) : 'U'}</AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">{user?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer text-sm text-gray-600">
                      <span>Role: {user?.role}</span>
                    </div>
                    <hr />
                    <div 
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => setShowPhoneModal(true)}
                    >
                      <Lock className="h-4 w-4" />
                      <span className="text-sm">Update Phone</span>
                    </div>
                    <div 
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer text-red-600"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">{t('header.logout')}</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      {/* Phone Update Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Phone Number</h3>
            <form onSubmit={handlePhoneUpdate} className="space-y-4">
              <div>
                <Label htmlFor="currentPhone">Current Phone</Label>
                <Input
                  id="currentPhone"
                  type="tel"
                  value={user?.phone_number || ''}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <InputWithTTS
                type="tel"
                value={newPhoneNumber}
                onChange={setNewPhoneNumber}
                placeholder={t('placeholders.phone_number')}
                label="New Phone Number"
                required
              />
              <div className="flex space-x-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? t('common.loading') : t('common.save')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
