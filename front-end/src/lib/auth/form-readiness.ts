function validEmail(email: string) {
  return (
    email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

export function loginComplete(email: string, password: string) {
  return validEmail(email) && password.length > 0;
}

export function registrationComplete(
  data: FormData,
  role: "comprador" | "vendedor",
) {
  const value = (name: string) => String(data.get(name) || "");
  const name = value("fullName").trim();
  const username = value("username").trim().replace(/^@/, "").toLowerCase();
  const phone = value("phone");
  const password = value("password");
  const store = value("storeName").trim();
  return (
    name.length >= 2 &&
    name.length <= 80 &&
    /^[a-z0-9._]{3,30}$/.test(username) &&
    !/^\.|\.$|\.\.|__/.test(username) &&
    validEmail(value("email")) &&
    /^[0-9]{8}$/.test(phone) &&
    password.length >= 8 &&
    password.length <= 128 &&
    password === value("confirmPassword") &&
    (role === "comprador" || (store.length >= 2 && store.length <= 80))
  );
}
