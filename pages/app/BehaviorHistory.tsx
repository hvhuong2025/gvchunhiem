import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Behavior, BehaviorType, Student } from '../../core/types';
import { Star, ThumbsUp, AlertTriangle } from 'lucide-react';

const BehaviorHistory: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);

  useEffect(() => {
    const init = async () => {
      const students = await provider.getStudents();
      const currentStudent = students[0]; // Mock login
      setStudent(currentStudent);

      if (currentStudent) {
        const list = await provider.getStudentBehaviors(currentStudent.id);
        setBehaviors(list);
      }
    };
    init();
  }, []);

  if (!student) return <div className="p-6 text-center">Đang tải...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Star className="mr-2 text-yellow-500" /> Nề Nếp & Rèn Luyện
      </h1>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">Tổng điểm rèn luyện</p>
          <p className="text-3xl font-bold text-blue-600">
            {behaviors.reduce((sum, b) => sum + b.points, 0)}
          </p>
        </div>
        <div className="text-right">
           <p className="text-sm text-green-600 font-medium">{behaviors.filter(b => b.type === BehaviorType.PRAISE).length} Lời khen</p>
           <p className="text-sm text-red-500 font-medium">{behaviors.filter(b => b.type === BehaviorType.WARN).length} Nhắc nhở</p>
        </div>
      </div>

      <div className="space-y-4">
        {behaviors.length === 0 ? (
          <div className="text-center text-gray-500">Chưa có ghi nhận nào.</div>
        ) : (
          behaviors.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${item.type === BehaviorType.PRAISE ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {item.type === BehaviorType.PRAISE ? <ThumbsUp size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold ${item.type === BehaviorType.PRAISE ? 'text-green-700' : 'text-red-700'}`}>
                    {item.type}
                  </h3>
                  <span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="text-gray-700 mt-1">{item.content}</p>
                <p className={`text-sm font-semibold mt-2 ${item.points > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                  {item.points > 0 ? '+' : ''}{item.points} điểm
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BehaviorHistory;