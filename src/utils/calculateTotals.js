// Función pura para calcular total a partir de productData y selected
// productData: objeto que contiene 'precios' (estructura usada en Firestore)
// selected: { grupo1: [...], grupo2: [...], ... }

export function calculateTotal(productData, selected) {
  const precios = productData?.precios || {};
  const sel = selected || {};
  const base = precios.base ?? 0;

  let total = base;

  for (const [grupo, items] of Object.entries(sel)) {
    if (!Array.isArray(items)) continue;
    const reglas = precios[grupo] || {};

    if (
      reglas &&
      typeof reglas.maxGratis !== "undefined" &&
      typeof reglas.precioExtra !== "undefined"
    ) {
      const extraCount = Math.max(0, items.length - reglas.maxGratis);
      total += extraCount * reglas.precioExtra;
    } else if (reglas && typeof reglas.unidadPrecio !== "undefined") {
      total += items.length * reglas.unidadPrecio;
    }
  }

  return total;
}

export default calculateTotal;
