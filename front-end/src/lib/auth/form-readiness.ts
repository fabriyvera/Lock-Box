import type { AccountRole } from "./account";

function validEmail(email: string) {
  return (
    email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

export function loginComplete(email: string, password: string) {
  return validEmail(email) && password.length > 0;
}

export function registrationComplete(data: FormData, role: AccountRole) {
  const value = (name: string) => String(data.get(name) || "");
  const name = value("fullName").trim();
  const username = value("username").trim().replace(/^@/, "").toLowerCase();
  const phone = value("phone");
  const password = value("password");
  const store = value("storeName").trim();
  const pointName = value("pointName").trim();
  const pointAddress = value("pointAddress").trim();
  const capacity = Number(value("pointCapacity"));
  const roleComplete =
    role === "comprador" ||
    (role === "vendedor" && store.length >= 2 && store.length <= 80) ||
    (role === "operador_punto" &&
      pointName.length >= 2 &&
      pointName.length <= 80 &&
      pointAddress.length >= 10 &&
      pointAddress.length <= 240 &&
      Number.isSafeInteger(capacity) &&
      capacity >= 1 &&
      capacity <= 500);
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
    roleComplete
  );
}
