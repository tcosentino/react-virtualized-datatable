import _ from 'underscore';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  AutoSizer,
  MultiGrid,
  CellMeasurer,
  SortDirection,
  CellMeasurerCache,
} from 'react-virtualized';
import './App.css';

class DataGrid extends Component {
  static _formatDateWithString(date, string) {
    const toParse = isNaN(date) ? date : Number(date);
    let tryFormat;
    if (typeof toParse === 'number') {
      tryFormat = moment.unix(toParse).format(string);
    } else {
      tryFormat = moment(toParse).format(string);
    }

    if (tryFormat === 'Invalid date') {
      return date;
    }

    return tryFormat;
  }

  static formatData(uiState, column, data) {
    if (_.isFunction(column.formatter)) {
      return column.formatter(data);
    }

    let myData = null;
    if (column.key.indexOf('.') > -1) {
      const split = column.key.split('.');
      if (split.length < 2) {
        return;
      }

      myData = data[split[0]][split[1]];
    } else {
      myData = data[column.key];
    }


    switch (column.type) {
      case 'date':
        return DataGrid._formatDateWithString(myData, 'M/D/YYYY');
      case 'dateTime':
        return DataGrid._formatDateWithString(myData, 'M/D/YYYY HH:mm');
      case 'array':
        return (
          <ul>
            { myData.map(item => (<li key={item}>{item}</li>)) }
          </ul>
        );
      default:
        return myData;
    }
  }

