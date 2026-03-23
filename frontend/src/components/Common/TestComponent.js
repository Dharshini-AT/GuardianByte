import React from 'react';

const TestComponent = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">
        GuardianByte Test Component
      </h1>
      <p className="text-gray-700 mb-2">
        If you can see this, the frontend is working!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-semibold text-blue-800">Frontend</h3>
          <p className="text-blue-600">React + Tailwind</p>
        </div>
        <div className="p-4 bg-green-100 rounded">
          <h3 className="font-semibold text-green-800">Backend</h3>
          <p className="text-green-600">Node.js + Express</p>
        </div>
        <div className="p-4 bg-purple-100 rounded">
          <h3 className="font-semibold text-purple-800">ML Service</h3>
          <p className="text-purple-600">Python + Flask</p>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
