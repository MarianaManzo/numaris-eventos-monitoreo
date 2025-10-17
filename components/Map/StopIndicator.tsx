'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type * as L from 'leaflet';

interface StopIndicatorProps {
  position: LatLngExpression;
  stopTime: string;
  color: string;
  textColor?: string;
  name: string;
  address?: string;
  timeRange?: string;
  showDialog?: boolean;
  allStops?: { id: string; position: LatLngExpression; name: string; duration: string; timeRange: string; address: string }[];
  dialogWidth?: string;
  inverted?: boolean;
  offset?: { lat?: number; lng?: number };
  onStopClick?: () => void;
  onStopDeselect?: () => void;
  vehicleName?: string;
  selectedDate?: string;
  stopId?: string;
  onNavigateStop?: (direction: 'prev' | 'next') => void;
  onMarkerReady?: (marker: L.Marker) => void;
  hideStopIcon?: boolean;
  isDimmed?: boolean; // Dim indicator when another marker is selected
}

// Store navigation handlers outside component to prevent re-creation
const navigationHandlers: { [key: string]: (e: CustomEvent) => void } = {};

export default function StopIndicator({
  position,
  stopTime,
  color,
  textColor,
  name,
  address,
  timeRange,
  showDialog,
  allStops,
  dialogWidth = '200px',
  inverted = false,
  offset = { lat: 0, lng: 0 },
  onStopClick,
  onStopDeselect,
  vehicleName = 'Vehicle',
  selectedDate = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/'),
  stopId,
  onNavigateStop,
  onMarkerReady,
  hideStopIcon = false,
  isDimmed = false
}: StopIndicatorProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const createIconRef = useRef<((hideCapsule: boolean) => L.DivIcon) | null>(null);

  useEffect(() => {
    if (!map || typeof window === 'undefined') return;

    const setupStopIndicator = async () => {
      try {
        const L = await import('leaflet');

        const [lat, lng] = Array.isArray(position) ? position : [position.lat, position.lng];
        const offsetPosition: LatLngExpression = [
          (typeof lat === 'number' ? lat : 0) + (offset.lat || 0),
          (typeof lng === 'number' ? lng : 0) + (offset.lng || 0)
        ];

        // Clean up existing marker and its popup
        if (markerRef.current) {
          if (markerRef.current.getPopup()) {
            markerRef.current.unbindPopup();
          }
          map.removeLayer(markerRef.current);
          markerRef.current = null;
        }

        // Calculate dynamic width for time capsule
        const estimatedTextWidth = stopTime.length * 7;
        const iconWidth = (stopTime === 'Fin' || stopTime === 'Inicio') ? 12 : 0;
        const padding = (stopTime === 'Fin' || stopTime === 'Inicio') ? 16 : 12;
        const gap = (stopTime === 'Fin' || stopTime === 'Inicio') ? 3 : 0;
        const dynamicWidth = Math.max(32, estimatedTextWidth + iconWidth + padding + gap);

        // Function to create icon with dynamic capsule visibility
        const createIcon = (hideCapsule: boolean) => L.divIcon({
          html: `<div style="display: flex; flex-direction: column; align-items: center; position: relative; opacity: ${isDimmed ? '0.35' : '1'}; transform: scale(${isDimmed ? '0.9' : '1'}); transition: opacity 0.3s ease, transform 0.3s ease;">
            <!-- Time Capsule (clickable) -->
            <div class="stop-time-capsule" style="
              background: ${color};
              border: 1px solid ${color};
              border-radius: 6px;
              padding: 4px ${stopTime === 'Fin' || stopTime === 'Inicio' ? '8px' : '6px'};
              font-size: 11px;
              font-weight: 500;
              color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.15);
              white-space: nowrap;
              text-align: center;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1;
              display: ${hideCapsule ? 'none' : 'inline-flex'};
              align-items: center;
              justify-content: center;
              gap: 3px;
              min-width: 24px;
              width: auto;
              cursor: pointer;
              margin-bottom: ${hideCapsule ? '0' : '8px'};
              transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
            " onmouseover="if(this.style.display!=='none'){this.style.transform='scale(1.05)'; this.style.boxShadow='0 3px 6px rgba(0,0,0,0.2)';}"
              onmouseout="if(this.style.display!=='none'){this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.15)';}">
              ${stopTime === 'Fin' ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                <circle cx="12" cy="12" r="9" fill="none" stroke="white" stroke-width="2"/>
                <rect x="8" y="8" width="8" height="8" fill="white"/>
              </svg>` : stopTime === 'Inicio' ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                <circle cx="12" cy="12" r="9" fill="none" stroke="white" stroke-width="2"/>
                <path d="M10 8l6 4-6 4V8z" fill="white"/>
              </svg>` : ''}${stopTime}
            </div>

            ${hideStopIcon ? '' : `<!-- Stop Icon -->
            <div class="stop-icon-circle" style="
              width: 24px;
              height: 24px;
              background-color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              transition: transform 0.2s, box-shadow 0.2s;
              cursor: pointer;
            "
            onmouseover="this.style.transform='scale(1.15)'; this.style.boxShadow='0 3px 8px rgba(0,0,0,0.25)';"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.15)';">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="2"/>
                <rect x="8" y="8" width="8" height="8" fill="${color}"/>
              </svg>
            </div>`}
          </div>`,
          className: 'stop-indicator-combined',
          iconSize: [Math.max(dynamicWidth, 24), hideCapsule ? 30 : (hideStopIcon ? 30 : 50)],
          iconAnchor: [Math.max(dynamicWidth, 24) / 2, hideCapsule ? 20 : (hideStopIcon ? 15 : 40)]
        });

        // Store createIcon function in ref for use in event handlers
        createIconRef.current = createIcon;

        markerRef.current = L.marker(offsetPosition, { icon: createIcon(false) }).addTo(map);

        // Tag the marker with vehicle name for cleanup identification
        if (markerRef.current && vehicleName) {
          (markerRef.current as L.Marker & { _vehicleName?: string })._vehicleName = vehicleName;
        }

        // Notify parent component that marker is ready
        if (onMarkerReady && markerRef.current) {
          onMarkerReady(markerRef.current);
        }

        if (showDialog && address && timeRange) {
          // Parse start and end times from timeRange and add AM/PM
          const formatTimeWithAMPM = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'pm' : 'am';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
          };

          const [startTimeRaw, endTimeRaw] = timeRange.split(' - ').map(t => t.trim());
          const startTime = formatTimeWithAMPM(startTimeRaw);
          const endTime = endTimeRaw ? formatTimeWithAMPM(endTimeRaw) : startTime;

          // Find current stop index for navigation
          const currentIndex = allStops ? allStops.findIndex(s => s.id === stopId) : -1;
          const hasPrev = currentIndex > 0;
          const hasNext = allStops && currentIndex < allStops.length - 1;

          const dialogContent = `
            <div style="
              font-family: 'Source Sans 3', sans-serif;
              padding: 8px;
              width: 255px;
              position: relative;
              display: flex;
              flex-direction: column;
            ">
              <!-- Navigation Arrows -->
              ${hasPrev ? `<button
                onclick="console.log('[StopIndicator] Prev button clicked for stop: ${stopId}'); window.dispatchEvent(new CustomEvent('navigateStop-${stopId}', { detail: 'prev' })); console.log('[StopIndicator] Event dispatched');"
                style="
                  position: absolute;
                  left: -45px;
                  top: 50%;
                  transform: translateY(-50%);
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  width: 40px;
                  height: 40px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  z-index: 1000;
                  padding: 0;
                "
                onmouseover="this.style.backgroundColor='#f3f4f6'"
                onmouseout="this.style.backgroundColor='white'"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>` : ''}

              ${hasNext ? `<button
                onclick="console.log('[StopIndicator] Next button clicked for stop: ${stopId}'); window.dispatchEvent(new CustomEvent('navigateStop-${stopId}', { detail: 'next' })); console.log('[StopIndicator] Event dispatched');"
                style="
                  position: absolute;
                  right: -45px;
                  top: 50%;
                  transform: translateY(-50%);
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  width: 40px;
                  height: 40px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  z-index: 1000;
                  padding: 0;
                "
                onmouseover="this.style.backgroundColor='#f3f4f6'"
                onmouseout="this.style.backgroundColor='white'"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>` : ''}

              <!-- Vehicle Name -->
              <div style="margin-bottom: 6px;">
                <h3 style="
                  margin: 0;
                  font-size: 20px;
                  font-weight: 700;
                  color: #111827;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                ">${vehicleName}</h3>
              </div>

              <!-- Date and Duration Row -->
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 12px;
              ">
                <span style="color: #9ca3af;">${selectedDate}</span>
                <span style="
                  background: ${color};
                  color: white;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-weight: 500;
                ">${stopTime}</span>
              </div>

              <!-- Time Range -->
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px;
                background: #f9fafb;
                border-radius: 6px;
                gap: 8px;
              ">
                <span style="font-size: 13px; color: #111827; font-weight: 500;">${startTime}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
                <span style="font-size: 13px; color: #111827; font-weight: 500;">${endTime}</span>
              </div>

              <!-- Address -->
              <div style="
                font-size: 12px;
                color: #6b7280;
                line-height: 1.4;
                display: flex;
                gap: 6px;
                align-items: flex-start;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="${color}" style="flex-shrink: 0; margin-top: 1px;">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span style="
                  overflow: hidden;
                  text-overflow: ellipsis;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                ">${address}</span>
              </div>
            </div>
          `;

          const popupOptions = {
            closeButton: true,
            className: 'stop-dialog-popup',
            offset: [0, -10] as [number, number],
            autoPan: true,
            autoPanPaddingTopLeft: [80, 80] as [number, number],
            autoPanPaddingBottomRight: [80, 80] as [number, number],
            autoPanPadding: [80, 80] as [number, number],
            keepInView: true,
            minWidth: 255,
            maxWidth: 300
          };

          markerRef.current.bindPopup(dialogContent, popupOptions);

          // Track popup open/close state
          markerRef.current.on('popupopen', () => {
            setIsPopupOpen(true);
            // Update the icon to hide the capsule, but preserve the popup
            if (markerRef.current && createIconRef.current) {
              const currentPopup = markerRef.current.getPopup();
              markerRef.current.setIcon(createIconRef.current(true));
              // Re-bind the popup if it was lost
              if (currentPopup && !markerRef.current.getPopup()) {
                markerRef.current.bindPopup(currentPopup);
              }
            }
          });

          markerRef.current.on('popupclose', () => {
            setIsPopupOpen(false);
            // Update the icon to show the capsule, but preserve the popup
            if (markerRef.current && createIconRef.current) {
              const currentPopup = markerRef.current.getPopup();
              markerRef.current.setIcon(createIconRef.current(false));
              // Re-bind the popup if it was lost
              if (currentPopup && !markerRef.current.getPopup()) {
                markerRef.current.bindPopup(currentPopup);
              }
            }
            // Deselect the stop when popup is closed (by user clicking X)
            if (onStopDeselect) {
              console.log('[StopIndicator] Popup closed, deselecting stop:', stopId);
              onStopDeselect();
            }
          });

          // Add click handler to open popup
          const handleStopClick = (e: L.LeafletMouseEvent) => {
            if (onStopClick) {
              onStopClick();
            }

            // Force open the popup
            e.target.openPopup();
          };

          markerRef.current.on('click', handleStopClick);
        }

      } catch (error) {
        console.error('Error setting up stop indicator:', error);
      }
    };

    setupStopIndicator();

    return () => {
      if (markerRef.current) {
        // Remove all event listeners
        markerRef.current.off();

        // Unbind popup if exists
        if (markerRef.current.getPopup()) {
          markerRef.current.unbindPopup();
        }

        // Remove marker from map
        if (map) {
          try {
            map.removeLayer(markerRef.current);
          } catch (e) {
            console.error('Error removing marker layer:', e);
          }
        }

        // Clear the reference
        markerRef.current = null;
      }
    };
  }, [map, position, stopTime, color, showDialog, address, timeRange, stopId, isDimmed]);

  // Set up navigation event listener separately
  useEffect(() => {
    if (!onNavigateStop || !stopId) return;

    const eventName = `navigateStop-${stopId}`;

    // Remove any existing handler for this stop
    if (navigationHandlers[eventName]) {
      window.removeEventListener(eventName, navigationHandlers[eventName] as EventListener);
      delete navigationHandlers[eventName];
    }

    // Create and register new handler
    const handleNavigate = (e: CustomEvent) => {
      console.log('[StopIndicator] Single navigation event for stop:', stopId, 'direction:', e.detail);
      onNavigateStop(e.detail);
    };

    navigationHandlers[eventName] = handleNavigate;
    window.addEventListener(eventName, handleNavigate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener(eventName, handleNavigate as EventListener);
      delete navigationHandlers[eventName];
    };
  }, [stopId, onNavigateStop]);

  return null;
}