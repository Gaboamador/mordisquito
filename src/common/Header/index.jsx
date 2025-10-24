import React, { useState, useContext } from 'react';
import Context from '../../context';
import styles from './estilos/header.module.scss';
import AdministrarFavoritos from '../../components/Favoritos/AdministrarFavoritos';
// import isologo from '../isologo.svg'
import { IoMdSettings } from "react-icons/io";
import { FiMenu, FiLogOut, FiX } from "react-icons/fi";
import { FaUserEdit } from "react-icons/fa";


const Header = () => {

  const context = useContext(Context)
  const [menuOpen, setMenuOpen] = useState(false);
  const [favModalOpen, setFavModalOpen] = useState(false);

 return (
  <header className={styles.appHeader}>
    <div className={styles.headerContent}>
      <div className={styles.isologoContainer}>
        {/* <img src={isologo} alt={""} className={styles.isologo} /> */}
        <span>TITLE</span>
      </div>

      {context.user && (
        <div className={styles.menuButtonContainer}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className={styles.menuButton}
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

          {/* {menuOpen && (
            <ul className={styles.menuDropdown}>
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
          )} */}
                      {menuOpen && (
              <ul className={styles.menuDropdown}>
                <li onClick={() => setFavModalOpen(true)}>Mis Favoritos</li>
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
