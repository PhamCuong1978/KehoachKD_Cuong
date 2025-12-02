
import type { PlanItem } from '../types';
import { formatCurrency } from './formatters';

const calculateTotals = (items: PlanItem[]) => {
  return items.reduce(
    (acc, item) => {
      acc.importValueVND += item.calculated.importValueVND || 0;
      acc.totalClearanceAndLogisticsCost += item.calculated.totalClearanceAndLogisticsCost || 0;
      acc.totalSellingCost += item.calculated.totalSellingCost || 0;
      acc.totalGaCost += item.calculated.totalGaCost || 0;
      acc.totalFinancialCost += item.calculated.totalFinancialCost || 0;
      acc.totalRevenue += item.calculated.totalRevenue || 0;
      acc.grossProfit += item.calculated.grossProfit || 0;
      acc.profitBeforeTax += item.calculated.profitBeforeTax || 0;
      acc.corporateIncomeTax += item.calculated.corporateIncomeTax || 0;
      acc.importVAT += item.calculated.importVAT || 0;
      acc.outputVAT += item.calculated.outputVAT || 0;
      acc.vatPayable += item.calculated.vatPayable || 0;
      acc.netProfit += item.calculated.netProfit || 0;
      acc.importInterestCost += item.calculated.importInterestCost || 0;
      acc.totalCOGS += item.calculated.totalCOGS || 0;
      acc.totalTaxPayable += item.calculated.totalTaxPayable || 0;
      // Updated to use calculated values (allocated) instead of userInput
      acc.totalOtherExpenses += item.calculated.otherExpenses || 0;
      acc.totalOtherIncome += item.calculated.otherIncome || 0; 
      return acc;
    },
    {
      importValueVND: 0,
      totalClearanceAndLogisticsCost: 0,
      totalSellingCost: 0,
      totalGaCost: 0,
      totalFinancialCost: 0,
      totalRevenue: 0,
      grossProfit: 0,
      profitBeforeTax: 0,
      corporateIncomeTax: 0,
      importVAT: 0,
      outputVAT: 0,
      vatPayable: 0,
      netProfit: 0,
      importInterestCost: 0,
      totalCOGS: 0,
      totalTaxPayable: 0,
      totalOtherExpenses: 0,
      totalOtherIncome: 0,
    }
  );
};

// Helper to calculate detailed costs for the new Cost Summary Table
const calculateDetailedCosts = (items: PlanItem[]) => {
    const costs = items.reduce((acc, item) => {
        // 1. Logistics & Clearance (Included in COGS)
        acc.customsFee += item.userInput.costs.customsFee || 0;
        acc.quarantineFee += item.userInput.costs.quarantineFee || 0;
        acc.containerRentalFee += item.userInput.costs.containerRentalFee || 0;
        acc.portStorageFee += item.userInput.costs.portStorageFee || 0;
        acc.generalWarehouseCost += item.calculated.generalWarehouseCost || 0;
        acc.importInterestCost += item.calculated.importInterestCost || 0;
        acc.postClearanceStorageCost += item.calculated.postClearanceStorageCost || 0;
        acc.purchasingServiceFee += item.calculated.purchasingServiceFee || 0;
        acc.buyerDeliveryFee += item.userInput.costs.buyerDeliveryFee || 0;
        acc.otherInternationalPurchaseCost += item.calculated.otherInternationalPurchaseCost || 0;

        // 2. Selling
        acc.salesStaffSalary += item.calculated.salesStaffSalary || 0;
        acc.otherSellingCosts += item.userInput.costs.otherSellingCosts || 0;

        // 3. G&A
        acc.indirectStaffSalary += item.calculated.indirectStaffSalary || 0;
        acc.rent += item.calculated.rent || 0;
        acc.electricity += item.calculated.electricity || 0;
        acc.water += item.calculated.water || 0;
        acc.stationery += item.calculated.stationery || 0;
        acc.depreciation += item.calculated.depreciation || 0;
        acc.externalServices += item.calculated.externalServices || 0;
        acc.otherCashExpenses += item.calculated.otherCashExpenses || 0;

        // 4. Financial
        acc.financialValuationCost += item.calculated.financialValuationCost || 0; 
        
        // 6. Other Expenses (Updated to use calculated/allocated value)
        acc.otherExpenses += item.calculated.otherExpenses || 0;

        return acc;
    }, {
        // 1
        customsFee: 0, quarantineFee: 0, containerRentalFee: 0, portStorageFee: 0,
        generalWarehouseCost: 0, importInterestCost: 0, postClearanceStorageCost: 0,
        purchasingServiceFee: 0, buyerDeliveryFee: 0, otherInternationalPurchaseCost: 0,
        // 2
        salesStaffSalary: 0, otherSellingCosts: 0,
        // 3
        indirectStaffSalary: 0, rent: 0, electricity: 0, water: 0, stationery: 0,
        depreciation: 0, externalServices: 0, otherCashExpenses: 0,
        // 4
        financialValuationCost: 0,
        // 6
        otherExpenses: 0
    });

    // Calculate weighted average storage days
    let totalWeight = 0;
    let totalWeightedDays = 0;
    
    items.forEach(item => {
        const qty = item.userInput.quantityInKg || 0;
        const days = item.userInput.costs.postClearanceStorageDays || 0;
        totalWeight += qty;
        totalWeightedDays += (qty * days);
    });
    
    const avgStorageDays = totalWeight > 0 ? Math.round(totalWeightedDays / totalWeight) : 0;

    return { ...costs, avgStorageDays };
};

const createDetailRow = (label: string, value: string, isSubtle = false) => `
  <div class="flex justify-between py-2 border-b border-gray-200">
    <span class="text-sm ${isSubtle ? 'text-gray-500' : 'text-gray-600'}">${label}</span>
    <span class="text-sm font-semibold text-gray-800 text-right">${value}</span>
  </div>
`;

const createBoldDetailRow = (label: string, value: string) => `
  <div class="flex justify-between py-2 border-b-2 border-gray-400">
    <span class="text-sm font-bold text-gray-800">${label}</span>
    <span class="text-sm font-bold text-gray-900 text-right">${value}</span>
  </div>
`;

const createSummaryTableRow = (
  label: string, 
  code: string,
  formula: string,
  amount: number | null, 
  baseAmount: number, 
  isBold = false, 
  isSubItem = false
) => {
  const amountStr = amount !== null ? formatCurrency(amount) : '';
  const percentageStr = baseAmount !== 0 && amount !== null ? `${(amount / baseAmount * 100).toFixed(2)}%` : '';
  const paddingClass = isSubItem ? 'pl-8' : 'pl-4';
  const fontWeightClass = isBold ? 'font-bold' : '';
  const textClass = isSubItem ? 'text-gray-500 italic' : 'text-gray-800';

  return `
    <tr class="border-b">
      <td class="py-3 ${paddingClass} pr-2 text-sm ${textClass} ${fontWeightClass}">${label}</td>
      <td class="py-3 px-2 text-center text-sm text-gray-600">${code}</td>
      <td class="py-3 px-2 text-center text-sm text-gray-600 hidden-mobile">${formula}</td>
      <td class="py-3 px-4 text-right text-sm text-gray-900 ${fontWeightClass}">${amountStr}</td>
      <td class="py-3 pl-2 pr-4 text-right text-sm text-gray-500">${percentageStr}</td>
    </tr>
  `;
};

const createCostTableRow = (
    stt: string,
    label: string,
    amount: number,
    netRevenue: number,
    note: string = '',
    isGroup: boolean = false
) => {
    const amountStr = formatCurrency(amount);
    const percentageStr = netRevenue !== 0 ? `${(amount / netRevenue * 100).toFixed(2)}%` : '0.00%';
    const bgClass = isGroup ? 'bg-gray-50 font-bold' : 'bg-white';
    const textClass = isGroup ? 'text-gray-900' : 'text-gray-700';

    return `
        <tr class="${bgClass} border-b border-gray-200">
            <td class="py-2 px-3 text-center text-sm ${textClass}">${stt}</td>
            <td class="py-2 px-3 text-left text-sm ${textClass}">${label}</td>
            <td class="py-2 px-3 text-right text-sm ${textClass}">${amountStr}</td>
            <td class="py-2 px-3 text-center text-sm ${textClass}">${percentageStr}</td>
            <td class="py-2 px-3 text-left text-sm text-gray-500 italic hidden-mobile">${note}</td>
        </tr>
    `;
};


export const generateHtmlReport = (items: PlanItem[], importRate: number, taxRate: number, analysisHtml?: string): string => {
  const totals = calculateTotals(items);
  
  // Calculate specific group totals for comparison
  const importItems = items.filter(i => i.userInput.type !== 'domestic' && i.userInput.type !== 'manufacturing');
  const domesticItems = items.filter(i => i.userInput.type === 'domestic');
  const manufacturingItems = items.filter(i => i.userInput.type === 'manufacturing');
  
  const importTotals = calculateTotals(importItems);
  const domesticTotals = calculateTotals(domesticItems);
  const manufacturingTotals = calculateTotals(manufacturingItems);

  const details = calculateDetailedCosts(items);
  const generationDate = new Date().toLocaleString('vi-VN');

  // Calculate metrics based on the new summary report format
  const grossRevenue = totals.totalRevenue; // Row 01
  const revenueDeductions = 0; // Row 02 (New item)
  const vatPayable = totals.vatPayable; // For new row 17

  const netRevenue = grossRevenue - revenueDeductions; // Row 10 = 01 - 02
  const cogs = totals.totalCOGS; // Row 11
  
  // Breakdown of COGS
  const importCost = totals.importValueVND;
  const logisticsCost = totals.totalClearanceAndLogisticsCost;

  const grossProfit = netRevenue - cogs; // Row 20 = 10 - 11

  const financialIncome = 0; // Row 21
  const financialCost = totals.totalFinancialCost; // Row 22
  // Removed explicit "Interest in COGS" row from display as requested
  const sellingCost = totals.totalSellingCost; // Row 25
  const gaCost = totals.totalGaCost; // Row 26
  
  // Per formula in image: 30 = 20 + (21-22) – 25 – 26
  const netOperatingProfit = grossProfit + (financialIncome - financialCost) - sellingCost - gaCost; // Row 30

  const otherIncome = totals.totalOtherIncome; // Row 31
  const otherCost = details.otherExpenses; // Row 32 (Updated from 0)
  const otherProfit = otherIncome - otherCost; // Row 40

  // Per formula in image: 50 = 30 + 40
  const pbt = netOperatingProfit + otherProfit; // Row 50
  
  // Per formula in image: 20% of 50
  const cit = totals.corporateIncomeTax; // Row 51
  
  const deferredCit = 0; // Row 52
  
  // Per formula in image: 60 = 50 - 51 - 52
  const summaryNetProfit = pbt - cit - deferredCit; // Row 60
  const totalTaxToPay = cit + vatPayable;
  const totalNetProfitMargin = totals.totalRevenue ? (totals.netProfit / totals.totalRevenue) * 100 : 0;


  const summarySection = `
    <div class="mb-12 break-after-page">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">PHƯƠNG ÁN KINH DOANH</h1>
        <p class="text-gray-600">Đơn vị tính: VND</p>
      </div>
      
      <div class="overflow-x-auto border rounded-lg">
        <table class="min-w-full">
          <thead class="bg-gray-100">
            <tr class="border-b">
              <th class="py-3 pl-4 pr-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-1/2">Chỉ tiêu</th>
              <th class="py-3 px-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Mã số</th>
              <th class="py-3 px-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider hidden-mobile">Chi tiết lấy dữ liệu</th>
              <th class="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Số tiền</th>
              <th class="py-3 pl-2 pr-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody class="bg-white">
            ${createSummaryTableRow('1. Doanh thu bán hàng và cung cấp dịch vụ', '01', 'Tổng hợp', grossRevenue, netRevenue, false)}
            ${createSummaryTableRow('2. Các khoản giảm trừ doanh thu', '02', '', revenueDeductions, netRevenue, false)}
            ${createSummaryTableRow('3. Doanh thu thuần về bán hàng và cung cấp dịch vụ (10 = 01 - 02)', '10', '[01] - [02]', netRevenue, netRevenue, false)}
            
            ${createSummaryTableRow('4. Giá vốn hàng bán', '11', 'Tổng hợp', cogs, netRevenue, false)}
            ${createSummaryTableRow('- Giá mua hàng NCC (Nguyên liệu)', '11a', 'Tổng hợp', importCost, netRevenue, false, true)}
            ${createSummaryTableRow('- Chi phí thông quan, Sản xuất, lãi vay, lưu kho, vận hành', '11b', 'Tổng hợp', logisticsCost, netRevenue, false, true)}

            ${createSummaryTableRow('5. Lợi nhuận gộp về bán hàng và cung cấp dịch vụ (20 = 10 - 11)', '20', '[10] - [11]', grossProfit, netRevenue, true)}
            ${createSummaryTableRow('6. Doanh thu hoạt động tài chính', '21', '', financialIncome, netRevenue, false)}
            ${createSummaryTableRow('7. Chi phí tài chính', '22', 'Tổng hợp', financialCost, netRevenue, false)}
            
            ${createSummaryTableRow('8. Chi phí bán hàng', '25', 'Tổng hợp', sellingCost, netRevenue, false)}
            ${createSummaryTableRow('9. Chi phí quản lý doanh nghiệp', '26', 'Tổng hợp', gaCost, netRevenue, false)}
            ${createSummaryTableRow('10. Lợi nhuận thuần từ hoạt động kinh doanh (30 = 20 + (21 - 22) – 25 – 26)', '30', '[20] + ([21]-[22]) - [25] - [26]', netOperatingProfit, netRevenue, true)}
            ${createSummaryTableRow('11. Thu nhập khác', '31', 'Tổng hợp', otherIncome, netRevenue, false)}
            ${createSummaryTableRow('12. Chi phí khác', '32', 'Tổng hợp', otherCost, netRevenue, false)}
            ${createSummaryTableRow('13. Lợi nhuận khác (40 = 31 - 32)', '40', '[31] - [32]', otherProfit, netRevenue, false)}
            ${createSummaryTableRow('14. Tổng lợi nhuận kế toán trước thuế (50 = 30 + 40)', '50', '[30] + [40]', pbt, netRevenue, true)}
            ${createSummaryTableRow('15. Chi phí thuế TNDN hiện hành (20% x 50)', '51', '[50] x 20%', cit, netRevenue, false)}
            ${createSummaryTableRow('16. Chi phí thuế TNDN hoãn lại', '52', '', deferredCit, netRevenue, false)}
            ${createSummaryTableRow('17. Lợi nhuận sau thuế thu nhập doanh nghiệp (60 = 50 - 51 - 52)', '60', '[50] - [51] - [52]', summaryNetProfit, netRevenue, true)}
            ${createSummaryTableRow('18. Thuế GTGT phải nộp nhà nước', '70', 'Tổng hợp', vatPayable, netRevenue, false)}
            ${createSummaryTableRow('19. Tổng thuế phải nộp cho nhà nước', '80', '[51] + [70]', totalTaxToPay, netRevenue, true)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Comparison Section Construction
  const createComparisonRow = (label: string, total: number, imp: number, dom: number, mfg: number, isHeader = false, isPercent = false) => {
      const format = (val: number) => isPercent ? `${val.toFixed(2)}%` : formatCurrency(val);
      const cellClass = isHeader ? "font-bold text-gray-800" : "text-gray-700";
      const bgClass = isHeader ? "bg-gray-100" : "bg-white";
      
      return `
        <tr class="${bgClass} border-b border-gray-200 hover:bg-gray-50">
            <td class="py-3 px-4 text-left text-sm ${cellClass}">${label}</td>
            <td class="py-3 px-4 text-right text-sm font-semibold text-indigo-700">${format(total)}</td>
            <td class="py-3 px-4 text-right text-sm text-gray-800">${format(imp)}</td>
            <td class="py-3 px-4 text-right text-sm text-gray-800">${format(dom)}</td>
            <td class="py-3 px-4 text-right text-sm text-gray-800">${format(mfg)}</td>
        </tr>
      `;
  };
  
  const calcMargin = (profit: number, revenue: number) => revenue ? (profit/revenue * 100) : 0;

  const comparisonSection = `
    <div class="mb-12 break-after-page">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">SO SÁNH HIỆU QUẢ KINH DOANH</h1>
            <p class="text-gray-600">Phân tách: Nhập khẩu, Nội địa & Sản xuất</p>
        </div>
        <div class="overflow-x-auto border rounded-lg shadow-sm">
            <table class="min-w-full">
                <thead class="bg-gray-700 text-white">
                    <tr>
                        <th class="py-3 px-4 text-left text-sm font-bold uppercase tracking-wider w-1/4">Chỉ tiêu tài chính</th>
                        <th class="py-3 px-4 text-right text-sm font-bold uppercase tracking-wider">Toàn công ty</th>
                        <th class="py-3 px-4 text-right text-sm font-bold uppercase tracking-wider">Mảng Nhập khẩu (${importItems.length} SP)</th>
                        <th class="py-3 px-4 text-right text-sm font-bold uppercase tracking-wider">Mảng Nội địa (${domesticItems.length} SP)</th>
                        <th class="py-3 px-4 text-right text-sm font-bold uppercase tracking-wider">Mảng Sản xuất (${manufacturingItems.length} SP)</th>
                    </tr>
                </thead>
                <tbody>
                    ${createComparisonRow('1. Doanh thu thuần', totals.totalRevenue, importTotals.totalRevenue, domesticTotals.totalRevenue, manufacturingTotals.totalRevenue, true)}
                    ${createComparisonRow('2. Giá vốn hàng bán', totals.totalCOGS, importTotals.totalCOGS, domesticTotals.totalCOGS, manufacturingTotals.totalCOGS)}
                    ${createComparisonRow('3. Lợi nhuận gộp', totals.grossProfit, importTotals.grossProfit, domesticTotals.grossProfit, manufacturingTotals.grossProfit, true)}
                    ${createComparisonRow('% Tỷ suất LN Gộp', calcMargin(totals.grossProfit, totals.totalRevenue), calcMargin(importTotals.grossProfit, importTotals.totalRevenue), calcMargin(domesticTotals.grossProfit, domesticTotals.totalRevenue), calcMargin(manufacturingTotals.grossProfit, manufacturingTotals.totalRevenue), false, true)}
                    
                    ${createComparisonRow('4. Chi phí Bán hàng', totals.totalSellingCost, importTotals.totalSellingCost, domesticTotals.totalSellingCost, manufacturingTotals.totalSellingCost)}
                    ${createComparisonRow('5. Chi phí Quản lý', totals.totalGaCost, importTotals.totalGaCost, domesticTotals.totalGaCost, manufacturingTotals.totalGaCost)}
                    ${createComparisonRow('6. Chi phí Tài chính', totals.totalFinancialCost, importTotals.totalFinancialCost, domesticTotals.totalFinancialCost, manufacturingTotals.totalFinancialCost)}
                    
                    ${createComparisonRow('7. Lợi nhuận ròng', totals.netProfit, importTotals.netProfit, domesticTotals.netProfit, manufacturingTotals.netProfit, true)}
                    ${createComparisonRow('% Tỷ suất LN Ròng', calcMargin(totals.netProfit, totals.totalRevenue), calcMargin(importTotals.netProfit, importTotals.totalRevenue), calcMargin(domesticTotals.netProfit, domesticTotals.totalRevenue), calcMargin(manufacturingTotals.netProfit, manufacturingTotals.totalRevenue), false, true)}
                </tbody>
            </table>
        </div>
        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div class="p-4 bg-blue-50 rounded border border-blue-100">
                <h4 class="font-bold text-blue-800 mb-2">Mảng Nhập khẩu</h4>
                <p class="text-sm text-gray-700">Đóng góp <strong>${totals.totalRevenue ? (importTotals.totalRevenue / totals.totalRevenue * 100).toFixed(1) : 0}%</strong> doanh thu và <strong>${totals.netProfit ? (importTotals.netProfit / totals.netProfit * 100).toFixed(1) : 0}%</strong> lợi nhuận ròng.</p>
             </div>
             <div class="p-4 bg-green-50 rounded border border-green-100">
                <h4 class="font-bold text-green-800 mb-2">Mảng Nội địa</h4>
                 <p class="text-sm text-gray-700">Đóng góp <strong>${totals.totalRevenue ? (domesticTotals.totalRevenue / totals.totalRevenue * 100).toFixed(1) : 0}%</strong> doanh thu và <strong>${totals.netProfit ? (domesticTotals.netProfit / totals.netProfit * 100).toFixed(1) : 0}%</strong> lợi nhuận ròng.</p>
             </div>
             <div class="p-4 bg-amber-50 rounded border border-amber-100">
                <h4 class="font-bold text-amber-800 mb-2">Mảng Sản xuất</h4>
                 <p class="text-sm text-gray-700">Đóng góp <strong>${totals.totalRevenue ? (manufacturingTotals.totalRevenue / totals.totalRevenue * 100).toFixed(1) : 0}%</strong> doanh thu và <strong>${totals.netProfit ? (manufacturingTotals.netProfit / totals.netProfit * 100).toFixed(1) : 0}%</strong> lợi nhuận ròng.</p>
             </div>
        </div>
    </div>
  `;

  const costSummarySection = `
    <div class="mb-12 break-after-page">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">BẢNG TỔNG HỢP CHI PHÍ</h1>
            <p class="text-gray-600">Đơn vị tính: VND</p>
        </div>
        <div class="overflow-x-auto border rounded-lg">
            <table class="min-w-full">
                <thead class="bg-gray-100 border-b border-gray-200">
                    <tr>
                        <th class="py-3 px-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-12">STT</th>
                        <th class="py-3 px-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">CÁC LOẠI CHI PHÍ</th>
                        <th class="py-3 px-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-32">SỐ TIỀN</th>
                        <th class="py-3 px-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-32">TỶ LỆ %</th>
                        <th class="py-3 px-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-48 hidden-mobile">GHI CHÚ</th>
                    </tr>
                </thead>
                <tbody class="bg-white">
                    <!-- 1. Chi phí Thông quan & Vận hành -->
                    ${createCostTableRow('1', 'Chi phí Thông quan, Sản xuất & Vận hành (Được tính vào giá vốn)', totals.totalClearanceAndLogisticsCost, netRevenue, '', true)}
                    ${createCostTableRow('1.1', 'Phí Hải quan', details.customsFee, netRevenue)}
                    ${createCostTableRow('1.2', 'Phí kiểm dịch', details.quarantineFee, netRevenue)}
                    ${createCostTableRow('1.3', 'Phí thuê Cont', details.containerRentalFee, netRevenue)}
                    ${createCostTableRow('1.4', 'Phí lưu kho bãi cảng', details.portStorageFee, netRevenue)}
                    ${createCostTableRow('1.5', 'Chi phí chung nhập kho', details.generalWarehouseCost, netRevenue)}
                    ${createCostTableRow('1.6', 'Lãi vay nhập hàng & SX', details.importInterestCost, netRevenue)}
                    ${createCostTableRow('1.7', 'Phí lưu kho sau TQ', details.postClearanceStorageCost, netRevenue, `(Lưu kho ~${details.avgStorageDays} ngày)`)}
                    ${createCostTableRow('1.8', 'DV mua hàng', details.purchasingServiceFee, netRevenue)}
                    ${createCostTableRow('1.9', 'Phí VC đến bên mua', details.buyerDeliveryFee, netRevenue)}
                    ${createCostTableRow('1.10', 'Chi phí khác (bao gồm cả CP Sản xuất)', details.otherInternationalPurchaseCost, netRevenue, 'Bao gồm CP SX trực tiếp nếu là sản xuất')}

                    <!-- 2. Chi phí Bán hàng -->
                    ${createCostTableRow('2', 'Chi phí Bán hàng', totals.totalSellingCost, netRevenue, '', true)}
                    ${createCostTableRow('2.1', 'Lương nhân viên bán hàng', details.salesStaffSalary, netRevenue)}
                    ${createCostTableRow('2.2', 'Chi phí khác', details.otherSellingCosts, netRevenue)}

                    <!-- 3. Chi phí Quản lý doanh nghiệp -->
                    ${createCostTableRow('3', 'Chi phí Quản lý doanh nghiệp', totals.totalGaCost, netRevenue, '', true)}
                    ${createCostTableRow('3.1', 'Lương nhân viên gián tiếp', details.indirectStaffSalary, netRevenue)}
                    ${createCostTableRow('3.2', 'Thuê nhà', details.rent, netRevenue)}
                    ${createCostTableRow('3.3', 'Điện', details.electricity, netRevenue)}
                    ${createCostTableRow('3.4', 'Nước', details.water, netRevenue)}
                    ${createCostTableRow('3.5', 'VPP', details.stationery, netRevenue)}
                    ${createCostTableRow('3.6', 'Khấu hao TSCĐ', details.depreciation, netRevenue)}
                    ${createCostTableRow('3.7', 'Dịch vụ mua ngoài', details.externalServices, netRevenue)}
                    ${createCostTableRow('3.8', 'Chi phí tiền khác', details.otherCashExpenses, netRevenue)}

                    <!-- 4. Chi phí Tài chính -->
                    ${createCostTableRow('4', 'Chi phí Tài chính', totals.totalFinancialCost, netRevenue, '', true)}
                    ${createCostTableRow('4.1', 'Chi phí tài sản, định giá...', details.financialValuationCost, netRevenue)}

                    <!-- 6. Chi phí Khác (NEW) -->
                    ${createCostTableRow('6', 'Chi phí Khác (811)', details.otherExpenses, netRevenue, '', true)}
                    
                    <!-- TỔNG CỘNG -->
                    <tr class="bg-gray-200 border-t-2 border-gray-300 font-bold">
                        <td class="py-3 px-3 text-center text-sm text-gray-900"></td>
                        <td class="py-3 px-3 text-left text-sm text-gray-900 uppercase">TỔNG CỘNG CHI PHÍ</td>
                        <td class="py-3 px-3 text-right text-sm text-gray-900">
                            ${formatCurrency(totals.totalClearanceAndLogisticsCost + totals.totalSellingCost + totals.totalGaCost + totals.totalFinancialCost + details.otherExpenses)}
                        </td>
                        <td class="py-3 px-3 text-center text-sm text-gray-900">
                            ${netRevenue !== 0 ? ((totals.totalClearanceAndLogisticsCost + totals.totalSellingCost + totals.totalGaCost + totals.totalFinancialCost + details.otherExpenses) / netRevenue * 100).toFixed(2) : '0.00'}%
                        </td>
                        <td class="hidden-mobile"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  `;

  const productSummaryTableHeaders = [
    "Sản phẩm", "Doanh thu", "Giá vốn", "CP Vận hành & kho", "Lợi nhuận gộp", "CP Bán hàng", "CP Quản lý", "CP Tài chính", "Thu nhập khác", "Chi phí khác",
    "Lợi nhuận trước thuế", "Thuế TNDN", "Lãi ròng", "Thuế GTGT Mua vào", "Thuế GTGT Bán ra", "Thuế GTGT Phải nộp", "Tổng thuế phải nộp", "Tỷ lệ Lãi ròng"
  ];

  const productSummarySection = `
    <div class="mb-12 break-after-page">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">BÁO CÁO TỔNG HỢP THEO SẢN PHẨM</h1>
        <div class="overflow-x-auto border rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-100">
                    <tr>
                        ${productSummaryTableHeaders.map(header => `<th scope="col" class="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${items.map(item => {
                        const netProfitMargin = item.calculated.totalRevenue ? ((item.calculated.netProfit || 0) / item.calculated.totalRevenue) * 100 : 0;
                        return `
                        <tr>
                            <td class="px-3 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">${item.code} - ${item.group}</div>
                                <div class="text-sm text-gray-500">${item.nameVI} (${item.brand})</div>
                            </td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-green-700 text-right">${formatCurrency(item.calculated.totalRevenue)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(item.calculated.importValueVND)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(item.calculated.totalClearanceAndLogisticsCost)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-blue-700 font-medium text-right">${formatCurrency(item.calculated.grossProfit)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(item.calculated.totalSellingCost)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(item.calculated.totalGaCost)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(item.calculated.totalFinancialCost)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-green-600 text-right">${formatCurrency(item.calculated.otherIncome)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(item.calculated.otherExpenses)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-purple-700 font-medium text-right">${formatCurrency(item.calculated.profitBeforeTax)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-red-700 text-right">${formatCurrency(item.calculated.corporateIncomeTax)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm font-bold text-right ${item.calculated.netProfit && item.calculated.netProfit < 0 ? 'text-red-600' : 'text-green-600'}">${formatCurrency(item.calculated.netProfit)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(item.calculated.importVAT)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${formatCurrency(item.calculated.outputVAT)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-700 font-medium text-right">${formatCurrency(item.calculated.vatPayable)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-red-700 font-bold text-right">${formatCurrency(item.calculated.totalTaxPayable)}</td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm font-bold text-right ${netProfitMargin < 0 ? 'text-red-600' : 'text-indigo-600'}">${netProfitMargin.toFixed(2)}%</td>
                        </tr>
                    `}).join('')}
                </tbody>
                <tfoot class="bg-gray-100 font-bold">
                    <tr>
                        <td class="px-3 py-3 text-left text-sm text-gray-800 uppercase tracking-wider">Tổng cộng</td>
                        <td class="px-3 py-3 text-right text-sm text-green-800">${formatCurrency(totals.totalRevenue)}</td>
                        <td class="px-3 py-3 text-right text-sm text-gray-700">${formatCurrency(totals.importValueVND)}</td>
                        <td class="px-3 py-3 text-right text-sm text-gray-700">${formatCurrency(totals.totalClearanceAndLogisticsCost)}</td>
                        <td class="px-3 py-3 text-right text-sm text-blue-800">${formatCurrency(totals.grossProfit)}</td>
                        <td class="px-3 py-3 text-right text-sm text-gray-700">${formatCurrency(totals.totalSellingCost)}</td>
                        <td class="px-3 py-3 text-right text-sm text-gray-700">${formatCurrency(totals.totalGaCost)}</td>
                        <td class="px-3 py-3 text-right text-sm text-gray-700">${formatCurrency(totals.totalFinancialCost)}</td>
                        <td class="px-3 py-3 text-right text-sm text-green-600">${formatCurrency(totals.totalOtherIncome)}</td>
                        <td class="px-3 py-3 text-right text-sm text-gray-700">${formatCurrency(totals.totalOtherExpenses)}</td>
                        <td class="px-3 py-3 text-right text-sm text-purple-800">${formatCurrency(totals.profitBeforeTax)}</td>
                        <td class="px-3 py-3 text-right text-sm text-red-800">${formatCurrency(totals.corporateIncomeTax)}</td>
                        <td class="px-3 py-3 text-right text-sm ${totals.netProfit < 0 ? 'text-red-700' : 'text-green-700'}">${formatCurrency(totals.netProfit)}</td>
                        <td class="px-3 py-3 text-right text-sm text-gray-700">${formatCurrency(totals.importVAT)}</td>
                        <td class="px-3 py-3 text-right text-sm text-gray-700">${formatCurrency(totals.outputVAT)}</td>
                        <td class="px-3 py-3 text-right text-sm text-gray-700">${formatCurrency(totals.vatPayable)}</td>
                        <td class="px-3 py-3 text-right text-sm text-red-800">${formatCurrency(totals.totalTaxPayable)}</td>
                        <td class="px-3 py-3 text-right text-sm ${totalNetProfitMargin < 0 ? 'text-red-700' : 'text-indigo-700'}">${totalNetProfitMargin.toFixed(2)}%</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
  `;

  const detailSection = `
    <div>
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">BÁO CÁO KẾ HOẠCH KINH DOANH CHI TIẾT</h1>
      ${items.map(item => {
        const isDomestic = item.userInput.type === 'domestic';
        const isManufacturing = item.userInput.type === 'manufacturing';
        
        if (isManufacturing) {
            const outputsList = item.userInput.manufacturingOutputs?.map((out, idx) => `
                <div class="flex justify-between text-xs text-gray-600">
                    <span>- ${out.productCode || 'SP #' + (idx+1)}</span>
                    <span>${formatCurrency(out.quantity)} kg x ${formatCurrency(out.sellingPriceVND)}</span>
                </div>
            `).join('') || '';

            return `
            <div class="mb-8 p-6 border rounded-lg break-inside-avoid bg-white shadow-sm">
               <h2 class="text-2xl font-semibold text-indigo-700 mb-1">${item.group} - ${item.nameVI} (${item.code})</h2>
               <p class="text-md text-gray-500 mb-6"><strong>Thương hiệu:</strong> ${item.brand} (Sản xuất Thủy Sản)</p>

               <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <!-- Column 1: Input & Norms -->
                 <div class="space-y-4">
                    <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Nguyên liệu & Định mức</h3>
                    ${createDetailRow('1. Số lượng nguyên liệu', formatCurrency(item.userInput.quantityInKg) + ' kg')}
                    ${createDetailRow('2. Giá mua NL (chưa VAT)', formatCurrency(item.userInput.quantityInKg > 0 ? (item.calculated.importValueVND || 0) / item.userInput.quantityInKg : 0))}
                    ${createBoldDetailRow('3. Tổng tiền Nguyên liệu', formatCurrency(item.calculated.importValueVND))}
                    ${createDetailRow('4. Định mức SX toàn lô', (item.userInput.manufacturingCosts?.batchNorm || 0).toFixed(2))}
                    ${createBoldDetailRow('5. Thành phẩm nhập kho', formatCurrency(item.calculated.manufacturingCalculations?.finishedGoodsQty) + ' kg')}
                 </div>

                 <!-- Column 2: Production Costs -->
                 <div class="space-y-4">
                    <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Chi phí Sản xuất (Trực tiếp)</h3>
                    ${createDetailRow('1. Chi phí nhân công', formatCurrency(item.userInput.manufacturingCosts?.laborCost))}
                    ${createDetailRow('2. Điện, nước, nhiên liệu', formatCurrency(item.userInput.manufacturingCosts?.mealCost))}
                    ${createDetailRow('3. Điện SX & Nước', formatCurrency(item.userInput.manufacturingCosts?.electricityWaterCost))}
                    ${createDetailRow('4. Bao bì & Phụ gia', formatCurrency((item.userInput.manufacturingCosts?.additivesCost || 0) + (item.userInput.manufacturingCosts?.packagingCost || 0)))}
                    ${createDetailRow('5. Khấu hao & Khác', formatCurrency((item.userInput.manufacturingCosts?.depreciationCost || 0) + (item.userInput.manufacturingCosts?.toolsSuppliesCost || 0) + (item.userInput.manufacturingCosts?.storageCost || 0)))}
                    ${createBoldDetailRow('Tổng CP SX đơn vị', formatCurrency(item.calculated.manufacturingCalculations?.unitProductionCost) + '/kg')}
                    ${createBoldDetailRow('Tổng CP SX trực tiếp', formatCurrency(item.calculated.manufacturingCalculations?.totalProductionCost))}
                 </div>

                 <!-- Column 3: Revenue Structure -->
                 <div class="space-y-4">
                    <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Cơ cấu Doanh thu</h3>
                    <div class="border-b border-dashed border-gray-300 pb-2 mb-2">
                        <div class="text-sm font-semibold text-gray-700 mb-1">Chi tiết SP đầu ra:</div>
                        ${outputsList}
                    </div>
                    ${createDetailRow('Doanh thu chính (Outputs)', formatCurrency(item.calculated.totalRevenueInclVAT))}
                    ${createDetailRow('Doanh thu phụ phẩm', formatCurrency(item.calculated.manufacturingCalculations?.totalByProductRevenue))}
                    ${createBoldDetailRow('Tổng Doanh thu (Gộp)', formatCurrency(item.calculated.manufacturingCalculations?.totalRevenueInclVAT_All))}
                    <div class="text-xs text-gray-500 italic mt-1 text-right">*Bao gồm VAT</div>
                    ${createBoldDetailRow('Giá vốn hàng bán (Gross)', formatCurrency(item.calculated.totalCOGS))}
                 </div>
               </div>

               <hr class="my-6 border-t-2 rounded"/>

               <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <!-- Operating Costs -->
                  <div>
                      <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Chi phí Vận hành</h3>
                      ${createDetailRow('CP Thông quan & Kho', formatCurrency((item.calculated.totalClearanceAndLogisticsCost || 0) - (item.calculated.manufacturingCalculations?.totalProductionCost || 0)))}
                      ${createDetailRow('CP Bán hàng', formatCurrency(item.calculated.totalSellingCost))}
                      ${createDetailRow('CP Quản lý DN', formatCurrency(item.calculated.totalGaCost))}
                      ${createDetailRow('CP Tài chính', formatCurrency(item.calculated.totalFinancialCost))}
                      ${createDetailRow('Chi phí khác', formatCurrency(item.calculated.otherExpenses))}
                      ${createBoldDetailRow('Tổng CP Vận hành', formatCurrency((item.calculated.totalOperatingCost || 0) + (item.calculated.totalFinancialCost || 0) + (item.calculated.otherExpenses || 0)))}
                  </div>

                  <!-- Profit Analysis -->
                  <div>
                      <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Kết quả Kinh doanh</h3>
                      ${createDetailRow('Lợi nhuận gộp', formatCurrency(item.calculated.grossProfit))}
                      ${createDetailRow('Thu nhập khác', formatCurrency(item.calculated.otherIncome))}
                      ${createBoldDetailRow('Lợi nhuận trước thuế', formatCurrency(item.calculated.profitBeforeTax))}
                      ${createDetailRow('Thuế TNDN (20%)', formatCurrency(item.calculated.corporateIncomeTax))}
                      <div class="mt-2 p-2 rounded-lg bg-green-100">
                        ${createBoldDetailRow('Lãi ròng (Net Profit)', formatCurrency(item.calculated.netProfit))}
                        ${createDetailRow('Tỷ suất LN ròng', `${item.calculated.totalRevenue ? ((item.calculated.netProfit || 0) / item.calculated.totalRevenue * 100).toFixed(2) : 0}%`)}
                      </div>
                  </div>

                  <!-- Profit Distribution -->
                   <div>
                      <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Phân phối Lợi nhuận</h3>
                      ${createDetailRow('Trích lập dự phòng (10%)', formatCurrency(item.calculated.retainedForProvision))}
                      ${createDetailRow('Bổ sung vốn KD (60%)', formatCurrency(item.calculated.retainedForBusiness))}
                      ${createDetailRow('Chia cổ đông (30%)', formatCurrency(item.calculated.dividends))}
                  </div>
               </div>
            </div>
            `;
        }

        return `
        <div class="mb-8 p-6 border rounded-lg break-inside-avoid bg-white shadow-sm">
           <h2 class="text-2xl font-semibold text-indigo-700 mb-1">${item.group} - ${item.nameVI} (${item.code})</h2>
           <p class="text-md text-gray-500 mb-2"><strong>Tên tiếng Anh:</strong> ${item.nameEN}</p>
           <p class="text-md text-gray-500 mb-6"><strong>Thương hiệu:</strong> ${item.brand}</p>
           
           <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div class="space-y-4">
                <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">${isDomestic ? 'Giá mua hàng trong nước & Thuế' : 'Chi phí nhập khẩu & Thuế'}</h3>
                ${createDetailRow('Số lượng (Kg)', formatCurrency(item.userInput.quantityInKg))}
                
                ${!isDomestic ? `
                    ${createDetailRow('Giá (USD)/Kg', (item.calculated.priceUSDPerKg || 0).toFixed(3))}
                    ${createDetailRow('Tỷ giá USD/VNĐ', formatCurrency(importRate))}
                    ${createDetailRow('Giá nhập (USD)', formatCurrency(item.calculated.importValueUSD))}
                    ${createBoldDetailRow('Giá nhập (VNĐ)', formatCurrency(item.calculated.importValueVND))}
                    ${createDetailRow('Thuế suất GTGT NK', `${item.userInput.costs.importVatRate}%`)}
                    ${createDetailRow('Tỷ giá USD/VNĐ tính thuế', formatCurrency(taxRate))}
                    ${createBoldDetailRow('Thuế GTGT nhập khẩu', formatCurrency(item.calculated.importVAT))}
                ` : `
                    ${createDetailRow('Giá mua (VNĐ/kg) (Có VAT)', formatCurrency(item.userInput.domesticPurchasePriceVNDPerKg))}
                    ${createDetailRow('Giá mua chưa VAT', formatCurrency(item.calculated.importValueVND))}
                    ${createDetailRow('Thuế VAT đầu vào', formatCurrency(item.calculated.importVAT))}
                    ${createBoldDetailRow('Tổng tiền trả NCC', formatCurrency((item.calculated.importValueVND || 0) + (item.calculated.importVAT || 0)))}
                    ${createDetailRow('Thuế suất VAT Mua', `${item.userInput.costs.importVatRate}%`)}
                `}
             </div>
             
             <div class="space-y-4">
                <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">${isDomestic ? 'Chi phí Mua hàng & Lưu kho' : 'Chi phí Thông quan & Vận hành'}</h3>
                ${!isDomestic ? `
                    ${createDetailRow('1.1 Phí Hải quan', formatCurrency(item.userInput.costs.customsFee), true)}
                    ${createDetailRow('1.2 Phí kiểm dịch', formatCurrency(item.userInput.costs.quarantineFee), true)}
                    ${createDetailRow('1.3 Phí thuê Cont', formatCurrency(item.userInput.costs.containerRentalFee), true)}
                    ${createDetailRow('1.4 Phí lưu kho bãi cảng', formatCurrency(item.userInput.costs.portStorageFee), true)}
                    ${createDetailRow('1.5 Chi phí chung nhập kho', formatCurrency(item.calculated.generalWarehouseCost), true)}
                    ${createDetailRow('1.6 Lãi vay nhập hàng', formatCurrency(item.calculated.importInterestCost), true)}
                    ${createDetailRow('1.7 Phí lưu kho sau TQ', formatCurrency(item.calculated.postClearanceStorageCost), true)}
                    ${createDetailRow('1.8 DV mua hàng', formatCurrency(item.calculated.purchasingServiceFee), true)}
                    ${createDetailRow('1.9 Phí VC đến bên mua', formatCurrency(item.userInput.costs.buyerDeliveryFee), true)}
                    ${createDetailRow('1.10 Chi phí khác', formatCurrency(item.calculated.otherInternationalPurchaseCost), true)}
                ` : `
                    ${createDetailRow('1.1 Lãi vay', formatCurrency(item.calculated.importInterestCost), true)}
                    ${createDetailRow('1.2 Lưu kho', formatCurrency(item.calculated.postClearanceStorageCost), true)}
                    ${createDetailRow('1.3 DV mua hàng', formatCurrency(item.calculated.purchasingServiceFee), true)}
                    ${createDetailRow('1.4 Vận chuyển', formatCurrency(item.userInput.costs.buyerDeliveryFee), true)}
                    ${createDetailRow('1.5 Chi phí khác', formatCurrency(item.calculated.otherInternationalPurchaseCost), true)}
                `}
                ${createBoldDetailRow(isDomestic ? 'Tổng Chi phí' : 'Tổng Chi phí TQ & Kho', formatCurrency(item.calculated.totalClearanceAndLogisticsCost))}
             </div>
             
             <div class="space-y-4">
                <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Giá vốn & Doanh thu</h3>
                ${createDetailRow(isDomestic ? 'Giá mua chưa VAT' : 'Giá nhập (VNĐ)', formatCurrency(item.calculated.importValueVND))}
                ${createDetailRow(isDomestic ? 'CP Mua hàng & Kho' : 'Tổng Chi phí TQ & Kho', formatCurrency(item.calculated.totalClearanceAndLogisticsCost))}
                ${createBoldDetailRow('Tổng giá vốn hàng bán', formatCurrency(item.calculated.totalCOGS))}
                ${createBoldDetailRow('Giá vốn/kg', formatCurrency(item.calculated.cogsPerKg))}
                 <div class="pt-4">
                    ${createDetailRow('Giá bán/kg (có VAT)', formatCurrency(item.userInput.sellingPriceVNDPerKg))}
                    ${createDetailRow('Giá bán/kg (ko VAT)', formatCurrency(item.calculated.sellingPriceExclVAT))}
                    ${createBoldDetailRow('Tổng doanh thu', formatCurrency(item.calculated.totalRevenue))}
                    ${createDetailRow(`Thuế GTGT đầu ra (${item.userInput.outputVatRate ?? item.userInput.costs.importVatRate}%)`, formatCurrency(item.calculated.outputVAT))}
                    ${createBoldDetailRow('Thuế GTGT phải nộp', formatCurrency(item.calculated.vatPayable))}
                 </div>
             </div>
           </div>
           
           <hr class="my-6 border-t-2 rounded"/>

           <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                  <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Chi phí Hoạt động</h3>
                  ${createDetailRow('CP Bán hàng', formatCurrency(item.calculated.totalSellingCost))}
                  ${createDetailRow('CP Quản lý DN', formatCurrency(item.calculated.totalGaCost))}
                  ${createDetailRow('CP Tài chính', formatCurrency(item.calculated.totalFinancialCost))}
                  ${createDetailRow('Chi phí khác', formatCurrency(item.calculated.otherExpenses))}
                  ${createBoldDetailRow('Tổng chi phí', formatCurrency((item.calculated.totalOperatingCost || 0) + (item.calculated.totalFinancialCost || 0) + (item.calculated.otherExpenses || 0)))}
              </div>
              <div>
                  <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Phân tích Lợi nhuận</h3>
                  ${createDetailRow('Doanh thu', formatCurrency(item.calculated.totalRevenue))}
                  ${createDetailRow('Giá vốn hàng bán', `-${formatCurrency(item.calculated.totalCOGS)}`)}
                  ${createBoldDetailRow('Lợi nhuận gộp', formatCurrency(item.calculated.grossProfit))}
                  ${createDetailRow('Tổng chi phí hoạt động', `-${formatCurrency((item.calculated.totalOperatingCost || 0) + (item.calculated.totalFinancialCost || 0) + (item.calculated.otherExpenses || 0))}`)}
                  ${createDetailRow('Thu nhập khác', formatCurrency(item.calculated.otherIncome), true)}
                  ${createBoldDetailRow('Lợi nhuận trước thuế', formatCurrency(item.calculated.profitBeforeTax))}
                  ${createDetailRow('Thuế TNDN (20%)', `-${formatCurrency(item.calculated.corporateIncomeTax)}`)}
                  <div class="mt-2 p-2 rounded-lg bg-green-100">
                    ${createBoldDetailRow('Lãi ròng', formatCurrency(item.calculated.netProfit))}
                    ${createDetailRow('Tỷ suất LN ròng', `${item.calculated.totalRevenue ? ((item.calculated.netProfit || 0) / item.calculated.totalRevenue * 100).toFixed(2) : 0}%`)}
                  </div>
              </div>
               <div>
                  <h3 class="font-semibold text-lg pb-2 border-b text-gray-700">Phân chia Lợi nhuận</h3>
                  ${createDetailRow('Trích lập dự phòng (10%)', formatCurrency(item.calculated.retainedForProvision))}
                  ${createDetailRow('Bổ sung vốn KD (60%)', formatCurrency(item.calculated.retainedForBusiness))}
                  ${createDetailRow('Chia cổ đông (30%)', formatCurrency(item.calculated.dividends))}
              </div>
           </div>
        </div>
      `;
      }).join('')}
    </div>
  `;

  const analysisSection = analysisHtml ? `
    <div class="break-inside-avoid">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-8 mt-12">PHÂN TÍCH & ĐÁNH GIÁ KẾ HOẠCH (AI)</h1>
      <div class="analysis-content p-6 border rounded-lg bg-white shadow-sm text-gray-800">
        ${analysisHtml}
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Báo cáo Kế hoạch Kinh doanh</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
            .break-after-page { page-break-after: always; }
            .break-inside-avoid { page-break-inside: avoid; }
          }
          @media (max-width: 768px) {
            h1 { font-size: 1.5rem !important; }
            h2 { font-size: 1.25rem !important; }
            .container { padding: 10px !important; }
            table { display: block; overflow-x: auto; white-space: nowrap; }
            .grid { display: flex; flex-direction: column; }
            .hidden-mobile { display: none; }
          }
          .analysis-content h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; padding-bottom: 0.25em; border-bottom: 1px solid #e5e7eb; color: #1e3a8a; }
          .analysis-content p { margin-bottom: 1em; line-height: 1.6; }
          .analysis-content ul { list-style-position: inside; padding-left: 1em; margin-bottom: 1em; }
          .analysis-content li { margin-bottom: 0.5em; }
          .analysis-content strong { font-weight: 600; color: #1f2937; }
        </style>
    </head>
    <body class="bg-gray-100 font-sans">
      <div class="container mx-auto p-4 sm:p-8 bg-white shadow-lg my-8">
        ${summarySection}
        ${comparisonSection}
        ${costSummarySection}
        ${productSummarySection}
        ${detailSection}
        ${analysisSection}
      </div>
    </body>
    </html>
  `;
};
