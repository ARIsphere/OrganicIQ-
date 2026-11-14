import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Search,
  FileText,
  Radar,
  ShieldAlert,
  CreditCard,
  Menu,
  X,
  ArrowLeft,
  Plus,
  LogIn,
  LogOut,
} from 'lucide-react';
import { AppView, WorkspaceState } from '../types';
import { useAuth } from '../src/context/AuthContext';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  workspace: WorkspaceState;
  children: React.ReactNode;
}

const VIEW_LABELS: Record<AppView, string> = {
  [AppView.OVERVIEW]: 'Overview',
  [AppView.DASHBOARD]: 'Dashboard',
  [AppView.AUTOPILOT]: 'Autopilot & Brand Voice',
  [AppView.KEYWORDS]: 'Keyword Strategy',
  [AppView.CONTENT]: 'Content Studio',
  [AppView.COMPETITORS]: 'Competitor Spy',
  [AppView.AUDIT]: 'Site Audit',
  [AppView.PRICING]: 'Plans & Billing',
};

const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, workspace, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, signingIn, authError, signInWithGoogle, signOut } = useAuth();

  const NavItem = ({
    view,
    icon,
    label,
  }: {
    view: AppView;
    icon: React.ReactNode;
    label: string;
  }) => {
    const active = currentView === view;
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate(view);
          setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
          active
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 px-4 z-50 flex justify-between items-center">
        <button
          type="button"
          onClick={() => onNavigate(AppView.OVERVIEW)}
          className="font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          OrganicIQ
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar (256px fixed on desktop) */}
      <aside
        className={`fixed lg:sticky top-14 lg:top-0 left-0 bottom-0 w-64 h-[calc(100vh-3.5rem)] lg:h-screen bg-white border-r border-slate-200 flex flex-col justify-between p-5 z-40 transform transition-transform duration-200 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6 overflow-y-auto">
          <div className="hidden lg:flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => onNavigate(AppView.OVERVIEW)}
              className="font-bold text-xl tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              OrganicIQ
            </button>
          </div>

          {/* Active Brand Context */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-xs font-medium text-slate-500">Active Site</p>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {workspace.brandProfile.brandName || 'Configure Brand'}
            </p>
            <p className="text-xs font-mono text-slate-500 truncate">
              {workspace.brandProfile.domain || 'No domain set'}
            </p>
          </div>

          <nav className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 px-3.5 pb-1">Autopilot</p>
              <NavItem view={AppView.DASHBOARD} icon={<LayoutDashboard size={17} />} label="Dashboard" />
              <NavItem view={AppView.AUTOPILOT} icon={<Bot size={17} />} label="Autopilot & Brand" />
              <NavItem view={AppView.CONTENT} icon={<FileText size={17} />} label="Content Studio" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 px-3.5 pb-1">Research &amp; Audits</p>
              <NavItem view={AppView.KEYWORDS} icon={<Search size={17} />} label="Keyword Strategy" />
              <NavItem view={AppView.COMPETITORS} icon={<Radar size={17} />} label="Competitor Spy" />
              <NavItem view={AppView.AUDIT} icon={<ShieldAlert size={17} />} label="Site Audit" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 px-3.5 pb-1">Account</p>
              <NavItem view={AppView.PRICING} icon={<CreditCard size={17} />} label="Plans & Billing" />
            </div>
          </nav>
        </div>

        {/* Bottom Account & Workspace Summary */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          {user ? (
            <div className="px-1 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user.displayName || 'Google Account'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                title="Sign out"
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md shrink-0 cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={signingIn}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <LogIn size={14} />
                {signingIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
              {authError && (
                <p className="text-[11px] text-red-600 leading-snug px-1">{authError}</p>
              )}
            </div>
          )}

          <div className="px-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{workspace.planTier}</span>
            <button
              type="button"
              onClick={() => onNavigate(AppView.PRICING)}
              className="font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Manage
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              onNavigate(AppView.OVERVIEW);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            Product Overview
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        {/* Contextual Workspace Top Header */}
        <header className="hidden lg:flex items-center justify-between gap-8 px-8 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
            <span className="truncate">{workspace.brandProfile.domain || 'Workspace'}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-900 truncate">{VIEW_LABELS[currentView]}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(currentView === AppView.CONTENT ? AppView.AUDIT : AppView.CONTENT)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus size={14} />
              {currentView === AppView.CONTENT ? 'Run Site Audit' : 'New Article'}
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/25 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;