
import type { PlanItem } from '../types';

interface PlanRates {
  importRate: number;
  taxRate: number;
  salesSalaryRate: number;
  totalMonthlyIndirectSalary: number;
  totalMonthlyRent: number;
  totalMonthlyElectricity: number;
  totalMonthlyWater: number;
  totalMonthlyStationery: number;
  totalMonthlyDepreciation: number;
  totalMonthlyExternalServices: number;
  totalMonthlyOtherCashExpenses: number;
  totalMonthlyFinancialCost: number;
  totalMonthlyOtherIncome: number;
  totalMonthlyOtherExpenses: number;
}

// Constants from user requirements
const CORP_INCOME_TAX_RATE = 0.20;

// Profit distribution constants
const PROVISION_RATE = 0.10;
const BUSINESS_CAPITAL_RATE = 0.60;
const DIVIDEND_RATE = 0.30;


/**
 * First calculation pass: computes metrics that do not depend on plan-wide totals.
 * This includes import costs, COGS, revenue, and gross profit for a single item.
 */
function calculatePreTotals(item: PlanItem, rates: PlanRates): PlanItem {
  const { defaultWeightKg, userInput } = item;
  const { costs, quantityInKg, type = 'import' } = userInput;
  // Treat Manufacturing same as Domestic for basic calculation structure (using VND base price)
  const isLocal = type === 'domestic' || type === 'manufacturing';
  const isManufacturing = type === 'manufacturing';
  
  const importVatRate = (costs.importVatRate || 0) / 100;
  // Use userInput.outputVatRate if present, otherwise fall back to importVatRate (legacy behavior)
  const outputVatRate = (userInput.outputVatRate !== undefined ? userInput.outputVatRate : (costs.importVatRate || 0)) / 100;

  const containers = quantityInKg > 0 && defaultWeightKg > 0 ? quantityInKg / defaultWeightKg : 0;
  
  // --- VALUE CALCULATION ---
  let importValueUSD = 0;
  let importValueVND = 0; // Represents Base Cost (excl VAT) for Domestic/Manufacturing
  let importVAT = 0;
  let priceUSDPerKg = 0;
  let priceVNDPerTon = 0;

  if (isLocal) {
      // Domestic/Manufacturing Calculation
      const domesticPriceInclVAT = userInput.domesticPurchasePriceVNDPerKg || 0;
      const domesticPriceExclVAT = domesticPriceInclVAT / (1 + importVatRate);
      
      importValueVND = domesticPriceExclVAT * quantityInKg;
      importVAT = importValueVND * importVatRate;
      priceVNDPerTon = domesticPriceExclVAT * 1000; // Just for consistency
  } else {
      // Import Calculation
      priceUSDPerKg = userInput.priceUSDPerTon / 1000;
      importValueUSD = quantityInKg * priceUSDPerKg;
      importValueVND = importValueUSD * rates.importRate;
      importVAT = quantityInKg * priceUSDPerKg * rates.taxRate * importVatRate;
      priceVNDPerTon = userInput.priceUSDPerTon * rates.importRate;
  }

  // --- MANUFACTURING SPECIFIC CALCULATIONS ---
  let finishedGoodsQty = 0;
  let totalProductionCost = 0;
  let totalManufacturingInvestment = 0;
  let totalByProductRevenue = 0; // Incl VAT
  let netProductionCost = 0;
  
  // New calculated fields for By-products (Section 9)
  let byProductRevenueExclVAT = 0;
  let byProductOutputVAT = 0;

  if (isManufacturing) {
      const mfgCosts = userInput.manufacturingCosts || {
          batchNorm: 1,
          laborCost: 0, mealCost: 0, electricityWaterCost: 0, additivesCost: 0,
          packagingCost: 0, safetyGearCost: 0, depreciationCost: 0, stationeryCost: 0,
          toolsSuppliesCost: 0, insuranceCost: 0, documentCost: 0, storageCost: 0
      };

      // 2. Thành phẩm nhập kho = Tổng số lượng mua vào / Định mức toàn lô
      // Avoid division by zero
      const norm = mfgCosts.batchNorm > 0 ? mfgCosts.batchNorm : 1;
      finishedGoodsQty = quantityInKg / norm;

      // Calculate Direct Production Cost based on Finished Goods Qty
      const unitCostSum = 
          mfgCosts.laborCost + 
          mfgCosts.mealCost + 
          mfgCosts.electricityWaterCost + 
          mfgCosts.additivesCost + 
          mfgCosts.packagingCost + 
          mfgCosts.safetyGearCost + 
          mfgCosts.depreciationCost + 
          mfgCosts.stationeryCost + 
          mfgCosts.toolsSuppliesCost + 
          mfgCosts.insuranceCost + 
          mfgCosts.documentCost + 
          mfgCosts.storageCost;
      
      totalProductionCost = unitCostSum * finishedGoodsQty;
      
      // Total Manufacturing Investment (Aggregate for Interest & Summary) = Direct Costs + Material Cost (Excl VAT)
      totalManufacturingInvestment = totalProductionCost + importValueVND;

      // 4. By-Products Revenue Calculation
      if (userInput.manufacturingByProducts) {
          const bp = userInput.manufacturingByProducts;
          const calcByProduct = (rate: number, price: number) => (quantityInKg * (rate / 100)) * price;
          
          totalByProductRevenue = 
              calcByProduct(bp.headsBones.rate, bp.headsBones.price) +
              calcByProduct(bp.skin.rate, bp.skin.price) +
              calcByProduct(bp.trimmings.rate, bp.trimmings.price) +
              calcByProduct(bp.redMeat.rate, bp.redMeat.price) +
              calcByProduct(bp.bulkTrimmings.rate, bp.bulkTrimmings.price) +
              calcByProduct(bp.fat.rate, bp.fat.price);
          
          // Calculate By-Product VAT details
          byProductRevenueExclVAT = totalByProductRevenue / (1 + outputVatRate);
          byProductOutputVAT = totalByProductRevenue - byProductRevenueExclVAT;
      }
      
      // Net Production Cost (Reducing COGS)
      // Cost = Material + Direct Costs - ByProduct Revenue
      netProductionCost = totalProductionCost - totalByProductRevenue;
  }

  // Revenue Calculation Logic
  let totalRevenueInclVAT = 0;
  let totalRevenue = 0; // Excl VAT
  let sellingPriceExclVAT = 0;

  if (isManufacturing && userInput.manufacturingOutputs && userInput.manufacturingOutputs.length > 0) {
      // For Manufacturing, sum up all output products: Quantity * Price (Assuming inputs are Incl VAT)
      totalRevenueInclVAT = userInput.manufacturingOutputs.reduce((sum, output) => {
          return sum + (output.quantity * output.sellingPriceVND);
      }, 0);
      
      // Calculate Revenue Excl VAT
      // Default basic revenue calculation
      const basicRevenueExclVAT = totalRevenueInclVAT / (1 + outputVatRate);
      
      // Virtual Selling Price per Kg of Raw Material (for reference/display only)
      if (quantityInKg > 0) {
          userInput.sellingPriceVNDPerKg = totalRevenueInclVAT / quantityInKg;
          sellingPriceExclVAT = basicRevenueExclVAT / quantityInKg;
      }
      
      // For calculation flow, we start with basic, but will override below for "totalRevenue" used in reporting
      totalRevenue = basicRevenueExclVAT; 
  } else {
      // Standard calculation
      totalRevenueInclVAT = userInput.sellingPriceVNDPerKg * quantityInKg;
      sellingPriceExclVAT = userInput.sellingPriceVNDPerKg / (1 + outputVatRate);
      totalRevenue = sellingPriceExclVAT * quantityInKg;
  }

  // --- TOTAL AGGREGATES FOR SECTION 10 (Manufacturing) ---
  let totalRevenueExclVAT_All = totalRevenue;
  let totalOutputVAT_All = 0;
  let totalRevenueInclVAT_All = totalRevenueInclVAT;

  // Output VAT for main products
  const mainOutputVAT = totalRevenueInclVAT - totalRevenue;

  if (isManufacturing) {
      // Add By-products to totals
      totalRevenueExclVAT_All = totalRevenue + byProductRevenueExclVAT;
      totalOutputVAT_All = mainOutputVAT + byProductOutputVAT;
      totalRevenueInclVAT_All = totalRevenueInclVAT + totalByProductRevenue;
      
      // *** CRITICAL UPDATE ***
      // For Manufacturing, the Total Revenue used in the report (Row 01) should be the Aggregate (Main + ByProduct)
      totalRevenue = totalRevenueExclVAT_All;
  } else {
      totalOutputVAT_All = mainOutputVAT;
  }

  // --- COSTS CALCULATION ---
  
  // Interest Calculation
  const dailyInterestRate = (costs.loanInterestRatePerYear / 100) / 365;
  let importInterestCost = 0;
  let loanFirstTransferAmountVND = 0;
  let loanInterestCostFirstTransfer = 0;
  let loanSecondTransferAmountVND = 0;
  let loanInterestCostSecondTransfer = 0;
  let vatLoanInterestCost = 0;

  if (isManufacturing) {
      // Manufacturing Interest is based on Total Manufacturing Investment (Direct Costs + Material)
      const principal = totalManufacturingInvestment; 
      importInterestCost = principal * dailyInterestRate * costs.postClearanceStorageDays;
  } else if (isLocal) {
      // Domestic Interest is based on Purchase Value
      const totalPurchaseValueInclVAT = (userInput.domesticPurchasePriceVNDPerKg || 0) * quantityInKg;
      importInterestCost = totalPurchaseValueInclVAT * dailyInterestRate * costs.postClearanceStorageDays;
  } else {
      // Import Interest Logic
      loanFirstTransferAmountVND = costs.loanFirstTransferUSD * rates.importRate;
      loanInterestCostFirstTransfer = loanFirstTransferAmountVND * dailyInterestRate * costs.loanFirstTransferInterestDays;
      loanSecondTransferAmountVND = Math.max(0, importValueVND - loanFirstTransferAmountVND);
      loanInterestCostSecondTransfer = loanSecondTransferAmountVND * dailyInterestRate * costs.postClearanceStorageDays;
      vatLoanInterestCost = importVAT > 0 ? importVAT * dailyInterestRate * costs.postClearanceStorageDays : 0;
      importInterestCost = loanInterestCostFirstTransfer + loanInterestCostSecondTransfer + vatLoanInterestCost;
  }

  const generalWarehouseCost = quantityInKg * costs.generalWarehouseCostRatePerKg;
  const postClearanceStorageCost = quantityInKg * costs.postClearanceStorageDays * costs.postClearanceStorageRatePerKgDay;
  const purchasingServiceFee = containers * costs.purchasingServiceFeeInMillionsPerCont * 1000000;
  const otherInternationalPurchaseCost = costs.otherInternationalCosts;
  
  // NOTE: otherExpenses and otherIncome are now calculated in PostTotals via allocation.
  // We initialize them to 0 here to ensure the structure exists.
  const otherExpenses = 0; 
  const otherIncome = 0; 

  let totalClearanceAndLogisticsCost = 0;
  
  if (isManufacturing) {
      // *** CRITICAL UPDATE ***
      // For Manufacturing, this cost bucket (Row 11b in report) must include Direct Production Cost
      // Formula: Total Production Cost + Interest + Storage + Purchasing Fee + Delivery + Other
      totalClearanceAndLogisticsCost = 
          totalProductionCost +
          importInterestCost + 
          postClearanceStorageCost +
          purchasingServiceFee + 
          costs.buyerDeliveryFee + 
          otherInternationalPurchaseCost;
  } else if (isLocal) {
      totalClearanceAndLogisticsCost = 
          importInterestCost + 
          postClearanceStorageCost +
          purchasingServiceFee + 
          costs.buyerDeliveryFee + 
          otherInternationalPurchaseCost;
  } else {
      totalClearanceAndLogisticsCost =
        costs.customsFee + costs.quarantineFee + costs.containerRentalFee + costs.portStorageFee +
        generalWarehouseCost + importInterestCost + postClearanceStorageCost +
        purchasingServiceFee + costs.buyerDeliveryFee + otherInternationalPurchaseCost;
  }
  
  let totalCOGS = 0;
  if (isManufacturing) {
      // Since Revenue is Gross (Main + ByProduct), COGS must be Gross (Material + Production)
      // totalClearanceAndLogisticsCost now includes totalProductionCost
      totalCOGS = importValueVND + totalClearanceAndLogisticsCost;
  } else {
      totalCOGS = importValueVND + totalClearanceAndLogisticsCost + netProductionCost; // netProductionCost is 0 for non-mfg
  }
  
  const grossProfit = totalRevenue - totalCOGS;

  item.calculated = {
    ...item.calculated,
    containers,
    priceUSDPerKg,
    importValueUSD,
    importValueVND,
    importVAT,
    priceVNDPerTon,
    totalRevenueInclVAT,
    manufacturingCalculations: {
        finishedGoodsQty,
        totalProductionCost,
        totalManufacturingInvestment,
        totalByProductRevenue,
        netProductionCost,
        byProductRevenueExclVAT, 
        byProductOutputVAT,      
        totalRevenueExclVAT_All, 
        totalOutputVAT_All,      
        totalRevenueInclVAT_All  
    },
    totalClearanceAndLogisticsCost,
    generalWarehouseCost,
    importInterestCost,
    loanFirstTransferAmountVND,
    loanInterestCostFirstTransfer,
    loanSecondTransferAmountVND,
    loanInterestCostSecondTransfer,
    vatLoanInterestCost,
    postClearanceStorageCost,
    purchasingServiceFee,
    otherInternationalPurchaseCost,
    otherIncome,
    otherExpenses,
    sellingPriceExclVAT,
    totalRevenue,
    totalCOGS,
    grossProfit
  };

  return item;
}

