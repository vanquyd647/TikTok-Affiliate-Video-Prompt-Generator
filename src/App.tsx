import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, Image as ImageIcon, Sparkles, Film, Camera, Clock,
  Copy, Check, Download, X, Eye, EyeOff, Clapperboard,
  Layers, ArrowRight, Wand2, FileText, AlertCircle, Ratio,
  Shirt, Star, TrendingUp, MessageSquare, Palette
} from 'lucide-react'
import './index.css'

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════
interface KeyframePrompt {
  index: number
  timestamp: string
  subject: string
  action: string
  location: string
  camera: string
  lighting: string
  style: string
  fullPrompt: string
}

interface ScenePrompt {
  index: number
  timeRange: string
  narrative: string
  startPose: string
  endPose: string
  cameraMovement: string
  fullPrompt: string
}

interface GenerateResult {
  masterDNA: string
  keyframes: KeyframePrompt[]
  scenes: ScenePrompt[]
  createImagePrompt?: string
}

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════
const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash', label: '2.5 Flash', tag: 'Stable' },
  { value: 'gemini-3-flash-preview', label: '3.0 Preview', tag: 'Experimental' },
  { value: 'gemma-4-31b-it', label: 'Gemma 4 31B', tag: 'Gemini API' },
  { value: 'gemma-4-26b-a4b-it', label: 'Gemma 4 26B A4B', tag: 'Gemini API' },
] as const

const DURATIONS = [
  { value: 24, label: '24s', scenes: 3, keyframes: 4 },
  { value: 32, label: '32s', scenes: 4, keyframes: 5 },
  { value: 40, label: '40s', scenes: 5, keyframes: 6 },
  { value: 48, label: '48s', scenes: 6, keyframes: 7 },
] as const

const ASPECT_RATIOS = [
  { value: '9:16', label: '9:16', desc: 'TikTok' },
  { value: '16:9', label: '16:9', desc: 'YouTube' },
] as const

const CONTENT_TYPES = [
  { value: 'ootd', label: 'OOTD', icon: Shirt, desc: 'Outfit of the Day', color: 'var(--accent-pink)' },
  { value: 'grwm', label: 'GRWM', icon: Star, desc: 'Get Ready With Me', color: 'var(--accent-purple)' },
  { value: 'fyp', label: 'FYP', icon: TrendingUp, desc: 'For You Page', color: 'var(--accent-cyan)' },
  { value: 'review', label: 'Review', icon: MessageSquare, desc: 'Product Review', color: 'var(--accent-emerald)' },
] as const

type ContentType = typeof CONTENT_TYPES[number]['value']

// ═══════════════════════════════════════════════
// PROMPT ENGINE — N+1 Algorithm
// ═══════════════════════════════════════════════

// TikTok Beat Structure per content type
const SCENE_BEATS_MAP: Record<ContentType, Array<{ name: string; emoji: string; cameraHint: string }>> = {
  ootd: [
    { name: 'OUTFIT REVEAL HOOK', emoji: '👗', cameraHint: 'Slow dolly/push-in revealing the full outfit' },
    { name: 'DETAIL SHOWCASE', emoji: '✨', cameraHint: 'Close-up tilt from hemline to neckline, highlighting fabric and cut' },
    { name: 'STYLING MOMENT', emoji: '💫', cameraHint: 'Smooth lateral tracking, model adjusting accessories' },
    { name: 'FULL LOOK FINALE', emoji: '🔥', cameraHint: 'Crane/pedestal shot showing complete styled outfit' },
    { name: 'CONFIDENCE WALK', emoji: '🌟', cameraHint: 'Dynamic tracking shot, model walking with attitude' },
    { name: 'ICONIC POSE CLOSER', emoji: '🎬', cameraHint: 'Slow-motion final pose with dramatic backlight' },
  ],
  grwm: [
    { name: 'COZY MORNING HOOK', emoji: '☀️', cameraHint: 'Warm close-up of model waking/stretching naturally' },
    { name: 'SKINCARE RITUAL', emoji: '🧴', cameraHint: 'Intimate framing, soft lighting showing routine' },
    { name: 'MAKEUP TRANSFORMATION', emoji: '💄', cameraHint: 'Eye-level tracking, before-after transition' },
    { name: 'OUTFIT SELECTION', emoji: '👗', cameraHint: 'Medium shot at wardrobe, choosing outfit' },
    { name: 'FINAL GLAM REVEAL', emoji: '✨', cameraHint: 'Slow push-in on completed look' },
    { name: 'READY TO GO', emoji: '🎬', cameraHint: 'Confident walk-out with cinematic farewell' },
  ],
  fyp: [
    { name: 'SCROLL-STOPPING HOOK', emoji: '🎯', cameraHint: 'Dramatic slow-mo entrance or unexpected angle' },
    { name: 'AESTHETIC MOMENT', emoji: '💫', cameraHint: 'Smooth lateral tracking, dreamy atmosphere' },
    { name: 'VIRAL TRANSITION', emoji: '🔥', cameraHint: 'Snap transition with camera whip or zoom' },
    { name: 'SAVE-WORTHY FINALE', emoji: '✨', cameraHint: 'Cinematic slow dolly out, ethereal vibes' },
    { name: 'TREND MOMENT', emoji: '🌟', cameraHint: 'Dynamic 180° arc with energy burst' },
    { name: 'EPIC CLOSER', emoji: '🎬', cameraHint: 'Slow-motion final pose with backlight' },
  ],
  review: [
    { name: 'PRODUCT UNBOXING HOOK', emoji: '📦', cameraHint: 'Close-up hands unboxing, ASMR-style reveal' },
    { name: 'FIRST IMPRESSION', emoji: '😍', cameraHint: 'Model reaction shot, genuine excitement' },
    { name: 'DETAIL INSPECTION', emoji: '🔍', cameraHint: 'Macro close-up on fabric, stitching, material quality' },
    { name: 'TRY-ON MOMENT', emoji: '👗', cameraHint: 'Full body try-on, spinning showcase' },
    { name: 'HONEST VERDICT', emoji: '⭐', cameraHint: 'Eye-level talking head, honest expression' },
    { name: 'FINAL RECOMMENDATION', emoji: '🎬', cameraHint: 'Happy model with product, call-to-action framing' },
  ],
}

// Content-type-specific location sets (based on TikTok VN/global trends)
const KEYFRAME_LOCATIONS_MAP: Record<ContentType, string[]> = {
  ootd: [
    'Trendy Saigon coffee shop with industrial brick walls and warm pendant lights',
    'Clean white apartment bedroom with full-length mirror and soft window light',
    'Vibrant urban sidewalk with graffiti murals and leafy street trees at golden hour',
    'Minimalist studio with neutral backdrop, soft ring light, and polished concrete floor',
    'Rooftop terrace bar overlooking city skyline at sunset',
    'Fashion boutique dressing room with soft ambient lighting and clothing racks',
    'Modern co-working lobby with glass walls and tropical indoor plants',
  ],
  grwm: [
    'Bright bathroom vanity with round LED mirror and organized skincare bottles',
    'Cozy bedroom with messy white sheets, warm morning sunlight through sheer curtains',
    'Walk-in closet with organized clothing racks and shoe shelves, warm LED strip lights',
    'Vanity table with ring light, makeup palettes spread out, soft pink ambient glow',
    'Floor-length mirror in a minimalist bedroom, natural daylight flooding in',
    'Elegant dressing table with flowers, perfume bottles, and warm candlelight',
    'Modern bathroom with marble countertop, plant decor, and soft diffused lighting',
  ],
  fyp: [
    'Dramatic abandoned warehouse with dusty sunbeams cutting through high windows',
    'Neon-lit Saigon alley at night with rain-wet reflections and moody atmosphere',
    'Dreamy lavender field at golden hour with soft bokeh and lens flare',
    'Sleek black studio with single spotlight creating dramatic chiaroscuro',
    'Futuristic mirrored corridor with infinite reflections and cool blue tones',
    'Iconic Hoi An lantern street at twilight, warm orange glow from lanterns',
    'Art museum staircase with geometric patterns and natural skylight',
  ],
  review: [
    'Clean desk setup with product packaging, camera gear, and soft daylight',
    'Bright living room with neutral sofa, natural window light for true color',
    'Simple white backdrop studio for product-focused unboxing content',
    'Cozy bed flat-lay setup with the product, accessories, and styled props',
    'Well-lit fitting room with neutral walls and consistent fluorescent lighting',
    'Home studio with ring light, camera on tripod, clean background',
    'Outdoor park bench in soft shade for natural, authentic feeling',
  ],
}

// Content-type-specific actions (based on real TikTok viral poses/transitions)
const KEYFRAME_ACTIONS_MAP: Record<ContentType, string[]> = {
  ootd: [
    'Standing with weight on back foot, one hand on hip, chin slightly raised — confident "outfit check" pose',
    'Mid-stride runway walk toward camera, arms swinging naturally, eyes looking straight ahead with attitude',
    'Slow 360° spin showing all outfit angles, arms slightly extended, fabric flowing with movement',
    'Leaning against wall with crossed ankles, one hand adjusting collar, relaxed cool-girl energy',
    'Hand reaching toward camera covering the lens — transition pose for outfit change magic',
    'Power stance facing camera, feet shoulder-width apart, hands adjusting belt/waistband to show fit',
    'Walking away from camera showing back view, head turned over shoulder with half-smile glance',
  ],
  grwm: [
    'Sitting at vanity, both hands patting skincare product onto cheeks, eyes closed peacefully',
    'Leaning toward mirror applying lip gloss, concentrated expression, soft morning light on face',
    'Standing in front of open closet, holding two hangers comparing outfits, playful thinking expression',
    'Pulling on the garment over head/stepping into skirt — authentic dressing moment',
    'Adjusting hair in mirror, tucking strand behind ear, checking final look from multiple angles',
    'Final confident pose at door — bag in hand, looking back at camera with "ready to go" smile',
    'Close-up hands buttoning shirt or clasping necklace — detail-focused getting ready moment',
  ],
  fyp: [
    'Dramatic slow-motion hair flip with wind effect, face emerging from shadow into light',
    'Snap fingers triggering instant outfit transformation — frozen mid-snap with sparks energy',
    'Ethereal floating pose with arms gently raised, fabric billowing, dreamy soft-focus atmosphere',
    'Sharp head turn from profile to front-facing, intense eye contact, editorial fierceness',
    'Backward lean against wind, coat flying open revealing outfit underneath, cinematic tension',
    'Dance-inspired body roll from head to toe, each section highlighting a different outfit element',
    'Jump freeze-frame at peak height, hair suspended, outfit details visible in mid-air',
  ],
  review: [
    'Hands carefully opening product packaging, pulling tissue paper aside to reveal garment',
    'Holding garment up next to face for size reference, genuine surprised/excited expression',
    'Close-up hands stretching fabric to show quality, turning garment to display stitching details',
    'Full body front-facing try-on, smoothing down the garment, adjusting fit naturally',
    'Turning to show side profile in the garment, pointing to specific features like pocket or cut',
    'Talking Head — facing camera at eye level, gesturing while giving honest review/verdict',
    'Happy final pose in the product, double thumbs-up or heart gesture, genuine recommendation smile',
  ],
}

