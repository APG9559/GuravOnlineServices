interface PwaUpdateToastProps {
  needRefresh: boolean;
  offlineReady: boolean;
  setNeedRefresh: (val: boolean) => void;
  setOfflineReady: (val: boolean) => void;
  updateServiceWorker: (reload: boolean) => void;
}

export default function PwaUpdateToast({
  needRefresh,
  offlineReady,
  setNeedRefresh,
  setOfflineReady,
  updateServiceWorker,
}: PwaUpdateToastProps) {
  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="pwa-toast">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "6px",
            background: needRefresh ? "var(--accent)" : "var(--success-bg)",
            border: "2.5px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 14,
            boxShadow: "2px 2px 0px var(--border)",
            flexShrink: 0,
          }}
        >
          {needRefresh ? "i" : "✓"}
        </div>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontSize: "14px",
              fontWeight: 800,
              marginBottom: 4,
              textTransform: "uppercase",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {needRefresh ? "Update Available" : "Offline Ready"}
          </h4>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-muted)",
              lineHeight: 1.4,
            }}
          >
            {needRefresh
              ? "A new version of Gurav Online Services is available. Reload to update."
              : "Gurav Online Services has been cached and is ready to work offline."}
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 4,
        }}
      >
        {needRefresh ? (
          <>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => updateServiceWorker(true)}
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              Reload Now
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setNeedRefresh(false)}
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              Later
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setOfflineReady(false)}
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
