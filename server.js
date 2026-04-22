import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const publicPath = path.resolve(__dirname);

// Serve static files from the root directory
app.use(express.static(publicPath));

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is live at http://0.0.0.0:${PORT}`);
  console.log(`Serving files from: ${publicPath}`);
});
