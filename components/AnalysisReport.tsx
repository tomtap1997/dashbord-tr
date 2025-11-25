import React, { useState } from 'react';
import { TransformerData } from '../types';
import { analyzeDataWithGemini } from '../services/geminiService';
import { Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  data: TransformerData[];
}

const AnalysisReport: React.FC<Props> = ({ data }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeDataWithGemini(data);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="text-purple-600" /> AI Smart Analysis
        </h2>
        {!report && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            วิเคราะห์ข้อมูลด้วย AI
          </button>
        )}
      </div>

      {loading && (
        <div className="p-8 text-center text-slate-500 animate-pulse">
          กำลังประมวลผลข้อมูลและสร้างคำแนะนำทางวิศวกรรม...
        </div>
      )}

      {report && (
        <div className="prose prose-purple max-w-none bg-slate-50 p-6 rounded-lg border border-slate-100">
            <ReactMarkdown>{report}</ReactMarkdown>
            <div className="mt-4 flex justify-end">
                 <button
                    onClick={() => setReport(null)}
                    className="text-sm text-slate-500 hover:text-purple-600 underline"
                  >
                    ล้างผลการวิเคราะห์
                  </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisReport;