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

interface SeoVariant {
  index: number
  title: string
  tags: string[]
  hook: string
  cta: string
}

interface VoiceoverLine {
  timeRange: string
  line: string
}

interface VoiceoverScript {
  style: string
  durationSec: number
  script: string
  lines: VoiceoverLine[]
}

interface SeoTaskResult {
  productName: string
  seoVariants: SeoVariant[]
  generatedAt: number
}

interface VoiceoverTaskResult {
  productName: string
  voiceover: VoiceoverScript
  generatedAt: number
}

interface RecentLocalImage {
  id: string
  name: string
  dataUrl: string
  createdAt: number
}

interface RecentLocalImageBucket {
  bucket: string
  images: RecentLocalImage[]
  updatedAt: number
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
  { value: 'auto', label: 'Auto', icon: Sparkles, desc: 'AI Decides', color: 'var(--accent-purple)' },
  { value: 'ootd', label: 'OOTD', icon: Shirt, desc: 'Outfit of the Day', color: 'var(--accent-pink)' },
  { value: 'grwm', label: 'GRWM', icon: Star, desc: 'Get Ready With Me', color: 'var(--accent-purple)' },
  { value: 'fyp', label: 'FYP', icon: TrendingUp, desc: 'For You Page', color: 'var(--accent-cyan)' },
  { value: 'review', label: 'Review', icon: MessageSquare, desc: 'Product Review', color: 'var(--accent-emerald)' },
  { value: 'athleisure', label: 'Athleisure', icon: TrendingUp, desc: 'Gym-to-Café Styling', color: '#10b981' },
  { value: 'haul', label: 'Haul', icon: Layers, desc: 'Try-On / Collection Showcase', color: '#f59e0b' },
  { value: 'styling', label: 'Styling', icon: Wand2, desc: 'Fashion Styling Tips', color: '#ec4899' },
  { value: 'luxury', label: 'Luxury', icon: Star, desc: 'Old Money / Sophisticated', color: '#8b5cf6' },
] as const

type ContentType = typeof CONTENT_TYPES[number]['value']
type ResolvedContentType = Exclude<ContentType, 'auto'>
type ProductLocationHistoryMap = Record<string, string[]>

const AFF_STORAGE_DB_NAME = 'aff_prompt_storage'
const AFF_STORAGE_DB_VERSION = 1
const AFF_STORAGE_STORE = 'recent_local_images'
const PRODUCT_LOCATION_HISTORY_STORAGE_KEY = 'aff_product_location_history_v1'
const MAX_LOCATION_HISTORY_PER_PRODUCT = 40

// ═══════════════════════════════════════════════
// PROMPT ENGINE — N+1 Algorithm
// ═══════════════════════════════════════════════

// TikTok Beat Structure per content type
const SCENE_BEATS_MAP: Record<ResolvedContentType, Array<{ name: string; emoji: string; cameraHint: string }>> = {
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
  athleisure: [
    { name: 'GYM-TO-CAFÉ TRANSITION HOOK', emoji: '🏃‍♀️', cameraHint: 'Dynamic entrance from gym, effortless swagger' },
    { name: 'ACTIVEWEAR DETAIL MOMENT', emoji: '💪', cameraHint: 'Close-up on sports bra/leggings fabric and fit' },
    { name: 'STYLING MIX SHOWCASE', emoji: '✨', cameraHint: 'Smooth pan revealing casual layers and accessories' },
    { name: 'EVERYDAY VERSATILITY', emoji: '☕', cameraHint: 'Medium shot at café setting, relaxed confidence' },
    { name: 'MOVEMENT & COMFORT DEMO', emoji: '🌟', cameraHint: 'Dynamic movement shot showing flexibility and ease' },
    { name: 'ASPIRATIONAL CLOSER', emoji: '🎬', cameraHint: 'Cinematic wide shot of model in full athleisure look' },
  ],
  haul: [
    { name: 'HAUL UNBOXING HOOK', emoji: '📦', cameraHint: 'Fast-paced reveal of multiple items, excitement energy' },
    { name: 'FIRST PIECE TRY-ON', emoji: '👠', cameraHint: 'Quick transition into first outfit with reaction' },
    { name: 'SIZE & FIT CHECK', emoji: '📏', cameraHint: 'Full-body mirror shot, model checking fit and silhouette' },
    { name: 'STYLING COMBINATIONS', emoji: '💫', cameraHint: 'Rapid montage of pairing items different ways' },
    { name: 'PRICE-TO-QUALITY VERDICT', emoji: '💰', cameraHint: 'Close-up detail shots highlighting quality and value' },
    { name: 'FINAL COLLECTION SHOWCASE', emoji: '🎬', cameraHint: 'Wide shot of all haul items, thumbs up finale' },
  ],
  styling: [
    { name: 'STYLING PROBLEM HOOK', emoji: '🤔', cameraHint: 'Model presenting common fashion dilemma' },
    { name: 'WARDROBE PIECES INTRO', emoji: '👗', cameraHint: 'Organized display of base pieces to be styled' },
    { name: 'FIRST OUTFIT CREATION', emoji: '✨', cameraHint: 'Quick demonstration of combining items, reveal' },
    { name: 'ALTERNATIVE STYLING', emoji: '💡', cameraHint: 'Second outfit transformation from same pieces' },
    { name: 'EXPERT TIP SHARE', emoji: '🌟', cameraHint: 'Close-up of styling detail, narration of tips' },
    { name: 'INSPIRATION FINALE', emoji: '🎬', cameraHint: 'Model in final look with confidence, actionable inspo' },
  ],
  luxury: [
    { name: 'SOPHISTICATED ENTRANCE HOOK', emoji: '✨', cameraHint: 'Slow, composed entrance with understated elegance' },
    { name: 'QUALITY DETAIL MOMENT', emoji: '💎', cameraHint: 'Macro close-up of fine fabric, stitching, logo placement' },
    { name: 'CLASSIC SILHOUETTE SHOWCASE', emoji: '👗', cameraHint: 'Slow full-body shot showing timeless tailoring' },
    { name: 'TIMELESS LAYERING', emoji: '🤍', cameraHint: 'Deliberate reveal of neutral, minimalist layering' },
    { name: 'COMPOSED CONFIDENCE WALK', emoji: '🌟', cameraHint: 'Slow, steady walk with refined poise and grace' },
    { name: 'OLD MONEY AESTHETIC CLOSER', emoji: '🎬', cameraHint: 'Wide shot capturing understated luxury and refinement' },
  ],
}

function buildCharacterDNA(notes: string, contentType: ResolvedContentType): string {
  const styleMap: Record<ResolvedContentType, string> = {
    ootd: 'Professional fashion editorial, OOTD TikTok, cinematic quality',
    grwm: 'Lifestyle vlog aesthetic, warm and intimate GRWM style',
    fyp: 'Trending viral aesthetic, high-fashion editorial with cinematic flair',
    review: 'Authentic product review style, natural lighting, trustworthy feel',
    athleisure: 'Urban sporty-chic lifestyle, gym-to-café casual confidence',
    haul: 'Excited energetic unboxing aesthetic, approachable and relatable',
    styling: 'Expert fashion advisor aesthetic, polished and informative',
    luxury: 'Old money aesthetic, understated elegance, timeless sophistication',
  }
  return `[FACE PRESERVATION]: The model's face must be rendered with exact, hyper-realistic photographic likeness based on the provided face reference image.
[GARMENT PRESERVATION]: The garment from the product reference image must be preserved EXACTLY — no redesign, no reinterpretation. Prioritize intricate details.
[BODY]: Real human female model, tall ~175cm, porcelain skin with hyper-realistic texture.
[STYLE]: ${styleMap[contentType]}.
[CONTENT TYPE]: ${contentType.toUpperCase()} — ${CONTENT_TYPES.find(c => c.value === contentType)?.desc}
${notes ? `[CUSTOM NOTES]: ${notes}` : ''}`
}

