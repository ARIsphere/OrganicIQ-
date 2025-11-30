import React from 'react';
import { BarChart3, FileText, LayoutDashboard, Search, Zap, Menu, X, Sparkles, CreditCard } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon, label }: { view: AppView; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view
          ? 'bg-slate-900 text-white shadow-md'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-50 flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            <BarChart3 size={18} />
           </div>
           <span className="font-bold text-lg text-slate-800">OrganicIQ</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-[65px] left-0 bottom-0 w-64 bg-white border-r border-slate-200 p-6 z-40 transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:top-0 lg:h-screen
      `}>
        <div className="hidden lg:flex items-center space-x-2 mb-10">
           <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            <BarChart3 size={18} />
           </div>
           <span className="font-bold text-xl text-slate-800">OrganicIQ</span>
        </div>

        <nav className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Platform</p>
          <NavItem view={AppView.DASHBOARD} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem view={AppView.KEYWORDS} icon={<Search size={20} />} label="Keyword Strategy" />
          <NavItem view={AppView.CONTENT} icon={<FileText size={20} />} label="Content Writer" />
          
          <div className="pt-6">
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Intelligence</p>
             <NavItem view={AppView.COMPETITORS} icon={<Zap size={20} />} label="Competitor Spy" />
             <NavItem view={AppView.AUDIT} icon={<Sparkles size={20} />} label="Site Audit" />
          </div>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-slate-900 rounded-xl p-4 text-white text-center shadow-lg shadow-slate-900/20">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-white">Free Plan</p>
              <span className="bg-slate-800 text-xs px-2 py-0.5 rounded text-slate-300">Starter</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mb-2">
              <div className="bg-blue-500 h-1.5 rounded-full w-3/4"></div>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 text-left">3/5 Audits Used</p>
            
            <button 
              onClick={() => {
                onNavigate(AppView.PRICING);
                setMobileMenuOpen(false);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-colors py-2 rounded-lg text-xs font-bold text-white shadow-md flex items-center justify-center"
            >
              <CreditCard size={14} className="mr-2"/> Upgrade to Pro
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 mt-16 lg:mt-0 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
           {children}
        </div>
      </main>
      
      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;