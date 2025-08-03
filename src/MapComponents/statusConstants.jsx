// Status constants and utility functions
export const STATUS_CATEGORIES = {
  RUNNING: 'Running',
  INACTIVE: 'Inactive',
  IDLE: 'Idle', 
  STOP: 'Stop',
  WAITING: 'Waiting'
};

// Helper function to get status colors
export const getStatusColor = (status) => {
  switch (status) {
    case 'Running': return 'bg-green-100 text-green-800';
    case 'Idle': return 'bg-yellow-100 text-yellow-800';
    case 'Stop': return 'bg-red-100 text-red-800';
    case 'Waiting': return 'bg-blue-100 text-blue-800';
    case 'Inactive': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};