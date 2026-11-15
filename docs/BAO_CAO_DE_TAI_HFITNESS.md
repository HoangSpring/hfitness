# BÁO CÁO ĐỀ TÀI

## XÂY DỰNG NỀN TẢNG HỖ TRỢ TẬP LUYỆN VÀ DINH DƯỠNG CÁ NHÂN HÓA BẰNG AI

**Tên sản phẩm:** HFitness  
**Loại sản phẩm:** Ứng dụng web  
**Đối tượng sử dụng:** Người mới bắt đầu đến người tập gym trung cấp và quản trị viên hệ thống  
**Phạm vi:** Sản phẩm MVP phục vụ mục đích học tập

> **Thông tin sinh viên/nhóm thực hiện:** Bổ sung theo yêu cầu của trường hoặc giảng viên.

---

## TÓM TẮT

HFitness là nền tảng web hỗ trợ người dùng xây dựng thói quen tập luyện và theo dõi dinh dưỡng trong một quy trình thống nhất. Người dùng khai báo mục tiêu, thông tin cơ thể, kinh nghiệm tập luyện, thiết bị và sở thích dinh dưỡng; hệ thống tính toán chỉ tiêu calo và macro bằng công thức, sau đó sử dụng AI để đề xuất kế hoạch tập luyện phù hợp.

Ứng dụng cho phép người dùng xem thư viện bài tập, kích hoạt kế hoạch, ghi nhận từng hiệp tập, theo dõi lịch sử, ghi nhận bữa ăn, theo dõi cân nặng và trao đổi với AI Coach. Bên cạnh đó, khu vực quản trị cung cấp công cụ quản lý bài tập, thực phẩm, người dùng và các số liệu tổng quan.

Điểm quan trọng của hệ thống là AI chỉ đóng vai trò đề xuất. Các dữ liệu quan trọng được kiểm tra bằng mã nguồn và lưu trữ trong cơ sở dữ liệu có cơ chế phân quyền Row Level Security (RLS).

---

## 1. GIỚI THIỆU ĐỀ TÀI

### 1.1. Lý do chọn đề tài

Nhiều người bắt đầu tập gym nhưng gặp khó khăn trong việc:

- Xác định mục tiêu calo và dinh dưỡng phù hợp.
- Lựa chọn bài tập theo mục tiêu, kinh nghiệm và thiết bị sẵn có.
- Duy trì lịch tập và ghi chép kết quả.
- Theo dõi mối liên hệ giữa tập luyện, ăn uống và thay đổi cân nặng.
- Nhận được hướng dẫn nhanh nhưng vẫn có tính cá nhân hóa.

Các ứng dụng hiện có thường tập trung riêng vào tập luyện hoặc dinh dưỡng. HFitness được xây dựng để kết nối hai nhóm nhu cầu trên trong cùng một quy trình, đồng thời tận dụng AI để tạo trải nghiệm cá nhân hóa nhưng vẫn kiểm soát tính chính xác bằng các quy tắc nghiệp vụ.

### 1.2. Ý nghĩa thực tiễn

Đề tài giúp người dùng:

- Có kế hoạch tập luyện ban đầu phù hợp với thông tin cá nhân.
- Hiểu rõ mục tiêu calo và macro hằng ngày.
- Ghi nhận dữ liệu tập luyện và dinh dưỡng một cách có hệ thống.
- Theo dõi tiến độ thay vì chỉ dựa vào cảm nhận.
- Nhận gợi ý từ AI Coach dựa trên dữ liệu đã ghi nhận.

Đề tài cũng minh họa cách tích hợp AI vào một hệ thống web thực tế theo hướng an toàn: AI không được tự ý tạo dữ liệu sự thật, không được bịa bài tập ngoài cơ sở dữ liệu và không thay thế các phép tính sức khỏe được định nghĩa bằng công thức.

---

## 2. MỤC TIÊU

### 2.1. Mục tiêu tổng quát

Xây dựng một nền tảng web có khả năng hỗ trợ người dùng lập kế hoạch tập luyện, theo dõi dinh dưỡng và tiến độ cá nhân thông qua dữ liệu có cấu trúc và các đề xuất từ AI.

