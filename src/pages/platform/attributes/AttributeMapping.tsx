import React, { useState, useMemo, useEffect } from 'react';
import { Table as AntTable, Tabs as AntTabs, Button as AntButton, Input as AntInput, message } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { catalogDb } from '../../../data/catalog';

const { TabPane } = AntTabs;

const AttributeMapping: React.FC = () => {
  const breadcrumbs = useMemo(() => [
    { title: <Link to="/p/dashboard" className="text-gray-500 hover:text-sky-600 transition-colors">Platform</Link>, url: '/p/dashboard' },
    { title: <span className="text-gray-500">Taxonomies</span> },
    { title: <span className="text-gray-900 font-semibold">Mapping Matrix</span> }
  ], []);

  useBreadcrumb(breadcrumbs);

  const GROUPS = useLiveQuery(() => catalogDb.attributeGroups.toArray()) || [];
  const ATTRIBUTES = useLiveQuery(() => catalogDb.attributes.toArray()) || [];
  const VALUES = useLiveQuery(() => catalogDb.attributeValues.toArray()) || [];
  
  // Mappings state
  const [groupToAttr, setGroupToAttr] = useState<Record<string, string[]>>({});
  const [attrToValue, setAttrToValue] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (GROUPS.length > 0 && Object.keys(groupToAttr).length === 0) {
      const gMap: Record<string, string[]> = {};
      GROUPS.forEach(g => gMap[g.id] = g.attributeIds || []);
      setGroupToAttr(gMap);
      if (!selectedGroupId) setSelectedGroupId(GROUPS[0].id);
    }
    if (ATTRIBUTES.length > 0 && Object.keys(attrToValue).length === 0) {
      const aMap: Record<string, string[]> = {};
      ATTRIBUTES.forEach(a => aMap[a.id] = a.valueIds || []);
      setAttrToValue(aMap);
      if (!selectedAttrId) setSelectedAttrId(ATTRIBUTES[0].id);
    }
  }, [GROUPS, ATTRIBUTES]);

  // Tab 1 state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [attrSearchTab1, setAttrSearchTab1] = useState('');

  // Tab 2 state
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null);
  const [attrSearchTab2, setAttrSearchTab2] = useState('');
  const [valSearch, setValSearch] = useState('');

  const saveMappings = async () => {
    try {
      // Save groupToAttr
      const groupUpdates = Object.entries(groupToAttr).map(([id, attrIds]) => catalogDb.attributeGroups.update(id, { attributeIds: attrIds }));
      await Promise.all(groupUpdates);

      // Save attrToValue
      const attrUpdates = Object.entries(attrToValue).map(([id, valIds]) => catalogDb.attributes.update(id, { valueIds: valIds }));
      await Promise.all(attrUpdates);

      message.success('Large-scale taxonomy mappings saved successfully to Database');
    } catch (e) {
      message.error('Failed to save mappings');
    }
  };

  // ----------------------------------------------------
  // TAB 1: Groups (Master) <-> Attributes (Detail)
  // ----------------------------------------------------
  const filteredGroups = useMemo(() => GROUPS.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase())), [GROUPS, groupSearch]);
  const filteredAttrsTab1 = useMemo(() => ATTRIBUTES.filter(a => a.name.toLowerCase().includes(attrSearchTab1.toLowerCase())), [ATTRIBUTES, attrSearchTab1]);

  const handleGroupAttrChange = (selectedRowKeys: React.Key[]) => {
    if (!selectedGroupId) return;
    setGroupToAttr({ ...groupToAttr, [selectedGroupId]: selectedRowKeys as string[] });
  };

  // ----------------------------------------------------
  // TAB 2: Attributes (Master) <-> Values (Detail)
  // ----------------------------------------------------
  const filteredAttrsTab2 = useMemo(() => ATTRIBUTES.filter(a => a.name.toLowerCase().includes(attrSearchTab2.toLowerCase())), [ATTRIBUTES, attrSearchTab2]);
  const filteredValues = useMemo(() => VALUES.filter(v => v.value.toLowerCase().includes(valSearch.toLowerCase())), [VALUES, valSearch]);

  const handleAttrValChange = (selectedRowKeys: React.Key[]) => {
    if (!selectedAttrId) return;
    setAttrToValue({ ...attrToValue, [selectedAttrId]: selectedRowKeys as string[] });
  };

  return (
    <div className="w-full max-w-7xl pb-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Mapping Matrix</h1>
          <p className="text-gray-500">Master-detail view optimized for bulk mapping across thousands of records.</p>
        </div>
        <AntButton type="primary" className="bg-sky-600 flex items-center gap-2" size="large" onClick={saveMappings}>
          <Lucide.Save size={16} /> Save Mappings
        </AntButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <AntTabs defaultActiveKey="1" className="px-4 py-2">
          
          <TabPane tab="Groups ↔ Attributes" key="1">
            <div className="flex flex-col lg:flex-row gap-6 mt-4 h-[600px]">
              
              {/* MASTER PANE: GROUPS */}
              <div className="w-full lg:w-1/2 flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="p-3 border-b border-gray-200 bg-white">
                  <h3 className="font-semibold text-gray-700 mb-2">1. Select a Group</h3>
                  <AntInput 
                    placeholder="Search groups..." 
                    prefix={<Lucide.Search size={14} className="text-gray-400" />}
                    value={groupSearch}
                    onChange={e => setGroupSearch(e.target.value)}
                    allowClear
                  />
                </div>
                <div className="flex-1 overflow-auto bg-white p-2">
                  <AntTable 
                    columns={[{ title: 'Group Name', dataIndex: 'name', key: 'name' }]} 
                    dataSource={filteredGroups} 
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10','50','100'] }}
                    showHeader={false}
                    size="small"
                    rowClassName={(record) => record.id === selectedGroupId ? 'bg-sky-50 cursor-pointer' : 'cursor-pointer hover:bg-gray-100 transition-colors'}
                    onRow={(record) => ({
                      onClick: () => setSelectedGroupId(record.id),
                    })}
                  />
                </div>
              </div>

              {/* DETAIL PANE: ATTRIBUTES */}
              <div className="w-full lg:w-1/2 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-3 border-b border-gray-200 bg-sky-50">
                  <h3 className="font-semibold text-sky-800 mb-2">2. Map Attributes to "{GROUPS.find(g => g.id === selectedGroupId)?.name}"</h3>
                  <AntInput 
                    placeholder="Search thousands of attributes..." 
                    prefix={<Lucide.Search size={14} className="text-gray-400" />}
                    value={attrSearchTab1}
                    onChange={e => setAttrSearchTab1(e.target.value)}
                    allowClear
                  />
                </div>
                <div className="flex-1 overflow-auto bg-white p-2">
                  <AntTable 
                    rowSelection={{
                      type: 'checkbox',
                      selectedRowKeys: selectedGroupId ? (groupToAttr[selectedGroupId] || []) : [],
                      onChange: handleGroupAttrChange,
                      preserveSelectedRowKeys: true,
                    }}
                    columns={[{ title: 'Global Attribute', dataIndex: 'name', key: 'name' }]} 
                    dataSource={filteredAttrsTab1} 
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10','50','100'] }}
                    size="small"
                  />
                </div>
              </div>

            </div>
          </TabPane>

          <TabPane tab="Attributes ↔ Values" key="2">
            <div className="flex flex-col lg:flex-row gap-6 mt-4 h-[600px]">
              
              {/* MASTER PANE: ATTRIBUTES */}
              <div className="w-full lg:w-1/2 flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="p-3 border-b border-gray-200 bg-white">
                  <h3 className="font-semibold text-gray-700 mb-2">1. Select an Attribute</h3>
                  <AntInput 
                    placeholder="Search attributes..." 
                    prefix={<Lucide.Search size={14} className="text-gray-400" />}
                    value={attrSearchTab2}
                    onChange={e => setAttrSearchTab2(e.target.value)}
                    allowClear
                  />
                </div>
                <div className="flex-1 overflow-auto bg-white p-2">
                  <AntTable 
                    columns={[{ title: 'Attribute Name', dataIndex: 'name', key: 'name' }]} 
                    dataSource={filteredAttrsTab2} 
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10','50','100'] }}
                    showHeader={false}
                    size="small"
                    rowClassName={(record) => record.id === selectedAttrId ? 'bg-purple-50 cursor-pointer' : 'cursor-pointer hover:bg-gray-100 transition-colors'}
                    onRow={(record) => ({
                      onClick: () => setSelectedAttrId(record.id),
                    })}
                  />
                </div>
              </div>

              {/* DETAIL PANE: VALUES */}
              <div className="w-full lg:w-1/2 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-3 border-b border-gray-200 bg-purple-50">
                  <h3 className="font-semibold text-purple-800 mb-2">2. Map Values to "{ATTRIBUTES.find(a => a.id === selectedAttrId)?.name}"</h3>
                  <AntInput 
                    placeholder="Search thousands of values..." 
                    prefix={<Lucide.Search size={14} className="text-gray-400" />}
                    value={valSearch}
                    onChange={e => setValSearch(e.target.value)}
                    allowClear
                  />
                </div>
                <div className="flex-1 overflow-auto bg-white p-2">
                  <AntTable 
                    rowSelection={{
                      type: 'checkbox',
                      selectedRowKeys: selectedAttrId ? (attrToValue[selectedAttrId] || []) : [],
                      onChange: handleAttrValChange,
                      preserveSelectedRowKeys: true,
                    }}
                    columns={[{ title: 'Global Value', dataIndex: 'value', key: 'value' }]} 
                    dataSource={filteredValues} 
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10','50','100'] }}
                    size="small"
                  />
                </div>
              </div>

            </div>
          </TabPane>

        </AntTabs>
      </div>
    </div>
  );
};

export default AttributeMapping;
