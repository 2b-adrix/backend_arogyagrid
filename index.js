require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// Routes
const suppliesRouter = require('./routes/supplies');
const facilitiesRouter = require('./routes/facilities');
const medicinesRouter = require('./routes/medicines');
const inventoryRouter = require('./routes/inventory');
const risksRouter = require('./routes/risks');
const redistributionRouter = require('./routes/redistribution');
const resourcesRouter = require('./routes/resources');
const forecastsRouter = require('./routes/forecasts');
const auditRouter = require('./routes/audit');
const authRouter = require('./routes/auth');
const aiRouter = require('./routes/ai');

app.use('/api/supplies', suppliesRouter);
app.use('/api/facilities', facilitiesRouter);
app.use('/api/medicines', medicinesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/risks', risksRouter);
app.use('/api/redistribution', redistributionRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/forecasts', forecastsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => console.log(`Listening on all interfaces on port ${port}...`));
