import React, { useContext } from "react";
import Context from "../../context";
import styles from "./estilos/summaryBanner.module.scss";
import { FaDollarSign } from "react-icons/fa";
import GuardarFavorito from "../Favoritos/GuardarFavorito";

const SummaryBanner = ({ selected = {}, groups = {}, total = 0, order, namesMap, selectedProduct, productData }) => {

  const context = useContext(Context);

  return (
      <div className={styles.banner}>
    <div className={styles.content}>
      <div className={styles.titleRow}>
        <div className={styles.title}>Resumen del producto</div>
        <GuardarFavorito selected={selected} productId={selectedProduct} productData={productData} />
      </div>

      {context.favoritoActual && (
          <div className={styles.loadedFavorite}>
            {/* <span>Favorito cargado:</span>{" "} */}
            <strong>{context.favoritoActual.id}</strong>
          </div>
        )}

      <div className={styles.groupsContainer}>
        {order.map((key) => {
          const items = selected[key] || [];
          if (items.length === 0) return null; // no mostrar grupos vacíos
          return (
            <div key={key} className={styles.group}>
              <div className={styles.groupTitle}>{namesMap[key] || key}</div>
              <div className={styles.groupItems}>
                {items.map((i) => (
                  <span key={i} className={styles.ingredientBadge}>
                    {i}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.total}>
        <FaDollarSign className={styles.icon} />
        {total.toLocaleString()}
      </div>
    </div>
  </div>
  );
};

export default SummaryBanner;
