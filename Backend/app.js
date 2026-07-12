import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';
import dashboardRoutes from './routes/dashboard.route.js';
import assetsRoutes from './routes/assets.route.js';
import bookingRoutes from './routes/booking.route.js';


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'An internal error occurred.' });
});

export default app;