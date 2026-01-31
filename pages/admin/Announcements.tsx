import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Announcement, ClassInfo } from '../../core/types';
import { Plus, Trash2, Edit, Pin, PinOff, Users, User, Users2 } from 'lucide-react';

const Announcements: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    target: 'all',
    pinned: false
  });

  useEffect(() => {
    const fetchClasses = async () => {
      const cls = await provider.getClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    };
    fetchClasses();
  }, []);

  const loadAnnouncements = async () => {
    if (!selectedClassId) return;
    const list = await provider.getAnnouncements(selectedClassId);
    setAnnouncements(list);
  };

  useEffect(() => {
    loadAnnouncements();
  }, [selectedClassId]);

  const handleOpenModal = (ann?: Announcement) => {
    if (ann) {
      setEditingId(ann.id);
      setFormData({ ...ann });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        target: 'all',
        pinned: false,
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
      createdAt: editingId ? formData.createdAt : new Date().toISOString()
    } as Announcement;
    
    if (editingId) {
      await provider.updateAnnouncement({ ...payload, id: editingId });
    } else {
      await provider.addAnnouncement({ ...payload, id: crypto.randomUUID() });
    }
    setIsModalOpen(false);
    loadAnnouncements();
  };

  const handleTogglePin = async (ann: Announcement) => {
    await provider.updateAnnouncement({ ...ann, pinned: !ann.pinned });
    loadAnnouncements();
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Xóa thông báo này?')) {
      await provider.removeAnnouncement(id);
      loadAnnouncements();
    }
  };

  const getTargetIcon = (target: string) => {
    switch(target) {
      case 'parent': return <Users size={16} className="text-purple-500" />;
      case 'student': return <User size={16} className="text-green-500" />;
      default: return <Users2 size={16} className="text-blue-500" />;
    }
  };

  const getTargetLabel = (target: string) => {
     switch(target) {
      case 'parent': return 'Phụ huynh';
      case 'student': return 'Học sinh';
      default: return 'Tất cả';
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Thông Báo</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" /> Tạo thông báo
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

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-dashed">Chưa có thông báo nào.</div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className={`bg-white p-4 rounded-lg shadow-sm border ${ann.pinned ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.pinned && <Pin size={16} className="text-yellow-600 fill-yellow-600" />}
                    <h3 className="font-bold text-gray-800 text-lg">{ann.title}</h3>
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                      {getTargetIcon(ann.target)}
                      {getTargetLabel(ann.target)}
                    </div>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{ann.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(ann.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button onClick={() => handleTogglePin(ann)} className="p-2 text-gray-400 hover:text-yellow-600" title={ann.pinned ? 'Bỏ ghim' : 'Ghim'}>
                    {ann.pinned ? <PinOff size={18} /> : <Pin size={18} />}
                  </button>
                  <button onClick={() => handleOpenModal(ann)} className="p-2 text-gray-400 hover:text-indigo-600"><Edit size={18} /></button>
                  <button onClick={() => handleRemove(ann.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Sửa Thông Báo' : 'Tạo Thông Báo Mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700">Đối tượng</label>
                   <select value={formData.target} onChange={e => setFormData({...formData, target: e.target.value as any})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2">
                     <option value="all">Tất cả</option>
                     <option value="parent">Phụ huynh</option>
                     <option value="student">Học sinh</option>
                   </select>
                </div>
                <div className="flex items-center mt-6">
                  <input type="checkbox" id="pinned" checked={formData.pinned} onChange={e => setFormData({...formData, pinned: e.target.checked})} className="mr-2" />
                  <label htmlFor="pinned" className="text-sm font-medium text-gray-700">Ghim lên đầu</label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nội dung</label>
                <textarea required rows={5} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
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

export default Announcements;