'use client';

import { useEffect } from 'react';
import { ConfigProvider, App as AntApp, unstableSetRender } from 'antd';
import esES from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import 'antd/dist/reset.css';
import FilterUrlSync from '@/components/Filters/FilterUrlSync';

dayjs.extend(customParseFormat);
dayjs.locale('es');

type AntdContainer = HTMLElement & { __antdRoot__?: Root };

const ensureAntdReact19Compat = () => {
  unstableSetRender((node, container) => {
    const host = container as AntdContainer;
    if (!host.__antdRoot__) {
      host.__antdRoot__ = createRoot(host);
    }
    host.__antdRoot__.render(node);
    return () => {
      host.__antdRoot__?.unmount();
      delete host.__antdRoot__;
    };
  });
};

if (typeof window !== 'undefined') {
  ensureAntdReact19Compat();
}

const theme = {
  token: {
    colorPrimary: '#3b82f6',
    borderRadius: 8,
    fontFamily: '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 18,
    lineHeight: 1.5,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.3,
    lineHeightHeading3: 1.4,
    fontWeightStrong: 600,
    colorText: '#111827',
    colorTextSecondary: '#6b7280',
    colorTextTertiary: '#9ca3af',
    colorTextQuaternary: '#d1d5db',
  },
  components: {
    Button: {
      controlHeight: 36,
      fontSize: 14,
      fontSizeLG: 16,
      fontSizeSM: 12,
    },
    Select: {
      controlHeight: 36,
      fontSize: 14,
    },
    DatePicker: {
      controlHeight: 36,
      fontSize: 14,
    },
    Input: {
      controlHeight: 36,
      fontSize: 14,
    },
    Typography: {
      fontSizeHeading1: 32,
      fontSizeHeading2: 24,
      fontSizeHeading3: 20,
      fontSizeHeading4: 18,
      fontSizeHeading5: 16,
      fontWeightStrong: 600,
      titleMarginBottom: '0.5em',
      titleMarginTop: '0',
    },
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
    List: {
      itemPadding: '8px 16px',
      fontSize: 14,
    },
    Tabs: {
      fontSize: 14,
      fontSizeLG: 16,
    },
    Tag: {
      fontSize: 12,
    },
  },
};

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    ensureAntdReact19Compat();
  }, []);

  return (
    <ConfigProvider theme={theme} locale={esES}>
      <AntApp>
        <FilterUrlSync />
        {children}
      </AntApp>
    </ConfigProvider>
  );
}
