import { useEffect, useState } from 'react'

// Modal de confirmación reutilizable, centrado y con los colores de la marca
// (reusa .sa-btn del panel donde se monta). Reemplaza a window.confirm.
//
// Uso:  if (!(await confirmar('¿Seguro?'))) return
//       await confirmar({ mensaje, titulo, confirmar: 'Sí', cancelar: 'No' })
//
// Si no hay <ConfirmHost/> montado (ej. páginas públicas), cae al confirm nativo.

let _push = null

export function confirmar(opts) {
  const o = typeof opts === 'string' ? { mensaje: opts } : (opts || {})
  return new Promise((resolve) => {
    if (typeof _push !== 'function') { resolve(window.confirm(o.mensaje || '')); return }
    _push({ ...o, resolve })
  })
}

const CSS = `
.cfm-overlay{position:fixed;inset:0;background:rgba(20,18,28,.5);display:flex;align-items:center;justify-content:center;z-index:6000;padding:20px;animation:cfm-fade .15s ease-out}
.cfm-box{background:#fff;border-radius:16px;box-shadow:0 24px 60px -18px rgba(0,0,0,.4);max-width:440px;width:100%;padding:24px 24px 20px;animation:cfm-in .17s cubic-bezier(.2,.7,.3,1)}
.cfm-title{font-size:17px;font-weight:800;margin:0 0 8px;color:#1a181d}
.cfm-msg{font-size:14px;line-height:1.55;color:#4a4754;margin:0 0 20px;white-space:pre-line}
.cfm-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
@keyframes cfm-fade{from{opacity:0}to{opacity:1}}
@keyframes cfm-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
`

export function ConfirmHost() {
  const [cola, setCola] = useState([])
  useEffect(() => { _push = (item) => setCola((c) => [...c, item]); return () => { _push = null } }, [])

  const actual = cola[0]
  useEffect(() => {
    if (!actual) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') resolver(false)
      if (e.key === 'Enter') resolver(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }) // sin deps: se re-vincula cada render con el `actual` vigente

  if (!actual) return null
  function resolver(val) { actual.resolve(val); setCola((c) => c.slice(1)) }

  return (
    <>
      <style>{CSS}</style>
      <div className="cfm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) resolver(false) }}>
        <div className="cfm-box" role="dialog" aria-modal="true">
          {actual.titulo && <div className="cfm-title">{actual.titulo}</div>}
          <div className="cfm-msg">{actual.mensaje}</div>
          <div className="cfm-actions">
            <button type="button" className="sa-btn ghost" onClick={() => resolver(false)}>{actual.cancelar || 'Cancelar'}</button>
            <button type="button" className="sa-btn prim" onClick={() => resolver(true)} autoFocus>{actual.confirmar || 'Aceptar'}</button>
          </div>
        </div>
      </div>
    </>
  )
}
