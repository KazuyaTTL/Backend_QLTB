require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); 
const authRoutes = require('./routes/authRoutes');
const thietbiRoutes = require('./routes/thietbiRoutes'); 
const phieumuonRoutes = require('./routes/phieumuonRoutes');
const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.get('/', (req, res) => {
    res.send('Welcome to Quan Ly Muon Tra API!');
});

app.use('/api/auth', authRoutes);       
app.use('/api/thietbi', thietbiRoutes); 
app.use('/api/phieumuon', phieumuonRoutes);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Đã có lỗi xảy ra ở phía server.');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
    db.query('SELECT 1')
        .then(() => console.log('Database connection confirmed on server start.'))
        .catch(err => console.error('Database connection failed on server start:', err));
});