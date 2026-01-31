
import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Announcement, Student } from '../../core/types';
import { Megaphone, Pin, Users, User, Users2 } from 'lucide-react';

const AppAnnouncements: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const user = await provider.getCurrentUser();
      const students = await provider.getStudents();
      let currentStudent: Student | undefined;

      if (user) {
         if (user.linkedStudentId) {
             currentStudent = students.find(s => s.id === user.linkedStudentId);
         } else if (user.role === 'STUDENT') {
             currentStudent = students.find(s => s.fullName.toLowerCase().trim() === user.fullName.toLowerCase().trim());
         }
      }

      setStudent(currentStudent || null);

      if (currentStudent) {
        const list = await provider.getAnnouncements(currentStudent.classId);
        setAnnouncements(list);
      }
      setLoading(false);
    };
    init();
  }, []);

  const getTargetIcon = (target: string) => {
    switch(target) {
      case 'parent': return <Users size={16} className="text-purple-500" />;
      case 'student': return <User size={16} className="text-green-500" />;
      default: return <Users2 size={16} className="text-blue-500" />;
    }
  };

  const getTargetLabel = (target: string) => {
     switch(target) {
      case 'parent': return 'Phụ huynh';
      case 'student': return 'Học sinh';
      default: return 'Tất cả';
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Đang tải...</div>;
  if (!student) return <div className="p-6 text-center text-gray-500">Bạn chưa được liên kết với hồ sơ học sinh.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Megaphone className="mr-2 text-blue-600" /> Bảng Thông Báo
      </h1>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Chưa có thông báo nào.</div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className={`bg-white p-5 rounded-lg shadow-sm border ${ann.pinned ? 'border-yellow-200 bg-yellow-50 shadow-md' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                   {ann.pinned && <Pin size={16} className="text-yellow-600 fill-yellow-600" />}
                   <span className="font-bold text-gray-800 text-lg">{ann.title}</span>
                </div>
                <div className="flex items-center gap-1 bg-white bg-opacity-60 px-2 py-0.5 rounded text-xs font-medium text-gray-600 border border-gray-100">
                    {getTargetIcon(ann.target)}
                    {getTargetLabel(ann.target)}
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
              <div className="mt-3 pt-3 border-t border-gray-100/50 flex justify-between items-center text-xs text-gray-400">
                 <span>Người đăng: GVCN</span>
                 <span>{new Date(ann.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppAnnouncements;
