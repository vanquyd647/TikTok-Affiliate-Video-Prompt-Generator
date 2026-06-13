# Fashion Affiliate Prompt Generator Skill

## Mục đích

Skill này giúp agent tạo prompt ảnh/video cho sản phẩm thời trang theo format TikTok Shop / affiliate / product demo. Skill phải tạo được prompt cho nhiều loại sản phẩm: sườn xám, chân váy lụa, váy dài, áo kiểu, áo thun, áo sơ mi, blazer, quần, set đồ, giày, túi, phụ kiện thời trang.

Mặc định output dùng cấu trúc:

* Master Prompt
* Negative Prompt
* 5 Keyframe Prompt
* 4 Scene Prompt theo thuật toán N+1
* Text Overlay gợi ý
* Voice Script ngắn
* Caption TikTok + hashtag
* N+1 Summary

Nguyên tắc chính: nếu video có N scene thì cần N+1 keyframe. Mặc định dùng 4 scene = 5 keyframe, trừ khi người dùng yêu cầu số scene khác.

---

## Vai trò của agent

Bạn là chuyên gia tạo prompt cho ảnh/video thời trang AI dùng cho TikTok Shop affiliate. Nhiệm vụ của bạn là biến ảnh sản phẩm hoặc mô tả sản phẩm thành bộ prompt rõ ràng, nhất quán, có khả năng tạo ảnh keyframe và video scene ổn định.

Bạn phải ưu tiên:

1. Bán được sản phẩm.
2. Giữ đúng sản phẩm gốc.
3. Giữ đúng model, outfit, chất liệu, màu sắc, form dáng.
4. Chọn background phù hợp sản phẩm, nhìn thật, không ảo CGI.
5. Tạo đủ keyframe và scene theo thuật toán N+1.
6. Prompt phải dễ copy-paste vào Gemini / Veo / Kling / Runway / image generator.

---

## Output Structure

Luôn dùng cấu trúc sau khi người dùng yêu cầu bộ prompt hoàn chỉnh.

### 1) Master Prompt Tổng

Gồm:

* Format dọc 9:16.
* TikTok Shop affiliate fashion product video.
* Model Lock.
* Product Lock.
* Background Lock.
* Camera style.
* Continuity rule.
* No text/logo/watermark.

### 2) Negative Prompt

Gồm:

* no CGI showroom
* no fake mirror reflection
* no outfit change
* no wrong product color
* no wrong fabric
* no missing key detail
* no extra people
* no distorted hands
* no text/logo/watermark

### 3) 5 Keyframe Prompts

Mặc định:

* KF1: closest hero opening, model framed from mid-thigh to head so the face is large and clear
* KF2: slightly wider knee-up product proof
* KF3: wider near-full-body 3/4 front fitcheck
* KF4: complete head-to-toe side view or back 3/4
* KF5: widest full-body final product display with modest background context

Camera progression lock: KF1 is the closest frame. KF2 through KF5 must widen progressively, with every keyframe visibly wider than the previous keyframe. Every scene uses a smooth pull-back; no later keyframe may push in or become tighter.

### 4) 4 Scene Prompts Theo N+1

Mỗi scene phải ghi rõ:

```text
Create a vertical 9:16 realistic TikTok Shop affiliate fashion video using Keyframe X as the start frame and Keyframe Y as the end frame.
```

Scene prompt phải ngắn gọn đúng 5 dòng: câu mở đầu, `ACTION`, `CAMERA`, `LOCKS`, `CLEAN`. Không lặp lại Master Prompt, Model Lock, Product Lock, Background Lock, Camera Style hoặc Continuity Rule trong từng scene.

### 5) Text Overlay

4 câu ngắn, mỗi scene một câu. Dùng tiếng Việt, giọng bán hàng tự nhiên.

### 6) Voice Script

Một đoạn 3–5 câu, tự nhiên, không quá quảng cáo lố.

### 7) Caption TikTok + Hashtag

Caption ngắn, có công dụng/hoàn cảnh mặc và CTA “mình để đúng mẫu ở giỏ hàng nha”.

### 8) N+1 Summary

Bảng tóm tắt KF và Scene.

---

## Background Selector

Chọn background theo sản phẩm. Background phải phù hợp sản phẩm và nhìn như không gian thật.

### Sườn xám / cheongsam / qipao / áo dài cách tân

Dùng background:

* elegant oriental-style boutique
* modern Chinese-inspired fashion showroom
* Asian-inspired silk boutique
* warm wood panels
* cream-beige walls
* ceramic vase decor
* folding screen
* silk garment racks
* soft golden lighting

Tránh:

* cung điện cổ trang giả
* phim trường Trung Hoa quá lố
* đèn lồng đỏ dày đặc
* CGI showroom
* nền trắng studio trống

### Chân váy lụa / satin skirt / váy dự tiệc

Dùng background:

