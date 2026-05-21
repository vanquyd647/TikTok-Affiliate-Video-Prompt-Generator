# Nắm Bàn Tay - Nano Banana Pro Image Prompts + Veo 3 Scene Prompts

Source files:
- Script: `Kịch bản shortclip 1 - Nắm bàn tay - Trang tính1.csv`
- Audio: `Nắm bàn tay cut 1 (1).mp3`
- Audio length detected locally: ~40.1s

Production logic:
- Output ratio: vertical TikTok 9:16
- N+1 structure: 5 scenes x 8s = 40s, 6 keyframe images
- Veo flow: each video scene uses `first frame = KF[i]` and `last frame = KF[i+1]`
- Main continuity lock: same female lead, same white oversized shirt, same phone, emotional progression from lonely online love to real-world presence
- Text safety: avoid relying on AI-generated readable phone text. Use abstract chat bubbles/notification shapes, then add exact message text in editing/subtitle if needed.
- No visible camera crew, no production gear, no logos, no watermark, no random extra hands, no distorted fingers.

## Character Lock

Female lead:
- Fictional Korean woman, 23 years old, reference-inspired by the provided female image: beautiful baby-face actress/model look, very long straight black hair with a clean center part, large glossy dark eyes, soft full lips, fair dewy skin, fragile but emotionally grown-up.
- Outfit: white oversized button-up shirt, modest underlayer, light-wash straight-leg jeans or beige wide-leg lounge trousers, clean white sneakers or cream flats; rain-speckled later but always fully opaque and modest.
- Prop: smartphone always visible until the emotional drop, then phone becomes inactive/off.

Male lead:
- Fictional Korean man, 25 years old, reference-inspired by the provided male image: handsome actor/model look, tousled black curtain-fringe hair, fair clean skin, sharp nose bridge, defined jawline, quiet presence, dark hoodie over black T-shirt, dark trousers, simple dark shoes.
- Appears through action, not performance: umbrella, jacket, sitting beside her, gently holding her hand.

Visual style:
- Korean ballad MV / K-drama romance mood, healing sadness, modern loneliness, glossy rain reflections, soft film grain, realistic skin, emotionally restrained acting.
- Lighting progression: cold blue phone light -> moonlit bedroom window bokeh -> rainy Seoul-style neon -> dreamy digital light fragments -> warm umbrella backlight -> early dawn softness.

## Korean Music Video Motif Lock

- Overall motif: premium Korean ballad MV, emotional but polished, like a 40s vertical music-video cut.
- Performance style: no lip-sync, no dance, no melodrama. Acting is quiet: eye movement, breath, hand hesitation, shoulder tension, slow turning.
- Visual language: blue bedroom loneliness, window reflection, rain-streaked street, neon bokeh, slow-motion droplets, soft lens bloom, restrained close-ups, elegant pull-out ending.
- Color palette: midnight blue, soft cyan, muted magenta neon, warm amber shelter light, pale dawn blue.
- Editing feel: match cuts through phone light and rain reflections; digital overlays are abstract visual metaphors, not readable UI.
- Safety/continuity: all characters are fictional adults, fully clothed, wardrobe stays modest, no real celebrity likeness, no logos, no readable text, no unsafe distress.

## Master Character + Outfit Prompts

Use these first to create stable character reference images before generating the keyframes.
Master prompts are reference-only: the image should show only the sample model(s), clean outfit, clean face, and neutral background. Do not create story scenes here.

### MASTER FEMALE_REF - Main Female Character + Outfit

