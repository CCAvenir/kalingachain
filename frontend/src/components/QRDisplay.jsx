import { QRCodeSVG } from "qrcode.react";

function QRDisplay({ address }) {
  return (
    <div className="card flex flex-col items-center gap-5">
      <h3 className="text-3xl font-bold text-black">Your Benefit QR Code</h3>
      <p className="text-center text-xl text-gray-800">
        Show this QR code to the merchant to verify your government benefits.
      </p>
      <div className="rounded-xl bg-white p-4">
        <QRCodeSVG value={address || "Not connected"} size={300} />
      </div>
      <p className="break-all text-center text-lg text-gray-800">{address}</p>
    </div>
  );
}

export default QRDisplay;
