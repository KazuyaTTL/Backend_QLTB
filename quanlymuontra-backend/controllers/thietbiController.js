const db = require('../config/db'); 
exports.getAllThietBi = async (req, res) => {
    try {
        
        const query = `
            SELECT tb.MaTB, tb.TenTB, tb.MoTa, tb.HinhAnh, tb.SoLuongHienCo,
                   ltb.TenLoaiTB, tt.TenTrangThai
            FROM THIETBI tb
            LEFT JOIN LOAITB ltb ON tb.MaLoaiTB = ltb.MaLoaiTB
            LEFT JOIN TRANGTHAI tt ON tb.MaTrangThai = tt.MaTrangThai
            ORDER BY tb.TenTB ASC;
        `;
        const [thietBiList] = await db.query(query);

        if (thietBiList.length === 0) {
            return res.status(200).json({ message: 'Không có thiết bị nào trong kho.', data: [] });
        }

        res.status(200).json({
            message: 'Lấy danh sách thiết bị thành công!',
            data: thietBiList
        });

    } catch (error) {
        console.error('Lỗi khi lấy danh sách thiết bị:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách thiết bị.' });
    }
};


exports.createThietBi = async (req, res) => {
    const { MaTB, TenTB, MaLoaiTB, MaTrangThai, MoTa, HinhAnh, SoLuongHienCo } = req.body;

    if (!MaTB || !TenTB || !MaLoaiTB || !MaTrangThai || SoLuongHienCo === undefined) {
        return res.status(400).json({
            message: 'Vui lòng cung cấp đủ thông tin bắt buộc: MaTB, TenTB, MaLoaiTB, MaTrangThai, SoLuongHienCo.'
        });
    }

    try {
        const [loaiTBExists] = await db.query('SELECT MaLoaiTB FROM LOAITB WHERE MaLoaiTB = ?', [MaLoaiTB]);
        if (loaiTBExists.length === 0) {
            return res.status(400).json({ message: `Mã loại thiết bị '${MaLoaiTB}' không tồn tại.` });
        }

        const [trangThaiExists] = await db.query('SELECT MaTrangThai FROM TRANGTHAI WHERE MaTrangThai = ?', [MaTrangThai]);
        if (trangThaiExists.length === 0) {
            return res.status(400).json({ message: `Mã trạng thái '${MaTrangThai}' không tồn tại.` });
        }
        
        const query = `
            INSERT INTO THIETBI (MaTB, TenTB, MaLoaiTB, MaTrangThai, MoTa, HinhAnh, SoLuongHienCo)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `;
        const [result] = await db.query(query, [MaTB, TenTB, MaLoaiTB, MaTrangThai, MoTa || null, HinhAnh || null, SoLuongHienCo]);

        if (result.affectedRows === 1) {
            res.status(201).json({
                message: 'Thêm thiết bị mới thành công!',
                data: { MaTB, TenTB, MaLoaiTB, MaTrangThai, MoTa, HinhAnh, SoLuongHienCo }
            });
        } else {
            res.status(500).json({ message: 'Không thể thêm thiết bị.' });
        }

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `Mã thiết bị '${MaTB}' đã tồn tại.` });
        }
        console.error('Lỗi khi tạo thiết bị mới:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo thiết bị mới.' });
    }
};


