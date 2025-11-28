
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import BusinessPlanModule from './modules/BusinessPlanModule';
import { CashFlowModule } from './modules/CashFlowModule';
import { InventoryModule } from './modules/InventoryModule';
import { SalesTeamModule } from './modules/SalesTeamModule';
import { Header } from './components/Header';
import { MeetingMinutesModule } from './modules/MeetingMinutesModule';
import { SavedPlansModule } from './modules/SavedPlansModule';

export type ModuleType = 'businessPlan' | 'savedPlans' | 'cashFlow' | 'inventory' | 'salesTeam' | 'meetingMinutes';

const moduleTitles: { [key in ModuleType]: string } = {
  businessPlan: 'Kế hoạch Kinh doanh',
  savedPlans: 'Kế hoạch đã lưu',
  cashFlow: 'Thu - Chi tiền',
  inventory: 'Nhập xuất hàng',
  salesTeam: 'Đội KD & Marketing',
  meetingMinutes: 'Biên bản họp',
};

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('businessPlan');
  // Mặc định đóng Sidebar để tối đa hóa diện tích nhìn ngay từ đầu
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (module: ModuleType) => {
    setActiveModule(module);
    // Đảm bảo đóng sidebar khi điều hướng từ các module con
    setIsSidebarOpen(false);
  };

  const handleSidebarNavigation = (module: ModuleType) => {
    setActiveModule(module);
    // Tự động đóng sidebar sau khi chọn menu để người dùng xem nội dung ngay
    setIsSidebarOpen(false);
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'businessPlan':
        return <BusinessPlanModule />;
      case 'savedPlans':
        return <SavedPlansModule onNavigate={handleNavigate} />;
      case 'cashFlow':
        return <CashFlowModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'salesTeam':
        return <SalesTeamModule />;
      case 'meetingMinutes':
        return <MeetingMinutesModule />;
      default:
        return <BusinessPlanModule />;
    }
  };

  return (
    <div className="h-screen bg-gray-100 text-gray-800 font-sans relative overflow-hidden flex flex-row">
      {/* Overlay: Hiển thị trên MỌI màn hình khi sidebar mở. Click vào đây sẽ đóng sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      
      {/* Sidebar: Fixed position, sliding in from left */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={handleSidebarNavigation}
        isOpen={isSidebarOpen}
      />
      
      {/* Content wrapper: Chiếm toàn bộ chiều rộng còn lại */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <Header
          title={moduleTitles[activeModule]}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative w-full">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
};

export default App;
