
import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { User, UserRole, Student } from '../../core/types';
import { Plus, Trash2, Edit, Search, Link } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    fullName: '',
    role: 'STUDENT',
    linkedStudentId: ''
  });

  const loadData = async () => {
    const [uList, sList, currUser] = await Promise.all([
      provider.getUsers(),
      provider.getStudents(),
      provider.getCurrentUser()
    ]);
    setUsers(uList);
    setStudents(sList);
    setCurrentUser(currUser);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({ ...user });
    } else {
      setEditingId(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        role: 'STUDENT',
        linkedStudentId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await provider.updateUser({ ...formData, id: editingId } as User);
    } else {
      try {
        await provider.addUser({ ...formData, id: crypto.randomUUID() } as User);
      } catch (e: any) {
        alert(e.message || 'Lỗi khi tạo tài khoản');
        return;
      }
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      await provider.removeUser(id);
      loadData();
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Logic ẩn tài khoản ADMIN:
    // Nếu người dùng hiện tại (currentUser) KHÔNG phải là ADMIN,
    // thì ẩn tất cả các user có role là ADMIN.
    const isVisible = currentUser?.role === 'ADMIN' ? true : u.role !== 'ADMIN';

    return matchesSearch && isVisible;
  });

  const getStudentName = (id?: string) => {
    if (!id) return '';
    return students.find(s => s.id === id)?.fullName || 'Không tìm thấy HS';
  };

  const getRoleBadge = (role: UserRole) => {
      switch(role) {
          case 'TEACHER': 
            return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold uppercase">TEACHER</span>;
          case 'STUDENT': 
            return <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold uppercase">STUDENT</span>;
          case 'PARENT': 
            return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs font-bold uppercase">PARENT</span>;
          case 'ADMIN': 
            return <span className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold uppercase">ADMIN</span>;
          default:
            return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-bold">{role}</span>;
      }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Tài Khoản</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          <Plus size={18} className="mr-2" /> Thêm tài khoản
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên đăng nhập hoặc họ tên..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-md py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên đăng nhập</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Họ Tên</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Liên kết HS</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                   {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {user.linkedStudentId ? (
                      <div className="flex items-center text-gray-700">
                         {getStudentName(user.linkedStudentId)}
                      </div>
                   ) : (
                      <span className="text-gray-300">--</span>
                   )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-900 border border-blue-600 rounded p-1 mr-2"><Edit size={16} /></button>
                  {currentUser?.role === 'ADMIN' && (
                     <button onClick={() => handleRemove(user.id)} className="text-red-600 hover:text-red-900 border border-red-600 rounded p-1"><Trash2 size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Không tìm thấy tài khoản nào phù hợp.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900">{editingId ? 'Cập Nhật Tài Khoản' : 'Thêm Tài Khoản'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                <input 
                  required 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  disabled={!!editingId} // Disable username edit
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên hiển thị</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select 
                   value={formData.role} 
                   onChange={e => setFormData({...formData, role: e.target.value as UserRole})} 
                   className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                   <option value="STUDENT">HỌC SINH</option>
                   <option value="PARENT">PHỤ HUYNH</option>
                   <option value="TEACHER">GIÁO VIÊN</option>
                   {currentUser?.role === 'ADMIN' && <option value="ADMIN">QUẢN TRỊ</option>}
                </select>
              </div>

              {(formData.role === 'STUDENT' || formData.role === 'PARENT') && (
                 <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                    <label className="block text-sm font-medium text-blue-800 mb-1">Liên kết với Học Sinh (Đã có)</label>
                    <select 
                       value={formData.linkedStudentId || ''} 
                       onChange={e => setFormData({...formData, linkedStudentId: e.target.value})}
                       className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                       <option value="">-- Không liên kết --</option>
                       {students.map(s => (
                          <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
                       ))}
                    </select>
                    <p className="text-xs text-blue-600 mt-1">
                       * Chọn học sinh tương ứng để tài khoản này xem được dữ liệu của học sinh đó.
                    </p>
                 </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