```text
Create a clean model reference image for FEMALE_REF only.

REFERENCE PURPOSE: This image is only for locking the sample female model's face, body proportion, hair, and outfit before generating story keyframes. Use the provided female image as appearance inspiration only; create a fictional adult Korean model with similar visual traits, not an exact copy of any real person. Do not create a bedroom scene, rain scene, phone scene, or cinematic story moment.

SUBJECT: A fictional Korean woman, 23 years old, exceptionally beautiful and photogenic like a lead actress/model in a premium Korean romance short film. Appearance inspired by the provided female reference image: very long straight silky black hair, clean center part, smooth fair dewy skin, small soft oval face, large glossy dark eyes, soft natural brows, delicate refined nose, soft full rose-pink lips, gentle cheek volume, slim graceful neck, delicate but emotionally mature presence. She feels fragile, lonely, and healing, but still visibly pretty, fresh, and camera-ready.

BEAUTY DETAIL: She is clearly beautiful at first glance in a cinematic Korean-drama short-film way: baby-face elegance, balanced symmetrical features, bright expressive round eyes, clean soft skin glow, delicate nose bridge, naturally pretty rose lips, smooth jaw contour, graceful neck, slim natural body proportion, quiet feminine charm. Her beauty should feel elegant, emotional, and relatable, not plastic, not influencer-glam, not exaggerated. Avoid tired-looking eyes, dull skin, swollen face, harsh facial shadows, awkward asymmetry, or unflattering expressions.

HAIR + MAKEUP: Very long straight silky black hair falling past the chest, clean center part, smooth face-framing layers, polished but natural. Minimal natural Korean-style makeup that enhances beauty: soft even dewy skin tone, gentle rosy lips, subtle blush, clean lashes, bright glossy eyes, no heavy contour, no dramatic lashes.

COMPLETE OUTFIT LOCK: White oversized button-up shirt as the hero garment, slightly loose shoulders, soft opaque cotton fabric, long sleeves partly covering the wrists, natural wrinkles and folds, collar open modestly, shirt length covering the hips. Underlayer: simple white or nude camisole/tank top underneath so the outfit remains fully modest and opaque in every scene. Bottom: high-waisted light-wash straight-leg jeans or soft beige wide-leg lounge trousers, simple and understated, no ripped fabric. Shoes: clean white low-top sneakers or simple cream flat shoes. Accessories: very small simple earrings only, no necklace, no watch, no bag, no visible brand, no pattern. The outfit must feel intimate, simple, story-driven, Korean MV casual, not sexy costume styling.

RAIN/ENDING VARIANT: In rain scenes the shirt can be lightly rain-speckled but must remain fully opaque and modest. In the ending, she may wear the male lead's plain dark jacket over her shoulders while the white shirt remains visible.

PROP: No story prop in this master reference. No smartphone, no rain, no umbrella, no bed, no city street.

POSE: Neutral standing full-body model reference pose. Arms relaxed naturally at the sides or one hand lightly touching the shirt cuff. Soft emotional expression, slightly guarded body language, shoulders soft, hands delicate and natural.

CAMERA: Full-body model reference, head-to-toe visible, 9:16 vertical frame, centered composition, simple neutral gray or white studio background, sharp face and outfit readability.

LIGHTING: Soft flattering cinematic studio light, gentle shadow, realistic skin glow, bright catchlights in the eyes, no harsh beauty retouching.

STYLE: Clean reference photo, realistic Korean romance short-film character design, appearance inspired by the provided female reference image but not identical to any real person, natural human anatomy, very beautiful but believable, consistent facial identity, flattering face angle, no logo, no watermark, no text, no extra fingers, no distorted hands, no camera gear, no over-glamour retouching, no background scene, no unattractive facial distortion, do not imitate any real celebrity or public figure.
```

### MASTER MALE_REF - Main Male Character + Outfit

```text
Create a clean model reference image for MALE_REF only.

REFERENCE PURPOSE: This image is only for locking the sample male model's face, body proportion, hair, and outfit before generating story keyframes. Use the provided male image as appearance inspiration only; create a fictional adult Korean model with similar visual traits, not an exact copy of any real person. Do not create a rain scene, umbrella scene, bus stop scene, or cinematic story moment.

SUBJECT: A fictional Korean man, 25 years old, handsome like a premium Korean romance actor/model in a quiet cinematic way. Appearance inspired by the provided male reference image: fair clean skin, tousled black curtain-fringe hair with natural volume, deep dark eyes, straight refined nose bridge, soft full lips, long elegant neck, defined but smooth jawline, slim face shape, calm protective expression. He feels trustworthy, steady, and emotionally reserved.

HANDSOME DETAIL: He is good-looking but not flashy: Korean actor-like visual, sharp yet gentle face, clean profile, natural masculine charm, relaxed posture, subtle confidence, sincere eyes, no model-pose arrogance, no exaggerated muscles. His attractiveness comes from quiet presence and action.

HAIR + GROOMING: Medium-short tousled black hair with curtain fringe falling naturally over the forehead, airy texture, clean-shaven face, tidy but not overly styled, natural skin texture.

COMPLETE OUTFIT LOCK: Dark charcoal or deep navy simple hoodie layered over a plain black crew-neck T-shirt, relaxed fit, minimal texture, no logo, no visible brand. Outer layer for rain/arrival scenes: plain dark lightweight jacket or overshirt that he can offer to the female lead later. Bottom: dark straight-leg trousers or black relaxed-fit jeans, clean silhouette, no ripped fabric. Shoes: simple black sneakers or dark leather casual shoes. Accessories: no jewelry, no hat, no bag, no visible brand. The outfit should make him look dependable, warm, understated, and believable for a rainy night.

RAIN/ENDING VARIANT: In rain scenes he carries a plain dark umbrella and may remove or offer the plain dark jacket to her; his base hoodie/T-shirt and dark trousers remain consistent.

PROPS: No story prop in this master reference. No umbrella, no jacket-in-hand, no rain, no bus stop, no street background.

POSE: Neutral standing full-body model reference pose, calm protective posture, hands relaxed naturally, expression quiet and sincere. Shoulders relaxed, body slightly angled for a subtle 3/4 model-reference view.

CAMERA: Full-body model reference, head-to-toe visible, 9:16 vertical frame, centered composition, simple neutral gray or white studio background, sharp face and outfit readability.

LIGHTING: Soft cinematic studio light, realistic shadows, natural face texture, no fashion editorial exaggeration.

STYLE: Clean reference photo, realistic Korean romance short-film character design, appearance inspired by the provided male reference image but not identical to any real person, handsome but believable romantic lead, quiet action-over-words energy, natural anatomy, consistent facial identity, no logo, no watermark, no text, no extra fingers, no distorted hands, no camera gear, no over-stylized idol look, no background scene, do not imitate any real celebrity or public figure.
```

### MASTER COUPLE_REF - Shared Wardrobe + Height + Chemistry Lock

```text
Create a clean two-model reference image using FEMALE_REF and MALE_REF.

REFERENCE PURPOSE: This image is only for locking both sample models together: face consistency, height relationship, body proportions, wardrobe, and quiet couple chemistry. Do not create a rain scene, umbrella scene, bus stop scene, or narrative shot.

SUBJECT: The same beautiful fictional Korean woman inspired by the provided female reference image and the same handsome fictional Korean man inspired by the provided male reference image. Preserve their exact fictional facial identity, hair, age impression, body proportion, facial beauty level, and wardrobe continuity.

WARDROBE LOCK: Female wears the complete outfit from FEMALE_REF: white oversized button-up shirt, modest underlayer, light-wash straight-leg jeans or beige wide-leg lounge trousers, clean white sneakers or cream flats, tiny earrings only. Male wears the complete outfit from MALE_REF: dark charcoal/deep navy hoodie, plain black crew-neck T-shirt, dark straight-leg trousers or black relaxed-fit jeans, simple black sneakers or dark casual shoes. No smartphone, no umbrella, no jacket prop in this clean master reference, no logos, no patterns, no extra accessories.

RELATIONSHIP ENERGY: Quiet emotional closeness, not passionate, not performative. They should look visually compatible as a romantic short-film couple: she is beautiful, vulnerable, and emotionally tired; he is handsome, steady, and protective. They should feel like two people who understand each other through presence and small actions. No kissing, no dramatic embrace.

POSE: They stand side by side as clean model references, not acting a scene. The female has a soft vulnerable expression; the male has a calm protective expression. Keep a small respectful distance between them, natural hands, natural posture, anatomically correct fingers.

CAMERA: Full-body two-model reference, head-to-toe visible, 9:16 vertical frame, centered composition, simple neutral gray or white studio background, clear full outfit visibility.

LIGHTING: Soft cinematic studio light, realistic shadows, clean face readability, no dramatic rain or neon scene lighting.

STYLE: Clean reference photo, Korean romance short-film realism, beautiful female lead, handsome male lead, consistent identity, consistent clothing, natural skin, subtle film grain, no readable text, no logo, no watermark, no camera gear, no fashion-advertisement exaggeration, no background scene, do not imitate any real celebrity or public figure.
```

### Outfit Continuity Rules For All Keyframes

- FEMALE_REF outfit must remain the same white oversized shirt from KF01 to KF06.
- From KF03 onward, the shirt can become lightly rain-speckled, but it must remain fully opaque and modest; its cut, collar, sleeve length, and fabric must stay consistent.
- In KF06, the female may wear the male's dark jacket over her shoulders, but the white shirt must still be visible.
- MALE_REF outfit must stay dark, plain, and minimal across all appearances.
- The umbrella and jacket are practical story props, not fashion hero products.
- Do not add luxury branding, jewelry, hats, bags, new hairstyles, heavy makeup, or extra outfit changes.
- Preserve realistic Korean human features and avoid idol/glamour transformation between frames.

## Nano Banana Pro - Keyframe Image Prompts

### KF01 - 00:00 - Phone-Light Loneliness

```text
SUBJECT: Fictional Korean woman from FEMALE_REF, 23 years old, beautiful lead-actress look, long black hair, wearing the same white oversized button-up shirt, lying alone on a dark bed while holding a smartphone close to her face; fragile but mature emotional expression.
ACTION: She silently looks at the dim phone screen, hopeful but hurt; abstract message-light shapes softly appear and fade as a music-video visual metaphor, with no readable text or UI.
FACING: Front-facing with a slight 3/4 right turn, face softly lit from below by the phone, eyes glossy with reflected blue light.
LOCATION: Small modern bedroom at night, minimal Korean MV set design, dark bedding, sheer curtain, faint Seoul-style city bokeh through the window, lonely online-romance atmosphere.
CAMERA: Close-up portrait frame, premium Korean ballad MV opening shot, shallow depth of field, phone in foreground, beautiful face sharp, background soft.
LIGHTING: Cold blue phone glow on face, faint moonlit window edge light, very low ambient room light, soft lens bloom, subtle shadow falloff.
STYLE: Korean ballad MV romance, healing sadness, realistic skin texture, fine film grain, polished but natural, no logo, no watermark, no readable UI text, no camera gear.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF02 - 00:08 - Bedside Doubt Before the Call

```text
SUBJECT: Same fictional Korean woman from FEMALE_REF, same long black hair and white oversized shirt, sitting up on the edge of the bed with the smartphone in both hands.
ACTION: She lowers the phone slightly as the blue glow fades, her expression shifts from believing promises to quiet disappointment; the room feels wider, elegant, and emotionally empty like a Korean MV pre-chorus.
FACING: 3/4 left-facing, shoulders turned away from the phone, visible emotional withdrawal.
LOCATION: Same dark bedroom, night, blanket and pillow behind her, sheer curtain, window faintly reflecting soft city lights.
CAMERA: Medium close-up, slightly higher angle, elegant negative space, intimate handheld-feeling frame, face remains flattering.
LIGHTING: Cold phone light fading into moonlit blue-gray room shadows, soft grain, gentle rim light along her hair, no harsh highlights.
STYLE: Korean ballad MV breakup mood, restrained acting, clean beauty lighting, no readable phone text, no extra people, no visible camera equipment, no watermark.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF03 - 00:16 - Rain Street Isolation

