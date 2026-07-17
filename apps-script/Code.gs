/*═══════════════════════════════════════════════════════════════
  EL OJO MAESTRO · Backend (Google Apps Script)
  El Anillo del Cíclope — Pachuca, Hgo.

  Qué hace:
   · Sincroniza los datos entre tablets y teléfonos (Drive como base de datos)
   · Registra Turnos, Cierres y Eventos en una hoja de cálculo legible
   · Envía correos automáticos a EMAIL_AVISOS en cada evento importante
   · Guarda las fotos de evidencia en una carpeta de Drive
   · Hace un respaldo automático cada noche

  Instalación: ver GUIA-INSTALACION.md (5 minutos).
═══════════════════════════════════════════════════════════════*/

var EMAIL_AVISOS = 'elanillodelciclope@gmail.com';
var CARPETA_RAIZ = 'El Ojo Maestro';           // carpeta en Drive
var ARCHIVO_DB   = 'ojo-maestro-db.json';       // base de datos JSON
var NOMBRE_HOJA  = 'El Ojo Maestro — Registros';// hoja de cálculo de bitácora

/* ─── WhatsApp automático (opcional, gratis via CallMeBot) ───
   1. Guarda el contacto +34 644 71 81 99 en el teléfono 771 123 2884
   2. Envíale por WhatsApp: "I allow callmebot to send me messages"
   3. Te responde con tu apikey — pégala abajo y vuelve a Implementar.   */
var WHATSAPP_NUMERO = '5217711232884';
var CALLMEBOT_APIKEY = '';   // ← pega aquí tu apikey; vacío = desactivado

/*---------------------------------------------------------------
  Entradas HTTP
---------------------------------------------------------------*/
function doGet(e) { return respuesta({ ok: true, servicio: 'El Ojo Maestro', hora: new Date().toISOString() }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // evita choques cuando dos tablets sincronizan a la vez
  try {
    var req = JSON.parse(e.postData.contents);
    var accion = req.action || '';
    if (accion === 'ping')   return respuesta({ ok: true, pong: true });
    if (accion === 'sync')   return respuesta(accionSync(req.db));
    if (accion === 'foto')   return respuesta(accionFoto(req.b64, req.meta || {}));
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

/*---------------------------------------------------------------
  Carpeta y base de datos en Drive
---------------------------------------------------------------*/
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

/*---------------------------------------------------------------
  SYNC: mezcla lo que manda la tablet con lo guardado en Drive
   · listas con id (turnos, cierres, checklists, evidencias, eventos):
     unión por id; si un turno existe en ambos, gana el que tenga salida
   · stock: gana el conteo con marca de tiempo más reciente (por producto)
   · catálogos y config: gana el db con marca de tiempo global más nueva
---------------------------------------------------------------*/
function accionSync(dbCliente) {
  if (!dbCliente) return { ok: false, error: 'sin datos' };
  var dbServidor = leerDB();
  var db = dbServidor ? mezclar(dbServidor, dbCliente) : dbCliente;
  db.config = db.config || {};
  db.config.scriptUrl = ''; // la URL vive solo en cada dispositivo
  escribirDB(db);
  registrarNuevosEnHoja(dbServidor, db);
  return { ok: true, db: db };
}

function mezclar(a, b) {
  var nuevoEsB = (b.ts || 0) >= (a.ts || 0);
  var base = nuevoEsB ? b : a, otro = nuevoEsB ? a : b;
  var db = JSON.parse(JSON.stringify(base));

  ['turnos', 'cierres', 'checklists', 'evidencias', 'eventos', 'propinas', 'tareas', 'revisiones'].forEach(function (k) {
    var mapa = {};
    (otro[k] || []).forEach(function (x) { mapa[x.id] = x; });
    var baseLista = (base[k] || []).map(function (x) {
      var o = mapa[x.id];
      if (!o) return x;
      delete mapa[x.id];
      // duplicado: en turnos gana el que tiene salida; en lo demás la versión más reciente
      if (k === 'turnos') return (!x.salida && o.salida) ? o : x;
      return ((o.ts || 0) > (x.ts || 0)) ? o : x;
    });
    db[k] = baseLista.concat(Object.keys(mapa).map(function (id) { return mapa[id]; }));
    db[k].sort(function (p, q) { return (q.ts || q.entrada || 0) - (p.ts || p.entrada || 0); });
    // corrige duplicado turno-sin-salida vs con-salida en base
    if (k === 'turnos') {
      var vistos = {};
      db[k] = db[k].filter(function (t) {
        if (vistos[t.id]) return false; vistos[t.id] = 1; return true;
      });
    }
    if (k === 'eventos') db[k] = db[k].slice(0, 500);
  });

  // stock: por producto gana la marca de tiempo más reciente
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

/*---------------------------------------------------------------
  Bitácora legible en Google Sheets (Turnos / Cierres / Eventos)
---------------------------------------------------------------*/
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
/* pestaña mensual: "Turnos 2026-07", "Cierres 2026-07", "Propinas 2026-07"… */
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
  Turnos: ['Fecha', 'Sucursal', 'Colaborador', 'Turno', 'Entrada', 'Salida', 'Horas', 'Pago', 'id'],
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
    var cache = {}; // hoja+ids por pestaña mensual
    function destino(tipo, fecha, idCol) {
      var k = tipo + (fecha || '').slice(0, 7);
      if (!cache[k]) { var sh = hojaMes(ss, tipo, fecha, ENC[tipo]); cache[k] = { sh: sh, ids: idsExistentes(sh, idCol) }; }
      return cache[k];
    }
    (dbAhora.turnos || []).forEach(function (t) {
      if (!t.salida || !t.fecha) return;
      var d = destino('Turnos', t.fecha, 9);
      if (!d.ids[t.id]) d.sh.appendRow([t.fecha, nombreSuc[t.sucursalId] || '', nombrePer[t.personalId] || '',
        t.tipo, new Date(t.entrada), new Date(t.salida), t.horas || '', t.pago || '', t.id]);
    });
    (dbAhora.cierres || []).forEach(function (c) {
      if (!c.fecha) return;
      var d = destino('Cierres', c.fecha, 10);
      if (!d.ids[c.id]) {
        var propDia = (dbAhora.propinas || []).filter(function (x) { return x.fecha === c.fecha && x.sucursalId === c.sucursalId; })
          .reduce(function (a, x) { return a + (x.monto || 0); }, 0);
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
  } catch (e) { /* la bitácora nunca debe tumbar el sync */ }
}

/*---------------------------------------------------------------
  Fotos de evidencia → Drive
---------------------------------------------------------------*/
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
  return { ok: true, url: 'https://drive.google.com/uc?export=view&id=' + archivo.getId() };
}

/*---------------------------------------------------------------
  Correos de aviso
---------------------------------------------------------------*/
function accionNotificar(asunto, cuerpo) {
  var okMail = false, okWa = false;
  try {
    MailApp.sendEmail({
      to: EMAIL_AVISOS,
      subject: '[Ojo Maestro] ' + (asunto || 'Aviso'),
      body: (cuerpo || '') + '\n\n—\nEl Ojo Maestro · El Anillo del Cíclope\n"Donde el sabor es un misterio, y la comida una aventura."'
    });
    okMail = true;
  } catch (e) { }
  if (CALLMEBOT_APIKEY) {
    try {
      UrlFetchApp.fetch('https://api.callmebot.com/whatsapp.php?phone=' + WHATSAPP_NUMERO +
        '&apikey=' + CALLMEBOT_APIKEY + '&text=' + encodeURIComponent('👁️ ' + (asunto || '') + '\n' + (cuerpo || '')),
        { muteHttpExceptions: true });
      okWa = true;
    } catch (e) { }
  }
  return { ok: okMail || okWa, correo: okMail, whatsapp: okWa };
}

/*---------------------------------------------------------------
  Respaldos (manual y automático nocturno)
---------------------------------------------------------------*/
function accionRespaldo(db) {
  var datos = db || leerDB();
  if (!datos) return { ok: false, error: 'nada que respaldar' };
  var f = subcarpeta('Respaldos');
  var nombre = 'respaldo_' + Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd_HHmm') + '.json';
  f.createFile(nombre, JSON.stringify(datos), 'application/json');
  // conserva solo los últimos 45 respaldos
  var archivos = [];
  var it = f.getFiles(); while (it.hasNext()) archivos.push(it.next());
  archivos.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  archivos.slice(45).forEach(function (a) { a.setTrashed(true); });
  return { ok: true, archivo: nombre };
}
function respaldoNocturno() { accionRespaldo(null); }

/* Ejecuta esta función UNA VEZ desde el editor para activar
   el respaldo automático diario (23:30 aprox.) */
function activarRespaldoAutomatico() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'respaldoNocturno') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('respaldoNocturno').timeBased().everyDays(1).atHour(23).create();
}
