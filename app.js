/* ═══════════════════════════════════════════════════════════════
   EL OJO MAESTRO · El Anillo del Cíclope
   Sistema de operaciones: asistencia, inventario, evidencias y cierres
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ---------- utilidades ---------- */
const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const mesISO = () => hoyISO().slice(0, 7);
const fmt$ = n => '$' + (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtHora = ts => new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
const fmtFecha = iso => { const [y, m, d] = iso.split('-'); return d + '/' + m + '/' + y; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function toast(msg, ms = 2600) {
  const t = $('toast'); t.innerHTML = msg; t.classList.add('ver');
  clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove('ver'), ms);
}

/* ---------- catálogo semilla (de la hoja CHECKLIST OPERATIVO) ---------- */
const ESCALA = '1000=1 · 500=½ · 250=¼ · <250=0';
const SEED_PRODUCTOS = [
  ['Aceite Prime Chef 10 L', ESCALA, 800, 'COC'], ['Servitoallas', ESCALA + ' rollo', 251, 'GEN'],
  ['Agua mineral', 'Botellas', 2, 'BEB'], ['Azúcar', ESCALA + ' bolsa', 251, 'COC'],
  ['Servilletas Cloudy', ESCALA + ' paquete', 251, 'GEN'], ['Sanitas', ESCALA + ' paquete', 251, 'GEN'],
  ['Hielo', ESCALA + ' bolsa', 251, 'BEB'], ['Bolsas de basura', 'Bolsa', 3, 'LIM'],
  ['Brillantina Azul', ESCALA + ' botecito', 251, 'POC'], ['Brillantina Roja', ESCALA + ' botecito', 251, 'POC'],
  ['Refrescos Pepsi', 'Pieza', 9, 'BEB'], ['Boing 250 ml', 'Pieza', 25, 'BEB'], ['Boing 500 ml', 'Pieza', 25, 'BEB'],
  ['Boneless', 'Bolsa', 4, 'COC'], ['Papa Gajo', 'Bolsa', 2, 'COC'], ['Papa Waffle', 'Bolsa', 2, 'COC'],
  ['Carne Dragón', 'Pieza', 5, 'COC'], ['Papa Curly', 'Bolsa', 3, 'COC'], ['Papa Recta 3/8', 'Bolsa', 4, 'COC'],
  ['Dedos De Queso', 'Pieza', 3, 'COC'], ['Pan negro Hot Dog', 'Pieza', 5, 'COC'],
  ['Salchicha 22 cm', 'Pieza', 5, 'COC'], ['Pan negro Mini Hamburguesa', 'Pieza', 5, 'COC'],
  ['Carne Minotauro', 'Pieza', 5, 'COC'], ['Buffalo', 'Bidón', 2, 'COC'], ['BBQ', 'Bidón', 2, 'COC'],
  ['BBQ Hot', ESCALA + ' botella', 2, 'COC'], ['Aderezo Ranch', 'Bidones', 3, 'COC'],
  ['Catsup Bachi', ESCALA + ' bote', 251, 'COC'], ['Cebolla', 'Pieza', 1, 'COC'],
  ['Chocolate Hersheys', ESCALA + ' bote', 251, 'POC'], ['Cocoa', ESCALA + ' bote', 251, 'POC'],
  ['Colorante Verde Crepi', ESCALA + ' bote', 251, 'COC'], ['Colorante Verde Líquido', 'Pieza', 251, 'POC'],
  ['Canela en polvo', ESCALA + ' botecito', 251, 'POC'], ['Crema Avellanas', ESCALA + ' bote', 251, 'POC'],
  ['Crema Batida ReddiWip', 'Pieza', 2, 'POC'], ['Mermelada Fresa', ESCALA + ' frasco', 251, 'POC'],
  ['Mermelada Zarzamora', ESCALA + ' frasco', 251, 'POC'], ['Mega limón', 'Pieza', 1, 'BEB'],
  ['7up', 'Pieza', 1, 'BEB'], ['Empaque 6x6 Negro', 'Paquete', 251, 'EMP'], ['Empaque 7x7 Negro', 'Paquete', 251, 'EMP'],
  ['Vaso plástico', 'Paquete', 251, 'EMP'], ['Tapa Plana', 'Paquete', 251, 'EMP'], ['Tapa domo', 'Paquete', 251, 'EMP'],
  ['Vaso café c/tapa', 'Paquete', 251, 'EMP'], ['Masa Crepiburger', 'Tupper', 251, 'COC'],
  ['Limón', ESCALA + ' kilo', 251, 'COC'], ['Encendedor', 'Pieza', 2, 'GEN'],
  ['Espadas Plástico', ESCALA + ' caja', 251, 'EMP'], ['Impek multiusos', ESCALA + ' garrafón', 251, 'LIM'],
  ['Desengrasante', ESCALA + ' garrafón', 251, 'LIM'], ['Desinfectante multiusos', ESCALA + ' garrafón', 251, 'LIM'],
  ['Cloro', ESCALA + ' garrafón', 251, 'LIM'], ['Limpia vidrios', ESCALA + ' garrafón', 251, 'LIM'],
  ['Lava trastes', ESCALA + ' botella', 251, 'LIM'], ['Gel Antibacterial', ESCALA + ' botella', 251, 'LIM'],
  ['Jabón para manos', ESCALA + ' botella', 251, 'LIM'], ['Gansito', 'Pieza', 4, 'POC'],
  ['Galleta Oreo', ESCALA + ' bolsa', 251, 'POC'], ['Lechera', 'Pieza', 2, 'POC'], ['Gas', ESCALA + ' tanque', 251, 'GEN'],
  /* nuevos (detectados en las fotos de inventario) */
  ['Huevo', 'Pieza', 6, 'COC'], ['Harina Tres Soles', ESCALA + ' bolsa', 251, 'COC'],
  ['Leche Evaporada', 'Pieza', 2, 'POC'], ['Margarina sin sal', 'Pieza', 1, 'COC'],
  ['Leche Lactibu', 'Pieza', 2, 'POC'], ['Guantes Negros', ESCALA + ' caja', 251, 'GEN'],
  ['Vainilla', ESCALA + ' garrafa', 251, 'POC'], ['Queso Nachos', 'Bolsa', 2, 'COC'],
  ['Mayonesa', 'Bolsa', 2, 'COC'], ['Vino Blanco', 'Pieza', 1, 'COC'],
  ['Tocino Ahumado', 'Bolsa', 2, 'COC'], ['Chocoretas', 'Bolsa', 1, 'POC'],
  ['Caramelo Chupón (Anillo)', 'Pieza', 10, 'POC'], ['Té de Limón', 'Caja', 1, 'BEB'],
  ['Rollos Impresión', 'Pieza', 2, 'GEN'], ['Queso Gouda', ESCALA, 251, 'COC'],
  ['Vaso Soufflé c/tapa', 'Paquete', 251, 'EMP'], ['Media Crema', 'Pieza', 2, 'POC'],
  ['Jarabe Tucán Mango', 'Pieza', 1, 'BEB'], ['Lechuga Italiana', 'Pieza', 1, 'COC'],
  ['Sal La Fina', ESCALA + ' bolsa', 251, 'COC'], ['Sal con Ajo', 'Pieza', 1, 'COC'],
  ['Popote estuchado', ESCALA + ' caja', 251, 'EMP'], ['Jalapeño', 'Pieza', 2, 'COC'],
  ['Limón pimienta', ESCALA + ' bote', 251, 'COC'], ['Papel Higiénico', 'Pieza (rollos)', 4, 'LIM'],
];
const CATS = { TODOS: '✨ Todos', COC: '🍳 Cocina', BEB: '🥤 Bebidas', POC: '🧪 Pociones y postres', EMP: '📦 Empaques', LIM: '🧽 Limpieza', GEN: '🔧 Generales' };
const CHECK_CIERRE = ['Limpieza de áreas completa', 'Equipos apagados', 'Basura fuera', 'Caja contada y registrada', 'Puertas y accesos cerrados'];

/* Checklist operativo por turno (hoja CHECKLIST OPERATIVO v2)
   dias: null = diario · [0..6] días aplicables (0=Dom) · auto: se marca solo */
const TAREAS = [
  { id: 't1-resp', turno: 1, n: 'Responsable de turno (registrar entrada)', hora: '12:55', dias: null, auto: 'entrada' },
  { id: 't1-wa', turno: 1, n: 'Responder mensajes pendientes de WhatsApp', hora: '13:15', dias: null },
  { id: 't1-plat', turno: 1, n: 'Encendido de plataformas (DiDi, Uber, Rappi)', hora: '13:15', dias: null },
  { id: 't1-comedor', turno: 1, n: 'Comedor y pasillo trapeado', hora: '13:30', dias: null },
  { id: 't1-bano', turno: 1, n: 'Baño trapeado y abastecido', hora: '14:00', dias: null },
  { id: 't1-salsas', turno: 1, n: 'Rellenar mamilas de salsas', hora: '14:30', dias: null },
  { id: 't1-refri', turno: 1, n: 'Limpieza de refrigerador', hora: '16:00', dias: [2, 4, 6] },
  { id: 't1-freidoras', turno: 1, n: 'Limpieza de freidoras', hora: '16:00', dias: [1, 3, 5] },
  { id: 't1-congelador', turno: 1, n: 'Limpieza de congelador', hora: '14:00', dias: [0] },
  { id: 't1-plantas', turno: 1, n: 'Regar plantas', hora: '17:00', dias: [2] },
  { id: 't2-resp', turno: 2, n: 'Responsable de turno (registrar entrada)', hora: '14:55', dias: null, auto: 'entrada' },
  { id: 't2-cocina', turno: 2, n: 'Cocina barrida y trapeada', hora: '15:30', dias: null },
  { id: 't2-mesas', turno: 2, n: 'Mesas de trabajo limpias y ordenadas', hora: '16:00', dias: null },
  { id: 't2-inv', turno: 2, n: 'Realización de inventario', hora: '19:00', dias: null, auto: 'inventario' },
  { id: 't2-crepera', turno: 2, n: 'Limpieza de crepera', hora: '19:00', dias: [1, 3, 5] },
  { id: 't2-comedor', turno: 2, n: 'Comedor limpio y ordenado', hora: '20:55', dias: null },
  { id: 't2-trastes', turno: 2, n: 'Trastes lavados', hora: '20:55', dias: null },
  { id: 't2-invupd', turno: 2, n: 'Actualización de inventario', hora: '20:55', dias: null },
  { id: 't2-basura', turno: 2, n: 'Sacar basura', hora: '20:55', dias: [1, 3, 5] },
];
function tareasDelDia(turno, fechaISO) {
  const d = new Date((fechaISO || hoyISO()) + 'T12:00:00').getDay();
  return TAREAS.filter(t => t.turno === turno && (!t.dias || t.dias.includes(d)));
}
const tareaKey = (fecha, sid, tid) => ['tk', fecha, sid, tid].join('|');
function regTarea(tid, fecha, sid) { return db.tareas.find(x => x.id === tareaKey(fecha || hoyISO(), sid || sucursalActual, tid)); }
function tareaHecha(t, fecha, sid) {
  fecha = fecha || hoyISO(); sid = sid || sucursalActual;
  if (t.auto === 'entrada') {
    const tt = db.turnos.find(x => x.fecha === fecha && x.sucursalId === sid && x.tipo === (t.turno === 1 ? 'matutino' : 'vespertino'));
    return tt ? { done: true, por: per(tt.personalId)?.nombre || '', ts: tt.entrada, auto: true, ver: !!regTarea(t.id, fecha, sid)?.ver } : null;
  }
  const r = regTarea(t.id, fecha, sid);
  return (r && r.done) ? r : null;
}
function horaLimitePasada(t, fecha) {
  if ((fecha || hoyISO()) !== hoyISO()) return true;
  const [h, m] = t.hora.split(':').map(Number);
  const ahora = new Date();
  return ahora.getHours() * 60 + ahora.getMinutes() > h * 60 + m;
}
function fmtHoraLimite(h) { const [hh, mm] = h.split(':').map(Number); const pm = hh >= 12; return ((hh + 11) % 12 + 1) + ':' + String(mm).padStart(2, '0') + (pm ? ' pm' : ' am'); }

const PROTOCOLOS = [
  ['1. Generales', [
    ['Apertura del restaurante', 'Encender luces y música · Encender equipos · Restaurante listo antes de abrir.'],
    ['Checklist', 'Ingresar nombre y hora de entrada · Completar checklist sin improvisaciones.'],
    ['Cierre del restaurante', 'Limpiar todas las áreas · Apagar equipos · Registrar todo en el sistema.'],
    ['Comunicación interna', 'Reportar incidencias por WhatsApp grupal · Lenguaje respetuoso.'],
    ['Seguridad y emergencia', 'Conocer ubicación de botiquín y extintor · Mantener la calma y proteger a clientes.'],
    ['Fallas eléctricas', 'Confirmar el corte · Actuar rápido y seguro · Avisar a Dirección.'],
    ['Control de accesos', 'Solo vendedores, técnicos o proveedores autorizados.'],
  ]],
  ['2. Atención al cliente', [
    ['Bienvenida', 'Saludo cálido y temático — mantener el performance del Universo Cíclope.'],
    ['Cumpleaños y festividades', 'Felicitar amablemente · Experiencia especial y uniforme.'],
    ['Toma de pedido', 'Usar la tablet punto de venta · Escuchar con atención y amabilidad.'],
    ['Entrega de platillos', 'Confirmar con cocina sabor y mesa · Presentación correcta.'],
    ['Reclamaciones', 'Escuchar sin interrumpir · Disculparse y ofrecer solución.'],
    ['Juegos y videojuegos', 'Mantener orden y limpieza de juegos de mesa y consolas.'],
    ['Música y TV', 'Uso exclusivo de las cuentas de El Anillo del Cíclope.'],
    ['Niveles de afluencia', 'Ejecutar de forma organizada, controlada y proactiva según nivel.'],
    ['Petfriendly', '2 preguntas filtro: ¿mascota tranquila? · Experiencia segura y positiva.'],
    ['Mensajería y llamadas', 'Responder en menos de 2 minutos, alineado a la cultura Cíclope.'],
    ['Despedida', 'Preguntar qué les pareció · Agradecer la visita.'],
  ]],
  ['3. Cocina y producción', [
    ['Preparaciones', 'Seguir receta base · Respetar gramajes y tiempos · Montaje estándar.'],
    ['Conservación de insumos', 'Guardar por tipo (seco, frío, congelado) · Evitar desperdicio.'],
    ['Limpieza y desinfección', 'Lavado de manos y gel · Lavar áreas y utensilios después de usar.'],
  ]],
  ['4. Tecnología', [
    ['Uso de Tablet', 'Registrar pedidos sin errores en el punto de venta.'],
    ['Plataformas Delivery', 'Revisar DiDi, Uber y Rappi activas · Precisión y tiempos.'],
    ['Computadora', 'Control digital y reportes desde el perfil del restaurante.'],
  ]],
  ['5. Mantenimiento de áreas', [
    ['Área de comensales', 'Siempre una persona fuera de cocina · Revisar iluminación y ambientación.'],
    ['Barra de entrega', 'Sin objetos personales · Zona funcional y limpia.'],
    ['Baños', 'Revisión cada hora · Reponer papel, jabón y sanitas.'],
  ]],
  ['6. Cultura interna', [
    ['Reglamento interno', 'Trato respetuoso · Conducta y actitud profesional.'],
    ['Evaluación de desempeño', 'Revisión semanal de cumplimiento · Retroalimentación.'],
    ['Sanciones y actualización', 'Garantizar orden, seguridad y calidad · Manual vigente.'],
  ]],
];

/* ---------- base de datos ---------- */
const DB_KEY = 'ojo_maestro_db';
let db = null;
let sucursalActual = null;   // id de sucursal activa en esta tablet
let esAdmin = false;
let tabDir = 'hoy';

function seedDB() {
  const s1 = 'suc-revolucion', s2 = 'suc-tulipanes';
  const prods = SEED_PRODUCTOS.map(p => ({ id: uid(), nombre: p[0], unidad: p[1], minimo: p[2], cat: p[3] }));
  const stock = {}; [s1, s2].forEach(s => { stock[s] = {}; prods.forEach(p => stock[s][p.id] = { c: 0, t: 0 }); });
  return {
    v: 1, ts: Date.now(),
    config: {
      adminPin: '2626', supervisorPin: '4040', scriptUrl: '', emailTo: 'elanillodelciclope@gmail.com',
      whatsapp: '527711232884', baseHoras: 6, nombreNegocio: 'El Anillo del Cíclope'
    },
    sucursales: [
      { id: s1, nombre: 'Revolución', direccion: 'Emilio Asiain 119, Revolución, Pachuca', activa: true },
      { id: s2, nombre: 'Tulipanes', direccion: 'Av. de los Árboles 147, Los Pinos, Pachuca', activa: true },
    ],
    personal: [
      { id: uid(), nombre: 'Añex', pin: '1111', pagoTurno: 300, pagoHora: 50, activo: true },
      { id: uid(), nombre: 'Ambré', pin: '2222', pagoTurno: 300, pagoHora: 50, activo: true },
      { id: uid(), nombre: 'Alex', pin: '3333', pagoTurno: 300, pagoHora: 50, activo: true },
      { id: uid(), nombre: 'Mori', pin: '4444', pagoTurno: 300, pagoHora: 50, activo: true },
      { id: uid(), nombre: 'Jaz', pin: '5555', pagoTurno: 300, pagoHora: 50, activo: true },
    ],
    productos: prods, stock,
    turnos: [], checklists: [], cierres: [], evidencias: [], eventos: [], propinas: [], tareas: [], revisiones: [],
  };
}
function migrarDB() {
  // agrega estructuras/productos nuevos a instalaciones existentes
  if (!db.propinas) db.propinas = [];
  if (!db.tareas) db.tareas = [];
  if (!db.revisiones) db.revisiones = [];
  if (!db.config.supervisorPin) db.config.supervisorPin = '4040';
  const nombres = new Set(db.productos.map(p => p.nombre));
  SEED_PRODUCTOS.forEach(sp => {
    if (!nombres.has(sp[0])) {
      const np = { id: uid(), nombre: sp[0], unidad: sp[1], minimo: sp[2], cat: sp[3] };
      db.productos.push(np);
      db.sucursales.forEach(s => { if (!db.stock[s.id]) db.stock[s.id] = {}; db.stock[s.id][np.id] = { c: 0, t: 0 }; });
    }
  });
}
function cargarDB() {
  try { const raw = localStorage.getItem(DB_KEY); if (raw) { db = JSON.parse(raw); migrarDB(); return; } } catch (e) { }
  db = seedDB(); guardarDB(false);
}
function guardarDB(sincronizar = true) {
  db.ts = Date.now();
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  catch (e) { podarFotos(true); try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e2) { toast('⚠️ Memoria llena: exporta un respaldo en Dirección'); } }
  if (sincronizar) syncPronto();
}
function podarFotos(agresivo) {
  // conserva las últimas N fotos locales; el resto queda solo como registro (o URL de Drive)
  const lim = agresivo ? 12 : 30;
  const conFoto = db.evidencias.filter(e => e.foto && e.foto.startsWith('data:'));
  conFoto.slice(0, Math.max(0, conFoto.length - lim)).forEach(e => { e.foto = ''; e.fotoPodada = true; });
  db.checklists.concat(db.cierres).forEach(c => {
    if (c.foto && c.foto.startsWith('data:') && Date.now() - (c.tsFoto || 0) > 7 * 864e5) { c.foto = ''; c.fotoPodada = true; }
  });
}

