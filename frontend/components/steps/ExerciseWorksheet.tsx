import { useState, useMemo } from 'react'
import { WorksheetFormat, WorksheetPayload } from '../../utils/stepContentFormat'

interface ExerciseWorksheetProps {
  format: WorksheetFormat
  onChange: (data: WorksheetPayload) => void
}

const inputClass =
  'w-full text-xs py-2 px-2 rounded-lg bg-white border border-black/[0.08] focus:border-brand-primary/40 outline-none'

export default function ExerciseWorksheet({ format, onChange }: ExerciseWorksheetProps) {
  const [stressRows, setStressRows] = useState(
    () =>
      Array.from({ length: format.kind === 'stress' ? format.rows : 2 }, () => ({
        before: '',
        after: '',
        tenMin: '',
        touchedProblem: '',
      }))
  )

  const [gridData, setGridData] = useState<Record<string, string>>(() => {
    if (format.kind !== 'grid') return {}
    const init: Record<string, string> = {}
    format.rowLabels.forEach((_, ri) => {
      format.headers.forEach((_, ci) => {
        init[`${ri}-${ci}`] = ''
      })
    })
    return init
  })

  const [fieldData, setFieldData] = useState<Record<string, string>>(() => {
    if (format.kind === 'fields') {
      return Object.fromEntries(format.fields.map((f) => [f.label, '']))
    }
    if (format.kind === 'lines') {
      return Object.fromEntries(format.fields.map((f) => [f.label, '']))
    }
    return {}
  })

  const [repeatData, setRepeatData] = useState<Record<string, string>[]>(() => {
    if (format.kind !== 'repeat') return []
    return Array.from({ length: format.rows }, () =>
      Object.fromEntries(format.fields.map((f) => [f.label, '']))
    )
  })

  const emitStress = (rows: typeof stressRows) => {
    onChange({ kind: 'stress', rows })
  }

  const emitGrid = (data: Record<string, string>) => {
    if (format.kind !== 'grid') return
    onChange({
      kind: 'grid',
      headers: format.headers,
      rows: format.rowLabels.map((label, ri) => ({
        label,
        values: format.headers.map((_, ci) => data[`${ri}-${ci}`] || ''),
      })),
    })
  }

  const emitFields = (data: Record<string, string>, kind: 'fields' | 'lines') => {
    onChange({ kind, values: data })
  }

  const emitRepeat = (rows: Record<string, string>[]) => {
    onChange({ kind: 'repeat', rows: rows.map((values) => ({ values })) })
  }

  const gridColTemplate = useMemo(() => {
    if (format.kind !== 'grid') return ''
    return `2.5rem repeat(${format.headers.length}, 1fr)`
  }, [format])

  if (format.kind === 'stress') {
    const update = (i: number, key: keyof (typeof stressRows)[0], val: string) => {
      setStressRows((prev) => {
        const next = prev.map((row, idx) => (idx === i ? { ...row, [key]: val } : row))
        emitStress(next)
        return next
      })
    }
    return (
      <div className="mt-4 rounded-xl border border-black/[0.06] bg-white/60 overflow-hidden">
        <div className="grid grid-cols-[2.5rem_1fr_1fr_1fr_1.4fr] gap-1 px-2 py-2 bg-black/[0.03] text-[9px] font-bold uppercase tracking-wide text-text-primary/50">
          <span>#</span>
          <span>Before</span>
          <span>After</span>
          <span>+10 min</span>
          <span>Problem?</span>
        </div>
        {stressRows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[2.5rem_1fr_1fr_1fr_1.4fr] gap-1 px-2 py-2 border-t border-black/[0.04] items-center"
          >
            <span className="text-xs font-bold text-brand-primary text-center">{i + 1}</span>
            {(['before', 'after', 'tenMin'] as const).map((key) => (
              <input
                key={key}
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="0–10"
                value={row[key]}
                onChange={(e) => update(i, key, e.target.value)}
                className={`${inputClass} text-center`}
              />
            ))}
            <select
              value={row.touchedProblem}
              onChange={(e) => update(i, 'touchedProblem', e.target.value)}
              className={`${inputClass} text-[10px]`}
            >
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        ))}
      </div>
    )
  }

  if (format.kind === 'grid') {
    return (
      <div className="mt-4 rounded-xl border border-black/[0.06] bg-white/60 overflow-x-auto">
        <div
          className="grid gap-1 px-2 py-2 bg-black/[0.03] text-[9px] font-bold uppercase tracking-wide text-text-primary/50 min-w-[280px]"
          style={{ gridTemplateColumns: gridColTemplate }}
        >
          <span />
          {format.headers.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {format.rowLabels.map((rowLabel, ri) => (
          <div
            key={rowLabel}
            className="grid gap-1 px-2 py-2 border-t border-black/[0.04] items-center min-w-[280px]"
            style={{ gridTemplateColumns: gridColTemplate }}
          >
            <span className="text-[10px] font-semibold text-brand-primary leading-tight">{rowLabel}</span>
            {format.headers.map((_, ci) => (
              <input
                key={`${ri}-${ci}`}
                type="text"
                value={gridData[`${ri}-${ci}`] || ''}
                onChange={(e) => {
                  const next = { ...gridData, [`${ri}-${ci}`]: e.target.value }
                  setGridData(next)
                  emitGrid(next)
                }}
                className={inputClass}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (format.kind === 'fields') {
    return (
      <div className="mt-4 space-y-3">
        {format.fields.map((field) => (
          <div key={field.label}>
            <label className="text-xs font-semibold text-text-primary/80 block mb-1">{field.label}</label>
            <textarea
              value={fieldData[field.label] || ''}
              onChange={(e) => {
                const next = { ...fieldData, [field.label]: e.target.value }
                setFieldData(next)
                emitFields(next, 'fields')
              }}
              placeholder={field.hint}
              rows={2}
              className={`${inputClass} resize-none min-h-[56px]`}
            />
          </div>
        ))}
      </div>
    )
  }

  if (format.kind === 'repeat') {
    return (
      <div className="mt-4 space-y-3">
        {repeatData.map((row, ri) => (
          <div
            key={ri}
            className="rounded-xl border border-black/[0.06] bg-white/60 p-3 space-y-2.5"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-primary">
              Entry {ri + 1}
            </p>
            {format.fields.map((field) => (
              <div key={field.label}>
                <label className="text-xs font-semibold text-text-primary/80 block mb-1">
                  {field.label}
                </label>
                <textarea
                  value={row[field.label] || ''}
                  onChange={(e) => {
                    setRepeatData((prev) => {
                      const next = prev.map((r, idx) =>
                        idx === ri ? { ...r, [field.label]: e.target.value } : r
                      )
                      emitRepeat(next)
                      return next
                    })
                  }}
                  placeholder={field.hint}
                  rows={2}
                  className={`${inputClass} resize-none min-h-[52px] text-sm`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {format.fields.map((field) => (
        <div key={field.label}>
          <label className="text-xs font-semibold text-text-primary/80 block mb-1">{field.label}</label>
          <input
            type="text"
            value={fieldData[field.label] || ''}
            onChange={(e) => {
              const next = { ...fieldData, [field.label]: e.target.value }
              setFieldData(next)
              emitFields(next, 'lines')
            }}
            className={inputClass}
          />
        </div>
      ))}
    </div>
  )
}
