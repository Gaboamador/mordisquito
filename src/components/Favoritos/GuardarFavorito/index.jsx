// src/componentes/Favoritos/GuardarFavorito.jsx
import React, { useState, useContext } from "react";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import styles from "./estilos/guardarFavorito.module.scss";
import Context from "../../../context";
import { guardarFavorito } from "../../../utils/firebaseFavoritos";
import calculateTotal from "../../../utils/calculateTotals";
import { nombresLegibles, ordenGlobal, productoLegible } from "../../../utils/nombresYOrden";

/**
 * Props esperadas:
 * - selected: objeto con la selección actual { grupo1: [...], grupo2: [...], ... }
 * - productId: id del producto actual (ej. "wraps")
 * - productData: documento de precios del producto (se usa para previsualizar total)
 * - onSaved: optional callback que se ejecuta después de guardar (p. ej. para cerrar modal o refrescar listados)
 */
const GuardarFavorito = ({ selected = {}, productId = null, productData = {}, onSaved }) => {
  const context = useContext(Context);
  const user = context?.user || null;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Previsualización del total (no se guarda en DB)
  const previewTotal = calculateTotal(productData, selected);

  const resetModal = () => {
    setName("");
    setError("");
    setSaving(false);
    setOpen(false);
  };

  const handleSave = async () => {
    setError("");
    if (!user) {
      setError("Debes iniciar sesión para guardar favoritos.");
      return;
    }
    if (!name || !name.trim()) {
      setError("Por favor, ingresá un nombre para el favorito.");
      return;
    }
    // Build payload according to your requirement: only ingredientes and productId
    const payload = {
      ingredientes: selected,
      productId,
      createdAt: new Date().toISOString(),
    };

    try {
      setSaving(true);
      // guardarFavorito(uid, nombreFavorito, { ingredientes, productId })
      await guardarFavorito(user.uid, name.trim(), payload);

      // Intentar actualizar contexto si existe setFavoritos
      if (context?.favoritos && typeof context.setFavoritos === "function") {
        // añadir de manera inmutable
        const nuevaLista = [
          ...(context.favoritos || []),
          { id: name.trim(), ingredientes: selected, productId, createdAt: payload.createdAt },
        ];
        context.setFavoritos(nuevaLista);
      }

      // callback opcional
      if (typeof onSaved === "function") onSaved({ name: name.trim(), ingredientes: selected, productId });

      resetModal();
    } catch (err) {
      console.error("Error guardando favorito:", err);
      setError("Ocurrió un error al guardar. Intentá nuevamente.");
      setSaving(false);
    }
  };

  return (
    <>
      {/* Botón con ícono */}
      <button
        type="button"
        className={styles.saveButton}
        onClick={() => {
          setOpen(true);
        }}
        title="Guardar como favorito"
      >
        {context.favoritoElegido ? <MdFavorite className={styles.favoriteIcon} /> : <MdFavoriteBorder className={styles.favoriteIcon} />}
      </button>

      {/* Modal simple */}
      {open && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Guardar favorito</h3>
              <button
                className={styles.modalClose}
                onClick={() => {
                  resetModal();
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.inputLabel}>Nombre del favorito</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Ej: Mi ${productoLegible[productId] || productId} especial`}
                maxLength={60}
              />

              <div className={styles.preview}>
                <div className={styles.previewTitle}>Previsualización</div>
                <div className={styles.previewRow}>
                  <div className={styles.previewLabel}>Producto:</div>
                  <div className={styles.previewValue}>{nombresLegibles[productId] || productId}</div>
                </div>

              {/* Nueva sección de ingredientes agrupados */}
              <div className={styles.previewRow}>
                <div className={styles.previewLabel}>Ingredientes:</div>
                <div className={styles.previewValue}>
                  <div className={styles.ingredientsCol}>
                    {Object.entries(selected || {})
                      .filter(([, items]) => Array.isArray(items) && items.length > 0)
                      .sort(([ka], [kb]) => {
                        const ia = ordenGlobal.indexOf(ka);
                        const ib = ordenGlobal.indexOf(kb);
                        if (ia === -1 && ib === -1) return ka.localeCompare(kb);
                        if (ia === -1) return 1;
                        if (ib === -1) return -1;
                        return ia - ib;
                      })
                      .map(([grupo, items]) => {
                        const nombreGrupo = nombresLegibles[grupo] || grupo;
                        return (
                          <div key={grupo} className={styles.groupLine}>
                            <strong>{nombreGrupo}:</strong> {items.join(", ")}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

                <div className={styles.previewRow}>
                  <div className={styles.previewLabel}>Precio:</div>
                  <div className={styles.previewValue}>${previewTotal.toLocaleString()}</div>
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  resetModal();
                }}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                className={styles.confirmButton}
                onClick={handleSave}
                disabled={saving || !name.trim()}
              >
                {saving ? "Guardando..." : "Guardar favorito"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GuardarFavorito;
