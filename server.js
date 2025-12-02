const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;
require('dotenv').config(); // Ensure environment variables are loaded

// Middleware Imports
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // For cookie management

// Logger and error handler middleware
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const { protect } = require('./middlewares/auth'); // Import auth middleware

// Database connection
const connectDB = require('./db');
const User = require('./models/user');

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware setup
app.use(morgan('dev'));
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    "default-src": ["'self'", "*"],
    "img-src": ["'self'", "https:", "data:"],
    "script-src": ["'self'", "*", "'unsafe-inline'"],
    "script-src-attr": ["'self'", "*", "'unsafe-inline'"]
  }
}));
app.use(cors());
app.use(cookieParser()); // Added cookie parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  headers: true
});
app.use('/api', limiter);

// Use logger middleware
app.use(logger);

// Global middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const apiRoutes = require('./api/apiRoutes');
app.use('/api', apiRoutes);

// Main Pages (Render EJS or HTML)
app.get('/', (req, res) => {
  // Get any error or success messages from query params
  const { error, success } = req.query;
  res.render('login', { error, success }); // Renders views/login.ejs
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.get('/api/dashboard', protect, (req, res) => {
  const instaImages = [
    'food.jpg', 'drink.jpg', 'pizza.jpg', 'beerr.avif',
    'dance.jpeg', 'sing.webp', 'hand.png', 'taco.png',
    'drum.png', 'wine.png'
  ];
  res.render('dashboard', { 
    instaImages,
    user: req.user // Pass the user to the template
  });
});

// Dynamic bars page using EJS
const chdBars = [
  { name: "BREWESTATE", image: "/images/brewestate.png", link: "/api/brewestate" },
  { name: "BOULEVARD", image: "/images/boul.png", link: "/api/boulevard" },
  { name: "KALA-GHODA", image: "/images/kalaghoda.jpg", link: "/api/kalaghoda" },
  { name: "MOBE", image: "/images/mobe.png", link: "/api/mobe" }
];

const ldhBars = [
  { name: "PAARA - NIGHT CLUB", image: "/images/paara2.jpg", link: "/api/paara" },
  { name: "ROMEO LANE", image: "/images/romeolane.jpg", link: "/api/romeo-ldh" },
  { name: "LUNA - NIGHT CLUB", image: "/images/luna2.avif", link: "/api/luna-ldh" },
  { name: "BAKLAVI - BAR & KITCHEN", image: "/images/baklavi.jpg", link: "/api/baklavi-ldh" }
];

app.get('/api/bar', protect, (req, res) => {
  res.render('bars', { 
    chdBars, 
    ldhBars,
    user: req.user
  }); // Renders views/bars.ejs
});

// Add new route for reservation (serving HTML directly)
app.get('/api/reserve-table', protect, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reservation.html')); // Serve reservation.html
});


app.get('/api/team', protect, (req, res) => {
  const team = [
    {
      name: "Ansh Vohra",
      role: "Web Analyst",
      image: "/images/ansh.jpg"
    },
    {
      name: "Akhil Handa",
      role: "UI/UX Designer",
      image: "/images/akhil.jpg"
    },
    {
      name: "Anmol Singh",
      role: "Front-End Web Developer",
      image: "/images/anmol11.jpg"
    },
    {
      name: "Aaryushi",
      role: "Back-End Web Developer",
      image: "/images/aaryushi.jpg"
    }
  ];

  res.render('team', { 
    team,
    user: req.user 
  });
});

// Static bar pages rendered via EJS (protected)
const barPages = ['brewestate', 'boulevard', 'kalaghoda', 'mobe', 'paara', 'romeo-ldh', 'luna-ldh', 'baklavi-ldh'];
barPages.forEach(page => {
  app.get(`/api/${page}`, protect, (req, res) => {
    res.render(page, { user: req.user }); // Render EJS with user data
  });
});

// Other static pages rendered via EJS (public access)
const staticPages = ['faq', 'ourservices', 'contactus'];
staticPages.forEach(page => {
  app.get(`/api/${page}`, (req, res) => {
    // These pages are publicly accessible
    res.render(page);
  });
});

// Authentication routes are now handled in apiRoutes.js
// These routes were removed to avoid duplication);

// Error handler middleware
app.use(errorHandler);

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});