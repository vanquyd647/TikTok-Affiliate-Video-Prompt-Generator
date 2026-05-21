# Nắm Bàn Tay - Nano Banana Pro Image Prompts + Veo 3 Scene Prompts

Source files:
- Script: `Kịch bản shortclip 1 - Nắm bàn tay - Trang tính1.pdf`
- Prompt mode: visual storyboard only, using action, mood, camera, lighting, and continuity.

Production logic:
- Output ratio: vertical TikTok 9:16
- N+1 structure: 5 scenes x 8s = 40s, 6 keyframe images
- Veo flow: each video scene uses `first frame = KF[i]` and `last frame = KF[i+1]`
- Main continuity lock: same female lead, same white oversized shirt, same phone, emotional progression from lonely online love to real-world presence
- Text safety: avoid relying on AI-generated readable phone text. Use abstract chat bubbles/notification shapes, then add exact message text in editing/subtitle if needed.
- No visible camera crew, no production gear, no logos, no watermark, no random extra hands, no distorted fingers.

## Script Visual Flow From PDF - Customized Visual Variation

- Scene 01: A young woman sits alone beside a bedroom window at night, phone light reflected on the glass. Abstract promise-message shapes appear as soft reflections, then fade into empty blue room space.
- Scene 02: She leaves the room and ends up under a small convenience-store awning on a neon street in a fine drizzle. She tries to reach someone, but the city feels connected around her while she remains alone.
- Scene 03: A bus shelter glass wall becomes a visual metaphor for online affection: video-call frames, chat bubbles, typing-dot particles, and online-presence silhouettes reflect on the glass and puddles, then dissolve.
- Scene 04: The emotional shift happens when the man appears in real life. He crosses into the frame with an umbrella, offers his jacket, stays beside her quietly, wipes fine drizzle from her hair, and gently holds her hand.
- Scene 05: At dawn, they sit together inside a quiet bus shelter. No kiss, no dramatic embrace, only a small shared silence, his jacket over her shoulders, hands held naturally, and a slow pull out toward the empty morning road.

## Character Lock

Female lead:
- Fictional Korean woman, 23 years old, reference-inspired by the provided female image: beautiful baby-face actress/model look, very long straight black hair with a clean center part, large glossy dark eyes, soft full lips, fair dewy skin, fragile but emotionally grown-up.
- Outfit: white oversized button-up shirt, modest underlayer, light-wash straight-leg jeans or beige wide-leg lounge trousers, clean white sneakers or cream flats; rain-speckled later but always fully opaque and modest.
- Prop: smartphone always visible until the emotional drop, then phone becomes inactive/off.

Male lead:
- Fictional Korean man, 25 years old, reference-inspired by the provided male image: handsome actor/model look, tousled black curtain-fringe hair, fair clean skin, sharp nose bridge, defined jawline, quiet presence, dark hoodie over black T-shirt, dark trousers, simple dark shoes.
- Appears through action, not performance: umbrella, jacket, sitting beside her, gently holding her hand.

Visual style:
- Korean ballad MV / K-drama romance mood, healing sadness, modern loneliness, glossy light-drizzle reflections, soft film grain, realistic skin, emotionally restrained acting.
- Lighting progression: cold blue phone light -> moonlit bedroom window bokeh -> Seoul-style neon light drizzle -> dreamy digital light fragments -> warm umbrella backlight -> early dawn softness.

## Korean Music Video Motif Lock

- Overall motif: premium Korean ballad MV, emotional but polished, like a 40s vertical music-video cut.
- Performance style: no lip-sync, no dance, no melodrama. Acting is quiet: eye movement, breath, hand hesitation, shoulder tension, slow turning.
- Visual language: blue bedroom loneliness, window reflection, lightly drizzle-streaked street, neon bokeh, fine slow-motion droplets, soft lens bloom, restrained close-ups, elegant pull-out ending.
- Color palette: midnight blue, soft cyan, muted magenta neon, warm amber shelter light, pale dawn blue.
- Editing feel: match cuts through phone light and wet-pavement drizzle reflections; digital overlays are abstract visual metaphors, not readable UI.
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

