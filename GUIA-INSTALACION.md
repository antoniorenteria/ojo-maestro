# 👁️ EL OJO MAESTRO — Guía de instalación
### Sistema de operaciones de El Anillo del Cíclope

*"El ojo que todo lo ve": asistencia, inventario en tiempo real, evidencias, cierres y nómina de las sucursales Revolución y Tulipanes.*

---

## 1. ¿Qué incluye?

| Archivo | Qué es |
|---|---|
| `index.html` + `app.js` + `assets.js` | La aplicación (tablets y teléfonos) |
| `apps-script/Code.gs` | El backend gratuito en Google (correo, Drive, sincronización) |
| Esta guía | Pasos de instalación |

La app **ya funciona sin instalar nada**: abre `index.html` en cualquier navegador y trabaja en *modo local* (los datos viven solo en esa tablet). Para tener todo **en línea** (sincronizado entre sucursales y tu teléfono, con correos automáticos y respaldo en Drive) sigue los pasos 2 y 3.

---

## 2. Activar el backend (5 minutos, gratis) ☁️

Se hace **una sola vez**, con la cuenta **elanillodelciclope@gmail.com**:

1. Entra a **script.google.com** → botón **"+ Nuevo proyecto"**.
2. Borra el contenido del editor y **pega todo** el archivo `apps-script/Code.gs`.
3. Nombra el proyecto: `El Ojo Maestro`.
4. Botón azul **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Descripción: `Ojo Maestro`
   - Ejecutar como: **Yo (elanillodelciclope@gmail.com)**
   - Quién tiene acceso: **Cualquier persona** *(necesario para que las tablets puedan enviar datos; nadie puede leer nada sin la app)*
5. **Implementar** → autoriza los permisos (Drive, Gmail, Sheets) → copia la **URL que termina en `/exec`**.
6. (Opcional pero recomendado) En el editor, selecciona la función **`activarRespaldoAutomatico`** y pulsa ▶ Ejecutar → esto activa el **respaldo automático diario en Drive** a las 23:00.

> Google creará solo, en el Drive del negocio, la carpeta **"El Ojo Maestro"** con:
> `Evidencias/` (fotos organizadas por mes) · `Respaldos/` (JSON diarios) · una hoja **"El Ojo Maestro — Registros"** con **pestañas automáticas por mes**: `Turnos 2026-07`, `Cierres 2026-07`, `Propinas 2026-07`, `Eventos 2026-07`… Todo el detalle mensual queda organizado sin mover un dedo.

### 2b. WhatsApp 100 % automático (opcional, gratis) 📲

El sistema ya manda avisos por **correo automático** y genera mensajes de WhatsApp de un toque. Si además quieres que el WhatsApp **llegue solo** al 771 123 2884:

1. En ese teléfono, guarda el contacto **+34 644 71 81 99** (bot de CallMeBot).
2. Mándale por WhatsApp el texto: `I allow callmebot to send me messages`
3. Te responderá con tu **apikey**. Pégala en la línea `CALLMEBOT_APIKEY = ''` del script y vuelve a **Implementar → Administrar implementaciones → ✏️ → Nueva versión**.
4. Desde entonces cada entrada, cierre e inventario llega también por WhatsApp automáticamente.

---

## 3. Conectar la app 🔌

En cada tablet/teléfono:

1. Abre la app → **👁️ Dirección** → PIN **2626** (cámbialo ahí mismo).
2. Pestaña **⚙️ Administrar** → campo **"URL del backend"** → pega la URL `/exec` → **💾 Guardar** → **🔌 Probar conexión**.
3. Verás el chip **🟢 en línea**. Listo: todo se sincroniza cada minuto y tras cada movimiento.

---

## 4. Poner la app en las tablets y teléfonos 📱

Opción A (recomendada): **publicarla en internet** para abrirla desde cualquier lugar.
- Puedo subirla a Vercel (ya tienen cuenta del negocio) — pídemelo y te paso la URL.
- Después, en la tablet: abrir la URL en Chrome → menú ⋮ → **"Agregar a pantalla de inicio"**. Queda como app con el ojo de Mirano.

Opción B: copiar la carpeta `ojo-maestro` a la tablet y abrir `index.html` (funciona, pero es menos cómodo).

---

## 5. Uso diario del equipo operativo 🕐

1. **Entrada** → elegir nombre + PIN personal → queda la hora exacta (llega correo a Dirección) y **se marca sola** la tarea "Responsable de turno".
2. **Checklist del turno** → tareas del día según turno y día de la semana (limpieza de freidoras Lun/Mié/Vie, refrigerador Mar/Jue/Sáb, regar plantas los martes…), cada una con **hora límite** (se marca ⏰ vencida si pasa). Al marcar queda registrado **quién y a qué hora**. Barra de progreso y en el home el panel **"Avance de hoy"** muestra qué falta — quien entra al siguiente turno ve el pendiente de inmediato. También hay campo de **observaciones** directo a Dirección.
3. **Inventario** → cada producto aparece con su **foto real** para identificarlo sin dudas → contar con los botones +/− → el sistema marca solo **COMPRAR / DISPONIBLE / AGOTADO** según el mínimo → **Confirmar** (manda a Dirección la lista de compras).
4. **Evidencias** → fotos de inicio de jornada, limpieza, incidencias, cierre.
5. **💳 Propinas digitales** → cuando llegue una propina por tarjeta/terminal, registrarla con nombre y monto. El equipo ve su acumulado del día; Dirección la suma automáticamente a la nómina para retribuirla. (Las propinas en efectivo se reparten como siempre, sin registro.)
6. **Cierre de turno** → ventas NETAS + dinero en caja + checklist de cierre + foto + novedades → incluye el total de propinas digitales del día → botón para avisar también por **WhatsApp (771 123 2884)**.
7. **Salida** → nombre + PIN → el sistema calcula horas y **pago del turno** (base 6 h + horas extra).

## 6. Panel de Dirección (Toño & Steph) 👁️

Desde el teléfono, con el PIN de Dirección:

- **🔮 Hoy** — quién está en turno ahora, ventas del día, checklists cumplidos, alertas de compra y novedades del equipo.
- **📅 Cierre de mes** — ventas por día y por sucursal, totales del mes, detalle de cierres, exportar CSV.
- **💰 Nómina** — horas y sueldo por colaborador del mes (base 6 h por turno + extras) **+ propinas digitales por retribuir**, con total a pagar y exportación CSV.
- **📦 Inventarios** — faltantes de cada sucursal + mandar lista de compras por WhatsApp.
- **📸 Evidencias** — galería por sucursal.
- **⚙️ Administrar** — agregar/eliminar **sucursales**, **personal y sueldos** (pago por turno y por hora extra de cada quien), **productos y mínimos**, PIN, correo, WhatsApp y respaldos.

---

## 6b. Panel de Supervisión (revisora externa) 🔍

En la portada está el acceso **🔍 Supervisión** (PIN propio, de fábrica **4040** — cámbialo en Administrar). Pensado para la persona que revisa a distancia (como hoy se hace por WhatsApp):

- Elige sucursal y fecha → ve **tareas de ambos turnos** (quién las hizo y a qué hora), **evidencias del día** y el **cierre** (ventas, caja, checklist).
- Puede poner la **doble palomita ✔✔ (Verificada)** a cada tarea — el equipo la ve en verde en su checklist.
- Envía la **revisión del día**: veredicto ✅ Cumplido / ⚠️ Ajustes / ⛔ No cumplido + % de cumplimiento automático + retroalimentación → llega por correo y aparece en el panel del equipo y de Dirección.
- El grupo de WhatsApp puede seguir para conversación; la revisión formal queda registrada y auditable aquí.

## 6c. Modo claro / oscuro 🌓

Botón **🌓** en cualquier pantalla. El modo oscuro es la noche cósmica de Cyclos (ideal en tablets del local); el claro es para exteriores o quien lo prefiera. Cada dispositivo recuerda su elección.

## 7. Seguridad 🔒

- Cambia el **PIN de Dirección (2626)** y los **PIN del personal** (los de fábrica son 1111–5555) el primer día.
- ⚠️ **Importante**: la hoja de cálculo que me compartiste contiene la pestaña **CONTRASEÑAS** visible para cualquiera con el enlace. Recomiendo moverlas a un administrador de contraseñas (o al menos a otro documento privado) y restringir el acceso de esa hoja.
- Los avisos por WhatsApp se envían con un toque (mensaje prellenado). El envío 100 % automático por WhatsApp requiere la API de WhatsApp Business (de pago); el correo sí es automático.

---

## 8. Preguntas rápidas

**¿Cuánto cuesta?** $0. Apps Script, Drive, Gmail y Sheets entran en la cuenta gratuita de Google del negocio.

**¿Y si se va el internet?** La app sigue funcionando en la tablet y sincroniza sola cuando vuelve la conexión.

**¿Dónde queda el respaldo?** Drive → carpeta *El Ojo Maestro* → *Respaldos* (uno diario automático + los que hagas con el botón ☁️). También puedes descargar un respaldo JSON desde Administrar.

**¿Cómo agrego la sucursal 3 en el futuro?** Dirección → Administrar → 🏬 Sucursales → **+ Agregar**. Su inventario inicia en ceros automáticamente.
