# PHASE 00 — Checklist chuẩn bị (việc BẠN tự làm, không giao cho agent)

Làm xong mục này rồi mới bắt đầu Phase 01.

## 1. Quyết định đã chốt
- Tên sản phẩm: **HFitness**
- Ngôn ngữ giao diện: **tiếng Anh**
- Tính năng AI thứ hai: **AI Coach** (quét ảnh món ăn → future work)
- Chọn **1 màu chủ đạo** (accent) và giữ nguyên cho cả app, ví dụ lime green hoặc electric orange.

## 2. Tài khoản và key
- [ ] Tạo repo GitHub tên `hfitness` (private cũng được).
- [ ] Tạo project **Supabase**. Lưu lại:
  - Project URL
  - `anon` public key
  - `service_role` key (**bí mật**, chỉ để trong `server/.env`, không bao giờ đưa vào `web/`)
- [ ] Trong Supabase → Authentication: tắt bắt buộc xác nhận email khi đang phát triển (cho nhanh).
- [ ] Chọn nhà cung cấp AI có gói miễn phí (ví dụ Gemini), tạo **API key**. Ghi lại tên model sẽ dùng.
- [ ] Tạo tài khoản **Vercel** (deploy frontend). Chuẩn bị chỗ deploy backend Node miễn phí (hoặc dùng serverless).
- [ ] Tạo tài khoản **Stitch**.

## 3. Chuẩn bị thư mục `docs/` trong repo
Tạo thư mục `docs/` và đặt vào:
- `TECHNICAL_SPEC_USER_MVP.md`
- `TECHNICAL_SPEC_ADMIN_MVP.md`
- `UI_SPEC_USER_MVP.md`
- `UI_SPEC_ADMIN_MVP.md`

Đặt `AGENTS.md` ở **thư mục gốc** của repo.

Tạo thư mục `docs/stitch/` — mỗi màn hình một thư mục con, ví dụ `docs/stitch/dashboard/` chứa ảnh chụp (và code nếu xuất được).

## 4. Làm trước ít nhất 2 màn hình bằng Stitch
- [ ] **Dashboard** (để chốt phong cách chung)
- [ ] **Login / Register**

Các màn còn lại làm dần, chỉ cần xong **trước phase dùng đến nó**:

| Phase | Màn hình cần có |
|---|---|
| 1 | Login/Register |
| 2 | Onboarding, Profile |
| 3 | Landing, Exercise library |
| 4 | Workout plan |
| 5 | Active workout, Workout history |
| 6 | Nutrition |
| 7 | Progress, Dashboard |
| 8 | AI Coach |
| 9 | 4 màn admin |

## 3b. Dữ liệu mẫu (cần trước phase 3 và 6)
- [ ] Bài tập: file `supabase/seed/exercises.json` (ví dụ chuyển đổi từ bộ free-exercise-db — nhớ kiểm tra giấy phép). Nếu chưa có, agent sẽ tạo bộ tối thiểu khoảng 60 bài.
- [ ] Thực phẩm: file `supabase/seed/foods.csv` (vài trăm món phổ biến; nguồn gợi ý: USDA FoodData Central hoặc tự tổng hợp). Nếu chưa có, agent sẽ tạo bộ tối thiểu khoảng 200 món.

## 5. Cách chạy mỗi phase
1. Mở agent trong thư mục repo (agent đọc `AGENTS.md`).
2. Dán **toàn bộ nội dung** file `PHASE_XX.md` tương ứng. Nếu phase cần màn hình Stitch, đính kèm ảnh/code của đúng màn đó.
3. Chờ agent báo cáo theo mẫu.
4. Tự kiểm tra nhanh: chạy app, thử chức năng, xem `typecheck` và `build` có pass không.
5. Dán báo cáo cho người review (hoặc cho mình) để chấm **PASS / PASS WITH FIXES / FAIL**.
6. Nếu PASS: commit lên Git (một commit/tag cho mỗi phase), rồi mới sang phase kế tiếp.
7. Nếu FAIL / FIX: gửi lại cho agent đúng danh sách lỗi cần sửa, chưa sang phase mới.

## 6. Mẹo khi dùng agent miễn phí
- **Mỗi phase mở một phiên chat mới** để tránh đầy context; AGENTS.md giúp agent nhớ lại bối cảnh.
- Chỉ đính kèm đúng phần cần thiết, đừng đưa cả 4 file spec mỗi lần (prompt đã chỉ rõ mục cần đọc).
- Phase dài (4, 5, 9) nếu agent hết lượt giữa chừng: yêu cầu nó **dừng ở chỗ ổn định**, commit, rồi tiếp tục trong phiên mới với câu "Continue Phase XX from the last commit; remaining items: ...".
- Commit sau mỗi phase để có thể quay lại nếu agent làm hỏng.
- Không bao giờ dán API key hay service role key vào khung chat; chỉ đặt trong file `.env`.

## 7. Tạo tài khoản admin đầu tiên (làm ở Phase 9)
Đăng ký một tài khoản bình thường, sau đó vào Supabase SQL editor và đặt `role = 'ADMIN'` cho dòng tương ứng trong bảng `profiles`.

## 8. Thứ tự file
`PHASE_01` → `PHASE_02` → … → `PHASE_10`. Không nhảy cóc.
