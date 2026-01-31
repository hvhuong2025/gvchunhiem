
import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Task, TaskReply, Student } from '../../core/types';
import { BookOpen, Calendar, Clock, Send, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';

const AppTasks: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myReplies, setMyReplies] = useState<Record<string, TaskReply>>({});
  const [loading, setLoading] = useState(true);
  
  // Reply Form State
  const [replyingTaskId, setReplyingTaskId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [linkInput, setLinkInput] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const user = await provider.getCurrentUser();
      const students = await provider.getStudents();
      let currentStudent: Student | undefined;

      if (user) {
         if (user.linkedStudentId) {
             currentStudent = students.find(s => s.id === user.linkedStudentId);
         } else if (user.role === 'STUDENT') {
             currentStudent = students.find(s => s.fullName.toLowerCase().trim() === user.fullName.toLowerCase().trim());
         }
      }
      
      setStudent(currentStudent || null);

      if (currentStudent) {
        const list = await provider.getTasks(currentStudent.classId);
        setTasks(list);

        // Fetch my replies
        const repliesMap: Record<string, TaskReply> = {};
        for (const t of list) {
          const allReplies = await provider.getTaskReplies(t.id);
          const myReply = allReplies.find(r => r.studentId === currentStudent!.id);
          if (myReply) repliesMap[t.id] = myReply;
        }
        setMyReplies(repliesMap);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSubmitReply = async (taskId: string) => {
    if (!student) return;
    
    const attachments = linkInput ? [linkInput] : []; // Simple 1 link for now
    
    const payload: TaskReply = {
      id: crypto.randomUUID(),
      taskId,
      studentId: student.id,
      parentId: student.parentId, // Optional linking
      replyText: replyText,
      attachmentsJson: JSON.stringify(attachments),
      createdAt: new Date().toISOString()
    };

    await provider.replyTask(payload);
    
    // Update local state
    setMyReplies(prev => ({ ...prev, [taskId]: payload }));
    setReplyingTaskId(null);
    setReplyText('');
    setLinkInput('');
    alert('Đã gửi phản hồi thành công!');
  };

  const isOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    // Reset time for fair comparison just by date
    due.setHours(23, 59, 59);
    return now > due;
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Đang tải...</div>;
  if (!student) return <div className="p-6 text-center text-gray-500">Bạn chưa được liên kết với hồ sơ học sinh.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <BookOpen className="mr-2 text-indigo-600" /> Nhắc Việc & Bài Tập
      </h1>

      <div className="space-y-6">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8 bg-white rounded-lg">Hiện tại không có nhiệm vụ nào.</div>
        ) : (
          tasks.map(task => {
            const reply = myReplies[task.id];
            const overdue = isOverdue(task.dueDate) && !reply;

            return (
              <div key={task.id} className={`bg-white rounded-lg shadow-sm border ${overdue ? 'border-red-200' : 'border-gray-100'} overflow-hidden`}>
                <div className={`p-5 ${overdue ? 'bg-red-50' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-lg">{task.title}</h3>
                    {overdue ? (
                      <span className="flex items-center text-red-600 text-xs font-bold bg-white px-2 py-1 rounded border border-red-200 shadow-sm">
                        <AlertCircle size={12} className="mr-1" /> Quá hạn
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                        <Calendar size={12} className="mr-1" /> {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{task.description}</p>
                  
                  {/* Action Section */}
                  <div className="border-t border-gray-100 pt-4">
                    {!task.requireReply ? (
                      <p className="text-sm text-gray-500 italic">Nhiệm vụ này không yêu cầu phản hồi.</p>
                    ) : (
                      <>
                        {reply ? (
                          <div className="bg-green-50 p-3 rounded-md border border-green-100">
                             <div className="flex items-center text-green-700 font-medium mb-1">
                               <CheckCircle size={16} className="mr-2" /> Đã hoàn thành / Đã gửi
                             </div>
                             <p className="text-sm text-gray-700 mb-1">"{reply.replyText}"</p>
                             {reply.attachmentsJson && JSON.parse(reply.attachmentsJson).length > 0 && (
                               <a href={JSON.parse(reply.attachmentsJson)[0]} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                                 <LinkIcon size={12} className="mr-1" /> Link đính kèm
                               </a>
                             )}
                             <button 
                                onClick={() => { setReplyingTaskId(task.id); setReplyText(reply.replyText); setLinkInput(reply.attachmentsJson ? JSON.parse(reply.attachmentsJson)[0] : ''); }}
                                className="text-xs text-gray-400 underline mt-2 hover:text-gray-600"
                             >
                               Cập nhật câu trả lời
                             </button>
                          </div>
                        ) : (
                          <>
                             {replyingTaskId === task.id ? (
                               <div className="bg-gray-50 p-4 rounded-md animate-fade-in">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung phản hồi:</label>
                                  <textarea 
                                    className="w-full border border-gray-300 rounded p-2 text-sm mb-3" 
                                    rows={3} 
                                    placeholder="Nhập câu trả lời của em..."
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                  />
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Link bài làm (nếu có):</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded p-2 text-sm mb-3" 
                                    placeholder="https://drive.google.com/..."
                                    value={linkInput}
                                    onChange={e => setLinkInput(e.target.value)}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setReplyingTaskId(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded">Hủy</button>
                                    <button 
                                      onClick={() => handleSubmitReply(task.id)} 
                                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded flex items-center"
                                      disabled={!replyText}
                                    >
                                      <Send size={14} className="mr-1" /> Gửi
                                    </button>
                                  </div>
                               </div>
                             ) : (
                               <button 
                                  onClick={() => setReplyingTaskId(task.id)}
                                  className="w-full py-2 bg-indigo-50 text-indigo-600 font-medium rounded hover:bg-indigo-100 transition-colors flex justify-center items-center"
                               >
                                  Gửi phản hồi / Nộp bài
                               </button>
                             )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AppTasks;
