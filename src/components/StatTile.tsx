interface Props {
  label: string
  value: string
  sub?: string
  accent?: string
  hero?: boolean
}

export function StatTile({ label, value, sub, accent, hero }: Props) {
  return (
    <div className={`tile${hero ? ' tile--hero' : ''}`}>
      <span className="tile-label">
        {accent && <i className="dot" style={{ background: accent }} aria-hidden="true" />}
        {label}
      </span>
      <strong className="tile-value">{value}</strong>
      {sub && <span className="tile-sub">{sub}</span>}
    </div>
  )
}
