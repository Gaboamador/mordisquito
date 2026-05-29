import { useEffect, useState } from "react";
import {
  getAllProductPrices,
  updateProductPrices,
} from "../../utils/firebaseCatalog";
import styles from "./estilos/adminProductPrices.module.scss";

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const updateNestedValue = (obj, path, value) => {
  const [currentKey, ...restPath] = path;

  if (restPath.length === 0) {
    return {
      ...obj,
      [currentKey]: value,
    };
  }

  return {
    ...obj,
    [currentKey]: updateNestedValue(
      obj[currentKey] ?? {},
      restPath,
      value
    ),
  };
};

const normalizePrices = (value) => {
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        normalizePrices(nestedValue),
      ])
    );
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? value : numericValue;
};

function PriceFields({ productId, value, path = [], onChange }) {
  return (
  <div className={path.length === 0 ? styles.fieldsRoot : styles.fieldsGroup}>
    {Object.entries(value).map(([key, fieldValue]) => {
      const currentPath = [...path, key];
      const fieldId = `${productId}-${currentPath.join("-")}`;

      if (isPlainObject(fieldValue)) {
        return (
          <fieldset
            key={currentPath.join(".")}
            className={styles.fieldset}
          >
            <legend className={styles.legend}>
              {key}
            </legend>

            <PriceFields
              productId={productId}
              value={fieldValue}
              path={currentPath}
              onChange={onChange}
            />
          </fieldset>
        );
      }

      return (
        <label
          key={currentPath.join(".")}
          htmlFor={fieldId}
          className={styles.field}
        >
          <span className={styles.fieldLabel}>
            {key}
          </span>

          <input
            id={fieldId}
            className={styles.input}
            type="number"
            value={fieldValue ?? ""}
            onChange={(event) =>
              onChange(productId, currentPath, event.target.value)
            }
          />
        </label>
      );
    })}
  </div>
);
}

export default function AdminProductPrices() {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPrices = async () => {
      setLoading(true);
      setError("");

      const data = await getAllProductPrices();

      setProducts(data);

      const initialDrafts = data.reduce((acc, product) => {
        acc[product.id] = product.precios ?? {};
        return acc;
      }, {});

      setDrafts(initialDrafts);
      setLoading(false);
    };

    loadPrices();
  }, []);

  const handlePriceChange = (productId, path, value) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: updateNestedValue(
        prev[productId] ?? {},
        path,
        value
      ),
    }));
  };

  const handleSave = async (productId) => {
    setSavingId(productId);
    setError("");

    const currentPrices = drafts[productId] ?? {};
    const normalizedPrices = normalizePrices(currentPrices);

    const ok = await updateProductPrices(productId, normalizedPrices);

    if (!ok) {
      setError("No se pudieron guardar los precios. Revisá la consola.");
      setSavingId(null);
      return;
    }

    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, precios: normalizedPrices }
          : product
      )
    );

    setDrafts((prev) => ({
      ...prev,
      [productId]: normalizedPrices,
    }));

    setSavingId(null);
  };

  if (loading) {
    return <div>Cargando precios...</div>;
  }

  return (
  <section className={styles.wrapper}>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Editar precios</h1>
        <p className={styles.subtitle}>
          Modificá los precios de cada producto y guardá los cambios en la base de datos.
        </p>
      </div>
    </header>

    {error && (
      <p className={styles.error}>
        {error}
      </p>
    )}

    {products.length === 0 && (
      <p className={styles.empty}>
        No hay productos cargados.
      </p>
    )}

    <div className={styles.productsList}>
      {products.map((product) => {
        const prices = drafts[product.id] ?? {};
        const hasPrices = Object.keys(prices).length > 0;

        return (
          <article
            key={product.id}
            className={styles.productCard}
          >
            <header className={styles.productHeader}>
              <div>
                <h2 className={styles.productTitle}>
                  {product.nombre}
                </h2>

                <p className={styles.productId}>
                  ID: {product.id}
                </p>
              </div>
            </header>

            {!hasPrices ? (
              <p className={styles.noPrices}>
                Este producto no tiene precios cargados.
              </p>
            ) : (
              <div className={styles.fieldsWrapper}>
                <PriceFields
                  productId={product.id}
                  value={prices}
                  onChange={handlePriceChange}
                />
              </div>
            )}

            <footer className={styles.actions}>
              <button
                type="button"
                className={styles.saveButton}
                onClick={() => handleSave(product.id)}
                disabled={savingId === product.id}
              >
                {savingId === product.id
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </footer>
          </article>
        );
      })}
    </div>
  </section>
);
}