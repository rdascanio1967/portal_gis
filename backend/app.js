const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());



// Rutas API
const capasBaseRoutes = require('./routes/capasBase');
app.use('/api/capas-base', capasBaseRoutes);

// Servidor
app.listen(PORT, () => {
  console.log(`API GIS corriendo en http://localhost:${PORT}`);
});