import styles from "./estilos/Spinner.module.scss";

function Spinner({ text = "Cargando..." }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}

export default Spinner;