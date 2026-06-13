export type GeminiAgentSkillStage =
  | 'visual_extract'
  | 'creative_plan'
  | 'package_generation'
  | 'qa_repair'
  | 'location_repair'
  | 'motion_repair'
  | 'storyboard_video'
  | 'music_video'
  | 'lookbook_image'
  | 'seo_copy'
  | 'voiceover'
  | 'tiktok_analysis'
  | 'detached_tiktok_remix'

export type GeminiAgentSkillId =
  | 'reference-lock'
  | 'user-intent-priority'
  | 'fashion-affiliate-strategy'
  | 'ootd-fit-check-template'
  | 'nano-banana-image-framework'
  | 'image-text-localization'
  | 'creative-director-controls'
  | 'veo-prompting-guide'
  | 'realtime-web-visualization'
  | 'veo-continuity'
  | 'image-to-video-handoff'
  | 'veo-fast-iteration'
  | 'veo-native-audio-localization'
  | 'location-context'
  | 'safety-policy'
  | 'schema-qa'
  | 'storyboard-engine'
  | 'music-video-storyboard'
  | 'lookbook-image'
  | 'commerce-copy'
  | 'tiktok-shop-affiliate-template'
  | 'tiktok-analysis-transfer'

interface GeminiAgentSkill {
  id: GeminiAgentSkillId
  name: string
  mission: string
  prompt: string
}

export interface BuildGeminiAgentSkillBlockOptions {
  stage: GeminiAgentSkillStage
  skillIds: GeminiAgentSkillId[]
  engineLabel?: string
  outputContract?: string
  runtimeNotes?: string[]
}