### 2.2. Mục tiêu cụ thể

1. Xây dựng chức năng đăng ký, đăng nhập và đăng xuất.
2. Xây dựng quy trình onboarding gồm 5 bước.
3. Tính toán BMR, TDEE, calo và macro bằng công thức xác định.
4. Sinh kế hoạch tập luyện bằng AI từ danh sách bài tập hợp lệ.
5. Kiểm tra và lưu kế hoạch theo vòng đời `DRAFT → ACTIVE → ARCHIVED`.
6. Cho phép ghi nhận buổi tập, hiệp tập, số lần lặp và mức tạ.
7. Cho phép tìm kiếm thực phẩm và ghi nhận bữa ăn.
8. Lưu snapshot dinh dưỡng tại thời điểm ghi nhận món ăn.
9. Theo dõi cân nặng và các chỉ số tiến độ.
10. Cung cấp AI Coach có ngữ cảnh người dùng.
11. Cung cấp khu vực quản trị tối thiểu cho nội dung và số liệu hệ thống.
12. Bảo vệ dữ liệu người dùng bằng xác thực, phân quyền và RLS.

---

## 3. PHẠM VI ĐỀ TÀI

### 3.1. Chức năng dành cho người dùng

| Nhóm chức năng | Nội dung |
|---|---|
| Xác thực | Đăng ký, đăng nhập, đăng xuất |
| Onboarding | Mục tiêu, thông tin cơ thể, lịch tập, thiết bị, sở thích dinh dưỡng |
| Chỉ tiêu | Tính BMR, TDEE, calo, protein, carbohydrate và chất béo |
| Bài tập | Thư viện bài tập, tìm kiếm và lọc |
| Kế hoạch | Sinh, xem xét, kích hoạt và lưu kế hoạch tập |
| Buổi tập | Bắt đầu, ghi hiệp, sửa/xóa hiệp, kết thúc hoặc bỏ buổi tập |
| Dinh dưỡng | Tìm thực phẩm, thêm món ăn, sửa/xóa và xem tổng hợp trong ngày |
| Tiến độ | Cân nặng, biểu đồ và thống kê tập luyện/dinh dưỡng |
| AI Coach | Hỏi đáp dựa trên hồ sơ, kế hoạch và lịch sử của người dùng |
| Hồ sơ | Xem và cập nhật thông tin cá nhân, mục tiêu và sở thích |

### 3.2. Chức năng dành cho quản trị viên

- Dashboard tổng quan số lượng người dùng, buổi tập, bữa ăn và yêu cầu AI.
- Danh sách người dùng có tìm kiếm, lọc và phân trang.
- Xem thông tin tổng hợp của một người dùng.
- Thêm, sửa, xuất bản và lưu trữ bài tập.
- Thêm, sửa, xuất bản và lưu trữ thực phẩm.
- Kiểm soát quyền quản trị bằng vai trò `USER` và `ADMIN`.

### 3.3. Ngoài phạm vi MVP

- Kế hoạch dinh dưỡng được sinh hoàn toàn bằng AI.
- Tự động phân tích tiến độ bằng AI.
- Theo dõi số đo cơ thể ngoài cân nặng.
- Hỗ trợ nhiều môn thể thao ngoài gym/strength.
- Thông báo, xuất dữ liệu và giao diện xóa tài khoản.
- Hệ thống audit log và dashboard quan sát vận hành chuyên sâu.
- Quản lý chương trình hoặc template tập luyện ở cấp quản trị viên.

---

## 4. PHÂN TÍCH YÊU CẦU

### 4.1. Yêu cầu chức năng

#### Người dùng

- Người dùng chưa hoàn thành onboarding không được truy cập đầy đủ vào khu vực ứng dụng.
- Người dùng có thể nhập dữ liệu cá nhân và nhận chỉ tiêu dinh dưỡng.
- Người dùng chỉ được nhìn thấy các bài tập và thực phẩm ở trạng thái `PUBLISHED`.
- Người dùng có thể kích hoạt tối đa một kế hoạch tập luyện đang hoạt động.
- Người dùng chỉ được đọc và thay đổi dữ liệu thuộc tài khoản của mình.
- Người dùng có thể xem trạng thái tải, trạng thái rỗng và lỗi có thao tác thử lại trên các màn hình dữ liệu.

