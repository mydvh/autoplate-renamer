import React, { useState, useEffect, useRef } from 'react';
import { FileItem, ProcessingStatus, FileSystemDirectoryHandle, FileSystemFileHandle, User } from '../types';
import { analyzeCarImage, fileToBase64 } from '../services/geminiService';
import { generateNewFilename } from '../utils/renamingLogic';
import { dbService } from '../services/dbService';
import FileRow from './FileRow';
import { Play, Car, FolderInput, FolderOutput, AlertTriangle, CheckCircle2, FolderOpen, Timer, Power, LogOut, ArrowLeft } from 'lucide-react';

// Get Scan Duration from env or default to 15 seconds
const SCAN_DURATION_SEC = process.env.SCAN_DURATION ? parseInt(process.env.SCAN_DURATION, 10) : 15;
const SCAN_INTERVAL_MS = SCAN_DURATION_SEC * 1000;

declare global {
  interface Window {
    showDirectoryPicker(options?: { mode: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
  }
}

interface RenamerToolProps {
  user: User;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
}

const RenamerTool: React.FC<RenamerToolProps> = ({ user, onLogout, onNavigateToAdmin }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [inputHandle, setInputHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [outputHandle, setOutputHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoWatch, setIsAutoWatch] = useState(false);
  const [scanInterval, setScanInterval] = useState(15); // seconds
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(user);
  
  const filesRef = useRef(files);
  filesRef.current = files;

  const supportsFileSystem = 'showDirectoryPicker' in window;

  // Load user profile with saved folder paths
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await dbService.getUserProfile();
        setCurrentUser(profile);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
    };
    loadUserProfile();
  }, []);

  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    };
  }, []);

  useEffect(() => {
    let intervalId: any;
    if (isAutoWatch && inputHandle && outputHandle) {
      const scan = async () => {
        await scanDirectory(inputHandle);
      };
      scan();
      intervalId = setInterval(scan, scanInterval * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoWatch, inputHandle, outputHandle, scanInterval]);

  useEffect(() => {
    if (isAutoWatch && !isProcessing && outputHandle) {
      const hasPending = files.some(f => f.status === ProcessingStatus.IDLE);
      if (hasPending) {
        processFiles();
      }
    }
  }, [files, isAutoWatch, isProcessing, outputHandle]);


  const scanDirectory = async (handle: FileSystemDirectoryHandle) => {
    try {
      const newEntries: FileItem[] = [];
      const existingNames = new Set(filesRef.current.map(f => f.originalFile.name));

      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          if (existingNames.has(entry.name)) continue;
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          if (file.type.startsWith('image/')) {
            newEntries.push({
              id: Math.random().toString(36).substring(7),
              originalFile: file,
              fileHandle: fileHandle,
              previewUrl: URL.createObjectURL(file),
              status: ProcessingStatus.IDLE,
            });
          }
        }
      }
      if (newEntries.length > 0) {
        setFiles(prev => [...prev, ...newEntries]);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
         setIsAutoWatch(false);
         setError("Lost access to folder. Please select it again.");
      }
    }
  };

  const handleSelectInputFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setInputHandle(handle);
      setError(null);
      await scanDirectory(handle);
      
      // Save to DB
      try {
        await dbService.updateUserProfile({ inputFolderPath: handle.name });
        setCurrentUser(prev => ({ ...prev, inputFolderPath: handle.name }));
      } catch (dbErr) {
        console.error('Failed to save folder path:', dbErr);
        // Don't show error if folder selection worked, just DB save failed
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Folder selection error:', err);
        setError("Failed to access folder.");
      }
    }
  };

  const handleSelectOutputFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setOutputHandle(handle);
      setError(null);
      
      // Save to DB
      try {
        await dbService.updateUserProfile({ outputFolderPath: handle.name });
        setCurrentUser(prev => ({ ...prev, outputFolderPath: handle.name }));
      } catch (dbErr) {
        console.error('Failed to save folder path:', dbErr);
        // Don't show error if folder selection worked, just DB save failed
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Folder selection error:', err);
        setError("Failed to access folder.");
      }
    }
  };

  const writeWithBackupStrategy = async (directory: FileSystemDirectoryHandle, fileName: string, newFileContent: File) => {
    try {
      const existingHandle = await directory.getFileHandle(fileName);
      const existingFile = await existingHandle.getFile();
      
      const lastDotIndex = fileName.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
      const ext = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';

      let counter = 1;
      let backupName = "";
      while (true) {
        backupName = `${nameWithoutExt}-${counter}${ext}`;
        try {
          await directory.getFileHandle(backupName);
          counter++;
        } catch (err: any) {
          if (err.name === 'NotFoundError') break;
          throw err;
        }
      }
      const backupHandle = await directory.getFileHandle(backupName, { create: true });
      const backupWritable = await backupHandle.createWritable();
      await backupWritable.write(existingFile);
      await backupWritable.close();
    } catch (err: any) {
      if (err.name !== 'NotFoundError') throw err;
    }

    const targetHandle = await directory.getFileHandle(fileName, { create: true });
    const writable = await targetHandle.createWritable();
    await writable.write(newFileContent);
    await writable.close();
  };

  const processFiles = async () => {
    if (!inputHandle || !outputHandle) return;
    setIsProcessing(true);
    let isSameFolder = false;
    try { isSameFolder = await inputHandle.isSameEntry(outputHandle); } catch (e) {}
    
    const filesToProcess = files.filter(f => f.status === ProcessingStatus.IDLE);

    for (const fileItem of filesToProcess) {
      setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: ProcessingStatus.PROCESSING } : f));
      try {
        const base64 = await fileToBase64(fileItem.originalFile);
        const result = await analyzeCarImage(base64, fileItem.originalFile.type);
        const newName = generateNewFilename(fileItem.originalFile.name, result);

        await writeWithBackupStrategy(outputHandle, newName, fileItem.originalFile);

        if (fileItem.fileHandle) {
          if (!isSameFolder || fileItem.originalFile.name !== newName) {
            try { await inputHandle.removeEntry(fileItem.originalFile.name); } catch (delErr) {}
          }
        }
        
        // --- LOGGING TO DATABASE ---
        await dbService.createLog(user.id, user.username, fileItem.originalFile.name, newName);

        setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: ProcessingStatus.COMPLETED, result, newName } : f));

      } catch (error: any) {
        setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: ProcessingStatus.ERROR, errorMessage: error.message } : f));
      }
    }
    setIsProcessing(false);
  };

  const clearFiles = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setInputHandle(null);
    setIsAutoWatch(false);
  };

  if (!supportsFileSystem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        <p>Browser not supported. Use Chrome/Edge.</p>
      </div>
    );
  }

  const completedCount = files.filter(f => f.status === ProcessingStatus.COMPLETED).length;

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto relative">
      <header className="mb-10 flex flex-col items-center relative">
        <div className="absolute right-0 top-0 flex items-center gap-2">
           <div className="text-right hidden sm:block mr-2">
             <p className="text-xs text-slate-400">Logged in as</p>
             <p className="text-sm font-medium text-white">{user.username}</p>
           </div>
           {onNavigateToAdmin && (
             <button onClick={onNavigateToAdmin} className="p-2 bg-purple-600/20 text-purple-300 rounded hover:bg-purple-600/30" title="Admin Dashboard">
               <ArrowLeft className="w-5 h-5" />
             </button>
           )}
           <button onClick={onLogout} className="p-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700" title="Logout">
              <LogOut className="w-5 h-5" />
           </button>
        </div>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-indigo-500/20">
          <Car className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-200">
          AutoPlate Renamer
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto text-center">
          {user.role === 'ADMIN' ? 'Admin Mode' : 'Standard User Mode'}
        </p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded-xl flex items-center gap-3 text-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 mb-8 backdrop-blur-sm sticky top-6 z-20 shadow-xl">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Folder Configuration</h3>
            <p className="text-slate-400 text-sm">
              {currentUser.inputFolderPath || currentUser.outputFolderPath 
                ? 'Previously selected folders are saved. Click to change or reselect.'
                : 'Select input and output folders for processing'}
            </p>
          </div>

          {/* Folder Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Folder */}
            <div 
              onClick={async () => {
                if (isProcessing || isAutoWatch || files.some(f => !f.fileHandle)) return;
                await handleSelectInputFolder();
              }}
              className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                inputHandle && !files.some(f => !f.fileHandle)
                  ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20' 
                  : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
              } ${(isProcessing || isAutoWatch || files.some(f => !f.fileHandle)) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${inputHandle && !files.some(f => !f.fileHandle) ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                  <FolderInput className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${inputHandle && !files.some(f => !f.fileHandle) ? 'text-green-300' : 'text-slate-300'}`}>
                      Input Folder
                    </h4>
                    {inputHandle && !files.some(f => !f.fileHandle) && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Source images folder</p>
                  {inputHandle && !files.some(f => !f.fileHandle) ? (
                    <div className="bg-slate-900/50 px-3 py-2 rounded border border-slate-700">
                      <p className="text-sm text-green-300 font-medium truncate">{inputHandle.name}</p>
                    </div>
                  ) : currentUser.inputFolderPath && !inputHandle ? (
                    <div className="bg-slate-900/50 px-3 py-2 rounded border border-slate-700">
                      <p className="text-sm text-slate-400 font-medium truncate">Last: {currentUser.inputFolderPath}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">Click to select folder</p>
                  )}
                </div>
              </div>
            </div>

            {/* Output Folder */}
            <div 
              onClick={async () => {
                if (isProcessing || isAutoWatch) return;
                await handleSelectOutputFolder();
              }}
              className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                outputHandle 
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
                  : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
              } ${(isProcessing || isAutoWatch) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${outputHandle ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                  <FolderOutput className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${outputHandle ? 'text-blue-300' : 'text-slate-300'}`}>
                      Output Folder
                    </h4>
                    {outputHandle && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Destination for renamed files</p>
                  {outputHandle ? (
                    <div className="bg-slate-900/50 px-3 py-2 rounded border border-slate-700">
                      <p className="text-sm text-blue-300 font-medium truncate">{outputHandle.name}</p>
                    </div>
                  ) : currentUser.outputFolderPath && !outputHandle ? (
                    <div className="bg-slate-900/50 px-3 py-2 rounded border border-slate-700">
                      <p className="text-sm text-slate-400 font-medium truncate">Last: {currentUser.outputFolderPath}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">Click to select folder</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scan Interval Setting - Only show when input folder selected */}
          {inputHandle && (
            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-1">Auto Scan Interval</h4>
                  <p className="text-xs text-slate-500">How often to check for new files (seconds)</p>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="5" 
                    max="300" 
                    step="5"
                    value={scanInterval}
                    onChange={(e) => setScanInterval(Math.max(5, parseInt(e.target.value) || 15))}
                    className="w-20 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-center focus:border-purple-500 focus:outline-none"
                    disabled={isAutoWatch}
                  />
                  <span className="text-sm text-slate-400">sec</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-700/50">
             <div className="text-slate-400 text-sm flex items-center gap-4">
                <div className="flex items-center gap-2"><FolderOpen className="w-4 h-4" /> <span>Total: <strong className="text-slate-200">{files.length}</strong></span></div>
                {inputHandle && <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-2 py-1 rounded text-xs">From Folder: {files.filter(f => f.fileHandle).length}</div>}
                {isAutoWatch && <div className="flex items-center gap-2 text-purple-400 bg-purple-900/20 px-2 py-1 rounded"><Timer className="w-3.5 h-3.5 animate-pulse" /><span className="text-xs font-medium">Auto: {scanInterval}s</span></div>}
             </div>

             <div className="flex gap-3 w-full sm:w-auto items-center">
                {inputHandle && outputHandle && (
                   <button onClick={() => setIsAutoWatch(!isAutoWatch)} disabled={isProcessing && !isAutoWatch} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-all text-sm ${isAutoWatch ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                     <Power className={`w-4 h-4 ${isAutoWatch ? 'text-purple-400' : 'text-slate-400'}`} /> {isAutoWatch ? 'Auto ON' : 'Auto OFF'}
                   </button>
                )}
                {files.length > 0 && !isProcessing && !isAutoWatch && <button onClick={clearFiles} className="px-4 py-2 rounded-lg font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all text-sm">Reset</button>}
                {!isAutoWatch && (
                  <button onClick={processFiles} disabled={files.length === 0 || !outputHandle || isProcessing || completedCount === files.length} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 text-white shadow-lg disabled:opacity-50">
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>{isProcessing ? 'Processing...' : 'Start Now'}</span>
                  </button>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {files.length === 0 ? (
          <div className="border-2 border-dashed border-slate-700 rounded-3xl p-12 text-center opacity-50">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><FolderInput className="w-8 h-8 text-slate-600" /></div>
            <h3 className="text-xl font-medium text-slate-300 mb-2">Waiting for folder...</h3>
          </div>
        ) : (
          files.map((file) => <FileRow key={file.id} item={file} />)
        )}
      </div>
      <p className="text-slate-400 max-w-lg mx-auto text-center">
          Supported by: maxvn2268@gmail.com - 0944.452.268
        </p>
    </div>
    
  );
};

export default RenamerTool;