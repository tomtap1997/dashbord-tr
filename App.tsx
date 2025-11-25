import React, { useState } from 'react';
import { parseExcelFile, generateMockData } from './utils/excelParser';
import { TransformerData } from './types';
import Dashboard from './components/Dashboard';
import { UploadCloud, FileSpreadsheet, PlayCircle, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<TransformerData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
        // Dynamic import for xlsx to avoid huge bundle if not used
        await import('xlsx'); 
        const parsedData = await parseExcelFile(file);
        setData(parsedData);
    } catch (err) {
        console.error(err);
        setError("ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าไฟล์ถูกต้อง (Excel/CSV)");
    } finally {
        setLoading(false);
    }
  };

  const loadDemoData = () => {
    setLoading(true);
    setTimeout(() => {
        setData(generateMockData());
        setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header - PEA Brand Colors */}
      <header className="bg-[#7434DB] text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#7434DB] font-bold shadow-inner">
                    PEA
                </div>
                <div>
                    <h1 className="text-xl font-bold leading-tight">ระบบวิเคราะห์หม้อแปลงไฟฟ้า</h1>
                    <p className="text-xs text-purple-200 font-light">Transformer Load & Voltage Analyzer</p>
                </div>
            </div>
            {data && (
                <button 
                    onClick={() => setData(null)} 
                    className="text-sm bg-purple-800 hover:bg-purple-900 px-3 py-1 rounded transition"
                >
                    วิเคราะห์ไฟล์ใหม่
                </button>
            )}
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {!data ? (
          <div className="max-w-xl mx-auto mt-10">
             <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                <div className="w-20 h-20 bg-purple-100 text-[#7434DB] rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">เริ่มต้นการวิเคราะห์</h2>
                <p className="text-slate-500 mb-8">
                    อัปโหลดไฟล์ Excel ที่ได้จากโปรแกรม OPSAonGIS <br/>เพื่อตรวจสอบ Load, แรงดันตก และ Unit Loss
                </p>

                <div className="space-y-4">
                    {/* Upload Button */}
                    <div className="relative group">
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-purple-300 group-hover:border-[#7434DB] bg-purple-50 group-hover:bg-purple-100 rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center">
                            {loading ? (
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7434DB]"></div>
                            ) : (
                                <>
                                    <UploadCloud size={48} className="text-[#7434DB] mb-3" />
                                    <span className="font-semibold text-[#7434DB]">คลิกเพื่อเลือกไฟล์ Excel</span>
                                    <span className="text-xs text-slate-400 mt-1">รองรับ .xlsx, .xls</span>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">หรือทดลองใช้งาน</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* Demo Button */}
                    <button 
                        onClick={loadDemoData}
                        className="w-full bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-[#7434DB] hover:border-[#7434DB] py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-sm"
                    >
                        <PlayCircle size={20} />
                        ใช้ข้อมูลตัวอย่าง (Demo Data)
                    </button>
                </div>
                
                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-center justify-center gap-2">
                        <FileSpreadsheet size={16} /> {error}
                    </div>
                )}
             </div>
          </div>
        ) : (
          <Dashboard data={data} />
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <p>© 2024 Provincial Electricity Authority (PEA). Data Analysis Assistant.</p>
        <p className="text-xs mt-1 text-slate-600">Powered by React, Tailwind & Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;