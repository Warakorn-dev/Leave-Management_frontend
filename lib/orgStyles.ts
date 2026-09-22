import {
  Building2,
  Users,
  Calculator,
  Shield,
  Megaphone,
  Headset,
  Monitor,
  FolderKanban,
  Briefcase,
  Crown,
  Star,
  Code,
  PenTool,
  type LucideIcon,
} from 'lucide-react';

export interface EntityStyle {
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

/** Icon/color picked from a department name (HR, Finance, Admin, ...), used across the organization pages. */
export const getDepartmentStyle = (name: string): EntityStyle => {
  const n = name.toLowerCase();
  if (n.includes('human') || n.includes('hr') || n.includes('personnel'))
    return {
      icon: Users,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    };
  if (n.includes('account') || n.includes('finance'))
    return {
      icon: Calculator,
      colorClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-100 dark:bg-rose-900/30',
    };
  if (n.includes('admin'))
    return {
      icon: Shield,
      colorClass: 'text-slate-600 dark:text-slate-400',
      bgClass: 'bg-slate-200 dark:bg-slate-800',
    };
  if (n.includes('sale') || n.includes('market'))
    return {
      icon: Megaphone,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    };
  if (n.includes('support') || n.includes('service'))
    return {
      icon: Headset,
      colorClass: 'text-cyan-600 dark:text-cyan-400',
      bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    };
  if (n.includes('it') || n.includes('information') || n.includes('tech'))
    return {
      icon: Monitor,
      colorClass: 'text-violet-600 dark:text-violet-400',
      bgClass: 'bg-violet-100 dark:bg-violet-900/30',
    };
  if (n.includes('project'))
    return {
      icon: FolderKanban,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    };
  return {
    icon: Building2,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
  };
};

/** Icon/color picked from a position name (Manager, Senior, Developer, ...), used across the organization pages. */
export const getPositionStyle = (name: string): EntityStyle => {
  const n = name.toLowerCase();
  if (
    n.includes('ceo') ||
    n.includes('director') ||
    n.includes('chief') ||
    n.includes('leader') ||
    n.includes('manager') ||
    n.includes('head')
  )
    return {
      icon: Crown,
      colorClass: 'text-amber-500 dark:text-amber-400',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    };
  if (n.includes('senior') || n.includes('sr'))
    return {
      icon: Star,
      colorClass: 'text-yellow-600 dark:text-yellow-400',
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    };
  if (n.includes('dev') || n.includes('program') || n.includes('engineer'))
    return {
      icon: Code,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    };
  if (n.includes('design') || n.includes('graphic'))
    return {
      icon: PenTool,
      colorClass: 'text-fuchsia-600 dark:text-fuchsia-400',
      bgClass: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    };
  if (n.includes('account') || n.includes('finance'))
    return {
      icon: Calculator,
      colorClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-100 dark:bg-rose-900/30',
    };
  if (
    n.includes('support') ||
    n.includes('service') ||
    n.includes('operator') ||
    n.includes('sso')
  )
    return {
      icon: Headset,
      colorClass: 'text-cyan-600 dark:text-cyan-400',
      bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    };
  if (n.includes('hr') || n.includes('human') || n.includes('personnel'))
    return {
      icon: Users,
      colorClass: 'text-violet-600 dark:text-violet-400',
      bgClass: 'bg-violet-100 dark:bg-violet-900/30',
    };
  return {
    icon: Briefcase,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
  };
};
