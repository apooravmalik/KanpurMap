import { useState } from 'react';
import { STATUS_CATEGORIES } from './statusConstants';

// Status filter component - only exports component to satisfy ESLint
const StatusFilter = ({ selectedStatuses, onStatusChange, vehicleStatusCounts }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusToggle = (status) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    onStatusChange(newStatuses);
  };

  const allStatuses = Object.values(STATUS_CATEGORIES);
  const activeCount = selectedStatuses.length;
  const totalCount = activeCount === 0 ? 0 : Object.entries(vehicleStatusCounts)
    .filter(([status]) => selectedStatuses.includes(status))
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border text-black border-gray-300 rounded px-3 py-2 text-sm shadow-sm hover:bg-gray-50 flex items-center gap-2"
        style={{ zIndex: 390 }}
      >
        <span>
          Status ({activeCount === 0 ? 'All' : `${activeCount}/${allStatuses.length}`})
          {totalCount > 0 && ` - ${totalCount} vehicles`}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg min-w-48"
          style={{ zIndex: 401 }}
        >
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={() => onStatusChange([])}
              className="text-xs text-red-600 hover:text-red-800 mr-4"
            >
              Clear All
            </button>
            <button
              onClick={() => onStatusChange(allStatuses)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Select All
            </button>
          </div>
          
          {allStatuses.map((status) => {
            const count = vehicleStatusCounts[status] || 0;
            const isSelected = selectedStatuses.includes(status);
            
            return (
              <label
                key={status}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleStatusToggle(status)}
                  className="mr-2"
                />
                <span className="flex-1 text-gray-700">{status}</span>
                <span className="text-xs text-gray-500 ml-2">({count})</span>
              </label>
            );
          })}
          
          {Object.keys(vehicleStatusCounts).length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 text-center">
              No vehicles loaded
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusFilter;