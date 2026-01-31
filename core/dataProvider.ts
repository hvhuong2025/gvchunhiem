
import {
  Attendance,
  AttendanceItem,
  Behavior,
  ClassInfo,
  MessageThread,
  Message,
  Parent,
  Report,
  Student,
  Task,
  TaskReply,
  Announcement,
  Document,
  Question,
  User
} from './types';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'ERROR' | 'OFFLINE' | 'NOT_CONFIGURED';

export interface IDataProvider {
  // Initialization
  init(): Promise<void>;

  // --- Configuration & Status ---
  getApiUrl(): string;
  setApiUrl(url: string): void;
  checkConnection(): Promise<boolean>; // New: Test connection to backend

  // --- Sync & Status ---
  sync(): Promise<void>;
  subscribe(callback: (status: SyncStatus, lastSync: Date | null) => void): () => void;
  getSyncState(): { status: SyncStatus; lastSync: Date | null };

  // --- Auth & Users ---
  login(username: string, password: string): Promise<User | null>;
  register(user: Omit<User, 'id'>): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  logout(): Promise<void>;
  
  // User Management
  getUsers(): Promise<User[]>;
  addUser(user: User): Promise<void>;
  updateUser(user: User): Promise<void>;
  removeUser(id: string): Promise<void>;

  // --- Classes ---
  getClasses(): Promise<ClassInfo[]>;
  addClass(info: ClassInfo): Promise<void>;
  updateClass(info: ClassInfo): Promise<void>;
  removeClass(id: string): Promise<void>;

  // --- Students ---
  getStudents(): Promise<Student[]>; // Get all
  getStudentsByClass(classId: string): Promise<Student[]>; // Helper
  addStudent(student: Student): Promise<void>;
  updateStudent(student: Student): Promise<void>;
  removeStudent(id: string): Promise<void>;
  updateStudentXP(studentId: string, points: number): Promise<Student>; // New

  // --- Parents ---
  getParents(): Promise<Parent[]>;
  addParent(parent: Parent): Promise<void>;
  updateParent(parent: Parent): Promise<void>;
  removeParent(id: string): Promise<void>;

  // --- Attendance ---
  getAttendance(classId: string, date: string): Promise<Attendance[]>;
  getAttendanceRange(classId: string, startDate: string, endDate: string): Promise<Attendance[]>; // For Report/CSV
  saveAttendance(classId: string, date: string, items: AttendanceItem[]): Promise<void>;
  getStudentAttendance(studentId: string, month: number, year: number): Promise<Attendance[]>;
  
  // --- Behaviors ---
  getBehaviors(classId: string, startDate?: string, endDate?: string): Promise<Behavior[]>;
  getStudentBehaviors(studentId: string): Promise<Behavior[]>;
  addBehavior(behavior: Behavior): Promise<void>;
  updateBehavior(behavior: Behavior): Promise<void>;
  removeBehavior(id: string): Promise<void>;
  
  // --- Announcements ---
  getAnnouncements(classId: string): Promise<Announcement[]>;
  addAnnouncement(announcement: Announcement): Promise<void>;
  updateAnnouncement(announcement: Announcement): Promise<void>;
  removeAnnouncement(id: string): Promise<void>;

  // --- Documents ---
  getDocuments(classId: string): Promise<Document[]>;
  addDocument(doc: Document): Promise<void>;
  updateDocument(doc: Document): Promise<void>;
  removeDocument(id: string): Promise<void>;

  // --- Tasks ---
  getTasks(classId: string): Promise<Task[]>;
  addTask(task: Task): Promise<void>;
  updateTask(task: Task): Promise<void>;
  removeTask(id: string): Promise<void>;
  
  getTaskReplies(taskId: string): Promise<TaskReply[]>;
  replyTask(reply: TaskReply): Promise<void>;

  // --- Messages ---
  getAllThreads(): Promise<MessageThread[]>;
  getThreadByStudent(studentId: string): Promise<MessageThread>; // Get or Create
  getMessages(threadId: string): Promise<Message[]>;
  sendMessage(threadId: string, role: 'TEACHER' | 'PARENT' | 'STUDENT', content: string): Promise<void>;

  // --- Reports ---
  reportsWeekly(classId: string, startDate: string, endDate: string): Promise<Report>;
  reportsMonthly(classId: string, month: number, year: number): Promise<Report>;

  // --- Questions (Game) ---
  getQuestions(): Promise<Question[]>;
  addQuestion(q: Question): Promise<void>;
  updateQuestion(q: Question): Promise<void>;
  removeQuestion(id: string): Promise<void>;
}
