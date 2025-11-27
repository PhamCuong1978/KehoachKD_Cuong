
import React, { useState, useEffect } from 'react';
import { BookmarkIcon } from '../components/icons/BookmarkIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { CopyIcon } from '../components/icons/CopyIcon';
import { InputGroup } from '../components/InputGroup';
import type { SavedPlan } from '../types';
import type { ModuleType } from '../App';
import { generateHtmlReport } from '../utils/reportGenerator';

interface SavedPlansModuleProps {
  onNavigate: (module: ModuleType) => void;
}

export const SavedPlansModule: React.FC<SavedPlansModuleProps> = ({ onNavigate }) => {
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      const plans = localStorage.getItem('savedPlans');
      if (plans) {
        setSavedPlans(JSON.parse(plans));
      }
    } catch (error) {
      console.error("Could not load saved plans", error);
    }
  }, []);

  const saveToLocalStorage = (plans: SavedPlan[]) => {
      setSavedPlans(plans);
      localStorage.setItem('savedPlans', JSON.stringify(plans));
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa kế hoạch này?')) {
      const updatedPlans = savedPlans.filter(plan => plan.id !== id);
      saveToLocalStorage(updatedPlans);
    }
  };

  const handleDuplicate = (plan: SavedPlan) => {
      const newPlan: SavedPlan = {
          ...plan,
          id: Date.now().toString(),
          name: `${plan.name} (Sao chép)`,
          createdAt: new Date().toISOString()
      };
      const updatedPlans = [newPlan, ...savedPlans];
      saveToLocalStorage(updatedPlans);
  };

  const handleViewReport = (plan: SavedPlan) => {
      if (plan.items.length === 0) {
          alert("Kế hoạch này chưa có sản phẩm nào.");
          return;
      }
      // Generate report directly without loading into the main module
      const html = generateHtmlReport(
          plan.items, 
          plan.settings.exchangeRateImport, 
          plan.settings.exchangeRateTax
      );
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
  };

  const handleDownloadJson = (plan: SavedPlan) => {
      const dataStr = JSON.stringify(plan, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${plan.name.replace(/\s+/g, '_')}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleLoadPlan = (plan: SavedPlan) => {
    // We save the plan to a specific key that BusinessPlanModule checks on mount
    localStorage.setItem('pendingLoadPlan', JSON.stringify(plan));
    onNavigate('businessPlan');
  };
  
  const handleClearAll = () => {
      if (confirm('Cảnh báo: Hành động này sẽ xóa TẤT CẢ các kế hoạch đã lưu. Bạn có chắc không?')) {
          setSavedPlans([]);
          localStorage.removeItem('savedPlans');
      }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        
        const importedData = JSON.parse(text);
        
        // Basic validation
        if (importedData && importedData.id && importedData.items && importedData.settings) {
            const existingIndex = savedPlans.findIndex(p => p.id === importedData.id);
            let updatedPlans;
            if (existingIndex >= 0) {
                if(confirm('Kế hoạch với ID này đã tồn tại. Bạn có muốn ghi đè không?')) {
                     updatedPlans = [...savedPlans];
                     updatedPlans[existingIndex] = importedData;
                } else {
                    return; // Cancel import
                }
            } else {
                updatedPlans = [importedData, ...savedPlans];
            }
            
            if (updatedPlans) {
                saveToLocalStorage(updatedPlans);
                alert('Đã tải lên kế hoạch thành công!');
            }
        } else {
            alert('File không hợp lệ. Vui lòng chọn file kế hoạch đúng định dạng JSON.');
        }

      } catch (error) {
        alert('Lỗi khi đọc file.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filteredPlans = savedPlans.filter(plan => 
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 min-h-[500px]">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <BookmarkIcon className="h-6 w-6 mr-2 text-indigo-600" />
                    Danh sách Kế hoạch đã lưu
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Xem lại, so sánh hoặc xóa các phương án kinh doanh bạn đã lưu trước đây.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <label 
                        htmlFor="upload-plan" 
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none transition-colors"
                    >
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Tải lên Kế hoạch
                    </label>
                    <input
                        id="upload-plan"
                        type="file"
                        className="hidden"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                    />
                    
                    {savedPlans.length > 0 && (
                        <button 
                            onClick={handleClearAll}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Xóa tất cả
                        </button>
                    )}
                </div>
             </div>
             
             <div className="max-w-md">
                <InputGroup 
                id="search-plans" 
                label="" 
                srOnlyLabel 
                placeholder="Tìm kiếm theo tên kế hoạch..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        {/* Content Section */}
        <div className="overflow-x-auto">
          {savedPlans.length === 0 ? (
            <div className="text-center py-12 px-6">
              <BookmarkIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có kế hoạch nào được lưu</h3>
              <p className="mt-1 text-sm text-gray-500">Quay lại module "Kế hoạch Kinh doanh" để tạo và lưu phương án đầu tiên của bạn.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên Kế hoạch</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày lưu</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Số sản phẩm</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlans.map(plan => (
                        <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                    onClick={() => handleLoadPlan(plan)}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-900 hover:underline text-left block w-full truncate"
                                    title="Nhấn để chỉnh sửa kế hoạch này"
                                >
                                    {plan.name}
                                </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                {new Date(plan.createdAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                {plan.items.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end items-center space-x-2">
                                    <button
                                        onClick={() => handleDuplicate(plan)}
                                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        title="Sao chép kế hoạch"
                                    >
                                        <CopyIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleViewReport(plan)}
                                        className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                        title="Xem báo cáo nhanh (HTML)"
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDownloadJson(plan)}
                                        className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        title="Tải xuống file JSON"
                                    >
                                        <DownloadIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan.id)}
                                        className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        title="Xóa kế hoạch"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
