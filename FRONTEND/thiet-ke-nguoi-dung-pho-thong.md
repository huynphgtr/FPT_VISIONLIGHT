# Bảng Thiết Kế UI – Ứng Dụng Quản Lý Đèn

> **Phiên bản:** Người dùng phổ thông  
> **Phạm vi:** 3 màn hình — Trang chủ · Chi tiết khu vực · Cài đặt  
> **Triết lý thiết kế:** Nhìn là hiểu, chạm là xong — không cần đọc hướng dẫn

---

## Thay Đổi Lớn So Với Phiên Bản Kỹ Thuật

| Điểm thay đổi | Phiên bản kỹ thuật | Phiên bản người dùng |
|---|---|---|
| Ngôn ngữ | `relay_01`, `lux_threshold`, `MQTT Topic` | "Đèn sân trước", "Trời đang tối", "Tự động bật" |
| Màu sắc | Dark navy, industrial | Sáng, ấm, thân thiện |
| Font | JetBrains Mono (monospace) | Rounded, dễ đọc |
| Thông tin hiển thị | Dày, đầy đủ kỹ thuật | Chỉ điều người dùng quan tâm |
| Config AI | Tên biến kỹ thuật + số liệu thô | Câu hỏi đời thường + slider trực quan |
| Border radius | 4px – góc vuông | 16px – mềm mại |
| Hành động chính | 2 nút + form nhập | 1 toggle lớn, dễ bấm bằng ngón tay cái |

---

## Nguyên Tắc Thiết Kế Chung

| Thuộc tính | Quyết định |
|---|---|
| **Màu nền chính** | `#F8F9FA` (trắng xám nhạt) |
| **Màu nền card** | `#FFFFFF` |
| **Màu đèn đang bật** | `#FFBE00` (vàng ấm – màu ánh đèn) |
| **Màu đèn đang tắt** | `#CBD5E1` (xám nhạt) |
| **Màu override / chú ý** | `#FF7043` (cam san hô) |
| **Màu hành động chính** | `#2563EB` (xanh dương) |
| **Màu thành công** | `#16A34A` (xanh lá) |
| **Font** | `Nunito` – tròn, thân thiện, dễ đọc |
| **Border radius card** | `16px` |
| **Kích thước nút tối thiểu** | `48px height` – ngón tay bấm thoải mái |
| **Polling interval** | Mỗi 10 giây (đủ nhanh, không gây cảm giác giật) |

---

---

## Màn Hình 1 — Trang Chủ (Dashboard)

> **Route:** `/`
> **API:** `GET /api/areas/status` – polling mỗi 10s
> **Câu hỏi người dùng cần trả lời ngay:** *"Khu nào đèn đang bật? Khu nào đang tự điều chỉnh?"*

---

### Layout Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
│  Xin chào 👋              🔔  (thông báo nếu có sự kiện)    │
│  Hôm nay, Thứ Ba 17/3                                        │
├─────────────────────────────────────────────────────────────┤
│  TỔNG QUAN NHANH                                             │
│                                                              │
│  ┌───────────────────┐    ┌───────────────────┐             │
│  │  💡  7 khu        │    │  🌙  3 khu        │             │
│  │  đang sáng        │    │  đang tắt          │             │
│  └───────────────────┘    └───────────────────┘             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  BỘ LỌC NHANH (tab nằm ngang, scroll ngang)                  │
│  [ Tất cả ]  [ Đang bật ]  [ Đang tắt ]  [ Đang can thiệp ] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DANH SÁCH KHU VỰC                                           │
│  (1 cột mobile, 2 cột tablet, 3 cột desktop)                 │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │  CARD KHU VỰC                            │               │
│  └──────────────────────────────────────────┘               │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

### Header

| Vùng | Nội dung | Ghi chú |
|---|---|---|
| Trái | "Xin chào 👋" + ngày hôm nay | Không hiển thị tên hệ thống kỹ thuật |
| Phải | Chuông thông báo 🔔 | Badge đỏ nếu có khu vực cần chú ý |

> **Bỏ đi:** Đồng hồ thời gian thực HH:MM:SS, nút Refresh thủ công, chấm "Live" — những thứ này không có ý nghĩa với người dùng thường và gây nhiễu thị giác.

