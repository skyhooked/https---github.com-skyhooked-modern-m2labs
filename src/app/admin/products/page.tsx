import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';

export default function ProductManagement() {
  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="text-center py-20">
          <div className="text-6xl mb-6">🎸</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Management</h1>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            This module will allow you to manage your pedals, inventory, pricing, and product specifications.
          </p>
          
          <div className="bg-white rounded-lg border p-8 max-w-4xl mx-auto shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Coming Soon Features:</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Product Catalog</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Add/edit pedal specifications</li>
                  <li>• Upload multiple product images</li>
                  <li>• Manage product descriptions</li>
                  <li>• Set pricing and availability</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Inventory Management</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Track stock levels</li>
                  <li>• Low stock alerts</li>
                  <li>• Batch updates</li>
                  <li>• Sales reporting</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Expected completion: Q1 2025</p>
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}

