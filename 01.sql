-- =============================================
-- HỆ THỐNG QUẢN LÝ MƯỢN THIẾT BỊ
-- Thiết kế Cơ sở dữ liệu SQL
-- =============================================

-- Tạo database
CREATE DATABASE equipment_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE equipment_management;

-- =============================================
-- 1. BẢNG NGƯỜI DÙNG (Users)
-- =============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NULL COMMENT 'Mã sinh viên (chỉ dành cho sinh viên)',
    full_name VARCHAR(100) NOT NULL COMMENT 'Họ và tên',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT 'Email đăng nhập',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã mã hóa',
    role ENUM('student', 'admin') DEFAULT 'student' COMMENT 'Vai trò người dùng',
    phone VARCHAR(15) NULL COMMENT 'Số điện thoại',
    faculty VARCHAR(100) NULL COMMENT 'Khoa (dành cho sinh viên)',
    class VARCHAR(50) NULL COMMENT 'Lớp (dành cho sinh viên)',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Tài khoản có hoạt động không',
    last_login TIMESTAMP NULL COMMENT 'Lần đăng nhập cuối',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_email (email),
    INDEX idx_student_id (student_id),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB COMMENT='Bảng quản lý người dùng';

-- =============================================
-- 2. BẢNG DANH MỤC THIẾT BỊ (Equipment Categories)
-- =============================================
CREATE TABLE equipment_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Mã danh mục',
    name VARCHAR(100) NOT NULL COMMENT 'Tên danh mục',
    description TEXT NULL COMMENT 'Mô tả danh mục',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục thiết bị';

-- Insert default categories
INSERT INTO equipment_categories (code, name, description) VALUES
('ELECTRONICS', 'Thiết bị điện tử', 'Laptop, máy tính, điện thoại...'),
('FURNITURE', 'Đồ nội thất', 'Bàn ghế, tủ kệ...'),
('SPORTS', 'Thiết bị thể thao', 'Bóng đá, cầu lông...'),
('LABORATORY', 'Thiết bị thí nghiệm', 'Kính hiển vi, ống nghiệm...'),
('AUDIO_VISUAL', 'Thiết bị âm thanh - hình ảnh', 'Máy chiếu, loa, micro...'),
('OTHER', 'Khác', 'Các thiết bị khác');

-- =============================================
-- 3. BẢNG THIẾT BỊ (Equipment)
-- =============================================
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Mã thiết bị',
    name VARCHAR(100) NOT NULL COMMENT 'Tên thiết bị',
    category_id INT NOT NULL COMMENT 'ID danh mục',
    description TEXT NULL COMMENT 'Mô tả thiết bị',
    specifications TEXT NULL COMMENT 'Thông số kỹ thuật',
    
    -- Số lượng
    total_quantity INT NOT NULL DEFAULT 0 COMMENT 'Tổng số lượng',
    available_quantity INT NOT NULL DEFAULT 0 COMMENT 'Số lượng có sẵn',
    borrowed_quantity INT NOT NULL DEFAULT 0 COMMENT 'Số lượng đang được mượn',
    
    -- Tình trạng
    condition_status ENUM('new', 'good', 'fair', 'poor', 'damaged') DEFAULT 'good' COMMENT 'Tình trạng thiết bị',
    
    -- Vị trí
    building VARCHAR(50) NOT NULL COMMENT 'Tòa nhà',
    floor VARCHAR(10) NOT NULL COMMENT 'Tầng',
    room VARCHAR(20) NOT NULL COMMENT 'Phòng',
    
    -- Thông tin mua sắm
    purchase_date DATE NULL COMMENT 'Ngày mua',
    purchase_price DECIMAL(15,2) NULL COMMENT 'Giá mua',
    warranty_expiry DATE NULL COMMENT 'Hết hạn bảo hành',
    
    -- Hình ảnh
    image_url VARCHAR(500) NULL COMMENT 'URL hình ảnh chính',
    
    -- Trạng thái
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Thiết bị có hoạt động không',
    notes TEXT NULL COMMENT 'Ghi chú',
    
    -- Audit fields
    created_by INT NOT NULL COMMENT 'Người tạo',
    updated_by INT NULL COMMENT 'Người cập nhật cuối',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_code (code),
    INDEX idx_name (name),
    INDEX idx_category (category_id),
    INDEX idx_condition (condition_status),
    INDEX idx_available (available_quantity),
    INDEX idx_location (building, floor, room),
    INDEX idx_is_active (is_active),
    FULLTEXT idx_search (name, description),
    
    -- Constraints
    CONSTRAINT chk_quantities CHECK (total_quantity = available_quantity + borrowed_quantity),
    CONSTRAINT chk_positive_quantities CHECK (
        total_quantity >= 0 AND 
        available_quantity >= 0 AND 
        borrowed_quantity >= 0
    )
) ENGINE=InnoDB COMMENT='Bảng quản lý thiết bị';

-- =============================================
-- 4. BẢNG YÊU CẦU MƯỢN THIẾT BỊ (Borrow Requests)
-- =============================================
CREATE TABLE borrow_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_number VARCHAR(20) UNIQUE NOT NULL COMMENT 'Số yêu cầu (auto-generated)',
    borrower_id INT NOT NULL COMMENT 'ID người mượn',
    
    -- Thời gian
    borrow_date DATE NOT NULL COMMENT 'Ngày mượn',
    expected_return_date DATE NOT NULL COMMENT 'Ngày trả dự kiến',
    actual_return_date DATE NULL COMMENT 'Ngày trả thực tế',
    
    -- Nội dung yêu cầu
    purpose TEXT NOT NULL COMMENT 'Mục đích sử dụng',
    notes TEXT NULL COMMENT 'Ghi chú thêm',
    
    -- Trạng thái và ưu tiên
    status ENUM('pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue', 'cancelled') 
           DEFAULT 'pending' COMMENT 'Trạng thái yêu cầu',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT 'Mức độ ưu tiên',
    
    -- Thông tin duyệt
    reviewed_by INT NULL COMMENT 'Người duyệt',
    reviewed_at TIMESTAMP NULL COMMENT 'Thời gian duyệt',
    review_notes TEXT NULL COMMENT 'Ghi chú khi duyệt',
    rejection_reason TEXT NULL COMMENT 'Lý do từ chối',
    
    -- Thông tin mượn/trả
    borrowed_by INT NULL COMMENT 'Admin ghi nhận mượn',
    borrowed_at TIMESTAMP NULL COMMENT 'Thời gian ghi nhận mượn',
    returned_by INT NULL COMMENT 'Admin ghi nhận trả',
    returned_at TIMESTAMP NULL COMMENT 'Thời gian ghi nhận trả',
    
    -- Trạng thái quá hạn
    is_overdue BOOLEAN DEFAULT FALSE COMMENT 'Có quá hạn không',
    overdue_notification_sent BOOLEAN DEFAULT FALSE COMMENT 'Đã gửi thông báo quá hạn',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (borrower_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    FOREIGN KEY (borrowed_by) REFERENCES users(id),
    FOREIGN KEY (returned_by) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_request_number (request_number),
    INDEX idx_borrower (borrower_id),
    INDEX idx_status (status),
    INDEX idx_borrow_date (borrow_date),
    INDEX idx_expected_return (expected_return_date),
    INDEX idx_is_overdue (is_overdue),
    INDEX idx_created_at (created_at),
    
    -- Compound indexes
    INDEX idx_status_date (status, borrow_date),
    INDEX idx_borrower_status (borrower_id, status),
    
    -- Constraints
    CONSTRAINT chk_dates CHECK (expected_return_date > borrow_date),
    CONSTRAINT chk_actual_return CHECK (actual_return_date IS NULL OR actual_return_date >= borrow_date)
) ENGINE=InnoDB COMMENT='Bảng yêu cầu mượn thiết bị';

-- =============================================
-- 5. BẢNG CHI TIẾT YÊU CẦU MƯỢN (Request Details)
-- =============================================
CREATE TABLE borrow_request_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL COMMENT 'ID yêu cầu mượn',
    equipment_id INT NOT NULL COMMENT 'ID thiết bị',
    quantity INT NOT NULL COMMENT 'Số lượng yêu cầu mượn',
    actual_return_quantity INT DEFAULT 0 COMMENT 'Số lượng trả thực tế',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (request_id) REFERENCES borrow_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    
    -- Indexes
    INDEX idx_request (request_id),
    INDEX idx_equipment (equipment_id),
    UNIQUE KEY uk_request_equipment (request_id, equipment_id),
    
    -- Constraints
    CONSTRAINT chk_positive_quantity CHECK (quantity > 0),
    CONSTRAINT chk_return_quantity CHECK (actual_return_quantity >= 0)
) ENGINE=InnoDB COMMENT='Chi tiết thiết bị trong yêu cầu mượn';

-- =============================================
-- 6. BẢNG LỊCH SỬ MƯỢN TRẢ (Borrow History)
-- =============================================
CREATE TABLE borrow_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL COMMENT 'ID yêu cầu mượn',
    equipment_id INT NOT NULL COMMENT 'ID thiết bị',
    borrower_id INT NOT NULL COMMENT 'ID người mượn',
    
    quantity INT NOT NULL COMMENT 'Số lượng mượn',
    borrow_date DATE NOT NULL COMMENT 'Ngày mượn',
    expected_return_date DATE NOT NULL COMMENT 'Ngày trả dự kiến',
    actual_return_date DATE NULL COMMENT 'Ngày trả thực tế',
    
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    
    -- Audit fields
    recorded_by INT NOT NULL COMMENT 'Admin ghi nhận',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (request_id) REFERENCES borrow_requests(id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (borrower_id) REFERENCES users(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_request (request_id),
    INDEX idx_equipment (equipment_id),
    INDEX idx_borrower (borrower_id),
    INDEX idx_borrow_date (borrow_date),
    INDEX idx_status (status)
) ENGINE=InnoDB COMMENT='Lịch sử mượn trả thiết bị';

-- =============================================
-- 7. BẢNG BÁO CÁO HƯ HỎNG (Damage Reports)
-- =============================================
CREATE TABLE damage_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL COMMENT 'ID yêu cầu mượn',
    equipment_id INT NOT NULL COMMENT 'ID thiết bị bị hư hỏng',
    
    description TEXT NOT NULL COMMENT 'Mô tả hư hỏng',
    severity ENUM('minor', 'moderate', 'severe') DEFAULT 'minor' COMMENT 'Mức độ nghiêm trọng',
    repair_cost DECIMAL(15,2) NULL COMMENT 'Chi phí sửa chữa ước tính',
    
    reported_by INT NOT NULL COMMENT 'Người báo cáo',
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Xử lý
    is_resolved BOOLEAN DEFAULT FALSE COMMENT 'Đã xử lý chưa',
    resolution_notes TEXT NULL COMMENT 'Ghi chú xử lý',
    resolved_by INT NULL COMMENT 'Người xử lý',
    resolved_at TIMESTAMP NULL COMMENT 'Thời gian xử lý',
    
    -- Foreign Keys
    FOREIGN KEY (request_id) REFERENCES borrow_requests(id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_request (request_id),
    INDEX idx_equipment (equipment_id),
    INDEX idx_severity (severity),
    INDEX idx_is_resolved (is_resolved)
) ENGINE=InnoDB COMMENT='Báo cáo hư hỏng thiết bị';

-- =============================================
-- 8. BẢNG THÔNG BÁO (Notifications)
-- =============================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'ID người nhận',
    type ENUM('request_approved', 'request_rejected', 'due_reminder', 'overdue_warning', 'return_confirmation') 
         NOT NULL COMMENT 'Loại thông báo',
    
    title VARCHAR(200) NOT NULL COMMENT 'Tiêu đề thông báo',
    message TEXT NOT NULL COMMENT 'Nội dung thông báo',
    
    -- Liên kết
    related_request_id INT NULL COMMENT 'ID yêu cầu liên quan',
    related_equipment_id INT NULL COMMENT 'ID thiết bị liên quan',
    
    -- Trạng thái
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Đã đọc chưa',
    is_email_sent BOOLEAN DEFAULT FALSE COMMENT 'Đã gửi email chưa',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL COMMENT 'Thời gian đọc',
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (related_request_id) REFERENCES borrow_requests(id),
    FOREIGN KEY (related_equipment_id) REFERENCES equipment(id),
    
    -- Indexes
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='Thông báo hệ thống';

-- =============================================
-- 9. TRIGGERS VÀ STORED PROCEDURES
-- =============================================

-- Trigger auto-generate request number
DELIMITER //
CREATE TRIGGER tr_generate_request_number 
BEFORE INSERT ON borrow_requests
FOR EACH ROW
BEGIN
    DECLARE next_num INT;
    DECLARE year_month VARCHAR(4);
    
    SET year_month = DATE_FORMAT(NOW(), '%y%m');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_number, 3) AS UNSIGNED)), 0) + 1 
    INTO next_num
    FROM borrow_requests
    WHERE request_number LIKE CONCAT('BR', year_month, '%');
    
    SET NEW.request_number = CONCAT('BR', year_month, LPAD(next_num, 4, '0'));
END//

-- Trigger cập nhật số lượng thiết bị khi duyệt yêu cầu
CREATE TRIGGER tr_update_equipment_quantity_on_approve
AFTER UPDATE ON borrow_requests
FOR EACH ROW
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        UPDATE equipment e
        JOIN borrow_request_details brd ON e.id = brd.equipment_id
        SET e.available_quantity = e.available_quantity - brd.quantity,
            e.borrowed_quantity = e.borrowed_quantity + brd.quantity
        WHERE brd.request_id = NEW.id;
    END IF;
    
    IF NEW.status = 'returned' AND OLD.status IN ('borrowed', 'overdue') THEN
        UPDATE equipment e
        JOIN borrow_request_details brd ON e.id = brd.equipment_id
        SET e.available_quantity = e.available_quantity + brd.actual_return_quantity,
            e.borrowed_quantity = e.borrowed_quantity - brd.actual_return_quantity
        WHERE brd.request_id = NEW.id;
    END IF;
END//

DELIMITER ;

-- =============================================
-- 10. VIEWS HỮU ÍCH
-- =============================================

-- View thống kê thiết bị
CREATE VIEW v_equipment_statistics AS
SELECT 
    ec.name AS category_name,
    COUNT(e.id) AS total_equipment,
    SUM(e.total_quantity) AS total_quantity,
    SUM(e.available_quantity) AS available_quantity,
    SUM(e.borrowed_quantity) AS borrowed_quantity,
    ROUND(SUM(e.borrowed_quantity) * 100.0 / NULLIF(SUM(e.total_quantity), 0), 2) AS utilization_rate
FROM equipment e
JOIN equipment_categories ec ON e.category_id = ec.id
WHERE e.is_active = TRUE
GROUP BY ec.id, ec.name;

-- View yêu cầu đang chờ duyệt
CREATE VIEW v_pending_requests AS
SELECT 
    br.id,
    br.request_number,
    u.full_name AS borrower_name,
    u.student_id,
    br.borrow_date,
    br.expected_return_date,
    br.purpose,
    br.priority,
    br.created_at,
    COUNT(brd.id) AS equipment_count,
    SUM(brd.quantity) AS total_quantity
FROM borrow_requests br
JOIN users u ON br.borrower_id = u.id
JOIN borrow_request_details brd ON br.id = brd.request_id
WHERE br.status = 'pending'
GROUP BY br.id;

-- View thiết bị quá hạn
CREATE VIEW v_overdue_equipment AS
SELECT 
    br.id AS request_id,
    br.request_number,
    u.full_name AS borrower_name,
    u.email AS borrower_email,
    u.phone AS borrower_phone,
    e.name AS equipment_name,
    brd.quantity,
    br.expected_return_date,
    DATEDIFF(CURDATE(), br.expected_return_date) AS days_overdue
FROM borrow_requests br
JOIN users u ON br.borrower_id = u.id
JOIN borrow_request_details brd ON br.id = brd.request_id
JOIN equipment e ON brd.equipment_id = e.id
WHERE br.status IN ('borrowed', 'overdue')
  AND br.expected_return_date < CURDATE();

-- =============================================
-- 11. INSERT DỮ LIỆU MẪU
-- =============================================

-- Tạo admin user
INSERT INTO users (full_name, email, password_hash, role, phone) VALUES
('Admin System', 'admin@equipment.com', '$2b$12$...', 'admin', '0123456789');

-- Tạo sinh viên mẫu
INSERT INTO users (student_id, full_name, email, password_hash, role, phone, faculty, class) VALUES
('SV001', 'Nguyễn Văn An', 'student1@student.edu.vn', '$2b$12$...', 'student', '0987654321', 'Công nghệ thông tin', 'CNTT01'),
('SV002', 'Trần Thị Bình', 'student2@student.edu.vn', '$2b$12$...', 'student', '0987654322', 'Điện tử viễn thông', 'DTVT01'),
('SV003', 'Lê Văn Cường', 'student3@student.edu.vn', '$2b$12$...', 'student', '0987654323', 'Cơ khí', 'CK01');

-- Tạo thiết bị mẫu
INSERT INTO equipment (code, name, category_id, description, specifications, total_quantity, available_quantity, borrowed_quantity, building, floor, room, created_by) VALUES
('LAPTOP001', 'Laptop Dell Inspiron 15', 1, 'Laptop phục vụ học tập và nghiên cứu', 'CPU: Intel i5, RAM: 8GB, Storage: 256GB SSD', 10, 8, 2, 'A', '2', 'A201', 1),
('PROJ001', 'Máy chiếu Epson EB-X41', 5, 'Máy chiếu cho phòng học và hội thảo', 'Độ phân giải: XGA (1024×768), Độ sáng: 3600 lumens', 5, 4, 1, 'B', '1', 'B101', 1),
('MIC001', 'Micro không dây Shure', 5, 'Micro không dây cho sự kiện và thuyết trình', 'Tần số: UHF, Phạm vi: 100m, Pin: 8 hours', 8, 8, 0, 'A', '1', 'A105', 1);

-- =============================================
-- 12. INDEX VÀ OPTIMIZATION
-- =============================================

-- Composite indexes for better performance
CREATE INDEX idx_equipment_search ON equipment (category_id, is_active, available_quantity);
CREATE INDEX idx_request_timeline ON borrow_requests (status, borrow_date, expected_return_date);
CREATE INDEX idx_user_requests ON borrow_requests (borrower_id, status, created_at);

-- =============================================
-- KẾT THÚC THIẾT KẾ DATABASE
-- =============================================
