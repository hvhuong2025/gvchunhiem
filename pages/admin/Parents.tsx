import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Parent, Student } from '../../core/types';
import { Plus, Trash2, Edit, Search } from 'lucide-react';

const Parents: React.FC = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Parent>>({
    fullName: '',
    phone: '',
    email: '',
    relationship: 'Mẹ',
    studentId: ''
  });

  const loadData = async () => {
    const [pList, sList] = await Promise.all([
      provider.getParents(),
      provider.getStudents()
    ]);
    setParents(pList);
    setStudents(sList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (parent?: Parent) => {
    if (parent) {
      setEditingId(parent.id);
      setFormData({ ...parent });
    } else {
      setEditingId(null);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        relationship: 'Mẹ',
        studentId: students.length > 0 ? students[0].id : ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await provider.updateParent({ ...formData, id: editingId } as Parent);
    } else {
      await provider.addParent({ ...formData, id: crypto.randomUUID() } as Parent);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Xóa phụ huynh này?')) {
      await provider.removeParent(id);
      loadData();
    }
  };

  const filteredParents = parents.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  const getStudentName = (studentId: string) => students.find(s => s.id === studentId)?.fullName || '---';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Phụ Huynh</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" /> Thêm PH
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-md py-2 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SĐT / Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quan hệ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học sinh</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredParents.map((parent) => (
              <tr key={parent.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{parent.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{parent.phone}</div>
                  <div className="text-xs text-gray-400">{parent.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parent.relationship}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{getStudentName(parent.studentId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(parent)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={18} /></button>
                  <button onClick={() => handleRemove(parent.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {filteredParents.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Không tìm thấy dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Cập Nhật' : 'Thêm Phụ Huynh'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Họ tên PH</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Quan hệ</label>
                  <select value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2">
                    <option value="Bố">Bố</option>
                    <option value="Mẹ">Mẹ</option>
                    <option value="Ông/Bà">Ông/Bà</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Phụ huynh của</label>
                  <select required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 p-2">
                    <option value="">-- Chọn HS --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parents;