'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Crosshair, FunnelSimple, Check, CaretDown, CaretUp } from 'phosphor-react';

type ViewId = 'monitoreo' | 'unidad' | 'evento' | 'zona';

const viewOptions: Array<{ id: ViewId; label: string }> = [
  { id: 'monitoreo', label: 'Monitoreo' },
  { id: 'unidad', label: 'Detalle de unidad' },
  { id: 'evento', label: 'Detalle de evento' },
  { id: 'zona', label: 'Detalle de zona' }
];

const filterDefinitions: Array<{
  id: string;
  label: string;
  appliesTo: ViewId[];
}> = [
  { id: 'status', label: 'Vehiculos activos', appliesTo: ['monitoreo', 'unidad', 'evento', 'zona'] },
  { id: 'alerts', label: 'Alertas criticas', appliesTo: ['monitoreo', 'evento'] },
  { id: 'zone', label: 'Zona Norte', appliesTo: ['monitoreo'] }
];

export default function MockupFocusModeClient() {
  const params = useSearchParams();
  const preset = params.get('preset');

  const [isFocusActive, setIsFocusActive] = useState(preset === 'on');
  const [showToast, setShowToast] = useState(false);
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewId>('monitoreo');
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>(['status', 'alerts', 'zone']);
  const [selectedContext, setSelectedContext] = useState<'eventos' | 'geofence' | 'route'>('eventos');

  const focusedCount = 45;
  const totalCount = 150;

  const panelWidth = 320;
  const filterButtonOffset = 12;
  const activeFilterCount = activeFilterIds.length;
  const filterButtonLabel = activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : 'Filtros';

  const filterPills = filterDefinitions.map((filter) => {
    const disabled = !filter.appliesTo.includes(currentView);
    const active = activeFilterIds.includes(filter.id);
    return { ...filter, disabled, active };
  });

  const panelItems = [
    { id: 'unit-102', title: 'Unidad 102', detail: 'Alerta: geocerca norte', meta: 'hace 2 min' },
    { id: 'unit-086', title: 'Unidad 086', detail: 'Sin asignar - Zona centro', meta: 'hace 5 min' },
    { id: 'unit-211', title: 'Unidad 211', detail: 'Mantenimiento programado', meta: 'hace 12 min' }
  ];

  const contextLabels = {
    eventos: 'Event Vehicles',
    geofence: 'Vehicles in Zone A',
    route: 'Route Vehicles'
  };

  const handleToggleFiltersButton = () => {
    setIsFilterBarOpen((prev) => !prev);
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilterIds((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
  };

  const handleClearFilters = () => {
    setActiveFilterIds([]);
  };

  const handleViewChange = (view: ViewId) => {
    setCurrentView(view);
    setIsFilterBarOpen(true);
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

          {/* Monitoring Layout Mockup - Filter Chip Anchored to Panel */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
              MONITORING LAYOUT (FILTER CHIP)
            </div>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '13px',
              color: '#6b7280',
              lineHeight: 1.6
            }}>
              Chip flotante anclado al panel lateral (12 px de separacion). Permanece visible en todas las vistas y despliega una barra superpuesta con pills y accion de limpiar sin restar espacio al mapa.
            </p>
            <div style={{
              position: 'relative',
              height: '360px',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              backgroundColor: '#0f172a',
              boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.2)'
            }}>
              <div style={{
                flex: 1,
                position: 'relative',
                backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(59,130,246,0.18) 0, rgba(30,64,175,0) 55%), radial-gradient(circle at 80% 60%, rgba(45,212,191,0.18) 0, rgba(13,148,136,0) 55%)',
                backgroundColor: '#0f172a'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                  opacity: 0.5
                }} />
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  left: '24px',
                  display: 'inline-flex',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  backdropFilter: 'blur(14px)',
                  backgroundColor: 'rgba(15,23,42,0.6)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  Vista: {viewOptions.find((view) => view.id === currentView)?.label}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '28px',
                  left: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(15,23,42,0.65)',
                  color: 'white',
                  fontSize: '13px'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Crosshair size={16} weight={isFocusActive ? 'fill' : 'regular'} />
                    {isFocusActive ? 'Focus activo' : 'Focus inactivo'}
                  </span>
                  <span style={{ opacity: 0.65 }}>
                    {focusedCount}/{totalCount} unidades destacadas
                  </span>
                </div>
              </div>
              <div style={{
                width: `${panelWidth}px`,
                backgroundColor: 'white',
                borderLeft: '1px solid #e5e7eb',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Panel lateral
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: '4px' }}>
                      {viewOptions.find((view) => view.id === currentView)?.label}
                    </div>
                  </div>
                  <button
                    onClick={handleToggleFocus}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '999px',
                      border: `1px solid ${isFocusActive ? '#1867ff' : '#d1d5db'}`,
                      color: isFocusActive ? '#1867ff' : '#374151',
                      backgroundColor: isFocusActive ? '#eff6ff' : 'white',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Crosshair size={16} weight={isFocusActive ? 'fill' : 'regular'} />
                    {isFocusActive ? 'Focus activo' : 'Activar focus'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {viewOptions.map((view) => {
                    const isSelected = currentView === view.id;
                    return (
                      <button
                        key={view.id}
                        onClick={() => handleViewChange(view.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: `1px solid ${isSelected ? '#1867ff' : '#e5e7eb'}`,
                          backgroundColor: isSelected ? '#eff6ff' : 'white',
                          color: isSelected ? '#1867ff' : '#374151',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {view.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {panelItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        backgroundColor: '#f9fafb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{item.title}</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{item.meta}</span>
                      </div>
                      <span style={{ fontSize: '13px', color: '#4b5563' }}>{item.detail}</span>
                      <span style={{ fontSize: '11px', color: '#1867ff', fontWeight: 600 }}>
                        Filtrado por: {filterButtonLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleToggleFiltersButton}
                style={{
                  position: 'absolute',
                  top: '28px',
                  left: `calc(100% - ${panelWidth}px - ${filterButtonOffset}px)`,
                  zIndex: 30,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '999px',
                  border: '1px solid rgba(24,103,255,0.65)',
                  backgroundColor: 'rgba(255,255,255,0.96)',
                  color: '#0f172a',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 12px 28px rgba(24,103,255,0.22)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <FunnelSimple size={18} weight="fill" />
                <span>{filterButtonLabel}</span>
                {isFilterBarOpen ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
              </button>
              <div style={{
                position: 'absolute',
                top: '0px',
                left: `calc(100% - ${panelWidth}px - ${filterButtonOffset}px - 90px)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'none',
                zIndex: 25
              }}>
                <div style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  backgroundColor: '#1867ff',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  boxShadow: '0 8px 14px rgba(24,103,255,0.25)'
                }}>
                  Nueva ubicacion del boton
                </div>
                <div style={{
                  width: '2px',
                  height: '52px',
                  background: 'linear-gradient(180deg, rgba(24,103,255,0.0) 0%, rgba(24,103,255,0.7) 100%)'
                }} />
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '5px',
                  backgroundColor: '#1867ff',
                  boxShadow: '0 0 0 6px rgba(24,103,255,0.22)'
                }} />
              </div>
              {isFilterBarOpen && (
                <div style={{
                  position: 'absolute',
                  top: '76px',
                  left: `calc(100% - ${panelWidth}px)`,
                  width: `${panelWidth}px`,
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 18px 36px rgba(15,23,42,0.12)',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Filtros activos</span>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        Vista: {viewOptions.find((view) => view.id === currentView)?.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {filterPills.map((pill) => (
                        <button
                          key={pill.id}
                          onClick={() => !pill.disabled && toggleFilter(pill.id)}
                          title={pill.disabled ? 'No disponible en esta vista' : 'Quitar filtro'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            borderRadius: '999px',
                            border: `1px solid ${pill.active ? '#1867ff' : '#d1d5db'}`,
                            backgroundColor: pill.disabled
                              ? '#f3f4f6'
                              : pill.active
                                ? '#eff6ff'
                                : 'white',
                            color: pill.disabled ? '#9ca3af' : pill.active ? '#1867ff' : '#4b5563',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: pill.disabled ? 'not-allowed' : 'pointer',
                            opacity: pill.disabled ? 0.6 : 1,
                            boxShadow: pill.active ? '0 4px 10px rgba(24,103,255,0.12)' : 'none'
                          }}
                        >
                          {pill.label}
                          {!pill.disabled && pill.active && <span style={{ fontSize: '14px' }}>x</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleClearFilters}
                    disabled={activeFilterCount === 0}
                    style={{
                      alignSelf: 'stretch',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: '1px solid transparent',
                      backgroundColor: activeFilterCount === 0 ? '#f3f4f6' : '#fff1f2',
                      color: activeFilterCount === 0 ? '#9ca3af' : '#be123c',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: activeFilterCount === 0 ? 'not-allowed' : 'pointer',
                      minWidth: '92px',
                      boxShadow: activeFilterCount === 0 ? 'none' : '0 8px 18px rgba(190,18,60,0.12)'
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#6b7280' }}>
              Animacion: barra flotante entra con slide/fade en 200 ms y se cierra con Esc, clic fuera o el mismo boton.
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
              <li>Filter chip floats next to the side panel so users find it instantly in any view.</li>
              <li>Floating bar lists active pills, disabled states by view, and quick clear without eating vertical room.</li>
              <li>Focus toggle lives in the panel header to connect with list context and avoid map clutter.</li>
              <li>Map overlay stays muted so attention remains on vehicles and the side panel narrative.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
