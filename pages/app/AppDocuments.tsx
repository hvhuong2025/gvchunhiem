import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Document as ClassDocument, Student } from '../../core/types';
import { FileText, Download, FolderOpen } from 'lucide-react';

const AppDocuments: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<ClassDocument[]>([]);

  useEffect(() => {
    const init = async () => {
      const students = await provider.getStudents();
      const currentStudent = students[0];
      setStudent(currentStudent);

      if (currentStudent) {
        const list = await provider.getDocuments(currentStudent.classId);
        setDocuments(list);
      }
    };
    init();
  }, []);

  // Group by category
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, ClassDocument[]>);

  if (!student) return <div className="p-6 text-center">Đang tải...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FolderOpen className="mr-2 text-indigo-600" /> Tài Liệu Lớp Học
      </h1>

      {documents.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-white rounded-lg">Chưa có tài liệu nào được chia sẻ.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocs).map(([category, docs]: [string, ClassDocument[]]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-gray-700 mb-3 ml-1 border-l-4 border-indigo-400 pl-3">{category}</h2>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                {docs.map((doc, index) => (
                  <div key={doc.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 ${index !== docs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center">
                       <div className="p-2 bg-indigo-50 text-indigo-600 rounded mr-3">
                         <FileText size={20} />
                       </div>
                       <div>
                         <div className="font-medium text-gray-800">{doc.title}</div>
                         <div className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</div>
                       </div>
                    </div>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                      <Download size={16} className="mr-1" /> Tải về
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppDocuments;