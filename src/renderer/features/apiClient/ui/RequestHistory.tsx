import React from 'react';

interface HistoryItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface RequestHistoryProps {
  items: HistoryItem[];
  onSelect: (id: string) => void;
  emptyLabel?: string;
  selectId: string;
}

export const RequestHistory: React.FC<RequestHistoryProps> = ({
  items,
  onSelect,
  emptyLabel = 'History is empty',
  selectId,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="request-history">
      <label className="request-history__label" htmlFor={selectId}>
        History
      </label>
      <select
        id={selectId}
        className="request-history__select"
        defaultValue=""
        onChange={(e) => {
          const id = e.target.value;
          if (id) {
            onSelect(id);
            e.target.value = '';
          }
        }}
      >
        <option value="" disabled>
          {emptyLabel}
        </option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.sublabel ? `${item.sublabel} — ${item.label}` : item.label}
          </option>
        ))}
      </select>
    </div>
  );
};
