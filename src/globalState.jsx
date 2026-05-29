import Context from "./context";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./utils/firebase";
import { obtenerFavoritos } from "./utils/firebaseFavoritos";
import { getAllProducts, getProductData } from "./utils/firebaseCatalog";

function buildEmptySelection(data) {
  const grupos = data?.ingredientes || data?.grupos || {};

  return Object.keys(grupos).reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});
}

function safelyParseSessionSelection() {
  try {
    const saved = sessionStorage.getItem("builderSelected");
    return saved ? JSON.parse(saved) : {};
  } catch {
    sessionStorage.removeItem("builderSelected");
    return {};
  }
}

function GlobalState(props) {
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const [user, setUser] = useState(null);

  const [productData, setProductData] = useState(null);
  const [productsDataMap, setProductsDataMap] = useState({});

  const [selected, setSelected] = useState(() => {
    return safelyParseSessionSelection();
  });

  const [products, setProducts] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(() => {
    return sessionStorage.getItem("builderSelectedProduct") || null;
  });

  const [favoritoElegido, setFavoritoElegido] = useState(false);
  const [favoritoActual, setFavoritoActual] = useState(null);
  const [favoritos, setFavoritos] = useState([]);

  // 1) Auth: desbloquea la app apenas Firebase confirma sesión.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2) Productos: carga lista y solo el producto inicial.
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setProductsDataMap({});
      setSelectedProduct(null);
      setProductData(null);
      setSelected({});
      setProductsLoading(false);
      return;
    }

    let cancelled = false;

    const loadInitialProducts = async () => {
      setProductsLoading(true);

      try {
        const list = await getAllProducts();

        if (cancelled) return;

        const safeList = list || [];
        setProducts(safeList);

        let prodId = sessionStorage.getItem("builderSelectedProduct");

        if (!prodId && safeList.length > 0) {
          prodId = safeList[0].id;
        }

        if (!prodId) {
          setSelectedProduct(null);
          setProductData(null);
          setSelected({});
          return;
        }

        setSelectedProduct(prodId);

        const data = await getProductData(prodId);

        if (cancelled) return;

        const safeData = data || {};

        setProductsDataMap((prev) => ({
          ...prev,
          [prodId]: safeData,
        }));

        setProductData(safeData);

        const saved = sessionStorage.getItem("builderSelected");
        const savedProduct = sessionStorage.getItem("builderSelectedProduct");

        if (saved && savedProduct === prodId) {
          setSelected(safelyParseSessionSelection());
        } else {
          setSelected(buildEmptySelection(safeData));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error cargando productos o datos:", err);
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    loadInitialProducts();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // 3) Favoritos: carga en segundo plano, no bloquea la app.
  useEffect(() => {
    if (!user) {
      setFavoritos([]);
      setFavoritesLoading(false);
      return;
    }

    let cancelled = false;

    const loadFavoritos = async () => {
      setFavoritesLoading(true);

      try {
        const favs = await obtenerFavoritos(user.uid);

        if (!cancelled) {
          setFavoritos(favs || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error cargando favoritos globales:", err);
          setFavoritos([]);
        }
      } finally {
        if (!cancelled) {
          setFavoritesLoading(false);
        }
      }
    };

    loadFavoritos();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // 4) Cuando cambia selectedProduct, cargar ese producto si no está cacheado.
  useEffect(() => {
    if (!user || !selectedProduct) return;

    let cancelled = false;

    const loadSelectedProductData = async () => {
      setProductsLoading(true);

      try {
        let data = productsDataMap[selectedProduct];

        if (!data) {
          data = await getProductData(selectedProduct);

          if (cancelled) return;

          data = data || {};

          setProductsDataMap((prev) => ({
            ...prev,
            [selectedProduct]: data,
          }));
        }

        if (cancelled) return;

        setProductData(data);

        const saved = sessionStorage.getItem("builderSelected");
        const savedProduct = sessionStorage.getItem("builderSelectedProduct");

        if (saved && savedProduct === selectedProduct) {
          setSelected(safelyParseSessionSelection());
        } else {
          setSelected(buildEmptySelection(data));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error cargando datos del producto seleccionado:", err);
          setProductData(null);
          setSelected({});
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    loadSelectedProductData();

    return () => {
      cancelled = true;
    };
  }, [user, selectedProduct]);

  // 5) Guardar selección y producto en sessionStorage.
  useEffect(() => {
    if (!selectedProduct) return;

    sessionStorage.setItem("builderSelected", JSON.stringify(selected));
    sessionStorage.setItem("builderSelectedProduct", selectedProduct);
  }, [selected, selectedProduct]);

  // 6) Verificar si la selección coincide con algún favorito.
  useEffect(() => {
    if (!user || !selectedProduct) {
      setFavoritoElegido(false);
      setFavoritoActual(null);
      return;
    }

    const match = favoritos.find((fav) => {
      if (fav.productId !== selectedProduct) return false;

      const favIngredientes = fav.ingredientes || {};
      const selIngredientes = selected || {};

      return Object.keys(favIngredientes).every((key) => {
        const favItems = favIngredientes[key] || [];
        const selItems = selIngredientes[key] || [];

        if (favItems.length !== selItems.length) return false;

        return favItems.every((item) => selItems.includes(item));
      });
    });

    if (match) {
      setFavoritoElegido(true);
      setFavoritoActual(match);
    } else {
      setFavoritoElegido(false);
      setFavoritoActual(null);
    }
  }, [selected, selectedProduct, favoritos, user]);

  const logout = async () => {
    try {
      await signOut(auth);

      setUser(null);
      setFavoritos([]);
      setProducts([]);
      setProductsDataMap({});
      setSelectedProduct(null);
      setProductData(null);
      setSelected({});
      setFavoritoElegido(false);
      setFavoritoActual(null);

      sessionStorage.removeItem("builderSelected");
      sessionStorage.removeItem("builderSelectedProduct");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  return (
    <Context.Provider
      value={{
        user,
        setUser,
        logout,

        loading,
        productsLoading,
        favoritesLoading,

        selected,
        setSelected,

        productData,
        setProductData,

        products,
        setProducts,

        selectedProduct,
        setSelectedProduct,

        favoritoElegido,
        setFavoritoElegido,

        favoritoActual,
        setFavoritoActual,

        favoritos,
        setFavoritos,

        productsDataMap,
        setProductsDataMap,
      }}
    >
      {props.children}
    </Context.Provider>
  );
}

export default GlobalState;