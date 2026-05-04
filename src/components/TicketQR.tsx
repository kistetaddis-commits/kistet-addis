import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface TicketQRProps {
  ticketId: string;
  id: string;
  title: string;
  size?: number;
}

const TicketQR: React.FC<TicketQRProps> = ({
  ticketId,
  id,
  size = 200,
}) => {
  const qrData = JSON.stringify({
    ticketId,
    id,
  });

  return (
    <div className="bg-white p-4 rounded-2xl flex justify-center">
      <QRCodeSVG value={qrData} size={size} level="H" includeMargin />
    </div>
  );
};

export default TicketQR;