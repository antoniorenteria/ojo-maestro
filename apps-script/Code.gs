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
  ['personal', 'productos', 'sucursales'].forEach(function (k) {
    var mapa = {};
    (a[k] || []).forEach(function (x) { mapa[x.id] = x; });
    (b[k] || []).forEach(function (x) {
      var o = mapa[x.id];
      if (!o || (x.t || 0) > (o.t || 0)) mapa[x.id] = x;
    });
    db[k] = Object.keys(mapa).map(function (id) { return mapa[id]; });
  });
  db.catTs = Math.max(a.catTs || 0, b.catTs || 0);

  ['turnos', 'cierres', 'checklists', 'evidencias', 'eventos', 'propinas', 'tareas', 'revisiones', 'preparaciones', 'calendario'].forEach(function (k) {
    var mapa = {};
    (otro[k] || []).forEach(function (x) { mapa[x.id] = x; });
    var baseLista = (base[k] || []).map(function (x) {
      var o = mapa[x.id];
      if (!o) return x;
      delete mapa[x.id];
      /* duplicado: en turnos gana el que tiene salida; en lo demas la version mas reciente */
      if (k === 'turnos') return (!x.salida && o.salida) ? o : x;
      return ((o.ts || 0) > (x.ts || 0)) ? o : x;
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