#### Quản trị viên

- Chỉ tài khoản có vai trò `ADMIN` mới được thao tác dữ liệu quản trị.
- Bài tập/thực phẩm đã được tham chiếu không bị xóa tùy tiện mà được chuyển sang `ARCHIVED`.
- Các thao tác xuất bản phải kiểm tra đủ trường bắt buộc.
- Danh sách người dùng phải phân trang và không được hiển thị mật khẩu, token hoặc nội dung riêng tư.

### 4.2. Yêu cầu phi chức năng

- Giao diện hỗ trợ desktop và mobile.
- Giao diện tiếng Anh, có chuẩn bị cho tiếng Việt.
- Biểu mẫu có kiểm tra dữ liệu, giữ lại giá trị khi lỗi và vô hiệu hóa nút gửi trong lúc xử lý.
- API có định dạng phản hồi thống nhất và mã lỗi ổn định.
- Dữ liệu riêng tư phải được bảo vệ ở cả frontend, backend và database.
- Khóa bí mật chỉ được sử dụng ở server và không xuất hiện trong log.
- Hệ thống phải có khả năng mở rộng thêm tính năng mà không phá vỡ mô hình dữ liệu hiện tại.

---

## 5. THIẾT KẾ VÀ KIẾN TRÚC HỆ THỐNG

### 5.1. Kiến trúc tổng thể

HFitness sử dụng kiến trúc web tách frontend, backend và cơ sở dữ liệu:

```text
Người dùng
   ↓
React + TypeScript + Vite
   ├── Supabase client: CRUD đơn giản, dữ liệu được RLS bảo vệ
   └── Node.js + Express API: nghiệp vụ phức tạp và chức năng chứa bí mật
                                      ↓
                              Supabase Auth/PostgreSQL
                                      ↓
                              AI provider cấu hình qua server
```

### 5.2. Frontend

- React và TypeScript.
- Vite cho môi trường phát triển và build.
- React Router cho định tuyến.
- Zod cho kiểm tra dữ liệu biểu mẫu và các dữ liệu đầu vào cần thiết.
- CSS theo hướng component/page, kết hợp design token dùng chung.
- Giao diện desktop dùng sidebar; giao diện mobile dùng bottom navigation.

Các nhóm tính năng chính trong thư mục `web/src/features/` gồm:

- `auth`: xác thực.
- `onboarding`: quy trình khai báo ban đầu.
- `dashboard`: màn hình tổng quan.
- `workout`: kế hoạch, buổi tập và lịch sử.
- `nutrition`: thực phẩm và bữa ăn.
- `progress`: cân nặng, biểu đồ và thống kê.
- `coach`: AI Coach.
- `admin`: khu vực quản trị.

### 5.3. Backend

Backend dùng Node.js, TypeScript và Express. Các route chính gồm:

- Fitness assessment.
- Sinh và kích hoạt kế hoạch tập.
- AI Coach.
- AI food scanner.
- Dữ liệu người dùng cần xử lý qua server.
- Health check.

Backend kiểm tra JWT của Supabase, sử dụng Zod cho schema và central error handler để chuẩn hóa lỗi.

### 5.4. Cơ sở dữ liệu

Supabase PostgreSQL được sử dụng cho dữ liệu nghiệp vụ và Supabase Auth cho tài khoản. Các nhóm dữ liệu chính:

- `profiles`.
- `fitness_assessments`.
- `exercises`.
- `workout_plans`, `workout_plan_days`, `workout_plan_exercises`.
- `workout_sessions`, `workout_sets`.
- `foods`, `meals`, `meal_items`.
- `weight_logs`.
- `coach_conversations`, `coach_messages`.
- Dữ liệu yêu cầu AI và các bảng phục vụ quản trị.

Các migration hiện có được đánh số tuần tự từ `001` đến `021`, bao gồm hồ sơ, đánh giá thể chất, bài tập, kế hoạch, buổi tập, dinh dưỡng, AI Coach, quản trị viên, scanner thực phẩm và một số quy tắc lịch tập.

