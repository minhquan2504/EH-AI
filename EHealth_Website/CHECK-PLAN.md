# KẾ HOẠCH KIỂM TRA TOÀN DIỆN — EHealth Frontend

> Ngày: 2026-04-13
> Mục đích: Tìm tất cả dead code, lỗi tiềm ẩn, tính năng không hoạt động, và các vấn đề khác trước khi nộp đồ án.

## TỔNG QUAN

Chia thành **7 phase kiểm tra**, mỗi phase kiểm tra một khía cạnh khác nhau. Có thể chạy parallel nhiều agent để tiết kiệm thời gian.

---

## PHASE 1 — STATIC ANALYSIS (Phân tích tĩnh)

Mục tiêu: Tìm code không hoạt động nhưng vẫn nằm trong codebase.

### 1.1 Dead code detection
- Unused imports (ESLint `no-unused-vars`)
- Unused functions/variables/constants
- Unused components (component tồn tại nhưng không được import ở đâu)
- Unused hooks (useXxx tồn tại nhưng không được gọi)
- Unused types/interfaces
- Duplicate code blocks (logic tương tự ở nhiều file)

### 1.2 TypeScript strictness
- `any` type usage — tìm và phân loại theo file
- `as any` type casts không an toàn
- Optional chaining quá mức `res?.data?.data?.items` (dấu hiệu type chưa chuẩn)
- Missing return types trên async functions
- `!` non-null assertion không an toàn

### 1.3 Import analysis
- Circular imports
- Imports từ path không tồn tại
- Star imports `import * as X` không cần thiết
- Barrel exports (`src/services/index.ts`) có đồng nhất không

### 1.4 Route analysis
- Tất cả routes trong `src/constants/routes.ts` có file `page.tsx` tương ứng không
- Tất cả `page.tsx` có được reference từ routes không (orphan pages)
- Link/Navigation trỏ đến routes tồn tại không

---

## PHASE 2 — BUILD & RUNTIME

Mục tiêu: Đảm bảo code chạy được production build.

### 2.1 Next.js production build
```bash
npm run build
```
Kiểm tra:
- Build success không có error
- Bundle size reasonable (không có chunk > 500KB không cần thiết)
- Static generation không crash
- Missing dependencies

### 2.2 Runtime errors
- Any `useEffect` thiếu dependency array
- Any state updates during render
- Hydration mismatch potential
- localStorage access without `typeof window` guard

### 2.3 API integration runtime
- Services có gọi endpoint tồn tại trong endpoints.ts không
- Axios interceptor (refresh token) có bị infinite loop không
- Rate limiting cho AI endpoints có đúng không

---

## PHASE 3 — UX / BUSINESS LOGIC

Mục tiêu: Đảm bảo mọi tính năng hoạt động đúng nghiệp vụ.

### 3.1 Flow check theo role

**Patient flow**:
- Register → Verify email → Login → Dashboard → Book appointment → Pay → View result → AI consult
- Check mỗi bước có điều hướng đúng không

**Receptionist flow**:
- Login → Tiếp nhận bệnh nhân mới → Tạo lịch hẹn → Check-in → Tạo hóa đơn → Thu tiền

**Doctor flow**:
- Login → Xem queue → Gọi bệnh nhân → Khám (vitals → symptoms → orders → diagnosis → prescription → sign-off) → Hoàn tất

**Pharmacist flow**:
- Login → Xem đơn chờ → Kiểm tra tồn kho → Cấp phát → Update status

**Admin flow**:
- Login → Dashboard → Quản lý users/roles → Báo cáo → Config hệ thống

### 3.2 Form validation
- Tất cả form quan trọng có validation không
- Error message tiếng Việt có dấu chuẩn không
- Submit handler có handle loading + error state không

### 3.3 Empty states
- Tất cả list có empty state khi API trả rỗng
- Empty state có icon + message + action (nếu có) không

### 3.4 Loading states
- Tất cả trang có loading state khi fetch API không
- Skeleton loaders hoặc spinners

### 3.5 Error boundaries
- Mỗi route segment có `error.tsx` không
- Global error handler

---

