/* ================================================================
   EL OJO MAESTRO - Backend (Google Apps Script)
   El Anillo del Ciclope - Pachuca, Hgo.

   Que hace:
   - Sincroniza los datos entre tablets y telefonos (Drive como base de datos)
   - Registra Turnos, Cierres, Propinas, Tareas y Revisiones en una hoja
     de calculo con pestanas automaticas por mes
   - Envia correos automaticos a EMAIL_AVISOS en cada evento importante
   - Guarda las fotos de evidencia en una carpeta de Drive
   - Hace un respaldo automatico cada noche

   Instalacion: ver GUIA-INSTALACION.md (5 minutos).
   ================================================================ */

var EMAIL_AVISOS = 'elanillodelciclope@gmail.com';
var CARPETA_RAIZ = 'El Ojo Maestro';
var ARCHIVO_DB = 'ojo-maestro-db-v2.json';
var NOMBRE_HOJA = 'El Ojo Maestro - Registros';

/* --- WhatsApp automatico (opcional, gratis via CallMeBot) ---
   1. Guarda el contacto +34 644 71 81 99 en el telefono 771 123 2884
   2. Enviale por WhatsApp: "I allow callmebot to send me messages"
   3. Te responde con tu apikey; pegala abajo y crea una Nueva version. */
var WHATSAPP_NUMERO = '5217711232884';
var CALLMEBOT_APIKEY = '';   /* pega aqui tu apikey; vacio = desactivado */

/* ================================================================
   LOYVERSE (punto de venta) - importar las ventas solas
   ----------------------------------------------------------------
   Con esto la venta del dia NO se teclea: la trae el mismo sistema
   de cobro, con su desglose de efectivo y tarjeta.

   COMO CONECTARLO (una sola vez):
   1. Entra a tu Loyverse desde la computadora: https://r.loyverse.com
   2. Menu izquierdo > Integraciones > Access tokens (Tokens de acceso).
   3. Boton "+ Add access token" > ponle nombre "Ojo Maestro" > Save.
   4. Copia el token que aparece y pegalo abajo en LOYVERSE_TOKEN.
   5. Guarda (disco) y crea una Nueva version (Implementar > Administrar).
   6. En el editor, selecciona la funcion  loyverseListarTiendas  y dale
      Ejecutar. En "Registro de ejecucion" vas a ver el id de cada tienda.
   7. Copia esos id al mapa LOYVERSE_TIENDAS de abajo, junto a la sucursal
      que le toca. Los id de sucursal del Ojo Maestro son:
        suc-revolucion  y  suc-tulipanes
   8. Guarda otra vez y crea Nueva version.
   9. Selecciona  loyverseActivarImportacion  y dale Ejecutar una vez:
      queda programado para traer las ventas cada noche solo.
   Para probar sin esperar: ejecuta  loyverseImportarHoy  y revisa el
   Registro de ejecucion.
   ================================================================ */
var LOYVERSE_TOKEN = '';   /* pega aqui tu Access token de Loyverse */

/* store_id de Loyverse  ->  id de sucursal en el Ojo Maestro.
   Llena esto DESPUES de correr loyverseListarTiendas (paso 6). */
var LOYVERSE_TIENDAS = {
  // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx': 'suc-revolucion',
  // 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy': 'suc-tulipanes'
};

function loyverseGet_(ruta, params) {
  if (!LOYVERSE_TOKEN) throw new Error('Falta LOYVERSE_TOKEN');
  var url = 'https://api.loyverse.com/v1.0/' + ruta;
  if (params) {
    var q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
    url += (url.indexOf('?') < 0 ? '?' : '&') + q;
  }
  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + LOYVERSE_TOKEN },
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  if (code !== 200) throw new Error('Loyverse ' + code + ': ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText());
}

/* Paso 6: lista las tiendas para conocer sus id. Mira el Registro de ejecucion. */
function loyverseListarTiendas() {
  var d = loyverseGet_('stores');
  (d.stores || []).forEach(function (s) {
    Logger.log('TIENDA  id: ' + s.id + '   nombre: ' + s.name);
  });
  Logger.log('Copia cada id a LOYVERSE_TIENDAS junto a suc-revolucion / suc-tulipanes.');
  return d.stores || [];
}

/* DIAGNOSTICO: corre esto y mira el Registro. Compara los store_id que traen
   los tickets REALES contra los que pusiste en LOYVERSE_TIENDAS, y cuenta las
   ventas de ayer y de hoy. Con esto se ve si el problema es "sin ventas aun" o
   "los id no coinciden". */
function loyverseDiagnostico() {
  Logger.log('== TIENDAS CONFIGURADAS en LOYVERSE_TIENDAS ==');
  Object.keys(LOYVERSE_TIENDAS).forEach(function (id) { Logger.log('  ' + id + '  ->  ' + LOYVERSE_TIENDAS[id]); });
  try {
    Logger.log('== TIENDAS REALES en tu Loyverse (loyverseListarTiendas) ==');
    (loyverseGet_('stores').stores || []).forEach(function (s) { Logger.log('  ' + s.id + '  ->  ' + s.name); });
  } catch (e) { Logger.log('ERROR al listar tiendas: ' + e); }
  var hoy = fechaHoyMX();
  var ayer = Utilities.formatDate(new Date(new Date().getTime() - 864e5), 'America/Mexico_City', 'yyyy-MM-dd');
  [ayer, hoy].forEach(function (f) {
    try {
      var v = loyverseVentasDia_(f);
      var claves = Object.keys(v);
      Logger.log('== ' + f + ': ' + claves.length + ' tienda(s) con ventas ==');
      claves.forEach(function (sid) {
        var conf = LOYVERSE_TIENDAS[sid] ? ('SI -> ' + LOYVERSE_TIENDAS[sid]) : 'NO (ese id no esta en LOYVERSE_TIENDAS)';
        Logger.log('  store ' + sid + ' | ventas $' + v[sid].ventas.toFixed(2) +
          ' | efectivo $' + v[sid].efectivo.toFixed(2) + ' | tarjeta $' + v[sid].tarjeta.toFixed(2) +
          ' | recibos ' + v[sid].recibos + ' | configurada: ' + conf);
      });
      if (!claves.length) Logger.log('  (sin ventas ese dia)');
    } catch (e) { Logger.log('ERROR en ' + f + ': ' + e); }
  });
}

