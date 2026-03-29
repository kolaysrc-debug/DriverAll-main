"use client";

import { useState } from 'react';

export default function GoogleDriveUploadDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [driveUrl, setDriveUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
      setDriveUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('Lütfen önce bir dosya seçin.');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setMessage('Dosya yükleniyor, lütfen bekleyin...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/demo/upload-to-drive', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sunucudan bir hata yanıtı alındı.');
      }

      setStatus('success');
      setMessage(data.message || 'Dosya başarıyla yüklendi!');
      setDriveUrl(data.driveUrl || '');

    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Yükleme sırasında beklenmedik bir hata oluştu.');
      console.error('Upload error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900 rounded-2xl border border-slate-800">
        <h1 className="text-2xl font-bold text-center text-emerald-400">Google Drive Yükleme Testi</h1>
        <p className="text-center text-sm text-slate-400">
          Bu sayfa, backend'in Google Drive API'sine dosya yükleme yeteneğini test eder.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">Test Edilecek Dosya</label>
            <input 
              id="file-upload"
              type="file" 
              onChange={handleFileChange} 
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600/20 file:text-emerald-300 hover:file:bg-emerald-600/30 transition-colors cursor-pointer" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={!file || status === 'uploading'}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'uploading' ? 'Yükleniyor...' : 'Google Drive\'a Yükle'}
          </button>
        </form>

        {message && (
          <div 
            className={`p-4 rounded-lg text-sm ${ 
              status === 'success' ? 'bg-emerald-950/50 border border-emerald-700/50 text-emerald-300' : 
              status === 'error' ? 'bg-rose-950/50 border border-rose-800/50 text-rose-300' : 
              'bg-sky-950/50 border border-sky-800/50 text-sky-300' 
            }`}
          >
            <p className='font-semibold'>{status.toUpperCase()}</p>
            <p>{message}</p>
            {status === 'success' && driveUrl && (
              <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-emerald-400 hover:text-emerald-300 underline font-medium">Dosyayı Görüntüle</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
