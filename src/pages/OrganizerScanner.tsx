import React from 'react';
import ScannerPage from './ScannerPage';

/**
 * OrganizerScanner is a wrapper or specific view for organizers.
 * Currently, it shares the same scanning logic as ScannerPage.
 */
const OrganizerScanner: React.FC = () => {
  return <ScannerPage />;
};

export default OrganizerScanner;