export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  parentId: number | null
  pointCount: number
  children: Category[]
  canAccess?: boolean
}

export interface Note {
  keyPoints: string
  body: string
}

export interface Question {
  id: number
  prompt: string
  options: string[]
}

export interface QuestionInput {
  prompt: string
  options: string[]
  answer: string
  explanation: string
}

export interface ExampleInput {
  title: string
  language: string
  code: string
  description: string
  runnable: boolean
}

export interface Example extends ExampleInput {
  id: number
}

export interface QuizResult {
  questionId: number
  prompt: string
  answer: string
  correctAnswer: string
  correct: boolean
  explanation: string
}

export interface QuizAttempt {
  id: number
  score: number
  correctCount: number
  totalCount: number
  createdAt: string
  results: QuizResult[]
}

export interface PointSummary {
  id: number
  categoryId: number
  title: string
  summary: string | null
  status: string
  progress: number
  category: { id: number; name: string; slug: string }
  _count: { questions: number; examples: number }
}

export interface PointDetail extends Omit<PointSummary, '_count'> {
  note: Note | null
  questions: Question[]
  examples: Example[]
  attempts: QuizAttempt[]
}

export interface PointInput {
  categoryId: number
  title: string
  summary: string
  note: Note
  questions: QuestionInput[]
  examples: ExampleInput[]
}

export interface Stats {
  total: number
  completed: number
  inProgress: number
  averageProgress: number
}

export interface Overview {
  categories: Category[]
  points: PointSummary[]
  stats: Stats
}

export interface CategoryOption {
  id: number
  label: string
  category: Category
}

export interface NavNode {
  id: number
  title: string
  url: string | null
  children: NavNode[]
}
