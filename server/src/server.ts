import { app } from './app.js';
import { config } from './config.js';

app.listen(config.PORT, () => {
  process.stdout.write(`HFitness API listening on port ${config.PORT}\n`);
});

