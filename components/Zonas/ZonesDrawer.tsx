'use client';

import { Drawer } from 'antd';
import { useMemo, useState, useEffect } from 'react';
import ZonasSidebar from './ZonasSidebar';
import { useZonaStore } from '@/lib/stores/zonaStore';
import { useFilterStore } from '@/lib/stores/filterStore';
import { filterZonas } from '@/lib/zonas/generateZonas';
import type { ZonaWithRelations } from '@/lib/zonas/types';

interface ZonesDrawerProps {
  open: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 10;

export default function ZonesDrawer({ open, onClose }: ZonesDrawerProps) {
  const { zonas, searchQuery } = useZonaStore();
  const zoneTagFilters = useFilterStore((state) => state.units.zoneTags);

  const [currentPage, setCurrentPage] = useState(0);

  const filteredZonas = useMemo(
    () => filterZonas(zonas, searchQuery, zoneTagFilters),
    [zonas, searchQuery, zoneTagFilters]
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [open, searchQuery, zoneTagFilters, zonas.length]);

  const zonasWithRelations: ZonaWithRelations[] = useMemo(
    () =>
      filteredZonas.map((zona) => ({
        ...zona,
        vehicleCount: 0,
        eventCount: 0
      })),
    [filteredZonas]
  );

  const totalPages = zonasWithRelations.length === 0 ? 0 : Math.ceil(zonasWithRelations.length / PAGE_SIZE);

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(totalPages === 0 ? 0 : totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const paginatedZonas = useMemo(() => {
    if (zonasWithRelations.length === 0) {
      return [];
    }
    const start = currentPage * PAGE_SIZE;
    return zonasWithRelations.slice(start, start + PAGE_SIZE);
  }, [zonasWithRelations, currentPage]);

  return (
    <Drawer
      title="Zonas"
      placement="right"
      width={380}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <ZonasSidebar
        zonasWithRelations={zonasWithRelations}
        displayedZonas={paginatedZonas}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </Drawer>
  );
}
