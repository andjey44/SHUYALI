const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Раздача frontend файлов
app.use(express.static(path.join(__dirname, '..')));

// API тест
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Chill backend работает 🚀'
  });
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Chill server started on port ${PORT}`);
});