---

### Tổng Quan Nhanh (2 chip lớn)

```
┌───────────────────────┐    ┌───────────────────────┐
│                       │    │                       │
│    💡                 │    │    🌙                 │
│    7 khu đang sáng    │    │    3 khu đang tắt     │
│                       │    │                       │
└───────────────────────┘    └───────────────────────┘
```

- Chip màu vàng ấm cho "đang sáng", chip màu xám nhạt cho "đang tắt"
- Font size lớn, số hiển thị to — đọc từ xa được
- Nếu có khu đang can thiệp thủ công → thêm chip cam `⚠ 2 khu đang can thiệp`

---

### Bộ Lọc Nhanh

- Tab nằm ngang, cuộn ngang trên mobile
- Ngôn ngữ tab: **Tất cả / Đang bật / Đang tắt / Đang can thiệp**
- Không dùng: "Manual Override", "Schedule Active" — quá kỹ thuật

---

### Area Card (thiết kế lại hoàn toàn)

```
┌──────────────────────────────────────────────┐
│                                              │
│  💡  Sân trước             ● Đang sáng      │
│      Khu vực ngoài trời                      │
│                                              │
│  ─────────────────────────────────────────   │
│                                              │
│  🤖 Tự động bật lúc 19:30                   │  ← ngôn ngữ đơn giản
│  ⏱  Sẽ tắt lúc 22:30 (còn 45 phút)         │  ← hiển thị nếu override
│                                              │
│  ─────────────────────────────────────────   │
│                                              │
│  [ Xem chi tiết ]        [ 💡 Bật / Tắt ]   │
│                                              │
└──────────────────────────────────────────────┘
```

**Thay đổi quan trọng trong card:**

| Trước (kỹ thuật) | Sau (người dùng) |
|---|---|
| `Loại: outdoor` | `Khu vực ngoài trời` |
| `Override: ⚠ Manual đến 22:30` | `⏱ Sẽ tắt lúc 22:30 (còn 45 phút)` |
| `Schedule: ✓ Active` | `🤖 Tự động bật lúc 19:30` |
| `Relay: relay_01, relay_02` | **Ẩn hoàn toàn** |
| `Topic: cmnd/light/zone_a` | **Ẩn hoàn toàn** |

**Màu nền card:**

| Trạng thái | Màu nền | Icon đèn |
|---|---|---|
| Đèn đang bật (tự động) | Trắng, viền vàng nhạt | 💡 vàng sáng |
| Đèn đang bật (can thiệp) | Trắng, viền cam | 💡 cam |
| Đèn tắt | Trắng, viền xám nhạt | 🌙 xám |

**Badge trạng thái** (góc trên phải, ngôn ngữ thân thiện):

| Giá trị API | Hiển thị với người dùng |
|---|---|
| `ON` (auto) | `● Đang sáng` (xanh lá) |
| `ON` (manual) | `● Đang sáng` (cam) |
| `OFF` | `○ Đang tắt` (xám) |

> **Lưu ý:** Không phân biệt "auto" vs "manual" ở badge — người dùng không quan tâm. Chỉ cho thấy trong phần mô tả bên dưới nếu cần.

---

### Tương Tác

| Hành động | Kết quả |
|---|---|
| Click `[Xem chi tiết]` | Sang **Màn hình Chi tiết** |
| Click `[💡 Bật / Tắt]` | Mở **Bottom sheet** điều khiển nhanh |
| Click bất kỳ vùng card | Sang **Màn hình Chi tiết** |

---

---

## Màn Hình 2 — Chi Tiết Khu Vực

> **Route:** `/areas/:area_id`
> **API:**
> - `GET /api/areas/status` → lọc theo `area_id`
> - `GET /api/areas/{area_id}/history`
> **Câu hỏi người dùng cần trả lời:** *"Khu này đang làm gì? Trước đó đã xảy ra gì?"*

---

