
import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Announcement, BehaviorType, Student } from '../../core/types';
import { Users, Calendar, Bell, CheckCircle, Briefcase, Star, AlertTriangle, Trophy, Crown, Medal } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [classCount, setClassCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendanceRate, setAttendanceRate] = useState('100%');
  
  // Leaderboard state
  const [sortedStudents, setSortedStudents] = useState<Student[]>([]);
  const [topLimit, setTopLimit] = useState<number>(5);
  
  // Stats
  const [weeklyPraisePoints, setWeeklyPraisePoints] = useState(0);
  const [weeklyWarnings, setWeeklyWarnings] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const classes = await provider.getClasses();
      const students = await provider.getStudents();
      // Fetch all announcements from first class for demo overview
      const anns = classes.length > 0 ? await provider.getAnnouncements(classes[0].id) : [];
      
      const today = new Date().toISOString().split('T')[0];
      const attendanceResults = await Promise.all(
        classes.map(c => provider.getAttendance(c.id, today))
      );
      const attendance = attendanceResults.flat();
      
      setClassCount(classes.length);
      setStudentCount(students.length);
      setAnnouncements(anns.slice(0, 3)); 

      // Sort students by XP for Leaderboard
      const sorted = [...students].sort((a, b) => (b.xp || 0) - (a.xp || 0));
      setSortedStudents(sorted);

      if (students.length > 0 && attendance.length > 0) {
        const present = attendance.filter(a => a.status === 'Có mặt').length;
        setAttendanceRate(`${Math.round((present / attendance.length) * 100)}%`);
      } else {
        setAttendanceRate('--');
      }

      // Behavior Stats
      let totalPraise = 0;
      let totalWarn = 0;
      
      for (const cls of classes) {
        const behaviors = await provider.getBehaviors(cls.id);
        totalPraise += behaviors
          .filter(b => b.type === BehaviorType.PRAISE)
          .reduce((sum, b) => sum + b.points, 0);
        totalWarn += behaviors
          .filter(b => b.type === BehaviorType.WARN)
          .length;
      }
      setWeeklyPraisePoints(totalPraise);
      setWeeklyWarnings(totalWarn);
    };
    fetchData();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown size={16} className="text-yellow-500 fill-yellow-500" />;
      case 1: return <Medal size={16} className="text-gray-400 fill-gray-400" />;
      case 2: return <Medal size={16} className="text-orange-400 fill-orange-400" />;
      default: return <span className="text-xs font-bold text-gray-500">#{index + 1}</span>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng Quan Hệ Thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lớp học</p>
            <p className="text-2xl font-bold text-gray-800">{classCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Học sinh</p>
            <p className="text-2xl font-bold text-gray-800">{studentCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <CheckCircle size={24} /> 
          </div>
          <div>
            <p className="text-sm text-gray-500">Chuyên cần hôm nay</p>
            <p className="text-2xl font-bold text-gray-800">{attendanceRate}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Việc cần xử lý</p>
            <p className="text-2xl font-bold text-gray-800">2</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
           <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <Star size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Điểm khen thưởng (Tuần)</p>
                <p className="text-2xl font-bold text-gray-800">{weeklyPraisePoints}</p>
              </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
           <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Lượt nhắc nhở (Tuần)</p>
                <p className="text-2xl font-bold text-gray-800">{weeklyWarnings}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-1">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold flex items-center text-yellow-600">
               <Trophy className="mr-2" size={20} /> Bảng Vàng
             </h2>
             <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                {[3, 5, 10].map(limit => (
                  <button 
                    key={limit}
                    onClick={() => setTopLimit(limit)}
                    className={`text-xs px-2 py-1 rounded-md transition-all ${
                      topLimit === limit 
                      ? 'bg-white text-yellow-700 shadow-sm font-bold' 
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Top {limit}
                  </button>
                ))}
             </div>
           </div>
           
           <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
             {sortedStudents.slice(0, topLimit).map((s, idx) => (
               <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${idx === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                 <div className="flex items-center gap-3">
                    <div className="w-6 flex justify-center">{getRankIcon(idx)}</div>
                    <div>
                      <p className={`text-sm font-bold ${idx === 0 ? 'text-gray-900' : 'text-gray-700'}`}>{s.fullName}</p>
                      <p className="text-[10px] text-gray-400">Level {s.level || 1}</p>
                    </div>
                 </div>
                 <span className="text-sm font-bold text-blue-600">{s.xp || 0} XP</span>
               </div>
             ))}
             {sortedStudents.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Chưa có dữ liệu thi đua.</p>}
           </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="mr-2 text-blue-500" size={20} /> Thông báo mới
          </h2>
          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                 <div className="flex justify-between items-start">
                   <span className="font-medium text-gray-800 line-clamp-1">{ann.title}</span>
                   <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">{new Date(ann.createdAt).toLocaleDateString()}</span>
                 </div>
                 <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ann.content}</p>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-gray-400">Không có thông báo mới.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="mr-2 text-green-500" size={20} /> Việc cần xử lý
          </h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-red-50 text-red-700 rounded border border-red-100">
              <span className="flex-1 font-medium text-sm">Duyệt đơn xin nghỉ phép (1)</span>
              <button className="text-xs bg-white px-2 py-1 rounded border border-red-200 shadow-sm">Xem</button>
            </div>
             <div className="flex items-center p-3 bg-orange-50 text-orange-700 rounded border border-orange-100">
              <span className="flex-1 font-medium text-sm">Điểm danh ngày {new Date().toLocaleDateString()}</span>
              <button className="text-xs bg-white px-2 py-1 rounded border border-orange-200 shadow-sm">Ngay</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
