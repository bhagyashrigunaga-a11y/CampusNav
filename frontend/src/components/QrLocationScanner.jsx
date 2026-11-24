import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

export default function QrLocationScanner({ nodes, onLocationSelected, onClose }) {
  const videoRef = useRef(null);
  const [message, setMessage] = useState('Starting camera…');

  useEffect(() => {
    let cancelled = false;
    let stream = null;
    let timer = null;

    const stopCamera = () => {
      if (timer) clearTimeout(timer);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };

    const scan = async (detector) => {
      if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
        if (!cancelled) timer = setTimeout(() => scan(detector), 250);
        return;
      }

      try {
        const codes = await detector.detect(videoRef.current);
        if (cancelled) return;
        if (codes.length > 0) {
          const match = codes[0].rawValue.match(/^CAMPUSNAV:LOCATION:(.+)$/);
          const node = match && nodes.find(candidate => candidate.id === match[1]);
          if (node) {
            onLocationSelected(node.id);
            onClose();
            return;
          }
          setMessage('QR code is not a recognized CampusNav location. Try another label or select a location manually.');
        }
      } catch (error) {
        if (!cancelled) setMessage('Camera scan failed. Check camera permission or select a location manually.');
      }
      if (!cancelled) timer = setTimeout(() => scan(detector), 300);
    };

    const start = async () => {
      if (!('BarcodeDetector' in window)) {
        setMessage('QR scanning is not supported in this browser. Use manual location selection.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage('Camera access is unavailable. Use manual location selection.');
        return;
      }

      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setMessage('Point the camera at a CampusNav location QR code.');
        scan(detector);
      } catch (error) {
        if (!cancelled) setMessage('Unable to start QR scanning. Allow camera access or select a location manually.');
      }
    };

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [nodes, onLocationSelected, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="qr-scanner-title" className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="qr-scanner-title" className="flex items-center gap-2 font-bold text-slate-900">
            <Camera className="h-5 w-5 text-sky-600" /> Scan campus location
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close QR scanner">
            <X className="h-4 w-4" />
          </button>
        </div>
        <video ref={videoRef} muted playsInline className="aspect-video w-full rounded-xl bg-slate-950 object-cover" />
        <p role="status" className="text-xs text-slate-600">{message}</p>
        <p className="text-[11px] text-slate-500">Manual location selection remains available if camera scanning is unavailable.</p>
      </div>
    </div>
  );
}
