import React from 'react';
import { Heart, Users, Globe, Award, ArrowRight, DollarSign } from 'lucide-react';

const Home: React.FC = () => {
  const stats = [
    { icon: Users, label: 'Children Helped', value: '12,450+' },
    { icon: Globe, label: 'Countries Reached', value: '25+' },
    { icon: DollarSign, label: 'Funds Raised', value: '$2.8M+' },
    { icon: Award, label: 'Success Stories', value: '8,900+' }
  ];

  const campaigns = [
    {
      id: 1,
      title: 'Education for Rural Children',
      description: 'Providing school supplies and educational resources to children in remote villages.',
      raised: 75000,
      goal: 100000,
      image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      title: 'Clean Water Initiative',
      description: 'Building wells and water purification systems in underserved communities.',
      raised: 45000,
      goal: 80000,
      image: 'https://images.unsplash.com/photo-1541544181051-e46607bc22a4?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      title: 'Healthcare Access Program',
      description: 'Mobile clinics and medical supplies for children without healthcare access.',
      raised: 32000,
      goal: 60000,
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Every Child Deserves a
              <span className="text-yellow-300"> Bright Future</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Join us in transforming lives through education, healthcare, and hope. 
              Your donation can change a child's world forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center">
                <Heart className="mr-2 h-5 w-5" />
                Donate Now
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Global Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Together, we've made a real difference in children's lives around the world
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <stat.icon className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Campaigns
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Support these urgent causes and help us reach our goals
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {campaigns.map((campaign) => {
              const progress = (campaign.raised / campaign.goal) * 100;
              return (
                <div key={campaign.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <img 
                    src={campaign.image} 
                    alt={campaign.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {campaign.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {campaign.description}
                    </p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Raised: ${campaign.raised.toLocaleString()}</span>
                        <span>Goal: ${campaign.goal.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {progress.toFixed(1)}% funded
                      </div>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                      Support This Cause
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Your donation, no matter the size, can transform a child's life. 
            Join thousands of donors who are already making an impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105">
              Start Donating Today
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all">
              Become a Monthly Donor
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;