DRIZZLE/ENDING VARIANT: In light-drizzle scenes the shirt can be lightly rain-speckled but must remain fully opaque and modest. Keep the rain gentle and fine, not heavy, not stormy, and never soaking the clothing. In the ending, she may wear the male lead's plain dark jacket over her shoulders while the white shirt remains visible.

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

COMPLETE OUTFIT LOCK: Dark charcoal or deep navy simple hoodie layered over a plain black crew-neck T-shirt, relaxed fit, minimal texture, no logo, no visible brand. Outer layer for light-drizzle arrival scenes: plain dark lightweight jacket or overshirt that he can offer to the female lead later. Bottom: dark straight-leg trousers or black relaxed-fit jeans, clean silhouette, no ripped fabric. Shoes: simple black sneakers or dark leather casual shoes. Accessories: no jewelry, no hat, no bag, no visible brand. The outfit should make him look dependable, warm, understated, and believable for a drizzly night.

DRIZZLE/ENDING VARIANT: In light-drizzle scenes he carries a plain dark umbrella and may remove or offer the plain dark jacket to her; his base hoodie/T-shirt and dark trousers remain consistent. Keep the rain gentle and fine, not heavy, not stormy.

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
- From KF03 onward, the shirt can become lightly rain-speckled from a fine drizzle, but it must remain fully opaque and modest; its cut, collar, sleeve length, and fabric must stay consistent. No heavy rain, no storm, no soaked fabric.
- In KF06, the female may wear the male's dark jacket over her shoulders, but the white shirt must still be visible.
- MALE_REF outfit must stay dark, plain, and minimal across all appearances.
- The umbrella and jacket are practical story props, not fashion hero products.
- Do not add luxury branding, jewelry, hats, bags, new hairstyles, heavy makeup, or extra outfit changes.
- Preserve realistic Korean human features and avoid idol/glamour transformation between frames.

## Nano Banana Pro - Keyframe Image Prompts

### KF01 - 00:00 - Window Reflection Loneliness

```text
SUBJECT: Fictional Korean woman from FEMALE_REF, 23 years old, beautiful lead-actress look, long black hair, wearing the same white oversized button-up shirt, sitting on the floor beside a bedroom window while holding a smartphone near her chest; fragile but mature emotional expression.
ACTION: She looks at the dim phone without moving, hopeful but hurt; abstract promise-message shapes appear only as soft reflections on the window glass and slowly fade, with no readable text or UI.
FACING: 3/4 side profile facing the window, her face reflected faintly in the glass, eyes glossy with cold blue phone light.
LOCATION: Small modern bedroom at night, low bed partly visible behind her, sheer curtain, window glass reflecting distant Seoul-style city bokeh, lonely online-romance atmosphere.
CAMERA: Intimate close portrait through the window reflection, shallow depth of field, phone glow in the lower foreground, her reflected face and real face both softly visible.
LIGHTING: Cold blue phone glow on face, faint moonlit window edge light, very low ambient room light, soft lens bloom, subtle shadow falloff.
STYLE: Korean ballad MV romance, healing sadness, realistic skin texture, fine film grain, polished but natural, no logo, no watermark, no readable UI text, no camera gear.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF02 - 00:08 - Doorway Decision

```text
SUBJECT: Same fictional Korean woman from FEMALE_REF, same long black hair and white oversized shirt, standing at the bedroom doorway with the smartphone lowered in one hand.
ACTION: She has just decided to leave the room; her expression shifts from believing promises to quiet disappointment, shoulders slightly closed, one hand lightly touching the door frame.
FACING: 3/4 back-left angle, face turned slightly toward the dark room behind her, visible emotional withdrawal.
LOCATION: Same dark bedroom opening into a narrow apartment hallway, bed and window now behind her, soft city bokeh still faintly visible through the room.
CAMERA: Medium full-body doorway frame, slightly higher angle, elegant negative space, intimate handheld-feeling shot, face remains flattering.
LIGHTING: Cold bedroom phone light fading into blue-gray hallway shadows, soft grain, gentle rim light along her hair and shirt sleeve, no harsh highlights.
STYLE: Korean ballad MV breakup mood, restrained acting, clean beauty lighting, no readable phone text, no extra people, no visible camera equipment, no watermark.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF03 - 00:16 - Convenience Store Drizzle Isolation

```text
SUBJECT: Same fictional Korean woman from FEMALE_REF, long black hair lightly speckled by fine drizzle, wearing the same white oversized button-up shirt that remains fully opaque and modest, standing alone under a small convenience-store awning while holding her smartphone.
ACTION: She quietly waits for a reply that does not arrive; the phone screen is dim and abstract with no readable UI, no status icons, and no message text. Her expression is sad but calm, emotionally lonely without panic or danger.
FACING: Front-facing with slight 3/4 left body angle, head gently lowered toward the phone, shoulders closed but natural.
LOCATION: Fictional modern Korean side street at night, small convenience-store awning, vending-machine glow, wet pavement, neon reflections, blurred pedestrians passing behind her with phones.
CAMERA: Medium full-body frame from across the wet sidewalk, low eye-level perspective, foreground puddle reflection, very fine drizzle streaks visible beyond the awning, modest wardrobe readability preserved.
LIGHTING: Cool neon blue and magenta reflections mixed with soft convenience-store white light, damp streetlight glow, soft cinematic haze, flattering face light.
STYLE: Cinematic drizzle loneliness, slow-motion emotional realism, gentle social-era isolation, fully clothed adult character, no readable text, no UI symbols, no brand logos, no distorted fingers, no watermark, no unsafe distress, no heavy rain, no storm, no soaked clothing.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF04 - 00:24 - Bus Shelter Digital Reflection

```text
SUBJECT: Same fictional Korean woman from FEMALE_REF, hair lightly speckled by fine drizzle, white oversized shirt still fully opaque and modest, standing beside a bus shelter glass wall while ghostlike digital light fragments reflect around her.
ACTION: Abstract video-call frames, typing-dot-like light particles, and online-presence silhouettes appear on the shelter glass and puddles, then dissolve into soft pixel dust; she lowers the phone slightly and looks beyond the reflection.
FACING: 3/4 right-facing, body slightly turned toward the glass, eyes searching past the screen instead of looking into it.
LOCATION: Same fictional Korean side street, bus shelter glass wall, wet pavement, convenience-store glow behind her, blurred traffic continuity from the previous keyframe.
CAMERA: Wider medium shot through the bus shelter glass, layered foreground reflections and digital particles, shallow depth with bokeh street lights and lens bloom.
LIGHTING: Cold neon drizzle light mixed with faint phone glow, soft glitch highlights on reflected light shapes, flattering face light, wardrobe remains modest and readable.
STYLE: Korean ballad MV romance plus subtle digital-breakup effect, pixel dissolve, hologram-like abstract UI without readable text, realistic human anatomy, no watermark, no unsafe distress, no heavy rain, no storm, no soaked clothing.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF05 - 00:32 - He Crosses Into Her World

