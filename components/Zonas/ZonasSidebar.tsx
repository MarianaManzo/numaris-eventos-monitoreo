'use client';

import { useState, useEffect, useMemo, type ComponentType } from 'react';
import { Typography, Input, Spin, Table, Tooltip, Tag } from 'antd';
import type { TableProps } from 'antd';
import type { IconProps } from 'phosphor-react';
import {
  MagnifyingGlass,
  Buildings,
  House,
  Factory,
  Storefront,
  TreeEvergreen,
  Airplane,
  GraduationCap,
  Path as Road,
  Car,
  WarningOctagon,
  FirstAid,
  Plus,
  TagSimple
} from 'phosphor-react';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import { useZonaStore } from '@/lib/stores/zonaStore';
import { useFilterUiStore } from '@/lib/stores/filterUiStore';
import { useFilterStore } from '@/lib/stores/filterStore';
import type { ZonaWithRelations } from '@/lib/zonas/types';

const { Text } = Typography;

const ICONS: Record<string, ComponentType<IconProps>> = {
  Buildings,
  House,
  Factory,
  Storefront,
  TreeEvergreen,
  Airplane,
  GraduationCap,
  Road,
  Car,
  WarningOctagon,
  Park: TreeEvergreen,
  Hospital: FirstAid
};

function getIconComponent(name?: string): ComponentType<IconProps> {
  return (name && ICONS[name]) || WarningOctagon;
}

const ICON_TYPE_LABELS: Record<string, string> = {
  Buildings: 'Comercial',
  House: 'Residencial',
  Factory: 'Industrial',
  Storefront: 'Comercial',
  TreeEvergreen: 'Parque',
  Airplane: 'Aeropuerto',
  GraduationCap: 'Educativa',
  Road: 'Infraestructura',
  Car: 'Movilidad',
  WarningOctagon: 'Zona crítica',
  Park: 'Parque',
  Hospital: 'Hospitalaria'
};

const CREATOR_NAMES = [
  'Equipo de Operaciones',
  'Monitoreo Centro',
  'Planeación Regional',
  'Logística Metropolitana',
  'Supervisión Occidente'
];

const ESTADO_LABELS = ['Activa', 'En revisión', 'Inactiva'];

const ESTADO_COLOR_MAP: Record<string, string> = {
  Activa: 'green',
  'En revisión': 'gold',
  Inactiva: 'volcano'
};

