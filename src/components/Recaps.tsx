import type { Recap } from '../types'

const LINE = /^(\d{2}:\d{2})\s+`([^`]+)`\s*([\s\S]*)$/

export function Recaps({ items }: { items: Recap[] }) {
  if (items.length === 0) return <p className="empty">此时间范围内没有 recap</p>
  return (
    <ol className="recaps">
      {items.map((r, i) => {
        const m = LINE.exec(r.text)
        const time = m?.[1]
        const file = m?.[2]
        const body = m ? m[3] : r.text
        return (
          <li key={i} className="recap">
            <div className="recap-meta">
              <span className="recap-date">{r.date}</span>
              {time && <span className="recap-time">{time}</span>}
            </div>
            <p className="recap-body">{body}</p>
            {file && <code className="recap-file" title={file}>{file}</code>}
          </li>
        )
      })}
    </ol>
  )
}