// TikTok-optimized camera setups
const CAMERA_SETUPS = [
  { lens: '35mm', shot: 'Full body shot', angle: 'Slightly low angle (makes model look taller)', movement: 'Slow push-in' },
  { lens: '50mm', shot: 'Medium shot waist-up', angle: 'Eye level, intimate framing', movement: 'Smooth lateral tracking' },
  { lens: '85mm', shot: 'Detail close-up', angle: 'Slight high angle for accessories/fabric', movement: 'Slow pan from shoes to head' },
  { lens: '35mm', shot: 'Full body shot', angle: 'Low angle, hero perspective', movement: 'Camera walking backward as model approaches' },
  { lens: '50mm', shot: 'Medium full shot', angle: 'Eye level, centered composition', movement: 'Static on tripod, subject moves' },
  { lens: '24mm', shot: 'Wide environmental shot', angle: 'Eye level, showing full backdrop', movement: 'Slow dolly out revealing location' },
  { lens: '85mm', shot: 'Portrait close-up', angle: 'Eye level, shallow depth of field', movement: 'Gentle orbit around subject' },
]

// Lighting is aligned by location index to avoid indoor/outdoor mismatch.
const KEYFRAME_LIGHTING_MAP: Record<ContentType, string[]> = {
  ootd: [
    'Warm window key light from coffee shop side windows, subtle amber practicals from pendant lights, clean skin tones and true garment color',
    'Natural daylight from bedroom window, soft fill bounce from white walls, low-contrast flattering portrait look',
    'Golden-hour side backlight outdoors with gentle reflector fill on face, vivid but realistic fabric color separation',
    'Studio ring light as frontal key with soft top fill, clean neutral shadows for an indoor lookbook frame',
    'Sunset rim light on rooftop with warm front-left key fill, city ambient glow adding depth to silhouette',
    'Soft boutique ambient lighting with diffused key from fitting-room mirror, texture-friendly highlights on fabric',
    'Daylight filtered through glass lobby facade with balanced indoor fill from floor reflections, crisp modern fashion tone',
  ],
  grwm: [
    'Vanity LED mirror used as soft key, gentle warm fill reducing under-eye shadows while preserving natural skin texture',
    'Morning sunlight through sheer curtains as side key, cozy low-contrast fill for intimate bedroom atmosphere',
    'Warm wardrobe strip lights mixed with neutral overhead fill, accurate color rendering for outfit choices',
    'Ring light as centered key with soft ambient pink bounce, clean beauty-vlog look without harsh shadows',
    'Natural daylight near floor mirror with subtle bounce fill from wall, realistic full-look skin and fabric tones',
    'Warm candle practicals in background with soft key from front-left, elegant getting-ready mood and depth',
    'Diffused bathroom daylight with marble bounce fill, even complexion and clear garment texture detail',
  ],
  fyp: [
    'High-contrast warehouse shafts of sunlight with atmospheric haze, dramatic highlights and cinematic shadow falloff',
    'Neon cyan-magenta ambient from alley signs with controlled warm key on face, moody but readable fashion details',
    'Golden-hour field backlight with gentle frontal bounce, dreamy bloom while preserving silhouette definition',
    'Single hard spotlight in black studio with negative fill, crisp editorial contrast and sculpted facial planes',
    'Cool blue corridor practicals with mirrored edge reflections, controlled highlights for futuristic depth layering',
    'Twilight lantern practicals as warm key sources with soft ambient night fill, rich orange cinematic glow',
    'Natural skylight from museum ceiling with soft side fill, elegant tonal separation and architectural depth',
  ],
  review: [
    'Soft daylight from desk-side window with neutral bounce card fill, accurate product color and texture fidelity',
    'Even living-room window light with low-contrast fill, trustworthy natural review look for face and garment',
    'Clean two-softbox white backdrop setup, shadow-controlled and detail-focused for unboxing clarity',
    'Bedside window daylight with gentle top fill, cozy editorial review tone while retaining material detail',
    'Consistent fitting-room fluorescent key balanced with neutral fill, stable true-to-product color rendering',
    'Ring light key with soft side fill in home studio, clear eye contact and reliable fabric detail visibility',
    'Open-shade outdoor daylight with subtle front reflector, natural skin tones and honest product presentation',
  ],
}

function buildCharacterDNA(notes: string, contentType: ContentType): string {
  const styleMap: Record<ContentType, string> = {
    ootd: 'Professional fashion editorial, OOTD TikTok, cinematic quality',
    grwm: 'Lifestyle vlog aesthetic, warm and intimate GRWM style',
    fyp: 'Trending viral aesthetic, high-fashion editorial with cinematic flair',
    review: 'Authentic product review style, natural lighting, trustworthy feel',
  }
  return `[FACE PRESERVATION]: The model's face must be rendered with exact, hyper-realistic photographic likeness based on the provided face reference image.
[GARMENT PRESERVATION]: The garment from the product reference image must be preserved EXACTLY — no redesign, no reinterpretation. Prioritize intricate details.
[BODY]: Real human female model, tall ~175cm, porcelain skin with hyper-realistic texture.
[STYLE]: ${styleMap[contentType]}.
[CONTENT TYPE]: ${contentType.toUpperCase()} — ${CONTENT_TYPES.find(c => c.value === contentType)?.desc}
${notes ? `[CUSTOM NOTES]: ${notes}` : ''}`
}

function buildCreateImagePrompt(contentType: ContentType, notes: string): string {
  const contentDesc: Record<ContentType, string> = {
    ootd: 'OOTD (Outfit of the Day) — full outfit showcase with front and back views',
    grwm: 'GRWM (Get Ready With Me) — warm lifestyle aesthetic showing complete look',
    fyp: 'FYP (For You Page) — viral trending aesthetic with dramatic fashion presentation',
    review: 'Product Review — authentic product showcase highlighting garment quality and details',
  }

  return `Create a vertical portrait product promotional image (9:16 aspect ratio) for ${contentDesc[contentType]}.

[FACE]: Use the provided face reference image. Preserve EXACT facial features — bone structure, eye shape, lip fullness, skin undertone. Ultra-realistic photographic likeness. No artistic interpretation.

[GARMENT]: Use the provided product reference image. Reproduce the EXACT garment — every stitch, button, fabric fold, color gradient, and pattern must match the original. No redesign allowed.

[BODY]: Real human female model, approximately 175cm tall. Natural hourglass proportions with porcelain skin. Hyper-realistic skin texture — visible pores, subtle freckles, natural skin variation.

[COMPOSITION]: Split-screen layout:
• LEFT 50%: Full-body FRONT VIEW — model facing camera at slight 3/4 angle, confident posture, one hand on hip
• RIGHT 50%: Full-body BACK VIEW — model turned away, head slightly turned over shoulder

[LIGHTING]: Soft studio lighting with warm golden key light from upper left (45° angle). Fill light from right to eliminate harsh shadows. Subtle rim light creating separation from background.

[BACKGROUND]: Clean gradient backdrop — warm cream to soft taupe, matching the ${contentType.toUpperCase()} aesthetic.

[STYLE]: Professional fashion e-commerce photography. ${contentType === 'review' ? 'Authentic and trustworthy feel.' : 'High-end editorial quality.'} Shot on Sony A7R IV, 85mm f/1.4 lens, ISO 100.

[TEXT OVERLAYS]: 
• Product name label at top center (clean sans-serif typography)
• "FRONT" label under left view, "BACK" label under right view
• Size/material callouts with thin leader lines pointing to key garment details

${notes ? `[CUSTOM NOTES]: ${notes}` : ''}

CRITICAL: This image will be used as a reference for Veo 3.1 video generation. Ensure consistent proportions and realistic rendering suitable for frame-by-frame animation.`
}

function generateKeyframePrompts(
  keyframeCount: number,
  durationSec: number,
  aspectRatio: string,
  notes: string,
  contentType: ContentType = 'ootd'
): KeyframePrompt[] {
  const keyframes: KeyframePrompt[] = []
  const sceneInterval = durationSec / (keyframeCount - 1)
  const locations = KEYFRAME_LOCATIONS_MAP[contentType]
  const actions = KEYFRAME_ACTIONS_MAP[contentType]
  const lightings = KEYFRAME_LIGHTING_MAP[contentType]
  const localLocationIdx = 0

  for (let i = 0; i < keyframeCount; i++) {
    const timestamp = `${Math.round(i * sceneInterval)}s`
    const locIdx = localLocationIdx
    const actIdx = i % actions.length
    const camIdx = i % CAMERA_SETUPS.length

    const cam = CAMERA_SETUPS[camIdx]
    const subject = `[facePreservation from reference]`
    const action = actions[actIdx]
    const location = locations[locIdx]
    const camera = `${cam.shot}, ${cam.lens} lens, ${cam.angle}. Movement: ${cam.movement}`
    const lighting = lightings[locIdx % lightings.length]
    const style = 'Professional fashion editorial'

    const fullPrompt = `SUBJECT: ${subject}. ACTION: ${action}. LOCATION: ${location}. CAMERA: ${camera}. LIGHTING: ${lighting}. STYLE: ${style}. ASPECT RATIO: ${aspectRatio}. ${notes ? `NOTES: ${notes}` : ''}`

    keyframes.push({
      index: i,
      timestamp,
      subject,
      action,
      location,
      camera,
      lighting,
      style,
      fullPrompt,
    })
  }

  return keyframes
}

function generateScenePrompts(
  keyframes: KeyframePrompt[],
  sceneCount: number,
  durationSec: number,
  aspectRatio: string,
  contentType: ContentType = 'ootd'
): ScenePrompt[] {
  const scenes: ScenePrompt[] = []
  const sceneDuration = durationSec / sceneCount
  const beats = SCENE_BEATS_MAP[contentType]

  for (let i = 0; i < sceneCount; i++) {
    const startSec = Math.round(i * sceneDuration)
    const endSec = Math.round((i + 1) * sceneDuration)
    const timeRange = `${startSec}s-${endSec}s`

    const beat = beats[i % beats.length]
    const startKF = keyframes[i]
    const endKF = keyframes[i + 1]

    const narrative = `${beat.name}. ${beat.cameraHint}. The model transitions smoothly from the starting pose to the ending pose over ${endSec - startSec} seconds. Consistent warm cinematic lighting maintained throughout. Fashion garment stays in focus with fabric physics visible during movement.`

    const fullPrompt = `${beat.emoji} ${narrative}
START_POSE [KF${i + 1}]: ${startKF.action}
END_POSE [KF${i + 2}]: ${endKF.action}
CAMERA: ${beat.cameraHint}
ASPECT_RATIO: ${aspectRatio}
CONTENT_TYPE: ${contentType.toUpperCase()}
DURATION: 8 seconds
FORMAT: Veo 3.1 first-frame → last-frame interpolation`

    scenes.push({
      index: i,
      timeRange,
      narrative,
      startPose: startKF.action,
      endPose: endKF.action,
      cameraMovement: beat.cameraHint,
      fullPrompt,
    })
  }

  return scenes
}

// ═══════════════════════════════════════════════
// AI-ENHANCED GENERATION (via Gemini API)
// ═══════════════════════════════════════════════
async function generateWithGemini(
  apiKey: string,
  model: string,
  faceImage: string | null,
  productImage: string | null,
  duration: number,
  aspectRatio: string,
  notes: string,
  contentType: ContentType = 'ootd'
): Promise<GenerateResult> {
  const durationInfo = DURATIONS.find(d => d.value === duration)!
  const { scenes: sceneCount, keyframes: keyframeCount } = durationInfo

  // Build the master prompt for Gemini
  const systemPrompt = `You are an expert AI video prompt engineer specializing in TikTok affiliate fashion videos (OOTD, FYP). 

Your task: Generate a COMPLETE prompt package for a ${duration}-second video with:
- ${keyframeCount} keyframe image prompts (n+1 algorithm: ${sceneCount} scenes need ${keyframeCount} images)
- ${sceneCount} scene prompts for Veo 3.1 (first-frame → last-frame video generation, 8s each)
- Aspect ratio: ${aspectRatio}

CRITICAL RULES:
1. Each scene is exactly 8 seconds, using Veo 3.1's first-frame + last-frame interpolation
2. Keyframe images must be SEAMLESSLY CONNECTED: the last frame of scene N = first frame of scene N+1
3. Character identity must be PERFECTLY CONSISTENT across all keyframes (use Character DNA)
4. Product/garment must be EXACTLY preserved from reference image
5. Follow TikTok viral structure: Hook (0-3s) → Value → Proof → CTA
6. Infer location, lighting, camera mood, and styling directly from the provided reference images (face + garment) instead of generic preset randomness
7. Keep scene context coherent across the timeline; only change location when there is a clear narrative transition

${notes ? `USER NOTES: ${notes}` : ''}

Output as JSON with this exact structure:
{
  "masterDNA": "character consistency description",
  "keyframes": [
    {
      "index": 0,
      "timestamp": "0s",
      "subject": "face preservation instruction",
      "action": "pose/movement description",
      "location": "setting/background",
      "camera": "lens, shot type, angle",
      "lighting": "lighting setup",
      "style": "photography style"
    }
  ],
  "scenes": [
    {
      "index": 0,
      "timeRange": "0s-8s",
      "narrative": "scene description with TikTok beat",
      "startPose": "starting keyframe pose",
      "endPose": "ending keyframe pose",
      "cameraMovement": "camera movement description"
    }
  ]
}`

  // Build content parts
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (faceImage) {
    const base64 = faceImage.split(',')[1] || faceImage
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      }
    })
    parts.push({ text: 'This is the FACE REFERENCE image. Preserve this exact face in all keyframes.' })
  }

  if (productImage) {
    const base64 = productImage.split(',')[1] || productImage
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      }
    })
    parts.push({ text: 'This is the PRODUCT/GARMENT REFERENCE image. Preserve this exact garment in all keyframes.' })
  }

  parts.push({ text: systemPrompt })

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.85,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 300)}`)
    }

    const data = await response.json()
    const candidateParts = data?.candidates?.[0]?.content?.parts
    const textParts = Array.isArray(candidateParts)
      ? candidateParts
        .filter((part: any) => typeof part?.text === 'string' && part.text.trim().length > 0)
        .map((part: any) => part.text.trim())
      : []

    const mergedText = textParts.join('\n').trim()
    if (!mergedText) {
      throw new Error('Gemini returned empty content')
    }

    const parseJsonFromText = (raw: string) => {
      const stripCodeFence = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      const tryParse = (value: string) => {
        try {
          return JSON.parse(value)
        } catch {
          return null
        }
      }

      const direct = tryParse(stripCodeFence)
      if (direct && typeof direct === 'object') return direct

      const start = stripCodeFence.indexOf('{')
      const end = stripCodeFence.lastIndexOf('}')
      if (start >= 0 && end > start) {
        const extracted = stripCodeFence.slice(start, end + 1)
        const extractedParsed = tryParse(extracted)
        if (extractedParsed && typeof extractedParsed === 'object') return extractedParsed
      }

      throw new Error(`Could not parse JSON from Gemini response: ${stripCodeFence.slice(0, 240)}`)
    }

    const parsed = parseJsonFromText(mergedText)

    const rawKeyframes = Array.isArray(parsed.keyframes) ? parsed.keyframes : []
    const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : []

    if (rawKeyframes.length !== keyframeCount || rawScenes.length !== sceneCount) {
      throw new Error(
        `Gemini returned unsynchronized package (keyframes: ${rawKeyframes.length}/${keyframeCount}, scenes: ${rawScenes.length}/${sceneCount})`
      )
    }

    const toSafeString = (value: unknown, fallback: string) => {
      if (typeof value !== 'string') return fallback
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : fallback
    }

    const templateKeyframes = generateKeyframePrompts(
      keyframeCount,
      duration,
      aspectRatio,
      notes,
      contentType
    )
    const templateScenes = generateScenePrompts(
      templateKeyframes,
      sceneCount,
      duration,
      aspectRatio,
      contentType
    )

    // Build full prompts for each keyframe and scene
    const keyframes: KeyframePrompt[] = rawKeyframes.map((kf: any, i: number) => {
      const template = templateKeyframes[i]
      const subject = toSafeString(kf.subject, '[facePreservation from reference]')
      const action = toSafeString(kf.action, template?.action || KEYFRAME_ACTIONS_MAP[contentType][i % KEYFRAME_ACTIONS_MAP[contentType].length])
      const location = toSafeString(kf.location, template?.location || KEYFRAME_LOCATIONS_MAP[contentType][0])
      const camera = toSafeString(kf.camera, template?.camera || `${CAMERA_SETUPS[i % CAMERA_SETUPS.length].shot}, ${CAMERA_SETUPS[i % CAMERA_SETUPS.length].lens} lens`)
      const lighting = toSafeString(kf.lighting, template?.lighting || KEYFRAME_LIGHTING_MAP[contentType][0])
      const style = toSafeString(kf.style, template?.style || 'Professional fashion editorial')

      return {
        index: i,
        timestamp: `${Math.round((i * duration) / (keyframeCount - 1))}s`,
        subject,
        action,
        location,
        camera,
        lighting,
        style,
        fullPrompt: `SUBJECT: ${subject}
