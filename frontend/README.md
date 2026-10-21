# Hermes WebUI Mobile App (React Native / Expo)

Ứng dụng di động thuần React Native (Expo) dành riêng cho Android và iOS để quản lý và kết nối trực tiếp đến các máy chủ Hermes WebUI mà không cần mở trình duyệt.

## Các tính năng mới đã được nâng cấp

1. **Giao diện Terminal Tech-Oriented (Hỗ trợ Sáng / Tối)**:
   - Giao diện console hiện đại, độ tương phản cao với phông chữ monospace.
   - Nút chuyển đổi nhanh giữa **Giao diện Tối (Dark)** và **Giao diện Sáng (Light)** ngay trên thanh điều hướng.

2. **Kiểm tra trạng thái máy chủ (Live Ping & Latency)**:
   - Tự động kiểm tra kết nối tới các máy chủ Hermes khi mở ứng dụng và định kỳ mỗi 30 giây.
   - Hiển thị chấm trạng thái trực quan trên mỗi thẻ máy chủ:
     - **TRỰC TUYẾN / ONLINE**: Chấm xanh lá cây kèm thời gian phản hồi (ví dụ: `112ms`).
     - **NGOẠI TUYẾN / OFFLINE**: Chấm đỏ khi không thể kết nối.
     - **ĐANG QUÉT / PROBING**: Khi đang gửi yêu cầu kiểm tra.
   - Nút **KIỂM TRA TẤT CẢ (PING ALL)** để quét toàn bộ máy chủ bất kỳ lúc nào.

3. **Hỗ trợ Song ngữ Tiếng Việt & Tiếng Anh**:
   - Nút gạt chuyển đổi nhanh `[ EN | VI ]` trên góc thanh tiêu đề.
   - Hỗ trợ đầy đủ dấu thanh tiếng Việt rõ ràng, chuẩn Unicode.

4. **Trình duyệt WebView Gốc (Native React Native WebView)**:
   - Sử dụng `react-native-webview` độc lập cấp cao nhất của hệ điều hành.
   - Hoàn toàn **không bị ảnh hưởng bởi chính sách `X-Frame-Options: DENY` hay CSP `frame-ancestors`** của Cloudflare/Hermes.
   - Tự động tiêm JavaScript điền mật khẩu và tự động đăng nhập khi vào trang.
   - Tích hợp nút Back phần cứng của Android (`BackHandler`).
   - Nút sao chép nhanh mật khẩu ngay trên thanh tiêu đề WebView.

5. **Lưu trữ bảo mật & Sao lưu cấu hình**:
   - Lưu trữ cục bộ an toàn thông qua AsyncStorage.
   - Hỗ trợ Xuất (Export) và Nhập (Import) danh sách cấu hình máy chủ dưới dạng JSON nhanh chóng.

---

## Hướng dẫn cài đặt & chạy trên thiết bị di động

### 1. Cài đặt thư viện:
```bash
cd frontend
npm install
```

### 2. Chạy thử nghiệm trên điện thoại qua Expo Go:
```bash
npx expo start
```
- Mở ứng dụng **Expo Go** trên điện thoại (tải từ Google Play Store hoặc App Store).
- Quét mã QR hiển thị trên terminal để mở app trực tiếp trên điện thoại của bạn.

### 3. Đóng gói file cài đặt APK (Cài trực tiếp lên điện thoại Android):

Dự án đã được cấu hình sẵn file `eas.json` với profile `preview` (buildType: `apk`).

#### Cách 1: Xuất file APK qua Expo Cloud Build (Khuyên dùng - Nhanh nhất & Không cần cài Android SDK):
```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Đăng nhập hoặc tạo tài khoản Expo miễn phí (nếu chưa có)
npx eas-cli login

# 3. Chạy lệnh xuất file APK
npm run build:apk
# Hoặc: npx eas-cli build --platform android --profile preview
```
- Quá trình build sẽ diễn ra trên hạ tầng đám mây của Expo.
- Sau khi hoàn thành, terminal sẽ xuất hiện **đường dẫn tải trực tiếp file `.apk`** và **mã QR code**.
- Bạn chỉ cần dùng điện thoại quét mã QR hoặc tải file `.apk` về máy để cài đặt và sử dụng ngay lập tức!

---

#### Cách 2: Trải nghiệm ngay trên điện thoại thật bằng Expo Go (Không cần chờ build APK):
Nếu muốn thử nghiệm ngay tức thì các tính năng (WebView gốc, tự động điền mật khẩu, giao diện sáng/tối, sao lưu) mà không cần đợi đóng gói APK:
1. Cài đặt ứng dụng **Expo Go** từ Google Play Store (Android).
2. Chạy lệnh:
   ```bash
   cd frontend
   npx expo start
   ```
3. Mở ứng dụng Expo Go trên điện thoại, quét mã QR hiển thị trên màn hình terminal. Ứng dụng sẽ khởi chạy ngay lập tức với đầy đủ tính năng native.

---

#### Cách 3: Build APK offline cục bộ (Nếu máy tính của bạn đã có sẵn Android Studio & JDK 17):
```bash
cd frontend
# Tạo thư mục android native
npx expo prebuild --platform android

# Di chuyển vào thư mục android và build APK release
cd android
./gradlew assembleRelease

# File APK sau khi build xong sẽ nằm tại:
# frontend/android/app/build/outputs/apk/release/app-release.apk
```