/**
 * Second calculation pass: computes metrics that depend on plan-wide totals,
 * such as the allocated sales salary.
 */
function calculatePostTotals(item: PlanItem, totals: { totalGrossProfit: number; totalQuantityInKg: number; }, rates: PlanRates): PlanItem {
  const { userInput } = item;
  const { costs, quantityInKg } = userInput;
  
  const totalSalesSalary = totals.totalGrossProfit * (rates.salesSalaryRate / 100);
  
  const createAllocator = (totalCost: number) => {
    return totals.totalQuantityInKg > 0 ? totalCost * (quantityInKg / totals.totalQuantityInKg) : 0;
  };
  
  const allocatedSalesSalary = createAllocator(totalSalesSalary);
  const allocatedIndirectSalary = createAllocator(rates.totalMonthlyIndirectSalary);
  const allocatedRent = createAllocator(rates.totalMonthlyRent);
  const allocatedElectricity = createAllocator(rates.totalMonthlyElectricity);
  const allocatedWater = createAllocator(rates.totalMonthlyWater);
  const allocatedStationery = createAllocator(rates.totalMonthlyStationery);
  const allocatedDepreciation = createAllocator(rates.totalMonthlyDepreciation);
  const allocatedExternalServices = createAllocator(rates.totalMonthlyExternalServices);
  const allocatedOtherCashExpenses = createAllocator(rates.totalMonthlyOtherCashExpenses);
  const allocatedFinancialCost = createAllocator(rates.totalMonthlyFinancialCost);
  
  // New Allocation for Other Income and Other Expenses
  const allocatedOtherIncome = createAllocator(rates.totalMonthlyOtherIncome);
  const allocatedOtherExpenses = createAllocator(rates.totalMonthlyOtherExpenses);

  const totalSellingCost = allocatedSalesSalary + costs.otherSellingCosts;

  const totalGaCost =
    allocatedIndirectSalary + allocatedRent + allocatedElectricity + allocatedWater + allocatedStationery +
    allocatedDepreciation + allocatedExternalServices + allocatedOtherCashExpenses;
  
  const totalFinancialCost = allocatedFinancialCost;
  
  const otherExpenses = allocatedOtherExpenses;
  const otherIncome = allocatedOtherIncome;

  // Use the totalOutputVAT calculated in PreTotals (which includes by-products for Mfg)
  const outputVAT = item.calculated.manufacturingCalculations?.totalOutputVAT_All ?? ((item.calculated.totalRevenueInclVAT ?? 0) - (item.calculated.totalRevenue ?? 0));
  
  const vatPayable = outputVAT - (item.calculated.importVAT ?? 0);
  const cogsPerKg = quantityInKg > 0 ? (item.calculated.totalCOGS ?? 0) / quantityInKg : 0;
  const totalOperatingCost = totalSellingCost + totalGaCost;
  
  // Total Pre Tax Cost includes: COGS, Operating (Selling + G&A), Financial, and Other (811)
  const totalPreTaxCost = (item.calculated.totalCOGS ?? 0) + totalOperatingCost + totalFinancialCost + otherExpenses;
  
  // Profit Before Tax = Revenue + Other Income - Total Cost
  const profitBeforeTax = (item.calculated.totalRevenue ?? 0) - totalPreTaxCost + otherIncome;
  
  const corporateIncomeTax = profitBeforeTax * CORP_INCOME_TAX_RATE;
  
  const netProfit = profitBeforeTax - corporateIncomeTax;
  const totalTaxPayable = corporateIncomeTax + (vatPayable ?? 0);

  const retainedForProvision = netProfit > 0 ? netProfit * PROVISION_RATE : 0;
  const retainedForBusiness = netProfit > 0 ? netProfit * BUSINESS_CAPITAL_RATE : 0;
  const dividends = netProfit > 0 ? netProfit * DIVIDEND_RATE : 0;

  item.calculated = {
    ...item.calculated,
    salesStaffSalary: allocatedSalesSalary,
    indirectStaffSalary: allocatedIndirectSalary,
    rent: allocatedRent,
    electricity: allocatedElectricity,
    water: allocatedWater,
    stationery: allocatedStationery,
    depreciation: allocatedDepreciation,
    externalServices: allocatedExternalServices,
    otherCashExpenses: allocatedOtherCashExpenses,
    financialValuationCost: allocatedFinancialCost,
    otherIncome: allocatedOtherIncome, // Updated to allocated value
    otherExpenses: allocatedOtherExpenses, // Updated to allocated value
    totalSellingCost,
    totalGaCost,
    totalFinancialCost,
    outputVAT,
    vatPayable,
    cogsPerKg,
    totalOperatingCost,
    totalPreTaxCost,
    profitBeforeTax,
    corporateIncomeTax,
    netProfit,
    totalTaxPayable,
    retainedForProvision,
    retainedForBusiness,
    dividends,
  };
  return item;
}

/**
 * Main calculation function. Recalculates all metrics for the entire plan.
 * This is necessary because some metrics (like sales salary) depend on totals from all items.
 */
export function recalculateEntirePlan(items: PlanItem[], rates: PlanRates): PlanItem[] {
  if (items.length === 0) return [];

  // 1. First pass to calculate values needed for totals
  const preCalculatedItems = items.map(item => calculatePreTotals(JSON.parse(JSON.stringify(item)), rates));

  // 2. Calculate totals
  const totals = preCalculatedItems.reduce((acc, item) => {
    acc.totalGrossProfit += item.calculated.grossProfit || 0;
    acc.totalQuantityInKg += item.userInput.quantityInKg || 0;
    return acc;
  }, { totalGrossProfit: 0, totalQuantityInKg: 0 });

  // 3. Second pass to calculate final values based on totals
  const finalItems = preCalculatedItems.map(item => calculatePostTotals(item, totals, rates));

  return finalItems;
}