---

## 6. QUY TRÌNH NGHIỆP VỤ CHÍNH

### 6.1. Quy trình onboarding

1. Người dùng đăng ký hoặc đăng nhập.
2. Người dùng chọn mục tiêu: giảm cân, tăng cân, tăng cơ, tăng sức mạnh hoặc duy trì.
3. Nhập tuổi, giới tính, chiều cao và cân nặng.
4. Chọn kinh nghiệm, số ngày tập và thời lượng mỗi buổi.
5. Chọn thiết bị có thể sử dụng.
6. Nhập dị ứng, thực phẩm không thích và số bữa mỗi ngày.
7. Hệ thống tính chỉ tiêu dinh dưỡng bằng công thức.
8. Hệ thống sử dụng các thông tin trên để yêu cầu AI sinh kế hoạch tập.

### 6.2. Tính toán thể chất

Hệ thống sử dụng công thức Mifflin–St Jeor:

```text
BMR nam = 10 × cân nặng + 6.25 × chiều cao − 5 × tuổi + 5
BMR nữ = 10 × cân nặng + 6.25 × chiều cao − 5 × tuổi − 161
TDEE = BMR × hệ số hoạt động
```

Calo mục tiêu được điều chỉnh theo mục tiêu người dùng. Protein, chất béo và carbohydrate được tính từ các hằng số nghiệp vụ. Có áp dụng mức sàn calo để hạn chế kết quả không an toàn về mặt kỹ thuật.

### 6.3. Sinh kế hoạch tập bằng AI

Quy trình xử lý:

```text
Nhận yêu cầu
→ Nạp hồ sơ và đánh giá thể chất
→ Lấy danh sách bài tập PUBLISHED phù hợp
→ Gửi dữ liệu đầu vào cho AI
→ Nhận JSON có cấu trúc
→ Kiểm tra bằng Zod
→ Kiểm tra quy tắc nghiệp vụ
→ Lưu kế hoạch DRAFT
→ Người dùng xem xét và kích hoạt
```

AI không được tự tạo `exercise_id` ngoài danh sách hợp lệ. Backend kiểm tra số ngày, số bài, số hiệp, số lần lặp, thời gian nghỉ, thiết bị và thời lượng buổi tập trước khi lưu.

### 6.4. Ghi nhận dinh dưỡng

Người dùng tìm thực phẩm đã xuất bản, chọn khẩu phần và loại bữa ăn. Khi lưu, hệ thống ghi lại snapshot gồm calo, protein, carbohydrate và chất béo. Nhờ vậy, chỉnh sửa thực phẩm trong tương lai không làm thay đổi lịch sử dinh dưỡng đã ghi nhận.

### 6.5. AI Coach

AI Coach nhận câu hỏi cùng ngữ cảnh phù hợp của người dùng như mục tiêu, kế hoạch, hoạt động và dữ liệu dinh dưỡng. Câu trả lời được hiển thị dưới dạng khuyến nghị và lý do. Tính năng có giới hạn sử dụng hằng ngày và luôn hiển thị cảnh báo rằng nội dung không thay thế tư vấn y khoa.

---

## 7. AN TOÀN, BẢO MẬT VÀ PHÂN QUYỀN

### 7.1. Xác thực và phân quyền

- Supabase Auth quản lý tài khoản và phiên đăng nhập.
- Node API xác minh access token cho mỗi request cần bảo vệ.
- Frontend route guard chỉ phục vụ trải nghiệm; quyền thật được kiểm tra ở server và database.
- Vai trò `ADMIN` được thiết lập thủ công trong database.
- Người dùng không thể tự thay đổi vai trò của chính mình.

### 7.2. Row Level Security

Các bảng thuộc sở hữu người dùng áp dụng nguyên tắc:

```text
auth.uid() = user_id
```

Các thao tác ghi từ web client sử dụng `user_id` mặc định từ `auth.uid()` thay vì tin tưởng dữ liệu do client gửi lên.

### 7.3. Bảo vệ AI và bí mật

