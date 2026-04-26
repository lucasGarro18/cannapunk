# CannaPunk — Estado del Proyecto
### Documento de avance · Abril 2026

---

## ¿Qué es CannaPunk?

Una plataforma que combina **marketplace de e-commerce** con **contenido en video estilo TikTok**.

El modelo funciona así:
1. Un vendedor publica un producto con un % de comisión definido (ej: 10%)
2. Un comprador graba una reseña en video de ese producto y la sube a la plataforma
3. Ese video tiene un link único al producto
4. Cada vez que alguien compra a través de ese video, el creador cobra su comisión automáticamente

**En una frase:** "TikTok + Mercado Libre, donde los compradores son también vendedores de contenido."

---

## Roles de usuario

| Rol | Qué puede hacer |
|---|---|
| **Buyer** | Navegar, comprar, ver videos |
| **Creator** | Todo lo anterior + subir videos de reseña + cobrar comisiones |
| **Seller** | Publicar productos, gestionar stock, ver ventas |
| **Delivery** | Ver entregas asignadas, confirmar retiro y entrega |
| **Admin** | Panel completo: gestionar usuarios, roles, comisiones y pedidos |

Un usuario puede tener múltiples roles simultáneamente.

---

## Stack tecnológico

### Frontend
- **React 18** + Vite 5 (build ultra-rápido)
- **Tailwind CSS 3** con design system propio
- **Zustand v5** para estado global persistido (localStorage)
- **React Query v3** para datos del servidor con fallback offline
- **React Router v6** con lazy loading de páginas
- **Framer Motion** para animaciones
- **Socket.io client** para chat y notificaciones en tiempo real

### Backend
- **Node.js + Express** (API REST)
- **Prisma ORM** con **SQLite** (base de datos local, lista para migrar a PostgreSQL en producción)
- **JWT** para autenticación
- **Socket.io** para mensajería en tiempo real
- **MercadoPago SDK** para pagos
- **Multer** para subida de archivos (imágenes y videos)
- **bcryptjs** para hashing de contraseñas
- **Zod** para validación de inputs

---

## Lo que está construido

### Páginas del frontend (27 páginas)

#### Acceso público
| Página | Descripción |
|---|---|
| **HomePage** | Hero, cómo funciona, productos destacados, top creadores |
| **FeedPage** | Video feed estilo TikTok — scroll vertical, pausa con tap, doble tap para like |
| **MarketplacePage** | Tienda con búsqueda, filtros por categoría, ordenamiento, vista grilla/lista |
| **ProductPage** | Detalle de producto — precio, descuento, comisión, stock, vendedor, reseñas en video |
| **ProfilePage** | Perfil público — videos, reviews, compras, favoritos, stats de seguidor |
| **CreatorsPage** | Ranking de creadores con podio top 3, búsqueda, botón de seguir |
| **WishlistPage** | Lista de favoritos, agregar al carrito |
| **SearchPage** | Búsqueda unificada de productos, creadores y videos |

#### Requieren login
| Página | Descripción |
|---|---|
| **LoginPage** | Login con email + contraseña |
| **RegisterPage** | Registro con código de referido, username personalizado |
| **OnboardingPage** | Flujo inicial post-registro para configurar el perfil |
| **CheckoutPage** | 3 pasos: Dirección → Resumen → Pago via MercadoPago |
| **OrdersPage** | Historial de pedidos con tabs y progreso visual |
| **OrderDetailPage** | Detalle con timeline de tracking animado |
| **WalletPage** | Balance, historial de movimientos, panel de retiro |
| **EarningsPage** | Dashboard de ganancias para creadores — stats, top videos, goal mensual |
| **NotificationsPage** | Notificaciones con filtros, navegación y descarte individual |
| **SettingsPage** | Perfil, roles, direcciones guardadas, métodos de cobro, cuenta |
| **UploadPage** | Subida de video con drag & drop, selector de producto |
| **ChatPage** | Mensajería en tiempo real con socket.io |
| **ReferralsPage** | Link de referido, stats, usuarios referidos, sistema de bonos por tier |

#### Dashboards por rol
| Página | Descripción |
|---|---|
| **SellerDashboard** | Mis productos, publicar nuevo producto, ventas |
| **DeliveryDashboard** | Entregas asignadas, confirmar retiro y entrega |
| **AdminPage** | Stats de plataforma, gestión de usuarios y roles, comisiones, pedidos |

---

### Backend — API completa (11 módulos)

