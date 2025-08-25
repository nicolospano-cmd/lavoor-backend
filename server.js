// server.js — avvia json-server con qualche comodità
const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({
  logger: true,   // log richieste
  static: null,   // no static
  noCors: false,  // abilita CORS
});

// Middlewares base
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Salute: GET /health -> { ok: true }
server.get('/health', (req, res) => res.json({ ok: true }));

// Piccola logica: completa i campi dei turni se mancano
server.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/shifts') {
    const body = req.body || {};
    // Default
    if (!body.status) body.status = 'open';
    // Calcolo totale stimato se mancante (durata "finta" = 6 ore)
    const rate = Number(body.hourlyRate || 0);
    if (!body.totalEstimated || Number.isNaN(Number(body.totalEstimated))) {
      body.totalEstimated = Math.round(rate * 6);
    }
  }
  // Per i match, richiedi campi minimi
  if (req.method === 'POST' && req.path === '/matches') {
    const b = req.body || {};
    if (!b.shiftId || !b.workerId || !b.employerId) {
      return res.status(400).json({ error: 'shiftId, workerId, employerId sono obbligatori' });
    }
    if (!b.status) b.status = 'applied';
  }
  next();
});

// Router REST
server.use(router);

// Porta per Render
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Lavoor JSON API pronta su porta ${PORT}`);
});
