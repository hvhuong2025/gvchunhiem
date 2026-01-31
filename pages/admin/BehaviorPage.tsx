
import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Behavior, BehaviorType, ClassInfo, Student } from '../../core/types';
import { Plus, Trash2, Edit, Filter, Search, ThumbsUp, AlertTriangle } from 'lucide-react';

const BehaviorPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  
  // Filters
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchStudent, setSearchStudent] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Behavior>>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    type: BehaviorType.PRAISE,
    content: '',
    points: 10
  });

  useEffect(() => {
    const fetchClasses = async () => {
      const cls = await provider.getClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    };
    fetchClasses();
  }, []);

  const loadBehaviors = async () => {
    if (!selectedClassId) return;
    const [sList, bList] = await Promise.all([
      provider.getStudentsByClass(selectedClassId),
      provider.getBehaviors(selectedClassId, startDate, endDate)
    ]);
    setStudents(sList);
    setBehaviors(bList);
  };

  useEffect(() => {
    loadBehaviors();
  }, [selectedClassId, startDate, endDate]);

  const handleOpenModal = (behavior?: Behavior) => {
    if (behavior) {
      setEditingId(behavior.id);
      setFormData({ ...behavior });
    } else {
      setEditingId(null);
      setFormData({
        studentId: students.length > 0 ? students[0].id : '',
        classId: selectedClassId,
        date: new Date().toISOString().split('T')[0],
        type: BehaviorType.PRAISE,
        content: '',
        points: 10
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, classId: selectedClassId } as Behavior;
    
    if (editingId) {
      await provider.updateBehavior({ ...payload, id: editingId });
    } else {
      await provider.addBehavior({ ...payload, id: crypto.randomUUID() });
      // Auto update student XP when adding new behavior
      if (payload.points !== 0) {
        await provider.updateStudentXP(payload.studentId, payload.points);
        alert(`Đã ghi nhận và cộng ${payload.points} XP cho học sinh!`);
      }
    }
    setIsModalOpen(false);
    loadBehaviors();
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Xóa ghi nhận này?')) {
      await provider.removeBehavior(id);
      loadBehaviors();
    }
  };

  const getStudentName = (id: string) => students.find(s => s.id === id)?.fullName || '---';

  const filteredBehaviors = behaviors.filter(b => 
    getStudentName(b.studentId).toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Nề Nếp</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" /> Ghi nhận mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1">Chọn lớp</label>
          <select 
            value={selectedClassId} 
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
           <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
           <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-300 rounded px-3 py-2" />
        </div>
        <div className="flex-1 w-full">
           <label className="block text-xs font-medium text-gray-500 mb-1">Tìm học sinh</label>
           <div className="relative">
             <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
             <input type="text" value={searchStudent} onChange={e => setSearchStudent(e.target.value)} placeholder="Tên học sinh..." className="pl-8 w-full border border-gray-300 rounded px-3 py-2" />
           </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredBehaviors.length === 0 ? (
          <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-dashed">Chưa có dữ liệu.</div>
        ) : (
          filteredBehaviors.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
              <div className="flex items-start">
                <div className={`p-3 rounded-full mr-4 ${item.type === BehaviorType.PRAISE ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {item.type === BehaviorType.PRAISE ? <ThumbsUp size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{getStudentName(item.studentId)} <span className="text-xs font-normal text-gray-500">({new Date(item.date).toLocaleDateString('vi-VN')})</span></h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.type === BehaviorType.PRAISE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.type}
                    </span>
                    <span className="font-bold text-sm text-gray-700">{item.points > 0 ? `+${item.points}` : item.points} điểm</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{item.content}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                 <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-indigo-600"><Edit size={18} /></button>
                 <button onClick={() => handleRemove(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Sửa Ghi Nhận' : 'Thêm Ghi Nhận Mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Học sinh</label>
                <select required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2">
                  {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Loại</label>
                   <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as BehaviorType})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2">
                     <option value={BehaviorType.PRAISE}>Khen ngợi</option>
                     <option value={BehaviorType.WARN}>Nhắc nhở</option>
                   </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nội dung</label>
                <textarea required rows={2} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Điểm số</label>
                <input type="number" required value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BehaviorPage;
