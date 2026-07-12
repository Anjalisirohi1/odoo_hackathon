import dotenv from 'dotenv';

dotenv.config();

const app = (await import('./app.js')).default;

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});