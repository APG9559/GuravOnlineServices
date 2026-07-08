export default function PageSliderTransition() {
  return (
    <div
      className="page-slider-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        background: "rgba(250, 169, 48, 1)",
        zIndex: 99999,
        pointerEvents: "all",
        animation: "pageSlide 1.0s cubic-bezier(0.85, 0, 0.15, 1) forwards",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          background: "#ffffff",
          border: "4px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "6px 6px 0px var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: 10,
        }}
      >
        <img
          src="/G.png"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          alt="G Logo"
        />
      </div>
    </div>
  );
}
