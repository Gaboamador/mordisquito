import React, { useState, useContext, useEffect, useRef } from "react";
import Context from "../../context";
import styles from "./estilos/header.module.scss";
import AdministrarFavoritos from "../../components/Favoritos/AdministrarFavoritos";
import { FiLogOut } from "react-icons/fi";

const Header = () => {
  const context = useContext(Context);

  const [menuOpen, setMenuOpen] = useState(false);
  const [favModalOpen, setFavModalOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className={styles.appHeader}>
      <div className={styles.headerContent}>
        <div className={styles.isologoContainer}>
          <span>MORDISQUITO</span>
        </div>

        {context.user && (
          <div className={styles.menuButtonContainer} ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className={styles.menuButton}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
            >
              <div
                className={`${styles.hamburger} ${
                  menuOpen ? styles.isActive : ""
                }`}
              >
                <span className={styles.hamburgerLine}></span>
                <span className={styles.hamburgerLine}></span>
                <span className={styles.hamburgerLine}></span>
              </div>
            </button>

            {menuOpen && (
              <ul className={styles.menuDropdown}>
                <li
                  onClick={() => {
                    setFavModalOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  Mis Favoritos
                </li>

                <li
                  onClick={() => {
                    context.logout();
                    setMenuOpen(false);
                  }}
                >
                  <FiLogOut className={styles.settingsIcon} />
                  Cerrar sesión
                </li>
              </ul>
            )}
          </div>
        )}

        <AdministrarFavoritos
          open={favModalOpen}
          onClose={() => setFavModalOpen(false)}
        />
      </div>
    </header>
  );
};

export default Header;