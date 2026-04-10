import React from 'react';

type LogoVariant = 'color' | 'black' | 'white-on-black' | 'white-on-blue';

interface BrandLogoProps {
  variant?: LogoVariant;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'color', className = 'h-10 w-32' }) => {
  const logoUrl = 'https://storage.googleapis.com/dala-prod-public-storage/attachments/18fcb530-83a1-4b00-a8a0-fe9a27e33d5e/1774954026086_logos-03.jpg';

  // Map variants to background positions (assuming 2x2 grid based on description)
  const positions = {
    'color': '0% 0%',
    'black': '100% 0%',
    'white-on-black': '0% 100%',
    'white-on-blue': '100% 100%'
  };

  return (
    <div 
      className={`bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${logoUrl})`,
        backgroundSize: '200% 200%', // 2x2 grid
        backgroundPosition: positions[variant],
        // No fixed aspect ratio here, parent classes (h-X w-X) should define it
      }}
      role="img"
      aria-label="Kistet Addis Logo"
    />
  );
};

export default BrandLogo;