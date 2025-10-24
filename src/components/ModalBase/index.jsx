import React from "react";
import styles from "./estilos/modalBase.module.scss";

const ModalBase = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()} // Evita cerrar si se hace clic dentro
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default ModalBase;