  constructor(props) {
    super(props);

    this.cellSizeCache = new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 45,
      // minHeight: browser.lessThan.small ? 40 : 50,
    });

    this.state = {
      focusCol: null,
      hoveredColumnIndex: null,
      hoveredRowIndex: null,

      sortBy: 'name',
      sortDirection: SortDirection.ASC,

      filters: {},
      filterOpened: false,
    };

    // stores the inputs
    this.filters = {};

    this.renderMultiGrid = this.renderMultiGrid.bind(this);
    this.onGridScroll = this.onGridScroll.bind(this);
    this.renderCell = this.renderCell.bind(this);
    this.getColumnWidth = this.getColumnWidth.bind(this);
    this.getRowHeight = this.getRowHeight.bind(this);
    this.onFilterChanged = this.onFilterChanged.bind(this);
  }

  componentDidMount() {
    const { tableName, defaultSort } = this.props;
    this.componentDidUpdate();
    if (!this.mainGrid) {
      this.props.setTableNewData(tableName, true);
      return;
    }

    if (defaultSort) {
      if (_.isString(defaultSort.sortDirection) &&
          defaultSort.sortDirection.toLowerCase() === 'asc') {
        defaultSort.sortDirection = SortDirection.ASC;
      } else if (_.isString(defaultSort.sortDirection) &&
          defaultSort.sortDirection.toLowerCase() === 'desc') {
        defaultSort.sortDirection = SortDirection.DESC;
      }

      this.sort(defaultSort);
    }

    setTimeout(() => {
      if (!this.mainGrid) { return; }
      // this.cellSizeCache.clearAll();
      this.mainGrid.measureAllCells();
      setTimeout(() => {
        if (!this.mainGrid) { return; }
        this.mainGrid.recomputeGridSize();
      }, 1);
    }, 1);
  }

  componentWillReceiveProps() {
    if (!this.mainGrid || !this.mainGrid._bottomRightGrid) {
      return;
    }

    const containerWidth = this.mainGrid._containerBottomStyle.width;
    const contentWidth = this.mainGrid._leftGridWidth +
      this.mainGrid._bottomRightGrid._scrollingContainer.scrollWidth;

    if (containerWidth === contentWidth) {
      this.setState({ scrolledAllLeft: true, scrolledAllRight: true });
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.focusCol && this.state.focusCol === nextState.focusCol) {
      this.setState({ focusCol: null });
    }
  }

  componentDidUpdate() {
    if (!this.mainGrid) {
      return;
    }

    if (this.state.focusCol !== null) {
      setTimeout(() => {
        if (!this.filters[this.state.focusCol]) {
          return;
        }

        this.filters[this.state.focusCol].focus();
      }, 200);
    }
  }

  onFilterClicked(colKey) {
    this.setState({
      filterOpened: !this.state.filterOpened,
      focusCol: this.state.filterOpened ? null : colKey,
    });
    // prevent bubbling to the header
    return false;
  }

  onFilterChanged(filterObj) {
    this.setState({
      ...this.state,
      filters: {
        ...this.state.filters,
        [filterObj.key]: filterObj,
      }
    }, () => {
      this.mainGrid.forceUpdateGrids();
    });
  }

  getColumnCount() {
    return this.getColumns().length;
  }

  getRowCount() {
    return this.getRows().length;
  }

  /**
   * Gets the columns to render in our table
   * @return {[Object]} array of column objects
   */
  getColumns() {
    return this.props.columns;
  }

  getColumn(index) {
    // adds defaults to the column
    return _.defaults(this.getColumns()[index], {
      sortable: true,
      filterable: true,
    });
  }

  /**
   * Gets the rows of data to render in our table
   * @param  {Number} [index=-1] passing an index >= 0 will return a single object rather than the entire array
   * @return {[Object]} Array of objects with unknown shapes
   * @return {Object} Single object when index >=0
   */
  getRows(index = -1) {
    const { items } = this.props;

    if (!items || !items.length) {
      return [];
    }

    const sorted = this._sortRows(this._filterRows(items));

    console.log(sorted);

    // get the name of each column into an array
    const colNames = {};
    this.getColumns().forEach((col) => {
      colNames[col.key] = col.name;
    });

    // put the header as column one, and the rest after
    const dataSet = [colNames, ...sorted];

    return index < 0 ? dataSet : dataSet[index];
  }

  // For now, sizing columns based on the type
  getColumnWidth(index) {
    const { columns, columnWidthMultiplier } = this.props;
    const { type, width } = columns[index.index];

    if (typeof width === 'number') {
      return width;
    }

    switch (type) {
      case 'text':
      case 'list':
        return columnWidthMultiplier * 300;
      case 'date':
        return columnWidthMultiplier * 150;
      case 'checkbox':
        return columnWidthMultiplier * 150;
      default:
        return columnWidthMultiplier * 200;
    }
  }

  getRowHeight(index) {
    return this.cellSizeCache.rowHeight(index);
  }

  _filterRows(items) {
    const filters = this.state.filters;
    if (filters === {}) {
      return items;
    }

    const filterItem = (result, item, filterKey) => {
      const filterObj = filters[filterKey];
      const filterVal = filterObj.value.toLowerCase();

      if (!filterVal) {
        return;
      }

      if (!item[filterObj.key]) {
        result.keep = false;
        return;
      }

      const itemVal = item[filterObj.key].toLowerCase();

      if (itemVal && itemVal.indexOf(filterVal) < 0) {
        result.keep = false;
      }
    };

    return items.filter((item) => {
      let result = { keep: true };

      Object.keys(filters).forEach(filterItem.bind(null, result, item));

      return result.keep;
    });
  }

  _sortRows(items) {
    const { sortBy, sortDirection } = this.state;
    return items.sort((a, b) => {
      if (typeof a[sortBy] === 'undefined') {
        return 1;
      }

      if (typeof b[sortBy] === 'undefined') {
        return -1;
      }

      if (a[sortBy] < b[sortBy]) {
        return sortDirection === SortDirection.ASC ? -1 : 1;
      }

      if (a[sortBy] > b[sortBy]) {
        return sortDirection === SortDirection.ASC ? 1 : -1;
      }

      return 0;
    });
  }

  setTableSort() {
    // TODO: set correct state???
    this.setState();
  }

  setTableFilter() {
    // TODO: update filter in the state
    this.setState();
  }

  onGridScroll(scrollInfo) {
    const {
      scrollLeft,
      clientWidth,
      scrollWidth,
    } = scrollInfo;

    const scrolledAllRight =
      (scrollLeft + clientWidth >= scrollWidth);
    const scrolledAllLeft = scrollLeft === 0;

    const updateObj = {};
    if (scrolledAllRight !== this.state.scrolledAllRight) {
      updateObj.scrolledAllRight = scrolledAllRight;
    }

    if (scrolledAllLeft !== this.state.scrolledAllLeft) {
      updateObj.scrolledAllLeft = scrolledAllLeft;
    }

    if (updateObj !== {}) {
      this.setState(updateObj);
    }

    this.props.onScroll(scrollInfo);
  }

  renderMultiGrid({ width, height }) {
    const boxShadow = this.state.scrolledAllLeft ?
      false : '1px 3px 3px #a2a2a2';
    return (
      <div className="grid-container">
        <MultiGrid
          cellRenderer={this.renderCell}
          columnCount={this.getColumnCount()}
          columnWidth={this.getColumnWidth}
          fixedColumnCount={this.getColumnCount() < 2 ? 0 : 1}
          height={height}
          rowHeight={this.getRowHeight}
          rowCount={this.getRowCount()}
          fixedRowCount={1}
          deferredMeasurementCache={this.cellSizeCache}
          noRowsRenderer={DataGrid.emptyRenderer}
          width={width}
          onScroll={this.onGridScroll}
          className={classNames('data-grid', {
            'scrolled-left': this.state.scrolledAllLeft,
          })}
          styleBottomLeftGrid={{ boxShadow }}
          ref={(grid) => { this.mainGrid = grid; }}
        />
        <div
          className={classNames('scroll-x-indicator', {
            faded: this.state.scrolledAllRight,
          })}
        >
          <i className="fa fa-fw fa-angle-double-right" />
        </div>
      </div>
    );
  }

  renderCell({ columnIndex, rowIndex, style, parent }) {
    const { ui, onRowClicked } = this.props;
    const data = this.getRows(rowIndex);

    if (!data) {
      return null;
    }

    const column = this.getColumn(columnIndex);
    const { sortBy, sortDirection } = this.state;
    const filter = this.state.filters[column.key];

    return (
      <CellMeasurer
        cache={this.cellSizeCache}
        columnIndex={columnIndex}
        key={`${columnIndex},${rowIndex}`}
        parent={parent}
        rowIndex={rowIndex}
        ref={(cellMeasurer) => {
          this.cellMeasurer = cellMeasurer;
        }}
      >
        <div
          style={{
            ...style,
            maxWidth: 1000,
            width: this.getColumnWidth({ index: columnIndex }),
          }}
          className={classNames({
            'grid-header-cell': rowIndex === 0,
            'grid-header-filterable': column.filterable,
            'grid-cell': rowIndex > 0,
            'grid-row-even': rowIndex % 2 === 0,
            'first-col': columnIndex === 0,
            'last-col': columnIndex === this.getColumnCount(),
            'grid-cell-filter': rowIndex === 0 && this.state.filterOpened,
            'grid-cell-sort': rowIndex === 0 && sortBy === column.key,
            'grid-row-hovered': rowIndex === this.state.hoveredRowIndex,
            'grid-column-hovered': columnIndex === this.state.hoveredColumnIndex,
          })}
          onMouseOver={() => {
            this.setState({
              hoveredColumnIndex: columnIndex,
              hoveredRowIndex: rowIndex,
            }, () => {
              this.mainGrid.forceUpdateGrids();
            });
          }}
          onClick={() => {
            if (rowIndex === 0 && sortBy === column.key && column.sortable) {
              this.sort({
                sortBy: column.key,
                sortDirection: sortDirection === SortDirection.ASC ?
                    SortDirection.DESC : SortDirection.ASC,
              });
            } else if (rowIndex === 0 && column.sortable) {
              this.sort({
                sortBy: column.key,
                sortDirection: SortDirection.ASC,
              });
            } else if (rowIndex !== 0) {
              onRowClicked(data);
            }
          }}
        >
          {
            rowIndex === 0 && sortBy === column.key &&
            <span className="grid-sort-indicator">
              <i
                className={classNames('fa', {
                  'fa-sort-asc': sortDirection === SortDirection.ASC,
                  'fa-sort-desc': sortDirection === SortDirection.DESC,
                })}
              />
            </span>
          }
          <div className="grid-cell-data">
            {rowIndex === 0 ? data[column.key] :
              DataGrid.formatData(ui, column, data)}
          </div>
          {
            rowIndex === 0 && column.filterable &&
            <input
              type="text"
              className="filter-input"
              onClick={(e) => {
                // when we click on the input we need to prevent sorting
                e.stopPropagation();
              }}
              ref={(input) => {
                this.filters[column.key] = input;
              }}
              value={filter && filter.value ? filter.value : ''}
              onChange={(e) => {
                const filterObj = {
                  key: column.key,
                  value: e.target.value,
                };

                console.log(filterObj);
                this.onFilterChanged(filterObj);
              }}
            />
          }
          {
            rowIndex === 0 && column.filterable &&
            <a
              className={classNames('grid-filter-indicator', {
                active: filter && filter.value,
              })}
              tabIndex={columnIndex}
              onClick={(e) => {
                e.stopPropagation();
                this.onFilterClicked(column.key);
              }}
            >
              <i
                className="fa fa-filter fa-fw"
              />
            </a>
          }
        </div>
      </CellMeasurer>
    );
  }

  render() {
    console.log('rendering?');
    console.log(this.state);
    return (
      <AutoSizer>
        {this.renderMultiGrid}
      </AutoSizer>
    );
  }
}

DataGrid.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  onRowClicked: PropTypes.func,
  onScroll: PropTypes.func,
  defaultSort: PropTypes.shape({
    sortBy: PropTypes.string,
    sortDirection: PropTypes.string,
  }),
  columnWidthMultiplier: PropTypes.number,
};

DataGrid.defaultProps = {
  title: '',
  count: 0,
  defaultSort: null,
  columnWidthMultiplier: 1,
  onPageChange: () => {},
  onScroll: () => {},
  onRowClicked: () => {},
};

export default DataGrid;
