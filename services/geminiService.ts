import { GoogleGenAI } from "@google/genai";
import { TransformerData, TransformerStatus } from '../types';

export const analyzeDataWithGemini = async (data: TransformerData[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Filter only problematic items to save tokens and focus analysis
    const criticalItems = data.filter(d => d.status === TransformerStatus.CRITICAL);
    const warningItems = data.filter(d => d.status === TransformerStatus.WARNING);
    const unbalanceItems = data.filter(d => d.unbalancePercent > 50 && d.maxLoadPercent > 50);
    
    // Prepare a summary payload
    const payload = {
      summary: {
        totalTransformers: data.length,
        criticalCount: criticalItems.length,
        warningCount: warningItems.length,
        unbalanceCriticalCount: unbalanceItems.length,
      },
      criticalTransformers: criticalItems.slice(0, 15).map(t => ({
        id: t.id,
        load: `${t.maxLoadPercent}%`,
        voltageDrop: `${t.voltageDropPercent}%`,
        location: t.location
      })),
      unbalancedTransformers: unbalanceItems.slice(0, 10).map(t => ({
         id: t.id,
         load: `${t.maxLoadPercent}%`,
         unbalance: `${t.unbalancePercent}%`
      })),
      highLossTransformers: data.sort((a, b) => b.systemLoss - a.systemLoss).slice(0, 5).map(t => ({
        id: t.id,
        loss: t.systemLoss,
        location: t.location
      }))
    };

    const prompt = `
      คุณเป็นผู้เชี่ยวชาญด้านระบบไฟฟ้าของการไฟฟ้าส่วนภูมิภาค (PEA)
      กรุณาวิเคราะห์ข้อมูลสรุปของหม้อแปลงไฟฟ้าจากข้อมูล JSON ต่อไปนี้:
      
      ${JSON.stringify(payload)}
      
      คำแนะนำ:
      1. สรุปภาพรวมของโหลดในระบบ
      2. วิเคราะห์สาเหตุและแนวทางแก้ไขสำหรับหม้อแปลงสถานะ Critical (Load > 100%)
      3. วิเคราะห์หม้อแปลงที่มีปัญหา Unbalance สูง (>50%) และ Load เกิน 50% ให้แนะนำวิธีการปรับปรุง (Re-balancing) และผลกระทบหากไม่ดำเนินการแก้ไข
      4. ให้คำแนะนำเกี่ยวกับหม้อแปลงที่มีหน่วยสูญเสีย (Loss) สูง
      5. ตอบเป็นภาษาไทย ในรูปแบบ Markdown ที่อ่านง่าย แบ่งเป็นหัวข้อชัดเจน ใส่ Bullet point
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "ไม่สามารถสร้างคำแนะนำได้ในขณะนี้";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: ${(error as Error).message}`;
  }
};