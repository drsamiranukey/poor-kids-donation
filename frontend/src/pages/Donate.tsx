import React, { useState, useEffect } from 'react';
import { DonationForm } from '../components/forms/DonationForm';
import { Campaign } from '../types';

const Donate: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API call
  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        title: 'Education for All',
        description: 'Help provide quality education to underprivileged children',
        targetAmount: 50000,
        currentAmount: 32500,
        imageUrl: '/images/education-campaign.jpg',
        category: 'education',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        beneficiaries: []
      },
      {
        id: '2',
        title: 'Clean Water Initiative',
        description: 'Bring clean drinking water to rural communities',
        targetAmount: 75000,
        currentAmount: 45000,
        imageUrl: '/images/water-campaign.jpg',
        category: 'health',
        status: 'active',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-20'),
        beneficiaries: []
      },
      {
        id: '3',
        title: 'Food Security Program',
        description: 'Provide nutritious meals to malnourished children',
        targetAmount: 30000,
        currentAmount: 18000,
        imageUrl: '/images/food-campaign.jpg',
        category: 'food',
        status: 'active',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-25'),
        beneficiaries: []
      }
    ];
    
    setTimeout(() => {
      setCampaigns(mockCampaigns);
      setLoading(false);
    }, 1000);
  }, []);

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Make a Difference Today
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
              Choose a campaign that speaks to your heart and help us create lasting change
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Campaign Selection */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Choose a Campaign
            </h2>
            
            <div className="space-y-6">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 ${
                    selectedCampaign?.id === campaign.id
                      ? 'ring-2 ring-primary-500 shadow-lg'
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {campaign.title}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {campaign.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">
                      {campaign.description}
                    </p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>
                          ${campaign.currentAmount.toLocaleString()} / ${campaign.targetAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${getProgressPercentage(campaign.currentAmount, campaign.targetAmount)}%`
                          }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-500 mt-1">
                        {getProgressPercentage(campaign.currentAmount, campaign.targetAmount).toFixed(1)}% funded
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* General Donation Option */}
            <div
              className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 mt-6 ${
                selectedCampaign === null
                  ? 'ring-2 ring-primary-500 shadow-lg'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedCampaign(null)}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  General Donation
                </h3>
                <p className="text-gray-600">
                  Support our overall mission and let us allocate your donation where it's needed most
                </p>
              </div>
            </div>
          </div>

          {/* Donation Form */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {selectedCampaign ? `Donate to: ${selectedCampaign.title}` : 'Make a Donation'}
              </h2>
              
              <DonationForm 
                campaignId={selectedCampaign?.id}
                campaignTitle={selectedCampaign?.title}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Impact Section */}
      <div className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how your donations create real change in communities around the world
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Education</h3>
              <p className="text-gray-600">
                $50 provides school supplies for one child for a full year
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-3xl">💧</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Clean Water</h3>
              <p className="text-gray-600">
                $100 provides clean water access for one family for six months
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-3xl">🍎</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nutrition</h3>
              <p className="text-gray-600">
                $25 provides nutritious meals for one child for a month
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate;