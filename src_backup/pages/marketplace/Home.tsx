import React from 'react';
import { Button, Input, Card } from 'antd';
import { Search } from 'lucide-react';

const Home = () => (
  <div className="text-center py-20">
    <h1 className="text-5xl font-bold text-gray-900 mb-6">Global Engineering Marketplace</h1>
    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Source high-quality engineering products, components, and services from verified suppliers worldwide.</p>
    <div className="max-w-3xl mx-auto flex gap-4">
      <Input size="large" placeholder="Search for products or categories..." prefix={<Search className="text-gray-400" />} />
      <Button type="primary" size="large">Search</Button>
    </div>
  </div>
);
export default Home;
