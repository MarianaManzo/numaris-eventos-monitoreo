'use client';

import { useState } from 'react';
import { List, Typography, DatePicker, Button, Tabs, Space, Tag } from 'antd';
import { CaretLeftOutlined, CaretRightOutlined, EnvironmentOutlined, ClockCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { RouteSegment } from '@/types/route';
import { useRouteStore } from '@/lib/stores/routeStore';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface DaySidebarProps {
  segments: RouteSegment[];
  onSegmentClick: (segment: RouteSegment) => void;
  selectedSegment: RouteSegment | null;
}

export default function DaySidebar({ segments, onSegmentClick, selectedSegment }: DaySidebarProps) {
  const { selectedRoute } = useRouteStore();
  const [activeTab, setActiveTab] = useState('trayectos');
  const [currentDate, setCurrentDate] = useState(dayjs('2025-09-01'));
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev'
      ? currentDate.subtract(1, 'day')
      : currentDate.add(1, 'day');
    setCurrentDate(newDate);
  };

  const stopPoints = segments.filter(s => s.type === 'stop').map((segment, index) => ({
    time: segment.timeRange.split(' - ')[0],
    duration: segment.duration,
    name: segment.location || segment.name,
    distance: segment.distance,
    id: segment.id,
  }));

  const trajectoryItems = segments.map(segment => ({
    time: segment.timeRange,
    duration: segment.duration,
    name: segment.name,
    location: segment.location,
    distance: segment.distance,
    type: segment.type,
    id: segment.id,
  }));

  const routeColor = selectedRoute?.color || '#1890ff';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        size="small"
      >
        <TabPane tab="Trayectos" key="trayectos" style={{ height: '100%', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '48px',
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: routeColor
            }} />

            {trajectoryItems.map((item, index) => {
              const isSelected = selectedSegment?.id === item.id;
              const isStop = item.type === 'stop';
              const isHovered = hoveredId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    const segment = segments.find(s => s.id === item.id);
                    if (segment) onSegmentClick(segment);
                  }}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    transition: 'background-color 0.15s',
                    backgroundColor: isSelected
                      ? `${routeColor}33`
                      : isHovered ? '#f3f4f6' : 'transparent',
                    borderLeft: isSelected ? `4px solid ${routeColor}` : '4px solid transparent',
                    position: 'relative',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '24px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        width: '4px',
                        backgroundColor: 'white',
                        zIndex: 10,
                        top: 0,
                        bottom: 0,
                        left: '44px'
                      }}
                    />
                  )}

                  {!isSelected && isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        width: '4px',
                        backgroundColor: 'white',
                        zIndex: 10,
                        top: 0,
                        bottom: 0,
                        left: '44px'
                      }}
                    />
                  )}

                  {isStop ? (
                    <div style={{ position: 'relative', flexShrink: 0, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" fill="none" stroke={routeColor} strokeWidth="2"/>
                        <rect x="8" y="8" width="8" height="8" fill={routeColor}/>
                      </svg>
                    </div>
                  ) : (
                    <div style={{ width: '16px', flexShrink: 0 }}></div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#111827'
                          }}>
                            {item.duration}
                          </Text>
                        </div>

                        {isStop ? (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                            <EnvironmentOutlined style={{ color: '#9ca3af', fontSize: '16px', marginTop: '2px', flexShrink: 0 }} />
                            <Text style={{
                              fontSize: 14,
                              color: '#6b7280',
                              lineHeight: 1.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {item.location}
                            </Text>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <ArrowRightOutlined style={{ color: '#9ca3af', fontSize: '16px' }} />
                            <Text strong style={{ fontSize: 14, color: '#374151' }}>
                              Traslado
                            </Text>
                            <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                              {item.distance}
                            </Text>
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right', marginLeft: '16px', flexShrink: 0 }}>
                        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                          {item.time}
                        </Text>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </TabPane>

        <TabPane tab="Registros" key="registros" style={{ height: '100%', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            <List
              dataSource={stopPoints}
              renderItem={(stop) => (
                <div className="py-3 border-b">
                  <div className="flex items-center justify-between mb-1">
                    <Text strong>{stop.time}</Text>
                    <Tag>{stop.duration}</Tag>
                  </div>
                  <Text className="block">{stop.name}</Text>
                  <Text type="secondary" className="text-xs">
                    {stop.distance}
                  </Text>
                </div>
              )}
            />
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}