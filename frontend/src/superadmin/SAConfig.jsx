import Icon from './Icons.jsx'

// Ajustes globales. La UI replica la maqueta aprobada; la persistencia (tabla de
// settings + integraciones reales) es un paso posterior — hoy es de referencia.
export default function SAConfig() {
  return (
    <div className="sa-cfg">
      <div className="sa-err" style={{ color: 'var(--tinta)', background: 'rgba(228,199,106,.16)', borderColor: 'rgba(228,199,106,.4)' }}>
        Vista de referencia — estos ajustes todavía <b>no se guardan</b>. Se conectan cuando definamos el almacenamiento de configuración e integraciones (OpenAI, SMTP).
      </div>

      <div className="sa-card sa-panel">
        <h3><Icon name="coins" /> Integración con OpenAI <span className="sa-soon">Próximamente</span></h3>
        <p className="d">Motor de IA para los informes consolidados (Módulo 05). La IA nunca calcula resultados individuales.</p>
        <div className="sa-field"><label>API Key</label><input type="password" placeholder="sk-…" disabled /></div>
        <div className="sa-frow">
          <div className="sa-field"><label>Modelo</label><select disabled><option>Claude — alta capacidad</option><option>Claude — rápido/económico</option></select></div>
          <div className="sa-field"><label>Límite mensual de tokens</label><input placeholder="200.000" disabled /></div>
        </div>
      </div>

      <div className="sa-card sa-panel">
        <h3><Icon name="mail" /> Correo (SMTP) <span className="sa-soon">Próximamente</span></h3>
        <p className="d">Envío de credenciales de acceso e informes a evaluados y administradores.</p>
        <div className="sa-frow">
          <div className="sa-field"><label>Nombre del remitente</label><input placeholder="Escencial Consultora" disabled /></div>
          <div className="sa-field"><label>Email del remitente</label><input placeholder="no-reply@escencial.com" disabled /></div>
        </div>
        <div className="sa-frow">
          <div className="sa-field"><label>Servidor SMTP</label><input placeholder="smtp.escencial.com" disabled /></div>
          <div className="sa-field"><label>Puerto</label><input placeholder="587" disabled /></div>
        </div>
      </div>

      <div className="sa-card sa-panel">
        <h3><Icon name="lock" /> Seguridad <span className="sa-soon">Próximamente</span></h3>
        <p className="d">Políticas aplicadas a todos los usuarios de la plataforma.</p>
        <div className="sa-frow">
          <div className="sa-field"><label>Longitud mínima de contraseña</label><input placeholder="8" disabled /></div>
          <div className="sa-field"><label>Expiración de sesión</label><select disabled><option>8 horas</option><option>24 horas</option><option>7 días</option></select></div>
        </div>
        <div className="sa-swrow"><div className="t"><b>Forzar cambio de contraseña en el primer ingreso</b><small>El evaluado define su contraseña al entrar por primera vez.</small></div><button className="sa-sw" disabled /></div>
      </div>

      <div className="sa-card sa-panel">
        <h3><Icon name="cog" /> Marca por defecto para nuevas empresas <span className="sa-soon">Próximamente</span></h3>
        <p className="d">Valores iniciales que toma cada empresa nueva hasta que cargue los suyos.</p>
        <div className="sa-swrow"><div className="t"><b>Color de acento</b><small>Se usa en botones, progreso y gráficos del portal.</small></div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['#4d248f', '#e17bd7', '#6be1e3', '#e4c76a'].map((c) => (
              <span key={c} style={{ width: 30, height: 30, borderRadius: 9, background: c, boxShadow: '0 0 0 1px var(--linea)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
