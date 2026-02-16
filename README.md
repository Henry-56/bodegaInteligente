# Bodega System - Sistema de Gestión de Bodegas

Sistema completo para gestión de bodegas peruanas. Manejo de compras por OCR de boletas, ventas rápidas, chat tipo WhatsApp, gestión de deudores y reportes.

## Stack

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **Backend**: Next.js Route Handlers (API)
- **Base de datos**: PostgreSQL (Neon) + Prisma ORM
- **Auth**: NextAuth v4 (Credentials + bcrypt)
- **OCR**: tesseract.js (local) / API externo (prod)
- **Validación**: Zod
- **Tests**: Vitest

## Requisitos

- Node.js 18+
- PostgreSQL (Neon o local)

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tu DATABASE_URL de Neon y NEXTAUTH_SECRET

# 3. Crear tablas en la base de datos
npx prisma db push

# 4. Generar Prisma Client
npx prisma generate

# 5. Ejecutar seed (datos demo)
npm run db:seed

# 6. Crear directorio de uploads
mkdir uploads
```

## Variables de Entorno (.env.local)

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
NEXTAUTH_SECRET="tu-secret-seguro"
NEXTAUTH_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
OCR_PROVIDER="local"
```

## Ejecución

```bash
# Desarrollo
npm run dev

# Abrir http://localhost:3000
```

## Credenciales Demo (después del seed)

- **Email**: admin@bodega.com
- **Password**: Admin123!
- **Bodega**: Bodega Don Pepe

## Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar una sola vez
npm run test:run
```

## Rutas

### Páginas
| Ruta | Descripción |
|------|-------------|
| /login | Inicio de sesión |
| /dashboard | Panel principal con resumen |
| /products | Gestión de productos |
| /purchases | Compras por boleta (OCR) |
| /sales | Ventas rápidas + historial |
| /chat | Chat tipo WhatsApp |
| /debtors | Gestión de deudores |
| /reports | Reportes con filtros |

### API
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | /api/products | Listar/Crear productos |
| PUT/DELETE | /api/products/[id] | Editar/Eliminar producto |
| POST | /api/purchases/upload | Subir boleta (OCR) |
| POST | /api/purchases/confirm | Confirmar compra |
| GET/POST | /api/sales | Historial/Crear venta |
| POST | /api/chat/interpret | Interpretar mensaje chat |
| POST | /api/debts/upload | Subir lista deudores (OCR) |
| POST | /api/debts/confirm | Confirmar deudas |
| POST | /api/debts/[id]/payments | Registrar pago |
| GET | /api/reports/dashboard | Datos del dashboard |
| GET | /api/reports/stock-low | Productos con stock bajo |

## Comandos del Chat

| Comando | Ejemplo |
|---------|---------|
| Venta | "vendí 5 galletas a 2.50" |
| Venta (sin precio) | "vendí 3 galletas" |
| Stock | "stock de galletas" |
| Ganancia | "ganancia hoy" / "ganancia semana" |
| Pago deuda | "Juan pagó 10" |

## Costeo Promedio Ponderado

Al confirmar una compra:
```
nuevoPromedio = (stockActual × costoPromActual + cantidadNueva × costoUnitario) / (stockActual + cantidadNueva)
```

Al registrar una venta:
- Se valida stock suficiente
- Se congela `unitCostSnapshot = avgUnitCost` actual
- `ganancia = (precioVenta - costoSnapshot) × cantidad`
- Se decrementa el stock

## Prisma Studio

```bash
npx prisma studio
# Abre interfaz visual de la base de datos en http://localhost:5555
```

## Estructura del Proyecto

```
src/
├── app/              # Next.js App Router (pages + API)
├── components/       # Componentes React
├── lib/              # Utilidades y configuración
├── services/         # Lógica de negocio
├── adapters/ocr/     # OCR adapter pattern
├── chat/             # Chat engine (intent router)
├── schemas/          # Schemas Zod
└── hooks/            # React hooks
prisma/
├── schema.prisma     # Schema de base de datos
└── seed.ts           # Datos demo
tests/
├── unit/             # Tests unitarios
├── integration/      # Tests de integración
└── fixtures/         # Datos de prueba
```
