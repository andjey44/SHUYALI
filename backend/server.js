const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

app.use(cors());
app.use(express.json());

// API тест
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Chill backend работает 🚀'
  });
});

// Раздача frontend-файлов из папки projects
app.use(express.static(PROJECTS_DIR));

// Главная страница приложения
app.get('/', (req, res) => {
  res.sendFile(path.join(PROJECTS_DIR, 'index.html'));
});

// Для будущих frontend-роутов: отдаём index.html, но не перехватываем /api
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'API route not found'
    });
  }

  res.sendFile(path.join(PROJECTS_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Chill server started on port ${PORT}`);
  console.log(`Frontend directory: ${PROJECTS_DIR}`);
});
