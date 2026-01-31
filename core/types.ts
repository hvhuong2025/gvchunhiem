
export interface ClassInfo {
  id: string;
  className: string;
  schoolYear: string;
  homeroomTeacher: string;
  note?: string;
  grade?: string;
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  linkedStudentId?: string; // New field to link account to a student
}

export interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  relationship: string;
  studentId: string;
}

export interface Student {
  id: string;
  classId: string;
  fullName: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  studentCode: string;
  address?: string;
  parentId?: string;
  status: 'Đang học' | 'Đã nghỉ' | 'Bảo lưu';
  xp: number;   // New: Experience points
  level: number; // New: Current level
}

export enum AttendanceStatus {
  PRESENT = 'Có mặt',
  ABSENT = 'Vắng',
  LATE = 'Muộn',
  EXCUSED = 'Có phép'
}

export interface Attendance {
  id: string;
  classId: string; 
  studentId: string;
  date: string; // ISO Date YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceItem {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export enum BehaviorType {
  PRAISE = 'Khen ngợi',
  WARN = 'Nhắc nhở'
}

export interface Behavior {
  id: string;
  studentId: string;
  classId: string; // Helper for filtering
  date: string;
  type: BehaviorType;
  content: string; // Replaces description
  points: number;
}

export interface Announcement {
  id: string;
  classId: string;
  title: string;
  content: string;
  target: 'parent' | 'student' | 'all';
  pinned: boolean;
  createdAt: string; // ISO Date
}

export interface Document {
  id: string;
  classId: string;
  title: string;
  url: string;
  category: string; // Nội quy, Kế hoạch, Biểu mẫu...
  createdAt: string;
}

export interface Task {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string; // ISO Date YYYY-MM-DD or DateTime
  requireReply: boolean;
  createdAt: string;
}

export interface TaskReply {
  id: string;
  taskId: string;
  studentId: string;
  parentId?: string;
  replyText: string;
  attachmentsJson?: string; // JSON string of string[] (links)
  createdAt: string;
}

export type MessageRole = 'TEACHER' | 'PARENT' | 'STUDENT';

export interface Message {
  id: string;
  threadId: string;
  fromRole: MessageRole;
  content: string;
  createdAt: string; // ISO Date
}

export interface MessageThread {
  id: string;
  threadKey: string; // studentId (One thread per student-teacher pair)
  participantsJson: string; // JSON: { studentName: string, parentName: string, teacherName: string, className: string }
  lastMessageAt: string;
}

export interface ReportStats {
  attendanceRate: number;
  totalAbsences: number;
  totalLates: number;
  topPraise: { studentName: string; count: number; points: number }[];
  topWarn: { studentName: string; count: number }[];
  taskCompletionRate: number; // percentage
  parentReplyCount: number;
  totalStudents: number;
}

export interface Report {
  id: string;
  title: string;
  type: 'WEEKLY' | 'MONTHLY';
  startDate: string;
  endDate: string;
  generatedDate: string;
  content: ReportStats;
}

// --- NEW GAME TYPES ---

export enum QuestionType {
  MULTIPLE_CHOICE = 'Lựa chọn',
  SHORT_ANSWER = 'Trả lời ngắn',
  SORTING = 'Sắp xếp',
  MATCHING = 'Ghép cặp'
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string; // The question text
  optionsJson: string; // JSON array of strings (for MC, Sorting) or JSON array of {key, value} (for Matching)
  correctAnswerJson: string; // JSON string (MC: correct option, Short: text, Sort: ordered array, Match: pairs)
  points: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  minXp: number;
  color: string;
}
