import { hasPermission, canAccessRoute, UserRole, Permission, StaffRoleTag } from '../src/lib/rbac/roles';

async function runTests() {
    console.log("Running RBAC Logic Tests...\n");
    let passCount = 0;
    let failCount = 0;

    function assert(condition: boolean, testName: string) {
        if (condition) {
            console.log(`✅ PASS: ${testName}`);
            passCount++;
        } else {
            console.error(`❌ FAIL: ${testName}`);
            failCount++;
        }
    }

    // Test 1: Super Admin Permissions
    assert(
        hasPermission(UserRole.SUPER_ADMIN, Permission.TENANT_CREATE) === true,
        "SUPER_ADMIN should have 'tenants.create'"
    );
    assert(
        hasPermission(UserRole.SUPER_ADMIN, "system.manage") === true,
        "SUPER_ADMIN should have 'system.manage'"
    );
    assert(
        hasPermission(UserRole.SUPER_ADMIN, Permission.PRODUCT_CREATE) === false,
        "SUPER_ADMIN does not directly manage tenant products but uses impersonation implicitly" // Based on schema
    );

    // Test 2: Tenant Admin Permissions
    assert(
        hasPermission(UserRole.TENANT_ADMIN, Permission.PRODUCT_CREATE) === true,
        "TENANT_ADMIN should have 'products.create'"
    );
    assert(
        hasPermission(UserRole.TENANT_ADMIN, "settings.manage") === true,
        "TENANT_ADMIN should have 'settings.manage'"
    );
    assert(
        hasPermission(UserRole.TENANT_ADMIN, "system.read") === false,
        "TENANT_ADMIN should not have 'system.read'"
    );

    // Test 3: Staff with explicit roles (Tags from legacy mapping)
    assert(
        hasPermission("STAFF", "inventory.manage", "inventory_manager") === true,
        "STAFF tag 'inventory_manager' should resolve to INVENTORY_MANAGER and have 'inventory.manage'"
    );
    assert(
        hasPermission("STAFF", "products.read", "sales_executive") === true,
        "STAFF tag 'sales_executive' should resolve to SALES_STAFF and have 'products.read'"
    );
    assert(
        hasPermission("STAFF", "products.create", "sales_executive") === false,
        "STAFF tag 'sales_executive' should NOT have 'products.create'"
    );

    // Test 4: Dynamic parsing of new enums
    assert(
        hasPermission(UserRole.INVENTORY_MANAGER, Permission.INVENTORY_UPDATE) === true,
        "New ENUM UserRole.INVENTORY_MANAGER should have 'inventory.manage' mapping to INVENTORY_UPDATE"
    );

    // Test 5: Route Access Checking
    assert(
        canAccessRoute(UserRole.TENANT_ADMIN, "/dashboard/settings") === true,
        "TENANT_ADMIN can access '/dashboard/settings'"
    );
    assert(
        canAccessRoute(UserRole.INVENTORY_MANAGER, "/dashboard/warehouse") === true,
        "INVENTORY_MANAGER can access '/dashboard/warehouse'"
    );
    assert(
        canAccessRoute("STAFF", "/dashboard/warehouse", "sales_executive") === false,
        "SALES_EXECUTIVE (via tag) CANNOT access '/dashboard/warehouse'"
    );
    assert(
        canAccessRoute(UserRole.CUSTOMER, "/portal/orders") === true,
        "CUSTOMER can access '/portal/orders'"
    );
    assert(
        canAccessRoute(UserRole.CUSTOMER, "/dashboard/products") === false,
        "CUSTOMER CANNOT access '/dashboard/products'"
    );

    // Test 6: Legacy generic routes fallback
    assert(
        canAccessRoute(UserRole.TENANT_ADMIN, "/products") === true,
        "TENANT_ADMIN can access legacy '/products'"
    );
    // Re-check Customer logic. Customer has products.read, legacy route '/products' requires products.read
    assert(
        canAccessRoute(UserRole.CUSTOMER, "/products") === true,
        "CUSTOMER CAN access legacy '/products' because they have 'products.read'"
    );

    // Test 7: Parent route traversal logic
    // Role 'sales_staff' doesn't have 'products.create', route is '/dashboard/products/create'
    assert(
        canAccessRoute("STAFF", "/dashboard/products/create", "sales_executive") === false,
        "SALES_EXECUTIVE CANNOT access '/dashboard/products/create'"
    );

    console.log(`\nTests Complete. ${passCount} Passed, ${failCount} Failed.\n`);

    if (failCount > 0) {
        process.exit(1);
    }
}

runTests().catch(console.error);
