/*!
 * grid.js
 * 
 * @author Conney
 * @github https://github.com/conneyjoo
 * @version 1.0
 */
(function($) {
	var Grid = function(element, options) {
		this.grid = $(element);
		this.rows = [];
		this.url = options.url;
		this.params = options.params;
		this.options = $.extend({}, $.fn.grid.defaults, options);
		$.extend(this, this.options);
		
		this.initContainer()
	};

	Grid.prototype = {
		constructor: Grid,

		initContainer: function() {
			var options = this.options;
			this.rowTemplate = this.grid.html();
			this.grid.data('events', {});
			this.paginationRender = this.paginationRender && $('#' + this.paginationRender);
			
			if (this.grid.hasClass('grid')) this.grid.show();
			this.clean();
			this.initColumn();
			
			if (this.datas)
				this.loadData(this.datas);
			if (this.autoload)
				this.load()
		},
		
		initColumn: function() {
			if (this.columns) {
				var column;
				for (var i = 0, len = this.columns.length; i < len; i++) {
					column = this.columns[i];
					if (column.names || column.values) {
						column.map = {};
						for (var j = 0, len1 = column.names.length; j < len1; j++) {
							column.map[column.names[j]] = column.values[j];
							column.map[column.values[j]] = column.names[j]
						}
					}
				}
			}
		},

		createGridPanel: function() {
			var html = $.util.fullProperty(this.template.gridPanel, this.options);
			var gridPanel = $(html);
			return gridPanel
		},
		
		createRows: function(datas) {
			var rows = [], row, data;
			for (var i = 0, len = datas.length; i < len; i++) {
				data = datas[i];
				if (this.setData(data, i))
					continue;
				data.rowIndex = rows.length + 1;
				row = this.createRow(data);
				rows.push(row)
			}
			return rows
		},
		
		createRow: function(record) {
			if (this.beforeInsert) 
				this.beforeInsert(record);
			
			var row = this.createColumn(record);
			
			row.data('data', record);
			row.css('cursor', 'pointer');
			row.bind('click', {record: record, row: row, grid: this}, this.onRowClick);
			row.bind('mouseenter', {record: record, row: row, grid: this}, this.onMouseOver);
			row.bind('mouseleave', {record: record, row: row, grid: this}, this.onMouseOut);
			row.bind('dblclick', {record: record, row: row, grid: this}, this.onRowDoubleClick);
			
			if (this.afterInsert) 
				this.afterInsert(record, row);
			
			return row
		},
		
		createColumn: function(record) {
			var template = this.createRowTemplate ? this.createRowTemplate(record) : this.rowTemplate;
			
			if (this.enableEditor) {
				var rowData = $.extend(true, {}, record);
				
				if (this.columns) {
					var column, name, value, data;
					for (var i = 0, len = this.columns.length; i < len; i++) {
						column = this.columns[i];
						name = column.name;
						value = column.map ? column.map[$.util.property(record, name)] : $.util.property(record, name);
						data = {name: name, value: (value === null || value == undefined) ? '&nbsp;' : value, editor: this.createEditor(name, value, column), style: this.getEditorStyle(column)};
						$.util.property(rowData, name, $.util.fullProperty(this.template.column, data))
					}
				}
				
				var row = $($.util.fullProperty(template, rowData)), self = this;
				this.initEditor(row, record);
				return row
			} else {
				return $($.util.fullProperty(template, record))
			}
		},
		
		createEditor: function(name, value, column) {
			var editor;
			if (column.editor === 'text') {
				editor = '<input type="text" name="' + name + '" class="row-editor-disabled" value="' + value + '" ' + this.getEditorStyle(column) + '>'
			} else if (column.editor === 'select') {
				editor = '<select name="' + name + '" class="row-editor-disabled" ' + this.getEditorStyle(column) + '>';
				for (var i = 0, len = column.names.length; i < len; i++) {
					editor += '<option value="' + column.values[i] + '" ' + (value === column.names[i] ? 'selected="true"' : '') + '>' + column.names[i] + '</option>'
				}
				editor += '</select>'
			} else if (column.editor === 'date') {
				value = value || new Date().format('yyyy-MM-d');
				editor = '<input type="text" name="' + name + '" class="row-editor-disabled" ' + this.getEditorStyle(column) + '>'
			} else {
				editor = '<span data-name="' + name + '" class="row-editor-disabled" ' + this.getEditorStyle(column) + '>' + value + '</span>'
			}
			
			return editor
		},
		
		initEditor: function(row, record) {
			var editors = row.find('.grid-column'), editor, name, column, input, value;
			
			for (var i = 0, len = editors.length; i < len; i++) {
				editor = editors.eq(i);
				name = editor.data('name');
				column = this.getColumn(name);
				value = editor.find('.row-value');
				input = editor.find('.row-editor-disabled');
				row.data(name + '-value', value);
				row.data(name + '-input', input);
				
				if (column.editor) {
					if (column.editor === 'select') {
					} else if (column.editor === 'date') {
						var date = record[column.name] || new Date().format('yyyy-MM-dd');
						input.datepicker({format: column.format || 'yyyy-mm-dd'}).datepicker('setValue', date).on('changeDate', function(e) {})
					} else {
					}
					
					editor.bind('click', {record: record, input: input, grid: this}, function(e) {
						var editor = $(this), record = e.data.record, input = e.data.input, grid = e.data.grid;
						if (e.shiftKey) {
							if (grid.validator && grid.validator(record)) {
								grid.enterEditor(input, record);
								grid.switchEditor(editor);
								grid.onRowEditor(record, input)
							} else {
								grid.enterEditor(input, record);
								grid.switchEditor(editor);
								grid.onRowEditor(record, input)
							}
						}
					})
				} 
			}
			
			row.bind('keydown', {record: record, row: row, grid: this}, function(e) {
				var row = $(this), record = e.data.record, grid = e.data.grid;
				switch (e.keyCode) {
					case 13:
						if (grid.validator && grid.validator(record)) {
							grid.enterRowEidtor(row, e);
							grid.switchRowEidtor(row)
						} else {
							grid.enterRowEidtor(row, e);
							grid.switchRowEidtor(row)
						}
						
						break;
					case 27:
						grid.switchRowEidtor(row);
						break;
					default:
						break
				}
			});
			row.bind('dblclick', {record: record, row: row, grid: this}, function(e) {
				var row = $(this), record = e.data.record, grid = e.data.grid;
				if (grid.validator && grid.validator(record)) {
					grid.enterRowEidtor(row, e);
					grid.switchRowEidtor(row)
				} else {
					grid.enterRowEidtor(row, e);
					grid.switchRowEidtor(row)
				}
			})
		},
		
		getEditorStyle: function(column) {
			var style = 'style="';
			if (column.width || this.colWidth)
				style += 'width: ' + (column.width || this.colWidth)  + 'px !important;';
			if (column.height || this.colHeight)
				style += 'height: ' + (column.height || this.colHeight) + 'px !important;';
			style += '"';
			return style
		},
		
		getEditorValue: function(el) {
			if (el.is('select'))
				return el.find('option:selected').text();
			else
				return el.val()
		},
		
		getColumn: function(name) {
			for (var i = 0, len = this.columns.length; i < len; i++)
				if (this.columns[i].name === name)
					return this.columns[i] 
		},
		
		switchEditor: function(editor) {
			if (editor.hasClass('open-editor')) {
				editor.find('.row-value-disabled').removeClass('row-value-disabled').addClass('row-value');
				editor.find('.row-editor').removeClass('row-editor').addClass('row-editor-disabled');
				editor.each(function(i) {
					var el = editor.eq(i);
					if (el.hasClass('open-editor'))
						el.toggleClass('open-editor')
				})
			} else {
				editor.find('.row-value').removeClass('row-value').addClass('row-value-disabled');
				editor.find('.row-editor-disabled').removeClass('row-editor-disabled').addClass('row-editor');
				editor.each(function(i) {
					var el = editor.eq(i);
					if (!el.hasClass('open-editor'))
						el.toggleClass('open-editor')
				})
			}
		},
		
		enterEditor: function(input, record) {
			if (!input) return;
			
			var name = input[0].name || input.data('name'), value = input.val();
			$.util.property(record, name, value);
			input.prev().html(this.getEditorValue(input))
		},
		
		switchRowEidtor: function(index) {
			var row = typeof index === 'object' ? index : this.indexOf(index);
			this.switchEditor(row.find('.grid-column'))
		},
		
		enterRowEidtor: function(index, e) {
			var row = typeof index === 'object' ? index : this.indexOf(index);
			var record = row.data('data');
			
			if (row.find('.open-editor').length === 0) return;
		
			for (var i = 0, len = this.columns.length; i < len; i++)
				this.enterEditor(row.data(this.columns[i].name + '-input'), record)
			
			this.onRowEditor(record, e ? e.target : undefined)
		},
		
		onRowEditor: function(record, input) {
			if (this.isBind('roweditor'))
				this.grid.trigger('roweditor', [record, input, this])
		},
		
		refreshRow: function(index) {
			var row = typeof index === 'object' ? index : this.indexOf(index), column, name, value;
					
			for (var i = 0, len = this.columns.length; i < len; i++) {
				column = this.columns[i];
				name = column.name;
				value = column.map ? column.map[$.util.property(row.data('data'), name)] : $.util.property(row.data('data'), name);
				row.data(name + '-' + 'value').html(value);
				row.data(name + '-' + 'input')[this.columns[i].editor ? 'val' : 'html'](value)
			}
		},
		
		refresh: function() {
			for (var i = 0, len = this.rows.length; i < len; i++)
				refreshRow(this.rows[i])
		},
		
		createPagination: function(pager) {
			if (pager.totalPage === 0)
				return;
			
			var cp = pager.curPage - 1, tp = pager.totalPage, ps = pager.pageSize, pm = this.pageMax;
			var pb = 0, pe = Math.floor(cp / pm + 1) * pm;
			pe = (tp - pe < 0) ? pe - (pe - tp) : pe;
			pb = pe - pm;
			pb = pb < 1 ? 0 : pb;
					
			this.params.curPage = this.params.curPage || 1;
			this.params.pageSize = ps;
			var pagination = $(this.template.pagination);
			var ul = $('<ul></ul>'), li;
			pagination.append(ul);
			
			this.createPageButton(ul, cp === 0, '&laquo;', pb < 0 ? 0 : pb, this);
			this.createPageButton(ul, cp === 0, '&lsaquo;', this.params.curPage - 1, this);
			for (var i = pb + 1; i <= pe; i++) {
				this.createPageButton(ul, (cp + 1) === i, i, i, this)
			}
			this.createPageButton(ul, (cp + 1) === tp, '&rsaquo;', this.params.curPage + 1, this);
			this.createPageButton(ul, (cp + 1) === tp, '&raquo;', pe + 1 > tp ? tp : pe + 1, this);
			
			return pagination
		},
		
		createPageButton: function(parent, disabled, text, cp, grid) {
			$('<li class="' + (disabled ? 'disabled' : '') + '"></li>').appendTo(parent).append(
				$('<a>' + text + '</a>').bind('click', function() {
					if (!$(this).parent().hasClass('disabled')) {
						grid.params.curPage = cp;
						grid.params.start = (cp - 1) * grid.params.pageSize;
						grid.load()
					}
				})
			)
		},
		
		setRowData: function(i, record) {
			var row = this.rows[i];
			row.data('data', record);
			return row
		},
		
		clean: function() {
			this.grid.empty();
			this.rows = [];
			
			if (this.paginationRender)
				this.paginationRender.empty()
		},
		
		render: function(data) {
			if (!data) return;
			
			if (data.datas) {
				this.rows = this.createRows(data.datas);
				this.grid.append(this.rows);
				if (this.rows.length > 0) {
					var pagination = this.createPagination(data);
					if (pagination) {
						var pr = this.paginationRender;
						if (this.paginationRender)
							this.paginationRender.append(pagination);
						else
							this.grid.append(pagination)
					}
				}
			} else {
				this.rows = this.createRows(data);
				this.grid.append(this.rows)
			}
		},

		load: function(params, url, callback) {
			var self = this;
			this.url = url || this.url;
			$.extend(this.params, params);

			if (this.beforeLoad) 
				this.beforeLoad();
			if (this.showLoading) 
				this.grid.showLoading();
			
			$.ajax({
				type: this.options.method,
				url: this.url,
				dataType: 'json',
				timeout: this.options.timeout,
				data: this.params,
				async: this.async,
				success: function(msg) {
					self.data = msg;
					self.clean();
					self.render(msg);
					
					if (self.afterLoad) 
						self.afterLoad(msg);
					if (callback) 
						callback();
					if (self.showLoading) 
						self.grid.hideLoading()
				},
				error: function(e) {
					if (self.loadFailure) 
						self.loadFailure();
					
					self.grid.hideLoading()
		        }
			})
		},
		
		loadData: function(data) {
			this.clean();
			this.render(data)
		},
		
		append: function(record) {
			record.rowIndex = this.rows.length + 1;
			var row = this.createRow(record);
			this.rows.push(row);
			this.grid.append(row);
			if (this.enableEditor)
				this.switchRowEidtor(record.rowIndex - 1);
			return row
		},
		
		remove: function(i) {
			this.indexOf(i).remove()
		},
		
		indexOf: function(i) {
			return this.rows[i]
		},
		
		getSelected: function() {
			return this.selected
		},
		
		getSelectRow: function() {
			return this.selectRow
		},
		
		unSelected: function() {
			if (this.selectRow) {
				this.selectRow.removeClass('row-selection');
				this.selectRow = null;
				this.selected = null
			}
		},
		
		setData: function(record) {
		},	
		
		getRows: function() {
			return this.rows
		},
			
		onRowClick: function(e) {
			var el = $(this), grid = e.data.grid, row = e.data.row, record = e.data.row.data('data');
			
			grid.selected = record;
			
			if($(e.target).hasClass('disable-selected')) return;
			
			if (grid.isBind('rowclick'))
				grid.grid.trigger('rowclick', [record, row, grid]);
			
			if (grid.isBind('selection'))
				grid.grid.trigger('selection', [record, row, grid]);
			
			if (grid.selectRow)
				grid.selectRow.removeClass('row-selection');
			
			el.addClass('row-selection');
			grid.selectRow = el
		},
		
		onRowDoubleClick: function(e) {
			var el = $(this), grid = e.data.grid, row = e.data.row, record = e.data.row.data('data');
			
			if (grid.isBind('rowdoubleclick'))
				grid.grid.trigger('rowdoubleclick', [record, row, grid])
		},
		
		onMouseOver: function(e, a) {
			var el = $(this), grid = e.data.grid, row = e.data.row, record = e.data.row.data('data');
			
			if (!el.hasClass('row-hover'))
				el.addClass('row-hover');
			
			if (grid.isBind('rowmouseover'))
				grid.grid.trigger('rowmouseover', [record, row, grid]);
			
			e.preventDefault();
			if (e.stopPropagation)
				e.stopPropagation();
		    e.cancelBubble = true
		},
		
		onMouseOut: function(e, a) {
			var el = $(this), grid = e.data.grid, row = e.data.row, record = e.data.row.data('data');
			
			if (el.hasClass('row-hover'))
				el.removeClass('row-hover');
			
			if (grid.isBind('rowmouseout'))
				grid.grid.trigger('rowmouseout', [record, row, grid]);
			
			e.preventDefault();
			if (e.stopPropagation)
				e.stopPropagation();
		    e.cancelBubble = true
		},
		
		on: function(eventName, handler) {
			this.grid.bind(eventName, handler);
			this.grid.data('events')[eventName] = true
		},
		
		isBind: function(eventName) {
			return this.grid.data('events')[eventName]
		}
		
	};
	
	$.fn.grid = function(option) {
		var methodReturn;
		
		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('grid');
			var options = typeof option === 'object' && option;
			options.params = options.params || {};
			if (!data) $this.data('grid', (data = new Grid(this, options)));
			if (typeof option === 'string') methodReturn = data[option]()
		});
		return (methodReturn === undefined) ? $set : methodReturn
	};
	
	$.fn.grid.defaults = {
		template: {
			gridPanel: '<div style="overflow-y:auto; width: {width}; height: {height};"></div>',
			pagination:	'<div class="pagination pagination-centered"></div>',
			column: '<span class="grid-column" data-name="{name}" {style}><span class="row-value">{value}</span>{editor}</span>'
		},
		enableEditor: false,
		enableColumnEdit: false,
		showLoading: true,
		autoload: false,
		async: true,
		pageMax: 10,
		params: {}
	};
	
	$.fn.grid.Constructor = Grid
})($);