import React, { useState } from 'react';
import { Download, FileText, Database, Image, Settings } from 'lucide-react';

interface ExportPanelProps {
  selectedFloat: any;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ selectedFloat }) => {
  const [exportFormat, setExportFormat] = useState('csv');

  const exportOptions = [
    { id: 'csv', label: 'CSV', icon: FileText, description: 'Comma-separated values' },
    { id: 'netcdf', label: 'NetCDF', icon: Database, description: 'Scientific data format' },
    { id: 'png', label: 'PNG', icon: Image, description: 'Profile visualization' },
    { id: 'json', label: 'JSON', icon: FileText, description: 'JavaScript object notation' }
  ];

  const handleExport = () => {
    // Mock export functionality
    const filename = selectedFloat 
      ? `${selectedFloat.id}_${exportFormat}_${new Date().toISOString().split('T')[0]}.${exportFormat}`
      : `argo_data_${exportFormat}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    
    console.log(`Exporting as ${filename}`);
    // In a real implementation, this would trigger actual data export
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <Download className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold">Export Data</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Export Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Export Format</label>
          <div className="grid grid-cols-2 gap-2">
            {exportOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setExportFormat(option.id)}
                className={`p-3 rounded-lg border transition-all ${
                  exportFormat === option.id
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <option.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div>
          <label className="block text-sm font-medium mb-3">Data Selection</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded text-cyan-400" />
              <span className="text-sm">Temperature profiles</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded text-cyan-400" />
              <span className="text-sm">Salinity profiles</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-cyan-400" />
              <span className="text-sm">BGC parameters</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-cyan-400" />
              <span className="text-sm">Metadata</span>
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium mb-3">Date Range</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm focus:outline-none focus:border-cyan-400"
              defaultValue="2024-01-01"
            />
            <input
              type="date"
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm focus:outline-none focus:border-cyan-400"
              defaultValue="2024-01-15"
            />
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all font-medium shadow-lg"
        >
          <Download className="w-4 h-4" />
          <span>
            {selectedFloat 
              ? `Export ${selectedFloat.id}` 
              : `Export Selected Data`}
          </span>
        </button>

        {/* Export Info */}
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex items-center space-x-1">
            <Settings className="w-3 h-3" />
            <span>Quality controlled data only</span>
          </div>
          <div>Format: {exportOptions.find(opt => opt.id === exportFormat)?.description}</div>
          {selectedFloat && (
            <div>Float: {selectedFloat.id}</div>
          )}
        </div>
      </div>
    </div>
  );
};