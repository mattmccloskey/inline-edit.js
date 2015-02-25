var InlineEdit = new Class({

	Implements: [Options, Events],
	
	options: {
		enter_on: 'click',
		leave_on_enter: true,
		leave_on_blur: true,
		leave_on_esc: true,
		focus_on_enter: true,
		select_on_enter: true,
		update_url: '',
		field_title: '',
		field_type: 'default',
		field_options: {'type': 'text'},
		min_width: 50,
		formatValue: function(value){ return value; },
		events: {}
	},
	
	initialize: function(el, options)
	{
		this.setOptions(options);
		
		this.el = $(el);
		if( ! this.el) return false;
		
		this.el.setStyles({
			'cursor': 'default'
		}).store('InlineEdit:init_value', this.el.get('text'));
		
		if(this.el.retrieve('InlineEdit')) return this.el.retrieve('InlineEdit');
		
		this.input = false;
		this.last_value = this.el.get('text');
		this.new_value = this.last_value;
		this.active = true;
		this.editing = false;
		
		this.binds = {
			'enter': this.enter_edit.bind(this)
		};
		
		if(this.options.enter_on)
		{
			this.el.addEvent(this.options.enter_on, function(e){
				this.binds.enter(e);
			}.bind(this));
		}
		
		this.addEvents(this.options.events);
		
		this.el.store('InlineEdit', this);
	},
	
	enterEdit: function(){ return this.enter_edit(); },
	leaveEdit: function(){ return this.leave_edit(); },
	
	enter_edit: function(e)
	{
		
		if( ! this.editing){
			if( ! this.active) return false;
			
			if(e) e.preventDefault();
			
			this.editing = true;
			
			this.last_html = this.el.get('html');
			this.last_value = this.el.get('html').replace(/<br[\/]?>/gi, '\n');
			//this.el.setStyles({'opacity': 0});
			
			if(this.options.field_type == 'default')
			{
				if(['div', 'p'].contains(this.el.get('tag')) && this.el.getStyle('display') == 'block')
				{
					this.options.field_type = 'textarea';
				}
				else
				{
					this.options.field_type = 'input';
				}
			}			
			
			this.sizer = new Element('span', {'html': this.last_html, 'styles': {
				'display': 'inline-block', 'position': 'absolute', 'opacity': 0, 'z-index': 1
			}}).inject(this.el, 'after').position({
				'relativeTo': this.el,
				'edge': 'topLeft',
				'position': 'topLeft'
			}).copyStyles(this.el);
			
			if(this.options.field_type == 'textarea')
			{
				this.sizer.setStyles({
					'width': this.el.getSize().x,
					'height': 'auto'
				});
				
				// have to leave on blur for textareas
				this.options.leave_on_blur = true;
			}
						
			this.input = new Element(this.options.field_type, {
				'name': 'title', 
				'value': this.last_value, 
				'class': 'inlineedit-input',
				'styles': {'z-index': 2, 'opacity': 0, 'resize': 'none'},
				'events': {
					'blur': function(){
						if(this.options.leave_on_blur) this.leave_edit();
					}.bind(this),
					'keydown': function(e){
						this.fireEvent('keydown', e);
						this.el.fireEvent('keydown', e);
						if(this.options.tab_to && e.key == 'tab'){
							e.stop();
							this.leave_edit();
							this.options.tab_to.enterEdit();
						}
						if(this.options.leave_on_esc && e.key == 'esc'){ this.leave_edit(); }
						this.match_size();
					}.bind(this),
					'keypress': function(e){
						if((this.options.leave_on_esc && e.key == 'esc') || (this.options.leave_on_enter && e.key == 'enter' && this.options.field_type != 'textarea')) 
						{
							this.leave_edit(); 
						}
						
						this.match_size();
					}.bind(this),
					'keyup': function(){
						var html = this.input.get('value').replace(/\n/gi, '<br/>');
						if(html.substr(-5) == '<br/>') html += '<br/>';
						this.sizer.set('html', html);
						this.el.set('html', html);
						this.match_size();
					}.bind(this)
						
				}
			}).inject(this.el, 'after');
			var padding = this.input.getStyle('padding');
			this.input.copyStyles(this.el);
			this.input.setStyle('padding', padding);
			this.input.set(this.options.field_options);
			var offset = {x: -(padding.split(' ')[3].toInt() + this.input.getStyle('border-left-width').toInt()), y: -(padding.split(' ')[0].toInt() + this.input.getStyle('border-top-width').toInt())};
			if(this.options.field_type == 'input')
			{
				offset.x -= 1;
				offset.y -= 2;
			}
			this.input.position({relativeTo: this.el, edge: 'topLeft', position: 'topLeft', offset: offset});
			
			
			var speed = 0;
			var transition = Fx.Transitions.Cubic.easeOut;
			this.input.set('tween', {duration: speed, transition: transition}).tween('opacity', [0,1]);
			this.el.set('tween', {duration: speed, transition: transition}).tween('opacity', 0);
			if(this.options.focus_on_enter)
			{
				if(this.options.select_on_enter)
				{
					this.input.select.delay(speed, this.input);
				}
				else
				{
					this.input.setCursor(this.input.get('value').length);
				}
			}
			
			this.match_size({duration: 0});
			
			this.fireEvent('enterEdit', [this.input]);
			this.el.fireEvent('enterEdit', [this.input]);
		}
		
	},
	
	leave_edit: function()
	{
		if( ! this.editing) return true;
		
		this.editing = false;
		
		this.new_value = this.input.get('value');
		if(this.options.formatValue) this.new_value = this.options.formatValue(this.new_value, this.last_value, this);
		if(this.new_value == '') this.new_value = this.last_value;
		
		this.input.destroy();
		this.sizer.destroy();
		this.el.setStyles({'opacity': 1});
		
		this.el.set('html', this.new_value.replace(/\n/gi, '<br/>'));
		
		this.fireEvent('leaveEdit', [this.new_value, this.last_value, this.new_value != this.last_value]);
		this.el.fireEvent('leaveEdit', [this.new_value, this.last_value, this.new_value != this.last_value]);
		
		if(this.new_value != this.last_value)
		{
			this.fireEvent('onChange', [this.new_value, this.old_value]);
			this.el.fireEvent('onChange', [this.new_value, this.old_value]);
			
			if(this.options.update_url)
			{
				var post_data = {};
				post_data[this.options.field_title] = this.new_value;
				var req = new Request.JSON({url: this.options.update_url, method: 'post'}).addEvent('success', function(rsp){
					if(rsp.status == 'ok'){
						this.el.set('html', (rsp.data[this.options.field_title] || this.new_value).replace('\n', '\n<br/>'));
						this.fireEvent('onSave', [this.el, rsp.data]);
						this.el.fireEvent('onSave', [this.el, rsp.data]);
					}else{
						alert(rsp.msg);
					}
				}.bind(this)).post(post_data);
			}
		}
	},
	
	
	match_size: function(morph)
	{
		if(this.options.field_type == 'input')
		{
			this.input.setStyles({
				'width': Math.max(this.options.min_width, this.sizer.getSize().x + this.sizer.getStyle('font-size').toInt())
			});
			/* this.input.set('tween', {duration: 100, transition: Fx.Transitions.Cubic.easeOut}).tween('width', this.sizer.getSize().x + 20); */
		}
		else if(this.options.field_type == 'textarea')
		{
			this.input.set('morph', Object.merge({duration: 200, transition: Fx.Transitions.Cubic.easeOut}, morph)).morph({
				'width': this.sizer.getSize().x + ((this.input.getStyle('padding').split(' ')[3] || this.input.getStyle('padding').split(' ')[1] || 0).toInt() * 2),
				'height': Math.max((this.sizer.getStyle('line-height').toInt() || this.sizer.getStyle('font-size').toInt())+5, this.sizer.getSize().y + ((this.input.getStyle('padding').split(' ')[0] || 0).toInt() * 2))
			});
		}
	},
	
	
	suspend: function()
	{
		this.active = false;
	},
	
	
	resume: function()
	{
		this.active = true;
	}

});


Element.implement({

	'enterEdit': function(options)
	{
		if( ! this.retrieve('InlineEdit'))
		{
			this.store('inlineedit_onthefly', true);
		}
		options = Object.merge({enter_on: false, select_on_enter: false}, options || {});
		new InlineEdit(this, options).enter_edit();
		return this;
	},
	
	'leaveEdit': function()
	{
		var edit = this.retrieve('InlineEdit');
		if(edit) edit.leave_edit();
		if(this.retrievs('inlineedit_onthefly'))
		{
			delete edit;
			this.store('InlineEdit', false);
		}
		return this;
	},
	
	'copyStyles': function(from)
	{
		this.setStyles({
			'padding': from.getStyle('padding'),
			'font-weight': from.getStyle('font-weight'),
			'font-style': from.getStyle('font-style'),
			'font-size': from.getStyle('font-size'),
			'line-height': from.getStyle('line-height')
		});
		
		// setStyles doesn't work for font-family
		this.style.fontFamily = from.getStyle('font-family');
		
		return this;
	},
	
	'setCursor': function(pos){
	   if(this.createTextRange){
	        var textRange = this.createTextRange();
	        textRange.collapse(true);
	        textRange.moveEnd(pos);
	        textRange.moveStart(pos);
	        textRange.select();
	        return true;
	    }else if(this.setSelectionRange){
	        this.setSelectionRange(pos,pos);
	        return true;
	    }
	
	    return false;
	}
});


function $InlineEdit(el)
{
	return $(el).retrieve('InlineEdit');
}