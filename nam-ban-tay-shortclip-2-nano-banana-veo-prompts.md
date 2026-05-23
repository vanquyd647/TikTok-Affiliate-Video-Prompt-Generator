# Nắm Bàn Tay - Shortclip 2 - Nano Banana Pro Image Prompts + Veo 3 Scene Prompts

Source files:
- Script: `Kịch bản shortclip 2 - Nắm bàn tay - Trang tính1.csv`
- Audio mood reference: `NẮM BÀN TAY_BC2.wav`
- Character image reference: `a505c0583fb1dcf532ed7e6fbe6dd8f6.jpg`
- Prompt mode: visual storyboard only, using action, mood, camera, lighting, and continuity. Do not include sung lines inside image or video prompts.

Production logic:
- Output ratio: vertical TikTok 9:16
- Audio length detected locally: ~28.03s
- Target video structure: 4 scenes x 8s = 32s, 5 keyframe images
- Timing note: the last ~4s can be used as a slow visual tail / instrumental hold / edit fade so the 28s audio mood still breathes naturally inside a 32s visual cut.
- Sad-song pacing lock: each 8s scene should feel slow and held, with only one main action plus micro-expression. Avoid rushing through many events inside one scene.
- Veo flow: each video scene uses `first frame = KF[i]` and `last frame = KF[i+1]`
- Main continuity lock: same female lead, same after-work outfit, same smartphone, emotional progression from long workday loneliness to silent bus-ride healing.
- Text safety: avoid relying on AI-generated readable phone text. Use abstract notification glow, red battery sliver, blank UI shapes, and post-production overlays if needed.
- Weather lock: only light drizzle / mưa lất phất from KF03 onward. No heavy rain, no storm, no soaked clothing.
- No visible camera crew, no production gear, no logos, no watermark, no random extra hands, no distorted fingers.

## Script Visual Flow - 5 Keyframes / 4 Scenes

- Scene 01 / KF01 -> KF02: after work, city lights begin, a long day follows her through the street; the phone notification glows then fades into emotional silence.
- Scene 02 / KF02 -> KF03: the red light holds the traffic and her unsaid words; fine drizzle begins, the phone battery becomes a tiny red sliver and the screen goes dark.
- Scene 03 / KF03 -> KF04: the dark phone reflection becomes the bus window; she boards the bus and sits alone, carried through roads and memories.
- Scene 04 / KF04 -> KF05: instrumental ending; the bus keeps moving, her grip relaxes, and her reflection blends into the night road as the long day passes.

## Audio Mood Lock From WAV

- Local timing: ~28.03s total, expanded into a 32s visual cut with four 8s Veo scenes for smoother motion.
- Energy shape: steady emotional ballad texture, gently building through the middle, strongest around the bus-window scene, then softening into a 4s visual tail.
- Mood: after-work fatigue, city loneliness, quiet disappointment, small emotional collapse, then soft acceptance.
- Visual rhythm: very slow sad-ballad pacing, no fast action, no dance, no lip-sync. Use long held looks, delayed reactions, gentle camera drift, reflections, and small hand movements.
- Color progression: office warm white -> blue city dusk and phone glow -> red traffic light with cool drizzle gray -> amber bus interior -> pale night reflection.

## Character Lock

Female lead:
- Fictional adult Korean woman, 23 years old, reference-inspired by the provided image only, not an exact copy of any real person.
- Appearance: exceptionally beautiful soft actress/model look, long wavy dark brown-black hair, fair luminous skin, large gentle dark eyes, soft natural brows, delicate nose, soft rose lips, graceful neck, slim natural body proportion.
- Emotional presence: beautiful but tired after a long day, fragile without being childish, quiet and emotionally mature.
- Outfit inspired by the reference image but adapted for an after-work city story: office-appropriate soft cream pleated midi dress or cream pleated skirt with a simple white blouse, pale pink knit cardigan, small delicate necklace, simple cream flats or white low-top shoes. It should feel gentle and feminine but still believable for leaving work. No visible brand, no logo, no flashy jewelry.
- Prop: one modern smartphone with a plain dark or cream case, visible in every scene until it goes dark.

Visual style:
- Korean romance short-film / city ballad mood, gentle sadness, urban loneliness, soft reflections, realistic skin texture, subtle film grain, restrained acting.
- Location palette: office lobby dusk, crosswalk red light, wet pavement, light drizzle, bus window reflections, warm bus interior, quiet night city.
- Safety/continuity: fictional adult character, fully clothed, modest wardrobe, no celebrity imitation, no readable text, no unsafe distress.

## Master Character + Outfit Prompt

Use this first to create a stable character reference before generating the keyframes.

### MASTER FEMALE_REF_SHORTCLIP2 - Main Female Character + Outfit

```text
Create a clean model reference image for FEMALE_REF_SHORTCLIP2 only.

REFERENCE PURPOSE: This image is only for locking the sample female model's face, body proportion, hair, and after-work outfit before generating story keyframes. Use the provided female image as appearance inspiration only; create a fictional adult Korean model with similar visual traits, not an exact copy of any real person. Do not include a phone, office, street, rain, bus, or narrative scene.

SUBJECT: A fictional Korean woman, 23 years old, exceptionally beautiful and photogenic like a lead actress/model in a premium Korean romance short film. Appearance inspired by the provided female reference image: long softly wavy dark brown-black hair, airy face-framing volume, fair luminous skin, large gentle dark eyes, soft natural eyebrows, delicate refined nose, soft rose-pink lips, graceful jawline, slim natural body proportion, calm fragile presence.

BEAUTY DETAIL: Beautiful at first glance but believable: soft symmetrical features, bright emotional eyes, clear dewy skin, delicate nose bridge, naturally pretty lips, graceful neck, gentle feminine charm. She should feel fresh and cinematic, not plastic, not exaggerated, not influencer-glam.

HAIR + MAKEUP: Long softly wavy dark brown-black hair, natural volume, side-swept or soft center-part styling, polished but natural. Minimal Korean-style makeup: dewy skin, subtle blush, soft rose lips, clean lashes, no heavy contour, no dramatic lashes.

COMPLETE OUTFIT LOCK: Office-appropriate soft cream pleated midi dress or cream pleated skirt with a simple white blouse, layered with a pale pink knit cardigan inspired by the provided image. Outfit must look modest, gentle, feminine, and believable for leaving work in the evening, not a party outfit, not a casual pajama look. Add a small delicate necklace only if needed. Shoes: simple cream flats or clean white low-top shoes. Optional small neutral work tote only in walking/office-exit shots, no visible brand, no text, no logo.

POSE: Neutral standing full-body model reference pose, arms relaxed naturally, soft tired expression, shoulders slightly lowered from a long day but still elegant.

CAMERA: Full-body character reference, head-to-toe visible, 9:16 vertical frame, centered composition, simple neutral gray or white studio background, sharp face and outfit readability.

LIGHTING: Soft flattering cinematic studio light, realistic skin texture, gentle shadow, clean outfit readability.

STYLE: Clean reference photo, realistic Korean romance short-film character design, appearance inspired by the provided image but not identical to any real person, consistent facial identity, natural anatomy, no logo, no watermark, no readable text, no distorted hands, no extra fingers, no camera gear, no over-glamour retouching.
```

### Outfit Continuity Rules For All Keyframes

- FEMALE_REF_SHORTCLIP2 face, hair, body proportion, and outfit must remain consistent from KF01 to KF05.
- The pale pink cardigan and cream outfit are the visual identity of this version.
- From KF03 onward, cardigan and hair can become lightly speckled by fine drizzle, but clothing must remain modest, opaque, and not soaked.
- The smartphone must stay plain, no readable UI, no brand logo.
- Do not add extra jewelry, hats, bags, or major outfit changes.

## Nano Banana Pro - Keyframe Image Prompts

### KF01 - 00:00 - After-Work Exit

```text
SCENE INTENT: After work, city lights begin, she carries the weight of a long day through the street.
SUBJECT: Fictional Korean woman from FEMALE_REF_SHORTCLIP2, 23 years old, beautiful soft actress look, long wavy dark hair, wearing the same office-appropriate cream pleated outfit and pale pink knit cardigan, stepping out of an office building after work while holding a smartphone at her side. Optional small neutral work tote in her other hand.
ACTION: She exits the glass office lobby slowly while the city starts to turn on its evening lights; people pass around her quickly as motion blur, making her feel emotionally separate from the crowd and visibly tired from the day.
FACING: Back 3/4 view with her head slightly turned to the side, tired profile visible.
LOCATION: Modern office building entrance at early evening, glass doors, warm lobby light behind her, blue city dusk outside, pedestrians moving past.
CAMERA: Tracking shot from behind at shoulder height, handheld gentle movement, medium full-body frame, vertical TikTok composition.
LIGHTING: Warm office light behind her, cool blue dusk ahead, soft reflection on glass, cinematic grain.
STYLE: Korean city ballad mood, after-work fatigue, quiet loneliness, restrained acting, realistic skin and fabric texture, no logo, no watermark, no readable text, no camera gear.
ASPECT RATIO: 9:16 vertical frame.
```

### KF02 - 00:08 - Held Still Under The Red Light

