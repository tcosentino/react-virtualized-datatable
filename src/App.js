import React, { Component } from 'react';
import DataGrid from './DataGrid';
import './App.css';

// data for the grid
const items = [
  { col1: '(1,1)', col2: '(2,1)', col3: '(3,1)' },
  { col1: '(1,2)', col2: '(2,2)', col3: '(3,2)' },
  { col1: '(1,3)', col2: '(2,3)', col3: '(3,3)' },
  { col1: '(1,4)', col2: '(2,4)', col3: '(3,4)' },
];

// column definition for grid
const columns = [
  { name: 'Col 1', key: 'col1', type: 'string', isPrimary: true },
  { name: 'Col 2', key: 'col2', type: 'string', isPrimary: true },
  { name: 'Col 3', key: 'col3', type: 'string', isPrimary: true },
];

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>React Data Grid</h2>
        </div>
        <DataGrid
          items={items}
          columns={columns}
        />
      </div>
    );
  }
}

export default App;