### Layout Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│  ← Trang chủ                                                 │
│  Sân trước                                                   │
│  Khu vực ngoài trời                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  KHỐI TRẠNG THÁI  (nổi bật nhất, đầu trang)                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  KHỐI ĐIỀU KHIỂN NHANH  (cố định, dễ thấy)                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LỊCH SỬ HOẠT ĐỘNG  (scroll xuống để xem)                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [ ⚙ Chỉnh cài đặt khu vực này ]  (link ở cuối trang)       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

> Desktop: Khối Trạng thái + Điều khiển nằm cột trái, Lịch sử nằm cột phải

---

### Khối Trạng Thái (Hero Block)

```
┌──────────────────────────────────────────────┐
│                                              │
│              💡                             │
│         (icon đèn lớn, animated glow        │
│          khi đang sáng)                      │
│                                              │
│           Đang sáng                          │
│                                              │
│   🤖 Hệ thống tự bật lúc 19:30             │
│   ⏱  Dự kiến tắt lúc 22:30                │
│                                              │
└──────────────────────────────────────────────┘
```

- Icon đèn lớn 80px, có hiệu ứng glow vàng khi bật
- Chữ trạng thái cỡ lớn, font đậm
- Mô tả bằng câu văn tự nhiên thay vì key-value
- **Ẩn hoàn toàn:** ID kỹ thuật, relay, MQTT topic

**Các trường hợp mô tả trạng thái:**

| Tình huống thực tế | Hiển thị |
|---|---|
| Tự động bật do có người | `🤖 Hệ thống phát hiện có người và tự bật` |
| Tự động tắt do trời sáng | `☀️ Trời đã đủ sáng, đèn tự tắt` |
| Bật thủ công | `👆 Bạn đã bật thủ công – tắt lúc 22:30` |
| Tắt thủ công | `👆 Bạn đã tắt thủ công` |
| Đang chờ tắt (off_delay) | `⏳ Không còn ai – đèn sẽ tắt sau 5 phút` |

---

### Khối Điều Khiển Nhanh

```
┌──────────────────────────────────────────────┐
│  Điều khiển thủ công                         │
│                                              │
│  Bật đến lúc nào?                            │
│  ┌──────────────────────────────────────┐    │
│  │  ○ 30 phút   ● 1 tiếng   ○ 2 tiếng  │    │  ← radio button chọn sẵn
│  │  ○ Đến sáng mai                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────┐    ┌────────────────────┐  │
│  │  💡 Bật đèn │    │  🌙 Tắt đèn ngay  │  │
│  └──────────────┘    └────────────────────┘  │
│                                              │
│  💬 Đèn sẽ tự trở về chế độ tự động sau     │
│     khi hết thời gian bạn chọn.              │
└──────────────────────────────────────────────┘
```

**Thay đổi quan trọng so với phiên bản kỹ thuật:**

| Trước | Sau |
|---|---|
| Ô nhập số phút (input number) | Radio button chọn sẵn (30 phút / 1 tiếng / 2 tiếng / Đến sáng mai) |
| Nhãn "Override timeout" | "Bật đến lúc nào?" |
| Không giải thích | Ghi chú nhỏ: "Đèn sẽ tự trở về chế độ tự động..." |

> Nếu muốn nhập tùy chỉnh vẫn có thể thêm tùy chọn "Tự nhập số phút..." dưới cùng, nhưng để ẩn mặc định.

---

### Lịch Sử Hoạt Động (viết lại ngôn ngữ)

```
┌──────────────────────────────────────────────┐
│  Hoạt động gần đây                           │
│  ──────────────────────────────────────────  │
│                                              │
│  Hôm nay                                     │
│  ──────────────────────────────────────────  │
│  21:45  💡  Đèn tự bật – phát hiện có người  │
│  21:30  🌙  Đèn tắt – không còn ai           │
│  21:15  👆  Bạn đã bật thủ công              │
│  21:00  🌙  Đèn tắt – trời đã đủ sáng       │
│                                              │
│  Hôm qua                                     │
│  ──────────────────────────────────────────  │
│  22:10  💡  Đèn tự bật                       │
│  ...                                         │
│                                              │
│  [ Xem thêm ]                                │
└──────────────────────────────────────────────┘
```

**Bảng dịch ngôn ngữ log:**

