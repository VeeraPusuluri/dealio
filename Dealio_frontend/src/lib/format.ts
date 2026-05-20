export const formatCurrency = (amount: number): string => {
  return '₹' + amount.toLocaleString('en-IN');
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    builder: '#0A7E8C', cp: '#E87722', customer: '#16A34A',
    bank: '#2E5D8E', vendor: '#7B5E3A', landowner: '#C0392B', admin: '#6B3FA0', nri: '#F5A623',
  };
  return colors[role] || '#1B3A5C';
};
