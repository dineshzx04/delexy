 import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App';
import { StyleProvider, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs';
import './index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <BrowserRouter>
      <StyleProvider layer hashPriority='low' transformers={[legacyLogicalPropertiesTransformer]} >

        <ConfigProvider
          theme={{
            token: {
              fontFamily: "'Inter', sans-serif",
              colorPrimary: '#0284c7', // Sky 600
              borderRadius: 4,
              colorBgContainer: '#ffffff',
              colorBgLayout: '#f9fafb',
            },
            components: {
              Button: {
                controlHeight: 36,
                paddingInline: 16,
              },
              Input: {
                controlHeight: 36,
              },
            }
          }}
        >
          <App />
        </ConfigProvider>
      </StyleProvider>

    </BrowserRouter>
  );
}
