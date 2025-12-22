// ===========================
// Sewn 플랫폼 상수 정의
// ===========================

import { ExpertCategory } from '@/types'

// 플랫폼 수수료율
export const PLATFORM_FEE = {
  EXPERT_MIN: 0,      // 전문가 최소 수수료 0%
  EXPERT_MAX: 0.10,   // 전문가 최대 수수료 10%
  CLIENT_MIN: 0.10,   // 클라이언트 최소 수수료 10%
  CLIENT_MAX: 0.15,   // 클라이언트 최대 수수료 15%
} as const

// 페이지네이션 기본값
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
} as const

// 파일 업로드 제한
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const

// 전문가 카테고리 그룹
export const EXPERT_CATEGORY_GROUPS = {
  TECHNICAL: {
    label: '테크니컬',
    categories: ['technical_designer', 'pattern_maker', '3d_designer', 'cad_specialist'],
  },
  PRODUCTION: {
    label: '프로덕션',
    categories: ['sample_maker', 'seamstress', 'knit_specialist', 'fitting_specialist'],
  },
  CREATIVE: {
    label: '크리에이티브',
    categories: ['fashion_designer', 'textile_designer', 'graphic_designer', 'illustrator'],
  },
  MEDIA: {
    label: '미디어',
    categories: ['photographer', 'model', 'stylist', 'videographer'],
  },
} as const

// 전문가 카테고리 목록 (16개 전체)
export const EXPERT_CATEGORIES: { value: ExpertCategory; label: string; description: string; group: string }[] = [
  // 테크니컬
  { value: 'technical_designer', label: '테크니컬 디자이너', description: '기술적 디테일, 스펙 시트, 생산 지시서 관리', group: 'TECHNICAL' },
  { value: 'pattern_maker', label: '패턴 메이커', description: '의류 패턴 설계 및 제작, 그레이딩', group: 'TECHNICAL' },
  { value: '3d_designer', label: '3D 디자이너', description: 'CLO3D, Browzwear, Marvelous Designer 전문', group: 'TECHNICAL' },
  { value: 'cad_specialist', label: 'CAD 전문가', description: 'Gerber, Optitex, Lectra 등 CAD 시스템 전문', group: 'TECHNICAL' },
  // 프로덕션
  { value: 'sample_maker', label: '샘플리스트', description: '샘플 의류 제작, 프로토타입 개발', group: 'PRODUCTION' },
  { value: 'seamstress', label: '봉제사', description: '전문 봉제, 완봉, 특수 봉제 기술', group: 'PRODUCTION' },
  { value: 'knit_specialist', label: '니트 전문가', description: '니트웨어 전문 제작 및 개발', group: 'PRODUCTION' },
  { value: 'fitting_specialist', label: '가봉사', description: '가봉 및 피팅 보정 전문', group: 'PRODUCTION' },
  // 크리에이티브
  { value: 'fashion_designer', label: '패션 디자이너', description: '의류 디자인, 컬렉션 개발', group: 'CREATIVE' },
  { value: 'textile_designer', label: '텍스타일 디자이너', description: '원단 디자인, 프린트 패턴 개발', group: 'CREATIVE' },
  { value: 'graphic_designer', label: '그래픽 디자이너', description: '브랜딩, 로고, 마케팅 그래픽', group: 'CREATIVE' },
  { value: 'illustrator', label: '일러스트레이터', description: '패션 일러스트레이션, 도식화', group: 'CREATIVE' },
  // 미디어
  { value: 'photographer', label: '포토그래퍼', description: '패션 사진, 룩북, 캠페인 촬영', group: 'MEDIA' },
  { value: 'model', label: '모델', description: '룩북, 커머셜, 피팅 모델', group: 'MEDIA' },
  { value: 'stylist', label: '스타일리스트', description: '패션 스타일링, 코디네이션', group: 'MEDIA' },
  { value: 'videographer', label: '비디오그래퍼', description: '패션 영상, 캠페인 비디오 제작', group: 'MEDIA' },
]