- Khóa AI và service-role key chỉ tồn tại ở server.
- Không ghi token, khóa hoặc toàn bộ prompt vào log.
- Kết quả AI phải qua schema và kiểm tra nghiệp vụ trước khi lưu.
- Các yêu cầu AI có giới hạn sử dụng để kiểm soát chi phí và lạm dụng.

---

## 8. GIAO DIỆN VÀ TRẢI NGHIỆM NGƯỜI DÙNG

Giao diện sử dụng nền tối theo định hướng hiện đại, thể thao và có phân cấp thông tin rõ ràng. Màu nhấn đỏ được dùng cho hành động chính và trạng thái quan trọng.

### 8.1. Điều hướng

- Desktop: sidebar gồm Dashboard, Workout, Exercises, Nutrition, Progress, AI Coach và Profile.
- Mobile: bottom navigation gồm Home, Workout, Nutrition, Progress và More.
- Khu vực admin có sidebar và topbar riêng.

### 8.2. Trạng thái giao diện

Các màn hình dữ liệu được thiết kế với:

- Loading skeleton.
- Empty state.
- Error state kèm thao tác retry.
- Trạng thái gửi biểu mẫu.
- Thông báo thành công hoặc lỗi.

### 8.3. Khả năng đáp ứng

Giao diện được kiểm tra và điều chỉnh để tránh tràn ngang trên các kích thước 360 px, 390 px, 393 px và 768 px. Các nguyên tắc áp dụng gồm:

- Cho phép grid/flex children co lại bằng `min-width: 0`.
- Cho phép tiêu đề và nội dung dài xuống dòng.
- Bottom navigation dùng các item co giãn thay vì chiều rộng cố định.
- Giảm kích thước thành phần dày đặc trên mobile.
- Không dùng chiều rộng cố định gây tràn trang.

### 8.4. Trợ lý AI Coach nổi

Ngoài mục AI Coach trên sidebar và bottom navigation, hệ thống có thêm một trợ lý AI Coach nổi dùng chung trong khu vực người dùng:

- Hiển thị dưới dạng một nút tròn ở góc màn hình.
- Có thể kéo bằng chuột hoặc thao tác cảm ứng để di chuyển.
- Khi nhấn vào nút, khung chat được mở hoặc đóng.
- Khung chat dùng lại API AI Coach hiện có, hiển thị tin nhắn người dùng, câu trả lời, trạng thái đang xử lý, lỗi và giới hạn lượt.
- Nút và các thao tác đều có nhãn hỗ trợ accessibility.
- Trợ lý xuất hiện khi chuyển qua các trang trong `AppShell`; trang AI Coach đầy đủ trên thanh điều hướng vẫn được giữ nguyên để xem lịch sử và quản lý cuộc trò chuyện.

---

## 9. KIỂM THỬ VÀ ĐÁNH GIÁ

### 9.1. Kiểm thử tự động

Các lệnh kiểm thử frontend đã thực hiện:

```text
npm run typecheck  → đạt
npm run lint       → đạt
npm run build      → đạt
npm test           → đạt, 11 test files và 59 tests
```

Các nhóm test hiện có bao gồm:

- Tính toán dinh dưỡng.
- Tính toán và tổng hợp tiến độ.
- Chỉ số workout.
- Quy tắc workout.
- Coach response.
- Food scanner.
- Localization.
- YouTube/exercise media.
- App shell và landing page.

### 9.2. Kiểm thử thủ công đề xuất

#### Người dùng

- Đăng ký và đăng nhập bằng tài khoản mới.
- Hoàn thành đủ 5 bước onboarding.
- Kiểm tra chỉ tiêu calo/macro.
- Sinh, xem xét và kích hoạt kế hoạch.
- Ghi nhận, sửa và xóa hiệp tập.
- Ghi nhận món ăn và kiểm tra snapshot dinh dưỡng.
- Thêm/xóa cân nặng và xem biểu đồ.
- Gửi câu hỏi cho AI Coach.

#### Quản trị viên

