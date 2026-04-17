# AFF Video Prompt Generator

> 🎬 Tạo prompt tự động cho video TikTok Affiliate (OOTD, FYP) với thuật toán N+1, Veo 3.1 & Gemini AI

## Tính năng

- 📸 **Upload ảnh Face + Product** — Drag-drop hoặc paste (Ctrl+V)
- 🤖 **Gemini AI Integration** — Hỗ trợ 4 model: 2.5 Flash, 3.0 Preview, Gemma 4 31B, Gemma 4 26B
- 📐 **Tùy chọn linh hoạt** — Duration (24/32/40/48s), Aspect Ratio (9:16/16:9)
- 📝 **Ghi chú tùy chỉnh** — Thêm yêu cầu đặc biệt cho prompt
- 🧬 **Character DNA** — Đảm bảo nhất quán khuôn mặt qua tất cả keyframe
- 🎯 **Thuật toán N+1** — Tự động tính số scene + keyframe tối ưu
- 🎬 **Veo 3.1 Format** — Prompt theo format first-frame → last-frame
- 📋 **Copy & Export** — Copy từng prompt hoặc export full package .txt

## Thuật toán N+1

| Video Duration | Scenes | Keyframe Images | 
|:---:|:---:|:---:|
| 24s | 3 | 4 |
| 32s | 4 | 5 |
| 40s | 5 | 6 |
| 48s | 6 | 7 |

Mỗi scene 8s sử dụng Veo 3.1: ảnh đầu + ảnh cuối → interpolate video liền mạch.

## Quick Start

```bash
# Install
npm install

# Development
npm run dev

# Build
npm run build
```

## Luu Lich Su Lam Viec (MongoDB + Vercel)

Ung dung da co san API de luu lich su tao noi dung vao MongoDB:

- `POST /api/work-history`: Luu 1 ban ghi (`prompt`, `seo`, `voiceover`).
- `GET /api/work-history?limit=30`: Lay danh sach lich su moi nhat.

Can cau hinh bien moi truong tren Vercel (hoac local):

- `MONGODB_URI` (bat buoc)
- `MONGODB_DB_NAME` (tuy chon, mac dinh `aff_prompt_generator`)
- `MONGODB_WORK_HISTORY_COLLECTION` (tuy chon, mac dinh `work_history`)

Su dung file mau: `.env.example`.

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Vanilla CSS (premium dark theme)
- **Icons**: Lucide React
- **AI**: Google Gemini API (client-side)
- **Build**: Vite 8

## Cách sử dụng

1. Nhập **Gemini API Key** 
2. Chọn **Model** (2.5 Flash recommended)
3. Upload **ảnh face** + **ảnh sản phẩm**
4. Chọn **thời lượng** (24-48s) và **tỉ lệ** (9:16 cho TikTok)
5. Thêm **ghi chú** nếu cần
6. Nhấn **"Tạo Prompt Package"**
7. Copy từng prompt hoặc Export tất cả

## License

Private project - AFF Video Production
# TikTok-Affiliate-Video-Prompt-Generator