exports.updateThietBi = async (req, res) => {
    const { maTB } = req.params; 
    const { TenTB, MaLoaiTB, MaTrangThai, MoTa, HinhAnh, SoLuongHienCo } = req.body;

    if (TenTB === undefined && MaLoaiTB === undefined && MaTrangThai === undefined && MoTa === undefined && HinhAnh === undefined && SoLuongHienCo === undefined) {
        return res.status(400).json({ message: 'Không có thông tin nào được cung cấp để cập nhật.' });
    }

    try {
        const [existingThietBi] = await db.query('SELECT * FROM THIETBI WHERE MaTB = ?', [maTB]);
        if (existingThietBi.length === 0) {
            return res.status(404).json({ message: `Thiết bị với mã '${maTB}' không tồn tại.` });
        }

        if (MaLoaiTB) {
            const [loaiTBExists] = await db.query('SELECT MaLoaiTB FROM LOAITB WHERE MaLoaiTB = ?', [MaLoaiTB]);
            if (loaiTBExists.length === 0) {
                return res.status(400).json({ message: `Mã loại thiết bị '${MaLoaiTB}' không tồn tại.` });
            }
        }

        if (MaTrangThai) {
            const [trangThaiExists] = await db.query('SELECT MaTrangThai FROM TRANGTHAI WHERE MaTrangThai = ?', [MaTrangThai]);
            if (trangThaiExists.length === 0) {
                return res.status(400).json({ message: `Mã trạng thái '${MaTrangThai}' không tồn tại.` });
            }
        }

        let updateQuery = 'UPDATE THIETBI SET ';
        const queryParams = [];
        const updateFields = [];

        if (TenTB !== undefined) {
            updateFields.push('TenTB = ?');
            queryParams.push(TenTB);
        }
        if (MaLoaiTB !== undefined) {
            updateFields.push('MaLoaiTB = ?');
            queryParams.push(MaLoaiTB);
        }
        if (MaTrangThai !== undefined) {
            updateFields.push('MaTrangThai = ?');
            queryParams.push(MaTrangThai);
        }
        if (MoTa !== undefined) {
            updateFields.push('MoTa = ?');
            queryParams.push(MoTa === null ? null : MoTa); 
        }
        if (HinhAnh !== undefined) {
            updateFields.push('HinhAnh = ?');
            queryParams.push(HinhAnh === null ? null : HinhAnh); 
        }
        if (SoLuongHienCo !== undefined) {
            const soLuong = parseInt(SoLuongHienCo, 10);
            if (isNaN(soLuong) || soLuong < 0) {
                return res.status(400).json({ message: 'Số lượng hiện có phải là một số không âm.' });
            }
            updateFields.push('SoLuongHienCo = ?');
            queryParams.push(soLuong);
        }
        
        
        if (updateFields.length === 0) {
             return res.status(400).json({ message: 'Không có thông tin hợp lệ nào được cung cấp để cập nhật.' });
        }

        updateQuery += updateFields.join(', ');
        updateQuery += ' WHERE MaTB = ?';
        queryParams.push(maTB);

        const [result] = await db.query(updateQuery, queryParams);

        if (result.affectedRows === 0 && result.changedRows === 0) {
            
             return res.status(200).json({ message: `Không có thay đổi nào được thực hiện cho thiết bị '${maTB}'. Dữ liệu có thể giống với hiện tại.` , data: existingThietBi[0]});
        }
        
        const [updatedThietBi] = await db.query(
            `SELECT tb.MaTB, tb.TenTB, tb.MoTa, tb.HinhAnh, tb.SoLuongHienCo,
                    ltb.TenLoaiTB, tt.TenTrangThai
             FROM THIETBI tb
             LEFT JOIN LOAITB ltb ON tb.MaLoaiTB = ltb.MaLoaiTB
             LEFT JOIN TRANGTHAI tt ON tb.MaTrangThai = tt.MaTrangThai
             WHERE tb.MaTB = ?`, [maTB]
        );


        res.status(200).json({
            message: `Cập nhật thiết bị '${maTB}' thành công!`,
            data: updatedThietBi[0]
        });

    } catch (error) {
        console.error(`Lỗi khi cập nhật thiết bị '${maTB}':`, error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật thiết bị.' });
    }
};


exports.deleteThietBi = async (req, res) => {
    const { maTB } = req.params; 

    try {
        const [existingThietBi] = await db.query('SELECT * FROM THIETBI WHERE MaTB = ?', [maTB]);
        if (existingThietBi.length === 0) {
            return res.status(404).json({ message: `Thiết bị với mã '${maTB}' không tồn tại.` });
        }

        const [result] = await db.query('DELETE FROM THIETBI WHERE MaTB = ?', [maTB]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Không tìm thấy thiết bị với mã '${maTB}' để xóa (có thể đã bị xóa trước đó).` });
        }

        res.status(200).json({ message: `Xóa thiết bị '${maTB}' thành công!` });

    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(409).json({
                message: `Không thể xóa thiết bị '${maTB}' vì nó đang được tham chiếu (ví dụ: trong phiếu mượn). Vui lòng xử lý các tham chiếu liên quan trước.`
            });
        }
        console.error(`Lỗi khi xóa thiết bị '${maTB}':`, error);
        res.status(500).json({ message: 'Lỗi server khi xóa thiết bị.' });
    }
};