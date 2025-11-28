
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
  const isDomestic = type === 'domestic';
  
  const importVatRate = (costs.importVatRate || 0) / 100;
  // Use userInput.outputVatRate if present, otherwise fall back to importVatRate (legacy behavior)
  const outputVatRate = (userInput.outputVatRate !== undefined ? userInput.outputVatRate : (costs.importVatRate || 0)) / 100;

  const containers = quantityInKg > 0 && defaultWeightKg > 0 ? quantityInKg / defaultWeightKg : 0;
  
  // --- VALUE CALCULATION ---
  let importValueUSD = 0;
  let importValueVND = 0; // Represents Base Cost (excl VAT) for Domestic
  let importVAT = 0;
  let priceUSDPerKg = 0;
  let priceVNDPerTon = 0;

  if (isDomestic) {
      // Domestic Calculation
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

  const totalRevenueInclVAT = userInput.sellingPriceVNDPerKg * quantityInKg;

  // --- COSTS CALCULATION ---
  
  // Interest Calculation
  const dailyInterestRate = (costs.loanInterestRatePerYear / 100) / 365;
  let importInterestCost = 0;
  let loanFirstTransferAmountVND = 0;
  let loanInterestCostFirstTransfer = 0;
  let loanSecondTransferAmountVND = 0;
  let loanInterestCostSecondTransfer = 0;
  let vatLoanInterestCost = 0;

  if (isDomestic) {
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
  
  if (isDomestic) {
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
  
  const sellingPriceExclVAT = userInput.sellingPriceVNDPerKg / (1 + outputVatRate);
  const totalRevenue = sellingPriceExclVAT * quantityInKg;
  const totalCOGS = importValueVND + totalClearanceAndLogisticsCost;
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

  // Output VAT is simply Revenue Incl VAT - Revenue Excl VAT
  const outputVAT = (item.calculated.totalRevenueInclVAT ?? 0) - (item.calculated.totalRevenue ?? 0);
  const vatPayable = outputVAT - (item.calculated.importVAT ?? 0);
  const cogsPerKg = quantityInKg > 0 ? (item.calculated.totalCOGS ?? 0) / quantityInKg : 0;
  const totalOperatingCost = totalSellingCost + totalGaCost;
  
  // Total Pre Tax Cost includes: COGS, Operating (Selling + G&A), Financial, and Other (811)
  const totalPreTaxCost = (item.calculated.totalCOGS ?? 0) + totalOperatingCost + totalFinancialCost + otherExpenses;
  
  // Profit Before Tax = Revenue + Other Income - Total Cost
  const profitBeforeTax = (item.calculated.totalRevenue ?? 0) - totalPreTaxCost + otherIncome;
  
  // CHANGED: Removed the check (profitBeforeTax > 0). 
  // Now calculates tax even if profit is negative (representing a tax credit/shield in the context of the whole plan).
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
