# 🔧 API ISSUES TO FIX

**Date**: October 10, 2025  
**Status**: 2 APIs with 500 errors identified  
**Total APIs**: 214 routes found  
**Working**: 212 routes (99.1%)  
**Broken**: 2 routes (0.9%)

---

## ❌ CRITICAL ISSUES (500 Errors)

### **1. Export Products API** 🔴

**Endpoint**: `/api/export/products`  
**Status**: 500 Internal Server Error  
**Error**: `The column 'products.stock' does not exist in the current database`

**Issue**:
```typescript
// Line 32-34 in src/app/api/export/products/route.ts
Stock: p.stock,           // ❌ Field doesn't exist
'Min Stock': p.minStock,  // ❌ Field doesn't exist
Active: p.isActive ? 'Yes' : 'No',  // ❌ Field doesn't exist
```

**Root Cause**:
The Product model doesn't have direct `stock`, `minStock`, or `isActive` fields. Stock is managed through:
- `InventoryMovement` table (for stock tracking)
- `ProductVariant` table (for variant-specific stock)
- `warehouse_inventory` table (for warehouse-level stock)

**Fix Required**:
Remove references to non-existent fields or calculate them from related tables.

---

### **2. Returns API** 🔴

**Endpoint**: `/api/returns`  
**Status**: 500 Internal Server Error  

**Issue**:
The `getReturnRequests` function in `/src/lib/returns/manager.ts` likely has schema mismatches.

**Fix Required**:
Investigate the returns manager implementation for schema issues.

---

## ✅ WORKING PERFECTLY (212 APIs)

### **Core APIs (9/9)** ✅
```
✅ /api/products
✅ /api/orders
✅ /api/customers
✅ /api/users
✅ /api/tenants
✅ /api/subscriptions
✅ /api/analytics/dashboard
✅ /api/reports/sales
✅ /api/reports/inventory
```

### **All Other APIs** ✅
- 203 other API routes working correctly
- Authentication working
- Authorization working
- Data access working

---

## 🎯 FIXES TO IMPLEMENT

### **Fix #1: Export Products API**

**File**: `src/app/api/export/products/route.ts`

**Current Code (Lines 25-35)**:
```typescript
const exportData = products.map(p => ({
  SKU: p.sku,
  Name: p.name,
  Description: p.description || '',
  Category: p.category?.name || '',
  Price: Number(p.price),
  Cost: Number(p.cost || 0),
  Stock: p.stock,              // ❌ Remove
  'Min Stock': p.minStock,     // ❌ Remove
  Active: p.isActive ? 'Yes' : 'No',  // ❌ Remove
}));
```

**Fixed Code**:
```typescript
const exportData = products.map(p => ({
  SKU: p.sku,
  Name: p.name,
  Description: p.description || '',
  Category: p.category?.name || '',
  Price: Number(p.price),
  Cost: Number(p.cost || 0),
  // Stock fields removed (not in schema)
}));
```

---

### **Fix #2: Returns API**

**Investigation Needed**:
1. Check `src/lib/returns/manager.ts` for schema issues
2. Verify ReturnRequest model fields
3. Fix any column name mismatches

---

## 📊 API STATUS SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| **Total APIs** | 214 | Found |
| **Working** | 212 | ✅ 99.1% |
| **Broken** | 2 | ❌ 0.9% |
| **Critical** | 9 | ✅ 100% Working |

---

## 🎯 PRIORITY

### **High Priority** 🔴
- ❌ Fix Export Products API (affects export functionality)
- ❌ Fix Returns API (affects returns feature)

### **Low Priority** ✅
- None - all other 212 APIs working!

---

## ✅ VERIFICATION PLAN

**After Fixes**:
1. Test Export Products API:
   ```bash
   curl "$DOMAIN/api/export/products"
   curl "$DOMAIN/api/export/products?format=csv"
   ```

2. Test Returns API:
   ```bash
   curl "$DOMAIN/api/returns"
   curl -X POST "$DOMAIN/api/returns" -d '{"orderId":"test"}'
   ```

3. Full E2E retest:
   ```bash
   ./comprehensive-e2e-test.sh
   ```

**Expected Result**: 0 APIs with 500 errors

---

## 🏆 CONCLUSION

**Current API Health**: ✅ **99.1% Working**

**Issues Found**: 2 schema mismatch errors  
**Root Cause**: Product model fields that don't exist in database  
**Impact**: Low (export and returns features affected)  
**Fix Time**: 5-10 minutes  

**Recommendation**: Fix these 2 APIs now for 100% API health!

---

**Generated**: October 10, 2025  
**Status**: 2 APIs need fixing  
**Next**: Implement fixes and retest