| Giá trị kỹ thuật | Hiển thị thân thiện |
|---|---|
| `auto ON – person detected` | `💡 Đèn tự bật – phát hiện có người` |
| `auto OFF – off_delay timeout` | `🌙 Đèn tắt – không còn ai` |
| `auto OFF – lux exceeded` | `🌙 Đèn tắt – trời đã đủ sáng` |
| `manual ON by admin` | `👆 Bạn đã bật thủ công` |
| `manual OFF` | `👆 Bạn đã tắt thủ công` |

- Nhóm log theo ngày (Hôm nay / Hôm qua / DD/MM)
- Icon thay cho màu điểm (dễ hiểu hơn với người không quen UI kỹ thuật)
- Chữ thời gian cỡ nhỏ, xám nhạt — phụ trợ, không chiếm không gian

---

---

## Màn Hình 3 — Cài Đặt Khu Vực

> **Route:** `/areas/:area_id/settings`
> **API:**
> - `PUT /api/areas/{area_id}/config`
> **Câu hỏi người dùng cần trả lời:** *"Tôi muốn đèn hoạt động theo cách của mình."*

---

### Triết Lý Màn Hình Này

Thay vì form nhập số liệu kỹ thuật (`lux_threshold: 300`, `min_person: 1`), chuyển sang **câu hỏi ngôn ngữ thường ngày** với slider hoặc lựa chọn trực quan. Người dùng không cần biết "lux" là gì để cài đặt đúng.

---

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Sân trước                    Cài đặt                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CÀI ĐẶT TỰ ĐỘNG  (4 câu hỏi đơn giản)                      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                     [ Lưu thay đổi ]                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 4 Câu Hỏi Cài Đặt (thay cho 4 field kỹ thuật)

---

**Câu hỏi 1 — thay cho `min_person`**

```
┌──────────────────────────────────────────────────────────┐
│  Đèn nên bật khi có bao nhiêu người?                     │
│                                                          │
│  ○ Chỉ cần 1 người là bật                               │
│  ● Phải có ít nhất 2 người mới bật                      │
│  ○ Từ 3 người trở lên                                   │
└──────────────────────────────────────────────────────────┘
```

*Mapping: chọn 1 người → `min_person: 1`, 2 người → `min_person: 2`, ...*

---

**Câu hỏi 2 — thay cho `lux_threshold`**

```
┌──────────────────────────────────────────────────────────┐
│  Bật đèn khi trời tối như thế nào?                       │
│                                                          │
│  Chập tối    ●───────────────○    Tối hẳn                │
│  (sớm hơn)           ▲           (muộn hơn)              │
│                  Đang chọn:                              │
│               "Khá tối – trời nhá nhem"                  │
└──────────────────────────────────────────────────────────┘
```

*Slider 3-5 nấc, hiển thị nhãn ngôn ngữ thay vì số lux*

| Nhãn slider | Giá trị `lux_threshold` |
|---|---|
| Chập tối (trời còn sáng nhẹ) | 500 lux |
| Khá tối – trời nhá nhem | 300 lux |
| Tối hẳn | 100 lux |

---

**Câu hỏi 3 — thay cho `override_timeout`**

```
┌──────────────────────────────────────────────────────────┐
│  Sau khi bật/tắt thủ công, tự động trở về                │
│  chế độ tự động sau bao lâu?                             │
│                                                          │
│  ○ 15 phút                                              │
│  ● 30 phút                                              │
│  ○ 1 tiếng                                              │
│  ○ Không tự trở về (giữ thủ công)                       │
└──────────────────────────────────────────────────────────┘
```

---

**Câu hỏi 4 — thay cho `off_delay`**

```
┌──────────────────────────────────────────────────────────┐
│  Khi không còn ai, đèn tắt sau bao lâu?                  │
│                                                          │
│  ○ Tắt ngay                                             │
│  ● Chờ 5 phút rồi tắt                                   │
│  ○ Chờ 10 phút rồi tắt                                  │
│  ○ Chờ 30 phút rồi tắt                                  │
└──────────────────────────────────────────────────────────┘
```

---

### Nút Lưu Thay Đổi

```
┌──────────────────────────────────────────────┐
│                                              │
│           [ 💾 Lưu thay đổi ]               │
│                                              │
│  ✓ Đã lưu – cài đặt có hiệu lực ngay        │  ← hiện sau khi lưu
└──────────────────────────────────────────────┘
```

- Nút rộng full-width, height 52px
- Màu xanh dương `#2563EB`
- Sau khi lưu thành công: chuyển màu xanh lá + chữ "✓ Đã lưu" trong 3 giây
- Nếu lỗi: banner đỏ nhỏ phía trên nút với thông báo đơn giản ("Không lưu được, thử lại nhé")

---

---

## Bottom Sheet — Điều Khiển Nhanh

> Xuất hiện khi bấm nút `[💡 Bật / Tắt]` từ Dashboard card
> Không cần chuyển trang, thao tác nhanh ngay tại chỗ

```
┌──────────────────────────────────────────────┐
│  ▬  (drag handle)                            │
│                                              │
│  💡 Sân trước                               │
│  Đang tắt                                   │
│                                              │
│  Bật đến lúc nào?                            │
│  ○ 30 phút   ● 1 tiếng   ○ 2 tiếng          │
│  ○ Đến sáng mai                              │
│                                              │
│  ┌──────────────┐   ┌────────────────────┐   │
│  │  💡 Bật đèn │   │  🌙 Tắt đèn ngay  │   │
│  └──────────────┘   └────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

- Chỉ hiện khi bấm từ card Dashboard
- Nền trắng, shadow nhẹ, bo góc trên 20px
- Bấm ngoài để đóng
- Sau khi bấm Bật/Tắt: bottom sheet đóng, badge card cập nhật ngay

---

---

## Sơ Đồ Điều Hướng

```
                   ┌────────────────────┐
                   │    TRANG CHỦ       │  ← Landing mặc định
                   │    /               │
                   └────────┬───────────┘
                            │
              ┌─────────────┴────────────┐
              │                          │
              ▼                          ▼
     Click "Xem chi tiết"      Click "💡 Bật / Tắt"
              │                          │
              ▼                          ▼
   ┌──────────────────┐      ┌─────────────────────┐
   │   CHI TIẾT       │      │   BOTTOM SHEET      │
   │   /areas/:id     │      │   (overlay nhanh)   │
   └────────┬─────────┘      └─────────────────────┘
            │
            ▼
   Click "⚙ Chỉnh cài đặt"
            │
            ▼
   ┌──────────────────┐
   │   CÀI ĐẶT        │
   │   /areas/:id     │
   │   /settings      │
   └──────────────────┘
```

**Điều hướng quay lại:**
- Luôn có nút `← Trang chủ` / `← Tên khu vực` ở góc trên trái
- Không dùng breadcrumb (quá kỹ thuật với người dùng thường)

---

## Responsive

| Breakpoint | Dashboard | Chi tiết | Cài đặt |
|---|---|---|---|
| Mobile `< 768px` | 1 cột card, bottom sheet | Stack dọc, scroll | Stack dọc, full-width |
| Tablet `768–1200px` | 2 cột card | 2 cột (trạng thái + lịch sử) | 1 cột, rộng hơn |
| Desktop `> 1200px` | 3 cột card | 2 cột cố định | Giữa trang, max-width 600px |

---

## Xử Lý Loading & Lỗi (ngôn ngữ thân thiện)

| Tình huống | Hiển thị |
|---|---|
| Đang tải lần đầu | Skeleton card mờ nhạt, không có spinner kỹ thuật |
| Mất kết nối | Banner trên cùng: *"Đang mất kết nối – dữ liệu có thể chưa cập nhật"* |
| Lệnh bật/tắt thất bại | Toast đỏ: *"Không gửi được lệnh, thử lại nhé 🙁"* |
| Lưu cài đặt thất bại | Dưới nút lưu: *"Có lỗi xảy ra, vui lòng thử lại"* |
| Không có khu vực nào | Empty state: icon ngôi nhà + *"Chưa có khu vực nào được thêm"* |

---

*Tài liệu này dùng để thiết kế và handoff giai đoạn implementation – phiên bản người dùng phổ thông.*
