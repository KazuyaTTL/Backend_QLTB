const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { TenDangNhap, MatKhau } = req.body;

    if (!TenDangNhap || !MatKhau) {
        return res.status(400).json({ message: 'Vui lòng cung cấp tên đăng nhập và mật khẩu.' });
    }

    try {
        
        const [users] = await db.query('SELECT * FROM TAIKHOAN WHERE TenDangNhap = ?', [TenDangNhap]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Tên đăng nhập không tồn tại.' });
        }

        const user = users[0];

       
        const isMatch = await bcrypt.compare(MatKhau, user.MatKhau);

        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu không chính xác.' });
        }

      
        const payload = {
            userId: user.MaTK,
            username: user.TenDangNhap,
            userType: user.LoaiTaiKhoan
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token: token,
            user: { 
                MaTK: user.MaTK,
                TenDangNhap: user.TenDangNhap,
                LoaiTaiKhoan: user.LoaiTaiKhoan
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra phía server.' });
    }
};

