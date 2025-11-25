import * as XLSX from 'xlsx';
import { TransformerData, TransformerStatus } from '../types';

// ฟังก์ชันคำนวณสถานะ
const calculateStatus = (load: number): TransformerStatus => {
  if (load > 100) return TransformerStatus.CRITICAL;
  if (load > 80) return TransformerStatus.WARNING;
  return TransformerStatus.NORMAL;
};

// ฟังก์ชันจัดรูปแบบ PEA ID (xx-xxxxxx)
const formatPEAId = (val: any): string => {
  if (val === undefined || val === null) {
    return `TR-${Math.floor(Math.random() * 100000)}`;
  }

  let str = String(val).trim();

  // กรณีที่มีรูปแบบถูกต้องอยู่แล้ว (เช่น 52-123456)
  if (/^\d{2}-\d{6}$/.test(str)) {
    return str;
  }

  // ดึงเฉพาะตัวเลข
  const digits = str.replace(/[^0-9]/g, '');

  // กรณีเป็นตัวเลข 8 หลัก (เช่น 52123456 -> 52-123456)
  if (digits.length === 8) {
    return `${digits.substring(0, 2)}-${digits.substring(2)}`;
  }

  // กรณีอื่นๆ คืนค่าเดิม หรือจัดรูปแบบเท่าที่ทำได้
  return str;
};

export const parseExcelFile = async (file: File): Promise<TransformerData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // แปลงเป็น Array of Arrays เพื่อเข้าถึงตาม Index คอลัมน์ได้แม่นยำกว่า
        // A=0, B=1, ..., N=13, S=18, T=19
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // หาบรรทัดที่เป็น Header หรือบรรทัดข้อมูลจริง (ข้ามบรรทัดแรกๆ ที่อาจเป็น Title)
        // เราจะเริ่มเก็บข้อมูลเมื่อเจอแถวที่มีข้อมูลใน Column A เป็นรูปแบบคล้าย ID
        const mappedData: TransformerData[] = [];

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            // ตรวจสอบ Column A (Index 0) - PEA ID
            const colA = row[0];
            
            // กรองข้อมูล: ต้องมีค่า, เป็น String หรือ Number, และต้องแปลงเป็น xx-xxxxxx ได้
            // หรือถ้าเป็นตัวเลขล้วนต้องมีความยาว 8 หลัก
            const strA = String(colA || '').trim();
            
            // ข้าม Header หรือแถวที่ไม่ใช่ข้อมูลหม้อแปลง
            // เงื่อนไข: ต้องมีตัวเลขอย่างน้อย 6 ตัว และไม่ใช่คำว่า "ลำดับ" หรือ "PEA"
            if (strA.length < 6 || /ลำดับ|PEA|รหัส|Transformer/i.test(strA)) {
                continue;
            }

            const id = formatPEAId(colA);
            
            // ถ้า format ออกมาแล้วยังดูไม่เหมือน ID (เช่นสั้นไป) ก็ข้าม
            if (id.length < 8) continue;

            // ดึงข้อมูลตามตำแหน่งคอลัมน์ที่ระบุ
            // Col D (Index 3): ขนาด (kVA)
            const kva = parseFloat(String(row[3] || '0').replace(/[^0-9.]/g, '')) || 0;

            // Col N (Index 13): % Load (PEAK)
            const maxLoadPercent = parseFloat(String(row[13] || '0').replace(/[^0-9.]/g, '')) || 0;

            // Col S (Index 18): % Unbalance
            const unbalancePercent = parseFloat(String(row[18] || '0').replace(/[^0-9.]/g, '')) || 0;

            // Col T (Index 19): แรงดันต่ำสุด (V)
            const endVoltage = parseFloat(String(row[19] || '230').replace(/[^0-9.]/g, '')) || 230;

            // คำนวณ % แรงดันตก (Voltage Drop) โดยประมาณจากแรงดัน 230V ถ้าไม่มีคอลัมน์เฉพาะ
            // หรือถ้ามีคอลัมน์อื่นให้ใส่ตรงนี้ (สมมติว่าใช้สูตรคำนวณจาก 230V)
            // Voltage Drop % = ((230 - V_end) / 230) * 100
            let voltageDropPercent = 0;
            if (endVoltage > 0) {
                voltageDropPercent = parseFloat((((230 - endVoltage) / 230) * 100).toFixed(2));
            }

            // สถานที่: ลองหาจาก Col B หรือ C (Index 1, 2)
            const location = row[1] ? String(row[1]) : (row[2] ? String(row[2]) : 'ไม่ระบุสถานที่');

            // หน่วยสูญเสีย: ลองหาจาก Header หรือถ้ามีตำแหน่งตายตัว
            // สมมติว่าอยู่ใน Col U (Index 20) หรือต้องหาจากชื่อ
            // ในที่นี้จะลองหาจากค่าที่ดูเหมือน Loss ในคอลัมน์ถัดๆ ไป หรือใช้ 0 ถ้าหาไม่เจอ
            let systemLoss = 0;
            // ลองหาคอลัมน์ที่มีคำว่า Loss ในบรรทัด Header (ต้องหา Header ก่อนหน้า)
            // แต่เพื่อความง่ายตามโจทย์ ให้ลองดู Index 20 หรือ 21
            if (row[20] && typeof row[20] === 'number') systemLoss = row[20];

            mappedData.push({
                id,
                location,
                kva,
                maxLoadPercent,
                endVoltage,
                voltageDropPercent,
                systemLoss,
                phase: 3, // Default 3 phase
                unbalancePercent,
                status: calculateStatus(maxLoadPercent)
            });
        }

        resolve(mappedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const generateMockData = (): TransformerData[] => {
  const data: TransformerData[] = [];
  for (let i = 1; i <= 50; i++) {
    const load = Math.floor(Math.random() * 120); // Random 0-120%
    
    // Generate PEA ID format xx-xxxxxx
    const regionPrefix = Math.random() > 0.5 ? '52' : '53';
    const runningNum = String(i).padStart(6, '0');
    const peaId = `${regionPrefix}-${runningNum}`;
    
    // Generate Unbalance
    // Chance for high unbalance if load is moderate to high
    const unbalance = Math.random() > 0.8 ? Math.floor(Math.random() * 60) + 20 : Math.floor(Math.random() * 15);

    data.push({
      id: peaId,
      location: `ซอยเทศบาล ${i % 10 + 1} ต.ในเมือง`,
      kva: Math.random() > 0.5 ? 50 : 160,
      maxLoadPercent: load,
      endVoltage: load > 100 ? 210 : 225,
      voltageDropPercent: load > 100 ? 8.5 : 2.0,
      systemLoss: Math.floor(Math.random() * 500),
      phase: 3,
      unbalancePercent: unbalance,
      status: calculateStatus(load)
    });
  }
  return data;
};