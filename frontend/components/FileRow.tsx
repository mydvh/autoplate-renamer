import React from 'react';
import { FileItem, ProcessingStatus, Viewpoint, PlateColor } from '../types';
import { CheckCircle, AlertCircle, Loader2, Image as ImageIcon, ArrowRight } from 'lucide-react';

interface FileRowProps {
  item: FileItem;
}

const FileRow: React.FC<FileRowProps> = ({ item }) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case ProcessingStatus.PROCESSING:
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case ProcessingStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case ProcessingStatus.ERROR:
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-slate-600" />;
    }
  };

  const getColorBadge = (color: PlateColor) => {
    const map = {
      [PlateColor.WHITE]: 'bg-slate-100 text-slate-800 border-slate-300',
      [PlateColor.YELLOW]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      [PlateColor.BLUE]: 'bg-blue-100 text-blue-800 border-blue-300',
      [PlateColor.OTHER]: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${map[color]}`}>{color}</span>;
  };

  const getViewpointBadge = (view: Viewpoint) => {
     const map = {
      [Viewpoint.FRONT]: 'bg-indigo-900 text-indigo-200 border-indigo-700',
      [Viewpoint.REAR]: 'bg-purple-900 text-purple-200 border-purple-700',
      [Viewpoint.UNKNOWN]: 'bg-slate-700 text-slate-300 border-slate-600',
    };
    return <span className={`px-2 py-0.5 text-xs font-medium uppercase rounded border ${map[view]}`}>{view}</span>;
  }

  return (
    <div className="group flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
        {item.previewUrl ? (
          <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <ImageIcon className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col justify-center">
          <p className="text-sm text-slate-400 truncate font-mono mb-1">{item.originalFile.name}</p>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${item.status === ProcessingStatus.ERROR ? 'text-red-400' : 'text-slate-200'}`}>
              {item.status === ProcessingStatus.IDLE && 'Pending'}
              {item.status === ProcessingStatus.PROCESSING && 'Analyzing...'}
              {item.status === ProcessingStatus.COMPLETED && 'Renamed'}
              {item.status === ProcessingStatus.ERROR && 'Failed'}
            </span>
          </div>
           {item.errorMessage && (
            <p className="text-xs text-red-400 mt-1 truncate">{item.errorMessage}</p>
          )}
        </div>

        {/* Result Details */}
        {item.result && (
          <div className="flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Detected:</span>
              <span className="text-sm font-bold font-mono bg-black/30 px-2 py-0.5 rounded text-white tracking-widest">
                {item.result.plateNumber}
              </span>
              {getColorBadge(item.result.plateColor)}
              {getViewpointBadge(item.result.viewpoint)}
            </div>
            
            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
              <ArrowRight className="w-4 h-4" />
              <span className="font-mono text-sm font-semibold truncate">{item.newName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileRow;
