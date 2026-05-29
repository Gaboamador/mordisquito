import { useEffect, useState } from "react";
import {
  getAllProductPrices,
  updateProductPrices,
} from "../../utils/firebaseCatalog";
import { ordenGlobal, nombresLegibles, labelsLegibles } from "../../utils/nombresYOrden";
import styles from "./estilos/adminProductPrices.module.scss";
import { FiChevronDown } from "react-icons/fi";

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

const getOrderIndex = (key) => {
  const index = ordenGlobal.indexOf(key);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const sortEntriesByGlobalOrder = (entries) => {
  return [...entries].sort(([keyA], [keyB]) => {
    const orderA = getOrderIndex(keyA);
    const orderB = getOrderIndex(keyB);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return keyA.localeCompare(keyB);
  });
};

const sortProductsByGlobalOrder = (products) => {
  return [...products].sort((productA, productB) => {
    const orderA = getOrderIndex(productA.id);
    const orderB = getOrderIndex(productB.id);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return productA.id.localeCompare(productB.id);
  });
};

const getReadableName = (key, path = []) => {
  const isLeafField = path.length > 0;

  if (isLeafField) {
    return labelsLegibles[key] ?? nombresLegibles[key] ?? key;
  }

  return nombresLegibles[key] ?? labelsLegibles[key] ?? key;
};

function PriceFields({ productId, value, path = [], onChange }) {
  return (
  <div className={path.length === 0 ? styles.fieldsRoot : styles.fieldsGroup}>
    {sortEntriesByGlobalOrder(Object.entries(value)).map(([key, fieldValue]) => {
      const currentPath = [...path, key];
      const fieldId = `${productId}-${currentPath.join("-")}`;

      if (isPlainObject(fieldValue)) {
        return (
          <fieldset
            key={currentPath.join(".")}
            className={styles.fieldset}
          >
            <legend className={styles.legend}>
              {getReadableName(key, path)}
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
            {getReadableName(key, currentPath)}
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
  const [openCards, setOpenCards] = useState({});

  useEffect(() => {
    const loadPrices = async () => {
      setLoading(true);
      setError("");

      const data = await getAllProductPrices();
      const orderedData = sortProductsByGlobalOrder(data);
      setProducts(orderedData);

      const initialDrafts = orderedData.reduce((acc, product) => {
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

  const toggleProductCard = (productId) => {
    setOpenCards((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  if (loading) {
    return <div>Cargando precios...</div>;
  }

  return (
  <div className={styles.container}>
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
          const isOpen = !!openCards[product.id];

          return (
            <article
              key={product.id}
              className={styles.productCard}
            >
              <header className={styles.productHeader}>
                <button
                  type="button"
                  className={styles.productToggle}
                  onClick={() => toggleProductCard(product.id)}
                  aria-expanded={isOpen}
                >
                  <div className={styles.productTitleWrapper}>
                    <h2 className={styles.productTitle}>
                      {getReadableName(product.id) ?? product.nombre ?? product.id}
                    </h2>
                  </div>

                  <FiChevronDown
                    className={`${styles.chevron} ${
                      isOpen ? styles.chevronOpen : ""
                    }`}
                  />
                </button>
              </header>

              {isOpen && (
                <>
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
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  </div>
);
}