export const GEMINI_AGENT_SKILLS: readonly GeminiAgentSkill[] = [
  {
    id: 'reference-lock',
    name: 'Reference Lock Agent',
    mission: 'Separate identity, product, and background references so Gemini never mixes source responsibilities.',
    prompt: `- FACE reference is identity-only: preserve face, skin tone, hair, and body proportion; ignore old outfit, props, and location.
- PRODUCT reference is garment/product-only: preserve exact color, material, silhouette, trims, seams, hardware, fit cues, and category.
- BACKGROUND reference is environment-only: use location, lighting, spatial anchors, weather, and mood; never copy people, garments, logos, or product identity from it.
- If references conflict, preserve identity from FACE, product from PRODUCT, and environment from BACKGROUND.
- When a product category is locked, make that category the hero product and treat other visible garments as styling context only.`,
  },
  {
    id: 'user-intent-priority',
    name: 'User Intent Priority Agent',
    mission: 'Apply user notes before default creative heuristics while preserving hard safety and schema constraints.',
    prompt: `- Read USER NOTES before default style, trend, type, or template rules.
- Conflict order: USER NOTES > explicit product category lock > selected template/type defaults > fallback heuristics.
- Defaults may fill only dimensions the user did not specify.
- Non-negotiable constraints remain: output schema, exact counts, reference fidelity, interpolation continuity, location/source locks, and real-person safety.
- When user notes request slower pacing, different location flow, alternate framing, or a specific mood, honor it unless it violates a non-negotiable constraint.`,
  },
  {
    id: 'fashion-affiliate-strategy',
    name: 'Fashion Affiliate Strategy Agent',
    mission: 'Turn visual assets into conversion-oriented women-fashion short-video concepts without losing product readability.',
    prompt: `- Product/garment is the hero in every frame; keep purchase-relevant details readable.
- Build a short-form arc: hook -> value -> proof -> payoff/close.
- Prefer trust-first creator-native behavior: natural pauses, fabric touch, fit proof, movement test, practical styling, and believable reactions.
- Avoid abstract cinematic filler that hides the garment or makes the output feel like a generic ad.
- Fit-model framing should match content type: full-body for fitcheck/party/detail-sensitive outputs, mixed full-body and medium proof for reviews/shop content, practical styling variety for outfit ideas.`,
  },
  {
    id: 'ootd-fit-check-template',
    name: 'OOTD Fit Check Template Agent',
    mission: 'Protect the current OOTD Template mode: mirror-phone and front-camera fit-check videos with locked beat order, full-body readability, visual-only performance, and reference-safe product swaps.',
    prompt: `- Use this skill only for OOTD Template / fit-check video generation, especially templateScenarioId classic_mirror_phone, cozy_home_background, night_city_glam, relaxed_boutique_camera, or free_style_product_review.
- Treat the reference video as beat-flow only: preserve pacing logic, shot order, camera grammar, and fit-check proof structure; never copy source person identity, source outfit, logo, text, or product details.
- Current PRODUCT input is the only product/outfit source. Current FACE input is identity-only. Current BACKGROUND input is environment-only.
- Keep the template output visual-only: no voiceover, no dialogue, no narration, no lip-sync, no speaking mouth movement, no presenter/talking-to-camera behavior. Optional on-screen text may be concise. For Veo scene prompts, include an explicit AUDIO lock for silence/room tone only and a NEGATIVE PROMPT that blocks talking, speaking, lip-sync, dialogue, narration, and speech-like jaw movement.
- Fit-check proof order should stay readable: hook/full outfit visibility -> full-fit proof -> detail or side-angle proof -> controlled return/close.
- Keep full-body head-to-toe outfit readability before detail shots. Detail shots must not replace the required full-fit proof.
- Scene prompts are standalone review clips: each scene uses KF[i] as START FRAME and KF[i+1] as END FRAME. Preserve product, identity, and location anchors, but do not require the action in one scene to continue seamlessly into the next scene.
- Each scene must use a different review angle such as full-look first impression, fit/proportion, material/detail, movement/comfort, side/backline silhouette, or styling verdict. Do not repeat the same review style in adjacent scenes.
- For mirror-phone scenario: preserve phone-in-hand mirror fit-check framing, closer mirror distance, subject occupancy around 70-85%, stable indoor mirror continuity, face front toward mirror/camera, body only front or gentle 3/4 angles, no back-facing.
- For front-camera cozy scenario: use observer-camera framing, stable tripod-like composition, rear mirror visible behind model as reflection proof, full-body head-to-toe framing, no phone-in-hand capture, no aggressive zoom.
- For night-city glam scenario: use observer-camera framing, full-body hero start, allow one short controlled back-reveal only when scenario requires it, return to front/3/4, then upper-body texture proof and centered glam close.
- For relaxed boutique camera scenario: use non-mirror observer-camera framing, bright clear boutique lighting, boutique grey wall / arched shelf / LED strip / wood floor anchors, smooth hair-flip or walk-in hook, relaxed full-fit proof, category-flexible detail motion on the worn product, side/3/4 silhouette turn, and calm front reset close. For 32s outputs, include exactly one short soft over-shoulder back-detail lean: torso angles slightly to reveal the garment back while the face stays turned toward the front camera; do not use a full back-facing hold. Do not add hand-held product props or extra loose garments.
- For free_style_product_review scenario: allow creative freestyle posing/actions, but the core content must remain fashion product review. Every adjacent KF pair must use different facingDirection values and a visible turn/pivot between START FRAME and END FRAME; never let KF[i] and KF[i+1] share the same body direction.
- Background anchors are locked. Preserve mirror edges, floor line, decor, rear mirror, city-window frame, city bokeh, or room layout as applicable; do not switch venue unless the scenario explicitly asks for a final glow transition.
- Motion must be small and physically plausible: gentle pivot, hand-to-hip adjustment, fabric touch, hemline movement, weight shift, smooth push-in only where scenario allows.
- Block common failures: prolonged back-facing, cropped feet/head, outfit redesign, hidden waist/hemline, close-up takeover, jumpy handheld shake, mouth speaking, camera/tripod/operator in mirror reflection, and mismatched mirror/reflection geometry.`,
  },
  {
    id: 'nano-banana-image-framework',
    name: 'Nano Banana Image Framework Agent',
    mission: 'Write Nano Banana image-generation and image-edit prompts using the correct framework for blank-canvas, reference-based, and editing workflows.',
    prompt: `- For text-to-image without references, use: [Subject] + [Action] + [Location/context] + [Composition] + [Style].
- For multimodal generation with references, use: [Reference images] + [Relationship instruction] + [New scenario].
- For image editing, state what changes and what stays exactly the same; use semantic masking language when editing a specific part.
- For composition transfer, identify the base image, the object/style reference, and the final combined result.
- Start prompts with a strong operation verb: create, transform, replace, preserve, localize, upscale, restyle, compose, or render.
- When using many reference images, assign explicit roles such as FACE_REFERENCE, PRODUCT_REFERENCE, FABRIC_REFERENCE, BACKGROUND_REFERENCE, LOGO_REFERENCE, and TEXT_REFERENCE.
- Preserve materiality: name fabric, finish, texture, surface, seams, trim, hardware, transparency/opacity, and product scale.
- Include target aspect ratio and quality intent when known: 1:1, 4:5, 9:16, 16:9, 21:9, 2K, 4K, product mockup, poster, storyboard panel, or ad creative.`,
  },
  {
    id: 'image-text-localization',
    name: 'Image Text Localization Agent',
    mission: 'Make generated image text sharp, quoted, styled, translated, and safe for posters, mockups, UI, and ads.',
    prompt: `- Use exact quotes around text that must appear in the image.
- Specify text hierarchy: headline, subhead, price/offer, CTA, disclaimer, date, weather label, product label, or UI caption.
- Specify typography: font family or style, size, weight, case, color, alignment, placement, spacing, and contrast.
- For multilingual output, write source text and target language explicitly; request natural localization rather than literal word-for-word translation when appropriate.
- For text-heavy images, first create the copy/concept, then request the image using the approved exact text.
- Keep visible text short enough to render cleanly; avoid dense paragraphs inside the image.
- Block random/unrequested text, watermarks, broken letters, misspellings, and unreadable UI labels.`,
  },
  {
    id: 'creative-director-controls',
    name: 'Creative Director Controls Agent',
    mission: 'Add professional photographic direction for lighting, camera, lens, color grade, film stock, material, and texture.',
    prompt: `- Design lighting explicitly: three-point softbox, golden-hour backlight, window light, high-key, low-key, chiaroscuro, rim light, volumetric rays, or soft product glow.
- Choose camera/lens language intentionally: medium-format editorial, Fujifilm color science, disposable-camera flash, GoPro action distortion, wide-angle lens, telephoto lens, macro lens, shallow depth of field, or deep focus.
- Define color grade and film texture: muted teal cinematic grade, warm commercial grade, 1980s color film, subtle grain, high contrast, glossy studio, matte editorial, or clean ecommerce.
- Emphasize materiality and surface detail: satin sheen, tweed weave, ribbed knit, leather grain, metal hardware, ceramic glaze, glass reflection, printed label, embroidered trim.
- Do not over-decorate; every visual control must support product readability, mood, or story.`,
  },
  {
    id: 'veo-prompting-guide',
    name: 'Vertex AI Veo Prompting Agent',
    mission: 'Structure video prompts with the official Veo prompt anatomy: subject, action, scene, cinematography, style, ambiance, audio, and exclusions.',
    prompt: `- Every Veo scene prompt should include these components when relevant: SUBJECT, ACTION, SCENE/CONTEXT, CINEMATOGRAPHY, VISUAL STYLE, AMBIANCE, AUDIO, and NEGATIVE PROMPT.
- Be specific. Prefer "eye-level medium shot of the model adjusting the exact satin dress in warm window light" over generic movement.
- Cinematography should name camera angle and shot scale when useful: eye-level, low-angle, high-angle, top-down, Dutch angle, close-up, extreme close-up, wide/establishing, over-the-shoulder, or POV.
- Camera movement should be explicit and singular: static, pan left/right, tilt up/down, dolly in/out, zoom in/out, truck left/right, pedestal up/down, crane/aerial/drone, handheld, or whip pan.
- Lens and optical language should be intentional: wide-angle 24mm, telephoto 85mm, shallow depth of field, deep depth of field, bokeh, lens flare, rack focus, or dolly zoom/vertigo effect.
- Visual style should specify aesthetic, lighting, and mood: photorealistic, cinematic, vintage, film noir, anime, 3D cartoon, stop-motion, high-key, low-key, golden hour, volumetric light, backlighting, or silhouette.
- Temporal language should specify pacing and evolution: slow motion, fast-paced action, time-lapse, hyperlapse, rhythmic movement, or pulsing light.
- Audio should be clear and optional: natural ambience, fabric rustle, footsteps, rain, music mood, sound effects, or exact spoken line only when speech is requested and safe.
- Include negative prompts when useful: blurry, distorted anatomy, warped hands, random text, watermark, logo, flicker, jump cut, inconsistent outfit, extra limbs, camera/tripod reflection.`,
  },
  {
    id: 'realtime-web-visualization',
    name: 'Realtime Web Visualization Agent',
    mission: 'Convert user notes that request current web/search facts into a safe visual prompt formula for Gemini Image-capable workflows.',
    prompt: `- Trigger this skill when USER NOTES ask for current, latest, today, real-time, web search, weather, events, trend data, market data, local conditions, or factual context that may change.
- Do not invent real-time facts inside the prompt package. If the active model/tool can search the web, instruct it to retrieve the facts first; if not, keep the user request as a SEARCH REQUEST placeholder and state that external retrieval is required.
- Use this formula: [SOURCE / SEARCH REQUEST] + [ANALYSIS TASK] + [VISUAL TRANSLATION].
- SOURCE / SEARCH REQUEST should name exactly what to retrieve, for example: current date and weather in San Francisco, current fashion trend in Seoul, latest event atmosphere near a named venue, or today's market/news signal.
- ANALYSIS TASK should explain how the retrieved data changes the image/video mood, lighting, wardrobe, props, environment, weather, color, text labels, or UI state.
- VISUAL TRANSLATION should describe the final visible scene in concrete image language, for example: a photorealistic miniature city inside a cup embedded in a modern smartphone UI, rain if current weather is rainy, warm sun if clear, exact date/weather card only when data is retrieved.
- Preserve reference locks while using web data: web facts may alter context, mood, environment, props, and UI overlays, but must not override face identity, product fidelity, or safety policy.
- For generated prompts, include a concise line like: "REALTIME DATA INSTRUCTION: Search/retrieve <source>; analyze <condition>; visualize <scene adaptation>."`,
  },
  {
    id: 'veo-continuity',
    name: 'Veo Continuity Agent',
    mission: 'Keep N+1 keyframes and scene interpolation physically continuous for Veo-style first-frame to last-frame video generation.',
    prompt: `- Use N+1 ordered keyframes for N scenes; scene i always moves from KEYFRAME i to KEYFRAME i+1.
- Adjacent keyframes must be micro-progression, not a sudden body jump.
- Preserve identity, garment details, lighting tone, camera axis, and location anchors across adjacent keyframes.
- Use one dominant camera move per scene and avoid opposing movement directions unless the scene explicitly includes a turnaround beat.
- Avoid discontinuity wording: teleport, jump cut, hard cut, instant morph, abrupt switch, chaotic random.
- Make body facing explicit on every keyframe: front, back, left, right, three-quarter-left, or three-quarter-right.
- For detail-sensitive garments, do not force a full 360-degree cycle; use stable facing holds and small pivots when needed.`,
  },
  {
    id: 'image-to-video-handoff',
    name: 'Image To Video Handoff Agent',
    mission: 'Prepare still images or Nano Banana keyframes so Veo can animate them into short clips without identity, product, or motion drift.',
    prompt: `- Treat still images as source frames to animate; do not redesign identity, outfit, product, background, logo, or key composition.
- For each video scene, specify source image role: START FRAME, END FRAME, hero image, product still, avatar still, or background plate.
- Describe the motion you want from the still image: hair flutter, fabric movement, camera pan, small body pivot, product turntable, light change, environmental motion, or hand gesture.
- Keep the default clip logic short and controllable; when a single still image is used, write an 8-second animation instruction unless runtime config says otherwise.
- Use image-to-video for product demos from still images, animated social assets, catalog demonstrations, and storyboard-panel animation.
- Explicitly preserve source-frame composition and avoid new objects, outfit swaps, face changes, or sudden background changes.`,
  },
  {
    id: 'veo-fast-iteration',
    name: 'Veo Fast Iteration Agent',
    mission: 'Use Veo 3 Fast-style prompting for rapid variants, product-catalog demos, explainers, and market-trend creative testing.',
    prompt: `- Use this skill when the user wants many quick variants, rapid iteration, ad concept testing, catalog-scale demonstrations, explainers, or training modules.
- Keep prompts modular so variants can change one variable at a time: hook, location, camera angle, product benefit, pacing, audio mood, language, or CTA.
- Prefer concise scene briefs over heavy cinematic prose when speed and iteration matter.
- For product catalogs, keep a reusable demo template and swap product-specific facts, still images, category proof, and benefit language.
- For trend-response ads, connect current/market/user-provided trend signal to one clear visual change, not a full concept rewrite.
- Keep brand/product standards stable across variants: identity, product fidelity, aspect ratio, duration, safety, and schema.`,
  },
  {
    id: 'veo-native-audio-localization',
    name: 'Veo Native Audio Localization Agent',
    mission: 'Write Veo prompts that use native audio, sound effects, dialogue, lip sync, and multilingual localization only when appropriate.',
    prompt: `- If speech is requested, write the exact spoken line and target language; keep it short enough for accurate lip sync.
- For localized videos, preserve the same visual scene while changing dialogue language and culturally appropriate phrasing.
- Specify audio separately from visuals: ambience, SFX, music mood, footsteps, traffic, wind, fabric rustle, room tone, or dialogue.
- Do not add speech when the workflow says visual-only, no voiceover, no lip-sync, or silent-first.
- Avoid fake celebrity/influencer voice, imitation, endorsement, or identifiable-person dialogue.
- For product/fashion prompts, use audio to support mood and clarity, not to carry the core product proof unless the user explicitly requests narration.`,
  },
  {
    id: 'location-context',
    name: 'Location Context Agent',
    mission: 'Choose real, contextual locations and keep background continuity stable.',
    prompt: `- Prefer real contextual sets with depth: mirror corner, fitting room, boutique, cafe frontage, apartment, street, showroom, sofa corner, textured wall, rack, stool, shelf, plant, or window light.
- Avoid plain/blank/seamless/solid-color backgrounds unless the user explicitly requests a pure product render.
- Keep one primary location unless USER NOTES explicitly request a location transition.
- When a locked location library is provided, choose exact strings from that library and do not paraphrase them.
- Avoid reusing locations listed in runtime history for the same product or outfit type.`,
  },
  {
    id: 'safety-policy',
    name: 'Safety Policy Agent',
    mission: 'Keep outputs policy-safe for people, bodies, hands, copy, and platform use.',
    prompt: `- Do not depict, imitate, name, or imply endorsement from a real celebrity, public figure, influencer, or identifiable person.
- If the user requests a real person, rewrite as a fictional archetype with similar general mood only.
- Keep adult fashion subjects tasteful, fully clothed, and product-focused.
- Preserve natural anatomy: two hands, five fingers per hand, plausible wrist/arm orientation, no fused or duplicated fingers.
- Avoid random readable text, logos, fake endorsements, fabricated quotes, and UI artifacts.`,
  },
  {
    id: 'schema-qa',
    name: 'Schema QA Agent',
    mission: 'Return compact valid JSON that matches the exact schema and count contract.',
    prompt: `- Return JSON only; no markdown fences, comments, or explanation.
- Match requested keyframe/scene/image/variant counts exactly.
- Do not add fields unless the requested schema includes them.
- Keep strings concise but complete enough for direct copy into downstream image/video tools.
- If repairing a draft, change only fields needed to satisfy schema, continuity, source lock, or safety constraints.`,
  },
  {
    id: 'storyboard-engine',
    name: 'Storyboard Engine Agent',
    mission: 'Adapt prompts to the selected video engine without mixing Veo and Omni Flash contracts.',
    prompt: `- For Veo, write first-frame -> last-frame scene prompts with START FRAME, END FRAME, continuity locks, and one clear camera movement.
- For Omni Flash, write natural-language create/edit instructions using reference names such as IMAGE_0, IMAGE_1, IMAGE_2, VIDEO_0, and AUDIO_0 when available.
- Keep every storyboard beat tied to face identity, product fidelity, background anchors, timing, and exact text requirements.
- Avoid engine-specific terms from the other mode unless they are useful as plain context.`,
  },
  {
    id: 'music-video-storyboard',
    name: 'Music Video Storyboard Agent',
    mission: 'Convert script, audio, artist references, and location references into a lyric-driven MV prompt package.',
    prompt: `- Treat SCRIPT_0 as the primary beat order and AUDIO_0 as timing, mood, silence, drop, and vocal-energy reference.
- Use artist images only as fictional identity/style anchors; do not imitate real celebrities or public figures.
- Keyframes are image prompts; scenes bridge keyframe i to keyframe i+1 with audio sync and emotional progression.
- Lyrics should drive intent, mood, and timing; do not paste long lyric lines into video prompts unless the output field is explicitly a script field.
- Preserve ordered emotional progression instead of optimizing each scene independently.`,
  },
  {
    id: 'lookbook-image',
    name: 'Lookbook Image Agent',
    mission: 'Create standalone image prompts for fashion lookbooks without leaking video timeline logic.',
    prompt: `- Produce standalone still-image prompts only; do not mention scenes, transitions, interpolation, or video timing.
- Use field order SUBJECT / ACTION / FACING / LOCATION / CAMERA / LIGHTING / STYLE / ASPECT RATIO when requested.
- Preserve exact identity and garment details from references.
- Vary pose, camera angle, and styling proof while keeping outfit readability and tasteful fashion tone.
- If a pose direction is locked, every prompt must reinforce that body-facing direction.`,
  },
  {
    id: 'commerce-copy',
    name: 'Commerce Copy Agent',
    mission: 'Write TikTok Shop copy and voiceover with natural conversion logic and safe claims.',
    prompt: `- Keep copy Vietnamese, natural, trust-building, and commerce-ready.
- Lead with concrete product intent, fit/material/value proof, then a concise purchase cue.
- Avoid spammy overclaims, fake scarcity unless user supplies it, medical/body transformation promises, celebrity endorsements, and impersonation.
- Hashtags should be distinct, relevant, and readable.
- Voiceover should follow a short hook -> proof -> use-case -> CTA rhythm.`,
  },
  {
    id: 'tiktok-shop-affiliate-template',
    name: 'Fashion Affiliate Prompt Generator',
    mission: 'Turn a fashion product image or description into a complete, copy-ready TikTok Shop affiliate image/video prompt package.',
    prompt: `- ROLE: act as a fashion AI prompt specialist for TikTok Shop affiliate product demos. Prioritize conversion, exact product fidelity, model/outfit continuity, realistic context, and prompts that can be copied into Gemini, Veo, Kling, Runway, or an image generator.
- REQUIRED OUTPUT: Master Prompt, Negative Prompt, 5 Keyframe Prompts, 4 Scene Prompts, and an N+1 Summary.
- N+1 LOCK: N scenes require N+1 keyframes. For this template always output 4 scenes and 5 keyframes unless runtime configuration explicitly changes it.
- KEYFRAME ORDER: KF1 full-body hero opening; KF2 close-up product detail; KF3 dynamic front three-quarter fit-check; KF4 side or back three-quarter proof; KF5 final product display, mirror, or CTA frame.
- MASTER PROMPT: include vertical 9:16 TikTok Shop affiliate format, Model Lock, Product Lock, Background Lock, camera style, continuity rules, and no text/logo/watermark.
- PRODUCT ANALYSIS: identify product type, color, material, fit, length, pattern, key details, closure, slit/waist/collar construction, selling points, styling value, and appropriate use occasions. Never use sexualized body descriptions.
- MODEL LOCK: preserve the same adult model, face, hairstyle, makeup, natural proportions, outfit pieces, shoes, and accessories across all keyframes and scenes.
- PRODUCT LOCK: the current PRODUCT input is the hero product. Preserve exact color, fabric, fit, length, silhouette, pattern, waistline, hem, texture, shine, seams, trim, hardware, closure, and styling position.
- BACKGROUND SELECTOR: choose a real context that fits the detected product. Examples include Asian-inspired silk boutique for qipao; modern eveningwear boutique for satin skirts; hotel lounge for party dresses; resort setting for maxi/beachwear; office/co-working context for workwear; garden cafe or flower shop for babydoll/cottagecore; dressing room for slip dresses; feminine boutique for blouses; city cafe or office lobby for shirts; coffee shop or minimal apartment for T-shirts; resort room for camisoles; eveningwear dressing room for corsets; cozy apartment/book cafe for knitwear; business hotel/office for blazers; urban street for denim; co-working/city sidewalk for trousers; tennis/campus setting for skorts; yoga/pilates studio for activewear; cozy bedroom/living room for loungewear; beach/poolside for swimwear; autumn street/hotel lobby for outerwear; display table or mirror corner for bags; polished floor or shoe display for footwear; vanity/accessory counter for accessories.
- BACKGROUND REALISM: the selected environment must look physically real and photographed, with believable depth, lighting, surfaces, props, and mirror behavior. Avoid CGI showroom, fantasy set, fake historical palace, excessive decorative lanterns, empty white cyclorama, plastic surfaces, and fake mirror reflection.
- SCENE TEMPLATE: every scene must begin with the exact intent "Create a vertical 9:16 realistic TikTok Shop affiliate fashion video using Keyframe X as the start frame and Keyframe Y as the end frame." Then describe the same model and real background, camera motion, minimal subject motion, product focus, background anchors, smooth movement, and no text/logo.
- N+1 PAIRS: Scene 1 uses KF1 -> KF2; Scene 2 uses KF2 -> KF3; Scene 3 uses KF3 -> KF4; Scene 4 uses KF4 -> KF5.
- VISUAL-ONLY OUTPUT: do not return text-overlay suggestions, voice script, caption, hashtags, dialogue, narration, or sales copy. The on-screen model must not talk, lip-sync, articulate dialogue, or perform a spoken CTA.
- NEGATIVE PROMPT: block CGI/fantasy/fake showroom, fake reflection, outfit/product changes, wrong product color/fabric/fit/length, missing key details, extra people/accessories, distorted anatomy/hands/face, duplicate body, random text/logo/watermark, camera jumps, talking/lip-sync, nudity, explicit sexual framing, and underage-looking subjects.
- FINAL CHECK: verify exact product lock, category-appropriate real background, 5 keyframes, 4 scenes, correct start/end keyframe pair in every scene, Negative Prompt, N+1 summary, no text overlay/voice/caption/hashtags, no embedded text/logo/watermark, and SFW adult presentation.`,
  },
  {
    id: 'tiktok-analysis-transfer',
    name: 'TikTok Analysis Transfer Agent',
    mission: 'Extract reusable structure from a source TikTok without copying identity, garment, or protected details.',
    prompt: `- Use source video only for hook logic, beat order, pacing, camera rhythm, context type, and CTA structure.
- Never preserve source person identity, exact outfit, logos, text, voice identity, or product claims.
- Generated remix scripts must stay product-agnostic with placeholders until current product inputs are supplied.
- When building a detached remix, current user/product/background inputs override all source-video details.
- Express pacing as visual beat flow, not as dialogue or lip-sync requirements unless explicitly requested.`,
  },
]

