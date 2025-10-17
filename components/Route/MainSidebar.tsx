'use client';

import { useState } from 'react';
import { List, Space, Typography, DatePicker, Select, Button } from 'antd';
import { CalendarOutlined, CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons';
import { RouteData } from '@/types/route';
import { useRouteStore } from '@/lib/stores/routeStore';
import dayjs, { Dayjs } from 'dayjs';

const { Text, Title } = Typography;

export default function MainSidebar() {
  const {
    routes,
    toggleRoute,
    selectRoute,
    setViewMode,
  } = useRouteStore();

  const [selectedMonth, setSelectedMonth] = useState(dayjs('2025-09'));
  const [sortBy, setSortBy] = useState<'date' | 'distance'>('date');

  const handleDayClick = (route: RouteData) => {
    selectRoute(route);
    setViewMode('day');
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev'
      ? selectedMonth.subtract(1, 'month')
      : selectedMonth.add(1, 'month');
    setSelectedMonth(newMonth);
  };

  const sortedRoutes = [...routes].sort((a, b) => {
    if (sortBy === 'distance') {
      return parseFloat(b.distance) - parseFloat(a.distance);
    }
    return parseInt(a.id) - parseInt(b.id);
  });

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <Button
            type="text"
            icon={<CaretLeftOutlined />}
            onClick={() => handleMonthChange('prev')}
            size="small"
          />
          <Title level={5} className="mb-0">
            {selectedMonth.format('MMMM YYYY')}
          </Title>
          <Button
            type="text"
            icon={<CaretRightOutlined />}
            onClick={() => handleMonthChange('next')}
            size="small"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <Text type="secondary" className="text-xs">Fecha</Text>
        <Select
          size="small"
          value={sortBy}
          onChange={setSortBy}
          options={[
            { label: 'Distancia', value: 'distance' },
            { label: 'Fecha', value: 'date' },
          ]}
          style={{ width: 100 }}
        />
      </div>

      {/* Route List */}
      <div className="flex-1 overflow-y-auto">
        <List
          dataSource={sortedRoutes}
          renderItem={(route) => {
            const dayNumber = parseInt(route.id);
            const routeDate = dayjs(`2025-09-${route.id}`);
            const dayName = routeDate.format('dddd');

            return (
              <List.Item
                className="hover:bg-gray-50 cursor-pointer border-b px-4 py-2"
                onClick={() => handleDayClick(route)}
                style={{ borderLeft: `4px solid ${route.visible ? route.color : '#e5e7eb'}` }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={route.visible}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleRoute(route.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Text>
                          {dayNumber.toString().padStart(2, '0')} Septiembre, {dayName}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <Text type="secondary" className="text-sm">
                    {route.distance}
                  </Text>
                </div>
              </List.Item>
            );
          }}
        />
      </div>
    </div>
  );
}