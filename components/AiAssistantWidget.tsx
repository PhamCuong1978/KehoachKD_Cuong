
import React, { useState, useEffect, useRef } from 'react';
// Fix: Replaced deprecated 'FunctionCallPart' with 'FunctionCall' from '@google/genai'.
import { GoogleGenAI, Type, FunctionDeclaration, FunctionCall, Chat } from "@google/genai";
import type { PlanItem, Product, AddProductDetails } from '../types';
import { XIcon } from './icons/XIcon';
import { SendIcon } from './icons/SendIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { getGeminiClient } from '../services/geminiService';

interface AiAssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[]; // Master product list
  planItems: PlanItem[];
  updatePlanItem: (id: string, field: string, value: number) => void;
  removePlanItem: (id: string) => void;
  addProductToPlan: (details: AddProductDetails) => void;
  setters: {
    [key: string]: (value: number) => void;
  }
}

interface Message {
  id: number;
  sender: 'user' | 'ai' | 'system';
  text: string;
}

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'vi-VN';
  recognition.interimResults = false;
}

const propertyMap: { [key: string]: string } = {
  "so_luong_kg": "quantityInKg", "gia_mua_usd": "priceUSDPerTon", "gia_ban_vnd": "sellingPriceVNDPerKg",
  "phi_hai_quan": "costs.customsFee", "phi_kiem_dich": "costs.quarantineFee", "phi_thue_cont": "costs.containerRentalFee",
  "phi_luu_kho_cang": "costs.portStorageFee", "don_gia_nhap_kho": "costs.generalWarehouseCostRatePerKg",
  "lai_suat_vay": "costs.loanInterestRatePerYear", "tien_vay_lan_1_usd": "costs.loanFirstTransferUSD",
  "ngay_lai_lan_1": "costs.loanFirstTransferInterestDays", "so_ngay_luu_kho": "costs.postClearanceStorageDays",
  "don_gia_luu_kho": "costs.postClearanceStorageRatePerKgDay", "thue_suat_vat": "costs.importVatRate", "thue_suat_vat_ban_ra": "outputVatRate",
  "phi_dich_vu_mua_hang": "costs.purchasingServiceFeeInMillionsPerCont", "phi_vc_den_kho_mua": "costs.buyerDeliveryFee",
  "chi_phi_quoc_te_khac": "costs.otherInternationalCosts", "chi_phi_ban_hang_khac": "costs.otherSellingCosts",
};

const settingMap: { [key: string]: string } = {
  "ty_gia_nhap_khau": "setExchangeRateImport", "ty_gia_thue": "setExchangeRateTax", "ty_le_luong_ban_hang": "setSalesSalaryRate",
  "tong_luong_gian_tiep": "setTotalMonthlyIndirectSalary", "so_ngay_lam_viec": "setWorkingDaysPerMonth",
  "chi_phi_thue_nha": "setTotalMonthlyRent", "chi_phi_dien": "setTotalMonthlyElectricity", "chi_phi_nuoc": "setTotalMonthlyWater",
  "chi_phi_vpp": "setTotalMonthlyStationery", "chi_phi_khau_hao": "setTotalMonthlyDepreciation",
  "chi_phi_dich_vu_ngoai": "setTotalMonthlyExternalServices", "chi_phi_tien_mat_khac": "setTotalMonthlyOtherCashExpenses",
  "chi_phi_tai_chinh": "setTotalMonthlyFinancialCost",
};

