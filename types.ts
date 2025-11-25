export enum TransformerStatus {
  NORMAL = 'Normal',
  WARNING = 'Warning',
  CRITICAL = 'Critical'
}

export interface TransformerData {
  id: string; // PEA ID หรือ รหัสอุปกรณ์
  location: string; // สถานที่ตั้ง
  kva: number; // ขนาดหม้อแปลง (kVA)
  maxLoadPercent: number; // % Load สูงสุด
  endVoltage: number; // แรงดันปลายสาย (V)
  voltageDropPercent: number; // % แรงดันตก
  systemLoss: number; // หน่วยสูญเสีย (Unit)
  phase: number; // 1 หรือ 3 เฟส
  unbalancePercent: number; // % Unbalance
  status: TransformerStatus;
}

export interface AnalysisSummary {
  total: number;
  critical: number;
  warning: number;
  normal: number;
  avgLoad: number;
  totalLoss: number;
}