ACTION: ${action}
LOCATION: ${location}
CAMERA: ${camera}
LIGHTING: ${lighting}
STYLE: ${style}
ASPECT RATIO: ${aspectRatio}`,
      }
    })

    const scenes: ScenePrompt[] = rawScenes.map((sc: any, i: number) => {
      const template = templateScenes[i]
      const startSec = Math.round((i * duration) / sceneCount)
      const endSec = Math.round(((i + 1) * duration) / sceneCount)
      const startPose = keyframes[i]?.action || toSafeString(sc.startPose, '')
      const endPose = keyframes[i + 1]?.action || toSafeString(sc.endPose, '')
      const narrative = toSafeString(
        sc.narrative,
        template?.narrative || `${SCENE_BEATS_MAP[contentType][i % SCENE_BEATS_MAP[contentType].length].name}. The model transitions smoothly between matched keyframes over ${endSec - startSec} seconds.`
      )
      const cameraMovement = toSafeString(
        sc.cameraMovement,
        template?.cameraMovement || SCENE_BEATS_MAP[contentType][i % SCENE_BEATS_MAP[contentType].length].cameraHint
      )

      return {
        index: i,
        timeRange: `${startSec}s-${endSec}s`,
        narrative,
        startPose,
        endPose,
        cameraMovement,
        fullPrompt: `${narrative}
