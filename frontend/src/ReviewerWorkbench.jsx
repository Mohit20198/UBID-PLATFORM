const mockPair = {
  confidence: 0.87,
  business_a: { name: "Raj Textiles Pvt Ltd", id: "GST29110012345", pin: "560058", type: "Manufacturer" },
  business_b: { name: "Raj Textile Private Limited", id: "GST29110012345", pin: "560058", type: "Manufacturing" }
}

export default function ReviewerWorkbench() {
  const pct = Math.round(mockPair.confidence * 100)
  const color = pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626"

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>UBID Reviewer Workbench</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Review and resolve potential duplicate business entities</p>

      {/* Confidence banner */}
      <div style={{ background: color + "18", border: `1px solid ${color}40`, borderRadius: 10, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color }}>{pct}%</span>
        <span style={{ fontSize: 14, color }}>confidence match — recommended for human review</span>
      </div>

      {/* Side by side cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[mockPair.business_a, mockPair.business_b].map((biz, i) => (
          <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", background: "#fff" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Business {i === 0 ? "A" : "B"}</div>
            {[["Name", biz.name], ["GST ID", biz.id], ["Pin Code", biz.pin], ["Type", biz.type]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f3f4f6", fontSize: 14 }}>
                <span style={{ color: "#6b7280", minWidth: 70 }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => console.log("confirm")} style={{ flex: 1, padding: "10px 0", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>✓ Confirm Match</button>
        <button onClick={() => console.log("reject")} style={{ flex: 1, padding: "10px 0", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>✗ Reject</button>
        <button onClick={() => console.log("defer")} style={{ flex: 1, padding: "10px 0", background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>⏸ Defer</button>
      </div>
    </div>
  )
}