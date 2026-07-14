import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { Users, Building2, DollarSign } from 'lucide-react';

const AdminDashboard = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Platform Overview</h2>
    <Row gutter={16}>
      <Col span={8}>
        <Card>
          <Statistic title="Total Organizations" value={1128} prefix={<Building2 className="mr-2" size={20} />} />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic title="Total Users" value={9384} prefix={<Users className="mr-2" size={20} />} />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic title="Total GMV (YTD)" value={112893} prefix={<DollarSign className="mr-2" size={20} />} />
        </Card>
      </Col>
    </Row>
  </div>
);
export default AdminDashboard;
