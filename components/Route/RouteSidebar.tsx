'use client';

import { useState } from 'react';
import {
  List,
  Checkbox,
  Tag,
  Button,
  Space,
  Typography,
  DatePicker,
  Dropdown,
  Card,
  Badge,
  Tooltip,
  Calendar,
  Modal,
} from 'antd';
import {
  EyeOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { RouteData } from '@/types/route';
import { useRouteStore } from '@/lib/stores/routeStore';
import dayjs, { Dayjs } from 'dayjs';
import type { MenuProps } from 'antd';

const { Title, Text } = Typography;

export default function RouteSidebar() {
  const {
    routes,
    selectedMonth,
    toggleRoute,
    selectRoute,
    setViewMode,
    setSelectedMonth,
    selectAllRoutes,
    deselectAllRoutes,
  } = useRouteStore();

  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const handleDayView = (route: RouteData) => {
    selectRoute(route);
    setViewMode('day');
  };

  const handleDateSelect = (date: Dayjs) => {
    // Find route for the selected date (using day of month as route ID)
    const dayOfMonth = date.date();
    const routeId = String(dayOfMonth).padStart(2, '0');
    const route = routes.find(r => r.id === routeId);

    if (route) {
      selectRoute(route);
      setViewMode('day');
      setCalendarModalOpen(false);
    }
  };

  const handleCalendarCellRender = (date: Dayjs) => {
    const dayOfMonth = date.date();
    const routeId = String(dayOfMonth).padStart(2, '0');
    const route = routes.find(r => r.id === routeId);

    if (route && date.month() === 8 && date.year() === 2025) { // September 2025
      return (
        <div className="text-xs">
          <Badge
            color={route.visible ? route.color : 'gray'}
            text={route.distance}
          />
        </div>
      );
    }
    return null;
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'Seleccionar todos',
      icon: <CheckCircleOutlined />,
      onClick: selectAllRoutes,
    },
    {
      key: '2',
      label: 'Deseleccionar todos',
      icon: <CloseCircleOutlined />,
      onClick: deselectAllRoutes,
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: 'Ver calendario',
      icon: <CalendarOutlined />,
      onClick: () => setCalendarModalOpen(true),
    },
  ];

  const visibleCount = routes.filter(r => r.visible).length;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <Space direction="vertical" className="w-full">
          <div className="flex justify-between items-center">
            <Title level={5} className="mb-0">Rutas del Mes</Title>
            <Dropdown menu={{ items: menuItems }} placement="bottomRight">
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </div>

          <Space.Compact className="w-full">
            <DatePicker
              value={selectedDate || dayjs('2025-09-15')}
              onChange={(date) => {
                if (date) {
                  setSelectedDate(date);
                  handleDateSelect(date);
                }
              }}
              format="DD/MM/YYYY"
              className="flex-1"
              placeholder="Seleccionar fecha"
              suffixIcon={<CalendarOutlined />}
              disabledDate={(current) => {
                // Only allow September 2025 dates
                return current.month() !== 8 || current.year() !== 2025;
              }}
            />
            <Button
              icon={<CalendarOutlined />}
              onClick={() => setCalendarModalOpen(true)}
            >
              Ver mes
            </Button>
          </Space.Compact>

          <div className="flex justify-between items-center">
            <Text type="secondary">
              {visibleCount} de {routes.length} rutas visibles
            </Text>
            <Space size="small">
              <Button
                size="small"
                type="link"
                onClick={selectAllRoutes}
              >
                Todas
              </Button>
              <Button
                size="small"
                type="link"
                onClick={deselectAllRoutes}
              >
                Ninguna
              </Button>
            </Space>
          </div>
        </Space>
      </div>

      <div className="flex-1 overflow-y-auto">
        <List
          dataSource={routes}
          renderItem={(route) => (
            <List.Item
              className={`hover:bg-gray-50 px-4 transition-colors cursor-pointer ${
                hoveredRoute === route.id ? 'bg-gray-50' : ''
              }`}
              onMouseEnter={() => setHoveredRoute(route.id)}
              onMouseLeave={() => setHoveredRoute(null)}
              onClick={() => handleDayView(route)}
              actions={[
                <Tooltip title="Ver detalles del día" key="view">
                  <Button
                    type="text"
                    size="small"
                    icon={<LoginOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayView(route);
                    }}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Checkbox
                    checked={route.visible}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleRoute(route.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: 8 }}
                  />
                }
                title={
                  <Space>
                    <Badge
                      color={route.color}
                      text={
                        <span className="font-medium">
                          {route.name}
                        </span>
                      }
                    />
                  </Space>
                }
                description={
                  <Space size="small">
                    <EnvironmentOutlined className="text-gray-400" />
                    <Text type="secondary">{route.distance}</Text>
                    {route.markers && route.markers.length > 0 && (
                      <>
                        <span className="text-gray-300">•</span>
                        <Text type="secondary">
                          {route.markers.length} paradas
                        </Text>
                      </>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>

      <Card className="m-4 shadow-sm">
        <Space direction="vertical" size="small" className="w-full">
          <Text strong>Resumen</Text>
          <div className="flex justify-between">
            <Text type="secondary">Total de rutas:</Text>
            <Text strong>{routes.length}</Text>
          </div>
          <div className="flex justify-between">
            <Text type="secondary">Distancia total:</Text>
            <Text strong>
              {routes
                .filter(r => r.visible)
                .reduce((acc, r) => acc + parseFloat(r.distance), 0)
                .toFixed(2)} Km
            </Text>
          </div>
        </Space>
      </Card>

      {/* Calendar Modal */}
      <Modal
        title="Seleccionar Fecha"
        open={calendarModalOpen}
        onCancel={() => setCalendarModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className="p-4">
          <Calendar
            fullscreen={false}
            value={dayjs('2025-09-15')}
            onSelect={handleDateSelect}
            cellRender={handleCalendarCellRender}
            validRange={[dayjs('2025-09-01'), dayjs('2025-09-30')]}
          />
          <div className="mt-4 text-sm text-gray-500">
            <Text type="secondary">
              Haz clic en cualquier fecha para ver los detalles de la ruta de ese día
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
}