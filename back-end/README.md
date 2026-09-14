# LockBox Backend

API REST en Node.js + Express + TypeScript.

## Requisitos

- Node.js >= 20
- npm >= 10

## Instalación

```bash
npm install
cp .env.example .env
```

## Desarrollo

```bash
npm run dev
```

Servidor en `http://localhost:4000`.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login con validación Turnstile |

### Ejemplo POST `/api/auth/login`

```json
{
  "email": "test@example.com",
  "password": "12345678",
  "captchaToken": "0.abc123..."
}
```