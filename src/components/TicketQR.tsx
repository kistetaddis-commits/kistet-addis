import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface TicketQRProps {
  ticketId: string;
  eventId: string;
  userName: string;
  size?: number;
}

const TicketQR: React.FC<TicketQRProps> = ({
  ticketId,
  eventId,
  size = 200,
}) => {
  const qrData = JSON.stringify({
    ticketId,
    eventId,
  });

  return (
    <div className="bg-white p-4 rounded-2xl flex justify-center">
      <QRCodeSVG value={qrData} size={size} level="H" includeMargin />
    </div>
  );
};

export default TicketQR;