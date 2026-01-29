import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import askRoute from './routes/askRoute.js';
import { swaggerDocument } from './swagger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(askRoute);

const uiPath = path.join(__dirname, '..', 'ui');
app.use('/ui', express.static(uiPath));
app.get('/', (_req, res) => {
  res.redirect('/ui/index.html');
});

const port = config.server.port;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/swagger`);
  console.log(`Chat UI: http://localhost:${port}/ui/index.html`);
});
