// ===========================
// Sewn 플랫폼 타입 정의
// ===========================

// 사용자 타입
export type UserType = 'expert' | 'client' | 'both'

// 전문가 가용 상태
export type AvailabilityStatus = 'available' | 'busy' | 'unavailable'

// 프로젝트 상태
export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'

// 제안서 상태
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

// 계약 상태
export type ContractStatus = 'pending_payment' | 'in_progress' | 'pending_approval' | 'completed' | 'disputed' | 'cancelled'

// 거래 유형
export type TransactionType = 'escrow_deposit' | 'release_to_expert' | 'refund_to_client' | 'platform_fee'

// 거래 상태
export type TransactionStatus = 'pending' | 'completed' | 'failed'

// 전문가 카테고리 (16개)
export type ExpertCategory =
  // 테크니컬
  | 'technical_designer'
  | 'pattern_maker'
  | '3d_designer'
  | 'cad_specialist'
  // 프로덕션
  | 'sample_maker'
  | 'seamstress'
  | 'knit_specialist'
  | 'fitting_specialist'
  // 크리에이티브
  | 'fashion_designer'
  | 'textile_designer'
  | 'graphic_designer'
  | 'illustrator'
  // 미디어
  | 'photographer'
  | 'model'
  | 'stylist'
  | 'videographer'

// 카테고리 그룹 타입
export type ExpertCategoryGroup = 'TECHNICAL' | 'PRODUCTION' | 'CREATIVE' | 'MEDIA'

// 카테고리 라벨 매핑 (한국어)
export const CATEGORY_LABELS: Record<ExpertCategory, string> = {
  // 테크니컬
  technical_designer: '테크니컬 디자이너',
  pattern_maker: '패턴 메이커',
  '3d_designer': '3D 디자이너',
  cad_specialist: 'CAD 전문가',
  // 프로덕션
  sample_maker: '샘플리스트',
  seamstress: '봉제사',
  knit_specialist: '니트 전문가',
  fitting_specialist: '가봉사',
  // 크리에이티브
  fashion_designer: '패션 디자이너',
  textile_designer: '텍스타일 디자이너',
  graphic_designer: '그래픽 디자이너',
  illustrator: '일러스트레이터',
  // 미디어
  photographer: '포토그래퍼',
  model: '모델',
  stylist: '스타일리스트',
  videographer: '비디오그래퍼',
}

// ===========================
// 데이터베이스 모델 타입
// ===========================

export interface User {
  id: string
  email: string
  user_type: UserType
  name: string | null
  profile_image_url: string | null
  phone: string | null
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExpertProfile {
  id: string
  user_id: string
  bio: string | null
  categories: ExpertCategory[]
  skills: string[]
  experience_years: number | null
  education: string | null
  location: string | null
  hourly_rate_min: number | null
  hourly_rate_max: number | null
  project_rate_min: number | null
  project_rate_max: number | null
  availability: AvailabilityStatus
  rating_avg: number
  review_count: number
  completed_projects: number
  created_at: string
  updated_at: string
  // 조인된 데이터
  user?: User
}

export interface PortfolioItem {
  id: string
  expert_id: string
  title: string
  description: string | null
  image_urls: string[]
  category: ExpertCategory | null
  created_at: string
}

export interface Project {
  id: string
  client_id: string
  title: string
  description: string
  categories: ExpertCategory[]
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  location: string | null
  attachment_urls: string[]
  status: ProjectStatus
  created_at: string
  updated_at: string
  // 조인된 데이터
  client?: User
  proposals?: Proposal[]
  _count?: {
    proposals: number
  }
}

export interface Proposal {
  id: string
  project_id: string
  expert_id: string
  cover_letter: string
  proposed_rate: number
  estimated_duration: string | null
  status: ProposalStatus
  created_at: string
  // 조인된 데이터
  project?: Project
  expert?: ExpertProfile & { user: User }
}

export interface Contract {
  id: string
  project_id: string
  client_id: string
  expert_id: string
  agreed_amount: number
  platform_fee_rate: number
  status: ContractStatus
  started_at: string | null
  completed_at: string | null
  created_at: string
  payment_id: string | null
  payment_key: string | null
  proposal_id: string | null
  deadline: string | null
  completion_requested_at: string | null
  // 계산된 금액
  platform_fee?: number
  expert_amount?: number
  // 조인된 데이터
  project?: Project
  client?: User
  expert?: User
  // 뷰에서 가져온 데이터
  project_title?: string
  project_description?: string
  client_name?: string
  client_email?: string
  client_image?: string
  expert_name?: string
  expert_email?: string
  expert_image?: string
}

export interface Transaction {
  id: string
  contract_id: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  payment_method: string | null
  payment_id: string | null
  created_at: string
  // 조인된 데이터
  contract?: Contract
}

export interface Conversation {
  id: string
  participant_ids: string[]
  project_id: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: Record<string, number>
  created_at: string
  // 조인된 데이터
  participants?: User[]
  project?: Project
  last_message?: Message
}

export type MessageType = 'text' | 'image' | 'file'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachment_urls: string[]
  is_read: boolean
  message_type: MessageType
  file_url: string | null
  file_name: string | null
  created_at: string
  // 조인된 데이터
  sender?: User
}

export type NotificationType = 'message' | 'proposal_received' | 'proposal_accepted' | 'proposal_rejected' | 'project_update'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string | null
  link: string | null
  related_id: string | null
  is_read: boolean
  created_at: string
}

export interface Review {
  id: string
  contract_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
  // 조인된 데이터
  reviewer?: User
  reviewee?: User
  contract?: Contract
}

// ===========================
// API 응답 타입
// ===========================

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
}

// ===========================
// 폼 타입
// ===========================

export interface RegisterFormData {
  email: string
  password: string
  name: string
  user_type: UserType
}

export interface LoginFormData {
  email: string
  password: string
}

export interface ExpertProfileFormData {
  bio: string
  categories: ExpertCategory[]
  skills: string[]
  experience_years: number | null
  education: string
  location: string
  hourly_rate_min: number | null
  hourly_rate_max: number | null
  project_rate_min: number | null
  project_rate_max: number | null
  availability: AvailabilityStatus
}

export interface ProjectFormData {
  title: string
  description: string
  categories: ExpertCategory[]
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  location: string
}

export interface ProposalFormData {
  cover_letter: string
  proposed_rate: number
  estimated_duration: string
}

export interface ReviewFormData {
  rating: number
  comment: string
}

// ===========================
// 필터 타입
// ===========================

// 정렬 옵션
export type SortOption = 'recommended' | 'rating' | 'reviews' | 'latest' | 'price_low' | 'price_high'

export const SORT_LABELS: Record<SortOption, string> = {
  recommended: '추천순',
  rating: '평점순',
  reviews: '리뷰 많은순',
  latest: '최신순',
  price_low: '가격 낮은순',
  price_high: '가격 높은순',
}

export interface ExpertFilters {
  categories?: ExpertCategory[]
  minRate?: number
  maxRate?: number
  location?: string
  availability?: AvailabilityStatus
  search?: string
  sort?: SortOption
  minRating?: number
}

export interface ProjectFilters {
  categories?: ExpertCategory[]
  minBudget?: number
  maxBudget?: number
  status?: ProjectStatus
  search?: string
}