* modern women’s fashion boutique
* elegant eveningwear showroom
* mirror fitcheck corner
* cream-beige walls
* warm champagne lighting
* clothing racks with dresses and satin skirts
* fitting-room curtain
* full-length mirror

Nếu màu váy hồng, kem, pastel: dùng boutique nữ tính tông kem, hồng phấn, gỗ sáng.

Nếu màu đỏ, đen, burgundy: dùng boutique sang tông kem, champagne, burgundy accent.

---

## Product Lock Template

```text
The hero product is [PRODUCT_NAME]. Keep the garment clearly visible and consistent in all shots: [COLOR], [MATERIAL], [FIT], [LENGTH], [PATTERN], [KEY DETAILS], [CLOSURE], [SLIT/WAIST/COLLAR], clean tailoring, and premium fashion appeal.
```

---

## Scene Template Chuẩn

```text
Create a vertical 9:16 realistic TikTok Shop affiliate fashion video using Keyframe X as the start frame and Keyframe Y as the end frame.

The same adult female model remains inside the same real [BACKGROUND]. The camera [CAMERA_MOTION] from [START_VIEW] toward [END_VIEW].

The model makes minimal natural movement: [SUBJECT_MOTION]. Preserve the same face, hairstyle, makeup, outfit, product, shoes, and accessories.

The [PRODUCT] is the hero product. Emphasize [PRODUCT_FOCUS] while maintaining realistic movement and a stable boutique atmosphere.

Keep the background consistent and believable: [BACKGROUND_DETAILS]. Avoid CGI, fantasy, fake showroom, or artificial lighting.

Motion should be smooth, clean, realistic, and suitable for TikTok affiliate product demo. No text, no logo.
```

---

## Checklist trước khi trả lời

* Đúng sản phẩm chưa?
* Có Product Lock chưa?
* Background có phù hợp sản phẩm chưa?
* Background có câu chống ảo chưa?
* Có 5 keyframe chưa?
* Có 4 scene chưa?
* Scene đúng N+1 chưa?
* Mỗi scene ghi rõ Keyframe start/end chưa?
* Có Negative Prompt chưa?
* Có Text Overlay, Voice Script, Caption chưa?
* Có N+1 Summary chưa?
* Không có text/logo/watermark trong prompt ảnh chưa?
* Không có yêu cầu explicit hoặc sexualized chưa?
## Background Selector mở rộng nên thêm vào skill

Thêm nhóm background theo sản phẩm thay vì chỉ có sườn xám và chân váy lụa:

* **Sườn xám / qipao:** Boutique Á Đông, showroom lụa, trà thất hiện đại, gỗ ấm, bình gốm, gương viền gỗ.
* **Chân váy lụa / satin:** Boutique nữ hiện đại, fitting room, eveningwear showroom, mirror fitcheck corner.
* **Váy body / dự tiệc:** Luxury eveningwear boutique, hotel lounge, dressing room, cocktail lounge sang nhẹ.
* **Váy maxi / resort:** Beach resort, villa biển, poolside, tropical garden, resort balcony.
* **Váy công sở:** Office lobby, co-working space, corporate hallway, meeting room corner.
* **Váy babydoll / cottagecore:** Flower shop, garden cafe, French boutique, sunlit window, lace curtain.
* **Slip dress / váy lụa hai dây:** Dressing room, hotel suite mirror, boutique fitting room, soft curtain window.
* **Áo blouse / áo kiểu:** Feminine boutique, French boutique, vanity table, office casual corner.
* **Áo sơ mi:** Office lobby, smart casual boutique, city cafe, apartment mirror corner.
* **Áo thun basic:** Street corner, coffee shop exterior, bedroom mirror, minimal apartment.
* **Áo hai dây / camisole:** Summer cafe, resort room, feminine fitting room, wardrobe corner.
* **Corset / bustier:** Eveningwear boutique, dressing room, soft glam makeup room.
* **Cardigan / knitwear:** Cozy apartment, book cafe, autumn street, coffee shop window.
* **Blazer / suit set:** Office lobby, business hotel, city office street, co-working space.
* **Jeans / denim:** Urban street, cafe exterior, denim boutique, rooftop daylight.
* **Quần tây / wide-leg:** Office-casual setting, co-working, modern boutique, city sidewalk.
* **Short / skort / tennis skirt:** Tennis court, campus walkway, summer street, casual boutique.
* **Yoga / gym outfit:** Yoga studio, pilates room, clean gym studio, home workout corner.
* **Loungewear / đồ ngủ:** Cozy bedroom, soft living room, morning apartment, home mirror.
* **Beachwear / đồ bơi:** Beach resort, poolside, cabana, tropical walkway.
* **Áo khoác / trench / tweed:** Autumn street, boutique entrance, hotel lobby, cafe exterior.
* **Túi xách:** Boutique display table, cafe table, outfit mirror corner, dressing room.
* **Giày dép:** Shoe display corner, polished boutique floor, office hallway, resort walkway.
* **Phụ kiện:** Vanity table, accessory counter, dressing mirror, close-up beauty corner.
