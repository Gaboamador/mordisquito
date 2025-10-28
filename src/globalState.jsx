import Context from './context'
import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './utils/firebase';
import { obtenerFavoritos } from './utils/firebaseFavoritos';
import { getAllProducts, getProductData } from './utils/firebaseCatalog';

function GlobalState(props){

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);

  // Datos del tipo de producto (ej.: wraps) seleccionado (ingredientes y precios)
  const [productData, setProductData] = useState(null);

  // Map de datos de productos { productId: productData }
  const [productsDataMap, setProductsDataMap] = useState({});
  
  // Objeto con la selección de ingredientes actual
  const [selected, setSelected] = useState(() => {
    const saved = sessionStorage.getItem('builderSelected');
    return saved ? JSON.parse(saved) : {};
  });

  // Guarda la lista de completa de datos obtenidos de Firebase (documentos en la colección "productos")
  const [products, setProducts] = useState([]);

  // Producto seleccionado actualmente (ej.: "wraps")
  const [selectedProduct, setSelectedProduct] = useState(() => {
    return sessionStorage.getItem('builderSelectedProduct') || null;
  });

  // Estado para controlar si los ingredientes actuales corresponden a un favorito elegido
  const [favoritoElegido, setFavoritoElegido] = useState(false);

  // Estado para almacenar el favorito actual completo
  const [favoritoActual, setFavoritoActual] = useState(null);

  // Lista global de favoritos
  const [favoritos, setFavoritos] = useState([]);

  // Escuchar autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Cargar favoritos al iniciar sesión
        try {
          const favs = await obtenerFavoritos(user.uid);
          setFavoritos(favs || []);
        } catch (err) {
          console.error("Error cargando favoritos globales:", err);
        }
      // 🔹 Cargar lista de productos y datos del producto seleccionado
        try {
          const list = await getAllProducts();
          setProducts(list || []);

          // Map para almacenar datos de cada producto
          const dataMap = {};
          for (const p of list) {
            const data = await getProductData(p.id);
            dataMap[p.id] = data || {};
          }
          setProductsDataMap(dataMap);

          // Determinar selectedProduct inicial
          let prodId = sessionStorage.getItem('builderSelectedProduct');
          if (!prodId && list.length > 0) prodId = list[0].id;
          setSelectedProduct(prodId);

          // Inicializar productData y selected
          if (prodId) {
            const data = dataMap[prodId] || {};
            setProductData(data);

            const saved = sessionStorage.getItem('builderSelected');
            const savedProduct = sessionStorage.getItem('builderSelectedProduct');

            if (saved && savedProduct === prodId) {
              setSelected(JSON.parse(saved));
            } else {
              const grupos = data.ingredientes || data.grupos || {};
              const emptySelection = Object.keys(grupos).reduce((acc, key) => {
                acc[key] = [];
                return acc;
              }, {});
              setSelected(emptySelection);
            }
          }

        } catch (err) {
          console.error("Error cargando productos o datos:", err);
        }

      } else {
        setUser(null);
        setFavoritos([]);
        setProducts([]);
        setProductsDataMap({});
        setSelectedProduct(null);
        setProductData(null);
        setSelected({});
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

// 🔹 Actualizar productData y selected cuando cambia selectedProduct
  useEffect(() => {
    if (!selectedProduct) return;
    const data = productsDataMap[selectedProduct] || {};
    setProductData(data);

    const saved = sessionStorage.getItem('builderSelected');
    const savedProduct = sessionStorage.getItem('builderSelectedProduct');

    if (saved && savedProduct === selectedProduct) {
      setSelected(JSON.parse(saved));
    } else {
      const grupos = data.ingredientes || data.grupos || {};
      const emptySelection = Object.keys(grupos).reduce((acc, key) => {
        acc[key] = [];
        return acc;
      }, {});
      setSelected(emptySelection);
    }
  }, [selectedProduct, productsDataMap]);

  // 🔹 Guardar selección y producto en sessionStorage
  useEffect(() => {
    if (!selectedProduct) return;
    sessionStorage.setItem('builderSelected', JSON.stringify(selected));
    sessionStorage.setItem('builderSelectedProduct', selectedProduct);
  }, [selected, selectedProduct]);

  // Verificar si la selección coincide con algún favorito
    const verificarFavoritoActual = () => {
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
        setFavoritoActual(match); // guarda el objeto completo del favorito
      } else {
        setFavoritoElegido(false);
        setFavoritoActual(null);
      }
    };

  useEffect(() => {
    verificarFavoritoActual();
  }, [selected, selectedProduct, favoritos, user]);

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth);
      // Opcional: limpiar estado local si querés
      setUser(null);
      sessionStorage.removeItem('builderSelected');
      sessionStorage.removeItem('builderSelectedProduct');
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };
console.log(favoritoElegido, "fav global")

    return(
        <Context.Provider value={{
            user,
            setUser,
            logout,
            loading,
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
            favoritos,
            setFavoritos,
            productsDataMap,
        }}>
            {props.children}
        </Context.Provider>
    )
}

export default GlobalState;