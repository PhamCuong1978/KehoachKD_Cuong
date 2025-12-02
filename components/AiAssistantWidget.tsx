
import React, { useState, useEffect, useRef } from 'react';
// Fix: Replaced deprecated 'FunctionCallPart' with 'FunctionCall' from '@google/genai'.
import { GoogleGenAI, Type, FunctionDeclaration, FunctionCall, Chat, Part } from "@google/genai";
import type { PlanItem, Product, AddProductDetails } from '../types';
import { XIcon } from './icons/XIcon';
import { SendIcon } from './icons/SendIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
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
  attachments?: { type: string; data: string; name: string }[];
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

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/png;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

export const AiAssistantWidget: React.FC<AiAssistantWidgetProps> = ({
  isOpen, onClose, products, planItems, updatePlanItem, removePlanItem, addProductToPlan, setters
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize chat only once
  useEffect(() => {
    if (!chatRef.current) {
        setMessages([{ id: Date.now(), sender: 'ai', text: 'Em chào anh Cường! Anh cần em phân tích gì về kế hoạch kinh doanh này ạ?' }]);
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
- Your primary goal is to help the user modify their business plan using the provided tools OR analyze the plan/images provided by the user.
- If the user provides an image, analyze it carefully (e.g., invoices, price lists, competitor plans) and provide insights relevant to their business plan.
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
  }, [messages, isOpen, attachments]);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if screen is wide enough (desktop), on mobile we rely on the 'X' button
      if (window.innerWidth >= 640 && isOpen && widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
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
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
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

  // --- Handlers for Multimodal Support ---
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const newFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) newFiles.push(file);
        }
    }
    if (newFiles.length > 0) {
        setAttachments(prev => [...prev, ...newFiles]);
        e.preventDefault();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  // ----------------------------------------

  const findProductInPlan = (name: string): PlanItem | null => {
    const searchTerm = name.toLowerCase().trim();
    const itemsWithCombinedName = planItems.map(p => ({
        ...p,
        combinedName: `${p.group.toLowerCase()} - ${p.nameVI.toLowerCase()}`.trim()
    }));

    const exactCombined = itemsWithCombinedName.find(p => p.combinedName === searchTerm);
    if (exactCombined) return exactCombined;

    const exactVI = planItems.find(p => p.nameVI.toLowerCase().trim() === searchTerm);
    if (exactVI) return exactVI;

    const partialCombined = itemsWithCombinedName.find(p => p.combinedName.includes(searchTerm));
    if (partialCombined) return partialCombined;
    
    const partialVI = planItems.find(p => p.nameVI.toLowerCase().trim().includes(searchTerm));
    return partialVI || null;
  };
  
  const findMasterProduct = (name: string): Product | null => {
    const searchTerm = name.toLowerCase().trim();
     const productsWithCombinedName = products.map(p => ({
        ...p,
        combinedName: `${p.group.toLowerCase()} - ${p.nameVI.toLowerCase()}`.trim()
    }));

    const exactCombined = productsWithCombinedName.find(p => p.combinedName === searchTerm);
    if (exactCombined) return exactCombined;

    const exactVI = products.find(p => p.nameVI.toLowerCase().trim() === searchTerm);
    if (exactVI) return exactVI;
    
    const partialCombined = productsWithCombinedName.find(p => p.combinedName.includes(searchTerm));
    if (partialCombined) return partialCombined;

    const partialVI = products.find(p => p.nameVI.toLowerCase().trim().includes(searchTerm));
    return partialVI || null;
  };

  const executeFunctionCalls = (calls: FunctionCall[]) => {
    let systemMessages: string[] = [];

    for (const fc of calls) {
        let resultMessage = '';
        switch (fc.name) {
            case 'update_product_property': {
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
              const { product_name: productNameToAdd, quantity_kg, price_usd_per_ton, selling_price_vnd_per_kg } = fc.args as { product_name: string; quantity_kg: number; price_usd_per_ton?: number; selling_price_vnd_per_kg?: number };
              const masterProduct = findMasterProduct(productNameToAdd);
              if (masterProduct) {
                  addProductToPlan({
                      productCode: masterProduct.code,
                      quantityInKg: quantity_kg,
                      priceUSDPerTon: price_usd_per_ton ?? masterProduct.defaultPriceUSDPerTon,
                      sellingPriceVNDPerKg: selling_price_vnd_per_kg ?? masterProduct.defaultSellingPriceVND,
                      type: 'import',
                  });
                  resultMessage = `Đã thêm sản phẩm '${productNameToAdd}' vào kế hoạch.`;
              } else {
                  resultMessage = `Lỗi: Không tìm thấy sản phẩm '${productNameToAdd}' trong danh mục sản phẩm.`;
              }
              break;
            }
            case 'update_general_setting': {
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
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    const userMessage: Message = { 
        id: Date.now(), 
        sender: 'user', 
        text: input,
        attachments: currentAttachments.map(f => ({ 
            type: f.type, 
            name: f.name, 
            data: URL.createObjectURL(f) // For local preview
        }))
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const productSummary = planItems.length > 0 
        ? planItems.map(p => `${p.group} - ${p.nameVI} (${p.brand})`).join(', ')
        : 'Chưa có sản phẩm nào.';
      
      const contextMessage = `
[SYSTEM CONTEXT - DỮ LIỆU HIỆN TẠI]
Danh sách sản phẩm đang có trong kế hoạch: ${productSummary}
Bạn có thể thao tác thêm/sửa/xóa dựa trên danh sách này hoặc phân tích thông tin từ ảnh người dùng gửi.
-----------------------------------
[USER REQUEST]
${currentInput}
      `;

      if (!chatRef.current) {
           console.warn("Chat session not initialized, re-initializing...");
            return;
      }

      // Construct message parts (Text + Images)
      const parts: (string | Part)[] = [{ text: contextMessage }];
      
      for (const file of currentAttachments) {
          try {
              const base64Data = await fileToBase64(file);
              parts.push({
                  inlineData: {
                      data: base64Data,
                      mimeType: file.type
                  }
              });
          } catch (e) {
              console.error("Error processing attachment:", e);
          }
      }

      const response = await chatRef.current.sendMessage({ message: parts });

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
        className="fixed inset-0 sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto z-50 flex flex-col bg-white sm:rounded-2xl shadow-2xl border-0 sm:border border-gray-200 overflow-hidden w-full h-[100dvh] sm:w-[450px] sm:h-[650px] transition-all transform duration-300 ease-in-out"
        style={{ zIndex: 9999 }}
    >
        <header className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <ChatBubbleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
                <h2 className="text-md font-bold">AI của anh Cường</h2>
                <p className="text-xs text-blue-100 opacity-90">Trợ lý ảo đa năng</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors">
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 
                msg.sender === 'ai' ? 'bg-white text-gray-800 border border-gray-100 rounded-bl-none' : 
                'bg-yellow-50 text-yellow-800 border border-yellow-200 text-xs italic w-full text-center'
              }`}>
                {/* Show attachments for user messages */}
                {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {msg.attachments.map((att, idx) => (
                            <img 
                                key={idx} 
                                src={att.data} 
                                alt={att.name} 
                                className="h-20 w-auto rounded-md object-cover border border-white/30" 
                            />
                        ))}
                    </div>
                )}
                
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

        <footer className="p-3 bg-white border-t border-gray-200 shrink-0">
          {/* Attachment Preview Area */}
          {attachments.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
                  {attachments.map((file, idx) => (
                      <div key={idx} className="relative group shrink-0">
                          <img 
                              src={URL.createObjectURL(file)} 
                              alt="preview" 
                              className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                          />
                          <button 
                              onClick={() => removeAttachment(idx)}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                          >
                              <XIcon className="w-3 h-3" />
                          </button>
                      </div>
                  ))}
              </div>
          )}

          <div className="flex items-end space-x-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect} 
                multiple 
                accept="image/*"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors mb-1"
                title="Đính kèm ảnh"
            >
                <PaperClipIcon className="h-6 w-6" />
            </button>
            
            <div className="flex-1 relative bg-gray-100 rounded-2xl flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    onPaste={handlePaste}
                    placeholder="Nhập yêu cầu (hoặc dán ảnh Ctrl+V)..."
                    className="w-full pl-4 pr-10 py-3 bg-transparent border-none focus:ring-0 text-sm text-gray-800 placeholder-gray-500"
                    disabled={isLoading}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                     <button
                        onClick={handleVoiceInput}
                        disabled={isLoading || !recognition}
                        className={`p-1.5 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-gray-700'}`}
                        title="Nói để nhập liệu"
                    >
                        <MicrophoneIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            
            <button
              onClick={sendMessage}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-sm mb-0.5"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </div>
        </footer>
    </div>
  );
};
