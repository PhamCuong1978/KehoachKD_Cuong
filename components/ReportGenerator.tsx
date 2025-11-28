
import React, { useState } from 'react';
import type { PlanItem } from '../types';
import { generateHtmlReport } from '../utils/reportGenerator';
import { DocumentDownloadIcon } from './icons/DocumentDownloadIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { getGeminiClient } from "../services/geminiService";
import { formatCurrency } from '../utils/formatters';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { SaveIcon } from './icons/SaveIcon';

interface ReportGeneratorProps {
  items: PlanItem[];
  exchangeRateImport: number;
  exchangeRateTax: number;
  onOpenAiAssistant: () => void;
  onSavePlan?: () => void; // New prop for saving
}

const calculateTotalsForAI = (items: PlanItem[]) => {
  return items.reduce(
    (acc, item) => {
      acc.totalRevenue += item.calculated.totalRevenue || 0;
      acc.grossProfit += item.calculated.grossProfit || 0;
      acc.profitBeforeTax += item.calculated.profitBeforeTax || 0;
      acc.netProfit += item.calculated.netProfit || 0;
      acc.totalSellingCost += item.calculated.totalSellingCost || 0;
      acc.totalGaCost += item.calculated.totalGaCost || 0;
      acc.totalCOGS += item.calculated.totalCOGS || 0;
      acc.totalFinancialCost += item.calculated.totalFinancialCost || 0;
      return acc;
    },
    {
      totalRevenue: 0,
      grossProfit: 0,
      profitBeforeTax: 0,
      netProfit: 0,
      totalSellingCost: 0,
      totalGaCost: 0,
      totalCOGS: 0,
      totalFinancialCost: 0,
    }
  );
};


export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ items, exchangeRateImport, exchangeRateTax, onOpenAiAssistant, onSavePlan }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  
  const generateReportBlob = (analysisHtml?: string): Blob | null => {
    if (items.length === 0) {
      if (!isGenerating) { // Avoid duplicate alerts
        alert("Vui lòng thêm ít nhất một sản phẩm vào kế hoạch để tạo báo cáo.");
      }
      return null;
    }
    const reportHtml = generateHtmlReport(items, exchangeRateImport, exchangeRateTax, analysisHtml);
    return new Blob([reportHtml], { type: 'text/html' });
  };

  const handlePreview = () => {
    const blob = generateReportBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // The URL is intentionally not revoked so the new tab can use it.
    }
  };
  
  const handleDownload = () => {
    if (items.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setShowProgress(true);
    setProgress(0);
    setStatusText('Đang chuẩn bị file...');

    setTimeout(() => {
        const blob = generateReportBlob();
        if (blob) {
            setProgress(100);
            setStatusText('Hoàn tất! Đang tải xuống...');
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'KeHoachKinhDoanh.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setTimeout(() => {
                setShowProgress(false);
                setIsGenerating(false);
            }, 2000);
        } else {
            setShowProgress(false);
            setIsGenerating(false);
        }
    }, 300);
  };

  const handleGenerateWithAI = async () => {
    if (items.length === 0) {
      alert("Vui lòng thêm ít nhất một sản phẩm vào kế hoạch để tạo phân tích.");
      return;
    }
    setIsGenerating(true);
    setShowProgress(true);
    setProgress(10);
    setStatusText('Bắt đầu quá trình...');

    try {
        // Filter items by type
        const importItems = items.filter(i => i.userInput.type !== 'domestic');
        const domesticItems = items.filter(i => i.userInput.type === 'domestic');

        // Calculate totals for each group
        const totals = calculateTotalsForAI(items);
        const importTotals = calculateTotalsForAI(importItems);
        const domesticTotals = calculateTotalsForAI(domesticItems);

        const netRevenue = totals.totalRevenue;
        
        // Helper to safe calc margins
        const calcMargin = (profit: number, revenue: number) => revenue > 0 ? (profit / revenue * 100).toFixed(2) : '0';

        setProgress(30);
        setStatusText('Đang chuẩn bị dữ liệu phân tách cho AI...');

        const prompt = `
          **Bối cảnh:**
          Đóng vai một chuyên gia phân tích tài chính cấp cao (CFO) với nhiều năm kinh nghiệm trong ngành thương mại thực phẩm đông lạnh.
          
          **Nhiệm vụ:**
          Phân tích sâu bản kế hoạch kinh doanh, đặc biệt tập trung vào việc **SO SÁNH HIỆU QUẢ** giữa mảng Kinh doanh Nhập khẩu và Kinh doanh Nội địa.

          **DỮ LIỆU TỔNG HỢP (TOÀN CÔNG TY):**
          - Doanh thu thuần: ${formatCurrency(netRevenue)} VND
          - Lợi nhuận gộp: ${formatCurrency(totals.grossProfit)} VND (Biên: ${calcMargin(totals.grossProfit, netRevenue)}%)
          - Lợi nhuận ròng: ${formatCurrency(totals.netProfit)} VND (Biên: ${calcMargin(totals.netProfit, netRevenue)}%)
          - Tổng chi phí hoạt động: ${formatCurrency(totals.totalSellingCost + totals.totalGaCost)} VND

          **DỮ LIỆU CHI TIẾT - MẢNG NHẬP KHẨU (${importItems.length} sản phẩm):**
          - Doanh thu: ${formatCurrency(importTotals.totalRevenue)} VND
          - Giá vốn hàng bán: ${formatCurrency(importTotals.totalCOGS)} VND
          - Lợi nhuận gộp: ${formatCurrency(importTotals.grossProfit)} VND
          - Tỷ suất LN Gộp: ${calcMargin(importTotals.grossProfit, importTotals.totalRevenue)}%
          - Lợi nhuận ròng: ${formatCurrency(importTotals.netProfit)} VND
          - Tỷ suất LN Ròng: ${calcMargin(importTotals.netProfit, importTotals.totalRevenue)}%

          **DỮ LIỆU CHI TIẾT - MẢNG NỘI ĐỊA (${domesticItems.length} sản phẩm):**
          - Doanh thu: ${formatCurrency(domesticTotals.totalRevenue)} VND
          - Giá vốn hàng bán: ${formatCurrency(domesticTotals.totalCOGS)} VND
          - Lợi nhuận gộp: ${formatCurrency(domesticTotals.grossProfit)} VND
          - Tỷ suất LN Gộp: ${calcMargin(domesticTotals.grossProfit, domesticTotals.totalRevenue)}%
          - Lợi nhuận ròng: ${formatCurrency(domesticTotals.netProfit)} VND
          - Tỷ suất LN Ròng: ${calcMargin(domesticTotals.netProfit, domesticTotals.totalRevenue)}%

          **YÊU CẦU CẤU TRÚC VÀ NỘI DUNG PHÂN TÍCH:**
          Trình bày bản phân tích dưới dạng HTML (không bao gồm thẻ body/head) với các mục sau:

          1.  **Tổng quan:** Tóm tắt nhanh quy mô kế hoạch và cơ cấu doanh thu (tỷ trọng giữa Nhập khẩu vs Nội địa).
          2.  **Phân tích So sánh (QUAN TRỌNG NHẤT):**
              - So sánh Biên lợi nhuận gộp và ròng giữa hai mảng. Mảng nào đang sinh lời tốt hơn trên mỗi đồng doanh thu?
              - So sánh cấu trúc chi phí. Mảng nhập khẩu thường chịu rủi ro tỷ giá và chi phí kho bãi cao, trong khi nội địa có thể biên mỏng hơn nhưng quay vòng nhanh. Hãy phân tích điều này dựa trên số liệu.
              - Đánh giá rủi ro: Nhập khẩu (Tỷ giá, vận chuyển quốc tế) vs Nội địa (Biến động giá thị trường, cạnh tranh).
          3.  **Đánh giá Điểm hòa vốn & An toàn tài chính:**
              - Ước tính điểm hòa vốn chung.
              - Nhận xét về khả năng chịu đựng rủi ro của doanh nghiệp với cấu trúc lợi nhuận hiện tại.
          4.  **Kiến nghị chiến lược:**
              - Dựa trên sự so sánh trên, doanh nghiệp nên tập trung nguồn lực vào đâu? Có nên mở rộng mảng nào hay tối ưu hóa chi phí mảng nào?
          5.  **Kết luận:** Đánh giá triển vọng chung của kế hoạch.

          **Lưu ý:**
          - Dùng thẻ \`<h3>\`, \`<strong>\`, \`<ul>\`, \`<li>\`, \`<table>\` để trình bày đẹp mắt.
          - Nếu một trong hai mảng không có sản phẩm (doanh thu = 0), hãy bỏ qua phần so sánh chi tiết và tập trung phân tích mảng còn lại, nhưng vẫn đưa ra lời khuyên về việc đa dạng hóa.
          - Giọng văn chuyên nghiệp, khách quan, sắc sảo.
        `;

        setProgress(50);
        setStatusText('Đang gửi yêu cầu phân tích chuyên sâu...');

        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const analysisHtml = response.text;

        setProgress(85);
        setStatusText('AI đã phân tích xong, đang tạo file báo cáo...');

        const blob = generateReportBlob(analysisHtml);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'KeHoachKinhDoanh_CoPhanTich.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        setProgress(100);
        setStatusText('Hoàn tất! Báo cáo đã được tải xuống.');
        setTimeout(() => {
          setShowProgress(false);
          setIsGenerating(false);
        }, 3000);

    } catch (error) {
        console.error("Error generating AI analysis:", error);
        setProgress(100);
        setStatusText('Đã có lỗi xảy ra! (Vui lòng kiểm tra API Key)');
        setTimeout(() => {
          setShowProgress(false);
          setIsGenerating(false);
        }, 4000);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-3 mb-4 flex items-center">
            <DocumentDownloadIcon className="h-5 w-5 mr-2 text-gray-500" />
            Báo cáo & Phân tích
        </h3>
        <div>
          <p className="text-sm text-gray-600 mb-2">
              Tạo báo cáo tổng hợp, chi tiết và phân tích kế hoạch kinh doanh bằng AI.
          </p>
          <p className="text-sm text-gray-600 mb-4">
              Chọn một trong các tùy chọn dưới đây để xem trước hoặc tải về.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
                onClick={handlePreview}
                disabled={items.length === 0 || isGenerating}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
                <EyeIcon className="h-5 w-5 mr-2" />
                Xem trước
            </button>
            {onSavePlan && (
              <button
                onClick={onSavePlan}
                disabled={items.length === 0 || isGenerating}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <SaveIcon className="h-5 w-5 mr-2" />
                Lưu Kế hoạch
              </button>
            )}
            <button
                onClick={handleDownload}
                disabled={items.length === 0 || isGenerating}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                <DocumentDownloadIcon className="h-5 w-5 mr-2" />
                Tải Về
            </button>
             <button
                onClick={onOpenAiAssistant}
                disabled={items.length === 0 || isGenerating}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                <ChatBubbleIcon className="h-5 w-5 mr-2" />
                AI của anh Cường
            </button>
             <button
                onClick={handleGenerateWithAI}
                disabled={items.length === 0 || isGenerating}
                className="w-full sm:col-span-2 lg:col-span-4 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed mt-2 sm:mt-0"
            >
                <SparklesIcon className="h-5 w-5 mr-2" />
                {isGenerating ? 'Đang xử lý...' : 'Tải về & Phân tích (AI)'}
            </button>
        </div>
        {showProgress && (
          <div className="mt-4">
            <p className="text-sm text-center text-gray-600 mb-2">{statusText}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
    </div>
  );
};
