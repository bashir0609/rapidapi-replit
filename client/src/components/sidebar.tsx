import { useQuery } from "@tanstack/react-query";
import { ApiConfiguration } from "@/lib/types";
import ApiManagement from "./api-management";

export default function Sidebar() {
  const { data: configs = [] } = useQuery<ApiConfiguration[]>({
    queryKey: ["/api/configurations"],
  });

  const navItems = [
    { icon: "fas fa-search", label: "Lead Search", active: true },
    { icon: "fas fa-building", label: "Company Lookup", active: false },
    { icon: "fas fa-history", label: "Search History", active: false },
    { icon: "fas fa-bookmark", label: "Saved Results", active: false },
  ];

  const analyticsItems = [
    { icon: "fas fa-chart-bar", label: "Usage Stats" },
    { icon: "fas fa-download", label: "Exports" },
  ];

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-database text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">RapidAPI Lead Miner</h1>
            <p className="text-sm text-gray-500">Professional Lead Generation</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navItems.map((item, index) => (
            <a 
              key={index}
              href="#" 
              className={`sidebar-item ${item.active ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
            >
              <i className={`${item.icon} text-sm`}></i>
              <span>{item.label}</span>
            </a>
          ))}
        </div>

        <div className="pt-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Analytics
          </h3>
          <div className="space-y-1">
            {analyticsItems.map((item, index) => (
              <a 
                key={index}
                href="#" 
                className="sidebar-item sidebar-item-inactive"
              >
                <i className={`${item.icon} text-sm`}></i>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* API Management Panel */}
      <ApiManagement configs={configs} />
    </aside>
  );
}
