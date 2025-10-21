'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Crosshair, FunnelSimple, Check } from 'phosphor-react';

export default function MockupFocusModeClient() {
  const params = useSearchParams();
  const preset = params.get('preset');

  const [isFocusActive, setIsFocusActive] = useState(preset === 'on');
  const [showToast, setShowToast] = useState(false);
  const [selectedContext, setSelectedContext] = useState<'eventos' | 'geofence' | 'route'>('eventos');

  const focusedCount = 45;
  const totalCount = 150;

  const contextLabels = {
    eventos: 'Event Vehicles',
    geofence: 'Vehicles in Zone A',
    route: 'Route Vehicles'
  };

  const handleToggleFocus = () => {
    setIsFocusActive(!isFocusActive);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: "'Source Sans 3', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        backgroundColor: '#1867ff',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
          Focus Mode - UX Mockup
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '15px', opacity: 0.9 }}>
          Interactive demonstration of contextual filtering UI
        </p>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', gap: '32px', padding: '32px' }}>

        {/* Left Panel - Mockup */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Map Toolbar Mockup - Final Implementation */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
              MAP TOOLBAR (FINAL DESIGN)
            </div>

            {/* Toolbar - Single row layout with icon-only buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {/* Filters Button - Icon Only (opens modal) */}
              <button style={{
                width: '44px',
                height: '44px',
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                color: '#374151'
              }}>
                <FunnelSimple size={20} weight="fill" />
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: '#1867ff',
                  color: 'white',
                  width: '20px',
                  height: '20px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white'
                }}>
                  3
                </span>
              </button>

              <div style={{
                width: '1px',
                height: '32px',
                backgroundColor: '#d1d5db',
                margin: '0 4px'
              }} />

              <button
                onClick={handleToggleFocus}
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: isFocusActive ? '#1867ff' : 'white',
                  border: `2px solid ${isFocusActive ? '#1867ff' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  color: isFocusActive ? 'white' : '#374151'
                }}
                onMouseEnter={(e) => {
                  if (!isFocusActive) {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isFocusActive) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <Crosshair size={20} weight={isFocusActive ? 'fill' : 'regular'} />

                {isFocusActive && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: '2px solid white',
                    whiteSpace: 'nowrap'
                  }}>
                    {focusedCount}/{totalCount}
                  </span>
                )}
              </button>

              <div style={{ flex: 1 }} />

              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <button style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}>+</button>
                <button style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}>−</button>
              </div>
            </div>
          </div>

          {/* Focus Context Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                  Focus Context
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  Highlighted set for operational focus
                </div>
              </div>
              {isFocusActive && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  <Check size={14} weight="bold" />
                  Active focus mode
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {(['eventos', 'geofence', 'route'] as const).map((context) => (
                <button
                  key={context}
                  onClick={() => setSelectedContext(context)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: selectedContext === context ? '#1867ff' : '#e5e7eb',
                    backgroundColor: selectedContext === context ? '#eff6ff' : 'white',
                    color: selectedContext === context ? '#1867ff' : '#374151',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {contextLabels[context]}
                </button>
              ))}
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Vehicles highlighted</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>
                  {focusedCount}{' '}
                  <span style={{ fontSize: '16px', color: '#9ca3af', fontWeight: 500 }}>
                    / {totalCount}
                  </span>
                </div>
              </div>
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1867ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(24,103,255,0.25)'
                }}
              >
                Export list
              </button>
            </div>
          </div>

          {/* Focus Mode Toast */}
          {showToast && (
            <div style={{
              position: 'fixed',
              bottom: '32px',
              right: '32px',
              padding: '16px 20px',
              backgroundColor: '#111827',
              color: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(15,23,42,0.3)'
            }}>
              <Crosshair size={20} weight="fill" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  Focus mode {isFocusActive ? 'enabled' : 'disabled'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {isFocusActive
                    ? 'Only highlighted vehicles are visible on the map'
                    : 'All vehicles restored to map view'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Design Notes */}
        <div style={{
          width: '360px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#111827' }}>
              Interaction Notes
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
              The focus button toggles a contextual filter that reduces map clutter and emphasizes
              relevant vehicles. The badge communicates how many vehicles are highlighted relative to total.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#111827' }}>
              Design Decisions
            </div>
            <ul style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7, paddingLeft: '18px' }}>
              <li>Icon-only button keeps toolbar compact; focus badge shows state.</li>
              <li>Context chips allow switching between different filtered subsets.</li>
              <li>Toast confirms the action without blocking user flow.</li>
              <li>Mockup demonstrates final UI layout before implementation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
