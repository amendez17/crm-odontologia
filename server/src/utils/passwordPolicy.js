function validarPasswordSegura(password) {
  if (typeof password !== 'string' || password.length < 12) return 'La contraseña debe tener al menos 12 caracteres.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'La contraseña debe incluir mayúscula, minúscula, número y símbolo.';
  }
  return null;
}

module.exports = { validarPasswordSegura };