```text
SUBJECT: Same fictional Korean woman from FEMALE_REF, hair lightly speckled by fine drizzle and fully opaque white oversized shirt, now under a dark umbrella beside a handsome fictional Korean man from MALE_REF, 25 years old, wearing a dark simple hoodie or shirt.
ACTION: The man crosses in from the street side and quietly steps into her space, holding the umbrella over both of them. He offers his dark jacket with one hand, then gently wipes fine droplets from a strand of her hair before reaching toward her hand; her smartphone screen is off in her lowered hand.
FACING: Woman 3/4 left-facing toward him; man 3/4 right-facing toward her; both framed in a quiet shared moment.
LOCATION: Same bus shelter and convenience-store corner in a fine drizzle, wet pavement, soft neon reflections, night moving toward late-night calm.
CAMERA: Medium two-shot, eye-level, intimate Korean drama framing through the shelter glass, umbrella creates a protective frame above them, faces softly visible.
LIGHTING: Warm amber shelter backlight mixed with cool drizzle reflections, gentle rim light around hair and umbrella edge, emotional arrival moment, realistic damp textures.
STYLE: Healing Korean ballad romance, action-over-words, restrained tenderness, no kissing, no melodrama, no readable phone text, no logo, no watermark, no heavy rain, no storm, no soaked clothing.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

### KF06 - 00:40 - Dawn Shelter Hand Hold

```text
SUBJECT: Same fictional Korean woman in white oversized shirt with a dark jacket over her shoulders, sitting beside the same handsome quiet man in dark clothing inside the bus shelter near dawn.
ACTION: They sit close but restrained without kissing; their hands are gently held together on the bench between them, calm and real. She looks down at their hands, finally safe, while he looks toward the empty road.
FACING: Both mostly side-facing in a soft 3/4 inward angle; hands clearly visible but natural.
LOCATION: Quiet bus shelter at early dawn after a gentle drizzle, empty road, wet pavement, pale blue morning sky, faint convenience-store light fading behind them, Seoul-style city bokeh far away.
CAMERA: Medium-wide ending frame from outside the shelter glass, elegant long-lens composition, camera pulled back enough to show their small protected space and the quiet world around them.
LIGHTING: Soft dawn blue with warm shelter light residue, gentle highlights on wet ground and glass, peaceful emotional resolution, subtle lens bloom.
STYLE: Cinematic healing Korean ballad ending, realistic romance short-film texture, subtle film grain, no text, no logos, no watermark, natural hand anatomy.
ASPECT RATIO: 9:16 vertical TikTok frame.
```

## Veo 3 - Scene Prompts (Visual Action Only)

### Scene 01 - 00:00-00:08

Use first frame: KF01. Use last frame: KF02.

```text
Position: Center | Motion: Slow dolly in. Create an 8-second vertical visual scene from KF01 to KF02. Start on the female lead sitting beside the bedroom window, her face and phone glow doubled in the glass reflection. Abstract promise-message shapes appear only as soft non-readable reflections, then fade into empty blue room space. The camera slowly moves from the window reflection to her real face, then follows her quiet turn toward the bedroom doorway. Keep the same fictional Korean woman, same white oversized shirt, same bedroom, same smartphone, and the same restrained sad expression. Mood is lonely, healing, polished romantic sadness, with subtle handheld micro-shake, cold blue phone light, moonlit window bokeh, soft film grain, realistic skin texture, and a smooth continuous camera move. No readable UI text, no sudden cuts, no camera gear, no unsafe distress.
```

### Scene 02 - 00:08-00:16

Use first frame: KF02. Use last frame: KF03.

```text
Position: Center | Motion: Dolly out. Create an 8-second visual transition from KF02 to KF03. Begin with the woman standing at the bedroom doorway with the phone lowered, then use a smooth match-cut from the dark hallway edge into a convenience-store awning on a wet neon street under a fine drizzle. End with her alone beneath the awning, quietly waiting for a reply that does not arrive while blurred pedestrians pass behind her with phones. Preserve the same face, hair, white oversized shirt, light jeans, smartphone, and emotional continuity. Mood is quiet disappointment, abandoned trust, light-drizzle isolation, and restrained sadness; the scene should feel emotionally empty but beautiful, with cool neon reflections, soft convenience-store light, wet pavement glow, and fine slow-motion droplets. Wardrobe remains fully opaque and modest, and the camera movement stays smooth and restrained. No readable UI text, no hard cut, no unsafe distress, no heavy rain, no storm, no soaked clothing.
```

### Scene 03 - 00:16-00:24

Use first frame: KF03. Use last frame: KF04.

```text
Position: Left | Motion: Gentle orbit right. Create an 8-second light-drizzle street visual scene from KF03 to KF04. Start with the woman under the convenience-store awning holding the dim phone, then let the camera arc toward the nearby bus shelter glass. Abstract video-call frames, typing-dot-like particles, and online-presence silhouettes appear as reflections on the shelter glass and puddles, then dissolve into soft hologram dust. Keep all UI symbolic and non-readable. Mood is social-era loneliness, fragile hope fading, and the contrast between digital attention and real absence; the atmosphere should feel weightless, cold, and slightly surreal without becoming fantasy. End with the digital fragments thinning while she lowers the phone and looks beyond the glass in the fine drizzle. Preserve the same character identity, wardrobe opacity, natural anatomy, wet pavement reflections, and location continuity. No readable text, no logos, no sudden jump, no heavy rain, no storm, no soaked clothing.
```

### Scene 04 - 00:24-00:32

Use first frame: KF04. Use last frame: KF05.

```text
Position: Right | Motion: Slow dolly in. Create an 8-second visual action scene from KF04 to KF05. Begin with the woman beside the bus shelter glass while the remaining digital light fragments dissolve from the reflections. Her phone screen turns fully dark in her lowered hand. The male lead crosses in from the street side with a dark umbrella, steps into her space, covers both of them from the gentle drizzle, offers his dark jacket, softly wipes droplets from a strand of her hair, and gently reaches for her hand. Mood is sudden relief, quiet protection, and real presence arriving at the right moment; the emotional tone should shift from cold loneliness to warm shelter without becoming overly dramatic. Use warm shelter backlight mixed with cool wet-pavement reflections and soft drizzle rim light. Keep the action quiet, protective, realistic, and slow. No kiss, no melodrama, no readable phone text, no unsafe distress, no heavy rain, no storm, no soaked clothing.
```

### Scene 05 - 00:32-00:40

Use first frame: KF05. Use last frame: KF06.

```text
Position: Further | Motion: Slow dolly out. Create an 8-second visual ending scene from KF05 to KF06. Start with both characters sheltered together under the umbrella in a fine drizzle, then transition to the quiet dawn bus shelter. Keep the same characters, same wardrobe, and same emotional continuity. The man sits beside her in silence; she wears his dark jacket over her white shirt. They simply sit close with a small respectful distance, holding hands naturally on the bench between them. Mood is healing calm, quiet commitment, emotional safety, and the feeling of being chosen through action rather than words. Slowly pull back through the bus shelter glass to reveal the empty early-morning road, wet pavement reflections, pale blue dawn light, and soft city bokeh. No kiss, no text, no logo, no sudden scene jump, no heavy rain, no storm, no soaked clothing.
```

## Editor Notes

- Veo 3 scene prompts above are visual-action-only. Add captions, edit cuts, voice, and final timing in post-production, not inside the Veo prompt.
- Add exact phone-message copy in post-production as an overlay, not inside Nano Banana Pro image generation:
  - “Anh luôn ở đây”
  - “Tin anh nha”
  - “Anh không bỏ em đâu”
- Post-production caption/timing notes only, do not include these inside Veo prompt:
  - 00:00-00:08: cold blue bedroom, belief in promises
  - 00:08-00:16: fine drizzle, no reply, quiet loneliness
  - 00:16-00:24: online love dissolves into abstract digital light
  - 00:24-00:32: phone off, real person arrives, hand hold under umbrella
  - 00:32-00:40: dawn bus shelter, quiet commitment, calm visual ending
- If Veo struggles with the bedroom-to-rain transition in Scene 02, render it as a match-cut edit between two clips instead of asking Veo to transform location inside one generation.
