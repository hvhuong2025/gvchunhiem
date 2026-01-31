
import React, { useEffect, useState, useRef } from 'react';
import provider from '../../core/provider';
import { Student, ClassInfo, User } from '../../core/types';
import { Plus, Trash2, Edit, Search, Filter, Upload, Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    classId: '',
    fullName: '',
    studentCode: '',
    dob: '',
    gender: 'Nam',
    address: '',
    status: 'Đang học'
  });

  const loadData = async () => {
    const [sList, cList, currUser] = await Promise.all([
      provider.getStudents(),
      provider.getClasses(),
      provider.getCurrentUser()
    ]);
    setStudents(sList);
    setClasses(cList);
    setCurrentUser(currUser);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingId(student.id);
      setFormData({ ...student });
    } else {
      setEditingId(null);
      setFormData({
        classId: filterClass || (classes.length > 0 ? classes[0].id : ''),
        fullName: '',
        studentCode: '',
        dob: '',
        gender: 'Nam',
        address: '',
        status: 'Đang học'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await provider.updateStudent({ ...formData, id: editingId } as Student);
    } else {
      await provider.addStudent({ ...formData, id: crypto.randomUUID() } as Student);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
      await provider.removeStudent(id);
      loadData();
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Địa chỉ'];
    const sample = ['HS001', 'Nguyễn Văn A', '2008-01-01', 'Nam', 'Hà Nội'];
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, sample]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Mau_Danh_Sach_HS.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine target class
    const targetClassId = filterClass || (classes.length > 0 ? classes[0].id : '');
    if (!targetClassId) {
      alert('Vui lòng tạo ít nhất một lớp học trước khi nhập danh sách.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const data = XLSX.utils.sheet_to_json(ws);

      if (data.length === 0) {
        alert('File không có dữ liệu.');
        return;
      }

      let count = 0;
      for (const row of data as any[]) {
        const studentCode = row['Mã HS'] || row['Code'] || `HS${Math.floor(Math.random()*10000)}`;
        const fullName = row['Họ và tên'] || row['Họ tên'] || row['Name'];
        
        if (!fullName) continue;

        const newStudent: Student = {
          id: crypto.randomUUID(),
          classId: targetClassId,
          fullName: fullName,
          studentCode: String(studentCode),
          dob: row['Ngày sinh'] || '2008-01-01', 
          gender: row['Giới tính'] === 'Nữ' ? 'Nữ' : 'Nam',
          address: row['Địa chỉ'] || '',
          status: 'Đang học',
          xp: 0,
          level: 1
        };

        await provider.addStudent(newStudent);
        count++;
      }

      alert(`Đã nhập thành công ${count} học sinh vào lớp ${classes.find(c => c.id === targetClassId)?.className}.`);
      loadData();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass ? s.classId === filterClass : true;
    return matchesSearch && matchesClass;
  });

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.className || '---';

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Học Sinh</h1>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            hidden 
            accept=".xlsx, .xls" 
          />
          <button onClick={handleDownloadTemplate} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 whitespace-nowrap">
            <Download size={18} className="mr-2" /> Tải mẫu
          </button>
          <button 
            onClick={() => {
              if (!filterClass && classes.length > 1) {
                 if(!window.confirm('Bạn chưa chọn lớp cụ thể. Học sinh sẽ được thêm vào lớp đầu tiên trong danh sách. Tiếp tục?')) return;
              }
              fileInputRef.current?.click();
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 whitespace-nowrap"
          >
            <Upload size={18} className="mr-2" /> Nhập Excel
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" /> Thêm HS
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc mã HS..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-md py-2 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="relative w-full md:w-64">
           <Filter className="absolute left-3 top-2.5 text-gray-400" size={20} />
           <select 
             value={filterClass} 
             onChange={e => setFilterClass(e.target.value)}
             className="pl-10 w-full border border-gray-300 rounded-md py-2 focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
           >
             <option value="">Tất cả các lớp</option>
             {classes.map(c => (
               <option key={c.id} value={c.id}>{c.className}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã HS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">XP / Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giới Tính</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{student.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getClassName(student.classId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="font-bold text-indigo-600">{student.xp || 0} XP</div>
                  <div className="text-xs text-gray-400">Lv.{student.level || 1}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(student)} className="text-blue-600 hover:text-blue-900 mr-3 border border-blue-600 rounded p-1"><Edit size={16} /></button>
                  {currentUser?.role === 'ADMIN' && (
                     <button onClick={() => handleRemove(student.id)} className="text-red-600 hover:text-red-900 border border-red-600 rounded p-1"><Trash2 size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">Không tìm thấy học sinh nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="p-6">
                <h2 className="text-xl font-bold mb-6 text-gray-900">{editingId ? 'Cập Nhật Học Sinh' : 'Thêm Học Sinh'}</h2>
                <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                    {/* Row 1 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã HS</label>
                        <input required type="text" value={formData.studentCode} onChange={e => setFormData({...formData, studentCode: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="VD: 2026-01-..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                        <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="HOÀNG VĂN HƯỞNG" />
                    </div>

                    {/* Row 2 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                        <select required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            <option value="">-- Chọn lớp --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                        <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    {/* Row 3 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                        <select value={formData.gender} onChange={(e: any) => setFormData({...formData, gender: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select value={formData.status} onChange={(e: any) => setFormData({...formData, status: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            <option value="Đang học">Đang học</option>
                            <option value="Đã nghỉ">Đã nghỉ</option>
                            <option value="Bảo lưu">Bảo lưu</option>
                        </select>
                    </div>

                    {/* Row 4 - Full Width */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                        <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">Lưu</button>
                </div>
                </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