function buildCreateImagePrompt(contentType: ResolvedContentType, notes: string): string {
  const contentDesc: Record<ResolvedContentType, string> = {
    ootd: 'OOTD (Outfit of the Day) — full outfit showcase with front and back views',
    grwm: 'GRWM (Get Ready With Me) — warm lifestyle aesthetic showing complete look',
    fyp: 'FYP (For You Page) — viral trending aesthetic with dramatic fashion presentation',
    review: 'Product Review — authentic product showcase highlighting garment quality and details',
    athleisure: 'Athleisure — gym-to-café styling combining sportswear with casual sophistication',
    haul: 'Haul Showcase — collection display with multiple outfit combinations',
    styling: 'Fashion Styling Guide — showcase expert outfit coordination and versatility',
    luxury: 'Luxury / Old Money — timeless sophisticated style with understated elegance',
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

[STYLE]: Professional fashion e-commerce photography. ${
  contentType === 'review' ? 'Authentic and trustworthy feel.' :
  contentType === 'luxury' ? 'Understated elegance, refined luxury presentation.' :
  contentType === 'athleisure' ? 'Urban sporty-chic, approachable lifestyle.' :
  contentType === 'haul' ? 'Energetic and approachable showcase.' :
  'High-end editorial quality.'
} Shot on Sony A7R IV, 85mm f/1.4 lens, ISO 100.

[TEXT OVERLAYS]: 
• Product name label at top center (clean sans-serif typography)
• "FRONT" label under left view, "BACK" label under right view
• Size/material callouts with thin leader lines pointing to key garment details

${notes ? `[CUSTOM NOTES]: ${notes}` : ''}

CRITICAL: This image will be used as a reference for Veo 3.1 video generation. Ensure consistent proportions and realistic rendering suitable for frame-by-frame animation.`
}

function normalizeLocationKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function createProductImageId(dataUrl: string): string {
  const normalized = dataUrl.trim()
  const sample = normalized.length > 12000
    ? `${normalized.slice(0, 6000)}${normalized.slice(-6000)}`
    : normalized

  let hash = 5381
  for (let i = 0; i < sample.length; i++) {
    hash = ((hash << 5) + hash) ^ sample.charCodeAt(i)
  }

  return `prod-${(hash >>> 0).toString(36)}-${sample.length.toString(36)}`
}

function loadProductLocationHistory(): ProductLocationHistoryMap {
  try {
    const raw = localStorage.getItem(PRODUCT_LOCATION_HISTORY_STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    const normalized: ProductLocationHistoryMap = {}
    for (const [productImageId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue

      const locations = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      if (locations.length > 0) {
        normalized[productImageId] = Array.from(new Set(locations)).slice(0, MAX_LOCATION_HISTORY_PER_PRODUCT)
      }
    }

    return normalized
  } catch {
    return {}
  }
}

function saveProductLocationHistory(history: ProductLocationHistoryMap): void {
  try {
    localStorage.setItem(PRODUCT_LOCATION_HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch {
    // no-op if quota exceeded
  }
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
  contentType: ContentType = 'ootd',
  usedLocationsForProduct: string[] = []
): Promise<GenerateResult> {
  const durationInfo = DURATIONS.find(d => d.value === duration)!
  const { scenes: sceneCount, keyframes: keyframeCount } = durationInfo

  // Determine final content type (if 'auto', AI will decide)
  const isAuto = contentType === 'auto'
  const contentTypeForPrompt = isAuto ? '(AI will automatically determine the best type)' : contentType.toUpperCase()
  const diversitySeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const normalizedUsedLocations = Array.from(
    new Set(
      usedLocationsForProduct
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  )
  const usedLocationsPrompt = normalizedUsedLocations.length > 0
    ? normalizedUsedLocations.map((location, index) => `${index + 1}. ${location}`).join('\n')
    : 'None yet for this product image ID'

  // Build the master prompt for Gemini
  const systemPrompt = `You are an expert AI video prompt engineer specializing in TikTok affiliate fashion videos (OOTD, FYP). 

Your task: Generate a COMPLETE prompt package for a ${duration}-second video with:
- ${keyframeCount} keyframe image prompts (n+1 algorithm: ${sceneCount} scenes need ${keyframeCount} images)
- ${sceneCount} scene prompts for Veo 3.1 (first-frame → last-frame video generation, 8s each)
- Aspect ratio: ${aspectRatio}
- Diversity seed: ${diversitySeed}

CONTENT TYPE: ${contentTypeForPrompt}
${isAuto ? `Since content type is set to AUTO, you MUST first analyze the provided product/garment image and determine which content type is MOST SUITABLE based on:
- Garment category (outfit piece, sportswear, luxury item, collection item, etc.)
- Visual characteristics and best presentation style
- Trending TikTok content format for this product
Valid types: ootd, grwm, fyp, review, athleisure, haul, styling, luxury
Include your recommended type in the JSON response as "recommendedContentType".` : ''}

LOCATIONS ALREADY USED FOR THIS PRODUCT IMAGE ID (MUST AVOID REUSE):
${usedLocationsPrompt}

CRITICAL RULES:
1. Each scene is exactly 8 seconds, using Veo 3.1's first-frame + last-frame interpolation
2. Keyframe images must be SEAMLESSLY CONNECTED: the last frame of scene N = first frame of scene N+1
3. Character identity must be PERFECTLY CONSISTENT across all keyframes (use Character DNA)
4. Product/garment must be EXACTLY preserved from reference image
5. Follow TikTok viral structure: Hook (0-3s) → Value → Proof → CTA
6. Infer location, lighting, camera mood, and styling directly from the provided reference images (face + garment) instead of generic preset randomness
7. Keep scene context coherent across the timeline; only change location when there is a clear narrative transition
8. NEVER use background, location, props, or lighting from the FACE reference image. The face image is identity-only and must not influence scene context.
9. Infer scene context primarily from garment/product characteristics, content type, and user notes.
10. **LOCATION MUST BE REAL-WORLD VENUES ONLY** — Select authentic, recognizable real locations (cafes, streets, parks, urban spaces, shopping districts, studios) NOT CGI, digital backgrounds, or artificial environments. Include specific venue characteristics that make the scene feel authentic and photogenic.
11. **LOCATION COUNTRY LOCK = VIETNAM ONLY** — Every location MUST be in Vietnam. Use specific Vietnamese city/province and venue details (e.g., Hanoi Old Quarter, Nguyen Hue Walking Street in Ho Chi Minh City, Da Nang beachside boulevard, Hoi An ancient town streets, Da Lat hill cafe district).
12. **ANTI-DUPLICATE + RANDOMIZATION REQUIREMENT** — Use the Diversity seed above to generate a fresh concept each run. Do not repeat template wording. Ensure ACTION, LOCATION, CAMERA, and NARRATIVE fields are not duplicated across keyframes/scenes in the same output.
13. **AVOID PREVIOUS LOCATIONS FOR SAME PRODUCT IMAGE ID** — Do NOT use any location from the provided "LOCATIONS ALREADY USED" list. Pick different real venues in Vietnam.

${notes ? `USER NOTES: ${notes}` : ''}

Output as JSON with this exact structure:
{
  "masterDNA": "character consistency description",
  ${isAuto ? '"recommendedContentType": "ootd|grwm|fyp|review|athleisure|haul|styling|luxury",' : ''}
  "keyframes": [
    {
      "index": 0,
      "timestamp": "0s",
      "subject": "face preservation instruction",
      "action": "pose/movement description",
      "location": "real location in Vietnam (city + venue details)",
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
    parts.push({ text: 'This is the FACE REFERENCE image. Use it ONLY for face identity preservation (facial features, skin tone, hairstyle). Ignore its background, location, props, and lighting.' })
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

    // If auto mode, use the recommended content type
    let finalContentType: ContentType = contentType as ContentType
    if (isAuto && typeof parsed.recommendedContentType === 'string') {
      const recommended = parsed.recommendedContentType.toLowerCase()
      const validTypes: ContentType[] = ['ootd', 'grwm', 'fyp', 'review', 'athleisure', 'haul', 'styling', 'luxury']
      if (validTypes.includes(recommended as ContentType)) {
        finalContentType = recommended as ContentType
      }
    }

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

    const inferredLocationFallback = 'Nguyen Hue Walking Street, District 1, Ho Chi Minh City, Vietnam (real urban venue)'
    const vietnamLocationPool = [
      inferredLocationFallback,
      'Hoan Kiem Lake pedestrian zone, Hanoi, Vietnam (real city-center street venue)',
      'Tran Phu riverside boulevard, Hoi An, Quang Nam, Vietnam (real heritage street venue)',
      'My Khe beach promenade, Da Nang, Vietnam (real coastal urban venue)',
      'Xuan Huong Lake cafe street, Da Lat, Lam Dong, Vietnam (real hill-town venue)',
      'Nha Trang beachfront walking street, Khanh Hoa, Vietnam (real seaside venue)',
      'Ninh Kieu Wharf riverside, Can Tho, Vietnam (real Mekong urban venue)',
      'Bui Vien pedestrian street, Ho Chi Minh City, Vietnam (real nightlife venue)',
      'Pham Ngu Lao area street cafe zone, Ho Chi Minh City, Vietnam (real urban venue)',
      'West Lake promenade near Truc Bach, Hanoi, Vietnam (real urban-lake venue)',
      'Bach Dang riverfront walkway, Da Nang, Vietnam (real city riverfront venue)',
      'Vo Thi Sau street cafe strip, Da Lat, Vietnam (real hill-city venue)',
      'Tran Hung Dao riverside route, Can Tho, Vietnam (real Mekong venue)',
      'Le Loi boulevard central district, Hue, Vietnam (real heritage city venue)',
      'Duong Dong night market surroundings, Phu Quoc, Vietnam (real island town venue)',
    ]
    const vietnamLocationOffset = Math.floor(Math.random() * vietnamLocationPool.length)
    const blockedLocationKeys = new Set(normalizedUsedLocations.map((location) => normalizeLocationKey(location)))
    const usedLocationKeysInRun = new Set<string>()

    const markLocationUsed = (location: string) => {
      usedLocationKeysInRun.add(normalizeLocationKey(location))
      return location
    }

    const pickVietnamLocationFallback = (index: number) => {
      for (let cursor = 0; cursor < vietnamLocationPool.length; cursor++) {
        const candidate = vietnamLocationPool[(index + vietnamLocationOffset + cursor) % vietnamLocationPool.length]
        const candidateKey = normalizeLocationKey(candidate)
        if (!blockedLocationKeys.has(candidateKey) && !usedLocationKeysInRun.has(candidateKey)) {
          return markLocationUsed(candidate)
        }
      }

      const fallback = vietnamLocationPool[(index + vietnamLocationOffset) % vietnamLocationPool.length]
      return markLocationUsed(fallback)
    }

    const hasVietnamReference = (value: string) => (
      /(viet\s?nam|vietnam|ha\s?noi|hanoi|ho\s?chi\s?minh|sai\s?gon|saigon|da\s?nang|hoi\s?an|da\s?lat|nha\s?trang|can\s?tho|ha\s?long|hue|phu\s?quoc)/i.test(value)
    )

    const ensureVietnamLocation = (value: unknown, index: number) => {
      const candidate = toSafeString(value, '')
      if (candidate.length > 0 && hasVietnamReference(candidate)) {
        const candidateKey = normalizeLocationKey(candidate)
        if (!blockedLocationKeys.has(candidateKey) && !usedLocationKeysInRun.has(candidateKey)) {
          return markLocationUsed(candidate)
        }
      }
      return pickVietnamLocationFallback(index)
    }

    const fallbackActionByType: Record<Exclude<ContentType, 'auto'>, string> = {
      ootd: 'Confident outfit showcase pose and movement tailored for OOTD storytelling',
      grwm: 'Natural getting-ready movement that highlights styling steps and final look',
      fyp: 'Scroll-stopping fashion movement with dynamic pose transition',
      review: 'Authentic product demonstration pose emphasizing fit and material quality',
      athleisure: 'Energetic gym-to-café transition movement with sporty-chic confidence',
      haul: 'Excited try-on movements showcasing product fit and styling versatility',
      styling: 'Purposeful modeling pose highlighting outfit coordination and styling impact',
      luxury: 'Composed understated movement exuding timeless elegance and quiet confidence',
    }

    const fallbackStyleByType: Record<Exclude<ContentType, 'auto'>, string> = {
      ootd: 'Professional fashion editorial, OOTD TikTok aesthetic',
      grwm: 'Warm lifestyle GRWM visual style, intimate and clean',
      fyp: 'Viral cinematic fashion style with bold visual energy',
      review: 'Trustworthy product review style with high material clarity',
      athleisure: 'Urban sporty-chic lifestyle photography, natural daylight',
      haul: 'Energetic colorful unboxing and try-on aesthetic, dynamic lighting',
      styling: 'Expert fashion editorial style, polished and educational',
      luxury: 'Old money sophisticated aesthetic, understated timeless elegance, neutral palette',
    }

    const inferredCameraFallback = 'AI-selected framing, lens, and movement optimized for fashion storytelling'
    const inferredLightingFallback = 'Lighting inferred from scene mood and garment texture visibility'

    // Build full prompts for each keyframe and scene
    const keyframes: KeyframePrompt[] = rawKeyframes.map((kf: any, i: number) => {
      const subject = toSafeString(kf.subject, '[facePreservation from reference]')
      const action = toSafeString(kf.action, fallbackActionByType[finalContentType as Exclude<ContentType, 'auto'>])
      const location = ensureVietnamLocation(kf.location, i)
      const camera = toSafeString(kf.camera, inferredCameraFallback)
      const lighting = toSafeString(kf.lighting, inferredLightingFallback)
      const style = toSafeString(kf.style, fallbackStyleByType[finalContentType as Exclude<ContentType, 'auto'>])
      const timestamp = toSafeString(kf.timestamp, `${Math.round((i * duration) / (keyframeCount - 1))}s`)

      return {
        index: i,
        timestamp,
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
      const startSec = Math.round((i * duration) / sceneCount)
      const endSec = Math.round(((i + 1) * duration) / sceneCount)
      const startPose = keyframes[i]?.action || toSafeString(sc.startPose, '')
      const endPose = keyframes[i + 1]?.action || toSafeString(sc.endPose, '')
      const beatIndex = i % SCENE_BEATS_MAP[finalContentType as Exclude<ContentType, 'auto'>].length
      const narrative = toSafeString(
        sc.narrative,
        `${SCENE_BEATS_MAP[finalContentType as Exclude<ContentType, 'auto'>][beatIndex].name}. The model transitions smoothly between matched keyframes over ${endSec - startSec} seconds.`
      )
      const cameraMovement = toSafeString(
        sc.cameraMovement,
        SCENE_BEATS_MAP[finalContentType as Exclude<ContentType, 'auto'>][beatIndex].cameraHint
      )
      const timeRange = toSafeString(sc.timeRange, `${startSec}s-${endSec}s`)

      return {
        index: i,
        timeRange,
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
      masterDNA: parsed.masterDNA || buildCharacterDNA(notes, finalContentType as Exclude<ContentType, 'auto'>),
      keyframes,
      scenes,
    }
  } catch (error: any) {
    throw new Error(error?.message || 'Gemini generation failed')
  }
}

function parseGeminiJsonFromText(raw: string): Record<string, unknown> {
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
  if (direct && typeof direct === 'object') return direct as Record<string, unknown>

  const start = stripCodeFence.indexOf('{')
  const end = stripCodeFence.lastIndexOf('}')
  if (start >= 0 && end > start) {
    const extracted = stripCodeFence.slice(start, end + 1)
    const extractedParsed = tryParse(extracted)
    if (extractedParsed && typeof extractedParsed === 'object') {
      return extractedParsed as Record<string, unknown>
    }
  }

  throw new Error(`Could not parse JSON from Gemini response: ${stripCodeFence.slice(0, 240)}`)
}

async function requestGeminiJson(
  apiKey: string,
  model: string,
  systemPrompt: string,
  temperature = 0.9,
  maxOutputTokens = 4096
): Promise<Record<string, unknown>> {
  const parts: Array<{ text: string }> = [{ text: systemPrompt }]

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature,
          topP: 0.95,
          maxOutputTokens,
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

  return parseGeminiJsonFromText(mergedText)
}

async function generateSeoWithGemini(
  apiKey: string,
  model: string,
  productName: string,
  extraNotes: string,
  contentType: ContentType
): Promise<SeoTaskResult> {
  const trimmedProductName = productName.trim()
  const trimmedNotes = extraNotes.trim()
  const contentHint = contentType === 'auto' ? 'AUTO' : contentType.toUpperCase()

  const systemPrompt = `You are a senior TikTok Shop content strategist and copywriter.

INPUT:
- Product name: ${trimmedProductName}
- Preferred content type: ${contentHint}
${trimmedNotes ? `- Additional notes: ${trimmedNotes}` : '- Additional notes: none'}

TASK:
- Create exactly 3 DISTINCT SEO variants for TikTok Shop.
- For each variant return:
  1) "title": Vietnamese TikTok SEO title, natural and persuasive, around 60-95 characters.
  2) "tags": exactly 5 hashtags, each starts with #, no duplicates.
  3) "hook": one short hook sentence.
  4) "cta": one short call-to-action sentence.
- Title must include product intent and buying motivation, avoid spammy overclaims.

Return JSON only with this exact schema:
{
  "seoVariants": [
    {
      "index": 1,
      "title": "...",
      "tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "hook": "...",
      "cta": "..."
    }
  ]
}`

  try {
    const parsed = await requestGeminiJson(apiKey, model, systemPrompt, 0.9, 3072)

    const toSafeString = (value: unknown, fallback: string) => {
      if (typeof value !== 'string') return fallback
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : fallback
    }

    const normalizeTag = (rawTag: string): string => {
      const compact = rawTag.trim().replace(/\s+/g, '')
      if (!compact) return ''
      if (compact.startsWith('#')) return compact
      return `#${compact.replace(/^#+/, '')}`
    }

    const fallbackKeyword = trimmedProductName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 24)

    const defaultTagPool = [
      '#tiktokshop',
      '#reviewsanpham',
      '#xuhuong',
      '#dealhot',
      '#muangay',
      '#fyp',
      '#hangdep',
      '#giare',
    ]

    if (fallbackKeyword.length > 0) {
      defaultTagPool.unshift(`#${fallbackKeyword}`)
    }

    const normalizeTags = (value: unknown): string[] => {
      const base = Array.isArray(value)
        ? value.filter((tag): tag is string => typeof tag === 'string').map(normalizeTag).filter((tag) => tag.length > 0)
        : []

      const unique = Array.from(new Set(base))
      for (const seed of defaultTagPool) {
        if (unique.length >= 5) break
        if (!unique.includes(seed)) unique.push(seed)
      }

      return unique.slice(0, 5)
    }

    const fallbackVariants: SeoVariant[] = [
      {
        index: 1,
        title: `${trimmedProductName} dang hot tren TikTok Shop, len form dep va de phoi do moi ngay`,
        tags: normalizeTags(['#tiktokshop', '#reviewsanpham', '#xuhuong', '#dealhot', '#muangay']),
        hook: `Dang tim ${trimmedProductName} de mac dep ma de dung?`,
        cta: 'Bam gio hang de nhan uu dai va xem gia tot hom nay.',
      },
      {
        index: 2,
        title: `Review ${trimmedProductName}: chat lieu on, ton dang va dang duoc san don nhieu`,
        tags: normalizeTags(['#review', '#tiktokshop', '#fyp', '#hangdep', '#muangay']),
        hook: `${trimmedProductName} co thuc su ngon trong tam gia nay khong?`,
        cta: 'Luu video va dat mua som truoc khi het size hot.',
      },
      {
        index: 3,
        title: `${trimmedProductName} cho outfit di choi, di lam va di cafe trong mot mon`,
        tags: normalizeTags(['#phoido', '#tiktokshop', '#xuhuong', '#dealhot', '#giare']),
        hook: 'Mot mon de phoi, mac duoc nhieu tinh huong trong ngay.',
        cta: 'Xem ngay link san pham va chon mau ban thich.',
      },
    ]

    const rawVariants = Array.isArray((parsed as Record<string, unknown>).seoVariants)
      ? (parsed as Record<string, any>).seoVariants
      : []

    const seoVariants: SeoVariant[] = [0, 1, 2].map((offset) => {
      const fallback = fallbackVariants[offset]
      const candidate = rawVariants[offset]

      if (!candidate || typeof candidate !== 'object') {
        return fallback
      }

      const record = candidate as Record<string, unknown>

      return {
        index: offset + 1,
        title: toSafeString(record.title, fallback.title),
        tags: normalizeTags(record.tags),
        hook: toSafeString(record.hook, fallback.hook),
        cta: toSafeString(record.cta, fallback.cta),
      }
    })

    return {
      productName: trimmedProductName,
      seoVariants,
      generatedAt: Date.now(),
    }
  } catch (error: any) {
    throw new Error(error?.message || 'Gemini SEO generation failed')
  }
}

async function generateVoiceoverWithGemini(
  apiKey: string,
  model: string,
  productName: string,
  extraNotes: string,
  contentType: ContentType
): Promise<VoiceoverTaskResult> {
  const trimmedProductName = productName.trim()
  const trimmedNotes = extraNotes.trim()
  const contentHint = contentType === 'auto' ? 'AUTO' : contentType.toUpperCase()

  const systemPrompt = `You are a senior TikTok Shop video script writer.

INPUT:
- Product name: ${trimmedProductName}
- Preferred content type: ${contentHint}
${trimmedNotes ? `- Additional notes: ${trimmedNotes}` : '- Additional notes: none'}

TASK:
- Create one Vietnamese sample voiceover script for a short product video.
- Target duration 25-35 seconds.
- Return timeline beats:
  * 0-3s: hook
  * 3-15s: key benefits
  * 15-24s: social proof / usage context
  * 24-30s: CTA
- Tone must be natural, trust-building, and conversion-friendly.

Return JSON only with this exact schema:
{
  "voiceover": {
    "style": "...",
    "durationSec": 30,
    "script": "full script text",
    "lines": [
      { "timeRange": "0-3s", "line": "..." },
      { "timeRange": "3-15s", "line": "..." },
      { "timeRange": "15-24s", "line": "..." },
      { "timeRange": "24-30s", "line": "..." }
    ]
  }
}`

  try {
    const parsed = await requestGeminiJson(apiKey, model, systemPrompt, 0.92, 3072)

    const toSafeString = (value: unknown, fallback: string) => {
      if (typeof value !== 'string') return fallback
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : fallback
    }

    const rawVoiceover = (parsed as Record<string, unknown>).voiceover && typeof (parsed as Record<string, unknown>).voiceover === 'object'
      ? (parsed as Record<string, unknown>).voiceover as Record<string, unknown>
      : {}

    const fallbackLines: VoiceoverLine[] = [
      { timeRange: '0-3s', line: `${trimmedProductName} dang duoc nhieu ban tim mua vi de mac va de phoi.` },
      { timeRange: '3-15s', line: 'Chat lieu mem, len form gon va ton dang, mac thoai mai suot ngay ma van dep.' },
      { timeRange: '15-24s', line: 'Minh da thu trong nhieu boi canh di lam, di choi, di cafe va deu de dung.' },
      { timeRange: '24-30s', line: 'Neu ban dang can mot mon mac nhieu dip, bam link de xem gia va dat ngay.' },
    ]

    const rawLines = Array.isArray(rawVoiceover.lines)
      ? rawVoiceover.lines
      : []

    const lines = rawLines
      .map((item, index): VoiceoverLine | null => {
        if (!item || typeof item !== 'object') return null
        const candidate = item as Record<string, unknown>

        const timeRange = toSafeString(candidate.timeRange, fallbackLines[index]?.timeRange || `${index * 7}-${index * 7 + 7}s`)
        const line = toSafeString(candidate.line, fallbackLines[index]?.line || '')
        if (!line) return null

        return { timeRange, line }
      })
      .filter((item): item is VoiceoverLine => item !== null)

    const normalizedLines = lines.length > 0 ? lines : fallbackLines
    const computedScript = normalizedLines
      .map((line) => `${line.timeRange}: ${line.line}`)
      .join('\n')

    const durationRaw = Number(rawVoiceover.durationSec)
    const durationSec = Number.isFinite(durationRaw)
      ? Math.max(20, Math.min(60, Math.round(durationRaw)))
      : 30

    return {
      productName: trimmedProductName,
      voiceover: {
        style: toSafeString(rawVoiceover.style, 'Than thien, thuyet phuc, sat voi ngu canh TikTok ban hang'),
        durationSec,
        script: toSafeString(rawVoiceover.script, computedScript),
        lines: normalizedLines,
      },
      generatedAt: Date.now(),
    }
  } catch (error: any) {
    throw new Error(error?.message || 'Gemini voiceover generation failed')
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

function makeLocalImageName(rawName?: string, fallbackPrefix = 'pc-image'): string {
  const trimmed = rawName?.trim()
  if (trimmed) return trimmed

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `${fallbackPrefix}-${stamp}.jpg`
}

function normalizeRecentLocalImages(input: unknown): RecentLocalImage[] {
  if (!Array.isArray(input)) return []
  const now = Date.now()

  return input
    .map((item: unknown, index): RecentLocalImage | null => {
      if (typeof item === 'string' && item.startsWith('data:image/')) {
        return {
          id: `legacy-${now}-${index}`,
          name: makeLocalImageName(`pc-image-${index + 1}.jpg`),
          dataUrl: item,
          createdAt: now,
        }
      }

      if (!item || typeof item !== 'object') return null
      const candidate = item as Record<string, unknown>

      if (typeof candidate.dataUrl !== 'string' || !candidate.dataUrl.startsWith('data:image/')) {
        return null
      }

      const id = typeof candidate.id === 'string'
        ? candidate.id
        : `legacy-${now}-${index}`

      const name = typeof candidate.name === 'string'
        ? makeLocalImageName(candidate.name)
        : makeLocalImageName(`pc-image-${index + 1}.jpg`)

      const createdAt = typeof candidate.createdAt === 'number' && Number.isFinite(candidate.createdAt)
        ? candidate.createdAt
        : now

      return {
        id,
        name,
        dataUrl: candidate.dataUrl,
        createdAt,
      }
    })
    .filter((item): item is RecentLocalImage => item !== null)
    .sort((a, b) => b.createdAt - a.createdAt)
}

function loadLegacyRecentLocalImages(storageKey: string): RecentLocalImage[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return normalizeRecentLocalImages(parsed)
  } catch {
    return []
  }
}

function saveLegacyRecentLocalImages(storageKey: string, images: RecentLocalImage[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(images))
  } catch {
    // no-op fallback only
  }
}

function openAffStorageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this browser'))
      return
    }

    const request = window.indexedDB.open(AFF_STORAGE_DB_NAME, AFF_STORAGE_DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(AFF_STORAGE_STORE)) {
        db.createObjectStore(AFF_STORAGE_STORE, { keyPath: 'bucket' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
}

async function loadRecentLocalImagesFromIndexedDb(bucket: string): Promise<RecentLocalImage[]> {
  const db = await openAffStorageDb()

  try {
    const record = await new Promise<RecentLocalImageBucket | undefined>((resolve, reject) => {
      const tx = db.transaction(AFF_STORAGE_STORE, 'readonly')
      const store = tx.objectStore(AFF_STORAGE_STORE)
      const request = store.get(bucket)

      request.onsuccess = () => resolve(request.result as RecentLocalImageBucket | undefined)
      request.onerror = () => reject(request.error ?? new Error('Failed to read IndexedDB'))
      tx.onerror = () => reject(tx.error ?? new Error('Failed to read IndexedDB'))
      tx.onabort = () => reject(tx.error ?? new Error('Failed to read IndexedDB'))
    })

    return normalizeRecentLocalImages(record?.images)
  } finally {
    db.close()
  }
}

async function saveRecentLocalImagesToIndexedDb(bucket: string, images: RecentLocalImage[]): Promise<void> {
  const db = await openAffStorageDb()

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(AFF_STORAGE_STORE, 'readwrite')
      const store = tx.objectStore(AFF_STORAGE_STORE)
      const payload: RecentLocalImageBucket = {
        bucket,
        images,
        updatedAt: Date.now(),
      }

      store.put(payload)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Failed to write IndexedDB'))
      tx.onabort = () => reject(tx.error ?? new Error('Failed to write IndexedDB'))
    })
  } finally {
    db.close()
  }
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
  recentLocalStorageKey,
  onLoadError,
  icon: Icon,
}: {
  label: string
  image: string | null
  onImageChange: (img: string | null) => void
  isPasteTarget: boolean
  onActivatePasteTarget: () => void
  recentLocalStorageKey: string
  onLoadError?: (message: string) => void
  icon: React.ElementType
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [recentLocalImages, setRecentLocalImages] = useState<RecentLocalImage[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const rememberLocalImage = useCallback((dataUrl: string, rawName?: string) => {
    const name = makeLocalImageName(rawName)
    const now = Date.now()

    setRecentLocalImages((prev) => {
      const existing = prev.find((entry) => entry.dataUrl === dataUrl)
      const withoutSame = prev.filter((entry) => entry.dataUrl !== dataUrl)
      return [
        existing
          ? { ...existing, name, createdAt: now }
          : {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            dataUrl,
            createdAt: now,
          },
        ...withoutSame,
      ]
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadHistory = async () => {
      try {
        let loaded = await loadRecentLocalImagesFromIndexedDb(recentLocalStorageKey)

        if (loaded.length === 0) {
          const legacy = loadLegacyRecentLocalImages(recentLocalStorageKey)
          if (legacy.length > 0) {
            loaded = legacy
            try {
              await saveRecentLocalImagesToIndexedDb(recentLocalStorageKey, legacy)
              localStorage.removeItem(recentLocalStorageKey)
            } catch {
              // ignore migration error and continue with loaded data
            }
          }
        }

        if (!cancelled) {
          setRecentLocalImages(loaded)
        }
      } catch {
        const legacy = loadLegacyRecentLocalImages(recentLocalStorageKey)
        if (!cancelled) {
          setRecentLocalImages(legacy)
          if (legacy.length === 0) {
            onLoadError?.('Khong the tai lich su anh tu bo nho trinh duyet')
          }
        }
      } finally {
        if (!cancelled) {
          setHistoryLoaded(true)
        }
      }
    }

    void loadHistory()
    return () => { cancelled = true }
  }, [onLoadError, recentLocalStorageKey])

  useEffect(() => {
    if (!historyLoaded) return

    let cancelled = false

    const persistHistory = async () => {
      try {
        await saveRecentLocalImagesToIndexedDb(recentLocalStorageKey, recentLocalImages)
      } catch {
        saveLegacyRecentLocalImages(recentLocalStorageKey, recentLocalImages)
        if (!cancelled) {
          onLoadError?.('Khong the luu vao IndexedDB. Da tam luu bang localStorage.')
        }
      }
    }

    void persistHistory()
    return () => { cancelled = true }
  }, [historyLoaded, onLoadError, recentLocalImages, recentLocalStorageKey])

  const handleFile = useCallback(async (file: File, sourceName?: string) => {
    if (!file.type.startsWith('image/')) {
      onLoadError?.('Chi ho tro tep anh tu PC')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = e.target?.result
      if (typeof result !== 'string') {
        onLoadError?.('Khong the doc tep anh')
        return
      }
      const resized = await resizeImage(result)
      onImageChange(resized)
      rememberLocalImage(resized, sourceName ?? file.name)
      onLoadError?.('')
    }
    reader.onerror = () => onLoadError?.('Khong the doc tep anh')
    reader.readAsDataURL(file)
  }, [onImageChange, onLoadError, rememberLocalImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    onActivatePasteTarget()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file, file.name || 'pc-drag-image')
  }, [handleFile, onActivatePasteTarget])

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!isPasteTarget) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) handleFile(file, file.name || 'pc-paste-image')
        break
      }
    }
  }, [handleFile, isPasteTarget])

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  const handleSelectRecent = useCallback((item: RecentLocalImage) => {
    onActivatePasteTarget()
    onImageChange(item.dataUrl)
    setRecentLocalImages((prev) => {
      const withoutCurrent = prev.filter((entry) => entry.id !== item.id)
      return [{ ...item, createdAt: Date.now() }, ...withoutCurrent]
    })
    onLoadError?.('')
  }, [onActivatePasteTarget, onImageChange, onLoadError])

  const handleRemoveRecent = useCallback((id: string) => {
    setRecentLocalImages((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const filteredRecentImages = searchTerm.trim().length > 0
    ? recentLocalImages.filter((item) => item.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : recentLocalImages

  const formatSavedTime = useCallback((timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleString('vi-VN', {
        hour12: false,
      })
    } catch {
      return ''
    }
  }, [])

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
          if (file) handleFile(file, file.name || 'pc-upload-image')
          e.target.value = ''
        }}
      />
      <div className="image-local-tools">
        <div className="recent-local-wrap">
          <div className="recent-local-head">
            <span>Anh PC da luu ({recentLocalImages.length})</span>
            {recentLocalImages.length > 0 && (
              <button
                type="button"
                className="recent-local-clear"
                onClick={() => {
                  setRecentLocalImages([])
                  setSearchTerm('')
                }}
              >
                Xoa tat ca
              </button>
            )}
          </div>

          {recentLocalImages.length > 0 && (
            <input
              className="input-field recent-local-search"
              value={searchTerm}
              placeholder="Tim theo ten file..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}

          {filteredRecentImages.length > 0 ? (
            <div className="recent-local-list">
              {filteredRecentImages.map((item) => {
                const active = image === item.dataUrl
                return (
                  <div key={item.id} className={`recent-local-row ${active ? 'active' : ''}`}>
                    <button
                      type="button"
                      className="recent-local-item"
                      title={item.name}
                      onClick={() => handleSelectRecent(item)}
                    >
                      <img src={item.dataUrl} alt={item.name} className="recent-local-thumb" />
                      <span className="recent-local-meta">
                        <span className="recent-local-name">{item.name}</span>
                        <span className="recent-local-time">{formatSavedTime(item.createdAt)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="recent-local-remove"
                      title="Xoa anh nay khoi danh sach"
                      onClick={() => handleRemoveRecent(item.id)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="recent-local-empty">
              {recentLocalImages.length === 0
                ? 'Anh upload/paste tu PC se duoc luu tai day de chon nhanh.'
                : 'Khong tim thay anh phu hop tu khoa tim kiem.'}
            </div>
          )}
        </div>
      </div>
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
  const [contentType, setContentType] = useState<ContentType>('auto')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [seoLoading, setSeoLoading] = useState(false)
  const [voiceoverLoading, setVoiceoverLoading] = useState(false)
  const [error, setError] = useState('')
  const [seoError, setSeoError] = useState('')
  const [voiceoverError, setVoiceoverError] = useState('')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [seoResult, setSeoResult] = useState<SeoTaskResult | null>(null)
  const [voiceoverResult, setVoiceoverResult] = useState<VoiceoverTaskResult | null>(null)
  const [activeTab, setActiveTab] = useState<'keyframes' | 'scenes' | 'all' | 'image' | 'seo' | 'voiceover'>('keyframes')
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('auto')
  const [seoProductName, setSeoProductName] = useState('')
  const [seoNotes, setSeoNotes] = useState('')
  const [voiceoverProductName, setVoiceoverProductName] = useState('')
  const [voiceoverNotes, setVoiceoverNotes] = useState('')
  const [selectedSeoVariantIndex, setSelectedSeoVariantIndex] = useState(0)
  const [productLocationHistory, setProductLocationHistory] = useState<ProductLocationHistoryMap>(() => loadProductLocationHistory())

  // Persist settings
  useEffect(() => { localStorage.setItem('aff_api_key', apiKey) }, [apiKey])
  useEffect(() => { localStorage.setItem('aff_model', model) }, [model])
  useEffect(() => { saveProductLocationHistory(productLocationHistory) }, [productLocationHistory])

  // Derived
  const durationInfo = DURATIONS.find(d => d.value === duration)!
  const canGenerate = apiKey.trim().length > 0
  const canGenerateSeo = canGenerate && seoProductName.trim().length > 0
  const canGenerateVoiceover = canGenerate && voiceoverProductName.trim().length > 0
  const hasPromptResult = result !== null
  const hasSeoResult = seoResult !== null
  const hasVoiceoverResult = voiceoverResult !== null
  const hasAnyResult = hasPromptResult || hasSeoResult || hasVoiceoverResult
  const selectedSeoVariant = seoResult
    ? seoResult.seoVariants[Math.min(selectedSeoVariantIndex, seoResult.seoVariants.length - 1)]
    : null
  const resultsHeader = result
    ? `Prompt Package — ${duration}s / ${aspectRatio}`
    : activeTab === 'voiceover'
      ? 'Nhiệm vụ 2 — Kịch bản lồng tiếng'
      : 'Nhiệm vụ 1 — SEO TikTok'

  // Generate handler
  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      if (!apiKey.trim()) {
        throw new Error('Vui long nhap Gemini API Key de AI phan tich anh va tao boi canh')
      }

      const currentProductImageId = productImage ? createProductImageId(productImage) : null
      const usedLocationsForProduct = currentProductImageId
        ? (productLocationHistory[currentProductImageId] || [])
        : []

      const res = await generateWithGemini(
        apiKey, model, faceImage, productImage, duration, aspectRatio, notes, contentType, usedLocationsForProduct
      )
      
      // Track which content type was used (for auto mode, this comes from Gemini's recommendation)
      let usedType: ContentType = contentType
      if (contentType === 'auto') {
        // Extract from the response's fallback usage - we can tell by analyzing the returned prompts
        // For now, we'll store what AI decided based on the system parsing
        // This will be updated when we have explicit recommendation tracking
        usedType = 'auto'
      }
      
      res.createImagePrompt = buildCreateImagePrompt(usedType !== 'auto' ? usedType : 'ootd', notes)
      setResult(res)
      setSelectedContentType(usedType)
      setActiveTab('keyframes')

      if (currentProductImageId) {
        const generatedLocations = Array.from(
          new Set(
            res.keyframes
              .map((keyframe) => keyframe.location.trim())
              .filter((location) => location.length > 0)
          )
        )

        if (generatedLocations.length > 0) {
          setProductLocationHistory((prev) => {
            const existing = prev[currentProductImageId] || []
            const merged = Array.from(new Set([...generatedLocations, ...existing]))
            return {
              ...prev,
              [currentProductImageId]: merged.slice(0, MAX_LOCATION_HISTORY_PER_PRODUCT),
            }
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate prompts')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSeo = async () => {
    setSeoLoading(true)
    setSeoError('')

    try {
      if (!apiKey.trim()) {
        throw new Error('Vui long nhap Gemini API Key de tao bien the SEO')
      }

      const trimmedProductName = seoProductName.trim()
      if (!trimmedProductName) {
        throw new Error('Vui long nhap ten san pham truoc khi tao noi dung SEO')
      }

      const generated = await generateSeoWithGemini(
        apiKey,
        model,
        trimmedProductName,
        seoNotes.trim(),
        contentType
      )

      setSeoResult(generated)
      setSelectedSeoVariantIndex(0)
      setActiveTab('seo')
    } catch (err: any) {
      setSeoError(err?.message || 'Failed to generate SEO variants')
    } finally {
      setSeoLoading(false)
    }
  }

  const handleGenerateVoiceover = async () => {
    setVoiceoverLoading(true)
    setVoiceoverError('')

    try {
      if (!apiKey.trim()) {
        throw new Error('Vui long nhap Gemini API Key de tao kich ban long tieng')
      }

      const trimmedProductName = voiceoverProductName.trim()
      if (!trimmedProductName) {
        throw new Error('Vui long nhap ten san pham truoc khi tao kich ban long tieng')
      }

      const generated = await generateVoiceoverWithGemini(
        apiKey,
        model,
        trimmedProductName,
        voiceoverNotes.trim(),
        contentType
      )

      setVoiceoverResult(generated)
      setActiveTab('voiceover')
    } catch (err: any) {
      setVoiceoverError(err?.message || 'Failed to generate voiceover script')
    } finally {
      setVoiceoverLoading(false)
    }
  }

  // Export All
  const handleExportAll = () => {
    if (!hasAnyResult) return
    const lines = [
      '═══════════════════════════════════════',
      'AFF AI CONTENT PACKAGE',
      `Model: ${model}`,
      '═══════════════════════════════════════',
    ]

    if (result) {
      lines.push(
        '',
        '── VIDEO PROMPT PACKAGE ──',
        `Duration: ${duration}s | Ratio: ${aspectRatio}`,
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
      )
    }

    if (seoResult) {
      lines.push(
        '',
        '── SEO PACKAGE ──',
        `Product: ${seoResult.productName}`,
      )

      for (const variant of seoResult.seoVariants) {
        lines.push(
          '',
          `SEO VARIANT ${variant.index}`,
          `Title: ${variant.title}`,
          `Hook: ${variant.hook}`,
          `CTA: ${variant.cta}`,
          `Tags: ${variant.tags.join(' ')}`,
        )
      }
    }

    if (voiceoverResult) {
      lines.push(
        '',
        '── VOICEOVER PACKAGE ──',
        `Product: ${voiceoverResult.productName}`,
        '',
        'VOICEOVER SCRIPT',
        `Style: ${voiceoverResult.voiceover.style}`,
        `Duration: ~${voiceoverResult.voiceover.durationSec}s`,
        voiceoverResult.voiceover.script,
      )

    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aff_ai_package_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyAll = async () => {
    if (!hasAnyResult) return

    const lines: string[] = []

    if (result) {
      lines.push(
        'CHARACTER DNA:', result.masterDNA, '',
        'KEYFRAME PROMPTS:', ...result.keyframes.map(kf => kf.fullPrompt), '',
        'SCENE PROMPTS:', ...result.scenes.map(sc => sc.fullPrompt),
        ...(result.createImagePrompt ? ['', 'CREATE IMAGE PROMPT:', result.createImagePrompt] : []),
      )
    }

    if (seoResult) {
      lines.push('', `SEO (${seoResult.productName}):`)

      for (const variant of seoResult.seoVariants) {
        lines.push(
          `\nSEO VARIANT ${variant.index}`,
          `TITLE: ${variant.title}`,
          `HOOK: ${variant.hook}`,
          `CTA: ${variant.cta}`,
          `TAGS: ${variant.tags.join(' ')}`,
        )
      }
    }

    if (voiceoverResult) {
      lines.push(
        '',
        `VOICEOVER (${voiceoverResult.productName}):`,
        `VOICEOVER STYLE: ${voiceoverResult.voiceover.style}`,
        `VOICEOVER DURATION: ~${voiceoverResult.voiceover.durationSec}s`,
        'VOICEOVER SCRIPT:',
        voiceoverResult.voiceover.script,
      )

    }

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
          <div className="input-panel fade-in">
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
                recentLocalStorageKey="aff_recent_local_images_face"
                onLoadError={setError}
                icon={ImageIcon}
              />
              <ImageUploader
                label="Ảnh Sản phẩm (Model mặc sản phẩm)"
                image={productImage}
                onImageChange={setProductImage}
                isPasteTarget={pasteTarget === 'product'}
                onActivatePasteTarget={() => setPasteTarget('product')}
                recentLocalStorageKey="aff_recent_local_images_product"
                onLoadError={setError}
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

            {/* Task 1: SEO */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <MessageSquare /> Nhiệm vụ 1 — SEO TikTok
              </div>
              <p className="ai-task-hint">
                Nhập tên sản phẩm để tạo riêng 3 biến thể tiêu đề chuẩn SEO TikTok, mỗi biến thể có 5 hashtag.
              </p>

              <div className="input-group">
                <label className="input-label" htmlFor="seo-product-name">Tên sản phẩm</label>
                <input
                  id="seo-product-name"
                  type="text"
                  className="input-field"
                  value={seoProductName}
                  onChange={(e) => setSeoProductName(e.target.value)}
                  placeholder="Ví dụ: Áo sơ mi lụa nữ cổ V"
                />
              </div>

              <div className="input-group" style={{ marginBottom: 12 }}>
                <label className="input-label" htmlFor="seo-notes">Yêu cầu thêm (tuỳ chọn)</label>
                <textarea
                  id="seo-notes"
                  className="input-field"
                  value={seoNotes}
                  onChange={(e) => setSeoNotes(e.target.value)}
                  placeholder="Ví dụ: nhấn mạnh form tôn dáng, dễ phối đồ, hợp đi làm"
                  rows={3}
                />
              </div>

              <button
                id="generate-seo-btn"
                className={`btn-generate btn-generate-secondary ${seoLoading ? 'loading' : ''}`}
                onClick={handleGenerateSeo}
                disabled={seoLoading || !canGenerateSeo}
              >
                {seoLoading ? (
                  <>
                    <div className="spinner" />
                    Đang tạo 3 biến thể SEO...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Tạo 3 biến thể SEO + 5 tag
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {seoLoading && (
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: '68%' }} />
                </div>
              )}

              {seoError && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {seoError}
                </div>
              )}
            </div>

            {/* Task 2: Voiceover */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <FileText /> Nhiệm vụ 2 — Kịch bản lồng tiếng
              </div>
              <p className="ai-task-hint">
                Tạo riêng văn mẫu kịch bản lồng tiếng cho video sản phẩm, có cấu trúc theo timeline ngắn.
              </p>

              <div className="input-group">
                <label className="input-label" htmlFor="voiceover-product-name">Tên sản phẩm</label>
                <input
                  id="voiceover-product-name"
                  type="text"
                  className="input-field"
                  value={voiceoverProductName}
                  onChange={(e) => setVoiceoverProductName(e.target.value)}
                  placeholder="Ví dụ: Đầm suông cổ vuông nữ"
                />
              </div>

              <div className="input-group" style={{ marginBottom: 12 }}>
                <label className="input-label" htmlFor="voiceover-notes">Tone/ý chính (tuỳ chọn)</label>
                <textarea
                  id="voiceover-notes"
                  className="input-field"
                  value={voiceoverNotes}
                  onChange={(e) => setVoiceoverNotes(e.target.value)}
                  placeholder="Ví dụ: giọng thân thiện, nhấn vào chất liệu mát và mặc thoải mái"
                  rows={3}
                />
              </div>

              <button
                id="generate-voiceover-btn"
                className={`btn-generate btn-generate-tertiary ${voiceoverLoading ? 'loading' : ''}`}
                onClick={handleGenerateVoiceover}
                disabled={voiceoverLoading || !canGenerateVoiceover}
              >
                {voiceoverLoading ? (
                  <>
                    <div className="spinner" />
                    Đang tạo kịch bản lồng tiếng...
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    Tạo văn mẫu lồng tiếng
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {voiceoverLoading && (
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: '70%' }} />
                </div>
              )}

              {voiceoverError && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {voiceoverError}
                </div>
              )}
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
            <div className="card results-card">
              {!hasAnyResult ? (
                <div className="results-empty">
                  <Film className="results-empty-icon" />
                  <p className="results-empty-text">Chưa có prompt nào</p>
                  <p className="results-empty-hint">
                    Upload ảnh face & sản phẩm, chọn cấu hình, rồi nhấn "Tạo Prompt Package" để bắt đầu.
                  </p>
                  <div className="results-empty-steps">
                    <div className="results-empty-step">
                      <span className="results-empty-step-index">1</span>
                      <p>Tải ảnh Face và ảnh sản phẩm ở panel bên trái</p>
                    </div>
                    <div className="results-empty-step">
                      <span className="results-empty-step-index">2</span>
                      <p>Chọn thời lượng, tỉ lệ và kiểu nội dung phù hợp</p>
                    </div>
                    <div className="results-empty-step">
                      <span className="results-empty-step-index">3</span>
                      <p>Nhấn Generate để xem prompt, SEO và voiceover theo tab</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="card-title">
                    <Sparkles /> {resultsHeader}
                    {result && selectedContentType && selectedContentType !== 'auto' && (
                      <span style={{ marginLeft: 12, fontSize: '0.75rem', opacity: 0.8 }}>
                        (Type: {selectedContentType.toUpperCase()})
                      </span>
                    )}
                  </div>

                  <div className="results-scroll">

                  {/* Timeline */}
                  {result && (
                    <Timeline
                      keyframeCount={durationInfo.keyframes}
                      sceneCount={durationInfo.scenes}
                    />
                  )}

                  {/* Character DNA */}
                  {result && (
                    <div className="dna-section">
                      <div className="dna-title">
                        <Wand2 size={13} /> Character DNA
                        <CopyButton text={result.masterDNA} />
                      </div>
                      <p className="dna-text">{result.masterDNA}</p>
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="tabs">
                    {result && (
                      <button
                        className={`tab ${activeTab === 'keyframes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('keyframes')}
                      >
                        <Camera /> Keyframes ({result.keyframes.length})
                      </button>
                    )}
                    {result && (
                      <button
                        className={`tab ${activeTab === 'scenes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('scenes')}
                      >
                        <Film /> Scenes ({result.scenes.length})
                      </button>
                    )}
                    {seoResult && (
                      <button
                        className={`tab ${activeTab === 'seo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('seo')}
                      >
                        <MessageSquare /> SEO ({seoResult.seoVariants.length})
                      </button>
                    )}
                    {voiceoverResult && (
                      <button
                        className={`tab ${activeTab === 'voiceover' ? 'active' : ''}`}
                        onClick={() => setActiveTab('voiceover')}
                      >
                        <FileText /> Voiceover
                      </button>
                    )}
                    {result && (
                      <button
                        className={`tab ${activeTab === 'image' ? 'active' : ''}`}
                        onClick={() => setActiveTab('image')}
                      >
                        <ImageIcon /> Create Image
                      </button>
                    )}
                    {result && (
                      <button
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                      >
                        <Layers /> Tất cả
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  {result && (activeTab === 'keyframes' || activeTab === 'all') && (
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
                              {/* <strong>SUBJECT:</strong> {kf.subject} */}
                              {'\n'}<strong>Create image 9:16 no split...Faithful character face and body outfit likeness image reference.. </strong> 
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

                  {result && (activeTab === 'scenes' || activeTab === 'all') && (
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

                  {/* SEO Tab */}
                  {seoResult && (activeTab === 'seo' || activeTab === 'all') && (
                    <>
                      {activeTab === 'all' && (
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🧠 Nhiệm vụ 1: SEO TikTok
                        </h3>
                      )}

                      <div className="prompt-card">
                        <div className="prompt-card-header">
                          <div className="prompt-card-badge" style={{ color: 'var(--accent-emerald)' }}>
                            <Sparkles size={14} /> Sản phẩm SEO
                          </div>
                          <span className="prompt-card-time">{seoResult.productName}</span>
                        </div>
                        <div className="prompt-card-body">
                          <div className="prompt-text">
                            <strong>Tạo lúc:</strong> {new Date(seoResult.generatedAt).toLocaleString('vi-VN', { hour12: false })}
                            {'\n'}<strong>Biến thể đang chọn:</strong> {selectedSeoVariant ? `#${selectedSeoVariant.index}` : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {seoResult.seoVariants.map((variant, index) => {
                        const isSelected = selectedSeoVariantIndex === index
                        const copyValue = [
                          `TITLE: ${variant.title}`,
                          `HOOK: ${variant.hook}`,
                          `CTA: ${variant.cta}`,
                          `TAGS: ${variant.tags.join(' ')}`,
                        ].join('\n')

                        return (
                          <div key={variant.index} className={`prompt-card seo-variant-card ${isSelected ? 'selected' : ''}`}>
                            <div className="prompt-card-header">
                              <div className="prompt-card-badge" style={{ color: 'var(--accent-emerald)' }}>
                                <MessageSquare size={14} /> Biến thể SEO {variant.index}
                              </div>
                              <button
                                type="button"
                                className={`seo-select-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedSeoVariantIndex(index)}
                              >
                                {isSelected ? 'Đang chọn' : 'Chọn biến thể'}
                              </button>
                            </div>
                            <div className="prompt-card-body">
                              <CopyButton text={copyValue} />
                              <div className="prompt-text">
                                <strong>TIÊU ĐỀ SEO:</strong> {variant.title}
                                {'\n'}<strong>HOOK:</strong> {variant.hook}
                                {'\n'}<strong>CTA:</strong> {variant.cta}
                                {'\n'}<strong>5 TAG:</strong> {variant.tags.join(' ')}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}

                  {/* Voiceover Tab */}
                  {voiceoverResult && (activeTab === 'voiceover' || activeTab === 'all') && (
                    <>
                      {activeTab === 'all' && (
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🎙️ Nhiệm vụ 2: Kịch bản lồng tiếng
                        </h3>
                      )}

                      <div className="prompt-card">
                        <div className="prompt-card-header">
                          <div className="prompt-card-badge" style={{ color: 'var(--accent-amber)' }}>
                            <Sparkles size={14} /> Sản phẩm voiceover
                          </div>
                          <span className="prompt-card-time">{voiceoverResult.productName}</span>
                        </div>
                        <div className="prompt-card-body">
                          <div className="prompt-text">
                            <strong>Tạo lúc:</strong> {new Date(voiceoverResult.generatedAt).toLocaleString('vi-VN', { hour12: false })}
                          </div>
                        </div>
                      </div>

                      <div className="prompt-card">
                        <div className="prompt-card-header">
                          <div className="prompt-card-badge" style={{ color: 'var(--accent-amber)' }}>
                            <FileText size={14} /> Văn mẫu kịch bản lồng tiếng
                          </div>
                          <span className="prompt-card-time">~{voiceoverResult.voiceover.durationSec}s</span>
                        </div>
                        <div className="prompt-card-body">
                          <CopyButton
                            text={[
                              `STYLE: ${voiceoverResult.voiceover.style}`,
                              `DURATION: ~${voiceoverResult.voiceover.durationSec}s`,
                              '',
                              voiceoverResult.voiceover.script,
                            ].join('\n')}
                          />
                          <div className="prompt-text" style={{ lineHeight: 1.8 }}>
                            <strong>STYLE:</strong> {voiceoverResult.voiceover.style}
                            {'\n'}<strong>SCRIPT:</strong>
                            {'\n'}{voiceoverResult.voiceover.script}
                            {voiceoverResult.voiceover.lines.length > 0 && (
                              <>
                                {'\n\n'}<strong>BEAT TIMELINE:</strong>
                                {'\n'}{voiceoverResult.voiceover.lines.map((line) => `${line.timeRange}: ${line.line}`).join('\n')}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Create Image Prompt Tab */}
                  {result && (activeTab === 'image' || activeTab === 'all') && result.createImagePrompt && (
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
