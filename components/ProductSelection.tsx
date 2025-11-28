
import React, { useState, useEffect, useMemo } from 'react';
import type { Product, AddProductDetails } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { CubeIcon } from './icons/CubeIcon';
import { InputGroup } from './InputGroup';
import { FormattedNumberInput } from './FormattedNumberInput';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface ProductSelectionProps {
  products: Product[];
  selectedProductCode: string;
  setSelectedProductCode: (code: string) => void;
  addProductToPlan: (details: AddProductDetails) => void;
  onAddNewProduct: () => void;
}

export const ProductSelection: React.FC<ProductSelectionProps> = ({
  products,
  selectedProductCode,
  setSelectedProductCode,
  addProductToPlan,
  onAddNewProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [productType, setProductType] = useState<'import' | 'domestic'>('import');

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const searchTerm = searchQuery.toLowerCase();
    return products.filter(product =>
        product.code.toLowerCase().includes(searchTerm) ||
        product.nameVI.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.group.toLowerCase().includes(searchTerm)
    );
  }, [products, searchQuery]);

  useEffect(() => {
    const currentSelectionExists = filteredProducts.some(p => p.code === selectedProductCode);
    if (!currentSelectionExists && filteredProducts.length > 0) {
      setSelectedProductCode(filteredProducts[0].code);
    }
  }, [filteredProducts, selectedProductCode, setSelectedProductCode]);

  const selectedProduct = products.find(p => p.code === selectedProductCode);

  const [quantityInKg, setQuantityInKg] = useState(0);
  const [quantityInCont, setQuantityInCont] = useState('');
  const [priceUSD, setPriceUSD] = useState(0);
  const [domesticPriceVND, setDomesticPriceVND] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);

  useEffect(() => {
    if (selectedProduct) {
      const defaultKg = selectedProduct.defaultWeightKg;
      setQuantityInKg(defaultKg);
      setQuantityInCont('1');
      setPriceUSD(selectedProduct.defaultPriceUSDPerTon);
      setSellingPrice(selectedProduct.defaultSellingPriceVND);
      // Reset domestic price when product changes
      setDomesticPriceVND(0);
    }
  }, [selectedProduct]);

  const handleKgChange = (kg: number) => {
    setQuantityInKg(kg);
    if (selectedProduct && selectedProduct.defaultWeightKg > 0 && !isNaN(kg)) {
      setQuantityInCont((kg / selectedProduct.defaultWeightKg).toFixed(2));
    }
  };

  const handleContChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const contValue = e.target.value;
    setQuantityInCont(contValue);
    const cont = Number(contValue);
    if (selectedProduct && !isNaN(cont)) {
      setQuantityInKg(Math.round(cont * selectedProduct.defaultWeightKg));
    }
  };

  const handleAddClick = () => {
    addProductToPlan({
      productCode: selectedProductCode,
      quantityInKg: Number(quantityInKg) || 0,
      priceUSDPerTon: productType === 'import' ? (Number(priceUSD) || 0) : 0,
      domesticPurchasePriceVNDPerKg: productType === 'domestic' ? (Number(domesticPriceVND) || 0) : 0,
      sellingPriceVNDPerKg: Number(sellingPrice) || 0,
      type: productType,
    });
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-3 mb-4 flex items-center">
        <CubeIcon className="h-5 w-5 mr-2 text-gray-500" />
        Thêm sản phẩm vào kế hoạch
      </h3>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <InputGroup
            id="product-search"
            label="Tìm kiếm sản phẩm"
            type="text"
            placeholder="Mã, tên, thương hiệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            />
            
            {/* Toggle Switch */}
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setProductType('import')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        productType === 'import' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Nhập khẩu
                </button>
                <button
                    onClick={() => setProductType('domestic')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        productType === 'domestic' 
                        ? 'bg-white text-teal-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Trong nước
                </button>
            </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="product-select" className="block text-sm font-medium text-gray-700">
              Chọn sản phẩm
            </label>
            <button
              onClick={onAddNewProduct}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
            >
              <PlusCircleIcon className="h-4 w-4" />
              <span>Thêm mới</span>
            </button>
          </div>
          <select
            id="product-select"
            value={selectedProductCode}
            onChange={(e) => setSelectedProductCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {filteredProducts.map((product) => (
              <option key={product.code} value={product.code}>
                {`${product.brand} - ${product.group} - ${product.nameVI} (${product.code})`}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormattedNumberInput id="quantity-kg" label="Số lượng (KG)" value={quantityInKg} onChange={handleKgChange} enableVoice />
          <InputGroup id="quantity-cont" label="Số lượng (Cont)" type="number" value={quantityInCont} onChange={handleContChange} step="0.01"/>
          
          {productType === 'import' ? (
             <FormattedNumberInput id="price-usd" label="Giá nhập (USD/Tấn)" value={priceUSD} onChange={setPriceUSD} decimalPlaces={2} enableVoice />
          ) : (
             <FormattedNumberInput id="domestic-price-vnd" label="Giá mua trong nước (VNĐ/kg)" value={domesticPriceVND} onChange={setDomesticPriceVND} addon="Có VAT" enableVoice />
          )}
          
          <FormattedNumberInput id="selling-price-vnd" label="Giá bán (VND/KG)" value={sellingPrice} onChange={setSellingPrice} enableVoice />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleAddClick}
            className="w-full sm:w-auto flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={!selectedProductCode}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Thêm vào kế hoạch
          </button>
        </div>
      </div>
    </div>
  );
};