START_POSE [KF${i + 1}]: ${startPose}
END_POSE [KF${i + 2}]: ${endPose}
CAMERA: ${cameraMovement}
ASPECT_RATIO: ${aspectRatio}
DURATION: 8 seconds
FORMAT: Veo 3.1 first-frame → last-frame interpolation`,
      }
    })

    return {
      masterDNA: parsed.masterDNA || buildCharacterDNA(notes, contentType),
      keyframes,
      scenes,
    }
  } catch (error: any) {
    throw new Error(error?.message || 'Gemini generation failed')
  }
}

// ═══════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════
function resizeImage(dataUrl: string, maxSize = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// ═══════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy">
      {copied ? <Check /> : <Copy />}
    </button>
  )
}

function ImageUploader({
  label,
  image,
  onImageChange,
  isPasteTarget,
  onActivatePasteTarget,
  icon: Icon,
}: {
  label: string
  image: string | null
  onImageChange: (img: string | null) => void
  isPasteTarget: boolean
  onActivatePasteTarget: () => void
  icon: React.ElementType
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = e.target?.result as string
      const resized = await resizeImage(result)
      onImageChange(resized)
    }
    reader.readAsDataURL(file)
  }, [onImageChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    onActivatePasteTarget()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile, onActivatePasteTarget])

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!isPasteTarget) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) handleFile(file)
        break
      }
    }
  }, [handleFile, isPasteTarget])

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div
        className={`image-upload-zone ${dragging ? 'dragging' : ''} ${image ? 'has-image' : ''}`}
        onClick={() => { onActivatePasteTarget(); inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {image ? (
          <>
            <img src={image} alt={label} className="image-preview" />
            <button
              className="image-remove-btn"
              onClick={(e) => { e.stopPropagation(); onImageChange(null) }}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <Icon className="image-upload-icon" />
            <span className="image-upload-text">Click hoặc kéo thả ảnh</span>
            <span className="image-upload-hint">Hỗ trợ paste (Ctrl+V)</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          onActivatePasteTarget()
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function Timeline({
  keyframeCount,
  sceneCount,
}: {
  keyframeCount: number
  sceneCount: number
}) {
  const nodes = []
  for (let i = 0; i < keyframeCount; i++) {
    nodes.push(
      <div key={`kf-${i}`} className="timeline-node">
        <div className="timeline-dot active" />
        <span className="timeline-label">KF{i + 1}</span>
      </div>
    )
    if (i < sceneCount) {
      nodes.push(
        <div key={`sc-${i}`} className="timeline-connector" data-label={`Scene ${i + 1}`} />
      )
    }
  }

  return <div className="timeline">{nodes}</div>
}

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  // State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('aff_api_key') || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [model, setModel] = useState(() => localStorage.getItem('aff_model') || 'gemini-2.5-flash')
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [productImage, setProductImage] = useState<string | null>(null)
  const [pasteTarget, setPasteTarget] = useState<'face' | 'product'>('face')
  const [duration, setDuration] = useState(24)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16')
  const [contentType, setContentType] = useState<ContentType>('ootd')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [activeTab, setActiveTab] = useState<'keyframes' | 'scenes' | 'all' | 'image'>('keyframes')

  // Persist settings
  useEffect(() => { localStorage.setItem('aff_api_key', apiKey) }, [apiKey])
  useEffect(() => { localStorage.setItem('aff_model', model) }, [model])

  // Derived
  const durationInfo = DURATIONS.find(d => d.value === duration)!
  const canGenerate = apiKey.trim().length > 0

  // Generate handler
  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      if (!apiKey.trim()) {
        throw new Error('Vui long nhap Gemini API Key de AI phan tich anh va tao boi canh')
      }

      const res = await generateWithGemini(
        apiKey, model, faceImage, productImage, duration, aspectRatio, notes, contentType
      )
      res.createImagePrompt = buildCreateImagePrompt(contentType, notes)
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Failed to generate prompts')
    } finally {
      setLoading(false)
    }
  }

  // Export All
  const handleExportAll = () => {
    if (!result) return
    const lines = [
      '═══════════════════════════════════════',
      'AFF VIDEO PROMPT PACKAGE',
      `Duration: ${duration}s | Ratio: ${aspectRatio} | Model: ${model}`,
      '═══════════════════════════════════════',
      '',
      '── CHARACTER DNA ──',
      result.masterDNA,
      '',
      '── KEYFRAME IMAGE PROMPTS ──',
      ...result.keyframes.map(kf => `\n${kf.fullPrompt}`),
      '',
      '── SCENE PROMPTS (Veo 3.1) ──',
      ...result.scenes.map(sc => `\n${sc.fullPrompt}`),
      ...(result.createImagePrompt
        ? ['', '── CREATE IMAGE PROMPT ──', result.createImagePrompt]
        : []),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aff_prompts_${duration}s_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyAll = async () => {
    if (!result) return
    const lines = [
      'CHARACTER DNA:', result.masterDNA, '',
      'KEYFRAME PROMPTS:', ...result.keyframes.map(kf => kf.fullPrompt), '',
      'SCENE PROMPTS:', ...result.scenes.map(sc => sc.fullPrompt),
      ...(result.createImagePrompt ? ['', 'CREATE IMAGE PROMPT:', result.createImagePrompt] : []),
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n\n'))
    } catch {
      // silent
    }
  }

  return (
    <>
      <div className="app-bg" />
      <div className="app-container">
        {/* Header */}
        <header className="header">
          <div className="header-brand">
            <div className="header-logo">
              <Film size={20} color="white" />
            </div>
            <div>
              <h1 className="header-title">AFF Video Prompt</h1>
              <p className="header-subtitle">TikTok Affiliate Video Prompt Generator</p>
            </div>
          </div>
          <div className="header-config">
            <select
              className="select-field"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ maxWidth: 220 }}
              id="model-selector"
            >
              {GEMINI_MODELS.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label} ({m.tag})
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Main Layout */}
        <div className="main-layout">
          {/* ─── INPUT PANEL ─── */}
          <div className="fade-in">
            {/* API Key */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <Sparkles /> Cấu hình API
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="api-key-input">Gemini API Key</label>
                <div className="input-with-toggle">
                  <input
                    id="api-key-input"
                    type={showApiKey ? 'text' : 'password'}
                    className="input-field input-field-mono"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    className="input-toggle-btn"
                    onClick={() => setShowApiKey(!showApiKey)}
                    type="button"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <Camera /> Ảnh đầu vào
              </div>
              <ImageUploader
                label="Ảnh Face Model"
                image={faceImage}
                onImageChange={setFaceImage}
                isPasteTarget={pasteTarget === 'face'}
                onActivatePasteTarget={() => setPasteTarget('face')}
                icon={ImageIcon}
              />
              <ImageUploader
                label="Ảnh Sản phẩm (Model mặc sản phẩm)"
                image={productImage}
                onImageChange={setProductImage}
                isPasteTarget={pasteTarget === 'product'}
                onActivatePasteTarget={() => setPasteTarget('product')}
                icon={Upload}
              />
            </div>

            {/* Video Config */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <Clapperboard /> Cấu hình Video
              </div>

              {/* Duration */}
              <div className="input-group">
                <label className="input-label">
                  <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Thời lượng
                </label>
                <div className="chip-group">
                  {DURATIONS.map(d => (
                    <button
                      key={d.value}
                      className={`chip ${duration === d.value ? 'active' : ''}`}
                      onClick={() => setDuration(d.value)}
                      id={`duration-${d.value}`}
                    >
                      {d.label}
                      <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: 4 }}>
                        {d.scenes}sc/{d.keyframes}kf
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="input-group">
                <label className="input-label">
                  <Ratio size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Tỉ lệ khung hình
                </label>
                <div className="chip-group">
                  {ASPECT_RATIOS.map(ar => (
                    <button
                      key={ar.value}
                      className={`chip ${aspectRatio === ar.value ? (ar.value === '9:16' ? 'active-pink' : 'active-cyan') : ''}`}
                      onClick={() => setAspectRatio(ar.value as '9:16' | '16:9')}
                      id={`ratio-${ar.value.replace(':', '-')}`}
                    >
                      {ar.label}
                      <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: 4 }}>
                        {ar.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Type */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <Palette /> Loại nội dung
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <div className="chip-group">
                  {CONTENT_TYPES.map(ct => {
                    const Icon = ct.icon
                    return (
                      <button
                        key={ct.value}
                        className={`chip ${contentType === ct.value ? 'active' : ''}`}
                        onClick={() => setContentType(ct.value)}
                        id={`content-${ct.value}`}
                        style={contentType === ct.value ? {
                          background: `color-mix(in srgb, ${ct.color} 15%, transparent)`,
                          borderColor: ct.color,
                          color: ct.color,
                        } : {}}
                      >
                        <Icon size={13} style={{ marginRight: 2 }} />
                        {ct.label}
                        <span style={{ fontSize: '0.6rem', opacity: 0.7, marginLeft: 4 }}>
                          {ct.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <FileText /> Ghi chú
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <textarea
                  id="notes-input"
                  className="input-field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Model Việt Nam, make-up nhẹ nhàng, bối cảnh Sài Gòn, phong cách K-drama..."
                  rows={3}
                />
              </div>
            </div>

            {/* Algorithm Info */}
            <div className="card" style={{
              marginBottom: 16,
              background: 'rgba(139, 92, 246, 0.05)',
              borderColor: 'rgba(139, 92, 246, 0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Layers size={14} color="var(--accent-purple)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Thuật toán N+1
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Video <strong>{duration}s</strong> → <strong>{durationInfo.scenes} scenes</strong> × 8s mỗi scene → cần <strong>{durationInfo.keyframes} ảnh keyframe</strong>.
                <br />
                Mỗi scene dùng <strong>Veo 3.1</strong>: ảnh đầu + ảnh cuối → interpolate 8s video liền mạch.
              </p>
            </div>

            {/* Generate Button */}
            <button
              id="generate-btn"
              className={`btn-generate ${loading ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={loading || !canGenerate}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Đang tạo prompt...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Tạo Prompt Package
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {loading && (
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: '60%' }} />
              </div>
            )}

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          {/* ─── RESULTS PANEL ─── */}
          <div className="results-panel fade-in">
            <div className="card" style={{ minHeight: 500 }}>
              {!result ? (
                <div className="results-empty">
                  <Film className="results-empty-icon" />
                  <p className="results-empty-text">Chưa có prompt nào</p>
                  <p className="results-empty-hint">
                    Upload ảnh face & sản phẩm, chọn cấu hình, rồi nhấn "Tạo Prompt Package" để bắt đầu.
                  </p>
                </div>
              ) : (
                <>
                  <div className="card-title">
                    <Sparkles /> Prompt Package — {duration}s / {aspectRatio}
                  </div>

                  {/* Timeline */}
                  <Timeline
                    keyframeCount={durationInfo.keyframes}
                    sceneCount={durationInfo.scenes}
                  />

                  {/* Character DNA */}
                  <div className="dna-section">
                    <div className="dna-title">
                      <Wand2 size={13} /> Character DNA
                      <CopyButton text={result.masterDNA} />
                    </div>
                    <p className="dna-text">{result.masterDNA}</p>
                  </div>

                  {/* Tabs */}
                  <div className="tabs">
                    <button
                      className={`tab ${activeTab === 'keyframes' ? 'active' : ''}`}
                      onClick={() => setActiveTab('keyframes')}
                    >
                      <Camera /> Keyframes ({result.keyframes.length})
                    </button>
                    <button
                      className={`tab ${activeTab === 'scenes' ? 'active' : ''}`}
                      onClick={() => setActiveTab('scenes')}
                    >
                      <Film /> Scenes ({result.scenes.length})
                    </button>
                    <button
                      className={`tab ${activeTab === 'image' ? 'active' : ''}`}
                      onClick={() => setActiveTab('image')}
                    >
                      <ImageIcon /> Create Image
                    </button>
                    <button
                      className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveTab('all')}
                    >
                      <Layers /> Tất cả
                    </button>
                  </div>

                  {/* Content */}
                  {(activeTab === 'keyframes' || activeTab === 'all') && (
                    <>
                      {activeTab === 'all' && (
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🖼️ Keyframe Image Prompts
                        </h3>
                      )}
                      {result.keyframes.map((kf) => (
                        <div key={kf.index} className="prompt-card" style={{ animationDelay: `${kf.index * 60}ms` }}>
                          <div className="prompt-card-header">
                            <div className="prompt-card-badge keyframe">
                              <Camera size={14} />
                              Keyframe {kf.index + 1}
                            </div>
                            <span className="prompt-card-time">{kf.timestamp}</span>
                          </div>
                          <div className="prompt-card-body">
                            <CopyButton text={kf.fullPrompt} />
                            <div className="prompt-text">
                              <strong>SUBJECT:</strong> {kf.subject}
                              {'\n'}<strong>ACTION:</strong> {kf.action}
                              {'\n'}<strong>LOCATION:</strong> {kf.location}
                              {'\n'}<strong>CAMERA:</strong> {kf.camera}
                              {'\n'}<strong>LIGHTING:</strong> {kf.lighting}
                              {'\n'}<strong>STYLE:</strong> {kf.style}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {(activeTab === 'scenes' || activeTab === 'all') && (
                    <>
                      {activeTab === 'all' && (
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-pink)', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🎬 Scene Prompts (Veo 3.1)
                        </h3>
                      )}
                      {result.scenes.map((sc) => (
                        <div key={sc.index} className="prompt-card" style={{ animationDelay: `${sc.index * 60}ms` }}>
                          <div className="prompt-card-header">
                            <div className="prompt-card-badge scene">
                              <Film size={14} />
                              Scene {sc.index + 1}
                            </div>
                            <span className="prompt-card-time">{sc.timeRange}</span>
                          </div>
                          <div className="prompt-card-body">
                            <CopyButton text={sc.fullPrompt} />
                            <div className="prompt-text">
                              <strong>NARRATIVE:</strong> {sc.narrative}
                              {'\n'}<strong>START_POSE:</strong> {sc.startPose}
                              {'\n'}<strong>END_POSE:</strong> {sc.endPose}
                              {'\n'}<strong>CAMERA:</strong> {sc.cameraMovement}
                              {'\n'}<strong>FORMAT:</strong> Veo 3.1 first-frame → last-frame (8s)
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Create Image Prompt Tab */}
                  {(activeTab === 'image' || activeTab === 'all') && result.createImagePrompt && (
                    <>
                      {activeTab === 'all' && (
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🎨 Create Image Prompt (Tạo ảnh sản phẩm)
                        </h3>
                      )}
                      <div className="prompt-card">
                        <div className="prompt-card-header">
                          <div className="prompt-card-badge" style={{ color: 'var(--accent-amber)' }}>
                            <Palette size={14} />
                            Create Product Image Prompt
                          </div>
                          <span className="prompt-card-time">{contentType.toUpperCase()}</span>
                        </div>
                        <div className="prompt-card-body">
                          <CopyButton text={result.createImagePrompt} />
                          <div className="prompt-text" style={{ lineHeight: 1.8 }}>
                            {result.createImagePrompt}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Export Bar */}
                  <div className="export-bar">
                    <button className="btn-export" onClick={handleCopyAll} id="copy-all-btn">
                      <Copy /> Copy All
                    </button>
                    <button className="btn-export" onClick={handleExportAll} id="export-btn">
                      <Download /> Export .txt
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
