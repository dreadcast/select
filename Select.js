/*
 *	DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE http://sam.zoy.org/wtfpl/
 *	@author dreadcast
*/

/**
 *	Utility class to handle mouse selection of HTML elements.<br>
 *	Use <kbd>Control</kbd> and/or <kbd>Shift</kbd> for multiple selections
 *	@class Select
 *	@constructor
 *	@param {Object} options					Icon options
 *	@param {Bool} options.multiple			Allows selection of multiple elements, default to <code>true</code>.<br>
 *											If set to <code>'freestyle'</code>, then <kbd>Control</kbd>
 *											and/or <kbd>Shift</kbd>
 *											are not requiered to handle multiple selections.
 *	@param {String} options.elements		A CSS selector that matches elements to be selectables.
 *	@param {String} options.context			Limit the selectable zone to first element that matches supplied
 *											selector, default to body.
 *	@param {String} options.filter			A CSS selector to prevent selection of parent element when clicked,
 *											default to <code>'input, textarea, object'</code>.
 *	@param {String} options.handle			A CSS selector to make selection effective when clicked target matches
 *											<kbd>handle</kbd>.
 *	@param {Array} options.selected			Array of items selected by default. Can contain elements or indexes.
 *	@param {String} options.event			Name of the event that allows selection, default to <code>'mousedown'</code>.<br>
 *											If set to false, then elements selection will be achieved programmatically.
 *	@param {Array} options.deselectable		Can unselect all by clicking on the context, but not on a selectable
 *											element, default to false.
 *	@param {Array} options.preventDefault	Prevents default action when clicking on anchors or buttons... default to false.
 *	@return {Select} select 				Instance
 *	@author dreadcast
 *	
*/

/**
 * Fired after selection ends, useful on multiple selections.<br>
 * Use <a href="#event_selectend">selectend</a> instead.
 * @event selectEnd
 * @deprecated
 */

/**
 * Fired after selection ends, useful on multiple selections.
 * @event selectend
 */

/**
 * Fired when no item is selected.<br>
 * Use <a href="#event_unselectall">unselectall</a> instead.
 * @event unselectAll
 * @deprecated
 */

/**
 * Fired when no item is selected.
 * @event unselectall
 */

/**
 * Fired before selection starts.
 * @event beforeselect
 */

/**
 * Fired when selected state of an element changes.
 * @event change
 * @param {Element} element					(un)selected element.
 */

/**
 * Fired when an item was selected.
 * @event select
 * @param {Element} element					Selected element.
 */

/**
 * Fired when an item was unselected.
 * @event unselect
 * @param {Element} element					Deselected element.
 */
