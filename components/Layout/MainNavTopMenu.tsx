'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Space, Dropdown, Avatar, Badge, List } from 'antd';
import { UserOutlined, SettingOutlined, BellOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useRouter } from 'next/navigation';
import NumarisLogo from './NumarisLogo';

const { Header } = Layout;

interface MainNavTopMenuProps {
  selectedMenuItem?: string;
}

export default function MainNavTopMenu({ selectedMenuItem = 'monitoreo' }: MainNavTopMenuProps) {
  const router = useRouter();

  // Mock event notifications data based on eventos structure
  // IDs match the format used in EventosSidebar (event-0, event-1, etc.)
  const notifications = [
    {
      id: 'event-0',
      evento: 'Límite de velocidad excedido',
      description: 'Unidad Accord 43 excedió el límite en Av. Manuel Gómez Morín',
      fechaCreacion: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      severidad: 'Alta' as const,
      unread: true,
    },
    {
      id: 'event-16',
      evento: 'Mantenimiento programado',
      description: 'La unidad Toyota Camry requiere servicio en 500 km',
      fechaCreacion: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      severidad: 'Informativa' as const,
      unread: true,
    },
    {
      id: 'event-23',
      evento: 'Entrada a zona restringida',
      description: 'Unidad Honda Civic ingresó a zona no autorizada',
      fechaCreacion: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      severidad: 'Alta' as const,
      unread: false,
    },
    {
      id: 'event-14',
      evento: 'Batería baja',
      description: 'Dispositivo GPS de Ford Explorer con batería al 15%',
      fechaCreacion: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      severidad: 'Baja' as const,
      unread: false,
    },
    {
      id: 'event-5',
      evento: 'Exceso de velocidad',
      description: 'Unidad Nissan Sentra superó el límite permitido',
      fechaCreacion: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      severidad: 'Media' as const,
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Helper function to get relative time
  const getRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  };

  // Helper function to get severity icon and color
  const getSeverityStyle = (severidad: string) => {
    switch (severidad) {
      case 'Alta':
        return {
          icon: 'M240.26,186.1,152.81,34.23h0a28.74,28.74,0,0,0-49.62,0L15.74,186.1a27.45,27.45,0,0,0,0,27.71A28.31,28.31,0,0,0,40.55,228h174.9a28.31,28.31,0,0,0,24.79-14.19A27.45,27.45,0,0,0,240.26,186.1Zm-20.8,15.7a4.46,4.46,0,0,1-4,2.2H40.55a4.46,4.46,0,0,1-4-2.2,3.56,3.56,0,0,1,0-3.73L124,46.2a4.77,4.77,0,0,1,8,0l87.44,151.87A3.56,3.56,0,0,1,219.46,201.8ZM116,136V104a12,12,0,0,1,24,0v32a12,12,0,0,1-24,0Zm28,40a16,16,0,1,1-16-16A16,16,0,0,1,144,176Z',
          color: '#dc2626',
          bg: '#fef2f2'
        };
      case 'Media':
        return {
          icon: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z',
          color: '#ea580c',
          bg: '#fff7ed'
        };
      case 'Baja':
        return {
          icon: 'M224,48H32A16,16,0,0,0,16,64V176a16,16,0,0,0,16,16H80v24a8,8,0,0,0,16,0V192h64v24a8,8,0,0,0,16,0V192h48a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM32,176V64H224V176Z',
          color: '#2563eb',
          bg: '#eff6ff'
        };
      case 'Informativa':
        return {
          icon: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z',
          color: '#0891b2',
          bg: '#ecfeff'
        };
      default:
        return {
          icon: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z',
          color: '#6b7280',
          bg: '#f9fafb'
        };
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    // Navigate to eventos page with the event pre-selected
    router.push(`/eventos?eventId=${notificationId}`);
  };

  const topMenuItems: MenuProps['items'] = [
    { key: 'monitoreo', label: 'Monitoreo' },
    { key: 'unidades', label: 'Unidades' },
    { key: 'dispositivos', label: 'Dispositivos' },
    { key: 'zonas', label: 'Zonas' },
    { key: 'eventos', label: 'Eventos' },
    { key: 'reportes', label: 'Reportes' },
    { key: 'reglas', label: 'Reglas' },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Cerrar Sesión',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    switch (e.key) {
      case 'monitoreo':
        router.push('/monitoreo');
        break;
      case 'unidades':
        router.push('/');
        break;
      case 'dispositivos':
        router.push('/dispositivos');
        break;
      case 'zonas':
        router.push('/zonas');
        break;
      case 'eventos':
        router.push('/eventos');
        break;
      case 'reportes':
        router.push('/reportes');
        break;
      case 'reglas':
        router.push('/reglas');
        break;
      default:
        break;
    }
  };

  const handleUserMenuClick: MenuProps['onClick'] = (e) => {
    switch (e.key) {
      case 'profile':
        // Navigate to profile
        console.log('Navigate to profile');
        break;
      case 'settings':
        // Navigate to settings
        console.log('Navigate to settings');
        break;
      case 'logout':
        // Handle logout
        console.log('Logout');
        break;
      default:
        break;
    }
  };

  const notificationsContent = (
    <div style={{ width: '420px', maxHeight: '520px', backgroundColor: '#ffffff', borderRadius: '8px' }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff'
      }}>
        <span style={{ fontWeight: 600, fontSize: '16px', color: '#262626' }}>Notificaciones</span>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, height: 'auto', fontSize: '13px' }}
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>
      <div style={{ maxHeight: '420px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
        {notifications.map((item) => {
          const severityStyle = getSeverityStyle(item.severidad);
          return (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item.id)}
              style={{
                padding: '16px',
                cursor: 'pointer',
                backgroundColor: item.unread ? '#f6f9ff' : '#ffffff',
                borderBottom: '1px solid #f5f5f5',
                transition: 'background-color 0.2s',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = item.unread ? '#e6f4ff' : '#fafafa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = item.unread ? '#f6f9ff' : '#ffffff';
              }}
            >
              {/* Severity Icon */}
              <div style={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
                borderRadius: '8px',
                backgroundColor: severityStyle.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '2px'
              }}>
                <svg width="20" height="20" viewBox="0 0 256 256" fill={severityStyle.color}>
                  <path d={severityStyle.icon} />
                </svg>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: item.unread ? 600 : 500,
                    color: '#262626',
                    lineHeight: '20px'
                  }}>
                    {item.evento}
                  </span>
                  {item.unread && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#1867ff',
                      marginLeft: '8px',
                      marginTop: '6px',
                      flexShrink: 0
                    }} />
                  )}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#8c8c8c',
                  marginBottom: '6px',
                  lineHeight: '18px'
                }}>
                  {item.description}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#bfbfbf',
                  lineHeight: '16px'
                }}>
                  {getRelativeTime(item.fechaCreacion)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #f0f0f0',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '0 0 8px 8px'
      }}>
        <Button
          type="link"
          onClick={() => router.push('/eventos')}
          style={{ padding: 0, height: 'auto', fontSize: '14px', fontWeight: 500 }}
        >
          Ver todas las notificaciones
        </Button>
      </div>
    </div>
  );

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: '64px',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
        borderBottom: '1px solid #f0f0f0',
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <NumarisLogo />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Navigation Menu - Right aligned */}
      <Menu
        mode="horizontal"
        selectedKeys={[selectedMenuItem]}
        items={topMenuItems}
        onClick={handleMenuClick}
        style={{
          background: 'transparent',
          border: 'none',
          lineHeight: '64px',
          marginRight: '24px',
        }}
      />

      {/* User Menu */}
      <Space size="middle">
        <Button type="text" icon={<SettingOutlined />} />
        <Dropdown
          popupRender={() => notificationsContent}
          placement="bottomRight"
          trigger={['click']}
        >
          <Badge count={unreadCount} dot={unreadCount > 0} offset={[-3, 3]}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: '18px' }} />}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Badge>
        </Dropdown>
        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
          <Avatar
            style={{
              backgroundColor: '#f0f0f0',
              color: '#8c8c8c',
              cursor: 'pointer',
            }}
            icon={<UserOutlined />}
          >
            JP
          </Avatar>
        </Dropdown>
      </Space>
    </Header>
  );
}
