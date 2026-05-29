import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

export function useAdmin(user) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.uid) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      setCheckingAdmin(true);

      try {
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        setIsAdmin(
          adminSnap.exists() && adminSnap.data()?.role === "admin"
        );
      } catch (error) {
        console.error("Error al verificar rol admin:", error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user?.uid]);

  return { isAdmin, checkingAdmin };
}