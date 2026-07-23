/* ═══════════════════════════════════════════════════════════════
   EL OJO MAESTRO · El Anillo del Cíclope
   Sistema de operaciones: asistencia, inventario, evidencias y cierres
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* versión visible: sirve para confirmar que un dispositivo ya trae lo último */
const VERSION = '2.5';

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
  ['Vaso plástico', 'Paquete', 251, 'EMP'], ['Tapa Plana', 'Pieza', 251, 'EMP'], ['Tapa domo', 'Pieza', 251, 'EMP'],
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
  ['Vaso Soufflé c/tapa', 'Pieza', 251, 'EMP'], ['Media Crema', 'Pieza', 2, 'POC'],
  ['Jarabe Tucán Mango', 'Pieza', 1, 'BEB'], ['Lechuga Italiana', 'Pieza', 1, 'COC'],
  ['Sal La Fina', ESCALA + ' bolsa', 251, 'COC'], ['Sal con Ajo', 'Pieza', 1, 'COC'],
  ['Popote estuchado', ESCALA + ' caja', 251, 'EMP'], ['Jalapeño', 'Pieza', 2, 'COC'],
  ['Limón pimienta', ESCALA + ' bote', 251, 'COC'], ['Papel Higiénico', 'Pieza (rollos)', 4, 'LIM'],
];
const CATS = { TODOS: '✨ Todos', COC: '🍳 Cocina', BEB: '🥤 Bebidas', POC: '🧪 Pociones y postres', EMP: '📦 Empaques', LIM: '🧽 Limpieza', GEN: '🔧 Generales' };
/* checklist de cierre histórico: hoy son las actividades del turno 2, pero los
   cierres viejos guardaron estos 5 puntos, así que se conserva para leerlos */
const CHECK_CIERRE = ['Limpieza de áreas completa', 'Equipos apagados', 'Basura fuera', 'Caja contada y registrada', 'Puertas y accesos cerrados'];
const totalCierre = c => (c && c.total) || CHECK_CIERRE.length;

/* ═══ ESTRUCTURA DEL CHECKLIST (hoja de estructura, julio 2026) ═══
   Sección 1 · CON EVIDENCIA: foto requerida al finalizar turno.
   Sección 2 · SIN EVIDENCIA: acciones a lo largo del día.
   Los dos primeros registros capturan el dinero del cierre. */
const REGISTROS = [
  { id: 'r-ventas', n: 'Ventas cierre', em: '💵', tipo: 'cierre', dinero: 'ventas', ph: 'Ventas netas $' },
  { id: 'r-caja', n: 'Caja de dinero', em: '🧾', tipo: 'cierre', dinero: 'caja', ph: 'Dinero en caja $' },
  { id: 'r-trastes', n: 'Trastes limpios', em: '🍽️', tipo: 'limpieza' },
  { id: 'r-mesas', n: 'Mesas preparadas', em: '🪑', tipo: 'limpieza' },
  { id: 'r-bano', n: 'Baño limpio', em: '🚻', tipo: 'limpieza' },
  { id: 'r-cocina', n: 'Cocina limpia y ordenada', em: '🍳', tipo: 'limpieza' },
];
/* dias: sin definir = diario · [0..6] días aplicables (0 = domingo) */
const ACCIONES = [
  { id: 'a-salsa-abismo', n: 'Preparación Salsa Abismo' },
  { id: 'a-masa-crepi', n: 'Preparación Masa Crepiburger' },
  { id: 'a-salsa-aliento', n: 'Preparación Salsa Aliento D' },
  { id: 'a-mamilas', n: 'Mamilas llenas' },
  { id: 'a-queso', n: 'Queso rallado' },
  { id: 'a-alitas', n: 'Alitas precongeladas' },
  { id: 'a-lechuga', n: 'Lechuga desinfectada' },
  { id: 'a-stickers', n: 'Empaque stickers' },
  { id: 'a-papel', n: 'Papel cortado' },
  { id: 'a-wa', n: 'Responder mensajes pendientes de WhatsApp' },
  { id: 'a-plataformas', n: 'Encendido de plataformas (DiDi, Uber, Rappi)' },
  { id: 'a-comedor', n: 'Comedor y pasillo trapeado' },
  { id: 'a-bano', n: 'Baño trapeado y abastecido' },
  { id: 'a-refri', n: 'Limpieza de refrigerador', dias: [2, 4, 6] },
  { id: 'a-freidoras', n: 'Limpieza de freidoras', dias: [1, 3, 5] },
  { id: 'a-congelador', n: 'Limpieza de congelador', dias: [0] },
];
const DIAS_SEM = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
function tareasDelDia(fechaISO) {
  const d = new Date((fechaISO || hoyISO()) + 'T12:00:00').getDay();
  return ACCIONES.filter(t => !t.dias || t.dias.includes(d));
}
function evidenciaDeRegistro(rid, fecha, sid) {
  fecha = fecha || hoyISO(); sid = sid || sucursalActual;
  return db.evidencias.find(e => e.regId === rid && e.fecha === fecha && e.sucursalId === sid);
}
/* ---------- candados contra registros duplicados ----------
   Un cierre, un turno y una evidencia llevan id DETERMINISTA (armado con la
   fecha, la sucursal y a quién pertenecen). Así, aunque la acción se dispare
   dos veces —doble toque, red lenta, dos dispositivos a la vez— siempre es el
   MISMO registro: al mezclar en el servidor se une por id en vez de duplicar.
   Era lo que infló las ventas del 22/07: cada toque creaba un cierre nuevo. */
const idCierre = (fecha, sid) => ['cie', fecha, sid].join('|');
const idTurno = (fecha, sid, pid) => ['tur', fecha, sid, pid].join('|');
const idEvid = (fecha, sid, rid) => ['ev', fecha, sid, rid].join('|');
const idRevision = (fecha, sid) => ['rev', fecha, sid].join('|');

/* Mientras una acción está en curso ignora los toques siguientes. El bug real
   era éste: guardarCierre esperaba a que subieran las fotos y, en esa espera,
   cada toque extra arrancaba otra ejecución que también pasaba la validación. */
const enCurso = {};
async function unaVez(clave, fn) {
  if (enCurso[clave]) return toast('⏳ Ya se está guardando, espera un momento…');
  enCurso[clave] = true;
  document.body.classList.add('ocupado');
  try { return await fn(); }
  finally { delete enCurso[clave]; document.body.classList.remove('ocupado'); }
}

const cierresVivos = () => db.cierres.filter(c => !c.del);
const cierreDelDia = (fecha, sid) => cierresVivos().find(c => c.fecha === (fecha || hoyISO()) && c.sucursalId === (sid || sucursalActual));

/* Las preparaciones se marcan como acciones del checklist; aquí solo se consulta
   el recetario (ver RECETAS más abajo). */
const tareaKey = (fecha, sid, tid) => ['tk', fecha, sid, tid].join('|');
function regTarea(tid, fecha, sid) { return db.tareas.find(x => x.id === tareaKey(fecha || hoyISO(), sid || sucursalActual, tid)); }
function tareaHecha(t, fecha, sid) {
  const r = regTarea(t.id, fecha || hoyISO(), sid || sucursalActual);
  return (r && r.done) ? r : null;
}
/* nota de periodicidad para las acciones que no son diarias */
function notaTarea(t) {
  if (!t.dias) return 'Todos los días';
  const d = t.dias.map(x => DIAS_SEM[x]);
  return 'Solo ' + (d.length > 1 ? d.slice(0, -1).join(', ') + ' y ' + d[d.length - 1] : d[0]);
}

/* Protocolos = Manual de Procedimientos de Sucursal v1.0 (marzo 2026).
   Mismo orden y secciones que el documento de Dirección. */
const PROTOCOLOS = [
  ['1. Apertura y cierre', [
    ['Responsable', 'Equipo operativo: abre y cierra la tienda, verifica estado general de la sucursal, revisa el fondo de caja y asegura que instalaciones y equipos queden apagados.'],
    ['Apertura (Turno 1)', 'Llegar 5 min antes · Luces de pasillo y comedor · TV con Spotify de la cuenta autorizada · Sacar material gráfico · Encender terminal, teléfono, computadora y tablet.'],
    ['Apertura · plataformas y orden', 'Activar DiDi, Uber Eats y Rappi · Responder WhatsApp pendiente · Verificar limpieza y orden (mesas, pisos, adornos, baño, insumos).'],
    ['Apertura · caja y equipos', 'Verificar que el fondo de caja autorizado de $350 esté completo · Confirmar que todos los equipos funcionen · Abrir en el horario establecido.'],
    ['Servicio antes del cierre', '8:15 pm primer aviso: preguntar si desean algo más porque va a cerrar cocina · 8:20 pm servicio solo para llevar · 8:30 pm segundo aviso y retirar platos muertos · Tercer aviso: no se permite abierto después de las 9:00 pm.'],
    ['Cierre (Turno 2)', 'Ingresar material gráfico 8:20 pm · Finalizar ventas en la tablet · Corte de caja · Verificar que el efectivo coincida con lo registrado · Limpieza de la sucursal.'],
    ['Cierre · equipos y salida', 'Verificar actualizaciones de inventario · Apagar equipos utilizados · Apagar iluminación · Notificar cualquier anomalía · Cerrar puerta.'],
    ['Horarios extra', 'Si se trabajan horarios extra se paga proporcionalmente el tiempo con base en el pago base del colaborador.'],
  ]],
  ['2. Seguridad y emergencias', [
    ['Prevención', 'Salidas despejadas · Verificar instalaciones eléctricas y de gas · Extintor y botiquín accesibles · Evitar pisos mojados, cables expuestos y aceite en el piso · Supervisar juegos y a los menores · Todo riesgo se corrige de inmediato.'],
    ['Accidente leve', 'Atender con botiquín · Notificar al encargado · Registrar el incidente.'],
    ['Incendio', 'Mantener la calma · Usar extintor solo si el fuego es controlable · Evacuar a los clientes · Llamar al 911 · Salir con calma y prontitud · Notificar a Dirección.'],
    ['Conflicto con cliente', 'Tono calmado y respetuoso · Escalar al encargado · Registrar en el Formato de incidentes · Priorizar la seguridad del equipo y del cliente.'],
    ['Fallas eléctricas', 'Confirmar fusibles · Confirmar con vecinos si es falla general · Desconectar equipos · Notificar a Dirección · Registrar la incidencia.'],
    ['Robo o intento de fraude', 'Notificar al encargado de inmediato · Observar y registrar comportamiento · No poner en riesgo al equipo · Registrar el incidente · La seguridad va antes que recuperar producto o dinero.'],
    ['Manejo de efectivo', 'Mantener el efectivo organizado · No contar dinero frente a clientes · Verificar pagos antes de entregar · Reportar diferencias de inmediato.'],
  ]],
  ['3. Atención al cliente', [
    ['Tiempos', 'Todo cliente debe ser atendido en máximo 5 segundos · Todo pedido debe ser escuchado, confirmado y registrado correctamente.'],
    ['Bienvenida', 'Recibir de inmediato · Saludar con entusiasmo y energía · Contacto visual · Invitar a tomar asiento · Ofrecer menú sonriendo · Preguntar si es su primera visita.'],
    ['Durante la estancia', 'Escuchar activamente · Resolver dudas del menú · Recomendar cuando haga falta · Actitud respetuosa y segura · Sin distracciones: nada de celular ni conversaciones internas.'],
    ['Seguimiento y entrega', 'Dar seguimiento al pedido · Informar tiempos de espera · Verificar que reciba lo correcto · Estar disponible sin ser invasivo · Confirmar que el pedido esté completo · Agradecer.'],
    ['Despedida', 'Despedir de forma cordial · Invitar a regresar · Mantener actitud positiva hasta que el cliente se retire.'],
    ['Incentivos', 'Verificar registro de compras · Confirmar que cumple la condición · Informar la cortesía · Registrar el incentivo · Agregar al ticket con el descuento que aplique.'],
    ['Quejas y situaciones difíciles', 'Escuchar sin interrumpir · Mantener calma y postura profesional · Validar la inconformidad · Ofrecer solución inmediata si está en tu alcance · Escalar al encargado · Registrar la incidencia.'],
    ['Mensajes y llamadas', 'Atender a la forma de escribir o hablar · Preguntas filtro (ubicación, anticipo) · A clientes nuevos pedir 50% de anticipo · Notificar a Dirección · Registrar la incidencia.'],
    ['Estándares de servicio', 'Actitud positiva constante · Comunicación clara · Rapidez · Presentación personal adecuada · Lenguaje respetuoso · Enfoque en la solución.'],
    ['Consideraciones', 'El cliente nunca debe sentirse ignorado · No discutir ni contradecir · Cada interacción representa a la marca · La experiencia importa tanto como el producto · El servicio no depende del estado de ánimo.'],
  ]],
  ['4. Experiencia de sucursal', [
    ['Ambientación', 'Activar música desde la cuenta autorizada · Verificar volumen adecuado · Encender y configurar la televisión · Mantener coherencia del ambiente durante todo el turno.'],
    ['Juegos y entretenimiento', 'Juegos limpios y en buen estado · Explicar su uso · Supervisar el uso adecuado · Cuidar la seguridad, sobre todo con niños · Recoger y ordenar después de usar.'],
    ['Supervisión de juegos', 'Detectar riesgo de lesión, daño al juego, molestia a otros clientes o uso inadecuado.'],
    ['Intervención · nivel 1', 'Explicar el uso correcto y pedir apoyo: "Estos juegos se usan así para evitar accidentes, ¿nos apoyan?"'],
    ['Intervención · nivel 2', 'Reforzar la indicación: "Lo comentamos antes, es para evitar riesgos. Gracias por apoyarnos."'],
    ['Intervención · nivel 3', 'Indicar la consecuencia: "Si no se respeta, tendremos que pausar el uso del juego."'],
    ['Restricciones', 'No discutir · No intervenir físicamente · No ignorar.'],
    ['Celebraciones', 'Detectar cumpleaños u ocasiones especiales · Notificar al equipo · Activar la dinámica (mañanitas, interacción) · Entregar el detalle correspondiente.'],
    ['Control durante operación', 'Ajustar la experiencia según el nivel de afluencia · Priorizar operación en alta demanda · Mantener equilibrio entre servicio y experiencia.'],
  ]],
  ['5. Toma de pedidos', [
    ['Procedimiento', 'Usar la tablet punto de venta · Escuchar con atención y amabilidad · Verificar existencias antes de ofrecer sabores o tamaños · Verificar sabores y solicitudes específicas.'],
    ['Registro', 'Preguntar nombre y apellido y registrarlo en la tablet · Confirmar el pedido en voz alta · Invitar a jugar los juegos de mesa · Recoger el menú y retirarse con amabilidad: "En un momento vuelvo con su orden".'],
    ['Cocina y tickets', 'Imprimir ticket y mandar a cocina · Si piden algo nuevo, actualizar el ticket de inmediato · Imprimir el nuevo y desechar el desactualizado.'],
    ['Cobro', 'Entregar ticket impreso en ataúd con dulce · Confirmar forma de pago · Realizar el cobro · Resguardar billetes de alta denominación.'],
    ['Facturación', 'Solicitar datos fiscales · Confirmar el uso de CFDI · Solicitar teléfono y correo · Notificar a Dirección para emitir la factura.'],
    ['Envíos a domicilio', 'Comunicar el precio de envío · Solicitar ubicación por Google Maps y foto de referencia · Confirmar disponibilidad en el grupo de repartidores · Compartir ubicación y contacto.'],
  ]],
  ['6. Limpieza y orden', [
    ['Durante el turno', 'Limpiar mesas después de cada cliente · Mantener piso seco · Ordenar el área de trabajo constantemente · Revisar el baño periódicamente.'],
    ['Antes del cierre', 'Barrer y trapear toda la sucursal · Limpiar superficies y equipos · Vaciar basura · Reponer insumos básicos · Dejar todo listo para el siguiente turno.'],
    ['Comedor', 'Mesas limpias y ordenadas · Todas con menú, servilletas y material promocional · Verificar iluminación y ventilación.'],
    ['Cocina', 'Lavarse las manos constantemente y usar gel · Limpieza de piso constante · Limpiar áreas y utensilios después de usarlos · Solo productos autorizados.'],
    ['Baño', 'Revisión constante · Limpieza de piso constante · Reponer papel, jabón y secador · Notificar cualquier falla de agua o luz.'],
    ['Curado de discos', 'Limpiar el disco · Precalentar a medio-bajo 3 min · Humedecer servitoalla en aceite y aplicar · Esperar 8-10 min y repetir de 3 a 5 veces · El humo y el color café son normales · No lavar después del curado.'],
  ]],
  ['7. Preparaciones', [
    ['Procedimiento', 'Lavarse las manos antes de iniciar · Verificar ingredientes y stock · Seguir receta y gramaje establecido · Mantener el área limpia durante la preparación.'],
    ['Calidad', 'Respetar tiempos de cocción · Montar el producto según el estándar visual · Verificar calidad antes de entregar · Entregar el pedido completo.'],
    ['Control', 'Cumplir con el checklist de preparación y control de cocina del turno (F-Cocina, en Formatos Operativos).'],
    ['Recetario', 'Consulta gramajes, aderezos y montaje de cada producto en la pestaña Recetario de la pantalla de Preparaciones.'],
  ]],
  ['8. Equipos y sistemas', [
    ['Encendido y verificación', 'Encender tablet, terminal y equipos de cocina · Verificar conexión a internet · Confirmar funcionamiento de plataformas · Revisar estado general de los equipos.'],
    ['Tablet (punto de venta)', 'Registrar pedidos correctamente · Confirmar información antes de enviar · Abrir nuevo turno diario · Imprimir ticket de orden para cocina · Cerrar siempre el turno al terminar.'],
    ['Tablet · cobros', 'Descontar el 4% al pagar con la terminal Mercado Pago · Descontar el 10% en pedidos de plataformas · Indicar correctamente la forma de pago · Reportar incidencias o falta de producto a Dirección.'],
    ['Plataformas digitales', 'Activar Rappi, Uber Eats y DiDi Food desde el perfil de Google del negocio · Activar al inicio del turno · Revisar pedidos constantemente y confirmarlos en tiempo · Dar seguimiento hasta la entrega.'],
    ['Plataformas · prioridad', 'Priorizar pedidos de plataformas sobre cualquier otro · Empaquetar correctamente (embolsar cajas y emplayar bebidas) · Mantener el volumen de la computadora al 100 para escuchar los avisos.'],
    ['Equipos de cocina', 'Operar únicamente equipos autorizados · Verificar temperatura y condiciones antes de usar · Mantener limpieza durante y después · Apagar correctamente al finalizar.'],
    ['Cierre y resguardo', 'Apagar todos los equipos · Desconectar si es necesario · Limpiar superficies · Reportar fallas o anomalías · Mantener la tablet siempre con batería y sin cargadores no autorizados.'],
  ]],
  ['9. Errores operativos', [
    ['Detección', 'Identificar el error (pedido, producto, tiempo, atención) · Confirmar la situación con el cliente o el equipo · No ignorar ni minimizar.'],
    ['Reconocimiento', 'Informar al cliente con claridad · Ofrecer una disculpa breve y profesional · No justificar ni culpar a terceros.'],
    ['Corrección inmediata', 'Determinar la solución adecuada · Priorizar la corrección sobre nuevos pedidos según la afluencia · Notificar a cocina o al área correspondiente · Dar seguimiento hasta resolver.'],
    ['Comunicación', 'Mantener informado al cliente · Indicar tiempo estimado de corrección · Confirmar su satisfacción al finalizar.'],
    ['Registro', 'Registrar el incidente en el formato correspondiente · Indicar tipo de error · Identificar la causa si es evidente · Reportar al encargado.'],
    ['Errores más comunes', 'Pedido mal tomado · Pedido incompleto · Producto incorrecto · Retraso en la entrega · Problema en la atención.'],
  ]],
  ['10. Evaluación operativa', [
    ['Método', 'Observación directa durante la operación · Registro de desempeño · Retroalimentación al finalizar turno o jornada · Definición de mejoras · Seguimiento continuo.'],
    ['Criterios', 'Atención al cliente · Rapidez · Orden y limpieza · Trabajo en equipo · Cumplimiento de procesos.'],
  ]],
  ['11. Incidencias y sanciones', [
    ['Incidencias operativas', 'Fallas de equipo · Errores en pedidos · Falta de insumos. Se registran en sucursal.'],
    ['Incidencias del equipo', 'Retardos · Inasistencias · Incumplimiento de procesos · Conducta inapropiada. Las registra Dirección.'],
    ['Niveles de incidencia', 'Leve · Media · Grave.'],
    ['Criterios de sanción', 'Se aplica sanción cuando hay reincidencia, la falta es grave, existe negligencia o se afecta la operación.'],
    ['Sanción nivel 1', 'Llamada de atención.'],
    ['Sanción nivel 2', 'Llamada de atención + pérdida de beneficios.'],
    ['Sanción nivel 3', 'Suspensión, descuento o baja.'],
  ]],
  ['12. Auditoría de sucursales', [
    ['Preparación', 'Definir fecha y tipo (programada o sorpresa) · Contar con los formatos de evaluación · Revisar auditorías anteriores · Establecer el enfoque (general o específico).'],
    ['Inicio', 'Llegar sin interrumpir la operación · Observar el estado general (orden, limpieza, ambiente) · Evaluar sin intervenir al principio.'],
    ['Qué se evalúa', 'Apertura · Atención al cliente (tiempo, saludo, claridad, actitud) · Preparación de alimentos (recetas, orden, tiempos) · Entrega (exactitud, presentación, tiempo) · Equipos y sistemas · Limpieza · Ambientación · Protocolos.'],
    ['Evaluación del personal', 'Presentación personal · Actitud y disposición · Trabajo en equipo · Cumplimiento de funciones.'],
    ['Registro y cierre', 'Completar el formato de auditoría · Asignar calificaciones por área · Identificar desviaciones · Registrar evidencias.'],
    ['Retroalimentación', 'Comunicar resultados al equipo o encargado · Señalar aciertos y áreas de mejora · Establecer acciones correctivas con responsables y tiempos.'],
    ['Seguimiento', 'Verificar cumplimiento de mejoras · Programar nueva auditoría · Comparar resultados con auditorías anteriores.'],
  ]],
];

