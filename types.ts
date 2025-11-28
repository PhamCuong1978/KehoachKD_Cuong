
export interface Product {
  code: string;
  nameEN: string;
  nameVI: string;
  brand: string;
  group: string; // Added to categorize products e.g., 'Thịt trâu', 'Thịt lợn'
  defaultWeightKg: number; // Represents the weight of a standard container for this product
  defaultPriceUSDPerTon: number;
  defaultSellingPriceVND: number;
}

export interface PlanItem extends Product {
  id: string;
  userInput: {
    type?: 'import' | 'domestic'; // New: Distinguish between import and domestic
    
    // Pricing
    priceUSDPerTon: number; // For Import
    domesticPurchasePriceVNDPerKg?: number; // New: For Domestic (Incl. VAT)
    
    sellingPriceVNDPerKg: number;
    // Quantity
    quantityInKg: number;
    
    outputVatRate: number; // New: Thuế suất GTGT bán ra
    
    otherIncome: number; // Deprecated in UI, kept for legacy compatibility

    // Cost inputs (per product line)
    costs: {
      // Category 1: Clearance & Logistics
      customsFee: number;
      quarantineFee: number;
      containerRentalFee: number;
      portStorageFee: number;
      generalWarehouseCostRatePerKg: number; // New for 1.5
      loanInterestRatePerYear: number; // New for 1.6
      loanFirstTransferUSD: number; // New for 1.6
      loanFirstTransferInterestDays: number; // New for 1.6
      postClearanceStorageDays: number;
      postClearanceStorageRatePerKgDay: number; // New for 1.7
      importVatRate: number; // User-configurable VAT rate (Input VAT)
      purchasingServiceFeeInMillionsPerCont: number; // New for 1.8
      buyerDeliveryFee: number;
      otherInternationalCosts: number; // Replaces otherInternationalCostsInMillions for 1.10

      // Category 2: Selling
      otherSellingCosts: number;

      // Category 3 & 4 are now calculated based on monthly totals
      
      // Category 6: Other Expenses (Account 811)
      otherExpenses: number; // Deprecated in UI, kept for legacy compatibility
    }
  };
  calculated: {
    // Base
    importValueUSD?: number;
    priceUSDPerKg?: number;
    priceVNDPerTon?: number; // New for display
    importValueVND?: number; // Stores the base cost (Purchase Price Excl. VAT)
    importVAT?: number;
    containers?: number;
    outputVAT?: number;
    vatPayable?: number;
    sellingPriceExclVAT?: number;
    totalRevenueInclVAT?: number; // New for display

    // Costs Category 1: Clearance & Logistics
    generalWarehouseCost?: number; // New for 1.5
    importInterestCost?: number; // 1.6
    loanFirstTransferAmountVND?: number; // New for 1.6
    loanInterestCostFirstTransfer?: number; // New for 1.6
    loanSecondTransferAmountVND?: number; // New for 1.6
    loanInterestCostSecondTransfer?: number; // New for 1.6
    vatLoanInterestCost?: number; // New for 1.6 (Interest on VAT payment)
    postClearanceStorageCost?: number; // 1.7
    purchasingServiceFee?: number; // Replaces postClearanceFinancialCost for 1.8
    otherInternationalPurchaseCost?: number; // 1.10
    totalClearanceAndLogisticsCost?: number;

    // Costs Category 2: Selling
    salesStaffSalary?: number;
    totalSellingCost?: number;

    // Costs Category 3: G&A
    indirectStaffSalary?: number;
    rent?: number;
    electricity?: number;
    water?: number;
    stationery?: number;
    depreciation?: number;
    externalServices?: number;
    otherCashExpenses?: number;
    totalGaCost?: number;
    
    // Costs Category 4: Financial
    financialValuationCost?: number;
    totalFinancialCost?: number;
    
    // Income Category 5: Other Income
    otherIncome?: number;

    // Costs Category 6: Other
    otherExpenses?: number;

    // Summaries
    totalCOGS?: number;
    cogsPerKg?: number;
    totalRevenue?: number;
    grossProfit?: number;
    totalOperatingCost?: number; // Selling + G&A
    totalPreTaxCost?: number; // All costs before tax
    profitBeforeTax?: number;
    corporateIncomeTax?: number;
    netProfit?: number;
    totalTaxPayable?: number;
    
    // Profit Distribution
    retainedForProvision?: number;
    retainedForBusiness?: number;
    dividends?: number;
  };
}

export interface AddProductDetails {
  productCode: string;
  quantityInKg: number;
  // Import params
  priceUSDPerTon?: number;
  // Domestic params
  type: 'import' | 'domestic';
  domesticPurchasePriceVNDPerKg?: number;
  // Common
  sellingPriceVNDPerKg: number;
}

export interface MeetingDetails {
    timeAndPlace: string;
    attendees: string;
    chair: string;
    topic: string;
}

export interface PlanSettings {
  exchangeRateImport: number;
  exchangeRateTax: number;
  salesSalaryRate: number;
  totalMonthlyIndirectSalary: number;
  workingDaysPerMonth: number;
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

export interface SavedPlan {
  id: string;
  name: string;
  createdAt: string;
  items: PlanItem[];
  settings: PlanSettings;
}