export const AiAssistantWidget: React.FC<AiAssistantWidgetProps> = ({
  isOpen, onClose, products, planItems, updatePlanItem, removePlanItem, addProductToPlan, setters
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Initialize chat only once
  useEffect(() => {
    if (!chatRef.current) {
        setMessages([{ id: Date.now(), sender: 'ai', text: 'Em chào anh Cường! Anh muốn gì ở em???' }]);
        const ai = getGeminiClient();
        const tools: FunctionDeclaration[] = [
          {
            name: 'update_product_property',
            description: 'Cập nhật một thuộc tính của MỘT sản phẩm cụ thể trong kế hoạch.',
            parameters: {
              type: Type.OBJECT, properties: {
                product_name: { type: Type.STRING, description: 'Tên tiếng Việt của sản phẩm, bao gồm cả nhóm hàng. Ví dụ: "Thịt trâu - Thăn ngoại".' },
                property_name: { type: Type.STRING, description: `Tên thuộc tính cần thay đổi. Giá trị hợp lệ: ${Object.keys(propertyMap).join(', ')}.` },
                new_value: { type: Type.NUMBER, description: 'Giá trị số mới.' },
              }, required: ['product_name', 'property_name', 'new_value'],
            },
          },
          {
            name: 'bulk_update_products',
            description: 'Cập nhật hàng loạt một thuộc tính cho nhiều sản phẩm dựa trên một điều kiện lọc.',
            parameters: {
              type: Type.OBJECT, properties: {
                filter_property: { type: Type.STRING, description: "Tiêu chí lọc sản phẩm. Dùng 'brand' để lọc theo thương hiệu, 'group' để lọc theo nhóm (ví dụ: 'Thịt trâu'), 'all' để áp dụng cho tất cả sản phẩm." },
                filter_value: { type: Type.STRING, description: "Giá trị để lọc. Ví dụ: 'Alana' nếu filter_property là 'brand'." },
                target_property: { type: Type.STRING, description: `Tên thuộc tính cần thay đổi. Giá trị hợp lệ: ${Object.keys(propertyMap).join(', ')}.` },
                update_type: { type: Type.STRING, description: "Loại cập nhật: 'percentage_increase' (tăng phần trăm), 'percentage_decrease' (giảm phần trăm), 'absolute_increase' (tăng giá trị tuyệt đối), 'absolute_decrease' (giảm giá trị tuyệt đối), 'set_value' (đặt giá trị mới)." },
                update_value: { type: Type.NUMBER, description: 'Giá trị cho việc cập nhật (ví dụ: 10 cho 10%, 5000 cho 5000 VND).' },
              }, required: ['filter_property', 'target_property', 'update_type', 'update_value'],
            },
          },
          {
            name: 'add_product_to_plan',
            description: 'Thêm một sản phẩm mới từ danh mục vào kế hoạch kinh doanh.',
            parameters: {
              type: Type.OBJECT, properties: {
                product_name: { type: Type.STRING, description: 'Tên tiếng Việt chính xác của sản phẩm cần thêm, bao gồm cả nhóm hàng.' },
                quantity_kg: { type: Type.NUMBER, description: 'Số lượng tính bằng kg.' },
                price_usd_per_ton: { type: Type.NUMBER, description: 'Giá mua USD/tấn. Nếu không cung cấp, sẽ dùng giá mặc định.' },
                selling_price_vnd_per_kg: { type: Type.NUMBER, description: 'Giá bán VND/kg. Nếu không cung cấp, sẽ dùng giá mặc định.' },
              }, required: ['product_name', 'quantity_kg'],
            },
          },
          {
            name: 'update_general_setting',
            description: 'Cập nhật một cài đặt chung của toàn bộ kế hoạch.',
            parameters: {
              type: Type.OBJECT, properties: {
                setting_name: { type: Type.STRING, description: `Tên cài đặt cần thay đổi. Giá trị hợp lệ: ${Object.keys(settingMap).join(', ')}.` },
                new_value: { type: Type.NUMBER, description: 'Giá trị số mới.' },
              }, required: ['setting_name', 'new_value'],
            },
          },
          {
            name: 'remove_product_from_plan',
            description: 'Xóa một sản phẩm khỏi kế hoạch kinh doanh.',
            parameters: {
              type: Type.OBJECT, properties: {
                product_name: { type: Type.STRING, description: 'Tên tiếng Việt của sản phẩm cần xóa, bao gồm cả nhóm hàng.' },
              }, required: ['product_name'],
            },
          }
        ];

        const systemInstruction = `You are "AI của anh Cường", a smart and helpful assistant for a business planning application. 
- You act as a professional assistant to "Anh Cường".
- The user is creating a business plan for importing and selling frozen food products in Vietnam.
- The user will give instructions in Vietnamese. You MUST respond in Vietnamese.
- Your primary goal is to help the user modify their business plan using the provided tools.
- Maintain context of the conversation. Do not forget what was discussed previously.
- If the user's request is ambiguous, ask for clarification.
- Be concise, professional but friendly.`;

        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            tools: [{ functionDeclarations: tools }],
            systemInstruction: systemInstruction,
          },
        });
    }
  }, []); // Run once on mount

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        // Check if the click was on the toggle button (which is outside this component)
        // We can check if the target has a specific ID or class if needed, 
        // but typically the toggle button handler stops propagation.
        // For now, let's just close it.
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);


  useEffect(() => {
    if (!recognition) return;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
  }, []);

  const handleVoiceInput = () => {
    if (!recognition) {
        alert('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói.');
        return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const findProductInPlan = (name: string): PlanItem | null => {
    const searchTerm = name.toLowerCase().trim();
    // Prioritize matches that are more specific
    const itemsWithCombinedName = planItems.map(p => ({
        ...p,
        combinedName: `${p.group.toLowerCase()} - ${p.nameVI.toLowerCase()}`.trim()
    }));

    // Exact match on combined name
    const exactCombined = itemsWithCombinedName.find(p => p.combinedName === searchTerm);
    if (exactCombined) return exactCombined;

    // Exact match on just VI name
    const exactVI = planItems.find(p => p.nameVI.toLowerCase().trim() === searchTerm);
    if (exactVI) return exactVI;

    // Partial match on combined name
    const partialCombined = itemsWithCombinedName.find(p => p.combinedName.includes(searchTerm));
    if (partialCombined) return partialCombined;
    
    // Partial match on just VI name
    const partialVI = planItems.find(p => p.nameVI.toLowerCase().trim().includes(searchTerm));
    return partialVI || null;
  };
  
  const findMasterProduct = (name: string): Product | null => {
    const searchTerm = name.toLowerCase().trim();
     const productsWithCombinedName = products.map(p => ({
        ...p,
        combinedName: `${p.group.toLowerCase()} - ${p.nameVI.toLowerCase()}`.trim()
    }));

    // Exact match on combined name
    const exactCombined = productsWithCombinedName.find(p => p.combinedName === searchTerm);
    if (exactCombined) return exactCombined;

    // Exact match on just VI name
    const exactVI = products.find(p => p.nameVI.toLowerCase().trim() === searchTerm);
    if (exactVI) return exactVI;
    
    // Partial match on combined name
    const partialCombined = productsWithCombinedName.find(p => p.combinedName.includes(searchTerm));
    if (partialCombined) return partialCombined;

    // Partial match on just VI name
    const partialVI = products.find(p => p.nameVI.toLowerCase().trim().includes(searchTerm));
    return partialVI || null;
  };

  // Fix: Replaced deprecated 'FunctionCallPart' with 'FunctionCall' from '@google/genai'.
  const executeFunctionCalls = (calls: FunctionCall[]) => {
    let systemMessages: string[] = [];

    for (const fc of calls) {
        let resultMessage = '';
        switch (fc.name) {
            case 'update_product_property': {
              // Fix: Cast function call arguments to their expected types to resolve type errors.
              const { product_name, property_name, new_value } = fc.args as { product_name: string; property_name: string; new_value: number };
              const productToUpdate = findProductInPlan(product_name);
              const fieldToUpdate = propertyMap[property_name];
              if (productToUpdate && fieldToUpdate) {
                const val = property_name === 'phi_dich_vu_mua_hang' ? new_value / 1000000 : new_value;
                updatePlanItem(productToUpdate.id, fieldToUpdate, val);
                resultMessage = `Đã cập nhật '${property_name}' của sản phẩm '${product_name}' thành '${new_value}'.`;
              } else {
                resultMessage = `Lỗi: Không tìm thấy sản phẩm '${product_name}' trong kế hoạch hoặc thuộc tính '${property_name}' không hợp lệ.`;
              }
              break;
            }
            case 'bulk_update_products': {
              // Fix: Cast function call arguments to their expected types to resolve type errors.
              const { filter_property, filter_value, target_property, update_type, update_value } = fc.args as { filter_property: string; filter_value: string; target_property: string; update_type: string; update_value: number };
              const targetField = propertyMap[target_property];
              if (!targetField) {
                  resultMessage = `Lỗi: Thuộc tính '${target_property}' không hợp lệ.`;
                  break;
              }

              let affectedItems = planItems.filter(item => {
                  if (filter_property === 'all') return true;
                  if (filter_property === 'brand') return item.brand.toLowerCase() === filter_value.toLowerCase();
                  if (filter_property === 'group') return item.group.toLowerCase() === filter_value.toLowerCase();
                  return false;
              });

              if (affectedItems.length === 0) {
                  resultMessage = `Không tìm thấy sản phẩm nào khớp với điều kiện: ${filter_property} = '${filter_value}'.`;
                  break;
              }

              affectedItems.forEach(item => {
                  const path = targetField.split('.');
                  let currentValueHolder: any = item.userInput;
                  for (let i = 0; i < path.length - 1; i++) {
                      currentValueHolder = currentValueHolder[path[i]];
                  }
                  let currentValue = currentValueHolder[path[path.length - 1]];
                  
                  if (target_property === 'phi_dich_vu_mua_hang') {
                      currentValue *= 1000000;
                  }

                  let newValue = 0;
                  switch (update_type) {
                      case 'percentage_increase': newValue = currentValue * (1 + update_value / 100); break;
                      case 'percentage_decrease': newValue = currentValue * (1 - update_value / 100); break;
                      case 'absolute_increase': newValue = currentValue + update_value; break;
                      case 'absolute_decrease': newValue = currentValue - update_value; break;
                      case 'set_value': newValue = update_value; break;
                      default: newValue = currentValue;
                  }
                  
                  const valToUpdate = target_property === 'phi_dich_vu_mua_hang' ? newValue / 1000000 : newValue;
                  updatePlanItem(item.id, targetField, valToUpdate);
              });
              resultMessage = `Đã cập nhật '${target_property}' cho ${affectedItems.length} sản phẩm.`;
              break;
            }
            case 'add_product_to_plan': {
              // Fix: Cast function call arguments to their expected types to resolve type errors.
              const { product_name: productNameToAdd, quantity_kg, price_usd_per_ton, selling_price_vnd_per_kg } = fc.args as { product_name: string; quantity_kg: number; price_usd_per_ton?: number; selling_price_vnd_per_kg?: number };
              const masterProduct = findMasterProduct(productNameToAdd);
              if (masterProduct) {
                  addProductToPlan({
                      productCode: masterProduct.code,
                      quantityInKg: quantity_kg,
                      priceUSDPerTon: price_usd_per_ton ?? masterProduct.defaultPriceUSDPerTon,
                      sellingPriceVNDPerKg: selling_price_vnd_per_kg ?? masterProduct.defaultSellingPriceVND,
                      type: 'import', // Defaulting to import to satisfy type requirement
                  });
                  resultMessage = `Đã thêm sản phẩm '${productNameToAdd}' vào kế hoạch.`;
              } else {
                  resultMessage = `Lỗi: Không tìm thấy sản phẩm '${productNameToAdd}' trong danh mục sản phẩm.`;
              }
              break;
            }
            case 'update_general_setting': {
              // Fix: Cast function call arguments to their expected types to resolve type errors.
              const { setting_name, new_value: setting_value } = fc.args as { setting_name: string; new_value: number };
              const setterName = settingMap[setting_name];
              if (setterName && setters[setterName]) {
                setters[setterName](setting_value);
                resultMessage = `Đã cập nhật cài đặt '${setting_name}' thành '${setting_value}'.`;
              } else {
                resultMessage = `Lỗi: Không tìm thấy cài đặt '${setting_name}'.`;
              }
              break;
            }
            case 'remove_product_from_plan': {
                // Fix: Cast function call arguments to their expected types to resolve type errors.
                const { product_name: product_to_remove_name } = fc.args as { product_name: string };
                const productToRemove = findProductInPlan(product_to_remove_name);
                if(productToRemove) {
                    removePlanItem(productToRemove.id);
                    resultMessage = `Đã xóa sản phẩm '${product_to_remove_name}' khỏi kế hoạch.`;
                } else {
                    resultMessage = `Lỗi: Không tìm thấy sản phẩm '${product_to_remove_name}' trong kế hoạch để xóa.`;
                }
                break;
            }
        }
        if (resultMessage) {
            systemMessages.push(resultMessage);
        }
    }

    if (systemMessages.length > 0) {
        setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender: 'system', text: systemMessages.join('\n') }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // INJECT CURRENT PLAN CONTEXT
      // Instead of resetting the chat, we provide the current plan items as context in the message
      const productSummary = planItems.length > 0 
        ? planItems.map(p => `${p.group} - ${p.nameVI} (${p.brand})`).join(', ')
        : 'Chưa có sản phẩm nào.';
      
      const contextMessage = `
[SYSTEM CONTEXT - DỮ LIỆU HIỆN TẠI]
Danh sách sản phẩm đang có trong kế hoạch: ${productSummary}
Bạn có thể thao tác thêm/sửa/xóa dựa trên danh sách này.
-----------------------------------
[USER REQUEST]
${currentInput}
      `;

      if (!chatRef.current) {
          // This should ideally not happen due to useEffect, but for safety
           console.warn("Chat session not initialized, re-initializing...");
            // Re-initialization logic if needed, or error handling
            // For now, assume it's initialized.
            return;
      }

      const response = await chatRef.current.sendMessage({ message: contextMessage });

      if (response.functionCalls && response.functionCalls.length > 0) {
        executeFunctionCalls(response.functionCalls);
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'Đã thực hiện xong yêu cầu của anh! Anh Cường có cần em giúp gì nữa không ạ?' }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: response.text }]);
      }

    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'Xin lỗi anh, em gặp chút trục trặc. Anh thử lại giúp em nhé.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        ref={widgetRef}
        className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-50 flex flex-col bg-white sm:rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-full sm:w-96 h-[80vh] sm:h-[600px] transition-all transform duration-300 ease-in-out"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
    >
        <header className="flex items-center justify-between p-4 bg-blue-600 text-white">
          <div className="flex items-center space-x-2">
            <ChatBubbleIcon className="h-6 w-6 text-white" />
            <div>
                <h2 className="text-md font-bold">AI của anh Cường</h2>
                <p className="text-xs text-blue-100 opacity-90">Trợ lý ảo thông minh</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 
                msg.sender === 'ai' ? 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none' : 
                'bg-yellow-50 text-yellow-800 border border-yellow-200 text-xs italic w-full text-center'
              }`}>
                {msg.text.split('\n').map((line, index) => <p key={index} className={index > 0 ? 'mt-1' : ''}>{line}</p>)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </main>

        <footer className="p-3 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVoiceInput}
              disabled={isLoading || !recognition}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} disabled:opacity-50`}
              title="Nói để nhập liệu"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
            <div className="flex-1 relative">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Nhập yêu cầu..."
                className="w-full pl-3 pr-2 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
                />
            </div>
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 flex-shrink-0 transition-colors"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </div>
        </footer>
    </div>
  );
};