```text
SCENE INTENT: The red light holds traffic in place and also holds back the words she cannot say. She has been walking sadly and aimlessly through the city, then stops as if the whole street has paused her.
SUBJECT: Same fictional Korean woman from FEMALE_REF_SHORTCLIP2, same office-appropriate cream outfit and pale pink cardigan, standing alone at a busy crosswalk with her smartphone held low near her chest.
ACTION: She stands almost completely still under the red traffic light while cars, pedestrians, couples, and small groups move around her as soft background motion. Her phone gives only a faint abstract glow, then quiets. She does not rush, does not pace, and does not step quickly; only a small tired shift of weight and a delayed look down at the phone.
FACING: High wide 3/4 front view from above the crosswalk, her eyes lowered and distant, red traffic glow faintly reflected on her face.
LOCATION: Busy city crosswalk at nightfall, red traffic light glow, car headlights, wet-looking asphalt reflections, evening pedestrians flowing around her.
CAMERA: High center wide framing with strong negative space around her, holding long enough to show the city moving on while she remains emotionally frozen.
LIGHTING: Red traffic signal glow, blue city dusk, white headlights, faint phone glow, soft lens bloom on wet pavement.
STYLE: Very slow sad-song stillness, held-back confession, aimless street sadness, emotional isolation inside a crowd, no rushed energy, no readable UI, no readable signs, no logos, no watermark, no distorted fingers.
ASPECT RATIO: 9:16 vertical frame.
```

### KF03 - 00:16 - Phone Falls Into Darkness

```text
SCENE INTENT: Weak battery pulls the phone into darkness, and her last small connection disappears without drama.
SUBJECT: Same fictional Korean woman from FEMALE_REF_SHORTCLIP2, hair and pale pink cardigan lightly speckled by fine drizzle, still alone on the city sidewalk near the crosswalk with the smartphone resting in her hand.
ACTION: The phone screen shows only an abstract tiny red battery sliver shape, with no readable numbers and no readable UI, then fades fully black. She lowers the phone a little and goes quiet, not panicked, just quietly defeated. Her movement stays minimal and slow, as if she is too tired to decide where to go next.
FACING: Quiet phone close-up in her hand, her face behind it in shallow focus, eyes lowered and unfocused.
LOCATION: City sidewalk beside the crosswalk, red traffic light glow behind her, fine drizzle beginning gently, wet pavement and blurred streetlights.
CAMERA: Intimate vertical close-up on the phone hand, with her face softly visible behind it; shallow depth of field, no sudden rack or fast move.
LIGHTING: Tiny abstract red battery glow fading to black, cool drizzle reflections, red traffic signal spill, soft streetlight rim on her hair.
STYLE: Small emotional collapse, quiet aimless street sadness, not panic, not danger; fine drizzle only, no heavy rain, no storm, no soaked clothing, no readable numbers, no readable UI, no logo, no watermark.
ASPECT RATIO: 9:16 vertical frame.
```

### KF04 - 00:24 - Bus Window Loneliness

```text
SCENE INTENT: The bus carries her through roads and memories, but she rides alone.
SUBJECT: Same fictional Korean woman from FEMALE_REF_SHORTCLIP2, same outfit, sitting alone by the window inside a city bus, smartphone dark in her lap.
ACTION: She looks out the window as the city slides past; reflections of streetlights and passing cars move across her face like remembered routes. She sits small and alone, letting the road carry her forward.
FACING: Side profile facing the bus window, hands resting around the dark phone in her lap.
LOCATION: City bus interior at night, warm amber seat lights, window covered with soft reflections, damp street outside.
CAMERA: Medium close-up from aisle side, long-lens compression through bus window reflections, gentle motion blur outside.
LIGHTING: Warm bus interior light mixed with cool blue reflections from outside, soft film grain, emotional peak of the short.
STYLE: Korean city ballad mood, lonely bus ride, road-memory feeling, restrained sadness, realistic skin texture, no readable route signs, no logos, no watermark.
ASPECT RATIO: 9:16 vertical frame.
```

### KF05 - 00:32 - Night Road Instrumental Fade

```text
SCENE INTENT: Instrumental ending; no new event, only the bus moving and the long day finally passing.
SUBJECT: Same fictional Korean woman from FEMALE_REF_SHORTCLIP2 seen as a soft reflection in the bus window, same outfit and pale pink cardigan, face calm and distant, dark phone no longer visually important.
ACTION: She slowly relaxes her grip on the phone in her lap. The bus continues forward through the city; her reflection blends with passing streetlights, suggesting the long day finally passing and the silence becoming less painful.
FACING: Reflection profile on the glass, not direct camera address, eyes no longer on the phone.
LOCATION: Same city bus interior at night, mostly empty seats, road lights outside, quiet city movement.
CAMERA: Wider bus interior frame from outside/through the glass, shallow depth, slow pull back, cinematic negative space.
LIGHTING: Warm amber bus light fading into pale blue road reflections, soft bokeh, subtle lens bloom, gentle final glow.
STYLE: Instrumental emotional release, healing quiet ending, restrained Korean romance short-film texture, no dramatic crying, no readable text, no logo, no watermark, natural hand anatomy.
ASPECT RATIO: 9:16 vertical frame.
```

