
import React, { useEffect, useState, useCallback } from 'react';
import provider from '../../core/provider';
import { Announcement, Behavior, BehaviorType, Student, User, Achievement } from '../../core/types';
import { Bell, Star, ThumbsUp, AlertTriangle, Pin, AlertCircle, Trophy, Crown, Medal, Award, Sparkles, Globe, Users } from 'lucide-react';

// Static Badge Definitions
const BADGES: Achievement[] = [
  { id: 'b1', title: 'Tân Binh', description: 'Bắt đầu hành trình học tập', minXp: 0, icon: '🌱', color: 'bg-green-100 text-green-600' },
  { id: 'b2', title: 'Siêu Trí Nhớ', description: 'Đạt 100 điểm kinh nghiệm', minXp: 100, icon: '🧠', color: 'bg-blue-100 text-blue-600' },
  { id: 'b3', title: 'Ong Chăm Chỉ', description: 'Đạt 500 điểm kinh nghiệm', minXp: 500, icon: '🐝', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'b4', title: 'Kiện Tướng', description: 'Đạt level 10 (1000 XP)', minXp: 1000, icon: '🛡️', color: 'bg-purple-100 text-purple-600' },
  { id: 'b5', title: 'Huyền Thoại', description: 'Đạt 5000 điểm kinh nghiệm', minXp: 5000, icon: '👑', color: 'bg-red-100 text-red-600' },
];

