import { motion } from 'framer-motion';
import { MapPin, Activity, Shield, BarChart2 } from 'lucide-react';
import type { TabType } from '../types';

const tabs: { id: TabType; label: string; icon: typeof MapPin }[] = [
  { id: 'map', label: 'Map', icon: MapPin },
  { id: 'orchestration', label: 'Orchestration', icon: Activity },
  { id: 'council', label: 'Town Council', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/80 border-b border-slate-700/50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        );
      })}
    </div>
  );
}
