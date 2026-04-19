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
  subject: string
  narrative: string
  startPose: string
  endPose: string
  composition: string
  cameraMovement: string
  lighting: string
  locationFlow?: string
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

interface TikTokScriptBeat {
  index: number
  timestamp: string
  beatName: string
  description: string
  cameraHint: string
  narrationHint: string
}

interface TikTokAnalysisResult {
  detectedContentType: string
  detectedDurationSec: number
  hookStyle: string
  narrativeStructure: string
  ctaStyle: string
  colorGrade: string
  pacing: string
  sceneBeats: TikTokScriptBeat[]
  generatedScript: string
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
  {
    value: 'ootdmirror',
    label: 'OOTD Mirror',
    icon: Camera,
    desc: 'Mirror Fitcheck',
    color: '#f43f5e',
    locationStyleKeywords: [
      'mirror',
      'mirrorselfie',
      'mirrorootd',
      'fitcheck',
      'wardrobe mirror',
      'guong',
      'guong soi',
      'phong thay do',
      'phong thu do',
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
  { value: 'streetstyle', label: 'Street Style', icon: TrendingUp, desc: 'Outdoor Urban Candid Walk', color: '#06b6d4' },
  { value: 'partyoutfit', label: 'Party Outfit', icon: Sparkles, desc: 'Đầm Tiệc / Occasion Dress', color: '#e879f9' },
] as const

type ContentType = typeof CONTENT_TYPES[number]['value']
type ResolvedContentType = Exclude<ContentType, 'auto'>
type AffiliateMode = 'balanced' | 'strict'
type SalesTemplate = 'hard' | 'soft'
type ProductLocationHistoryMap = Record<string, string[]>
type OutfitTypeLocationHistoryMap = Partial<Record<ResolvedContentType, string[]>>

const CONTENT_TYPE_VALUES = CONTENT_TYPES.map((item) => item.value) as ContentType[]
const ASPECT_RATIO_VALUES = ASPECT_RATIOS.map((item) => item.value) as Array<'9:16' | '16:9'>

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
  'ootdmirror',
  'grwm',
  'outfitideas',
  'fyp',
  'review',
  'tiktokshop',
  'athleisure',
  'haul',
  'styling',
  'luxury',
  'streetstyle',
  'partyoutfit',
]

const STRICT_AUTO_ALLOWED_TYPES: ResolvedContentType[] = ['tiktokshop', 'outfitideas', 'review', 'ootd', 'ootdmirror']

const ALLOWED_LOCATION_KEYWORDS = [
  'vietnam',
  'viet nam',
  'china',
  'trung quoc',
  'south korea',
  'han quoc',
  'korea',
]

const MIRROR_LOCATION_STYLE_KEYWORDS = [
  'mirror',
  'mirrorselfie',
  'mirrorootd',
  'mirror fitcheck',
  'wardrobe mirror',
  'fitting room',
  'dressing room',
  'changing room',
  'reflection',
  'guong',
  'guong soi',
  'phong thay do',
  'phong thu do',
] as const

const STUDIO_LOCATION_STYLE_KEYWORDS = [
  'studio',
  'studio corner',
  'photo studio',
  'content studio',
  'lookbook studio',
  'showroom',
  'backdrop',
  'set wall',
  'set corner',
  'goc studio',
  'studio mini',
] as const

const TIKTOK_OBSERVED_SIGNAL_BASELINE = `- OOTD cluster is strong and broad (#ootd ~65M, #outfitideas ~23.5M, #fitcheck ~10M).
- GRWM cluster is mainstream (#grwm ~22.8M) with strong alias behavior (#getreadywithme ~3.4M).
- Mirror-specific internal labels are weak (#ootdmirror ~1.2K), so natural outputs should anchor to #fitcheck / #mirrorselfie / #ootd language.
- TikTok Shop + proof content is high-adoption (#tiktokshop ~121M, #review ~16.4M, #unboxing ~17.7M).
- FYP is too broad (#fyp ~8.7B) and should be secondary only, never the core fashion narrative.
- Occasion-wear clusters are healthier with Vietnamese tags (#vayditiec ~243K, #damditiec ~119K) than literal #partyoutfit (~105K).`

const NATURALITY_PROMPT_GUARDRAILS = `- Prefer creator-native language and believable social behavior over ad-like perfection.
- Avoid robotic sequencing terms ("Step 1", "Step 2", "Objective achieved", "conversion beat").
- Use lived-in micro-actions: outfit adjustment, natural pause, glance, weight shift, fabric touch, candid walkback.
- Keep transitions motivated by body movement and camera follow, not mechanical choreography.
- Keep tone conversational, practical, and trust-first; avoid over-scripted cinematic jargon in every line.`

const VEO_INTERPOLATION_GUARDRAILS = `- First/last-frame interpolation must use micro-progression between adjacent keyframes (small pose delta, no sudden body jump).
- Keep one dominant camera movement per 8s scene; avoid mixed or contradictory camera instructions.
- Preserve camera axis and movement direction across adjacent scenes unless an explicit turn-around beat is written.
- Avoid discontinuity terms such as teleport, jump cut, hard cut, instant morph, abrupt switch.
- Keep subject, action, camera, composition, and ambiance explicit for each keyframe/scene prompt.
- CONSECUTIVE KEYFRAME FACING LOCK: Two adjacent keyframes MUST NOT show the subject facing the same body direction (e.g., both front-facing, both side-facing). Between any two consecutive keyframes a visible body turn or pivot must occur.
- FACING TAG CLARITY RULE: Every keyframe action should explicitly encode body facing (front-facing, left-facing, right-facing, back-facing, or 3/4 variants) so adjacent turns are unambiguous.
- This is mandatory because Veo 3.1 has no knowledge of the garment\'s back side; repeating the same facing direction forces the model to hallucinate unknown back-of-garment details, causing severe outfit inconsistency artifacts.`

const CELEBRITY_POLICY_GUARDRAILS = `- Do NOT depict, imitate, or reference any real celebrity, public figure, influencer, or identifiable real person (living or deceased).
- Do NOT generate deepfake-style likeness, impersonation, fake endorsement, or fabricated quote/dialogue from real people.
- If user notes request a real person, rewrite to a fictional character archetype with similar vibe only (no name, no direct likeness cues).
- Do NOT claim or imply that generated content is authentic footage of a real person.
- Keep all human subjects generic/fictional and policy-safe.`

const MOTION_DISCONTINUITY_KEYWORDS = [
  'teleport',
  'teleports',
  'jump cut',
  'hard cut',
  'smash cut',
  'flash cut',
  'instant morph',
  'abrupt switch',
  'sudden jump',
  'warp',
  'chaotic random',
] as const

const CAMERA_MOTION_FAMILY_KEYWORDS: Record<string, readonly string[]> = {
  static: ['static', 'locked off', 'lock off', 'tripod', 'fixed frame'],
  dolly: ['dolly', 'push in', 'pull back', 'truck'],
  pan: ['pan', 'panning', 'left to right', 'right to left', 'lateral move'],
  tilt: ['tilt', 'tilting', 'tilt up', 'tilt down'],
  tracking: ['tracking', 'follow shot', 'follow camera', 'tracking shot'],
  orbit: ['orbit', 'arc shot', 'circular move', '360', '180 arc'],
  zoom: ['zoom', 'zoom in', 'zoom out'],
  handheld: ['handheld', 'hand held', 'shaky cam'],
}

const KEYFRAME_TURN_CUE_KEYWORDS = [
  'turn',
  'pivot',
  'rotate',
  'rotation',
  'swivel',
  'spin',
  'twirl',
  'quarter turn',
  'half turn',
  '3/4 turn',
  'three quarter turn',
  'look back',
  'over shoulder',
  'turn away',
  'turn toward',
  'xoay',
  'quay',
  'nghieng',
  'quay lung',
  'doi lung',
] as const

type KeyframeFacingDirection =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'three-quarter-left'
  | 'three-quarter-right'
  | 'unknown'

type ContentStyleLock = 'mirror' | 'studio' | 'flex'

const STAGE_CACHE_TTL_MS = 5 * 60 * 1000
type StageCacheEntry = {
  data: Record<string, unknown>
  expiresAt: number
}

const VISUAL_EXTRACT_STAGE_CACHE = new Map<string, StageCacheEntry>()
const CREATIVE_PLAN_STAGE_CACHE = new Map<string, StageCacheEntry>()

const AFFILIATE_VIDEO_OBJECTIVES: Record<ResolvedContentType, string> = {
  ootd: 'Prioritize clean outfit readability and aspirational styling while keeping product details purchase-relevant.',
  ootdmirror: 'Deliver mirror-first fitcheck storytelling with full-body readability and high trust social-native framing.',
  grwm: 'Build trust through natural routine storytelling, then transition clearly to product desire and purchase intent.',
  outfitideas: 'Deliver practical lookbook combinations users can copy immediately, with clear value for saving/sharing and buying.',
  fyp: 'Create high-retention viral pacing but still preserve product clarity and affiliate conversion direction.',
  review: 'Lead with honest product proof, fit/material verification, and credible recommendation cues.',
  tiktokshop: 'Maximize conversion for TikTok Shop: strong hook, product proof, objection handling, and clear purchase-intent visuals.',
  athleisure: 'Show movement comfort and styling versatility from active to casual settings, tied to practical purchase value.',
  haul: 'Showcase variety and excitement with clear piece-by-piece value, fit proof, and purchasing motivation.',
  styling: 'Teach actionable styling transformations that position the product as a high-utility wardrobe solution.',
  luxury: 'Communicate premium quality, silhouette precision, and refined aspirational value that justifies purchase.',
  streetstyle: 'Leverage authentic outdoor urban energy to showcase outfit wearability in real daily-life contexts, driving relatable purchase motivation.',
  partyoutfit: 'Showcase occasion dress desirability with full silhouette reveal, back-design proof, fabric drape movement, and multi-occasion versatility to drive immediate purchase intent for #damditiec and event-wear buyers.',
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
- Use recommendation tone before optional purchase cues (no hard CTA required).
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
  ootdmirror: [
    { name: 'MIRROR FITCHECK HOOK', emoji: '🪞', cameraHint: 'Vertical mirror framing with full-body readability from head to toe' },
    { name: 'SILHOUETTE PROOF', emoji: '👗', cameraHint: 'Slow tilt in mirror reflection to verify fit, hemline, and waist structure' },
    { name: 'TEXTURE DETAIL BEAT', emoji: '✨', cameraHint: 'Controlled push-in toward reflection for fabric and cut clarity' },
    { name: 'SIDE-ANGLE CONFIDENCE', emoji: '💫', cameraHint: 'Subtle lateral move while keeping mirror axis stable and social-native' },
    { name: 'FULL LOOK WALKBACK', emoji: '🚶‍♀️', cameraHint: 'Mirror-safe walk and return motion, preserving full outfit visibility' },
    { name: 'MIRROR CONFIDENCE CLOSER', emoji: '🎬', cameraHint: 'Clean final mirror pose with strong product readability and social-native confidence' },
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
    { name: 'FINAL RECOMMENDATION', emoji: '🎬', cameraHint: 'Happy model with product, trust-forward recommendation framing' },
  ],
  tiktokshop: [
    { name: 'PRODUCT HOOK + PRICE SIGNAL', emoji: '🛍️', cameraHint: 'Immediate hero shot with strong product readability' },
    { name: 'FIT & MATERIAL PROOF', emoji: '🧵', cameraHint: 'Close-up to medium transitions proving fabric and fit' },
    { name: 'TRY-ON VALUE MOMENT', emoji: '👗', cameraHint: 'Full-body movement emphasizing versatility and comfort' },
    { name: 'SOCIAL PROOF VISUAL', emoji: '⭐', cameraHint: 'Lifestyle framing with confident model reaction beat' },
    { name: 'BUYING OBJECTION HANDLER', emoji: '✅', cameraHint: 'Detail-focused shot answering size/quality concerns' },
    { name: 'CONVERSION CLOSER', emoji: '🎬', cameraHint: 'Clean end frame optimized for product clarity and conversion intent' },
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
  streetstyle: [
    { name: 'STREET ENTRANCE HOOK', emoji: '🚶‍♀️', cameraHint: 'Tracking shot following model walking naturally into urban frame from a slight low angle' },
    { name: 'OUTFIT READABILITY WALK', emoji: '👗', cameraHint: 'Medium-wide tracking shot, model in natural stride showing full outfit silhouette on-street' },
    { name: 'CANDID DETAIL PAUSE', emoji: '✨', cameraHint: 'Quick push-in on fabric/texture while model pauses naturally at a street corner or doorway' },
    { name: 'URBAN ENVIRONMENT MOMENT', emoji: '🏙️', cameraHint: 'Lateral pan revealing model against a vibrant street backdrop (cafe wall, alley, market)' },
    { name: 'NATURAL MOVEMENT BEAT', emoji: '💫', cameraHint: 'Low-angle tracking shot capturing confident stride, hair movement, and natural body flow' },
    { name: 'STREET STYLE CLOSER', emoji: '🎬', cameraHint: 'Model turning back to camera with casual confidence, wide shot with golden-hour or natural outdoor light' },
  ],
  partyoutfit: [
    { name: 'SILHOUETTE REVEAL HOOK', emoji: '✨', cameraHint: 'Slow full-body reveal from hemline up — show dress length, silhouette, and first impression of the occasion look' },
    { name: 'BACK DESIGN SHOWCASE', emoji: '🔄', cameraHint: 'Model pivots away from camera — slow tilt down back to highlight back cut-out, bow, lace, or corset detail' },
    { name: 'FABRIC DRAPE MOVEMENT', emoji: '🌸', cameraHint: 'Side-angle medium shot capturing flowing skirt, silk movement, or lace overlay as model takes slow elegant steps' },
    { name: 'WAIST & FIT PROOF', emoji: '👗', cameraHint: 'Push-in toward waist and hip area to demonstrate tôn dáng (body-flattering fit) and material quality' },
    { name: 'OCCASION CONTEXT MOMENT', emoji: '🥂', cameraHint: 'Wide shot placing model in aspirational setting (hotel corridor, rooftop, garden venue) to sell the occasion vibe' },
    { name: 'CONFIDENT OCCASION CLOSER', emoji: '🎬', cameraHint: 'Slow 3/4 turn to face camera with poised composure — full-body visible, soft lighting, elegant final pose' },
  ],
}

function buildCharacterDNA(notes: string, contentType: ResolvedContentType): string {
  const styleMap: Record<ResolvedContentType, string> = {
    ootd: 'Professional fashion editorial, OOTD TikTok, cinematic quality',
    ootdmirror: 'Mirror fitcheck social-native aesthetic, full-body framing, reflection-safe composition',
    grwm: 'Lifestyle vlog aesthetic, warm and intimate GRWM style',
    outfitideas: 'Practical lookbook aesthetic, mix-and-match styling with daily wear context',
    fyp: 'Trending viral aesthetic, high-fashion editorial with cinematic flair',
    review: 'Authentic product review style, natural lighting, trustworthy feel',
    tiktokshop: 'Conversion-focused TikTok Shop style, product clarity, social proof, and CTA-driven framing',
    athleisure: 'Urban sporty-chic lifestyle, gym-to-café casual confidence',
    haul: 'Excited energetic unboxing aesthetic, approachable and relatable',
    styling: 'Expert fashion advisor aesthetic, polished and informative',
    luxury: 'Old money aesthetic, understated elegance, timeless sophistication',
    streetstyle: 'Outdoor urban candid aesthetic, natural movement, real-world street fashion energy',
    partyoutfit: 'Occasion-dress editorial aesthetic, elegant soft lighting, back-detail and silhouette storytelling, aspirational event setting',
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
    ootdmirror: 'OOTD Mirror — mirror fitcheck format with social-native full-body outfit readability',
    grwm: 'GRWM (Get Ready With Me) — warm lifestyle aesthetic showing complete look',
    outfitideas: 'Outfit Ideas — lookbook format with practical mix-and-match inspiration',
    fyp: 'FYP (For You Page) — viral trending aesthetic with dramatic fashion presentation',
    review: 'Product Review — authentic product showcase highlighting garment quality and details',
    tiktokshop: 'TikTok Shop Affiliate — conversion-focused showcase with clear purchase motivation',
    athleisure: 'Athleisure — gym-to-café styling combining sportswear with casual sophistication',
    haul: 'Haul Showcase — collection display with multiple outfit combinations',
    styling: 'Fashion Styling Guide — showcase expert outfit coordination and versatility',
    luxury: 'Luxury / Old Money — timeless sophisticated style with understated elegance',
    streetstyle: 'Street Style — outdoor urban candid walk showcasing outfit in real-world daily-life settings',
    partyoutfit: 'Party Outfit / Occasion Dress — đầm tiệc, corset, silk dress showcase with back-design reveal, silhouette proof, and aspirational event setting',
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
  contentType === 'ootdmirror' ? 'Mirror fitcheck social-native framing with strong head-to-toe outfit readability and trust cues.' :
  contentType === 'outfitideas' ? 'Lookbook inspiration style with practical daily styling guidance.' :
  contentType === 'review' ? 'Authentic and trustworthy feel.' :
  contentType === 'luxury' ? 'Understated elegance, refined luxury presentation.' :
  contentType === 'athleisure' ? 'Urban sporty-chic, approachable lifestyle.' :
  contentType === 'haul' ? 'Energetic and approachable showcase.' :
  contentType === 'streetstyle' ? 'Outdoor urban candid fashion — natural golden-hour or daylight, street backdrop, authentic movement.' :
  contentType === 'partyoutfit' ? 'Occasion dress editorial — soft elegant studio or venue lighting, dress movement and back-detail emphasis, aspirational event atmosphere.' :
  'High-end editorial quality.'
} Shot on Sony A7R IV, 85mm f/1.4 lens, ISO 100.

[TEXT OVERLAYS]: 
• Product name label at top center (clean sans-serif typography)
• "FRONT" label under left view, "BACK" label under right view
• Size/material callouts with thin leader lines pointing to key garment details

[POLICY SAFETY]:
• Never use any real celebrity/public figure/identifiable real person name or likeness cues.
• If custom notes request a real person, reinterpret as a fictional model archetype with similar mood only.
• Do not imply endorsement, impersonation, or authentic real-person footage.

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

function hasStyleKeyword(value: string, keywords: readonly string[]): boolean {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return false

  return keywords.some((keyword) => normalized.includes(normalizeLocationKey(keyword)))
}

function getContentTypeStyleLock(contentType: ResolvedContentType): ContentStyleLock {
  if (contentType === 'ootdmirror') return 'mirror'
  if (contentType === 'ootd') return 'studio'
  return 'flex'
}

function matchesStyleLockForLocation(location: string, styleLock: ContentStyleLock): boolean {
  if (styleLock === 'flex') return true

  const hasMirror = hasStyleKeyword(location, MIRROR_LOCATION_STYLE_KEYWORDS)
  const hasStudio = hasStyleKeyword(location, STUDIO_LOCATION_STYLE_KEYWORDS)

  if (styleLock === 'mirror') {
    return hasMirror
  }

  return hasStudio && !hasMirror
}

function getStyleLockFallbackLocation(styleLock: ContentStyleLock): string {
  if (styleLock === 'mirror') {
    return 'Wardrobe mirror corner in a fashion fitting room, District 1, Ho Chi Minh City, Vietnam'
  }

  if (styleLock === 'studio') {
    return 'Single-corner fashion studio with clean backdrop, District 7, Ho Chi Minh City, Vietnam'
  }

  return 'Street fashion corner near a shopping district, Hoan Kiem, Hanoi, Vietnam'
}

function buildTikTokNativeSignalRules(contentType: ResolvedContentType): string {
  if (contentType === 'ootdmirror') {
    return `- Mirror-first social grammar: mirror fit check, mirror selfie, reflection readability.
- Keep full-body reflection visible for most of the timeline, with at least one stable fit-check hold.
- Align visual rhythm with fitcheck cluster behavior: clear silhouette proof before transitions.
- Treat "ootdmirror" as an internal strategy label only; externally mirror the stronger native cluster language (#fitcheck, #mirrorselfie, #ootd, #outfitinspo).`
  }

  if (contentType === 'ootd') {
    return `- Studio-first OOTD grammar: clean single-corner set, full-look reveal, detail proof, confidence closer.
- Align social-native cues with OOTD cluster behavior (#ootd, #outfit, #outfitideas style readability).
- Prioritize outfit readability over aggressive transitions.`
  }

  if (contentType === 'outfitideas') {
    return `- Outfit ideas grammar: practical mix-and-match sequence, not random cinematic fragments.
- Include at least one clear before/after styling switch and one save-worthy final composition.
- Align pacing with fitcheck and outfitinspo behavior seen on TikTok.`
  }

  if (contentType === 'grwm') {
    return `- GRWM grammar: natural preparation flow (choose look -> detail check -> ready-to-go payoff), not scripted tutorial voice.
- Anchor socially recognizable behavior to #grwm and #getreadywithme clusters rather than over-produced cinematic beats.
- Keep pacing intimate and human: short candid moments, not rigid shot-list execution.`
  }

  if (contentType === 'tiktokshop') {
    return `- TikTok Shop grammar: proof stack (fit + material + usage) then objection handling and conversion intent.
- Keep product readability dominant and include review or unboxing style trust cues.
- Maintain conversion-native language and framing consistency across scenes.`
  }

  if (contentType === 'streetstyle') {
    return `- Street style social grammar: natural outdoor walk, candid urban backdrop, authentic movement energy.
- Keep full-body outfit visibility high across the timeline — silhouette must be clearly readable in natural/street light.
- Align visual rhythm with thoitrangnu/streetstyle cluster behavior: walking entrance → outfit proof → candid detail → urban environment moment.`
  }

  if (contentType === 'partyoutfit') {
    return `- Occasion dress grammar (#damditiec / #vayditiec cluster): full silhouette reveal → back design showcase → fabric drape movement → waist/fit proof → occasion context → confident closer.
- MANDATORY back-facing or pivot beat: every partyoutfit video must include at least one keyframe showing the garment\'s back design (the unique selling point most viewers want to verify before buying).
- Emphasize material-feel cues: lace, silk, corset gọng, flowing layers — these are Vietnamese buyers\' top purchase signals for occasion wear.
- Location must sell the occasion: hotel corridor, rooftop bar, garden setting, or elegant indoor venue — not street or casual setting.
- Keep tone aspirational but accessible: đi tiệc, đi biển, đi cưới, cà phê sang — show the dress\'s occasion versatility across at least 2 implied occasions in captions/context.
- Align with high-view behavior: minimalist caption, visuals carry the message, fabric movement is the hook.
- Treat "partyoutfit" as internal labeling; prioritize natural Vietnamese occasion-wear semantics (#vayditiec, #damditiec) in scene intent.`
  }

  if (contentType === 'athleisure') {
    return `- Athleisure should be styled as everyday wearable movement, not a strict gym ad aesthetic.
- Blend comfort-proof + street-ready styling with practical scenarios (commute, cafe, quick errand).
- Because #athleisure is mid-size, pair intent with stronger neighboring clusters like #ootd / #outfitinspo behavior cues.`
  }

  if (contentType === 'fyp') {
    return `- FYP is a distribution layer, not a content identity. Build around real fashion story beats first.
- Keep #fyp behavior as secondary amplification only; primary logic must remain outfit readability + value + proof.
- Avoid random viral gimmicks that weaken product trust or garment clarity.`
  }

  return `- Keep social-native pacing, clear outfit readability, and practical value demonstration.
- Favor authentic creator-style framing over over-produced ad-like visuals.
- Maintain hook-to-value-to-proof-to-close structure.`
}

function buildTikTokTrendAlignmentRules(contentType: ResolvedContentType): string {
  if (contentType === 'ootdmirror') {
    return `- Adoption reality: literal #ootdmirror usage is low (~1.2K), so do not force this term in narrative language.
- Anchor style to strong mirror-fitcheck clusters: #fitcheck (~10M), #ootd (~65M), #outfitinspo (~15M), #mirrorselfie (~431K).
- Keep mirror framing social-native and candid, not over-directed.`
  }

  if (contentType === 'partyoutfit') {
    return `- Adoption reality: #partyoutfit (~105K) is weaker than local occasion tags.
- Prioritize Vietnamese demand clusters: #vayditiec (~243K) and #damditiec (~119K) for style semantics.
- Keep desirability cues practical: back detail, drape movement, fit proof, occasion versatility.`
  }

  if (contentType === 'athleisure') {
    return `- Adoption reality: #athleisure (~339K) is niche compared to broad women-fashion clusters.
- Blend athleisure intent with wider wearable behavior from #ootd/#outfitinspo to avoid rigid niche output.
- Emphasize real-day transitions over performance-only gym choreography.`
  }

  if (contentType === 'fyp') {
    return `- Adoption reality: #fyp is extremely broad (~8.7B) and weak as a precise fashion signal.
- Use #fyp-style pacing as secondary layer only; core narrative must come from concrete fashion clusters and product proof.
- Never let "viral for viral" override garment readability.`
  }

  if (contentType === 'grwm') {
    return `- Mainstream alignment: #grwm (~22.8M) + #getreadywithme (~3.4M) support strong natural routine storytelling.
- Favor human prep rhythm (micro choices, outfit checks, final confidence moment) over scripted cinematic beats.`
  }

  if (contentType === 'tiktokshop') {
    return `- High-adoption commerce alignment: #tiktokshop (~121M) with proof clusters (#review ~16.4M, #unboxing ~17.7M).
- Keep trust signals visible and practical, avoid over-polished ad scripting.`
  }

  if (contentType === 'ootd' || contentType === 'outfitideas') {
    return `- Strong mainstream alignment: #ootd / #outfitideas / #fitcheck clusters are robust and natural for women fashion.
- Prioritize saveable practical styling and readable silhouette over flashy transitions.`
  }

  return `- Keep content type execution aligned with high-adoption women-fashion behaviors on TikTok.
- Prefer native creator realism over rigid template language.`
}

function formatBeatNameForNarrative(rawName: string): string {
  const normalized = rawName
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()

  if (!normalized) return 'Natural fashion beat'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function containsMotionDiscontinuityKeyword(value: string): boolean {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return false

  return MOTION_DISCONTINUITY_KEYWORDS.some((keyword) => normalized.includes(normalizeLocationKey(keyword)))
}

function detectCameraMotionFamilies(value: string): string[] {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return []

  return Object.entries(CAMERA_MOTION_FAMILY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(normalizeLocationKey(keyword))))
    .map(([family]) => family)
}

function extractMotionDirection(value: string): 'left' | 'right' | 'forward' | 'backward' | 'up' | 'down' | 'clockwise' | 'counterclockwise' | 'none' {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return 'none'

  if (normalized.includes('counterclockwise') || normalized.includes('anti clockwise')) return 'counterclockwise'
  if (normalized.includes('clockwise')) return 'clockwise'
  if (normalized.includes('left') || normalized.includes('sang trai')) return 'left'
  if (normalized.includes('right') || normalized.includes('sang phai')) return 'right'
  if (normalized.includes('forward') || normalized.includes('toward') || normalized.includes('push in') || normalized.includes('dolly in')) return 'forward'
  if (normalized.includes('backward') || normalized.includes('pull back') || normalized.includes('away') || normalized.includes('dolly out')) return 'backward'
  if (normalized.includes('up') || normalized.includes('rise') || normalized.includes('pedestal up')) return 'up'
  if (normalized.includes('down') || normalized.includes('drop') || normalized.includes('pedestal down')) return 'down'

  return 'none'
}

function isOppositeMotionDirection(
  previous: ReturnType<typeof extractMotionDirection>,
  current: ReturnType<typeof extractMotionDirection>,
): boolean {
  if (previous === 'none' || current === 'none') return false

  return (
    (previous === 'left' && current === 'right')
    || (previous === 'right' && current === 'left')
    || (previous === 'forward' && current === 'backward')
    || (previous === 'backward' && current === 'forward')
    || (previous === 'up' && current === 'down')
    || (previous === 'down' && current === 'up')
    || (previous === 'clockwise' && current === 'counterclockwise')
    || (previous === 'counterclockwise' && current === 'clockwise')
  )
}

function normalizeFacingDirectionToken(value: unknown): KeyframeFacingDirection {
  const normalized = normalizeLocationKey(typeof value === 'string' ? value : '')
  if (!normalized) return 'unknown'

  if (normalized.includes('three quarter left') || normalized.includes('3 4 left') || normalized.includes('3 4 trai') || normalized.includes('goc 3 4 trai')) {
    return 'three-quarter-left'
  }
  if (normalized.includes('three quarter right') || normalized.includes('3 4 right') || normalized.includes('3 4 phai') || normalized.includes('goc 3 4 phai')) {
    return 'three-quarter-right'
  }
  if (normalized.includes('back facing') || normalized.includes('rear view') || normalized.includes('facing away') || normalized.includes('back to camera') || normalized.includes('doi lung') || normalized.includes('quay lung')) {
    return 'back'
  }
  if (normalized.includes('front facing') || normalized.includes('facing camera') || normalized.includes('face camera') || normalized.includes('toward camera') || normalized.includes('chinh dien') || normalized.includes('truc dien')) {
    return 'front'
  }
  if (normalized.includes('left facing') || normalized.includes('left profile') || normalized.includes('profile left') || normalized.includes('facing left') || normalized.includes('huong trai') || normalized.includes('sang trai') || normalized.includes('nghieng trai')) {
    return 'left'
  }
  if (normalized.includes('right facing') || normalized.includes('right profile') || normalized.includes('profile right') || normalized.includes('facing right') || normalized.includes('huong phai') || normalized.includes('sang phai') || normalized.includes('nghieng phai')) {
    return 'right'
  }

  return 'unknown'
}

function extractKeyframeFacingDirection(action: unknown, camera?: unknown, facingDirection?: unknown): KeyframeFacingDirection {
  const explicit = normalizeFacingDirectionToken(facingDirection)
  if (explicit !== 'unknown') return explicit

  const fromAction = normalizeFacingDirectionToken(action)
  if (fromAction !== 'unknown') return fromAction

  // Fallback to camera text only if action has no direction token.
  return normalizeFacingDirectionToken(camera)
}

function hasKeyframeTurnCue(...values: Array<unknown>): boolean {
  const normalized = normalizeLocationKey(values.filter((item): item is string => typeof item === 'string').join(' '))
  if (!normalized) return false

  return KEYFRAME_TURN_CUE_KEYWORDS.some((keyword) => normalized.includes(normalizeLocationKey(keyword)))
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

function createTextFingerprint(value: string): string {
  const normalized = value.trim()
  let hash = 5381

  for (let i = 0; i < normalized.length; i += 1) {
    hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i)
  }

  return `fp-${(hash >>> 0).toString(36)}-${normalized.length.toString(36)}`
}

function cloneStageData(value: Record<string, unknown>): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
  } catch {
    return { ...value }
  }
}

function readStageCache(cache: Map<string, StageCacheEntry>, key: string): Record<string, unknown> | null {
  const entry = cache.get(key)
  if (!entry) return null

  if (entry.expiresAt < Date.now()) {
    cache.delete(key)
    return null
  }

  return cloneStageData(entry.data)
}

function writeStageCache(cache: Map<string, StageCacheEntry>, key: string, data: Record<string, unknown>): void {
  cache.set(key, {
    data: cloneStageData(data),
    expiresAt: Date.now() + STAGE_CACHE_TTL_MS,
  })
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
    ? 'In AUTO mode, prioritize types that improve affiliate conversion for women fashion (tiktokshop, outfitideas, ootd, ootdmirror, review) before generic viral framing.'
    : AFFILIATE_VIDEO_OBJECTIVES[contentType as ResolvedContentType]
  const autoModeRule = affiliateMode === 'strict'
    ? 'STRICT AUTO MODE: only allow conversion-oriented types (tiktokshop, outfitideas, review, ootd, ootdmirror). If uncertain, default to tiktokshop.'
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
- Final scene should end with confident product readability and natural visual resolution; do not force CTA language.
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
  const requestedTypeTrendAlignmentRules = isAuto
    ? `- AUTO mode: prefer high-adoption women-fashion clusters (OOTD / OutfitIdeas / Fitcheck / TikTok Shop proof) before niche labels.
- Do not choose FYP-style generic framing as a primary fashion identity.
- If a niche internal label is selected, map to natural public-facing hashtag behavior.`
    : buildTikTokTrendAlignmentRules(contentType as ResolvedContentType)
  const safeJsonStringify = (value: unknown) => {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return '{}'
    }
  }

