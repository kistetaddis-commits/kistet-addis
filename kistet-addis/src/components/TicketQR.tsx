import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface TicketQRProps {
  ticketId: string;
  eventId: string;
  size?: number;
}

const TicketQR: React.FC<TicketQRProps> = ({ ticketId, eventId, size = 200 }) => {
  // Format: ticketId:eventId
  const qrData = `${ticketId}:${eventId}`;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-inner flex items-center justify-center">
      <QRCodeSVG 
        value={qrData}
        size={size}
        level="H"
        includeMargin={true}
        imageSettings={{
          src: "https://storage.googleapis.com/dala-prod-public-storage/generated-images/11a7535b-716b-4371-84ef-523ca3f266db/logo-placeholder.webp", // Optional logo
          x: undefined,
          y: undefined,
          height: 40,
          width: 40,
          excavate: true,
        }}
      />
    </div>
  );
};

export default TicketQR;