/* Rango [ini, fin) de un dia (fecha yyyy-MM-dd) en hora de Mexico, formato UTC ISO. */
function loyverseRangoDia_(fecha) {
  var ini = Utilities.formatDate(
    Utilities.parseDate(fecha + ' 00:00:00', 'America/Mexico_City', 'yyyy-MM-dd HH:mm:ss'),
    'UTC', "yyyy-MM-dd'T'HH:mm:ss.000'Z'");
  var finD = new Date(Utilities.parseDate(fecha + ' 00:00:00', 'America/Mexico_City', 'yyyy-MM-dd HH:mm:ss').getTime() + 864e5);
  var fin = Utilities.formatDate(finD, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.000'Z'");
  return { ini: ini, fin: fin };
}

/* Suma los recibos de un dia por tienda y por tipo de pago.
   Devuelve { store_id: { ventas, efectivo, tarjeta, otros, recibos } } */
function loyverseVentasDia_(fecha) {
  var r = loyverseRangoDia_(fecha);
  var acc = {};
  var cursor = null, vueltas = 0;
  do {
    var params = { created_at_min: r.ini, created_at_max: r.fin, limit: 250 };
    if (cursor) params.cursor = cursor;
    var d = loyverseGet_('receipts', params);
    (d.receipts || []).forEach(function (rec) {
      var sid = rec.store_id;
      var a = acc[sid] || (acc[sid] = { ventas: 0, efectivo: 0, tarjeta: 0, otros: 0, recibos: 0 });
      // total_money de una devolucion (REFUND) viene negativo: se resta solo
      var signo = (rec.receipt_type === 'REFUND') ? -1 : 1;
      var neto = Number(rec.total_money || 0) * signo;
      a.ventas += neto;
      a.recibos += 1;
      (rec.payments || []).forEach(function (p) {
        var monto = Number(p.money_amount || 0) * signo;
        var nom = ((p.name || p.type || '') + '').toLowerCase();
        if (nom.indexOf('cash') >= 0 || nom.indexOf('efectivo') >= 0) a.efectivo += monto;
        else if (nom.indexOf('card') >= 0 || nom.indexOf('tarjeta') >= 0) a.tarjeta += monto;
        else a.otros += monto;
      });
    });
    cursor = d.cursor;
    vueltas++;
  } while (cursor && vueltas < 40);
  return acc;
}

/* Escribe las ventas de Loyverse en el cierre del dia de cada sucursal.
   - Si no hay cierre aun, crea uno con las ventas ya puestas.
   - Si ya hay, actualiza las ventas y el desglose, PERO respeta la caja
     que conto la persona (eso Loyverse no lo sabe).
   El id del cierre es determinista (cie|fecha|sucursal), igual que en la app,
   asi el merge lo une en vez de duplicar. */
function loyverseAplicar_(fecha) {
  if (!Object.keys(LOYVERSE_TIENDAS).length) throw new Error('Falta llenar LOYVERSE_TIENDAS');
  var ventas = loyverseVentasDia_(fecha);
  var db = leerDB() || {};
  db.cierres = db.cierres || [];
  db.sucursales = db.sucursales || [];
  var tocados = [];
  Object.keys(LOYVERSE_TIENDAS).forEach(function (storeId) {
    var sid = LOYVERSE_TIENDAS[storeId];
    var v = ventas[storeId];
    if (!v) return;
    var round2 = function (n) { return Math.round(n * 100) / 100; };
    var id = 'cie|' + fecha + '|' + sid;
    var idx = -1;
    for (var i = 0; i < db.cierres.length; i++) { if (db.cierres[i].id === id && !db.cierres[i].del) { idx = i; break; } }
    var base = idx >= 0 ? db.cierres[idx] : {
      id: id, fecha: fecha, sucursalId: sid, personalId: '', caja: 0,
      items: {}, hechos: 0, total: 0, novedades: ''
    };
    base.ts = Date.now();
    base.ventas = round2(v.ventas);
    base.pos = { fuente: 'loyverse', efectivo: round2(v.efectivo), tarjeta: round2(v.tarjeta), otros: round2(v.otros), recibos: v.recibos, ts: Date.now() };
    if (idx >= 0) db.cierres[idx] = base; else db.cierres.unshift(base);
    tocados.push({ sid: sid, ventas: base.ventas, efectivo: base.pos.efectivo, tarjeta: base.pos.tarjeta });
  });
  if (tocados.length) escribirDB(db);
  return tocados;
}

/* Importa el dia de HOY (hora Mexico). Es lo que corre el trigger nocturno. */
function loyverseImportarHoy() {
  var fecha = fechaHoyMX();
  var t = loyverseAplicar_(fecha);
  Logger.log('Loyverse ' + fecha + ': ' + JSON.stringify(t));
  if (t.length) {
    var cuerpo = 'Ventas importadas de Loyverse (' + fecha + '):\n\n' + t.map(function (x) {
      return '- ' + x.sid + ': $' + x.ventas.toFixed(2) + '  (efectivo $' + x.efectivo.toFixed(2) + ' / tarjeta $' + x.tarjeta.toFixed(2) + ')';
    }).join('\n');
    accionNotificar('Ventas de Loyverse cargadas', cuerpo);
  }
  return t;
}
/* Reimportar un dia concreto a mano, p.ej. loyverseImportarFecha('2026-07-25') */
function loyverseImportarFecha(fecha) { return loyverseAplicar_(fecha); }

/* La app llama esto EN VIVO al abrir el cierre: devuelve las ventas de hoy
   (o de la fecha pedida) de esa sucursal, para prellenar y cuadrar la caja.
   Si Loyverse no esta configurado, responde disponible:false y la app sigue
   funcionando en modo manual, como siempre. */
function accionLoyverse(fecha, sucursalId) {
  if (!LOYVERSE_TOKEN || !Object.keys(LOYVERSE_TIENDAS).length) return { ok: true, disponible: false };
  try {
    var f = fecha || fechaHoyMX();
    var ventas = loyverseVentasDia_(f);
    var storeId = null;
    Object.keys(LOYVERSE_TIENDAS).forEach(function (sid) { if (LOYVERSE_TIENDAS[sid] === sucursalId) storeId = sid; });
    if (!storeId) return { ok: true, disponible: false };
    var v = ventas[storeId] || { ventas: 0, efectivo: 0, tarjeta: 0, otros: 0, recibos: 0 };
    var r2 = function (n) { return Math.round(n * 100) / 100; };
    return { ok: true, disponible: true, fecha: f, sucursalId: sucursalId,
      ventas: r2(v.ventas), efectivo: r2(v.efectivo), tarjeta: r2(v.tarjeta), otros: r2(v.otros), recibos: v.recibos };
  } catch (err) {
    return { ok: true, disponible: false, error: String(err) };
  }
}

/* Paso 9: programa la importacion automatica cada noche a las 23:15. */
function loyverseActivarImportacion() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'loyverseImportarHoy') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('loyverseImportarHoy').timeBased().everyDays(1).atHour(23).nearMinute(15).create();
  Logger.log('Listo: las ventas se importaran solas cada noche.');
}