  const pipelineStartedAt = Date.now()
  const stageMetrics: Array<{ stage: string; attempt: number; durationMs: number; ok: boolean; note?: string }> = []
  const validResolvedTypes: ResolvedContentType[] = ['ootd', 'ootdmirror', 'grwm', 'outfitideas', 'fyp', 'review', 'tiktokshop', 'athleisure', 'haul', 'styling', 'luxury', 'streetstyle', 'partyoutfit']
  const faceImageId = faceImage ? createProductImageId(faceImage) : 'none'
  const productImageId = productImage ? createProductImageId(productImage) : 'none'
  const notesFingerprint = createTextFingerprint(notes)

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

    const shouldRetryStageError = (error: unknown) => {
      const message = (error instanceof Error ? error.message : `${error || ''}`).toLowerCase()

      return (
        message.includes('could not parse json')
        || message.includes('empty content')
        || message.includes('shape mismatch')
        || message.includes('low completeness score')
        || message.includes('keyframe mismatch')
        || message.includes('continuity')
        || message.includes('camera family conflict')
        || message.includes('opposite camera direction')
        || message.includes('discontinuity keyword')
        || message.includes('timeout')
        || message.includes('timed out')
        || message.includes('aborted')
      )
    }

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

        const hasNextAttempt = i < temperatures.length - 1
        if (!hasNextAttempt || !shouldRetryStageError(error)) {
          break
        }
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

