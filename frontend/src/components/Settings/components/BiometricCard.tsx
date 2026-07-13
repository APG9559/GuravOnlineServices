import { Capacitor } from '@capacitor/core';

interface BiometricCardProps {
  showPasskeyOption: boolean;
  registeringPasskey: boolean;
  handleRegisterPasskey: () => Promise<void>;
  biometricHardwareAvailable: boolean;
  biometricEnrolled: boolean;
  biometricSaved: boolean;
  biometricEnrolling: boolean;
  handleEnrollBiometric: () => Promise<void>;
  handleRemoveBiometric: () => Promise<void>;
}

export default function BiometricCard({
  showPasskeyOption,
  registeringPasskey,
  handleRegisterPasskey,
  biometricHardwareAvailable,
  biometricEnrolled,
  biometricSaved,
  biometricEnrolling,
  handleEnrollBiometric,
  handleRemoveBiometric,
}: BiometricCardProps) {
  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '0.5rem' }}>
        Biometrics & Passkeys
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Set up password-free authentication to log in quickly and securely.
      </div>

      {/* Passkey Setup Section */}
      {showPasskeyOption && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Passkeys (WebAuthn)</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
            Best for modern devices. Securely registers this device with the server.
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleRegisterPasskey}
            disabled={registeringPasskey}
          >
            {registeringPasskey ? 'Registering Device…' : 'Register Passkey'}
          </button>
        </div>
      )}

      {/* Native Biometric Setup Section — only visible on native mobile platform */}
      {Capacitor.isNativePlatform() && (
        <>
          <hr
            style={{
              border: 'none',
              borderTop: '1px solid rgba(24,95,165,0.15)',
              margin: '1.5rem 0',
            }}
          />
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
              Fingerprint Login (Native Keystore)
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
              Best for older Android devices. Saves an encrypted token locally in your device's
              keystore.
            </div>

            {!biometricHardwareAvailable ? (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  background: 'var(--accent-light)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(24,95,165,0.1)',
                }}
              >
                ℹ️ Fingerprint authentication hardware is not available or supported on this device.
              </div>
            ) : !biometricEnrolled ? (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  background: 'var(--accent-light)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(24,95,165,0.1)',
                }}
              >
                ⚠️ Fingerprint sensor detected, but no fingerprints are registered. Please add a
                fingerprint in your device's Android Settings to enable fingerprint login.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>
                    Status: <strong>{biometricSaved ? 'Enabled' : 'Disabled'}</strong>
                  </span>
                  {biometricSaved ? (
                    <button
                      className="btn"
                      style={{
                        color: 'var(--danger)',
                        borderColor: 'rgba(239,68,68,0.5)',
                        padding: '6px 12px',
                        fontSize: 12,
                      }}
                      onClick={handleRemoveBiometric}
                    >
                      Disable Fingerprint
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleEnrollBiometric}
                      disabled={biometricEnrolling}
                    >
                      {biometricEnrolling ? 'Configuring…' : 'Enable Fingerprint'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