/* ----------------------------------------------------------------
   Entradas HTTP
---------------------------------------------------------------- */
function doGet(e) { return respuesta({ ok: true, servicio: 'El Ojo Maestro', hora: new Date().toISOString() }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var req = JSON.parse(e.postData.contents);
    var accion = req.action || '';
    if (accion === 'ping') return respuesta({ ok: true, pong: true });
    if (accion === 'sync') return respuesta(accionSync(req.db));
    if (accion === 'foto') return respuesta(accionFoto(req.b64, req.meta || {}));
    if (accion === 'notify') return respuesta(accionNotificar(req.asunto, req.cuerpo));
    if (accion === 'backup') return respuesta(accionRespaldo(req.db));
    if (accion === 'loyverse') return respuesta(accionLoyverse(req.fecha, req.sucursalId));
    return respuesta({ ok: false, error: 'accion desconocida' });
  } catch (err) {
    return respuesta({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ----------------------------------------------------------------
   Carpeta y base de datos en Drive
---------------------------------------------------------------- */
function carpeta() {
  var it = DriveApp.getFoldersByName(CARPETA_RAIZ);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_RAIZ);
}
function subcarpeta(nombre) {
  var raiz = carpeta();
  var it = raiz.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : raiz.createFolder(nombre);
}
function leerDB() {
  var it = carpeta().getFilesByName(ARCHIVO_DB);
  if (!it.hasNext()) return null;
  try { return JSON.parse(it.next().getBlob().getDataAsString()); } catch (e) { return null; }
}
function escribirDB(db) {
  var it = carpeta().getFilesByName(ARCHIVO_DB);
  var contenido = JSON.stringify(db);
  if (it.hasNext()) it.next().setContent(contenido);
  else carpeta().createFile(ARCHIVO_DB, contenido, 'application/json');
}

/* ----------------------------------------------------------------
   SYNC: mezcla lo que manda cada dispositivo con lo guardado en Drive
---------------------------------------------------------------- */
function accionSync(dbCliente) {
  if (!dbCliente) return { ok: false, error: 'sin datos' };
  var dbServidor = leerDB();
  var db = dbServidor ? mezclar(dbServidor, dbCliente) : dbCliente;
  db.config = db.config || {};
  db.config.scriptUrl = '';
  escribirDB(db);
  registrarNuevosEnHoja(dbServidor, db);
  return { ok: true, db: db };
}

function mezclar(a, b) {
  var nuevoEsB = (b.ts || 0) >= (a.ts || 0);
  var base = nuevoEsB ? b : a, otro = nuevoEsB ? a : b;
  var db = JSON.parse(JSON.stringify(base));

  /* CONFIG campo por campo: cada campo lleva su marca de tiempo (configTs).
     Solo un cambio real y mas reciente puede sustituir un valor; un
     dispositivo recien instalado (marcas en 0) nunca pisa nada.
     En empate gana el servidor (a). */
  var cfgA = a.config || {}, cfgB = b.config || {};
  var tsA = a.configTs || {}, tsB = b.configTs || {};
  var cfg = {}, cfgTs = {};
  var claves = {};
  Object.keys(cfgA).forEach(function (k) { claves[k] = 1; });
  Object.keys(cfgB).forEach(function (k) { claves[k] = 1; });
  Object.keys(claves).forEach(function (k) {
    var ta = tsA[k] || 0, tb = tsB[k] || 0;
    if (tb > ta) { cfg[k] = cfgB[k]; cfgTs[k] = tb; }
    else { cfg[k] = (cfgA[k] !== undefined) ? cfgA[k] : cfgB[k]; cfgTs[k] = ta; }
  });
  db.config = cfg; db.configTs = cfgTs;

  /* PERSONAL, PRODUCTOS y SUCURSALES registro por registro: union por id,
     y en cada registro gana la version con marca t mas reciente (empate:
     servidor). Las eliminaciones son marcas (del) y tambien se sincronizan. */
  ['personal', 'productos', 'sucursales', 'insumos', 'recetas'].forEach(function (k) {
    var mapa = {};
    (a[k] || []).forEach(function (x) { mapa[x.id] = x; });
    (b[k] || []).forEach(function (x) {
      var o = mapa[x.id];
      if (!o || (x.t || 0) > (o.t || 0)) mapa[x.id] = x;
    });
    db[k] = Object.keys(mapa).map(function (id) { return mapa[id]; });
  });
  db.catTs = Math.max(a.catTs || 0, b.catTs || 0);
  // bandera de siembra del escandallo: si algun lado ya sembro, no re-sembrar
  if (a.escandalloSembrado || b.escandalloSembrado) db.escandalloSembrado = true;

  ['turnos', 'cierres', 'checklists', 'evidencias', 'eventos', 'propinas', 'tareas', 'revisiones', 'preparaciones', 'calendario', 'gastos'].forEach(function (k) {
    var mapa = {};
    (otro[k] || []).forEach(function (x) { mapa[x.id] = x; });
    var baseLista = (base[k] || []).map(function (x) {
      var o = mapa[x.id];
      if (!o) return x;
      delete mapa[x.id];
      /* duplicado: en turnos gana el que tiene salida; en lo demas la version mas reciente */
      if (k === 'turnos') return (!x.salida && o.salida) ? o : x;
      var gana = ((o.ts || 0) > (x.ts || 0)) ? o : x, otroLado = (gana === o) ? x : o;
      /* las ventas de Loyverse (campo pos) no se pierden aunque un dispositivo
         reenvie una version mas nueva sin ellas: se conservan del lado que las
         tenga, junto con las ventas ya importadas. */
      if (k === 'cierres' && otroLado.pos && !gana.pos) {
        gana.pos = otroLado.pos;
        if (otroLado.ventas) gana.ventas = otroLado.ventas;
      }
      return gana;
    });
    db[k] = baseLista.concat(Object.keys(mapa).map(function (id) { return mapa[id]; }));
    db[k].sort(function (p, q) { return (q.ts || q.entrada || 0) - (p.ts || p.entrada || 0); });
    var vistos = {};
    db[k] = db[k].filter(function (t) { if (vistos[t.id]) return false; vistos[t.id] = 1; return true; });
    if (k === 'eventos') db[k] = db[k].slice(0, 500);
  });

  /* stock: por producto gana la marca de tiempo mas reciente */
  db.stock = db.stock || {};
  var stocks = [a.stock || {}, b.stock || {}];
  stocks.forEach(function (st) {
    Object.keys(st).forEach(function (sucId) {
      db.stock[sucId] = db.stock[sucId] || {};
      Object.keys(st[sucId]).forEach(function (prodId) {
        var actual = db.stock[sucId][prodId];
        var cand = st[sucId][prodId];
        if (!actual || (cand.t || 0) > (actual.t || 0)) db.stock[sucId][prodId] = cand;
      });
    });
  });
  db.ts = Math.max(a.ts || 0, b.ts || 0);
  return db;
}

/* ----------------------------------------------------------------
   Bitacora legible en Google Sheets (pestanas por mes)
---------------------------------------------------------------- */
function hoja() {
  var it = carpeta().getFilesByName(NOMBRE_HOJA);
  var ss;
  if (it.hasNext()) ss = SpreadsheetApp.open(it.next());
  else {
    ss = SpreadsheetApp.create(NOMBRE_HOJA);
    DriveApp.getFileById(ss.getId()).moveTo(carpeta());
  }
  return ss;
}
function hojaMes(ss, tipo, fecha, encabezados) {
  var nombre = tipo + ' ' + String(fecha || '').slice(0, 7);
  var sh = ss.getSheetByName(nombre);
  if (!sh) { sh = ss.insertSheet(nombre, 0); sh.appendRow(encabezados); sh.setFrozenRows(1); }
  var d = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (d && ss.getSheets().length > 1) ss.deleteSheet(d);
  return sh;
}
function idsExistentes(sheet, col) {
  if (sheet.getLastRow() < 2) return {};
  var vals = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues();
  var m = {}; vals.forEach(function (v) { m[v[0]] = 1; }); return m;
}
var ENC = {
  Turnos: ['Fecha', 'Sucursal', 'Colaborador', 'Turno', 'Entrada', 'Salida', 'HorasEnPiso', 'AjusteMin', 'MotivoAjuste', 'Pago', 'id'],
  Preparaciones: ['Fecha', 'Hora', 'Sucursal', 'Colaborador', 'Preparacion', 'Cantidad', 'Unidad', 'Nota', 'Foto', 'id'],
  Cierres: ['Fecha', 'Sucursal', 'Responsable', 'VentasNetas', 'DineroCaja', 'PropinasDigitalesDia', 'Checklist', 'Novedades', 'Foto', 'id'],
  Propinas: ['Fecha', 'Hora', 'Sucursal', 'Colaborador', 'Monto', 'Nota', 'id'],
  Tareas: ['Fecha', 'Sucursal', 'Turno', 'Tarea', 'RealizadaPor', 'Hora', 'Verificada', 'id'],
  Revisiones: ['Fecha', 'Sucursal', 'Veredicto', 'CumplimientoPct', 'Retroalimentacion', 'id'],
  Eventos: ['FechaHora', 'Asunto', 'Detalle', 'id']
};
function registrarNuevosEnHoja(dbAntes, dbAhora) {
  try {
    var ss = hoja();
    var nombreSuc = {}, nombrePer = {};
    (dbAhora.sucursales || []).forEach(function (s) { nombreSuc[s.id] = s.nombre; });
    (dbAhora.personal || []).forEach(function (p) { nombrePer[p.id] = p.nombre; });
    var cache = {};
    function destino(tipo, fecha, idCol) {
      var k = tipo + (fecha || '').slice(0, 7);
      if (!cache[k]) { var sh = hojaMes(ss, tipo, fecha, ENC[tipo]); cache[k] = { sh: sh, ids: idsExistentes(sh, idCol) }; }
      return cache[k];
    }
    (dbAhora.turnos || []).forEach(function (t) {
      if (!t.salida || !t.fecha) return;
      var d = destino('Turnos', t.fecha, 11);
      if (!d.ids[t.id]) d.sh.appendRow([t.fecha, nombreSuc[t.sucursalId] || '', nombrePer[t.personalId] || '',
        t.tipo, new Date(t.entrada), new Date(t.salida), t.horas || '',
        (t.ajuste || 0) * 20, t.motivoAjuste || '', t.pago || '', t.id]);
    });
    (dbAhora.preparaciones || []).forEach(function (x) {
      if (!x.fecha) return;
      var d = destino('Preparaciones', x.fecha, 10);
      if (!d.ids[x.id]) d.sh.appendRow([x.fecha, new Date(x.ts), nombreSuc[x.sucursalId] || '', nombrePer[x.personalId] || '',
        x.que || '', x.cantidad || '', x.unidad || '', x.nota || '', x.foto || '', x.id]);
    });
    (dbAhora.cierres || []).forEach(function (c) {
      if (!c.fecha) return;
      var d = destino('Cierres', c.fecha, 10);
      if (!d.ids[c.id]) {
        var propDia = (dbAhora.propinas || []).filter(function (x) { return x.fecha === c.fecha && x.sucursalId === c.sucursalId; })
          .reduce(function (acc, x) { return acc + (x.monto || 0); }, 0);
        d.sh.appendRow([c.fecha, nombreSuc[c.sucursalId] || '', nombrePer[c.personalId] || '',
          c.ventas, c.caja, propDia, (c.hechos || 0), c.novedades || '', (c.foto && c.foto.indexOf('http') === 0) ? c.foto : '', c.id]);
      }
    });
    (dbAhora.propinas || []).forEach(function (x) {
      if (!x.fecha) return;
      var d = destino('Propinas', x.fecha, 7);
      if (!d.ids[x.id]) d.sh.appendRow([x.fecha, new Date(x.ts), nombreSuc[x.sucursalId] || '', nombrePer[x.personalId] || '',
        x.monto, x.nota || '', x.id]);
    });
    (dbAhora.tareas || []).forEach(function (t) {
      if (!t.done || !t.fecha) return;
      var d = destino('Tareas', t.fecha, 8);
      if (!d.ids[t.id]) d.sh.appendRow([t.fecha, nombreSuc[t.sucursalId] || '', 'Turno ' + (t.turno || ''),
        t.nombre || t.tareaId, t.por || '', t.ts ? new Date(t.ts) : '', t.ver ? 'SI' : '', t.id]);
    });
    (dbAhora.revisiones || []).forEach(function (r) {
      if (!r.fecha) return;
      var d = destino('Revisiones', r.fecha, 6);
      if (!d.ids[r.id]) d.sh.appendRow([r.fecha, nombreSuc[r.sucursalId] || '', r.veredicto || '', r.pct || 0, r.comentario || '', r.id]);
    });
    (dbAhora.eventos || []).slice(0, 60).forEach(function (ev) {
      var d = destino('Eventos', new Date(ev.ts).toISOString(), 4);
      if (!d.ids[ev.id]) d.sh.appendRow([new Date(ev.ts), ev.asunto, ev.cuerpo, ev.id]);
    });
  } catch (e) { /* la bitacora nunca debe tumbar el sync */ }
}

/* ----------------------------------------------------------------
   Fotos de evidencia hacia Drive
   (formato de enlace que SI se muestra como imagen en la app)
---------------------------------------------------------------- */
function accionFoto(b64, meta) {
  if (!b64) return { ok: false, error: 'sin imagen' };
  var fecha = meta.fecha || Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd');
  var f = subcarpeta('Evidencias');
  var mes = f.getFoldersByName(fecha.slice(0, 7)).hasNext()
    ? f.getFoldersByName(fecha.slice(0, 7)).next() : f.createFolder(fecha.slice(0, 7));
  var nombre = fecha + '_' + (meta.sucursal || 'sucursal') + '_' + (meta.tipo || 'evidencia') + '_' +
    Utilities.formatDate(new Date(), 'America/Mexico_City', 'HHmmss') + '.jpg';
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', nombre);
  var archivo = mes.createFile(blob);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, url: 'https://drive.google.com/thumbnail?id=' + archivo.getId() + '&sz=w1000' };
}

/* ----------------------------------------------------------------
   Correos y WhatsApp de aviso
---------------------------------------------------------------- */
function accionNotificar(asunto, cuerpo) {
  var okMail = false, okWa = false;
  try {
    MailApp.sendEmail({
      to: EMAIL_AVISOS,
      subject: '[Ojo Maestro] ' + (asunto || 'Aviso'),
      body: (cuerpo || '') + '\n\n--\nEl Ojo Maestro - El Anillo del Ciclope\n"Donde el sabor es un misterio, y la comida una aventura."'
    });
    okMail = true;
  } catch (e) { }
  if (CALLMEBOT_APIKEY) {
    try {
      UrlFetchApp.fetch('https://api.callmebot.com/whatsapp.php?phone=' + WHATSAPP_NUMERO +
        '&apikey=' + CALLMEBOT_APIKEY + '&text=' + encodeURIComponent((asunto || '') + '\n' + (cuerpo || '')),
        { muteHttpExceptions: true });
      okWa = true;
    } catch (e) { }
  }
  return { ok: okMail || okWa, correo: okMail, whatsapp: okWa };
}

/* ----------------------------------------------------------------
   Respaldos (manual y automatico nocturno)
---------------------------------------------------------------- */
function accionRespaldo(db) {
  var datos = db || leerDB();
  if (!datos) return { ok: false, error: 'nada que respaldar' };
  var f = subcarpeta('Respaldos');
  var nombre = 'respaldo_' + Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd_HHmm') + '.json';
  f.createFile(nombre, JSON.stringify(datos), 'application/json');
  var archivos = [];
  var it = f.getFiles(); while (it.hasNext()) archivos.push(it.next());
  archivos.sort(function (x, y) { return y.getDateCreated() - x.getDateCreated(); });
  archivos.slice(45).forEach(function (x) { x.setTrashed(true); });
  return { ok: true, archivo: nombre };
}
function respaldoNocturno() { accionRespaldo(null); }

/* Ejecuta esta funcion UNA VEZ desde el editor para activar
   el respaldo automatico diario (23:00 aprox.) */
function activarRespaldoAutomatico() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'respaldoNocturno') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('respaldoNocturno').timeBased().everyDays(1).atHour(23).create();
}