// 스킬 목록 (자동완성용)
export const COMMON_SKILLS = [
  // 소프트웨어
  'CLO3D', 'Browzwear', 'Adobe Illustrator', 'Adobe Photoshop', 'Adobe InDesign',
  'Gerber AccuMark', 'Optitex', 'Lectra', 'Pattern Magic', 'Marvelous Designer',
  'Blender', 'Cinema 4D', 'Rhino', 'Capture One', 'Lightroom',
  // 기술
  '플랫 패턴', '드레이핑', '그레이딩', 'CAD 패턴', '디지털 패턴',
  '봉제', '가봉', '완봉', '특수 봉제', '니트웨어',
  // 스타일
  '여성복', '남성복', '아동복', '스포츠웨어', '이너웨어',
  '데님', '가죽', '모피', '니트', '우븐',
  // 촬영
  '스튜디오 촬영', '로케이션 촬영', '제품 촬영', '룩북', '캠페인',
  // 기타
  'E-커머스', '마켓플레이스', '브랜딩', 'SNS 마케팅',
]

// 지역 목록
export const LOCATIONS = [
  '서울 전체',
  '서울 강남',
  '서울 성수',
  '서울 홍대/합정',
  '서울 동대문',
  '서울 기타',
  '경기',
  '인천',
  '부산',
  '대구',
  '기타 지역',
  '원격 작업 가능',
]

// 예산 범위 옵션
export const BUDGET_RANGES = [
  { min: 0, max: 500000, label: '50만원 이하' },
  { min: 500000, max: 1000000, label: '50만원 - 100만원' },
  { min: 1000000, max: 3000000, label: '100만원 - 300만원' },
  { min: 3000000, max: 5000000, label: '300만원 - 500만원' },
  { min: 5000000, max: 10000000, label: '500만원 - 1,000만원' },
  { min: 10000000, max: null, label: '1,000만원 이상' },
]

// 시급 범위 옵션
export const HOURLY_RATE_RANGES = [
  { min: 0, max: 30000, label: '3만원 이하' },
  { min: 30000, max: 50000, label: '3만원 - 5만원' },
  { min: 50000, max: 100000, label: '5만원 - 10만원' },
  { min: 100000, max: 200000, label: '10만원 - 20만원' },
  { min: 200000, max: null, label: '20만원 이상' },
]

// 가용성 상태 라벨
export const AVAILABILITY_LABELS = {
  available: '가능',
  busy: '바쁨',
  unavailable: '불가',
} as const

// 프로젝트 상태 라벨
export const PROJECT_STATUS_LABELS = {
  draft: '임시저장',
  open: '모집중',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소됨',
} as const

// 제안서 상태 라벨
export const PROPOSAL_STATUS_LABELS = {
  pending: '검토중',
  accepted: '수락됨',
  rejected: '거절됨',
  withdrawn: '철회됨',
} as const

// 계약 상태 라벨
export const CONTRACT_STATUS_LABELS = {
  pending_payment: '결제 대기',
  in_progress: '진행중',
  completed: '완료',
  disputed: '분쟁중',
  cancelled: '취소됨',
} as const

// 라우트 경로
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',
  AUTH_CALLBACK: '/auth/callback',
  EXPERTS: '/experts',
  EXPERT_DETAIL: (id: string) => `/experts/${id}`,
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  PROJECT_NEW: '/projects/new',
  MESSAGES: '/messages',
  MESSAGE_DETAIL: (id: string) => `/messages/${id}`,
  DASHBOARD: '/dashboard',
  DASHBOARD_PROFILE: '/dashboard/profile',
  DASHBOARD_PORTFOLIO: '/dashboard/portfolio',
  DASHBOARD_PROJECTS: '/dashboard/projects',
  DASHBOARD_PROPOSALS: '/dashboard/proposals',
  DASHBOARD_CONTRACTS: '/dashboard/contracts',
  DASHBOARD_SETTINGS: '/dashboard/settings',
} as const
