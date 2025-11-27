
import React, { useState, useEffect } from 'react';
import type { PlanItem } from '../types';
import { InputGroup } from './InputGroup';
import { formatCurrency } from '../utils/formatters';
import { FormattedNumberInput } from './FormattedNumberInput';

interface PlanItemDetailsProps {
  item: PlanItem;
  updateItem: (id: string, field: string, value: number) => void;
  planTotals: { totalGrossProfit: number; totalQuantityInKg: number; };
  salesSalaryRate: number;
  setSalesSalaryRate: (value: number) => void;
  totalMonthlyIndirectSalary: number;
  setTotalMonthlyIndirectSalary: (value: number) => void;
  workingDaysPerMonth: number;
  setWorkingDaysPerMonth: (value: number) => void;
  totalMonthlyRent: number;
  setTotalMonthlyRent: (value: number) => void;
  totalMonthlyElectricity: number;
  setTotalMonthlyElectricity: (value: number) => void;
  totalMonthlyWater: number;
  setTotalMonthlyWater: (value: number) => void;
  totalMonthlyStationery: number;
  setTotalMonthlyStationery: (value: number) => void;
  totalMonthlyDepreciation: number;
  setTotalMonthlyDepreciation: (value: number) => void;
  totalMonthlyExternalServices: number;
  setTotalMonthlyExternalServices: (value: number) => void;
  totalMonthlyOtherCashExpenses: number;
  setTotalMonthlyOtherCashExpenses: (value: number) => void;
  totalMonthlyFinancialCost: number;
  setTotalMonthlyFinancialCost: (value: number) => void;
}

