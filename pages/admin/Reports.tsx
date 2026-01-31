import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Report, ClassInfo } from '../../core/types';
import { BarChart, Calendar, Download, AlertCircle, Award, CheckCircle, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [report, setReport] = useState<Report | null>(null);
  
  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  
  // Weekly State
  const [weekStart, setWeekStart] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  });
  
  // Monthly State
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchClasses = async () => {
      const cls = await provider.getClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    };
    fetchClasses();
  }, []);

  const loadReport = async () => {
    if (!selectedClassId) return;
    
    if (activeTab === 'WEEKLY') {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const endDateStr = end.toISOString().split('T')[0];
      const data = await provider.reportsWeekly(selectedClassId, weekStart, endDateStr);
      setReport(data);
    } else {
      const data = await provider.reportsMonthly(selectedClassId, month, year);
      setReport(data);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedClassId, activeTab, weekStart, month, year]);

  const handleExportAttendance = async () => {
    if (!selectedClassId || !report) return;
    const data = await provider.getAttendanceRange(selectedClassId, report.startDate, report.endDate);
    if (data.length === 0) {
        alert('Không có dữ liệu điểm danh trong khoảng thời gian này.');
        return;
    }
    
    const students = await provider.getStudentsByClass(selectedClassId);
    
    const rows = [
      ['Mã HS', 'Tên HS', 'Ngày', 'Trạng thái', 'Ghi chú']
    ];
    
    data.forEach(item => {
        const s = students.find(st => st.id === item.studentId);
        rows.push([
            s?.studentCode || '',
            s?.fullName || '',
            item.date,
            item.status,
            item.note || ''
        ]);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Attendance_${report.type}_${report.startDate}.xlsx`);
  };

  const handleExportBehavior = async () => {
    if (!selectedClassId || !report) return;
    const data = await provider.getBehaviors(selectedClassId, report.startDate, report.endDate);
    if (data.length === 0) {
        alert('Không có dữ liệu nề nếp trong khoảng thời gian này.');
        return;
    }

    const students = await provider.getStudentsByClass(selectedClassId);

    const rows = [
      ['Tên HS', 'Ngày', 'Loại', 'Nội dung', 'Điểm']
    ];

    data.forEach(item => {
       const s = students.find(st => st.id === item.studentId);
       rows.push([
         s?.fullName || '',
         item.date,
         item.type,
         item.content,
         item.points.toString()
       ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Behavior");
    XLSX.writeFile(workbook, `Behavior_${report.type}_${report.startDate}.xlsx`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <BarChart className="mr-2" /> Báo Cáo Thống Kê
      </h1>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
         <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lớp học</label>
            <select 
               value={selectedClassId} 
               onChange={e => setSelectedClassId(e.target.value)}
               className="border border-gray-300 rounded px-3 py-2 bg-white"
            >
               {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
         </div>

         <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('WEEKLY')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'WEEKLY' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tuần
            </button>
            <button 
              onClick={() => setActiveTab('MONTHLY')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'MONTHLY' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tháng
            </button>
         </div>

         {activeTab === 'WEEKLY' ? (
           <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tuần bắt đầu</label>
              <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="border border-gray-300 rounded px-3 py-2" />
           </div>
         ) : (
           <div className="flex gap-2">
              <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">Tháng</label>
                 <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="border border-gray-300 rounded px-3 py-2 bg-white">
                   {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">Năm</label>
                 <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="border border-gray-300 rounded px-3 py-2 w-20" />
              </div>
           </div>
         )}
      </div>

      {/* Report Content */}
      {report && (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold text-gray-800">{report.title}</h2>
                <p className="text-sm text-gray-500">{new Date(report.startDate).toLocaleDateString('vi-VN')} - {new Date(report.endDate).toLocaleDateString('vi-VN')}</p>
             </div>
             <div className="flex gap-2">
                <button onClick={handleExportAttendance} className="flex items-center px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100">
                  <Download size={16} className="mr-1" /> Excel Điểm danh
                </button>
                <button onClick={handleExportBehavior} className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100">
                  <Download size={16} className="mr-1" /> Excel Nề nếp
                </button>
             </div>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                 <div className="flex items-center text-gray-500 mb-2"><CheckCircle size={18} className="mr-2" /> Tỉ lệ chuyên cần</div>
                 <div className="text-2xl font-bold text-gray-800">{report.content.attendanceRate}%</div>
                 <div className="text-xs text-red-500 mt-1">{report.content.totalAbsences} lượt vắng, {report.content.totalLates} đi muộn</div>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                 <div className="flex items-center text-gray-500 mb-2"><Award size={18} className="mr-2" /> Khen thưởng</div>
                 <div className="text-2xl font-bold text-green-600">{report.content.topPraise.reduce((a,b) => a + b.count, 0)}</div>
                 <div className="text-xs text-gray-400 mt-1">lượt ghi nhận tích cực</div>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                 <div className="flex items-center text-gray-500 mb-2"><AlertCircle size={18} className="mr-2" /> Nhắc nhở</div>
                 <div className="text-2xl font-bold text-red-600">{report.content.topWarn.reduce((a,b) => a + b.count, 0)}</div>
                 <div className="text-xs text-gray-400 mt-1">lượt vi phạm nề nếp</div>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                 <div className="flex items-center text-gray-500 mb-2"><Users size={18} className="mr-2" /> Tương tác PH</div>
                 <div className="text-2xl font-bold text-indigo-600">{report.content.parentReplyCount}</div>
                 <div className="text-xs text-gray-400 mt-1">lượt phản hồi nhiệm vụ</div>
              </div>
           </div>

           {/* Top Lists */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                 <div className="bg-green-50 px-4 py-3 border-b border-green-100 font-semibold text-green-800 flex items-center">
                    <Award size={18} className="mr-2" /> Top Học Sinh Tích Cực
                 </div>
                 <table className="min-w-full">
                    <tbody className="divide-y divide-gray-100">
                       {report.content.topPraise.length === 0 ? (
                         <tr><td className="p-4 text-center text-gray-500 text-sm">Chưa có dữ liệu</td></tr>
                       ) : (
                         report.content.topPraise.map((s, i) => (
                           <tr key={i}>
                             <td className="px-4 py-3 text-sm font-medium text-gray-700">{i+1}. {s.studentName}</td>
                             <td className="px-4 py-3 text-sm text-right text-green-600 font-bold">+{s.points} đ</td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                 <div className="bg-red-50 px-4 py-3 border-b border-red-100 font-semibold text-red-800 flex items-center">
                    <AlertCircle size={18} className="mr-2" /> Học Sinh Cần Nhắc Nhở
                 </div>
                 <table className="min-w-full">
                    <tbody className="divide-y divide-gray-100">
                       {report.content.topWarn.length === 0 ? (
                         <tr><td className="p-4 text-center text-gray-500 text-sm">Chưa có dữ liệu</td></tr>
                       ) : (
                         report.content.topWarn.map((s, i) => (
                           <tr key={i}>
                             <td className="px-4 py-3 text-sm font-medium text-gray-700">{i+1}. {s.studentName}</td>
                             <td className="px-4 py-3 text-sm text-right text-red-600 font-bold">{s.count} lần</td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;