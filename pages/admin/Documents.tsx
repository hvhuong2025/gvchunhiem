import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Document, ClassInfo } from '../../core/types';
import { Plus, Trash2, Edit, FileText, Link as LinkIcon, Download } from 'lucide-react';

const Documents: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Document>>({
    title: '',
    url: '',
    category: 'Biểu mẫu'
  });

  const categories = ['Nội quy', 'Kế hoạch', 'Biểu mẫu', 'Tài liệu học tập', 'Khác'];

  useEffect(() => {
    const fetchClasses = async () => {
      const cls = await provider.getClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    };
    fetchClasses();
  }, []);

  const loadDocuments = async () => {
    if (!selectedClassId) return;
    const list = await provider.getDocuments(selectedClassId);
    setDocuments(list);
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedClassId]);

  const handleOpenModal = (doc?: Document) => {
    if (doc) {
      setEditingId(doc.id);
      setFormData({ ...doc });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        url: '',
        category: 'Biểu mẫu',
        classId: selectedClassId
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...formData, 
      classId: selectedClassId,
      createdAt: editingId ? (documents.find(d => d.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    } as Document;
    
    if (editingId) {
      await provider.updateDocument({ ...payload, id: editingId });
    } else {
      await provider.addDocument({ ...payload, id: crypto.randomUUID() });
    }
    setIsModalOpen(false);
    loadDocuments();
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Xóa tài liệu này?')) {
      await provider.removeDocument(id);
      loadDocuments();
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Kho Tài Liệu</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" /> Thêm tài liệu
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
         <label className="block text-xs font-medium text-gray-500 mb-1">Chọn lớp</label>
         <select 
            value={selectedClassId} 
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full md:w-64 border border-gray-300 rounded px-3 py-2 bg-white"
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên tài liệu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.length === 0 ? (
               <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Chưa có tài liệu nào.</td></tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText size={20} className="text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center mt-1">
                          <LinkIcon size={12} className="mr-1" /> {doc.url}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(doc)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit size={18} /></button>
                    <button onClick={() => handleRemove(doc.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Sửa Tài Liệu' : 'Thêm Tài Liệu Mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tên tài liệu</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Đường dẫn (URL)</label>
                <input required type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" placeholder="https://..." />
              </div>
              <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                 <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2">
                   {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
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

export default Documents;