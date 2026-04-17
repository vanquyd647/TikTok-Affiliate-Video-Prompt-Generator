import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, Image as ImageIcon, Sparkles, Film, Camera, Clock,
  Copy, Check, Download, X, Eye, EyeOff, Clapperboard,
  Layers, ArrowRight, Wand2, FileText, AlertCircle, Ratio,
  Shirt, Star, TrendingUp, MessageSquare, Palette, History, RefreshCw
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
  resolvedContentType?: ResolvedContentType
  affiliateModeUsed?: AffiliateMode
  salesTemplateUsed?: SalesTemplate
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

interface PromptToastState {
  kind: 'loading' | 'success' | 'error'
  message: string
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

interface WorkHistoryPayload {
  action: 'prompt' | 'seo' | 'voiceover'
  model: string
  contentType: string
  notes?: string
  generatedAt: number
  metadata?: Record<string, unknown>
}

interface WorkHistoryItem {
  _id: string
  action: string
  model: string
  contentType: string
  notes: string
  metadata: Record<string, unknown>
  createdAt?: string
  createdAtMs?: number
}

type WorkHistoryActionFilter = 'all' | 'prompt' | 'seo' | 'voiceover'

interface FetchWorkHistoryParams {
  limit?: number
  offset?: number
  action?: WorkHistoryActionFilter
  q?: string
}

interface FetchWorkHistoryResult {
  items: WorkHistoryItem[]
  total: number
  hasMore: boolean
  nextOffset: number
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
  {
    value: 'ootd',
    label: 'OOTD',
    icon: Shirt,
    desc: 'Outfit of the Day',
    color: 'var(--accent-pink)',
    locationStyleKeywords: [
      'mirror',
      'mirrorselfie',
      'mirrorootd',
      'fitcheck',
      'studio',
      'studioshoot',
      'studio corner',
      'fitting room',
      'wardrobe mirror',
      'guong',
      'phong thay do',
      'phong thu do',
      'goc studio',
      'studio mini',
      'dressing room',
    ],
  },
  { value: 'grwm', label: 'GRWM', icon: Star, desc: 'Get Ready With Me', color: 'var(--accent-purple)' },
  {
    value: 'outfitideas',
    label: 'Outfit Ideas',
    icon: Shirt,
    desc: 'Lookbook / Phoi do',
    color: '#22c55e',
    locationStyleKeywords: [
      'mirror',
      'mirrorselfie',
      'mirrorootd',
      'fitcheck',
      'studio',
      'studioshoot',
      'studio corner',
      'fitting room',
      'wardrobe mirror',
      'guong',
      'phong thay do',
      'phong thu do',
      'goc studio',
      'studio mini',
      'dressing room',
    ],
  },
  { value: 'fyp', label: 'FYP', icon: TrendingUp, desc: 'Viral Discovery', color: 'var(--accent-cyan)' },
  { value: 'review', label: 'Review', icon: MessageSquare, desc: 'Product Review', color: 'var(--accent-emerald)' },
  { value: 'tiktokshop', label: 'TikTok Shop', icon: Sparkles, desc: 'Affiliate Conversion', color: '#f97316' },
  { value: 'athleisure', label: 'Athleisure', icon: TrendingUp, desc: 'Gym-to-Café Styling', color: '#10b981' },
  { value: 'haul', label: 'Haul', icon: Layers, desc: 'Try-On / Collection Showcase', color: '#f59e0b' },
  { value: 'styling', label: 'Styling', icon: Wand2, desc: 'Fashion Styling Tips', color: '#ec4899' },
  { value: 'luxury', label: 'Luxury', icon: Star, desc: 'Old Money / Sophisticated', color: '#8b5cf6' },
] as const

type ContentType = typeof CONTENT_TYPES[number]['value']
type ResolvedContentType = Exclude<ContentType, 'auto'>
type AffiliateMode = 'balanced' | 'strict'
type SalesTemplate = 'hard' | 'soft'
type ProductLocationHistoryMap = Record<string, string[]>
type OutfitTypeLocationHistoryMap = Partial<Record<ResolvedContentType, string[]>>

const AFF_STORAGE_DB_NAME = 'aff_prompt_storage'
const AFF_STORAGE_DB_VERSION = 1
const AFF_STORAGE_STORE = 'recent_local_images'
const PRODUCT_LOCATION_HISTORY_STORAGE_KEY = 'aff_product_location_history_v1'
const OUTFIT_TYPE_LOCATION_HISTORY_STORAGE_KEY = 'aff_outfit_type_location_history_v1'
const MAX_LOCATION_HISTORY_PER_PRODUCT = 40
const MAX_LOCATION_HISTORY_PER_OUTFIT_TYPE = 40
const PROMPT_LOADING_STAGES = [
  'AI đang phân tích ảnh khuôn mặt...',
  'AI đang phân tích ảnh sản phẩm...',
  'AI đang dựng keyframe và scene prompts...',
  'AI đang tối ưu prompt đầu ra...',
] as const

const FIXED_AFFILIATE_MODE: AffiliateMode = 'strict'
const FIXED_SALES_TEMPLATE: SalesTemplate = 'soft'
const FIXED_STRATEGY_LABEL = 'TikTok Shop Core (Strict AUTO + Soft Sell)'
const FIXED_STRATEGY_DESC = 'Khoa AUTO ve nhom convert cao va giu tone trust-first de ban ben vung.'

const RESOLVED_CONTENT_TYPES: ResolvedContentType[] = [
  'ootd',
  'grwm',
  'outfitideas',
  'fyp',
  'review',
  'tiktokshop',
  'athleisure',
  'haul',
  'styling',
  'luxury',
]

const STRICT_AUTO_ALLOWED_TYPES: ResolvedContentType[] = ['tiktokshop', 'outfitideas', 'review', 'ootd']

const ALLOWED_LOCATION_KEYWORDS = [
  'vietnam',
  'viet nam',
  'hanoi',
  'ho chi minh',
  'saigon',
  'da nang',
  'danang',
  'nha trang',
  'hai phong',
  'can tho',
  'hue',
  'china',
  'trung quoc',
  'beijing',
  'shanghai',
  'guangzhou',
  'shenzhen',
  'chengdu',
  'hangzhou',
  'chongqing',
  'wuhan',
  'nanjing',
  'xiamen',
  'tianjin',
  'south korea',
  'han quoc',
  'seoul',
  'busan',
  'incheon',
  'daegu',
  'daejeon',
  'gwangju',
  'jeju',
  'suwon',
  'ulsan',
]

const AFFILIATE_VIDEO_OBJECTIVES: Record<ResolvedContentType, string> = {
  ootd: 'Prioritize clean outfit readability and aspirational styling while keeping product details purchase-relevant.',
  grwm: 'Build trust through natural routine storytelling, then transition clearly to product desire and purchase intent.',
  outfitideas: 'Deliver practical lookbook combinations users can copy immediately, with clear value for saving/sharing and buying.',
  fyp: 'Create high-retention viral pacing but still preserve product clarity and affiliate conversion direction.',
  review: 'Lead with honest product proof, fit/material verification, and credible recommendation cues.',
  tiktokshop: 'Maximize conversion for TikTok Shop: strong hook, product proof, objection handling, and explicit buy-now CTA.',
  athleisure: 'Show movement comfort and styling versatility from active to casual settings, tied to practical purchase value.',
  haul: 'Showcase variety and excitement with clear piece-by-piece value, fit proof, and purchasing motivation.',
  styling: 'Teach actionable styling transformations that position the product as a high-utility wardrobe solution.',
  luxury: 'Communicate premium quality, silhouette precision, and refined aspirational value that justifies purchase.',
}

function buildSalesTemplateRules(salesTemplate: SalesTemplate): string {
  if (salesTemplate === 'hard') {
    return `HARD SELL TEMPLATE (A):
- Emphasize urgency cues (limited stock, deal window, hot trend now).
- Use direct buying language and stronger conversion energy.
- Keep pacing punchy and outcome-oriented.`
  }

  return `SOFT SELL TEMPLATE (B):
- Lead with trust, comfort, and practical daily utility.
- Use recommendation tone before direct CTA.
- Keep language natural, friendly, and less aggressive while still conversion-focused.`
}

function buildSeoToneHint(salesTemplate: SalesTemplate): string {
  return salesTemplate === 'hard'
    ? 'SEO tone: stronger urgency and deal-forward copy, but avoid spammy claims.'
    : 'SEO tone: trust-led and benefit-led copy with softer CTA and natural persuasion.'
}

function buildVoiceoverToneHint(salesTemplate: SalesTemplate): string {
  return salesTemplate === 'hard'
    ? 'Voiceover tone: energetic and conversion-forward with clear urgency cues.'
    : 'Voiceover tone: warm, trustworthy, and relatable with softer recommendation flow.'
}

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
  outfitideas: [
    { name: 'LOOKBOOK HOOK', emoji: '📌', cameraHint: 'Quick full-body reveal with clean framing for instant outfit read' },
    { name: 'BASE PIECE FOCUS', emoji: '👚', cameraHint: 'Medium shot highlighting hero garment and fit details' },
    { name: 'MIX-AND-MATCH TRANSITION', emoji: '🔁', cameraHint: 'Smooth transition shot swapping layers/accessories' },
    { name: 'SITUATION STYLING', emoji: '👜', cameraHint: 'Lifestyle framing showing office/date/cafe-ready variation' },
    { name: 'DETAILS THAT SELL', emoji: '✨', cameraHint: 'Close-up on texture, silhouette, and finishing details' },
    { name: 'SAVEABLE FINAL LOOK', emoji: '🎬', cameraHint: 'Clean final look hold with polished full-body composition' },
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
  tiktokshop: [
    { name: 'PRODUCT HOOK + PRICE SIGNAL', emoji: '🛍️', cameraHint: 'Immediate hero shot with strong product readability' },
    { name: 'FIT & MATERIAL PROOF', emoji: '🧵', cameraHint: 'Close-up to medium transitions proving fabric and fit' },
    { name: 'TRY-ON VALUE MOMENT', emoji: '👗', cameraHint: 'Full-body movement emphasizing versatility and comfort' },
    { name: 'SOCIAL PROOF VISUAL', emoji: '⭐', cameraHint: 'Lifestyle framing with confident model reaction beat' },
    { name: 'BUYING OBJECTION HANDLER', emoji: '✅', cameraHint: 'Detail-focused shot answering size/quality concerns' },
    { name: 'CTA CLOSER', emoji: '🎬', cameraHint: 'Clean end frame optimized for tap-to-shop conversion' },
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
    outfitideas: 'Practical lookbook aesthetic, mix-and-match styling with daily wear context',
    fyp: 'Trending viral aesthetic, high-fashion editorial with cinematic flair',
    review: 'Authentic product review style, natural lighting, trustworthy feel',
    tiktokshop: 'Conversion-focused TikTok Shop style, product clarity, social proof, and CTA-driven framing',
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
    outfitideas: 'Outfit Ideas — lookbook format with practical mix-and-match inspiration',
    fyp: 'FYP (For You Page) — viral trending aesthetic with dramatic fashion presentation',
    review: 'Product Review — authentic product showcase highlighting garment quality and details',
    tiktokshop: 'TikTok Shop Affiliate — conversion-focused showcase with clear purchase motivation',
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
  contentType === 'tiktokshop' ? 'Conversion-focused showcase with clear value proposition and buy-now momentum.' :
  contentType === 'outfitideas' ? 'Lookbook inspiration style with practical daily styling guidance.' :
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

function isAllowedLocationCountry(value: string): boolean {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return false

  return ALLOWED_LOCATION_KEYWORDS.some((keyword) => normalized.includes(keyword))
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

function normalizeLocationList(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  )
}

function loadProductLocationHistory(): ProductLocationHistoryMap {
  try {
    const raw = localStorage.getItem(PRODUCT_LOCATION_HISTORY_STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    const normalized: ProductLocationHistoryMap = {}
    for (const [productImageId, value] of Object.entries(parsed as Record<string, unknown>)) {
      const locations = normalizeLocationList(value)

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

function loadOutfitTypeLocationHistory(): OutfitTypeLocationHistoryMap {
  try {
    const raw = localStorage.getItem(OUTFIT_TYPE_LOCATION_HISTORY_STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    const normalized: OutfitTypeLocationHistoryMap = {}
    for (const [outfitType, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!RESOLVED_CONTENT_TYPES.includes(outfitType as ResolvedContentType)) continue

      const locations = normalizeLocationList(value)
      if (locations.length > 0) {
        normalized[outfitType as ResolvedContentType] = locations.slice(0, MAX_LOCATION_HISTORY_PER_OUTFIT_TYPE)
      }
    }

    return normalized
  } catch {
    return {}
  }
}

function saveOutfitTypeLocationHistory(history: OutfitTypeLocationHistoryMap): void {
  try {
    localStorage.setItem(OUTFIT_TYPE_LOCATION_HISTORY_STORAGE_KEY, JSON.stringify(history))
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
  usedLocationsForProduct: string[] = [],
  usedLocationsByOutfitType: OutfitTypeLocationHistoryMap = {},
  affiliateMode: AffiliateMode = 'balanced',
  salesTemplate: SalesTemplate = 'hard'
): Promise<GenerateResult> {
  const durationInfo = DURATIONS.find(d => d.value === duration)!
  const { scenes: sceneCount, keyframes: keyframeCount } = durationInfo

  // Determine final content type (if 'auto', AI will decide)
  const isAuto = contentType === 'auto'
  const contentTypeForPrompt = isAuto ? '(AI will automatically determine the best type)' : contentType.toUpperCase()
  const affiliateModeLabel = affiliateMode === 'strict' ? 'STRICT' : 'BALANCED'
  const salesTemplateLabel = salesTemplate === 'hard' ? 'HARD_SELL (A)' : 'SOFT_SELL (B)'
  const affiliateObjective = isAuto
    ? 'In AUTO mode, prioritize types that improve affiliate conversion for women fashion (tiktokshop, outfitideas, ootd, review) before generic viral framing.'
    : AFFILIATE_VIDEO_OBJECTIVES[contentType as ResolvedContentType]
  const autoModeRule = affiliateMode === 'strict'
    ? 'STRICT AUTO MODE: only allow conversion-oriented types (tiktokshop, outfitideas, review, ootd). If uncertain, default to tiktokshop.'
    : 'BALANCED AUTO MODE: allow broader creative variety but still prioritize conversion-friendly fashion formats.'
  const salesTemplateRules = buildSalesTemplateRules(salesTemplate)
  const affiliateExecutionRules = `
AFFILIATE CONVERSION OBJECTIVE:
${affiliateObjective}

AFFILIATE MODE:
${affiliateModeLabel}
${autoModeRule}

SALES TEMPLATE:
${salesTemplateLabel}
${salesTemplateRules}

AFFILIATE EXECUTION RULES:
- Scene 1 must create a clear scroll-stopping hook within the first 1.5 seconds while keeping garment visible.
- Across all scenes, garment/product visibility should remain high and details must be readable for purchase decisions.
- Include at least one proof cue: fit demonstration, fabric/texture close-up, real-life usage, or social-proof style reaction.
- Final scene must end with explicit purchase intent framing (buy now, check link/cart, limited stock, deal urgency) in narrative language.
- Avoid overly abstract cinematic framing that reduces product clarity.`
  const diversitySeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const normalizeLocationsForPrompt = (locations: unknown) => normalizeLocationList(locations)

  const normalizedUsedLocationsForProduct = normalizeLocationsForPrompt(usedLocationsForProduct)
  const normalizedUsedLocationsByOutfitType = RESOLVED_CONTENT_TYPES.reduce<OutfitTypeLocationHistoryMap>((acc, outfitType) => {
    const normalized = normalizeLocationsForPrompt(usedLocationsByOutfitType[outfitType])
    if (normalized.length > 0) {
      acc[outfitType] = normalized
    }
    return acc
  }, {})

  const formatLocationsForPrompt = (locations: string[]) => locations.map((location, index) => `${index + 1}. ${location}`).join('\n')

  const usedLocationsProductPrompt = normalizedUsedLocationsForProduct.length > 0
    ? formatLocationsForPrompt(normalizedUsedLocationsForProduct)
    : 'None yet for this product image ID'

  const usedLocationsOutfitTypePrompt = isAuto
    ? (() => {
      const lines = RESOLVED_CONTENT_TYPES
        .map((outfitType) => {
          const locations = normalizedUsedLocationsByOutfitType[outfitType] || []
          if (locations.length === 0) return ''
          return `${outfitType.toUpperCase()}:\n${formatLocationsForPrompt(locations)}`
        })
        .filter((item) => item.length > 0)

      return lines.length > 0
        ? lines.join('\n\n')
        : 'None yet for any outfit type'
    })()
    : (() => {
      const selectedType = contentType as ResolvedContentType
      const locations = normalizedUsedLocationsByOutfitType[selectedType] || []
      return locations.length > 0
        ? formatLocationsForPrompt(locations)
        : `None yet for outfit type ${selectedType.toUpperCase()}`
    })()
  const safeJsonStringify = (value: unknown) => {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return '{}'
    }
  }

  const pipelineStartedAt = Date.now()
  const stageMetrics: Array<{ stage: string; attempt: number; durationMs: number; ok: boolean; note?: string }> = []
  const validResolvedTypes: ResolvedContentType[] = ['ootd', 'grwm', 'outfitideas', 'fyp', 'review', 'tiktokshop', 'athleisure', 'haul', 'styling', 'luxury']

  const asRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

  const toSafeText = (value: unknown, fallback = '') => {
    if (typeof value !== 'string') return fallback
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : fallback
  }

  const toSafeTextList = (value: unknown, maxItems = 12): string[] => {
    if (!Array.isArray(value)) return []

    return Array.from(new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )).slice(0, maxItems)
  }

  const validateVisualExtract = (value: Record<string, unknown>): { ok: boolean; reason?: string } => {
    if (!asRecord(value)) return { ok: false, reason: 'visual extract is not an object' }

    const garmentFacts = asRecord(value.garmentFacts) ? value.garmentFacts : null
    if (!garmentFacts) return { ok: false, reason: 'missing garmentFacts' }

    const hasCategory = toSafeText(garmentFacts.category).length > 0
    const hasColor = toSafeText(garmentFacts.primaryColor).length > 0
    const hasDetails = toSafeTextList(garmentFacts.keyDetails).length > 0

    if (!hasCategory || !hasColor || !hasDetails) {
      return { ok: false, reason: 'garmentFacts lacks category/color/keyDetails' }
    }

    return { ok: true }
  }

  const normalizeVisualExtract = (value: Record<string, unknown>) => {
    const record = asRecord(value) ? value : {}
    const garmentFactsRaw = asRecord(record.garmentFacts) ? record.garmentFacts : {}

    return {
      faceIdentity: toSafeText(record.faceIdentity, 'Preserve face identity consistently across all keyframes.'),
      bodyProfile: toSafeText(record.bodyProfile, 'Maintain stable body proportions and natural posture consistency.'),
      garmentFacts: {
        category: toSafeText(garmentFactsRaw.category, 'fashion garment'),
        primaryColor: toSafeText(garmentFactsRaw.primaryColor, 'preserve reference color exactly'),
        secondaryColors: toSafeTextList(garmentFactsRaw.secondaryColors, 5),
        material: toSafeText(garmentFactsRaw.material, 'preserve reference material texture'),
        silhouette: toSafeText(garmentFactsRaw.silhouette, 'preserve reference silhouette'),
        keyDetails: toSafeTextList(garmentFactsRaw.keyDetails, 10),
        doNotAlter: toSafeTextList(garmentFactsRaw.doNotAlter, 10),
      },
      styleSignals: toSafeTextList(record.styleSignals, 12),
      riskFlags: toSafeTextList(record.riskFlags, 12),
    }
  }

  const normalizePlanningResult = (value: Record<string, unknown>) => {
    const record = asRecord(value) ? value : {}
    const recommendedRaw = toSafeText(record.recommendedContentType, '').toLowerCase()
    const recommendedContentType = validResolvedTypes.includes(recommendedRaw as ResolvedContentType)
      ? recommendedRaw
      : ''

    const styleLockRaw = toSafeText(record.styleLock, 'flex').toLowerCase()
    const styleLock = ['mirror', 'studio', 'flex'].includes(styleLockRaw) ? styleLockRaw : 'flex'

    return {
      recommendedContentType,
      creativeDirection: toSafeText(record.creativeDirection, ''),
      storyArc: toSafeTextList(record.storyArc, 6),
      locationCandidates: toSafeTextList(record.locationCandidates, 10),
      cameraLanguage: toSafeTextList(record.cameraLanguage, 10),
      lightingDirection: toSafeText(record.lightingDirection, ''),
      styleLock,
      mustInclude: toSafeTextList(record.mustInclude, 12),
      avoid: toSafeTextList(record.avoid, 12),
    }
  }

  const validatePlanningResult = (value: Record<string, unknown>): { ok: boolean; reason?: string } => {
    if (!asRecord(value)) return { ok: false, reason: 'planning result is not an object' }

    const normalized = normalizePlanningResult(value)
    const hasDirection = normalized.creativeDirection.length > 0 || normalized.storyArc.length >= 3
    const hasLocationPlan = normalized.locationCandidates.length > 0
    const hasCameraOrLighting = normalized.cameraLanguage.length > 0 || normalized.lightingDirection.length > 0

    if (!hasDirection) {
      return { ok: false, reason: 'planning lacks creative direction/story arc' }
    }

    if (!hasLocationPlan) {
      return { ok: false, reason: 'planning lacks location candidates' }
    }

    if (!hasCameraOrLighting) {
      return { ok: false, reason: 'planning lacks camera/lighting strategy' }
    }

    return { ok: true }
  }

  const getPackageCompletenessScore = (
    value: Record<string, unknown>,
    expectedKeyframes: number,
    expectedScenes: number,
  ): number => {
    if (!asRecord(value)) return 0
    const keyframes = Array.isArray(value.keyframes) ? value.keyframes : []
    const scenes = Array.isArray(value.scenes) ? value.scenes : []
    if (keyframes.length === 0 || scenes.length === 0) return 0

    const keyframeShapeScore = Math.min(keyframes.length / expectedKeyframes, 1)
    const sceneShapeScore = Math.min(scenes.length / expectedScenes, 1)

    const keyframeFieldCoverage = keyframes.reduce((acc, item) => {
      if (!asRecord(item)) return acc
      let score = 0
      if (toSafeText(item.action).length > 0) score += 1
      if (toSafeText(item.location).length > 0) score += 1
      if (toSafeText(item.camera).length > 0) score += 1
      if (toSafeText(item.lighting).length > 0) score += 1
      if (toSafeText(item.style).length > 0) score += 1
      return acc + score / 5
    }, 0) / Math.max(keyframes.length, 1)

    const sceneFieldCoverage = scenes.reduce((acc, item) => {
      if (!asRecord(item)) return acc
      let score = 0
      if (toSafeText(item.narrative).length > 0) score += 1
      if (toSafeText(item.cameraMovement).length > 0) score += 1
      if (toSafeText(item.startPose).length > 0) score += 1
      if (toSafeText(item.endPose).length > 0) score += 1
      return acc + score / 4
    }, 0) / Math.max(scenes.length, 1)

    return (keyframeShapeScore * 0.3) + (sceneShapeScore * 0.2) + (keyframeFieldCoverage * 0.25) + (sceneFieldCoverage * 0.25)
  }

  const validatePackageShape = (
    value: Record<string, unknown>,
    expectedKeyframes: number,
    expectedScenes: number,
    minScore = 0.62,
  ): { ok: boolean; reason?: string } => {
    const keyframes = Array.isArray(value.keyframes) ? value.keyframes : []
    const scenes = Array.isArray(value.scenes) ? value.scenes : []

    if (keyframes.length !== expectedKeyframes || scenes.length !== expectedScenes) {
      return {
        ok: false,
        reason: `shape mismatch keyframes=${keyframes.length}/${expectedKeyframes}, scenes=${scenes.length}/${expectedScenes}`,
      }
    }

    const score = getPackageCompletenessScore(value, expectedKeyframes, expectedScenes)
    if (score < minScore) {
      return { ok: false, reason: `low completeness score ${score.toFixed(2)} < ${minScore}` }
    }

    return { ok: true }
  }

  const runStage = async (
    stage: string,
    temperatures: number[],
    maxOutputTokens: number,
    caller: (temperature: number, maxTokens: number) => Promise<Record<string, unknown>>,
    validator?: (value: Record<string, unknown>) => { ok: boolean; reason?: string },
  ): Promise<Record<string, unknown>> => {
    let lastError: unknown = null

    for (let i = 0; i < temperatures.length; i += 1) {
      const temperature = temperatures[i]
      const attempt = i + 1
      const started = Date.now()

      try {
        const output = await caller(temperature, maxOutputTokens)
        const validation = validator ? validator(output) : { ok: true }
        if (!validation.ok) {
          throw new Error(validation.reason || `${stage} validation failed`)
        }

        stageMetrics.push({
          stage,
          attempt,
          durationMs: Date.now() - started,
          ok: true,
          note: `temp=${temperature.toFixed(2)}`,
        })

        return output
      } catch (error) {
        lastError = error
        stageMetrics.push({
          stage,
          attempt,
          durationMs: Date.now() - started,
          ok: false,
          note: error instanceof Error ? error.message : `${error}`,
        })
      }
    }

    const reason = lastError instanceof Error ? lastError.message : `${lastError || 'unknown error'}`
    throw new Error(`${stage} failed after ${temperatures.length} attempts: ${reason}`)
  }

  // Shared image references for multimodal calls.
  const referenceParts: GeminiContentPart[] = []
  if (faceImage) {
    const base64 = faceImage.split(',')[1] || faceImage
    referenceParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    })
    referenceParts.push({
      text: 'FACE REFERENCE: identity-only. Preserve facial features, skin tone, hairstyle. Ignore background/location/props from this image.',
    })
  }

  if (productImage) {
    const base64 = productImage.split(',')[1] || productImage
    referenceParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    })
    referenceParts.push({
      text: 'GARMENT REFERENCE: preserve exact product details (color/material/silhouette/key details) in all keyframes.',
    })
  }

  try {
    // STAGE 1 — VISUAL EXTRACT
    const visualExtractPrompt = `You are a senior fashion vision analyst.

Analyze the provided face + garment references and return STRICT JSON only:
{
  "faceIdentity": "short identity lock summary",
  "bodyProfile": "short body proportion and posture lock summary",
  "garmentFacts": {
    "category": "...",
    "primaryColor": "...",
    "secondaryColors": ["..."],
    "material": "...",
    "silhouette": "...",
    "keyDetails": ["..."],
    "doNotAlter": ["..."]
  },
  "styleSignals": ["..."],
  "riskFlags": ["..."]
}

Rules:
- Be concrete and concise.
- Do not invent unavailable details.
- Focus on preserving identity and garment fidelity.
${notes ? `USER NOTES: ${notes}` : ''}`

    const visualAnalysisRaw = await runStage(
      'visual_extract',
      [0.35, 0.24],
      3072,
      (temperature, maxTokens) => requestGeminiJsonWithParts(
        apiKey,
        model,
        [...referenceParts, { text: visualExtractPrompt }],
        temperature,
        maxTokens,
      ),
      validateVisualExtract,
    )
    const visualAnalysis = normalizeVisualExtract(visualAnalysisRaw)

    // STAGE 2 — CREATIVE PLAN
    const planningPrompt = `You are a TikTok affiliate fashion creative planner.

INPUT CONTEXT:
- Duration: ${duration}s
- Aspect ratio: ${aspectRatio}
- Requested content type: ${contentTypeForPrompt}
- Affiliate mode: ${affiliateModeLabel}
- Sales template: ${salesTemplateLabel}
- Diversity seed: ${diversitySeed}

VISUAL ANALYSIS JSON:
${safeJsonStringify(visualAnalysis)}

LOCATIONS ALREADY USED FOR THIS PRODUCT IMAGE ID (MUST AVOID REUSE):
${usedLocationsProductPrompt}

LOCATIONS ALREADY USED FOR SAME OUTFIT TYPE (MUST AVOID REUSE):
${usedLocationsOutfitTypePrompt}

RULES:
- Location scope: Vietnam, China, South Korea only.
- No duplicate locations against history lists above.
- For OOTD/OutfitIdeas, choose mirror-fitcheck OR single-corner studio and keep style consistent.
- Plan for retention arc: Hook -> Value -> Proof -> CTA.

Output STRICT JSON only:
{
  ${isAuto ? '"recommendedContentType": "ootd|grwm|outfitideas|fyp|review|tiktokshop|athleisure|haul|styling|luxury",' : '"recommendedContentType": "same-as-requested",'}
  "creativeDirection": "...",
  "storyArc": ["hook", "value", "proof", "cta"],
  "locationCandidates": ["..."],
  "cameraLanguage": ["..."],
  "lightingDirection": "...",
  "styleLock": "mirror|studio|flex",
  "mustInclude": ["..."],
  "avoid": ["..."]
}`

    const planningResultRaw = await runStage(
      'creative_plan',
      [0.68, 0.52],
      4096,
      (temperature, maxTokens) => requestGeminiJson(apiKey, model, planningPrompt, temperature, maxTokens),
      validatePlanningResult,
    )
    const planningResult = normalizePlanningResult(planningResultRaw)

    let finalContentType: ContentType = contentType as ContentType
    if (isAuto && planningResult.recommendedContentType.length > 0) {
      const recommended = planningResult.recommendedContentType.toLowerCase()
      if (validResolvedTypes.includes(recommended as ResolvedContentType)) {
        finalContentType = recommended as ContentType
      }

      if (finalContentType === 'fyp') {
        finalContentType = 'outfitideas'
      }

      if (affiliateMode === 'strict' && !STRICT_AUTO_ALLOWED_TYPES.includes(finalContentType as ResolvedContentType)) {
        finalContentType = 'tiktokshop'
      }
    }

    if (finalContentType === 'auto') {
      finalContentType = affiliateMode === 'strict' ? 'tiktokshop' : 'outfitideas'
    }

    const affiliateObjectiveForFinal = AFFILIATE_VIDEO_OBJECTIVES[finalContentType as ResolvedContentType]

    // STAGE 3 — PACKAGE GENERATION
    const generationPrompt = `You are an expert AI video prompt engineer specializing in TikTok affiliate fashion videos.

Generate a COMPLETE prompt package for a ${duration}-second video with:
- ${keyframeCount} keyframe image prompts (${sceneCount} scenes => n+1 keyframes)
- ${sceneCount} scene prompts for Veo 3.1 (8s each, first-frame -> last-frame)
- Aspect ratio: ${aspectRatio}
- LOCKED content type: ${finalContentType.toUpperCase()}

AFFILIATE OBJECTIVE:
${affiliateObjectiveForFinal}

${affiliateExecutionRules}

VISUAL ANALYSIS JSON:
${safeJsonStringify(visualAnalysis)}

CREATIVE PLAN JSON:
${safeJsonStringify(planningResult)}

LOCATION CONSTRAINTS:
- Scope must remain Vietnam, China, South Korea.
- Avoid all used locations in history.
- Keep location continuity unless a clear narrative transition is needed.

QUALITY RULES:
1. Character identity must be consistent across all keyframes.
2. Garment fidelity must be exact from product reference.
3. Camera grammar must be coherent (one dominant move per scene).
4. Motion continuity across scene boundaries is mandatory.
5. Product readability must stay high in every scene.
6. Retention pacing: meaningful progression every 1-2 seconds.
7. OOTD/OutfitIdeas must keep mirror or studio lock consistently.

${notes ? `USER NOTES: ${notes}` : ''}

Return STRICT JSON only in this schema:
{
  "masterDNA": "character consistency description",
  "keyframes": [
    {
      "index": 0,
      "timestamp": "0s",
      "subject": "face/body preservation instruction",
      "action": "pose/movement description",
      "location": "real location (city/area + venue details in Vietnam/China/South Korea)",
      "camera": "lens, shot type, angle",
      "lighting": "lighting setup",
      "style": "photography style"
    }
  ],
  "scenes": [
    {
      "index": 0,
      "timeRange": "0s-8s",
      "narrative": "scene description with retention beat",
      "startPose": "starting keyframe pose",
      "endPose": "ending keyframe pose",
      "cameraMovement": "camera movement description"
    }
  ]
}`

    const draftPackage = await runStage(
      'package_generation',
      [0.82, 0.74],
      8192,
      (temperature, maxTokens) => requestGeminiJsonWithParts(
        apiKey,
        model,
        [...referenceParts, { text: generationPrompt }],
        temperature,
        maxTokens,
      ),
      (value) => validatePackageShape(value, keyframeCount, sceneCount, 0.62),
    )

    // STAGE 4 — QA + REPAIR
    const qaRepairPrompt = `You are a strict QA + repair model for TikTok fashion video prompt packages.

Validate and repair the draft package to satisfy all constraints:
- location scope must be Vietnam/China/South Korea
- no obvious duplicate location/action/camera repetition
- continuity between keyframes and scenes
- product readability and conversion framing quality
- mirror/studio consistency for OOTD/OutfitIdeas

DRAFT PACKAGE JSON:
${safeJsonStringify(draftPackage)}

Return STRICT JSON only, same schema:
{
  "masterDNA": "...",
  "keyframes": [ ... ],
  "scenes": [ ... ]
}`

    const draftQualityScore = getPackageCompletenessScore(draftPackage, keyframeCount, sceneCount)
    let parsed: Record<string, unknown> = draftPackage
    try {
      const repairedPackage = await runStage(
        'qa_repair',
        [0.45, 0.32],
        8192,
        (temperature, maxTokens) => requestGeminiJson(apiKey, model, qaRepairPrompt, temperature, maxTokens),
        (value) => validatePackageShape(value, keyframeCount, sceneCount, 0.65),
      )
      const repairedQualityScore = getPackageCompletenessScore(repairedPackage, keyframeCount, sceneCount)

      if (repairedQualityScore >= draftQualityScore - 0.02) {
        parsed = repairedPackage
      }
    } catch {
      // If QA repair fails, fallback to draft package to keep generation flow resilient.
      parsed = draftPackage
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

    const locationFallbackNonce = Math.random().toString(36).slice(2, 8)
    const usedLocationsForFinalOutfitType = normalizedUsedLocationsByOutfitType[finalContentType as ResolvedContentType] || []
    const blockedLocationKeys = new Set(
      [...normalizedUsedLocationsForProduct, ...usedLocationsForFinalOutfitType]
        .map((location) => normalizeLocationKey(location))
    )
    const usedLocationKeysInRun = new Set<string>()
    const matchedContentType = CONTENT_TYPES.find((type) => type.value === finalContentType)
    const locationStyleKeywordsForType: string[] = matchedContentType && 'locationStyleKeywords' in matchedContentType
      ? [...matchedContentType.locationStyleKeywords]
      : []
    const requiresContentTypeLocationPattern = locationStyleKeywordsForType.length > 0

    const markLocationUsed = (location: string) => {
      usedLocationKeysInRun.add(normalizeLocationKey(location))
      return location
    }

    const regionalFallbackLocations = [
      'Full-length dressing mirror corner, Hoan Kiem, Hanoi, Vietnam',
      'Minimal softbox studio corner, District 7, Ho Chi Minh City, Vietnam',
      'Boutique fitting-mirror zone, Xintiandi, Shanghai, China',
      'Neutral cyclorama studio corner, Chaoyang, Beijing, China',
      'Wardrobe mirror fitcheck corner, Seongsu, Seoul, South Korea',
      'Clean portrait studio corner, Haeundae, Busan, South Korea',
    ]

    const pickLocationFallback = (index: number) => {
      const seedLocation = regionalFallbackLocations[index % regionalFallbackLocations.length]
      const fallback = `${seedLocation} [fallback-${index + 1}-${locationFallbackNonce}]`
      return markLocationUsed(fallback)
    }

    const ensureRealLocation = (value: unknown, index: number) => {
      const candidate = toSafeString(value, '')
      if (candidate.length > 0) {
        const candidateKey = normalizeLocationKey(candidate)
        const matchesContentTypeLocationPattern = !requiresContentTypeLocationPattern
          || locationStyleKeywordsForType.some((keyword: string) => candidateKey.includes(keyword))

        if (
          isAllowedLocationCountry(candidate)
          && matchesContentTypeLocationPattern
          && !blockedLocationKeys.has(candidateKey)
          && !usedLocationKeysInRun.has(candidateKey)
        ) {
          return markLocationUsed(candidate)
        }
      }
      return pickLocationFallback(index)
    }

    const fallbackActionByType: Record<Exclude<ContentType, 'auto'>, string> = {
      ootd: 'Confident outfit showcase pose and movement tailored for OOTD storytelling',
      grwm: 'Natural getting-ready movement that highlights styling steps and final look',
      outfitideas: 'Practical mix-and-match outfit demonstration with clear style transformation',
      fyp: 'Scroll-stopping fashion movement with dynamic pose transition',
      review: 'Authentic product demonstration pose emphasizing fit and material quality',
      tiktokshop: 'Conversion-focused product showcase movement optimized for TikTok Shop CTA',
      athleisure: 'Energetic gym-to-café transition movement with sporty-chic confidence',
      haul: 'Excited try-on movements showcasing product fit and styling versatility',
      styling: 'Purposeful modeling pose highlighting outfit coordination and styling impact',
      luxury: 'Composed understated movement exuding timeless elegance and quiet confidence',
    }

    const fallbackStyleByType: Record<Exclude<ContentType, 'auto'>, string> = {
      ootd: 'Professional fashion editorial, OOTD TikTok aesthetic',
      grwm: 'Warm lifestyle GRWM visual style, intimate and clean',
      outfitideas: 'Practical outfit idea lookbook, clean visual hierarchy and wearable styling cues',
      fyp: 'Viral cinematic fashion style with bold visual energy',
      review: 'Trustworthy product review style with high material clarity',
      tiktokshop: 'TikTok Shop conversion style with product clarity, social proof, and urgency cues',
      athleisure: 'Urban sporty-chic lifestyle photography, natural daylight',
      haul: 'Energetic colorful unboxing and try-on aesthetic, dynamic lighting',
      styling: 'Expert fashion editorial style, polished and educational',
      luxury: 'Old money sophisticated aesthetic, understated timeless elegance, neutral palette',
    }

    const inferredCameraFallback = 'AI-selected framing, lens, and movement optimized for fashion storytelling'
    const inferredLightingFallback = 'Lighting inferred from scene mood and garment texture visibility'

    // Build full prompts for each keyframe and scene
    const keyframes: KeyframePrompt[] = rawKeyframes.map((kf: any, i: number) => {
      const subject = `Create image ${aspectRatio} no split-screen. Faithful character face and body outfit likeness image reference.`
      const action = toSafeString(kf.action, fallbackActionByType[finalContentType as Exclude<ContentType, 'auto'>])
      const location = ensureRealLocation(kf.location, i)
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

    const totalPipelineMs = Date.now() - pipelineStartedAt
    console.info('[GeminiVideoPipeline] success', {
      model,
      duration,
      aspectRatio,
      requestedContentType: contentType,
      resolvedContentType: finalContentType,
      totalPipelineMs,
      stageMetrics,
    })

    return {
      masterDNA: typeof parsed.masterDNA === 'string' && parsed.masterDNA.trim().length > 0
        ? parsed.masterDNA
        : buildCharacterDNA(notes, finalContentType as Exclude<ContentType, 'auto'>),
      keyframes,
      scenes,
      resolvedContentType: finalContentType as ResolvedContentType,
      affiliateModeUsed: affiliateMode,
      salesTemplateUsed: salesTemplate,
    }
  } catch (error: any) {
    const totalPipelineMs = Date.now() - pipelineStartedAt
    console.error('[GeminiVideoPipeline] failure', {
      model,
      duration,
      aspectRatio,
      requestedContentType: contentType,
      totalPipelineMs,
      stageMetrics,
      error: error instanceof Error ? error.message : `${error}`,
    })
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

type GeminiContentPart = { text: string } | { inlineData: { mimeType: string; data: string } }

async function requestGeminiJsonWithParts(
  apiKey: string,
  model: string,
  parts: GeminiContentPart[],
  temperature = 0.9,
  maxOutputTokens = 4096
): Promise<Record<string, unknown>> {
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

async function requestGeminiJson(
  apiKey: string,
  model: string,
  systemPrompt: string,
  temperature = 0.9,
  maxOutputTokens = 4096
): Promise<Record<string, unknown>> {
  return requestGeminiJsonWithParts(
    apiKey,
    model,
    [{ text: systemPrompt }],
    temperature,
    maxOutputTokens,
  )
}

async function persistWorkHistory(payload: WorkHistoryPayload): Promise<void> {
  const response = await fetch('/api/work-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`History API error (${response.status}): ${errorText.slice(0, 240)}`)
  }
}

async function fetchWorkHistory(params: FetchWorkHistoryParams = {}): Promise<FetchWorkHistoryResult> {
  const safeLimit = Math.min(Math.max(Math.floor(params.limit ?? 30), 1), 100)
  const safeOffset = Math.min(Math.max(Math.floor(params.offset ?? 0), 0), 10000)
  const safeAction = params.action && params.action !== 'all' ? params.action : ''
  const safeQuery = (params.q || '').trim().slice(0, 120)

  const searchParams = new URLSearchParams({
    limit: String(safeLimit),
    offset: String(safeOffset),
  })

  if (safeAction) searchParams.set('action', safeAction)
  if (safeQuery) searchParams.set('q', safeQuery)

  const response = await fetch(`/api/work-history?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`History API error (${response.status}): ${errorText.slice(0, 240)}`)
  }

  const data = await response.json()
  const rawItems = Array.isArray(data?.items) ? data.items : []
  const total = Number.isFinite(Number(data?.total)) ? Number(data.total) : rawItems.length
  const hasMore = Boolean(data?.hasMore)
  const nextOffset = Number.isFinite(Number(data?.nextOffset))
    ? Number(data.nextOffset)
    : safeOffset + rawItems.length

  return {
    items: rawItems.map((item: any) => ({
      _id: typeof item?._id === 'string' ? item._id : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: typeof item?.action === 'string' ? item.action : 'prompt',
      model: typeof item?.model === 'string' ? item.model : '',
      contentType: typeof item?.contentType === 'string' ? item.contentType : '',
      notes: typeof item?.notes === 'string' ? item.notes : '',
      metadata: item?.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
        ? item.metadata as Record<string, unknown>
        : {},
      createdAt: typeof item?.createdAt === 'string' ? item.createdAt : undefined,
      createdAtMs: Number.isFinite(Number(item?.createdAtMs)) ? Number(item.createdAtMs) : undefined,
    })),
    total,
    hasMore,
    nextOffset,
  }
}

function mergeWorkHistoryItems(currentItems: WorkHistoryItem[], nextItems: WorkHistoryItem[]): WorkHistoryItem[] {
  const merged = [...currentItems]
  const seenIds = new Set(currentItems.map((item) => item._id))

  for (const item of nextItems) {
    if (seenIds.has(item._id)) continue
    merged.push(item)
    seenIds.add(item._id)
  }

  return merged
}

function getWorkHistoryActionLabel(action: string): string {
  if (action === 'seo') return 'SEO TikTok'
  if (action === 'voiceover') return 'Voiceover Script'
  return 'Prompt Package'
}

function getWorkHistoryActionColor(action: string): string {
  if (action === 'seo') return 'var(--accent-emerald)'
  if (action === 'voiceover') return 'var(--accent-amber)'
  return 'var(--accent-cyan)'
}

function formatWorkHistoryTimestamp(item: WorkHistoryItem): string {
  const msFromNumber = Number.isFinite(item.createdAtMs) ? Number(item.createdAtMs) : NaN
  const msFromString = item.createdAt ? Date.parse(item.createdAt) : NaN
  const resolvedMs = Number.isFinite(msFromNumber)
    ? msFromNumber
    : (Number.isFinite(msFromString) ? msFromString : Date.now())

  try {
    return new Date(resolvedMs).toLocaleString('vi-VN', { hour12: false })
  } catch {
    return ''
  }
}

function formatWorkHistoryValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value
      .slice(0, 5)
      .map((item) => formatWorkHistoryValue(item))
      .join(', ')
  }

  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[object]'
    }
  }

  return ''
}

async function generateSeoWithGemini(
  apiKey: string,
  model: string,
  productName: string,
  extraNotes: string,
  contentType: ContentType,
  salesTemplate: SalesTemplate
): Promise<SeoTaskResult> {
  const trimmedProductName = productName.trim()
  const trimmedNotes = extraNotes.trim()
  const contentHint = contentType === 'auto' ? 'AUTO' : contentType.toUpperCase()
  const salesTemplateHint = salesTemplate === 'hard' ? 'HARD_SELL (A)' : 'SOFT_SELL (B)'

  const systemPrompt = `You are a senior TikTok Shop content strategist and copywriter.

INPUT:
- Product name: ${trimmedProductName}
- Preferred content type: ${contentHint}
- Sales template: ${salesTemplateHint}
${trimmedNotes ? `- Additional notes: ${trimmedNotes}` : '- Additional notes: none'}

TASK:
- Create exactly 3 DISTINCT SEO variants for TikTok Shop.
- For each variant return:
  1) "title": Vietnamese TikTok SEO title, natural and persuasive, around 60-95 characters.
  2) "tags": exactly 5 hashtags, each starts with #, no duplicates.
  3) "hook": one short hook sentence.
  4) "cta": one short call-to-action sentence.
- Title must include product intent and buying motivation, avoid spammy overclaims.
- ${buildSeoToneHint(salesTemplate)}

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
  contentType: ContentType,
  salesTemplate: SalesTemplate
): Promise<VoiceoverTaskResult> {
  const trimmedProductName = productName.trim()
  const trimmedNotes = extraNotes.trim()
  const contentHint = contentType === 'auto' ? 'AUTO' : contentType.toUpperCase()
  const salesTemplateHint = salesTemplate === 'hard' ? 'HARD_SELL (A)' : 'SOFT_SELL (B)'

  const systemPrompt = `You are a senior TikTok Shop video script writer.

INPUT:
- Product name: ${trimmedProductName}
- Preferred content type: ${contentHint}
- Sales template: ${salesTemplateHint}
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
- ${buildVoiceoverToneHint(salesTemplate)}

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
  const [duration, setDuration] = useState(32)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16')
  const [contentType, setContentType] = useState<ContentType>('ootd')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStageIndex, setLoadingStageIndex] = useState(0)
  const [promptToast, setPromptToast] = useState<PromptToastState | null>(null)
  const [seoLoading, setSeoLoading] = useState(false)
  const [voiceoverLoading, setVoiceoverLoading] = useState(false)
  const [error, setError] = useState('')
  const [seoError, setSeoError] = useState('')
  const [voiceoverError, setVoiceoverError] = useState('')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [seoResult, setSeoResult] = useState<SeoTaskResult | null>(null)
  const [voiceoverResult, setVoiceoverResult] = useState<VoiceoverTaskResult | null>(null)
  const [activeTab, setActiveTab] = useState<'keyframes' | 'scenes' | 'all' | 'image' | 'seo' | 'voiceover' | 'history'>('keyframes')
  const [selectedContentType, setSelectedContentType] = useState<ResolvedContentType>('ootd')
  const [seoProductName, setSeoProductName] = useState('')
  const [seoNotes, setSeoNotes] = useState('')
  const [voiceoverProductName, setVoiceoverProductName] = useState('')
  const [voiceoverNotes, setVoiceoverNotes] = useState('')
  const [selectedSeoVariantIndex, setSelectedSeoVariantIndex] = useState(0)
  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>([])
  const [workHistoryLoading, setWorkHistoryLoading] = useState(false)
  const [workHistoryLoadingMore, setWorkHistoryLoadingMore] = useState(false)
  const [workHistoryError, setWorkHistoryError] = useState('')
  const [workHistoryOffset, setWorkHistoryOffset] = useState(0)
  const [workHistoryHasMore, setWorkHistoryHasMore] = useState(false)
  const [workHistoryTotal, setWorkHistoryTotal] = useState(0)
  const [historyActionFilter, setHistoryActionFilter] = useState<WorkHistoryActionFilter>('all')
  const [historySearchInput, setHistorySearchInput] = useState('')
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [productLocationHistory, setProductLocationHistory] = useState<ProductLocationHistoryMap>(() => loadProductLocationHistory())
  const [outfitTypeLocationHistory, setOutfitTypeLocationHistory] = useState<OutfitTypeLocationHistoryMap>(() => loadOutfitTypeLocationHistory())

  // Persist settings
  useEffect(() => { localStorage.setItem('aff_api_key', apiKey) }, [apiKey])
  useEffect(() => { localStorage.setItem('aff_model', model) }, [model])
  useEffect(() => { saveProductLocationHistory(productLocationHistory) }, [productLocationHistory])
  useEffect(() => { saveOutfitTypeLocationHistory(outfitTypeLocationHistory) }, [outfitTypeLocationHistory])

  useEffect(() => {
    if (!loading) {
      setLoadingStageIndex(0)
      return
    }

    setLoadingStageIndex(0)
    const timer = window.setInterval(() => {
      setLoadingStageIndex((prev) => Math.min(prev + 1, PROMPT_LOADING_STAGES.length - 1))
    }, 1700)

    return () => window.clearInterval(timer)
  }, [loading])

  useEffect(() => {
    if (!promptToast || promptToast.kind === 'loading') return

    const timer = window.setTimeout(() => {
      setPromptToast(null)
    }, 3600)

    return () => window.clearTimeout(timer)
  }, [promptToast])

  const loadWorkHistory = useCallback(async (options?: {
    silent?: boolean
    append?: boolean
    offset?: number
  }) => {
    const silent = options?.silent === true
    const append = options?.append === true
    const offset = Number.isFinite(Number(options?.offset)) ? Number(options?.offset) : 0

    if (append) {
      setWorkHistoryLoadingMore(true)
    } else if (!silent) {
      setWorkHistoryLoading(true)
    }

    setWorkHistoryError('')

    try {
      const historyResponse = await fetchWorkHistory({
        limit: 20,
        offset,
        action: historyActionFilter,
        q: historySearchQuery,
      })

      setWorkHistory((prev) => (append
        ? mergeWorkHistoryItems(prev, historyResponse.items)
        : historyResponse.items))
      setWorkHistoryOffset(historyResponse.nextOffset)
      setWorkHistoryHasMore(historyResponse.hasMore)
      setWorkHistoryTotal(historyResponse.total)
    } catch (historyErr: any) {
      const message = historyErr?.message || 'Khong the tai lich su tu MongoDB API'
      setWorkHistoryError(message)
      if (!append) {
        setWorkHistory([])
        setWorkHistoryOffset(0)
        setWorkHistoryHasMore(false)
        setWorkHistoryTotal(0)
      }
    } finally {
      if (append) {
        setWorkHistoryLoadingMore(false)
      } else if (!silent) {
        setWorkHistoryLoading(false)
      }
    }
  }, [historyActionFilter, historySearchQuery])

  useEffect(() => {
    void loadWorkHistory()
  }, [loadWorkHistory])

  useEffect(() => {
    if (result || seoResult || voiceoverResult) return
    if (activeTab === 'history') return
    if (workHistoryLoading || workHistory.length > 0 || workHistoryError.trim().length > 0) {
      setActiveTab('history')
    }
  }, [activeTab, result, seoResult, voiceoverResult, workHistory.length, workHistoryError, workHistoryLoading])

  const applyWorkHistoryFilters = useCallback(() => {
    const nextQuery = historySearchInput.trim()
    setHistorySearchQuery(nextQuery)
    if (nextQuery === historySearchQuery) {
      void loadWorkHistory()
    }
  }, [historySearchInput, historySearchQuery, loadWorkHistory])

  const clearWorkHistoryFilters = useCallback(() => {
    const shouldReload = historyActionFilter === 'all' && historySearchQuery.length === 0
    setHistoryActionFilter('all')
    setHistorySearchInput('')
    setHistorySearchQuery('')
    if (shouldReload) {
      void loadWorkHistory()
    }
  }, [historyActionFilter, historySearchQuery, loadWorkHistory])

  // Derived
  const durationInfo = DURATIONS.find(d => d.value === duration)!
  const canGenerate = apiKey.trim().length > 0
  const canGenerateSeo = canGenerate && seoProductName.trim().length > 0
  const canGenerateVoiceover = canGenerate && voiceoverProductName.trim().length > 0
  const hasPromptResult = result !== null
  const hasSeoResult = seoResult !== null
  const hasVoiceoverResult = voiceoverResult !== null
  const hasAnyResult = hasPromptResult || hasSeoResult || hasVoiceoverResult
  const hasWorkHistory = workHistory.length > 0
  const hasHistoryPanelData = hasWorkHistory || workHistoryLoading || workHistoryError.trim().length > 0
  const hasResultsPanelContent = hasAnyResult || hasHistoryPanelData
  const activeWorkHistoryFilters = historyActionFilter !== 'all' || historySearchQuery.length > 0
  const historyShownCount = workHistory.length
  const promptStatusKind = loading ? 'loading' : error ? 'error' : hasPromptResult ? 'success' : 'idle'
  const promptLoadingStep = PROMPT_LOADING_STAGES[Math.min(loadingStageIndex, PROMPT_LOADING_STAGES.length - 1)]
  const promptLoadingProgress = loading ? Math.min(90, 24 + loadingStageIndex * 22) : 100
  const promptFloatingStatus = loading
    ? promptLoadingStep
    : error
      ? 'Có lỗi khi tạo prompt. Kiểm tra thông báo để thử lại.'
      : hasPromptResult
        ? `Prompt package đã sẵn sàng (${selectedContentType.toUpperCase()} • ${FIXED_STRATEGY_LABEL}).`
        : canGenerate
          ? `Sẵn sàng tạo Prompt Package (${FIXED_STRATEGY_DESC}).`
          : 'Nhập Gemini API Key để bật tính năng tạo prompt.'
  const selectedSeoVariant = seoResult
    ? seoResult.seoVariants[Math.min(selectedSeoVariantIndex, seoResult.seoVariants.length - 1)]
    : null
  const resultsHeader = activeTab === 'history'
    ? 'Lich su da luu (MongoDB)'
    : result
      ? `Prompt Package — ${duration}s / ${aspectRatio}`
      : activeTab === 'voiceover'
        ? 'Nhiệm vụ 2 — Kịch bản lồng tiếng'
        : 'Nhiệm vụ 1 — SEO TikTok'

  // Generate handler
  const handleGenerate = async () => {
    setLoading(true)
    setLoadingStageIndex(0)
    setPromptToast({
      kind: 'loading',
      message: 'Đang tạo Prompt Package, vui lòng chờ trong giây lát...',
    })
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
        apiKey,
        model,
        faceImage,
        productImage,
        duration,
        aspectRatio,
        notes,
        contentType,
        usedLocationsForProduct,
        outfitTypeLocationHistory,
        FIXED_AFFILIATE_MODE,
        FIXED_SALES_TEMPLATE,
      )

      const resolvedType: ResolvedContentType = res.resolvedContentType
        || (contentType === 'auto'
          ? (FIXED_AFFILIATE_MODE === 'strict' ? 'tiktokshop' : 'outfitideas')
          : contentType)

      res.createImagePrompt = buildCreateImagePrompt(resolvedType, notes)
      setResult(res)
      setSelectedContentType(resolvedType)
      setActiveTab('keyframes')
      setPromptToast({
        kind: 'success',
        message: 'Đã tạo xong Prompt Package. Bạn có thể copy hoặc export ngay.',
      })

      const generatedLocations = Array.from(
        new Set(
          res.keyframes
            .map((keyframe) => keyframe.location.trim())
            .filter((location) => location.length > 0)
        )
      )
      const workHistoryGeneratedAt = Date.now()

      if (generatedLocations.length > 0) {
        if (currentProductImageId) {
          setProductLocationHistory((prev) => {
            const existing = prev[currentProductImageId] || []
            const merged = Array.from(new Set([...generatedLocations, ...existing]))
            return {
              ...prev,
              [currentProductImageId]: merged.slice(0, MAX_LOCATION_HISTORY_PER_PRODUCT),
            }
          })
        }

        setOutfitTypeLocationHistory((prev) => {
          const existing = prev[resolvedType] || []
          const merged = Array.from(new Set([...generatedLocations, ...existing]))
          return {
            ...prev,
            [resolvedType]: merged.slice(0, MAX_LOCATION_HISTORY_PER_OUTFIT_TYPE),
          }
        })
      }

      void persistWorkHistory({
        action: 'prompt',
        model,
        contentType: resolvedType,
        notes: notes.trim(),
        generatedAt: workHistoryGeneratedAt,
        metadata: {
          inputContentType: contentType,
          resolvedContentType: resolvedType,
          duration,
          aspectRatio,
          keyframeCount: res.keyframes.length,
          sceneCount: res.scenes.length,
          generatedLocations: generatedLocations.slice(0, 10),
          hasFaceImage: Boolean(faceImage),
          hasProductImage: Boolean(productImage),
        },
      })
        .then(() => loadWorkHistory({ silent: true }))
        .catch((saveError) => {
          console.warn(
            'Could not save prompt work history:',
            saveError instanceof Error ? saveError.message : saveError
          )
        })
    } catch (err: any) {
      const message = err?.message || 'Failed to generate prompts'
      setError(message)
      setPromptToast({
        kind: 'error',
        message,
      })
    } finally {
      setLoading(false)
      setPromptToast((prev) => (prev?.kind === 'loading' ? null : prev))
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
        contentType,
        FIXED_SALES_TEMPLATE,
      )

      setSeoResult(generated)
      setSelectedSeoVariantIndex(0)
      setActiveTab('seo')

      void persistWorkHistory({
        action: 'seo',
        model,
        contentType,
        notes: seoNotes.trim(),
        generatedAt: generated.generatedAt || Date.now(),
        metadata: {
          productName: trimmedProductName,
          variantCount: generated.seoVariants.length,
          salesTemplate: FIXED_SALES_TEMPLATE,
        },
      })
        .then(() => loadWorkHistory({ silent: true }))
        .catch((saveError) => {
          console.warn(
            'Could not save SEO work history:',
            saveError instanceof Error ? saveError.message : saveError
          )
        })
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
        contentType,
        FIXED_SALES_TEMPLATE,
      )

      setVoiceoverResult(generated)
      setActiveTab('voiceover')

      void persistWorkHistory({
        action: 'voiceover',
        model,
        contentType,
        notes: voiceoverNotes.trim(),
        generatedAt: generated.generatedAt || Date.now(),
        metadata: {
          productName: trimmedProductName,
          durationSec: generated.voiceover.durationSec,
          lineCount: generated.voiceover.lines.length,
          salesTemplate: FIXED_SALES_TEMPLATE,
        },
      })
        .then(() => loadWorkHistory({ silent: true }))
        .catch((saveError) => {
          console.warn(
            'Could not save voiceover work history:',
            saveError instanceof Error ? saveError.message : saveError
          )
        })
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
        `Resolved Type: ${selectedContentType.toUpperCase()}`,
        `Affiliate Mode: ${(result.affiliateModeUsed || FIXED_AFFILIATE_MODE).toUpperCase()}`,
        `Sales Template: ${(result.salesTemplateUsed || FIXED_SALES_TEMPLATE).toUpperCase()}`,
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
        `RESOLVED TYPE: ${selectedContentType.toUpperCase()}`,
        `AFFILIATE MODE: ${(result.affiliateModeUsed || FIXED_AFFILIATE_MODE).toUpperCase()}`,
        `SALES TEMPLATE: ${(result.salesTemplateUsed || FIXED_SALES_TEMPLATE).toUpperCase()}`,
        '',
        'CHARACTER DNA:', result.masterDNA, '',
        'KEYFRAME PROMPTS:', ...result.keyframes.map(kf => kf.fullPrompt), '',
        'SCENE PROMPTS:', ...result.scenes.map(sc => sc.fullPrompt),
        ...(result.createImagePrompt ? ['', 'CREATE IMAGE PROMPT:', result.createImagePrompt] : []),
      )
    }

    if (seoResult) {
      for (const variant of seoResult.seoVariants) {
        lines.push(`${variant.title} ${variant.tags.join(' ')}`.trim())
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

            {/* Affiliate Strategy (Locked) */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <TrendingUp /> Chiến lược Affiliate (Cố định)
              </div>
              <p className="ai-task-hint">
                Đã khóa 1 hướng tối ưu duy nhất theo TikTok: <strong>{FIXED_STRATEGY_LABEL}</strong>.
              </p>
              <p className="ai-task-hint" style={{ marginBottom: 0 }}>
                Mục tiêu: ưu tiên chuyển đổi bền vững, giữ sản phẩm rõ ràng, tăng niềm tin trước CTA mua hàng.
              </p>
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

            <div className={`prompt-inline-status prompt-inline-status-${promptStatusKind}`}>
              <div className="prompt-inline-status-head">
                {loading ? (
                  <div className="spinner" />
                ) : promptStatusKind === 'error' ? (
                  <AlertCircle size={16} />
                ) : promptStatusKind === 'success' ? (
                  <Check size={16} />
                ) : (
                  <Wand2 size={16} />
                )}
                <div>
                  <p className="prompt-inline-status-title">
                    {loading
                      ? 'Đang tạo Prompt Package'
                      : promptStatusKind === 'error'
                        ? 'Tạo prompt chưa thành công'
                        : promptStatusKind === 'success'
                          ? 'Prompt package đã sẵn sàng'
                          : 'Nút tạo prompt đang nổi cố định phía dưới màn hình'}
                  </p>
                  <p className="prompt-inline-status-subtitle">{promptFloatingStatus}</p>
                </div>
              </div>

              {loading && (
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${promptLoadingProgress}%` }} />
                </div>
              )}
            </div>

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
              {!hasResultsPanelContent ? (
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
                    {result && activeTab !== 'history' && (
                      <span style={{ marginLeft: 12, fontSize: '0.75rem', opacity: 0.8 }}>
                        (Type: {selectedContentType.toUpperCase()})
                      </span>
                    )}
                    {result && activeTab !== 'history' && (
                      <span style={{ marginLeft: 8, fontSize: '0.75rem', opacity: 0.7 }}>
                        [{(result.affiliateModeUsed || FIXED_AFFILIATE_MODE).toUpperCase()} • {(result.salesTemplateUsed || FIXED_SALES_TEMPLATE).toUpperCase()}]
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
                    <button
                      className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                      onClick={() => setActiveTab('history')}
                    >
                      <History /> Lich su ({workHistory.length})
                    </button>
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
                        const copyValue = `${variant.title} ${variant.tags.join(' ')}`.trim()

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
                          <span className="prompt-card-time">{selectedContentType.toUpperCase()}</span>
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

                  {(activeTab === 'history' || activeTab === 'all') && (
                    <>
                      {activeTab === 'all' && (
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          📚 Lich su da luu (MongoDB)
                        </h3>
                      )}

                      <div className="history-toolbar">
                        <div className="history-toolbar-top">
                          <p className="history-toolbar-text">
                            Dong bo lich su tu API <strong>/api/work-history</strong>
                            {activeWorkHistoryFilters ? ` • loc: ${historyActionFilter.toUpperCase()}${historySearchQuery ? ` • "${historySearchQuery}"` : ''}` : ''}
                          </p>
                          <button
                            type="button"
                            className="history-refresh-btn"
                            onClick={() => void loadWorkHistory()}
                            disabled={workHistoryLoading || workHistoryLoadingMore}
                          >
                            <RefreshCw size={13} className={(workHistoryLoading || workHistoryLoadingMore) ? 'spin' : ''} />
                            {(workHistoryLoading || workHistoryLoadingMore) ? 'Dang tai...' : 'Lam moi'}
                          </button>
                        </div>

                        <div className="history-filter-row">
                          <select
                            className="select-field history-filter-select"
                            value={historyActionFilter}
                            onChange={(e) => setHistoryActionFilter(e.target.value as WorkHistoryActionFilter)}
                          >
                            <option value="all">Tat ca</option>
                            <option value="prompt">Prompt</option>
                            <option value="seo">SEO</option>
                            <option value="voiceover">Voiceover</option>
                          </select>

                          <input
                            className="input-field history-filter-input"
                            value={historySearchInput}
                            onChange={(e) => setHistorySearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                applyWorkHistoryFilters()
                              }
                            }}
                            placeholder="Tim theo notes, model, content type..."
                          />

                          <button
                            type="button"
                            className="history-filter-btn"
                            onClick={applyWorkHistoryFilters}
                          >
                            Ap dung
                          </button>

                          <button
                            type="button"
                            className="history-filter-btn ghost"
                            onClick={clearWorkHistoryFilters}
                            disabled={!activeWorkHistoryFilters && historySearchInput.trim().length === 0}
                          >
                            Xoa loc
                          </button>
                        </div>
                      </div>

                      {workHistoryError && (
                        <div className="error-message" style={{ marginBottom: 12 }}>
                          <AlertCircle size={16} />
                          {workHistoryError}
                        </div>
                      )}

                      {workHistory.length > 0 ? (
                        <>
                          {workHistory.map((item) => {
                            const metadataEntries = Object.entries(item.metadata || {})
                              .filter(([, value]) => value !== null && value !== undefined && `${value}`.trim().length > 0)
                              .slice(0, 8)

                            return (
                              <div key={item._id} className="prompt-card">
                                <div className="prompt-card-header">
                                  <div className="prompt-card-badge" style={{ color: getWorkHistoryActionColor(item.action) }}>
                                    <History size={14} />
                                    {getWorkHistoryActionLabel(item.action)}
                                  </div>
                                  <span className="prompt-card-time">{formatWorkHistoryTimestamp(item)}</span>
                                </div>
                                <div className="prompt-card-body">
                                  <CopyButton
                                    text={[
                                      `ACTION: ${item.action || '-'}`,
                                      `MODEL: ${item.model || '-'}`,
                                      `CONTENT_TYPE: ${item.contentType || '-'}`,
                                      `TIME: ${formatWorkHistoryTimestamp(item)}`,
                                      item.notes ? `NOTES: ${item.notes}` : '',
                                      metadataEntries.length > 0
                                        ? `METADATA:\n${metadataEntries.map(([key, value]) => `${key}: ${formatWorkHistoryValue(value)}`).join('\n')}`
                                        : '',
                                    ].filter(Boolean).join('\n')}
                                  />
                                  <div className="prompt-text" style={{ lineHeight: 1.75 }}>
                                    <strong>ACTION:</strong> {item.action || '-'}
                                    {'\n'}<strong>MODEL:</strong> {item.model || '-'}
                                    {'\n'}<strong>CONTENT TYPE:</strong> {item.contentType || '-'}
                                    {item.notes && (
                                      <>
                                        {'\n'}<strong>NOTES:</strong> {item.notes}
                                      </>
                                    )}
                                    {metadataEntries.length > 0 && (
                                      <>
                                        {'\n\n'}<strong>METADATA:</strong>
                                        {'\n'}{metadataEntries.map(([key, value]) => `${key}: ${formatWorkHistoryValue(value)}`).join('\n')}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          <div className="history-footer">
                            <p className="history-count-text">
                              Hien thi {historyShownCount} / {workHistoryTotal} ban ghi
                            </p>
                            {workHistoryHasMore ? (
                              <button
                                type="button"
                                className="history-load-more-btn"
                                onClick={() => void loadWorkHistory({ append: true, offset: workHistoryOffset })}
                                disabled={workHistoryLoadingMore || workHistoryLoading}
                              >
                                {workHistoryLoadingMore ? 'Dang tai them...' : 'Load more'}
                              </button>
                            ) : (
                              <span className="history-count-text done">Da hien thi het</span>
                            )}
                          </div>
                        </>
                      ) : workHistoryLoading ? (
                        <div className="history-empty">Dang tai lich su tu MongoDB...</div>
                      ) : (
                        <div className="history-empty">Chua co ban ghi nao trong work_history.</div>
                      )}
                    </>
                  )}

                  {/* Export Bar */}
                  {hasAnyResult && (
                    <div className="export-bar">
                      <button className="btn-export" onClick={handleCopyAll} id="copy-all-btn">
                        <Copy /> Copy All
                      </button>
                      <button className="btn-export" onClick={handleExportAll} id="export-btn">
                        <Download /> Export .txt
                      </button>
                    </div>
                  )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="prompt-floating-bar-wrap" role="region" aria-label="Tạo Prompt Package">
          <div className={`prompt-floating-bar ${loading ? 'is-loading' : ''}`}>
            <div className="prompt-floating-meta">
              <p className="prompt-floating-title">Tạo Prompt Package</p>
              <p className={`prompt-floating-subtitle ${promptStatusKind}`}>
                {promptFloatingStatus}
              </p>
            </div>

            <button
              id="generate-btn"
              className={`btn-generate prompt-floating-btn ${loading ? 'loading' : ''}`}
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
              <div className="prompt-floating-progress">
                <div className="prompt-floating-progress-fill" style={{ width: `${promptLoadingProgress}%` }} />
              </div>
            )}
          </div>
        </div>

        {promptToast && (
          <div
            className={`prompt-toast prompt-toast-${promptToast.kind}`}
            role="status"
            aria-live="polite"
          >
            <div className={`prompt-toast-icon ${promptToast.kind === 'loading' ? 'spinning' : ''}`}>
              {promptToast.kind === 'success' ? (
                <Check size={15} />
              ) : promptToast.kind === 'error' ? (
                <AlertCircle size={15} />
              ) : (
                <Sparkles size={15} />
              )}
            </div>
            <div className="prompt-toast-body">
              <p className="prompt-toast-title">
                {promptToast.kind === 'loading'
                  ? 'Đang tạo Prompt Package'
                  : promptToast.kind === 'success'
                    ? 'Tạo Prompt thành công'
                    : 'Có lỗi khi tạo Prompt'}
              </p>
              <p className="prompt-toast-message">{promptToast.message}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
