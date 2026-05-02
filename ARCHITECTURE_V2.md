# Kiến trúc UFO-GAME v2 (Mở rộng)

Dựa trên yêu cầu không sửa đổi code cũ, chúng ta sẽ xây dựng một lớp bao bọc (Wrapper) hoặc các Component mới kế thừa logic từ `UfoShooter.tsx` nhưng mở rộng thêm các tính năng.

## 1. Cấu trúc Thư mục Mới
- `src/v2/components/`: Chứa các UI component mới (Cửa hàng, Menu mở rộng).
- `src/v2/game/`: Chứa logic game mới.
    - `InfiniteMap.ts`: Quản lý việc tạo bản đồ vô tận (chunks).
    - `Environment.ts`: Quản lý cây xanh, vật cản.
    - `BotSystem.ts`: Quản lý AI cho bot.
    - `StoreSystem.ts`: Quản lý tiền tệ và vật phẩm.
- `src/v2/UfoShooterV2.tsx`: Component chính thay thế `UfoShooter.tsx` trong `App.tsx`.

## 2. Các Tính năng Chi tiết

### Bản đồ 3D không giới hạn & Môi trường
- Sử dụng cơ chế **Chunking**: Chia bản đồ thành các ô vuông. Khi người chơi di chuyển, các ô mới sẽ được tạo ra và các ô ở xa sẽ bị xóa.
- **Cây xanh & Vật cản**: Sử dụng `InstancedMesh` để tối ưu hiệu năng khi hiển thị hàng ngàn cây. Vật cản sẽ có collision đơn giản.

### Hệ thống Bot (AI)
- Bot sẽ có các trạng thái: `IDLE`, `WANDER`, `CHASE`, `ATTACK`.
- Sử dụng thuật toán tìm đường đơn giản hoặc di chuyển trực tiếp về phía mục tiêu nếu không có vật cản.
- Đội hình: Mặc định 5 người/đội (1 người thật + 4 bot).

### Cửa hàng & Tiền tệ
- Tiền tệ ảo: `Nebula Credits`. Nhận được khi tiêu diệt UFO hoặc Bot địch.
- Vật phẩm: Nâng cấp tốc độ, sát thương, máu, hoặc skin mới cho Tank.

### Tối ưu hóa
- **Mobile**: Joystick ảo (đã có một phần trong code cũ, sẽ cải tiến), nút bấm to hơn, giảm chất lượng đồ họa nếu cần.
- **Desktop**: Giữ nguyên điều khiển chuột/bàn phím nhưng thêm các phím tắt cho cửa hàng.

## 3. Kế hoạch Triển khai (Không sửa code cũ)
1. Tạo `UfoShooterV2.tsx` bằng cách copy logic từ `UfoShooter.tsx` nhưng refactor thành các module nhỏ hơn trong `src/v2/`.
2. Cập nhật `App.tsx` để sử dụng `UfoShooterV2`.
3. Thêm các component UI mới đè lên canvas game.
