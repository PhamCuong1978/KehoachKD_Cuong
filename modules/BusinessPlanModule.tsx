
import React, { useState, useEffect } from 'react';
import { SettingsPanel } from '../components/SettingsPanel';
import { ProductSelection } from '../components/ProductSelection';
import { PlanTable } from '../components/PlanTable';
import { PRODUCTS } from '../data/products';
import type { PlanItem, Product, AddProductDetails } from '../types';
import { recalculateEntirePlan } from '../utils/calculators';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { ReportGenerator } from '../components/ReportGenerator';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';
import { DocumentDownloadIcon } from '../components/icons/DocumentDownloadIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { AiAssistantModal } from '../components/AiAssistantModal';
import { AddProductModal } from '../components/AddProductModal';

const BusinessPlanModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem('businessPlanProducts');
      if (savedProducts) {
        return JSON.parse(savedProducts);
      }
    } catch (error) {
      console.error("Could not load products from localStorage", error);
    }
    return PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('businessPlanProducts', JSON.stringify(products));
    } catch (error) {
      console.error("Could not save products to localStorage", error);
    }
  }, [products]);

  const [uncalculatedPlanItems, setUncalculatedPlanItems] = useState<PlanItem[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  
  const [exchangeRateImport, setExchangeRateImport] = useState<number>(26356);
  const [exchangeRateTax, setExchangeRateTax] = useState<number>(26154);
  const [salesSalaryRate, setSalesSalaryRate] = useState<number>(20);
  const [totalMonthlyIndirectSalary, setTotalMonthlyIndirectSalary] = useState<number>(75000000);
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState<number>(24);
  
  // G&A and Financial Costs State
  const [totalMonthlyRent, setTotalMonthlyRent] = useState<number>(6000000);
  const [totalMonthlyElectricity, setTotalMonthlyElectricity] = useState<number>(2000000);
  const [totalMonthlyWater, setTotalMonthlyWater] = useState<number>(500000);
  const [totalMonthlyStationery, setTotalMonthlyStationery] = useState<number>(500000);
  const [totalMonthlyDepreciation, setTotalMonthlyDepreciation] = useState<number>(0);
  const [totalMonthlyExternalServices, setTotalMonthlyExternalServices] = useState<number>(1000000);
  const [totalMonthlyOtherCashExpenses, setTotalMonthlyOtherCashExpenses] = useState<number>(1000000);
  const [totalMonthlyFinancialCost, setTotalMonthlyFinancialCost] = useState<number>(0);

  const [selectedProductCode, setSelectedProductCode] = useState<string>(products.length > 0 ? products[0].code : '');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);


  const handleExport = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = 'products.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Không thể đọc file.');
        }
        const importedProducts = JSON.parse(text);

        if (Array.isArray(importedProducts) && (importedProducts.length === 0 || (
            'code' in importedProducts[0] && 
            'nameVI' in importedProducts[0] && 
            'brand' in importedProducts[0] &&
            'defaultWeightKg' in importedProducts[0]
            ))) {
          setProducts(importedProducts);
          alert(`Tải lên thành công ${importedProducts.length} sản phẩm!`);
        } else {
          throw new Error('Định dạng file không hợp lệ. Vui lòng kiểm tra lại file JSON.');
        }
      } catch (error) {
        alert(`Lỗi khi xử lý file: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const addNewProduct = (newProduct: Product) => {
    if (products.some(p => p.code.toLowerCase() === newProduct.code.toLowerCase())) {
      alert(`Lỗi: Mã sản phẩm "${newProduct.code}" đã tồn tại.`);
      return;
    }
    const updatedProducts = [...products, newProduct].sort((a, b) => a.brand.localeCompare(b.brand) || a.nameVI.localeCompare(b.nameVI));
    setProducts(updatedProducts);
    setSelectedProductCode(newProduct.code);
    setIsAddProductModalOpen(false);
  };


  useEffect(() => {
    const calculatedItems = recalculateEntirePlan(uncalculatedPlanItems, {
      importRate: exchangeRateImport,
      taxRate: exchangeRateTax,
      salesSalaryRate: salesSalaryRate,
      totalMonthlyIndirectSalary: totalMonthlyIndirectSalary,
      totalMonthlyRent,
      totalMonthlyElectricity,
      totalMonthlyWater,
      totalMonthlyStationery,
      totalMonthlyDepreciation,
      totalMonthlyExternalServices,
      totalMonthlyOtherCashExpenses,
      totalMonthlyFinancialCost,
    });
    setPlanItems(calculatedItems);
  }, [
      uncalculatedPlanItems, exchangeRateImport, exchangeRateTax, salesSalaryRate, totalMonthlyIndirectSalary,
      totalMonthlyRent, totalMonthlyElectricity, totalMonthlyWater, totalMonthlyStationery,
      totalMonthlyDepreciation, totalMonthlyExternalServices, totalMonthlyOtherCashExpenses,
      totalMonthlyFinancialCost
  ]);

  const addProductToPlan = (details: AddProductDetails) => {
    const productToAdd = products.find(p => p.code === details.productCode);
    if (productToAdd) {
      const uniqueId = `${productToAdd.code}-${new Date().getTime()}`;
      if (!planItems.some(item => item.id === uniqueId)) {
        const newItem: PlanItem = {
          id: uniqueId,
          ...productToAdd,
          userInput: {
            priceUSDPerTon: details.priceUSDPerTon,
            sellingPriceVNDPerKg: details.sellingPriceVNDPerKg,
            quantityInKg: details.quantityInKg,
            outputVatRate: 5, // Default Output VAT Rate
            costs: {
              customsFee: 0,
              quarantineFee: 0,
              containerRentalFee: 0,
              portStorageFee: 0,
              generalWarehouseCostRatePerKg: 1300,
              loanInterestRatePerYear: 8,
              loanFirstTransferUSD: 10000,
              loanFirstTransferInterestDays: 30,
              postClearanceStorageDays: 20,
              postClearanceStorageRatePerKgDay: 150,
              importVatRate: 5,
              purchasingServiceFeeInMillionsPerCont: 5,
              buyerDeliveryFee: 0,
              otherInternationalCosts: 0,
              otherSellingCosts: 0,
            }
          },
          calculated: {},
        };
        
        setUncalculatedPlanItems(prevItems => [...prevItems, newItem]);
      }
    }
  };

  const updatePlanItem = (id: string, field: string, value: number) => {
    setUncalculatedPlanItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = JSON.parse(JSON.stringify(item));
          if (field.startsWith('costs.')) {
            const costField = field.split('.')[1] as keyof PlanItem['userInput']['costs'];
            updatedItem.userInput.costs[costField] = value;
          } else {
            const topLevelField = field as keyof Omit<PlanItem['userInput'], 'costs'>;
            updatedItem.userInput[topLevelField] = value;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };
  
  const removePlanItem = (id: string) => {
    setUncalculatedPlanItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const planTotals = planItems.reduce(
    (acc, item) => {
      acc.totalGrossProfit += item.calculated.grossProfit || 0;
      acc.totalQuantityInKg += item.userInput.quantityInKg || 0;
      return acc;
    },
    { totalGrossProfit: 0, totalQuantityInKg: 0 }
  );

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 mb-6">
          <SettingsPanel
            exchangeRateImport={exchangeRateImport}
            setExchangeRateImport={setExchangeRateImport}
            exchangeRateTax={exchangeRateTax}
            setExchangeRateTax={setExchangeRateTax}
            salesSalaryRate={salesSalaryRate}
            setSalesSalaryRate={setSalesSalaryRate}
          />
          <ProductSelection
            products={products}
            selectedProductCode={selectedProductCode}
            setSelectedProductCode={setSelectedProductCode}
            addProductToPlan={addProductToPlan}
            onAddNewProduct={() => setIsAddProductModalOpen(true)}
          />
        </div>

        {planItems.length > 0 ? (
          <PlanTable 
            items={planItems} 
            updateItem={updatePlanItem} 
            removeItem={removePlanItem} 
            planTotals={planTotals}
            salesSalaryRate={salesSalaryRate}
            setSalesSalaryRate={setSalesSalaryRate}
            totalMonthlyIndirectSalary={totalMonthlyIndirectSalary}
            setTotalMonthlyIndirectSalary={setTotalMonthlyIndirectSalary}
            workingDaysPerMonth={workingDaysPerMonth}
            setWorkingDaysPerMonth={setWorkingDaysPerMonth}
            totalMonthlyRent={totalMonthlyRent}
            setTotalMonthlyRent={setTotalMonthlyRent}
            totalMonthlyElectricity={totalMonthlyElectricity}
            setTotalMonthlyElectricity={setTotalMonthlyElectricity}
            totalMonthlyWater={totalMonthlyWater}
            setTotalMonthlyWater={setTotalMonthlyWater}
            totalMonthlyStationery={totalMonthlyStationery}
            setTotalMonthlyStationery={setTotalMonthlyStationery}
            totalMonthlyDepreciation={totalMonthlyDepreciation}
            setTotalMonthlyDepreciation={setTotalMonthlyDepreciation}
            totalMonthlyExternalServices={totalMonthlyExternalServices}
            setTotalMonthlyExternalServices={setTotalMonthlyExternalServices}
            totalMonthlyOtherCashExpenses={totalMonthlyOtherCashExpenses}
            setTotalMonthlyOtherCashExpenses={setTotalMonthlyOtherCashExpenses}
            totalMonthlyFinancialCost={totalMonthlyFinancialCost}
            setTotalMonthlyFinancialCost={setTotalMonthlyFinancialCost}
          />
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md border border-gray-200">
            <PlusCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có sản phẩm nào trong kế hoạch</h3>
            <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách chọn một sản phẩm và thêm vào kế hoạch kinh doanh của bạn.</p>
          </div>
        )}

        <div className="mt-6">
          <ReportGenerator
            items={planItems}
            exchangeRateImport={exchangeRateImport}
            exchangeRateTax={exchangeRateTax}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        </div>

        <div className="mt-6">
            <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <DatabaseIcon className="h-5 w-5 mr-2 text-gray-500" />
                Quản lý dữ liệu sản phẩm
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Tải xuống danh sách sản phẩm hiện tại hoặc tải lên danh sách mới từ file JSON để cập nhật.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button 
                  onClick={handleExport}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <DocumentDownloadIcon className="h-5 w-5 mr-2" />
                  Xuất file JSON
                </button>
                
                <label 
                  htmlFor="import-json" 
                  className="w-full cursor-pointer flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <UploadIcon className="h-5 w-5 mr-2" />
                  Nhập file JSON
                </label>
                <input
                  id="import-json"
                  type="file"
                  className="hidden"
                  accept=".json,application/json"
                  onChange={handleImport}
                />
              </div>
            </div>
        </div>
      </div>
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        products={products}
        planItems={planItems}
        updatePlanItem={updatePlanItem}
        removePlanItem={removePlanItem}
        addProductToPlan={addProductToPlan}
        setters={{
          setExchangeRateImport,
          setExchangeRateTax,
          setSalesSalaryRate,
          setTotalMonthlyIndirectSalary,
          setWorkingDaysPerMonth,
          setTotalMonthlyRent,
          setTotalMonthlyElectricity,
          setTotalMonthlyWater,
          setTotalMonthlyStationery,
          setTotalMonthlyDepreciation,
          setTotalMonthlyExternalServices,
          setTotalMonthlyOtherCashExpenses,
          setTotalMonthlyFinancialCost,
        }}
      />
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSave={addNewProduct}
      />
    </>
  );
};

export default BusinessPlanModule;