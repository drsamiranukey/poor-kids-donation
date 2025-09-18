import React from 'react';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Founder & CEO',
      image: '/images/team/sarah.jpg',
      bio: 'Pediatrician with 15+ years of experience in child welfare and international development.'
    },
    {
      name: 'Michael Chen',
      role: 'Program Director',
      image: '/images/team/michael.jpg',
      bio: 'Former UN humanitarian coordinator with expertise in education and community development.'
    },
    {
      name: 'Aisha Patel',
      role: 'Operations Manager',
      image: '/images/team/aisha.jpg',
      bio: 'MBA in Non-profit Management with a passion for sustainable development initiatives.'
    },
    {
      name: 'James Rodriguez',
      role: 'Field Coordinator',
      image: '/images/team/james.jpg',
      bio: 'Social worker with extensive experience in rural community outreach programs.'
    }
  ];

  const milestones = [
    {
      year: '2018',
      title: 'Foundation Established',
      description: 'Started with a mission to help underprivileged children access basic necessities.'
    },
    {
      year: '2019',
      title: 'First School Built',
      description: 'Constructed our first school in rural Bangladesh, serving 200+ children.'
    },
    {
      year: '2020',
      title: 'Clean Water Initiative',
      description: 'Launched water purification program, providing clean water to 10,000+ people.'
    },
    {
      year: '2021',
      title: 'Nutrition Program',
      description: 'Started feeding program that now serves 5,000+ meals daily to malnourished children.'
    },
    {
      year: '2022',
      title: 'Healthcare Expansion',
      description: 'Opened 5 mobile health clinics serving remote communities.'
    },
    {
      year: '2023',
      title: 'Global Reach',
      description: 'Expanded operations to 15 countries across Asia, Africa, and South America.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About Our Mission
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-4xl mx-auto">
              Dedicated to creating a world where every child has access to education, 
              clean water, nutritious food, and healthcare
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                We believe that every child deserves a chance at a better future, regardless of 
                where they are born or the circumstances they face. Our mission is to break the 
                cycle of poverty by providing essential resources and opportunities to the world's 
                most vulnerable children.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Through sustainable programs in education, healthcare, nutrition, and clean water 
                access, we work directly with communities to create lasting change that empowers 
                children and their families to build brighter futures.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">50,000+</div>
                  <div className="text-gray-600">Children Helped</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">15</div>
                  <div className="text-gray-600">Countries</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-primary-100 rounded-lg p-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">🌟</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                  <p className="text-gray-700">
                    A world where every child has the opportunity to reach their full potential, 
                    free from the constraints of poverty, hunger, and lack of education.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do and shape how we approach our work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Transparency</h3>
              <p className="text-gray-600">
                We maintain complete transparency in our operations, finances, and impact reporting.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-3xl">💪</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Empowerment</h3>
              <p className="text-gray-600">
                We work with communities to build their capacity for long-term self-sufficiency.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sustainability</h3>
              <p className="text-gray-600">
                Our programs are designed to create lasting change that continues beyond our involvement.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-3xl">❤️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Compassion</h3>
              <p className="text-gray-600">
                We approach every situation with empathy, respect, and genuine care for those we serve.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From humble beginnings to global impact - see how we've grown over the years
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-primary-200"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className={`relative flex items-center ${
                  index % 2 === 0 ? 'justify-start' : 'justify-end'
                }`}>
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="text-primary-600 font-bold text-lg mb-2">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary-600 rounded-full border-4 border-white shadow"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate professionals dedicated to making a difference in children's lives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <div className="text-6xl">👤</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <div className="text-primary-600 font-medium mb-3">
                    {member.role}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Impact by Numbers
            </h2>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Real results that demonstrate the power of collective action
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">50,000+</div>
              <div className="text-primary-100">Children Educated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">100,000+</div>
              <div className="text-primary-100">People with Clean Water</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">2M+</div>
              <div className="text-primary-100">Meals Provided</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">25,000+</div>
              <div className="text-primary-100">Medical Treatments</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;