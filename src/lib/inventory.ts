export const InventoryUtils = {
    formatInventoryValue: (value: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
        }).format(value);
    },

    getStockStatusColor: (item: { currentStock: number; minStock: number }) => {
        if (item.currentStock === 0) return 'bg-red-100 text-red-800';
        if (item.currentStock <= item.minStock) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    },

    getStockStatusLabel: (item: { currentStock: number; minStock: number }) => {
        if (item.currentStock === 0) return 'Out of Stock';
        if (item.currentStock <= item.minStock) return 'Low Stock';
        return 'In Stock';
    }
};
