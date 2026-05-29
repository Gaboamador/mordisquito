import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
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

/**
 * Obtiene solamente los precios de todos los productos.
 * Devuelve:
 * [
 *   {
 *     id: "empanadas",
 *     nombre: "Empanadas",
 *     precios: { unidad: 1200, docena: 12000 }
 *   }
 * ]
 */
export const getAllProductPrices = async () => {
  try {
    const colRef = collection(db, "productos");
    const snapshot = await getDocs(colRef);

    return snapshot.docs.map((d) => {
      const data = d.data();

      return {
        id: d.id,
        nombre: data.nombre ?? data.name ?? d.id,
        precios: data.precios ?? {},
      };
    });
  } catch (error) {
    console.error("Error al obtener precios de productos:", error);
    return [];
  }
};

/**
 * Actualiza el objeto 'precios' de un producto.
 * No pisa el resto del documento.
 */
export const updateProductPrices = async (productId, precios) => {
  try {
    const docRef = doc(db, "productos", productId);

    await updateDoc(docRef, {
      precios,
    });

    return true;
  } catch (error) {
    console.error(`Error al actualizar precios de "${productId}":`, error);
    return false;
  }
};