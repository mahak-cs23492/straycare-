require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

// Route imports
const reportRoutes = require('./routes/report');
const adoptionRoutes = require('./routes/adoption');
const adoptRoutes = require('./routes/adopt');
const ngoRoutes = require('./routes/ngo');
const adRoutes = require('./routes/ads');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const generalRoutes = require("./routes/general");

// Models
const { TreatedAnimal, Ad } = require('./models');
const { isLoggedIn, isNGO } = require('./middleware/auth');

const app = express();

// MongoDB connection setup
const useAtlas = process.env.USE_ATLAS === "true";
const mongoURI = useAtlas ? process.env.MONGO_ATLAS : process.env.MONGO_LOCAL;

if (!mongoURI) {
    console.error('❌ MongoDB URI not set. Check USE_ATLAS and .env variables.');
    process.exit(1);
}

mongoose.connect(mongoURI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// View engine and middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'straycareSuperSecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoURI,
        collectionName: 'sessions'
    }),
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
}));

// Flash messages
app.use(flash());

// Locals for EJS templates
app.use((req, res, next) => {
    res.locals.currentUserId = req.session.userId;
    res.locals.currentUserKind = req.session.userKind;
    res.locals.userName = req.session.userName;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Routes
app.use('/user', userRoutes);
app.use('/report', reportRoutes);
app.use('/adoption', adoptionRoutes);
app.use('/adopt', adoptRoutes);
app.use('/ads', adRoutes);
app.use('/auth', authRoutes);
app.use('/ngo', isLoggedIn, isNGO, ngoRoutes);
app.use(dashboardRoutes);

// Home route
app.get('/', async (req, res) => {
    try {
        const animals = await TreatedAnimal.find({});
        const ads = await Ad.find({});
        res.render('home', { animals, ads });
    } catch (err) {
        console.error('Home route error:', err);
        res.status(500).send('Something went wrong.');
    }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
