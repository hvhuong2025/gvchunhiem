
import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Student, Question, QuestionType, Achievement } from '../../core/types';
import { Trophy, Star, ArrowUp, ArrowDown, RefreshCw, CheckCircle, XCircle, Award } from 'lucide-react';

// Re-using badges definition (Ideally this should be in a shared constant file)
const BADGES: Achievement[] = [
  { id: 'b1', title: 'Tân Binh', description: 'Bắt đầu hành trình học tập', minXp: 0, icon: '🌱', color: 'bg-green-100 text-green-600' },
  { id: 'b2', title: 'Siêu Trí Nhớ', description: 'Đạt 100 điểm kinh nghiệm', minXp: 100, icon: '🧠', color: 'bg-blue-100 text-blue-600' },
  { id: 'b3', title: 'Ong Chăm Chỉ', description: 'Đạt 500 điểm kinh nghiệm', minXp: 500, icon: '🐝', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'b4', title: 'Kiện Tướng', description: 'Đạt level 10 (1000 XP)', minXp: 1000, icon: '🛡️', color: 'bg-purple-100 text-purple-600' },
  { id: 'b5', title: 'Huyền Thoại', description: 'Đạt 5000 điểm kinh nghiệm', minXp: 5000, icon: '👑', color: 'bg-red-100 text-red-600' },
];

