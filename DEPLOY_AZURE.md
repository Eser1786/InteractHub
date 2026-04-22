# Hướng Dẫn Triển Khai (Deploy) Hệ Thống InteractHub Lên Microsoft Azure

Tài liệu này mô tả chi tiết quy trình đưa ứng dụng **InteractHub** (bao gồm Backend .NET 9 và Frontend React Vite) lên hạ tầng điện toán đám mây **Microsoft Azure**. Mô hình triển khai là **SPA Integration** (Tích hợp Frontend tĩnh vào thẳng máy chủ Backend) để chạy chung trên một tên miền (Domain) duy nhất.

---

## 1. Cách Thức Hoạt Động Của Hệ Thống Khi Đưa Lên Azure

Thay vì thuê 2 máy chủ riêng biệt (1 cho Frontend, 1 cho Backend) và gặp phải rắc rối về CORS. Hệ thống áp dụng chiến lược **SPA Integration**:
- **Frontend (React)** sẽ được biên dịch (Build) thành các tệp HTML, CSS, JS tĩnh.
- Toàn bộ các tệp tĩnh này sẽ được nhồi vào thư mục `wwwroot` của máy chủ **Backend (.NET)**.
- Khi người dùng truy cập web, máy chủ .NET sẽ đóng vai trò phục vụ giao diện web trước. Nếu người dùng gọi API, hệ thống sẽ trả về dữ liệu.

---

## 2. Cách Để Deploy Lên Azure (Quy Trình Chuẩn Bị)

