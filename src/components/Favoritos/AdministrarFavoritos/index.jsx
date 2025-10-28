import React, { useContext, useEffect, useState } from "react";
import styles from "./estilos/administrarFavoritos.module.scss";
import ModalBase from "../../ModalBase";
import Context from "../../../context";
import { eliminarFavorito } from "../../../utils/firebaseFavoritos";
import calculateTotal from "../../../utils/calculateTotals";
import { ordenGlobal, nombresLegibles } from "../../../utils/nombresYOrden";
import { MdDownload, MdDelete } from "react-icons/md";

const AdministrarFavoritos = ({ open, onClose }) => {
  const context = useContext(Context);
  const { user, setSelected, setSelectedProduct, productData, favoritos, setFavoritos, productsDataMap } = context;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !open) return;
    setLoading(true);

    // 🔹 ya usamos la lista global de favoritos
    if (favoritos?.length >= 0) {
      setLoading(false);
    }
  }, [open, user, favoritos]);

  const handleDelete = async (nombre) => {
    if (!user) return;
    if (!window.confirm("¿Seguro que querés eliminar este favorito?")) return;
    try {
      await eliminarFavorito(user.uid, nombre);
      setFavoritos((prev) => prev.filter((f) => f.id !== nombre));
    } catch (err) {
      console.error(err);
      alert("Error al eliminar favorito.");
    }
  };

const handleLoadFavorito = (fav) => {
  if (fav.productId) {
    setSelectedProduct(fav.productId);
    sessionStorage.setItem("builderSelectedProduct", fav.productId);

    setTimeout(() => {
      setSelected(fav.ingredientes);
      sessionStorage.setItem("builderSelected", JSON.stringify(fav.ingredientes));
    }, 150);
  } else {
    setSelected(fav.ingredientes);
    sessionStorage.setItem("builderSelected", JSON.stringify(fav.ingredientes));
  }
  onClose();
};

return (
  <ModalBase open={open} onClose={onClose} title="Mis Favoritos">
    {loading && <div className={styles.loader}>Cargando...</div>}
    {error && <div className={styles.error}>{error}</div>}
    {!loading && favoritos.length === 0 && (
      <div className={styles.empty}>No tenés favoritos guardados aún.</div>
    )}

    <div className={styles.list}>
      {favoritos.map((fav) => {
        const productDataForFav = productsDataMap?.[fav.productId];
        const precio = productDataForFav
          ? calculateTotal(productDataForFav, fav.ingredientes)
          : 0;

        return (
          <div key={fav.id} className={styles.item}>
            {/* ─ Primera línea: producto, nombre, precio, acciones ─ */}
            <div className={styles.topRow}>
              <div className={styles.nameCol}>
                <span className={styles.name}>{fav.id}</span>
                <span className={styles.productId}>
                  ({nombresLegibles[fav.productId] || fav.productId})
                </span>
              </div>

              <div className={styles.priceCol}>
                ${precio.toLocaleString()}
              </div>

              <div className={styles.actionsCol}>
                <button
                  title="Cargar favorito"
                  className={styles.iconBtn}
                  onClick={() => handleLoadFavorito(fav)}
                >
                  <MdDownload />
                </button>
                <button
                  title="Eliminar favorito"
                  className={styles.iconBtn}
                  onClick={() => handleDelete(fav.id)}
                >
                  <MdDelete />
                </button>
              </div>
            </div>

            {/* ─ Segunda línea: ingredientes ─ */}
            <div className={styles.ingredientsCol}>
              {Object.entries(fav.ingredientes || {})
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
        );
      })}
    </div>
  </ModalBase>
);
};

export default AdministrarFavoritos;