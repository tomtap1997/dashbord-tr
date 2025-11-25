import React from 'react';
import { TransformerData, TransformerStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Zap, AlertTriangle, Activity, TrendingDown, GitMerge } from 'lucide-react';
import TransformerTable from './TransformerTable';
import AnalysisReport from './AnalysisReport';

interface Props {
  data: TransformerData[];
}

const COLORS = ['#0088FE', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<Props> = ({ data }) => {
  // Calculate Summaries
  const total = data.length;
  const critical = data.filter(d => d.status === TransformerStatus.CRITICAL).length;
  const warning = data.filter(d => d.status === TransformerStatus.WARNING).length;
  const normal = total - critical - warning;

  // Unbalance Condition: Unbalance > 50% AND Load > 50%
  const unbalanceIssues = data.filter(d => d.unbalancePercent > 50 && d.maxLoadPercent > 50).length;

  const totalLoss = data.reduce((acc, cur) => acc + cur.systemLoss, 0);

  // Data for Pie Chart
  const statusData = [
    { name: 'ปกติ', value: normal, color: '#22c55e' }, // Green-500
    { name: 'เฝ้าระวัง', value: warning, color: '#f59e0b' }, // Amber-500
    { name: 'เร่งด่วน', value: critical, color: '#ef4444' }, // Red-500
  ];

  // Data for Scatter Chart (Load vs Voltage Drop)
  const scatterData = data.map(d => ({
    x: d.maxLoadPercent,
    y: d.voltageDropPercent,
    z: d.kva, // Bubble size based on KVA
    name: d.id,
    status: d.status
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">หม้อแปลงทั้งหมด</p>
            <h3 className="text-2xl font-bold text-slate-800">{total}</h3>
          </div>
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            <Zap size={20} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-red-200 bg-red-50/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-red-600 mb-1 font-medium">แก้ไขเร่งด่วน (&gt;100%)</p>
            <h3 className="text-2xl font-bold text-red-700">{critical}</h3>
          </div>
          <div className="p-2 bg-red-100 rounded-full text-red-600">
            <Activity size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-amber-200 bg-amber-50/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 mb-1 font-medium">เฝ้าระวัง (&gt;80%)</p>
            <h3 className="text-2xl font-bold text-amber-700">{warning}</h3>
          </div>
          <div className="p-2 bg-amber-100 rounded-full text-amber-600">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Unbalance Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-200 bg-indigo-50/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-600 mb-1 font-medium">แก้ไข Unbalance</p>
            <p className="text-[10px] text-indigo-400 mb-0.5">(Unb &gt; 50% & Load &gt; 50%)</p>
            <h3 className="text-2xl font-bold text-indigo-700">{unbalanceIssues}</h3>
          </div>
          <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
            <GitMerge size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">หน่วยสูญเสียรวม (Unit)</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalLoss.toLocaleString()}</h3>
          </div>
          <div className="p-2 bg-purple-100 rounded-full text-purple-600">
            <TrendingDown size={20} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h4 className="text-lg font-bold text-slate-800 mb-4">สัดส่วนสถานะหม้อแปลง</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Load vs Voltage Drop Scatter */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h4 className="text-lg font-bold text-slate-800 mb-4">ความสัมพันธ์ Load (PEAK) กับ Voltage Drop</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="Load (PEAK)" unit="%" domain={[0, 'auto']} />
                <YAxis type="number" dataKey="y" name="V-Drop" unit="%" />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="kVA" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Transformer" data={scatterData} fill="#8884d8">
                    {scatterData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.x > 100 ? '#ef4444' : entry.x > 80 ? '#f59e0b' : '#22c55e'} />
                    ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <AnalysisReport data={data} />

      {/* Data Table */}
      <TransformerTable data={data} />
    </div>
  );
};

export default Dashboard;