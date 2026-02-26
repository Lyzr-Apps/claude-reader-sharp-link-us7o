'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { uploadAndTrainDocument, validateFile } from '@/lib/ragKnowledgeBase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { FiBook, FiBookOpen, FiEdit3, FiUpload, FiSearch, FiSettings, FiMessageSquare, FiSend, FiChevronLeft, FiChevronRight, FiChevronDown, FiBookmark, FiList, FiGrid, FiX, FiCopy, FiTrash2, FiDownload, FiMenu, FiClock, FiFileText } from 'react-icons/fi'
import { HiOutlineSparkles } from 'react-icons/hi2'
import { BiHighlight } from 'react-icons/bi'

// ===== CONSTANTS =====
const AGENT_ID = '699fb1fd1d5430ccdd32597d'
const RAG_ID = '699fb1edf572c99c0ffb74f0'
const PAGES_CHAR_LIMIT = 2000

// ===== TYPES =====
interface Book {
  id: string
  title: string
  author: string
  fileName: string
  content: string
  chapters: Chapter[]
  progress: number
  lastRead: string
  uploadDate: string
  coverColor: string
  bookmarks: number[]
  currentPage: number
}

interface Chapter {
  title: string
  startIndex: number
}

interface Highlight {
  id: string
  bookId: string
  text: string
  color: 'yellow' | 'green' | 'blue' | 'pink'
  note: string
  pageIndex: number
  createdAt: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  followUpQuestions?: string[]
  timestamp: string
}

// ===== SAMPLE DATA =====
const SAMPLE_BOOKS: Book[] = [
  {
    id: 'sample-1',
    title: 'The Art of Reading',
    author: 'Mortimer J. Adler',
    fileName: 'art-of-reading.txt',
    content: 'Chapter 1: The Activity and Art of Reading\n\nThis book is for readers and for those who wish to become readers. Particularly, it is for readers of books. More particularly, for those whose main purpose in reading books is to gain increased understanding.\n\nBy readers we mean people who are still growing mentally, people who know that reading, like every other art, is something to be learned and practiced. Such people are usually in their teens, their twenties, or even later. The art of reading has a longer history than the art of writing. In fact, it begins with oral reading and listening.\n\nReading is a complex activity, just as writing is. It consists of a large number of separate acts, all of which must be performed in a good reading. The person who can perform more of these various acts is better able to read.\n\nChapter 2: The Levels of Reading\n\nIn the preceding chapter, we mentioned the goals a reader can pursue. We said that a reader can read for entertainment, for information, or for understanding. We also said that this book would be mainly concerned with reading for understanding.\n\nThere are four levels of reading. The higher levels include the lower, so that the fourth and highest level of reading includes all the others. They are cumulative, not exclusive.\n\nThe first level of reading we will call Elementary Reading. Other names might be rudimentary reading, basic reading, or initial reading. This is the level of reading learned in elementary school. At this level, the question asked of the reader is: What does the sentence say?\n\nThe second level of reading we will call Inspectional Reading. It is characterized by its special emphasis on time. When reading at this level, the student is allowed a set time to complete an assigned reading. The aim is to get the most out of the book within a given time.\n\nChapter 3: The First Level of Reading\n\nWe have said that the first level of reading is called elementary reading. A person who has mastered this level is simply able to read. He has learned the rudiments of the art of reading, has received basic training in reading, and can read at an initial level.\n\nAt this level of reading, the question asked of the reader is: What does the sentence say? That question may seem simple, but it is actually quite complex. It involves all the problems of recognizing individual words and phrases, of grasping the meaning of sentences, and of following the thread of an argument through a series of sentences.',
    chapters: [
      { title: 'Chapter 1: The Activity and Art of Reading', startIndex: 0 },
      { title: 'Chapter 2: The Levels of Reading', startIndex: 1 },
      { title: 'Chapter 3: The First Level of Reading', startIndex: 2 }
    ],
    progress: 35,
    lastRead: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    coverColor: '#8B6F47',
    bookmarks: [0, 2],
    currentPage: 1
  },
  {
    id: 'sample-2',
    title: 'Notes on Writing Well',
    author: 'William Zinsser',
    fileName: 'writing-well.txt',
    content: 'Part I: Principles\n\nChapter 1: The Transaction\n\nA school in Connecticut once held a day devoted to the arts. The man who ran the school wanted his students to understand that the arts are not combative, that they are a way of approaching life.\n\nI was asked if I would conduct a writing clinic. Several hundred students and their parents came and sat in the auditorium. I braced myself for the session, for I knew something they did not know: I was going to be the first speaker.\n\nAnother writer had been asked to participate as well. He was a surgeon by profession, a man who had recently begun to write, and his book about his experience had been a best-seller. We were supposed to offer different perspectives on writing.\n\nChapter 2: Simplicity\n\nClutter is the disease of American writing. We are a society strangling in unnecessary words, circular constructions, pompous frills and meaningless jargon. Who can understand the clotted language of everyday American commerce: the memo, the corporation report, the business letter, the notice from the bank explaining its latest change in policy?\n\nThe secret of good writing is to strip every sentence to its cleanest components. Every word that serves no function, every long word that could be a short word, every adverb that carries the same meaning that is already in the verb - these are the thousand and one adulterants that weaken the strength of a sentence.',
    chapters: [
      { title: 'Part I: Principles', startIndex: 0 },
      { title: 'Chapter 1: The Transaction', startIndex: 0 },
      { title: 'Chapter 2: Simplicity', startIndex: 1 }
    ],
    progress: 62,
    lastRead: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    uploadDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    coverColor: '#6B8E6B',
    bookmarks: [1],
    currentPage: 0
  },
  {
    id: 'sample-3',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    fileName: 'thinking-fast-slow.txt',
    content: 'Introduction\n\nEvery author, I suppose, has in mind a setting in which readers of his or her work could benefit from having read it. Mine is the proverbial office watercooler, where opinions are shared and gossip is exchanged.\n\nI hope to enrich the vocabulary that people use when they talk about the judgments and choices of others, the company policies, or their own lives. Why be concerned with gossip? Because it is much easier, as well as far more enjoyable, to identify and label the mistakes of others than to recognize our own.\n\nPart I: Two Systems\n\nChapter 1: The Characters of the Story\n\nTo observe your mind in automatic mode, glance at the image below. Your experience as you look at the picture is an effortless and instantaneous impression of a woman with dark hair showing anger or readiness to shout. You did not intend to assess her mood or her appearance. The image came to your mind automatically.\n\nThe mental work that produces impressions, intuitions, and many decisions goes on in silence in our mind. Much of the thinking that guides our actions is of this kind. System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control.',
    chapters: [
      { title: 'Introduction', startIndex: 0 },
      { title: 'Part I: Two Systems', startIndex: 1 },
      { title: 'Chapter 1: The Characters of the Story', startIndex: 1 }
    ],
    progress: 12,
    lastRead: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    coverColor: '#7B6B8E',
    bookmarks: [],
    currentPage: 0
  }
]