/* ----------------------------------------------------------------
   AVISO DE CIERRE FALTANTE
   Revisa si alguna sucursal no mando su cierre del dia y avisa por
   correo (y WhatsApp si esta configurado). Corre solo, sin que nadie
   tenga que abrir la app: ese era justo el punto.
   Ejecuta activarAvisoDeCierre() UNA VEZ para programarlo.
---------------------------------------------------------------- */
function fechaHoyMX() {
  return Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd');
}
function revisarCierresDelDia() {
  var db = leerDB();
  if (!db || !db.sucursales) return;
  var hoy = fechaHoyMX();
  var activas = (db.sucursales || []).filter(function (s) { return s.activa && !s.del; });
  var cierres = (db.cierres || []).filter(function (c) { return !c.del && c.fecha === hoy; });
  var gastos = (db.gastos || []).filter(function (g) { return !g.del && g.fecha === hoy; });
  var faltanCierre = activas.filter(function (s) {
    return !cierres.some(function (c) { return c.sucursalId === s.id; });
  });
  // recordatorio de gastos: sucursal que SI cerro pero no registro ningun gasto
  var sinGastos = activas.filter(function (s) {
    var cerro = cierres.some(function (c) { return c.sucursalId === s.id; });
    var tieneGastos = gastos.some(function (g) { return g.sucursalId === s.id; });
    return cerro && !tieneGastos;
  });
  if (!faltanCierre.length && !sinGastos.length) return;   // todo en orden
  var cuerpo = '', asunto = '';
  if (faltanCierre.length) {
    var nc = faltanCierre.map(function (s) { return s.nombre; }).join(', ');
    asunto = 'Falta el cierre de ' + nc;
    cuerpo += 'Ya paso la hora de corte y estas sucursales NO han enviado su cierre de hoy (' + hoy + '):\n\n' +
      faltanCierre.map(function (s) { return '- ' + s.nombre; }).join('\n') +
      '\n\nSin cierre no quedan registradas las ventas del dia ni el checklist verificable.\n';
  }
  if (sinGastos.length) {
    var ng = sinGastos.map(function (s) { return s.nombre; }).join(', ');
    asunto = asunto ? (asunto + ' · sin gastos: ' + ng) : ('Recordatorio: registrar gastos de ' + ng);
    cuerpo += (cuerpo ? '\n' : '') + 'Recordatorio: hoy (' + hoy + ') NO se registro ningun gasto en:\n\n' +
      sinGastos.map(function (s) { return '- ' + s.nombre; }).join('\n') +
      '\n\nSi hubo compras, capturalas en El Ojo Maestro > Gastos y compras para ver la utilidad real.\n';
  }
  cuerpo += '\nEntra a El Ojo Maestro > Direccion > Hoy para verlo.';
  accionNotificar(asunto, cuerpo);
}
function activarAvisoDeCierre() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'revisarCierresDelDia') ScriptApp.deleteTrigger(t);
  });
  // 23:30 hora del servidor: despues del cierre normal y antes del respaldo
  ScriptApp.newTrigger('revisarCierresDelDia').timeBased().everyDays(1).atHour(23).nearMinute(30).create();
}
