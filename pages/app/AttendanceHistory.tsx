import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Attendance, AttendanceStatus, Student } from '../../core/types';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const AttendanceHistory: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchStudent = async () => {
      // Mock: Login as first student
      const students = await provider.getStudents();
      if (students.length > 0) setStudent(students[0]);
    };
    fetchStudent();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!student) return;
      const data = await provider.getStudentAttendance(
        student.id, 
        currentDate.getMonth() + 1, 
        currentDate.getFullYear()
      );
      setHistory(data);
    };
    fetchHistory();
  }, [student, currentDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const stats = {
    present: history.filter(h => h.status === AttendanceStatus.PRESENT).length,
    absent: history.filter(h => h.status === AttendanceStatus.ABSENT).length,
    late: history.filter(h => h.status === AttendanceStatus.LATE).length,
    excused: history.filter(h => h.status === AttendanceStatus.EXCUSED).length,
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return 'text-green-600 bg-green-50';
      case AttendanceStatus.ABSENT: return 'text-red-600 bg-red-50';
      case AttendanceStatus.LATE: return 'text-yellow-600 bg-yellow-50';
      case AttendanceStatus.EXCUSED: return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return <CheckCircle size={20} />;
      case AttendanceStatus.ABSENT: return <XCircle size={20} />;
      case AttendanceStatus.LATE: return <Clock size={20} />;
      case AttendanceStatus.EXCUSED: return <AlertCircle size={20} />;
    }
  };

  if (!student) return <div className="p-6 text-center">Đang tải...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Calendar className="mr-2" /> Lịch Sử Chuyên Cần
      </h1>

      {/* Month Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft />
        </button>
        <span className="text-lg font-bold text-gray-700">
          Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
        </span>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronRight />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 mb-6 text-center">
        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
          <div className="text-green-600 font-bold text-xl">{stats.present}</div>
          <div className="text-xs text-green-700">Có mặt</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
           <div className="text-red-600 font-bold text-xl">{stats.absent}</div>
           <div className="text-xs text-red-700">Vắng</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
           <div className="text-yellow-600 font-bold text-xl">{stats.late}</div>
           <div className="text-xs text-yellow-700">Muộn</div>
        </div>
         <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
           <div className="text-blue-600 font-bold text-xl">{stats.excused}</div>
           <div className="text-xs text-blue-700">Có phép</div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có dữ liệu trong tháng này.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-semibold text-gray-800">
                    {new Date(record.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                  </div>
                  {record.note && (
                    <div className="text-sm text-gray-500 mt-1 italic">"{record.note}"</div>
                  )}
                </div>
                <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                  <span className="mr-2">{getStatusIcon(record.status)}</span>
                  {record.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;