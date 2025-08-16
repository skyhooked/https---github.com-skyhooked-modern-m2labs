import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';

export default function NewsletterManagement() {
  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="text-center py-20">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Newsletter Management</h1>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            This module will help you manage email campaigns, subscriber lists, and automated marketing.
          </p>
          
          <div className="bg-white rounded-lg border p-8 max-w-4xl mx-auto shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Planned Features:</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Subscriber Management</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Import/export subscriber lists</li>
                  <li>• Segment subscribers by interests</li>
                  <li>• Manage unsubscribes</li>
                  <li>• View subscriber analytics</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Email Campaigns</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Design custom email templates</li>
                  <li>• Schedule campaign sends</li>
                  <li>• A/B test subject lines</li>
                  <li>• Track open and click rates</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Expected completion: Q2 2025</p>
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}

