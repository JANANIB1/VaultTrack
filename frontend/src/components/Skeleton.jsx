export function Skeleton({ width = "100%", height = 20, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: "var(--r-sm)", ...style }}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <Skeleton width={80} height={12} style={{ marginBottom: 12 }} />
      <Skeleton width={110} height={30} style={{ marginBottom: 8 }} />
      <Skeleton width={60} height={10} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {[44, 100, 70, 80, 120].map((w, i) => (
        <td key={i} style={{ padding: "13px 20px" }}>
          <Skeleton width={w} height={14} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ height = 140 }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <Skeleton height={height} />
    </div>
  );
}