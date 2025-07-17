import { SocketProvider } from './context/SocketContext';
import LoginForm from './components/LoginForm';
import ChatPage from './pages/ChatPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <div className="app">
        <h1>Enhle's Chat World</h1>
        <LoginForm />
        <ChatPage />
        <ToastContainer />
      </div>
    </SocketProvider>
  );
}

export default App;