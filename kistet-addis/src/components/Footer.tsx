import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from './BrandLogo';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-gray-900 text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <BrandLogo variant="white-on-blue" className="h-12 w-40" />
            </div>
            <p className="text-gray-400 max-w-sm">
              {t('footerTagline')}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">{t('links')}</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-blue-500 transition-colors">{t('aboutUs')}</a></li>
              <li><a href="#" className="hover:text-blue-500 transition-colors">{t('contactSupport')}</a></li>
              <li><a href="#" className="hover:text-blue-500 transition-colors">{t('termsOfService')}</a></li>
              <li><a href="#" className="hover:text-blue-500 transition-colors">{t('privacyPolicy')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">{t('socialMedia')}</h4>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">FB</a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors">TW</a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">IG</a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">YT</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Kistet Addis. {t('allRightsReserved')}.
        </div>
      </div>
    </footer>
  );
};

export default Footer;