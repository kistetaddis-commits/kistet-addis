import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Menu, X, QrCode, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';
import BrandLogo from './BrandLogo';

const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'am', name: 'አማርኛ' },
    { code: 'om', name: 'Afaan Oromo' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo variant="color" className="h-12 w-36" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="font-bold text-gray-600 hover:text-blue-600 transition-colors">{t('home')}</Link>
            
            <Link 
              to="/scanner" 
              className="flex items-center gap-2 font-bold text-orange-500 hover:text-orange-600 transition-colors bg-orange-50 px-4 py-2 rounded-xl"
            >
              <QrCode className="w-4 h-4" />
              <span>{t('scanner')}</span>
            </Link>

            <div className="relative group">
              <button className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all">
                <Globe className="w-4 h-4" />
                {languages.find(l => l.code === language)?.name}
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`w-full text-left px-6 py-2 text-sm font-bold transition-colors ${
                      language === lang.code ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <Link 
              to="/admin/dashboard" 
              className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {t('admin')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-6 space-y-4 shadow-xl">
          <Link to="/" className="block font-bold text-gray-600" onClick={() => setIsOpen(false)}>{t('home')}</Link>
          
          <Link to="/scanner" className="flex items-center gap-2 font-bold text-orange-500 bg-orange-50 p-4 rounded-2xl" onClick={() => setIsOpen(false)}>
            <QrCode className="w-5 h-5" />
            {t('scanner')}
          </Link>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">{t('languageLabel')}</p>
            <div className="grid grid-cols-1 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`text-left py-2 font-bold ${
                    language === lang.code ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
          <Link to="/admin/dashboard" className="block w-full bg-gray-900 text-white text-center py-4 rounded-2xl font-black" onClick={() => setIsOpen(false)}>
            {t('adminDashboard')}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;