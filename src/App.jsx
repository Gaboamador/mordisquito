import React, {
  Suspense,
  lazy,
  useEffect,
  useState,
  useContext,
} from "react";

import Context from "./context";
import GlobalState from "./globalState";
import { sendEmailVerification } from "firebase/auth";
import { useAdmin } from "./hooks/useAdmin";
import Header from "./common/Header";
import Auth from "./components/Auth";

import "./styles/globals.scss";
import styles from "./App.module.scss";

const Builder = lazy(() => import("./components/Builder"));
const AdminProductPrices = lazy(() => import("./components/AdminProductPrices"));

function AppContent() {
  const context = useContext(Context);
  const { isAdmin } = useAdmin(context.user);

  const [verificationSent, setVerificationSent] = useState(false);
  const [editPricesOpen, setEditPricesOpen] = useState(false);

  useEffect(() => {
    const enviarVerificacion = async () => {
      if (!context.user || context.user.emailVerified || verificationSent) return;

      try {
        await sendEmailVerification(context.user);
        setVerificationSent(true);
        console.log("Correo de verificación enviado automáticamente.");
      } catch (error) {
        console.error("Error enviando verificación automática:", error);
      }
    };

    enviarVerificacion();
  }, [context.user, verificationSent]);

  useEffect(() => {
    if (!isAdmin) {
      setEditPricesOpen(false);
    }
  }, [isAdmin]);

  const handleResendVerification = async () => {
    if (!context.user || context.user.emailVerified) return;

    try {
      await sendEmailVerification(context.user);
      alert("Correo de verificación enviado nuevamente.");
    } catch (error) {
      console.error("Error al reenviar el correo:", error);
    }
  };

  if (context.loading) {
    return (
      <div className={styles.App}>
        <Header />

        <div className={styles.body}>
          {/* Podés dejar vacío o poner un skeleton liviano */}
        </div>
      </div>
    );
  }

  if (!context.user) {
    return (
      <div className={styles.App}>
        <Header />

        <div className={styles.body}>
          <Auth />
        </div>
      </div>
    );
  }

  if (!context.user.emailVerified) {
    return (
      <div className={styles.App}>
        <Header />

        <div className={styles.body}>
          <div className={styles["auth-container"]}>
            <div className={styles["auth-title"]}>
              Verificar correo electrónico
            </div>

            <div className={styles["auth-form"]}>
              <div className={styles["verification-error"]}>
                <span>Tu correo electrónico aún no fue verificado.</span>

                <span>
                  Por favor, revisa tu bandeja de entrada y sigue el enlace de
                  verificación que te enviamos para completar este paso.
                </span>

                <span>
                  Si no encuentras el correo, revisa tu carpeta de spam o
                  solicita un nuevo enlace de verificación.
                </span>
              </div>

              <button
                className={styles.button}
                onClick={handleResendVerification}
              >
                Reenviar correo de verificación
              </button>

              <button
                className={styles.button}
                onClick={() => window.location.reload()}
              >
                Ya verifiqué
              </button>

              <button
                className={styles.button}
                onClick={() => {
                  context.logout();
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.App}>
      <Header />

      <div className={styles.body}>
        <Suspense fallback={null}>
          <Builder />
        </Suspense>

        {isAdmin && (
          <section>
            <button
              type="button"
              className={styles.editPricesButton}
              onClick={() => setEditPricesOpen((prev) => !prev)}
            >
              {editPricesOpen ? "Ocultar editor de precios" : "Editar precios"}
            </button>

            {editPricesOpen && (
              <Suspense fallback={null}>
                <AdminProductPrices />
              </Suspense>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <GlobalState>
      <AppContent />
    </GlobalState>
  );
}

export default App;