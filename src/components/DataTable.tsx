import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  align?: 'left' | 'right'
  render: (row: T) => ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  empty?: string
}

export function DataTable<T>({ columns, rows, empty = '此时间范围内没有数据' }: Props<T>) {
  if (rows.length === 0) return <p className="empty">{empty}</p>
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'left' ? 'ta-left' : 'ta-right'}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className={c.align === 'left' ? 'ta-left' : 'ta-right'}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
