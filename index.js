require('dotenv').config(); // Load environment variables early
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Database connection
require('./config/database').dbConnect();

// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(cookieParser()); // Parses cookies

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again after 15 minutes.',
});
app.use(limiter);

const allowedOrigins = [
  'http://localhost:3000',
  'https://edtech-frontend-gamma.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
  })
);

// Cloudinary configuration
const { cloudinaryConnect } = require('./config/cloudinary');
cloudinaryConnect();

// Routes
const userRoutes = require('./routes/User.route');
const profileRoutes = require('./routes/Profile.route');
const paymentRoutes = require('./routes/Payment.route');
const courseRoutes = require('./routes/Course.route');
const contactUs = require('./routes/ContactUs.route.js');

app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/course', courseRoutes);
app.use('/api/v1', contactUs);

// Default route
app.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'Your server is up and running',
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`App is listening on PORT: ${PORT}`);
});
