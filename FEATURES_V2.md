# UFO-GAME v2 - Hướng dẫn tính năng mới

## Tổng quan

UFO-GAME v2 là phiên bản nâng cấp của trò chơi tank bắn UFO với các tính năng mới:

- **Bản đồ 3D vô tận**: Sử dụng hệ thống chunk động để tạo bản đồ không giới hạn
- **Hệ thống Bot**: Các tank AI có thể di chuyển, tấn công và hợp tác theo đội
- **Cửa hàng & Tiền tệ**: Kiếm Nebula Credits từ chiến thắng để nâng cấp vũ khí, giáp, tốc độ
- **Cấu hình trò chơi**: Chọn số lượng người chơi, bot, đội và độ khó

## Cách chơi

### Menu chính

Khi khởi động trò chơi, bạn sẽ thấy menu chính với các tùy chọn:

- **START MISSION**: Bắt đầu trò chơi với cấu hình mặc định
- Hướng dẫn điều khiển được hiển thị trên menu

### Cấu hình trò chơi

Trước khi bắt đầu, bạn có thể tùy chỉnh:

| Tùy chọn | Mô tả | Mặc định |
| :--- | :--- | :--- |
| Human Players Per Team | Số lượng người chơi thực tế trong mỗi đội | 1 |
| Bots Per Team | Số lượng bot trong mỗi đội | 4 |
| Number of Teams | Số đội chơi (1-4) | 2 |
| Difficulty | Mức độ khó (easy, normal, hard) | normal |

### Điều khiển trong trò chơi

**Desktop:**
- **WSAD** hoặc **Mũi tên**: Di chuyển tank
- **Chuột**: Nhắm bắn (cần click để khóa con trỏ)
- **Chuột trái**: Bắn
- **Space**: Bắn (khi không khóa con trỏ)
- **ESC**: Mở cửa hàng

**Mobile:**
- **Joystick trái**: Di chuyển
- **Nút bấm phải**: Nhắm bắn
- **Nút FIRE**: Bắn

### Bản đồ vô tận

Bản đồ được chia thành các chunk (ô vuông). Khi bạn di chuyển, các chunk mới sẽ được tạo ra tự động. Mỗi chunk chứa:

- Cây xanh (được tối ưu hóa bằng InstancedMesh)
- Vật cản (đá) có va chạm đơn giản
- Địa hình với màu sắc ngẫu nhiên

### Hệ thống Bot

Các bot AI hoạt động theo các trạng thái:

- **IDLE**: Chờ đợi
- **WANDER**: Đi loanh quanh bản đồ
- **CHASE**: Theo đuổi mục tiêu khi phát hiện
- **ATTACK**: Bắn vào mục tiêu

Bot sẽ:
- Tự động di chuyển và tránh vật cản
- Nhắm bắn vào mục tiêu trong phạm vi phát hiện
- Hợp tác với bot cùng đội

### Cửa hàng & Nâng cấp

Kiếm được Nebula Credits từ việc tiêu diệt bot địch. Sử dụng credits để mua nâng cấp:

| Danh mục | Vật phẩm | Giá | Hiệu ứng |
| :--- | :--- | :--- | :--- |
| Weapon | Plasma Cannon Upgrade | 500 | +50% sát thương |
| Weapon | Quantum Blaster | 1500 | +100% sát thương |
| Armor | Shield Generator | 800 | +50 máu |
| Armor | Reinforced Plating | 2000 | +100 máu |
| Speed | Turbo Engines | 600 | +30% tốc độ |
| Speed | Hyperdrive System | 1800 | +60% tốc độ |
| Skin | Crimson Warrior | 300 | Màu đỏ |
| Skin | Golden Titan | 400 | Màu vàng |
| Skin | Neon Phantom | 500 | Màu tím |

Để mở cửa hàng trong trò chơi, nhấn **ESC** hoặc click nút Settings.

## Cấu trúc thư mục

```
src/
├── App.tsx (cũ - giữ nguyên)
├── AppV2.tsx (mới - tích hợp tất cả)
├── v2/
│   ├── components/
│   │   ├── Store.tsx (UI cửa hàng)
│   │   └── GameSetup.tsx (UI cấu hình)
│   └── game/
│       ├── InfiniteMap.ts (quản lý bản đồ vô tận)
│       ├── BotSystem.ts (hệ thống AI bot)
│       └── StoreSystem.ts (hệ thống tiền tệ & nâng cấp)
├── components/
│   └── Game/
│       └── UfoShooter.tsx (cũ - giữ nguyên)
└── main.tsx (cập nhật để sử dụng AppV2)
```

## Ghi chú kỹ thuật

- **Không sửa code cũ**: Tất cả tính năng mới được thêm vào thư mục `v2/` mà không sửa đổi code gốc
- **Tối ưu hóa**: Sử dụng InstancedMesh cho cây xanh, chunk loading/unloading cho bản đồ
- **Responsive**: Giao diện tự động điều chỉnh cho mobile và desktop
- **Performance**: Fog rendering, shadow mapping, và culling được áp dụng để tối ưu FPS

## Tương lai

Các tính năng có thể thêm vào:

- Hệ thống nhiệm vụ (quests)
- Bản đồ có theme khác nhau
- Vũ khí đặc biệt với hiệu ứng
- Multiplayer online
- Leaderboard
