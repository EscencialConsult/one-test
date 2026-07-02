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
        <div className="sa-field"><label>Color principal</label><input type="color" value={form.color_acento} onChange={(e) => set('color_acento', e.target.value)} style={{ height: 46, padding: 4 }} /></div>
        <div className="sa-field"><label>Color secundario</label><input type="color" value={form.color_secundario} onChange={(e) => set('color_secundario', e.target.value)} style={{ height: 46, padding: 4 }} /></div>
        <div className="sa-field"><label>Vista</label><div className="sa-grad-prev" style={{ background: `linear-gradient(135deg, ${form.color_acento}, ${form.color_secundario})` }} /></div>
      </div>
    </>
  )
}
