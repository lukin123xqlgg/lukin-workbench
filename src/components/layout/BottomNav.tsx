import { TABS, type TabKey } from './tabs';

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (key: TabKey) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-pink-50 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 flex-1 min-w-0 transition active:scale-90"
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                  isActive ? 'bg-pink-100' : ''
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? 'text-pink-500' : 'text-gray-400'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={`text-[10px] font-medium truncate ${
                  isActive ? 'text-pink-500' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