const ParentDashboard: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  
  // Data States
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [sortedClassmates, setSortedClassmates] = useState<Student[]>([]);
  
  // UI States
  const [topLimit, setTopLimit] = useState<number>(5);
  const [leaderboardScope, setLeaderboardScope] = useState<'CLASS' | 'SCHOOL'>('CLASS');
  const [earnedBadges, setEarnedBadges] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract data loading logic to reuse
  const loadDashboardData = useCallback(async () => {
      // Get current logged in user
      const user = await provider.getCurrentUser();
      setCurrentUser(user);
      
      const studentsList = await provider.getStudents();
      setAllStudents(studentsList);

      let currentStudent: Student | undefined;

      // Map user to student based on role and name or linkedStudentId
      if (user) {
        if (user.linkedStudentId) {
             currentStudent = studentsList.find(s => s.id === user.linkedStudentId);
        } else if (user.role === 'STUDENT') {
          currentStudent = studentsList.find(s => s.fullName.toLowerCase().trim() === user.fullName.toLowerCase().trim());
        } else if (user.role === 'PARENT') {
          const parents = await provider.getParents();
          const parentRecord = parents.find(p => p.fullName.toLowerCase().trim() === user.fullName.toLowerCase().trim());
          if (parentRecord) {
            currentStudent = studentsList.find(s => s.id === parentRecord.studentId);
          }
        }
      }

      setStudent(currentStudent || null);

      if (currentStudent) {
        // 1. Fetch Announcements
        const anns = await provider.getAnnouncements(currentStudent.classId);
        setAnnouncements(anns.slice(0, 5));

        // 2. Fetch Behaviors
        const behs = await provider.getStudentBehaviors(currentStudent.id);
        setBehaviors(behs.slice(0, 5));

        // 3. Badges
        const currentXp = currentStudent.xp || 0;
        const myBadges = BADGES.filter(b => currentXp >= b.minXp);
        setEarnedBadges(myBadges);
      }
      setLoading(false);
  }, []);

  useEffect(() => {
    // Initial load
    loadDashboardData();

    // Subscribe to provider updates (e.g. when background sync finishes)
    const unsubscribe = provider.subscribe((status) => {
      if (status === 'IDLE') {
        loadDashboardData();
      }
    });

    return () => unsubscribe();
  }, [loadDashboardData]);

  // Handle Leaderboard Filtering
  useEffect(() => {
    if (!student || allStudents.length === 0) return;

    let filtered = [];
    if (leaderboardScope === 'CLASS') {
        filtered = allStudents.filter(s => s.classId.trim() === student.classId.trim());
    } else {
        filtered = [...allStudents];
    }

    const sorted = filtered.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    setSortedClassmates(sorted);
  }, [allStudents, student, leaderboardScope]);


  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown size={16} className="text-yellow-500 fill-yellow-500" />;
      case 1: return <Medal size={16} className="text-gray-400 fill-gray-400" />;
      case 2: return <Medal size={16} className="text-orange-400 fill-orange-400" />;
      default: return <span className="text-xs font-bold text-gray-500">#{index + 1}</span>;
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Đang tải thông tin...</div>;

  if (!student) {
      return (
        <div className="max-w-4xl mx-auto">
             <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border-l-4 border-yellow-500">
                <h1 className="text-2xl font-bold text-gray-800">Xin chào, {currentUser?.fullName}</h1>
                <div className="mt-4 flex items-start gap-3 bg-yellow-50 p-4 rounded-lg text-yellow-800">
                    <AlertCircle className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Tài khoản chưa được liên kết hồ sơ học sinh</p>
                        <p className="text-sm mt-1">
                            Hệ thống không tìm thấy hồ sơ học sinh trùng khớp với tên của bạn. 
                            Vui lòng liên hệ GVCN để kiểm tra lại.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl shadow-md text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
                {currentUser?.role === 'STUDENT' 
                  ? `Chào ${student.fullName}!`
                  : `Phụ huynh em ${student.fullName}`
                }
            </h1>
            <p className="opacity-90 mt-1">
                Lớp: {student.classId === 'c1' ? '10A1' : (student.classId === 'c2' ? '10A2' : student.classId)} | MSSV: {student.studentCode}
            </p>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-3 px-6 text-center min-w-[120px]">
             <div className="text-xs font-medium uppercase tracking-wider opacity-80">Cấp Độ</div>
             <div className="text-3xl font-extrabold">{student.level || 1}</div>
             <div className="text-xs font-bold text-yellow-300">{student.xp || 0} XP</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Announcements & Behavior */}
        <div className="lg:col-span-2 space-y-6">
             {/* Announcements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Bell className="mr-2 text-red-500" size={20} /> Thông báo lớp học
              </h2>
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">Không có thông báo mới.</p>
                ) : (
                  announcements.map(ann => (
                    <div key={ann.id} className={`p-3 rounded-lg border ${ann.pinned ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {ann.pinned && <Pin size={14} className="text-yellow-600 fill-yellow-600" />}
                        <p className="font-semibold text-gray-800 text-sm line-clamp-1">{ann.title}</p>
                        <span className="text-[10px] text-gray-400 ml-auto whitespace-nowrap">{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{ann.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Behavior */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Star className="mr-2 text-yellow-500" size={20} /> Nhận xét gần đây
              </h2>
              <div className="space-y-3">
                {behaviors.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">Chưa có nhận xét nào.</p>
                ) : (
                  behaviors.map(beh => (
                    <div key={beh.id} className="flex items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                       <div className={`mt-0.5 rounded-full p-1 mr-3 ${beh.type === BehaviorType.PRAISE ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                         {beh.type === BehaviorType.PRAISE ? <ThumbsUp size={14} /> : <AlertTriangle size={14} />}
                       </div>
                      <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${beh.type === BehaviorType.PRAISE ? 'text-green-700' : 'text-red-700'}`}>{beh.type}</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${beh.points > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                                {beh.points > 0 ? '+' : ''}{beh.points} XP
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{beh.content}</p>
                        <span className="text-[10px] text-gray-400 block mt-1">{new Date(beh.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
        </div>

        {/* Right Column: Leaderboard & Badges */}
        <div className="space-y-6">
            
            {/* Badges Collection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
               <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                 <Award className="mr-2 text-purple-500" size={20} /> Huy Hiệu Của Bạn
               </h2>
               <div className="grid grid-cols-3 gap-3">
                  {BADGES.map((badge) => {
                      const isEarned = earnedBadges.some(b => b.id === badge.id);
                      return (
                        <div key={badge.id} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${isEarned ? badge.color + ' border-current bg-opacity-10' : 'bg-gray-50 border-gray-200 opacity-50 grayscale'}`} title={badge.description}>
                            <div className="text-2xl mb-1">{badge.icon}</div>
                            <span className="text-[10px] font-bold leading-tight">{badge.title}</span>
                            {!isEarned && <span className="text-[9px] mt-1 text-gray-400">{badge.minXp} XP</span>}
                        </div>
                      )
                  })}
               </div>
               <div className="mt-3 text-center">
                   <p className="text-xs text-gray-500">Hoàn thành bài tập và trò chơi để mở khóa!</p>
               </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
               <div className="flex flex-col mb-4">
                 <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center">
                        <Trophy className="mr-2 text-yellow-500" size={20} /> Bảng Vàng
                    </h2>
                    {/* Scope Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setLeaderboardScope('CLASS')}
                            className={`p-1.5 rounded-md transition-all ${leaderboardScope === 'CLASS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Lớp của tôi"
                        >
                            <Users size={16} />
                        </button>
                        <button 
                            onClick={() => setLeaderboardScope('SCHOOL')}
                            className={`p-1.5 rounded-md transition-all ${leaderboardScope === 'SCHOOL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Toàn trường"
                        >
                            <Globe size={16} />
                        </button>
                    </div>
                 </div>

                 <div className="flex gap-1 justify-center bg-gray-50 p-1 rounded-lg w-full">
                    {[3, 5, 10].map(limit => (
                      <button 
                        key={limit}
                        onClick={() => setTopLimit(limit)}
                        className={`text-[10px] px-3 py-1 flex-1 rounded-md transition-all ${
                          topLimit === limit 
                          ? 'bg-white text-yellow-700 shadow-sm font-bold border border-gray-100' 
                          : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Top {limit}
                      </button>
                    ))}
                 </div>
               </div>

               <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                 {sortedClassmates.slice(0, topLimit).map((s, idx) => {
                    const isMe = s.id === student.id;
                    return (
                        <div key={s.id} className={`flex items-center justify-between p-2 rounded-lg border ${isMe ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex justify-center font-bold text-sm">
                                    {getRankIcon(idx)}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-semibold truncate max-w-[120px] ${isMe ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {s.fullName} {isMe && '(Bạn)'}
                                    </span>
                                    <div className="flex items-center text-[10px] text-gray-400">
                                        Lv.{s.level || 1} • {leaderboardScope === 'SCHOOL' && s.classId !== student.classId ? `Lớp khác` : 'Lớp mình'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">
                                <Sparkles size={10} className="text-yellow-500" />
                                {s.xp || 0}
                            </div>
                        </div>
                    );
                 })}
                 {sortedClassmates.length === 0 && <p className="text-gray-400 text-sm text-center py-2">Chưa có dữ liệu.</p>}
                 
                 {leaderboardScope === 'CLASS' && sortedClassmates.length === 1 && (
                     <p className="text-xs text-center text-gray-400 mt-2 bg-gray-50 p-2 rounded">
                        Lớp học chưa có thành viên khác.<br/>
                        Chuyển sang <span className="font-bold text-gray-500"><Globe size={10} className="inline"/> Toàn trường</span> để xem xếp hạng mở rộng.
                     </p>
                 )}
               </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default ParentDashboard;
