import React from 'react';
import { Lightbulb, Target, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

interface KeyTakeawaysCardProps {
  items: string[];
  theme: GameTheme;
}

const getItemIcon = (text: string, theme: GameTheme) => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('warning') || lowerText.includes('avoid') || lowerText.includes("don't") || lowerText.includes('careful')) {
    return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  }

  if (lowerText.includes('focus') || lowerText.includes('priority') || lowerText.includes('goal') || lowerText.includes('aim')) {
    return <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />;
  }

  if (lowerText.includes('practice') || lowerText.includes('try') || lowerText.includes('start') || lowerText.includes('action')) {
    return <ArrowRight className="w-4 h-4 text-emerald-400" />;
  }

  if (lowerText.includes('remember') || lowerText.includes('keep') || lowerText.includes('always') || lowerText.includes('important')) {
    return <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />;
  }

  return <Lightbulb className="w-4 h-4" style={{ color: theme.colors.primary }} />;
};

const KeyTakeawaysCard: React.FC<KeyTakeawaysCardProps> = ({ items, theme }) => {
  if (!items || items.length === 0) return null;

  return (
    <div
      className="mt-4 rounded-xl overflow-hidden animate-slide-up"
      style={{
        backgroundColor: `${theme.colors.primary}08`,
        border: `1px solid ${theme.colors.primary}25`
      }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{
          backgroundColor: `${theme.colors.primary}12`,
          borderBottom: `1px solid ${theme.colors.primary}20`
        }}
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${theme.colors.primary}20` }}
        >
          <Lightbulb className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
        </div>
        <span
          className="text-sm font-semibold tracking-wide"
          style={{ color: theme.colors.primary }}
        >
          Key Takeaways
        </span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${theme.colors.primary}20`,
            color: theme.colors.primary
          }}
        >
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="p-3 space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-2.5 rounded-lg transition-colors hover:bg-white/5 group"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${theme.colors.primary}15` }}
            >
              {getItemIcon(item, theme)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 leading-relaxed">
                {item}
              </p>
            </div>
            <span
              className="text-xs font-mono opacity-40 mt-0.5"
              style={{ color: theme.colors.primary }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>

      <div
        className="px-4 py-2 text-center"
        style={{
          backgroundColor: `${theme.colors.primary}08`,
          borderTop: `1px solid ${theme.colors.primary}10`
        }}
      >
        <p className="text-xs text-gray-500">
          Focus on one takeaway at a time for best results
        </p>
      </div>
    </div>
  );
};

export default KeyTakeawaysCard;