## PHASE 4 — SECURITY AUDIT

Mục tiêu: Đảm bảo không còn lỗ hổng bảo mật.

### 4.1 Input validation
- Tất cả form có validate trước khi submit không
- Validate cả client-side và gửi raw data

### 4.2 Auth & session
- Token lưu an toàn (localStorage dạng raw — acceptable cho đồ án)
- Refresh token flow không bị infinite loop
- Logout clear tất cả state
- AuthGuard check đúng role

### 4.3 XSS prevention
- Tất cả `dangerouslySetInnerHTML` có escape HTML không
- User input render qua React text (không innerHTML)

### 4.4 Open redirect
- Tất cả `window.location.href = x` có validate URL không
- Không trust user input cho navigation

### 4.5 Sensitive data
- Không log password/token/PII ra console
- Không hardcode credentials
- Env variables được dùng đúng

### 4.6 CSRF protection
- API calls có gửi đúng header Bearer token
- Không expose token qua URL

---

## PHASE 5 — ACCESSIBILITY & I18N

Mục tiêu: Cải thiện UX cho người dùng thực.

### 5.1 Accessibility
- Forms có `<label>` cho mỗi input
- Images có `alt` text
- Interactive elements có `aria-label` nếu cần
- Keyboard navigation hoạt động

### 5.2 Internationalization
- Text tiếng Việt có dấu đầy đủ
- Không trộn tiếng Anh/Việt trong cùng 1 message
- Date format theo vi-VN
- Number format theo vi-VN

### 5.3 Responsive
- Mobile breakpoint test
- Table overflow xử lý đúng
- Modal/dialog không bị tràn

---

## PHASE 6 — DEPENDENCIES & CONFIG

Mục tiêu: Đảm bảo project config đúng.

### 6.1 Package.json
- Tất cả dependency đang dùng
- Không có unused dependency
- Version không conflict

### 6.2 Environment variables
- `.env.example` đầy đủ
- Tất cả `process.env.X` có giá trị fallback hoặc được document

### 6.3 Next.js config
- `next.config.js` có image domains cần thiết
- `experimental` flags phù hợp

### 6.4 TypeScript config
- `strict: true` (nếu có thể)
- `paths` map đúng

---

## PHASE 7 — DOCUMENTATION

Mục tiêu: Chuẩn bị tài liệu cho giảng viên.

### 7.1 README.md
- Hướng dẫn setup local
- Yêu cầu Node version
- Env variables
- Scripts: dev, build, start

### 7.2 backend.md
- Cập nhật status các endpoint
- Ghi chú các API cần BE hỗ trợ thêm

### 7.3 PLAN.md
- Cập nhật trạng thái các phase đã hoàn thành
- Ghi chú những phần còn lại

### 7.4 Code comments
- Comment phức tạp đã có giải thích
- JSDoc cho function public

---

## THỰC THI KẾ HOẠCH

### Cách 1: Chạy từng phase tuần tự (chắc chắn nhất)
1-7: Làm từng phase, fix issues, rồi qua phase tiếp theo.

### Cách 2: Chạy parallel nhiều agent (nhanh hơn)
- Agent A: Phase 1 (static analysis) + Phase 6 (dependencies)
- Agent B: Phase 2 (build & runtime)
- Agent C: Phase 3 (UX/business logic theo role)
- Agent D: Phase 4 (security audit)
- Agent E: Phase 5 (accessibility/i18n/responsive)
- Agent F: Phase 7 (documentation)

Mỗi agent chỉ REPORT, không sửa. Sau khi tất cả report xong → tổng hợp + launch thêm agents để FIX.

---

## OUTPUT MONG MUỐN

Sau khi hoàn thành toàn bộ, có:
1. **CHECK-REPORT.md** — báo cáo chi tiết mọi issue tìm được
2. **Danh sách P0** — lỗi critical phải fix trước khi demo
3. **Danh sách P1** — lỗi quan trọng nên fix nếu có thời gian
4. **Danh sách P2** — cải thiện optional
5. **Commits fix** — từng nhóm fix commit riêng
6. **Final build success** — `npm run build` không lỗi
