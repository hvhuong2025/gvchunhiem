import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { AttendanceItem, AttendanceStatus, ClassInfo, Student } from '../../core/types';
import { Save, Filter, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceItem>>({});
  const [loading, setLoading] = useState(false);

  // Load Classes
  useEffect(() => {
    const fetchClasses = async () => {
      const cls = await provider.getClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    };
    fetchClasses();
  }, []);

  // Load Students and Existing Attendance when Class or Date changes
  useEffect(() => {
    if (!selectedClassId) return;

    const loadData = async () => {
      setLoading(true);
      const [sList, attList] = await Promise.all([
        provider.getStudentsByClass(selectedClassId),
        provider.getAttendance(selectedClassId, date)
      ]);
      setStudents(sList);

      const map: Record<string, AttendanceItem> = {};
      
      // Initialize with PRESENT for all students, or override with existing data
      sList.forEach(s => {
        const existing = attList.find(a => a.studentId === s.id);
        if (existing) {
          map[s.id] = {
            studentId: s.id,
            status: existing.status,
            note: existing.note
          };
        } else {
          map[s.id] = {
            studentId: s.id,
            status: AttendanceStatus.PRESENT,
            note: ''
          };
        }
      });

      setAttendanceMap(map);
      setLoading(false);
    };
    loadData();
  }, [selectedClassId, date]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note }
    }));
  };

  const handleBulkSave = async () => {
    setLoading(true);
    const items = Object.values(attendanceMap) as AttendanceItem[];
    await provider.saveAttendance(selectedClassId, date, items);
    setLoading(false);
    alert('Đã lưu dữ liệu điểm danh thành công!');
  };

  // Helper for Status Icon
  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return <CheckCircle size={16} />;
      case AttendanceStatus.ABSENT: return <XCircle size={16} />;
      case AttendanceStatus.LATE: return <Clock size={16} />;
      case AttendanceStatus.EXCUSED: return <AlertCircle size={16} />;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Điểm Danh Lớp Học</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
            {classes.length === 0 && <option value="">Đang tải lớp...</option>}
          </select>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <button 
            onClick={handleBulkSave}
            disabled={loading || students.length === 0}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Save size={18} className="mr-2" /> Lưu
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {loading ? 'Đang tải dữ liệu...' : 'Lớp này chưa có học sinh hoặc chưa chọn lớp.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">Học Sinh</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3">Trạng Thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi Chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const data = attendanceMap[student.id] || { status: AttendanceStatus.PRESENT, note: '' };
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-xs text-gray-500">{student.studentCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {Object.values(AttendanceStatus).map((status) => {
                             const isSelected = data.status === status;
                             let colorClass = "border-gray-200 text-gray-600 hover:bg-gray-100";
                             
                             if (isSelected) {
                               if (status === AttendanceStatus.PRESENT) colorClass = "bg-green-100 text-green-700 border-green-200";
                               else if (status === AttendanceStatus.ABSENT) colorClass = "bg-red-100 text-red-700 border-red-200";
                               else if (status === AttendanceStatus.LATE) colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
                               else colorClass = "bg-blue-100 text-blue-700 border-blue-200";
                             }

                             return (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${colorClass}`}
                              >
                                <span className="mr-1.5">{getStatusIcon(status)}</span>
                                {status}
                              </button>
                             );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="text" 
                          value={data.note || ''}
                          onChange={e => handleNoteChange(student.id, e.target.value)}
                          placeholder="Nhập ghi chú..."
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;