    const visualExtractCacheKey = JSON.stringify({
      model,
      faceImageId,
      productImageId,
      notesFingerprint,
      visualExtractPrompt,
    })

    const cachedVisualExtract = readStageCache(VISUAL_EXTRACT_STAGE_CACHE, visualExtractCacheKey)
    const visualAnalysisRaw = cachedVisualExtract ?? await runStage(
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

    if (cachedVisualExtract) {
      stageMetrics.push({
        stage: 'visual_extract',
        attempt: 0,
        durationMs: 0,
        ok: true,
        note: 'cache_hit',
      })
    } else {
      writeStageCache(VISUAL_EXTRACT_STAGE_CACHE, visualExtractCacheKey, visualAnalysisRaw)
    }

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

OBSERVED TIKTOK FASHION BASELINES:
${TIKTOK_OBSERVED_SIGNAL_BASELINE}

REQUESTED TYPE TREND ALIGNMENT:
${requestedTypeTrendAlignmentRules}

NATURALITY GUARDRAILS (MANDATORY):
${NATURALITY_PROMPT_GUARDRAILS}

VEO 3.1 INTERPOLATION SAFETY GUARDRAILS:
${VEO_INTERPOLATION_GUARDRAILS}

CELEBRITY / REAL-PERSON SAFETY GUARDRAILS (MANDATORY):
${CELEBRITY_POLICY_GUARDRAILS}

USER NOTES (HIGHEST PRIORITY WHEN PROVIDED):
${notes ? notes : 'None'}

RULES:
- Location scope: Vietnam, China, South Korea only.
- No duplicate locations against history lists above.
- AI must self-select fresh real-world locations. Do not use fixed/preset location pools.
- Choose ONE primary location and keep it consistent across all keyframes/scenes.
- USER NOTES PRIORITY: If user notes are provided, treat them as the highest-priority creative direction and follow them first.
- Only deviate from user notes when mandatory constraints require it (schema, safety guardrails, location scope, interpolation continuity).
- For OOTDMIRROR, enforce mirror-fitcheck setup across all scenes.
- For OOTD, enforce single-corner studio setup across all scenes.
- For OutfitIdeas, choose mirror-fitcheck OR single-corner studio and keep style consistent.
- Build action/camera progression in small adjacent deltas to reduce first-last-frame interpolation artifacts.
- Plan for retention arc: Hook -> Value -> Proof -> Close.
- If content type label is niche or internal, express the plan using stronger natural TikTok behavior clusters.
- Enforce celebrity/public-figure safety guardrails strictly.

Output STRICT JSON only:
{
  ${isAuto ? '"recommendedContentType": "ootd|ootdmirror|grwm|outfitideas|fyp|review|tiktokshop|athleisure|haul|styling|luxury",' : '"recommendedContentType": "same-as-requested",'}
  "creativeDirection": "...",
  "storyArc": ["hook", "value", "proof", "close"],
  "locationCandidates": ["..."],
  "cameraLanguage": ["..."],
  "lightingDirection": "...",
  "styleLock": "mirror|studio|flex",
  "mustInclude": ["..."],
  "avoid": ["..."]
}`

    const creativePlanCacheKey = JSON.stringify({
      model,
      duration,
      aspectRatio,
      requestedContentType: contentType,
      affiliateMode,
      salesTemplate,
      faceImageId,
      productImageId,
      notesFingerprint,
      planningPrompt,
      usedLocationsForProduct: normalizedUsedLocationsForProduct,
      usedLocationsByOutfitType: normalizedUsedLocationsByOutfitType,
    })

    const cachedCreativePlan = readStageCache(CREATIVE_PLAN_STAGE_CACHE, creativePlanCacheKey)
    const planningResultRaw = cachedCreativePlan ?? await runStage(
      'creative_plan',
      [0.68, 0.52],
      4096,
      (temperature, maxTokens) => requestGeminiJson(apiKey, model, planningPrompt, temperature, maxTokens),
      validatePlanningResult,
    )

    if (cachedCreativePlan) {
      stageMetrics.push({
        stage: 'creative_plan',
        attempt: 0,
        durationMs: 0,
        ok: true,
        note: 'cache_hit',
      })
    } else {
      writeStageCache(CREATIVE_PLAN_STAGE_CACHE, creativePlanCacheKey, planningResultRaw)
    }

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

    const finalResolvedType = finalContentType as ResolvedContentType
    const finalStyleLock = getContentTypeStyleLock(finalResolvedType)
    const contentTypeNativeSignalRules = buildTikTokNativeSignalRules(finalResolvedType)
    const finalTypeTrendAlignmentRules = buildTikTokTrendAlignmentRules(finalResolvedType)

    const affiliateObjectiveForFinal = AFFILIATE_VIDEO_OBJECTIVES[finalResolvedType]
    const usedLocationsForFinalOutfitType = normalizedUsedLocationsByOutfitType[finalResolvedType] || []
    const blockedLocationKeys = new Set(
      [...normalizedUsedLocationsForProduct, ...usedLocationsForFinalOutfitType]
        .map((location) => normalizeLocationKey(location))
    )

    const isLocationCandidateAllowed = (location: string) => {
      const candidate = location.trim()
      if (candidate.length === 0) return false

      const candidateKey = normalizeLocationKey(candidate)

      return (
        isAllowedLocationCountry(candidate)
        && matchesStyleLockForLocation(candidate, finalStyleLock)
        && !blockedLocationKeys.has(candidateKey)
      )
    }

    const aiPlannedLocationPool = planningResult.locationCandidates
      .filter((location) => isLocationCandidateAllowed(location))
    const primaryPlannedLocation = aiPlannedLocationPool[0] || ''

    const validatePackageLocationsBasic = (value: Record<string, unknown>): { ok: boolean; reason?: string } => {
      const keyframes = Array.isArray(value.keyframes) ? value.keyframes : []
      if (keyframes.length !== keyframeCount) {
        return { ok: false, reason: `location validation keyframe mismatch ${keyframes.length}/${keyframeCount}` }
      }

      for (let i = 0; i < keyframes.length; i += 1) {
        const keyframe = asRecord(keyframes[i]) ? keyframes[i] as Record<string, unknown> : null
        if (!keyframe) {
          return { ok: false, reason: `keyframe[${i}] is not an object` }
        }

        const location = toSafeText(keyframe.location, '')
        if (location.length === 0) {
          return { ok: false, reason: `keyframe[${i}] missing location` }
        }

      }

      return { ok: true }
    }

    const validatePackageLocationsStrict = (value: Record<string, unknown>): { ok: boolean; reason?: string } => {
      const keyframes = Array.isArray(value.keyframes) ? value.keyframes : []
      if (keyframes.length !== keyframeCount) {
        return { ok: false, reason: `strict location validation keyframe mismatch ${keyframes.length}/${keyframeCount}` }
      }

      for (let i = 0; i < keyframes.length; i += 1) {
        const keyframe = asRecord(keyframes[i]) ? keyframes[i] as Record<string, unknown> : null
        if (!keyframe) {
          return { ok: false, reason: `keyframe[${i}] is not an object` }
        }

        const location = toSafeText(keyframe.location, '')
        if (location.length === 0) {
          return { ok: false, reason: `keyframe[${i}] missing location` }
        }

        if (!isAllowedLocationCountry(location)) {
          return { ok: false, reason: `keyframe[${i}] location out of VN/CN/KR scope` }
        }

        if (!isLocationCandidateAllowed(location)) {
          return { ok: false, reason: `keyframe[${i}] location blocked by history constraints` }
        }

        if (!matchesStyleLockForLocation(location, finalStyleLock)) {
          return { ok: false, reason: `keyframe[${i}] location violates style lock ${finalStyleLock}` }
        }
      }

      const firstLocation = asRecord(keyframes[0]) ? toSafeText((keyframes[0] as Record<string, unknown>).location, '') : ''
      const primaryLocationKey = normalizeLocationKey(firstLocation)
      if (!primaryLocationKey) {
        return { ok: false, reason: 'missing primary location in keyframe[0]' }
      }

      for (let i = 1; i < keyframes.length; i += 1) {
        const keyframe = asRecord(keyframes[i]) ? keyframes[i] as Record<string, unknown> : null
        const location = keyframe ? toSafeText(keyframe.location, '') : ''
        const locationKey = normalizeLocationKey(location)
        if (locationKey !== primaryLocationKey) {
          return { ok: false, reason: `keyframe[${i}] location not consistent with primary location` }
        }
      }

      return { ok: true }
    }

    const validatePackageTemporalContinuity = (
      value: Record<string, unknown>,
      strict: boolean,
    ): { ok: boolean; reason?: string } => {
      const keyframes = Array.isArray(value.keyframes) ? value.keyframes : []
      const scenes = Array.isArray(value.scenes) ? value.scenes : []

      if (keyframes.length !== keyframeCount || scenes.length !== sceneCount) {
        return { ok: false, reason: 'continuity validation shape mismatch' }
      }

      for (let i = 0; i < keyframes.length; i += 1) {
        const keyframe = asRecord(keyframes[i]) ? keyframes[i] as Record<string, unknown> : null
        if (!keyframe) {
          return { ok: false, reason: `continuity keyframe[${i}] is not an object` }
        }

        const action = toSafeText(keyframe.action, '')
        const camera = toSafeText(keyframe.camera, '')

        if (containsMotionDiscontinuityKeyword(action) || containsMotionDiscontinuityKeyword(camera)) {
          return { ok: false, reason: `keyframe[${i}] contains discontinuity keyword` }
        }

        const families = detectCameraMotionFamilies(camera)
        if (families.length > (strict ? 1 : 2)) {
          return { ok: false, reason: `keyframe[${i}] camera family conflict ${families.join('/')}` }
        }
      }

      for (let i = 1; i < keyframes.length; i += 1) {
        const previousKeyframe = asRecord(keyframes[i - 1]) ? keyframes[i - 1] as Record<string, unknown> : null
        const currentKeyframe = asRecord(keyframes[i]) ? keyframes[i] as Record<string, unknown> : null
        if (!previousKeyframe || !currentKeyframe) {
          return { ok: false, reason: `continuity keyframe pair[${i - 1},${i}] is not valid` }
        }

        const previousAction = toSafeText(previousKeyframe.action, '')
        const previousCamera = toSafeText(previousKeyframe.camera, '')
        const currentAction = toSafeText(currentKeyframe.action, '')
        const currentCamera = toSafeText(currentKeyframe.camera, '')

        const previousFacingDirection = extractKeyframeFacingDirection(
          previousAction,
          previousCamera,
          previousKeyframe.facingDirection,
        )
        const currentFacingDirection = extractKeyframeFacingDirection(
          currentAction,
          currentCamera,
          currentKeyframe.facingDirection,
        )

        if (
          previousFacingDirection !== 'unknown'
          && currentFacingDirection !== 'unknown'
          && previousFacingDirection === currentFacingDirection
        ) {
          return {
            ok: false,
            reason: `keyframe[${i - 1}] and keyframe[${i}] share same facing direction (${currentFacingDirection}); Rule 32 requires a turn/pivot`,
          }
        }

        const hasTurnCue = hasKeyframeTurnCue(previousAction, previousCamera, currentAction, currentCamera)

        if (
          !hasTurnCue
          && (
            (strict && (previousFacingDirection === 'unknown' || currentFacingDirection === 'unknown'))
            || (!strict && previousFacingDirection === 'unknown' && currentFacingDirection === 'unknown')
          )
        ) {
          return {
            ok: false,
            reason: `keyframe[${i - 1}] -> keyframe[${i}] lacks explicit turn cue/facing change for Rule 32`,
          }
        }
      }

      for (let i = 0; i < scenes.length; i += 1) {
        const scene = asRecord(scenes[i]) ? scenes[i] as Record<string, unknown> : null
        if (!scene) {
          return { ok: false, reason: `continuity scene[${i}] is not an object` }
        }

        const narrative = toSafeText(scene.narrative, '')
        const cameraMovement = toSafeText(scene.cameraMovement, '')

        if (containsMotionDiscontinuityKeyword(narrative) || containsMotionDiscontinuityKeyword(cameraMovement)) {
          return { ok: false, reason: `scene[${i}] contains discontinuity keyword` }
        }

        const families = detectCameraMotionFamilies(cameraMovement)
        if (families.length > 1) {
          return { ok: false, reason: `scene[${i}] camera family conflict ${families.join('/')}` }
        }
      }

      if (strict) {
        for (let i = 1; i < scenes.length; i += 1) {
          const prevScene = asRecord(scenes[i - 1]) ? scenes[i - 1] as Record<string, unknown> : null
          const currentScene = asRecord(scenes[i]) ? scenes[i] as Record<string, unknown> : null
          if (!prevScene || !currentScene) continue

          const prevDirection = extractMotionDirection(`${toSafeText(prevScene.cameraMovement, '')} ${toSafeText(prevScene.narrative, '')}`)
          const currentDirection = extractMotionDirection(`${toSafeText(currentScene.cameraMovement, '')} ${toSafeText(currentScene.narrative, '')}`)

          if (isOppositeMotionDirection(prevDirection, currentDirection)) {
            return {
              ok: false,
              reason: `scene[${i}] opposite camera direction ${prevDirection} -> ${currentDirection}`,
            }
          }
        }
      }

      return { ok: true }
    }

    const validatePackageShapeAndLocations = (
      value: Record<string, unknown>,
      minScore: number,
    ): { ok: boolean; reason?: string } => {
      const shapeValidation = validatePackageShape(value, keyframeCount, sceneCount, minScore)
      if (!shapeValidation.ok) return shapeValidation
      return validatePackageLocationsBasic(value)
    }

    const validatePackageShapeAndLocationsStrict = (
      value: Record<string, unknown>,
      minScore: number,
    ): { ok: boolean; reason?: string } => {
      const shapeValidation = validatePackageShape(value, keyframeCount, sceneCount, minScore)
      if (!shapeValidation.ok) return shapeValidation
      return validatePackageLocationsStrict(value)
    }

    const validatePackageShapeLocationsAndMotion = (
      value: Record<string, unknown>,
      minScore: number,
    ): { ok: boolean; reason?: string } => {
      const shapeAndLocationValidation = validatePackageShapeAndLocations(value, minScore)
      if (!shapeAndLocationValidation.ok) return shapeAndLocationValidation
      return validatePackageTemporalContinuity(value, false)
    }

    const validatePackageShapeLocationsAndMotionStrict = (
      value: Record<string, unknown>,
      minScore: number,
    ): { ok: boolean; reason?: string } => {
      const shapeAndLocationValidation = validatePackageShapeAndLocationsStrict(value, minScore)
      if (!shapeAndLocationValidation.ok) return shapeAndLocationValidation
      return validatePackageTemporalContinuity(value, true)
    }

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

OBSERVED TIKTOK FASHION BASELINES:
${TIKTOK_OBSERVED_SIGNAL_BASELINE}

TYPE-SPECIFIC TIKTOK SIGNALS (MANDATORY):
${contentTypeNativeSignalRules}

CONTENT-TYPE TREND ALIGNMENT (MANDATORY):
${finalTypeTrendAlignmentRules}

NATURALITY GUARDRAILS (MANDATORY):
${NATURALITY_PROMPT_GUARDRAILS}

VEO 3.1 INTERPOLATION SAFETY GUARDRAILS:
${VEO_INTERPOLATION_GUARDRAILS}

CELEBRITY / REAL-PERSON SAFETY GUARDRAILS (MANDATORY):
${CELEBRITY_POLICY_GUARDRAILS}

LOCATIONS ALREADY USED FOR THIS PRODUCT IMAGE ID (MUST AVOID REUSE):
${usedLocationsProductPrompt}

LOCATIONS ALREADY USED FOR SAME OUTFIT TYPE (MUST AVOID REUSE):
${usedLocationsOutfitTypePrompt}

PRIMARY LOCATION LOCK (MANDATORY):
${primaryPlannedLocation.length > 0
  ? `Use this exact location string in all keyframes/scenes: ${primaryPlannedLocation}`
  : 'Select one valid real-world location in Vietnam/China/South Korea and keep it identical across all keyframes/scenes.'}

USER NOTES (HIGHEST PRIORITY WHEN PROVIDED):
${notes ? notes : 'None'}

${notes ? `⚡ USER NOTES PRIORITY MODE — ACTIVE
Rule 30 is the PRIMARY creative directive for this run.
Rules 9, 11, 13, 17–20, 23–29 (style, tone, location, camera, format, narrative, pacing)
are SUBORDINATE to User Notes wherever user intent conflicts with defaults.
Apply User Notes first; only fall back to defaults when User Notes are silent on a dimension.
Truly non-negotiable: Rule 31 (celebrity safety), output schema structure, scene/keyframe counts,
and VEO interpolation continuity (Rules 1, 2, 12).` : ''}

CRITICAL RULES [Rules 1–29 yield to Rule 30 (User Notes) where narrative/style/format/location conflict; Rules 1, 2, 12, 31 and schema are always enforced]:
1. Each scene is exactly 8 seconds, using Veo 3.1 first-frame + last-frame interpolation.
2. Keyframe chain must be SEAMLESS: last frame of scene N = first frame of scene N+1.
3. Character identity must be perfectly consistent across all keyframes (face, body proportions, hair, skin tone).
4. Product/garment must be EXACTLY preserved from the reference image (color, silhouette, material, details).
5. Follow TikTok retention arc across timeline: Hook (0-3s) -> Value -> Proof -> Close.
6. Scene 1 must create a strong visual hook in the first 1-3 seconds with immediate product readability.
7. Infer scene context from garment/product characteristics, content type, and user notes; avoid generic preset randomness.
8. NEVER use background, location, props, or lighting from the FACE reference image. Face image is identity-only.
9. Keep one primary location coherent across all keyframes/scenes; do not change location unless user explicitly requests a transition. [SUBORDINATE to Rule 30 — User Notes may specify multi-location or location changes]
10. Prompt detail quality must follow Veo best practice: each keyframe/scenes should be specific on Subject, Action, Camera, Composition, Style, and Ambiance/Lighting.
11. Camera grammar must stay coherent: one dominant camera move per 8s scene, no chaotic mixed camera instructions.
12. First-last-frame interpolation safety is mandatory: adjacent keyframes must use micro-progression (small pose delta, stable framing axis, no sudden body teleport).
13. Lighting and color tone continuity must be maintained across adjacent scenes unless a deliberate story transition is stated.
14. LOCATION MUST BE REAL-WORLD VENUES ONLY - Use authentic, recognizable physical places (cafes, streets, parks, shopping districts, studios), never CGI/digital/fantasy environments.
15. LOCATION SCOPE = VIETNAM, CHINA, SOUTH KOREA ONLY - Every location must be in Vietnam, China, or South Korea, and must include concrete city/area + venue details.
16. AVOID PREVIOUS LOCATIONS FOR SAME PRODUCT IMAGE ID + SAME OUTFIT TYPE - Never reuse locations listed in either location-history section above.
17. ANTI-DUPLICATE + RANDOMIZATION REQUIREMENT - Use the Diversity seed to generate fresh concepts; do not duplicate ACTION, LOCATION, CAMERA, NARRATIVE in one output.
18. PRODUCT-FIRST COMPOSITION - Product/garment is the hero in every keyframe; avoid clutter and occlusion that hides purchase-relevant details.
19. MOBILE SAFE-FRAME RULE - Keep hero subject in a central safe area and avoid placing critical details at extreme top/bottom edges where TikTok UI/captions can cover them. [SUBORDINATE to Rule 30 — User Notes on framing override this]
20. RETENTION PACING RULE - Avoid static visuals for too long; every ~1-2 seconds should include meaningful subject or camera progression. [SUBORDINATE to Rule 30 — User Notes on pace/mood override this]
21. NO VOICE REQUIREMENT - The video must work fully without voiceover/dialogue. Do not rely on spoken lines to deliver value or proof.
22. AUDIO IS OPTIONAL (IF USED) - Prefer silent-first visual storytelling. If adding SFX/ambience, describe it clearly but keep comprehension independent from audio.
23. AUTHENTICITY + TRUST - Favor natural, believable social-native scenes; avoid over-stylized fake ad feel, low-value filler, and exaggerated claims.
24. NO-CTA ENDING + TEMPLATE CONSISTENCY - Final scene should land a clean visual payoff with product clarity; explicit CTA is optional and never mandatory.
25. OOTD FAMILY TREND FORMAT (TIKTOK-ALIGNED) - For content type OOTDMIRROR, enforce mirror fitcheck flow only. For OOTD, enforce single-corner studio flow only. For OutfitIdeas, prioritize one of two proven setups: (A) Mirror fitcheck flow, or (B) Single-corner studio flow. [SUBORDINATE to Rule 30 — User Notes override format/flow]
26. MIRROR FITCHECK SPEC - Use full-body mirror framing, vertical social-native phone aesthetic, visible head-to-toe outfit readability, and ensure no camera/tripod/operator reflection appears in the mirror. [SUBORDINATE to Rule 30 — User Notes may modify mirror spec]
27. SINGLE-CORNER STUDIO SPEC - Keep one fixed studio corner/backdrop with clean floor-wall geometry, soft controlled lighting, minimal props, and consistent camera axis for all scenes. [SUBORDINATE to Rule 30 — User Notes may modify studio spec]
28. STYLE CONSISTENCY LOCK - OOTDMIRROR must stay mirror-only, OOTD must stay studio-only, and OutfitIdeas must keep its chosen setup (mirror or studio) consistent across all scenes unless there is an explicit narrative reason to transition. [SUBORDINATE to Rule 30 — User Notes may override style lock]
29. INTERPOLATION ANTI-GLITCH RULE - Avoid terms/instructions implying abrupt transitions (teleport, jump cut, hard cut, instant morph, abrupt switch), and avoid immediate opposite camera direction between adjacent scenes unless an explicit turnaround beat is included.
30. USER NOTES PRIORITY LOCK (HIGHEST CREATIVE AUTHORITY) — User Notes OVERRIDE all default style, tone, format, location, camera, and narrative choices in Rules 5–29 for any dimension they explicitly address. Only fall back to rule defaults for dimensions User Notes are silent on. Rule 31 (celebrity safety), output schema structure, scene/keyframe counts, and VEO interpolation continuity (Rules 1, 2, 12) are the only truly non-negotiable constraints.
31. CELEBRITY / PUBLIC-FIGURE SAFETY LOCK - Never depict/imitate/reference real celebrities/public figures/identifiable persons, never generate deepfake-style impersonation or fake endorsement/dialogue; if user asks for real person, convert to fictional archetype while preserving only general mood/style.
32. CONSECUTIVE KEYFRAME FACING DIRECTION LOCK — Two adjacent keyframes MUST NOT place the subject facing the same body direction (e.g., both fully front-facing, both fully side-facing, both fully rear-facing). Every keyframe transition must include a discernible body turn or pivot.
  - For each keyframe, provide explicit body-facing intent in both action text and facingDirection token.
  - Allowed facingDirection tokens: "front", "back", "left", "right", "three-quarter-left", "three-quarter-right".
  - Adjacent keyframes must never repeat the same facingDirection token.
  - Reason: Veo 3.1 interpolates between frames but has zero reference for the garment back side; repeated same-direction framing forces hallucination of unknown back-of-garment details, causing severe outfit inconsistency.
  - If the narrative requires a held direction, break it with a slight 3/4 pivot before continuing.
  [ALWAYS ENFORCED — not subordinate to Rule 30]

Return STRICT COMPACT JSON only in this schema:
{
  "masterDNA": "character consistency description",
  "keyframes": [
    {
      "index": 0,
      "action": "pose/movement description",
      "facingDirection": "front|back|left|right|three-quarter-left|three-quarter-right",
      "location": "real location (city/area + venue details in Vietnam/China/South Korea)",
      "camera": "lens, shot type, angle",
      "lighting": "lighting setup",
      "style": "photography style"
    }
  ],
  "scenes": [
    {
      "index": 0,
      "narrative": "scene description with retention beat",
      "cameraMovement": "camera movement description"
    }
  ]
}

Keep output compact. Omit fields that can be deterministically rebuilt later (subject, timestamp, timeRange, startPose, endPose).
`

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
      (value) => validatePackageShapeLocationsAndMotion(value, 0.62),
    )

