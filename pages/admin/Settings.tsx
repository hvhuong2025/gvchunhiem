
import React, { useEffect, useState } from 'react';
import provider from '../../core/provider';
import { Settings as SettingsIcon, Save, RefreshCw, Link, AlertCircle, CheckCircle, Lock, Key } from 'lucide-react';
import { User } from '../../core/types';
import { GoogleProvider } from '../../providers/googleProvider';

const SettingsPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    provider.getCurrentUser().then(u => {
      setCurrentUser(u);
      if (u?.role === 'ADMIN') {
        const gp = provider as GoogleProvider;
        setUrl(gp.getApiUrl());
        setApiKey(gp.getApiKey());
        checkStatus();
      }
    });
  }, []);

  const checkStatus = async () => {
    // Only check if we have config
    const gp = provider as GoogleProvider;
    if (!gp.getApiUrl() || !gp.getApiKey()) {
        setStatus('idle');
        return;
    }

    setStatus('checking');
    setMessage('Đang kiểm tra kết nối...');
    const isConnected = await provider.checkConnection();
    if (isConnected) {
      setStatus('connected');
      setMessage('Kết nối thành công! Hệ thống hoạt động bình thường.');
    } else {
      setStatus('error');
      setMessage('Không thể kết nối. Vui lòng kiểm tra lại URL hoặc API Key.');
    }
  };

  const handleSave = () => {
    if (!url.trim() || !apiKey.trim()) {
      alert('Vui lòng nhập đầy đủ URL và API Key');
      return;
    }
    const gp = provider as GoogleProvider;
    gp.setApiUrl(url);
    gp.setApiKey(apiKey);
    
    // Trigger check
    checkStatus();
  };

  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
        <div className="bg-red-100 p-4 rounded-full mb-4">
           <Lock size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Truy cập bị từ chối</h2>
        <p className="text-gray-600 max-w-md">
          Chỉ có tài khoản Quản trị viên cấp cao (ADMIN) mới có quyền truy cập vào cấu hình hệ thống.
          Vui lòng liên hệ người quản trị nếu bạn cần thay đổi API.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <SettingsIcon className="mr-2" /> Cấu Hình Hệ Thống
      </h1>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="bg-blue-100 p-2 rounded-full">
            <Link className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Kết nối Google Apps Script</h3>
            <p className="text-sm text-gray-600">
              Nhập đường dẫn Web App URL và API Key (Secret Key) từ Google Apps Script để kết nối dữ liệu.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Web App URL (Exec)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               API Key (Secret Key)
             </label>
             <div className="relative">
                <Key className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Nhập secret key của bạn..."
                  className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
             </div>
             <p className="text-xs text-gray-500 mt-2">
               * Key này phải trùng khớp với biến SECRET_KEY trong file Code.gs của bạn.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
             <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 flex items-center"
              >
                <Save size={18} className="mr-2" /> Lưu Cấu Hình
              </button>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h4 className="font-bold text-gray-800 mb-4">Trạng thái kết nối</h4>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <div className={`w-4 h-4 rounded-full ${
                      status === 'connected' ? 'bg-green-500' :
                      status === 'error' ? 'bg-red-500' :
                      'bg-gray-400 animate-pulse'
                    }`}></div>
                    {status === 'connected' && (
                       <div className="absolute top-0 right-0 -mr-1 -mt-1 w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
                    )}
                 </div>
                 <span className={`font-medium ${
                    status === 'connected' ? 'text-green-700' :
                    status === 'error' ? 'text-red-700' :
                    'text-gray-600'
                 }`}>
                    {status === 'checking' ? 'Đang kiểm tra...' : 
                     status === 'connected' ? 'Đã kết nối' : 'Mất kết nối'}
                 </span>
              </div>
              
              <button 
                onClick={checkStatus}
                disabled={status === 'checking'}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <RefreshCw size={16} className={`mr-1 ${status === 'checking' ? 'animate-spin' : ''}`} /> 
                Kiểm tra lại
              </button>
            </div>
            {message && (
               <div className={`mt-3 text-sm flex items-center ${
                 status === 'connected' ? 'text-green-600' : 
                 status === 'error' ? 'text-red-600' : 'text-gray-500'
               }`}>
                  {status === 'connected' ? <CheckCircle size={16} className="mr-1.5"/> : 
                   status === 'error' ? <AlertCircle size={16} className="mr-1.5"/> : null}
                  {message}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
