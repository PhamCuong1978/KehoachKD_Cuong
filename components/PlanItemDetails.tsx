
import React, { useState, useEffect } from 'react';
import type { PlanItem, Product, ManufacturingOutput } from '../types';
import { InputGroup } from './InputGroup';
import { formatCurrency } from '../utils/formatters';
import { FormattedNumberInput } from './FormattedNumberInput';
import { TrashIcon } from './icons/TrashIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface PlanItemDetailsProps {
  item: PlanItem;
  products: Product[]; // Passed down to select output products
  updateItem: (id: string, field: string, value: any) => void;
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
  // New props
  totalMonthlyOtherIncome: number;
  setTotalMonthlyOtherIncome: (value: number) => void;
  totalMonthlyOtherExpenses: number;
  setTotalMonthlyOtherExpenses: (value: number) => void;
}

// --- Helper Components Defined Outside to Prevent Re-mounts ---

const DetailRow = ({ label, value, highlight = false, subText = '' }: { label: string, value: string | number, highlight?: boolean, subText?: string }) => (
  <div className="flex justify-between items-center text-[13px] py-1.5 border-b border-dashed border-gray-200 last:border-0">
    <span className="text-gray-600">{label}: {subText && <span className="text-xs text-gray-400 italic">({subText})</span>}</span>
    <span className={`font-medium text-right ${highlight ? 'text-indigo-700 font-bold' : 'text-gray-800'}`}>{value}</span>
  </div>
);

const HighlightBlock = ({ label, value, bgClass = "bg-gray-50", textClass = "text-gray-900" }: { label: string, value: string, bgClass?: string, textClass?: string }) => (
  <div className={`p-2.5 rounded border ${bgClass} mt-1 mb-1 shadow-sm`}>
      <div className="text-[13px] font-bold text-gray-700 mb-0.5 uppercase tracking-wide">{label}</div>
      <div className={`text-lg font-extrabold text-right ${textClass}`}>{value}</div>
  </div>
);

const SectionHeader = ({ title, bgClass, textClass }: { title: string, bgClass: string, textClass: string }) => (
    <h4 className={`font-bold text-[13px] uppercase py-2 px-3 rounded-t mb-2 ${bgClass} ${textClass} border-b border-gray-200`}>
        {title}
    </h4>
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
      <div className="p-2.5 bg-gray-50 rounded border border-gray-200 space-y-1 mb-2">
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

interface ManufacturingOutputsEditorProps {
    outputs: ManufacturingOutput[];
    products: Product[];
    itemId: string;
    updateItem: (id: string, field: string, value: any) => void;
}

const ManufacturingOutputsEditor: React.FC<ManufacturingOutputsEditorProps> = ({ outputs, products, itemId, updateItem }) => {
    const seafoodProducts = products.filter(p => p.group === 'Thủy Sản');

    const addOutput = () => {
        const newOutput: ManufacturingOutput = {
            id: Date.now().toString(),
            productCode: '', // Start empty
            quantity: 0,
            sellingPriceVND: 0
        };
        updateItem(itemId, 'manufacturingOutputs', [...outputs, newOutput]);
    };

    const removeOutput = (outId: string) => {
        updateItem(itemId, 'manufacturingOutputs', outputs.filter(o => o.id !== outId));
    };

    const updateOutput = (outId: string, field: keyof ManufacturingOutput, value: any) => {
        const updatedOutputs = outputs.map(o => {
            if (o.id === outId) {
                return { ...o, [field]: value };
            }
            return o;
        });
        updateItem(itemId, 'manufacturingOutputs', updatedOutputs);
    };

    return (
        <div className="border border-gray-300 rounded p-2 bg-gray-50 space-y-2 mb-3">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[13px] font-bold text-gray-700">6. & 7. Chi tiết Hàng hóa & Giá bán</label>
                <button onClick={addOutput} className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center font-medium">
                    <PlusCircleIcon className="w-4 h-4 mr-1" /> Thêm
                </button>
            </div>
            
            {outputs.length === 0 && (
                <div className="text-center text-xs text-gray-500 italic py-2">Chưa có thành phẩm đầu ra.</div>
            )}

            {outputs.map((out, idx) => (
                <div key={out.id} className="bg-white p-2 rounded shadow-sm border border-gray-200 text-xs space-y-2">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1 mb-1">
                        <span className="font-bold text-gray-600">#{idx + 1}</span>
                        <button onClick={() => removeOutput(out.id)} className="text-red-500 hover:text-red-700">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <select 
                        className="w-full p-1 border border-gray-300 rounded text-xs mb-1"
                        value={out.productCode}
                        onChange={(e) => updateOutput(out.id, 'productCode', e.target.value)}
                    >
                        <option value="">-- Chọn sản phẩm --</option>
                        {seafoodProducts.map(p => (
                            <option key={p.code} value={p.code}>{p.nameVI} ({p.code})</option>
                        ))}
                    </select>
                    <div className="flex space-x-2">
                        <div className="w-1/2">
                            <FormattedNumberInput 
                                id={`out-qty-${out.id}`} 
                                label="SL (Kg)" 
                                value={out.quantity} 
                                onChange={(val) => updateOutput(out.id, 'quantity', val)} 
                            />
                        </div>
                        <div className="w-1/2">
                            <FormattedNumberInput 
                                id={`out-price-${out.id}`} 
                                label="Giá bán" 
                                value={out.sellingPriceVND} 
                                onChange={(val) => updateOutput(out.id, 'sellingPriceVND', val)} 
                            />
                        </div>
                    </div>
                    <div className="text-right text-gray-500 font-semibold">
                        = {formatCurrency(out.quantity * out.sellingPriceVND)}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Component for a single manufacturing cost line item
const ManufacturingCostItem = ({ 
    label, 
    id, 
    value, 
    onChange, 
    finishedGoodsQty 
}: { 
    label: string, 
    id: string, 
    value: number, 
    onChange: (val: number) => void,
    finishedGoodsQty: number
}) => (
    <div className="flex justify-between items-center text-[13px] border-b border-gray-100 py-1 last:border-0">
        <label htmlFor={id} className="text-gray-600 w-5/12 truncate" title={label}>{label}</label>
        <div className="w-3/12 px-1">
             <FormattedNumberInput
                srOnlyLabel
                id={id}
                label={label}
                value={value}
                onChange={onChange}
                decimalPlaces={2}
            />
        </div>
        <div className="w-4/12 text-right font-medium text-gray-900">
            {formatCurrency(value * finishedGoodsQty)}
        </div>
    </div>
);

// New Component for By-Product Item
const ByProductItem = ({ 
    label, 
    rateId, 
    priceId,
    rateValue, 
    priceValue, 
    onRateChange, 
    onPriceChange,
    inputQty 
}: { 
    label: string, 
    rateId: string, 
    priceId: string,
    rateValue: number, 
    priceValue: number, 
    onRateChange: (val: number) => void, 
    onPriceChange: (val: number) => void,
    inputQty: number
}) => {
    const qty = inputQty * (rateValue / 100);
    const revenue = qty * priceValue;

    return (
        <div className="flex justify-between items-center text-[13px] border-b border-gray-100 py-1 last:border-0">
            <div className="w-3/12 pr-1 truncate" title={label}>{label}</div>
            <div className="w-2/12 px-1">
                 <FormattedNumberInput
                    srOnlyLabel
                    id={rateId}
                    label="Tỷ lệ %"
                    value={rateValue}
                    onChange={onRateChange}
                    decimalPlaces={2}
                    addon="%"
                />
            </div>
            <div className="w-2/12 px-1 text-center text-xs text-gray-500 font-medium">
                {formatCurrency(qty)}
            </div>
            <div className="w-2/12 px-1">
                 <FormattedNumberInput
                    srOnlyLabel
                    id={priceId}
                    label="Giá bán"
                    value={priceValue}
                    onChange={onPriceChange}
                />
            </div>
            <div className="w-3/12 text-right font-medium text-green-700 text-xs">
                {formatCurrency(revenue)}
            </div>
        </div>
    );
};

export const PlanItemDetails: React.FC<PlanItemDetailsProps> = ({ 
    item, 
    products,
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
    setTotalMonthlyFinancialCost,
    totalMonthlyOtherIncome,
    setTotalMonthlyOtherIncome,
    totalMonthlyOtherExpenses,
    setTotalMonthlyOtherExpenses
}) => {
  const { id, userInput, calculated } = item;
  const isImport = userInput.type !== 'domestic' && userInput.type !== 'manufacturing';
  const isManufacturing = userInput.type === 'manufacturing';

  const getTypeLabel = () => {
      if (userInput.type === 'manufacturing') return 'Sản xuất Thủy Sản';
      if (userInput.type === 'domestic') return 'Hàng Nội địa';
      return 'Hàng Nhập khẩu';
  }

  const getTypeColorClass = () => {
      if (userInput.type === 'manufacturing') return 'bg-amber-100 text-amber-800';
      if (userInput.type === 'domestic') return 'bg-teal-100 text-teal-800';
      return 'bg-indigo-100 text-indigo-800';
  }

  return (
    <div className="p-2 bg-white border-t border-gray-200 sticky left-0 w-[95vw] md:static md:w-auto">
      {/* 
        Conditional Grid: 
        - 12 columns for Manufacturing (cols 1 & 2 take 2/12 each, rest take 2/12 each = equal distribution for 6 items)
        - 7 columns for Import/Domestic (Original)
      */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${isManufacturing ? 'xl:grid-cols-12' : 'xl:grid-cols-7'} gap-3`}>
        
        {/* Cột 1: Số lượng & Giá (Shared) - Widened for Manufacturing */}
        <div className={`flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full ${isManufacturing ? 'xl:col-span-2' : ''}`}>
          <SectionHeader title="Số lượng & Giá" bgClass="bg-blue-100" textClass="text-blue-800" />
          <div className="p-3 space-y-3 flex-1 text-[13px] overflow-y-auto max-h-[600px] lg:max-h-none">
            <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${getTypeColorClass()}`}>
                    {getTypeLabel()}
                </span>
            </div>
            <FormattedNumberInput
                id={`quantity-${id}`}
                label="1. Số lượng (Kg)"
                value={userInput.quantityInKg}
                onChange={(value) => updateItem(id, 'quantityInKg', value)}
                addon={<span>~{calculated.containers?.toFixed(2)}c</span>}
            />

            {isImport ? (
                <>
                    <FormattedNumberInput
                        id={`priceUSD-${id}`}
                        label="2. Giá mua (USD/tấn)"
                        value={userInput.priceUSDPerTon}
                        onChange={(value) => updateItem(id, 'priceUSDPerTon', value)}
                        decimalPlaces={2}
                    />
                    <DetailRow label="= Giá mua (VND/tấn)" value={formatCurrency(calculated.priceVNDPerTon)} />
                </>
            ) : (
                <FormattedNumberInput
                    id={`domesticPrice-${id}`}
                    label={isManufacturing ? "2. Giá mua nguyên liệu (VNĐ/kg)" : "2. Giá mua trong nước (VNĐ/kg)"}
                    value={userInput.domesticPurchasePriceVNDPerKg || 0}
                    onChange={(value) => updateItem(id, 'domesticPurchasePriceVNDPerKg', value)}
                    addon={isManufacturing ? undefined : "Có VAT"}
                />
            )}
            
            {isImport ? (
                 <HighlightBlock 
                    label="3. Tổng giá mua (Chưa VAT)"
                    value={formatCurrency(calculated.importValueVND)} 
                    bgClass="bg-orange-50 border-orange-200" 
                    textClass="text-orange-900"
                />
            ) : (
                <div className="p-2.5 rounded border bg-orange-50 border-orange-200 mt-1 mb-1 shadow-sm">
                    <div className="text-[13px] font-bold text-gray-700 mb-1 uppercase tracking-wide">3. Chi tiết giá</div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-gray-600">{isManufacturing ? 'Giá nguyên liệu chưa VAT:' : 'Giá mua chưa VAT:'}</span>
                            <span className="font-bold text-gray-900">{formatCurrency(calculated.importValueVND)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-gray-600">Thuế VAT đầu vào:</span>
                            <span className="font-bold text-gray-900">{formatCurrency(calculated.importVAT)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px] pt-1 border-t border-orange-200 mt-1">
                            <span className="text-gray-800 font-bold">{isManufacturing ? 'Tổng tiền nguyên liệu:' : 'Tổng tiền trả NCC:'}</span>
                            <span className="font-extrabold text-orange-900 text-base">
                                {formatCurrency((calculated.importValueVND || 0) + (calculated.importVAT || 0))}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
                <FormattedNumberInput
                    id={`importVatRate-${id}`}
                    label="4. VAT Mua (%)"
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

            {isManufacturing ? (
                <ManufacturingOutputsEditor 
                    outputs={userInput.manufacturingOutputs || []}
                    products={products}
                    itemId={id}
                    updateItem={updateItem}
                />
            ) : (
                <FormattedNumberInput
                    id={`priceVND-${id}`}
                    label="6. Giá bán (VND/kg)"
                    value={userInput.sellingPriceVNDPerKg}
                    onChange={(value) => updateItem(id, 'sellingPriceVNDPerKg', value)}
                    addon="có VAT"
                />
            )}

            <div className="pt-2 border-t mt-1 space-y-1">
                 <div className="font-bold text-gray-700 mb-1">{isManufacturing ? "8. Chi tiết doanh thu" : "7. Chi tiết doanh thu"}</div>
                 <DetailRow label="Doanh thu chưa thuế VAT" value={formatCurrency(calculated.totalRevenue)} />
                 <DetailRow label={`Thuế GTGT đầu ra (${userInput.outputVatRate ?? userInput.costs.importVatRate}%)`} value={formatCurrency(calculated.outputVAT)} />
                 
                 <HighlightBlock 
                    label="Tổng thu tiền" 
                    value={formatCurrency(calculated.totalRevenueInclVAT)} 
                    bgClass="bg-green-50 border-green-200" 
                    textClass="text-green-900"
                />
            </div>

            {/* MOVED: By-products Section to Column 1, below item 8 */}
            {isManufacturing && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                    <div className="flex justify-between items-center mb-1">
                        <div className="font-bold text-gray-700 text-[13px]">9. Phụ phẩm thu hồi:</div>
                        <div className="font-bold text-indigo-700 text-[13px]">{calculated.manufacturingCalculations?.totalByProductRecoveryRate?.toFixed(2)}%</div>
                    </div>
                    <div className="bg-green-50 rounded border border-green-200 p-2 space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-gray-500 border-b border-green-200 pb-1">
                            <span className="w-3/12">Loại</span>
                            <span className="w-2/12 text-center">Tỷ lệ</span>
                            <span className="w-2/12 text-center">SL(Kg)</span>
                            <span className="w-2/12 text-center">Giá</span>
                            <span className="w-3/12 text-right">Thu</span>
                        </div>
                        {userInput.manufacturingByProducts && (
                            <>
                                <ByProductItem label="9.1 Đầu+Xương" rateId={`bp-hb-r-${id}`} priceId={`bp-hb-p-${id}`} rateValue={userInput.manufacturingByProducts.headsBones.rate} priceValue={userInput.manufacturingByProducts.headsBones.price} onRateChange={v => updateItem(id, 'manufacturingByProducts.headsBones.rate', v)} onPriceChange={v => updateItem(id, 'manufacturingByProducts.headsBones.price', v)} inputQty={userInput.quantityInKg} />
                                <ByProductItem label="9.2 Da cá" rateId={`bp-sk-r-${id}`} priceId={`bp-sk-p-${id}`} rateValue={userInput.manufacturingByProducts.skin.rate} priceValue={userInput.manufacturingByProducts.skin.price} onRateChange={v => updateItem(id, 'manufacturingByProducts.skin.rate', v)} onPriceChange={v => updateItem(id, 'manufacturingByProducts.skin.price', v)} inputQty={userInput.quantityInKg} />
                                <ByProductItem label="9.3 Dè cá" rateId={`bp-tr-r-${id}`} priceId={`bp-tr-p-${id}`} rateValue={userInput.manufacturingByProducts.trimmings.rate} priceValue={userInput.manufacturingByProducts.trimmings.price} onRateChange={v => updateItem(id, 'manufacturingByProducts.trimmings.rate', v)} onPriceChange={v => updateItem(id, 'manufacturingByProducts.trimmings.price', v)} inputQty={userInput.quantityInKg} />
                                <ByProductItem label="9.4 Vụn đỏ" rateId={`bp-rm-r-${id}`} priceId={`bp-rm-p-${id}`} rateValue={userInput.manufacturingByProducts.redMeat.rate} priceValue={userInput.manufacturingByProducts.redMeat.price} onRateChange={v => updateItem(id, 'manufacturingByProducts.redMeat.rate', v)} onPriceChange={v => updateItem(id, 'manufacturingByProducts.redMeat.price', v)} inputQty={userInput.quantityInKg} />
                                <ByProductItem label="9.5 Vụn xô" rateId={`bp-bt-r-${id}`} priceId={`bp-bt-p-${id}`} rateValue={userInput.manufacturingByProducts.bulkTrimmings.rate} priceValue={userInput.manufacturingByProducts.bulkTrimmings.price} onRateChange={v => updateItem(id, 'manufacturingByProducts.bulkTrimmings.rate', v)} onPriceChange={v => updateItem(id, 'manufacturingByProducts.bulkTrimmings.price', v)} inputQty={userInput.quantityInKg} />
                                <ByProductItem label="9.6 Mỡ cá" rateId={`bp-ft-r-${id}`} priceId={`bp-ft-p-${id}`} rateValue={userInput.manufacturingByProducts.fat.rate} priceValue={userInput.manufacturingByProducts.fat.price} onRateChange={v => updateItem(id, 'manufacturingByProducts.fat.rate', v)} onPriceChange={v => updateItem(id, 'manufacturingByProducts.fat.price', v)} inputQty={userInput.quantityInKg} />
                            </>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-green-200 mt-1">
                            <span className="font-bold text-green-800 text-xs">Tổng thu (Có VAT)</span>
                            <span className="font-bold text-green-900 text-sm">{formatCurrency(calculated.manufacturingCalculations?.totalByProductRevenue)}</span>
                        </div>
                        <DetailRow label="Doanh thu chưa VAT" value={formatCurrency(calculated.manufacturingCalculations?.byProductRevenueExclVAT)} subText="Chia (1+VAT)" />
                        <DetailRow label={`Thuế GTGT đầu ra (${userInput.outputVatRate ?? userInput.costs.importVatRate}%)`} value={formatCurrency(calculated.manufacturingCalculations?.byProductOutputVAT)} />
                    </div>
                </div>
            )}

            {/* NEW: Section 10 Total Revenue Aggregates */}
            {isManufacturing && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                    <div className="font-bold text-gray-700 text-[13px] mb-1 uppercase">10. Tổng hợp doanh thu</div>
                    <div className="bg-indigo-50 rounded border border-indigo-200 p-2 space-y-1">
                        <DetailRow label="Tổng doanh thu (Chưa thuế)" value={formatCurrency(calculated.manufacturingCalculations?.totalRevenueExclVAT_All)} subText="Mục 8 + Mục 9" highlight />
                        <DetailRow label={`Tổng Thuế GTGT đầu ra (${userInput.outputVatRate ?? userInput.costs.importVatRate}%)`} value={formatCurrency(calculated.manufacturingCalculations?.totalOutputVAT_All)} subText="Mục 8 + Mục 9" />
                        <div className="flex justify-between items-center pt-2 border-t border-indigo-200 mt-1">
                            <span className="font-bold text-indigo-800 text-xs uppercase">Tổng thu tiền</span>
                            <span className="font-extrabold text-indigo-900 text-base">{formatCurrency(calculated.manufacturingCalculations?.totalRevenueInclVAT_All)}</span>
                        </div>
                    </div>
                </div>
            )}

          </div>
        </div>

        {/* Cột MỚI: 1. Định mức sản xuất (Only for Manufacturing) - Widened to 2 cols */}
        {isManufacturing && (
          <div className={`flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full xl:col-span-2`}>
            {/* ... rest of the column ... */}
            {/* Skipping full content to save response length, but content is preserved above */}
            <SectionHeader title="1. Định mức sản xuất" bgClass="bg-pink-100" textClass="text-pink-800" />
            <div className="p-3 space-y-2 flex-1 text-[13px] overflow-y-auto max-h-[600px] lg:max-h-none">
                <FormattedNumberInput
                    id={`batchNorm-${id}`}
                    label="1. Định mức SX toàn lô (Tỷ lệ)"
                    value={userInput.manufacturingCosts?.batchNorm || 1.80}
                    onChange={(val) => updateItem(id, 'manufacturingCosts.batchNorm', val)}
                    decimalPlaces={2}
                />
                
                {/* NEW: Detailed Norms Section */}
                <div className="bg-pink-50 p-2 rounded border border-pink-100 mb-2 space-y-2">
                    <h5 className="font-semibold text-pink-800 text-xs border-b border-pink-200 pb-1 mb-1">Chi tiết định mức (Tỷ lệ)</h5>
                    <div className="grid grid-cols-2 gap-2">
                        <FormattedNumberInput
                            id={`filletNorm-${id}`}
                            label="Định mức Fillet"
                            value={userInput.manufacturingCosts?.filletNorm || 1.85}
                            onChange={(val) => updateItem(id, 'manufacturingCosts.filletNorm', val)}
                            decimalPlaces={2}
                        />
                        <FormattedNumberInput
                            id={`skinningNorm-${id}`}
                            label="Định mức Lạng Da"
                            value={userInput.manufacturingCosts?.skinningNorm || 1.09}
                            onChange={(val) => updateItem(id, 'manufacturingCosts.skinningNorm', val)}
                            decimalPlaces={2}
                        />
                        <FormattedNumberInput
                            id={`shapingNorm-${id}`}
                            label="Định mức Tạo Hình"
                            value={userInput.manufacturingCosts?.shapingNorm || 1.40}
                            onChange={(val) => updateItem(id, 'manufacturingCosts.shapingNorm', val)}
                            decimalPlaces={2}
                        />
                        <FormattedNumberInput
                            id={`weightGain-${id}`}
                            label="Tăng Trọng"
                            value={userInput.manufacturingCosts?.weightGain || 0.65}
                            onChange={(val) => updateItem(id, 'manufacturingCosts.weightGain', val)}
                            decimalPlaces={2}
                        />
                    </div>
                </div>

                <div className="p-2 bg-pink-50 rounded border border-pink-200 mb-2">
                    <DetailRow label="2. Thành phẩm nhập kho" value={formatCurrency(calculated.manufacturingCalculations?.finishedGoodsQty)} />
                    <div className="text-xs text-gray-500 italic text-right mt-1">= Tổng mua / Định mức SX toàn lô</div>
                </div>

                <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-gray-700 text-[13px]">3. Chiết tính chi phí SX (cho 1kg TP):</div>
                    <div className="font-bold text-indigo-700 text-[13px]">{formatCurrency(calculated.manufacturingCalculations?.unitProductionCost)}</div>
                </div>
                <div className="bg-gray-50 rounded border border-gray-200 p-2 space-y-1 mb-2">
                    <div className="flex justify-between text-xs font-semibold text-gray-500 border-b border-gray-200 pb-1">
                        <span className="w-5/12">Khoản mục</span>
                        <span className="w-3/12 text-center">Đơn giá</span>
                        <span className="w-4/12 text-right">Thành tiền</span>
                    </div>
                    {userInput.manufacturingCosts && (
                        <>
                            <ManufacturingCostItem label="3.1 Nhân công" id={`mc-labor-${id}`} value={userInput.manufacturingCosts.laborCost} onChange={v => updateItem(id, 'manufacturingCosts.laborCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.2 Tiền cơm" id={`mc-meal-${id}`} value={userInput.manufacturingCosts.mealCost} onChange={v => updateItem(id, 'manufacturingCosts.mealCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.3 Điện nước" id={`mc-elec-${id}`} value={userInput.manufacturingCosts.electricityWaterCost} onChange={v => updateItem(id, 'manufacturingCosts.electricityWaterCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.4 Phụ gia" id={`mc-addit-${id}`} value={userInput.manufacturingCosts.additivesCost} onChange={v => updateItem(id, 'manufacturingCosts.additivesCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.5 Bao bì" id={`mc-pack-${id}`} value={userInput.manufacturingCosts.packagingCost} onChange={v => updateItem(id, 'manufacturingCosts.packagingCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.6 BHLĐ" id={`mc-safety-${id}`} value={userInput.manufacturingCosts.safetyGearCost} onChange={v => updateItem(id, 'manufacturingCosts.safetyGearCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.7 KH TSCĐ" id={`mc-depr-${id}`} value={userInput.manufacturingCosts.depreciationCost} onChange={v => updateItem(id, 'manufacturingCosts.depreciationCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.8 VPP" id={`mc-stat-${id}`} value={userInput.manufacturingCosts.stationeryCost} onChange={v => updateItem(id, 'manufacturingCosts.stationeryCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.9 CCDC" id={`mc-tools-${id}`} value={userInput.manufacturingCosts.toolsSuppliesCost} onChange={v => updateItem(id, 'manufacturingCosts.toolsSuppliesCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.10 BHXH" id={`mc-insur-${id}`} value={userInput.manufacturingCosts.insuranceCost} onChange={v => updateItem(id, 'manufacturingCosts.insuranceCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.11 Chứng từ" id={`mc-doc-${id}`} value={userInput.manufacturingCosts.documentCost} onChange={v => updateItem(id, 'manufacturingCosts.documentCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                            <ManufacturingCostItem label="3.12 Lưu kho/Cont" id={`mc-stor-${id}`} value={userInput.manufacturingCosts.storageCost} onChange={v => updateItem(id, 'manufacturingCosts.storageCost', v)} finishedGoodsQty={calculated.manufacturingCalculations?.finishedGoodsQty || 0} />
                        </>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-1">
                        <span className="font-bold text-gray-700 text-xs">Tổng CP SX trực tiếp</span>
                        <span className="font-bold text-gray-900 text-sm">{formatCurrency(calculated.manufacturingCalculations?.totalProductionCost)}</span>
                   </div>
                </div>
                
                {/* REMOVED: Summary block with "Tổng chi phí SX trực tiếp" and "GIÁ THÀNH SẢN XUẤT (NET)" */}
            </div>
          </div>
        )}

        {/* Cột: Chi phí thông quan & kho bãi (Renamed & Renumbered based on Type) */}
        <div className={`flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full ${isManufacturing ? 'xl:col-span-2' : ''}`}>
          {/* ... preserved content ... */}
          <SectionHeader 
            title={isManufacturing ? "2. Giá thành sản xuất (Tiếp)" : (isImport ? "1. CP Thông quan & Kho" : "1. CP Mua hàng & Lưu Kho")} 
            bgClass="bg-teal-100" 
            textClass="text-teal-800" 
          />
          <div className="p-3 space-y-3 flex-1 text-[13px] overflow-y-auto max-h-[600px] lg:max-h-none">
            <div className="flex justify-between items-center bg-teal-50 p-2 rounded mb-2">
              <span className="text-gray-700 font-semibold">Tổng cộng:</span>
              {/* UPDATED: Total for Manufacturing is now Direct Cost + Raw Material Cost */}
              <span className="font-bold text-teal-900">{formatCurrency(isManufacturing ? calculated.manufacturingCalculations?.totalManufacturingInvestment : calculated.totalClearanceAndLogisticsCost)}</span>
            </div>
            
            {/* Conditional Rendering for Import vs Domestic/Manufacturing */}
            {isImport ? (
                <>
                    <FormattedNumberInput id={`customsFee-${id}`} label="1.1 Phí Hải quan" value={userInput.costs.customsFee} onChange={value => updateItem(id, 'costs.customsFee', value)} />
                    <FormattedNumberInput id={`quarantineFee-${id}`} label="1.2 Phí kiểm dịch" value={userInput.costs.quarantineFee} onChange={value => updateItem(id, 'costs.quarantineFee', value)} />
                    <FormattedNumberInput id={`containerRentalFee-${id}`} label="1.3 Phí thuê Cont" value={userInput.costs.containerRentalFee} onChange={value => updateItem(id, 'costs.containerRentalFee', value)} />
                    <FormattedNumberInput id={`portStorageFee-${id}`} label="1.4 Phí lưu bãi" value={userInput.costs.portStorageFee} onChange={value => updateItem(id, 'costs.portStorageFee', value)} />
                    <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                        <label className="block font-semibold text-gray-700 mb-1">1.5 CP chung nhập kho</label>
                        <FormattedNumberInput srOnlyLabel label="Đơn giá" id={`generalWarehouseCostRate-${id}`} value={userInput.costs.generalWarehouseCostRatePerKg} onChange={value => updateItem(id, 'costs.generalWarehouseCostRatePerKg', value)} addon="đ/kg" />
                        <DetailRow label="Thành tiền" value={formatCurrency(calculated.generalWarehouseCost)} />
                    </div>
                </>
            ) : (
                !isManufacturing && (
                    <div className="text-xs text-gray-500 italic text-center p-1 bg-gray-50 rounded">
                        (Đã ẩn các chi phí nhập khẩu: Hải quan, Kiểm dịch, Thuê cont...)
                    </div>
                )
            )}

            {/* Shared Fields (Renumbered based on Type) */}
            <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
               {/* 
                 Renumbering Logic:
                 Import: 1.6, 1.7...
                 Domestic: 1.1, 1.2...
                 Manufacturing: 2.1, 2.2... (Since "1. Định mức" took slot 1)
               */}
               <label className="block font-semibold text-gray-700 mb-2">
                   {isManufacturing ? "2.1" : (isImport ? "1.6" : "1.1")} Chi phí lãi vay
               </label>
               
               {/* UPDATED: Manufacturing Interest Cost UI */}
               {isManufacturing && (
                   <div className="mb-2">
                        <DetailRow label="- Số tiền tính lãi" value={formatCurrency(calculated.manufacturingCalculations?.totalManufacturingInvestment)} subText="CP SX trực tiếp + Nguyên liệu" />
                   </div>
               )}

               <div className="mb-3">
                 <FormattedNumberInput label={isManufacturing ? "- Lãi suất" : "1. Lãi suất"} id={`loanInterestRate-${id}`} value={userInput.costs.loanInterestRatePerYear} onChange={value => updateItem(id, 'costs.loanInterestRatePerYear', value)} decimalPlaces={2} addon="%/năm" />
               </div>

               {isImport && (
                   <>
                    <div className="space-y-2 mb-3">
                        <p className="text-xs font-semibold text-gray-600 border-b border-gray-300 pb-1">Lần chuyển 1</p>
                        <FormattedNumberInput label="2. Số tiền chuyển lần 1" id={`loanFirstTransferUSD-${id}`} value={userInput.costs.loanFirstTransferUSD} onChange={value => updateItem(id, 'costs.loanFirstTransferUSD', value)} addon="USD" />
                        <DetailRow label="= Số tiền (VND)" value={formatCurrency(calculated.loanFirstTransferAmountVND)} />
                        
                        <div className="flex space-x-2 items-center">
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
                   </>
               )}

               <div className="mt-2 pt-2 border-t border-gray-300">
                   <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 text-sm">{isManufacturing ? "- Số tiền lãi" : (isImport ? "8. Tổng lãi vay" : "Tổng lãi vay")}</span>
                        <span className="font-extrabold text-indigo-700 text-base">{formatCurrency(calculated.importInterestCost)}</span>
                   </div>
               </div>
            </div>
           
            <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
               <label className="block font-semibold text-gray-700 mb-1">
                   {isManufacturing ? "2.2" : (isImport ? "1.7" : "1.2")} Lưu kho
               </label>
               <div className="flex space-x-2">
                   <FormattedNumberInput srOnlyLabel label="Số ngày" id={`postClearanceStorageDays-${id}`} value={userInput.costs.postClearanceStorageDays} onChange={value => updateItem(id, 'costs.postClearanceStorageDays', value)} addon="ngày" />
                   <FormattedNumberInput srOnlyLabel label="Đơn giá" id={`postClearanceStorageRate-${id}`} value={userInput.costs.postClearanceStorageRatePerKgDay} onChange={value => updateItem(id, 'costs.postClearanceStorageRatePerKgDay', value)} addon="đ/kg" />
               </div>
               <DetailRow label="Thành tiền" value={formatCurrency(calculated.postClearanceStorageCost)} />
            </div>
           
            <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
               <label className="block font-semibold text-gray-700 mb-1">
                   {isManufacturing ? "2.3" : (isImport ? "1.8" : "1.3")} DV mua hàng
               </label>
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
           
            <FormattedNumberInput 
                id={`buyerDeliveryFee-${id}`} 
                label={`${isManufacturing ? "2.4" : (isImport ? "1.9" : "1.4")} Vận chuyển`} 
                value={userInput.costs.buyerDeliveryFee} 
                onChange={value => updateItem(id, 'costs.buyerDeliveryFee', value)} 
            />
            <FormattedNumberInput 
                id={`otherInternationalCosts-${id}`} 
                label={`${isManufacturing ? "2.5" : (isImport ? "1.10" : "1.5")} CP khác`} 
                value={userInput.costs.otherInternationalCosts} 
                onChange={value => updateItem(id, 'costs.otherInternationalCosts', value)} 
            />
          </div>
        </div>

        {/* Cột: Chi phí Bán hàng */}
        <div className={`flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full ${isManufacturing ? 'xl:col-span-2' : ''}`}>
          <SectionHeader 
            title={isManufacturing ? "3. Chi phí Bán hàng" : "2. Chi phí Bán hàng"} 
            bgClass="bg-amber-100" 
            textClass="text-amber-800" 
          />
          <div className="p-3 space-y-3 flex-1 text-[13px]">
             <div className="flex justify-between items-center bg-amber-50 p-2 rounded mb-2">
              <span className="text-gray-700 font-semibold">Tổng cộng:</span>
              <span className="font-bold text-amber-900">{formatCurrency(calculated.totalSellingCost)}</span>
            </div>

            <div className="p-2.5 bg-gray-50 rounded border border-gray-200 space-y-2">
                <label className="block font-bold text-gray-700">
                    {isManufacturing ? "3.1" : "2.1"} Lương NV BH
                </label>
                <div className="flex justify-between items-center">
                    <label htmlFor={`sales-salary-rate-${id}`} className="text-gray-600">Tỷ lệ (% LN gộp):</label>
                    <div className="w-24">
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
            
            <FormattedNumberInput 
                id={`otherSellingCosts-${id}`} 
                label={isManufacturing ? "3.2 CP khác tại nơi bán" : "2.2 CP khác tại nơi bán"}
                value={userInput.costs.otherSellingCosts} 
                onChange={value => updateItem(id, 'costs.otherSellingCosts', value)} 
            />
          </div>
        </div>

        {/* Cột: Chi phí Quản lý DN */}
        <div className={`flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full ${isManufacturing ? 'xl:col-span-2' : ''}`}>
          <SectionHeader 
            title={isManufacturing ? "4. CP Quản lý DN" : "3. CP Quản lý DN"} 
            bgClass="bg-indigo-100" 
            textClass="text-indigo-800" 
          />
          <div className="p-3 space-y-3 flex-1 text-[13px] overflow-y-auto max-h-[600px] lg:max-h-none">
             <div className="flex justify-between items-center bg-indigo-50 p-2 rounded mb-2">
              <span className="text-gray-700 font-semibold">Tổng cộng:</span>
              <span className="font-bold text-indigo-900">{formatCurrency(calculated.totalGaCost)}</span>
            </div>

            <div className="p-2.5 bg-gray-50 rounded border border-gray-200 space-y-1 mb-2">
                <label className="block font-bold text-gray-700">
                    {isManufacturing ? "4.1" : "3.1"} Lương gián tiếp
                </label>
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

             <AllocatedCostBlock id={`rent-${id}`} label={isManufacturing ? "4.2 Thuê nhà" : "3.2 Thuê nhà"} totalMonthlyCost={totalMonthlyRent} setTotalMonthlyCost={setTotalMonthlyRent} allocatedCost={calculated.rent} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`electricity-${id}`} label={isManufacturing ? "4.3 Điện" : "3.3 Điện"} totalMonthlyCost={totalMonthlyElectricity} setTotalMonthlyCost={setTotalMonthlyElectricity} allocatedCost={calculated.electricity} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`water-${id}`} label={isManufacturing ? "4.4 Nước" : "3.4 Nước"} totalMonthlyCost={totalMonthlyWater} setTotalMonthlyCost={setTotalMonthlyWater} allocatedCost={calculated.water} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`stationery-${id}`} label={isManufacturing ? "4.5 VPP" : "3.5 VPP"} totalMonthlyCost={totalMonthlyStationery} setTotalMonthlyCost={setTotalMonthlyStationery} allocatedCost={calculated.stationery} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`depreciation-${id}`} label={isManufacturing ? "4.6 Khấu hao TSCĐ" : "3.6 Khấu hao TSCĐ"} totalMonthlyCost={totalMonthlyDepreciation} setTotalMonthlyCost={setTotalMonthlyDepreciation} allocatedCost={calculated.depreciation} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`externalServices-${id}`} label={isManufacturing ? "4.7 Dịch vụ ngoài" : "3.7 Dịch vụ ngoài"} totalMonthlyCost={totalMonthlyExternalServices} setTotalMonthlyCost={setTotalMonthlyExternalServices} allocatedCost={calculated.externalServices} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
             <AllocatedCostBlock id={`otherCashExpenses-${id}`} label={isManufacturing ? "4.8 Tiền khác" : "3.8 Tiền khác"} totalMonthlyCost={totalMonthlyOtherCashExpenses} setTotalMonthlyCost={setTotalMonthlyOtherCashExpenses} allocatedCost={calculated.otherCashExpenses} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
          </div>
        </div>

        {/* Cột: Chi phí Tài chính (For non-manufacturing, kept separate. For manufacturing, merged into next col) */}
        {!isManufacturing && (
            <div className="flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full">
            <SectionHeader 
                title="4. CP Tài chính" 
                bgClass="bg-rose-100" 
                textClass="text-rose-800" 
            />
            <div className="p-3 space-y-3 flex-1 text-[13px]">
                <div className="flex justify-between items-center bg-rose-50 p-2 rounded mb-2">
                <span className="text-gray-700 font-semibold">Tổng cộng:</span>
                <span className="font-bold text-rose-900">{formatCurrency(calculated.totalFinancialCost)}</span>
                </div>
                <AllocatedCostBlock id={`financialValuationCost-${id}`} label="4.1 CP định giá/khác" totalMonthlyCost={totalMonthlyFinancialCost} setTotalMonthlyCost={setTotalMonthlyFinancialCost} allocatedCost={calculated.financialValuationCost} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
            </div>
            </div>
        )}
        
        {/* Cột: Thu nhập & Chi phí khác (Merged with Financial for Manufacturing) */}
         <div className={`flex flex-col bg-white rounded border border-gray-300 shadow-sm h-full ${isManufacturing ? 'xl:col-span-2' : ''}`}>
          <SectionHeader 
            title={isManufacturing ? "5 & 6. Tài chính & Khác" : "5. Thu nhập & Chi phí khác"} 
            bgClass="bg-gray-100" 
            textClass="text-gray-800" 
          />
          <div className="p-3 space-y-3 flex-1 text-[13px]">
              {/* If Manufacturing, show Financial Cost here */}
              {isManufacturing && (
                  <div className="p-2.5 bg-rose-50 rounded border border-rose-200 mb-2">
                    <h5 className="font-bold text-rose-800 mb-2 border-b border-rose-200 pb-1">5. CP Tài chính</h5>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700 font-semibold">Tổng cộng:</span>
                        <span className="font-bold text-rose-900">{formatCurrency(calculated.totalFinancialCost)}</span>
                    </div>
                    <AllocatedCostBlock id={`financialValuationCost-${id}`} label="5.1 CP định giá/khác" totalMonthlyCost={totalMonthlyFinancialCost} setTotalMonthlyCost={setTotalMonthlyFinancialCost} allocatedCost={calculated.financialValuationCost} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
                  </div>
              )}

              {/* Other Income */}
              <div className="p-2.5 bg-green-50 rounded border border-green-200 mb-2">
                  <h5 className="font-bold text-green-800 mb-2 border-b border-green-200 pb-1">Thu nhập khác (711)</h5>
                  <AllocatedCostBlock id={`otherIncome-${id}`} label="Thu nhập khác" totalMonthlyCost={totalMonthlyOtherIncome} setTotalMonthlyCost={setTotalMonthlyOtherIncome} allocatedCost={calculated.otherIncome} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
              </div>

               {/* Other Expenses */}
              <div className="p-2.5 bg-red-50 rounded border border-red-200">
                  <h5 className="font-bold text-red-800 mb-2 border-b border-red-200 pb-1">Chi phí khác (811)</h5>
                  <AllocatedCostBlock id={`otherExpenses-${id}`} label="Chi phí khác" totalMonthlyCost={totalMonthlyOtherExpenses} setTotalMonthlyCost={setTotalMonthlyOtherExpenses} allocatedCost={calculated.otherExpenses} totalQuantityInKg={planTotals.totalQuantityInKg} itemQuantityInKg={userInput.quantityInKg} />
              </div>
          </div>
        </div>

      </div>
    </div>
  );
};