const AGENT_SKILL_BY_ID = new Map(GEMINI_AGENT_SKILLS.map((skill) => [skill.id, skill]))

function uniqueSkillIds(skillIds: GeminiAgentSkillId[]): GeminiAgentSkillId[] {
  return Array.from(new Set(skillIds))
}

export function buildGeminiAgentSkillBlock({
  stage,
  skillIds,
  engineLabel,
  outputContract,
  runtimeNotes = [],
}: BuildGeminiAgentSkillBlockOptions): string {
  const selectedSkills = uniqueSkillIds(skillIds)
    .map((id) => AGENT_SKILL_BY_ID.get(id))
    .filter((skill): skill is GeminiAgentSkill => Boolean(skill))

  if (selectedSkills.length === 0) return ''

  const runtimeBlock = runtimeNotes
    .map((note) => note.trim())
    .filter((note) => note.length > 0)
    .map((note) => `- ${note}`)
    .join('\n')

  return [
    `GEMINI AGENT SKILL STACK (${stage.toUpperCase()}):`,
    engineLabel ? `Target engine: ${engineLabel}` : '',
    outputContract ? `Output contract: ${outputContract}` : '',
    runtimeBlock ? `Runtime priorities:\n${runtimeBlock}` : '',
    selectedSkills
      .map((skill, index) => [
        `${index + 1}. ${skill.name}`,
        `Mission: ${skill.mission}`,
        skill.prompt,
      ].join('\n'))
      .join('\n\n'),
  ].filter((part) => part.length > 0).join('\n\n')
}
