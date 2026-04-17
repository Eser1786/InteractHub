# 🚀 Tài Liệu Triển Khai Kiến Trúc InteractHub (Delivery D1)
Tài liệu này hệ thống hóa toàn bộ kiến trúc phân phối và môi trường vận hành (production environment) của mạng xã hội **InteractHub**. Dự án áp dụng mô hình phân phối dịch vụ độc lập, sử dụng phối hợp các tài nguyên Cloud để đảm bảo tính sẵn sàng cao (High Availability), bảo mật và khả năng vận hành tự động (Automation).

## 🎯 Tổng Quan Kiến Trúc Vận Hành (Target Architecture)

Kiến trúc triển khai của hệ thống được bẻ nhỏ thành các thực thể độc lập:
1. **Application Hosting (`SmarterASP.NET Engine`)**: Điểm cuối (Endpoint) xử lý RESTful Web API, đảm nhiệm vai trò máy chủ xử lý phân luồng logic lõi (.NET 9).
2. **Database Management (`MSSQL Server Cloud`)**: Lưu trữ và quản trị cơ sở dữ liệu quan hệ, phục vụ các giao dịch nghiệp vụ thông qua cơ chế kết nối Entity Framework.
3. **Media Storage System (`Cloudinary API`)**: Đóng vai trò là Object Storage (lưu trữ Blob) được bảo vệ bằng giao thức xác thực bảo mật đa tầng, phục vụ upload hình ảnh và Video từ Client.
4. **DevOps Automation (`GitHub Actions Integration`)**: Mạch động mạch chủ của hệ thống. Kiểm soát tự động chu kỳ sống của phần mềm bằng CI/CD Pipeline (Tự động phục hồi Package, Build Release và FTP Sync).

---

## 1. URL ứng dụng đang chạy (SmarterASP App)

> **Link truy cập:** `http://[Thay-Ten-Mien-SmarterASP-Cua-Ban-Vao-Day-Ví-dụ: user123.somee.com]/swagger`

*(Đính kèm 1 ảnh chụp màn hình Swagger UI đang tải thành công trên nền tảng Web tại đây)*

---

## 2. File cấu hình pipeline CI/CD (YAML)

Dự án sử dụng cơ chế truyền tải tệp thông qua máy chủ FTP `SamKirkland/FTP-Deploy-Action` trên máy thời gian thực Ubuntu-latest do GitHub cấp.
Đoạn code trong file `.github/workflows/deploy-smarterasp.yml` có nội dung chính xác như sau:

```yaml
name: Deploy to SmarterASP.NET via FTP

on:
  push:
    branches:
      - main
      - dev

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Setup .NET 9
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '9.0.x'
        
    - name: Restore dependencies
      run: dotnet restore backend/InteractHub.sln

    - name: Build and Publish
      run: dotnet publish backend/InteractHub.API/InteractHub.API.csproj -c Release -o ./publish /p:UseAppHost=false
      
    - name: Deploy via FTP
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./publish/
        server-dir: /site1/
```

---

## 3. Tài liệu cấu hình Hệ thống và Môi trường

### 3.1. Thiết lập Không gian Lưu trữ Ảnh (Cloudinary Storage)
1. Truy cập `Cloudinary.com` và đăng ký tài khoản miễn phí.
2. Từ trang Dashboard của Cloudinary, sao chép 3 thông số môi trường: `Cloud Name`, `API Key`, `API Secret`.
3. Chèn cục bộ vào file `appsettings.json` cho Môi trường máy chủ SmarterASP:
```json
  "Cloudinary": {
    "CloudName": "[Tên-điền-vào-đây]",
    "ApiKey": "[Key-điền-vào-đây]",
    "ApiSecret": "[Secret-điền-vào-đây]"
  }
```

### 3.2. Hướng dẫn thiết lập Connection String SQL Server
1. Truy cập Control Panel của `SmarterASP.net`, chọn tab **Database -> MSSQL Database**.
2. Nhấn tạo một DB mới. Sau khi CSDL được tạo, bấm vào nút **"Connection String"** để lấy đoạn mã.
3. Chỉnh sửa tệp `appsettings.json` của phần mềm để chuyển hướng Backend sang SQL Server trực tuyến thay vì LocalDB:
```json
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=SQL8005.site4now.net;Initial Catalog=DB_A123_InteractHub;User Id=db_a123_interacthub_admin;Password=YourPassword123;"
  }
```

### 3.3. Thiết lập Môi trường CI/CD trên Github Actions
Do mã nguồn cấu hình chứa khóa FTP nhảy cảm (`secrets.FTP_SERVER`), ta tuyệt đối không đẩy tài khoản mật khẩu lên Code.
Thay vào đó, thiết lập biến môi trường chạy ngầm trên Github.
1. Mở trang quản trị của Repo GitHub -> **Settings -> Secrets and variables -> Actions**.
2. Thiết lập 3 Repository secrets:
   - `FTP_SERVER`: Vd: `ftp.Smarterasp.net`
   - `FTP_USERNAME`: Vd: `userabc-001`
   - `FTP_PASSWORD`: Vd: `MatKhau`
3. Mỗi khi `git push` thực thi, ActionRunner sẽ kết nối vào FTP bằng 3 biến ẩn danh này và chép đè file.

---

## 4. Bằng chứng Hệ Thống Giám Sát, Log & Triển khai thành công

### 4.1. Ảnh chụp màn hình Log triển khai (GitHub Actions Build Log)
*(Đính kèm 1 ảnh chụp màn hình Github Actions hiển thị mũi tên xanh lá cây (Success) hoàn tất toàn bộ các bước CI/CD)*

### 4.2. Khả năng theo dõi hệ thống Giám sát (System Logging)
Hệ thống tận dụng cơ chế ghi nhật ký hệ thống `.NET Logging Builder`. Khi triển khai tại SmarterASP, mọi lỗi `Http 500` hay lỗi đứt gãy Database đều được ghi nhận trực quan vào thư mục `Logs/` của máy chủ. Cung cấp khả năng kiểm toán mã thực (Real-time code audit) thông qua File Manager mà không cần lệ thuộc vào Azure AppInsights.

*(Đính kèm tài liệu kết thúc)*
