import React from "react";
import styles from "./estilos/ingredientGroup.module.scss";

const IngredientGroup = ({
  title = "",
  description = "",
  items = [],
  selected = [],
  onToggle,
  isSalsa = false,
  saucesLocked = false,
}) => {
  const selectedSet = new Set(selected);

  return (
    <div className={styles.card}>
      <div className={styles.groupTitle}>
        <h3 className={styles.groupName}>{title}</h3>
        {description && <div className={styles.groupNote}>{description}</div>}
      </div>

      <div className={`${styles.items} ${isSalsa ? styles.saucesItems : ""}`}>
        {items.length === 0 ? (
          <div className={styles.empty}>Sin opciones</div>
        ) : (
          items.map((item) => {
            const id = `${title}__${item}`;
            const checked = selectedSet.has(item);
            const disabled = isSalsa && saucesLocked && !checked;

            return (
              <label key={id} className={styles.item} htmlFor={id}>
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(item)}
                />
                <span className={styles.labelWrap}>
                  <span className={styles.ingredientName}>{item}</span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
};

export default IngredientGroup;