var Select = new Class({
	options: {
		multiple: true,
		elements: '',
		filter: 'input, textarea, object',
		handle: '',
		selected: [],
		event: 'mousedown',
		deselectable: false,
		preventDefault: false
	},
	
	Implements: [Events, Options],
	
	initialize: function(options){
		this.setOptions(options);
		this.context = document.getElement(this.options.context) || document.id(document.body);
		this.getElements();
		
		var crtl = Browser.platform == 'mac' ? 'meta' : 'control';
		
		if(Array.from(this.options.selected).length != 0)
			this.select(this.options.selected);
			
		if(this.options.event){
			var handle = this.options.handle !== '' ? this.options.handle : this.options.elements,
				event = this.options.event + ':relay(' + handle + ')';

			this.context.addEvent(event, function(e, target){
				if(this.options.preventDefault)
					e.preventDefault();
				if(this.inactive || $e(e.target).bubble(this.options.filter))
					return;
				
				if(this.options.handle != '')
					target = target.getParent(this.options.elements);
					
				var elements = this.getElements(),
					x = elements.indexOf(this.lastSelected),
					x2 = elements.indexOf(target);

				if(this.options.multiple && e[crtl] && !e.shift){
					this.toggle(target);
					this.lastSelected = target;
				
				} else if(this.options.multiple && e.shift){							
					elements.map(function(el, i){
						if((x < x2 && i > x && i < x2) || (x > x2 && i < x && i > x2))
							this.toggle(el);
					}, this);
					
					if(this.options.multiple == 'freestyle')
						this.toggle(target);
					
					else
						this.select(target);
				
				} else {
					if(this.options.multiple == 'freestyle')
						this.toggle(target);
						
					else if(this.options.deselectable && this.isSelected(target))
						this.unselectAll(this.getSelection().length > 1 ? target : null);
						
					else
						this.unselectAll(target).select(target);
					
					this.lastSelected = target;
				}
				this.fireEvent('selectEnd').fireEvent('selectend');
			}.bind(this));
			
			if(this.options.deselectable && this.options.multiple != 'freestyle')
				this.context.addEvent(this.options.event, function(e){
					if(!e[crtl] && !e.shift && !e.target.bubble(this.options.elements))
						this.unselectAll().fireEvent('selectEnd').fireEvent('selectend');
				}.bind(this));
		}
		
		return this;
	},
	
	add: function(selector){
		this.options.elements += ', ' + selector;
		
		return this;
	},
	
	/**
	 *	Get selectable elements from instance
	 *	@method getElements
	 *	@param {Function} [fn]				Callback function to perform on every elements.
	 *	@return {Array}						Instance's selectable elements. If callback is supplied, then returns elements map() result.
	 */
	getElements: function(fn){
		this.elements = this.context.getElements(this.options.elements);
		
		if(fn)
			return this.elements.map(fn);
		
		return this.elements;
	},
	
	/**
	 *	Get a single selectable element.
	 *	@method getElement
	 *	@param {Integer} index				Element's index.<br>
	 *										Accepts strings such as <code>'next'</code> or <code>'previous'</code>.
	 *										In those cases, returns the element before (or after) the last selected
	 *										element.
	 *	@return {Element}					Instance's element whose index is <code>index</code>.
	 */
	getElement: function(index){
		if(typeOf(index) == 'element')
			return index;
		
		var els = this.getElements(),
			dir = 0;
		
		if(typeOf(index) == 'number')
			return els[index];
		
		var lastIndex = this.getIndex(this.lastSelected);
	
		if(index == 'next')
			dir = 1;
			
		else if(index == 'previous')
			dir = -1;
	
		if(this.getSelection().length == 0)
			i = dir == -1 ? els.length : -1;
			
		else if(lastIndex == els.length - 1 && dir == 1)
			i = -1;
			
		else if(lastIndex == 0 && dir == -1)
			i = els.length;
			
		else
			i = lastIndex;
	
		return this.getElements()[i + dir];
	},
	
	/**
	 *	Checks if supplied element was selected
	 *	@method isSelected
	 *	@param {Mixed} el					Element or element's index.
	 *	@return {Bool}						Element's selected state.
	 */
	isSelected: function(el){
		el = typeOf(el) == 'element' ? $e(el) : this.getElement(el);
		
		return el.retrieve('selected') === true;
	},
	
	/**
	 *	Returns index of supplied <code>Element</code>
	 *	@method getIndex
	 *	@param {Element} el					Element.
	 *	@return {Integer}					Element's index.
	 */
	getIndex: function(el){
		return this.getElements().indexOf(el);
	},
	
	/**
	 *	Selects supplied <code>Element</code>, <code>Array</code> of elements
	 *	or indexes, index or <code>String</code> such as <code>'all'</code>,
	 *	<code>'next'</code>, <code>'previous'</code>, <code>'first'</code>, <code>'last'</code>
	 *	@method select
	 *	@param {Mixed} el					Stuff you want to select.
	 *	@param {Bool} force					When set to true, every previously selected element
	 *										will be unselected, default to false.
	 *	@return {Select}					Instance.
	 */
	select: function(el, force){
		if(el === false || el === '')
			return this;
		
		this.fireEvent('beforeselect', el);
		
		var els;
		
		if(el == 'all')
			els = this.getElements();
		
		else if(el == 'next' || el == 'previous' || typeOf(el) == 'number')
			els = Array.from(this.getElement(el));
		
		else if(el == 'last')
			els = Array.from(this.getElement(this.getElements().length - 1));
		
		else if(el == 'first')
			els = Array.from(this.getElement(0));
		
		else if(typeOf(el) == 'string')
			els = this.getElements().filter(function(elmnt){
				return elmnt.match(el);
			});
		
		else if(typeOf(el) == 'element')
			els = Array.from(el);
		
		else if(typeOf(el) == 'array')
			els = el.map(function(i){
				return this.getElement(i);
			}, this);
		
		
		if(!this.options.multiple && !force)
			this.unselectAll(els);

		this.index = this.getElements().indexOf(els[els.length - 1]);
		
		els.each(function(el){
			if(el.retrieve('selected') !== true){
				this.setSelected(el);
				this.fireEvent('select', el);
				this.fireEvent('change', el);
			}
		}, this);
		
		return this;
	},
	
	/**
	 *	Sets supplied <code>Element</code> selected state to selected.
	 *	@method setSelected
	 *	@param {Element} el					Element you want to select.
	 *	@return {Select}					Instance.
	 */
	setSelected: function(el){
		if(this.lastSelected)
			this.lastSelected.removeClass('last-selected');
			
		this.lastSelected = el;
		
		el.store('selected', true).addClass('selected');
		
		return this;
	},
	
	/**
	 *	Deselects supplied <code>Element</code>, <code>Array</code> of elements
	 *	or indexes, index or <code>String</code> such as <code>'all'</code>,
	 *	<code>'next'</code>, <code>'previous'</code>, <code>'first'</code>, <code>'last'</code>
	 *	@method unselect
	 *	@param {Mixed} el					Element you want to deselect. If set to <code>'all'</code>,
	 *										then calls <a href="#method_unselectAll">unselectAll</a>.
	 *	@param {String} exclude				When el is set to <code>'all'</code>, then elements which
	 *										match exclude selector won't be unselected.
	 *	@return {Select}					Instance.
	 */
	unselect: function(el, exclude){
		if(el == 'all')
			return this.unselectAll(exclude);
		
		if(this.lastSelected)
			this.lastSelected.removeClass('last-selected');
		
		el = $$(el);
		
		if(el.length == 0)
			return this.unselectAll();
		
		el.store('selected', false).removeClass('selected');
		
		return this.fireEvent('unselect', el).fireEvent('change', el);
	},
	
	/**
	 *	Deselects every selected elements.
	 *	@method unselectAll
	 *	@param {String} exclude				Elements which match <em>exclude</em> selector won't be unselected.
	 *	@return {Select}					Instance.
	 */
	unselectAll: function(exclude){
		exclude = Array.from(exclude);
		
		this.getSelection().each(function(el){
			if(!exclude.contains(el))
				this.unselect(el);
		}, this);
		
		return this.fireEvent('unselectall').fireEvent('unselectAll');
	},
	
	/**
	 *	Toggles selected state of an <code>Element</code>
	 *	@method toggle
	 *	@param {Element} el					Element you want to toggle selected state.
	 *	@return {Select}					Instance.
	 */
	toggle: function(el){
		if(el.retrieve('selected'))
			this.unselect(el);
			
		else
			this.select(el);
	},
	
	/**
	 *	Returns an <code>Array</code> containing selected elements.
	 *	@method getSelection
	 *	@param {Mixed} [property]			Elements property you will get. Can be either
	 *										<code>'index'</code>, a <code>String</code> (ie: 'text', 'id', etc)
	 *										or a <code>Function</code>. When a <code>Function</code> is
	 *										provided, then <code>Array.map</code> is returned.
	 *	@param {Object} [bind]				Object you want to bind the map to, default to <code>this</code>.
	 *	@return {Array}						Selected elements/elements properties.
	 */
	getSelection: function(property, bind){
		var elements = this.getElements().filter(function(el){
			return el.retrieve('selected');
		}).map(function(el){
			if(property == 'index')
				return this.getElements().indexOf(el);
			
			else if(typeOf(property) == 'string')
				return el.get(property);
			
			else if(typeOf(property) == 'function')
				return property.call(bind || this, el);
			
			return el;
		}, bind || this);
		
		return elements;
	},
	
	/**
	 *	Returns an <code>Array</code> containing selected elements.
	 *	@method getLastSelection
	 *	@param {String} [property]			Element's property you will get.<br>
	 *										If not provided, returns element.
	 *	@return {Mixed}						Last selected element/element property.
	 */
	getLastSelection: function(property){
		if(property)
			return this.lastSelected.get(property);
		
		return this.lastSelected;
	},
	
	/**
	 *	Returns an <code>Array</code> containing elements which are not selected.
	 *	@method getUnselection
	 *	@return {Array}						Element which are not selected.
	 */
	getUnselection: function(){
		return this.getElements().filter(function(el){
			return !el.retrieve('selected');
		});
	}
});