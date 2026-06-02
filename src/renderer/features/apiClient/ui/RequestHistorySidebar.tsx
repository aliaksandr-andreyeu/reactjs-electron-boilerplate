import React from 'react';

export interface HistorySidebarItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface RequestHistorySidebarProps {
  title: string;
  items: HistorySidebarItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}

export const RequestHistorySidebar: React.FC<RequestHistorySidebarProps> = ({
  title,
  items,
  selectedId,
  onSelect,
  emptyLabel = 'No history yet',
}) => {
  return (
    <div className="request-history-sidebar">
      <h3 className="request-history-sidebar__title">{title}</h3>
      {items.length === 0 ? (
        <p className="request-history-sidebar__empty">{emptyLabel}</p>
      ) : (
        <ul className="request-history-sidebar__list" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`request-history-sidebar__item${
                  selectedId === item.id ? ' request-history-sidebar__item--active' : ''
                }`}
                onClick={() => onSelect(item.id)}
              >
                {item.sublabel && (
                  <span className="request-history-sidebar__method">{item.sublabel}</span>
                )}
                <span className="request-history-sidebar__url">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
