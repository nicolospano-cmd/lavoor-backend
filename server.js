const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({
  logger: true,
  static: null,
  noCors: false
});

// Middlewares base
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Health endpoint: test rapido
server.get('/health', (req, res) => res.json({ ok: true }));

// Logica extra: compila dati mancanti nei POST
server.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/shifts') {
    const body = req.body || {};
    if (!body.status) body.status = 'open';
    const rate = Number(body.hourlyRate || 0);
    if (!body.totalEstimated || Number.isNaN(Number(body.totalEstimated))) {
      body.totalEstimated = Math.round(rate * 6); // 6 ore di default
    }
  }
  if (req.method === 'POST' && req.path === '/matches') {
    const b = req.body || {};
    if (!b.shiftId || !b.workerId || !b.employerId) {
      return res.status(400).json({ error: 'shiftId, workerId, employerId obbligatori' });
    }
    if (!b.status) b.status = 'applied';
  }
  next();
});

// Usa router REST
server.use(router);

// Avvio su porta
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Lavoor JSON API pronta su porta ${PORT}`);
});
