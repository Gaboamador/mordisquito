import React, { useContext } from "react";
import Context from "../../context";
import styles from "./estilos/builder.module.scss";
import SummaryBanner from "../SummaryBanner";
import IngredientGroup from "../IngredientGroup";
import { ordenGlobal, nombresLegibles } from "../../utils/nombresYOrden";
import calculateTotal from "../../utils/calculateTotals";

const Builder = () => {
  const context = useContext(Context);
  const { selected, setSelected, productData, products, selectedProduct, setSelectedProduct } = context;

  if (!selectedProduct || !productData) return <p>Cargando productos...</p>;

  const handleToggle = (groupKey, item) => {
    setSelected((prev) => {
      const current = new Set(prev[groupKey] || []);
      current.has(item) ? current.delete(item) : current.add(item);
      return { ...prev, [groupKey]: Array.from(current) };
    });
  };

  const handleReset = () => {
    const grupos = productData?.ingredientes || productData?.grupos || {};
    const emptySelection = Object.keys(grupos).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});
    setSelected(emptySelection);
    sessionStorage.removeItem('builderSelected');
    sessionStorage.removeItem('builderSelectedProduct');
  };

  const gruposRaw = productData?.ingredientes || productData?.grupos || {};
  const gruposKeys = Object.keys(gruposRaw)
    .filter((k) => k in gruposRaw)
    .sort((a, b) => {
      const ia = ordenGlobal.indexOf(a);
      const ib = ordenGlobal.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

  const grupos = {};
  gruposKeys.forEach((key) => { grupos[key] = gruposRaw[key]; });

  const total = calculateTotal(productData, selected);

  return (
    <div className={styles.container}>
      <div className={styles.selectorRow}>
        <label htmlFor="productSelect">Elige producto:</label>
        <select
          id="productSelect"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          {products
            .sort((a, b) => {
              const idxA = ordenGlobal.indexOf(a.id);
              const idxB = ordenGlobal.indexOf(b.id);
              if (idxA === -1 && idxB === -1) return 0;
              if (idxA === -1) return 1;
              if (idxB === -1) return -1;
              return idxA - idxB;
            })
            .map((p) => (
              <option key={p.id} value={p.id}>
                {nombresLegibles[p.id] || p.id}
              </option>
            ))}
        </select>
      </div>

      <SummaryBanner
        selected={selected}
        order={gruposKeys}
        namesMap={nombresLegibles}
        total={total}
        selectedProduct={selectedProduct}
        productData={productData}
      />

      <div className={styles.groups}>
        {/* {Object.entries(grupos).map(([key, groupItems]) => (
          <IngredientGroup
            key={key}
            title={nombresLegibles[key] || key}
            description={""}
            items={Array.isArray(groupItems) ? groupItems : []}
            selected={selected[key] || []}
            onToggle={(item) => handleToggle(key, item)}
            isSalsa={key.toLowerCase() === "salsas"}
          />
        ))} */}
         {Object.entries(grupos).map(([key, groupItems]) => {
    const isSalsaGroup = key.toLowerCase() === "salsas";
    const saucesLocked = isSalsaGroup && (selected[key]?.length || 0) >= 2;

    return (
      <IngredientGroup
        key={key}
        title={nombresLegibles[key] || key}
        description={""}
        items={Array.isArray(groupItems) ? groupItems : []}
        selected={selected[key] || []}
        onToggle={(item) => handleToggle(key, item)}
        saucesLocked={saucesLocked}
      />
    );
  })}
      </div>

      <div className={styles.actions}>
        <button className={styles.resetButton} onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className={styles.totalContainer}>
        Total: ${total.toLocaleString()}
      </div>
    </div>
  );
};

export default Builder;