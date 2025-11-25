import React, { useState, useMemo } from 'react';
import { TransformerData, TransformerStatus } from '../types';
import { AlertTriangle, AlertOctagon, CheckCircle, GitMerge } from 'lucide-react';

interface Props {
  data: TransformerData[];
}

const TransformerTable: React.FC<Props> = ({ data }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Basic Status Filter
      const matchesStatus = filter === 'ALL' || 
                            (filter === 'UNBALANCE' ? (item.unbalancePercent > 50 && item.maxLoadPercent > 50) : item.status === filter);
      
      const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [data, filter, searchTerm]);

  const getStatusBadge = (status: TransformerStatus) => {
    switch (status) {
      case TransformerStatus.CRITICAL:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertOctagon size={12}/> เร่งด่วน (>100%)</span>;
      case TransformerStatus.WARNING:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertTriangle size={12}/> เฝ้าระวัง (>80%)</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12}/> ปกติ</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-bold text-lg text-slate-800">รายการหม้อแปลง ({filteredData.length})</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="ค้นหา ID หรือ สถานที่..." 
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">ทั้งหมด</option>
            <option value={TransformerStatus.CRITICAL}>แก้ไขเร่งด่วน</option>
            <option value={TransformerStatus.WARNING}>เฝ้าระวัง Load</option>
            <option value="UNBALANCE">เฝ้าระวัง Unbalance</option>
            <option value={TransformerStatus.NORMAL}>ปกติ</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PEA ID / สถานที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ขนาด (kVA)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Load (PEAK) %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">% Unbalance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">แรงดันต่ำสุด (V)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">สถานะ Load</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{item.id}</div>
                    <div className="text-xs text-slate-500">{item.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{item.kva}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${item.maxLoadPercent > 100 ? 'text-red-600' : item.maxLoadPercent > 80 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {item.maxLoadPercent.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                     <span className={`inline-flex items-center gap-1 ${item.unbalancePercent > 50 && item.maxLoadPercent > 50 ? 'text-indigo-600 font-bold' : ''}`}>
                        {item.unbalancePercent.toFixed(1)}%
                        {item.unbalancePercent > 50 && item.maxLoadPercent > 50 && <GitMerge size={14} />}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {item.endVoltage} V <span className="text-xs text-slate-400">({item.voltageDropPercent}%)</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransformerTable;