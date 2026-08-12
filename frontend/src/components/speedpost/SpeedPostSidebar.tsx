import React from 'react';
import { 
  LuLayoutDashboard, 
  LuUpload, 
  LuLayers, 
  LuCalendar, 
  LuUsers, 
  LuCreditCard, 
  LuStethoscope, 
  LuSettings, 
  LuClipboardList,
  LuChevronLeft,
  LuChevronRight
} from 'react-icons/lu';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export const SpeedPostSidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { id: 'programar_v2', label: 'Programar Posts(V2)', icon: LuUpload },
    { id: 'carrossel_massa', label: 'Carrossel em Massa', icon: LuLayers },
    { id: 'calendario', label: 'Calendário', icon: LuCalendar },
    { id: 'contas', label: 'Contas / Profiles', icon: LuUsers },
    { id: 'planos', label: 'Planos & Créditos', icon: LuCreditCard },
    { id: 'webhooks', label: 'Webhooks / API', icon: LuStethoscope },
    { id: 'configuracoes', label: 'Configurações', icon: LuSettings },
    { id: 'logs', label: 'Histórico / Logs', icon: LuClipboardList },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#12101C] border-r border-[#201C2F] flex flex-col justify-between p-3.5 shrink-0 transition-all duration-300 sticky top-0 h-screen z-30 select-none`}>
      <div>
        {/* BRAND LOGO */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(109,40,217,0.4)] text-white font-black text-xl shrink-0">
            ⚡
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-tight leading-none">SpeedPost</h1>
              <span className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">Meta Engine Pro</span>
            </div>
          )}
        </div>

        {/* NAV MENU */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 font-semibold shadow-[0_0_15px_rgba(109,40,217,0.2)]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#181524]'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <span className={`text-base ${isActive ? 'text-purple-400' : 'text-gray-400'}`}>
                  <IconComp />
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* FOOTER USER / COLLAPSE */}
      <div className="pt-3 border-t border-[#201C2F] flex items-center justify-between px-1">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 rounded-lg bg-[#201C2F]/50 hover:bg-[#201C2F] flex items-center justify-center text-gray-400 hover:text-white transition-all text-xs"
        >
          {isCollapsed ? <LuChevronRight /> : <LuChevronLeft />}
        </button>
        
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center font-bold text-white text-xs border border-purple-400/30">
              J
            </div>
            <div className="text-[11px] leading-tight">
              <p className="font-semibold text-white truncate">Henrique C.</p>
              <p className="text-[9px] text-emerald-400 font-medium">● Conectado Live</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