## Veo 3 - Scene Prompts (Visual Action Only)

### Scene 01 - 00:00-00:08

Use first frame: KF01. Use last frame: KF02.

```text
Position: Behind to soft side close-up | Motion: Very slow tracking, almost floating. Create an 8-second vertical visual scene from KF01 to KF02 with sad-ballad pacing. Follow the intent of after-work fatigue, city lights beginning, and a message glow turning silent. Start behind the female lead as she exits the office building after work; hold for a moment on her slow steps while pedestrians pass quickly as soft motion blur. Do not rush to the next location. The phone glows quietly near her chest near the end of the scene, then fades into a blank screen as the camera settles on her tired side profile. Mood is long-day fatigue, quiet disappointment, and the feeling of a familiar screen becoming strange. Keep the same woman, same office-appropriate cream outfit, same pale pink cardigan, same smartphone, no readable UI, no logos, no sudden cuts.
```

### Scene 02 - 00:08-00:16

Use first frame: KF02. Use last frame: KF03.

```text
Position: High center to quiet phone close-up | Motion: Slow push down with long hold. Create an 8-second visual scene from KF02 to KF03 with a very slow sad-song rhythm, absolutely no rushed or hurried feeling. Follow the intent of the red light holding traffic, unsaid words being held back, and weak battery pulling the phone into darkness. Start with a high wide view of the crosswalk and hold for a long quiet beat: cars, pedestrians, and small groups move around her as soft background motion while she stays still under the red light, looking like she has been walking sadly and aimlessly through the city with nowhere certain to go. Her body movement is minimal and slow, no fast steps, no anxious pacing, no hurry; only a small tired shift of weight and a delayed look down to the phone. Fine drizzle begins gently but stays subtle, just enough to soften the red traffic glow and wet pavement reflections. Only in the final part, drift down slowly toward her phone hand as the abstract red battery sliver fades fully black. Mood is held-back words, quiet aimless street sadness, small emotional collapse, and the city moving on without her. Fine drizzle only, no heavy rain, no storm, no readable battery numbers, no readable UI, no unsafe distress.
```

### Scene 03 - 00:16-00:24

Use first frame: KF03. Use last frame: KF04.

```text
Position: Close right to bus-window reflection | Motion: Slow lateral slide with soft dissolve. Create an 8-second visual scene from KF03 to KF04 with restrained pacing. Follow the intent of the screen going dark and the lonely bus ride beginning. Begin by holding on the dark phone in her hand under the awning, with fine drizzle visible beyond her. She lowers the phone slowly and takes a quiet breath. Use a soft match dissolve from the dark phone surface into the dark bus window rather than showing every step of boarding. End with her already seated alone by the window, city reflections moving across her face. Mood is small emotional collapse turning into quiet movement forward. Keep wardrobe modest and dry except for light drizzle speckles. No readable route signs, no heavy rain, no storm, no soaked clothing, no logos.
```

### Scene 04 - 00:24-00:32

Use first frame: KF04. Use last frame: KF05.

```text
Position: Aisle side to further | Motion: Gentle dolly back, very slow. Create an 8-second instrumental ending scene from KF04 to KF05 with the slowest pacing of the video. Follow the intent of being carried through roads and memories while riding alone, then letting the day pass. Start with her sitting alone by the bus window, dark phone in her lap, city reflections moving across her face like remembered routes. Hold on her stillness. Her hand relaxes around the phone only slightly, almost imperceptibly. Slowly pull back until her face becomes a soft reflection blended with passing city lights. Mood is the emotional peak and release of the short: lonely but no longer sharp, tired but beginning to settle, quiet acceptance. Preserve the same character identity, same outfit, hand anatomy, warm bus interior light, cool blue window reflections, no readable route signs, no text, no logos, no sudden scene jump.
```

## Editor Notes

- Prompts above are visual-action-only. Add captions, edit cuts, voice, and final timing in post-production, not inside the Veo prompt.
- If the phone UI is needed, add it later as an overlay. Inside image/video generation, keep it abstract: notification glow, blank screen, red battery sliver, no readable text or numbers.
- Suggested edit timing:
  - 00:00-00:08: office exit, city lights, phone glow fades
  - 00:08-00:16: red light, held-back words, weak battery goes dark
  - 00:16-00:24: fine drizzle, bus transition, lonely window seat
  - 00:24-00:32: bus window loneliness, instrumental drift, night-road healing
