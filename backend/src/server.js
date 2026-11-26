const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const apiRoutes = require('./routes/api');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend web interface
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads directory (for floor plans when running locally)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve static frontend build (Vite React app)
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (require('fs').existsSync(frontendDist)) {
  console.log(`[Frontend] Serving production build from ${frontendDist}`);
  app.use(express.static(frontendDist));
}

// Health check and cloud metadata (Available at /api and /api/health)
const getApiMetadata = (req, res) => {
  res.json({
    name: 'CampusNav API',
    description: 'Cloud-Based Smart Indoor Campus Navigation and Facility Locator Using AWS',
    institution: 'School of Computer Science and Engineering (SoCSE), RV University, Bengaluru',
    authors: [
      'Prerana Prakash Talawar (1RUA24CSE0333)',
      'Bhagyshree Laxmikant Gunaga (1RUA24CSE0084)',
      'Bhuvana M G (1RUA24CSE0092)'
    ],
    status: 'ONLINE',
    aws_architecture: {
      compute: 'Amazon EC2 (Web app / Dijkstra Route Engine) & AWS Lambda',
      database: db.type === 'mysql' ? 'Amazon RDS (MySQL)' : 'Local Datastore (AWS RDS compatible)',
      storage: 'Amazon S3 (Floor-plan images)',
      gateway: 'Amazon API Gateway',
      monitoring: 'Amazon CloudWatch'
    },
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};

app.get('/api', getApiMetadata);
app.get('/api/health', getApiMetadata);

// API Routes
app.use('/api', apiRoutes);

// SPA Client-side routing fallback: Send index.html for all frontend pages
if (require('fs').existsSync(frontendDist)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size must be 10 MB or less.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Upload exactly one floor plan image.' });
  }
  if (err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Something went wrong on the server.' });
});

if (process.env.NODE_ENV !== 'lambda') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` CampusNav Backend Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/`);
    console.log(` API Endpoint: http://localhost:${PORT}/api/`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
