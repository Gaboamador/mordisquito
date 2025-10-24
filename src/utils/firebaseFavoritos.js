import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
} from "firebase/firestore";

/**
 * Guarda un favorito para un usuario autenticado.
 * @param {string} uid - ID del usuario autenticado
 * @param {string} nombreFavorito - Nombre del wrap favorito (será el ID del documento)
 * @param {object} datosWrap - Objeto con los ingredientes seleccionados, precios, etc.
 */
export const guardarFavorito = async (uid, nombreFavorito, datosWrap) => {
  try {
    const docRef = doc(db, "users", uid, "favoritos", nombreFavorito);
    await setDoc(docRef, {
      ...datosWrap,
      createdAt: new Date().toISOString(),
    });
    console.log(`Favorito "${nombreFavorito}" guardado correctamente.`);
  } catch (error) {
    console.error("Error al guardar favorito:", error);
  }
};

/**
 * Obtiene todos los favoritos del usuario autenticado.
 */
export const obtenerFavoritos = async (uid) => {
  try {
    const colRef = collection(db, "users", uid, "favoritos");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    return [];
  }
};

/**
 * Elimina un favorito por nombre.
 */
export const eliminarFavorito = async (uid, nombreFavorito) => {
  try {
    const docRef = doc(db, "users", uid, "favoritos", nombreFavorito);
    await deleteDoc(docRef);
    console.log(`Favorito "${nombreFavorito}" eliminado correctamente.`);
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
  }
};