/* ---------- sincronización con Google Apps Script ---------- */
let syncTimer = null, syncEnCurso = false;
const enLinea = () => !!(db && db.config.scriptUrl);
function pintarRed() {
  const on = enLinea();
  [['chip-red', 'chip-red-tx'], ['chip-red-dir', 'chip-red-dir-tx']].forEach(([c, t]) => {
    const chip = $(c); if (!chip) return;
    chip.classList.toggle('on', on); chip.classList.toggle('off', !on);
    $(t).textContent = on ? 'en línea' : 'modo local';
  });
  const pe = $('portada-estado');
  if (pe) pe.innerHTML = on ? '🟢 Conectado a la nube Cíclope — datos sincronizados entre dispositivos'
    : '🟡 Modo local (solo esta tablet). Conecta el backend en Dirección → Administrar para sincronizar, notificar por correo y respaldar en Drive.';
}
function syncPronto() { clearTimeout(syncTimer); syncTimer = setTimeout(sync, 1500); }
async function sync(silencioso = true) {
  if (!enLinea() || syncEnCurso) return;
  syncEnCurso = true;
  try {
    const r = await fetch(db.config.scriptUrl, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'sync', db })
    });
    const j = await r.json();
    if (j && j.ok && j.db) {
      const local = db.config.scriptUrl;           // nunca perder la URL local
      db = j.db; db.config.scriptUrl = local;
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      renderTodo();
      if (!silencioso) toast('🔄 Sincronizado con la nube Cíclope');
    }
  } catch (e) { if (!silencioso) toast('⚠️ Sin conexión — los datos quedan guardados en esta tablet'); }
  syncEnCurso = false;
}
async function llamarBackend(payload) {
  if (!enLinea()) return null;
  try {
    const r = await fetch(db.config.scriptUrl, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return await r.json();
  } catch (e) { return null; }
}
function notificar(asunto, cuerpo) {
  // correo vía backend (si está conectado); siempre queda en la bitácora
  db.eventos.unshift({ id: uid(), ts: Date.now(), asunto, cuerpo });
  db.eventos = db.eventos.slice(0, 400);
  llamarBackend({ action: 'notify', asunto, cuerpo });
}
function linkWhatsApp(texto) {
  return 'https://wa.me/' + db.config.whatsapp + '?text=' + encodeURIComponent(texto);
}

/* ---------- fotos ---------- */
function comprimirFoto(file, cb, maxLado = 1000, calidad = .72) {
  const img = new Image();
  img.onload = () => {
    const esc = Math.min(1, maxLado / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    cb(c.toDataURL('image/jpeg', calidad));
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
}
async function subirFotoDrive(dataUrl, meta) {
  // en línea: sube a Drive y devuelve URL; local: devuelve el dataURL
  if (!enLinea()) return dataUrl;
  const j = await llamarBackend({ action: 'foto', b64: dataUrl.split(',')[1], meta });
  return (j && j.ok && j.url) ? j.url : dataUrl;
}
function prepararDrop(dropId, inputId, destino) {
  $(inputId).onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    comprimirFoto(f, dataUrl => {
      destino.foto = dataUrl;
      $(dropId).innerHTML = '<img src="' + dataUrl + '"><div class="mini muted" style="margin-top:6px">Toca para cambiar</div>';
    });
  };
}

/* ---------- helpers de dominio ---------- */
const suc = id => db.sucursales.find(s => s.id === id);
const per = id => db.personal.find(p => p.id === id);
const prod = id => db.productos.find(p => p.id === id);
const turnosAbiertos = sid => db.turnos.filter(t => !t.salida && (!sid || t.sucursalId === sid));
const stockDe = sid => { if (!db.stock[sid]) db.stock[sid] = {}; return db.stock[sid]; };
function estadoStock(sid, p) {
  const s = stockDe(sid)[p.id]; const c = s ? s.c : 0;
  return c <= 0 ? 'agotado' : (c < p.minimo ? 'comprar' : 'ok');
}
function faltantes(sid) { return db.productos.filter(p => estadoStock(sid, p) !== 'ok'); }
function prodFoto(p) { return p.foto || (window.CICLOPE_FOTOS && CICLOPE_FOTOS[p.nombre]) || ''; }
function miniProd(p, lado = 46) {
  const f = prodFoto(p);
  return f ? '<img src="' + f + '" style="width:' + lado + 'px;height:' + lado + 'px;object-fit:cover;border-radius:10px;background:#fff;flex-shrink:0" loading="lazy">'
    : '<div style="width:' + lado + 'px;height:' + lado + 'px;border-radius:10px;background:var(--fondo-4);display:flex;align-items:center;justify-content:center;flex-shrink:0">📦</div>';
}
function turnoSugerido() { return new Date().getHours() < 14 ? 'matutino' : 'vespertino'; }
function calcularPago(t) {
  const p = per(t.personalId); if (!p || !t.salida) return { horas: 0, pago: 0, extra: 0 };
  const horas = (t.salida - t.entrada) / 36e5;
  const base = db.config.baseHoras || 6;
  let pago, extra = 0;
  if (horas >= base) { extra = (horas - base) * (p.pagoHora || 0); pago = (p.pagoTurno || 0) + extra; }
  else pago = (p.pagoTurno || 0) * horas / base;
  return { horas: Math.round(horas * 100) / 100, pago: Math.round(pago * 100) / 100, extra: Math.round(extra * 100) / 100 };
}
function opcionesPersonal(sel, soloEnTurno) {
  const lista = soloEnTurno
    ? turnosAbiertos(sucursalActual).map(t => per(t.personalId)).filter(Boolean)
    : db.personal.filter(p => p.activo);
  sel.innerHTML = lista.length
    ? lista.map(p => '<option value="' + p.id + '">' + esc(p.nombre) + '</option>').join('')
    : '<option value="">— nadie en turno —</option>';
}

/* ---------- navegación ---------- */
function ir(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
  renderPantalla(id);
}
function salirASucursales() { sucursalActual = null; esAdmin = false; esSupervisor = false; ir('scr-portada'); }
function renderPantalla(id) {
  if (id === 'scr-portada') renderPortada();
  if (id === 'scr-suc') renderSucursal();
  if (id === 'scr-inv') renderInventario();
  if (id === 'scr-chk') renderChecklist();
  if (id === 'scr-rev') renderRevision();
  if (id === 'scr-prop') renderPropinas();
  if (id === 'scr-evid') renderEvidencias();
  if (id === 'scr-proto') renderProtocolos();
  if (id === 'scr-dir') renderDireccion();
}
function renderTodo() {
  const activa = document.querySelector('.screen.active');
  if (activa) renderPantalla(activa.id);
  pintarRed();
}

/* ---------- PIN pad ---------- */
let pinBuffer = '', pinCallback = null;
function abrirPin(titulo, cb) {
  pinBuffer = ''; pinCallback = cb;
  $('pin-titulo').textContent = titulo;
  pintarPinDots();
  const pad = $('pinpad'); pad.innerHTML = '';
  [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].forEach(k => {
    const b = document.createElement('button'); b.textContent = k;
    b.onclick = () => {
      if (k === '⌫') pinBuffer = pinBuffer.slice(0, -1);
      else if (k === '✓') { if (pinBuffer.length === 4) { const cb2 = pinCallback; cerrarPin(); cb2(pinBuffer); } }
      else if (pinBuffer.length < 4) pinBuffer += k;
      pintarPinDots();
      if (pinBuffer.length === 4 && k !== '⌫') setTimeout(() => { if ($('modal-pin').classList.contains('ver')) { const cb2 = pinCallback; cerrarPin(); cb2(pinBuffer); } }, 220);
    };
    pad.appendChild(b);
  });
  $('modal-pin').classList.add('ver');
}
function pintarPinDots() {
  [...$('pin-dots').children].forEach((d, i) => d.classList.toggle('full', i < pinBuffer.length));
}
function cerrarPin() { $('modal-pin').classList.remove('ver'); }
function pedirPinAdmin() {
  abrirPin('PIN de Dirección', pin => {
    if (pin === db.config.adminPin) { esAdmin = true; ir('scr-dir'); }
    else toast('⛔ PIN incorrecto');
  });
}

/* ---------- modal general ---------- */
function abrirModal(html) { $('modal-gen-cuerpo').innerHTML = html; $('modal-gen').classList.add('ver'); }
function cerrarModal() { $('modal-gen').classList.remove('ver'); }

/* ═══════════ PORTADA ═══════════ */
function renderPortada() {
  $('portada-sucursales').innerHTML = db.sucursales.filter(s => s.activa).map(s =>
    '<button class="btn p gigante" style="margin-bottom:12px" onclick="entrarSucursal(\'' + s.id + '\')">' +
    '<span class="ico">🏬</span> Sucursal ' + esc(s.nombre) + '</button>').join('');
  pintarRed();
}
function entrarSucursal(id) { sucursalActual = id; ir('scr-suc'); }

/* ═══════════ HOME SUCURSAL ═══════════ */
function renderSucursal() {
  const s = suc(sucursalActual); if (!s) return salirASucursales();
  $('suc-nombre').textContent = '🏬 ' + s.nombre;
  $('fecha-hoy').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const abiertos = turnosAbiertos(sucursalActual);
  $('suc-en-turno').innerHTML = abiertos.length
    ? '<div class="mini muted" style="margin-bottom:8px">EN TURNO AHORA</div>' + abiertos.map(t => {
      const p = per(t.personalId);
      return '<div class="item-linea"><div class="avatar">' + esc((p?.nombre || '?')[0]) + '</div>' +
        '<div class="grow"><b>' + esc(p?.nombre || '¿?') + '</b><div class="mini muted">' +
        (t.tipo === 'matutino' ? '☀️ Matutino' : '🌙 Vespertino') + ' · entró ' + fmtHora(t.entrada) + '</div></div>' +
        '<span class="badge mor">activo</span></div>';
    }).join('')
    : '<span class="muted">Nadie en turno todavía. ¡Que comience la aventura! 🕐</span>';
  const f = faltantes(sucursalActual).length;
  const chip = $('inv-alerta-chip');
  if (chip) chip.innerHTML = f ? '🛒 ' + f + ' por comprar' : '✅ stock completo';
  renderAvance();
}
function avanceTurno(turno, fecha, sid) {
  const lista = tareasDelDia(turno, fecha);
  const hechas = lista.filter(t => tareaHecha(t, fecha, sid));
  return { total: lista.length, hechas: hechas.length, pendientes: lista.filter(t => !tareaHecha(t, fecha, sid)) };
}
function renderAvance() {
  const hoy = hoyISO();
  const a1 = avanceTurno(1, hoy, sucursalActual), a2 = avanceTurno(2, hoy, sucursalActual);
  const cierreHoy = db.cierres.find(c => c.fecha === hoy && c.sucursalId === sucursalActual);
  const evHoy = db.evidencias.filter(e => e.fecha === hoy && e.sucursalId === sucursalActual).length;
  const rev = db.revisiones.find(r => r.sucursalId === sucursalActual);
  const turnoActual = new Date().getHours() < 15 ? 1 : 2;
  const aA = turnoActual === 1 ? a1 : a2;
  const pendTxt = aA.pendientes.filter(t => !t.auto).slice(0, 3).map(t => t.n.split('(')[0].trim()).join(' · ');
  const fila = (icono, nombre, valor, ok) =>
    '<div class="avance-item"><span>' + icono + '</span><span>' + nombre + '</span><span class="pct" style="' +
    (ok === true ? 'color:var(--ok)' : ok === false ? 'color:var(--alerta)' : '') + '">' + valor + '</span></div>';
  $('suc-avance').innerHTML =
    '<h3 style="margin-bottom:4px">🚀 Avance de hoy — ¿qué falta?</h3>' +
    fila('☀️', 'Tareas Turno 1', a1.hechas + '/' + a1.total, a1.hechas === a1.total) +
    fila('🌙', 'Tareas Turno 2', a2.hechas + '/' + a2.total, a2.hechas === a2.total) +
    fila('📸', 'Evidencias subidas hoy', evHoy || '0', evHoy > 0 ? true : null) +
    fila('🌙', 'Cierre del día', cierreHoy ? '✅ ' + fmt$(cierreHoy.ventas) : 'pendiente', !!cierreHoy || null) +
    (rev ? fila('🔍', 'Última revisión (' + fmtFecha(rev.fecha) + ')',
      rev.veredicto === 'cumplido' ? '✅ ' + rev.pct + '%' : rev.veredicto === 'ajustes' ? '⚠️ ' + rev.pct + '%' : '⛔ ' + rev.pct + '%',
      rev.veredicto === 'cumplido' ? true : rev.veredicto === 'nocumplido' ? false : null) : '') +
    (pendTxt ? '<p class="mini" style="margin:8px 0 0;color:var(--aviso)">⏳ Siguiente en Turno ' + turnoActual + ': ' + esc(pendTxt) + '</p>'
      : '<p class="mini" style="margin:8px 0 0;color:var(--ok)">✨ Turno ' + turnoActual + ' al día. ¡Gran trabajo, Cíclope!</p>');
}

/* ═══════════ ENTRADA ═══════════ */
function irEntrada() { opcionesPersonal($('entrada-persona'), false); $('entrada-turno').value = turnoSugerido(); $('entrada-pin').value = ''; ir('scr-entrada'); }
function registrarEntrada() {
  const pid = $('entrada-persona').value, pin = $('entrada-pin').value, tipo = $('entrada-turno').value;
  const p = per(pid);
  if (!p) return toast('Selecciona a la persona');
  if (pin !== p.pin) return toast('⛔ PIN incorrecto');
  if (turnosAbiertos().some(t => t.personalId === pid)) return toast('⚠️ ' + p.nombre + ' ya tiene un turno abierto');
  const t = { id: uid(), fecha: hoyISO(), sucursalId: sucursalActual, personalId: pid, tipo, entrada: Date.now(), salida: null };
  db.turnos.unshift(t); guardarDB();
  const s = suc(sucursalActual);
  notificar('🕐 Entrada — ' + p.nombre + ' (' + s.nombre + ')',
    p.nombre + ' registró ENTRADA en sucursal ' + s.nombre + '\nTurno: ' + tipo + '\nHora: ' + fmtHora(t.entrada) + ' · ' + fmtFecha(t.fecha));
  toast('✅ ¡Bienvenid@ ' + p.nombre + '! Entrada registrada a las ' + fmtHora(t.entrada));
  ir('scr-suc');
}

/* ═══════════ SALIDA ═══════════ */
function irSalida() { opcionesPersonal($('salida-persona'), true); $('salida-pin').value = ''; $('salida-resumen').innerHTML = ''; ir('scr-salida'); }
function registrarSalida() {
  const pid = $('salida-persona').value, pin = $('salida-pin').value;
  const p = per(pid); if (!p) return toast('Nadie en turno');
  if (pin !== p.pin) return toast('⛔ PIN incorrecto');
  const t = db.turnos.find(t => !t.salida && t.personalId === pid && t.sucursalId === sucursalActual);
  if (!t) return toast('No hay turno abierto de ' + p.nombre + ' aquí');
  t.salida = Date.now();
  const c = calcularPago(t); t.horas = c.horas; t.pago = c.pago;
  guardarDB();
  const s = suc(sucursalActual);
  notificar('🚪 Salida — ' + p.nombre + ' (' + s.nombre + ')',
    p.nombre + ' registró SALIDA en ' + s.nombre + '\nEntrada: ' + fmtHora(t.entrada) + ' · Salida: ' + fmtHora(t.salida) +
    '\nHoras: ' + c.horas + ' h\nPago del turno: ' + fmt$(c.pago));
  $('salida-resumen').innerHTML =
    '<div class="card amarilla centrado"><h3>Resumen del turno de ' + esc(p.nombre) + '</h3>' +
    '<div class="grid c3"><div class="stat"><div class="v">' + c.horas + ' h</div><div class="l">trabajadas</div></div>' +
    '<div class="stat verde"><div class="v">' + fmt$(c.pago) + '</div><div class="l">pago del turno</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(c.extra) + '</div><div class="l">horas extra</div></div></div>' +
    '<p class="mini muted">Base de ' + (db.config.baseHoras || 6) + ' h por turno. ¡Gracias por tu aventura de hoy! 🌌</p></div>';
  toast('👋 ¡Hasta pronto, ' + p.nombre + '!');
}

/* ═══════════ CHECKLIST DEL TURNO ═══════════ */
let chkTurno = 1;
function irChecklist() {
  chkTurno = new Date().getHours() < 15 ? 1 : 2;
  opcionesPersonal($('chk-persona'), true);
  if (!$('chk-persona').value) opcionesPersonal($('chk-persona'), false);
  $('chk-obs').value = '';
  ir('scr-chk');
}
function renderChecklist() {
  document.querySelectorAll('#chk-seg button').forEach(b => b.classList.toggle('on', Number(b.dataset.t) === chkTurno));
  const lista = tareasDelDia(chkTurno);
  let hechas = 0;
  $('chk-items').innerHTML = lista.map(t => {
    const h = tareaHecha(t);
    if (h) hechas++;
    const tarde = !h && horaLimitePasada(t);
    const cls = 'tarea' + (h ? (h.ver ? ' verificada' : ' hecha') : '');
    return '<div class="' + cls + '" onclick="toggleTarea(\'' + t.id + '\')">' +
      '<div class="box">' + (h ? '✔' : '') + '</div>' +
      '<div><div class="tt">' + esc(t.n) + (t.auto ? ' <span class="badge mor">auto</span>' : '') + '</div>' +
      '<div class="meta">' + (h
        ? '✔ ' + esc(h.por || 'Equipo') + ' · ' + fmtHora(h.ts) + (h.ver ? ' · <b style="color:var(--ok)">verificada ✔✔</b>' : '')
        : 'Hora límite: <span class="' + (tarde ? 'tarde' : '') + '">' + fmtHoraLimite(t.hora) + (tarde ? ' ⏰ vencida' : '') + '</span>') +
      '</div></div>' +
      '<span class="vv ' + (h ? 'si' : 'no') + '">' + (h ? (h.ver ? '✔✔' : 'HECHA') : 'PENDIENTE') + '</span></div>';
  }).join('');
  const pct = lista.length ? Math.round(hechas / lista.length * 100) : 0;
  $('chk-barra').style.width = pct + '%';
  $('chk-pct').textContent = pct + '%';
  const chip = $('chk-progreso-chip'); if (chip) chip.textContent = hechas + '/' + lista.length + ' tareas';
}
function toggleTarea(tid) {
  const t = TAREAS.find(x => x.id === tid);
  if (t.auto === 'entrada') return toast('Esta tarea se marca sola al registrar la entrada del turno 🕐');
  const key = tareaKey(hoyISO(), sucursalActual, tid);
  let r = db.tareas.find(x => x.id === key);
  const p = per($('chk-persona').value);
  if (r && r.done) {
    if (r.ver) return toast('Ya fue verificada; solo Supervisión puede modificarla 🔍');
    r.done = false; r.ts = Date.now();
    toast('↩️ Tarea desmarcada');
  } else {
    if (!p) return toast('Selecciona quién marca la tarea');
    if (!r) { r = { id: key, fecha: hoyISO(), sucursalId: sucursalActual, tareaId: tid, turno: t.turno, nombre: t.n }; db.tareas.push(r); }
    r.done = true; r.por = p.nombre; r.personalId = p.id; r.ts = Date.now(); r.ver = false;
    toast('✅ Hecha por ' + p.nombre);
  }
  guardarDB(); renderChecklist();
}
function enviarObservacion() {
  const texto = $('chk-obs').value.trim();
  if (!texto) return toast('Escribe la observación primero 🗒️');
  const p = per($('chk-persona').value);
  const s = suc(sucursalActual);
  db.checklists.unshift({
    id: uid(), fecha: hoyISO(), ts: Date.now(), sucursalId: sucursalActual,
    personalId: p?.id || '', tipo: 'observacion', novedades: texto
  });
  guardarDB();
  notificar('🗒️ Observación — ' + s.nombre, (p?.nombre || 'Equipo') + ' (Turno ' + chkTurno + '):\n' + texto);
  $('chk-obs').value = '';
  toast('📨 Observación enviada a Dirección');
}
/* la tarea de inventario del turno 2 se marca sola al confirmar inventario */
function autoTareaInventario() {
  const key = tareaKey(hoyISO(), sucursalActual, 't2-inv');
  let r = db.tareas.find(x => x.id === key);
  if (!r) { r = { id: key, fecha: hoyISO(), sucursalId: sucursalActual, tareaId: 't2-inv', turno: 2, nombre: 'Realización de inventario' }; db.tareas.push(r); }
  if (!r.done) { r.done = true; r.por = 'Inventario confirmado'; r.ts = Date.now(); r.ver = !!r.ver; }
}

/* ═══════════ INVENTARIO ═══════════ */
let invCat = 'TODOS';
function renderInventario() {
  const tabs = $('inv-tabs');
  tabs.innerHTML = Object.entries(CATS).map(([k, v]) =>
    '<button class="' + (invCat === k ? 'on' : '') + '" onclick="invCat=\'' + k + '\';renderInventario()">' + v + '</button>').join('');
  const q = ($('inv-buscar').value || '').toLowerCase();
  const st = stockDe(sucursalActual);
  const lista = db.productos
    .filter(p => (invCat === 'TODOS' || p.cat === invCat) && p.nombre.toLowerCase().includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  $('inv-lista').innerHTML = lista.map(p => {
    const s = st[p.id] || { c: 0 }; const est = estadoStock(sucursalActual, p);
    const badge = est === 'ok' ? '<span class="badge ok">DISPONIBLE</span>'
      : est === 'agotado' ? '<span class="badge comprar">AGOTADO</span>' : '<span class="badge comprar">COMPRAR</span>';
    const uCorta = (p.unidad || '').replace(ESCALA, '').trim() || 'escala';
    return '<div class="inv-row">' + miniProd(p) + '<div class="nom"><div class="n">' + esc(p.nombre) + '</div>' +
      '<div class="u">' + esc(uCorta) + ' · mín ' + p.minimo + '</div></div>' + badge +
      '<div class="stepper">' +
      '<button onclick="ajustarStock(\'' + p.id + '\',-1)">−</button>' +
      '<input type="number" inputmode="numeric" value="' + (s.c || 0) + '" onchange="fijarStock(\'' + p.id + '\',this.value)">' +
      '<button onclick="ajustarStock(\'' + p.id + '\',1)">+</button></div></div>';
  }).join('') || '<p class="muted centrado">Sin productos que coincidan.</p>';
  const f = faltantes(sucursalActual).length;
  $('inv-alerta-chip').innerHTML = f ? '🛒 ' + f + ' por comprar' : '✅ stock completo';
}
function ajustarStock(pid, delta) {
  const st = stockDe(sucursalActual);
  if (!st[pid]) st[pid] = { c: 0, t: 0 };
  st[pid].c = Math.max(0, (st[pid].c || 0) + delta); st[pid].t = Date.now();
  guardarDB(); renderInventario();
}
function fijarStock(pid, v) {
  const st = stockDe(sucursalActual);
  st[pid] = { c: Math.max(0, Number(v) || 0), t: Date.now() };
  guardarDB(); renderInventario();
}
function confirmarInventario() {
  const s = suc(sucursalActual);
  const falt = faltantes(sucursalActual);
  autoTareaInventario();
  notificar('📦 Inventario realizado — ' + s.nombre,
    'Inventario confirmado en ' + s.nombre + ' (' + fmtFecha(hoyISO()) + ').\n' +
    (falt.length ? '🛒 POR COMPRAR (' + falt.length + '):\n' + falt.map(p => '· ' + p.nombre + ' — quedan ' + (stockDe(sucursalActual)[p.id]?.c || 0) + ' (mín ' + p.minimo + ')').join('\n')
      : '✅ Todo el stock por encima del mínimo.'));
  guardarDB();
  toast(falt.length ? '📨 Inventario enviado · ' + falt.length + ' producto(s) por comprar' : '📨 Inventario enviado · todo en orden ✅');
  ir('scr-suc');
}
function verListaCompras() {
  const falt = faltantes(sucursalActual);
  const s = suc(sucursalActual);
  const st = stockDe(sucursalActual);
  const texto = '🛒 *Lista de compras — ' + s.nombre + '* (' + fmtFecha(hoyISO()) + ')\n' +
    (falt.length ? falt.map(p => '· ' + p.nombre + ': quedan ' + (st[p.id]?.c || 0) + ' (mín ' + p.minimo + ')').join('\n') : 'Nada pendiente ✅');
  abrirModal('<h3>🛒 Lista de compras — ' + esc(s.nombre) + '</h3>' +
    (falt.length ? '<ul class="lista-limpia">' + falt.map(p =>
      '<li class="item-linea"><div class="grow"><b>' + esc(p.nombre) + '</b><div class="mini muted">quedan ' +
      (st[p.id]?.c || 0) + ' · mínimo ' + p.minimo + '</div></div><span class="badge comprar">COMPRAR</span></li>').join('') + '</ul>'
      : '<p class="muted">Nada pendiente. El abasto está bajo control ✅</p>') +
    '<div class="sep"></div><a class="btn p" href="' + linkWhatsApp(texto) + '" target="_blank">📲 Enviar por WhatsApp</a>' +
    '<div style="height:8px"></div><button class="btn s" onclick="cerrarModal()">Cerrar</button>');
}

/* ═══════════ PROPINAS DIGITALES ═══════════ */
function propinasDe(fecha, sid, pid) {
  return db.propinas.filter(x => (!fecha || x.fecha === fecha) && (!sid || x.sucursalId === sid) && (!pid || x.personalId === pid));
}
function irPropinas() {
  opcionesPersonal($('prop-persona'), true);
  if (!$('prop-persona').value) opcionesPersonal($('prop-persona'), false);
  $('prop-monto').value = ''; $('prop-nota').value = '';
  ir('scr-prop');
}
function renderPropinas() {
  const hoy = hoyISO();
  const lista = propinasDe(hoy, sucursalActual);
  const porPersona = {};
  lista.forEach(x => porPersona[x.personalId] = (porPersona[x.personalId] || 0) + x.monto);
  $('prop-resumen').innerHTML = Object.keys(porPersona).length
    ? '<div class="grid c2">' + Object.entries(porPersona).map(([pid, m]) =>
      '<div class="stat"><div class="v">' + fmt$(m) + '</div><div class="l">💳 ' + esc(per(pid)?.nombre || '¿?') + ' hoy</div></div>').join('') + '</div>'
    : '<p class="muted centrado">Aún no hay propinas digitales registradas hoy.</p>';
  $('prop-lista').innerHTML = lista.map(x =>
    '<div class="item-linea"><div class="avatar">💳</div><div class="grow"><b>' + fmt$(x.monto) + '</b> — ' + esc(per(x.personalId)?.nombre || '¿?') +
    '<div class="mini muted">' + fmtHora(x.ts) + (x.nota ? ' · ' + esc(x.nota) : '') + '</div></div></div>').join('');
}
function registrarPropina() {
  const monto = Number($('prop-monto').value);
  if (!monto || monto <= 0) return toast('Captura el monto de la propina 💳');
  const p = per($('prop-persona').value);
  if (!p) return toast('Selecciona a quién le tocó');
  db.propinas.unshift({
    id: uid(), ts: Date.now(), fecha: hoyISO(), sucursalId: sucursalActual,
    personalId: p.id, monto, nota: $('prop-nota').value.trim()
  });
  guardarDB();
  toast('💳 Propina de ' + fmt$(monto) + ' registrada para ' + p.nombre);
  $('prop-monto').value = ''; $('prop-nota').value = '';
  renderPropinas();
}
function borrarPropina(id) {
  const x = db.propinas.find(p => p.id === id); if (!x) return;
  if (!confirm('¿Eliminar la propina de ' + fmt$(x.monto) + ' de ' + (per(x.personalId)?.nombre || '¿?') + '?')) return;
  db.propinas = db.propinas.filter(p => p.id !== id);
  guardarDB(); renderDireccion(); toast('🗑️ Propina eliminada');
}

/* ═══════════ EVIDENCIAS ═══════════ */
let evidFoto = { foto: '' };
function renderEvidencias() {
  opcionesPersonal($('evid-persona'), true);
  if (!$('evid-persona').value) opcionesPersonal($('evid-persona'), false);
  evidFoto = { foto: '' };
  $('evid-drop').innerHTML = '📷 Toca para tomar / subir foto';
  prepararDrop('evid-drop', 'evid-file', evidFoto);
  const lista = db.evidencias.filter(e => e.sucursalId === sucursalActual).slice(0, 24);
  $('evid-galeria').innerHTML = lista.map(e => tarjetaEvidencia(e)).join('') ||
    '<p class="muted">Aún no hay evidencias aquí.</p>';
}
function tarjetaEvidencia(e) {
  const p = per(e.personalId);
  const img = e.foto ? (e.foto.startsWith('data:') || e.foto.startsWith('http')
    ? '<img src="' + e.foto + '" onclick="verFoto(\'' + e.id + '\')">' : '') : '<div style="height:100px;display:flex;align-items:center;justify-content:center" class="muted">📁 en Drive</div>';
  return '<div class="ev">' + img + '<div class="m"><b>' + esc(iconoTipo(e.tipo) + ' ' + e.tipo) + '</b><br>' +
    fmtFecha(e.fecha) + ' ' + fmtHora(e.ts) + (p ? '<br>' + esc(p.nombre) : '') + (e.nota ? '<br>' + esc(e.nota) : '') + '</div></div>';
}
function iconoTipo(t) { return { apertura: '🌅', cierre: '🌙', limpieza: '🧽', incidencia: '⚠️', otra: '📎' }[t] || '📎'; }
function verFoto(id) {
  const e = db.evidencias.find(x => x.id === id); if (!e || !e.foto) return;
  abrirModal('<img src="' + e.foto + '" style="width:100%;border-radius:12px">' +
    '<p class="mini muted">' + esc(e.tipo) + ' · ' + fmtFecha(e.fecha) + ' ' + fmtHora(e.ts) + (e.nota ? ' · ' + esc(e.nota) : '') + '</p>' +
    '<button class="btn s" onclick="cerrarModal()">Cerrar</button>');
}
async function guardarEvidencia() {
  if (!evidFoto.foto) return toast('Primero toma o sube la foto 📷');
  const s = suc(sucursalActual);
  const tipo = $('evid-tipo').value;
  const fotoFinal = await subirFotoDrive(evidFoto.foto, { tipo, sucursal: s.nombre, fecha: hoyISO() });
  db.evidencias.unshift({
    id: uid(), ts: Date.now(), fecha: hoyISO(), sucursalId: sucursalActual,
    personalId: $('evid-persona').value, tipo, nota: $('evid-nota').value.trim(), foto: fotoFinal
  });
  podarFotos(false); guardarDB();
  notificar('📸 Evidencia ' + tipo + ' — ' + s.nombre,
    'Nueva evidencia (' + tipo + ') en ' + s.nombre + ' · ' + fmtFecha(hoyISO()) +
    ($('evid-nota').value ? '\nNota: ' + $('evid-nota').value : '') +
    (fotoFinal && fotoFinal.startsWith('http') ? '\nFoto: ' + fotoFinal : ''));
  toast('⬆️ Evidencia subida');
  $('evid-nota').value = '';
  renderEvidencias();
}

/* ═══════════ CIERRE DE TURNO ═══════════ */
let cierreFoto = { foto: '' };
function irCierre() {
  cierreFoto = { foto: '' };
  opcionesPersonal($('cierre-persona'), true);
  if (!$('cierre-persona').value) opcionesPersonal($('cierre-persona'), false);
  $('cierre-ventas').value = ''; $('cierre-caja').value = ''; $('cierre-novedades').value = '';
  $('cierre-checklist').innerHTML = '<label>Checklist de cierre</label>' + CHECK_CIERRE.map(it =>
    '<div class="chk" onclick="this.classList.toggle(\'hecho\')"><div class="box">✔</div><div class="tx">' + esc(it) + '</div></div>').join('');
  $('cierre-drop').innerHTML = '📷 Toca para tomar / subir foto';
  prepararDrop('cierre-drop', 'cierre-foto', cierreFoto);
  ir('scr-cierre');
}
async function guardarCierre() {
  const ventas = Number($('cierre-ventas').value);
  if (!ventas && ventas !== 0 || $('cierre-ventas').value === '') return toast('Captura las ventas netas del turno 💰');
  const caja = Number($('cierre-caja').value) || 0;
  const p = per($('cierre-persona').value);
  const s = suc(sucursalActual);
  const items = {}; let hechos = 0;
  document.querySelectorAll('#cierre-checklist .chk').forEach(el => {
    const ok = el.classList.contains('hecho'); items[el.querySelector('.tx').textContent] = ok; if (ok) hechos++;
  });
  const fotoFinal = cierreFoto.foto ? await subirFotoDrive(cierreFoto.foto, { tipo: 'cierre', sucursal: s.nombre, fecha: hoyISO() }) : '';
  const reg = {
    id: uid(), fecha: hoyISO(), ts: Date.now(), tsFoto: Date.now(), sucursalId: sucursalActual,
    personalId: p?.id || '', ventas, caja, items, hechos, foto: fotoFinal, novedades: $('cierre-novedades').value.trim()
  };
  db.cierres.unshift(reg);
  if (cierreFoto.foto) db.evidencias.unshift({
    id: uid(), ts: Date.now(), fecha: hoyISO(), sucursalId: sucursalActual, personalId: p?.id || '',
    tipo: 'cierre', nota: 'Cierre de turno · ventas ' + fmt$(ventas), foto: fotoFinal
  });
  guardarDB();
  const propHoy = propinasDe(reg.fecha, sucursalActual);
  const propTotal = propHoy.reduce((a, x) => a + x.monto, 0);
  const propDetalle = Object.entries(propHoy.reduce((m, x) => { m[x.personalId] = (m[x.personalId] || 0) + x.monto; return m; }, {}))
    .map(([pid, m]) => (per(pid)?.nombre || '¿?') + ' ' + fmt$(m)).join(' · ');
  const resumen = '🌙 CIERRE DE TURNO — ' + s.nombre + ' (' + fmtFecha(reg.fecha) + ')\n' +
    'Responsable: ' + (p?.nombre || 'Equipo') + '\nVentas NETAS: ' + fmt$(ventas) + '\nDinero en caja: ' + fmt$(caja) +
    '\n💳 Propinas digitales del día: ' + fmt$(propTotal) + (propDetalle ? ' (' + propDetalle + ')' : '') +
    '\nChecklist: ' + hechos + '/' + CHECK_CIERRE.length +
    (reg.novedades ? '\nNovedades: ' + reg.novedades : '') +
    (fotoFinal && fotoFinal.startsWith('http') ? '\nFoto: ' + fotoFinal : '');
  notificar('🌙 Cierre ' + s.nombre + ' — ventas ' + fmt$(ventas), resumen);
  abrirModal('<h3>🌙 Cierre enviado</h3>' +
    '<div class="grid c3"><div class="stat verde"><div class="v">' + fmt$(ventas) + '</div><div class="l">ventas netas</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(caja) + '</div><div class="l">dinero en caja</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(propTotal) + '</div><div class="l">💳 propinas digitales</div></div></div>' +
    '<p class="mini muted centrado" style="margin-top:10px">Checklist ' + hechos + '/' + CHECK_CIERRE.length + ' · Dirección ya fue notificada' + (enLinea() ? ' por correo 📧' : ' (bitácora local)') + '</p>' +
    '<a class="btn p" href="' + linkWhatsApp(resumen) + '" target="_blank">📲 Avisar por WhatsApp</a>' +
    '<div style="height:8px"></div><button class="btn s" onclick="cerrarModal();ir(\'scr-suc\')">Terminar</button>');
}

/* ═══════════ PROTOCOLOS ═══════════ */
function renderProtocolos() {
  $('proto-lista').innerHTML = PROTOCOLOS.map(([mod, items]) =>
    '<div class="card"><h3>' + esc(mod) + '</h3>' + items.map(([t, d]) =>
      '<div class="item-linea"><div class="grow"><b style="font-size:.9rem">' + esc(t) + '</b>' +
      '<div class="mini muted">' + esc(d) + '</div></div></div>').join('') + '</div>').join('');
}

/* ═══════════ SUPERVISIÓN ═══════════ */
let esSupervisor = false;
function pedirPinSupervision() {
  abrirPin('PIN de Supervisión', pin => {
    if (pin === db.config.supervisorPin || pin === db.config.adminPin) {
      esSupervisor = true;
      $('rev-suc').innerHTML = db.sucursales.filter(s => s.activa).map(s => '<option value="' + s.id + '">' + esc(s.nombre) + '</option>').join('');
      $('rev-fecha').value = hoyISO();
      ir('scr-rev');
    } else toast('⛔ PIN incorrecto');
  });
}
function renderRevision() {
  if (!esSupervisor) return salirASucursales();
  const sid = $('rev-suc').value || db.sucursales[0].id;
  const fecha = $('rev-fecha').value || hoyISO();
  let html = '';
  // tareas por turno con botón de verificación
  [1, 2].forEach(turno => {
    const lista = tareasDelDia(turno, fecha);
    const hechas = lista.filter(t => tareaHecha(t, fecha, sid)).length;
    html += '<div class="card"><div class="encabezado-seccion"><h3 style="margin:0">' + (turno === 1 ? '☀️ Turno 1' : '🌙 Turno 2') +
      '</h3><span class="badge ' + (hechas === lista.length ? 'ok' : 'aviso') + '">' + hechas + '/' + lista.length + '</span></div>' +
      lista.map(t => {
        const h = tareaHecha(t, fecha, sid);
        return '<div class="tarea ' + (h ? (h.ver ? 'verificada' : 'hecha') : '') + '" style="cursor:default">' +
          '<div class="box">' + (h ? '✔' : '') + '</div>' +
          '<div><div class="tt">' + esc(t.n) + '</div><div class="meta">' +
          (h ? '✔ ' + esc(h.por || '') + ' · ' + fmtHora(h.ts) : 'No realizada · límite ' + fmtHoraLimite(t.hora)) + '</div></div>' +
          (h ? '<button class="btn ' + (h.ver ? 'p' : 's') + ' mini" style="margin-left:auto" onclick="verificarTarea(\'' + t.id + '\',\'' + fecha + '\',\'' + sid + '\')">' +
            (h.ver ? '✔✔ Verificada' : 'Verificar ✔✔') + '</button>'
            : '<span class="vv no" style="margin-left:auto">PENDIENTE</span>') + '</div>';
      }).join('') + '</div>';
  });
  // evidencias del día
  const evs = db.evidencias.filter(e => e.fecha === fecha && e.sucursalId === sid);
  html += '<div class="card"><h3>📸 Evidencias del día (' + evs.length + ')</h3>' +
    (evs.length ? '<div class="galeria">' + evs.map(e => tarjetaEvidencia(e)).join('') + '</div>' : '<p class="muted mini">Sin evidencias este día.</p>') + '</div>';
  // cierre del día
  const cie = db.cierres.find(c => c.fecha === fecha && c.sucursalId === sid);
  html += '<div class="card"><h3>🌙 Cierre del día</h3>' + (cie
    ? '<div class="grid c3"><div class="stat verde"><div class="v">' + fmt$(cie.ventas) + '</div><div class="l">ventas netas</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(cie.caja) + '</div><div class="l">caja</div></div>' +
    '<div class="stat"><div class="v">' + (cie.hechos ?? 0) + '/' + CHECK_CIERRE.length + '</div><div class="l">checklist cierre</div></div></div>' +
    (cie.novedades ? '<p class="mini muted" style="margin-top:8px">🗞️ ' + esc(cie.novedades) + '</p>' : '')
    : '<p class="muted mini">Aún sin cierre registrado este día.</p>') + '</div>';
  // veredicto
  const a1 = avanceTurno(1, fecha, sid), a2 = avanceTurno(2, fecha, sid);
  const pct = (a1.total + a2.total) ? Math.round((a1.hechas + a2.hechas) / (a1.total + a2.total) * 100) : 0;
  html += '<div class="card amarilla"><h3>📝 Enviar revisión del día</h3>' +
    '<div class="fila" style="margin-bottom:8px"><div class="stat" style="flex:0 0 130px"><div class="v">' + pct + '%</div><div class="l">cumplimiento</div></div>' +
    '<div style="flex:1"><div class="seg" style="margin:0">' +
    '<button id="rev-v-cumplido" onclick="revVeredicto=\'cumplido\';marcarVeredicto()">✅ Cumplido</button>' +
    '<button id="rev-v-ajustes" onclick="revVeredicto=\'ajustes\';marcarVeredicto()">⚠️ Ajustes</button>' +
    '<button id="rev-v-nocumplido" onclick="revVeredicto=\'nocumplido\';marcarVeredicto()">⛔ No cumplido</button></div></div></div>' +
    '<label>Retroalimentación para el equipo</label>' +
    '<textarea id="rev-comentario" placeholder="Ej. Excelente turno, solo faltó rellenar salsas…"></textarea>' +
    '<div style="margin-top:14px"><button class="btn p gigante" onclick="guardarRevision(\'' + fecha + '\',\'' + sid + '\',' + pct + ')">🔍 Enviar revisión</button></div></div>';
  // historial
  const hist = db.revisiones.filter(r => r.sucursalId === sid).slice(0, 7);
  if (hist.length) html += '<div class="card"><h3>📜 Revisiones recientes</h3>' + hist.map(r =>
    '<div class="item-linea"><div class="grow"><b>' + (r.veredicto === 'cumplido' ? '✅' : r.veredicto === 'ajustes' ? '⚠️' : '⛔') +
    ' ' + fmtFecha(r.fecha) + ' · ' + r.pct + '%</b><div class="mini muted">' + esc(r.comentario || '') + '</div></div></div>').join('') + '</div>';
  $('rev-contenido').innerHTML = html;
  marcarVeredicto();
}
let revVeredicto = 'cumplido';
function marcarVeredicto() {
  ['cumplido', 'ajustes', 'nocumplido'].forEach(v => {
    const b = $('rev-v-' + v); if (b) b.classList.toggle('on', revVeredicto === v);
  });
}
function verificarTarea(tid, fecha, sid) {
  const t = TAREAS.find(x => x.id === tid);
  const key = tareaKey(fecha, sid, tid);
  let r = db.tareas.find(x => x.id === key);
  if (!r) {
    // tarea automática (entrada) verificada sin registro manual previo
    r = { id: key, fecha, sucursalId: sid, tareaId: tid, turno: t.turno, nombre: t.n, done: true, por: 'auto' };
    db.tareas.push(r);
  }
  r.ver = !r.ver; r.verTs = Date.now(); r.ts = Date.now();
  guardarDB(); renderRevision();
  toast(r.ver ? '✔✔ Tarea verificada' : '↩️ Verificación retirada');
}
function guardarRevision(fecha, sid, pct) {
  const comentario = $('rev-comentario').value.trim();
  const s = suc(sid);
  db.revisiones.unshift({
    id: uid(), ts: Date.now(), fecha, sucursalId: sid, pct,
    veredicto: revVeredicto, comentario
  });
  db.revisiones = db.revisiones.slice(0, 200);
  guardarDB();
  const emoji = revVeredicto === 'cumplido' ? '✅' : revVeredicto === 'ajustes' ? '⚠️' : '⛔';
  notificar('🔍 Revisión ' + emoji + ' — ' + (s?.nombre || '') + ' (' + fmtFecha(fecha) + ')',
    'Veredicto: ' + revVeredicto.toUpperCase() + '\nCumplimiento: ' + pct + '%' +
    (comentario ? '\nRetroalimentación: ' + comentario : ''));
  toast('🔍 Revisión enviada — el equipo la verá en su panel');
  $('rev-comentario').value = '';
  renderRevision();
}

/* ═══════════ TEMA CLARO / OSCURO ═══════════ */
function toggleTema() {
  const claro = document.documentElement.dataset.tema === 'claro';
  if (claro) { delete document.documentElement.dataset.tema; localStorage.setItem('ojo_tema', 'oscuro'); }
  else { document.documentElement.dataset.tema = 'claro'; localStorage.setItem('ojo_tema', 'claro'); }
  toast(claro ? '🌌 Modo oscuro — la noche cósmica de Cyclos' : '☀️ Modo claro');
}
function initTema() {
  if (localStorage.getItem('ojo_tema') === 'claro') document.documentElement.dataset.tema = 'claro';
}

/* ═══════════ DIRECCIÓN ═══════════ */
function dirTab(t) {
  tabDir = t;
  document.querySelectorAll('#dir-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  renderDireccion();
}
function renderDireccion() {
  if (!esAdmin) return salirASucursales();
  pintarRed();
  const c = $('dir-contenido');
  if (tabDir === 'hoy') c.innerHTML = dirHoy();
  if (tabDir === 'mes') c.innerHTML = dirMes();
  if (tabDir === 'nomina') c.innerHTML = dirNomina();
  if (tabDir === 'inv') c.innerHTML = dirInventarios();
  if (tabDir === 'evid') c.innerHTML = dirEvidencias();
  if (tabDir === 'admin') c.innerHTML = dirAdmin();
}

/* --- HOY --- */
function dirHoy() {
  const hoy = hoyISO();
  const ventasHoy = db.cierres.filter(x => x.fecha === hoy).reduce((a, x) => a + x.ventas, 0);
  const abiertos = turnosAbiertos();
  const tareasHoy = db.tareas.filter(x => x.fecha === hoy && x.done).length;
  const propHoyTot = propinasDe(hoy).reduce((a, x) => a + x.monto, 0);
  let html = '<div class="grid c4">' +
    '<div class="stat verde"><div class="v">' + fmt$(ventasHoy) + '</div><div class="l">ventas de hoy</div></div>' +
    '<div class="stat"><div class="v">' + abiertos.length + '</div><div class="l">en turno ahora</div></div>' +
    '<div class="stat"><div class="v">' + tareasHoy + '</div><div class="l">tareas hechas hoy</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(propHoyTot) + '</div><div class="l">💳 propinas hoy</div></div></div>';
  db.sucursales.filter(s => s.activa).forEach(s => {
    const enTurno = turnosAbiertos(s.id);
    const falt = faltantes(s.id);
    const cierresHoy = db.cierres.filter(x => x.fecha === hoy && x.sucursalId === s.id);
    const a1 = avanceTurno(1, hoy, s.id), a2 = avanceTurno(2, hoy, s.id);
    const revS = db.revisiones.find(r => r.sucursalId === s.id);
    html += '<div class="card"><div class="encabezado-seccion"><h3 style="margin:0">🏬 ' + esc(s.nombre) + '</h3>' +
      (falt.length ? '<span class="badge comprar">🛒 ' + falt.length + ' por comprar</span>' : '<span class="badge ok">stock OK</span>') + '</div>';
    html += enTurno.length ? enTurno.map(t => {
      const p = per(t.personalId);
      return '<div class="item-linea"><div class="avatar">' + esc((p?.nombre || '?')[0]) + '</div><div class="grow"><b>' + esc(p?.nombre || '') +
        '</b><div class="mini muted">' + (t.tipo === 'matutino' ? '☀️' : '🌙') + ' entró ' + fmtHora(t.entrada) + '</div></div><span class="badge mor">en turno</span></div>';
    }).join('') : '<p class="muted mini">Nadie en turno.</p>';
    html += '<div class="sep"></div><div class="fila mini muted">' +
      '<span>☀️ T1: <b class="amar">' + a1.hechas + '/' + a1.total + '</b></span>' +
      '<span>🌙 T2: <b class="amar">' + a2.hechas + '/' + a2.total + '</b></span>' +
      '<span>Cierres: <b class="amar">' + cierresHoy.length + '</b>' +
      (cierresHoy.length ? ' · ' + fmt$(cierresHoy.reduce((a, x) => a + x.ventas, 0)) : '') + '</span>' +
      (revS ? '<span>🔍 Últ. revisión: <b class="amar">' + (revS.veredicto === 'cumplido' ? '✅' : revS.veredicto === 'ajustes' ? '⚠️' : '⛔') +
        ' ' + revS.pct + '%</b></span>' : '') + '</div>';
    if (falt.length) html += '<div class="mini" style="margin-top:8px;color:var(--alerta)">Faltan: ' +
      falt.slice(0, 8).map(p => esc(p.nombre)).join(', ') + (falt.length > 8 ? ' +' + (falt.length - 8) + ' más' : '') + '</div>';
    html += '</div>';
  });
  // novedades recientes
  const novedades = db.cierres.concat(db.checklists).filter(x => x.novedades).slice(0, 6);
  if (novedades.length) html += '<div class="card"><h3>🗞️ Novedades recientes del equipo</h3>' +
    novedades.map(n => '<div class="item-linea"><div class="grow"><div class="mini">' + esc(n.novedades) + '</div>' +
      '<div class="mini muted">' + esc(suc(n.sucursalId)?.nombre || '') + ' · ' + fmtFecha(n.fecha) + '</div></div></div>').join('') + '</div>';
  // bitácora
  html += '<div class="card"><h3>📜 Bitácora de eventos</h3>' + (db.eventos.slice(0, 10).map(e =>
    '<div class="item-linea"><div class="grow"><b style="font-size:.85rem">' + esc(e.asunto) + '</b>' +
    '<div class="mini muted">' + new Date(e.ts).toLocaleString('es-MX') + '</div></div></div>').join('') || '<p class="muted mini">Sin eventos aún.</p>') + '</div>';
  return html;
}

/* --- MES --- */
let mesVista = mesISO();
function dirMes() {
  const [y, m] = mesVista.split('-').map(Number);
  const cierres = db.cierres.filter(c => c.fecha.startsWith(mesVista));
  const total = cierres.reduce((a, c) => a + c.ventas, 0);
  const porSuc = {};
  db.sucursales.forEach(s => porSuc[s.id] = cierres.filter(c => c.sucursalId === s.id).reduce((a, c) => a + c.ventas, 0));
  const dias = {};
  cierres.forEach(c => { dias[c.fecha] = dias[c.fecha] || {}; dias[c.fecha][c.sucursalId] = (dias[c.fecha][c.sucursalId] || 0) + c.ventas; });
  const nomMes = MESES[m - 1] + ' ' + y;
  let html = '<div class="encabezado-seccion"><h2 style="margin:0">📅 ' + nomMes + '</h2><div class="fila" style="flex:0">' +
    '<button class="btn s mini" onclick="cambiarMes(-1)">←</button>' +
    '<button class="btn s mini" onclick="cambiarMes(1)">→</button>' +
    '<button class="btn s mini" onclick="exportarMesCSV()">⬇️ CSV</button></div></div>';
  html += '<div class="grid c3"><div class="stat verde"><div class="v">' + fmt$(total) + '</div><div class="l">ventas del mes</div></div>' +
    db.sucursales.filter(s => s.activa).map(s => '<div class="stat"><div class="v">' + fmt$(porSuc[s.id] || 0) + '</div><div class="l">' + esc(s.nombre) + '</div></div>').join('') + '</div>';
  const fechas = Object.keys(dias).sort().reverse();
  html += '<div class="card"><h3>Cierres por día</h3><div class="tabla-wrap"><table><tr><th>Fecha</th>' +
    db.sucursales.filter(s => s.activa).map(s => '<th class="num">' + esc(s.nombre) + '</th>').join('') + '<th class="num">Total día</th></tr>';
  if (!fechas.length) html += '<tr><td colspan="9" class="muted">Aún no hay cierres este mes.</td></tr>';
  fechas.forEach(f => {
    const tot = Object.values(dias[f]).reduce((a, b) => a + b, 0);
    html += '<tr><td>' + fmtFecha(f) + '</td>' + db.sucursales.filter(s => s.activa).map(s =>
      '<td class="num">' + (dias[f][s.id] ? fmt$(dias[f][s.id]) : '—') + '</td>').join('') +
      '<td class="num"><b class="amar">' + fmt$(tot) + '</b></td></tr>';
  });
  html += '</table></div></div>';
  // detalle de cierres
  html += '<div class="card"><h3>Detalle de cierres</h3><div class="tabla-wrap"><table><tr><th>Fecha</th><th>Sucursal</th><th>Responsable</th><th class="num">Ventas</th><th class="num">Caja</th><th>Checklist</th><th>Novedades</th></tr>' +
    (cierres.map(c => '<tr><td>' + fmtFecha(c.fecha) + '</td><td>' + esc(suc(c.sucursalId)?.nombre || '') + '</td><td>' + esc(per(c.personalId)?.nombre || '—') +
      '</td><td class="num">' + fmt$(c.ventas) + '</td><td class="num">' + fmt$(c.caja) + '</td><td>' + (c.hechos ?? '—') + '/' + CHECK_CIERRE.length +
      '</td><td class="mini">' + esc(c.novedades || '') + '</td></tr>').join('') || '<tr><td colspan="7" class="muted">Sin cierres.</td></tr>') +
    '</table></div></div>';
  return html;
}
function cambiarMes(d) {
  let [y, m] = mesVista.split('-').map(Number);
  m += d; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
  mesVista = y + '-' + String(m).padStart(2, '0');
  renderDireccion();
}
function exportarMesCSV() {
  const cierres = db.cierres.filter(c => c.fecha.startsWith(mesVista));
  let csv = 'Fecha,Sucursal,Responsable,VentasNetas,DineroCaja,Checklist,Novedades\n';
  cierres.forEach(c => csv += [c.fecha, suc(c.sucursalId)?.nombre || '', per(c.personalId)?.nombre || '',
    c.ventas, c.caja, (c.hechos ?? '') + '/' + CHECK_CIERRE.length, '"' + (c.novedades || '').replace(/"/g, "'") + '"'].join(',') + '\n');
  descargar('cierres-' + mesVista + '.csv', csv);
  toast('⬇️ CSV del mes descargado');
}

/* --- NÓMINA --- */
let nominaMes = mesISO();
function dirNomina() {
  const turnos = db.turnos.filter(t => t.salida && t.fecha.startsWith(nominaMes));
  const propMes = db.propinas.filter(x => x.fecha.startsWith(nominaMes));
  const porPersona = {};
  turnos.forEach(t => {
    const c = calcularPago(t);
    const k = t.personalId;
    porPersona[k] = porPersona[k] || { turnos: 0, horas: 0, pago: 0, propinas: 0 };
    porPersona[k].turnos++; porPersona[k].horas += c.horas; porPersona[k].pago += c.pago;
  });
  propMes.forEach(x => {
    porPersona[x.personalId] = porPersona[x.personalId] || { turnos: 0, horas: 0, pago: 0, propinas: 0 };
    porPersona[x.personalId].propinas += x.monto;
  });
  const totalNomina = Object.values(porPersona).reduce((a, x) => a + x.pago, 0);
  const totalProp = propMes.reduce((a, x) => a + x.monto, 0);
  const [y, m] = nominaMes.split('-').map(Number);
  let html = '<div class="encabezado-seccion"><h2 style="margin:0">💰 Nómina · ' + MESES[m - 1] + ' ' + y + '</h2>' +
    '<div class="fila" style="flex:0"><button class="btn s mini" onclick="cambiarNominaMes(-1)">←</button>' +
    '<button class="btn s mini" onclick="cambiarNominaMes(1)">→</button>' +
    '<button class="btn s mini" onclick="exportarNominaCSV()">⬇️ CSV</button></div></div>';
  html += '<div class="grid c3"><div class="stat verde"><div class="v">' + fmt$(totalNomina + totalProp) + '</div><div class="l">total a pagar</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(totalProp) + '</div><div class="l">💳 propinas por retribuir</div></div>' +
    '<div class="stat"><div class="v">' + turnos.length + '</div><div class="l">turnos cerrados</div></div></div>';
  html += '<div class="card"><div class="tabla-wrap"><table><tr><th>Colaborador</th><th class="num">Turnos</th><th class="num">Horas</th><th class="num">Sueldo</th><th class="num">💳 Propinas</th><th class="num">A pagar</th></tr>' +
    (Object.entries(porPersona).map(([pid, x]) => {
      const p = per(pid);
      return '<tr><td>' + esc(p?.nombre || '¿?') + '</td><td class="num">' + x.turnos + '</td><td class="num">' + x.horas.toFixed(1) +
        ' h</td><td class="num">' + fmt$(x.pago) + '</td><td class="num">' + fmt$(x.propinas) + '</td><td class="num"><b class="amar">' + fmt$(x.pago + x.propinas) + '</b></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Sin registros este mes.</td></tr>') + '</table></div>' +
    '<p class="mini muted">Base de ' + (db.config.baseHoras || 6) + ' h por turno; horas extra con tarifa individual. Las propinas digitales (tarjeta) se retribuyen al colaborador que las registró.</p></div>';
  // propinas del mes con opción de eliminar
  html += '<div class="card"><h3>💳 Propinas digitales del mes</h3>' +
    (propMes.length ? '<div class="tabla-wrap"><table><tr><th>Fecha</th><th>Colaborador</th><th>Sucursal</th><th class="num">Monto</th><th>Nota</th><th></th></tr>' +
      propMes.map(x => '<tr><td>' + fmtFecha(x.fecha) + ' ' + fmtHora(x.ts) + '</td><td>' + esc(per(x.personalId)?.nombre || '¿?') +
        '</td><td>' + esc(suc(x.sucursalId)?.nombre || '') + '</td><td class="num">' + fmt$(x.monto) + '</td><td class="mini">' + esc(x.nota || '') +
        '</td><td><button class="btn s mini" onclick="borrarPropina(\'' + x.id + '\')">🗑️</button></td></tr>').join('') + '</table></div>'
      : '<p class="muted mini">Sin propinas digitales este mes.</p>') + '</div>';
  // detalle
  html += '<div class="card"><h3>Detalle de turnos</h3><div class="tabla-wrap"><table><tr><th>Fecha</th><th>Colaborador</th><th>Sucursal</th><th>Turno</th><th>Entrada</th><th>Salida</th><th class="num">Horas</th><th class="num">Pago</th></tr>' +
    (turnos.map(t => {
      const c = calcularPago(t);
      return '<tr><td>' + fmtFecha(t.fecha) + '</td><td>' + esc(per(t.personalId)?.nombre || '') + '</td><td>' + esc(suc(t.sucursalId)?.nombre || '') +
        '</td><td>' + (t.tipo === 'matutino' ? '☀️' : '🌙') + '</td><td>' + fmtHora(t.entrada) + '</td><td>' + fmtHora(t.salida) +
        '</td><td class="num">' + c.horas + '</td><td class="num">' + fmt$(c.pago) + '</td></tr>';
    }).join('') || '<tr><td colspan="8" class="muted">Sin registros.</td></tr>') + '</table></div></div>';
  return html;
}
function cambiarNominaMes(d) {
  let [y, m] = nominaMes.split('-').map(Number);
  m += d; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
  nominaMes = y + '-' + String(m).padStart(2, '0');
  renderDireccion();
}
function exportarNominaCSV() {
  const turnos = db.turnos.filter(t => t.salida && t.fecha.startsWith(nominaMes));
  let csv = 'Fecha,Colaborador,Sucursal,Turno,Entrada,Salida,Horas,Pago\n';
  turnos.forEach(t => {
    const c = calcularPago(t);
    csv += [t.fecha, per(t.personalId)?.nombre || '', suc(t.sucursalId)?.nombre || '', t.tipo,
      fmtHora(t.entrada), fmtHora(t.salida), c.horas, c.pago].join(',') + '\n';
  });
  csv += '\nPROPINAS DIGITALES\nFecha,Colaborador,Sucursal,Monto,Nota\n';
  db.propinas.filter(x => x.fecha.startsWith(nominaMes)).forEach(x => {
    csv += [x.fecha, per(x.personalId)?.nombre || '', suc(x.sucursalId)?.nombre || '', x.monto,
      '"' + (x.nota || '').replace(/"/g, "'") + '"'].join(',') + '\n';
  });
  descargar('nomina-' + nominaMes + '.csv', csv);
  toast('⬇️ CSV de nómina descargado');
}

/* --- INVENTARIOS (vista dirección) --- */
function dirInventarios() {
  let html = '';
  db.sucursales.filter(s => s.activa).forEach(s => {
    const falt = faltantes(s.id);
    const st = stockDe(s.id);
    html += '<div class="card"><div class="encabezado-seccion"><h3 style="margin:0">🏬 ' + esc(s.nombre) + '</h3>' +
      (falt.length ? '<span class="badge comprar">🛒 ' + falt.length + ' por comprar</span>' : '<span class="badge ok">stock completo</span>') + '</div>';
    if (falt.length) {
      html += '<div class="tabla-wrap"><table><tr><th>Producto</th><th class="num">Quedan</th><th class="num">Mínimo</th></tr>' +
        falt.map(p => '<tr><td>' + esc(p.nombre) + '</td><td class="num" style="color:var(--alerta)">' + (st[p.id]?.c || 0) +
          '</td><td class="num">' + p.minimo + '</td></tr>').join('') + '</table></div>';
      const texto = '🛒 *Compras ' + s.nombre + '*\n' + falt.map(p => '· ' + p.nombre + ' (quedan ' + (st[p.id]?.c || 0) + ')').join('\n');
      html += '<div style="margin-top:10px"><a class="btn s mini" href="' + linkWhatsApp(texto) + '" target="_blank">📲 Mandar lista por WhatsApp</a></div>';
    } else html += '<p class="muted mini">Todos los productos por encima del mínimo ✅</p>';
    html += '</div>';
  });
  return html;
}

/* --- EVIDENCIAS (vista dirección) --- */
function dirEvidencias() {
  let html = '';
  db.sucursales.filter(s => s.activa).forEach(s => {
    const lista = db.evidencias.filter(e => e.sucursalId === s.id).slice(0, 12);
    html += '<div class="card"><h3>🏬 ' + esc(s.nombre) + '</h3>' +
      (lista.length ? '<div class="galeria">' + lista.map(e => tarjetaEvidencia(e)).join('') + '</div>'
        : '<p class="muted mini">Sin evidencias.</p>') + '</div>';
  });
  return html;
}

/* --- ADMINISTRAR --- */
function dirAdmin() {
  const c = db.config;
  let html = '';
  /* sucursales */
  html += '<div class="card"><div class="encabezado-seccion"><h3 style="margin:0">🏬 Sucursales</h3>' +
    '<button class="btn s mini" onclick="modalSucursal()">+ Agregar</button></div>' +
    db.sucursales.map(s => '<div class="item-linea"><div class="grow"><b>' + esc(s.nombre) + '</b>' +
      '<div class="mini muted">' + esc(s.direccion || '') + '</div></div>' +
      '<span class="badge ' + (s.activa ? 'ok' : 'aviso') + '">' + (s.activa ? 'activa' : 'pausada') + '</span>' +
      '<button class="btn s mini" onclick="modalSucursal(\'' + s.id + '\')">✏️</button></div>').join('') + '</div>';
  /* personal */
  html += '<div class="card"><div class="encabezado-seccion"><h3 style="margin:0">👥 Personal y sueldos</h3>' +
    '<button class="btn s mini" onclick="modalPersona()">+ Agregar</button></div>' +
    '<div class="tabla-wrap"><table><tr><th>Nombre</th><th>PIN</th><th class="num">$/turno (' + (c.baseHoras || 6) + 'h)</th><th class="num">$/h extra</th><th></th></tr>' +
    db.personal.map(p => '<tr' + (p.activo ? '' : ' style="opacity:.45"') + '><td>' + esc(p.nombre) + '</td><td>' + esc(p.pin) +
      '</td><td class="num">' + fmt$(p.pagoTurno) + '</td><td class="num">' + fmt$(p.pagoHora) +
      '</td><td><button class="btn s mini" onclick="modalPersona(\'' + p.id + '\')">✏️</button></td></tr>').join('') + '</table></div></div>';
  /* productos */
  html += '<div class="card"><div class="encabezado-seccion"><h3 style="margin:0">📦 Catálogo de productos (' + db.productos.length + ')</h3>' +
    '<button class="btn s mini" onclick="modalProducto()">+ Agregar</button></div>' +
    '<input placeholder="🔍 Buscar producto…" oninput="filtrarProdAdmin(this.value)" style="margin-bottom:8px">' +
    '<div id="prod-admin-lista" style="max-height:340px;overflow-y:auto">' + listaProdAdmin('') + '</div></div>';
  /* configuración */
  html += '<div class="card"><h3>⚙️ Configuración</h3>' +
    '<label>PIN de Dirección</label><input id="cfg-pin" value="' + esc(c.adminPin) + '" maxlength="4" inputmode="numeric">' +
    '<label>PIN de Supervisión (revisora externa)</label><input id="cfg-pin-sup" value="' + esc(c.supervisorPin || '4040') + '" maxlength="4" inputmode="numeric">' +
    '<label>Horas base por turno</label><input id="cfg-base" type="number" value="' + (c.baseHoras || 6) + '">' +
    '<label>Correo de notificaciones</label><input id="cfg-email" value="' + esc(c.emailTo) + '">' +
    '<label>WhatsApp de avisos (con lada país, ej. 52771…)</label><input id="cfg-wa" value="' + esc(c.whatsapp) + '">' +
    '<label>URL del backend (Google Apps Script)</label><input id="cfg-url" value="' + esc(c.scriptUrl) + '" placeholder="https://script.google.com/macros/s/…/exec">' +
    '<div class="fila" style="margin-top:14px"><button class="btn p" onclick="guardarConfig()">💾 Guardar</button>' +
    '<button class="btn s" onclick="probarConexion()">🔌 Probar conexión</button></div>' +
    '<p class="mini muted" style="margin-top:10px">Sin backend el sistema funciona en modo local (solo esta tablet). ' +
    'Con el backend conectado: sincronización entre dispositivos, correos automáticos a ' + esc(c.emailTo) + ', fotos y respaldos en el Drive del negocio. Ver GUIA-INSTALACION.md.</p></div>';
  /* respaldos */
  html += '<div class="card"><h3>🛡️ Respaldos</h3><div class="grid c3">' +
    '<button class="btn s" onclick="descargarRespaldo()">⬇️ Descargar respaldo</button>' +
    '<button class="btn s" onclick="$(\'imp-json\').click()">⬆️ Restaurar respaldo</button>' +
    '<button class="btn s" onclick="respaldarDrive()" ' + (enLinea() ? '' : 'disabled') + '>☁️ Respaldar en Drive ahora</button></div>' +
    '<input type="file" id="imp-json" accept=".json" hidden onchange="importarRespaldo(this)">' +
    '<p class="mini muted" style="margin-top:10px">Con el backend conectado, cada noche se guarda un respaldo automático en la carpeta <b>El Ojo Maestro</b> del Drive de ' + esc(c.emailTo) + '.</p>' +
    '<div class="sep"></div><button class="btn peligro" onclick="reiniciarDatos()">🗑️ Restablecer datos de fábrica</button></div>';
  return html;
}
function listaProdAdmin(q) {
  q = q.toLowerCase();
  return db.productos.filter(p => p.nombre.toLowerCase().includes(q)).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(p =>
    '<div class="item-linea">' + miniProd(p, 38) + '<div class="grow"><b style="font-size:.88rem">' + esc(p.nombre) + '</b>' +
    '<div class="mini muted">' + esc(p.unidad) + ' · mín ' + p.minimo + ' · ' + (CATS[p.cat] || '') + '</div></div>' +
    '<button class="btn s mini" onclick="modalProducto(\'' + p.id + '\')">✏️</button></div>').join('');
}
function filtrarProdAdmin(q) { $('prod-admin-lista').innerHTML = listaProdAdmin(q); }

function modalSucursal(id) {
  const s = id ? suc(id) : null;
  abrirModal('<h3>' + (s ? 'Editar' : 'Nueva') + ' sucursal</h3>' +
    '<label>Nombre</label><input id="ms-nombre" value="' + esc(s?.nombre || '') + '">' +
    '<label>Dirección</label><input id="ms-dir" value="' + esc(s?.direccion || '') + '">' +
    (s ? '<label>Estado</label><select id="ms-activa"><option value="1"' + (s.activa ? ' selected' : '') + '>Activa</option><option value="0"' + (!s.activa ? ' selected' : '') + '>Pausada</option></select>' : '') +
    '<div class="fila" style="margin-top:16px"><button class="btn p" onclick="guardarSucursal(\'' + (id || '') + '\')">💾 Guardar</button>' +
    (s && db.sucursales.length > 1 ? '<button class="btn peligro" onclick="borrarSucursal(\'' + id + '\')">🗑️ Eliminar</button>' : '') + '</div>' +
    '<div style="height:8px"></div><button class="btn s" onclick="cerrarModal()">Cancelar</button>');
}
function guardarSucursal(id) {
  const nombre = $('ms-nombre').value.trim(); if (!nombre) return toast('Ponle nombre a la sucursal');
  if (id) { const s = suc(id); s.nombre = nombre; s.direccion = $('ms-dir').value.trim(); s.activa = $('ms-activa').value === '1'; }
  else {
    const nid = 'suc-' + uid();
    db.sucursales.push({ id: nid, nombre, direccion: $('ms-dir').value.trim(), activa: true });
    db.stock[nid] = {}; db.productos.forEach(p => db.stock[nid][p.id] = { c: 0, t: 0 });
  }
  guardarDB(); cerrarModal(); renderDireccion(); toast('🏬 Sucursal guardada');
}
function borrarSucursal(id) {
  if (turnosAbiertos(id).length) return toast('⚠️ Hay turnos abiertos en esta sucursal');
  if (!confirm('¿Eliminar la sucursal "' + suc(id).nombre + '"? Su historial se conserva pero dejará de aparecer.')) return;
  db.sucursales = db.sucursales.filter(s => s.id !== id);
  guardarDB(); cerrarModal(); renderDireccion(); toast('🗑️ Sucursal eliminada');
}
function modalPersona(id) {
  const p = id ? per(id) : null;
  abrirModal('<h3>' + (p ? 'Editar colaborador' : 'Nuevo colaborador') + '</h3>' +
    '<label>Nombre</label><input id="mp-nombre" value="' + esc(p?.nombre || '') + '">' +
    '<label>PIN (4 dígitos)</label><input id="mp-pin" value="' + esc(p?.pin || '') + '" maxlength="4" inputmode="numeric">' +
    '<div class="fila"><div><label>Pago por turno base ($)</label><input id="mp-turno" type="number" value="' + (p?.pagoTurno ?? 300) + '"></div>' +
    '<div><label>Pago por hora extra ($)</label><input id="mp-hora" type="number" value="' + (p?.pagoHora ?? 50) + '"></div></div>' +
    (p ? '<label>Estado</label><select id="mp-activo"><option value="1"' + (p.activo ? ' selected' : '') + '>Activo</option><option value="0"' + (!p.activo ? ' selected' : '') + '>Inactivo</option></select>' : '') +
    '<div class="fila" style="margin-top:16px"><button class="btn p" onclick="guardarPersona(\'' + (id || '') + '\')">💾 Guardar</button>' +
    (p ? '<button class="btn peligro" onclick="borrarPersona(\'' + id + '\')">🗑️ Eliminar</button>' : '') + '</div>' +
    '<div style="height:8px"></div><button class="btn s" onclick="cerrarModal()">Cancelar</button>');
}
function guardarPersona(id) {
  const nombre = $('mp-nombre').value.trim(), pin = $('mp-pin').value.trim();
  if (!nombre || pin.length !== 4) return toast('Nombre y PIN de 4 dígitos');
  if (id) { const p = per(id); Object.assign(p, { nombre, pin, pagoTurno: Number($('mp-turno').value) || 0, pagoHora: Number($('mp-hora').value) || 0, activo: $('mp-activo').value === '1' }); }
  else db.personal.push({ id: uid(), nombre, pin, pagoTurno: Number($('mp-turno').value) || 0, pagoHora: Number($('mp-hora').value) || 0, activo: true });
  guardarDB(); cerrarModal(); renderDireccion(); toast('👥 Colaborador guardado');
}
function borrarPersona(id) {
  if (!confirm('¿Eliminar a ' + per(id).nombre + '? Su historial de turnos se conserva.')) return;
  db.personal = db.personal.filter(p => p.id !== id);
  guardarDB(); cerrarModal(); renderDireccion(); toast('🗑️ Colaborador eliminado');
}
let fotoProductoTmp = null; // null = sin cambio; '' = quitar; 'ruta/dataURL' = nueva
function modalProducto(id) {
  const p = id ? prod(id) : null;
  fotoProductoTmp = null;
  abrirModal('<h3>' + (p ? 'Editar producto' : 'Nuevo producto') + '</h3>' +
    '<div class="fila" style="align-items:center"><span id="mx-foto-prev">' + (p ? miniProd(p, 64) : miniProd({ nombre: '' }, 64)) + '</span>' +
    '<div style="flex:1"><button class="btn s mini" onclick="abrirGaleriaFotos()">🖼️ Elegir de la galería</button> ' +
    '<button class="btn s mini" onclick="$(\'mx-foto-file\').click()">📷 Foto propia</button> ' +
    '<button class="btn s mini" onclick="fotoProductoTmp=\'\';$(\'mx-foto-prev\').innerHTML=miniProd({nombre:\'\'},64)">✖ Quitar</button></div></div>' +
    '<input type="file" id="mx-foto-file" accept="image/*" hidden>' +
    '<label>Nombre</label><input id="mx-nombre" value="' + esc(p?.nombre || '') + '">' +
    '<label>Unidad / regla de conteo</label><input id="mx-unidad" value="' + esc(p?.unidad || 'Pieza') + '">' +
    '<div class="fila"><div><label>Mínimo (alerta COMPRAR)</label><input id="mx-min" type="number" value="' + (p?.minimo ?? 1) + '"></div>' +
    '<div><label>Categoría</label><select id="mx-cat">' + Object.entries(CATS).filter(([k]) => k !== 'TODOS').map(([k, v]) =>
      '<option value="' + k + '"' + (p?.cat === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></div></div>' +
    '<div class="fila" style="margin-top:16px"><button class="btn p" onclick="guardarProducto(\'' + (id || '') + '\')">💾 Guardar</button>' +
    (p ? '<button class="btn peligro" onclick="borrarProducto(\'' + id + '\')">🗑️ Eliminar</button>' : '') + '</div>' +
    '<div style="height:8px"></div><button class="btn s" onclick="cerrarModal()">Cancelar</button>');
  $('mx-foto-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    comprimirFoto(f, dataUrl => {
      fotoProductoTmp = dataUrl;
      $('mx-foto-prev').innerHTML = '<img src="' + dataUrl + '" style="width:64px;height:64px;object-fit:cover;border-radius:10px;background:#fff">';
    }, 220, .8);
  };
}
function abrirGaleriaFotos() {
  const grid = (window.CICLOPE_GALERIA || []).map(src =>
    '<img src="' + src + '" loading="lazy" style="width:64px;height:64px;object-fit:cover;border-radius:10px;background:#fff;cursor:pointer;border:2px solid transparent" ' +
    'onclick="fotoProductoTmp=\'' + src + '\';$(\'mx-foto-prev\').innerHTML=\'<img src=&quot;' + src + '&quot; style=&quot;width:64px;height:64px;object-fit:cover;border-radius:10px;background:#fff&quot;>\';$(\'galeria-fotos\').style.display=\'none\'">').join('');
  let cont = $('galeria-fotos');
  if (!cont) {
    cont = document.createElement('div'); cont.id = 'galeria-fotos';
    cont.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;max-height:240px;overflow-y:auto;margin-top:10px;padding:10px;border:1px solid rgba(147,51,234,.4);border-radius:12px';
    $('mx-foto-prev').parentElement.insertAdjacentElement('afterend', cont);
  }
  cont.innerHTML = grid; cont.style.display = 'flex';
}
function guardarProducto(id) {
  const nombre = $('mx-nombre').value.trim(); if (!nombre) return toast('Nombre del producto');
  if (id) {
    const p = prod(id); Object.assign(p, { nombre, unidad: $('mx-unidad').value.trim(), minimo: Number($('mx-min').value) || 0, cat: $('mx-cat').value });
    if (fotoProductoTmp !== null) p.foto = fotoProductoTmp;
  }
  else {
    const np = { id: uid(), nombre, unidad: $('mx-unidad').value.trim() || 'Pieza', minimo: Number($('mx-min').value) || 0, cat: $('mx-cat').value };
    if (fotoProductoTmp) np.foto = fotoProductoTmp;
    db.productos.push(np);
    db.sucursales.forEach(s => { stockDe(s.id)[np.id] = { c: 0, t: 0 }; });
  }
  guardarDB(); cerrarModal(); renderDireccion(); toast('📦 Producto guardado');
}
function borrarProducto(id) {
  if (!confirm('¿Eliminar "' + prod(id).nombre + '" del catálogo?')) return;
  db.productos = db.productos.filter(p => p.id !== id);
  guardarDB(); cerrarModal(); renderDireccion(); toast('🗑️ Producto eliminado');
}
function guardarConfig() {
  const c = db.config;
  const pin = $('cfg-pin').value.trim();
  if (pin.length === 4) c.adminPin = pin; else return toast('El PIN debe tener 4 dígitos');
  const pinSup = $('cfg-pin-sup').value.trim();
  if (pinSup.length === 4) c.supervisorPin = pinSup;
  c.baseHoras = Number($('cfg-base').value) || 6;
  c.emailTo = $('cfg-email').value.trim();
  c.whatsapp = $('cfg-wa').value.replace(/\D/g, '');
  c.scriptUrl = $('cfg-url').value.trim();
  guardarDB(); pintarRed(); toast('💾 Configuración guardada');
  if (enLinea()) sync(false);
}
async function probarConexion() {
  const url = $('cfg-url').value.trim();
  if (!url) return toast('Pega primero la URL del script');
  toast('🔌 Probando conexión…');
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'ping' }) });
    const j = await r.json();
    toast(j && j.ok ? '🟢 ¡Conexión exitosa con la nube Cíclope!' : '⚠️ El script respondió pero con error');
  } catch (e) { toast('🔴 No se pudo conectar. Revisa la URL y el despliegue del script.'); }
}
function descargar(nombre, contenido, tipo = 'text/csv') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + contenido], { type: tipo + ';charset=utf-8' }));
  a.download = nombre; a.click(); URL.revokeObjectURL(a.href);
}
function descargarRespaldo() {
  descargar('ojo-maestro-respaldo-' + hoyISO() + '.json', JSON.stringify(db, null, 1), 'application/json');
  toast('⬇️ Respaldo descargado — guárdalo en Drive');
}
function importarRespaldo(input) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const nuevo = JSON.parse(r.result);
      if (!nuevo.sucursales || !nuevo.productos) throw 0;
      if (!confirm('¿Reemplazar los datos actuales con este respaldo?')) return;
      db = nuevo; guardarDB(); renderTodo(); toast('✅ Respaldo restaurado');
    } catch (e) { toast('⚠️ Archivo no válido'); }
  };
  r.readAsText(f);
}
async function respaldarDrive() {
  toast('☁️ Enviando respaldo a Drive…');
  const j = await llamarBackend({ action: 'backup', db });
  toast(j && j.ok ? '☁️ Respaldo guardado en Drive ✅' : '⚠️ No se pudo respaldar (revisa conexión)');
}
function reiniciarDatos() {
  if (!confirm('⚠️ Esto borra TODO (turnos, cierres, inventarios) en esta tablet y regresa a datos de fábrica. ¿Continuar?')) return;
  if (!confirm('¿Seguro? Esta acción no se puede deshacer.')) return;
  db = seedDB(); guardarDB(false); renderTodo(); toast('♻️ Datos restablecidos');
}