```text
SUBJECT: Same fictional Korean woman from FEMALE_REF, long black hair lightly rain-speckled, wearing the same white oversized button-up shirt that remains fully opaque and modest, standing alone on a wet city sidewalk while holding her smartphone.
ACTION: She quietly waits for a reply that does not arrive; the phone screen is dim and abstract with no readable UI, no status icons, and no message text. Her expression is sad but calm, emotionally lonely without panic or danger.
FACING: Front-facing with slight 3/4 left body angle, head gently lowered toward the phone, shoulders closed but natural.
LOCATION: Rainy night street in a fictional modern Korean urban setting, neon reflections on wet pavement, blurred traffic lights, a few distant pedestrians as soft silhouettes.
CAMERA: Medium full-body frame, low eye-level street perspective, traffic blur behind her, light rain streaks visible, modest wardrobe readability preserved.
LIGHTING: Cool neon blue and magenta reflections, rainy streetlight glow, soft cinematic haze, flattering face light.
STYLE: Cinematic rain loneliness, slow-motion emotional realism, gentle social-era isolation, fully clothed adult character, no readable text, no UI symbols, no brand logos, no distorted fingers, no watermark, no unsafe distress.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF04 - 00:24 - Digital Love Dissolves

```text
SUBJECT: Same fictional Korean woman from FEMALE_REF, rain-speckled hair, white oversized shirt still fully opaque and modest, standing still in the rain while ghostlike digital light fragments float around her.
ACTION: Abstract video-call frames, typing-dot-like light particles, and online-presence silhouettes dissolve into soft pixel dust around her; she remains calm and emotionally still, choosing real presence over virtual promises.
FACING: 3/4 right-facing, body slightly turned as if surrounded by digital noise, eyes searching beyond the screen.
LOCATION: Same rainy fictional Korean urban sidewalk, neon reflections and blurred traffic continuity from the previous keyframe.
CAMERA: Wider medium Korean MV shot, centered subject, layered foreground digital particles, shallow depth with bokeh street lights and lens bloom.
LIGHTING: Cold neon rain light mixed with faint phone glow, soft glitch highlights on floating light shapes, flattering face light, wardrobe remains modest and readable.
STYLE: Korean ballad MV romance plus subtle digital-breakup effect, pixel dissolve, hologram-like abstract UI without readable text, realistic human anatomy, no watermark, no unsafe distress.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF05 - 00:32 - He Arrives in Real Life

```text
SUBJECT: Same fictional Korean woman from FEMALE_REF, rain-speckled hair and fully opaque white oversized shirt, now under a dark umbrella beside a handsome fictional Korean man from MALE_REF, 25 years old, wearing a dark simple hoodie or shirt.
ACTION: The man has just arrived beside her like the emotional drop of a Korean MV, holding the umbrella over both of them and offering his jacket; her smartphone screen is off in her lowered hand, and his other hand gently reaches toward hers.
FACING: Woman 3/4 left-facing toward him; man 3/4 right-facing toward her; both framed in a quiet shared moment.
LOCATION: Same rainy sidewalk near a small bus stop or street shelter, wet pavement, neon reflections, night moving toward late-night calm.
CAMERA: Medium two-shot, eye-level, intimate Korean drama MV framing, umbrella creates a protective frame above them, faces softly visible.
LIGHTING: Warm amber shelter backlight mixed with cool rain reflections, gentle rim light around hair and umbrella edge, emotional drop moment, realistic wet textures.
STYLE: Healing Korean ballad MV romance, action-over-words, restrained tenderness, no kissing, no melodrama, no readable phone text, no logo, no watermark.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF06 - 00:40 - Dawn Bus Stop Hand Hold

```text
SUBJECT: Same fictional Korean woman in white oversized shirt with a dark jacket over her shoulders, sitting beside the same handsome quiet man in dark clothing at a bus stop near dawn.
ACTION: They sit shoulder-to-shoulder without kissing; her head lightly rests near his shoulder, their hands are gently held together in the foreground, calm and real, like the final image of a Korean ballad MV.
FACING: Both mostly front-facing with a soft 3/4 inward angle toward each other; hands clearly visible but natural.
LOCATION: Quiet bus stop at early dawn after rain, empty road, wet pavement, pale blue morning sky, soft shelter bench, Seoul-style city bokeh far behind.
CAMERA: Medium-wide ending frame, elegant long-lens Korean MV composition, camera pulled back enough to show the small bus stop and the quiet world around them.
LIGHTING: Soft dawn blue with warm shelter light residue, gentle highlights on wet ground, peaceful emotional resolution, subtle lens bloom.
STYLE: Cinematic healing Korean ballad MV ending, realistic romance short-film texture, subtle film grain, no text, no logos, no watermark, natural hand anatomy.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

## Veo 3 - Scene Prompts

### Scene 01 - 00:00-00:08
Lyrics: “Em từng tin những lời đậm sâu / Giữ một người ở lại thật lâu / Em từng tin hơn cả ngàn câu”

Use first frame: KF01. Use last frame: KF02.

