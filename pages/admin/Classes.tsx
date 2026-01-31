
import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { ClassInfo, User } from '../../core/types';
import { Plus, Trash2, Edit, Search } from 'lucide-react';

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ClassInfo>>({
    className: '',
    schoolYear: '2023-2024',
    homeroomTeacher: '',
    note: ''
  });

  const fetchClasses = async () => {
    const list = await provider.getClasses();
    const user = await provider.getCurrentUser();
    setClasses(list);
    setCurrentUser(user);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenModal = (cls?: ClassInfo) => {
    if (cls) {
      setEditingId(cls.id);
      setFormData({ ...cls });
    } else {
      setEditingId(null);
      setFormData({
        className: '',
        schoolYear: '2023-2024',
        homeroomTeacher: '',
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await provider.updateClass({ ...formData, id: editingId } as ClassInfo);
    } else {
      await provider.addClass({ ...formData, id: crypto.randomUUID() } as ClassInfo);
    }
    setIsModalOpen(false);
    fetchClasses();
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp này?')) {
      await provider.removeClass(id);
      fetchClasses();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Lớp Học</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" /> Thêm lớp
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Lớp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niên Khóa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GVCN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi Chú</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.map((cls) => (
              <tr key={cls.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{cls.className}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls.schoolYear}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.homeroomTeacher}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{cls.note}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(cls)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={18} /></button>
                  {currentUser?.role === 'ADMIN' && (
                     <button onClick={() => handleRemove(cls.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                  )}
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Chưa có dữ liệu lớp học.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Cập Nhật Lớp' : 'Thêm Lớp Mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tên lớp</label>
                <input 
                  required
                  type="text" 
                  value={formData.className} 
                  onChange={e => setFormData({...formData, className: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ví dụ: 10A1"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Niên khóa</label>
                <input 
                  required
                  type="text" 
                  value={formData.schoolYear} 
                  onChange={e => setFormData({...formData, schoolYear: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Giáo viên chủ nhiệm</label>
                <input 
                  required
                  type="text" 
                  value={formData.homeroomTeacher} 
                  onChange={e => setFormData({...formData, homeroomTeacher: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea 
                  value={formData.note} 
                  onChange={e => setFormData({...formData, note: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
