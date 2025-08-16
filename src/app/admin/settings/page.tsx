import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';

export default function Settings() {
  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="text-center py-20">
          <div className="text-6xl mb-6">⚙️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Settings</h1>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            This module will allow you to configure admin preferences, user permissions, and system settings.
          </p>
          
          <div className="bg-white rounded-lg border p-8 max-w-4xl mx-auto shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings Categories:</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">User Management</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Add/remove admin users</li>
                  <li>• Set role-based permissions</li>
                  <li>• Manage user sessions</li>
                  <li>• Two-factor authentication</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">System Configuration</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Site-wide settings</li>
                  <li>• Email server configuration</li>
                  <li>• Backup and restore</li>
                  <li>• Security settings</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Expected completion: Q3 2025</p>
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}

