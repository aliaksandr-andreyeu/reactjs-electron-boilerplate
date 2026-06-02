import React from 'react';
import {
  RequestHistorySidebar,
  type HistorySidebarItem,
} from './RequestHistorySidebar';

interface ApiWorkspaceProps {
  sidebarTitle: string;
  historyItems: HistorySidebarItem[];
  selectedHistoryId?: string | null;
  onSelectHistory: (id: string) => void;
  historyEmptyLabel?: string;
  children: React.ReactNode;
}

export const ApiWorkspace: React.FC<ApiWorkspaceProps> = ({
  sidebarTitle,
  historyItems,
  selectedHistoryId,
  onSelectHistory,
  historyEmptyLabel,
  children,
}) => {
  return (
    <div className="api-workspace">
      <aside className="api-workspace__sidebar">
        <RequestHistorySidebar
          title={sidebarTitle}
          items={historyItems}
          selectedId={selectedHistoryId}
          onSelect={onSelectHistory}
          emptyLabel={historyEmptyLabel}
        />
      </aside>
      <div className="api-workspace__main">{children}</div>
    </div>
  );
};