type ZonaTableRow = {
  key: string;
  zona: ZonaWithRelations;
  nombre: string;
  tipo: string;
  geometria: string;
  unidadesAsignadas: number;
  creador: string;
  fechaCreacion: string;
  estado: string;
};

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function formatCreationDate(index: number): string {
  const date = new Date();
  date.setDate(date.getDate() - index);
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

interface ZonasSidebarProps {
  zonasWithRelations: ZonaWithRelations[];
  displayedZonas: ZonaWithRelations[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function ZonasSidebar({
  zonasWithRelations,
  displayedZonas,
  currentPage,
  pageSize,
  onPageChange
}: ZonasSidebarProps) {
  const isZonesPending = useFilterUiStore((state) => state.pending.zones);
  const openBar = useFilterUiStore((state) => state.openBar);
  const setActiveDropdown = useFilterUiStore((state) => state.setActiveDropdown);
  const zoneTagFilters = useFilterStore((state) => state.units.zoneTags);
  const areTagFiltersActive = zoneTagFilters.length > 0;

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const {
    zonas,
    selectedZonaId,
    searchQuery,
    setZonas,
    selectZona,
    setSearchQuery,
    getVisibleZonas
  } = useZonaStore();

  // Generate zonas once on mount
  useEffect(() => {
    if (zonas.length === 0) {
      const generated = generateGuadalajaraZonas();
      setZonas(generated);
    }
  }, [zonas.length, setZonas]);

  const visibleZonas = getVisibleZonas();
  const visibleCount = visibleZonas.length;

  const zonaIndexLookup = useMemo(() => {
    const map = new Map<string, number>();
    zonasWithRelations.forEach((zona, index) => {
      map.set(zona.id, index);
    });
    return map;
  }, [zonasWithRelations]);

  const tableData = useMemo<ZonaTableRow[]>(() => {
    return displayedZonas.map((zona) => {
      const globalIndex = zonaIndexLookup.get(zona.id) ?? 0;
      const vertexCount = Math.max(0, (zona.coordinates.coordinates[0]?.length ?? 1) - 1);
      const tipo =
        ICON_TYPE_LABELS[zona.icon] ??
        (zona.etiquetas && zona.etiquetas.length > 0 ? toTitleCase(zona.etiquetas[0]) : 'General');

      return {
        key: zona.id,
        zona,
        nombre: zona.nombre,
        tipo,
        geometria: `Polígono (${vertexCount} vértices)`,
        unidadesAsignadas: zona.vehicleCount,
        creador: CREATOR_NAMES[globalIndex % CREATOR_NAMES.length],
        fechaCreacion: formatCreationDate(globalIndex),
        estado: ESTADO_LABELS[globalIndex % ESTADO_LABELS.length]
      };
    });
  }, [displayedZonas, zonaIndexLookup]);

  const handleZonaClick = (zonaId: string) => {
    selectZona(selectedZonaId === zonaId ? null : zonaId);
  };

  const columns = useMemo<TableProps<ZonaTableRow>['columns']>(() => [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      ellipsis: { showTitle: false },
      fixed: 'left',
      render: (_: string, record: ZonaTableRow) => {
        const IconComponent = getIconComponent(record.zona.icon);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                backgroundColor: record.zona.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <IconComponent size={18} color="white" weight="regular" />
            </div>
            <Tooltip title={record.nombre}>
              <span className="zona-cell-text zona-cell-strong">{record.nombre}</span>
            </Tooltip>
          </div>
        );
      }
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      ellipsis: { showTitle: false },
      render: (value: string) => (
        <Tooltip title={value}>
          <span className="zona-cell-text">{value}</span>
        </Tooltip>
      )
    },
    {
      title: 'Geometría',
      dataIndex: 'geometria',
      key: 'geometria',
      ellipsis: { showTitle: false },
      render: (value: string) => (
        <Tooltip title={value}>
          <span className="zona-cell-text">{value}</span>
        </Tooltip>
      )
    },
    {
      title: 'Unidades asignadas',
      dataIndex: 'unidadesAsignadas',
      key: 'unidadesAsignadas',
      align: 'center'
    },
    {
      title: 'Creador',
      dataIndex: 'creador',
      key: 'creador',
      ellipsis: { showTitle: false },
      render: (value: string) => (
        <Tooltip title={value}>
          <span className="zona-cell-text">{value}</span>
        </Tooltip>
      )
    },
    {
      title: 'Fecha de creación',
      dataIndex: 'fechaCreacion',
      key: 'fechaCreacion',
      ellipsis: { showTitle: false },
      render: (value: string) => (
        <Tooltip title={value}>
          <span className="zona-cell-text">{value}</span>
        </Tooltip>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (value: string) => (
        <Tag color={ESTADO_COLOR_MAP[value] ?? 'default'} style={{ marginRight: 0 }}>
          {value}
        </Tag>
      )
    }
  ], []);

  const handleTableChange: TableProps<ZonaTableRow>['onChange'] = (pagination) => {
    if (pagination.current) {
      onPageChange(pagination.current - 1);
    }
  };

  const paginationConfig = useMemo<TableProps<ZonaTableRow>['pagination']>(() => ({
    current: currentPage + 1,
    pageSize,
    total: zonasWithRelations.length,
    position: ['bottomRight'],
    showSizeChanger: false,
    showTotal: (total: number, range: [number, number]) =>
      `Mostrando ${range[0]}-${range[1]} de ${total}`
  }), [currentPage, pageSize, zonasWithRelations.length]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Text strong style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>Zonas</Text>
        {isZonesPending && <Spin size="small" />}

        <div className="zona-header-actions">
          <button
            type="button"
            className="zona-action-button zona-action-button--primary"
            onClick={() => {
              console.info('[ZonasSidebar] Agregar zona');
            }}
            title="Agregar zona"
            aria-label="Agregar zona"
          >
            <Plus size={18} weight="bold" color="#ffffff" />
          </button>

          {isSearchExpanded ? (
            <Input
              placeholder="Buscar zona"
              prefix={<MagnifyingGlass size={16} color="#64748b" />}
              allowClear
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) {
                  setIsSearchExpanded(false);
                }
              }}
              autoFocus
              className="zona-search-input"
            />
          ) : (
            <button
              type="button"
              className="zona-action-button"
              onClick={() => setIsSearchExpanded(true)}
              title="Buscar zona"
              aria-label="Buscar zona"
            >
              <MagnifyingGlass size={18} color="#1867ff" />
            </button>
          )}

          <button
            type="button"
            className={`zona-action-button ${areTagFiltersActive ? 'zona-action-button--active' : ''}`}
            onClick={() => {
              openBar();
              setActiveDropdown('zones');
            }}
            title="Filtrar por etiqueta"
            aria-label="Filtrar por etiqueta"
          >
            <TagSimple size={18} color={areTagFiltersActive ? '#ffffff' : '#1867ff'} weight={areTagFiltersActive ? 'fill' : 'regular'} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
        <Table<ZonaTableRow>
          className="zona-table"
          columns={columns}
          dataSource={tableData}
          rowKey="key"
          pagination={paginationConfig}
          loading={isZonesPending}
          scroll={{ x: 'max-content' }}
          sticky
          tableLayout="fixed"
          size="middle"
          onChange={handleTableChange}
          rowClassName={(record) => (record.zona.id === selectedZonaId ? 'zona-row-selected' : '')}
          onRow={(record) => ({
            onClick: () => handleZonaClick(record.zona.id),
            style: { cursor: 'pointer' }
          })}
          locale={{
            emptyText: searchQuery ? 'No se encontraron zonas' : 'Sin zonas registradas'
          }}
        />
      </div>

      {/* Footer */}
      <div style={{
        minHeight: '60px',
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
            Zonas
          </div>
          <div style={{ fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span><span style={{ fontWeight: 400 }}>Visibles: </span><span style={{ fontWeight: 600 }}>{visibleCount}</span></span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span><span style={{ fontWeight: 400 }}>Total: </span><span style={{ fontWeight: 600 }}>{zonas.length}</span></span>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.zona-table .ant-table-thead > tr > th) {
          background-color: #f8fafc;
          font-weight: 600;
          color: #1e293b;
          padding: 8px 12px;
        }

        :global(.zona-table .ant-table-tbody > tr.zona-row-selected > td) {
          background-color: #eff6ff !important;
        }

        :global(.zona-table .ant-table-tbody > tr:hover > td) {
          background-color: #f8fafc;
        }

        :global(.zona-table .ant-table-tbody > tr > td) {
          padding: 8px 12px;
          height: 40px;
        }

        :global(.zona-table .ant-table-tbody > tr > td .ant-tag) {
          line-height: 20px;
          padding: 0 8px;
        }

        :global(.zona-cell-text) {
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        :global(.zona-cell-strong) {
          font-weight: 600;
          color: #1e293b;
        }

        :global(.zona-header-actions) {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        :global(.zona-action-button) {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }

        :global(.zona-action-button:hover) {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        }

        :global(.zona-action-button--primary) {
          background-color: #1867ff;
          border-color: #1867ff;
          box-shadow: 0 6px 16px rgba(24, 103, 255, 0.25);
        }

        :global(.zona-action-button--primary:hover) {
          background-color: #0f56d9;
          border-color: #0f56d9;
        }

        :global(.zona-action-button--active) {
          background-color: #1867ff;
          border-color: #1867ff;
          box-shadow: 0 6px 16px rgba(24, 103, 255, 0.25);
        }

        :global(.zona-action-button--active:hover) {
          background-color: #0f56d9;
          border-color: #0f56d9;
        }

        :global(.zona-search-input.ant-input-affix-wrapper) {
          width: 220px;
          height: 36px;
          border-radius: 12px;
          border-color: #cbd5e1;
        }

        :global(.zona-search-input.ant-input-affix-wrapper:hover) {
          border-color: #94a3b8;
        }

        :global(.zona-search-input.ant-input-affix-wrapper .ant-input) {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
