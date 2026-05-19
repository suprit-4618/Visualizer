import { useState } from 'react';
import StringVisualizer from './StringVisualizer';
import ArrayVisualizer from './ArrayVisualizer';
import ListVisualizer from './ListVisualizer';
import TupleVisualizer from './TupleVisualizer';
import DictVisualizer from './DictVisualizer';
import SetVisualizer from './SetVisualizer';
import LinkedListVisualizer from './LinkedListVisualizer';
import StackVisualizer from './StackVisualizer';
import QueueVisualizer from './QueueVisualizer';
import TreeVisualizer from './TreeVisualizer';
import GraphVisualizer from './GraphVisualizer';
import HeapVisualizer from './HeapVisualizer';
import SortingVisualizer from './SortingVisualizer';



function SidebarGroup({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="sidebar-group">
      <div className="sidebar-group-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{title}</span>
        <span style={{ fontSize: '0.7rem', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </div>
      {isOpen && <div className="sidebar-items">{children}</div>}
    </div>
  );
}

function App() {
  const [selected, setSelected] = useState('strings');

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Python DSA Visualizer</h1>
          <p className="subtitle">Interactive Data Structures built with React & Python</p>
        </div>
      </header>
      
      <div className="main-layout">
        <aside className="sidebar">
          <SidebarGroup title="Data Structures" defaultOpen={true}>
            <div className={`sidebar-item ${selected === 'strings' ? 'active' : ''}`} onClick={() => setSelected('strings')}>Strings</div>
            <div className={`sidebar-item ${selected === 'arrays' ? 'active' : ''}`} onClick={() => setSelected('arrays')}>Arrays</div>
            <div className={`sidebar-item ${selected === 'lists' ? 'active' : ''}`} onClick={() => setSelected('lists')}>Lists</div>
            <div className={`sidebar-item ${selected === 'tuples' ? 'active' : ''}`} onClick={() => setSelected('tuples')}>Tuples</div>
            <div className={`sidebar-item ${selected === 'dictionaries' ? 'active' : ''}`} onClick={() => setSelected('dictionaries')}>Dictionaries</div>
            <div className={`sidebar-item ${selected === 'sets' ? 'active' : ''}`} onClick={() => setSelected('sets')}>Sets</div>
            <div className={`sidebar-item ${selected === 'linkedlists' ? 'active' : ''}`} onClick={() => setSelected('linkedlists')}>Linked Lists</div>
            <div className={`sidebar-item ${selected === 'stacks' ? 'active' : ''}`} onClick={() => setSelected('stacks')}>Stacks</div>
            <div className={`sidebar-item ${selected === 'queues' ? 'active' : ''}`} onClick={() => setSelected('queues')}>Queues</div>
            <div className={`sidebar-item ${selected === 'trees' ? 'active' : ''}`} onClick={() => setSelected('trees')}>Trees</div>
            <div className={`sidebar-item ${selected === 'graphs' ? 'active' : ''}`} onClick={() => setSelected('graphs')}>Graphs</div>
            <div className={`sidebar-item ${selected === 'heaps' ? 'active' : ''}`} onClick={() => setSelected('heaps')}>Heaps</div>
          </SidebarGroup>

          <SidebarGroup title="Algorithms" defaultOpen={true}>
            <div className={`sidebar-item ${selected === 'sorting' ? 'active' : ''}`} onClick={() => setSelected('sorting')}>Sorting</div>
          </SidebarGroup>
        </aside>

        <main className={`content-area ${selected === 'strings' ? 'strings-mode' : ''} ${selected === 'arrays' ? 'arrays-mode' : ''} ${selected === 'lists' ? 'lists-mode' : ''} ${selected === 'tuples' ? 'tuples-mode' : ''} ${selected === 'dictionaries' ? 'dictionaries-mode' : ''} ${selected === 'sets' ? 'sets-mode' : ''} ${selected === 'linkedlists' ? 'linkedlists-mode' : ''} ${selected === 'stacks' ? 'stacks-mode' : ''} ${selected === 'queues' ? 'queues-mode' : ''} ${selected === 'trees' ? 'trees-mode' : ''} ${selected === 'graphs' ? 'graphs-mode' : ''} ${selected === 'heaps' ? 'heaps-mode' : ''} ${selected === 'sorting' ? 'sorting-mode' : ''}` }>
          {selected === 'arrays' && <ArrayVisualizer />}
          {selected === 'lists' && <ListVisualizer />}
          {selected === 'dictionaries' && <DictVisualizer />}
          {selected === 'strings' && <StringVisualizer />}
          {selected === 'sets' && <SetVisualizer />}
          {selected === 'tuples' && <TupleVisualizer />}
          {selected === 'linkedlists' && <LinkedListVisualizer />}
          {selected === 'stacks' && <StackVisualizer />}
          {selected === 'queues' && <QueueVisualizer />}
          {selected === 'trees' && <TreeVisualizer />}
          {selected === 'graphs' && <GraphVisualizer />}
          {selected === 'heaps' && <HeapVisualizer />}
          {selected === 'sorting' && <SortingVisualizer />}
        </main>
      </div>
    </div>
  );
}

export default App;
