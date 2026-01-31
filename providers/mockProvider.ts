
import { IDataProvider, SyncStatus } from '../core/dataProvider';
import {
  Attendance,
  AttendanceItem,
  Behavior,
  BehaviorType,
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
  QuestionType,
  User
} from '../core/types';

const STORAGE_KEY = 'homeroom_mock_db_v8';
const CURRENT_USER_KEY = 'homeroom_current_user';

interface MockDB {
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
}

export class MockProvider implements IDataProvider {
  private db: MockDB;

  constructor() {
    this.db = this.loadData();
  }

  // --- Configuration & Status ---
  getApiUrl(): string { return 'MOCK_URL'; }
  setApiUrl(url: string): void { console.log('Mock set URL:', url); }
  async checkConnection(): Promise<boolean> { return true; }

  // --- Sync Stubs ---
  async sync(): Promise<void> {
    // Mock sync is instantaneous
    return Promise.resolve();
  }
  
  subscribe(callback: (status: SyncStatus, lastSync: Date | null) => void): () => void {
    // Mock doesn't really sync, so just callback immediately
    callback('IDLE', new Date());
    return () => {};
  }
  
  getSyncState() {
    return { status: 'IDLE' as SyncStatus, lastSync: new Date() };
  }

  private loadData(): MockDB {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    return this.seedData();
  }