/* Recetario — hoja de recetas de Dirección (gramajes y montaje) */
const RECETAS = [
  ['Entradas y snacks', [
    ['Papas Muertas', 'Papa recta 250 g · 1 catsup y queso · Extra: limón pimienta.'],
    ['Papas Enigma', 'Papa curly 250 g · 1 catsup y queso · Extra: limón pimienta.'],
    ['Papas Colmillo', 'Papa gajo hot 250 g · Buffalo y limón pimienta.'],
    ['Papas Abismo', 'Papas de la casa 250 g · Salsa quesos · Extra: tocino ahumado.'],
    ['Dedos Cíclope', 'Orden de 5 dedos de queso · 1 catsup.'],
  ]],
  ['Alimentos y paquetes', [
    ['7 Cerebros', '7 boneless (220 g) · 1 ranch · 1 espada · 1 salsa · Dip +$10.'],
    ['14 Cerebros', '14 boneless (440 g) · 2 ranch · 2 espadas · 2 salsas · Dip +$10.'],
    ['1/2 kg Cerebros', '440 g boneless · 2 ranch · 2 espadas · 2 salsas · Dip +$10.'],
    ['1 kg Cerebros', '900 g boneless · 3 ranch · 3 espadas · 3 salsas · Dip +$10.'],
    ['Paquete Cerebritos', 'Mini boneless 100 g · Papa recta 125 g · 1 catsup y queso · 2 dedos · 1 espada · 1 salsa · Cambio de papas +$15.'],
    ['Paquete Cíclope', 'Boneless 220 g · Papa recta 135 g · 1 catsup y queso · 1 espada · 1 salsa · 1 bebida · Cambio de papas +$15.'],
    ['Paquete Aquelarre', '1 kg boneless (900 g) · Mix 125 g gajo + 125 g curly · 1 catsup y queso + 2 ranch · 3 dedos · 3 bebidas.'],
    ['Paquete Volcaneitor', 'Hot dog 50 g · Papa recta 80 g · Salsa volcánica · Brebaje · 1 salsa.'],
    ['Paquete Espanto', 'Crepiburger (80 g si es Zombie) · Papa recta 81 g · Salsa volcánica · Brebaje · 2 salsas.'],
    ['Crepiburger Zombie', 'Boneless 80 g · Papa recta 80 g · 1 catsup · 1 salsa.'],
    ['Crepiburger Minotauro', '1 arrachera · Papa recta 80 g · 1 catsup · BBQ o catsup dentro.'],
    ['Crepiburger Dragón', '1 pollo · Papa recta 80 g · 1 catsup · BBQ o catsup dentro.'],
    ['Volcanino', 'Hot dog 40 g · Papa recta 80 g · Salsa volcánica · 1 salsa.'],
  ]],
  ['Promociones', [
    ['Lunes y miércoles', '14 boneless (420 g) · Papa recta 180 g · 1 catsup y queso + 2 ranch · 2 salsas · 2 bebidas.'],
    ['Martes', 'Crepiburger · Papa recta 80 g · 1 bebida.'],
    ['Jueves y sábado', '1 kg boneless (900 g) · 3 ranch · 3 espadas · 2 salsas · Dip +$10.'],
    ['Viernes', '2 pociones · Cambio a poción especial disponible.'],
    ['Domingo', '7 boneless (220 g) · 1 ranch · Brebaje · 1 salsa · Dip +$10.'],
  ]],
  ['Pociones (malteadas)', [
    ['Baba de Ogro', 'Vainilla · 4 bolas · 4 oz leche evaporada · 2 hielos · 1 chorrito vainilla · Adorno: chocolate líquido.'],
    ['Materia Gris', 'Vainilla · 4 bolas · 4 oz leche evaporada · 2 hielos · 4 cdas ch de oreo · Adorno: oreo espolvoreado.'],
    ['Sangre de Hada', 'Fresa · 4 bolas · 4 oz leche evaporada · 2 hielos · 1 cda ch de mermelada · Adorno: brillantina roja.'],
    ['Lodo del Pantano', 'Chocolate · 4 bolas · 4 oz leche evaporada · 2 hielos · 1 cda de cocoa · Adorno: chocolate líquido.'],
    ['Abducción', 'Chocomenta · 4 bolas · 4 oz leche evaporada · 2 hielos · 5 chocoretas · 8 gotas de colorante verde · Adorno: chocolate líquido.'],
    ['Sirena Cósmica', 'Vainilla · 4 bolas · 4 oz leche evaporada · 2 hielos · 1 cda G de avellanas · 8 gotas de colorante verde · Adorno: brillantina azul.'],
    ['Gansito Hechizado', 'Fresa y chocolate (3 y 1) · 4 oz leche evaporada · 2 hielos · 3/4 gansito molido · 1 cda ch de fresa · Adorno: 1/4 de gansito.'],
    ['Mazaurio', 'Vainilla · 4 bolas · 4 oz leche evaporada · 2 hielos · Mazapán molido · Adorno: resto de mazapán y huesito.'],
  ]],
  ['Brebajes', [
    ['Draculín', 'Agua 8 oz (marca en vaso) · 2 hielos (vaso al congelador) · Jarabe frutos rojos 1 1/2 · Megalimón 1 oz · 2 huesitos.'],
    ['Troll', 'Agua 8 oz · 2 hielos (vaso al congelador) · Jarabe mora azul 1 1/2 · Megalimón 1 oz · 2 huesitos.'],
    ['Medusín', 'Agua 8 oz · 2 hielos (vaso al congelador) · Jarabe manzana verde 1 1/2 oz · Megalimón 3/4 oz · 2 huesitos.'],
    ['Yeti', '4 oz leche evaporada · 4 oz lechera · 3 hielos (vaso al congelador) · 1 cdta harina de arroz y 1 cdta canela · Mezclar en mixer · 2 huesitos.'],
  ]],
];

/* ---------- base de datos ---------- */
const DB_KEY = 'ojo_maestro_db_v2';
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
let db = null;
let sucursalActual = null;   // id de sucursal activa en esta tablet
let esAdmin = false;
let tabDir = 'hoy';

function seedDB() {
  const s1 = 'suc-revolucion', s2 = 'suc-tulipanes';
  // ids deterministas: todas las instalaciones comparten los mismos, así la
  // sincronización une registros en lugar de duplicarlos
  const prods = SEED_PRODUCTOS.map(p => ({ id: 'p-' + slug(p[0]), nombre: p[0], unidad: p[1], minimo: p[2], cat: p[3], t: 0 }));
  const stock = {}; [s1, s2].forEach(s => { stock[s] = {}; prods.forEach(p => stock[s][p.id] = { c: 0, t: 0 }); });
  return {
    v: 2, ts: Date.now(), catTs: 0, configTs: {},
    config: {
      adminPin: '2626', supervisorPin: '4040', scriptUrl: '', emailTo: 'elanillodelciclope@gmail.com',
      whatsapp: '527711232884', baseHoras: 6, nombreNegocio: 'El Anillo del Cíclope'
    },
    sucursales: [
      { id: s1, nombre: 'Revolución', direccion: 'Emilio Asiain 119, Revolución, Pachuca', activa: true, t: 0 },
      { id: s2, nombre: 'Tulipanes', direccion: 'Av. de los Árboles 147, Los Pinos, Pachuca', activa: true, t: 0 },
    ],
    personal: [
      { id: 'per-anex', nombre: 'Añex', color: '#FFD523', pagoTurno: 300, pagoHora: 50, activo: true, t: 0 },
      { id: 'per-ambre', nombre: 'Ambré', color: '#3131D8', pagoTurno: 300, pagoHora: 50, activo: true, t: 0 },
      { id: 'per-alex', nombre: 'Alex', color: '#73E8E8', pagoTurno: 300, pagoHora: 50, activo: true, t: 0 },
      { id: 'per-mori', nombre: 'Mori', color: '#D83153', pagoTurno: 300, pagoHora: 50, activo: true, t: 0 },
      { id: 'per-jaz', nombre: 'Jaz', color: '#31D831', pagoTurno: 300, pagoHora: 50, activo: true, t: 0 },
    ],
    productos: prods, stock,
    turnos: [], checklists: [], cierres: [], evidencias: [], eventos: [], propinas: [], tareas: [], revisiones: [], preparaciones: [],
    calendario: [],
  };
}
/* productos que se cuentan por pieza desde v1.5 (antes iban por paquete) */
const A_PIEZA = ['Tapa Plana', 'Tapa domo', 'Vaso Soufflé c/tapa'];
function migrarDB() {
  // agrega estructuras/productos nuevos a instalaciones existentes
  if (!db.propinas) db.propinas = [];
  if (!db.tareas) db.tareas = [];
  if (!db.revisiones) db.revisiones = [];
  if (!db.preparaciones) db.preparaciones = [];
  if (!db.calendario) db.calendario = [];
  // v1.3: el personal ya no usa PIN; se borra el dato viejo de instalaciones previas.
  // No se toca catTs a propósito: es limpieza, no una edición de catálogo.
  let limpio = false;
  db.personal.forEach(p => { if (p.pin !== undefined) { delete p.pin; limpio = true; } });
  /* v1.5: tapas, domos y vaso soufflé se cuentan por PIEZA, no por paquete.
     Se sube la marca t de cada producto para que el cambio gane en el merge
     (los productos se mezclan registro por registro por su propia t). */
  db.productos.forEach(p => {
    if (A_PIEZA.includes(p.nombre) && p.unidad !== 'Pieza') {
      p.unidad = 'Pieza'; p.t = Date.now(); limpio = true;
    }
  });
  /* v1.9: cada colaborador lleva su color, para no depender de un cálculo que
     podía dar dos verdes parecidos a dos personas del mismo calendario */
  const usados = new Set(db.personal.filter(p => !p.del && p.color).map(p => p.color));
  db.personal.filter(p => !p.del && !p.color).sort((a, b) => a.id.localeCompare(b.id)).forEach(p => {
    const libre = PALETA_PERSONAS.find(c => !usados.has(c)) || PALETA_PERSONAS[usados.size % PALETA_PERSONAS.length];
    p.color = libre; usados.add(libre); p.t = Date.now(); limpio = true;
  });
  if (!db.config.supervisorPin) db.config.supervisorPin = '4040';
  if (!db.configTs) db.configTs = {};
  if (db.catTs === undefined) db.catTs = 0;
  const nombres = new Set(db.productos.map(p => p.nombre));
  SEED_PRODUCTOS.forEach(sp => {
    if (!nombres.has(sp[0])) {
      const np = { id: 'p-' + slug(sp[0]), nombre: sp[0], unidad: sp[1], minimo: sp[2], cat: sp[3], t: 0 };
      db.productos.push(np);
      db.sucursales.forEach(s => { if (!db.stock[s.id]) db.stock[s.id] = {}; db.stock[s.id][np.id] = { c: 0, t: 0 }; });
    }
  });
  return limpio;   // hubo que borrar PINs: conviene persistir la limpieza
}
/* ---------- la conexión del dispositivo, a prueba de actualizaciones ----------
   La URL del backend y los PINs viven en su PROPIA llave de localStorage,
   aparte de la base. Si la base se pierde, se corrompe o se vuelve a sembrar,
   el dispositivo sigue sabiendo a dónde conectarse y no regresa a modo local. */
