import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface UpiQrCodeProps {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionRef: string;
  transactionNote: string;
}

export default function UpiQrCode({
  upiId,
  payeeName,
  amount,
  transactionRef,
  transactionNote,
}: UpiQrCodeProps) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(payeeName)}` +
    `&am=${amount.toFixed(2)}` +
    `&cu=INR` +
    `&tr=${encodeURIComponent(transactionRef)}` +
    `&tn=${encodeURIComponent(transactionNote)}`;

  useEffect(() => {
    if (!upiId || amount <= 0) {
      setQrSrc('');
      return;
    }

    // Generate high-resolution QR code with error correction level 'H' (High) to allow space for the center logo
    QRCode.toDataURL(upiUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        const qrImage = new Image();
        qrImage.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = qrImage.width;
          canvas.height = qrImage.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setQrSrc(url);
            return;
          }

          // Draw the base QR code
          ctx.drawImage(qrImage, 0, 0);

          // Load the logo image
          const logoImage = new Image();
          logoImage.onload = () => {
            const qrSize = canvas.width;
            // Logo size is 20% of QR size
            const logoSize = qrSize * 0.25;
            const logoPos = (qrSize - logoSize) / 2;

            // Draw a rounded white background card behind the logo
            const bgOffset = 4;
            const bgSize = logoSize + bgOffset * 2;
            const bgPos = logoPos - bgOffset;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(bgPos, bgPos, bgSize, bgSize, 6);
            } else {
              ctx.rect(bgPos, bgPos, bgSize, bgSize);
            }
            ctx.fill();

            // Draw logo image
            ctx.drawImage(logoImage, logoPos, logoPos, logoSize, logoSize);

            // Set final base64 source
            setQrSrc(canvas.toDataURL('image/png'));
            setError('');
          };

          logoImage.onerror = () => {
            // Fallback to QR code without logo if logo fails to load
            setQrSrc(url);
            setError('');
          };

          logoImage.src = '/G - Copy.png';
        };

        qrImage.onerror = () => {
          setQrSrc(url);
          setError('');
        };

        qrImage.src = url;
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to generate UPI QR code:', err);
        setError('Failed to generate QR Code');
      });
  }, [upiId, payeeName, amount, transactionRef, transactionNote, upiUrl]);

  if (!upiId) {
    return (
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '10px',
        }}
      >
        Please select/specify a target UPI ID to generate the QR Code.
      </div>
    );
  }

  if (amount <= 0) {
    return (
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '10px',
        }}
      >
        Enter a payment amount greater than ₹0 to generate the QR Code.
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#fef08a', // vibrant yellow background matching the app's neo-brutalist theme
          border: '2.5px solid var(--border)',
          boxShadow: '3px 3px 0px var(--border)',
          borderRadius: '6px',
          padding: '16px',
          marginTop: '12px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#000',
            marginBottom: '8px',
            letterSpacing: '0.5px',
          }}
        >
          Scan to Pay
        </div>

        {error ? (
          <div
            style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 600, padding: '20px 0' }}
          >
            ⚠️ {error}
          </div>
        ) : qrSrc ? (
          <div
            onClick={() => setIsZoomed(true)}
            style={{
              background: '#ffffff',
              padding: '8px',
              border: '2px solid #000000',
              borderRadius: '4px',
              boxShadow: '2px 2px 0px #000000',
              display: 'inline-flex',
              marginBottom: '10px',
              cursor: 'zoom-in',
            }}
            title="Click to zoom QR Code"
          >
            <img
              src={qrSrc}
              alt="UPI Payment QR Code"
              style={{ width: '160px', height: '160px', display: 'block' }}
            />
          </div>
        ) : (
          <div
            style={{
              height: '176px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#000',
            }}
          >
            Generating QR Code...
          </div>
        )}

        <div style={{ fontSize: '16px', fontWeight: 800, color: '#000', marginBottom: '4px' }}>
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>

        <div
          style={{
            fontSize: '11px',
            color: '#000',
            opacity: 0.8,
            wordBreak: 'break-all',
            lineHeight: '1.4',
          }}
        >
          <div>
            <strong>Payee:</strong> {payeeName}
          </div>
          <div style={{ fontSize: '10px' }}>
            <strong>UPI ID:</strong> {upiId}
          </div>
          <div style={{ fontSize: '9px', marginTop: '2px', color: '#4b5563' }}>
            Ref: {transactionRef}
          </div>
        </div>
      </div>

      {isZoomed && qrSrc && (
        <div
          onClick={() => setIsZoomed(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999, // on top of standard modals
            cursor: 'zoom-out',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()} // prevent close when clicking the container itself
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#fef08a', // match container background
              border: '4px solid #000000',
              borderRadius: '12px',
              boxShadow: '8px 8px 0px #000000',
              padding: '24px',
              textAlign: 'center',
              maxWidth: '95vw',
              maxHeight: '95vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#000',
                marginBottom: '16px',
                letterSpacing: '1px',
              }}
            >
              Scan to Pay
            </div>

            <div
              style={{
                background: '#ffffff',
                padding: '12px',
                border: '3px solid #000000',
                borderRadius: '8px',
                boxShadow: '4px 4px 0px #000000',
                display: 'inline-flex',
                marginBottom: '16px',
              }}
            >
              <img
                src={qrSrc}
                alt="UPI Payment QR Code Zoomed"
                style={{ width: '280px', height: '280px', display: 'block' }}
              />
            </div>

            <div
              style={{
                fontSize: '26px',
                fontWeight: 900,
                color: '#000',
                marginBottom: '8px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>

            <div
              style={{
                fontSize: '13px',
                color: '#000',
                opacity: 0.9,
                lineHeight: '1.5',
                width: '280px',
              }}
            >
              <div>
                <strong>Payee:</strong> {payeeName}
              </div>
              <div>
                <strong>UPI ID:</strong> {upiId}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  marginTop: '6px',
                  color: '#4b5563',
                  wordBreak: 'break-all',
                }}
              >
                Ref: {transactionRef}
              </div>
            </div>

            <button
              onClick={() => setIsZoomed(false)}
              style={{
                marginTop: '20px',
                padding: '8px 24px',
                background: '#ffffff',
                border: '2px solid #000000',
                borderRadius: '4px',
                boxShadow: '2px 2px 0px #000000',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
