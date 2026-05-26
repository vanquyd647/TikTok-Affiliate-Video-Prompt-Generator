import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, Image as ImageIcon, Sparkles, Film, Camera, Clock,
  Copy, Check, Download, X, Eye, EyeOff, Clapperboard,
  Layers, ArrowRight, Wand2, FileText, AlertCircle, Ratio,
  Shirt, Star, TrendingUp, MessageSquare, Palette, History, RefreshCw, Music
} from 'lucide-react'
import { buildGeminiAgentSkillBlock } from './agentSkills'
import './index.css'

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════
type PromptFacingDirection = 'front' | 'back' | 'left' | 'right' | 'three-quarter-left' | 'three-quarter-right'

interface KeyframePrompt {
  index: number
  timestamp: string
  subject: string
  action: string
  facingDirection?: PromptFacingDirection
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
  musicVideoPromptMarkdown?: string
  lookbookImagePrompts?: LookbookImagePrompt[]
  resolvedContentType?: ResolvedContentType
  affiliateModeUsed?: AffiliateMode
  salesTemplateUsed?: SalesTemplate
  storyboardEngineUsed?: StoryboardVideoEngine
  storyboardTemplateUsed?: StoryboardTemplate
}

interface LookbookImagePrompt {
  index: number
  title: string
  purpose: string
  subject?: string
  action?: string
  facingDirection?: PromptFacingDirection
  location?: string
  camera?: string
  lighting?: string
  style?: string
  prompt: string
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
  contextHint: string
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

interface MusicAudioReference {
  name: string
  dataUrl: string
  mimeType: string
  size: number
  durationSec?: number
}

interface MusicImageReference {
  id: string
  name: string
  dataUrl: string
}

interface MusicScriptReference {
  name: string
  text: string
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
  { value: 'gemini-3.1-flash-lite-preview', label: '3.1 Flash Lite Preview', tag: 'Preview' },
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
  {
    value: 'boutiquefeed',
    label: 'Boutique Feed',
    icon: MessageSquare,
    desc: 'Real Experience Boutique',
    color: '#14b8a6',
    locationStyleKeywords: [
      'boutique',
      'fashion boutique',
      'showroom',
      'fashion showroom',
      'fitting room',
      'wardrobe mirror',
      'mirror fitcheck',
      'storefront',
      'clothing rack',
      'rack',
      'shop corner',
      'goc shop',
      'cua hang thoi trang',
      'guong thu do',
      'phong thu do',
    ],
  },
  { value: 'athleisure', label: 'Athleisure', icon: TrendingUp, desc: 'Gym-to-Café Styling', color: '#10b981' },
  { value: 'haul', label: 'Haul', icon: Layers, desc: 'Try-On / Collection Showcase', color: '#f59e0b' },
  { value: 'styling', label: 'Styling', icon: Wand2, desc: 'Fashion Styling Tips', color: '#ec4899' },
  { value: 'luxury', label: 'Luxury', icon: Star, desc: 'Old Money / Sophisticated', color: '#8b5cf6' },
  { value: 'streetstyle', label: 'Street Style', icon: TrendingUp, desc: 'Outdoor Urban Candid Walk', color: '#06b6d4' },
  {
    value: 'sunnyaura',
    label: 'Sunny Aura',
    icon: Sparkles,
    desc: 'Natural Sunlight Glow',
    color: '#fbbf24',
    locationStyleKeywords: [
      'sunlight',
      'sunny',
      'golden hour',
      'window light',
      'outdoor',
      'street',
      'cafe frontage',
      'plaza',
      'nang',
      'anh nang',
      'ngoai troi',
      'gio vang',
    ],
  },
  { value: 'partyoutfit', label: 'Party Outfit', icon: Sparkles, desc: 'Đầm Tiệc / Occasion Dress', color: '#e879f9' },
] as const

type ContentType = typeof CONTENT_TYPES[number]['value']
type ResolvedContentType = Exclude<ContentType, 'auto'>
type AffiliateMode = 'balanced' | 'strict'
type SalesTemplate = 'hard' | 'soft'
type GenerationMode = 'video_prompt' | 'lookbook_image' | 'storyboard_video' | 'music_video'
type AppPageMode = 'core' | 'ootd_template' | 'storyboard_template' | 'music_video_template' | 'prompt_library'
type OotdTemplateScenarioId = 'classic_mirror_phone' | 'cozy_home_background' | 'night_city_glam' | 'relaxed_boutique_camera' | 'free_style_product_review'
type LookbookImageCount = 5 | 10 | 20
type LookbookStyleTone = 'standard' | 'sexy'
type LookbookTheme = 'auto' | 'minimal_studio' | 'street_casual' | 'office_chic' | 'party_night' | 'vacation_resort'
type LookbookPoseDirectionLock = 'auto' | PromptFacingDirection
type StoryboardVideoEngine = 'veo_3_1' | 'omni_flash'
type StoryboardTemplate = 'product_launch' | 'ugc_review' | 'cinematic_story'
type ProductCategoryGroup =
  | 'all'
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'skirts'
  | 'outerwear'
  | 'loungewear_sleepwear'
  | 'lingerie_swimwear'
  | 'activewear'
  | 'traditional_festive'
  | 'accessories_footwear'
type ProductCategory = string
type ProductLocationHistoryMap = Record<string, string[]>
type OutfitTypeLocationHistoryMap = Partial<Record<ResolvedContentType, string[]>>

const GENERATION_MODES: Array<{
  value: GenerationMode
  label: string
  desc: string
  icon: typeof Film
  color: string
}> = [
  {
    value: 'video_prompt',
    label: 'Video Prompt',
    desc: 'Tao keyframe + scene prompt cho Veo',
    icon: Film,
    color: 'var(--accent-cyan)',
  },
  {
    value: 'lookbook_image',
    label: 'Lookbook Image',
    desc: 'Tao prompt anh lookbook, khong can video',
    icon: ImageIcon,
    color: '#22c55e',
  },
  {
    value: 'storyboard_video',
    label: 'Storyboard Video',
    desc: 'Template storyboard cho Veo/Omni Flash',
    icon: Clapperboard,
    color: 'var(--accent-amber)',
  },
  {
    value: 'music_video',
    label: 'Music Video',
    desc: 'MV ca nhac: image + scene + audio mood',
    icon: Music,
    color: '#ec4899',
  },
]

const STORYBOARD_VIDEO_ENGINE_OPTIONS: Array<{
  value: StoryboardVideoEngine
  label: string
  desc: string
  color: string
}> = [
  {
    value: 'veo_3_1',
    label: 'Veo 3.1',
    desc: 'Keyframe first-frame -> last-frame, scene 8s',
    color: 'var(--accent-pink)',
  },
  {
    value: 'omni_flash',
    label: 'Omni Flash',
    desc: 'Natural-language video edit, multi-input + audio intent',
    color: 'var(--accent-emerald)',
  },
]

const STORYBOARD_TEMPLATE_OPTIONS: Array<{
  value: StoryboardTemplate
  label: string
  desc: string
}> = [
  {
    value: 'product_launch',
    label: 'Product Launch',
    desc: 'Hook, proof, detail, style payoff, CTA',
  },
  {
    value: 'ugc_review',
    label: 'UGC Review',
    desc: 'Problem, try-on, proof, reaction, recommendation',
  },
  {
    value: 'cinematic_story',
    label: 'Cinematic Story',
    desc: 'Mood, character, location, motion, editorial closer',
  },
]

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

const LOOKBOOK_LOADING_STAGES = [
  'AI dang phan tich anh khuon mat...',
  'AI dang phan tich anh san pham...',
  'AI dang viet prompt anh lookbook...',
] as const

const LOOKBOOK_IMAGE_COUNT_OPTIONS: LookbookImageCount[] = [5, 10, 20]
const DEFAULT_LOOKBOOK_IMAGE_COUNT: LookbookImageCount = 5
const LOOKBOOK_STYLE_TONE_OPTIONS: Array<{
  value: LookbookStyleTone
  label: string
  desc: string
  color: string
}> = [
  {
    value: 'standard',
    label: 'Classic',
    desc: 'Lookbook clean va de ung dung',
    color: 'var(--accent-cyan)',
  },
  {
    value: 'sexy',
    label: 'Goi cam Sexy',
    desc: 'Goi cam tinh te, khong phan cam',
    color: '#fb7185',
  },
]

const LOOKBOOK_THEME_OPTIONS: Array<{
  value: LookbookTheme
  label: string
  desc: string
  promptHint: string
  styleHint: string
  color: string
}> = [
  {
    value: 'auto',
    label: 'Auto Theme',
    desc: 'AI tu can bang boi canh lookbook',
    promptHint: 'Use the most natural social-native fashion context for each shot while keeping outfit readability first.',
    styleHint: 'Balanced social-native fashion editorial with adaptable mood.',
    color: 'var(--text-secondary)',
  },
  {
    value: 'minimal_studio',
    label: 'Minimal Studio',
    desc: 'Studio clean co chieu sau va prop nhe',
    promptHint: 'Keep every frame in a minimal contextual studio corner with clean styling and controlled depth.',
    styleHint: 'Minimal studio fashion lookbook with neutral styling and clean lines.',
    color: '#38bdf8',
  },
  {
    value: 'street_casual',
    label: 'Street Casual',
    desc: 'Phoi canh dao pho urban tu nhien',
    promptHint: 'Keep all frames in casual urban street or cafe frontage context with candid confidence.',
    styleHint: 'Urban candid streetwear mood with practical daily styling energy.',
    color: '#22c55e',
  },
  {
    value: 'office_chic',
    label: 'Office Chic',
    desc: 'Cong so hien dai, thanh lich',
    promptHint: 'Anchor every frame to modern office and business-lobby inspired context with polished posture.',
    styleHint: 'Refined office-chic editorial tone, professional yet fashionable.',
    color: '#6366f1',
  },
  {
    value: 'party_night',
    label: 'Party Night',
    desc: 'Dem su kien, sang trong',
    promptHint: 'Keep all frames in evening event or lounge-like context with elegant nightlife atmosphere.',
    styleHint: 'Evening occasion fashion mood with glamorous but tasteful energy.',
    color: '#e879f9',
  },
  {
    value: 'vacation_resort',
    label: 'Vacation Resort',
    desc: 'Nghi duong bien/ho boi, nang sang',
    promptHint: 'Keep all frames in resort, poolside, or vacation walkway context with relaxed luxury mood.',
    styleHint: 'Resort-ready lifestyle lookbook with airy daylight atmosphere.',
    color: '#f59e0b',
  },
]

const LOOKBOOK_POSE_DIRECTION_LOCK_OPTIONS: Array<{
  value: LookbookPoseDirectionLock
  label: string
  desc: string
}> = [
  {
    value: 'auto',
    label: 'Auto',
    desc: 'Doi goc nhin tung anh de bo bo cuc da dang',
  },
  {
    value: 'front',
    label: 'Front',
    desc: 'Khoa huong chinh dien',
  },
  {
    value: 'back',
    label: 'Back',
    desc: 'Khoa huong quay lung',
  },
  {
    value: 'left',
    label: 'Left',
    desc: 'Khoa huong nghieng trai',
  },
  {
    value: 'right',
    label: 'Right',
    desc: 'Khoa huong nghieng phai',
  },
  {
    value: 'three-quarter-left',
    label: '3/4 Left',
    desc: 'Khoa huong 3/4 trai',
  },
  {
    value: 'three-quarter-right',
    label: '3/4 Right',
    desc: 'Khoa huong 3/4 phai',
  },
]

const LOOKBOOK_THEME_VALUES = LOOKBOOK_THEME_OPTIONS.map((item) => item.value) as LookbookTheme[]
const LOOKBOOK_POSE_DIRECTION_LOCK_VALUES = LOOKBOOK_POSE_DIRECTION_LOCK_OPTIONS.map((item) => item.value) as LookbookPoseDirectionLock[]

const LOCKED_LOCATION_LIBRARY = [
  'Phong ngu toi gian tone trang/kem: giuong gon, rem sheer trang, guong dung, anh sang cua so tu nhien',
  'Goc guong full body kieu Han: guong vien den/trang dat sat tuong, san go, decor it',
  'Studio gia home cafe: ban nho, ghe go, ly ca phe, den vang nhe tao cam giac lifestyle',
  'Walk-in closet: treo vai bo do phia sau, tone be/xam de outfit noi bat',
  'Background cua so lon: anh sang hat ngang nguoi giup chat lieu vay bat sang dep',
  'Goc sofa apartment: sofa kem + ban tra nho + sach/tap chi fashion',
  'Tuong tron mau trung tinh: trang, xam nhat, be, ghi lanh de focus vao outfit',
  'Hanh lang chung cu/khach san: tao cam giac sang, hop outfit nu tinh body',
  'Guong thang may: vibe luxury, hop clip chuyen outfit nhanh',
  'Cua ra vao apartment kieu Han: canh chuan bi di ra ngoai hop video tiep thi',
  'Ban cong apartment: nang nhe + cay xanh tao cam giac chill nu tinh',
  'Studio cyclorama trang: background sach hoan toan, hop brand local',
  'Quan cafe toi gian: tone xi mang, go sang, anh sang tu nhien',
  'Goc vanity makeup: ban makeup co den, nuoc hoa, tui xach cho daily girl routine',
  'Phong thay do showroom: hop clip thu do, mix-match nhieu outfit',
  'Cau thang toi gian: tao chuyen dong dep khi mac vay dai duoi ca',
  'Background rem voan trang: pho bien voi vay satin/lua de outfit mem hon',
  'Background den sunset projector: vibe sexy/chill buoi toi',
  'Background ngoai troi gia casual: bai do xe sach, tuong xi mang, cua kinh cafe',
  'Goc guong dat canh cay xanh: monstera/olive tree de khung hinh bot trong',
  'Tone viral Clean girl: trang + be + anh sang tu nhien',
  'Tone viral Korean apartment: go sang + rem trang + decor toi gian',
  'Tone viral Luxury soft girl: marble + den vang + guong lon',
  'Tone viral Casual influencer: phong hoi bua nhe co chu dich de tao cam giac that',
  'Tone viral Pinterest aesthetic: anh sang film, grain nhe, decor vintage',
] as const

const LOCKED_LOCATION_MIRROR_POOL = [
  LOCKED_LOCATION_LIBRARY[1],
  LOCKED_LOCATION_LIBRARY[8],
  LOCKED_LOCATION_LIBRARY[14],
  LOCKED_LOCATION_LIBRARY[19],
] as const

const LOCKED_LOCATION_STUDIO_POOL = [
  LOCKED_LOCATION_LIBRARY[0],
  LOCKED_LOCATION_LIBRARY[2],
  LOCKED_LOCATION_LIBRARY[3],
  LOCKED_LOCATION_LIBRARY[4],
  LOCKED_LOCATION_LIBRARY[5],
  LOCKED_LOCATION_LIBRARY[6],
  LOCKED_LOCATION_LIBRARY[11],
  LOCKED_LOCATION_LIBRARY[13],
  LOCKED_LOCATION_LIBRARY[16],
  LOCKED_LOCATION_LIBRARY[17],
  LOCKED_LOCATION_LIBRARY[20],
  LOCKED_LOCATION_LIBRARY[21],
  LOCKED_LOCATION_LIBRARY[22],
  LOCKED_LOCATION_LIBRARY[23],
  LOCKED_LOCATION_LIBRARY[24],
] as const

const LOCKED_LOCATION_FLEX_POOL = [
  LOCKED_LOCATION_LIBRARY[7],
  LOCKED_LOCATION_LIBRARY[9],
  LOCKED_LOCATION_LIBRARY[10],
  LOCKED_LOCATION_LIBRARY[12],
  LOCKED_LOCATION_LIBRARY[15],
  LOCKED_LOCATION_LIBRARY[18],
] as const

const LOCKED_LOCATION_LIBRARY_PROMPT_LIST = LOCKED_LOCATION_LIBRARY
  .map((item, index) => `${index + 1}. ${item}`)
  .join('\n')

const LOOKBOOK_THEME_LOCATION_FALLBACKS: Record<Exclude<LookbookTheme, 'auto'>, readonly string[]> = {
  minimal_studio: [
    LOCKED_LOCATION_LIBRARY[0],
    LOCKED_LOCATION_LIBRARY[6],
    LOCKED_LOCATION_LIBRARY[11],
  ],
  street_casual: [
    LOCKED_LOCATION_LIBRARY[10],
    LOCKED_LOCATION_LIBRARY[12],
    LOCKED_LOCATION_LIBRARY[18],
  ],
  office_chic: [
    LOCKED_LOCATION_LIBRARY[7],
    LOCKED_LOCATION_LIBRARY[9],
    LOCKED_LOCATION_LIBRARY[15],
  ],
  party_night: [
    LOCKED_LOCATION_LIBRARY[8],
    LOCKED_LOCATION_LIBRARY[17],
    LOCKED_LOCATION_LIBRARY[22],
  ],
  vacation_resort: [
    LOCKED_LOCATION_LIBRARY[10],
    LOCKED_LOCATION_LIBRARY[12],
    LOCKED_LOCATION_LIBRARY[4],
  ],
}

const LOOKBOOK_SHOT_BLUEPRINTS: Array<{
  title: string
  purpose: string
  directive: string
}> = [
  {
    title: 'Hero Full Body',
    purpose: 'Primary look reveal for catalog thumbnail and cover',
    directive: 'Single-frame full-body hero composition, head-to-toe visibility, clean posture, clear garment silhouette, no split-screen.',
  },
  {
    title: 'Front Fit Proof',
    purpose: 'Show front fit, waistline, and overall shape clarity',
    directive: 'Front-facing or three-quarter-front still frame, emphasize fit lines and proportion, maintain product details, no split-screen.',
  },
  {
    title: 'Back Detail Proof',
    purpose: 'Show back structure and rear garment design details',
    directive: 'Back-facing or over-shoulder still frame emphasizing rear garment design, fabric drape, and stitching clarity, no split-screen.',
  },
  {
    title: 'Texture Close Detail',
    purpose: 'Verify material texture and craftsmanship for purchase trust',
    directive: 'Detail-oriented still frame on texture/material/stitching while preserving overall garment identity and realism, no split-screen.',
  },
  {
    title: 'Side Silhouette',
    purpose: 'Show side profile silhouette and drape balance',
    directive: 'Side-angle still frame emphasizing silhouette contour, garment drape, and fit transitions, no split-screen.',
  },
  {
    title: 'Waistline Focus',
    purpose: 'Highlight waist shaping and proportion cues',
    directive: 'Three-quarter still frame with strong waistline visibility and flattering body proportion cues, no split-screen.',
  },
  {
    title: 'Fabric Motion Freeze',
    purpose: 'Capture dynamic fabric behavior in a still frame',
    directive: 'Freeze-frame look with slight garment movement cue to show fabric behavior while keeping details sharp, no split-screen.',
  },
  {
    title: 'Mirror Confidence',
    purpose: 'Social-native confidence framing with full outfit readability',
    directive: 'Mirror-style fashion still frame with full outfit readability and clean reflection composition, no split-screen.',
  },
  {
    title: 'Accessory Match',
    purpose: 'Show compatible accessories and styling coherence',
    directive: 'Still frame emphasizing accessory pairing and full look cohesion without hiding core garment details, no split-screen.',
  },
  {
    title: 'Occasion Context',
    purpose: 'Place look in a real-world context suitable for daily/lifestyle use',
    directive: 'Lifestyle still frame in believable context (studio corner, street, cafe, or fitting room) keeping outfit as hero, no split-screen.',
  },
]

const LOOKBOOK_TIKTOK_SIGNAL_HINT = `TikTok tag snapshots (web): #OOTD ~65.5M posts, #lookbook ~459.5K posts, #sexyoutfit ~37.6K posts.
Implication: keep OOTD readability first, then lookbook polish; sexy should be tasteful and non-explicit.`

const LOOKBOOK_NANO_BANANA_FACING_SEQUENCE: PromptFacingDirection[] = [
  'front',
  'three-quarter-left',
  'back',
  'three-quarter-right',
  'left',
  'right',
]

const LOOKBOOK_NANO_BANANA_PRO_RULES = `[NANO BANANA PRO IMAGE RULESET]
1. Single frame only. No split-screen, no storyboard, no timeline terms.
2. Keep exact face identity and exact garment fidelity from references.
3. Product-first framing: outfit details must stay readable and not occluded.
4. Keep realistic anatomy and natural posing with physically plausible body angles.
5. Use explicit body-facing direction and vary facing between adjacent prompts in a set.
6. Keep one coherent camera instruction per image (no conflicting camera grammar).
7. Keep lighting practical and continuity-safe for social-native lookbook usage.
8. Respect user notes as primary direction unless safety/schema constraints conflict.
9. Never reference or imitate any real celebrity/public figure.
10. If tone is sexy, keep it tasteful, classy, non-explicit, and policy-safe.`

const LOOKBOOK_NATURAL_LOCATION_FALLBACKS = [
  ...LOCKED_LOCATION_FLEX_POOL,
  ...LOCKED_LOCATION_STUDIO_POOL,
  ...LOCKED_LOCATION_MIRROR_POOL,
] as const

const FIXED_AFFILIATE_MODE: AffiliateMode = 'strict'
const FIXED_SALES_TEMPLATE: SalesTemplate = 'soft'
const FIXED_STRATEGY_LABEL = 'TikTok Shop Core (Strict AUTO + Soft Sell)'
const FIXED_STRATEGY_DESC = 'Khoa AUTO ve nhom convert cao va giu tone trust-first de ban ben vung.'
const OOTD_TEMPLATE_ROUTE_PATH = '/ootd-template'
const STORYBOARD_TEMPLATE_ROUTE_PATH = '/storyboard-template'
const MUSIC_VIDEO_TEMPLATE_ROUTE_PATH = '/music-video-template'
const PROMPT_LIBRARY_ROUTE_PATH = '/prompt-library'
const OOTD_TEMPLATE_LOCKED_DURATION = 24
const OOTD_TEMPLATE_LOCKED_ASPECT_RATIO: '9:16' = '9:16'
const OOTD_TEMPLATE_CLASSIC_REFERENCE_VIDEO_ID = '7633009640682442005'
const OOTD_TEMPLATE_CLASSIC_REFERENCE_VIDEO_FILE_NAME = 'snaptik.vn_7633009640682442005.mp4'
const OOTD_TEMPLATE_CLASSIC_SOURCE_DURATION_SEC = 13.838
const OOTD_TEMPLATE_CLASSIC_PRODUCT_BRIEF = `Keep the same mirror phone fit-check progression from the reference video.
- Preserve phone-in-hand mirror framing with controlled handheld energy.
- Keep progression: mirror hook -> full-fit proof -> detail proof -> soft confidence close.
- Keep beat order, but do not clone exact second-by-second timeline from the reference.
- The only variable is the outfit/product from current PRODUCT input image.
- Maintain full-body readability while keeping product details visible in every beat.
- Mirror distance lock: stand closer to mirror so outfit appears larger (target subject occupancy ~70-85% frame) while still keeping head-to-toe visibility.
- Direction lock: face stays FRONT; body angle only FRONT, 3/4 LEFT, or 3/4 RIGHT; never back-facing.
- Voice rule: visual-only mirror phone fit-check, no voiceover/spoken dialogue, no lip-sync behavior.`
const OOTD_TEMPLATE_CLASSIC_LOCKED_ANALYSIS: TikTokAnalysisResult = {
  detectedContentType: 'ootdmirror',
  detectedDurationSec: OOTD_TEMPLATE_CLASSIC_SOURCE_DURATION_SEC,
  hookStyle: 'Minimal mirror phone hook text with immediate full-fit visibility in closer mirror framing.',
  narrativeStructure: 'Phone-held mirror hook -> full-fit proof -> detail check -> angle switch -> concise close (order lock, timeline-flex).',
  ctaStyle: 'Soft recommendation close, no hard sell, text-only suggestion.',
  colorGrade: 'clean indoor mirror lighting, neutral skin tone, practical contrast',
  pacing: 'fast micro-beat mirror pacing with adaptive cut length by target duration',
  sceneBeats: [
    {
      index: 0,
      timestamp: 'Step 1',
      beatName: 'MIRROR HOOK FRAME',
      description: 'Open directly in front of mirror with phone visible to establish clear mirror phone fit-check framing.',
      contextHint: 'Indoor mirror zone, practical room background, minimal clutter.',
      cameraHint: 'Phone-held steady start at closer mirror distance, tight full-body framing with minimal empty margins.',
      narrationHint: 'No spoken line; use visual hook and optional on-screen text only.',
    },
    {
      index: 1,
      timestamp: 'Step 2',
      beatName: 'FULL FIT PROOF',
      description: 'Hold full-body front fit long enough for viewers to read silhouette, length, and proportion.',
      contextHint: 'Do not change room; keep continuity and trust-first realism.',
      cameraHint: 'Stable mirror frame, subject occupies around 70-85% of frame while preserving head-to-toe readability.',
      narrationHint: 'No spoken line; let framing show fit and wearability.',
    },
    {
      index: 2,
      timestamp: 'Step 3',
      beatName: 'DETAIL CHECK',
      description: 'Move closer to mirror for fabric/waistline/finishing detail proof without losing outfit context.',
      contextHint: 'Keep same mirror ambience; avoid dramatic location transitions.',
      cameraHint: 'Phone-held mid-close detail pass with slow vertical scan.',
      narrationHint: 'No spoken line; emphasize details through close visual proof.',
    },
    {
      index: 3,
      timestamp: 'Step 4',
      beatName: 'ANGLE SWITCH',
      description: 'Do one short 3/4 angle switch to prove side-fit and movement behavior without turning full back.',
      contextHint: 'Small movement inside mirror frame, keep spatial continuity.',
      cameraHint: 'Quick half-turn with controlled follow and no abrupt shake.',
      narrationHint: 'No spoken line; confidence is shown via movement and posture.',
    },
    {
      index: 4,
      timestamp: 'Step 5',
      beatName: 'SOFT CLOSE',
      description: 'Return to hero mirror pose and finish with concise recommendation-style closing.',
      contextHint: 'Center frame again for clear visual end-point.',
      cameraHint: 'Short hold on closer hero full-body pose with tiny push-in for clearer outfit readability.',
      narrationHint: 'Optional on-screen CTA text only; no spoken CTA.',
    },
  ],
  generatedScript: `Open with a phone-in-hand front mirror frame and instant full-fit visibility.
Hold front full-body fit proof for silhouette readability.
Move into detail check (fabric, waistline, finishing).
Add a short 3/4 angle switch for side-fit confirmation (no full back turn).
Return to hero mirror pose and close with soft on-screen CTA.`,
  generatedAt: 0,
}

const OOTD_TEMPLATE_COZY_REFERENCE_VIDEO_ID = '7812247666227'
const OOTD_TEMPLATE_COZY_REFERENCE_VIDEO_FILE_NAME = '7812247666227.mp4'
const OOTD_TEMPLATE_COZY_SOURCE_DURATION_SEC = 26
const OOTD_TEMPLATE_COZY_PRODUCT_BRIEF = `Keep front-camera outfit presentation progression while matching the cozy home background style from the reference video.
- Preserve observer-camera framing (model stands in front of filming lens), no phone-in-hand mirror framing.
- Keep progression: cozy hook -> front-fit proof -> side-angle reveal -> front reset -> soft three-quarter close.
- Keep beat order, but do not clone exact second-by-second timeline from the reference.
- The only variable is the outfit/product from current PRODUCT input image.
- Maintain full-body readability while keeping product details visible in every beat.
- Background style lock: warm cream walls, wood floor, soft practical home light, shelf decor, and indoor-plant accents in one continuous room.
- Mirror lock: keep a rear mirror behind the model visible in frame as reflection proof while camera stays in front of the model.
- Camera lock: front-lens observer camera with stable tripod-like framing; no phone-in-hand capture.
- Framing lock: keep full-body head-to-toe in one stable frame, avoid aggressive push-in/zoom or close-up takeover.
- Direction lock: face stays FRONT toward camera; body only FRONT, 3/4 LEFT, or 3/4 RIGHT; never back-facing.
- Voice rule: visual-only front-camera outfit presentation, no voiceover/spoken dialogue, no lip-sync behavior.`
const OOTD_TEMPLATE_COZY_LOCKED_ANALYSIS: TikTokAnalysisResult = {
  detectedContentType: 'ootd',
  detectedDurationSec: OOTD_TEMPLATE_COZY_SOURCE_DURATION_SEC,
  hookStyle: 'Cozy home front-camera hook with rear-mirror reflection visible behind model and immediate full-fit visibility.',
  narrativeStructure: 'Cozy room front-camera hook + rear-mirror reflection -> full-fit proof -> side-angle reveal -> front reset -> concise three-quarter close (order lock, timeline-flex).',
  ctaStyle: 'Soft recommendation close, no hard sell, text-only suggestion.',
  colorGrade: 'warm neutral indoor practical lighting, soft highlight rolloff, natural skin tone',
  pacing: 'steady front-camera pacing with subtle pose-loop changes and adaptive cut length by target duration',
  sceneBeats: [
    {
      index: 0,
      timestamp: 'Step 1',
      beatName: 'COZY CAMERA HOOK',
      description: 'Open standing in front of the filming camera and establish a warm cozy home background in one shot.',
      contextHint: 'Warm cream wall, wood floor, shelf decor, plant accents, and rear mirror visible behind model.',
      cameraHint: 'Observer-camera start, stable front-lens framing, full-body with minimal empty margins, and rear mirror reflection proof.',
      narrationHint: 'No spoken line; use visual hook and optional on-screen text only.',
    },
    {
      index: 1,
      timestamp: 'Step 2',
      beatName: 'FULL FIT PROOF',
      description: 'Hold full-body front fit long enough for viewers to read silhouette, length, and proportion.',
      contextHint: 'Keep same cozy room continuity and keep decor/mirror anchors stable across cuts.',
      cameraHint: 'Stable observer-camera frame, full-body head-to-toe readability, rear mirror remains visible, no dramatic zoom behavior.',
      narrationHint: 'No spoken line; let framing show fit and wearability.',
    },
    {
      index: 2,
      timestamp: 'Step 3',
      beatName: 'SIDE-ANGLE REVEAL',
      description: 'Do a gentle side-angle reveal to prove silhouette and side-fit while keeping movement smooth.',
      contextHint: 'Stay in the same cozy room setup; preserve shelf/lamp/floor/mirror anchors for continuity.',
      cameraHint: 'Static front-lens camera with subject pivot; rear mirror stays behind model in view, no handheld shake and no close-up takeover.',
      narrationHint: 'No spoken line; confidence is shown through controlled turn and posture.',
    },
    {
      index: 3,
      timestamp: 'Step 4',
      beatName: 'FRONT RESET',
      description: 'Return to front-facing hero stance and cycle two to three subtle hand/hip pose changes.',
      contextHint: 'Keep identical composition and cozy-light mood with no location drift; mirror anchor stays stable.',
      cameraHint: 'Locked-off observer-camera frame with full-body continuity, balanced headroom, and rear mirror visibility.',
      narrationHint: 'No spoken line; pose-loop rhythm carries the beat.',
    },
    {
      index: 4,
      timestamp: 'Step 5',
      beatName: 'THREE-QUARTER CLOSE',
      description: 'Finish with a concise three-quarter closing pose that transitions cleanly into end card behavior.',
      contextHint: 'Maintain same cozy room and rear-mirror anchors until the final beat without scene change.',
      cameraHint: 'Stable front-lens full-body frame through the final turn; rear mirror still visible, no late zoom/push-in.',
      narrationHint: 'Optional on-screen CTA text only; no spoken CTA.',
    },
  ],
  generatedScript: `Open with a cozy home front-camera frame and immediate full-fit visibility.
Hold front full-body fit proof for silhouette readability.
Add a gentle side-angle reveal while keeping the same static camera and rear-mirror anchors.
Reset to front hero stance with subtle pose-loop changes in the same composition.
Finish with a concise three-quarter close into end-card timing.`,
  generatedAt: 0,
}

const OOTD_TEMPLATE_NIGHT_GLOW_REFERENCE_VIDEO_ID = '7817146311637'
const OOTD_TEMPLATE_NIGHT_GLOW_REFERENCE_VIDEO_FILE_NAME = '7817146311637.mp4'
const OOTD_TEMPLATE_NIGHT_GLOW_SOURCE_DURATION_SEC = 12.003991
const OOTD_TEMPLATE_NIGHT_GLOW_PRODUCT_BRIEF = `Keep the same night-glam front-camera progression from the reference video.
- Preserve observer-camera fashion presentation (no phone-in-hand mirror framing).
- Keep progression: hero full-body hook -> brief back-reveal turn -> three-quarter return flow -> upper-body detail close -> centered glam close with nightlife glow transition.
- Keep beat order, but do not clone exact second-by-second timeline from the reference.
- The only variable is the outfit/product from current PRODUCT input image.
- Maintain elegant body-line readability and fabric sheen visibility in every beat.
- Environment lock: nighttime high-rise window backdrop, city bokeh lights, dark reflective floor, and one continuous indoor evening venue until final close.
- Camera lock: mostly stable front-lens observer camera; allow smooth push-in from full-body to upper-body close, then hold centered close.
- Framing lock: open with full-body, then transition to medium/upper-body detail around neckline/texture, and finish centered glam posture.
- Direction rule: allow one short back-reveal beat in the middle, then return to front/three-quarter for closing.
- Voice rule: visual-only evening fashion presentation, no voiceover/spoken dialogue, no lip-sync behavior.`
const OOTD_TEMPLATE_NIGHT_GLOW_LOCKED_ANALYSIS: TikTokAnalysisResult = {
  detectedContentType: 'ootd',
  detectedDurationSec: OOTD_TEMPLATE_NIGHT_GLOW_SOURCE_DURATION_SEC,
  hookStyle: 'Night citylight front-camera hook with full-body glam pose, satin sheen highlights, and skyline bokeh backdrop.',
  narrativeStructure: 'Night hero full-body hook -> brief back-reveal turn -> three-quarter return flow -> upper-body detail close -> centered glam closer with nightlife glow transition (order lock, timeline-flex).',
  ctaStyle: 'Soft recommendation close, no hard sell, text-only suggestion.',
  colorGrade: 'cool-to-neutral night contrast, city bokeh glow, and crisp satin highlight separation',
  pacing: 'medium-fast glam pacing with smooth pose transitions and soft final glow transition',
  sceneBeats: [
    {
      index: 0,
      timestamp: 'Step 1',
      beatName: 'NIGHT HERO HOOK',
      description: 'Open with full-body front-facing hero stance and a confident glam pose in front of citylight windows.',
      contextHint: 'Floor-to-ceiling windows, nighttime city bokeh, dark glossy floor, no venue switch.',
      cameraHint: 'Stable front-lens observer framing, full-body head-to-toe readability, minimal shake.',
      narrationHint: 'No spoken line; use visual hook and optional on-screen text only.',
    },
    {
      index: 1,
      timestamp: 'Step 2',
      beatName: 'BACK REVEAL TURN',
      description: 'Execute one controlled pivot into a brief back-view silhouette reveal, then hold shortly.',
      contextHint: 'Keep the same window zone and citylight anchors; no location drift.',
      cameraHint: 'Keep observer-camera axis stable while subject turns; no abrupt shake or jump.',
      narrationHint: 'No spoken line; confidence is shown through controlled body line and posture.',
    },
    {
      index: 2,
      timestamp: 'Step 3',
      beatName: 'THREE-QUARTER RETURN',
      description: 'Return from back reveal into a three-quarter/front-glance pose with smooth hemline movement.',
      contextHint: 'Maintain the same venue composition and city-bokeh continuity.',
      cameraHint: 'Gentle follow or subtle push to keep silhouette readable while turning back toward camera.',
      narrationHint: 'No spoken line; visual flow carries the transition beat.',
    },
    {
      index: 3,
      timestamp: 'Step 4',
      beatName: 'UPPER-BODY DETAIL CLOSE',
      description: 'Shift to medium/upper-body framing to highlight neckline, satin drape texture, and accessory details.',
      contextHint: 'Keep same night-window backdrop and practical light mood while moving closer.',
      cameraHint: 'Smooth push-in from full-body to upper-body close, keep face sharp and motion controlled.',
      narrationHint: 'No spoken line; detail proof comes from framing and micro-pose changes.',
    },
    {
      index: 4,
      timestamp: 'Step 5',
      beatName: 'GLAM CLOSER TRANSITION',
      description: 'Finish in centered front glam posture and allow a brief nightlife crowd-glow style transition in the final moment.',
      contextHint: 'Keep core night-glam identity; any crowd-glow transition should appear only at the closing second.',
      cameraHint: 'Stable centered medium framing for close, no aggressive zoom, no abrupt location jump before end.',
      narrationHint: 'Optional on-screen CTA text only; no spoken CTA.',
    },
  ],
  generatedScript: `Open with a full-body front hero pose in a night citylight window setting.
Add one short controlled back-reveal turn to show silhouette.
Return to a three-quarter/front-glance flow with smooth fabric movement.
Push in to upper-body detail proof (neckline, texture, accessory cues).
End in centered glam close with a brief nightlife glow transition at the final moment.`,
  generatedAt: 0,
}

const OOTD_TEMPLATE_RELAXED_BOUTIQUE_REFERENCE_VIDEO_ID = 'tiktok_video_front_camera_fitcheck'
const OOTD_TEMPLATE_RELAXED_BOUTIQUE_REFERENCE_VIDEO_FILE_NAME = 'tiktok_video.mp4'
const OOTD_TEMPLATE_RELAXED_BOUTIQUE_SOURCE_DURATION_SEC = 39
const OOTD_TEMPLATE_RELAXED_BOUTIQUE_PRODUCT_BRIEF = `Keep the relaxed non-mirror front-camera boutique fit-check progression from the reference video.
- Preserve observer-camera framing: model stands in front of the filming camera, no phone-in-hand mirror framing.
- Keep progression: smooth walk-in / hair-flip hook -> relaxed full-fit proof -> product-detail motion proof -> soft side/three-quarter silhouette turn -> confident front reset / close.
- 32s option only: include exactly one soft over-shoulder back-detail lean before the close; torso angles slightly to show the garment back/backline, but face stays turned toward the front camera and the pose returns to front/three-quarter immediately.
- Keep beat order, but do not clone exact second-by-second timeline from the reference.
- The only variable is the outfit/product from current PRODUCT input image.
- Maintain full-body readability while keeping product details visible in every beat; make the template usable for dresses, skirts, tops, bottoms, outerwear, sets, shoes, and accessories.
- Background style lock: clean neutral-grey boutique wall, arched display niches, floating shelf, LED strip accents, ceiling curve, and warm wood floor in one continuous venue.
- Lighting lock: bright, clear boutique key light with soft frontal fill; face, body line, fabric texture, color, seams, waist/hem/strap/collar details, and footwear must stay easy to read. Avoid dim/moody/low-key lighting, crushed shadows, silhouette, or underexposed product details.
- Camera lock: fixed or very gently stabilized front-lens observer camera; no mirror, no selfie, no phone in hand, no aggressive zoom.
- Framing lock: begin medium/full-body, step back to show full head-to-toe, allow natural medium framing for product-detail proof, then return to full/three-quarter readability.
- Prop rule: do not bring hand-held product props or extra loose garments into frame; use the worn product, body movement, hand styling, fabric touch, hem/collar/waist/strap/closure detail, and natural pose changes as proof.
- Direction rule: face stays mostly front toward camera; allow gentle side/three-quarter turns for silhouette proof; in 32s only, allow one short over-shoulder back-detail lean with face still visible toward camera; avoid full or prolonged back-facing hold.
- Voice rule: visual-only relaxed fit-check, no voiceover/spoken dialogue, no lip-sync behavior.`
const OOTD_TEMPLATE_RELAXED_BOUTIQUE_LOCKED_ANALYSIS: TikTokAnalysisResult = {
  detectedContentType: 'ootd',
  detectedDurationSec: OOTD_TEMPLATE_RELAXED_BOUTIQUE_SOURCE_DURATION_SEC,
  hookStyle: 'Relaxed front-camera boutique hook with smooth hair flip / walk-in energy and immediate outfit presence.',
  narrativeStructure: 'Front-camera hook -> relaxed full-fit proof -> product-detail motion proof -> smooth side/three-quarter silhouette proof with optional 32s over-shoulder back-detail lean -> confident front reset close (order lock, timeline-flex).',
  ctaStyle: 'Soft boutique recommendation close, no hard sell, visual proof first.',
  colorGrade: 'bright clear boutique lighting, clean neutral-grey textured wall, warm wood floor, soft LED accent highlights, natural skin tone, high product readability',
  pacing: 'smooth relaxed fit-check pacing with graceful pose holds, soft turns, and no rushed mirror/selfie energy',
  sceneBeats: [
    {
      index: 0,
      timestamp: 'Step 1',
      beatName: 'RELAXED CAMERA HOOK',
      description: 'Open standing close to the front camera with a smooth hair flip or walk-in gesture to establish relaxed fit-check confidence.',
      contextHint: 'Bright neutral-grey boutique wall, arched display niches, floating shelf, LED strip accents, curved ceiling, warm wood floor, clear face and product exposure.',
      cameraHint: 'Stable front-lens observer camera, medium-to-full framing, no phone or mirror framing.',
      narrationHint: 'No spoken line; visual hook and optional short on-screen text only.',
    },
    {
      index: 1,
      timestamp: 'Step 2',
      beatName: 'RELAXED FULL-FIT PROOF',
      description: 'Step or settle back into a full-body pose so viewers can read silhouette, length, waistline, and footwear.',
      contextHint: 'Keep same boutique venue and shelf/niche/floor anchors stable.',
      cameraHint: 'Locked-off front-camera full-body frame with minimal empty margin and smooth posture changes.',
      narrationHint: 'No spoken line; outfit readability carries the beat.',
    },
    {
      index: 2,
      timestamp: 'Step 3',
      beatName: 'PRODUCT DETAIL MOTION PROOF',
      description: 'Use the worn product for proof: gentle fabric touch, hem/collar/waist/strap/closure adjustment, small step, or hand styling based on the selected fashion category.',
      contextHint: 'Same boutique set; no extra loose garment or hand-held product prop enters the frame.',
      cameraHint: 'Stable observer-camera medium/full frame; product detail remains readable without cropping the overall outfit for too long.',
      narrationHint: 'No spoken line; detail proof is visual only.',
    },
    {
      index: 3,
      timestamp: 'Step 4',
      beatName: 'SMOOTH SIDE SILHOUETTE',
      description: 'Turn into a soft side or three-quarter pose with one relaxed hand-to-hip/hand-to-thigh gesture to prove drape and body line. For 32s output, this beat becomes one soft over-shoulder back-detail lean: torso slightly angles to show backline while face stays turned toward the front camera.',
      contextHint: 'No venue switch; keep bright neutral-grey boutique anchors and product details visible.',
      cameraHint: 'Fixed front camera while subject pivots smoothly; no abrupt shake or close-up takeover; never hold a full back-facing orientation.',
      narrationHint: 'No spoken line; relaxed pose and silhouette proof carry the beat.',
    },
    {
      index: 4,
      timestamp: 'Step 5',
      beatName: 'CONFIDENT FRONT RESET CLOSE',
      description: 'Return toward front/three-quarter hero stance and close with a calm boutique recommendation-style hold.',
      contextHint: 'End in the same boutique set with clean product readability and no final location jump.',
      cameraHint: 'Stable centered frame, optional tiny push-in only if full outfit remains readable.',
      narrationHint: 'Optional concise on-screen CTA text only; no spoken CTA.',
    },
  ],
  generatedScript: `Open with a relaxed front-camera walk-in or hair-flip hook in the boutique set.
Settle into a full-body fit proof so silhouette, waistline, length, footwear, and category-specific details are readable.
Use hands and small body movement to show product details on the worn item; do not bring extra loose garments into frame.
Turn smoothly into a side or three-quarter pose with relaxed hand styling for drape and body-line proof; for 32s, add one soft over-shoulder back-detail lean while the face stays turned toward camera.
Return to front/three-quarter hero stance and close with calm boutique confidence.`,
  generatedAt: 0,
}

const OOTD_TEMPLATE_FREESTYLE_REFERENCE_VIDEO_ID = 'free_style_product_review'
const OOTD_TEMPLATE_FREESTYLE_REFERENCE_VIDEO_FILE_NAME = 'no-reference-freestyle'
const OOTD_TEMPLATE_FREESTYLE_SOURCE_DURATION_SEC = 0
const OOTD_TEMPLATE_FREESTYLE_PRODUCT_BRIEF = `Free Style Product Review template for OOTD Template Page.
- Creative freedom is open: the model may walk, pivot, pose, detail-check, style-adjust, gesture, sit/stand, or use a natural creator-style movement.
- Core content is non-negotiable: the video must review the current fashion product/outfit from PRODUCT input with clear fit, material, detail, movement, styling, and verdict proof.
- Every scene uses KF[i] as START FRAME and KF[i+1] as END FRAME as a standalone product-review clip.
- Adjacent keyframes must never share the same facingDirection. KF[i] and KF[i+1] must show a visible turn/pivot/body-direction change so Veo has two different directions to interpolate.
- If a generated idea repeats the same direction twice, remap the second keyframe to the nearest different direction and describe the turn explicitly.
- Keep product readability higher than freestyle choreography: no action may hide the garment, crop key fit areas, or replace the product review intent.
- Visual-only rule: no voiceover/spoken dialogue/lip-sync/talking-to-camera behavior.`
const OOTD_TEMPLATE_FREESTYLE_LOCKED_ANALYSIS: TikTokAnalysisResult = {
  detectedContentType: 'ootd',
  detectedDurationSec: OOTD_TEMPLATE_FREESTYLE_SOURCE_DURATION_SEC,
  hookStyle: 'Freestyle creator-native product review hook with clear outfit readability.',
  narrativeStructure: 'Freestyle product-review sequence: hook/full-look -> fit/proportion -> material/detail -> movement/styling -> verdict close, with every adjacent keyframe using a different body direction.',
  ctaStyle: 'Soft styling verdict and product-readable recommendation.',
  colorGrade: 'clean fashion creator lighting, natural skin tone, accurate product color, high fabric/detail readability',
  pacing: 'freestyle but controlled; each standalone scene has a distinct review angle and a visible pivot from start keyframe to end keyframe',
  sceneBeats: [
    {
      index: 0,
      timestamp: 'Scene style 1',
      beatName: 'FREESTYLE HOOK / FULL-LOOK REVIEW',
      description: 'Open with any natural creator-style action while showing the complete outfit/product clearly.',
      contextHint: 'Any product-appropriate fashion setting is allowed if the product remains readable.',
      cameraHint: 'Full-body or medium-wide framing with stable product visibility.',
      narrationHint: 'No spoken line; optional short on-screen text only.',
    },
    {
      index: 1,
      timestamp: 'Scene style 2',
      beatName: 'FIT AND PROPORTION REVIEW',
      description: 'Use a different body direction and a visible pivot to review fit, size, proportion, and silhouette.',
      contextHint: 'Keep identity/product/location anchors stable within the scene.',
      cameraHint: 'Start/end frames must not share the same facing direction.',
      narrationHint: 'Visual proof only.',
    },
    {
      index: 2,
      timestamp: 'Scene style 3',
      beatName: 'MATERIAL / DETAIL REVIEW',
      description: 'Use hands, posture, or a controlled turn to review fabric texture, seams, trim, closure, collar, hem, strap, or hardware.',
      contextHint: 'No extra product props required; review the worn product.',
      cameraHint: 'Medium or full-body composition with detail readable.',
      narrationHint: 'No spoken line.',
    },
    {
      index: 3,
      timestamp: 'Scene style 4',
      beatName: 'MOVEMENT / COMFORT REVIEW',
      description: 'Use a walk, pivot, step, stretch, or body movement to review comfort, drape, and wearability.',
      contextHint: 'Movement stays practical and product-first.',
      cameraHint: 'Visible turn/pivot from start to end keyframe.',
      narrationHint: 'No dialogue.',
    },
    {
      index: 4,
      timestamp: 'Scene style 5',
      beatName: 'STYLING VERDICT CLOSE',
      description: 'End with a different angle, confident pose, and product-readable styling verdict.',
      contextHint: 'Freestyle close may vary, but product remains hero.',
      cameraHint: 'Clean final pose with outfit visible.',
      narrationHint: 'Optional concise on-screen CTA text only.',
    },
  ],
  generatedScript: `Freestyle product review: open with any natural creator-style hook while keeping the full outfit readable.
Use a different body direction on every adjacent keyframe and make each scene start/end with a visible pivot.
Review fit and proportion, then material/detail, then movement/comfort or styling use-case.
Close with a confident product-readable verdict pose.`,
  generatedAt: 0,
}

const OOTD_TEMPLATE_SCENARIOS: Array<{
  id: OotdTemplateScenarioId
  label: string
  desc: string
  referenceVideoId: string
  referenceVideoFileName: string
  referenceVideoUrl?: string
  sourceDurationSec: number
  lockedContentType: ResolvedContentType
  cameraFormat: 'mirror_phone' | 'front_camera'
  productBrief: string
  lockedAnalysis: TikTokAnalysisResult
}> = [
  {
    id: 'classic_mirror_phone',
    label: 'Mirror Phone Classic',
    desc: 'Mirror fit-check co ban',
    referenceVideoId: OOTD_TEMPLATE_CLASSIC_REFERENCE_VIDEO_ID,
    referenceVideoFileName: OOTD_TEMPLATE_CLASSIC_REFERENCE_VIDEO_FILE_NAME,
    referenceVideoUrl: new URL(`../${OOTD_TEMPLATE_CLASSIC_REFERENCE_VIDEO_FILE_NAME}`, import.meta.url).href,
    sourceDurationSec: OOTD_TEMPLATE_CLASSIC_SOURCE_DURATION_SEC,
    lockedContentType: 'ootdmirror',
    cameraFormat: 'mirror_phone',
    productBrief: OOTD_TEMPLATE_CLASSIC_PRODUCT_BRIEF,
    lockedAnalysis: OOTD_TEMPLATE_CLASSIC_LOCKED_ANALYSIS,
  },
  {
    id: 'cozy_home_background',
    label: 'Cozy Home Background',
    desc: 'Front-camera phong nha am, decor cay xanh',
    referenceVideoId: OOTD_TEMPLATE_COZY_REFERENCE_VIDEO_ID,
    referenceVideoFileName: OOTD_TEMPLATE_COZY_REFERENCE_VIDEO_FILE_NAME,
    referenceVideoUrl: new URL(`../${OOTD_TEMPLATE_COZY_REFERENCE_VIDEO_FILE_NAME}`, import.meta.url).href,
    sourceDurationSec: OOTD_TEMPLATE_COZY_SOURCE_DURATION_SEC,
    lockedContentType: 'ootd',
    cameraFormat: 'front_camera',
    productBrief: OOTD_TEMPLATE_COZY_PRODUCT_BRIEF,
    lockedAnalysis: OOTD_TEMPLATE_COZY_LOCKED_ANALYSIS,
  },
  {
    id: 'night_city_glam',
    label: 'Night City Glam',
    desc: 'Front-camera citylight glam, back-reveal ngan + close-up texture',
    referenceVideoId: OOTD_TEMPLATE_NIGHT_GLOW_REFERENCE_VIDEO_ID,
    referenceVideoFileName: OOTD_TEMPLATE_NIGHT_GLOW_REFERENCE_VIDEO_FILE_NAME,
    referenceVideoUrl: new URL(`../${OOTD_TEMPLATE_NIGHT_GLOW_REFERENCE_VIDEO_FILE_NAME}`, import.meta.url).href,
    sourceDurationSec: OOTD_TEMPLATE_NIGHT_GLOW_SOURCE_DURATION_SEC,
    lockedContentType: 'ootd',
    cameraFormat: 'front_camera',
    productBrief: OOTD_TEMPLATE_NIGHT_GLOW_PRODUCT_BRIEF,
    lockedAnalysis: OOTD_TEMPLATE_NIGHT_GLOW_LOCKED_ANALYSIS,
  },
  {
    id: 'relaxed_boutique_camera',
    label: 'Relaxed Boutique Camera',
    desc: 'Front-camera fitcheck khong guong, thoai mai va muot',
    referenceVideoId: OOTD_TEMPLATE_RELAXED_BOUTIQUE_REFERENCE_VIDEO_ID,
    referenceVideoFileName: OOTD_TEMPLATE_RELAXED_BOUTIQUE_REFERENCE_VIDEO_FILE_NAME,
    referenceVideoUrl: new URL(`../${OOTD_TEMPLATE_RELAXED_BOUTIQUE_REFERENCE_VIDEO_FILE_NAME}`, import.meta.url).href,
    sourceDurationSec: OOTD_TEMPLATE_RELAXED_BOUTIQUE_SOURCE_DURATION_SEC,
    lockedContentType: 'ootd',
    cameraFormat: 'front_camera',
    productBrief: OOTD_TEMPLATE_RELAXED_BOUTIQUE_PRODUCT_BRIEF,
    lockedAnalysis: OOTD_TEMPLATE_RELAXED_BOUTIQUE_LOCKED_ANALYSIS,
  },
  {
    id: 'free_style_product_review',
    label: 'Free Style Review',
    desc: 'Tu do hanh dong, core la review san pham thoi trang',
    referenceVideoId: OOTD_TEMPLATE_FREESTYLE_REFERENCE_VIDEO_ID,
    referenceVideoFileName: OOTD_TEMPLATE_FREESTYLE_REFERENCE_VIDEO_FILE_NAME,
    sourceDurationSec: OOTD_TEMPLATE_FREESTYLE_SOURCE_DURATION_SEC,
    lockedContentType: 'ootd',
    cameraFormat: 'front_camera',
    productBrief: OOTD_TEMPLATE_FREESTYLE_PRODUCT_BRIEF,
    lockedAnalysis: OOTD_TEMPLATE_FREESTYLE_LOCKED_ANALYSIS,
  },
]

const OOTD_TEMPLATE_DEFAULT_SCENARIO_ID: OotdTemplateScenarioId = 'classic_mirror_phone'

const RESOLVED_CONTENT_TYPES: ResolvedContentType[] = [
  'ootd',
  'ootdmirror',
  'grwm',
  'outfitideas',
  'fyp',
  'review',
  'tiktokshop',
  'boutiquefeed',
  'athleisure',
  'haul',
  'styling',
  'luxury',
  'streetstyle',
  'sunnyaura',
  'partyoutfit',
]

const STRICT_AUTO_ALLOWED_TYPES: ResolvedContentType[] = ['tiktokshop', 'boutiquefeed', 'outfitideas', 'review', 'ootd', 'ootdmirror']

const PRODUCT_CATEGORY_GROUP_OPTIONS: Array<{
  value: ProductCategoryGroup
  label: string
  desc: string
}> = [
  {
    value: 'all',
    label: 'Tat ca',
    desc: 'Xem toan bo danh muc',
  },
  {
    value: 'tops',
    label: '1. Ao (Tops)',
    desc: 'Ao thun, so mi, blouse, crop top, ao len, hoodie',
  },
  {
    value: 'bottoms',
    label: '2. Quan (Bottoms)',
    desc: 'Jeans, quan tay, shorts, jogger, cargo, legging',
  },
  {
    value: 'dresses',
    label: '3. Dam (Dresses)',
    desc: 'Theo dang, hoan canh, chat lieu',
  },
  {
    value: 'skirts',
    label: '4. Chan vay (Skirts)',
    desc: 'Theo do dai, kieu dang, chat lieu',
  },
  {
    value: 'outerwear',
    label: '5. Ao khoac (Outerwear)',
    desc: 'Khoac nhe, khoac giu am, utility jacket',
  },
  {
    value: 'loungewear_sleepwear',
    label: '6. Do mac nha & ngu',
    desc: 'Bo mac nha, pijama, vay ngu, ao choang ngu',
  },
  {
    value: 'lingerie_swimwear',
    label: '7. Do lot & do boi',
    desc: 'Bra, quan lot, shapewear, bikini, monokini',
  },
  {
    value: 'activewear',
    label: '8. Do tap & the thao',
    desc: 'Sports bra, legging, seamless set, phu kien tap',
  },
  {
    value: 'traditional_festive',
    label: '9. Truyen thong & le hoi',
    desc: 'Ao dai, ao ba ba, yem cach tan, suon xam',
  },
  {
    value: 'accessories_footwear',
    label: '10. Phu kien & giay dep',
    desc: 'Giay dep, tui xach, non, kinh, that lung, trang suc',
  },
]

const PRODUCT_CATEGORY_OPTIONS: Array<{
  group: ProductCategoryGroup
  value: ProductCategory
  label: string
  desc: string
  detailHint: string
  suggestedTypes: ResolvedContentType[]
  benchmarkHint: string
}> = [
  {
    group: 'all',
    value: 'auto',
    label: 'Auto Boutique',
    desc: 'He thong tu uu tien type convert cao',
    detailHint: 'Mac dinh cho cac shop co nhieu dong san pham hoac du lieu con moi.',
    suggestedTypes: ['tiktokshop', 'boutiquefeed', 'outfitideas'],
    benchmarkHint: 'Phu hop khi ban chua ro san pham thuoc nhom nao; gom format chot don + review trust-first.',
  },
  {
    group: 'tops',
    value: 'tops_tshirt',
    label: 'Ao thun (T-shirts)',
    desc: 'Tay ngan, tay dai, polo, oversize, baby tee',
    detailHint: 'Ao thun tay ngan/tay dai, polo, oversize, baby tee.',
    suggestedTypes: ['outfitideas', 'ootd', 'tiktokshop'],
    benchmarkHint: 'Core SKU de chay save/share nhanh; nen uu tien mix-and-match + fit proof de tang CVR.',
  },
  {
    group: 'tops',
    value: 'tops_shirts',
    label: 'Ao so mi (Shirts)',
    desc: 'Cong so, kieu, lua/voan, form rong, khoac ngoai',
    detailHint: 'So mi cong so, so mi kieu, so mi lua/voan, so mi form rong, so mi khoac ngoai.',
    suggestedTypes: ['outfitideas', 'styling', 'boutiquefeed'],
    benchmarkHint: 'Noi dung co huong dan phoi theo ngu canh (di lam/di choi) thuong giu watch-time tot.',
  },
  {
    group: 'tops',
    value: 'tops_blouses',
    label: 'Ao kieu (Blouses)',
    desc: 'Tre vai, lech vai, co vuong, co V, beo nhun, tay bong',
    detailHint: 'Ao tre vai, lech vai, co vuong, co chu V, beo nhun, tay bong.',
    suggestedTypes: ['ootd', 'boutiquefeed', 'styling'],
    benchmarkHint: 'Nen mo bang silhouette + texture de tao cam giac cao cap va nu tinh ro hon.',
  },
  {
    group: 'tops',
    value: 'tops_croptops',
    label: 'Ao ngan (Crop tops)',
    desc: 'Croptop om sat, dang rong, tube top',
    detailHint: 'Croptop om sat, croptop dang rong, ao ong (tube top).',
    suggestedTypes: ['ootd', 'streetstyle', 'tiktokshop'],
    benchmarkHint: 'Can nhan body proportion + cach phoi quan/vay de giam boi roi cho nguoi xem.',
  },
  {
    group: 'tops',
    value: 'tops_corset',
    label: 'Corset / Ao corset',
    desc: 'Corset top, bustier, ao bo chat, ao go gong',
    detailHint: 'Corset top om waist, bustier, ao bo chat go gong (boned corset), ao corset moc sau lung.',
    suggestedTypes: ['ootd', 'ootdmirror', 'partyoutfit'],
    benchmarkHint: 'Waist-cinching proof + back-lacing detail + silhouette reveal la cong thuc an toan cho corset.',
  },
  {
    group: 'tops',
    value: 'tops_cami_tank_halter',
    label: 'Hai day / ba lo / halter',
    desc: 'Camisole, tank top, ao co yem',
    detailHint: 'Ao hai day lua, camisole, ao ba lo, ao co yem (halter top).',
    suggestedTypes: ['ootdmirror', 'outfitideas', 'streetstyle'],
    benchmarkHint: 'Mirror fitcheck + layering la cong thuc an toan de cho thay phom va cach phoi.',
  },
  {
    group: 'tops',
    value: 'tops_sweaters_cardigan',
    label: 'Ao len (Sweaters)',
    desc: 'Co lo, co tim, gile, cardigan',
    detailHint: 'Ao len co lo, co tim, ao len gile, cardigan.',
    suggestedTypes: ['outfitideas', 'luxury', 'boutiquefeed'],
    benchmarkHint: 'Tap trung vao chat lieu + layering de tao cam nhan premium va de ung dung.',
  },
  {
    group: 'tops',
    value: 'tops_hoodies_sweatshirts',
    label: 'Ao ni (Hoodies & Sweatshirts)',
    desc: 'Hoodie, sweater co tron, zip hoodie',
    detailHint: 'Ao hoodie co mu, sweater co tron, ao ni khoa keo.',
    suggestedTypes: ['streetstyle', 'haul', 'outfitideas'],
    benchmarkHint: 'Nhom nay hop montage nhanh + lifestyle urban de giu do social-native.',
  },
  {
    group: 'bottoms',
    value: 'bottoms_jeans',
    label: 'Quan jeans',
    desc: 'Flare, wide leg, skinny, straight, rach, baggy',
    detailHint: 'Jeans ong loe, ong rong, skinny, straight, jeans rach, baggy jeans.',
    suggestedTypes: ['streetstyle', 'outfitideas', 'tiktokshop'],
    benchmarkHint: 'Fit proof vung eo-hong-ong quan la yeu to quyet dinh conversion cho jeans.',
  },
  {
    group: 'bottoms',
    value: 'bottoms_trousers_fabric',
    label: 'Quan tay / quan vai',
    desc: 'Au cong so, ong suong, xep ly, lua',
    detailHint: 'Quan tay au cong so, ong suong, xep ly, quan lua.',
    suggestedTypes: ['outfitideas', 'styling', 'luxury'],
    benchmarkHint: 'Nen trinh bay theo boi canh cong so va smart-casual de tang kha nang mua ngay.',
  },
  {
    group: 'bottoms',
    value: 'bottoms_shorts',
    label: 'Quan shorts',
    desc: 'Jean, kaki, da, xep ly, shorts the thao',
    detailHint: 'Quan dui jean, shorts kaki, shorts da, shorts xep ly, shorts the thao.',
    suggestedTypes: ['streetstyle', 'outfitideas', 'tiktokshop'],
    benchmarkHint: 'Hook theo mua/he + boi canh ngoai troi se tang retention tot hon studio phang.',
  },
  {
    group: 'bottoms',
    value: 'bottoms_jogger_cargo_legging',
    label: 'Quan nang dong / khac',
    desc: 'Jogger, cargo, legging, tregging, quan lot long',
    detailHint: 'Quan jogger, cargo pants, legging, tregging, quan lot long (mua dong).',
    suggestedTypes: ['athleisure', 'streetstyle', 'outfitideas'],
    benchmarkHint: 'Neu co legging/active item, can co movement proof de thuyet phuc tinh thoai mai.',
  },
  {
    group: 'dresses',
    value: 'dresses_by_silhouette',
    label: 'Vay dam theo kieu dang',
    desc: 'A-line, suong, xoe, body, duoi ca, slip, tre vai, cup nguc',
    detailHint: 'Dam chu A, dam suong, dam xoe, dam body, dam duoi ca, slip dress, tre vai, cup nguc.',
    suggestedTypes: ['partyoutfit', 'boutiquefeed', 'ootd'],
    benchmarkHint: 'Silhouette reveal dau video + back/side proof la cong thuc on dinh cho nhom dam.',
  },
  {
    group: 'dresses',
    value: 'dresses_by_occasion',
    label: 'Vay dam theo hoan canh',
    desc: 'Cong so, da hoi/du tiec, dao pho, maxi di bien',
    detailHint: 'Dam cong so, dam da hoi/du tiec, dam dao pho, dam maxi di bien.',
    suggestedTypes: ['partyoutfit', 'tiktokshop', 'boutiquefeed'],
    benchmarkHint: 'Dat boi canh su dung ro rang (office, event, vacation) giup rut ngan quyet dinh mua.',
  },
  {
    group: 'dresses',
    value: 'dresses_by_material',
    label: 'Vay dam theo chat lieu',
    desc: 'Lua/satin, ren, voan, thun, nhung, tweed',
    detailHint: 'Dam lua/satin, ren, voan, thun, nhung, tweed.',
    suggestedTypes: ['boutiquefeed', 'tiktokshop', 'ootdmirror'],
    benchmarkHint: 'Nhom nay can close-up texture va drape movement de tang trust va giam hoan tra.',
  },
  {
    group: 'skirts',
    value: 'skirts_by_length',
    label: 'Chan vay theo do dai',
    desc: 'Mini, midi, maxi',
    detailHint: 'Chan vay mini, midi, maxi.',
    suggestedTypes: ['ootd', 'outfitideas', 'tiktokshop'],
    benchmarkHint: 'Can lock full-body framing de nguoi xem danh gia dung do dai va ti le tong the.',
  },
  {
    group: 'skirts',
    value: 'skirts_by_shape',
    label: 'Chan vay theo kieu dang',
    desc: 'A-line, xep ly, but chi, xoe, duoi ca, xe ta, tang',
    detailHint: 'Chan vay chu A, xep ly, but chi, xoe, duoi ca, xe ta, tang.',
    suggestedTypes: ['outfitideas', 'styling', 'boutiquefeed'],
    benchmarkHint: 'Noi dung phoi do theo 2-3 context se giup dang vay de ban hon dang review don le.',
  },
  {
    group: 'skirts',
    value: 'skirts_by_material',
    label: 'Chan vay theo chat lieu',
    desc: 'Jean, da, kaki, da/tweed',
    detailHint: 'Chan vay jean, da, kaki, da/tweed.',
    suggestedTypes: ['review', 'boutiquefeed', 'tiktokshop'],
    benchmarkHint: 'Material-led content (do day, form giu nep) thuong giam cart hesitation.',
  },
  {
    group: 'outerwear',
    value: 'outerwear_light_fall',
    label: 'Ao khoac nhe / thu dong',
    desc: 'Blazer, cardigan, denim jacket, biker, kaki',
    detailHint: 'Blazer, cardigan, denim jacket, biker jacket, ao khoac kaki.',
    suggestedTypes: ['streetstyle', 'outfitideas', 'styling'],
    benchmarkHint: 'Layering truoc-sau giup cho thay gia tri do da dung va kha nang phoi do.',
  },
  {
    group: 'outerwear',
    value: 'outerwear_winter',
    label: 'Ao khoac giu am / mua dong',
    desc: 'Ao da, phao, mang to trench, long, tran bong',
    detailHint: 'Ao khoac da, phao, mang to/trench coat, ao long, ao tran bong.',
    suggestedTypes: ['streetstyle', 'luxury', 'tiktokshop'],
    benchmarkHint: 'Nen show do day-chat va kha nang giu am bang movement + close-up chat lieu.',
  },
  {
    group: 'outerwear',
    value: 'outerwear_utility',
    label: 'Ao khoac khac',
    desc: 'Gio/chong nang/chong nuoc, varsity',
    detailHint: 'Ao khoac gio (chong nang/chong nuoc), varsity jacket.',
    suggestedTypes: ['streetstyle', 'haul', 'outfitideas'],
    benchmarkHint: 'Tinh nang utility nen duoc quay trong boi canh thuc te de tang trust.',
  },
  {
    group: 'loungewear_sleepwear',
    value: 'loungewear_home_sets',
    label: 'Bo mac nha',
    desc: 'Bo lua, bo dui, bo cotton, do ni mua dong',
    detailHint: 'Bo mac nha chat lua/dui/cotton va do ni mua dong.',
    suggestedTypes: ['grwm', 'review', 'tiktokshop'],
    benchmarkHint: 'Nhom comfort can nhan trai nghiem thuc te va do mem/thoang de thuyet phuc.',
  },
  {
    group: 'loungewear_sleepwear',
    value: 'loungewear_sleepwear',
    label: 'Do ngu',
    desc: 'Pijama tay dai/ngan, vay ngu lua/ren, ao choang ngu',
    detailHint: 'Pijama tay dai-ngan, vay ngu lua/ren, ao choang ngu.',
    suggestedTypes: ['grwm', 'boutiquefeed', 'tiktokshop'],
    benchmarkHint: 'Giup nguoi xem hinh dung use-case toi/du lich voi tone nhe va trust-first.',
  },
  {
    group: 'lingerie_swimwear',
    value: 'lingerie_core',
    label: 'Do lot (Lingerie)',
    desc: 'Bra, quan lot, shapewear, bralette',
    detailHint: 'Bra co gong/khong gong/mut dan, quan lot cotton/ren/khong vien, shapewear, bralette.',
    suggestedTypes: ['review', 'boutiquefeed', 'tiktokshop'],
    benchmarkHint: 'Can giu tone tinh te, thong tin practical (fit/support/material) va khong phan cam.',
  },
  {
    group: 'lingerie_swimwear',
    value: 'swimwear_core',
    label: 'Do boi (Swimwear)',
    desc: 'Bikini, monokini, rash guard, ao choang bien, sarong',
    detailHint: 'Bikini 2 manh, monokini 1 manh, do boi dai tay, ao choang di bien, sarong.',
    suggestedTypes: ['streetstyle', 'outfitideas', 'tiktokshop'],
    benchmarkHint: 'Boi canh beach/pool va movement nhe giup thuyet phuc ve fit va wearability.',
  },
  {
    group: 'activewear',
    value: 'activewear_apparel',
    label: 'Do tap (Activewear)',
    desc: 'Sports bra, ao tap, legging, shorts, seamless set',
    detailHint: 'Ao bra the thao, ao tap gym/yoga, legging, shorts the thao, seamless set.',
    suggestedTypes: ['athleisure', 'outfitideas', 'tiktokshop'],
    benchmarkHint: 'Movement comfort proof la bat buoc; tranh khung hinh tinh qua lau.',
  },
  {
    group: 'activewear',
    value: 'activewear_accessories',
    label: 'Phu kien tap',
    desc: 'Bang do, tat/vot chong truot',
    detailHint: 'Bang do, tat/vot the thao chong truot.',
    suggestedTypes: ['athleisure', 'review', 'tiktokshop'],
    benchmarkHint: 'Noi dung combo phu kien + outfit thuong co gia tri don hang cao hon.',
  },
  {
    group: 'traditional_festive',
    value: 'traditional_festive_wear',
    label: 'Trang phuc truyen thong & le hoi',
    desc: 'Ao dai, ao ba ba, yem cach tan, suon xam',
    detailHint: 'Ao dai truyen thong/cach tan, ao ba ba, yem cach tan, suon xam.',
    suggestedTypes: ['ootd', 'partyoutfit', 'streetstyle'],
    benchmarkHint: 'Can tap trung tinh van hoa + boi canh su kien de tao cam xuc va trust.',
  },
  {
    group: 'accessories_footwear',
    value: 'accessories_shoes',
    label: 'Giay dep',
    desc: 'Cao got, sneakers, sandal, dep bet, loafers, boot',
    detailHint: 'Giay cao got (nhon/vuong), sneakers, sandal, dep bet, loafers/oxfords, boot.',
    suggestedTypes: ['styling', 'outfitideas', 'tiktokshop'],
    benchmarkHint: 'Nhom nay nen quay full-look de chung minh de phoi va ton tong the outfit.',
  },
  {
    group: 'accessories_footwear',
    value: 'accessories_bags',
    label: 'Tui xach',
    desc: 'Baguette, deo cheo, tote, ba lo, clutch',
    detailHint: 'Tui kep nach (baguette), tui deo cheo, tote, ba lo thoi trang, clutch.',
    suggestedTypes: ['styling', 'boutiquefeed', 'tiktokshop'],
    benchmarkHint: 'Close-up khoang tui + strap + material la diem quyet dinh mua cho nhom bag.',
  },
  {
    group: 'accessories_footwear',
    value: 'accessories_addons',
    label: 'Phu kien khac',
    desc: 'Mu/non, kinh mat, that lung, khan, toc, trang suc',
    detailHint: 'Mu/non, kinh mat, that lung, khan choang (lua/len), kep toc/no, trang suc thoi trang.',
    suggestedTypes: ['styling', 'grwm', 'tiktokshop'],
    benchmarkHint: 'Nen lam clip combo phu kien theo mood/case de tang save va add-to-cart.',
  },
]

const PRODUCT_CATEGORY_GROUP_VALUES = PRODUCT_CATEGORY_GROUP_OPTIONS.map((item) => item.value) as ProductCategoryGroup[]
const PRODUCT_CATEGORY_VALUES = PRODUCT_CATEGORY_OPTIONS.map((item) => item.value) as ProductCategory[]
const LEGACY_PRODUCT_CATEGORY_ALIASES: Record<string, ProductCategory> = {
  dam_tiec: 'dresses_by_occasion',
  dam_lua_body: 'dresses_by_material',
  set_di_bien: 'swimwear_core',
  set_phoi_do_hang_ngay: 'tops_tshirt',
  do_tap_athleisure: 'activewear_apparel',
}

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

const TIKTOK_HARD_BLOCKED_BACKGROUND_KEYWORDS = [
  'minimalist high end white studio background',
  'minimalist high-end white studio background',
  'white studio background',
  'plain white background',
  'solid color background',
  'solid-colour background',
  'blank background',
  'plain background',
  'seamless white backdrop',
  'seamless background',
  'cyclorama',
  'infinity wall',
  'infinite white background',
  'empty white set',
  'background only',
  'nen trang tron',
  'nen tron',
  'phong nen tron',
  'backdrop tron',
] as const

const TIKTOK_SOFT_BLOCKED_BACKGROUND_KEYWORDS = [
  'clean backdrop',
  'minimalist backdrop',
  'empty backdrop',
  'simple backdrop',
  'blank wall background',
  'gradient backdrop',
] as const

const TIKTOK_CONTEXTUAL_LOCATION_CUES = [
  'studio corner',
  'textured wall',
  'wall texture',
  'set design',
  'clothing rack',
  'rack',
  'stool',
  'chair',
  'shelf',
  'plant',
  'mirror',
  'fitting room',
  'showroom',
  'cafe',
  'street',
  'market',
  'plaza',
  'park',
  'rooftop',
  'hotel',
] as const

const TIKTOK_OBSERVED_SIGNAL_BASELINE = `- OOTD cluster is strong and broad (#ootd ~66.3M, #outfitideas ~24M, #fitcheck ~10.2M).
- GRWM cluster is mainstream (#grwm ~23M) with strong alias behavior (#getreadywithme ~3.4M).
- Mirror-specific internal labels are weak (#ootdmirror ~1.2K), so natural outputs should anchor to #fitcheck / #mirrorselfie / #ootd language.
- TikTok Shop + proof content is high-adoption (#tiktokshop ~123.6M, #review ~16.6M, #unboxing ~17.7M).
- FYP is too broad (#fyp ~8.7B) and should be secondary only, never the core fashion narrative.
- Occasion-wear clusters are healthier with Vietnamese tags (#vayditiec ~243K, #damditiec ~119K) than literal #partyoutfit (~106.1K).
- Sample pattern from provided @tuyetmia204 links: short women-fashion clips (11-20s), minimal caption style (#mia #thoitrangnu), and daylight aura-first framing.`

const TIKTOK_FIT_MODEL_SIGNAL_BASELINE = `- Fit-model proof cluster is strong: #fitcheck ~10.2M, #ootd ~66.3M, #outfitideas ~24M, #outfitinspo ~15.8M.
- Mirror-specific social proof remains meaningful via #mirrorselfie ~439K, while #ootdmirror is niche (~1.2K).
- Commerce-heavy proof context is massive: #tiktokshop ~123.6M and #review ~16.6M.
- Implication: fit-model framing should be locked by content type, not treated as one global framing style.`

const BOUTIQUE_FEED_CHANNEL_BENCHMARK = `- Channel snapshot (@anvy.boutique): 186.7K followers, 2.6M likes, with multiple pinned videos in 2.6M-3.2M views.
- Channel snapshot (@damitas_boutiquee): 87.3K followers, 392.6K likes, profile positioning as girls-fashion boutique.
- Channel snapshot (@vyboutique225): 44.9K followers, 1.1M likes, boutique-style conversion feed cadence.
- Channel snapshot (@any_boutique.gt): 33.6K followers, 522.5K likes, SHEIN-import boutique positioning and haul-style commerce framing.
- Video-caption evidence (direct scrape from @anvy.boutique): #damxinh #damtiec #damlua #damthietke #setxinh #thoitranghottrend #goclamdep #xuhuong #anvyboutique.
- Recurring caption behavior: short emotional hook + emoji stack, then concentrated hashtag bundle.
- High-performing narrative: immediate silhouette reveal, fit/tone-up proof (hack eo/ton dang), material cue, then concise verdict.
- Trust pattern: practical first-person review framing (real experience, no hard-sell wall of CTA) while maintaining clear purchase intent.`

const NATURALITY_PROMPT_GUARDRAILS = `- Prefer creator-native language and believable social behavior over ad-like perfection.
- Avoid robotic sequencing terms ("Step 1", "Step 2", "Objective achieved", "conversion beat").
- Use lived-in micro-actions: outfit adjustment, natural pause, glance, weight shift, fabric touch, candid walkback.
- Keep transitions motivated by body movement and camera follow, not mechanical choreography.
- Keep tone conversational, practical, and trust-first; avoid over-scripted cinematic jargon in every line.`

const HAND_ANATOMY_GUARDRAILS = `- Hand anatomy consistency is mandatory: exactly two hands, five fingers per hand, natural finger spacing.
- Avoid hand artifacts: no fused fingers, missing fingers, extra fingers, duplicated palms, broken wrists, or impossible hand orientation.
- For mirror fitcheck turns (especially three-quarter-left <-> three-quarter-right pivots), keep arm trajectories continuous and physically plausible.
- Keep hands visible and slightly separated from torso/skirt edges to reduce reflection occlusion artifacts.
- If one hand interacts with footwear or hemline, keep the other hand relaxed and anatomically clear.`

const OOTDMIRROR_REAR_MIRROR_GUARDRAILS = `- Applies only when resolved content type is OOTDMIRROR.
- Use an observer camera placed in front of the model (camera-facing model), not a selfie POV.
- The mirror must be behind the model and used to capture full-body outfit reflection.
- Face orientation lock: keep the face oriented front toward camera in every beat.
- Body orientation lock: allow only gentle three-quarter-left or three-quarter-right body angles.
- Never use full back-facing body orientation.
- The model must not hold any phone/camera/recording device; both hands stay free for natural posing.
- Never show camera, tripod, operator, or recording gear in the mirror reflection.`

const VEO_INTERPOLATION_GUARDRAILS = `- First/last-frame interpolation must use micro-progression between adjacent keyframes (small pose delta, no sudden body jump).
- Keep one dominant camera movement per 8s scene; the only allowed hybrid motion is "Dolly in zoom out" or "Dolly out zoom in".
- Preserve camera axis and movement direction across adjacent scenes unless an explicit turn-around beat is written.
- Avoid discontinuity terms such as teleport, jump cut, hard cut, instant morph, abrupt switch.
- Keep subject, action, camera, composition, and ambiance explicit for each keyframe/scene prompt.
- CONSECUTIVE KEYFRAME FACING LOCK (DEFAULT): Adjacent keyframes should not repeat the same body direction; include visible turn/pivot intent.
- DETAIL-SENSITIVE GARMENT EXCEPTION: for complex garments (backless/strappy/multi-strap/lace-up details), allow stable facing hold for 2-3 adjacent keyframes and avoid forced 360-degree direction cycling.
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

const SCENE_CAMERA_POSITION_OPTIONS = [
  'Center',
  'Left',
  'Right',
  'High',
  'Low',
  'Closer',
  'Further',
] as const

type SceneCameraPositionOption = typeof SCENE_CAMERA_POSITION_OPTIONS[number]

const SCENE_CAMERA_MOTION_OPTIONS = [
  'Dolly in',
  'Dolly out',
  'Orbit left',
  'Orbit right',
  'Orbit up',
  'Orbit low',
  'Dolly in zoom out',
  'Dolly out zoom in',
] as const

type SceneCameraMotionOption = typeof SCENE_CAMERA_MOTION_OPTIONS[number]

const SCENE_CAMERA_HYBRID_MOTION_OPTIONS: readonly SceneCameraMotionOption[] = [
  'Dolly in zoom out',
  'Dolly out zoom in',
] as const

const DEFAULT_SCENE_CAMERA_POSITION: SceneCameraPositionOption = 'Center'
const DEFAULT_SCENE_CAMERA_MOTION: SceneCameraMotionOption = 'Dolly in'

const SCENE_CAMERA_MOVEMENT_PROMPT_RULES = `- scenes[i].cameraMovement must start with: Position: <Camera Position> | Motion: <Camera Motion>.
- Allowed Camera Position: ${SCENE_CAMERA_POSITION_OPTIONS.join(' | ')}.
- Allowed Camera Motion: ${SCENE_CAMERA_MOTION_OPTIONS.join(' | ')}.
- If needed, append one short sentence after the structured prefix for pacing/detail notes.`

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

type ConcreteFacingDirection = Exclude<KeyframeFacingDirection, 'unknown'>
type OotdMirrorFacingDirection = Extract<ConcreteFacingDirection, 'three-quarter-left' | 'three-quarter-right'>

const RULE32_FACING_SEQUENCE: readonly ConcreteFacingDirection[] = [
  'front',
  'three-quarter-left',
  'back',
  'three-quarter-right',
  'left',
  'right',
] as const

const LONG_DURATION_FACING_SEQUENCE: readonly ConcreteFacingDirection[] = [
  'front',
  'three-quarter-left',
  'front',
  'three-quarter-right',
  'left',
  'front',
  'right',
] as const

const DETAIL_SENSITIVE_FACING_SEQUENCE: readonly ConcreteFacingDirection[] = [
  'front',
  'three-quarter-left',
  'front',
  'three-quarter-right',
] as const

const OOTD_FREESTYLE_REVIEW_FACING_SEQUENCE: readonly ConcreteFacingDirection[] = [
  'front',
  'three-quarter-left',
  'left',
  'three-quarter-right',
  'right',
  'front',
  'back',
] as const

const DETAIL_SENSITIVE_PRODUCT_CATEGORY_PREFIXES = [
  'dresses_',
  'skirts_',
  'lingerie_',
  'swimwear_',
] as const

const DETAIL_SENSITIVE_PRODUCT_CATEGORY_VALUES = [
  'tops_cami_tank_halter',
  'dresses_by_silhouette',
  'dresses_by_occasion',
  'dresses_by_material',
  'skirts_by_length',
  'skirts_by_shape',
  'skirts_by_material',
  'lingerie_core',
  'swimwear_core',
] as const

const DETAIL_SENSITIVE_GARMENT_KEYWORDS = [
  'backless',
  'open back',
  'deep back',
  'low back',
  'strappy',
  'multi strap',
  'thin strap',
  'spaghetti strap',
  'halter',
  'lace up back',
  'tie back',
  'cross back',
  'cut out back',
  'cutout back',
  'corset lace',
  'bow back',
  'ho lung',
  'nhieu day',
  'day mong',
  'day cheo',
] as const

type ContentStyleLock = 'mirror' | 'studio' | 'flex'
type FitModelRuleLock = 'strict_full_body' | 'majority_full_body' | 'balanced_full_body_proof'

const FIT_MODEL_RULE_LOCK_BY_CONTENT_TYPE: Record<ResolvedContentType, FitModelRuleLock> = {
  ootd: 'majority_full_body',
  ootdmirror: 'strict_full_body',
  grwm: 'balanced_full_body_proof',
  outfitideas: 'majority_full_body',
  fyp: 'balanced_full_body_proof',
  review: 'balanced_full_body_proof',
  tiktokshop: 'balanced_full_body_proof',
  boutiquefeed: 'majority_full_body',
  athleisure: 'majority_full_body',
  haul: 'balanced_full_body_proof',
  styling: 'majority_full_body',
  luxury: 'majority_full_body',
  streetstyle: 'majority_full_body',
  sunnyaura: 'majority_full_body',
  partyoutfit: 'strict_full_body',
}

const FIT_MODEL_FULL_BODY_KEYWORDS = [
  'full body',
  'full-body',
  'head to toe',
  'head-to-toe',
  'whole body',
  'full look',
  'full outfit',
  'full-frame outfit',
  'frame-filling full body',
  'occupies most of frame',
  'full silhouette',
  'full outfit readability',
  'silhouette readability',
  'hemline and footwear',
  'mirror full body',
  'mirror full-body',
] as const

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
  boutiquefeed: 'Blend boutique-style social proof with trust-first real-experience review language, concise hook captions, and fit/material verification for conversion.',
  athleisure: 'Show movement comfort and styling versatility from active to casual settings, tied to practical purchase value.',
  haul: 'Showcase variety and excitement with clear piece-by-piece value, fit proof, and purchasing motivation.',
  styling: 'Teach actionable styling transformations that position the product as a high-utility wardrobe solution.',
  luxury: 'Communicate premium quality, silhouette precision, and refined aspirational value that justifies purchase.',
  streetstyle: 'Leverage authentic outdoor urban energy to showcase outfit wearability in real daily-life contexts, driving relatable purchase motivation.',
  sunnyaura: 'Emphasize natural sunlight aura and wearable outfit readability with short-form creator-native pacing and soft conversion intent.',
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
  boutiquefeed: [
    { name: 'BOUTIQUE HOOK REVEAL', emoji: '✨', cameraHint: 'Fast full-body reveal in mirror or showroom framing with immediate silhouette readability' },
    { name: 'HACK-DANG FIT PROOF', emoji: '👗', cameraHint: 'Mid-to-close framing proving waistline shaping and body-flattering fit cues' },
    { name: 'MATERIAL DETAIL CHECK', emoji: '🧵', cameraHint: 'Texture close-up on fabric, stitching, and drape while preserving full-look continuity' },
    { name: 'REAL EXPERIENCE VERDICT', emoji: '✅', cameraHint: 'Natural creator-style reaction beat with practical wearability cues' },
    { name: 'HASHTAG-READY POSE', emoji: '💫', cameraHint: 'Short confidence pose transition optimized for social feed retention' },
    { name: 'TRUST-FIRST CLOSER', emoji: '🎬', cameraHint: 'Clean final boutique frame with product readability and recommendation-ready mood' },
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
  sunnyaura: [
    { name: 'SUNLIGHT HOOK REVEAL', emoji: '☀️', cameraHint: 'Open with a direct sunlight hit on the full outfit, plus one short on-screen text hook in the first 1-2 seconds' },
    { name: 'GOLDEN DETAIL CHECK', emoji: '✨', cameraHint: 'Short push-in to highlight fabric texture and silhouette under warm daylight' },
    { name: 'NATURAL WALK FLOW', emoji: '🚶‍♀️', cameraHint: 'Smooth tracking movement with relaxed creator-style walk and outfit readability' },
    { name: 'LIGHT-SHIFT MOMENT', emoji: '🌤️', cameraHint: 'Shift angle to catch changing natural light across face and garment details' },
    { name: 'AURA HOLD FRAME', emoji: '💫', cameraHint: 'Brief stable pose to lock sunlit glow and save-worthy composition' },
    { name: 'SOFT CONFIDENCE CLOSER', emoji: '🎬', cameraHint: 'Clean natural close with warm daylight, no hard-sell gesture, full look still readable' },
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
    boutiquefeed: 'Vietnamese boutique feed aesthetic, trust-first real-experience review tone, concise emotional hook, and product-proof-first framing',
    athleisure: 'Urban sporty-chic lifestyle, gym-to-café casual confidence',
    haul: 'Excited energetic unboxing aesthetic, approachable and relatable',
    styling: 'Expert fashion advisor aesthetic, polished and informative',
    luxury: 'Old money aesthetic, understated elegance, timeless sophistication',
    streetstyle: 'Outdoor urban candid aesthetic, natural movement, real-world street fashion energy',
    sunnyaura: 'Natural daylight aura aesthetic, warm sunlit glow, short-form social-native confidence framing',
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
    boutiquefeed: 'Boutique Feed — social-native boutique review style with fit proof, material check, and trust-first recommendation cadence',
    athleisure: 'Athleisure — gym-to-café styling combining sportswear with casual sophistication',
    haul: 'Haul Showcase — collection display with multiple outfit combinations',
    styling: 'Fashion Styling Guide — showcase expert outfit coordination and versatility',
    luxury: 'Luxury / Old Money — timeless sophisticated style with understated elegance',
    streetstyle: 'Street Style — outdoor urban candid walk showcasing outfit in real-world daily-life settings',
    sunnyaura: 'Sunny Aura — short daylight vibe clip with warm sunlight glow and natural fashion confidence',
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
  contentType === 'boutiquefeed' ? 'Vietnamese boutique feed vibe: trust-first review framing, practical fit/material proof, and concise social-native persuasion.' :
  contentType === 'ootdmirror' ? 'Mirror fitcheck social-native framing with strong head-to-toe outfit readability and trust cues.' :
  contentType === 'outfitideas' ? 'Lookbook inspiration style with practical daily styling guidance.' :
  contentType === 'review' ? 'Authentic and trustworthy feel.' :
  contentType === 'luxury' ? 'Understated elegance, refined luxury presentation.' :
  contentType === 'athleisure' ? 'Urban sporty-chic, approachable lifestyle.' :
  contentType === 'haul' ? 'Energetic and approachable showcase.' :
  contentType === 'streetstyle' ? 'Outdoor urban candid fashion — natural golden-hour or daylight, street backdrop, authentic movement.' :
  contentType === 'sunnyaura' ? 'Natural daylight aura aesthetic — short social-native fashion moments, sunlight glow, and wearable real-life vibe.' :
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

function resolveLookbookImageContentType(contentType: ContentType): ResolvedContentType {
  if (contentType === 'auto' || contentType === 'fyp') {
    return 'outfitideas'
  }

  return contentType as ResolvedContentType
}

function buildLookbookImageOnlyPrompt(
  contentType: ResolvedContentType,
  notes: string,
  aspectRatio: '9:16' | '16:9',
  styleTone: LookbookStyleTone = 'standard',
  theme: LookbookTheme = 'auto',
  poseDirectionLock: LookbookPoseDirectionLock = 'auto',
): string {
  const videoReferenceLine = 'CRITICAL: This image will be used as a reference for Veo 3.1 video generation. Ensure consistent proportions and realistic rendering suitable for frame-by-frame animation.'
  const lookbookReferenceLine = 'CRITICAL: This is the final standalone lookbook image output. Do not include video timeline, keyframe, scene, or interpolation instructions.'
  const styleToneLine = styleTone === 'sexy'
    ? '[STYLE TONE]: Tasteful sexy fashion vibe only (confident, body-flattering, elegant). No nudity, no explicit sexual content, no fetish framing, and no provocative camera focus on private body areas.'
    : '[STYLE TONE]: Clean lookbook vibe with practical outfit readability and polished styling.'
  const themeOption = getLookbookThemeOption(theme)
  const themeLine = theme === 'auto'
    ? '[LOOKBOOK THEME]: Auto balanced social-native lookbook context.'
    : `[LOOKBOOK THEME]: ${themeOption.label}. ${themeOption.promptHint}`
  const poseDirectionLine = poseDirectionLock === 'auto'
    ? '[POSE DIRECTION LOCK]: Auto rotation by frame to keep visual variety.'
    : `[POSE DIRECTION LOCK]: ${poseDirectionLock}. Keep the same body-facing direction for all generated lookbook frames.`

  const basePrompt = buildCreateImagePrompt(contentType, notes)
  const normalizedBase = basePrompt.includes(videoReferenceLine)
    ? basePrompt.replace(videoReferenceLine, lookbookReferenceLine)
    : `${basePrompt}\n\n${lookbookReferenceLine}`

  return `${normalizedBase}\n[LAYOUT OVERRIDE]: Use a single-frame composition only. Never use split-screen.`
    + `\n${styleToneLine}`
    + `\n${themeLine}`
    + `\n${poseDirectionLine}`
    + `\n[TARGET ASPECT RATIO]: ${aspectRatio}`
}

function ensureLookbookAspectRatioTag(prompt: string, aspectRatio: '9:16' | '16:9'): string {
  return prompt.toLowerCase().includes(aspectRatio.toLowerCase())
    ? prompt
    : `${prompt}\n[TARGET ASPECT RATIO]: ${aspectRatio}`
}

function normalizeLookbookImageCount(value: unknown, fallback: LookbookImageCount = DEFAULT_LOOKBOOK_IMAGE_COUNT): LookbookImageCount {
  const numeric = Number(value)
  if (numeric === 5 || numeric === 10 || numeric === 20) {
    return numeric as LookbookImageCount
  }
  return fallback
}

function normalizeLookbookStyleTone(value: unknown, fallback: LookbookStyleTone = 'standard'): LookbookStyleTone {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return normalized === 'sexy' ? 'sexy' : fallback
}

function normalizeLookbookTheme(value: unknown, fallback: LookbookTheme = 'auto'): LookbookTheme {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return LOOKBOOK_THEME_VALUES.includes(normalized as LookbookTheme)
    ? normalized as LookbookTheme
    : fallback
}

function normalizeLookbookPoseDirectionLock(
  value: unknown,
  fallback: LookbookPoseDirectionLock = 'auto',
): LookbookPoseDirectionLock {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return LOOKBOOK_POSE_DIRECTION_LOCK_VALUES.includes(normalized as LookbookPoseDirectionLock)
    ? normalized as LookbookPoseDirectionLock
    : fallback
}

function getLookbookThemeOption(theme: LookbookTheme) {
  return LOOKBOOK_THEME_OPTIONS.find((item) => item.value === theme) || LOOKBOOK_THEME_OPTIONS[0]
}

function getLookbookThemeLocationFallback(theme: LookbookTheme, index: number): string {
  if (theme === 'auto') {
    return LOOKBOOK_NATURAL_LOCATION_FALLBACKS[index % LOOKBOOK_NATURAL_LOCATION_FALLBACKS.length]
  }

  const themedPool = LOOKBOOK_THEME_LOCATION_FALLBACKS[theme]
  if (!themedPool || themedPool.length === 0) {
    return LOOKBOOK_NATURAL_LOCATION_FALLBACKS[index % LOOKBOOK_NATURAL_LOCATION_FALLBACKS.length]
  }

  return themedPool[index % themedPool.length]
}

function resolveLookbookPoseDirection(
  index: number,
  poseDirectionLock: LookbookPoseDirectionLock,
): PromptFacingDirection {
  if (poseDirectionLock !== 'auto') {
    return poseDirectionLock
  }

  return LOOKBOOK_NANO_BANANA_FACING_SEQUENCE[index % LOOKBOOK_NANO_BANANA_FACING_SEQUENCE.length]
}

function appendPoseDirectionLockHint(
  action: string,
  poseDirectionLock: LookbookPoseDirectionLock,
): string {
  if (poseDirectionLock === 'auto') {
    return action
  }

  return appendSentenceIfMissing(
    action,
    `Pose direction lock active: keep body ${poseDirectionLock}-facing for this lookbook frame.`,
  )
}

function normalizeProductCategoryGroup(value: unknown, fallback: ProductCategoryGroup = 'all'): ProductCategoryGroup {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return PRODUCT_CATEGORY_GROUP_VALUES.includes(normalized as ProductCategoryGroup)
    ? normalized as ProductCategoryGroup
    : fallback
}

function normalizeProductCategory(value: unknown, fallback: ProductCategory = 'auto'): ProductCategory {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  const remapped = LEGACY_PRODUCT_CATEGORY_ALIASES[normalized] || normalized
  return PRODUCT_CATEGORY_VALUES.includes(remapped as ProductCategory)
    ? remapped as ProductCategory
    : fallback
}

function coerceLookbookImageCountFromLength(length: number): LookbookImageCount {
  if (length >= 20) return 20
  if (length >= 10) return 10
  return 5
}

function normalizeLookbookFacingDirection(
  value: unknown,
  fallback: PromptFacingDirection,
): PromptFacingDirection {
  const parsed = normalizeFacingDirectionToken(value)
  if (parsed !== 'unknown') {
    return parsed
  }
  return fallback
}

function buildDefaultFrameSubject(aspectRatio: string): string {
  return `Create image ${aspectRatio} no split-screen. Faithful character face and body outfit likeness image reference.`
}

function stripPromptFieldPrefix(value: string, labels: readonly string[]): string {
  let next = value.trim()
  if (!next) return next

  const escapedLabels = labels
    .map((label) => label.trim())
    .filter((label) => label.length > 0)
    .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (escapedLabels.length === 0) return next

  const fieldPrefixPattern = new RegExp(`^(?:${escapedLabels.join('|')})\\s*:\\s*`, 'i')
  while (fieldPrefixPattern.test(next)) {
    next = next.replace(fieldPrefixPattern, '').trim()
  }

  return next
}

function buildNanoBananaProFramePrompt(input: {
  subject: string
  action: string
  facingDirection: PromptFacingDirection
  location: string
  camera: string
  lighting: string
  style: string
  aspectRatio: string
}): string {
  const subject = stripPromptFieldPrefix(input.subject, ['SUBJECT'])
  const action = stripPromptFieldPrefix(input.action, ['ACTION'])
  const facing = stripPromptFieldPrefix(input.facingDirection, ['FACING', 'FACING DIRECTION'])
  const location = stripPromptFieldPrefix(input.location, ['LOCATION'])
  const camera = stripPromptFieldPrefix(input.camera, ['CAMERA'])
  const lighting = stripPromptFieldPrefix(input.lighting, ['LIGHTING'])
  const style = stripPromptFieldPrefix(input.style, ['STYLE'])
  const aspectRatio = stripPromptFieldPrefix(input.aspectRatio, ['ASPECT RATIO', 'ASPECT-RATIO'])

  return `SUBJECT: ${subject}
ACTION: ${action}
FACING: ${facing}
LOCATION: ${location}
CAMERA: ${camera}
LIGHTING: ${lighting}
STYLE: ${style}
ASPECT RATIO: ${aspectRatio}`
}

const KEYFRAME_COPY_SAFETY_RULES = [
  'Không được lộ trong ảnh "thiết bị CAMERA, đèn chiếu, Khắc Sáng".',
  'Không có text note trong ảnh.',
] as const

function appendKeyframeCopySafetyRule(prompt: string): string {
  const base = prompt.trim()
  const normalizedBase = normalizeLocationKey(base)
  const missingRules = KEYFRAME_COPY_SAFETY_RULES.filter((rule) => {
    const normalizedRule = normalizeLocationKey(rule)
    return normalizedRule.length > 0 && !normalizedBase.includes(normalizedRule)
  })

  if (base.length === 0) {
    return missingRules.join('\n')
  }

  if (missingRules.length === 0) {
    return base
  }

  return `${base}\n${missingRules.join('\n')}`
}

function buildLookbookPrimaryLocationFallback(_contentType: ResolvedContentType): string {
  return getLockedLocationFallback('flex')
}

function ensureLookbookNanoBananaPrompt(
  rawPrompt: string,
  frame: {
    subject: string
    action: string
    facingDirection: PromptFacingDirection
    location: string
    camera: string
    lighting: string
    style: string
  },
  aspectRatio: '9:16' | '16:9',
): string {
  const normalizedRaw = (rawPrompt || '').trim()
  const extractLineValue = (label: string): string => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(?:^|\\n)\\s*${escaped}\\s*:\\s*([^\\n]+)`, 'i')
    const matched = normalizedRaw.match(pattern)
    return matched?.[1]?.trim() || ''
  }

  // Keep lookbook SUBJECT deterministic for downstream image models.
  const subject = buildDefaultFrameSubject(aspectRatio)
  const action = frame.action || extractLineValue('ACTION')
  const facingDirection = normalizeLookbookFacingDirection(
    frame.facingDirection || extractLineValue('FACING') || extractLineValue('FACING DIRECTION'),
    frame.facingDirection,
  )
  const location = frame.location || extractLineValue('LOCATION')
  const camera = frame.camera || extractLineValue('CAMERA')
  const lighting = frame.lighting || extractLineValue('LIGHTING')
  const style = frame.style || extractLineValue('STYLE')

  return buildNanoBananaProFramePrompt({
    subject,
    action,
    facingDirection,
    location,
    camera,
    lighting,
    style,
    aspectRatio,
  })
}

function buildLookbookImagePromptSet(
  contentType: ResolvedContentType,
  notes: string,
  aspectRatio: '9:16' | '16:9',
  imageCount: LookbookImageCount,
  styleTone: LookbookStyleTone,
  theme: LookbookTheme = 'auto',
  poseDirectionLock: LookbookPoseDirectionLock = 'auto',
): LookbookImagePrompt[] {
  const prompts: LookbookImagePrompt[] = []
  const baseLocationFallback = buildLookbookPrimaryLocationFallback(contentType)
  const trimmedNotes = notes.trim()
  const themeOption = getLookbookThemeOption(theme)

  for (let i = 0; i < imageCount; i += 1) {
    const blueprint = LOOKBOOK_SHOT_BLUEPRINTS[i % LOOKBOOK_SHOT_BLUEPRINTS.length]
    const cycle = Math.floor(i / LOOKBOOK_SHOT_BLUEPRINTS.length) + 1
    const variationSuffix = cycle > 1 ? ` v${cycle}` : ''
    const variationDirective = cycle > 1
      ? `[SHOT VARIATION]: Variation ${cycle}. Change pose/camera angle/background mood while preserving exact face and garment identity.`
      : ''
    const facingDirection = resolveLookbookPoseDirection(i, poseDirectionLock)
    const location = getLookbookThemeLocationFallback(theme, i) || baseLocationFallback
    const subject = buildDefaultFrameSubject(aspectRatio)
    const action = variationDirective
      ? `${blueprint.directive} Variation ${cycle}: change pose/camera/background mood while preserving exact identity and garment details.`
      : blueprint.directive
    let resolvedAction = trimmedNotes.length > 0
      ? appendSentenceIfMissing(action, `Creative notes: ${trimmedNotes}`)
      : action
    resolvedAction = appendSentenceIfMissing(resolvedAction, themeOption.promptHint)
    resolvedAction = appendPoseDirectionLockHint(resolvedAction, poseDirectionLock)

    const baseCamera = cycle > 1
      ? 'Fresh camera angle variation with stable axis, conversion-first garment readability, no split-screen.'
      : 'Fashion editorial camera framing with stable axis, full outfit readability, and realistic proportions.'
    const camera = theme === 'party_night'
      ? appendSentenceIfMissing(baseCamera, 'Keep elegant nightlife framing with premium venue depth and polished highlights.')
      : theme === 'office_chic'
        ? appendSentenceIfMissing(baseCamera, 'Keep polished office-chic framing with clean architectural lines and composed posture cues.')
        : baseCamera
    const lighting = styleTone === 'sexy'
      ? 'Tasteful contour lighting with soft key and clean fill, body lines elegant and non-explicit.'
      : theme === 'party_night'
        ? 'Elegant evening lighting with soft highlights and clean garment detail readability.'
        : theme === 'vacation_resort'
          ? 'Bright airy daylight with clean skin tone rendering and realistic vacation atmosphere.'
          : 'Clean editorial soft lighting prioritizing texture clarity and product detail readability.'
    const baseStyle = styleTone === 'sexy'
      ? 'Tasteful sexy fashion editorial, classy confidence, non-explicit social-native lookbook.'
      : 'Classic social-native lookbook editorial with practical styling clarity and trust-first realism.'
    const style = theme === 'auto'
      ? baseStyle
      : appendSentenceIfMissing(baseStyle, themeOption.styleHint)

    prompts.push({
      index: i,
      title: `${blueprint.title}${variationSuffix}`,
      purpose: blueprint.purpose,
      subject,
      action: resolvedAction,
      facingDirection,
      location,
      camera,
      lighting,
      style,
      prompt: ensureLookbookNanoBananaPrompt(
        '',
        {
          subject,
          action: resolvedAction,
          facingDirection,
          location,
          camera,
          lighting,
          style,
        },
        aspectRatio,
      ),
    })
  }

  return prompts
}

function normalizeLookbookImagePromptList(
  value: unknown,
  fallback: LookbookImagePrompt[],
  aspectRatio: '9:16' | '16:9',
  imageCount: LookbookImageCount,
  styleTone: LookbookStyleTone = 'standard',
  theme: LookbookTheme = 'auto',
  poseDirectionLock: LookbookPoseDirectionLock = 'auto',
): LookbookImagePrompt[] {
  const themeOption = getLookbookThemeOption(theme)
  const defaultStyleByTone = styleTone === 'sexy'
    ? 'Tasteful sexy fashion editorial, classy confidence, non-explicit social-native lookbook.'
    : 'Classic social-native lookbook editorial with practical styling clarity and trust-first realism.'
  const defaultLocationByTheme = getLookbookThemeLocationFallback(theme, 0)
  const defaultFallback: LookbookImagePrompt = {
    index: 0,
    title: 'Lookbook Hero Frame',
    purpose: 'Primary hero frame for lookbook output',
    subject: buildDefaultFrameSubject(aspectRatio),
    action: 'Front-facing hero pose with clear outfit readability and realistic posture.',
    facingDirection: resolveLookbookPoseDirection(0, poseDirectionLock),
    location: defaultLocationByTheme,
    camera: 'Fashion editorial camera framing, stable axis, realistic proportions.',
    lighting: 'Clean editorial soft lighting with texture clarity.',
    style: theme === 'auto' ? defaultStyleByTone : appendSentenceIfMissing(defaultStyleByTone, themeOption.styleHint),
    prompt: '',
  }
  const safeFallback = fallback.length > 0 ? fallback : [defaultFallback]
  const normalizeFromFallback = (item: LookbookImagePrompt, index: number): LookbookImagePrompt => {
    const shotPurpose = item.purpose?.trim() || defaultFallback.purpose
    const subject = buildDefaultFrameSubject(aspectRatio)
    const actionBase = item.action?.trim() || shotPurpose
    const action = appendPoseDirectionLockHint(actionBase, poseDirectionLock)
    const fallbackFacing = resolveLookbookPoseDirection(index, poseDirectionLock)
    const parsedFacingDirection = normalizeLookbookFacingDirection(item.facingDirection, fallbackFacing)
    const facingDirection = poseDirectionLock === 'auto' ? parsedFacingDirection : poseDirectionLock
    const fallbackLocation = getLookbookThemeLocationFallback(theme, index) || defaultFallback.location || getLockedLocationFallback('flex', index)
    const location = resolveLockedLocationEntry(item.location?.trim() || '') || fallbackLocation
    const camera = item.camera?.trim() || defaultFallback.camera || ''
    const lighting = item.lighting?.trim() || defaultFallback.lighting || ''
    const styleBase = item.style?.trim() || defaultFallback.style || ''
    const style = theme === 'auto' ? styleBase : appendSentenceIfMissing(styleBase, themeOption.styleHint)

    return {
      ...item,
      index,
      title: item.title?.trim() || defaultFallback.title,
      purpose: shotPurpose,
      subject,
      action,
      facingDirection,
      location,
      camera,
      lighting,
      style,
      prompt: ensureLookbookNanoBananaPrompt(
        item.prompt || '',
        {
          subject,
          action,
          facingDirection,
          location,
          camera,
          lighting,
          style,
        },
        aspectRatio,
      ),
    }
  }

  if (!Array.isArray(value)) {
    return safeFallback
      .slice(0, imageCount)
      .map((item, index) => normalizeFromFallback(item, index))
  }

  const normalized = value
    .map((item, index): LookbookImagePrompt | null => {
      const fallbackItem = normalizeFromFallback(
        safeFallback[index % safeFallback.length],
        index,
      )

      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }

      const record = item as Record<string, unknown>
      const title = typeof record.title === 'string' && record.title.trim().length > 0
        ? record.title.trim()
        : fallbackItem.title
      const purpose = typeof record.purpose === 'string' && record.purpose.trim().length > 0
        ? record.purpose.trim()
        : fallbackItem.purpose
      const subject = buildDefaultFrameSubject(aspectRatio)
      const actionBase = typeof record.action === 'string' && record.action.trim().length > 0
        ? record.action.trim()
        : (fallbackItem.action || purpose)
      const action = appendPoseDirectionLockHint(actionBase, poseDirectionLock)
      const parsedFacingDirection = normalizeLookbookFacingDirection(
        record.facingDirection ?? record.action ?? record.prompt,
        fallbackItem.facingDirection || resolveLookbookPoseDirection(index, poseDirectionLock),
      )
      const facingDirection = poseDirectionLock === 'auto' ? parsedFacingDirection : poseDirectionLock
      const locationCandidate = typeof record.location === 'string' && record.location.trim().length > 0
        ? record.location.trim()
        : (fallbackItem.location || getLookbookThemeLocationFallback(theme, index) || defaultFallback.location || getLockedLocationFallback('flex', index))
      const location = resolveLockedLocationEntry(locationCandidate) || getLockedLocationFallback('flex', index)
      const camera = typeof record.camera === 'string' && record.camera.trim().length > 0
        ? record.camera.trim()
        : (fallbackItem.camera || defaultFallback.camera || '')
      const lighting = typeof record.lighting === 'string' && record.lighting.trim().length > 0
        ? record.lighting.trim()
        : (fallbackItem.lighting || defaultFallback.lighting || '')
      const styleBase = typeof record.style === 'string' && record.style.trim().length > 0
        ? record.style.trim()
        : (fallbackItem.style || defaultFallback.style || '')
      const style = theme === 'auto' ? styleBase : appendSentenceIfMissing(styleBase, themeOption.styleHint)
      const rawPrompt = typeof record.prompt === 'string' && record.prompt.trim().length > 0
        ? record.prompt.trim()
        : fallbackItem.prompt

      return {
        index,
        title,
        purpose,
        subject,
        action,
        facingDirection,
        location,
        camera,
        lighting,
        style,
        prompt: ensureLookbookNanoBananaPrompt(
          rawPrompt,
          {
            subject,
            action,
            facingDirection,
            location,
            camera,
            lighting,
            style,
          },
          aspectRatio,
        ),
      }
    })
    .filter((item): item is LookbookImagePrompt => item !== null)

  const merged = [...normalized]
  for (const fallbackItem of safeFallback) {
    if (merged.length >= imageCount) break
    merged.push(normalizeFromFallback(fallbackItem, merged.length))
  }

  return merged
    .slice(0, Math.max(imageCount, 1))
    .map((item, index) => ({ ...item, index }))
}

function normalizeLocationKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function resolveLockedLocationEntry(value: string): string | null {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return null

  let bestMatch: { value: string; score: number } | null = null

  for (const candidate of LOCKED_LOCATION_LIBRARY) {
    const normalizedCandidate = normalizeLocationKey(candidate)
    if (!normalizedCandidate) continue

    if (normalized === normalizedCandidate) {
      return candidate
    }

    const intersects = normalized.includes(normalizedCandidate) || normalizedCandidate.includes(normalized)
    if (!intersects) continue

    const score = Math.min(normalized.length, normalizedCandidate.length)
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { value: candidate, score }
    }
  }

  return bestMatch?.value || null
}

function getLockedLocationPool(styleLock: 'mirror' | 'studio' | 'flex'): readonly string[] {
  if (styleLock === 'mirror') return LOCKED_LOCATION_MIRROR_POOL
  if (styleLock === 'studio') return LOCKED_LOCATION_STUDIO_POOL
  return LOCKED_LOCATION_FLEX_POOL
}

function getLockedLocationFallback(styleLock: 'mirror' | 'studio' | 'flex' = 'flex', index = 0): string {
  const preferredPool = getLockedLocationPool(styleLock)
  const effectivePool = preferredPool.length > 0 ? preferredPool : LOCKED_LOCATION_LIBRARY
  const safeIndex = Math.max(0, index)
  return effectivePool[safeIndex % effectivePool.length]
}

function hasStyleKeyword(value: string, keywords: readonly string[]): boolean {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return false

  return keywords.some((keyword) => normalized.includes(normalizeLocationKey(keyword)))
}

function isTikTokRestrictedFlatBackgroundLocation(value: string): boolean {
  if (resolveLockedLocationEntry(value)) {
    return false
  }

  const normalized = normalizeLocationKey(value)
  if (!normalized) return false

  const hasHardBlockedSignal = TIKTOK_HARD_BLOCKED_BACKGROUND_KEYWORDS.some((keyword) =>
    normalized.includes(normalizeLocationKey(keyword))
  )
  if (hasHardBlockedSignal) return true

  const hasSoftBlockedSignal = TIKTOK_SOFT_BLOCKED_BACKGROUND_KEYWORDS.some((keyword) =>
    normalized.includes(normalizeLocationKey(keyword))
  )
  if (!hasSoftBlockedSignal) return false

  const hasContextualCue = TIKTOK_CONTEXTUAL_LOCATION_CUES.some((keyword) =>
    normalized.includes(normalizeLocationKey(keyword))
  )

  return !hasContextualCue
}

function getFitModelRuleLock(contentType: ResolvedContentType): FitModelRuleLock {
  return FIT_MODEL_RULE_LOCK_BY_CONTENT_TYPE[contentType]
}

function softenFitModelRuleLockForUserNotes(lock: FitModelRuleLock): FitModelRuleLock {
  if (lock === 'strict_full_body') return 'majority_full_body'
  if (lock === 'majority_full_body') return 'balanced_full_body_proof'
  return lock
}

function buildFitModelRuleLockMatrix(): string {
  return `- strict_full_body: ootdmirror, partyoutfit.
- majority_full_body: ootd, outfitideas, boutiquefeed, athleisure, styling, luxury, streetstyle, sunnyaura.
- balanced_full_body_proof: grwm, fyp, review, tiktokshop, haul.`
}

function buildFitModelRuleLockInstructions(contentType: ResolvedContentType, lock: FitModelRuleLock): string {
  if (lock === 'strict_full_body') {
    return `- Locked content type: ${contentType.toUpperCase()} => strict_full_body.
- Every keyframe should keep model head-to-toe visible with full garment silhouette readability.
- Use frame-filling composition: outfit should occupy most of frame height (target ~80-90%) while head and footwear remain fully visible.
- Keep hemline and footwear readable; avoid crop styles that break fit evaluation.
- Detail proof is allowed only if it still preserves full-look readability.
- This lock is mandatory for package generation and repair.`
  }

  if (lock === 'majority_full_body') {
    return `- Locked content type: ${contentType.toUpperCase()} => majority_full_body.
- Keep full-body framing in most keyframes (hero/hook/close are mandatory full-look).
- Mandatory full-look beats should be frame-filling (outfit occupies most of frame with minimal empty headroom/footroom).
- Medium/detail beats are allowed only when adjacent beats preserve full-look continuity.
- Prioritize silhouette readability before cinematic movement complexity.
- This lock is mandatory for package generation and repair.`
  }

  return `- Locked content type: ${contentType.toUpperCase()} => balanced_full_body_proof.
- Keep at least one hook full-look, one mid proof anchor, and one closing full-look.
- Allow medium/detail proof beats for material/fit verification, but keep silhouette continuity clear.
- Full-look anchors should avoid loose framing; keep outfit frame-filling enough for clear fit evaluation.
- Never sacrifice purchase-relevant fit comprehension for aggressive camera cuts.
- This lock is mandatory for package generation and repair.`
}

function buildFitModelRuleLockRepairHint(contentType: ResolvedContentType, lock: FitModelRuleLock): string {
  if (lock === 'strict_full_body') {
    return `Enforce ${contentType.toUpperCase()} strict_full_body lock: all keyframes must preserve head-to-toe full-look readability.`
  }

  if (lock === 'majority_full_body') {
    return `Enforce ${contentType.toUpperCase()} majority_full_body lock: full-look framing must dominate timeline with only controlled detail exceptions.`
  }

  return `Enforce ${contentType.toUpperCase()} balanced_full_body_proof lock: keep hook/mid/close full-look anchors while allowing proof-oriented detail beats.`
}

function hasFullBodyFramingSignal(...values: Array<unknown>): boolean {
  const normalized = normalizeLocationKey(values.filter((item): item is string => typeof item === 'string').join(' '))
  if (!normalized) return false

  return FIT_MODEL_FULL_BODY_KEYWORDS.some((keyword) => normalized.includes(normalizeLocationKey(keyword)))
}

function shouldForceFullBodyKeyframe(lock: FitModelRuleLock, index: number, keyframeCount: number): boolean {
  if (keyframeCount <= 1) return true

  if (lock === 'strict_full_body') return true

  if (lock === 'majority_full_body') {
    return index === 0 || index === keyframeCount - 1 || index % 2 === 0
  }

  const midAnchor = Math.floor((keyframeCount - 1) / 2)
  return index === 0 || index === midAnchor || index === keyframeCount - 1
}

function getFitModelMinFullBodyCount(lock: FitModelRuleLock, keyframeCount: number): number {
  if (keyframeCount <= 0) return 0

  if (lock === 'strict_full_body') return keyframeCount
  if (lock === 'majority_full_body') return Math.ceil(keyframeCount * 0.6)
  return Math.min(keyframeCount, 3)
}

function validateFitModelCoverage(
  keyframes: Array<Record<string, unknown>>,
  lock: FitModelRuleLock,
): { ok: boolean; reason?: string } {
  if (keyframes.length === 0) {
    return { ok: false, reason: 'fit-model coverage validation missing keyframes' }
  }

  const fullBodyCount = keyframes.reduce((count, item) => {
    const action = typeof item.action === 'string' ? item.action : ''
    const camera = typeof item.camera === 'string' ? item.camera : ''
    return hasFullBodyFramingSignal(action, camera) ? count + 1 : count
  }, 0)

  const minRequired = getFitModelMinFullBodyCount(lock, keyframes.length)
  if (fullBodyCount < minRequired) {
    return {
      ok: false,
      reason: `fit-model lock ${lock} requires >=${minRequired} full-body keyframes, found ${fullBodyCount}`,
    }
  }

  return { ok: true }
}

function enforceFitModelRuleOnKeyframe(
  action: string,
  camera: string,
  lock: FitModelRuleLock,
  contentType: ResolvedContentType,
  index: number,
  keyframeCount: number,
): { action: string; camera: string } {
  const enforceFullBody = shouldForceFullBodyKeyframe(lock, index, keyframeCount)
  let nextAction = action
  let nextCamera = camera

  if (enforceFullBody) {
    nextAction = appendSentenceIfMissing(
      nextAction,
      'Keep head-to-toe full-body visibility and make outfit frame-filling with minimal empty headroom/footroom.',
    )
    nextCamera = appendSentenceIfMissing(
      nextCamera,
      'Use stable full-body framing where outfit occupies roughly 80-90% of frame height, with head and footwear fully visible and no crop at key fit areas.',
    )
    return { action: nextAction, camera: nextCamera }
  }

  if (lock === 'majority_full_body') {
    nextAction = appendSentenceIfMissing(
      nextAction,
      'Medium or detail framing is allowed only when adjacent beats preserve frame-filling full-look outfit continuity.',
    )
    nextCamera = appendSentenceIfMissing(
      nextCamera,
      'If this beat is not full-body, keep enough silhouette context and return immediately to frame-filling full-look composition in adjacent beats.',
    )
    return { action: nextAction, camera: nextCamera }
  }

  nextAction = appendSentenceIfMissing(
    nextAction,
    'Detail proof is allowed, but preserve fit-line clarity and return to a full-look anchor in adjacent beats.',
  )
  nextCamera = appendSentenceIfMissing(
    nextCamera,
    'If using medium or close detail framing, keep silhouette continuity readable and avoid cropping key fit areas.',
  )

  if (contentType === 'tiktokshop' || contentType === 'review') {
    nextAction = appendSentenceIfMissing(
      nextAction,
      'Maintain product-proof clarity for size, drape, and proportion before any close-up detail beat.',
    )
  }

  return { action: nextAction, camera: nextCamera }
}

function shouldUseMirrorOutfitIdeasStyle(notes: string): boolean {
  const normalizedNotes = normalizeLocationKey(notes)
  if (!normalizedNotes) return false

  if (hasStyleKeyword(notes, MIRROR_LOCATION_STYLE_KEYWORDS)) {
    return true
  }

  return normalizedNotes.includes('fitcheck') || normalizedNotes.includes('mirror') || normalizedNotes.includes('guong')
}

const USER_NOTES_LOCATION_TRANSITION_KEYWORDS = [
  'multi location',
  'multiple location',
  'location transition',
  'transition location',
  'change location',
  'different location',
  'two location',
  '2 location',
  'location per scene',
  'scene to scene location',
  'location shift',
  'doi dia diem',
  'nhieu dia diem',
  'chuyen canh',
  'doi boi canh',
] as const

const USER_NOTES_OUTDOOR_STYLE_KEYWORDS = [
  'outdoor',
  'outside',
  'street',
  'rooftop',
  'cafe',
  'coffee shop',
  'park',
  'beach',
  'garden',
  'ngoai troi',
  'duong pho',
] as const

function shouldAllowLocationTransitionsFromNotes(notes: string): boolean {
  const normalizedNotes = normalizeLocationKey(notes)
  if (!normalizedNotes) return false

  return USER_NOTES_LOCATION_TRANSITION_KEYWORDS.some((keyword) =>
    normalizedNotes.includes(keyword)
  )
}

function resolveStyleLockWithUserNotes(
  contentType: ResolvedContentType,
  notes = '',
): { styleLock: ContentStyleLock; overriddenByNotes: boolean } {
  const defaultStyleLock = getContentTypeStyleLock(contentType, notes)
  const normalizedNotes = normalizeLocationKey(notes)
  if (!normalizedNotes) {
    return { styleLock: defaultStyleLock, overriddenByNotes: false }
  }

  const mirrorRequested = (
    hasStyleKeyword(notes, MIRROR_LOCATION_STYLE_KEYWORDS)
    || normalizedNotes.includes('fitcheck')
    || normalizedNotes.includes('mirror')
    || normalizedNotes.includes('guong')
  )
  const studioRequested = hasStyleKeyword(notes, STUDIO_LOCATION_STYLE_KEYWORDS)
  const outdoorRequested = USER_NOTES_OUTDOOR_STYLE_KEYWORDS.some((keyword) =>
    normalizedNotes.includes(keyword)
  )

  const hasExplicitStyleSignal = mirrorRequested || studioRequested || outdoorRequested
  if (!hasExplicitStyleSignal) {
    return { styleLock: defaultStyleLock, overriddenByNotes: false }
  }

  let resolvedStyleLock: ContentStyleLock = 'flex'
  if (mirrorRequested && !studioRequested && !outdoorRequested) {
    resolvedStyleLock = 'mirror'
  } else if (studioRequested && !mirrorRequested && !outdoorRequested) {
    resolvedStyleLock = 'studio'
  }

  if (resolvedStyleLock === defaultStyleLock) {
    return { styleLock: defaultStyleLock, overriddenByNotes: false }
  }

  return { styleLock: resolvedStyleLock, overriddenByNotes: true }
}

function getContentTypeStyleLock(contentType: ResolvedContentType, notes = ''): ContentStyleLock {
  if (contentType === 'ootdmirror') return 'mirror'
  if (contentType === 'ootd') return 'studio'
  if (contentType === 'outfitideas') {
    return shouldUseMirrorOutfitIdeasStyle(notes) ? 'mirror' : 'studio'
  }
  return 'flex'
}

function matchesStyleLockForLocation(location: string, styleLock: ContentStyleLock): boolean {
  if (styleLock === 'flex') return true

  const hasMirror = hasStyleKeyword(location, MIRROR_LOCATION_STYLE_KEYWORDS)

  const resolvedLibraryLocation = resolveLockedLocationEntry(location)
  if (resolvedLibraryLocation) {
    if (styleLock === 'mirror') {
      return hasMirror
    }

    return !hasMirror
  }

  const hasStudio = hasStyleKeyword(location, STUDIO_LOCATION_STYLE_KEYWORDS)

  if (styleLock === 'mirror') {
    return hasMirror
  }

  return hasStudio && !hasMirror
}

function getStyleLockFallbackLocation(styleLock: ContentStyleLock): string {
  return getLockedLocationFallback(styleLock)
}

function buildTikTokNativeSignalRules(contentType: ResolvedContentType): string {
  if (contentType === 'ootdmirror') {
    return `- Mirror-first social grammar: mirror fit check and reflection readability with observer-camera coverage.
- Keep full-body reflection visible for most of the timeline, with at least one stable fit-check hold.
- Align visual rhythm with fitcheck cluster behavior: clear silhouette proof before transitions.
- Use observer-camera framing (camera in front of model, mirror behind model), not device-in-hand selfie capture.
- Keep hand anatomy stable in reflection: two hands only, five fingers per hand, and no mirrored hand overlap/deformation during turns.
- Treat "ootdmirror" as an internal strategy label only; externally mirror the stronger native cluster language (#fitcheck, #mirrorselfie, #ootd, #outfitinspo).`
  }

  if (contentType === 'ootd') {
    return `- Studio-first OOTD grammar: contextual single-corner set (textured/decorated wall cues), full-look reveal, detail proof, confidence closer.
- Align social-native cues with OOTD cluster behavior (#ootd, #outfit, #outfitideas style readability).
- Avoid plain seamless white/solid-color background look that feels like a static cutout ad.
- Prioritize outfit readability over aggressive transitions.`
  }

  if (contentType === 'outfitideas') {
    return `- Outfit ideas grammar: practical mix-and-match sequence users can copy immediately, not mirror-first fitcheck storytelling.
- Include at least one clear before/after styling switch and one save-worthy final composition.
- Keep at least 2-3 wearable combo ideas around a hero piece (work/cafe/date or similar contexts).
- Default to non-mirror lookbook/styling composition; use mirror-fitcheck only when user notes explicitly request mirror or fitcheck.`
  }

  if (contentType === 'grwm') {
    return `- GRWM grammar: natural preparation flow (choose look -> detail check -> ready-to-go payoff), not scripted tutorial voice.
- Anchor socially recognizable behavior to #grwm and #getreadywithme clusters rather than over-produced cinematic beats.
- Keep pacing intimate and human: short candid moments, not rigid shot-list execution.`
  }

  if (contentType === 'tiktokshop') {
    return `- TikTok Shop grammar: proof stack (fit + material + usage) then objection handling and conversion intent.
- Keep product readability dominant and include review or unboxing style trust cues.
- Avoid flat/plain seamless backgrounds; keep believable social-native depth in the environment.
- Maintain conversion-native language and framing consistency across scenes.`
  }

  if (contentType === 'boutiquefeed') {
    return `- Boutique-feed grammar: short emotional hook, immediate outfit readability, then fit/material proof before final verdict.
- Keep language and motion creator-native; mimic practical boutique review cadence instead of scripted ads.
- Preserve trust signals: real-experience framing, practical wearability cues, and concise recommendation tone.
- Keep hashtag-ready intent aligned with Vietnamese boutique clusters (#damxinh, #damtiec, #thoitranghottrend, #goclamdep, #xuhuong).`
  }

  if (contentType === 'streetstyle') {
    return `- Street style social grammar: natural outdoor walk, candid urban backdrop, authentic movement energy.
- Keep full-body outfit visibility high across the timeline — silhouette must be clearly readable in natural/street light.
- Align visual rhythm with thoitrangnu/streetstyle cluster behavior: walking entrance → outfit proof → candid detail → urban environment moment.`
  }

  if (contentType === 'sunnyaura') {
    return `- Sunny-aura grammar: daylight-first hook, warm natural glow, and clean outfit readability from the first second.
- Keep the structure short-form native (roughly 11-20s feel): hook -> glow/detail -> natural walk/pose -> soft close.
- Use realistic sunlight contexts (street corner, cafe frontage, plaza, window-light edge) with believable depth.
- Start with one concise on-screen text hook (question or confident statement) and keep caption minimal.
- Caption/CTA tone should stay minimal and lifestyle-first; avoid aggressive hard-sell overlays.
- Treat "sunnyaura" as an internal strategy label and map language to native women-fashion behavior (#thoitrangnu style).`
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

  if (contentType === 'sunnyaura') {
    return `- Evidence from provided links: repeated #mia + #thoitrangnu with minimal captioning and daylight aura framing.
- Keep copy concise and let sunlight + silhouette carry the emotional hook.
- Prioritize natural daylight readability over cinematic gimmicks or heavy conversion overlays.`
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

  if (contentType === 'boutiquefeed') {
    return `- Boutique benchmark alignment: combine #damxinh/#damtiec demand with broad discovery tags (#thoitranghottrend, #xuhuong, #goclamdep).
- Captions should stay concise and emotive (hook first), then let visual fit/material proof carry conversion.
- Keep trust-first recommendation framing (real experience) over hard-sell CTA blocks.`
  }

  if (contentType === 'outfitideas') {
    return `- Mainstream adoption: #outfitideas (~24M) and #outfitinspo (~15.8M) are strong, while #ootdmirror (~1.2K) is niche.
- For OutfitIdeas, prioritize practical mix-and-match value (copyable combinations) over mirror-specific fitcheck identity.
- Default to contextual studio/lookbook flow and only switch to mirror-fitcheck when user notes explicitly request mirror behavior.`
  }

  if (contentType === 'ootd') {
    return `- Strong mainstream alignment: #ootd / #outfitideas / #fitcheck clusters are robust and natural for women fashion.
- Keep OOTD as single-look readability proof with clean silhouette continuity over flashy transition gimmicks.`
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

function isAllowedHybridCameraMotion(value: string): boolean {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return false

  return SCENE_CAMERA_HYBRID_MOTION_OPTIONS.some((option) => normalized.includes(normalizeLocationKey(option)))
}

function resolveSceneCameraPositionOption(value: string): SceneCameraPositionOption | null {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return null

  for (const option of SCENE_CAMERA_POSITION_OPTIONS) {
    if (normalized === normalizeLocationKey(option)) return option
  }

  return null
}

function resolveSceneCameraMotionOption(value: string): SceneCameraMotionOption | null {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return null

  for (const option of SCENE_CAMERA_MOTION_OPTIONS) {
    if (normalized === normalizeLocationKey(option)) return option
  }

  for (const option of SCENE_CAMERA_MOTION_OPTIONS) {
    if (normalized.includes(normalizeLocationKey(option))) return option
  }

  return null
}

function parseSceneCameraMovementSpec(value: string): {
  position: SceneCameraPositionOption | null
  motion: SceneCameraMotionOption | null
} {
  const trimmed = value.trim()
  if (!trimmed) {
    return { position: null, motion: null }
  }

  const structuredMatch = trimmed.match(/position\s*:\s*([^|;\n]+)\s*(?:\||;|,)\s*motion\s*:\s*([^\n]+)/i)
  if (!structuredMatch) {
    return { position: null, motion: null }
  }

  return {
    position: resolveSceneCameraPositionOption(structuredMatch[1]?.trim() || ''),
    motion: resolveSceneCameraMotionOption(structuredMatch[2]?.trim() || ''),
  }
}

function stripSceneCameraMovementSpec(value: string): string {
  return value
    .replace(/^\s*position\s*:[^|;\n]+(?:\||;|,)\s*motion\s*:[^.\n]+[.\s]*/i, '')
    .trim()
}

function normalizeSceneCameraMovementSpec(value: unknown, fallbackDetail: string = ''): string {
  const rawValue = typeof value === 'string' ? value.trim() : ''
  const parsed = parseSceneCameraMovementSpec(rawValue)

  const position = parsed.position || DEFAULT_SCENE_CAMERA_POSITION
  const motion = parsed.motion
    || resolveSceneCameraMotionOption(rawValue)
    || resolveSceneCameraMotionOption(fallbackDetail)
    || DEFAULT_SCENE_CAMERA_MOTION

  const detailSource = rawValue.length > 0 ? rawValue : fallbackDetail
  const detail = stripSceneCameraMovementSpec(detailSource)
  const normalizedDetail = normalizeLocationKey(detail)

  const base = `Position: ${position} | Motion: ${motion}`
  if (!normalizedDetail || normalizedDetail === normalizeLocationKey(motion)) return base
  return `${base}. ${detail}`
}

function detectCameraMotionFamilies(value: string): string[] {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return []

  if (isAllowedHybridCameraMotion(value)) {
    return ['dolly-zoom-hybrid']
  }

  return Object.entries(CAMERA_MOTION_FAMILY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(normalizeLocationKey(keyword))))
    .map(([family]) => family)
}

function extractMotionDirection(value: string): 'left' | 'right' | 'forward' | 'backward' | 'up' | 'down' | 'clockwise' | 'counterclockwise' | 'none' {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return 'none'

  if (normalized.includes('counterclockwise') || normalized.includes('anti clockwise')) return 'counterclockwise'
  if (normalized.includes('clockwise')) return 'clockwise'
  if (normalized.includes('orbit up')) return 'up'
  if (normalized.includes('orbit low') || normalized.includes('orbit down')) return 'down'
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

function toFacingDirectionLabel(direction: ConcreteFacingDirection): string {
  if (direction === 'three-quarter-left') return 'three-quarter-left'
  if (direction === 'three-quarter-right') return 'three-quarter-right'
  return direction
}

function isConcreteFacingDirection(value: unknown): value is ConcreteFacingDirection {
  return (
    value === 'front'
    || value === 'back'
    || value === 'left'
    || value === 'right'
    || value === 'three-quarter-left'
    || value === 'three-quarter-right'
  )
}

function pickAlternatingFacingDirection(
  index: number,
  previous: ConcreteFacingDirection | null,
  preferred: KeyframeFacingDirection,
): ConcreteFacingDirection {
  if (preferred !== 'unknown' && preferred !== previous) {
    return preferred
  }

  const start = ((index % RULE32_FACING_SEQUENCE.length) + RULE32_FACING_SEQUENCE.length) % RULE32_FACING_SEQUENCE.length
  for (let offset = 0; offset < RULE32_FACING_SEQUENCE.length; offset += 1) {
    const candidate = RULE32_FACING_SEQUENCE[(start + offset) % RULE32_FACING_SEQUENCE.length]
    if (candidate !== previous) {
      return candidate
    }
  }

  return previous === 'front' ? 'three-quarter-left' : 'front'
}

function isLeftFamilyFacingDirection(value: unknown): value is Extract<ConcreteFacingDirection, 'left' | 'three-quarter-left'> {
  return value === 'left' || value === 'three-quarter-left'
}

function pickLongDurationFacingDirection(
  index: number,
  previous: ConcreteFacingDirection | null,
): ConcreteFacingDirection {
  const start = ((index % LONG_DURATION_FACING_SEQUENCE.length) + LONG_DURATION_FACING_SEQUENCE.length) % LONG_DURATION_FACING_SEQUENCE.length
  for (let offset = 0; offset < LONG_DURATION_FACING_SEQUENCE.length; offset += 1) {
    const candidate = LONG_DURATION_FACING_SEQUENCE[(start + offset) % LONG_DURATION_FACING_SEQUENCE.length]
    if (candidate !== previous) {
      return candidate
    }
  }

  return previous === 'front' ? 'three-quarter-left' : 'front'
}

function isOppositeFacingDirection(
  previous: ConcreteFacingDirection,
  current: ConcreteFacingDirection,
): boolean {
  return (
    (previous === 'front' && current === 'back')
    || (previous === 'back' && current === 'front')
    || (previous === 'left' && current === 'right')
    || (previous === 'right' && current === 'left')
    || (previous === 'three-quarter-left' && current === 'three-quarter-right')
    || (previous === 'three-quarter-right' && current === 'three-quarter-left')
  )
}

function isDetailSensitiveProductCategory(productCategory: ProductCategory): boolean {
  if (!productCategory || productCategory === 'auto') return false

  if (DETAIL_SENSITIVE_PRODUCT_CATEGORY_VALUES.includes(productCategory as typeof DETAIL_SENSITIVE_PRODUCT_CATEGORY_VALUES[number])) {
    return true
  }

  return DETAIL_SENSITIVE_PRODUCT_CATEGORY_PREFIXES.some((prefix) => productCategory.startsWith(prefix))
}

function hasDetailSensitiveGarmentSignal(values: Array<unknown>): boolean {
  const signalText = values
    .filter((value): value is string => typeof value === 'string')
    .join(' ')

  const normalized = normalizeLocationKey(signalText)
  if (!normalized) return false

  return DETAIL_SENSITIVE_GARMENT_KEYWORDS.some((keyword) =>
    normalized.includes(normalizeLocationKey(keyword))
  )
}

function softenFacingTransitionForDetailSensitive(
  previous: ConcreteFacingDirection | null,
  candidate: ConcreteFacingDirection,
  index: number,
): ConcreteFacingDirection {
  if (!previous) return candidate

  if (isOppositeFacingDirection(previous, candidate)) {
    return index % 2 === 0 ? 'three-quarter-left' : 'three-quarter-right'
  }

  return candidate
}

function pickDetailSensitiveFacingDirection(
  index: number,
  previous: ConcreteFacingDirection | null,
  preferred: KeyframeFacingDirection,
): ConcreteFacingDirection {
  if (preferred !== 'unknown') {
    return softenFacingTransitionForDetailSensitive(
      previous,
      preferred as ConcreteFacingDirection,
      index,
    )
  }

  if (!previous) {
    return DETAIL_SENSITIVE_FACING_SEQUENCE[index % DETAIL_SENSITIVE_FACING_SEQUENCE.length]
  }

  if (index % 2 === 1) {
    return previous
  }

  const candidate = DETAIL_SENSITIVE_FACING_SEQUENCE[index % DETAIL_SENSITIVE_FACING_SEQUENCE.length]
  return softenFacingTransitionForDetailSensitive(previous, candidate, index)
}

function enforceOotdMirrorQuarterFacingDirection(
  index: number,
  candidate: ConcreteFacingDirection,
  previous: ConcreteFacingDirection | null,
): OotdMirrorFacingDirection {
  if (candidate === 'three-quarter-left' || candidate === 'left') {
    return 'three-quarter-left'
  }

  if (candidate === 'three-quarter-right' || candidate === 'right') {
    return 'three-quarter-right'
  }

  if (previous === 'three-quarter-left') {
    return 'three-quarter-right'
  }

  if (previous === 'three-quarter-right') {
    return 'three-quarter-left'
  }

  return index % 2 === 0 ? 'three-quarter-left' : 'three-quarter-right'
}

function enforceOotdMirrorFrontFaceQuarterBodyLock(
  action: string,
  facingDirection: OotdMirrorFacingDirection,
): string {
  let nextAction = enforceActionFacingDirection(action, facingDirection)
  nextAction = appendSentenceIfMissing(nextAction, 'Face remains front-oriented toward camera with clear eyes and jawline visibility.')
  nextAction = appendSentenceIfMissing(nextAction, 'Keep only a gentle three-quarter body angle and avoid full back turns.')
  return nextAction
}

function appendSentenceIfMissing(base: string, sentence: string): string {
  const trimmedBase = base.trim()
  const trimmedSentence = sentence.trim()
  if (!trimmedSentence) return trimmedBase
  if (!trimmedBase) return trimmedSentence

  const normalizedBase = normalizeLocationKey(trimmedBase)
  const normalizedSentence = normalizeLocationKey(trimmedSentence)
  if (normalizedSentence.length > 0 && normalizedBase.includes(normalizedSentence)) {
    return trimmedBase
  }

  return /[.!?]$/.test(trimmedBase)
    ? `${trimmedBase} ${trimmedSentence}`
    : `${trimmedBase}. ${trimmedSentence}`
}

function enforceActionFacingDirection(
  action: string,
  facingDirection: ConcreteFacingDirection,
): string {
  const facingPatterns: RegExp[] = [
    /\b(?:front|back|left|right)(?:-|\s)?facing\b/gi,
    /\bthree(?:-|\s)?quarter(?:-|\s)?(?:left|right)(?:-|\s)?facing\b/gi,
    /\bfacing\s+(?:front|back|left|right)\b/gi,
    /\bfacing\s+three(?:-|\s)?quarter(?:-|\s)?(?:left|right)\b/gi,
    /\brear\s+view\b/gi,
    /\bfacing\s+away\b/gi,
    /\bback\s+to\s+camera\b/gi,
    /\bfacing\s+camera\b/gi,
    /\bface\s+camera\b/gi,
    /\btoward\s+camera\b/gi,
    /\bdoi\s+lung\b/gi,
    /\bquay\s+lung\b/gi,
    /\bchinh\s+dien\b/gi,
    /\btruc\s+dien\b/gi,
    /\bhuong\s+trai\b/gi,
    /\bhuong\s+phai\b/gi,
    /\bsang\s+trai\b/gi,
    /\bsang\s+phai\b/gi,
    /\bnghieng\s+trai\b/gi,
    /\bnghieng\s+phai\b/gi,
  ]

  let sanitized = action
  for (const pattern of facingPatterns) {
    sanitized = sanitized.replace(pattern, ' ')
  }

  sanitized = normalizePromptWhitespace(sanitized).replace(/^[,.;:\-\s]+/, '').trim()

  return appendSentenceIfMissing(
    sanitized,
    `Body facing ${toFacingDirectionLabel(facingDirection)}`,
  )
}

function applyMirrorHandSafetyToAction(
  action: string,
  facingDirection: ConcreteFacingDirection,
  isFinalKeyframe: boolean,
): string {
  let nextAction = appendSentenceIfMissing(
    action,
    'Keep exactly two visible hands with natural five fingers per hand; no extra, missing, fused, or distorted fingers.',
  )

  if (facingDirection === 'back') {
    nextAction = appendSentenceIfMissing(
      nextAction,
      'Both arms stay relaxed slightly away from the torso and skirt so hand silhouettes remain clean in the mirror reflection.',
    )
  }

  if (facingDirection === 'three-quarter-left' || facingDirection === 'three-quarter-right') {
    nextAction = appendSentenceIfMissing(
      nextAction,
      isFinalKeyframe
        ? 'For the over-shoulder finish, only one hand may lift one heel while the other hand stays relaxed by the thigh with separated fingers.'
        : 'Use one active hand at a time while the other hand stays relaxed by the thigh to prevent mirrored hand overlap artifacts.',
    )
  }

  return nextAction
}

function applyMirrorHandSafetyToSceneNarrative(
  narrative: string,
  startFacing: ConcreteFacingDirection | null,
  endFacing: ConcreteFacingDirection | null,
): string {
  const isBackToQuarterTurn = (
    startFacing === 'back'
    && (endFacing === 'three-quarter-left' || endFacing === 'three-quarter-right')
  )

  if (!isBackToQuarterTurn) return narrative

  return appendSentenceIfMissing(
    narrative,
    'During the turn, keep a continuous arm trajectory and stable hand anatomy: exactly two hands, five fingers each, no flicker, duplication, fusion, or hand-through-fabric artifacts in the mirror.',
  )
}

function normalizePromptWhitespace(value: string): string {
  return value
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

function removeOotdMirrorHandheldDevicePhrases(value: string): string {
  let next = value

  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\bmirror\s+selfie\b/gi, replacement: 'mirror fitcheck' },
    { pattern: /\bselfie(?:-style)?\b/gi, replacement: 'fitcheck-style' },
    { pattern: /\b(?:holding|using|filming with|recording with|gripping|raising|lifting)\s+(?:a|an|the|her)?\s*(?:phone|smartphone|iphone|mobile(?:\s+phone)?|camera|camcorder|gimbal)\b/gi, replacement: 'hands free' },
    { pattern: /\b(?:phone|smartphone|iphone|mobile(?:\s+phone)?|camera|camcorder|gimbal)\s*(?:in\s+hand|in\s+her\s+hand|on\s+hand)\b/gi, replacement: 'hands free' },
    { pattern: /\bhandheld\s+phone\b/gi, replacement: 'observer camera' },
    { pattern: /\bphone\s+pov\b/gi, replacement: 'observer-camera POV' },
  ]

  for (const { pattern, replacement } of replacements) {
    next = next.replace(pattern, replacement)
  }

  return normalizePromptWhitespace(next)
}

function enforceOotdMirrorHandsFreeAction(action: string): string {
  const sanitized = removeOotdMirrorHandheldDevicePhrases(action)
  return appendSentenceIfMissing(
    sanitized,
    'Natural hand gestures support outfit presentation with clear mirror readability.',
  )
}

function enforceOotdMirrorObserverCamera(camera: string): string {
  let next = removeOotdMirrorHandheldDevicePhrases(camera)
  next = appendSentenceIfMissing(next, 'Observer camera is front-facing the model at chest-to-eye height')
  next = appendSentenceIfMissing(next, 'Use the rear mirror behind the model for full-body outfit reflection')
  next = appendSentenceIfMissing(next, 'Keep face front to camera while body stays at a gentle three-quarter-left or three-quarter-right angle only')
  next = appendSentenceIfMissing(next, 'Never frame or direct a full back-facing body orientation')
  next = appendSentenceIfMissing(next, 'No camera, tripod, operator, or recording gear visible in mirror reflection')
  return next
}

function enforceOotdMirrorSceneNarrative(narrative: string): string {
  let next = removeOotdMirrorHandheldDevicePhrases(narrative)
  next = appendSentenceIfMissing(next, 'Use observer-camera coverage with the mirror behind the model for reflection proof')
  next = appendSentenceIfMissing(next, 'Keep face orientation front to camera while body angle stays gentle three-quarter left or right')
  next = appendSentenceIfMissing(next, 'Hand gestures stay natural and coordinated with the outfit showcase flow')
  return next
}

function hasKeyframeTurnCue(...values: Array<unknown>): boolean {
  const normalized = normalizeLocationKey(values.filter((item): item is string => typeof item === 'string').join(' '))
  if (!normalized) return false

  return KEYFRAME_TURN_CUE_KEYWORDS.some((keyword) => normalized.includes(normalizeLocationKey(keyword)))
}

function removeTurnCuePhrases(value: string): string {
  if (!value.trim()) return ''

  let next = value
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\b(?:quarter|half|three(?:-|\s)?quarter)\s+turn\b/gi, replacement: ' ' },
    { pattern: /\b(?:turn|pivot|rotate|rotation|swivel|spin|twirl)\b/gi, replacement: ' ' },
    { pattern: /\blook\s+back\b/gi, replacement: ' ' },
    { pattern: /\bover(?:-|\s)?shoulder\b/gi, replacement: ' ' },
    { pattern: /\bturn\s+(?:away|toward)\b/gi, replacement: ' ' },
    { pattern: /\bxoay\b/gi, replacement: ' ' },
    { pattern: /\bquay\b/gi, replacement: ' ' },
    { pattern: /\bnghieng\b/gi, replacement: ' ' },
    { pattern: /\bdoi\s+lung\b/gi, replacement: ' ' },
    { pattern: /\bquay\s+lung\b/gi, replacement: ' ' },
  ]

  for (const { pattern, replacement } of replacements) {
    next = next.replace(pattern, replacement)
  }

  return normalizePromptWhitespace(next).replace(/^[,.;:\-\s]+/, '').trim()
}

function sanitizeVisualOnlyConciseAction(value: string): string {
  const fallback = 'Natural mirror phone fit-check motion with clear full-body visibility.'
  if (!value.trim()) return fallback

  let next = value
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /^\s*action\s*:?/gi, replacement: ' ' },
    { pattern: /\b(?:script|visual)\s+beat(?:\s+flow)?(?:\s+reference)?\b/gi, replacement: ' ' },
    { pattern: /\b(?:follow|follows|following)\s+(?:the\s+)?(?:visual\s+)?beat(?:\s+flow)?\b/gi, replacement: ' ' },
    { pattern: /\bbeat\s*\d+\b/gi, replacement: ' ' },
    { pattern: /\bbeat(?:\s+flow)?\b/gi, replacement: ' ' },
    { pattern: /\b(?:context\s+continuity|context\s+remix\s+reference|direction\s+lock|performance\s+rule|voice\s+rule)\s*:/gi, replacement: ' ' },
    { pattern: /\b(?:silent\s+visual(?:\s+scene)?\s+only)\b/gi, replacement: ' ' },
    { pattern: /\b(?:no\s+talking|no\s+dialogue|no\s+voice(?:over)?|no\s+lip(?:-|\s)?sync(?:ing)?)\b/gi, replacement: ' ' },
    { pattern: /\b(?:do\s+not|don't|never|avoid|without)\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\b(?:MIRROR\s+HOOK\s+FRAME|FULL\s+FIT\s+PROOF|DETAIL\s+CHECK|ANGLE\s+SWITCH|SOFT\s+CLOSE)\b/gi, replacement: ' ' },
    { pattern: /\bsocial-native\b/gi, replacement: ' ' },
    { pattern: /\bcommunicate\s+via\s+pose\b/gi, replacement: ' ' },
    { pattern: /\b(?:acting|performance|performative|influencer|vlog|selfie(?:\s+vibe)?)\b/gi, replacement: ' ' },
    { pattern: /\bexecute\s+a\s+controlled\s+3\/4\s+angle\s+transition\b/gi, replacement: 'small controlled body-angle change' },
    { pattern: /\b(?:voiceover|dialogue|spoken|speaking|talking|narration|narrate)\b/gi, replacement: ' ' },
    { pattern: /\blip(?:-|\s)?sync(?:ing)?\b/gi, replacement: ' ' },
    { pattern: /\b(?:mouth\s+movement|jaw\s+movement|pseudo-voice\s+acting)\b/gi, replacement: ' ' },
    { pattern: /\b(?:body\s+facing\s+(?:front|back|left|right|three(?:-|\s)?quarter(?:-|\s)?(?:left|right)))\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\b(?:face\s+remains?\s+front(?:-|\s)?oriented)\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\bmodel\s+is\s+not\s+holding\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\bmodel\s+remains?\s+hands(?:-|\s)?free\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\brear\s+mirror\s+(?:remains?|stays?)\s+behind\s+model\b[^.?!;|]*/gi, replacement: ' ' },
  ]

  for (const { pattern, replacement } of replacements) {
    next = next.replace(pattern, replacement)
  }

  next = next.replace(/\s*\|\s*/g, ' ')
  next = normalizePromptWhitespace(next).replace(/^[,.;:\-\s]+/, '').trim()
  return next.length > 0 ? next : fallback
}

function sanitizeVisualOnlyConciseSceneNarrative(value: string): string {
  const fallback = 'Concise visual mirror phone fit-check progression with clear product visibility.'
  if (!value.trim()) return fallback

  let next = value
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /^\s*action\s*:?/gi, replacement: ' ' },
    { pattern: /\b(?:script|visual)\s+beat(?:\s+flow)?(?:\s+reference)?\b/gi, replacement: ' ' },
    { pattern: /\b(?:follow|follows|following)\s+(?:the\s+)?(?:visual\s+)?beat(?:\s+flow)?\b/gi, replacement: ' ' },
    { pattern: /\bbeat\s*(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, replacement: ' ' },
    { pattern: /\bbeat(?:\s+flow)?\b/gi, replacement: ' ' },
    { pattern: /\b(?:context\s+continuity|context\s+remix\s+reference|direction\s+lock|performance\s+rule|voice\s+rule)\s*:/gi, replacement: ' ' },
    { pattern: /\b(?:silent\s+visual(?:\s+scene)?\s+only)\b/gi, replacement: ' ' },
    { pattern: /\b(?:no\s+talking|no\s+dialogue|no\s+voice(?:over)?|no\s+lip(?:-|\s)?sync(?:ing)?)\b/gi, replacement: ' ' },
    { pattern: /\b(?:do\s+not|don't|never|avoid|without)\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\b(?:MIRROR\s+HOOK\s+FRAME|FULL\s+FIT\s+PROOF|DETAIL\s+CHECK|ANGLE\s+SWITCH|SOFT\s+CLOSE)\b/gi, replacement: ' ' },
    { pattern: /\bsocial-native\b/gi, replacement: ' ' },
    { pattern: /\bcommunicate\s+via\s+pose\b/gi, replacement: ' ' },
    { pattern: /\b(?:acting|performance|performative|influencer|vlog|selfie(?:\s+vibe)?)\b/gi, replacement: ' ' },
    { pattern: /\bexecute\s+a\s+controlled\s+3\/4\s+angle\s+transition\b/gi, replacement: 'small controlled body-angle change' },
    { pattern: /\b(?:voiceover|dialogue|spoken|speaking|talking|narration|narrate)\b/gi, replacement: ' ' },
    { pattern: /\blip(?:-|\s)?sync(?:ing)?\b/gi, replacement: ' ' },
    { pattern: /\b(?:mouth\s+movement|jaw\s+movement|pseudo-voice\s+acting)\b/gi, replacement: ' ' },
    { pattern: /\b(?:body\s+facing\s+(?:front|back|left|right|three(?:-|\s)?quarter(?:-|\s)?(?:left|right)))\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\b(?:face\s+remains?\s+front(?:-|\s)?oriented)\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\bmodel\s+is\s+not\s+holding\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\bmodel\s+remains?\s+hands(?:-|\s)?free\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\brear\s+mirror\s+(?:remains?|stays?)\s+behind\s+model\b[^.?!;|]*/gi, replacement: ' ' },
  ]

  for (const { pattern, replacement } of replacements) {
    next = next.replace(pattern, replacement)
  }

  next = next.replace(/\s*\|\s*/g, ' ')
  next = normalizePromptWhitespace(next).replace(/^[,.;:\-\s]+/, '').trim()
  return next.length > 0 ? next : fallback
}

function sanitizeVisualOnlyConciseCamera(value: string): string {
  const fallback = 'Controlled phone-held mirror framing with stable axis and minimal shake.'
  if (!value.trim()) return fallback

  let next = value
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\bcomposition\s+lock\s*:?/gi, replacement: ' ' },
    { pattern: /\bsocial-native\b/gi, replacement: 'natural' },
    { pattern: /\bhandheld\s+tracking\s+movement\b/gi, replacement: 'controlled phone-held tracking movement' },
    { pattern: /\b(?:handheld|hand\s+held)\b/gi, replacement: 'phone-held' },
    { pattern: /\bshaky\s+cam\b/gi, replacement: 'controlled handheld camera' },
    { pattern: /\borbit\s+(?:left|right|up|low|down)\b/gi, replacement: 'gentle linear shift' },
    { pattern: /\borbit\b/gi, replacement: 'gentle linear shift' },
    { pattern: /\barc\s+shot\b/gi, replacement: 'gentle linear shift' },
    { pattern: /\bcircular\s+move\b/gi, replacement: 'gentle linear shift' },
    { pattern: /\b(?:vlog|influencer|selfie)\b/gi, replacement: 'neutral' },
  ]

  for (const { pattern, replacement } of replacements) {
    next = next.replace(pattern, replacement)
  }

  next = normalizePromptWhitespace(next).replace(/^[,.;:\-\s]+/, '').trim()
  const clauses = next.split(/[.!?]/).map((clause) => clause.trim()).filter((clause) => clause.length > 0)
  const compact = clauses.slice(0, 2).join('. ').trim()
  if (compact.length > 0) {
    next = compact
  }
  return next.length > 0 ? next : fallback
}

function sanitizeVisualOnlyConciseSubject(value: string): string {
  const fallback = 'Mirror phone fit-check sequence with clear full-body outfit visibility in a stable indoor mirror setting.'
  if (!value.trim()) return fallback

  let next = value
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\[[^\]]+\]\s*:?/g, replacement: ' ' },
    { pattern: /\b(?:rule|lock|constraint|priority)\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\b(?:do\s+not|don't|never|avoid|without|no|not)\b[^.?!;|]*/gi, replacement: ' ' },
    { pattern: /\b(?:voiceover|dialogue|lip(?:-|\s)?sync(?:ing)?|speech(?:-like)?|presenter-style)\b/gi, replacement: ' ' },
    { pattern: /\s*\|\s*/g, replacement: ' ' },
  ]

  for (const { pattern, replacement } of replacements) {
    next = next.replace(pattern, replacement)
  }

  next = normalizePromptWhitespace(next).replace(/^[,.;:\-\s]+/, '').trim()
  const firstSentence = next
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .find((sentence) => sentence.length >= 24)

  return firstSentence && firstSentence.length > 0 ? firstSentence : fallback
}

const OOTD_TEMPLATE_SILENT_FIT_CHECK_PERFORMANCE_LOCK = 'PERFORMANCE: Fit-check only; mouth stays relaxed and closed at rest, expression stays calm, and the model does not perform talking-to-camera behavior.'
const OOTD_TEMPLATE_SILENT_FIT_CHECK_AUDIO_LOCK = 'AUDIO: Silent video or natural room tone and light fabric rustle only; no voice, no dialogue, no narration, no lip-sync, and no spoken CTA.'
const OOTD_TEMPLATE_SILENT_FIT_CHECK_NEGATIVE_PROMPT = 'NEGATIVE PROMPT: talking, speaking, lip-sync, dialogue, voiceover, narration, presenter monologue, speech-like mouth movement, jaw-talking motion, camera-facing speech performance.'
const OOTD_TEMPLATE_SCENE_REVIEW_STYLES = [
  {
    label: 'Full-look first impression review',
    directive: 'show the complete outfit/product silhouette, proportion, color, and immediate fit impression.',
  },
  {
    label: 'Fit and proportion review',
    directive: 'review waist/shoulder/hip/length/overall sizing cues with a calm pose change.',
  },
  {
    label: 'Material and detail review',
    directive: 'review fabric texture, seams, trims, closure, strap, collar, hem, or hardware details on the worn product.',
  },
  {
    label: 'Movement and comfort review',
    directive: 'review drape, stretch, walkability, arm/leg movement, and practical wearing comfort.',
  },
  {
    label: 'Side/backline silhouette review',
    directive: 'review side profile, backline, drape fall, and body-line proof without losing face/product readability.',
  },
  {
    label: 'Styling verdict review',
    directive: 'close with a practical styling verdict, use-case cue, and confident product-readable final pose.',
  },
] as const

function getOotdTemplateSceneReviewStyle(index: number): typeof OOTD_TEMPLATE_SCENE_REVIEW_STYLES[number] {
  return OOTD_TEMPLATE_SCENE_REVIEW_STYLES[index % OOTD_TEMPLATE_SCENE_REVIEW_STYLES.length]
}

function buildOotdTemplateSceneReviewStylePlan(sceneCount: number): string {
  return Array.from({ length: sceneCount }, (_, index) => {
    const style = getOotdTemplateSceneReviewStyle(index)
    return `Scene ${index + 1}: ${style.label} - ${style.directive}`
  }).join('\n')
}

function appendOotdTemplateSilentFitCheckPerformance(value: string): string {
  return appendSentenceIfMissing(
    value,
    'Fit-check only performance: mouth stays relaxed and closed at rest, with calm visual posing instead of speech-like delivery.',
  )
}

function buildOotdTemplateSilentFitCheckVeoLocks(isMirrorPhoneTemplate: boolean): string[] {
  return [
    OOTD_TEMPLATE_SILENT_FIT_CHECK_PERFORMANCE_LOCK,
    isMirrorPhoneTemplate
      ? 'FORMAT LOCK: mirror phone outfit fit-check only, focused on outfit readability, fabric/detail proof, and controlled mirror posing.'
      : 'FORMAT LOCK: front-camera outfit fit-check only, focused on outfit readability, fabric/detail proof, and controlled body posing.',
    OOTD_TEMPLATE_SILENT_FIT_CHECK_AUDIO_LOCK,
    OOTD_TEMPLATE_SILENT_FIT_CHECK_NEGATIVE_PROMPT,
  ]
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
  backgroundImage: string | null,
  duration: number,
  aspectRatio: string,
  notes: string,
  contentType: ContentType = 'ootd',
  usedLocationsForProduct: string[] = [],
  usedLocationsByOutfitType: OutfitTypeLocationHistoryMap = {},
  affiliateMode: AffiliateMode = 'balanced',
  salesTemplate: SalesTemplate = 'hard',
  poseDirectionLock: LookbookPoseDirectionLock = 'auto',
  productCategory: ProductCategory = 'auto',
): Promise<GenerateResult> {
  const durationInfo = DURATIONS.find(d => d.value === duration)!
  const { scenes: sceneCount, keyframes: keyframeCount } = durationInfo

  // Determine final content type (if 'auto', AI will decide)
  const isAuto = contentType === 'auto'
  const contentTypeForPrompt = isAuto ? '(AI will automatically determine the best type)' : contentType.toUpperCase()
  const affiliateModeLabel = affiliateMode === 'strict' ? 'STRICT' : 'BALANCED'
  const salesTemplateLabel = salesTemplate === 'hard' ? 'HARD_SELL (A)' : 'SOFT_SELL (B)'
  const affiliateObjective = isAuto
    ? 'In AUTO mode, prioritize types that improve affiliate conversion for women fashion (tiktokshop, boutiquefeed, outfitideas, ootd, ootdmirror, review) before generic viral framing.'
    : AFFILIATE_VIDEO_OBJECTIVES[contentType as ResolvedContentType]
  const autoModeRule = affiliateMode === 'strict'
    ? 'STRICT AUTO MODE: only allow conversion-oriented types (tiktokshop, boutiquefeed, outfitideas, review, ootd, ootdmirror). If uncertain, default to tiktokshop.'
    : 'BALANCED AUTO MODE: allow broader creative variety but still prioritize conversion-friendly fashion formats.'
  const normalizedProductCategory = normalizeProductCategory(productCategory, 'auto')
  const selectedProductCategoryOption = PRODUCT_CATEGORY_OPTIONS.find((item) => item.value === normalizedProductCategory)
  const selectedProductCategoryGroup = selectedProductCategoryOption?.group || 'all'
  const hasExplicitProductCategoryLock = normalizedProductCategory !== 'auto' && Boolean(selectedProductCategoryOption)
  const productCategoryLabel = selectedProductCategoryOption?.label || 'Auto Boutique'
  const productCategoryDetailHint = selectedProductCategoryOption?.detailHint || ''
  const isTikTokAnalysisReferenceMode = /\[TIKTOK ANALYSIS REFERENCE\]/i.test(notes)
  const productCategoryHeroByGroup: Record<ProductCategoryGroup, string> = {
    all: 'selected product from the product reference image',
    tops: 'selected topwear product from the product reference image',
    bottoms: 'selected bottomwear product from the product reference image',
    dresses: 'selected dress product from the product reference image',
    skirts: 'selected skirt product from the product reference image',
    outerwear: 'selected outerwear product from the product reference image',
    loungewear_sleepwear: 'selected loungewear/sleepwear product from the product reference image',
    lingerie_swimwear: 'selected lingerie/swimwear product from the product reference image',
    activewear: 'selected activewear product from the product reference image',
    traditional_festive: 'selected traditional/festive product from the product reference image',
    accessories_footwear: 'selected accessory/footwear product from the product reference image',
  }
  const productCategoryReviewFocusByGroup: Record<ProductCategoryGroup, string> = {
    all: 'Review exactly the selected product from the product image with clear fit/material/detail proof.',
    tops: 'Review topwear proof points from the product image: neckline/strap/sleeve/cut, bust fit, fabric texture, and upper-body movement.',
    bottoms: 'Review bottomwear proof points from the product image: waistband, rise, hip-thigh fit, leg silhouette, drape, and movement.',
    dresses: 'Review dress proof points from the product image: neckline, waist shaping, silhouette, length, hemline, drape, and movement.',
    skirts: 'Review skirt proof points from the product image: waistline, silhouette/cut, length, hemline, pleats/slit, drape, and movement.',
    outerwear: 'Review outerwear proof points from the product image: shoulder fit, layering room, closure details, material structure, and movement comfort.',
    loungewear_sleepwear: 'Review loungewear/sleepwear proof points from the product image: softness, comfort fit, stretch, and day-night wearability.',
    lingerie_swimwear: 'Review lingerie/swimwear proof points from the product image: support/coverage, strap/cup fit, stretch recovery, and comfort in motion.',
    activewear: 'Review activewear proof points from the product image: compression/support zones, stretch, sweat-friendly comfort, and movement stability.',
    traditional_festive: 'Review traditional/festive proof points from the product image: cultural silhouette fidelity, material details, fit, and movement elegance.',
    accessories_footwear: 'Review accessory/footwear proof points from the product image: structure, comfort, finish details, and practical wear use-cases.',
  }
  const productCategoryHeroLabel = hasExplicitProductCategoryLock
    ? (productCategoryHeroByGroup[selectedProductCategoryGroup] || selectedProductCategoryOption?.label || 'selected product from the product reference image')
    : 'auto'
  const productCategoryReviewFocusText = hasExplicitProductCategoryLock
    ? productCategoryReviewFocusByGroup[selectedProductCategoryGroup] || productCategoryReviewFocusByGroup.all
    : ''
  const productCategoryFocusRules = hasExplicitProductCategoryLock
    ? `PRODUCT CATEGORY FOCUS LOCK (MANDATORY):
- Selected category is locked: ${productCategoryLabel} (${normalizedProductCategory.toUpperCase()}).
- Determine hero product by selected category using the PRODUCT reference image, not by whichever garment appears largest.
- Treat ${productCategoryHeroLabel} as the only review hero product in all keyframes and scenes.
- If reference images include multiple garments, keep non-selected garments as styling context only and never describe them as the featured product.
- ${productCategoryDetailHint ? `Category detail anchor: ${productCategoryDetailHint}` : 'Category detail anchor: use selected category cues visible in the product image.'}
- Category review focus: ${productCategoryReviewFocusText}`
    : 'PRODUCT CATEGORY FOCUS MODE: AUTO (no explicit category lock).'
  const productCategoryFocusSentence = hasExplicitProductCategoryLock
    ? `Hero review product: ${productCategoryLabel}, extracted from the product reference image.`
    : ''
  const productCategoryReviewFocusSentence = hasExplicitProductCategoryLock
    ? `Category review focus: ${productCategoryReviewFocusText}`
    : ''
  const normalizedUserNotes = normalizePromptWhitespace(notes)
  const hasUserNotesIntentLock = normalizedUserNotes.length > 0
  const userNotesIntentAnchor = hasUserNotesIntentLock
    ? normalizedUserNotes.slice(0, 320)
    : ''
  const userIntentPriorityStepRules = `USER INTENT PRIORITY STEP (MANDATORY ORDER):
- Step 1: USER NOTES explicit requirements are primary intent.
- Step 2: PRODUCT CATEGORY lock (when active) must remain hero-product focus while applying Step 1.
- Step 3: Default creative/type/template/style rules apply only to dimensions not specified by Steps 1-2.
- Step 4: Fallback heuristics apply only when Steps 1-3 are silent.
- Conflict order: Step 1 > Step 2 > Step 3 > Step 4.
- Non-negotiable constraints remain unchanged: schema integrity + Rules 1, 2, 12, 15, 31.`
  const userIntentPriorityStepSummary = hasUserNotesIntentLock
    ? `Priority anchor from USER NOTES: ${userNotesIntentAnchor}`
    : 'Priority anchor from USER NOTES: none (use category lock/default rules).'
  const tiktokAnalysisReferenceLockRules = isTikTokAnalysisReferenceMode
    ? `TIKTOK SCRIPT TRANSFER LOCK (MANDATORY):
- Use analyzed TikTok video only as script/beat/camera-rhythm reference.
- Never copy product identity/outfit details from analyzed video.
- Hero product and review evidence must come from current input product image and selected category lock.`
    : 'TIKTOK SCRIPT TRANSFER LOCK: inactive.'
  const tiktokAnalysisReferenceLockSentence = isTikTokAnalysisReferenceMode
    ? 'TikTok analysis is structure-only reference; product review must stay anchored to the current input product image.'
    : ''
  const hasBackgroundLocationReference = Boolean(backgroundImage)
  const backgroundLocationReferenceRules = hasBackgroundLocationReference
    ? `BACKGROUND LOCATION REFERENCE LOCK (OPTIONAL WHEN PROVIDED):
- A background reference image is provided and should be used as location/environment guidance only.
- Prioritize venue cues, spatial depth, and lighting mood from the background reference when selecting LOCATION.
- Never copy people, garments, logos, or product identity from background reference; hero product still comes from PRODUCT reference image.
- If background reference conflicts with USER NOTES, USER NOTES take priority.`
    : 'BACKGROUND LOCATION REFERENCE LOCK: inactive (no background reference image provided).'
  const hasVideoPoseDirectionLock = poseDirectionLock !== 'auto'
  const videoPoseDirectionLockText = hasVideoPoseDirectionLock
    ? poseDirectionLock.toUpperCase()
    : 'AUTO'
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
  const allowLocationTransitionsByNotes = shouldAllowLocationTransitionsFromNotes(notes)
  const planningLocationContinuityRule = allowLocationTransitionsByNotes
    ? '- [COMMON] USER NOTES explicitly request location transitions: allow controlled multi-location progression with clear continuity cues across adjacent scenes.'
    : '- [COMMON] Choose ONE primary location and keep it consistent across all keyframes/scenes.'
  const requestedTypeTrendAlignmentRules = isAuto
    ? `- AUTO mode: prefer high-adoption women-fashion clusters (OOTD / OutfitIdeas / Fitcheck / TikTok Shop proof) before niche labels.
- Do not choose FYP-style generic framing as a primary fashion identity.
- If a niche internal label is selected, map to natural public-facing hashtag behavior.`
    : buildTikTokTrendAlignmentRules(contentType as ResolvedContentType)
  const requestedFitModelLockRules = isAuto
    ? `- AUTO mode: choose content type first, then lock fit-model framing by that resolved type.
${buildFitModelRuleLockMatrix()}`
    : buildFitModelRuleLockInstructions(
      contentType as ResolvedContentType,
      getFitModelRuleLock(contentType as ResolvedContentType),
    )
  const boutiqueFeedChannelBenchmark = (isAuto || contentType === 'boutiquefeed')
    ? BOUTIQUE_FEED_CHANNEL_BENCHMARK
    : ''
  const safeJsonStringify = (value: unknown) => {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return '{}'
    }
  }
  const sharedGeminiAgentRuntimeNotes = [
    `Duration ${duration}s, aspect ratio ${aspectRatio}, requested content type ${contentTypeForPrompt}.`,
    `Product category mode: ${hasExplicitProductCategoryLock ? `LOCKED ${productCategoryLabel}` : 'AUTO'}.`,
    hasBackgroundLocationReference
      ? 'Background image is available as environment guidance only.'
      : 'No background image; select contextual locations from library/defaults.',
    hasUserNotesIntentLock
      ? 'User notes are active and must drive creative decisions before defaults.'
      : 'No user notes; use skill defaults and selected content type.',
  ]
  const visualExtractAgentSkillBlock = buildGeminiAgentSkillBlock({
    stage: 'visual_extract',
    skillIds: ['reference-lock', 'safety-policy', 'schema-qa'],
    outputContract: 'strict garment/identity/background analysis JSON',
    runtimeNotes: sharedGeminiAgentRuntimeNotes,
  })
  const creativePlanAgentSkillBlock = buildGeminiAgentSkillBlock({
    stage: 'creative_plan',
    skillIds: [
      'reference-lock',
      'user-intent-priority',
      'fashion-affiliate-strategy',
      'creative-director-controls',
      'location-context',
      'veo-prompting-guide',
      'realtime-web-visualization',
      'veo-fast-iteration',
      'veo-continuity',
      'safety-policy',
      'schema-qa',
    ],
    outputContract: 'strict planning JSON with recommended content type, story arc, location candidates, camera, lighting, mustInclude, avoid',
    runtimeNotes: sharedGeminiAgentRuntimeNotes,
  })

  const pipelineStartedAt = Date.now()
  const stageMetrics: Array<{ stage: string; attempt: number; durationMs: number; ok: boolean; note?: string }> = []
  const validResolvedTypes: ResolvedContentType[] = ['ootd', 'ootdmirror', 'grwm', 'outfitideas', 'fyp', 'review', 'tiktokshop', 'boutiquefeed', 'athleisure', 'haul', 'styling', 'luxury', 'streetstyle', 'sunnyaura', 'partyoutfit']
  const faceImageId = faceImage ? createProductImageId(faceImage) : 'none'
  const productImageId = productImage ? createProductImageId(productImage) : 'none'
  const backgroundImageId = backgroundImage ? createProductImageId(backgroundImage) : 'none'
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
      if (normalizeFacingDirectionToken(item.facingDirection) !== 'unknown') score += 1
      if (toSafeText(item.location).length > 0) score += 1
      if (toSafeText(item.camera).length > 0) score += 1
      if (toSafeText(item.lighting).length > 0) score += 1
      if (toSafeText(item.style).length > 0) score += 1
      return acc + score / 6
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

  if (backgroundImage) {
    const base64 = backgroundImage.split(',')[1] || backgroundImage
    referenceParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    })
    referenceParts.push({
      text: 'BACKGROUND LOCATION REFERENCE: use this image for environment/location cues only. Do not copy people/garments/logos from this image as product identity.',
    })
  }

  try {
    // STAGE 1 — VISUAL EXTRACT
    const visualExtractPrompt = `You are a senior fashion vision analyst.

Analyze the provided face + garment + optional background-location references and return STRICT JSON only:
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

${visualExtractAgentSkillBlock}

Rules:
- Be concrete and concise.
- Do not invent unavailable details.
- Focus on preserving identity and garment fidelity.
- ${backgroundLocationReferenceRules}
- ${hasExplicitProductCategoryLock
  ? `Category lock is ACTIVE: ${productCategoryLabel} (${normalizedProductCategory.toUpperCase()}). If references contain multiple garments, set garmentFacts for this selected category as hero product and treat other pieces as supporting context only.`
  : 'Category lock is AUTO: infer primary garment category from references.'}
- ${tiktokAnalysisReferenceLockRules}
${notes ? `USER NOTES: ${notes}` : ''}`

    const visualExtractCacheKey = JSON.stringify({
      model,
      faceImageId,
      productImageId,
      backgroundImageId,
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
- Product category hint: ${productCategoryLabel} (${normalizedProductCategory.toUpperCase()})
- Product category lock state: ${hasExplicitProductCategoryLock ? 'LOCKED' : 'AUTO'}
- Background location reference: ${hasBackgroundLocationReference ? 'PROVIDED (environment/location guidance only)' : 'NOT PROVIDED'}
- Diversity seed: ${diversitySeed}

${creativePlanAgentSkillBlock}

${productCategoryFocusRules}
${tiktokAnalysisReferenceLockRules}
${backgroundLocationReferenceRules}

VISUAL ANALYSIS JSON:
${safeJsonStringify(visualAnalysis)}

LOCATIONS ALREADY USED FOR THIS PRODUCT IMAGE ID (MUST AVOID REUSE):
${usedLocationsProductPrompt}

LOCATIONS ALREADY USED FOR SAME OUTFIT TYPE (MUST AVOID REUSE):
${usedLocationsOutfitTypePrompt}

OBSERVED TIKTOK FASHION BASELINES:
${TIKTOK_OBSERVED_SIGNAL_BASELINE}

${boutiqueFeedChannelBenchmark ? `BOUTIQUE FEED CHANNEL SNAPSHOT (REFERENCE):
${boutiqueFeedChannelBenchmark}
` : ''}

REQUESTED TYPE TREND ALIGNMENT:
${requestedTypeTrendAlignmentRules}

TIKTOK FIT-MODEL SIGNAL BASELINE:
${TIKTOK_FIT_MODEL_SIGNAL_BASELINE}

FIT-MODEL LOCK FOR REQUESTED/RECOMMENDED TYPE (DEFAULT; SUBORDINATE TO USER NOTES):
${requestedFitModelLockRules}

NATURALITY GUARDRAILS (DEFAULT; SUBORDINATE TO USER NOTES):
${NATURALITY_PROMPT_GUARDRAILS}

HAND / ANATOMY CONSISTENCY GUARDRAILS (DEFAULT; SUBORDINATE TO USER NOTES):
${HAND_ANATOMY_GUARDRAILS}

OOTDMIRROR REAR-MIRROR CAMERA LOCK (APPLIES WHEN TYPE=OOTDMIRROR):
${OOTDMIRROR_REAR_MIRROR_GUARDRAILS}

VEO 3.1 INTERPOLATION SAFETY GUARDRAILS:
${VEO_INTERPOLATION_GUARDRAILS}

CELEBRITY / REAL-PERSON SAFETY GUARDRAILS (MANDATORY):
${CELEBRITY_POLICY_GUARDRAILS}

LOCKED LOCATION LIBRARY (MANDATORY - choose only from this list):
${LOCKED_LOCATION_LIBRARY_PROMPT_LIST}

USER NOTES (HIGHEST PRIORITY WHEN PROVIDED):
${notes ? notes : 'None'}

${userIntentPriorityStepRules}
${userIntentPriorityStepSummary}

USER NOTES OVERRIDE CONTRACT (APPLIES TO THIS PLANNING STAGE):
- If USER NOTES conflict with default style/template/trend/type guidance, USER NOTES win.
- Above guidance blocks are defaults, not hard creative constraints, when USER NOTES explicitly specify alternatives.
- Non-negotiable constraints only: valid JSON schema, interpolation continuity safety (Rules 1, 2, 12), location library lock (Rule 15), and celebrity/public-figure safety (Rule 31).

RULES:
- [COMMON] LOCATION LIBRARY LOCK: choose locations only from LOCKED LOCATION LIBRARY above; do not invent new location strings.
- [COMMON] Avoid reusing any location in history lists above.
${planningLocationContinuityRule}
- [COMMON] Follow retention arc: Hook -> Value -> Proof -> Close.
- [COMMON] Keep action/camera progression in small adjacent deltas to reduce first-last-frame interpolation artifacts.
- [COMMON] USER NOTES PRIORITY: if user notes are provided, always apply user intent first; default guidance may be used only for dimensions user notes do not specify.
- [COMMON] PRODUCT CATEGORY LOCK: when category lock is active, selected category is the hero product; non-selected garments are styling context only.
- [COMMON] TIKTOK SCRIPT TRANSFER LOCK: when active, use analyzed TikTok video as structure-only reference; product identity/review details must come from current input product image.
- [COMMON] For detail-sensitive garments (for example backless/strappy/multi-strap), avoid forced full-direction cycling; prefer stable facing continuity and controlled pivots.
- [TYPE=OOTDMIRROR] Enforce mirror-fitcheck setup across all scenes.
- [TYPE=OOTD] Enforce single-corner contextual studio setup across all scenes (no plain seamless background).
- [TYPE=OUTFITIDEAS] Default to practical mix-and-match lookbook flow in a contextual studio/social setting; use mirror-fitcheck only when user notes explicitly request mirror or fitcheck.
- [TYPE=BOUTIQUEFEED] Enforce boutique review cadence: short hook caption energy, fit/material proof, trust-first verdict, concise hashtag-ready framing.
- [TYPE-SPECIFIC] If the content type label is niche/internal, map execution to stronger natural TikTok behavior clusters.
- [TYPE-SPECIFIC] Lock fit-model framing by final content type using one of: strict_full_body | majority_full_body | balanced_full_body_proof.
- Do not restate guardrail blocks above; treat them as fallback defaults, subordinate to USER NOTES except non-negotiable constraints.

Output STRICT JSON only:
{
  ${isAuto ? '"recommendedContentType": "ootd|ootdmirror|grwm|outfitideas|fyp|review|tiktokshop|boutiquefeed|athleisure|haul|styling|luxury|streetstyle|sunnyaura|partyoutfit",' : '"recommendedContentType": "same-as-requested",'}
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
      backgroundImageId,
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
    const hasUserNotesPriority = notes.trim().length > 0
    const relaxHardRulesByNotes = hasUserNotesPriority && !hasVideoPoseDirectionLock
    const styleLockResolution = resolveStyleLockWithUserNotes(finalResolvedType, notes)
    const finalStyleLock = styleLockResolution.styleLock
    const isStyleLockOverriddenByNotes = styleLockResolution.overriddenByNotes
    const enforceSinglePrimaryLocation = !allowLocationTransitionsByNotes && !relaxHardRulesByNotes
    const fitModelRuleLock = getFitModelRuleLock(finalResolvedType)
    const effectiveFitModelRuleLock = relaxHardRulesByNotes
      ? softenFitModelRuleLockForUserNotes(fitModelRuleLock)
      : fitModelRuleLock
    const fitModelRuleRelaxationNote = relaxHardRulesByNotes && effectiveFitModelRuleLock !== fitModelRuleLock
      ? `USER NOTES RELAXATION ACTIVE: downgrade fit-model lock from ${fitModelRuleLock} to ${effectiveFitModelRuleLock}; preserve silhouette readability but allow user-requested action flexibility.`
      : ''
    const fitModelRuleLockInstructions = buildFitModelRuleLockInstructions(finalResolvedType, effectiveFitModelRuleLock)
      + (fitModelRuleRelaxationNote ? `\n- ${fitModelRuleRelaxationNote}` : '')
    const fitModelRuleLockRepairHint = buildFitModelRuleLockRepairHint(finalResolvedType, effectiveFitModelRuleLock)
    const fitModelRuleLockModeLabel = relaxHardRulesByNotes
      ? `${fitModelRuleLock} -> ${effectiveFitModelRuleLock} (USER NOTES RELAXED)`
      : `${effectiveFitModelRuleLock} (DEFAULT)`
    const contentTypeNativeSignalRules = buildTikTokNativeSignalRules(finalResolvedType)
    const finalTypeTrendAlignmentRules = buildTikTokTrendAlignmentRules(finalResolvedType)
    const boutiqueFeedChannelBenchmarkForFinal = finalResolvedType === 'boutiquefeed'
      ? BOUTIQUE_FEED_CHANNEL_BENCHMARK
      : ''
    const detailSensitiveSignalValues: string[] = [
      visualAnalysis.garmentFacts.category,
      visualAnalysis.garmentFacts.material,
      visualAnalysis.garmentFacts.silhouette,
      ...visualAnalysis.garmentFacts.keyDetails,
      ...visualAnalysis.garmentFacts.doNotAlter,
      ...visualAnalysis.riskFlags,
      notes,
    ]
    const isDetailSensitiveByCategory = isDetailSensitiveProductCategory(normalizedProductCategory)
    const isDetailSensitiveBySignals = hasDetailSensitiveGarmentSignal(detailSensitiveSignalValues)
    const hasDetailSensitiveGarment = isDetailSensitiveByCategory || isDetailSensitiveBySignals
    const usesDetailSensitiveFacingMode = !hasVideoPoseDirectionLock && hasDetailSensitiveGarment
    const detailSensitiveFacingReason = isDetailSensitiveByCategory && isDetailSensitiveBySignals
      ? 'category + visual signals'
      : isDetailSensitiveByCategory
        ? 'category'
        : isDetailSensitiveBySignals
          ? 'visual signals'
          : 'none'
    const detailSensitiveFacingModeLabel = usesDetailSensitiveFacingMode
      ? `ACTIVE (${detailSensitiveFacingReason})`
      : 'INACTIVE'
    const hasLongDurationDirectionalMode = duration >= 32 && !hasVideoPoseDirectionLock && !usesDetailSensitiveFacingMode && !relaxHardRulesByNotes
    const longDurationDirectionalModeLabel = hasLongDurationDirectionalMode
      ? `ACTIVE (duration=${duration}s)`
      : 'INACTIVE'
    const enforcesOotdMirrorFrontFaceQuarterLock = finalResolvedType === 'ootdmirror'

    const facingRuleForGenerationPrompt = enforcesOotdMirrorFrontFaceQuarterLock
      ? `32. OOTDMIRROR FACE-FRONT + 3/4 BODY LOCK (HIGHEST PRIORITY) — Apply this lock to every keyframe.
  - Face orientation is locked front toward camera on all beats.
  - Body-facing is restricted to only "three-quarter-left" or "three-quarter-right".
  - Do NOT use "back", "left", or "right" as final facingDirection outputs for OOTDMIRROR.
  - ACTION text must stay consistent with 3/4 body orientation and must explicitly forbid full back turns.
  - If any upstream step suggests full back-facing, remap to the nearest gentle 3/4 angle.
  [ALWAYS ENFORCED FOR OOTDMIRROR]`
      : hasVideoPoseDirectionLock
      ? `32. VIDEO POSE-DIRECTION USER LOCK (OVERRIDE) — Apply the user lock across the full video.
  - Every keyframe MUST set facingDirection to "${poseDirectionLock}".
  - ACTION text must be consistent with facingDirection and must not contain conflicting direction phrases (for example: "back-facing" while FACING is "front").
  - Adjacent keyframes are allowed to keep the same facingDirection while this lock is active.
  - This user lock overrides the default alternation behavior of Rule 32.
  [ALWAYS ENFORCED WHEN USER LOCK IS ACTIVE]`
      : usesDetailSensitiveFacingMode
        ? `32. DETAIL-SENSITIVE GARMENT FACING LOCK — Activated for complex garments (backless/strappy/multi-strap/lace-up details) to reduce Veo 3.1 detail drift.
  - Do NOT force full 360-degree body-direction cycling across keyframes.
  - Keep a stable facing anchor for 2-3 adjacent keyframes whenever needed to preserve product detail fidelity.
  - Preferred facing set: "front", "three-quarter-left", "three-quarter-right".
  - Use full "back" or hard side views only when product-proof intent explicitly requires it.
  - Direction changes must be small controlled pivots; avoid abrupt opposite flips in consecutive keyframes.
  - ACTION text and facingDirection token must stay consistent on every keyframe.
  [AUTO ENFORCED FOR DETAIL-SENSITIVE GARMENTS]`
      : relaxHardRulesByNotes
        ? `32. USER-NOTES RELAXED FACING MODE — When user notes are present, prioritize user-described movement flow over rigid direction cycling.
  - Keep facingDirection explicit when available, but allow short same-facing holds if they support user-requested choreography.
  - Do not inject forced turn/pivot language unless continuity would break without it.
  - Keep transitions physically plausible and avoid abrupt opposite flips.
  [AUTO ENFORCED WHEN USER NOTES ARE PROVIDED]`
      : hasLongDurationDirectionalMode
        ? `32. LONG-DURATION DIRECTION CLARITY LOCK (>=32s) — For timeline stability, every keyframe must have explicit and readable body-facing direction.
  - ACTION text and facingDirection token must align exactly on every keyframe.
  - Follow stable long-form facing progression: front -> three-quarter-left -> front -> three-quarter-right -> left -> front -> right (loop if needed).
  - Include at least two left-family keyframes ("three-quarter-left" or "left") across the full package.
  - Avoid abrupt opposite 180-degree flips; use controlled pivots between adjacent keyframes.
  - Goal: maximize face consistency and garment-detail continuity for Veo interpolation on longer outputs.
  [AUTO ENFORCED FOR DURATION >= 32s]`
      : `32. CONSECUTIVE KEYFRAME FACING DIRECTION LOCK — Two adjacent keyframes MUST NOT place the subject facing the same body direction (e.g., both fully front-facing, both fully side-facing, both fully rear-facing). Every keyframe transition must include a discernible body turn or pivot.
  - For each keyframe, provide explicit body-facing intent in both action text and facingDirection token.
  - Allowed facingDirection tokens: "front", "back", "left", "right", "three-quarter-left", "three-quarter-right".
  - Adjacent keyframes must never repeat the same facingDirection token.
  - Reason: Veo 3.1 interpolates between frames but has zero reference for the garment back side; repeated same-direction framing forces hallucination of unknown back-of-garment details, causing severe outfit inconsistency.
  - Hand anatomy lock for mirror turns: preserve exactly two hands and five fingers per hand across adjacent keyframes; no fused/missing/extra fingers, no duplicated palms, and no hand-through-skirt artifacts.
  - If the narrative requires a held direction, break it with a slight 3/4 pivot before continuing.
  [DEFAULT ENFORCEMENT — subordinate to Rule 30 when user notes explicitly require a different safe direction pattern]`
    const facingRuleForQaRepair = enforcesOotdMirrorFrontFaceQuarterLock
      ? 'Enforce OOTDMIRROR lock: face must stay front-facing, body must stay gentle three-quarter-left/right only, and no keyframe may use full back-facing direction.'
      : hasVideoPoseDirectionLock
      ? `Enforce video pose-direction lock: all keyframes must keep facingDirection "${poseDirectionLock}" and ACTION text must stay direction-consistent with that lock.`
      : usesDetailSensitiveFacingMode
        ? 'Enforce detail-sensitive facing mode: keep a stable facing anchor for complex-garment fidelity, avoid forced full-direction cycling, and use only controlled micro-pivots when direction changes are required.'
      : relaxHardRulesByNotes
        ? 'Enforce user-notes relaxed facing mode: preserve user-intended movement flow, allow short same-facing holds, and only fix transitions that are physically implausible.'
        : hasLongDurationDirectionalMode
          ? 'Enforce long-duration direction clarity (>=32s): every keyframe must carry explicit matching ACTION/FACING direction, include at least two left-family beats (three-quarter-left or left), and follow stable front/3-4 progression without abrupt opposite flips.'
        : 'Enforce Rule 32: adjacent keyframes must show different body-facing directions (turn/pivot required between every consecutive KF pair); never repeat same facing to avoid Veo 3.1 garment-back hallucination.'
    const facingRuleForMotionRepair = enforcesOotdMirrorFrontFaceQuarterLock
      ? 'Enforce OOTDMIRROR motion lock: maintain front-facing face readability with only gentle three-quarter-left/right body pivots and block any full back-facing turn language.'
      : hasVideoPoseDirectionLock
      ? `Enforce video pose-direction lock: keep all keyframes facing "${poseDirectionLock}" and remove any conflicting direction phrases from ACTION text.`
      : usesDetailSensitiveFacingMode
        ? 'Enforce detail-sensitive continuity: allow stable same-facing holds for fidelity, avoid abrupt opposite direction jumps, and keep direction changes as small controlled pivots with explicit facingDirection tags.'
      : relaxHardRulesByNotes
        ? 'Enforce user-notes relaxed facing continuity: keep user-requested flow and only correct abrupt or physically implausible direction jumps.'
        : hasLongDurationDirectionalMode
          ? 'Enforce long-duration continuity (>=32s): preserve explicit matching facing tags per keyframe, keep controlled pivots, maintain at least two left-family beats, and avoid opposite-direction jumps that break facial/garment consistency.'
        : 'Enforce facing continuity lock: consecutive keyframes must not repeat the same body-facing direction; include explicit turn/pivot cues and facingDirection token per keyframe.'

    const affiliateObjectiveForFinal = AFFILIATE_VIDEO_OBJECTIVES[finalResolvedType]
    const usedLocationsForFinalOutfitType = normalizedUsedLocationsByOutfitType[finalResolvedType] || []
    const blockedLocationKeys = new Set(
      [...normalizedUsedLocationsForProduct, ...usedLocationsForFinalOutfitType]
        .map((location) => normalizeLocationKey(location))
    )

    const isLocationStructurallyValid = (location: string) => {
      const candidate = location.trim()
      if (candidate.length === 0) return false

      const resolvedCandidate = resolveLockedLocationEntry(candidate)
      if (!resolvedCandidate) return false

      return (
        !isTikTokRestrictedFlatBackgroundLocation(resolvedCandidate)
        && (relaxHardRulesByNotes || matchesStyleLockForLocation(resolvedCandidate, finalStyleLock))
      )
    }

    const isLocationCandidateAllowed = (location: string) => {
      const candidate = location.trim()
      if (candidate.length === 0) return false

      const resolvedCandidate = resolveLockedLocationEntry(candidate)
      if (!resolvedCandidate) return false

      const candidateKey = normalizeLocationKey(resolvedCandidate)

      return (
        isLocationStructurallyValid(resolvedCandidate)
        && !blockedLocationKeys.has(candidateKey)
      )
    }

    const EMERGENCY_PRIMARY_LOCATIONS_BY_STYLE: Record<ContentStyleLock, string[]> = {
      studio: [...LOCKED_LOCATION_STUDIO_POOL],
      mirror: [...LOCKED_LOCATION_MIRROR_POOL],
      flex: [...LOCKED_LOCATION_FLEX_POOL],
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

        const resolvedLocation = resolveLockedLocationEntry(location)
        if (!resolvedLocation) {
          return { ok: false, reason: `keyframe[${i}] location is not in locked location library` }
        }

        if (isTikTokRestrictedFlatBackgroundLocation(resolvedLocation)) {
          return { ok: false, reason: `keyframe[${i}] location uses restricted flat/plain background` }
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

        const resolvedLocation = resolveLockedLocationEntry(location)
        if (!resolvedLocation) {
          return { ok: false, reason: `keyframe[${i}] location is not in locked location library` }
        }

        if (isTikTokRestrictedFlatBackgroundLocation(resolvedLocation)) {
          return { ok: false, reason: `keyframe[${i}] location uses restricted flat/plain background` }
        }

        if (!isLocationCandidateAllowed(resolvedLocation)) {
          return { ok: false, reason: `keyframe[${i}] location blocked by history constraints` }
        }

        if (!relaxHardRulesByNotes && !matchesStyleLockForLocation(resolvedLocation, finalStyleLock)) {
          return { ok: false, reason: `keyframe[${i}] location violates style lock ${finalStyleLock}` }
        }
      }

      if (enforceSinglePrimaryLocation) {
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
        const explicitFacingToken = normalizeFacingDirectionToken(keyframe.facingDirection)
        const actionFacingToken = normalizeFacingDirectionToken(action)

        if (strict && !relaxHardRulesByNotes && explicitFacingToken === 'unknown') {
          return { ok: false, reason: `keyframe[${i}] missing explicit facingDirection token for Rule 32` }
        }

        if (
          strict
          && !relaxHardRulesByNotes
          && explicitFacingToken !== 'unknown'
          && actionFacingToken !== 'unknown'
          && explicitFacingToken !== actionFacingToken
        ) {
          return {
            ok: false,
            reason: `keyframe[${i}] has ACTION/FACING conflict (${actionFacingToken} vs ${explicitFacingToken})`,
          }
        }

        if (containsMotionDiscontinuityKeyword(action) || containsMotionDiscontinuityKeyword(camera)) {
          return { ok: false, reason: `keyframe[${i}] contains discontinuity keyword` }
        }

        const families = detectCameraMotionFamilies(camera)
        const maxFamilyCount = strict && isAllowedHybridCameraMotion(camera) ? 2 : (strict ? 1 : 2)
        if (families.length > maxFamilyCount) {
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

        const previousConcreteFacing = isConcreteFacingDirection(previousFacingDirection)
          ? previousFacingDirection
          : null
        const currentConcreteFacing = isConcreteFacingDirection(currentFacingDirection)
          ? currentFacingDirection
          : null
        const enforceAlternatingFacing = !hasVideoPoseDirectionLock && !usesDetailSensitiveFacingMode && !relaxHardRulesByNotes

        if (
          enforceAlternatingFacing
          && previousConcreteFacing
          && currentConcreteFacing
          && previousConcreteFacing === currentConcreteFacing
        ) {
          return {
            ok: false,
            reason: `keyframe[${i - 1}] and keyframe[${i}] share same facing direction (${currentFacingDirection}); Rule 32 requires a turn/pivot`,
          }
        }

        const hasTurnCue = hasKeyframeTurnCue(previousAction, previousCamera, currentAction, currentCamera)

        if (
          strict
          &&
          enforceAlternatingFacing
          &&
          !hasTurnCue
          && (previousFacingDirection === 'unknown' || currentFacingDirection === 'unknown')
        ) {
          return {
            ok: false,
            reason: `keyframe[${i - 1}] -> keyframe[${i}] lacks explicit turn cue/facing change for Rule 32`,
          }
        }

        if (
          strict
          && usesDetailSensitiveFacingMode
          && previousConcreteFacing
          && currentConcreteFacing
          && isOppositeFacingDirection(previousConcreteFacing, currentConcreteFacing)
        ) {
          return {
            ok: false,
            reason: `keyframe[${i - 1}] -> keyframe[${i}] uses abrupt opposite facing (${previousConcreteFacing} -> ${currentConcreteFacing}) in detail-sensitive mode`,
          }
        }
      }

      if (hasLongDurationDirectionalMode) {
        const leftFamilyCount = keyframes.reduce((count, item) => {
          const keyframe = asRecord(item) ? item as Record<string, unknown> : null
          if (!keyframe) return count

          const action = toSafeText(keyframe.action, '')
          const camera = toSafeText(keyframe.camera, '')
          const facing = extractKeyframeFacingDirection(action, camera, keyframe.facingDirection)

          return isLeftFamilyFacingDirection(facing) ? count + 1 : count
        }, 0)

        if (leftFamilyCount < 2) {
          return {
            ok: false,
            reason: `long-duration mode requires at least 2 left-family keyframes, found ${leftFamilyCount}`,
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

        if (strict) {
          const parsedCameraSpec = parseSceneCameraMovementSpec(cameraMovement)
          if (!parsedCameraSpec.position || !parsedCameraSpec.motion) {
            return {
              ok: false,
              reason: `scene[${i}] cameraMovement must follow "Position: <...> | Motion: <...>" with allowed options`,
            }
          }
        }

        if (containsMotionDiscontinuityKeyword(narrative) || containsMotionDiscontinuityKeyword(cameraMovement)) {
          return { ok: false, reason: `scene[${i}] contains discontinuity keyword` }
        }

        const families = detectCameraMotionFamilies(cameraMovement)
        const maxFamilyCount = strict && isAllowedHybridCameraMotion(cameraMovement) ? 2 : (strict ? 1 : 2)
        if (families.length > maxFamilyCount) {
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

      if (strict) {
        const fitModelCoverage = validateFitModelCoverage(
          keyframes.filter((item): item is Record<string, unknown> => asRecord(item)),
          effectiveFitModelRuleLock,
        )
        if (!fitModelCoverage.ok) {
          return fitModelCoverage
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

    const validatePackageGenerationDraft = (
      value: Record<string, unknown>,
    ): { ok: boolean; reason?: string } => {
      const keyframes = Array.isArray(value.keyframes) ? value.keyframes : []
      const scenes = Array.isArray(value.scenes) ? value.scenes : []

      const minimumKeyframes = Math.max(2, keyframeCount - 2)
      const minimumScenes = Math.max(1, sceneCount - 2)

      if (keyframes.length < minimumKeyframes || scenes.length < minimumScenes) {
        return {
          ok: false,
          reason: `draft shape too small keyframes=${keyframes.length}/${keyframeCount}, scenes=${scenes.length}/${sceneCount}`,
        }
      }

      const completeness = getPackageCompletenessScore(value, keyframeCount, sceneCount)
      if (completeness < 0.45) {
        return { ok: false, reason: `draft completeness too low ${completeness.toFixed(2)} < 0.45` }
      }

      return { ok: true }
    }

    const normalizePackageCounts = (value: Record<string, unknown>): Record<string, unknown> => {
      const normalized: Record<string, unknown> = { ...value }

      const keyframesRaw = Array.isArray(value.keyframes) ? value.keyframes : []
      const scenesRaw = Array.isArray(value.scenes) ? value.scenes : []

      const keyframes = keyframesRaw
        .filter((item): item is Record<string, unknown> => asRecord(item))
        .map((item) => ({ ...item }))
      const scenes = scenesRaw
        .filter((item): item is Record<string, unknown> => asRecord(item))
        .map((item) => ({ ...item }))

      const keyframeSeed = keyframes.length > 0 ? keyframes[keyframes.length - 1] : {}
      while (keyframes.length < keyframeCount) {
        keyframes.push({
          ...keyframeSeed,
          index: keyframes.length,
          action: toSafeText(keyframeSeed.action, 'Model pivots naturally into the next pose while preserving garment continuity.'),
          location: toSafeText(keyframeSeed.location, ''),
          camera: toSafeText(keyframeSeed.camera, 'Stable medium shot with controlled movement.'),
          lighting: toSafeText(keyframeSeed.lighting, 'Consistent soft fashion lighting.'),
          style: toSafeText(keyframeSeed.style, 'Natural fashion editorial style.'),
        })
      }

      const sceneSeed = scenes.length > 0 ? scenes[scenes.length - 1] : {}
      while (scenes.length < sceneCount) {
        scenes.push({
          ...sceneSeed,
          index: scenes.length,
          narrative: toSafeText(sceneSeed.narrative, 'Continue smooth transition with product clarity and stable scene continuity.'),
          cameraMovement: normalizeSceneCameraMovementSpec(sceneSeed.cameraMovement, 'Controlled tracking with stable axis.'),
        })
      }

      normalized.keyframes = keyframes
        .slice(0, keyframeCount)
        .map((item, index) => ({ ...item, index }))
      normalized.scenes = scenes
        .slice(0, sceneCount)
        .map((item, index) => ({ ...item, index }))

      return normalized
    }

    // STAGE 3 — PACKAGE GENERATION
    const finalGeminiAgentRuntimeNotes = [
      ...sharedGeminiAgentRuntimeNotes,
      `Final resolved content type: ${finalContentType.toUpperCase()}.`,
      `Fit-model lock mode: ${fitModelRuleLockModeLabel}.`,
      `Style lock mode: ${finalStyleLock.toUpperCase()}${isStyleLockOverriddenByNotes ? ' from user notes' : ' default'}.`,
      `Location continuity: ${enforceSinglePrimaryLocation ? 'single primary location' : 'controlled user-requested transition'}.`,
      `Required output shape: ${keyframeCount} keyframes and ${sceneCount} scenes.`,
    ]
    const packageGenerationAgentSkillBlock = buildGeminiAgentSkillBlock({
      stage: 'package_generation',
      skillIds: [
        'reference-lock',
        'user-intent-priority',
        'fashion-affiliate-strategy',
        'nano-banana-image-framework',
        'creative-director-controls',
        'veo-prompting-guide',
        'realtime-web-visualization',
        'image-to-video-handoff',
        'veo-fast-iteration',
        'veo-native-audio-localization',
        'veo-continuity',
        'location-context',
        'safety-policy',
        'schema-qa',
      ],
      engineLabel: 'Veo 3.1 via Gemini API prompt package',
      outputContract: `${keyframeCount} compact keyframes + ${sceneCount} compact scenes JSON`,
      runtimeNotes: finalGeminiAgentRuntimeNotes,
    })
    const qaRepairAgentSkillBlock = buildGeminiAgentSkillBlock({
      stage: 'qa_repair',
      skillIds: [
        'reference-lock',
        'user-intent-priority',
        'realtime-web-visualization',
        'creative-director-controls',
        'veo-prompting-guide',
        'veo-native-audio-localization',
        'veo-continuity',
        'location-context',
        'safety-policy',
        'schema-qa',
      ],
      engineLabel: 'Veo 3.1 repair',
      outputContract: 'same package schema, repaired only where needed',
      runtimeNotes: finalGeminiAgentRuntimeNotes,
    })
    const locationRepairAgentSkillBlock = buildGeminiAgentSkillBlock({
      stage: 'location_repair',
      skillIds: ['reference-lock', 'user-intent-priority', 'location-context', 'safety-policy', 'schema-qa'],
      outputContract: 'same package schema with location-only fixes',
      runtimeNotes: finalGeminiAgentRuntimeNotes,
    })
    const motionRepairAgentSkillBlock = buildGeminiAgentSkillBlock({
      stage: 'motion_repair',
      skillIds: ['reference-lock', 'user-intent-priority', 'veo-prompting-guide', 'image-to-video-handoff', 'veo-continuity', 'safety-policy', 'schema-qa'],
      engineLabel: 'Veo 3.1 interpolation repair',
      outputContract: 'same package schema with continuity-only fixes',
      runtimeNotes: finalGeminiAgentRuntimeNotes,
    })

    const generationPrompt = `You are an expert AI video prompt engineer specializing in TikTok affiliate fashion videos.

Generate a COMPLETE prompt package for a ${duration}-second video with:
- ${keyframeCount} keyframe image prompts (${sceneCount} scenes => n+1 keyframes)
- ${sceneCount} scene prompts for Veo 3.1 (8s each, first-frame -> last-frame)
- Aspect ratio: ${aspectRatio}
- LOCKED content type: ${finalContentType.toUpperCase()}
- Video pose-direction lock: ${videoPoseDirectionLockText}
- Product category hint: ${productCategoryLabel} (${normalizedProductCategory.toUpperCase()})
- Product category lock state: ${hasExplicitProductCategoryLock ? 'LOCKED' : 'AUTO'}
- Background location reference: ${hasBackgroundLocationReference ? 'PROVIDED (environment/location guidance only)' : 'NOT PROVIDED'}
- Fit-model lock mode: ${fitModelRuleLockModeLabel}
- Detail-sensitive facing mode: ${detailSensitiveFacingModeLabel}
- Long-duration direction mode: ${longDurationDirectionalModeLabel}
- User-notes hard-rule relaxation: ${relaxHardRulesByNotes ? 'ACTIVE' : 'INACTIVE'}
- Style lock mode: ${finalStyleLock.toUpperCase()}${isStyleLockOverriddenByNotes ? ' (USER-NOTES OVERRIDE)' : ' (DEFAULT)'}
- Location continuity mode: ${enforceSinglePrimaryLocation ? 'SINGLE PRIMARY LOCATION' : 'USER-NOTES MULTI-LOCATION'}

${packageGenerationAgentSkillBlock}

${productCategoryFocusRules}
${tiktokAnalysisReferenceLockRules}
${backgroundLocationReferenceRules}

AFFILIATE OBJECTIVE:
${affiliateObjectiveForFinal}

${affiliateExecutionRules}

VISUAL ANALYSIS JSON:
${safeJsonStringify(visualAnalysis)}

CREATIVE PLAN JSON:
${safeJsonStringify(planningResult)}

OBSERVED TIKTOK FASHION BASELINES:
${TIKTOK_OBSERVED_SIGNAL_BASELINE}

${boutiqueFeedChannelBenchmarkForFinal ? `BOUTIQUE FEED CHANNEL SNAPSHOT (REFERENCE):
${boutiqueFeedChannelBenchmarkForFinal}
` : ''}

TYPE-SPECIFIC TIKTOK SIGNALS (DEFAULT; SUBORDINATE TO RULE 30):
${contentTypeNativeSignalRules}

CONTENT-TYPE TREND ALIGNMENT (DEFAULT; SUBORDINATE TO RULE 30):
${finalTypeTrendAlignmentRules}

TIKTOK FIT-MODEL SIGNAL BASELINE:
${TIKTOK_FIT_MODEL_SIGNAL_BASELINE}

FIT-MODEL LOCK BY CONTENT TYPE (DEFAULT; SUBORDINATE TO RULE 30):
${fitModelRuleLockInstructions}

NATURALITY GUARDRAILS (DEFAULT; SUBORDINATE TO RULE 30):
${NATURALITY_PROMPT_GUARDRAILS}

HAND / ANATOMY CONSISTENCY GUARDRAILS (DEFAULT; SUBORDINATE TO RULE 30):
${HAND_ANATOMY_GUARDRAILS}

OOTDMIRROR REAR-MIRROR CAMERA LOCK (APPLIES WHEN TYPE=OOTDMIRROR):
${OOTDMIRROR_REAR_MIRROR_GUARDRAILS}

VEO 3.1 INTERPOLATION SAFETY GUARDRAILS:
${VEO_INTERPOLATION_GUARDRAILS}

CELEBRITY / REAL-PERSON SAFETY GUARDRAILS (MANDATORY):
${CELEBRITY_POLICY_GUARDRAILS}

LOCATIONS ALREADY USED FOR THIS PRODUCT IMAGE ID (MUST AVOID REUSE):
${usedLocationsProductPrompt}

LOCATIONS ALREADY USED FOR SAME OUTFIT TYPE (MUST AVOID REUSE):
${usedLocationsOutfitTypePrompt}

LOCKED LOCATION LIBRARY (MANDATORY - choose only from this list):
${LOCKED_LOCATION_LIBRARY_PROMPT_LIST}

${enforceSinglePrimaryLocation ? 'PRIMARY LOCATION LOCK (DEFAULT; SUBORDINATE TO RULE 30):' : 'LOCATION CONTINUITY MODE (USER NOTES OVERRIDE ACTIVE):'}
${enforceSinglePrimaryLocation
  ? (
    primaryPlannedLocation.length > 0
      ? `Use this exact location string in all keyframes/scenes: ${primaryPlannedLocation}`
      : 'Select one valid location from LOCKED LOCATION LIBRARY and keep it identical across all keyframes/scenes.'
  )
  : 'User notes request location transitions: allow controlled multi-location progression across scenes while preserving interpolation continuity and keeping all locations within LOCKED LOCATION LIBRARY.'}

USER NOTES (HIGHEST PRIORITY WHEN PROVIDED):
${notes ? notes : 'None'}

${userIntentPriorityStepRules}
${userIntentPriorityStepSummary}

SCENE CAMERA MOVEMENT TAXONOMY (MANDATORY):
${SCENE_CAMERA_MOVEMENT_PROMPT_RULES}

USER NOTES OVERRIDE CONTRACT (GLOBAL PRECEDENCE):
- If USER NOTES conflict with any default creative/style/template/type instruction, USER NOTES win.
- This override also applies to type-specific trend signals, fit-model defaults, and Rule 32 direction heuristics.
- Non-negotiable constraints only: valid output schema, required scene/keyframe counts, interpolation continuity safety (Rules 1, 2, 12), location library lock (Rule 15), and celebrity/public-figure safety (Rule 31).

${notes ? `⚡ USER NOTES PRIORITY MODE — ACTIVE
Rule 30 is the PRIMARY creative directive for this run.
Rules 3–29 and Rule 32 defaults are SUBORDINATE to User Notes wherever user intent conflicts with defaults.
Apply User Notes first; only fall back to defaults when User Notes are silent on a dimension.
Truly non-negotiable: Rule 31 (celebrity safety), Rule 15 (location library lock), output schema structure,
scene/keyframe counts, and VEO interpolation continuity (Rules 1, 2, 12).` : ''}

CRITICAL RULES [Rule 30 has strongest creative authority. Rules 3–29 and Rule 32 defaults yield on conflict. Non-negotiable: Rules 1, 2, 12, 15, 31 plus schema/count integrity]:
1. Each scene is exactly 8 seconds, using Veo 3.1 first-frame + last-frame interpolation.
2. Keyframe chain must be SEAMLESS: last frame of scene N = first frame of scene N+1.
3. Character identity must be perfectly consistent across all keyframes (face, body proportions, hair, skin tone).
4. Product/garment must be EXACTLY preserved from the reference image (color, silhouette, material, details).
5. Follow TikTok retention arc across timeline: Hook (0-3s) -> Value -> Proof -> Close.
6. Scene 1 must create a strong visual hook in the first 1-3 seconds with immediate product readability.
7. Infer scene context from garment/product characteristics, content type, and user notes; avoid generic preset randomness.
7A. PRODUCT CATEGORY LOCK (WHEN ACTIVE) - Selected product category is the only hero product focus. If outfit has multiple garments, non-selected garments remain supporting context and must not be described as the featured product.
8. NEVER use background, location, props, or lighting from the FACE reference image. Face image is identity-only.
9. Keep one primary location coherent across all keyframes/scenes; do not change location unless user explicitly requests a transition. [SUBORDINATE to Rule 30 — User Notes may specify multi-location or location changes]
10. Prompt detail quality must follow Veo best practice: each keyframe/scenes should be specific on Subject, Action, Camera, Composition, Style, and Ambiance/Lighting.
11. Camera grammar must stay coherent: one dominant camera move per 8s scene. Use scenes[i].cameraMovement format "Position: <...> | Motion: <...>" and only use allowed hybrid motion "Dolly in zoom out" or "Dolly out zoom in" when needed.
12. First-last-frame interpolation safety is mandatory: adjacent keyframes must use micro-progression (small pose delta, stable framing axis, no sudden body teleport).
13. Lighting and color tone continuity must be maintained across adjacent scenes unless a deliberate story transition is stated.
14. LOCATION MUST COME FROM LOCKED LOCATION LIBRARY ONLY - Never invent or paraphrase new location names outside the provided locked list.
15. LOCATION LIBRARY LOCK - Every keyframe location must exactly map to one entry in LOCKED LOCATION LIBRARY; keep location continuity according to Rule 30 decision.
16. AVOID PREVIOUS LOCATIONS FOR SAME PRODUCT IMAGE ID + SAME OUTFIT TYPE - Never reuse locations listed in either location-history section above.
17. ANTI-DUPLICATE + RANDOMIZATION REQUIREMENT - Use the Diversity seed to generate fresh concepts; do not duplicate ACTION, LOCATION, CAMERA, NARRATIVE in one output.
18. PRODUCT-FIRST COMPOSITION - Product/garment is the hero in every keyframe; avoid clutter and occlusion that hides purchase-relevant details.
19. MOBILE SAFE-FRAME RULE - Keep hero subject in a central safe area and avoid placing critical details at extreme top/bottom edges where TikTok UI/captions can cover them. [SUBORDINATE to Rule 30 — User Notes on framing override this]
20. RETENTION PACING RULE - Avoid static visuals for too long; every ~1-2 seconds should include meaningful subject or camera progression. [SUBORDINATE to Rule 30 — User Notes on pace/mood override this]
21. NO VOICE REQUIREMENT - The video must work fully without voiceover/dialogue. Do not rely on spoken lines to deliver value or proof.
22. AUDIO IS OPTIONAL (IF USED) - Prefer silent-first visual storytelling. If adding SFX/ambience, describe it clearly but keep comprehension independent from audio.
23. AUTHENTICITY + TRUST - Favor natural, believable social-native scenes; avoid over-stylized fake ad feel, low-value filler, and exaggerated claims.
24. NO-CTA ENDING + TEMPLATE CONSISTENCY - Final scene should land a clean visual payoff with product clarity; explicit CTA is optional and never mandatory.
25. OOTD FAMILY TREND FORMAT (TIKTOK-ALIGNED) - For content type OOTDMIRROR, enforce mirror fitcheck flow only. For OOTD, enforce single-corner studio flow only. For OutfitIdeas, enforce practical mix-and-match lookbook flow by default (non-mirror), and allow mirror fitcheck only when User Notes explicitly request mirror/fitcheck behavior. [SUBORDINATE to Rule 30 — User Notes override format/flow]
26. MIRROR FITCHECK SPEC - Use observer-camera framing (camera in front of model) with the mirror behind the model for reflection proof, keep full-body head-to-toe readability, do not let model hold phone/camera, and ensure no camera/tripod/operator reflection appears in the mirror. [SUBORDINATE to Rule 30 — User Notes may modify mirror spec]
27. SINGLE-CORNER STUDIO SPEC - Keep one fixed studio corner with contextual depth (textured/decorated wall, practical props like rack/stool/shelf), soft controlled lighting, and consistent camera axis for all scenes; avoid plain seamless white/solid-color backdrops. [SUBORDINATE to Rule 30 — User Notes may modify studio spec]
28. STYLE CONSISTENCY LOCK - OOTDMIRROR must stay mirror-only, OOTD must stay studio-only, and OutfitIdeas must stay mix-and-match styling-first with non-mirror framing by default. If User Notes explicitly request mirror/fitcheck, keep that mirror setup consistent across scenes. [SUBORDINATE to Rule 30 — User Notes may override style lock]
29. INTERPOLATION ANTI-GLITCH RULE - Avoid terms/instructions implying abrupt transitions (teleport, jump cut, hard cut, instant morph, abrupt switch), and avoid immediate opposite camera direction between adjacent scenes unless an explicit turnaround beat is included.
30. USER NOTES PRIORITY LOCK (HIGHEST CREATIVE AUTHORITY) — User Notes OVERRIDE all default creative/style/template/type instructions in Rules 3–29 and Rule 32 for any dimension they explicitly address. Only fall back to rule defaults for dimensions User Notes are silent on. Non-negotiable constraints are limited to Rule 31 (celebrity safety), Rule 15 (location library lock), output schema structure, scene/keyframe counts, and VEO interpolation continuity (Rules 1, 2, 12).
31. CELEBRITY / PUBLIC-FIGURE SAFETY LOCK - Never depict/imitate/reference real celebrities/public figures/identifiable persons, never generate deepfake-style impersonation or fake endorsement/dialogue; if user asks for real person, convert to fictional archetype while preserving only general mood/style.
${facingRuleForGenerationPrompt}

Return STRICT COMPACT JSON only in this schema:
{
  "masterDNA": "character consistency description",
  "keyframes": [
    {
      "index": 0,
      "action": "pose/movement description",
      "facingDirection": "front|back|left|right|three-quarter-left|three-quarter-right",
      "location": "one exact location string from LOCKED LOCATION LIBRARY",
      "camera": "lens, shot type, angle",
      "lighting": "lighting setup",
      "style": "photography style"
    }
  ],
  "scenes": [
    {
      "index": 0,
      "narrative": "scene description with retention beat",
      "cameraMovement": "Position: ${DEFAULT_SCENE_CAMERA_POSITION} | Motion: ${DEFAULT_SCENE_CAMERA_MOTION}"
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
      (value) => validatePackageGenerationDraft(value),
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

${qaRepairAgentSkillBlock}

  Validate and repair the draft package to satisfy all constraints below:
  - Enforce CRITICAL RULES with Rule 30 precedence exactly as defined in package generation stage.
  - Keep every location strictly inside LOCKED LOCATION LIBRARY only.
  - Keep scene/keyframe continuity aligned with rules 2, 9, 12, and 13.
  - Conflict resolution order is strict: USER NOTES > default creative/type/template guardrails > fallback heuristics.
  - Preserve character identity and garment fidelity with zero drift.
  - Treat USER NOTES as highest-priority intent and preserve them over default creative choices unless non-negotiable constraints conflict.
  - Non-negotiable constraints only: valid JSON schema, required scene/keyframe counts, Rules 1, 2, 12, 15, and 31.
  - Enforce product category lock: selected category must remain hero product focus whenever category lock is active.
  - Apply location continuity mode according to Rule 30 runtime decision (single-primary default or user-notes transition mode).
  - Enforce scenes[i].cameraMovement taxonomy with exact Position/Motion option sets.
  - ${facingRuleForQaRepair}
  - ${fitModelRuleLockRepairHint}
  - Require explicit facingDirection token on each keyframe: front|back|left|right|three-quarter-left|three-quarter-right.

${productCategoryFocusRules}
${tiktokAnalysisReferenceLockRules}
${backgroundLocationReferenceRules}

LOCKED LOCATION LIBRARY (MANDATORY - choose only from this list):
${LOCKED_LOCATION_LIBRARY_PROMPT_LIST}

${enforceSinglePrimaryLocation ? 'PRIMARY LOCATION LOCK (DEFAULT; SUBORDINATE TO RULE 30):' : 'LOCATION CONTINUITY MODE (USER NOTES OVERRIDE ACTIVE):'}
${enforceSinglePrimaryLocation
    ? (
      primaryPlannedLocation.length > 0
        ? primaryPlannedLocation
        : 'No pre-selected lock available. Keep one location consistent across all keyframes/scenes.'
    )
    : 'User notes request location transitions: allow controlled multi-location progression while preserving continuity within LOCKED LOCATION LIBRARY.'}

USER NOTES (HIGHEST PRIORITY WHEN PROVIDED):
${notes ? notes : 'None'}

${userIntentPriorityStepRules}
${userIntentPriorityStepSummary}

SCENE CAMERA MOVEMENT TAXONOMY (MANDATORY):
${SCENE_CAMERA_MOVEMENT_PROMPT_RULES}

DRAFT PACKAGE JSON:
${safeJsonStringify(draftPackage)}

TYPE-SPECIFIC TIKTOK SIGNALS (DEFAULT; SUBORDINATE TO RULE 30):
${contentTypeNativeSignalRules}

CONTENT-TYPE TREND ALIGNMENT (DEFAULT; SUBORDINATE TO RULE 30):
${finalTypeTrendAlignmentRules}

TIKTOK FIT-MODEL SIGNAL BASELINE:
${TIKTOK_FIT_MODEL_SIGNAL_BASELINE}

FIT-MODEL LOCK BY CONTENT TYPE (DEFAULT; SUBORDINATE TO RULE 30):
${fitModelRuleLockInstructions}

NATURALITY GUARDRAILS (DEFAULT; SUBORDINATE TO RULE 30):
${NATURALITY_PROMPT_GUARDRAILS}

HAND / ANATOMY CONSISTENCY GUARDRAILS (DEFAULT; SUBORDINATE TO RULE 30):
${HAND_ANATOMY_GUARDRAILS}

OOTDMIRROR REAR-MIRROR CAMERA LOCK (APPLIES WHEN TYPE=OOTDMIRROR):
${OOTDMIRROR_REAR_MIRROR_GUARDRAILS}

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

${locationRepairAgentSkillBlock}

TASK:
- Repair ONLY location-related fields so the package satisfies constraints.
- Keep masterDNA, actions, camera, lighting, style, and scene pacing unchanged unless absolutely necessary for continuity.
- Enforce location continuity mode based on Rule 30 runtime decision (single-primary default or user-notes transition mode).
- Preserve celebrity/public-figure safety guardrails (no real-person likeness or impersonation cues).

LOCATION CONSTRAINTS:
- Scope strictly to LOCKED LOCATION LIBRARY only.
- Avoid all locations in history lists below.
- Keep real-world venues only.
- Reject flat/plain seamless backgrounds (example: "minimalist high-end white studio background"). If studio is used, include contextual set cues (textured wall/props/depth).
- ${backgroundLocationReferenceRules}

LOCKED LOCATION LIBRARY (MANDATORY - choose only from this list):
${LOCKED_LOCATION_LIBRARY_PROMPT_LIST}

LOCATIONS ALREADY USED FOR THIS PRODUCT IMAGE ID (MUST AVOID REUSE):
${usedLocationsProductPrompt}

LOCATIONS ALREADY USED FOR SAME OUTFIT TYPE (MUST AVOID REUSE):
${usedLocationsOutfitTypePrompt}

AI-PLANNED LOCATION CANDIDATES (PREFERRED):
${aiPlannedLocationPool.length > 0 ? aiPlannedLocationPool.join('\n') : 'None'}

${enforceSinglePrimaryLocation ? 'PRIMARY LOCATION LOCK (DEFAULT; SUBORDINATE TO RULE 30):' : 'LOCATION CONTINUITY MODE (USER NOTES OVERRIDE ACTIVE):'}
${enforceSinglePrimaryLocation
  ? (
    primaryPlannedLocation.length > 0
      ? `Use this exact location string in all keyframes/scenes: ${primaryPlannedLocation}`
      : 'If unavailable, keep one valid location consistent across all keyframes/scenes.'
  )
  : 'User notes request location transitions: keep continuity inside LOCKED LOCATION LIBRARY, but allow controlled multi-location progression across keyframes/scenes.'}

${userIntentPriorityStepRules}
${userIntentPriorityStepSummary}

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

${motionRepairAgentSkillBlock}

TASK:
- Repair ONLY motion/camera continuity fields so interpolation between keyframes is physically plausible.
- Keep location, character identity, garment fidelity, and style lock unchanged.
- Maintain existing story arc and product-first composition.
- Preserve product category hero focus lock when category is explicitly selected.
- Preserve celebrity/public-figure safety guardrails (no real-person likeness or impersonation cues).
- Preserve USER NOTES intent for tone/style/narrative; only change fields required to resolve continuity and non-negotiable constraints.

INTERPOLATION CONTINUITY REQUIREMENTS:
- Adjacent keyframes must be micro-progression, not abrupt pose jumps.
- Use one dominant camera movement per scene; the only allowed hybrid motion is "Dolly in zoom out" or "Dolly out zoom in".
- Avoid immediate opposite camera direction across adjacent scenes unless explicit turnaround beat is described.
- Remove discontinuity terms such as teleport, jump cut, hard cut, instant morph, abrupt switch.
- ${facingRuleForMotionRepair}
- ${fitModelRuleLockRepairHint}

${productCategoryFocusRules}
${tiktokAnalysisReferenceLockRules}
${backgroundLocationReferenceRules}

USER NOTES (HIGHEST PRIORITY WHEN PROVIDED):
${notes ? notes : 'None'}

${userIntentPriorityStepRules}
${userIntentPriorityStepSummary}

SCENE CAMERA MOVEMENT TAXONOMY (MANDATORY):
${SCENE_CAMERA_MOVEMENT_PROMPT_RULES}

USER NOTES OVERRIDE CONTRACT:
- Keep USER NOTES choices whenever they do not violate non-negotiable constraints (Rules 1, 2, 12, 15, 31 and schema/count integrity).
- Default type/style/fit-model guidance below is subordinate to USER NOTES on conflict.

TYPE-SPECIFIC TIKTOK SIGNALS (DEFAULT; SUBORDINATE TO RULE 30):
${contentTypeNativeSignalRules}

CONTENT-TYPE TREND ALIGNMENT (DEFAULT; SUBORDINATE TO RULE 30):
${finalTypeTrendAlignmentRules}

TIKTOK FIT-MODEL SIGNAL BASELINE:
${TIKTOK_FIT_MODEL_SIGNAL_BASELINE}

FIT-MODEL LOCK BY CONTENT TYPE (DEFAULT; SUBORDINATE TO RULE 30):
${fitModelRuleLockInstructions}

NATURALITY GUARDRAILS (DEFAULT; SUBORDINATE TO RULE 30):
${NATURALITY_PROMPT_GUARDRAILS}

HAND / ANATOMY CONSISTENCY GUARDRAILS (DEFAULT; SUBORDINATE TO RULE 30):
${HAND_ANATOMY_GUARDRAILS}

OOTDMIRROR REAR-MIRROR CAMERA LOCK (APPLIES WHEN TYPE=OOTDMIRROR):
${OOTDMIRROR_REAR_MIRROR_GUARDRAILS}

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

    const preNormalizeKeyframeCount = Array.isArray(parsed.keyframes) ? parsed.keyframes.length : 0
    const preNormalizeSceneCount = Array.isArray(parsed.scenes) ? parsed.scenes.length : 0
    parsed = normalizePackageCounts(parsed)

    const rawKeyframes = Array.isArray(parsed.keyframes) ? parsed.keyframes : []
    const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : []

    if (hasUserNotesIntentLock || hasExplicitProductCategoryLock) {
      stageMetrics.push({
        stage: 'intent_priority_enforcement',
        attempt: 0,
        durationMs: 0,
        ok: true,
        note: `notes=${hasUserNotesIntentLock ? 'on' : 'off'}, category=${hasExplicitProductCategoryLock ? normalizedProductCategory : 'auto'}`,
      })
    }

    if (preNormalizeKeyframeCount !== keyframeCount || preNormalizeSceneCount !== sceneCount) {
      stageMetrics.push({
        stage: 'shape_normalize',
        attempt: 0,
        durationMs: 0,
        ok: true,
        note: `keyframes ${preNormalizeKeyframeCount}->${rawKeyframes.length}, scenes ${preNormalizeSceneCount}->${rawScenes.length}`,
      })
    }

    if (rawKeyframes.length !== keyframeCount || rawScenes.length !== sceneCount) {
      throw new Error(
        `Gemini returned unsynchronized package after normalization (keyframes: ${rawKeyframes.length}/${keyframeCount}, scenes: ${rawScenes.length}/${sceneCount})`
      )
    }

    const toSafeString = (value: unknown, fallback: string) => {
      if (typeof value !== 'string') return fallback
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : fallback
    }

    const rewriteCategoryHeroConflicts = (value: string): string => {
      let next = value
      const heroReplacement = `hero product is the selected ${productCategoryLabel} from the product reference image`
      const focusReplacement = 'focus on selected product details from the product reference image'

      const replaceHeroAndFocusMentions = (termPattern: string, shouldReplace: boolean) => {
        if (!shouldReplace) return

        const heroPattern = new RegExp(`\\b(?:hero|featured|primary|main)\\s+(?:product|item|garment)?\\s*(?:is|:)?\\s*(?:the\\s+|a\\s+)?${termPattern}\\b`, 'gi')
        const focusPattern = new RegExp(`\\bfocus(?:es|ed|ing)?\\s+on\\s+(?:the\\s+)?${termPattern}\\b`, 'gi')
        next = next.replace(heroPattern, heroReplacement)
        next = next.replace(focusPattern, focusReplacement)
      }

      replaceHeroAndFocusMentions('(?:corset(?:\\s+top)?|top|blouse|shirt|camisole|cami|tank(?:\\s+top)?|halter(?:\\s+top)?)', selectedProductCategoryGroup !== 'tops')
      replaceHeroAndFocusMentions('(?:pants?|trousers?|jeans?|shorts?|joggers?|leggings?|cargo(?:\\s+pants?)?)', selectedProductCategoryGroup !== 'bottoms')
      replaceHeroAndFocusMentions('(?:skirts?|mini\\s*skirt|midi\\s*skirt|maxi\\s*skirt|chan\\s*vay)', selectedProductCategoryGroup !== 'skirts')
      replaceHeroAndFocusMentions('(?:dresses?|gowns?|slip\\s*dress)', selectedProductCategoryGroup !== 'dresses')
      replaceHeroAndFocusMentions('(?:blazers?|jackets?|coats?|cardigans?|outerwear|trench(?:\\s+coat)?)', selectedProductCategoryGroup !== 'outerwear')
      replaceHeroAndFocusMentions('(?:lingerie|bra|bralette|panty|panties|shapewear|swimwear|bikini|monokini|one\\s*piece|two\\s*piece)', selectedProductCategoryGroup !== 'lingerie_swimwear')
      replaceHeroAndFocusMentions('(?:activewear|sports\\s*bra|training\\s*top|gym\\s*set|workout\\s*set)', selectedProductCategoryGroup !== 'activewear')
      replaceHeroAndFocusMentions('(?:pajama|loungewear|sleepwear|nightgown|robe)', selectedProductCategoryGroup !== 'loungewear_sleepwear')
      replaceHeroAndFocusMentions('(?:ao\\s*dai|cheongsam|qipao|traditional\\s*dress|festive\\s*dress)', selectedProductCategoryGroup !== 'traditional_festive')
      replaceHeroAndFocusMentions('(?:heels?|sneakers?|sandals?|boots?|flats?|loafers?|bags?|handbags?|clutches?|belts?|scarves?|sunglasses?)', selectedProductCategoryGroup !== 'accessories_footwear')

      return next
    }

    const categoryReviewSignalRegexByGroup: Partial<Record<ProductCategoryGroup, RegExp>> = {
      tops: /\\b(neckline|strap|sleeve|upper-body|bust|collar|top|shirt|blouse|corset|cami)\\b/i,
      bottoms: /\\b(waist|rise|hip|thigh|leg|hem|drape|bottom|trouser|jean|pants|short)\\b/i,
      dresses: /\\b(dress|neckline|waist|hemline|silhouette|length|drape|gown)\\b/i,
      skirts: /\\b(skirt|waistline|hemline|pleat|slit|drape|silhouette|mini|midi|maxi|chan\\s*vay)\\b/i,
      outerwear: /\\b(outerwear|jacket|blazer|coat|closure|layer|shoulder)\\b/i,
      loungewear_sleepwear: /\\b(loungewear|sleepwear|pajama|comfort|soft|stretch|relaxed\\s*fit)\\b/i,
      lingerie_swimwear: /\\b(lingerie|swimwear|coverage|support|strap|cup|stretch|body\\s*fit)\\b/i,
      activewear: /\\b(activewear|support|compression|stretch|training|workout|movement)\\b/i,
      traditional_festive: /\\b(traditional|festive|silhouette|cultural|elegant\\s*movement|formal\\s*fit)\\b/i,
      accessories_footwear: /\\b(footwear|shoe|heel|sole|comfort|bag|strap|hardware|finish)\\b/i,
    }

    const applyProductCategoryFocusToText = (
      value: string,
      mode: 'dna' | 'action' | 'narrative' = 'narrative',
    ): string => {
      const trimmed = value.trim()
      if (!trimmed) return trimmed
      if (!hasExplicitProductCategoryLock) return trimmed

      let next = rewriteCategoryHeroConflicts(trimmed)

      if (mode === 'dna') {
        if (productCategoryFocusSentence) {
          next = appendSentenceIfMissing(next, productCategoryFocusSentence)
        }
        if (productCategoryReviewFocusSentence) {
          next = appendSentenceIfMissing(next, productCategoryReviewFocusSentence)
        }
        if (tiktokAnalysisReferenceLockSentence) {
          next = appendSentenceIfMissing(next, tiktokAnalysisReferenceLockSentence)
        }
        return next
      }

      const reviewSignalRegex = categoryReviewSignalRegexByGroup[selectedProductCategoryGroup]
      const hasReviewSignals = reviewSignalRegex ? reviewSignalRegex.test(next) : false
      if (!hasReviewSignals && productCategoryReviewFocusSentence) {
        next = appendSentenceIfMissing(next, productCategoryReviewFocusSentence)
      }

      if (isTikTokAnalysisReferenceMode && tiktokAnalysisReferenceLockSentence) {
        const hasTransferLockSignal = /\\b(structure-only|script transfer|input product image|product reference image)\\b/i.test(next)
        if (!hasTransferLockSignal) {
          next = appendSentenceIfMissing(next, tiktokAnalysisReferenceLockSentence)
        }
      }

      return next
    }

    const applyUserIntentPriorityStepToText = (
      value: string,
      mode: 'dna' | 'action' | 'narrative' = 'narrative',
    ): string => {
      let next = applyProductCategoryFocusToText(value, mode)

      if (!hasUserNotesIntentLock) {
        return next
      }

      if (mode === 'dna') {
        if (userNotesIntentAnchor.length > 0) {
          next = appendSentenceIfMissing(next, `User-notes priority anchor: ${userNotesIntentAnchor}`)
        }
      } else if (mode === 'narrative') {
        next = appendSentenceIfMissing(
          next,
          'Keep explicit user-note intent as the primary decision signal for styling tone, pacing, and scene mood before defaults',
        )
      }

      if (hasExplicitProductCategoryLock && mode !== 'action') {
        next = appendSentenceIfMissing(next, `Maintain selected category hero focus: ${productCategoryLabel}`)
      }

      return next
    }

    const pickAiPlannedLocationFallback = (): string => {
      if (aiPlannedLocationPool.length === 0) {
        return ''
      }
      return aiPlannedLocationPool[0]
    }

    const pickEmergencyPrimaryLocation = (): string => {
      const stylePool = EMERGENCY_PRIMARY_LOCATIONS_BY_STYLE[finalStyleLock] || []
      const backupPool = finalStyleLock === 'flex'
        ? []
        : EMERGENCY_PRIMARY_LOCATIONS_BY_STYLE.flex

      const mergedPool = [...stylePool, ...backupPool]
      const strictCandidate = mergedPool.find((location) => isLocationCandidateAllowed(location))
      if (strictCandidate) return strictCandidate

      const structuralCandidate = mergedPool.find((location) => isLocationStructurallyValid(location))
      return structuralCandidate || ''
    }

    const resolveLocationFromPackage = (
      value: unknown,
      options: { preferPrimaryLock?: boolean } = {},
    ) => {
      const preferPrimaryLock = options.preferPrimaryLock ?? true

      if (preferPrimaryLock && primaryPlannedLocation.length > 0 && isLocationCandidateAllowed(primaryPlannedLocation)) {
        return resolveLockedLocationEntry(primaryPlannedLocation) || primaryPlannedLocation
      }

      const candidate = toSafeString(value, '')
      if (isLocationCandidateAllowed(candidate)) {
        return resolveLockedLocationEntry(candidate) || candidate
      }

      const fallbackFromAiPlan = pickAiPlannedLocationFallback()
      if (fallbackFromAiPlan.length > 0) {
        return resolveLockedLocationEntry(fallbackFromAiPlan) || fallbackFromAiPlan
      }

      const emergencyPrimaryLocation = pickEmergencyPrimaryLocation()
      if (emergencyPrimaryLocation.length > 0) {
        const fallbackType = blockedLocationKeys.has(normalizeLocationKey(emergencyPrimaryLocation))
          ? 'structural_only'
          : 'strict_ok'

        stageMetrics.push({
          stage: 'location_emergency_fallback',
          attempt: 0,
          durationMs: 0,
          ok: true,
          note: `${fallbackType}:${emergencyPrimaryLocation}`,
        })

        return emergencyPrimaryLocation
      }

      const styleLockFallback = getStyleLockFallbackLocation(finalStyleLock)
      if (isLocationCandidateAllowed(styleLockFallback)) {
        return styleLockFallback
      }

      if (isLocationStructurallyValid(styleLockFallback)) {
        stageMetrics.push({
          stage: 'location_emergency_fallback',
          attempt: 0,
          durationMs: 0,
          ok: true,
          note: `structural_only:${styleLockFallback}`,
        })

        return styleLockFallback
      }

      throw new Error('No valid AI-selected primary location available')
    }

    const primaryResolvedLocation = resolveLocationFromPackage(rawKeyframes[0]?.location, {
      preferPrimaryLock: enforceSinglePrimaryLocation,
    })
    const resolvedKeyframeLocations = enforceSinglePrimaryLocation
      ? Array.from({ length: keyframeCount }, () => primaryResolvedLocation)
      : rawKeyframes.map((item) => {
        const keyframe = asRecord(item) ? item as Record<string, unknown> : {}
        return resolveLocationFromPackage(keyframe.location, { preferPrimaryLock: false })
      })

    const fallbackActionByType: Record<Exclude<ContentType, 'auto'>, string> = {
      ootd: 'Confident outfit showcase pose and movement tailored for OOTD storytelling',
      ootdmirror: 'Mirror-first fitcheck movement with full-body readability and reflection-safe posing',
      grwm: 'Natural getting-ready movement that highlights styling steps and final look',
      outfitideas: 'Practical mix-and-match outfit demonstration with clear style transformation',
      fyp: 'Scroll-stopping fashion movement with dynamic pose transition',
      review: 'Authentic product demonstration pose emphasizing fit and material quality',
      tiktokshop: 'Conversion-focused product showcase movement optimized for TikTok Shop clarity and intent',
      boutiquefeed: 'Boutique-style fitcheck movement with concise hook energy, material proof, and trust-first recommendation cadence',
      athleisure: 'Energetic gym-to-café transition movement with sporty-chic confidence',
      haul: 'Excited try-on movements showcasing product fit and styling versatility',
      styling: 'Purposeful modeling pose highlighting outfit coordination and styling impact',
      luxury: 'Composed understated movement exuding timeless elegance and quiet confidence',
      streetstyle: 'Natural outdoor walk movement showcasing outfit silhouette and wearability in authentic urban street setting',
      sunnyaura: 'Sunlit confidence movement with short natural walk-pose rhythm and warm daylight aura readability',
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
      boutiquefeed: 'Vietnamese boutique review aesthetic, concise emotional hook language, and trust-first product proof framing',
      athleisure: 'Urban sporty-chic lifestyle photography, natural daylight',
      haul: 'Energetic colorful unboxing and try-on aesthetic, dynamic lighting',
      styling: 'Expert fashion editorial style, polished and educational',
      luxury: 'Old money sophisticated aesthetic, understated timeless elegance, neutral palette',
      streetstyle: 'Outdoor urban candid street fashion aesthetic, natural daylight or golden hour, authentic movement energy',
      sunnyaura: 'Natural daylight aura aesthetic, warm golden-hour glow, and concise social-native women-fashion framing',
      partyoutfit: 'Occasion dress editorial aesthetic, soft elegant lighting, silhouette and back-detail emphasis, aspirational event venue atmosphere',
    }

    const inferredCameraFallback = 'AI-selected framing, lens, and movement optimized for fashion storytelling'
    const inferredLightingFallback = 'Lighting inferred from scene mood and garment texture visibility'

    const normalizedKeyframesForRule32: Array<{
      action: string
      camera: string
      lighting: string
      style: string
      timestamp: string
      facingDirection: ConcreteFacingDirection
    }> = []

    for (let i = 0; i < rawKeyframes.length; i += 1) {
      const kf = rawKeyframes[i]
      const record = asRecord(kf) ? kf as Record<string, unknown> : {}

      const actionBase = toSafeString(record.action, fallbackActionByType[finalContentType as Exclude<ContentType, 'auto'>])
      let camera = toSafeString(record.camera, inferredCameraFallback)
      const lighting = toSafeString(record.lighting, inferredLightingFallback)
      const style = toSafeString(record.style, fallbackStyleByType[finalContentType as Exclude<ContentType, 'auto'>])
      const timestamp = toSafeString(record.timestamp, `${Math.round((i * duration) / (keyframeCount - 1))}s`)

      const inferredFacing = extractKeyframeFacingDirection(actionBase, camera, record.facingDirection)
      const previous = i > 0 ? normalizedKeyframesForRule32[i - 1] : null
      const previousFacing = previous?.facingDirection || null
      const relaxedFacingFromNotes = isConcreteFacingDirection(inferredFacing) ? inferredFacing : null
      const resolvedFacingBase: ConcreteFacingDirection = hasVideoPoseDirectionLock
        ? poseDirectionLock as ConcreteFacingDirection
        : usesDetailSensitiveFacingMode
          ? pickDetailSensitiveFacingDirection(i, previousFacing, inferredFacing)
          : hasLongDurationDirectionalMode
            ? pickLongDurationFacingDirection(i, previousFacing)
            : relaxHardRulesByNotes
              ? (relaxedFacingFromNotes || previousFacing || 'front')
              : pickAlternatingFacingDirection(i, previousFacing, inferredFacing)
      const resolvedFacing: ConcreteFacingDirection = finalContentType === 'ootdmirror'
        ? enforceOotdMirrorQuarterFacingDirection(i, resolvedFacingBase, previousFacing)
        : resolvedFacingBase

      const actionHasFacingSignal = normalizeFacingDirectionToken(actionBase) !== 'unknown'
      const hasTurnSignal = i > 0
        ? hasKeyframeTurnCue(previous?.action || '', previous?.camera || '', actionBase, camera)
        : false

      let action = actionBase
      if (hasVideoPoseDirectionLock) {
        if (i > 0 && previousFacing && previousFacing === resolvedFacing) {
          action = removeTurnCuePhrases(action)
        }

        if (!actionHasFacingSignal || inferredFacing !== resolvedFacing) {
          action = enforceActionFacingDirection(action, resolvedFacing)
        }
      } else if (usesDetailSensitiveFacingMode) {
        if (!actionHasFacingSignal || inferredFacing !== resolvedFacing) {
          action = enforceActionFacingDirection(action, resolvedFacing)
        }

        if (i > 0) {
          if (resolvedFacing === previousFacing) {
            action = removeTurnCuePhrases(action)
            action = appendSentenceIfMissing(
              action,
              `Keep ${toFacingDirectionLabel(resolvedFacing)} orientation stable to preserve complex garment details`,
            )
          } else {
            action = appendSentenceIfMissing(
              action,
              `Use a small controlled pivot from ${toFacingDirectionLabel(previousFacing || resolvedFacing)} to ${toFacingDirectionLabel(resolvedFacing)}; avoid fast turn`,
            )
          }
        }
      } else {
        if (relaxHardRulesByNotes) {
          if (!actionHasFacingSignal) {
            action = appendSentenceIfMissing(action, `Body facing ${toFacingDirectionLabel(resolvedFacing)}`)
          }

          if (i > 0 && previousFacing && previousFacing === resolvedFacing) {
            action = removeTurnCuePhrases(action)
          }
        } else if (hasLongDurationDirectionalMode) {
          action = enforceActionFacingDirection(action, resolvedFacing)

          if (i > 0) {
            action = appendSentenceIfMissing(
              action,
              `Use a controlled micro-pivot from ${toFacingDirectionLabel(previousFacing || 'front')} to ${toFacingDirectionLabel(resolvedFacing)} while preserving face and garment detail continuity`,
            )
          }
        } else if (i === 0) {
          if (!actionHasFacingSignal || inferredFacing !== resolvedFacing) {
            action = appendSentenceIfMissing(action, `Body facing ${toFacingDirectionLabel(resolvedFacing)}`)
          }
        } else {
          const transitionHint = `Turn/pivot from ${toFacingDirectionLabel(previousFacing || 'front')} to ${toFacingDirectionLabel(resolvedFacing)}, ending ${toFacingDirectionLabel(resolvedFacing)}`
          if (!actionHasFacingSignal || !hasTurnSignal || inferredFacing !== resolvedFacing) {
            action = appendSentenceIfMissing(action, transitionHint)
          }
        }
      }

      const fitModelEnforced = enforceFitModelRuleOnKeyframe(
        action,
        camera,
        effectiveFitModelRuleLock,
        finalResolvedType,
        i,
        rawKeyframes.length,
      )
      action = fitModelEnforced.action
      camera = fitModelEnforced.camera

      if (finalContentType === 'ootdmirror') {
        const mirrorFacing: OotdMirrorFacingDirection = resolvedFacing === 'three-quarter-right'
          ? 'three-quarter-right'
          : 'three-quarter-left'
        action = enforceOotdMirrorFrontFaceQuarterBodyLock(action, mirrorFacing)
        action = enforceOotdMirrorHandsFreeAction(action)
        action = applyMirrorHandSafetyToAction(action, resolvedFacing, i === rawKeyframes.length - 1)
        camera = enforceOotdMirrorObserverCamera(camera)
      }

      action = applyUserIntentPriorityStepToText(action, 'action')

      normalizedKeyframesForRule32.push({
        action,
        camera,
        lighting,
        style,
        timestamp,
        facingDirection: resolvedFacing,
      })
    }

    // Build full prompts for each keyframe and scene
    const keyframes: KeyframePrompt[] = normalizedKeyframesForRule32.map((kf, i: number) => {
        const subject = buildDefaultFrameSubject(aspectRatio)
      const location = resolvedKeyframeLocations[i] || primaryResolvedLocation

      return {
        index: i,
        timestamp: kf.timestamp,
        subject,
        action: kf.action,
        facingDirection: kf.facingDirection,
        location,
        camera: kf.camera,
        lighting: kf.lighting,
        style: kf.style,
        fullPrompt: buildNanoBananaProFramePrompt({
          subject,
          action: kf.action,
          facingDirection: kf.facingDirection,
          location,
          camera: kf.camera,
          lighting: kf.lighting,
          style: kf.style,
          aspectRatio,
        }),
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
      const startFacingValue = keyframes[i]?.facingDirection
      const endFacingValue = keyframes[i + 1]?.facingDirection
      const startFacing = isConcreteFacingDirection(startFacingValue) ? startFacingValue : null
      const endFacing = isConcreteFacingDirection(endFacingValue) ? endFacingValue : null
      let safeNarrative = finalContentType === 'ootdmirror'
        ? applyMirrorHandSafetyToSceneNarrative(narrative, startFacing, endFacing)
        : narrative

      if (startFacing && endFacing && startFacing === endFacing) {
        safeNarrative = removeTurnCuePhrases(safeNarrative)
        safeNarrative = appendSentenceIfMissing(
          safeNarrative,
          `Keep ${toFacingDirectionLabel(startFacing)} orientation continuity with subtle micro-movements only`,
        )
      }

      if (finalContentType === 'ootdmirror') {
        safeNarrative = enforceOotdMirrorSceneNarrative(safeNarrative)
      }
      safeNarrative = applyUserIntentPriorityStepToText(safeNarrative, 'narrative')
      let rawCameraMovement = toSafeString(
        sc.cameraMovement,
        SCENE_BEATS_MAP[finalContentType as Exclude<ContentType, 'auto'>][beatIndex].cameraHint
      )
      if (finalContentType === 'ootdmirror') {
        rawCameraMovement = enforceOotdMirrorObserverCamera(rawCameraMovement)
      }
      const cameraMovement = normalizeSceneCameraMovementSpec(
        rawCameraMovement,
        SCENE_BEATS_MAP[finalContentType as Exclude<ContentType, 'auto'>][beatIndex].cameraHint,
      )
      const timeRange = toSafeString(sc.timeRange, `${startSec}s-${endSec}s`)

      const lighting = keyframes[i]?.lighting || ''
      const composition = keyframes[i]?.camera || ''
      const subject = typeof parsed.masterDNA === 'string' ? parsed.masterDNA.trim() : ''

      return {
        index: i,
        timeRange,
        subject,
        narrative: safeNarrative,
        startPose,
        endPose,
        composition,
        cameraMovement,
        lighting,
        locationFlow,
        fullPrompt: [
          subject ? `SUBJECT: ${subject}` : '',
          `ACTION: ${safeNarrative}`,
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

    const rawMasterDNA = typeof parsed.masterDNA === 'string' && parsed.masterDNA.trim().length > 0
      ? parsed.masterDNA
      : buildCharacterDNA(notes, finalContentType as Exclude<ContentType, 'auto'>)

    return {
      masterDNA: applyUserIntentPriorityStepToText(rawMasterDNA, 'dna'),
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

function buildMusicVideoModeNotes(notes: string): string {
  const base = normalizePromptWhitespace(notes)
  const musicVideoDirective = `MUSIC VIDEO MODE LOCK:
- Create a production-ready Korean ballad / pop MV storyboard, not a product-sales ad.
- Use the user script/audio as the emotional spine: lyric beat -> character emotion -> visual metaphor -> camera move.
- Output must still follow the app schema: N+1 keyframes and 8s video scenes.
- Keyframes are Nano Banana Pro-style image prompts for stable character reference and first/last-frame generation.
- Scenes are Veo-ready first-frame -> last-frame prompts with camera movement, lighting, emotion, continuity, and audio mood.
- Prioritize music-video language: intro mood, verse loneliness, pre-chorus visual metaphor, emotional drop, outro resolution.
- Include music/audio intent in each scene when useful: beat rise, vocal phrase, silence gap, rain ambience, soft piano/synth mood.
- Keep all characters fictional adults, fully clothed, modest, no real celebrity imitation, no readable UI text, no unsafe distress.`

  return base
    ? `${base}\n\n${musicVideoDirective}`
    : musicVideoDirective
}

function buildMusicVideoPromptMarkdown(input: {
  audioReference: MusicAudioReference
  scriptReference: MusicScriptReference
  artistImages: MusicImageReference[]
  locationImages: MusicImageReference[]
  duration: number
  aspectRatio: '9:16' | '16:9'
  engineLabel: string
  masterDNA: string
  createImagePrompt: string
  keyframes: KeyframePrompt[]
  scenes: ScenePrompt[]
  notes: string
}): string {
  const sceneCount = input.scenes.length
  const keyframeCount = input.keyframes.length
  const audioDuration = input.audioReference.durationSec
    ? `~${input.audioReference.durationSec.toFixed(1)}s`
    : 'unknown'
  const artistList = input.artistImages.length > 0
    ? input.artistImages.map((item, index) => `- ARTIST_IMAGE_${index}: ${item.name}`).join('\n')
    : '- none'
  const locationList = input.locationImages.length > 0
    ? input.locationImages.map((item, index) => `- LOCATION_IMAGE_${index}: ${item.name}`).join('\n')
    : '- none'
  const keyframeText = input.keyframes.map((item) => `### KF${String(item.index + 1).padStart(2, '0')} - ${item.timestamp}

\`\`\`text
${item.fullPrompt.trim()}
\`\`\``).join('\n\n')
  const sceneText = input.scenes.map((item) => `### Scene ${String(item.index + 1).padStart(2, '0')} - ${item.timeRange}

Use first frame: KF${String(item.index + 1).padStart(2, '0')}. Use last frame: KF${String(Math.min(item.index + 2, keyframeCount)).padStart(2, '0')}.

\`\`\`text
${item.fullPrompt.trim()}
\`\`\``).join('\n\n')

  return `# Music Video Prompt Package - Nano Banana Pro + ${input.engineLabel}

Source files:
- Script: \`${input.scriptReference.name}\`
- Audio: \`${input.audioReference.name}\`
- Audio length: ${audioDuration}

Reference inputs:
${artistList}
${locationList}

Production logic:
- Output ratio: ${input.aspectRatio}
- N+1 structure: ${sceneCount} scenes x 8s = ${input.duration}s, ${keyframeCount} keyframe images
- Video flow: each scene uses \`first frame = KF[i]\` and \`last frame = KF[i+1]\`
- Script logic: parse SCRIPT_0 by SCENE / LYRICS / VISUAL / CAMERA / GHI CHU, then preserve beat order
- Audio logic: use AUDIO_0 for tempo, emotional rise/drop, pause, and vocal phrase timing
- Reference lock: artist images define fictional character identity; location images guide mood/environment only
- Safety: fictional adults, fully clothed, no real celebrity imitation, no readable random UI text, no logos, no watermark

## Character / Artist Lock

${input.masterDNA}

## Music Video Motif Lock

- Follow the uploaded script file as the main storyboard.
- Follow the uploaded audio file as the emotional and pacing source.
- Use music-video language: intro mood, verse loneliness, pre-chorus visual metaphor, emotional drop, outro resolution.
- Acting should be restrained: eyes, breath, hand hesitation, small posture changes.
- Keep continuity across keyframes: face, outfit, hair, location anchors, color palette, and emotional arc.

## Master Artist / Reference Prompt

\`\`\`text
${input.createImagePrompt.trim()}
\`\`\`

## Nano Banana Pro - Keyframe Image Prompts

${keyframeText}

## ${input.engineLabel} - Scene Prompts

${sceneText}

## Editor Notes

- Use exact lyrics/subtitles from \`${input.scriptReference.name}\` in post-production, not as generated image text.
- Keep audio sync from \`${input.audioReference.name}\`.
- If a location transition is too hard for video generation, render as separate clips and connect them with a music-video match cut.
${input.notes.trim() ? `- User notes: ${input.notes.trim()}` : '- User notes: none'}
`
}

async function generateMusicVideoWithGemini(
  apiKey: string,
  model: string,
  audioReference: MusicAudioReference,
  scriptReference: MusicScriptReference,
  artistImages: MusicImageReference[],
  locationImages: MusicImageReference[],
  duration: number,
  aspectRatio: '9:16' | '16:9',
  notes: string,
  engine: StoryboardVideoEngine,
): Promise<GenerateResult> {
  const durationInfo = DURATIONS.find((entry) => entry.value === duration) || DURATIONS[1]
  const sceneCount = durationInfo.scenes
  const keyframeCount = durationInfo.keyframes
  const engineLabel = engine === 'omni_flash' ? 'Gemini Omni Flash' : 'Veo 3.1'
  const normalizedNotes = normalizePromptWhitespace(notes)
  const audioDuration = audioReference.durationSec
  const parts: GeminiContentPart[] = [
    {
      text: `MUSIC VIDEO INPUT PACKAGE:
- AUDIO_0: ${audioReference.name}${audioDuration ? ` (~${audioDuration.toFixed(1)}s)` : ''}
- SCRIPT_0: ${scriptReference.name}
- Artist reference images: ${artistImages.length}
- Location reference images: ${locationImages.length}

SCRIPT_0 CONTENT:
${scriptReference.text}`,
    },
    {
      inlineData: {
        mimeType: audioReference.mimeType || inferMimeTypeFromDataUrl(audioReference.dataUrl, 'audio/mpeg'),
        data: dataUrlPayload(audioReference.dataUrl),
      },
    },
    { text: 'AUDIO_0 MUSIC REFERENCE: use for tempo, emotional rise, silence/drop timing, vocal phrase energy, and scene pacing. Do not transcribe as dialogue unless SCRIPT_0 provides lyrics.' },
  ]

  artistImages.forEach((item, index) => {
    parts.push({
      inlineData: {
        mimeType: inferMimeTypeFromDataUrl(item.dataUrl, 'image/jpeg'),
        data: dataUrlPayload(item.dataUrl),
      },
    })
    parts.push({ text: `ARTIST_IMAGE_${index}: artist/character visual reference. Preserve fictional identity, face/hair/body/outfit cues only; do not imitate any real celebrity/public figure.` })
  })

  locationImages.forEach((item, index) => {
    parts.push({
      inlineData: {
        mimeType: inferMimeTypeFromDataUrl(item.dataUrl, 'image/jpeg'),
        data: dataUrlPayload(item.dataUrl),
      },
    })
    parts.push({ text: `LOCATION_IMAGE_${index}: optional environment/mood/location reference. Use spatial anchors, light, weather, texture, and color palette only.` })
  })

  const enginePromptMode = engine === 'omni_flash'
    ? `OMNI FLASH MODE:
- Write scene prompts as natural-language video creation/editing instructions.
- Name references clearly: AUDIO_0, SCRIPT_0, ARTIST_IMAGE_0..N, LOCATION_IMAGE_0..N.
- Include audio intent, mood, motion, camera, edit rhythm, and subtitle timing.`
    : `VEO 3 MODE:
- Write scene prompts for first-frame -> last-frame interpolation.
- Every scene is exactly 8 seconds and must name START FRAME, END FRAME, camera movement, emotional transition, audio sync, and continuity locks.
- Keyframes must be usable as Nano Banana Pro image prompts before sending pairs into Veo.`
  const musicVideoAgentSkillBlock = buildGeminiAgentSkillBlock({
    stage: 'music_video',
    skillIds: [
      'reference-lock',
      'nano-banana-image-framework',
      'creative-director-controls',
      'music-video-storyboard',
      'storyboard-engine',
      'veo-prompting-guide',
      'image-to-video-handoff',
      'veo-fast-iteration',
      'veo-native-audio-localization',
      ...(templateScenarioId ? [] : ['veo-continuity' as const]),
      'safety-policy',
      'schema-qa',
    ],
    engineLabel,
    outputContract: `${keyframeCount} MV keyframes + ${sceneCount} MV scenes JSON`,
    runtimeNotes: [
      `Duration setting ${duration}s, detected audio ${audioDuration ? `${audioDuration.toFixed(1)}s` : 'unknown'}.`,
      `Artist reference images: ${artistImages.length}. Location reference images: ${locationImages.length}.`,
      normalizedNotes ? `User notes: ${normalizedNotes}` : 'No user notes.',
    ],
  })

  const systemPrompt = `You are a senior Korean music video storyboard director.

Create a production-ready MUSIC VIDEO storyboard package for ${engineLabel}.

PROJECT CONFIG:
- Target engine: ${engineLabel}
- Duration setting: ${duration}s
- Detected audio duration: ${audioDuration ? `${audioDuration.toFixed(1)}s` : 'unknown; infer from AUDIO_0'}
- Aspect ratio: ${aspectRatio}
- Required output shape: ${keyframeCount} keyframes and ${sceneCount} scenes
- User notes: ${normalizedNotes || 'none'}

${musicVideoAgentSkillBlock}

${enginePromptMode}

SCRIPT PARSING RULE:
- SCRIPT_0 may be CSV like: SCENE, LYRICS, VISUAL, CAMERA, GHI CHU.
- Treat each script row as the primary beat source.
- Preserve lyric meaning and visual intent from the script.
- If script row count differs from required scene count, merge or split beats while preserving order.
- Music video logic should follow the provided script flow: lyric line -> emotional state -> visual scene -> camera language -> notes.

MUSIC VIDEO RULES:
- This is a music video / MV workflow, not a product affiliate ad.
- Use ARTIST_IMAGE references as artist/character identity anchors. If multiple artist images are provided, decide whether they are same artist multi-angle or multiple artists and state that in masterDNA.
- Use LOCATION_IMAGE references only for environment/mood if provided.
- Build keyframes as image prompts: SUBJECT / ACTION / FACING / LOCATION / CAMERA / LIGHTING / STYLE / ASPECT RATIO.
- Build scenes as video prompts from keyframe i to keyframe i+1.
- Include audio sync notes in every scene: lyric phrase, beat rise/drop, silence gap, rain ambience, piano/synth mood, or vocal emotion.
- Keep adult characters fully clothed, modest, fictional, and policy-safe.
- No real celebrity imitation, no readable random UI text, no logos, no unsafe distress, no explicit content.

Return STRICT JSON only:
{
  "resolvedContentType": "fyp",
  "masterDNA": "artist identity lock, music mood, script structure, visual motif, continuity",
  "createImagePrompt": "master reference frame prompt",
  "keyframes": [
    {
      "timestamp": "0s",
      "subject": "...",
      "action": "...",
      "facingDirection": "front | back | left | right | three-quarter-left | three-quarter-right",
      "location": "...",
      "camera": "...",
      "lighting": "...",
      "style": "...",
      "fullPrompt": "complete Nano Banana Pro style image prompt"
    }
  ],
  "scenes": [
    {
      "timeRange": "0-8s",
      "subject": "...",
      "narrative": "...",
      "startPose": "...",
      "endPose": "...",
      "composition": "...",
      "cameraMovement": "Position: <Camera Position> | Motion: <Camera Motion>. ...",
      "lighting": "...",
      "locationFlow": "...",
      "fullPrompt": "complete ${engineLabel} music video prompt using START FRAME and END FRAME"
    }
  ]
}`

  parts.push({ text: systemPrompt })

  const parsed = await requestGeminiJsonWithParts(apiKey, model, parts, 0.76, 8192)
  const rawKeyframes = Array.isArray(parsed.keyframes) ? parsed.keyframes : []
  const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : []
  const resolvedContentType = normalizeHistoryResolvedContentType(parsed.resolvedContentType, 'fyp')

  const keyframes: KeyframePrompt[] = Array.from({ length: keyframeCount }, (_, index) => {
    const raw = (rawKeyframes[index] && typeof rawKeyframes[index] === 'object') ? rawKeyframes[index] as Record<string, unknown> : {}
    const timestamp = typeof raw.timestamp === 'string' && raw.timestamp.trim() ? raw.timestamp.trim() : `${Math.round(index * (duration / Math.max(keyframeCount - 1, 1)))}s`
    const subject = toHistoryString(raw.subject, `Music video artist/character from ARTIST_IMAGE references, beat ${index + 1}.`)
    const action = toHistoryString(raw.action, index === 0 ? 'Opening emotional music-video pose synced to the first lyric.' : 'Continue the lyric-driven emotional progression.')
    const facingCandidate = toHistoryString(raw.facingDirection, 'front') as PromptFacingDirection
    const facingDirection = ['front', 'back', 'left', 'right', 'three-quarter-left', 'three-quarter-right'].includes(facingCandidate)
      ? facingCandidate
      : 'front'
    const location = toHistoryString(raw.location, locationImages.length > 0 ? 'Location-reference inspired MV setting.' : 'Korean ballad MV setting matching the script.')
    const camera = toHistoryString(raw.camera, 'Vertical MV framing, cinematic, artist readable.')
    const lighting = toHistoryString(raw.lighting, 'Music-video lighting matching lyric emotion and audio mood.')
    const style = toHistoryString(raw.style, `${engineLabel} Korean MV storyboard, lyric-driven, cinematic.`)
    const fullPrompt = toHistoryString(raw.fullPrompt, [
      `SUBJECT: ${subject}`,
      `ACTION: ${action}`,
      `FACING: ${facingDirection}`,
      `LOCATION: ${location}`,
      `CAMERA: ${camera}`,
      `LIGHTING: ${lighting}`,
      `STYLE: ${style}`,
      `ASPECT RATIO: ${aspectRatio}`,
    ].join('\n'))

    return { index, timestamp, subject, action, facingDirection, location, camera, lighting, style, fullPrompt }
  })

  const scenes: ScenePrompt[] = Array.from({ length: sceneCount }, (_, index) => {
    const raw = (rawScenes[index] && typeof rawScenes[index] === 'object') ? rawScenes[index] as Record<string, unknown> : {}
    const startSec = index * 8
    const endSec = Math.min(duration, startSec + 8)
    const timeRange = toHistoryString(raw.timeRange, `${startSec}-${endSec}s`)
    const subject = toHistoryString(raw.subject, keyframes[index]?.subject || keyframes[0]?.subject || '')
    const narrative = toHistoryString(raw.narrative, `Music video beat ${index + 1}, following SCRIPT_0 in order and syncing to AUDIO_0.`)
    const startPose = toHistoryString(raw.startPose, keyframes[index]?.action || 'Start from previous MV keyframe.')
    const endPose = toHistoryString(raw.endPose, keyframes[index + 1]?.action || 'End on the next lyric-driven keyframe.')
    const composition = toHistoryString(raw.composition, keyframes[index]?.camera || 'Vertical MV composition.')
    const cameraMovement = toHistoryString(raw.cameraMovement, engine === 'omni_flash' ? 'Natural continuous MV edit with audio-synced camera intent.' : 'Position: Center | Motion: Dolly in. Smooth first-frame to last-frame interpolation synced to AUDIO_0.')
    const lighting = toHistoryString(raw.lighting, keyframes[index]?.lighting || 'Music-video lighting transition.')
    const locationFlow = toHistoryString(raw.locationFlow, 'Preserve continuity unless SCRIPT_0 requests a location transition.')
    const fullPrompt = toHistoryString(raw.fullPrompt, [
      `Use KEYFRAME ${index + 1} as START FRAME and KEYFRAME ${Math.min(index + 2, keyframes.length)} as END FRAME.`,
      `Create an 8-second ${engineLabel} music video scene.`,
      `Narrative: ${narrative}`,
      `Start pose: ${startPose}`,
      `End pose: ${endPose}`,
      `Composition: ${composition}`,
      `Camera movement: ${cameraMovement}`,
      `Lighting: ${lighting}`,
      `Location flow: ${locationFlow}`,
      `Audio sync: follow AUDIO_0 and SCRIPT_0 lyric emotion for this beat.`,
    ].join('\n'))

    return { index, timeRange, subject, narrative, startPose, endPose, composition, cameraMovement, lighting, locationFlow, fullPrompt }
  })

  const masterDNA = toHistoryString(parsed.masterDNA, 'Music video artist identity, audio mood, script flow, and visual continuity lock.')
  const createImagePrompt = toHistoryString(parsed.createImagePrompt, keyframes[0]?.fullPrompt || '')
  const musicVideoPromptMarkdown = buildMusicVideoPromptMarkdown({
    audioReference,
    scriptReference,
    artistImages,
    locationImages,
    duration,
    aspectRatio,
    engineLabel,
    masterDNA,
    createImagePrompt,
    keyframes,
    scenes,
    notes,
  })

  return {
    masterDNA,
    createImagePrompt,
    musicVideoPromptMarkdown,
    keyframes,
    scenes,
    resolvedContentType,
    storyboardEngineUsed: engine,
    storyboardTemplateUsed: 'cinematic_story',
  }
}

async function generateStoryboardVideoWithGemini(
  apiKey: string,
  model: string,
  faceImage: string | null,
  productImage: string | null,
  backgroundImage: string | null,
  duration: number,
  aspectRatio: '9:16' | '16:9',
  notes: string,
  contentType: ContentType,
  engine: StoryboardVideoEngine,
  template: StoryboardTemplate,
  productCategory: ProductCategory,
): Promise<GenerateResult> {
  const durationInfo = DURATIONS.find((entry) => entry.value === duration) || DURATIONS[1]
  const sceneCount = durationInfo.scenes
  const keyframeCount = durationInfo.keyframes
  const engineLabel = engine === 'omni_flash' ? 'Gemini Omni Flash' : 'Veo 3.1'
  const enginePromptMode = engine === 'omni_flash'
    ? `OMNI FLASH MODE:
- Write scene prompts as natural-language video creation/editing instructions.
- Use text/image/audio/video reference naming: IMAGE_0 face, IMAGE_1 product, IMAGE_2 background, VIDEO_0 motion reference if user provides it later, AUDIO_0 beat/sound if user provides it later.
- Include audio intent when useful: music mood, SFX, pacing, caption timing, no unauthorized speech impersonation.
- State what to preserve across edits: identity, outfit, background anchors, timing, and text accuracy.`
    : `VEO 3.1 MODE:
- Write scene prompts for first-frame -> last-frame interpolation.
- Every scene is exactly 8 seconds and must name START FRAME, END FRAME, camera movement, transition logic, and continuity locks.
- Keyframes must be usable as image-generation prompts before sending pairs into Veo.`
  const templateBrief = STORYBOARD_TEMPLATE_OPTIONS.find((item) => item.value === template)?.desc || 'Hook, proof, detail, payoff, CTA'
  const contentTypeForPrompt = contentType === 'auto' ? 'AUTO - choose best fashion affiliate type' : contentType.toUpperCase()
  const selectedProductCategoryOption = PRODUCT_CATEGORY_OPTIONS.find((item) => item.value === normalizeProductCategory(productCategory, 'auto'))
  const productCategoryLine = selectedProductCategoryOption
    ? `${selectedProductCategoryOption.label}: ${selectedProductCategoryOption.detailHint}`
    : 'Auto Boutique: infer product category from product reference image.'
  const normalizedNotes = normalizePromptWhitespace(notes)

  const parts: GeminiContentPart[] = []
  if (faceImage) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: faceImage.split(',')[1] || faceImage } })
    parts.push({ text: 'IMAGE_0 FACE REFERENCE: identity-only. Preserve facial likeness; ignore old outfit/background.' })
  }
  if (productImage) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: productImage.split(',')[1] || productImage } })
    parts.push({ text: 'IMAGE_1 PRODUCT REFERENCE: outfit/product source. Preserve garment color, material, silhouette, trims, seams, hardware, footwear, and accessories exactly.' })
  }
  if (backgroundImage) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: backgroundImage.split(',')[1] || backgroundImage } })
    parts.push({ text: 'IMAGE_2 BACKGROUND REFERENCE: environment/location/lighting cues only. Preserve spatial anchors when requested.' })
  }
  const storyboardAgentSkillBlock = buildGeminiAgentSkillBlock({
    stage: 'storyboard_video',
    skillIds: [
      'reference-lock',
      'nano-banana-image-framework',
      'creative-director-controls',
      'storyboard-engine',
      'fashion-affiliate-strategy',
      'realtime-web-visualization',
      'veo-prompting-guide',
      'image-to-video-handoff',
      'veo-fast-iteration',
      'veo-native-audio-localization',
      'veo-continuity',
      'safety-policy',
      'schema-qa',
    ],
    engineLabel,
    outputContract: `${keyframeCount} storyboard keyframes + ${sceneCount} storyboard scenes JSON`,
    runtimeNotes: [
      `Template ${template.toUpperCase()}: ${templateBrief}.`,
      `Content type ${contentTypeForPrompt}; product category ${productCategoryLine}.`,
      normalizedNotes ? `User notes: ${normalizedNotes}` : 'No user notes.',
    ],
  })

  const systemPrompt = `You are a senior AI video storyboard director for fashion affiliate videos.

Create a production-ready storyboard package for ${engineLabel}.

PROJECT CONFIG:
- Target engine: ${engineLabel}
- Template: ${template.toUpperCase()} (${templateBrief})
- Duration: ${duration}s
- Aspect ratio: ${aspectRatio}
- Required storyboard shape: ${keyframeCount} keyframes and ${sceneCount} scenes
- Content type: ${contentTypeForPrompt}
- Product category: ${productCategoryLine}
- User notes: ${normalizedNotes || 'none'}

${storyboardAgentSkillBlock}

${enginePromptMode}

STORYBOARD RULES:
- Keep adult fashion/product presentation tasteful and platform-safe.
- Anchor face identity to IMAGE_0 when provided.
- Anchor product/outfit details to IMAGE_1 when provided.
- Anchor background/location to IMAGE_2 only when provided.
- Create a clear beat order: hook -> product proof -> detail -> motion/styling -> payoff/CTA.
- Use stable full-body or medium-wide readability for garment proof before close-ups.
- Avoid random logos, random text, extra bags, outfit redesign, warped hands, and impossible body proportions.
- If on-screen text is used, keep it short, readable, and exact.

Return STRICT JSON only:
{
  "resolvedContentType": "ootd | ootdmirror | tiktokshop | outfitideas | grwm | review | haul | styling | fyp | boutiquefeed | luxury | sunnyaura | streetstyle | athleisure | partyoutfit",
  "masterDNA": "short identity, outfit, visual style, continuity and production direction",
  "createImagePrompt": "one master hero/reference frame prompt for the first storyboard frame",
  "keyframes": [
    {
      "timestamp": "0s",
      "subject": "...",
      "action": "...",
      "facingDirection": "front | back | left | right | three-quarter-left | three-quarter-right",
      "location": "...",
      "camera": "...",
      "lighting": "...",
      "style": "...",
      "fullPrompt": "complete image prompt for this storyboard panel"
    }
  ],
  "scenes": [
    {
      "timeRange": "0-8s",
      "subject": "...",
      "narrative": "...",
      "startPose": "...",
      "endPose": "...",
      "composition": "...",
      "cameraMovement": "...",
      "lighting": "...",
      "locationFlow": "...",
      "fullPrompt": "complete ${engineLabel} video prompt for this beat"
    }
  ]
}`

  parts.push({ text: systemPrompt })

  const parsed = await requestGeminiJsonWithParts(apiKey, model, parts, 0.78, 8192)
  const resolvedContentType = normalizeHistoryResolvedContentType(parsed.resolvedContentType, contentType === 'auto' ? 'outfitideas' : contentType as ResolvedContentType)
  const rawKeyframes = Array.isArray(parsed.keyframes) ? parsed.keyframes : []
  const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : []

  const keyframes: KeyframePrompt[] = Array.from({ length: keyframeCount }, (_, index) => {
    const raw = (rawKeyframes[index] && typeof rawKeyframes[index] === 'object') ? rawKeyframes[index] as Record<string, unknown> : {}
    const timestamp = typeof raw.timestamp === 'string' && raw.timestamp.trim() ? raw.timestamp.trim() : `${Math.round(index * (duration / Math.max(keyframeCount - 1, 1)))}s`
    const subject = toHistoryString(raw.subject, `Adult fashion model wearing the exact referenced product for ${engineLabel} storyboard.`)
    const action = toHistoryString(raw.action, index === 0 ? 'Clean hook pose with full outfit readability.' : 'Continue storyboard motion while preserving product details.')
    const facingCandidate = toHistoryString(raw.facingDirection, 'front') as PromptFacingDirection
    const facingDirection = ['front', 'back', 'left', 'right', 'three-quarter-left', 'three-quarter-right'].includes(facingCandidate)
      ? facingCandidate
      : 'front'
    const location = toHistoryString(raw.location, backgroundImage ? 'Reference-inspired location with stable anchors.' : 'Clean fashion studio set.')
    const camera = toHistoryString(raw.camera, 'Medium-wide vertical fashion framing, full outfit readable.')
    const lighting = toHistoryString(raw.lighting, 'Soft premium lighting with texture-enhancing rim light.')
    const style = toHistoryString(raw.style, `${engineLabel} fashion storyboard, realistic, product-first.`)
    const fullPrompt = toHistoryString(raw.fullPrompt, [
      `SUBJECT: ${subject}`,
      `ACTION: ${action}`,
      `FACING: ${facingDirection}`,
      `LOCATION: ${location}`,
      `CAMERA: ${camera}`,
      `LIGHTING: ${lighting}`,
      `STYLE: ${style}`,
    ].join('\n'))

    return { index, timestamp, subject, action, facingDirection, location, camera, lighting, style, fullPrompt }
  })

  const scenes: ScenePrompt[] = Array.from({ length: sceneCount }, (_, index) => {
    const raw = (rawScenes[index] && typeof rawScenes[index] === 'object') ? rawScenes[index] as Record<string, unknown> : {}
    const startSec = index * 8
    const endSec = Math.min(duration, startSec + 8)
    const timeRange = toHistoryString(raw.timeRange, `${startSec}-${endSec}s`)
    const subject = toHistoryString(raw.subject, keyframes[index]?.subject || keyframes[0]?.subject || '')
    const narrative = toHistoryString(raw.narrative, `Storyboard beat ${index + 1} for ${engineLabel}, preserving face, product, and background continuity.`)
    const startPose = toHistoryString(raw.startPose, keyframes[index]?.action || 'Start from previous storyboard panel.')
    const endPose = toHistoryString(raw.endPose, keyframes[index + 1]?.action || 'End with product-readable pose.')
    const composition = toHistoryString(raw.composition, keyframes[index]?.camera || 'Vertical product-first composition.')
    const cameraMovement = toHistoryString(raw.cameraMovement, engine === 'omni_flash' ? 'Natural continuous video edit with smooth camera intent.' : 'Smooth first-frame to last-frame interpolation.')
    const lighting = toHistoryString(raw.lighting, keyframes[index]?.lighting || 'Consistent lighting across the beat.')
    const locationFlow = toHistoryString(raw.locationFlow, 'Keep one coherent location with stable anchors.')
    const fallbackPrompt = engine === 'omni_flash'
      ? [
        `Create/edit a ${timeRange} ${aspectRatio} video beat for Gemini Omni Flash.`,
        `Subject: ${subject}`,
        `Action: ${narrative}`,
        `Preserve: face identity, exact product details, timing, background anchors, and readable on-screen text.`,
        `Camera: ${cameraMovement}`,
        `Lighting/location: ${lighting}; ${locationFlow}`,
      ].join('\n')
      : [
        `Veo 3.1 scene ${index + 1}, ${timeRange}, ${aspectRatio}.`,
        `START FRAME: ${startPose}`,
        `END FRAME: ${endPose}`,
        `ACTION: ${narrative}`,
        `CAMERA: ${cameraMovement}`,
        `CONTINUITY: preserve identity, exact product details, lighting, and location anchors.`,
      ].join('\n')
    const fullPrompt = toHistoryString(raw.fullPrompt, fallbackPrompt)

    return { index, timeRange, subject, narrative, startPose, endPose, composition, cameraMovement, lighting, locationFlow, fullPrompt }
  })

  return {
    masterDNA: toHistoryString(parsed.masterDNA, `${engineLabel} storyboard for ${templateBrief}, anchored to provided references.`),
    keyframes,
    scenes,
    createImagePrompt: toHistoryString(parsed.createImagePrompt, keyframes[0]?.fullPrompt || ''),
    resolvedContentType,
    affiliateModeUsed: FIXED_AFFILIATE_MODE,
    salesTemplateUsed: FIXED_SALES_TEMPLATE,
    storyboardEngineUsed: engine,
    storyboardTemplateUsed: template,
  }
}

async function generateLookbookImagePromptWithGemini(
  apiKey: string,
  model: string,
  faceImage: string | null,
  productImage: string | null,
  backgroundImage: string | null,
  aspectRatio: '9:16' | '16:9',
  notes: string,
  imageCount: LookbookImageCount,
  styleTone: LookbookStyleTone,
  theme: LookbookTheme,
  poseDirectionLock: LookbookPoseDirectionLock,
  contentType: ContentType = 'outfitideas',
): Promise<{
  masterDNA: string
  lookbookImagePrompts: LookbookImagePrompt[]
  resolvedContentType: ResolvedContentType
}> {
  const resolvedContentType = resolveLookbookImageContentType(contentType)
  const themeOption = getLookbookThemeOption(theme)
  const fallbackMasterDNA = buildCharacterDNA(notes, resolvedContentType)
  const fallbackPromptSet = buildLookbookImagePromptSet(
    resolvedContentType,
    notes,
    aspectRatio,
    imageCount,
    styleTone,
    theme,
    poseDirectionLock,
  )

  const parts: GeminiContentPart[] = []
  if (faceImage) {
    const base64 = faceImage.split(',')[1] || faceImage
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    })
    parts.push({ text: 'FACE REFERENCE: preserve facial identity only. Ignore background and props.' })
  }

  if (productImage) {
    const base64 = productImage.split(',')[1] || productImage
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    })
    parts.push({ text: 'GARMENT REFERENCE: preserve exact product details, colors, material, and silhouette.' })
  }

  if (backgroundImage) {
    const base64 = backgroundImage.split(',')[1] || backgroundImage
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    })
    parts.push({ text: 'BACKGROUND LOCATION REFERENCE: use environment/location cues only; do not copy people/garments/logos as identity.' })
  }
  const lookbookAgentSkillBlock = buildGeminiAgentSkillBlock({
    stage: 'lookbook_image',
    skillIds: [
      'reference-lock',
      'nano-banana-image-framework',
      'image-text-localization',
      'creative-director-controls',
      'lookbook-image',
      'fashion-affiliate-strategy',
      'realtime-web-visualization',
      'safety-policy',
      'schema-qa',
    ],
    outputContract: `${imageCount} standalone lookbook image prompts JSON`,
    runtimeNotes: [
      `Content style ${resolvedContentType.toUpperCase()}, aspect ratio ${aspectRatio}.`,
      `Theme ${themeOption.label}; tone ${styleTone.toUpperCase()}; pose direction ${poseDirectionLock.toUpperCase()}.`,
      notes.trim() ? `User notes: ${notes.trim()}` : 'No user notes.',
    ],
  })

  const prompt = `You are an expert fashion creative director for affiliate lookbook imagery.

TASK:
- Create exactly ${imageCount} standalone lookbook image prompts (no video prompt).
- Output must optimize for outfit readability and conversion-oriented styling proof.
- The output will be used directly in an image model, not Veo video.

INPUT:
- Target content style: ${resolvedContentType.toUpperCase()}
- Target aspect ratio: ${aspectRatio}
- Lookbook style tone: ${styleTone.toUpperCase()}
- Lookbook theme: ${theme.toUpperCase()} (${themeOption.label})
- Pose direction lock: ${poseDirectionLock.toUpperCase()}
- Background location reference: ${backgroundImage ? 'provided (use as environment guidance only)' : 'not provided'}
${notes ? `- User notes: ${notes}` : '- User notes: none'}

${lookbookAgentSkillBlock}

TIKTOK SIGNAL REFERENCE:
${LOOKBOOK_TIKTOK_SIGNAL_HINT}

REQUIREMENTS:
- Keep exact face identity and exact garment fidelity from references.
- If background location reference is provided: prioritize location/environment cues from it, but keep identity and garment lock from face/product references.
- Keep prompt practical and social-native for lookbook usage.
- Do NOT include timeline language, keyframes, scenes, transitions, interpolation, or motion continuity instructions.
- Do NOT mention real celebrities/public figures.
- If style tone is SEXY: keep it tasteful, classy, fashion-first, and non-explicit.
- Theme lock: ${theme === 'auto' ? 'Auto theme balance is allowed.' : `Keep every prompt aligned with this theme direction: ${themeOption.promptHint}`}
- Pose direction lock: ${poseDirectionLock === 'auto'
    ? 'Alternate natural facing direction across prompts for variety.'
    : `Every prompt MUST keep facingDirection exactly "${poseDirectionLock}" and action text must reinforce the same body-facing direction.`}
- For each image prompt, enforce Nano Banana Pro frame format parity with video keyframe format:
  SUBJECT -> ACTION -> FACING -> LOCATION -> CAMERA -> LIGHTING -> STYLE -> ASPECT RATIO.

NANO BANANA PRO IMAGE RULES (MANDATORY):
${LOOKBOOK_NANO_BANANA_PRO_RULES}

SHOT BLUEPRINT (must cover all):
${LOOKBOOK_SHOT_BLUEPRINTS.map((item, index) => `${index + 1}. ${item.title} — ${item.purpose}. ${item.directive}`).join('\n')}
- If requested image count exceeds blueprint length, continue with unique variations (different pose, camera angle, or lighting) while preserving identity and garment fidelity.

Return strict JSON only:
{
  "masterDNA": "concise identity lock summary",
  "lookbookImagePrompts": [
    {
      "index": 0,
      "title": "...",
      "purpose": "...",
      "subject": "...",
      "action": "...",
      "facingDirection": "front|back|left|right|three-quarter-left|three-quarter-right",
      "location": "...",
      "camera": "...",
      "lighting": "...",
      "style": "...",
      "prompt": "Must follow exact field order: SUBJECT/ACTION/FACING/LOCATION/CAMERA/LIGHTING/STYLE/ASPECT RATIO"
    }
  ]
}`

  try {
    const parsed = await requestGeminiJsonWithParts(
      apiKey,
      model,
      [...parts, { text: prompt }],
      0.62,
      4096,
    )

    const toSafeString = (value: unknown, fallback: string) => {
      if (typeof value !== 'string') return fallback
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : fallback
    }

    const masterDNA = toSafeString((parsed as Record<string, unknown>).masterDNA, fallbackMasterDNA)
    const lookbookImagePrompts = normalizeLookbookImagePromptList(
      (parsed as Record<string, unknown>).lookbookImagePrompts,
      fallbackPromptSet,
      aspectRatio,
      imageCount,
      styleTone,
      theme,
      poseDirectionLock,
    )

    return {
      masterDNA,
      lookbookImagePrompts,
      resolvedContentType,
    }
  } catch (error: any) {
    throw new Error(error?.message || 'Gemini lookbook image prompt generation failed')
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

function dataUrlPayload(dataUrl: string): string {
  return dataUrl.split(',')[1] || dataUrl
}

function inferMimeTypeFromDataUrl(dataUrl: string, fallback: string): string {
  const match = dataUrl.match(/^data:([^;,]+)[;,]/)
  return match?.[1] || fallback
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Khong the doc file thanh data URL'))
      }
    }
    reader.onerror = () => reject(new Error('Khong the doc file'))
    reader.readAsDataURL(file)
  })
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Khong the doc file text'))
      }
    }
    reader.onerror = () => reject(new Error('Khong the doc file kich ban'))
    reader.readAsText(file, 'utf-8')
  })
}

function readAudioDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    const cleanup = () => URL.revokeObjectURL(url)
    audio.onloadedmetadata = () => {
      const value = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : undefined
      cleanup()
      resolve(value)
    }
    audio.onerror = () => {
      cleanup()
      resolve(undefined)
    }
    audio.src = url
  })
}

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

function normalizeHistoryGenerationMode(value: unknown, fallback: GenerationMode = 'video_prompt'): GenerationMode {
  const candidate = toHistoryString(value, fallback).toLowerCase()
  if (candidate === 'lookbook_image') return 'lookbook_image'
  if (candidate === 'storyboard_video') return 'storyboard_video'
  if (candidate === 'music_video') return 'music_video'
  return 'video_prompt'
}

function normalizeStoryboardVideoEngine(value: unknown, fallback: StoryboardVideoEngine = 'veo_3_1'): StoryboardVideoEngine {
  const candidate = toHistoryString(value, fallback).toLowerCase()
  return candidate === 'omni_flash' ? 'omni_flash' : 'veo_3_1'
}

function normalizeStoryboardTemplate(value: unknown, fallback: StoryboardTemplate = 'product_launch'): StoryboardTemplate {
  const candidate = toHistoryString(value, fallback).toLowerCase()
  if (candidate === 'ugc_review' || candidate === 'cinematic_story') return candidate
  return 'product_launch'
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

function resolveTikTokAnalysisContentType(value: unknown, fallback: ContentType = 'tiktokshop'): ContentType {
  const fallbackType = CONTENT_TYPE_VALUES.includes(fallback as ContentType) ? fallback : 'tiktokshop'
  const candidate = toHistoryString(value, '').toLowerCase()
  if (!candidate) return fallbackType

  if (CONTENT_TYPE_VALUES.includes(candidate as ContentType)) {
    return candidate as ContentType
  }

  const compact = candidate.replace(/[^a-z0-9]/g, '')
  const aliasMatches: Array<{ token: string; value: ContentType }> = [
    { token: 'ootdmirror', value: 'ootdmirror' },
    { token: 'outfitideas', value: 'outfitideas' },
    { token: 'streetstyle', value: 'streetstyle' },
    { token: 'partyoutfit', value: 'partyoutfit' },
    { token: 'boutiquefeed', value: 'boutiquefeed' },
    { token: 'tiktokshop', value: 'tiktokshop' },
    { token: 'athleisure', value: 'athleisure' },
    { token: 'sunnyaura', value: 'sunnyaura' },
    { token: 'styling', value: 'styling' },
    { token: 'luxury', value: 'luxury' },
    { token: 'review', value: 'review' },
    { token: 'grwm', value: 'grwm' },
    { token: 'haul', value: 'haul' },
    { token: 'fyp', value: 'fyp' },
    { token: 'ootd', value: 'ootd' },
  ]

  const directMatch = aliasMatches.find((entry) => compact.includes(entry.token))
  if (directMatch) return directMatch.value

  if (compact.includes('tiktok') || compact.includes('shop')) return 'tiktokshop'
  if (compact.includes('boutique')) return 'boutiquefeed'
  if (compact.includes('mirror')) return 'ootdmirror'
  if (compact.includes('lookbook') || compact.includes('outfitidea')) return 'outfitideas'
  if (compact.includes('street')) return 'streetstyle'
  if (compact.includes('party')) return 'partyoutfit'
  if (compact.includes('sunny') || compact.includes('sun')) return 'sunnyaura'
  if (compact.includes('getready')) return 'grwm'

  return fallbackType
}

function resolveTikTokAnalysisDuration(value: unknown, fallback = 32): number {
  const fallbackDuration = normalizeHistoryDuration(fallback, 32)
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return fallbackDuration

  const closest = DURATIONS.reduce((best, option) => {
    const bestGap = Math.abs(best.value - numeric)
    const nextGap = Math.abs(option.value - numeric)
    return nextGap < bestGap ? option : best
  }, DURATIONS[0])

  return closest.value
}

function buildTikTokScriptBeatReferences(script: string, sceneCount: number): string[] {
  if (sceneCount <= 0) return []

  const cleanedScript = script.trim()
  if (cleanedScript.length === 0) return []

  const fromLines = cleanedScript
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line
      .replace(/^\d+\s*[-–]\s*\d+\s*s?\s*[:：-]?\s*/i, '')
      .replace(/^[-*•]+\s*/, '')
      .trim())
    .filter((line) => line.length > 0)

  const fallbackSentences = cleanedScript
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)

  const units = fromLines.length > 0 ? fromLines : fallbackSentences
  if (units.length === 0) return []

  const beats: string[] = []
  for (let sceneIndex = 0; sceneIndex < sceneCount; sceneIndex += 1) {
    const start = Math.floor((sceneIndex * units.length) / sceneCount)
    const endExclusive = Math.max(start + 1, Math.floor(((sceneIndex + 1) * units.length) / sceneCount))
    const chunk = units.slice(start, Math.min(endExclusive, units.length)).join(' ').trim()
    beats.push(chunk || units[Math.min(start, units.length - 1)])
  }

  return beats.map((beat) => beat.replace(/\s+/g, ' ').trim())
}

function buildTikTokContextBeatReferences(sceneBeats: TikTokScriptBeat[], sceneCount: number): string[] {
  if (sceneCount <= 0) return []

  const contextUnits = sceneBeats
    .map((beat) => [
      beat.contextHint,
      beat.description,
      beat.beatName,
    ].map((part) => part.trim()).filter((part) => part.length > 0).join(' | '))
    .map((entry) => entry.replace(/\s+/g, ' ').trim())
    .filter((entry) => entry.length > 0)

  if (contextUnits.length === 0) return []

  const mapped: string[] = []
  for (let sceneIndex = 0; sceneIndex < sceneCount; sceneIndex += 1) {
    const start = Math.floor((sceneIndex * contextUnits.length) / sceneCount)
    mapped.push(contextUnits[Math.min(start, contextUnits.length - 1)])
  }

  return mapped
}

function buildTikTokContextRemixLocationFallback(contextHint: string): string {
  const normalized = normalizeLocationKey(contextHint)

  if (/mirror|fitting|changing|boutique|shop|store|retail|thu do|cua hang/.test(normalized)) {
    return LOCKED_LOCATION_LIBRARY[1]
  }

  if (/cafe|coffee/.test(normalized)) {
    return LOCKED_LOCATION_LIBRARY[12]
  }

  if (/street|sidewalk|walking|outdoor|outside|ngoai troi|pho|road/.test(normalized)) {
    return LOCKED_LOCATION_LIBRARY[18]
  }

  if (/studio|indoor|room|apartment|home|nha/.test(normalized)) {
    return LOCKED_LOCATION_LIBRARY[0]
  }

  if (/mall|shopping|department/.test(normalized)) {
    return LOCKED_LOCATION_LIBRARY[7]
  }

  return getLockedLocationFallback('flex')
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
  const metadataGenerationMode = normalizeHistoryGenerationMode(metadata.generationMode, 'video_prompt')
  const promptPackage = getPromptPackageFromMetadata(metadata)
  const promptRecord = toHistoryRecord(promptPackage) || {}

  const rawKeyframes = Array.isArray(promptRecord.keyframes) ? promptRecord.keyframes : []
  const rawScenes = Array.isArray(promptRecord.scenes) ? promptRecord.scenes : []
  const rawLookbookPrompts = Array.isArray(promptRecord.lookbookImagePrompts) ? promptRecord.lookbookImagePrompts : []
  const generatedLocations = toHistoryStringList(metadata.generatedLocations, 12)
  const metadataLookbookImageCount = normalizeLookbookImageCount(
    metadata.lookbookImageCount,
    coerceLookbookImageCountFromLength(rawLookbookPrompts.length),
  )
  const metadataLookbookStyleTone = normalizeLookbookStyleTone(metadata.lookbookStyleTone, 'standard')
  const metadataLookbookTheme = normalizeLookbookTheme(metadata.lookbookTheme, 'auto')
  const metadataLookbookPoseDirectionLock: LookbookPoseDirectionLock = 'auto'

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
  const imageOnlyPrompt = toHistoryString(
    promptRecord.createImagePrompt,
    buildLookbookImageOnlyPrompt(
      resolvedType,
      item.notes || '',
      aspectRatio,
      metadataLookbookStyleTone,
      metadataLookbookTheme,
      metadataLookbookPoseDirectionLock,
    ),
  )
  const lookbookPromptFallback = buildLookbookImagePromptSet(
    resolvedType,
    item.notes || '',
    aspectRatio,
    metadataLookbookImageCount,
    metadataLookbookStyleTone,
    metadataLookbookTheme,
    metadataLookbookPoseDirectionLock,
  )
  if (imageOnlyPrompt.length > 0) {
    lookbookPromptFallback[0] = {
      ...lookbookPromptFallback[0],
      prompt: ensureLookbookNanoBananaPrompt(
        ensureLookbookAspectRatioTag(imageOnlyPrompt, aspectRatio),
        {
          subject: lookbookPromptFallback[0].subject || buildDefaultFrameSubject(aspectRatio),
          action: lookbookPromptFallback[0].action || 'Front-facing hero pose with clear outfit readability and realistic posture.',
          facingDirection: lookbookPromptFallback[0].facingDirection || LOOKBOOK_NANO_BANANA_FACING_SEQUENCE[0],
          location: lookbookPromptFallback[0].location || getLockedLocationFallback('flex'),
          camera: lookbookPromptFallback[0].camera || 'Fashion editorial camera framing, stable axis, realistic proportions.',
          lighting: lookbookPromptFallback[0].lighting || 'Clean editorial soft lighting with texture clarity.',
          style: lookbookPromptFallback[0].style || 'Social-native lookbook editorial style, trust-first realism.',
        },
        aspectRatio,
      ),
    }
  }
  const lookbookImagePrompts = normalizeLookbookImagePromptList(
    promptRecord.lookbookImagePrompts,
    lookbookPromptFallback,
    aspectRatio,
    metadataLookbookImageCount,
    metadataLookbookStyleTone,
    metadataLookbookTheme,
    metadataLookbookPoseDirectionLock,
  )
  const looksLikeImageOnly = metadataGenerationMode === 'lookbook_image'
    || (rawKeyframes.length === 0 && rawScenes.length === 0 && imageOnlyPrompt.length > 0)

  if (looksLikeImageOnly) {
    return {
      masterDNA,
      keyframes: [],
      scenes: [],
      createImagePrompt: lookbookImagePrompts[0]?.prompt || imageOnlyPrompt,
      lookbookImagePrompts,
      resolvedContentType: resolvedType,
      affiliateModeUsed: FIXED_AFFILIATE_MODE,
      salesTemplateUsed: FIXED_SALES_TEMPLATE,
    }
  }

  const fallbackLocation = (index: number) => {
    if (generatedLocations.length > 0) {
      const fromHistory = generatedLocations[index % generatedLocations.length]
      const resolvedFromHistory = resolveLockedLocationEntry(fromHistory)
      if (resolvedFromHistory) {
        return resolvedFromHistory
      }
    }
    return getLockedLocationFallback('mirror', index)
  }

  const defaultHistoryFacingSequence = duration >= 32
    ? LONG_DURATION_FACING_SEQUENCE
    : RULE32_FACING_SEQUENCE

  const keyframes: KeyframePrompt[] = Array.from({ length: normalizedKeyframeCount }, (_, index) => {
    const raw = toHistoryRecord(rawKeyframes[index]) || {}

    const subject = toHistoryString(
      raw.subject,
      buildDefaultFrameSubject(aspectRatio),
    )
    const action = toHistoryString(raw.action, `Fashion showcase movement beat ${index + 1}`)
    const rawLocation = toHistoryString(raw.location, '')
    const location = resolveLockedLocationEntry(rawLocation) || fallbackLocation(index)
    const camera = toHistoryString(raw.camera, 'AI-selected framing and lens optimized for TikTok fashion storytelling')
    const lighting = toHistoryString(raw.lighting, 'Soft cinematic lighting prioritizing product readability')
    const style = toHistoryString(raw.style, 'TikTok fashion editorial aesthetic with social-native realism')
    const timestamp = toHistoryString(raw.timestamp, `${Math.round((index * duration) / Math.max(normalizedKeyframeCount - 1, 1))}s`)
    const facingDirection = normalizeLookbookFacingDirection(
      raw.facingDirection ?? action ?? camera,
      defaultHistoryFacingSequence[index % defaultHistoryFacingSequence.length],
    )
    const fullPrompt = toHistoryString(
      raw.fullPrompt,
      buildNanoBananaProFramePrompt({
        subject,
        action,
        facingDirection,
        location,
        camera,
        lighting,
        style,
        aspectRatio,
      }),
    )

    return {
      index,
      timestamp,
      subject,
      action,
      facingDirection,
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
      const startLocation = keyframes[index]?.location || getLockedLocationFallback('mirror', index)
      const endLocation = keyframes[index + 1]?.location || startLocation
      const derivedLocationFlow = normalizeLocationKey(startLocation) === normalizeLocationKey(endLocation)
        ? `Hold location: ${startLocation}`
        : `${startLocation} -> ${endLocation}`
      const locationFlow = toHistoryString(raw.locationFlow, derivedLocationFlow)
    const narrative = toHistoryString(
      raw.narrative,
      `Retention beat ${index + 1}: smooth transition from keyframe ${index + 1} to keyframe ${index + 2}.`,
    )
    const cameraMovement = normalizeSceneCameraMovementSpec(
      toHistoryString(raw.cameraMovement, ''),
      'Stable cinematic move with clean social-native pacing',
    )
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
    storyboardEngineUsed: metadataGenerationMode === 'storyboard_video' || metadataGenerationMode === 'music_video'
      ? normalizeStoryboardVideoEngine(metadata.storyboardEngine, 'veo_3_1')
      : undefined,
    storyboardTemplateUsed: metadataGenerationMode === 'storyboard_video' || metadataGenerationMode === 'music_video'
      ? normalizeStoryboardTemplate(metadata.storyboardTemplate, 'product_launch')
      : undefined,
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
  const seoAgentSkillBlock = buildGeminiAgentSkillBlock({
    stage: 'seo_copy',
    skillIds: ['commerce-copy', 'safety-policy', 'schema-qa'],
    outputContract: '3 TikTok Shop SEO variants JSON',
    runtimeNotes: [
      `Product name: ${trimmedProductName}.`,
      `Preferred content type: ${contentHint}; sales template: ${salesTemplateHint}.`,
      trimmedNotes ? `Additional notes: ${trimmedNotes}` : 'No additional notes.',
    ],
  })

  const systemPrompt = `You are a senior TikTok Shop content strategist and copywriter.

INPUT:
- Product name: ${trimmedProductName}
- Preferred content type: ${contentHint}
- Sales template: ${salesTemplateHint}
${trimmedNotes ? `- Additional notes: ${trimmedNotes}` : '- Additional notes: none'}

${seoAgentSkillBlock}

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
  const voiceoverAgentSkillBlock = buildGeminiAgentSkillBlock({
    stage: 'voiceover',
    skillIds: ['commerce-copy', 'safety-policy', 'schema-qa'],
    outputContract: 'one 25-35 second voiceover script JSON',
    runtimeNotes: [
      `Product name: ${trimmedProductName}.`,
      `Preferred content type: ${contentHint}; sales template: ${salesTemplateHint}.`,
      trimmedNotes ? `Additional notes: ${trimmedNotes}` : 'No additional notes.',
    ],
  })

  const systemPrompt = `You are a senior TikTok Shop video script writer.

INPUT:
- Product name: ${trimmedProductName}
- Preferred content type: ${contentHint}
- Sales template: ${salesTemplateHint}
${trimmedNotes ? `- Additional notes: ${trimmedNotes}` : '- Additional notes: none'}

${voiceoverAgentSkillBlock}

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
  const tiktokAnalysisAgentSkillBlock = buildGeminiAgentSkillBlock({
    stage: 'tiktok_analysis',
    skillIds: ['tiktok-analysis-transfer', 'safety-policy', 'schema-qa'],
    outputContract: 'detached TikTok analysis JSON with reusable beats and product-agnostic script',
    runtimeNotes: [
      'Source video is structure-only reference.',
      trimmedNotes ? `Additional context: ${trimmedNotes}` : 'No additional context.',
    ],
  })

  const analyzePrompt = `You are a senior TikTok content strategist and video director.

Analyze the provided TikTok video carefully and return STRICT JSON only.

${trimmedNotes ? `Additional context from user: ${trimmedNotes}` : ''}

${tiktokAnalysisAgentSkillBlock}

ANALYSIS TASKS:
1. Identify the content type (ootd, grwm, review, haul, tiktokshop, boutiquefeed, fyp, styling, athleisure, outfitideas, luxury, partyoutfit, streetstyle, sunnyaura, or describe a custom type).
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
  - contextHint (background/setting cues to remix later: indoor/outdoor, venue type, prop density, movement space)
   - cameraHint (camera movement / framing observed)
   - narrationHint (what would be said or implied in narration)
9. Based on the analysis, generate a ready-to-use Vietnamese kịch bản (script) for creating a SIMILAR video for a new fashion/affiliate product. The script must:
   - Follow the same structural pattern and pacing as the analyzed video
   - Be written in natural Vietnamese
   - Include stage directions in brackets e.g. [Camera: full-body reveal]
   - Cover hook → showcase → close structure
   - Be 150-250 words total

STRICT OUTPUT CONSTRAINTS (MUST FOLLOW):
- The downstream generator will use separate uploaded face/product images.
- Do NOT preserve or copy any analyzed-video identity cues (face, body traits, age cues, hairstyle identity, accessories identity).
- Do NOT preserve or copy analyzed-video garment specifics (exact outfit type, pattern, material, logo, colorway).
- For generatedScript, keep wording product-agnostic with placeholders like [MODEL], [SAN PHAM], [BENEFIT 1], [CTA].
- Focus only on reusable structure: hook logic, pacing, beat progression, camera rhythm, and CTA flow.
- Preserve reusable context logic for later remix: background type, scene atmosphere, movement space, and transition style.

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
      "contextHint": "...",
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
      contextHint: toStr(beat?.contextHint, ''),
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

async function generatePromptPackageFromTikTokAnalysisWithGemini(
  apiKey: string,
  model: string,
  faceImage: string | null,
  productImage: string | null,
  backgroundImage: string | null,
  duration: number,
  aspectRatio: '9:16' | '16:9',
  analysis: TikTokAnalysisResult,
  reviewNotes: string,
  options?: {
    enforceFrontFaceQuarterBodyLock?: boolean
    enforceConciseVisualOnlyAction?: boolean
    templateCameraFormat?: 'mirror_phone' | 'front_camera'
    enforceRearMirrorReflection?: boolean
    templateScenarioId?: OotdTemplateScenarioId
  },
): Promise<GenerateResult> {
  const durationInfo = DURATIONS.find((entry) => entry.value === duration) || DURATIONS[1]
  const sceneCount = durationInfo.scenes
  const keyframeCount = durationInfo.keyframes
  const resolvedContentTypeCandidate = resolveTikTokAnalysisContentType(analysis.detectedContentType, 'outfitideas')
  const resolvedContentType: ResolvedContentType = resolvedContentTypeCandidate === 'auto'
    ? 'outfitideas'
    : resolvedContentTypeCandidate

  const reviewProductBrief = reviewNotes.trim().length > 0
    ? reviewNotes.trim()
    : 'San pham can review duoc xac dinh tu input hien tai.'
  const hasBackgroundLocationReference = Boolean(backgroundImage)
  const shouldApplyFrontFaceQuarterBodyLock = options?.enforceFrontFaceQuarterBodyLock === true
  const shouldEnforceConciseVisualOnlyAction = options?.enforceConciseVisualOnlyAction === true
  const templateCameraFormat = options?.templateCameraFormat || 'mirror_phone'
  const isFrontCameraTemplate = templateCameraFormat === 'front_camera'
  const shouldEnforceRearMirrorReflection = options?.enforceRearMirrorReflection === true
  const templateScenarioId = options?.templateScenarioId
  const isCozyTemplateScenario = templateScenarioId === 'cozy_home_background'
  const isNightCityTemplateScenario = templateScenarioId === 'night_city_glam'
  const isRelaxedBoutiqueTemplateScenario = templateScenarioId === 'relaxed_boutique_camera'
  const isFreeStyleProductReviewTemplateScenario = templateScenarioId === 'free_style_product_review'
  const shouldUseRelaxedBoutique32sBackDetailLean = isRelaxedBoutiqueTemplateScenario && duration === 32
  const frontCameraNaturalActionFallback = isNightCityTemplateScenario
    ? 'Natural front-camera glam fit-check flow with smooth step-in, gentle turn-return, and clear outfit readability.'
    : (isRelaxedBoutiqueTemplateScenario
      ? (shouldUseRelaxedBoutique32sBackDetailLean
        ? 'Relaxed non-mirror front-camera boutique fit-check flow with smooth walk-in, hair-flip energy, full-fit proof, worn-product detail motion, one soft over-shoulder back-detail lean with face toward camera, and calm front reset.'
        : 'Relaxed non-mirror front-camera boutique fit-check flow with smooth walk-in, hair-flip energy, full-fit proof, worn-product detail motion, soft side turn, and calm front reset.')
    : (isFreeStyleProductReviewTemplateScenario
      ? 'Freestyle front-camera fashion product review with creative actions, clear product proof, and a different body direction on every adjacent keyframe.'
    : (isCozyTemplateScenario
      ? 'Natural front-camera fit-check flow with subtle weight shifts, gentle turn-return, and clear full-body outfit readability.'
      : 'Natural front-camera fit-check movement with relaxed micro-poses and clear outfit readability.')))
  const frontCameraAnchoredActionSentence = isNightCityTemplateScenario
    ? 'Model performs a natural front-camera glam fit-check flow in the provided background scene with smooth step-in, shoulder-line turns, and confident close posture.'
    : (isRelaxedBoutiqueTemplateScenario
      ? (shouldUseRelaxedBoutique32sBackDetailLean
        ? 'Model performs a relaxed non-mirror front-camera boutique fit-check in the provided background scene with smooth hair movement, full-fit proof, category-appropriate detail motion on the worn product, one short over-shoulder back-detail lean while face stays turned toward the front camera, and calm front reset.'
        : 'Model performs a relaxed non-mirror front-camera boutique fit-check in the provided background scene with smooth hair movement, full-fit proof, category-appropriate detail motion on the worn product, soft side/three-quarter turn, and calm front reset.')
    : (isFreeStyleProductReviewTemplateScenario
      ? 'Model performs a freestyle fashion product review in the provided background scene; actions may vary creatively, but product proof stays clear and every adjacent keyframe changes body direction with a visible pivot.'
    : (isCozyTemplateScenario
      ? 'Model performs a natural front-camera fit-check flow in the provided background scene with subtle weight shifts, gentle turn-return, and relaxed hand-to-hip pose changes.'
      : 'Model performs a natural front-camera fit-check flow in the provided background scene with relaxed micro-poses and smooth turn-return continuity.')))

  const scriptBeatReferences = buildTikTokScriptBeatReferences(analysis.generatedScript, sceneCount)
  const contextBeatReferences = buildTikTokContextBeatReferences(analysis.sceneBeats, sceneCount)
  const sceneBeatSummary = analysis.sceneBeats
    .slice(0, 8)
    .map((beat) => [
      `${beat.timestamp} ${beat.beatName}`.trim(),
      beat.description.trim(),
      beat.contextHint.trim().length > 0 ? `Context: ${beat.contextHint.trim()}` : '',
      beat.cameraHint.trim().length > 0 ? `Camera: ${beat.cameraHint.trim()}` : '',
      beat.narrationHint.trim().length > 0 ? `Narration: ${beat.narrationHint.trim()}` : '',
    ].filter((part) => part.length > 0).join(' | '))
    .join('\n')

  const contextReferenceSummary = contextBeatReferences
    .map((reference, index) => `Scene ${index + 1}: ${reference}`)
    .join('\n')

  const backgroundLocationLockPrompt = hasBackgroundLocationReference
    ? (isFrontCameraTemplate
      ? (shouldEnforceRearMirrorReflection
        ? 'BACKGROUND LOCATION LOCK: current BACKGROUND input image is the anchor set. Keep model standing in front of filming camera in this same background across all keyframes/scenes, avoid venue switching, keep full-body head-to-toe readability, preserve key background anchors (wall/floor/decor placement + rear mirror anchor), and treat this image as environment anchor only (not identity/product source).'
        : (isNightCityTemplateScenario
          ? 'BACKGROUND LOCATION LOCK: current BACKGROUND input image is the anchor set. Keep model standing in front of filming camera in this same background across all keyframes/scenes, avoid venue switching, keep strong outfit readability, preserve key background anchors (window frame/citylight/floor/decor placement), and treat this image as environment anchor only (not identity/product source).'
          : (isRelaxedBoutiqueTemplateScenario
            ? 'BACKGROUND LOCATION LOCK: current BACKGROUND input image is the anchor set. Keep model standing in front of filming camera in this same bright boutique-style scene across all keyframes/scenes, avoid venue switching, keep full-body outfit and product-detail readability, preserve grey wall, arched display niches, shelf line, LED strips, ceiling curve, and wood floor anchors, maintain clear face/product exposure, and treat this image as environment only.'
          : 'BACKGROUND LOCATION LOCK: current BACKGROUND input image is the anchor set. Keep model standing in front of filming camera in this same background across all keyframes/scenes, avoid venue switching, keep full-body head-to-toe readability, preserve key background anchors (wall/floor/decor placement), and treat this image as environment anchor only (not identity/product source).')))
      : 'BACKGROUND LOCATION LOCK: current BACKGROUND input image is the anchor set. Keep model standing for mirror phone fit-check in this same background across all keyframes/scenes, avoid venue switching, enforce closer mirror framing so outfit appears larger (target subject occupancy ~70-85% frame), keep full-body head-to-toe readability, preserve key background anchors (mirror edges, floor line, major decor placement), and treat this image as environment anchor only (not identity/product source).')
    : 'BACKGROUND LOCATION LOCK: no background input image provided.'

  const rearMirrorReflectionLockPrompt = shouldEnforceRearMirrorReflection
    ? 'REAR MIRROR REFLECTION LOCK: keep a rear mirror behind model visible in the frame and preserve reflection continuity across all keyframes/scenes. Do not place camera in mirror; camera/tripod/operator must not appear in reflection.'
    : 'REAR MIRROR REFLECTION LOCK: inactive.'

  const noVoiceTrackPrompt = isFrontCameraTemplate
    ? 'NO VOICE TRACK: do not script voiceover, dialogue, lip-sync cues, or spoken CTA. The video must communicate through visual front-camera outfit presentation actions and optional on-screen text only. Keep the mouth relaxed/closed at rest and block talking-to-camera behavior.'
    : 'NO VOICE TRACK: do not script voiceover, dialogue, lip-sync cues, or spoken CTA. The video must communicate through visual mirror phone fit-check actions and optional on-screen text only. Keep the mouth relaxed/closed at rest and block talking-to-camera behavior.'

  const cameraMotionLockPrompt = shouldEnforceConciseVisualOnlyAction
    ? (isFrontCameraTemplate
      ? 'CAMERA MOTION LOCK: keep observer-camera framing stable; avoid handheld shake, aggressive orbit, and excessive zoom.'
      : 'CAMERA MOTION LOCK: allow controlled phone-held mirror framing; avoid aggressive orbit and excessive shake.')
    : 'CAMERA MOTION LOCK: keep motion physically plausible and continuity-safe.'

  const parts: GeminiContentPart[] = []
  if (faceImage) {
    const faceBase64 = faceImage.split(',')[1] || faceImage
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: faceBase64,
      },
    })
    parts.push({ text: 'FACE INPUT LOCK: preserve face identity from this input image only.' })
  }

  if (productImage) {
    const productBase64 = productImage.split(',')[1] || productImage
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: productBase64,
      },
    })
    parts.push({ text: 'PRODUCT INPUT LOCK: this input image is the product to review and is the only source of product details.' })
  }

  if (backgroundImage) {
    const backgroundBase64 = backgroundImage.split(',')[1] || backgroundImage
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: backgroundBase64,
      },
    })
    parts.push({ text: 'BACKGROUND LOCATION INPUT LOCK: use this image for context/location cues only; do not copy people/garments/logos from it as product identity.' })
  }
  const detachedRemixAgentSkillBlock = buildGeminiAgentSkillBlock({
    stage: 'detached_tiktok_remix',
    skillIds: [
      'reference-lock',
      ...(templateScenarioId ? ['ootd-fit-check-template' as const] : []),
      'tiktok-analysis-transfer',
      'user-intent-priority',
      'realtime-web-visualization',
      'nano-banana-image-framework',
      'creative-director-controls',
      'veo-prompting-guide',
      'image-to-video-handoff',
      'veo-fast-iteration',
      'veo-native-audio-localization',
      'veo-continuity',
      'safety-policy',
      'schema-qa',
    ],
    outputContract: `${keyframeCount} detached remix keyframes + ${sceneCount} scenes JSON`,
    runtimeNotes: [
      `Detected content type ${analysis.detectedContentType}; target duration ${duration}s; aspect ratio ${aspectRatio}.`,
      templateScenarioId ? `OOTD template scenario is active: ${templateScenarioId}.` : '',
      `Template camera format: ${templateCameraFormat}.`,
      shouldEnforceRearMirrorReflection ? 'Rear mirror/reflection lock is active.' : '',
      `Background reference ${hasBackgroundLocationReference ? 'provided' : 'not provided'}.`,
      shouldEnforceConciseVisualOnlyAction ? 'Concise visual-only action mode is active.' : 'Standard visual action mode is active.',
      templateScenarioId ? 'OOTD scene mode: each scene is a standalone START KF -> END KF review clip; scene-to-scene continuity is not required.' : '',
    ],
  })
  const ootdTemplateSceneModePrompt = templateScenarioId
    ? `OOTD TEMPLATE SCENE MODE:
- Treat each scene as a standalone review clip using KF[i] as START FRAME and KF[i+1] as END FRAME.
- Do not write scenes as one continuous action chain across the whole video. Scene-to-scene cuts are allowed.
- Preserve the same face identity, exact product, and location/background anchors across scenes.
- Inside each scene, the START FRAME and END FRAME should form a clear 8s product-review movement.
- Each scene must use a different review angle; do not repeat the same scene review style.

SCENE REVIEW STYLE PLAN:
${buildOotdTemplateSceneReviewStylePlan(sceneCount)}`
    : ''

  const prompt = `You are a TikTok prompt-packaging specialist in DETACHED ANALYSIS MODE.

GOAL:
- Build a complete prompt package from TikTok analysis result while staying detached from the default core rule stack.
- Keep only video configuration logic (duration, aspect ratio, scene/keyframe counts).
- Remix scene context/background similar to analyzed video while adapting to the new input product.

VIDEO CONFIG:
- Duration: ${duration}s
- Aspect ratio: ${aspectRatio}
- Required scenes: ${sceneCount}
- Required keyframes: ${keyframeCount}
- Background location reference: ${hasBackgroundLocationReference ? 'provided (environment/location guidance only)' : 'not provided'}

${detachedRemixAgentSkillBlock}

${ootdTemplateSceneModePrompt}

REVIEW PRODUCT SOURCE (MANDATORY):
- Review product context must come from REVIEW NOTES below.
- Product visual details must come only from current PRODUCT input image (if provided).

REVIEW NOTES (PRIMARY PRODUCT CONTEXT):
${reviewProductBrief}

TIKTOK ANALYSIS (STRUCTURE-ONLY REFERENCE):
- detectedContentType: ${analysis.detectedContentType}
- detectedDurationSec: ${analysis.detectedDurationSec}
- hookStyle: ${analysis.hookStyle}
- narrativeStructure: ${analysis.narrativeStructure}
- ctaStyle: ${analysis.ctaStyle}
- colorGrade: ${analysis.colorGrade}
- pacing: ${analysis.pacing}

SCENE BEATS:
${sceneBeatSummary || 'No explicit scene beats provided'}

CONTEXT REMIX REFERENCES:
${contextReferenceSummary || 'No explicit context references provided'}

VISUAL BEAT FLOW TEMPLATE TO FOLLOW:
${analysis.generatedScript || 'No visual beat flow template provided'}

HARD CONSTRAINTS:
- Do not apply any external/core template enforcement.
- Use analyzed TikTok video only as structure and rhythm reference.
- Never copy product identity/outfit details from analyzed TikTok video.
- Keep product review focus anchored to REVIEW NOTES and current PRODUCT input image.
- ${backgroundLocationLockPrompt}
- ${rearMirrorReflectionLockPrompt}
- ${shouldApplyFrontFaceQuarterBodyLock
  ? (shouldUseRelaxedBoutique32sBackDetailLean
    ? 'FRONT-FACE / QUARTER-BODY LOCK: keep face front-oriented toward camera on every keyframe. Body direction is front or gentle three-quarter-left/right, except exactly one 32s relaxed boutique keyframe may use a soft over-shoulder back-detail lean: torso angles slightly to reveal the garment back/backline while face remains visible toward the front camera. Never use a full back-facing hold.'
    : 'FRONT-FACE / QUARTER-BODY LOCK: keep face front-oriented toward camera/mirror on every keyframe; body direction is only front or gentle three-quarter-left or three-quarter-right; never use back-facing body orientation.')
  : 'FRONT-FACE / QUARTER-BODY LOCK: inactive.'}
- ${isFreeStyleProductReviewTemplateScenario
  ? 'FREESTYLE KF DIRECTION LOCK: core content must remain fashion product review. Every adjacent keyframe pair KF[i] -> KF[i+1] must use different facingDirection values and describe a visible turn/pivot between them. Never output two adjacent KFs with the same body direction.'
  : 'FREESTYLE KF DIRECTION LOCK: inactive.'}
- ${noVoiceTrackPrompt}
- TERMINOLOGY LOCK: avoid script-oriented wording and express pacing cues as visual beat flow only.
- ${shouldEnforceConciseVisualOnlyAction
  ? 'ACTION WRITING LOCK: keep ACTION concise and physical, do not mention beat labels/references, and block speaking/voiceover/lip-sync wording.'
  : 'ACTION WRITING LOCK: keep ACTION clear, product-first, and visual.'}
- PERFORMANCE LOCK: block talking-to-camera behavior, lip articulation, jaw-speaking motion, speech-like head nodding, and presenter-style acting.
- ${cameraMotionLockPrompt}
- ${templateScenarioId
  ? 'SCENE INDEPENDENCE LOCK: maintain stable movement inside each scene only; do not require continuous action or body motion from one scene into the next.'
  : 'Maintain stable, non-performative movement and camera continuity.'}
- CONTEXT REMIX LOCK: Keep background/setting logic similar to analyzed video (venue type, indoor/outdoor feel, prop density, movement space, transition rhythm).
- Do not copy exact identifiable text/signage/persons from source video context.

SCENE CAMERA MOVEMENT TAXONOMY (MANDATORY):
${SCENE_CAMERA_MOVEMENT_PROMPT_RULES}

Return STRICT JSON only in this schema:
{
  "masterDNA": "...",
  "keyframes": [
    {
      "index": 0,
      "action": "...",
      "facingDirection": "front|back|left|right|three-quarter-left|three-quarter-right",
      "location": "...",
      "camera": "...",
      "lighting": "...",
      "style": "..."
    }
  ],
  "scenes": [
    {
      "index": 0,
      "narrative": "...",
      "cameraMovement": "Position: ${DEFAULT_SCENE_CAMERA_POSITION} | Motion: ${DEFAULT_SCENE_CAMERA_MOTION}"
    }
  ]
}

Counts must match exactly: keyframes=${keyframeCount}, scenes=${sceneCount}.`

  try {
    const parsed = await requestGeminiJsonWithParts(
      apiKey,
      model,
      [...parts, { text: prompt }],
      0.66,
      6144,
    )

    const asRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
    const toSafeString = (value: unknown, fallback: string) => {
      if (typeof value !== 'string') return fallback
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : fallback
    }

    const resolveFacing = (value: unknown, fallback: ConcreteFacingDirection): ConcreteFacingDirection => {
      const parsedFacing = normalizeFacingDirectionToken(value)
      return parsedFacing === 'unknown' ? fallback : parsedFacing
    }

    const parsedRecord: Record<string, unknown> = asRecord(parsed) ? parsed : {}
    const rawKeyframes: unknown[] = Array.isArray(parsedRecord.keyframes)
      ? parsedRecord.keyframes
      : []
    const rawScenes: unknown[] = Array.isArray(parsedRecord.scenes)
      ? parsedRecord.scenes
      : []

    const keyframesDraft: KeyframePrompt[] = Array.from({ length: keyframeCount }, (_, index) => {
      const raw = asRecord(rawKeyframes[index]) ? rawKeyframes[index] as Record<string, unknown> : {}
      const scriptBeatIndex = Math.min(
        sceneCount - 1,
        Math.floor((index * sceneCount) / Math.max(1, keyframeCount - 1)),
      )
      const fallbackScriptBeat = scriptBeatReferences[scriptBeatIndex]
      const fallbackContextBeat = contextBeatReferences[scriptBeatIndex]
      const fallbackAction = shouldEnforceConciseVisualOnlyAction
        ? (isFrontCameraTemplate
          ? frontCameraNaturalActionFallback
          : 'Natural mirror phone fit-check movement with clear outfit visibility.')
        : fallbackScriptBeat
          ? `Product review movement follows visual beat flow: ${fallbackScriptBeat}`
          : (analysis.sceneBeats[scriptBeatIndex]?.description || 'Natural product review motion with clear detail demonstration.')

      const rawAction = toSafeString(raw.action, fallbackAction)
      const normalizedAction = shouldEnforceConciseVisualOnlyAction
        ? sanitizeVisualOnlyConciseAction(rawAction)
        : rawAction

      const action = appendSentenceIfMissing(
        normalizedAction,
        shouldEnforceConciseVisualOnlyAction
          ? ''
          : fallbackContextBeat ? `Context remix cue: ${fallbackContextBeat}` : '',
      )
      const fallbackFacing = RULE32_FACING_SEQUENCE[index % RULE32_FACING_SEQUENCE.length]
      const facingDirection = resolveFacing(raw.facingDirection ?? raw.action, fallbackFacing)
      const fallbackLocation = buildTikTokContextRemixLocationFallback(fallbackContextBeat)
      const location = toSafeString(raw.location, fallbackLocation)
      const camera = toSafeString(
        raw.camera,
        analysis.sceneBeats[scriptBeatIndex]?.cameraHint
          || (isFrontCameraTemplate
            ? 'Observer-camera framing with controlled movement and stable axis continuity.'
            : 'Phone-held mirror framing with controlled movement and stable axis continuity.'),
      )
      const lighting = toSafeString(
        raw.lighting,
        isRelaxedBoutiqueTemplateScenario
          ? 'Bright clear boutique lighting with soft frontal fill, natural skin tone, readable fabric texture, accurate product color, and no dim or low-key shadows.'
          : `Natural soft lighting with ${analysis.colorGrade || 'balanced'} color mood and clear product details.`,
      )
      const style = toSafeString(
        raw.style,
        isFrontCameraTemplate
          ? `Front-camera outfit presentation style; pacing ${analysis.pacing || 'mid-pace'}. Context remix from analyzed video environment.`
          : `Mirror phone fit-check style; pacing ${analysis.pacing || 'mid-pace'}. Context remix from analyzed video environment.`,
      )
      const timestamp = `${Math.round((index * duration) / Math.max(1, keyframeCount - 1))}s`
      const subject = buildDefaultFrameSubject(aspectRatio)

      return {
        index,
        timestamp,
        subject,
        action,
        facingDirection,
        location,
        camera,
        lighting,
        style,
        fullPrompt: buildNanoBananaProFramePrompt({
          subject,
          action,
          facingDirection,
          location,
          camera,
          lighting,
          style,
          aspectRatio,
        }),
      }
    })

    const anchoredTemplateLocation = hasBackgroundLocationReference
      ? (isFrontCameraTemplate
        ? (isCozyTemplateScenario
          ? (shouldEnforceRearMirrorReflection
            ? 'provided cozy home front-camera zone with rear mirror reflection (exact uploaded background scene)'
            : 'provided cozy home front-camera zone (exact uploaded background scene)')
          : (isNightCityTemplateScenario
            ? 'provided night city glam front-camera zone (exact uploaded background scene)'
            : (isRelaxedBoutiqueTemplateScenario
              ? 'provided relaxed boutique front-camera zone (exact uploaded background scene)'
            : 'provided selected front-camera scenario zone (exact uploaded background scene)')))
        : 'provided background mirror phone fit-check zone (exact uploaded background scene)')
      : ''

    const keyframes: KeyframePrompt[] = keyframesDraft.map((keyframe, index) => {
      const isRelaxedBoutique32sBackDetailLeanFrame = shouldUseRelaxedBoutique32sBackDetailLean
        && index === Math.min(3, keyframesDraft.length - 2)
      const freestyleReviewFacing = isFreeStyleProductReviewTemplateScenario
        ? OOTD_FREESTYLE_REVIEW_FACING_SEQUENCE[index % OOTD_FREESTYLE_REVIEW_FACING_SEQUENCE.length]
        : null
      const lockedFrontQuarterFacing: ConcreteFacingDirection | null = shouldApplyFrontFaceQuarterBodyLock
        ? (
          index % 4 === 0
            ? 'front'
            : index % 4 === 1
              ? 'three-quarter-left'
              : index % 4 === 2
                ? 'front'
                : 'three-quarter-right'
        )
        : null
      const finalFacingDirection: ConcreteFacingDirection = freestyleReviewFacing
        || lockedFrontQuarterFacing
        || (isConcreteFacingDirection(keyframe.facingDirection) ? keyframe.facingDirection : 'front')

      let finalAction = keyframe.action
      let finalLocation = keyframe.location
      let finalCamera = keyframe.camera
      let finalStyle = keyframe.style

      if (anchoredTemplateLocation) {
        finalAction = appendSentenceIfMissing(
          finalAction,
          isFrontCameraTemplate
            ? frontCameraAnchoredActionSentence
            : 'Model stands closer to mirror and performs mirror phone fit-check in the provided background scene with stable stance.',
        )
        finalLocation = anchoredTemplateLocation
        finalCamera = appendSentenceIfMissing(
          finalCamera,
          isFrontCameraTemplate
            ? 'Stable front-camera framing: keep full-body head-to-toe visibility with key background anchors readable and no aggressive zoom.'
            : 'Closer mirror framing: model occupies around 70-85% frame while still keeping full-body head-to-toe visibility and key background anchors readable.',
        )
        finalStyle = appendSentenceIfMissing(
          finalStyle,
          isFrontCameraTemplate
            ? (isNightCityTemplateScenario
              ? 'Maintain background continuity via key anchors (window frame/citylight/floor/decor placement) with no venue drift.'
              : (isRelaxedBoutiqueTemplateScenario
                ? 'Maintain relaxed boutique background continuity via grey wall, arched display niches, shelf line, LED strips, ceiling curve, and wood floor anchors with no venue drift.'
              : 'Maintain background continuity via key anchors (wall/floor/decor placement) with no venue drift.'))
            : 'Maintain background continuity via key anchors (mirror edges, floor line, decor placement) with no venue drift.',
        )

        if (isFrontCameraTemplate && shouldEnforceRearMirrorReflection) {
          finalCamera = appendSentenceIfMissing(
            finalCamera,
            'Keep rear mirror behind model visible in frame for reflection proof and continuity.',
          )
          finalStyle = appendSentenceIfMissing(
            finalStyle,
            'Rear-mirror reflection continuity lock: mirror stays visible behind model and no camera/tripod/operator appears in reflection.',
          )
        }
      }

      if (shouldEnforceConciseVisualOnlyAction) {
        finalAction = sanitizeVisualOnlyConciseAction(finalAction)
        if (templateScenarioId) {
          finalAction = appendOotdTemplateSilentFitCheckPerformance(finalAction)
        }
        finalCamera = sanitizeVisualOnlyConciseCamera(finalCamera)
        finalStyle = sanitizeVisualOnlyConciseSceneNarrative(finalStyle)
      }

      if (lockedFrontQuarterFacing) {
        if (!shouldEnforceConciseVisualOnlyAction) {
          finalAction = enforceActionFacingDirection(finalAction, lockedFrontQuarterFacing)
        }
      }

      if (freestyleReviewFacing) {
        finalAction = enforceActionFacingDirection(finalAction, freestyleReviewFacing)
        if (index > 0) {
          const previousFacing = OOTD_FREESTYLE_REVIEW_FACING_SEQUENCE[(index - 1) % OOTD_FREESTYLE_REVIEW_FACING_SEQUENCE.length]
          finalAction = appendSentenceIfMissing(
            finalAction,
            `Freestyle review turn: pivot visibly from ${toFacingDirectionLabel(previousFacing)} to ${toFacingDirectionLabel(freestyleReviewFacing)} so this KF direction differs from the previous KF.`,
          )
          finalCamera = appendSentenceIfMissing(
            finalCamera,
            'Capture the turn/pivot clearly; adjacent keyframes must not share the same body direction.',
          )
        } else {
          finalAction = appendSentenceIfMissing(
            finalAction,
            'Freestyle product review start: keep product readable and prepare a visible turn into the next KF.',
          )
        }
      }

      if (isRelaxedBoutique32sBackDetailLeanFrame) {
        finalAction = appendSentenceIfMissing(
          finalAction,
          '32s relaxed boutique pose: use one soft over-shoulder back-detail lean, torso angled slightly to reveal the garment back/backline while face stays turned toward the front camera, then return to front/three-quarter.',
        )
        finalCamera = appendSentenceIfMissing(
          finalCamera,
          'Keep the face visible and the backline readable in bright front-camera boutique lighting; no full back-facing hold.',
        )
      }

      if (isFrontCameraTemplate) {
        finalAction = removeOotdMirrorHandheldDevicePhrases(finalAction)
        finalCamera = appendSentenceIfMissing(
          removeOotdMirrorHandheldDevicePhrases(finalCamera),
          'Use stable observer-camera framing in front of model with full-body visibility.',
        )
        finalStyle = appendSentenceIfMissing(
          removeOotdMirrorHandheldDevicePhrases(finalStyle),
          isCozyTemplateScenario
            ? 'Hands-free front-camera outfit presentation with stable cozy-room continuity.'
            : (isNightCityTemplateScenario
              ? 'Hands-free front-camera outfit presentation with stable night-city continuity.'
              : (isRelaxedBoutiqueTemplateScenario
                ? 'Hands-free non-mirror front-camera boutique fit-check with relaxed smooth movement and stable grey boutique set continuity.'
              : 'Hands-free front-camera outfit presentation with stable scenario continuity.')),
        )
      }

      return {
        ...keyframe,
        action: finalAction,
        facingDirection: finalFacingDirection,
        location: finalLocation,
        camera: finalCamera,
        style: finalStyle,
        fullPrompt: buildNanoBananaProFramePrompt({
          subject: keyframe.subject,
          action: finalAction,
          facingDirection: finalFacingDirection,
          location: finalLocation,
          camera: finalCamera,
          lighting: keyframe.lighting,
          style: finalStyle,
          aspectRatio,
        }),
      }
    })

    const rawMasterDNA = toSafeString(parsedRecord.masterDNA, '')
    const masterDNA = rawMasterDNA.length > 0
      ? rawMasterDNA
      : [
        '[FACE LOCK]: Keep face identity from current input image only (if provided).',
        '[PRODUCT LOCK]: Keep product details from current input image only (if provided).',
        `[REVIEW PRODUCT NOTES]: ${reviewProductBrief}`,
        '[ANALYSIS TRANSFER]: Use TikTok analysis as structure-only reference (hook/value/proof/close).',
        '[CONTEXT REMIX LOCK]: Recreate similar background setting logic from analyzed video without copying identity/product specifics.',
      ].join('\n')

    const scenes: ScenePrompt[] = Array.from({ length: sceneCount }, (_, index) => {
      const raw = asRecord(rawScenes[index]) ? rawScenes[index] as Record<string, unknown> : {}
      const ootdSceneReviewStyle = templateScenarioId ? getOotdTemplateSceneReviewStyle(index) : null
      const startSec = Math.round((index * duration) / sceneCount)
      const endSec = Math.round(((index + 1) * duration) / sceneCount)
      const scriptBeat = scriptBeatReferences[index] || analysis.sceneBeats[index]?.narrationHint || analysis.sceneBeats[index]?.description || ''
      const contextBeat = contextBeatReferences[index] || analysis.sceneBeats[index]?.contextHint || analysis.sceneBeats[index]?.description || ''
      const conciseNarrativeSeed = sanitizeVisualOnlyConciseAction(keyframes[index]?.action || '')
      const fallbackNarrative = shouldEnforceConciseVisualOnlyAction
        ? (conciseNarrativeSeed || (isFrontCameraTemplate
          ? (isNightCityTemplateScenario
            ? 'Natural glam fit-check flow: full-look hero, smooth turn-return, upper-body detail pass, and confident close.'
            : (isRelaxedBoutiqueTemplateScenario
              ? (shouldUseRelaxedBoutique32sBackDetailLean
                ? 'Relaxed boutique fit-check flow: smooth walk-in or hair-flip hook, full-fit proof, worn-product detail motion, one soft over-shoulder back-detail lean with face toward camera, and calm front reset.'
                : 'Relaxed boutique fit-check flow: smooth walk-in or hair-flip hook, full-fit proof, worn-product detail motion, soft side/three-quarter turn, and calm front reset.')
            : 'Natural fit-check flow: full-look pose, gentle turn-return, detail-check, and relaxed close with clear outfit visibility.'))
          : 'Hold full-fit front pose, then detail-check and gentle side-angle confirmation with clear outfit visibility.'))
        : scriptBeat.length > 0
          ? `Follow visual beat flow: ${scriptBeat}`
          : 'Follow hook -> value -> proof -> close progression with product-first review clarity.'

      const baseNarrative = shouldEnforceConciseVisualOnlyAction
        ? fallbackNarrative
        : toSafeString(raw.narrative, fallbackNarrative)
      let narrative = shouldEnforceConciseVisualOnlyAction
        ? sanitizeVisualOnlyConciseSceneNarrative(baseNarrative)
        : appendSentenceIfMissing(
          appendSentenceIfMissing(
            baseNarrative,
            scriptBeat.length > 0 ? `Visual beat flow reference: ${scriptBeat}` : '',
          ),
          contextBeat.length > 0 ? `Context remix reference: ${contextBeat}` : '',
        )

      if (!shouldEnforceConciseVisualOnlyAction) {
        if (anchoredTemplateLocation) {
          narrative = appendSentenceIfMissing(
            narrative,
            isFrontCameraTemplate
              ? 'Keep model standing in front of camera for clearer full-body outfit visibility, preserve key background composition anchors, and avoid venue changes.'
              : 'Keep model standing closer to mirror for clearer outfit visibility, preserve key background composition anchors, and avoid venue changes.',
          )
        }
        if (shouldApplyFrontFaceQuarterBodyLock) {
          narrative = appendSentenceIfMissing(
            narrative,
            'Direction lock: face remains front-oriented; body uses only front or gentle three-quarter-left/right angles; no back-facing body poses.',
          )
        }
        narrative = appendSentenceIfMissing(
          narrative,
          'Visual-only scene: no voiceover, spoken dialogue, or lip-sync actions.',
        )
      }

      if (shouldEnforceConciseVisualOnlyAction && templateScenarioId) {
        narrative = appendOotdTemplateSilentFitCheckPerformance(narrative)
      }

      if (ootdSceneReviewStyle) {
        narrative = appendSentenceIfMissing(
          narrative,
          `Standalone scene review angle: ${ootdSceneReviewStyle.label}; ${ootdSceneReviewStyle.directive}`,
        )
        narrative = appendSentenceIfMissing(
          narrative,
          'Scene does not need to continue action from the previous scene or set up continuous action for the next scene.',
        )
      }

      if (isFrontCameraTemplate) {
        narrative = removeOotdMirrorHandheldDevicePhrases(narrative)
      }

      const rawCameraMovement = toSafeString(raw.cameraMovement, '')
      const cameraMovement = normalizeSceneCameraMovementSpec(
        shouldEnforceConciseVisualOnlyAction
          ? sanitizeVisualOnlyConciseCamera(rawCameraMovement)
          : rawCameraMovement,
        analysis.sceneBeats[index]?.cameraHint || 'Controlled camera movement with stable direction and fixed-axis pacing.',
      )

      const startPose = keyframes[index]?.action || ''
      const endPose = keyframes[index + 1]?.action || keyframes[index]?.action || ''
      const startFacing = keyframes[index]?.facingDirection || ''
      const endFacing = keyframes[index + 1]?.facingDirection || keyframes[index]?.facingDirection || ''
      const startLocation = keyframes[index]?.location || ''
      const endLocation = keyframes[index + 1]?.location || startLocation
      const locationFlow = anchoredTemplateLocation
        ? (templateScenarioId
          ? `Standalone scene location: ${anchoredTemplateLocation}; preserve anchors but no scene-to-scene action continuity required.`
          : `Hold location: ${anchoredTemplateLocation}`)
        : normalizeLocationKey(startLocation) === normalizeLocationKey(endLocation)
          ? (templateScenarioId
            ? `Standalone scene location: ${startLocation}; preserve anchors but no scene-to-scene action continuity required.`
            : `Hold location: ${startLocation}`)
          : `${startLocation} -> ${endLocation}`
      const composition = anchoredTemplateLocation
        ? appendSentenceIfMissing(
          keyframes[index]?.camera || '',
          isFrontCameraTemplate
            ? (shouldEnforceRearMirrorReflection
              ? 'Composition lock: stable front-camera full-body framing with rear mirror visible behind model for reflection proof and stable background anchors.'
              : 'Composition lock: stable front-camera full-body framing with subject-dominant readability and stable background anchors.')
            : 'Composition lock: closer mirror phone fit-check with subject-dominant framing and stable background anchors.',
        )
        : keyframes[index]?.camera || ''
      const finalComposition = shouldEnforceConciseVisualOnlyAction
        ? sanitizeVisualOnlyConciseCamera(composition)
        : composition
      const sceneSubject = shouldEnforceConciseVisualOnlyAction
        ? sanitizeVisualOnlyConciseSubject(masterDNA)
        : masterDNA
      const lighting = keyframes[index]?.lighting || ''
      const timeRange = `${startSec}s-${endSec}s`

      return {
        index,
        timeRange,
        subject: sceneSubject,
        narrative,
        startPose,
        endPose,
        composition: finalComposition,
        cameraMovement,
        lighting,
        locationFlow,
        fullPrompt: [
          `SUBJECT: ${sceneSubject}`,
          ...(ootdSceneReviewStyle
            ? [
              'SCENE MODE: standalone OOTD review clip from START FRAME to END FRAME; no need to connect action continuously with previous or next scene.',
              `REVIEW ANGLE: ${ootdSceneReviewStyle.label} - ${ootdSceneReviewStyle.directive}`,
              `START FRAME: ${startPose}`,
              `END FRAME: ${endPose}`,
              ...(isFreeStyleProductReviewTemplateScenario
                ? [
                  `START FACING: ${startFacing}`,
                  `END FACING: ${endFacing}`,
                  'FREESTYLE DIRECTION LOCK: START FACING and END FACING must be different, with a visible product-review turn/pivot between them.',
                ]
                : []),
            ]
            : []),
          `ACTION: ${narrative}`,
          finalComposition ? `COMPOSITION: ${finalComposition}` : '',
          `CAMERA: ${cameraMovement}`,
          lighting ? `LIGHTING: ${lighting}` : '',
          locationFlow ? `LOCATION FLOW: ${locationFlow}` : '',
          ...(shouldEnforceConciseVisualOnlyAction && templateScenarioId
            ? buildOotdTemplateSilentFitCheckVeoLocks(!isFrontCameraTemplate)
            : []),
        ].filter(Boolean).join('\n'),
      }
    })

    return {
      masterDNA,
      keyframes,
      scenes,
      createImagePrompt: buildCreateImagePrompt(resolvedContentType, reviewProductBrief),
      resolvedContentType,
      affiliateModeUsed: FIXED_AFFILIATE_MODE,
      salesTemplateUsed: FIXED_SALES_TEMPLATE,
    }
  } catch (error: any) {
    throw new Error(error?.message || 'Gemini detached TikTok prompt package generation failed')
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

type PromptLibraryItem = {
  id: string
  title: string
  stage: string
  platform: string
  output: string
  icon: React.ElementType
  accent: string
  prompt: string
}

type PromptShotCommand = {
  id: string
  title: string
  english: string
  purpose: string
}

type ProductImagePromptPreset = {
  id: string
  title: string
  bodyOption: string
  hairOption: string
  outfitReference: string
  useCase: string
  prompt: string
}

type OmniFlashGuideItem = {
  id: string
  title: string
  badge: string
  desc: string
  promptMove: string
}

type OmniFlashModelCardItem = {
  id: string
  title: string
  label: string
  desc: string
  checklist: string[]
}

const PROMPT_LIBRARY_FRAMEWORK_STEPS = [
  {
    title: '1. Art Direction',
    desc: 'Xac dinh mood & tone cho nghe si/du an: Modern, Cinematic, Y2K, Streetwear Outdoor, Luxury, Emotional.',
  },
  {
    title: '2. Short-video Strategy',
    desc: 'Dinh hinh video doc: Hook 3s dau, body cat theo nhip nhac, visual proof, CTA ro rang cho TikTok/Reels/Shorts.',
  },
  {
    title: '3. Developer Logic',
    desc: 'Dich y tuong thanh layer prompt co cau truc, kiem soat subject, outfit, background, camera, lighting va guardrail.',
  },
]

const PROMPT_LAYERING_FORMULA = '[Subject/Artist Style] + [Outfit & Textures] + [Environment/Background] + [Camera Movement & Angle] + [Lighting & Render Engine]'

const OMNI_FLASH_PROMPT_GUIDE_URL = 'https://deepmind.google/models/gemini-omni/prompt-guide/'
const OMNI_FLASH_MODEL_CARD_URL = 'https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-Omni-Flash-Model-Card.pdf'

const OMNI_FLASH_GUIDE_ITEMS: OmniFlashGuideItem[] = [
  {
    id: 'prompt-anatomy',
    title: 'Prompt anatomy cho Omni Flash',
    badge: 'Shot + Style + Light + Place + Action',
    desc: 'Dien du chi tiet de co control, nhung khong can viet qua co hoc nhu Veo. Omni hieu y dinh tong the va tu suy luan them logic the gioi.',
    promptMove: `Create a 9:16 fashion product video from the provided references.
Subject: real model wearing the exact product reference.
Action: slow confident walk, one clean turn, garment detail reveal.
Shot framing and motion: medium-wide to full-body, smooth push-in, no aggressive zoom.
Style: premium TikTok fashion editorial, realistic, clean product readability.
Lighting: soft studio key light with texture-enhancing rim light.
Location: minimal modern fitting room with consistent background anchors.`,
  },
  {
    id: 'iterative-edit',
    title: 'Sua bang hoi thoai tung buoc',
    badge: 'Natural conversation edit',
    desc: 'Dung Omni nhu editor: giu video goc, chi sua mot thu moi lan. Phu hop doi background, caption, camera angle, action, lighting hoac object.',
    promptMove: `Keep the current video structure, model, outfit, timing, and background continuity.
Only change this: make the camera angle a clean 3/4 front view, then gently push in toward the garment texture.
Do not change the outfit design, face, body proportions, or location.`,
  },
  {
    id: 'camera-action',
    title: 'Dieu khien camera va action ro rang',
    badge: 'Oner / push in / locked off',
    desc: 'Omni nhan ngon ngu quay phim truc tiep: one continuous shot, static, locked off, push in, punch in, dolly zoom, over-shoulder, close-up.',
    promptMove: `One continuous shot.
Start locked-off full-body, then slow push in to medium shot while the model turns slightly left.
End on a crisp close-up of seams, fabric texture, buttons, and neckline.
Keep motion smooth and realistic, no jump cuts.`,
  },
  {
    id: 'reference-anything',
    title: 'Ket hop nhieu input de giu consistency',
    badge: 'Image + Video + Text + Audio',
    desc: 'Co the gan nhieu reference: face, outfit, motion, style, storyboard, audio beat. Prompt can noi ro vai tro cua tung input.',
    promptMove: `Use IMAGE_0 only for facial likeness.
Use IMAGE_1 and IMAGE_2 only for outfit design, fabric, trims, and footwear.
Use VIDEO_0 only for walking rhythm and camera motion.
Use AUDIO_0 only for edit pacing and beat sync.
Create one cohesive 9:16 product video with stable identity, stable outfit, and beat-matched movement.`,
  },
  {
    id: 'text-world-knowledge',
    title: 'Text, world knowledge va logic that',
    badge: 'Readable text + real-world physics',
    desc: 'Omni tot cho caption/text dong bo voi hinh, explainer, physics/action logic, cultural style va cac yeu cau phuc tap khong can mo ta tung frame.',
    promptMove: `Add short on-screen text in sync with the outfit reveal:
"FIT CHECK" appears during the full-body shot.
"FABRIC DETAIL" appears during the close-up.
"READY TO STYLE" appears on the final pose.
Keep typography clean, readable, and aligned with the action. No random extra text.`,
  },
]

const OMNI_FLASH_MODEL_CARD_ITEMS: OmniFlashModelCardItem[] = [
  {
    id: 'model-io',
    title: 'Model I/O chinh thuc',
    label: 'Text + Image + Audio + Video -> Video with audio',
    desc: 'Model card xac nhan Gemini Omni Flash nhan text prompt, image, audio va video file; output la high-quality, high-resolution video co audio.',
    checklist: [
      'Dat ten ro tung reference: IMAGE_0, IMAGE_1, VIDEO_0, AUDIO_0.',
      'Noi vai tro cua tung input: face, outfit, motion, style, beat, voice or background.',
      'Khi can audio, prompt them mood/pace/SFX thay vi chi mo ta hinh anh.',
    ],
  },
  {
    id: 'channel-rollout',
    title: 'Kenh su dung hien tai',
    label: 'Gemini App / YouTube / Google Flow / Flow Music',
    desc: 'Model card liet ke cac kenh phan phoi hien tai; phan evaluation/API cho developer va enterprise se duoc chia se khi rollout qua API.',
    checklist: [
      'Dung section nay nhu prompt playbook cho Gemini/Flow truoc.',
      'Chua gan thanh model id API trong app khi chua co API contract ro rang.',
      'Neu dua vao workflow team, ghi ro kenh test: Gemini, Flow, YouTube hay Flow Music.',
    ],
  },
  {
    id: 'production-limits',
    title: 'Limitations can QA',
    label: 'Consistency / complex motion / exact text',
    desc: 'Google ghi ro van con thach thuc ve consistency qua nhieu lan edit, motion phuc tap va text hoan toan chinh xac.',
    checklist: [
      'Moi lan edit chi sua mot bien: camera, action, text, background hoac style.',
      'Voi motion phuc tap, chia thanh beat ngan va gan input motion reference neu co.',
      'Kiem tra text onscreen o output cuoi; khong giao final neu caption/logo bi sai chu.',
    ],
  },
  {
    id: 'safety-integrity',
    title: 'Safety va content integrity',
    label: 'Policy filters + SynthID + restricted speech editing',
    desc: 'Model card nhan manh safety/red teaming, production filters, SynthID watermark va viec tam han che kha nang thay doi loi noi cua con nguoi.',
    checklist: [
      'Khong dung cho noi dung nguy hiem, bat hop phap, bao luc, hateful, sexual explicit, harmful hoac misleading.',
      'Tranh impersonation, misrepresentation, deepfake speech hoac thay doi loi noi cua nguoi that.',
      'Ghi chu output AI-generated trong handoff khi dung cho campaign/public posting.',
    ],
  },
]

const PROMPT_LIBRARY_SHOT_COMMANDS: PromptShotCommand[] = [
  {
    id: 'front-bodice',
    title: 'Lenh 1: Goc truoc - Kieu dang co ao va chi tiet mat truoc',
    english: 'Front View - Bodice Fit, Neckline, and Front Outfit Detail Focus',
    purpose: 'Dung cho anh/video mo dau de thay ro phom than tren, cau truc co ao, hoa tiet, nut, khoa, thiet ke mat truoc va do om cua trang phuc.',
  },
  {
    id: 'back-silhouette',
    title: 'Lenh 2: Goc sau - Diem nhan phom dang va thiet ke phia sau',
    english: 'Back View - Back Silhouette, Hips/Waistline Contour, and Rear Outfit Construction Focus',
    purpose: 'Dung de kiem tra phom dang phia sau, duong may, do om, day dan corset, khoa keo, tui sau va ty le eo-hong mot cach thoi trang, lich su.',
  },
  {
    id: 'side-profile',
    title: 'Lenh 3: Goc nghieng 90 do - Ton vinh dang dung va kieu dang',
    english: 'Full Side Profile - Sleek Silhouette, Posture, and Garment Fit',
    purpose: 'Dung cho lookbook hoac video fashion profile, the hien tu the, do dung phom, kieu dang eo-hong va cach chat lieu nam tren co the.',
  },
  {
    id: 'front-three-quarter',
    title: 'Lenh 4: Goc cheo truoc 3/4 - Can bang than tren va hong',
    english: 'Dynamic 3/4 Front View - Balanced Bodice, Waist, and Hip Proportion Showcase',
    purpose: 'Goc chuyen nghiep cho nghe si/model, giup thay dong thoi bieu cam, than tren, eo, hong va chuyen dong outfit.',
  },
  {
    id: 'back-three-quarter',
    title: 'Lenh 5: Goc cheo sau 3/4 - Duong net hong-eo va chi tiet lung',
    english: 'Dynamic 3/4 Back View - Hip Contour, Waist-to-Hip Ratio, and Back Detail Focus',
    purpose: 'Dung cho corset, vay om, quan jeans, do the thao hoac look co chi tiet mat sau nhu day dan, duong cat may, tui, seam line.',
  },
  {
    id: 'top-closeup',
    title: 'Lenh 6: Can canh than tren - Chat lieu phan ao va corset/bodice',
    english: 'Close-up of the Top/Bodice - Fabric Texture, Fit, Neckline, and Corset Detail Focus',
    purpose: 'Tap trung vao ren, lua, thiet ke co/nguc ao, neckline, vai, tay ao, day dan, nut, khoa va texture ma khong lam mat tong the thoi trang.',
  },
  {
    id: 'bottom-closeup',
    title: 'Lenh 7: Can canh than duoi - Do om phom va duong net vung hong/eo',
    english: 'Close-up of the Bottom - Outfit Fit, Fabric Sheen, Hip Line, and Lower Silhouette Focus',
    purpose: 'Dung de khoe chat lieu satin, denim, da, thun co gian, do bong, do day vai va cach vay/quan giu phom o vung hong.',
  },
  {
    id: 'macro-texture',
    title: 'Lenh 8: Can canh cuc dai Macro - Chat lieu, duong may va phu kien',
    english: 'Extreme Close-up / Macro Shot - Fabric Texture, Fine Stitching, Patterns, and Hardware Focus',
    purpose: 'Zoom sat vao ren, lua, da, denim, nut, khoa keo, hoa tiet theu, hat dinh, phu kien de khoe do sac net san pham.',
  },
  {
    id: 'full-body-lookbook',
    title: 'Lenh 9: Truc dien toan than Lookbook - Tron ven thiet ke va phom dang',
    english: 'Full Body Clear View - Head-to-Toe Showcase of Outfit Design, Proportions, and Overall Fit',
    purpose: 'Anh/video catalog chuan form, thay ro toan bo trang phuc tu dau den chan, ty le phoi do va tong the silhouette.',
  },
  {
    id: 'layered-outerwear',
    title: 'Lenh 10: Tach lop trang phuc - Ao khoac/lop ngoai mo nhe',
    english: 'Open Outerwear / Layered Detail View - Inner Lining, Construction, and Layering Focus',
    purpose: 'Dung cho jacket, coat, suit, blazer, ao khoac nhieu lop de hien ro lop lot, cau truc may va cach phoi voi lop ben trong.',
  },
  {
    id: 'movement-shot',
    title: 'Lenh 11: Goc bat khoanh khac chuyen dong - Do ru va tung bay cua chat lieu',
    english: 'Dynamic Action / Movement Shot - Capturing Fabric Drape, Flow, and Garment Movement',
    purpose: 'Dung khi model buoc di, xoay nguoi, hat toc, tao chuyen dong cho vay xe, quan suong, ao lua, chiffon, organza.',
  },
  {
    id: 'upper-detail',
    title: 'Lenh 12: Dac ta vien co, vai va tay ao - Cau truc than tren',
    english: 'Upper Detail Shot - Neckline, Shoulder Construction, Sleeves, and Collar Focus',
    purpose: 'Tap trung vao co V, cup nguc, co yem, be nhun vai, tay phong, tay om, lapel, collar va diem cat may than tren.',
  },
  {
    id: 'seated-leaning',
    title: 'Lenh 13: Tu the ngoi hoac nghieng nguoi - Do co gian va giu phom',
    english: 'Seated or Leaning Pose - Fabric Stretch, Resilience, and Fit Under Tension',
    purpose: 'Kiem tra do co gian cua jeans, do om, activewear, do thun; xem trang phuc co giu phom khi doi tu the hay khong.',
  },
  {
    id: 'rim-lighting',
    title: 'Lenh 14: Anh sang nguoc/ven - Vien phom dang va do mong nhe cua chat lieu',
    english: 'Backlit / Rim Lighting Shot - Silhouette Precision, Edge Contours, and Fabric Sheerness Focus',
    purpose: 'Dung cho ren, voan, luoi, lua mong, hoac outfit co contour ro; anh sang ven lam noi bat duong cat va vien silhouette.',
  },
  {
    id: 'midsection-detail',
    title: 'Lenh 15: Dac ta eo, dai quan/vay va tui - Tien ich va diem noi',
    english: 'Midsection Detail - Waistband, Belt Loops, Pockets, and Seam Transitions Focus',
    purpose: 'Can canh khu vuc eo-hong de thay cap quan/vay, ly xep, tui, that lung, seam transition va chat luong gia cong.',
  },
]

const PRODUCT_IMAGE_BODY_OPTIONS = [
  'Natural golden-ratio silhouette',
  'Tall statuesque fashion model',
  'Curvy hourglass product-fit profile',
  'Lean athletic editorial profile',
  'Soft feminine catalog profile',
] as const

const PRODUCT_IMAGE_HAIR_OPTIONS = [
  'deep burgundy-red soft waves',
  'deep burgundy-red elegant curled hair',
  'deep burgundy-red office bun',
  'soft black glossy waves',
  'clean high ponytail',
] as const

const PRODUCT_IMAGE_PROMPT_PRESETS: ProductImagePromptPreset[] = [
  {
    id: 'front-back-product-demo',
    title: 'Product Demo Split-Screen Front / Back',
    bodyOption: 'Tall statuesque fashion model',
    hairOption: 'deep burgundy-red soft waves',
    outfitReference: 'IMAGE_1, IMAGE_2, IMAGE_3 outfit references',
    useCase: 'Full product view for catalog, landing page, and AI video first-frame reference.',
    prompt: `Create a vertical portrait product demo image in TRUE 9:16 ratio, UHD 8K.

INPUT REFERENCES:
- IMAGE_0: facial likeness and identity reference only.
- IMAGE_1, IMAGE_2, IMAGE_3: outfit, garment structure, fabric, color, accessories, and footwear reference.

FACIAL LIKENESS:
Render a hyper-realistic photographic likeness based on IMAGE_0. Preserve face shape, eyes, nose, lips, skin texture, and expression style.

REFERENCE IMAGE OVERRIDES:
Do not reuse the old outfit from IMAGE_0. Use the outfit shown in IMAGE_1, IMAGE_2, IMAGE_3. Preserve garment design exactly: no redesign, no reinterpretation, no added handbags, no price tags, no security devices, no random labels.

MODEL OPTIONS:
- Real adult female model, not a mannequin or doll.
- Tall fashion-model proportion, approximately 180cm.
- Body profile: tall statuesque fashion model with a refined hourglass silhouette.
- Hair: deep burgundy-red soft waves.
- Makeup: polished high-fashion beauty makeup.

GARMENT FIT:
The garment fits closely and follows the model's natural silhouette. Fabric tension, seam placement, embroidery, lace, piping, buttons, sheer panels, and hardware must be razor-sharp and accurate. Complex prints or embroidery must follow the body curvature naturally without distortion.

LAYOUT:
Split-screen layout with TWO FULL VIEWS:
- Left panel: FRONT VIEW, full model including face.
- Right panel: BACK VIEW, full model showing the back of the garment, rear silhouette, hair, and head.
Both panels must show the full product perfectly framed from head to high heels.

LIGHTING & BACKGROUND:
Clean studio lighting, texture-enhancing rim light, product-color contrast background, crisp shadow separation.

TEXT:
Small clean English note at the bottom: "PRODUCT DEMO - REAL MODEL DISPLAY WITH FACIAL LIKENESS"
Minimal labels: FRONT VIEW, BACK VIEW.

NEGATIVE:
No face morphing, no warped hands, no distorted garment, no extra accessories, no random text, no fused slits, no missing heels, no mannequin look.`,
  },
  {
    id: 'golden-ratio-studio',
    title: 'Natural Golden-Ratio Studio Demo',
    bodyOption: 'Natural golden-ratio silhouette',
    hairOption: 'deep burgundy-red elegant curled hair',
    outfitReference: 'IMAGE_1+ outfit reference, IMAGE_0 face reference',
    useCase: 'Safer clean product showcase when the tool rejects extreme body wording.',
    prompt: `Create a vertical portrait product demo image in TRUE 9:16 ratio, UHD 8K.

PURPOSE:
Real model fashion product display generated from input portrait and outfit references.

REFERENCES:
- IMAGE_0 controls facial likeness only.
- IMAGE_1, IMAGE_2, IMAGE_3 control outfit design, fabric, trim, accessories, and footwear.

MODEL:
Real adult female model with exact facial likeness from IMAGE_0. Tall 180cm runway-inspired proportion, porcelain skin with realistic pores and natural soft tissue behavior.

BODY PROFILE:
Natural golden-ratio silhouette: slender defined waist, balanced bust, naturally rounded hips, elegant posture, athletic and graceful proportions. The outfit should enhance natural curves without distortion.

HAIR & MAKEUP:
Deep burgundy-red elegant curled hair. Exquisite high-fashion makeup with clean skin finish, defined eyes, and polished lips.

GARMENT RULE:
Preserve the referenced garment exactly. Render embroidery, lace, frog buttons, piping, sequins, sheer panels, slits, seams, waistband, pockets, and hardware with razor-sharp clarity. Remove labels, price tags, and security devices.

FRAMING:
If top or short dress: torso focus from upper thighs up including full face.
If pants, long dress, jumpsuit, ao dai, qipao, or gown: full body from face to high heels.

FABRIC PHYSICS:
Heavy fabrics hang cleanly. Light fabrics flow softly. Form-fit garments show natural fabric tension and realistic seam behavior.

LIGHTING:
Clean contrast studio background, rim light for texture, premium catalog photography.

NEGATIVE:
No redesign, no copied old outfit from IMAGE_0, no handbags, no random text, no unnatural body proportions, no distorted fabric pattern.`,
  },
  {
    id: 'corset-mermaid-skirt',
    title: 'Corset + Long Mermaid Silk Skirt',
    bodyOption: 'Curvy hourglass product-fit profile',
    hairOption: 'deep burgundy-red youthful volume waves',
    outfitReference: 'Corset top + vanilla long mermaid silk skirt references',
    useCase: 'Fashion-fit prompt for corset and fitted skirt product pages.',
    prompt: `Create a vertical portrait product demo in TRUE 9:16 ratio, UHD 8K.

INPUT:
- IMAGE_0: facial likeness reference only.
- IMAGE_1, IMAGE_2, IMAGE_3: corset top, long vanilla mermaid silk skirt, jewelry, and high heels reference.

MODEL:
Real adult female model, exact facial likeness from IMAGE_0, tall 180cm representation, porcelain skin with realistic texture.

STYLE:
Douyin-inspired glamorous beauty makeup, luminous but still realistic. Deep burgundy-red youthful volume waves.

BODY & FIT:
Curvy hourglass product-fit profile with defined waist, full natural bust line, and rounded hip silhouette. The garment follows the model's natural shape with smooth fabric tension and refined catalog styling.

GARMENT DETAILS:
Preserve the corset and silk mermaid skirt exactly. Render lace, boning, seams, satin sheen, waist transition, skirt contour, hem flow, jewelry, and high heels with high clarity. No labels, no price tags, no security devices, no added handbags.

POSE & FRAMING:
Full body, face to high heels. Elegant studio stance with one hip subtly shifted so the skirt shape and waist-to-hem flow are visible. Keep hands relaxed and away from key garment details.

LIGHTING:
Clean studio lighting, rim light along hair and fabric edge, background color contrasting with vanilla skirt.

ANNOTATION:
Bottom note: "PRODUCT DEMO - REAL MODEL DISPLAY WITH FACIAL LIKENESS"
Optional labels: FRONT VIEW, BACK VIEW, DETAIL VIEW.

NEGATIVE:
No garment redesign, no unnatural anatomy, no distorted corset lines, no melted fabric, no random accessories, no text artifacts.`,
  },
  {
    id: 'ao-dai-qipao-detail',
    title: 'Ao Dai / Qipao Intricate Detail Demo',
    bodyOption: 'Tall statuesque fashion model',
    hairOption: 'deep burgundy-red office bun',
    outfitReference: 'Ao Dai, qipao, cheongsam, brocade, frog-button references',
    useCase: 'Best for slit construction, embroidery, frog buttons, brocade, and formal styling.',
    prompt: `Create a vertical portrait product demo image in TRUE 9:16 ratio, UHD 8K.

REFERENCES:
- IMAGE_0: exact facial likeness only.
- IMAGE_1, IMAGE_2, IMAGE_3: ao dai/qipao/cheongsam garment, jewelry, heels, brocade, trims, and styling.

MODEL:
Real adult female model with exact face from IMAGE_0, tall 180cm representation, elegant posture, porcelain skin texture.

HAIR & MAKEUP:
Deep burgundy-red office bun. Refined Douyin-inspired makeup with polished eyes, soft glow, and elegant lips.

GARMENT PRESERVATION:
Use the referenced ao dai/qipao design exactly. Preserve collar height, frog buttons, brocade pattern, embroidery, piping, sleeve length, side slit construction, and hem shape. No redesign, no reinterpretation.

FIT:
Tall statuesque fashion-model profile with defined waist and refined hourglass silhouette. Fabric follows natural body contours while keeping the garment structure believable.

SLIT & POSE:
If the garment has side slits, model stands with one leg slightly forward or hips subtly shifted so the slit opens naturally and shows flap construction. Slits must be clearly separated, not fused.

LAYOUT:
Create a clean product demo with either:
- Split-screen FRONT VIEW and BACK VIEW, or
- Single full-body FRONT VIEW plus macro detail inserts for collar, buttons, embroidery, and side slit.

LIGHTING:
Texture-enhancing studio lighting, crisp rim light for embroidery and brocade relief, high-contrast background.

NEGATIVE:
No fused slits, no blurred embroidery, no extra bags, no random labels, no mannequin skin, no face mismatch.`,
  },
  {
    id: 'body-hair-option-template',
    title: 'Custom Body + Hair Option Template',
    bodyOption: 'Choose from option list',
    hairOption: 'Choose from option list',
    outfitReference: 'Any product/outfit reference image set',
    useCase: 'Reusable master prompt with swappable body, hair, makeup, and framing options.',
    prompt: `Create a vertical portrait product demo image in TRUE 9:16 ratio, UHD 8K.

VARIABLES:
- FACE_REFERENCE: IMAGE_0
- OUTFIT_REFERENCE: IMAGE_1, IMAGE_2, IMAGE_3
- BODY_PROFILE: [Natural golden-ratio silhouette / Tall statuesque fashion model / Curvy hourglass product-fit profile / Lean athletic editorial profile / Soft feminine catalog profile]
- HAIR_STYLE: [deep burgundy-red soft waves / deep burgundy-red elegant curled hair / deep burgundy-red office bun / soft black glossy waves / clean high ponytail]
- MAKEUP_STYLE: [high-fashion beauty / Douyin-inspired glow / clean catalog makeup / luxury evening makeup]
- FRAMING: [front-back split screen / full body single view / side profile / 3/4 front / 3/4 back / macro detail]

CORE REQUIREMENTS:
Use IMAGE_0 for exact facial likeness only. Use OUTFIT_REFERENCE for garment, fabric, accessories, and shoes. Do not reuse clothing from IMAGE_0 unless it is also the product reference.

MODEL:
Real adult female model with hyper-realistic skin texture and natural body behavior. Apply BODY_PROFILE while keeping believable human proportions.

GARMENT:
Preserve garment exactly. Render fabric texture, embroidery, lace, seams, buttons, trims, sheer panels, slits, pockets, waistband, and hardware in sharp detail. Remove labels, price tags, security devices, and accidental text.

POSE:
Choose a pose that reveals the product clearly. Keep face visible when required. Keep hands away from important garment details.

LIGHTING:
Clean studio light, texture rim light, high contrast background, premium product photography.

NEGATIVE:
No redesign, no extra handbags, no distorted face, no impossible proportions, no warped text, no fused garment cuts, no missing shoes.`,
  },
]

const INTERN_PROMPT_LIBRARY: PromptLibraryItem[] = [
  {
    id: 'workflow-strategy',
    title: 'Framework y tuong & quy trinh san xuat cap toc',
    stage: 'Workflow',
    platform: 'TikTok / Reels / Shorts',
    output: 'Art direction -> Strategy -> Prompt layers',
    icon: Sparkles,
    accent: '#8b5cf6',
    prompt: `ROLE: You are an AI Video Editor Intern with strong creative direction and developer-style prompt logic.
TASK: Build a complete 9:16 AI video workflow for [ARTIST / PROJECT / CAMPAIGN].

STEP 1 - ART DIRECTION:
- Define mood & tone: [Modern / Cinematic / Y2K / Streetwear Outdoor / Luxury / Emotional / Performance-driven].
- Define artist image: wardrobe attitude, visual world, color palette, facial energy, movement language.
- Define reference direction without copying any creator exactly.

STEP 2 - SHORT-VIDEO STRATEGY:
- Structure: Hook first 3 seconds -> Body transitions synced to music -> CTA or memorable ending.
- Platform: TikTok / Instagram Reels / YouTube Shorts, vertical 9:16.
- Retention rule: introduce a new visual beat every 3-5 seconds.
- Editing rule: keep cuts readable, subtitles safe, face/outfit/product unobstructed.

STEP 3 - DEVELOPER LOGIC:
- Convert the idea into prompt layers:
  [Subject/Artist Style] + [Outfit & Textures] + [Environment/Background] + [Camera Movement & Angle] + [Lighting & Render Engine]
- Split output into: image prompt, video prompt, voice-over, subtitle, music/effect note, export checklist.

RETURN:
1. One-line creative concept
2. Mood board keywords
3. 5-beat vertical video structure
4. Prompt layer breakdown
5. Tools to use: [Midjourney / VEO3 / Higgsfield / CapCut / Premiere]
6. Risk notes and safe wording`,
  },
  {
    id: 'prompt-layering',
    title: 'Prompt Layering System',
    stage: 'Prompt Logic',
    platform: 'VEO3 / Higgsfield / Midjourney',
    output: 'Cong thuc prompt co the tai su dung',
    icon: Film,
    accent: '#06b6d4',
    prompt: `Use this fixed prompt architecture for professional AI video generation:

FORMULA:
[Subject/Artist Style] + [Outfit & Textures] + [Environment/Background] + [Camera Movement & Angle] + [Lighting & Render Engine]

SUBJECT:
- [Artist/talent/model description], age range, attitude, expression, pose language, performance energy.
- Keep identity consistent with reference assets if provided.

OUTFIT & TEXTURES:
- [Garment type], [fit], [silhouette], [fabric], [texture], [accessories].
- Example: detailed streetwear fabric weave, reflective leather jacket, high-fidelity silk texture, tailored body-con silhouette.

ENVIRONMENT:
- [Studio / streetwear outdoor / backstage / rooftop / neon city / clean fashion showroom].
- Include background objects only if they support the artist/project message.

CAMERA:
- [3/4 Front Left View / 3/4 Front Right View / close-up / full-body / low-angle hero / smooth panning].
- Define camera position by placement, not body anatomy.

LIGHTING & RENDER:
- [cinematic softbox / golden hour / neon rim light / high fashion editorial / hyper-realistic render / natural skin tone].

NEGATIVE CONTROL:
- no face morphing, no extra limbs, no warped logos, no unstable clothes, no random text, no oversexualized framing, no flicker.`,
  },
  {
    id: 'camera-control',
    title: 'Camera Control & Motion Commands',
    stage: 'Camera',
    platform: 'VEO3 / Higgsfield / Runway',
    output: 'Goc may 3/4 va motion muot',
    icon: Camera,
    accent: '#38bdf8',
    prompt: `CAMERA CONTROL PROMPT BLOCK:

3/4 FRONT LEFT VIEW:
Set the camera in front of the subject, slightly to the subject's left side, around a 45-degree angle from center. Keep the face, outfit silhouette, and expression visible. Use this for artist lookbook, outfit reveal, performance close-up, and fashion editorial framing.

3/4 FRONT RIGHT VIEW:
Set the camera in front of the subject, slightly to the subject's right side, around a 45-degree angle from center. Define the camera position clearly by camera placement, not body anatomy. Keep the body readable and avoid twisted posture.

SMOOTH MOTION COMMANDS:
- cinematic slow motion
- smooth panning
- subtle camera drift
- gentle dolly-in
- stabilized handheld movement
- realistic cloth physics
- hyper-realistic physics
- natural body movement
- clean motion interpolation

NEGATIVE MOTION CONTROL:
No shaky jitter, no sudden zoom jump, no rubber body, no sliding feet, no flickering clothes, no duplicated subject, no distorted hands, no camera teleport.

COPY-READY VIDEO LINE:
Vertical 9:16 cinematic short video, 3/4 Front Left View, smooth panning with subtle camera drift, natural body movement, realistic cloth physics, clean facial consistency, fashion editorial lighting, hyper-realistic render, no jitter, no morphing.`,
  },
  {
    id: 'fashion-texture',
    title: 'Fashion & Texture cho nghe si',
    stage: 'Visual Fashion',
    platform: 'Midjourney / VEO3 / Higgsfield',
    output: 'Chat lieu, outfit, visual nghe si',
    icon: Shirt,
    accent: '#ec4899',
    prompt: `FASHION & TEXTURE PROMPT BLOCK:

Use these texture keywords when building artist visuals:
- high-fidelity silk texture
- detailed streetwear fabric weave
- reflective leather
- premium denim grain
- satin highlight rolloff
- ribbed knit texture
- sheer organza layering
- metallic accessory reflection
- body-con silhouette
- oversized streetwear silhouette
- tailored blazer structure
- outdoor performance styling

ARTIST VISUAL STYLE TEMPLATE:
[Artist/talent] wearing [outfit description] with [fabric texture], styled for [music video / social campaign / fashion lookbook], in [environment], with [camera angle], [lighting], and [render style].

EXAMPLE:
Young Vietnamese music artist wearing an oversized black streetwear jacket with detailed fabric weave, reflective leather boots, silver accessories, standing in a night city outdoor environment, 3/4 Front Right View, subtle camera drift, neon rim light, cinematic high-fashion editorial render, vertical 9:16.

QUALITY CONTROL:
Keep garment details readable, avoid random logos, avoid warped jewelry, preserve clean silhouette, keep face and outfit unobstructed.`,
  },
  {
    id: 'safe-terms',
    title: 'Safe Terms Guardrail',
    stage: 'Policy-safe wording',
    platform: 'All AI tools',
    output: 'Tu khoa thay the an toan',
    icon: AlertCircle,
    accent: '#f59e0b',
    prompt: `SAFE TERMS GUARDRAIL FOR FASHION / TALENT / OUTDOOR VISUALS:

Use refined, production-safe wording:
- shapewear instead of overly explicit body-focused wording
- tailored swimwear instead of provocative swim wording
- aerodynamic athletic wear instead of sexualized sportswear wording
- body-con silhouette instead of explicit body emphasis
- sculpted fit instead of suggestive framing
- elegant fitted styling instead of revealing/sexy wording
- confidence-forward pose instead of provocative pose
- fashion editorial framing instead of sensual framing
- tasteful silhouette emphasis instead of body-focused emphasis

GUARDRAIL RULE:
Describe garment structure, styling purpose, movement, and confidence. Do not describe nudity, explicit body parts, or sexual behavior. Keep the subject adult, professionally styled, and campaign-safe.

SAFE COPY-READY LINE:
The model wears elegant fitted styling with a sculpted silhouette, tailored swimwear-inspired structure, confidence-forward pose, fashion editorial framing, tasteful outdoor campaign energy, no explicit or sexualized framing.`,
  },
  {
    id: 'veo-higgsfield-video',
    title: 'VEO3 / Higgsfield Image-to-Video',
    stage: 'AI Video Production',
    platform: 'VEO3 / Higgsfield',
    output: 'Prompt video 8-12s',
    icon: Wand2,
    accent: '#22c55e',
    prompt: `Create a vertical 9:16 AI video from the provided artist/product reference.

SUBJECT / ARTIST STYLE:
[Artist/talent/model], [expression], [pose], [performance energy], preserve identity from reference.

OUTFIT & TEXTURE:
[Outfit], [fabric texture], [silhouette], [accessory details], keep garment fidelity.

ENVIRONMENT / BACKGROUND:
[Modern studio / streetwear outdoor / rooftop / backstage / neon city / fashion showroom], clean background hierarchy.

ACTION:
[Opening pose] -> [micro movement synced to music] -> [final hero frame for CTA].

CAMERA:
Vertical 9:16, [3/4 Front Left View / 3/4 Front Right View], smooth panning, subtle camera drift, stabilized handheld feel, clear face and outfit readability.

LIGHTING:
[Cinematic softbox / neon rim light / golden hour / clean editorial lighting], natural skin tone, realistic cloth shadows.

RENDER:
Hyper-realistic physics, realistic cloth movement, premium music-promo look, clean high-detail render.

EDIT INTENT:
Leave safe lower-third space for subtitles. Strong first frame, clean final frame.

NEGATIVE:
No face morphing, no extra limbs, no warped logos, no flickering clothes, no random text, no shaky jitter, no low-res blur.`,
  },
  {
    id: 'midjourney-moodboard',
    title: 'Midjourney Moodboard cho nghe si',
    stage: 'Moodboard',
    platform: 'Midjourney',
    output: 'Visual reference / key art',
    icon: ImageIcon,
    accent: '#a855f7',
    prompt: `/imagine prompt:
[Artist/talent style], [campaign mood], [outfit & texture], [environment], [camera angle], [lighting], [art direction], [render quality]

Example:
Vietnamese pop artist in a modern cinematic streetwear outdoor campaign, oversized technical jacket with detailed fabric weave, reflective leather accessories, neon city background, 3/4 Front Left View, low-angle fashion editorial camera, cinematic rim light, high-fidelity skin texture, premium music video key art, clean composition, vertical poster crop --ar 9:16 --style raw

NEGATIVE / AVOID:
random text, distorted face, extra fingers, warped logo, messy background, copied celebrity identity, oversexualized framing.

USE FOR:
- Artist visual moodboard
- Cover frame
- AI video first-frame reference
- Creative direction handoff to Content/Creative team`,
  },
  {
    id: 'shot-list',
    title: 'Shot List & timeline dung video co ban',
    stage: 'Editing Plan',
    platform: 'CapCut / Premiere / DaVinci',
    output: 'Timeline 9:16 theo timestamp',
    icon: Clapperboard,
    accent: '#14b8a6',
    prompt: `Convert this concept into a production-ready vertical 9:16 shot list.

CONCEPT:
[Paste idea/concept here]

AVAILABLE ASSETS:
- Artist/product images:
- Video clips:
- Audio/music:
- Brand/project notes:

Return a timeline table with:
- Timestamp
- Scene purpose
- Visual/shot description
- AI generation prompt if needed
- Editing action
- Subtitle/on-screen text
- Sound/music cue
- Transition/effect

Rules:
- Total duration: [15s / 24s / 30s / 45s]
- First 2 seconds must be a strong hook.
- Every 4-6 seconds must introduce a visual change.
- Keep transitions simple: cut, speed ramp, zoom, match cut, light leak, whip pan.
- Build for mobile viewing and retention.`,
  },
  {
    id: 'voice-over',
    title: 'Voice-over, music, subtitle pack',
    stage: 'Post-production',
    platform: 'ElevenLabs / CapCut / TTS',
    output: 'VO + subtitle + music cue',
    icon: MessageSquare,
    accent: '#10b981',
    prompt: `Create the post-production pack for a 9:16 short-form video.

VIDEO TOPIC:
[Topic / artist / project / product]

GOAL:
[Introduce / promote / explain / emotional storytelling / conversion]

STYLE:
[Natural Vietnamese Gen Z / premium narrator / energetic creator / calm documentary / fanpage editor]

DURATION:
[15s / 24s / 30s / 45s]

Return:
1. Full voice-over script
2. Timestamped voice-over lines
3. Subtitle-ready version with short line breaks
4. Music direction: genre, BPM feel, beat-drop moment
5. Simple effect notes: speed ramp, zoom, light leak, blur, flash, match cut
6. 3 alternate hooks
7. 3 CTA endings

Rules:
- Spoken language must sound natural, not corporate.
- Sentence length should fit TikTok/Reels pacing.
- Avoid overexplaining. Make every sentence visual and useful.
- Add pauses where the edit needs impact.
- Subtitles must not cover face, outfit, logo, or key product detail.`,
  },
  {
    id: 'subtitle-pack',
    title: 'Subtitle & text overlay QC',
    stage: 'Subtitle',
    platform: 'CapCut / Premiere',
    output: 'Caption style & safe area',
    icon: FileText,
    accent: '#f59e0b',
    prompt: `Create subtitle and on-screen text for a 9:16 short video.

SCRIPT/VOICEOVER:
[Paste script here]

BRAND/ARTIST TONE:
[Minimal / bold / luxury / street / emotional / playful]

Return:
1. Subtitle lines with natural breaks
2. On-screen hook text for first frame
3. Highlight words to animate
4. Text style recommendation
5. Placement notes for 9:16
6. Safe-area notes for TikTok/Reels/Shorts

Rules:
- Each subtitle line should be short enough for mobile.
- Avoid blocking face, product, or key motion.
- Use emphasis only on high-value words.
- Keep text clean and professional.`,
  },
  {
    id: 'edit-director',
    title: 'Editing Director Notes',
    stage: 'Cat ghep',
    platform: 'CapCut / Premiere / DaVinci',
    output: 'Huong dan dung video',
    icon: Layers,
    accent: '#22c55e',
    prompt: `Act as a short-form video editing director. Review this raw plan and turn it into clear editing instructions.

VIDEO PLAN:
[Paste timeline / shot list / raw idea]

TARGET PLATFORM:
[TikTok / Reels / YouTube Shorts]

ASSETS:
[List clips, AI videos, photos, music, voice-over, subtitles]

Return:
- Final structure by timestamp
- Cut points and pacing notes
- Music and beat-sync instructions
- B-roll / AI insert suggestions
- Subtitle rhythm
- Simple effects only where useful
- Color and export notes
- Final QC checklist before publishing

Rules:
- Keep it achievable for an AI Video Editor Intern.
- Prefer clean edits over excessive effects.
- Optimize for retention and clarity in 9:16.`,
  },
  {
    id: 'trend-adapter',
    title: 'AI & TikTok Trend Adapter',
    stage: 'Trend Research',
    platform: 'TikTok research',
    output: 'Bien trend thanh format cho du an',
    icon: TrendingUp,
    accent: '#38bdf8',
    prompt: `Analyze this TikTok/Reels trend and adapt it for [ARTIST/PROJECT/BRAND].

TREND DESCRIPTION OR LINK NOTES:
[Paste trend notes here]

PROJECT CONTEXT:
- Artist/project:
- Audience:
- Campaign goal:
- Assets available:

Return:
1. What makes the trend work
2. Safe adaptation angle
3. 5 video concepts using the trend
4. Hook text options
5. Shot list for the best concept
6. AI prompts needed
7. Risks to avoid

Rules:
- Do not copy a creator exactly.
- Keep the recognizable trend mechanic, but make the idea project-specific.
- Make it production-ready for a 9:16 short.`,
  },
  {
    id: 'team-brief',
    title: 'Creative Team Handoff cho nghe si/du an',
    stage: 'Team Workflow',
    platform: 'Content / Creative',
    output: 'Brief giao viec ro rang',
    icon: Palette,
    accent: '#a855f7',
    prompt: `Create a concise handoff brief for Content/Creative team.

VIDEO OBJECTIVE:
[Objective]

CONCEPT:
[Concept summary]

ASSETS NEEDED:
[Artist images, product images, music, footage, logo, reference videos]

Return a brief with:
- Goal
- Target audience
- Core message
- Visual direction
- Required assets
- AI generation tasks
- Editing tasks
- Caption/hashtag notes
- Approval checklist
- Delivery format: 9:16, [duration], [platform]

Tone:
Professional, clear, easy for a team to execute.`,
  },
]

function PromptLibraryPage() {
  const frameworkText = [
    'AI VIDEO EDITOR INTERN WORKFLOW',
    ...PROMPT_LIBRARY_FRAMEWORK_STEPS.map((step) => `${step.title}: ${step.desc}`),
    '',
    `PROMPT LAYERING FORMULA: ${PROMPT_LAYERING_FORMULA}`,
  ].join('\n')

  const shotCommandText = [
    'SHOT COMMAND HEADLINES - FASHION PRODUCT FIT',
    ...PROMPT_LIBRARY_SHOT_COMMANDS.map((item, index) => [
      `${index + 1}. ${item.title}`,
      `EN: ${item.english}`,
      `PURPOSE: ${item.purpose}`,
    ].join('\n')),
  ].join('\n\n')

  const productImageText = [
    'PRODUCT IMAGE PROMPT LIBRARY - PORTRAIT INPUT TO REAL MODEL PRODUCT DEMO',
    `BODY OPTIONS: ${PRODUCT_IMAGE_BODY_OPTIONS.join(' / ')}`,
    `HAIR OPTIONS: ${PRODUCT_IMAGE_HAIR_OPTIONS.join(' / ')}`,
    '',
    ...PRODUCT_IMAGE_PROMPT_PRESETS.map((item, index) => [
      `${index + 1}. ${item.title}`,
      `BODY: ${item.bodyOption}`,
      `HAIR: ${item.hairOption}`,
      `REFERENCE: ${item.outfitReference}`,
      `USE CASE: ${item.useCase}`,
      '',
      item.prompt,
    ].join('\n')),
  ].join('\n\n---\n\n')

  const omniFlashText = [
    'GEMINI OMNI FLASH PROMPT GUIDE - VIDEO CREATION AND EDITING',
    `SOURCE: ${OMNI_FLASH_PROMPT_GUIDE_URL}`,
    `MODEL CARD: ${OMNI_FLASH_MODEL_CARD_URL}`,
    'USE CASE: create/edit video through natural language, combine image/video/text/audio references, and refine results across turns.',
    'CORE SHIFT: with Veo, write precise first-frame to last-frame instructions; with Omni Flash, state intent clearly and let world knowledge fill realistic detail.',
    '',
    ...OMNI_FLASH_GUIDE_ITEMS.map((item, index) => [
      `${index + 1}. ${item.title}`,
      `MODE: ${item.badge}`,
      `NOTE: ${item.desc}`,
      '',
      item.promptMove,
    ].join('\n')),
    '',
    'MODEL CARD ADDENDUM',
    ...OMNI_FLASH_MODEL_CARD_ITEMS.map((item, index) => [
      `${index + 1}. ${item.title}`,
      `LABEL: ${item.label}`,
      `NOTE: ${item.desc}`,
      'CHECKLIST:',
      ...item.checklist.map((line) => `- ${line}`),
    ].join('\n')),
  ].join('\n\n---\n\n')

  const fullLibraryText = INTERN_PROMPT_LIBRARY
    .map((item, index) => `${index + 1}. ${item.title}\nSTAGE: ${item.stage}\nOUTPUT: ${item.output}\n\n${item.prompt}`)
    .join('\n\n---\n\n')

  return (
    <main className="prompt-library-page fade-in">
      <section className="prompt-library-hero">
        <div className="prompt-library-kicker">
          <Sparkles size={14} />
          AI Video Editor Intern Toolkit
        </div>
        <div className="prompt-library-hero-grid">
          <div>
            <h2>Prompt Library cho AI Video Editor</h2>
            <p>
              Bo prompt dung san de len y tuong, viet prompt va san xuat video AI cho nghe si/du an truyen thong:
              TikTok, Reels, YouTube Shorts 9:16, voice-over, cat ghep, nhac, subtitle, hieu ung don gian,
              lam viec cung team Content/Creative va cap nhat trend AI/TikTok.
            </p>
          </div>
          <div className="prompt-library-actions">
            <CopyButton text={`${frameworkText}\n\n---\n\n${omniFlashText}\n\n---\n\n${productImageText}\n\n---\n\n${shotCommandText}\n\n---\n\n${fullLibraryText}`} />
            <span>Copy full toolkit</span>
          </div>
        </div>
      </section>

      <section className="prompt-library-workflow" aria-label="AI Video Editor Intern workflow">
        {['Art Direction', 'Short-video Strategy', 'Developer Logic', 'Prompt Layering', 'AI Video', 'Post-production'].map((step) => (
          <div key={step} className="prompt-library-step">{step}</div>
        ))}
      </section>

      <section className="prompt-library-framework">
        <div className="prompt-library-framework-main">
          <div className="card-title">
            <Layers /> Framework y tuong & quy trinh san xuat cap toc
          </div>
          <div className="prompt-library-framework-grid">
            {PROMPT_LIBRARY_FRAMEWORK_STEPS.map((step) => (
              <div key={step.title} className="prompt-library-framework-item">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="prompt-library-formula">
          <div className="card-title">
            <FileText /> Prompt Layering Formula
            <CopyButton text={PROMPT_LAYERING_FORMULA} />
          </div>
          <code>{PROMPT_LAYERING_FORMULA}</code>
          <p>
            Cong thuc nay giup intern dich brief nghe thuat thanh prompt co logic,
            giam loi bien dang va de handoff cho team san xuat.
          </p>
        </div>
      </section>

      <section className="omni-flash-guide-section">
        <div className="prompt-library-section-head">
          <div>
            <div className="card-title">
              <RefreshCw /> Gemini Omni Flash Prompt Guide
            </div>
            <h3>Model moi cho tao va sua video bang hoi thoai tu nhien</h3>
            <p>
              Cap nhat theo guide cua Google DeepMind: Omni Flash phu hop de tao/sua video theo nhieu vong,
              dung reference image/video/text/audio, dieu khien camera/action/text va dua tren world knowledge.
              Dung section nay khi lam viec trong Gemini, Google Flow hoac quy trinh video AI can edit lien tuc.
            </p>
          </div>
          <div className="prompt-library-actions">
            <CopyButton text={omniFlashText} />
            <a href={OMNI_FLASH_PROMPT_GUIDE_URL} target="_blank" rel="noreferrer">Prompt guide</a>
            <a href={OMNI_FLASH_MODEL_CARD_URL} target="_blank" rel="noreferrer">Model card</a>
          </div>
        </div>

        <div className="omni-flash-principle-grid">
          {OMNI_FLASH_GUIDE_ITEMS.map((item, index) => (
            <article key={item.id} className="omni-flash-principle-card">
              <div className="omni-flash-principle-head">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p>{item.badge}</p>
                  <h4>{item.title}</h4>
                </div>
                <CopyButton text={item.promptMove} />
              </div>
              <p className="omni-flash-principle-desc">{item.desc}</p>
              <pre className="prompt-library-prompt omni-flash-prompt">{item.promptMove}</pre>
            </article>
          ))}
        </div>

        <div className="omni-flash-model-card-grid" aria-label="Gemini Omni Flash model card additions">
          {OMNI_FLASH_MODEL_CARD_ITEMS.map((item) => (
            <article key={item.id} className="omni-flash-model-card">
              <div className="omni-flash-model-card-head">
                <p>{item.label}</p>
                <h4>{item.title}</h4>
              </div>
              <p className="omni-flash-principle-desc">{item.desc}</p>
              <ul>
                {item.checklist.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="product-image-library-section">
        <div className="prompt-library-section-head">
          <div>
            <div className="card-title">
              <ImageIcon /> Product Image Prompt Library
            </div>
            <h3>Tu anh chan dung input tao model demo san pham</h3>
            <p>
              Thu vien nay dung IMAGE_0 lam face reference, IMAGE_1+ lam outfit/product reference,
              co tuy chon body profile, kieu toc, makeup, front/back split-screen va product detail.
            </p>
          </div>
          <div className="prompt-library-actions">
            <CopyButton text={productImageText} />
            <span>Copy product image library</span>
          </div>
        </div>

        <div className="product-image-option-grid">
          <div className="product-image-option-card">
            <div className="card-title">
              <Ratio /> Body Options
            </div>
            {PRODUCT_IMAGE_BODY_OPTIONS.map((option) => (
              <span key={option}>{option}</span>
            ))}
          </div>

          <div className="product-image-option-card">
            <div className="card-title">
              <Palette /> Hair Options
            </div>
            {PRODUCT_IMAGE_HAIR_OPTIONS.map((option) => (
              <span key={option}>{option}</span>
            ))}
          </div>
        </div>

        <div className="product-image-preset-grid">
          {PRODUCT_IMAGE_PROMPT_PRESETS.map((item) => (
            <article key={item.id} className="product-image-preset-card">
              <div className="product-image-preset-head">
                <div>
                  <p>{item.useCase}</p>
                  <h4>{item.title}</h4>
                </div>
                <CopyButton text={item.prompt} />
              </div>
              <div className="product-image-preset-meta">
                <span>{item.bodyOption}</span>
                <span>{item.hairOption}</span>
                <span>{item.outfitReference}</span>
              </div>
              <pre className="prompt-library-prompt product-image-preset-prompt">{item.prompt}</pre>
            </article>
          ))}
        </div>
      </section>

      <section className="prompt-library-shot-section">
        <div className="prompt-library-section-head">
          <div>
            <div className="card-title">
              <Camera /> Shot Command Headlines
            </div>
            <h3>To hop cau lenh goc may de ton phom dang va chi tiet san pham</h3>
            <p>
              Cac lenh nay dung cho lookbook, nghe si, fashion campaign va AI video 9:16.
              Wording duoc viet theo huong product-fit, silhouette va chat lieu de giam rui ro bi AI tool chan.
            </p>
          </div>
          <div className="prompt-library-actions">
            <CopyButton text={shotCommandText} />
            <span>Copy shot commands</span>
          </div>
        </div>

        <div className="prompt-library-shot-grid">
          {PROMPT_LIBRARY_SHOT_COMMANDS.map((item, index) => (
            <article key={item.id} className="prompt-library-shot-card">
              <div className="prompt-library-shot-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="prompt-library-shot-body">
                <h4>{item.title}</h4>
                <p className="prompt-library-shot-en">{item.english}</p>
                <p>{item.purpose}</p>
              </div>
              <CopyButton text={`${item.title}\n(${item.english})\n\nMuc dich: ${item.purpose}`} />
            </article>
          ))}
        </div>
      </section>

      <section className="prompt-library-grid">
        {INTERN_PROMPT_LIBRARY.map((item) => {
          const Icon = item.icon

          return (
            <article key={item.id} className="prompt-library-card" style={{ ['--library-accent' as string]: item.accent }}>
              <div className="prompt-library-card-head">
                <div className="prompt-library-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="prompt-library-stage">{item.stage}</p>
                  <h3>{item.title}</h3>
                </div>
                <CopyButton text={item.prompt} />
              </div>

              <div className="prompt-library-meta">
                <span>{item.platform}</span>
                <span>{item.output}</span>
              </div>

              <pre className="prompt-library-prompt">{item.prompt}</pre>
            </article>
          )
        })}
      </section>
    </main>
  )
}

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
type AppProps = {
  initialPageMode?: AppPageMode
}

export default function App({ initialPageMode = 'core' }: AppProps) {
  // State
  const [pageMode, setPageMode] = useState<AppPageMode>(initialPageMode)
  const [ootdTemplateScenarioId, setOotdTemplateScenarioId] = useState<OotdTemplateScenarioId>(OOTD_TEMPLATE_DEFAULT_SCENARIO_ID)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('aff_api_key') || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [model, setModel] = useState(() => localStorage.getItem('aff_model') || 'gemini-2.5-flash')
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [productImage, setProductImage] = useState<string | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [storyboardFaceImage, setStoryboardFaceImage] = useState<string | null>(null)
  const [storyboardProductImage, setStoryboardProductImage] = useState<string | null>(null)
  const [storyboardBackgroundImage, setStoryboardBackgroundImage] = useState<string | null>(null)
  const [musicFaceImage, setMusicFaceImage] = useState<string | null>(null)
  const [musicProductImage, setMusicProductImage] = useState<string | null>(null)
  const [musicBackgroundImage, setMusicBackgroundImage] = useState<string | null>(null)
  const [musicAudioReference, setMusicAudioReference] = useState<MusicAudioReference | null>(null)
  const [musicScriptReference, setMusicScriptReference] = useState<MusicScriptReference | null>(null)
  const [musicArtistImages, setMusicArtistImages] = useState<MusicImageReference[]>([])
  const [musicLocationImages, setMusicLocationImages] = useState<MusicImageReference[]>([])
  const [pasteTarget, setPasteTarget] = useState<
    | 'face'
    | 'product'
    | 'background'
    | 'storyboard_face'
    | 'storyboard_product'
    | 'storyboard_background'
    | 'music_face'
    | 'music_product'
    | 'music_background'
  >('face')
  const [duration, setDuration] = useState(32)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16')
  const [generationMode, setGenerationMode] = useState<GenerationMode>(() => {
    const saved = localStorage.getItem('aff_generation_mode')
    return normalizeHistoryGenerationMode(saved, 'video_prompt')
  })
  const [storyboardEngine, setStoryboardEngine] = useState<StoryboardVideoEngine>(() => {
    const saved = localStorage.getItem('aff_storyboard_engine')
    return normalizeStoryboardVideoEngine(saved, 'veo_3_1')
  })
  const [storyboardTemplate, setStoryboardTemplate] = useState<StoryboardTemplate>(() => {
    const saved = localStorage.getItem('aff_storyboard_template')
    return normalizeStoryboardTemplate(saved, 'product_launch')
  })
  const [lookbookImageCount, setLookbookImageCount] = useState<LookbookImageCount>(() => {
    const saved = localStorage.getItem('aff_lookbook_image_count')
    return normalizeLookbookImageCount(saved, DEFAULT_LOOKBOOK_IMAGE_COUNT)
  })
  const [lookbookStyleTone, setLookbookStyleTone] = useState<LookbookStyleTone>(() => {
    const saved = localStorage.getItem('aff_lookbook_style_tone')
    return normalizeLookbookStyleTone(saved, 'standard')
  })
  const [lookbookTheme, setLookbookTheme] = useState<LookbookTheme>(() => {
    const saved = localStorage.getItem('aff_lookbook_theme')
    return normalizeLookbookTheme(saved, 'auto')
  })
  const [videoPoseDirectionLock, setVideoPoseDirectionLock] = useState<LookbookPoseDirectionLock>(() => {
    const saved = localStorage.getItem('aff_video_pose_direction_lock')
      || localStorage.getItem('aff_lookbook_pose_direction_lock')
    return normalizeLookbookPoseDirectionLock(saved, 'auto')
  })
  const [productCategory, setProductCategory] = useState<ProductCategory>(() => {
    const saved = localStorage.getItem('aff_product_category')
    return normalizeProductCategory(saved, 'auto')
  })
  const [productCategoryGroup, setProductCategoryGroup] = useState<ProductCategoryGroup>(() => {
    const savedGroup = localStorage.getItem('aff_product_category_group')
    if (savedGroup !== null) {
      return normalizeProductCategoryGroup(savedGroup, 'all')
    }

    const savedCategory = localStorage.getItem('aff_product_category')
    const normalizedCategory = normalizeProductCategory(savedCategory, 'auto')
    const matchedCategory = PRODUCT_CATEGORY_OPTIONS.find((item) => item.value === normalizedCategory)
    return matchedCategory?.group || 'all'
  })
  const [autoApplyCategoryType, setAutoApplyCategoryType] = useState(() => {
    const saved = localStorage.getItem('aff_auto_apply_product_category_type')
    return saved === null ? false : saved === '1'
  })
  const [contentType, setContentType] = useState<ContentType>('ootd')
  const [isContentTypeManuallyLocked, setIsContentTypeManuallyLocked] = useState(false)
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
  const isOotdTemplatePage = pageMode === 'ootd_template'
  const activeOotdTemplateScenario = OOTD_TEMPLATE_SCENARIOS.find((item) => item.id === ootdTemplateScenarioId)
    || OOTD_TEMPLATE_SCENARIOS[0]

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
  useEffect(() => { localStorage.setItem('aff_generation_mode', generationMode) }, [generationMode])
  useEffect(() => { localStorage.setItem('aff_storyboard_engine', storyboardEngine) }, [storyboardEngine])
  useEffect(() => { localStorage.setItem('aff_storyboard_template', storyboardTemplate) }, [storyboardTemplate])
  useEffect(() => { localStorage.setItem('aff_lookbook_image_count', String(lookbookImageCount)) }, [lookbookImageCount])
  useEffect(() => { localStorage.setItem('aff_lookbook_style_tone', lookbookStyleTone) }, [lookbookStyleTone])
  useEffect(() => { localStorage.setItem('aff_lookbook_theme', lookbookTheme) }, [lookbookTheme])
  useEffect(() => { localStorage.setItem('aff_video_pose_direction_lock', videoPoseDirectionLock) }, [videoPoseDirectionLock])
  useEffect(() => { localStorage.setItem('aff_product_category', productCategory) }, [productCategory])
  useEffect(() => { localStorage.setItem('aff_product_category_group', productCategoryGroup) }, [productCategoryGroup])
  useEffect(() => { localStorage.setItem('aff_auto_apply_product_category_type', autoApplyCategoryType ? '1' : '0') }, [autoApplyCategoryType])
  useEffect(() => { saveProductLocationHistory(productLocationHistory) }, [productLocationHistory])
  useEffect(() => { saveOutfitTypeLocationHistory(outfitTypeLocationHistory) }, [outfitTypeLocationHistory])
  const isPromptLibraryPage = pageMode === 'prompt_library'
  const isStoryboardTemplatePage = pageMode === 'storyboard_template'
  const isMusicVideoTemplatePage = pageMode === 'music_video_template'

  useEffect(() => {
    if (typeof window === 'undefined') return

    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
    const targetPath = pageMode === 'ootd_template'
      ? OOTD_TEMPLATE_ROUTE_PATH
      : pageMode === 'storyboard_template'
        ? STORYBOARD_TEMPLATE_ROUTE_PATH
      : pageMode === 'music_video_template'
        ? MUSIC_VIDEO_TEMPLATE_ROUTE_PATH
      : pageMode === 'prompt_library'
        ? PROMPT_LIBRARY_ROUTE_PATH
        : '/'

    if (currentPath !== targetPath) {
      window.history.replaceState(null, '', `${targetPath}${window.location.search}${window.location.hash}`)
    }
  }, [pageMode])

  useEffect(() => {
    if (!isOotdTemplatePage) return

    const lockedScenarioContentType = activeOotdTemplateScenario.lockedContentType

    if (generationMode !== 'video_prompt') {
      setGenerationMode('video_prompt')
    }
    const hasValidTemplateDuration = DURATIONS.some((entry) => entry.value === duration)
    if (!hasValidTemplateDuration) {
      setDuration(OOTD_TEMPLATE_LOCKED_DURATION)
    }
    if (aspectRatio !== OOTD_TEMPLATE_LOCKED_ASPECT_RATIO) {
      setAspectRatio(OOTD_TEMPLATE_LOCKED_ASPECT_RATIO)
    }
    if (contentType !== lockedScenarioContentType) {
      setContentType(lockedScenarioContentType)
    }
    if (!isContentTypeManuallyLocked) {
      setIsContentTypeManuallyLocked(true)
    }
    if (videoPoseDirectionLock !== 'auto') {
      setVideoPoseDirectionLock('auto')
    }
  }, [
    aspectRatio,
    contentType,
    duration,
    generationMode,
    isContentTypeManuallyLocked,
    isOotdTemplatePage,
    activeOotdTemplateScenario.lockedContentType,
    videoPoseDirectionLock,
  ])

  useEffect(() => {
    if (!isStoryboardTemplatePage) return

    if (generationMode !== 'storyboard_video') {
      setGenerationMode('storyboard_video')
    }
  }, [generationMode, isStoryboardTemplatePage])

  useEffect(() => {
    if (!isMusicVideoTemplatePage) return

    if (generationMode !== 'music_video') {
      setGenerationMode('music_video')
    }
    if (storyboardTemplate !== 'cinematic_story') {
      setStoryboardTemplate('cinematic_story')
    }
  }, [generationMode, isMusicVideoTemplatePage, storyboardTemplate])

  useEffect(() => {
    if (!loading) {
      setLoadingStageIndex(0)
      return
    }

    const loadingStages = generationMode === 'lookbook_image'
      ? LOOKBOOK_LOADING_STAGES
      : PROMPT_LOADING_STAGES

    setLoadingStageIndex(0)
    const timer = window.setInterval(() => {
      setLoadingStageIndex((prev) => Math.min(prev + 1, loadingStages.length - 1))
    }, 1700)

    return () => window.clearInterval(timer)
  }, [generationMode, loading])

  useEffect(() => {
    if (!promptToast || promptToast.kind === 'loading') return

    const timer = window.setTimeout(() => {
      setPromptToast(null)
    }, 3600)

    return () => window.clearTimeout(timer)
  }, [promptToast])

  const handleMusicAudioFile = useCallback(async (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      setError('Music Video chi ho tro file audio')
      return
    }

    try {
      const [dataUrl, durationSec] = await Promise.all([
        readFileAsDataUrl(file),
        readAudioDuration(file),
      ])
      setMusicAudioReference({
        name: file.name,
        dataUrl,
        mimeType: file.type || 'audio/mpeg',
        size: file.size,
        durationSec,
      })
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Khong the doc file nhac')
    }
  }, [])

  const handleMusicScriptFile = useCallback(async (file: File | null) => {
    if (!file) return

    try {
      const text = await readFileAsText(file)
      setMusicScriptReference({
        name: file.name,
        text,
      })
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Khong the doc file kich ban')
    }
  }, [])

  const handleMusicArtistFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setError('Anh nghe si chi ho tro file anh')
      return
    }

    try {
      const nextImages = await Promise.all(imageFiles.map(async (file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        dataUrl: await resizeImage(await readFileAsDataUrl(file)),
      })))
      setMusicArtistImages((prev) => [...prev, ...nextImages].slice(0, 12))
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Khong the doc anh nghe si')
    }
  }, [])

  const handleMusicLocationFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setError('Anh location chi ho tro file anh')
      return
    }

    try {
      const nextImages = await Promise.all(imageFiles.map(async (file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        dataUrl: await resizeImage(await readFileAsDataUrl(file)),
      })))
      setMusicLocationImages((prev) => [...prev, ...nextImages].slice(0, 12))
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Khong the doc anh location')
    }
  }, [])

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
    if (result || seoResult || voiceoverResult || tiktokAnalysisResult) return
    if (activeTab === 'history') return
    if (workHistoryLoading || workHistory.length > 0 || workHistoryError.trim().length > 0) {
      setActiveTab('history')
    }
  }, [activeTab, result, seoResult, tiktokAnalysisResult, voiceoverResult, workHistory.length, workHistoryError, workHistoryLoading])

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
    const promptPackage = getPromptPackageFromMetadata(metadata)
    const promptPackageRecord = toHistoryRecord(promptPackage) || {}
    const packageKeyframeCount = Array.isArray(promptPackageRecord.keyframes)
      ? promptPackageRecord.keyframes.length
      : 0
    const packageSceneCount = Array.isArray(promptPackageRecord.scenes)
      ? promptPackageRecord.scenes.length
      : 0
    const packageLookbookPromptCount = Array.isArray(promptPackageRecord.lookbookImagePrompts)
      ? promptPackageRecord.lookbookImagePrompts.length
      : 0
    const contentTypeFromItem = normalizeHistoryContentType(item.contentType, 'ootd')
    const resolvedFromItem = normalizeHistoryResolvedContentType(item.contentType, 'outfitideas')
    const restoredInputType = normalizeHistoryContentType(metadata.inputContentType, contentTypeFromItem)
    const restoredResolvedType = normalizeHistoryResolvedContentType(metadata.resolvedContentType, resolvedFromItem)
    const keyframeCount = toHistoryInteger(metadata.keyframeCount, packageKeyframeCount)
    const sceneCount = toHistoryInteger(metadata.sceneCount, packageSceneCount)
    const inferredGenerationModeFallback: GenerationMode = keyframeCount === 0 && sceneCount === 0
      ? 'lookbook_image'
      : 'video_prompt'
    const restoredGenerationMode = normalizeHistoryGenerationMode(
      metadata.generationMode,
      inferredGenerationModeFallback,
    )
    const inferredDuration = inferDurationFromPromptCounts(keyframeCount, sceneCount)
    const restoredDuration = normalizeHistoryDuration(metadata.duration, inferredDuration)
    const restoredAspectRatio = normalizeHistoryAspectRatio(metadata.aspectRatio, '9:16')
    const restoredLookbookImageCount = normalizeLookbookImageCount(
      metadata.lookbookImageCount,
      coerceLookbookImageCountFromLength(packageLookbookPromptCount),
    )
    const restoredLookbookStyleTone = normalizeLookbookStyleTone(metadata.lookbookStyleTone, 'standard')
    const restoredLookbookTheme = normalizeLookbookTheme(metadata.lookbookTheme, 'auto')
    const restoredVideoPoseDirectionLock = normalizeLookbookPoseDirectionLock(
      metadata.videoPoseDirectionLock ?? metadata.lookbookPoseDirectionLock,
      'auto',
    )
    const restoredStoryboardEngine = normalizeStoryboardVideoEngine(metadata.storyboardEngine, 'veo_3_1')
    const restoredStoryboardTemplate = normalizeStoryboardTemplate(metadata.storyboardTemplate, 'product_launch')

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

      setGenerationMode(restoredGenerationMode)
      setLookbookImageCount(restoredLookbookImageCount)
      setLookbookStyleTone(restoredLookbookStyleTone)
      setLookbookTheme(restoredLookbookTheme)
      setStoryboardEngine(restoredStoryboardEngine)
      setStoryboardTemplate(restoredStoryboardTemplate)
      setVideoPoseDirectionLock(restoredVideoPoseDirectionLock)
      setDuration(restoredDuration)
      setAspectRatio(restoredAspectRatio)
      setNotes(item.notes || '')
      setContentType(restoredInputType)
      setIsContentTypeManuallyLocked(restoredInputType !== 'auto')
      setSelectedContentType(restoredResolvedType)
      setResult(restoredPrompt)
      setSeoResult(null)
      setVoiceoverResult(null)
      setSelectedSeoVariantIndex(0)
      setActiveTab(restoredPrompt.keyframes.length > 0 && restoredPrompt.scenes.length > 0 ? 'keyframes' : 'image')
      setPromptToast({
        kind: 'success',
        message: 'Da mo lai Prompt Package tu lich su.',
      })
      return
    }

    if (item.action === 'seo') {
      const restoredSeo = buildSeoResultFromHistoryItem(item)

      setContentType(restoredInputType)
      setIsContentTypeManuallyLocked(restoredInputType !== 'auto')
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
      setIsContentTypeManuallyLocked(restoredInputType !== 'auto')
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
  const isMusicTemplateMode = generationMode === 'music_video' || isMusicVideoTemplatePage
  const isStoryboardTemplateMode = !isMusicTemplateMode && (generationMode === 'storyboard_video' || isStoryboardTemplatePage)
  const activeInputScope = isMusicTemplateMode
    ? 'music'
    : isStoryboardTemplateMode
      ? 'storyboard'
      : 'core'
  const activeFaceImage = isMusicTemplateMode
    ? musicFaceImage
    : isStoryboardTemplateMode
      ? storyboardFaceImage
      : faceImage
  const activeProductImage = isMusicTemplateMode
    ? musicProductImage
    : isStoryboardTemplateMode
      ? storyboardProductImage
      : productImage
  const activeBackgroundImage = isMusicTemplateMode
    ? musicBackgroundImage
    : isStoryboardTemplateMode
      ? storyboardBackgroundImage
      : backgroundImage
  const setActiveFaceImage = isMusicTemplateMode
    ? setMusicFaceImage
    : isStoryboardTemplateMode
      ? setStoryboardFaceImage
      : setFaceImage
  const setActiveProductImage = isMusicTemplateMode
    ? setMusicProductImage
    : isStoryboardTemplateMode
      ? setStoryboardProductImage
      : setProductImage
  const setActiveBackgroundImage = isMusicTemplateMode
    ? setMusicBackgroundImage
    : isStoryboardTemplateMode
      ? setStoryboardBackgroundImage
      : setBackgroundImage
  const activeFacePasteTarget = isMusicTemplateMode
    ? 'music_face'
    : isStoryboardTemplateMode
      ? 'storyboard_face'
      : 'face'
  const activeProductPasteTarget = isMusicTemplateMode
    ? 'music_product'
    : isStoryboardTemplateMode
      ? 'storyboard_product'
      : 'product'
  const activeBackgroundPasteTarget = isMusicTemplateMode
    ? 'music_background'
    : isStoryboardTemplateMode
      ? 'storyboard_background'
      : 'background'
  const activeImageInputTitle = isMusicTemplateMode
    ? 'Ảnh đầu vào Music Video'
    : isStoryboardTemplateMode
      ? 'Ảnh đầu vào Storyboard'
      : 'Ảnh đầu vào'
  const activeFaceLabel = isMusicTemplateMode
    ? 'Ảnh nhân vật / ca sĩ chính'
    : isStoryboardTemplateMode
      ? 'Ảnh nhân vật storyboard'
      : 'Ảnh Face Model'
  const activeProductLabel = isMusicTemplateMode
    ? 'Ảnh outfit / character look MV'
    : isStoryboardTemplateMode
      ? 'Ảnh sản phẩm / outfit storyboard'
      : 'Ảnh Sản phẩm (Model mặc sản phẩm)'
  const activeBackgroundLabel = isMusicTemplateMode
    ? 'Ảnh bối cảnh MV / mood location'
    : isStoryboardTemplateMode
      ? 'Ảnh bối cảnh storyboard'
      : 'Ảnh Background (Location tham chiếu - tùy chọn)'
  const activeFaceRecentKey = activeInputScope === 'core'
    ? 'aff_recent_local_images_face'
    : `aff_recent_local_images_${activeInputScope}_face`
  const activeProductRecentKey = activeInputScope === 'core'
    ? 'aff_recent_local_images_product'
    : `aff_recent_local_images_${activeInputScope}_product`
  const activeBackgroundRecentKey = activeInputScope === 'core'
    ? 'aff_recent_local_images_background'
    : `aff_recent_local_images_${activeInputScope}_background`
  const storyboardEngineLabel = STORYBOARD_VIDEO_ENGINE_OPTIONS.find((item) => item.value === storyboardEngine)?.label || 'Veo 3.1'
  const storyboardTemplateLabel = STORYBOARD_TEMPLATE_OPTIONS.find((item) => item.value === storyboardTemplate)?.label || 'Product Launch'

  const durationInfo = DURATIONS.find(d => d.value === duration)!
  const hasMusicVideoInputs = Boolean(musicAudioReference)
    && Boolean(musicScriptReference?.text.trim())
    && musicArtistImages.length > 0
  const canGenerate = apiKey.trim().length > 0 && (!isMusicTemplateMode || hasMusicVideoInputs)
  const canGenerateSeo = canGenerate && seoProductName.trim().length > 0
  const canGenerateVoiceover = canGenerate && voiceoverProductName.trim().length > 0
  const hasPromptResult = result !== null
  const hasVideoPromptResult = result !== null && result.keyframes.length > 0 && result.scenes.length > 0
  const resultVideoEngineLabel = result?.storyboardEngineUsed
    ? STORYBOARD_VIDEO_ENGINE_OPTIONS.find((item) => item.value === result.storyboardEngineUsed)?.label || 'Veo 3.1'
    : 'Veo 3.1'
  const currentLookbookPrompts: LookbookImagePrompt[] = (() => {
    if (!result) return []
    if (Array.isArray(result.lookbookImagePrompts) && result.lookbookImagePrompts.length > 0) {
      const fallbackSet = buildLookbookImagePromptSet(
        result.resolvedContentType || selectedContentType,
        notes,
        aspectRatio,
        lookbookImageCount,
        lookbookStyleTone,
        lookbookTheme,
        'auto',
      )

      return result.lookbookImagePrompts.map((item, index) => {
        const fallback = fallbackSet[index % fallbackSet.length] || fallbackSet[0]
        const subject = buildDefaultFrameSubject(aspectRatio)
        const action = item.action?.trim() || fallback?.action || 'Front-facing hero pose with clear outfit readability and realistic posture.'
        const fallbackFacing = fallback?.facingDirection || LOOKBOOK_NANO_BANANA_FACING_SEQUENCE[0]
        const facingDirection = normalizeLookbookFacingDirection(
          item.facingDirection ?? item.action ?? item.prompt,
          fallbackFacing,
        )
        const locationCandidate = item.location?.trim() || fallback?.location || getLockedLocationFallback('flex')
        const location = resolveLockedLocationEntry(locationCandidate) || getLockedLocationFallback('flex', index)
        const camera = item.camera?.trim() || fallback?.camera || 'Fashion editorial camera framing with stable axis, full outfit readability, and realistic proportions.'
        const lighting = item.lighting?.trim() || fallback?.lighting || 'Clean editorial soft lighting prioritizing texture clarity and product detail readability.'
        const style = item.style?.trim() || fallback?.style || 'Classic social-native lookbook editorial with practical styling clarity and trust-first realism.'

        return {
          ...item,
          index,
          subject,
          action,
          facingDirection,
          location,
          camera,
          lighting,
          style,
          prompt: ensureLookbookNanoBananaPrompt(
            item.prompt || '',
            {
              subject,
              action,
              facingDirection,
              location,
              camera,
              lighting,
              style,
            },
            aspectRatio,
          ),
        }
      })
    }
    if (result.createImagePrompt && result.createImagePrompt.trim().length > 0) {
      if (!hasVideoPromptResult) {
        const fallbackSet = buildLookbookImagePromptSet(
          result.resolvedContentType || selectedContentType,
          notes,
          aspectRatio,
          lookbookImageCount,
          lookbookStyleTone,
          lookbookTheme,
          'auto',
        )
        fallbackSet[0] = {
          ...fallbackSet[0],
          prompt: ensureLookbookNanoBananaPrompt(
            ensureLookbookAspectRatioTag(result.createImagePrompt, aspectRatio),
            {
              subject: fallbackSet[0].subject || buildDefaultFrameSubject(aspectRatio),
              action: fallbackSet[0].action || 'Front-facing hero pose with clear outfit readability and realistic posture.',
              facingDirection: fallbackSet[0].facingDirection || LOOKBOOK_NANO_BANANA_FACING_SEQUENCE[0],
              location: fallbackSet[0].location || getLockedLocationFallback('flex'),
              camera: fallbackSet[0].camera || 'Fashion editorial camera framing, stable axis, realistic proportions.',
              lighting: fallbackSet[0].lighting || 'Clean editorial soft lighting with texture clarity.',
              style: fallbackSet[0].style || 'Social-native lookbook editorial style, trust-first realism.',
            },
            aspectRatio,
          ),
        }
        return fallbackSet
      }

      return [{
        index: 0,
        title: hasVideoPromptResult ? 'Create Product Image Prompt' : 'Lookbook Hero Frame',
        purpose: hasVideoPromptResult ? 'Reference still image for video pipeline' : 'Primary hero frame for the lookbook set',
        prompt: result.createImagePrompt,
      }]
    }
    return []
  })()
  const hasSeoResult = seoResult !== null
  const hasVoiceoverResult = voiceoverResult !== null
  const hasAnyResult = hasPromptResult || hasSeoResult || hasVoiceoverResult
  const hasWorkHistory = workHistory.length > 0
  const hasHistoryPanelData = hasWorkHistory || workHistoryLoading || workHistoryError.trim().length > 0
  const hasResultsPanelContent = hasAnyResult || hasHistoryPanelData
  const activeWorkHistoryFilters = historyActionFilter !== 'all' || historySearchQuery.length > 0
  const historyShownCount = workHistory.length
  const applyManualContentType = useCallback((nextType: ContentType) => {
    setContentType(nextType)
    setIsContentTypeManuallyLocked(nextType !== 'auto')
  }, [])
  const applyProductCategory = useCallback((nextCategory: ProductCategory) => {
    setProductCategory(nextCategory)

    const matchedCategory = PRODUCT_CATEGORY_OPTIONS.find((item) => item.value === nextCategory)
    const primarySuggestedType = matchedCategory?.suggestedTypes[0]
    const shouldAutoApplyType = autoApplyCategoryType
      && Boolean(primarySuggestedType)
      && (!isContentTypeManuallyLocked || contentType === 'auto')

    if (shouldAutoApplyType && primarySuggestedType) {
      setContentType(primarySuggestedType)
      setIsContentTypeManuallyLocked(false)
    }
  }, [autoApplyCategoryType, contentType, isContentTypeManuallyLocked])
  const applyProductCategoryGroup = useCallback((nextGroup: ProductCategoryGroup) => {
    setProductCategoryGroup(nextGroup)

    const optionsInGroup = nextGroup === 'all'
      ? PRODUCT_CATEGORY_OPTIONS
      : PRODUCT_CATEGORY_OPTIONS.filter((item) => item.group === nextGroup)

    if (!optionsInGroup.some((item) => item.value === productCategory)) {
      const fallbackCategory = optionsInGroup[0]?.value || 'auto'
      applyProductCategory(fallbackCategory)
    }
  }, [applyProductCategory, productCategory])
  const activeProductCategoryGroupOption = PRODUCT_CATEGORY_GROUP_OPTIONS.find((item) => item.value === productCategoryGroup)
    || PRODUCT_CATEGORY_GROUP_OPTIONS[0]
  const visibleProductCategoryOptions = productCategoryGroup === 'all'
    ? PRODUCT_CATEGORY_OPTIONS
    : PRODUCT_CATEGORY_OPTIONS.filter((item) => item.group === productCategoryGroup)
  const activeProductCategoryOption = visibleProductCategoryOptions.find((item) => item.value === productCategory)
    || PRODUCT_CATEGORY_OPTIONS.find((item) => item.value === productCategory)
    || visibleProductCategoryOptions[0]
    || PRODUCT_CATEGORY_OPTIONS[0]
  const activeProductCategorySuggestedLabels = activeProductCategoryOption.suggestedTypes
    .map((typeValue) => CONTENT_TYPES.find((item) => item.value === typeValue)?.label || typeValue.toUpperCase())
    .join(' / ')
  const isCurrentContentTypeAlignedWithCategory = contentType !== 'auto'
    && activeProductCategoryOption.suggestedTypes.includes(contentType as ResolvedContentType)
  const lookbookStyleToneLabel = lookbookStyleTone === 'sexy' ? 'Sexy' : 'Classic'
  const lookbookThemeLabel = getLookbookThemeOption(lookbookTheme).label

  const videoPoseDirectionLockLabel = LOOKBOOK_POSE_DIRECTION_LOCK_OPTIONS.find((item) => item.value === videoPoseDirectionLock)?.label || 'Auto'
  const isMirrorPhoneTemplateScenario = activeOotdTemplateScenario.cameraFormat === 'mirror_phone'
  const isCozyTemplateScenario = activeOotdTemplateScenario.id === 'cozy_home_background'
  const isFreeStyleProductReviewTemplateScenario = activeOotdTemplateScenario.id === 'free_style_product_review'
  const ootdTemplateDirectionLockLabel = isMirrorPhoneTemplateScenario
    ? 'Face FRONT + Body FRONT/3/4 LEFT/3/4 RIGHT only (no BACK)'
    : isCozyTemplateScenario
      ? 'Face FRONT toward camera + Body FRONT/3/4 LEFT/3/4 RIGHT only (no BACK); keep framing stable.'
      : isFreeStyleProductReviewTemplateScenario
        ? 'Free style: every adjacent KF pair must use different directions and a visible turn/pivot; core remains fashion product review.'
        : 'Allow FRONT/3/4 with one short BACK-reveal beat; return to FRONT/3/4 for closing while keeping framing stable.'
  const ootdTemplateVoiceTrackLabel = isMirrorPhoneTemplateScenario
    ? 'OFF (visual-only mirror phone fit-check)'
    : 'OFF (visual-only front-camera outfit presentation)'
  const ootdTemplateBackgroundLockLabel = isMirrorPhoneTemplateScenario
    ? (backgroundImage
      ? 'ON (closer mirror framing + full-body + anchor continuity)'
      : 'OFF (them background image de khoa)')
    : (backgroundImage
      ? (isCozyTemplateScenario
        ? 'ON (front-camera set continuity + rear mirror behind model + full-body readability + anchor continuity, no aggressive zoom)'
        : 'ON (front-camera set continuity + full-body-to-medium progression + anchor continuity)')
      : 'OFF (them background image de khoa)')
  const promptPrimaryLabel = isOotdTemplatePage
    ? 'Prompt OOTD Template'
    : generationMode === 'music_video'
      ? 'Music Video'
    : generationMode === 'storyboard_video'
      ? 'Storyboard Video'
    : generationMode === 'lookbook_image'
      ? 'Anh Lookbook'
      : 'Prompt Package'
  const loadingStages = !isOotdTemplatePage && generationMode === 'lookbook_image'
    ? LOOKBOOK_LOADING_STAGES
    : PROMPT_LOADING_STAGES
  const promptStatusKind = loading ? 'loading' : error ? 'error' : hasPromptResult ? 'success' : 'idle'
  const promptLoadingStep = loadingStages[Math.min(loadingStageIndex, loadingStages.length - 1)]
  const promptLoadingProgress = loading ? Math.min(90, 24 + loadingStageIndex * 22) : 100
  const promptFloatingStatus = isOotdTemplatePage
    ? loading
      ? promptLoadingStep
      : error
        ? 'Co loi khi tao prompt OOTD template. Kiem tra thong bao de thu lai.'
        : hasPromptResult
            ? `Prompt OOTD template da san sang (${selectedContentType.toUpperCase()} • ${duration}s • scenario ${activeOotdTemplateScenario.label} • video ${activeOotdTemplateScenario.referenceVideoId}).`
          : canGenerate
            ? `Page nay khoa beat script OOTD theo scenario ${activeOotdTemplateScenario.label}. Ban co the doi duration output, doi anh san pham roi bam Tao Prompt OOTD Template (khong can giong timeline tung giay).`
            : 'Nhap Gemini API Key de bat tinh nang tao noi dung.'
    : loading
      ? promptLoadingStep
      : error
        ? 'Có lỗi khi tạo prompt. Kiểm tra thông báo để thử lại.'
        : hasPromptResult
          ? hasVideoPromptResult
            ? generationMode === 'music_video'
              ? `Music Video storyboard da san sang (${duration}s • ${storyboardEngineLabel} • ${selectedContentType.toUpperCase()}).`
              : `Prompt package da san sang (${selectedContentType.toUpperCase()} • ${FIXED_STRATEGY_LABEL} • pose ${videoPoseDirectionLockLabel}).`
              : `Prompt anh lookbook da san sang (${currentLookbookPrompts.length} pics • ${lookbookStyleToneLabel} • ${lookbookThemeLabel}).`
          : canGenerate
            ? generationMode === 'lookbook_image'
                ? `San sang tao ${lookbookImageCount} prompt anh lookbook (${lookbookStyleToneLabel} • ${lookbookThemeLabel}, khong video).`
              : generationMode === 'music_video'
                ? `San sang tao Music Video storyboard (${durationInfo.keyframes} keyframe + ${durationInfo.scenes} scene, co audio mood).`
              : `San sang tao Prompt Package (${FIXED_STRATEGY_DESC}).`
            : apiKey.trim().length > 0 && isMusicTemplateMode
              ? 'Upload file nhac, file kich ban va it nhat 1 anh nghe si de tao Music Video.'
              : 'Nhap Gemini API Key de bat tinh nang tao noi dung.'
  const selectedSeoVariant = seoResult
    ? seoResult.seoVariants[Math.min(selectedSeoVariantIndex, seoResult.seoVariants.length - 1)]
    : null
  const resultsHeader = activeTab === 'history'
    ? 'Lich su da luu (MongoDB)'
    : activeTab === 'tiktokanalysis'
      ? 'Phan tich Video TikTok'
    : isOotdTemplatePage
      ? `OOTD Template Output — ${duration}s / ${OOTD_TEMPLATE_LOCKED_ASPECT_RATIO}`
    : result
      ? hasVideoPromptResult
        ? generationMode === 'music_video'
          ? `Music Video Output — ${duration}s / ${aspectRatio}`
          : generationMode === 'storyboard_video'
            ? `Storyboard Output — ${duration}s / ${aspectRatio}`
            : `Prompt Package — ${duration}s / ${aspectRatio}`
        : `Lookbook Image Prompts — ${currentLookbookPrompts.length} pics / ${aspectRatio}`
      : activeTab === 'voiceover'
        ? 'Nhiệm vụ 2 — Kịch bản lồng tiếng'
        : 'Nhiệm vụ 1 — SEO TikTok'

  // Generate handler
  const handleGenerate = async () => {
    const MAX_ATTEMPTS = 3
    const isLookbookImageMode = generationMode === 'lookbook_image'
    const isMusicVideoMode = generationMode === 'music_video' || isMusicVideoTemplatePage
    const isStoryboardVideoMode = generationMode === 'storyboard_video' || isStoryboardTemplatePage || isMusicVideoMode
    const activeStoryboardTemplate = isMusicVideoMode ? 'cinematic_story' : storyboardTemplate
    const activeStoryboardTemplateLabel = isMusicVideoMode ? 'Music Video Story' : storyboardTemplateLabel
    setLoading(true)
    setSelectedHistoryId(null)
    setLoadingStageIndex(0)
    setPromptToast({
      kind: 'loading',
      message: isStoryboardVideoMode
        ? isMusicVideoMode
          ? `Dang tao Music Video storyboard cho ${storyboardEngineLabel}, vui long cho trong giay lat...`
          : `Dang tao storyboard cho ${storyboardEngineLabel}, vui long cho trong giay lat...`
        : isLookbookImageMode
          ? 'Dang tao prompt anh lookbook, vui long cho trong giay lat...'
          : 'Dang tao Prompt Package, vui long cho trong giay lat...',
    })
    setError('')
    setResult(null)
    setErrorLogLines([])

    const logLines: string[] = []
    const pushLog = (line: string) => { logLines.push(line) }

    pushLog(`[START] ${new Date().toISOString()} — mode=${generationMode} model=${model} duration=${duration}s ratio=${aspectRatio} type=${contentType}`)

    try {
      if (!apiKey.trim()) {
        throw new Error('Vui long nhap Gemini API Key de AI phan tich anh va tao boi canh')
      }

      if (isMusicVideoMode) {
        if (!musicAudioReference) {
          throw new Error('Vui long upload file nhac cho Music Video')
        }
        if (!musicScriptReference || musicScriptReference.text.trim().length === 0) {
          throw new Error('Vui long upload file kich ban CSV/TXT cho Music Video')
        }
        if (musicArtistImages.length === 0) {
          throw new Error('Vui long upload it nhat 1 anh nghe si/nhan vat cho Music Video')
        }

        pushLog(`[MODE] music_video engine=${storyboardEngine} script=${musicScriptReference.name} audio=${musicAudioReference.name} artists=${musicArtistImages.length} locations=${musicLocationImages.length}`)
        const generated = await generateMusicVideoWithGemini(
          apiKey,
          model,
          musicAudioReference,
          musicScriptReference,
          musicArtistImages,
          musicLocationImages,
          duration,
          aspectRatio,
          notes,
          storyboardEngine,
        )

        setResult(generated)
        setSelectedContentType(generated.resolvedContentType || 'fyp')
        setActiveTab('keyframes')
        setPromptToast({
          kind: 'success',
          message: `Da tao xong Music Video storyboard ${duration}s tu ${musicScriptReference.name} va ${musicAudioReference.name}.`,
        })

        const workHistoryGeneratedAt = Date.now()
        const promptPackageForHistory = {
          masterDNA: generated.masterDNA,
          createImagePrompt: generated.createImagePrompt || '',
          musicVideoPromptMarkdown: generated.musicVideoPromptMarkdown || '',
          keyframes: generated.keyframes.map((keyframe) => ({
            index: keyframe.index,
            timestamp: keyframe.timestamp,
            subject: keyframe.subject,
            action: keyframe.action,
            facingDirection: keyframe.facingDirection || '',
            location: keyframe.location,
            camera: keyframe.camera,
            lighting: keyframe.lighting,
            style: keyframe.style,
            fullPrompt: keyframe.fullPrompt,
          })),
          scenes: generated.scenes.map((scene) => ({
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

        pushLog(`[OK] Music video generated successfully keyframes=${generated.keyframes.length} scenes=${generated.scenes.length}`)
        setErrorLogLines([...logLines])

        void persistWorkHistory({
          action: 'prompt',
          model,
          contentType: generated.resolvedContentType || 'fyp',
          notes: notes.trim(),
          generatedAt: workHistoryGeneratedAt,
          metadata: {
            generationMode: 'music_video',
            storyboardEngine,
            storyboardTemplate: 'cinematic_story',
            inputContentType: contentType,
            resolvedContentType: generated.resolvedContentType || 'fyp',
            duration,
            aspectRatio,
            keyframeCount: generated.keyframes.length,
            sceneCount: generated.scenes.length,
            musicAudioName: musicAudioReference.name,
            musicAudioDurationSec: musicAudioReference.durationSec,
            musicScriptName: musicScriptReference.name,
            musicArtistImageCount: musicArtistImages.length,
            musicLocationImageCount: musicLocationImages.length,
            generatedLocations: generated.keyframes.map((keyframe) => keyframe.location).filter(Boolean).slice(0, 10),
            musicVideoPromptMarkdown: generated.musicVideoPromptMarkdown || '',
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

        return
      }

      if (isStoryboardVideoMode) {
        pushLog(`[MODE] ${generationMode} engine=${storyboardEngine} template=${activeStoryboardTemplate}`)
        const generated = await generateStoryboardVideoWithGemini(
          apiKey,
          model,
          activeFaceImage,
          activeProductImage,
          activeBackgroundImage,
          duration,
          aspectRatio,
          isMusicVideoMode ? buildMusicVideoModeNotes(notes) : notes,
          contentType,
          storyboardEngine,
          activeStoryboardTemplate,
          productCategory,
        )

        setResult(generated)
        setSelectedContentType(generated.resolvedContentType || (contentType === 'auto' ? 'outfitideas' : contentType as ResolvedContentType))
        setActiveTab('keyframes')
        setPromptToast({
          kind: 'success',
          message: isMusicVideoMode
            ? `Da tao xong Music Video storyboard ${duration}s cho ${storyboardEngineLabel}. Ban co the copy keyframe/scene prompt de dung voi audio.`
            : `Da tao xong storyboard ${duration}s cho ${storyboardEngineLabel}. Ban co the copy keyframe/scene prompt de dua vao ${storyboardEngineLabel}.`,
        })

        const workHistoryGeneratedAt = Date.now()
        const promptPackageForHistory = {
          masterDNA: generated.masterDNA,
          createImagePrompt: generated.createImagePrompt || '',
          keyframes: generated.keyframes.map((keyframe) => ({
            index: keyframe.index,
            timestamp: keyframe.timestamp,
            subject: keyframe.subject,
            action: keyframe.action,
            facingDirection: keyframe.facingDirection || '',
            location: keyframe.location,
            camera: keyframe.camera,
            lighting: keyframe.lighting,
            style: keyframe.style,
            fullPrompt: keyframe.fullPrompt,
          })),
          scenes: generated.scenes.map((scene) => ({
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

        pushLog(`[OK] Storyboard video generated successfully keyframes=${generated.keyframes.length} scenes=${generated.scenes.length}`)
        setErrorLogLines([...logLines])

        void persistWorkHistory({
          action: 'prompt',
          model,
          contentType: generated.resolvedContentType || (contentType === 'auto' ? 'outfitideas' : contentType as ResolvedContentType),
          notes: notes.trim(),
          generatedAt: workHistoryGeneratedAt,
          metadata: {
            generationMode,
            storyboardEngine,
            storyboardTemplate: activeStoryboardTemplate,
            storyboardTemplateLabel: activeStoryboardTemplateLabel,
            inputContentType: contentType,
            resolvedContentType: generated.resolvedContentType || (contentType === 'auto' ? 'outfitideas' : contentType as ResolvedContentType),
            duration,
            aspectRatio,
            keyframeCount: generated.keyframes.length,
            sceneCount: generated.scenes.length,
            generatedLocations: generated.keyframes.map((keyframe) => keyframe.location).filter(Boolean).slice(0, 10),
            hasFaceImage: Boolean(activeFaceImage),
            hasProductImage: Boolean(activeProductImage),
            hasBackgroundImage: Boolean(activeBackgroundImage),
            imageInputScope: activeInputScope,
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

        return
      }

      if (isLookbookImageMode) {
        pushLog('[MODE] lookbook_image')
        const generated = await generateLookbookImagePromptWithGemini(
          apiKey,
          model,
          faceImage,
          productImage,
          backgroundImage,
          aspectRatio,
          notes,
          lookbookImageCount,
          lookbookStyleTone,
          lookbookTheme,
          'auto',
          contentType,
        )

        const lookbookResult: GenerateResult = {
          masterDNA: generated.masterDNA,
          keyframes: [],
          scenes: [],
          createImagePrompt: generated.lookbookImagePrompts[0]?.prompt || '',
          lookbookImagePrompts: generated.lookbookImagePrompts,
          resolvedContentType: generated.resolvedContentType,
          affiliateModeUsed: FIXED_AFFILIATE_MODE,
          salesTemplateUsed: FIXED_SALES_TEMPLATE,
        }

        setResult(lookbookResult)
        setSelectedContentType(generated.resolvedContentType)
        setActiveTab('image')
        setPromptToast({
          kind: 'success',
          message: `Da tao xong ${lookbookResult.lookbookImagePrompts?.length || 0} prompt anh lookbook. Ban co the copy hoac export ngay.`,
        })

        const workHistoryGeneratedAt = Date.now()
        const promptPackageForHistory = {
          masterDNA: lookbookResult.masterDNA,
          createImagePrompt: lookbookResult.createImagePrompt || '',
          lookbookImagePrompts: (lookbookResult.lookbookImagePrompts || []).map((item) => ({
            index: item.index,
            title: item.title,
            purpose: item.purpose,
            subject: item.subject,
            action: item.action,
            facingDirection: item.facingDirection,
            location: item.location,
            camera: item.camera,
            lighting: item.lighting,
            style: item.style,
            prompt: item.prompt,
          })),
          keyframes: [],
          scenes: [],
        }

        pushLog('[OK] Lookbook image prompt generated successfully')
        setErrorLogLines([...logLines])

        void persistWorkHistory({
          action: 'prompt',
          model,
          contentType: generated.resolvedContentType,
          notes: notes.trim(),
          generatedAt: workHistoryGeneratedAt,
          metadata: {
            generationMode,
            inputContentType: contentType,
            resolvedContentType: generated.resolvedContentType,
            duration,
            aspectRatio,
            keyframeCount: 0,
            sceneCount: 0,
            lookbookImageCount: lookbookResult.lookbookImagePrompts?.length || 0,
            lookbookStyleTone,
            lookbookTheme,
            generatedLocations: [],
            hasFaceImage: Boolean(faceImage),
            hasProductImage: Boolean(productImage),
            hasBackgroundImage: Boolean(backgroundImage),
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

        return
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
            backgroundImage,
            duration,
            aspectRatio,
            notes,
            contentType,
            usedLocationsForProduct,
            outfitTypeLocationHistory,
            FIXED_AFFILIATE_MODE,
            FIXED_SALES_TEMPLATE,
            videoPoseDirectionLock,
            productCategory,
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
              facingDirection: keyframe.facingDirection || '',
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
              generationMode,
              inputContentType: contentType,
              resolvedContentType: resolvedType,
              duration,
              aspectRatio,
              videoPoseDirectionLock,
              lookbookStyleTone,
              lookbookTheme,
              keyframeCount: res.keyframes.length,
              sceneCount: res.scenes.length,
              generatedLocations: generatedLocations.slice(0, 10),
              hasFaceImage: Boolean(faceImage),
              hasProductImage: Boolean(productImage),
              hasBackgroundImage: Boolean(backgroundImage),
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

  const handleGeneratePromptFromTikTokAnalysis = async () => {
    const MAX_ATTEMPTS = 3

    if (!tiktokAnalysisResult) {
      setTiktokAnalysisError('Chua co ket qua phan tich TikTok de tao prompt package.')
      return
    }

    if (!apiKey.trim()) {
      setTiktokAnalysisError('Vui long nhap Gemini API Key truoc khi tao prompt package.')
      return
    }

    const fallbackContentType: ContentType = contentType === 'auto' ? 'tiktokshop' : contentType
    const analysisContentType = resolveTikTokAnalysisContentType(
      tiktokAnalysisResult.detectedContentType,
      fallbackContentType,
    )
    const analysisDuration = resolveTikTokAnalysisDuration(tiktokAnalysisResult.detectedDurationSec, duration)
    const reviewProductNotes = tiktokAnalysisNotes.trim().length > 0
      ? tiktokAnalysisNotes.trim()
      : 'San pham can review duoc xac dinh tu input hien tai.'

    setGenerationMode('video_prompt')
    setDuration(analysisDuration)
    setContentType(analysisContentType)
    setIsContentTypeManuallyLocked(analysisContentType !== 'auto')

    setLoading(true)
    setSelectedHistoryId(null)
    setLoadingStageIndex(0)
    setPromptToast({
      kind: 'loading',
      message: 'Dang tao Prompt Package tu phan tich TikTok, vui long cho trong giay lat...',
    })
    setError('')
    setResult(null)
    setErrorLogLines([])

    const logLines: string[] = []
    const pushLog = (line: string) => { logLines.push(line) }

    pushLog(`[START] ${new Date().toISOString()} — source=tiktok-analysis-detached model=${model} duration=${analysisDuration}s ratio=${aspectRatio} type=${analysisContentType}`)

    try {
      const currentProductImageId = productImage ? createProductImageId(productImage) : null

      let lastAttemptError: Error | null = null

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (attempt > 1) {
          pushLog(`[RETRY] Attempt ${attempt}/${MAX_ATTEMPTS} — retrying after failure...`)
          setPromptToast({
            kind: 'loading',
            message: `Thu lai lan ${attempt}/${MAX_ATTEMPTS}...`,
          })
          setLoadingStageIndex(0)
        } else {
          pushLog(`[START] Attempt ${attempt}/${MAX_ATTEMPTS}`)
        }

        try {
          const res = await generatePromptPackageFromTikTokAnalysisWithGemini(
            apiKey,
            model,
            faceImage,
            productImage,
            backgroundImage,
            analysisDuration,
            aspectRatio,
            tiktokAnalysisResult,
            reviewProductNotes,
          )

          pushLog(`[OK] Attempt ${attempt} succeeded — keyframes=${res.keyframes.length} scenes=${res.scenes.length}`)
          setErrorLogLines([...logLines])

          const resolvedType: ResolvedContentType = res.resolvedContentType
            || (analysisContentType === 'auto'
              ? (FIXED_AFFILIATE_MODE === 'strict' ? 'tiktokshop' : 'outfitideas')
              : analysisContentType)

          pushLog('[SCRIPT] Detached analysis script mode active (structure transferred without core-rule forcing)')
          res.createImagePrompt = buildCreateImagePrompt(resolvedType, reviewProductNotes)
          setResult(res)
          setSelectedContentType(resolvedType)
          setActiveTab('keyframes')
          setPromptToast({
            kind: 'success',
            message: `Da tao Prompt Package tu phan tich TikTok${attempt > 1 ? ` (sau ${attempt} lan thu)` : ''}.`,
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
              facingDirection: keyframe.facingDirection || '',
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

          const historyNotes = reviewProductNotes

          void persistWorkHistory({
            action: 'prompt',
            model,
            contentType: resolvedType,
            notes: historyNotes,
            generatedAt: workHistoryGeneratedAt,
            metadata: {
              generationMode: 'video_prompt',
              generationSource: 'tiktok_analysis_detached',
              reviewProductSource: 'tiktok_analysis_notes',
              inputContentType: analysisContentType,
              resolvedContentType: resolvedType,
              duration: analysisDuration,
              aspectRatio,
              videoPoseDirectionLock,
              lookbookStyleTone,
              lookbookTheme,
              keyframeCount: res.keyframes.length,
              sceneCount: res.scenes.length,
              generatedLocations: generatedLocations.slice(0, 10),
              hasFaceImage: Boolean(faceImage),
              hasProductImage: Boolean(productImage),
              hasBackgroundImage: Boolean(backgroundImage),
              tiktokAnalysis: {
                detectedContentType: tiktokAnalysisResult.detectedContentType,
                detectedDurationSec: tiktokAnalysisResult.detectedDurationSec,
                hookStyle: tiktokAnalysisResult.hookStyle,
                narrativeStructure: tiktokAnalysisResult.narrativeStructure,
                ctaStyle: tiktokAnalysisResult.ctaStyle,
                colorGrade: tiktokAnalysisResult.colorGrade,
                pacing: tiktokAnalysisResult.pacing,
                sceneBeatCount: tiktokAnalysisResult.sceneBeats.length,
                contextHintCount: tiktokAnalysisResult.sceneBeats.filter((beat) => beat.contextHint.trim().length > 0).length,
              },
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

          return
        } catch (attemptErr: any) {
          const msg = attemptErr?.message || 'Unknown error'
          pushLog(`✖ [ERROR] Attempt ${attempt} failed: ${msg}`)
          lastAttemptError = attemptErr instanceof Error ? attemptErr : new Error(msg)

          const isRetryable = !msg.toLowerCase().includes('api key')
            && !msg.toLowerCase().includes('quota')
            && !msg.toLowerCase().includes('permission')
            && attempt < MAX_ATTEMPTS

          if (!isRetryable) {
            pushLog('[WARN] Error is not retryable or max attempts reached. Stopping.')
            break
          }
        }
      }

      const finalMsg = lastAttemptError?.message || 'Failed to generate prompts from TikTok analysis'
      pushLog(`[ERROR] All ${MAX_ATTEMPTS} attempts failed. Last error: ${finalMsg}`)
      setErrorLogLines([...logLines])
      setError(finalMsg)
      setPromptToast({
        kind: 'error',
        message: finalMsg,
      })
    } catch (err: any) {
      const message = err?.message || 'Failed to generate prompts from TikTok analysis'
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

  const handleGenerateOotdTemplate = async () => {
    if (!apiKey.trim()) {
      setError('Vui long nhap Gemini API Key de tao prompt OOTD template')
      setPromptToast({
        kind: 'error',
        message: 'Thieu Gemini API Key.',
      })
      return
    }

    const activeTemplateScenario = activeOotdTemplateScenario
    const usesMirrorPhoneTemplate = activeTemplateScenario.cameraFormat === 'mirror_phone'
    const isCozyTemplateScenario = activeTemplateScenario.id === 'cozy_home_background'
    const isRelaxedBoutiqueTemplateScenario = activeTemplateScenario.id === 'relaxed_boutique_camera'
    const isFreeStyleProductReviewTemplateScenario = activeTemplateScenario.id === 'free_style_product_review'
    const lockedDuration = DURATIONS.find((entry) => entry.value === duration)?.value || OOTD_TEMPLATE_LOCKED_DURATION
    const shouldUseRelaxedBoutique32sBackDetailLean = isRelaxedBoutiqueTemplateScenario && lockedDuration === 32
    const shouldEnforceFrontFaceNoBackLock = usesMirrorPhoneTemplate || isCozyTemplateScenario || isRelaxedBoutiqueTemplateScenario
    const shouldEnforceRearMirrorReflection = usesMirrorPhoneTemplate || isCozyTemplateScenario
    const directionRule = shouldEnforceFrontFaceNoBackLock
      ? (usesMirrorPhoneTemplate
        ? 'Direction rule: face must stay FRONT in mirror; body only FRONT, 3/4 LEFT, or 3/4 RIGHT; no BACK body orientation.'
        : (isRelaxedBoutiqueTemplateScenario
          ? (shouldUseRelaxedBoutique32sBackDetailLean
            ? 'Direction rule: non-mirror front-camera fitcheck; face stays mostly FRONT toward camera. In the 32s option, include exactly one soft over-shoulder back-detail lean: torso angles slightly to show the garment back/backline while face stays visible toward the front camera; no full or prolonged BACK body orientation.'
            : 'Direction rule: non-mirror front-camera fitcheck; face stays mostly FRONT toward camera, body only FRONT, soft SIDE, 3/4 LEFT, or 3/4 RIGHT; no prolonged BACK body orientation; keep movement relaxed and smooth.')
          : 'Direction rule: face must stay FRONT toward camera; body only FRONT, 3/4 LEFT, or 3/4 RIGHT; no BACK body orientation; keep the camera frame stable.'))
      : 'Direction rule: allow FRONT, 3/4 LEFT, 3/4 RIGHT, and one short BACK reveal beat when the selected scenario requires it; avoid prolonged back-facing hold and return to FRONT/3/4 for closing.'
    const voiceRule = usesMirrorPhoneTemplate
      ? 'Voice rule: no voiceover/dialogue/narration/lip-sync. Keep visual-only mirror phone fit-check storytelling with optional on-screen text only; mouth stays relaxed and closed at rest.'
      : 'Voice rule: no voiceover/dialogue/narration/lip-sync. Keep visual-only front-camera outfit presentation storytelling with optional on-screen text only; mouth stays relaxed and closed at rest.'
    const backgroundAnchorRule = backgroundImage
      ? (usesMirrorPhoneTemplate
        ? 'Background anchor lock: model must stand closer to mirror and perform mirror phone fit-check inside the provided background image, keep full-body head-to-toe framing, make outfit larger in frame (~70-85%), preserve key background anchors, and hold the same venue across beats.'
        : (isCozyTemplateScenario
          ? 'Background anchor lock: model must stand in front of filming camera inside the provided cozy home background, keep full-body head-to-toe framing, preserve key background anchors including rear mirror placement, hold the same venue across beats, and avoid aggressive push-in/zoom behavior.'
          : (isRelaxedBoutiqueTemplateScenario
            ? 'Background anchor lock: model must stand in front of filming camera inside the provided relaxed boutique background, keep bright clear exposure on face/body/product, keep full-body readability, preserve grey wall, arched display niches, shelf line, LED strip, ceiling curve, and wood floor anchors, hold the same venue across beats, and avoid mirror/selfie framing.'
          : 'Background anchor lock: model must stay in front of filming camera inside the provided selected-scenario background, preserve key venue anchors (window frame/citylight/floor line/decor), keep continuity across all beats, and allow only smooth full-body-to-medium push-in progression when needed.')))
      : (usesMirrorPhoneTemplate
        ? 'Background anchor lock: no background image provided, so keep mirror-room continuity in one venue.'
        : (isCozyTemplateScenario
          ? 'Background anchor lock: no background image provided, so keep one cozy home venue continuity with observer-camera framing, rear mirror behind model, and stable full-body composition.'
          : (isRelaxedBoutiqueTemplateScenario
            ? 'Background anchor lock: no background image provided, so keep one bright relaxed boutique venue with clean neutral-grey wall, arched display niches, shelf accents, LED strips, wood floor, stable observer-camera framing, clear product exposure, and no mirror/selfie behavior.'
          : 'Background anchor lock: no background image provided, so keep one selected-scenario venue continuity with observer-camera framing and stable anchor composition.')))
    const rearMirrorReflectionRule = shouldEnforceRearMirrorReflection
      ? 'Rear mirror reflection lock: keep mirror behind model visible as reflection proof across all beats; never show camera/tripod/operator in mirror reflection.'
      : 'Rear mirror reflection lock: inactive.'
    const relaxedBoutique32sBackDetailRule = shouldUseRelaxedBoutique32sBackDetailLean
      ? '32s relaxed boutique pose rule: include exactly one short soft over-shoulder back-detail lean before the close. The torso may angle slightly to reveal the garment back/backline, but the face must stay turned toward the front camera, the frame must stay bright and readable, and the next beat returns to front/three-quarter.'
      : ''
    const freeStyleDirectionRule = isFreeStyleProductReviewTemplateScenario
      ? 'Free Style direction rule: creative actions are allowed, but this is still a fashion product review. Every adjacent keyframe pair must have different facingDirection values and a visible turn/pivot; never let KF start and KF end in a scene share the same body direction.'
      : ''
    const sourceTimingRule = activeTemplateScenario.sourceDurationSec > 0
      ? `Target output duration: ${lockedDuration}s (reference source ${activeTemplateScenario.sourceDurationSec}s). Expand/compress beat timing proportionally without changing beat order.`
      : `Target output duration: ${lockedDuration}s. No source timeline is locked; create freestyle product-review pacing with standalone scene review angles.`
    const ootdSceneIndependenceRule = `Scene structure rule: generate ${DURATIONS.find((entry) => entry.value === lockedDuration)?.scenes || 0} standalone review scenes. Each scene uses its own KF start and KF end pair; do not require action continuity between scenes. Each scene must use a different review angle:
${buildOotdTemplateSceneReviewStylePlan(DURATIONS.find((entry) => entry.value === lockedDuration)?.scenes || 1)}`

    const reviewProductNotes = [
      activeTemplateScenario.productBrief,
      `Product category hint: ${activeProductCategoryOption.label}.`,
      `Detail hint: ${activeProductCategoryOption.detailHint}`,
      isFreeStyleProductReviewTemplateScenario
        ? 'No reference video is used. Create original freestyle actions while keeping product-review intent primary.'
        : 'Ignore all non-product visual identity from the reference video. Keep only pacing and scene progression.',
      isFreeStyleProductReviewTemplateScenario
        ? 'Timeline rule: freestyle pacing is allowed, but every scene must remain a standalone product-review clip with distinct review angle.'
        : 'Timeline rule: keep the same beat order as reference, but adapt timing flexibly for target output duration.',
      sourceTimingRule,
      directionRule,
      relaxedBoutique32sBackDetailRule,
      freeStyleDirectionRule,
      ootdSceneIndependenceRule,
      'Action + scene writing rule: concise visual description only, no beat labels, no speaking/lip cues.',
      'Performance rule: fit-check only. Keep mouth relaxed and closed at rest, jaw stable, no speech-like head nods, no talking-presenter behavior, and no camera-facing monologue.',
      voiceRule,
      backgroundAnchorRule,
      rearMirrorReflectionRule,
    ].join('\n')

    const lockedAspectRatio = OOTD_TEMPLATE_LOCKED_ASPECT_RATIO
    const lockedContentType = activeTemplateScenario.lockedContentType
    const currentProductImageId = productImage ? createProductImageId(productImage) : null

    setGenerationMode('video_prompt')
    setDuration(lockedDuration)
    setAspectRatio(lockedAspectRatio)
    setContentType(lockedContentType)
    setIsContentTypeManuallyLocked(true)
    setVideoPoseDirectionLock('auto')

    setLoading(true)
    setSelectedHistoryId(null)
    setLoadingStageIndex(0)
    setPromptToast({
      kind: 'loading',
      message: `Dang tao Prompt OOTD Template theo scenario ${activeTemplateScenario.label}...`,
    })
    setError('')
    setResult(null)
    setErrorLogLines([])

    const logLines: string[] = []
    const pushLog = (line: string) => { logLines.push(line) }

    pushLog(`[START] ${new Date().toISOString()} — source=ootd-template-lock scenario=${activeTemplateScenario.id} refVideo=${activeTemplateScenario.referenceVideoId} model=${model} duration=${lockedDuration}s ratio=${lockedAspectRatio} type=${lockedContentType}`)

    try {
      const res = await generatePromptPackageFromTikTokAnalysisWithGemini(
        apiKey,
        model,
        faceImage,
        productImage,
        backgroundImage,
        lockedDuration,
        lockedAspectRatio,
        activeTemplateScenario.lockedAnalysis,
        reviewProductNotes,
        {
          enforceFrontFaceQuarterBodyLock: shouldEnforceFrontFaceNoBackLock,
          enforceConciseVisualOnlyAction: true,
          templateCameraFormat: activeTemplateScenario.cameraFormat,
          enforceRearMirrorReflection: shouldEnforceRearMirrorReflection,
          templateScenarioId: activeTemplateScenario.id,
        },
      )

      pushLog(`[OK] Template generation succeeded — keyframes=${res.keyframes.length} scenes=${res.scenes.length}`)
      setErrorLogLines([...logLines])

      const resolvedType: ResolvedContentType = res.resolvedContentType || lockedContentType
      res.createImagePrompt = buildCreateImagePrompt(resolvedType, reviewProductNotes)

      setResult(res)
      setSelectedContentType(resolvedType)
      setActiveTab('keyframes')
      setPromptToast({
        kind: 'success',
        message: `Da tao xong Prompt OOTD Template (${activeTemplateScenario.label}). Ban chi can doi outfit va tao lai khi can.`,
      })

      const generatedLocations = Array.from(
        new Set(
          res.keyframes
            .map((keyframe) => keyframe.location.trim())
            .filter((location) => location.length > 0)
        )
      )

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

      const promptPackageForHistory = {
        masterDNA: res.masterDNA,
        createImagePrompt: res.createImagePrompt || '',
        keyframes: res.keyframes.map((keyframe) => ({
          index: keyframe.index,
          timestamp: keyframe.timestamp,
          subject: keyframe.subject,
          action: keyframe.action,
          facingDirection: keyframe.facingDirection || '',
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

      void persistWorkHistory({
        action: 'prompt',
        model,
        contentType: resolvedType,
        notes: reviewProductNotes,
        generatedAt: Date.now(),
        metadata: {
          generationMode: 'video_prompt',
          generationSource: `ootd_template_${activeTemplateScenario.referenceVideoId}`,
          inputContentType: lockedContentType,
          resolvedContentType: resolvedType,
          duration: lockedDuration,
          sourceDurationSec: activeTemplateScenario.sourceDurationSec,
          aspectRatio: lockedAspectRatio,
          keyframeCount: res.keyframes.length,
          sceneCount: res.scenes.length,
          generatedLocations: generatedLocations.slice(0, 10),
          hasFaceImage: Boolean(faceImage),
          hasProductImage: Boolean(productImage),
          hasBackgroundImage: Boolean(backgroundImage),
          templateScenarioId: activeTemplateScenario.id,
          templateScenarioLabel: activeTemplateScenario.label,
          templateReferenceVideo: activeTemplateScenario.referenceVideoFileName,
          templateNarrativeStructure: activeTemplateScenario.lockedAnalysis.narrativeStructure,
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
    } catch (err: any) {
      const message = err?.message || 'Failed to generate OOTD template prompt package'
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
      const resultHasVideoFlow = result.keyframes.length > 0 && result.scenes.length > 0

      if (result.musicVideoPromptMarkdown) {
        lines.push('', result.musicVideoPromptMarkdown)
      } else if (resultHasVideoFlow) {
        lines.push(
          '',
          '── VIDEO PROMPT PACKAGE ──',
          `Duration: ${duration}s | Ratio: ${aspectRatio}`,
          `Resolved Type: ${selectedContentType.toUpperCase()}`,
          `Pose Direction Lock: ${videoPoseDirectionLockLabel}`,
          `Affiliate Mode: ${(result.affiliateModeUsed || FIXED_AFFILIATE_MODE).toUpperCase()}`,
          `Sales Template: ${(result.salesTemplateUsed || FIXED_SALES_TEMPLATE).toUpperCase()}`,
          '',
          '── CHARACTER DNA ──',
          result.masterDNA,
          '',
          '── KEYFRAME IMAGE PROMPTS ──',
          ...result.keyframes.map(kf => `\n${kf.fullPrompt}`),
          '',
          `── SCENE PROMPTS (${resultVideoEngineLabel}) ──`,
          ...result.scenes.map(sc => `\n${sc.fullPrompt}`),
          ...(result.createImagePrompt
            ? ['', '── CREATE IMAGE PROMPT ──', result.createImagePrompt]
            : []),
        )
      } else {
        lines.push(
          '',
          '── LOOKBOOK IMAGE PROMPT ──',
          `Aspect Ratio: ${aspectRatio}`,
          `Resolved Type: ${selectedContentType.toUpperCase()}`,
          `Lookbook Tone: ${lookbookStyleToneLabel}`,
          `Lookbook Theme: ${lookbookThemeLabel}`,
          '',
          '── CHARACTER DNA ──',
          result.masterDNA,
        )

        const lookbookPrompts = result.lookbookImagePrompts && result.lookbookImagePrompts.length > 0
          ? result.lookbookImagePrompts
          : (result.createImagePrompt
            ? [{ index: 0, title: 'Lookbook Hero Frame', purpose: 'Primary hero frame', prompt: result.createImagePrompt }]
            : [])

        for (const prompt of lookbookPrompts) {
          lines.push(
            '',
            `LOOKBOOK IMAGE ${prompt.index + 1}: ${prompt.title}`,
            prompt.prompt,
          )
        }
      }
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
      const resultHasVideoFlow = result.keyframes.length > 0 && result.scenes.length > 0

      if (result.musicVideoPromptMarkdown) {
        lines.push(result.musicVideoPromptMarkdown)
      } else if (resultHasVideoFlow) {
        lines.push(
          `RESOLVED TYPE: ${selectedContentType.toUpperCase()}`,
          `POSE DIRECTION LOCK: ${videoPoseDirectionLockLabel}`,
          `AFFILIATE MODE: ${(result.affiliateModeUsed || FIXED_AFFILIATE_MODE).toUpperCase()}`,
          `SALES TEMPLATE: ${(result.salesTemplateUsed || FIXED_SALES_TEMPLATE).toUpperCase()}`,
          '',
          'CHARACTER DNA:', result.masterDNA, '',
          'KEYFRAME PROMPTS:', ...result.keyframes.map(kf => appendKeyframeCopySafetyRule(kf.fullPrompt)), '',
          'SCENE PROMPTS:', ...result.scenes.map(sc => sc.fullPrompt),
          ...(result.createImagePrompt ? ['', 'CREATE IMAGE PROMPT:', result.createImagePrompt] : []),
        )
      } else {
        const lookbookPrompts = result.lookbookImagePrompts && result.lookbookImagePrompts.length > 0
          ? result.lookbookImagePrompts
          : (result.createImagePrompt
            ? [{ index: 0, title: 'Lookbook Hero Frame', purpose: 'Primary hero frame', prompt: result.createImagePrompt }]
            : [])

        lines.push(
          `RESOLVED TYPE: ${selectedContentType.toUpperCase()}`,
          'MODE: LOOKBOOK_IMAGE',
          `LOOKBOOK TONE: ${lookbookStyleToneLabel}`,
          `LOOKBOOK THEME: ${lookbookThemeLabel}`,
          `LOOKBOOK COUNT: ${lookbookPrompts.length}`,
          '',
          'CHARACTER DNA:', result.masterDNA,
        )

        for (const prompt of lookbookPrompts) {
          lines.push(
            '',
            `LOOKBOOK IMAGE ${prompt.index + 1}: ${prompt.title}`,
            prompt.prompt,
          )
        }
      }
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
              <p className="header-subtitle">
                {isPromptLibraryPage
                  ? 'AI Video Editor Intern Prompt Library'
                  : isOotdTemplatePage
                  ? `OOTD Template Page (${activeOotdTemplateScenario.referenceVideoUrl ? `Beat-flow lock theo video ${activeOotdTemplateScenario.referenceVideoFileName}` : activeOotdTemplateScenario.label})`
                  : isMusicVideoTemplatePage
                  ? 'Music Video Template (audio + script + artist/location references)'
                  : isStoryboardTemplatePage
                  ? 'Storyboard Template Page (input rieng, khong dung chung core)'
                  : 'TikTok Affiliate Video Prompt Generator'}
              </p>
            </div>
          </div>
          <div className="header-config">
            <div className="chip-group" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className={`chip ${pageMode === 'core' ? 'active' : ''}`}
                onClick={() => setPageMode('core')}
                id="switch-page-core"
              >
                Core Page
              </button>
              <button
                type="button"
                className={`chip ${pageMode === 'ootd_template' ? 'active' : ''}`}
                onClick={() => setPageMode('ootd_template')}
                id="switch-page-ootd-template"
                style={pageMode === 'ootd_template' ? {
                  borderColor: '#0ea5e9',
                  color: '#0ea5e9',
                  background: 'color-mix(in srgb, #0ea5e9 14%, transparent)',
                } : {}}
              >
                OOTD Template Page
              </button>
              <button
                type="button"
                className={`chip ${pageMode === 'storyboard_template' ? 'active' : ''}`}
                onClick={() => setPageMode('storyboard_template')}
                id="switch-page-storyboard-template"
                style={pageMode === 'storyboard_template' ? {
                  borderColor: 'var(--accent-amber)',
                  color: 'var(--accent-amber)',
                  background: 'color-mix(in srgb, var(--accent-amber) 14%, transparent)',
                } : {}}
              >
                Storyboard Template
              </button>
              <button
                type="button"
                className={`chip ${pageMode === 'music_video_template' ? 'active' : ''}`}
                onClick={() => setPageMode('music_video_template')}
                id="switch-page-music-video-template"
                style={pageMode === 'music_video_template' ? {
                  borderColor: '#ec4899',
                  color: '#ec4899',
                  background: 'color-mix(in srgb, #ec4899 14%, transparent)',
                } : {}}
              >
                Music Video Template
              </button>
              <button
                type="button"
                className={`chip ${pageMode === 'prompt_library' ? 'active' : ''}`}
                onClick={() => setPageMode('prompt_library')}
                id="switch-page-prompt-library"
                style={pageMode === 'prompt_library' ? {
                  borderColor: '#10b981',
                  color: '#10b981',
                  background: 'color-mix(in srgb, #10b981 14%, transparent)',
                } : {}}
              >
                Prompt Library
              </button>
            </div>
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

        {isPromptLibraryPage ? (
          <PromptLibraryPage />
        ) : (
          <>
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

            {isOotdTemplatePage && (
              <div
                className="card"
                style={{
                  marginBottom: 16,
                  borderColor: 'rgba(14, 165, 233, 0.35)',
                  background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.08), rgba(2, 132, 199, 0.04))',
                }}
              >
                <div className="card-title" style={{ color: '#38bdf8' }}>
                  <Film /> OOTD Template Lock ({activeOotdTemplateScenario.label}{activeOotdTemplateScenario.referenceVideoUrl ? ` • ${activeOotdTemplateScenario.referenceVideoFileName}` : ''})
                </div>

                <p className="ai-task-hint" style={{ marginTop: 0, marginBottom: 10 }}>
                  Page nay tach rieng khoi core. Kich ban duoc khoa theo beat flow cua scenario da chon (khong clone timeline tung giay),
                  ban co the doi duration output va thay doi anh san pham (trang phuc) de tao lai prompt. Face image va background image la tuy chon.
                </p>

                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label className="input-label">
                    <Film size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    Kich ban template
                  </label>
                  <div className="chip-group">
                    {OOTD_TEMPLATE_SCENARIOS.map((scenarioOption) => (
                      <button
                        key={`ootd-template-scenario-${scenarioOption.id}`}
                        className={`chip ${ootdTemplateScenarioId === scenarioOption.id ? 'active' : ''}`}
                        onClick={() => setOotdTemplateScenarioId(scenarioOption.id)}
                        id={`ootd-template-scenario-${scenarioOption.id}`}
                      >
                        {scenarioOption.label}
                        <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>
                          {scenarioOption.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label className="input-label">
                    <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    Thoi luong output (linh hoat)
                  </label>
                  <div className="chip-group">
                    {DURATIONS.map((durationOption) => (
                      <button
                        key={`ootd-template-duration-${durationOption.value}`}
                        className={`chip ${duration === durationOption.value ? 'active' : ''}`}
                        onClick={() => setDuration(durationOption.value)}
                        id={`ootd-template-duration-${durationOption.value}`}
                      >
                        {durationOption.label}
                        <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: 4 }}>
                          {durationOption.scenes}sc/{durationOption.keyframes}kf
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {activeOotdTemplateScenario.referenceVideoUrl ? (
                  <video
                    src={activeOotdTemplateScenario.referenceVideoUrl}
                    controls
                    preload="metadata"
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      marginBottom: 12,
                      background: '#020617',
                    }}
                  />
                ) : (
                  <div className="prompt-text" style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                    Free Style Review khong dung video tham chieu. Gemini duoc tu do tao hanh dong, nhung core van la review san pham thoi trang va moi cap KF start/end phai khac huong.
                  </div>
                )}

                <div className="prompt-text" style={{ whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                  <strong>Lock config:</strong>{'\n'}
                  Scenario: {activeOotdTemplateScenario.label} ({activeOotdTemplateScenario.referenceVideoUrl ? `video ${activeOotdTemplateScenario.referenceVideoId}` : 'no reference video'}){'\n'}
                  Duration output: {duration}s (default {OOTD_TEMPLATE_LOCKED_DURATION}s{activeOotdTemplateScenario.sourceDurationSec > 0 ? `; nguon tham chieu ${activeOotdTemplateScenario.sourceDurationSec}s, chi de tham khao nhip` : '; freestyle no reference duration'}){'\n'}
                  Ratio: {OOTD_TEMPLATE_LOCKED_ASPECT_RATIO}{'\n'}
                  Content type: {activeOotdTemplateScenario.lockedContentType.toUpperCase()}{'\n'}
                  Direction lock: {ootdTemplateDirectionLockLabel}{'\n'}
                  Voice track: {ootdTemplateVoiceTrackLabel}{'\n'}
                  Background continuity lock: {ootdTemplateBackgroundLockLabel}{"\n"}
                  Narrative: {activeOotdTemplateScenario.lockedAnalysis.narrativeStructure}
                </div>

                <div className="prompt-text" style={{ whiteSpace: 'pre-wrap' }}>
                  <strong>Beat flow (giu thu tu, timeline linh hoat):</strong>{'\n'}
                  {activeOotdTemplateScenario.lockedAnalysis.sceneBeats
                    .map((beat) => `${beat.timestamp}: ${beat.beatName}`)
                    .join('\n')}
                </div>
              </div>
            )}

            {/* Images */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <Camera /> {isMusicTemplateMode ? 'Input Music Video' : activeImageInputTitle}
              </div>
              {isMusicTemplateMode ? (
                <>
                  <p className="ai-task-hint" style={{ marginTop: 0, marginBottom: 12 }}>
                    Music Video dung input rieng: file nhac, file kich ban CSV/TXT, anh nghe si 1-nhieu, va anh location tuy chon. Khong dung chung anh cua Core Page.
                  </p>

                  <div className="input-group">
                    <label className="input-label">
                      <Music size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      File nhac
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      className="input-field"
                      onChange={(event) => void handleMusicAudioFile(event.target.files?.[0] || null)}
                    />
                    {musicAudioReference && (
                      <p className="ai-task-hint" style={{ marginTop: 8, marginBottom: 0 }}>
                        Da chon: {musicAudioReference.name}
                        {musicAudioReference.durationSec ? ` • ~${musicAudioReference.durationSec.toFixed(1)}s` : ''}
                      </p>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      <FileText size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      File kich ban CSV/TXT
                    </label>
                    <input
                      type="file"
                      accept=".csv,.txt,text/csv,text/plain"
                      className="input-field"
                      onChange={(event) => void handleMusicScriptFile(event.target.files?.[0] || null)}
                    />
                    {musicScriptReference && (
                      <p className="ai-task-hint" style={{ marginTop: 8, marginBottom: 0 }}>
                        Da chon: {musicScriptReference.name} • {musicScriptReference.text.split(/\r?\n/).filter((line) => line.trim().length > 0).length} dong
                      </p>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      <ImageIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Anh nghe si / nhan vat (1 hoac nhieu)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="input-field"
                      onChange={(event) => void handleMusicArtistFiles(event.target.files)}
                    />
                    {musicArtistImages.length > 0 && (
                      <div className="chip-group" style={{ marginTop: 8 }}>
                        {musicArtistImages.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="chip active"
                            onClick={() => setMusicArtistImages((prev) => prev.filter((image) => image.id !== item.id))}
                            title="Click de xoa anh nay"
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">
                      <Layers size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Anh location / mood location (tuy chon)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="input-field"
                      onChange={(event) => void handleMusicLocationFiles(event.target.files)}
                    />
                    {musicLocationImages.length > 0 && (
                      <div className="chip-group" style={{ marginTop: 8 }}>
                        {musicLocationImages.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="chip active"
                            onClick={() => setMusicLocationImages((prev) => prev.filter((image) => image.id !== item.id))}
                            title="Click de xoa anh nay"
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
              {isStoryboardTemplateMode && (
                <p className="ai-task-hint" style={{ marginTop: 0, marginBottom: 12 }}>
                  Bo anh nay tach rieng khoi Core Video Prompt. Chuyen qua mode khac se khong ghi de anh face/product/background cua core page.
                </p>
              )}
              <ImageUploader
                label={activeFaceLabel}
                image={activeFaceImage}
                onImageChange={setActiveFaceImage}
                isPasteTarget={pasteTarget === activeFacePasteTarget}
                onActivatePasteTarget={() => setPasteTarget(activeFacePasteTarget)}
                recentLocalStorageKey={activeFaceRecentKey}
                onLoadError={setError}
                icon={ImageIcon}
              />
              <ImageUploader
                label={activeProductLabel}
                image={activeProductImage}
                onImageChange={setActiveProductImage}
                isPasteTarget={pasteTarget === activeProductPasteTarget}
                onActivatePasteTarget={() => setPasteTarget(activeProductPasteTarget)}
                recentLocalStorageKey={activeProductRecentKey}
                onLoadError={setError}
                icon={Upload}
              />
              <ImageUploader
                label={activeBackgroundLabel}
                image={activeBackgroundImage}
                onImageChange={setActiveBackgroundImage}
                isPasteTarget={pasteTarget === activeBackgroundPasteTarget}
                onActivatePasteTarget={() => setPasteTarget(activeBackgroundPasteTarget)}
                recentLocalStorageKey={activeBackgroundRecentKey}
                onLoadError={setError}
                icon={Layers}
              />
                </>
              )}
            </div>

            {!isOotdTemplatePage && (
              <>
            {/* Generation Mode */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <Wand2 /> Che do tao noi dung
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <div className="chip-group">
                  {GENERATION_MODES.map((modeOption) => {
                    const Icon = modeOption.icon
                    return (
                      <button
                        key={modeOption.value}
                        className={`chip ${generationMode === modeOption.value ? 'active' : ''}`}
                        onClick={() => setGenerationMode(modeOption.value)}
                        id={`generation-mode-${modeOption.value}`}
                        style={generationMode === modeOption.value ? {
                          background: `color-mix(in srgb, ${modeOption.color} 15%, transparent)`,
                          borderColor: modeOption.color,
                          color: modeOption.color,
                        } : {}}
                      >
                        <Icon size={13} style={{ marginRight: 2 }} />
                        {modeOption.label}
                        <span style={{ fontSize: '0.6rem', opacity: 0.7, marginLeft: 4 }}>
                          {modeOption.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Video/Image Config */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <Clapperboard /> {generationMode === 'lookbook_image' ? 'Cau hinh anh Lookbook' : generationMode === 'music_video' ? 'Cau hinh Music Video' : generationMode === 'storyboard_video' ? 'Cau hinh Storyboard Video' : 'Cau hinh Video'}
              </div>

              {generationMode === 'video_prompt' && (
                <>
                  <div className="input-group">
                    <label className="input-label">
                      <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Thoi luong
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

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">
                      <ArrowRight size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Khoa huong pose model (Video)
                    </label>
                    <div className="chip-group">
                      {LOOKBOOK_POSE_DIRECTION_LOCK_OPTIONS.map((poseOption) => (
                        <button
                          key={`video-pose-lock-${poseOption.value}`}
                          className={`chip ${videoPoseDirectionLock === poseOption.value ? 'active' : ''}`}
                          onClick={() => setVideoPoseDirectionLock(poseOption.value)}
                          id={`video-pose-lock-${poseOption.value}`}
                        >
                          {poseOption.label}
                          <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>
                            {poseOption.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(generationMode === 'storyboard_video' || generationMode === 'music_video') && (
                <>
                  <div className="input-group">
                    <label className="input-label">
                      <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      {generationMode === 'music_video' ? 'Thoi luong MV' : 'Thoi luong storyboard'}
                    </label>
                    <div className="chip-group">
                      {DURATIONS.map(d => (
                        <button
                          key={`storyboard-duration-${d.value}`}
                          className={`chip ${duration === d.value ? 'active' : ''}`}
                          onClick={() => setDuration(d.value)}
                          id={`${generationMode}-duration-${d.value}`}
                        >
                          {d.label}
                          <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: 4 }}>
                            {d.scenes} beat/{d.keyframes} panel
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 10 }}>
                    <label className="input-label">
                      <Clapperboard size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Engine tao video AI
                    </label>
                    <div className="chip-group">
                      {STORYBOARD_VIDEO_ENGINE_OPTIONS.map((engineOption) => (
                        <button
                          key={`storyboard-engine-${engineOption.value}`}
                          className={`chip ${storyboardEngine === engineOption.value ? 'active' : ''}`}
                          onClick={() => setStoryboardEngine(engineOption.value)}
                          id={`storyboard-engine-${engineOption.value}`}
                          style={storyboardEngine === engineOption.value ? {
                            background: `color-mix(in srgb, ${engineOption.color} 15%, transparent)`,
                            borderColor: engineOption.color,
                            color: engineOption.color,
                          } : {}}
                        >
                          {engineOption.label}
                          <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>
                            {engineOption.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {generationMode === 'storyboard_video' ? (
                    <div className="input-group" style={{ marginBottom: 10 }}>
                      <label className="input-label">
                        <FileText size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                        Template storyboard
                      </label>
                      <div className="chip-group">
                        {STORYBOARD_TEMPLATE_OPTIONS.map((templateOption) => (
                          <button
                            key={`storyboard-template-${templateOption.value}`}
                            className={`chip ${storyboardTemplate === templateOption.value ? 'active' : ''}`}
                            onClick={() => setStoryboardTemplate(templateOption.value)}
                            id={`storyboard-template-${templateOption.value}`}
                          >
                            {templateOption.label}
                            <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>
                              {templateOption.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="input-group" style={{ marginBottom: 10 }}>
                      <label className="input-label">
                        <Music size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                        Music video preset
                      </label>
                      <p className="ai-task-hint" style={{ marginBottom: 0 }}>
                        Khoa template Cinematic Story: intro mood → verse loneliness → visual metaphor → emotional drop → outro resolution. Notes nen dan loi bai hat, beat, mood nhac, reference nhan vat.
                      </p>
                    </div>
                  )}

                  <p className="ai-task-hint" style={{ marginBottom: 0 }}>
                    {generationMode === 'music_video'
                      ? `Mode nay tao MV co ${durationInfo.keyframes} keyframe anh va ${durationInfo.scenes} scene video, toi uu theo lyric/audio mood va Veo first-frame -> last-frame.`
                      : `Mode nay tao storyboard co ${durationInfo.keyframes} panel + ${durationInfo.scenes} video beat. Chon Veo de lay first-frame/last-frame prompts; chon Omni Flash de lay prompt tao/sua video bang ngon ngu tu nhien, co reference va audio intent.`}
                  </p>
                </>
              )}

              {/* Aspect Ratio */}
              <div className="input-group">
                <label className="input-label">
                  <Ratio size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Ti le khung hinh
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

              {generationMode === 'lookbook_image' && (
                <>
                  <div className="input-group">
                    <label className="input-label">
                      <ImageIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      So luong anh lookbook
                    </label>
                    <div className="chip-group">
                      {LOOKBOOK_IMAGE_COUNT_OPTIONS.map((count) => (
                        <button
                          key={`lookbook-count-${count}`}
                          className={`chip ${lookbookImageCount === count ? 'active' : ''}`}
                          onClick={() => setLookbookImageCount(count)}
                          id={`lookbook-count-${count}`}
                        >
                          {count} pics
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 10 }}>
                    <label className="input-label">
                      <Sparkles size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Tone lookbook
                    </label>
                    <div className="chip-group">
                      {LOOKBOOK_STYLE_TONE_OPTIONS.map((tone) => (
                        <button
                          key={`lookbook-tone-${tone.value}`}
                          className={`chip ${lookbookStyleTone === tone.value ? 'active' : ''}`}
                          onClick={() => setLookbookStyleTone(tone.value)}
                          id={`lookbook-tone-${tone.value}`}
                          style={lookbookStyleTone === tone.value ? {
                            background: `color-mix(in srgb, ${tone.color} 15%, transparent)`,
                            borderColor: tone.color,
                            color: tone.color,
                          } : {}}
                        >
                          {tone.label}
                          <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>
                            {tone.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 10 }}>
                    <label className="input-label">
                      <Palette size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Chu de lookbook
                    </label>
                    <div className="chip-group">
                      {LOOKBOOK_THEME_OPTIONS.map((themeOption) => (
                        <button
                          key={`lookbook-theme-${themeOption.value}`}
                          className={`chip ${lookbookTheme === themeOption.value ? 'active' : ''}`}
                          onClick={() => setLookbookTheme(themeOption.value)}
                          id={`lookbook-theme-${themeOption.value}`}
                          style={lookbookTheme === themeOption.value ? {
                            background: `color-mix(in srgb, ${themeOption.color} 15%, transparent)`,
                            borderColor: themeOption.color,
                            color: themeOption.color,
                          } : {}}
                        >
                          {themeOption.label}
                          <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>
                            {themeOption.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="ai-task-hint" style={{ marginBottom: 0 }}>
                    Mode nay tao bo {lookbookImageCount} prompt anh lookbook (anh tinh) theo format Nano Banana Pro: SUBJECT/ACTION/FACING/LOCATION/CAMERA/LIGHTING/STYLE/ASPECT RATIO. Theme: {lookbookThemeLabel}. Tone sexy la goi cam thoi trang, khong noi dung 18+.
                  </p>
                </>
              )}
            </div>

            {/* Product Category */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                <Shirt /> Danh mục sản phẩm
                <span
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.66rem',
                    letterSpacing: '0.04em',
                    textTransform: 'none',
                    color: autoApplyCategoryType ? '#10b981' : 'var(--text-secondary)',
                  }}
                >
                  {autoApplyCategoryType ? (
                    <Eye size={12} style={{ color: '#10b981' }} />
                  ) : (
                    <EyeOff size={12} style={{ color: 'var(--text-secondary)' }} />
                  )}
                  {autoApplyCategoryType ? 'Auto ON' : 'Manual'}
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Tự động đổi Loại nội dung</label>
                <div className="chip-group">
                  <button
                    className={`chip ${autoApplyCategoryType ? 'active' : ''}`}
                    onClick={() => setAutoApplyCategoryType(true)}
                    id="auto-apply-category-type-on"
                  >
                    Bật
                  </button>
                  <button
                    className={`chip ${!autoApplyCategoryType ? 'active' : ''}`}
                    onClick={() => setAutoApplyCategoryType(false)}
                    id="auto-apply-category-type-off"
                  >
                    Tắt
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Chọn nhóm danh mục</label>
                <div className="chip-group">
                  {PRODUCT_CATEGORY_GROUP_OPTIONS.map((group) => (
                    <button
                      key={`product-category-group-${group.value}`}
                      className={`chip ${productCategoryGroup === group.value ? 'active' : ''}`}
                      onClick={() => applyProductCategoryGroup(group.value)}
                      id={`product-category-group-${group.value}`}
                    >
                      {group.label}
                      <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>
                        {group.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  Danh mục chi tiết ({visibleProductCategoryOptions.length})
                </label>
                <div className="chip-group">
                  {visibleProductCategoryOptions.map((category) => (
                    <button
                      key={`product-category-${category.value}`}
                      className={`chip ${productCategory === category.value ? 'active' : ''}`}
                      onClick={() => applyProductCategory(category.value)}
                      id={`product-category-${category.value}`}
                    >
                      {category.label}
                      <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>
                        {category.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <p className="ai-task-hint" style={{ marginTop: 0, marginBottom: 8 }}>
                  Nhom dang xem: <strong>{activeProductCategoryGroupOption.label}</strong>. {activeProductCategoryOption.detailHint}
                </p>
                <label className="input-label">Loại nội dung phù hợp</label>
                <div className="chip-group">
                  {activeProductCategoryOption.suggestedTypes.map((typeValue) => {
                    const matchedType = CONTENT_TYPES.find((item) => item.value === typeValue)
                    if (!matchedType) return null

                    const Icon = matchedType.icon
                    return (
                      <button
                        key={`suggested-type-${typeValue}`}
                        className={`chip ${contentType === typeValue ? 'active' : ''}`}
                        onClick={() => applyManualContentType(typeValue)}
                        id={`suggested-type-${typeValue}`}
                        style={contentType === typeValue ? {
                          background: `color-mix(in srgb, ${matchedType.color} 15%, transparent)`,
                          borderColor: matchedType.color,
                          color: matchedType.color,
                        } : {}}
                      >
                        <Icon size={13} style={{ marginRight: 2 }} />
                        {matchedType.label}
                      </button>
                    )
                  })}
                </div>

                <p className="ai-task-hint" style={{ marginTop: 8, marginBottom: 0 }}>
                  Benchmark boutique {`>30K`} followers: {activeProductCategoryOption.benchmarkHint}
                </p>

                {!autoApplyCategoryType && (
                  <p className="ai-task-hint" style={{ marginTop: 8, marginBottom: 0 }}>
                    Đang tắt tự động: chọn danh mục chỉ để tham khảo, bấm vào chip "Loại nội dung phù hợp" để áp dụng thủ công.
                  </p>
                )}

                {autoApplyCategoryType && isContentTypeManuallyLocked && contentType !== 'auto' && (
                  <p className="ai-task-hint" style={{ marginTop: 8, marginBottom: 0 }}>
                    Dang khoa loai noi dung thu cong ({contentType.toUpperCase()}). Danh muc se khong tu dong ghi de cho den khi ban chon Auto.
                  </p>
                )}

                {!isCurrentContentTypeAlignedWithCategory && contentType !== 'auto' && (
                  <p className="ai-task-hint" style={{ marginTop: 8, marginBottom: 0 }}>
                    Gợi ý nhanh: danh mục này thường chạy tốt hơn với {activeProductCategorySuggestedLabels}.
                  </p>
                )}
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
                        onClick={() => applyManualContentType(ct.value)}
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

              </>
            )}

            {!isOotdTemplatePage && (
              <>
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
                  placeholder="Ví dụ: san pham can review la chan vay xep ly den, nhan manh form A-line, eo cao, de phoi do di lam..."
                  rows={2}
                />
                <p className="ai-task-hint" style={{ marginTop: 6, marginBottom: 0 }}>
                  O phan nay dung de mo ta san pham can review. Khi tao Prompt Package tu phan tich TikTok, he thong uu tien thong tin nay cho noi dung san pham.
                </p>
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
              </>
            )}

            {/* Algorithm Info */}
            {generationMode === 'video_prompt' && (
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
            )}

            {(generationMode === 'storyboard_video' || generationMode === 'music_video') && (
              <div className="card" style={{
                marginBottom: 16,
                background: generationMode === 'music_video' ? 'rgba(236, 72, 153, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                borderColor: generationMode === 'music_video' ? 'rgba(236, 72, 153, 0.22)' : 'rgba(245, 158, 11, 0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {generationMode === 'music_video' ? (
                    <Music size={14} color="#ec4899" />
                  ) : (
                    <Clapperboard size={14} color="var(--accent-amber)" />
                  )}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: generationMode === 'music_video' ? '#ec4899' : 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {generationMode === 'music_video' ? 'Music Video Mode' : 'Storyboard Template'}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {generationMode === 'music_video' ? (
                    <>
                      Tao <strong>{durationInfo.keyframes} MV keyframes</strong> va <strong>{durationInfo.scenes} music-video scenes</strong> cho <strong>{storyboardEngineLabel}</strong>.
                      <br />
                      Preset: <strong>Cinematic Story</strong>, uu tien lyric beat, audio mood, visual metaphor, emotional drop va outro resolution.
                    </>
                  ) : (
                    <>
                      Tao <strong>{durationInfo.keyframes} storyboard panels</strong> va <strong>{durationInfo.scenes} video beats</strong> cho <strong>{storyboardEngineLabel}</strong>.
                      <br />
                      Template hien tai: <strong>{storyboardTemplateLabel}</strong>. Veo uu tien cap keyframe; Omni Flash uu tien prompt tao/sua video bang hoi thoai tu nhien.
                    </>
                  )}
                </p>
              </div>
            )}

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
                      ? `Dang tao ${promptPrimaryLabel}`
                      : promptStatusKind === 'error'
                        ? 'Tao noi dung chua thanh cong'
                        : promptStatusKind === 'success'
                          ? `${promptPrimaryLabel} da san sang`
                          : 'Nut tao noi dung dang noi co dinh phia duoi man hinh'}
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
                    Upload ảnh face & sản phẩm, chọn cấu hình, rồi nhấn "{generationMode === 'music_video' ? 'Tạo Music Video' : generationMode === 'storyboard_video' ? 'Tạo Storyboard Video' : generationMode === 'lookbook_image' ? 'Tạo Ảnh Lookbook' : 'Tạo Prompt Package'}" để bắt đầu.
                  </p>
                  <div className="results-empty-steps">
                    <div className="results-empty-step">
                      <span className="results-empty-step-index">1</span>
                      <p>Tải ảnh Face và ảnh sản phẩm ở panel bên trái</p>
                    </div>
                    <div className="results-empty-step">
                      <span className="results-empty-step-index">2</span>
                      <p>{generationMode === 'music_video' ? 'Chon engine, thoi luong, ti le khung hinh va dan lyric/audio mood vao ghi chu' : generationMode === 'storyboard_video' ? 'Chon engine Veo/Omni Flash, template storyboard, thoi luong va ti le khung hinh' : generationMode === 'lookbook_image' ? 'Chon mode Lookbook Image, so luong 5/10/20, tone classic/sexy va kieu noi dung' : 'Chọn thời lượng, tỉ lệ và kiểu nội dung phù hợp'}</p>
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
                    {result && activeTab !== 'history' && hasVideoPromptResult && (
                      <span style={{ marginLeft: 8, fontSize: '0.75rem', opacity: 0.7 }}>
                        [{(result.affiliateModeUsed || FIXED_AFFILIATE_MODE).toUpperCase()} • {(result.salesTemplateUsed || FIXED_SALES_TEMPLATE).toUpperCase()}]
                      </span>
                    )}
                  </div>

                  <div className="results-scroll">

                  {/* Timeline */}
                  {result && hasVideoPromptResult && (
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
                    {result && hasVideoPromptResult && (
                      <button
                        className={`tab ${activeTab === 'keyframes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('keyframes')}
                      >
                        <Camera /> Keyframes ({result.keyframes.length})
                      </button>
                    )}
                    {result && hasVideoPromptResult && (
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
                        <ImageIcon /> {hasVideoPromptResult ? 'Create Image' : `Lookbook Images (${currentLookbookPrompts.length})`}
                      </button>
                    )}
                    {result && hasVideoPromptResult && (
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
                  {result && hasVideoPromptResult && (activeTab === 'keyframes' || activeTab === 'all') && (
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
                            <CopyButton text={appendKeyframeCopySafetyRule(kf.fullPrompt)} />
                            <div className="prompt-text">
                              <strong>SUBJECT:</strong> {kf.subject}
                              {'\n'}<strong>ACTION:</strong> {kf.action}
                              {kf.facingDirection ? <>{'\n'}<strong>FACING:</strong> {kf.facingDirection}</> : null}
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

                  {result && hasVideoPromptResult && (activeTab === 'scenes' || activeTab === 'all') && (
                    <>
                      {activeTab === 'all' && (
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-pink)', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🎬 Scene Prompts ({resultVideoEngineLabel})
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
                  {result && (activeTab === 'image' || activeTab === 'all') && currentLookbookPrompts.length > 0 && (
                    <>
                      {activeTab === 'all' && (
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🎨 {hasVideoPromptResult ? 'Create Image Prompt (Tạo ảnh sản phẩm)' : `Lookbook Image Prompts (${currentLookbookPrompts.length})`}
                        </h3>
                      )}
                      {currentLookbookPrompts.map((lookbookPrompt) => (
                        <div key={`lookbook-${lookbookPrompt.index}`} className="prompt-card" style={{ animationDelay: `${lookbookPrompt.index * 60}ms` }}>
                          <div className="prompt-card-header">
                            <div className="prompt-card-badge" style={{ color: 'var(--accent-amber)' }}>
                              <Palette size={14} />
                              {hasVideoPromptResult
                                ? 'Create Product Image Prompt'
                                : `Lookbook Image ${lookbookPrompt.index + 1}: ${lookbookPrompt.title}`}
                            </div>
                            <span className="prompt-card-time">{selectedContentType.toUpperCase()}</span>
                          </div>
                          <div className="prompt-card-body">
                            <CopyButton text={lookbookPrompt.prompt} />
                            <div className="prompt-text" style={{ lineHeight: 1.8 }}>
                              {lookbookPrompt.prompt}
                            </div>
                          </div>
                        </div>
                      ))}
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
                      <div className="prompt-card" style={{ borderColor: 'rgba(14,165,233,0.35)', marginBottom: 14 }}>
                        <div className="prompt-card-body">
                          <p className="ai-task-hint" style={{ marginTop: 0, marginBottom: 10 }}>
                            Dung ket qua phan tich de chuyen giao nhip cau truc video (hook/beat/script) va phoi lai boi canh tuong tu video goc trong detached mode. Luong nay khong ep core-rule stack; cau hinh video giu nguyen theo duration/aspect ratio, va san pham review uu tien theo "Ghi chu them (tuy chon)".
                          </p>
                          <button
                            type="button"
                            className={`btn-generate btn-generate-secondary ${loading ? 'loading' : ''}`}
                            onClick={handleGeneratePromptFromTikTokAnalysis}
                            disabled={loading || tiktokAnalysisLoading || !canGenerate}
                            style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)' }}
                          >
                            {loading ? (
                              <>
                                <div className="spinner" />
                                Dang tao Prompt Package tu phan tich...
                              </>
                            ) : (
                              <>
                                <Wand2 size={18} />
                                Tao Prompt Package tu Phan tich TikTok
                                <ArrowRight size={16} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

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
                              `Bối cảnh: ${beat.contextHint}`,
                              `Camera: ${beat.cameraHint}`,
                              `Narration: ${beat.narrationHint}`,
                            ].join('\n')} />
                            <div className="prompt-text">
                              {beat.description}
                              {beat.contextHint ? <>{'\n'}<strong>Bối cảnh:</strong> {beat.contextHint}</> : null}
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

        <div
          className="prompt-floating-bar-wrap"
          role="region"
          aria-label={isOotdTemplatePage
            ? 'Tao Prompt OOTD Template'
            : generationMode === 'lookbook_image'
              ? 'Tao Anh Lookbook'
              : generationMode === 'music_video'
                ? 'Tao Music Video'
              : generationMode === 'storyboard_video'
                ? 'Tao Storyboard Video'
                : 'Tao Prompt Package'}
        >
          <div className={`prompt-floating-bar ${loading ? 'is-loading' : ''}`}>
            <div className="prompt-floating-meta">
              <p className="prompt-floating-title">
                {isOotdTemplatePage
                  ? 'Tao Prompt OOTD Template'
                  : generationMode === 'lookbook_image'
                    ? 'Tao Anh Lookbook'
                    : generationMode === 'music_video'
                      ? 'Tao Music Video'
                    : generationMode === 'storyboard_video'
                      ? 'Tao Storyboard Video'
                    : 'Tao Prompt Package'}
              </p>
              <p className={`prompt-floating-subtitle ${promptStatusKind}`}>
                {promptFloatingStatus}
              </p>
            </div>

            <button
              id="generate-btn"
              className={`btn-generate prompt-floating-btn ${loading ? 'loading' : ''}`}
              onClick={isOotdTemplatePage ? handleGenerateOotdTemplate : handleGenerate}
              disabled={loading || !canGenerate}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  {isOotdTemplatePage
                    ? 'Dang tao prompt OOTD template...'
                    : generationMode === 'lookbook_image'
                      ? 'Dang tao anh lookbook...'
                      : generationMode === 'music_video'
                        ? 'Dang tao music video...'
                      : generationMode === 'storyboard_video'
                        ? 'Dang tao storyboard...'
                      : 'Dang tao prompt...'}
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  {isOotdTemplatePage
                    ? 'Tao Prompt OOTD Template'
                    : generationMode === 'lookbook_image'
                      ? 'Tao Anh Lookbook'
                      : generationMode === 'music_video'
                        ? 'Tao Music Video'
                      : generationMode === 'storyboard_video'
                        ? 'Tao Storyboard Video'
                      : 'Tao Prompt Package'}
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
                  ? `Dang tao ${promptPrimaryLabel}`
                  : promptToast.kind === 'success'
                    ? `${promptPrimaryLabel} thanh cong`
                    : `Co loi khi tao ${promptPrimaryLabel}`}
              </p>
              <p className="prompt-toast-message">{promptToast.message}</p>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </>
  )
}
