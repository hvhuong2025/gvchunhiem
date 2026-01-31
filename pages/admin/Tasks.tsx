import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Task, ClassInfo, Student, TaskReply } from '../../core/types';
import { Plus, Trash2, Edit, Calendar, CheckSquare, MessageSquare, ExternalLink, XCircle } from 'lucide-react';

const Tasks: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    requireReply: false
  });

  // Details/Replies State
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [taskReplies, setTaskReplies] = useState<TaskReply[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const cls = await provider.getClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    };
    fetchClasses();
  }, []);

  const loadTasks = async () => {
    if (!selectedClassId) return;
    const list = await provider.getTasks(selectedClassId);
    setTasks(list);
  };

  useEffect(() => {
    loadTasks();
  }, [selectedClassId]);

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingId(task.id);
      setFormData({ ...task });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        requireReply: false,
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
      createdAt: editingId ? (tasks.find(t => t.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    } as Task;
    
    if (editingId) {
      await provider.updateTask({ ...payload, id: editingId });
    } else {
      await provider.addTask({ ...payload, id: crypto.randomUUID() });
    }
    setIsModalOpen(false);
    loadTasks();
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Xóa nhiệm vụ này?')) {
      await provider.removeTask(id);
      loadTasks();
    }
  };

  const handleViewReplies = async (task: Task) => {
    setViewingTask(task);
    const [replies, studList] = await Promise.all([
      provider.getTaskReplies(task.id),
      provider.getStudentsByClass(task.classId)
    ]);
    setTaskReplies(replies);
    setStudents(studList);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Nhắc Việc / Bài Tập</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" /> Tạo nhiệm vụ mới
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
          <div className="col-span-3 text-center text-gray-500 py-8 bg-white rounded-lg border border-dashed">Chưa có nhiệm vụ nào.</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg line-clamp-1" title={task.title}>{task.title}</h3>
                {task.requireReply && (
                   <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded font-medium whitespace-nowrap">Yêu cầu phản hồi</span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{task.description}</p>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar size={16} className="mr-2" /> 
                Hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                 <button onClick={() => handleViewReplies(task)} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                    <CheckSquare size={16} className="mr-1" /> Tiến độ
                 </button>
                 <div className="flex space-x-2">
                    <button onClick={() => handleOpenModal(task)} className="text-gray-400 hover:text-indigo-600"><Edit size={18} /></button>
                    <button onClick={() => handleRemove(task.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Sửa Nhiệm Vụ' : 'Tạo Nhiệm Vụ Mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nội dung / Yêu cầu</label>
                <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700">Hạn chót</label>
                   <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
                </div>
                <div className="flex items-center mt-6">
                  <input type="checkbox" id="requireReply" checked={formData.requireReply} onChange={e => setFormData({...formData, requireReply: e.target.checked})} className="mr-2" />
                  <label htmlFor="requireReply" className="text-sm font-medium text-gray-700">Yêu cầu học sinh nộp/phản hồi</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Replies Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{viewingTask.title}</h2>
                <p className="text-sm text-gray-500">Hạn: {new Date(viewingTask.dueDate).toLocaleDateString('vi-VN')}</p>
              </div>
              <button onClick={() => setViewingTask(null)} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học sinh</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung phản hồi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đính kèm</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => {
                    const reply = taskReplies.find(r => r.studentId === student.id);
                    const hasReplied = !!reply;
                    const attachments = reply?.attachmentsJson ? JSON.parse(reply.attachmentsJson) : [];

                    return (
                      <tr key={student.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.fullName}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {hasReplied ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Đã phản hồi</span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Chưa phản hồi</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={reply?.replyText || ''}>
                          {reply?.replyText || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {attachments.map((link: string, idx: number) => (
                            <a key={idx} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-600 hover:underline mr-2">
                              <ExternalLink size={12} className="mr-1" /> Link
                            </a>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;