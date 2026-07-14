import { BrowserRouter as Router } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AppRoutes } from './routes/routes';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

const theme = {
  token: {
    colorPrimary: '#0ea5e9', // Tailwind primary-500
    colorInfo: '#0ea5e9',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    fontFamily: "'Inter', sans-serif",
    borderRadius: 6,
  },
};

import { StyleProvider, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs';

function App() {
  return (
    <StyleProvider layer hashPriority='low' transformers={[legacyLogicalPropertiesTransformer]} >
      <ConfigProvider theme={theme}>
        <WorkspaceProvider>
          <Router>
            <AppRoutes />
          </Router>
        </WorkspaceProvider>
      </ConfigProvider>
    </StyleProvider>
  );
}

export default App;
