export function Skeleton({ width = '100%', height = '1rem', radius = '8px', style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
  )
}

export function CardSkeleton({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="card" style={{ padding: '1.2rem' }}>
      <Skeleton height="0.9rem" width="40%" style={{ marginBottom: '0.6rem' }} />
      <Skeleton height="0.8rem" width="90%" style={{ marginBottom: '0.4rem' }} />
      <Skeleton height="0.8rem" width="70%" />
    </div>
  ))
}

export function StatSkeleton() {
  return (
    <div className="dashboard-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card stat-card" style={{ background: 'var(--surface)' }}>
          <Skeleton width="28px" height="28px" radius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="50%" height="0.6rem" style={{ marginBottom: '0.4rem' }} />
            <Skeleton width="30%" height="1.1rem" />
          </div>
        </div>
      ))}
    </div>
  )
}