```text
Position: Center | Motion: Dolly in. Create an 8-second vertical Korean ballad MV opening shot moving from a close phone-lit view of the beautiful female lead lying on the dark bed to her sitting up at the bed edge as the phone glow fades. Keep the same fictional Korean woman, same white oversized shirt, same bedroom, same smartphone. Abstract message-light shapes appear then fade without readable text or UI. Mood is lonely, healing, polished romantic sadness, with subtle handheld micro-shake, cold blue phone light, moonlit window bokeh, soft film grain, and no sudden cuts.
```

### Scene 02 - 00:08-00:16
Lyrics: “Em từng tin hơn cả ngàn câu / Đến lúc cần... lại chẳng thấy đâu”

Use first frame: KF02. Use last frame: KF03.

```text
Position: Center | Motion: Dolly out. Create an 8-second Korean MV match-cut transition from bedroom doubt into rainy street loneliness, preserving the same female lead, outfit, phone, and emotional continuity. The phone glow and window reflection become neon rain reflections. She lowers the phone in the room, then the visual flow resolves into her standing alone on wet neon pavement quietly waiting for a reply that does not arrive. Rain falls softly in slow motion, traffic lights blur behind her, the wardrobe remains fully opaque and modest, and the camera movement stays smooth and restrained.
```

### Scene 03 - 00:16-00:24
Lyrics: “Ngoài kia ai thương bằng mây / Em chọn người thương bằng tay”

Use first frame: KF03. Use last frame: KF04.

```text
Position: Left | Motion: Orbit right. Create an 8-second rainy Korean ballad MV street scene where the camera gently arcs around the woman as digital relationship symbols form and dissolve around her. Start with her quietly holding the dim phone, then reveal abstract video-call frames, typing-dot-like light particles, and online-presence silhouettes breaking apart like soft hologram dust. Keep all UI symbolic and non-readable. The emotional contrast is clear: online affection feels weightless and disappears, while real presence becomes the emotional need.
```

### Scene 04 - 00:24-00:32
Lyrics: “Không cần online cả ngày / Chỉ cần đúng lúc ở đây”

Use first frame: KF04. Use last frame: KF05.

```text
Position: Right | Motion: Dolly in. Create an 8-second emotional drop scene in the style of a Korean romance music video. Begin with the woman surrounded by dissolving digital light fragments in the rain. As the lyric says she does not need someone online all day, her phone screen turns completely off in her lowered hand. As the lyric reaches the feeling of being here at the right time, the handsome male lead enters frame with an umbrella, places it over both of them, offers his jacket, and gently reaches for her hand. Use warm shelter backlight, rain rim light, and restrained acting. No kiss, no melodrama, no unsafe distress.
```

### Scene 05 - 00:32-00:40
Lyrics: “Ngoài kia ai thương bằng lời / Em chọn người thương bằng đời / Không cần đôi ba phút giây / Chỉ cần đúng lúc ở đây”

Use first frame: KF05. Use last frame: KF06.

```text
Position: Further | Motion: Dolly out. Create an 8-second Korean ballad MV ending scene that moves from the man and woman sheltered together in the rain to a quiet dawn bus stop. Keep the same fictional Korean characters, same wardrobe, and same emotional continuity. The man sits beside her in silence; she wears his jacket over her white shirt. They do not kiss or perform romance; they simply sit shoulder-to-shoulder and hold hands naturally. The camera slowly pulls out with soft dawn blue, wet pavement reflections, subtle lens bloom, and long-lens city bokeh, ending with calm real-life presence instead of online promises.
```

## Editor Notes

- Add exact phone-message copy in post-production as an overlay, not inside Nano Banana Pro image generation:
  - “Anh luôn ở đây”
  - “Tin anh nha”
  - “Anh không bỏ em đâu”
- Suggested subtitle/emotion sync:
  - 00:00-00:08: cold blue bedroom, belief in promises
  - 00:08-00:16: rain, no reply, quiet loneliness
  - 00:16-00:24: online love dissolves into abstract MV light
  - 00:24-00:32: phone off, real person arrives, hand hold under umbrella
  - 00:32-00:40: dawn bus stop, quiet commitment, Korean ballad MV ending
- If Veo struggles with the bedroom-to-rain transition in Scene 02, render it as a match-cut edit between two clips instead of asking Veo to transform location inside one generation.
