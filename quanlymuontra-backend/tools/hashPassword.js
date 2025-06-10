const bcrypt = require('bcryptjs');
const readline = require('readline');


async function generateHashedPassword(passwordToHash) {
    
    if (!passwordToHash || passwordToHash.trim() === '') {
        console.log('Mật khẩu không được để trống.');
        return null;
    }

    try {
        
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(passwordToHash, salt);

        
        console.log('----------------------------------------------------');
        console.log('Mật khẩu gốc        :', passwordToHash);
        console.log('Mật khẩu đã hash    :', hashedPassword); 
        console.log('----------------------------------------------------');
        console.log('Hãy sao chép giá trị "Mật khẩu đã hash" ở trên để lưu vào cơ sở dữ liệu.');

        return hashedPassword; 
    } catch (error) {
        console.error('Lỗi xảy ra trong quá trình hash mật khẩu:', error);
        return null; 
    }
}


async function main() {
    
    const passwordFromCommandLineArgument = process.argv[2];

    if (passwordFromCommandLineArgument) {
        
        console.log(`Đang hash mật khẩu "${passwordFromCommandLineArgument}" được cung cấp từ tham số dòng lệnh...`);
        await generateHashedPassword(passwordFromCommandLineArgument);
    } else {
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Nhập mật khẩu bạn muốn hash (sau đó nhấn Enter): ', async (passwordFromUserInput) => {
            
            if (!passwordFromUserInput || passwordFromUserInput.trim() === '') {
                console.log('Không có mật khẩu nào được nhập. Chương trình kết thúc.');
            } else {
                await generateHashedPassword(passwordFromUserInput);
            }
            rl.close(); 
        });
    }
}


main();