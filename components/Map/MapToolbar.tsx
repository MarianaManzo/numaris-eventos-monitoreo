'use client';

import { FrameCorners, CornersOut, Target } from 'phosphor-react';
import { useState } from 'react';
import LayerToggleButton from './LayerToggleButton';

interface LayerOption {
  id: string;
  label: string;
  icon: 'vehicles' | 'events' | 'zones';
  isVisible: boolean;
  onToggle: () => void;
}

interface MapToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onRecenterRoute?: () => void;
  onFitEventAndVehicle?: () => void; // NEW: Fit bounds to selected event + related vehicle
  hasEventAndVehicle?: boolean; // NEW: Whether an event with related vehicle is selected
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  layers?: LayerOption[];
}

export default function MapToolbar({
  onZoomIn,
  onZoomOut,
  onResetView,
  onRecenterRoute,
  onFitEventAndVehicle,
  hasEventAndVehicle = false,
  onToggleFullscreen,
  isFullscreen,
  layers,
}: MapToolbarProps) {
  const [isRecenterPressed, setIsRecenterPressed] = useState(false);
  const [isFitEventVehiclePressed, setIsFitEventVehiclePressed] = useState(false);

  const handleRecenterClick = () => {
    if (onRecenterRoute) {
      setIsRecenterPressed(true);
      onRecenterRoute();
      // Return to default state after brief moment
      setTimeout(() => setIsRecenterPressed(false), 150);
    }
  };

  const handleFitEventAndVehicleClick = () => {
    if (onFitEventAndVehicle) {
      setIsFitEventVehiclePressed(true);
      onFitEventAndVehicle();
      // Return to default state after brief moment
      setTimeout(() => setIsFitEventVehiclePressed(false), 150);
    }
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 flex flex-col z-[10000] pointer-events-none">
      {/* Top Section - Fullscreen Button and Layer Controls */}
      <div className="pointer-events-auto mb-auto flex flex-col gap-1">
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            className="w-10 h-10 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            style={{
              backgroundColor: isFullscreen ? '#1867ff' : 'white'
            }}
          >
            <FrameCorners size={20} weight="regular" color={isFullscreen ? 'white' : '#1867ff'} />
          </button>
        )}
        {layers && layers.length > 0 && <LayerToggleButton layers={layers} />}
        {/* Fit Event + Vehicle Button - Only shows when event is selected */}
        {hasEventAndVehicle && onFitEventAndVehicle && (
          <button
            onClick={handleFitEventAndVehicleClick}
            title="Centrar evento y vehículo"
            className="w-10 h-10 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isFitEventVehiclePressed ? '#1867ff' : 'white'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_181622_258)">
                <path d="M22.8787 18.0156C23.6478 18.0733 24.368 18.3045 25.0008 18.6709V27.1836C25.0008 27.2357 24.9956 27.2865 24.9871 27.3359C24.2544 27.7572 23.4057 28 22.4998 28C22.3238 28 22.1497 27.9904 21.9783 27.9727C21.7314 27.8787 21.5385 27.6526 21.4783 27.3633L21.2508 26.252H18.7039C18.1885 25.6509 17.8139 24.9267 17.6297 24.1289H22.8787V18.0156Z" fill={isFitEventVehiclePressed ? 'white' : '#1867FF'}/>
                <path d="M21.3533 18.1943C21.5744 18.4154 21.699 18.7157 21.699 19.0283C21.699 19.3411 21.5745 19.6412 21.3533 19.8623C21.1323 20.0832 20.8328 20.2078 20.5203 20.208C20.2077 20.208 19.9075 20.0833 19.6864 19.8623C19.4871 19.6631 19.3665 19.4 19.3446 19.1211C19.9075 18.6627 20.5724 18.3247 21.2996 18.1455C21.3177 18.1615 21.3362 18.1772 21.3533 18.1943Z" fill={isFitEventVehiclePressed ? 'white' : '#1867FF'}/>
                <path fillRule="evenodd" clipRule="evenodd" d="M20.2821 14.3584C25.0832 13.0719 30.019 15.9205 31.3055 20.7217C32.0552 23.52 31.3972 26.3626 29.7694 28.5029L33.2059 32.1445L31.7518 33.5176L28.3875 29.9531C27.413 30.7697 26.2503 31.3934 24.9412 31.7441C20.1403 33.0305 15.2056 30.1816 13.9188 25.3809C12.6323 20.5799 15.4812 15.6451 20.2821 14.3584ZM29.3729 21.2393C28.3721 17.5052 24.5338 15.2895 20.7996 16.29C17.0657 17.2909 14.8499 21.1292 15.8504 24.8633C16.8513 28.597 20.6897 30.8129 24.4237 29.8125C28.1576 28.8119 30.3731 24.9733 29.3729 21.2393Z" fill={isFitEventVehiclePressed ? 'white' : '#1867FF'}/>
                <path d="M19.7684 5.9707C20.1676 5.9705 20.5571 6.09683 20.8797 6.33203C21.2022 6.56722 21.4414 6.89923 21.5633 7.2793L23.284 12.0303C23.025 12.012 22.7635 12 22.4998 12C22.0091 12 21.5262 12.0354 21.0526 12.0977L19.6004 8.09082H6.99299C6.88995 8.09095 6.80177 8.15576 6.76936 8.25293L6.75764 8.29102L6.74299 8.3291L4.59944 14.2227H15.8719C15.2302 14.708 14.6439 15.2622 14.1229 15.874H3.99788L3.53792 17.1416V24.1289H11.5574C11.632 24.8601 11.7775 25.5703 11.9881 26.252H5.16585L4.93831 27.3633C4.86165 27.7465 4.54598 28.0204 4.18342 28.0205H2.19026C1.76297 28.0203 1.41497 27.6463 1.41487 27.1836V16.918C1.41487 16.8178 1.43324 16.7173 1.46858 16.623L1.89534 15.4434L0.115065 14.4053C0.00313246 14.3404 -0.0357089 14.1989 0.0291273 14.0869L0.728346 12.8691C0.759715 12.8157 0.811054 12.7768 0.870924 12.7607C0.931093 12.7448 0.995681 12.7531 1.04964 12.7842L2.54768 13.6572L4.7469 7.60742C5.06235 6.63167 5.97009 5.97083 6.99299 5.9707H19.7684Z" fill={isFitEventVehiclePressed ? 'white' : '#1867FF'}/>
                <path d="M10.4959 19.707C10.6255 19.7072 10.7312 19.8128 10.7313 19.9424V21.0039H11.6844C11.5857 21.5419 11.5259 22.093 11.5086 22.6553H9.31624C9.18664 22.6551 9.08088 22.5486 9.08088 22.4189V19.9424C9.08094 19.8128 9.18668 19.7072 9.31624 19.707H10.4959Z" fill={isFitEventVehiclePressed ? 'white' : '#1867FF'}/>
                <path d="M5.89631 17.8496C6.20893 17.8497 6.50919 17.9733 6.7303 18.1943C6.95136 18.4154 7.07595 18.7157 7.076 19.0283C7.076 19.3411 6.95141 19.6412 6.7303 19.8623C6.50917 20.0834 6.20902 20.208 5.89631 20.208C5.58366 20.2079 5.28343 20.0834 5.06233 19.8623C4.8413 19.6412 4.7176 19.341 4.7176 19.0283C4.71766 18.7156 4.84122 18.4154 5.06233 18.1943C5.28343 17.9733 5.58366 17.8497 5.89631 17.8496Z" fill={isFitEventVehiclePressed ? 'white' : '#1867FF'}/>
              </g>
              <defs>
                <clipPath id="clip0_181622_258">
                  <rect width="36" height="36" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Section - Navigation Controls */}
      <div className="flex flex-col gap-1 pointer-events-auto mt-auto">
        {onRecenterRoute && (
          <button
            onClick={handleRecenterClick}
            title="Centrar en eventos"
            className="w-10 h-10 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isRecenterPressed ? '#1867ff' : 'white'
            }}
          >
            <CornersOut size={20} weight="regular" color={isRecenterPressed ? 'white' : '#1867ff'} />
          </button>
        )}

        <button
          onClick={onZoomIn}
          title="Acercar"
          className="w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <svg width="20" height="20" fill="#1867ff" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>
          </svg>
        </button>

        <button
          onClick={onZoomOut}
          title="Alejar"
          className="w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <svg width="20" height="20" fill="#1867ff" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
