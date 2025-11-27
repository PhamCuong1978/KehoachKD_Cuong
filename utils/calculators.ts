
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
  const { costs, quantityInKg } = userInput;
  
  const importVatRate = (costs.importVatRate || 0) / 100;
  // Use userInput.outputVatRate if present, otherwise fall back to importVatRate (legacy behavior)
  const outputVatRate = (userInput.outputVatRate !== undefined ? userInput.outputVatRate : (costs.importVatRate || 0)) / 100;

  const containers = quantityInKg > 0 && defaultWeightKg > 0 ? quantityInKg / defaultWeightKg : 0;
  const priceUSDPerKg = userInput.priceUSDPerTon / 1000;
  const importValueUSD = quantityInKg * priceUSDPerKg;
  const importValueVND = importValueUSD * rates.importRate;
  const importVAT = quantityInKg * priceUSDPerKg * rates.taxRate * importVatRate;
  const priceVNDPerTon = userInput.priceUSDPerTon * rates.importRate;
  const totalRevenueInclVAT = userInput.sellingPriceVNDPerKg * quantityInKg;

  // New import interest cost calculation (1.6) - Updated Logic
  const dailyInterestRate = (costs.loanInterestRatePerYear / 100) / 365;
  
  // 1. Interest on First Transfer
  const loanFirstTransferAmountVND = costs.loanFirstTransferUSD * rates.importRate;
  const loanInterestCostFirstTransfer = loanFirstTransferAmountVND * dailyInterestRate * costs.loanFirstTransferInterestDays;
  
  // 2. Interest on Second Transfer (Remaining Balance)
  // Amount = Total Import Value - First Transfer Amount. If First Transfer > Total, then 0.
  // Duration = Post Clearance Storage Days (1.7)
  const loanSecondTransferAmountVND = Math.max(0, importValueVND - loanFirstTransferAmountVND);
  const loanInterestCostSecondTransfer = loanSecondTransferAmountVND * dailyInterestRate * costs.postClearanceStorageDays;

  // 3. Interest on VAT Payment
  // Amount = Import VAT
  // Duration = Post Clearance Storage Days (1.7)
  // Only if VAT rate > 0
  const vatLoanInterestCost = importVAT > 0 
    ? importVAT * dailyInterestRate * costs.postClearanceStorageDays 
    : 0;

  const importInterestCost = loanInterestCostFirstTransfer + loanInterestCostSecondTransfer + vatLoanInterestCost;

  const generalWarehouseCost = quantityInKg * costs.generalWarehouseCostRatePerKg;
  const postClearanceStorageCost = quantityInKg * costs.postClearanceStorageDays * costs.postClearanceStorageRatePerKgDay;
  const purchasingServiceFee = containers * costs.purchasingServiceFeeInMillionsPerCont * 1000000; // New for 1.8
  const otherInternationalPurchaseCost = costs.otherInternationalCosts; // New for 1.10

  const totalClearanceAndLogisticsCost =
    costs.customsFee + costs.quarantineFee + costs.containerRentalFee + costs.portStorageFee +
    generalWarehouseCost + importInterestCost + postClearanceStorageCost +
    purchasingServiceFee + costs.buyerDeliveryFee + otherInternationalPurchaseCost;
  
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
  
  const vatRate = (costs.importVatRate || 0) / 100; // Still used for logic if needed, but mainly we use outputVatRate now

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

  const totalSellingCost = allocatedSalesSalary + costs.otherSellingCosts;

  const totalGaCost =
    allocatedIndirectSalary + allocatedRent + allocatedElectricity + allocatedWater + allocatedStationery +
    allocatedDepreciation + allocatedExternalServices + allocatedOtherCashExpenses;
  
  const totalFinancialCost = allocatedFinancialCost;

  // Output VAT is simply Revenue Incl VAT - Revenue Excl VAT
  const outputVAT = (item.calculated.totalRevenueInclVAT ?? 0) - (item.calculated.totalRevenue ?? 0);
  const vatPayable = outputVAT - (item.calculated.importVAT ?? 0);
  const cogsPerKg = quantityInKg > 0 ? (item.calculated.totalCOGS ?? 0) / quantityInKg : 0;
  const totalOperatingCost = totalSellingCost + totalGaCost;
  const totalPreTaxCost = (item.calculated.totalCOGS ?? 0) + totalOperatingCost + totalFinancialCost;
  const profitBeforeTax = (item.calculated.totalRevenue ?? 0) - totalPreTaxCost;
  
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
