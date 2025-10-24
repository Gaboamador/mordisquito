import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Obtiene todos los productos disponibles en la colección 'productos'
 * Ej: [ { id: "empanadas" }, { id: "wraps" } ]
 */
export const getAllProducts = async () => {
  try {
    const colRef = collection(db, "productos");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error al obtener lista de productos:", error);
    return [];
  }
};

/**
 * Obtiene los datos de un producto específico.
 * Ej: getProductData("wraps")
 */
export const getProductData = async (type) => {
  try {
    const docRef = doc(db, "productos", type);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.warn(`No existe el documento "${type}" en 'productos'.`);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener datos de Firestore:", error);
    return null;
  }
};