const CFG_KEY = 'ojo_cfg_dispositivo';
let cfgFirma = '';
function recordarConfig() {
  const c = db.config || {};
  if (!c.scriptUrl) return;                     // nada que recordar todavía
  const guardar = {
    scriptUrl: c.scriptUrl, adminPin: c.adminPin, supervisorPin: c.supervisorPin,
    emailTo: c.emailTo, whatsapp: c.whatsapp, baseHoras: c.baseHoras, ts: Date.now()
  };
  const firma = JSON.stringify(guardar).replace(/"ts":\d+/, '');
  if (firma === cfgFirma) return;               // sin cambios: no reescribir
  cfgFirma = firma;
  try { localStorage.setItem(CFG_KEY, JSON.stringify(guardar)); } catch (e) { }
}
function recuperarConfig() {
  let g; try { g = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch (e) { }
  if (!g || !g.scriptUrl) return false;
  const c = db.config, seed = seedDB().config;
  let rescate = false;
  if (!c.scriptUrl) { c.scriptUrl = g.scriptUrl; rescate = true; }
  // los demás campos solo se reponen si la base quedó con los valores de fábrica
  ['adminPin', 'supervisorPin', 'emailTo', 'whatsapp', 'baseHoras'].forEach(k => {
    if (g[k] !== undefined && c[k] === seed[k] && g[k] !== seed[k]) {
      c[k] = g[k];
      db.configTs[k] = Math.max(db.configTs[k] || 0, g.ts || 0);
      rescate = true;
    }
  });
  return rescate;
}
/* ---------- mantenimiento diario ----------
   Corre al abrir la app. La idea es que ningún olvido de ayer se arrastre ni
   quede a merced de que alguien se acuerde de cerrar algo a mano. */
function mantenimientoDiario() {
  const hoy = hoyISO();
  // una vez al día basta: si no, cada apertura repetiría los avisos en bitácora
  if (db.mantDia === hoy) return { cambios: false, cerrados: 0, quitados: 0, dudosos: 0 };
  db.mantDia = hoy;
  let cambios = true, cerrados = 0;
  /* 1) Turnos de días anteriores que quedaron sin salida: se cierran solos con
     las horas base del turno y quedan marcados, para que Nómina no arrastre
     turnos abiertos eternamente ni haya que cerrarlos a mano. */
  db.turnos.forEach(t => {
    if (t.salida || t.fecha >= hoy || !per(t.personalId)) return;
    t.salida = t.entrada + (db.config.baseHoras || 6) * 3600000;
    t.ajuste = Number(t.ajuste || 0);
    t.autoCierre = true;
    t.motivoAjuste = (t.motivoAjuste ? t.motivoAjuste + ' · ' : '') + 'Cierre automático (no se registró la salida)';
    const c = calcularPago(t); t.horas = c.horas; t.pago = c.pago; t.ts = Date.now();
    cerrados++; cambios = true;
  });
  if (cerrados) {
    db.eventos.unshift({
      id: uid(), ts: Date.now(), asunto: '🕐 Cierre automático de turnos',
      cuerpo: 'Se cerraron solos ' + cerrados + ' turno(s) de días anteriores que quedaron sin salida. ' +
        'Revísalos en Dirección → Nómina por si hay que ajustar la hora.'
    });
  }
  /* 2) Cierres duplicados del mismo día y sucursal. Solo se consolidan los que
     traen EXACTAMENTE los mismos montos (son el rastro del doble toque); si
     los montos difieren se dejan tal cual, porque ahí sí hay que decidir. */
  const porDia = {};
  cierresVivos().forEach(c => {
    const k = c.fecha + '|' + c.sucursalId;
    (porDia[k] = porDia[k] || []).push(c);
  });
  let quitados = 0, dudosos = 0;
  Object.keys(porDia).forEach(k => {
    const lista = porDia[k];
    if (lista.length < 2) return;
    const montos = new Set(lista.map(c => c.ventas + '|' + c.caja));
    if (montos.size > 1) { dudosos++; return; }        // montos distintos: no se toca
    lista.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const fijo = idCierre(lista[0].fecha, lista[0].sucursalId);
    const queda = lista.find(c => c.id === fijo) || lista[0];
    lista.forEach(c => { if (c !== queda) { c.del = true; c.ts = Date.now(); quitados++; } });
    cambios = true;
  });
  if (quitados) {
    db.eventos.unshift({
      id: uid(), ts: Date.now(), asunto: '🧹 Se consolidaron cierres duplicados',
      cuerpo: 'Se quitaron ' + quitados + ' cierre(s) repetidos con montos idénticos, dejando uno por día y ' +
        'sucursal. Venían del error de doble envío; las ventas del mes ya quedan correctas.'
    });
  }
  if (dudosos) {
    db.eventos.unshift({
      id: uid(), ts: Date.now(), asunto: '⚠️ Cierres repetidos con montos distintos',
      cuerpo: dudosos + ' día(s) tienen más de un cierre con montos diferentes. No se tocaron: ' +
        'revísalos en Dirección → Cierre de mes y deja el correcto.'
    });
  }
  return { cambios, cerrados, quitados, dudosos };
}
function cargarDB() {
  let cargada = false;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) { db = JSON.parse(raw); cargada = true; }
  } catch (e) { }
  if (!cargada) db = seedDB();
  const migro = cargada ? migrarDB() : false;
  const rescato = recuperarConfig();
  if (rescato) toast('🔌 Conexión del dispositivo recuperada');
  const m = cargada ? mantenimientoDiario() : { cambios: false };
  if (!cargada || migro || rescato || m.cambios) guardarDB(false);
  if (m.quitados) toast('🧹 Se consolidaron ' + m.quitados + ' cierres duplicados', 5000);
  if (m.cerrados) toast('🕐 Se cerraron solos ' + m.cerrados + ' turno(s) de días pasados', 5000);
  recordarConfig();
}
function tocarCatalogos() { db.catTs = Date.now(); }
function guardarDB(sincronizar = true) {
  db.ts = Date.now();
  dbRev++;                          // marca de "aquí hubo un cambio local"
  recordarConfig();                 // la conexión queda respaldada aparte
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
/* dbRev sube con CADA guardado local. Sirve para saber si alguien capturó
   algo mientras el servidor estaba respondiendo un sync. */
let syncTimer = null, syncEnCurso = false, syncPendiente = false, dbRev = 0;
/* Payload ligero: las fotos locales (data:) NO viajan en el sync — pesan
   cientos de KB y hacían lenta la app. Las fotos en línea ya viven en Drive
   como URL; las locales se conservan en este dispositivo y se re-adjuntan
   al recibir la respuesta. */
function dbParaSync() {
  const copia = JSON.parse(JSON.stringify(db));
  ['evidencias', 'checklists', 'cierres'].forEach(k =>
    (copia[k] || []).forEach(x => { if (x.foto && x.foto.startsWith('data:')) x.foto = ''; }));
  (copia.productos || []).forEach(p => { if (p.foto && p.foto.startsWith('data:')) p.foto = ''; });
  copia.eventos = (copia.eventos || []).slice(0, 120);
  return copia;
}
function reAdjuntarFotosLocales(anterior) {
  ['evidencias', 'checklists', 'cierres'].forEach(k => {
    const mapa = {};
    (anterior[k] || []).forEach(x => { if (x.foto && x.foto.startsWith('data:')) mapa[x.id] = x.foto; });
    (db[k] || []).forEach(x => { if (!x.foto && mapa[x.id]) x.foto = mapa[x.id]; });
  });
  const mapaP = {};
  (anterior.productos || []).forEach(p => { if (p.foto && p.foto.startsWith('data:')) mapaP[p.id] = p.foto; });
  (db.productos || []).forEach(p => { if (!p.foto && mapaP[p.id]) p.foto = mapaP[p.id]; });
}
const escribiendo = () => ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
const enLinea = () => !!(db && db.config.scriptUrl);
function pintarRed() {
  const on = enLinea();
  [['chip-red', 'chip-red-tx'], ['chip-red-dir', 'chip-red-dir-tx']].forEach(([c, t]) => {
    const chip = $(c); if (!chip) return;
    chip.classList.toggle('on', on); chip.classList.toggle('off', !on);
    $(t).textContent = on ? 'en línea' : 'modo local';
  });
  /* en modo local el aviso es accionable: reconectar sin entrar a Dirección */
  const av = $('portada-aviso');
  if (av) {
    av.style.display = on ? 'none' : 'block';
    if (!on) av.innerHTML = '<div class="card amarilla" style="margin:18px auto 0;max-width:420px;text-align:left">' +
      '<b class="amar">⚠️ Este dispositivo está en modo local</b>' +
      '<p class="mini muted" style="margin:6px 0 10px">Lo que se capture aquí no llega a los demás. ' +
      'Conéctalo una vez y ya no se vuelve a perder.</p>' +
      '<button class="btn p" onclick="conectarDispositivo()">🔌 Conectar a la nube</button></div>';
  }
  const pe = $('portada-estado');
  if (pe) pe.innerHTML = on ? '🟢 Conectado a la nube Cíclope — datos sincronizados entre dispositivos'
    : '🟡 Modo local (solo esta tablet). Conecta el backend en Dirección → Administrar para sincronizar, notificar por correo y respaldar en Drive.';
}
function syncPronto() { syncPendiente = true; clearTimeout(syncTimer); syncTimer = setTimeout(sync, 1500); }
async function sync(silencioso = true) {
  if (!enLinea() || syncEnCurso) return;
  syncEnCurso = true; syncPendiente = false;
  const revEnviada = dbRev;      // qué versión de los datos salió al servidor
  try {
    const r = await fetch(db.config.scriptUrl, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'sync', db: dbParaSync() })
    });
    const j = await r.json();
    if (j && j.ok && j.db) {
      /* ⚠️ Si alguien capturó algo MIENTRAS el servidor respondía, esa
         respuesta se calculó sin ese cambio: aplicarla lo borraría. Era el
         bug de las cantidades de inventario (y los turnos del calendario)
         que se regresaban solas al cambiar de pantalla. En ese caso se
         descarta la respuesta y se vuelve a subir enseguida — nunca al
         revés: primero manda lo que capturó la persona. */
      if (dbRev !== revEnviada) {
        syncPendiente = true;
        clearTimeout(syncTimer); syncTimer = setTimeout(sync, 800);
      } else {
        const anterior = db;
        const local = db.config.scriptUrl;         // nunca perder la URL local
        db = j.db; db.config.scriptUrl = local;
        reAdjuntarFotosLocales(anterior);
        recordarConfig();
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        // no repintar mientras alguien está capturando: se aplicará al navegar
        if (!escribiendo()) renderTodo();
        if (!silencioso) toast('🔄 Sincronizado con la nube Cíclope');
      }
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
/* Qué se avisa por CORREO. Solo los 4 hitos del día: las fotos y evidencias
   ya no mandan correo — quedan en la bitácora y se revisan en Supervisión y
   Dirección. Para volver a activar alguno, pon su valor en true. */
const NOTIFICAR_CORREO = {
  entrada: true, salida: true, cierre: true, inventario: true, revision: true,
  evidencia: false, observacion: false
};
function notificar(asunto, cuerpo, tipo) {
  // todo queda SIEMPRE en la bitácora local y en la hoja de registros
  db.eventos.unshift({ id: uid(), ts: Date.now(), asunto, cuerpo });
  db.eventos = db.eventos.slice(0, 400);
  // el correo solo sale para los eventos habilitados arriba
  if (tipo && !NOTIFICAR_CORREO[tipo]) return;
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
function faltantes(sid) { return db.productos.filter(p => !p.del && estadoStock(sid, p) !== 'ok'); }
function prodFoto(p) { return p.foto || (window.CICLOPE_FOTOS && CICLOPE_FOTOS[p.nombre]) || ''; }
function miniProd(p, lado = 46) {
  const f = prodFoto(p);
  return f ? '<img src="' + f + '" style="width:' + lado + 'px;height:' + lado + 'px;object-fit:cover;border-radius:10px;background:#fff;flex-shrink:0" loading="lazy">'
    : '<div style="width:' + lado + 'px;height:' + lado + 'px;border-radius:10px;background:var(--fondo-4);display:flex;align-items:center;justify-content:center;flex-shrink:0">📦</div>';
}
function turnoSugerido() { return new Date().getHours() < 14 ? 'matutino' : 'vespertino'; }
/* Pago POR DÍA: entrada + cierre = un turno completo, sin prorrateo por minutos
   sueltos. Los minutos de más o de menos se capturan en bloques de 20 min
   (t.ajuste = número de bloques, positivo o negativo). */
const BLOQUE_MIN = 20;
const tarifaBloque = p => (p.pagoHora || 0) * BLOQUE_MIN / 60;
function calcularPago(t) {
  const p = per(t.personalId);
  if (!p || !t.salida) return { horas: 0, pago: 0, extra: 0, bloques: 0, min: 0 };
  const horas = (t.salida - t.entrada) / 36e5;
  const bloques = Number(t.ajuste || 0);
  const extra = bloques * tarifaBloque(p);
  const pago = Math.max(0, (p.pagoTurno || 0) + extra);
  const r = n => Math.round(n * 100) / 100;
  return { horas: r(horas), pago: r(pago), extra: r(extra), bloques, min: bloques * BLOQUE_MIN };
}
function txtAjuste(bloques) {
  const b = Number(bloques || 0);
  if (!b) return 'Turno completo';
  const min = Math.abs(b) * BLOQUE_MIN, h = Math.floor(min / 60), m = min % 60;
  const dur = ((h ? h + ' h ' : '') + (m ? m + ' min' : '')).trim();
  return (b > 0 ? '+ ' : '− ') + dur;
}
function opcionesPersonal(sel, soloEnTurno) {
  const lista = soloEnTurno
    ? turnosAbiertos(sucursalActual).map(t => per(t.personalId)).filter(Boolean)
    : db.personal.filter(p => p.activo && !p.del);
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
  if (id === 'scr-asis') renderAsistencia();
  if (id === 'scr-prep') renderPreparaciones();
  if (id === 'scr-proto') renderProtocolos();
  if (id === 'scr-cal') renderCalendario();
  if (id === 'scr-dir') renderDireccion();
}
/* menú del título: saltar entre sucursales y paneles sin volver al inicio */
function menuNavegacion() {
  const otras = db.sucursales.filter(s => s.activa && !s.del);
  abrirModal('<h3>🧭 Ir a…</h3>' +
    otras.map(s => '<button class="btn ' + (s.id === sucursalActual ? 'p' : 's') + '" style="margin-bottom:10px" ' +
      'onclick="cerrarModal();entrarSucursal(\'' + s.id + '\')">🏬 ' + esc(s.nombre) +
      (s.id === sucursalActual ? ' · aquí estás' : '') + '</button>').join('') +
    '<div class="sep"></div>' +
    '<button class="btn s" style="margin-bottom:10px" onclick="cerrarModal();irCalendario()">📅 Calendario</button>' +
    '<button class="btn s" style="margin-bottom:10px" onclick="cerrarModal();pedirPinSupervision()">🔍 Supervisión</button>' +
    '<button class="btn s" style="margin-bottom:10px" onclick="cerrarModal();pedirPinAdmin()">👁️ Dirección</button>' +
    '<button class="btn s" onclick="cerrarModal();salirASucursales()">🏠 Pantalla de inicio</button>');
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

/* trae la última versión publicada aunque el caché tenga una anterior.
   La configuración NO se toca: vive en su propia llave (CFG_KEY). */
async function forzarActualizacion() {
  toast('🔄 Buscando la última versión…');
  try {
    if ('caches' in window) {
      const ks = await caches.keys();
      await Promise.all(ks.map(k => caches.delete(k)));
    }
    if (navigator.serviceWorker) {
      const rs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(rs.map(r => r.update().catch(() => { })));
    }
  } catch (e) { }
  location.reload();
}

/* reconectar el dispositivo sin tener que entrar a Dirección */
function conectarDispositivo() {
  let g; try { g = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch (e) { }
  abrirModal('<h3>🔌 Conectar este dispositivo</h3>' +
    (g && g.scriptUrl
      ? '<p class="mini muted">Este dispositivo ya estuvo conectado antes. Puedes reponer esa conexión de un toque:</p>' +
      '<button class="btn p" style="margin-bottom:12px" onclick="usarConexionGuardada()">↩️ Reponer la conexión anterior</button><div class="sep"></div>'
      : '') +
    '<p class="mini muted">Pega la URL del backend (la que termina en <b>/exec</b>). La encuentras en cualquier ' +
    'dispositivo ya conectado, en Dirección → ⚙️ Administrar → 🔗 Enlace de instalación.</p>' +
    '<input id="conn-url" placeholder="https://script.google.com/macros/s/…/exec">' +
    '<button class="btn p" style="margin-top:12px" onclick="guardarConexion()">💾 Conectar</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="cerrarModal()">Cancelar</button>');
}
function usarConexionGuardada() {
  if (!recuperarConfig()) return toast('No hay una conexión guardada en este dispositivo');
  guardarDB(false); cerrarModal(); pintarRed();
  toast('🔌 Conexión repuesta'); if (enLinea()) sync(false);
}
function guardarConexion() {
  const u = $('conn-url').value.trim();
  if (!/^https:\/\/script\.google\.com\/macros\/.+\/exec$/.test(u))
    return toast('La URL debe empezar con https://script.google.com/macros/ y terminar en /exec');
  db.config.scriptUrl = u;
  guardarDB(false); cerrarModal(); pintarRed();
  toast('🔌 Dispositivo conectado'); sync(false);
}

/* ═══════════ PORTADA ═══════════ */
function renderPortada() {
  $('portada-sucursales').innerHTML = db.sucursales.filter(s => s.activa && !s.del).map(s =>
    '<button class="btn p gigante" style="margin-bottom:12px" onclick="entrarSucursal(\'' + s.id + '\')">' +
    '<span class="ico">🏬</span> Sucursal ' + esc(s.nombre) + '</button>').join('');
  /* versión y actualización a la vista de cualquiera: así no hay que ir tablet
     por tablet entrando a Dirección con el PIN solo para actualizar */
  const v = $('portada-version');
  if (v) v.innerHTML = 'Versión <b class="amar">' + VERSION + '</b> · ' +
    '<a href="#" onclick="event.preventDefault();forzarActualizacion()">🔄 Buscar actualización</a>';
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
      return '<div class="item-linea">' + avatarPersona(t.personalId, p?.nombre) +
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
function avanceDia(fecha, sid) {
  const lista = tareasDelDia(fecha);
  const pendientes = lista.filter(t => !tareaHecha(t, fecha, sid));
  const regHechos = REGISTROS.filter(r => registroListo(r, fecha, sid)).length;
  return {
    total: lista.length, hechas: lista.length - pendientes.length, pendientes,
    regTotal: REGISTROS.length, regHechos,
    pct: (lista.length + REGISTROS.length)
      ? Math.round((lista.length - pendientes.length + regHechos) / (lista.length + REGISTROS.length) * 100) : 0
  };
}
function renderAvance() {
  const hoy = hoyISO();
  const a = avanceDia(hoy, sucursalActual);
  const cierreHoy = cierreDelDia(hoy, sucursalActual);
  const rev = db.revisiones.find(r => r.sucursalId === sucursalActual);
  const pendTxt = a.pendientes.slice(0, 3).map(t => t.n.split('(')[0].trim()).join(' · ');
  const fila = (icono, nombre, valor, ok) =>
    '<div class="avance-item"><span>' + icono + '</span><span>' + nombre + '</span><span class="pct" style="' +
    (ok === true ? 'color:var(--ok)' : ok === false ? 'color:var(--alerta)' : '') + '">' + valor + '</span></div>';
  $('suc-avance').innerHTML =
    '<h3 style="margin-bottom:4px">🚀 Avance de hoy — ¿qué falta?</h3>' +
    fila('📸', 'Registros con evidencia', a.regHechos + '/' + a.regTotal, a.regHechos === a.regTotal) +
    fila('✅', 'Acciones del día', a.hechas + '/' + a.total, a.hechas === a.total) +
    fila('🌙', 'Cierre del día', cierreHoy ? '✅ ' + fmt$(cierreHoy.ventas) : 'pendiente', !!cierreHoy || null) +
    (rev ? fila('🔍', 'Última revisión (' + fmtFecha(rev.fecha) + ')',
      rev.veredicto === 'cumplido' ? '✅ ' + rev.pct + '%' : rev.veredicto === 'ajustes' ? '⚠️ ' + rev.pct + '%' : '⛔ ' + rev.pct + '%',
      rev.veredicto === 'cumplido' ? true : rev.veredicto === 'nocumplido' ? false : null) : '') +
    (pendTxt ? '<p class="mini" style="margin:8px 0 0;color:var(--aviso)">⏳ Falta: ' + esc(pendTxt) + '</p>'
      : '<p class="mini" style="margin:8px 0 0;color:var(--ok)">✨ Acciones del día al corriente. ¡Gran trabajo, Cíclope!</p>');
}

/* ═══════════ ASISTENCIA (entrada y salida en un solo botón) ═══════════ */
let asisAjuste = 0;
function irAsistencia() {
  opcionesPersonal($('asis-persona'), false);
  const abierto = turnosAbiertos(sucursalActual)[0];
  if (abierto) $('asis-persona').value = abierto.personalId;
  $('asis-resumen').innerHTML = '';
  ir('scr-asis');
}
const turnoAbiertoDe = pid => db.turnos.find(t => !t.salida && t.personalId === pid && t.sucursalId === sucursalActual);
function renderAsistencia() {
  const pid = $('asis-persona').value;
  const p = per(pid);
  const t = pid ? turnoAbiertoDe(pid) : null;
  const btn = $('asis-btn');
  if (!p) { $('asis-estado').innerHTML = '<p class="muted mini">Selecciona quién eres para continuar.</p>'; return; }
  if (t) {
    // ── modo SALIDA ──
    asisAjuste = Number(t.ajuste || 0);
    const trans = ((Date.now() - t.entrada) / 36e5).toFixed(1);
    $('asis-estado').innerHTML =
      '<div class="aviso-turno"><span class="badge mor">EN TURNO</span> ' +
      '<b>' + esc(p.nombre) + '</b> entró a las <b class="amar">' + fmtHora(t.entrada) + '</b> · ' +
      (t.tipo === 'matutino' ? '☀️ Matutino' : '🌙 Vespertino') + ' · lleva ' + trans + ' h</div>';
    $('asis-turno-wrap').style.display = 'none';
    $('asis-ajuste').style.display = '';
    btn.innerHTML = '<span class="ico">👋</span> Registrar salida';
    pintarAjuste();
  } else {
    // ── modo ENTRADA ──
    asisAjuste = 0;
    $('asis-estado').innerHTML = '<p class="muted mini">' + esc(p.nombre) + ' no tiene turno abierto en esta sucursal. Se registrará su <b>entrada</b>.</p>';
    $('asis-turno-wrap').style.display = '';
    $('asis-ajuste').style.display = 'none';
    $('asis-turno').value = turnoSugerido();
    btn.innerHTML = '<span class="ico">✅</span> Registrar entrada';
  }
}
function ajustarAsis(d) {
  asisAjuste = Math.max(-18, Math.min(18, asisAjuste + d)); // ±6 h como tope
  pintarAjuste();
}
function pintarAjuste() {
  const p = per($('asis-persona').value); if (!p) return;
  const extra = asisAjuste * tarifaBloque(p);
  $('asis-ajuste-tx').innerHTML = txtAjuste(asisAjuste) +
    (asisAjuste ? '<div class="mini muted">' + (extra >= 0 ? '+' : '−') + fmt$(Math.abs(extra)) + ' sobre el turno</div>' : '');
  $('asis-pago-prev').textContent = fmt$(Math.max(0, (p.pagoTurno || 0) + extra));
}
function accionAsistencia() { return unaVez('asistencia', marcarAsistencia); }
function marcarAsistencia() {
  const pid = $('asis-persona').value;
  const p = per(pid);
  if (!p) return toast('Selecciona a la persona');
  const s = suc(sucursalActual);
  const abierto = turnoAbiertoDe(pid);
  if (!abierto) {
    // ---- ENTRADA ----
    if (turnosAbiertos().some(t => t.personalId === pid)) return toast('⚠️ ' + p.nombre + ' ya tiene un turno abierto en otra sucursal');
    /* Un turno por persona y por día. Sin este candado, una segunda entrada
       el mismo día PAGA EL DÍA DOS VECES, porque el pago es por turno. */
    const yaHoy = db.turnos.find(t => t.fecha === hoyISO() && t.personalId === pid);
    if (yaHoy) return toast('⚠️ ' + p.nombre + ' ya registró su día en ' +
      (suc(yaHoy.sucursalId)?.nombre || '') + '. Si hubo un cambio, Dirección lo ajusta en Nómina.');
    const t = {
      id: idTurno(hoyISO(), sucursalActual, pid),   // id fijo: no se duplica
      fecha: hoyISO(), sucursalId: sucursalActual, personalId: pid,
      tipo: $('asis-turno').value, entrada: Date.now(), salida: null, ajuste: 0
    };
    db.turnos.unshift(t); guardarDB();
    notificar('🕐 Entrada — ' + p.nombre + ' (' + s.nombre + ')',
      p.nombre + ' registró ENTRADA en sucursal ' + s.nombre + '\nTurno: ' + t.tipo + '\nHora: ' + fmtHora(t.entrada) + ' · ' + fmtFecha(t.fecha), 'entrada');
    toast('✅ ¡Bienvenid@ ' + p.nombre + '! Entrada a las ' + fmtHora(t.entrada));
    return ir('scr-suc');
  }
  // ---- SALIDA ----
  abierto.salida = Date.now();
  abierto.ajuste = asisAjuste;
  abierto.motivoAjuste = ($('asis-motivo').value || '').trim();
  const c = calcularPago(abierto); abierto.horas = c.horas; abierto.pago = c.pago;
  guardarDB();
  notificar('🚪 Salida — ' + p.nombre + ' (' + s.nombre + ')',
    p.nombre + ' registró SALIDA en ' + s.nombre + '\nEntrada: ' + fmtHora(abierto.entrada) + ' · Salida: ' + fmtHora(abierto.salida) +
    '\nEn piso: ' + c.horas + ' h\nAjuste: ' + txtAjuste(c.bloques) + (abierto.motivoAjuste ? ' (' + abierto.motivoAjuste + ')' : '') +
    '\nPago del día: ' + fmt$(c.pago), 'salida');
  $('asis-resumen').innerHTML =
    '<div class="card amarilla centrado"><h3>Resumen del día de ' + esc(p.nombre) + '</h3>' +
    '<div class="grid c3"><div class="stat"><div class="v">' + c.horas + ' h</div><div class="l">en piso</div></div>' +
    '<div class="stat"><div class="v">' + txtAjuste(c.bloques) + '</div><div class="l">ajuste</div></div>' +
    '<div class="stat verde"><div class="v">' + fmt$(c.pago) + '</div><div class="l">pago del día</div></div></div>' +
    '<p class="mini muted">Se paga el turno completo; los ajustes de ' + BLOQUE_MIN + ' min suman o restan sobre esa base. ¡Gracias por tu aventura de hoy! 🌌</p></div>';
  renderAsistencia();
  toast('👋 ¡Hasta pronto, ' + p.nombre + '! Pago del día: ' + fmt$(c.pago));
}

/* ═══════════ CHECKLIST DEL DÍA ═══════════
   Sección 1 · Registros con evidencia (foto al finalizar turno)
   Sección 2 · Acciones a lo largo del día (sin evidencia)      */
let cierreBorrador = { ventas: '', caja: '' };
let cierreFotos = { 'r-ventas': '', 'r-caja': '' };
let regPendiente = null;   // id del registro que está capturando foto

/* Una evidencia por registro, por día y por sucursal: si vuelven a tomar la
   foto, reemplaza la anterior en vez de acumular otra fila. */
function guardarEvidenciaUnica(datos) {
  const id = idEvid(datos.fecha, datos.sucursalId, datos.regId);
  const i = db.evidencias.findIndex(e => e.id === id);
  const reg = Object.assign({ id, ts: Date.now() }, datos);
  if (i >= 0) db.evidencias[i] = reg; else db.evidencias.unshift(reg);
  return reg;
}

/* ---------- borrador del cierre ----------
   Los montos se guardan solitos mientras se capturan, por día y sucursal. Si
   alguien sale a medias, al volver siguen ahí: no hay que "guardar" aparte,
   el único botón que manda algo es el de cerrar el día. */
const BORRADOR_KEY = 'ojo_borrador_cierre';
function leerBorradores() {
  try { return JSON.parse(localStorage.getItem(BORRADOR_KEY) || '{}'); } catch (e) { return {}; }
}
function guardarBorradorCierre() {
  if (!sucursalActual) return;
  const todos = leerBorradores();
  todos[hoyISO() + '|' + sucursalActual] = {
    ventas: cierreBorrador.ventas, caja: cierreBorrador.caja,
    obs: ($('chk-obs') ? $('chk-obs').value : ''), ts: Date.now()
  };
  // solo se conservan los de los últimos días
  Object.keys(todos).forEach(k => { if (k.split('|')[0] < hoyISO()) delete todos[k]; });
  try { localStorage.setItem(BORRADOR_KEY, JSON.stringify(todos)); } catch (e) { }
}
function cargarBorradorCierre() {
  const b = leerBorradores()[hoyISO() + '|' + sucursalActual];
  cierreBorrador = { ventas: b ? (b.ventas ?? '') : '', caja: b ? (b.caja ?? '') : '' };
  if ($('chk-obs')) $('chk-obs').value = b ? (b.obs || '') : '';
  return !!b;
}
function borrarBorradorCierre(fecha, sid) {
  const todos = leerBorradores();
  delete todos[fecha + '|' + sid];
  try { localStorage.setItem(BORRADOR_KEY, JSON.stringify(todos)); } catch (e) { }
  cierreBorrador = { ventas: '', caja: '' };
  cierreFotos = { 'r-ventas': '', 'r-caja': '' };
}
function irChecklist() {
  opcionesPersonal($('chk-persona'), true);
  if (!$('chk-persona').value) opcionesPersonal($('chk-persona'), false);
  cierreFotos = { 'r-ventas': '', 'r-caja': '' };
  ir('scr-chk');
  // se recupera lo que se haya dejado a medias hoy en esta sucursal
  if (cargarBorradorCierre() && !cierreDelDia()) toast('📝 Se recuperó lo que llevabas capturado');
  renderChecklist();
}
function renderChecklist() {
  renderResumenChk();
  renderRegistros();
  renderActividades();
}

/* ---- cuadro superior principal: solo el dinero y el avance ---- */
function renderResumenChk() {
  const lista = tareasDelDia();
  const hechas = lista.filter(t => tareaHecha(t)).length;
  const conEv = REGISTROS.filter(r => registroListo(r)).length;
  const pct = (lista.length + REGISTROS.length)
    ? Math.round((hechas + conEv) / (lista.length + REGISTROS.length) * 100) : 0;
  const cie = cierreDelDia();
  const ventas = cie ? cie.ventas : Number(cierreBorrador.ventas || 0);
  const caja = cie ? cie.caja : Number(cierreBorrador.caja || 0);
  const propTot = propinasDe(hoyISO(), sucursalActual).reduce((a, x) => a + x.monto, 0);
  $('chk-dinero').innerHTML =
    '<div class="stat verde"><div class="v">' + fmt$(ventas) + '</div><div class="l">ventas cierre</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(caja) + '</div><div class="l">caja de dinero</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(propTot) + '</div><div class="l">💳 propinas</div></div>';
  $('chk-barra').style.width = pct + '%';
  $('chk-pct').textContent = pct + '%';
  const chip = $('chk-progreso-chip');
  if (chip) chip.textContent = (hechas + conEv) + '/' + (lista.length + REGISTROS.length);
}
/* un registro está listo si ya tiene foto (o, en los de dinero, cierre enviado) */
function registroListo(r, fecha, sid) {
  return r.dinero ? !!cierreDelDia(fecha, sid) : !!evidenciaDeRegistro(r.id, fecha, sid);
}

/* ---- sección 1: registros + evidencia en la misma casilla ---- */
function renderRegistros() {
  const cie = cierreDelDia();
  $('chk-registros').innerHTML = REGISTROS.map(r => r.dinero ? filaDinero(r, cie) : filaEvidencia(r)).join('') +
    (cie ? '' : '<button class="btn p" style="margin-top:4px" onclick="guardarCierre()">🌙 Enviar cierre del día</button>');
}
function filaEvidencia(r) {
  const ev = evidenciaDeRegistro(r.id);
  const hecho = !!ev;
  return '<div class="reg' + (hecho ? ' hecha' : '') + '">' +
    '<div class="box">' + (hecho ? '✔' : '') + '</div>' +
    '<div class="grow"><div class="tt">' + r.em + ' ' + esc(r.n) + '</div>' +
    '<div class="meta">' + (hecho
      ? '📸 ' + esc(per(ev.personalId)?.nombre || 'Equipo') + ' · ' + fmtHora(ev.ts)
      : 'Foto requerida al cerrar') + '</div></div>' +
    (hecho && ev.foto ? '<img class="reg-thumb" src="' + fotoURL(ev.foto) + '" onclick="verFoto(\'' + ev.id + '\')" loading="lazy">' : '') +
    '<button class="reg-cam" onclick="tomarFotoRegistro(\'' + r.id + '\')" title="Agregar evidencia">' +
    (hecho ? '🔄' : '📷') + '</button></div>';
}
function filaDinero(r, cie) {
  const ev = evidenciaDeRegistro(r.id);
  if (cie) {
    return '<div class="reg hecha">' +
      '<div class="box">✔</div>' +
      '<div class="grow"><div class="tt">' + r.em + ' ' + esc(r.n) + '</div>' +
      '<div class="meta">' + fmt$(r.dinero === 'ventas' ? cie.ventas : cie.caja) + ' · enviado ' + fmtHora(cie.ts) +
      ' por ' + esc(per(cie.personalId)?.nombre || 'Equipo') + '</div></div>' +
      (ev && ev.foto ? '<img class="reg-thumb" src="' + fotoURL(ev.foto) + '" onclick="verFoto(\'' + ev.id + '\')" loading="lazy">' : '') +
      '</div>';
  }
  const foto = cierreFotos[r.id];
  return '<div class="reg fila-cierre">' +
    '<div class="box"></div>' +
    '<div class="grow"><div class="tt">' + r.em + ' ' + esc(r.n) + '</div>' +
    '<div class="meta">Monto y foto al cerrar</div></div>' +
    (foto ? '<img class="reg-thumb" src="' + foto + '">' : '') +
    '<button class="reg-cam' + (foto ? ' listo' : '') + '" onclick="tomarFotoRegistro(\'' + r.id + '\')" title="Foto de ' + esc(r.n) + '">' +
    (foto ? '🔄' : '📷') + '</button>' +
    '<div class="reg-dinero">' +
    '<input id="chk-' + r.dinero + '" type="number" inputmode="decimal" placeholder="' + r.ph + '" value="' +
    esc(cierreBorrador[r.dinero]) + '" oninput="cierreBorrador.' + r.dinero + '=this.value;guardarBorradorCierre();renderResumenChk()">' +
    '</div></div>';
}

/* ---- captura de foto dentro de la casilla ---- */
function tomarFotoRegistro(rid) {
  const p = per($('chk-persona').value);
  if (!p) return toast('Primero indica quién está marcando 👤');
  regPendiente = rid;
  const inp = $('chk-file'); inp.value = ''; inp.click();
}
function archivoRegistro(input) {
  const f = input.files && input.files[0];
  if (!f || !regPendiente) return;
  const rid = regPendiente; regPendiente = null;
  comprimirFoto(f, async dataUrl => {
    const r = REGISTROS.find(x => x.id === rid);
    if (r.dinero) { cierreFotos[rid] = dataUrl; renderRegistros(); return toast('📷 Foto lista · pulsa Enviar cierre'); }
    const s = suc(sucursalActual);
    const p = per($('chk-persona').value);
    toast('⬆️ Subiendo evidencia…');
    const fotoFinal = await subirFotoDrive(dataUrl, { tipo: r.tipo, sucursal: s.nombre, fecha: hoyISO() });
    guardarEvidenciaUnica({
      fecha: hoyISO(), sucursalId: sucursalActual, personalId: p?.id || '',
      tipo: r.tipo, regId: rid, nota: r.n, foto: fotoFinal
    });
    podarFotos(false); guardarDB();
    notificar('📸 ' + r.n + ' — ' + s.nombre,
      (p?.nombre || 'Equipo') + ' subió evidencia de "' + r.n + '" en ' + s.nombre + ' · ' + fmtFecha(hoyISO()) +
      (fotoFinal && fotoFinal.startsWith('http') ? '\nFoto: ' + fotoFinal : ''), 'evidencia');
    renderRegistros();
    toast('✅ Evidencia de ' + r.n.toLowerCase() + ' guardada');
  });
}

/* ---- sección 2: acciones del día ---- */
function renderActividades() {
  const lista = tareasDelDia();
  $('chk-items').innerHTML = lista.map(t => {
    const h = tareaHecha(t);
    const cls = 'tarea' + (h ? (h.ver ? ' verificada' : ' hecha') : '');
    return '<div class="' + cls + '" onclick="toggleTarea(\'' + t.id + '\')">' +
      '<div class="box">' + (h ? '✔' : '') + '</div>' +
      '<div><div class="tt">' + esc(t.n) + '</div>' +
      '<div class="meta">' + (h
        ? '✔ ' + esc(h.por || 'Equipo') + ' · ' + fmtHora(h.ts) + (h.ver ? ' · <b style="color:var(--ok)">verificada ✔✔</b>' : '')
        : esc(notaTarea(t))) +
      '</div></div>' +
      '<span class="vv ' + (h ? 'si' : 'no') + '">' + (h ? (h.ver ? '✔✔' : 'HECHA') : 'PENDIENTE') + '</span></div>';
  }).join('');
}
function toggleTarea(tid) {
  const t = ACCIONES.find(x => x.id === tid);
  const key = tareaKey(hoyISO(), sucursalActual, tid);
  let r = db.tareas.find(x => x.id === key);
  const p = per($('chk-persona').value);
  if (r && r.done) {
    if (r.ver) return toast('Ya fue verificada; solo Supervisión puede modificarla 🔍');
    r.done = false; r.ts = Date.now();
    toast('↩️ Acción desmarcada');
  } else {
    if (!p) return toast('Selecciona quién marca la acción');
    if (!r) { r = { id: key, fecha: hoyISO(), sucursalId: sucursalActual, tareaId: tid, nombre: t.n }; db.tareas.push(r); }
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
  notificar('🗒️ Observación — ' + s.nombre, (p?.nombre || 'Equipo') + ':\n' + texto, 'observacion');
  $('chk-obs').value = '';
  toast('🗒️ Observación registrada · Dirección la verá en su panel');
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
    .filter(p => !p.del && (invCat === 'TODOS' || p.cat === invCat) && p.nombre.toLowerCase().includes(q))
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
  notificar('📦 Inventario realizado — ' + s.nombre,
    'Inventario confirmado en ' + s.nombre + ' (' + fmtFecha(hoyISO()) + ').\n' +
    (falt.length ? '🛒 POR COMPRAR (' + falt.length + '):\n' + falt.map(p => '· ' + p.nombre + ' — quedan ' + (stockDe(sucursalActual)[p.id]?.c || 0) + ' (mín ' + p.minimo + ')').join('\n')
      : '✅ Todo el stock por encima del mínimo.'), 'inventario');
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
    '<div class="item-linea">' + avatarPersona(x.personalId) + '<div class="grow"><b>' + fmt$(x.monto) + '</b> — ' +
    esc(per(x.personalId)?.nombre || '¿?') +
    '<div class="mini muted">' + fmtHora(x.ts) + (x.nota ? ' · ' + esc(x.nota) : '') + '</div></div></div>').join('');
}
function registrarPropina() {
  const monto = Number($('prop-monto').value);
  if (!monto || monto <= 0) return toast('Captura el monto de la propina 💳');
  const p = per($('prop-persona').value);
  if (!p) return toast('Selecciona a quién le tocó');
  /* Aquí sí puede haber varias propinas al día, así que en vez de id fijo se
     avisa si acaban de registrar el mismo monto a la misma persona: casi
     siempre es un doble toque, no dos propinas idénticas seguidas. */
  const repe = db.propinas.find(x => x.personalId === p.id && x.monto === monto &&
    x.sucursalId === sucursalActual && Date.now() - x.ts < 120000);
  if (repe && !confirm('Hace un momento ya registraste ' + fmt$(monto) + ' para ' + p.nombre +
    '.\n¿Es otra propina distinta?')) return;
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

/* ═══════════ EVIDENCIAS (ahora viven dentro del checklist) ═══════════ */
/* Google ya no muestra los enlaces uc?export=view como imagen;
   se convierten al formato thumbnail que si funciona */
function fotoURL(f) {
  if (!f) return f;
  const m = f.match(/drive\.google\.com\/uc\?[^"']*id=([\w-]+)/);
  return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000' : f;
}
function tarjetaEvidencia(e) {
  const p = per(e.personalId);
  const img = e.foto ? (e.foto.startsWith('data:') || e.foto.startsWith('http')
    ? '<img src="' + fotoURL(e.foto) + '" loading="lazy" onclick="verFoto(\'' + e.id + '\')">' : '') : '<div style="height:100px;display:flex;align-items:center;justify-content:center" class="muted">📁 en Drive</div>';
  return '<div class="ev">' + img + '<div class="m"><b>' + esc(iconoTipo(e.tipo) + ' ' + e.tipo) + '</b><br>' +
    fmtFecha(e.fecha) + ' ' + fmtHora(e.ts) + (p ? '<br>' + esc(p.nombre) : '') + (e.nota ? '<br>' + esc(e.nota) : '') + '</div></div>';
}
function iconoTipo(t) { return { apertura: '🌅', cierre: '🌙', limpieza: '🧽', incidencia: '⚠️', otra: '📎' }[t] || '📎'; }
function verFoto(id) {
  const e = db.evidencias.find(x => x.id === id); if (!e || !e.foto) return;
  abrirModal('<img src="' + fotoURL(e.foto) + '" style="width:100%;border-radius:12px">' +
    '<p class="mini muted">' + esc(e.tipo) + ' · ' + fmtFecha(e.fecha) + ' ' + fmtHora(e.ts) + (e.nota ? ' · ' + esc(e.nota) : '') + '</p>' +
    '<button class="btn s" onclick="cerrarModal()">Cerrar</button>');
}
/* ═══════════ CIERRE DE TURNO (desde la casilla del checklist) ═══════════ */
function guardarCierre() { return unaVez('cierre', cerrarElDia); }
async function cerrarElDia() {
  if (cierreDelDia()) return toast('El cierre de hoy ya fue enviado ✅');
  if (cierreBorrador.ventas === '') return toast('Captura las ventas del cierre 💵');
  if (cierreBorrador.caja === '') return toast('Captura la caja de dinero 🧾');
  const ventas = Number(cierreBorrador.ventas) || 0;
  const caja = Number(cierreBorrador.caja) || 0;
  const p = per($('chk-persona').value);
  if (!p) return toast('Indica quién está cerrando 👤');
  const s = suc(sucursalActual);
  const fecha = hoyISO();
  // el dinero se confirma a la vista: es el dato del que cuelga todo lo demás
  const faltan = REGISTROS.filter(r => !registroListo(r)).length;
  if (!confirm('Vas a cerrar el día en ' + s.nombre + ':\n\n' +
    'Ventas: ' + fmt$(ventas) + '\nCaja de dinero: ' + fmt$(caja) +
    '\nResponsable: ' + p.nombre +
    (faltan ? '\n\n⚠️ Quedan ' + faltan + ' registro(s) sin evidencia.' : '') +
    '\n\nSe envía UNA sola vez al día. ¿Los montos están bien?')) return;
  // el avance del cierre son las acciones del día
  const acts = tareasDelDia();
  const hechos = acts.filter(t => tareaHecha(t)).length;
  const items = {}; acts.forEach(t => items[t.n] = !!tareaHecha(t));
  // sube las fotos de ventas y caja (si las tomaron) como evidencias del cierre
  const fotos = {};
  for (const rid of ['r-ventas', 'r-caja']) {
    if (!cierreFotos[rid]) continue;
    const r = REGISTROS.find(x => x.id === rid);
    fotos[rid] = await subirFotoDrive(cierreFotos[rid], { tipo: 'cierre', sucursal: s.nombre, fecha });
    guardarEvidenciaUnica({
      fecha, sucursalId: sucursalActual, personalId: p.id,
      tipo: 'cierre', regId: rid, nota: r.n, foto: fotos[rid]
    });
  }
  // se vuelve a revisar DESPUÉS de subir las fotos: en esa espera pudo entrar
  // otro cierre (otro dispositivo, o esta misma pantalla abierta dos veces)
  if (cierreDelDia()) { renderChecklist(); return toast('El cierre de hoy ya estaba enviado ✅'); }
  const reg = {
    id: idCierre(fecha, sucursalActual),      // id fijo: un cierre por día y sucursal
    fecha, ts: Date.now(), tsFoto: Date.now(), sucursalId: sucursalActual,
    personalId: p.id, ventas, caja, items, hechos, total: acts.length,
    foto: fotos['r-ventas'] || fotos['r-caja'] || '',
    novedades: ($('chk-obs').value || '').trim()
  };
  const yaEsta = db.cierres.findIndex(c => c.id === reg.id);
  if (yaEsta >= 0) db.cierres[yaEsta] = reg; else db.cierres.unshift(reg);
  borrarBorradorCierre(fecha, sucursalActual);
  const fotoFinal = reg.foto;
  podarFotos(false); guardarDB();
  const propHoy = propinasDe(reg.fecha, sucursalActual);
  const propTotal = propHoy.reduce((a, x) => a + x.monto, 0);
  const propDetalle = Object.entries(propHoy.reduce((m, x) => { m[x.personalId] = (m[x.personalId] || 0) + x.monto; return m; }, {}))
    .map(([pid, m]) => (per(pid)?.nombre || '¿?') + ' ' + fmt$(m)).join(' · ');
  const resumen = '🌙 CIERRE DEL DÍA — ' + s.nombre + ' (' + fmtFecha(reg.fecha) + ')\n' +
    'Responsable: ' + p.nombre + '\nVentas cierre: ' + fmt$(ventas) + '\nCaja de dinero: ' + fmt$(caja) +
    '\n💳 Propinas digitales del día: ' + fmt$(propTotal) + (propDetalle ? ' (' + propDetalle + ')' : '') +
    '\nAcciones del día: ' + hechos + '/' + reg.total +
    (reg.novedades ? '\nNovedades: ' + reg.novedades : '') +
    (fotoFinal && fotoFinal.startsWith('http') ? '\nFoto: ' + fotoFinal : '');
  notificar('🌙 Cierre ' + s.nombre + ' — ventas ' + fmt$(ventas), resumen, 'cierre');
  cierreBorrador = { ventas: '', caja: '' }; cierreFotos = { 'r-ventas': '', 'r-caja': '' };
  renderChecklist();
  abrirModal('<h3>🌙 Cierre enviado</h3>' +
    '<div class="grid c3"><div class="stat verde"><div class="v">' + fmt$(ventas) + '</div><div class="l">ventas cierre</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(caja) + '</div><div class="l">caja de dinero</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(propTotal) + '</div><div class="l">💳 propinas digitales</div></div></div>' +
    '<p class="mini muted centrado" style="margin-top:10px">Acciones ' + hechos + '/' + reg.total + ' · Dirección ya fue notificada' + (enLinea() ? ' por correo 📧' : ' (bitácora local)') + '</p>' +
    '<a class="btn p" href="' + linkWhatsApp(resumen) + '" target="_blank">📲 Avisar por WhatsApp</a>' +
    '<div style="height:8px"></div><button class="btn s" onclick="cerrarModal();ir(\'scr-suc\')">Terminar</button>');
}

/* ═══════════ PROTOCOLOS ═══════════
   título fijo + menú horizontal deslizable: se cambia de sección sin scroll */
let protoCat = 0;
function renderProtocolos() {
  $('proto-tabs').innerHTML = PROTOCOLOS.map(([mod], i) =>
    '<button class="' + (protoCat === i ? 'on' : '') + '" onclick="protoCat=' + i + ';renderProtocolos()">' +
    esc(mod.replace(/^\d+\.\s*/, '')) + '</button>').join('');
  const [mod, items] = PROTOCOLOS[protoCat];
  $('proto-lista').innerHTML = '<div class="card"><h3>' + esc(mod) + '</h3>' + items.map(([t, d]) =>
    '<div class="item-linea"><div class="grow"><b style="font-size:.9rem">' + esc(t) + '</b>' +
    '<div class="mini muted">' + esc(d) + '</div></div></div>').join('') + '</div>';
  // deja visible en el menú la sección activa
  const act = $('proto-tabs').children[protoCat];
  if (act) act.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

/* ═══════════ RECETARIO ═══════════ (solo consulta) */
let recCat = 0;
function irPreparaciones() { recCat = 0; ir('scr-prep'); }
function renderPreparaciones() {
  $('prep-rec-tabs').innerHTML = RECETAS.map(([cat], i) =>
    '<button class="' + (recCat === i ? 'on' : '') + '" onclick="recCat=' + i + ';renderPreparaciones()">' + esc(cat) + '</button>').join('');
  const [cat, items] = RECETAS[recCat];
  $('prep-rec-lista').innerHTML = '<div class="card"><h3>' + esc(cat) + '</h3>' + items.map(([n, d]) =>
    '<div class="item-linea"><div class="grow"><b style="font-size:.9rem">' + esc(n) + '</b>' +
    '<div class="mini muted">' + esc(d) + '</div></div></div>').join('') + '</div>' +
    '<p class="mini muted centrado">Gramajes y montaje según el recetario de Dirección. Ante cualquier duda, consulta a tu encargado.</p>';
  const act = $('prep-rec-tabs').children[recCat];
  if (act) act.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

/* ═══════════ SUPERVISIÓN ═══════════ */
let esSupervisor = false;
function pedirPinSupervision() {
  abrirPin('PIN de Supervisión', pin => {
    if (pin === db.config.supervisorPin || pin === db.config.adminPin) {
      esSupervisor = true;
      $('rev-suc').innerHTML = db.sucursales.filter(s => s.activa && !s.del).map(s => '<option value="' + s.id + '">' + esc(s.nombre) + '</option>').join('');
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
  /* Supervisión revisa SOLO lo verificable con foto: el checklist de
     registros con evidencia. Las acciones sin evidencia no se muestran
     aquí (viven en el checklist del equipo y en el % de cumplimiento). */
  const cieDia = cierreDelDia(fecha, sid);
  const conEv = REGISTROS.filter(r => registroListo(r, fecha, sid)).length;
  html += '<div class="card"><div class="encabezado-seccion"><h3 style="margin:0">📸 Checklist con evidencia</h3>' +
    '<span class="badge ' + (conEv === REGISTROS.length ? 'ok' : 'aviso') + '">' + conEv + '/' + REGISTROS.length + '</span></div>' +
    REGISTROS.map(r => {
      const ev = evidenciaDeRegistro(r.id, fecha, sid);
      const ok = registroListo(r, fecha, sid);
      const verificado = r.dinero ? !!(cieDia && cieDia.ver) : !!(ev && ev.ver);
      const detalle = r.dinero
        ? (cieDia ? fmt$(r.dinero === 'ventas' ? cieDia.ventas : cieDia.caja) + ' · ' + esc(per(cieDia.personalId)?.nombre || 'Equipo')
          : 'Sin cierre registrado')
        : (ev ? esc(per(ev.personalId)?.nombre || 'Equipo') + ' · ' + fmtHora(ev.ts) : 'Sin evidencia');
      return '<div class="reg' + (ok ? (verificado ? ' hecha verificada' : ' hecha') : '') + '" style="cursor:default">' +
        '<div class="box">' + (ok ? '✔' : '') + '</div>' +
        '<div class="grow"><div class="tt">' + r.em + ' ' + esc(r.n) + '</div><div class="meta">' + detalle +
        (verificado ? ' · <b style="color:var(--ok)">verificada ✔✔</b>' : '') + '</div></div>' +
        (ev && ev.foto ? '<img class="reg-thumb" src="' + fotoURL(ev.foto) + '" onclick="verFoto(\'' + ev.id + '\')" loading="lazy">' : '') +
        (ok ? '<button class="btn ' + (verificado ? 'p' : 's') + ' mini" style="flex-shrink:0" ' +
          'onclick="verificarRegistro(\'' + r.id + '\',\'' + fecha + '\',\'' + sid + '\')">' +
          (verificado ? '✔✔' : 'Verificar') + '</button>'
          : '<span class="vv no" style="flex-shrink:0">PENDIENTE</span>') +
        '</div>';
    }).join('') + '</div>';
  // otras evidencias sueltas del día
  const evs = db.evidencias.filter(e => e.fecha === fecha && e.sucursalId === sid && !e.regId);
  if (evs.length) html += '<div class="card"><h3>📎 Otras evidencias (' + evs.length + ')</h3>' +
    '<div class="galeria">' + evs.map(e => tarjetaEvidencia(e)).join('') + '</div></div>';
  // quién debía entrar hoy y quién realmente marcó
  html += cardProgramadoVsReal(fecha, sid);
  // notas y observaciones del equipo
  html += cardObservaciones(fecha, sid);
  // cierre del día
  const cie = cierresVivos().find(c => c.fecha === fecha && c.sucursalId === sid);
  html += '<div class="card"><h3>🌙 Cierre del día</h3>' + (cie
    ? '<div class="grid c3"><div class="stat verde"><div class="v">' + fmt$(cie.ventas) + '</div><div class="l">ventas cierre</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(cie.caja) + '</div><div class="l">caja de dinero</div></div>' +
    '<div class="stat"><div class="v">' + (cie.hechos ?? 0) + '/' + totalCierre(cie) + '</div><div class="l">acciones del día</div></div></div>' +
    (cie.novedades ? '<p class="mini muted" style="margin-top:8px">🗞️ ' + esc(cie.novedades) + '</p>' : '')
    : '<p class="muted mini">Aún sin cierre registrado este día.</p>') + '</div>';
  // veredicto
  const pct = avanceDia(fecha, sid).pct;
  html += '<div class="card amarilla"><h3>📝 Enviar revisión del día</h3>' +
    '<div class="fila" style="margin-bottom:8px"><div class="stat" style="flex:0 0 130px"><div class="v">' + pct + '%</div><div class="l">cumplimiento</div></div>' +
    '<div style="flex:1"><div class="seg" style="margin:0">' +
    '<button id="rev-v-cumplido" onclick="revVeredicto=\'cumplido\';marcarVeredicto()">✅ Cumplido</button>' +
    '<button id="rev-v-ajustes" onclick="revVeredicto=\'ajustes\';marcarVeredicto()">⚠️ Ajustes</button>' +
    '<button id="rev-v-nocumplido" onclick="revVeredicto=\'nocumplido\';marcarVeredicto()">⛔ No cumplido</button></div></div></div>' +
    '<label>Retroalimentación para el equipo</label>' +
    '<textarea id="rev-comentario" placeholder="Ej. Excelente turno, solo faltó rellenar salsas…"></textarea>' +
    '<div style="margin-top:14px"><button class="btn p gigante" onclick="guardarRevision(\'' + fecha + '\',\'' + sid + '\',' + pct + ')">🔍 Enviar revisión</button></div>' +
    '<div style="margin-top:10px"><button class="btn s" onclick="tareaDeRevision(\'' + fecha + '\',\'' + sid + '\')">' +
    '✅ Convertir esto en tarea</button></div></div>';
  // historial
  const hist = db.revisiones.filter(r => r.sucursalId === sid).slice(0, 7);
  if (hist.length) html += '<div class="card"><h3>📜 Revisiones recientes</h3>' + hist.map(r =>
    '<div class="item-linea"><div class="grow"><b>' + (r.veredicto === 'cumplido' ? '✅' : r.veredicto === 'ajustes' ? '⚠️' : '⛔') +
    ' ' + fmtFecha(r.fecha) + ' · ' + r.pct + '%</b><div class="mini muted">' + esc(r.comentario || '') + '</div></div>' +
    (r.comentario ? btnTarea('Dar seguimiento: ' + r.comentario,
      'Revisión de ' + (suc(r.sucursalId)?.nombre || '') + ' del ' + fmtFecha(r.fecha) + ' · ' + r.pct + '% de cumplimiento') : '') +
    '</div>').join('') + '</div>';
  $('rev-contenido').innerHTML = html;
  marcarVeredicto();
}
let revVeredicto = 'cumplido';
function marcarVeredicto() {
  ['cumplido', 'ajustes', 'nocumplido'].forEach(v => {
    const b = $('rev-v-' + v); if (b) b.classList.toggle('on', revVeredicto === v);
  });
}
/* ✔✔ de Supervisión sobre los registros con evidencia */
function verificarRegistro(rid, fecha, sid) {
  const r = REGISTROS.find(x => x.id === rid);
  if (r.dinero) {
    const cie = cierreDelDia(fecha, sid);
    if (!cie) return toast('Sin cierre que verificar');
    cie.ver = !cie.ver; cie.ts = Date.now();
    toast(cie.ver ? '✔✔ Cierre verificado' : '↩️ Verificación retirada');
  } else {
    const ev = evidenciaDeRegistro(rid, fecha, sid);
    if (!ev) return toast('Sin evidencia que verificar');
    ev.ver = !ev.ver; ev.ts = Date.now();
    toast(ev.ver ? '✔✔ Evidencia verificada' : '↩️ Verificación retirada');
  }
  guardarDB(); renderRevision();
}
/* notas y observaciones de los colaboradores (se muestra en Supervisión y Dirección) */
/* ═══════════ TAREAS A TODOIST ═══════════
   Se usa el enlace de "añadir tarea" de Todoist (todoist.com/add). Abre la app
   del teléfono con la tarea ya escrita y solo hay que confirmar.
   Se eligió así a propósito: no pide token ni contraseña de Todoist, no hay
   credenciales guardadas en una app que vive en un repo público, y funciona
   igual en el teléfono, la tablet y la computadora. */
/* La prioridad se manda como p1…p4 DENTRO del texto, que es la misma sintaxis
   que se teclea en Todoist (p1 = urgente). El parámetro "priority" de la URL
   usa la escala invertida de la API y se presta a confusión. */
let tareaTxt = '', tareaDesc = '', tareaFecha = '', tareaPrio = 3;
const PRIORIDADES = [[1, 'P1 urgente'], [2, 'P2 alta'], [3, 'P3 media'], [4, 'P4 normal']];

function abrirTarea(texto, descripcion, fechaSugerida) {
  tareaTxt = texto || '';
  tareaDesc = descripcion || '';
  tareaFecha = fechaSugerida || hoyISO();
  tareaPrio = 3;
  pintarTarea();
}
function pintarTarea() {
  const proy = (db.config.todoistProyecto || '').trim();
  const atajos = [
    ['Hoy', hoyISO()],
    ['Mañana', isoLocal(new Date(Date.now() + 864e5))],
    ['En 3 días', isoLocal(new Date(Date.now() + 3 * 864e5))],
    ['Próximo lunes', (() => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return isoLocal(d); })()]
  ];
  abrirModal('<h3>✅ Crear tarea</h3>' +
    '<p class="mini muted">Se abre Todoist con la tarea lista' + (proy ? ' en <b>#' + esc(proy) + '</b>' : '') + '. Solo confirmas.</p>' +
    '<label>Tarea</label><input id="tk-txt" value="' + esc(tareaTxt) + '" oninput="tareaTxt=this.value">' +
    '<label style="margin-top:10px">Detalle (opcional)</label>' +
    '<textarea id="tk-desc" style="min-height:70px" oninput="tareaDesc=this.value">' + esc(tareaDesc) + '</textarea>' +
    '<label style="margin-top:10px">Para cuándo</label>' +
    '<div class="fila" style="flex-wrap:wrap;gap:6px">' + atajos.map(([n, f]) =>
      '<button class="btn ' + (tareaFecha === f ? 'p' : 's') + ' mini" onclick="tareaFecha=\'' + f + '\';pintarTarea()">' +
      n + '</button>').join('') + '</div>' +
    '<input type="date" style="margin-top:8px" value="' + tareaFecha + '" onchange="tareaFecha=this.value;pintarTarea()">' +
    '<label style="margin-top:10px">Prioridad</label>' +
    '<div class="seg" style="margin:0">' + PRIORIDADES.map(([v, n]) =>
      '<button class="' + (tareaPrio === v ? 'on' : '') + '" onclick="tareaPrio=' + v + ';pintarTarea()">' + n + '</button>').join('') + '</div>' +
    '<button class="btn p gigante" style="margin-top:14px" onclick="mandarATodoist()">✅ Crear en Todoist</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="copiarTarea()">📋 Copiar el texto</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="cerrarModal()">Cancelar</button>');
}
function textoTarea() {
  const proy = (db.config.todoistProyecto || '').trim();
  return tareaTxt.trim() +
    (tareaPrio < 4 ? ' p' + tareaPrio : '') +          // p4 es "sin prioridad": no hace falta escribirla
    (proy ? ' #' + proy.replace(/\s+/g, '') : '');
}
function mandarATodoist() {
  if (!tareaTxt.trim()) return toast('Escribe de qué es la tarea');
  const p = new URLSearchParams();
  p.set('content', textoTarea());
  if (tareaDesc.trim()) p.set('description', tareaDesc.trim());
  if (tareaFecha) p.set('date', tareaFecha);
  window.open('https://todoist.com/add?' + p.toString(), '_blank');
  cerrarModal();
  toast('✅ Tarea enviada a Todoist — confírmala ahí');
}
function copiarTarea() {
  const t = textoTarea() + (tareaFecha ? ' ' + fmtFecha(tareaFecha) : '') + (tareaDesc ? '\n' + tareaDesc : '');
  navigator.clipboard.writeText(t).then(() => toast('📋 Copiado')).catch(() => toast('No se pudo copiar'));
}
/* convierte la revisión que se está escribiendo en una tarea de seguimiento */
function tareaDeRevision(fecha, sid) {
  const com = ($('rev-comentario') ? $('rev-comentario').value : '').trim();
  const s = suc(sid), pct = avanceDia(fecha, sid).pct;
  abrirTarea(
    com || 'Dar seguimiento a ' + (s?.nombre || '') + ' (' + fmtFecha(fecha) + ')',
    'Revisión del ' + fmtFecha(fecha) + ' en ' + (s?.nombre || '') + '\nCumplimiento: ' + pct + '%\n' +
    'Veredicto: ' + revVeredicto,
    isoLocal(new Date(Date.now() + 864e5)));
}
/* botón chico para colgar una tarea de cualquier cosa que se vea en pantalla */
function btnTarea(texto, descripcion, fecha) {
  const e = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
  return '<button class="btn s mini" title="Crear tarea en Todoist" onclick="abrirTarea(\'' +
    e(texto) + '\',\'' + e(descripcion) + '\',\'' + (fecha || '') + '\')">✅</button>';
}

/* ═══════════ PROGRAMADO vs REAL ═══════════
   Cruza el calendario con la asistencia: quién debía entrar y quién marcó.
   No pide capturar nada nuevo — los dos datos ya están — y es lo que convierte
   el calendario en un control y no solo en un aviso. */
const TOLERANCIA_MIN = 10;
function cardProgramadoVsReal(fecha, sid) {
  const prog = db.calendario.filter(x => !x.del && x.fecha === fecha && (!sid || x.sucursalId === sid));
  const turnos = db.turnos.filter(t => t.fecha === fecha && (!sid || t.sucursalId === sid));
  if (!prog.length && !turnos.length) return '';
  const filas = prog.map(p => ({ pid: p.personalId, sid: p.sucursalId, p, t: turnos.find(x => x.personalId === p.personalId) }));
  turnos.forEach(t => {
    if (!prog.some(p => p.personalId === t.personalId)) filas.push({ pid: t.personalId, sid: t.sucursalId, p: null, t });
  });
  const [y, m, d] = fecha.split('-').map(Number);
  let faltas = 0, tardes = 0;
  const html = filas.sort((a, b) => calNombre(a.pid).localeCompare(calNombre(b.pid), 'es')).map(f => {
    let estado, detalle;
    if (!f.p) { estado = '<span class="badge aviso">➕ sin programar</span>'; detalle = 'Marcó ' + fmtHora(f.t.entrada); }
    else if (!f.t) { estado = '<span class="badge comprar">❌ no marcó</span>'; detalle = 'Debía entrar ' + f.p.ini + ':00'; faltas++; }
    else {
      const esperado = new Date(y, m - 1, d, f.p.ini, 0).getTime();
      const min = Math.round((f.t.entrada - esperado) / 60000);
      if (min > TOLERANCIA_MIN) { estado = '<span class="badge aviso">⏰ ' + min + ' min tarde</span>'; tardes++; }
      else estado = '<span class="badge ok">✅ a tiempo</span>';
      detalle = 'Programado ' + rangoCorto(f.p) + ' · marcó ' + fmtHora(f.t.entrada);
    }
    return '<div class="item-linea">' + avatarPersona(f.pid) +
      '<div class="grow"><b>' + esc(calNombre(f.pid)) + '</b>' +
      '<div class="mini muted">' + detalle + (sid ? '' : ' · ' + esc(suc(f.sid)?.nombre || '')) + '</div></div>' +
      estado + '</div>';
  }).join('');
  const alerta = faltas || tardes;
  return '<div class="card' + (alerta ? ' amarilla' : '') + '"><div class="encabezado-seccion">' +
    '<h3 style="margin:0">🎯 Programado vs. real</h3>' +
    (alerta
      ? '<span class="badge aviso">' + (faltas ? faltas + ' sin marcar' : '') + (faltas && tardes ? ' · ' : '') +
        (tardes ? tardes + ' tarde' : '') + '</span>'
      : '<span class="badge ok">todo en orden</span>') + '</div>' +
    html +
    (alerta ? '<div style="margin-top:10px">' + btnTarea(
      'Revisar asistencia del ' + fmtFecha(fecha) + (sid ? ' en ' + (suc(sid)?.nombre || '') : ''),
      filas.filter(f => !f.t || !f.p).map(f => '· ' + calNombre(f.pid) + (f.t ? ' entró sin estar programado' : ' no marcó entrada')).join('\n')) +
      ' <span class="mini muted">dar seguimiento</span></div>' : '') +
    '</div>';
}

function cardObservaciones(fecha, sid) {
  const todas = db.checklists.filter(x => x.tipo === 'observacion' && (!sid || x.sucursalId === sid))
    .concat(cierresVivos().filter(c => c.novedades && (!sid || c.sucursalId === sid))
      .map(c => ({ id: 'cie-' + c.id, fecha: c.fecha, ts: c.ts, sucursalId: c.sucursalId, personalId: c.personalId, novedades: '🌙 (cierre) ' + c.novedades })))
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const delDia = fecha ? todas.filter(x => x.fecha === fecha) : [];
  const anteriores = (fecha ? todas.filter(x => x.fecha !== fecha) : todas).slice(0, 6);
  const fila = o => '<div class="item-linea">' +
    (per(o.personalId) ? avatarPersona(o.personalId) : '<div class="avatar">🗒️</div>') +
    '<div class="grow"><div class="mini">' + esc(o.novedades) + '</div>' +
    '<div class="mini muted">' + esc(per(o.personalId)?.nombre || 'Equipo') + ' · ' + esc(suc(o.sucursalId)?.nombre || '') +
    ' · ' + fmtFecha(o.fecha) + ' ' + fmtHora(o.ts) + '</div></div>' +
    btnTarea(o.novedades,
      'Observación de ' + (per(o.personalId)?.nombre || 'el equipo') + ' · ' + (suc(o.sucursalId)?.nombre || '') +
      ' · ' + fmtFecha(o.fecha)) +
    '</div>';
  if (!todas.length) return '<div class="card"><h3>🗒️ Notas y observaciones del equipo</h3><p class="muted mini">Aún no hay observaciones registradas.</p></div>';
  return '<div class="card"><h3>🗒️ Notas y observaciones del equipo</h3>' +
    (fecha ? ('<div class="mini muted" style="margin-bottom:4px">Del día seleccionado (' + fmtFecha(fecha) + '):</div>' +
      (delDia.length ? delDia.map(fila).join('') : '<p class="muted mini">Sin observaciones este día.</p>')) : '') +
    (anteriores.length ? '<div class="sep"></div><div class="mini muted" style="margin-bottom:4px">Anteriores:</div>' + anteriores.map(fila).join('') : '') +
    '</div>';
}
function verificarTarea(tid, fecha, sid) {
  const t = ACCIONES.find(x => x.id === tid);
  const key = tareaKey(fecha, sid, tid);
  let r = db.tareas.find(x => x.id === key);
  if (!r) { r = { id: key, fecha, sucursalId: sid, tareaId: tid, nombre: t.n, done: true, por: 'auto' }; db.tareas.push(r); }
  r.ver = !r.ver; r.verTs = Date.now(); r.ts = Date.now();
  guardarDB(); renderRevision();
  toast(r.ver ? '✔✔ Tarea verificada' : '↩️ Verificación retirada');
}
function guardarRevision(fecha, sid, pct) {
  const comentario = $('rev-comentario').value.trim();
  const s = suc(sid);
  // una revisión por día y sucursal: si se reenvía, actualiza la misma
  const idRev = idRevision(fecha, sid);
  const previa = db.revisiones.findIndex(r => r.id === idRev);
  if (previa >= 0) db.revisiones.splice(previa, 1);
  db.revisiones.unshift({
    id: idRev, ts: Date.now(), fecha, sucursalId: sid, pct,
    veredicto: revVeredicto, comentario
  });
  db.revisiones = db.revisiones.slice(0, 200);
  guardarDB();
  const emoji = revVeredicto === 'cumplido' ? '✅' : revVeredicto === 'ajustes' ? '⚠️' : '⛔';
  notificar('🔍 Revisión ' + emoji + ' — ' + (s?.nombre || '') + ' (' + fmtFecha(fecha) + ')',
    'Veredicto: ' + revVeredicto.toUpperCase() + '\nCumplimiento: ' + pct + '%' +
    (comentario ? '\nRetroalimentación: ' + comentario : ''), 'revision');
  toast('🔍 Revisión enviada — el equipo la verá en su panel');
  $('rev-comentario').value = '';
  renderRevision();
}

/* ═══════════ CALENDARIO DE TURNOS ═══════════
   Reemplaza la tabla que Toño armaba en Canva: se edita aquí, se ve en todos
   los dispositivos y se manda por WhatsApp como PNG.
   El PDF de referencia vive en SU PROPIA llave de localStorage — nunca dentro
   de db — porque pesa cientos de KB y haría lento cada guardado y cada sync. */
const CAL_DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
let calMes = mesISO(), calSuc = null, calEdit = false;

/* Cada color siguiente cambia de tono lo más posible respecto al anterior,
   para que dos personas del mismo calendario nunca queden en verdes
   parecidos. El color se GUARDA en el colaborador (p.color), así todos los
   dispositivos pintan igual y se puede cambiar a mano en Administrar. */
/* Elegidos maximizando la distancia perceptual entre todos los pares (voraz
   max-min sobre un barrido de tonos). El par más parecido queda a 137; los
   dos verdes que se confundían antes estaban a 115, y los primeros 8 —los que
   se usan en la práctica— no bajan de 196. */
const PALETA_PERSONAS = [
  '#FFD523', /* amarillo marca */ '#3131D8', /* azul     */ '#73E8E8', /* cian claro */
  '#D83153', /* carmín         */ '#31D831', /* verde    */ '#C573E8', /* orquídea   */
  '#A2E873', /* lima           */ '#3195D8', /* azul cielo */ '#E88A73', /* salmón   */
  '#31D895', /* menta          */ '#9531D8', /* morado   */ '#E949A9'  /* rosa       */
];
function colorPersona(pid) {
  const p = per(pid);
  if (p && p.color) return p.color;
  /* sin color guardado: por posición en la lista ordenada por id — el mismo
     orden en todos los dispositivos, así nadie cambia de color al sincronizar */
  const ids = db.personal.filter(x => !x.del).map(x => x.id).sort();
  const i = ids.indexOf(pid);
  return PALETA_PERSONAS[(i < 0 ? 0 : i) % PALETA_PERSONAS.length];
}
/* El color del colaborador se reutiliza en toda la app para reconocerlo de un
   vistazo: círculo con su inicial donde ya había avatar, y un punto antes del
   nombre en las tablas. Solo se agrega color, no se cambia ninguna estructura. */
function avatarPersona(pid, nombre) {
  const n = nombre || per(pid)?.nombre || '?';
  return '<div class="avatar" style="background:' + colorPersona(pid) + ';color:#1B0A2E">' +
    esc(n[0]) + '</div>';
}
const puntoPersona = pid => '<span class="pt-per" style="background:' + colorPersona(pid) + '"></span>';
/* primer color de la paleta que nadie esté usando */
function colorLibre() {
  const usados = new Set(db.personal.filter(p => !p.del && p.color).map(p => p.color));
  return PALETA_PERSONAS.find(c => !usados.has(c)) || PALETA_PERSONAS[usados.size % PALETA_PERSONAS.length];
}
const calNombre = pid => (per(pid)?.nombre || '¿?').split(' ')[0];
/* 13 → "1", 21 → "9": la notación corta que ya se usa en el calendario */
const hCorta = h => (h > 12 ? h - 12 : h);
const rangoCorto = t => hCorta(t.ini) + '-' + hCorta(t.fin);

function irCalendario() {
  if (!calSuc) calSuc = sucursalActual || (db.sucursales.filter(s => s.activa && !s.del)[0] || {}).id;
  ir('scr-cal');
}
/* ---------- nadie puede estar dos veces el mismo día ----------
   Ni con otro horario en la misma sucursal, ni en la otra: una persona no
   puede estar en Revolución y en Tulipanes el mismo día. */
function turnoDelDia(pid, fecha, exceptoId) {
  return db.calendario.find(x => !x.del && x.fecha === fecha &&
    x.personalId === pid && x.id !== exceptoId);
}
function avisoChoque(pid, choque) {
  return '⛔ ' + calNombre(pid) + ' ya tiene turno ese día en ' +
    (suc(choque.sucursalId)?.nombre || 'la otra sucursal') + ' (' + rangoCorto(choque) + ')';
}
/* clave fecha|persona de TODO el calendario, para los llenados masivos */
function ocupadosDelCalendario() {
  const s = new Set();
  db.calendario.forEach(x => { if (!x.del) s.add(x.fecha + '|' + x.personalId); });
  return s;
}
function calVolver() {
  calEdit = false;
  ir(sucursalActual ? 'scr-suc' : 'scr-portada');
}
function calTurnosDe(fecha, sid) {
  return db.calendario.filter(x => !x.del && x.fecha === fecha && x.sucursalId === sid)
    .sort((a, b) => (a.ini - b.ini) || calNombre(a.personalId).localeCompare(calNombre(b.personalId), 'es'));
}
/* semanas del mes empezando en lunes, igual que la hoja de Toño */
function semanasDelMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  const ultimo = new Date(y, m, 0).getDate();
  const off = (new Date(y, m - 1, 1).getDay() + 6) % 7;   // 0 = lunes
  const semanas = [];
  for (let d = 1 - off; d <= ultimo; d += 7) {
    const fila = [];
    for (let i = 0; i < 7; i++) fila.push(new Date(y, m - 1, d + i));
    semanas.push(fila);
  }
  return semanas;
}
function personasDelMes() {
  const ids = {};
  db.calendario.forEach(x => { if (!x.del && x.fecha.startsWith(calMes) && x.sucursalId === calSuc) ids[x.personalId] = 1; });
  return Object.keys(ids).map(id => ({ id, nombre: calNombre(id) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
function cambiarCalMes(d) {
  let [y, m] = calMes.split('-').map(Number);
  m += d; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
  calMes = y + '-' + String(m).padStart(2, '0');
  renderCalendario();
}
function calCambiaSuc(sid) { calSuc = sid; renderCalendario(); }

function renderCalendario() {
  if (!calSuc) calSuc = (db.sucursales.filter(s => s.activa && !s.del)[0] || {}).id;
  const s = suc(calSuc), [y, m] = calMes.split('-').map(Number);
  const sucs = db.sucursales.filter(x => x.activa && !x.del);
  const hoy = hoyISO();
  let html = '<div class="card"><div class="encabezado-seccion">' +
    '<h2 style="margin:0">📅 ' + MESES[m - 1] + ' ' + y + '</h2>' +
    '<div class="fila" style="flex:0"><button class="btn s mini" onclick="cambiarCalMes(-1)">←</button>' +
    '<button class="btn s mini" onclick="cambiarCalMes(1)">→</button></div></div>' +
    (sucs.length > 1 ? '<div class="seg" style="margin:0 0 14px">' + sucs.map(x =>
      '<button class="' + (x.id === calSuc ? 'on' : '') + '" onclick="calCambiaSuc(\'' + x.id + '\')">🏬 ' +
      esc(x.nombre) + '</button>').join('') + '</div>' : '') +
    (calEdit ? '<p class="mini" style="color:var(--amarillo);margin:0 0 10px">✏️ Modo edición: toca un día para asignar turnos.</p>' : '');
  // rejilla del mes, sobre papel claro con cualquier tema
  html += '<div class="cal-papel"><div class="cal-grid">' + CAL_DIAS.map(d => '<div class="cal-h">' + d + '</div>').join('');
  semanasDelMes(calMes).forEach(sem => sem.forEach(f => {
    const iso = isoLocal(f), fuera = f.getMonth() !== m - 1;
    const ts = fuera ? [] : calTurnosDe(iso, calSuc);
    /* En teléfono la celda mide ~41 px: ahí el nombre se oculta y a cada quien
       lo identifica su color (la leyenda de abajo dice de quién es). Se toca
       el día para ver el detalle completo. */
    html += '<div class="cal-d' + (fuera ? ' fuera' : '') + (iso === hoy ? ' hoy' : '') + (fuera ? '' : ' tocable') + '"' +
      (fuera ? '' : ' onclick="modalDiaCal(\'' + iso + '\')"') + '>' +
      '<div class="n">' + f.getDate() + '</div>' +
      ts.map(t => '<div class="cal-t" style="border-left-color:' + colorPersona(t.personalId) +
        ';background:' + colorPersona(t.personalId) + '26">' +
        '<b class="nom">' + esc(calNombre(t.personalId)) + '</b> ' + rangoCorto(t) + '</div>').join('') +
      '</div>';
  }));
  html += '</div></div>';
  // leyenda
  const gente = personasDelMes();
  if (gente.length) html += '<div class="cal-leyenda">' + gente.map(p =>
    '<span><i style="background:' + colorPersona(p.id) + '"></i>' + esc(p.nombre) + '</span>').join('') + '</div>';
  else html += '<p class="muted mini" style="margin-top:10px">Aún no hay turnos en este mes. Toca ✏️ Modificar para armarlo.</p>';
  html += '<div class="fila" style="margin-top:16px">' +
    '<button class="btn ' + (calEdit ? 'p' : 's') + '" onclick="calModificar()">' + (calEdit ? '✅ Listo' : '✏️ Modificar') + '</button>' +
    '<button class="btn p" onclick="calendarioPNG()">📤 Enviar PNG</button></div>';
  if (calEdit) html += '<button class="btn p gigante" style="margin-top:10px" onclick="calRapido()">⚡ Llenado rápido</button>' +
    '<div class="fila" style="margin-top:10px;flex-wrap:wrap">' +
    '<button class="btn s mini" onclick="calCopiar()">📋 Copiar una semana a otras</button>' +
    '<button class="btn s mini" onclick="calCopiarMes()">📅 Copiar calendario a otro mes</button>' +
    '<button class="btn s mini" onclick="calVaciarMes()">🗑️ Vaciar el mes</button></div>';
  html += '</div>';
  $('cal-contenido').innerHTML = html;
}

/* editar requiere PIN de Dirección (el calendario lo arma la Dirección) */
function calModificar() {
  if (calEdit) { calEdit = false; return renderCalendario(); }
  if (esAdmin) { calEdit = true; return renderCalendario(); }
  abrirPin('PIN de Dirección', pin => {
    if (pin === db.config.adminPin) { calEdit = true; renderCalendario(); }
    else toast('⛔ PIN incorrecto');
  });
}
function modalDiaCal(fecha) {
  const ts = calTurnosDe(fecha, calSuc);
  /* sin modo edición es solo consulta: en el teléfono es la forma de ver
     quién entra ese día, porque en la rejilla no cabe el nombre */
  if (!calEdit) {
    return abrirModal('<h3>📅 ' + fmtFecha(fecha) + '</h3>' +
      '<p class="mini muted">' + esc(suc(calSuc)?.nombre || '') + '</p>' +
      (ts.length ? ts.map(t => '<div class="item-linea">' +
        '<div class="avatar" style="background:' + colorPersona(t.personalId) + ';color:#1B0A2E">' +
        esc(calNombre(t.personalId)[0]) + '</div>' +
        '<div class="grow"><b>' + esc(per(t.personalId)?.nombre || '¿?') + '</b>' +
        '<div class="mini muted">' + t.ini + ':00 a ' + t.fin + ':00 · ' + rangoCorto(t) + '</div></div></div>').join('')
        : '<p class="muted mini">Nadie tiene turno este día.</p>') +
      '<button class="btn s" style="margin-top:12px" onclick="cerrarModal()">Cerrar</button>');
  }
  const gente = db.personal.filter(p => p.activo && !p.del);
  if (!gente.length) return toast('Primero da de alta al equipo en Dirección → Administrar');
  const horas = [];
  for (let h = 8; h <= 23; h++) horas.push(h);
  const opt = (h, sel) => '<option value="' + h + '"' + (h === sel ? ' selected' : '') + '>' +
    (h > 12 ? (h - 12) + ' pm' : h + (h === 12 ? ' pm' : ' am')) + '</option>';
  abrirModal('<div class="encabezado-seccion"><h3 style="margin:0">📅 ' + fmtFecha(fecha) + '</h3>' +
    (ts.length ? '<button class="btn s mini" onclick="modalCopiarDia(\'' + fecha + '\')">📋 Copiar día</button>' : '') +
    '</div>' +
    '<p class="mini muted">' + esc(suc(calSuc)?.nombre || '') + '</p>' +
    (ts.length ? ts.map(t => '<div class="item-linea">' +
      '<div class="avatar" style="background:' + colorPersona(t.personalId) + ';color:#1B0A2E">' +
      esc(calNombre(t.personalId)[0]) + '</div>' +
      '<div class="grow"><b>' + esc(calNombre(t.personalId)) + '</b>' +
      '<div class="mini muted">' + rangoCorto(t) + ' · ' + t.ini + ':00 a ' + t.fin + ':00</div></div>' +
      '<button class="btn s mini" onclick="modalEditarTurno(\'' + t.id + '\',\'' + fecha + '\')">✏️</button>' +
      '<button class="btn s mini" onclick="calBorrar(\'' + t.id + '\',\'' + fecha + '\')">🗑️</button></div>').join('')
      : '<p class="muted mini">Sin turnos este día.</p>') +
    '<div class="sep"></div><label>Agregar turno</label>' +
    '<select id="cal-per">' + gente.map(p => '<option value="' + p.id + '">' + esc(p.nombre) + '</option>').join('') + '</select>' +
    // atajos: los horarios de siempre a un toque; abajo siguen los manuales
    '<div class="fila" style="flex-wrap:wrap;gap:5px;margin-top:10px">' + CAL_HORARIOS.map(([a, b]) =>
      '<button class="btn s mini" onclick="calFijarHoras(' + a + ',' + b + ')">' +
      hCorta(a) + '-' + hCorta(b) + '</button>').join('') + '</div>' +
    '<div class="fila" style="margin-top:8px">' +
    '<div style="flex:1"><label class="mini">Entra</label><select id="cal-ini">' + horas.map(h => opt(h, 13)).join('') + '</select></div>' +
    '<div style="flex:1"><label class="mini">Sale</label><select id="cal-fin">' + horas.map(h => opt(h, 19)).join('') + '</select></div>' +
    '</div>' +
    '<button class="btn p" style="margin-top:12px" onclick="calAgregar(\'' + fecha + '\')">➕ Agregar</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="cerrarModal()">Cerrar</button>');
}
/* los atajos de horario llenan los dos selectores de golpe (sirven igual
   para el bloque de agregar y para el de editar) */
function calFijarHoras(a, b, idIni, idFin) {
  const i = $(idIni || 'cal-ini'), f = $(idFin || 'cal-fin');
  if (i) i.value = a;
  if (f) f.value = b;
  toast('⏰ Horario ' + hCorta(a) + '-' + hCorta(b));
}
/* editar un turno que ya está puesto: cambiar la hora o pasárselo a otra persona */
function modalEditarTurno(id, fecha) {
  const t = db.calendario.find(x => x.id === id); if (!t) return;
  const gente = db.personal.filter(p => (p.activo && !p.del) || p.id === t.personalId);
  const horas = []; for (let h = 8; h <= 23; h++) horas.push(h);
  const opt = (h, sel) => '<option value="' + h + '"' + (h === sel ? ' selected' : '') + '>' +
    (h > 12 ? (h - 12) + ' pm' : h + (h === 12 ? ' pm' : ' am')) + '</option>';
  abrirModal('<h3>✏️ Editar turno</h3>' +
    '<p class="mini muted">' + fmtFecha(fecha) + ' · ' + esc(suc(t.sucursalId)?.nombre || '') + '</p>' +
    '<label>Colaborador</label><select id="et-per">' + gente.map(p =>
      '<option value="' + p.id + '"' + (p.id === t.personalId ? ' selected' : '') + '>' +
      esc(p.nombre) + '</option>').join('') + '</select>' +
    '<div class="fila" style="flex-wrap:wrap;gap:5px;margin-top:10px">' + CAL_HORARIOS.map(([a, b]) =>
      '<button class="btn ' + (a === t.ini && b === t.fin ? 'p' : 's') + ' mini" ' +
      'onclick="calFijarHoras(' + a + ',' + b + ',\'et-ini\',\'et-fin\')">' +
      hCorta(a) + '-' + hCorta(b) + '</button>').join('') + '</div>' +
    '<div class="fila" style="margin-top:8px">' +
    '<div style="flex:1"><label class="mini">Entra</label><select id="et-ini">' + horas.map(h => opt(h, t.ini)).join('') + '</select></div>' +
    '<div style="flex:1"><label class="mini">Sale</label><select id="et-fin">' + horas.map(h => opt(h, t.fin)).join('') + '</select></div></div>' +
    '<button class="btn p" style="margin-top:14px" onclick="guardarEdicionTurno(\'' + id + '\',\'' + fecha + '\')">💾 Guardar cambios</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="modalDiaCal(\'' + fecha + '\')">← Volver al día</button>');
}
function guardarEdicionTurno(id, fecha) {
  const t = db.calendario.find(x => x.id === id); if (!t) return;
  const pid = $('et-per').value, ini = Number($('et-ini').value), fin = Number($('et-fin').value);
  if (!pid) return toast('Elige al colaborador');
  if (fin <= ini) return toast('La salida debe ser después de la entrada ⏰');
  const choque = turnoDelDia(pid, fecha, id);      // el propio turno no cuenta
  if (choque) return toast(avisoChoque(pid, choque));
  Object.assign(t, { personalId: pid, ini, fin, ts: Date.now() });
  guardarDB(); modalDiaCal(fecha); renderCalendario();
  toast('✏️ ' + calNombre(pid) + ' queda de ' + hCorta(ini) + '-' + hCorta(fin));
}
function calAgregar(fecha) {
  const pid = $('cal-per').value, ini = Number($('cal-ini').value), fin = Number($('cal-fin').value);
  if (!pid) return toast('Elige al colaborador');
  if (fin <= ini) return toast('La hora de salida debe ser después de la entrada ⏰');
  const choque = turnoDelDia(pid, fecha);
  if (choque) return toast(avisoChoque(pid, choque) + '. Edítalo en vez de agregar otro.');
  db.calendario.push({
    id: uid(), ts: Date.now(), fecha, sucursalId: calSuc, personalId: pid, ini, fin
  });
  guardarDB();
  modalDiaCal(fecha); renderCalendario();
  toast('📅 ' + calNombre(pid) + ' ' + hCorta(ini) + '-' + hCorta(fin) + ' el ' + fmtFecha(fecha));
}
function calBorrar(id, fecha) {
  const t = db.calendario.find(x => x.id === id); if (!t) return;
  t.del = true; t.ts = Date.now();          // marca, no borrado: así también se sincroniza
  guardarDB();
  modalDiaCal(fecha); renderCalendario();
  toast('🗑️ Turno quitado');
}
/* ---------- copiar la configuración de UN día a otros días ---------- */
let diaOrigen = '', diaDestinos = [], diaReemplazar = false;

function modalCopiarDia(fecha) {
  diaOrigen = fecha; diaDestinos = []; diaReemplazar = false;
  pintarCopiarDia();
}
/* qué pasaría al pegar, sin tocar nada */
function copiaDiaPlan() {
  const patron = calTurnosDe(diaOrigen, calSuc);
  const ocupados = ocupadosDelCalendario();
  const plan = { agregar: 0, quitar: 0, saltados: 0, porFecha: {} };
  diaDestinos.forEach(iso => {
    const existentes = calTurnosDe(iso, calSuc);
    if (diaReemplazar) {
      plan.quitar += existentes.length;
      existentes.forEach(t => ocupados.delete(iso + '|' + t.personalId));
    }
    patron.forEach(t => {
      const k = iso + '|' + t.personalId;
      if (ocupados.has(k)) { plan.saltados++; return; }
      ocupados.add(k);
      (plan.porFecha[iso] = plan.porFecha[iso] || []).push({ pid: t.personalId, ini: t.ini, fin: t.fin });
      plan.agregar++;
    });
  });
  return plan;
}
function pintarCopiarDia() {
  const patron = calTurnosDe(diaOrigen, calSuc);
  const [, m] = calMes.split('-').map(Number);
  const plan = copiaDiaPlan();
  // rejilla del mes: se tocan los días donde pegar
  let grid = '<div class="cal-papel"><div class="cal-grid cal-mini">' + CAL_DIAS.map(d => '<div class="cal-h">' + d + '</div>').join('');
  semanasDelMes(calMes).forEach(sem => sem.forEach(f => {
    const iso = isoLocal(f), fuera = f.getMonth() !== m - 1, esOrigen = iso === diaOrigen;
    const marcado = diaDestinos.includes(iso);
    grid += '<div class="cal-d' + (fuera ? ' fuera' : '') + (esOrigen ? ' origen' : '') +
      (marcado ? ' elegido' : '') + (!fuera && !esOrigen ? ' tocable' : '') + '"' +
      (!fuera && !esOrigen ? ' onclick="copiaDiaTocar(\'' + iso + '\')"' : '') + '>' +
      '<div class="n">' + f.getDate() + '</div>' +
      (fuera ? '' : (esOrigen ? '<div class="cal-t" style="border-left-color:var(--amarillo)">origen</div>'
        : calTurnosDe(iso, calSuc).map(t => '<div class="cal-t" style="border-left-color:' + colorPersona(t.personalId) +
          ';background:' + colorPersona(t.personalId) + '26"><b class="nom">' + esc(calNombre(t.personalId)) + '</b> ' +
          rangoCorto(t) + '</div>').join('') +
        (plan.porFecha[iso] || []).map(t => '<div class="cal-t nuevo" style="border-left-color:' + colorPersona(t.pid) +
          '"><b class="nom">' + esc(calNombre(t.pid)) + '</b> ' + hCorta(t.ini) + '-' + hCorta(t.fin) + '</div>').join(''))) +
      '</div>';
  }));
  grid += '</div></div>';
  const cont = $('modal-gen-cuerpo'); const sc = cont ? cont.scrollTop : 0;
  abrirModal('<h3>📋 Copiar el día ' + fmtFecha(diaOrigen) + '</h3>' +
    '<p class="mini muted">Se copia esta configuración:</p>' +
    '<div class="fila" style="flex-wrap:wrap;gap:6px;margin-bottom:10px">' + patron.map(t =>
      '<span class="cal-t" style="border-left-color:' + colorPersona(t.personalId) + ';background:' +
      colorPersona(t.personalId) + '26;padding:4px 8px"><b>' + esc(calNombre(t.personalId)) + '</b> ' +
      rangoCorto(t) + '</span>').join('') + '</div>' +
    '<label>Toca los días donde pegarla</label>' +
    '<p class="mini muted" style="margin:0 0 8px">Lo <b class="amar">punteado</b> es lo que quedaría.</p>' +
    grid +
    '<div class="fila" style="margin-top:10px;gap:6px">' +
    '<button class="btn s mini" onclick="copiaDiaMismoDiaSemana()">Todos los ' + CAL_DIAS[(new Date(diaOrigen + 'T12:00').getDay() + 6) % 7] + '</button>' +
    '<button class="btn s mini" onclick="diaDestinos=[];pintarCopiarDia()">Limpiar</button></div>' +
    '<div class="seg" style="margin:12px 0 0">' +
    '<button class="' + (!diaReemplazar ? 'on' : '') + '" onclick="diaReemplazar=false;pintarCopiarDia()">➕ Sumar</button>' +
    '<button class="' + (diaReemplazar ? 'on' : '') + '" onclick="diaReemplazar=true;pintarCopiarDia()">♻️ Reemplazar</button></div>' +
    '<div class="mini" style="margin-top:10px">Resultado: <b class="amar">+' + plan.agregar + ' turnos</b>' +
    (plan.quitar ? ' · <b style="color:var(--alerta)">−' + plan.quitar + '</b>' : '') +
    ' en ' + diaDestinos.length + ' día' + (diaDestinos.length === 1 ? '' : 's') + '</div>' +
    (plan.saltados ? '<p class="mini" style="color:var(--aviso);margin-top:6px">⛔ ' + plan.saltados +
      ' se saltan porque esa persona ya tiene turno ese día.</p>' : '') +
    '<button class="btn p gigante" style="margin-top:12px" onclick="aplicarCopiaDia()">📋 Pegar en ' +
    diaDestinos.length + ' día' + (diaDestinos.length === 1 ? '' : 's') + '</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="modalDiaCal(\'' + diaOrigen + '\')">← Volver al día</button>');
  const c2 = $('modal-gen-cuerpo'); if (c2) c2.scrollTop = sc;
}
function copiaDiaTocar(iso) {
  diaDestinos = diaDestinos.includes(iso) ? diaDestinos.filter(x => x !== iso) : diaDestinos.concat(iso);
  pintarCopiarDia();
}
/* atajo: marcar todos los días del mes que caen en el mismo día de la semana */
function copiaDiaMismoDiaSemana() {
  const dow = new Date(diaOrigen + 'T12:00').getDay();
  const [y, m] = calMes.split('-').map(Number), ultimo = new Date(y, m, 0).getDate();
  const todos = [];
  for (let d = 1; d <= ultimo; d++) {
    const f = new Date(y, m - 1, d), iso = isoLocal(f);
    if (f.getDay() === dow && iso !== diaOrigen) todos.push(iso);
  }
  const yaEstan = todos.every(x => diaDestinos.includes(x));
  diaDestinos = yaEstan ? diaDestinos.filter(x => !todos.includes(x))
    : diaDestinos.concat(todos.filter(x => !diaDestinos.includes(x)));
  pintarCopiarDia();
}
function aplicarCopiaDia() {
  if (!diaDestinos.length) return toast('Toca los días donde quieres pegarlo');
  const plan = copiaDiaPlan();
  if (!plan.agregar && !plan.quitar) return toast('Esos días ya están igual');
  if (diaReemplazar && plan.quitar &&
    !confirm('Se van a quitar ' + plan.quitar + ' turnos de los días elegidos. ¿Continuar?')) return;
  const patron = calTurnosDe(diaOrigen, calSuc).map(t => ({ pid: t.personalId, ini: t.ini, fin: t.fin }));
  const ocupados = ocupadosDelCalendario();
  let n = 0, saltados = 0;
  diaDestinos.forEach(iso => {
    if (diaReemplazar) calTurnosDe(iso, calSuc).forEach(t => {
      t.del = true; t.ts = Date.now(); ocupados.delete(iso + '|' + t.personalId);
    });
    patron.forEach(t => {
      const k = iso + '|' + t.pid;
      if (ocupados.has(k)) { saltados++; return; }
      ocupados.add(k);
      db.calendario.push({
        id: uid(), ts: Date.now(), fecha: iso, sucursalId: calSuc,
        personalId: t.pid, ini: t.ini, fin: t.fin
      });
      n++;
    });
  });
  guardarDB(); cerrarModal(); renderCalendario();
  toast('📋 ' + n + ' turnos pegados en ' + diaDestinos.length + ' días' +
    (saltados ? ' · ' + saltados + ' saltados por choque' : ''));
}

/* ---------- llenado rápido: armar el mes sin capturar día por día ---------- */
const CAL_HORARIOS = [[13, 19], [15, 21], [13, 21], [14, 21], [13, 17], [13, 20]];
const DOW_ORDEN = [1, 2, 3, 4, 5, 6, 0];        // lunes → domingo (getDay: 0 = domingo)
const DOW_ETI = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };
/* Varias reglas a la vez: "Alex los lunes 1-7" + "Alex los jueves 3-9" + …
   y abajo la vista previa del mes ya con todo aplicado. */
let rapReglas = [], rapAmbito = 'mes';

function rapSet(i, k, v) { rapReglas[i][k] = v; calRapido(); }
function rapHorario(i, a, b) { rapReglas[i].ini = a; rapReglas[i].fin = b; calRapido(); }
function rapDia(i, d) {
  const r = rapReglas[i];
  r.dias = r.dias.includes(d) ? r.dias.filter(x => x !== d) : r.dias.concat(d);
  calRapido();
}
function rapQuitarRegla(i) { rapReglas.splice(i, 1); calRapido(); }
function rapNuevaRegla() {
  const g = db.personal.filter(p => p.activo && !p.del);
  const ult = rapReglas[rapReglas.length - 1];
  // la nueva hereda a la persona (lo común es varias reglas para el mismo)
  rapReglas.push({ pid: ult ? ult.pid : g[0].id, ini: 15, fin: 21, dias: [] });
  calRapido();
}
/* qué turnos nuevos saldrían de las reglas: sin repetir lo que ya existe
   ni lo que otra regla ya generó */
function rapCalcular() {
  const [y, m] = calMes.split('-').map(Number);
  const ultimo = new Date(y, m, 0).getDate(), hoy = hoyISO();
  // ocupados = quién ya tiene turno ese día en CUALQUIER sucursal
  const ocupados = ocupadosDelCalendario();
  const nuevos = []; nuevos.saltados = 0;
  rapReglas.forEach(rg => {
    if (!rg.pid || !rg.dias.length || rg.fin <= rg.ini) return;
    for (let d = 1; d <= ultimo; d++) {
      const f = new Date(y, m - 1, d), iso = isoLocal(f);
      if (!rg.dias.includes(f.getDay())) continue;
      if (rapAmbito === 'resto' && iso < hoy) continue;
      const k = iso + '|' + rg.pid;
      if (ocupados.has(k)) { nuevos.saltados++; continue; }   // ya está ese día
      ocupados.add(k);
      nuevos.push({ fecha: iso, pid: rg.pid, ini: rg.ini, fin: rg.fin });
    }
  });
  return nuevos;
}
function rapVistaPrevia(nuevos) {
  const [, m] = calMes.split('-').map(Number);
  const porFecha = {};
  nuevos.forEach(n => { (porFecha[n.fecha] = porFecha[n.fecha] || []).push(n); });
  let h = '<div class="cal-papel"><div class="cal-grid cal-mini">' + CAL_DIAS.map(d => '<div class="cal-h">' + d + '</div>').join('');
  semanasDelMes(calMes).forEach(sem => sem.forEach(f => {
    const iso = isoLocal(f), fuera = f.getMonth() !== m - 1;
    h += '<div class="cal-d' + (fuera ? ' fuera' : '') + '"><div class="n">' + f.getDate() + '</div>' +
      (fuera ? '' : calTurnosDe(iso, calSuc).map(t =>
        '<div class="cal-t" style="border-left-color:' + colorPersona(t.personalId) +
        ';background:' + colorPersona(t.personalId) + '26">' +
        '<b class="nom">' + esc(calNombre(t.personalId)) + '</b> ' + rangoCorto(t) + '</div>').join('') +
        (porFecha[iso] || []).map(t =>
          '<div class="cal-t nuevo" style="border-left-color:' + colorPersona(t.pid) + '">' +
          '<b class="nom">' + esc(calNombre(t.pid)) + '</b> ' + hCorta(t.ini) + '-' + hCorta(t.fin) + '</div>').join('')) +
      '</div>';
  }));
  return h + '</div></div>';
}
function bloqueRegla(rg, i, gente) {
  const horas = []; for (let h = 8; h <= 23; h++) horas.push(h);
  const opt = (h, sel) => '<option value="' + h + '"' + (h === sel ? ' selected' : '') + '>' +
    (h > 12 ? (h - 12) + ' pm' : h + (h === 12 ? ' pm' : ' am')) + '</option>';
  const cuantos = rg.dias.length;
  return '<div class="rap-regla">' +
    '<div class="fila" style="align-items:center;gap:8px;margin-bottom:8px">' +
    '<span class="rap-num" style="background:' + colorPersona(rg.pid) + '">' + (i + 1) + '</span>' +
    '<select style="flex:1;margin:0" onchange="rapSet(' + i + ',\'pid\',this.value)">' +
    gente.map(p => '<option value="' + p.id + '"' + (p.id === rg.pid ? ' selected' : '') + '>' +
      esc(p.nombre) + '</option>').join('') + '</select>' +
    (rapReglas.length > 1 ? '<button class="btn s mini" onclick="rapQuitarRegla(' + i + ')">🗑️</button>' : '') +
    '</div>' +
    '<div class="fila" style="flex-wrap:wrap;gap:5px">' + CAL_HORARIOS.map(([a, b]) =>
      '<button class="btn ' + (a === rg.ini && b === rg.fin ? 'p' : 's') + ' mini" ' +
      'onclick="rapHorario(' + i + ',' + a + ',' + b + ')">' + hCorta(a) + '-' + hCorta(b) + '</button>').join('') +
    '</div>' +
    '<div class="fila" style="margin-top:6px;gap:8px">' +
    '<select style="flex:1;margin:0" onchange="rapSet(' + i + ',\'ini\',Number(this.value))">' +
    horas.map(h => opt(h, rg.ini)).join('') + '</select>' +
    '<select style="flex:1;margin:0" onchange="rapSet(' + i + ',\'fin\',Number(this.value))">' +
    horas.map(h => opt(h, rg.fin)).join('') + '</select></div>' +
    '<div class="fila" style="gap:4px;margin-top:6px">' + DOW_ORDEN.map(d =>
      '<button class="btn ' + (rg.dias.includes(d) ? 'p' : 's') + ' mini" style="flex:1;padding:9px 0" ' +
      'onclick="rapDia(' + i + ',' + d + ')">' + DOW_ETI[d] + '</button>').join('') + '</div>' +
    (cuantos ? '' : '<p class="mini" style="color:var(--aviso);margin:6px 0 0">Elige los días de esta regla.</p>') +
    '</div>';
}
function calRapido() {
  if (!calEdit) return toast('Toca ✏️ Modificar primero');
  const gente = db.personal.filter(p => p.activo && !p.del);
  if (!gente.length) return toast('Primero da de alta al equipo en Dirección → Administrar');
  rapReglas = rapReglas.filter(r => gente.some(p => p.id === r.pid));
  if (!rapReglas.length) rapReglas = [{ pid: gente[0].id, ini: 13, fin: 19, dias: [1] }];
  const [, m] = calMes.split('-').map(Number);
  const nuevos = rapCalcular();
  // conservar el scroll: el modal se vuelve a dibujar con cada toque
  const cont = $('modal-gen-cuerpo');
  const sc = cont ? cont.scrollTop : 0;
  abrirModal('<h3>⚡ Llenado rápido</h3>' +
    '<p class="mini muted">Agrega las reglas que necesites (misma persona en varios días y horarios) ' +
    'y mira abajo cómo va quedando el mes antes de guardar.</p>' +
    rapReglas.map((rg, i) => bloqueRegla(rg, i, gente)).join('') +
    '<button class="btn s" style="margin-top:10px" onclick="rapNuevaRegla()">➕ Agregar otra regla</button>' +
    '<label style="margin-top:14px">Aplicar en</label>' +
    '<div class="seg" style="margin:0">' +
    '<button class="' + (rapAmbito === 'mes' ? 'on' : '') + '" onclick="rapAmbito=\'mes\';calRapido()">Todo ' + MESES[m - 1] + '</button>' +
    '<button class="' + (rapAmbito === 'resto' ? 'on' : '') + '" onclick="rapAmbito=\'resto\';calRapido()">De hoy en adelante</button></div>' +
    '<div class="sep"></div>' +
    '<label>Vista previa de ' + MESES[m - 1] + '</label>' +
    '<p class="mini muted" style="margin:0 0 8px">Lo <b class="amar">punteado</b> es lo que se va a agregar.</p>' +
    (nuevos.saltados ? '<p class="mini" style="color:var(--aviso);margin:0 0 8px">⛔ Se saltan ' + nuevos.saltados +
      ' día' + (nuevos.saltados === 1 ? '' : 's') + ' porque esa persona ya tiene turno ahí (aquí o en la otra sucursal).</p>' : '') +
    rapVistaPrevia(nuevos) +
    '<button class="btn p gigante" style="margin-top:14px" onclick="rapGuardar()">💾 Guardar ' +
    nuevos.length + ' turno' + (nuevos.length === 1 ? '' : 's') + '</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="cerrarModal()">Cerrar</button>');
  const c2 = $('modal-gen-cuerpo'); if (c2) c2.scrollTop = sc;
}
function rapGuardar() {
  const nuevos = rapCalcular();
  if (!nuevos.length) return toast('No hay turnos nuevos que agregar');
  nuevos.forEach(n => db.calendario.push({
    id: uid(), ts: Date.now(), fecha: n.fecha, sucursalId: calSuc,
    personalId: n.pid, ini: n.ini, fin: n.fin
  }));
  guardarDB(); cerrarModal(); renderCalendario();
  toast('⚡ ' + nuevos.length + ' turnos agregados a ' + MESES[Number(calMes.split('-')[1]) - 1]);
}
/* ---------- copiar una semana a otras ----------
   Antes había dos botones que ADIVINABAN el origen y el destino, y cuando la
   suposición no se cumplía solo respondían "no hay semana vacía" o "ya tienen
   ese patrón", sin decir qué hacer. Ahora se elige a mano: de cuál semana, a
   cuáles, y si se reemplaza o se suma. */
let copOrigen = null, copDestinos = [], copReemplazar = false;

function semanasInfo() {
  const [, m] = calMes.split('-').map(Number);
  return semanasDelMes(calMes).map((sem, i) => {
    const dias = sem.filter(f => f.getMonth() === m - 1);
    const n = dias.reduce((a, f) => a + calTurnosDe(isoLocal(f), calSuc).length, 0);
    return {
      i, sem, turnos: n,
      eti: dias.length ? (dias[0].getDate() + '–' + dias[dias.length - 1].getDate()) : '',
      hay: dias.length > 0
    };
  }).filter(x => x.hay);
}
/* qué pasaría al aplicar, sin tocar nada */
function calCopiaPlan() {
  const [, m] = calMes.split('-').map(Number);
  const semanas = semanasDelMes(calMes);
  const org = semanas[copOrigen];
  const plan = { agregar: 0, quitar: 0, saltados: 0 };
  if (!org) return plan;
  const ocupados = ocupadosDelCalendario();
  copDestinos.forEach(di => {
    const dst = semanas[di]; if (!dst) return;
    dst.forEach((f, i) => {
      if (f.getMonth() !== m - 1) return;
      const isoD = isoLocal(f);
      const existentes = calTurnosDe(isoD, calSuc);
      if (copReemplazar) {
        plan.quitar += existentes.length;
        // al borrarlos, esas personas quedan libres ese día
        existentes.forEach(t => ocupados.delete(isoD + '|' + t.personalId));
      }
      calTurnosDe(isoLocal(org[i]), calSuc).forEach(t => {
        const k = isoD + '|' + t.personalId;
        if (ocupados.has(k)) { plan.saltados++; return; }   // ya tiene turno ese día
        ocupados.add(k);
        plan.agregar++;
      });
    });
  });
  return plan;
}
function calCopiar() {
  if (!calEdit) return toast('Toca ✏️ Modificar primero');
  const info = semanasInfo();
  if (info.length < 2) return toast('Este mes no tiene dos semanas que comparar');
  // por defecto: la semana con más turnos como origen, el resto como destino
  if (copOrigen === null || !info.some(x => x.i === copOrigen)) {
    copOrigen = info.reduce((a, b) => (b.turnos > a.turnos ? b : a), info[0]).i;
    copDestinos = [];
  }
  copDestinos = copDestinos.filter(d => d !== copOrigen && info.some(x => x.i === d));
  const plan = calCopiaPlan();
  const org = info.find(x => x.i === copOrigen);
  abrirModal('<h3>📋 Copiar una semana</h3>' +
    '<p class="mini muted">Elige de qué semana copiar los turnos y a cuáles pegarlos. ' +
    'Se respeta el día: lo del lunes cae en lunes.</p>' +
    '<label>Copiar DE esta semana</label>' +
    '<div class="fila" style="flex-wrap:wrap;gap:6px">' + info.map(x =>
      '<button class="btn ' + (x.i === copOrigen ? 'p' : 's') + ' mini" onclick="copSetOrigen(' + x.i + ')">' +
      x.eti + ' <span class="mini muted">(' + x.turnos + ')</span></button>').join('') + '</div>' +
    (org && !org.turnos ? '<p class="mini" style="color:var(--aviso);margin:8px 0 0">Esa semana está vacía: elige una que tenga turnos.</p>' : '') +
    '<label style="margin-top:14px">Pegar EN estas semanas</label>' +
    '<div class="fila" style="flex-wrap:wrap;gap:6px">' + info.filter(x => x.i !== copOrigen).map(x =>
      '<button class="btn ' + (copDestinos.includes(x.i) ? 'p' : 's') + ' mini" onclick="copDestino(' + x.i + ')">' +
      x.eti + ' <span class="mini muted">(' + x.turnos + ')</span></button>').join('') +
    '<button class="btn s mini" onclick="copTodas()">Todas</button></div>' +
    '<div class="sep"></div>' +
    '<div class="seg" style="margin:0">' +
    '<button class="' + (!copReemplazar ? 'on' : '') + '" onclick="copReemplazar=false;calCopiar()">➕ Sumar</button>' +
    '<button class="' + (copReemplazar ? 'on' : '') + '" onclick="copReemplazar=true;calCopiar()">♻️ Reemplazar</button></div>' +
    '<p class="mini muted" style="margin-top:6px">' + (copReemplazar
      ? 'Reemplazar: borra lo que haya en esas semanas y deja solo la copia.'
      : 'Sumar: conserva lo que ya hay y agrega lo que falte, sin repetir.') + '</p>' +
    '<div class="mini" style="margin-top:12px">Resultado: <b class="amar">+' + plan.agregar + ' turnos</b>' +
    (plan.quitar ? ' · <b style="color:var(--alerta)">−' + plan.quitar + ' que se quitan</b>' : '') + '</div>' +
    (plan.saltados ? '<p class="mini" style="color:var(--aviso);margin-top:6px">⛔ ' + plan.saltados +
      ' se saltan porque esa persona ya tiene turno ese día.</p>' : '') +
    '<button class="btn p gigante" style="margin-top:12px" onclick="calAplicarCopia()">📋 Copiar</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="cerrarModal()">Cerrar</button>');
}
function copSetOrigen(i) { copOrigen = i; copDestinos = copDestinos.filter(d => d !== i); calCopiar(); }
function copDestino(i) {
  copDestinos = copDestinos.includes(i) ? copDestinos.filter(d => d !== i) : copDestinos.concat(i);
  calCopiar();
}
function copTodas() {
  const otras = semanasInfo().map(x => x.i).filter(i => i !== copOrigen);
  copDestinos = copDestinos.length === otras.length ? [] : otras;
  calCopiar();
}
function calAplicarCopia() {
  const [, m] = calMes.split('-').map(Number);
  const semanas = semanasDelMes(calMes);
  const org = semanas[copOrigen];
  if (!org) return toast('Elige la semana de origen');
  if (!copDestinos.length) return toast('Elige a qué semana(s) copiarla');
  const plan = calCopiaPlan();
  if (!plan.agregar && !plan.quitar) return toast('Esas semanas ya están igual que la de origen');
  if (copReemplazar && plan.quitar &&
    !confirm('Se van a quitar ' + plan.quitar + ' turnos de las semanas destino y dejar la copia. ¿Continuar?')) return;
  // se lee el origen ANTES de tocar nada, por si algo se traslapa
  const patron = org.map(f => calTurnosDe(isoLocal(f), calSuc).map(t => ({ pid: t.personalId, ini: t.ini, fin: t.fin })));
  const ocupados = ocupadosDelCalendario();
  let n = 0, saltados = 0;
  copDestinos.forEach(di => {
    const dst = semanas[di]; if (!dst) return;
    dst.forEach((f, i) => {
      if (f.getMonth() !== m - 1) return;
      const iso = isoLocal(f);
      if (copReemplazar) calTurnosDe(iso, calSuc).forEach(t => {
        t.del = true; t.ts = Date.now(); ocupados.delete(iso + '|' + t.personalId);
      });
      patron[i].forEach(t => {
        const k = iso + '|' + t.pid;
        if (ocupados.has(k)) { saltados++; return; }   // esa persona ya trabaja ese día
        ocupados.add(k);
        db.calendario.push({
          id: uid(), ts: Date.now(), fecha: iso, sucursalId: calSuc,
          personalId: t.pid, ini: t.ini, fin: t.fin
        });
        n++;
      });
    });
  });
  guardarDB(); cerrarModal(); renderCalendario();
  toast('📋 ' + n + ' turnos copiados' + (saltados ? ' · ' + saltados + ' saltados por choque de día' : ''));
}
/* ---------- copiar el mes completo a otro mes ----------
   "La base de julio pégala en agosto": se copia semana con semana y día con
   día de la semana, así los lunes siguen cayendo en lunes. */
let mesDestino = '', mesReemplazar = false;

function mesMas(mes, d) {
  let [y, m] = mes.split('-').map(Number);
  m += d; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
  return y + '-' + String(m).padStart(2, '0');
}
const nombreMes = mes => MESES[Number(mes.split('-')[1]) - 1] + ' ' + mes.split('-')[0];

/* plan de copia de calMes → mesDestino, sin tocar nada */
function calCopiaMesPlan() {
  const org = semanasDelMes(calMes), dst = semanasDelMes(mesDestino);
  const mO = Number(calMes.split('-')[1]), mD = Number(mesDestino.split('-')[1]);
  const plan = { agregar: 0, quitar: 0, semanas: Math.min(org.length, dst.length), sinCubrir: 0, saltados: 0 };
  const ocupados = ocupadosDelCalendario();
  /* Días del mes destino que NO reciben ningún patrón: o porque su semana va
     más allá de las del origen, o porque el día que les toca del origen cae
     fuera de ese mes. Se cuentan para avisarlo en vez de dejarlo pasar callado.
     (Un día que sí mapea a un día de descanso cuenta como cubierto.) */
  for (let s = 0; s < dst.length; s++) {
    for (let i = 0; i < 7; i++) {
      const fD = dst[s][i];
      if (fD.getMonth() !== mD - 1) continue;
      const fO = org[s] && org[s][i];
      if (!fO || fO.getMonth() !== mO - 1) plan.sinCubrir++;
    }
  }
  for (let s = 0; s < plan.semanas; s++) {
    for (let i = 0; i < 7; i++) {
      const fO = org[s][i], fD = dst[s][i];
      if (fO.getMonth() !== mO - 1 || fD.getMonth() !== mD - 1) continue;
      const isoD = isoLocal(fD);
      const existentes = calTurnosDe(isoD, calSuc);
      if (mesReemplazar) {
        plan.quitar += existentes.length;
        existentes.forEach(t => ocupados.delete(isoD + '|' + t.personalId));
      }
      calTurnosDe(isoLocal(fO), calSuc).forEach(t => {
        const k = isoD + '|' + t.personalId;
        if (ocupados.has(k)) { plan.saltados++; return; }
        ocupados.add(k);
        plan.agregar++;
      });
    }
  }
  return plan;
}
function calCopiarMes() {
  if (!calEdit) return toast('Toca ✏️ Modificar primero');
  const enOrigen = db.calendario.filter(x => !x.del && x.sucursalId === calSuc && x.fecha.startsWith(calMes)).length;
  if (!enOrigen) return toast('Este mes está vacío: no hay nada que copiar');
  if (!mesDestino || mesDestino === calMes) mesDestino = mesMas(calMes, 1);
  const plan = calCopiaMesPlan();
  abrirModal('<h3>📅 Copiar calendario a otro mes</h3>' +
    '<p class="mini muted">Se copia <b class="amar">' + nombreMes(calMes) + '</b> (' + enOrigen + ' turnos) ' +
    'semana con semana, respetando el día: lo del lunes cae en lunes.</p>' +
    '<label>Pegar en</label>' +
    '<div class="fila" style="align-items:center;gap:10px">' +
    '<button class="btn s mini" onclick="mesDestino=mesMas(mesDestino,-1);calCopiarMes()">←</button>' +
    '<div class="grow centrado"><b class="amar" style="font-size:1.05rem">' + nombreMes(mesDestino) + '</b></div>' +
    '<button class="btn s mini" onclick="mesDestino=mesMas(mesDestino,1);calCopiarMes()">→</button></div>' +
    '<div class="sep"></div>' +
    '<div class="seg" style="margin:0">' +
    '<button class="' + (!mesReemplazar ? 'on' : '') + '" onclick="mesReemplazar=false;calCopiarMes()">➕ Sumar</button>' +
    '<button class="' + (mesReemplazar ? 'on' : '') + '" onclick="mesReemplazar=true;calCopiarMes()">♻️ Reemplazar</button></div>' +
    '<p class="mini muted" style="margin-top:6px">' + (mesReemplazar
      ? 'Reemplazar: borra lo que haya en ' + nombreMes(mesDestino) + ' y deja solo la copia.'
      : 'Sumar: conserva lo que ya haya en ' + nombreMes(mesDestino) + ' y agrega lo que falte.') + '</p>' +
    '<div class="mini" style="margin-top:12px">Resultado: <b class="amar">+' + plan.agregar + ' turnos</b>' +
    (plan.quitar ? ' · <b style="color:var(--alerta)">−' + plan.quitar + ' que se quitan</b>' : '') + '</div>' +
    (plan.saltados ? '<p class="mini" style="color:var(--aviso);margin-top:6px">⛔ ' + plan.saltados +
      ' se saltan porque esa persona ya tiene turno ese día.</p>' : '') +
    (plan.sinCubrir
      ? '<p class="mini" style="color:var(--aviso);margin-top:6px">⚠️ Los meses no empatan día por día: ' +
        plan.sinCubrir + ' día' + (plan.sinCubrir === 1 ? '' : 's') + ' de ' + nombreMes(mesDestino) +
        ' se quedan sin patrón y hay que ponerlos a mano (quedan en blanco en el calendario).</p>'
      : '<p class="mini muted" style="margin-top:4px">Los dos meses empatan completos: no queda ningún día suelto.</p>') +
    '<button class="btn p gigante" style="margin-top:12px" onclick="calAplicarCopiaMes()">📅 Copiar a ' +
    MESES[Number(mesDestino.split('-')[1]) - 1] + '</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="cerrarModal()">Cerrar</button>');
}
function calAplicarCopiaMes() {
  const plan = calCopiaMesPlan();
  if (!plan.agregar && !plan.quitar) return toast(nombreMes(mesDestino) + ' ya está igual');
  if (mesReemplazar && plan.quitar &&
    !confirm('Se van a quitar ' + plan.quitar + ' turnos de ' + nombreMes(mesDestino) + '. ¿Continuar?')) return;
  const org = semanasDelMes(calMes), dst = semanasDelMes(mesDestino);
  const mO = Number(calMes.split('-')[1]), mD = Number(mesDestino.split('-')[1]);
  // se lee el patrón ANTES de escribir, por si origen y destino se traslapan
  const patron = [];
  for (let s = 0; s < Math.min(org.length, dst.length); s++) {
    patron.push(org[s].map(f => f.getMonth() === mO - 1
      ? calTurnosDe(isoLocal(f), calSuc).map(t => ({ pid: t.personalId, ini: t.ini, fin: t.fin })) : []));
  }
  const ocupados = ocupadosDelCalendario();
  let n = 0, saltados = 0;
  patron.forEach((sem, s) => sem.forEach((turnos, i) => {
    const fD = dst[s][i];
    if (fD.getMonth() !== mD - 1) return;
    const isoD = isoLocal(fD);
    if (mesReemplazar) calTurnosDe(isoD, calSuc).forEach(t => {
      t.del = true; t.ts = Date.now(); ocupados.delete(isoD + '|' + t.personalId);
    });
    turnos.forEach(t => {
      const k = isoD + '|' + t.pid;
      if (ocupados.has(k)) { saltados++; return; }
      ocupados.add(k);
      db.calendario.push({
        id: uid(), ts: Date.now(), fecha: isoD, sucursalId: calSuc,
        personalId: t.pid, ini: t.ini, fin: t.fin
      });
      n++;
    });
  }));
  const destino = mesDestino;
  guardarDB(); cerrarModal();
  calMes = destino; renderCalendario();     // te deja parado en el mes copiado
  toast('📅 ' + n + ' turnos copiados a ' + nombreMes(destino) +
    (saltados ? ' · ' + saltados + ' saltados por choque de día' : ''));
}
function calVaciarMes() {
  const del = db.calendario.filter(x => !x.del && x.fecha.startsWith(calMes) && x.sucursalId === calSuc);
  if (!del.length) return toast('Este mes ya está vacío');
  if (!confirm('¿Quitar los ' + del.length + ' turnos de ' + MESES[Number(calMes.split('-')[1]) - 1] +
    ' en ' + (suc(calSuc)?.nombre || '') + '?')) return;
  del.forEach(t => { t.del = true; t.ts = Date.now(); });
  guardarDB(); renderCalendario();
  toast('🗑️ Mes vaciado');
}

/* ---------- exportar el calendario como PNG ---------- */
async function calendarioPNG() {
  const s = suc(calSuc), [y, m] = calMes.split('-').map(Number);
  const semanas = semanasDelMes(calMes), gente = personasDelMes();
  if (!gente.length) return toast('Arma el calendario antes de enviarlo 📅');
  toast('🖼️ Generando imagen…');
  try { await document.fonts.ready; } catch (e) { }
  const x0 = 40, W = 1480, celW = (W - x0 * 2) / 7, celH = 152, y0 = 214;
  const legY = y0 + semanas.length * celH + 52, H = legY + 96;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  /* la imagen sale en claro igual que el calendario en pantalla: es lo que se
     manda por WhatsApp y así los colores de cada quien resaltan */
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);
  c.textAlign = 'center'; c.fillStyle = '#111114';
  c.font = '700 46px Poppins, system-ui, sans-serif';
  c.fillText('CALENDARIO ' + (s?.nombre || '').toUpperCase(), W / 2, 80);
  c.fillStyle = '#5B21B6'; c.font = '600 34px Poppins, system-ui, sans-serif';
  c.fillText(MESES[m - 1].toUpperCase() + ' ' + y, W / 2, 130);
  c.fillStyle = '#5C5C66'; c.font = '700 20px Poppins, system-ui, sans-serif';
  ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
    .forEach((d, i) => c.fillText(d, x0 + celW * i + celW / 2, y0 - 20));
  semanas.forEach((sem, r) => sem.forEach((f, i) => {
    const x = x0 + celW * i, yy = y0 + celH * r, fuera = f.getMonth() !== m - 1;
    c.fillStyle = fuera ? '#FAFAFC' : '#F4F4F8';
    c.fillRect(x + 3, yy + 3, celW - 6, celH - 6);
    c.strokeStyle = '#E4E4EA'; c.lineWidth = 2;
    c.strokeRect(x + 3, yy + 3, celW - 6, celH - 6);
    c.textAlign = 'left';
    c.fillStyle = fuera ? '#B4B4BE' : '#111114';
    c.font = '800 25px Poppins, system-ui, sans-serif';
    c.fillText(String(f.getDate()), x + 16, yy + 36);
    if (fuera) return;
    const lista = calTurnosDe(isoLocal(f), calSuc);
    lista.slice(0, 4).forEach((t, k) => {
      const ty = yy + 62 + k * 25;
      // bloque de color ancho: es lo que identifica a la persona
      c.fillStyle = colorPersona(t.personalId);
      c.fillRect(x + 12, ty - 15, 16, 21);
      c.fillStyle = '#111114'; c.font = '600 18px Poppins, system-ui, sans-serif';
      c.fillText(calNombre(t.personalId) + '  ' + rangoCorto(t), x + 36, ty + 2);
    });
    if (lista.length > 4) {
      c.fillStyle = '#5C5C66'; c.font = '400 15px Poppins, system-ui, sans-serif';
      c.fillText('+' + (lista.length - 4) + ' más', x + 36, yy + 62 + 4 * 25);
    }
  }));
  c.textAlign = 'left'; c.font = '600 21px Poppins, system-ui, sans-serif';
  let lx = x0;
  gente.forEach(p => {
    c.fillStyle = colorPersona(p.id); c.fillRect(lx, legY - 17, 22, 22);
    c.fillStyle = '#111114'; c.fillText(p.nombre, lx + 32, legY);
    lx += 52 + c.measureText(p.nombre).width;
  });
  c.font = '400 18px Poppins, system-ui, sans-serif'; c.fillStyle = '#5C5C66';
  c.fillText('El Anillo del Cíclope · El Ojo Maestro · actualizado el ' + fmtFecha(hoyISO()), x0, legY + 48);
  const nombre = 'Calendario-' + (s?.nombre || 'sucursal').replace(/\s+/g, '-') + '-' + calMes + '.png';
  cv.toBlob(async blob => {
    if (!blob) return toast('⚠️ No se pudo generar la imagen');
    // en iPhone/Android sale la hoja de compartir (WhatsApp); si no, se descarga
    try {
      const file = new File([blob], nombre, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: nombre });
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('⬇️ ' + nombre);
  }, 'image/png');
}

/* ═══════════ TEMA CLARO / OSCURO ═══════════ */
function toggleTema() {
  const claro = document.documentElement.dataset.tema === 'claro';
  if (claro) { delete document.documentElement.dataset.tema; localStorage.setItem('ojo_tema', 'oscuro'); }
  else { document.documentElement.dataset.tema = 'claro'; localStorage.setItem('ojo_tema', 'claro'); }
  aplicarLogo();
  toast(claro ? '🌌 Modo oscuro — la noche cósmica de Cyclos' : '☀️ Modo claro');
}
function initTema() {
  /* claro por defecto (es el que pidió Toño); el toggle 🌓 sigue mandando y
     lo que elija cada dispositivo se respeta */
  if (localStorage.getItem('ojo_tema') === 'oscuro') delete document.documentElement.dataset.tema;
  else document.documentElement.dataset.tema = 'claro';
  aplicarLogo();
}
/* en tema claro va el logotipo negro; en oscuro el amarillo de siempre */
function aplicarLogo() {
  const claro = document.documentElement.dataset.tema === 'claro';
  const src = claro ? 'img/logo-negro.png'
    : (window.CICLOPE_ASSETS ? 'data:image/png;base64,' + CICLOPE_ASSETS.logo : '');
  if (!src) return;
  document.querySelectorAll('.logo-img').forEach(i => i.src = src);
  const lp = $('logo-portada'); if (lp) lp.src = src;
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
  if (tabDir === 'semana') c.innerHTML = dirSemana();
  if (tabDir === 'nomina') c.innerHTML = dirNomina();
  if (tabDir === 'inv') c.innerHTML = dirInventarios();
  if (tabDir === 'evid') c.innerHTML = dirEvidencias();
  if (tabDir === 'admin') c.innerHTML = dirAdmin();
}

/* --- HOY --- */
function dirHoy() {
  const hoy = hoyISO();
  const ventasHoy = cierresVivos().filter(x => x.fecha === hoy).reduce((a, x) => a + x.ventas, 0);
  const abiertos = turnosAbiertos();
  const tareasHoy = db.tareas.filter(x => x.fecha === hoy && x.done).length;
  const propHoyTot = propinasDe(hoy).reduce((a, x) => a + x.monto, 0);
  let html = '<div class="grid c4">' +
    '<div class="stat verde"><div class="v">' + fmt$(ventasHoy) + '</div><div class="l">ventas de hoy</div></div>' +
    '<div class="stat"><div class="v">' + abiertos.length + '</div><div class="l">en turno ahora</div></div>' +
    '<div class="stat"><div class="v">' + tareasHoy + '</div><div class="l">tareas hechas hoy</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(propHoyTot) + '</div><div class="l">💳 propinas hoy</div></div></div>';
  db.sucursales.filter(s => s.activa && !s.del).forEach(s => {
    const enTurno = turnosAbiertos(s.id);
    const falt = faltantes(s.id);
    const cierresHoy = cierresVivos().filter(x => x.fecha === hoy && x.sucursalId === s.id);
    const a = avanceDia(hoy, s.id);
    const revS = db.revisiones.find(r => r.sucursalId === s.id);
    html += '<div class="card"><div class="encabezado-seccion"><h3 style="margin:0">🏬 ' + esc(s.nombre) + '</h3>' +
      (falt.length ? '<span class="badge comprar">🛒 ' + falt.length + ' por comprar</span>' : '<span class="badge ok">stock OK</span>') + '</div>';
    html += enTurno.length ? enTurno.map(t => {
      const p = per(t.personalId);
      return '<div class="item-linea">' + avatarPersona(t.personalId, p?.nombre) + '<div class="grow"><b>' + esc(p?.nombre || '') +
        '</b><div class="mini muted">' + (t.tipo === 'matutino' ? '☀️' : '🌙') + ' entró ' + fmtHora(t.entrada) + '</div></div><span class="badge mor">en turno</span></div>';
    }).join('') : '<p class="muted mini">Nadie en turno.</p>';
    const evHoyS = db.evidencias.filter(e => e.fecha === hoy && e.sucursalId === s.id).length;
    html += '<div class="sep"></div><div class="fila mini muted">' +
      '<span>✅ Acciones: <b class="amar">' + a.hechas + '/' + a.total + '</b></span>' +
      '<span>📸 Registros: <b class="amar">' + a.regHechos + '/' + a.regTotal + '</b></span>' +
      '<span>📎 Evidencias: <b class="amar">' + evHoyS + '</b></span>' +
      '<span>Cierres: <b class="amar">' + cierresHoy.length + '</b>' +
      (cierresHoy.length ? ' · ' + fmt$(cierresHoy.reduce((a, x) => a + x.ventas, 0)) : '') + '</span>' +
      (revS ? '<span>🔍 Últ. revisión: <b class="amar">' + (revS.veredicto === 'cumplido' ? '✅' : revS.veredicto === 'ajustes' ? '⚠️' : '⛔') +
        ' ' + revS.pct + '%</b></span>' : '') + '</div>';
    if (falt.length) html += '<div class="mini" style="margin-top:8px;color:var(--alerta)">Faltan: ' +
      falt.slice(0, 8).map(p => esc(p.nombre)).join(', ') + (falt.length > 8 ? ' +' + (falt.length - 8) + ' más' : '') + '</div>' +
      '<div style="margin-top:8px">' + btnTarea('Comprar para ' + s.nombre + ' (' + falt.length + ' productos)',
        falt.map(p => '· ' + p.nombre + ' — mín ' + p.minimo).join('\n')) + ' <span class="mini muted">crear la compra como tarea</span></div>';
    html += '</div>';
  });
  // asistencia contra lo programado, en las dos sucursales
  html += cardProgramadoVsReal(hoy, null);
  // notas y observaciones del equipo (mismo bloque que ve Supervisión, de todas las sucursales)
  html += cardObservaciones(hoy, null);
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
  const cierres = cierresVivos().filter(c => c.fecha.startsWith(mesVista));
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
    db.sucursales.filter(s => s.activa && !s.del).map(s => '<div class="stat"><div class="v">' + fmt$(porSuc[s.id] || 0) + '</div><div class="l">' + esc(s.nombre) + '</div></div>').join('') + '</div>';
  const fechas = Object.keys(dias).sort().reverse();
  html += '<div class="card"><h3>Cierres por día</h3><div class="tabla-wrap"><table><tr><th>Fecha</th>' +
    db.sucursales.filter(s => s.activa && !s.del).map(s => '<th class="num">' + esc(s.nombre) + '</th>').join('') + '<th class="num">Total día</th></tr>';
  if (!fechas.length) html += '<tr><td colspan="9" class="muted">Aún no hay cierres este mes.</td></tr>';
  fechas.forEach(f => {
    const tot = Object.values(dias[f]).reduce((a, b) => a + b, 0);
    html += '<tr><td>' + fmtFecha(f) + '</td>' + db.sucursales.filter(s => s.activa && !s.del).map(s =>
      '<td class="num">' + (dias[f][s.id] ? fmt$(dias[f][s.id]) : '—') + '</td>').join('') +
      '<td class="num"><b class="amar">' + fmt$(tot) + '</b></td></tr>';
  });
  html += '</table></div></div>';
  // detalle de cierres
  html += '<div class="card"><h3>Detalle de cierres</h3>' +
    '<p class="mini muted">Si algún día quedó con un cierre de más o con un monto equivocado, quítalo aquí ' +
    'y las ventas del mes se recalculan solas.</p>' +
    '<div class="tabla-wrap"><table><tr><th>Fecha</th><th>Sucursal</th><th>Responsable</th><th class="num">Ventas</th><th class="num">Caja</th><th>Checklist</th><th>Novedades</th><th></th></tr>' +
    (cierres.map(c => '<tr><td>' + fmtFecha(c.fecha) + '</td><td>' + esc(suc(c.sucursalId)?.nombre || '') + '</td><td>' +
      puntoPersona(c.personalId) + esc(per(c.personalId)?.nombre || '—') +
      '</td><td class="num">' + fmt$(c.ventas) + '</td><td class="num">' + fmt$(c.caja) + '</td><td>' + (c.hechos ?? '—') + '/' + totalCierre(c) +
      '</td><td class="mini">' + esc(c.novedades || '') +
      '</td><td><button class="btn s mini" onclick="borrarCierre(\'' + c.id + '\')">🗑️</button></td></tr>').join('')
      || '<tr><td colspan="8" class="muted">Sin cierres.</td></tr>') +
    '</table></div></div>';
  return html;
}
/* quitar un cierre equivocado: se marca, no se borra, para que la baja también
   viaje a los demás dispositivos */
function borrarCierre(id) {
  const c = db.cierres.find(x => x.id === id); if (!c) return;
  if (!confirm('¿Quitar el cierre del ' + fmtFecha(c.fecha) + ' en ' + (suc(c.sucursalId)?.nombre || '') +
    ' por ' + fmt$(c.ventas) + '?\n\nLas ventas del mes se recalculan sin él.')) return;
  c.del = true; c.ts = Date.now();
  guardarDB(); renderDireccion();
  toast('🗑️ Cierre quitado · ventas del mes actualizadas');
}
function cambiarMes(d) {
  let [y, m] = mesVista.split('-').map(Number);
  m += d; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
  mesVista = y + '-' + String(m).padStart(2, '0');
  renderDireccion();
}
function exportarMesCSV() {
  const cierres = cierresVivos().filter(c => c.fecha.startsWith(mesVista));
  let csv = 'Fecha,Sucursal,Responsable,VentasNetas,DineroCaja,Checklist,Novedades\n';
  cierres.forEach(c => csv += [c.fecha, suc(c.sucursalId)?.nombre || '', per(c.personalId)?.nombre || '',
    c.ventas, c.caja, (c.hechos ?? '') + '/' + totalCierre(c), '"' + (c.novedades || '').replace(/"/g, "'") + '"'].join(',') + '\n');
  descargar('cierres-' + mesVista + '.csv', csv);
  toast('⬇️ CSV del mes descargado');
}

/* --- SEMANA: cuánto se le paga a cada quien el domingo ---
   Contador simple para Toño: nombre, días trabajados, horas extra y propinas
   digitales de la semana en curso (lunes → domingo, día de paga completa). */
let semanaRef = hoyISO();               // cualquier día dentro de la semana mostrada
const isoLocal = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function rangoSemana(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const f = new Date(y, m - 1, d);
  const dow = (f.getDay() + 6) % 7;     // 0 = lunes … 6 = domingo
  const lun = new Date(y, m - 1, d - dow);
  const dom = new Date(y, m - 1, d - dow + 6);
  return { ini: isoLocal(lun), fin: isoLocal(dom) };
}
function fmtMin(min) {
  const t = Math.round(Number(min) || 0);
  if (!t) return '—';
  const h = Math.floor(Math.abs(t) / 60), m = Math.abs(t) % 60;
  return (t < 0 ? '− ' : '') + ((h ? h + ' h ' : '') + (m ? m + ' min' : '')).trim();
}
function cambiarSemana(d) {
  const [y, m, x] = semanaRef.split('-').map(Number);
  semanaRef = isoLocal(new Date(y, m - 1, x + d * 7));
  renderDireccion();
}
function dirSemana() {
  const { ini, fin } = rangoSemana(semanaRef);
  const enRango = f => f >= ini && f <= fin;
  const turnos = db.turnos.filter(t => t.salida && enRango(t.fecha));
  const props = db.propinas.filter(x => enRango(x.fecha));
  const porPersona = {};
  const reg = pid => (porPersona[pid] = porPersona[pid] || { dias: {}, extraMin: 0, sueldo: 0, propinas: 0 });
  turnos.forEach(t => {
    const c = calcularPago(t), x = reg(t.personalId);
    x.dias[t.fecha] = true;                       // un día trabajado = un día de paga
    x.extraMin += Math.max(0, c.min);             // solo el tiempo DE MÁS cuenta como extra
    x.sueldo += c.pago;
  });
  props.forEach(p => { reg(p.personalId).propinas += p.monto; });
  const filas = Object.entries(porPersona)
    .map(([pid, x]) => ({ pid, nombre: per(pid)?.nombre || '¿?', dias: Object.keys(x.dias).length, extraMin: x.extraMin, sueldo: x.sueldo, propinas: x.propinas }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const tot = filas.reduce((a, f) => ({
    dias: a.dias + f.dias, extraMin: a.extraMin + f.extraMin,
    sueldo: a.sueldo + f.sueldo, propinas: a.propinas + f.propinas
  }), { dias: 0, extraMin: 0, sueldo: 0, propinas: 0 });
  const granTotal = tot.sueldo + tot.propinas;
  const esSemanaActual = rangoSemana(hoyISO()).ini === ini;

  let html = '<div class="encabezado-seccion"><h2 style="margin:0">💵 Pago de la semana</h2>' +
    '<div class="fila" style="flex:0"><button class="btn s mini" onclick="cambiarSemana(-1)">←</button>' +
    '<button class="btn s mini" onclick="cambiarSemana(1)">→</button>' +
    '<button class="btn s mini" onclick="exportarSemanaCSV()">⬇️ CSV</button></div></div>';
  html += '<p class="mini muted" style="margin-top:-4px">Lunes ' + fmtFecha(ini) + ' → domingo ' + fmtFecha(fin) +
    (esSemanaActual ? ' · <b class="amar">semana en curso</b>' : '') + ' · se paga completo el <b>domingo</b>.</p>';
  html += '<div class="grid c3"><div class="stat verde"><div class="v">' + fmt$(granTotal) + '</div><div class="l">total a pagar el domingo</div></div>' +
    '<div class="stat"><div class="v">' + fmt$(tot.propinas) + '</div><div class="l">💳 propinas por retribuir</div></div>' +
    '<div class="stat"><div class="v">' + tot.dias + '</div><div class="l">días trabajados en total</div></div></div>';
  html += '<div class="card"><div class="tabla-wrap"><table>' +
    '<tr><th>Colaborador</th><th class="num">Días trabajados</th><th class="num">Horas extra</th><th class="num">Sueldo</th><th class="num">💳 Propinas</th><th class="num">A pagar</th></tr>' +
    (filas.map(f => '<tr><td>' + puntoPersona(f.pid) + '<b>' + esc(f.nombre) + '</b></td>' +
      '<td class="num">' + f.dias + '</td>' +
      '<td class="num">' + fmtMin(f.extraMin) + '</td>' +
      '<td class="num">' + fmt$(f.sueldo) + '</td>' +
      '<td class="num">' + fmt$(f.propinas) + '</td>' +
      '<td class="num"><b class="amar">' + fmt$(f.sueldo + f.propinas) + '</b></td></tr>').join('')
      || '<tr><td colspan="6" class="muted">Nadie ha cerrado turno esta semana todavía.</td></tr>') +
    (filas.length ? '<tr><td><b>TOTAL</b></td><td class="num"><b>' + tot.dias + '</b></td><td class="num"><b>' + fmtMin(tot.extraMin) +
      '</b></td><td class="num"><b>' + fmt$(tot.sueldo) + '</b></td><td class="num"><b>' + fmt$(tot.propinas) +
      '</b></td><td class="num"><b class="amar">' + fmt$(granTotal) + '</b></td></tr>' : '') +
    '</table></div>' +
    '<p class="mini muted">Cada día con turno cerrado paga el día completo. Las <b>horas extra</b> son el tiempo de más capturado al cerrar ' +
    '(bloques de ' + BLOQUE_MIN + ' min) y ya vienen sumadas en el sueldo. Las <b>propinas digitales</b> se le retribuyen a quien las registró. ' +
    'Para corregir un turno usa la pestaña Nómina.</p></div>';
  return html;
}
function exportarSemanaCSV() {
  const { ini, fin } = rangoSemana(semanaRef);
  const enRango = f => f >= ini && f <= fin;
  const porPersona = {};
  const reg = pid => (porPersona[pid] = porPersona[pid] || { dias: {}, extraMin: 0, sueldo: 0, propinas: 0 });
  db.turnos.filter(t => t.salida && enRango(t.fecha)).forEach(t => {
    const c = calcularPago(t), x = reg(t.personalId);
    x.dias[t.fecha] = true; x.extraMin += Math.max(0, c.min); x.sueldo += c.pago;
  });
  db.propinas.filter(x => enRango(x.fecha)).forEach(p => { reg(p.personalId).propinas += p.monto; });
  let csv = 'Colaborador,DiasTrabajados,MinutosExtra,Sueldo,PropinasDigitales,APagar\n';
  Object.entries(porPersona).forEach(([pid, x]) => csv += [
    (per(pid)?.nombre || '¿?').replace(/,/g, ' '), Object.keys(x.dias).length,
    x.extraMin, x.sueldo, x.propinas, x.sueldo + x.propinas].join(',') + '\n');
  descargar('pago-semana-' + ini + '.csv', csv);
  toast('⬇️ CSV de la semana descargado');
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
      return '<tr><td>' + puntoPersona(pid) + esc(p?.nombre || '¿?') + '</td><td class="num">' + x.turnos + '</td><td class="num">' + x.horas.toFixed(1) +
        ' h</td><td class="num">' + fmt$(x.pago) + '</td><td class="num">' + fmt$(x.propinas) + '</td><td class="num"><b class="amar">' + fmt$(x.pago + x.propinas) + '</b></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Sin registros este mes.</td></tr>') + '</table></div>' +
    '<p class="mini muted">Se paga <b>por día trabajado</b> (entrada + cierre = turno completo). Los minutos de más o de menos se ajustan en bloques de ' +
    BLOQUE_MIN + ' min con la tarifa por hora de cada quien. Las propinas digitales (tarjeta) se retribuyen al colaborador que las registró.</p></div>';
  // propinas del mes con opción de eliminar
  html += '<div class="card"><h3>💳 Propinas digitales del mes</h3>' +
    (propMes.length ? '<div class="tabla-wrap"><table><tr><th>Fecha</th><th>Colaborador</th><th>Sucursal</th><th class="num">Monto</th><th>Nota</th><th></th></tr>' +
      propMes.map(x => '<tr><td>' + fmtFecha(x.fecha) + ' ' + fmtHora(x.ts) + '</td><td>' +
        puntoPersona(x.personalId) + esc(per(x.personalId)?.nombre || '¿?') +
        '</td><td>' + esc(suc(x.sucursalId)?.nombre || '') + '</td><td class="num">' + fmt$(x.monto) + '</td><td class="mini">' + esc(x.nota || '') +
        '</td><td><button class="btn s mini" onclick="borrarPropina(\'' + x.id + '\')">🗑️</button></td></tr>').join('') + '</table></div>'
      : '<p class="muted mini">Sin propinas digitales este mes.</p>') + '</div>';
  // detalle
  html += '<div class="card"><h3>Detalle de turnos</h3><div class="tabla-wrap"><table><tr><th>Fecha</th><th>Colaborador</th><th>Sucursal</th><th>Turno</th><th>Entrada</th><th>Salida</th><th class="num">En piso</th><th>Ajuste</th><th class="num">Pago</th><th></th></tr>' +
    (turnos.map(t => {
      const c = calcularPago(t);
      return '<tr><td>' + fmtFecha(t.fecha) + '</td><td>' + puntoPersona(t.personalId) +
        esc(per(t.personalId)?.nombre || '') + '</td><td>' + esc(suc(t.sucursalId)?.nombre || '') +
        '</td><td>' + (t.tipo === 'matutino' ? '☀️' : '🌙') + '</td><td>' + fmtHora(t.entrada) + '</td><td>' + fmtHora(t.salida) +
        '</td><td class="num">' + c.horas + ' h</td><td class="mini">' + txtAjuste(c.bloques) +
        (t.motivoAjuste ? '<div class="mini muted">' + esc(t.motivoAjuste) + '</div>' : '') +
        '</td><td class="num">' + fmt$(c.pago) + '</td>' +
        '<td><button class="btn s mini" onclick="modalAjuste(\'' + t.id + '\')">✏️</button></td></tr>';
    }).join('') || '<tr><td colspan="10" class="muted">Sin registros.</td></tr>') + '</table></div></div>';
  return html;
}
/* Dirección corrige el ajuste de tiempo capturado en piso */
let ajusteTmp = 0;
function modalAjuste(tid) {
  const t = db.turnos.find(x => x.id === tid); if (!t) return;
  const p = per(t.personalId);
  ajusteTmp = Number(t.ajuste || 0);
  abrirModal('<h3>✏️ Ajuste de ' + esc(p?.nombre || '') + '</h3>' +
    '<p class="mini muted">' + fmtFecha(t.fecha) + ' · ' + fmtHora(t.entrada) + ' → ' + fmtHora(t.salida) +
    ' · ' + calcularPago(t).horas + ' h en piso</p>' +
    '<div class="fila" style="align-items:center;text-align:center">' +
    '<button class="btn s" onclick="ajusteTmp--;pintarAjusteModal(\'' + tid + '\')">− ' + BLOQUE_MIN + ' min</button>' +
    '<div id="aj-tx" style="flex:1.4"></div>' +
    '<button class="btn s" onclick="ajusteTmp++;pintarAjusteModal(\'' + tid + '\')">+ ' + BLOQUE_MIN + ' min</button></div>' +
    '<label>Motivo</label><input id="aj-motivo" value="' + esc(t.motivoAjuste || '') + '" placeholder="Ej. se quedó a cubrir, salió antes…">' +
    '<div class="sep"></div><button class="btn p" onclick="guardarAjuste(\'' + tid + '\')">Guardar ajuste</button>' +
    '<div style="height:8px"></div><button class="btn s" onclick="cerrarModal()">Cancelar</button>');
  pintarAjusteModal(tid);
}
function pintarAjusteModal(tid) {
  const t = db.turnos.find(x => x.id === tid); const p = per(t.personalId);
  const pago = Math.max(0, (p?.pagoTurno || 0) + ajusteTmp * tarifaBloque(p || {}));
  $('aj-tx').innerHTML = '<b class="amar">' + txtAjuste(ajusteTmp) + '</b><div class="mini muted">pago: ' + fmt$(pago) + '</div>';
}
function guardarAjuste(tid) {
  const t = db.turnos.find(x => x.id === tid); if (!t) return;
  t.ajuste = ajusteTmp;
  t.motivoAjuste = ($('aj-motivo').value || '').trim();
  const c = calcularPago(t); t.pago = c.pago; t.horas = c.horas; t.ts = Date.now();
  guardarDB(); cerrarModal(); renderDireccion();
  toast('✏️ Ajuste guardado · ' + fmt$(c.pago));
}
function cambiarNominaMes(d) {
  let [y, m] = nominaMes.split('-').map(Number);
  m += d; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
  nominaMes = y + '-' + String(m).padStart(2, '0');
  renderDireccion();
}
function exportarNominaCSV() {
  const turnos = db.turnos.filter(t => t.salida && t.fecha.startsWith(nominaMes));
  let csv = 'Fecha,Colaborador,Sucursal,Turno,Entrada,Salida,Horas en piso,Ajuste (min),Motivo,Pago\n';
  turnos.forEach(t => {
    const c = calcularPago(t);
    csv += [t.fecha, per(t.personalId)?.nombre || '', suc(t.sucursalId)?.nombre || '', t.tipo,
      fmtHora(t.entrada), fmtHora(t.salida), c.horas, c.min,
      '"' + (t.motivoAjuste || '').replace(/"/g, "'") + '"', c.pago].join(',') + '\n';
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
  db.sucursales.filter(s => s.activa && !s.del).forEach(s => {
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
  db.sucursales.filter(s => s.activa && !s.del).forEach(s => {
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
    db.sucursales.filter(s => !s.del).map(s => '<div class="item-linea"><div class="grow"><b>' + esc(s.nombre) + '</b>' +
      '<div class="mini muted">' + esc(s.direccion || '') + '</div></div>' +
      '<span class="badge ' + (s.activa ? 'ok' : 'aviso') + '">' + (s.activa ? 'activa' : 'pausada') + '</span>' +
      '<button class="btn s mini" onclick="modalSucursal(\'' + s.id + '\')">✏️</button></div>').join('') + '</div>';
  /* personal */
  html += '<div class="card"><div class="encabezado-seccion"><h3 style="margin:0">👥 Personal y sueldos</h3>' +
    '<button class="btn s mini" onclick="modalPersona()">+ Agregar</button></div>' +
    '<div class="tabla-wrap"><table><tr><th>Nombre</th><th class="num">$/turno (' + (c.baseHoras || 6) + 'h)</th><th class="num">$/h extra</th><th>Estado</th><th></th></tr>' +
    db.personal.filter(p => !p.del).map(p => '<tr' + (p.activo ? '' : ' style="opacity:.45"') + '><td>' +
      puntoPersona(p.id) + esc(p.nombre) +
      '</td><td class="num">' + fmt$(p.pagoTurno) + '</td><td class="num">' + fmt$(p.pagoHora) +
      '</td><td class="mini">' + (p.activo ? 'activo' : 'inactivo') +
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
    '<label>Proyecto de Todoist (opcional)</label><input id="cfg-todoist" value="' + esc(c.todoistProyecto || '') +
    '" placeholder="Ej. Ciclope — sin espacios">' +
    '<p class="mini muted">Las tareas que crees desde Supervisión y Dirección caen en ese proyecto. ' +
    'Déjalo vacío para que lleguen a tu Bandeja de entrada.</p>' +
    '<div class="fila" style="margin-top:14px"><button class="btn p" onclick="guardarConfig()">💾 Guardar</button>' +
    '<button class="btn s" onclick="probarConexion()">🔌 Probar conexión</button>' +
    '<button class="btn s" onclick="enlaceInstalacion()">🔗 Enlace de instalación</button></div>' +
    '<div class="sep"></div><div class="fila" style="align-items:center">' +
    '<span class="mini muted">Versión de esta app: <b class="amar">' + VERSION + '</b></span>' +
    '<button class="btn s mini" onclick="forzarActualizacion()">🔄 Buscar actualización</button></div>' +
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
  return db.productos.filter(p => !p.del && p.nombre.toLowerCase().includes(q)).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(p =>
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
  if (id) { const s = suc(id); s.nombre = nombre; s.direccion = $('ms-dir').value.trim(); s.activa = $('ms-activa').value === '1'; s.t = Date.now(); }
  else {
    let nid = 'suc-' + slug(nombre);
    if (db.sucursales.some(s => s.id === nid)) nid = 'suc-' + uid();
    db.sucursales.push({ id: nid, nombre, direccion: $('ms-dir').value.trim(), activa: true, t: Date.now() });
    db.stock[nid] = {}; db.productos.forEach(p => db.stock[nid][p.id] = { c: 0, t: 0 });
  }
  tocarCatalogos(); guardarDB(); cerrarModal(); renderDireccion(); toast('🏬 Sucursal guardada');
}
function borrarSucursal(id) {
  if (turnosAbiertos(id).length) return toast('⚠️ Hay turnos abiertos en esta sucursal');
  if (!confirm('¿Eliminar la sucursal "' + suc(id).nombre + '"? Su historial se conserva pero dejará de aparecer.')) return;
  const s = suc(id); s.del = true; s.activa = false; s.t = Date.now();
  tocarCatalogos(); guardarDB(); cerrarModal(); renderDireccion(); toast('🗑️ Sucursal eliminada');
}
let colorPersonaSel = '';
/* se marca el color sin volver a dibujar el modal: si se redibujara, se
   perdería lo que la persona ya escribió en el nombre y los pagos */
function elegirColorPersona(c, btn) {
  colorPersonaSel = c;
  document.querySelectorAll('#mp-paleta .swatch').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}
function modalPersona(id) {
  const p = id ? per(id) : null;
  colorPersonaSel = (p && p.color) || colorLibre();
  abrirModal('<h3>' + (p ? 'Editar colaborador' : 'Nuevo colaborador') + '</h3>' +
    '<label>Nombre</label><input id="mp-nombre" value="' + esc(p?.nombre || '') + '">' +
    '<div class="fila"><div><label>Pago por turno base ($)</label><input id="mp-turno" type="number" value="' + (p?.pagoTurno ?? 300) + '"></div>' +
    '<div><label>Pago por hora extra ($)</label><input id="mp-hora" type="number" value="' + (p?.pagoHora ?? 50) + '"></div></div>' +
    (p ? '<label>Estado</label><select id="mp-activo"><option value="1"' + (p.activo ? ' selected' : '') + '>Activo</option><option value="0"' + (!p.activo ? ' selected' : '') + '>Inactivo</option></select>' : '') +
    '<label style="margin-top:12px">Color en el calendario</label>' +
    '<p class="mini muted" style="margin:0 0 8px">Con el que se le distingue en el calendario. ' +
    'Los que ya usa alguien más salen marcados.</p>' +
    '<div class="paleta" id="mp-paleta">' + PALETA_PERSONAS.map(c => {
      const dueno = db.personal.find(x => !x.del && x.color === c && x.id !== id);
      return '<button type="button" class="swatch' + (colorPersonaSel === c ? ' on' : '') + (dueno ? ' usado' : '') +
        '" style="background:' + c + '" title="' + (dueno ? 'lo usa ' + esc(dueno.nombre) : 'libre') +
        '" onclick="elegirColorPersona(\'' + c + '\',this)">' +
        (dueno ? '<span>' + esc(dueno.nombre[0]) + '</span>' : '') + '</button>';
    }).join('') + '</div>' +
    '<div class="fila" style="margin-top:16px"><button class="btn p" onclick="guardarPersona(\'' + (id || '') + '\')">💾 Guardar</button>' +
    (p ? '<button class="btn peligro" onclick="borrarPersona(\'' + id + '\')">🗑️ Eliminar</button>' : '') + '</div>' +
    '<div style="height:8px"></div><button class="btn s" onclick="cerrarModal()">Cancelar</button>');
}
function guardarPersona(id) {
  const nombre = $('mp-nombre').value.trim();
  if (!nombre) return toast('Ponle nombre al colaborador');
  const color = colorPersonaSel || colorLibre();
  if (id) { const p = per(id); Object.assign(p, { nombre, color, pagoTurno: Number($('mp-turno').value) || 0, pagoHora: Number($('mp-hora').value) || 0, activo: $('mp-activo').value === '1', t: Date.now() }); }
  else {
    let nid = 'per-' + slug(nombre);
    if (db.personal.some(p => p.id === nid)) nid = 'per-' + uid();
    db.personal.push({ id: nid, nombre, color, pagoTurno: Number($('mp-turno').value) || 0, pagoHora: Number($('mp-hora').value) || 0, activo: true, t: Date.now() });
  }
  tocarCatalogos(); guardarDB(); cerrarModal(); renderDireccion(); toast('👥 Colaborador guardado');
}
function borrarPersona(id) {
  if (!confirm('¿Eliminar a ' + per(id).nombre + '? Su historial de turnos se conserva.')) return;
  const p = per(id); p.del = true; p.activo = false; p.t = Date.now();
  tocarCatalogos(); guardarDB(); cerrarModal(); renderDireccion(); toast('🗑️ Colaborador eliminado');
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
    const p = prod(id); Object.assign(p, { nombre, unidad: $('mx-unidad').value.trim(), minimo: Number($('mx-min').value) || 0, cat: $('mx-cat').value, t: Date.now() });
    if (fotoProductoTmp !== null) p.foto = fotoProductoTmp;
  }
  else {
    let nid = 'p-' + slug(nombre);
    if (db.productos.some(p => p.id === nid)) nid = 'p-' + uid();
    const np = { id: nid, nombre, unidad: $('mx-unidad').value.trim() || 'Pieza', minimo: Number($('mx-min').value) || 0, cat: $('mx-cat').value, t: Date.now() };
    if (fotoProductoTmp) np.foto = fotoProductoTmp;
    db.productos.push(np);
    db.sucursales.forEach(s => { stockDe(s.id)[np.id] = { c: 0, t: 0 }; });
  }
  tocarCatalogos(); guardarDB(); cerrarModal(); renderDireccion(); toast('📦 Producto guardado');
}
function borrarProducto(id) {
  if (!confirm('¿Eliminar "' + prod(id).nombre + '" del catálogo?')) return;
  const p = prod(id); p.del = true; p.t = Date.now();
  tocarCatalogos(); guardarDB(); cerrarModal(); renderDireccion(); toast('🗑️ Producto eliminado');
}
function guardarConfig() {
  const c = db.config;
  const pin = $('cfg-pin').value.trim();
  if (pin.length !== 4) return toast('El PIN debe tener 4 dígitos');
  const nuevos = {
    adminPin: pin,
    supervisorPin: ($('cfg-pin-sup').value.trim().length === 4) ? $('cfg-pin-sup').value.trim() : c.supervisorPin,
    baseHoras: Number($('cfg-base').value) || 6,
    emailTo: $('cfg-email').value.trim(),
    whatsapp: $('cfg-wa').value.replace(/\D/g, ''),
    todoistProyecto: ($('cfg-todoist') ? $('cfg-todoist').value : '').trim(),
  };
  // marca de tiempo POR CAMPO: solo lo que realmente cambió viaja como "nuevo"
  Object.keys(nuevos).forEach(k => {
    if (c[k] !== nuevos[k]) { c[k] = nuevos[k]; db.configTs[k] = Date.now(); }
  });
  c.scriptUrl = $('cfg-url').value.trim(); // local de cada dispositivo, no se sincroniza
  tocarCatalogos(); guardarDB(); pintarRed(); toast('💾 Configuración guardada');
  if (enLinea()) sync(false);
}
function enlaceInstalacion() {
  const url = ($('cfg-url') ? $('cfg-url').value.trim() : '') || db.config.scriptUrl;
  if (!url) return toast('Primero guarda la URL del backend 🔌');
  const c = db.config;
  // el enlace lleva la configuración completa, no solo la URL: así un dispositivo
  // que perdió su localStorage recupera PINs y datos sin esperar al sync
  const payload = {
    u: url, ap: c.adminPin, sp: c.supervisorPin, em: c.emailTo,
    wa: c.whatsapp, bh: c.baseHoras, ts: Date.now()
  };
  const link = location.origin + location.pathname + '#cfg=' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const msj = '👁️ *El Ojo Maestro — El Anillo del Cíclope*\n' +
    'Abre este enlace en Chrome o Safari (NO en el navegador de WhatsApp: usa "Abrir en el navegador") y el dispositivo queda conectado y sincronizado automáticamente:\n' + link +
    '\n\nDespués: menú del navegador → "Agregar a pantalla de inicio" para tenerla como app.';
  abrirModal('<h3>🔗 Enlace de instalación</h3>' +
    '<p class="mini muted">Ábrelo una vez en cada tablet o teléfono: configura el backend solo y sincroniza todo desde la nube. Si un dispositivo pierde su configuración, basta volver a abrir este mismo enlace.</p>' +
    '<textarea id="enlace-inst" readonly style="min-height:110px;font-size:.75rem">' + esc(link) + '</textarea>' +
    '<div class="fila" style="margin-top:12px">' +
    '<button class="btn p" onclick="navigator.clipboard.writeText($(\'enlace-inst\').value).then(()=>toast(\'📋 Enlace copiado\'))">📋 Copiar</button>' +
    '<a class="btn s" target="_blank" href="https://wa.me/?text=' + encodeURIComponent(msj) + '">📲 Compartir por WhatsApp</a></div>' +
    '<p class="mini muted" style="margin-top:10px">⚠️ En el teléfono: si el enlace se abre dentro de WhatsApp, toca ⋮ → <b>"Abrir en el navegador"</b> y agrégala a pantalla de inicio — así la configuración no se borra al cerrar.</p>' +
    '<button class="btn s" onclick="cerrarModal()">Cerrar</button>');
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
    // el logo lo pone aplicarLogo(), que además elige la versión según el tema
    /* el favicon y el icono de pantalla de inicio ya vienen como archivos
       reales (img/icono.png) declarados en el <head>: así los toma iOS al
       "Agregar a pantalla de inicio" sin depender de que corra el JS. */
  }
  initTema();
  cargarDB();
  // v2.3: se quitó el PDF de referencia del calendario; se libera su espacio
  try { localStorage.removeItem('ojo_cal_pdf'); } catch (e) { }
  // enlace de instalación: #cfg=<base64> configura el backend automáticamente
  if (location.hash.startsWith('#cfg=')) {
    try {
      const cfg = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(5)))));
      if (cfg.u && /^https:\/\/script\.google\.com\//.test(cfg.u)) {
        const c = db.config;
        c.scriptUrl = cfg.u;
        // restaura también la configuración de Dirección (enlaces v1.3 en adelante)
        if (cfg.ap) c.adminPin = cfg.ap;
        if (cfg.sp) c.supervisorPin = cfg.sp;
        if (cfg.em) c.emailTo = cfg.em;
        if (cfg.wa) c.whatsapp = cfg.wa;
        if (cfg.bh) c.baseHoras = cfg.bh;
        if (cfg.ts) {
          // el enlace vale como edición de catálogos: no lo pisa el servidor viejo
          db.catTs = Math.max(db.catTs || 0, cfg.ts);
          ['adminPin', 'supervisorPin', 'emailTo', 'whatsapp', 'baseHoras'].forEach(k => db.configTs[k] = cfg.ts);
        }
        guardarDB(false);
        toast('🔗 Dispositivo conectado y configurado');
      }
    } catch (e) { }
    history.replaceState(null, '', location.pathname + location.search);
  }
  ir('scr-portada');
  pintarRed();
  if (enLinea()) sync();
  /* latido inteligente: sube cambios pendientes cada minuto; si no hay nada
     que subir, solo consulta la nube cada 5 min (antes subía TODO cada 60 s) */
  let latido = 0;
  setInterval(() => {
    if (!enLinea()) return;
    latido++;
    if (syncPendiente || latido % 5 === 0) sync();
  }, 60000);
  // caché de la app: abre al instante desde la 2ª visita, incluso sin internet
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { });
    // el caché sirve la versión guardada y baja la nueva por detrás: avisamos
    // para que quien esté usando la app sepa que hay actualización lista
    navigator.serviceWorker.addEventListener('message', ev => {
      if (ev.data && ev.data.tipo === 'version-nueva' && !escribiendo()) {
        toast('✨ Hay una versión nueva lista. <button class="btn p mini" style="margin-left:8px" onclick="location.reload()">Actualizar</button>', 9000);
      }
    });
  }
})();