/* ---------- reloj ---------- */
setInterval(() => {
  const r = $('reloj');
  if (r) r.textContent = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}, 1000);

/* ---------- arranque ---------- */
(function init() {
  // marca: fuente de títulos + logo desde assets.js
  if (window.CICLOPE_ASSETS) {
    const st = document.createElement('style');
    st.textContent = "@font-face{font-family:'SerifGothic';src:url(data:font/otf;base64," + CICLOPE_ASSETS.font + ") format('opentype');font-display:swap}";
    document.head.appendChild(st);
    const logo = 'data:image/png;base64,' + CICLOPE_ASSETS.logo;
    document.querySelectorAll('.logo-img').forEach(i => i.src = logo);
    $('logo-portada').src = logo;
    const fav = document.createElement('link'); fav.rel = 'icon';
    fav.href = 'data:image/png;base64,' + (CICLOPE_ASSETS.isotipo || CICLOPE_ASSETS.logo);
    document.head.appendChild(fav);
    const touch = document.createElement('link'); touch.rel = 'apple-touch-icon'; touch.href = fav.href;
    document.head.appendChild(touch);
  }
  initTema();
  cargarDB();
  ir('scr-portada');
  pintarRed();
  if (enLinea()) sync();
  setInterval(() => { if (enLinea()) sync(); }, 60000);
})();
