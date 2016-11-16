/*
 * util.js
 * 
 * @author Conney Joo
 * @version 1.0
 */
$(document).ready(function() {
});

$(document).bind('pagebeforecreate', function(e) {
});

$.fn.extend({
	
	loadForm: function(data) {
    	this.find(':input').each(function() {
    		var name = $(this).attr('name');
    		if (!name) return;
    		if (this.type == 'radio' || this.type == 'checkbox') {
				if (this.value === $.util.property(data, $(this).attr('name')))
					this.checked = true
    		} else {
				$(this).val($.util.property(data, name));
				$(this).change && $(this).change();
	        	$(this).removeClass("textblur")
    		}
    		
    	})
	},
	
	serializeObject: function() {
	    var obj = {};
	    $.each(this.serializeArray(), function(index, param) {
	        if (!(param.name in obj)) {
	            obj[param.name] = param.value
	        }
	    });
	    return obj
	},
	
	formData: function() {
	},
	
	numberField: function() {
		this.keydown(function(event) { 
			var keyCode = event.which;
			if (keyCode == 46 || keyCode == 8 || keyCode == 37
							|| keyCode == 39
							|| (keyCode >= 48 && keyCode <= 57)
							|| (keyCode >= 96 && keyCode <= 105)) { 
				return true 
			} else { 
				return false 
			} 
		}).focus(function() { 
			this.style.imeMode = 'disabled' 
		})
	}
});

$.util = {};

$.util.urlParam = function(name) {
	var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
	var r = window.location.search.substr(1).match(reg);
	if (r != null) return r[2];
  	//if (r != null) return unescape(r[2]) 
  	return null
};

$.util.property = function(o, p) {
	var i = p.indexOf('.');
    if (i > -1) {
    	var name = p.substring(0, i > -1 ? i : p.length);
    	return $.util.property(o[name], p.substring(i + 1))
    }
	return o[p]
};

$.util.fullProperty = function(s, data) {
	return s.replace(/\{([\w\-]+)\}/g, function(m, name) {
		return data[name] !== undefined ? data[name] : ''
	})
};

/** ========================= Macro ========================= **/
var message = function(text) {
	$.scojs_message(text, $.scojs_message.TYPE_OK)
};

var error = function(text) {
	$.scojs_message(text, $.scojs_message.TYPE_ERROR)
};

var pathname = window.document.location.pathname;
var root = pathname && pathname.substring(0, pathname.substr(1).indexOf('/') + 1);