const GameLevel: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<Achievement[]>([]);

  // User input states
  const [userShortAns, setUserShortAns] = useState('');
  const [userSortOrder, setUserSortOrder] = useState<string[]>([]);
  const [userMatchPairs, setUserMatchPairs] = useState<{left:string, right:string}[]>([]);
  
  // Matching Game UI State
  const [matchLeftSelected, setMatchLeftSelected] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const user = await provider.getCurrentUser();
      const students = await provider.getStudents();
      let currentStudent: Student | undefined;

      // Find current student logic (simplified reuse)
      if (user) {
         if (user.linkedStudentId) currentStudent = students.find(s => s.id === user.linkedStudentId);
         else if (user.role === 'STUDENT') currentStudent = students.find(s => s.fullName.trim() === user.fullName.trim());
      }
      
      // Fallback for demo if no proper login
      if (!currentStudent && students.length > 0) currentStudent = students[0];

      setStudent(currentStudent || null);
      if (currentStudent) {
         const myBadges = BADGES.filter(b => (currentStudent?.xp || 0) >= b.minXp);
         setEarnedBadges(myBadges);
      }

      const qList = await provider.getQuestions();
      setQuestions(qList);
    };
    init();
  }, []);

  const getNextLevelXP = (level: number) => level * 100;

  const handleStartGame = () => {
     if (questions.length === 0) return;
     const randomQ = questions[Math.floor(Math.random() * questions.length)];
     prepareQuestion(randomQ);
  };

  const prepareQuestion = (q: Question) => {
    setFeedback(null);
    setCurrentQuestion(q);
    
    // Reset inputs
    setUserShortAns('');
    
    if (q.type === QuestionType.SORTING) {
       // Shuffle options
       const opts = JSON.parse(q.optionsJson) as string[];
       setUserSortOrder([...opts].sort(() => Math.random() - 0.5));
    } else if (q.type === QuestionType.MATCHING) {
       setUserMatchPairs([]);
       setMatchLeftSelected(null);
    }
  };

  const handleMCAnswer = async (option: string) => {
     if (!currentQuestion || !student) return;
     const correct = JSON.parse(currentQuestion.correctAnswerJson);
     processResult(option === correct);
  };

  const handleShortSubmit = () => {
     if (!currentQuestion || !student) return;
     const correct = JSON.parse(currentQuestion.correctAnswerJson);
     processResult(userShortAns.trim().toLowerCase() === correct.toLowerCase());
  };

  const handleSortSubmit = () => {
    if (!currentQuestion || !student) return;
    const correct = JSON.parse(currentQuestion.correctAnswerJson) as string[];
    // Check if arrays are equal
    const isCorrect = JSON.stringify(userSortOrder) === JSON.stringify(correct);
    processResult(isCorrect);
  };

  const handleMatchSelect = (side: 'left' | 'right', val: string) => {
     if (side === 'left') {
        // If already paired, ignore
        if (userMatchPairs.some(p => p.left === val)) return;
        setMatchLeftSelected(val);
     } else {
        if (!matchLeftSelected) return;
        // If right already used, ignore
        if (userMatchPairs.some(p => p.right === val)) return;
        
        setUserMatchPairs([...userMatchPairs, { left: matchLeftSelected, right: val }]);
        setMatchLeftSelected(null);
     }
  };

  const handleMatchReset = () => {
     setUserMatchPairs([]);
     setMatchLeftSelected(null);
  };

  const handleMatchSubmit = () => {
     if (!currentQuestion) return;
     const correctPairs = JSON.parse(currentQuestion.optionsJson) as {key: string, value: string}[];
     
     if (userMatchPairs.length !== correctPairs.length) {
         processResult(false);
         return;
     }

     let isCorrect = true;
     userMatchPairs.forEach(userPair => {
        const match = correctPairs.find(cp => cp.key === userPair.left);
        if (!match || match.value !== userPair.right) isCorrect = false;
     });
     processResult(isCorrect);
  };

  const processResult = async (isCorrect: boolean) => {
     if (!currentQuestion || !student) return;

     if (isCorrect) {
        setFeedback('correct');
        setStreak(streak + 1);
        const updatedStudent = await provider.updateStudentXP(student.id, currentQuestion.points);
        setStudent(updatedStudent);
        
        // Update badges immediately
        const newBadges = BADGES.filter(b => updatedStudent.xp >= b.minXp);
        setEarnedBadges(newBadges);

     } else {
        setFeedback('wrong');
        setStreak(0);
     }
  };

  if (!student) return <div className="p-6">Đang tải...</div>;

  const progressPercent = (student.xp % 100) / 100 * 100; // Simplified for demo (100 per level)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">Cấp độ {student.level}</h1>
            <p className="opacity-90">{student.fullName}</p>
         </div>
         
         {/* Badges Mini View */}
         <div className="flex gap-1 bg-white bg-opacity-10 p-2 rounded-lg">
            {BADGES.map(b => {
                const earned = earnedBadges.some(eb => eb.id === b.id);
                return (
                   <div key={b.id} className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${earned ? 'bg-white text-yellow-600 shadow' : 'bg-black bg-opacity-20 opacity-30 grayscale'}`} title={b.title}>
                      {b.icon}
                   </div>
                )
            })}
         </div>

         <div className="text-right min-w-[150px]">
            <div className="flex items-center justify-end gap-2 mb-1">
               <Trophy className="text-yellow-300" />
               <span className="text-2xl font-bold">{student.xp} XP</span>
            </div>
            <div className="w-full h-2 bg-black bg-opacity-20 rounded-full overflow-hidden">
               <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-xs mt-1 opacity-75">Tiếp theo: {100 - (student.xp % 100)} XP nữa</p>
         </div>
      </div>

      {!currentQuestion ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
           <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={40} className="text-blue-500" />
           </div>
           <h2 className="text-xl font-bold text-gray-800 mb-2">Sẵn sàng luyện tập?</h2>
           <p className="text-gray-500 mb-6">Trả lời câu hỏi để tích lũy XP và thăng cấp!</p>
           
           <div className="mb-8">
              <p className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">Thành tích của bạn</p>
              <div className="flex flex-wrap justify-center gap-4">
                 {earnedBadges.length > 0 ? earnedBadges.map(b => (
                    <div key={b.id} className="flex flex-col items-center bg-gray-50 p-3 rounded-lg border border-gray-200 w-24">
                       <span className="text-2xl mb-1">{b.icon}</span>
                       <span className="text-xs font-bold text-gray-700">{b.title}</span>
                    </div>
                 )) : <p className="text-sm text-gray-400">Chưa có huy hiệu nào.</p>}
              </div>
           </div>

           <button 
             onClick={handleStartGame}
             className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 shadow-lg transition-transform hover:scale-105"
           >
             Bắt đầu ngay
           </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 relative overflow-hidden min-h-[400px]">
           {/* Feedback Overlay */}
           {feedback && (
             <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 bg-white bg-opacity-95 transition-opacity`}>
                {feedback === 'correct' ? (
                   <div className="text-center animate-bounce-short">
                      <CheckCircle size={64} className="text-green-500 mx-auto mb-2" />
                      <h2 className="text-2xl font-bold text-green-600">Chính xác!</h2>
                      <p className="text-gray-600">Bạn nhận được +{currentQuestion.points} XP</p>
                   </div>
                ) : (
                   <div className="text-center animate-shake">
                      <XCircle size={64} className="text-red-500 mx-auto mb-2" />
                      <h2 className="text-2xl font-bold text-red-600">Chưa đúng rồi</h2>
                      <p className="text-gray-600">Hãy cố gắng lần sau nhé!</p>
                   </div>
                )}
                <button 
                  onClick={handleStartGame} 
                  className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 flex items-center"
                >
                   <RefreshCw size={18} className="mr-2" /> Câu hỏi tiếp theo
                </button>
             </div>
           )}

           <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                 <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{currentQuestion.type}</span>
                 <span className="text-indigo-600 font-bold text-sm">+{currentQuestion.points} XP</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{currentQuestion.content}</h3>
           </div>

           <div className="min-h-[200px]">
              {/* RENDER QUESTION TYPES */}
              
              {/* 1. Multiple Choice */}
              {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {JSON.parse(currentQuestion.optionsJson).map((opt: string, idx: number) => (
                       <button 
                         key={idx}
                         onClick={() => handleMCAnswer(opt)}
                         className="p-4 border-2 border-gray-100 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                       >
                         <span className="font-bold text-gray-400 mr-2">{String.fromCharCode(65+idx)}.</span>
                         {opt}
                       </button>
                    ))}
                 </div>
              )}

              {/* 2. Short Answer */}
              {currentQuestion.type === QuestionType.SHORT_ANSWER && (
                 <div className="text-center">
                    <input 
                      type="text" 
                      value={userShortAns}
                      onChange={e => setUserShortAns(e.target.value)}
                      placeholder="Nhập câu trả lời của bạn..."
                      className="w-full text-center text-lg border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 mb-6"
                    />
                    <button onClick={handleShortSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Kiểm tra</button>
                 </div>
              )}

              {/* 3. Sorting */}
              {currentQuestion.type === QuestionType.SORTING && (
                 <div className="space-y-2 max-w-md mx-auto">
                    {userSortOrder.map((item, idx) => (
                       <div key={item} className="flex items-center bg-gray-50 p-3 rounded border border-gray-200">
                          <span className="flex-1 font-medium">{item}</span>
                          <div className="flex flex-col gap-1">
                             <button 
                               onClick={() => {
                                 if (idx === 0) return;
                                 const newOrder = [...userSortOrder];
                                 [newOrder[idx], newOrder[idx-1]] = [newOrder[idx-1], newOrder[idx]];
                                 setUserSortOrder(newOrder);
                               }}
                               disabled={idx === 0}
                               className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                             >
                               <ArrowUp size={14}/>
                             </button>
                             <button 
                               onClick={() => {
                                 if (idx === userSortOrder.length - 1) return;
                                 const newOrder = [...userSortOrder];
                                 [newOrder[idx], newOrder[idx+1]] = [newOrder[idx+1], newOrder[idx]];
                                 setUserSortOrder(newOrder);
                               }}
                               disabled={idx === userSortOrder.length - 1}
                               className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                             >
                               <ArrowDown size={14}/>
                             </button>
                          </div>
                       </div>
                    ))}
                    <button onClick={handleSortSubmit} className="w-full mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Kiểm tra thứ tự</button>
                 </div>
              )}

              {/* 4. Matching */}
              {currentQuestion.type === QuestionType.MATCHING && (
                 <div>
                    <div className="grid grid-cols-2 gap-8 mb-6">
                       <div className="space-y-2">
                          {/* Shuffle keys for display */}
                          {JSON.parse(currentQuestion.optionsJson).map((pair: any) => {
                             const isPaired = userMatchPairs.some(p => p.left === pair.key);
                             const isSelected = matchLeftSelected === pair.key;
                             return (
                               <button 
                                 key={pair.key}
                                 onClick={() => handleMatchSelect('left', pair.key)}
                                 disabled={isPaired}
                                 className={`w-full p-3 text-left rounded border-2 transition-all ${
                                    isPaired ? 'bg-gray-100 border-gray-100 text-gray-400' :
                                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                                 }`}
                               >
                                 {pair.key}
                               </button>
                             )
                          })}
                       </div>
                       <div className="space-y-2">
                          {/* We should shuffle values too, but for simplicty in this render logic we map the values. Ideally pre-shuffle in prepareQuestion */}
                          {JSON.parse(currentQuestion.optionsJson).map((pair: any) => {
                             const pairedWith = userMatchPairs.find(p => p.right === pair.value);
                             return (
                               <button 
                                 key={pair.value}
                                 onClick={() => handleMatchSelect('right', pair.value)}
                                 disabled={!!pairedWith}
                                 className={`w-full p-3 text-right rounded border-2 transition-all ${
                                    pairedWith ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 hover:border-blue-300'
                                 }`}
                               >
                                 {pair.value}
                                 {pairedWith && <span className="block text-[10px] text-gray-400">({pairedWith.left})</span>}
                               </button>
                             )
                          })}
                       </div>
                    </div>
                    <div className="flex justify-center gap-4">
                       <button onClick={handleMatchReset} className="px-4 py-2 text-gray-600 underline">Làm lại</button>
                       <button onClick={handleMatchSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Kiểm tra kết quả</button>
                    </div>
                 </div>
              )}

           </div>
        </div>
      )}
    </div>
  );
};

export default GameLevel;
