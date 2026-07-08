// Marca de la empresa para las pantallas de RENDIR un test (los "runners").
// temaEmpresa() devuelve las variables CSS de color; MarcaLogo pinta el logo de la
// empresa (o el de ONE como respaldo). Así el test se ve con la identidad del cliente.

export function temaEmpresa(emp) {
  if (!emp) return undefined
  const c2 = emp.color_secundario || '#6be1e3'
  return { '--violeta': emp.color_acento, '--grad': emp.color_acento, '--acento2': c2, '--rosa': c2 }
}

export function MarcaLogo({ emp }) {
  if (emp?.logo_url) {
    return <img src={emp.logo_url} alt={emp.razon_social || ''} style={{ height: 54, maxWidth: 210, objectFit: 'contain', display: 'block' }} />
  }
  return <span className="logo">O<b>NE</b></span>
}