  private saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
  }

  private seedData(): MockDB {
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    const threadId = 'th1';
    
    const initialData: MockDB = {
      users: [
        { id: 'u1', username: 'admin', password: '123', fullName: 'Nguyễn Văn Thầy', role: 'TEACHER' },
        { id: 'u2', username: 'hs', password: '123', fullName: 'Nguyễn Văn A', role: 'STUDENT', linkedStudentId: 's1' },
        { id: 'u3', username: 'ph', password: '123', fullName: 'Trần Thị Mẹ', role: 'PARENT', linkedStudentId: 's1' }
      ],
      classes: [
        { id: 'c1', className: '10A1', schoolYear: '2023-2024', homeroomTeacher: 'Nguyễn Văn Thầy', note: 'Lớp chọn', grade: '10' },
        { id: 'c2', className: '10A2', schoolYear: '2023-2024', homeroomTeacher: 'Lê Thị Cô', note: '', grade: '10' }
      ],
      students: [
        { id: 's1', classId: 'c1', fullName: 'Nguyễn Văn A', dob: '2008-01-15', gender: 'Nam', studentCode: 'HS001', address: 'Hà Nội', status: 'Đang học', xp: 120, level: 2 },
        { id: 's2', classId: 'c1', fullName: 'Lê Thị B', dob: '2008-05-20', gender: 'Nữ', studentCode: 'HS002', address: 'Hà Nội', status: 'Đang học', xp: 50, level: 1 },
        { id: 's3', classId: 'c2', fullName: 'Trần Văn C', dob: '2008-09-10', gender: 'Nam', studentCode: 'HS003', address: 'Hà Nội', status: 'Đang học', xp: 0, level: 1 }
      ],
      parents: [
        { id: 'p1', fullName: 'Trần Thị Mẹ', phone: '0901234567', email: 'meA@gmail.com', relationship: 'Mẹ', studentId: 's1' },
        { id: 'p2', fullName: 'Lê Văn Bố', phone: '0909876543', email: 'boB@gmail.com', relationship: 'Bố', studentId: 's2' }
      ],
      attendance: [],
      behaviors: [
         { id: 'b1', studentId: 's1', classId: 'c1', date: new Date().toISOString().split('T')[0], type: BehaviorType.PRAISE, content: 'Phát biểu xây dựng bài', points: 10 }
      ],
      announcements: [
        { id: 'a1', classId: 'c1', title: 'Họp phụ huynh đầu năm', content: 'Kính mời quý phụ huynh tham gia họp vào 8h sáng Chủ Nhật.', target: 'parent', pinned: true, createdAt: new Date().toISOString() }
      ],
      documents: [
        { id: 'd1', classId: 'c1', title: 'Nội quy lớp học 2023', url: '#', category: 'Nội quy', createdAt: new Date().toISOString() }
      ],
      tasks: [
        { id: 't1', classId: 'c1', title: 'Nộp phiếu khảo sát', description: 'Các em điền phiếu khảo sát thông tin và nộp lại.', dueDate: tomorrow.toISOString().split('T')[0], requireReply: true, createdAt: yesterday.toISOString() }
      ],
      taskReplies: [],
      threads: [
        { id: threadId, threadKey: 's1', participantsJson: JSON.stringify({ studentName: 'Nguyễn Văn A', parentName: 'Trần Thị Mẹ', teacherName: 'Nguyễn Văn Thầy', className: '10A1' }), lastMessageAt: today.toISOString() }
      ],
      messages: [
        { id: 'm1', threadId: threadId, fromRole: 'TEACHER', content: 'Chào phụ huynh, tuần sau lớp có buổi họp ạ.', createdAt: yesterday.toISOString() },
        { id: 'm2', threadId: threadId, fromRole: 'PARENT', content: 'Vâng, tôi sẽ sắp xếp tham gia ạ.', createdAt: today.toISOString() }
      ],
      questions: [
        {
          id: 'q1',
          type: QuestionType.MULTIPLE_CHOICE,
          content: 'Thủ đô của Việt Nam là gì?',
          optionsJson: JSON.stringify(['Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội', 'Huế']),
          correctAnswerJson: JSON.stringify('Hà Nội'),
          points: 10
        },
        {
          id: 'q2',
          type: QuestionType.SHORT_ANSWER,
          content: '2 + 2 bằng mấy?',
          optionsJson: '[]',
          correctAnswerJson: JSON.stringify('4'),
          points: 10
        },
        {
           id: 'q3',
           type: QuestionType.SORTING,
           content: 'Sắp xếp các số sau theo thứ tự tăng dần',
           optionsJson: JSON.stringify(['1', '3', '5', '10']), // Correct order
           correctAnswerJson: JSON.stringify(['1', '3', '5', '10']),
           points: 15
        },
        {
           id: 'q4',
           type: QuestionType.MATCHING,
           content: 'Ghép quốc gia với thủ đô tương ứng',
           optionsJson: JSON.stringify([
               {key: 'Việt Nam', value: 'Hà Nội'},
               {key: 'Nhật Bản', value: 'Tokyo'},
               {key: 'Pháp', value: 'Paris'}
           ]),
           correctAnswerJson: '[]', // Logic handled in UI
           points: 20
        }
      ]
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }

  async init(): Promise<void> {
    return Promise.resolve();
  }

  // --- Auth ---
  async login(username: string, password: string): Promise<User | null> {
    const user = this.db.users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  }

  async register(user: Omit<User, 'id'>): Promise<User> {
    const exists = this.db.users.find(u => u.username === user.username);
    if (exists) throw new Error('Tên đăng nhập đã tồn tại');
    
    const newUser: User = { ...user, id: crypto.randomUUID() };
    this.db.users.push(newUser);
    this.saveData();
    // Auto login
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  }

  async getCurrentUser(): Promise<User | null> {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  // --- User Mgmt ---
  async getUsers(): Promise<User[]> { return Promise.resolve(this.db.users); }
  async addUser(user: User): Promise<void> { this.db.users.push(user); this.saveData(); }
  async updateUser(user: User): Promise<void> {
    const idx = this.db.users.findIndex(u => u.id === user.id);
    if (idx !== -1) { this.db.users[idx] = user; this.saveData(); }
  }
  async removeUser(id: string): Promise<void> {
    this.db.users = this.db.users.filter(u => u.id !== id);
    this.saveData();
  }

  // --- Classes ---
  async getClasses(): Promise<ClassInfo[]> { return Promise.resolve(this.db.classes); }
  async addClass(info: ClassInfo): Promise<void> { this.db.classes.push(info); this.saveData(); }
  async updateClass(info: ClassInfo): Promise<void> { const idx = this.db.classes.findIndex(c => c.id === info.id); if (idx !== -1) { this.db.classes[idx] = info; this.saveData(); } }
  async removeClass(id: string): Promise<void> { this.db.classes = this.db.classes.filter(c => c.id !== id); this.saveData(); }

  // --- Students ---
  async getStudents(): Promise<Student[]> { return Promise.resolve(this.db.students); }
  async getStudentsByClass(classId: string): Promise<Student[]> { return Promise.resolve(this.db.students.filter(s => s.classId === classId)); }
  async addStudent(student: Student): Promise<void> { this.db.students.push({ ...student, xp: 0, level: 1 }); this.saveData(); }
  
  async updateStudent(student: Student): Promise<void> {
    const idx = this.db.students.findIndex(s => s.id === student.id);
    if (idx !== -1) {
      this.db.students[idx] = student;
      this.saveData();
    }
  }

  async removeStudent(id: string): Promise<void> { this.db.students = this.db.students.filter(s => s.id !== id); this.saveData(); }

  async updateStudentXP(studentId: string, points: number): Promise<Student> {
    const idx = this.db.students.findIndex(s => s.id === studentId);
    if (idx !== -1) {
        const s = this.db.students[idx];
        let newXp = s.xp + points;
        const newLevel = Math.floor(newXp / 100) + 1;
        this.db.students[idx] = { ...s, xp: newXp, level: newLevel };
        this.saveData();
        return this.db.students[idx];
    }
    throw new Error('Student not found');
  }

  async getParents() { return Promise.resolve(this.db.parents); }
  async addParent(p: Parent) { this.db.parents.push(p); this.saveData(); }
  async updateParent(p: Parent) { const i = this.db.parents.findIndex(x => x.id === p.id); if (i!==-1) this.db.parents[i]=p; this.saveData(); }
  async removeParent(id: string) { this.db.parents = this.db.parents.filter(x => x.id !== id); this.saveData(); }
  
  async getAttendance(cid: string, d: string) { return Promise.resolve(this.db.attendance.filter(a => a.classId === cid && a.date === d)); }
  async getAttendanceRange(cid: string, s: string, e: string) { return Promise.resolve(this.db.attendance.filter(a => a.classId === cid && a.date >= s && a.date <= e)); }
  async saveAttendance(cid: string, d: string, items: AttendanceItem[]) {
      this.db.attendance = this.db.attendance.filter(a => !(a.classId === cid && a.date === d));
      items.forEach(i => this.db.attendance.push({ id: crypto.randomUUID(), classId: cid, date: d, studentId: i.studentId, status: i.status, note: i.note }));
      this.saveData();
  }
  async getStudentAttendance(sid: string, m: number, y: number) { 
      const prefix = `${y}-${m < 10 ? '0'+m : m}`; 
      return Promise.resolve(this.db.attendance.filter(a => a.studentId === sid && a.date.startsWith(prefix))); 
  }

  async getBehaviors(cid: string, s?: string, e?: string) {
      let r = this.db.behaviors.filter(b => b.classId === cid);
      if (s) r = r.filter(b => b.date >= s); if (e) r = r.filter(b => b.date <= e);
      return Promise.resolve(r.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }
  async getStudentBehaviors(sid: string) { return Promise.resolve(this.db.behaviors.filter(b => b.studentId === sid)); }
  async addBehavior(b: Behavior) { this.db.behaviors.push(b); this.saveData(); }
  async updateBehavior(b: Behavior) { const i=this.db.behaviors.findIndex(x=>x.id===b.id); if(i!==-1) this.db.behaviors[i]=b; this.saveData(); }
  async removeBehavior(id: string) { this.db.behaviors = this.db.behaviors.filter(x => x.id !== id); this.saveData(); }

  async getAnnouncements(cid: string) { return Promise.resolve(this.db.announcements.filter(a => a.classId === cid)); }
  async addAnnouncement(a: Announcement) { this.db.announcements.unshift(a); this.saveData(); }
  async updateAnnouncement(a: Announcement) { const i=this.db.announcements.findIndex(x=>x.id===a.id); if(i!==-1) this.db.announcements[i]=a; this.saveData(); }
  async removeAnnouncement(id: string) { this.db.announcements = this.db.announcements.filter(x => x.id !== id); this.saveData(); }

  async getDocuments(cid: string) { return Promise.resolve(this.db.documents.filter(d => d.classId === cid)); }
  async addDocument(d: Document) { this.db.documents.unshift(d); this.saveData(); }
  async updateDocument(d: Document) { const i=this.db.documents.findIndex(x=>x.id===d.id); if(i!==-1) this.db.documents[i]=d; this.saveData(); }
  async removeDocument(id: string) { this.db.documents = this.db.documents.filter(x => x.id !== id); this.saveData(); }

  async getTasks(cid: string) { return Promise.resolve(this.db.tasks.filter(t => t.classId === cid)); }
  async addTask(t: Task) { this.db.tasks.unshift(t); this.saveData(); }
  async updateTask(t: Task) { const i=this.db.tasks.findIndex(x=>x.id===t.id); if(i!==-1) this.db.tasks[i]=t; this.saveData(); }
  async removeTask(id: string) { this.db.tasks = this.db.tasks.filter(x => x.id !== id); this.saveData(); }
  async getTaskReplies(tid: string) { return Promise.resolve(this.db.taskReplies.filter(r => r.taskId === tid)); }
  async replyTask(r: TaskReply) { 
      const i = this.db.taskReplies.findIndex(x => x.taskId === r.taskId && x.studentId === r.studentId);
      if (i !== -1) this.db.taskReplies[i] = r; else this.db.taskReplies.push(r);
      this.saveData();
  }

  async getAllThreads() { return Promise.resolve(this.db.threads); }
  async getThreadByStudent(sid: string) {
      const ex = this.db.threads.find(t => t.threadKey === sid);
      if (ex) return ex;
      const s = this.db.students.find(x => x.id === sid);
      const cls = this.db.classes.find(c => c.id === s?.classId);
      const nt: MessageThread = { id: crypto.randomUUID(), threadKey: sid, participantsJson: JSON.stringify({studentName: s?.fullName, className: cls?.className}), lastMessageAt: new Date().toISOString() };
      this.db.threads.push(nt); this.saveData(); return nt;
  }
  async getMessages(tid: string) { return Promise.resolve(this.db.messages.filter(m => m.threadId === tid)); }
  async sendMessage(tid: string, role: any, c: string) {
      this.db.messages.push({ id: crypto.randomUUID(), threadId: tid, fromRole: role, content: c, createdAt: new Date().toISOString() });
      this.saveData();
  }

  async reportsWeekly(cid: string, s: string, e: string): Promise<Report> {
     return Promise.resolve({ id: 'r1', title: 'Báo cáo', type: 'WEEKLY', startDate: s, endDate: e, generatedDate: new Date().toISOString(), content: { attendanceRate: 100, totalAbsences: 0, totalLates: 0, topPraise: [], topWarn: [], taskCompletionRate: 0, parentReplyCount: 0, totalStudents: 0 } });
  }
  async reportsMonthly(cid: string, m: number, y: number): Promise<Report> {
      return Promise.resolve({ id: 'r2', title: 'Báo cáo', type: 'MONTHLY', startDate: '', endDate: '', generatedDate: new Date().toISOString(), content: { attendanceRate: 100, totalAbsences: 0, totalLates: 0, topPraise: [], topWarn: [], taskCompletionRate: 0, parentReplyCount: 0, totalStudents: 0 } });
  }

  async getQuestions(): Promise<Question[]> {
      return Promise.resolve(this.db.questions || []);
  }
  async addQuestion(q: Question): Promise<void> {
      if (!this.db.questions) this.db.questions = [];
      this.db.questions.push(q);
      this.saveData();
  }
  async updateQuestion(q: Question): Promise<void> {
      if (!this.db.questions) return;
      const idx = this.db.questions.findIndex(i => i.id === q.id);
      if (idx !== -1) {
          this.db.questions[idx] = q;
          this.saveData();
      }
  }
  async removeQuestion(id: string): Promise<void> {
      if (!this.db.questions) return;
      this.db.questions = this.db.questions.filter(i => i.id !== id);
      this.saveData();
  }
}