    // STAGE 4 — QA + REPAIR (with fast-path skip)
    const draftQualityScore = getPackageCompletenessScore(draftPackage, keyframeCount, sceneCount)
    const draftStrictValidation = validatePackageShapeLocationsAndMotionStrict(draftPackage, 0.65)
    const canSkipQaRepair = draftStrictValidation.ok && draftQualityScore >= 0.65

    let parsed: Record<string, unknown> = draftPackage

    if (canSkipQaRepair) {
      stageMetrics.push({
        stage: 'qa_repair',
        attempt: 0,
        durationMs: 0,
        ok: true,
        note: `fast_path_skip strict_ok score=${draftQualityScore.toFixed(2)}`,
      })
    } else {
      const qaRepairPrompt = `You are a strict QA + repair model for TikTok fashion video prompt packages.

  Validate and repair the draft package to satisfy all constraints below:
  - Enforce CRITICAL RULES 1..32 exactly as defined in package generation stage.
  - Keep location scope strictly in Vietnam/China/South Korea and real-world venues only.
  - Keep scene/keyframe continuity aligned with rules 2, 9, 12, and 13.
  - AI must choose fresh locations itself and must avoid all locations listed in location-history constraints.
  - Keep camera grammar coherent and avoid chaotic mixed movement in one scene.
  - Preserve character identity and garment fidelity with zero drift.
  - Treat USER NOTES as highest-priority intent and preserve them over default creative choices unless mandatory constraints conflict.
  - Enforce style lock by type: OOTDMIRROR mirror-only, OOTD studio-only, OutfitIdeas fixed to its chosen setup unless narrative explicitly transitions.
  - Keep product-first composition and TikTok retention pacing.
  - Use the same primary location lock in all keyframes/scenes.
  - Enforce interpolation safety guardrails: micro-progression between adjacent keyframes, no abrupt opposite camera direction, no discontinuity keywords.
  - Enforce Rule 32: adjacent keyframes must show different body-facing directions (turn/pivot required between every consecutive KF pair); never repeat same facing to avoid Veo 3.1 garment-back hallucination.
  - Require explicit facingDirection token on each keyframe: front|back|left|right|three-quarter-left|three-quarter-right.

PRIMARY LOCATION LOCK (MANDATORY):
${primaryPlannedLocation.length > 0
    ? primaryPlannedLocation
    : 'No pre-selected lock available. Keep one location consistent across all keyframes/scenes.'}

USER NOTES (HIGHEST PRIORITY WHEN PROVIDED):
${notes ? notes : 'None'}

DRAFT PACKAGE JSON:
${safeJsonStringify(draftPackage)}

TYPE-SPECIFIC TIKTOK SIGNALS (MANDATORY):
${contentTypeNativeSignalRules}

CONTENT-TYPE TREND ALIGNMENT (MANDATORY):
${finalTypeTrendAlignmentRules}

NATURALITY GUARDRAILS (MANDATORY):
${NATURALITY_PROMPT_GUARDRAILS}

VEO 3.1 INTERPOLATION SAFETY GUARDRAILS:
${VEO_INTERPOLATION_GUARDRAILS}

CELEBRITY / REAL-PERSON SAFETY GUARDRAILS (MANDATORY):
${CELEBRITY_POLICY_GUARDRAILS}

Return STRICT JSON only, same schema:
{
  "masterDNA": "...",
  "keyframes": [ ... ],
  "scenes": [ ... ]
}`

      try {
        const repairedPackage = await runStage(
          'qa_repair',
          [0.45, 0.32],
          8192,
          (temperature, maxTokens) => requestGeminiJson(apiKey, model, qaRepairPrompt, temperature, maxTokens),
          (value) => validatePackageShapeLocationsAndMotion(value, 0.65),
        )
        const repairedQualityScore = getPackageCompletenessScore(repairedPackage, keyframeCount, sceneCount)

        if (repairedQualityScore >= draftQualityScore - 0.02) {
          parsed = repairedPackage
        }
      } catch {
        // If QA repair fails, fallback to draft package to keep generation flow resilient.
        parsed = draftPackage
      }
    }