export const PlanItemDetails: React.FC<PlanItemDetailsProps> = ({ 
    item, 
    updateItem, 
    planTotals, 
    salesSalaryRate, 
    setSalesSalaryRate,
    totalMonthlyIndirectSalary,
    setTotalMonthlyIndirectSalary,
    workingDaysPerMonth,
    setWorkingDaysPerMonth,
    totalMonthlyRent,
    setTotalMonthlyRent,
    totalMonthlyElectricity,
    setTotalMonthlyElectricity,
    totalMonthlyWater,
    setTotalMonthlyWater,
    totalMonthlyStationery,
    setTotalMonthlyStationery,
    totalMonthlyDepreciation,
    setTotalMonthlyDepreciation,
    totalMonthlyExternalServices,
    setTotalMonthlyExternalServices,
    totalMonthlyOtherCashExpenses,
    setTotalMonthlyOtherCashExpenses,
    totalMonthlyFinancialCost,
    setTotalMonthlyFinancialCost
}) => {
  const { id, userInput, calculated } = item;
  
  // Tăng kích thước chữ lên 13px
  const DetailRow = ({ label, value, highlight = false, subText = '' }: { label: string, value: string | number, highlight?: boolean, subText?: string }) => (
    <div className="flex justify-between items-center text-[13px] py-1 border-b border-dashed border-gray-200 last:border-0">
      <span className="text-gray-600">{label}: {subText && <span className="text-xs text-gray-400 italic">({subText})</span>}</span>
      <span className={`font-medium text-right ${highlight ? 'text-indigo-700 font-bold' : 'text-gray-800'}`}>{value}</span>
    </div>
  );

  const HighlightBlock = ({ label, value, bgClass = "bg-gray-50", textClass = "text-gray-900" }: { label: string, value: string, bgClass?: string, textClass?: string }) => (
    <div className={`p-2 rounded border ${bgClass} mt-1 mb-1 shadow-sm`}>
        <div className="text-[13px] font-bold text-gray-700 mb-0.5 uppercase tracking-wide">{label}</div>
        <div className={`text-lg font-extrabold text-right ${textClass}`}>{value}</div>
    </div>
  );
  
  interface AllocatedCostBlockProps {
    id: string;
    label: string;
    totalMonthlyCost: number;
    setTotalMonthlyCost: (value: number) => void;
    allocatedCost?: number;
    totalQuantityInKg: number;
    itemQuantityInKg: number;
  }

  const AllocatedCostBlock: React.FC<AllocatedCostBlockProps> = ({ id, label, totalMonthlyCost, setTotalMonthlyCost, allocatedCost = 0, totalQuantityInKg, itemQuantityInKg }) => {
    const [localTotalCost, setLocalTotalCost] = useState(totalMonthlyCost);
    
    useEffect(() => {
        setLocalTotalCost(totalMonthlyCost);
    }, [totalMonthlyCost]);

    const handleCommit = (newValue: number) => {
        if (newValue !== totalMonthlyCost) {
            setTotalMonthlyCost(newValue);
        }
    }
    
    return (
        <div className="p-2 bg-gray-50 rounded border border-gray-200 space-y-1 mb-2">
            <label className="block text-[13px] font-bold text-gray-700">{label}</label>
            <div className="flex justify-between items-center text-[13px]">
                <label htmlFor={`total-cost-${id}`} className="text-gray-500 w-1/2">Tổng/tháng:</label>
                <div className="w-1/2">
                    <FormattedNumberInput
                        srOnlyLabel
                        label={`Tổng ${label}/tháng`}
                        id={`total-cost-${id}`}
                        value={localTotalCost}
                        onChange={setLocalTotalCost}
                        onCommit={handleCommit}
                        // addon="VND"
                    />
                </div>
            </div>
            <div className="flex justify-between items-center text-[13px] pt-1 border-t border-gray-200">
                <span className="text-gray-600">Phân bổ:</span>
                <span className="font-bold text-gray-900">{formatCurrency(allocatedCost)}</span>
            </div>
        </div>
    );
  };

  const SectionHeader = ({ title, bgClass, textClass }: { title: string, bgClass: string, textClass: string }) => (
      <h4 className={`font-bold text-[13px] uppercase py-2 px-3 rounded-t mb-2 ${bgClass} ${textClass} border-b border-gray-200`}>
          {title}
      </h4>
  );

  return (
    <div className="p-2 bg-white border-t border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
        
        {/* Cột 1: Số lượng & Giá */}
        <div className="flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full">
          <SectionHeader title="Số lượng & Giá" bgClass="bg-blue-100" textClass="text-blue-800" />
          <div className="p-2 space-y-2 flex-1 text-[13px]">
            <FormattedNumberInput
                id={`quantity-${id}`}
                label="1. Số lượng (Kg)"
                value={userInput.quantityInKg}
                onChange={(value) => updateItem(id, 'quantityInKg', value)}
                addon={<span>~{calculated.containers?.toFixed(2)}c</span>}
            />

            <FormattedNumberInput
                id={`priceUSD-${id}`}
                label="2. Giá mua (USD/tấn)"
                value={userInput.priceUSDPerTon}
                onChange={(value) => updateItem(id, 'priceUSDPerTon', value)}
                decimalPlaces={2}
            />
            <DetailRow label="= Giá mua (VND/tấn)" value={formatCurrency(calculated.priceVNDPerTon)} />
            
            <HighlightBlock 
                label="3. Tổng giá mua" 
                value={formatCurrency(calculated.importValueVND)} 
                bgClass="bg-orange-50 border-orange-200" 
                textClass="text-orange-900"
            />
            
            <div className="grid grid-cols-2 gap-2">
                <FormattedNumberInput
                    id={`importVatRate-${id}`}
                    label="4. VAT NK (%)"
                    value={userInput.costs.importVatRate}
                    onChange={value => updateItem(id, 'costs.importVatRate', value)}
                    decimalPlaces={0}
                />
                <FormattedNumberInput
                    id={`outputVatRate-${id}`}
                    label="5. VAT Bán (%)"
                    value={userInput.outputVatRate ?? userInput.costs.importVatRate}
                    onChange={value => updateItem(id, 'outputVatRate', value)}
                    decimalPlaces={0}
                />
            </div>

            <FormattedNumberInput
                id={`priceVND-${id}`}
                label="6. Giá bán (VND/kg)"
                value={userInput.sellingPriceVNDPerKg}
                onChange={(value) => updateItem(id, 'sellingPriceVNDPerKg', value)}
                addon="có VAT"
            />

            <div className="pt-2 border-t mt-1 space-y-1">
                 <div className="font-bold text-gray-700 mb-1">7. Chi tiết doanh thu</div>
                 <DetailRow label="Doanh thu chưa thuế VAT" value={formatCurrency(calculated.totalRevenue)} />
                 <DetailRow label={`Thuế GTGT đầu ra (${userInput.outputVatRate ?? userInput.costs.importVatRate}%)`} value={formatCurrency(calculated.outputVAT)} />
                 
                 <HighlightBlock 
                    label="Tổng thu tiền" 
                    value={formatCurrency(calculated.totalRevenueInclVAT)} 
                    bgClass="bg-green-50 border-green-200" 
                    textClass="text-green-900"
                />
            </div>
          </div>
        </div>


        {/* Cột 2: Chi phí thông quan & kho bãi */}
        <div className="flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full">
          <SectionHeader title="1. CP Thông quan & Kho" bgClass="bg-teal-100" textClass="text-teal-800" />
          <div className="p-2 space-y-2 flex-1 text-[13px] overflow-y-auto max-h-[600px] lg:max-h-none">
            <div className="flex justify-between items-center bg-teal-50 p-1.5 rounded mb-2">
              <span className="text-gray-700 font-semibold">Tổng cộng:</span>
              <span className="font-bold text-teal-900">{formatCurrency(calculated.totalClearanceAndLogisticsCost)}</span>
            </div>
            
            <FormattedNumberInput id={`customsFee-${id}`} label="1.1 Phí Hải quan" value={userInput.costs.customsFee} onChange={value => updateItem(id, 'costs.customsFee', value)} />
            <FormattedNumberInput id={`quarantineFee-${id}`} label="1.2 Phí kiểm dịch" value={userInput.costs.quarantineFee} onChange={value => updateItem(id, 'costs.quarantineFee', value)} />
            <FormattedNumberInput id={`containerRentalFee-${id}`} label="1.3 Phí thuê Cont" value={userInput.costs.containerRentalFee} onChange={value => updateItem(id, 'costs.containerRentalFee', value)} />
            <FormattedNumberInput id={`portStorageFee-${id}`} label="1.4 Phí lưu bãi" value={userInput.costs.portStorageFee} onChange={value => updateItem(id, 'costs.portStorageFee', value)} />
            
            <div className="p-2 bg-gray-50 rounded border border-gray-200">
               <label className="block font-semibold text-gray-700 mb-1">1.5 CP chung nhập kho</label>
               <FormattedNumberInput
                   srOnlyLabel 
                   label="Đơn giá" 
                   id={`generalWarehouseCostRate-${id}`} 
                   value={userInput.costs.generalWarehouseCostRatePerKg} 
                   onChange={value => updateItem(id, 'costs.generalWarehouseCostRatePerKg', value)} 
                   addon="đ/kg" 
               />
               <DetailRow label="Thành tiền" value={formatCurrency(calculated.generalWarehouseCost)} />
            </div>

            {/* 1.6 Lãi vay nhập hàng - START OF CHANGE */}
            <div className="p-2 bg-gray-50 rounded border border-gray-200">
               <label className="block font-semibold text-gray-700 mb-2">1.6 Chi phí lãi vay nhập hàng</label>
               
               <div className="mb-3">
                 <FormattedNumberInput label="1. Lãi suất" id={`loanInterestRate-${id}`} value={userInput.costs.loanInterestRatePerYear} onChange={value => updateItem(id, 'costs.loanInterestRatePerYear', value)} decimalPlaces={2} addon="%/năm" />
               </div>

               <div className="space-y-2 mb-3">
                 <p className="text-xs font-semibold text-gray-600 border-b border-gray-300 pb-1">Lần chuyển 1</p>
                 <FormattedNumberInput label="2. Số tiền chuyển lần 1" id={`loanFirstTransferUSD-${id}`} value={userInput.costs.loanFirstTransferUSD} onChange={value => updateItem(id, 'costs.loanFirstTransferUSD', value)} addon="USD" />
                 <DetailRow label="= Số tiền (VND)" value={formatCurrency(calculated.loanFirstTransferAmountVND)} />
                 
                 <div className="flex space-x-1 items-center">
                    <div className="flex-grow">
                        <FormattedNumberInput label="3. Thời gian tính lãi lần 1" id={`loanFirstTransferInterestDays-${id}`} value={userInput.costs.loanFirstTransferInterestDays} onChange={value => updateItem(id, 'costs.loanFirstTransferInterestDays', value)} addon="ngày" />
                    </div>
                 </div>
                 <DetailRow label="4. Chi phí lãi vay lần 1" value={formatCurrency(calculated.loanInterestCostFirstTransfer)} />
               </div>

               <div className="space-y-2 mb-3">
                 <p className="text-xs font-semibold text-gray-600 border-b border-gray-300 pb-1">Lần chuyển 2</p>
                 <DetailRow label="5. Số tiền chuyển lần 2" value={formatCurrency(calculated.loanSecondTransferAmountVND)} />
                 <DetailRow label="Thời gian tính lãi" value={`${userInput.costs.postClearanceStorageDays} ngày`} />
                 <DetailRow label="6. Chi phí lãi vay lần 2" value={formatCurrency(calculated.loanInterestCostSecondTransfer)} />
               </div>

               {userInput.costs.importVatRate > 0 && (
                   <div className="space-y-2 mb-3">
                     <p className="text-xs font-semibold text-gray-600 border-b border-gray-300 pb-1">Lần chuyển nộp thuế tại Hải Quan</p>
                     <DetailRow label="Số tiền nộp thuế GTGT" value={formatCurrency(calculated.importVAT)} />
                     <DetailRow label="Thời gian tính lãi" value={`${userInput.costs.postClearanceStorageDays} ngày`} />
                     <DetailRow label="7. Chi phí lãi vay nộp thuế" value={formatCurrency(calculated.vatLoanInterestCost)} />
                   </div>
               )}

               <div className="mt-2 pt-2 border-t border-gray-300">
                   <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 text-sm">8. Tổng lãi vay</span>
                        <span className="font-extrabold text-indigo-700 text-base">{formatCurrency(calculated.importInterestCost)}</span>
                   </div>
               </div>
            </div>
            {/* 1.6 Lãi vay nhập hàng - END OF CHANGE */}
           
            <div className="p-2 bg-gray-50 rounded border border-gray-200">
               <label className="block font-semibold text-gray-700 mb-1">1.7 Lưu kho sau TQ</label>
               <div className="flex space-x-1">
                   <FormattedNumberInput srOnlyLabel label="Số ngày" id={`postClearanceStorageDays-${id}`} value={userInput.costs.postClearanceStorageDays} onChange={value => updateItem(id, 'costs.postClearanceStorageDays', value)} addon="ngày" />
                   <FormattedNumberInput srOnlyLabel label="Đơn giá" id={`postClearanceStorageRate-${id}`} value={userInput.costs.postClearanceStorageRatePerKgDay} onChange={value => updateItem(id, 'costs.postClearanceStorageRatePerKgDay', value)} addon="đ/kg" />
               </div>
               <DetailRow label="Thành tiền" value={formatCurrency(calculated.postClearanceStorageCost)} />
            </div>
           
            <div className="p-2 bg-gray-50 rounded border border-gray-200">
               <label className="block font-semibold text-gray-700 mb-1">1.8 DV mua hàng</label>
               <FormattedNumberInput
                   srOnlyLabel 
                   label="Đơn giá" 
                   id={`purchasingServiceFee-${id}`} 
                   value={userInput.costs.purchasingServiceFeeInMillionsPerCont * 1000000} 
                   onChange={value => updateItem(id, 'costs.purchasingServiceFeeInMillionsPerCont', value / 1000000)} 
                   addon="đ/cont" 
               />
               <DetailRow label="Thành tiền" value={formatCurrency(calculated.purchasingServiceFee)} />
            </div>
           
            <FormattedNumberInput id={`buyerDeliveryFee-${id}`} label="1.9 VC đến bên mua" value={userInput.costs.buyerDeliveryFee} onChange={value => updateItem(id, 'costs.buyerDeliveryFee', value)} />
            <FormattedNumberInput id={`otherInternationalCosts-${id}`} label="1.10 CP khác" value={userInput.costs.otherInternationalCosts} onChange={value => updateItem(id, 'costs.otherInternationalCosts', value)} />
          </div>
        </div>

        {/* Cột 3: Chi phí Bán hàng */}
        <div className="flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full">
          <SectionHeader title="2. Chi phí Bán hàng" bgClass="bg-amber-100" textClass="text-amber-800" />
          <div className="p-2 space-y-2 flex-1 text-[13px]">
             <div className="flex justify-between items-center bg-amber-50 p-1.5 rounded mb-2">
              <span className="text-gray-700 font-semibold">Tổng cộng:</span>
              <span className="font-bold text-amber-900">{formatCurrency(calculated.totalSellingCost)}</span>
            </div>

            <div className="p-2 bg-gray-50 rounded border border-gray-200 space-y-2">
                <label className="block font-bold text-gray-700">2.1 Lương NV BH</label>
                <div className="flex justify-between items-center">
                    <label htmlFor={`sales-salary-rate-${id}`} className="text-gray-600">Tỷ lệ (% LN gộp):</label>
                    <div className="w-20">
                        <FormattedNumberInput
                            srOnlyLabel
                            label="Tỷ lệ lương"
                            id={`sales-salary-rate-${id}`}
                            value={salesSalaryRate}
                            onChange={setSalesSalaryRate}
                            decimalPlaces={2}
                            addon="%"
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                    <span className="text-gray-600">Phân bổ:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(calculated.salesStaffSalary)}</span>
                </div>
            </div>
            
            <FormattedNumberInput id={`otherSellingCosts-${id}`} label="2.2 CP khác tại nơi bán" value={userInput.costs.otherSellingCosts} onChange={value => updateItem(id, 'costs.otherSellingCosts', value)} />
          </div>
        </div>

        {/* Cột 4: Chi phí Quản lý DN */}
        <div className="flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full">
          <SectionHeader title="3. CP Quản lý DN" bgClass="bg-indigo-100" textClass="text-indigo-800" />
          <div className="p-2 space-y-2 flex-1 text-[13px] overflow-y-auto max-h-[600px] lg:max-h-none">
             <div className="flex justify-between items-center bg-indigo-50 p-1.5 rounded mb-2">
              <span className="text-gray-700 font-semibold">Tổng cộng:</span>
              <span className="font-bold text-indigo-900">{formatCurrency(calculated.totalGaCost)}</span>
            </div>

            <div className="p-2 bg-gray-50 rounded border border-gray-200 space-y-1 mb-2">
                <label className="block font-bold text-gray-700">3.1 Lương gián tiếp</label>
                <div className="flex justify-between items-center">
                    <label className="text-gray-500 w-1/2">Tổng/tháng:</label>
                    <div className="w-1/2">
                        <FormattedNumberInput
                            srOnlyLabel
                            label="Tổng lương GT"
                            id={`total-indirect-salary-${id}`}
                            value={totalMonthlyIndirectSalary}
                            onChange={setTotalMonthlyIndirectSalary}
                        />
                    </div>
                </div>
                 <div className="flex justify-between items-center">
                    <label className="text-gray-500 w-1/2">Ngày công:</label>
                    <div className="w-1/2">
                        <FormattedNumberInput
                            srOnlyLabel
                            label="Ngày công"
                            id={`working-days-${id}`}
                            value={workingDaysPerMonth}
                            onChange={setWorkingDaysPerMonth}
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                    <span className="text-gray-600">Phân bổ:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(calculated.indirectStaffSalary)}</span>
                </div>
            </div>

             <AllocatedCostBlock id={`rent-${id}`} label="3.2 Thuê nhà" totalMonthlyCost={totalMonthlyRent} setTotalMonthlyCost={setTotalMonthlyRent} allocatedCost={calculated.rent} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`electricity-${id}`} label="3.3 Điện" totalMonthlyCost={totalMonthlyElectricity} setTotalMonthlyCost={setTotalMonthlyElectricity} allocatedCost={calculated.electricity} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`water-${id}`} label="3.4 Nước" totalMonthlyCost={totalMonthlyWater} setTotalMonthlyCost={setTotalMonthlyWater} allocatedCost={calculated.water} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`stationery-${id}`} label="3.5 VPP" totalMonthlyCost={totalMonthlyStationery} setTotalMonthlyCost={setTotalMonthlyStationery} allocatedCost={calculated.stationery} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`depreciation-${id}`} label="3.6 Khấu hao TSCĐ" totalMonthlyCost={totalMonthlyDepreciation} setTotalMonthlyCost={setTotalMonthlyDepreciation} allocatedCost={calculated.depreciation} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`externalServices-${id}`} label="3.7 Dịch vụ ngoài" totalMonthlyCost={totalMonthlyExternalServices} setTotalMonthlyCost={setTotalMonthlyExternalServices} allocatedCost={calculated.externalServices} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`otherCashExpenses-${id}`} label="3.8 Tiền khác" totalMonthlyCost={totalMonthlyOtherCashExpenses} setTotalMonthlyCost={setTotalMonthlyOtherCashExpenses} allocatedCost={calculated.otherCashExpenses} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
          </div>
        </div>

        {/* Cột 5: Chi phí Tài chính */}
        <div className="flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full">
          <SectionHeader title="4. Chi phí Tài chính" bgClass="bg-rose-100" textClass="text-rose-800" />
          <div className="p-2 space-y-2 flex-1 text-[13px]">
             <div className="flex justify-between items-center bg-rose-50 p-1.5 rounded mb-2">
              <span className="text-gray-700 font-semibold">Tổng cộng:</span>
              <span className="font-bold text-rose-900">{formatCurrency(calculated.totalFinancialCost)}</span>
            </div>
            <AllocatedCostBlock id={`financialCost-${id}`} label="4.1 CP tài sản, định giá" totalMonthlyCost={totalMonthlyFinancialCost} setTotalMonthlyCost={setTotalMonthlyFinancialCost} allocatedCost={calculated.financialValuationCost} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
          </div>
        </div>
        
      </div>
    </div>
  );
};
