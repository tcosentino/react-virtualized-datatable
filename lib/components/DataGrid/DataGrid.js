'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _AutoSizer = require('react-virtualized/dist/commonjs/AutoSizer');

var _AutoSizer2 = _interopRequireDefault(_AutoSizer);

var _MultiGrid = require('react-virtualized/dist/commonjs/MultiGrid');

var _MultiGrid2 = _interopRequireDefault(_MultiGrid);

var _CellMeasurer = require('react-virtualized/dist/commonjs/CellMeasurer');

var _CellMeasurer2 = _interopRequireDefault(_CellMeasurer);

var _SortDirection = require('react-virtualized/dist/commonjs/Table/SortDirection');

var _SortDirection2 = _interopRequireDefault(_SortDirection);

var _CellMeasurerCache = require('react-virtualized/dist/commonjs/CellMeasurer/CellMeasurerCache');

var _CellMeasurerCache2 = _interopRequireDefault(_CellMeasurerCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DataGrid = function (_Component) {
  _inherits(DataGrid, _Component);

  _createClass(DataGrid, null, [{
    key: '_formatDateWithString',
    value: function _formatDateWithString(date, string) {
      var toParse = isNaN(date) ? date : Number(date);
      var tryFormat = void 0;
      if (typeof toParse === 'number') {
        tryFormat = _moment2.default.unix(toParse).format(string);
      } else {
        tryFormat = (0, _moment2.default)(toParse).format(string);
      }

      if (tryFormat === 'Invalid date') {
        return date;
      }

      return tryFormat;
    }
  }, {
    key: 'formatData',
    value: function formatData(column, data) {
      if (_underscore2.default.isFunction(column.formatter)) {
        return column.formatter(data);
      }

      var myData = null;
      if (column.key.indexOf('.') > -1) {
        var split = column.key.split('.');
        if (split.length < 2) {
          return;
        }

        myData = data[split[0]][split[1]];
      } else {
        myData = data[column.key];
      }

      return DataGrid.formatValue(myData, column.type);
    }
  }, {
    key: 'formatValue',
    value: function formatValue(value, type) {
      switch (type) {
        case 'date':
          return DataGrid._formatDateWithString(value, 'M/D/YYYY');
        case 'dateTime':
          return DataGrid._formatDateWithString(value, 'M/D/YYYY HH:mm');
        case 'array':
          return _react2.default.createElement(
            'ul',
            null,
            value.map(function (item) {
              return _react2.default.createElement(
                'li',
                { key: item },
                item
              );
            })
          );
        default:
          return value;
      }
    }
  }]);

  function DataGrid(props) {
    _classCallCheck(this, DataGrid);

    var _this = _possibleConstructorReturn(this, (DataGrid.__proto__ || Object.getPrototypeOf(DataGrid)).call(this, props));

    _this.cellSizeCache = new _CellMeasurerCache2.default({
      fixedWidth: true,
      defaultHeight: 45
      // minHeight: browser.lessThan.small ? 40 : 50,
    });

    _this.state = {
      focusCol: null,
      hoveredColumnIndex: null,
      hoveredRowIndex: null,

      sortBy: 'name',
      sortDirection: _SortDirection2.default.ASC,

      filters: {},
      filterOpened: false,
      scrolledAllLeft: true
    };

    // stores the inputs
    _this.filters = {};

    _this.renderMultiGrid = _this.renderMultiGrid.bind(_this);
    _this.onGridScroll = _this.onGridScroll.bind(_this);
    _this.renderCell = _this.renderCell.bind(_this);
    _this.getColumnWidth = _this.getColumnWidth.bind(_this);
    _this.getRowHeight = _this.getRowHeight.bind(_this);
    _this.onFilterChanged = _this.onFilterChanged.bind(_this);
    return _this;
  }

  _createClass(DataGrid, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      var _props = this.props,
          tableName = _props.tableName,
          defaultSort = _props.defaultSort;

      this.componentDidUpdate();
      if (!this.mainGrid) {
        this.props.setTableNewData(tableName, true);
        return;
      }

      if (defaultSort) {
        if (_underscore2.default.isString(defaultSort.sortDirection) && defaultSort.sortDirection.toLowerCase() === 'asc') {
          defaultSort.sortDirection = _SortDirection2.default.ASC;
        } else if (_underscore2.default.isString(defaultSort.sortDirection) && defaultSort.sortDirection.toLowerCase() === 'desc') {
          defaultSort.sortDirection = _SortDirection2.default.DESC;
        }

        this.setTableSort(defaultSort);
      }

      setTimeout(function () {
        if (!_this2.mainGrid) {
          return;
        }
        // this.cellSizeCache.clearAll();
        _this2.mainGrid.measureAllCells();
        setTimeout(function () {
          if (!_this2.mainGrid) {
            return;
          }
          _this2.mainGrid.recomputeGridSize();
        }, 1);
      }, 1);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps() {
      console.log('here?');
      if (!this.mainGrid || !this.mainGrid._bottomRightGrid) {
        return;
      }

      var containerWidth = this.mainGrid._containerBottomStyle.width;
      var contentWidth = this.mainGrid._leftGridWidth + this.mainGrid._bottomRightGrid._scrollingContainer.scrollWidth;

      console.log(containerWidth);
      console.log(contentWidth);
      if (containerWidth === contentWidth) {
        this.setState({ scrolledAllLeft: true, scrolledAllRight: true });
      }
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps, nextState) {
      if (this.state.focusCol && this.state.focusCol === nextState.focusCol) {
        this.setState({ focusCol: null });
      }
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      var _this3 = this;

      if (!this.mainGrid) {
        return;
      }

      if (this.state.focusCol !== null) {
        setTimeout(function () {
          if (!_this3.filters[_this3.state.focusCol]) {
            return;
          }

          _this3.filters[_this3.state.focusCol].focus();
        }, 200);
      }
    }
  }, {
    key: 'onFilterClicked',
    value: function onFilterClicked(colKey) {
      var _this4 = this;

      this.setState({
        filterOpened: !this.state.filterOpened,
        focusCol: this.state.filterOpened ? null : colKey
      }, function () {
        _this4.mainGrid.forceUpdateGrids();
      });
      // prevent bubbling to the header
      return false;
    }
  }, {
    key: 'onFilterChanged',
    value: function onFilterChanged(filterObj) {
      var _this5 = this;

      this.setState(_extends({}, this.state, {
        filters: _extends({}, this.state.filters, _defineProperty({}, filterObj.key, filterObj))
      }), function () {
        _this5.mainGrid.forceUpdateGrids();
      });
    }
  }, {
    key: 'getColumnCount',
    value: function getColumnCount() {
      return this.getColumns().length;
    }
  }, {
    key: 'getRowCount',
    value: function getRowCount() {
      return this.getRows().length;
    }

    /**
     * Gets the columns to render in our table
     * @return {[Object]} array of column objects
     */

  }, {
    key: 'getColumns',
    value: function getColumns() {
      return this.props.columns;
    }
  }, {
    key: 'getColumn',
    value: function getColumn(index) {
      // adds defaults to the column
      return _underscore2.default.defaults(this.getColumns()[index], {
        sortable: true,
        filterable: true
      });
    }

    /**
     * Gets the rows of data to render in our table
     * @param  {Number} [index=-1] passing an index >= 0 will return a single object rather than the entire array
     * @return {[Object]} Array of objects with unknown shapes
     * @return {Object} Single object when index >=0
     */

  }, {
    key: 'getRows',
    value: function getRows() {
      var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;
      var items = this.props.items;


      if (!items || !items.length) {
        return [];
      }

      var sorted = this._sortRows(this._filterRows(items));

      // get the name of each column into an array
      var colNames = {};
      this.getColumns().forEach(function (col) {
        colNames[col.key] = col.name;
      });

      // put the header as column one, and the rest after
      var dataSet = [colNames].concat(_toConsumableArray(sorted));

      return index < 0 ? dataSet : dataSet[index];
    }

    // For now, sizing columns based on the type

  }, {
    key: 'getColumnWidth',
    value: function getColumnWidth(index) {
      var _props2 = this.props,
          columns = _props2.columns,
          columnWidthMultiplier = _props2.columnWidthMultiplier;
      var _columns$index$index = columns[index.index],
          type = _columns$index$index.type,
          width = _columns$index$index.width;


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
  }, {
    key: 'getRowHeight',
    value: function getRowHeight(index) {
      return this.cellSizeCache.rowHeight(index);
    }
  }, {
    key: '_filterRows',
    value: function _filterRows(items) {
      var filters = this.state.filters;
      if (filters === {}) {
        return items;
      }

      var filterItem = function filterItem(result, item, filterKey) {
        var filterObj = filters[filterKey];
        var filterVal = filterObj.value.toLowerCase();

        if (!filterVal) {
          return;
        }

        if (!item[filterObj.key]) {
          result.keep = false;
          return;
        }

        var itemVal = item[filterObj.key].toLowerCase();

        if (itemVal && itemVal.indexOf(filterVal) < 0) {
          result.keep = false;
        }
      };

      return items.filter(function (item) {
        var result = { keep: true };

        Object.keys(filters).forEach(filterItem.bind(null, result, item));

        return result.keep;
      });
    }
  }, {
    key: '_sortRows',
    value: function _sortRows(items) {
      var _state = this.state,
          sortBy = _state.sortBy,
          sortDirection = _state.sortDirection;

      var sortCol = _underscore2.default.findWhere(this.getColumns(), { key: sortBy });

      // trying to sort by a column that is not part of this table
      if (!sortCol) {
        return items;
      }
      return items.sort(function (a, b) {
        var aVal = DataGrid.formatData(sortCol, a);
        var bVal = DataGrid.formatData(sortCol, b);
        if (typeof aVal === 'undefined') {
          return 1;
        }

        if (typeof bVal === 'undefined') {
          return -1;
        }

        if (aVal < bVal) {
          return sortDirection === _SortDirection2.default.ASC ? -1 : 1;
        }

        if (aVal > bVal) {
          return sortDirection === _SortDirection2.default.ASC ? 1 : -1;
        }

        return 0;
      });
    }
  }, {
    key: 'setTableSort',
    value: function setTableSort(_ref) {
      var _this6 = this;

      var sortBy = _ref.sortBy,
          sortDirection = _ref.sortDirection;

      if (!sortBy) {
        throw new Error('setTableSort requires sortBy option');
      }

      if (!sortDirection) {
        throw new Error('setTableSort requires sortDirection option');
      }

      this.setState(_extends({}, this.state, { sortBy: sortBy, sortDirection: sortDirection }), function () {
        _this6.mainGrid.forceUpdateGrids();
      });
    }
  }, {
    key: 'setTableFilter',
    value: function setTableFilter() {
      // TODO: update filter in the state
      this.setState();
    }
  }, {
    key: 'onGridScroll',
    value: function onGridScroll(scrollInfo) {
      var _this7 = this;

      var scrollLeft = scrollInfo.scrollLeft,
          clientWidth = scrollInfo.clientWidth,
          scrollWidth = scrollInfo.scrollWidth;


      var scrolledAllRight = scrollLeft + clientWidth >= scrollWidth;
      var scrolledAllLeft = scrollLeft === 0;

      var updateObj = {};
      if (scrolledAllRight !== this.state.scrolledAllRight) {
        updateObj.scrolledAllRight = scrolledAllRight;
      }

      if (scrolledAllLeft !== this.state.scrolledAllLeft) {
        updateObj.scrolledAllLeft = scrolledAllLeft;
      }

      console.log(updateObj);
      if (updateObj !== {}) {
        this.setState(updateObj, function () {
          console.log(updateObj);
          _this7.mainGrid.forceUpdateGrids();
        });
      }

      this.props.onScroll(scrollInfo);
    }
  }, {
    key: 'renderMultiGrid',
    value: function renderMultiGrid(_ref2) {
      var _this8 = this;

      var width = _ref2.width,
          height = _ref2.height;
      var fixedColumns = this.props.fixedColumns;

      var boxShadow = this.state.scrolledAllLeft ? false : '1px 3px 3px #a2a2a2';
      var colCount = this.getColumnCount();

      console.log(this.state);
      return _react2.default.createElement(_MultiGrid2.default, {
        cellRenderer: this.renderCell,
        columnCount: colCount,
        columnWidth: this.getColumnWidth,
        fixedColumnCount: colCount < 2 ? 0 : Math.min(fixedColumns, colCount),
        height: height,
        rowHeight: this.getRowHeight,
        rowCount: this.getRowCount(),
        fixedRowCount: 1,
        deferredMeasurementCache: this.cellSizeCache,
        noRowsRenderer: DataGrid.emptyRenderer,
        width: width,
        onScroll: this.onGridScroll,
        className: (0, _classnames2.default)('data-grid', {
          'scrolled-left': this.state.scrolledAllLeft
        }),
        styleBottomLeftGrid: { boxShadow: boxShadow },
        ref: function ref(grid) {
          _this8.mainGrid = grid;
        }
      });
    }
  }, {
    key: 'renderCell',
    value: function renderCell(_ref3) {
      var _this9 = this;

      var columnIndex = _ref3.columnIndex,
          rowIndex = _ref3.rowIndex,
          style = _ref3.style,
          parent = _ref3.parent;
      var onRowClicked = this.props.onRowClicked;

      var data = this.getRows(rowIndex);

      if (!data) {
        return null;
      }

      var column = this.getColumn(columnIndex);
      var _state2 = this.state,
          sortBy = _state2.sortBy,
          sortDirection = _state2.sortDirection;

      var filter = this.state.filters[column.key];

      return _react2.default.createElement(
        _CellMeasurer2.default,
        {
          cache: this.cellSizeCache,
          columnIndex: columnIndex,
          key: columnIndex + ',' + rowIndex,
          parent: parent,
          rowIndex: rowIndex,
          ref: function ref(cellMeasurer) {
            _this9.cellMeasurer = cellMeasurer;
          }
        },
        _react2.default.createElement(
          'div',
          {
            style: _extends({}, style, {
              maxWidth: 1000,
              width: this.getColumnWidth({ index: columnIndex })
            }),
            className: (0, _classnames2.default)({
              'grid-header-cell': rowIndex === 0,
              'grid-header-filterable': column.filterable,
              'grid-cell': rowIndex > 0,
              'grid-row-even': rowIndex % 2 === 0,
              'first-col': columnIndex === 0,
              'last-col': columnIndex === this.getColumnCount(),
              'grid-cell-filter': rowIndex === 0 && this.state.filterOpened,
              'grid-cell-sort': rowIndex === 0 && sortBy === column.key,
              'grid-row-hovered': rowIndex === this.state.hoveredRowIndex,
              'grid-column-hovered': columnIndex === this.state.hoveredColumnIndex
            }),
            onMouseOver: function onMouseOver() {
              _this9.setState({
                hoveredColumnIndex: columnIndex,
                hoveredRowIndex: rowIndex
              }, function () {
                _this9.mainGrid.forceUpdateGrids();
              });
            },
            onClick: function onClick() {
              if (rowIndex === 0 && sortBy === column.key && column.sortable) {
                _this9.setTableSort({
                  sortBy: column.key,
                  sortDirection: sortDirection === _SortDirection2.default.ASC ? _SortDirection2.default.DESC : _SortDirection2.default.ASC
                });
              } else if (rowIndex === 0 && column.sortable) {
                _this9.setTableSort({
                  sortBy: column.key,
                  sortDirection: _SortDirection2.default.ASC
                });
              } else if (rowIndex !== 0) {
                onRowClicked(data);
              }
            }
          },
          rowIndex === 0 && sortBy === column.key && _react2.default.createElement(
            'span',
            { className: 'grid-sort-indicator' },
            _react2.default.createElement('i', {
              className: (0, _classnames2.default)('fa', {
                'fa-sort-asc': sortDirection === _SortDirection2.default.ASC,
                'fa-sort-desc': sortDirection === _SortDirection2.default.DESC
              })
            })
          ),
          _react2.default.createElement(
            'div',
            { className: 'grid-cell-data' },
            rowIndex === 0 ? data[column.key] : DataGrid.formatData(column, data)
          ),
          rowIndex === 0 && column.filterable && _react2.default.createElement('input', {
            type: 'text',
            className: 'filter-input',
            onClick: function onClick(e) {
              // when we click on the input we need to prevent sorting
              e.stopPropagation();
            },
            ref: function ref(input) {
              _this9.filters[column.key] = input;
            },
            value: filter && filter.value ? filter.value : '',
            onChange: function onChange(e) {
              var filterObj = {
                key: column.key,
                value: e.target.value
              };

              console.log(filterObj);
              _this9.onFilterChanged(filterObj);
            }
          }),
          rowIndex === 0 && column.filterable && _react2.default.createElement(
            'a',
            {
              className: (0, _classnames2.default)('grid-filter-indicator', {
                active: filter && filter.value
              }),
              tabIndex: columnIndex,
              onClick: function onClick(e) {
                e.stopPropagation();
                _this9.onFilterClicked(column.key);
              }
            },
            _react2.default.createElement('i', {
              className: 'fa fa-filter fa-fw'
            })
          )
        )
      );
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { className: 'grid-container' },
        _react2.default.createElement(
          _AutoSizer2.default,
          null,
          this.renderMultiGrid
        ),
        _react2.default.createElement(
          'div',
          {
            className: (0, _classnames2.default)('scroll-x-indicator', {
              faded: this.state.scrolledAllRight
            })
          },
          _react2.default.createElement('i', { className: 'fa fa-fw fa-angle-double-right' })
        )
      );
    }
  }]);

  return DataGrid;
}(_react.Component);

DataGrid.propTypes = {
  items: _propTypes2.default.arrayOf(_propTypes2.default.shape()).isRequired,
  columns: _propTypes2.default.arrayOf(_propTypes2.default.shape()).isRequired,
  onRowClicked: _propTypes2.default.func,
  onScroll: _propTypes2.default.func,
  defaultSort: _propTypes2.default.shape({
    sortBy: _propTypes2.default.string,
    sortDirection: _propTypes2.default.string
  }),
  columnWidthMultiplier: _propTypes2.default.number,
  fixedColumns: _propTypes2.default.number
};

DataGrid.defaultProps = {
  title: '',
  count: 0,
  fixedColumns: 1,
  defaultSort: null,
  columnWidthMultiplier: 1,
  onPageChange: function onPageChange() {},
  onScroll: function onScroll() {},
  onRowClicked: function onRowClicked() {}
};

exports.default = DataGrid;