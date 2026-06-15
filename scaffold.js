const fs = require('fs');
const path = require('path');

// Basic templates based on file types
const templates = {
  page: `export default function Page() {\n  return (\n    <div className="p-6">\n      <h1 className="text-2xl font-bold mb-4">Page Component</h1>\n    </div>\n  );\n}`,
  layout: `export default function Layout({ children }) {\n  return (\n    <div className="w-full min-h-screen font-sans">\n      {children}\n    </div>\n  );\n}`,
  route: `import { NextResponse } from 'next/server';\n\nexport async function GET() {\n  return NextResponse.json({ message: 'Success' });\n}`,
  component: (name) => `import React from 'react';\n\nexport function ${name}() {\n  return <div>${name} Component</div>;\n}`,
  tsFile: `export {};`
};

const filesToFill = [
  // Auth & Dashboard Pages/Layouts
  { filePath: 'src/app/(auth)/login/page.tsx', content: templates.page },
  { filePath: 'src/app/(auth)/layout.tsx', content: templates.layout },
  { filePath: 'src/app/(dashboard)/layout.tsx', content: templates.layout },
  { filePath: 'src/app/(dashboard)/pos/page.tsx', content: templates.page },
  { filePath: 'src/app/(dashboard)/pos/new-order/page.tsx', content: templates.page },
  { filePath: 'src/app/(dashboard)/pos/void-order/page.tsx', content: templates.page },
  { filePath: 'src/app/(dashboard)/clock/page.tsx', content: templates.page },
  { filePath: 'src/app/(dashboard)/inventory/page.tsx', content: templates.page },
  { filePath: 'src/app/(dashboard)/products/page.tsx', content: templates.page },
  { filePath: 'src/app/(dashboard)/reports/sales/page.tsx', content: templates.page },
  { filePath: 'src/app/(dashboard)/reports/attendance/page.tsx', content: templates.page },
  { filePath: 'src/app/(dashboard)/staff/management/page.tsx', content: templates.page },
  { filePath: 'src/app/(dashboard)/staff/payroll/page.tsx', content: templates.page },
  { filePath: 'src/app/page.tsx', content: templates.page },
  { filePath: 'src/app/layout.tsx', content: templates.layout },
  { filePath: 'src/app/globals.css', content: '/* Global Styles */' },

  // API Routes
  { filePath: 'src/app/api/auth/route.ts', content: templates.route },
  { filePath: 'src/app/api/orders/route.ts', content: templates.route },
  { filePath: 'src/app/api/clock/route.ts', content: templates.route },
  { filePath: 'src/app/api/products/route.ts', content: templates.route },

  // UI Components
  { filePath: 'src/components/ui/Button.tsx', content: templates.component('Button') },
  { filePath: 'src/components/ui/Modal.tsx', content: templates.component('Modal') },
  { filePath: 'src/components/ui/Input.tsx', content: templates.component('Input') },
  { filePath: 'src/components/ui/Select.tsx', content: templates.component('Select') },
  { filePath: 'src/components/ui/Card.tsx', content: templates.component('Card') },
  { filePath: 'src/components/ui/Badge.tsx', content: templates.component('Badge') },

  // Feature Components
  { filePath: 'src/components/pos/ProductGrid.tsx', content: templates.component('ProductGrid') },
  { filePath: 'src/components/pos/Cart.tsx', content: templates.component('Cart') },
  { filePath: 'src/components/pos/OrderSummary.tsx', content: templates.component('OrderSummary') },
  { filePath: 'src/components/pos/PaymentModal.tsx', content: templates.component('PaymentModal') },
  { filePath: 'src/components/clock/CameraCapture.tsx', content: templates.component('CameraCapture') },
  { filePath: 'src/components/staff/StaffForm.tsx', content: templates.component('StaffForm') },
  { filePath: 'src/components/staff/ScheduleManager.tsx', content: templates.component('ScheduleManager') },
  { filePath: 'src/components/products/ProductForm.tsx', content: templates.component('ProductForm') },
  
  // Layout Components
  { filePath: 'src/components/layout/Sidebar.tsx', content: templates.component('Sidebar') },
  { filePath: 'src/components/layout/Header.tsx', content: templates.component('Header') },
  { filePath: 'src/components/layout/MobileNav.tsx', content: templates.component('MobileNav') },

  // Lib, Stores and Types
  { filePath: 'src/lib/supabase/client.ts', content: templates.tsFile },
  { filePath: 'src/lib/supabase/server.ts', content: templates.tsFile },
  { filePath: 'src/lib/supabase/middleware.ts', content: templates.tsFile },
  { filePath: 'src/lib/store/cartStore.ts', content: templates.tsFile },
  { filePath: 'src/lib/store/authStore.ts', content: templates.tsFile },
  { filePath: 'src/lib/utils/formatCurrency.ts', content: templates.tsFile },
  { filePath: 'src/lib/utils/dateUtils.ts', content: templates.tsFile },
  { filePath: 'src/lib/utils/constants.ts', content: templates.tsFile },
  { filePath: 'src/types/database.ts', content: templates.tsFile },
  { filePath: 'src/types/order.ts', content: templates.tsFile },
  { filePath: 'src/types/staff.ts', content: templates.tsFile },
  { filePath: 'src/middleware.ts', content: templates.tsFile },

  // Supabase & Project Root
  { filePath: 'supabase/migrations/001_initial_schema.sql', content: '-- Initial Schema' },
  { filePath: 'supabase/seed.sql', content: '-- Seed Data' },
  { filePath: 'public/logo.svg', content: '<svg></svg>' },
  { filePath: 'public/placeholder.png', content: '' },
  { filePath: 'tailwind.config.ts', content: templates.tsFile },
  { filePath: 'next.config.js', content: 'module.exports = {};' },
  { filePath: 'postcss.config.js', content: 'module.exports = {};' },
  { filePath: 'tsconfig.json', content: '{}' }
];

console.log(`Starting scaffolding for ${filesToFill.length} files...`);

filesToFill.forEach(item => {
  const absolutePath = path.join(__dirname, item.filePath);
  
  // Force create parent directory structure
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  
  // Write the file
  fs.writeFileSync(absolutePath, item.content, 'utf8');
  console.log(`✓ Created: ${item.filePath}`);
});

console.log('\n🚀 Success! All folders and files have been completely generated.');