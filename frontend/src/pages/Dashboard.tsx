import React, { useState, useEffect } from 'react';
import { Donation, User } from '../types';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'impact' | 'settings'>('overview');

  // Mock data - replace with API calls
  useEffect(() => {
    const mockUser: User = {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      createdAt: new Date('2023-01-15'),
      totalDonated: 2500,
      donationCount: 8
    };

    const mockDonations: Donation[] = [
      {
        id: '1',
        userId: '1',
        amount: 500,
        currency: 'USD',
        campaignId: '1',
        campaignTitle: 'Education for All',
        status: 'completed',
        paymentMethod: 'credit_card',
        isAnonymous: false,
        isRecurring: true,
        recurringFrequency: 'monthly',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        userId: '1',
        amount: 250,
        currency: 'USD',
        campaignId: '2',
        campaignTitle: 'Clean Water Initiative',
        status: 'completed',
        paymentMethod: 'paypal',
        isAnonymous: false,
        isRecurring: false,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      },
      {
        id: '3',
        userId: '1',
        amount: 100,
        currency: 'USD',
        campaignTitle: 'Food Security Program',
        status: 'completed',
        paymentMethod: 'credit_card',
        isAnonymous: true,
        isRecurring: false,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05')
      }
    ];

    setTimeout(() => {
      setUser(mockUser);
      setDonations(mockDonations);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-8">You need to be logged in to view your dashboard.</p>
          <button className="bg-primary-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-700">
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Thank you for your continued support in making a difference.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  ${user.totalDonated?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Donated</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'donations', label: 'My Donations' },
              { id: 'impact', label: 'My Impact' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-primary-100 rounded-full p-3">
                    <span className="text-2xl">💝</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {user.donationCount}
                    </div>
                    <div className="text-gray-600">Total Donations</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-3">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">50</div>
                    <div className="text-gray-600">Children Educated</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-3">
                    <span className="text-2xl">💧</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">25</div>
                    <div className="text-gray-600">Families with Clean Water</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {donations.slice(0, 3).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="bg-primary-100 rounded-full p-2 mr-3">
                          <span className="text-sm">💝</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            ${donation.amount} donation
                          </div>
                          <div className="text-sm text-gray-500">
                            {donation.campaignTitle || 'General Fund'} • {formatDate(donation.createdAt)}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                        {donation.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Donation History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {donations.map((donation) => (
                    <tr key={donation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(donation.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donation.campaignTitle || 'General Fund'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${donation.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donation.isRecurring ? `Recurring (${donation.recurringFrequency})` : 'One-time'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                          {donation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Impact Tab */}
        {activeTab === 'impact' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Impact Story</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">50</div>
                  <div className="text-gray-600">Children Educated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">25</div>
                  <div className="text-gray-600">Families with Clean Water</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">1,200</div>
                  <div className="text-gray-600">Meals Provided</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">15</div>
                  <div className="text-gray-600">Medical Treatments</div>
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Impact Updates
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-primary-600 rounded-full p-1 mr-3 mt-1">
                      <span className="text-white text-xs">📚</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        New School Opened in Bangladesh
                      </div>
                      <div className="text-sm text-gray-600">
                        Thanks to donors like you, we opened a new school serving 200 children in rural Bangladesh.
                      </div>
                      <div className="text-xs text-gray-500 mt-1">2 days ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-600 rounded-full p-1 mr-3 mt-1">
                      <span className="text-white text-xs">💧</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        Clean Water System Completed
                      </div>
                      <div className="text-sm text-gray-600">
                        Your contributions helped complete a water purification system serving 500 families.
                      </div>
                      <div className="text-xs text-gray-500 mt-1">1 week ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    readOnly
                  />
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Notification Preferences
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="email-updates"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="email-updates" className="ml-2 block text-sm text-gray-900">
                        Email updates about my donations and impact
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="newsletter"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-900">
                        Monthly newsletter with organization updates
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="campaign-alerts"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="campaign-alerts" className="ml-2 block text-sm text-gray-900">
                        Alerts about new campaigns and urgent needs
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <button className="bg-primary-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-primary-700 mr-4">
                    Save Changes
                  </button>
                  <button className="text-gray-600 hover:text-gray-800">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;