const SAMPLE_HIGHLIGHTS: Highlight[] = [
  {
    id: 'sh-1', bookId: 'sample-1',
    text: 'Reading is a complex activity, just as writing is. It consists of a large number of separate acts, all of which must be performed in a good reading.',
    color: 'yellow', note: 'Key definition of reading as a skill', pageIndex: 0,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sh-2', bookId: 'sample-1',
    text: 'There are four levels of reading. The higher levels include the lower.',
    color: 'green', note: 'Important framework for the book', pageIndex: 1,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sh-3', bookId: 'sample-2',
    text: 'Clutter is the disease of American writing.',
    color: 'blue', note: 'Great opening statement - use in essay', pageIndex: 1,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sh-4', bookId: 'sample-2',
    text: 'The secret of good writing is to strip every sentence to its cleanest components.',
    color: 'pink', note: '', pageIndex: 1,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sh-5', bookId: 'sample-3',
    text: 'System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control.',
    color: 'yellow', note: 'System 1 definition', pageIndex: 1,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const SAMPLE_CHAT: ChatMessage[] = [
  {
    id: 'sc-1', role: 'user', content: 'What are the four levels of reading?',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sc-2', role: 'assistant',
    content: 'According to the text, there are four levels of reading that are cumulative (higher levels include lower ones):\n\n1. **Elementary Reading** - Also called rudimentary, basic, or initial reading. The question at this level is "What does the sentence say?"\n\n2. **Inspectional Reading** - Characterized by emphasis on time. The aim is to get the most out of a book within a given time period.\n\n3. The third and fourth levels are discussed in later chapters of the book.',
    sources: ['Chapter 2: The Levels of Reading - "There are four levels of reading..."'],
    followUpQuestions: ['What is the difference between inspectional and analytical reading?', 'How can I improve my elementary reading skills?'],
    timestamp: new Date(Date.now() - 59 * 60 * 1000).toISOString()
  }
]

const COVER_COLORS = ['#8B6F47', '#6B8E6B', '#7B6B8E', '#8E6B6B', '#6B7B8E', '#8E8B6B', '#6B8E8B', '#8B6B7B']

// ===== HELPERS =====
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Unknown'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function getPages(content: string): string[] {
  if (!content) return ['']
  const pages: string[] = []
  for (let i = 0; i < content.length; i += PAGES_CHAR_LIMIT) {
    pages.push(content.substring(i, i + PAGES_CHAR_LIMIT))
  }
  return pages.length > 0 ? pages : ['']
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-200/60',
  green: 'bg-green-200/60',
  blue: 'bg-blue-200/60',
  pink: 'bg-pink-200/60',
}

const HIGHLIGHT_BORDER_COLORS: Record<string, string> = {
  yellow: 'border-l-yellow-400',
  green: 'border-l-green-400',
  blue: 'border-l-blue-400',
  pink: 'border-l-pink-400',
}

// ===== ERROR BOUNDARY =====
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ===== SIDEBAR NAV =====
function SidebarNav({ activeScreen, onNavigate, collapsed, onToggle }: {
  activeScreen: string
  onNavigate: (screen: string) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const navItems = [
    { id: 'library', label: 'Library', icon: FiBook },
    { id: 'reader', label: 'Reader', icon: FiBookOpen },
    { id: 'annotations', label: 'Notes', icon: FiEdit3 },
  ]

  return (
    <div className={cn("h-full border-r border-border bg-card flex flex-col transition-all duration-300 flex-shrink-0", collapsed ? "w-14" : "w-44")}>
      <div className="p-3 flex items-center justify-between border-b border-border min-h-[48px]">
        {!collapsed && <span className="font-serif font-semibold text-foreground text-sm tracking-tight">Menu</span>}
        <button onClick={onToggle} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground mx-auto">
          <FiMenu className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => onNavigate(item.id)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200", collapsed && "justify-center px-2", activeScreen === item.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right"><p className="text-xs">{item.label}</p></TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", collapsed && "justify-center")}>
          <HiOutlineSparkles className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
          {!collapsed && <span>AI-Powered</span>}
        </div>
      </div>
    </div>
  )
}

// ===== UPLOAD DROPZONE =====
function UploadDropzone({ onUpload, uploading, statusMsg }: {
  onUpload: (file: File) => void
  uploading: boolean
  statusMsg: string
}) {
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }, [onUpload])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    if (fileRef.current) fileRef.current.value = ''
  }, [onUpload])

  return (
    <div onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()} className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200", dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50")}>
      <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleChange} className="hidden" />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Uploading and processing...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <FiUpload className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Drop a book here or click to upload</p>
          <p className="text-xs text-muted-foreground">Supports PDF, DOCX, TXT</p>
        </div>
      )}
      {statusMsg && <p className={cn("text-xs mt-2", statusMsg.toLowerCase().includes('error') || statusMsg.toLowerCase().includes('unsupported') ? "text-destructive" : "text-primary")}>{statusMsg}</p>}
    </div>
  )
}

// ===== BOOK CARD =====
function BookCard({ book, onClick, onDelete }: {
  book: Book
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden bg-card" onClick={onClick}>
      <div className="h-36 flex items-end p-4 relative" style={{ backgroundColor: book.coverColor }}>
        <div className="flex-1">
          <FiBookOpen className="w-8 h-8 text-white/80 mb-2" />
        </div>
        <button onClick={onDelete} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-black/20 hover:bg-black/40 text-white">
          <FiTrash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-serif font-semibold text-sm text-card-foreground line-clamp-2 leading-snug">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><FiClock className="w-3 h-3" />{timeAgo(book.lastRead)}</span>
          <span>{book.progress}%</span>
        </div>
        <Progress value={book.progress} className="h-1" />
      </CardContent>
    </Card>
  )
}

// ===== CHAT PANEL =====
function ChatPanel({ open, onClose, chatMessages, onSend, loading }: {
  open: boolean
  onClose: () => void
  chatMessages: ChatMessage[]
  onSend: (msg: string) => void
  loading: boolean
}) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages, loading])

  const handleSend = useCallback(() => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }, [input, loading, onSend])

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-[380px] sm:w-[420px] p-0 flex flex-col bg-card">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base font-serif">
            <HiOutlineSparkles className="w-4 h-4 text-primary" />
            Book Assistant
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">Ask questions about your uploaded books</SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
              <FiMessageSquare className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Ask about your uploaded books</p>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-lg px-3 py-2.5", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                {msg.role === 'assistant' ? renderMarkdown(msg.content) : <p className="text-sm">{msg.content}</p>}

                {msg.role === 'assistant' && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <Collapsible className="mt-2">
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <FiFileText className="w-3 h-3" />
                      <span>{msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}</span>
                      <FiChevronDown className="w-3 h-3" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1.5 space-y-1">
                      {msg.sources.map((src, idx) => (
                        <p key={idx} className="text-xs bg-background/60 rounded px-2 py-1 text-muted-foreground italic">{src}</p>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {msg.role === 'assistant' && Array.isArray(msg.followUpQuestions) && msg.followUpQuestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.followUpQuestions.map((q, idx) => (
                      <button key={idx} onClick={() => onSend(q)} className="text-xs bg-background/60 hover:bg-background rounded-full px-2.5 py-1 text-foreground transition-colors border border-border">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-lg px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} placeholder="Ask about this book..." className="flex-1 text-sm bg-background" disabled={loading} />
            <Button size="sm" onClick={handleSend} disabled={!input.trim() || loading} className="px-3">
              <FiSend className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ===== LIBRARY SCREEN =====
function LibraryScreen({ books, onSelectBook, onUpload, uploading, uploadStatus, onDeleteBook, sampleMode }: {
  books: Book[]
  onSelectBook: (book: Book) => void
  onUpload: (file: File) => void
  uploading: boolean
  uploadStatus: string
  onDeleteBook: (id: string) => void
  sampleMode: boolean
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author' | 'progress'>('recent')
  const [showUpload, setShowUpload] = useState(false)

  const filteredBooks = useMemo(() => {
    let result = [...books]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    }
    switch (sortBy) {
      case 'title': result.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'author': result.sort((a, b) => a.author.localeCompare(b.author)); break
      case 'progress': result.sort((a, b) => b.progress - a.progress); break
      case 'recent': default: result.sort((a, b) => new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()); break
    }
    return result
  }, [books, searchQuery, sortBy])

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search books..." className="pl-9 bg-background" />
          </div>
          <div className="flex items-center gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="recent">Recently Read</option>
              <option value="title">By Title</option>
              <option value="author">By Author</option>
              <option value="progress">By Progress</option>
            </select>
            <div className="flex border border-border rounded-md overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={cn("p-1.5 transition-colors", viewMode === 'grid' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-secondary")}><FiGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={cn("p-1.5 transition-colors", viewMode === 'list' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-secondary")}><FiList className="w-4 h-4" /></button>
            </div>
            <Button onClick={() => setShowUpload(!showUpload)} size="sm" className="gap-1.5">
              <FiUpload className="w-3.5 h-3.5" />
              Upload Book
            </Button>
          </div>
        </div>

        {/* Upload zone */}
        {showUpload && (
          <UploadDropzone onUpload={onUpload} uploading={uploading} statusMsg={uploadStatus} />
        )}

        {/* Book grid / list */}
        {filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center mb-4">
              <FiBook className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-serif font-semibold text-lg text-foreground mb-1">
              {searchQuery ? 'No books found' : 'Upload your first book'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery ? 'Try a different search term' : 'Start building your personal library by uploading a PDF, DOCX, or TXT file'}
            </p>
            {!searchQuery && !showUpload && (
              <Button onClick={() => setShowUpload(true)} className="mt-4 gap-1.5" size="sm">
                <FiUpload className="w-3.5 h-3.5" />
                Upload a Book
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => onSelectBook(book)} onDelete={(e) => { e.stopPropagation(); onDeleteBook(book.id) }} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="cursor-pointer hover:shadow-md transition-all duration-200 bg-card" onClick={() => onSelectBook(book)}>
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="w-10 h-14 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: book.coverColor }}>
                    <FiBookOpen className="w-4 h-4 text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-sm text-card-foreground truncate">{book.title}</h3>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">{timeAgo(book.lastRead)}</span>
                    <div className="w-20 hidden md:block">
                      <Progress value={book.progress} className="h-1" />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{book.progress}%</span>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id) }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Agent info */}
        <Separator className="my-4" />
        <div className="pb-4">
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <HiOutlineSparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">Book Chat Agent</p>
                <p className="text-xs text-muted-foreground truncate">AI-powered Q&A about your uploaded books</p>
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {sampleMode ? 'Sample Mode' : 'Ready'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}

// ===== READER SCREEN =====
function ReaderScreen({ book, books, onUpdateBook, highlights, onAddHighlight, chatOpen, onToggleChat, onBack }: {
  book: Book | null
  books: Book[]
  onUpdateBook: (book: Book) => void
  highlights: Highlight[]
  onAddHighlight: (h: Highlight) => void
  chatOpen: boolean
  onToggleChat: () => void
  onBack: () => void
}) {
  const [showTOC, setShowTOC] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif')
  const [readingMode, setReadingMode] = useState<'light' | 'sepia'>('sepia')
  const [showToolbar, setShowToolbar] = useState(true)
  const [selectionPopover, setSelectionPopover] = useState<{ text: string; x: number; y: number } | null>(null)
  const [annotationDialog, setAnnotationDialog] = useState<{ text: string; color: 'yellow' | 'green' | 'blue' | 'pink' } | null>(null)
  const [annotationNote, setAnnotationNote] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const toolbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentAreaRef = useRef<HTMLDivElement>(null)

  const pages = useMemo(() => book ? getPages(book.content) : [''], [book])
  const currentPage = book?.currentPage ?? 0
  const totalPages = pages.length

  useEffect(() => {
    const resetTimer = () => {
      setShowToolbar(true)
      if (toolbarTimer.current) clearTimeout(toolbarTimer.current)
      toolbarTimer.current = setTimeout(() => setShowToolbar(false), 3000)
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 100) resetTimer()
    }
    window.addEventListener('mousemove', handleMouseMove)
    resetTimer()
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (toolbarTimer.current) clearTimeout(toolbarTimer.current)
    }
  }, [])

  const goToPage = useCallback((page: number) => {
    if (!book) return
    const clamped = Math.max(0, Math.min(page, totalPages - 1))
    const progress = totalPages > 1 ? Math.round((clamped / (totalPages - 1)) * 100) : 100
    onUpdateBook({ ...book, currentPage: clamped, progress, lastRead: new Date().toISOString() })
  }, [book, totalPages, onUpdateBook])

  const toggleBookmark = useCallback(() => {
    if (!book) return
    const bookmarks = Array.isArray(book.bookmarks) ? [...book.bookmarks] : []
    const idx = bookmarks.indexOf(currentPage)
    if (idx >= 0) bookmarks.splice(idx, 1)
    else bookmarks.push(currentPage)
    onUpdateBook({ ...book, bookmarks })
  }, [book, currentPage, onUpdateBook])

  const isBookmarked = Array.isArray(book?.bookmarks) && book.bookmarks.includes(currentPage)

  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectionPopover(null)
      return
    }
    const text = selection.toString().trim()
    if (!text || text.length < 3) {
      setSelectionPopover(null)
      return
    }
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setSelectionPopover({ text, x: rect.left + rect.width / 2, y: rect.top - 10 })
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelect)
    return () => document.removeEventListener('mouseup', handleTextSelect)
  }, [handleTextSelect])

  const handleHighlight = useCallback((color: 'yellow' | 'green' | 'blue' | 'pink') => {
    if (!selectionPopover || !book) return
    setAnnotationDialog({ text: selectionPopover.text, color })
    setAnnotationNote('')
    setSelectionPopover(null)
    window.getSelection()?.removeAllRanges()
  }, [selectionPopover, book])

  const confirmHighlight = useCallback(() => {
    if (!annotationDialog || !book) return
    const highlight: Highlight = {
      id: generateId(),
      bookId: book.id,
      text: annotationDialog.text,
      color: annotationDialog.color,
      note: annotationNote,
      pageIndex: currentPage,
      createdAt: new Date().toISOString(),
    }
    onAddHighlight(highlight)
    setAnnotationDialog(null)
    setAnnotationNote('')
  }, [annotationDialog, annotationNote, book, currentPage, onAddHighlight])

  const pageHighlights = useMemo(() => {
    if (!book) return []
    return highlights.filter(h => h.bookId === book.id && h.pageIndex === currentPage)
  }, [highlights, book, currentPage])

  const renderPageContent = useCallback((text: string) => {
    if (!text) return null

    const renderLine = (line: string, i: number) => {
      if (!line.trim()) return <br key={i} />
      const isHeader = /^(Chapter|Part|Section)\s/i.test(line.trim())

      let lineElements: React.ReactNode[] = [line]
      for (const h of pageHighlights) {
        const newElements: React.ReactNode[] = []
        for (const el of lineElements) {
          if (typeof el !== 'string') {
            newElements.push(el)
            continue
          }
          const idx = el.indexOf(h.text)
          if (idx >= 0) {
            if (idx > 0) newElements.push(el.substring(0, idx))
            newElements.push(
              <span key={`hl-${h.id}-${i}`} className={cn("px-0.5 rounded", HIGHLIGHT_COLORS[h.color] ?? 'bg-yellow-200/60')}>
                {h.text}
              </span>
            )
            if (idx + h.text.length < el.length) newElements.push(el.substring(idx + h.text.length))
          } else {
            newElements.push(el)
          }
        }
        lineElements = newElements
      }

      if (isHeader) {
        return <h3 key={i} className="font-serif font-semibold text-lg mt-6 mb-3 text-foreground">{lineElements}</h3>
      }
      return <p key={i} className="mb-3 text-foreground/90">{lineElements}</p>
    }

    return text.split('\n').map((line, i) => renderLine(line, i))
  }, [pageHighlights])

  if (!book) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <FiBookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="font-serif font-semibold text-lg text-foreground mb-1">No book selected</h3>
        <p className="text-sm text-muted-foreground mb-4">Select a book from your library to start reading</p>
        <Button onClick={onBack} variant="outline" size="sm" className="gap-1.5">
          <FiChevronLeft className="w-3.5 h-3.5" />
          Go to Library
        </Button>
      </div>
    )
  }

  const bgClass = readingMode === 'sepia' ? 'bg-[hsl(40,35%,95%)]' : 'bg-background'

  return (
    <div className={cn("flex-1 flex flex-col relative overflow-hidden", bgClass)}>
      {/* Reading progress bar */}
      <div className="absolute top-0 left-0 right-0 z-30 h-0.5">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${book.progress}%` }} />
      </div>

      {/* Floating toolbar */}
      <div className={cn("absolute top-2 left-1/2 -translate-x-1/2 z-20 transition-all duration-300", showToolbar ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none")}>
        <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-full px-2 py-1.5 shadow-md">
          <TooltipProvider>
            <Tooltip><TooltipTrigger asChild><button onClick={onBack} className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><FiChevronLeft className="w-4 h-4" /></button></TooltipTrigger><TooltipContent><p className="text-xs">Library</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><button onClick={() => setShowTOC(!showTOC)} className={cn("p-1.5 rounded-full transition-colors", showTOC ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground")}><FiList className="w-4 h-4" /></button></TooltipTrigger><TooltipContent><p className="text-xs">Contents</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><button onClick={() => setSearchOpen(!searchOpen)} className={cn("p-1.5 rounded-full transition-colors", searchOpen ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground")}><FiSearch className="w-4 h-4" /></button></TooltipTrigger><TooltipContent><p className="text-xs">Search</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><button onClick={toggleBookmark} className={cn("p-1.5 rounded-full transition-colors", isBookmarked ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground")}><FiBookmark className="w-4 h-4" /></button></TooltipTrigger><TooltipContent><p className="text-xs">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><button onClick={() => setShowSettings(true)} className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><FiSettings className="w-4 h-4" /></button></TooltipTrigger><TooltipContent><p className="text-xs">Settings</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><button onClick={onToggleChat} className={cn("p-1.5 rounded-full transition-colors", chatOpen ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground")}><FiMessageSquare className="w-4 h-4" /></button></TooltipTrigger><TooltipContent><p className="text-xs">AI Chat</p></TooltipContent></Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 w-80">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-2 shadow-md">
            <FiSearch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search in book..." className="h-7 text-sm border-0 p-0 focus-visible:ring-0 bg-transparent" autoFocus />
            <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="p-1 text-muted-foreground hover:text-foreground"><FiX className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden pt-2">
        {/* TOC sidebar */}
        {showTOC && (
          <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto flex-shrink-0">
            <h3 className="font-serif font-semibold text-sm mb-3 text-foreground">Contents</h3>
            {Array.isArray(book.chapters) && book.chapters.length > 0 ? (
              <div className="space-y-1">
                {book.chapters.map((ch, idx) => (
                  <button key={idx} onClick={() => goToPage(ch.startIndex)} className={cn("w-full text-left text-xs px-2 py-1.5 rounded transition-colors", currentPage === ch.startIndex ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                    {ch.title}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No chapters detected</p>
            )}

            {Array.isArray(book.bookmarks) && book.bookmarks.length > 0 && (
              <>
                <Separator className="my-3" />
                <h3 className="font-serif font-semibold text-sm mb-2 text-foreground">Bookmarks</h3>
                <div className="space-y-1">
                  {book.bookmarks.map((bm, idx) => (
                    <button key={idx} onClick={() => goToPage(bm)} className="w-full text-left text-xs px-2 py-1.5 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center gap-1.5">
                      <FiBookmark className="w-3 h-3 text-primary" />
                      Page {bm + 1}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto" ref={contentAreaRef}>
          <div className="max-w-2xl mx-auto px-8 py-12 select-text" style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight, fontFamily: fontFamily === 'serif' ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, sans-serif' }}>
            <h2 className="font-serif font-bold text-xl mb-1 text-foreground">{book.title}</h2>
            <p className="text-sm text-muted-foreground mb-8">{book.author}</p>
            <Separator className="mb-8" />
            {renderPageContent(pages[currentPage] ?? '')}
          </div>
        </div>
      </div>

      {/* Page navigation */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm px-6 py-2 flex items-center justify-between flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} className="gap-1 text-xs">
          <FiChevronLeft className="w-3.5 h-3.5" /> Previous
        </Button>
        <span className="text-xs text-muted-foreground">Page {currentPage + 1} of {totalPages}</span>
        <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="gap-1 text-xs">
          Next <FiChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Selection popover */}
      {selectionPopover && (
        <div className="fixed z-50 flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg p-1.5" style={{ left: Math.max(10, selectionPopover.x - 100), top: Math.max(10, selectionPopover.y - 44) }}>
          {(['yellow', 'green', 'blue', 'pink'] as const).map((color) => (
            <button key={color} onClick={() => handleHighlight(color)} className={cn("w-6 h-6 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110", color === 'yellow' ? 'bg-yellow-300' : color === 'green' ? 'bg-green-300' : color === 'blue' ? 'bg-blue-300' : 'bg-pink-300')} title={`Highlight ${color}`} />
          ))}
          <Separator orientation="vertical" className="h-5 mx-1" />
          <button onClick={() => { if (selectionPopover) { navigator.clipboard.writeText(selectionPopover.text).catch(() => {}); setSelectionPopover(null); window.getSelection()?.removeAllRanges() } }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground transition-colors" title="Copy">
            <FiCopy className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Annotation dialog */}
      <Dialog open={!!annotationDialog} onOpenChange={(o) => { if (!o) setAnnotationDialog(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">Add Annotation</DialogTitle>
            <DialogDescription className="text-xs">Add a note to your highlight</DialogDescription>
          </DialogHeader>
          {annotationDialog && (
            <div className="space-y-3">
              <div className={cn("p-2 rounded text-sm italic", HIGHLIGHT_COLORS[annotationDialog.color] ?? 'bg-yellow-200/60')}>
                {annotationDialog.text.length > 120 ? annotationDialog.text.substring(0, 120) + '...' : annotationDialog.text}
              </div>
              <Textarea value={annotationNote} onChange={(e) => setAnnotationNote(e.target.value)} placeholder="Add a note (optional)..." rows={3} className="text-sm" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setAnnotationDialog(null)}>Cancel</Button>
                <Button size="sm" onClick={confirmHighlight}>Save Highlight</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle className="font-serif text-base">Reading Settings</SheetTitle>
            <SheetDescription className="text-xs">Customize your reading experience</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <Label className="text-xs font-medium mb-2 block">Font Family</Label>
              <div className="flex gap-2">
                <Button variant={fontFamily === 'serif' ? 'default' : 'outline'} size="sm" onClick={() => setFontFamily('serif')} className="flex-1 font-serif">Serif</Button>
                <Button variant={fontFamily === 'sans' ? 'default' : 'outline'} size="sm" onClick={() => setFontFamily('sans')} className="flex-1 font-sans">Sans</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">Font Size: {fontSize}px</Label>
              <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={12} max={24} step={1} />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">Line Height: {lineHeight.toFixed(1)}</Label>
              <Slider value={[lineHeight * 10]} onValueChange={(v) => setLineHeight(v[0] / 10)} min={12} max={24} step={1} />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">Reading Mode</Label>
              <div className="flex gap-2">
                <Button variant={readingMode === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setReadingMode('light')} className="flex-1">Light</Button>
                <Button variant={readingMode === 'sepia' ? 'default' : 'outline'} size="sm" onClick={() => setReadingMode('sepia')} className="flex-1">Sepia</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ===== ANNOTATIONS SCREEN =====
function AnnotationsScreen({ highlights, books, onDeleteHighlight, onJumpToHighlight, onExport }: {
  highlights: Highlight[]
  books: Book[]
  onDeleteHighlight: (id: string) => void
  onJumpToHighlight: (h: Highlight) => void
  onExport: () => void
}) {
  const [filterBook, setFilterBook] = useState('all')
  const [filterColor, setFilterColor] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredHighlights = useMemo(() => {
    let result = [...highlights]
    if (filterBook !== 'all') result = result.filter(h => h.bookId === filterBook)
    if (filterColor !== 'all') result = result.filter(h => h.color === filterColor)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(h => h.text.toLowerCase().includes(q) || (h.note ?? '').toLowerCase().includes(q))
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return result
  }, [highlights, filterBook, filterColor, searchQuery])

  const getBookTitle = useCallback((bookId: string) => {
    return books.find(b => b.id === bookId)?.title ?? 'Unknown Book'
  }, [books])

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Filter sidebar */}
      <div className="w-56 border-r border-border bg-card p-4 flex-shrink-0 overflow-y-auto hidden md:block">
        <h3 className="font-serif font-semibold text-sm mb-4 text-foreground">Filters</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Book</Label>
            <select value={filterBook} onChange={(e) => setFilterBook(e.target.value)} className="w-full text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="all">All Books</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Color</Label>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterColor('all')} className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 bg-gradient-to-br from-yellow-300 via-green-300 to-blue-300", filterColor === 'all' ? "ring-2 ring-primary ring-offset-1" : "")} title="All" />
              {(['yellow', 'green', 'blue', 'pink'] as const).map((c) => (
                <button key={c} onClick={() => setFilterColor(filterColor === c ? 'all' : c)} className={cn("w-6 h-6 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110", c === 'yellow' ? 'bg-yellow-300' : c === 'green' ? 'bg-green-300' : c === 'blue' ? 'bg-blue-300' : 'bg-pink-300', filterColor === c ? "ring-2 ring-primary ring-offset-1" : "")} title={c} />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Search</Label>
            <div className="relative">
              <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes..." className="h-7 text-xs pl-7 bg-background" />
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        <Button variant="outline" size="sm" onClick={onExport} className="w-full gap-1.5 text-xs" disabled={highlights.length === 0}>
          <FiDownload className="w-3 h-3" /> Export All
        </Button>
      </div>

      {/* Annotation cards */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif font-semibold text-lg text-foreground">Annotations & Notes</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredHighlights.length} highlight{filteredHighlights.length !== 1 ? 's' : ''}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5 text-xs md:hidden" disabled={highlights.length === 0}>
              <FiDownload className="w-3 h-3" /> Export
            </Button>
          </div>

          {filteredHighlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BiHighlight className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-serif font-semibold text-lg text-foreground mb-1">
                {highlights.length === 0 ? 'No highlights yet' : 'No matching highlights'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {highlights.length === 0 ? 'Select text while reading to create highlights and annotations' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHighlights.map((h) => (
                <Card key={h.id} className={cn("bg-card border-l-4 cursor-pointer hover:shadow-md transition-all duration-200", HIGHLIGHT_BORDER_COLORS[h.color] ?? 'border-l-yellow-400')} onClick={() => onJumpToHighlight(h)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm italic rounded px-1 py-0.5 inline", HIGHLIGHT_COLORS[h.color] ?? 'bg-yellow-200/60')}>
                          &ldquo;{h.text}&rdquo;
                        </p>
                        {h.note && (
                          <p className="text-sm text-foreground mt-2 flex items-start gap-1.5">
                            <FiEdit3 className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            {h.note}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><FiBook className="w-3 h-3" />{getBookTitle(h.bookId)}</span>
                          <span>Page {h.pageIndex + 1}</span>
                          <span>{timeAgo(h.createdAt)}</span>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteHighlight(h.id) }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ===== MAIN PAGE =====
export default function Page() {
  const [activeScreen, setActiveScreen] = useState('library')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const savedBooks = localStorage.getItem('bookshelf_books')
      const savedHighlights = localStorage.getItem('bookshelf_highlights')
      const savedChat = localStorage.getItem('bookshelf_chat')
      if (savedBooks) setBooks(JSON.parse(savedBooks))
      if (savedHighlights) setHighlights(JSON.parse(savedHighlights))
      if (savedChat) setChatMessages(JSON.parse(savedChat))
    } catch (e) {
      // silently ignore
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!mounted || sampleMode) return
    try { localStorage.setItem('bookshelf_books', JSON.stringify(books)) } catch (e) { /* */ }
  }, [books, mounted, sampleMode])

  useEffect(() => {
    if (!mounted || sampleMode) return
    try { localStorage.setItem('bookshelf_highlights', JSON.stringify(highlights)) } catch (e) { /* */ }
  }, [highlights, mounted, sampleMode])

  useEffect(() => {
    if (!mounted || sampleMode) return
    try { localStorage.setItem('bookshelf_chat', JSON.stringify(chatMessages)) } catch (e) { /* */ }
  }, [chatMessages, mounted, sampleMode])

  // Sample mode
  useEffect(() => {
    if (!mounted) return
    if (sampleMode) {
      setBooks(SAMPLE_BOOKS)
      setHighlights(SAMPLE_HIGHLIGHTS)
      setChatMessages(SAMPLE_CHAT)
      setSelectedBook(SAMPLE_BOOKS[0])
    } else {
      try {
        const savedBooks = localStorage.getItem('bookshelf_books')
        const savedHighlights = localStorage.getItem('bookshelf_highlights')
        const savedChat = localStorage.getItem('bookshelf_chat')
        setBooks(savedBooks ? JSON.parse(savedBooks) : [])
        setHighlights(savedHighlights ? JSON.parse(savedHighlights) : [])
        setChatMessages(savedChat ? JSON.parse(savedChat) : [])
        setSelectedBook(null)
      } catch (e) {
        setBooks([])
        setHighlights([])
        setChatMessages([])
        setSelectedBook(null)
      }
    }
  }, [sampleMode, mounted])

  // Upload handler
  const handleUpload = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      setUploadStatus(validation.error ?? 'Unsupported file type')
      return
    }
    setUploading(true)
    setUploadStatus('')

    try {
      const uploadResult = await uploadAndTrainDocument(RAG_ID, file)

      let content = ''
      if (file.type === 'text/plain') {
        content = await file.text()
      } else {
        content = `[Content from ${file.name}]\n\nThis document has been uploaded and indexed for AI search. Use the chat panel to ask questions about this book.\n\nFile: ${file.name}\nType: ${file.type === 'application/pdf' ? 'PDF' : 'DOCX'}\nSize: ${(file.size / 1024).toFixed(1)} KB`
      }

      const chapters: Chapter[] = []
      const lines = content.split('\n')
      lines.forEach((line) => {
        if (/^(Chapter|Part|Section)\s/i.test(line.trim())) {
          const charIdx = content.indexOf(line)
          const pageIdx = Math.floor(charIdx / PAGES_CHAR_LIMIT)
          chapters.push({ title: line.trim(), startIndex: pageIdx })
        }
      })

      const titleFromName = file.name.replace(/\.(pdf|docx|txt)$/i, '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

      const newBook: Book = {
        id: generateId(),
        title: titleFromName,
        author: 'Unknown',
        fileName: file.name,
        content,
        chapters,
        progress: 0,
        lastRead: new Date().toISOString(),
        uploadDate: new Date().toISOString(),
        coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
        bookmarks: [],
        currentPage: 0,
      }

      setBooks(prev => [newBook, ...prev])
      setUploadStatus(uploadResult.success ? 'Book uploaded and indexed successfully' : `Uploaded locally. Indexing: ${uploadResult.error ?? 'pending'}`)
    } catch (err) {
      setUploadStatus('Error uploading book. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [])

  const handleDeleteBook = useCallback((id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id))
    setHighlights(prev => prev.filter(h => h.bookId !== id))
    if (selectedBook?.id === id) setSelectedBook(null)
  }, [selectedBook])

  const handleUpdateBook = useCallback((updated: Book) => {
    setBooks(prev => prev.map(b => b.id === updated.id ? updated : b))
    setSelectedBook(prev => prev?.id === updated.id ? updated : prev)
  }, [])

  const handleAddHighlight = useCallback((h: Highlight) => {
    setHighlights(prev => [h, ...prev])
  }, [])

  const handleDeleteHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id))
  }, [])

  // Chat send
  const handleChatSend = useCallback(async (message: string) => {
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }
    setChatMessages(prev => [...prev, userMsg])
    setChatLoading(true)
    setActiveAgentId(AGENT_ID)

    try {
      const result = await callAIAgent(message, AGENT_ID)

      if (result.success) {
        const answer = result?.response?.result?.answer ?? result?.response?.message ?? 'I could not generate an answer.'
        const sources = Array.isArray(result?.response?.result?.sources) ? result.response.result.sources : []
        const followUps = Array.isArray(result?.response?.result?.follow_up_questions) ? result.response.result.follow_up_questions : []

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: answer,
          sources,
          followUpQuestions: followUps,
          timestamp: new Date().toISOString(),
        }
        setChatMessages(prev => [...prev, assistantMsg])
      } else {
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${result?.error ?? 'Unknown error'}. Please try again.`,
          timestamp: new Date().toISOString(),
        }
        setChatMessages(prev => [...prev, errorMsg])
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'A network error occurred. Please check your connection and try again.',
        timestamp: new Date().toISOString(),
      }
      setChatMessages(prev => [...prev, errorMsg])
    } finally {
      setChatLoading(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleSelectBook = useCallback((book: Book) => {
    const updated = { ...book, lastRead: new Date().toISOString() }
    setBooks(prev => prev.map(b => b.id === book.id ? updated : b))
    setSelectedBook(updated)
    setActiveScreen('reader')
  }, [])

  const handleJumpToHighlight = useCallback((h: Highlight) => {
    const book = books.find(b => b.id === h.bookId)
    if (book) {
      const updated = { ...book, currentPage: h.pageIndex, lastRead: new Date().toISOString() }
      setBooks(prev => prev.map(b => b.id === updated.id ? updated : b))
      setSelectedBook(updated)
      setActiveScreen('reader')
    }
  }, [books])

  const handleExportAnnotations = useCallback(() => {
    if (highlights.length === 0) return
    let text = 'BookShelf - Annotations Export\n'
    text += '================================\n\n'
    highlights.forEach((h) => {
      const bookTitle = books.find(b => b.id === h.bookId)?.title ?? 'Unknown Book'
      text += `Book: ${bookTitle}\n`
      text += `Color: ${h.color}\n`
      text += `Page: ${h.pageIndex + 1}\n`
      text += `Highlight: "${h.text}"\n`
      if (h.note) text += `Note: ${h.note}\n`
      text += `Date: ${new Date(h.createdAt).toLocaleString()}\n`
      text += '---\n\n'
    })
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bookshelf-annotations.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [highlights, books])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading BookShelf...</p>
        </div>
      </div>
    )
  }

  return (
    <PageErrorBoundary>
      <div className="min-h-screen h-screen flex flex-col bg-background text-foreground">
        {/* Header */}
        <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <FiBook className="w-5 h-5 text-primary" />
            <span className="font-serif font-semibold text-foreground tracking-tight">BookShelf</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">Sample Data</Label>
              <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
            </div>
            <Separator orientation="vertical" className="h-5" />
            <button onClick={() => setChatOpen(true)} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground relative" title="Open AI Chat">
              <FiMessageSquare className="w-4 h-4" />
              {activeAgentId && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />}
            </button>
          </div>
        </header>

        {/* Main layout */}
        <div className="flex-1 flex overflow-hidden">
          <SidebarNav activeScreen={activeScreen} onNavigate={setActiveScreen} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

          {activeScreen === 'library' && (
            <LibraryScreen books={books} onSelectBook={handleSelectBook} onUpload={handleUpload} uploading={uploading} uploadStatus={uploadStatus} onDeleteBook={handleDeleteBook} sampleMode={sampleMode} />
          )}

          {activeScreen === 'reader' && (
            <ReaderScreen book={selectedBook} books={books} onUpdateBook={handleUpdateBook} highlights={highlights} onAddHighlight={handleAddHighlight} chatOpen={chatOpen} onToggleChat={() => setChatOpen(!chatOpen)} onBack={() => setActiveScreen('library')} />
          )}

          {activeScreen === 'annotations' && (
            <AnnotationsScreen highlights={highlights} books={books} onDeleteHighlight={handleDeleteHighlight} onJumpToHighlight={handleJumpToHighlight} onExport={handleExportAnnotations} />
          )}
        </div>

        {/* Chat panel */}
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} chatMessages={chatMessages} onSend={handleChatSend} loading={chatLoading} />
      </div>
    </PageErrorBoundary>
  )
}
