const db = require('../config/db');
const { v4: uuidv4 } = require('uuid'); 

exports.createPhieuMuon = async (req, res) => {
   
    const { MaSV, NgayTraDuKien, GhiChu, chiTietMuon } = req.body;

    
    if (!MaSV || !NgayTraDuKien || !chiTietMuon || !Array.isArray(chiTietMuon) || chiTietMuon.length === 0) {
        return res.status(400).json({
            message: 'Vui lòng cung cấp đủ MaSV, NgayTraDuKien và danh sách chi tiết thiết bị mượn (chiTietMuon phải là một mảng không rỗng).'
        });
    }

    for (const item of chiTietMuon) {
        if (!item.MaTB || !item.SoLuong || typeof item.SoLuong !== 'number' || item.SoLuong <= 0) {
            return res.status(400).json({
                message: 'Mỗi chi tiết mượn phải có MaTB và SoLuong (là một số nguyên dương).'
            });
        }
    }
    
    if (isNaN(new Date(NgayTraDuKien).getTime())) {
        return res.status(400).json({ message: 'NgayTraDuKien không hợp lệ. Vui lòng sử dụng định dạng ISO 8601 (ví dụ: YYYY-MM-DDTHH:MM:SSZ).' });
    }

    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction(); // 

        
        const [sinhVienExists] = await connection.query('SELECT MaSV FROM SINHVIEN WHERE MaSV = ?', [MaSV]);
        if (sinhVienExists.length === 0) {
            await connection.rollback(); 
            connection.release(); 
            return res.status(404).json({ message: `Sinh viên với mã '${MaSV}' không tồn tại.` });
        }

        
        for (const item of chiTietMuon) {
            const [thietBiRows] = await connection.query('SELECT TenTB, SoLuongHienCo FROM THIETBI WHERE MaTB = ?', [item.MaTB]);
            if (thietBiRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ message: `Thiết bị với mã '${item.MaTB}' không tồn tại.` });
            }
            const thietBi = thietBiRows[0];
            if (thietBi.SoLuongHienCo < item.SoLuong) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                    message: `Thiết bị '${thietBi.TenTB}' (Mã: ${item.MaTB}) không đủ số lượng. Hiện có: ${thietBi.SoLuongHienCo}, Yêu cầu: ${item.SoLuong}.`
                });
            }
        }

        
        const MaPM = `PM-${uuidv4()}`; 
        const NgayMuon = new Date(); 
        const TinhTrangDuyet = 'ChoDuyet'; 

        const phieuMuonQuery = `
            INSERT INTO PHIEUMUON (MaPM, MaSV, NgayMuon, NgayTraDuKien, TinhTrangDuyet, GhiChu)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        await connection.query(phieuMuonQuery, [MaPM, MaSV, NgayMuon, new Date(NgayTraDuKien), TinhTrangDuyet, GhiChu || null]);

        
        const ctPhieuMuonQuery = `
            INSERT INTO CTPHIEUMUON (MaPM, MaTB, SoLuong, TinhTrangKhiMuon)
            VALUES (?, ?, ?, ?);
        `;
        for (const item of chiTietMuon) {
            
            const [thietBiDetails] = await connection.query('SELECT tt.TenTrangThai FROM THIETBI tb JOIN TRANGTHAI tt ON tb.MaTrangThai = tt.MaTrangThai WHERE tb.MaTB = ?', [item.MaTB]);
            const tinhTrangKhiMuon = thietBiDetails.length > 0 ? thietBiDetails[0].TenTrangThai : 'Không xác định';
            
            await connection.query(ctPhieuMuonQuery, [MaPM, item.MaTB, item.SoLuong, tinhTrangKhiMuon]);
            
           
        }

        await connection.commit(); 

        res.status(201).json({
            message: 'Gửi yêu cầu mượn thiết bị thành công! Phiếu mượn đang ở trạng thái "Chờ duyệt".',
            data: { MaPM, MaSV, NgayMuon: NgayMuon.toISOString(), NgayTraDuKien, TinhTrangDuyet, GhiChu, chiTietMuon }
        });

    } catch (error) {
       
        if (connection) await connection.rollback(); 
        console.error('Lỗi khi tạo phiếu mượn:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo phiếu mượn.' });
    } finally {
        
        if (connection) connection.release();
    }
};