Để chạy được hệ thống, cần chuẩn bị sẵn 2 tài nguyên cơ bản trên cổng thông tin [Azure Portal](https://portal.azure.com/):

### Bước 1: Tạo Database (Azure SQL Database)
- Khởi tạo Single SQL Database.
- **Lưu ý cực kỳ quan trọng:** Ở phần Firewall của Database, phải chọn bật tuỳ chọn **"Allow Azure services and resources to access this server"** để máy chủ Web App có quyền chui vào Database tạo bảng.
- Copy chuỗi kết nối **ADO.NET Connection String**.

### Bước 2: Tạo Máy chủ Web (Azure App Service)
- Tạo một Web App mới với Runtime stack là `.NET 9 (STS)`. Có thể chọn HĐH Windows hoặc Linux (Linux thường khởi động nhanh và rẻ hơn).
- Vào mục **Settings > Configuration** (hoặc Environment variables) của App Service và khai báo các biến bảo mật để không bị lộ trên Github:
  - `ConnectionStrings__DefaultConnection`: Chuỗi kết nối Database ở Bước 1.
  - `Cloudinary__CloudName`, `Cloudinary__ApiKey`, `Cloudinary__ApiSecret`: Các thông số hình ảnh.
  - `JWT__SecretKey`: Mã khóa bí mật JWT.

### Bước 3: Gắn Chìa Khóa Cho GitHub (Publish Profile)
- Tại trang quản trị của App Service, bấm vào nút **Download publish profile** ở thanh công cụ phía trên.
- Mở file `.PublishSettings` vừa tải về, copy toàn bộ nội dung.
- Vào kho lưu trữ trên GitHub -> **Settings** -> **Secrets and variables** -> **Actions**.
- Tạo một biến mới tên là `AZURE_WEBAPP_PUBLISH_PROFILE` và dán nội dung vào.

Từ lúc này, cứ mỗi lần bạn `git push` Code lên nhánh `dev` hoặc `main`, Github Actions sẽ tự động Build và tống lên Azure.

---

## 3. Những Thay Đổi Cần Thiết Trên Mã Nguồn (Codebase)

### A. Thay Đổi Tại Frontend (React Vite)
1. **Lệnh gọi API:** Frontend không được fix cứng gọi đến `localhost:5000` hay một đường link cứng nào, mà sử dụng đường dẫn tương đối `/api`.
   - *Giải thích:* Vì Frontend và Backend chạy chung trên 1 tên miền (ví dụ: `interacthub.azurewebsites.net`), lệnh gọi `fetch('/api/users')` sẽ gọi thẳng vào chính domain đang chạy nó, vô cùng an toàn và mượt mà.
2. **Loại bỏ `node_modules` khỏi Github:**
   - *Giải thích:* Máy tính phát triển dùng hệ điều hành Windows, trong khi máy chủ Build của Github dùng Ubuntu (Linux). Nếu đẩy thư mục `node_modules` lên Github, các file thực thi (như `vite`) sẽ bị mất cờ cấp quyền chạy (`chmod +x`). Dẫn đến lỗi chí mạng: `sh: 1: vite: Permission denied`. Thư mục này buộc phải nằm trong `.gitignore`.

### B. Thay Đổi Tại Backend (`Program.cs`)
Để C# biết cách đọc file Frontend, chúng ta phải tiêm một số lệnh vào luồng Pipeline của `Program.cs`:

```csharp
// 1. Phục vụ các file tĩnh của React (JS, CSS, HTML)
app.UseDefaultFiles();
app.UseStaticFiles();
```
*Giải thích:* Lệnh này báo cho Kestrel (Máy chủ .NET) biết rằng hãy cấp quyền đọc các tệp tin HTML/CSS/JS nằm trong thư mục `wwwroot` và trả nó ra màn hình nếu người dùng truy cập.

```csharp
// 2. Chuyển hướng các đường dẫn của React về trang chủ index.html
app.MapFallbackToFile("index.html");
```
*Giải thích:* React hoạt động dưới dạng Single Page Application (SPA), nó tự đẻ ra các đường dẫn giả (như `/profile`, `/messages`). Máy chủ C# không hiểu các đường dẫn giả này nên thường báo lỗi 404. Lệnh này ép C#: "Gặp đường link nào không hiểu, đừng báo lỗi 404, hãy đẩy nó về `index.html` để React tự xử lý".

```csharp
// 3. Tự động hóa tạo Bảng DB và Phục vụ Swagger
await context.Database.MigrateAsync();
app.UseSwagger();
```
*Giải thích:* Bật `MigrateAsync` giúp Azure tự tạo các cấu trúc Bảng trong SQL mà không cần chạy lệnh tay.

---

## 4. Phân Tích File CI/CD (`deploy-azure.yml`)

File này nằm ở `.github/workflows/deploy-azure.yml`, đóng vai trò là não bộ chỉ huy con Bot Github làm nhiệm vụ "Triển Khai Tự Động".

Dưới đây là các phần cốt lõi và mục đích của chúng:

```yaml
on:
  push:
    branches:
      - main
      - dev
```
*Giải thích:* Bất cứ khi nào có hành động đẩy Code lên nhánh `main` hoặc `dev`, luồng này sẽ tự kích hoạt.

```yaml
      - name: Build and Publish Backend
        run: dotnet publish backend/InteractHub.API/InteractHub.API.csproj -c Release -o ./publish /p:UseAppHost=false
```
*Giải thích:* Biến mã nguồn C# thành file nhị phân (`.dll`) và đổ vào thư mục `publish`.

```yaml
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
```
*Giải thích:* Tải các thư viện Node.js và dịch React ra thành HTML/JS chuẩn ngót nghét đưa vào thư mục `dist`.

```yaml
      - name: Copy Frontend Build to Publish Folder
        run: |
          mkdir -p ./publish/wwwroot
          cp -r frontend/dist/* ./publish/wwwroot/
```
*Giải thích:* Đây là lệnh đỉnh cao kết hợp 2 hệ thống. Nó tạo một thư mục tên là `wwwroot` bên trong lòng thư mục `publish` của Backend, rồi bốc toàn bộ giao diện Frontend nhét vào đó.

```yaml
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./publish
```
*Giải thích:* Lấy toàn bộ cái cục `publish` đã được nhồi nhét cẩn thận ở bước trên, sử dụng Chìa khóa Bí mật (Publish Profile) nối mạng với Microsoft Azure và đắp đè tệp tin lên máy chủ mà không gây gián đoạn hệ thống.
