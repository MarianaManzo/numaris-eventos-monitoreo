'use client';

import { useState } from 'react';
import { Crosshair, FunnelSimple, Check } from 'phosphor-react';

export default function FocusModeUXMockup() {
  const [isFocusActive, setIsFocusActive] = useState(false);
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
                {/* Active filters badge - positioned at top right */}
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

              {/* Vertical Divider */}
              <div style={{
                width: '1px',
                height: '32px',
                backgroundColor: '#d1d5db',
                margin: '0 4px'
              }} />

              {/* Focus Button - Icon Only - MAIN FEATURE */}
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

                {/* Badge with count - positioned at top right when active */}
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

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Additional map controls (zoom, etc) */}
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

            {/* Visual Grouping Explanation */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#1e40af',
              lineHeight: '1.5'
            }}>
              <strong>✓ Design Decisions:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                <li><strong>Icon-only buttons</strong> - cleaner, more compact toolbar</li>
                <li><strong>Badge positioning</strong> - top-right corner (not inline)</li>
                <li><strong>Filters badge (blue)</strong> - shows active filter count</li>
                <li><strong>Focus badge (green)</strong> - shows focused/total vehicles</li>
                <li><strong>Tooltips required</strong> - explain icon meaning on hover</li>
              </ul>
            </div>

            {/* Hover Tooltip Simulations */}
            <div style={{
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Filters Button Tooltip */}
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#374151',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <FunnelSimple size={16} weight="fill" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Tooltip (Filters button):</strong>
                  <div style={{ marginTop: '2px' }}>
                    Filter events by estado and severity
                  </div>
                </div>
              </div>

              {/* Focus Button Tooltip */}
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#92400e',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <Crosshair size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Tooltip (Focus button):</strong>
                  <div style={{ marginTop: '2px' }}>
                    {isFocusActive
                      ? `Showing ${focusedCount} vehicles with events - Click to show all`
                      : `Show only vehicles with events (${focusedCount} of ${totalCount})`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Visual Mockup */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
              MAP VIEW SIMULATION
            </div>

            {/* Simulated Map Background */}
            <div style={{
              width: '100%',
              height: 'calc(100% - 32px)',
              backgroundColor: '#e5e7eb',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Grid pattern to simulate map */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.3
              }} />

              {/* Vehicle Markers Simulation */}
              <div style={{
                position: 'absolute',
                inset: 20,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'flex-start',
                alignContent: 'flex-start'
              }}>
                {/* Focused vehicles (with events) */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={`focused-${i}`} style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#48bc19',
                    border: '3px solid #1867ff',
                    opacity: isFocusActive ? 1 : 0.9,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'white',
                    fontWeight: 700
                  }}>
                    ✓
                  </div>
                ))}

                {/* Non-focused vehicles (no events) */}
                {!isFocusActive && Array.from({ length: 18 }).map((_, i) => (
                  <div key={`non-focused-${i}`} style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#48bc19',
                    border: '3px solid #1867ff',
                    opacity: 0.9,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }} />
                ))}

                {/* Dimmed non-focused vehicles when focus active */}
                {isFocusActive && Array.from({ length: 18 }).map((_, i) => (
                  <div key={`dimmed-${i}`} style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#9ca3af',
                    border: '3px solid #d1d5db',
                    opacity: 0.2,
                    filter: 'grayscale(100%)',
                    transition: 'all 0.3s ease',
                    boxShadow: 'none'
                  }} />
                ))}
              </div>

              {/* Focus Active Overlay Label */}
              {isFocusActive && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(24, 103, 255, 0.95)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Crosshair size={16} weight="fill" />
                  Showing {focusedCount} of {totalCount} vehicles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Controls & Info */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* State Control */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
              Interactive Controls
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Focus Toggle */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                  Focus Mode
                </label>
                <button
                  onClick={handleToggleFocus}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: isFocusActive ? '#dcfce7' : '#f3f4f6',
                    border: `2px solid ${isFocusActive ? '#22c55e' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isFocusActive ? '#166534' : '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isFocusActive ? <Check size={18} weight="bold" /> : <Crosshair size={18} />}
                  {isFocusActive ? 'Focus Active' : 'Activate Focus'}
                </button>
              </div>

              {/* Context Selector */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                  Context (changes label dynamically)
                </label>
                <select
                  value={selectedContext}
                  onChange={(e) => setSelectedContext(e.target.value as 'eventos' | 'geofence' | 'route')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="eventos">Eventos (Event Vehicles)</option>
                  <option value="geofence">Geofence (Vehicles in Zone)</option>
                  <option value="route">Route (Route Vehicles)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Current State Display */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
              Current State
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Focus Active:</span>
                <span style={{ fontWeight: 600, color: isFocusActive ? '#22c55e' : '#ef4444' }}>
                  {isFocusActive ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Context:</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{contextLabels[selectedContext]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Focused Vehicles:</span>
                <span style={{ fontWeight: 600, color: '#1867ff' }}>{focusedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Total Vehicles:</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{totalCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#6b7280' }}>Visible:</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>
                  {isFocusActive ? `${focusedCount} (${((focusedCount/totalCount)*100).toFixed(0)}%)` : `${totalCount} (100%)`}
                </span>
              </div>
            </div>
          </div>

          {/* Implementation Notes */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '2px solid #0ea5e9',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#0c4a6e' }}>
              Implementation Checklist
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#0c4a6e', lineHeight: '1.8' }}>
              <li>✅ Toolbar placement (separate from filter modal)</li>
              <li>✅ Visual grouping with filters button</li>
              <li>✅ Toggle interaction (click to enable/disable)</li>
              <li>✅ Active state styling (blue with white text)</li>
              <li>✅ Badge count display (45/150 format)</li>
              <li>✅ Crosshair icon (regular/fill weight)</li>
              <li>✅ Dimming non-focused vehicles (20% opacity + grayscale)</li>
              <li>✅ Smooth transitions (0.2s ease)</li>
              <li>✅ Toast notification on toggle</li>
              <li>✅ Tooltip on hover (explain before click)</li>
              <li>✅ Map overlay label when active</li>
            </ul>
          </div>

          {/* Technical Specs */}
          <div style={{
            backgroundColor: '#fefce8',
            border: '2px solid #facc15',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#713f12' }}>
              Technical Specs
            </h3>
            <div style={{ fontSize: '13px', color: '#713f12', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Component:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>FocusButton.tsx</code>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>State:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>useState&lt;boolean&gt;</code>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Props:</strong> active, focusedCount, totalCount, onToggle, tooltip
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Size:</strong> 44×44px (icon-only button)
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Badge:</strong> Absolute position top-right (-8px, -8px)
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Marker styling:</strong> Add <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>isFocused</code> className
              </div>
              <div>
                <strong>CSS:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>opacity: 0.2; filter: grayscale(100%)</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          backgroundColor: isFocusActive ? '#1867ff' : '#6b7280',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: 600,
          animation: 'slideIn 0.3s ease',
          zIndex: 1000
        }}>
          {isFocusActive ? (
            <>
              <Crosshair size={20} weight="fill" />
              <span>Showing {focusedCount} vehicles with events</span>
            </>
          ) : (
            <>
              <Check size={20} weight="bold" />
              <span>Focus disabled - showing all {totalCount} vehicles</span>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
