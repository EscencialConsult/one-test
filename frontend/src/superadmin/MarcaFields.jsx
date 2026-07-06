import { useRef } from 'react'
import Icon from './Icons.jsx'

// Campos de marca (white-label): logo (subir archivo → base64, o pegar URL) + 2 colores.
// `form` debe tener { logo_url, color_acento, color_secundario }; `set(k, v)` los actualiza.
const MAX = 250 * 1024 // 250 KB

export default function MarcaFields({ form, set }) {
  const fileRef = useRef(null)

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/^image\/(png|svg\+xml|jpeg|webp)$/.test(f.type)) { alert('Usá PNG, SVG, JPG o WebP.'); return }
    if (f.size > MAX) { alert('El logo no debe superar 250 KB. Usá una imagen más liviana (SVG es lo ideal).'); return }
    const reader = new FileReader()
    reader.onload = () => set('logo_url', reader.result) // data URI base64
    reader.readAsDataURL(f)
  }

  const logo = form.logo_url
  return (
    <>
      <div className="sa-field">
        <label>Logo institucional</label>
        <div className="sa-logo-row">
          <div className="sa-logo-prev">
            {logo ? <img src={logo} alt="logo" /> : <Icon name="build" style={{ width: 22, color: 'var(--muted)' }} />}
          </div>
          <div className="sa-logo-actions">
            <button type="button" className="sa-btn ghost" onClick={() => fileRef.current?.click()}><Icon name="up" /> Subir archivo</button>
            {logo && <button type="button" className="sa-btn ghost" onClick={() => set('logo_url', '')}><Icon name="x" /> Quitar</button>}
            <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" onChange={onFile} style={{ display: 'none' }} />
          </div>
        </div>
        <input
          style={{ marginTop: 8 }}
          value={logo && !logo.startsWith('data:') ? logo : ''}
          onChange={(e) => set('logo_url', e.target.value)}
          placeholder="…o pegá la URL de una imagen (https://…)"
          disabled={Boolean(logo && logo.startsWith('data:'))}
        />
        <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11.5, marginTop: 6 }}>PNG, SVG o JPG, fondo transparente. Máx. 250 KB.</small>
      </div>

      <div className="sa-frow">
        <ColorInput label="Color principal" value={form.color_acento} onChange={(v) => set('color_acento', v)} />
        <ColorInput label="Color secundario" value={form.color_secundario} onChange={(v) => set('color_secundario', v)} />
        <div className="sa-field"><label>Vista</label><div className="sa-grad-prev" style={{ background: `linear-gradient(135deg, ${form.color_acento}, ${form.color_secundario})` }} /></div>
      </div>
    </>
  )
}

// Muestra de color (picker nativo) + campo de texto para pegar/escribir el HEX.
// Evita depender del campo HEX del popup de Chrome, que a veces se traba.
function ColorInput({ label, value, onChange }) {
  const hex = value || '#000000'
  const valido = /^#[0-9a-fA-F]{6}$/.test(hex)
  function onText(e) {
    let v = e.target.value.trim().replace(/[^#0-9a-fA-F]/g, '')
    if (v && !v.startsWith('#')) v = '#' + v
    onChange(v.slice(0, 7))
  }
  return (
    <div className="sa-field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={valido ? hex : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{ height: 46, width: 52, padding: 4, flex: '0 0 auto', cursor: 'pointer' }}
          title="Elegir color"
        />
        <input
          type="text"
          value={hex}
          onChange={onText}
          placeholder="#00b3b3"
          maxLength={7}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          style={{ flex: 1, minWidth: 0, fontFamily: 'ui-monospace, monospace', textTransform: 'lowercase' }}
        />
      </div>
    </div>
  )
}
