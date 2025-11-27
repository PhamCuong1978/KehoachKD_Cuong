
import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './icons/XIcon';
import { SaveIcon } from './icons/SaveIcon';

interface SavePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName: string;
}

export const SavePlanModal: React.FC<SavePlanModalProps> = ({ isOpen, onClose, onSave, defaultName }) => {
  const [planName, setPlanName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPlanName(defaultName);
      // Auto focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planName.trim()) {
      onSave(planName.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b bg-indigo-50">
          <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
            <SaveIcon className="h-5 w-5 mr-2" />
            Lưu Kế hoạch Kinh doanh
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="planName" className="block text-sm font-medium text-gray-700 mb-2">
              Tên kế hoạch
            </label>
            <input
              ref={inputRef}
              type="text"
              id="planName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập tên kế hoạch của bạn..."
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Kế hoạch sẽ được lưu vào mục "Kế hoạch đã lưu" trên thanh bên trái.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!planName.trim()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Lưu trữ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