    const strictLocationValidation = validatePackageLocationsStrict(parsed)
    if (!strictLocationValidation.ok) {
      const locationRepairPrompt = `You are a strict location-only repair model for TikTok fashion video prompt packages.

TASK:
- Repair ONLY location-related fields so the package satisfies constraints.
- Keep masterDNA, actions, camera, lighting, style, and scene pacing unchanged unless absolutely necessary for continuity.
- Enforce ONE primary location across all keyframes/scenes.
- Preserve celebrity/public-figure safety guardrails (no real-person likeness or impersonation cues).

LOCATION CONSTRAINTS:
- Scope strictly Vietnam/China/South Korea.
- Avoid all locations in history lists below.
- Keep real-world venues only.

LOCATIONS ALREADY USED FOR THIS PRODUCT IMAGE ID (MUST AVOID REUSE):
${usedLocationsProductPrompt}

LOCATIONS ALREADY USED FOR SAME OUTFIT TYPE (MUST AVOID REUSE):
${usedLocationsOutfitTypePrompt}

AI-PLANNED LOCATION CANDIDATES (PREFERRED):
${aiPlannedLocationPool.length > 0 ? aiPlannedLocationPool.join('\n') : 'None'}

PRIMARY LOCATION LOCK (MANDATORY):
${primaryPlannedLocation.length > 0
  ? `Use this exact location string in all keyframes/scenes: ${primaryPlannedLocation}`
  : 'If unavailable, keep one valid location consistent across all keyframes/scenes.'}

FAILED VALIDATION REASON:
${strictLocationValidation.reason || 'unknown'}

DRAFT PACKAGE JSON:
${safeJsonStringify(parsed)}

Return STRICT JSON only, same schema:
{
  "masterDNA": "...",
  "keyframes": [ ... ],
  "scenes": [ ... ]
}`

      try {
        const locationRepairedPackage = await runStage(
          'location_repair',
          [0.28, 0.18],
          8192,
          (temperature, maxTokens) => requestGeminiJson(apiKey, model, locationRepairPrompt, temperature, maxTokens),
          (value) => validatePackageShapeAndLocationsStrict(value, 0.60),
        )
        parsed = locationRepairedPackage
      } catch {
        // Keep current package; local location resolver will apply best-effort fixing.
      }
    }

    const strictMotionValidation = validatePackageTemporalContinuity(parsed, true)
    if (!strictMotionValidation.ok) {
      const motionRepairPrompt = `You are a strict interpolation-continuity repair model for Veo 3.1 first-frame -> last-frame fashion videos.

TASK:
- Repair ONLY motion/camera continuity fields so interpolation between keyframes is physically plausible.
- Keep location, character identity, garment fidelity, and style lock unchanged.
- Maintain existing story arc and product-first composition.
- Preserve celebrity/public-figure safety guardrails (no real-person likeness or impersonation cues).

INTERPOLATION CONTINUITY REQUIREMENTS:
- Adjacent keyframes must be micro-progression, not abrupt pose jumps.
- Use one dominant camera movement per scene (no mixed camera grammar).
- Avoid immediate opposite camera direction across adjacent scenes unless explicit turnaround beat is described.
- Remove discontinuity terms such as teleport, jump cut, hard cut, instant morph, abrupt switch.
- Enforce facing continuity lock: consecutive keyframes must not repeat the same body-facing direction; include explicit turn/pivot cues and facingDirection token per keyframe.

TYPE-SPECIFIC TIKTOK SIGNALS (MANDATORY):
${contentTypeNativeSignalRules}

CONTENT-TYPE TREND ALIGNMENT (MANDATORY):
${finalTypeTrendAlignmentRules}

NATURALITY GUARDRAILS (MANDATORY):
${NATURALITY_PROMPT_GUARDRAILS}

VEO 3.1 INTERPOLATION SAFETY GUARDRAILS:
${VEO_INTERPOLATION_GUARDRAILS}

CELEBRITY / REAL-PERSON SAFETY GUARDRAILS (MANDATORY):
${CELEBRITY_POLICY_GUARDRAILS}

FAILED VALIDATION REASON:
${strictMotionValidation.reason || 'unknown'}

DRAFT PACKAGE JSON:
${safeJsonStringify(parsed)}

Return STRICT JSON only, same schema:
{
  "masterDNA": "...",
  "keyframes": [ ... ],
  "scenes": [ ... ]
}`

      try {
        const motionRepairedPackage = await runStage(
          'motion_repair',
          [0.32, 0.22],
          8192,
          (temperature, maxTokens) => requestGeminiJson(apiKey, model, motionRepairPrompt, temperature, maxTokens),
          (value) => validatePackageShapeLocationsAndMotionStrict(value, 0.60),
        )
        parsed = motionRepairedPackage
      } catch {
        // Keep current package; downstream fallback still builds synchronized prompts.
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

    const pickAiPlannedLocationFallback = (): string => {
      if (aiPlannedLocationPool.length === 0) {
        return ''
      }
      return aiPlannedLocationPool[0]
    }

    const resolveLocationFromPackage = (value: unknown) => {
      if (primaryPlannedLocation.length > 0 && isLocationCandidateAllowed(primaryPlannedLocation)) {
        return primaryPlannedLocation
      }

      const candidate = toSafeString(value, '')
      if (isLocationCandidateAllowed(candidate)) {
        return candidate
      }

      const fallbackFromAiPlan = pickAiPlannedLocationFallback()
      if (fallbackFromAiPlan.length > 0) {
        return fallbackFromAiPlan
      }

      const styleLockFallback = getStyleLockFallbackLocation(finalStyleLock)
      if (isLocationCandidateAllowed(styleLockFallback)) {
        return styleLockFallback
      }

      throw new Error('No valid AI-selected primary location available')
    }

    const primaryResolvedLocation = resolveLocationFromPackage(rawKeyframes[0]?.location)
    const synchronizedKeyframeLocations = Array.from({ length: keyframeCount }, () => primaryResolvedLocation)

    const fallbackActionByType: Record<Exclude<ContentType, 'auto'>, string> = {
      ootd: 'Confident outfit showcase pose and movement tailored for OOTD storytelling',
      ootdmirror: 'Mirror-first fitcheck movement with full-body readability and reflection-safe posing',
      grwm: 'Natural getting-ready movement that highlights styling steps and final look',
      outfitideas: 'Practical mix-and-match outfit demonstration with clear style transformation',
      fyp: 'Scroll-stopping fashion movement with dynamic pose transition',
      review: 'Authentic product demonstration pose emphasizing fit and material quality',
      tiktokshop: 'Conversion-focused product showcase movement optimized for TikTok Shop clarity and intent',
      athleisure: 'Energetic gym-to-café transition movement with sporty-chic confidence',
      haul: 'Excited try-on movements showcasing product fit and styling versatility',
      styling: 'Purposeful modeling pose highlighting outfit coordination and styling impact',
      luxury: 'Composed understated movement exuding timeless elegance and quiet confidence',
      streetstyle: 'Natural outdoor walk movement showcasing outfit silhouette and wearability in authentic urban street setting',
      partyoutfit: 'Elegant full-body occasion dress reveal with back-design pivot and flowing fabric drape movement',
    }

    const fallbackStyleByType: Record<Exclude<ContentType, 'auto'>, string> = {
      ootd: 'Professional fashion editorial, OOTD TikTok aesthetic',
      ootdmirror: 'Mirror fitcheck social-native aesthetic, clean reflection-safe composition',
      grwm: 'Warm lifestyle GRWM visual style, intimate and clean',
      outfitideas: 'Practical outfit idea lookbook, clean visual hierarchy and wearable styling cues',
      fyp: 'Viral cinematic fashion style with bold visual energy',
      review: 'Trustworthy product review style with high material clarity',
      tiktokshop: 'TikTok Shop conversion style with product clarity, social proof, and urgency cues',
      athleisure: 'Urban sporty-chic lifestyle photography, natural daylight',
      haul: 'Energetic colorful unboxing and try-on aesthetic, dynamic lighting',
      styling: 'Expert fashion editorial style, polished and educational',
      luxury: 'Old money sophisticated aesthetic, understated timeless elegance, neutral palette',
      streetstyle: 'Outdoor urban candid street fashion aesthetic, natural daylight or golden hour, authentic movement energy',
      partyoutfit: 'Occasion dress editorial aesthetic, soft elegant lighting, silhouette and back-detail emphasis, aspirational event venue atmosphere',
    }

    const inferredCameraFallback = 'AI-selected framing, lens, and movement optimized for fashion storytelling'
    const inferredLightingFallback = 'Lighting inferred from scene mood and garment texture visibility'

    // Build full prompts for each keyframe and scene
    const keyframes: KeyframePrompt[] = rawKeyframes.map((kf: any, i: number) => {
      const subject = `Create image ${aspectRatio} no split-screen. Faithful character face and body outfit likeness image reference.`
      const action = toSafeString(kf.action, fallbackActionByType[finalContentType as Exclude<ContentType, 'auto'>])
      const location = synchronizedKeyframeLocations[i] || primaryResolvedLocation
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
      const startLocation = keyframes[i]?.location || primaryResolvedLocation
      const endLocation = keyframes[i + 1]?.location || primaryResolvedLocation
      const locationFlow = normalizeLocationKey(startLocation) === normalizeLocationKey(endLocation)
        ? `Hold location: ${startLocation}`
        : `${startLocation} -> ${endLocation}`
      const beatIndex = i % SCENE_BEATS_MAP[finalContentType as Exclude<ContentType, 'auto'>].length
      const beatLabel = formatBeatNameForNarrative(
        SCENE_BEATS_MAP[finalContentType as Exclude<ContentType, 'auto'>][beatIndex].name
      )
      const narrative = toSafeString(
        sc.narrative,
        normalizeLocationKey(startLocation) === normalizeLocationKey(endLocation)
          ? `${beatLabel}. Keep the scene fully at ${startLocation} while the model transitions smoothly between matched keyframes over ${endSec - startSec} seconds.`
          : `${beatLabel}. Transition location naturally from ${startLocation} to ${endLocation} while keeping smooth pose continuity over ${endSec - startSec} seconds.`
      )
      const cameraMovement = toSafeString(
        sc.cameraMovement,
        SCENE_BEATS_MAP[finalContentType as Exclude<ContentType, 'auto'>][beatIndex].cameraHint
      )
      const timeRange = toSafeString(sc.timeRange, `${startSec}s-${endSec}s`)

      const lighting = keyframes[i]?.lighting || ''
      const composition = keyframes[i]?.camera || ''
      const subject = typeof parsed.masterDNA === 'string' ? parsed.masterDNA.trim() : ''

      return {
        index: i,
        timeRange,
        subject,
        narrative,
        startPose,
        endPose,
        composition,
        cameraMovement,
        lighting,
        locationFlow,
        fullPrompt: [
          subject ? `SUBJECT: ${subject}` : '',
          `ACTION: ${narrative}`,
          composition ? `COMPOSITION: ${composition}` : '',
          `CAMERA: ${cameraMovement}`,
          lighting ? `LIGHTING: ${lighting}` : '',
        ].filter(Boolean).join('\n'),
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

function toHistoryRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toHistoryString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function toHistoryInteger(value: unknown, fallback = 0): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, Math.round(numeric))
}

function toHistoryStringList(value: unknown, maxItems = 20): string[] {
  if (!Array.isArray(value)) return []

  return Array.from(new Set(
    value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  )).slice(0, maxItems)
}

function normalizeHistoryContentType(value: unknown, fallback: ContentType = 'ootd'): ContentType {
  const candidate = toHistoryString(value, fallback).toLowerCase()
  return CONTENT_TYPE_VALUES.includes(candidate as ContentType)
    ? candidate as ContentType
    : fallback
}

function normalizeHistoryResolvedContentType(value: unknown, fallback: ResolvedContentType = 'outfitideas'): ResolvedContentType {
  const candidate = toHistoryString(value, fallback).toLowerCase()
  return RESOLVED_CONTENT_TYPES.includes(candidate as ResolvedContentType)
    ? candidate as ResolvedContentType
    : fallback
}

function normalizeHistoryAspectRatio(value: unknown, fallback: '9:16' | '16:9' = '9:16'): '9:16' | '16:9' {
  const candidate = toHistoryString(value, fallback)
  return ASPECT_RATIO_VALUES.includes(candidate as '9:16' | '16:9')
    ? candidate as '9:16' | '16:9'
    : fallback
}

function inferDurationFromPromptCounts(keyframeCount: number, sceneCount: number, fallback = 32): number {
  const matched = DURATIONS.find((entry) => entry.keyframes === keyframeCount && entry.scenes === sceneCount)
  return matched ? matched.value : fallback
}

function normalizeHistoryDuration(value: unknown, fallback = 32): number {
  const candidate = toHistoryInteger(value, fallback)
  const matched = DURATIONS.find((entry) => entry.value === candidate)
  if (matched) return matched.value

  const fallbackMatched = DURATIONS.find((entry) => entry.value === fallback)
  return fallbackMatched ? fallbackMatched.value : DURATIONS[1].value
}

function getWorkHistoryTimestampMs(item: WorkHistoryItem): number {
  const msFromNumber = Number.isFinite(item.createdAtMs) ? Number(item.createdAtMs) : NaN
  const msFromString = item.createdAt ? Date.parse(item.createdAt) : NaN

  if (Number.isFinite(msFromNumber)) return msFromNumber
  if (Number.isFinite(msFromString)) return msFromString
  return Date.now()
}

function formatWorkHistoryTimestamp(item: WorkHistoryItem): string {
  const resolvedMs = getWorkHistoryTimestampMs(item)

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

function formatWorkHistoryJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

function getPromptPackageFromMetadata(metadata: Record<string, unknown>): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object') return null

  const raw = metadata.promptPackage
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const promptPackage = raw as Record<string, unknown>
  return Object.keys(promptPackage).length > 0 ? promptPackage : null
}

function getSeoPackageFromMetadata(metadata: Record<string, unknown>): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object') return null

  const raw = metadata.seoPackage
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const seoPackage = raw as Record<string, unknown>
  return Object.keys(seoPackage).length > 0 ? seoPackage : null
}

function getVoiceoverPackageFromMetadata(metadata: Record<string, unknown>): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object') return null

  const raw = metadata.voiceoverPackage
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const voiceoverPackage = raw as Record<string, unknown>
  return Object.keys(voiceoverPackage).length > 0 ? voiceoverPackage : null
}

function buildPromptResultFromHistoryItem(
  item: WorkHistoryItem,
  resolvedType: ResolvedContentType,
  duration: number,
  aspectRatio: '9:16' | '16:9',
): GenerateResult {
  const metadata = toHistoryRecord(item.metadata) || {}
  const promptPackage = getPromptPackageFromMetadata(metadata)
  const promptRecord = toHistoryRecord(promptPackage) || {}

  const rawKeyframes = Array.isArray(promptRecord.keyframes) ? promptRecord.keyframes : []
  const rawScenes = Array.isArray(promptRecord.scenes) ? promptRecord.scenes : []
  const generatedLocations = toHistoryStringList(metadata.generatedLocations, 12)

  const fallbackDurationInfo = DURATIONS.find((entry) => entry.value === duration) || DURATIONS[1]
  const keyframeCount = Math.max(
    2,
    toHistoryInteger(metadata.keyframeCount, 0) || rawKeyframes.length || fallbackDurationInfo.keyframes,
  )
  const sceneCount = Math.max(
    1,
    toHistoryInteger(metadata.sceneCount, 0) || rawScenes.length || fallbackDurationInfo.scenes,
  )

  const normalizedKeyframeCount = Math.max(keyframeCount, sceneCount + 1)
  const normalizedSceneCount = Math.max(sceneCount, normalizedKeyframeCount - 1)

  const masterDNA = toHistoryString(promptRecord.masterDNA, buildCharacterDNA(item.notes || '', resolvedType))

  const fallbackLocation = (index: number) => {
    if (generatedLocations.length > 0) {
      return generatedLocations[index % generatedLocations.length]
    }
    return 'Mirror fitcheck corner, Hoan Kiem, Hanoi, Vietnam'
  }

  const keyframes: KeyframePrompt[] = Array.from({ length: normalizedKeyframeCount }, (_, index) => {
    const raw = toHistoryRecord(rawKeyframes[index]) || {}

    const subject = toHistoryString(
      raw.subject,
      `Create image ${aspectRatio} no split-screen. Faithful character face and body outfit likeness image reference.`,
    )
    const action = toHistoryString(raw.action, `Fashion showcase movement beat ${index + 1}`)
    const location = toHistoryString(raw.location, fallbackLocation(index))
    const camera = toHistoryString(raw.camera, 'AI-selected framing and lens optimized for TikTok fashion storytelling')
    const lighting = toHistoryString(raw.lighting, 'Soft cinematic lighting prioritizing product readability')
    const style = toHistoryString(raw.style, 'TikTok fashion editorial aesthetic with social-native realism')
    const timestamp = toHistoryString(raw.timestamp, `${Math.round((index * duration) / Math.max(normalizedKeyframeCount - 1, 1))}s`)
    const fullPrompt = toHistoryString(
      raw.fullPrompt,
      `SUBJECT: ${subject}
ACTION: ${action}
LOCATION: ${location}
CAMERA: ${camera}
LIGHTING: ${lighting}
STYLE: ${style}
ASPECT RATIO: ${aspectRatio}`,
    )

    return {
      index,
      timestamp,
      subject,
      action,
      location,
      camera,
      lighting,
      style,
      fullPrompt,
    }
  })

  const scenes: ScenePrompt[] = Array.from({ length: normalizedSceneCount }, (_, index) => {
    const raw = toHistoryRecord(rawScenes[index]) || {}
    const startSec = Math.round((index * duration) / normalizedSceneCount)
    const endSec = Math.round(((index + 1) * duration) / normalizedSceneCount)
    const startPose = toHistoryString(raw.startPose, keyframes[index]?.action || '')
    const endPose = toHistoryString(raw.endPose, keyframes[index + 1]?.action || '')
      const startLocation = keyframes[index]?.location || 'Mirror fitcheck corner, Hoan Kiem, Hanoi, Vietnam'
      const endLocation = keyframes[index + 1]?.location || startLocation
      const derivedLocationFlow = normalizeLocationKey(startLocation) === normalizeLocationKey(endLocation)
        ? `Hold location: ${startLocation}`
        : `${startLocation} -> ${endLocation}`
      const locationFlow = toHistoryString(raw.locationFlow, derivedLocationFlow)
    const narrative = toHistoryString(
      raw.narrative,
      `Retention beat ${index + 1}: smooth transition from keyframe ${index + 1} to keyframe ${index + 2}.`,
    )
    const cameraMovement = toHistoryString(raw.cameraMovement, 'Stable cinematic move with clean social-native pacing')
    const lighting = toHistoryString(raw.lighting, keyframes[index]?.lighting || '')
    const composition = toHistoryString(raw.composition, keyframes[index]?.camera || '')
    const subject = toHistoryString(raw.subject, masterDNA)
    const timeRange = toHistoryString(raw.timeRange, `${startSec}s-${endSec}s`)
    const builtFullPrompt = [
      subject ? `SUBJECT: ${subject}` : '',
      `ACTION: ${narrative}`,
      composition ? `COMPOSITION: ${composition}` : '',
      `CAMERA: ${cameraMovement}`,
      lighting ? `LIGHTING: ${lighting}` : '',
    ].filter(Boolean).join('\n')
    const fullPrompt = toHistoryString(raw.fullPrompt, builtFullPrompt)

    return {
      index,
      timeRange,
      subject,
      narrative,
      startPose,
      endPose,
      composition,
      cameraMovement,
      lighting,
      locationFlow,
      fullPrompt,
    }
  })

  const createImagePrompt = toHistoryString(
    promptRecord.createImagePrompt,
    buildCreateImagePrompt(resolvedType, item.notes || ''),
  )

  return {
    masterDNA,
    keyframes,
    scenes,
    createImagePrompt,
    resolvedContentType: resolvedType,
    affiliateModeUsed: FIXED_AFFILIATE_MODE,
    salesTemplateUsed: FIXED_SALES_TEMPLATE,
  }
}

function buildSeoResultFromHistoryItem(item: WorkHistoryItem): SeoTaskResult {
  const metadata = toHistoryRecord(item.metadata) || {}
  const seoPackage = getSeoPackageFromMetadata(metadata)
  const seoRecord = toHistoryRecord(seoPackage) || {}

  const productName = toHistoryString(
    seoRecord.productName,
    toHistoryString(metadata.productName, 'San pham TikTok Shop'),
  )

  const rawVariants = Array.isArray(seoRecord.seoVariants) ? seoRecord.seoVariants : []
  const variantCount = Math.max(1, Math.min(6, toHistoryInteger(metadata.variantCount, rawVariants.length || 3)))

  const normalizeTags = (value: unknown): string[] => {
    const base = toHistoryStringList(value, 10)
      .map((tag) => tag.replace(/\s+/g, ''))
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/^#+/, '')}`))
      .filter((tag) => tag.length > 1)

    const unique = Array.from(new Set(base))
    const fallbackTags = ['#tiktokshop', '#reviewsanpham', '#xuhuong', '#dealhot', '#muangay']

    for (const fallbackTag of fallbackTags) {
      if (unique.length >= 5) break
      if (!unique.includes(fallbackTag)) unique.push(fallbackTag)
    }

    return unique.slice(0, 5)
  }

  const variants: SeoVariant[] = Array.from({ length: Math.max(variantCount, rawVariants.length || 0) }, (_, index) => {
    const raw = toHistoryRecord(rawVariants[index]) || {}
    const fallbackTitle = `${productName} dang duoc quan tam tren TikTok Shop, de phoi va de mua`
    const fallbackHook = `${productName} co gi ma duoc nhieu ban luu video?`
    const fallbackCta = 'Bam gio hang de xem gia va chon phien ban phu hop voi ban.'

    return {
      index: index + 1,
      title: toHistoryString(raw.title, fallbackTitle),
      tags: normalizeTags(raw.tags),
      hook: toHistoryString(raw.hook, fallbackHook),
      cta: toHistoryString(raw.cta, fallbackCta),
    }
  })

  return {
    productName,
    seoVariants: variants.length > 0 ? variants : [
      {
        index: 1,
        title: `${productName} dang duoc quan tam tren TikTok Shop, de phoi va de mua`,
        tags: ['#tiktokshop', '#reviewsanpham', '#xuhuong', '#dealhot', '#muangay'],
        hook: `${productName} co gi ma duoc nhieu ban luu video?`,
        cta: 'Bam gio hang de xem gia va chon phien ban phu hop voi ban.',
      },
    ],
    generatedAt: toHistoryInteger(seoRecord.generatedAt, getWorkHistoryTimestampMs(item)),
  }
}

function buildVoiceoverResultFromHistoryItem(item: WorkHistoryItem): VoiceoverTaskResult {
  const metadata = toHistoryRecord(item.metadata) || {}
  const voiceoverPackage = getVoiceoverPackageFromMetadata(metadata)
  const voiceoverRecord = toHistoryRecord(voiceoverPackage) || {}
  const voiceoverPayload = toHistoryRecord(voiceoverRecord.voiceover) || {}

  const productName = toHistoryString(
    voiceoverRecord.productName,
    toHistoryString(metadata.productName, 'San pham TikTok Shop'),
  )

  const fallbackLines: VoiceoverLine[] = [
    { timeRange: '0-3s', line: `${productName} dang duoc nhieu ban tim mua vi de mac va de phoi.` },
    { timeRange: '3-15s', line: 'Chat lieu mem, len form gon va ton dang, mac thoai mai suot ngay ma van dep.' },
    { timeRange: '15-24s', line: 'Minh da thu trong nhieu boi canh di lam, di choi, di cafe va deu de dung.' },
    { timeRange: '24-30s', line: 'Neu ban dang can mot mon mac nhieu dip, bam link de xem gia va dat ngay.' },
  ]

  const rawLines = Array.isArray(voiceoverPayload.lines) ? voiceoverPayload.lines : []
  const normalizedLines = rawLines
    .map((entry, index): VoiceoverLine | null => {
      const raw = toHistoryRecord(entry)
      if (!raw) return null

      const line = toHistoryString(raw.line, fallbackLines[index]?.line || '')
      if (!line) return null

      return {
        timeRange: toHistoryString(raw.timeRange, fallbackLines[index]?.timeRange || `${index * 7}-${index * 7 + 7}s`),
        line,
      }
    })
    .filter((entry): entry is VoiceoverLine => entry !== null)

  const lines = normalizedLines.length > 0 ? normalizedLines : fallbackLines
  const computedScript = lines.map((line) => `${line.timeRange}: ${line.line}`).join('\n')
  const durationSec = Math.max(20, Math.min(60, toHistoryInteger(voiceoverPayload.durationSec, toHistoryInteger(metadata.durationSec, 30))))

  return {
    productName,
    voiceover: {
      style: toHistoryString(voiceoverPayload.style, 'Than thien, thuyet phuc, sat voi ngu canh TikTok ban hang'),
      durationSec,
      script: toHistoryString(voiceoverPayload.script, computedScript),
      lines,
    },
    generatedAt: toHistoryInteger(voiceoverRecord.generatedAt, getWorkHistoryTimestampMs(item)),
  }
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
- Do not reference, imitate, or imply endorsement from any real celebrity/public figure/identifiable person.
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
- Do not include or imply any real celebrity/public figure/identifiable person, fake endorsement, or impersonation cues.
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

async function analyzeTikTokWithGemini(
  apiKey: string,
  model: string,
  videoBase64: string,
  videoMimeType: string,
  extraNotes: string,
): Promise<TikTokAnalysisResult> {
  const trimmedNotes = extraNotes.trim()

  const analyzePrompt = `You are a senior TikTok content strategist and video director.

Analyze the provided TikTok video carefully and return STRICT JSON only.

${trimmedNotes ? `Additional context from user: ${trimmedNotes}` : ''}

ANALYSIS TASKS:
1. Identify the content type (ootd, grwm, review, haul, tiktokshop, fyp, styling, athleisure, outfitideas, luxury, or describe a custom type).
2. Estimate the total video duration in seconds.
3. Describe the hook style (how the video grabs attention in the first 2 seconds).
4. Describe the narrative structure (how the video flows from hook to close).
5. Describe the CTA style (how the video ends or drives action).
6. Describe the visual/color grade (bright, warm, moody, etc.).
7. Describe the overall pacing (fast-cut, slow cinematic, mid-pace, etc.).
8. Break down the video into 3-6 scene beats. For each beat provide:
   - timestamp (e.g. "0s-4s")
   - beatName (short descriptive label)
   - description (what is happening visually)
   - cameraHint (camera movement / framing observed)
   - narrationHint (what would be said or implied in narration)
9. Based on the analysis, generate a ready-to-use Vietnamese kịch bản (script) for creating a SIMILAR video for a new fashion/affiliate product. The script must:
   - Follow the same structural pattern and pacing as the analyzed video
   - Be written in natural Vietnamese
   - Include stage directions in brackets e.g. [Camera: full-body reveal]
   - Cover hook → showcase → close structure
   - Be 150-250 words total

Return this exact JSON schema (no extra keys, no markdown wrapping):
{
  "detectedContentType": "...",
  "detectedDurationSec": 30,
  "hookStyle": "...",
  "narrativeStructure": "...",
  "ctaStyle": "...",
  "colorGrade": "...",
  "pacing": "...",
  "sceneBeats": [
    {
      "index": 0,
      "timestamp": "0s-4s",
      "beatName": "...",
      "description": "...",
      "cameraHint": "...",
      "narrationHint": "..."
    }
  ],
  "generatedScript": "..."
}`

  try {
    const parts: GeminiContentPart[] = [
      {
        inlineData: {
          mimeType: videoMimeType,
          data: videoBase64,
        },
      },
      { text: analyzePrompt },
    ]

    const parsed = await requestGeminiJsonWithParts(apiKey, model, parts, 0.7, 4096)

    const toStr = (v: unknown, fallback: string) => {
      if (typeof v !== 'string') return fallback
      const t = v.trim()
      return t.length > 0 ? t : fallback
    }

    const toNum = (v: unknown, fallback: number) => {
      const n = Number(v)
      return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback
    }

    const rawBeats = Array.isArray((parsed as any).sceneBeats) ? (parsed as any).sceneBeats : []
    const sceneBeats: TikTokScriptBeat[] = rawBeats.slice(0, 8).map((beat: any, i: number) => ({
      index: i,
      timestamp: toStr(beat?.timestamp, `${i * 5}s-${(i + 1) * 5}s`),
      beatName: toStr(beat?.beatName, `Beat ${i + 1}`),
      description: toStr(beat?.description, ''),
      cameraHint: toStr(beat?.cameraHint, ''),
      narrationHint: toStr(beat?.narrationHint, ''),
    }))

    return {
      detectedContentType: toStr((parsed as any).detectedContentType, 'unknown'),
      detectedDurationSec: toNum((parsed as any).detectedDurationSec, 30),
      hookStyle: toStr((parsed as any).hookStyle, ''),
      narrativeStructure: toStr((parsed as any).narrativeStructure, ''),
      ctaStyle: toStr((parsed as any).ctaStyle, ''),
      colorGrade: toStr((parsed as any).colorGrade, ''),
      pacing: toStr((parsed as any).pacing, ''),
      sceneBeats,
      generatedScript: toStr((parsed as any).generatedScript, ''),
      generatedAt: Date.now(),
    }
  } catch (error: any) {
    throw new Error(error?.message || 'Gemini TikTok analysis failed')
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

function ErrorLogModal({ lines, onClose }: { lines: string[]; onClose: () => void }) {
  const fullText = lines.join('\n')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // silent
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--border)',
          borderRadius: 12, maxWidth: 680, width: '100%', maxHeight: '80vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} color="#f87171" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pipeline Error Log
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                color: copied ? '#4ade80' : 'var(--text-secondary)',
                fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Đã copy' : 'Copy log'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Log lines */}
        <div style={{ overflow: 'auto', padding: '14px 16px', flex: 1 }}>
          {lines.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Không có log.</p>
          ) : (
            <pre style={{
              fontSize: '0.72rem', lineHeight: 1.75, color: '#e2e8f0',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontFamily: 'monospace',
            }}>
              {lines.map((line, i) => (
                <span
                  key={i}
                  style={{
                    display: 'block',
                    color: line.startsWith('[ERROR]') || line.startsWith('✖') ? '#f87171'
                      : line.startsWith('[RETRY]') ? '#fbbf24'
                      : line.startsWith('[OK]') ? '#4ade80'
                      : line.startsWith('[WARN]') ? '#fb923c'
                      : '#cbd5e1',
                  }}
                >
                  {line}
                </span>
              ))}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

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
  const [activeTab, setActiveTab] = useState<'keyframes' | 'scenes' | 'all' | 'image' | 'seo' | 'voiceover' | 'history' | 'tiktokanalysis'>('keyframes')
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
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [historyActionFilter, setHistoryActionFilter] = useState<WorkHistoryActionFilter>('all')
  const [historySearchInput, setHistorySearchInput] = useState('')
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [productLocationHistory, setProductLocationHistory] = useState<ProductLocationHistoryMap>(() => loadProductLocationHistory())
  const [outfitTypeLocationHistory, setOutfitTypeLocationHistory] = useState<OutfitTypeLocationHistoryMap>(() => loadOutfitTypeLocationHistory())

  // TikTok Video Analysis
  const [tiktokVideoFile, setTiktokVideoFile] = useState<File | null>(null)
  const [tiktokVideoBase64, setTiktokVideoBase64] = useState<string | null>(null)
  const [tiktokVideoMimeType, setTiktokVideoMimeType] = useState<string>('video/mp4')
  const [tiktokAnalysisNotes, setTiktokAnalysisNotes] = useState('')
  const [tiktokAnalysisLoading, setTiktokAnalysisLoading] = useState(false)
  const [tiktokAnalysisError, setTiktokAnalysisError] = useState('')
  const [tiktokAnalysisResult, setTiktokAnalysisResult] = useState<TikTokAnalysisResult | null>(null)

  // Error log modal
  const [errorLogLines, setErrorLogLines] = useState<string[]>([])
  const [showErrorLogModal, setShowErrorLogModal] = useState(false)

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

  const handleOpenHistoryItem = (item: WorkHistoryItem) => {
    const metadata = toHistoryRecord(item.metadata) || {}
    const contentTypeFromItem = normalizeHistoryContentType(item.contentType, 'ootd')
    const resolvedFromItem = normalizeHistoryResolvedContentType(item.contentType, 'outfitideas')
    const restoredInputType = normalizeHistoryContentType(metadata.inputContentType, contentTypeFromItem)
    const restoredResolvedType = normalizeHistoryResolvedContentType(metadata.resolvedContentType, resolvedFromItem)
    const keyframeCount = toHistoryInteger(metadata.keyframeCount, 0)
    const sceneCount = toHistoryInteger(metadata.sceneCount, 0)
    const inferredDuration = inferDurationFromPromptCounts(keyframeCount, sceneCount)
    const restoredDuration = normalizeHistoryDuration(metadata.duration, inferredDuration)
    const restoredAspectRatio = normalizeHistoryAspectRatio(metadata.aspectRatio, '9:16')

    if (item.model.trim().length > 0) {
      setModel(item.model.trim())
    }

    setSelectedHistoryId(item._id)
    setLoading(false)
    setSeoLoading(false)
    setVoiceoverLoading(false)
    setWorkHistoryError('')
    setError('')
    setSeoError('')
    setVoiceoverError('')
    setPromptToast(null)

    if (item.action === 'prompt') {
      const restoredPrompt = buildPromptResultFromHistoryItem(
        item,
        restoredResolvedType,
        restoredDuration,
        restoredAspectRatio,
      )

      setDuration(restoredDuration)
      setAspectRatio(restoredAspectRatio)
      setNotes(item.notes || '')
      setContentType(restoredInputType)
      setSelectedContentType(restoredResolvedType)
      setResult(restoredPrompt)
      setSeoResult(null)
      setVoiceoverResult(null)
      setSelectedSeoVariantIndex(0)
      setActiveTab('keyframes')
      setPromptToast({
        kind: 'success',
        message: 'Da mo lai Prompt Package tu lich su.',
      })
      return
    }

    if (item.action === 'seo') {
      const restoredSeo = buildSeoResultFromHistoryItem(item)

      setContentType(restoredInputType)
      setSelectedContentType(restoredResolvedType)
      setSeoProductName(restoredSeo.productName)
      setSeoNotes(item.notes || '')
      setSeoResult(restoredSeo)
      setResult(null)
      setVoiceoverResult(null)
      setSelectedSeoVariantIndex(0)
      setActiveTab('seo')
      setPromptToast({
        kind: 'success',
        message: 'Da mo lai SEO package tu lich su.',
      })
      return
    }

    if (item.action === 'voiceover') {
      const restoredVoiceover = buildVoiceoverResultFromHistoryItem(item)

      setContentType(restoredInputType)
      setSelectedContentType(restoredResolvedType)
      setVoiceoverProductName(restoredVoiceover.productName)
      setVoiceoverNotes(item.notes || '')
      setVoiceoverResult(restoredVoiceover)
      setResult(null)
      setSeoResult(null)
      setSelectedSeoVariantIndex(0)
      setActiveTab('voiceover')
      setPromptToast({
        kind: 'success',
        message: 'Da mo lai Voiceover package tu lich su.',
      })
      return
    }

    setWorkHistoryError('Ban ghi lich su khong hop le de mo lai.')
  }

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
    const MAX_ATTEMPTS = 3
    setLoading(true)
    setSelectedHistoryId(null)
    setLoadingStageIndex(0)
    setPromptToast({
      kind: 'loading',
      message: 'Đang tạo Prompt Package, vui lòng chờ trong giây lát...',
    })
    setError('')
    setResult(null)
    setErrorLogLines([])

    const logLines: string[] = []
    const pushLog = (line: string) => { logLines.push(line) }

    pushLog(`[START] ${new Date().toISOString()} — model=${model} duration=${duration}s type=${contentType}`)

    try {
      if (!apiKey.trim()) {
        throw new Error('Vui long nhap Gemini API Key de AI phan tich anh va tao boi canh')
      }

      const currentProductImageId = productImage ? createProductImageId(productImage) : null
      const usedLocationsForProduct = currentProductImageId
        ? (productLocationHistory[currentProductImageId] || [])
        : []

      let lastAttemptError: Error | null = null

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (attempt > 1) {
          pushLog(`[RETRY] Attempt ${attempt}/${MAX_ATTEMPTS} — retrying after failure...`)
          setPromptToast({
            kind: 'loading',
            message: `Thử lại lần ${attempt}/${MAX_ATTEMPTS}...`,
          })
          setLoadingStageIndex(0)
        } else {
          pushLog(`[START] Attempt ${attempt}/${MAX_ATTEMPTS}`)
        }

        try {
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

          pushLog(`[OK] Attempt ${attempt} succeeded — keyframes=${res.keyframes.length} scenes=${res.scenes.length}`)
          setErrorLogLines([...logLines])

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
            message: `Đã tạo xong Prompt Package${attempt > 1 ? ` (sau ${attempt} lần thử)` : ''}. Bạn có thể copy hoặc export ngay.`,
          })

          const generatedLocations = Array.from(
            new Set(
              res.keyframes
                .map((keyframe) => keyframe.location.trim())
                .filter((location) => location.length > 0)
            )
          )

          const promptPackageForHistory = {
            masterDNA: res.masterDNA,
            createImagePrompt: res.createImagePrompt || '',
            keyframes: res.keyframes.map((keyframe) => ({
              index: keyframe.index,
              timestamp: keyframe.timestamp,
              subject: keyframe.subject,
              action: keyframe.action,
              location: keyframe.location,
              camera: keyframe.camera,
              lighting: keyframe.lighting,
              style: keyframe.style,
              fullPrompt: keyframe.fullPrompt,
            })),
            scenes: res.scenes.map((scene) => ({
              index: scene.index,
              timeRange: scene.timeRange,
              narrative: scene.narrative,
              startPose: scene.startPose,
              endPose: scene.endPose,
              cameraMovement: scene.cameraMovement,
              locationFlow: scene.locationFlow || '',
              fullPrompt: scene.fullPrompt,
            })),
          }

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
              promptPackage: promptPackageForHistory,
            },
          })
            .then(() => loadWorkHistory({ silent: true }))
            .catch((saveError) => {
              console.warn(
                'Could not save prompt work history:',
                saveError instanceof Error ? saveError.message : saveError
              )
            })

          return // success — exit retry loop
        } catch (attemptErr: any) {
          const msg = attemptErr?.message || 'Unknown error'
          pushLog(`✖ [ERROR] Attempt ${attempt} failed: ${msg}`)
          lastAttemptError = attemptErr instanceof Error ? attemptErr : new Error(msg)

          const isRetryable = !msg.toLowerCase().includes('api key')
            && !msg.toLowerCase().includes('quota')
            && !msg.toLowerCase().includes('permission')
            && attempt < MAX_ATTEMPTS

          if (!isRetryable) {
            pushLog(`[WARN] Error is not retryable or max attempts reached. Stopping.`)
            break
          }
        }
      }

      // All attempts failed
      const finalMsg = lastAttemptError?.message || 'Failed to generate prompts'
      pushLog(`[ERROR] All ${MAX_ATTEMPTS} attempts failed. Last error: ${finalMsg}`)
      setErrorLogLines([...logLines])
      setError(finalMsg)
      setPromptToast({
        kind: 'error',
        message: finalMsg,
      })
    } catch (err: any) {
      const message = err?.message || 'Failed to generate prompts'
      pushLog(`[ERROR] Fatal: ${message}`)
      setErrorLogLines([...logLines])
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
    setSelectedHistoryId(null)
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
          seoPackage: {
            productName: generated.productName,
            seoVariants: generated.seoVariants,
            generatedAt: generated.generatedAt || Date.now(),
          },
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
    setSelectedHistoryId(null)
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
          voiceoverPackage: {
            productName: generated.productName,
            voiceover: generated.voiceover,
            generatedAt: generated.generatedAt || Date.now(),
          },
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

  const handleTiktokVideoFileChange = async (file: File | null) => {
    setTiktokVideoFile(file)
    setTiktokVideoBase64(null)
    setTiktokAnalysisError('')
    setTiktokAnalysisResult(null)

    if (!file) return

    const MAX_VIDEO_MB = 18
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setTiktokAnalysisError(`Video quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Vui lòng chọn video dưới ${MAX_VIDEO_MB} MB.`)
      setTiktokVideoFile(null)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        const base64 = result.split(',')[1] || result
        setTiktokVideoBase64(base64)
        setTiktokVideoMimeType(file.type || 'video/mp4')
      }
    }
    reader.onerror = () => {
      setTiktokAnalysisError('Không thể đọc file video. Vui lòng thử lại.')
      setTiktokVideoFile(null)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyzeTikTok = async () => {
    if (!tiktokVideoBase64) {
      setTiktokAnalysisError('Vui lòng chọn file video TikTok trước khi phân tích.')
      return
    }

    setTiktokAnalysisLoading(true)
    setTiktokAnalysisError('')
    setTiktokAnalysisResult(null)

    try {
      if (!apiKey.trim()) {
        throw new Error('Vui lòng nhập Gemini API Key để phân tích video.')
      }

      const result = await analyzeTikTokWithGemini(
        apiKey,
        model,
        tiktokVideoBase64,
        tiktokVideoMimeType,
        tiktokAnalysisNotes,
      )

      setTiktokAnalysisResult(result)
      setActiveTab('tiktokanalysis')
    } catch (err: any) {
      setTiktokAnalysisError(err?.message || 'Phân tích video thất bại. Vui lòng thử lại.')
    } finally {
      setTiktokAnalysisLoading(false)
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
      {showErrorLogModal && (
        <ErrorLogModal lines={errorLogLines} onClose={() => setShowErrorLogModal(false)} />
      )}
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
                Mục tiêu: ưu tiên chuyển đổi bền vững, giữ sản phẩm rõ ràng, tăng niềm tin để thúc đẩy ý định mua tự nhiên.
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

            {/* Task 3: TikTok Video Analysis */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <Film /> Phân tích Video TikTok → Kịch bản
              </div>
              <p className="ai-task-hint">
                Upload video TikTok (MP4/MOV, tối đa 18 MB). AI sẽ phân tích cấu trúc, scene beats, hook, CTA rồi tạo kịch bản mẫu để quay lại video tương tự.
              </p>

              <div className="input-group">
                <label className="input-label" htmlFor="tiktok-video-input">File video TikTok</label>
                <div
                  style={{
                    border: '1.5px dashed var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                  onClick={() => document.getElementById('tiktok-video-input')?.click()}
                >
                  <Film size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {tiktokVideoFile ? (
                      <>
                        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tiktokVideoFile.name}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {(tiktokVideoFile.size / 1024 / 1024).toFixed(1)} MB — {tiktokVideoFile.type || 'video'}
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Chọn file video TikTok (.mp4, .mov, .webm)
                      </p>
                    )}
                  </div>
                  {tiktokVideoFile && (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, flexShrink: 0 }}
                      onClick={(e) => { e.stopPropagation(); void handleTiktokVideoFileChange(null) }}
                      title="Xóa video"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <input
                  id="tiktok-video-input"
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/avi,.mp4,.mov,.webm,.avi"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    void handleTiktokVideoFileChange(file)
                    e.target.value = ''
                  }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 12 }}>
                <label className="input-label" htmlFor="tiktok-analysis-notes">Ghi chú thêm (tuỳ chọn)</label>
                <textarea
                  id="tiktok-analysis-notes"
                  className="input-field"
                  value={tiktokAnalysisNotes}
                  onChange={(e) => setTiktokAnalysisNotes(e.target.value)}
                  placeholder="Ví dụ: video bán áo sơ mi, phong cách OOTD, muốn kịch bản theo tone tự nhiên..."
                  rows={2}
                />
              </div>

              <button
                id="analyze-tiktok-btn"
                className={`btn-generate btn-generate-secondary ${tiktokAnalysisLoading ? 'loading' : ''}`}
                onClick={handleAnalyzeTikTok}
                disabled={tiktokAnalysisLoading || !tiktokVideoBase64 || !apiKey.trim()}
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}
              >
                {tiktokAnalysisLoading ? (
                  <>
                    <div className="spinner" />
                    Đang phân tích video...
                  </>
                ) : (
                  <>
                    <Film size={18} />
                    Phân tích & Tạo kịch bản
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {tiktokAnalysisLoading && (
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: '55%', background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)' }} />
                </div>
              )}

              {tiktokAnalysisError && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {tiktokAnalysisError}
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
              <div className="error-message" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ flex: 1 }}>{error}</span>
                </div>
                {errorLogLines.length > 0 && (
                  <button
                    onClick={() => setShowErrorLogModal(true)}
                    style={{
                      marginLeft: 24, background: 'rgba(248,113,113,0.12)',
                      border: '1px solid rgba(248,113,113,0.35)',
                      borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
                      color: '#f87171', fontSize: '0.72rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <AlertCircle size={12} />
                    Xem log lỗi ({errorLogLines.length} dòng)
                  </button>
                )}
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
                    {tiktokAnalysisResult && (
                      <button
                        className={`tab ${activeTab === 'tiktokanalysis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tiktokanalysis')}
                        style={activeTab === 'tiktokanalysis' ? { borderColor: '#0ea5e9', color: '#0ea5e9' } : {}}
                      >
                        <Film /> TikTok Phân tích
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
                              {sc.subject ? <><strong>SUBJECT:</strong> {sc.subject}{'\n'}</> : null}
                              <strong>ACTION:</strong> {sc.narrative}
                              {sc.composition ? <>{'\n'}<strong>COMPOSITION:</strong> {sc.composition}</> : null}
                              {'\n'}<strong>CAMERA:</strong> {sc.cameraMovement}
                              {sc.lighting ? <>{'\n'}<strong>LIGHTING:</strong> {sc.lighting}</> : null}
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
                            const itemMetadata = toHistoryRecord(item.metadata) || {}
                            const packagePayload = item.action === 'prompt'
                              ? getPromptPackageFromMetadata(itemMetadata)
                              : item.action === 'seo'
                                ? getSeoPackageFromMetadata(itemMetadata)
                                : item.action === 'voiceover'
                                  ? getVoiceoverPackageFromMetadata(itemMetadata)
                                  : null
                            const packageJson = packagePayload
                              ? formatWorkHistoryJson(packagePayload)
                              : ''
                            const packageCopyLabel = item.action === 'prompt'
                              ? 'PROMPT_PACKAGE_JSON'
                              : item.action === 'seo'
                                ? 'SEO_PACKAGE_JSON'
                                : 'VOICEOVER_PACKAGE_JSON'
                            const packageDisplayLabel = item.action === 'prompt'
                              ? 'PROMPT PACKAGE JSON'
                              : item.action === 'seo'
                                ? 'SEO PACKAGE JSON'
                                : 'VOICEOVER PACKAGE JSON'
                            const isSelectedHistoryItem = selectedHistoryId === item._id

                            const metadataEntries = Object.entries(itemMetadata)
                              .filter(([key, value]) => {
                                if (key === 'promptPackage' || key === 'seoPackage' || key === 'voiceoverPackage') return false
                                return value !== null && value !== undefined && `${value}`.trim().length > 0
                              })
                              .slice(0, 8)

                            return (
                              <div
                                key={item._id}
                                className={`prompt-card history-item-card ${isSelectedHistoryItem ? 'selected' : ''}`}
                              >
                                <div className="prompt-card-header">
                                  <div className="prompt-card-badge" style={{ color: getWorkHistoryActionColor(item.action) }}>
                                    <History size={14} />
                                    {getWorkHistoryActionLabel(item.action)}
                                  </div>
                                  <div className="history-card-actions">
                                    <span className="prompt-card-time">{formatWorkHistoryTimestamp(item)}</span>
                                    <button
                                      type="button"
                                      className={`history-open-btn ${isSelectedHistoryItem ? 'active' : ''}`}
                                      onClick={() => handleOpenHistoryItem(item)}
                                    >
                                      {isSelectedHistoryItem ? 'Dang mo' : 'Mo lai'}
                                    </button>
                                  </div>
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
                                      packageJson ? `${packageCopyLabel}:\n${packageJson}` : '',
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
                                    {packageJson && (
                                      <>
                                        {'\n\n'}<strong>{packageDisplayLabel}:</strong>
                                        {'\n'}{packageJson}
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

                  {/* TikTok Analysis Tab */}
                  {tiktokAnalysisResult && activeTab === 'tiktokanalysis' && (
                    <>
                      {/* Overview */}
                      <div className="dna-section" style={{ marginBottom: 16 }}>
                        <div className="dna-title" style={{ color: '#0ea5e9' }}>
                          <Film size={13} /> Phân tích Video TikTok
                          <CopyButton text={[
                            `CONTENT TYPE: ${tiktokAnalysisResult.detectedContentType}`,
                            `DURATION: ~${tiktokAnalysisResult.detectedDurationSec}s`,
                            `HOOK: ${tiktokAnalysisResult.hookStyle}`,
                            `NARRATIVE: ${tiktokAnalysisResult.narrativeStructure}`,
                            `CTA: ${tiktokAnalysisResult.ctaStyle}`,
                            `COLOR GRADE: ${tiktokAnalysisResult.colorGrade}`,
                            `PACING: ${tiktokAnalysisResult.pacing}`,
                          ].join('\n')} />
                        </div>
                        <div className="prompt-text" style={{ lineHeight: 1.85 }}>
                          <strong>Loại nội dung:</strong> {tiktokAnalysisResult.detectedContentType}
                          {'\n'}<strong>Thời lượng:</strong> ~{tiktokAnalysisResult.detectedDurationSec}s
                          {'\n'}<strong>Hook:</strong> {tiktokAnalysisResult.hookStyle}
                          {'\n'}<strong>Cấu trúc:</strong> {tiktokAnalysisResult.narrativeStructure}
                          {'\n'}<strong>CTA:</strong> {tiktokAnalysisResult.ctaStyle}
                          {'\n'}<strong>Màu sắc/Grade:</strong> {tiktokAnalysisResult.colorGrade}
                          {'\n'}<strong>Nhịp độ:</strong> {tiktokAnalysisResult.pacing}
                        </div>
                      </div>

                      {/* Scene Beats */}
                      <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0ea5e9', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        🎬 Scene Beats ({tiktokAnalysisResult.sceneBeats.length})
                      </h3>
                      {tiktokAnalysisResult.sceneBeats.map((beat) => (
                        <div key={beat.index} className="prompt-card" style={{ animationDelay: `${beat.index * 60}ms`, borderColor: 'rgba(14,165,233,0.25)' }}>
                          <div className="prompt-card-header">
                            <div className="prompt-card-badge" style={{ color: '#0ea5e9', borderColor: 'rgba(14,165,233,0.3)' }}>
                              <Film size={14} />
                              {beat.beatName}
                            </div>
                            <span className="prompt-card-time">{beat.timestamp}</span>
                          </div>
                          <div className="prompt-card-body">
                            <CopyButton text={[
                              `[${beat.beatName}] ${beat.timestamp}`,
                              `Mô tả: ${beat.description}`,
                              `Camera: ${beat.cameraHint}`,
                              `Narration: ${beat.narrationHint}`,
                            ].join('\n')} />
                            <div className="prompt-text">
                              {beat.description}
                              {beat.cameraHint ? <>{'\n'}<strong>Camera:</strong> {beat.cameraHint}</> : null}
                              {beat.narrationHint ? <>{'\n'}<strong>Narration:</strong> {beat.narrationHint}</> : null}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Generated Script */}
                      {tiktokAnalysisResult.generatedScript && (
                        <>
                          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0ea5e9', marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            📝 Kịch bản đề xuất
                          </h3>
                          <div className="prompt-card" style={{ borderColor: 'rgba(14,165,233,0.35)' }}>
                            <div className="prompt-card-body">
                              <CopyButton text={tiktokAnalysisResult.generatedScript} />
                              <div className="prompt-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85 }}>
                                {tiktokAnalysisResult.generatedScript}
                              </div>
                            </div>
                          </div>
                        </>
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