- Kiểm tra người dùng thường không truy cập được dữ liệu admin.
- Tạo, xuất bản và lưu trữ bài tập.
- Tạo, xuất bản và lưu trữ thực phẩm.
- Kiểm tra cảnh báo không nhất quán giữa calo và macro.
- Kiểm tra phân trang danh sách người dùng.

#### Bảo mật dữ liệu

- Người dùng A không đọc được bản ghi của người dùng B.
- Người dùng không thay đổi được `profiles.role`.
- Dữ liệu food/workout đã lưu vẫn hiển thị đúng sau khi nội dung nguồn bị archive.

---

## 10. KẾT QUẢ ĐẠT ĐƯỢC

Đề tài đã xây dựng được nền tảng end-to-end cho vòng lặp chính:

```text
Onboarding
→ Tính chỉ tiêu
→ Sinh kế hoạch tập
→ Ghi nhận workout và meal
→ Theo dõi progress
→ Hỏi AI Coach
```

Hệ thống có frontend theo route, backend cho nghiệp vụ phức tạp, cơ sở dữ liệu Supabase, xác thực, RLS, phân quyền admin, kiểm tra dữ liệu và các trạng thái giao diện cần thiết cho MVP.

---

## 11. HẠN CHẾ

- Chỉ tiêu và khuyến nghị phụ thuộc vào chất lượng dữ liệu người dùng nhập.
- AI Coach và sinh kế hoạch phụ thuộc vào giới hạn và độ ổn định của AI provider.
- Một số kiểm thử phân quyền/RLS cần được chạy trực tiếp trên môi trường Supabase với nhiều phiên người dùng.
- Dữ liệu thực phẩm ban đầu có thể là giá trị xấp xỉ và cần được kiểm tra trước khi sử dụng trong bối cảnh chuyên môn.
- Sản phẩm chưa thay thế được huấn luyện viên, chuyên gia dinh dưỡng hoặc tư vấn y khoa.
- MVP chưa có các chức năng xuất dữ liệu, thông báo và phân tích tiến độ chuyên sâu.

---

## 12. HƯỚNG PHÁT TRIỂN

1. Bổ sung re-plan engine và quy trình chấp nhận/từ chối đề xuất.
2. Phát triển AI nutrition plan có kiểm soát.
3. Thêm phân tích tiến độ bằng AI dựa trên dữ liệu lịch sử.
4. Hỗ trợ số đo cơ thể, ảnh tiến độ và nhiều môn thể thao.
5. Bổ sung thông báo lịch tập và nhắc ghi nhận bữa ăn.
6. Hoàn thiện song ngữ tiếng Anh–tiếng Việt.
7. Bổ sung export dữ liệu và xóa tài khoản.
8. Bổ sung audit log, monitoring và dashboard vận hành.
9. Tối ưu hiệu năng, caching và chia nhỏ bundle frontend.
10. Kiểm thử end-to-end trên môi trường staging với nhiều vai trò người dùng.

---

## 13. KẾT LUẬN

HFitness đáp ứng mục tiêu xây dựng một nền tảng web hỗ trợ tập luyện và dinh dưỡng cá nhân hóa ở phạm vi MVP. Hệ thống kết hợp AI với các quy tắc kiểm tra bằng mã nguồn, giúp tận dụng khả năng đề xuất của AI nhưng vẫn giữ được tính kiểm soát đối với dữ liệu quan trọng.

Thông qua đề tài, nhóm có thể thể hiện khả năng phân tích yêu cầu, thiết kế kiến trúc web, xây dựng giao diện responsive, tích hợp xác thực và cơ sở dữ liệu, xử lý dữ liệu bằng TypeScript, áp dụng RLS và kiểm thử phần mềm.

---

## TÀI LIỆU THAM KHẢO

1. Tài liệu đặc tả kỹ thuật người dùng MVP của HFitness.
2. Tài liệu đặc tả kỹ thuật quản trị viên MVP của HFitness.
3. Tài liệu đặc tả giao diện người dùng MVP của HFitness.
4. Tài liệu đặc tả giao diện quản trị viên MVP của HFitness.
5. Tài liệu React, TypeScript và Vite.
6. Tài liệu Supabase Auth, PostgreSQL và Row Level Security.
7. Tài liệu Express và Zod.

