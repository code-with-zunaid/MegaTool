import { useState } from 'react';
import ImageConverter from './components/ImageConverter/ImageConverter';
import PdfTools from './components/PdfTools/PdfTools';

function App() {
  const [activeTab, setActiveTab] = useState('images');

  return (
    <div className="app">
      <nav className="conversion-nav">
        <button 
          onClick={() => setActiveTab('images')}
          className={activeTab === 'images' ? 'active' : ''}
        >
          Image Tools
        </button>
        <button 
          onClick={() => setActiveTab('pdf')}
          className={activeTab === 'pdf' ? 'active' : ''}
        >
          PDF Tools
        </button>
      </nav>

      {activeTab === 'images' && <ImageConverter />}
      {activeTab === 'pdf' && <PdfTools />}
    </div>
  );
}

export default App;