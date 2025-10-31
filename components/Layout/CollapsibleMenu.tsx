'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFilterStore } from '@/lib/stores/filterStore';
import { useFilterUiStore } from '@/lib/stores/filterUiStore';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

interface CollapsibleMenuProps {
  onSectionChange?: (section: string) => void;
  currentSection?: string;
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  highlightedMenuKeys?: string[];
}

export default function CollapsibleMenu({
  onSectionChange,
  currentSection = 'unidades',
  isCollapsed = true,
  onCollapse,
  highlightedMenuKeys
}: CollapsibleMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const appliedFilters = useFilterStore((state) => state.appliedFilters);
  const removableFilterCount = appliedFilters.filter((filter) => filter.removable !== false).length;
  const isBarOpen = useFilterUiStore((state) => state.isBarOpen);
  const toggleBar = useFilterUiStore((state) => state.toggleBar);

  const menuItems: MenuItem[] = [
    {
      key: 'unidades',
      label: 'Unidades',
      href: '/unidades',
      icon: (
        <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
          <path d="M240,104H229.2L201.42,41.5A16,16,0,0,0,186.8,32H69.2a16,16,0,0,0-14.62,9.5L26.8,104H16a8,8,0,0,0,0,16h8v80a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V184h96v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V120h8a8,8,0,0,0,0-16ZM69.2,48H186.8l24.89,56H44.31ZM64,200H40V184H64Zm128,0V184h24v16Zm24-32H40V120H216ZM56,144a8,8,0,0,1,8-8H80a8,8,0,0,1,0,16H64A8,8,0,0,1,56,144Zm112,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H176A8,8,0,0,1,168,144Z"/>
        </svg>
      ),
    },
    {
      key: 'eventos',
      label: 'Eventos',
      href: '/eventos',
      icon: (
        <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/>
        </svg>
      ),
    },
    {
      key: 'zonas',
      label: 'Zonas',
      href: '/zonas',
      icon: (
        <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
          <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"/>
        </svg>
      ),
    },
  ];

  const handleItemClick = (item: MenuItem) => {
    // If the item has an href, navigate to it
    if (item.href) {
      router.push(item.href);
    } else {
      // Otherwise, use the section change callback for internal state
      if (onSectionChange) {
        onSectionChange(item.key);
      }
    }

    if (item.onClick) {
      item.onClick();
    }
  };

  // Determine current selection based on pathname or currentSection prop
  const effectiveCurrentSection =
    pathname === '/eventos' ? 'eventos' :
    pathname === '/unidades' ? 'unidades' :
    pathname === '/zonas' ? 'zonas' :
    currentSection;
  const selectedItem = menuItems.find(item => item.key === effectiveCurrentSection);

  return (
    <div
      className="bg-gray-50"
      style={{
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #d9d9d9',
      }}
    >
      {/* Global Filters Trigger */}
      <div
        style={{
          padding: isCollapsed ? '16px 0 12px 0' : '16px 16px 12px 16px',
          display: 'flex',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}
      >
        <button
          onClick={toggleBar}
          className="transition-all"
          style={{
            width: isCollapsed ? '40px' : '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: isCollapsed ? 0 : '12px',
            padding: isCollapsed ? '10px' : '10px 14px',
            borderRadius: isCollapsed ? '12px' : '10px',
            border: '1px solid rgba(24,103,255,0.18)',
            backgroundColor: isBarOpen ? 'rgba(24,103,255,0.08)' : '#ffffff',
            color: '#0f172a',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            position: 'relative'
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              color: '#1867ff'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M240,56a8,8,0,0,0-8-8H24a8,8,0,0,0-5.66,13.66L112,155.31V216a8,8,0,0,0,11.37,7.16l32-16A8,8,0,0,0,160,200V155.31L245.66,61.66A8,8,0,0,0,240,56Z" />
            </svg>
          </span>
          {!isCollapsed && (
            <span style={{ flex: 1, textAlign: 'left' }}>
              Filtros
            </span>
          )}
          {removableFilterCount > 0 && (
            <span
              style={{
                minWidth: '20px',
                height: '20px',
                padding: '0 6px',
                borderRadius: '999px',
                backgroundColor: '#1867ff',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {removableFilterCount}
            </span>
          )}
        </button>
      </div>

      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'rgba(15,23,42,0.08)',
          margin: isCollapsed ? '0 0 12px 0' : '0 12px 12px 12px'
        }}
      />

      {/* Toggle Button */}
      <div
        style={{
          padding: isCollapsed ? '0 0 12px 0' : '0 16px 12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}
      >
        <button
          onClick={() => onCollapse && onCollapse(!isCollapsed)}
          className="hover:opacity-70 transition-opacity"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col items-center" style={{ flex: 1 }}>
        {menuItems.map((item) => {
          const isSelected = item.key === effectiveCurrentSection;
          const isHighlighted = highlightedMenuKeys?.includes(item.key);
          return (
            <div
              key={item.key}
              onClick={() => handleItemClick(item)}
              className="cursor-pointer transition-all"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                height: '36px',
                padding: isCollapsed ? '0' : '0 16px',
                gap: isCollapsed ? 0 : '12px',
                backgroundColor: isCollapsed ? 'transparent' : (isSelected ? '#e2f6ff' : 'transparent'),
                borderRadius: isCollapsed ? '0' : '8px',
                margin: isCollapsed ? '0' : '0 8px',
                width: isCollapsed ? '100%' : 'calc(100% - 16px)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isCollapsed) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isCollapsed) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCollapsed && isSelected ? '#e2f6ff' : 'transparent',
                  borderRadius: '12px',
                  color: isSelected ? '#1867ff' : '#000000',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && isCollapsed) {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && isCollapsed) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.icon}
                {isHighlighted && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444'
                    }}
                  />
                )}
              </div>
              {!isCollapsed && (
                <span
                  style={{
                    fontSize: '15px',
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontWeight: isSelected ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: isSelected ? '#1867ff' : '#000000',
                  }}
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Icon */}
      <div
        className="cursor-pointer transition-all"
        style={{
          padding: isCollapsed ? '16px 0' : '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e6f4ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_4306_777)">
            <mask id="mask0_4306_777" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
              <path d="M0 0H24V24H0V0Z" fill="white"/>
            </mask>
            <g mask="url(#mask0_4306_777)">
              <path d="M14.9999 5C14.5999 5 14.3999 5.2 14.3999 5.6V18C14.3999 18.4 14.5999 18.6 14.9999 18.6H17.7999C17.9999 18.6 18.3999 18.2 18.3999 18V5.8C18.3999 5.4 18.1999 5.2 17.7999 5.2H14.9999V5Z" fill="#1867FF"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M4 0.800049C2.4 0.800049 1 2.20005 1 3.80005V19.8C1 21.4 2.4 22.8 4 22.8H20C21.6 22.8 23 21.4 23 19.8V3.80005C23 2.20005 21.6 0.800049 20 0.800049H4ZM3 3.80005C3 3.20005 3.4 2.80005 4 2.80005H20C20.6 2.80005 21 3.20005 21 3.80005V19.8C21 20.4 20.6 20.8 20 20.8H4C3.4 20.8 3 20.4 3 19.8V3.80005Z" fill="#1867FF"/>
            </g>
          </g>
          <defs>
            <clipPath id="clip0_4306_777">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </div>

    </div>
  );
}
