
import { IDataProvider, SyncStatus } from '../core/dataProvider';
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
} from '../core/types';

// Constants for Storage Keys
const STORAGE_API_URL = 'APP_GAS_URL';
const STORAGE_API_KEY = 'APP_API_KEY';
const CURRENT_USER_KEY = 'homeroom_current_user';
const CACHE_KEY = 'homeroom_google_cache_v4';

interface CacheDB {
  users: User[];
  classes: ClassInfo[];
  students: Student[];
  parents: Parent[];
  attendance: Attendance[];
  behaviors: Behavior[];
  announcements: Announcement[];
  documents: Document[];
  tasks: Task[];
  taskReplies: TaskReply[];
  threads: MessageThread[];
  messages: Message[];
  questions: Question[];
  lastSync: string | null;
}

const DEFAULT_CACHE: CacheDB = {
  users: [], classes: [], students: [], parents: [], attendance: [], behaviors: [],
  announcements: [], documents: [], tasks: [], taskReplies: [],
  threads: [], messages: [], questions: [], lastSync: null
};

export class GoogleProvider implements IDataProvider {
  private cache: CacheDB;
  private syncStatus: SyncStatus = 'IDLE';
  private listeners: ((status: SyncStatus, lastSync: Date | null) => void)[] = [];
  
  // Kiểm tra môi trường
  private isDev = (import.meta as any).env?.DEV; 

  constructor() {
    this.cache = this.loadCache();
  }

  // --- Configuration Helpers ---
  
  // Hàm này xác định URL cần gọi
  private getEndpoint(): string {
    // 1. Chế độ Development (Localhost)
    if (this.isDev) {
       const local = localStorage.getItem(STORAGE_API_URL);
       if (local) return local;
       return (import.meta as any).env?.VITE_GAS_URL || '';
    }
    
    // 2. Chế độ Production trên Netlify
    // Sử dụng Netlify Functions làm Proxy
    return '/.netlify/functions/api'; 
  }

  // Chỉ dùng khi ở chế độ Development
  private getDevApiKey(): string {
    if (!this.isDev) return ''; 
    const local = localStorage.getItem(STORAGE_API_KEY);
    if (local) return local;
    return (import.meta as any).env?.VITE_API_KEY || '';
  }

  // --- Settings Accessors ---
  getApiUrl(): string { return this.getEndpoint(); }
  getApiKey(): string { return this.isDev ? this.getDevApiKey() : 'SECURE_MODE'; }
  setApiUrl(url: string): void { localStorage.setItem(STORAGE_API_URL, url); }
  setApiKey(key: string): void { localStorage.setItem(STORAGE_API_KEY, key); }

  // --- Unified Request Helper ---
  private async gasRequest(action: string, data: any = {}): Promise<any> {
    const endpoint = this.getEndpoint();
    const devKey = this.getDevApiKey();

    if (this.isDev && (!endpoint || !devKey)) {
        this.setSyncStatus('NOT_CONFIGURED');
        throw new Error("DEV MODE: Chưa cấu hình VITE_GAS_URL và VITE_API_KEY trong file .env");
    }

    // Payload: Production (Netlify Proxy) tự chèn Key, Dev gửi Key từ client
    const payload: any = {
      action: action,
      data: data
    };

    if (this.isDev) {
      payload.apiKey = devKey;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });

      const textResult = await response.text();
      let result;
      try {
        result = JSON.parse(textResult);
      } catch (e) {
        console.error("Raw response:", textResult);
        throw new Error("Server trả về dữ liệu lỗi. Kiểm tra Logs Netlify Functions.");
      }
      
      if (!result.ok) {
        throw new Error(result.error || 'Lỗi API không xác định');
      }
      
      return result.data;
    } catch (error: any) {
      console.error(`API Error [${action}]:`, error);
      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.gasRequest('ping');
      return response === 'pong';
    } catch (e) {
      console.error('Connection Check Failed:', e);
      return false;
    }
  }

  async init(): Promise<void> {
    if (!this.isDev) {
       this.setSyncStatus('IDLE');
    } else {
       if (this.getEndpoint() && this.getDevApiKey()) {
         this.setSyncStatus('IDLE');
       } else {
         this.setSyncStatus('NOT_CONFIGURED');
       }
    }
    return Promise.resolve();
  }

  // --- Standard Logic Below (No changes needed) ---

  private loadCache(): CacheDB {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_CACHE, ...parsed };
      } catch (e) {
        return DEFAULT_CACHE;
      }
    }
    return DEFAULT_CACHE;
  }

  private saveCache() {
    localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
  }

  private setSyncStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.notifyListeners();
  }

  private notifyListeners() {
    const lastSyncDate = this.cache.lastSync ? new Date(this.cache.lastSync) : null;
    this.listeners.forEach(cb => cb(this.syncStatus, lastSyncDate));
  }

  subscribe(callback: (status: SyncStatus, lastSync: Date | null) => void): () => void {
    this.listeners.push(callback);
    const lastSyncDate = this.cache.lastSync ? new Date(this.cache.lastSync) : null;
    callback(this.syncStatus, lastSyncDate);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  getSyncState() {
    return {
      status: this.syncStatus,
      lastSync: this.cache.lastSync ? new Date(this.cache.lastSync) : null
    };
  }

  private processSyncData(data: any) {
      const {
        users, classes, students, parents, attendance, behaviors,
        announcements, documents, tasks, taskReplies,
        threads, messages, questions
      } = data;

      const normalizeDate = (d: string) => d && d.includes('T') ? d.split('T')[0] : d;
      if (attendance) attendance.forEach((a: any) => a.date = normalizeDate(a.date));
      if (behaviors) behaviors.forEach((b: any) => b.date = normalizeDate(b.date));

      if (students) {
        students.forEach((s: any) => {
           s.xp = Number(s.xp) || 0;
           s.level = Number(s.level) || 1;
        });
      }

      this.cache = {
        ...this.cache,
        users: users || [], 
        classes: classes || [], 
        students: students || [], 
        parents: parents || [], 
        attendance: attendance || [], 
        behaviors: behaviors || [],
        announcements: announcements || [], 
        documents: documents || [], 
        tasks: tasks || [], 
        taskReplies: taskReplies || [],
        threads: threads || [], 
        messages: messages || [], 
        questions: questions || [],
        lastSync: new Date().toISOString()
      };
      
      this.saveCache();
  }

  async sync(): Promise<void> {
    if (this.syncStatus === 'SYNCING') return;
    
    if (this.isDev && (!this.getEndpoint() || !this.getDevApiKey())) {
      this.setSyncStatus('NOT_CONFIGURED');
      return;
    }

    this.setSyncStatus('SYNCING');

    try {
      try {
        const allData = await this.gasRequest('data.syncAll');
        this.processSyncData(allData);
        this.setSyncStatus('IDLE');
        return;
      } catch (err: any) {
        const msg = err.message || '';
        if (msg.includes('Unknown table: data') || msg.includes('Invalid action format')) {
           console.warn('Backend mismatch, fallback to legacy sync.');
        } else {
           throw err;
        }
      }

      const users = await this.gasRequest('users.list');
      const classes = await this.gasRequest('classes.list');
      const students = await this.gasRequest('students.list');
      
      const parents = await this.gasRequest('parents.list');
      const attendance = await this.gasRequest('attendance.list');
      const behaviors = await this.gasRequest('behavior.list');
      
      const announcements = await this.gasRequest('announcements.list');
      const documents = await this.gasRequest('documents.list');
      const tasks = await this.gasRequest('tasks.list');
      
      const taskReplies = await this.gasRequest('taskReplies.list');
      const threads = await this.gasRequest('messageThreads.list');
      const messages = await this.gasRequest('messages.list');
      const questions = await this.gasRequest('questions.list');

      this.processSyncData({
        users, classes, students, parents, attendance, behaviors,
        announcements, documents, tasks, taskReplies,
        threads, messages, questions
      });
      
      this.setSyncStatus('IDLE');

    } catch (err) {
      this.setSyncStatus('ERROR');
      console.error('Full Sync Failed:', err);
    }
  }

  // --- Auth ---
  async login(username: string, password: string): Promise<User | null> {
    const cleanPayload = {
        username: String(username).trim(),
        password: String(password).trim()
    };
    const user = await this.gasRequest('auth.login', cleanPayload);
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    return user;
  }

  async register(user: Omit<User, 'id'>): Promise<User> {
    const cleanUser = {
        ...user,
        username: String(user.username).trim(),
        password: String(user.password).trim(),
        fullName: String(user.fullName).trim()
    };
    const newUser = await this.gasRequest('auth.register', cleanUser);
    if (newUser) {
       localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    }
    return newUser;
  }

  async getCurrentUser(): Promise<User | null> {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  // --- User Management ---
  async getUsers(): Promise<User[]> { return this.cache.users; }
  async addUser(user: User): Promise<void> {
    const newUser = await this.gasRequest('auth.register', user);
    this.cache.users.push(newUser); this.saveCache();
  }
  async updateUser(user: User): Promise<void> {
    const idx = this.cache.users.findIndex(u => u.id === user.id);
    if (idx !== -1) { this.cache.users[idx] = user; this.saveCache(); }
    await this.gasRequest('users.update', user);
  }
  async removeUser(id: string): Promise<void> {
    this.cache.users = this.cache.users.filter(u => u.id !== id); this.saveCache();
    await this.gasRequest('users.delete', { id });
  }

  // --- Classes ---
  async getClasses(): Promise<ClassInfo[]> { return this.cache.classes; }
  async addClass(info: ClassInfo): Promise<void> {
    this.cache.classes.push(info); this.saveCache();
    this.gasRequest('classes.create', info).catch(console.error);
  }
  async updateClass(info: ClassInfo): Promise<void> {
    const idx = this.cache.classes.findIndex(c => c.id === info.id);
    if (idx !== -1) { this.cache.classes[idx] = info; this.saveCache(); }
    this.gasRequest('classes.update', info).catch(console.error);
  }
  async removeClass(id: string): Promise<void> {
    this.cache.classes = this.cache.classes.filter(c => c.id !== id); this.saveCache();
    this.gasRequest('classes.delete', { id }).catch(console.error);
  }

  // --- Students ---
  async getStudents(): Promise<Student[]> { return this.cache.students; }
  async getStudentsByClass(classId: string): Promise<Student[]> { 
      return this.cache.students.filter(s => s.classId === classId); 
  }
  async addStudent(student: Student): Promise<void> {
    const s = { ...student, xp: student.xp || 0, level: student.level || 1 };
    this.cache.students.push(s); this.saveCache();
    this.gasRequest('students.create', s).catch(console.error);
  }
  async updateStudent(student: Student): Promise<void> {
    const idx = this.cache.students.findIndex(s => s.id === student.id);
    if (idx !== -1) { this.cache.students[idx] = student; this.saveCache(); }
    this.gasRequest('students.update', student).catch(console.error);
  }
  async removeStudent(id: string): Promise<void> {
    this.cache.students = this.cache.students.filter(s => s.id !== id); this.saveCache();
    this.gasRequest('students.delete', { id }).catch(console.error);
  }
  async updateStudentXP(studentId: string, points: number): Promise<Student> {
    const idx = this.cache.students.findIndex(s => s.id === studentId);
    if (idx === -1) throw new Error("Student not found");
    
    const s = this.cache.students[idx];
    const newXp = (Number(s.xp) || 0) + Number(points);
    const newLevel = Math.floor(newXp / 100) + 1;
    const updated = { ...s, xp: newXp, level: newLevel };
    
    this.cache.students[idx] = updated; 
    this.saveCache();
    this.gasRequest('students.update', updated).catch(console.error);
    return updated;
  }

  // --- Parents ---
  async getParents(): Promise<Parent[]> { return this.cache.parents; }
  async addParent(parent: Parent): Promise<void> {
    this.cache.parents.push(parent); this.saveCache();
    this.gasRequest('parents.create', parent).catch(console.error);
  }
  async updateParent(parent: Parent): Promise<void> {
    const idx = this.cache.parents.findIndex(p => p.id === parent.id);
    if (idx !== -1) { this.cache.parents[idx] = parent; this.saveCache(); }
    this.gasRequest('parents.update', parent).catch(console.error);
  }
  async removeParent(id: string): Promise<void> {
    this.cache.parents = this.cache.parents.filter(p => p.id !== id); this.saveCache();
    this.gasRequest('parents.delete', { id }).catch(console.error);
  }

  // --- Attendance ---
  async getAttendance(classId: string, date: string): Promise<Attendance[]> {
    const rawRecords = this.cache.attendance.filter(a => a.classId === classId && a.date.startsWith(date));
    const uniqueMap = new Map<string, Attendance>();
    rawRecords.forEach(record => uniqueMap.set(record.studentId, record));
    return Array.from(uniqueMap.values());
  }

  async getAttendanceRange(classId: string, startDate: string, endDate: string): Promise<Attendance[]> {
    const rawRecords = this.cache.attendance.filter(a => {
        const d = a.date.split('T')[0];
        return a.classId === classId && d >= startDate && d <= endDate;
    });
    const uniqueMap = new Map<string, Attendance>();
    rawRecords.forEach(record => {
       const key = `${record.studentId}_${record.date.split('T')[0]}`;
       uniqueMap.set(key, record);
    });
    return Array.from(uniqueMap.values());
  }

  async saveAttendance(classId: string, date: string, items: AttendanceItem[]): Promise<void> {
    const targetDatePrefix = date.split('T')[0]; 
    const promises: Promise<any>[] = [];

    items.forEach(item => {
        const existingIdx = this.cache.attendance.findIndex(a => 
            a.classId === classId && 
            a.studentId === item.studentId && 
            a.date.startsWith(targetDatePrefix)
        );

        if (existingIdx !== -1) {
            const existingRecord = this.cache.attendance[existingIdx];
            const updatedRecord = { ...existingRecord, status: item.status, note: item.note || '' };
            this.cache.attendance[existingIdx] = updatedRecord;
            promises.push(this.gasRequest('attendance.update', updatedRecord));
        } else {
            const newRecord: Attendance = {
                id: crypto.randomUUID(),
                classId,
                studentId: item.studentId,
                date: targetDatePrefix,
                status: item.status,
                note: item.note || ''
            };
            this.cache.attendance.push(newRecord);
            promises.push(this.gasRequest('attendance.create', newRecord));
        }
    });

    this.saveCache();
    Promise.all(promises).catch(err => console.error("Error syncing attendance:", err));
  }
  
  async getStudentAttendance(studentId: string, month: number, year: number): Promise<Attendance[]> {
     const prefix = `${year}-${month < 10 ? '0'+month : month}`;
     const rawRecords = this.cache.attendance.filter(a => a.studentId === studentId && a.date.startsWith(prefix));
     const uniqueMap = new Map<string, Attendance>();
     rawRecords.forEach(r => { uniqueMap.set(r.date.split('T')[0], r); });
     return Array.from(uniqueMap.values());
  }

  // --- Behaviors ---
  async getBehaviors(classId: string, startDate?: string, endDate?: string): Promise<Behavior[]> {
    let res = this.cache.behaviors.filter(b => b.classId === classId);
    if (startDate) res = res.filter(b => b.date.split('T')[0] >= startDate);
    if (endDate) res = res.filter(b => b.date.split('T')[0] <= endDate);
    return res.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async getStudentBehaviors(studentId: string): Promise<Behavior[]> {
    return this.cache.behaviors.filter(b => b.studentId === studentId);
  }
  async addBehavior(behavior: Behavior): Promise<void> {
    this.cache.behaviors.push(behavior); this.saveCache();
    this.gasRequest('behavior.create', behavior).catch(console.error);
  }
  async updateBehavior(behavior: Behavior): Promise<void> {
    const idx = this.cache.behaviors.findIndex(b => b.id === behavior.id);
    if(idx!==-1) { this.cache.behaviors[idx]=behavior; this.saveCache(); }
    this.gasRequest('behavior.update', behavior).catch(console.error);
  }
  async removeBehavior(id: string): Promise<void> {
    this.cache.behaviors = this.cache.behaviors.filter(b => b.id !== id); this.saveCache();
    this.gasRequest('behavior.delete', { id }).catch(console.error);
  }

  // --- Announcements ---
  async getAnnouncements(classId: string): Promise<Announcement[]> {
    const list = this.cache.announcements.filter(a => a.classId === classId);
    return list.sort((a,b) => {
        if (a.pinned === b.pinned) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return a.pinned ? -1 : 1;
    });
  }
  async addAnnouncement(a: Announcement): Promise<void> {
    this.cache.announcements.unshift(a); this.saveCache();
    this.gasRequest('announcements.create', a).catch(console.error);
  }
  async updateAnnouncement(a: Announcement): Promise<void> {
    const idx = this.cache.announcements.findIndex(i => i.id === a.id);
    if(idx!==-1) { this.cache.announcements[idx]=a; this.saveCache(); }
    this.gasRequest('announcements.update', a).catch(console.error);
  }
  async removeAnnouncement(id: string): Promise<void> {
    this.cache.announcements = this.cache.announcements.filter(i => i.id !== id); this.saveCache();
    this.gasRequest('announcements.delete', { id }).catch(console.error);
  }

  // --- Documents ---
  async getDocuments(classId: string): Promise<Document[]> {
    return this.cache.documents.filter(d => d.classId === classId);
  }
  async addDocument(d: Document): Promise<void> {
    this.cache.documents.unshift(d); this.saveCache();
    this.gasRequest('documents.create', d).catch(console.error);
  }
  async updateDocument(d: Document): Promise<void> {
    const idx = this.cache.documents.findIndex(i => i.id === d.id);
    if(idx!==-1) { this.cache.documents[idx]=d; this.saveCache(); }
    this.gasRequest('documents.update', d).catch(console.error);
  }
  async removeDocument(id: string): Promise<void> {
    this.cache.documents = this.cache.documents.filter(i => i.id !== id); this.saveCache();
    this.gasRequest('documents.delete', { id }).catch(console.error);
  }

  // --- Tasks ---
  async getTasks(classId: string): Promise<Task[]> {
    return this.cache.tasks.filter(t => t.classId === classId);
  }
  async addTask(t: Task): Promise<void> {
    this.cache.tasks.unshift(t); this.saveCache();
    this.gasRequest('tasks.create', t).catch(console.error);
  }
  async updateTask(t: Task): Promise<void> {
    const idx = this.cache.tasks.findIndex(i => i.id === t.id);
    if(idx!==-1) { this.cache.tasks[idx]=t; this.saveCache(); }
    this.gasRequest('tasks.update', t).catch(console.error);
  }
  async removeTask(id: string): Promise<void> {
    this.cache.tasks = this.cache.tasks.filter(i => i.id !== id); this.saveCache();
    this.gasRequest('tasks.delete', { id }).catch(console.error);
  }
  async getTaskReplies(taskId: string): Promise<TaskReply[]> {
    return this.cache.taskReplies.filter(r => r.taskId === taskId);
  }
  async replyTask(r: TaskReply): Promise<void> {
    const idx = this.cache.taskReplies.findIndex(x => x.taskId === r.taskId && x.studentId === r.studentId);
    if (idx !== -1) {
       this.cache.taskReplies[idx] = r;
       const existingId = this.cache.taskReplies[idx].id;
       this.gasRequest('taskReplies.update', { ...r, id: existingId }).catch(console.error);
    } else {
       this.cache.taskReplies.push(r);
       this.gasRequest('taskReplies.create', r).catch(console.error);
    }
    this.saveCache();
  }

  // --- Messages ---
  async getAllThreads(): Promise<MessageThread[]> {
    return this.cache.threads;
  }
  async getThreadByStudent(studentId: string): Promise<MessageThread> {
    let t = this.cache.threads.find(x => x.threadKey === studentId);
    if (t) return t;
    
    const s = this.cache.students.find(x => x.id === studentId);
    const cls = this.cache.classes.find(c => c.id === s?.classId);
    const newThread: MessageThread = {
        id: crypto.randomUUID(),
        threadKey: studentId,
        participantsJson: JSON.stringify({
            studentName: s?.fullName,
            className: cls?.className,
            teacherName: cls?.homeroomTeacher,
            parentName: 'PHHS'
        }),
        lastMessageAt: new Date().toISOString()
    };
    this.cache.threads.push(newThread);
    this.saveCache();
    
    this.gasRequest('messageThreads.create', newThread).catch(console.error);
    return newThread;
  }
  async getMessages(threadId: string): Promise<Message[]> {
    return this.cache.messages.filter(m => m.threadId === threadId);
  }
  async sendMessage(threadId: string, role: any, content: string): Promise<void> {
    const msg: Message = {
        id: crypto.randomUUID(),
        threadId, fromRole: role, content, createdAt: new Date().toISOString()
    };
    this.cache.messages.push(msg);
    const tIdx = this.cache.threads.findIndex(t => t.id === threadId);
    if (tIdx !== -1) {
        this.cache.threads[tIdx].lastMessageAt = msg.createdAt;
    }
    this.saveCache();
    
    this.gasRequest('messages.create', { threadId, fromRole: role, content }).catch(console.error);
    if (tIdx !== -1) {
       this.gasRequest('messageThreads.update', this.cache.threads[tIdx]).catch(() => {});
    }
  }

  // --- Reports ---
  async reportsWeekly(classId: string, startDate: string, endDate: string): Promise<Report> {
    const att = await this.getAttendanceRange(classId, startDate, endDate);
    const tasks = await this.getTasks(classId);
    const replies = await Promise.all(tasks.map(t => this.getTaskReplies(t.id)));
    const flatReplies = replies.flat();
    
    const totalStudents = (await this.getStudentsByClass(classId)).length;
    const absences = att.filter(a => a.status === 'Vắng').length;
    const lates = att.filter(a => a.status === 'Muộn').length;
    const totalAtt = att.length || 1;
    const rate = Math.round(((totalAtt - absences) / totalAtt) * 100);

    return { 
        id: 'r_local', title: 'Báo cáo tuần (Local)', type: 'WEEKLY', startDate, endDate, generatedDate: new Date().toISOString(), 
        content: { 
            attendanceRate: rate, totalAbsences: absences, totalLates: lates, 
            topPraise: [], topWarn: [], taskCompletionRate: 50, parentReplyCount: flatReplies.length, totalStudents 
        } 
    };
  }
  async reportsMonthly(classId: string, month: number, year: number): Promise<Report> {
     return this.reportsWeekly(classId, `${year}-${month}-01`, `${year}-${month}-30`);
  }

  // --- Questions (Game) ---
  async getQuestions(): Promise<Question[]> {
    return this.cache.questions;
  }
  async addQuestion(q: Question): Promise<void> {
    this.cache.questions.push(q); this.saveCache();
    this.gasRequest('questions.create', q).catch(console.error);
  }
  async updateQuestion(q: Question): Promise<void> {
    const idx = this.cache.questions.findIndex(i => i.id === q.id);
    if(idx!==-1) { this.cache.questions[idx]=q; this.saveCache(); }
    this.gasRequest('questions.update', q).catch(console.error);
  }
  async removeQuestion(id: string): Promise<void> {
    this.cache.questions = this.cache.questions.filter(i => i.id !== id); this.saveCache();
    this.gasRequest('questions.delete', { id }).catch(console.error);
  }
}
