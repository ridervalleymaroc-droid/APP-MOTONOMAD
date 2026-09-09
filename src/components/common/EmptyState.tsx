import React from 'react';
import { Plus, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C]/60 my-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#262626] text-[#D4A017] mb-4 border border-[#333333]">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-bold text-[#F4F4F2]">{title}</h3>
      <p className="text-sm text-[#C5C6C7] max-w-md mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors shadow-lg shadow-[#D4A017]/10"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
