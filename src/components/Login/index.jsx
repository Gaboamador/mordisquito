import React, { useState, useEffect, useRef } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from "firebase/auth";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { auth } from "../../utils/firebase";
import zxcvbn from 'zxcvbn';
import styles from "./estilos/login.module.scss"
import globalStyles from "../../styles/Botones.scss"

const Login = ({ isLogin, setIsLogin, setShowRecovery }) => {

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState("");

  const [newPassword, setNewPassword] = useState('');
  const [passwordScore, setPasswordScore] = useState(0);

const clearErrors = () => {
  setError("");
};

const firebaseErrorMessages = {
  "auth/email-already-in-use": "Este correo ya está registrado.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/user-not-found": "No se encontró un usuario con ese correo.",
  "auth/wrong-password": "La contraseña es incorrecta.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/missing-password": "Por favor, ingresá una contraseña.",
  "auth/network-request-failed": "Error de conexión. Verificá tu red.",
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

  if (!email || (isLogin ? !password : !newPassword || !repeatPassword || !firstName || !lastName)) {
    setError("Debes completar todos los campos.");
    return;
  }

    if (!isLogin && newPassword !== repeatPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, newPassword);
        const user = userCredential.user;
        // Configurar displayName
          const fullName = `${firstName.trim()} ${lastName.trim()}`;
          await updateProfile(user, { displayName: fullName });
        // Enviar correo de verificación
          await sendEmailVerification(user);
      }
    } catch (err) {
      const code = err.code;
      const customMessage = firebaseErrorMessages[code];
      if (customMessage) {
        setErrorCode(code);
        setError(customMessage);
      } else {
        setErrorCode(code);
        setError("Ocurrió un error inesperado. Intenta nuevamente.");
        console.error("Error no manejado:", code, err.message);
      }
    }
  };


 const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);

    const evaluation = zxcvbn(value);
    setPasswordScore(evaluation.score); // 0 a 4
  };

  const getStrengthLabel = () => {
    switch (passwordScore) {
      case 0:
      case 1:
        return 'Débil';
      case 2:
        return 'Aceptable';
      case 3:
        return 'Buena';
      case 4:
        return 'Fuerte';
      default:
        return '';
    }
  };



  return (
    <div className={styles.authContainer}>
      <div className={styles.authTitle}>
        <div className={styles.authIcon}>
          {isLogin ? <FaSignInAlt /> : <FaUserPlus />}
        </div>        
        {isLogin ? "Iniciar sesión" : "Registrarse"}
      </div>

      <form onSubmit={handleSubmit} className={styles.authForm}>
       <div className={`${styles.authInputGroup} ${focused === 'email' || email ? 'focused' : ''}`}>
  <label className={styles.authLabel}>Correo electrónico</label>
  <input
    type="email"
    className={styles.authInput}
    value={email}
    onChange={(e) => setEmail(e.target.value)}
      onFocus={() => setFocused('email')}
    onBlur={() => setFocused('')}
    required
  />
</div>

{isLogin && 
<div className={`${styles.authInputGroup} ${focused === 'password' || password ? 'focused' : ''}`}>
  <label className={styles.authLabel}>Contraseña</label>
  <input
    type={showPassword ? "text" : "password"}
    className={styles.authInput}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    onFocus={() => setFocused('password')}
    onBlur={() => setFocused('')}
  />
</div>
}

{!isLogin && (
  <>
<div className={`${styles.authInputGroup} ${focused === 'firstName' || firstName ? 'focused' : ''}`}>
      <label className="auth-label">Nombre</label>
      <input
        type="text"
        className={styles.authInput}
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        onFocus={() => setFocused('firstName')}
        onBlur={() => setFocused('')}
        required
      />
    </div>
    <div className={`${styles.authInputGroup} ${focused === 'lastName' || lastName ? 'focused' : ''}`}>
      <label className={styles.authLabel}>Apellido</label>
      <input
        type="text"
        className={styles.authInput}
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        onFocus={() => setFocused('lastName')}
        onBlur={() => setFocused('')}
        required
      />
    </div>

  <div className={`${styles.authInputGroup} ${focused === 'newPassword' || newPassword ? 'focused' : ''}`}>
  <label className={styles.authLabel}>Crear contraseña</label>
  <input
    type={showPassword ? "text" : "password"}
    className={styles.authInput}
    value={newPassword}
    onChange={handlePasswordChange}
    onFocus={() => setFocused('newPassword')}
    onBlur={() => setFocused('')}
    required
  />
</div>

  <div className={`${styles.authInputGroup} ${focused === 'repeat' || repeatPassword ? 'focused' : ''}`}>
    <label className={styles.authLabel}>Repetir contraseña</label>
    <input
      type={showPassword ? "text" : "password"}
      className={styles.authInput}
      value={repeatPassword}
      onChange={(e) => setRepeatPassword(e.target.value)}
      onFocus={() => setFocused('repeat')}
      onBlur={() => setFocused('')}
      required
    />
  </div>
    {newPassword && (
        <div className={styles.passwordStrength}>
          <div className={`${styles.strengthBar} ${styles[`strength-${passwordScore}`]}`} />
          <p className={styles.strengthLabel}>{getStrengthLabel()}</p>
        </div>
      )}
  </>
)}


        <div className={styles.authInputGroup}>
          <div className={styles.checkboxContainer}>
            <label>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword((prev) => !prev)}
              />
              Mostrar contraseña
            </label>
          </div>
        </div>

        <button
        type="submit"
        className={globalStyles.button}
        >
          {isLogin ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      {error && (
        <div className={styles.authError}>
          {errorCode === "auth/invalid-credential" ? (
            <>
              <span>
                Usuario o contraseña incorrecta.{" "}
              </span>
              <span
              className={styles.authLink}
              onClick={() => setShowRecovery(true)}
              >
                ¿Olvidaste tu contraseña?
              </span>
            </>
          ) : (
            error
          )}
        </div>
      )}

      <p className={styles.authSwitchText}>
        {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
        <button className={styles.authSwitchButton}
        onClick={() => {
            clearErrors();
            setIsLogin(!isLogin);
          }}
        >
          {isLogin ? "Registrarse" : "Iniciar sesión"}
        </button>
      </p>
    </div>
  );
};

export default Login;