| Módulo | Endpoints |
|---|---|
| **auth** | login, register, perfil propio, cambio de contraseña |
| **products** | listado, detalle, búsqueda, destacados, CRUD para sellers, subida de imagen |
| **orders** | crear, listar (buyer / seller / delivery), detalle, avanzar estado |
| **videos** | feed, por producto, por creador, subir, dar like, registrar vista, eliminar |
| **creators** | top creadores, perfil, follow/unfollow |
| **earnings** | resumen de comisiones, top videos, stats mensuales |
| **notifications** | listar, marcar leída/s, mark all read |
| **mp** | crear preferencia de pago, webhook para confirmar pago y generar orden |
| **chat** | conversaciones, mensajes, mark as read |
| **referrals** | resumen de referidos y ganancias asociadas |
| **admin** | stats, gestión de usuarios y roles, pago de comisiones, listado de órdenes |

---

### Motor de comisiones (el corazón del negocio)

El flujo completo funciona así:
1. Comprador llega al producto a través de un video (`?ref=videoId` en la URL)
2. El `videoId` queda guardado en el carrito (`referrerId`)
3. Al hacer checkout, se guarda en la `PendingOrder`
4. MercadoPago confirma el pago via webhook
5. El backend crea la orden, descuenta stock y **crea automáticamente una Commission**
6. El creador recibe una notificación: "Ganaste $X por tu video"
7. Las comisiones se pueden pagar desde el panel de admin

---

### Sistema de pagos

- **MercadoPago Checkout Pro** — se genera una preferencia y el usuario es redirigido al checkout oficial de MP
- Al volver, la URL incluye `?payment=success` y se muestra un banner de confirmación
- El webhook recibe la notificación de pago aprobado y procesa la orden de forma asíncrona (idempotente)

---

### Características técnicas destacadas

- **Modo offline completo** — todos los hooks tienen fallback con datos mock, la app funciona aunque el servidor esté apagado
- **Error states en todas las páginas** — si falla una consulta, hay UI con botón "Reintentar"
- **PWA-ready** — hay un banner de instalación en mobile
- **Rate limiting** en endpoints de auth (15 intentos / 15 min)
- **Lazy loading** de todas las páginas para carga inicial rápida
- **Persistencia de estado** — carrito, wishlist, direcciones y notificaciones sobreviven a recargas

---

## Usuarios de prueba

| Email | Contraseña | Roles disponibles |
|---|---|---|
| admin@cannapunk.com | password123 | Todos (incluyendo admin) |
| sofia@cannapunk.com | password123 | Buyer + Creator |
| mati@cannapunk.com | password123 | Buyer + Creator + Seller + Delivery |

---

## Lo que falta hacer

### Alta prioridad (necesario para salir a producción)

| Tarea | Descripción | Complejidad |
|---|---|---|
| **Access Token de MercadoPago real** | Reemplazar el placeholder `TEST-xxxx` en `server/.env` con el token real del panel de MP | Baja — 5 min |
| **Base de datos de producción** | Migrar de SQLite a PostgreSQL. Cambiar `DATABASE_URL` en `.env` y correr `prisma db push`. El schema ya es compatible | Media — 1 hs |
| **Deploy del backend** | Subir a Railway, Render o un VPS. Variables de entorno en la plataforma | Media — 2 hs |

> **Frontend**: ya deployado en Vercel con SPA routing configurado (`vercel.json`).

### Media prioridad (mejoran la experiencia)

| Tarea | Descripción | Complejidad |
|---|---|---|
| **Email SMTP** | El módulo `mailer.js` está listo. Solo falta agregar las variables `SMTP_*` al `.env` del servidor. Ver `.env.example` | Baja — 10 min config |
| **Video CDN** | Los videos se guardan en disco local (`uploads/`). Para producción se necesita Cloudflare Stream o Mux | Alta — 1 día |
| **Push notifications (FCM)** | Notificaciones en el celular aunque la app esté cerrada | Alta — 1 día |

### Baja prioridad (nice to have)

| Tarea | Descripción | Complejidad |
|---|---|---|
| **Programa de lealtad** | Puntos por compra canjeables por descuentos | Alta — 2 días |
| **Cupones y descuentos** | Códigos de descuento en el checkout | Alta — 1 día |

---

## Resumen de estado

```
Frontend         ████████████████████  99% completo
Backend API      ████████████████████  98% completo
Emails           ████████████████░░░░  80% (módulo listo, falta config SMTP)
Pagos (MP)       ████████████░░░░░░░░  60% completo (falta token real)
Tiempo real      ████████████████████  95% (chat + notif en app — push FCM no)
Deploy           ████░░░░░░░░░░░░░░░░  20% (frontend en Vercel, backend pendiente)
```

**La app está lista para testear el flujo completo en local.**
**Para producción: token MP real + deploy backend + DB PostgreSQL + config SMTP.**

---

*Actualizado 25 de Abril de 2026*
