import React, { useContext, useEffect, useState } from "react";
import styles from "./estilos/administrarFavoritos.module.scss";
import ModalBase from "../../ModalBase";
import Context from "../../../context";
import { eliminarFavorito } from "../../../utils/firebaseFavoritos";
import calculateTotal from "../../../utils/calculateTotals";

const AdministrarFavoritos = ({ open, onClose }) => {
  const context = useContext(Context);
  const { user, setSelected, setSelectedProduct, productData, favoritos, setFavoritos } = context;
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
          const precio = calculateTotal(productData, fav.ingredientes);
          return (
            <div key={fav.id} className={styles.item}>
              <div className={styles.info}>
                <div className={styles.name}>
                {fav.id}
                <span className={styles.productId}>({fav.productId})</span>
                </div>
                <div className={styles.ingredients}>
                  {Object.entries(fav.ingredientes)
                    .flatMap(([g, items]) =>
                      Array.isArray(items) ? items.map((it) => `${g}: ${it}`) : []
                    )
                    .join(" · ")}
                </div>
                <div className={styles.price}>${precio.toLocaleString()}</div>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.loadBtn}
                  onClick={() => handleLoadFavorito(fav)}
                >
                  Cargar
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(fav.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ModalBase>
  );
};

export default AdministrarFavoritos;