(function(Core){
	'use strict';

	if(typeof define === "function" && define.amd) {
		define("Core", [], function(){
			return Core();
		});
	}else{
		window['Core'] = Core();
	}
})(function(){
	'use strict';

	var UI = {}; // Core;
	var moduleData = {}; //module
	var moduleSelector = {};
	var Sandbox = function(){
		var args = Array.prototype.slice.call(arguments);
		var callback = args.pop();
		var modules = (args[0] && typeof args[0] === 'string') ? args:args[0];

		return {
			rtnJson:function(data, notevil){
				return UI.Utils.strToJson(data, notevil || true);
			},
			uiInit:function(data){
				return UI.moduleBehavior(data);
			},
			sliderBar:function(data){
				return UI.SliderBar.call(data.context, data.callback);
			},
			rtnPrice:function(price){
				return UI.Utils.price(price);
			},
			rtnObjLength:function(obj){
				return UI.Utils.objLengtn(obj);
			},
			getModule:function(moduleID){
				return UI.getModule(moduleID);
			},
			getComponents:function(componentID, setting, callback){
				return UI.getComponents(componentID, setting, callback);
			},
			moduleEventInjection:function(strHtml, defer){
				UI.moduleEventInjection(strHtml, defer);
			},
			scrollController:function(wrapper, container, callback, id){
				return UI.Scrollarea.setScrollArea(wrapper, container, callback, id);
			},
			ui: UI.ui || {},
			utils:UI.Utils,
			setLoadingBarState:function(isLoad){
				if(isLoad) UI.Loading.show();
				else UI.Loading.hide();
			},
			validation:UI.validation,
			reSize:UI.reSizeWidth,
			cookie:UI.cookie,
			sessionHistory:UI.sessionHistory
		}
	}

	UI.register = function(moduleID, creator){
		//console.log(new Object({'moduleid':moduleID, 'creator':creator}));
		moduleData[moduleID] = {
			creator:creator,
			instance:null
		}
	}

	UI.init = function(moduleID){
		moduleData[moduleID].instance = moduleData[moduleID].creator(new Sandbox(this));
		moduleData[moduleID].instance.init();
		/*deplicated*/
		/*
			body의 Dom요소의 moduleName에 따라 모듈실행
		*/
		/*if(moduleData[moduleID].instance !== undefined && moduleData[moduleID].instance.init !== undefined && typeof moduleData[moduleID].instance.init == 'function'){
			moduleData[moduleID].instance.init();
		}*/
	}

	UI.destroy = function(moduleID){
		var data = moduleData[moduleID];
		if(data.instance && moduleData[moduleID].instance.destroy !== undefined && typeof moduleData[moduleID].instance.destroy == 'function'){
			data.instance.destroy();
			delete data.instance;
		}
	}

	UI.initAll = function(){
		for(var moduleID in moduleData){
			if(moduleData.hasOwnProperty(moduleID)){
				this.init(moduleID);
			}
		}
	}

	UI.destroyAll = function(){
		for(var moduleID in moduleData){
			if(moduleData.hasOwnProperty(moduleID)){
				this.destroy(moduleID);
			}
		}
	}

	UI.getModule = function(moduleID){
		try{
			return moduleData[moduleID].instance;
		}catch(e){
			console.log(moduleID + ' - This module is not defined');
		}
	}

	UI.moduleBehavior = function(data){
		/************************************************************************************************************
			모듈이 실행되는 context 내에 같은 이름( selector )을 가진 template 이 있을경우 모듈의 인스턴스 함수 init이 n번 실행되는 경우 발견
			해당 모듈은 각각의 스코프를 가지고 있기때문에 템플릿 내의 컴포넌트의 기능의 오류는 없으나 메모리를 차지하기 때문에 추후 변경 요망

			모듈 : 페이지내에 하나만 존재
			컴포넌트 : 페이지내에 여러개 존재

			따라서 모듈은 페이지 내에 하나만 존재하는 것이기 때문에 template의 레이아웃을 변경해야한다.
		************************************************************************************************************/

		/*if(data.hasOwnProperty('moduleName')){
			moduleSelector[data.attrName] = data.moduleName;
		}*/
		if($(data.selector).length <= 0) return;
		$(data.selector).each(function(i){
			if(data.hasOwnProperty('attrName')){
				if(data.attrName instanceof Array){
					data.handler.method.call(this, (function(){
						var obj = {};
						for(var i in data.attrName){
							obj[data.attrName[i]] = UI.Utils.strToJson($(this).attr(data.attrName[i]), true);
						}
						return obj;
					}.bind(this))());
				}else{
					data.handler.method.call(this, UI.Utils.strToJson($(this).attr(data.attrName), true));
				}
			}
		});
	}

	UI.getComponents = function(componentID, setting, callback){
		try{
			var _self = this;
			var component = this.Components[componentID];
			var $context = (setting && setting.context) ? setting.context : $('body');
			var attrName = (component.attrName instanceof Array) ? component.attrName[0] : component.attrName;
			var selector = (setting && setting.selector) ? setting.selector : '['+ attrName +']';
			var setting = (setting) ? setting : {};
			var arrComponent = [];
			var reInitIS = component.hasOwnProperty('reInit');

			if(component.hasOwnProperty('constructor') && component.hasOwnProperty('attrName')){
				//기존에 실행되었던 component 를 지운다.

				/*if(this.CurrentComponents.hasOwnProperty(componentID) && component.hasOwnProperty('reInit')){
					for(var i=0; i<this.CurrentComponents[componentID].components.length; i++){
						if(typeof this.CurrentComponents[componentID].components[i].destroy === 'function'){
							this.CurrentComponents[componentID].components[i].destroy();
						}
					}
				}*/

				$context.find(selector).each(function(i){
					var instance;
					var context = $(this).context;
					var indexOf = _self.CurrentComponentsContext.indexOf(context); //(reInitIS) ? _self.CurrentComponentsContext.indexOf(context) : -1;
					setting['selector'] = this;

					if(indexOf > -1){
						instance = _self.CurrentComponents[indexOf].setting(setting);
						//console.log('instance1', instance);
					}else{
						instance = component.constructor().setting(setting).init((function(){
						    if(component.attrName instanceof Array){
						        var obj = {};
        						for(var i in component.attrName){
        							obj[component.attrName[i]] = _self.Utils.strToJson($(this).attr(component.attrName[i]), true);
        						}
        						return obj;
						    }else{
						        return _self.Utils.strToJson($(this).attr(component.attrName), true);
						    }
						}.bind(this))());
						_self.CurrentComponentsContext.push(context);
						_self.CurrentComponents.push(instance);
					}

					if(callback && typeof callback === 'function'){
						callback.call(instance, i, this);
					}

					arrComponent.push(instance);
				});
				//console.log( 'com', (arrComponent.length > 1) ? arrComponent : arrComponent[0] );
				return (arrComponent.length > 1) ? arrComponent : arrComponent[0];
			}else{
				component = null;
				setting = null;
				console.log(componentID + ' - constructor is not defined.');
			}

		}catch(e){
			console.log(e);
		}
	}

	UI.moduleEventInjection = function(strHtml, defer){
		/************************************************************************************************************
			First starting is auto from component, definition is retry that component from module

			component 부터 자동으로 실행되어야한다. module에서 component를 다시 정의하기 때문에 기존의 이벤트들이 삭제되어 아무런 동작을 안한다.
			그리고 기본적인 동작을 하는 component만 실행한다. ( hasOwnProperty( object ) )
		************************************************************************************************************/

		if(!strHtml) return;

		var _self = this;
		var ID = this.Utils.arrSameRemove(strHtml.match(/data-(?:module|component)-+(?:\w|-)*/g)).sort();
		for(var i=0; i<ID.length; i++){
			var name = ID[i].replace(/data-/g, '').replace(/-/g, '_');
			var type = name.replace(/\_\w*/g, '');
			if(type === 'module'){
				try{
					/*if(moduleSelector.hasOwnProperty(ID[i])){
						if(this.getModule(moduleSelector[ID[i]]).hasOwnProperty('destroy')){
							this.getModule(moduleSelector[ID[i]]).destroy();
							delete moduleSelector[ID[i]];
						}
					}

					this.getModule(name).init();*/

					//UI.init
					if(this.getModule(name)){
						if(this.getModule(name).hasOwnProperty('destroy')){
							this.getModule(name).destroy();
							moduleData[name].instance = null;
							//delete moduleSelector[ID[i]];
						}
						//this.getModule(name).init();
					}

					this.init(name);
					if(defer && this.getModule(name).hasOwnProperty('setDeferred')){
						this.getModule(name).setDeferred(defer);
					}

				}catch(e){
					console.log(e);
				}
			}else if(type === 'component'){
				try{
					var component = this.Components[name];
					if(component.hasOwnProperty('constructor') && component.hasOwnProperty('reInit') && component.reInit){
						_self.getComponents(name);
					}else{
						component = null;
					}
				}catch(e){
					console.log(e);
				}

			}
		}
	}

	UI.Components = {};
	UI.CurrentComponentsContext = [];
	UI.CurrentComponents = [];
	UI.Observer = {
		eventID:0,
		addEvent:function(type, handler){
			if(!this.listeners) this.listeners = {};
			if(!this.listeners[type]) this.listeners[type] = {};

			var eventID = this.eventID++;
			this.listeners[type][eventID] = handler;
			return eventID;
		},
		fireEvent:function(type){
			if(!this.listeners || !this.listeners[type]) return false;
			var handlers = this.listeners[type];
			var eventID;
			var args =  Array.prototype.slice.call(arguments);

			if(handlers.stop) return false;

			args.shift();
			for(eventID in handlers) {
				if(handlers.hasOwnProperty(eventID)){
					if(eventID !== "stop"){
						if(!handlers[eventID].stop){
							handlers[eventID].apply(args[0], args[1]);
						}
					}
				}
			}
		},
		removeEvent:function(type, hnd){
			if(!this.listeners || !this.listeners[type]) return -1;
			var handlers = this.listeners[type];
			if(typeof hnd === "function"){
				for(eventID in handlers) if(handlers.hasOwnProperty(f)){
					if(handlers[eventID] === hnd){
						delete handlers[eventID];
						break;
					}
				}
				return !handlers[eventID];
			}else{
				if(handlers[hnd]) delete handlers[hnd]
					return !handlers[hnd];
			}
		},
		applyObserver:function(tclass){
			for(var p in this){
				tclass.prototype[p] = this[p];
			};

			return true;
		}
	}
	UI.Utils = {
		contextPath:(function(){
			try{
			    return _GLOBAL.SITE.CONTEXT_PATH ? _GLOBAL.SITE.CONTEXT_PATH : '';
			}catch(e){
			    return '';
			}
		})(),
		getValidateChk:function(components, msg){
			var isValidateChk = false;
			if(Array.isArray(components)){
				$.each(components, function(i){
					isValidateChk = this.getValidateChk(msg);
				});
			}else{
				isValidateChk = components.getValidateChk(msg);
			}

			return isValidateChk;
		},
		getQueryParams:function(str, type){
			if(!str) return [];

			var data = (type === 'array') ? [] : {};
			str.replace(/([^?=&]+)(?:=([^&]*))/g, function(pattern, key, value){
				if(type === 'array'){
					data.push(pattern);
				}else{
					//data[key] = decodeURI(value);
					if(data.hasOwnProperty(key)){
						if(typeof data[key] === 'object'){
							data[key].push(value);
						}else{
							data[key] = [data[key], value];
						}
					}else{
						data[key] = value;
					}
				}
			});

			return data;
		},
		arrSameRemove:function(arr){
			if(arr === null) return [];
			return arr.reduce(function(a,b){
				if (a.indexOf(b) < 0 ) a.push(b);
				return a;
			},[]);
		},
		objLengtn:function(obj){
			var size = 0, key;
			for (key in obj) {
				if (obj.hasOwnProperty(key)) size++;
			}
			return size;
		},
		trim:function(str){
			return str.replace(/(^\s*)|(\s*$)/gi, '');
		},
		price:function(price){
			//if(!price) return false;
			var temp = price.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
			if(_GLOBAL.SITE.USE_KOREA_WON_PRICE_FORMAT == true ){
				temp += '원';
			}
			return temp;
		},
		strToJson:function(str, notevil){
			try{
				// json 데이터에 "가 있을경우 변환할필요가 없으므로 notevil을 false로 변경
				if(str.match(/"/,'g') !== null) notevil = false;
				if(notevil) {
					return JSON.parse(str
						// wrap keys without quote with valid double quote
						//([\$\w]+)\s*:+([`'~!@#$%^&*?();:|_+=\/\w-#().\s0-9가-힣/\[/\]]*)
						.replace(/([\$\w]+)\s*:+([`'~!@#$%^&*?();:|_+=\/\w-#().가-힣\s/\[/\]]+|[{=\w\s,]+})*/g, function(_, $1, $2){
							if($2 !== '' && $2 !== undefined){
								return '"'+$1+'":"'+$2+'"';
							}else if($2 === undefined){
								return '"'+$1+'":';
							}else{
								return '"'+$1+'":""';
							}
						})
						//.replace(/([\$\w]+)\s*:+([`~!@#$%^&*()_=+|{};:,.<>?\s\w가-힣]*)/g, function(_, $1, $2){return '"'+$1+'":"'+$2+'"';})
						//replacing single quote wrapped ones to double quote
						.replace(/'([^']+)'/g, function(_, $1){return '"'+$1+'"';}));
				} else {
					return (new Function("", "var json = " + str + "; return JSON.parse(JSON.stringify(json));"))();
				}
			}catch(e){
				return false;
			}
		},
		mobileChk:(function(){
			return navigator.userAgent.match(/Android|Mobile|iP(hone|od|ad)|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/);
		})(),
		mobileDetect:(function(){
			/*
				console.log( md.mobile() );          // 'Sony'
				console.log( md.phone() );           // 'Sony'
				console.log( md.tablet() );          // null
				console.log( md.userAgent() );       // 'Safari'
				console.log( md.os() );              // 'AndroidOS'
				console.log( md.is('iPhone') );      // false
				console.log( md.is('bot') );         // false
				console.log( md.version('Webkit') );         // 534.3
				console.log( md.versionStr('Build') );       // '4.1.A.0.562'
				console.log( md.match('playstation|xbox') ); // false
			*/
			return new MobileDetect(window.navigator.userAgent);
		})(),
		touch:(window.Modernizr && Modernizr.touch === true) || (function () {
			'use strict';
			return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
		})(),
		transforms3d:(window.Modernizr && Modernizr.csstransforms3d === true) || (function () {
			'use strict';
			var div = document.createElement('div').style;
			return ('webkitPerspective' in div || 'MozPerspective' in div || 'OPerspective' in div || 'MsPerspective' in div || 'perspective' in div);
		})(),
		transforms:(window.Modernizr && Modernizr.csstransforms === true) || (function () {
			'use strict';
			var div = document.createElement('div').style;
			return ('transform' in div || 'WebkitTransform' in div || 'MozTransform' in div || 'msTransform' in div || 'MsTransform' in div || 'OTransform' in div);
		})(),
		transitions:(window.Modernizr && Modernizr.csstransitions === true) || (function () {
			'use strict';
			var div = document.createElement('div').style;
			return ('transition' in div || 'WebkitTransition' in div || 'MozTransition' in div || 'msTransition' in div || 'MsTransition' in div || 'OTransition' in div);
		})(),
		addEvent:function($target, evt, func){
			if(window.addEventListener || document.addEventListener){
				$target.addEventListener(evt, func);
			}else{
				$target.attachEvent('on'+ evt, func);
			}
		},
		removeEvent:function($target, evt, func){
			if(window.addEventListener){
				$target.removeEventListener(evt, func);
			}else{
				$target.detachEvent('on'+ evt, func);
			}
		},
		ajax:function(url, method, data, callback, isCustom, isLoadingBar, delay, dataType, cache){
			//$('.dim').addClass('active');
			if(!isLoadingBar) UI.Loading.show();

			// POST 일때 token 추가, 현재 admin에서만 동작함
			var $tokenForm = $('#tokenForm');
			if( $tokenForm != null && data != null && String(method).toLowerCase() == 'post'){
				if( typeof( data ) == 'object' ){
					if( data.csrfToken == null ){
						data.csrfToken = $tokenForm.find('input[name="csrfToken"]').val();
					}
				}
				if( typeof( data ) == 'string' ){
					if (data.indexOf('csrfToken') == -1 ){
						data = data + '&' + $tokenForm.serialize()
					}
				}
			}

			$.ajaxSetup({cache:false});
			$.ajax({
				url:url,
				type:method||'POST',
        		dataType:dataType||'json',
				data:data,
				cache:false,
				complete:function(data){
					//$('.dim').removeClass('active');

					_.delay(function(data){

						if(!isLoadingBar) UI.Loading.hide();
						if(data.status == 200 && data.readyState === 4 || isCustom ){
							callback(data);
						}else{
							UIkit.notify('error : ' + data.status, {timeout:3000,pos:'top-center',status:'danger'});
						}
					},( delay || 100 ), data);
				}
			});
		},
		jsonp:function(url, data, callbackName, callback, isLoadingBar){
			if(!isLoadingBar) UI.Loading.show();

			$.jsonp({
				url:url,
				data:data,
				dataType:'jsonp',
				callbackParameter:callbackName,
				timeout:5000,
				success:function(data, status){
					UI.Loading.hide();
					callback(data, status);
				},
				error:function(XHR, textStatus, errorThrown){
					UI.Loading.hide();
					callback({error:textStatus});
				}
			});

			/*$.ajax({
				url:url,
				data:data,
				dataType:'jsonp',
				jsonp:callbackName,
				success:function(data){
					console.log('fjdsjaflkdsjalkjvdlksanfklewnkl');
					if(!isLoadingBar) UI.Loading.hide();
					callback(data);
				}
			});*/

		},
		promise:function(opts){
			var isLoadingBar = (opts.isLoadingBar === false) ? opts.isLoadingBar : true;
			if(!opts.url) return false;
			if(isLoadingBar) UI.Loading.show();

			var defer = $.Deferred();
			$.ajaxSetup({cache:false});
			var promise = $.ajax({
				url:opts.url,
				type:opts.method || 'GET',
				data:opts.data || {},
				cache:false,
				success:function(data){
					if(isLoadingBar) UI.Loading.hide();
					if(opts.hasOwnProperty('custom') && opts.custom){
						defer.resolve(data);
					}else{
						if(data.hasOwnProperty('result')){
							if(data.result){
								defer.resolve(data);
							}else{
								defer.reject(data.errorMessage || data.errorMsg || data);
							}
						}else{
							defer.resolve(data);
						}
					}
				},
				error:function(data){
					if(isLoadingBar) UI.Loading.hide();
					defer.reject(data.statusText);
				}
			});

			return defer.promise();
		},
		replaceTemplate:function(template, rtnFunc){
			return template.replace(/{+[\w-]*}+/g, function(pattern){
				return rtnFunc(pattern.replace(/{{|}}/g, ''));
			});
		},
		replaceTemplateTest:function(template, data){
			function rtnTemp(template){
				data.forEach(function(data, i){
					var txt = '';
					var temp = template.replace(/({{each?[\s\w.]+}}{1})([\s\w<>="{}#\/.-]*){{\/each}}/g, function(){
						var argexp = new RegExp(/each/, 'g');
						var args = arguments;
						var arrKeys = args[1].match(/[^{}]/g).join('').replace(/(?:each|\s)/g, '').split(/\./g);
						var tempData = data;

						for(var i=0; i<arrKeys.length; i++){
							if(i > 0){
								tempData = rtnValue(tempData, arrKeys[i]);
							}
						}

						if(argexp.test(args[2])){
							rtnTemp(args[2]);
						}

						txt += args[2].replace(/{+[\w.]*}+/g, function(pattern){
							var arrKeys = pattern.match(/[^{}]/g).join('').split(/\./g);
							var val = data;

							for(var i=0; i<arrKeys.length; i++){
								if(i > 0){
									val = rtnValue(val, arrKeys[i]);
								}
							}

							return val;
						});
					});

					return txt;
				});
			}

			function rtnValue(data, key){
				return data[key];
			}

			return rtnTemp(template);
		},
		rtnMatchComma:function(keyword){
			return keyword.match(/[0-9a-zA-Z가-힣\s]+[^,\s]/g) || [];
		}
	}

	UI.Loading = (function(){
		var template = '<div class="loading"><div class="dim"></div><div class="contents"><img src="/cmsstatic/theme/SNKRS/assets/images/preloader.gif" /><span class="comment">처리중 입니다.</span></div></div>';
		var $loading = $('body').append((function(){
			return $('#loading-icon-template').html();
		})() || template).find('.loading');

		return {
			show:function(){
				$loading.focus();
				$loading.addClass('open');
			},
			hide:function(){
				$loading.removeClass('open');
			}
		}
	})();

	UI.Scrollarea = (function(){
		var ScrollArea = function(wrapper, container, callback, id){
			var ID = id || '';
			var $wrapper = $(wrapper);
			var $container = $(container);
			var currentPer = 0;
			var arrCallBackFunc = [];
			var maximumHeight;
			var percent;
			var scrollTop;

			return {
				init:function(){
					var _self = this;
					$wrapper.on('scroll.' + ID, function(e){
						scrollTop = $(this).scrollTop();
						maximumHeight = $container.height() - $(this).height();
						percent = Math.round((scrollTop / maximumHeight) * 100);

						if(callback && typeof callback === 'function'){
							callback.call(_self, percent, scrollTop);
							currentPer = percent;
						}else{
							console.log('Not defined that callbackfunc of scrollEvent');
							$wrapper.off('scroll');
						}
					});

					return _self;
				},
				setScrollTop:function(top){
					$wrapper.scrollTop(top);
					return this;
				},
				setScrollPer:function(per){
					return Math.round((maximumHeight / 100) * per);
				},
				getScrollTop:function(offsetTop){
					return Math.round(((offsetTop - $wrapper.height()) / maximumHeight) * 100);
				},
				getScrollPer:function(){
					return currentPer;
				},
				setAddCallBack:function(callbackfunc){
					arrCallBackFunc.push(callbackfunc);
				},
				destroy:function(){
					$wrapper.off('scroll.' + ID);
					return this;
				}
			}
		}

		return {
			setScrollArea:function(wrapper, container, callback, id){
				return new ScrollArea(wrapper, container, callback, id).init();
			}
		};
	})();

	UI.SliderBar = function(){
		var _self = this;
		var callback = Array.prototype.slice.call(arguments).pop();
		var $container = $(this).parent();
		var currentPer = 0;
		var startX = 0;

		if(UI.Utils.touch){
			UI.Utils.addEvent(this, 'touchstart', onStart);
			UI.Utils.addEvent(this, 'touchmove', onMove);
			UI.Utils.addEvent(this, 'touchend', onEnd);
		}else{
			UI.Utils.addEvent(this, 'mousedown', onStart);
		}

		function onStart(e){
			var touchobj = (UI.Utils.touch) ? e.touches[0] : e;

			startX = touchobj.clientX - $container.offset().left;
			currentPer = ((startX / $container.width()) * 100);

			if(typeof callback.start == 'function') callback.start(currentPer);
			if(!UI.Utils.touch){
				UI.Utils.addEvent(document, 'mousemove', onMove);
				UI.Utils.addEvent(document, 'mouseup', onEnd);
			}
		}

		function onMove(e){
			var touchobj = (UI.Utils.touch) ? e.touches[0] : e;
			var percent = ((((touchobj.clientX - $container.offset().left) - startX) / $container.width()) * 100) + currentPer;

			if(percent < 0) percent = 0;
			else if(percent > 100) percent = 100;

			//console.log(percent);

			if(typeof callback.move == 'function') callback.move(percent);
		}

		function onEnd(e){
			if(typeof callback.end == 'function') callback.end();
			if(!UI.Utils.touch){
				UI.Utils.removeEvent(document, 'mousemove', onMove);
				UI.Utils.removeEvent(document, 'mouseup', onEnd);
			}
		}

		return {
			getPercent:function(){
				return currentPer;
			},
			setPercent:function(per){
				currentPer = per;
				if(typeof callback.move == 'function') callback.move(currentPer);
			}
		}
	}

	UI.polyfill = (function(){

		//  ~ IE8 function bind method add
		Function.prototype.bind = Function.prototype.bind || function(b) {
			if (typeof this !== "function") {
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}

			var a = Array.prototype.slice;
			var f = a.call(arguments, 1);
			var e = this;
			var c = function() {};
			var d = function() {
				return e.apply(this instanceof c ? this : b || window, f.concat(a.call(arguments)));
			};
			c.prototype = this.prototype;
			d.prototype = new c();
			return d;
		};




		//  ~ IE8 Object keys method add
		// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
		if (!Object.keys) {
			Object.keys = (function() {
				'use strict';
				var hasOwnProperty = Object.prototype.hasOwnProperty,
					hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
					dontEnums = [
						'toString',
						'toLocaleString',
						'valueOf',
						'hasOwnProperty',
						'isPrototypeOf',
						'propertyIsEnumerable',
						'constructor'
					],
					dontEnumsLength = dontEnums.length;

				return function(obj) {
					if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
						throw new TypeError('Object.keys called on non-object');
					}

					var result = [], prop, i;

					for (prop in obj) {
						if (hasOwnProperty.call(obj, prop)) {
							result.push(prop);
						}
					}

					if (hasDontEnumBug) {
						for (i = 0; i < dontEnumsLength; i++) {
							if (hasOwnProperty.call(obj, dontEnums[i])) {
							result.push(dontEnums[i]);
							}
						}
					}

					return result;
				};
			}());
		}



		// ECMA-262 5판, 15.4.4.21항의 작성 과정
		// 참고: http://es5.github.io/#x15.4.4.21
		if (!Array.prototype.reduce) {
			Array.prototype.reduce = function(callback /*, initialValue*/) {
				'use strict';
				if (this == null) {
					throw new TypeError('Array.prototype.reduce called on null or undefined');
				}
				if (typeof callback !== 'function') {
					throw new TypeError(callback + ' is not a function');
				}
				var t = Object(this), len = t.length >>> 0, k = 0, value;
				if (arguments.length == 2) {
					value = arguments[1];
				} else {
					while (k < len && !(k in t)) {
						k++;
					}
					if (k >= len) {
						throw new TypeError('Reduce of empty array with no initial value');
					}
					value = t[k++];
				}
				for (; k < len; k++) {
					if (k in t) {
						value = callback(value, t[k], k, t);
					}
				}
				return value;
			};
		}

	})();

	UI.validation = (function(){
		var DEFAULT_OPTION = {
			animate: false,
			errorClass: "error",
			errorsContainer : function(elem, isRadioOrCheckbox ) {
				var $target = null;
				if( $(elem.$element).is('input[type="radio"]') || $(elem.$element).is('input[type="checkbox"]') ){
					$target = $( elem.$element ).parent().parent();
				}else{
					$target = $( elem.$element ).parent();
				}
				$target.removeClass("server-error");
				return $target;
			},
			classHandler : function(elem, isRadioOrCheckbox ) {
				var $target = null;
				if( $(elem.$element).is('input[type="radio"]') || $(elem.$element).is('input[type="checkbox"]') ){
					$target = $( elem.$element ).parent().parent();
				}else{
					$target = $( elem.$element ).parent();
				}
				$target.removeClass("server-error");
				return $target;
			},
			errorsWrapper: '<span class="error-message"></span>',
			errorTemplate: '<span></span>',
			validationThreshold : 1,
			excluded: ':hidden'
		}

		function init( dom, opts ){
			dom.parsley( $.extend( DEFAULT_OPTION, opts ));
		}

		function reset( dom, opts ){
			dom.parsley( $.extend( DEFAULT_OPTION, opts ) ).reset();
		}

		function validate( dom ){
			dom.parsley().validate();
		}

		function isValid( dom ){
			return dom.parsley().isValid();
		}

		function destroy( dom ){
			dom.parsley().destroy();
		}

		return {
			init : init,
			reset : reset,
			validate : validate,
			isValid : isValid,
			destroy : destroy
		}
	})();
	
	UI.reSizeWidth = (function(){
		var frag = '';
		var currentDeviceInfo = {};
		var currentBreakPoint = 0;
		var arrDevice = ['mobile', 'tablet', 'pc'];

		$(window).resize(function(e){
			var wH = $(window).width();
			if(wH <= 480 && frag !== 'mobile'){
				frag = 'mobile';
				currentDeviceInfo = arrDevice[0];
				$('body').attr('data-device', 'mobile');
			}else if(wH > 480 && wH <= 960 && frag !== 'tablet'){
				frag = 'tablet';
				currentDeviceInfo = arrDevice[1];
				$('body').attr('data-device', 'tablet');
			}else if(wH > 960 && frag !== 'pc'){
				frag = 'pc';
				currentDeviceInfo = arrDevice[2];
				$('body').attr('data-device', 'pc');
			}
		});

		$(window).trigger('resize');

		return {
			getState:function(){
				return currentDeviceInfo;
			}
		}
	})();

	UI.sessionHistory = (function(){
		var currentQueryParam = UI.Utils.getQueryParams(location.href);
		for(var key in currentQueryParam){
			sessionStorage.setItem(key, currentQueryParam[key]);
		}

		var currentHistory = (function(){
			var obj = {};
			for(var key in sessionStorage){
				obj[key] = sessionStorage[key];
			}
			return obj;
		})();

		return {
			getHistory:function(key){
				if(key){
					return currentHistory[key];
				}else{
					return currentHistory;
				}
			},
			updateHistory:function(){
				currentHistory = {};
				for(var key in sessionStorage){
					currentHistory[key] = sessionStorage[key];
				}
				return currentHistory;
			},
			setHistory:function(obj){
				if(!obj || typeof obj !== 'object'){
					throw new Error('param obj is not Object');
					return;
				}

				for(var key in obj){
					sessionStorage.setItem(key, obj[key]);
				}

				this.updateHistory();
			},
			removeHistory:function(key){
				if(!key) return;
				if(key === 'all'){
					sessionStorage.clear();
				}else{
					sessionStorage.removeItem(key);
				}

				this.updateHistory();
			}
		}
	})();

	UI.cookie = (function(){
		var objCookies = {};
		unescape(window.cookie).split(/;/).forEach(function(v, i){
			var arrValue = v.split(/=/);
			objCookies[arrValue[0].replace(/[\s\n\t]/, '')] = arrValue[1];
		});

		var setExpiresDate = function (expires , time){
			var date = new Date();
			date.setTime(date.getTime()+(expires*time*1000));
			var expires = "expires=" + date.toUTCString();
			return expires;
		}

		return {
			getCookie:function(key){
				return (key) ? objCookies[key] : objCookies;
			},
			setCookie:function(key, value, options){
				/*
					expires           쿠키 만료일       new Date(year, month, day, hours, minutes, seconds, milliseconds)
					expires_day       쿠키 생존 일      숫자
					expires_hour      쿠키 생존 시간    숫자
					domain            도메인          www.example.com 또는 sub.example.com 또는 example.com
					path              경로            / 또는 /dir
					secure            ssl             true 또는 false

				*/

				var options = options || {};
				var arrCookie = [];

				if(options.encodeType == "encodeURI" ){
					arrCookie.push(escape(key) + '=' + encodeURI(value));
				}else if( options.encodeType == "encodeURIComponent" ) {
					arrCookie.push(escape(key) + '=' + encodeURIComponent(value));
				}else{
					arrCookie.push(escape(key) + '=' + escape(value));
				}


				if(options.expires){
					if( typeof options.expires === 'object' && options.expires instanceof Date ){
						var date = options.expires;
						var expires = "expires=" + date.toUTCString();
						arrCookie.push(expires);
					}
				}else if(options.expires_day){
					arrCookie.push(setExpiresDate(options.expires_day , 24*60*60));
				}else if(options.expires_hour){
					arrCookie.push(setExpiresDate(options.expires_hour , 60*60));
				}

				if(options.domain) arrCookie.push("domain=" + options.domain);
				if(options.path) arrCookie.push('path=' + options.path);
				if(options.secure === true) arrCookie.push('secure=' + options.secure);

				document.cookie = arrCookie.join('; ');
			},
			delCookie:function(key){
				if(!key){
					return 'You will try remove cookie ';
				}else{
					document.cookie=key + "=" + "; expires=" + new Date().toUTCString();
				}
				return objCookies[key];
			}
		}
	})();

	// 변수명 정리를 위한 소문자 재정의
	UI.utils = UI.Utils;
	return UI;
});

function showMenu(){
	$("#mobileMenuOpenBtn").trigger('click');
}

if (typeof jQuery != 'undefined') {
	$.cookie("USERID", _GLOBAL.CUSTOMER.ID, { path: '/' });
	$.cookie("ISSIGNIN", _GLOBAL.CUSTOMER.ISSIGNIN, { path: '/' });
}

function removeHistory(flag) {
	if (!flag) {
		sessionStorage.removeItem('categoryTarget');
		sessionStorage.removeItem('categoryList');
		sessionStorage.removeItem('categoryPathname');
		sessionStorage.removeItem('categoryScrollTop');
	}
}

$(document).ready(function(){
	//channel sessionHistory
	var currentQueryParam = Core.Utils.getQueryParams(location.href);
	if(currentQueryParam.channel){
		if(!currentQueryParam.pid){
			Core.sessionHistory.removeHistory('pid');
		}
	}

	//modules init
	if(document.readyState == 'complete' || document.readyState == 'interactive'){
		//category history back
		var categoryPagingType = sessionStorage.getItem('categoryPagingType');
		if(categoryPagingType === 'scroll' || categoryPagingType === 'more'){
			if(sessionStorage.getItem('categoryPathname') === location.href){
				if(sessionStorage.getItem('categoryTarget')){
					$('body').find(sessionStorage.getItem('categoryTarget')).html(sessionStorage.getItem('categoryList'));
					$(document).scrollTop(sessionStorage.getItem('categoryScrollTop'));
					removeHistory(false);

					//UIkit.notify('history back', {timeout:3000,pos:'top-center',status:'warning'});
				}
			}else{

				if(!sessionStorage.getItem('isHistoryBack')){
					sessionStorage.removeItem('categoryCurrentPage');
					sessionStorage.removeItem('categoryLineSize');
				}
				removeHistory(sessionStorage.getItem('isHistoryBack'));
				sessionStorage.removeItem('isHistoryBack');
				//UIkit.notify('history back no', {timeout:3000,pos:'top-center',status:'warning'});
			}
		}else{
			removeHistory(false);
			//UIkit.notify('history back out', {timeout:3000,pos:'top-center',status:'warning'});
		}

		//document ready dim none;
		$('.dim').removeClass('module-start-before');

		//modules registered in Core
		//Core.initAll();

		// modules defined
		var initDocument = $('body').html();
		Core.moduleEventInjection(initDocument);

		// scroll top go
		var offset = 350;   // 수직으로 어느정도 움직여야 버튼이 나올까?
		var duration = 60;   // top으로 이동할때까지의 animate 시간 (밀리세컨드, default는 400. 예제의 기본은 500)

		Core.Scrollarea.setScrollArea(window, document, function(per){
			if(per !== 0 && this.getScrollPer() > per){
				$('.scrollup').fadeIn(duration);
			}else if(per === 0 || this.getScrollPer() < per){
				$('.scrollup').fadeOut(duration);
			}

			if(per > 30){
				$('.historyBack').fadeIn(duration);
			}else{
				$('.historyBack').fadeOut(duration);
			}

			//console.log( per );
		}, 'top');

		// 현재 왓슨스에만 적용되어있는 상단 뒤로가기 버튼 이벤트 처리
		$('.historyBack').click(function(e){
			e.preventDefault();
			history.back();
			return false;
		});

		$('.scrollup').click(function(e){
			e.preventDefault();
			$('html, body').animate({scrollTop: 0}, duration);
			return false;
		});


		// 모든 submit 시 loding 처리
		$('form').on( 'submit', function(){
			if($(this).attr('data-isLoadingBar') === 'false') return;
			Core.Loading.show();
		});

		// 이미지맵 사용시 반응형 처리
		if (_.isFunction($('img[usemap]').rwdImageMaps)) {
			$('img[usemap]').rwdImageMaps();
		}

		/* UIKit modal override */
		/*UIkit.modal.alert = function(content, options) {
		    var modal = UIkit.modal.dialog(([
		        '<div class="uk-margin uk-modal-content">'+String(content)+'</div>',
		        '<div class="uk-modal-footer uk-text-right"><button class="button small uk-modal-close">확인</button></div>'
		    ]).join(""), UIkit.$.extend({bgclose:false, keyboard:false}, options)).show();
		    return modal;
		};

		UIkit.modal.confirm = function(content, options) {
		    var modal = UIkit.modal.dialog(([
		        '<div class="uk-margin uk-modal-content">'+String(content)+'</div>',
		        '<div class="uk-modal-footer uk-text-right"><button class="button small uk-modal-close">확인</button></div>'
		    ]).join(""), UIkit.$.extend({bgclose:false, keyboard:false}, options)).show();
		    return modal;
		};*/
		
		// 주문서에 뒤로가기로 접근했을시 처리를 위한 리다이렉트

		/*
		if ((String(window.location.pathname).indexOf('/checkout') > -1)) {
			var oldCartId = $.cookie('oldCartId');
			if (oldCartId != 'none' && typeof oldCartId != "undefined" ) {	
				var callRedirect = false;
				var cartId = $("input[name='cartId']").val();
				// 쿠키에 값이 있는데 아이디 정보가 없으면 - 재설정 되지 않고 비워진 카트를 보여줄 때
				if (!cartId) { 
					callRedirect = true;
				}else{
					// 쿠키에 값이 있고 현재 값과 쿠키 값이 같다면 - /checkout/request 로 재설정 되지 않은 상태
					if (cartId == oldCartId) {
						callRedirect = true;
					}
				}
				if (callRedirect){
					Core.Loading.show();
					$('.less-items .redirect').removeClass('uk-hidden');
					// 바로 리다이렉트 될 경우 adobe analytics 에서 page url을 /request 로 인식 하는 오류가 있어 약간 늦춰서 이동시킨다
					_.delay(function(){
						window.location.assign(Core.Utils.contextPath + '/checkout/request/' + oldCartId);
					}, 1000)
				}else{
					$('.less-items .default').removeClass('uk-hidden');	
				}
				Core.cookie.setCookie("oldCartId", 'none');
			}else{
				$('.less-items .default').removeClass('uk-hidden');
			}
		}else{
			Core.cookie.setCookie("oldCartId", 'none');
		}
		*/
		
		/* 부하 테스트시 필요한 스크립트 특정 파라미터가 있으면 이벤트를 트리거 */
		
		var e = {},
			d = Core.Utils.url.getCurrentUrl();
		d.replace( new RegExp( "([^?=&]+)(=([^&]*))?", "g" ), function ( g, f, i, h ) {
			e[ f ] = decodeURIComponent(h);
		} );

		var url = e;

		if( url.tftest ){

			// 상품 바로주문
			// localhost:8080/checkout?tftest=true
			$(this).find("div[data-attribute-name='SHOES_SIZE']").find(".input-radio").eq(0).trigger('click');
			/*
			$(".option-wrap:eq(0)").find('[class^="product-option_"]' ).each( function(){

			});
			*/

				//$("[data-brz-components-type]").find("select").find("option:eq(1)").attr("selected", "selected");
				/*
			$(".option-wrap:eq(0)").find('.select-box' ).each( function(){
				console.log( $(this));
				console.log( $(this).data("brz-components-type"));
				if( $(this).data("brz-components-type") == "SIZE"){
					console.log( 'update')
					$(this).find("select").find("option:eq(1)").attr("selected", "selected").trigger('change');
				}
			});
			*/

			// btn-buy
			// btn-next
			// btn-next
			// btn-gift-submit
			// btn-checkout-complete-submit

			//A4NE-CP35-HE97

			var isFirst = true;
			$('[data-add-item]').each(function(i){
				$(this).find('.btn-link').each( function(){
					var $btn = $(this);
					var type = $btn.attr("action-type");
					if( type == "redirect" && isFirst ){
						isFirst = false;
						_.delay(function(){
							$btn.trigger("click");
						},
						1000);
						return false;
					}
				});
			});

			// 주문고객 정보 입력
			if( url.email ){
				$('input[name="emailAddress"]').val( url.email );
				$('input[name="phoneNumber"]').val( url.phone );
				//$('[data-order-info-submit-btn]').trigger( 'click' );
			}

			if( url.name ){
				// 배송지 정보 입력
				$('input[name="address.fullName"]').val( url.name );
				$('input[name="address.phonePrimary.phoneNumber"]').val( url.phone );
				$('input[name="address.addressLine1"]').val( url.addr1 );
				$('input[name="address.addressLine2"]').val( url.addr2 );
				$('input[name="address.postalCode"]').val( url.pcode );
				$('input[name="fulfillmentOptionId"]').eq(0).attr("checked", true);
				//$('[data-order-shipping-submit-btn]').trigger( 'click' );
			}

			// gift 카드 적용
			//3GRG-WSSK-G6JW
			// http://localhost:8080/checkout?tftest=true&gift=XD7Z-9EKG-ZP3F
			// http://localhost:8080/checkout?tftest=true&gift=3GRG-WSSK-G6JW

			if( url.gift ){
				$('input[name="giftCardNumber"]').val( url.gift );
				$('#applyGiftcard_form').submit();
			}

			// 최종 결제
			// http://localhost:8080/checkout?tftest=true&complete=true
			if( url.complete ){
				$('input[name="isCheckoutAgree"]').prop('checked', true);
				$('[data-checkout-btn]').trigger('click');
			}
		}

		/*

		$("[data-issoldout]").each( function( index, data ){
			var isSoldout = $(this).text();
			var type = $( this ).data('issoldout');
			var target = "";
			switch( type ){
				case "productItem" :
					target = $( this ).closest(".product-item");
				break;
				case "product" :
					target = $(".product-option-container");
				break;
			}
			if( String(isSoldout) == "true"){
				target.find('[data-soldout-target="true"]').removeClass('uk-hidden');
				target.find('[data-soldout-target="false"]').remove();
			}else{
				target.find('[data-soldout-target="true"]').remove();
				target.find('[data-soldout-target="false"]').removeClass('uk-hidden');
			}

		})

		*/

	}
});

(function(Core){

	var ProductOptionSelected = function(){
		'use strict';

		// @pck 2020-10-30 		sticky A/B 테스트 결과 반영건으로 v2 반영
		// 						Sticky 관련 로직은 ui > _ui_product_sticky.js로 이동
		// @pck 2020-06-17 		sticky iPad 미작동 이슈로 PDP Option 콤포넌트를 반응형 구조로 변경 (s)

		/*
		var btnsActions = document.querySelectorAll('.sticky-section .order-wrap .btn-link:not(.wish-btn)');
		var btnTogglePopup = document.querySelector('.toggle_popupdown');

		$(window).on('resize scroll', function() {
			var deviceType = null;
			if (document.querySelector('.sticky-section') !== null) {
				deviceType = window.getComputedStyle(
					document.querySelector('.sticky-section'), ':before'
				).getPropertyValue('content');

				//iOS 모바일에서 css property value 가져올 때 "이 빠지는 현상이 있음.
				//모바일외 상태에서는 초기상태로 복귀
				if (deviceType == '"mobile"' || deviceType == 'mobile') {
					//스크롤 시 헤더 스티키로 화면이 흔들리면서 리사이즈 이벤트 발생
					if(btnTogglePopup !== null) {
						//PC, 타블릿에서 모바일로 화면이 변경되었을 때 초기화
						if(btnTogglePopup.classList.contains('active')) {
							btnTogglePopup.classList.remove('active');

							$('.pre-btn').each(function(index, preBtn){
								preBtn.removeAttribute('style');
							});
							$(btnsActions).each(function(index, btnAction){
								btnAction.removeAttribute('style');
							});
						}

						$(document).on('scroll', function () {
							if (btnTogglePopup.classList.contains('active')) {
								btnTogglePopup.classList.remove('active');

								$('.pre-btn').each(function (index, preBtn) {
									preBtn.removeAttribute('style');
								});
								$(btnsActions).each(function (index, btnAction) {
									btnAction.removeAttribute('style');
								});
							}
						});
					}
				}
			}
		});

		$('.pre-btn').each(function(index, btn){
			btn.addEventListener('click', function(event){
				if(!btnTogglePopup.classList.contains('active')){
					btnTogglePopup.classList.add('active');

					$('.pre-btn').each(function(index, preBtn){
						preBtn.setAttribute('style', 'display:none;');
					});
					$(btnsActions).each(function(index, btnAction){
						btnAction.setAttribute('style', 'display:block;');
					});
				}
			});
		});

		@pck 2020-10-30 A/B 테스트 결과 반영으로 v2부터는 토글을 사용하지 않음 (삭제예정)
		if(btnTogglePopup !== null){
			btnTogglePopup.addEventListener('click', function(event){
				this.classList.remove('active');
				$('.pre-btn').each(function(index, preBtn){
					preBtn.setAttribute('style', 'display:block;');
				});
				$(btnsActions).each(function(index, btnAction){
					btnAction.setAttribute('style', 'display:none;');
				});
			});
		}
		 */
		// @pck 2020-06-17 sticky iPad 미작동 이슈로 PDP Option 콤포넌트를 반응형 구조로 변경 (e)

		var receiveToEvent = function(checkedOpt){
			var key = Object.keys(checkedOpt)[0];
			var index = 0;
			var resetIS = false;
			var objOpt = {};
			var currentIndex = 0;

			//currentSku 초기화하여 사용해야 하지만 returnToSkuData에 currentSku값을 사용하는 문제점 해결시 사용해야함
			//if(key === firstOptName) currentSku = allSkuData;
			//선택된 옵션 인덱스

			for(var i=0; i<optionData.length; i++){
				if(optionData[i].type === key){
					currentIndex = i;
					break;
				}
			}

			optionData.map(function(data, i, o){
				if(data.type === key) data.selectedValue = (checkedOpt[key] !== '' && checkedOpt[key] !== null) ? checkedOpt[key] : null;

				//선택된 다음 옵션들 리셋
				if(i > currentIndex) disabled(data.type, i);
				if(data.selectedValue === null){
					if(checkedOpt[key] !== '' && checkedOpt[key] !== null && index === i){
						//data.type : 다음 옵션 아이디
						//data : 다음 옵션 리스트
						//returnToSkuData(key, checkedOpt[key]) : sku 리스트
						nextOpt(data.type, data, returnToSkuData(objOpt));
					}
				}else{
					index++;
					objOpt[data.type] = data.selectedValue;

					if(index === o.length){
						//if(productOptionType === 'multi') multiAddOption(objOpt);
						if(productOptionType === 'single') singleAddOption(objOpt);
					}
				}
			});
		}

		var returnToSkuData = function(objSkuValue){
			var arrData = [];
			var len = Object.keys(objSkuValue).length;
			var counter = 0;

			//currentSku값에서만 옵션을 체크하여 값을 전달 해야 하지만
			//currentSku값의 초기화 문제때문에 allSkuData의 배열을 이용해야한다.
			$(allSkuData).each(function(index, data){
				counter = 0;
				for(var key in objSkuValue){
					if(data[key] == objSkuValue[key]){
						counter++;
						if(counter === len){
							arrData.push(data);
						}
					}
				}
			});

			return arrData;
		}

		var nextOpt = function(componentID, opt, sku){
			currentSku = sku;
			optionDom[componentID].receiveToData(opt, sku);
		}

		var disabled = function(componentID, index){
			optionData[index].selectedValue = null;
			optionDom[componentID].disabled();
		}

		var noAddOption = function(){
			var obj = {};
			obj['qty'] = $('input[name=quantity]').eq(0).val();
			currentOptList = {};
			currentOptList['noOption'] = obj;
		}

		var singleAddOption = function(objOpt){
			var obj = {};
			var listKey = '';
			var sku = null;
			var counter = 0;

			sku = returnToSkuData(objOpt)[0];

			//옵션타입이 selectbox일때 value가 없는 즉, 선택하세요.. 이 선택될 경우 sku가 없으므로 리턴시킨다.
			if(!sku) return;

			obj['price'] = sku.price;
			obj['qty'] = $this.find('.qty').val();
			obj['maxQty'] = sku.quantity;
			obj['retailPrice'] = sku.retailPrice;
			obj['salePrice'] = sku.salePrice;
			obj['inventoryType'] = sku.inventoryType;
			obj['options'] = {};
			obj['upc'] = sku.upc;
			obj['id'] = sku.skuId;
			obj['locationQuantity'] = sku.locationQuantity;

			for(var optionKey in option){
				listKey += option[optionKey].values[option[optionKey].selectedValue];
				obj['options'][optionKey] = option[optionKey].values[option[optionKey].selectedValue];

				counter++;
			}

			currentOptList = {};
			currentOptList[listKey] = obj;

			if($submitBtn.hasClass('disabled') && submit){
				$submitBtn.removeClass('disabled');
			}

			if(obj.salePrice){
				var salePrice = parseInt(obj.salePrice.replace(/[￦,가-힣]/g, ''));
				var retailPrice = parseInt(obj.retailPrice.replace(/[￦,가-힣]/g, ''));
				var productInfo = _GLOBAL.MARKETING_DATA().productInfo;

				if( productInfo ){
					productInfo.price = salePrice;
					productInfo.retailPrice = retailPrice;
				}

				if(salePrice < retailPrice){
					$salePrice.find('strong').text(obj.salePrice).data("price", salePrice);
					$retailPrice.text(obj.retailPrice);
					$('.marketing-msg').show();
				}else{
					$salePrice.find('strong').text(obj.retailPrice).data("price", obj.retailPrice);
					$retailPrice.text('');
					$('.marketing-msg').hide();
				}
			}else{
				$salePrice.find('strong').text(obj.retailPrice).data("price", obj.retailPrice);
				$retailPrice.text('');
			}
			$upcCode.data('upc', obj.upc);
			$upcCode.text(obj.upc);

			/*
				fireEvent 가 등록되기전에 호출하여 처음 이벤트는 발생하지 않는다 그래서 setTimeout으로 자체 딜레이를 주어 해결하였다.
				조금 위험한 방법아지만 해결방법을 찾기 전까지 사용해야 할꺼 같다.
			*/
			setTimeout(function(){
				__self.fireEvent('skuComplete', __self, [obj]);
			});
		}

		/*
		var multiAddOption = function(objOpt){
			//console.log('multiAddOption');
		}
 		*/

		var promiseInit = function(_self){
//			allSkuData = objOptType['data-sku-data']; //Core.Utils.strToJson($this.attr('data-sku-data'));
			//bundleDefaultSkuData = Core.Utils.strToJson($this.attr('data-bundleDefaultSkuData-data'));

			//allSkuData = $this.find("[data-sku-data]").data("sku-data");
			//$this.find("[data-sku-data]").remove();
			//옵션 데이터 나누기 예) COLOR:{}, SIZE:{} ...

			for(var k in optionData){
				option[optionData[k].type] = optionData[k];

				for(var i=0; i<allSkuData.length; i++){
					allSkuData[i][optionData[k].type] = allSkuData[i].selectedOptions[k];
				}
			}

			$optionWrap.find('[data-brz-components-type]').each(function(i){

				optionDom[$(this).attr('data-brz-components-type')] = Core.getComponents(componentType, {context:$this, selector:this}, function(){
					this.addEvent('change', function(attributeValue, valueId, id, friendlyName){
						var obj = {};
						var _that = this;
						var $that = $(_that);
						var attributeName = $that.attr('data-attributename');
						var friendlyName = $that.attr('data-friendly-name');

						obj[$(_that).attr('name')] = valueId;
						receiveToEvent(obj);

						$optionWrap.find('input[type=hidden]').each(function(i){
							if($(this).attr('name') === 'itemAttributes['+attributeName+']'){
								$(this).val(escape(attributeValue));
								//$(this).val(attributeValue);
							}
						});

						//시스템변수 low.inventory.indicator.quantity 설정한 값 보다 작을 경우, 품절 관련 안내문구 노출
						var ckSize = $(this).val();
						$(allSkuData).each(function (index,item) {
							if(item.SIZE==ckSize){
								var item_quantity = item.quantity; // 재고
								var maxea_chk 	 = $this.find('[data-maxea-chk]').attr('data-maxea-chk');   //구매제한 수량
								var soldoutlimit = $this.find('[data-soldoutlimit-chk]').attr('data-soldoutlimit-chk'); //품절임박 수량

								if(soldoutlimit != 'null'){ //품절임박 수량 입력시
									if (item_quantity < soldoutlimit) {// 메세지 노출
										$("#indicatoea").css('display','inline-block');
									}else{
										$("#indicatoea").css('display','none');
									}
								}
								return false;
							}
						});

						endPoint.call("pdpOptionClick", $.extend( objOptType, { type : attributeName, value : attributeValue, skuData : allSkuData }));

						/*
							fireEvent 가 등록되기전에 호출하여 처음 이벤트는 발생하지 않는다 그래서 setTimeout으로 자체 딜레이를 주어 해결하였다.
							조금 위험한 방법아지만 해결방법을 찾기 전까지 사용해야 할꺼 같다.
						*/
						setTimeout(function(){
							if(isFireEvent){
								_self.fireEvent('changeFirstOpt', _that, [firstOptName, $(_that).attr('name'), productId, attributeValue, valueId, id, friendlyName]);
								if( attributeName.toLowerCase() == 'color' ){
									endPoint.call( 'pdpColorClick', { color : attributeValue })
								}
							}
							isFireEvent = true;
							$that.closest('div').prev().find('.over-txt').text(friendlyName);
						});
					});
				});

				optionData[i]['name'] = $(this).attr('data-attribute-name');
			});

			//sku load skuComplete
			_self.fireEvent('skuLoadComplete', _self, [allSkuData]);

			/*
				optionDom : radio, selectbox 컴포넌트
				optionData : 상품의 총 옵션 ( COLOR, SIZE .... )
				allSkuData : 상품 옵션으로 생성된 총 SkuData
				처음 옵션 init 로드 후 allSkuData를 가지고 해당 quantity를 체크하여 옵션의 상태를 처리한다.
				firstOptName은 현 컴포넌트 arguments의 objOptType['data-component-product-option'].first의 값을 가지고 와서 처리 한다. 해당 값은 템플릿에서 newProductOption에서 첫번째, 즉
				iterator.first 옵션의 type이며, COLOR, SIZE 만 테스트가 되어 있는 상태라 다른 옵션타입을 사용 할 경우 테스트를 해야 한다.
				단, 단품이 아닐때 실행한다.
			*/

			if(optionData && $optionWrap.find('[data-brz-components-type]').length > 0) optionDom[firstOptName].receiveToData(optionData[0], allSkuData);


			/* 	
			Adobe 태깅 용 재고 String 생성 부 (s) 2020-04-02 15:11:41 pck 
			데이터 생성 후 input:hidden에 임시 저장
			ex)
			SIZE_RUN_AVAILABILITY = 240:n|245:n|250:y|255:y|260:y|265:y|270:y|275:y|280:n|285:n|290:n|295:n|300:n|305:n|310:n|320:n
			*/
			var productOption = {} // 사이즈 맵핑용 
			var sizeAvailabilityList = [];

			// 1. 전체 상품의 옵션 중에서 사이즈옵션 정보 가져오기
			$.each( objOptType['data-product-options'],  function( index, optionData ){
				if( optionData.type == 'SIZE'){
					$.each( optionData['allowedValues'], function( idx, item ){
						productOption[ item.id ] = item.friendlyName;
					})
				}
			})

			// 2. 가져온 정보에서 품절 여부 체크
			$.each( objOptType['data-sku-data'], function(index, skuData){
				var size = productOption[skuData.SIZE];
				var isAva = (skuData.quantity > 0 ? 'y' : 'n');
				sizeAvailabilityList.push( size + ':' + isAva );
			})

			// 3. input:hidden 에 임시 저장
			$('input[name="size-run-availability"]').val(String(sizeAvailabilityList).split(',').join('|'));
			/* Adobe 태깅 용 재고 String 생성 부 (e) 2020-04-02 15:11:41 pck */

			//재고확인 후 사이즈 선택버튼 활성화 타이밍 debug추가 2020-04-02 14:32:42 pck
			//console.log( String(sizeAvailabilityList).split(',').join('|') );


			//first option select trigger
			$optionWrap.find('.input-radio.checked > label').each(function(i){
				$(this).trigger('click');
			});

			//입고알림 문자받기 show or hide
			if(document.getElementById("set-restock-alarm") && allSkuData){
				for(var index = 0; allSkuData.length > index; index++){
					if(0==allSkuData[index].quantity){
						//enable 입고알림문자받기
						$('#set-restock-alarm').show();
						break;
					}
				}
			}
		}


		var __self,
			$this,
			$submitBtn,
			$titleWrap,
			$salePrice,
			$retailPrice,
			$upcCode,
			$optionWrap,
			optionData = [],
			allSkuData = {},
			bundleDefaultSkuData = {},
			skuData = {},
			option = {},
			optionDom = {},
			qtyComponent = null,
			currentOptList = {},
			currentSku = [],
			currentSkuArray = [],
			productId = 0,
			submit = false,
			firstOptName = 'COLOR',
			productOptionType = 'step',
			selectOptAppendType = false,
			secondIS = false,
			objOptType,
			isFireEvent = true,
			componentType,
			endPoint,
			restrictData;

		var setting = {
			selector:'[data-component-product-option]',
			optionWrap:'.option-wrap',
			submitBtn:'[data-cartbtn]',
			radio:'[data-component-radio]',
			select:'[data-component-select]',
			quantity:'[data-component-quantity]',
			titlewrap:'.title-wrap',
			salePrice:'.price',
			retailPrice:'.price-sale',
			upcCode:'.upc-code'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				__self = _self;

				$this = $(setting.selector);
				$optionWrap = $this.find(setting.optionWrap);
				$submitBtn = $this.find(setting.submitBtn);
				$titleWrap = $this.find(setting.titlewrap);
				$salePrice = $this.find(setting.salePrice);
				$retailPrice = $this.find(setting.retailPrice);
				$upcCode = $this.find(setting.upcCode);
				endPoint = Core.getComponents('component_endpoint');

				objOptType = arguments[0];
				firstOptName = objOptType['data-component-product-option'].first;
				productOptionType = objOptType['data-component-product-option'].productType;
				selectOptAppendType = objOptType['data-component-product-option'].selectOptAppendType;
				componentType = objOptType['data-component-product-option'].componentType || 'component_radio';

				productId = $this.attr('data-product-id') || false;
				optionData = objOptType['data-product-options'];
				restrictData = (objOptType['data-product-restrict']) ? Core.Utils.strToJson(objOptType['data-product-restrict'].skuMatcheResults.replace(/=/g,':'), true) : {};

				/* CUSTOM _customproduct.js 기능 이동 */
				//var customYN = Core.getModule('module_custom_product').isProductOptionCustomProduct();

				var obj = {
					'productId':productId
					//'useMaxQuantity':true //구매제한수량 사용여부
					//'fulfillmentType':'PHYSICAL_PICKUP' | PHYSICAL_SHIP
					//,'customYN' : customYN --> productSkuInventory의 product 정보에서 판단
				}

				if($('[data-thedrawend]').length === 1){
					var selectSize = $this.find('#selectSize');
					selectSize.on('change', '', function(e){
						var selected = selectSize.find("option:selected").data('skuid');
						$this.find('.hidden-option').val(selected);
						$this.find('.opt-tit>.msg').removeClass('msg-on').text('');
					});
				}else{
					var $btnGroup = $this.find('[data-add-item]');
					if(productId){
						Core.Utils.ajax(Core.Utils.contextPath + '/productSkuInventory', 'GET', obj, function(data){
							var responseData = Core.Utils.strToJson(data.responseText);
							allSkuData = responseData.skuPricing || {};
							objOptType['data-sku-data'] = allSkuData;

							for(var key in restrictData){
								if(restrictData[key] === 'LOGIN_REQUIRED'){
									console.log(key, restrictData[key]);
									//$optionWrap.find('.msg').eq(0).text('로그인 후 구매가능한 상품이 있습니다.');
								}
								for(var i=0; i<objOptType['data-sku-data'].length; i++){
									if(objOptType['data-sku-data'][i].skuId == key){
										objOptType['data-sku-data'][i]['restrictState'] = restrictData[key];
										break;
									}
								}
							}
							var $btnWishlist = $this.find('.wish-btn');
							//변경되는 구조에서는 삭제되어야하는 구문 vue를 이용한 템플릿 렌더링으로 접근해야함,

							var isSoldout = $('#isSoldout').val();

							// 프로세서로 불러온 soldout 값과 여기서 불러온 usable 값이 같으면 싱크가 맞지 않는 것으로 화면을 한번 갱신해준다.
							// 한번 접근 후에는 모든 사용자에게 반영 되기 때문에 해당 구문을 타는건 극소수의 사용자 일 것
							/*
							if(String(isSoldout) == String(responseData.usable)){
								Core.Loading.show();
								location.reload();
								return;
							}
							*/
							if (!responseData.usable && $btnGroup.length > 0){
								//var template = '<div class="product-soldout"><div class="product-comming"><span class="comming">상품이 품절되었습니다.</span></div></div>';
								//$btnGroup.html(template);
								//head  페이스북  OpenGraph 메타테그 (품절 여부) 값 설정.
								$("#f_availability").attr('content','재고 없음');
							}else{
								$btnWishlist.removeClass('uk-hidden');
							}
							$btnGroup.removeClass('uk-hidden');
							promiseInit(_self);
						}, false, true);
					}else{
						$btnGroup.removeClass('uk-hidden');
					}
				}

				return this;
			},
			setTrigger:function(optionName, value, valueId){
				isFireEvent = false;
				optionDom[optionName].trigger(value, valueId);
			},
			getValidateChk:function(msg){
				var arrIsValidateChk = [];
				var isValidate = false;
				for(var key in optionDom){
					isValidate = optionDom[key].getValidateChk();
					arrIsValidateChk.push(isValidate);
					if(isValidate){
						optionDom[key].getThis().prev().find('.msg').removeClass('msg-on').text('');
						optionDom[key].getThis().prev().parent().parent().find('.size-grid-type').removeClass('size_opt_check');
						optionDom[key].getThis().prev().parent().find('.btn-option').removeClass('caution-txt-color');
						optionDom[key].getThis().prev().parent().find('.product-option_radio').removeClass('option_check');
						//20180412추가 (사이즈선택 미선택 오류 메세지)
					}else{
						optionDom[key].getThis().prev().find('.msg').addClass('msg-on').text(msg);
						optionDom[key].getThis().prev().parent().parent().find('.size-grid-type').addClass('size_opt_check');
						optionDom[key].getThis().prev().parent().find('.btn-option').addClass('caution-txt-color');
						optionDom[key].getThis().prev().parent().find('.product-option_radio').addClass('option_check');
					}
				}

				return (arrIsValidateChk.indexOf(false) === -1) ? true : false;
			},
			getProductId:function(){
				return productId;
			},
			getDefaultSkuData:function(){
				// 단품일경우 (옵션이 없는경우) defaultSku 가 담겨서 넘어온다.
				// bundleDefaultSkuData 의 length 가 > 1 일때 번들 상품으로 bundleDefaultSkuData 넘김
				return (bundleDefaultSkuData.length > 0) ? bundleDefaultSkuData : allSkuData;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_product_option'] = {
		constructor:ProductOptionSelected,
		attrName:['data-component-product-option', 'data-product-options', 'data-product-restrict']
	}
})(Core);

(function (Core) {
	var ProductQuickView = function () {
		'use strict';
		var _self, $this, args;
		var setting = {
			url: Core.Utils.contextPath + '/processor/execute/product'
		};

		function open(url, option){
			if (!_.isEmpty(args.showActionButton)) {
				option.showActionButton = args.showActionButton;
			}

			// 상품 팝업 호출
			Core.ui.modal.ajax(url,{
				param: option,
				selector: '#quickview-wrap',
				fullscreen: false,
				show : function(){
					$(this).addClass('quickview');
					if (_.isEqual(args.actionType, 'confirm')) {
						// 장바구니 add 되었을 때 미니카트가 나오지 않고 confirm 창 오픈
						$('[data-btn-add-cart]').attr('action-type', 'confirm');
						//snkrs miniPDP의 경우 인터렉션 추가
						if( UI_SNKRS !== 'undefined' && document.body.classList.contains('snkrs') ){
							var targetEl = this.querySelector('[data-component-gallery]');
							if(targetEl !== null){
								UI_SNKRS().PDP.initGallerySwiper(targetEl);
							}
							UI_SNKRS().MINI_PDP.init(this); //스티키 외 miniPDP용 인터렉션 부 init 호출

							//SNKRS Collection Mini PDP opened event tagging
							var data = this.querySelector('#ctm_teg');
							if(data !== null){

								var isSoldOut = (this.querySelector('.product-soldout') !== null) ? true : false ;

								var param = {}; //초기화
								param.product_url = data.dataset.url;
								param.product = {
									product_category : (data.dataset.category !== undefined) ? data.dataset.category : '',
									product_name : (data.dataset.name !== undefined) ? data.dataset.name : '',
									product_id : (data.dataset.id !== undefined) ? data.dataset.id : '',
									product_quantity : (data.dataset.quantity !== undefined) ? data.dataset.quantity : '',
									product_unit_price : (data.dataset.unit_price !== undefined) ? data.dataset.unit_price : '',
									product_discount_price : (data.dataset.discount_price !== undefined) ? data.dataset.discount_price : '',
									product_inventory_status : (isSoldOut ? 'out of stock' : 'in stock'),
									avg_product_rating : (data.dataset.product_rating !== undefined) ? data.dataset.product_rating : '',
									price_status : (data.dataset.price_status !== undefined) ? data.dataset.price_status : '',
									number_of_product_review : (data.dataset.product_review !== undefined) ? data.dataset.product_review : '',
									product_finding_method : (data.dataset.finding_method !== undefined) ? data.dataset.finding_method : '',
								}

								endPoint.call('snkrsMiniPDPOpened', param);
							}

						}
					}
				}
			})

			/*  
			var modal = UIkit.modal('#common-modal');
			Core.Utils.ajax(url, 'GET', option, function (data) {
				var $modal = $('#common-modal');
				var domObject = $(data.responseText).find('#quickview-wrap');
				if (domObject.length < 1){
					UIkit.modal.alert('상품 정보를 불러올 수 없습니다.');
					return;
				}
				$modal.find('.contents').empty().append(domObject[0].outerHTML);
				$modal.addClass('quickview');
				Core.moduleEventInjection(domObject[0].outerHTML);

				if (_.isEqual(args.actionType,'confirm')){
					$('[data-btn-add-cart]').attr('action-type', 'confirm');
				}
				modal.show();
			}, true, false, 1500)
			*/
		}
		function openByProductId(productId) {
			var obj = {
				'id': productId,
				'mode': 'template',
				'accepted': true,
				'quickview': true,
				'templatePath': '/catalog/product',
			}
			open(setting.url, obj);
		}
		function openByProductUrl(url) {
			var obj = {
				'accepted': true,
				'quickview': true,
			}
			open(url, obj);
		}
		var Closure = function () { }
		Closure.prototype = {
			setting: function () {
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init: function () {
				_self = this;
				args = arguments[0];
				$this = $(setting.selector);

				if (!_.isEmpty(args.productId)) {
					$this.on('click', function (){
						openByProductId(args.productId);
					});
					return this;
				} else if (!_.isEmpty(args.productUrl)) {
					$this.on('click', function () {
						openByProductUrl(args.productUrl);
					});
					return this;
				}
				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_product_quick_view'] = {
		constructor: ProductQuickView,
		reInit: true,
		attrName: 'data-component-product-quick-view'
	}
})(Core);

(function(Core){
	var Quantity = function(){
		'use strict';

		var $this, $input, $plusBtn, $minusBtn, $msg, currentQty = 1, maxLen = 1, args;
		var pattern = /[^0-9]/g;
		var setting = {
			selector:'[data-component-quantity]',
			input:'.label',
			plusBtn:'.plus',
			minusBtn:'.minus',
			attrName:'data-component-quantity',
			msg:'.msg'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				args = arguments[0];

				$this = $(setting.selector);
				$input = $this.find(setting.input);
				$plusBtn = $this.find(setting.plusBtn);
				$minusBtn =  $this.find(setting.minusBtn);
				$msg = $this.find(setting.msg);
				maxLen = (args.maxQuantity != 'null') ? args.maxQuantity : 100; // 최대수량 100
				currentQty = $input.val();


				$plusBtn.on('click', function(e){
					e.preventDefault();

					currentQty++;

					$input.val(currentQty);
					$(this).closest('.btn-qty').find('.minus').addClass('currentQty');
					$input.trigger('focusout');
				});

				$minusBtn.on('click', function(e){
					e.preventDefault();

					currentQty--;

					if(currentQty <= 1) {
						currentQty = 1;
						$(this).removeClass('currentQty');
					}
					$input.val(currentQty);
					$input.trigger('focusout');
				});

				$input.on({
					'keyup':function(e){
						var val = $input.val();
						if(pattern.test(val)){
							$input.val(val.replace(pattern, ''));
						}
					},
					'focusout':function(){
						currentQty = $(this).val();
						if(currentQty <= 1) currentQty = 1;

						if(parseInt(currentQty) > parseInt(maxLen)){
							$this.addClass('opt-msg-guide');
							$msg.text(maxLen + args.msg);
							currentQty = maxLen;
						}else{
							$this.removeClass('opt-msg-guide');
							$msg.text('');
						}

						$(this).val(currentQty);
						_self.fireEvent('change', this, [currentQty]);
					}
				});

				return this;
			},
			getQuantity:function(){
				return currentQty;
			},
			setQuantity:function(quantity){
				$input.val(quantity);
				currentQty = quantity;
			},
			setMaxQuantity:function(quantity){
				//console.log(quantity);
				if(args.maxQuantity == 'null' && quantity != null){
					maxLen = quantity;
				}else if(args.maxQuantity != 'null'){
					if(quantity != null){
						if(quantity < args.maxQuantity){
							maxLen = quantity;
						}else{
							maxLen = args.maxQuantity;
						}
					}else{
						maxLen = args.maxQuantity;
					}
				}else if(quantity == null){
					maxLen = 100;
				}

				if(quantity == 0){
					$msg.text(args.quantityStateMsg);
				}else{
					$msg.text('');
				}
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_quantity'] = {
		constructor:Quantity,
		attrName:'data-component-quantity'
	}
})(Core);

(function(Core){
	var Phone = function(){
		'use strict';

		var setting = {
			selector:'[data-component-phone]'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();

				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var args = arguments[0] || {};
				var $this = $(setting.selector);
				$this.text(args.phonenum.replace(/(^[0-9]{2,3})-?([0-9]{3,4})-?([0-9]{4})$/g, '$1-$2-$3'));
				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_phone'] = {
		constructor:Phone,
		reInit:true,
		attrName:'data-component-phone'
	}
})(Core);

(function(Core){
	var SearchField = function(){
		'use strict';

		var $this, $btn, $input, $resultWrap, opt, searchTxt = '', searchTxt_1='', _self, validateIS = false, isAction = true;
		var setting = {
			selector:'[data-component-searchfield]',
			resultWrap:'.result-wrap',
			btn:'.btn_search',
			input:'.input-textfield',
			attrName:'data-component-searchfield',
			resultTemplate:''
		}
		var rotationWords = new Array(), rollingTimer, rotationIndex = 0, setFirstWord, setStartRolling;

		var resultFunc = function(data){
			var json = (typeof data === Object) ? data : Core.Utils.strToJson(data.responseText || data, true);
			if(json.results.length > 0){
				addTemplate(json.results);
			}else{
				if(opt.complete !== 'auto'){
					UIkit.modal.alert('검색결과가 없습니다.', { labels: { 'Ok': '확인'}});
				}
			}

			isAction = true;
		}

		var addTemplate = function(data){
			if(setting.resultTemplate === ''){
				UIkit.notify('template is not defined', {timeout:3000,pos:'top-center',status:'warning'});
				return;
			}

			var template = Handlebars.compile($(setting.resultTemplate).html())(data);
			$resultWrap.empty().append(template);
		}

		var action = function(){
			endRollingSearchWord();

			//스페이스만 입력후 검색 할 경우, 최근 검색어에 표기되어 오류발생을
			searchTxt_1 = searchTxt.replace(/ /gi,"");

			if(searchTxt_1 !== ''){
				_self.fireEvent('beforeSubmit', this, [searchTxt]);

				if(opt.hasOwnProperty('api')){
					Core.Utils.ajax(opt.api, 'GET', {'q':searchTxt,'v':'3.0.0-com.nike'}, resultFunc);
				}else if(opt.hasOwnProperty('submit')){
					_self.fireEvent('submit', this, [$(opt.submit), searchTxt]);
					$(opt.submit).submit();
				}else if(opt.hasOwnProperty('onEvent')){
					_self.fireEvent('searchKeyword', this, [$(opt.onEvent), searchTxt]);
					isAction = true;
				}
			}else{
				//UIkit.modal.alert(opt.errMsg);
				_self.fireEvent('searchEmpty', this, [$(opt.onEvent)]);
				$input.setErrorLabel(opt.errMsg);
			}
		}

		 /* 검색어 롤링 */
		//인기검색어 롤링
		function rollingSearchWord(){
			if(rotationIndex == rotationWords.length){
				rotationIndex = 0;
			}
			var word = rotationWords[rotationIndex++];
			$('#search').val(word);
			searchTxt = word;
			// console.log('%d. %s', rotationIndex, word);
		}
		//5초마다 검색어 롤링 하도록 타이머를 걸어 준다.
		function startRollingSearchWordTimer(){
			// console.log('start rolling timer');
			if(rotationWords.length > 0){
				endRollingSearchWord();
				rollingTimer = setInterval(rollingSearchWord, 30000);
			}
		}
		//인기검색어 롤링 시작
		function startRollingSearchWord(){
			// console.log('start rolling word');
			//바로 표시 하는 경우, 검색어 입력 후 검색 시도시, 검색어가 사라지고 인기검색어로 검색이됨
			//2초 후에 첫 검색어가 표시되도록 한다.
			setFirstWord = setTimeout(rollingSearchWord, 2000);
			setStartRolling = setTimeout(startRollingSearchWordTimer, 5000);
		}
		//인기검색어 롤링 종료
        function endRollingSearchWord(){
			// console.log('end rolling');
			clearInterval(rollingTimer);
			rollingTimer = undefined;

			clearTimeout(setFirstWord);
			clearTimeout(setStartRolling);
		}

		//return prototype
		var Closure = function(){};
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				_self = this;
				opt = arguments[0];
				$this = $(setting.selector);
				$resultWrap = $this.find(setting.resultWrap);
				$btn = $this.find(setting.btn);

				// 필드값 판별 여부
				if (!$this.find('input').val() == '') {
					validateIS = true
				}

				$input = Core.getComponents('component_textfield', {
					context:$this,
					selector:'.input-textfield'
				}, function () {

					this.addEvent('focusin', function(e){
						// console.log('focusin');
						//etc-search-wrap active
						$resultWrap.addClass('active');
						//포커스 상태에서 롤링 멈추고, 입력된 내용을 비운다.
						endRollingSearchWord();
						searchTxt = "";
						$('#search').val(searchTxt);
					});

					this.addEvent('focusout', function(e){
						// console.log('out');
						searchTxt = $(this).val();
						//검색어 롤링 재시작
						startRollingSearchWord();

						$("#jq_icon-delete_thin").removeClass('icon-delete_thin');
						//$("input.jq_search").val('');
					});

					// 검색 x 아이콘
	 				this.addEvent('keyup', function(e){
	             		if( $(this).length>0){
							validateIS = false;
	                		$("#jq_icon-delete_thin").addClass('icon-delete_thin');
	 					}
	 				});

					this.addEvent('enter', function(e){
						searchTxt 	= $(this).val();
						searchTxt_1 = searchTxt.replace(/ /gi,"");

						if(isAction && searchTxt_1 !== ''){
							isAction = false;
							action();

							//EMB
							var widthMatch = matchMedia("all and (max-width: 767px)");
							if (Core.Utils.mobileChk || widthMatch.matches) {
								var mobileChk = 2;
							} else {
								var mobileChk = 1;
							}
							cre('send','Search',{search_string : searchTxt, event_number : mobileChk});
						}

					});
					if(opt.hasOwnProperty('autoComplete')){
						this.addEvent('keyup', function(e){
							// 비동기 호출 resultFunc callback 함수 넘김
							Core.Utils.ajax(opt.autoComplete, 'POST', {'q':$(this).val()}, resultFunc);
						});
					}
				});

				$btn.on('click', function(e){
					e.preventDefault();
					action();

					//EMB
					if(!searchTxt == ''){
						cre('send','Search',{search_string:searchTxt, event_number : 1});
					}
				});

				// result list click event
				$resultWrap.on('click', '.list a', function(e){
					e.preventDefault();

					validateIS = true;
					//$input.setValue($(this).text());
					_self.fireEvent('resultSelect', _self, [this]);

					/*if(!opt.hasOwnProperty('api')){
						$btn.trigger('click');
					}*/

					$resultWrap.removeClass('active');
				});

				//검색어 롤링 시작
				startRollingSearchWord();
				return this;
			},
			getValidateChk:function(){
				if(opt.required === 'false' || setting.isModify === 'true'){
					return true;
				}else if(opt.required === 'true'){
					return validateIS;
				}
			},
			setErrorLabel:function(message){
				$input.setErrorLabel(message||opt.errMsg);
			},
			getInputComponent:function(){
				return $input;
			},
			getResultWrap:function(){
				return $resultWrap;
			},
			setResultAppend:function(appendContainer, template, data){
				if(appendContainer === 'this'){
					$resultWrap.append(Handlebars.compile($(template).html())(data));
				}else{
					$(appendContainer).append(Handlebars.compile($(template).html())(data));
				}

			},
			setResultPrepend:function(appendContainer, template, data){
				if(appendContainer === 'this'){
					$resultWrap.prepend(Handlebars.compile($(template).html())(data));
				}else{
					$(appendContainer).prepend(Handlebars.compile($(template).html())(data));
				}

			},
      externalAction:function(){
				//매장 찾기 체크 박스 검색 이벤트
				//action 함수에서   searchTxt 값이  null 일경우 오류 발생.(	searchTxt_1 = searchTxt.replace(/ /gi,"");)
				searchTxt = "";
				action();
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_searchfield'] = {
		constructor:SearchField,
		attrName:'data-component-searchfield'
	};
})(Core);

(function(Core){
	var InputSelectBox = function(){
		'use strict';

		var $this, $select, $selectHead, $selectBody, $selectHeadTxt, $selectOption, opt, eventID, isValidate = false, currentSelectedIndex, isSelectedReset, endPoint, name;
		var selectDisabled = false;
		var setting = {
			selector:'[data-component-select]',
			select:'select',
			attrName:'data-component-select',
			template:"<a class='select-head'><span class='currentOpt'>{{currentLabel}}</span></a><ul class='select-body'>{{#each option}}<li class='list {{this.checked}} {{this.disabled}}'><a href='{{this.value}}' data-value='{{this.value}}'><span class='label'>{{this.label}}</span></a></li>{{/each}}</ul>"
		}

		var selectOpt = {
			'selectIcon':'',
			'currentLabel':'',
			'currentValue':'',
			'option':[]
		}

		var updateSelect = function($target){

			$($target).parent().addClass('checked').siblings().removeClass('checked');
			$($target).removeClass('checked');
			$selectHeadTxt.text($($target).find('.label').text());

			//$('select[name='+name+']').val($(this).attr('data-value'));
			//$('select[name='+name+']').trigger('change');

			$select.val($($target).attr('data-value'));
		}

		var rtnOption = function(key, data){
			data.forEach(function(data, i){
				if(data.inventoryType !== 'UNAVAILABLE'){
					//restrict check ( data.restrictState === 'PASSED' || data.restrictState === 'RESTRICTED' || data.restrictState === 'LOGIN_REQUIRED' )
					if(Object.keys(data).indexOf('restrictState') < 0 || data.restrictState === 'PASSED'){
						if(data.inventoryType === 'ALWAYS_AVAILABLE' || null){
							enableItem($select, key, data, 'PASSED');
						}else if(data.inventoryType === 'CHECK_QUANTITY'){
							if(data.quantity > 0 || data.quantity == null){
								enableItem($select, key, data, 'PASSED');
							}
						}
					}else{
						if(data.restrictState === 'LOGIN_REQUIRED'){
							enableItem($select, key, data, 'LOGIN_REQUIRED');
						}
					}
				}
			});
		}

		var enableItem = function(container, key, data, state){
			$select.find('option').each(function(j){
				if(j === 0 || $(this).val() == data[key]){
					if(state === 'PASSED'){
						$(this).removeAttr('disabled');
						if($selectOption) $selectOption.eq(j).parent().removeClass('disabled');
						if(j > 0) return false;
					}else if(state === 'LOGIN_REQUIRED'){
						//$(this).empty().addClass('icon_lock');
						if(j > 0) {
							$(this).closest('.select-box').find('.select-body > .list').eq(j).find('.label').empty().addClass('ns-ic-login2 member-lock');
						}
					}
				}
			});
		}

		var addSelect = function(){
			$selectHead = $this.find('.select-head');
			$selectBody = $this.find('.select-body');
			$selectHeadTxt = $selectHead.find('.currentOpt');
			$selectOption = $selectBody.find('a');

			$selectHead.on('click', function(e){
				e.preventDefault();
				if(!selectDisabled){
					if($this.hasClass('checked')){
						$this.removeClass('checked');
					}else{
						$this.addClass('checked');
					}
				}
			});

			$selectOption.on('click', function(e){
				e.preventDefault();

				//var name = $this.parent().parent().parent().find('select').attr('name');

				// && !$this.parent().hasClass('checked')
				if(!$(this).parent().hasClass('disabled') && !$(this).parent().hasClass('checked')){
					updateSelect( $(this) );
					$select.trigger('change');
					$selectHead.trigger('click');
				}
			});

			$this.on('mouseleave', function(e){
				$this.removeClass('checked');
			});
		}

		var appendOptionList = function(data){
			var template = Handlebars.compile(setting.template);
			var bindingHtml = template(data);
			$this.prepend(bindingHtml);
			addSelect();
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;

				$this = $(setting.selector);
				$select = $this.find(setting.select);
				endPoint = Core.getComponents('component_endpoint');
				opt = (opt) ? opt : arguments[0]||{};
				name = $select.attr('name');
				
				var widthMatch = matchMedia("(min-width: 961px) and (max-width: 1024px)");
				
				if (!Core.Utils.mobileChk || widthMatch.matches) {

					// 이전에 생성되어있던 dom 제거
					if( $($this).find('.select-head').length > 0){
						$($this).find('.select-head').remove();
						$($this).find('.select-body').remove();

						selectOpt = {
							'selectIcon':'',
							'currentLabel':'',
							'currentValue':'',
							'option':[]
						}
					}


					$this.addClass('pc');
					if( selectOpt.selectIcon ){
						selectOpt.selectIcon = opt.icon;
					}
					$select.find('option').each(function(i){
						var $this = $(this);
						if($(this).is(':selected')){
							selectOpt.currentLabel = this.text;
							selectOpt.currentValue = this.value;
						}

						selectOpt.option.push({
							'label':this.text,
							'value':this.value,
							'disabled':$(this).is(':disabled') ? 'disabled':'',
							'checked':$(this).filter(':selected').length > 0 ? 'checked':''
						});
					});

					appendOptionList(selectOpt);

					//selectbox 나오는 위치
					if(opt.position != null){

						switch(opt.position){
							case 'top' :
								$selectBody.css('top',-$selectBody.height());
								break;
							case 'bottom' :
								break;
						}
					}
				}

				//select init
				currentSelectedIndex = $select.find('option:selected').index();
				if(currentSelectedIndex > 0 && opt.changeType === 'step'){
					setTimeout(function(){
						$select.trigger('change');
					});
				}

				$select.off('update').on('update', function(e){
					e.preventDefault();
					if(!Core.Utils.mobileChk){
						var index = $select.find(":selected").index();
						updateSelect( $(this).closest(".select-box").find(".select-body li").eq(index).find("a") );
					}
				});

				$select.off('change').on('change', function(e){
					var that = this;
					var $selected = $(this).find('option:selected');
					var val = $selected.val();
					var index = $selected.index();

					if( val === '' || val === '선택해주세요' ){
						isValidate = false;
						return;
					}else{
						isValidate = true;
					}

					endPoint.call('changeSelect', { name : name, value : val });

					switch(opt.changeType){
						case 'normal' :
							_self.fireEvent('change', this, [val, $selected, index]);
							$(this).parsley().validate();
							break;
						case 'submit' :
							var url = "";
							if( $(this).val() === "" || $(this).val() === "default"){
								url = Core.Utils.url.removeParamFromURL( Core.Utils.url.getCurrentUrl(), $(this).attr('name') );
							}else{
								url = Core.Utils.url.updateParamFromURL( Core.Utils.url.getCurrentUrl(), $(this).attr('name'), $(this).val() );
							}

							window.location.assign( url );
							break;
						case 'step' :
							_self.fireEvent('change', that, [$(that).find('option:selected').attr('data-value'), $(that).find('option:selected').val(), $(that).attr('data-id'), $(that).find('option:selected').attr('data-friendly-name')]);
							break;

						case 'link' :
							var url = val;
							if( url != null && $.trim(url) != ''){
								window.location.assign( url );
							}
							break;
					}
				});

				return this;
			},
			receiveToData:function(option, skuData){
				isValidate = false;
				rtnOption(option.type, skuData);
			},
			reInit:function(){
				$select.val('');
				if(!Core.Utils.mobileChk){
					$selectHeadTxt.text($select.find('option').eq(0).val());
					$selectBody.scrollTop(0).find('.list').removeClass('checked').eq(0).addClass('checked');
				}
			},
			disabled:function(){
				//초기화
				$select.find('option').attr('disabled', 'disabled');
				if(currentSelectedIndex === 0 || isSelectedReset){
					$select.find('option').eq(0).prop('selected', true);
					if(!Core.Utils.mobileChk){
						$selectHeadTxt.text($select.find('option:selected').val());
						$selectBody.scrollTop(0).find('.list').addClass('disabled').removeClass('checked').eq(0).removeClass('disabled').addClass('checked');
					}
				}else{
					isSelectedReset = true;
				}
			},
			trigger:function(value, valueId){
				//console.log($this);
				//console.log(value, valueId);
				$select.val(valueId).attr('selected', 'selected');
				if($selectHead) $selectHead.find('.currentOpt').text(value);
				if($selectBody) $selectBody.children().eq($select.find('option:selected').index()).addClass('checked').siblings().removeClass('checked');
				$select.trigger('change');
			},
			destroy:function(){
				$selectHead.remove();
				$selectBody.remove();
			},
			getValidateChk:function(){
				if(opt.required === 'true'){
					if(!isValidate && opt.errMsg) UIkit.notify(opt.errMsg, {timeout:3000,pos:'top-center',status:'danger'});
					return isValidate;
				}else{
					return true;
				}
			},
			getThis:function(){
				return $this;
			},
			replaceSelectBox:function(selectbox){
				$this.find(setting.select).remove();
				$this.append(selectbox);
				this.init.call(this, opt);
			},
			rePaintingSelect:function(){
				this.init();
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_select'] = {
		constructor:InputSelectBox,
		reInit:true,
		attrName:'data-component-select'
	};
	
	// js 로드되면 셀렉트박스 노출
	window.onload = function(){
		var selectboxCheck = document.querySelectorAll('.select-box');
		if (selectboxCheck.length > 0){
			for (var i=0; i<selectboxCheck.length;i++) {
				selectboxCheck[i].classList.add('rendered');
			}
		}
	}
})(Core);

(function (Core) {
	var Swipe = function () {
		'use strict';
		var _self, $this, args, opt = {}, swiper, mcShowType,
			mcSlidesPerView, mcSpaceBetween,
			tabletSlidesPerView, tabletSpaceBetween,
			pcSlidesPerView, pcSpaceBetween;

		var setting = {
			selector: '[data-component-swipe]',
			attrName: 'data-component-swipe'
		}

		var Closure = function () { }
		Closure.prototype = {
			setting: function () {
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init: function () {
				_self = this;
				args = arguments[0] || {};

				// MOBILE
				mcSlidesPerView = args.mcSlidesPerView || 2;
				mcSpaceBetween = args.mcSpaceBetween || 8;

				// TABLET
				tabletSlidesPerView = args.tabletSlidesPerView || 2;
				tabletSpaceBetween = args.tabletSpaceBetween || 8;

				// PC
				pcSlidesPerView = args.pcSlidesPerView || 4;
				pcSpaceBetween = args.pcSpaceBetween || 16;

				$this = $(setting.selector);

				opt = {
					observer : true,
					observeParents : true,
					autoHeight : true,
					slidesPerView : pcSlidesPerView,
					spaceBetween : pcSpaceBetween,
					slidesPerGroup : pcSlidesPerView,
					slidesOffsetBefore : 0,
					slidesOffsetAfter : 0,
					freeMode : false,
					freeModeSticky : false,
					pagination : {
						el: '.swiper-pagination',
						clickable: true,
					},
					scrollbar : {
						el: '.swiper-scrollbar',
						hide: true,
						snapOnRelease: true,
					},
					breakpoints : {
						// TABLET & MOBILE <= 1024px
						1024: {
							slidesPerView : tabletSlidesPerView,
							spaceBetween : tabletSpaceBetween,
							slidesPerGroup : tabletSlidesPerView,
							slidesOffsetBefore : 0,
							slidesOffsetAfter : 0,
							freeMode : false,
							freeModeSticky : false,
						},
						// MOBILE <= 768px
						768: {
							slidesPerView : mcSlidesPerView,
							spaceBetween : mcSpaceBetween,
							slidesPerGroup : mcSlidesPerView,
							slidesOffsetBefore : 0,
							slidesOffsetAfter : 0,
							freeMode : true,
							freeModeSticky : true,
						}
					},
				};

				swiper = new Swiper($this, opt);
				return this;
			},
			getSwiper: function (){
				return swiper;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_swipe'] = {
		constructor: Swipe,
		reInit: true,
		attrName: 'data-component-swipe'
	}
})(Core);

(function(Core){
	var Tab = function(){
		'use strict';

		var $this, $tabs, args;
		var setting = {
			selector:'[data-component-tabs]',
			tab:'a',
			attrName:'data-component-tabs',
			activeClass:'active'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();

				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				args = arguments[0] || {};

				$this = $(setting.selector);
				$tabs = $this.find(setting.tab);

				$tabs.click(function(e){
					e.preventDefault();

					if(!$(this).hasClass(setting.activeClass)){
						$(this).addClass(setting.activeClass).siblings().removeClass(setting.activeClass);
						_self.fireEvent('tabClick', this, [$(this).index()]);
					}else if($(this).hasClass(setting.activeClass) && args.unlock === 'true'){
						$(this).removeClass(setting.activeClass);
						_self.fireEvent('tabClick', this, [$(this).index()]);
					}
				});

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_tabs'] = {
		constructor:Tab,
		reInit:true,
		attrName:'data-component-tabs'
	}
})(Core);

(function(Core){
	var ThumbNail = function(){
		var setting = {
			selector:'[data-component-thumbnail]',
			container:'.thumb-wrap',
			scrollWrap:'.scroll-Wrap',
			list:'.thumb-list',
			thumbTemplate:'{{#each this}}<li class="thumb-list"><a href="{{thumbUrl}}?browse"><img src="{{thumbUrl}}?thumbnail"></a></li>{{/each}}'
		}

		var $this, $container, $list, currentIndex=0, arrThumbList=[], iScroll, args;
		var Closure = function(){}
		Closure.prototype.setting = function(){
			var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
		}
		Closure.prototype.init = function(){
			var _self = this;

			$this = $(setting.selector);
			$container = $this.find(setting.container);
			$list = $this.find(setting.list);
			args = arguments[0];

			var arrList = [];

			$container.find(setting.list).each(function(i){
				var data = Core.Utils.strToJson($(this).attr('data-thumb'), true);
				var imgUrl = $(this).find('img').attr('src').replace(/\?[a-z]+/g, '');
				var pushIS = true;

				data.thumbUrl = imgUrl;

				/* 중복 이미지 처리 */
				for(var i=0; i < arrList.length; i++){
					if(arrList[i].thumbSort === data.thumbSort && arrList[i].thumbUrl === data.thumbUrl){
						pushIS = false;
						console.log('same image');
						return;
					}
				}

				if(pushIS){
					arrList.push(data);
					arrThumbList.push(data);
				}
			});

			$container.on('click', 'li', function(e){
				e.preventDefault();

				$(this).addClass('active').siblings().removeClass('active');
				_self.fireEvent('changeIndex', this, [$(this).index()]);
			});

			this.setThumb(args.sort);

			return this;
		}
		Closure.prototype.getContainer = function(){
			return $this;
		}
		Closure.prototype.setTriggerThumb = function(index){
			var curIndex = index, totalNum = $container.find('li').length;

			if(curIndex < 0){
				curIndex = totalNum - 1;
			}else if(curIndex > totalNum - 1){
				curIndex = 0;
			}

			$container.find('li').eq(curIndex).trigger('click');
		}
		Closure.prototype.setThumb = function(sort){
			var _self = this;
			var appendTxt = '';
			var thumbWidth = (args.thumbType === 'bottom') ? $this.find('.thumb-list').eq(0).outerWidth() : $this.find('.thumb-list').eq(0).outerHeight();
			var count = 0;
			var sortType = sort || args.sort;
			var arrThumbData = arrThumbList.filter(function(item, index, array){
				if(item.thumbSort === sortType || item.thumbSort === 'null'){
					console.log(item);
					return item;
				}
			});

			var thumbTemplate = Handlebars.compile(setting.thumbTemplate)(arrThumbData);
			//var mobileTemplate = Handlebars.compile($("#product-gallery-template-mobile").html())(arrThumbData)
			var totalWidth = count * (thumbWidth + parseInt(args.between));
			if(args.thumbType === 'bottom') $container.empty().append(appendTxt).css({'width':totalWidth}).addClass('show');
			else if(args.thumbType === 'left'){
				if(!Core.Utils.mobileChk){
					$container.css({'height':totalWidth}).addClass('show');
				}
				$container.empty().append(thumbTemplate);
			}

			$container.find('.thumb-list').eq(0).addClass('active');
			$this.parent().append(mobileTemplate);

			_self.fireEvent('setThumbComplete', this);
			$container.find('a').eq(0).trigger('click');

			if(!Core.Utils.mobileChk){
				iScroll = new IScroll($this[0], {
					scrollX:(args.thumbType === 'bottom') ? true : false,
					scrollY:(args.thumbType === 'bottom') ? false : true
				});
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_thumbnail'] = {
		constructor:ThumbNail,
		attrName:'data-component-thumbnail'
	};
})(Core);

(function(Core){
	var Map = function(){
		'use strict';

		var $this, $btn, storeList = null, map = null, markers = [], infoWindows = [], currentStoreIndex = 0;
		var setting = {
			selector:'[data-component-map]',
			target:'map',
			storeList:null
		}

		var makeMarkerIcon = function(storeData){
			var icon =  {
				size: new naver.maps.Size(20, 31),
				origin: new naver.maps.Point(0, 0),
				anchor: new naver.maps.Point(10, 16)
			}

			if(storeData.additionalAttributes && storeData.additionalAttributes.icon && storeData.additionalAttributes.icon !== ''){
				icon.content = '<i class="icon_map_marker '+storeData.additionalAttributes.icon+'"></i>';
			} else if(undefined !== storeData.additionalAttributes && undefined !== storeData.additionalAttributes.storeType
			           && storeData.additionalAttributes.storeType.indexOf('direct') !== -1){
				// icon.url = Core.Utils.contextPath + '/cmsstatic/theme/c-commerce/cmsstatic/theme/SNKRS/assets/images/g_ico_mapFlag01.png';
				icon.url = 'https://static-breeze.nike.co.kr/kr/ko_kr/cmsstatic/theme/c-commerce/cmsstatic/theme/SNKRS/assets/images/g_ico_mapFlag01.png';
			} else{
				// icon.url = Core.Utils.contextPath + '/cmsstatic/theme/c-commerce/cmsstatic/theme/SNKRS/assets/images/g_ico_mapFlag02.png';
				icon.url = 'https://static-breeze.nike.co.kr/kr/ko_kr/cmsstatic/theme/c-commerce/cmsstatic/theme/SNKRS/assets/images/g_ico_mapFlag02.png';
			}

			return icon;
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				var args = arguments[0];

				storeList = setting.storeList || args['data-store-list'];

				var firstLatitude = (storeList[0]) ? storeList[0].latitude:37.3595953;
				var firstLongitude = (storeList[0]) ? storeList[0].longitude:127.1053971;

				map = new naver.maps.Map(setting.target, {
					center:new naver.maps.LatLng(firstLatitude, firstLongitude),
					zoom:9
				});

				_self.initMap();
				return this;
			},
			mapEvent:function(seq){
				var _self = this;
				var marker = markers[seq], infoWindow = infoWindows[seq];
				if (infoWindow.getMap()) {
					infoWindow.close();
					_self.fireEvent('closeMarker', this, [seq]);
				} else {
					infoWindow.open(map, marker);
					_self.fireEvent('openMarker', this, [storeList[seq], seq]);
					map.setCenter(new naver.maps.LatLng(storeList[seq].latitude, storeList[seq].longitude));
					map.setZoom(10);
				}
			},
			initMap:function(){
				//store 위도, 경도 값으로 지도 마커 찍어내기
				//store type에 따라 2개의 마커icon 필요함
				var _self = this;

				for (var i=0; i<storeList.length; i++) {
					var position = new naver.maps.LatLng(storeList[i].latitude, storeList[i].longitude);
					var marker = new naver.maps.Marker({
						map:map,
						position:position,
						title:storeList[i].name,
						icon:makeMarkerIcon(storeList[i]),
						zIndex:100
					});

					var infoWindow;
					if($('body').attr('data-device') === 'mobile'){
						//mobile
						infoWindow = new naver.maps.InfoWindow({
							content: '<div id="map_store_info_layer" style="width:120px;text-align:center;padding:10px 6px 10px 10px;"><span class="tit">'+ storeList[i].name +'</span></div>'
						});
					} else {
						//pc
						infoWindow = new naver.maps.InfoWindow({
							content: '<div id="map_store_info_layer" style="width:260px;text-align:center;padding:20px 14px 20px 20px;">'+Handlebars.compile($('#map-window-store-info').html())(storeList[i])+'</div>'
						});
					}

					markers.push(marker);
					infoWindows.push(infoWindow);
				}

				// 지도 마커 클릭 이벤트
				for (var i=0, ii=markers.length; i<ii; i++) {
					naver.maps.Event.addListener(markers[i], 'click', (function(seq){
						return function(){
							_self.mapEvent(seq);
						}
					})(i));
				}
			},
			getStoreList:function(id){
				return (function(){
					if(!id){
						return storeList;
					}else{
						for(var key in storeList){
							if(storeList[key].id == id){
								return storeList[key];
							}
						}
					}
				});
			},
			setStoreList:function(arrStoreList){
				arrStoreList.forEach(function(current, index, arr){
					storeList.push(current);
				});

				return this;
			},
			reInit:function(){
				//변수 초기화
				// map = null;
				markers = [];
				infoWindows = [];
				// currentStoreIndex = 0;
				setting.storeList = storeList;
				this.initMap();
				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_map'] = {
		constructor:Map,
		attrName:['data-component-map', 'data-store-list']
	}
})(Core);

(function(Core){
	var WishListBtn = function(){
		'use strict';

		var $this, args, endPoint;
		var setting = {
			selector:'[data-component-wishlistbtn]',
			activeClass:'active'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				args = arguments[0];
				$this = $(setting.selector);
				endPoint = Core.getComponents('component_endpoint');

				/* wishlist */
				$this.click(function(e){
					e.preventDefault();

					var _self = $(this);
					var query = {
						productId:args.productId
					}

					Core.getModule('module_header').reDirect().setModalHide(true).setLogin(function(data){
						Core.Utils.ajax(args.api, 'GET', query, function(data){
							var jsonData = Core.Utils.strToJson(data.responseText, true) || {};
							if(jsonData.hasOwnProperty('error')){
								UIkit.notify(jsonData.error, {timeout:3000,pos:'top-center',status:'warning'});
							}else{
								if(jsonData.isWishListChk){
									_self.find('i').addClass('icon-wishlist_full');
+									_self.find('i').removeClass('icon-wishlist');
									UIkit.notify(args.addMsg, {timeout:3000,pos:'top-center',status:'success'});
									endPoint.call('addToWishlist', query);
								}else{
									_self.find('i').addClass('icon-wishlist');
+									_self.find('i').removeClass('icon-wishlist_full');
									endPoint.call('removeToWishlist', query);
									UIkit.notify(args.removeMsg, {timeout:3000,pos:'top-center',status:'warning'});
								}
								/*
								if( _.isFunction( marketingAddWishList )){
									marketingAddWishList();
								}
								*/
							}
						});
					});
				});

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_wishlistbtn'] = {
		constructor:WishListBtn,
		reInit:true,
		attrName:'data-component-wishlistbtn'
	}
})(Core);

(function(Core){
	var Like = function(){
		'use strict';

		var $this, $btn;
		var setting = {
			selector:'[data-component-like]',
			btn:'.like'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;

				$this = $(setting.selector);
				$btn = $this.find(setting.btn);

				$btn.each(function(i){
					var $this = $(this);
					var url = $this.attr('href');

					$this.off('click').on('click',function(e){
						e.preventDefault();

						var target = this;
						Core.Utils.ajax(url, 'GET', {}, function(data){
							var args = Core.Utils.strToJson(data.responseText, true);

							if(args.result){
								_self.fireEvent('likeFeedBack', target, [args]);
							}else{
								UIkit.notify(args.errorMessage, {timeout:3000,pos:'top-center',status:'warning'});
							}
						});
					});
				});

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_like'] = {
		constructor:Like,
		attrName:'data-component-like'
	}
})(Core);

(function(Core){
        var SizeGuide = function(){
            'use strict';

            var $this, modal, args, endPoint;
            var setting = {
                selector:'[data-component-sizeguide]'
            }

            var Closure = function(){}

            Closure.prototype = {
                setting:function(){
                    var opt = Array.prototype.slice.call(arguments).pop();
                    $.extend(setting, opt);
                    return this;
                },
                init:function(){
                    var _self = this;

                    args = arguments[0];
                    $this = $(setting.selector);

                    // alert($this.html());


                    /*sizeChart*/
                    var $sizeCategory = $('#view_size_guide').find('.size_category');
                    // var $sizeMenu = $sizeCategory.find('.size_menu');
                    // var $sizeSubMenu = $sizeMenu.find('.size_sub_menu');
                    var $sizeCategoryItem = $sizeCategory.find('>li');
                    // var $sizeMenuItem = $sizeMenu.find('>li');
                    // var $sizeSubMenuItem = $sizeSubMenu.find('>li');

                    /* Change css class when select Top menu (Men/Women/Kids/Goods)*/
                    //  $sizeCategoryItem.find('>a').on('click', function(){
                    //     $sizeCategoryItem.removeClass('on');
                    //     $(this).parent().addClass('on');
                    //     $sizeMenu.hide();
                    //     $(this).parent().find($sizeMenu).show();
                    //     $sizeMenuItem.removeClass('on');
                    //     $sizeSubMenuItem.removeClass('on');
                    //     $(this).parent().find($sizeMenuItem).eq(0).addClass('on');
                    //     $sizeSubMenu.hide();
                    //     $(this).parent().find($sizeSubMenu).eq(0).show();

                    //     if($(this).parent().find('ul').hasClass('size_sub_menu')){
                    //         $sizeCategory.height($(this).parent().find($sizeMenu).outerHeight(true) + $(this).parent().find($sizeSubMenu).outerHeight(true));
                    //     } else{
                    //         $sizeCategory.height($(this).parent().find($sizeMenu).outerHeight(true));
                    //     }
                    //     return false;
                    // });

                    /* Change css class when select each sub menu */
                    // $sizeSubMenuItem.find('>a').on('click', function(){
                    //     $sizeSubMenuItem.removeClass('on');
                    //     $(this).parent().addClass('on');
                    // });

                    /* toggle size guide, measurement guide */

                    endPoint = Core.getComponents('component_endpoint');

                    $('.size_category').on('click', 'li', function(){

                        $('.size_category li.on').removeClass('on');
                        $(this).addClass('on');
                        var index = $(this).index();
                        //    console.log('li click, index:', index);

                        var param = {};
                        param.link_name= "Click Links";
                        param.click_area = "pdp";

                        if(index == 0){
                            $('#measurement_guide').hide();
                            $('#size_table').show();
                            param.click_name = "size guide: size table";

                        } else {
                            $('#measurement_guide').show();
                            $('#size_table').hide();

                            param.click_name = "size guide: measurement guide";
                        }

                        param.page_event = {
                            link_click : true
                        }

                        endPoint.call('adobe_script', param);
                    });

                    /*table*/
                    var $sizeTable = $('#view_size_guide').find('.pop_size_table');
                    var $sizeTd = $sizeTable.find('tbody td');
                    var $sizeTheadTh = $sizeTable.find('thead th');
                    var $sizeTdFirst = $sizeTable.find('tbody td').eq(0);

                    $sizeTd.on({
                        mouseenter : function(){
                            var $tdIdx = $(this).index();
                            $sizeTheadTh.eq($tdIdx).addClass('highlight');

                            $(this).parent().prevAll().each(function(){
                                $(this).find('td').eq($tdIdx-1).addClass('highlight2');
                            });

                            $(this).prevAll('td').addClass('highlight2');
                            $(this).parent().find('th').addClass('highlight');
                            $(this).addClass('highlight');
                        },mouseleave : function(){
                            var $tdIdx = $(this).index();
                            $sizeTheadTh.eq($tdIdx).removeClass('highlight');

                            $(this).parent().prevAll().each(function(){
                                $(this).find('td').eq($tdIdx-1).removeClass('highlight2');
                            });

                            $(this).prevAll('td').removeClass('highlight2');
                            $(this).parent().find('th').removeClass('highlight');
                            $(this).removeClass('highlight');
                        }
                    });

                    /*tab*/
                    var $sizeTab = $('#view_size_guide').find('.tabbtn');
                    var $tabcon = $('#view_size_guide').find('.tabcon');

                    $sizeTab.find('a').bind('click', function(e){
                        var tar = $(this).attr('href');
                        $sizeTab.find('a').removeClass('active');
                        $(this).addClass('active');
                        $tabcon.hide();
                        $('#view_size_guide').find(tar).show();

                        if (tar == '#chart1'){
                            $sizeTab.find('.tabbar').stop().animate({'left':'0'},400);
                        } else {
                            $sizeTab.find('.tabbar').stop().animate({'left':'73px'},400);
                        }
                        return false;
                    });

                    /*bra table*/
                    $(function(){
                        $(".one_row td").mouseover(function(){
                            $(".us-size").removeClass("highlight");
                            $(".one_row").find(".us-size").addClass("highlight");
                            $(".indi").removeClass("highlight2");
                            $(".one_row .indi").addClass("highlight2");

                            if ( $(this).hasClass("indi") ){
                                $(".col-1, .col-2").removeClass("highlight2");
                                $(".one_row").find(".col-1, .col-2").addClass("highlight2");
                            }
                        });

                        $(".two_row td").mouseover(function(){
                            $(".us-size").removeClass("highlight");
                            $(".two_row").find(".us-size").addClass("highlight");
                            $(".indi").removeClass("highlight2");
                            $(".two_row .indi").addClass("highlight2");

                            if ( $(this).hasClass("indi") ){
                                $(".col-1, .col-2").removeClass("highlight2");
                                $(".two_row").find(".col-1, .col-2").addClass("highlight2");
                            }
                        });

                        $(".three_row td").mouseover(function(){
                            $(".us-size").removeClass("highlight");
                            $(".three_row").find(".us-size").addClass("highlight");
                            $(".indi").removeClass("highlight2");
                            $(".three_row .indi").addClass("highlight2");

                            if ( $(this).hasClass("indi") ){
                                $(".col-1, .col-2").removeClass("highlight2");
                                $(".three_row").find(".col-1, .col-2").addClass("highlight2");
                            }
                        });

                        $(".four_row td").mouseover(function(){
                            $(".us-size").removeClass("highlight");
                            $(".four_row").find(".us-size").addClass("highlight");
                            $(".indi").removeClass("highlight2");
                            $(".four_row .indi").addClass("highlight2");

                            if ( $(this).hasClass("indi") ){
                                $(".col-1, .col-2").removeClass("highlight2");
                                $(".four_row").find(".col-1, .col-2").addClass("highlight2");
                            }
                        });

                        $(".five_row td").mouseover(function(){
                            $(".us-size").removeClass("highlight");
                            $(".five_row").find(".us-size").addClass("highlight");
                            $(".indi").removeClass("highlight2");
                            $(".five_row .indi").addClass("highlight2");

                            if ( $(this).hasClass("indi") ){
                                $(".col-1, .col-2").removeClass("highlight2");
                                $(".five_row").find(".col-1, .col-2").addClass("highlight2");
                            }
                        });

                        $(".indi").mouseover(function(){
                            $(".indi_thead").addClass("highlight");
                            $(".col-1, .col-2").removeClass("highlight2");
                            $(this).addClass("highlight3");

                            $(this).mouseleave(function(){
                                $(".indi_thead").removeClass("highlight");
                                $(".col-1, .col-2").removeClass("highlight2");
                                $(this).removeClass("highlight3");
                            });
                        });

                        $(".col-1").mouseenter(function(){
                            $(".one_col").addClass("highlight");
                            $(this).removeClass("highlight2");

                            $(this).mouseleave(function(){
                                $(".one_col").removeClass("highlight");
                                $(".us-size").removeClass("highlight");
                            });
                        });

                        $(".col-2").mouseenter(function(){
                            $(".two_col, .col_head").addClass("highlight");
                            $(".indi_thead").addClass("normal");
                            $(this).removeClass("highlight2");

                            $(this).mouseleave(function(){
                                $(".two_col, .col_head").removeClass("highlight");
                                $(".indi_thead").removeClass("normal");
                                $(".us-size").removeClass("highlight");
                            });
                        });
                    });

                    return this;
                } /* end of init:function(){*/
            } /* end of Closure.prototype = { */

            Core.Observer.applyObserver(Closure);
            return new Closure();


        // $(function(){

        // 	viewSlide(slideCode);
        // });

        // function viewSlide(chgCode) {
        //     $("#view_size_guide").html($("#" + chgCode).html());
        //     initEventListener(chgCode);
        //     }
        //     function initEventListener(chgCode) {


        //     }
        }

        Core.Components['component_sizeguide'] = {
            constructor:SizeGuide,
            reInit:true,
            attrName:'data-component-sizeguide'
        }

    })(Core);

(function(Core){
	var ISwiper = function(){
		'use strict';

		var $this, args, $slider, opt, $list, defaultWidth, widthMatch;
		var setting = {
			selector:'[data-component-slider]',
			list:'.slider-wrapper, ul',
			prev:'<i class="icon-arrow_left"></i>',
			next:'<i class="icon-arrow_right"></i>'
		}

		var slideWidth = function(sWidth){
			return sWidth / (args.maxSlides || 1) - (args.slideMargin || 0);
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;

				$this = $(setting.selector);
				$list = $this.find(setting.list);

				args = arguments[0];

				//var maxSlides = (Core.Utils.mobileChk === null) ? args.maxSlides||1 : args.minSlides||1;
				//console.log(_GLOBAL.LAYOUT.MAX_WIDTH / (args.maxSlides || 1) - (args.slideMargin||0));

				defaultWidth = (args.slideWidth === 'full' ? slideWidth($('body').width()) : args.slideWidth) || slideWidth(_GLOBAL.LAYOUT.MAX_WIDTH);
				opt = {
					//slideWidth:args.slideWidth || $this.width() / maxSlides,
					slideWidth:defaultWidth,
					minSlides:args.minSlides || 1,
					maxSlides:args.maxSlides || 1,
					moveSlides:args.moveSlide||args.maxSlide,
					slideMargin:parseInt(args.slideMargin)||0,
					auto:(args.auto != undefined) ? args.auto : false,
					autoHover: true,
					pager:(args.pager != undefined) ? args.pager : true,
					pagerCustom: (args.pagerCustom != undefined) ? args.pagerCustom : false,
					controls:(args.controls != undefined) ? args.controls : false,
					responsive:(args.responsive != undefined) ? args.responsive : true,
					infiniteLoop:(args.infiniteLoop != undefined) ? args.infiniteLoop  :  false,
					mobileViewType:(args.mobileViewType != undefined) ? args.mobileViewType : 'slider',
					mode:args.mode || 'horizontal',
					preloadImages:'all',
					hideControlOnEnd: args.hideControlOnEnd || false,
					prevText: setting.prev,
					nextText: setting.next,
					startSlide:(args.startSlide != undefined) ? args.startSlide : 0,

					onSliderLoad:function($slideElement, currnetIndex){
						setTimeout(function(){
							_self.fireEvent('onInit', $slider, [$slideElement, currnetIndex]);
						});
					},
					onSlideAfter: function($slideElement, oldIndex, newIndex){
						_self.fireEvent('slideAfter', $slider, [$slideElement, oldIndex, newIndex]);

                        /*setTimeout(function(e) {
                            $(window).trigger("scroll");
                        }, 10);*/
                    },
					onSlideBefore: function($slideElement, oldIndex, newIndex){
						_self.fireEvent('slideBefore', $slider, [$slideElement, oldIndex, newIndex]);

                        /*setTimeout(function(e) {
                            $(window).trigger("scroll");
                        }, 10);*/
                    }

				}

				$this.show();

				if( opt.minSlides == 1 || opt.mobileViewType == 'list' ){
					widthMatch = matchMedia("all and (max-width: 767px)");
					var widthHandler = function(matchList) {
					    if (matchList.matches) {
					    	opt.slideWidth = "767px";
					    	if( opt.mobileViewType == 'list' ){
								if( $slider ){
								    $($slider.closest(".swipe-container").context).addClass("destroy");
						    	    $slider.destroySlider();
						    	}else{
						    	    $($list.closest(".swipe-container").context).addClass("destroy");
						    	}
					    	}else{
					    		if( $slider ){
						    	    $slider.reloadSlider( opt );
						    	}else{
						    	    $slider = $list.bxSlider(opt);
						    	}
					    	}
					    } else {
							opt.slideWidth = defaultWidth;
					    	if( $slider ){
					    	   $($slider.closest(".swipe-container").context).removeClass("destroy");
					    	    $slider.reloadSlider( opt );
					    	}else{
					    	    $($list.closest(".swipe-container").context).removeClass("destroy");
					    	    $slider = $list.bxSlider(opt);
					    	}
					    }
					};
					widthMatch.addListener(widthHandler);
					widthHandler(widthMatch);
				}else{
					$slider = $list.bxSlider(opt);
				}

				$this.find('.bxslider-controls .btn-next').on('click', function(e) {
					e.preventDefault();
					$slider.goToNextSlide();
				});
				$this.find('.bxslider-controls .btn-prev').on('click', function(e) {
					e.preventDefault();
					$slider.goToPrevSlide();
				});

				$this.find('a').on('click', function(e) {
					_self.fireEvent('slideClick', this);
				});

				return this;
			},
			reloadSlider:function(index){
				opt.startSlide = (index) ? index : 0;
				$slider.reloadSlider( opt );
				return this;
			},
			redrawSlider:function(){
				$slider.redrawSlider();
				return this;
			},
			goToSlide:function(index){
				$slider.goToSlide(index);
				return this;
			},
			goToNextSlide:function(){
				$slider.goToNextSlide();
				return this;
			},
			goToPrevSlide:function(){
				$slider.goToPrevSlide();
				return this;
			},
			destroySlider:function(){
				$slider.destroySlider();
				return this;
			},
			getCurrentSlide:function(){
				return $slider.retCurrentSlide();
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_slider'] = {
		constructor:ISwiper,
		attrName:'data-component-slider',
		reInit:true
	}
})(Core);

(function(Core){
	
	var autoSearchStorage = ['스타디움','FC 바르셀로나 스타디움','첼시 FC 스타디움','파리 생제르망 스타디움','FFF 스타디움','KOR 스타디움','USA 스타디움','대한민국 스타디움','브라질 스타디움','잉글랜드 스타디움','크로아티아 스타디움','포르투갈 스타디움','프랑스 스타디움','알파 드라이','테크 퀼티드 크루','우산','ACG AW84','ACG CLTR ','ACG 도그','ACG 러클','ACG 로고','ACG 우븐','AF1 러버','AF1 레벨','AF1 세이지','AF1 익스플로러','AF1 제스터','AJ FLEECE FZ HOODY','AOP 숏슬리브','AS M NSW','AV15 KFZ','AV15 풀리스','AV15 풀집','AV15 플리스','AW84 코어','Apple Watch','BEHIND THE DESIGN','CLUB FLEECE','CR7 백팩','CR7 샤이엔 백팩','CR7 스트라이크 볼','CR7 크루 삭스','CRP 3/4 팬츠 RD','F.C. 쇼츠','F.C. 크레스트 티','F.C. 티','FB 트레이닝 슈 백 3.0','FC 바르셀로나 스킬 미니볼','FC 바르셀로나 피치 볼','FFF H86 코어 캡','FFF 앤썸 재킷','FFF 어센틱 그랜드 슬램 숏슬리브 폴로','FFF 프라이드 티','FFF 프레스티지 볼','FreeRunArtistSeries','H86 코리아 캡','H86 코리아 캡','J 가드 보호대','JDB 23 프로 드라이 피티드 숏슬리브 탑','JDB AJ 3 탭 티 쇼츠 세트','JDB AJ23 뉴 레거시 배스킷볼 세트','JDB AJ23 베이스볼 머슬 세트','JDB AJ23 플라이트 머슬 세트','JDB 라이즈 그래픽 쇼츠','JDB 라이즈 배스킷볼 VERIAGE 티','JDB 라이즈 쇼츠 세트','JDB 바셀린 솔리드 타이츠','JDB 브랜드 리드 3 티','JDB 시멘트 프린트 롱슬리브 탑','JDB 에어 조던','JDB 윙스 플리스','JDB 코프 에어 조던 23','JDB 픽셀 팩 게임 체인저 티','JUST DO IT 스우시 티','L91 코어 캡','LA 레이커스','LA 레이커스 드라이','LA 레이커스 모던','LA 레이커스 스윙맨','LA 레이커스 써마','LA 레이커스 에어로빌 ','LD 러너','M JSW TEE','NBA','NBA 리스트밴드','NBA 스윙맨 저지','NBA 아이콘 에디션','NBA 어센틱 저지','NBA 엘리트 퀵','NBA 헤드밴드','NIKE','NIKE AIR','NIKE AIR MAX','NIKE AIR VERSITILE','NIKE LUNAR APPARENT','NIKE RUNALLDAY','NIKE SB PORTMORE','NIKE TANJUN','Nike On Air','NikeLab','NikeLab ACG','NikeLab ACG 고어-텍스','NikeLab ACG 디플로이','NikeLab ACG 레그 슬리브','NikeLab ACG 베리어블','NikeLab ACG 쇼츠','NikeLab ACG 팬츠','NikeLab ACG 후디','NikeLab NRG','NikeLab X','NikeLab X RT 디스트로이어','NikeLab x KJ','NikeLab x KJ 니트','NikeLab x KJ 믹스','NikeLab x RT PO','NikeLab x RT 쇼츠','NikeLab x RT 저지','NikeLab x RT 카 코트','NikeLab x RT 티','NikeLab 갸쿠소우','NikeLab 갸쿠소우 드라이','NikeLab 갸쿠소우 쇼츠','NikeLab 갸쿠소우 숏슬리브','NikeLab 갸쿠소우 우븐 쇼츠','NikeLab 갸쿠소우 유틸리티','NikeLab 갸쿠소우 재킷','NikeLab 갸쿠소우 타이츠','NikeLab 갸쿠소우 패커블','NikeLab 갸쿠소우 후디','NikeLab 롱슬리브','NikeLab 밀리터리','NikeLab 백팩','NikeLab 봄버 재킷','NikeLab 브라','NikeLab 씨 고스트 재킷','NikeLab 에센셜 디스트로이어','NikeLab 카고 팬츠','NikeLab 컬렉션','NikeLab 타이츠','NikeLab 티','NikeLab 팬츠','NikeLab 퍼포레이트 팬츠','NikeLab 퍼포먼스 스커트','NikeLab 폴리필 크루 탑','NikeLab 프리 런 모션 플라이니트 2017','NikeLab 플리스 팬츠','Nikelab ACG 고어-텍스® 디플로이 후디 재킷','PG 1','PG 2','Powerbeats3 Wireless','SB X QS 숏슬리브 탑','SB x 미디컴 H86 캡','SB x 미디컴 H86 캡','SB x 미디컴 덩크 하이 엘리트 QS','SB 노 쇼우 삭스','SB 덩크 로우 QS','SB 덩크 로우 엘리트','SB 덩크 로우 프로','SB 덩크 미드 프로 QS','SB 델타 포스 벌크','SB 드라이','SB 로고 티','SB 로고 티셔츠','SB 롱슬리브 탑','SB 모뉴먼트 티','SB 백팩','SB 블레이저 로우','SB 솔라소프트 포트모어','SB 쉴드 코치 재킷','SB 아노락','SB 아이콘','SB 에버렛','SB 에어 포스','SB 에어맥스','SB 줌 덩크','SB 줌 덩크 로우','SB 줌 덩크 하이 프로','SB 줌 블레이저','SB 줌 스테판 야노스키','SB 줌 야노스키','SB 체크 솔라 캔버스','SB 체크 솔라소프트 캔버스','SB 크루 삭스','SB 티','SB 팀 클래식','SB 포트모어 II 솔라소프트 슬립온','SB 프로 캡','SB 플렉스','SF AF 1 미드 스웨이드','SF 에어 포스','THE 1 REIMAGINED ICONS EVOLVED','하이퍼차지','게임 골 글로리 드라이','골든 스테이트 워리어즈','골든 스테이트 워리어즈 드라이','골든 스테이트 워리어즈 모던 NBA 크루','골든 스테이트 워리어즈 모던 NBA 팬츠','골든 스테이트 워리어즈 모던 쇼츠','골든 스테이트 워리어즈 스윙맨','골든 스테이트 워리어즈 스테이트먼트','골든 스테이트 워리어즈 써마','골든 스테이트 워리어즈 아이콘','골든 스테이트 워리어즈 어센틱','골든 스테이트 워리어즈 에어로빌','골프','그랜드 스탠드','그립','그립 그라디언트','그립 두들 하트','그립 레거시 플레시','그립 멀티 퓨추라','그립 스포츠 에센트','그립 드레스','그립 윈드러너','그립 짐 빈티니','그립 퀵','그립 템포','그립 플레시','그립 헤브','그립 헤브어 데이','나이지리아 트리뷰트 팬츠','네이마르 백팩','네이마르 스트라이크 볼','뉴 스우시 헤리티지 캡','뉴욕 닉스','뉴욕 닉스 NBA','뉴욕 닉스 드라이','뉴욕 닉스 모던','뉴욕 닉스 스윙맨','뉴욕 닉스 아이콘 에디션','뉴욕 닉스 에어로빌','뉴욕 닉스 워리어스','다운시프터','다이나모 프리','대한민국 REV 우븐','대한민국 SF1 레인 재킷','대한민국 드라이 스쿼드','대한민국 쉘 탑','대한민국 쉴드 스쿼드','대한민국 스트라이크','덩크 로우 플라이니트','듀얼 레이서','듀얼 퓨전 TR III 남성 트레이닝화','듀얼톤 레이서','드라이','드라이 FLABJACKS','드라이 JDQ','드라이 KA LONDON','드라이 KD 믹스테이프','드라이 KI','드라이 LBJ 블락','드라이 NOVO','드라이 PG13','드라이 SU18','드라이 골드 베너','드라이 뉴스페이퍼','드라이 니트 하이퍼라이트','드라이 더 조거 짐','드라이 드리블 쇼츠','드라이 럭스 플로우','드라이 런 슬리브리스','드라이 레거시 슬리브리스','드라이 레전드 롱슬리브','드라이 레전드 패스트','드라이 마일러 롱슬리브','드라이 마일러 탱크','드라이 메달리스트 롱슬리브','드라이 메달리스트 숏슬리브','드라이 메달리스트 탱크','드라이 베니어 쇼츠','드라이 블레이드','드라이 빅토리','드라이 쇼츠','드라이 쇼타임 카이리 풀집 후디','드라이 숏슬리브','드라이 스우시','드라이 스쿼드','드라이 스쿼드 재킷','드라이 스쿼드 팬츠','드라이 스트라이프','드라이 슬리브리스','드라이 슬림 다이나믹','드라이 슬림 솔리드','드라이 심리스','드라이 아웃','드라이 아카데미','드라이 어택','드라이 에센셜','드라이 엘레멘트','드라이 엘레스티카','드라이 엘리트','드라이 우븐','드라이 재킷','드라이 첼린저','드라이 콜드','드라이 쿠션','드라이 쿠쉬','드라이 쿨','드라이 쿨링','드라이 크롭','드라이 크루','드라이 크루넥','드라이 탑','드라이 탱크','드라이 테크','드라이 템포','드라이 트레인','드라이 티','드라이 팬츠','드라이 페놈','드라이 폴로','드라이 풀오버','드라이 풀집','드라이 프론트','드라이 플리스','드라이 핏','드라이 핏 드레스','드라이 핏 라이즈','드라이 핏 마일러','드라이 핏 메달리스트','드라이 핏 모멘텀','드라이 핏 빅토리','드라이 핏 쇼츠','드라이 핏 숏슬리브','드라이 핏 스쿼드','드라이 핏 아카데미','드라이 핏 엘레멘탈','드라이 핏 엘리트','드라이 핏 재킷','드라이 핏 탱크','드라이 핏 템포','드라이 핏 티','드라이 핏 팬츠','드라이 하프집','드라이 후디','드라이 히트','디스턴스','디스턴스 투인원','디스턴스 플렉스','디스트로이어 트레이닝','디파쳐 더플백','디파쳐 백팩','라디에이트 클럽백','라디에이트 토트백','라이벌 브라','라이즈 그래픽 쇼츠','라이트 보호대','라이트웨이트 라이벌','라이트웨이트 삭스','라이트웨이트 슬리브','라지 카파시티 웨이스트백','라켓','런','런 JDI 숏슬리브 탑','런 더플 백','런 라이트웨이트 백팩','런 스위프트','런 커뮤터 백팩','런올데이','레거시','레거시 햇','레거시 드라이 핏 블랙 숏슬리브 탑','레볼루션','레이서 쿨','레전더리 트레이닝','레전드','레전드 아카데미','레전드 백팩','레터럴 리지스턴스','레트로 백팩','로고 헤드밴드','로덴','로쉬 G','로쉬 G 프리미엄','롱-렝스 헤비 리지스턴스','루나','루나 어패런트','루나 커맨드','루나 컨버지','루나 컨트롤','루나 포스','루나 프라임','루나글라이드','루나솔로','루나에픽 로우 플라이니트','루나차지 에센셜','루나커맨드 2 보아','루나컨버지','루나컨트롤 베이퍼 2','르브론','르브론 XV','르브론 XV 로우','르브론 XV 리미티드','르브론 드라이','르브론 솔저','르브론 엘리트','르브론 올 코트','르브론 위트니스','리바','리액트 베이퍼','리액트 볼','리액트 엘레멘트','리액트 하이퍼덩크','리커버 선글라스','리커버리','리커버리 롤러 바','리커버리 볼','리플렉스 랜야드','마기아 볼','마일러 후디','마지스타 오브라','마지스타 온다','맘바 레이지','매버릭 선글라스','매치 골키퍼 글로브','매치 글로브','머큐리얼','머큐리얼 라이트','머큐리얼 베이퍼','머큐리얼 벨로체','머큐리얼 빅토리','머큐리얼 슈퍼플라이','머큐리얼 페이드 볼','머큐리얼X','머큐리얼X 베이퍼','머큐리얼X 빅토리','머큐리얼X 슈퍼플라이','메이플라이','메트콘','메트콘 4','메트콘 DSX','메트콘 레퍼','모던 러너 2 엔지니어','모션 어댑트 브라','모조 R 선글라스','모조 R 선글라스','모조 SE 선글라스','미드 러너 2','바디수트','바이저 코어','반달 2K','반달 하이 슈프림','밴딧 미러드 선글라스','밴딧 선글라스','버사 롱슬리브 탑','버사 택 8P 볼','베나시','베나시 듀오','베나시 솔라소프트','베나시 슬라이드','베나시 퓨처','베이직','베이직 월렛','베이퍼 12','베이퍼 골키퍼 글러브','베이퍼 글로브','베이퍼 맥스 에어','베이퍼 에너지 백팩','베이퍼니트 리펠 스트라이크','베이퍼니트 스트라이크 드릴','베이퍼맥스 플라이니트','벨로시티 백팩','보스턴 셀틱스 NBA','보스턴 셀틱스 드라이','보스턴 셀틱스 모던','보스턴 셀틱스 스윙맨','보스턴 셀틱스 아이콘','보스턴 셀틱스 어소시에이션','보스턴 셀틱스 에어로빌','보탁','브라질리아 더플백','브라질리아 백팩','브리드','브리드 라이즈','브리드 런','브리드 마일러','브리드 숏슬리브','브리드 스쿼드','브리드 슬리브리스 ','브리드 엘레멘트','브리드 엘레스티카','브리드 엘리트','브리드 탱크','브리드 테일윈드','브리드 퍼포먼스','브리드 하이퍼','브리드 하이퍼벤트','블레이저','블레이저 로얄','블레이저 로우','블레이저 로우 LE','블레이저 로우 SE','블레이저 로우 레더','블레이저 로우 스웨이드','블레이저 로우 팝','블레이저 프리미엄 로우','블리스','블리스 럭스 팬츠','블리스 빅토리 팬츠','블리스 스튜디오 팬츠','빅 마우스 보틀','빅토리 크림슨','삭다트','샤이엔 솔리드 백팩','샥스 그래비티','선레이 어저스트','선레이 프로텍트 2','세션 백팩','솔라 슬리브','솔레이','솔레이 슬리퍼','솔리드 고어 머플러 타올','쇼 X2 XL 선글라스','쇼타임 재킷','쉐이프 집 브라','쉴드 스위프트','쉴드 컨버티블','쉴드 코어','쉴드 테크','쉴드 하프집','쉴드 후디','슈터 NBA 슬리브스','스몰 카파시티 웨이스트팩','스우시','스우시 더블와이드 리스트밴드','스우시 리스트밴드','스우시 핑거 슬리브스','스우시 헤드밴드','스위프트 팬츠','스윙맨 로드','스윙맨 홈','스카일론','스컬프트 럭스','스컬프트 하이퍼','스쿼드 크루 삭스','스쿼드 티','스킬 이벤트 볼','스타디움 FC 바르셀로나','스타디움 백팩','스타디움 짐색','스테판','스튜디오 브라','스트라이크','스트레치 우븐 벨트','스포츠 백','스포츠 글로브','스포츠 백팩','스포츠 보틀','AF1 쇼츠','AF1 숏슬리브 탑','AF1 티','AF1 팬츠','AF1 헤비웨이트 티','AF1 후디','AM95 티','AOP 숏슬리브','AOP 플로럴','AV15 쇼츠','AV15 숏슬리브','AV15 플리스','H86 메탈 스우시 캡','H86 에센셜 캡','H86 캡','H86 퓨추라','JDI 덩크 티','N98 재킷','TB BF 플래그 코리아 티','넘버 티','노벌티 재킷','니트 타이츠','다운 필 모던 재킷','랠리 바시티 에어 재킷','랠리 타이트 팬츠','레거시','링거 숏슬리브 탑','매치업 숏슬리브 폴로','메쉬 드레스','메쉬 봄버 재킷','메쉬 스커트','메탈릭 재킷','모던 쇼츠','모던 조거','모던 케이프','모던 크루 FT','모던 팬츠','모던 풀집 후디','모던 후디','베이직 트랙 수트','본디드 쇼츠','비버지 1 티','빈티시 쇼츠','빈티지 팬츠','서울 티','선셋 퓨추라 티','쇼츠','수트','스냅','스우시','스트립드','아카이브','어드벤스','에센셜','에어','에어 롱슬리브','에어 팬츠','에어 포스','에어 플리스','오 우븐','옵틱','우븐','웜','윈드러너','재킷','저지','조거','짐','컨트리','코리아','크롭','크루','클럽','테크 니트','테크 샤이엔','테크 쉴드','테크 우븐','테크 플리스','트리뷰트','티','팝시클','팬츠','펀넬','폴로','풀집 후디','풋티','퓨추라','프로','프로','프리미엄','프린트','플리스','헤리티지','헤이워드','후디','스피드 레더','스피드 타이츠','스피어 엘레멘트','슬림 웨이스트팩','시카고 불스','시티 봄버 재킷','시티 트레이너','시프트 원','심리스','써마','써마 스피어','써마 크루','써마 팬츠','써마 플렉스','써마 후디','아신 모던','아웃버스트','아제다 토트백','아쿠아 삭','알파','애로우즈','앵글드','앵클','어드밴티지','어센틱','어소시에이션','언레스트','얼티메이트','에센셜 내비게이터','에센셜 체이서','에센셜 팬츠','에센셜 후디','에어 리바더치','에어 마에스트로','에어 모어','에어 베이퍼맥스','에어 벨라','에어 볼텍스','에어 사파리','에어 숏슬리브','에어 스카이론','에어 스퀘어','에어 스판','에어 시퀀트','에어 우븐','에어 조던 1','에어 조던 2','에어 조던 3','에어 조던 8','에어 조던 9','에어 조던 10','에어 조던 11','에어 조던 13','에어 조던 14','에어 조던 18','에어 조던 28','에어 조던 XXXII','에어 조던 점프맨','에어 조던 퍼스트','에어 줌','에어 캡','에어 컬러블락','에어 티','에어 팬츠','에어 포스','에어 폼포짓','에어 풀오버','에어 풋스케이프','에어 프레스토','에어 프리시전','에어 피펜','에어 허라치','에어 후디','에어 휴마라','에어로레이어','에어로리액트 모멘텀','에어로리액트 숏슬리브','에어로빌','에어로빌 레거시','에어로빌 바이저','에어로빌 빅 빌','에어로빌 캡','에어로빌 클래식','에어로빌 테일윈드','에어로빌 프로','에어로스위프트','에어맥스','에어맥스 1','에어맥스 270','에어맥스 90','에어맥스 93','에어맥스 95','에어맥스 97','에어맥스 LB','에어맥스 가일','에어맥스 다이너스티','에어맥스 도미네이트','에어맥스 모션','에어맥스 비전','에어맥스 시퀀트','에어맥스 어드밴티지','에어맥스 엑시스','에어맥스 엠버','에어맥스 인비고','에어맥스 인퓨리에이트','에어맥스 제로','에어맥스 주얼','에어맥스 타바스','에어맥스 타이니','에어맥스 타이파','에어맥스 테아','에어맥스 풀','에어맥스 퓨리','에어맥스 플러스','에이스 로고','에픽 럭스','에픽 리액트 플라이니트','엘레멘트','엘리베이트','엘리트 라이트웨이트','엘리트 컴페티션','엘리트 컴프레션','엘리트 쿠션','엘리트 퀵','엘리트 크루 삭스','오디세이 리액트','오르뎀','오세아니아 텍스타일','오클라호마 시티','요가','울트라 플라이트','윈드러너 재킷','윙스 라이트','유틸리티','익스펜더블','인-시즌','인디','인스타쿨','인터내셔널리스트','잉글랜드','재킷','저스트','점프맨 스냅백','점프맨 에어','점프맨 플라이트','조널 스트라이프','조널 자카드','조던 23','조던 AJ','조던 DNA','조던 그라인드','조던 드라이','조던 라이즈','조던 리렌트리스','조던 모데로','조던 슈터','조던 스포츠웨어','조던 써마','조던 얼티메이트','조던 엘리펀트','조던 울트라','조던 워드마크 티','조던 윙스','조던 점프맨','조던 제너레이션','조던 줌','조던 트레이너','조던 포뮬라','조던 프로','조던 플라이','조던 플라이니트','조던 플라이트','조던 핑거','조던 하이드로','주니어 마지스타','주니어 매치','주니어 머큐리얼','주니어 베이퍼','주니어 베이퍼','주니어 슈퍼플라이','주니어 티엠포','주니어 팬텀','주니어 프리시전','주니어 하이퍼베놈','줌 KD','줌 라이브','줌 레브','줌 베이퍼플라이','줌 스트라이크','줌 스트릭','줌 에비던스','줌 올 아웃','줌 윈플로','줌 윈플로우','줌 컨디션','줌 케이지','줌 트레인','줌 플라이','줌 피트니스','줌 하이퍼베놈','짐','차저','첼린저','카와','카이리','카이리 재킷','커뮤터','코르테즈','코비','코스 클래식','코어 미드','코어 탑','네이마르','드라이','라이트','로얄','버로우','보로우','숏슬리브 탑','스커트','스트라이크','어드밴티지','에어로리엑트','조널','체커드','크루','톱보이 탱크','파워','페더라이트','폴로','퓨어','플렉스','헤리티지','코튼 쿠션','쿠션','쿨 마일러','쿼터스낵','크루저','클래식','클럽','클리블랜드','타이','탄준','탱크','테니스','테센','테일윈드','테크','템포','토키','투어','트랜스패어런트','트레이닝','티엠포','팀','파리','파워 3인치 쇼츠','파워 런','파워 레이서','파워 모던','파워 미드','파워 쉴드','파워 스컬프드','파워 스튜디오','파워 스피드','파워 에센셜','파워 에픽','파워 에필','파워 윈도우','파워 크롭','파워 타이츠','파워 패스트','파워 포켓','파워 피티드','파워 하이퍼','파워 하이퍼쿨','파이널 재킷','파일론 콘즈','판테오스','패커블 백팩','팬텀','퍼포먼스','펀다멘탈','페놈 플라이니트','페더라이트','페이서 브라','포스','포켓나이프','풀 코트','풋볼','퓨추라','프라이드 티','프랑스','프레스토 익스트림','프렉스 우븐','프로','프로 PX 탱크','프로 드라이 타이츠','프로 롱슬리브 탑','프로 리스트','프로 쇼츠','프로 숏슬리브 탑','프로 스우시','프로 앵클','프로 엘보우','프로 오픈-파텔라','프로 웜 컴프레션','프로 웜 타이츠','프로 웨이스트 랩','프로 크로스오버 탱크','프로 크롭 크로스오버','프로 클래식 패디드 브라','프로 클래식 프린티 브라','프로 클로즈 파텔라','프로 타이츠','프로 탱크','프로 탱크탑','프로 파텔라','프로 퍼포레이트','프로 피티드','프로 하이퍼스트롱','프로 하이퍼쿨','프로테가','프리','프리모','프리미엄','프린티드','플라이','플락티스크','플렉스','플로럴','피치','피코','피티드 유틸리티','하이 컷 쇼츠','하이퍼 그립','하이퍼 엘리트','하이퍼덩크 2017','하이퍼베놈','하이퍼어댑트 재킷','하이퍼쿨','하이퍼퓨얼','하카타','행택 스우시 티','허라치','헤리티지','헤브 어 데이','훕스 엘리트'];
	
	sessionStorage.setItem('autoSearchKeyword', JSON.stringify(autoSearchStorage)); 
})(Core);
(function(Core){

	var InputTxtField = function(){
		'use strict';

		var $this, $input, $label, $errorField, $deleteBtn, isValidate = false, args, pattern;
		var objPattern = {
			name:'[^a-zA-Z|ㄱ-ㅎ|ㅏ-ㅣ|가-힣]',
			pw:'[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]',
			email:'^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$',
			phone:'^[0-9]{2,3}[0-9]{3,4}[0-9]{4}$',
			number:'^[0-9]*$' /* ^[0-9] */
		}

		var setting = {
			selector:'[data-component-textfield]',
			input:'input',
			label:'label',
			errorField:'.error-message',
			attrName:'data-component-textfield',
			deleteBtn:'.delete'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;

				$this = $(setting.selector);
				$input = $this.find(setting.input);
				$label = $this.find(setting.label);
				$errorField = $this.find(setting.errorField);
				$deleteBtn = $this.find(setting.deleteBtn);
				args = arguments[0]||{};
				pattern = (args.type) ? new RegExp(objPattern[args.type], 'g') : false;

				if(args.disabled){
					$input.attr('disabled', 'disabled');
				}

				$input.on({
					'focusin':function(e){
						$this.addClass('focus');
						_self.fireEvent('focusin', this);
					},
					'focusout':function(e){
						var val = $input.val();
						$this.removeClass('focus');
						//$errorField.text('');

						if(val !== ''){
							isValidate = true;
							$this.addClass('value');
						}else{
							isValidate = false;
							$this.removeClass('value');
						}

						if(pattern){
							if(pattern.test(val)){
								$errorField.text('');
							}else if(!pattern.test(val)){
								$errorField.text(args.errMsg||'잘못된 형식 입니다.');
								isValidate = false;
							}
						}

						_self.fireEvent('focusout', this);
					},
					'keyup':function(e){
						if(e.keyCode === 13){
							_self.fireEvent('enter', this);
						}else{
							_self.fireEvent('keyup', this);
						}
					},
					'keydown':function(e){
						$this.addClass('value');

						//jquery 2.2.4 버전업 으로 인해, e.srcElement.type 작동 불가
						// e.originalEvent.srcElement.type  or  event.srcElement.type  둘다 기존 버전 현제 버전 사용 가능

						if(e.keyCode === 13 && e.originalEvent.srcElement.type != 'textarea'){
							return false;
						}
					}
				});

				$input.bind("paste", function(e){
					var _self = this;
					setTimeout(function(){
						var val = $(_self).val();

						if(val !== ''){
							isValidate = true;
							$this.addClass('value');
						}else{
							isValidate = false;
							$this.removeClass('value');
						}
					});
				});


				$label.on('click', function(e){
					e.preventDefault();
					$input.focus();
				});

				$deleteBtn.on('click', function(e){
					e.preventDefault();
					$input.val('');
					$this.removeClass('value');
					isValidate = false;
				});

				this.setValueLabel();

				return this;
			},
			getValue:function(){
				return $input.val();
			},
			focus:function(){
				$input.focus();
			},
			getThis:function(){
				return $input;
			},
			setValue:function(val){
				if(val !== ''){
					isValidate = true;
					$input.val(val);
					$this.addClass('value');
				}else{
					isValidate = false;
					$input.val(val);
					$this.removeClass('value');
				}
			},
			getValidateChk:function(errorMsgType){
				if(args.required){
					if(!isValidate){
						if(errorMsgType === 'errorLabel') {
							this.setError(args.validateMsg);
						} else {
							// @pck 2021-07-23 마이페이지 > 배송관리 > 새 배송지 추가, 시 args내 validateMsg가 존재하지 않음. 예외처리 추가
							if(typeof args.validateMsg !== "undefined"){
								UIkit.notify(args.validateMsg, {timeout:3000,pos:'top-center',status:'danger'});
							}
						}
					}else{
						if(errorMsgType === 'errorLabel') this.setError('');
					}
					return isValidate;
				}else{
					return true;
				}
			},
			setError:function(message){
				$errorField.text((message || message == '') ? message : args.errMsg);
			},
			setErrorLabel:function(message){
				$label.text(message||args.errMsg).addClass('err');
			},
			setValueLabel:function(){
				// 초기 값이 있으면 label 숨김
				if($input.val() !== ''){
					$this.addClass('value');
					isValidate = true;
				}
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_textfield'] = {
		constructor:InputTxtField,
		reInit:true,
		attrName:'data-component-textfield',
	}
})(Core);

(function(Core){
	var RegisterModal = function(){
		'use strict';

		var $this, args, endPoint;
		var setting = {
			selector:'[data-component-registermodal]',
			activeClass:'active'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				// var _self = this;
				args = arguments[0];
				$this = $(setting.selector);
				//endPoint = Core.getComponents('component_endpoint');

				/* register */
				$this.click(function(e){
					e.preventDefault();

					// var _self = $(this);
					Core.getModule('module_header').popRegister(function(data){
						location.reload();
					});
				});

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_registermodal'] = {
		constructor:RegisterModal,
		reInit:true,
		attrName:'data-component-registermodal'
	}
})(Core);

(function(Core){

	var InputTxtArea = function(){
		'use strict';

		var $this, $input, $label, validateIS = false, opt, minLength;
		var setting = {
			selector:'[data-component-textarea]',
			input:'textarea',
			label:'label',
			attrName:'data-component-textarea'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;

				$this = $(setting.selector);
				$input = $this.find(setting.input);
				$label = $this.find(setting.label);

				opt = arguments[0]||{};
				minLength = (opt.minLength) ? opt.minLength * 1 : 0;

				if(opt.disabled){
					$input.attr('disabled', 'disabled');
				}

				// 초기 값이 있으면 label 숨김
				if($input.val() !== ''){
					$this.addClass('value');
					//validateIS = true;
				}

				$input.on({
					'focusin':function(e){
						$this.addClass('focus');
						_self.fireEvent('focusin', this);
					},
					'focusout':function(e){
						var val = $input.val();
						$this.removeClass('focus');

						if(val !== ''){
							//validateIS = true;
							$this.addClass('value');
						}else{
							//validateIS = false;
							$this.removeClass('value');
						}

						_self.fireEvent('focusout', this);
					},
					'keyup':function(e){
						$this.addClass('value');
						_self.fireEvent('keyup', this, [$(this).val()]);
					},
					'keydown':function(e){
						$this.addClass('value');
						_self.fireEvent('keydown', this, [$(this).val()]);
					},
					'change':function(e){
						var val = $input.val();

						_self.fireEvent('change', this, [$(this).val()]);
					}
				});

				return this;
			},
			getValue:function(){
				return $input.val();
			},
			setValue:function(val){
				$input.val(val);
			},
			getThis:function(){
				return $input;
			},
			getValidateChk:function(){
				if(opt.required){
					this.setErrorLabel();

					if($input.val() !== '' && $input.val().length > minLength){
						validateIS = true;
					}else{
						validateIS = false;
					}

					return validateIS;
				}else{
					return true;
				}
			},
			setErrorLabel:function(message){
				$label.text(message||opt.errMsg).addClass('err');
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_textarea'] = {
		constructor:InputTxtArea,
		reInit:true,
		attrName:'data-component-textarea'
	}
})(Core);

(function(Core){
	var ResisterExtends = function(){
		'use strict';

		var $this, args;
		var setting = {
			selector:'[data-component-register-extends]'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				args = arguments[0];
				$this = $(setting.selector);

				Core.getComponents('component_textfield', {context:$this}, function(i){
					this.addEvent('focusout', function(){
						if($(this).attr('id') === 'emailAddress'){
							$this.find('input[name=userId]').val($(this).val());
						}
					});
				});

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_register_extends'] = {
		constructor:ResisterExtends,
		reInit:true,
		attrName:'data-component-register-extends'
	}
})(Core);

(function(Core){
	var InputRadio = function(){
		'use strict';
		var setting = {
			selector:'[data-component-radio]',
			attrName:'data-component-radio',
			container:'.input-radio',
			label:'label',
			radio:'input[type=radio]',
			unlock:false
		};

		var rtnOption = function(container, key, data){
			var ableRestrict = false;
			/*
			if (Core.Utils.url.getUri(Core.Utils.url.getCurrentUrl()).queryParams.accepted === 'true') {
				ableRestrict = true;
			}
			*/
			var restrictState = _.keyBy(data, 'restrictState');
			if (restrictState.LOGIN_REQUIRED != null || restrictState.PASSED != null || restrictState.RESTRICTED != null ){
				ableRestrict = true;
			}

			// 하나라도 걸려있으면 모두 재고가 있는것들은 모두 lock
			// 재고가 없는건 disable 

			data.forEach(function(data, i){
				if(data.inventoryType != 'UNAVAILABLE'){
					var state = '';
					if (data.restrictState === 'PASSED' ){
						state = 'PASSED';
					}else{
						if(data.inventoryType === 'ALWAYS_AVAILABLE' || null){
							state = 'PASSED';
						}else if(data.inventoryType === 'CHECK_QUANTITY'){
							if(opt && opt.uiType === 'pdp'){
								if(data.quantity === 0 && opt.quantityOption === 'restock'){
									// 수량이 없고 재입고 알림을 사용 할 수 있는 경우
									state = 'PASSED';
								} else if(opt.quantityOption !== 'restock' &&(data.quantity > 0 || data.quantity == null)){
									// 수량이 있고 재입고 알림이 아닌 경우
									state = 'AVAILABLE';
								}
							}
						}
						// 정상적으로 판매 될수 있는 상품 인데 구매제한이 걸리면 rock 아니면 pass
						if (state === 'AVAILABLE') {
							state = (ableRestrict === false) ? 'PASSED' : 'LOCK';
						}
					}

					if (state !== ''){
						enableItem(container, key, data, state);
					}
				}
			});
		}

		var enableItem = function(container, key, data, state){
			container.find(setting.radio).each(function(i){
				if($(this).val() == data[key]){
					if(state === 'PASSED'){
						$(this).removeAttr('disabled').parent().removeAttr('disabled').removeClass('disabled');
						if(opt && opt.uiType === 'pdp'){
							$(this).parent().find(setting.label).removeClass('sd-out');
						}
					}else if(state === 'LOCK'){
						$(this).siblings().empty().addClass('ns-ic-login2 member-lock');
					}
				}
			});
		}

		var $this, $label, $radio, $container, eventID, firstInit = false, opt, isValidate = false;

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				//console.log(arguments);
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;

				$this = $(setting.selector);
				$container = $this.find(setting.container);
				$label = $container.find(setting.label);
				$radio = $container.find(setting.radio);
				if(!opt) opt = arguments[0]||{};

				$label.off('click').on('click', function(e){
					e.preventDefault();
					//모바일 상품정렬 태깅 추가
					var st =$(this).attr('st');
					if(st != "undefined")	{
						if(st=="F") {
							var obj_val = "";

							switch( $(this).attr('for') ){
							case 'sort1':
								obj_val = "default";
										break;
								case 'sort2':
									obj_val = "price+desc";
									break;
								case 'sort3':
									obj_val = "price+asc";
										break;
							}

							var data ={};
							data.name  = "sort";
							data.value =  obj_val;
							endPoint.call('changeSelect', data);

						} else if(st=="S"){//매장 픽업 사이즈 옵션

							var data ={};
								data.name  = "Size Run Selection";
								data.page_event = {size_run_select : true}
								data.size_run_availability	="";
								data.size_run_selection =  $(this)[0].innerText;

							endPoint.call('pickupsizeClick', data);
						};
					}
		    		//-----------------------------------------------
					_self.fireEvent('click', this, [$(this).siblings()]);
					if(!$(this).parent().hasClass('disabled')){
						if($(this).siblings().prop('checked') && setting.unlock){
							$(this).siblings().prop('checked', false);
							$(this).parent().removeClass('checked');
							return;
						}

						$(this).siblings().trigger('click');
					}
					/* CUSTOM 삭제 */
				});

				/* CUSTOM 삭제 */


				$container.off('click').on('click', function(){
					//PDP SIZE (optionGridType)
					if(opt && opt.uiType === 'pdp'){
					    _self.fireEvent('click', this, [$(this).siblings()]);
						if(!$(this).attr('disabled')){
							$(this).parent().find(setting.label, setting.radio).each(function(){
								//기존에 선택된 사이즈 해지
								$(this).removeClass('selected');
								$(this).prop('checked', false);
							});
							$(this).find(setting.label).addClass('selected');
							$(this).find(setting.radio).prop('checked', true);
							$(this).find(setting.radio).trigger('change');
						}
					}
					/* CUSTOM 삭제 */
				})

				$radio.off('change').on('change', function(){
					if($(this).prop('checked')){
						isValidate = true;
						$(this).parent().addClass('checked').siblings().removeClass('checked');
						$(this).siblings().attr('checked');

						switch(opt.eventType || 'step'){
							case 'step':
								_self.fireEvent('change', this, [$(this).attr('data-value'), $(this).val(), $(this).attr('data-id'), $(this).attr('data-friendly-name')]);
								break;
							case 'normal':
								_self.fireEvent('change', this, [$(this).val()]);
								break;
						}
					}
				});

				// 기본 선택값 처리
				$radio.each(function(i){
					var $this = $(this);
					if($this.prop('checked')){
						setTimeout(function(){
							$this.trigger('change');
							_self.fireEvent('init', $this);
						});
					} else if($(this).parent().hasClass('checked')){
						//CART 배송 방법(주문배송비/기본배송비) 기본 체크 처리
						setTimeout(function(){
							$this.trigger('click');
							_self.fireEvent('init', $this);
						});
					}
				});

				return this;
			},
			receiveToData:function(option, skuData){
				isValidate = false;
				rtnOption($container, option.type, skuData);
			},
			reInit:function(){
				this.init();
				/*$container;
				$container.each(function(i){
					$(this).removeClass('checked').find('input[type=radio]').removeAttr('checked');
				});*/
			},
			disabled:function(){
				$container.each(function(i){
					$(this).removeClass('checked').addClass('disabled').find('input[type=radio]').removeAttr('checked').attr('disabled', 'disabled');
				});
			},
			trigger:function(value, valueId){
				$radio.each(function(){
					if($(this).val() == valueId){
						$(this).trigger('click');
						return false;
					}
				});
			},
			getValidateChk:function(){
				if(opt.required){
					return isValidate;
				}else{
					return true;
				}
			},
			getThis:function(){
				return $this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_radio'] = {
		constructor:InputRadio,
		attrName:'data-component-radio',
		reInit:true
	}
})(Core);

(function(Core){
	var Personalize = function () {
        'use strict';

        var $this, 
            args,
            endPoint;

		var setting = {
		    selector:'[data-component-personalize]'
		}

        var Closure = function(){}

		Closure.prototype.setting = function () {
			var opt = Array.prototype.slice.call(arguments).pop();
			$.extend(setting, opt);
			return this;
		}

		Closure.prototype.init = function () {
			var _self = this;

			args = arguments[0]; 
            $this = $(setting.selector);
            

            // 하드코딩 영역(DOM)에 상품 정보 바인딩하기
            // /kr/ko_kr 경로 테스트 서버마다 다를 수 있음
            $this.find('[data-personalize]').each(function (i, ele) {
                var _program = $this.closest('.data-component-program-area')
                var _personalize = $(ele).data('personalize')
                
                // 상품 가격 
                $('[data-product-price-' + (i + 1) + ']')
                .text(_program.find('[data-id="' + (i + 1) + '"]').text());
                
                // 상품 타이틀 
                $('[data-product-title-' + (i + 1) + ']')
                .text(_personalize.name);
                
                // 상품 서브 타이틀 
                $('[data-product-subtitle-' + (i + 1) + ']')
                .text(_personalize.subtitle);
                
                // 상품 URL 
                $('[data-product-url-' + (i + 1) + ']')
                .attr('href', '/kr/ko_kr' + _personalize.url);

                // 상품 대표 이미지 
                $('[data-product-img-' + (i + 1) + ']')
                .attr('src', '/kr/ko_kr' + _personalize.img);
            })


            endPoint = Core.getComponents('component_endpoint');

			return this;
        }
        
        Core.Observer.applyObserver(Closure);
		return new Closure();
    }
        
	Core.Components['component_personalize'] = {
        constructor: Personalize,
        reInit: true,
		attrName: 'data-component-personalize'
	}
})(Core);



(function(Core){
	var InputColor = function(){
		'use strict';
		var setting = {
			selector:'[data-component-color]',
			attrName:'data-component-color',
			container:'#product-option_color',

		}
        var opt, $this, $container, endPoint;

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				opt = arguments[0]||{};

				$this = $(setting.selector);
				endPoint = Core.getComponents('component_endpoint');

				//show tool tip 
				$this.find('.input-radio').each(function(){
					$(this).mouseenter(function(){
						if($(this).find('.tooltip-pos').length){
							$(this).find('.tooltip-pos').show();
						};
					});

					$(this).mouseleave(function(){
						if($(this).find('.tooltip-pos').length){
							$(this).find('.tooltip-pos').hide();
						};
					});

					$(this).on('click', function(e){
						e.preventDefault();
						if( $(this).hasClass('checked') == false){
							endPoint.call('pdpColorClick', {'model': $(this).data('model')});
							window.location.href = $(this).attr("href");
						}
					})
					
				});
				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_color'] = {
		constructor:InputColor,
		attrName:'data-component-color',
		reInit:true
	}
})(Core);

(function(Core){
	var WishListBtn = function(){
		'use strict';

		var $this, args, endPoint;
		var setting = {
			selector:'[data-component-mobileaddtohome]',
			activeClass:'active'
		}

		var faviconFlag = true; // 시작화면 파비콘 노출여부(3초후 클로즈)
		var cookiesDelFlag = false; // 쿠키 삭제여부
		var IS_APP = navigator.userAgent.indexOf('/NKPLUS') != -1; // 인앱상태 여부
		var displayFavorite = false; 
		var closeTimeoutVar; //클리어에 사용될 변수

		// console.log('document.domain:', document.domain);
		//각종 함수 s
		// 쿠키중 파비콘 관련 쿠키의 시간이 다된것이 있다면 삭제한다.
		function fn_faviconCookieService(){
			if(cookiesDelFlag === "true"){
				deleteCookie("snkrsfavicon30day");
				deleteCookie("snkrsfavicon3sec");
			}
			if(faviconFlag === true){
				setTimeout(function(){fn_favicon3secCloseService();}, 3000);
			}
		}
		// 이 펑션을 사용할 경우 30일의 재사용 대기시간을 설정한다.
		function fn_faviconCloseService(){
			setCookieTimeover( "snkrsfavicon30day", 2592000000, 2592000000 ); // 2592000000
			favicon_layer_close();
		}

		// 페이지 종료시 사라지는 쿠키
		function fn_favicon3secCloseService(){		
			setCookieTimeover( "snkrsfavicon3sec", 0, 0 );
			favicon_layer_close();
		}
		//파비콘 팝업 닫기
		function favicon_layer_close(){
			// document.getElementById(favicon_layer).style.display = "none";
			$('#favicon_layer').hide();
		}
		/**
		* 쿠키 설정
		* @param cookieName 쿠키명
		* @param cookieExpireDate 쿠키값(유효날짜)
		* @param expireDay 쿠키 유효날짜
		*/
		function setCookieTimeover( cookieName, cookieExpireDate, expireDate )
		{
			var today = new Date();
			var milliSec = today.getTime() + cookieExpireDate;
			today.setTime(today.getTime() + parseInt(expireDate));
			if(expireDate === 0){
				document.cookie = cookieName + "=" + escape( milliSec ) + "; path=/;";
			}else{
				document.cookie = cookieName + "=" + escape( milliSec ) + "; path=/; expires=" + today.toGMTString() + ";";
			}
		}
		// 쿠키 호출
		function getCookie( cookieName ){
			var search = cookieName + "=";
			var cookie = document.cookie;
			if( cookie.length > 0 ){
				startIndex = cookie.indexOf( cookieName );
				if( startIndex != -1 ){
					startIndex += cookieName.length;
					endIndex = cookie.indexOf( ";", startIndex );
					if( endIndex == -1) endIndex = cookie.length;
					return unescape( cookie.substring( startIndex + 1, endIndex ) );
				} else {
					return false;
				}
			} else { 
				return false;
			}
		}
		// 쿠키 삭제
		function deleteCookie( cookieName ){
			var expireDate = new Date();
			expireDate.setDate( expireDate.getDate() - 1 );
			document.cookie = cookieName + "= " + "; expires=" + expireDate.toGMTString() + "; path=/";
		}

		// 홈화면 바로가기 추가 레이어
		function fn_homeDisplayAdd(){
			smartskin_HomeButtonAdd('SNKRS','');/* \n */

			try{
				var userAgent = navigator.userAgent.toLowerCase(); // 접속 핸드폰 정보 
				if(userAgent.match('android')) { 
					fbq('track', 'addTohome', {content_name: 'SNKRS'});  
				}						
			}catch(e){}		
		}
		// 홈화면 바로가기 추가 텍스트
		function fn_homeDisplayAddText(){
			smartskin_HomeButtonAdd('SNKRS','');/* \n */
	
			try{
				var userAgent = navigator.userAgent.toLowerCase(); // 접속 핸드폰 정보 
				if(userAgent.match('android')) { 
					fbq('track', 'addTohome', {content_name: 'SNKRS'});  
				}						
			}catch(e){}			
		}
		function smartskin_HomeButtonAdd(title,code){
			if(phoneTypeChk() !== false){
				var sm_HomeButtonTitle = title;
				var sm_LogAnalysisCode = code;
				var sm_HomeButtonTitle = encodeURI(sm_HomeButtonTitle);
				var sm_HomePageUri = 'https://' + document.domain + '/launch';
				// var sm_WebRootPathUri = "https://"+document.domain;
				var userAgent = navigator.userAgent.toLowerCase(); // 접속 핸드폰 정보 
				var iconurl = $('link[rel="shortcut icon"]').attr("href");
				if(userAgent.match('iphone')) { 
					iconurl = $('link[rel="apple-touch-icon-precomposed"]').attr("href");
				} else if(userAgent.match('ipad')) { 
					iconurl = $('link[rel="apple-touch-icon-precomposed"]').attr("href");
				} else if(userAgent.match('ipod')) { 
					iconurl = $('link[rel="apple-touch-icon-precomposed"]').attr("href");
				}
				var sm_naver_customUrlScheme= "intent://addshortcut?url="+sm_HomePageUri+"%3F"+sm_LogAnalysisCode+"&icon="+iconurl+"&title="+
				sm_HomeButtonTitle+"&oq="+sm_HomeButtonTitle+"&serviceCode=nstore&version=7#Intent;scheme=naversearchapp;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.search;end";
				var sm_UserAgent = navigator.userAgent.toLowerCase();
				var sm_BlockDevice1 = sm_UserAgent.indexOf("iphone");
				var sm_BlockDevice2 = sm_UserAgent.indexOf("ipad");
				var sm_BlockDevice = sm_BlockDevice1 + sm_BlockDevice2;
				if(sm_BlockDevice == -2){
					location.href = sm_naver_customUrlScheme;				
				}else{					
					fn_favoriteShow();
				}	
			
				if(faviconFlag === true){
					setTimeout(function(){fn_favicon3secCloseService();}, 3000);
				}
			}
		}
		function phoneTypeChk(){
			var sAgent = navigator.userAgent,
			sWindowType = "win16|win32|win64|mac";
			try {
				if (sWindowType.indexOf(navigator.platform.toLowerCase()) === -1) {
					if (sAgent.match(/iPhone|iPad/i) !== null) {
						fn_favoriteShow();
						return false;
					} else if (sAgent.indexOf('Android') == -1) {
						return false;
					}
				} else {
					return true;
					// alert("모바일 기기에서만 지원되는 기능입니다.");
					// return false;
				}
			} catch(e) {}
				return true;
		}

		// 아이폰 홈화면 추가레이어 표기
		function fn_favoriteShow(){			
			if(displayFavorite === false){
				// document.getElementById('favorite_box').style.display="block";
				$("#favorite_box").show();
				displayFavorite = true;
				// 3초뒤 사라짐
				closeTimeoutVar = setTimeout(function(){fn_favoriteHide();}, 3000);
			}
		}

		// 아이폰 홈화면 추가레이어 숨김
		function fn_favoriteHide(){
			// document.getElementById('favorite_box').style.display="none";
			$("#favorite_box").hide();
			displayFavorite = false;
			clearTimeout(closeTimeoutVar);
		}

		//각종 함수 e

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				$this = $(setting.selector);
				
				//---------------------------------------//

				var userAgent = navigator.userAgent.toLowerCase(); // 접속 핸드폰 정보 
				// 모바일 홈페이지 바로가기 링크 생성 Icon-72.png Icon@2x.png
				if(userAgent.match('iphone')) { 
					$('link[rel="apple-touch-icon-precomposed"]').attr("href",'/cmsstatic/structured-content/1151/Icon@2x.png');
				} else if(userAgent.match('ipad')) { 
					$('link[rel="apple-touch-icon-precomposed"]').attr("sizes",'72x72');
					$('link[rel="apple-touch-icon-precomposed"]').attr("href",'/cmsstatic/structured-content/1151/Icon@2x.png');
				} else if(userAgent.match('ipod')) { 
					$('link[rel="apple-touch-icon-precomposed"]').attr("href",'/cmsstatic/structured-content/1151/Icon@2x.png');
				} else if(userAgent.match('android')) { 
					$('link[rel="shortcut icon"]').attr("href",'/cmsstatic/structured-content/1151/Icon-72.png');
				}

				$this.on('click', function(){
					fn_homeDisplayAddText();
				});
				
				//안드로이드 SNKRS 런칭캘린더를 <br/>홈 화면에 추가해보세요! 누름
				$('#add-favicon-to-home').on('click', function(){	
					fn_homeDisplayAdd();
				});

				//안드로이드 SNKRS 런칭캘린더를 <br/>홈 화면에 추가해보세요 의 닫기 아이콘
				$('#android-favicon-close').on('click', function(){
					fn_faviconCloseService();
				});
				//아이폰 SNKRS 런칭캘린더를 <br/>홈 화면에 추가해보세요 의 닫기 아이콘
				$('#apple-favorite-close').on('click', function(){
					fn_favoriteHide();
				});
				//------------------------------------//

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_mobileaddtohome'] = {
		constructor:WishListBtn,
		reInit:true,
		attrName:'data-component-mobileaddtohome'
	}
})(Core);

(function(Core){
	var InputCheckBox = function(){
		'use strict';

		var $this, $checkbox, $label, args, isValidate = false;
		var setting = {
			selector:'[data-component-checkbox]',
			checkbox:'input[type=checkbox]',
			label:'label',
			attrName:'data-component-checkbox'
		}

		var updateCheckbox = function($target){
			if($target.prop('checked')){
				isValidate = true;
				$target.parent().addClass('checked');
			}else{
				isValidate = false;
				$target.parent().removeClass('checked');
			}
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;

				$this = $(setting.selector);
				$label = $this.find(setting.label);
				$checkbox = $this.find(setting.checkbox);
				args = arguments[0]||{}

				$label.on('click', function(e){
					e.preventDefault();
					$(this).siblings().trigger('click');
				});

				$checkbox.on('change', function(){
					updateCheckbox( $(this) );
					_self.fireEvent('change', this, [$(this).is(":checked")]);
				});

				// 체크만 하고 이벤트를 실행 시키지 않아야 할 경우도 있어서 제거
				/*
				$.propHooks.checked = {
					set: function(elem, value, name) {
					var ret = (elem[ name ] = value);
						$(elem).trigger("change");
						return ret;
					}
				};
				*/

				// 스크립트로 체크 처리시 change 이벤트는 실행 하지 않고 모양만 변경 처리
				$.propHooks.checked = {
					set: function(elem, value, name) {
					var ret = (elem[ name ] = value);
						updateCheckbox( $(elem));
						return ret;
					}
				}

				$checkbox.trigger('change');
				return this;
			},

			getValidateChk:function(){
				if(args.required){
					if(!isValidate){
						//UIkit.modal.alert(args.errMsg);
						UIkit.notify(args.errMsg, {timeout:3000,pos:'top-center',status:'danger'});
					}
					return isValidate;
				}else{
					return true;
				}
			},
			getThis:function(){
				return $checkbox;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_checkbox'] = {
		constructor:InputCheckBox,
		attrName:'data-component-checkbox',
		reInit:true
	};
})(Core);

(function(Core){
	var LoginModal = function(){
		'use strict';

		var $this, args, endPoint;
		var setting = {
			selector:'[data-component-loginmodal]',
			activeClass:'active'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				// var _self = this;
				args = arguments[0];
				$this = $(setting.selector);
				//endPoint = Core.getComponents('component_endpoint');
				var useKakaoEventPopup = _GLOBAL.SITE_PROPERTY.USE_KAKAO_EVENT_POPUP;

				/* login */
				$this.click(function(e){
					e.preventDefault();
					var isPopup = $(this).data('is-popup');
					if (useKakaoEventPopup && isPopup!=true) {
						_.delay( function(){
							Core.Loading.hide();
							UIkit.modal('#kakao-sync-modal-login').show();
						}, 300)
					}else{
						// var _self = $(this);
						Core.getModule('module_header').setModalHide(true).setLogin(function(data){
							// console.log('callback');
							location.reload();
						});
					}
				});

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_loginmodal'] = {
		constructor:LoginModal,
		reInit:true,
		attrName:'data-component-loginmodal'
	}
})(Core);

(function(Core){
	var Gallery = function(){

		var $this, $galleryWrap, $zoomWrap, args, arrGalleryList=[],arrColorList=[], sliderComponent,sliderComponent2, endPoint;
		var setting = {
			selector:'[data-component-gallery]',
			galleryWrapper:'#product-gallery',
			zoomWrapper:'.pdp-gallery-fullview',
			zoomAppender:'.gallery-images'
		}

		var Closure = function(){}
		Closure.prototype.setting = function(){
			var opt = Array.prototype.slice.call(arguments).pop();
			$.extend(setting, opt);
			return this;
		}

		Closure.prototype.init = function(){
			var _self = this;

			args = arguments[0];
			$this = $(setting.selector);
			$galleryWrap = $this.find(setting.galleryWrapper);
			$zoomWrap = $this.find(setting.zoomWrapper);
			endPoint = Core.getComponents('component_endpoint');

			/*
				fireEvent 가 등록되기전에 호출하여 처음 이벤트는 발생하지 않는다 그래서 setTimeout으로 자체 딜레이를 주어 해결하였다.
				조금 위험한 방법아지만 해결방법을 찾기 전까지 사용해야 할꺼 같다.
			*/
			setTimeout(function(){
				_self.fireEvent('skuLoadComplete', _self, ['COMINGSOON']);
			});

			//pc일때
			var arrList = [];
			$galleryWrap.find('.image-list').each(function(i){
				var data = Core.Utils.strToJson($(this).attr('data-thumb'), true);
				var isImage = ($(this).find('img').size() > 0) ? true : false;
				var imgUrl = $(this).find('img, source').attr('src').replace(/\?[a-z]+/g, '');
				var pushIS = true;

				data.isImage = isImage;
				data.thumbUrl = imgUrl;

				/* 중복 이미지 처리 */
				for(var i=0; i < arrList.length; i++){
					if(arrList[i].thumbSort === data.thumbSort && arrList[i].thumbUrl === data.thumbUrl){
						pushIS = false;
						return;
					}
				}

				if(pushIS){
					arrList.push(data);
					arrGalleryList.push(data);
				}
			});

			//모바일일때
			var arrList2 = [];
			$("#product-option_color").find("a").each(function(){
				var data = {};
				var linkUrl = $(this).attr('href');
				var isImage = ($(this).find('img').size() > 0) ? true : false;
				var imgUrl = $(this).find('img').attr('src').replace(/\?[a-z]+/g, '');
				var pushIS = true;
				data.isImage = isImage;
				data.thumbUrl = imgUrl;
				data.linkUrl = linkUrl;

				if(pushIS){
				arrList2.push(data);
				arrColorList.push(data);
				}
			});


		//모바일 슬라이딩 상세 이미지 클릭시 zoom..
		var img_L = 0;
		var img_T = 0;
		var targetObj;

		function getLeft(o){
				 return parseInt(o.style.left.replace('px', ''));
		};
		function getTop(o){
				 return parseInt(o.style.top.replace('px', ''));
		};

		// 줌 이미지 close
		$("#jq_gallery_zoom .jq_gallery_zoom_close").on('click', function(){
		   $("#jq_gallery_zoom").hide();
		});


		$galleryWrap.on('click', '[data-product-image-list] [data-product-image]', function(){

			var str_img = $(this).attr('data-product-image');

				$("#jq_gallery_zoom").show();  // 줌 이미지 div
				$("#jq_gallery_zoom_img").attr('src', str_img+"?zoom");

				$('#jq_gallery_zoom_div').offset({    // 이미지 화면 중앙으로 조정....
							left: ($(window).width() - $("#jq_gallery_zoom_div")[0].clientWidth)/2,
							top: ($(window).height() - $("#jq_gallery_zoom_div")[0].clientWidth)/2
				});

		});

        //줌 이미지 터치 시작...
		$("#jq_gallery_zoom_div").bind('touchstart', function(e) {

				e.preventDefault();
				obj   = this;
				img_L = getLeft(obj) - event.touches[0].clientX;
				img_T = getTop(obj) - event.touches[0].clientY;

					//guide_t , guide_l 미 설정시 zoom 레이어가 화면 밖으로 나가는 현상 발생
					//이미지 사이즈, 화면 사이즈 계산해서 최대치 정의.

				guide_t = $(window).height()-$("#jq_gallery_zoom_img").height();
				guide_l = $(window).width()-$("#jq_gallery_zoom_img").width();

				//	 obj.style.left = "-500px";
				//	 obj.style.top  = "-500px";

				//	console.log("클릭T :  "+getTop(obj));
				//console.log("================= :  "+ event.touches[0].clientY);
				//console.log("-----------------:  "+ this.style.top);

				//줌 이미지 드래그 시작..
				this.addEventListener("touchmove",function(e){

					e.preventDefault();

					//console.log("클릭L :  "+img_L);
					//	console.log("클릭T :  "+img_T);

					var dmvx = parseInt(e.touches[0].clientX + img_L);
					var dmvy = parseInt(e.touches[0].clientY+ img_T);
					//$("#img").css('transform', 'translate('+dmvx+'px,'+ dmvy+'px)');

					if(dmvx < 0 &&     dmvx > $(window).width() - $('#jq_gallery_zoom_img').outerWidth() ){
					obj.style.left = dmvx +"px";
					};

					if(dmvy < 0   &&   dmvy > $(window).height() - $('#jq_gallery_zoom_img').outerHeight() ){
					obj.style.top = dmvy +"px";
					};

					//console.log("이동L :  "+event.touches[0].clientX );
					console.log("이동L :  "+ dmvx );
					console.log("이동T :  "+ dmvy );

					//	console.log("라스트L :  "+dmvx);
					//	console.log("라스트T :  "+dmvy);
				});
		});


			//pc 상세 이미지 zoom..
			$galleryWrap.on('click', '.image-list a', function(){
				endPoint.call('pdpImageClick');
				$('html').addClass('uk-modal-page');
				$('body').css('paddingRight', 15);
				$zoomWrap.addClass('show');
				//선택항 PDP 이미지 index에 맞게 줌 이미지 스크롤, object.offset.top 값이 좀 이상해서 일일히 계산함.
				var fullWrapper = $this.find('.pdp-gallery-fullview-wrapper');
				if ($galleryWrap.find('video').length) {
			    var imagelengt = arrGalleryList.length-1;
				} else {
					var imagelengt = arrGalleryList.length;
				}
				var eachHeight = fullWrapper.outerHeight()/imagelengt;
				var imageIndex = $(this).attr('href').replace('#', '');
				if ($galleryWrap.find('video').length) {
					var offsetTop = (eachHeight*parseInt(imageIndex-1));
				} else {
					var offsetTop = (eachHeight*parseInt(imageIndex));
				}

				$zoomWrap.animate({scrollTop : offsetTop}, 500, 'linear');
			});

			$zoomWrap.click(function(){
			//  if($('#quickview-wrap').length <= 0){
				$('html').removeClass('uk-modal-page');
				$('body').removeAttr('style');
			//  }
				$(this).removeClass('show');
			});

			//진입시 바로 모바일 pc,사이즈 체크
			var widthMatch = matchMedia("all and (max-width: 1023px)");
			if (Core.Utils.mobileChk && widthMatch.matches) {
				this.setThumb(args.sort);
				$("#product-option_color").hide();
			} else {
				this.setZoom(args.sort);
				$("#product-option_color").show();
			}
			
			//리사이징될때 실행 (오동작 체크 필요)
			$(window).resize(function() {
				if (Core.Utils.mobileChk && widthMatch.matches) {
					Closure.prototype.setThumb(args.sort);
					$("#product-option_color").hide();
				} else {
					Closure.prototype.setZoom(args.sort);
					$("#product-option_color").show();
				}
			});

			return this;
		}

		//pc인경우
		Closure.prototype.setZoom = function(sort){
			var _self = this;
			var appendTxt = '';
			var count = 0;
			var sortType = sort || args.sort;

			//console.log('arrGalleryList:' , arrGalleryList);
			var arrGalleryData = arrGalleryList.filter(function(item, index, array){
				if(item.thumbSort === sortType || item.thumbSort === 'null'){
				count++;
				return item;
				}
			});

			var thumbTemplate;
			if(args.type === 'snkrs'){
				thumbTemplate = Handlebars.compile($("#product-gallery-snkrs").html())(arrGalleryData);
			} else if(arrGalleryData.length > 3){
				thumbTemplate = Handlebars.compile($("#product-gallery-nike").html())(arrGalleryData);
			} else if ($galleryWrap.find('video').length){
				thumbTemplate = Handlebars.compile($("#product-gallery-nike").html())(arrGalleryData);
			} else {
				thumbTemplate = Handlebars.compile($("#product-gallery-nike-large").html())(arrGalleryData);
			}

			var zoomTemplate = Handlebars.compile($('#product-gallery-zoom').html())(arrGalleryData);

			$galleryWrap.empty().append(thumbTemplate);
			$zoomWrap.find(setting.zoomAppender).empty().append(zoomTemplate);
			$("#color-swipe").empty();
		}

		//모바일인경우
		Closure.prototype.setThumb = function(sort){
			var _self = this;
			var appendTxt = '';
			var count = 0;
			var sortType = sort || args.sort;
			var arrThumbData = arrGalleryList.filter(function(item, index, array){
				if(item.thumbSort === sortType || item.thumbSort === 'null'){
					count++;
					return item;
				}
			});

			var colorgalleryTemplate = Handlebars.compile($("#product-gallery-color-swipe").html())(arrColorList);
			var galleryTemplate = Handlebars.compile($("#product-gallery-swipe").html())(arrThumbData);
			var zoomTemplate = Handlebars.compile($('#product-gallery-zoom').html())(arrThumbData);

			$("#color-swipe").empty().append(colorgalleryTemplate);
			$galleryWrap.empty().append(galleryTemplate);
			$zoomWrap.find(setting.zoomAppender).empty().append(zoomTemplate);

			//사이즈 조정
			$galleryWrap.find(".swipe-wrapper").css('width','100%');
			$galleryWrap.find(".swipe-wrapper").find('li').css('min-width','auto');
			$("#color-swipe").find(".swipe-wrapper").find('li').css('min-width','auto');

			//PDP메인 상품이미지 화면 768px 미만일 때 슬라이더로 변환
			if(sliderComponent) sliderComponent.destroySlider();
			sliderComponent = Core.getComponents('component_slider', {context:$this, selector:'#product-gallery>div>.swipe-container'}, function(){
				this.addEvent('slideAfter', function($slideElement, oldIndex, newIndex){
					$galleryWrap.find('li').eq(newIndex).addClass('active').siblings().removeClass('active');
					jQuery('video').trigger('play');

					//사용자의 슬라이드 전환 이벤트 완료 후 이벤트 발생 부
					//trackEvent 요청 처리 2020-04-09 17:20:27 @pck
					var param = {};
						param.pdp_interactions = 'mobile image slide';
						param.page_event = {
							pdp_interaction : true
						}
					endPoint.call('pdpInteraction', param);
				});
				this.addEvent('slideClick', function($slideElement){
					var param = {};
					param.pdp_interactions = 'image selected';
					param.page_event = {
						pdp_interaction : true
					}
					endPoint.call('pdpInteraction', param);						
				});
			});

			//항목이 1개 초과일 경우에만 슬라이더 작동
			if( $("#color-swipe").find(".swipe-wrapper").find('li').length > 1 ){
				if(sliderComponent2) sliderComponent2.destroySlider();
				sliderComponent2 = Core.getComponents('component_slider', {context:$this, selector:'#color-swipe>div>.swipe-container'}, function(){
					this.addEvent('slideClick', function($slideElement){
						var param = {};
						param.pdp_interactions = 'colorway changed';
						param.page_event = {
							pdp_interaction : true
						}
						endPoint.call('pdpInteraction', param);						
					});
				});
			} else {
				$("#color-swipe ul").css({
					width: "145px"
				});
			}
		}


		// '1 사이즈' 노출 시 '사이즈가이드' 미노출
		// $('.size-grid-type [sizeno="size1"]').closest('.size-grid-type').addClass('sizeGuideNone');

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_gallery'] = {
		constructor:Gallery,
		attrName:'data-component-gallery'
	}
 })(Core);

(function(Core){
	var LaunchItem = function(){
		'use strict';

		var $this, args, endPoint;
		var setting = {
			selector:'[data-component-launchitem]'
		}

		var Closure = function(){}

		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;

				args = arguments[0];
				$this = $(setting.selector);
				endPoint = Core.getComponents('component_endpoint');

				// FEED IMAGES Lazy()
				// @pck 2020-10-26 호출 타이밍을 전체 카테고리 아이템 로드 후 로 변경
				//$('.launch-category .img-component').Lazy();

				// Launch 리스트 NOTIFY ME 버튼 노출
				if (!Core.Utils.mobileChk) {
					$this.find('.btn-box-notify')
						.mouseenter(function() {
							$this.find('.info-sect').addClass('opacity');
						})
						.mouseleave(function() {
							$this.find('.info-sect').removeClass('opacity');
						});
				}

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_launchitem'] = {
		constructor:LaunchItem,
		reInit:true,
		attrName:'data-component-launchitem'
	}
})(Core);

(function(Core){
	var FileUpLoad = function(){
		'use strict';

		var $this, $form, $inputFiles, $progress, $uploadBtn, currentIndex=0, args;
		var setting = {
			selector:'[data-component-file]',
			form:'#fileupload-form',
			inputFiles:'#input-file',
			uploadBtn:'[data-upload-btn]',
			maxLength:5
		}

		var setImgPreview = function(target){
			var _self = target;
			var _this = this;

			if($(this).val() === '') return false;
			Core.ui.loader.show();
			$form.ajaxSubmit({
				success:function(data){
					_.delay(function () {
						Core.ui.loader.hide();
						upImageResult.call(_self, data);
					}, 1000)
				},
				error:function(data){
					_.delay(function(){
						Core.ui.loader.hide();
						upImageResult.call(_self, data.responseJSON);
					}, 1000)
				}
			});
		}

		var upImageResult = function(data){
			if(data.result === true){
				this.fireEvent('upload', this, [data.fileName, data.fullUrl, data.realFileName]);
			}else if(data.result === 'error'){
				this.fireEvent('error', this, [data.errorMessage]);
			}else{
				this.fireEvent('error', this, ['전송을 실패하였습니다.']);
			}
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				args = arguments[0];
				$.extend(setting, args);
				var _self = this;
				var cUrl = Core.Utils.url.getCurrentUrl();
				var cQueryParams = Core.Utils.getQueryParams(cUrl);

				$this = $(setting.selector);
				$uploadBtn = $this.find(setting.uploadBtn);
				$inputFiles = $(setting.inputFiles);
				$form = $(setting.form);

				$uploadBtn.click(function(e){
					e.preventDefault();

					if(currentIndex >= Number(setting.maxLength)){
						_self.fireEvent('error', this, ['최대'+setting.maxLength+'개 까지만 업로드 가능합니다.']);
						return false;
					}

					//appView일때 toapp 호출
					var appVer = cQueryParams.appver || '';
					if(cQueryParams.deviceOs){
						if(cQueryParams.deviceOs.toLowerCase() === 'ios' || cQueryParams.deviceOs.toLowerCase() === 'and'){
							if(appVer.replace(/\./g, '') >= 120){
								location.href='toapp://attach?uploadUrl='+ location.origin + $form.attr('action') +'&mediatype=image&callback=Core.getModule("module_review_write").moduleConnect&imagecount=1';
							}else{
								console.log('app version - ' + appVer);
							}
						}
					}else{
						$inputFiles.trigger('click');
					}
				});

				$inputFiles.change(function(e){
					setImgPreview.call(this, _self);
				});

				return this;
			},
			setCurrentIndex:function(index){
				currentIndex = index;
			},
			setToappUploadImage:function(data){
				upImageResult.call(this, data);
			},
			plusCurrentIndex:function(){
				currentIndex++;
			},
			minusCurrentIndex:function() {
				currentIndex--;
			},
			currentIndex:function(){
				return currentIndex;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_file'] = {
		constructor:FileUpLoad,
		attrName:'data-component-file'
	}
})(Core);

(function(Core){
	var ForgotPasswordModal = function(){
		'use strict';

		var $this, args, endPoint;
		var setting = {
			selector:'[data-component-forgotpasswordmodal]',
			activeClass:'active'
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				// var _self = this;
				args = arguments[0];
				$this = $(setting.selector);
				//endPoint = Core.getComponents('component_endpoint');

				/* pop modal */
				$this.click(function(e){
					e.preventDefault();
					Core.getModule('module_header').setModalHide(true).popForgotPassword(function(data){
						location.reload();
					});
				});

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_forgotpasswordmodal'] = {
		constructor:ForgotPasswordModal,
		reInit:true,
		attrName:'data-component-forgotpasswordmodal'
	}
})(Core);

(function(Core){
	var EndPoint = function(){
		'use strict';

		var _self;
		var setting = {}


		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();

				$.extend(setting, opt);
				return this;
			},
			init:function(){
				_self = this;
				return this;
			}, 
			call:function( status, data ){
				//console.log('endpoint : ', status );
				_self.fireEvent(status, this, [data]);
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_endpoint'] = {
		constructor:EndPoint,
		reInit : true,
		attrName:'data-component-endpoint'
	}
})(Core);

(function(Core){
	var FilterCategory = function(){
		'use strict';
		var setting = {
			selector:'[data-component-filtercategory]',
			attrName:'data-component-filtercategory',
		}
		var opt, $this;
		var displayLiCnt=6;

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				opt = arguments[0]||{};
				$this = $(setting.selector);
				//리스트 숨김 처리
				if($this.find('.contents-side #two-depth-shoes').length > 0){
					var listLen = 0, hideMore, currentIndex;
					$this.find('#two-depth-shoes a').each(function(index){
						//현재 선택한 메뉴가 몇번째 메뉴인지 확인
						if($(this).attr('href')===opt.url){
							currentIndex = index;
						}
						listLen++;
					});

					if(displayLiCnt > listLen){
						//전체 리스트 개수가 6이하 이면 '더보기' 숨김. 리스트 모두 표시
						$this.find('#more').hide();
					} else {
						if(displayLiCnt > currentIndex){
							//현재 선택한 메뉴의 인덱스가 6미만이면 '더보기'표시 하고 인덱스 6부터는 리스트 숨김
							$this.find('#more').show();
							$this.find('#two-depth-shoes a').each(function(index){
								if(index >= displayLiCnt){
									$(this).hide();
								}
							});
						} else if(currentIndex >= displayLiCnt){
							//현재 선택한 메뉴의 인덱스가 6이상이면 '더보기' 숨기고 리스트를 모두 표시함
							$this.find('#more').hide();
						}
					}
				}

				//아이폰 에서 필터를 오픈후, 페이지 이동후 백 할경우 필터가 오픈되는 현상
				//카테고리 페이지 진입시 팔터를 일단 감춘다.
				if(!Core.Utils.mobileChk==false){
					$(".contents-side").hide();
					//console.log("aaaaa");
				}

				//더보기 누르면 리스트 모두 표시
				$this.find('#more').on('click', function(){
					$this.find('#more').hide();
					$this.find('#two-depth-shoes a').each(function(index){
						$(this).show();
					});
				});
				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_filtercategory'] = {
		constructor:FilterCategory,
		attrName:'data-component-filtercategory',
		reInit:true
	}
})(Core);

(function(Core){
	var CustomerAddress = function(){
		'use strict';

		var $this, args;
		var setting = {
			selector:'[data-component-customer-address]',
			selectBtn:'[data-customer-address-select-btn]',
			baseDom : '[data-customer-address]'
		}

		var getAddressInfoBySelect = function( $el ){
			var data = {};
			$el.closest(setting.baseDom).find('input[type=hidden]').each(function() {
				data[$(this).attr('name')] = $(this).val() || '';
			});
			return data;
		}
		var getAddressInfoByDefault = function(){
			var data = null;
			$this.find(setting.baseDom).each(function () {
				if (_.isEqual($(this).find('input[name="default"]').val(), 'true')) {
					data = getAddressInfoBySelect($(this));
				}
			})
			return data;
		}
		var removeAddress = function(id, callback){
			$.ajax({
				url: Core.Utils.contextPath + '/account/addresses/' + id,
				type: 'POST',
				data: { 'removeAddress': 'Remove', 'csrfToken' : $('input[name="csrfToken"]').val()},
				complete: function (data){
					// 해당 컨트롤러에서 에러확인이 안된는 상황이라 data를 넘기기는 하지만 의미는 없다.
					if (callback) {
						callback(data);
					}
				}
			})
		}

		var Closure = function(){}
		Closure.prototype = {
			getDefaultAddress: getAddressInfoByDefault,
			removeAddress: removeAddress,
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				args = arguments[0];
				$this = $(setting.selector);

				if( $this.find(setting.selectBtn).length == 0 ){
					return;
				}

				$this.find(setting.selectBtn).on('click', function(e){
					e.preventDefault();
					_self.fireEvent( 'select', this, [getAddressInfoBySelect( $(this) )]);
				});

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_customer_address'] = {
		constructor:CustomerAddress,
		attrName:'data-component-customer-address'
	}
})(Core);

/* CUSTOM 추가 */
(function(Core){
	var customModal = function(){
		'use strict';

		var $this, args, endPoint;
		var setting = {
			selector:'[data-component-custommodal]',
			activeClass:'active'
		}
		var customModal = $('[data-product-customuse]');
		setTimeout(function() {
		  customModal.find('#patch').addClass('active');
		}, 500);

		/* Adobe Script click-name nopatch 로 변경 */
		$('[data-product-customuse]').find('.input-radio').each(function(i){
			var customuseVal = $(this).find('[data-value]').data('value');
			if(customuseVal === '000000'){
				$(this).find('[data-value]').prev('label').attr('data-click-name', 'nopatch');
			}
		});

		var widthMatch = matchMedia("all and (max-width: 992px)");
		if (Core.Utils.mobileChk || widthMatch.matches) {
			var index = customModal.find('#patch>.customSelection>.input-radio').index();
			customModal.find('#patch>.customSelection').css('width', 156*index);
			$('body').addClass('scrollOff').on('scroll touchmove mousewheel', function(e){
				 e.preventDefault();
			});
		}
		var customViewswiper = new Swiper('#customView-swiper-container', {
			observer: true,
			observeParents: true,
			slidesPerView : 1,
			pagination: {
				el: '.swiper-pagination',
				clickable: true,
			},
			navigation: {
        nextEl: '.brz-swiper-next',
        prevEl: '.brz-swiper-prev',
      },
		});


		var customVal = '';
		var imgArray = $('label[name="customCodeModal"]');
		imgArray.each(function(index) {
			customVal = $(this).find('img').attr('customVal');
			$(this).find('.customName').text(customVal);
		});

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				return this;
			},
			init:function(){
				$this = $(setting.selector);
				$this.removeClass('uk-modal-close');

				/* pop modal */
				$this.click(function(e){
					e.preventDefault();
					//custom 값 없는 경우 메세지 처리
					var customKey;
					var customArray = $('input[name="customArray"]');
					for(var i=0; i<customArray.size(); i++){
						var customCode = customArray[i]['value'];
						if(i===2){
							customKey = customCode;
						}
					}
					//custom명 전달
					var customVal = '';
					var imgArray = $('label[name="customCodeModal"]');
					for(var i=0; i<imgArray.size(); i++){
						if( imgArray.eq(i).hasClass('selected') ){
							customVal = imgArray.eq(i).find('img').attr('customVal');
						}
					}
					//팝업창 선택완료 시 처리
					$('body').removeClass('scrollOff').off('scroll touchmove mousewheel');
					var cdnUrl = $('[data-cdnurl]').data('cdnurl');
					var customUrl = cdnUrl + '/cmsstatic/'+customVal+'.png';
					var customCheckArray = $('#customCheck').find('.input-radio');
					var checkAdd = 'N';
					for(var i=0; i<customCheckArray.size(); i++){
					    var curDataValue = customCheckArray.eq(i);
						var dataValue = curDataValue.find('input').attr('data-value');
						//선택추가
						if(checkAdd === 'N'){
							var length = customModal.find('#patch>.customSelection>.input-radio.checked').length;
							if(length > 0){
								if(customKey === dataValue || dataValue === undefined || dataValue === ''){
									$('#customCheck').find('.input-radio').removeClass('checked').find('label').removeClass('selected');
									curDataValue.parents('.size-grid-type').find('.customOption').show();
									curDataValue.show();
									curDataValue.find('label span img').attr('src', customUrl);
									curDataValue.find('input').attr('data-value', customKey);
									curDataValue.find('.customName').text(customVal);
									curDataValue.find('img').attr('customVal',customVal);
									curDataValue.find('img').attr('customKey',customKey);
									curDataValue.addClass('checked');
									curDataValue.find('label').addClass('selected');
									checkAdd = 'Y';
	               }
							}
						}
					}
					$this.addClass('uk-modal-close');
				});
				return this;
			}
		}
		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_custommodal'] = {
		constructor:customModal,
		reInit:true,
		attrName:'data-component-custommodal'
	}
})(Core);

(function(Core){
	var CategoryItem = function(){
		'use strict';

		var $this, $overlayTxt, $quickViewBtn, $hover, modal, args, endPoint, listElements;
		var setting = {
			selector:'[data-component-categoryitem]',
			overlayTxt:'.category-overlaytext',
			quickViewBtn:'.quick-btn',
			hover:'.action-hover'
		}

		var Closure = function(){}

		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;

				args = arguments[0];
				$this = $(setting.selector);
				endPoint = Core.getComponents('component_endpoint');
				$overlayTxt = $this.find(setting.overlayTxt);
				$quickViewBtn = $this.find(setting.quickViewBtn);
				$hover = $this.find(setting.hover);
				modal = UIkit.modal('#common-modal', {modal:false, center:true});
				modal.off('.uk.modal.categoryItem').on({
					'hide.uk.modal.categoryItem':function(){
						//console.log('categoryItem modal hide');
						$('html').removeClass('uk-modal-page');
						$('body').removeAttr('style');
					}
				});

				Core.getComponents('component_categoryslider', {context:$this}, function(){
					this.addEvent('sliderOver', function(imgUrl){
						// $this.find(args.imgWrapper).find('.a-product-image-colorway').addClass('on');
						$this.find(args.imgWrapper).find('.a-product-image-colorway').eq(0).attr('src', imgUrl);
						if ($(this).hasClass('registeredUserOnly')) {
							$this.find(args.imgWrapper).find('.member-only-badge').addClass('on');
						}
					});
					this.addEvent('sliderLeave', function(){
						// $this.find(args.imgWrapper).find('.a-product-image-colorway').removeClass('on');
						$this.find(args.imgWrapper).find('.member-only-badge').removeClass('on');
					});
				});

				$quickViewBtn.click(function(e){
					e.preventDefault();

					//var id = $(this).siblings().filter('input[name=productId]').attr('value');
					var target = $(this).attr('data-href');
					var url = $(this).siblings().filter('input[name=producturl]').attr('value');

					Core.Utils.ajax(url, 'GET', {quickview:true}, function(data){
						var domObject = $(data.responseText).find('#quickview-wrap');
						$(target).find('.contents').empty().append(domObject[0].outerHTML);
						$(target).addClass('quickview');
						Core.moduleEventInjection(domObject[0].outerHTML);
						modal.show();

						var $product = $(domObject[0].outerHTML);
						var productData = Core.Utils.strToJson( $product.find('[data-module-product]').data('module-product'), true );
						var data = {
							id : productData.productId,
							name : $product.find('[data-name]').data('name'),
							price : $product.find('[data-price]').data('price'),
							isDefaultSku : productData.isDefaultSku
						}
						//endPoint.call('quickView', {product : data})
					});
				});
				if(!Core.Utils.mobileChk){
					$this.on({
						'mouseenter':function(e){
							$this.addClass('hover');
						},
						'mouseleave':function(){
							$this.removeClass('hover');
						}
					});
				}

				$this.find('a').click(function(e){
					e.preventDefault();

					if( $(this).closest(".related-items").length > 0 ){

						// 추천상품 클릭시
						var param = {};
						var	index = $('a[productcategory]').index(this);
						param.productcategory = $(this).attr('productcategory');  //카테고리 추가
						param.product_id = $("input[name='productmodel']").eq(index).val();  // 모델명

						endPoint.call('crossSaleClick', param);

						window.location.href = $(this).attr('href') + '?fm=cs';

					} else if( $(this).closest(".customer-order").find('.product-item').length > 0 ){
						// 위시리스트 클릭시
						endPoint.call('wishlistClick');
						window.location.href = $(this).attr('href');
					}

					else{
						// 이미 로그인이 되어있으면 false로 세팅 됨
						var isRequiredLogin = $(this).data('required-login') || false;
						if(isRequiredLogin){
							$('#login-info-modal').find('[data-link-target]').attr('href', Core.Utils.contextPath+'/login?successUrl='+String($(this).attr('href')).replace(Core.Utils.contextPath,''));
							Core.ui.modal.open('login-info-modal', { modal:false});
							return;
						}

						// @pck 2020-11-26 강제 reinit 시 원 대상 컴포넌트의 args를 참조할 수 없으므로 다시 가져옴
						if(args == null) {
							args = Core.Utils.strToJson(
								$(this).closest('[data-component-categoryitem]').data('componentCategoryitem')
								, true);
						}

						sessionStorage.setItem('isHistoryBack', true);
						sessionStorage.setItem('categoryScrollTop', $(document).scrollTop());
						sessionStorage.setItem('categoryTarget', args.parentWrapper);
						sessionStorage.setItem('categoryPathname', location.href);
						sessionStorage.setItem('categoryList', $(args.parentWrapper)[0].innerHTML);

						var url = $(this).attr('href');
						setTimeout(function(){
							window.location.href = url;
						}, 300)
					}
				});

				// PW 리스트 NOTIFY ME 버튼 노출
				/*
				* @pck 2021-02-16 SNKRS _launchcategory.js 이미 존재함
				*
				$this.find('.item-notify-me').on('click', function (e) {
					var url = $(this).attr('url');

					Core.Utils.ajax(url, 'GET', {}, function (data) {
						$("#restock-notification").remove();

						var notifyPop = $(data.responseText).find('#restock-notification');
						$('body').append(notifyPop);
						Core.moduleEventInjection(data.responseText);
						var modal = UIkit.modal("#restock-notification");
						if (modal.isActive()) {
							modal.hide();
						} else {
							modal.show();
						}
					});
				});
				*/

				if(!Core.Utils.mobileChk){
					$hover.on('mouseenter', function(e){
						//$(this).addClass('over');
						//$(this).find("#item-color-opt").hide();
						$(this).find("#thumb-img-slider").show();
						//$(this).find("#riview-icon").show();
						if ($(this).find(".a-product-image-secondary").length && $(this).find(".a-product-image-primary").hasClass('active')) {
							$(this).find(".a-product-image-secondary").show();
							$(this).find(".a-product-image-primary").hide();
						}
					});

					$hover.on('mouseleave', function(e){
						//$(this).removeClass('over');
						//$(this).find("#item-color-opt").show();
						$(this).find("#thumb-img-slider").hide();
						//$(this).find("#riview-icon").hide();
						if ($(this).find(".a-product-image-secondary").length && $(this).find(".a-product-image-primary").hasClass('active')) {
							$(this).find(".a-product-image-primary").show();
							$(this).find(".a-product-image-secondary").hide();
						}
					});
				}

				$(".section-filter").parent().next(".item-list-less").removeClass("item-list-less");

				// @pck 2020-11-18 태깅 용 클릭 이벤트 추가 정의 *snkrs upcoming에서 list item들이 바인딩 되지 않는 이슈 있음
				$this.find('[data-tag-pw-rank-product-id]').click(function(e){
					// Tagging 순위 수집용 array 객체
					listElements = 	document.querySelectorAll('[data-tag-pw-list] [data-tag-pw-list-item]').length > 0 ?
						document.querySelectorAll('[data-tag-pw-list] [data-tag-pw-list-item]') : null;

					var tagPWRankProductId = this.dataset.tagPwRankProductId; //카테고리 상품 별 링크에 data-tag-pw-rank-product-id=MODEL_ID 추가 됨
					if(tagPWRankProductId == null)
						return false;

					if(tagPWRankProductId !== null) {
						if (listElements.length > 0) {
							var countIndex = 0;
							for(var i = 0; i < listElements.length; i++ ){
								if(listElements[i].querySelector('a') === this){
									countIndex = i + 1;
								}
							}

							var param = {};
							param.grid_wall_rank = countIndex;
							param.product_id = tagPWRankProductId;
							param.isSnkrsStory = $(this).data('is-snkrs-story');

							endPoint.call('pwProductClick', param);
						}
					}
				});

				return this;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_categoryitem'] = {
		constructor:CategoryItem,
		reInit:true,
		attrName:'data-component-categoryitem'
	}
})(Core);

(function(Core){
	var CategorySlider = function(){
		'use strict';

		var $this, modal, args, endPoint;
		var setting = {
			selector:'[data-component-categoryslider]'
        }

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				args = arguments[0];
                $this = $(setting.selector);
                
                //change category primary image
				$this.find('ul').on('mouseenter', 'li', function(e){
                    e.preventDefault();
                    var curImg = $(this).find("img").attr('src');
                    curImg = curImg.replace("thumbnail", "browse");
                    //$(this).closest(".action-hover").find(".item-imgwrap").children("img").attr('src',curImg);
                    
                    var primaryImg = $(this).parents('.a-product').find('.a-product-image-primary'); // primary 이미지
                    var secondaryImg = $(this).parents('.a-product').find('.a-product-image-secondary'); // hover 이미지
                    var extraImg = $(this).parents('.a-product').find('.a-product-image-extra'); // 컬러웨이 노출 이미지
                    var curImgLink = $(this).find('a').attr('href'); // 컬러웨이 상품 링크
                    var productLink = $(this).parents('.a-product').find('.a-product-image-link'); // 주 상품링크
                    var soldoutBadge = $(this).parents('.a-product').find('.product-soldout-badge'); // 품절배지

                    // 주 상품과 같은 상품이고 hover 이미지를 갖고 있을때 주 이미지에 active 클래스 추가(주 이미지 일때만 hover 노출 위해)
                    $(this).hasClass('checked') && secondaryImg.length ? primaryImg.addClass('active') : primaryImg.removeClass('active');

                    extraImg.show();
                    productLink.attr('href', curImgLink); // 주 링크를 컬러웨이 링크로 변경

                    // 상품이 품절인때 품절 배지 노출
                    $(this).hasClass('isSoldout') ? soldoutBadge.addClass('isActive') : soldoutBadge.removeClass('isActive');

                    _self.fireEvent('sliderOver', this, [curImg, primaryImg, secondaryImg, extraImg, curImgLink, productLink, soldoutBadge]);
                 });
                 
                // $this.find('ul').on('mouseleave', 'li', function(e){
                //     e.preventDefault();
                //     var curImg = $(this).find("img").attr('src');
				// 	curImg = curImg.replace("thumbnail", "browse");
                //     _self.fireEvent('sliderLeave', this, [curImg]);
                // });

                // var prdWidth = $('.a-product').width(); //상품 가로사이즈
                // var liWidth = $this.find('ul div li').width(); // 썸네일 li 가로 사이즈
                // var ulWrapper = $this.parents().find('.ulWrapper');

                var count = $this.find('ul').children().length;
                var extraNum = $this.find('.extraNum'); // 컬러웨이 상품 갯수
                if(count <= 5){
                    // $this.find("#btn_prev_smallthumb").hide();
                    // $this.find("#btn_next_smallthumb").hide();
                    extraNum.hide();
                }else{
                    extraNum.show();
                    extraNum.find('span').text(count - 5);
                    // $this.find("#btn_next_smallthumb").show();
                    // $this.find("#small_slider_curr_pos").val(0);
                    // $this.find("#small_slider_curr_page").val(1);
                    // ulWrapper.css('width', prdWidth - 15); // setul width

                    /*
                    var pageCnt = Math.trunc(count / 3);
                    if(count % 3 != 0){
                        $this.find("#small_slider_lastimg_cnt").val(count-(pageCnt*3));
                        pageCnt++;
                    }
                    $this.find("#small_slider_page_cnt").val(pageCnt);
                    */
                }

                // set ul width
                // $this.find('ul').each(function() {
                //     // $(this).width($(this).find('li').length * 45);
                //     // console.log(imgWidth[0].offsetWidth);
                //     $(this).width(imgWidth[0].offsetWidth - 15);
                // });
                
                /*
                $this.find("#btn_prev_smallthumb").click(function(){
                    var currPos = Number($this.find("#small_slider_curr_pos").val());
                    var currPage = Number($this.find("#small_slider_curr_page").val());
                    var pageCnt = Number($this.find("#small_slider_page_cnt").val());
                    var lastImgCnt = Number($this.find("#small_slider_lastimg_cnt").val());
                    var goSliderPos = currPos;
                    if(currPage == 1){
                        //console.log("Warning, first page !!!");
                        return false;
                    }
                    if(pageCnt == 2){
                            goSliderPos=0;
                    }else{
                        if(pageCnt == currPage){
                            if(lastImgCnt == 0)
                                goSliderPos = currPos - 183;
                            else
                                goSliderPos = currPos - 61*lastImgCnt;
                        }else{
                            goSliderPos = currPos - 183;
                        }
                    }
                    currPage--;
                    $this.find("#small_slider_curr_page").val(currPage);
                    $this.find("#small_slider_curr_pos").val(goSliderPos);
                    $this.find('ul').css("transform","translate( -"+goSliderPos+"px, 0px) translateZ(0px)");
                    $this.find('ul').css("transition-duration","0.5s");
                    if(currPage == 1){
                        $this.find("#btn_prev_smallthumb").hide();
                        // $this.find("#btn_next_smallthumb").show();
                        $this.find('.ulWrapper').removeClass('prevActive');
                    }
                    
                    //console.log("go this position ::: " + goSliderPos);
                })
                
                
                 $this.find("#btn_next_smallthumb").click(function(){
                    var currPos = Number($this.find("#small_slider_curr_pos").val());
                    var currPage = Number($this.find("#small_slider_curr_page").val());
                    var pageCnt = Number($this.find("#small_slider_page_cnt").val());
                    var lastImgCnt = Number($this.find("#small_slider_lastimg_cnt").val());
                    var goSliderPos = currPos;
                    if(currPage == pageCnt){
                        //console.log("Warning, last page !!!");
                        return false;
                    }
                    if((pageCnt-currPage) > 1 || ((pageCnt-currPage) == 1 && lastImgCnt == 0)){
                        goSliderPos=currPos+183;
                    }
                    if((pageCnt-currPage) == 1 && lastImgCnt != 0){
                        goSliderPos = currPos + 61*lastImgCnt;
                    }
                    currPage++;
                    $this.find("#small_slider_curr_page").val(currPage);
                    $this.find("#small_slider_curr_pos").val(goSliderPos);
                    $this.find('ul').css("transform","translate( -"+goSliderPos+"px, 0px) translateZ(0px)");
                    $this.find('ul').css("transition-duration","0.5s");
                    if(currPage == pageCnt){
                        $this.find("#btn_prev_smallthumb").show();
                        $this.find("#btn_next_smallthumb").hide();
                        $this.find('.ulWrapper').addClass('prevActive');
                    }
                    //console.log("next button, go this position ::: " + goSliderPos);
                })
                */
                
                return this;
			}
		}

		Core.Observer.applyObserver(Closure);
        return new Closure();
        
    }

	Core.Components['component_categoryslider'] = {
		constructor:CategorySlider,
		attrName:'data-component-categoryslider'
	}
})(Core);

 (function(Core){
	var CartItmeLen = function(){
		'use strict';

		var $this, args, itemCountComponent=null;
		var setting = {
			selector:'[data-component-cartitemlen]'
		}

		function mouseOver(e){
			if( this.isEmpty == false ){
				this.isOver = true;
			}
		}

		function mouseOut(e){
			this.isOver = false;
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				args = arguments[0];
				$this = $(setting.selector);
				
				itemCountComponent = new Vue({
					el:$this[0],
					data:{
						'isEmpty':(args.itemCount*1 > 0) ? false : true,
						'itemCount':args.itemCount*1,
						'isOver': false,
					},
					watch:{
						itemCount:function(){
							this.isEmpty = (this.itemCount > 0) ? false : true
						},
					},
					computed:{
						reverseIsEmpty:function(){
							return (this.isEmpty) ? false : true;
						}
					},
					methods:{
						mouseOver: mouseOver,
						mouseOut: mouseOut
					}
				});
				return this;
			},
			update:function(length, content){
				this.setItemLength(Number(length));
				if( itemCountComponent.$refs.summaryBody != null){
					itemCountComponent.$refs.summaryBody.innerHTML = content;
				}
			},
			getItemLength:function(){
				return itemCountComponent.itemCount;
			},
			setItemLength:function(itemLength){
				itemCountComponent.itemCount = itemLength;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_cartitemlen'] = {
		constructor:CartItmeLen,
		attrName:'data-component-cartitemlen'
	}
})(Core);

(function(Core){
	var addOnProduct = function(){
		'use strict';

		var $this, $addonListWrap, $msg, args, selectComponent = null, isRequired=false, forceDependent=false, isValidate=false, isFireEvent = true;
		var objChildItem={}; //single 만 됨
		var addOnListComponent = null;
		var addOnSelectComponent = null;
		var currentAddonIndex = 0;
		var setting = {
			selector:'[data-component-addon-product-option]',
			resultWrap:'.addon-wrap'
		}

		var addChildItem = function(key, skuData, requestChildItem){
			/*
				원상품 : 애드온 상품
					x_FORCED
					NONE
					1 : 1	EQUIVALENT			quantityComponent 추가 (수량체크는 원상품의 주문 수량만큼 추가가능) 인데 일단 수량 컴포넌트 삭제
					1 : x	PROPORTION			quantityComponent 추가 (relativeQuantity 값 만큼 추가가능)
					x : 1	PROPORTION_REV
			*/

			if(args['data-component-addon-product-option'].addOnListType === 'single'){
				objChildItem = {};
				addOnListComponent['items'] = [];
			}

			if(!objChildItem.hasOwnProperty(key)){
				skuData.isSubmit = args['data-component-addon-product-option'].isSubmit;
				skuData.privateId = key;
				objChildItem[key] = requestChildItem;
				addOnListComponent['items'].push(skuData);
				currentAddonIndex = addOnListComponent['items'].length - 1;
			}

			isValidate = true;
			if($msg.length > 0){
				$msg.text('');
			}
		}

		var addMessage = function(){
			if($msg.length > 0){
				$msg.text('상품을 선택해 주세요');
			}else{
				UIkit.notify('상품을 선택해 주세요', {timeout:3000,pos:'top-center',status:''});
			}
		}

		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				args = arguments[0];

				//sku 옵션생성
				$this = $(setting.selector);
				$addonListWrap = $this.find(setting.resultWrap);
				$msg = $this.siblings().filter('.tit').find('.msg');

				var $select = $this.find(setting.selector);
				var optionData = args['data-product-options'];
				var skuData = args['data-sku-data'];
				var skuOpt = [];
				var addOnProductType = args['data-component-addon-product-option'].addOnProductType;
				var relativeType = args['data-component-addon-product-option'].addOnRelativeType;
				var relativeQuantity = args['data-component-addon-product-option'].addOnRelativeQuantity;
				forceDependent = (args['data-component-addon-product-option'].forceDependent === 'true') ? true : false;
				isRequired = (args['data-component-addon-product-option'].isRequired === 'true') ? true : false;

				for(var i=0; i<skuData.length; i++){
					if(skuData[i].inventoryType !== 'UNAVAILABLE'){
						if(skuData[i].quantity === 'null' || skuData[i].quantity > 0 || skuData[i].inventoryType === 'ALWAYS_AVAILABLE'){
						    (function(){
						        var obj = {};
								obj['privateId'] = skuData[i].skuId;
								obj['name'] = args['data-component-addon-product-option'].name;
								obj['retailPrice'] = Core.Utils.price(args['data-component-addon-product-option'].retailPrice);
						        obj['salePrice'] = Core.Utils.price(args['data-component-addon-product-option'].salePrice);
								obj['isQuantity'] = (relativeType === 'PROPORTION' || relativeType === 'NONE' || relativeType === 'null') ? true : false;
	    						obj['quantity'] = (relativeQuantity > skuData[i].quantity || relativeQuantity === 'null' || relativeQuantity === '') ?
													(skuData[i].inventoryType === 'ALWAYS_AVAILABLE' ? 100 : skuData[i].quantity) : relativeQuantity;
	    						obj['selectedOptions'] = (function(index){
	    						    var arr = [];
	    						    skuData[index].selectedOptions.forEach(function(a, i){
										var obj = {};
	    						        obj[optionData[i].attributeName] = optionData[i]['values'][a];
										arr.push(obj);
	    						    });
									obj['options'] = JSON.stringify(arr);
	    							return arr;
	    						})(i);
								obj['opt'] = (function(index){
	    						    var arr = [];
	    						    skuData[index].selectedOptions.forEach(function(a, i){
										arr.push(optionData[i]['values'][a]);
	    						    });
	    							return arr;
	    						})(i).join(' / ');
	    						skuOpt.push(obj);
						    })();
						}
					}
				}

				addOnSelectComponent = new Vue({
					el:$this.find('.addon-select')[0],
					data:{
						'skuData':skuOpt
					},
					created:function(){
						var _vm = this;
						this.$nextTick( function(){
							selectComponent = Core.getComponents('component_select', {context:$this}, function(){
								//this.rePaintingSelect();
								this.addEvent('change', function(val, $selected, index){
									var requestChildItem = {};
									var privateId = $selected.attr('data-privateid');
									requestChildItem.productId = args['data-component-addon-product-option'].addonId;
									requestChildItem.quantity = 1;

									for(var i=0; i<_vm.skuData[index-1].selectedOptions.length; i++){
										for(var key in _vm.skuData[index-1].selectedOptions[i]){
											requestChildItem['itemAttributes['+ key +']'] = _vm.skuData[index-1].selectedOptions[i][key];
										}
									}

									addChildItem(privateId, _vm.skuData[index-1], requestChildItem);
									if(isFireEvent){
										_self.fireEvent('addToAddOnItem', this, [privateId, $selected]);
									}else{
										isFireEvent = true;
									}
								});
							});
						});
					},
					methods:{
						rtnItemInfo:function(itemName, opt){
							return (opt !== '') ? (itemName + ' - ' + opt) : itemName;
						}
					}
				});

				addOnListComponent = new Vue({
					el:$this.find('.addon-list-wrap')[0],
					data:{
						'items':[]
					},
					watch:{
						items:function(items){
							var _vm = this;
							this.$nextTick( function(){
								for(var i=0, size=items.length; i<size; i++){
									if(items[i].isQuantity && currentAddonIndex === i){
										Core.getComponents('component_quantity', {context:$(_vm.$refs['addonItem'][currentAddonIndex])}, function(){
											this.addEvent('change', function(qty){
												objChildItem[_vm.$refs['addonItem'][currentAddonIndex].getAttribute('data-privateid')].quantity = qty;
											});
										});
									}
								}
							});
						}
					},
					methods:{
						quantitySetting:function(quantity){
							return '{maxQuantity:'+ quantity +', msg:개 까지 구매가능 합니다., quantityStateMsg:상품의 수량이 없습니다.}';
						},
						itemDelete:function(index){
							this.items.splice(index, 1);
						}
					}
				});

				/* delete btn addEvent */
				$addonListWrap.on('click', '.btn-delete', function(e){
					e.preventDefault();

					var $parent = $(this).closest('.addon-state');
					var key = $parent.attr('data-privateId');
					$parent.remove();

					if(objChildItem.hasOwnProperty(key)){
						delete objChildItem[key];
						selectComponent.reInit();
					}

					if(Core.Utils.objLengtn() <= 0){
						isValidate = false;
					}

					_self.fireEvent('itemDelete', this, [key]);
				});

				/* isSubmit === true */
				$addonListWrap.on('click', '.btn-submit', function(e){
					e.preventDefault();
					_self.fireEvent('submit', this, [_self.getChildAddToCartItems()]);
				});

				return this;
			},
			setTrigger:function(privateId){
				isFireEvent = false;
				if(selectComponent) selectComponent.trigger(privateId, privateId);
			},
			getChildAddToCartItems:function(){
				var arrChildItem = [];
				for(var key in objChildItem){
					arrChildItem.push(objChildItem[key]);
				}

				return arrChildItem;
			},
			getValidateChk:function(){
				if((!isRequired || isRequired === 'null' ) && (!forceDependent || forceDependent === 'null')){
					isValidate = true;
				}else{
					if(!isValidate){
						addMessage();
					}
				}
				return isValidate;
			},
			getAddonId:function(){
				return args['data-component-addon-product-option'].addonId;
			},
			removeItems:function(){
				$addonListWrap.find('.btn-delete').trigger('click');
			},
			getAddOnOrderId:function(){
				return args['data-component-addon-product-option'].addOnOrderId;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	Core.Components['component_addon_product_option'] = {
		constructor:addOnProduct,
		attrName:['data-component-addon-product-option', 'data-product-options', 'data-sku-data']
	}
})(Core);

(function(Core){
	var Range = function(){
		var setting = {
			selector:'[data-component-range]',
			rangeBars:'.range-handler',
			rangeTrack:'.range-track',
			attrName:'data-component-range',
			componentName:'component_range'
		}

		var $this, $rangeBars, $track, args={}, minper=0, maxper=100, objSlider={}, eventID;


		var Closure = function(){}
		Closure.prototype = {
			setting:function(){
				var opt = Array.prototype.slice.call(arguments).pop();
				$.extend(setting, opt);
				return this;
			},
			init:function(){
				var _self = this;
				$this = $(setting.selector);
				$rangeBars = $this.find(setting.rangeBars);
				$track = $this.find(setting.rangeTrack);
				args = arguments[0];

				$rangeBars.each(function(i){
					var $this = $(this);
					var slider = Core.SliderBar.call(this, (function(){
						if($this.is('.min')){
							return {
								move:function(percent){
									if(percent > maxper) percent = maxper;

									$this.css('left', percent + '%');
									$track.css({
										'left':percent + '%',
										'width':(maxper - percent) + '%'
									});

									minper = percent;
									_self.fireEvent('change', $this[0], [minper]);
								},
								end:function(){
									$this.addClass('focus').siblings().filter('.max').removeClass('focus');
									_self.fireEvent('touchEnd', $this[0], [minper]);
								}
							}
						}else if($this.is('.max')){
							return {
								move:function(percent){
									if(percent < minper) percent = minper;

									$this.css('left', percent + '%');
									$track.css({
										'width':(percent - minper) + '%'
									});

									maxper = percent;
									_self.fireEvent('change', $this[0], [maxper]);
								},
								end:function(){
									$this.addClass('focus').siblings().filter('.min').removeClass('focus');
									_self.fireEvent('touchEnd', $this[0], [maxper]);
								}
							}
						}
					})());

					objSlider[i] = slider;
				});

				return this;
			},
			getSlide:function(name){
				return objSlider[name];
			},
			getArgs:function(){
				return args;
			}
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	};

	Core.Components['component_range'] = {
		constructor:Range,
		attrName:'data-component-range',
	}
})(Core);

(function(Core){
	Core.register('module_newsletter', function(sandbox){
		var $this, args, $submitBtn, endPoint;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				$submitBtn = $this.find('.btn_join')
				args = arguments[0];
				endPoint = Core.getComponents('component_endpoint');

				var modal = UIkit.modal('#common-modal');
				var checkboxComponent = sandbox.getComponents('component_checkbox', {context:$this});
				var inputComponent = sandbox.getComponents('component_textfield', {context:$this}, function(){
					this.addEvent('enter', function(e){
						$submitBtn.trigger('click');
					});
				});

				$submitBtn.click(function(e){
					e.preventDefault();
					var _self = this;

					var $form = $(_self).closest('form');
					var param = $form.serialize();

					if(inputComponent.getValidateChk() && checkboxComponent.getValidateChk()){
						sandbox.utils.ajax($form.attr('action'), $form.attr('method'), param, function(data){
							var response = sandbox.rtnJson(data.responseText);

							if(response.hasOwnProperty('isSuccess')){
								endPoint.call('newsletterSubscribed');
								UIkit.notify(args.successMsg, {timeout:3000,pos:'top-center',status:'success'});
							}else if(response.hasOwnProperty('error')){
								UIkit.notify(response.error, {timeout:3000,pos:'top-center',status:'success'});
							}

							inputComponent.setValue('');
							checkboxComponent.getThis().trigger('click');
						});
					}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-newsletter]',
					attrName:'data-module-newsletter',
					moduleName:'module_newsletter',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				console.log('newsLetter destory');
			}
		}
	});
})(Core);

(function(Core){
	'use strict';

	Core.register('module_slick_slider', function(sandbox){
		var Method = {
			moduleInit:function(){
				var args = Array.prototype.slice.call(arguments).pop();
				//Method.opts = args || {}

				// method.opts 로 정의되던 값을 data로 변경
				// module 단위는 개별 instance로 사용될 수 없어서 dom 기준으로 다시 처리
				// 추후 html에서 data로 처리 하던, component로 처리하던 하자

				for( var i in args ){
					$(this).data( i, args[i] );
				}
				Method.resizeEventList = [];
				Method.startSlider( $(this), Method.resizeEventList );
			},

			probablyMobile:function() {
				var Y = navigator.appVersion;
				var isAndroid = ( /android/gi ).test( Y );
				var isIOS = ( /iphone|ipad|ipod/gi ).test( Y );
				return ( isAndroid || isIOS || /(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test( navigator.userAgent ) );
			},

			getCssInt:function( $item, attr ) {
				var val = parseInt( (''+$item.css(attr)).replace('px',''), 10 );
				return isNaN(val) ? 0 : val;
			},

			// 고정 비율로 리사이즈 처리
			// 리사이즈시 성능 이슈가 있음..
			// 슬라이더의 배경이 보이고, 커짐.
			// 그리고 슬라이드 1번째가 아닌 경우 좌표를 재계산하느라 버벅임..
			// Slick.prototype.setPosition 참고..
			enableResponsiveResize:function( slick ) {
				var $slider = slick.$slider;

				var sliderWidth 	 = parseInt($slider.data('width'), 10);
				var sliderHeight 	 = parseInt($slider.data('height'), 10);
				var sliderMaxWidth 	 = typeof $slider.data('maxWidth') === 'undefined' ? 0 : parseInt($slider.data('maxWidth'), 10);
				var sliderResponseRate = sliderHeight / sliderWidth;
				var isFullWidth = $slider.data('fullWidth');
				// fade 가 아닌 경우 다시 받아야 함
				var $slideList = $slider.find('.slider-slide');
				var $sliderTrack = $slider.find('.slick-track');
				var $layerList = $slider.find('.slider-layer-position');
				var $layerContents = $slider.find('.slider-layer-content');
				var $item,tagName;
				$slideList.hide();

				//var w = $slider.width();
				//var w = $slider.parent().width();
				var w = $slider.parent().css({'transition':'none'}).innerWidth();

				// fullwidth 가 아닐때
				if( !isFullWidth ){
					// 가로 사이즈가 maxwidth를 못넘기도록 처리
					if( sliderMaxWidth !== 0 && sliderMaxWidth < w ) {
						w = sliderMaxWidth;
					}
				}

				var h = Math.ceil(sliderResponseRate * w);

				var itemWidth, itemHeight, itemPosition, itemStyle;
				$slider.css({width:w+'px',height:h+'px'});
				$slideList.css({width:w+'px',height:h+'px'});

				// console.log('brz_col-1of2' + ' = ' + $('.brz_col-1of2').first().innerWidth() );
				// console.log($slider.attr('id') + ' = ' + w);

				//Layer 비율에 의한 위치 이동
				$layerList.each(function( idx, item ){
					$item = $(item);
					itemWidth = $item.data('left');
					itemHeight = $item.data('top');
					//itemPosition = $item.position();
					// 좌표 % 선언시 고정 위치 환산하여 재계산 넣을거면 position 기반 환산 처리
					itemStyle = $item[0].style;
					if( itemWidth.indexOf('%') < 0 ) {
						itemWidth = parseInt(itemWidth.replace('px',''), 10);
						$item.css('left', Math.ceil(w * itemWidth / sliderWidth) +'px');
					}
					if( itemHeight.indexOf('%') < 0 ) {
						itemHeight = parseInt(itemHeight.replace('px',''), 10);
						$item.css('top', Math.ceil(h * itemHeight / sliderHeight) +'px');
					}
				});

				// layer 원본 비율 처리
				$layerContents.each(function( idx, item ){
					$item = $(item);
					tagName = ('' + item.tagName).toLowerCase();
					if( tagName == 'div' ) {
						$item.css('fontSize', Math.ceil(w * $item.data('fontSize') / sliderWidth) );
					} else if ( tagName == 'img' ) {
						$item.css('width', Math.ceil(w * $item.data('width') / sliderWidth) );
						$item.css('height', Math.ceil(h * $item.data('height') / sliderHeight) );
					}
				});


				// 리사이즈 버그 처리
				slick.setPosition();

				$slideList.show();
			},

			videoPause:function( slider ){
				var $video = slider.find('.slider-layer-content iframe');
				$.each( $video, function(){
					var src = $(this).attr('src');
					if( src.indexOf('youtube') > -1 ){
						$(this)[0].contentWindow.postMessage('{"event":"command", "func":"pauseVideo", "args":""}','*');
					}

					if( src.indexOf('vimeo') > -1 ){
						$(this)[0].contentWindow.postMessage('{"method":"pause"}','*');
					}
				})

			},

			resizeEvent:function( slick ){
				//console.time( 'resizeEvent' );
				var $slider = slick.$slider;
				var enableResponsive = $slider.data('enableResponsive');	// 고정비율 리사이즈 사용 처리 여부
				var hideOnMobile	 = $slider.data('hideOnMobile');		// 모바일 일때 숨김
				var hideUnder		 = $slider.data('hideUnder');			//
				var hideOver		 = $slider.data('hideOver');			//

				var isShow = true;
				if( hideOnMobile ) {
					isShow = isShow && (Method.probablyMobile() ? false  : true);
				}
				if( hideUnder !== 0 ) {
					isShow = isShow && ($slider.width() < hideUnder ? false  : true);
				}
				if( hideOver !== 0) {
					isShow = isShow && ($slider.width() > hideOver ? false  : true);
				}

				var $parent = null;

				if( $slider.parent().hasClass('content-container') ){
					$parent = $slider.parent();
				}

				if(isShow) {
					$slider.show();
					if( $parent != null ) $parent.removeClass('uk-margin-bottom-remove');
				} else {
					$slider.hide();
					Method.videoPause( $slider );
					if( $parent != null ) $parent.addClass('uk-margin-bottom-remove');
				}

				if( enableResponsive ) {
					setTimeout(function(){Method.enableResponsiveResize( slick );}, 0);
				}else {
					slick.$slides.show();
				}
				//console.timeEnd( 'resizeEvent' );
			},
			startSlider:function( $slider, resizeEventList ) {

				// admin setting 처리
				var $slideList = $slider.find('.slider-slide');
				var $layerList = $slider.find('.slider-layer-position');
				var $layerContents = $slider.find('.slider-layer-content');
				var $track = $slider.find('.slick-track');
				var sliderResponseRate = 0.4; // 최초 슬라이더 비율 (600/1500)

				// 슬라이더 배경 이미지
				if( $slider.data('backgroundImage') != 'null' ) {
					$slider.css('background-image', 'url(' + $slider.data('backgroundImage') +')');
				}

				var enableResponsive = $slider.data('enableResponsive');	// 고정비율 리사이즈 사용 처리 여부
				var autoplay 		 = $slider.data('startSlideShow'); 		//
				var sliderWidth 	 = parseInt($slider.data('width'), 10); 				//
				var sliderHeight 	 = parseInt($slider.data('height'), 10); 				//
				var sliderMaxWidth 	 = typeof $slider.data('maxWidth') === 'undefined' ? 0 : parseInt($slider.data('maxWidth'), 10);
				if( sliderMaxWidth !== 0 && sliderMaxWidth < sliderWidth ) {
					sliderWidth = sliderMaxWidth;
				}
				var $item, tagName, $video;
				var baseWidth;

				if ( enableResponsive ) {
					sliderResponseRate = sliderHeight / sliderWidth;
					baseWidth = $slider.parent().width();
					$slider.data("base-width", baseWidth);
					$slider.css({width:baseWidth+'px',height:Math.ceil(sliderResponseRate * baseWidth)+'px'});
				} else {
					$slider.css({width:sliderWidth+'px',height:sliderHeight+'px'});
					$slideList.css({width:sliderWidth+'px',height:sliderHeight+'px'});
				}

				// layer 원본 사이즈 data 기록
				$layerContents.each(function( idx, item ){
					$item = $(item);
					tagName = ('' + item.tagName).toLowerCase();
					$video = $item.find('iframe');
					$.each( $video, function(){
						var src = $(this).attr('src');
						if( src.indexOf('youtube') > -1 ){
							var param = {
								enablejsapi : 1,
								rel : 0
							}
							$(this).attr('src', Core.Utils.url.appendParamToURL($(this).attr('src'), 'enablejsapi', 1));
							$(this).attr('src', Core.Utils.url.appendParamToURL($(this).attr('src'), 'rel', 0));
						}
						if( src.indexOf('vimeo') > -1 ){
							$(this).attr('src', Core.Utils.url.appendParamToURL(src, 'api', 1));
						}
						console.log( $(this).attr('src') );
					})

					if( tagName == 'div' ) {
						$item.data('font-size', Method.getCssInt($item, 'fontSize'));
					} else if ( tagName == 'img' ) {
						if( typeof $item.data('width') === 'undefined' ) {
							$item.data('width', Method.getCssInt($item, 'width'));
						} else {
							$item.data('width', $item.data('width').replace('px',''));
						}
						if( typeof $item.data('height') === 'undefined' ) {
							$item.data('height', Method.getCssInt($item, 'height'));
						} else {
							$item.data('height', $item.data('height').replace('px',''));
						}
					}
					//  else {
					// 	// $item.find("img");
					// 	// $item.data('width', Method.getCssInt($item, 'width'));
					// 	// $item.data('height', Method.getCssInt($item, 'height'));
					// }
				});

				resizeEventList.push(Method.resizeEvent);


				var _slider = $slider.slick({
				    autoplay 		: autoplay,										// 자동 시작 여부
				    autoplaySpeed 	: 4000, 										// slide 넘어가는 속도   			=> slide 별 , slide.slideDuration
				    initialSlide	: $slider.data('startWithSlide'),				// 시작 슬라이드 번호
				    rtl 			: $slider.data('twoWaySlideShow'),				// 슬라이더 방향 전환 (right to left)
				    accessibility 	: $slider.data('keyboardNavigation'),			// 키보드 방향 전환 - Enables tabbing and arrow key navigation
				    draggable 		: true,											// Enables desktop dragging
				    swipe 			: $slider.data('touchNavigation'),				// 터치 방향 전환 - Enables touch swipe
				    touchMove 		: $slider.data('touchNavigation'),				// 터치 방향 전환 - Enables slide moving with touch
				    infinite		: true,											// 반복될 방향으로 무제한 이동 , false 인 경우 1,2,3,2,1,2,3  순으로 이동
				    fade 			: true,											// 넘김시 fade 효과 사용
				    speed 			: $slider.data('fadeDuration'),					// 장면이 변하는 속도 (애니메이션 처리 속도) Slide/Fade animation speed
				    arrows  		: $slider.data('showPrevNextButton'),			// 좌, 우 버튼 노출 여부
				    dots: true,														// 하단 네비게이션 컨트롤바
				    easing:'linear',
				    waitForAnimate: false,
				    slidesToShow: 1,
				    adaptiveHeight: false,
				    prevArrow:'<button type="button" class="slick-prev slick-arrow"><i class="icon-arrow_left"></i></button>',
				    nextArrow:'<button type="button" class="slick-next slick-arrow"><i class="icon-arrow_right"></i></button>'
				});

				var limitLoopCount = 0;
				if( $slider.data('forceStopAfterLoop') == true ){
					limitLoopCount = $slider.data('loops');
				}

				var loopCount = 0;
				if( limitLoopCount > 0 ) {
					_slider.on('afterChange', function(event, slick, currentSlide, nextSlide){
						if( currentSlide === slick.slideCount-1 ){
							loopCount++;
							if( loopCount >= limitLoopCount) {
								slick.paused = true;
							}
						}
					});
				}

				if( $slider.data('pauseOnHover') && autoplay ) {
					_slider.mouseenter(function(){_slider.slick('slickPause');}).mouseleave(function(){
						if(limitLoopCount < 1 || loopCount<limitLoopCount){_slider.slick('slickPlay');}
					});
				}

				if( $slider.data('showPrevNextButtonOnHover') ) {
					var arrowBtns = _slider.find(".slick-arrow").hide();
					_slider.mouseenter(function(){arrowBtns.show();}).mouseleave(function(){arrowBtns.hide();});
				}


				var naviDots = _slider.find(".slick-dots").hide();
				if( $slider.data('showSlideNavigationButton') ) {
					naviDots.show();
				} else {
					if( $slider.data('showSlideNavigationButtonOnHover') ) {
						_slider.mouseenter(function(){naviDots.show();}).mouseleave(function(){naviDots.hide();});
					}
				}

				_slider.on('beforeChange', function(event, slick, currentSlide, nextSlide){
					Method.videoPause(slick.$slider);
					var $thumb = $(this).parent().find(".slider-thumb ul>li");
					if( $thumb.length > 0 ){
						$thumb.removeClass("active");
						$thumb.eq(nextSlide).addClass("active");
					}
				});

				_slider.on('breforeResize', function(event, slick){
					//console.log(slick);
					Method.resizeEvent( slick );
				});

				// layer hover 구현 - image 등록시만 동작
				/*
				$slider.find('img.slider-layer-content').hover(function(event){
					var _this = $(this);
					var _hover = _this.data( 'hover' );
					if( !brz.util.isEmpty(_hover) ) {
						_this.attr( 'src', _hover );
					}
				}, function(event){
					var _this = $(this);
					var _primary = _this.data( 'primary' );
					if( !brz.util.isEmpty( _primary ) ) {
						_this.attr( 'src', _primary );
					}
				});
				*/

				// 최초 실행
				if( _slider.length > 0 ) {
					Method.resizeEvent( _slider.get(0).slick );
				}
			}


		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-slick-slider]',
					attrName:'data-module-slick-slider',
					moduleName:'module_slick_slider',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

/*
    @pck 2020-12-08
    SNKRS MIRRORING
    GLOBAL UI SCRIPT

    **SNKRS 관련 인터렉션만 추가
    **GNB
    **PDP
    **miniPDP - SNKRS COLLECTION
*/
var UI_SNKRS = function () {
    var snkrs;

    //Selectors
    var snkrsVariables,
        snkrsListItems, filterMenu,
        snkrsPDPGallery, snkrsPDPGallerySwiper, snkrsPDPFullscreenSwiper,
        btnMobileGnb, btnToggleListMode,
        mobileGnbElement, mainLayoutOverlay, contentWrapper;

    function querySelector(querySelectorName){
        if(querySelectorName == null || querySelectorName == "" || typeof querySelectorName == "undefined") return false;
        var tmpElement = document.querySelectorAll(querySelectorName);
        if(tmpElement.length > 0){
            if(tmpElement.length == 1){
                return tmpElement[0];
            }else {
                return tmpElement; //배열로 리턴
            }
        }
        return false;
    }

    function setLocalStorage(key, value){
        if( typeof localStorage == 'undefined' || localStorage == null) return false;
        localStorage.setItem(key, value);
    }
    function getLocalStorage(key){
        if( typeof localStorage == 'undefined' || localStorage == null) return false;
        return localStorage.getItem(key);
    }

    function changeListType(type, listItemsArray){

        if(listItemsArray == null) return false;

        var listType = 'grid'; //기본 선택 값 grid
        if(type !== null || type !== ''){
            listType = type;
        }

        // grid class 변경
        if(listItemsArray.length > 0){
            switch (listType){
                case 'feed' :
                    //Feed type 처리 부
                    for( i = 0; i < listItemsArray.length; i++ ){
                        listItemsArray[i].classList.remove('pb2-sm', 'va-sm-t', 'ncss-col-sm-6', 'ncss-col-md-3', 'ncss-col-xl-2', 'prl1-sm', 'grid-type');
                        listItemsArray[i].classList.add('pb2-sm', 'va-sm-t', 'ncss-col-sm-12', 'ncss-col-md-6', 'ncss-col-lg-4', 'pb4-md', 'prl0-sm', 'prl2-md', 'ncss-col-sm-6', 'ncss-col-lg-3', 'pb4-md', 'prl2-md','pl0-md', 'pr1-md');
                    }
                    break;
                case 'grid' :
                    //Grid type 처리부
                    for( i = 0; i < listItemsArray.length; i++ ){
                        listItemsArray[i].classList.remove('pb2-sm', 'va-sm-t', 'ncss-col-sm-12', 'ncss-col-md-6', 'ncss-col-lg-4', 'pb4-md', 'prl0-sm', 'prl2-md', 'ncss-col-sm-6', 'ncss-col-lg-3', 'pb4-md', 'prl2-md','pl0-md', 'pr1-md');
                        listItemsArray[i].classList.add('pb2-sm', 'va-sm-t', 'ncss-col-sm-6', 'ncss-col-md-3', 'ncss-col-xl-2', 'prl1-sm', 'grid-type');
                    }
                    break;
            }
        }
    }

    try {
        snkrs = {
            init : function (){
                snkrsVariables = querySelector("form[name=snkrsVariables]") ? querySelector("form[name=snkrsVariables]") : null;
                filterMenu = querySelector(".filters-menu .nav-items a.custom-link") ? querySelector(".filters-menu .nav-items a.custom-link") : null;

                //PDP 부
                snkrsPDPgallery = querySelector('[data-component-gallery]') ? querySelector('[data-component-gallery]') : null;

                //모바일 gnb 버튼 부
                btnMobileGnb = querySelector("[data-snkrs-ui-mobile-nav-button]") ? querySelector("[data-snkrs-ui-mobile-nav-button]") : null; //mobile GNB Button
                mainLayoutOverlay = querySelector(".main-layout .content-overlay") ? querySelector(".main-layout .content-overlay") : null; //mobile main overlay

                mobileGnbElement = querySelector("[data-module-mobilegnb]") ? querySelector("[data-module-mobilegnb]") : null; //mobile GNB Element
                contentWrapper = querySelector(".main-layout .content-wrapper") ? querySelector(".main-layout .content-wrapper") : null; //content wrapper

                btnToggleListMode = querySelector("[data-snkrs-ui-toggle-listmode]") ? querySelector("[data-snkrs-ui-toggle-listmode]") : null; //mobile GNB Button

                var listType = getLocalStorage('listType');
                //저장된 값이 있을 때 grid 타입 설정
                if(listType !== null){
                    switch (listType){
                        case 'feed' :
                            snkrs.GNB.toggleGridMode('feed');
                            break;
                        case 'grid' :
                            snkrs.GNB.toggleGridMode('grid');
                            break;
                    }
                }else{
                    setLocalStorage('listType', 'feed'); //최초 생성 값 'feed'
                }

                //모바일 GNB Toggle
                if(btnMobileGnb !== null){
                    btnMobileGnb.addEventListener("click", function(){
                        snkrs.GNB.toggleMobileGnb();
                    });
                }
                if(mainLayoutOverlay !== null){
                    mainLayoutOverlay.addEventListener("click", function(){
                        snkrs.GNB.toggleMobileGnb();
                    });
                }

                //토글 버튼
                if(btnToggleListMode !== null){
                    btnToggleListMode.addEventListener("click", function(){
                        var listType = 'grid';
                        if(getLocalStorage('listType') !== ''){
                            listType = getLocalStorage('listType') == 'feed' ? 'grid' : 'feed';
                        }
                        snkrs.GNB.toggleGridMode(listType);
                    });
                }

                //PDP sticky init
                this.PDP.scrollSticky();

                //PDP Gallery Swiper init
                if(snkrsPDPgallery !== null){
                    if(snkrsPDPgallery.length > 0){ // 다중 케이스 ex) mini PDP
                        for(var i = 0; i < snkrsPDPgallery.length ; i++){
                            this.PDP.initGallerySwiper(snkrsPDPgallery[i]);
                        }
                    }else{
                        this.PDP.initGallerySwiper(snkrsPDPgallery);
                    }
                }

                //PDP - Mobile Size SelectBox
                var snkrsPDPSizeSelectBox = querySelector('[data-brz-components-type=SIZE]') ? querySelector('[data-brz-components-type=SIZE]') : null;
                this.PDP.focusSelectBox(snkrsPDPSizeSelectBox);
            },
            VALUE : {
              getGallerySwiper : function (){return snkrsPDPGallerySwiper;},
              setGallerySwiper : function (swiper){snkrsPDPGallerySwiper = swiper;},
              getFullscreenSwiper : function (){return snkrsPDPFullscreenSwiper;},
              setFullscreenSwiper : function (swiper){snkrsPDPFullscreenSwiper = swiper;}
            },
            UTIL : {
                isMobile : function (){
                    var isMobileMatche = false;

                    if(window.matchMedia !== null){
                        isMobileMatche = window.matchMedia('only screen and (max-width: 1024px)').matches;
                    }

                    return isMobileMatche;
                },
                getScrollbarWidth : function (){
                    var scrollDiv = document.createElement("div");
                        scrollDiv.className = "scrollbar-measure";

                    document.body.appendChild(scrollDiv);

                    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
                    return scrollbarWidth;

                    document.body.removeChild(scrollDiv);
                },
                getScrollTop : function (){
                    var documentEl = document.documentElement;
                    var _left = (window.pageXOffset || documentEl.scrollLeft) - (documentEl.clientLeft || 0);
                    var _top = (window.pageYOffset || documentEl.scrollTop)  - (documentEl.clientTop || 0);
                    return {left : _left, top : _top};
                }
            },
            GNB : {
                toggleMobileGnb : function (){
                    if(btnMobileGnb == null) return false;
                    if(mainLayoutOverlay == null) return false;
                    if(mobileGnbElement == null) return false;
                    if(contentWrapper == null) return false;

                    var bodyElement = querySelector("body") ? querySelector("body") : null;

                    if( mobileGnbElement.classList.contains("show") ){
                        mobileGnbElement.classList.remove("show");
                        mainLayoutOverlay.classList.add("hide");
                        contentWrapper.classList.remove("hide");
                        bodyElement.classList.remove("no-scroll");
                    } else { //모바일 GNB Show
                        mobileGnbElement.classList.add("show");
                        mainLayoutOverlay.classList.remove("hide");
                        mainLayoutOverlay.classList.remove("hide");
                        contentWrapper.classList.add("hide");
                        bodyElement.classList.add("no-scroll");
                    }
                },
                toggleGridMode : function (type){ // listMode : 'feed' or 'grid'
                    if(btnToggleListMode == null) return false;
                    snkrsListItems = querySelector("[data-component-launchitem]") ? querySelector("[data-component-launchitem]") : null; //SNKRS category list items;

                    if(snkrsListItems == null) return false;

                    var listType = 'grid'; //최초 설정값 'feed' 상태에서 변경될 최초 대상 값 grid
                    if(type !== null || type !== ''){
                        listType = type;
                    }

                    //List Icon
                    var feedIcon = '<svg width="18px" height="18px" fill="#757575" class="feed-icon" viewBox="0 0 24 24"><path d="M0 18.64h24V24H0v-5.36zM0 0h24v16H0V0z"></path></svg>';
                    //Grid Icon
                    var gridIcon = '<svg width="18px" height="18px" fill="#757575" class="grid-icon" viewBox="0 0 24 24"><path d="M0 13.36h10.64V24H0V13.36zM13.36 0H24v10.64H13.36V0zm0 13.36H24V24H13.36V13.36zM0 0h10.64v10.64H0V0z"></path></svg>';

                    if(listType == 'feed'){ //feed 모드
                        btnToggleListMode.innerHTML = gridIcon;
                        if(btnToggleListMode.dataset.snkrsUiToggleListmode !== null) {
                            btnToggleListMode.dataset.snkrsUiToggleListmode = 'true';
                        }
                        btnToggleListMode.ariaLabel = '목록으로 제품보기';
                        btnToggleListMode.dataset.clickName = 'thumbnail';
                        setLocalStorage('listType', 'feed');
                        changeListType('feed', snkrsListItems);
                    }else{ //grid 모드
                        btnToggleListMode.innerHTML = feedIcon;
                        if(btnToggleListMode.dataset.snkrsUiToggleListmode !== null){
                            btnToggleListMode.dataset.snkrsUiToggleListmode = 'false';
                        }
                        btnToggleListMode.ariaLabel = '그리드로 제품보기';
                        btnToggleListMode.dataset.clickName = 'fullview';
                        setLocalStorage('listType', 'grid');
                        changeListType('grid', snkrsListItems);
                    }

                    //Lazy control
                    $('.launch-category .img-component').Lazy({
                        visibleOnly: true,
                        scrollDirection: 'vertical',
                        afterLoad: function() {
                            $('.launch-category .launch-list-item').addClass('complete');
                        },
                    });
                }
            },
            PDP : {
                scrollSticky : function (){
                    /*
                    SNKRS DRAW 시 PDP 내용이 짧으면 우측 부 DRAW신청 버튼 및 사이즈 선택부 가용 여백이 확보가 되지 않아서 클릭이 안되는 문제 해결
                    기존 오프셋을 이용한 세로 중앙정렬 방식에서 STICKY 방식으로 변경
                     */
                    var stickyEl = $('.card-product-component .fixie'),
                        stickyTargetEl = $('.lc-prd-conts .prd-img-wrap'),
                        scrollDirectionOffset = $(window).scrollTop();

                        if( (stickyEl == null) && (stickyEloffset == null) ) return false;

                        if(document.querySelector('[data-module-launchproduct]') == null) return false; // PDP 아닐 때 return

                    $(window).scroll(function(){
                        window.requestAnimationFrame(function () {
                            rightSideSticky($(window).scrollTop());
                        });
                    });

                    function rightSideSticky (offsetY){
                        var isMobile = window.matchMedia("(max-width: 1024px)")

                        if(!isMobile.matches){ //모바일이 아닐 때만 실행

                            (offsetY > stickyTargetEl.offset().top) ? stickyEl.addClass('sticky') : stickyEl.removeClass('sticky');

                            var scrollDirection = (offsetY >= scrollDirectionOffset) ? 'down' : 'up';
                            scrollDirectionOffset = offsetY;

                            var docViewBottom = offsetY + $(window).height(),
                                stickyTargetElBottomoffset = stickyTargetEl.offset().top + stickyTargetEl.outerHeight(),
                                bottomGap = ( $(window).height() - stickyEl.outerHeight() ) / 2;

                            if(scrollDirection == 'down'){
                                if( (stickyTargetElBottomoffset + bottomGap) <= docViewBottom ) {
                                    if(!stickyEl.hasClass('end'))stickyEl.addClass('end');
                                }
                            }else{
                                if( (stickyTargetElBottomoffset + bottomGap) > docViewBottom ) {
                                    if(stickyEl.hasClass('end')) stickyEl.removeClass('end');
                                }
                            }
                        }else{
                            if(stickyEl.hasClass('sticky')) stickyEl.removeClass('sticky');
                            if(stickyEl.hasClass('end')) stickyEl.removeClass('end');
                        }
                    }

                    rightSideSticky($(window).scrollTop());	//첫 load 시 스크롤 상태 확인
                },
                initGallerySwiper : function (targetEl){
                    if(targetEl == null) return false;

                    function initFullscreenSlider(setIndex, targetElement){ //pc일 때만 작동
                        if(targetElement == null) return false;
                        if(targetElement.querySelector('.snkrs-gallery-fullscreen-swiper') == null) return false;
                        var _setIndex = 0;
                            _setIndex = setIndex !== null ? setIndex : 0;
                        var _self = this;

                        var snkrsPDPGalleryFullscreenImageSwiper = new Swiper(targetElement.querySelector('.snkrs-gallery-fullscreen-swiper'), {
                            centeredSlides: true,
                            initialSlide: _setIndex,
                            slidesPerView: 1,
                            navigation: {nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev'},
                            scrollbar: {el: '.swiper-scrollbar'},
                            on: {
                                init: function () {
                                    var fullscreenContainer = targetElement.querySelector('.carousel.full-screen');
                                    if (fullscreenContainer !== null) {
                                        fullscreenContainer.classList.add('show');
                                    }

                                    if(!document.querySelector('html').classList.contains('quickview-fullscreen')){
                                        document.querySelector('html').classList.add('quickview-fullscreen');
                                    }

                                    var closeButtonClickEvent = function(event){
                                        var fullscreenContainer = targetEl.querySelector('.carousel.full-screen');
                                        if(fullscreenContainer !== null){
                                            fullscreenContainer.classList.remove('show');
                                        }

                                        if(document.querySelector('html').classList.contains('quickview-fullscreen')){
                                            document.querySelector('html').classList.remove('quickview-fullscreen');
                                        }

                                        var iFullscreenSwiper = snkrs.VALUE.getFullscreenSwiper();
                                        if ( typeof iFullscreenSwiper !== 'undefined' ){
                                            if(iFullscreenSwiper.length > 1){ //다중으로 처리 될 때 ex)Collection Mini PDP 중첩 상황...
                                                for(var i = 0; i < iFullscreenSwiper.length ; i++){
                                                    iFullscreenSwiper[i].destroy();
                                                }
                                            }else{
                                                iFullscreenSwiper.destroy();
                                            }
                                        }
                                    }
                                    var closeButton = targetElement.querySelector('.full-screen-close');
                                    if (closeButton !== null) {
                                        closeButton.addEventListener('click', closeButtonClickEvent.bind(targetEl));
                                    }
                                }
                            }
                        });
                        snkrs.VALUE.setFullscreenSwiper(snkrsPDPGalleryFullscreenImageSwiper);
                    }

                    // PDP Gallery 이미지 클릭 시 이벤트 - PC일 때만 실행
                    var clickPDPGalleryImage = function(event){
                        if (!snkrs.UTIL.isMobile()) {
                            if(targetEl == null) return false;
                            var images = targetEl.querySelectorAll('[data-ui-gallery-fullscreen-image]');
                            var selectedImageIndex = 0;
                            if(images !== null){
                                for(var i = 0 ; i < images.length ; i++){
                                    if(images[i] === event.currentTarget){
                                        selectedImageIndex = i;
                                        initFullscreenSlider(i, targetEl);
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    var snkrsPDPGalleryFullscreenImage = targetEl.querySelectorAll('[data-ui-gallery-fullscreen-image]');
                    for(var i = 0; i < snkrsPDPGalleryFullscreenImage.length ; i++){
                        snkrsPDPGalleryFullscreenImage[i].addEventListener('click', clickPDPGalleryImage.bind(targetEl));
                    }

                    function initSwiper(){
                        if(targetEl.querySelectorAll('.snkrs-gallery-swiper') == null) return false;

                        var targetSwiperEl = targetEl.querySelectorAll('.snkrs-gallery-swiper');
                        var swiper = null;

                        if(targetSwiperEl.length > 1){ //다중으로 처리 될 때 ex)Collection Mini PDP 중첩 상황...
                            swiper = [];
                            for(var i = 0; i < targetSwiperEl.length ; i++){
                                swiper.push(
                                    new Swiper(targetSwiperEl[i], {
                                        scrollbar: {el: '.snkrs-gallery-swiper-scrollbar', hide: false,},
                                    })
                                );
                            }
                        }else{
                            swiper = new Swiper(targetSwiperEl, {
                                scrollbar: {el: '.snkrs-gallery-swiper-scrollbar', hide: false,},
                            });
                        }

                        snkrs.VALUE.setGallerySwiper(swiper);
                    } // PDP Gallery 용 Swiper

                    function updateGallery(){
                        var isSwiper = null;
                        isSwiper = snkrs.VALUE.getGallerySwiper();

                        if (snkrs.UTIL.isMobile()) { // 모바일일 때 init
                            if(typeof isSwiper == 'undefined'){
                                initSwiper();
                            }else{
                                if(snkrs.VALUE.getGallerySwiper().destroyed){
                                    initSwiper();
                                }
                            }

                            if($('[data-scrollbar]').length === 1 && typeof Scrollbar == "function"){
                                if(Scrollbar.destroyAll() !== null)
                                    Scrollbar.destroyAll();
                            }
                        } else { // PC모드일 때 인스턴스 삭제
                            if ( typeof isSwiper !== 'undefined' ){
                                if(isSwiper.length > 1){ //다중으로 처리 될 때 ex)Collection Mini PDP 중첩 상황...
                                    for(var i = 0; i < isSwiper.length ; i++){
                                        isSwiper[i].destroy();
                                    }
                                }else{
                                    isSwiper.destroy();
                                }
                            }

                            if($('[data-scrollbar]').length === 1 && typeof Scrollbar == "function"){
                                if(Scrollbar.initAll() !== null)
                                    Scrollbar.initAll();
                            }
                        }
                    }


                    // optimize resize
                    var optimizedResize = (function() {
                        var callbacks = [], running = false;

                        function resize() {
                            if (!running) {
                                running = true;

                                if (window.requestAnimationFrame) {
                                    window.requestAnimationFrame(runCallbacks);
                                } else {
                                    setTimeout(runCallbacks, 66);
                                }
                            }
                        }

                        function runCallbacks() {
                            if (window.NodeList && !NodeList.prototype.forEach) {
                                NodeList.prototype.forEach = Array.prototype.forEach;
                            }
                            callbacks.forEach(function(callback) {callback();});
                            running = false;
                        }

                        function addCallback(callback) {
                            if (callback) {
                                callbacks.push(callback);
                            }
                        }

                        return {
                            add: function(callback) {
                                if (!callbacks.length) {
                                    window.addEventListener('resize', resize);
                                }
                                addCallback(callback);
                            }
                        }
                    }());

                    //리사이즈 시 PC모드에서 모바일 모드 진입 시작 점 체크 후 init
                    optimizedResize.add(function() {
                        updateGallery();
                    });
                    //최초 init
                    updateGallery();
                },
                focusSelectBox : function (targetEl){
                    if(targetEl == null) return false;

                    var selectBox = targetEl.querySelector('select#selectSize') ? targetEl.querySelector('select#selectSize') : null ;
                    if(selectBox !== null){

                        var selectBoxLabel = targetEl.querySelector('label.select-head') ? targetEl.querySelector('label.select-head') : null ;
                        selectBox.addEventListener('click', function (){
                            if( selectBoxLabel !== null && !selectBoxLabel.classList.contains('open') ){
                                 selectBoxLabel.classList.add('open');
                            }
                        });
                        selectBox.addEventListener('blur', function (){
                            if( selectBoxLabel !== null && selectBoxLabel.classList.contains('open') ){
                                selectBoxLabel.classList.remove('open');
                            }
                        });
                    }
                }
            },
            MINI_PDP : {
                init : function(targetEl){
                    snkrs.MINI_PDP.scrollSticky(targetEl)
                },
                scrollSticky : function (targetEl){
                    if(targetEl == null) return false;
                    /*
                    PDP와 달리 SmoothScroller의 이벤트를 scrolloffset으로 써야한다.
                     */
                    var stickyEl = targetEl.querySelector('.card-product-component .fixie');
                        if (stickyEl == null) return false;

                    var stickyTargetEl = targetEl.querySelector('.lc-prd-conts .prd-img-wrap'),
                        stickyTargetCover = targetEl.querySelector('.full.js-photo'),
                        scrollDirectionOffset = 0;

                    var quickViewEl = querySelector('.quickview');

                    if( quickViewEl !== null ){

                        scrollDirectionOffset = quickViewEl.scrollTop;
                        quickViewEl.addEventListener('scroll', function(event) {
                            window.requestAnimationFrame(function () {

                                var quickViewEl = querySelector('.quickview');
                                if(quickViewEl !== null){
                                    rightSideSticky(quickViewEl.scrollTop);
                                }
                            });
                        });

                        function rightSideSticky (offsetY){
                            if(offsetY == null) return false;

                            var isMobile = window.matchMedia("(max-width: 1024px)");

                            if(!isMobile.matches){ //모바일이 아닐 때만 실행

                                var targetOffset = stickyTargetEl.offsetTop;
                                if(stickyTargetCover !== null){
                                    targetOffset += stickyTargetCover.offsetHeight;
                                }

                                if(offsetY > targetOffset) {
                                    if(!stickyEl.classList.contains('sticky')){
                                        stickyEl.classList.add('sticky');
                                        stickyEl.dataset.isSticky = 'true';
                                    }
                                }else {
                                    if (stickyEl.classList.contains('sticky')) {
                                        stickyEl.classList.remove('sticky');
                                        stickyEl.dataset.isSticky = 'false';
                                    }
                                }

                                var scrollDirection = (offsetY >= scrollDirectionOffset) ? 'down' : 'up';
                                scrollDirectionOffset = offsetY;

                                var quickViewEl = querySelector('.quickview'),
                                    quickViewElHeight = 0;
                                if(quickViewEl !== null){
                                    quickViewElHeight
                                }

                                var docViewBottom = offsetY + window.innerHeight,
                                    stickyTargetElBottomoffset = stickyTargetEl.offsetTop + stickyTargetEl.offsetHeight,
                                    bottomGap = ( window.innerHeight - stickyEl.offsetHeight ) / 2;

                                if(stickyTargetCover !== null){
                                    stickyTargetElBottomoffset += stickyTargetCover.offsetHeight;
                                }

                                if(scrollDirection == 'down'){
                                    if( (stickyTargetElBottomoffset + bottomGap) <= docViewBottom ) {
                                        if( !stickyEl.classList.contains('end') ){
                                            stickyEl.dataset.isSticky = 'false';
                                            stickyEl.dataset.lastOffset = offsetY;
                                            stickyEl.classList.add('end');
                                        }
                                    }
                                }else{
                                    if( (stickyTargetElBottomoffset + bottomGap) > docViewBottom ) {
                                        if( stickyEl.classList.contains('end') ){
                                            stickyEl.dataset.isSticky = 'true';
                                            stickyEl.classList.remove('end');
                                        }
                                    }
                                }

                                if(stickyEl.dataset.isSticky == 'true'){
                                    var lastOffsetY = offsetY;
                                    if(typeof stickyEl.dataset.lastOffset !== 'undefined'){
                                        lastOffsetY = stickyEl.dataset.lastOffset;
                                        stickyEl.style.transform = 'translateY(' +  lastOffsetY + 'px)';
                                        delete stickyEl.dataset.lastOffset
                                    }else{
                                        stickyEl.style.transform = 'translateY(' +  offsetY + 'px)';
                                    }

                                }else{
                                    stickyEl.style.removeProperty('transform');
                                }

                            }else{

                                if(stickyEl.classList.contains('sticky')) stickyEl.classList.remove('sticky');
                                if(stickyEl.classList.contains('end')) stickyEl.classList.remove('end');
                            }
                        }

                        rightSideSticky(quickViewEl.scrollTop);	//첫 load 시 스크롤 상태 확인
                    }
                },
            }
        }
    } catch (error) {
        console.error("SNKRS js Error" + error)
    }

    return snkrs;
};
document.addEventListener("DOMContentLoaded", function () {
    if(document.body.classList.contains('snkrs')){  // body에 snkrs class 체크 후 init
        UI_SNKRS().init();
    }
});
(function(Core){
	Core.register('module_social_login', function(sandbox){
		var Method = {
			moduleInit:function(){
				$this = $(this);
				sandbox.getComponents('component_select', {context:$this}, function(){
					this.addEvent('change', function(val){
						Method.submitFormByName( val );
					});
				});

				$(this).find('[data-social-btn]').on('click', function(e){
					e.preventDefault();
					var type = $(this).data('social-btn');
					Method.submitFormByName( type );
				})


			},
			submitFormByName:function(name){

				//페북, 카카오 클릭시 소셜 로그인 태깅 작업을 위해서. 쿠키를 생성한다.
				$.cookie('social_type', name);

				//로그인 진행..
				var $form = $this.find('form[name="' + name + '"]');
				var url = sandbox.utils.url.getUri(encodeURI(sandbox.utils.url.getCurrentUrl()));
				/*
				var locationHref = url.path.replace(sandbox.utils.contextPath, '') + url.query;
				*/
				var locationHref = window.location.href;

				if (!_.isEmpty(url.queryParams.successUrl)){
					locationHref = url.queryParams.successUrl;
				}
				if( $form ){
					$form.append('<input type="hidden" name="state" value="'+ locationHref +'" />');
					$form.submit();
				}
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-social-login]',
					attrName:'data-module-social-login',
					moduleName:'module_social_login',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_checkout', function(sandbox){
		var Method = {
			moduleInit:function(){
				var $this = $(this);

				/* 당일배송 */
	            var samedayDeliveryNotAvailable = $('input[name=samedayDeliveryNotAvailable]').val();
	            var samedayDeliveryNotAvailableMessage = $('input[name=samedayDeliveryNotAvailableMessage]').val();
	            if(samedayDeliveryNotAvailable == 'true'){
	                UIkit.modal.alert(samedayDeliveryNotAvailableMessage).on('hide.uk.modal', function() {
	                    Core.Loading.show();
	                    window.location.assign(sandbox.utils.contextPath + '/checkout?edit-shipping=true');
	                });
	            }

				// header
				//매장상품 확인 예약 서비스에서 진입한 경우 탭을 다 펼침
				if($this.find('[data-cod-btn]').length > 0){
					$this.find('[data-order-tab] .header').each(function(){
						var $icon = $(this).find('[class^="icon-toggle-"]');
						var $view = $(this).closest('.order-tab').find('.view');
						var $preview = $(this).find('.preview');

						if( $view.length > 0 ){
							$preview.removeClass('uk-hidden');
							$view.removeClass('uk-hidden');
							$icon.remove();
						}
					});
					//결제수단 선택 글씨 지우기.

					// console.log($('[data-checkout-step]').data('checkout-step'));

					if($this.find('.contents').length > 0){
						$this.find('.contents').addClass('reservations-wrap');
					}
					if($this.find('.order-wrap').length > 0){
						$this.find('.order-wrap').addClass('reservations-item');
					}
					if($this.find('#popup-cancel').length > 0){
						$this.find('#popup-cancel').addClass('reservations-popup');
					}
				} else {
					$this.find('[data-order-tab] .header').on("mousedown", Method.updateOrderTab);

					// SEAMLESS_START 2018-02-05
					$this.find("#idChangePickupToShip").click(function() {
						UIkit.modal.confirm('<p align="center">상품수령 방법을 택배수령으로 변경하시겠습니까?</p><p align="center">일반배송인 경우 2~3일 소요됩니다.</p>', function(){
							Method.changePickupToShip();
						});
					});
					// SEAMLESS_END
				}
				/* CUSTOM _customproduct.js 기능 이동 */
				Core.Utils.customProduct.checkoutCustomProductChangeImage();
			},
			changePickupToShip:function(e){// SEAMLESS 2018-03-20
				var formRequest = BLC.serializeObject($("form[name=formChangePickupToShip]"));
				sandbox.setLoadingBarState(true);
				BLC.ajax({
					url:sandbox.utils.contextPath +"/cart/add?directOrder=true",
					type:"POST",
					dataType:"json",
					data : formRequest
				},function(data){
					if(data.error){
						sandbox.setLoadingBarState(false);
						UIkit.modal.alert(data.error);
					}else{
						Core.Loading.show();
						endPoint.call( 'buyNow', formRequest );//???
						_.delay(function(){
							window.location.assign( sandbox.utils.contextPath +'/checkout' );
						}, 500);
					}
				}).fail(function(msg){
					sandbox.setLoadingBarState(false);
					if(commonModal.active) commonModal.hide();
					if(msg !== '' && msg !== undefined){
						UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'warning'});
					}
				});
			},
			updateOrderTab:function(e){
				e.preventDefault();
				var $icon = $(this).find('[class^="icon-toggle-"]');
				var $view = $(this).closest('.order-tab').find('.view');
				var $preview = $(this).find('.preview');

				if( $view.length > 0 ){
					$preview.toggleClass('uk-hidden');
					$icon.toggleClass('uk-hidden');
					$view.toggleClass('uk-hidden');
				}
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-checkout]',
					attrName:'data-module-checkout',
					moduleName:'module_checkout',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_social_share', function(sandbox){
		var endPoint, $this;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				endPoint = Core.getComponents('component_endpoint');

				$this.on('click', '#kakao-btn-wrapper', function(){
					endPoint.call('socialShareClick', {service : 'kakaotalk'});
				})

				$this.on('click', '.at-share-btn-elements a', function(){
					var service = '';
					var className = String( $(this).attr("class") );
					if( className.indexOf('facebook') > -1){
						service = 'facebook';
					}

					if( className.indexOf('twitter') > -1){
						service = 'twitter';
					}

					if( className.indexOf('kakao') > -1){
						service = 'kakao';
					}

					if( className.indexOf('email') > -1){
						service = 'email';
					}

					if( className.indexOf('lineme') > -1){
						service = 'lineme';
					}

					if( className.indexOf('pinterest') > -1){
						service = 'pinterest';
					}
					endPoint.call('socialShareClick', {service : service});
				})
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-social-share]',
					attrName:'data-module-social-share',
					moduleName:'module_social_share',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				if($this) $this.off();
				endPoint = null;
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_order_delivery', function(sandbox){
		var $this, endPoint, $messageText, $form;
		var Method = {
			$popAddressModal :null,
			$beforeAddress:null,
			$newAddress:null,
			$addressWrap:null,
			$addressErrorInfo: null,
			isNewAddress:false,
			isSelectAddress:false,
			isChangeCustomerAddress:false,
			addressComponent:null,
			isEditedAddress:false,
			moduleInit:function(){
				$this = $(this);
				endPoint = Core.getComponents('component_endpoint');
				Method.$popAddressModal = UIkit.modal("#popup-customer-address", {modal: false});
				Method.$beforeAddress = $this.find('[data-before-address]');
				Method.$newAddress = $this.find('[data-new-address]');
				Method.$addressWrap = $this.find('[data-address-wrap]');
				Method.$addressErrorInfo = $this.find('[data-address-error-info]');

				// 배송지 타입이 없는건 비회원이라는 뜻
				Method.isNewAddress = ( $this.find('[data-address-type]').length == 0 ) ? true : false;
				Method.addressComponent = Core.getComponents('component_customer_address', { context: $this });

				var $personalMsg = $(this).find('[name="personalMessageText"]');
				var $personalSelect = $(this).find('select[name="selectPersonalMessage"]');
				// select가 안되어있고 msg가 있으면 직접입력 처리
				if( $personalMsg.val() != "" && $personalSelect.val() =="" ){
					$personalSelect.val('dt_1');
					$personalMsg.closest(".input-textfield").removeClass('uk-hidden');
				}

				var $personalMsgSelect = sandbox.getComponents('component_select', {context:$this}, function(){
					this.addEvent("change", function(){
						var value = $(this).val();
						if(value == ''){
							$personalMsg.val('');
							$personalMsg.closest(".input-textfield").addClass('uk-hidden');
						}else if(value == 'dt_1'){
							// 직접입력일 경우
							$personalMsg.val('');
							$personalMsg.closest(".input-textfield").removeClass('uk-hidden');
						}else{
							//$personalMsg.val( $(this).find("option:selected").val() + "||" + $(this).find("option:selected").text() );
							$personalMsg.val( $(this).find("option:selected").text());
							$personalMsg.closest(".input-textfield").addClass('uk-hidden');
						}
					});
				});

				// 일반배송 기본 선택, 배송메모 필수 값 해제
				$(this).find('[data-delivery=default] input[type=radio]').prop("checked", true);
				$(this).find('[data-delivery=default]').addClass('checked');
				$this.find('select[name=selectPersonalMessage]').removeAttr('data-parsley-required');
				// 배송 방식 선택시
				sandbox.getComponents('component_radio', {context:$this}, function(){
					this.addEvent('change', function(){
						endPoint.call('changeShippingType', { shippingType : $(this).closest('[data-delivery]').data('delivery')})
					})
				});

            	samedayError = $('.dl-same').find('[data-sameday-error]');
            	isDeliverableTimeError = '오늘도착 서비스 이용 시간 외 주문은 일반배송으로 발송처리 됩니다.';
            	isDeliverableProductCountError = '한 번에 상품 2개까지 주문하시면, 오늘도착 배송으로 받으실 수 있습니다. 주문수정은 장바구니 옵션변경에서 가능합니다.';
            	isDeliverableFulfillmentCountError = '상품 발송 출고지가 다른 주문인 경우 \'오늘도착 서비스\'를 이용하실 수 없습니다.';
            	isDeliverableAddressError = '배송지 주소 서울∙과천∙의왕∙군포∙수원∙성남∙안양시 전체 용인시 수지구∙기흥구 부천시 중동∙상동∙심곡동 지역에 한해 \'오늘도착 서비스\'를 이용하실 수 있습니다. 서울∙과천∙의왕∙군포∙수원∙성남∙안양시 전체 용인시 수지구∙기흥구 부천시 중동∙상동∙심곡동 주소지로 변경하시면 오늘도착이 가능합니다.';
            	isDeliverableProductFlagError = '오늘도착 상품과 일반 상품을 같이 구매하시면 일반배송으로 배송됩니다.';
				samedayDeliveryCheck = function(){
					$this.find('[data-delivery]').each(function(){
						var delivery = $(this).data('delivery');
						sandbox.validation.reset($form);
						if(delivery == 'sameday'){
							$(this).addClass('disable').removeClass('checked');
							$(this).find('input[type=radio]').removeAttr("checked");
							$(this).find('input[type=radio]').attr("readonly",true);
						} else {
							if( $('[data-delivery="sameday"]').hasClass('checked') ){
								$(this).find('input[type=radio]').prop("checked", true).trigger("click");
								$this.find('select[name=selectPersonalMessage]').removeAttr('data-parsley-required');
							}
						}
					});
				}
                samedayDeliveryEnable = function(){
                	// 당일배송 체크 부 활성화 로직
                	var dlSame = $this.find('.dl-same');
					var delivery = $this.find('[data-delivery=sameday]');
					dlSame.find('[data-sameday-error]').text('');
					dlSame.find('.error-message').removeClass('filled').find('>.parsley-required').remove();
					delivery.removeClass('checked disable');
					delivery.find('input[type=radio]').removeAttr("checked");
					delivery.find('input[type=radio]').removeAttr("readonly");
                }
				$this.find('.dl-same label').on('click', function(e){
					e.preventDefault();
					var delivery = $(this).parents('[data-delivery]').data('delivery');
					if(delivery == 'sameday'){
						$this.find('select[name=selectPersonalMessage]').attr('data-parsley-required',true);
					} else{
    					$this.find('select[name=selectPersonalMessage]').removeAttr('data-parsley-required');
					}
				});
				Method.isSelectAddress = ( $(this).find('[name="isSearchAddress"]').val() == 'true' );
				//@pck 2021-09-03 기존 저장된 주소와 동일한 식별자가 존재하여 셀렉터 부에 상위 data 속성을 키값으로 추가
				var $zipCodeInput = $(this).find('[data-new-address] [name="address.postalCode"]');
				var $zipCodeDisplay = $(this).find('[data-new-address] [data-postalCode]');

				//저장된 배송지가 없을 경우 케이스 추가
				if($zipCodeInput.length == 0) {$zipCodeInput = $(this).find('[name="address.postalCode"]');}
				if($zipCodeDisplay.length == 0) {$zipCodeDisplay = $(this).find('[data-postalCode]');}

				$('input[name="address.addressLine1"]').on('change', function (e){
					Method.isEditedAddress = true; //우편번호 주소 입력 부가 언제든지 수정가능 한 상태이므로 수정된다면 한번 더 체크
				});

				var deliverySearch = sandbox.getComponents('component_searchfield', {context:$this, selector:'.search-field', resultTemplate:'#address-find-list'}, function(){
					// 검색된 내용 선택시 zipcode 처리
					this.addEvent('resultSelect', function(data){
						var zipcode = $(data).data('zip-code5');
						var city = $(data).data('city');
						var doro = $(data).data('doro');

						this.getInputComponent().setValue(city + ' ' + doro);

						$zipCodeInput.val( zipcode );
						if($zipCodeDisplay.length !== 0){
							$zipCodeDisplay.text( zipcode );
							$zipCodeDisplay.parent().removeClass("uk-hidden");
						}

						Method.isSelectAddress = true;
						Method.isEditedAddress = false;

						// 배송방식 선택
						var paramObj = {
							toAddress: zipcode
						}
						BLC.ajax({
							url:sandbox.utils.contextPath +"/checkout/checkSamedayDelivery",
							type:"POST",
							dataType:"json",
							data : paramObj
						},function(data){
							endPoint.call('shippingAddressSelect', {
								zipcode: zipcode,
								city: city,
								doro: doro,
								isPossibleSamedayDelivery: data.isPossibleSamedayDelivery
							})
							if(data.isPossibleSamedayDelivery !== true) {
                                samedayDeliveryCheck();
								if (data.isDeliverableTime == true) {
									if (data.isDeliverableCustomer == true) {
										if (data.isDeliverableProductFlag == true) {
											if (data.isDeliverableProductCount == true) {
												if (data.isDeliverableFulfillmentCount == true) {
													if (data.isDeliverableAddress == true) {
														// 오류메세지 노출 안함
													} else {
														samedayError.text(isDeliverableAddressError);
													}
												} else {
													samedayError.text(isDeliverableFulfillmentCountError);
												}
											} else {
												samedayError.text(isDeliverableProductCountError);
											}
										} else {
											if (data.isDeliverableProductFlagMixed == true) {
												samedayError.text(isDeliverableProductFlagError);
											} else {
												// 오류메세지 노출 안함
											}
										}
									} else {
										// 오류메세지 노출 안함
									}
								} else {
									samedayError.text(isDeliverableTimeError);
								}
							} else{
								samedayDeliveryEnable();
							}
						});
					});
				});

				$form = $this.find('#shipping_info');
				sandbox.validation.init( $form );

				//배송 메시지에 특수문자 " \ 저장 안되게 치환
				$personalMsg.on('keyup', function(e){
					//console.log(e.keyCode)
					$personalMsg.val(Method.getShppingMesasgeByRemoveUnusable($personalMsg.val()));
					return false;
		        });


				// 배송지 정보 submit 시
				$this.find('[data-order-shipping-submit-btn]').on('click', function(e){
					// 비회원 로그인 여부 팝업을 띄울때 labels를 설정 했는데 다른 창이 뜰때도 영향을 받아 다시 초기화 시킴
					UIkit.modal.alert('', function () {
					}, function () { },
					{
						labels: { 'Ok': '확인'}
					}).hide();
					
					e.preventDefault();
					sandbox.validation.validate( $form );
					if(sandbox.validation.isValid( $form )){
						if( Method.isNewAddress ){
							if( !Method.isSelectAddress || Method.isEditedAddress){
								UIkit.modal.alert("검색을 통하여 배송지를 입력해주세요.");
								return;
							}
						}else{
							/*
							// 신규 등록이 아닐때는 기존 주소가 유효 한지 체크 한다.
							var address1 = $form.find('input[name="address.addressLine1"]').eq(0).val();
							var addressId = $form.find('#addressId').eq(0).val();
							
							// 최종 주소를 다시 한번 주소 API로 유효성 체크
							var customerAddrssValidationResult = Core.Utils.addressApi.init().isEmpty(address1);
							if (customerAddrssValidationResult) {
								// 한번도 변경을 안했으면 즉 기본배송지를 사용중이면
								if (!Method.isChangeCustomerAddress) {
									if (Method.addressComponent!=null) {
										var defaultAddrss = Method.addressComponent.getDefaultAddress();
										if (defaultAddrss != null) {
											Method.removeWrongAddress(defaultAddrss.id);
										}
									}
								}else{
									Method.removeWrongAddress(addressId);
								}
								return;
							}
							*/
						}
						//주문서 입력시 010 11자리, 이외는 10자리로..
						if( ($form.find('[aria-expanded]').attr('aria-expanded')=="true")  || ($form.find('[aria-expanded]').length == 0)){  //이전주소 일 경우
							var phoneNumber = $form.find('input[name="address.phonePrimary.phoneNumber"]').eq(0).val();

							//기본 배송지 일경우  이름이 최소 2자 이어야 주문가능 하게 수정.
							if($form.find('input[name="address.fullName"]').val().length < 2){
								UIkit.modal.alert('이름은 2자 이상 가능 합니다.');
								return false;
							}
						}else{  //새로입력
							var phoneNumber = $form.find('input[name="address.phonePrimary.phoneNumber"]').eq(1).val();
						}

						//핸드폰, 일반 전화 패턴 정의
						var hp_defalult = /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})$/;    //새로 입력이 아닐경우, 기본 정규식 패턴 체크하기 위해서..
						var hp_pattern  = /^((01[16789])[1-9][0-9]{6,7})|(010[1-9][0-9]{7})$/;
						var cd_pattern  = /^(1[568][0456789][01456789][0-9]{4})|((01[16789])[1-9][0-9]{6,7})|(010[1-9][0-9]{7})|(050[0-9]{8,9})|((02|0[3-9][0-9])[0-9]{3,4}[0-9]{4})|(0001[568][0456789][01456789][0-9]{4})$/;
						var pattern_chk1 = false;      // false 로 기본 셋팅
						var pattern_chk2 = false;

						if(hp_defalult.test(phoneNumber)){
							pattern_chk1 = true;
						};

						if(hp_pattern.test(phoneNumber)){  //휴대폰 먼저 chk.
							pattern_chk2 = true;
						}else{
							if(cd_pattern.test(phoneNumber)){   //휴대폰 패턴이 false 경우, 일반 전화 패턴 chk.
								pattern_chk2 = true;
							};
						};

						if(!pattern_chk1 || !pattern_chk2) {    //검증 pattern_chk1, pattern_chk2 모두 true 이어야만..정상 연락처로....)
							UIkit.modal.alert('배송지 연락처를 정확하게 입력해 주세요!');
							return false;
						}
						
						//배송 메시지에 특수문자 " \ 저장 안되게 치환
						$personalMsg.val(Method.getShppingMesasgeByRemoveUnusable($personalMsg.val()));

						//당일배송 가능여부 체크
						$this.find('[data-delivery]').each(function(){
    						var delivery = $(this).data('delivery');
    						var radio = $(this).find('input[type=radio]').is(":checked");
    						if(delivery == 'default' && radio == true){
						        Method.submitForm();
						    } else if(delivery == 'sameday' && radio == true){
        						BLC.ajax({
        							url:sandbox.utils.contextPath +"/checkout/checkSamedayDelivery",
        							type:"POST",
        							dataType:"json",
        							data: {toAddress :'NONE'}
        						},function(data){
									var finishModal = UIkit.modal('#finish-refund', {center:false});
									if(data.isDeliverableTime !== true){
										finishModal.find('h1').text('오늘도착 주문마감');
										finishModal.find('.contents-wrap>p>strong').html('오늘도착 서비스 이용 시간이 지났습니다.<br>현재 상품은 일반배송으로 주문이 가능합니다.<br>일반배송으로 주문 진행하시겠습니까?');
										var html = '<a href="#none" class="btn-link large btn-enter uk-modal-close">일반배송 주문진행</a>';
										html+= '<a href="#none" class="btn-link line large uk-modal-close">취소</a>';
										finishModal.find('.btn-wrap').html(html)
										finishModal.show();
										finishModal.find('.btn-enter').off('click').on('click', function(){
											$this.find('[data-delivery]').each(function(){
						        				var delivery = $(this).data('delivery');
												if(delivery == 'default'){
													$(this).find('input[type=radio]').attr("checked",true);
											        Method.submitForm();
											    }
											});
										});
									} else if(data.isDeliverableLocation !== true){
										finishModal.find('h1').text('일시 품절 안내');
										finishModal.find('.contents-wrap>p>strong').html('죄송합니다. 현재 재고가 없습니다.');
										finishModal.find('.btn-wrap').html('<a href="#none" class="btn-link line large btn-enter">확인</a>')
										finishModal.show();
										finishModal.find('.btn-enter').off('click').on('click', function(){
										    location.href = sandbox.utils.contextPath
										});
									} else{
										var samedayPrice = $this.find('[data-sameday-price]').data('sameday-price');
										var samedayPriceReplace = String(samedayPrice).replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
										finishModal.find('h1').text('오늘도착 주문안내');
										var text = '오늘도착 배송으로 주문 선택하셨습니다.<br>';
										text += '결제 완료 후 배송지 변경이 불가하므로 정확한 배송지 정보로 등록되어 있는지 확인해주세요.<br>';
										text += '(서비스 비용 ' + samedayPriceReplace + '원)';
										finishModal.find('.contents-wrap>p>strong').html(text);
										var html = '<a href="#none" class="btn-link line large uk-modal-close">취소</a>';
										html+= '<a href="#none" class="btn-link large btn-enter">확인</a>';
										finishModal.find('.btn-wrap').html(html)
										finishModal.show();
										finishModal.find('.btn-enter').off('click').on('click', function(){
									        Method.submitForm(true);
										});
									}
        						});
						    }
            			});
					}
				})

				// 배송지 선택 버튼
				$this.find('[data-customer-address-btn]').on('click', function(e){
					e.preventDefault();
					Method.showCustomerAddressList();
					//Method.$popAddressModal.show();
				});

				// 배송지 입력 타입 버튼 선택시
				$this.find('[data-address-type]').on('show.uk.switcher', function(){
					Method.isSelectAddress = deliverySearch.getValidateChk();
					Method.updateAddressInput();
				});
	
				// 선택된 주소가 있으면 주소가 정상적인지 한번 체크한다.
				/*
				if (Method.isSelectAddress) {
					Method.validateCustomerAddress(Method.$beforeAddress.find('input[name="address.addressLine1"]').val());
				}else{
					Method.$addressWrap.addClass('uk-hidden');
					Method.$addressErrorInfo.addClass('uk-hidden');
					Method.$beforeAddress.removeClass('uk-hidden');
				}
				*/
			},
			submitForm: function(isSameDay){
				endPoint.call('submitShippingInfoForm', { isSameDay : isSameDay});
				$form.submit();
			},
			getShppingMesasgeByRemoveUnusable: function (message) {
				var escapedString = message.replace(/\"|\\/g, '');
				var resultString = sandbox.utils.string.removeEmojis(escapedString);

				return resultString;
			},
			removeWrongAddress:function(addressId){
				if (Method.addressComponent != null) {
					// 처음 들어오는건 기본 배송지지만 선택을 해서 변경
					UIkit.modal.alert('배송지가 유효하지 않아 삭제 됩니다. 다른 배송지를 사용하거나 배송지를 새로 입력하세요.').on('hide.uk.modal', function () {
						Core.Loading.show();
						Method.addressComponent.removeAddress(addressId, function (data) {
							window.location.reload();
						});
					});
				}
			},
			addCustomerAddressEvent:function(){
				// 배송지 선택 모듈 select 이벤트 호출( 배송지 선택했을때 호출됨 )
				Core.getComponents('component_customer_address', { context: $this }, function () {
					this.addEvent('select', function (data) {
						/*
						var customerAddrssValidationResult = Core.Utils.addressApi.init().isEmpty(data.addressLine1);
						if (customerAddrssValidationResult) {
							Method.removeWrongAddress(data.id);
							return;
						}
						*/

						Method.updateCustomerAddress(data, true);
						if (Method.$popAddressModal.isActive()) {
							Method.$popAddressModal.hide();
							// 배송방식 선택
							var paramObj = {
								toAddress: data.postalCode
							}
							BLC.ajax({
								url: sandbox.utils.contextPath + "/checkout/checkSamedayDelivery",
								type: "POST",
								dataType: "json",
								data: paramObj
							}, function (data) {
								if (data.isPossibleSamedayDelivery !== true) {
									samedayDeliveryCheck();
									if (data.isDeliverableTime == true) {
										if (data.isDeliverableCustomer == true) {
											if (data.isDeliverableProductFlag == true) {
												if (data.isDeliverableProductCount == true) {
													if (data.isDeliverableFulfillmentCount == true) {
														if (data.isDeliverableAddress == true) {
															// 오류메세지 노출 안함
														} else {
															samedayError.text(isDeliverableAddressError);
														}
													} else {
														samedayError.text(isDeliverableFulfillmentCountError);
													}
												} else {
													samedayError.text(isDeliverableProductCountError);
												}
											} else {
												if (data.isDeliverableProductFlagMixed == true) {
													samedayError.text(isDeliverableProductFlagError);
												} else {
													// 오류메세지 노출 안함
												}
											}
										} else {
											// 오류메세지 노출 안함
										}
									} else {
										samedayError.text(isDeliverableTimeError);
									}
								} else {
									samedayDeliveryEnable();
								}

							});
						}
					})
				});
			},
			showCustomerAddressList:function(){
				var obj = {
					'mode': 'template',
					'templatePath': '/modules/customerAddress',
					'needCustomerAddress': 'Y'
				}
				sandbox.utils.ajax(sandbox.utils.contextPath + '/processor/execute/customer_info', 'GET', obj, function (data) {
					var appendHtml = $(data.responseText);
					Method.$popAddressModal.element.find('.contents').empty().append(appendHtml[0].outerHTML);
					sandbox.moduleEventInjection(appendHtml[0].outerHTML);
					Method.addCustomerAddressEvent();
					Method.$popAddressModal.show();
				});
			},
			updateCustomerAddress:function(data, isValidate){
				Method.isChangeCustomerAddress = true;
				var $target = Method.$beforeAddress;
				//$target.addClass('uk-hidden');
				if( $target.find('[data-user-name]').length > 0 ){
					$target.find('[data-user-name]').html($.trim(data.fullName));
				}

				if( $target.find('[data-phone]').length > 0 ){
					$target.find('[data-phone]').html($.trim(data.phoneNumber));
				}

				if( $target.find('[data-postalCode]').length > 0 ){
					$target.find('[data-postalCode]').html($.trim(data.postalCode));
				}

				if( $target.find('[data-address]').length > 0 ){
					$target.find('[data-address]').html($.trim(data.addressLine1 + ' ' + data.addressLine2));
				}

				/*
				if( $target.find('[data-address2]').length > 0 ){
					$target.find('[data-address2]').text(data.addressLine2);
				}
				*/

				// 변경된 값 input 에 적용
				$target.find('#addressId').val($.trim(data.id));
				$target.find('input[name="address.fullName"]').val($.trim(data.fullName));
				$target.find('input[name="address.phonePrimary.phoneNumber"]').val($.trim(data.phoneNumber));
				$target.find('input[name="address.addressLine1"]').val($.trim(data.addressLine1));
				$target.find('input[name="address.addressLine2"]').val($.trim(data.addressLine2));
				$target.find('input[name="address.postalCode"]').val($.trim(data.postalCode));
				
				endPoint.call('changeShippingAddress', data);
				/*
				if (isValidate) {
					Method.validateCustomerAddress(data.addressLine1);
				}else{
					Method.$addressWrap.removeClass('uk-hidden');
					Method.$addressErrorInfo.addClass('uk-hidden');
					$target.removeClass('uk-hidden');
				}
				*/
			},
			updateAddressInput:function(){
				if( Method.$beforeAddress.hasClass('uk-active')){
					Method.isNewAddress = false;
					Method.$beforeAddress.find('input').attr('disabled', false );
					Method.$newAddress.find('input').attr('disabled', true );
				}else{
					Method.isNewAddress = true;
					Method.$beforeAddress.find('input').attr('disabled', true );
					Method.$newAddress.find('input').attr('disabled', false );
				}

				var postalCode = (Method.isNewAddress) 	? $('[data-new-address].uk-active [data-postalcode]').text()
														: $('[data-before-address].uk-active [data-postalcode]').text();

				//postalCode 존재 시에만 당일배송 가능 여부 ajax 체크 실행
				if(postalCode !== ''){
					Method.checkPostalCodeSamedayDelivery(postalCode);
				}

				// 배송방식 선택
				var data = {
				    isPossibleSamedayDelivery : samedayError.data('ispossiblesamedaydelivery') ,
				    isDeliverableProductFlag : samedayError.data('isdeliverableproductflag') ,
				    isDeliverableTime : samedayError.data('isdeliverabletime') ,
				    isDeliverableProductCount : samedayError.data('isdeliverableproductcount') ,
				    isDeliverableFulfillmentCount : samedayError.data('isdeliverablefulfillmentcount') ,
				    isDeliverableAddress : samedayError.data('isdeliverableaddress') ,
				    isDeliverableCustomer : samedayError.data('isdeliverablecustomer') ,
				    isDeliverableProductFlagMixed : samedayError.data('isdeliverableproductflagmixed')
				}
				if($('.dl-same').length !== 0 && data.isPossibleSamedayDelivery !== true) {
                    samedayDeliveryCheck();
					if (data.isDeliverableTime == true) {
						if (data.isDeliverableCustomer == true) {
							if (data.isDeliverableProductFlag == true) {
								if (data.isDeliverableProductCount == true) {
									if (data.isDeliverableFulfillmentCount == true) {
										if (data.isDeliverableAddress == true) {
											// 오류메세지 노출 안함
										} else {
											samedayError.text(isDeliverableAddressError);
										}
									} else {
										samedayError.text(isDeliverableFulfillmentCountError);
									}
								} else {
									samedayError.text(isDeliverableProductCountError);
								}
							} else {
								if (data.isDeliverableProductFlagMixed == true) {
									samedayError.text(isDeliverableProductFlagError);
								} else {
									// 오류메세지 노출 안함
								}
							}
						} else {
							// 오류메세지 노출 안함
						}
					} else {
						samedayError.text(isDeliverableTimeError);
					}
				} else{
					samedayDeliveryEnable();
				}
			},
			checkPostalCodeSamedayDelivery:function(postalCode){
				if(postalCode == null || postalCode == '') return false;

				var data = {
					isPossibleSamedayDelivery : samedayError.data('ispossiblesamedaydelivery') ,
					isDeliverableProductFlag : samedayError.data('isdeliverableproductflag') ,
					isDeliverableTime : samedayError.data('isdeliverabletime') ,
					isDeliverableProductCount : samedayError.data('isdeliverableproductcount') ,
					isDeliverableFulfillmentCount : samedayError.data('isdeliverablefulfillmentcount') ,
					isDeliverableAddress : samedayError.data('isdeliverableaddress') ,
					isDeliverableCustomer : samedayError.data('isdeliverablecustomer') ,
					isDeliverableProductFlagMixed : samedayError.data('isdeliverableproductflagmixed')
				}

				var paramObj = {
					toAddress: postalCode
				}

				BLC.ajax({
					url: sandbox.utils.contextPath + "/checkout/checkSamedayDelivery",
					type: "POST",
					dataType: "json",
					data: paramObj
				}, function (data) {
					if (data.isPossibleSamedayDelivery !== true) {
						samedayDeliveryCheck();
						if (data.isDeliverableTime == true) {
							if (data.isDeliverableCustomer == true) {
								if (data.isDeliverableProductFlag == true) {
									if (data.isDeliverableProductCount == true) {
										if (data.isDeliverableFulfillmentCount == true) {
											if (data.isDeliverableAddress == true) {
												// 오류메세지 노출 안함
											} else {
												samedayError.text(isDeliverableAddressError);
											}
										} else {
											samedayError.text(isDeliverableFulfillmentCountError);
										}
									} else {
										samedayError.text(isDeliverableProductCountError);
									}
								} else {
									if (data.isDeliverableProductFlagMixed == true) {
										samedayError.text(isDeliverableProductFlagError);
									} else {
										// 오류메세지 노출 안함
									}
								}
							} else {
								// 오류메세지 노출 안함
							}
						} else {
							samedayError.text(isDeliverableTimeError);
						}
					} else {
						samedayDeliveryEnable();
					}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-order-delivery]',
					attrName:'data-module-order-delivery',
					moduleName:'module_order_delivery',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	'use strict';

	Core.register('module_store', function(sandbox){
		var $this, $infoViewContainer, filterQuery = [], searchQueryString = '', endPoint, storeInfoComponent, mapComponent, isAjax = false, reqPage = 1;
		/*
			store-info-view 에 추가되는 dom object

			<h2 class="tit">명동</h2>
			<span class="address">서울 영등포구 여의도동</span>
			<span class="phonenum">070-0000-0000</span>
			<dl class="info">
				<dt class="key">운영시간</dt>
				<dd class="value">평일 10:00, 주말 11:00</dd>
				<dt class="key">매장정보</dt>
				<dd class="value">네이버 지도 API v3는 JavaScript 형태로 제공되는 NAVER 지도 플랫폼으로써</dd>
			</dl>
			<button class="close-btn"><i class="icon-delete_thin"></i></button>
		*/

		/**************************

			매장검색
			매장이름, 지역검색 : _find=지하철&_search=name&_condition=like
			필터 : _find={{매장타입}}&_search=storeType&_condition=or||and

			admin에서 재고위치/대리점의 추가속성에 storeType, icon은 각각, 검색필터와 마커의 아이콘의 클래스를 입력하는 속성이다.

			membership: 나이키 멤버십 및 티켓을 사용 할 수 있는 매장
			nrc: nike running club
			ntc: nike traingin club
			reservation: 매장 상품 예약 서비스 제공 하는 매장
			fulfill : ASSIST SERVICE 제공하는 매장

		***************************/

		var submitSearchMap = function(){
			//_find=서울&_search=name&_condition=like&_find=손목시계,지하철&_search=storeType&_condition=or

			var filterParams = location.pathname + '?';
			if(searchQueryString !== '') filterParams += searchQueryString + '&';
			if(filterQuery.length > 0){
				filterParams += '_find='+filterQuery.join(',')+'&_search=storeType&_condition=like';
			//	filterParams = filterParams.replace("fulfill", "");
			}

			// ASSIST SERVICE : commented on 2020-01-31
			/*
			if( $('input[id="all"]').is(":checked") == false && $('input[id="assist"]').is(":checked") == true ){
				filterParams += '&_find=true&_search=fulfill&_condition=equal';
				filterParams += '&_find=PHYSICAL_PICKUP,PHYSICAL_PICKUP_OR_SHIP&_search=type&_condition=equal';
			}
			*/

			// NFS 매장도 검색결과에 포함 2019-04-24
			if (filterParams.indexOf("ignoreSharing") < 0) {
				filterParams += "&ignoreSharing=true";
			}

			location.href = filterParams.replace(/[?|&]$/, '');
		}

		var requestMapPaging = function(){
			if(isAjax == false && reqPage){
				reqPage = ++reqPage;
				var queryParams = Core.Utils.getQueryParams(location.href, 'array');
				var url = (queryParams.length > 0) ? Core.Utils.contextPath + '/store?' + queryParams.join('&') : Core.Utils.contextPath + '/store';
				Core.Utils.ajax(url, 'GET',{'page':reqPage}, function(data){
					var storeList = sandbox.rtnJson($(data.responseText).find('[data-component-map]').attr('data-store-list')) || [];
					if($(data.responseText).find(".search-list").length === 0){
						reqPage = undefined;
					}else{
						$(data.responseText).find(".search-list").each(function(){
							$(".search-result").append($(this));
						});
						if(mapComponent) mapComponent.setStoreList(storeList).reInit();
					}

					setTimeout(function(e){
						isAjax = false;
					}, 100);
				},true);
			}
		}

		var Method = {
			moduleInit:function(){
				var args = arguments[0];
				$this = $(this);
				$infoViewContainer = $(this).find(args.infoview);

				endPoint = Core.getComponents('component_endpoint');

				var currentParams = sandbox.utils.getQueryParams(location.href);
				var arrCurrentFilters = [];
				var currentStoreIndex = 0;
				if(currentParams.hasOwnProperty('_find') && currentParams['_find'] instanceof Array){
					arrCurrentFilters = sandbox.utils.arrSameRemove(currentParams['_find'][1].split(','));
				}else{
					currentParams = null;
					arrCurrentFilters = null;
				}

				mapComponent = sandbox.getComponents('component_map', {context:$this}, function(){
					this.addEvent('openMarker', function(storeInfo, i){
						//var objStoreInfo = Method.getStoreList($(this).attr('data-store-id'));

						storeInfo.OpeningHours = storeInfo.additionalAttributes['영업시간'];

						Method.showInfoDetail(storeInfo);
						currentStoreIndex = i;
						if($('body').attr('data-device') !== 'pc') $this.find('.search-result').css('display','none');
					});

					this.addEvent('closeMarker', function(i){
						$infoViewContainer.stop().animate({'left':$infoViewContainer.outerWidth(true)}, 300, function(){
							$infoViewContainer.removeAttr('style');
							$this.find('.search-result').removeAttr('style');
						});
					});
				});

				var searchField = sandbox.getComponents('component_searchfield', {context:$this}, function(){
					/*this.addEvent('beforeSubmit', function(){
						var val = arguments[0];
						$('input[name=_find]').val(val);
					});*/
					this.addEvent('searchEmpty', function($form){
						searchQueryString = $form.serialize();
						endPoint.call("searchStore", { key : searchQueryString })
						submitSearchMap();
					});

					this.addEvent('searchKeyword', function($form, value){
						searchQueryString = $form.serialize();
						endPoint.call("searchStore", { key : searchQueryString })
						submitSearchMap();
					});
				});

				var searchCheckBox = sandbox.getComponents('component_checkbox', {context:$this}, function(i, dom){
					this.addEvent('change', function(val){
						var $this = $(this);
						var index = filterQuery.indexOf(val);
						var val = $this.val();
						if(val !== 'all'){
							if($this.parents('[data-component-checkbox]').hasClass('checked')){
								filterQuery.push(val);
							} else{
								filterQuery.splice(filterQuery.indexOf(val),1);
							}
						}
					});

					if(arrCurrentFilters !== null && arrCurrentFilters.indexOf(encodeURI(this.getThis().val())) > -1){
						this.getThis().prop('checked', true);
						this.getThis().trigger('change');
					}
				});

				storeInfoComponent = new Vue({
					el:'#store-info-vue',
					data:{
						"name":null,
						"address1":null,
						"address2":null,
						"phone":null,
						"openHours":null
					},
					methods:{
						close:function(){
							mapComponent.mapEvent(currentStoreIndex);
						}
					}
				});

				$(this).find('.filter-btn').click(function(e){
					e.preventDefault();

					/*if(filterQuery.length > 0){
						var filterQueryParams = sandbox.utils.getQueryParams($(this).closest('form').serialize());
						filterQueryString = '_find='+filterQuery.join(',');
						if(filterQueryParams._search) filterQueryString += '&_search='+filterQueryParams._search;
						if(filterQueryParams._condition) filterQueryString += '&_condition='+filterQueryParams._condition;
					}else{
						filterQueryString = '';
					}*/

					searchField.externalAction();
				});

				//매장목록 페이징처리
				$(".search-result").scroll(function(){
					if((this.scrollTop + this.clientHeight) >= this.scrollHeight){
						requestMapPaging();
						isAjax = true;
					}
				});

				$(this).find('.search-result').on('click', 'li .search-list-a', function(e){
					e.preventDefault();

					mapComponent.mapEvent($(this).parent().index());

					$this.find('.search-result').removeAttr('style');
					if($('body').attr('data-device') !== 'pc') {
						$this.find('.search-result').css('display', 'none');
					}

					//서비스필터 open 상태에서 매장 목록 클릭시 서비스필터 close함
					var target = '#service-filter-area';
					if($(target).is(":visible")){
						$(target).hide();
						$(target).addClass('close');
					}
				});

				//service filter area show and hide
				$(this).on('click', '#service-filter-btn', function(e){
					var target = '#service-filter-area';
					if($(target).is(":visible")){
						$(target).hide();
						$(target).addClass('close');
					} else {
						$(target).show();
						$(target).removeClass('close');
					}
				});

				Method.updateCheckAll();

				// 매장찾기 전체 체크시
				$(this).find('input.check-all-store[type="checkbox"]').on('change', Method.changeAllCheck);
				// 아이템 체크박스 선택시
				$(this).find('input.check-item-store[type="checkbox"]').on("change", Method.changeItemCheck);

				//args에 startToDetail이 true일때 해당 상점의 디테일에 이벤트trigger를 한다. 단, storeId로 단일 상점필터를 걸었을경우 동작한다.
				if(args.startToDetail === 'true' && $(this).find('.search-result > li').length === 1){
					$(this).find('.search-result > li').eq(0).find('a').trigger('click');
				}
			},
			// 매장찾기 전체 체크 처리
			changeAllCheck:function(e){
				e.preventDefault();
				var isCheck = $(this).prop('checked');
				$('input.check-item-store[type="checkbox"]').each( function(){
					if(isCheck == true && !$(this).prop('checked')){
						$(this).prop('checked', isCheck ).trigger('change');
					}
					if(isCheck == false && $(this).prop('checked')){
						$(this).prop('checked', isCheck ).trigger('change');
					}
				});
			},
			// 아이템 체크박스 선택시
			changeItemCheck:function(e){
				var isCheck = $(this).prop('checked');
				if( isCheck ){
					$(this).parent().addClass('checked');
				}else{
					$(this).parent().removeClass('checked');
				}
				Method.updateCheckAll();
			},
			// 아이템 체크박스 변경시 전체 선택 체크박스 상태처리
			updateCheckAll:function(){

				if($('input.check-item-store[type="checkbox"]').length == $('input.check-item-store[type="checkbox"]:checked').length ){
					$('input.check-all-store[type="checkbox"]').prop( 'checked', true);
				}else{
					$('input.check-all-store[type="checkbox"]').prop( 'checked', false);
				}
			},
			//Store 선택 시 상세 정보 만드는 스크립트 실행
			showInfoDetail:function(data){
				storeInfoComponent.name = data.name;
				storeInfoComponent.address1 = data.address1;
				storeInfoComponent.address2 = data.address2;
				storeInfoComponent.phone = data.phone;
				storeInfoComponent.openHours = data.additionalAttributes['영업시간'];
				$infoViewContainer.stop().animate({'left':0}, 300);
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-store]',
					attrName:'data-module-store',
					moduleName:'module_store',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_order_pickup', function(sandbox){
		var args;
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				args = arguments[0];

				//주문자 인풋 컴포넌트
				var inputComponent = sandbox.getComponents('component_textfield', {context:$this});

				//주문자와 동일
				var checkoutComponent = sandbox.getComponents('component_checkbox', {context:$this}, function(i){
					this.addEvent('change', function(isChecked){
						if(isChecked){
							var customerInfo = sandbox.getModule('module_order_customer').getOrderCustomerInfo();
							$this.find('#fullname').val(customerInfo.name).focusout();
							$this.find('#phonenumber').val(customerInfo.phoneNum).focusout();
						}else{
							$this.find('#fullname').val('').focusout();
							$this.find('#phonenumber').val('').focusout();
						}
					});
				});

				var $form = $('#pickup_info');
				sandbox.validation.init( $form );

				$this.find('[data-order-pickup-submit-btn]').click(function(e){

					e.preventDefault();

					sandbox.validation.validate( $form );

						if(sandbox.validation.isValid( $form )){

								if(!inputComponent[0].getValidateChk('errorLabel') || !inputComponent[1].getValidateChk('errorLabel')){

								} else{

										//CTM태깅...추가...
										var str = $this.find("[data-isjustreservation]").data('isjustreservation');

										// if($.type(str)=="boolean"){
										if(str==true || str=="true"){
											c_name = "ROPIS_submit_go to next";   // 로피스 일때에는 , orderSubmit 함수에 click 네임 변수 추가..
										}else if(str==false || str=="false"){
											c_name = "BOPIS_submit_go to next";
											//ctm 태깅 추가
											endPoint.call('clickEvent', {'area' : 'inventory', 'name' : c_name });   //클릭 이벤트
										}

										//로피스만  orderSubmit 태깅 진행
										if(str==true || str=="true"){
											endPoint.call("orderSubmit", { 'paymentType' : null , 'physicaltype' : 'PHYSICAL_ROPIS'});  //ctm ropis _dl 추가.
										}

										$("#pickup_info").submit();
								}
						}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-order-pickup]',
					attrName:'data-module-order-pickup',
					moduleName:'module_order_pickup',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	'use strict';

	Core.register('module_switcher', function(sandbox){
		var Method = {
			moduleInit:function(){
				// structured content에서 ukkit에 switcher module를 사용할 때 categoryslider 리셋 처리
				$(this).on('show.uk.switcher', function(event, area){
					var $container = $(this).closest('.content-container').find('.tab-container.uk-switcher > *').eq($(area).index());
					var $slider = $container.find('[data-component-slider]');
					if( $slider.length > 0){

						Core.getComponents('component_slider', {context:$container}, function(){
							$(this)[0].redrawSlider();
						});

						//$slider.bxSlider().reloadSlider();
					}

					/* image lazeload를 사용하지 않아 주석처리함 */
					/*setTimeout(function(e){
						$(window).trigger("scroll");
					}, 10);*/
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-switcher]',
					attrName:'data-module-switcher',
					moduleName:'module_switcher',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	'use strict';

	Core.register('module_dynamicentity', function(sandbox){
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var $submitInput = $(this).find('input[name=_find]');
				var search = sandbox.getComponents('component_searchfield', {context:$this}, function(){
					this.addEvent('submit', function(target, val){
						$submitInput.val(val);
						target.submit();
					});
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-dynamicentity]',
					attrName:'data-module-dynamicentity',
					moduleName:'module_dynamicentity',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	'use strict';
	Core.register('module_wishlist', function(sandbox){

		var $this, modal;
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var miniCartModule = sandbox.getModule('module_minicart');
				modal = UIkit.modal('#common-modal', {center:true});

				$this.on('click', '.wish-delete_btn', function(e){
					e.preventDefault();
					var $that = $(this);
					UIkit.modal.confirm('삭제 하시겠습니까?', function(){
						location.href = $that.attr('href');
					});
				});

				$this.find('.addtocart').each(function(i){
					var target = $(this).attr('data-target');
					var url = $(this).attr('data-href');

					$(this).click(function(e){
						e.preventDefault();

						Core.Utils.ajax(url, 'GET', {quickview:true, accepted:true}, function(data){
							var domObject = $(data.responseText).find('#quickview-wrap');

							if (domObject.length == 0) {
								UIkit.modal.alert('판매 중지된 상품입니다.');
							} else {
								$(target).find('.contents').empty().append(domObject[0].outerHTML);
								$(target).addClass('quickview');
								Core.moduleEventInjection(domObject[0].outerHTML);
								modal.show();

								//모바일 pdp STICKY 사이즈
								$(".pdp_sticky_sizeinfo").css('width','90%');
								$(".sticky-btn").addClass('wish_btn');

								//위시리스트 장바구니 담기.. 위시리스트 태깅(마케팅 스크립트가 미작동 되어.. 새로 data 구성...)
								e.preventDefault();
								var data = {};
								data.product_url =  $(target).find('#ctm_teg').data('url');
								data.products 	 = [];


								if( $(target).find(".product-soldout").length > 0 ){
									var isSoldOut = true;
								}else{
									var isSoldOut = false;
								}
								data.products = [
									{
										product_category : $(target).find('#ctm_teg').data('bu'), 	// products, prop1, eVar12, prop20
										product_name : $(target).find('#ctm_teg').data('name'), 			// products, prop1, eVar12, prop20
										product_id : $(target).find('#ctm_teg').data('id'), // (2018-01-03 추가)
										product_quantity : $(target).find('#ctm_teg').data('quantity'),
										product_unit_price : $(target).find('#ctm_teg').data('unit_price'),
										product_discount_price: $(target).find('#ctm_teg').data('discount_price'),
										product_inventory_status : "in stock", // 재고 상태
										avg_product_rating : ($(target).find('#ctm_teg').data('product_rating') =='0.0') ? '' : Number($(target).find('#ctm_teg').data('product_rating') / 100 * 5).toFixed(1), // 평균 review 평점
										number_of_product_review : $(target).find('#ctm_teg').data('product_review'), // review 갯수
										product_finding_method : "browse", // 상품 페이지 방문 경로

									}
								];

								// 세일중 이면 태깅 변수 추가.
								if( $(target).find('#ctm_teg').data('unit_price') > $(target).find('#ctm_teg').data('discount_price') ){

								 var queryString  = Core.Utils.url.getQueryStringParams(data.product_url);

									if( queryString.cr != null ){
										data.products[0].price_status = "clearance";
									}else{
										data.products[0].price_status = "reduced";
									}
								}
								endPoint.call( 'mini_wishlist', data );
							}
						});

						/*sandbox.utils.ajax(url, 'POST', data, function(data){
							var jsonData = sandbox.rtnJson(data.responseText);
							if(jsonData.hasOwnProperty('error')){
								UIkit.notify(jsonData.error, {timeout:3000,pos:'top-center',status:'warning'});
							}else{
								//UIkit.notify('쇼핑백에 상품이 담겼습니다.', {timeout:3000,pos:'top-center',status:'success'});
								miniCartModule.update();
							}
						});*/
					});
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-wishlist]',
					attrName:'data-module-wishlist',
					moduleName:'module_wishlist',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function (Core) {
	Core.register('module_custom_event', function (sandbox) {
		var $this, $eventForm, addressModal, $imageUploadFields;
		var Method = {
			moduleInit: function () {
				$this = $(this);
				$eventForm = $this.find("#eventForm");
				addressModal = UIkit.modal("#popup-daum-postcode", { modal: false });
				$imageUploadFields = $this.find('[data-image-upload]');

				// 각 타입에 따른 추가 설정
				$this.find('[data-type]').each(function () {
					var type = $(this).data('type');
					var $input = $(this).find("input");
					if (type == 'number') {
						var maxLength = $input.attr('maxlength') || '';
						if (maxLength != '') {
							$input.attr('data-parsley-range', Method.getRange(maxLength));
						}
						// 커스텀 패턴이 없으면 ios 에서 숫자 키패드가 노출되도록 속성 추가
						if ($input.attr('data-parsley-pattern') == null) {
							$input.attr('pattern', '[0-9]*');
						}
					}
				});

				// 업로드 버튼 클릭시 현재 자신의 속한 modal 닫기
				$this.find('[data-upload-btn]').on('click', Method.closeModalByClosest);
				$this.find('[data-address-open-btn]').on('click', Method.openAddressModal);
				$this.find('#eventSubmit').on('click', Method.submit);

				if ($imageUploadFields.length > 0) {
					Method.initImageUploadFields();
				}
			},
			initImageUploadFields: function(){
				$.each($imageUploadFields, function (index, data) {
					var $thumbnailWrap = $(this).find('[data-wrap-file-thumb]');
					var $errorMsg = $eventForm.find('[data-info-error-message]');
					$thumbnailWrap.on('click', '[data-btn-remove-img]', function (e) {
						e.preventDefault();
						$(this).parent().remove();
						fileLoad.minusCurrentIndex();
					})
					var fileLoad = Core.getComponents('component_file', { context: $('body') }, function () {
						var _self = this;
						this.addEvent('error', function (msg) {
							UIkit.notify(msg, { timeout: 3000, pos: 'top-center', status: 'warning' });
						});

						this.addEvent('upload', function (fileName, fileUrl, realFileName) {
							var ext = String(fileUrl).split('.').pop();
							var type = '';
							if (_.includes(['gif', 'png', 'jpg', 'jpeg'], ext)) {
								type = 'image';
							}else{
								type = 'document';
							}
							$errorMsg.hide();
							var thumb = '<span class="preview-up-img" data-real-file-name="'+realFileName+'" data-file-url="'+ fileUrl.replace('/cmsstatic/eventAssetFile', '') +'">'
							thumb+='<a href="javascript:;" class="file-remove_btn" data-btn-remove-img=""></a>';
							if (type == 'image') {
								thumb+='<img src="' + Core.Utils.contextPath+fileUrl + '?thumbnail" alt="' + realFileName + '" />';
							}else if( type == 'document'){
								thumb+= '<i class="g72-swoosh-plus document-icon"></i><div class="document-file-name">'+ realFileName+'</div>';
							}
							thumb+='</span>';
							$thumbnailWrap.append(thumb);
							this.plusCurrentIndex();
						});
					});
				})
			},
			closeModalByClosest: function(e){
				if ($(this).closest('.uk-modal').length > 0) {
					UIkit.modal($(this).closest('.uk-modal')).hide();
				}
			},
			openAddressModal: function(e){
				e.preventDefault();
				var $self = $(this);
				var daumPostCode = document.getElementById('daum-postcode-container');
				daum.postcode.load(function () {
					addressModal.show();
					new daum.Postcode({
						oncomplete: function (data) {
							var zipcode = data.zonecode;
							var address = data.address;

							// 도로명 선택시 노출되는 정보 변경 - 현재는 사용하지 않음
							/*
							if( data.userSelectedType == 'J' ){
								zipcode = data.postcode;
								address = data.jibunAddress;
							}
							*/

							var $searchContainer = $self.closest('[data-address-search-container]');
							$searchContainer.find('label').remove();
							$searchContainer.find('[data-address-line1]').val('(' + zipcode + ')' + address);
							$searchContainer.find('[data-address-line2]').focus();
							$searchContainer.find('[data-is-search]').data('is-search', true);

							//alert( zipcode + ' : ' + doro );
							/*
							$this.find('#addressline1').val(doro);
							$this.find('#addressline2').focus();
	
							$zipCodeInput.val( zipcode );
							$zipCodeDisplay.text( zipcode );
							$zipCodeDisplay.parent().removeClass("uk-hidden");
							Method.isSelectAddress = true;
	
							//postcode 모달창을 닫아주고 addressline2로 포커스이동
							addressModal.hide();
							$this.find('#addressline2').focus();
							*/

							addressModal.hide();
						},
						// 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분. iframe을 넣은 element의 높이값을 조정한다.
						onresize: function (size) {
							//element_wrap.style.height = $(window).height() - 46 + 'px'; //size.height+'px';
						},
						width: '100%',
						hideMapBtn: true,
						hideEngBtn: true
					}).embed(daumPostCode);
				});
			},
			getRange:function(length, type){
				var min = '0';
				var max = '9';
				for (var i = 1; i < length; i++) {
					//min += '0';
					max += '9';
				}
				if (type == 'max') {
					return max;
				} else if (type == 'min') {
					return min;
				}
				return '[' + min + ',' + max + ']';
			},
			getValidtionAgree: function(){
				var $agreeForm = $("#agreeForm");
				var isAgree = true;
				if ($agreeForm != null) {
					var queryParams = Core.Utils.getQueryParams($agreeForm.serialize());
					var values = _.values(queryParams);
					console.log('queryParams: ', _.values(queryParams))
					$agreeForm.find('[data-component-radio]').each(function (i, radio) {
						// 필수 항목이면
						if ($(this).data('required') != false) {
							if (values[i] == 'false') {
								isAgree = false;
								return false;
							}
						}
					})
					/* 
					var queryParams = Core.Utils.getQueryParams($form.serialize());
					if( _.without( _.values( queryParams ), 'true' ).length > 0 ){
						return false;
					}
					*/
				}
				return isAgree;
			},
			submit:function(e){
				e.preventDefault();
				Core.validation.init( $eventForm );
				Core.validation.validate( $eventForm );
				if(Core.validation.isValid( $eventForm )){
					
					// 검색을 통해 등록했는지 확인
					$this.find('[data-address-search-container]').each(function(){
						var data = Core.Utils.strToJson($(this).data('address-search-container'), true);
						var isRequire = data.isRequire == 'true' ? true : false;
						var isSearch = $(this).find('[data-is-search]').data('is-search');
						
						if( isRequire == true && isSearch == false ){
							UIkit.modal.alert('검색을 통해 주소를 입력하세요.');
							return false;
						}

						$(this).find('input[name="'+ data.name +'"]').val( $(this).find('[data-address-line1]').val() + ' ' + $(this).find('[data-address-line2]').val())
					})

					// 약관 내용 확인
					if( !Method.getValidtionAgree() ){
						UIkit.modal.alert('필수 약관에 모두 동의해 주세요.');
						return false
					}

					// 이미지 등록 필드 여부확인
					var $imageUploadFields = $eventForm.find('[data-image-upload]');
					var isError = false;
					if ($imageUploadFields.length > 0) {
						var fileLoad = Core.getComponents('component_file', { context: $eventForm });
						$.each($imageUploadFields, function (index, data) {
							var option = Core.Utils.strToJson($(this).data('image-upload'));
							var fileComponent = _.isArray(fileLoad) ? fileLoad[index] : fileLoad;
							// 필수 여부 확인하여 메시지 노출
							if (option.require == true) {
								var currentUploadImageCount = fileComponent.currentIndex();
								var $errorMsg = $eventForm.find('[data-info-error-message]');
								if (currentUploadImageCount == 0) {
									// 메시지 노출
									$errorMsg.show();
									isError = true;
									return false;
								}
							}
							if (isError == false) {
								var inputHiddenTemplate = '<input type="hidden" name="fileList[{{id}}].url" value={{url}} />';
								var $thumbnailWrap = $(this).find('[data-wrap-file-thumb]');
								$thumbnailWrap.children().each(function () {
									var url = $(this).data('file-url');
									var fileName = Core.utils.string.trimAll($(this).data('real-file-name'));
									if (_.isEmpty(url)) {
										isError = true;
										UIkit.modal.alert('이미지 정보가 올바르지 않습니다.<br/>다시 등록해주세요.').on('hide.uk.modal', function () {
											fileComponent.setCurrentIndex(0);
											$thumbnailWrap.empty();
										});
										return false;
									}
									$(this).append(Core.Utils.replaceTemplate(inputHiddenTemplate, function (pattern) {
										switch (pattern) {
											case 'id':
												return index;
												break;
											case 'url':
												return fileName + '__' + url;
												break;
										}
									}));
								})
							}
						})
						if (isError == true) {
							return;
						}
					}

					var queryParams = Core.Utils.getQueryParams($eventForm.serialize());
					var url = decodeURIComponent(queryParams.commentUrl);
					var successAlertMessage = $('[data-success-alert-message]').data('success-alert-message') || null;
					var sData = "";

					// 코멘트를 작성하기 위한 정보
					var data = {
						customerId : queryParams.customerId,
						storageId : queryParams.storageId,
						csrfToken : queryParams.csrfToken
					}

					//delete queryParams.customerId;
					delete queryParams.storageId;
					delete queryParams.csrfToken;
					delete queryParams.commentUrl;

					// 작성한 정보 취합
					$.each( queryParams, function(key, value){
						sData += decodeURIComponent(value).split('+').join(' ');
						sData += '||';
					});
					
					// 약관 동의 정보 추가
					var $agreeForm = $("#agreeForm");
					var agreeValues = _.values(Core.Utils.getQueryParams($agreeForm.serialize()));
					var selectiveValues = [];
					$agreeForm.find('[data-component-radio]').each(function (i, radio) {
						// 필수 항목이 아니라면 선택정보를 저장
						if ($(this).data('required') == false) {
							selectiveValues.push(agreeValues[i] == 'true' ? 't' : 'f');
						}
					});
					sData += String(selectiveValues);
					data.comment = sData;
					// console.log('sData: ', sData);
					$(this).addClass('disabled').attr('disabled', "disabled");
					Core.Loading.show();
					$.ajax({
						type : "POST",
						url : url,
						data : $.param(data),
						success:function(data){
							if( data.result == false ){
								var msg = data.errorMsg._gloabl.overrideErrorMessage;
								if( msg == "구매 예약 기간이 아닙니다."){
									msg = "이벤트 응모 기간이 아닙니다.";
								}
								UIkit.modal.alert(msg).on('hide.uk.modal', function() {
									location.reload();
								});
							}else{
								if( successAlertMessage != null ){
									Core.ui.loader.hide();
									UIkit.modal.alert(successAlertMessage).on('hide.uk.modal', function() {
										Core.ui.loader.show();
										location.reload();
									});
								}else{
									// 응모가 완료 된 후에는 화면을 갱신하고 화면에서 응모 결과를 노출한다.
									location.reload();
								}
								/*
								UIkit.modal.alert(msg).on('hide.uk.modal', function() {
									//location.reload();
								});
								*/
							}
						},
						error:function(req){
							Core.Loading.hide();
							//UIkit.modal.alert( req );
							UIkit.modal.alert('서버 에러 입니다. 다시 시도해 주세요.').on('hide.uk.modal', function() {
								location.reload();
							});
						}
					})
				}
			}
		}
		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-custom-event]',
					attrName: 'data-module-custom-event',
					moduleName: 'module_custom_event',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);


(function (Core, utils) {
	function hasEmojis(str){
		const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
		return regex.test(str);
	}
	utils.has = {
		hasEmojis: hasEmojis
	}
})(Core = window.Core || {}, Core.Utils = window.Core.Utils || {});

(function(Core){
	Core.register('module_filter', function(sandbox){
		'use strict';

		var $filter, args, currentMinPrice, currentMaxPrice, minPrice, maxPrice, limit, arrInputPrice = [], arrQuery = [], currentRangePrice = '', endPoint;
		var pricePattern = 'price=range[{{minPrice}}:{{maxPrice}}]';
		var resetWrap = $('.section-filter .pw-filter-sticky.ncss-filter'); // 필터 선택해제 div
		var countHistory = -1;

		//아이폰 에서 필터를 오픈후, 페이지 이동후 백 할경우 필터가 오픈되는 현상
		//카테고리 페이지 진입시 팔터를 일단 감춘다.
		if(!Core.Utils.mobileChk==false){
			$(".contents-side").hide();
			//console.log("bbbb");
		}

		var limitPrice = function(price){
			if(price < minPrice) return minPrice;
			else if(price > maxPrice) return maxPrice;
			else return price;
		}

		var replaceComma = function(str){
			return str.replace(/,|\.+[0-9]*/g, '');
		}

		var getPriceByPercent = function(price){
			return (price-minPrice) / (maxPrice-minPrice) * 100;
		}

		var getPercentByPrice = function(per){
			return Math.round(minPrice+(limit * per)/ 100);
		}


		var callEndPoint = function( option ){
			var temp = option.split("=");
			if( temp.length > 1){
				var opt = {
					key : temp[0],
					value : temp[1]
				}
				endPoint.call( 'applyFilter', opt );
			}
		}

		var filterStickyConfirm = function () {

			if (sandbox.getModule('module_pagination') !== null) {
				$('#filter-sticky-confirm span').text(sandbox.getModule('module_pagination').getTotalCount());
			}

			var menu_key = 0;
			var filtercategoryUrl = $('#category-swiper').data('url');
			var filtercategoryDepth = $('#category-swiper li.list-depth');

			$('#category-swiper li').each(function (index, val) {
				if ($(val).hasClass('cloth-dhp2')) {
					$('#category-swiper li.list-depth').each(function (index, val) {
						if (!$(val).next().hasClass('cloth-dhp2')) $(val).remove();
						else if ($(val).next().hasClass('cloth-dhp2')) $(val).find('a').text('전체');
					});
				} else if ($(val).hasClass('cloth-dhp3')) {
					$('#category-swiper li.list-depth').each(function (index, val) {
						if (!$(val).next().hasClass('cloth-dhp3')) $(val).remove();
						else if ($(val).next().hasClass('cloth-dhp3')) $(val).find('a').text('전체');
					});
				}
			});

			if($('body').attr('data-device') === 'mobile') {
				$('#category-swiper-container').show();
			}

			$('#category-swiper li').each(function (index, val) {
				var w = $(val).outerWidth();
				$(val).css('width', w + 20);
				if ($(this).hasClass('active')) menu_key = index;
			});

			var swiper = new Swiper('#category-swiper-container', {
				scrollbarHide: true,
				slidesPerView: 'auto',
				centeredSlides: false,
				initialSlide: menu_key,
				// initialSlide: 3,
				grabCursor: false
			});
		}
		filterStickyConfirm();


		$(window).resize(function (e) {
			var wH = $(window).width();
			if (wH <= 480) {
				// console.log('mobile');
				$('.f-subtitle-box').removeClass('.uk-accordion-title');
				$('#category-swiper-container').show();
			} else if (wH > 480 && wH <= 960) {
				// console.log('tablet');
				$('.f-subtitle-box').addClass('.uk-accordion-title');
				$('#category-swiper-container').hide();
			} else if (wH > 960) {
				// console.log('pc');
				$('#category-swiper-container').hide();
			}
		});


		function UpdateHeaders_top() {
			$(".wrapper").each(function() {
				var el = $('.item-list-wrap'),
					filter = $('.filter-wrap_category'),
					offset = el.offset(),
					scrollTop = $(window).scrollTop();

				if(!offset) return;

				(scrollTop > offset.top) ? filter.addClass('sticky') : filter.removeClass('sticky')
			});
		}
		$(window).scroll(UpdateHeaders_top).trigger("scroll");


		var local, local_pathname = location.pathname, params;
		if (location.pathname === "/kr/ko_kr/search") {
			local = location.pathname + location.search; // 검색
		} else {
			local = location.pathname; // 카테고리
		}

		var Method = {
			moduleInit : function () {
				args = arguments[0];
				$filter = $(this);
				endPoint = Core.getComponents('component_endpoint');

				//@pck 2020-08-11
				// filter 파라미터가 url에 추가됨에 따라 히스토리 쌓인 회수를 카운트 해서 이전으로 가기를 구현함(좋은 방법은 아니라서... 나중에 구조변경필요)
				window.onpopstate = function(event) {
					history.go(countHistory);
				}

				//$('input[type=checkbox]').prop('checked', false);

				//초기 query 분류
				//arrQuery = sandbox.utils.getQueryParams(location.href, 'array');
				var query = sandbox.utils.getQueryParams(location.href);
				for(var key in query){
					if(key !== 'page'){
						if(typeof query[key] === 'string'){
							arrQuery.push(key+'='+query[key]);
						}else if(typeof query[key] === 'object'){
							for(var i=0; i < query[key].length; i++){
								arrQuery.push(key+'='+query[key][i]);
							}
						}
					}
				}

				//filter price range
				var priceRange = sandbox.getComponents('component_range', {context:$filter}, function(){
					this.addEvent('change', function(per){
						if($(this).hasClass('min')){
							currentMinPrice = getPercentByPrice(per);
							arrInputPrice[0].setValue(sandbox.rtnPrice(currentMinPrice));
						}else if($(this).hasClass('max')){
							currentMaxPrice = getPercentByPrice(per);
							arrInputPrice[1].setValue(sandbox.rtnPrice(currentMaxPrice));
						}
					});

					this.addEvent('touchEnd', function(per){
						var val = sandbox.utils.replaceTemplate(pricePattern, function(pattern){
							switch(pattern){
								case 'minPrice' :
									return currentMinPrice;
									break;
								case 'maxPrice' :
									return currentMaxPrice;
									break;
							}
						});

						if(arrQuery.indexOf(currentRangePrice) > -1){
							arrQuery.splice(arrQuery.indexOf(currentRangePrice), 1);
						}

						callEndPoint( val );
						arrQuery.push(val);
						currentRangePrice = val;

						Method.appendCateItemList();
					});
				});

				var textfield = sandbox.getComponents('component_textfield', {context:$filter}, function(){
					this.addEvent('focusout', function(e){
						var type = $(this).attr('data-name');
						var per = getPriceByPercent(limitPrice(replaceComma($(this).val())));

						if(type === 'min'){
							priceRange.getSlide(0).setPercent(per);
						}else if(type === 'max'){
							priceRange.getSlide(1).setPercent(per);
						}
					});

					arrInputPrice.push(this);
				});

				if(priceRange){
					var objPrice = (priceRange) ? priceRange.getArgs() : {min:0, max:1};
					minPrice = (objPrice.min == 'null') ? 0:parseInt(objPrice.min);
					maxPrice = (objPrice.max == 'null') ? 1:parseInt(objPrice.max);
					limit = maxPrice - minPrice;
					currentMinPrice = replaceComma(arrInputPrice[0].getValue());
					currentMaxPrice = replaceComma(arrInputPrice[1].getValue());
					priceRange.getSlide(0).setPercent(getPriceByPercent(currentMinPrice));
					priceRange.getSlide(1).setPercent(getPriceByPercent(currentMaxPrice));

					currentRangePrice = sandbox.utils.replaceTemplate(pricePattern, function(pattern){
						switch(pattern){
							case 'minPrice' :
								return currentMinPrice;
								break;
							case 'maxPrice' :
								return currentMaxPrice;
								break;
						}
					});
				}

				// 필터 클릭 처리
				sandbox.getComponents('component_radio', {context:$filter, unlock:true}, function(i){
					var currentValue = '';

					//처음 라디오 박스에 체크 되었을때만 이벤트 발생
					this.addEvent('init', function(){
						var val = this.attr('name') +'='+ encodeURIComponent($(this).val());
						currentValue = val;
					});

					this.addEvent('change', function(input){

						var val = $(input).attr('name') +'='+ encodeURIComponent($(input).val());

						// console.log('sort', val)

						if($(this).parent().hasClass('checked')){
							arrQuery.splice(arrQuery.indexOf(val), 1);
						}else{
							if(currentValue !== '') arrQuery.splice(arrQuery.indexOf(currentValue), 1);
							var filterData = '';
							if( $(this).data('label') != null ){
								filterData = $(this).attr('name') + '=' + $(this).data('label');
							}else{
								filterData = val;
							}
							callEndPoint( filterData );
							arrQuery.push(val);
							currentValue = val;
							// console.log(arrQuery)
						}

						Method.appendCateItemList();
					});
				});

				sandbox.getComponents('component_checkbox', {context:$filter}, function(){
					this.addEvent('change', function(){
						var val = $(this).attr('name') +'='+ encodeURIComponent($(this).val());

						if(arrQuery.indexOf(val) !== -1){
							arrQuery.splice(arrQuery.indexOf(val), 1);
						}else{
							var filterData = '';
							if( $(this).data('label') != null ){
								filterData = $(this).attr('name') + '=' + $(this).data('label');
							}else{
								filterData = val;
							}
							callEndPoint( filterData );
							arrQuery.push(val);
							// console.log(arrQuery)
						}

						Method.appendCateItemList();
					});
				});

				//필터 동작
				$(document).on('click', '.filter-remove-btn', function(e){
					e.preventDefault();

					var query = encodeURI($(this).attr('href'));
					arrQuery.splice(arrQuery.indexOf(query), 1);

					query = arrQuery.join('&');
					query += sandbox.getModule('module_pagination') ? (sandbox.getModule('module_pagination').getPagingType() === 'number' ? '&page=1&' : '') : '';
					window.location.assign(location.pathname + '?' + query);
					countHistory--;
				});

				// 필터 초기화
				$(document).on('click', '#filter-sticky-reset', function(e){
					sandbox.utils.ajax(location.pathname, 'GET', {}, function (data) {
						var responseText = $(data.responseText).find(args['data-module-filter'].target)[0].innerHTML;
						$(args['data-module-filter'].target).empty().append(responseText);
						sandbox.moduleEventInjection(responseText);
						history.pushState(null, null, location.pathname);

						resetWrap.removeClass('active');
						$('.filter-category-wrap form input').prop('checked', false);

						filterStickyConfirm();
					});
				});

				// 필터 열기
				$(document).on('click', args['data-module-filter'].filterOpenBtn, function(e){
					e.preventDefault();

					//아이폰 에서 필터를 오픈후, 페이지 이동후 백 할경우 필터가 오픈되는 현상
					$(".contents-side").show();

					$filter.stop().animate({opacity:1, left:0}, 300, function () {
						$('.pw-filter-sticky').addClass('active');
					});

					$('.dim').addClass('active');
					$('html').addClass('uk-modal-page');
					// $('body').css('paddingRight', 15);

					filterStickyConfirm();
				});

				// $filter.stop().animate({opacity:1, left:0}, 300);
				// $('.dim').addClass('active');
				// $('html').addClass('uk-modal-page');
				// $('body').css('paddingRight', 15);
				// filterStickyConfirm();
				// $('.pw-filter-sticky').addClass('active');

				//모바일일 때 필터 우측 부 dim레이어 탭 시 필터 비활성화
				$('[data-brz-dim]').on('click', function(e){
					$('.content-area .pt_category').removeClass('wideArticleView');
					$filter.stop().animate({opacity:0, left:-300}, 300, function(){
						$(this).removeAttr('style');
						$('.pw-filter-sticky').removeClass('active');
					});
					$(this).removeClass('active');
					$('html').removeClass('uk-modal-page');
					$('body').removeAttr('style');
					endPoint.call('wideToggleClick', 'off');
				});


				//필터 더보기 버튼
				$filter.find('.more-btn').each(function(){
					var $this = $(this);
					var $target = $this.prev();
					var minHeight = $target.height();
					var maxHeight = $target.children().height();

					$(this).click(function(e){
						e.preventDefault();
						//$target.removeClass('more-container'); 20190416 기능변경으로 주석
						//$this.remove(); 20190416 기능변경으로 주석

						// 20190416 더보기 버튼 클릭시 텍스트및 아이콘 변경 추가
						$this.toggleClass( 'active' );

						if ( $(this).hasClass( 'active' ) ) {
							$target.removeClass( 'more-container' );
						} else {
							$target.addClass( 'more-container' );
						}
					});
				});

				// 닫기 버튼
			  $filter.find('.btn-close, #filter-sticky-confirm').on('click', function(){
					$filter.stop().animate({opacity:0, left:-300}, 300, function(){
						$(this).removeAttr('style');
						$('.pw-filter-sticky').removeClass('active');
					});

					$('.dim').removeClass('active');
					$('html').removeClass('uk-modal-page');
					$('body').removeAttr('style');
				});

				// 필터 클릭시 카운팅
				$filter.find( '.uk-accordion-content li label' ).on( 'click', countingSelectedFilters);
			},

			appendCateItemList:function(){
				//console.log(getPagingType);

				// var query = arrQuery.join('&');
				// query += sandbox.getModule('module_pagination') ? (sandbox.getModule('module_pagination').getPagingType() === 'number' ? '&page=1&' : '') : ''
				// window.location.assign(location.pathname + '?' + query);

				// $(args.form).serialize();
				// $(args.form).submit();
				// console.log($('[' + args['data-module-filter'].form + ']').serialize());
				// $('[' + args['data-module-filter'].form + ']').submit();

				var obj = $('.filter-category-wrap form').serialize();

				sandbox.utils.ajax(local, 'GET', obj, function (data) {
					var responseText = $(data.responseText).find(args['data-module-filter'].target)[0].outerHTML;
					$(args['data-module-filter'].target).empty().append(responseText);
					sandbox.moduleEventInjection(responseText);

					if (local_pathname === "/kr/ko_kr/search") {
						params = local + '&' + obj; // 검색
					} else {
						params = local + '?' + obj; // 카테고리
					}
					history.pushState(null, null, params);
					countHistory--;
					filterStickyConfirm();
				});
			}
		}

		/** 20190419 필터 카운트 추가
		* 1.필터별 카운트 표시
		* 2.전체 카운트 표시
		*/
		var countingSelectedFilters = function(){

			var $divWrap = $(this).parents( '.ncss-filter' );  // 현재 선택된 체크박스의 상위 엘리먼트
			var subTitle = $divWrap.find( '.tit-text' ).attr( 'data-click-name' );	// 필터별 서브타이틀
			var subCnt = $divWrap.find( 'li input:checkbox:checked' ).length;  // 필터별 선택된 갯수

			// 서브타이틀 옆에 숫자카운팅 표시
			if( subCnt > 0 ){
				$divWrap.find( '.tit-text' ).text( subTitle + '(' + subCnt + ')' );
			} else {
				$divWrap.find( '.tit-text' ).text( subTitle );
			}

			// 전체 카운트
			var totalCnt = $( '.section-filter' ).find( '.input-checkbox.checked' ).length;
			if( totalCnt > 0 ){
				$( '.f-btn-reset .num' ).text( '(' + totalCnt + ')' );
				resetWrap.addClass('active');
			} else {
				$( '.f-btn-reset .num' ).text( '' );
				resetWrap.removeClass('active');
			}
		}
		$( window ).on( 'load', function() {
			countingSelectedFilters();
			var bodyHeight = $('.contents-body');
			var sideHeight = $('.contents-side');
			if (sideHeight.height() > bodyHeight.height()) sideHeight.addClass('clearSticky');
			else sideHeight.removeClass('clearSticky');
		});

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-filter]',
					attrName:['data-module-filter'],
					moduleName:'module_filter',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});

})(Core);

(function (Core, utils) {
	function isString(str){
		return _.isString(str);
	}
	function isEmpty(obj){
		return _.isEmpty(obj);
	}
	function isFunction(fn){
		return _.isFunction(fn);
	}
	function isArray(arr){
		return _.isArray(arr);
	}
	utils.is = {
		isString: isString,
		isEmpty : isEmpty,
		isFunction : isFunction,
		isArray : isArray
	}
})(Core = window.Core || {}, Core.Utils = window.Core.Utils || {});

(function(Core){
	Core.register('module_giftcard', function(sandbox){
		var Method = {
			moduleInit:function(){
				
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-giftcard]',
					attrName:'data-module-giftcard',
					moduleName:'module_giftcard',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function (Core, utils) {
	function removeEmojis(str) {
		const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
		return str.replace(regex, '');
	}
	function trim(str) {
		return _.trim(str);
	}
	function trimAll(str){
		return str.replace(/\s/gi, ''); 
	}
	function toUpper(str){
		return _.toUpper(str);
	}
	function toLower(str){
		return _.toLower(str);
	}
	function startsWith(str, target, position){
		return _.startsWith(str, target);
	}
	function endsWith(str, target, position){
		return _.endsWith(str, target);
	}
	
	utils.string = {
		removeEmojis: removeEmojis,
		trim: trim,
		trimAll: trimAll,
		toUpper: toUpper,
		toLower: toLower,
		startsWith: startsWith,
		endsWith: endsWith
	}
})(Core = window.Core || {}, Core.Utils = window.Core.Utils || {});
(function(Core){
	'use strict';

	Core.register('module_text_banner', function(sandbox){
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var $banner = $this.find('ul');
				var args = Array.prototype.slice.call(arguments).pop();
				
				//fade, horizontal, vertical
				$(this).removeClass('uk-hidden');
				var defaultOption = {
					onSliderLoad : function(){
						//$this.find('.text-wrap').width($this.find( ".bx-viewport" ).width() )
					},
					auto: true,
					autoDelay: 3000,	
					autoHover: true,
					speed: 800,
					pause: 3000,
					adaptiveHeight: true,
					pager: false,
					useCSS: false,
					mode: 'fade'
				}

				defaultOption = $.extend(defaultOption, args);

				if (defaultOption.mode === 'vertical') {
					defaultOption.adaptiveHeight = false;
				}

				if (defaultOption.pause == null && defaultOption.autoDelay != null) {
					defaultOption.pause = defaultOption.autoDelay;
				}

				var slider = $banner.bxSlider(defaultOption);

				$(this).find('.bxslider-controls .btn-next').on('click', function(e) {
					e.preventDefault();
					slider.goToNextSlide();
				});
				$(this).find('.bxslider-controls .btn-prev').on('click', function(e) {
					e.preventDefault();
					slider.goToPrevSlide();
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-text-banner]',
					attrName:'data-module-text-banner',
					moduleName:'module_text_banner',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function (Core, utils) {
	utils.url = {
		appendParamToURL: function (url, key, value) {
			var g = "?";
			if (url.indexOf(g) !== -1) {
				g = "&";
			}
			return url + g + key + "=" + (_.isEmpty($.trim(value)) ? "" : encodeURIComponent(value))

		},
		appendParamsToUrl: function (e, i, d) {
			var g = this.getUri(e),
				h = arguments.length < 3 ? false : d;
			var f = $.extend(g.queryParams, i);
			var c = g.path + "?" + $.param(f);
			if (h) {
				c += g.hash
			}
			if (c.indexOf("http") < 0 && c.charAt(0) !== "/") {
				c = "/" + c
			}
			return c
		},
		removeParamFromURL: function (d, k) {
			var g = d.split("?");
			if (g.length >= 2) {
				var c = g.shift();
				var j = g.join("?");
				var h = encodeURIComponent(k) + "=";
				var f = j.split(/[&;]/g);
				var e = f.length;
				while (0 < e--) {
					if (f[e].lastIndexOf(h, 0) !== -1) {
						f.splice(e, 1)
					}
				}
				d = c + "?" + f.join("&")
			}
			return d
		},
		updateParamFromURL: function (e, c, f) {
			var d = new RegExp("([?&])" + c + "=.*?(&|$)", "i");
			var g = e.indexOf("?") !== -1 ? "&" : "?";
			if (e.match(d)) {
				return e.replace(d, "$1" + c + "=" + f + "$2")
			} else {
				return e + g + c + "=" + f
			}
		},
		staticUrl: function (c) {
			if (!c || a.trim(c).length === 0) {
				return b.urls.staticPath
			}
			return b.urls.staticPath + (c.charAt(0) === "/" ? c.substr(1) : c)
		},
		ajaxUrl: function (c) {
			return this.appendParamToURL(c, "format", "ajax")
		},
		toAbsoluteUrl: function (c) {
			if (c.indexOf("http") !== 0 && c.charAt(0) !== "/") {
				c = "/" + c
			}
			return c;
		},
		toProtocolNeutralUrl: function (d) {
			var c = d ? d.indexOf("://") : -1;
			return c >= 0 ? d.substr(c + 1) : d;
		},
		// hot-fix (chohh) -20160513
		getCurrentUrl: function () {
			//return window.location.href
			return window.location.origin + window.location.pathname + window.location.search;
		},
		getQueryStringParams: function (c) {
			if (!c || c.length === 0) {
				return {};
			}
			var e = {},
				d = unescape(c);
			d.replace(new RegExp("([^?=&]+)(=([^&]*))?", "g"), function (g, f, i, h) {
				e[f] = h;
			});
			return e;
		},
		getUri: function (e) {
			var c;
			if (e.tagName && a(e).attr("href")) {
				c = e;
			} else {
				if (typeof e === "string") {
					c = document.createElement("a");
					c.href = e;
				} else {
					return null;
				}
			}
			var d = (c.pathname.charAt(0) === "/" ? "" : "/") + c.pathname;
			return {
				protocol: c.protocol,
				host: c.host,
				hostname: c.hostname,
				port: c.port,
				path: d,
				query: c.search,
				queryParams: c.search.length > 1 ? this.getQueryStringParams(c.search.substr(1)) : {},
				hash: c.hash,
				url: c.protocol + "//" + c.hostname + d,
				urlWithQuery: c.protocol + "//" + c.hostname + c.port + d + c.search
			}
		},
		hashExists: function () {
			return (window.location.hash) ? true : false;
		},
		getHashFromUrl: function () {
			return window.location.hash.substring(1);
		}
	}
})(Core = window.Core || {}, Core.Utils = window.Core.Utils || {});
(function(Core){
	'use strict';

	Core.register('module_global_popup', function(sandbox){
		var pop, endPoint;
		var Method = {
			moduleInit:function(){
				var args = Array.prototype.slice.call(arguments).pop();
				endPoint = Core.getComponents('component_endpoint');
				$.extend(Method, args);

				var options = {
					id : Method.id,
					width : Method.width,
					height : Method.height,
					marginLeft : Method.marginLeft || 0,
					marginTop : Method.marginTop || 0,
					marginBottom : Method.marginBottom || 0,
					layoutType : Method.layoutType,
					backgroundColor : Method.backgroundColor,
					borderWidth : Method.borderWidth || 0,
					boxPosition : Method.boxPosition,
					triggerActionType : Method.triggerActionType,
					triggerActionValue : Method.triggerActionValue,
					animationType : Method.animationType,
					closeExpireTime : Method.closeExpireTime,
					useCloseMessage : Method.useCloseMessage,
					closeType : Method.closeType,
					closePosition : Method.closePosition,
					closeMarginTop : Method.closeMarginTop || 0,
					closeMarginLeft : Method.closeMarginLeft || 0,
					closePaddingTop : Method.closePaddingTop || 0,
					closePaddingRight : Method.closePaddingRight || 0,
					closePaddingBottom : Method.closePaddingBottom || 0,
					closePaddingLeft : Method.closePaddingLeft || 0,
					closeBackgroundHeight : Method.closeBackgroundHeight || 0
				}
				pop = $("#global_popup_" + options.id);
				// productList 있을시에는 상품 정보가 있는 페이지( cart, checkout, confirmation ) 에서만 팝업이 동작한다.
				// 팝업 role 설정에서 위 3페이지에 대한 설정을 해야 정상적으로 동작할수 있다.
				if( Method.productList != 'none' ){
					var itemList = _GLOBAL.MARKETING_DATA().itemList;
					var productList = Method.productList;

					if( itemList != null ){
						productList = String(productList).replace(/\s/gi, "");
						productList = productList.split(',');
						itemList = $.map(itemList, function(item){ return item.model });

						if(_.intersection( productList, itemList ).length > 0){
							Method.openPopup(options);
						}else{
							pop.remove();
						}
					}else{
						pop.remove();
					}
				}else if( Method.cartItem != 'none' ){
					if( Core.utils.is.isEmpty(Method.cartItem) == false){
						var rules = '==';
						var result = false;
						var cartItemLen = Number(Method.cartItem.replace('>','').replace('<',''));
						var curCartItemLen = _GLOBAL.CUSTOMER.CART_ITEM;
						if( Core.utils.string.startsWith(Method.cartItem, '>')) rules = '>';
						if( Core.utils.string.startsWith(Method.cartItem, '<'))	rules = '<';
						switch (rules) {
							case '==':
								result = curCartItemLen == cartItemLen;
								break;
							case '<':
								result = curCartItemLen < cartItemLen;
								break;
							case '>':
								result = curCartItemLen > cartItemLen;
								break;
						}
						result ? Method.openPopup(options) : pop.remove();
					}else{
						pop.remove();
					}
				}else{
					Method.openPopup(options);
				}
			},
			openPopup:function(options){
				pop.brzPopup($.extend(options, {
					show:function(){
						endPoint.call('openGlobalPopup',{name : options.id});
					}
				}))
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-global-popup]',
					attrName:'data-module-global-popup',
					moduleName:'module_global_popup',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_category', function(sandbox){
		var $that;
		var arrViewLineClass=['uk-width-medium-1-3', 'uk-width-large-1-2', 'uk-width-large-1-3', 'uk-width-large-1-4', 'uk-width-large-1-5'];

		var stickyHeader = $(".section-header"),
				contentFooter = $('.footer-contents'),
				contentsSide = $('.contents-side');

		// 새 카테고리 해더 sticky
		var newHeaderSticky = function(){
			var // stickyHeaderPos = $("section.content-area").offset().top,
					$window = $(window).scrollTop(),
					filterWrap = $('.filter-category-wrap').offset().top, // 필터 위치
					scrollBottom = $(document).height() - $(window).height() - contentFooter.height(); // 푸터 위치

			/*if ($window >= 60) {
				stickyHeader.addClass("sticky");
			} else {
				stickyHeader.removeClass("sticky");
			}*/

			if ($window >= filterWrap) {
					contentsSide.addClass('fixed');
					contentsSide.removeClass('fixedBottom');
				if ($window > scrollBottom) {
					contentsSide.addClass('fixedBottom');
					contentsSide.removeClass('fixed');
				}
			} else {
				contentsSide.removeClass('fixed');
				contentsSide.removeClass('fixedBottom');
			}
		}

		var Method = {
			moduleInit:function(){
				$this = $(this);

				// assist category 리스트 판별
				$(this).closest('body').addClass('module_category');

				//uk-width-medium-1-3 uk-width-large-1-3
				//view Length 2:maxLen
				$this.find('.select-view > button').click(function(e){
					e.preventDefault();

					if(!$(this).hasClass('active')){
						$(this).addClass('active').siblings().removeClass('active');

						var value = $(this).attr('data-value');

						$this.find('[data-component-categoryitem]').parent()
						.removeClass(arrViewLineClass.join(' '))
						.addClass('uk-width-large-1-'+value);

						//category lineSize
						sandbox.getModule('module_pagination').setLineSize(value);

						var $customBanner = $(this).closest('section').find('.item-list-wrap').find('.product-item.customBanner');

						if( $customBanner.length > 0){
							if( value <= 2 ){
								$customBanner.addClass('uk-hidden');
							}else{
								$customBanner.removeClass('uk-hidden');
							}
						}
					}
				});

				// 첫문자 대문자
				var firstLetterCap = function(string) {
					return string.charAt(0).toUpperCase() + string.slice(1);
				}

				// wideview toggle
				var toggleValue = '';
				$(document).on('click', '.wideToggle', function(){
					$('.content-area .pt_category').toggleClass('wideArticleView');
					$('.content-area .pt_category').hasClass('wideArticleView') ? toggleValue = 'on' : toggleValue = 'off';
					endPoint.call('wideToggleClick', toggleValue);
				})
				// wideview toggle on mobile
				$(document).on('click', '.btn-filter-open', function(){
					$('.content-area .pt_category').toggleClass('wideArticleView');
					$('.content-area .pt_category').hasClass('wideArticleView') ? toggleValue = 'on' : toggleValue = 'off';
					endPoint.call('wideToggleClick', toggleValue);
				})

				// section-broadcomb 포맷 변경 스크립트
				// 글로벌 사이트에 맞게 gnb 네비게이션 nike 삭제 요청
				//20191018 문지원님 요청.
				if (document.querySelector('.section-broadcomb')) {
					var broadcombHome = document.querySelector('.section-broadcomb a');
					var currentGender = broadcombHome.nextElementSibling;
					var currentGenderContent = currentGender.textContent.trim().toLowerCase();
					document.querySelector('.section-broadcomb a').remove();   //첫번째 home 삭제
					//broadcombHome.innerHTML = 'Nike';
					currentGender.innerHTML = ' ' + firstLetterCap(currentGenderContent);
					$('.section-broadcomb').show();
				}

				// 필터 라벨 첫문자 대문자
				/* 20190521 :영문 > 한글로 변경되면서 주석처리함
				var colorLabels = document.querySelectorAll('.productcolor-label');
				for (var i=0; i < colorLabels.length; i++) {
					colorLabels[i].innerHTML = firstLetterCap(colorLabels[i].textContent);
				}
				*/

				var throttle = function(callback, limit) {
					var wait = false;
					return function () {
						if (!wait) {
							callback.call();
							wait = true;
							setTimeout(function () {
									wait = false;
							}, limit);
						}
					}
				}

				$(window).scroll(function(){
					throttle(function(){
						newHeaderSticky();
					}(), 500);
				});


				// 로컬 이미지 url 강제 세팅
				// $(window).load(function(){
				// 	$('*').each(function(){
				// 		var preUrl = 'https://static-breeze.nike.co.kr/kr/ko_kr';
				// 		if ($(this).is('img')) {
				// 			var originSrc = $(this).attr('src');
				// 			$(this).attr('src', preUrl + originSrc);
				// 		}
				// 	})
				// })

			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-category]',
					attrName:'data-module-category',
					moduleName:'module_category',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			newHeaderSticky:function(){
				newHeaderSticky();
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_guest_order_search', function(sandbox){
		var Method = {
			$that:null,
			$form:null,
			$stepContainer:null,
			$errorAlert:null,
			$searchKey:null,
			moduleInit:function(){

				// listSize = 검색 결과 한번에 보여질 리스트 수
				var args = Array.prototype.slice.call(arguments).pop();
				$.extend(Method, args);

				var $this = $(this);
				Method.$that = $this;
				Method.$form = $this.find("form");

				Method.$stepContainer = $this.find(".step-container");
				Method.$errorAlert = Method.$that.find('[data-error-alert]');
				Method.$search = $this.find('.search-container');

				Core.getComponents('component_textfield', {context:$this}, function(){
					this.addEvent('enter', function(){
						Method.searchSubmit();
					});
				});

				$this.find('button[type="submit"]').on('click', function(e){
					e.preventDefault();
					Method.searchSubmit();
				} );


				// 로그인 버튼
				$this.on('click', '[data-login-btn]',  Method.customerLogin );

				// 인증하기 버튼
				$this.on('click', '[data-certify-btn]', Method.guestCertify );

				$this.on('click', '[data-back-btn]', function(){
					Method.viewStep(1);
				});

				sandbox.validation.init( Method.$form );
			},

			updateSelectOrder:function(e){
				e.preventDefault();
				// 자신 버튼 숨기기
				$(this).parent().hide();
				// 자신 컨텐츠 켜기
				$(this).closest('li').find('[data-certify-content]').slideDown('300');
				// 다른 버튼 보이기
				$(this).closest('li').siblings().find('[data-order-select-btn]').parent().show();
				// 다른 컨텐츠 숨기기
				$(this).closest('li').siblings().find('[data-certify-content]').hide();
			},
			searchSubmit:function(){
				sandbox.validation.validate( Method.$form );

				if( sandbox.validation.isValid( Method.$form )){
					Method.hideAlert();
					sandbox.utils.ajax(Method.$form.attr("action"), 'POST', Method.$form.serialize(), function(data){
						Method.createGuestOrderList(JSON.parse( data.responseText ));
					});
				}
			},
			viewStep:function(num){
				Method.$stepContainer.addClass('uk-hidden');
				Method.$that.find('.step-' + num ).find('input[name="identifier"]').val('');
				Method.$that.find('.step-' + num ).removeClass('uk-hidden');
			},
			showAlert:function(msg){
				UIkit.modal.alert(msg);
				//UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
				/*
				Method.$errorAlert.text(msg);
				Method.$errorAlert.removeClass('uk-hidden');
				*/
			},
			hideAlert:function(){
				Method.$errorAlert.addClass('uk-hidden');
			},
			createGuestOrderList:function(data){
				var result = data['result'];
				var $listContainer = Method.$that.find('.list-container');
				var list = data['ro'];
				var html = '';

				//console.log(data);

				if( result == true ){
					if( list.length == 0 ){
						Method.showAlert('검색결과가 없습니다. 다른 정보를 이용해 다시 검색해 주십시오.');
					}else{
						//orderNumber, phoneNumber, emailAddress, 주문자명(name), 뭐가 들어 올지 모름
						//주문자명의 경우 list에 매칭 값이 넘어 오지 않음.
						//넘어 오는 값 정보는
						//customerId, isGuestCustomer, guestOrderDTOs
						//guestOrderDTOS: orderNumber, submitDate, emailAddress, phoneNumber
						Method.$searchKey = Method.$that.find('input[name="identifier"]').val();
						var orderNumberPattern = /[0-9]{12,30}$/;  //입력값이 orderNum인 경우 orderNum이 일치 하면 목록에 추가
						var orderNumberSearch = false;
						if(orderNumberPattern.test(Method.$searchKey)){
							orderNumberSearch = true;
						}

						console.log(list);

						$.each( list, function( index, li ){
							var addList = false;
							for(var i=0; i<li.guestOrderDTOs.length; i++){
								if(orderNumberSearch){
									if(Method.$searchKey === li.guestOrderDTOs[i].orderNumber){
										li.guestOrderDTO = li.guestOrderDTOs[i];
										li.guestOrderDTO.orderItemName = li.guestOrderDTOs[i].orderItemNames[0];
										li.isItems = (li.guestOrderDTOs.length > 1);
										li.itemLength = li.guestOrderDTOs.length-1;
										li.totalAmount = sandbox.rtnPrice(li.guestOrderDTOs[i].totalAmount.amount);
										li.isPhoneNum = (li.guestOrderDTOs[i].phoneNumber) ? true : false;
									}
								}
							}

							// li.guestOrderDTO = li.guestOrderDTOs[0];
							// li.guestOrderDTO.orderItemName = li.guestOrderDTOs[0].orderItemNames[0];
							// li.isItems = (li.guestOrderDTOs.length > 1);
							// li.itemLength = li.guestOrderDTOs.length-1;
							// li.totalAmount = sandbox.rtnPrice(li.guestOrderDTO.totalAmount.amount);
							// li.isPhoneNum = (li.guestOrderDTOs[0].phoneNumber) ? true : false;
						});

						html = Handlebars.compile($("#guest-order-list").html())(list);

						$listContainer.html( html );
						sandbox.moduleEventInjection( html );


						// 검색된 리스트중 선택시
						Method.$that.on('click', '[data-order-select-btn]',  Method.updateSelectOrder );
						Method.viewStep(2);
					}
				}else{
					Method.showAlert(data['errorMsg']);
				}
			},
			customerLogin:function(){
				var orderNumber = $(this).closest('li').find('input[name="orderNumber"]').val();

				// 회원 주문
				var modal = UIkit.modal('#common-modal');
				var promise = null;
				promise = sandbox.utils.promise({
					url:sandbox.utils.contextPath + '/dynamicformpage',
					type:'GET',
					data:{'name':'login', 'dataType':'model'}
				}).then(function(data){
					var defer = $.Deferred();
					var appendTxt = $(data).find('.content-area').html();
					$('#common-modal').find('.contents').empty().append(appendTxt);
					sandbox.moduleEventInjection(appendTxt, defer);
					modal.show();
					return defer.promise();
				}).then(function(){
					//window.document.location.href = "/account/orders/" + orderNumber
					window.document.location.href = "/account/orders/";
				}).fail(function(msg){
					UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
					modal.hide();
				});
			},

			// 비회원 인증 처리
			guestCertify:function(){
				var type = $(this).attr('data-type');
				var orderNumber = $(this).closest('li').find('input[name="orderNumber"]').val();
				var customerId = $(this).closest('li').find('input[name="customerId"]').val();
				var email = $(this).closest('li').find('input[name="email"]').val();
				var phoneNum = $(this).closest('li').find('input[name="phonenum"]').val();
				var url = sandbox.utils.contextPath + "/guest/orders/requestAuthUrl?customer=" + customerId;

				//var type = $(this).closest('li').find('input[name^="certify.type"]:checked').val();
				// 현재는 무조건 email로 처리
				//customerId=1111111&targeter=이메일 or 폰&messageType=EMAIL or SMS

				if( type === 'email'){
					url += '&targeter=' + email + '&messageType=EMAIL';
				}else if( type === 'kakao'){
					url += '&targeter=' + phoneNum + '&messageType=KAKAO';
				}

				sandbox.utils.ajax(url, 'GET', {}, function(data){
					var responseData = sandbox.rtnJson(data.responseText);
					if(responseData.result == true){
						Method.$search.hide();
						if(type === 'email'){
							Method.viewStep(3);
						}else if(type === 'kakao'){
							Method.viewStep(4);
						}
					}else{
						Method.showAlert(responseData['errorMsg']);
					}

				}, true );

				return;
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-guest-order-search]',
					attrName:'data-module-guest-order-search',
					moduleName:'module_guest_order_search',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_cart', function(sandbox){
		var $this, endPoint;
		var Method = {
			moduleInit:function(){
				// modal layer UIkit 사용
				$this = $(this);
				var modal = UIkit.modal('#common-modal');
				endPoint = Core.getComponents('component_endpoint');

				var addonComponents = sandbox.getComponents('component_addon_product_option', {context:$this, optionTemplate:'#order-addon-sku-option'}, function(i){
					var _self = this;

					this.addEvent('submit', function(data){
						var $this = $(this);

						UIkit.modal.confirm('장바구니에 상품을 담으시겠습니까?', function(){
							var itemRequest = {};
							var addToCartItems = _self.getChildAddToCartItems();
							var keyName='';

							for(var i=0; i<addToCartItems.length; i++){
								keyName = 'childOrderItems[' + i + ']';
								for(var key in addToCartItems[i]){
									itemRequest['childAddToCartItems['+i+'].'+key] = addToCartItems[i][key];
								}
							}

							//애드온 orderId 알아야함
							itemRequest['addOnOrderId'] = _self.getAddOnOrderId();
							itemRequest['isAddOnOrderProduct'] = true;
							itemRequest['csrfToken'] = $this.closest('form').find('input[name=csrfToken]').val();

							BLC.ajax({
								url:$this.closest('form').attr('action'),
								type:"POST",
								dataType:"json",
								data:itemRequest
							}, function(data){
								if(data.error){
									UIkit.modal.alert(data.error);
								}else{
									location.href = sandbox.utils.url.getCurrentUrl();
								}
							});
						});
					});
				});
				/*
				@pck 2020-11-13
				Core _swipe.js 와 중복 정의 부
				var md = new MobileDetect(window.navigator.userAgent);
				var crossSaleswiper = null;
				
				if (md.mobile()) {
					crossSaleswiper = new Swiper('.swipe-container', {
						slidesPerView: 'auto',
						spaceBetween: 10,
						pagination: {
							el: '.swiper-pagination',
							clickable: true,
						},
					});
				} else {
					crossSaleswiper = new Swiper('.swipe-container', {
						slidesPerView: 5,
						slidesPerGroup: 5,
						spaceBetween: 16,
						DOMAnimation: false,
                        followFinger: false,
						pagination: {
							el: '.swiper-pagination',
							clickable: true,
						},
					});
				}
				var crossSale = $(".swipe-container")
				if (crossSale.find(".swiper-wrapper>li").length < 1) {
					crossSale.parent(".category-slider").parent(".related-items").hide();
				}
				*/

				(function () {
					var ev = new $.Event('display'),
						orig = $.fn.css;
					$.fn.css = function () {
						var ret = orig.apply(this, arguments);
						$(this).trigger(ev);
						return ret; // must include this
					}
				})();

				/*
				2020-05-25 @pck 단일 swiper 사용으로 필요 없는 부이나 추후에 다중으로 사용 시 사용  
				$('div[id^="relatedProducts-"]').bind('display', function (e) {
					if (crossSaleswiper != null) {
						crossSaleswiper.update();
					}
				});
				*/

				// 품절상태 주문하기 버튼 disabled
				var arr = [];
				$(this).find('.product-opt_cart').each(function (i, v) {
					var _this = $(this);
					arr.push(_this.data('containskey') == true);
				});
				var arrWrap = _.some(arr, Boolean);
				if (arrWrap) $(this).find('.btn-order').attr('href', '#').addClass('disabled');


				//주문하기
				$(this).on('click', '.btn-order', function(e){
					e.preventDefault();
					endPoint.call('checkoutSubmit');
					if (_GLOBAL.DEVICE.IS_KAKAO_INAPP && !_GLOBAL.CUSTOMER.ISSIGNIN) {
						sandbox.getModule('module_kakao_in_app').submit('/checkout');
					} else {
						/* CUSTOM _customproduct.js 으로 이동 */
						if (Core.Utils.customProduct.cartCustomProduct()) return;
						
						if(addonComponents){
							e.preventDefault();
							if(sandbox.utils.getValidateChk(addonComponents)){
								var isAddOnOrderNoChoice = $("input[name='isAddOnOrderNoChoice']").is(":checked");
								var param = "";
	
								if( isAddOnOrderNoChoice  == true ){
									param = "?isAddOnOrderNoChoice=true";
								}
	
								location.href = $(this).attr('href') + param;
							}
						}else{
							location.href = $(this).attr('href');
						}
					}
				});


				//옵션 변경
				$(this).on('click', '.optchange-btn', function(e){
					e.preventDefault();
					/* CUSTOM _customproduct.js 기능 이동 : 분기처리 */
					var cartCustomYN = Core.Utils.customProduct.isCartCustomProduct(this);
					if(cartCustomYN == 'true'){
					  UIkit.modal.alert("패치 선택 가능 상품은 옵션 변경 및 주문이 불가능합니다.<br/>상품페이지에서 바로 구매해주세요.");
					}else{
						var _this = $(this);
						var target = $(this).attr('href');
						var $parent = $(this).closest('.product-opt_cart');
						var id = $parent.find('input[name=productId]').attr('value');
						var quantity = $parent.find('input[name=quantity]').attr('value');
						var url = $parent.find('input[name=producturl]').attr('value');
						var orderItemId = $parent.find('input[name=orderItemId]').attr('value');
						var size = $parent.find('input[name$=SIZE]').attr('value');
						var obj = {'qty':quantity, 'orderitemid':orderItemId, 'quickview':true, 'size':size, 'accepted':true}
						$parent.find('[data-opt]').each(function(i){
							var opt = sandbox.rtnJson($(this).attr('data-opt'), true);
							for(var key in opt){
								obj[key] = opt[key];
							}
						});
						sandbox.utils.ajax(url, 'GET', obj, function(data){
							var domObject = $(data.responseText).find('#quickview-wrap');
							$(target).find('.contents').empty().append(domObject[0].outerHTML)
							$(target).addClass('quickview');
							sandbox.moduleEventInjection(domObject[0].outerHTML);
							modal.show();

							// 개인화 상품쪽 장바구니 confirm창 별도 사용
							// 해당 버튼에 addcart-btn-confirm 클래스가 있을 경우 action-type 타입 confirm으로 변경
							if(_this.hasClass('addcart-btn-confirm')) {
						        $('.addcart-btn').attr('action-type', 'confirm')
						    }
						});
					}
				});

				//나중에 구매하기
				$(this).on('click', '.later-btn', function(e){
					e.preventDefault();

					$.cookie('pageMsg', $(this).attr('data-msg'));
					Method.addItem.call(this, {type:'later'});
				});

				//카트에 추가
				$(this).on('click', '.addcart-btn', function(e){
					e.preventDefault();

					$.cookie('pageMsg', $(this).attr('data-msg'));
					Method.addItem.call(this, {type:'addcart'});
				});

				//카트 삭제
				$(this).on('click', '.delete-btn .btn-delete', Method.removeItem );

				//카트 전체삭제
				$(this).on('click', '.btn-cart-delete-All', Method.removeItemAll);

				//페이지 상태 스크립트
				var pageMsg = $.cookie('pageMsg');
				if(pageMsg && pageMsg !== '' && pageMsg !== 'null'){
					$.cookie('pageMsg', null);
					UIkit.notify(pageMsg, {timeout:3000,pos:'top-center',status:'success'});
				}
			},
			addItem:function(opt){

				var $parent = $(this).closest('.product-opt_cart');
				var id = $parent.find('input[name=productId]').attr('value');
				var orderItemId = $parent.find('input[name=orderItemId]').attr('value');
				var quantity = $parent.find('input[name=quantity]').attr('value');
				var sessionId = $(this).siblings().filter('input[name=csrfToken]').val();
				var obj = {'productId':id, 'orderItemId':orderItemId ,'quantity':quantity, 'csrfToken':sessionId}
				var url = $(this).closest('form').attr('action');
				var method = $(this).closest('form').attr('method');

				$parent.find('[data-opt]').each(function(i){
					var opt = sandbox.rtnJson($(this).attr('data-opt'), true);
					for(var key in opt){
						obj['itemAttributes['+ $(this).attr('data-attribute-name') +']'] = opt[key];
					}
				});

				sandbox.utils.ajax(url, method, obj, function(data){
					var jsonData = sandbox.rtnJson(data.responseText, true) || {};
					var url = sandbox.utils.url.removeParamFromURL( sandbox.utils.url.getCurrentUrl(), $(this).attr('name') );

					if(jsonData.hasOwnProperty('error')){
						$.cookie('pageMsg', jsonData.error);
					}
					window.location.assign(url);
				});
			},
			removeItem:function(e){
				e.preventDefault();
				var url = $(this).attr('href');

				// TODO
				// 모델값이 없다;
				var model = $(this).closest(".item-detail").find("[data-model]").data("model");
				var name = $(this).closest(".item-detail").find("[data-eng-name]").data("eng-name");

				UIkit.modal.confirm('삭제하시겠습니까?', function(){
					Core.Loading.show();

					var param = sandbox.utils.url.getQueryStringParams( url );
					param.model = model;
					param.name = name;

					endPoint.call( 'removeFromCart', param);
					_.delay(function(){
						window.location.href = url;
					}, 1000);
				}, function(){},
				{
					labels: {'Ok': '확인', 'Cancel': '취소'}
				});


			},

			// 전체삭제 추가 2018.7.6
			removeItemAll:function(e){
				e.preventDefault();
				var url = $(this).attr('href');

				UIkit.modal.confirm('장바구니에 담긴 상품을 모두 삭제하시겠습니까?', function(){
					Core.Loading.show();

					BLC.ajax({
						url: url,
						type: "GET"
					}, function(data) {
						if (data.error ) {
							UIkit.modal.alert(data.error);
						} else {
							window.location.reload();
						}
					});

				}, function(){},
				{
					labels: {'Ok': '확인', 'Cancel': '취소'}
				});






				// BLC.ajax({
				// 	url:$this.closest('form').attr('action'),
				// 	type:"POST",
				// 	dataType:"json",
				// 	data:itemRequest
				// }, function(data){
				// 	if(data.error){
				// 		UIkit.modal.alert(data.error);
				// 	}else{
				// 		location.href = sandbox.utils.url.getCurrentUrl();
				// 	}
				// });





			}
			// 전체삭제 추가 2018.7.6 : end


		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-cart]',
					attrName:'data-module-cart',
					moduleName:'module_cart',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_header', function(sandbox){
		var $this, $headerMenuWrap, args, isSignIn = false, modal, isModalHide = false, isRefresh = false, reDirectUrl = '', endPoint, errorCount=0;

		var Method = {
			moduleInit:function(){
				$this = $(this);
				$headerMenuWrap = $this.find('.header-mymenu');
				args = arguments[0];
				isSignIn = (args.isSignIn === 'true') ? true : false;
				modal = UIkit.modal('#common-modal', {center:true, modal:false});

				endPoint = Core.getComponents('component_endpoint');

				$('.log_user').click(function(e){
					if ($('.log_user').hasClass('on')) {
						$(this).removeClass('on');
					} else {
						$(this).removeClass('on');
						$(this).addClass('on');
					}
				});

				/*
				sandbox.utils.ajax(sandbox.utils.contextPath + '/processor/execute/cart_state', 'GET', obj , function(data){
				    console.log( data );
				    var $data = $(data.responseText);
					var itemSize = $data.filter('input[name=itemSize]').val();
					console.log( itemSize );
				}, false, true)
			    
			    
				var miniCartModule = sandbox.getModule('module_minicart');
				if( miniCartModule ){
				    miniCartModule.update( function(){}, false )
				}
				*/

			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-header]',
					attrName:'data-module-header',
					moduleName:'module_header',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			getCustomerInfo: function () {
				return args;
			},
			setLogin:function(callBackFunc){
				var _self = this;
				if(!isSignIn){
					/*
						@ yslee 2019.01.09
						@ 로그인 전에 로그아웃 처리를 먼저 실행한다.
					*/
					//sandbox.utils.ajax(sandbox.utils.contextPath+'/logout', 'GET', {}, function(){
						//로그인 전
						sandbox.utils.promise({
							url:sandbox.utils.contextPath + '/dynamicformpage',
							type:'GET',
							data:{'name':'login', 'dataType':'model'}
						}).then(function(data){
							var defer = $.Deferred();
							var appendTxt = $(data).find('.content-area').html();
							$('#common-modal').find('.contents').empty().append(appendTxt);
							sandbox.moduleEventInjection(appendTxt, defer);
							endPoint.call("openLogin");
							$('#common-modal').css('zIndex', 1010);
							$('#common-modal .uk-modal-dialog').css('width', '480px');  //로그인 모달 width 변경 20170412
							modal.show();
							return defer.promise();
						}).then(function(data){
							$headerMenuWrap.find('li').eq(0).empty().append($(args.template).html());
							isSignIn = true;
							endPoint.call("loginSuccess");
							if(isModalHide) modal.hide();
							if(!isRefresh) callBackFunc({isSignIn:true});
							else if(isRefresh) location.href = reDirectUrl;
						}).fail(function(data){
							// changsoo.rhi
							if(data instanceof Object) {
						        _self.popForgotPassword(callBackFunc, data.failureType);
						    } else {
	    						defer = null;
			    				//로그인 실패시 재귀호출
	    						if(errorCount > 3){
	    							UIkit.notify('일시적인 장애로 인해 잠시후 이용해 주시기 바랍니다.', {timeout:3000,pos:'top-center',status:'danger'});
	    						}else{
	    							UIkit.notify(data, {timeout:3000,pos:'top-center',status:'danger'});
	    							_self.setLogin(callBackFunc);
									errorCount++;
	    						}
						    }
						});
					//})
				}else{
					//로그인 후
					callBackFunc({isSignIn:true});
				}
				
			},
			getIsSignIn:function(){
				return isSignIn;
			},
			setModalHide:function(isHide){
				isModalHide = isHide;
				return this;
			},
			reDirect:function(url){
				isRefresh = true;
				reDirectUrl = (url) ? url : location.href;
				return this;
			},
			popRegister:function(callBackFunc, errorMsg){
				var _self = this;
				var isCheckedReceiveEmail = false;

				sandbox.utils.promise({
					url:sandbox.utils.contextPath + '/dynamicformpage',
					type:'GET',
					data:{'name':'register', 'dataType':'model'}
				}).then(function(data){
					// 팝업 노출
					var defer = $.Deferred();
					var appendTxt = $(data).find('.content-area').html();
					$('#common-modal').find('.contents').empty().append(appendTxt);
					sandbox.moduleEventInjection(appendTxt, defer);
					endPoint.call("openRegister");
					modal.show();
					//errorMsg 처리
					if(errorMsg){
						for(var key in errorMsg){
							$('#common-modal').find('#'+key).parent().addClass('error').append('<span class="error-message">' + errorMsg[key] + '</span>');
						}
					}
					return defer.promise();
				}).then(function(data){
					isCheckedReceiveEmail = $(modal.dialog).find("#receiveEmail").is(":checked");
					isCheckedReceiveSms = $(modal.dialog).find("#smsAgree").is(":checked");
					return sandbox.utils.promise({
						url: data.redirectUrl,
						type:'GET'
					});
				}).then( function(data){
					//회원가입 성공시
					$headerMenuWrap.find('li').eq(0).empty().append($(args.template).html());

					var appendTxt = $(data).find('.content-area').html();
					$('#common-modal').find('.contents').empty().append(appendTxt);

					endPoint.call("registerComplete", { isReceiveEmail : isCheckedReceiveEmail, isCheckedReceiveSms : isCheckedReceiveSms });
					modal.show();

					$('#common-modal').find('.register-success-btn').click(function(e){
						e.preventDefault();
						if(typeof callBackFunc === 'function'){
							callBackFunc(data);
						}
					});

					//modal hide
					UIkit.modal('#common-modal').off('hide.uk.modal.register').on({
						'hide.uk.modal.register':function(){
							callBackFunc(data);
						}
					});
				}).fail(function(msg){
					_self.popRegister(callBackFunc, msg);
				});
			},
			popForgotPassword:function(callBackFunc, type){
				var _self = this;
				sandbox.utils.promise({
					// url:'sandbox.utils.contextPath + /forgotPassword',
					url:sandbox.utils.contextPath + '/dynamicformpage?failureType='+type, // changsoo.rhi - failureType add
					type:'GET',
					data:{'name':'forgotPassword', 'dataType':'model'}
				}).then(function(data){
					var defer = $.Deferred();
					var appendTxt = $(data).find('.content-area').html();
					$('#common-modal').find('.contents').empty().append(appendTxt);
					sandbox.moduleEventInjection(appendTxt, defer);
					modal.show();
					return defer.promise();
				}).then(function(data){
					//find password success
					//console.log(data);
				}).fail(function(msg){
					defer = null;
					//console.log('msg:' , msg);
					UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
					//회원 가입 실패시 재귀호출
					_self.popForgotPassword(callBackFunc);
				});
			}
		}
	});

})(Core);

(function(Core){
	Core.register('module_before_payment', function(sandbox){
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var args = arguments[0] || {};
				var defer = $.Deferred();

				sandbox.utils.promise({
					url:sandbox.utils.contextPath + '/checkout/orderRegeneration',
					method:'GET',
					isLoadingBar:false
				}).then(function(data){
					if(!data['result']){
						UIkit.modal.alert(data['errorMsg']).on('hide.uk.modal', function() {
							location.href = sandbox.utils.contextPath + '/cart';
						});
						defer.reject('');
					}else{
						if(args.fulfillmentType === 'PHYSICAL_SHIP'){
							defer.resolve(data);
						}else{
							defer.reject('');
							//defer.reject('PHYSICAL_PICKUP or DIGITAL');
						}
					}
					return defer.promise();
				}).then(function(){
					return sandbox.utils.promise({
						url:sandbox.utils.contextPath + '/checkout',
						method:'GET',
						isLoadingBar:false
					});
				}).then(function(data){
					var $target = $(data).find('#payment-review');
					$this.empty().append($target[0].outerHTML);
					sandbox.moduleEventInjection($target[0].outerHTML);
					$this.find('#payment-review').show();
				}).fail(function(msg){
					if(msg !== '' || msg !== undefined){
						UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
					}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-before-payment]',
					attrName:'data-module-before-payment',
					moduleName:'module_before_payment',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	'use strict';

	Core.register('module_inquiry', function(sandbox){
		var $appendListWrap = null;
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var args = arguments[0];

				var $appendListWrap = $this.find('[data-scrollarea]');
				var $scrollArea = $this.find(args['data-module-inquiry'].target);
				var $textField = $this.find('[data-component-textfield]');

				var currentPage = args['data-module-inquiry'].currentPage;
				var listPerPage = args['data-module-inquiry'].pageSize;
				var totalCount = args['data-module-inquiry'].totalCount;
				var totalPageCount = Math.ceil(totalCount / (listPerPage * currentPage));
				var ajaxIS = true;
				var subInquiryJson = args['data-sub-inquiry'];
				var arrSelectBox = [];
				var modal = UIkit.modal('#common-modal');
				var isOrderInquery = false;
				var objOrderData = {};

				var textComponent = sandbox.getComponents('component_textfield', {context:$this}, function(){
					this.addEvent('focusout', function(){
						var value = $(this).val();
						$this.find('#title').val(value);
						$this.find('#detail').val(value);
						objOrderData.value = value;

						if(isOrderInquery){
							$this.find('#detail').val(Handlebars.compile($('#inquery-order-list').html())(objOrderData));
						}
					});
				});

				var selectComponent = sandbox.getComponents('component_select', {context:$this}, function(i){
					var INDEX = i;
					arrSelectBox.push(this);
					this.addEvent('change', function(val){

						if(INDEX === 0){
							isOrderInquery = false;

							for(var key in subInquiryJson){
								if(key === val){
									var obj = {};
									obj.name = 'subInquiryType';
									obj.option = subInquiryJson[key];
									arrSelectBox[1].replaceSelectBox(Handlebars.compile($(args['data-module-inquiry'].template).html())(obj));
									break;
								}
							}


							/* 세금계산서문의 배송문의, 상품문의, A/S, 반품 취소 문의 일떼 자신이 주문한 상품 (orderItemList) 리스트를 불러온다. */
							if(val === 'BILL' || val === 'DELIVERY' || val === 'PRODUCT' || val === 'AS' || val === 'RETRUNCANCEL'){

								UIkit.modal.confirm("상품을 선택하시면 빠른 문의가 가능합니다.<br/>상품을 선택하시겠어요?", function(){
									var obj = {
										'mode':'template',
										'resultVar':'orderList',
										'proceedOrderList':''
									}

									switch(val){
										case 'PRODUCT' :
											obj.templatePath = '/account/partials/productItemListInquiry';
											obj.needWishList = 'Y';
											break;
										default :
											obj.templatePath = '/account/partials/orderItemListInquiry';
											obj.needOrderList = 'Y';
											break;
									}

									sandbox.utils.ajax('/processor/execute/customer_info', 'GET', obj, function(data){
										$('#common-modal').find('.contents').empty().append(data.responseText);
										modal.show();
									});
								});
							}
						}

					});
				});

				var scrollArea = sandbox.scrollController('[data-scrollarea]', $scrollArea[0], function(percent){
					if(totalPageCount > currentPage){
						if(ajaxIS && percent == 0){
							ajaxIS = false;
							currentPage++;

							var obj = {
								'page':currentPage,
								'mode':'template',
								'templatePath':'/account/partials/inquiryList',
								'resultVar':'inquiryDto'
							}

							sandbox.utils.ajax('/processor/execute/inquiry', 'GET', obj, function(data){
								ajaxIS = true;
								var $listFirst = $scrollArea.children().eq(0);
								$listFirst.after(data.responseText);
								scrollArea.setScrollTop($listFirst.offset().top);
							});
						}
					}else{
						/*console.log('문의하신 글 목록이 없습니다.');
						console.log('totalCount : '+totalCount+', listPerPage : '+listPerPage);*/
						scrollArea.destroy();
					}
				}, 'inquiry').setScrollTop($scrollArea.height());

				$this.find('.submit-btn').click(function(e){
					if(!selectComponent[0].getValidateChk() || !selectComponent[1].getValidateChk() || !textComponent.getValidateChk()) {
						e.preventDefault();
					}
				});

				/* common-modal orderList btn */
				$('#common-modal').find('.contents').on('click', 'a', function(e){
					var $this = $(this);
					isOrderInquery = true;
					objOrderData = {};

					if($this.attr('data-order-type') === 'products'){
						objOrderData.isInquery = false;
						objOrderData.name = $this.attr('data-order-name');
					}else if($this.attr('data-order-type') === 'orders'){
						objOrderData.isInquery = true;
					}

					objOrderData.orderId = $(this).attr('data-order-id');
					textComponent.focus();
					modal.hide();
				});

				$('#common-modal').find('.contents').on('mouseenter', 'a', function(e){
					$(this).addClass('active').siblings().removeClass('active');
				});


				/* 모바일 일때 푸터 없는 페이지 처리 */
				$('footer').addClass('no-footer');
				$(window).resize(function(){
					if($(window).width() <= 753 && !$('html').hasClass('uk-modal-page')){
						$('html').addClass('uk-modal-page');
						$appendListWrap.css('height', $(window).height() - ($('header').height() + 196));
					}else if($(window).width() > 753 && $('html').hasClass('uk-modal-page')){
						$('html').removeClass('uk-modal-page');
						$appendListWrap.removeAttr('style');
					}
				});
				$(window).trigger('resize');
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-inquiry]',
					attrName:['data-module-inquiry', 'data-sub-inquiry'],
					moduleName:'module_inquiry',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_authenticate', function(sandbox){

		var customerListVue, args, $this, isDirectAuth, authData, customText, customerInfo = {isAuth:false, isSms:false, customers:[], authPhoneNum:null}, isConfirmed = false, sucCallback=null, failCallback=null, isTimerCounter=false;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];
				if( isDirectAuth == true ){
					Method.setDirectAuthType();
				}else{
					Method.setDefaultType();
				}

				// 최종 확인 버튼
				$this.find('.btn-use-search-member').off('click').on('click',function(e){
					if(isConfirmed){
						isConfirmed = false;
						if( sucCallback != null ){
							e.preventDefault();
							Method.callSuccessCallback();
						}
					}else{
						e.preventDefault();
						UIkit.modal.alert('OTP인증을 진행해주세요.');
					}
				});

				$this.find('[data-authenticate-test-btn]').off('click').on('click',function(e){
					e.preventDefault();
					if( isDirectAuth == true ){
						customerInfo.isAuthSuccess=true;
						customerInfo.customers[0]['isOverTime'] = false;
						customerInfo.customers[0]['time'] = null;
						customerInfo.customers[0]['isRequest'] = false;
						customerInfo.isSms = false;
					}
					Method.confirmSuccess();
				});

				$('#popup-layer-order-custom').on({
					'hide.uk.modal': function(){
						if( isDirectAuth == true ){
							sandbox.setLoadingBarState(true);
							location.reload();
							/*
							if( _.isFunction(customerListVue.$destroy)){
								customerListVue.$destroy();
							}
							*/
						}else{
							customerInfo.isAuth = false;
							customerInfo.isSms = false;
							customerInfo.customers = [];
							customerInfo.autoPhoneNum = null;
							isConfirmed = false;
							isTimerCounter = false;
						}
					}
				});
			},
			// 검색 없이 바로 인증 진행시
			setDirectAuthType:function(){
				$this.find('#customText').html( customText );

				if( authData == null ){
					UIkit.modal.alert('인증 정보가 올바르지 않습니다. 관리자에게 문의 하세요.').on('hide.uk.modal', function(){
						Method.callFailCallback();
					});
					return false;
				}

				customerInfo = {
					isAuth:true,
					isSms:false,
					customers:[{
						time:null,
						isRequest:false,
						isOverTime:false,
					}],
					isAuthSuccess:false,
					authPhoneNum:null
				}

				customerListVue = new Vue({
					el:'#opt-direct-auth',
					data:customerInfo,
					methods:{
						authSms:function(e){
							if( e ) e.preventDefault();
							var _self = this;
							var index = 0;
							customerInfo.isSms = true;
							sandbox.utils.promise({
								url:'/otp/request',
								method:'POST',
								data:authData
							}).then(function(data){
								//카운터 시작
								isTimerCounter = true;
								if( customerInfo.customers[index]['time'] == null ){
									_self.countdown(index);
								}
								customerInfo.customers[index]['isOverTime'] = false;
								customerInfo.customers[index]['isRequest'] = true;
								customerInfo.customers[index]['time'] = parseInt(args.limitMin) * 60;
							}).fail(function(msg){
								customerInfo.isSms = false;
								UIkit.modal.alert('고객정보를 찾을수 없습니다.').on('hide.uk.modal', function(){
									Method.callFailCallback();
								});
							});
						},
						authConfirm:function(e){
							e.preventDefault();
							//otp 인증 비동기 처리
							if(isConfirmed!=true){
								var _self = this;
								var index = e.target.getAttribute('data-index');
								var $form = $(e.target).closest('form');
								var data = sandbox.utils.getQueryParams($form.serialize());
								sandbox.utils.promise({
									url:'/otp/confirm',
									method:'POST',
									data:$.extend( data, authData )
								}).then(function(data){
									customerInfo.customers[index]['isOverTime'] = false;
									customerInfo.customers[index]['isRequest'] = false;
									_self.isAuthSuccess=true;
									Method.confirmSuccess();
								}).fail(function(data){
									UIkit.modal.alert(data.errors || '인증번호가 일치하지 않습니다. 다시 시도해 주세요.');
								});
							}else{
								UIkit.modal.alert('인증번호가 확인되었습니다.<br/>확인을 클릭하여 다음단계를 진행해주세요.');
							}
						},
						countdown:function(index){
							/*
							console.log( 'index : ', index )
							console.log( 'time : ', time )
							console.log( 'isConfirmed : ', isConfirmed )
							console.log( 'isTimerCounter : ', isTimerCounter )
							*/
							var _self = this;

							setTimeout(function(){
								if(!isTimerCounter) return;
								var count = Number(customerInfo.customers[index]['time'])-1;
								customerInfo.customers[index]['time'] = count
								if(count > 0 && !isConfirmed){
									_self.countdown(index);
								}else{
									if( isConfirmed ){
										customerInfo.isAuthSuccess=true;
										customerInfo.customers[index]['isOverTime'] = false;
									}else{
										customerInfo.customers[index]['isOverTime'] = true;
									}
									customerInfo.customers[index]['time'] = null;
									customerInfo.customers[index]['isRequest'] = false;
									customerInfo.isSms = false;
								}
							}, 1000);
						}
					},
					created: function () {
						console.log( 'created' );
						this.$nextTick( function(){
							Core.moduleEventInjection($this.html());
						})
						//this.authSms();
					}
				});
			},
			// 일반적인 검색 후 인증 사용시
			setDefaultType:function(){
				$this.find('[data-authenticate-btn]').click(function(e){
					e.preventDefault();
					//costomer 비동기 처리
					var $form = $(this).closest('form');
					var data = sandbox.utils.getQueryParams($form.serialize());
					customerInfo.authPhoneNum = data.identifier;
					sandbox.utils.ajax($form.attr('action'), 'POST', data, function(data){
						var customerData = sandbox.rtnJson(data.responseText);
						if(customerData.result){
							for(var i=0; i<customerData.customerList.length; i++){
								customerData['customerList'][i]['isSmsConfirm'] = false;
								customerData['customerList'][i]['time'] = null;
							}
						}
						customerInfo.isAuth = true;
						customerInfo.customers = (customerData.result) ? customerData.customerList : [];
					});
				});

				customerListVue = new Vue({
					el:'#custom-list',
					data:customerInfo,
					watch:{
						customers:function(){
							this.$nextTick(function(){
								UIkit.accordion('#accordion-wrap', {showfirst:false});
							});
						}
					},
					methods:{
						authSms:function(e){
							e.preventDefault();

							if(!isConfirmed && !customerInfo.isSms){
								var _self = this;
								var index = e.target.getAttribute('data-index');
								var type = e.target.getAttribute('data-type');
								var msg = "";

								if(type=='KAKAO' || type=='kakao'){
									msg = this.authPhoneNum + '로 OTP(인증번호)를 전송하시겠습니까?'
								}else{
									msg = e.target.getAttribute('data-email') + '로 OTP(인증번호)를 전송하시겠습니까?'
								}
								customerInfo.isSms = true;


								UIkit.modal.confirm(msg, function(){
									var $form = $(e.target).closest('form');
									var data = sandbox.utils.getQueryParams($form.serialize());
									data['userName'] = _self.customers[index]['username'];
									data['messageType'] = type;

									/*
									sandbox.utils.ajax($form.attr('action'), 'POST', $.extend( data, {messageType : 'EMAIL'}), function(data){
										console.log( data );
									});
									*/
									sandbox.utils.promise({
										url:$form.attr('action'),
										method:'POST',
										data:data
									}).then(function(data){
										//카운터 시작
										isTimerCounter = true;
										customerInfo.customers[index]['isSmsConfirm'] = true;
										customerInfo.customers[index]['time'] = parseInt(args.limitMin) * 60;
										_self.countdown(index, parseInt(args.limitMin) * 60);
									}).fail(function(msg){
										customerInfo.isSms = false;
										UIkit.modal.alert('고객정보를 찾을수 없습니다.').on('hide.uk.modal', function(){
											Method.callFailCallback();
										});
									});

								}, function(){
									customerInfo.isSms = false;
								}, {bgclose:false});
							}else{
								if(isConfirmed) UIkit.modal.alert('인증번호가 확인되었습니다.<br/>확인을 클릭하여 다음단계를 진행해주세요.');
							}
						},
						authConfirm:function(e){
							e.preventDefault();
							//otp 인증 비동기 처리
							if(isConfirmed!=true){
								var _self = this;
								var defer = $.Deferred();
								var index = e.target.getAttribute('data-index');
								var $form = $(e.target).closest('form');
								var data = sandbox.utils.getQueryParams($form.serialize());
								data['userName'] = _self.customers[index]['username'];

								sandbox.utils.promise({
									url:$form.attr('action'),
									method:'POST',
									data:data
								}).then(function(data){
									if( data.result == true && data.confirmResult == true){
										customerInfo.customers[index]['isSmsConfirm'] = false;
										Method.confirmSuccess();
									}else{
										return defer.reject({'errors' : data.errors });
									}
								}).fail(function(data){
									UIkit.modal.alert(data.errors || '인증번호가 일치하지 않습니다. 다시 시도해 주세요.');
								});
							}else{
								UIkit.modal.alert('인증번호가 확인되었습니다.<br/>확인을 클릭하여 다음단계를 진행해주세요.');
							}
						},
						countdown:function(index, time){
							var count = time;
							var _self = this;

							setTimeout(function(){
								if(!isTimerCounter) return;
								customerInfo.customers[index]['time'] = --count;
								if(count > 0 && !isConfirmed){
									_self.countdown(index, count);
								}else{
									customerInfo.customers[index]['time'] = null;
									customerInfo.customers[index]['isSmsConfirm'] = false;
									customerInfo.isSms = false;
								}
							}, 1000);
						}
					}
				});

				var tabComponent = sandbox.getComponents('component_tabs', {context:$this}, function(){
					this.addEvent('tabClick', function(index){
						$this.find('.authenticate-type').eq(index).addClass('active').siblings().removeClass('active');
					});
				});


			},
			callSuccessCallback:function(){
				if( sucCallback != null ){
					sucCallback.call();
				}
			},
			callFailCallback:function(){
				if( failCallback != null ){
					failCallback.call();
				}
			},
			confirmSuccess:function(){
				if( isDirectAuth ){

				}else{
					UIkit.modal.alert('인증번호가 확인되었습니다.<br/>확인을 클릭하여 다음단계를 진행해주세요.');
				}
				isConfirmed = true;
				$this.find('.btn-use-search-member.disabled').removeClass('disabled');
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-authenticate]',
					attrName:'data-module-authenticate',
					moduleName:'module_authenticate',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			customText:function( text ){
				customText = text;
				return this;
			},
			isDirectAuth:function(isDirect){
				isDirectAuth = isDirect || false;
				return this;
			},
			reset:function(otp){
				isDirectAuth = otp.isDirectAuth || false;
				customText = otp.customText || '';
				authData = otp.authData || null;
				this.init();
			},
			success:function( callback ){
				if( _.isFunction(callback)){
					sucCallback = callback;
				}
				return this;
			},
			fail:function( callback ){
				if( _.isFunction(callback)){
					failCallback = callback;
				}
				return this;
			}
		}
	});

	Vue.component('countdown', {
		props:['time'],
		template:'<span class="timer" v-if="time !== null">{{rtnTimer(Math.floor(time / 60 % 60))}}:{{rtnTimer(Math.floor(time % 60))}}</span>',
		methods:{
			rtnTimer:function(time){
				var numToString = time.toString();
				return (numToString.length > 1) ? numToString : '0' + numToString;
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_instagram_feed', function(sandbox){
		var $this, args;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];

				var url = 'https://api.instagram.com/v1/users/self/media/recent';  // 가입한 user의 feedData;
				var obj = {client_id:args.clientkey, access_token:args.token, count:args.count}
				var template = $(args.template).html();

				sandbox.utils.jsonp(url, obj, 'callback', function(data){
					var feedData = data.data;

					if(data.meta.hasOwnProperty('error_message')){
						UIkit.notify(data.meta.error_message, {timeout:3000,pos:'top-center',status:'error'});
						return
					}

					/* 인스타그램에서 보내주는 이미지 크기가 달라 thumbnail_high 를 따로 가공해서 넣어준다. */
					for(var i=0; i<feedData.length; i++){
						feedData[i]['images']['thumbnail_high'] = {
							width:320,
							height:320,
							url:feedData[i]['images']['thumbnail']['url'].replace('s150x150', 's320x320')
						}
					}

					var source = $(args.template).html();
					var template = Handlebars.compile(source);
					var bindingHtml = template({instagram:feedData});



					$this.append(bindingHtml);
					sandbox.moduleEventInjection(bindingHtml);
				}, true);
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-instagram-feed]',
					attrName:'data-module-instagram-feed',
					moduleName:'module_instagram_feed',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				console.log('product destory');
			}
		}
	});
})(Core);

(function(Core){
	'use strict';
	Core.register('module_account_writelist', function(sandbox){
		var $this, modal, args;
		var Method = {
			moduleInit:function(){
				//main이고 리뷰쓸 상품이 있을경우
				var mainReviewOpenIS = false;
				var currentStarCount = null;

				args = arguments[0];
				$this = $(this);
				modal = UIkit.modal('#common-modal-large');
				modal.on({
					'show.uk.modal':function(){
						//console.log("Modal is visible.");
					},

					'hide.uk.modal':function(){
						$this.find('.contents').empty();
						$(currentStarCount).removeClass('active').siblings().removeClass('active');
					}
				});

				$this.on('click', '.btn-delete', function(e){
					e.preventDefault();

					if(mainReviewOpenIS){
						$this.find('.review-summary-group').fadeOut();
						$this.find('.review-write-wrap').stop().animate({width:375, height:190}, 300, function(){
							mainReviewOpenIS = false;
							$this.find('.review-main-msg').fadeIn();
							$('html').removeClass('uk-modal-page');
						});
					}else{
						$(args.target).remove();
					}
				});
				$this.on('click', '.review-open', function(e){
					e.preventDefault();

					$this.find('.review-main-msg').fadeOut();
					$this.find('.review-write-wrap').stop().animate({width:400, height:500}, 300, function(){
						mainReviewOpenIS = true;
						$this.find('.review-summary-group').fadeIn();
						$('html').addClass('uk-modal-page');
					});
				});

				//account reviewWrite rating-star count
				$this.find('.rating-star').each(function(i){
					var $this = $(this);
					$this.find('a').click(function(e) {
						e.preventDefault();

						var index = $(this).index() + 1;
						var target = $(this).parent().attr('data-target');
						var productId = $(this).parent().attr('data-productid');
						var orderItemId = $(this).parent().attr('data-orderitemid')

						$(this).parent().children('a').removeClass('active');
						$(this).addClass('active').prevAll('a').addClass('active');

						currentStarCount = this;
						Method.reviewTask(target, productId, orderItemId, index);
					});
				});
			},
			reviewTask:function(target, productId, orderItemId, startCount){
				var defer = $.Deferred();

				sandbox.utils.promise({
					url:sandbox.utils.contextPath + '/review/reviewWriteCheck',
					type:'GET',
					data:{'productId':productId, 'orderItemId':orderItemId}
				}).then(function(data){
					//data.expect 기대평
					//data.review 구매평
					if(data.expect || data.review){
						return sandbox.utils.promise({
							url:sandbox.utils.contextPath + '/review/write',
							type:'GET',
							data:{'productId':productId, 'redirectUrl':location.pathname, 'startCount':startCount, 'isPurchased':data.review, 'orderItemId':orderItemId}
						});
					}else{
						$.Deferred().reject('리뷰를 작성할 수 없습니다.');
					}

				}).then(function(data){
					modal.show();

					$(target).addClass('review-write');
					$(target).find('.contents').empty().append(data);
					sandbox.moduleEventInjection(data, defer);

					return defer.promise();
				}).then(function(data){
					Method.reviewProcessorController();
					modal.hide();
				}).fail(function(msg){
					//console.log('write fail');
					defer = null;
					UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
				});
			},
			reviewProcessorController:function(){
				var arrData = [];
				var obj = {
					'mode':'template',
					'templatePath':'/modules/myReviewWriteList',
					'resultVar':'review',
					'reviewType':'writeList',
					'_sort':'id',
					'_type_sort':'desc',
					'reviewLocation':'account'
				}

				sandbox.utils.ajax(args.api, 'GET', obj, function(data){
					$(args.target).empty().append(data.responseText);
					sandbox.moduleEventInjection(data.responseText);
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-account-writelist]',
					attrName:'data-module-account-writelist',
					moduleName:'module_account_writelist',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_latest', function(sandbox){
		var $this, args, productId, arrLatestItems;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];
				productId = args.productId || null;

				//최근본상품 cookie
				var latestItemsMaxLength = args.latestItemsMaxLength;
				var latestItems = $.cookie('latestItems');

				if( productId != null){
					var pattern = new RegExp(productId, 'g');
					if(latestItems){
						arrLatestItems = latestItems.replace(pattern, '').match(/[0-9]+/g) || [];
						arrLatestItems.unshift(productId);

						if(arrLatestItems.length >= latestItemsMaxLength){
							arrLatestItems = arrLatestItems.slice(0, -1);
						}
						$.cookie('latestItems', arrLatestItems.join(','), {path:'/'});
					}else if(!latestItems){
						$.cookie('latestItems', productId, {path:'/'});
						$this.remove();
					}
				}

				addLatestItem(latestItems);
			}
		}

		var addLatestItem = function(items){
			var obj = {
				'id':items || 0, // 무조건 dom을 가져오기 위해서 가지고 있는 productid가 없어도 0을 넘겨 비어있음 나오게 한다.
				'mode':'template',
				'templatePath':'/modules/latest',
				'resultVar':'productList',
				'minSlides':args.minSlides || 2,
				'maxSlides':args.maxSlides || 4,
				'slideMargin':args.slideMargin || 0
			}

			sandbox.utils.ajax(sandbox.utils.contextPath + '/processor/execute/product', 'GET', obj, function(data){
				$this.append(data.responseText);
				sandbox.moduleEventInjection(data.responseText);
			}, false, true);
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-latest]',
					attrName:'data-module-latest',
					moduleName:'module_latest',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				console.log('latest destory');
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_checkout_address_review', function(sandbox){
		var $this, args;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];

				sandbox.utils.ajax(sandbox.utils.contextPath + '/checkout/orderRegeneration', 'GET', {}, function(data){
					var data = sandbox.rtnJson(data.responseText);
					if(!data['result']){
						UIkit.modal.alert(data['errorMsg']).on('hide.uk.modal', function() {
							location.href = sandbox.utils.contextPath + '/cart';
						});
					}
				}, false, true);
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-checkout-address-review]',
					attrName:'data-module-checkout-address-review',
					moduleName:'module_checkout_address_review',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				console.log('module_checkuot_address_review destory');
			}
		}
	});
})(Core);

//2020.10.28 신규 GNB작업으로 인해 사용하지 않는 Module
(function(Core){
	Core.register('module_mobilegnb', function(sandbox){

		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var args = arguments[0];
				var clickIS = false;
				var isSearch = false;

				// var $mobile = $('#mobile-menu');
				var $mobile = $('#' + $this.attr('id'));
				$mobile.find('.mobile-onedepth_list').on('click', '> a.mobile-menu-dynamic', function(e){
					if(!$(this).hasClass('link')){
						e.preventDefault();
						$(this).hide();
						$(this).parent().siblings().hide();
						$('#layout-mobile-menu-user').hide();
						$('#layout-mobile-menu-static').hide();
						$('ul.mobile-menu_onedepth').css("height","100%");
						$(this).siblings().show().stop().animate({'left':0}, 300);
					}
				});

				$mobile.find('.mobile-twodepth_list').on('click', '> a.mobile-menu-dynamic', function(e){
					if(!$(this).hasClass('link')){
						e.preventDefault();
						$(this).hide();
						$(this).parent().siblings().hide();
						$(this).siblings().show().stop().animate({'left':0}, 300);
					}
				});

				$mobile.find('.mobile-menu_twodepth > .location').on('click', function(e){
					e.preventDefault();
					$(this).parent().stop().animate({'left':-270}, 300, function(){
						$(this).css('left', 270).hide();
						$(this).parent().children(':first-child').show();
						$(this).parent().siblings().show();
						$('ul.mobile-menu_onedepth').css("height","auto");
						$('#layout-mobile-menu-user').show();
						$('#layout-mobile-menu-static').show();
					});
				});

				$mobile.find('.mobile-menu_threedepth > .location').on('click', function(e){
					e.preventDefault();
					$(this).parent().stop().animate({'left':-270}, 300, function(){
						$(this).css('left', 270).hide();
						$(this).parent().siblings().show();
						$(this).parent().children(':first-child').show();
					});
				});

				// 브랜드&서포트 메뉴 .mobile-onedepth_list CSS 위해서 Click 이벤트 동작하지 않아서 아래 function()로 처리
				$mobile.find('.mobile-onedepth_list').on('click', '> a.mobile-menu-static', function(e){
					var open_target = $(this).attr("target");
					if(typeof(open_target) == "undefined"){
						open_target = "_self";
					}
					if($(this).attr("href") != "#"){
						window.open($(this).attr("href"), open_target);
					}
				});

				// 모바일 , 테블릿 적용
				//검색 버튼 클릭시 검색창 오픈.
				$('.gnb-search-btn').click(function(e){
					e.preventDefault();

					//if($('body').attr('data-device')=='tablet'){
					//	$('.search-panel, .gnb-search-field').css('display', 'block');
					//	$('.search-field').find('input[type=search]').focus();
					//}

					if($('body').attr('data-device')=='mobile'){
						$("#mobile_new_search_fild").show();
					}
					//$("body").css({'position':'fixed'}); //20180516추가
				});


				$mobile.on('show.uk.offcanvas', function(event, area){
					try {
						Core.ga.pv('pageview', '/mobileMenu');
					} catch (error) {}
					//모바일메뉴 reset
					$('ul.mobile-menu_twodepth').css('left', 270).hide();
					$('ul.mobile-menu_threedepth').css('left', 270).hide();
					$('ul.mobile-menu_onedepth').css("height","auto");
					$('ul.mobile-menu_onedepth li').show();
					$('ul.mobile-menu_onedepth li a').show();
					$('#layout-mobile-menu-user').show();
					$('#layout-mobile-menu-static').show();

					//android 기본 브라우저에서 scroll down 시 메뉴 노출되지 않은 현상 때문에 clip css 삭제처리
					$('.uk-offcanvas-bar').removeAttr("style");
				});

				$mobile.on('hide.uk.offcanvas', function(event, area){
					if(isSearch){
						sandbox.getModule('module_search').searchTrigger();
					}
					isSearch = false;
				});

				$mobile.find('.mobile-lnb-search').on('click', function(e){
					e.preventDefault();
					isSearch = true;
					UIkit.offcanvas.hide();
				});
			}
		}
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-mobilegnb]',
					attrName:'data-module-mobilegnb',
					moduleName:'module_mobilegnb',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

/**
 * 
 * Core.ui.modal.ajax(url, {
 * 	selector : '#',
 * 	type : 'POST',
 * 	param : {},
 * 	labels : {
 * 		ok : '확인',
 * 		cancel : '취소'
 * 	}
 * 	show : function(){
 * 	},
 * 	hide : function(){
 * 	}
 * })
 * 
 */
(function (Core, ui) {
	var MID = 0;
	var ID_PREFIX = 'M_MODAL_';
	var ATTR_PREFIX = 'data-make-modal-';
	var DEFAULT_OPTION = {
		fullscreen: false,
		keyboard: true,
		bgclose: true,
		center: false,
		modal: false,
	}
	var DEFAULT_ALERT_OPTION = {
		bgclose: false,
		keyboard: false,
		modal: false,
		labels: {
			Ok: '확인',
			Cancel: '취소'
		}
	}
	var selector = {
		modalContent: '[data-wrap-modal-content]'
	}
	function getMergedDefaultOption(options) {
		return $.extend({}, DEFAULT_OPTION, options = options || {});
	}
	function getMergedAlertDefaultOption(options) {
		return $.extend({}, DEFAULT_ALERT_OPTION, options = options || {});
	}
	// 유효한 modal id 확인
	function getModalId(id){
		var mId = (typeof id == 'object') ? id.attr('id') : id;
		if (!_.startsWith(mId, '#')) {
			mId = '#' + mId;
		}
		return mId;
	}

	// 이벤트 적용
	function addEvent(modal, options){
		if (_.isFunction(options.show)) {
			modal.on({ 'show.uk.modal': options.show })
		}
		if (_.isFunction(options.hide)) {
			modal.on({ 'hide.uk.modal': options.hide })
		}
		modal.on({ 'hide.uk.modal': function() { 
			var target = this;
			setTimeout(function(){
				target.remove();
			},300)
		}})
		return modal;
	}

	// modal dom 생성 및 오픈
	function makeModal(html, options){
		MID++;
		UIkit.modal.dialog.template = '<div id="'+ ID_PREFIX+MID +'" class="uk-modal uk-make-modal"><div class="uk-modal-dialog"></div></div>';
		var modal = UIkit.modal.dialog($(([
			'<a class="uk-modal-close uk-close"></a>',
			'<div class="contents" data-wrap-modal-content="">' + html+ '</div>',
		]).join("")));
		var $dialog = $(modal.dialog);
		if (options.fullscreen == true) {
			$dialog.css('width', '100%');
			$dialog.addClass('uk-modal-dialog-blank');	
			$dialog.find(selector.modalContent).addClass('uk-height-viewport');
		}
		if (!_.isEmpty(options.width)) {
			$dialog.css('width', options.width );
		}
		openModal(modal, options);
		// 오픈을 안한 상태로 모듈 스크립트가 돌면 swife 에서 가로 사이즈를 정상적으로 인식 하지 못하는 경우가 생겨 순서를 바꿈
		// Core.moduleEventInjection(html);
	}

	// 이미 생성되어있는 modal 오픈
	function open(id, options){
		openModal(UIkit.modal($(getModalId(id))), getMergedDefaultOption(options));
	}
	
	function close(id) {
		UIkit.modal($(getModalId(id))).hide();
	}

	// ajax 통신후 오픈
	function ajax(url, options){
		var opt = getMergedDefaultOption(options);
		opt.isAjax = true;
		Core.Utils.ajax(url, opt.type || 'GET', opt.param || {}, function (data) {
			var appendHtml = '';
			if (_.isEmpty(opt.selector)) {
				appendHtml = data.responseText;
			} else {
				appendHtml = $(data.responseText).find(opt.selector).html();
			}
			if (_.isEmpty(appendHtml)) {
				alert('정보를 불러 올 수 없습니다.');
			}else{
				makeModal(appendHtml, opt);
			}
		}, true, false, 1500);
	}

	// 컨텐츠(HTML) 오픈
	function content(html, options){
		makeModal(html, getMergedDefaultOption(options));
	}

	function openModal(modal, options){
		/*
		 modal 안에서 다시 modal 이 뜰 경우 부모 modal 창 사이즈 안에서만 그려지는 오류로 인하여
		 오픈하기전 body에 다시 append 시키고 오픈한다.
		*/
		if (modal.element.length > 0) {
			var element = modal.element[0];
			var modalId = $(element).attr('id');
			var modalSelectorAttr = ATTR_PREFIX + modalId;
			$(element).attr(modalSelectorAttr, true);
			var elementHtml = element.outerHTML;
			if( options.isAjax ){
				// ajax 일 경우 원본 modal을 삭제
				element.remove();
			}else{
				// 이미 만들어져있던 modal 을 오픈하는 경우 원본은 유지하고 selector로 사용한 attribute 만 삭제
				element.removeAttribute(modalSelectorAttr);
			}
			$('body').append(elementHtml);
			uiKitModal = UIkit.modal($('['+modalSelectorAttr+']'));
			uiKitModal.options = options;
			addEvent(uiKitModal, options).show();
			Core.moduleEventInjection(elementHtml);
		}else{
			UIkit.modal.alert('팝업 정보가 올바르지 않습니다.');
		}
	}
	function alert(msg, options){
		var opt = getMergedAlertDefaultOption(options);
		var alert = UIkit.modal.alert(msg, opt);
		addEvent(alert, opt);
	}
	function confirm(msg, confirmCb, cancelCb, options) {
		var opt = getMergedAlertDefaultOption(options);
		var confirm = UIkit.modal.confirm(msg, confirmCb, cancelCb, opt);
		addEvent(confirm, opt);
	}
	ui.modal = {
		open: function (id, options) {
			return open(id, options);
		},
		close: function (id, options) {
			return close(id, options);
		},
		ajax: function (url, options) {
			return ajax(url, options);
		},
		content: function (html, options) {
			return content(html, options);
		},
		alert: function (message, options) {
			alert(message, options);
		},
		confirm: function (message, confirmCb, cancelCb, options) {
			confirm(message, confirmCb, cancelCb, options);
		}
	}
})(Core = window.Core || {}, Core.ui = window.Core.ui || {});
(function(Core){

	Core.register('module_order', function(sandbox){
		//var $this = null,
		$allCheck = null, 					// 팝업 전체 선택 체크박스
		$itemList = null, 					// 선택 해서 popup에 노출되는 아이템 리스트
		$itemListObj = null, 				// addon 이 제거된 아이템들
		$popModal = null, 					// 취소 팝업
		cancelOrderId = null, 				// 취소할 주문 id
		$popSubmitBtn = null, 				// 취소 submit 버튼
		$previewContainer = null, 			// 사용안함
		isAllFg = null, 					// 취소 선택시 모든 fulfilment가 취소 가능했는지 여부
		isAblePartialVoid = null, 			// 부분 취소 가능여부
		beforeSelectedOrder = null, 		// 사용안함
		$refundAccountInfo = null, 			//환불정보 입력 폼
		oldOrderUrl = null, 				//이전 사이트 주문 정보 URL
		args = null,
		objStore = {store:[]};

		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var args = arguments[0] || {};

		        //CTM 태깅..  상세보기 링크,,,
				$this.on('click', '.btn-order-detail', function(){
					var f_type       =	$(this).parent('div').parent('div').find('div').eq(1).attr('fulfillment_Type');   //PHYSICAL_PICKUP  ,PHYSICAL_SHIP
					var order_type   =  $(this).closest('.order-list').find("input[name='fulfillmentType']").val();   //inventory: BOPIS_store info, inventory: ROPIS_store info..
					var per_link     =  $(this).attr("data-link");   //링크주소

					if(f_type=='PHYSICAL_PICKUP'){
						if(order_type == 'inventory: BOPIS_cancellation: start'){
							click_name  = "inventory: BOPIS_order detail";
						} else{
							click_name  = "inventory: ROPIS_order detail" ;
						};

					    endPoint.call('clickEvent', {'area' : 'mypage', 'name' : click_name })
					} else{
						endPoint.call('clickEvent', {'area' : 'mypage', 'name' : 'inventory: ORDER/SHIPPING: order detail' })
					};

					location.href = per_link;
				});

				// 당일배송 배송추적 팝업
				trackingDto = "";
				$this.on('click', '[data-deliverycheck]', function(){
					var fgId = $(this).data('deliverycheck');
					var url = sandbox.utils.contextPath+'/account/orders/delivery/tracking' + '?fgId=' + fgId;
					Core.Loading.show();
					BLC.ajax({
						type : "GET",
						dataType : "json",
						url : url,
					},function(data){
						Core.Loading.hide();
						if(data.result == true){
							var modal = UIkit.modal('#order-delivery-check', {modal:false});
							var trackingDetails = modal.find(".body>table").find("tbody");
							trackingDetails.empty();
							modal.find('.body.info>dl>.referenceNumber').text(data.trackingDto.referenceNumber);
							if(data.trackingDto.trackingDetails !== null){
								trackingDetails.parents('table').show();
								$.each(data.trackingDto.trackingDetails,function(i,item) {
									if(item.stateCode !== "DLV_FAILED"){
										var gYear = item.processDate.substr(0, 4);
										var gMonth = item.processDate.substr(4, 2);
										var gDate = item.processDate.substr(6, 2);
										var gHours = item.processDate.substr(8, 2);
										var gMinutes = item.processDate.substr(10, 2);
										var gSeconds = item.processDate.substr(12, 2);
										var date = gYear + "-" + gMonth + "-" + gDate + " " + gHours + ":" + gMinutes;
										var html = "<tr>";
										html+= "<td>" + date +"</td>";
										if(item.stateCode == 'RECEIVED'){
											html+= "<td>" + (item.processPost!==null?item.processPost:'접수') +"</td>";
										} else{
											html+= "<td>" + item.processPost +"</td>";
										}
										html+= "<td>" + (item.remark!==null?item.remark:'-') +"</td>";
										html+= "</tr>";
										trackingDetails.append(html);
									}
								});
							} else{
								trackingDetails.parents('table').hide();
							}
							modal.show();
						} else {
							UIkit.modal.alert('배송추적을 할 수 없습니다.');
						}
					});
				});

				// 당일배송 배송서비스 보상 신청 노출
			    $this.find('.samedayrefund>li').each(function (i, item) {
			    	var refundStatus = $(this).data('refund-status');
			    	var refundNumber = $(this).data('refund-number');
			    	var refundId = $(this).data('refund-id');
			    	if(refundStatus == 'CONFIRM') {
						$this.find('.order-list').each(function (i, item) {
							var cancelDon = $(this).find('[data-cancel-don]');
							var orderNumber = $(this).find('.order-code>span').text();
							if(cancelDon.length == 0 && refundNumber == orderNumber){
								$(this).find('.btn-refund').show().attr({'data-btn-refundid': refundId, 'data-btn-refundstatus': refundStatus});
							}
						});
			    	}
			    	return;
			    });

				// 당일배송 배송서비스 보상 신청 확인
			    $this.on('click', '.btn-refund', function(e){
					e.preventDefault(e);
					var orderNumber = $(this).prev('.order-code').find('>span').text();
					var refundStatus = $(this).data('btn-refundstatus');
					var refundId = $(this).data('btn-refundid');
					var modal = UIkit.modal('#popup-refund', {center:false});
					var finishModal = UIkit.modal('#finish-refund', {center:false});
			        var $form = modal.find('form');
					var checkbox = modal.find('[data-component-checkbox]');
			        sandbox.validation.init($form);
					sandbox.validation.reset($form);
					if(refundStatus == 'CONFIRM'){
						modal.show();
						modal.find('input[name=owner]').val('');
						modal.find('select[name=bankCode]').val('');
						modal.find('input[name=accountNumber]').val('');
						modal.find('[data-error-info]').text('');
						modal.find('.info.error').remove();
						modal.find('.link-privacy').text('상세보기 >');
						modal.find('.detail-privacy').hide();
						checkbox.removeClass('checked');
						checkbox.find('input[type=checkbox]').removeAttr("checked");
						modal.find('[data-component-checkbox]').off('click').on('click', function(){
							if(checkbox.hasClass("checked") === true) {
								checkbox.removeClass('checked');
								checkbox.find('input[type=checkbox]').removeAttr("checked");
							} else{
								checkbox.addClass('checked');
								checkbox.find('input[type=checkbox]').attr("checked",true);
								checkbox.next('.info.error').remove();
							}
						});
						modal.find('input[type=number]').on("keyup", function(){
						    $(this).val($(this).val().replace(/[^0-9]/g,""));
						});
						modal.find('input[type=text]').on("keyup", function(){
						    $(this).val($(this).val().replace(' ',''));
						});
						modal.find('.link-privacy').off('click').on('click', function(){
							if(modal.find('.detail-privacy').is(':visible') == false){
								$(this).text('상세닫기 >');
								modal.find('.detail-privacy').show();
								return false;
							} else{
								$(this).text('상세보기 >');
								modal.find('.detail-privacy').hide();
								return false;
							}
						});
					    modal.find('[data-refund-btn]').off('click').on('click', function(){
							e.preventDefault(e);
							var _this = $(this);
							var refundBtn = _this.data('refund-btn');
							if(refundBtn === true){
								sandbox.validation.validate($form);
						    	if(checkbox.hasClass("checked") === true){
									if(sandbox.validation.isValid($form)){
										var owner = modal.find('input[name=owner]').val();
										var bankCode = modal.find('select[name=bankCode]').val();
										var accountNumber = modal.find('input[name=accountNumber]').val();
										var obj = {
											orderNumber : orderNumber,
											owner : owner,
											bankCode : bankCode,
											accountNumber : accountNumber,
											refundId : refundId
										}
										_this.removeData('refund-btn');
										_this.attr('data-refund-btn',false);
										BLC.ajax({
											url:sandbox.utils.contextPath +"/account/orders/refund",
											type:"POST",
											dataType:"json",
											data : obj
										},function(data){
											if(data.field == 'SUCCESS'){
												finishModal.find('h1').text('신청완료');
												finishModal.find('.contents-wrap>p>strong').html('배송서비스 보상 신청 접수가 완료되었습니다.<br>※ 지급시기 : 신청일 + 2일 이내(은행 영업일 기준)');
												finishModal.show();
												$this.find('.order-list').each(function (i, item) {
						 							var orderNumber = $(this).find('.order-code>span').text();
		   											if(orderNumber == data.refund.orderNumber){
														$(this).find('.btn-refund').hide();
													}
												});
											} else if(data.field == 'accountValidateCount'){
												modal.find('[data-error-info]').html('계좌정보 실명확인 3회 오류로 더 이상 입력하실 수 없습니다. <br>고객센터 080-022-0182 문의하셔서 오류 해제 도움을 받으세요.');
											} else if(data.field == 'owner'){
												modal.find('[data-error-info]').html('예금주를 입력해 주세요.');
											} else if(data.field == 'bankCode'){
												modal.find('[data-error-info]').html('은행/증권사를 선택해 주세요.');
											} else if(data.field == 'accountNumber'){
												modal.find('[data-error-info]').html('계좌번호를 입력해 주세요.');
											} else if(data.field == 'inisisAccountNumber'){
												modal.find('[data-error-info]').html('계좌정보가 유효하지 않습니다');
											} else{
												if(data.refund.refundType == 'CANCEL'){
													modal.find('[data-error-info]').text(data.message);
		    										$this.find('.order-list').each(function (i, item) {
							 							var orderNumber = $(this).find('.order-code>span').text();
			   											if(orderNumber == data.refund.orderNumber){
															$(this).find('.btn-refund').hide();
														}
													});
												}
												modal.find('[data-error-info]').text(data.message);
											}
											_this.removeData('refund-btn');
											_this.attr('data-refund-btn',true);
										});
									}
						    	} else if(checkbox.next('.info.error').length == 0){
						    		checkbox.after('<p class="info error">개인정보 수집·이용에 동의 하셔야 합니다.</p>');
						    	}
							}
					    });
					}
			    });

				//modal init
				var modal = UIkit.modal('#common-modal', {center:true});
				// 오늘 날짜 location 대입
		        var today = new Date(),
		            yyyy = today.getFullYear(),
		            mm = today.getMonth() + 1,
		            dd = today.getDate();

		        if (dd < 10) dd = '0' + dd
		        else if (mm < 10) mm = '0' + mm
		        today = yyyy + mm + dd;

				//주문취소 시작
				//상점정보 가져오기
				var orderHistoryContainer = new Vue({
					el:'[data-vue-orderhistory]',
					data:objStore,
					created:function(){
						objStore['store'] = 1;
						sandbox.utils.promise({
							url:sandbox.utils.contextPath +'/processor/execute/store',
							method:'GET',
							data:{
								'mode':'template',
								'templatePath':'/page/partials/storeList',
								'isShowMapLocation':false,
								'ignoreSharing':true
							},
							isLoadingBar:false
						}).then(function(data){
							objStore['store'] = sandbox.utils.strToJson(data.replace(/&quot;/g, '"'));
						}).fail(function(data){
							UIkit.notify(data, {timeout:3000,pos:'top-center',status:'danger'});
						});
					},
					components:{
						'location':{
							props:['store']
						},
						'order-cencel-button':{
							props:['orderId', 'isJustReservation'],
							template:'<button class="btn-link width-fix cancel-order" v-on:click="orderCencel">{{rtnLabel}}</button>',
							computed:{
								rtnLabel:function(){
									return (this.isJustReservation) ? '예약취소' : '주문취소';
								}
							},
							methods:{
								orderCencel:function(e){
									e.preventDefault();
									var orderId = this.orderId;

									sandbox.utils.promise({
										url:sandbox.utils.contextPath + '/account/order/cancel/' + orderId,
										method:'GET'
									}).then(function(data){
										var defer = $.Deferred();
										$('#common-modal').find('.contents').empty().append(data);
										sandbox.moduleEventInjection(data, defer);
										modal.show().one('hide.uk.modal', function() {     //ctm 로피스, 보피스 x 클릭시 태깅 진행,,,
											var f_type     = $("[data-fulfillmenttype]").data('fulfillmenttype');
					                    	var order_type = $("[data-ordertype]").data('ordertype');
											if(f_type=='PHYSICAL_PICKUP'){
							 	            	if(order_type==true){
							 	                	click_name  = "inventory: ROPIS_cancellation: quit";
							 					}else{	
													click_name  = "inventory: BOPIS_cancellation: quit" ;
							 					};
							 					endPoint.call('clickEvent', {'area' : 'mypage', 'name' : click_name });
											}else{
							 					endPoint.call('clickEvent', {'area' : 'mypage', 'name' : 'inventory: ORDER/SHIPPING_cancellation: quit' });
							 				};
										});

										return defer.promise();

									}).then(function(data){
										UIkit.modal.alert("취소 되었습니다.").on('hide.uk.modal', function() {
											window.location.reload();
										});
									}).fail(function(error){
										if(error){
											UIkit.modal.alert(error).on('hide.uk.modal', function() {
												window.location.reload();
											});
										}else{
											window.location.reload();
										}
									});
								}
							}
						},
						'order-delivery-button' :{
							props: ['orderId'],
							template: '<button class="btn-link width-fix" v-on:click="orderDelivery">상품수령확인</button>',
							methods:{
								orderDelivery:function(e){
									e.preventDefault();
									var $form = $(this.$el).closest('form');
									var url = $form.attr('action');
									var click_area = this.$attrs['data-click-area'];
									var click_name = this.$attrs['data-click-name'];
									
									endPoint.call('clickEvent', { 'area': click_area, 'name': click_name });
									
									UIkit.modal.confirm('<span style="word-break: keep-all;">상품을 이미 수령하신 후에도 배송중으로 표기되고 있다면, 상품수령확인 버튼을 눌러 배송상태를 배송완료로 변경할 수 있습니다. 변경하시겠습니까?<span>', function () {
										sandbox.utils.promise({
											url: url,
											data: $form.serialize(),
											method: 'POST'
										}).then(function (data) {
											UIkit.modal.alert(data.message).on('hide.uk.modal', function () {
												if (data.result == true) {
													endPoint.call('clickEvent', { 'area': click_area, 'name': click_name.replace("start", "quit") });
													window.location.reload();
												}
											});
										}).fail(function (error) {
											UIkit.modal.alert(error.message);
										});
									});
								}
							}
						}
					},
					methods:{
						findLocation:function(locationId){
							try{
								for(var i=0; i<this.store.length; i++){
									if(this.store[i]['id'] == locationId){
										return this.store[i]['name'];
									}
								}
							}catch(e){
								console.log(e);
							}
						},
						shipType:function(locationId){
							try{
								var rtnState = '온라인 물류센터';
								for(var i=0; i<this.store.length; i++){
									if(this.store[i]['id'] == locationId){
										rtnState = this.store[i]['isDefault'] ? '온라인 물류센터':'매장';
										break;
									}
								}
								return rtnState;
							}catch(e){
								console.log(e);
							}
						}
					}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-order]',
					attrName:'data-module-order',
					moduleName:'module_order',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function (Core, ui) {
	var template = '<div class="loading"><div class="dim"></div><div class="contents"><img src="/cmsstatic/theme/SNKRS/assets/images/preloader.gif" /><span class="comment">처리중 입니다.</span></div></div>';
	var $loading = $('body').append((function () {
		return $('#loading-icon-template').html();
	})() || template).find('.loading');
	
	function show() {
		$loading.focus();
		$loading.addClass('open');
	}
	function hide(){
		$loading.removeClass('open');
	}
	ui.loader = {
		show: show,
		hide: hide
	}
})(Core = window.Core || {}, Core.ui = window.Core.ui || {});
(function(Core){
	Core.register('module_pagination', function(sandbox){
		var $this, args, currentPage, totalPageNum, totalPageCount, lineSize, pageSize, isHistoryBack = false, endPoint, scrollController;

		/*
			data-module-pagination="{
				type:scroll,
				totalCount:896,
				currentPage:1,
				pageSize:40,
				target:.item-list-wrap,
				api:/kr/ko_kr/w/men/fw,
				scrollWrapper:window,
				scrollContainer:document,
				lineSize:4}"
		*/
		var setSessionPaging = function(){
			sessionStorage.setItem('categoryPagingType', args.type);
			sessionStorage.setItem('categoryCurrentPage', currentPage + 1);
		}

		// 상품리스트 최소 높이 지정
		var setContentsHeight = function(){
			var $contentsBody = $('.contents-body');
			var filterHeight = $('.contents-side').height();
			$contentsBody.css('min-height', filterHeight);
		}

		// 사이드메뉴 sticky (pc일 경우만)
		$(window).on('resize', function() {
			var wH = $(window).width();
			if (wH > 1023) {
				setContentsHeight();
			}
		});

		var Method = {
			moduleInit:function(){
				var sessionCurrentPage = sessionStorage.getItem('categoryCurrentPage');
				var sessionLineSize = sessionStorage.getItem('categoryLineSize');
				endPoint = Core.getComponents('component_endpoint');

				$this = $(this);
				args = arguments[0];
				currentPage = (sessionCurrentPage) ? sessionCurrentPage : args.currentPage;
				pageSize = Number(args.pageSize);
				totalPageNum = Math.ceil(args.totalCount / pageSize);
				lineSize = (sessionLineSize !== null) ? sessionLineSize : args.lineSize;

				switch(args.type){
					case 'more' :
						Method.typeMore();
						break;
					case 'scroll' :
						Method.typeScroll();
						break;
				}
			},
			getPaging:function(){
				return (args.totalCount > pageSize * currentPage && totalPageNum > currentPage) ? currentPage++ : null;
			},
			typeMore:function(){
				if(currentPage >= totalPageNum){
					// $this.find('button, a').remove();
					$this.find('button, a').hide();
					return;
				}

				$this.find('button, a').off('click').on('click', function(e){
					e.preventDefault();

					var _self = this;
					if(Method.getPaging()){
						var sort = ($('a#review-sort-tab.review-filter.active').text() === '도움순' ? 'helpfulCount' :'auditable.dateCreated');
						var obj = {
							'mode': args.mode,
							'templatePath':args.templatePath,
							'resultVar': args.resultVar,
							'productId': args.productId,
							'pageSize':pageSize,
							'page':currentPage,
							'lineSize':lineSize,
							'_sort':sort,
							'_type_sort':'desc',
							'cache':new Date().getTime()
						}

						sandbox.utils.ajax(args.api, 'GET', obj, function(data){
							if (args.api == Core.Utils.contextPath + '/processor/execute/review'){
								$(data.responseText).find('li').each(function(index){
									$('ul#review-list').append(this);
								});
							} else {
								sandbox.moduleEventInjection($(data.responseText).find(args.target)[0].innerHTML);
							}

							Method.setEndPoint( data );
							if(currentPage >= totalPageNum){
								$(_self).off('click');
								$(_self).hide();
								// $(_self).remove();
							}
							setSessionPaging();
						});

						// sandbox.utils.ajax(args.api, 'GET', {'page':currentPage, 'pageSize':pageSize, 'lineSize':lineSize}, function(data){
						// 	$(args.target).append($(data.responseText).find(args.target)[0].innerHTML);
						// 	sandbox.moduleEventInjection($(data.responseText).find(args.target)[0].innerHTML);
						// 	Method.setEndPoint( data );
						// 	if(currentPage >= totalPageNum){
						// 		$(_self).off('click');
						// 		$(_self).remove();
						// 	}
						// 	setSessionPaging();
						// });
					}
				});
			},
			typeScroll:function(){
				if(currentPage >= totalPageNum) return;

				var _self = this;
				var isFirst = true;
				var isLoaded = true;
				var prevScrollTop = 0;
				var contentsHeightPer = 0;

				scrollController = sandbox.scrollController(window, document, function(percent){
					contentsHeightPer = this.getScrollTop($(args.target).offset().top + $(args.target).height());

					if(percent > contentsHeightPer && isLoaded && !isHistoryBack && this.getScrollPer() < percent && !isFirst){
						isLoaded = false;
						if(Method.getPaging()){
							sandbox.utils.ajax(args.api, 'GET', {'page':currentPage, 'pageSize':pageSize, 'lineSize':lineSize}, function(data){

								//@pck 2020-10-26 SNKRS GRID WALL - 스크롤 페이징 후 레이지 콘트롤 미호출로 재 호출
								if(data.responseText.indexOf('launch-category') !== -1){

									var appendInnerHTML = $(data.responseText).find(args.target)[0].innerHTML;

									var listType = 'feed';
									if( typeof localStorage !== 'undefined' || localStorage !== null) {
										listType = ( localStorage.getItem('listType') ) ? localStorage.getItem('listType') : 'feed';
									}

									switch (listType) { //feed일 경우에는 기본 thyleaf 템플릿에서 내려주는 class 속성이 feed이므로 변경할 필요가 없음
										case 'grid' :
											appendInnerHTML = appendInnerHTML.replace(/pb2-sm va-sm-t ncss-col-sm-12 ncss-col-md-6 ncss-col-lg-4 pb4-md prl0-sm prl2-md ncss-col-sm-6 ncss-col-lg-3 pb4-md prl2-md pl1-md pr0-md/gi, 'pb2-sm va-sm-t ncss-col-sm-6 ncss-col-md-3 ncss-col-xl-2 prl1-sm grid-type');
											break;
									}

									$(args.target).append(appendInnerHTML);
									Method.removeMobileDateHeader();
									sandbox.moduleEventInjection($(data.responseText).find(args.target)[0].innerHTML);
									Method.updateCategoryMarketingScript(data);

									$('.launch-category .img-component').Lazy({
										visibleOnly: true,
										scrollDirection: 'vertical',
										afterLoad: function() {
											$('.launch-category .launch-list-item').addClass('complete');
										},
									});
								}else{
									$(args.target).append($(data.responseText).find(args.target)[0].innerHTML);
									sandbox.moduleEventInjection($(data.responseText).find(args.target)[0].innerHTML);
								}

								// 상품 어펜드 후 필터 스티키 다시 계산
								//20190820일 스니커즈 스크롤 페이징시 2페이 이후 오류 발생이 되어 실행 안되게 수정.
								if(Core.getModule('module_category')){
									sandbox.getModule('module_category').newHeaderSticky();
								}
								Method.setEndPoint( data );
								if(currentPage >= totalPageNum){
									scrollController.destroy();
								}else{
									isLoaded = true;
									setSessionPaging();
								}
							});
						}
					}

					//새로고침, 히스토리백을 했을경우 돔오브젝트가 생성되지 못한 상황에서 스크롤의 위치가 최 하단으로 이동 하기 때문에
					//처음 로드 시점에서는 무조건 scroll 이벤트를 막는다.
					isFirst = false;
					setContentsHeight();

				}, 'pagination');
			},
			updateCategoryMarketingScript:function(data){
				// 로드된 상품 정보 마케팅 데이터에 추가 
				if( $(data.responseText).find('#categoryMarketingScript').length > 0 ){
					var marketingText = $(data.responseText).find('#categoryMarketingScript')[0].outerHTML;
					$('#categoryMarketingScript').find('#products').append($(marketingText).find('#products div'));	
				}

				if(Core.utils.is.isFunction(categoryMarketingDataInit)){
					categoryMarketingDataInit();
				}

			},
			setEndPoint:function( data ){
				var $products = $(data.responseText).find('.categoryMarketingScript #products div');
				var itemList = [];
				$products.each(function(index, data){
					itemList.push({
						id : $(data).data("id")
					});
				})
				// 로드한 정보를 기존 정보에 추가해야 할지? 우선은 이벤트쪽으로만 정보 전달
				endPoint.call('loadMoreProducts', {page : currentPage, pageSize: pageSize, lineSize: lineSize, itemList: itemList  })
			},
			removeMobileDateHeader:function (){
				// @pck 2021-06-24 모바일 날짜 헤더 제거 로직
				// 과정을 감추기 위해 Lazy 이전에 실행되어야 함

				var elementListParent = document.querySelector('.item-list-wrap'),
					arrListItemsMO = document.querySelectorAll('.launch-list-item.d-md-h'),
					arrayListitemsMO = [];

				for (var i = 0; i < arrListItemsMO.length; ++i) { arrayListitemsMO.push(arrListItemsMO[i]); }

				arrayListitemsMO.sort(function(currentDate, nextDate) {
					var currentDateObj = new Date(currentDate.dataset.activeDate);
					var nextDateObj = new Date(nextDate.dataset.activeDate);
					if( currentDateObj.getFullYear() === nextDateObj.getFullYear() &&
						currentDateObj.getMonth() === nextDateObj.getMonth() &&
						currentDateObj.getDate() === nextDateObj.getDate()){
						var dateHeaderEl = currentDate.querySelector('.upcoming.bg-lightestgrey');
						if(dateHeaderEl !== null){
							currentDate.removeChild(dateHeaderEl);
						}
					}
				});

				for(var i = 0; i < arrayListitemsMO.length; ++i){ elementListParent.appendChild(arrayListitemsMO[i]); }
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-pagination]',
					attrName:'data-module-pagination',
					moduleName:'module_pagination',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			setLineSize:function(size){
				lineSize = size;
				sessionStorage.setItem('categoryLineSize', lineSize);
			},
			getPagingType:function(){
				return args.type;
			},
			getTotalCount:function () {
				return args.totalCount; // BK
			},
			destroy:function(){
				if(args.type === 'scroll' && scrollController) scrollController.destroy();
				sessionStorage.setItem('categoryCurrentPage', 1);
			}
		}
	});
})(Core);

/*
Kakao API
2020-06-11 @pck
*/
(function(Core){
    var kakaoAPI = Kakao;
    
    function initKakaoApi(){
        try {
            if(typeof kakaoAPI.isInit == 'undefined'){ 
                kakaoAPI.init('5f1c8dd8381502537d0f6cb5a5553428'); // API Key 2020-06-16 수령
                kakaoAPI.isInit = true;
            }
        }
        catch (err) { console.log('kakaoApi init ERR : ' + err); }
    }

    //현재 주소를 카카오 메세지로 공유
    function link(targetUrl){

        if(typeof Kakao.link == 'undefined') //init이 안되면 Kakao.* 하부 메소드들이 정의되지 않음으로 체크
            initKakaoApi();
        try { 
            kakaoAPI.Link.sendScrap({ requestUrl: targetUrl }); // init check *init 안 된 상태에서는 에러 발생
        } catch (err) { console.log('kakaoApi LINK ERR : ' + err); }

    }

    Core.kakaoApi = {
		init : function(){
			initKakaoApi();
        },
        link : link
	}
})(Core);
(function(Core){
	Core.register('module_pickup_product', function(sandbox){
		var $this, $deferred;
		var setStoreListTemplate = function(data, qty){

			$this.find('.store-list').empty().append(
				Handlebars.compile($("#store-list").html())({
					result:(data.length>0)?true:false,
					list:data,
					locationQuantity:qty
				})
			);
		}
		var Method = {
			moduleInit:function(){
				$this = $(this);
				//해당 skuPricing에서 넘어온 locationQuantity 값을 가지고 스토어 리스트를 불러온다.
				//var arrStoreList=[{151:1},{151:4},{151:26},{151:3},{151:65}];
				var itemRequest = sandbox.getModule('module_product').getItemRequest();
				var locationQuantity = sandbox.getModule('module_product').getSkuData().locationQuantity;
				var arrStoreList = [];
				var currentDate = new Date();
				var disabledDays = [];
				var defer = $.Deferred();

				for(var key in locationQuantity){
					arrStoreList.push(key);
				}

				sandbox.utils.promise({
					url:sandbox.utils.contextPath + '/processor/execute/store',
					type:'GET',
					data:{
						'mode':'template',
						'templatePath':'/page/partials/storeList',
						'storeId':arrStoreList.join(','),
						'resultVar':'stores',
						'cache':new Date().getTime()
					}
				}).then(function(data){
					var data = sandbox.utils.strToJson(data.replace(/&quot;/g, '"'));
					data.forEach(function(a,b,c){
						a['quantity'] = locationQuantity[a.id]
					});

					var mapComponent = sandbox.getComponents('component_map', {context:$this, storeList:data});
					var searchComponent = sandbox.getComponents('component_searchfield', {context:$this}, function(){
						this.addEvent('searchKeyword', function(e, keyword){
							var pattern = keyword + '[a-z0-9A-Z가-힣]*';
							var regex = new RegExp(pattern);
							var result = [];

							for(var i=0; i<data.length; i++){
								if(regex.test(data[i].address1) || regex.test(data[i].address2) || regex.test(data[i].city)|| regex.test(data[i].name)|| regex.test(data[i].state)){
									result.push(data[i]);
								}
							}

							setStoreListTemplate(result);
							mapComponent.reInit(result);
						});
					});

					setStoreListTemplate(data);
					$(document).off().on('click', '.location-btn', function(e){
						e.preventDefault();
						mapComponent.mapEvent($(this).closest('.shipping-list').index());
					});
					$this.off().on('click', '.reservation-apply', function(e){
						e.preventDefault();

						var index = $(this).closest('.shipping-list').index();
						itemRequest['fulfillmentLocationId'] = data[index].id;
						disabledDays = data[index].holidayClosedDates;

						$this.find('.datepicker').datepicker('refresh');
						$this.find('.datepicker-wrap').addClass('active');
						$this.find('.dim').addClass('active');
					});
				}).fail(function(msg){
					defer = null;
					UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
				});

				$this.find('.confirm-btn').addClass('disabled').off().on('click', function(e){
					e.preventDefault();
					if(!$(this).hasClass('disabled')){
						$deferred.resolve(itemRequest);
					}
				});

				$this.find('.cancel-btn').off().on('click', function(e){
					e.preventDefault();
					$deferred.reject();
				});

				//datapicker
				$this.find('.datepicker').datepicker({
					dateFormat: "yy-mm-dd",
					minDate:new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
					maxDate:'+20D',
					onSelect:function(date){
						itemRequest['reservedDate'] = date;
						$this.find('.timepicker').focus();

					},
					beforeShowDay:function(date){
						var string = jQuery.datepicker.formatDate('yy-mm-dd', date);
						return [ disabledDays.indexOf(string) == -1 ];
					}
				});

				//timepicker
				$this.find('.timepicker').focusout(function(e){
					var _self = $(this);
					setTimeout(function(){
						var time = _self.val();
						itemRequest['reservedDate'] += ' ' + time + ':00';
						$this.find('.datepicker-wrap').removeClass('active');
						$this.find('.dim').removeClass('active');
						$this.find('.confirm-btn').removeClass('disabled');
					},200);
				});

				//dim click addEvent
				$this.find('.dim').off().on('click', function(e){
					$(this).removeClass('active').parent().removeClass('active');
				});

			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-pickup-product]',
					attrName:'data-module-pickup-product',
					moduleName:'module_pickup_product',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			setDeferred:function(defer){
				$deferred = defer;
			}
		}
	});
})(Core);

(function (Core) {
	var md = null;
	var target = 'master.send';
	var useGa = false;
	function init(){
		md = _GLOBAL.MARKETING_DATA();
		useGa = md.useGa;
		
		switch (md.pageType) {
			case "confirmation":
				submitOrderConfirmationData();
				break;
		}
	}
	function isValid() {
		if (!useGa) {
			return false;
		}
		var ga = window.ga || {};
		return _.isFunction(ga);
	}
	// non-interaction event 처리
	function sendEvent(type, action, label, value) {
		if (isValid()) {
			if (_.isEmpty(action)) { action = 'action is empty'; }
			if (_.isEmpty(label)) { label = 'label is empty'; }
			if (typeof value === 'undefined' || isNaN(value) || !_.isNumber(value)) {
				value = 0;
			}
			ga(target, 'event', type, action, label, value, { 'nonInteraction': 1 });
		}
	}
	function submitOrderConfirmationData(){
		//http://sub1.localserver1.co.kr:8180/confirmation/2020062213445291717703
		if (isValid()) {
			createCommerceData(md, 'add');
		}
	}
	function createCommerceData(orderInfo, type){
		ga('master.require', 'ecommerce', 'ecommerce.js');
		ga('master.ecommerce:addTransaction', {
			'id': orderInfo.orderNumber,
			'revenue': ((type !== 'add') ? '-' : '') + orderInfo.orderTotalAmount,
			'shipping': '0',
			'tax': '0',
			'currency': 'KRW'
		});
		if (_.isArray(orderInfo.itemList)) {
			$.each(orderInfo.itemList, function () {
				ga('master.ecommerce:addItem', getTransProductItemData(orderInfo.orderNumber, this, type));
			})
		}
		ga('master.ecommerce:send');
	}
	function getTransProductItemData(orderNumber, item, type){
		return {
			'id': orderNumber,
			'name': item.name,
			'sku': item.skuId,
			'category': (function (opt) {
				var optValue = ''
				if (_.isArray(opt)) {
					$.each(opt, function (i) {
						if (i == 0) {
							for (key in this) {
								optValue = this[key];
							}
						}
					})
				}
				return optValue;
			})(item.option),
			'price': item.price,
			'quantity': ((type !== 'add') ? '-' : '') + item.quantity
		}
	}
	// 서버에서 처리 되는 ga 호출시 사용
	function processor(data) {
		switch (data.orderType) {
			// 반품시
			case 'RETURN':
				// 반품되는 전체 order 정보가 필요함 복수 일수도 있음
				//commerce( "order-return",  md.returnOrderNumber, "" );
				break;
			// 부분 반품시
			case 'PARTIAL_RETURN':
				break;
			// 취소시
			case 'VOID':
				commerce("order-cancel", data.orderId, md.cancelPrice);
				break;
			// 부분 취소시
			case 'PARTIAL_VOID':
				commerce("order-partial-cancel", data.orderId, md.cancelPrice);
				break;
		}
		
		// 반품 취소 처리 필요
		Core.Utils.ajax(Core.Utils.contextPath + '/processor/execute/google_enhanced_ec', 'GET', data, function (data) {
			if (data.status == 200) {
				if (String(data.responseText).indexOf('html') == -1) {
					$("body").append(data.responseText);
				}
			}
		}, true, true);
	}
	function pv(type, url) {
		if (isValid()) {
			ga(target, type, url); // ex) ga("master.send", "pageview", "/pagename");
		}
	}
	function social(name, action, url) {
		if (isValid()) {
			ga(target, 'social', name, action, url);
		}
	}
	function action(action, label, value) {
		sendEvent('user-action', action, label, value);
	}
	function commerce(action, label, value) {
		sendEvent('commerce', action, label, value);
	}
	function error(action, label, value) {
		sendEvent('error', action, label, value);
	}
	Core.ga = {
		init:init,
		processor: processor,
		pv: pv,
		social: social,
		action: action,
		commerce: commerce,
		error: error
	}
})(Core);
(function(Core){
	Core.register('module_qna_product', function(sandbox){
		var $this, $writeBtn, modal, textarea, args;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				$writeBtn = $this.find('.qna-write');
				modal = UIkit.modal('#common-modal');
				args = arguments[0];

				$writeBtn.click(function(e){
					e.preventDefault();

					sandbox.getModule('module_header').setLogin(function(){
						var url = $(this).attr('href');
						var param = sandbox.utils.getQueryParams(url);
						sandbox.utils.ajax(url, 'GET', {}, function(data){
							var responseText = data.responseText;
							$('#common-modal').find('.contents').empty().append(responseText);
							modal.show();
						});
					});
				});

				sandbox.getComponents('component_textarea', {context:$this}, function(){
					var _this = this;
					_this.getThis().closest('form').submit(function(e){
						e.preventDefault();

						if(sandbox.getModule('module_header').getIsSignIn()){
							if(!_this.getValidateChk()){
								UIkit.notify(args.errMsg, {timeout:3000,pos:'top-center',status:'danger'});
							}else{
								var param = $(this).serialize();
								sandbox.utils.ajax($(this).attr('action'), $(this).attr('method'), $(this).serialize(), function(data){
									if(data.readyState === 4 && data.status === 200 && data.statusText === 'success'){
										location.reload();
									}else{
										UIkit.notify(args.errMsg, {timeout:3000,pos:'top-center',status:'danger'});
									}
								});
							}
						}else{
							sandbox.getModule('module_header').setLogin(function(data){
								if(data.isSignIn){
									location.reload();
								}
							});
						}
					});
				});

			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-qna-product]',
					attrName:'data-module-qna-product',
					moduleName:'module_qna_product',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	var md = null;
	var queryString = '';
	var language = (navigator.language != null) ? navigator.language : 'ko-KR';
	var currencyType = 'KRW';
	var isMobile = _GLOBAL.DEVICE.IS_MOBILE();
	var isSnkrs = _GLOBAL.SITE.IS_SNKRS || false;
	var experienceType = isSnkrs ? 'snkrs' : 'nikecom';
	var pageType = '';
	var eventName = '';
	var classification = '';
	var filtered = {};
	var dl = {};
	var schemaIds = {}
	var isStaging = false;
	var isProd = false;
	var eventQueueList = [];
	var isEventCallReady = false;
	
	var eventNames = {
		CLICK: 'CMS Content Clicked',
		NAVIGATION_CLICK: 'Navigation Clicked',
		BANNER_CLICK: 'Banner Clicked',
		PAGE_VIEWED: 'Page Viewed',
		PRODUCT_LIST_VIEWED: 'Product List Viewed',
		PRODUCT_LIST_FILTERED: 'Product List Filtered',
		PRODUCT_VIEWED: 'Product Viewed',
		PRODUCT_REVIEWED: 'Product Reviewed',
		PRODUCT_REMOVED : 'Product Removed',
		PRODUCT_ADDED : 'Product Added',
		PRODUCT_ADDED_ERROR_VIEWED : 'Add To Cart Error Viewed',
		PRODUCT_CLICKED : 'Product Clicked',
		PRODUCT_SAVED : 'Product Saved',
		PRODUCT_UNSAVED : 'Products Unsaved',
		PRODUCTS_SEARCHED : 'Products Searched',
		PRODUCT_SIZE_SELECTED : 'Product Size Selected',
		CART_VIEWED: 'Cart Viewed',
		CHECKOUT_STARTED:'Checkout Started',
		ORDER_INFO_VIEWED: 'Order Info Viewed',
		SHIPPING_INFO_VIEWED: 'Shipping Info Viewed',
		PAYMENT_INFO_VIEWED: 'Payment Info Viewed',
		ORDER_CONFIRMATION_VIEWED: 'Order Confirmation Viewed',
		ORDER_COMPLETED: 'Order Completed',
		ACCOUNT_AUTHENTICATED: 'Account Authenticated',
		ACCOUNT_CREATED: 'Account Created',
		WISHLIST_VIEWED : 'Wishlist Viewed',
		SEARCH_POPULAR_SUGGESTION_CLICKED : 'Search Popular Suggestion Clicked',
		SEARCH_SUBMITTED : 'Search Submitted',
		SEARCH_TYPEAHEAD_CLICKED : 'Search Typeahead Clicked',
		FILTER_APPLIED : 'Filter Applied',
		FILTER_MENU_TOGGLED : 'Filter Menu Toggled',
		ELEVATED_CONTENT_VIEWED : 'Elevated Content Viewed',
		NOTIFY_ME_DISMISSED: 'Notify Me Dismissed',
		NOTIFY_ME_SUBMITTED: 'Notify Me Submitted',
		PICKUP_OFFERINGS_VIEWED: 'Pickup Offerings Viewed',
		PRODUCT_ZOOMED: 'Product Zoomed',
		PRODUCT_ZOOM_CLOSED: 'Product Zoom Closed',
		RECOMMENDED_PRODUCT_SELECTED: 'Recommended Product Selected',
		RECOMMENDED_PRODUCT_CLICKED: 'Recommended Product Clicked',
		PROMO_CODE_APPLIED: 'Promo Code Applied',
		PROMO_CODE_REJECTED: 'Promo Code Rejected',
		RECOMMENDED_PRODUCTS_CAROUSEL_SHOWN: 'Recommended Products Carousel Shown',
		CHECKOUT_INTENT_START: 'Checkout Intent Start',
		ERROR_MODAL_VIEWED: 'Error Modal Viewed',
		FULFILLMENT_LOCATION_ENTERED: 'Fulfillment Location Entered',
		LOGIN_PROMPT_VIEWED: 'Login Prompt Viewed',
		ADDRESS_SUGGESTION_SELECTED: 'Address Suggestion Selected',
		PAYMENT_METHOD_SELECTED: 'Payment Method Selected',
		SHIPPING_METHOD_SELECTED: 'Shipping Method Selected',
		SHIPPING_ADDRESS_SELECTED: 'Shipping Address Selected',
		SHIPPING_OPTIONS_AVAILABLE: 'Shipping Options Available',
		SHIPPING_OPTION_SELECTED: 'Shipping Option Selected',
		ORDER_DETAILS_VIEWED: 'Order Details Viewed',
		ORDER_HISTORY_VIEWED: 'Order History Viewed',
		RETURN_ITEMS_VIEWED: 'Return Items Viewed',
		RETURN_ITEM_CLICKED: 'Return Item Clicked',
		RETURN_REASON_CLICKED: 'Return Reason Clicked',
		ORDER_CANCELLATION_SUCCESS_VIEWED: 'Order Cancellation Success Viewed',
		ORDER_CANCELLATION_FAILURE_VIEWED: 'Order Cancellation Failure Viewed',
		LOCATOR_VIEWED: 'Locator Viewed',
		NOT_FOUND_VIEWED: 'Not Found Viewed',
		MAP_MARKER_CLICKED: 'Map Marker Clicked',
		STORY_CLICKED: 'Story Clicked',
		SIDE_STORY_CLICKED: 'Side Story Clicked',
		IMPRESSION: 'Impression Tracked',
		VIDEO_PAUSED: 'Video Paused',
		VIDEO_ENTERED_FULLSCREEN: 'Video Entered Fullscreen',
		VIDEO_PLAYED: 'Video Played',
		VIDEO_REWOUND: 'Video Rewound',
		VIDEO_EXITED_FULLSCREEN: 'Video Exited Fullscreen',
		VIDEO_MUTED: 'Video Muted',
		VIDEO_UNMUTED: 'Video Unmuted',
		VIDEO_SUBTITLES_OFF: 'Video Subtitles Turned Off',
		VIDEO_SUBTITLES_ON: 'Video Subtitles Turned On',
		VIDEO_RESTARTED: 'Video Restarted',
		VIDEO_STARTED: 'Video Started',
		VIDEO_ENDED: 'Video Ended',
		BUY_NOW_CLICKED: 'Buy Now Clicked',
	};

	var eventTypes = {
		PAGE: 'page',
		TRACK: 'track',
		CHANGE_VIEW: 'changeView'
	};
	var classifications = {
		EXPERIENCE : 'experience event',
		CORE_BUY_FLOW : 'core buy flow'
	}
	var shippingOptions = [ '1:x:x:0:' + currencyType, '2:x:x:5000:' + currencyType];
	function getSchemaUrl(eventName, eventType, experience, isCoreBuyFlow){
		var url = '';
		url += 'https://www.nike.com/assets/measure/schemas/digital-product/dotcom/platform/web/classification/' +
				( isCoreBuyFlow ? 'core-buy-flow' : 'experience-event') + 
				'/experience/'+experience+'/event-type/'+eventType+'/event-name/'+eventName+'/version/LATEST/schema.json';
		return url;
	}
	function createSchemaIdAttrbute(eventName, experience, isCoreBuyFlow){
		var experienceType = experience;
		if(isSnkrs && experience != 'stories'){
			experienceType = 'snkrs';
		}
		return { eventName: eventName, experience: experienceType, isCoreBuyFlow: isCoreBuyFlow };
	}
	function setSchemaId(eventName, experience, isCoreBuyFlow){
		schemaIds[eventName] = createSchemaIdAttrbute(Core.utils.string.toLower(eventName.split(' ').join('-')), experience, isCoreBuyFlow);
	}
	function createSchemaIds(){
		schemaIds = {
			[eventNames.PAGE_VIEWED]: createSchemaIdAttrbute('page-viewed', getSchemaExperienceType(), true),
			[eventNames.PRODUCT_LIST_VIEWED]: createSchemaIdAttrbute('product-list-viewed', 'pw', true),
			[eventNames.PRODUCT_LIST_FILTERED]: createSchemaIdAttrbute('product-list-filtered', 'pw', true),
			[eventNames.PRODUCT_VIEWED]: createSchemaIdAttrbute('product-viewed', 'pdp', true),
			[eventNames.CART_VIEWED]: createSchemaIdAttrbute('cart-viewed', 'cart', true),
			[eventNames.CHECKOUT_STARTED]: createSchemaIdAttrbute('checkout-started', 'checkout', true),
			[eventNames.ORDER_INFO_VIEWED]: createSchemaIdAttrbute('order-info-viewed', 'checkout', false),
			[eventNames.SHIPPING_INFO_VIEWED]: createSchemaIdAttrbute('shipping-info-viewed', 'checkout', false),
			[eventNames.PAYMENT_INFO_VIEWED]: createSchemaIdAttrbute('payment-info-viewed', 'checkout', false),
			[eventNames.ORDER_CONFIRMATION_VIEWED]: createSchemaIdAttrbute('order-confirmation-viewed', 'checkout', true),
			[eventNames.ORDER_COMPLETED]: createSchemaIdAttrbute('order-completed', 'checkout', true),
			[eventNames.ACCOUNT_AUTHENTICATED]: createSchemaIdAttrbute('account-authenticated', getSchemaExperienceType(), true),
			[eventNames.ACCOUNT_CREATED]: createSchemaIdAttrbute('account-created', getSchemaExperienceType(), true),
			[eventNames.PRODUCT_REMOVED]: createSchemaIdAttrbute('product-removed', 'cart', true),
			[eventNames.PRODUCT_ADDED]: createSchemaIdAttrbute('product-added', getSchemaExperienceType(), true),
			[eventNames.PRODUCT_ADDED_ERROR_VIEWED]: createSchemaIdAttrbute('add-to-cart-error-viewed', getSchemaExperienceType(), true),
			[eventNames.PRODUCT_CLICKED]: createSchemaIdAttrbute('product-clicked', 'pw', true),
			[eventNames.PRODUCTS_SEARCHED]: createSchemaIdAttrbute('products-searched', 'pw', true),
			[eventNames.WISHLIST_VIEWED]: createSchemaIdAttrbute('wishlist-viewed', 'wishlist', false),
			[eventNames.SEARCH_POPULAR_SUGGESTION_CLICKED]: createSchemaIdAttrbute('search-popular-suggestion-clicked', 'global-nav', false),
			[eventNames.SEARCH_SUBMITTED]: createSchemaIdAttrbute('search-submitted', 'global-nav', false),
			[eventNames.SEARCH_TYPEAHEAD_CLICKED]: createSchemaIdAttrbute('search-typeahead-clicked', 'global-nav', false),
			[eventNames.FILTER_APPLIED]: createSchemaIdAttrbute('filter-applied', 'pw', false),
			[eventNames.FILTER_MENU_TOGGLED]: createSchemaIdAttrbute('filter-menu-toggled', 'pw', false),
			[eventNames.ELEVATED_CONTENT_VIEWED]: createSchemaIdAttrbute('elevated-content-viewed', 'pdp', false),
			[eventNames.NOTIFY_ME_DISMISSED]: createSchemaIdAttrbute('notify-me-dismissed', 'pdp', false),
			[eventNames.NOTIFY_ME_SUBMITTED]: createSchemaIdAttrbute('notify-me-submitted', 'pdp', false),
			[eventNames.PICKUP_OFFERINGS_VIEWED]: createSchemaIdAttrbute('pickup-offerings-viewed', 'pdp', false),
			[eventNames.PRODUCT_REVIEWED]: createSchemaIdAttrbute('product-reviewed', 'pdp', false),
			[eventNames.PRODUCT_SAVED]: createSchemaIdAttrbute('product-saved', getSchemaExperienceType(), false),
			[eventNames.PRODUCT_SIZE_SELECTED]: createSchemaIdAttrbute('product-size-selected', 'pdp', false),
			[eventNames.PRODUCT_UNSAVED]: createSchemaIdAttrbute('product-unsaved', getSchemaExperienceType(), false),
			[eventNames.PRODUCT_ZOOMED]: createSchemaIdAttrbute('product-zoomed', 'pdp', false),
			[eventNames.PRODUCT_ZOOM_CLOSED]: createSchemaIdAttrbute('product-zoom-closed', 'pdp', false),
			[eventNames.RECOMMENDED_PRODUCT_SELECTED]: createSchemaIdAttrbute('recommended-product-selected', 'pdp', false),
			[eventNames.PROMO_CODE_APPLIED]: createSchemaIdAttrbute('promo-code-applied', getSchemaExperienceType(), false),
			[eventNames.PROMO_CODE_REJECTED]: createSchemaIdAttrbute('promo-code-rejected', getSchemaExperienceType(), false),
			[eventNames.RECOMMENDED_PRODUCT_CLICKED]: createSchemaIdAttrbute('recommended-product-clicked', getSchemaExperienceType(), false),
			[eventNames.RECOMMENDED_PRODUCTS_CAROUSEL_SHOWN]: createSchemaIdAttrbute('recommended-products-carousel-shown', getSchemaExperienceType(), false),
			[eventNames.CHECKOUT_INTENT_START]: createSchemaIdAttrbute('checkout-intent-start', 'cart', false),
			[eventNames.ERROR_MODAL_VIEWED]: createSchemaIdAttrbute('error-modal-viewed', 'checkout', false),
			[eventNames.FULFILLMENT_LOCATION_ENTERED]: createSchemaIdAttrbute('fulfillment-location-entered', 'checkout', false),
			[eventNames.LOGIN_PROMPT_VIEWED]: createSchemaIdAttrbute('login-prompt-viewed', 'checkout', false),
			[eventNames.ADDRESS_SUGGESTION_SELECTED]: createSchemaIdAttrbute('address-suggestion-selected', 'checkout', false),
			[eventNames.PAYMENT_METHOD_SELECTED]: createSchemaIdAttrbute('payment-method-selected', 'checkout', false),
			[eventNames.SHIPPING_METHOD_SELECTED]: createSchemaIdAttrbute('shipping-method-selected', 'checkout', false),
			[eventNames.SHIPPING_ADDRESS_SELECTED]: createSchemaIdAttrbute('shipping-address-selected', 'checkout', false),
			[eventNames.SHIPPING_OPTIONS_AVAILABLE]: createSchemaIdAttrbute('shipping-options-available', 'checkout', false),
			[eventNames.SHIPPING_OPTION_SELECTED]: createSchemaIdAttrbute('shipping-option-selected', 'checkout', false),
			[eventNames.ORDER_DETAILS_VIEWED]: createSchemaIdAttrbute('order-details-viewed', 'myorders', false),
			[eventNames.ORDER_HISTORY_VIEWED]: createSchemaIdAttrbute('order-history-viewed', 'myorders', false),
			[eventNames.RETURN_ITEMS_VIEWED]: createSchemaIdAttrbute('return-items-viewed', 'myorders', false),
			[eventNames.RETURN_ITEM_CLICKED]: createSchemaIdAttrbute('return-item-clicked', 'myorders', false),
			[eventNames.RETURN_REASON_CLICKED]: createSchemaIdAttrbute('return-reason-clicked', 'myorders', false),
			[eventNames.ORDER_CANCELLATION_SUCCESS_VIEWED]: createSchemaIdAttrbute('order-cancellation-success-viewed', 'myorders', false),
			[eventNames.ORDER_CANCELLATION_FAILURE_VIEWED]: createSchemaIdAttrbute('order-cancellation-failure-viewed', 'myorders', false),
			[eventNames.LOCATOR_VIEWED]: createSchemaIdAttrbute('locator-viewed', 'store-locator', false),
			[eventNames.NOT_FOUND_VIEWED]: createSchemaIdAttrbute('not-found-viewed', 'store-locator', false),
			[eventNames.MAP_MARKER_CLICKED]: createSchemaIdAttrbute('map-marker-clicked', 'store-locator', false),
			[eventNames.STORY_CLICKED]: createSchemaIdAttrbute('story-clicked', 'stories', false),
			[eventNames.SIDE_STORY_CLICKED]: createSchemaIdAttrbute('side-story-clicked', 'stories', false),
			[eventNames.VIDEO_PAUSED]: createSchemaIdAttrbute('video-paused', 'landing-page', false),	
			[eventNames.VIDEO_PLAYED]: createSchemaIdAttrbute('video-played', 'landing-page', false),	
			[eventNames.VIDEO_REWOUND]: createSchemaIdAttrbute('video-rewound', 'landing-page', false),	
			[eventNames.VIDEO_ENTERED_FULLSCREEN]: createSchemaIdAttrbute('video-entered-fullscreen', 'landing-page', false),	
			[eventNames.VIDEO_EXITED_FULLSCREEN]: createSchemaIdAttrbute('video-exited-fullscreen', 'landing-page', false),	
			[eventNames.VIDEO_MUTED]: createSchemaIdAttrbute('video-muted', 'landing-page', false),	
			[eventNames.VIDEO_UNMUTED]: createSchemaIdAttrbute('video-unmuted', 'landing-page', false),	
			[eventNames.VIDEO_SUBTITLES_OFF]: createSchemaIdAttrbute('video-subtitles-turned-off', 'landing-page', false),	
			[eventNames.VIDEO_SUBTITLES_ON]: createSchemaIdAttrbute('video-subtitles-turned-on', 'landing-page', false),	
			[eventNames.VIDEO_RESTARTED]: createSchemaIdAttrbute('video-restarted', 'landing-page', false),	
			[eventNames.VIDEO_STARTED]: createSchemaIdAttrbute('video-started', 'landing-page', false),	
			[eventNames.VIDEO_ENDED]: createSchemaIdAttrbute('video-ended', 'landing-page', false),	
			[eventNames.BUY_NOW_CLICKED]: createSchemaIdAttrbute('buy-now-clicked', 'pdp', false),
		}
		return;
	}
	var WRITE_KEY = {
		STG : 'POwa4r8vBBSw7xdQZ0dqGlNuyaT7Y7pZ',
		PROD : '2iv4Qa7rFEipAs4iE850BkBpTYQvlAFZ'
	}
	$(window).bind("pageshow", function (event) {
		if (event.originalEvent.persisted) {
			try {
				if( _GLOBAL.MARKETING_DATA().pageType != 'checkout'){
					sessionStorage.removeItem('checkoutStarted');	
				}
			} catch (error) {}
			// 뒤로가기로 페이지 로드 시
		}
	});
	function init(){
		var currnetUrl = Core.utils.url.getCurrentUrl();
		isStaging = currnetUrl.indexOf('stg-www') > -1;
		isProd = currnetUrl.indexOf('nike.com') > -1;
		try {
			var isEnableDryRun = false;	
			// 로컬 일 때 isEnableDryRun 활성화
			if( !isStaging && !isProd ){
				isEnableDryRun = true;
			}
			if( !isProd ) {
				analyticsClient.debug();
			}
			analyticsClient.load({ enableDryRun: isEnableDryRun, countryCode : 'KR', uniteTimeout : 1 });
		} catch (error) {
			console.warn("Can't not found AnalyticsClient!");
			return;
		}

		queryString = Core.utils.url.getQueryStringParams( Core.utils.url.getCurrentUrl());
		md = _GLOBAL.MARKETING_DATA();

		$(document).ready( function(){
			// korea adobe 설정해놓은 값 중 캐치해서 사용해야 하는 상황에서 사용
			$('body').on('click', '[data-click-name]', function(e){
				var name = $(this).data('click-name') || '';
				if( Core.utils.string.startsWith(name, 'in wall content:')){
					var content = name.split(':')[1];
					endPoint.call('clickEventHandler', {area : 'pw', name : 'Content Clicked', activity : 'con:1:gridwall:' + content});
				}
			})

			$('body').on('click', '[data-global-click-name]', function(e){
				if ($(this).data("click-enable") == false) {
					return;
				}
				var name = $(this).data('global-click-name');
				var area = $(this).data('global-click-area') || null;
				var activity = $(this).data('global-click-activity') || null;
				var endPoint = Core.getComponents('component_endpoint');

				// toggle-on attribute 가 있으면 off 일 때, 즉 닫혀있어서 열리는 상황에 전송한다.
				if (!_.isUndefined($(this).attr('data-global-click-toggle-on'))) {
					if ($(this).data('click-toggle-on') == 'on'){
						$(this).data('click-toggle-on', 'off');
						return;
					}else{
						$(this).data('click-toggle-on', 'on');
					}
				}

				endPoint.call('clickEventHandler', {area : area, name : name, activity : activity});
			})
		})

		if( md.pageType != 'checkout'){
			sessionStorage.removeItem('checkoutStarted');	
		}

		callPageEvent();
		callTrackEvent();
	}
	function callPageEvent(){
		log('callPageEvent');
		var eventType = eventTypes.PAGE;
		var isLoginSuccessCheck = false;
		var isCall = true;
		switch( md.pageType ){
			case 'home':
				pageType = 'homepage';
				eventName = eventNames.PAGE_VIEWED;
				classification = classifications.CORE_BUY_FLOW;
			break;
			case 'category' :
				$.extend( dl, getCategoryData());
			break;
			case 'search' :
				$.extend( dl, getSearchData());
			break;
			case 'product' :
				$.extend( dl, getProductData());
			break; 
			case 'cart' :
				isLoginSuccessCheck = true;
				$.extend( dl, getCartData());
				/*
				if(Core.utils.is.isEmpty(md.itemList)){
					isCall = false;
				}
				*/
			break;
			case 'checkout' :
				isLoginSuccessCheck = true;
				$.extend( dl, getCheckoutData());
			break;
			case 'confirmation' :
				$.extend( dl, getOrderConfirmationData());
			break;
			case 'register':
				eventType = eventTypes.CHANGE_VIEW;
				$.extend( dl, getRegisterData());
			break;
			case 'registerSuccess':
				var startPageType = sessionStorage.getItem('checkRegistStartPage');
				if( startPageType == 'cart' ){
					$.extend( dl, getRegisterSuccessData(startPageType));
					sessionStorage.removeItem('checkRegistStartPage');
				}
			break;
			case 'wishlist':
				if(Core.utils.is.isEmpty(md.itemList)){
					isCall = false;
				}
				$.extend( dl, getWishListData());
			break;
			case 'orderDetail':
				pageType = 'myorders';
				eventName = eventNames.ORDER_DETAILS_VIEWED;
			break;
			case 'orderHistory':
				pageType = 'myorders';
				eventName = eventNames.ORDER_HISTORY_VIEWED;
			break;
			case 'mypage':
				pageType = 'mypage';
				eventName = eventNames.ORDER_HISTORY_VIEWED;
			break;
			case 'orderReturnable':
				pageType = 'myorders';
				eventName = eventNames.PAGE_VIEWED;
			break;
			case 'orderReturned':
				pageType = 'myorders';
				eventName = eventNames.RETURN_ITEMS_VIEWED;
			break;
			case 'store':
				pageType = 'store locator';
				eventName = eventNames.LOCATOR_VIEWED;
				if(md.storeInfo.totalItemCount==0){
					eventName = eventNames.NOT_FOUND_VIEWED;
				}
			break;
			case 'content':	
				if( Core.utils.string.startsWith(md.pathName, '/l/') ){
					pageType = String(md.pathName).replace('/l/', '') + ':land';
					classification = classifications.CORE_BUY_FLOW;
				}else{
					pageType = String(md.pathName).replace('/account/', '/member/').substr(1).replaceAll('/','>');
				}
				eventName = eventNames.PAGE_VIEWED;
			break;
		}

		if( pageType == '') return;
		createSchemaIds();
		$.extend( dl, getPageData(eventType, eventName)); // 기본 페이지 데이터 생성;

		if(isCall) submitDataLayer(dl);

		// 로그인 당시 콜백으로 이벤트를 받아 처리 가능하지만 스크립트가 호출되기전에 화면이 리프레시 되는 상황 때문에 타이밍 변경
		if( isLoginSuccessCheck ) loginSuccessTrackEvent();
	}
	function callTrackEvent(){
		log('callTrackEvent');
		var data = null;
		switch( md.pageType ){
			case 'category' :
				submitDataLayer( $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventNames.PRODUCT_LIST_VIEWED, null, classifications.CORE_BUY_FLOW)));
			break;
			case 'product' :
				// 하단 컨텐츠 있을 시
				if( md.productInfo.is1on1 == true ){
					submitDataLayer(getPageData(eventTypes.TRACK, eventNames.ELEVATED_CONTENT_VIEWED, 'pdp:elevated content viewed', classifications.EXPERIENCE));
				}

				// 픽업 가능한 상품
				if( md.productInfo.isAvailablePickup == true ){
					data = getPageData(eventTypes.TRACK, eventNames.PICKUP_OFFERINGS_VIEWED, null, classifications.EXPERIENCE);
					data.fulfillment = {
						pickupOfferingStatus : 'offerings' // no stores, stores but no offerings, offerings, no location detected
					}
					submitDataLayer(data);
				}
			break
			case 'search':
				submitDataLayer( $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventNames.PRODUCTS_SEARCHED, null, classifications.CORE_BUY_FLOW)));
			break;
			case 'cart' :
				//if( md.itemList != null ){
					submitDataLayer( $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventNames.CART_VIEWED, null, classifications.CORE_BUY_FLOW)));
				//}

				if( md.productRelatedProducts == null ){
					data = getPageData(eventTypes.TRACK, eventNames.RECOMMENDED_PRODUCTS_CAROUSEL_SHOWN, null, classifications.EXPERIENCE );
					data.cartId = md.cartId;
					submitDataLayer(data);
				}
			break
			case 'wishlist':
				if( Core.utils.is.isEmpty(md.itemList) == false ){
					submitDataLayer( $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventNames.WISHLIST_VIEWED)));
				}
			break;
			case 'checkout' :
				if(md.marketingData.checkoutInfo != null) {
					var checkoutInfo = md.marketingData.checkoutInfo;
					if(checkoutInfo.step == 'shipping' || checkoutInfo.step == 'payment'){
						callCheckoutTrackEvent(eventNames.SHIPPING_ADDRESS_SELECTED, 'shipping methods');
						callCheckoutTrackEvent(eventNames.SHIPPING_OPTIONS_AVAILABLE);
						// TODO 옵션 선택된것 확인해서 처리 해야함
						callCheckoutTrackEvent(eventNames.SHIPPING_OPTION_SELECTED, null, { shipping : { selectedOption : shippingOptions[0] }});
						if(checkoutInfo.alreadyShippingAddress == true){
							callCheckoutTrackEvent(eventNames.FULFILLMENT_LOCATION_ENTERED);
						}
					}

					var isCheckoutStartedCall = sessionStorage.getItem('checkoutStarted');
					if(isCheckoutStartedCall != 'true'){
						sessionStorage.setItem('checkoutStarted', true);
						var data = getPageData(eventTypes.TRACK, eventNames.CHECKOUT_STARTED, null, classifications.CORE_BUY_FLOW);
						data.checkoutType = getCheckoutType();
						submitDataLayer($.extend( _.cloneDeep(dl), data));
					}
				}
			break;
			case 'confirmation' :
				submitDataLayer( $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventNames.ORDER_COMPLETED, null, classifications.CORE_BUY_FLOW)));
			break;
			case 'store' :
				if( queryString._search != null ){
					submitDataLayer(getPageData(eventTypes.TRACK, eventNames.SEARCH_SUBMITTED, 'sl:search submitted'));
				}
			break;
		}
	}
	function loginSuccessTrackEvent(){
		if( sessionStorage.getItem('loginSuccess') != 'true' ){
			return;
		}
		sessionStorage.removeItem('loginSuccess');
		submitDataLayer( $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventNames.ACCOUNT_AUTHENTICATED, null, classifications.CORE_BUY_FLOW)));
	}
	function getCategoryData(){
		pageType = 'pw';
		if( isSnkrs ){
			pageType = queryString.type == null ? 'feed' : queryString.type;
			// TODO 노출되는 상품정보다 다시 맞춰야함
		}
		eventName = eventNames.PRODUCT_LIST_VIEWED;
		classification = classifications.CORE_BUY_FLOW;

		var data = {};
		data.isRedirect = false;
		data.products = makeProducts(md.itemList, 'pw');

		if( !isSnkrs ){
			if( md.categoryInfo != null ){
				// data.category = md.categoryInfo.name;
				data.searchResultsCount = md.categoryInfo.totalCount;
				data.selectedConcepts = (function(){
					return String(md.categoryInfo.breadcrumbs).replace('Home||','').split('||');
				}());
			}
			data.selectedConceptsIds = [];
			$.each( data.selectedConcepts, function(index, selectedConcept){
				data.selectedConceptsIds.push('none-' + (index+1));
			})
		}
		return data;
	}
	function getSearchData(){
		pageType =  'pw';
		eventName = eventNames.PRODUCT_LIST_VIEWED; // track 호출 할 떄 이벤트 네임 변경하여 호출
		classification = classifications.CORE_BUY_FLOW;
		
		var isResultsfound = ( md.searchInfo.totalCount > 0 );
		var data = {};
		data.searchResultPageType = isResultsfound ? 'onsite search results' : 'no results found';
		data.searchResultsCount = md.searchInfo.totalCount;
		
		if( queryString.pl !=  't'){
			data.searchTerm = md.searchInfo.keyword;  //내가 검색어를 입력했을떄만 들어옴
		}
		data.searchText = md.searchInfo.keyword;
		data.products = makeProducts(md.itemList, 'pw');
		return data;
	}
	function getCategoryFilteredData(){
		var data ={};
		var search = location.search;
		var filters = [];
		var sorts = [];
		search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value){
			( key == 'sort') ? sorts.push({ type : value.split('+')[0], value : value.split('+')[1] }) : filters.push({ type : key, value : value });
		})
		data.filters = filters;
		data.sorts = sorts;
		data.content = {
			pwFacetList : (function(){
				var facetList = [];
				$.each( filters, function(index ,data){
					facetList.push(data.type + ':' + data.value);
				})
				return facetList;
			}()),
			pwSearchFacet : (function(){
				return (filtered.type == undefined) ? {} : (filtered.type + ':' + filtered.item.key +':' + filtered.item.value);
			}()),
			sortCriteria : (function(){
				var sort = '';
				$.each( sorts, function(index, data){
					sort = 'sort:' + data.type + '|' + data.value;
				})
				return sort;
			}())
		}
		return data;
	}
	function getProductData(){
		pageType = 'pdp';
		eventName = eventNames.PRODUCT_VIEWED;
		classification = classifications.CORE_BUY_FLOW;
		
		var data = {};
		var productData = makeProducts([md.productInfo], 'pdp');
		$.extend( data, productData[0]);
		data.products = productData;
		return data;
	}
	function getCartData(){
		pageType = 'cart';
		eventName = eventNames.CART_VIEWED;
		classification = classifications.CORE_BUY_FLOW;
		
		var data = {};
		data.products = [];
		data.cartItemCount = 0;
		data.cartUnitCount = 0;
		data.cartValue = 0;
		if( md.itemList != null ){
			data.products = makeProducts(md.itemList, 'cart');
			data.cartItemCount = md.totalItemCount;
			data.cartUnitCount = md.itemList.length || 0;
			data.cartValue = md.cartTotalAmount;
		}
		return data;
	}
	function getCheckoutData(){
		pageType = 'checkout';
		if( Core.utils.is.isEmpty( md.marketingData )){
			pageType = '';
			return;
		}
		var checkoutInfo = md.marketingData.checkoutInfo;
		if(checkoutInfo.step == 'order') eventName = eventNames.ORDER_INFO_VIEWED;
		if(checkoutInfo.step == 'shipping') eventName = eventNames.SHIPPING_INFO_VIEWED;
		if(checkoutInfo.step == 'payment') eventName = eventNames.PAYMENT_INFO_VIEWED;

		var data = {};
		data.checkoutId = checkoutInfo.cartId;
		var productData = makeProducts(md.itemList, 'checkout');

		if( isSnkrs ){
			$.extend( data, productData[0]);
		} else {
			data.products = productData;
		}

		return data;
	}
	function getOrderConfirmationData(){
		pageType = 'checkout';
		eventName = eventNames.ORDER_CONFIRMATION_VIEWED;
		classification = classifications.CORE_BUY_FLOW;
		var data = {};
		data.discount = md.orderDiscount;
		data.checkoutId = md.orderId;
		if (!isProd) {
			data.orderId = md.orderNumber;
		}
		data.paymentsConcatenated = 'creditcard:not stored | giftcard:not stored'; // TODO MASTERCARD:not stored
		data.payments = [{
			paymentType : (function(){
				return md.payment_method_detail != '기타' ? 'creditcard' : 'etc' /// TODO MASTERCARD
			}()),
			"stored": false
		}]
		
		var productData = makeProducts(md.itemList, 'checkout');
		if( isSnkrs ){
			data.isExclusiveAccess = false; // TODO
			$.extend( data, productData[0]);
		} else {
			data.products = productData;
		}
		if( md.promoList != null ){
			data.promoCode = String($.map(md.promoList, function(item){ return  item.name } ).join('|'));
		}
		var isSameDayShipping = ($('[data-sameday-price]').length !== 0);
		data.shipping = getShippingInfo(isSameDayShipping);
		data.tax = md.orderTaxAmount;
		data.total = md.orderTotalAmount;

		return data;
	}
	function getWishListData(){
		pageType = 'favorites';
		eventName = eventNames.WISHLIST_VIEWED;
		classification = classifications.EXPERIENCE;
		var data = {};
		data.wishlistId = 'none';
		data.wishlistName = 'Default List';
		data.products = makeProducts(md.itemList, 'cart');
		return data;
	}
	function getRegisterData(){
		pageType = 'landing page';
		eventName = eventNames.PAGE_VIEWED;
		classification = classifications.EXPERIENCE;
		var data = {};
		data.event = experienceType + '>guest>register';
		data.interactionType = 'load';
		return data;
	}
	function getRegisterSuccessData(type){
		pageType = type;
		eventName = eventNames.ACCOUNT_CREATED;
		classification = classifications.CORE_BUY_FLOW;
	}
	function makeProducts( itemList, type ){
		var products = [];
		try{
			$.each( itemList, function( index, productData ){
				var isPw = (type == 'pw');
				var isPdp = (type == 'pdp');
				var isCart = (type == 'cart');
				var isCheackout = (type == 'checkout');

				if( isPw && productData.hasOwnProperty('position')){
					products.push( {position : productData.position });
					return;
				}

				var gid = String(productData.gid || null);
				if( gid == '-99999999' || gid == 'null') gid = null;
				var product = {
					cloudProductId: null,
					name: String(productData.name),
					price: Number(productData.price) || Number(productData.retailPrice),
					prodigyProductId: gid,
					productId: gid
				}
				product.priceStatus = ( product.price < productData.retailPrice ) ? 'clearance' : 'regular';
				
				if( isPw || isCheackout ) {
					product.position = index+1;
				} 

				if( isPdp || isCart || isCheackout ){
					product.brand = 'Nike'; // TODO NikeNike Sportswear, Jordan
				}

				if( isPdp || isCheackout ){
					product.isMembershipExclusive = productData.isMemberOnly;
				}
				
				if( isPdp ){
					product.quantity = 1; // TODO 구매 제한 수량을 봐야함
					if( !isSnkrs ){
						// TODO low, medium, high, out of stock
						product.inventoryLevel = productData.isSoldOut ? 'out of stock' : 'low';
						// TODO in stock, out of stock, coming soon, preorder
						product.inventoryStatus = productData.isSoldOut ? 'out of stock' : ( productData.isUpcoming ? 'coming soon' : 'in stock' ); 
						product.isReserveNow = false;
						product.publishType = 'flow'; //TODO launch, flow
						try {
							product.reviewAverage = (function(){
								var average = Number(productData.reviewInfo.totalRatingAvg)/20;
								return Number(average.toFixed(1));
							}())
							product.reviewCount = Number(productData.reviewInfo.totalRatingCount);
						} catch (error) {
							product.reviewAverage = 0.0;
							product.reviewCount = 0;
						}
						
					}else{
						launchType = 'buy'  //TODO buy, line
					}

				}

				if( isCart || isCheackout ){
					product.sku = productData.skuId || 'none';
					product.productType = (function(){ // TODO
						switch (productData.bu || '') {
							case 'FW':
								return 'FOOTWEAR';
							case 'AP':
								return 'APPAREL';
							case 'EQ':
								return 'EQUIPMENT';
							default:
								return '';
						}
					}()); // TODO  FOOTWEAR APPAREL EQUIPMENT
					product.quantity = Number(productData.quantity || 1);
					product.styleColor = productData.model;
				}

				if( isCheackout ) {
					product.size = (function(){
						var size = '';
						if(productData.option != null && productData.option.length > 0){
							try{
								for( var key in productData.option[0] ){
									size = productData.option[0][key];
								}
							}catch(e){console.log(e);}
						}
						return size;
					}())
					product.styleType = "INLINE" // TODO
					product.subtitle = 'none' // TODO
				} 
				products.push( product );
			});
		}catch (error) { 
			console.log(error);
		}
		return products;
	}
	function getShippingInfo(isSameDay){
		var isBopis = ((_GLOBAL.MARKETING_DATA().ctm_order_type || '') == 'BOPIS');
		return {
			availableOptions: shippingOptions,
			cost: (isSameDay==true) ? 5000 :  0,
			method : (isSameDay==true) ? 'SAMEDAY' : (isBopis ? 'BOPIS' : 'SHIP'),
			selectedOption: (isSameDay==true) ? shippingOptions[1] : shippingOptions[0]
		};
	}
	function getPageOptions(dataLayer){
		log('eventName: ', dataLayer.eventName)
		log('eventType: ', dataLayer.eventType)
		var schemaId = schemaIds[dataLayer.eventName];
		var experience = schemaId.experience;

		// 같은 이름의 이벤트 네임을 사용하는 경우가 있어 억지로 분기 처리...
		if (dataLayer.eventName == eventNames.SEARCH_SUBMITTED && dataLayer.searchType == null) {
			experience = 'store-locator';
		}
		var schemaUrl = getSchemaUrl(schemaId.eventName, dataLayer.eventType, experience, schemaId.isCoreBuyFlow);
		return {'writeKey' : _GLOBAL.SITE.GLOBAL_ADOBE_WRITEKEY || WRITE_KEY.STG, '$schema' : schemaUrl}
	}
	function getPageName(type, detail){
		// pageNameSelector
		// experience type>page type>page detail
		var name = experienceType + '>' + type + ((detail != '') ? '>' + detail : '');
		if( md.pageType == 'register' && type == 'landing page'){
			name = experienceType + '>membership:land'; 
		}
		return name;
	}
	function getPageType(){
		// analyticsPageTypeSelector
		// homepage, pdp, pw, landing page
		switch (pageType) {
			case 'pw':
				if(md.pageType == 'search'){
					return 'onsite search'; //( dl.searchResultsCount > 0) ? 'onsite search' : 'no onsite search';
				}
			break;
		}
		return pageType;
	}
	function getSchemaExperienceType(){
		// 같은 이벤트 타입인데 experience 값이 변경되야 하는 상황에서 사용
		switch (pageType) {
			case 'homepage':
				return 'landing-page'
			break;
			case 'pw':
				if(md.pageType == 'search'){
					return 'onsite search'; //( dl.searchResultsCount > 0) ? 'onsite search' : 'no onsite search';
				}
			break;
			case 'favorites':
				return 'wishlist';
			break;
		}
		return pageType;
	}
	function getPageDetail(event){
		/*
			pageDetail: "men_shoes_new releases"
			pageName: "nikecom>pw>men_shoes_new releases"
		*/
		var detail = '';
		switch (pageType) {
			case 'pw':
				if( md.pageType == 'category'){
					detail = dl.selectedConcepts.join('_');
				}else if(md.pageType == 'search'){
					detail = ( dl.searchResultsCount > 0 ) ? 'results found' : 'no search results';
				}
			break;
			case 'pdp':
				detail = dl.name;
			break;
			case 'cart': case 'favorites':
				detail = 'view';
			break;
			case 'checkout':
				if( md.pageType == 'confirmation'){
					detail = 'order confirmation';
				}else{
					detail = md.marketingData.checkoutInfo.step;
				}
			case 'myorders':
				switch (md.pageType) {
					case 'orderDetail':
						detail = 'order details';
					break;
					case 'orderHistory':
						detail = 'order history';
					break;
					case 'orderReturnable':
						detail = 'return items';
					break;
					case 'orderReturned':
						detail = 'return items';
					break;
				}
				if( event == eventNames.ORDER_CANCELLATION_SUCCESS_VIEWED ){
					detail = 'cancel order>success';
				}
				if( event == eventNames.ORDER_CANCELLATION_FAILURE_VIEWED ){
					detail = 'cancel order>failed';
				}
				if( event == eventNames.RETURN_ITEM_CLICKED ){
					detail = 'order details';
				}
			break;
			case 'store locator':
				if( event == eventNames.NOT_FOUND_VIEWED ){
					detail = 'not found';
				}
			break;
			case 'story':
				detail = 'story';
			break;
		}
		return detail;
	}
	function getClassification(){
		return classification == '' ? classifications.EXPERIENCE : classification;
	}
	function getClickActivity(){
		//pw:add:category:jordan
		return '';
	}
	function getCheckoutType(){
		//registered|guest|member|paypal
		return _GLOBAL.CUSTOMER.ISSIGNIN ? 'registered' : 'guest';
	}
	function getPreviousView(){
		return JSON.parse(sessionStorage.getItem('previousViewData')) || undefined;
	}
	function getPageData(eventType, eventName, clickActivity, classification){
		var data = {};
		data.app = {
			'backendPlatform': 'cloud',
			'domain': 'www.nike.com',
			'version': '1.0.0'
		},
		data.consumer = {
			loginStatus : _GLOBAL.CUSTOMER.ISSIGNIN ? 'logged in' : 'not logged in',
			upmId : 'guest' //_GLOBAL.CUSTOMER.ISSIGNIN ? 'none' : 'guest'
		}
		if( !isProd ){
			data.consumer.koreaId = String(_GLOBAL.CUSTOMER.ID);
		}
		data.view = {
			experienceType: experienceType,
			pageType: getPageType(),
			pageDetail : getPageDetail(eventName)			
		},
		data.view.pageName = getPageName(data.view.pageType, data.view.pageDetail);
		data.currency = currencyType;
		data.eventName = eventName;
		data.eventType = eventType,
		data.language = language;
		data.locale = { language: 'ko-KR', country: 'kr'},
		data.classification = (classification != null) ? classification : getClassification();
		data.video = undefined;
		data.abTest = undefined;
		data.clickActivity = (clickActivity != null) ? clickActivity : getClickActivity();
		data.previousView = getPreviousView();

		sessionStorage.setItem('previousViewData', JSON.stringify({ pageType: data.view.pageType, pageName: data.view.pageName }));
		
		return data;
	}
	function submitDataLayer(dataLayer){
		log('name: ', dataLayer.eventName);
		log('dataLayer: ', dataLayer);
		try {
			var options = getPageOptions(dataLayer);
			if(dataLayer.eventType == eventTypes.PAGE){
				analyticsClient.page(dataLayer.view.pageName, dataLayer, options);
			}else{
				analyticsClient.track(dataLayer.eventName, dataLayer, options);
			}
		} catch (error) {
			console.warn(error);
		}
		log('------------');
	}
	function addEvent(){
		var endPoint = Core.getComponents('component_endpoint');
		// 기본 클릭 이벤트
		endPoint.addEvent('clickEventHandler', clickEvent );
		// 필터 선택하여 상품 리스트 변경 시
		endPoint.addEvent('updateCategoryListByFiltered', updateCategoryListByFilteredEvent );
		// 필터 적용
		endPoint.addEvent('applyFilter', function(param){ 
			filtered = { type : 'add', item : param };
			applyFilter(param);
		})
		// 필터 삭제
		endPoint.addEvent('removeFilter', function(param){ 
			filtered = { type : 'remove', item : param };
			applyFilter(param);
		})
		// 로그인 성공
		endPoint.addEvent('loginSuccess', function(){
			var type = getPageType();
			if( type == 'cart' || type == 'checkout' ){
				sessionStorage.setItem('loginSuccess', true);
			}
		});
		// 장바구니 삭제
		endPoint.addEvent('removeFromCart', function(param){
			cartProductUpdateEvent(param);
		});
		//장바구니 수정
		endPoint.addEvent('cartAddQuantity', function(param){
			cartProductUpdateEvent(param, true);
		});
		// 장바구니 담기
		endPoint.addEvent('addToCart', function(param){
			pdpAddToCartEvent( param );
		} );
		// 장바구니 담기 실패
		endPoint.addEvent('addToCartFail', function(param){
			pdpAddToCartEvent( param, true );
		} );
		// 그리드 상품 클릭
		endPoint.addEvent('pwProductClick', function(param){
			if(param.isSnkrsStory == true){
				snkrsStoryTrackEvent(eventNames.STORY_CLICKED, 'snkrs:feed:stories tap');
			}else{
				pwProductClickEvent(param);
			}
		});
		// 추천검색어 클릭
		endPoint.addEvent('searchPopularSuggestionClick', function(param){
			callSearchEvent(eventNames.SEARCH_POPULAR_SUGGESTION_CLICKED, 'popular term', param.searchText);
		} );
		// 검색어 자동완성 클릭
		endPoint.addEvent('searchTypeaheadClick', function(param){
			callSearchEvent(eventNames.SEARCH_TYPEAHEAD_CLICKED, 'typeahead', param.searchText);
		} );
		// 검색어 직접 입력
		endPoint.addEvent('searchSubmitted', function(param){
			callSearchEvent(eventNames.SEARCH_SUBMITTED, 'user typed', param.searchText);
		} );
		//카테고리 필터on/off(와이드뷰) 클릭시
		endPoint.addEvent('wideToggleClick', filterMenuToggleEvent);
		// 재입고 알림 완료
		endPoint.addEvent('notifymeSubmitted', function(){
			callNodifymeEvent(eventNames.NOTIFY_ME_SUBMITTED, 'pdp:notify me submitted');
		});
		// 신청 후 재입고 알림 창 닫침
		endPoint.addEvent('notifymeModalClose', function(){
			callNodifymeEvent(eventNames.NOTIFY_ME_DISMISSED, 'pdp:notify me dismissed');
		});
		// 리뷰 작성시
		endPoint.addEvent('writeReview', function(param){
			callPdpTrackEvent( eventNames.PRODUCT_SAVED, 'pdp:review submitted', { rating : param.starCount });
		});
		// wishlist 등록시
		endPoint.addEvent('addToWishlist', function(data){
			//callPdpTrackEvent( eventNames.PRODUCT_SAVED, getPageType()+':product saved');
			callWishlistTrackEvent(eventNames.PRODUCT_SAVED, 'product saved', data.index);
		});
		// wishlist 제거시
		endPoint.addEvent('removeToWishlist', function(data){
			//callPdpTrackEvent( eventNames.PRODUCT_UNSAVED, getPageType()+':product unsaved');
			callWishlistTrackEvent(eventNames.PRODUCT_UNSAVED, 'product unsaved', data.index);
		});
		// 상품 옵션 선택시
		endPoint.addEvent('pdpOptionClick', function(param){
			if( md.pageType == 'wishlist') return;
			callPdpTrackEvent( eventNames.PRODUCT_SIZE_SELECTED, 'size selection: ' + param.value);
		});
		// 상품 이미지 줌
		endPoint.addEvent('pdpImageZoom', function(){
			callPdpTrackEvent( eventNames.PRODUCT_ZOOMED, 'product zoom');
		});
		// 상품 이미지 줌
		endPoint.addEvent('pdpImageZoomClose', function(){
			callPdpTrackEvent( eventNames.PRODUCT_ZOOM_CLOSED, 'pdp:product zoom closed');
		});
		// 연관 상품 클릭
		endPoint.addEvent('crossSaleClick', function(param){
			switch( md.pageType ){
				case 'product' :
					callPdpTrackEvent( eventNames.RECOMMENDED_PRODUCT_SELECTED, 'pdp: recommended product selected:' + param.index);
				break; 
				case 'cart' :
					var data = getPageData(eventTypes.TRACK, eventNames.RECOMMENDED_PRODUCT_CLICKED);
					data.modelVariant = 'none';
					data.cartId = md.cartId;
					submitDataLayer(data);;
				break;
			}
		});
		// 프로모코드 등록
		endPoint.addEvent('applyPromoCode', callPromoEvent);
		// 결제하기 클릭
		endPoint.addEvent('checkoutSubmit', checkoutSubmitEvent);
		// 결제 에러시
		endPoint.addEvent('paymentError', function(param){
			callCheckoutTrackEvent(eventNames.ERROR_MODAL_VIEWED, null, { errorCode : param.message });
		});
		// 비회원 구매시 기존 회원과 동일한 정보일 때 노출되는 팝업
		endPoint.addEvent('openAlreadyRegistered', function(){
			callCheckoutTrackEvent(eventNames.LOGIN_PROMPT_VIEWED);
		});
		// 배송주소 검색하여 선택시
		endPoint.addEvent('shippingAddressSelect', function(){
			callCheckoutTrackEvent(eventNames.ADDRESS_SUGGESTION_SELECTED);
		});
		// 결제 수단 선택 시
		endPoint.addEvent('changePaymentMethod', function(data){
			var type = Core.utils.string.toLower(data.paymentType).split('_').join(''); 
			callCheckoutTrackEvent(eventNames.PAYMENT_METHOD_SELECTED,'payment method :'+ type );
		});
		// 주문서 배송지 목록에서 주소 선택시
		endPoint.addEvent('changeShippingAddress', function(data){
			callCheckoutTrackEvent(eventNames.SHIPPING_ADDRESS_SELECTED, 'shipping methods');
		});
		// ShippingInfoForm 작성 완료시
		endPoint.addEvent('submitShippingInfoForm', function(data){
			callCheckoutTrackEvent(eventNames.SHIPPING_METHOD_SELECTED, null, { shipping : getShippingInfo(data.isSameDay) });
		});
		// 배송지 주소 변경시
		endPoint.addEvent('changeShippingType', function(data){
			callCheckoutTrackEvent(eventNames.SHIPPING_OPTION_SELECTED, null, { 
				shipping : { 
					selectedOption : (data.shippingType == 'default') ? shippingOptions[0] : shippingOptions[1]
				}
			});
		});
		// 반품 신청 클릭하여 주문 오픈시
		endPoint.addEvent('openReturnRequestOrder', function(data){
			submitDataLayer(getPageData(eventTypes.PAGE, eventNames.RETURN_ITEM_CLICKED));
		});
		// 반품 이유 변경시
		endPoint.addEvent('changeReturnReason', function(data){
			submitDataLayer(getPageData(eventTypes.TRACK, eventNames.RETURN_REASON_CLICKED));
		});
		// 주문 취소 완료시
		endPoint.addEvent('orderCancelSuccess', function(data){
			submitDataLayer(getPageData(eventTypes.PAGE, eventNames.ORDER_CANCELLATION_SUCCESS_VIEWED));
		});
		// 주문 취소 실패시
		endPoint.addEvent('orderCancelFail', function(data){
			submitDataLayer(getPageData(eventTypes.PAGE, eventNames.ORDER_CANCELLATION_FAILURE_VIEWED));
		});
		// 검색된 store 클릭시
		endPoint.addEvent('selectStoreItem', function(data){
			var markerName = 'sl:map marker:'+data.name;
			submitDataLayer(getPageData(eventTypes.TRACK, eventNames.MAP_MARKER_CLICKED, markerName));
		});
		// store 검색
		// 검색 후 페이지 이동 된 후 호출하는 것으로 타이밍 변경
		/*
		endPoint.addEvent('searchStore', function(data){
			submitDataLayer(getPageData(eventTypes.TRACK, eventNames.SEARCH_SUBMITTED, 'sl:search submitted'));
		});
		*/
		endPoint.addEvent('snkrsMobileSwipeIndex', function(param){
			if(param.SNKRS_mobile_swipe_type == 'swipe'){
				snkrsStoryTrackEvent(eventNames.SIDE_STORY_CLICKED, 'snkrs:stories:tap' + param.swipe_direction);
			}
		})
		// PDP 에서 바로구매 시
		endPoint.addEvent('buyNow', function(param){
			var data = getPageData(eventTypes.TRACK, eventNames.BUY_NOW_CLICKED, 'pdp: buy now', classifications.EXPERIENCE);
			var productData = makeProducts([md.productInfo], 'pdp');
			data.isReserveNow = false;
			data.estimatedDeliveryDate = 'none';
			productData[0].sku = param.skuId;
			productData[0].quantity = param.quantityAdded;
			data.products = productData;
			submitDataLayer(data);
		})

		try {
			$.each(videojs.getAllPlayers(), function(index, player){
				player.ready(function() {
					if( player.tagAttributes['data-video-id'] == null ){
						return;
					}
					var targetPlayer = this.player();
					targetPlayer.videoId = player.tagAttributes['data-video-id'];
					targetPlayer._isShowTextTrack = false;
					targetPlayer.isShowTextTrack = (function(){ return targetPlayer._isShowTextTrack; });
					targetPlayer.on('loadeddata', function() {
						targetPlayer.on('texttrackchange', function(event) {
							this._isShowTextTrack = !this._isShowTextTrack;
							callVideoEvent(this, 'texttrackchange');
						});
					});
					targetPlayer.on('fullscreenchange', function() {
						callVideoEvent(this, 'fullscreenchange');
					});
					targetPlayer.on('play', function() {
						callVideoEvent(this, 'play');
					});
					targetPlayer.on('pause', function() {
						callVideoEvent(this, 'pause');
					});
					targetPlayer.on('seeking', function() {
						callVideoEvent(this, 'seeking');
					});
					targetPlayer.on('volumechange', function() {
						callVideoEvent(this, 'volumechange');
					});
				});
			})
		} catch (error) {}
		
		var $videos = $('video');
		$videos.each(function(index, video){
			if( $(this).find('source').length == 0 || $(this).data('video-id') == null ){
				return;
			}
			var targetPlayer = video;
			targetPlayer.videoId = String($(this).data('video-id'));
			targetPlayer.isShowTextTrack = false;
			targetPlayer.isFullscreen = false;
			targetPlayer.status = 'pause';
            targetPlayer.addEventListener('playing', function(){
				callVideoEventByMp4Type(this, 'play');
            })
            targetPlayer.addEventListener('volumechange', function(){
				callVideoEventByMp4Type(this, 'volumechange');
            })
			targetPlayer.addEventListener('seeking', function(){
				callVideoEventByMp4Type(this, 'seeking');
            })
			targetPlayer.addEventListener('pause', function(){
				callVideoEventByMp4Type(this, 'pause');
            })
			targetPlayer.addEventListener('timeupdate', function(){
				if(this.loop == true && this.status != 'ended'){
					if( Math.floor(this.currentTime) === Math.floor(this.duration) ){
						callVideoEventByMp4Type(this, 'ended');
					}
				}
			})
			setInterval(function(){
				if( document.fullscreenElement == null ){
					if(targetPlayer.isFullscreen == true ){
						// 풀스크린 해제
						targetPlayer.isFullscreen = false;
						callVideoEventByMp4Type(targetPlayer, 'fullscreenchange');
					}
				}else{
					if( targetPlayer.videoId == $(document.fullscreenElement).data('video-id')){
						if(targetPlayer.isFullscreen == false ){
							// 풀스크린
							targetPlayer.isFullscreen = true;
							callVideoEventByMp4Type(targetPlayer, 'fullscreenchange');
						}
					}
				}
			}, 300)
		})
	}
	function callVideoEvent(player, eventType){
		var targetPlayer = player;
		var videoData = {
			videoId : player.videoId,
			autoplay : !!player.autoplay(),
			currentTime : Math.floor(player.currentTime()),
			duration : Math.floor(player?.mediainfo?.duration),	
			loop : player.loop(),
			sound : !player.muted(),
			fullScreen : player.isFullscreen(), 
			subtitles : player.isShowTextTrack()
		}
		var eventName = getVideoEventName(targetPlayer, eventType);
		var data = getPageData(eventTypes.TRACK, eventName, null, classifications.EXPERIENCE);
		data.video = videoData;
		submitDataLayer(data);
	}
	function getVideoEventName(player, eventType){
		switch (eventType) {
			case 'volumechange':
				return player.muted()
					? eventNames.VIDEO_MUTED
					: eventNames.VIDEO_UNMUTED;
			case 'play':
				return player.currentTime() < 0.5
					? eventNames.VIDEO_STARTED
					: eventNames.VIDEO_PLAYED;
			case 'pause':
				return player.currentTime() === player.duration()
					? eventNames.VIDEO_ENDED
					: eventNames.VIDEO_PAUSED;
			case 'seeking':
				return player.currentTime() === 0
					? eventNames.VIDEO_RESTARTED
					: eventNames.VIDEO_REWOUND;
			case 'fullscreenchange':
				return player.isFullscreen()
					? eventNames.VIDEO_ENTERED_FULLSCREEN
					: eventNames.VIDEO_EXITED_FULLSCREEN;
			case 'texttrackchange':
				return player.isShowTextTrack()
					? eventNames.VIDEO_SUBTITLES_ON
					: eventNames.VIDEO_SUBTITLES_OFF;
			default:
			return false;
		}
	}
	function callVideoEventByMp4Type(player, eventType){
		var targetPlayer = player;
		player.status = eventType;
		var videoData = {
			videoId : player.videoId,
			autoplay : !!player.autoplay,
			currentTime : Math.floor(player.currentTime),
			duration : Math.floor(player.duration),	
			loop : player.loop,
			sound : !player.muted,
			fullScreen : player.isFullscreen, 
			subtitles : player.isShowTextTrack
		}
		var eventName = getVideoEventNameByMp4Type(targetPlayer, eventType);
		var data = getPageData(eventTypes.TRACK, eventName, null, classifications.EXPERIENCE);
		data.video = videoData;
		submitDataLayer(data);
	}
	function getVideoEventNameByMp4Type(player, eventType){
		switch (eventType) {
			case 'volumechange':
				return player.muted
					? eventNames.VIDEO_MUTED
					: eventNames.VIDEO_UNMUTED;
			case 'play':
				return player.currentTime < 0.5
					? eventNames.VIDEO_STARTED
					: eventNames.VIDEO_PLAYED;
			case 'pause':
				return Math.floor(player.currentTime) === Math.floor(player.duration)
					? eventNames.VIDEO_ENDED
					: eventNames.VIDEO_PAUSED;
			case 'ended':
				return eventNames.VIDEO_ENDED;
			case 'seeking':
				return player.currentTime === 0
					? eventNames.VIDEO_RESTARTED
					: eventNames.VIDEO_REWOUND;
			case 'fullscreenchange':
				return player.isFullscreen
					? eventNames.VIDEO_ENTERED_FULLSCREEN
					: eventNames.VIDEO_EXITED_FULLSCREEN;
			case 'texttrackchange':
				return player.isShowTextTrack
					? eventNames.VIDEO_SUBTITLES_ON
					: eventNames.VIDEO_SUBTITLES_OFF;
			default:
			return false;
		}
	}
	function clickEvent(param){
		var experience = param.area;
		var eventName = param.name;
		var clickActivity = param.activity;
		var eventType = eventTypes.TRACK;
		var activeDetail = '';
		classification = classifications.EXPERIENCE;
		var customData = null;
		switch (param.area) {
			case 'global-nav':
				eventName = 'Nav ' + param.name + ' Clicked';
				if( param.name == 'Footer' ){
					activeDetail = 'footer:'
				}
				if( param.name == 'Shopping Menu' ){
					if( clickActivity != 'menu open' ){
						activeDetail = 'shop>';
					}
				}
				if( param.name == 'Membership' && param.activity == 'join'){
					if( md.pageType == 'cart' ){
						sessionStorage.setItem('checkRegistStartPage', 'cart');
					}
				}
				if( param.name == 'Account' ){
					activeDetail = 'myAccount:'
				}
				clickActivity = 'nav:' + activeDetail + param.activity;
			break;
			case 'global-banner':
				eventName = param.name + ' Clicked';
				clickActivity = getPageType()+':banner clicked:' + param.activity;
				experience = getSchemaExperienceType();
			break;
			case 'cms-content':
				eventName = param.name + ' Clicked';
				experience = getSchemaExperienceType();
			break;
		}
		
		setSchemaId(eventName, experience, false);
		submitDataLayer((customData == null ) ? getPageData(eventType, eventName, clickActivity) : customData);
		/*
		var schemaData = {
			'eventName' : eventName, 
			'experience' : experience,
			'isCoreBuyFlow' : false
		}
		submitDataLayer($.extend( getPageData(eventType, eventName, clickActivity), {schemaData: schemaData}));
		*/
	}
	function callPromoEvent(param){
		var eventName = (param.promoAdded == true) ? eventNames.PROMO_CODE_APPLIED : eventNames.PROMO_CODE_REJECTED;
		var data = getPageData(eventTypes.TRACK, eventName);
		if( md.pageType == 'cart'){
			data.cartId = md.cartId;
		}
		if(param.promoAdded == true){
			data.discount = 0; //TODO 할인된 가격은 없음
		}else{
			data.errers = [{
				code : param.exceptionKey
			}]
  			data.reason = data.exception;
		}
		data.promoCode = param.promoCode;
		data.products = makeProducts(md.itemList, 'cart');
		submitDataLayer(data);
	}
	function callSearchEvent(eventName, searchType, searchTerm){
		var data = getPageData(eventTypes.TRACK, eventName, null, classifications.EXPERIENCE);
		data.searchTerm = searchTerm;
		data.searchType = searchType;
		data.searchTermType = searchType + ':' + searchTerm;
		submitDataLayer(data);
	}
	function callNodifymeEvent(eventName, clickActivity){
		submitDataLayer( getPageData(eventTypes.TRACK, eventName, clickActivity, classifications.EXPERIENCE) );
	}
	function callPdpTrackEvent(eventName, clickActivity, options){
		var data = getPageData(eventTypes.TRACK, eventName, clickActivity, classifications.EXPERIENCE);
		if( options != null ){
			$.extend(data, options);
		} 
		var product = null;
		if( md.isProduct){
			product = md.productInfo;
		}else{
			var index = sessionStorage.getItem('selectedUpdateProductIndex');
			try {
				product = md.itemList[index-1];
			} catch (error) {}
		}
		data.products = makeProducts([product], 'pdp');
		submitDataLayer(data);
	}
	function callWishlistTrackEvent(eventName, clickActivity, index){
		var type = getPageType();
		var data = getPageData(eventTypes.TRACK, eventName, type + ':' + clickActivity, null, classifications.EXPERIENCE);
		if( md.pageType == 'product'){
			data.products = makeProducts([md.productInfo], 'pdp');
		}else{
			if( index != null ){
				var products = makeProducts(md.itemList, 'cart');
				data.wishlistId = 'none';
				data.wishlistItemId = 'none';
				data.wishlistName = 'Default List';
				$.extend( data, products[Number(index)-1]);
			}
		}
		submitDataLayer(data);
	}
	function callCheckoutTrackEvent(eventName, clickActivity, options){
		var data = $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventName, clickActivity, classifications.EXPERIENCE));
		if( options != null ){
			$.extend(data, options);
		} 
		submitDataLayer(data);
	}
	function checkoutSubmitEvent(param){
		var data = getPageData(eventTypes.TRACK, eventNames.CHECKOUT_INTENT_START, null, classifications.CORE_BUY_FLOW);
		data.checkoutType = getCheckoutType();
		submitDataLayer(data);
	}
	function filterMenuToggleEvent(param){
		var data = getPageData(eventTypes.TRACK, eventNames.FILTER_MENU_TOGGLED, 'filter-menu:' + ((param=='on') ? 'hidden' : 'shown'), classifications.EXPERIENCE);
		submitDataLayer(data);
	}
	function applyFilter(param){
		var data = $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventNames.FILTER_APPLIED, 'pw:filter-applied:' + param.key + ':' + param.value, classifications.EXPERIENCE));
		data.filter = {
			detail: param.value,
			group: param.key
		}
		submitDataLayer(data);
	}
	function updateCategoryListByFilteredEvent(param){
		// if( param.isPageLoad ) return;
		md = _GLOBAL.MARKETING_DATA();
		$.extend(dl, getCategoryData()); // 필터로 인하여 바뀐 상품 정보를 다시 적용
		var data = $.extend( _.cloneDeep(dl), getCategoryFilteredData());
		submitDataLayer( $.extend( data, getPageData(eventTypes.PAGE, eventNames.PRODUCT_LIST_FILTERED, null, classifications.CORE_BUY_FLOW)));
		submitDataLayer( $.extend( data, getPageData(eventTypes.TRACK, eventNames.PRODUCT_LIST_FILTERED, null, classifications.CORE_BUY_FLOW)));
	}
	function cartProductUpdateEvent(param, isUpdate){
		// selectedUpdateProductIndex 옵션 변경 하기 위해 선택한 상품 index 번호
		md = _GLOBAL.MARKETING_DATA();
		pageType = 'cart';
		var data = getPageData(eventTypes.TRACK, eventNames.PRODUCT_REMOVED, null, classifications.CORE_BUY_FLOW);
		var products = makeProducts(md.itemList, 'cart');
		var index = (isUpdate == true) ? sessionStorage.getItem('selectedUpdateProductIndex') : param.index;
		if( index != null ){
			index = Number(index) - 1;
			data.products = [products[index]];
			$.extend(data, products[index]);
		}
		data.cartId = md.cartId;
		data.quantity = 1;
		submitDataLayer(data);

		// 수정하는 상황이면 삭제 이후에 add도 바로 실행
		if( isUpdate == true ) {
			eventName = eventNames.PRODUCT_ADDED;
			data.eventName = eventName;
			submitDataLayer(data);
			sessionStorage.removeItem('selectedUpdateProductIndex');
		}
	}
	function pdpAddToCartEvent(param, isFailed){
		// 상품을 담고 바로 장바구니 삭제를 하면 pageType이 바뀌는 상황이 생겨 다시 한번 적용
		var isWishlist = md.pageType == 'wishlist';
		var index = sessionStorage.getItem('selectedAddProductIndex');
		var eventName = eventNames.PRODUCT_ADDED;
		var clickActivity = null;
		classification = classifications.CORE_BUY_FLOW;

		if( isFailed ){
			eventName = eventNames.PRODUCT_ADDED_ERROR_VIEWED;
			classification = classifications.EXPERIENCE;
			clickActivity = 'failed to add to cart';
		}

		if( isWishlist ){ pageType = 'favorites' };
		var data = $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventName, clickActivity));

		if( isWishlist ){
			if( index != null ){
				var products = makeProducts(md.itemList, 'cart');
				index = Number(index) - 1;
				data.products = products[index];
				$.extend(data, data.products);
				sessionStorage.removeItem('selectedAddProductIndex');
			}
		}else{
			data.sku =  param.skuId;
			data.products[0]['sku'] = param.skuId;
			data.sizeSuggestion = 'none';
			data.estimatedDeliveryDate = 'none';
		}
		submitDataLayer(data);
	}
	function pwProductClickEvent(param){
		md = _GLOBAL.MARKETING_DATA();
		var data = $.extend( _.cloneDeep(dl), getPageData(eventTypes.TRACK, eventNames.PRODUCT_CLICKED, 'pw:product clicked', classifications.CORE_BUY_FLOW));
		var badgeLabel = '';
		if(param.badge != null){
			badgeLabel = Core.utils.string.toUpper(Core.utils.string.trim(param.badge).split(' ').join('_'));
			//customize, SUSTAINABLE_MATERIALS, SNKRS_COMING_SOON, SOLDOUT,
			//Customize, 친환경 소재, 출시 예정
			switch(Core.utils.string.trim(param.badge)){
				case '출시 예정':
					badgeLabel = 'COMING_SOON';
				break;
				case 'Launching in SNKRS':
					badgeLabel = 'SNKRS_COMING_SOON';
				break;
				case 'Customize':
					badgeLabel = 'CUSTOMIZE';
				break;
				case '품절':
					badgeLabel = 'SOLDOUT';
				break;
				case '친환경 소재':
					badgeLabel = 'SUSTAINABLE_MATERIALS';
				break;
			}
		}
		if( badgeLabel != ''){
			data.badgeLabel = badgeLabel;
		}
		delete data.product;
		var products = makeProducts(md.itemList, 'pw');
		$.extend(data, products[param.grid_wall_rank-1]);
		submitDataLayer(data);
	}
	function snkrsStoryTrackEvent(eventName, clickActivity){
		pageType = 'story';
		var data = getPageData(eventTypes.TRACK, eventName, clickActivity, classifications.EXPERIENCE);
		submitDataLayer(data);
	}

	function log(msg, data){
		if(!isProd){
			if( data ){
				if( typeof data != 'object'){
					console.log(msg + data);
				}else{
					console.log(msg);
					console.log(data);
				}
			}else{
				console.log(msg);
			}
		}
	}
	Core.gaa = {
		init : function(){
			init();
			addEvent();
		}
	}

})(Core);
(function(Core){
	Core.register('module_refund_account', function(sandbox){
		var serialize = function($form){
			//jquery에 있는 serialize가 한글을 escape 치리가 되어 처리 안되게 따로 만듬;
			var inputs = $form.find('input[type=hidden]');
			var queryParams = {};
			for(var i=0; i<inputs.length; i++){
				queryParams[inputs.eq(i).attr('name')] = inputs.eq(i).val();
			}
			return queryParams;
		}
		var Method = {
			$that:null,
			$popModal:null,
			$popSubmitBtn:null,
			$refundAccountInfo:null,
			moduleInit:function(){
				var $this = $(this);
				Method.$that = $this;
				Method.$popModal = UIkit.modal("#popup-refund-account");
				Method.$popSubmitBtn = Method.$popModal.find('[data-refund-account-submit]');
				Method.$refundAccountInfo = Method.$popModal.find('[data-refund-account-info]');

				// 환불 신청 팝업 open
				$this.find('[data-refund-account-btn]').on('click', function(e){
					e.preventDefault();
					Method.openRefundAccountPopup( $(this).closest('form') );
				});

				// 환불 신청 submit
				Method.$popSubmitBtn.on('click', Method.refundAccountSumit );
			},
			openRefundAccountPopup:function($form){
				/*var id = $form.closest('[data-order]').find('[name="id"]').val();
				var amount = $form.closest('[data-order]').find('[name="amount"]').val();*/
				var formData = serialize($form);

				if(formData.hasOwnProperty('account')){
					for(var key in formData){
						if(key === 'amount'){
							Method.$popModal.dialog.find('[data-total-amount]').find('.price').text(sandbox.utils.price(formData[key]));
						}else if(key === 'accountCode'){
							Method.$popModal.dialog.find('select[name="accountCode"]').val(formData[key]);
						}else{
							Method.$popModal.dialog.find('input[name="'+ key +'"]').val(formData[key]);
						}
					}

					sandbox.getComponents('component_textfield', {context:Method.$that}, function(i){
						//초기값에 따라 인풋라벨 초기화
						this.setValueLabel();
					});

					sandbox.getComponents('component_select', {context:Method.$that}, function(i){
						//초기값에 따라 셀랙트박스 리페인팅
						this.rePaintingSelect();
					});

					Method.$popModal.dialog.find('[data-refund-account-submit]').text('수정');
				}

				sandbox.moduleEventInjection(Method.$popModal.dialog.html());
				Method.$popModal.show();

				// 숨겨있는 내용은 init에 처리 되지 않아 show이후
				sandbox.validation.reset( Method.$refundAccountInfo.find('form'));
			},
			refundAccountSumit:function(e){
				e.preventDefault();
				var $refundAccountInfoForm = Method.$refundAccountInfo.find('form');
				sandbox.validation.validate( $refundAccountInfoForm );

				if( !sandbox.validation.isValid( $refundAccountInfoForm )){
					return;
				}

				//전체 form을 체크하여 체크된 아이템 처리
				UIkit.modal.confirm("환불을 요청 하시겠습니까?", function(){
					var accountName = $refundAccountInfoForm.find('[name="accountCode"] option:selected').text();
					$refundAccountInfoForm.find('[name="accountName"]').val(accountName);

					var url = $refundAccountInfoForm.attr('action');
					var method = $refundAccountInfoForm.attr('method');

					Core.Utils.ajax(url, method, $refundAccountInfoForm.serialize(), function(data){
					//Core.Utils.ajax(url + Method.cancelOrderId, "GET", "", function(data){
						var data = sandbox.rtnJson(data.responseText, true);
						var result = data['result'];
						if( result == true ){
							UIkit.modal.alert("환불 요청 되었습니다.").on('hide.uk.modal', function() {
								window.location.reload();
							});
						}else{
							UIkit.modal.alert(data['errorMsg']).on('hide.uk.modal', function() {
								window.location.reload();
							});
						}
					}, true);
				}, function(){},
				{
					labels: {'Ok': '확인', 'Cancel': '취소'}
				});

			}
		}
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-refund-account]',
					attrName:'data-module-refund-account',
					moduleName:'module_refund_account',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	// 전역으로 사용될 기본 변수명
	var md = null;
	var queryString = "";
	dl = {};

	function init(){
		md = _GLOBAL.MARKETING_DATA();
		// context
		md.pathName = md.pathName.replace(_GLOBAL.SITE.CONTEXT_PATH, "");
		queryString = Core.Utils.url.getQueryStringParams( Core.Utils.url.getCurrentUrl());

		// @pck 2021-09-16 소셜 로그인 체크 로직 오류로 새로 로직 생성
		// 소셜로그인, 자동로그인 태깅 부 : NIKE 내부 로그인을 통해 로그인 시 social_type 쿠키 생성, 일반 나이키 회원 로그인의 social_type은 comlogin으로 생성.
		_GLOBAL.CUSTOMER.LOGIN_TYPE = '';
		if(_GLOBAL.CUSTOMER.ISSIGNIN == true){
			_GLOBAL.CUSTOMER.AUTOLOGIN = false;

			//정상 절차대로 로그인 시 처리
			if($.cookie('social_type') !== undefined){
				var socialType = $.cookie('social_type');
				$.removeCookie('social_type');// 1회성 쿠키, 로그인 절차 진행여부 체크 용

				//socialType : //comlogin, social_facebook, social_kakao
				if(socialType != '' || socialType != null){
					_GLOBAL.CUSTOMER.LOGIN_TYPE = socialType;
				}

				//comlogin 세션 유지 중에는 comlogin 상태로 dl에 전달 유지 로직 추가
				sessionStorage.setItem('socialType', socialType);
			}

			//자동 로그인 시 처리
			else{
				_GLOBAL.CUSTOMER.AUTOLOGIN = true;

				var socialType = '';
				if(sessionStorage.getItem('socialType') !== null){
					socialType = sessionStorage.getItem('socialType');
					if(socialType == 'comlogin'){
						_GLOBAL.CUSTOMER.LOGIN_TYPE = "comlogin";
						_GLOBAL.CUSTOMER.AUTOLOGIN = false;
					}
				}

				if (_GLOBAL.CUSTOMER.SOCIAL_PROVIDER_ID != '') { // 세션의 provider id 가 있고 자동로그인이면 소셜 연동 가입 후 바로 로그인된 상황으로 간주
					_GLOBAL.CUSTOMER.LOGIN_TYPE = _GLOBAL.CUSTOMER.SOCIAL_PROVIDER_ID;
				}
			}
		}
	
		// 기본 정보 이외의 추가 정보를 처리해야 하는 타입들
		switch( md.pageType ){
			case "category" :
				$.extend( dl, getCategoryData());
			break;

			case "search" :
				$.extend( dl, getSearchData());
			break;

			case "product" :
				$.extend( dl, getProductData());
			break;

			case "cart" :
				$.extend( dl, getCartData());
			break;

			case "checkout" :
				$.extend( dl, getCheckoutData());
			break;

			case "confirmation" :
				$.extend( dl, getOrderConfirmationData());
			break;

			case "register":
				$.extend( dl, getRegisterStartData());
			break;

			case "registerSuccess":
				if( _GLOBAL.CUSTOMER.ISSIGNIN ){
					$.extend( dl, getRegisterComplateData());
				}
			break;

			case "content":
				//회원탈퇴
				if( md.pathName=="/account/withdrawal" ){
					$.extend( dl, getwithdrawalData());
				}

				//소셜로그인
				// 회원가입을 통해서 넘어오면 중복 호출되기 때문에 제거
				/*
				if( md.pathName=="/social/signup" ){
					$.extend( dl, getRegisterStartData());
				}
				*/

				//로그인, 비밀번호 초기화, 비밀번호 변경
				if( md.pathName=="/login" || md.pathName=="/login/resetPassword" || md.pathName=="/login/forgotPassword"){
					var data = {};
					data.page_type = "login";

					$.extend( dl, data);
				}
				//회원등급
				if( md.pathName=="/account/grade"){
					var data = {};
					data.page_type = "member";

					$.extend( dl, data);
				}

			break;

		}

		// @pck 2021-04-05
		// 세션 Tagging 변수 내 존재하는 값이 있는지 체크 후 있을 경우 가져와서 조립
		var adobeAnalyzerSessionJSON_Object = JSON.parse(sessionStorage.getItem('adobeAnalyzerJSON'));
			if(adobeAnalyzerSessionJSON_Object !== null){

				//검색 결과 페이지
				if(typeof md.searchInfo !== 'undefined'){

					var searchResultCount = (typeof md.searchInfo.totalCount !== 'undefined') ?	md.searchInfo.totalCount : 0;

					//검색 결과가 0일 경우에는
					if(searchResultCount == 0){
						adobeAnalyzerSessionJSON_Object.page_event = {null_search : true};
						adobeAnalyzerSessionJSON_Object.onsite_search_result_page_type = "no result found";
					}
				}

				$.extend( dl, adobeAnalyzerSessionJSON_Object);
				if(sessionStorage.getItem('adobeAnalyzerJSON') !== null){
					sessionStorage.removeItem('adobeAnalyzerJSON'); // tagging용 session변수는 1회성으로 사용, 다른 페이지 영향도 최소화를 위해 수집 후 바로 삭제
				}
			}

		$.extend( dl, getPageData());

		//console.log( dl );
		window._dl = dl;

		$(document).ready( function(){
			$("body").on("click", "[data-click-name]", function(e){
				if ($(this).data("click-enable") == false) {
					return;
				}
				// toggle-on attribute 가 있으면 off 일 때, 즉 닫혀있어서 열리는 상황에 전송한다.
				if (!_.isUndefined($(this).attr('data-click-toggle-on'))) {
					if ($(this).data('click-toggle-on') == 'on'){
						$(this).data('click-toggle-on', 'off');
						return;
					}else{
						$(this).data('click-toggle-on', 'on');
					}
				}
				// toggle-off attribute 가 있으면 on 일 때, 즉 열려있어서 닫히는 상황에 전송한다.
				if (!_.isUndefined($(this).attr('data-click-toggle-off'))) {
					if ($(this).data('click-toggle-off') == 'off') {
						$(this).data('click-toggle-off', 'on');
						return;
					} else {
						$(this).data('click-toggle-off', 'off');
					}
				}
				//e.preventDefault();
				//var target = $(this).attr("target") || '_self';
				//var href = $(this).attr("href");
				var name = $(this).data("click-name");
				var area = $(this).data("click-area");
				var endPoint = Core.getComponents('component_endpoint');
				//console.log(target);
				//console.log(href);
				//console.log(endPoint);
				
				endPoint.call('clickEvent', {area : area, name : name});
			})
		})
	}

	function getorderCancel(){
		data = {};
		data.page_name = "Order Submit Canceled";
		data.page_type = "Order";
		data.link_name = "Order submit canceled";
		data.page_event = {
			order_canceled : true
		}
		$.removeCookie('orderCancel');
		$.removeCookie('orderCancel', { path: '/' });

		//프로모션 코드 쿠키
		$.removeCookie('promoCode', { path: '/kr/ko_kr/confirmation' });
		return data;
	}

	function getPageData(){
		var data = {};
		data.site_app_name = "nikestorekr"; // 고정
		data.page_division = "Commerce";
		data.country 	   = "kr";
		data.language 	   = "ko-KR";
		data.page_name     = getPageName();

		data.site_section    = getSectionL1Data(); // gender : man, women, boy, girls
		data.site_section_l2 = getSectionL2Data();
		data.page_type    	 = getPageTypeData(); //goods, grid wall/ grid wall:PWH  prop17

		data.login_status = _GLOBAL.CUSTOMER.ISSIGNIN ? "logged in" : "not logged in";    //logged in,  not logged in
		data.login_type   = _GLOBAL.CUSTOMER.LOGIN_TYPE;    //소셜로그인 타입 _dl 추가   //comlogin, social_facebook, social_kakao
		data.autologin    = _GLOBAL.CUSTOMER.AUTOLOGIN ? true : _GLOBAL.CUSTOMER.ISSIGNIN ? false : "";    //자동 로그인  _dl 추가

		// AB 테스트 초기 값 none/
		var customerTesterId = 'none';
		if (_GLOBAL.CUSTOMER.USE_PERSONALIZE){
			var cookieValue = $.cookie('abTestingUserGroup');
			var isNoUserGroup = (cookieValue == 'undefined') || (cookieValue == '');
			if(!isNoUserGroup){
				customerTesterId = cookieValue;
			}
		}
		data.customer_tester = customerTesterId;

		//20180709 | member_serial 추가
		if(_GLOBAL.CUSTOMER.ISSIGNIN){
			data.member_serial  = _GLOBAL.CUSTOMER.ID ;
		}

		if( data.page_type == "sport landing"){
			data.page_division = "brand";
			data.sport_category	= data.page_name[ data.page_name.length-1];
		}

		if( data.page_type == "brand landing"){
			data.page_division = "brand";
		}

		//뒤로가기로 인한 결제 취소시 orderCancel 추가
		//모바일 뒤로가기일 경우 태깅은 안하기로 함 주석 처리(20190327)

		if( md.pathName == "/checkout"){
			if ($.cookie('orderCancel') === 'check'){
				$.extend( data, getorderCancel());
				callTrackEvent( data );
			} else{
				$.extend( data, getCheckoutData());
			}
		}

		//결제 취소시 orderCancel 추가
		if( md.pathName == "/cart"){
			if ($.cookie('orderCancel') === 'check'){
				$.extend( data, getorderCancel());
				callTrackEvent( data );
			}
		}

		if( md.pathName == "/launch"){
			$.extend( data, getCategoryData());
		}

		// 로그인 후 첫 페이지 이면
		/*
		var isFirstLogin = true;
		if( isFirstLogin == "true" ){
			data.page_event = {
				login : true
			}
		}
		*/
		return data;
	}
	function getPageName(){
		// checkout 에서 키프트 카드, 적립금 등을 사용해서 url 이 바뀌더라도 checkout으로 처리
		if( md.pathName.indexOf("/giftcard/credit") == 0 || md.pathName.indexOf("/giftcard/apply") == 0 || md.pathName.indexOf("/giftcard/removeCredit") == 0 ){
			md.pathName = "/checkout";
		}

		if( md.pathName == "/"){
			   md.pathName = "/homepage";

				//스니커즈일 경우../kr/launch/
				if(Core.Utils.contextPath=="/kr/launch"){
					md.pathName = "/launch";
				};
		}

		//체크아웃, 주문완료, pdp 페이지  일반닷컴  or 스니커즈   page_name 분기처리
		if(md.pathName=="/checkout" ||  md.pageType=="confirmation" || md.pageType=="product"){
			md.pathName = (Core.Utils.contextPath=="/kr/launch") ? '/launch'+md.pathName : md.pathName;
		}

		//첫번째 / 제거
		var url = md.pathName.replace("/", "");
		return url.split("/");
	}

	function getPageTypeData(){
		// 이미 type 이 잡혀있다면 다시 설정하지 않음
		if( dl.page_type != null ){
			return;
		}
		//TODO
		// else if 로 전체 변경하자

		// goods
		// grid wall -> categoryData 에서 처리

		// homepage
		if( md.pathName == '/homepage' ){
			return "homepage";
		}
		// snkrs
		/*
		if( md.pathName == '/launch' || queryString.c == 'snkrs'){
			return "snkrs";
		}
		*/
		// search -> searchData에서 처리
		// sports landing


		if( getRegexTestResult( /\/l(.*.)\/(running|training|basketball|football|skateboarding|golf|yoga|tennis|gym-training)$/g, md.pathName ) ){
			return "sport landing";
		}

		// brand landing
		if( getRegexTestResult( /\/l\/(nikelab|jordan|nba|sportswear|acg)$/g, md.pathName ) ){
			return "brand landing";
		}

		// gender landing
		if( md.pathName == "/l/men" || md.pathName == "/l/women" || md.pathName == "/l/boys" || md.pathName == "/l/girls" ){
			return "gender landing";
		}

		// my page
		if( md.pathName == '/mypage' ){
			return "member";
		}

		// cart -> cartData에서 처리
		// order -> checkout 에서 처리
		// cscenter -> 이부분은 확인 해야함 zendesk에서 던져줘야 하는 정보가 될수있음
		// the draw

		if( md.pathName == "/account/wishlist"){
			return "mylocker";
		}

		// memeber
		if( md.pathName.indexOf("/account") == 0 || md.pathName == "/resetPasswordSuccess" || md.pathName == "/updateAccountSuccess"){
			return "member";
		}

		// etc
		return "etc";

	}

	function getSectionL1Data(){
		var patten = "";

		if( md.pathName.indexOf("/l/men") == 0 || md.pathName.indexOf("/w/men")  == 0 || md.pathName.indexOf("/t/men")  == 0 ){
			return "men";
		}
		if( md.pathName.indexOf("/l/women") == 0 || md.pathName.indexOf("/w/women") == 0 || md.pathName.indexOf("/t/women")  == 0 ){
			return "women";
		}
		if( md.pathName.indexOf("/l/boys") == 0  || md.pathName.indexOf("/w/boys") == 0 || md.pathName.indexOf("/t/boys")  == 0 ){
			return "boys";
		}
		if( md.pathName.indexOf("/l/girls") == 0  || md.pathName.indexOf("/w/girls") == 0 || md.pathName.indexOf("/t/girls")  == 0 ){
			return "girls";
		}

		/*
		if( getRegexTestResult( /^\/category\/men/g, md.pathName )) {
			return "men";
		}

		if( getRegexTestResult( /^\/category\/women/g, md.pathName )) {
			return "women";
		}

		if( getRegexTestResult( /^\/category\/boys/g, md.pathName )) {
			return "boys";
		}

		if( getRegexTestResult( /^\/category\/girls/g, md.pathName )) {
			return "girls";
		}
		*/
		return "";
	}

	function getSectionL2Data(url){
		var pathName = url;
		if(pathName == '' || pathName == null){
			pathName = md.pathName;
		}

		// TODO
		// /w/men/ap||fw||eq
		// /w/men/fw/lifestyle

		// fw/ap/eq/xc 를 삭제해야하고
		// tennis|golf|skateboarding-shoes|football|basketball|gym-training|running
		// hoodies-crews|jackets-vests|pants-tights|tops-tshirts|shorts|nike-pro-compression|bags|socks|accessories-equipment
		// |set|baselayer|sports-bras|skirts-dresses

		// 체크되는 이름과 전달 해야하는 이름이 달라 명칭 따로 정의
		var l2 = "";
		var l2List = [
						{key:"sportswear", value:""},
						{key:"running", value:""},
						{key:"football", value:""},
						{key:"basketball", value:""},
						{key:"athletic-training", value:""},
						{key:"womens-training", value:""},
						{key:"jordan", value:""},
						{key:"golf", value:""},
						{key:"skateboarding", value:""},
						{key:"young-athlete", value:""},
						{key:"tennis", value:""},
						{key:"nikelab", value:""},
						{key:"snkrs", value:""},
						{key:"nba", value:""},
						{key:"acg", value:""},
						{key:"nsw", value:"sportswear"},
						{key:"at/", value:"athletic training"},
						{key:"men-training", value:"athletic training"},
						{key:"men/fw/gym-training", value:"athletic training"},
						{key:"l/men/gym-training", value:"athletic training"},
						{key:"wt/", value:"womens training"},
						{key:"women-training", value:"womens training"},
						{key:"women/fw/gym-training", value:"womens training"},
						{key:"l/women/gym-training", value:"womens training"},
						{key:"action-sports", value:"skateboarding"},
					];
				/*
					,"nikelab"
					,"jordan"
					,"nba"
					,"fan-gear"
					,"tennis"
					,"golf"
					,"skateboarding-shoes"
					,"football"
					,"basketball"
					,"gym-training"
					,"running"
					,"hoodies-crews"
					,"jackets-vests"
					,"pants-tights"
					,"tops-tshirts"
					,"shorts"
					,"nike-pro-compression"
					,"bags"
					,"socks"
					,"accessories-equipment"
					,"set"
					,"baselayer"
					,"sports-bras"
					,"skirts-dresses"
				*/

		/*
		var subCategory = md.pathName.split("/");
		if( subCategory.length >= 5 ){
			// 첫번째 / 때문에 length가 1이 더 잡히기 때문에 4로 리턴
			return subCategory[4];
		}
		*/

		$.each( l2List, function( index, data ){
			//console.log( data );
			if( pathName.indexOf( "/"+data.key ) > -1 ){
				l2 = (data.value == "") ? data.key : data.value;
				return false;
			}
		})
		return l2;
	}

	// 카테고리 정보
	function getCategoryData(){
		var data = {};
		data.page_type = "grid wall";



		if( md.categoryInfo != null ){
			var categoryInfo = md.categoryInfo;

			if( categoryInfo.hasHeaderContent == true ){
				data.page_type += ":PWH";
			}

			// todo
			// 필터 적용하는 부분에서 url에 lf 값이 있으면 제거해줘야 함
			// 검색 필터를 사용자가 선택해서 넘어온경우가 아닌 링크로 만들어놓은 url에 필터가 걸려있으면 facet을 처리하지 않는다.

			/*
			if( categoryInfo.facet != null ){
				if( String(categoryInfo.lf).toUpperCase() != "Y" ){
					// todo
					// 필터 정보 부분 아직 어떤식으로 줄지 정해지지 않았음
					//JSON.stringify(categoryInfo.facet);
					data.search_facet = "{" + categoryInfo.facet.replace(/=/gi, ":").replace(/&/gi, ",") + "}";
					// facet를 사용한 경우
					data.page_event = {
						endeca_filter_applied :true
					}
				}
			}
			*/
		}
		return data;
	}

	// 상품정보
	function getProductData(){
		var data = {};
		data.page_type = "goods";
		md = _GLOBAL.MARKETING_DATA();

		var product_type = null;
		if($("[data-product-type]").length > 0) {
			product_type = $("[data-product-type]").data('productType');
		}
		if(product_type !== null)
			data.product_type = product_type;

		//customProductInfo = nike에서만 사용하는 정보들
		if( md.productInfo != null ){

			var totalRastingAvg = md.productInfo.reviewInfo !== undefined ? md.productInfo.reviewInfo.totalRatingAvg : 0;
			var totalRatingCount = md.productInfo.reviewInfo !== undefined ? md.productInfo.reviewInfo.totalRatingCount : 0;

			//세일여부 판단 구분 변수 필요, 기본값은 할인안함 2020-04-08 13:40:21 pck 
			var product_discount_check = false;

			data.products = [
				{
					product_id : md.productInfo.model,
					product_category : (md.customProductInfo != null ) ? md.customProductInfo.productCategory : '', 	// 현재 BU값을 productCategory 값으로 셋팅되어있음 // products, prop1, eVar12, prop20
					product_name : md.productInfo.name, 			// products, prop1, eVar12, prop20
					product_unit_price : md.productInfo.retailPrice,

					// 세일 가격 정보 정의 필요함
					product_inventory_status : "in stock" , // 재고 상태
					avg_product_rating : (totalRastingAvg==0) ? "" : Number(totalRastingAvg / 100 * 5).toFixed(1), // 평균 review 평점
					// 평균 review 평점 Number(md.productInfo.reviewInfo.totalRatingAvg / 100 * 5).toFixed(1)
					number_of_product_review : totalRatingCount, // review 갯수
					product_finding_method : "browse", // 상품 페이지 방문 경로
					//onsite search(검색으로 바로 이동), browse(일반 plp에서), internal promotion(내부 프로모션 링크), external camopaign( cp코드 있으면 ), referring nike site(?), cross-sell(다른상품에서)
				}
			];

			// price 에는 최종 가격이 들어가기 때문에 정상가인 retailPrice 보다 작으면 세일중
			if( md.productInfo.price < md.productInfo.retailPrice ){
				data.products[0].product_discount_price = md.productInfo.price;

				product_discount_check = true; 
				// TODO
				// 카테고리 URL 결정되면 처리
				if( queryString.cr != null ){
					data.products[0].price_status = "clearance";
				}else{
					data.products[0].price_status = "reduced";
				}
			}

      		//ctm 로피스,보피스 구분 변수 추가.
			if(  $("[data-component-product-option]").find(".btn-storereserve").length>0  ){
				 var ropis_bopis = true;
			}else{
				 var ropis_bopis = false;
			}
			if($("[data-add-item]").find(".order-custom").length>0){
				var patch = true;
			}else{
				var patch = false;
			}
			data.page_event = {
				product_view : true, // product detail views
				ropis_bopis_function_loaded : ropis_bopis,
				patch_function_loaded : patch,
			}

			if( queryString.fm != null ){
				// sr, bw, pm, ec, cs

				var findingMethod = "";
				switch( queryString.fm ){
					case "sr":
						// 검색을 통해서 접근시
						findingMethod = "onsite search";
					break;
					case "pm":
						// 랜딩 페이지 혹은 pwh 이미지 클릭해서 왔을시
						findingMethod = "internal promotion";
					break;
					case "ec":
						// 어도비 마케팅 채널, 구글 마케팅 채널에서 왔을시
						findingMethod = "External campaign";
					break;
					case "cs":
						// 추천상품을 통해서 들어왔을시
						findingMethod = "cross-sell";
					break;
				}
				data.products[0].product_finding_method = findingMethod;

				// TODO
				//추천상품 링크를 통해 PDP 페이지를 들어온 경우
				if( findingMethod == "cross-sell" ){
					data.page_event.cross_sell_click_through = true // 추천상품 링크를 통해 PDP 페이지를 들어온 경우

					// pm 값으로 model명 받고 있음
					// prodducturl?fm=cs&md=201204-123;
					//data.products[0].cross_sell_source = queryString.md; // 추천 링크를 통한 PDP 페이지 방문 경로                       evar14=pdp:AA1128-200
				}
			}

			// 품절된 상품의 가격
			if( md.productInfo.isSoldOut ){
				data.products[0].product_inventory_status = "out of stock";
				data.page_event.value_out_of_stock_item = md.productInfo.price;
			}

			// 출시예정상품
			if( md.productInfo.isUpcoming ){
				data.products[0].product_inventory_status = "upcoming";
			}

			//가격인하제품 페이지 로드 시 하기 _dl에 추가 2020-04-08 11:50:43 pck
			//할인 적용여부 전달 
			//dl 접근 가능한지 체크 필요 2020-04-08 18:15:26
			dl.sale_price_availability = (product_discount_check) ? 'Y' : 'N';  //sale_price_availability : "SALE_PRICE_AVAILABILITY", // Y or N
			//1on1 적용여부 전달 
			if(typeof md.productInfo.is1on1 !== 'undefined')
				dl.is1_on_1_availability = (md.productInfo.is1on1.toString() == 'true') ? 'Y' : 'N';  // 1_on_1_availability : "1_ON_1_AVAILABILITY", // Y or N
			//멤버만 구매가능 여부 전달 	
			if(typeof md.productInfo.isMemberOnly !== 'undefined')
				dl.member_availability = (md.productInfo.isMemberOnly.toString() == 'true') ? 'Y' : 'N';  // member_availability : "MEMBER_AVAILABILITY", // Y or N
			
			data = personalize_chk(data); //개인화 태깅 체크,

		}

		return data;
	}


	//추천상품, 개인화 상품 태깅,
	function personalize_chk(data){
		if( $("[data-module-personalize]").length > 0 || $("[data-module-crosssale]").length > 0 ){ //개인화, 추천상품 존재시 처리

			var productmodel = []; 
			var targetEl = null;

			if($("[data-module-personalize]").length > 0){
				targetEl = $("[data-module-personalize]");
			}else if($("[data-module-crosssale]").length > 0){
				targetEl = $("[data-module-crosssale]");
			}

			if($('div[data-cart-relatedproduct]').length > 0){ //카트 연관 상품 노출 상태인 경우 예외 처리
				targetEl = document.createElement('div'); //카트 일 경우 초기화 후 다시 세팅 			
				$('div[data-cart-relatedproduct]').each( function(){ //Cart의 경우 related product영역이 2개가 있어서 실제 노출 된 객체를 확인해야 함.
					if($(this).css('display') == 'block')
						$(this).clone().appendTo(targetEl);
				});
			}
			if(targetEl !== null){
				$(targetEl).find("input[name='productmodel']").each(function(){ //상품모델 코드 추출 @ 2020-04-14 pck
					var $thisVal = $(this).val().toString();
					//if($.inArray($thisVal, productmodel) === -1) 중복처리는 안해도 디웍에서 직접 자르고 처리한다고 합니다. @ 2020-04-14 pck
						productmodel.push($thisVal);
				});
			}
			
			//작업1) 추천or 연관 상품 존재하는 페이지 로드 시, 하기 _dl추가
			//impression_products_id : "IMPRESSION_PRODUCTS_ID", // "BV34444-63,BV34444-35,BV34444-33,BV34444-34,BV34444-33"
			data.impression_products_id  = productmodel.join(',').toString();

			//개인화, 추천 상품이 있으면, dl에 추가
			//data.page_event.impressions_function_loaded = true;

			//연관 or 추천 상품과 같은, Impression의 타입을 수집 합니다.
			if($("[data-module-personalize]").length > 0 ){
				  data.impression_type = "products; recommended" ;
			}

			if($("[data-module-crosssale]").length > 0 ){
				 data.impression_type = "products; related";
			}
		}

		return data;
	}



	// 카트 정보
	function getCartData(){
		var data = {};
		data.page_type = "cart";

		data.page_event = {
			cart_view : true, // 장바구니 보기 (장바구니 페이지 열기)
		}

		data = personalize_chk(data); //개인화 태깅 체크,
		return data;
	}

	// 주문서 정보
	function getCheckoutData(){
		//더드로우 본인인증 분기 처리 위한 쿠키값 초기화..
		//드로우 페이지 에서, 응모 안하고 페이지 이동할 경우  Cookie 값이 살아 있음.
		// thedrawCertified  값이 있을경우 본인인증 후  thedrawRedirectUrl(더드로우 페이지로 redirect)
		// 없을 경우 checkout  페이지로 이동 됨..
		$.removeCookie('thedrawCertified', { path: '/' });
		$.removeCookie('thedrawRedirectUrl', { path: '/' });

		var data = {};
		data.page_type = "order";

		return data;
	}

	// 주문완료 정보
	function getOrderConfirmationData(){
		var data = {};

		data.page_type = "order";

		/* 구매확정시 필요 속성 영역 */
		data.purchase_id    = md.orderNumber; // 구매 (확정) 번호
		//data.member_serial  = _GLOBAL.CUSTOMER.ID;
		data.ctm_order_type =  md.ctm_order_type.toLowerCase()=="mixed" ? "cloud_mixed" : md.ctm_order_type.toLowerCase();   // 소문자로 변환..
		var customPatch = $('#customConfirmation');
		var customValue = $('[data-customvalue]').data('customvalue');
		var customKey = $('[data-customkey]').data('customkey');
		if(customPatch.length > 0 && customKey !== '000000'){
			data.custom_patch_ordered  = customValue + '_' + customKey;
		}

		//프로모션 코드 쿠키
		if ($.cookie('promoCode') != ""){
			data.checkout_promo_code = $.cookie('promoCode');
			$.removeCookie('promoCode', { path: '/kr/ko_kr/confirmation' });
		}

		// 뒤로가기로 인한 결제 취소시 체크
		$.removeCookie('orderCancel');
		$.removeCookie('orderCancel', { path: '/' });

		var paymentType = "";

		if( md.paymentList != null ){
			$.each( md.paymentList, function( index, data ){
				if( data.type == "GIFT_CARD" ){
					paymentType = getPaymentMethodByType(data.type) + ( md.paymentList.length > 1 ? ":" : "")  + paymentType;
				}
				paymentType = paymentType + getPaymentMethodByType(data.type);
			});

			if( md.paymentList.length ){

			}
		}
		data.payment_method = paymentType, // 결제 수단

		data.products = [];
		if($('[data-sameday-price]').length !== 0){
			data.shipping_type = 'sameday shipping'; // 당일배송
		} else{
			data.shipping_type = 'standard shipping'; // 일반배송
		}

		if( md.itemList != null ){
			data.products = makeProducts( md.itemList );
		}

		data.page_event = {
			purchase : true,  // 구매 확정
			shipping_amount : md.orderShippingTotalAmount, // (Number) 배송비
			discount_amount : 0
		}

		if( md.orderDiscount != null ){
			data.page_event.discount_amount = md.orderDiscount;
		}


		//결제한 카드 세부내욕 태깅.
		//개발 배포대기중....190312일 추후 반영

		if(md.payment_method_detail!="기타"){
			data.payment_method_detail = "credit card: "+md.payment_method_detail;
		}

		data = personalize_chk(data); //개인화 태깅 체크,

		return data;
	}




	function getPaymentMethodByType( type ){
		switch( type ){
			case "GIFT_CARD" :
				return "giftcertificate";
				break;

			case "CREDIT_CARD" :
				return "credit card";
				break;

			case "WIRE":
				return "wire";
				break;

			case "BANK_ACCOUNT":
				return "bank transfer";
				break;

			case "MOBILE":
				return "cellphone pay";
				break;

			case "KAKAO_POINT":
				return "KAKAO";
				break;

			case "PAYCO": // 2019-08-12
				return "PAYCO";
				break;

			case "NAVER_PAY": // 2020-09-08
				return "NAVER_PAY";
				break;
		}
	}
	// 검색 정보
	function getSearchData(){

		//  .kr/ko_kr/search?q=    <<<< 이런식으로 어디선가 검색어 없이 랜딩 되어 들어올 경우 스크립트 오류 발생
		//  때문에 분기처리 추가해줬음.
		if($("input[id='chk_search']").length > 0)	{
				var data = {};
				data.page_type = "search";
				var isResultFound = (md.searchInfo.totalCount > 0);

				data.onsite_search_phrase = md.searchInfo.keyword,
				data.onsite_search_result_page_type = ( isResultFound ? "onsite search results" : "no result found"),

				data.page_event = {}

				if( isResultFound ){
					data.page_event.onsite_search = true;
				}else{
					data.page_event.null_search = true;
				}

				data = personalize_chk(data); //개인화 태깅 체크,

				return data;
		};
	}

	// 가입 시작 정보
	function getRegisterStartData(){
		var data = {};
		data.page_type = "register";
		data.page_event = {
			registration_start : true, // 사용자 등록 시작
		}
		return data;
	}

	// 가입 완료 정보
	function getRegisterComplateData(){
		var data = {};
		data.page_type = "register";
		data.page_event = {
			registration_complete : true, // 사용자 등록 완료
			email_signup_success : md.receiveEmail || false, // 이메일 수신 동의를 사용자 등록시에 한 경우
			sms_signup_success : md.smsAgree || false, // SMS 수신 동의를 사용자 등록시에 한 경우
			//sms_signup_success : (md.smsAgree == 'on')?true:false || false
		}

		if( _GLOBAL.CUSTOMER.ID != null ){
			data.member_serial = _GLOBAL.CUSTOMER.ID;
		}
		if ( _GLOBAL.CUSTOMER.SOCIAL_PROVIDER_ID != '') {
			data.page_event[_GLOBAL.CUSTOMER.SOCIAL_PROVIDER_ID + '_registration_in_progress'] = true;
		}

		return data;
	}

	//회원 탈퇴
	function getwithdrawalData(){
		var data = {};
		data.page_type = "withdraw";
		return data;
	}


	function makeProducts( itemList ){
		var products = [];
		$.each( itemList, function( index, productData ){
			var product = {

				//ctm태깅추가..
				product_category : productData.category,
				product_discount_price : productData.product_discount_price,

				//주문완료 ctm태깅 변수 추가
				ctm_product_type :    productData.ctm_product_type!= undefined ? productData.ctm_product_type : "",   //ropis, bopis, cloud, com_owned
				shopping_place :      productData.shopping_place!= undefined ? productData.shopping_place : "",   //판매처
				inventory_owner :     productData.inventory_owner!= undefined ? productData.inventory_owner : "" ,  //재고처
				revenue_recognition : productData.revenue_recognition!= undefined ? productData.revenue_recognition : "",  //매출처

				product_id : productData.model,
				//TODO
				// bu 정보를 가져 올수 없음, classfication 정보에 있으니 id로만 처리하자고 요청
				product_name : productData.name, 			// products, prop1, eVar12, prop20
				product_quantity : productData.quantity,
				product_unit_price : productData.retailPrice,
			}

			if( productData.price < productData.retailPrice ){
				product.product_discount_price = productData.price;
			}
			products.push( product );
		})
		return products;
	}

	function getRegexTestResult( patten, str ){
		return patten.test( str );
	}

	function callTrackEvent( data ){
		if( _.isFunction( window._trackEvent )){
			_trackEvent( $.extend( {},  dl, data ) );
		}

		//Adobe Data 확인용 Break Point
		//debug( $.extend( {},  dl, data ) );
		
		//Adobe Data 확인용 test log
		//console.log( data );
	}

	function trackEvent( data ){
		//Adobe Data 확인용 Break Point
		debug( data );
	}

	function addEvent(){
		var endPoint = Core.getComponents('component_endpoint');
		var data = {};
		endPoint.addEvent('clickEvent', function( param ){
			debug( "clickEvent" );

			data = {};
			data.link_name = "Click Links";
			data.click_name = param.name;

			// 슬리이더에서 배너 등록해서 사용시 처리
			if( param.area == "slider"){
				data.click_area = String(data.click_name).split("_")[0];
			}else{
				data.click_area = param.area;
			}
			data.page_event = {
				link_click : true
			}
			callTrackEvent( data );
		});


		//ropis_submit_final
		//로피스 예약완료 버튼 태깅 추가
		endPoint.addEvent('ropis_submit_final', function( param ){
			data = {};
			data.checkout_type   = _GLOBAL.CUSTOMER.ISSIGNIN ? "registered" : "guest";    //logged in,  not logged in
			data.member_serial   = _GLOBAL.CUSTOMER.ID;
			data.ctm_order_type  = "ropis";
			data.payment_method  = "None: CTM ROPIS"; //20190516일 로피스 페이먼트 종류 변수 추가.

			data.products = [];

			if( md.itemList != null ){
				data.products = makeProducts( md.itemList );
			}

			//_checkoutpayment.js  공통 페이지라  수정이 불가피 할듯..
			//ctm_product_type은 주문완료에 값이 정해지는 거라 로피스는 주문단계에서 그냥 bopis로 고정해버림.
			//data.products[0].ctm_product_type = "ropis"

			data.products[0].ctm_product_type           = "ropis";

			//ctm 로피스 필수 널 값 필수..
			data.products[0].price_status               = "";
			data.products[0].avg_product_rating         = "";
			data.products[0].number_of_product_review   = "";
			data.products[0].product_inventory_status   = "";

			data.page_event = {
				  purchase : true, // 구매 확정
					shipping_amount : "", // (Number) 배송비
					discount_amount : "",  // 주문단위 할인금액
			}

	      callTrackEvent( data );
		});


		// 장바구니 추가시
		endPoint.addEvent('addToCart', function( param ){
			data = {};
			data.link_name = "Add to Cart";
			data.cart_serial = param.cartId;
			//var price = (param.retailPrice.amount > param.price.amount ? param.price.amount : param.retailPrice.amount );
			data.page_event = {
				add_to_cart : true,
				//value_added_to_cart : (( md.productInfo != null ? md.productInfo.price : 0 ) * param.quantityAdded),
				//miniPDP md 값이 안넘어옴.
				value_added_to_cart : (( param.price.amount != null ? param.price.amount : 0 ) * param.quantityAdded),
				units_added_to_cart : param.quantityAdded,
			}

			//미니pdp 일 경우 _dl products 가 삭제되서, 다시구성
			if(UIkit.modal('#common-modal').active==true){   //미니pdp 팝업이 open 된거면 ....

					var target = $("#quickview-wrap");

						data.products = [
							{
								product_category : $(target).find('#ctm_teg').data('bu'), 	// products, prop1, eVar12, prop20
								product_name : $(target).find('#ctm_teg').data('name'), 			// products, prop1, eVar12, prop20
								product_id : $(target).find('#ctm_teg').data('id'), // (2018-01-03 추가)
								product_quantity : $(target).find('#ctm_teg').data('quantity'),
								product_unit_price : $(target).find('#ctm_teg').data('unit_price'),
								product_discount_price: $(target).find('#ctm_teg').data('discount_price'),
								product_inventory_status : "in stock", // 재고 상태
								avg_product_rating : ($(target).find('#ctm_teg').data('product_rating') =='0.0') ? '' : Number($(target).find('#ctm_teg').data('product_rating') / 100 * 5).toFixed(1), // 평균 review 평점
								number_of_product_review : $(target).find('#ctm_teg').data('product_review'), // review 갯수
								product_finding_method : "browse", // 상품 페이지 방문 경로

							}
						];
			}


			callTrackEvent( data );
		})

		// 바로구매
		endPoint.addEvent('buyNow', function( param ){
			data = {};
			data.link_name = "Checkout:Buy Now";
			//data.checkout_serial = md.cartId; // 상품에서  클릭시에는 정보가 없음
			data.checkout_type   = _GLOBAL.CUSTOMER.ISSIGNIN ? "registered" : "guest";    //logged in,  not logged in
      		data.member_serial   = _GLOBAL.CUSTOMER.ID;
			data.ctm_order_type  = "com_owned";

			data.products = [];
			if( md.productInfo != null){

				data.products = [
					{
						product_id : md.productInfo.model,
						product_name : md.productInfo.name, 			// products, prop1, eVar12, prop20
						product_unit_price : md.productInfo.retailPrice,
						product_quantity : param.quantityAdded,
						product_discount_price : md.productInfo.price
					}
				];

				if( md.productInfo.price < md.productInfo.retailPrice ){
					data.products[0].product_discount_price = md.productInfo.price;
				}

				data.page_event = {
					checkout : true,
					value_at_checkout : (( md.productInfo != null ? md.productInfo.price : 0 ) * param.quantityAdded),
					units_at_checkout : param.quantityAdded
				}


			//=========================================================
			//위시리스트 미니pdp 에서 바로구매 클릭시 md 값이 없어서 else문 추가함.
			//=========================================================

			} else {

				data.products = [
					{
						product_id : $("#ctm_teg").data('id'),
						product_name : $("#ctm_teg").data('name'), 			// products, prop1, eVar12, prop20
						product_unit_price : $("#ctm_teg").data('unit_price'),
						product_quantity : $(".btn-qty input[name=quantity]").val(),   //수량
						product_discount_price : $("#ctm_teg").data('discount_price')
					}
				];

				data.page_event = {
					checkout : true,
					value_at_checkout : ( $("#ctm_teg").data('discount_price') * $(".btn-qty input[name=quantity]").val()),
					units_at_checkout : $(".btn-qty input[name=quantity]").val()
				}
			}


			callTrackEvent( data );
		});


		// 더 드로우 바로구매 태깅 추가
		endPoint.addEvent('the_draw', function( param ){
				data = {};
				data.link_name 		 = "Checkout: the draw";
				data.click_name	 	 = "the draw: winner_buy now";
				data.click_area 	 = param.click_area;
				data.checkout_type   = _GLOBAL.CUSTOMER.ISSIGNIN ? "registered" : "guest";
				data.member_serial   = _GLOBAL.CUSTOMER.ID;
				data.ctm_order_type  = "com_owned";

				data.products = param.products;

				data.page_event = {
					checkout : true,
					value_at_checkout : data.products[0].product_discount_price,
					units_at_checkout : Number(1)
				}

			callTrackEvent( data );
		});


		// 위시리스트 추가시
		endPoint.addEvent('addToWishlist', function( param ){
			data = {};
			data.link_name = "Add To Mylocker";
			data.page_event = {
				add_to_my_locker : true,
				value_added_to_my_locker : 1,
				units_added_to_my_locker : 1//( md.productInfo != null ? md.productInfo.price : 0 ) // 위시 리스트에 옵션을 저장히지 않기 때문에 의미 없는 정보..  고정값으로 1
			}
			callTrackEvent( data );
		});

		// review 작성 성공시
		endPoint.addEvent('writeReview', function( param ){
			data = {};
			data.link_name = "Product Review Submitted";

			//TODO
			// 리뷰 작성이후 상품정보가 없다.
			data.product = [
				{
					product_id : param.model,
					product_name : param.name
				}
			]

			data.page_event = {
				product_review_submitted : true
			}
			callTrackEvent( data );
		});

		endPoint.addEvent('pdpImageClick', function(){
			data = {};
			data.link_name = "PDP Interactions";
			data.pdp_interactions = "image selected";

			data.page_event = {
				pdp_interaction : true
			}
			callTrackEvent( data );
		})

		//사이즈 가이드 클릭시
		endPoint.addEvent('pdpSizeGuideClick', function(){
			data = {};
			data.link_name = "PDP Interactions";
			data.pdp_interactions = "Size Guide Open";

			data.page_event = {
				pdp_interaction : true
			}
			callTrackEvent( data );
		})

		//카테고리 필터on/off(와이드뷰) 클릭시
		endPoint.addEvent('wideToggleClick', function(param){
			data = {};
			data.click_area = "PW";
			data.click_name = "filters: " + param;

			data.page_event = {
				link_click : true
			}
			callTrackEvent( data );
		})

		//카테고리 제품 클릭 시
		endPoint.addEvent('pwProductClick', function(param){
			data = {};

			data.grid_wall_rank = param.grid_wall_rank,  //좌상단부터 우측으로 +1씩 증가.
			data.products = {
				product_id : param.product_id, //PRODUCT_ID
			}
			data.page_event = {
				grid_wall_prd_click : true,
			}
			callTrackEvent( data );
		})

		// 최종 결제 버튼 클릭시
		endPoint.addEvent('orderSubmit', function( param ){

		//ctm 클릭 이벤트 추가
		 if(param.physicaltype=="PHYSICAL_PICKUP"){
				data = {};
				data.link_name   = "Click Links";
				data.click_name  = "BOPIS_submit";
				data.click_area  = "inventory";

				data.page_event = {
					link_click : true
				}
				callTrackEvent( data );
			};

      		//ctm order-type 추가(= ropis, bopis, com_owned(cloud와 com_owned 주문))

			var physicaltype ="";

			switch(param.physicaltype){

					case "PHYSICAL_PICKUP" :
						physicaltype = "bopis";
						break;

					case "PHYSICAL_SHIP" :
						physicaltype = "com_owned";
						break;

					case "PHYSICAL_ROPIS" :
						physicaltype = "ropis";
						break;
		  	}

      		//결제버튼 태깅 진행
			md = _GLOBAL.MARKETING_DATA();
			data = {};
			data.link_name = "Order Submit";
			data.payment_method = "";
			data.login_status   = _GLOBAL.CUSTOMER.ISSIGNIN ? "logged in" : "not logged in";
			data.member_serial  = _GLOBAL.CUSTOMER.ID;
			data.ctm_order_type = physicaltype;

			//로피스 일경우 payment_method: "None: CTM ROPIS"
			if(physicaltype=="ropis"){

				// 로피스 일때 클릭 이벤트와 ordersubmit 2개가 동시 태깅이 안되서 , ordersubmit 에 변수를 추가함
				data.click_area = "inventory";
				data.click_name = "ROPIS_submit_go to next";
				data.payment_method = "None: CTM ROPIS";
			}

			data.products = [];

			// 뒤로가기로 인한 결제 취소시 체크
			// var widthMatch = matchMedia("all and (max-width: 767px)");
			// if (Core.Utils.mobileChk || widthMatch.matches) {
			// 	$.cookie("orderCancel", 'check', {expires: 1, path : '/'});
			// }

			//로피스 주문이 아닐경우,,,
			if(physicaltype!="ropis"){
				$.cookie("orderCancel", 'check', {expires: 1, path : '/'});
			}


			// 프로모션 코드 쿠기담기
			if( $(".promo-list").find(".applied").length > 0 ){
					var promoCode = "";

					$.each( $(".promo-list").find(".applied"), function(index, data ){
					promoCode  += $(data).data("promo-name") + ",";
					})

					promoCode = promoCode.substr(0, promoCode.length -1);

					$.cookie("promoCode", promoCode, {expires: 1, path : '/kr/ko_kr/confirmation'});

					data.checkout_promo_code = promoCode;
			}

			if( md.itemList != null ){
				data.products = makeProducts( md.itemList );
			}

			// 결제 수단 정보가 있을시
			if( param.paymentType != null ){
				data.payment_method = getPaymentMethodByType(param.paymentType);
			}

				if( md.marketingData.checkoutInfo.giftCardList != null ){
					data.payment_method = getPaymentMethodByType('GIFT_CARD') + ( param.paymentType != null ? ":" : "") + data.payment_method;
				}

				// 적립금 사용시
				/*
				if( md.checkoutInfo.customerCredit != null ){
					data.payment_method = getPaymentMethodByType('GIFT_CARD') + ( param.paymentType != null ? ":" : "") + data.payment_method;
				}
				*/


			data.page_event = {
				order_submitted : true
			}
			callTrackEvent( data );
		})

		// 사용자가 결제 중 취소한 경우
		endPoint.addEvent('orderCancel', function( param ){
			$.removeCookie('orderCancel');
			$.removeCookie('orderCancel', { path: '/' });
			data = {};
			data.page_name = "Order Submit Canceled";
			data.ctm_order_type = "";
			if( md.itemList != null ){
				data.products = makeProducts( md.itemList );
			}
			data.page_event = {
				order_canceled : true
			}
			callTrackEvent( data );
		});

		// 회원가입창 오픈
		endPoint.addEvent('openRegister', function(){
			data = {};
			data.page_event = {
				registration_start : true
			}
			callTrackEvent( data );
		})

		// 회원 가입 완료
		endPoint.addEvent('registerComplete', function( param ){
			//console.log( param );
			data = {};
			data.page_event = {
				registration_complete : true
			}

			if( param.isReceiveEmail == true ){
				data.page_event.email_signup_success = true;
			}

			if( param.isCheckedReceiveSms == true ){
				data.page_event.sms_signup_success = true;
			}
			callTrackEvent( data );
		})

		// 매장 검색시
		endPoint.addEvent('searchStore', function( param ){
			data = {};
			data.link_name = "Store Locator"
			data.page_event = {
				store_locator : true
			}
			callTrackEvent( data );
		});

		// 장바구니 상품 삭제시
		endPoint.addEvent('removeFromCart', function( param ){
		//console.log( param)
			data = {};
			data.link_name = "Remove from Cart";
			data.products = [
				{
					product_id : param.model,
					product_name : param.name
				}
			]
			data.page_event = {
				remove_from_cart : true
			}
			callTrackEvent( data );
		});

		// 장바구니에서 결제하기 클릭시
		endPoint.addEvent('checkoutSubmit', function( param ){
			md = _GLOBAL.MARKETING_DATA();

			data = {};
			//data.link_name = "Checkout:Buy Now"; Cart
			data.link_name = "Checkout:Cart";
			//CTM태깅 추가작업..
			data.member_serial   = _GLOBAL.CUSTOMER.ID;
			data.checkout_serial = md.checkout_serial;
			data.ctm_order_type  = "com_owned";

			//data.checkout_serial = md.cartId;
			data.checkout_type = _GLOBAL.CUSTOMER.ISSIGNIN ? "registered" : "guest";    //logged in,  not logged in

			if( md.promoList != null ){
				//data.checkout_promo_code = String($.map(md.promoList, function(item){ return ( item.auto == true ) ? item.name + ':auto applying' : item.name } ));
				// :auto applying  삭제 요청
				data.checkout_promo_code = String($.map(md.promoList, function(item){ return  item.name } ));
			}

			data.products = [];

			if( md.itemList != null ){
				data.products = makeProducts( md.itemList );
				data.page_event = {
					checkout : true,
					value_at_checkout : md.cartTotalAmount,
					units_at_checkout : md.totalItemCount
				}
			}

			if( param && param.itemList != null ){
				data.products = makeProducts( param.itemList );
				data.page_event = {
					checkout : true
				}

				var totalItemCount = 0;
				var totalAmount = 0;

				$.each( param.itemList, function( index, productData ){
					totalAmount += (( productData.price < productData.retailPrice ? productData.price : productData.retailPrice ) * productData.quantity );
					totalItemCount += productData.quantity;
				})
				data.page_event.value_at_checkout = totalAmount;
				data.page_event.units_at_checkout = totalItemCount;
			}

			callTrackEvent( data );
		});

		// sort 선택시
		endPoint.addEvent('changeSelect', function( param ){
			if( param.name == "sort"){
				data = {};
				data.link_name = "Product Sort Options";

				// TODO
				// 넘어오는 param.value 를 변경해야함
				// 현재 sort에 적용된 옵션 이상함
				// productDisplayOrder asc : 추천순  newest : 최신순  price low-high  : 낮은 가격순     price high-low  : 높은 가격순

				// 이부부은 충돌날꺼니까 넘겨서 작업하자
				var option = "";
				switch( param.value ){
					case "default", "activeStartDate desc":
						option = "newest";
					break;
					case "productDisplayOrder asc":
						option = "recommend";
					break;
					case "price desc":
						option = "price high-low";
					break;
					case "price asc":
						option = "price low-high";
					break;
				}

				data.product_sort_options = option;
				data.page_event = {
					product_sort : true
				}
				callTrackEvent( data );
			}
		});

		// 필터 선택시
		endPoint.addEvent('applyFilter', function( param ){
			data = {};
			data.link_name = "Product Search Facet";
			data.product_facet_option = param.key + ":"+ param.value;
			data.page_event = {
				endeca_filter_applied : true
			}
			callTrackEvent( data );
		});

		// 회원탈퇴시
		endPoint.addEvent('delete_account', function( param ){
			callTrackEvent( param );
		});
		// 상품 옵션 선택시
		endPoint.addEvent('pdpOptionClick', function( param ){
			data = {};
			if( String( param.type ).toLowerCase().indexOf("size") > -1 ){
				data.link_name = "Size Run Selection";

				//240:n|245:n|250:y|255:y|260:y|265:y|270:y|275:y|280:n|285:n|290:n|295:n|300:n|305:n|310:n|320:n
				var productOption = {}//['values'];

				// 전체 상품의 옵션 중에서 사이즈옵션 정보 가져오기
				$.each( param['data-product-options'],  function( index, optionData ){
					if( optionData.type == 'SIZE'){
						$.each( optionData['allowedValues'], function( idx, item ){
							productOption[ item.id ] = item.friendlyName;
						})

						data.size_run_selection = productOption[ optionData['selectedValue'] ];
						return false;
					}
				})

				// 가져온 정보에서 품절 여부 체크
				var sizeAvailabilityList = [];
				$.each( param['data-sku-data'], function(index, skuData){

				// 상품쪽 수정후 적용해야함
				//$.each( param['skuData'], function(index, skuData){
					var size = productOption[skuData.SIZE];
					var isAva = (skuData.quantity > 0 ? 'y' : 'n');
					sizeAvailabilityList.push( size + ':' + isAva );
				})
				data.size_run_availability = String(sizeAvailabilityList).split(',').join('|');
				data.page_event = {
					size_run_select : true
				}
			}

			callTrackEvent( data );
		});


   		//mini_wishlist
		endPoint.addEvent('mini_wishlist', function( param ){
			var patten = "";

			/*
			* 2021-04-23 @pck getSectionL1Data과 중복 처리 부 getSectionL1Data, getSectionL2Data함수에 param값 추가로 기능 확장
			*
			if( param.product_url.indexOf("/l/men") != -1 || param.product_url.indexOf("/w/men")  != -1 || param.product_url.indexOf("/t/men") != -1 ){
				param.site_section = "men";
			}
			if( param.product_url.indexOf("/l/women") != -1 || param.product_url.indexOf("/w/women") != -1 || param.product_url.indexOf("/t/women")  != -1 ){
				param.site_section = "women";
			}
			if( param.product_url.indexOf("/l/boys") != -1  || param.product_url.indexOf("/w/boys") != -1 || param.product_url.indexOf("/t/boys") != -1 ){
				param.site_section = "boys";
			}
			if( param.product_url.indexOf("/l/girls") != -1  || param.product_url.indexOf("/w/girls") != -1 || param.product_url.indexOf("/t/girls")  != -1 ){
				param.site_section = "girls";
			}
			 */

					data = param;
					//md.pathName = param.product_url;    //site_section_l2 겂 넣기 위해서, => 상품 url 로 변경..

					var url  = param.product_url.replace("/kr/ko_kr/", "");  // 페이지 네임
					data.link_name 		= "mini_pdp";
					data.page_type      = "mini pdp";
					data.page_name      =  url.split("/");
					data.page_name.unshift('mini');     // 앞에 mini  신규로 추가요청

					data.site_app_name  = "nikestorekr";   // 고정
					data.page_division  = "Commerce";  // 고정

					data.member_serial  =  _GLOBAL.CUSTOMER.ID ;
					data.login_status   =  _GLOBAL.CUSTOMER.ISSIGNIN ? "logged in" : "not logged in";
					data.site_section = getSectionL1Data(param.product_url);
					data.site_section_l2 = getSectionL2Data(param.product_url);

					data.page_event = {
						mini_pdp : true
					//	product_view : true, // product detail views
					//	value_out_of_stock_item : "VALUE_OUT_OF_STOCK_ITEM" // VALUE_OUT_OF_STOCK_ITEM (Number) PDP out-of-stock의 경우
					}

    				callTrackEvent( data );

		})


		// 상품 컬러 선택시
		endPoint.addEvent('pdpColorClick', function( param ){
			data = {};
			data.link_name = "PDP Interactions";
			data.pdp_interactions = "colorway changed";

			data.page_event = {
				pdp_interaction : true
			}
			callTrackEvent( data );
		});

		// 회원정보 수정
		endPoint.addEvent('updateProfile', function( param ){
			data = {};
			data.link_name = "Profile Update";
			data.profile_update_type = param;
			data.page_event = {
				profile_update : true
			}
			callTrackEvent( data );
		});


		// 로그인 성공
		endPoint.addEvent('loginSuccess', function( param ){
			data = {};
		//	data.social_login_type = "카카오톡"
			data.page_event = {
				login : true
			}
			callTrackEvent( data );
		});

		// promo 적용시
		endPoint.addEvent('applyPromoCode', function( param ){
			/*
			if( param.promoAdded == true ){
				data = {};
				data.checkout_promo_code = param.promoCode;
				data.page_event = {
					checkout_promo_code : true
				}
				callTrackEvent( data );
			}
			*/

		});

		// cross 클릭시
		endPoint.addEvent('crossSaleClick', function( param ){
			data = {};
			data.link_name = "PDP Interactions";
			data.pdp_interactions = "crossell selected";


			//개인화, 연관상품 태깅 추가 20191212

			//연관 or 추천 상품과 같은, Impression의 타입을 수집 합니다.products; recommended
			if($("[data-module-personalize]").length > 0 ){
				  data.impression_clicks_type = "products; recommended" ;
			}

			if($("[data-module-crosssale]").length > 0 ){
				 data.impression_clicks_type = "products; related";
			}

			data.products =[
			 	{
					product_category : param.productcategory,
					product_id : param.product_id,
				}
			];

			data.page_event = {
				pdp_interaction : true,
				impression_clikcs : true, // 신규 변수
			}
			callTrackEvent( data );
		})

		// 픽업 사이즈.
		endPoint.addEvent('pickupsizeClick', function( param ){
			callTrackEvent( param );
		});


		endPoint.addEvent('adobe_script', function( param ){
			callTrackEvent( param );
		});

		// 커스텀 패치 클릭
		endPoint.addEvent('patchClick', function( param ){
			data = {};
			data.link_name = "pdp_interaction";
			data.pdp_interactions = "patch selection opened";
			data.page_event = {
				pdp_interaction : true
			}
			callTrackEvent( data );
		});

		// 커스텀 패치 선택 메인
		endPoint.addEvent('customCodeMain', function( param ){
			data = {};
			data.link_name = "pdp_interaction";
			data.pdp_interactions = "patch selected";
			data.page_event = {
				pdp_interaction : true,
			}
			callTrackEvent( data );
		});

		// PDP Interaction 발생 용 *추후에 이벤트를 통합하여 관리하는 편이 좋을 듯 합니다. 2020-04-09 17:13:08 @pck
		endPoint.addEvent('pdpInteraction', function( param ){
			var data = {};
			try{
				data.link_name = "pdp_interaction";
				data.pdp_interactions = param.pdp_interactions;
				data.page_event = {
					pdp_interaction : param.page_event.pdp_interaction
				}
				callTrackEvent( data );
			}catch(e){
				console.log('track event error : ' +  data.link_name + '(' + e + ')');
			}
		});

		//SNKRS STORY swipe.js Event 2020-06-10 @pck 
		//인터렉션 타입별 
		//6초 뒤 자동 스와이프 시 SNKRS_mobile_swipe_type : "6secs swipe"
		//일반 스와이프 시 SNKRS_mobile_swipe_type : "swipe"
		endPoint.addEvent('snkrsMobileSwipeIndex', function( param ){
			var data = {};
			try{
				data.link_name = "SNKRS mobile index";
				data.SNKRS_mobile_index_number = param.SNKRS_mobile_index_number;
				data.SNKRS_mobile_swipe_type = param.SNKRS_mobile_swipe_type;
				data.page_event = {
					SNKRS_mobile_index : true
				}
				callTrackEvent( data );
			}catch(e){
				console.log('track event error : ' +  data.link_name + '(' + e + ')');
			}
		});

		//@pck 2020-11-05
		//SNKRS FEED / IN STOCK GALLERY, GRID MODE TOGGLE BUTTON EVENT
		endPoint.addEvent('snkrsThumbnailToggleClick', function(param){
			if( param !== null && typeof param == "object") {
				var data = {};

				data.click_area = param.click_area;
				data.click_name = param.click_name;
				data.link_name = "Click Links";

				data.page_event = {
					link_click: true
				}
				callTrackEvent(data);
			}
		});

		//@pck 2021-04-23
		//SNKRS COLLECTION, MINI PDP OPENED EVENT WITH PRODUCT DATA
		endPoint.addEvent('snkrsMiniPDPOpened', function(param){
			if( param !== null && typeof param == "object") {
				var data = {};

				data.link_name = "snkrs_mini_pdp";
				data.page_name =  param.product_url.split("/");
				data.page_name.splice(1,0,'mini');

				data.page_type = "snkrs mini pdp";
				data.site_section    = getSectionL1Data(param.product_url); // gender : man, women, boy, girls
				data.site_section_l2 = getSectionL2Data(param.product_url);

				data.product = [{
					product_category : param.product.product_category,
					product_name : param.product.product_name,
					product_id : param.product.product_id,
					product_quantity : param.product.product_quantity,
					product_unit_price : param.product.product_unit_price,
					product_discount_price : param.product.product_discount_price,
					product_inventory_status : param.product.product_inventory_status,
					//avg_product_rating : param.product.avg_product_rating,
					price_status : '',// param.product.price_status, **MINI PDP 접근경로는 무조건 SNKRS COL CDP임
					//number_of_product_review : param.product.number_of_product_review,
					product_finding_method : param.product.product_finding_method
				}];

				data.page_event = {
					mini_pdp: true
				}
				callTrackEvent(data);
			}
		});
	}

	function debug( data, alert ){
		//console.log( data );
		if( alert == true ){
			alert( data );
		}
	}
	Core.aa = {
		// 함수를 구분짓는것이 큰 의미는 없지만 추후 형태의 변화가 있을것을 대비해서 구분
		init : function(){
			init();
			addEvent();
		}
	}

})(Core);

(function(Core){
	Core.register('module_reservation_product', function(sandbox){
		var $this, $btn, args, serviceMenData={}, reservationData={}, arrInventoryList, itemRequest, confirmData, selectedProduct, hasLocalNo, needMakeMap, areaMap = new Map();

		var loadStore = function(){
			if(!serviceMenData.hasOwnProperty('goodsCode')) return;
			if(serviceMenData.hasOwnProperty('localNo')) hasLocalNo = true;

			if(serviceMenData['goodsCode'] !== selectedProduct){
				selectedProduct = serviceMenData['goodsCode'];
				needMakeMap = true;
			} else{
				needMakeMap = false;
			}

			if(needMakeMap){
				//새로운 상품 재고 검색 시 맵 초기화
				//상품(사이즈) 별로 맵을 만든다
				// var keys = areaMap.keys();
				areaMap.forEach(function(item, key, mapObj){
					areaMap.set(key, 0);
				});
				// for(var index = 0; keys.length > index; index++ ){
				// 	areaMap.set(keys[index], 0);
				// }
			}
			//serviceMenData['mode'] = 'template';
			//serviceMenData['templatePath'] = '/page/partials/reservedInventory';
			//serviceMenData['cache'] = new Date().getTime();

			sandbox.utils.promise({
				//url:'/processor/execute/reserved_inventory',
				url:sandbox.utils.contextPath + '/reservedInventory',
				type:'GET',
				cache:false,
				data:serviceMenData
			}).then(function(data){
				// 은정 배포 후 적용 라인
				var inventoryList = data; //sandbox.utils.strToJson(data.replace(/&quot;/g, '"'));

				arrInventoryList = [];
				//API 호출시 마다 매장 수량 결과가 다시 오기 때문에 기존의 값을 지운다.
				inventoryList.forEach(function(a,i){
				    if(a.quantity > 0){
						arrInventoryList.push(a);
						if(needMakeMap){
							//새로운 사이즈로 검색한 경우에만 만들어 준다.
							//지역별 매장 개수 표시를 위해 직접 센다.
							if(areaMap.has(a.state)){
								var agencyCnt = areaMap.get(a.state);
								if(agencyCnt !== undefined || agencyCnt !== null){
									areaMap.set(a.state, ++agencyCnt);
								}
							}
						}
						// console.log('list:', arrInventoryList);
					}
				});

				//Hide size-chart when inventory list exist.
				$this.find('.size-select-txt').text($this.find('.reservation-product-size.checked').attr('typename'));
				if($this.find('#reservation-size-title-area').hasClass('uk-active')){
					$this.find('#reservation-size-title-area').click();
				}
				if(hasLocalNo || arrInventoryList.length > 0){
					$this.find('.location-search').empty().append(
						Handlebars.compile($("#store-list").html())({
							result:(arrInventoryList.length > 0)?true:false,
							list:arrInventoryList
						})
					);
				} else {
					// $this.find('.location-search').empty().append('<div style="padding:30px 0; text-align:center;"><p style="padding-top:35px;lign-height:18px;color:#838383">매장에 수량이 없는 상품입니다.</p></div>');
				    $this.find('.location-search').empty().append('<div class="less-items uk-text-center"><i class="ns-alert color-less"></i><br />매장에 수량이 없는 상품입니다.</div>');
				}

				//목록이 만들어 진 후에 '매장명''수량'에 대해 온클릭 이벤트를 걸어 소트 기능을 붙일 수 있음
				//매장명으로 정렬
				$this.find('.shipping-header .store-name').on('click', function(){
					Method.sortAgencyList('store');
				});
				//수량으로 정렬
				$this.find('.shipping-header .prd-cnt').on('click', function(){
					Method.sortAgencyList('quantity');
				});
                //지역별 대리점 선택 창 닫기
				$this.find('.btn-location-code-close').on('click', function(){
					$this.find('.location-code-wrap').removeClass('active');
					$this.find('.dim').removeClass('active');
				});

				//대리점 목록을 업뎃한다.
				Method.updateAreaAgencyCnt();
			}).fail(function(msg){
				defer = null;
				UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
			});
		}

		var Method = {
			moduleInit:function(){
				args = arguments[0];
				$this = $(this);
				$btn = $this.find('.reservation-btn');

				var currentDate = new Date();
				var reservationModal = UIkit.modal('#reservation-modal', {center:true});
				var disabledDays = [];
				var skuData = sandbox.getComponents('component_product_option', {context:$(document)}).getDefaultSkuData(); //sandbox.utils.strToJson($(this.getThis()).find("[data-sku]").attr("data-sku"));
				
				var radioComponent = sandbox.getComponents('component_radio', {context:$this}, function(i){
					var _self=this;
					var INDEX = i;

					this.addEvent('change', function(val){
						switch(INDEX){
							case 0 :
								for(var i=0; i<skuData.length; i++){
									for(var j=0; j<skuData[i].selectedOptions.length; j++){
										if($(this).attr('data-id') == skuData[i].selectedOptions[j]){
											serviceMenData['goodsCode'] = escape(skuData[i].externalId);
											loadStore();
											return;
										}
									}
								}
								break;
							case 1 :
								serviceMenData['localNo'] = val;
								$this.find('.location').text(val);
								$this.find('.dim').removeClass('active');
								$this.find('.location-code-wrap').removeClass('active');
								loadStore();
								break;
						}
					});
				});

				//지역 브랜치 맵 생성, 도시이름(한글)이 key가 되고 개수가 value
				$this.find('[data-area-info]').each(function(){
					areaMap.set($(this).attr('id'), 0);
				});

				$this.on('click', '.location-select', function(e){
					e.preventDefault();
					$this.find('.location-code-wrap').addClass('active');
					$this.find('.dim').addClass('active');
				});

				$this.on('click', '.reservation-apply', function(e){
					e.preventDefault();
					var $form = $(this).closest('form');
					var INDEX = $(this).closest('.shipping-list').index();

					confirmData = {};

					$this.find('input[name=fulfillmentLocationId]').val($(this).attr('data-locationid'));
					itemRequest = BLC.serializeObject($form);
					//사이즈 정보 추가
					itemRequest.size = $this.find('.reservation-product-size.checked').attr('typename');
					//가격에 콤마 + 원 추가
					itemRequest.retailprice = sandbox.rtnPrice(itemRequest.retailprice);
					itemRequest.saleprice = sandbox.rtnPrice(itemRequest.saleprice);
					itemRequest.price = sandbox.rtnPrice(itemRequest.price);

					/* 예약주문 확인 */
					//전화번호 정보 추가
					var phoneNumber = itemRequest['phone'], tempPhone, formatPhone;
					if(phoneNumber.length == 0){
						formatPhone = '정보없음';
					} else if(phoneNumber.length > 10){
						tempPhone = phoneNumber.match(/^(\d{3})(\d{4})(\d{4})$/);
						formatPhone = tempPhone[1] + '-' + tempPhone[2] + '-' + tempPhone[3];
					}
          var isSignIn = (args.isSignIn === 'true')? true:false;
					confirmData.customer = {name:_GLOBAL.CUSTOMER.FIRSTNAME, phone:formatPhone, isSignIn:isSignIn}
					confirmData.storeInfo = arrInventoryList[INDEX];
					confirmData.product = itemRequest;
					disabledDays = arrInventoryList[INDEX].fulfillmentLocationCloseDates;

					// $this.find('.datepicker').datepicker('refresh');
					// $this.find('.datepicker-wrap').addClass('active');
					// $this.find('.dim').addClass('active');
					// $this.find('input[name=fulfillmentLocationId]').val($(this).attr('data-locationid'));

          //현재시간 확인
					var d = new Date(new Date().getTime());
					var date_format_str = d.getFullYear().toString()+"-"+((d.getMonth()+1).toString().length==2?(d.getMonth()+1).toString():"0"+(d.getMonth()+1).toString())+"-"+(d.getDate().toString().length==2?d.getDate().toString():"0"+d.getDate().toString())+" "+(d.getHours().toString().length==2?d.getHours().toString():"0"+d.getHours().toString())+":"+((parseInt(d.getMinutes()/5)*5).toString().length==2?(parseInt(d.getMinutes()/5)*5).toString():"0"+(parseInt(d.getMinutes()/5)*5).toString())+":00";
					confirmData['reservedDate'] = date_format_str;

					//확인화면으로 넘김
					var reservationConfirmTemplate = Handlebars.compile($("#store-confirm").html())(confirmData);
					$this.find('.reservation-confirm-wrap').empty().append(reservationConfirmTemplate);
					$this.find('.reservation-confirm-wrap').addClass('active');
					$this.find('input[name=reservedDate]').val(confirmData['reservedDate']);
					itemRequest['reservedDate'] = confirmData['reservedDate'];
				});

				$this.on('click', '.reservation-confirm-btn', function(e){
					e.preventDefault();
					var _self = this;
					sandbox.getModule('module_header').setModalHide(true).setLogin(function(){
						Method.requestReservation.call(_self);
					});
				});

				$this.on('click', '.cencel-btn', function(e){
					e.preventDefault();
					$this.find('.reservation-confirm-wrap').removeClass('active');
					$this.find('.datepicker').removeClass('active');
					$this.find('.dim').removeClass('active');
				});

				//datapicker
				$this.find('.datepicker').datepicker({
					dateFormat: "yy-mm-dd",
					minDate:new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
					onSelect:function(date){
						confirmData['reservedDate'] = date;
						$this.find('.timepicker').focus();
					},
					beforeShowDay:function(date){
						var string = jQuery.datepicker.formatDate('yy-mm-dd', date);
						return [ disabledDays.indexOf(string) == -1 ];
					}
				});

				//timepicker
				$this.find('.timepicker').focusout(function(e){
					var _self = $(this);
					setTimeout(function(){
						var time = _self.val();
						confirmData['reservedDate'] += ' ' + time + ':00';
					},200);
				});

				$this.find('.btn-time-submit').click(function(e){
					e.preventDefault();

					if(!confirmData['reservedDate']){
						UIkit.notify('방문 날짜와 시간을 선택해 주세요.', {timeout:3000,pos:'top-center',status:'warning'});
						return;
					}

					$this.find('.datepicker-wrap').removeClass('active');
					$this.find('.dim').removeClass('active');

					var reservationConfirmTemplate = Handlebars.compile($("#store-confirm").html())(confirmData);
					$this.find('.reservation-confirm-wrap').empty().append(reservationConfirmTemplate);
					$this.find('.reservation-confirm-wrap').addClass('active');
					$this.find('input[name=reservedDate]').val(confirmData['reservedDate']);
					itemRequest['reservedDate'] = confirmData['reservedDate'];
				});

				//dim click addEvent
				$this.find('.dim').off().on('click', function(e){
					$this.find('.reservation-confirm-wrap').removeClass('active');
					$this.find('.datepicker').removeClass('active');
					$this.find('.dim').removeClass('active');
					$this.find('.location-code-wrap').removeClass('active');
				});
			},
			updateAreaAgencyCnt:function(){
				$this.find('[data-area-info]').each(function(){
					$this.find('#area-branch-cnt-' + $(this).attr('value')).text(areaMap.get($(this).attr('id')));
				});
			},
			sortAgencyList:function(key){
				// console.log('key:', key);
				if(arrInventoryList.length > 0){
					if(key==='store'){
						arrInventoryList.sort(function(a,b){
							return a.name < b.name ? -1 : a.name > b.name ? 1:0;
						});
					} else {
						//quantity
						arrInventoryList.sort(function(a,b){
							return b['quantity'] - a['quantity'];
						});
					}

					$this.find('.location-search').empty().append(
						Handlebars.compile($("#store-list").html())({
							result:(arrInventoryList.length > 0)?true:false,
							list:arrInventoryList
						})
					);

					//대리점 목록을 업뎃한다.
					Method.updateAreaAgencyCnt();
				}
			},
			requestReservation:function(){
				var $form = $(this).closest('form');
				itemRequest = BLC.serializeObject($form);

				/* 예약주문 필수값 처리 */
				// if(!itemRequest.reservedDate || itemRequest.reservedDate === ''){
				// 	UIkit.notify('방문 날짜/시간를 선택해주세요', {timeout:3000,pos:'top-center',status:'danger'});
				// 	return false;
				// }

				sandbox.setLoadingBarState(true);
				BLC.ajax({
					url:$form.attr('action'),
					type:"POST",
					dataType:"json",
					data:itemRequest
				},function(data){
					if(data.error){
						sandbox.setLoadingBarState(false);
						UIkit.modal.alert(data.error);
					}else{
						/*var reservationComplateTemplate = Handlebars.compile($("#store-complate").html())();
						$('#reservation-modal').find('.contents').empty().append(reservationComplateTemplate);*/
						_.delay(function(){
							window.location.assign( sandbox.utils.contextPath + '/checkout' );
						}, 300);
					}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-reservation-product]',
					attrName:'data-module-reservation-product',
					moduleName:'module_reservation_product',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

// Core에 Utils에 추가되는 기능 - 계속 사용할지 몰라 우선 이쪽으로 빼놓음
(function (Core) {
	var opt = {};
	var apiUrl = '';
	Core.Utils.addressApi = {
		isEmpty: function (keyword, callback){
			var result = true;
			$.ajax({
				url: apiUrl,
				type:'GET',
				dataType: 'json',
				data: { 'q': keyword },
				async: false,
				cache: false,
				complete: function (data) {
					var json = (typeof data === Object) ? data : Core.Utils.strToJson(data.responseText || data, true);
					if (_.isArray(json.results)) {
						result = json.results.length == 0;
					}
				}
			});
			return result;
			
			/*
			Core.Utils.ajax(apiUrl, 'GET', { 'q': keyword }, function(data){
				var json = (typeof data === Object) ? data : Core.Utils.strToJson(data.responseText || data, true);
				if (_.isFunction(callback) && _.isArray(json.results)){
					callback(json.results.length == 0);
				}
			}, true, true);
			*/
		},
		search : function(keyword, callback){
			Core.Utils.ajax(apiUrl, 'GET', { 'q': keyword }, callback, true, true);
		},
		init : function(data){
			var DEFAULT_OPTION = {
				"type": "daum"
			}
			var API_URL = {
				'daum': '//api.poesis.kr/post/search.php'
			}
			opt = _.extend(DEFAULT_OPTION, data);
			apiUrl = API_URL[opt.type];

			return this;
		}
	}
})(Core);

(function(Core){
	Core.register('module_returnorder_history', function(sandbox){
		var Method = {
			moduleInit:function(){
				var args = Array.prototype.slice.call(arguments).pop();
				$.extend(Method, args);

				var $this = $(this);

				$this.find('button.return-cancel-item').on("click", Method.returnOrderCancelItem );
			},
			

			// 반품 취소 요청
			returnOrderCancelItem:function(e){
				e.preventDefault();
				var $form = $(this).closest("form");

				UIkit.modal.confirm('반품을 취소 하시겠습니까?', function(){
					$form.submit();
				}, function(){},
				{
					labels: {'Ok': '확인', 'Cancel': '취소'}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-returnorder-history]',
					attrName:'data-module-returnorder-history',
					moduleName:'module_returnorder_history',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

// 현재 테마에서 기본적으로 호출 되어야 하는 스크립트
(function(Core){
	$(document).ready(function(){
		// <![CDATA[

		var md = _GLOBAL.MARKETING_DATA();
		var autoOpenModalId = Core.Utils.getQueryParams(Core.Utils.url.getCurrentUrl()).am;
		var isAutoModalOpen = autoOpenModalId != null;
		if (_.isEqual(md.pageType, 'home') && isAutoModalOpen) {
			switch (autoOpenModalId) {
				case 'fp':
					if (!_GLOBAL.CUSTOMER.ISSIGNIN){
						$('[data-btn-forgot-password]').trigger('click');
					}else{
						UIkit.modal.alert('이미 로그인 되어 있습니다.');
					}
					break;

				default:
					break;
			}
		}
		
		window.addEventListener('pageshow', function (event) {
			if (event.persisted) {
				Core.Loading.hide();
			}
		});
		$(":checkbox").attr("autocomplete", "off");
		$(":radio").attr("autocomplete", "off");

		var channelFunnels = $('input[name="channelFunnels"]').val(); // admin에 등록된 채널정보
		// 등록된 유입채널 정보가 있을 때
		if (!_.isEmpty(channelFunnels)){
			channelFunnels = channelFunnels.split(',');
			var rUrl = document.referrer;
			var cUrl = Core.Utils.url.getCurrentUrl();
			var rUri = Core.Utils.url.getUri(rUrl); 
			var cUri = Core.Utils.url.getUri(cUrl);

			if (_.isEmpty(rUrl)) {
				rUri.host = '';
			}

			var cQueryParams = [];

			$.each(Core.Utils.getQueryParams(cUrl), function (data) {
				cQueryParams.push(data);
			})
			/*
			console.log(channelFunnels);
			console.log(cQueryParams);
			console.log(rUri);
			console.log(cUri);
			*/
			// param에 유입채널 정보가 있고 referrer 가 현재 사이트가 아니면
			if (!_.isEqual(rUri.host, cUri.host) && _.intersection(channelFunnels, cQueryParams).length > 0) {
				sessionStorage.setItem('AFFILIATE_INFLOW_URL', cUri.url);
				sessionStorage.setItem('AFFILIATE_INFLOW_PARAM', cUri.query.slice(1, 250));
			}
		}
		
		/*
		$.removeCookie('MAIN_LINK');
		$('[data-click-logo]').on('click', function(e){
			e.preventDefault();
			$.cookie('MAIN_LINK', true);
			location.href = $(this).attr('href');
		})
		*/
		
		if (typeof (history.pushState) == 'function'){
			if (Core.Utils.url.getUri(Core.Utils.url.getCurrentUrl()).path == '/kr/ko_kr/'){
				history.pushState({}, '', '/kr/ko_kr/');
			}
		}
		//]]>
	})
})(Core);
(function(Core){
	'use strict';
	Core.register('module_review_write', function(sandbox){
		var $deferred = null;
		var imgCount = 0;
		var removeId = null;
		var maxCount = 6;
		var currentStarCount = 0;
		var starCountIS = false;
		var fileLoad = null;
		var arrDescription = ['별로에요.', '그저 그래요.', '나쁘지 않아요.', '마음에 들어요.', '좋아요! 추천합니다.'];
		var imgTemplate = '<span class="preview-up-img"><a href="javascript:;" class="file-remove_btn"></a><img src="/kr/ko_kr/{{imgUrl}}?thumbnail" alt="{{imgAlt}}" /></span>';
		var inputHiddenTemplate = '<input type="hidden" name="fileList[{{id}}].fullUrl" class="file-{{id}}" value={{fullUrl}} /><input type="hidden" name="fileList[{{id}}].fileName" class="file-{{id}}" value={{fileName}} />';
		var endPoint, name, model,page_type;

		var Method = {
			moduleInit:function(){
				endPoint = Core.getComponents('component_endpoint');
				var $this = $(this);
				var $form = $this.find('#review-write-form');
				var $imgContainer = $this.find('.uplode-preview-list');
				var $thumbNailWrap = $this.find('.thumbnail-wrap');
				var $submitArea = $this.find('input[type=submit]');
				name 		= $($this).find('input[name="name"]').val();
				model 		= $($this).find('input[name="model"]').val();
				page_type	= $($this).find('input[name="reviewId"]').val();   //수정인지(reviewId 있으면), 신규작성인지

				var textAreaComponent = sandbox.getComponents('component_textarea', {context:$this}, function(i){
					var _this = this;
					this.addEvent('change', function(val){
						if(starCountIS && _this.getValidateChk()){
							$submitArea.removeClass('disabled');
						}else{
							$submitArea.addClass('disabled');
						}
					});
				});

				// fileLoad = sandbox.getComponents('component_file', {context:$this}, {setting:maxLength=6}, function(){
				fileLoad = sandbox.getComponents('component_file', {context:$this, maxLength:maxCount}, function(){
					var _self = this;
					this.addEvent('error', function(msg){
						UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'warning'});
					});

					this.addEvent('upload', function(fileName, fileUrl){
						//console.log(fileName, fileUrl);
						$thumbNailWrap.append(sandbox.utils.replaceTemplate(imgTemplate, function(pattern){
							switch(pattern){
								case 'imgUrl' :
									return fileUrl;
									break;
								case 'imgAlt' :
									return fileName;
									break;
							}
						}));

						imgCount++;
						_self.setCurrentIndex(imgCount);
					});
				});

				imgCount = $thumbNailWrap.children().size();
				fileLoad.setCurrentIndex(imgCount);

				currentStarCount = $this.find('.rating-star a').filter('.active').length - 1;

				$this.find('.rating-star a').click(function(e) {
					e.preventDefault();
					var index = $(this).index() + 1;
					$(this).parent().children('a').removeClass('active');
					$(this).addClass('active').prevAll('a').addClass('active');

					$this.find('input[name=rating]').val(index*20);
					$this.find('input[name=starCount]').val(index);
					$this.find('.rating-description').text(arrDescription[index-1]);

					starCountIS = true;

					if(textAreaComponent.getValidateChk()){
						if($submitArea.hasClass('disabled')){
							$submitArea.removeClass('disabled');
						}
					}
				});

				if(currentStarCount >= 0){
					$this.find('.rating-star a').eq(currentStarCount).trigger('click');
				}

				$this.find('.uplode-preview-list').on('click', '.file-remove_btn', function(e){
					e.preventDefault();
					var index = $(this).attr('href');
					$(this).parent().remove();

					imgCount--;
					fileLoad.setCurrentIndex(imgCount);
				});

				$this.find('input[type=submit]').click(function(e){
					e.preventDefault();
					var reviewContentText = _.trim($("#comment").val());
					var reviewTitleText = _.trim($("input#title").val());
					var reviewstarCount = $("input[name=starCount]").val();
					
					if (reviewstarCount == '0'){
						Core.ui.modal.alert('별점을 선택해 주세요.');
						return;
					};

					if (reviewTitleText == ''){
						Core.ui.modal.alert('제목을 입력해 주세요.');
						return;
					};

					if (reviewContentText.length < 6){
						Core.ui.modal.alert('상품리뷰를 다섯자 이상 작성해주세요.<br\>고객님이 올려주신 상품에 관련된 글은 주관적인 의견은 사실과 다르거나 보는 사람에 따라 다르게 해석될 수 있습니다.');
						return;
					};
					
					if (Core.utils.has.hasEmojis(reviewTitleText) || Core.utils.has.hasEmojis(reviewContentText)) {
						Core.ui.modal.alert('상품리뷰에 이모지를 사용할 수 없습니다.');
						return;
					};

					if(!starCountIS || !textAreaComponent.getValidateChk()){
						return;
					};

					$thumbNailWrap.children().each(function(i){
						var $this = $(this);
						$form.append(sandbox.utils.replaceTemplate(inputHiddenTemplate, function(pattern){
							switch(pattern){
								case 'id' :
									return i;
									break;
								case 'fileName' :
									return $this.find('img').attr('alt');
									break;
								case 'fullUrl' :

									return $this.find('img').attr('src');
									break;

									//수정시 마다 앞에 풀url( https://stg-cf-nike.brzc.kr) 이 붙는 현상으로. 쌈네일 이미지 깨지는 현상 발생
									//임시방편으로 수정
									// var r_fullUrl = $this.find('img').attr('src');
									// var st1 = 'https://static-breeze.nike.co.kr';
									// var st2 = 'https://stg-cf-nike.brzc.kr';
									// var s_fullUrl  = r_fullUrl.replace(st1,');
									// 	 s_fullUrl  = s_fullUrl.replace(st2,');
									//	 s_fullUrl  = s_fullUrl.replace('/kr/ko_kr',');
									//	 s_fullUrl  = s_fullUrl.replace('//','/');

									// return s_fullUrl

							}
						}));
					});

					var itemRequest = BLC.serializeObject($form);
					sandbox.utils.ajax($form.attr('action'), $form.attr('method'), itemRequest, function(res){
						var data = sandbox.rtnJson(res.responseText);

						if(data.hasOwnProperty('errorMessage') || !data){
							if($deferred) $deferred.reject(data.errorMessage);
							else UIkit.notify(data.errorMessage, {timeout:3000,pos:'top-center',status:'danger'});
						}else{
							/*리뷰 작성 시 상품 화면으로 되돌아 가면서 reflesh 되지 않아 우선 막음*/
							/*if($deferred) $deferred.resolve(data); else */
							endPoint.call("writeReview",{ name : name, model : model });
							Core.ga.action('review','write');

							if(page_type == ""){  //  위에 reviewId  수정, 신규 구분값
								var review_msg ="50마일 지급이 완료되었습니다."
							}else{
								var review_msg ="수정되었습니다.";
							}

							UIkit.modal.alert(review_msg).on('hide.uk.modal', function() {
								location.href = data.redirectUrl;
							});

						}
					}, true);
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-review-write]',
					attrName:'data-module-review-write',
					moduleName:'module_review_write',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				$deferred = null;
				//console.log('destroy review-write module');
			},
			setDeferred:function(defer){
				$deferred = defer;
			},
			moduleConnect:function(){
				fileLoad.setToappUploadImage({
					fileName:arguments[0],
					fullUrl:arguments[1],
					result:(arguments[2] === '1') ? true : false
				});
			}
		}
	});
})(Core);

/**
 *  @ 2020-04-20 pck
 * 	MOBON Tracker
 */
(function(Core){
	var md = null;
	var sendRF = null;
	var userId = 'nike1';

	function init(){
		if(EN) {
			md = _GLOBAL.MARKETING_DATA();
			sendRF = new EN();
		
			var productPrimaryImage = '';
			var productCategory = '';
			var productRelatedCodes = '';

			//상품대표이미지 url
			if(typeof md.productInfo !== 'undefined'){
				$(md.productInfo.imgUrl).each( function(index, data){
					if(data.key == 'primary' )
						productPrimaryImage = data.value;
				});
			}

			//카테고리
			
			if(typeof md.categoryInfo !== 'undefined'){
				productCategory = md.categoryInfo.name;
			}

			//연관, 추천상품 목록
			
			if(typeof md.productRelatedProducts !== 'undefined'){			
				productRelatedCodes = md.productRelatedProducts.join(',')
			}

			//품절여부 
			var isSoldOut = false;
			if($('#isSoldout').length > 0){ 
				isSoldOut = $('#isSoldout').val();
			}

			sendRF.setSSL(true); //ssl 파라미터는 공통으로 사용
			sendRF.setData('userid', userId);
			sendRF.sendRf();

			if(typeof md.pageType !== 'undefined'){
				switch( md.pageType ){
					//상품상세
					case "product": 
						/* 
						userid	String		모비온 User ID				필수					
						sc		String		본상품광고 Site_Code		필수
						pcode	String		상품코드					필수
						pnm		String		상품명						필수
						img		String		이미지 전체 URL				필수
						price	String 		"0"	제품가격				필수
						dcPrice	String 		"0"	제품 할인가격			옵션
						soldOut	String 		"0"	제품 품절여부 ("1" - 품절, "2" - 품절 아님)		   옵션
						mdPcode	String 		(쉼표로 구분된 여러 개의 상품 코드)	MD 추천 상품코드	옵션
						cate1	String		카테고리명					필수
						*/
						sendRF.setData('userid', userId);					
						sendRF.setData('sc', '23d4cbc774e804cac457052a3e1a4114'); 								//Site_Code
						sendRF.setData('pcode', md.productInfo.model); 											// ex) "942237-003"
						sendRF.setData('price', md.productInfo.retailPrice ); 									// 소비자가 또는 판매가
						sendRF.setData('pnm', encodeURIComponent(encodeURIComponent(md.productInfo.name))); 	//상품명
						sendRF.setData('img', encodeURIComponent(productPrimaryImage));

						if(md.productInfo.retailPrice > md.productInfo.price) //할인 시 에만 전달
							sendRF.setData('dcPrice', md.productInfo.price); 

						var chkSoldOut = (isSoldOut == 'true') ? '1' : '2';
						sendRF.setData('soldOut', chkSoldOut); 	 										//옵션 1:품절,2:품절아님
						sendRF.setData('mdPcode', productRelatedCodes); 										//옵션  "추천상품코드1,추천상품코드2,…"
						sendRF.setData('cate1', encodeURIComponent(encodeURIComponent(productCategory))); 		//필수 "상품카테고리"

						sendRF.sendRfShop();
						addEvent(); //PDP외 페이지에서 이벤트 발생 시 에러나는 것으로 추정(추후 요청 있을 시 추가작업 필요할 수도...) 						
						return true;

					//주문완료
					case "confirmation" : 
						/*
						uid		String		모비온 User ID			필수
						ordcode	String		주문번호				옵션
						pcode	String		제품코드				옵션
						qty		String 		(숫자 형식)	"1"	수량	필수
						price	String 		(숫자 형식, 소수점 가능) "0" 총 주문 금액	필수
						pnm		String		제품명					옵션
						*/

						var itemList = md.itemList || null;
						var pcode = "";
						var qty = 0;
						var name = "";
			
						if( itemList != null && itemList.length > 0 ){
							pcode = itemList[0].id;
							name = itemList[0].name;
							$.each( itemList, function(){
								qty += Number($(this)[0].quantity);
							})
						}

						sendRF.setData('uid', userId);
						sendRF.setData('ordcode', md.orderNumber);
						sendRF.setData('pcode', pcode); // 주문 완료시 묶음 주문인 경우 첫번째 상품의 제품코드만
						sendRF.setData('qty', qty); //주문 완료시 묶음 주문인 경우 총 제품 수량(총주문한 상품의 갯수를 의미. 예) A상품 2개, B상품1개 ->  A+B 하여 총 수량은 3개)
						sendRF.setData('price', md.orderTotalAmount);  //주문 완료시 묶음 주문인 경우 구매한 총 가격(총 결제금액을 의미함)
						sendRF.setData('pnm', encodeURIComponent(encodeURIComponent(name))); //-> 첫번째 상품의 제품코드
										
						sendRF.sendConv();	
						return true;			
				}
			}
		}else{
			console.warn('Load Err : NOBON 공용라이이브러리를 찾을 수 없어 초기화에 실패하였습니다.');
			return false;
		}
	}
	function addEvent(){
		var endPoint = Core.getComponents('component_endpoint');

		// 장바구니 추가 시
		endPoint.addEvent('addToCart', function(param){
			if(sendRF){
				sendRF.sendCart();
			}
		})

		// 위시리스트 추가 시
		endPoint.addEvent('addToWishlist', function(param){
			if(sendRF){
				sendRF.sendWish();
			}			
		});
	}
	Core.mobon = {
		init : function(){
			init();
		}
	}

})(Core);
(function(Core){
	'use strict';

	Core.register('module_shipping_address', function(sandbox){
		var $this, args, modal = null, endPoint;
		var Method = {
			moduleInit:function(){
				// modal layer UIkit 사용
				$this = $(this);
				args = arguments[0];
				modal = UIkit.modal('#common-modal');
				endPoint = Core.getComponents('component_endpoint');

				$this.on('click', '.defaultAddress', function(e){
					e.preventDefault();
					endPoint.call('updateProfile', 'address book:select default shipping');
					$(this).parent().submit();
				});

				$this.on('click', '.add-address', function(e){
					e.preventDefault();
					Method.modalInit($(this).attr('href'));
				});

				$this.on('click', '.modify', function(e){
					e.preventDefault();
					Method.modalInit($(this).attr('href'));
				});

				$this.on('click', '.remove', function(e){
					e.preventDefault();
					var _self = this;
					UIkit.modal.confirm('삭제 하시겠습니까?', function(){
						$(_self).parent().submit();
					});
				});

				$this.find('.address-form').remove();
			},
			modalInit:function(url){
				sandbox.utils.ajax(url, 'GET', {}, function(data){
					var appendHtml = $(data.responseText).find('.address-form').html();
					modal.element.find('.contents').empty().append(appendHtml);
					sandbox.moduleEventInjection(appendHtml);
					modal.show();
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-shipping-address]',
					attrName:'data-module-shipping-address',
					moduleName:'module_shipping_address',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function (Core) {
	Core.register('module_repairable_result', function (sandbox) {
		var Method = {

			$newAddress: null,
			isNewAddress: false,
			isSelectAddress1: false,
			isSelectAddress2: false,

			moduleInit: function () {
				var $this = $(this);
				var $form = $this.find('#sfrm');
				sandbox.validation.init($form);

				// 배송지 정보 submit
				$this.find('[data-repairRequest-chk-btn]').on('click', function (e) {

					e.preventDefault();
					sandbox.validation.validate($form);

					if (sandbox.validation.isValid($form)) {

						// as유형 글자수
						// if($this.find("#repairReason").val().length < 10){
						//	 UIkit.modal.alert("고객님의 상품 AS 를 접수하기 위해 최소 10글자 이상 입력해주세요.");
						//	 return;
						// }

						if (sandbox.utils.has.hasEmojis($this.find('#repairReason').val())) {
							sandbox.ui.modal.alert('AS 접수 작성시 이모지를 사용 할 수 없습니다.');
							return false;
						}

						//유의사항 show....
						$this.find('#jq_tab').eq(0).removeClass('uk-hidden');

						//수거지 새로 입력일 경우
						if ($this.find("[aria-expanded]").eq(1).attr('aria-expanded') == 'true') {
							$("#s_receiveAddressPostalCode").val($("span[data-postalcode]").eq(0).text());
							$("#s_receiveAddressLine1").val($("#s_addr1").val());
							$("#s_receiveAddressLine2").val($("#s_addr2").val());
							$("#s_receiveAddressFullName").val($("#s_name").val());
							$("#s_receiveAddressPhone").val($("#s_phone").val());
						};

						//받으시는 분 새로 입력일 경우
						if ($this.find("[aria-expanded]").eq(3).attr('aria-expanded') == 'true') {
							$("#r_deliveryAddressPostalCode").val($("span[data-postalcode]").eq(1).text());
							$("#r_deliveryAddressLine1").val($("#r_addr1").val());
							$("#r_deliveryAddressLine2").val($("#r_addr2").val());
							$("#r_deliveryAddressFullName").val($("#r_name").val());
							$("#r_deliveryAddressPhone").val($("#r_phone").val());
						};

						//수선 수리범위 배열처리.
						var seq = $('input#st_repairReasonAttr:checked').map(function () {
							return this.value;
						}).get().join(',');

						$this.find('#repairReasonAttr').val(seq);  //수선 범위...

						//첨부 이미지 배열
						var tempArray = [];
						//		$this.find('[data-component-file]').find('.preview-up-img').find('img').each(function(){
						//		   tempArray.push($(this).attr("src"));
						//		});
						//    $this.find('#r_personalMessage').val(tempArray.join( '|' ));

						var ii = 1;
						$this.find('[data-component-file]').find('.as-lode-img').find('img').each(function () {
							//tempArray.push($(this).attr("src"));
							$this.find('#imageFullUrl' + ii).val($(this).attr("src"));
							ii = ii + 1;
						});

						//수거지 배송 메모저장..
						if ($this.find('#selectPersonalMessage option:selected').eq(0).text() == '직접입력') {
							$this.find('#r_personalMessage').val($this.find('input#personalMessageText').eq(0).val());
						} else if ($this.find('#selectPersonalMessage option:selected').eq(0).val() != '') {
							var r_msg = $this.find('#selectPersonalMessage option:selected').eq(0).text();
							$this.find('#r_personalMessage').val(r_msg);
						}

						//받는분 배송 메모저장..
						if ($this.find('#selectPersonalMessage option:selected').eq(1).text() == '직접입력') {
							$this.find('#d_personalMessage').val($this.find('input#personalMessageText').eq(1).val());
						} else if ($this.find('#selectPersonalMessage option:selected').eq(1).val() != '') {
							var d_msg = $this.find('#selectPersonalMessage option:selected').eq(1).text();
							$this.find('#d_personalMessage').val(d_msg);
						}

						// if($("span[data-postalcode]").eq(0).text()==""){
						//	   UIkit.modal.alert("검색을 통하여 배송지를 입력해주세요.");
						//	 	 return;
						// };

						//수거지 주소
						sandbox.validation.validate($form);
						if (sandbox.validation.isValid($form)) {
							if ($this.find("[aria-expanded]").eq(1).attr('aria-expanded') == 'true') {
								if (!Method.isSelectAddress1) {
									UIkit.modal.alert("검색을 통하여 배송지를 입력해주세요.");
									return;
								}
							}
						}
						//받는분 주소 체크
						if (sandbox.validation.isValid($form)) {
							if ($this.find("[aria-expanded]").eq(3).attr('aria-expanded') == 'true') {
								if (!Method.isSelectAddress2) {
									UIkit.modal.alert("검색을 통하여 배송지를 입력해주세요.");
									return;
								}
							}
						}


						//작성완료시 모달
						if ($(this).attr('data-repairRequest-chk-btn') == 'step2') {

							//수거지 정보 validation
							if ($this.find("[aria-expanded]").eq(1).attr('aria-expanded') == 'false') {
								if ($("#s_receiveAddressPostalCode").val() == null || $("#s_receiveAddressPostalCode").val() == '') {
									UIkit.modal.alert('수거지 우편 번호가 누락 되었습니다.주소를 새로 입력해 주세요.');
									return;
								}

								if ($("#s_receiveAddressLine1").val() == null || $("#s_receiveAddressLine1").val() == '') {
									UIkit.modal.alert('수거지 주소가 누락 되었습니다. 주소를 새로 입력해 주세요.');
									return;
								}

								if ($("#s_receiveAddressFullName").val() == null || $("#s_receiveAddressFullName").val() == '') {
									UIkit.modal.alert('수거지 고객명이 누락 되었습니다. 고객명을 새로 입력해 주세요.');
									return;
								}

								if ($("#s_receiveAddressPhone").val() == null || $("#s_receiveAddressPhone").val() == '') {
									UIkit.modal.alert('수거지 전화번호가 누락 되었습니다.전화번호를 새로 입력해 주세요.');
									return;
								}

								var checkRegular = /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})/;
								if (!checkRegular.test($("#s_receiveAddressPhone").val())) {
									UIkit.modal.alert('올바른 수거지 휴대폰 번호를 새로 입력해주세요.');
									return;
								};
							};


							//배송지 정보 validation
							if ($this.find("[aria-expanded]").eq(3).attr('aria-expanded') == 'false') {
								if ($("#r_deliveryAddressPostalCode").val() == null || $("#r_deliveryAddressPostalCode").val() == '') {
									UIkit.modal.alert('배송지 우편 번호가 누락 되었습니다.주소를 새로 입력해 주세요.');
									return;
								}

								if ($("#r_deliveryAddressLine1").val() == null || $("#r_deliveryAddressLine1").val() == '') {
									UIkit.modal.alert('배송지 주소가 누락 되었습니다. 주소를 새로 입력해 주세요.');
									return;
								}

								if ($("#r_deliveryAddressFullName").val() == null || $("#r_deliveryAddressFullName").val() == '') {
									UIkit.modal.alert('배송지 고객명이 누락 되었습니다. 고객명을 새로 입력해 주세요.');
									return;
								}

								if ($("#r_deliveryAddressPhone").val() == null || $("#r_deliveryAddressPhone").val() == '') {
									UIkit.modal.alert('배송지 전화번호가 누락 되었습니다.전화번호를 새로 입력해 주세요.');
									return;
								}

								var checkRegular = /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})/;
								if (!checkRegular.test($("#r_deliveryAddressPhone").val())) {
									UIkit.modal.alert('올바른 배송지 휴대폰 번호를 새로 입력해주세요.');
									return;
								};
							};
							
							UIkit.modal('#popup-as-application').show();
						}
					};
				});


				var deliverySearch = sandbox.getComponents('component_searchfield', { context: $this, selector: '.search-field', resultTemplate: '#address-find-list' }, function () {
					// 검색된 내용 선택시 zipcode 처리
					this.addEvent('resultSelect', function (data) {
						if ($("[aria-expanded]").eq(1).attr('aria-expanded') == 'true') {
							Method.isSelectAddress1 = true;
						}
						if ($("[aria-expanded]").eq(3).attr('aria-expanded') == 'true') {
							Method.isSelectAddress2 = true;
						}
					});
				});


				//배송지 목록 선택
				$this.find('[data-customer-address-select-btn]').on('click', function (e) {

					var i = $("button[data-customer-address-select-btn]").index(this);     //배송지 목록
					var t_x = $("#addt_tab_index").val();    //배송지 목록  선택한 index

					var city = $("input[name='city']").eq(i).val();
					var fullName = $("input[name='fullName']").eq(i).val();
					var postalCode = $("input[name='postalCode']").eq(i).val();
					var addressLine1 = $("input[name='addressLine1']").eq(i).val();
					var addressLine2 = $("input[name='addressLine2']").eq(i).val();
					var phoneNumber = $("input[name='phoneNumber']").eq(i).val();

					//tetx 변경
					$(".txt-name").eq(t_x).text(fullName);
					$("span#txt-zip").eq(t_x).text(postalCode);
					$(".text-box").eq(t_x).text(addressLine1 + '  ' + addressLine2);
					$("span#txt-phone").eq(t_x).text(phoneNumber);

					var addr_model_pop = UIkit.modal('#popup-customer-address', { modal: false });
					addr_model_pop.hide();

					//배송지 목록, 선택시 hidden insert..
					if (t_x == 0) {    //수거지....
						$("input#s_receiveAddressCity").val(city);
						$("input#s_receiveAddressFullName").val(fullName);
						$("input#s_receiveAddressPostalCode").val(postalCode);
						$("input#s_receiveAddressLine1").val(addressLine1);
						$("input#s_receiveAddressLine2").val(addressLine2);
						$("input#s_receiveAddressPhone").val(phoneNumber);
					} else {
						$("input#r_deliveryAddressCity").val(city);
						$("input#r_deliveryAddressFullName").val(fullName);
						$("input#r_deliveryAddressPostalCode").val(postalCode);
						$("input#r_deliveryAddressLine1").val(addressLine1);
						$("input#r_deliveryAddressLine2").val(addressLine2);
						$("input#r_deliveryAddressPhone").val(phoneNumber);
					}
					return false;
				});

				inAjaxing = false;  //중복신청 방지...
				//   $("#sfrm").submit();
				$('[data-repairRequest-sendit-btn]').on('click', function (e) {
					var per_url = "repairRequest";
					var obj = $("#sfrm").serialize();
					var addr_model_pop = UIkit.modal('#popup-as-application', { modal: false });

					if (inAjaxing) {  //중복 신청 방지...
						UIkit.modal.alert('처리중 입니다.').on('hide.uk.modal', function () {
						});
						return;
					}

					inAjaxing = true;

					// obj = {'orderId' : 1818};
					Core.Utils.ajax(per_url, 'POST', obj, function (data) {
						var jsonData = Core.Utils.strToJson(data.responseText, true) || {};
						if (jsonData.result == true) {
							UIkit.modal.alert('신청되었습니다.').on('hide.uk.modal', function () {
								sandbox.setLoadingBarState(true);
								location.href = 'repaired';
							});

							//UIkit.notify("입고 알림 신청이 삭제 되었습니다." , {timeout:3000,pos:'top-center',status:'success'});
						} else {
							//	UIkit.notify(args.removeMsg, {timeout:3000,pos:'top-center',status:'warning'});
							addr_model_pop.hide();
							UIkit.modal.alert(jsonData.errorMsg).on('hide.uk.modal', function () {
								sandbox.setLoadingBarState(true);
								location.href = 'repairable?dateType=1';
							});
						}
					});
				});

				//이미지 첨부S  -------------------

				$this.find('[data-upload-btn]').on('click', function (e) {

					if ($('[data-component-file] .as-lode-img').length == 6) {
						UIkit.modal.alert('파일은 6개 까지만 가능 합니다.');
						return false;
					};

					$this.find('#input-file').trigger('click');
					return false;
				});


				$this.find('#input-file').change(function (e) {
					setImgPreview.call(this);
				});


				var setImgPreview = function (target) {

					var _errorMsg = "이미지 전송을 실패하였습니다.";

					if ($(this).val() === '') return false;

					$this.find("#fileupload-form").ajaxSubmit({
						success: function (data) {

							if (data.result == false) {  //실패시....
								UIkit.notify(_errorMsg, { timeout: 3000, pos: 'top-center', status: 'danger' });
								return false;
							};

							var imgTemplate = '<span class="as-lode-img"><a href="javascript:;" class="file-remove_btn"></a><img src="/kr/ko_kr{{imgUrl}}" alt="{{imgAlt}}" style="width:56px;height:56px;"/></span>';
							var fileUrl = data.fullUrl;
							var fileName = data.fileName;

							$(".thumbnail-wrap").append(sandbox.utils.replaceTemplate(imgTemplate, function (pattern) {
								switch (pattern) {
									case 'imgUrl':
										return fileUrl;
										break;
									case 'imgAlt':
										return fileName;
										break;
								}
							}));
							//$(".thumbnail-wrap").append('<img src="/kr/ko_kr'+ data.fullUrl +'">');
						},
						error: function (data) {
							UIkit.notify(_errorMsg, { timeout: 3000, pos: 'top-center', status: 'danger' });
							return false;
						}
					});
				};
				//이미지 첨부 E ---------------------------

				//첨부 이미지 삭제...
				$this.find('.thumbnail-wrap').on('click', '.file-remove_btn', function (e) {
					e.preventDefault();
					$(this).parent().remove();
				});

				//배송지 목록 클릭한 팝업 index
				$this.find('[data-customer-address-btn]').on('click', function (e) {
					$("#addt_tab_index").val($("[data-customer-address-btn]").index(this));
				});

				//배송지 목록 클릭한 팝업 index
				$this.find('input#isCheckoutAgree').on('change', function (e) {
					if ($this.find('input#isCheckoutAgree:checked').length == 3) {
						$this.find('div#jq_tab').eq(1).removeClass('uk-hidden');
						$this.find('div#jq_tab').eq(2).removeClass('uk-hidden');
					}
				});
			}
		}

		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-repairable-result]',
					attrName: 'data-module-repairable-result',
					moduleName: 'module_repairable_result',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);


//  AS 신청서 상세 조회   (/account/repaired)
(function (Core) {
	Core.register('module_repaired_list', function (sandbox) {

		var Method = {

			moduleInit: function () {
				var $this = $(this);
				var $_this = $("#popup-as-detail");

				//판정 결과버튼 없을시, 라인 삭제..
				$this.find('.order-list').each(function (i) {
					if ($(this).find("[data-click-area]").length == 0) {
						$(this).find(".item-btn").remove();
					}
				});

				//상세 조회
				$this.find("[data-repaired-number]").on('click', function (e) {

					UIkit.modal('#popup-as-detail').show();

					//var ix             = $("a[data-repaired-number]").index(this);
					var per_url = "repaired/detail";
					var obj = "repairNumber=" + $(this).attr('data-repaired-number');

					//모달창 초기화....
					$("a[aria-expanded]").eq(0).trigger('click');
					$("a[aria-expanded]").eq(2).trigger('click');
					$("li#jq_h_tab").addClass('uk-hidden');
					$("[data-repairaddr-chk-btn]").text('주소변경');

					Core.Utils.ajax(per_url, 'get', obj, function (data) {
						var jsonData = Core.Utils.strToJson(data.responseText, true) || {};

						if (jsonData.result == true) {

							str_price = String(jsonData.ro.repairOrderItem.price.amount);
							str_price = str_price.toString().replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');

							// item_option =  $this.find("span[data-item-option]").eq(ix).attr('data-item-option');  //상품옵션
							//	console.log(item_option);

							//카테고리
							var categoryUrl = jsonData.ro.repairOrderItem.productUrl;

							if ((categoryUrl.indexOf("/men/fw") != -1) || (categoryUrl.indexOf("/women/fw") != -1)) {
								categoryUrl = "신발";
								$_this.find("div#div_repairReasonAttr").eq(0).show();
								$_this.find("div#div_repairReasonAttr").eq(1).hide();

							} else if ((categoryUrl.indexOf("/men/ap") != -1) || (categoryUrl.indexOf("/women/ap") != -1)) {
								categoryUrl = "의류";
								$_this.find("div#div_repairReasonAttr").eq(0).hide();
								$_this.find("div#div_repairReasonAttr").eq(1).show();
							} else {
								categoryUrl = "기타";
								$("div#div_repairReasonAttr").hide();
							};

							//유형
							var repairReasonType = jsonData.ro.repairReasonType;
							//console.log(repairReasonType);

							if (repairReasonType == "A") {
								repairReasonType = "유무상 수선 의뢰";
							} else {
								repairReasonType = "봉제/원단/부자재/사이즈 불량";
							};

							//as수선범위 선택.. 체크박스..
							$("span[data-component-checkbox]").removeClass('checked');  //체크초기화
							var str_repairReasonAttr = jsonData.ro.repairOrderItem.repairReasonAttr;

							$_this.find("span[data-component-checkbox]").each(function () {
								var vl = $(this).attr('data-component-checkbox');
								if (str_repairReasonAttr.indexOf(vl) != -1) {
									$(this).addClass('checked');
								}
							});

							//첨부이미지...
							$_this.find("div.thumbnail-wrap").html('');

							for (var i = 1; i < 7; i++) {

								if (eval('jsonData.ro.repairOrderItem.repairImg' + i) != null) {
									$_this.find("div.thumbnail-wrap").append("<span class='preview-up-img'><img src='" + eval('jsonData.ro.repairOrderItem.repairImg' + i) + "' style='width:56px;height:56px;'>&nbsp; </span> ");
								};
							};

							//동의
							for (var i = 1; i < 4; i++) {
								if (eval('jsonData.ro.repairOrderItem.repairAgree' + i)) {
									$_this.find("span#repairAgree").eq(i - 1).addClass('check');
								};
							};


							var resulr_status = jsonData.ro.status.type;  //진행사항...


							//주소변경 버튼.....
							if (resulr_status != "REQUEST") {
								$("a#btn_addr_send").hide();
							} else {
								$("a#btn_addr_send").show();
							}

							$_this.find("#categoryUrl").text(categoryUrl);   //카테고리
							$_this.find("#repairReasonType").text(repairReasonType);   //as유형
							//$_this.find("#jq_repairReason").text(result_repairReason(jsonData.ro.repairReason));  //설명
							$_this.find("#jq_repairReason").text(result_repairReason(jsonData.ro.repairReason));

							$_this.find("#jq_receiveAddressFullName").text(jsonData.ro.receiveAddress.fullName);   //우편번호
							$_this.find(".jq_receiveAddressPostalCode").text(jsonData.ro.receiveAddress.postalCode);   //주소1
							$_this.find("#jq_receiveAddr").text(jsonData.ro.receiveAddress.addressLine1 + '  ' + jsonData.ro.receiveAddress.addressLine2);   //주소2
							$_this.find("#jq_receiveAddressPhone").text(jsonData.ro.receiveAddress.phonePrimary.phoneNumber);   //핸드폰
							$_this.find("input#repairNumber").eq(0).val(jsonData.ro.repairNumber);   //repairNumber

							//	 if(jsonData.ro.r_personalMessage==null || jsonData.ro.r_personalMessage==''){  //수거메모
							//		 $("#jq_recevie").hide();
							//	} else{
							//
							//	}
							$_this.find("#jq_recevie_memotext").text(result_repairReason(jsonData.ro.r_personalMessage));   //수거메모
							$_this.find("#jq_deliveryAddressFullName").text(jsonData.ro.deliveryAddress.fullName);   //우편번호
							$_this.find(".jq_deliveryAddressPostalCode").text(jsonData.ro.deliveryAddress.postalCode);   //주소1
							$_this.find("#jq_deliveryAddr").text(jsonData.ro.deliveryAddress.addressLine1 + '  ' + jsonData.ro.deliveryAddress.addressLine2);   //주소2
							$_this.find("#jq_deliveryAddressPhone").text(jsonData.ro.deliveryAddress.phonePrimary.phoneNumber);   //핸드폰
							$_this.find("input#repairNumber").eq(1).val(jsonData.ro.repairNumber);   //repairNumber
							$_this.find("#jq_delivery_memo").text(result_repairReason(jsonData.ro.d_personalMessage));  //받는 메모

							//	 if(jsonData.ro.d_personalMessage==null || jsonData.ro.d_personalMessage==''){   //배송메모
							//		 $("#jq_delivery").hide();
							//	} else{
							//		 $_this.find("#jq_delivery_memo").text(jsonData.ro.d_personalMessage);
							//	}
						} else {
							UIkit.modal.alert(jsonData.result);
						}
					});
				});


				//취소..data-cancel-btn
				$this.find("[data-cancel-btn]").on('click', function (e) {

					var per_url = $(this).attr('data-cancel-btn');

					UIkit.modal.confirm('A/S 신청을 취소하시겠습니까? 취소하게 되면 등록내용이 삭제됩니다', function () {
						window.document.location.href = per_url;
						return;
					});
				});



				// 글자수 마킹...
				var result_text = function (ss, str) {

					if (str != null && str != '') {
						len = str.length;

						str1 = str.substring(0, ss);
						str2 = "";
						for (var i = ss; i < len; i++) {
							str2 = str2 + '*';
						};
						return str1 + str2;
					};
				};

				//상세설명   .repairReason.replace(/&#40;/gi,'(').replace(/&#41;/gi,')')
				var result_repairReason = function (html) {
					if (html != null) {
						var txt = document.createElement('textarea');
						txt.innerHTML = html.replace(/&#40;/gi, '(').replace(/&#41;/gi, ')').replace(/&#39;/gi, "''");
						return txt.value;
					}
				};


				// 금액 콤마...
				var result_price = function (str) {
					if (str != null) {
						return (str != '0') ? str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : str;
					}
				};


				//판정결과 pop...
				$this.find("[data-repaired-opinion]").on('click', function (e) {

					//api 개발로 인해, 특정시간 alert 안내창 노출
					var sdate = new Date("2019/06/19 02:00:00");
					var edate = new Date("2019/06/19 03:00:00");

					str_msg = "서비스 이용에 불편을 드려 죄송합니다.</br>안정화된 서비스를 제공하기 위해 시스템 점검 중입니다.</br>" +
						"점검 시간 동안 일시적으로 A/S 판정 결과 확인은 불가하며,</br>6월 19일 03시 이후부터 정상적으로 서비스 이용하실 수 있습니다."
					//	"※점검 일시 : 2019.05.20 22:00 ~ 2019.05.21 10:00 (12시간)"

					if (Date.now() >= sdate && Date.now() <= edate) {
						UIkit.modal.alert(str_msg).on('hide.uk.modal', function () {
						});
						return;
					}

					UIkit.modal('#repaired-opinion_detail').show();  //판정결과 모달 open...

					var $this = $("#repaired-opinion_detail");
					var per_url = "repaired/confirm";
					var obj = "repairNumber=" + $(this).attr('data-repaired-opinion');

					sandbox.validation.init($this);
					var member_data = sandbox.getModule('module_header').getCustomerInfo();
					//-----------------------------
					// var status          = $(this).attr('data-repaired-status');  //진행사항....
					//-----------------------------

					Core.Utils.ajax(per_url, 'get', obj, function (data) {
						var jsonData = Core.Utils.strToJson(data.responseText, true) || {};

						if (jsonData.result == true) {

							var pp = jsonData.paymentInfoGroups.length;  //결제 방법cnt..
							var payment_list = "";
							var payment_lists = "";
							var sactive = " active";

							for (var ii = 0; ii < pp; ii++) {

								str0 = jsonData.paymentInfoGroups[ii];
								str1 = jsonData.paymentInfoGroups[ii].additionalInfo;

								payment_list = "<div class='payment-method-item " + sactive + "' data-m-redirect-url='" + str1.m_repair_redirect_url + "' data-paymentType='" + str0.paymentType + "' data-method='" + str1.pay_method + "' data-identity-code='" + str1.imp_identity_code + "' data-provider='" + str0.paymentProvider + "' data-notice-url='" + str1.repair_notice_url + "' data-type='" + str0.paymentType + "' data-pg='" + str1.pg + "'>" +
									"<h6 class='payment-method-item-title'>" + str0.displayText + "</h6>" +
									"</div>";
								payment_lists = payment_lists + '' + payment_list;
								sactive = "";
							};

							$this.find("[data-payment-method]").html(payment_lists);

							//환불입력창...str_refundAmount

							$this.find("#result_repairNumber").text(jsonData.dto.repairNumber);
							$("input#str_repairNumber").val(jsonData.dto.repairNumber);              //환불 pop...hidden..

							$this.find("#result_submitDate").text(jsonData.dto.submitDate.substring(0, 10));   //신청일
							$this.find("#result_itemName").text(jsonData.dto.itemName);  //상퓸명
							$this.find("#result_p_model").text(jsonData.dto.model);   //모델명

							if (jsonData.dto.asFlag == "0") {
								$this.find("#result_asPriceFlag").text("수선");
							} else if (jsonData.dto.asFlag == "1") {
								$this.find("#result_asPriceFlag").text("회송");
							} else if (jsonData.dto.asFlag == "2") {
								$this.find("#result_asPriceFlag").text("반품");
							} else if (jsonData.dto.asFlag == "3") {
								$this.find("#result_asPriceFlag").text("보류");
							}

							$this.find("#result_reDecisionDate").text(jsonData.dto.reDecisionDate.substring(0, 10));  //판정날자  result_repairAgree1
							$this.find("td#result_confirmResult").html(result_repairReason(jsonData.dto.confirmResult)); //판정내용
							$this.find("td#result_confirmKind").html(result_repairReason(jsonData.dto.confirmKind)); //판정결과  ,

							//환불입력창...
							$("#refund-step1").find("[text_refundAmount]").text(result_price(jsonData.dto.refundAmount) + '원');
							$("#refund-step1").find("#str_refundAmount").val(jsonData.dto.refundAmount);  //hidden

							var repaired_status = jsonData.dto.status;     //as 신행 현황....

							//회송일 경우에만 판정내용, 결과 보여준다.  if(jsonData.dto.asFlag == "0"){
							if (jsonData.dto.asFlag == "1") {
								$this.find("#process_confirmResult").show();
								$this.find("#process_confirmKind").show();
							} else {
								$this.find("#process_confirmResult").hide();
								$this.find("#process_confirmKind").hide();
							}

							//결제 문구  , 버튼.....
							if (repaired_status == "PENDING") {
								$this.find("#btn_submit").hide();    //확인 Btn
								$this.find("#btn_cancel").show();    //취소 btn

							} else if (repaired_status == "PAYMENT_PROCESS") {

							} else {
								str_price_process = "";
								$this.find("#btn_submit").show();
								$this.find("#btn_cancel").hide();
							};

							//수선비..
							if (jsonData.dto.asAdjPrice != null && jsonData.dto.asAdjPrice > 0) {
								str_price_process = " (결제대기)";
							} else {
								str_price_process = "";
							}

							//배송비..
							if (jsonData.dto.deliveryAdjFee != null && jsonData.dto.deliveryAdjFee > 0) {
								str_price_process1 = " (결제대기)";
							} else {
								str_price_process1 = "";
							}

							// status...
							if (repaired_status == "PAYMENT_PROCESS" || repaired_status == "PAYMENT_COMPLETE" || repaired_status == "FULFILL_OUT" || repaired_status == "DELIVERED" || repaired_status == "COMPLETE") {
								if (jsonData.dto.asAdjPrice != null && jsonData.dto.asAdjPrice > 0) {
									str_price_process = " (결제완료)";
								} else {
									str_price_process = "";
								}

								//배송비..
								if (jsonData.dto.deliveryAdjFee != null && jsonData.dto.deliveryAdjFee > 0) {
									str_price_process1 = " (결제완료)";
								} else {
									str_price_process1 = "";
								}
							}

							//수선,배송비 status 출력...
							if (str_price_process != '') {
								$this.find("span#str_price_process").eq(0).text(str_price_process);
							} else {
								$this.find("span#str_price_process").eq(0).text('');
							}

							if (str_price_process1 != '') {
								$this.find("span#str_price_process").eq(1).text(str_price_process1);
							} else {
								$this.find("span#str_price_process").eq(1).text('');
							}

							$this.find("#result_asAdjPrice").text(result_price(jsonData.dto.asAdjPrice) + '원'); //수선비
							//$this.find("#result_repaired_status").text(str_repaired_status);  //진행사항.

							if (jsonData.dto.deliveryFeeFlag == "Y") {        //배송비
								result_deliveryFeeFlag = "고객 부담";
								deliveryAdjFee = result_price(jsonData.dto.deliveryAdjFee) + '원';
							} else {
								result_deliveryFeeFlag = "나이키 부담";
								deliveryAdjFee = result_price(jsonData.dto.deliveryAdjFee) + '원';
								//$this.find("#result_delivery_price").hide();
							};

							if (jsonData.dto.deliveryAdjFee != null && jsonData.dto.deliveryAdjFee > 0) {
								$this.find("#result_deliveryFeeFlag").text(result_deliveryFeeFlag);
							} else {
								$this.find("#result_deliveryFeeFlag").text('');
							}

							$this.find("#result_delivery_price").text(deliveryAdjFee);
							$this.find("#result_payment_btn").attr('data-repaired-number', jsonData.dto.repairNumber); //결제버튼
							$this.find("#result_payment_btn").attr('data-repairid', jsonData.dto.repairId); //repairId
							// $this.find("#result_payment_btn").attr('data-reparired-amount',jsonData.dto.asAdjPrice);   //결제금액

							//환불계좌 입력 버튼
							if ((repaired_status == "REFUND_READY") || (repaired_status == "REFUND_PROCESS" && jsonData.dto.accountNum == null)) {
								$this.find("#payment-return_btn").removeClass('uk-hidden');
								$this.find("#refund_text").show();    //환불 안내 메세지.
								$this.find("#btn_submit").hide();     //확인버튼 감추기
							} else {
								$this.find("#payment-return_btn").addClass('uk-hidden');
								$this.find("#refund_text").hide();
							};

							//결제 버튼, 결제 방법........
							if (repaired_status == "PENDING") {
								$this.find("[data-order-tab]").removeClass('uk-hidden');   //결제방법..
								$this.find("#result_payment_btn").removeClass('uk-hidden');
							} else {
								$this.find("[data-order-tab]").addClass('uk-hidden');
								$this.find("#result_payment_btn").addClass('uk-hidden');
							};

							//환불정보창  DIV_REFUND_PROCESS
							if ((repaired_status == "REFUND_PROCESS" && jsonData.dto.accountNum != null) || (repaired_status == "REFUND_COMPLETE")) {
								(jsonData.dto.accountName != null) ? $this.find("#result_accountName").text(result_repairReason(jsonData.dto.accountName)) : ''; //환불정보 ,은행
								$this.find("#result_ownerName").text(result_text(1, jsonData.dto.ownerName)); //이름
								$this.find("#result_accountNum").text(result_text(5, jsonData.dto.accountNum)); //계좌
								$this.find("#result_refundAmount").text(result_price(jsonData.dto.refundAmount) + '원'); //금액
								$this.find("#DIV_REFUND_PROCESS").show();
							} else {
								$this.find("#DIV_REFUND_PROCESS").hide();
							}

						} else {
							UIkit.modal.alert(jsonData.result);
						};
					});

				});

				//as취소
				$this.find("a[data-repaired-cancel]").on('click', function () {

					var per_url = "repaired/cancel";
					var obj = "repairNumber=" + $(this).attr('data-repaired-cancel');

					Core.Utils.ajax(per_url, 'get', obj, function (data) {
						var jsonData = Core.Utils.strToJson(data.responseText, true) || {};

						if (jsonData.result == true) {
							UIkit.modal.alert(jsonData.result);
							location.href = 'repaired';
						} else {
							UIkit.modal.alert(jsonData.result);
						}
					});
				});

			}
		}
		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-repaired-list]',
					attrName: 'data-module-repaired-list',
					moduleName: 'module_repaired_list',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);



(function (Core) {     //  신청조회 모달창   (/account/repaired_detail_pop)
	Core.register('module_repairable_pop', function (sandbox) {
		var Method = {

			moduleInit: function () {
				var $this = $(this);

				//주소변경....
				$this.find('[data-repairaddr-chk-btn]').on('click', function (e) {

					var ix = $("[data-repairaddr-chk-btn]").index(this);   //저장 버튼 index
					var $form1 = $this.find($(this).attr('data-repairaddr-chk-btn'));
					var str_text = $(this).text();
					var jq_obj = $(this).attr('jq_obj');  // 1,2

					if (str_text == "주소변경") {
						$this.find("li#jq_h_tab").eq(ix).removeClass('uk-hidden');
						$(this).text('변경확인');
					} else {

						if ($this.find("[aria-expanded]").eq(jq_obj).attr('aria-expanded') == 'true') {   //이전주소면....
							$this.find("li#jq_h_tab").eq(ix).addClass('uk-hidden');
							$(this).text('주소변경');

						} else {  // 새로입력...

							sandbox.validation.init($form1);
							e.preventDefault();
							sandbox.validation.validate($form1);

							if (sandbox.validation.isValid($form1)) {

								//배송 메세지 hidden....
								if (ix == 0) {	    //수거지 배송 메모저장..
									if ($this.find('#selectPersonalMessage option:selected').eq(0).text() == '직접입력') {
										$this.find('#r_personalMessage').val($this.find('input#personalMessageText').eq(0).val());
									} else if ($this.find('#selectPersonalMessage option:selected').eq(0).val() != '') {
										var r_msg = $this.find('#selectPersonalMessage option:selected').eq(0).text();
										$this.find('#r_personalMessage').val(r_msg);
									}

									if ($this.find("#receiveAddressPostalCode").val() == "") {
										UIkit.modal.alert("검색을 통하여 배송지를 입력해주세요.");
										return;
									}

								} else {	//받는분 배송 메모저장..
									if ($this.find('#selectPersonalMessage option:selected').eq(1).text() == '직접입력') {
										$this.find('#d_personalMessage').val($this.find('input#personalMessageText').eq(1).val());
									} else if ($this.find('#selectPersonalMessage option:selected').eq(1).val() != '') {
										var d_msg = $this.find('#selectPersonalMessage option:selected').eq(1).text();
										$this.find('#d_personalMessage').val(d_msg);
									}

									if ($this.find("#deliveryAddressPostalCode").val() == "") {
										UIkit.modal.alert("검색을 통하여 배송지를 입력해주세요.");
										return;
									}
								}

								var per_url = "repaired/updateAddress";
								var obj = $form1.serialize();

								//	 console.log(obj);

								Core.Utils.ajax(per_url, 'POST', obj, function (data) {
									var jsonData = Core.Utils.strToJson(data.responseText, true) || {};

									if (jsonData.result == true) {
										UIkit.modal.alert('저장 되었습니다.').on('hide.uk.modal', function () {
											sandbox.setLoadingBarState(true);
											location.reload();
										});

										// location.href = 'repaired';
									} else {
										UIkit.modal.alert(jsonData.result);
									}
								});
							};
						};
					};
				});

				//수정
				var deliverySearch = sandbox.getComponents('component_searchfield', { context: $this, selector: '.search-field', resultTemplate: '#address-find-list' }, function () {

					this.addEvent('resultSelect', function (data) {
						if ($("[aria-expanded]").eq(1).attr('aria-expanded') == 'true') {
							var zipcode = $(data).data('zip-code5');
							$("#receiveAddressPostalCode").val(zipcode);
						}

						if ($("[aria-expanded]").eq(3).attr('aria-expanded') == 'true') {
							var zipcode = $(data).data('zip-code5');
							$("#deliveryAddressPostalCode").val(zipcode);
						}
					});
				});

			}
		}
		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-repairable-pop]',
					attrName: 'data-module-repairable-pop',
					moduleName: 'module_repairable_pop',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);



//환불입력창 click.....validation chk

(function (Core) {
	Core.register('module_refund_form', function (sandbox) {
		var Method = {

			moduleInit: function () {
				var $this = $(this);
				var $that = $("#refund-step2");   // 환불요청 확인창...
				var $form = $this.find('#refund_from');
				sandbox.validation.init($form);

				$this.find('[refund_send_btn]').on('click', function (e) {       //환불창 OPEN...

					e.preventDefault();
					sandbox.validation.validate($form);

					if (sandbox.validation.isValid($form)) {

						var ownerName = $this.find("#ownerName").val();   //예금주
						var accountName = $this.find("#accountCode option:selected").text();  //은팽명
						var accountCode = $this.find("#accountCode option:selected").val(); //은팽코드
						var accountNum = $this.find("#accountNum").val();  //계좌
						var refundAmount = $this.find("#str_refundAmount").val().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");   //환불금액

						//$this.find("#str_repairNumber").val(repairNumber);
						$this.find("#str_accountName").val(accountName);
						$that.find("#txt_refundAmount").text(refundAmount + '원');
						$that.find("#txt_ownerName").text(ownerName);
						$that.find("#txt_accountName").text(accountName);
						$that.find("#txt_accountNum").text(accountNum);

						UIkit.modal('#refund-step2').show();
					};
				});

				Method.$popAddressModal = UIkit.modal("#refund-etc", { modal: false });

				$this.find('[data-modal-btn]').on('click', function (e) {       //개인정보 자세히 보기...
					e.preventDefault();
					Method.$popAddressModal.show();
				});

				//환불계좌 숫자만 입력
				$this.find('#accountNum').on('keyup', function (e) {
					$(this).val($(this).val().replace(/[^0-9]/g, ""));
				});


				//환불창 submit
				$that.find('[refund_send_btn]').on('click', function (e) {

					param = $this.find('#refund_from').serialize();
					console.log(param);

					Core.Utils.ajax('repaired/refundInfo', 'post', param, function (data) {
						var jsonData = Core.Utils.strToJson(data.responseText, true) || {};

						if (jsonData.result == true) {
							UIkit.modal.alert('환불 요청이 완료되었습니다.').on('hide.uk.modal', function () {
								endPoint.call('clickEvent', { 'area': 'mypage', 'name': 'as status: bank account for refund: confirm alert (auto)' });
								sandbox.setLoadingBarState(true);
								location.reload();
							});
						} else {
							UIkit.modal.alert(jsonData.result);
						}
					});
				});


			}
		}

		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-refund-form]',
					attrName: 'data-module-refund-form',
					moduleName: 'module_refund_form',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);


// 수선비 결제  진행....
(function (Core) {
	Core.register('module_repared_payment', function (sandbox) {
		var endPoint;
		var Method = {
			$that: null,
			$submitBtn: null,
			$usafeContent: null,
			$agreeForm: null,
			moduleInit: function () {
				var args = Array.prototype.slice.call(arguments).pop();
				$.extend(Method, args);

				endPoint = Core.getComponents('component_endpoint');

				var $this = $(this);
				Method.$that = $this;
				Method.$submitBtn = $this.find('[data-checkout-btn]');
				Method.$submitBtn.on("click", Method.checkout);
				$this.find('[data-payment-method]').find('.payment-method-item-title').on('click', Method.changePaymentMethod);
				$this.find('[data-cod-btn]').on("click", Method.codCheckout);

				$(document).on('click', '.payment-method-item-title', Method.changePaymentMethod_1);  //payment 종류 선택.

				//	 sandbox.validation.init( $this );
				//회원정보 셋팅
				var member_data = sandbox.getModule('module_header').getCustomerInfo();
				sfirstName = member_data.firstName;
				sphoneNumber = member_data.phoneNumber;
				semailAddress = member_data.emailAddress;
			},

			checkout: function (e) {
				e.preventDefault();
				$(this).attr("enabled")
				//var isCheckoutAgree = Method.$that.find('[name="isCheckoutAgree"]').is(':checked');
				var _self = $(this);

				// 결제 방법에 따른 처리
				var $activeItem = Method.$that.find("[data-payment-method]").find(".payment-method-item.active");

				//카카오 페이 chk...
				var payMethodParam = '';

				if (Method.$that.find("[data-payment-method]").find(".payment-method-item.active").data("type") == 'KAKAO_POINT') {
					payMethodParam = '?pay_method=point';
				}
				
				// PAYCO 2019-08-12
				if (Method.$that.find("[data-payment-method]").find(".payment-method-item.active").data("type") == 'PAYCO') {
					payMethodParam = '?pay_method=payco';
				}

				// NAVER_PAY 2020-09-08
				if (Method.$that.find("[data-payment-method]").find(".payment-method-item.active").data("type") == 'NAVER_PAY') {
					payMethodParam = '?pay_method=naver_pay';
				}

				var paymentType = $activeItem.data('paymenttype');   //pay_method
				var provider = $activeItem.data('provider');   //provider
				var repair_id = Method.$that.find("#result_payment_btn").attr('data-repairid');   //repairId
				var repairNumber = Method.$that.find("#result_payment_btn").attr('data-repaired-number');   //repairNumber

				sandbox.utils.promise({
					url: sandbox.utils.contextPath + '/account/repairCheckout?repairNumber=' + repairNumber + '&repair_id=' + repair_id + '&paymentType=' + paymentType + '&provider=' + provider,
					//url:sandbox.utils.contextPath + '/checkout/request'+payMethodParam,
					type: 'GET'
				}).then(function (data) {  //....
					sandbox.setLoadingBarState(true);
					if (data.result == true) {
						var paymentType = ($activeItem.length > 0) ? $activeItem.data("type") : null;
						reparired_amount = data.totalAmount.amount;  //결제금액
						// 결제 완료 상태 일때
						if (_self.data('checkout-btn') == 'complete') {
							_self.closest('form').submit();
							return;
						}
						//iamport 모듈..
						if ($activeItem.data('provider') == 'IAMPORT') {
							Method.checkoutIamport($activeItem, data.total_amount);
						}
					} else {
						sandbox.setLoadingBarState(false);


					}
				}).fail(function (msg) {
					sandbox.setLoadingBarState(false);
					UIkit.notify(msg, { timeout: 3000, pos: 'top-center', status: 'danger' });
					//	Method.updateSubmitBtn( true );
				});
			},

			// payment 정보 선택시
			changePaymentMethod_1: function (e) {
				e.preventDefault();
				var $item = $(this).closest('.payment-method-item');
				if (!$item.hasClass('active')) {
					$item.siblings().removeClass('active');
					$item.addClass('active');
				}
			},

			checkoutIamport: function ($activeItem, totalAmount) {
				// 결제 전일때
				var $orderinfo = $("#orderinfo-review");
				var $shippingInfo = $("#shipping-review");
				var $priceInfo = $("#order-summary");

				var IMP = window.IMP;


				var paymentMethod = $activeItem.data("method"); // 결제 수단
				var mRedirectUrl = $activeItem.data("m-redirect-url"); // 모바일 url
				var noticeUrl = $activeItem.data("notice-url"); // 노티피케이션 url
				var version = $activeItem.data("version") || 'old'; // 에스크로 분기 처리를 위한 값  new or old
				var escrow = $activeItem.data("escrow"); // 에스크로 사용 여부
				var identityCode = $activeItem.data("identity-code");       //IMP-CODE
				var appScheme = $activeItem.data("app-scheme"); // 모바일 앱 스키마 정보
				var pg = $activeItem.data("pg");

				var useReplaceReturnUrl = false;
				var cUrl = Core.Utils.url.getCurrentUrl();

				// 접근한 URL이 mshop 일 때
				if (cUrl.indexOf('www.nike') > -1) {
					useReplaceReturnUrl = true;
				} else {
					// 접근한 URL이 mshop 이 아닌데 deviceOs 가 ios 일때
					if (String(Core.Utils.url.getQueryStringParams(cUrl).deviceOs).toLowerCase() == 'ios') {
						useReplaceReturnUrl = true;
					}
				}

				if (useReplaceReturnUrl) {
					if (mRedirectUrl != null) {
						mRedirectUrl = mRedirectUrl.replace('m.nike', 'www.nike');
					}
				}

				if (Core.Utils.contextPath == '/kr/launch') {
					if (mRedirectUrl != null) {
						mRedirectUrl = mRedirectUrl.replace('/kr/ko_kr', '/kr/launch');
					}
				}

				if (paymentMethod == '' || identityCode == '' || pg == '') {
					UIkit.modal.alert('결제 수단 정보로 인한 문제가 발생하였습니다.<br/>고객센터(' + _GLOBAL.SITE.TEL + ')로 문의 주시면 신속히 처리 도와드리겠습니다.');
					return;
				}

				var $orderList = $priceInfo.find('[data-order]');
				var name = "나이키";
				if ($orderList.length > 1) {
					name += ' 외 ' + ($orderList.length - 1);
				}

				var buyerName = $.trim($orderinfo.find('[data-name]').data('name')) || $shippingInfo.find('[data-name]').data('name');
				//var reparired_amount   = Method.$that.find("#result_payment_btn").attr('data-reparired-amount');  //수선비
				var repairId = Method.$that.find("#result_payment_btn").attr('data-repairid');       //repairId
				var repaired_number = Method.$that.find("#result_payment_btn").attr('data-repaired-number');   //repair-number

				IMP.init(identityCode);

				param = {
					//pay_method : _GLOBAL.PAYMENT_TYPE_BY_IAMPORT[ paymentMethod ], // 추후 provider 에 따라 변수변경 *서버에서 내려오고 있음
					pg: pg,
					pay_method: paymentMethod, // 추후 provider 에 따라 변수변경
					merchant_uid: repairId + '_' + new Date().getTime(),
					name: "A/S비용 결제",
					amount: reparired_amount,     //결제금액
					buyer_email: semailAddress,
					//buyer_name:$orderinfo.find('[data-email]').data('email'),
					buyer_name: sfirstName,
					buyer_tel: sphoneNumber,
					buyer_addr: "서울특별시",
					buyer_postcode: "03470",
					m_redirect_url: mRedirectUrl,
					app_scheme: "undefined",
					notice_url: noticeUrl,
					repairId: repairId,
					bypass: { acceptmethod: "SKIN(#111)" }
				};

				var depositPeriod = $activeItem.find('[name="depositPeriod"]').val() || 2;

				if (paymentMethod == 'vbank') {
					param.vbank_due = moment().add(depositPeriod, 'day').format('YYYYMMDD2359');
					param.custom_data = $activeItem.find('form').serialize().replace(/=/gi, ':').replace(/&/gi, '|');
				}

				if (escrow == true) {
					param.escrow = true;
				}

				IMP.request_pay(param, function (rsp) {
					//결제 완료시
					if (rsp.success) {
						var msg = '결제가 완료되었습니다.<br>';
						msg += '고유ID : ' + rsp.imp_uid + '<br>';
						msg += '상점 거래ID : ' + rsp.merchant_uid + '<br>';
						msg += '결제 금액 : ' + rsp.paid_amount + '<br>';
						msg += 'custom_data : ' + rsp.custom_data + '<br>';

						if (rsp.pay_method === 'card') {
							msg += '카드 승인번호 : ' + rsp.apply_num + '<br>';
						} else if (rsp.pay_method === 'vbank') {
							msg += '가상계좌 번호 : ' + rsp.vbank_num + '<br>';
							msg += '가상계좌 은행 : ' + rsp.vbank_name + '<br>';
							msg += '가상계좌 예금주 : ' + rsp.vbank_holder + '<br>';
							msg += '가상계좌 입금기한 : ' + rsp.vbank_date + '<br>';
						}
						//alert( msg );
						sandbox.setLoadingBarState(true);

						if (rsp.pg_provider == 'kakaopay') {
							rsp.pay_method = 'point';
						}

						_.delay(function () {
							location.href = sandbox.utils.contextPath + '/repairCheckout/iamport-checkout/repair/hosted/return?merchant_uid=' + rsp.merchant_uid + '&imp_uid=' + rsp.imp_uid + '&pay_method=' + rsp.pay_method + '&custom_data=' + rsp.custom_data;
						}, 3000);

					} else {

						//실패 메시지에 따라 그냥 넘길것인지 어떤 액션을 취할것인지 확인
						//var msg = '결제에 실패하였습니다.' + '<br>';
						//msg += '에러내용 : ' + rsp.error_msg + '<br>';
						//UIkit.modal.alert(rsp.error_msg);

						sandbox.setLoadingBarState(false);

						if (rsp.error_msg == '결제를 취소하셨습니다') {
							endPoint.call('orderCancel');
						}

						UIkit.modal.alert(rsp.error_msg).on('hide.uk.modal', function () {
							sandbox.setLoadingBarState(true);
							//		var cartId = Method.$that.find("input[name='cartId']").val();
							location.href = sandbox.utils.contextPath + '/account/repaired';
						});
						//alert( msg );
					}
				});


			}
		}

		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-repared-payment]',
					attrName: 'data-module-repared-payment',
					moduleName: 'module_repared_payment',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);





// repairable  as신청 검색 필터
(function (Core) {
	Core.register('module_date_filter1', function (sandbox) {
		var Method = {
			$that: null,
			moduleInit: function () {
				var $this = $(this);
				Method.$that = $this;
				Method.$start = Method.$that.find('#start-date');
				Method.$end = Method.$that.find('#end-date');

				$this.find('[data-date-list] a').on('click', function () {
					var value = $(this).data('date').split(',');

					if (value[0] == "M" && value[1] == "-1") {   //1개월은 바로 이동.
						window.location.href = "repairable?dateType=1";
						return;
					};

					if (value != '') {
						Method.searchSubmit(moment().add(value[1], value[0]).format('YYYYMMDD'), moment().format('YYYYMMDD'), $(this).index());
					} else {
						window.location.href = "repairable";
					}
				});

				$this.find('[data-search-btn]').on('click', function () {
					if (Method.getValidateDateInput()) {

						var today = new Date();   //오늘 날짜 가져오기
						var dd = today.getDate();
						var mm = today.getMonth() + 1; //January is 0!
						var yyyy = today.getFullYear();
						if (dd < 10) {
							dd = '0' + dd
						}
						if (mm < 10) {
							mm = '0' + mm
						}
						str_today = yyyy + '-' + mm + '-' + dd;

						var start = Method.$start.val().toString();
						var end = Method.$end.val().toString();
						var date_chk = Method.dateDiff(moment(start, 'YYYY.MM.DD').format('YYYY-MM-DD'), str_today);  //2년 체크..
						//alert( start );
						//alert( moment(start, 'YYYYMMDD') );
						//alert( moment(start, 'YYYY.MM.DD').format('YYYYMMDD'));

						if (!date_chk) {
							UIkit.modal.alert('조회기간은 최대 2년 이내로 자료가 조회 가능합니다.');
							return;
						}

						Method.searchSubmit(moment(start, 'YYYY.MM.DD').format('YYYYMMDD'), moment(end, 'YYYY.MM.DD').format('YYYYMMDD'), 'detail');

					} else {
						UIkit.modal.alert('기간을 선택해 주세요!');
					}
				});


				// 초기화
				$this.find('[data-reset-btn]').on('click', Method.reset);

				// uikit datepicker module 적용
				$this.find('input[class="date"]').each(function () {
					if (!moment($(this).val(), 'YYYY.MM.DD').isValid()) {
						$(this).val('');
					}
					if ($.trim($(this).val()) != '') {
						$(this).val(moment($(this).val(), 'YYYYMMDD').format('YYYY.MM.DD'));
					}
					var datepicker = UIkit.datepicker($(this), {
						maxDate: true,
						format: 'YYYY.MM.DD'
					});

					datepicker.on('hide.uk.datepicker', function () {
						$(this).trigger('focusout');
						Method.updateDateInput();
					})
				})
			},

			dateDiff: function (_date1, _date2) {
				var diffDate_1 = _date1 instanceof Date ? _date1 : new Date(_date1);
				var diffDate_2 = _date2 instanceof Date ? _date2 : new Date(_date2);

				diffDate_1 = new Date(diffDate_1.getFullYear(), diffDate_1.getMonth() + 1, diffDate_1.getDate());
				diffDate_2 = new Date(diffDate_2.getFullYear(), diffDate_2.getMonth() + 1, diffDate_2.getDate());

				var d = true;
				var diff = Math.abs(diffDate_2.getTime() - diffDate_1.getTime());
				diff = Math.ceil(diff / (1000 * 3600 * 24));

				if (diff > 730) {
					d = false;
				}
				return d;
			},
			// 앞보다 뒤쪽 날짜가 더 뒤면 두값을 서로 변경
			updateDateInput: function () {
				var start = String(Method.$start.val());
				var end = String(Method.$end.val());

				if ($.trim(start) == '' || $.trim(end) == '') {
					return;
				}

				// 같다면
				//var isSame = moment(Method.$start.val()).isSame(Method.$end.val());
				// 작다면
				//var isBefore = moment(Method.$start.val()).isBefore(Method.$end.val());
				// 크다면

				var isAfter = moment(start, 'YYYY.MM.DD').isAfter(moment(end, 'YYYY.MM.DD'));

				if (isAfter) {
					var temp = Method.$end.val();
					Method.$end.val(Method.$start.val());
					Method.$start.val(temp);
				}
			},
			getValidateDateInput: function () {
				var start = String(Method.$start.val());
				var end = String(Method.$end.val());

				if (moment(start, 'YYYY.MM.DD').isValid() && moment(end, 'YYYY.MM.DD').isValid()) {
					return true;
				}
				return false;
			},
			searchSubmit: function (start, end, type) {
				var url = sandbox.utils.url.getCurrentUrl();
				url = sandbox.utils.url.removeParamFromURL(url, 'dateType');

				// 전체 검색
				if (_.isUndefined(start)) {
					url = sandbox.utils.url.removeParamFromURL(url, 'stdDate');
					url = sandbox.utils.url.removeParamFromURL(url, 'endDate');
				} else {
					var opt = {
						stdDt: start,
						endDt: end,
						dateType: type
					}

					url = sandbox.utils.url.appendParamsToUrl(url, opt)
				}

				window.location.href = url;

			},
			reset: function () {
				Method.$start.val('').trigger('focusout');
				Method.$end.val('').trigger('focusout');
			}
		}
		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-date-filter1]',
					attrName: 'data-module-date-filter1',
					moduleName: 'module_date_filter1',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);

// as신청조회 1개월로 날자 셋팅,링크
(function (Core) {
	Core.register('module_repair_menu', function (sandbox) {
		var Method = {

			moduleInit: function () {
				var $this = $(this);

				$this.find('#reapir_sch_btn').on('click', function (e) {

					var n = "1";    //1개월.
					var m = "0";
					var date = new Date();
					var start = new Date(Date.parse(date) - n);
					var today = new Date(Date.parse(date) - m * 1000 * 60 * 60 * 24);

					if (n < 10) {
						start.setMonth(start.getMonth() - n);
					}
					var yyyy = start.getFullYear();
					var mm = start.getMonth() + 1;
					var dd = start.getDate();

					var t_yyyy = today.getFullYear();
					var t_mm = today.getMonth() + 1;
					var t_dd = today.getDate();

					//  샘플... stdDt=20180918&endDt=20181018&dateType=1
					stdDt = yyyy + '' + addzero(mm) + '' + addzero(dd);
					endDt = t_yyyy + '' + addzero(t_mm) + '' + addzero(t_dd);
					window.document.location.href = "/kr/ko_kr/account/repairable?stdDt=" + stdDt + "&endDt=" + endDt + "&dateType=1";
					return;
				});

				function addzero(n) {
					return n < 10 ? "0" + n : n;
				}

			}
		}
		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-repair-menu]',
					attrName: 'data-module-repair-menu',
					moduleName: 'module_repair_menu',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);

(function (Core) {
	Core.register('module_sleeping_customer', function (sandbox) {
		var $this;
		var Method = {
			moduleInit: function () {
				var args = Array.prototype.slice.call(arguments).pop();
				$.extend(Method, args);
				var $this = $(this);
				$this.find('[data-btn-change-sleeping-section]').on("click", Method.changeSleepCustomerState);
			},
			changeSleepCustomerState:function(e){
				e.preventDefault();
				var encodeUrl = $('input[data-input-encode-url]').val();
				var toUrl = $('input[data-input-to-url]').val();
				//console.log('encodeUrl: ', encodeUrl);
				//return;
				$.ajax({
					type: "GET",
					url: Core.Utils.contextPath + "/support/activateAccount/" + encodeUrl,
					data: {},
					success: function (data) {
						UIkit.modal.alert('계정이 복원되었습니다.<br/>이제부터 정상적으로 서비스를 이용하실 수 있습니다.').on('hide.uk.modal', function () {
							window.location.replace(sandbox.utils.contextPath + toUrl);
						});
					},
					error: function (e) {
						UIkit.modal.alert('계정 복원에 실패 하였습니다.<br/>3회 이상 실패시 고객센터로 연락바랍니다.').on('hide.uk.modal', function () {
							window.location.reload();
						});
					}
				});
			}
		}

		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-sleeping-customer]',
					attrName: 'data-module-sleeping-customer',
					moduleName: 'module_sleeping_customer',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);

// 추천 상품일 경우 해당 장바구니, 주문완료 된 상품의 modelCode 태깅 요청

(function(Core){
	Core.register('module_crosssale', function(sandbox){
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var md = _GLOBAL.MARKETING_DATA();
				$this.find('[data-crosssale-chk]').on('click', function(e){
					e.preventDefault();
					var str_modelCode 	= "";     // 장바구니,주문완료된 상품 스타일코드 넣을 변수,
					var product_linkUrl = $(this).attr('date-linkUrl');   // 클릭한 상품 랜등 url
					var per_url			= "";   // 상품url + model 조합된 최종 변수
					//장부구니와 주문완료 페이지 에서만 태깅이 필요
					if(md.pageType=="cart"){
						$(".product-opt_cart").each(function(index){
							str_modelCode  = str_modelCode + $(this).find('div [data-model]').data('model') +",";
						});
					}else if(md.pageType=="confirmation"){
						$.each(md.itemList, function(index,data){
							str_modelCode  = str_modelCode + data.model +",";
						});
					}
					str_modelCode 	= str_modelCode.substr(0, str_modelCode.length -1);
					per_url			= product_linkUrl +'?fm=cs&modelCode='+str_modelCode;
					$(location).attr('href', per_url);
				});
			}
		}
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-crosssale]',
					attrName:'data-module-crosssale',
					moduleName:'module_crosssale',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_order_payment', function(sandbox){
		var endPoint, isOrder = false, inflowUrl= null, inflowParam = null, liveCommerceBroadCastId = null, liveCommerceOrderCallbackId = null;
		var Method = {
			$that:null,
			$submitBtn:null,
			$usafeContent:null,
			$agreeForm:null,
			moduleInit:function(){
				var $this = $(this);
				var args = Array.prototype.slice.call(arguments).pop();
				//as 진행 현황 에서 스크립트 오류 발생.
				if(args.orderEntryTime != undefined){
				        var orderEntryReplaceTime = args.orderEntryTime.replace(/-/g, '/').replace(/\.+[0-9]*/, '');
				}
				var orderEntryTime = (args.orderEntryTime !== 'null') ? new Date(orderEntryReplaceTime).getTime() : new Date(args.currentTime).getTime();
				var limitTime = (args.limitTime !== 'null') ? (orderEntryTime + (args.limitTime*1000)) : orderEntryTime;
				var currentTime = new Date(args.currentTime).getTime();

				$.extend(Method, args);
				endPoint = Core.getComponents('component_endpoint');

				inflowUrl = sessionStorage.getItem('AFFILIATE_INFLOW_URL');
				inflowParam = sessionStorage.getItem('AFFILIATE_INFLOW_PARAM');

				liveCommerceBroadCastId = sessionStorage.getItem('LIVE_COMMERCE_INFLOW_BROADCAST_ID');
				liveCommerceOrderCallbackId = sessionStorage.getItem('LIVE_COMMERCE_INFLOW_ORDERCALLBACK_ID');

				Method.$that = $this;
				Method.$submitBtn = $this.find('[data-checkout-btn]');
				Method.$submitBtn.on("click", function(e){
					e.preventDefault();
					if(isOrder){
						Method.checkout.call(this, e);
					}
				});

				if(limitTime > currentTime){
					console.log(limitTime - currentTime);
					isOrder = false;
					setTimeout(function(){
						isOrder = true;
						Method.$submitBtn.removeClass('disabled');
					}, (limitTime - currentTime <= 0) ? 0 : limitTime - currentTime);
				}else{
					isOrder = true;
					Method.$submitBtn.removeClass('disabled');
				}

				$this.find('[data-payment-method]').find('.payment-method-item-title').on('click', Method.changePaymentMethod);
				$this.find('[data-cod-btn]').on("click", Method.codCheckout );

				/*
					Method.$agreeForm = $this.find('form[name="checkout-agree-form"]');
					sandbox.validation.init( Method.$agreeForm );
				*/

				Method.$usafeContent = $this.find('[data-usafe-content]');

				sandbox.getComponents('component_radio', {context:$this}, function(i){
					this.addEvent('change', function(target, val){
						if( $(this).attr('name') == 'usafeIsAgree'){
							Method.toggleUsafeContent( val == "true" );
						}
					});
				});
			},

			toggleUsafeContent:function($bool){
				if( $bool ){
					Method.$usafeContent.show();
				}else{
					Method.$usafeContent.hide();
				}
			},

			// payment 정보 선택시
			changePaymentMethod:function(e){
				e.preventDefault();
				var $item = $(this).closest('.payment-method-item');
				endPoint.call('changePaymentMethod', {paymentType: $item.data('type')});
				
				if(!$item.hasClass('pausable')){
					if(!$item.hasClass('active')){
						$item.siblings().removeClass('active');
						$item.addClass('active');
					}
				}
			},

			updateSubmitBtn:function( $bool ){
				if( $bool ){
					Method.$submitBtn.removeAttr('disabled').removeClass('disabled');
				}else{
					Method.$submitBtn.attr('disabled','true').addClass('disabled');
				}
			},

			checkout:function(e){
				e.preventDefault();
				$(this).attr("enabled")
				var isCheckoutAgree = Method.$that.find('[name="isCheckoutAgree"]').is(':checked');
				var _self = $(this);

				// 결제 방법에 따른 처리
				var $activeItem = Method.$that.find("[data-payment-method]").find(".payment-method-item.active");
				// 무통장일때
				if( $activeItem.data("type") == 'WIRE' ){
					var $form = $activeItem.find('form[name="checkout-useInsureGarantee-form"]');

					// 보증보험 사용할 때
					if( $form.length > 0 ){
						var usafeIsAgree = $activeItem.find('[name="usafeIsAgree"]:checked').val();

						if( usafeIsAgree == 'true'){
							sandbox.validation.init( $form );
							sandbox.validation.reset( $form );

							// 모두 선택 체크하고
							if( sandbox.validation.isValid( $form )){
								// 동의 여부 체크
								if( $activeItem.find('[name="usafeInfoAgree"]:checked').val() == 'false'){
									UIkit.modal.alert("개인정보 이용동의에 동의해주세요");
									return;
								}
							}else{
								return;
							}
						}
					}
				}

				if (_self.data('checkout-btn') == 'payment' && $activeItem.length != 1 ){
					UIkit.modal.alert('결제 수단을 선택해주세요.');
					return;
				}

				if( !isCheckoutAgree ){
					UIkit.modal.alert("상품, 가격, 할인, 배송정보에 동의해주세요");
					return;
				}

				// 네이버페이 최소 결제금액은 100원 이상 가능. 2020-10-14
				var pg = $activeItem.data("pg");
				var $priceInfo = $("#order-summary");

				if( pg == 'naverpay'){
					var checkoutAmount = $priceInfo.find('[data-amount]').data('amount');
					if (parseInt(checkoutAmount) < 100) {
						UIkit.modal.alert('네이버페이 최소 결제금액은 100원 입니다.');
						return;
					}
				}

				/*
					checkoutIamport를 실행하기 전에 checkout-request 에 먼저 결제가 가능한지 체크하고
					상태가 true 일떄 checkoutIamport를 호출한다.
					as-is : checkoutIamport
					to-be : checkoutRequest -> true -> checkoutIamport
				*/

		    	Method.updateSubmitBtn( false );

				if(sandbox.getModule('module_certification') !== null){
					if(!sandbox.getModule('module_certification').getIsAuthenticate()){
						UIkit.modal.confirm('상품 구매 시 본인 인증 완료된 1개의 아이디만 사용 가능합니다.', function(){
							location.href = sandbox.utils.contextPath + '/cart';
						});
						return;
					}
				}

				if(Method.isRecaptcha === 'true'){
					grecaptcha.ready(function(){
						grecaptcha.execute(Method.reCaptchaKey, {action: 'checkout_request'}).then(function(token) {
							// Verify the token on the server.
							Method.checkoutRequest(_self, token,  $activeItem);
						});
					});
				}else{
					Method.checkoutRequest(_self, null,  $activeItem);
				}
			},
			checkoutRequest:function(_self, token, $activeItem){
				var payMethodParam = '';
				var sessionToken = token;
				var paramData = {
					gToken: sessionToken
				}

				if(Method.$that.find("[data-payment-method]").find(".payment-method-item.active").data("type") == 'KAKAO_POINT'){
					payMethodParam = '?pay_method=point';
				}

				if(Method.$that.find("[data-payment-method]").find(".payment-method-item.active").data("type") == 'PAYCO'){ // 2019-08-12
					payMethodParam = '?pay_method=payco';
				}

				if(Method.$that.find("[data-payment-method]").find(".payment-method-item.active").data("type") == 'NAVER_PAY'){ // 2020-09-08
					payMethodParam = '?pay_method=naver_pay';
				}

				if ( !_.isEmpty(inflowUrl) && !_.isEmpty( inflowParam ) ){
					paramData.NIKE_AFFILIATE_INFLOW_URL = inflowUrl
					paramData.NIKE_AFFILIATE_INFLOW_PARAM = inflowParam
				}

				if ( !_.isEmpty(liveCommerceBroadCastId) && !_.isEmpty( liveCommerceOrderCallbackId ) ){
					paramData.orderCallBackId = liveCommerceOrderCallbackId;
					paramData.broadCastId = liveCommerceBroadCastId;
				}

				sandbox.utils.promise({
					url: sandbox.utils.contextPath + '/checkout/request' + payMethodParam,
					data: paramData,
					type: 'GET'
				}).then(function(data){
					sandbox.setLoadingBarState(true);
					if (data.isError == false) {
						var paymentType = ($activeItem.length > 0) ? $activeItem.data("type") : null;

						//보피스 태깅  추가
						var physicaltype = Method.$that.find('[data-physical-type]').data('physical-type');
						endPoint.call("orderSubmit", { 'paymentType': paymentType, 'physicaltype': physicaltype });

						// 결제 완료 상태 일때
						if (_self.data('checkout-btn') == 'complete') {
							_self.closest('form').submit();
							return;
						}

						//iamport 모듈
						if ($activeItem.data('provider') == 'IAMPORT') {
							Method.checkoutIamport($activeItem, data.total_amount);
						}
					} else {
						sandbox.setLoadingBarState(false);
						endPoint.call('paymentError', {message : data._global});
						if (data._global == '선택한 상품의 재고가 없습니다') {
							//custom _customproduct.js 기능 이동 : 분기처리
							var customYN = Core.Utils.customProduct.isCheckoutPaymentCustomProduct();
							if (customYN == 'Y') {//custom 있는 경우
								UIkit.modal.alert(data._global);
							} else {//custom 없는 경우 (기존)
								UIkit.modal.confirm(data._global + '<br/>해당상품의 수량변경 또는 삭제하여야 주문이 가능합니다.<br/>장바구니로 이동하시겠습니까?', function () {
									location.href = sandbox.utils.contextPath + '/cart';
								});
							}
						} else if (data._global == 'error.checkout.snkrs.catalog.product.validate'){
							UIkit.modal.alert('SNKRS 전용 상품입니다. 해당 주문서로 이동합니다.').on('hide.uk.modal', function () {
								Core.Loading.show();
								if (Core.Utils.url.getCurrentUrl().indexOf('www.nike') > -1) {
									location.replace('https://www.nike.com/kr/launch/checkout');
								} else if (Core.Utils.url.getCurrentUrl().indexOf('stg-www') > -1) {
									location.replace('https://stg-www-nike.brzc.kr/kr/launch/checkout');
								} else {
									alert('개발시는 이동 되지 않습니다.');
								}
							})
						} else {
							Method.updateSubmitBtn(true);
							UIkit.modal.alert(data._global);
						}
					}
				}).fail(function (msg) {
					sandbox.setLoadingBarState(false);
					UIkit.notify(msg, { timeout: 3000, pos: 'top-center', status: 'danger' });
					Method.updateSubmitBtn(true);
				});
			},
			codCheckout:function(e){
				e.preventDefault();
				var _self = $(this);

				if(sandbox.getModule('module_certification') !== null){
					if(!sandbox.getModule('module_certification').getIsAuthenticate()){
						UIkit.modal.confirm('상품 구매 시 본인 인증 완료된 1개의 아이디만 사용 가능합니다.', function(){
							location.href = sandbox.utils.contextPath + '/cart';
						});
						return;
					}
				}

				if(Method.isRecaptcha === 'true'){
					grecaptcha.ready(function(){
						grecaptcha.execute(Method.reCaptchaKey, {action: 'checkout_request'}).then(function(token) {
							// Verify the token on the server.
							Method.codCheckoutRequest(_self, token);
						});
					});
				}else{
					Method.codCheckoutRequest(_self, null);
				}
			},
			codCheckoutRequest:function(_self, token){
				var sessionToken = token;
				var paramData = {
					gToken: sessionToken
				}
				if (!_.isEmpty(inflowUrl) && !_.isEmpty(inflowParam)) {
					paramData.NIKE_AFFILIATE_INFLOW_URL = inflowUrl
					paramData.NIKE_AFFILIATE_INFLOW_PARAM = inflowParam
				}

				sandbox.utils.promise({
					url: sandbox.utils.contextPath + '/checkout/request',
					data: paramData,
					type: 'GET'
				}).then(function(data){
				    if(data.isError == false){
						sandbox.setLoadingBarState(true);

            			//ctm  orderSubmit  태깅 추가.
						//var paymentType  = null;
						//var physicaltype = Method.$that.find('[data-physical-type]').data('physical-type');   //PHYSICAL_ROPIS
						//로피스 결제 완료 태깅 추가.
						endPoint.call("ropis_submit_final");

						_self.closest('form').submit();
						return;
				    }else{
						sandbox.setLoadingBarState(false);
						UIkit.modal.alert(data._global);
				    }
				}).fail(function(msg){
					sandbox.setLoadingBarState(false);
					UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
				});
			},
			checkoutIamport:function( $activeItem, totalAmount ){
				// 결제 전일때
				var $orderinfo = $("#orderinfo-review");
				var $shippingInfo = $("#shipping-review");
				var $priceInfo = $("#order-summary");

				var IMP = window.IMP;
				//var in_app = $(frm.in_app).is(':checked');

				//IMP.init('imp29019801');
				//결제 처리 전에 이미 전달해놓은 상품가격 값과 비교해야함
				//$paymentInfo.find("input[name='cartId']").val()

				var paymentMethod = $activeItem.data("method"); // 결제 수단
				var mRedirectUrl = $activeItem.data("m-redirect-url"); // 모바일 url
				var noticeUrl = $activeItem.data("notice-url"); // 노티피케이션 url
				var version = $activeItem.data("version") || 'old'; // 에스크로 분기 처리를 위한 값  new or old
				var escrow = $activeItem.data("escrow"); // 에스크로 사용 여부

				var useReplaceReturnUrl = false;
				var cUrl = Core.Utils.url.getCurrentUrl();

				// 접근한 URL이 mshop 일 때
				if( cUrl.indexOf( 'www.nike' ) > -1 ){
					useReplaceReturnUrl = true;
				}else{
					// 접근한 URL이 mshop 이 아닌데 deviceOs 가 ios 일때
					if( String(Core.Utils.url.getQueryStringParams(cUrl).deviceOs ).toLowerCase() == 'ios' ){
						useReplaceReturnUrl = true;
					}
				}

				if( useReplaceReturnUrl ){
					if( mRedirectUrl != null ){
						mRedirectUrl = mRedirectUrl.replace('m.nike', 'www.nike');
					}
				}

				if (Core.Utils.contextPath == '/kr/launch') {
					if (mRedirectUrl != null) {
						mRedirectUrl = mRedirectUrl.replace('/kr/ko_kr', '/kr/launch');
					}
				}
				
				var appScheme = $activeItem.data("app-scheme"); // 모바일 앱 스키마 정보
				var identityCode = $activeItem.data("identity-code"); // iamport key
				var pg = $activeItem.data("pg");

				if( paymentMethod == '' || identityCode == '' || pg == ''){
					UIkit.modal.alert('결제 수단 정보로 인한 문제가 발생하였습니다.<br/>고객센터('+_GLOBAL.SITE.TEL+ ')로 문의 주시면 신속히 처리 도와드리겠습니다.');
					return;
				}

				IMP.init(identityCode);

				var $orderList = $priceInfo.find('[data-order]');
				var name = $orderList.eq(0).find('[data-name]').data('name');
				
				// naverpay 는 상품명에 "xxxx 외 2개" 와 같은 표현은 사용하지 않습니다. 2020-09-09
				if (pg != 'naverpay') {
					if($priceInfo.find('.order-list').length > 1 ){
						name += ' 외 ' + ($priceInfo.find('.order-list').length-1) +'건';
					}
				}

				// naverpay 파라미터 naverProducts 2020-09-09
				var naverProductsList = [];
				$priceInfo.find('.order-list').each(function(index, data){
					naverProductsList.push({
						categoryType: "PRODUCT",
						categoryId: "GENERAL",
						uid: $(data).find('[data-model]').data('model'),
						name : $(data).find('.order-info').find('[data-name]').data('name'),
						count : parseInt($(data).find('[data-quantity]').data('quantity'))
					});
				})

				// 상품명 중에 " 있을수 있으므로 ' 로 변환,
				name  = name.replace(/"/gi, "'");

				var buyerName = $.trim($orderinfo.find('[data-name]').data('name')) || $shippingInfo.find('[data-name]').data('name');

		    	var param = {
					//pay_method : _GLOBAL.PAYMENT_TYPE_BY_IAMPORT[ paymentMethod ], // 추후 provider 에 따라 변수변경 *서버에서 내려오고 있음
					pg : pg,
					pay_method : paymentMethod, // 추후 provider 에 따라 변수변경
					merchant_uid : Method.$that.find("input[name='cartId']").val() + '_' + new Date().getTime(),
					name: name,
					amount:totalAmount.amount || $priceInfo.find('[data-amount]').data('amount'),
					buyer_email:$orderinfo.find('[data-email]').data('email'),
					//buyer_name:$orderinfo.find('[data-email]').data('email'),
					buyer_name:buyerName,
					buyer_tel:$shippingInfo.find('[data-phone]').data('phone'),
					buyer_addr:$shippingInfo.find('[data-address]').data('address'),
					buyer_postcode:$shippingInfo.find('[data-zipcode]').data('zipcode'),
					m_redirect_url:mRedirectUrl,
					app_scheme:appScheme,
					notice_url:noticeUrl,
					bypass:{acceptmethod:"SKIN(#111)"}
				};

				// naverpay 추가 파라미터 2020-09-09
				if (pg == 'naverpay') {
					// Mobile결제 : Redirection 방식, PC결제 : 팝업방식
					if (Core.Utils.mobileChk) {
						param.naverPopupMode = false;
					} else {
						param.naverPopupMode = true;
					}
					param.naverProducts = naverProductsList;
				}

				var depositPeriod = $activeItem.find('[name="depositPeriod"]').val() || 2;

				if( paymentMethod == 'vbank' ) {
					param.vbank_due = moment().add(depositPeriod, 'day').format('YYYYMMDD2359');
					param.custom_data = $activeItem.find('form').serialize().replace(/=/gi, ':').replace(/&/gi, '|');
				}

				if( escrow == true ){
					param.escrow = true;
				}
				/*
				if( paymentMethod == 'escrow') {
					if( version == 'new'){
						// 신 버전
					    param.pay_method='vbank';
						param.escrow = true;
					}else{
						// 기존 버전
						param.vbank_due = moment().add(depositPeriod, 'day').format('YYYYMMDD2359');
						param.custom_data = 'paymethod:escrow';
						param.escrow = false;
					}
				}
				*/

				// 주문서 결제 모듈이 뜬 상태에서 뒤로 가기 했을시 처리를 위한 쿠키값
				Core.cookie.setCookie("oldCartId", Method.$that.find("input[name='cartId']").val());

				IMP.request_pay(param, function(rsp) {
					//결제 완료시
					if ( rsp.success ) {
						var msg = '결제가 완료되었습니다.<br>';
						msg += '고유ID : ' + rsp.imp_uid + '<br>';
						msg += '상점 거래ID : ' + rsp.merchant_uid + '<br>';
						msg += '결제 금액 : ' + rsp.paid_amount + '<br>';
						msg += 'custom_data : ' + rsp.custom_data + '<br>';

						if ( rsp.pay_method === 'card' ) {
							msg += '카드 승인번호 : ' + rsp.apply_num + '<br>';
						} else if ( rsp.pay_method === 'vbank' ) {
							msg += '가상계좌 번호 : ' + rsp.vbank_num + '<br>';
							msg += '가상계좌 은행 : ' + rsp.vbank_name + '<br>';
							msg += '가상계좌 예금주 : ' + rsp.vbank_holder + '<br>';
							msg += '가상계좌 입금기한 : ' + rsp.vbank_date + '<br>';
						}
						//alert( msg );
						sandbox.setLoadingBarState(true);

						if(rsp.pg_provider == 'kakaopay'){
				         rsp.pay_method = 'point';
				     }

						_.delay(function(){
							location.href = sandbox.utils.contextPath + '/checkout/iamport-checkout/hosted/return?imp_uid=' + rsp.imp_uid + '&pay_method=' + rsp.pay_method + '&custom_data=' + rsp.custom_data;
						}, 3000);

					} else {

						//실패 메시지에 따라 그냥 넘길것인지 어떤 액션을 취할것인지 확인
						//var msg = '결제에 실패하였습니다.' + '<br>';
						//msg += '에러내용 : ' + rsp.error_msg + '<br>';
//						UIkit.modal.alert(rsp.error_msg);

						sandbox.setLoadingBarState(false);

						if( (rsp.error_msg == '사용자가 결제를 취소하셨습니다') || (rsp.error_msg == '[결제포기] 사용자가 결제를 취소하셨습니다')){
							endPoint.call('orderCancel');
						}

						Core.cookie.setCookie("oldCartId", 'none');

						endPoint.call('paymentError', {message : rsp.error_msg});

						UIkit.modal.alert( rsp.error_msg ).on('hide.uk.modal', function() {
							//custom _customproduct.js 기능 이동 : 분기처리
							var customYN = Core.Utils.customProduct.isCheckoutPaymentCustomProduct();
							if(customYN != 'Y'){//custom 없는 경우
								sandbox.setLoadingBarState(true);
								var cartId = Method.$that.find("input[name='cartId']").val();
								location.href = sandbox.utils.contextPath + '/checkout/request/'+ cartId;
							}
						});
						//alert( msg );
					}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-order-payment]',
					attrName:'data-module-order-payment',
					moduleName:'module_order_payment',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

function CustomProductChoice() {
	var customType;
	var externalMainJobCode;
	var externalSubJobCode;
	var customName;
	var price;
	var externalId;
	
	// FB JSY
	var playerFriendlyName;
	var playerName;
	var playerNumber;
	var playerId;
	var showFrontNumber;
	var customLetter;
	
	// PATCH
	var patchFriendlyName;
	var patchImageName;
	var patchXrefId;
	var patchTargetId;
	
}
function CustomProductChoiceData() {
	var key = "";
	var customChoiceOption = new Array(); // 선택한 옵션 정보
	var customChoiceSaveImage = new Array(); // 이미지 정보
	var customChoiceData = ""; // PDP에 선택한 Text 정보
	var customBuyVal=""; // 확매시 확인 정보
}
(function(Core){
	Core.register('module_custom_product', function(sandbox){
		var $this, endPoint;
		var customProduct = null;
		var CustomProductChoiceDataList = new Array(); // 선택한 목록 정보
		var customProductViewSwiper;
		var customImageIndex = 0;
		var shopImageDomain = ""; //cdn shop image domain

		var Method = {
				moduleInit:function(){
					$this = $(this);
					var customProductPdp = $("#custom-modal").attr('data-product-customUse');
					shopImageDomain = $("#custom-modal").attr('data-custom-image-domain');
					if (customProductPdp === 'true') Method.moduleInitPdp(); // PDP 페이지인 경우
					return;
				},
				moduleInitPdp:function(e) {
					// CustomProduct 정보 세팅
					Method.previewSwiperSliderInit();
					//@pck 모바일에서 화면 사이즈 변경에 대응이 안되서 resize 이벤트에 트리거를 추가했습니다.
					$(window).on("resize orientation", function () {
						customProductViewSwiper.update();
					});

					customProduct = Core.Utils.strToJson($("#custom-modal").attr('data-custom-product-dto'));
					
					var customModal = UIkit.modal('#custom-modal', {modal:false}); /* CUSTOM 추가 */
					// 패치 선택버튼
					$('.custom-btn').click(function(e){ 
						var issignin = $(this).data('issignin');
						if(issignin === true){
							e.preventDefault();

							//customProductViewSwiper.update();

							//모달 뷰 내 패치 리스트 용 커스톰 스크롤바 init
							var smoothScrollBar = window.Scrollbar;
							if(typeof smoothScrollBar === "function"){
								smoothScrollBar.initAll({
									alwaysShowTracks: true,
								});
							}

							$('[data-module-custom-product]').removeClass('uk-modal-close');
							customModal.show();
						} else{
							// 로그인 되어 있지 않은 경우 처리
							UIkit.modal.dialog.template = '<div class="uk-modal"><div class="uk-modal-dialog"></div></div>';
							UIkit.modal.confirm('커스텀 서비스 선택을 하기 위해서는 로그인 혹은 나이키 멤버 가입이 필요합니다.', function(){
								Core.Loading.show();
								e.preventDefault();
								Core.getModule('module_header').setModalHide(true).setLogin(function(data){
									location.reload();
								});
							});
							return;
						}
					});

					//PDP Custom 전체 삭제
					$(".custom-product-clear > a.link-text").click(function(){
						console.log("전체 삭제 click", CustomProductChoiceDataList);
						customImageIndex = 0;
						CustomProductChoiceDataList = [];
						$("#idx-selected-option-list").empty();
						$("#idx-custom-product-preview-list").empty();
						$("#idx-custom-product-preview-modal-view").empty();
						$("#idx-custom-product-preview-container").hide();
					});

					//직접 입력 등번호 숫자만 입력 가능하도록 처리
					$('#fbjsy_custom_number').bind('keyup blur', function () {
						$(this).val($(this).val().replace(/[^0-9]/g, ''));
					});

					// 확인 버튼에 대한 처리
					$('[data-module-custom-product]').click(function(e){
						$('[data-module-custom-product]').addClass('uk-modal-close');
						var customChoiceOption = Method.getChoiceData(); // 선택된 옵션에 대한 정보 세팅
						if(customChoiceOption.length > 0) {
							Method.renderingImage(customChoiceOption); // 옵션에 대한 이미지 랜더링
							Method.showPrice(customChoiceOption);
							Method.saveCustomImage(customChoiceOption); // 이미지에 대한 저장 처리
						}else {
							Method.clearAllCurrentChoice();
						}
						customProductViewSwiper.slideTo(0, 0, false);
					});
					// 취소 버튼에 대한 처리
					$('#custom-product-cancel').click(function(e){
						$(this).addClass('uk-modal-close');
						Method.clearAllCurrentChoice();
						customProductViewSwiper.slideTo(0, 0, false);
					});

					// FB JSY 선택시 --> 커스텀 레터링 초기화
					// 커스텀 레터링 입력시 --> 대표선수 선택값 초기화
					if (customProduct.isFbJsyMaskingService && customProduct.customFbjsyMasking.isCustomLetter) {
						$("#fbjsy_custom_player").on("change keyup paste",function() {
							if ($("#fbjsy_custom_player").val() != '') {
								$("#fbjsy_player").val('');
							}
						});
						$("#fbjsy_custom_number").on("change keyup paste",function() {
							if ($("#fbjsy_custom_number").val() != '') {
								$("#fbjsy_player").val('');
							}
						});
						$("#fbjsy_player").on("change",function() {
							if ($("#fbjsy_player").val() != '') {
								$("#fbjsy_custom_payer").val('');
								$("#fbjsy_custom_number").val('');
							}
						});
					}
					// 선택한 데이터 초기화
					$('[custom-product-clear-all]').click(function (e) {
						var customType = $(".custom-product-step.show").data("custom-type");
						if(customType == "fbjsy") {
							$("#fbjsy_player").val('');
							$("#fbjsy_front_number").prop("checked", false);
							$("#fbjsy_custom_player").val('');
							$("#fbjsy_custom_number").val('');
							$('[data-max-length-check]').trigger("input");
							$("#selectPlayer").trigger("click");
						}else if(customType == 'patch') {
							var patchXrefId = $(".custom-product-step.show").data("patch-xref-id");
							$("input:radio[name='patch-radio-"+patchXrefId+"']").prop("checked",false);
						}

						var customChoiceOption = Method.getChoiceData(); // 선택된 옵션에 대한 정보 세팅
						Method.renderingImage(customChoiceOption); // 옵션에 대한 이미지 랜더링
						Method.showPrice(customChoiceOption); // 옵션에 대한 가격 표시

					});
					// 선택 항목 적용
					// 선택 항목 적용 타이밍 onchange로 변경
					$('[custom-product-apply]').on('click keyup blur change input', function(e){
						var targetElement = $(e.target);
						if(targetElement.is("select")){
							if(e.type !== "change"){ return; }
						}
						var customChoiceOption = Method.getChoiceData(); // 선택된 옵션에 대한 정보 세팅
						Method.renderingImage(customChoiceOption); // 옵션에 대한 이미지 랜더링
						Method.showPrice(customChoiceOption); // 옵션에 대한 가격 표시
					});

					// 기타 초기화
					// 이미지 Swiper 처리
					var widthMatch = matchMedia("all and (max-width: 992px)");
					if (Core.Utils.mobileChk || widthMatch.matches) {
						var index = customModal.find('#patch>.customSelection>.input-radio').index();
						customModal.find('#patch>.customSelection').css('width', 156*index);
						/* @pck - 모바일 화면 시 PDP화면에서도 스크롤이 안되는 현상 발생
						$('body').addClass('scrollOff').on('scroll touchmove mousewheel', function(e){
							 e.preventDefault();
						});
						*/
					}

					// Zoomin 초기화
					// 줌 이미지 close
					$('#custom-product-zoom a.zoom-close').on('click', function(){
						$("#custom-product-zoom").hide();
					});

					//product images - zoom-in event 추가
					$('img[data-custom-product-image]').on('click', function(){
						var str_img = $(this).attr('src');
						$('#custom-product-zoom').find('#zoom-img').attr('src', str_img);
						$('#custom-product-zoom').show();
					});

					$('label[name="customCodeModal"]').click(function(event){ 
						// var $thisEle = $(event.target).find('img'); $thisEle.attr('patch-name')
						alert("customCodeModal click");
						//alert($thisEle.attr('patch-name'));
					});

					//이전 다음 버튼 이벤트 정의
					$('.btn-step').on('click', function(e){
						$btnStep = $(this);
						stepLength = $('.custom-product-step').length;
						$('.custom-product-step').each( function(index){
							$customProductStepDiv = $(this);
							if($customProductStepDiv.hasClass('show')){

								//다음
								if($btnStep.hasClass('next')){
									if(index <= $customProductStepDiv.length) {
										$customProductStepDiv.removeClass('show');
										$('.custom-product-step').eq(index + 1).addClass('show');
									}
									if(index == 0) {
										$('.btn-step.prev').addClass('show');
									}
									if((index + 1) >= (stepLength -1)) {
										$('.btn-step.next').addClass('last');
									}
									return false;
								}
								//이전
								if($btnStep.hasClass('prev')){
									$('.btn-step.next').removeClass('last');
									if(index > 0) {
										$customProductStepDiv.removeClass('show');
										$('.custom-product-step').eq(index - 1).addClass('show');
									}
									if(index == 1) {
										$('.btn-step.prev').removeClass('show');
									}
									return false;
								}

							}
						});
					});

					//토글 버튼 이벤트 정의
					$('.toggle_popupdown .icon').on('click', function(e) {
						$('.col.right').toggleClass('hide');
					});

					//input Validation check
					$('[data-max-length-check]').on('input', function(event){
						var el = this;
						var el_ID = $(el).attr('id');
						//직접 입력 대문자만 입력 가능하도록 처리
						if(el_ID == 'fbjsy_custom_player') {
							var tempText = $(this).val().replace(/[^A-Za-z ]/g, '');
							//tempText = tempText.toUpperCase();
							$(this).val(tempText);
						}
						if(el.value.length > el.maxLength){
							el.value = el.value.slice(0, el.maxLength);
						}

						if( (el_ID !== null) && ($("label[for='"+el_ID+"']").length > 0) ){
							$("label[for='"+el_ID+"']").text(el.value.length.toString() + '/' + el.maxLength.toString());
						}
					});
				},
				// 미리보기 이미지 세팅
				settingPreviewImageAndTextData:function(checkedKey) {
					$("#idx-custom-product-preview-modal-view").empty();
					var customImageHtml = "";
					var customChoiceDataHtml ="";
					for (idx=0; idx < CustomProductChoiceDataList.length; idx++) {
						var customData = CustomProductChoiceDataList[idx];
						if (customData.key == checkedKey) {
							customChoiceDataHtml = customData.customChoiceData;
							for (sidx=0; sidx < customData.customChoiceSaveImage.length;sidx++) {
								var customImage = customData.customChoiceSaveImage[sidx];
								customImageHtml += "<li class=\"swiper-slide\" style=\"background-image:url('"+shopImageDomain +customImage+"?gallery')\">";
								customImageHtml += "<span class=\"aria-text\">미리보기 이미지 1</span>";
								customImageHtml += "</li>";
							}
							break;
						}
					}
					$("#idx-custom-product-preview-modal-view").html(customImageHtml);
					$("#idx-selected-option-list").empty();
					$("#idx-selected-option-list").html(customChoiceDataHtml);
				},
				// 패치 모달의 선택된 내용 Clear All
				clearAllCurrentChoice:function() {
					if (customProduct != null && customProduct.customPatches.length > 0) {
						customProduct.customPatches.forEach(function(element, index, array){
							//$("input:radio[name='custom_path_"+element.id+"']").removeAttr("checked");
							$("input:radio[name='patch-radio-"+element.xrefId+"']").prop("checked",false);
						    //console.log(`${array}의 ${index}번째 요소 : ${element.id}`);
						});
					}
					$("#fbjsy_player").val('');
					$("#fbjsy_front_number").prop("checked", false);
					// @pck 퍼블리싱 용 화면 구동 시 해당 조건으로 작동이 안되어 임시로 주석
					//if (customProduct.isFbJsyMaskingService && customProduct.customFbjsyMasking.isCustomLetter) {
					$("#fbjsy_custom_player").val('');
					$("#fbjsy_custom_number").val('');

					$(".custom-product-step").removeClass("show");
					$(".custom-product-step").first().addClass("show");

					$(".btn-step").removeClass("show last")
					$(".btn-step.next").addClass("show");

					$('[data-max-length-check]').trigger("input");

					$("#selectPlayer").trigger("click");
					//}
					var customChoiceOption = Method.getChoiceData(); // 선택된 옵션에 대한 정보 세팅
					Method.renderingImage(customChoiceOption); // 옵션에 대한 이미지 랜더링
					Method.showPrice(customChoiceOption); // 옵션에 대한 가격 표시	
				},
				// 고객이 선택한 Custom Product의 옵션정보를 객체에 세팅함.
				getChoiceData:function() {
					// FB JSY에 대한 처리
					var subCustomChoiceOption = new Array();
					
					var playerId = $("#fbjsy_player").val();
					var player = null;
					var customProductChoice = new CustomProductChoice();

					if(customProduct.customFbjsyMasking != null) {
						var selectCustomType = $("input:radio[name='selectCustomType']:checked").val();
						customProductChoice.customType = 'FBJSY';
						customProductChoice.externalMainJobCode = customProduct.customFbjsyMasking.mainJobCode;
						customProductChoice.externalSubJobCode = customProduct.customFbjsyMasking.subJobCode;
						customProductChoice.customName = customProduct.customFbjsyMasking.friendlyName;
						customProductChoice.price = Number(customProduct.customFbjsyMasking.price);

						if (selectCustomType == 'choice') {
							for (idx = 0; idx < customProduct.customFbjsyMasking.players.length; idx++) {
								var data = customProduct.customFbjsyMasking.players[idx];
								if (data.id == playerId) {
									player = data;
									break;
								}
							}
							if (player != null) {
								customProductChoice.playerFriendlyName = player.name;
								customProductChoice.playerName = player.playerName;
								customProductChoice.playerNumber = player.playerNumber;
								customProductChoice.playerId = player.id;
								customProductChoice.externalId = player.externalId;
								customProductChoice.showFrontNumber = true;
								customProductChoice.customLetter = false;
								subCustomChoiceOption.push(customProductChoice);
							}
						} else if (customProduct.customFbjsyMasking.isCustomLetter && selectCustomType == 'letter') {
							var playerName = $("#fbjsy_custom_player").val();
							var playerNumber = $("#fbjsy_custom_number").val();
							var frontNumber = $("#fbjsy_front_number").is(":checked");
							console.log(frontNumber);
							if (playerName != '' && playerNumber != '') {
								customProductChoice.playerFriendlyName = "CUSTOM_LETTER";
								customProductChoice.playerName = playerName.toUpperCase();
								customProductChoice.playerNumber = playerNumber;
								customProductChoice.playerId = 0;
								customProductChoice.showFrontNumber = (frontNumber == "true" || frontNumber == true) ? true : false;
								customProductChoice.customLetter = true;
								customProductChoice.externalId = 'CUSTOM_LETTER';
								subCustomChoiceOption.push(customProductChoice);
							}
						}
					}
					// PATCH에 대한 처리 - label 클릭 작동 불가로 name에서 id로 DOM select 기준 변경
					for (idx=0; idx < customProduct.customPatches.length; idx++) {
						var data = customProduct.customPatches[idx];
						var patchTargetId = $("input:radio[name='patch-radio-"+data.xrefId+"']:checked").val();
						var patchTarget = null;
						if (patchTargetId > 0) {
							var customProductChoice = new CustomProductChoice();
							customProductChoice.customType = 'PATCH';
							customProductChoice.externalMainJobCode = data.mainJobCode;
							customProductChoice.externalSubJobCode = data.subJobCode;
							// patch Target
							for (sidx=0; sidx < data.patches.length; sidx++) {
								sdata = data.patches[sidx];
								if (patchTargetId == sdata.id) {
									patchTarget = sdata;
									break;
								}
							}
							customProductChoice.customName = data.friendlyName;
							customProductChoice.patchFriendlyName = patchTarget.friendlyName;
							customProductChoice.patchImageName = patchTarget.imageName;
							customProductChoice.patchXrefId = data.xrefId;
							customProductChoice.patchTargetId = data.id;
							customProductChoice.externalId = patchTarget.externalId;
							customProductChoice.price = Number(data.price);
							subCustomChoiceOption.push(customProductChoice);
						}
					}
					return subCustomChoiceOption;
				},
				// 선택된 옵션에 대한 이미지 랜더링을 호출함
				renderingImage:function(choiceOption) {
					parameter = Method.makeParameter(choiceOption);
					var imgElements = $('img[data-custom-product-image]');
					for (idx=0;idx < imgElements.length;idx++) {
						imgElement = imgElements[idx];
						var orgImage = "";
						if(parameter != "") {
							orgImage = $(imgElement).attr("data-product-image");
						}else{
							orgImage = $(imgElement).attr("data-cdn-product-image");
						}
						$(imgElement).attr("src",orgImage+parameter);
					}
				},
				// 이미지 서버에 요청할 parameter 생성
				makeParameter:function(choiceOption) {
					var parameter = "";
					var parameterCount = -1;
					for(idx=0; idx < choiceOption.length;idx++) {
						data = choiceOption[idx];
						parameterCount++;
						if (idx == 0) parameter += "?"; 
						else parameter += "&";
						if (data.customType === 'FBJSY') {
							parameter = "?detailes["+parameterCount+"].type=FBJSY&detailes["+parameterCount+"].subType=BKNAME&detailes["+parameterCount+"].object="+data.playerName;
							parameterCount++;
							parameter += "&detailes["+parameterCount+"].type=FBJSY&detailes["+parameterCount+"].subType=BKNUM&detailes["+parameterCount+"].object="+data.playerNumber;
							parameterCount++;
							if (data.showFrontNumber == true) parameter += "&detailes["+parameterCount+"].type=FBJSY&detailes["+parameterCount+"].subType=FTNUM&detailes["+parameterCount+"].object="+data.playerNumber;
						}
						else if (data.customType === 'PATCH') {
							parameter += "detailes["+parameterCount+"].type=PATCH&detailes["+parameterCount+"].subType="+data.patchTargetId+"&detailes["+parameterCount+"].object="+data.patchImageName;
						}
					}
					parameter = encodeURI(parameter);
					return parameter;
				},
				// custom product Modal에서 확인 버튼 클릭시 이미지 저장
				saveCustomImage:function(choiceOption) {
					parameter = Method.makeParameter(choiceOption);
					var customChoiceSaveImage = new Array();
					for (idx=0; idx < customProduct.saveImages.length; idx++) {
						var saveCallUrl = customProduct.saveImages[idx];
						$.ajax({
							url : saveCallUrl+parameter
							, type : "GET"
							, dataType : "json"
							, contentType : false
							, cache : false
							, processData : false
							, success : function(data, textStatus, jqXHR) {
								if (data.success) {
									customChoiceSaveImage.push(data.url);
									if (idx == customChoiceSaveImage.length) {
										Method.customProductSet(choiceOption,customChoiceSaveImage);
									}
								}
								else {
									alert("실패 하였습니다.");
								}
							}
							, error : function(xhr, err) {
								console.log(err);
							}
						});
					}
				},
				// 확정된 내용에 대해 PDP 페이지에 세팅
				customProductSet:function(choiceOption,customChoiceSaveImage) {
					var customData = new CustomProductChoiceData();
					customData.key = Date.parse(new Date())+"";
					customData.customChoiceOption = choiceOption;
					customData.customChoiceSaveImage = customChoiceSaveImage;
					customData.customChoiceData = null;
					customData.customBuyVal = null;
					
					// PDP에 노출할 문구 생성 
					var customChoiceDataHtml = "";
					{
						var customChoiceData = "";
						var customBuyVal = "";
						var customChoicePrice = "커스텀 비용 : ";
						var totalPrice = 0;
						for (sidx=0; sidx < customData.customChoiceOption.length;sidx++) {
							var localCustomChoiceOption = customData.customChoiceOption[sidx];
							if (sidx != 0) customBuyVal += " , ";
							if (localCustomChoiceOption.customType == 'FBJSY') {
								if (localCustomChoiceOption.customLetter) {
									customChoiceData += "<li>선수명(번호) : "+localCustomChoiceOption.playerName+"("+localCustomChoiceOption.playerNumber+")</li>";
									customBuyVal += "선수명(번호) : "+localCustomChoiceOption.playerName+"("+localCustomChoiceOption.playerNumber+")";
								}
								else {
									customChoiceData += "<li>선수명(번호) : "+localCustomChoiceOption.playerFriendlyName+"("+localCustomChoiceOption.playerNumber+")</li>";
									customBuyVal += "선수명(번호) : "+localCustomChoiceOption.playerFriendlyName+"("+localCustomChoiceOption.playerNumber+")";
								}
							}
							else if (localCustomChoiceOption.customType == 'PATCH') {
								customChoiceData += "<li>"+localCustomChoiceOption.customName+" : "+localCustomChoiceOption.patchFriendlyName+"</li>";
								customBuyVal += ""+localCustomChoiceOption.customName+" : "+localCustomChoiceOption.patchFriendlyName+"";
							}
							if (sidx != 0) customChoicePrice += " + ";
							customChoicePrice += new Intl.NumberFormat('ko-KR').format(localCustomChoiceOption.price) +"  ";
							totalPrice += localCustomChoiceOption.price;
						}
						customChoicePrice += " = " + new Intl.NumberFormat('ko-KR').format(totalPrice)
						customChoiceData += "<li>"+customChoicePrice+"</li>";
						customData.customChoiceData = customChoiceData;
						customData.customBuyVal = customBuyVal;
						customChoiceDataHtml = customChoiceData;
					}
					CustomProductChoiceDataList.push(customData);
					Method.settingPreviewImageAndTextData(customData.key);
					if (CustomProductChoiceDataList.length > 5) {
						CustomProductChoiceDataList.splice(0,1);
					}

					// 패치 선택 썸네일 이미지
					var customImageHtml = "";
					var maxCount = 5; //최대 보여줄 개수
					var $customProductPreviewList = $("ul#idx-custom-product-preview-list"); // 커스텀 패치 프리셋 미리보기 리스트 객체
					var $customProductPreviewListElement = $("ul#idx-custom-product-preview-list li");
					if( CustomProductChoiceDataList.length > 0 ){

						var listElementTotal = $($customProductPreviewListElement).length;
						var customDataTotal = (CustomProductChoiceDataList.length - 1);
						var customData = CustomProductChoiceDataList[customDataTotal];
						var customImage = customData.customChoiceSaveImage[0];
						var customImageIdx = customImageIndex++;
						if(listElementTotal > (maxCount - 1)){
							$("ul#idx-custom-product-preview-list li").eq(0).remove();
						}

						customImageHtml += "<li>";
						customImageHtml += "<input type=\"radio\" id=\"patch-selected-"+customImageIdx+"\" name=\"patch-selected-radio\" class=\"patch-selected-checkbox\" checked value='"+customData.key+"' />";
						customImageHtml += "<label for=\"patch-selected-"+customImageIdx+"\" style=\"background-image:url('" + shopImageDomain +customImage+"?thumbnail')\">";
						customImageHtml += "<span class=\"patch-label\">패치이름</span>";
						customImageHtml += "</label>";
						customImageHtml += "</li>";

						$($customProductPreviewListElement).each(function(index, element){
							$(element).find(".patch-selected-checkbox").attr('checked', false);
						});
						$($customProductPreviewList).append(customImageHtml);
						$("ul#idx-custom-product-preview-list li").last()
							.find("input:radio[name='patch-selected-radio']").on('click', function(element){
							var checkedKey = element.target.value;
							//console.log("checkedKey : " + checkedKey);
							Method.settingPreviewImageAndTextData(checkedKey);
						});

						$("#idx-custom-product-preview-container").show();
					}
					/* 라디오 버튼 바인딩 로직 변경
					$("input:radio[name='patch-selected-radio']").on('change',function(e){
						var checkedKey = e.target.value;
						console.log(e);
						Method.settingPreviewImageAndTextData(checkedKey);
						
					});
					 */
					Method.clearAllCurrentChoice();
				},
				// 가격 노출
				showPrice:function(choiceOption) {
					var parameter = "";
					//var totalPrice = customProduct.price;
					//parameter += "커스텀 금액 : "+ new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(customProduct.price) +"  ";
					var totalPrice = 0;
					parameter += "커스텀 금액 : ";
					for(idx=0; idx < choiceOption.length;idx++) {
						data = choiceOption[idx];
						if (idx > 0) parameter += " + ";
						parameter += data.customName +"("+ new Intl.NumberFormat('ko-KR').format(data.price) +")  ";
						totalPrice += data.price;
					}
					$("#custom_product_price").empty();
					if (totalPrice > 0) {
						parameter += "="+new Intl.NumberFormat('ko-KR').format(totalPrice);
						$("#custom_product_price").html(parameter);
					}
				},
				addItemRequest:function(itemRequest) {
					// PDP에서 바로구매시 처리 하는 로직(item request에 선택한 내용 세팅)
					if (CustomProductChoiceDataList.length > 0) {
						var checkedKey = $("input[name='patch-selected-radio']:checked").val();
						var customData;
						for (idx=0; idx < CustomProductChoiceDataList.length; idx++) {
							customData = CustomProductChoiceDataList[idx];
							if (customData.key == checkedKey) {
								break;
							}
						}
						
						itemRequest['itemAttributes[CUSTOM_YN]'] = 'Y';
						for(idx=0; idx < customData.customChoiceOption.length;idx++) {
							itemRequest['itemAttributes[CUSTOM_DATA_'+(idx+1)+']'] =  JSON.stringify(customData.customChoiceOption[idx]);
						}
						var saveImage = "";
						for(idx=0; idx < customData.customChoiceSaveImage.length;idx++) {
							if (idx > 0) saveImage += ",";
							saveImage +=customData.customChoiceSaveImage[idx];
						}
						itemRequest['itemAttributes[CUSTOM_IMAGES]'] =  saveImage;
						
					}
				},
				getCustomBuyVal:function() {
					var customVal = null;
					if (CustomProductChoiceDataList.length > 0) {
						var checkedKey = $("input[name='patch-selected-radio']:checked").val();
						var customData;
						for (idx=0; idx < CustomProductChoiceDataList.length; idx++) {
							customData = CustomProductChoiceDataList[idx];
							if (customData.key == checkedKey) {
								break;
							}
						}
						customVal = customData.customBuyVal;
					}
					return customVal;
				},
				previewSwiperSliderInit:function(){
					var endPoint = Core.getComponents('component_endpoint');
					
					customProductViewSwiper = new Swiper('.custom-product-view-swiper-container', {
						observer: true,
						observeParents: true,
						slidesPerView:'auto',
						updateOnWindowResize: true,
						navigation: {
							nextEl: '.swiper-next',
							prevEl: '.swiper-prev',
						},
						scrollbar: {
							el: '.swiper-scrollbar',
							hide: false,
						},
						on: {
							slideChangeTransitionEnd: function(event) {
								var param = {};
								param.click_area = "PDP",
								param.click_name = "patch_selection_image_slide",
								param.link_name = "Click Links"
								param.page_event = {
									link_click : true,
								}
								endPoint.call('adobe_script', param);
							}
						}
					});
				},
		}
		
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-custom-product]',
					attrName:'data-module-custom-product',
					moduleName:'module_custom_product',
					handler:{context:this, method:Method.moduleInit}
				});
			},
            addItemRequest:function(itemRequest) {
            	return Method.addItemRequest(itemRequest);
            },
            getCustomBuyVal:function() {
            	return Method.getCustomBuyVal();
            }
		}
	});
	// custom product 외부에서 호출 하는 함수 모음
	Core.Utils.customProduct = {
			cartCustomProduct:function() {
				// 카트에서 구매시 처리 로직
				var cartCustomYN = $('#current-item-wrap').find('button[cartCustomYN=true]');
				if(cartCustomYN.length > 0){
					var prodName = cartCustomYN.eq(0).parents('.product-opt_cart').find('[data-name]').data('name');
					var lengthT = "";
					if(cartCustomYN.length > 1){
						var lengthM = cartCustomYN.length - 1;
						var lengthT = "외" + lengthM + "개";
					}
					UIkit.modal.alert("패치 선택 가능 상품은 장바구니 주문이 불가능합니다.<br/>["+ prodName +"]" + lengthT +"을 삭제 후 주문해주세요.");
					return true;
				}
				return false;
			},
			isCartCustomProduct:function(optchange) {
				// 카트에서 옵션 변경시에 custom 상품인지 확인
				return $(optchange).attr('cartCustomYN');
			},
			checkoutCustomProductChangeImage:function() {
				// checkout에서 custom 상품의 이미지 변경 작업
				var customYN = $('#customAttribute').find('.opt').attr('data-opt');
				if(customYN !== undefined){
					//썸네일 변경
					var mediaUrl = Core.Utils.contextPath + $('input[name=mediaUrl]').val();
					if(mediaUrl.indexOf('undefined') == -1){
						$('.image-wrap img').attr('src', mediaUrl+'?thumbnail');
					}
				}
			},
			isCheckoutPaymentCustomProduct:function() {
				// checkout payment에서 custom 상품 존재 여부
				return $('input[name=customAttributeYN]').val();
			},
			addItemRequest:function(itemRequest) {
				// 바로구매시 item request에 custom 선택된 내용 세팅
				var customProductPdp = $("#custom-modal").attr('data-product-customUse');
				if (customProductPdp === 'true') {
					Core.getModule('module_custom_product').addItemRequest(itemRequest);
				}
			},
			getCustomBuyVal:function() {
				// PDP에서 바로구매시 custom 선택 내용 화면에 노출 되는 내용 --> 확인을 받음
				var result = null;
				var customProductPdp = $("#custom-modal").attr('data-product-customUse');
				if (customProductPdp === 'true') {
					result = Core.getModule('module_custom_product').getCustomBuyVal();
				}
				return result;
			},
			// 사용하는 곳이 없음
			isProductOptionCustomProduct:function() {
				// productSkuInventory에서 customProduct에 따라 inventory 정보 다르게 처리(Controller 내에서 판단 하는것으로 변경 함) --> 사용안함
				// product option에서 custom여부를 parameter로 전달하는 부분
				var custom = $("div[data-product-customYN]").attr('data-product-customYN')
				var customUse = $('#custom-modal').attr('data-product-customUse');
				var customYN = false;
				if(custom === 'Y' && customUse){
					customYN = true;
				}
				return customYN;
			}
	};
})(Core);
(function(Core){
	'use strict';

	Core.register('module_dynamicentity_board_comment', function(sandbox){
		var Method = {
			$that : null, 
			$commentContainer : null,
			dynamicName : null,
			storageId : null,
			moduleInit:function(){
				var args = Array.prototype.slice.call(arguments).pop();
				$.extend(Method, args);				

				Method.$that = $(this);
				Method.dynamicName = $(this).find('input[name="dynamicName"]').val();
				Method.storageId = $(this).find('input[name="storageId"]').val();
				Method.$commentContainer = $(this).find('#'+ Method.dynamicName + '-comment');


				// 쓰기
				$(this).find('#comment-submit').off('click').on('click', Method.write );
				// 삭제
				$(this).find('a.deleteComment').off('click').on('click', Method.checkRemove );
				// 비빌번호 확인 후 삭제
				$(this).find('a.checkPassword').off('click').on('click', Method.togglePasswordForm );

				//paging 
				$(this).find('.btn-pagination > .paging').off('click').on('click', Method.paging );
			},
			write:function(e){
				e.preventDefault();
				if ( $.trim($("#authorName").val()) == "") {
					UIkit.notify('작성자를 입력해주세요.', {timeout:3000,pos:'top-center',status:'danger'});
					$("#authorName").focus();
					return;
				}

				if ($.trim($("#comment").val()) == "") {
					UIkit.notify('글 내용을 입력해주세요.', {timeout:3000,pos:'top-center',status:'danger'});
					$("#comment").focus();
					return;
				}

				 if( _GLOBAL.CUSTOMER.ANONYMOUS ){
					if ( $.trim($("#authorPassword").val()) == "") {
						UIkit.notify('비밀번호를 입력해주세요', {timeout:3000,pos:'top-center',status:'danger'});
						$("#authorPassword").focus();
						return;
					}
				}

				var $form = $(this).closest($('form#commentForm'));

				sandbox.utils.ajax($form.attr('action'), 'POST', $form.serialize(), function(data){
					var data = $.parseJSON( data.responseText );
					if( data.result ){
						location.reload();
					}else{
						UIkit.notify(data.errorMsg, {timeout:3000,pos:'top-center',status:'danger'});
					}
				}, true)				
			},
			// 비빌번호 확인 후 삭제 -- 사용안함
			checkPassword:function(e){
				e.preventDefault();
				var $form = $(this).closest('form');
				UIkit.modal.prompt("Password:", '', function(data){
					if( $.trim(data) != ''){
						$form.find('input[name="password"]').val(data);
						Method.remove($form);
					}
				});
			},

			togglePasswordForm:function(){
				if( $(this).hasClass('cancel')){
					$(this).removeClass('cancel').text('삭제');
					$(this).closest('form').find('.password-confirm').addClass('uk-hidden');
				}else{
					$(this).addClass('cancel').text('취소');
					$(this).closest('form').find('.password-confirm').removeClass('uk-hidden');
				}
			},

			// 삭제 확인
			checkRemove:function(e){
				e.preventDefault();

				var $form = $(this).closest('form');

				sandbox.validation.init( $form );
				sandbox.validation.validate( $form );

				if( sandbox.validation.isValid( $form )){
					UIkit.modal.confirm("삭제 하시겠습니까?", function(){
						Method.remove($form);
					});
				}
				/*
				if( $(this).hasClass('password')){
					var password = $(this).closest('form').find('input[name="password"]');
					if ( $.trim( password.val() ) == "") {
						UIkit.notify('비밀번호를 입력해주세요.', {timeout:3000,pos:'top-center',status:'danger'});
						password.focus();
						return;
					}
				}
				*/
				
				
			},
			// 삭제
			remove:function($form){
				sandbox.utils.ajax($form.attr('action'), 'POST', $form.serialize(), function(data){
					var data = $.parseJSON( data.responseText );
					if( data.result ){
						location.reload();
					}else{
						UIkit.notify(data.errorMsg, {timeout:3000,pos:'top-center',status:'danger'});
					}
				}, true)
			},

			paging:function(e){
				e.preventDefault();
				if( $(this).hasClass('active') ){
					return;
				}
				var param = _.object($(this).attr('href').split('&').map(function(p){return p.split('=');}));
				var obj = {
					'name': Method.dynamicName,
					'mode':'template',
					'storageId' : Method.storageId,
					'page' : Number(param.page) || 1,
					'pageSize' : Method.pageSize || 5,
					'pageListSize' : Method.pageListSize || 5,
					'_sort' : 'dateCreated',
					'_type_sort' : 'desc',
					'pagetype' : 'comment',
					'paging' : true,
				}

				sandbox.utils.ajax('/processor/execute/dynamic', 'GET', obj, function(data){
					var list = data.responseText;
					if( list != '' && list != undefined && list != null ){
						// TODO 페이징 타입에 따라 밑에 붙이던지 replace하던지
						Method.$commentContainer.replaceWith($(list).find('.comment-list'));
						sandbox.moduleEventInjection(list);
					}else{
						UIkit.notify('Server Error', {timeout:3000,pos:'top-center',status:'danger'});
					}
				}, true)
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-dynamicentity-board-comment]',
					attrName:'data-module-dynamicentity-board-comment',
					moduleName:'module_dynamicentity_board_comment',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
    Core.register('module_date_filter_thedraw', function(sandbox){
        var drawTypeValue = "";
        var Method = {

            $that:null,
            moduleInit:function(){
                var $this = $(this);
                Method.$that = $this;
                Method.$start = Method.$that.find('#start-date');
                Method.$end = Method.$that.find('#end-date');
                drawTypeValue = $this.find('[data-type-list] .active').attr('data-type');

                setTimeout(function(){
                    $this.find('.uk-accordion').css('height','auto');
                }, 100);

                $this.find('[data-type-list] a').on('click', function(){
                    drawTypeValue = $(this).attr('data-type');
                    var index = $this.find('[data-date-list] .active').index();
                    if(index < 0 ){
                        index = 2;
                        var value = 'M,-3'.split(',');
                    }else{
                        var value = $this.find('[data-date-list] .active').data('date').split(',');
                    }
                    Method.searchSubmit( moment().add(value[1], value[0]).format('YYYYMMDD'), moment().format('YYYYMMDD'), index);
                });

                $this.find('[data-date-list] a').on('click', function(){
                    var value = $(this).data('date').split(',');
                    Method.searchSubmit( moment().add(value[1], value[0]).format('YYYYMMDD'), moment().format('YYYYMMDD'), $(this).index());
                });

                $this.find('[data-search-btn]').on('click', function(){
                    if( Method.getValidateDateInput() ){

                        var today = new Date();   //오늘 날짜 가져오기
                        var dd = today.getDate();
                        var mm = today.getMonth()+1; //January is 0!
                        var yyyy = today.getFullYear();
                        if(dd < 10) {
                            dd='0'+dd
                        }
                        if(mm < 10) {
                            mm='0'+mm
                        }
                        str_today = yyyy+'-' + mm+'-'+dd;

                        var start    = Method.$start.val().toString();
                        var end      = Method.$end.val().toString();
                        var date_chk = Method.dateDiff(moment(start, 'YYYY.MM.DD').format('YYYY-MM-DD'), str_today);  //2년 체크..

                        if(!date_chk){
                            UIkit.modal.alert( '조회기간은 최대 2년 이내로 자료가 조회 가능합니다.' );
                            return;
                        }

                        Method.searchSubmit( moment(start, 'YYYY.MM.DD').format('YYYYMMDD'), moment(end, 'YYYY.MM.DD').format('YYYYMMDD'), 'detail');

                    }else{
                        UIkit.modal.alert( '기간을 선택해 주세요!' );
                    }
                });


                // 초기화
                $this.find('[data-reset-btn]').on('click', Method.reset);

                // uikit datepicker module 적용
                $this.find('input[class="date"]').each( function(){
                    if( !moment($(this).val(), 'YYYY.MM.DD').isValid() ){
                        $(this).val('');
                    }
                    if( $.trim( $(this).val() ) != ''){
                        $(this).val( moment($(this).val(), 'YYYYMMDD').format('YYYY.MM.DD'));
                    }
                    var datepicker = UIkit.datepicker($(this), {
                        maxDate : true,
                        format : 'YYYY.MM.DD'
                    });

                    datepicker.on( 'hide.uk.datepicker', function(){
                        $(this).trigger('focusout');
                        Method.updateDateInput();
                    })
                })
            },

            dateDiff:function(_date1, _date2) {
                var diffDate_1 = _date1 instanceof Date ? _date1 : new Date(_date1);
                var diffDate_2 = _date2 instanceof Date ? _date2 : new Date(_date2);

                diffDate_1 = new Date(diffDate_1.getFullYear(), diffDate_1.getMonth()+1, diffDate_1.getDate());
                diffDate_2 = new Date(diffDate_2.getFullYear(), diffDate_2.getMonth()+1, diffDate_2.getDate());

                var d = true;
                var diff = Math.abs(diffDate_2.getTime() - diffDate_1.getTime());
                diff = Math.ceil(diff / (1000 * 3600 * 24));

                if(diff > 730){
                    d = false;
                }
                return d;
            },
            // 앞보다 뒤쪽 날짜가 더 뒤면 두값을 서로 변경
            updateDateInput:function(){
                var start = String(Method.$start.val());
                var end = String(Method.$end.val());

                if( $.trim( start ) == '' || $.trim( end ) == ''  ){
                    return;
                }

                // 같다면
                //var isSame = moment(Method.$start.val()).isSame(Method.$end.val());
                // 작다면
                //var isBefore = moment(Method.$start.val()).isBefore(Method.$end.val());
                // 크다면

                var isAfter = moment(start, 'YYYY.MM.DD').isAfter(moment(end, 'YYYY.MM.DD'));

                if( isAfter ){
                    var temp = Method.$end.val();
                    Method.$end.val( Method.$start.val() );
                    Method.$start.val( temp );
                }
            },
            getValidateDateInput:function(){
                var start = String(Method.$start.val());
                var end = String(Method.$end.val());

                if( moment( start, 'YYYY.MM.DD' ).isValid() && moment( end, 'YYYY.MM.DD' ).isValid() ){
                    return true;
                }
                return false;
            },
            searchSubmit:function( start, end, type ){
                var url = sandbox.utils.url.getCurrentUrl();
                url = sandbox.utils.url.removeParamFromURL( url, 'drawType' );
                url = sandbox.utils.url.removeParamFromURL( url, 'dateType' );
                url = sandbox.utils.url.removeParamFromURL( url, 'page' );
                url = sandbox.utils.url.removeParamFromURL( url, 'stdDt' );
                url = sandbox.utils.url.removeParamFromURL( url, 'endDt' );

                // 전체 검색
                if(_.isUndefined( start )){
                    url = sandbox.utils.url.removeParamFromURL( url, 'stdDt' );
                    url = sandbox.utils.url.removeParamFromURL( url, 'endDt' );
                }else{
                    var opt = {
                        stdDt : start,
                        endDt : end,
                        dateType : type,
                        drawType : drawTypeValue
                    }
                    url = sandbox.utils.url.appendParamsToUrl( url, opt );
                }
                window.location.href = url;
            },
            reset:function(){
                Method.$start.val('').trigger('focusout');
                Method.$end.val('').trigger('focusout');
            }
        }
        return {
            init:function(){
                sandbox.uiInit({
                    selector:'[data-module-date-filter-thedraw]',
                    attrName:'data-module-date-filter-thedraw',
                    moduleName:'module_date_filter-thedraw',
                    handler:{context:this, method:Method.moduleInit}
                });
            }
        }
    });
})(Core);
(function(Core){
	Core.register('module_forgot_password', function(sandbox){
		var $this, $form, $stepContainer, $errorAlert, $identifier, $otpSubmitWrap, $otp, identifierVal, messageType;
		var Method = {
			moduleInit:function(){
				// listSize = 검색 결과 한번에 보여질 리스트 수
				var args = Array.prototype.slice.call(arguments).pop();
				$.extend(Method, args);
				$this = $(this);
				$form = $this.find("form");
				$stepContainer = $this.find(".step-container");
				$errorAlert = $this.find('[data-error-alert]');
				$identifier = $this.find('#identifier');
				$otpSubmitWrap = $this.find('[data-wrap-submit-otp]');
				$otp = $this.find('#otp');

				// 검색버튼 클릭시
				$form.submit(function(e){
					e.preventDefault();
					Method.hideAlert();
					Method.submit();
					return false;
				});

				// 검색된 리스트중 선택시
				// $this.on('click', '[data-customer-select-btn]', Method.selectCutomer );
				$this.on('click', '[data-certify-btn]', Method.guestCertify );
				$this.on('click', '[data-back-btn]', function(){
					$('[data-component-forgotpasswordmodal]').trigger('click');
				});
				$this.on('click', '[data-btn-request-otp]', Method.requestOtpCode );
				$this.on('click', '[data-btn-submit-otp]', Method.submitOtpCode );
			},

			requestOtpCode:function(e){
				e.preventDefault();
				var _self = this;
				identifierVal = Core.utils.string.trim($identifier.val());

				if(Core.utils.string.trim(identifierVal)==''){
					Core.ui.modal.alert('이메일 또는 전화번호를 입력하세요.');
					return;
				}

				// 체크 로직 추가 해야함
				console.log($identifier.val());
				if(identifierVal.indexOf('@') > -1){
					var emailRule = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/;
					if(!emailRule.test(identifierVal)){
						Core.ui.modal.alert('정확한 이메일을 입력하세요.');
						return;
					}
					messageType = 'EMAIL';
				}else{
					// 숫자와 '-' 만 있으면 전화번호 입력
					var phoneType = /^[0-9]([0-9||-])+$/;
					if(phoneType.test(identifierVal)){
						var phoneRule = /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})$/;
						if(!phoneRule.test(identifierVal)){
							Core.ui.modal.alert('정확한 전화번호를 입력하세요.');
							return;
						}
						messageType = 'KAKAO';
					}else{
						Core.ui.modal.alert('정확한 정보를 입력하세요.');
						return;
					}
					
				}
				
				var param = {
					'messageType' : messageType,
					'userName': identifierVal,
					'mode': 'customer',
					'csrfToken' : $form.find('input[name="csrfToken"]').val()
				}

				Core.utils.ajax(Core.utils.contextPath+'/otp/request', 'POST', param, function(data) {
					var jsonData = Core.Utils.strToJson( data.responseText, true );
					if(jsonData.result==true){
						Core.ui.modal.alert(jsonData.messages || '인증번호를 발송했습니다. 인증번호가 오지 않으면<br />입력하신 정보가 회원정보와 일치하는지 확인해 주세요.');
						$(_self).text('다시받기');
						$otpSubmitWrap.removeClass('uk-hidden');
					}else{
						if( jsonData.errors == null){
							Core.ui.modal.alert('인증번호를 발송하지 못하였습니다.<br/>다시 시도해주세요.', {
								hide:function(){
									Core.ui.modal.close('#common-modal');
								}
							})
						}else{
							Core.ui.modal.alert(jsonData.errors);
						}
					}
				}, true, false, 1500);
			},

			submitOtpCode:function(e){
				e.preventDefault();
				var $otp = $this.find('#otp');
				var otpVal = Core.utils.string.trim($otp.val());

				if(Core.utils.string.trim(otpVal)==''){
					Core.ui.modal.alert('인증번호를 입력하세요.');
					return;
				}

				var param = {
					'messageType' : messageType,
					'userName': identifierVal,
					'otp': otpVal,
					'mode': 'customer',
					'csrfToken' : $form.find('input[name="csrfToken"]').val()
				}

				Core.utils.ajax(Core.utils.contextPath+'/otp/confirm', 'POST', param, function(data) {
					var jsonData = Core.Utils.strToJson( data.responseText, true );
					if(jsonData.result==true){
						Method.submit();
					}else{
						if( jsonData.errors == null){
							Core.ui.modal.alert('인증에 실패 하였습니다.<br/>다시 시도해주세요.', {
								hide:function(){
									Core.ui.modal.close('#common-modal');
								}
							})
						}else{
							Core.ui.modal.alert(jsonData.errors);
						}
					}
				}, true, false, 1000);
			},
			
			updateSelectOrder:function(e){
				e.preventDefault();
				// 자신 버튼 숨기기
				$(this).parent().hide();
				// 자신 컨텐츠 켜기
				$(this).closest('li').find('[data-certify-content]').slideDown('300');
				// 다른 버튼 보이기
				$(this).closest('li').siblings().find('[data-customer-select-btn]').parent().show();
				// 다른 컨텐츠 숨기기
				$(this).closest('li').siblings().find('[data-certify-content]').hide();
			},

			submit:function(){
				// 인증번호 받은 이후에 input 에 있는 번호를 수정할 경우를 대비하여 다시 설정
				$identifier.val(identifierVal);
				sandbox.utils.ajax($form.attr("action"), 'POST', $form.serialize(), function(data){
					Method.createCustomerList(JSON.parse( data.responseText ));
				});
			},
			viewStep:function(num){
				// 현재 2번으로 넘어갈때 만 사용중
				$stepContainer.addClass('uk-hidden');
				$otpSubmitWrap.addClass('uk-hidden');
				$identifier.val('');
				$otp.val('');
				$this.find('.step-' + num ).removeClass('uk-hidden');
			},
			showAlert:function(msg){
				Core.ui.modal.alert(msg);
			},
			hideAlert:function(){
				$errorAlert.addClass('uk-hidden');
			},
			createCustomerList:function(data){
				var result = data['result'];
				var $listContainer = $this.find('.list-container');
				var list = data['ro'];
				var html = '';

				if( result == true ){
					if( list.length == 0 ){
						Method.showAlert('검색하신 내용을 찾을 수 없습니다. 다른 정보를 이용해 다시 검색해 주십시오.');
					}else{
						$.each( list, function( index, li ){
							li.useName = (li.fullName!=null && $.trim(li.fullName)!='');
							li.dateCreated = li.dateCreated.slice(0, 10).split("-").join(".");
						});

						html = Handlebars.compile($("#forgot-password-list").html())(list);

						$listContainer.html( html );
						//console.log( list );
						sandbox.moduleEventInjection( html );

						$this.on('click', '[data-customer-select-btn]',  Method.updateSelectOrder );

						Method.viewStep(2);
					}
				}else{
					Method.showAlert('검색하신 내용을 찾을 수 없습니다. 다른 정보를 이용해 다시 검색해 주십시오.');
				}
				///customer/requestPasswordChangeUrl?successUrl=/recover&customer=
			},

			// 비회원 인증 처리
			guestCertify:function(){
				var type = $(this).attr('data-type');
				var customerId = $(this).closest('li').find('input[name="customerId"]').val();
				var email = $(this).closest('li').find('input[name="email"]').val();
				var phoneNum = $(this).closest('li').find('input[name="phonenum"]').val();
				var url = sandbox.utils.contextPath + "/login/requestPasswordChangeUrl?customer=" + customerId;

				if( type === 'email'){
					url += '&messageType=EMAIL';
				}else if( type === 'kakao'){
					url += '&messageType=KAKAO';
				}

				sandbox.utils.ajax(url, 'GET', {}, function(data){
					var responseData = sandbox.rtnJson(data.responseText);
					if(responseData.result == true){
						if(type === 'email'){
							Method.viewStep(3);
						}else if(type === 'kakao'){
							Method.viewStep(4);
						}
					}else{
						Method.showAlert(responseData['errorMsg']);
					}

				}, true );

				return;
			}

		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[ data-module-forgot-password ]',
					attrName:'data-module-forgot-password',
					moduleName:'module_forgot_password',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function (Core) {
    'use strict';
    Core.register('module_global_banner', function (sandbox) {
        var $this, expireTime, cookieName;
        var Method = {
            moduleInit: function (){
                $this = $(this);

                if ($this.find('[data-module-slick-slider]').length == 0) {
                    $this.remove();
                    return;
                }

                var args = Array.prototype.slice.call(arguments).pop();
                cookieName = 'CLOSE_GLOBAL_BANNER';
                expireTime = args.expireTime || null;
                $this.find('[data-btn-banner-close]').on('click', Method.close);
                
                if ($.cookie(cookieName) != 'Y') {
                    Method.show();
                }
            },
            show: function(){
                $this.show();
            },
            close: function (e){
                e.preventDefault();
                if (expireTime != null) {
                    var date = new Date();
                    date.setTime(date.getTime() + (expireTime * 3600 * 1000));
                    $.cookie(cookieName, 'Y', { expires: date });
                }
                $this.remove();
            }
        }

        return {
            init: function () {
                sandbox.uiInit({
                    selector: '[data-module-global-banner]',
                    attrName: 'data-module-global-banner',
                    moduleName: 'module_global_banner',
                    handler: { context: this, method: Method.moduleInit }
                });
            }
        }
    });
})(Core);

(function(Core){
	Core.register('module_global_alert', function(sandbox){
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var msg = $(this).find('span').text();

				if( msg != null && $.trim(msg) ){
					UIkit.notify(msg, {timeout:0,pos:'top-center',status:'danger'});
				}
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[ data-module-global-alert]',
					attrName:'data-module-global-alert',
					moduleName:'module_global_alert',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

// kakao 앱 브라우저에서의 동작 처리를 위한 모듈
// 회원가입, 로그인, 구매버튼 클릭시 카카오 로그인을 선 처리 한다.

// TODO inapp 에서만 처리 되는 내용이 아닌것으로 변경되어 네이밍 변경필요

(function (Core) {
    Core.register('module_kakao_in_app', function (sandbox) {
        var $this;

        var Method = {
            moduleInit: function () {
                $this = $(this);    
            },
            submitFormKakao: function (redirectUrl){
                var $form = $this.find('form[name="social_kakao_in_app"]');
                var url = sandbox.utils.url.getUri(sandbox.utils.url.getCurrentUrl());
                /*
                var locationHref = redirectUrl || url.path.replace(sandbox.utils.contextPath, '') + url.query;
                */
                var locationHref = redirectUrl || window.location.href;
                
                // 현재 url param에 successUrl 정보가 있으면 그쪽으로 이동
                if (_.isEmpty(redirectUrl) && !_.isEmpty(url.queryParams.successUrl)) {
                    locationHref = url.queryParams.successUrl;
                }
                if ( locationHref.indexOf( 'http' ) == -1){
                    locationHref = url.protocol + '//' + url.host + sandbox.utils.contextPath + locationHref;
                }
                if ($form) {
                    $form.append('<input type="hidden" name="state" value="' + locationHref.replace(/&/g, '%26') + '" />');
                    $form.submit();
                }
            }
        }

        return {
            init: function () {
                sandbox.uiInit({
                    selector: '[data-module-kakao-in-app]',
                    attrName: 'data-module-kakao-in-app',
                    moduleName: 'module_kakao_in_app',
                    handler: { context: this, method: Method.moduleInit }
                });
            },
            submit: function( redirectUrl ){
                Method.submitFormKakao(redirectUrl);
            }
        }
    });

})(Core);

(function(Core){
	Core.register('module_guide', function(sandbox){
		var endPoint;
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var args = Array.prototype.slice.call(arguments).pop();
				$.extend(Method, args);
				
				endPoint = Core.getComponents('component_endpoint');
				$(this).on('click', function(){
					var type = $(this).data('guide-type');
					if( type == 'size'){
						endPoint.call('pdpSizeGuideClick');
					}
				})
			},
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-guide]',
					attrName:'data-module-guide',
					moduleName:'module_guide',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	var allSkuDataItem;
	Core.register('module_launchcategory', function(sandbox){
		var $that, category;
		// var arrViewLineClass=['uk-width-medium-1-3', 'uk-width-large-1-2', 'uk-width-large-1-3', 'uk-width-large-1-4', 'uk-width-large-1-5'];


		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var $cate = $(".launch-category");
				var $item = $(".launch-list-item.upcomingItem");
				var $cate_header = $(".launch-lnb");

				if(arguments[0] && undefined != arguments[0].category){
					category = arguments[0].category;
				}

				//@pck 2020-10-23 Lazy 개선
				document.addEventListener('readystatechange', function(event){
					if(document.readyState == 'complete'){

						var elementListTotal = document.querySelectorAll('.launch-list-item.pb2-sm').length; //thymeleaf 템플릿 상에서 PC와 MO은 항상 동일한 개수를 가지도록 한다는 전제
						if (elementListTotal < 1){ //list item들이 없을 시 no product 메세지 노출
							if(document.querySelector('.not-found-container') !== null)
								document.querySelector('.not-found-container').classList.remove('hidden');
						}else{
							if(category ==="upcoming"){

								// @pck 2021-06-24 모바일 날짜 헤더 제거 로직
								// 과정을 감추기 위해 Lazy 이전에 실행되어야 함

								var elementListParent = document.querySelector('.item-list-wrap'),
									arrListItemsMO = document.querySelectorAll('.launch-list-item.d-md-h'),
									arrayListitemsMO = [];

								for (var i = 0; i < arrListItemsMO.length; ++i) { arrayListitemsMO.push(arrListItemsMO[i]); }

								arrayListitemsMO.sort(function(currentDate, nextDate) {
									var currentDateObj = new Date(currentDate.dataset.activeDate);
									var nextDateObj = new Date(nextDate.dataset.activeDate);
									if( currentDateObj.getFullYear() === nextDateObj.getFullYear() &&
										currentDateObj.getMonth() === nextDateObj.getMonth() &&
										currentDateObj.getDate() === nextDateObj.getDate()){
										var dateHeaderEl = currentDate.querySelector('.upcoming.bg-lightestgrey');
										if(dateHeaderEl !== null){
											currentDate.removeChild(dateHeaderEl);
										}
									}
								});

								for(var i = 0; i < arrayListitemsMO.length; ++i){ elementListParent.appendChild(arrayListitemsMO[i]); }
							}
						}

						$('.launch-category .img-component').Lazy({
							visibleOnly: true,
							scrollDirection: 'vertical',
							afterLoad: function() {
								$('.launch-category .launch-list-item').addClass('complete');
							},
						});
					}
				});

				//upcoming일때는 헤더 우측 뷰 변경 아이콘 숨기기
				if(category === 'upcoming'){
					$this.find('.toggle-box').hide();
					// TheDraw일때 Adobe 태깅 추가
					$cate.find('[data-thedraw]').parents('[data-component-launchitem]>a').attr('data-click-area', 'snkrs').attr('data-click-name', 'upcoming: apply draw');
				}
				// console.log('category:', category);

				// TheDraw일때 Adobe 태깅 추가
				if(category === 'feed'){
					$cate.find('[data-thedraw]').parents('[data-component-launchitem]>a').attr('data-click-area', 'snkrs').attr('data-click-name', 'feed: apply draw');
				}

				/* @pck 2020-12-18 js/ui/_ui_snkrs_script.js 로 기능 이전
				var Listform = {
				    grid : function(setCookie){
								$(".item-list-wrap", $cate).removeClass("gallery").addClass("grid");
				        //$(".launch-list-item", $cate).removeClass("gallery").addClass("grid");
						$(".toggle-box span", $cate_header).removeClass("ns-grid").addClass("ns-feed");
						if(setCookie){$.cookie("launch_view_mode", "grid" , {path : "/"});}

				    },
				    gallery : function(setCookie){
								$(".item-list-wrap", $cate).removeClass("grid").addClass("gallery");
				        //$(".launch-list-item", $cate).removeClass("grid").addClass("gallery");
				        $(".toggle-box span", $cate_header).removeClass("ns-feed").addClass("ns-grid");
				        if(setCookie){$.cookie("launch_view_mode", "gallery" , {path : "/"});}
					}
				};
				 */
				// Launch 리스트 NOTIFY ME 버튼 노출
				$cate.find('.item-notify-me').on('click', function (e) {
					var url = $(this).attr('url');

					//#restock-notification 중복 modal 노출 현상으로 깜빡임 방지차 최초 1회만 ajax호출
					if($("#restock-notification").length == 0){
						Core.Utils.ajax(url, 'GET', {}, function (data) {

							var notifyPop = $(data.responseText).find('#restock-notification');
							$('body').append(notifyPop)
							Core.moduleEventInjection(notifyPop[0].outerHTML);
							/*
                            var obj = {
                                'productId': $item.find('[name="productId"]').val()
                            }

                            Core.Utils.ajax(Core.Utils.contextPath + '/productSkuInventory', 'GET', obj, function(data){
                                var responseData = data.responseText;
                                allSkuDataItem = Core.Utils.strToJson(responseData).skuPricing;
                                // console.log(allSkuDataItem)
                                // console.log(Method)
                                // _self.fireEvent('skuLoadComplete', _self, [allSkuData, 'COMINGSOON']);
                            }, false, true);
                            */
							var modal = UIkit.modal("#restock-notification");
							if(!modal.isActive()){
								modal.show();
							}
						});
					}else{
						var modal = UIkit.modal("#restock-notification");
						if(!modal.isActive()){
							modal.show();
						}
					}
				});

			},
			DateParse:function(dateStr){
				var a=dateStr.split(" ");
				var d=a[0].split("-");
				var t=a[1].split(":");
				return new Date(d[0],(d[1]-1),d[2],t[0],t[1],t[2]);
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-launchcategory]',
					attrName:'data-module-launchcategory',
					moduleName:'module_launchcategory',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			getTotalSkuData:function () {
				return allSkuDataItem; // BK
			},
			getTotalSkuNotify:function () {
				return 'COMINGSOON'; // BK
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_instagram_embed', function(sandbox){
		var $this, args, model;
		var getFeedLoad = function(id){
			//var url = 'https://api.instagram.com/oembed/?url=http://instagr.am/p/BXW-qBZlRW1 ( feed ID ) /'  // embad
			//URL A short link, like http://instagr.am/p/fA9uwTtkSN/.
			//queryParam - MAXWIDTH, HIDECAPTION, OMITSCRIPT, CALLBACK

			sandbox.utils.jsonp('https://api.instagram.com/oembed/', {url:'http://instagr.am/p/' + id}, 'callback', function(data){
				$('#common-modal').find('.contents').empty().append(data.html);
				modal.show();

				if(window.instgrm){
					window.instgrm.Embeds.process();
				}
			});
		}

		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];

				var arrInstagramEmbed = args.feedIds.split("|");
				var template = Handlebars.compile($(args.template).html());

				//modal init
				modal = UIkit.modal('#common-modal', {center:true});
				modal.off('.uk.modal.instagram').on({
					'hide.uk.modal.instagram':function(){
						console.log('instagram modal hide');
						$('#common-modal').find('.contents').empty();
						//delete window.instgrm;
					}
				});

				for(var i=0; i<arrInstagramEmbed.length; i++){
					var bindingHtml = template({feedId:sandbox.utils.trim(arrInstagramEmbed[i])});
					$this.append(bindingHtml);
				}

				//instagram feed Event
				$this.find('a').each(function(){
					$(this).click(function(e){
						e.preventDefault();

						getFeedLoad($(this).attr('href'));
					});
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-instagram-embed]',
					attrName:'data-module-instagram-embed',
					moduleName:'module_instagram_embed',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				console.log('product destory');
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_launchproduct', function(sandbox){
		var $that;
		// var arrViewLineClass=['uk-width-medium-1-3', 'uk-width-large-1-2', 'uk-width-large-1-3', 'uk-width-large-1-4', 'uk-width-large-1-5'];
		var Method = {
			moduleInit:function(){
				$this = $(this);
				var args = {};
				args.skudata = $(this).find("[data-sku]").data("sku");
				$(this).find("[data-sku]").remove();

                //상품정보 스크롤 이동
                var _conH = $('.lc-prd-conts .product-info').height();
                var _conBox = $('.lc-prd-conts .lc-prd-images').height();
                var _winH = $(window).height();
                var _conOT = $('.lc-prd-conts').offset().top;
                var _winST = $(window).scrollTop();
				var _pt = (_winH - _conH)/3;

				//사이즈 셀렉트 수정
				var widthMatch = matchMedia("all and (max-width: 767px)");
				if (Core.Utils.mobileChk || widthMatch.matches) {
					$this.find('#selectSize').on('change', function(){
						var option = $('#selectSize option:selected').text();
						$(this).prev('label').text(option);
					});
				}

				/*
				// 당일배송 자세히보기 버튼
				$this.find('[data-btn-samedaymodal]').click(function(e){
					var samedayModal = UIkit.modal('#detail-sameday', {modal: false, center:false});
					samedayModal.show();
					samedayModal.find('.uk-close').click(function(e){
						samedayModal.hide();
					});
					return false;
				});
				*/

				// THE DRAW Count Down
				var certificationYnModal = UIkit.modal('#certification-yn-modal', {center:true, bgclose:false, keyboard:false});
				certificationYnModal.hide();
				if($('[data-thedrawend]').length === 1){
					var startTime = $('[data-currentdate]').data("currentdate");
				  var endTime = $('[data-thedrawend]').data("thedrawend");
					startTime = String(startTime);
					endTime = String(endTime);
					console.log(startTime);
					console.log(endTime);
					var startDate = new Date(parseInt(startTime.substring(0,4), 10),
					         parseInt(startTime.substring(4,6), 10)-1,
					         parseInt(startTime.substring(6,8), 10),
					         parseInt(startTime.substring(8,10), 10),
					         parseInt(startTime.substring(10,12), 10),
					         parseInt(startTime.substring(12,14), 10)
					        );
					var endDate   = new Date(parseInt(endTime.substring(0,4), 10),
					         parseInt(endTime.substring(4,6), 10)-1,
					         parseInt(endTime.substring(6,8), 10),
					         parseInt(endTime.substring(8,10), 10),
					         parseInt(endTime.substring(10,12), 10),
					         parseInt(endTime.substring(12,14), 10)
					        );
					var dateGap = endDate.getTime() - startDate.getTime();
					var timeGap = new Date(0, 0, 0, 0, 0, 0, endDate - startDate);
					var diffDay  = Math.floor(dateGap / (1000 * 60 * 60 * 24)); // 일수
					var diffHour = timeGap.getHours();       // 시간
					var diffMin  = timeGap.getMinutes();      // 분
					var diffSec  = timeGap.getSeconds();      // 초

					jQuery(function ($){
					    var twentyFourHours = diffHour * 60 * 60;
							var twentyFourMin = diffMin * 60;
					    var display = $('.draw-date>dd');
					    Method.timer((diffDay * 24 * 60 * 60)+twentyFourHours+twentyFourMin+diffSec, display);
					});

					$.removeCookie('thedrawCertified');
					$.removeCookie('thedrawRedirectUrl');
					$.removeCookie('thedrawCertified', { path: '/' });
					$.removeCookie('thedrawRedirectUrl', { path: '/' });
				}

				// THE DRAW 참여여부
				/* @pck 2020-07-31 draw 응모여부 확인 후 미응모 시 Draw응모버튼 활성화 */
				var isDisabled = false;
				var btnEntryDraw = $('[action-type="drawentry"]');
				if(btnEntryDraw !== null){
					isDisabled = $(btnEntryDraw).hasClass('disabled');
					if(isDisabled){
						Core.Loading.show();
					}
				}

				var skuId = 111;
				var productId = $("[data-product-id]").data("product-id");
				var theDrawId = $("[data-thedrawid]").data("thedrawid");
				var redirectUrl = $(location).attr('href');
				var drawurl = sandbox.utils.contextPath + '/theDraw/entry/isWin';

				//@pck 2020-10-14 draw 응모 여부는 로그인 후 확인 가능한 것으로 변경
				var isLogin = false;
					if( _GLOBAL.CUSTOMER.ISSIGNIN) isLogin = true;

				if($('[data-thedrawend]').length === 1 && isLogin){
					BLC.ajax({
						type : "POST",
						dataType : "json",
						url : drawurl,
						data : {
							prodId : productId,
							theDrawId : theDrawId,
							skuId : skuId,
							redirectUrl : redirectUrl
						}
					},function(data){
						if(data.result) {
							Core.Loading.hide();
							if(data.winFlag == "win" || data.winFlag == "lose") {
								$('[data-module-product]').remove();
								$('.btn-box').append('<span class="btn-link xlarge btn-order disabled" style="cursor:default">THE DRAW 응모완료</span>');
							}
							if(data.winFlag == "notEntry"){
								var btnEntryDraw = $('[action-type="drawentry"]');
								$(btnEntryDraw).removeClass('disabled');

								$(btnEntryDraw).on('click', function (){
									$(this).addClass('disabled');
									Core.Loading.show();
									Method.drawEntryAjax();
								});
							}
						}else{
							Core.Loading.hide();
							//UIkit.modal.alert(data.errorMessage);
							console.log(data.errorMessage);
						}
					});
				}

				// THE DRAW 당첨자 확인 Start
				$this.find("#btn-drawiswin").click(function(e){
					e.preventDefault();
					$('.uk-modal .draw-entry').find('.attention>p>a').click(function(){
						$(this).parents('p').next('div').toggle();
						return;
					});
					BLC.ajax({
						type : "POST",
						dataType : "json",
						url : drawurl,
						data : {
							prodId : productId,
							theDrawId : theDrawId,
							skuId : skuId,
							redirectUrl : redirectUrl
						}
					},function(data){
						if(data.result) {
							if(data.winFlag == "win") {
							    $('#theDrawBuyForm').attr('productId', data.productId);
							    $('#theDrawBuyForm').attr('fType', data.fType);
							    $('#theDrawBuyForm').attr('quantity', data.quantity);
							    $('#theDrawBuyForm').attr('SIZE', data.SIZE);
							    $('#theDrawBuyForm').attr('itemAttributes', data.itemAttributes);
							    $('#theDrawBuyForm').attr('attributename', data.attributename);

								//더드로우 용 attributename 추가.
								$('#theDrawBuyForm').attr('draw_itemAttributes', data.theDrawEntryId);

								UIkit.modal('#draw-win-modal', {modal:false}).show();
								//$('#draw-win-modal').find('#directOrder').attr('href',data.drawProductUrl);
							}
							else if(data.winFlag == "lose") {
								UIkit.modal('#draw-lose-modal', {modal:false}).show();
							}
							else if(data.winFlag == "notEntry") {
								UIkit.modal('#draw-notentry-modal', {modal:false}).show();
							}
						}
					});
				});
				// THE DRAW 당첨자 확인 End

				// 재입고알림 click area 변경
				$('[data-restock]').find('[data-click-area]').attr('data-click-area','snkrs');

				//excute component_gallery
				sandbox.getComponents('component_gallery', {context:$this}, function(i){
					//excuted js
				});

				//입고알림 문자받기 show or hide
				Method.displayRestockAlarm(args);
			},
			timer:function(duration, display) {
				var timer = duration, hours, minutes, seconds;
				setInterval(function () {
					hours = parseInt((timer / 3600), 10);
					minutes = parseInt((timer / 60) % 60, 10)
					seconds = parseInt(timer % 60, 10);

					hours = hours < 10 ? "0" + hours : hours;
					minutes = minutes < 10 ? "0" + minutes : minutes;
					seconds = seconds < 10 ? "0" + seconds : seconds;

					display.text(hours + ":" + minutes + ":" + seconds);
					st = hours + ":" + minutes + ":" + seconds;
					if (st == "00:00:00") {
						return;
					}
					--timer;
				}, 1000);
			},
			displayRestockAlarm:function(args){
				if(args && undefined != args.skudata){
					for(var index = 0; args.skudata.length > index; index++){
						if(0==args.skudata[index].quantity){
							//enable 입고알림문자받기
							$('#set-restock-alarm').show();
							return;
						}
					}
				}
			},
			drawEntryAjax:function () {
				var $productModule = $("[data-module-product]");
				var option = $productModule.find('.hidden-option').val();
				var infoAgree = $productModule.find('[name="infoAgree"]').is(':checked');
				var smsAgree = $productModule.find('[name="smsAgree"]').is(':checked');

				if(infoAgree == null) infoAgree = false;
				if(smsAgree == null) smsAgree = false;

				if(!infoAgree){
					$productModule.find('.opt-tit>.msg').addClass('msg-on').text('개인정보 수집 및 이용에 동의해주세요.');
					$productModule.find('#checkTerms').addClass('error');
					$('[action-type="drawentry"]').removeClass('disabled');
					Core.Loading.hide();
				}else if(option == 'undefined' || option == '') {
					$productModule.find('.opt-tit>.msg').addClass('msg-on').text('사이즈를 선택해 주세요.');
					$('[action-type="drawentry"]').removeClass('disabled');
					Core.Loading.hide();
				}else{
					var productId = $("[data-product-id]").data("product-id");
					var theDrawId = $("[data-thedrawid]").data("thedrawid");
					var redirectUrl = $(location).attr('href');
					var drawurl = sandbox.utils.contextPath + '/theDraw/entry';
					var thedrawproductxref = $productModule.find('#selectSize').find("option:selected").data("thedrawproductxref");
					var thedrawskuxref = $productModule.find('#selectSize').find("option:selected").data("thedrawskuxref");

					BLC.ajax({
						type : "POST",
						dataType : "json",
						url : drawurl,
						data : {
							prodId : productId,
							theDrawId : theDrawId,
							skuId : option,
							redirectUrl : redirectUrl,
							thedrawproductxref : thedrawproductxref,
							thedrawskuxref : thedrawskuxref,
							infoAgree : infoAgree,
							smsAgree : smsAgree
						}
					},function(data){
						if(data.result == true){
							var entryTrue = $('#draw-entryTrue-modal');
							UIkit.modal(entryTrue, {modal:false}).show();
							$('[data-module-product]').remove();
							$('.btn-box').append('<span class="btn-link xlarge btn-order disabled" style="cursor:default">THE DRAW 응모완료</span>');
							entryTrue.find('.attention>p>a').click(function(){
								$(this).parents('p').next('div').toggle();
								return;
							});
							$('[action-type="drawentry"]').removeClass('disabled');
							Core.Loading.hide();
						} else{
							Core.Loading.hide();
							$('[action-type="drawentry"]').removeClass('disabled');
							UIkit.modal.alert(data.errorMessage);
						}
					});
				}
			},
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-launchproduct]',
					attrName:'data-module-launchproduct',
					moduleName:'module_launchproduct',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	'use strict';
	Core.register('module_minicart', function(sandbox){
		var args, cartItemLenComponent, endPoint;
		var Method = {
			$that:null,
			$closeBtn:null,

			moduleInit:function(){
				var $this = $(this);
				Method.$that = $this;
				args = arguments[0];
				cartItemLenComponent = Core.getComponents('component_cartitemlen', {context:$('body')});
				endPoint = Core.getComponents('component_endpoint');

				$this.on('click', '[data-remove-item]',  function(e){
					e.preventDefault();
					var model = $(this).closest(".order-list").find("input[name='model']").val();
					var name = $(this).closest(".order-list").find("[data-eng-name]").data("eng-name");
					Method.removeItem( $(this).attr('href'), model, name);
				});

				$this.on('click', '[data-checkout-btn]', function(e){
					e.preventDefault();
					var info = $this.find('.cart-order_list .order-list');
					var itemList = [];
					$.each(info, function (index, productData) {
						var id = $(productData).find('[data-id]').data('id');
						var model = $(productData).find('[data-model]').data('model');
						var name = $(productData).find('[data-name]').data('name');
						var retailPrice = $(productData).find('[data-retail-price]').data('retail-price');
						var salePrice = $(productData).find('[data-sale-price]').data('sale-price');
						var quantity = $(productData).find('[data-quantity]').data('quantity');
						itemList.push({
							id: id,
							model: model,
							name: name,
							price: salePrice,
							retailPrice: retailPrice,
							quantity: quantity
						})
					})
					endPoint.call('checkoutSubmit', { itemList: itemList });
					if (_GLOBAL.DEVICE.IS_KAKAO_INAPP && !_GLOBAL.CUSTOMER.ISSIGNIN) {
						sandbox.getModule('module_kakao_in_app').submit('/checkout');
					} else {
						location.href = $(this).attr('href');
					}
				});

				$this.on('click', '[data-keep-shopping]', function(e){
					// e.preventDefault();
					Method.hide();
				});
			},
			show:function(){
				//UIkit.offcanvas arguments type : selector:string, option:object
				UIkit.offcanvas.show('#minicart', {target:'#minicart', mode:'slide'});
			},
			hide:function(){
				//uikit 사용으로 hide는 필요없는 상황
				UIkit.offcanvas.hide('#minicart');
			},

			update:function( callback ){
				var obj = {
					'mode':'template',
					'templatePath':'/cart/partials/miniCart',
					'resultVar':'cart',
					'cache':new Date().getTime()
				}

				sandbox.utils.ajax(sandbox.utils.contextPath + '/processor/execute/cart_state', 'GET', obj, function(data){
					Method.$that.empty().append(data.responseText);
					var $data = $(data.responseText);
					var itemSize = $data.filter('input[name=itemSize]').val();
					var cartId = $data.filter('input[name=cartId]').val();

					if(Array.isArray(cartItemLenComponent)){
						for(var i=0, len=cartItemLenComponent.length; i<len; i++){
							cartItemLenComponent[i].setItemLength(itemSize);
						}
					}else{
						cartItemLenComponent.setItemLength(itemSize);
					}

					var callbackResult = null;
					if( callback ){
						callbackResult = callback( { cartId : cartId} );
					}
					
					// 상단 장바구니 아이콘 수량 반영 외 미니카트는 안보이게 처리
					// callback 함수 return 값이 객체가 아닐 경우 미니장바구니 노출
					if (typeof callbackResult !== 'object') {
						Method.show();
					}
					
				}); 
			},
			removeItem:function( url, model, name ){
				// error 체크와 ajax 로딩 처리 추가 되야 함
				UIkit.modal.confirm("상품을 삭제 할까요?", function(){
					sandbox.utils.ajax(url, 'GET', {}, function(data){
						var param = sandbox.utils.url.getQueryStringParams( url );
						param.model = model;
						param.name = name;
						endPoint.call( 'removeFromCart', param );
						Method.update();
					});
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-minicart]',
					attrName:'data-module-minicart',
					moduleName:'module_minicart',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			show:Method.show,
			hide:Method.hide,
			update:Method.update
		}
	});
})(Core);

(function(Core){
	'use strict';

	Core.register('module_merchmenu', function(sandbox){

    var merchActive = function(){
      merchTriger.classList.add("isActive");
    }

    var merchDeactive = function(){
      merchTriger.classList.remove("isActive");
    }

		var Method = {
			moduleInit:function(){
        var merchTriger = document.getElementById("merchTriger");
        var merchBtns = document.querySelectorAll("[id^='toggle']");
        merchTriger.addEventListener("mouseenter", merchActive);
        merchTriger.addEventListener("mouseleave", merchDeactive);
        
        merchBtns.forEach(function(merchBtn){
          merchBtn.addEventListener("click", function(){
            var merchIdx = Number(merchBtn.value);
            for (var i = 0; i < 4; i++) {
              var othersRadioMenu = document.getElementById("toggle" + i).nextElementSibling.nextElementSibling;
              var clickedRadioMenu = document.getElementById("toggle" + merchIdx).nextElementSibling.nextElementSibling;
              var clickedRadioMenuHeight = clickedRadioMenu.firstElementChild.clientHeight + "px";
              if (i !== merchIdx) {
                othersRadioMenu.style.maxHeight = 0;
              } else {
                if (clickedRadioMenu.style.maxHeight == clickedRadioMenuHeight) {
                  clickedRadioMenu.style.maxHeight = 0;
                  document.getElementById("toggle" + merchIdx).checked = false;
                } else {
                  clickedRadioMenu.style.maxHeight = clickedRadioMenuHeight;
                }
              }
            }
          })
        })
      }
    }

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-merchmenu]',
					attrName:'data-module-merchmenu',
					moduleName:'module_merchmenu',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_ordercancel', function(sandbox){
		var $this = null,
			$modalDeferred = null, //상위 모듈에서 보낸 $.Deferred
			args = null,
			refundAmountComponent = null,
			checkboxAllCounter = 0,
			isCheckboxAll = false,
			quantitySelectComponent = null,
			checkboxComponent = null,
			reFundBankTextComponent = null,
			isToApp = false,
			callBackUrl = '';
			orderId = null;


		var checkboxCalculator = function(isValue){
			if(isCheckboxAll){
				if(isValue){
					checkboxAllCounter++;
					if((checkboxComponent.length - 1) <= checkboxAllCounter){
						isCheckboxAll = false;
						Method.submitCalculator();
					}
				}else{
					checkboxAllCounter--;
					if(checkboxAllCounter <= 0){
						isCheckboxAll = false;
						Method.emptyRefundPayment();
					}
				}
			}else{
				if(isValue){
					checkboxAllCounter++;
				}else{
					checkboxAllCounter--;
				}
				Method.submitCalculator();
			}
		}

		var arrIndexOfs = function(key, arr){
			var arrIndex = [];
			for(var i=0; i<arr.length; i++){
				if(arr[i] === key){
					arrIndex.push(i);
				}
			}
			return arrIndex;
		}

		var checkboxAllValidateChk = function(){
			var isChecked = true;
			var $itemCheckbox = $this.find('.item-checkbox');
			for(var i=0; i < $itemCheckbox.length; i++){
				if(!$itemCheckbox.eq(i).find('input[type=checkbox]').prop('checked')){
					isChecked = false;
					break;
				}
			}
			return isChecked;
		}

		var Method = {
			moduleInit:function(){
				args = arguments[0];
				$this = $(this);

				//취소할 아이템
				var items = $this.find('.return-reason-item');
				var orderStatusFormData = sandbox.utils.getQueryParams($this.find('#order-status-form').serialize().replace(/\+/g, ' '));
				var arrOrderItemId = [];
				var arrItemParentOrderItemId = [];

				orderId = args['data-module-ordercancel'].orderId;
				isToApp = (args['data-appcard-cancel']['isAppCard'] === 'true') ? true : false;
				callBackUrl = (args['data-appcard-cancel'].callbackUrl) ? args['data-appcard-cancel'].callbackUrl.replace(/\|/g, '&') : '';

				//주문에드온이 있다면 항상 전체취소만 가능하다.
				var isOrderAddon = (function(){
					var isAddon = false;
					$this.find('.return-reason-item').each(function(i){
						arrOrderItemId.push($(this).attr('data-orderItemId'));
						arrItemParentOrderItemId.push($(this).attr('data-parentOrderItemId'));
						if($(this).attr('data-isAddon') === 'true'){
							isAddon = true;
						}
					});
					return isAddon;
				})();

				var isAbleCancel = (function(){
					if(isToApp){
						return true;
					}else{
						if(orderStatusFormData.isAble === 'true'){
							if(orderStatusFormData.isFdk === 'true' && orderStatusFormData.isMid === 'false'){
								return false;
							}else{
								return true;
							}
						}else{
							return false;
						}
					}
				})();
				var isAblePartial = (isOrderAddon || isToApp) ? false : ((orderStatusFormData.isAblePartial === 'true') ? true : false);
				// 당일배송인 경우 전체취소만 가능
				if($('input[name=isSamedayDelivery]').val() == 'true'){
					isAblePartial = false;
				}


				var isRefundAccount = (orderStatusFormData.isRefundAccount === 'true') ? true : false;

				refundAmountComponent = new Vue({
					el:'#refund-amount',
					data:{
						"isAbleCancel":isAbleCancel,
						"isRefundAccount":isRefundAccount,
						"isAblePartial":isAblePartial,
						"refundPayments":[{
							"paymentType":{"type":null,"friendlyType":null,"isFinalPayment":false},
							"orgPaymentAmount":{"amount":0,"currency":"KRW"},
							"paymentAmount":{"amount":0,"currency":"KRW"},
							"shippingAmount":{"amount":0,"currency":"KRW"},
							"taxAmount":{"amount":0,"currency":"KRW"},
							"totalAmount":{"amount":0,"currency":"KRW"}
						}],
						"refundAccountNeed":(isAbleCancel && isRefundAccount) ? true:false,
						"ableEntireVoid":(isAbleCancel && isAblePartial) ? true:false,
						"fulfillmentCharge":{"amount":0,"currency":"KRW"}
					},
					created:function(){
						this.$nextTick(function(){
							if(this.refundAccountNeed){
								$this.find('.refund-account-container').addClass('need-refund-account');
							}

							checkboxComponent = sandbox.getComponents('component_checkbox', {context:$this}, function(i){
								var INDEX = i;
								this.addEvent('change', function(val){
									var $that = $(this);
									var $quantityWrap = $that.closest('.return-reason-item').find('.quantity-wrap');
									if($(this).val() === 'all'){
										//체크박스 전체선택 / 해제
										isCheckboxAll = true;
										if(val){
											$this.find('.item-checkbox').each(function(){
												if(!$(this).hasClass('checked')){
													$(this).find('> label').trigger('click');
												}
											});
										}else{
											$this.find('.item-checkbox.checked > label').trigger('click');
										}
									}else{
										if(val){
											$quantityWrap.addClass('active');
										}else{
											$quantityWrap.removeClass('active');
										}
										$quantityWrap.find('input[type=hidden]').prop('disabled', !val);
										$this.find('.all-checkbox').find('input[type=checkbox]').prop('checked', checkboxAllValidateChk());

										//product 에드온상품이 있으면, arrItemParentOrderItemId를 비교하여 같이 취소될수있도록 처리한다.
										arrIndexOfs(arrOrderItemId[INDEX - 1], arrItemParentOrderItemId).forEach(function(val, index, arr){
											$this.find('.return-reason-item').eq(val).find('input[type=hidden]').prop('disabled', !val);
										});

										checkboxCalculator(val);
									}
								});
							});

							reFundBankTextComponent = sandbox.getComponents('component_textfield', {context:$this});
							quantitySelectComponent = sandbox.getComponents('component_select', {context:$this}, function(){
								this.addEvent('change', function(val, $selected){
									if($(this).attr('name') === 'refundBank'){
										console.log($selected.attr('data-bankcode-key'));
										$(this).closest('.select-box').find('input[name="refundBankCode"]').val($selected.attr('data-bankcode-key'));
									}else if($(this).attr('name') === 'reason'){
										console.log(val);
									}else{
										$(this).closest('.select-box').siblings().filter('input[name=quantity]').val(val);
										Method.submitCalculator();
									}
								});
							});

							//isAbleCancel이 true이고, checkboxComponent가 undefined일떄 계산기를 실행한다.
							//ropis일때는 계산기 로직을 제외한다. 분명 나중에 다시 수정하게 됨.
							if(this.isAbleCancel && !checkboxComponent){
								Method.submitCalculator();
							}

							$this.find('[data-order-confirm]').click(function(e){

								      //ctm태깅 추가(주문취소 클릭)
				              var f_type = $this.find("[data-fulfillmenttype]").data('fulfillmenttype');
											var o_type = $this.find("[data-ordertype]").data('ordertype')

													if(f_type=='PHYSICAL_PICKUP'){
									                 if(o_type==true){
									                   click_name  = "inventory: ROPIS_cancellation: submit";
																	 }else{
																		 click_name  = "inventory: BOPIS_cancellation: submit" ;
																	 };

														       endPoint.call('clickEvent', {'area' : 'mypage', 'name' : click_name })
													}else {
											      endPoint.call('clickEvent', {'area' : 'mypage', 'name' :'inventory: ORDER/SHIPPING_cancellation: submit' })
									      	}


								e.preventDefault();
								if(!$(this).hasClass('disabled')){
									if(isToApp){
										Method.appCreditCardCancel();
									}else{
										Method.submitCancelOrder();
									}
								}
							});


							$this.find('[data-order-cancel]').click(function(e){
								e.preventDefault();
								if($modalDeferred === null){
									sandbox.setLoadingBarState(true);
									sandbox.utils.walkThrough('admin', callBackUrl);
								}else{
									$modalDeferred.reject();
								}
							});
						});
					},
					watch:{
						refundAccountNeed:function(){
							/*if(this.refundAccountNeed === true){
								$this.find('.refund-account-container').addClass('need-refund-account');
							}else{
								$this.find('.refund-account-container').removeClass('need-refund-account');
							}*/
						}
					},
					methods:{
						isPartialVoid:function(groupCancellable, itemCancellabel, index, reverse){
							//isAbleCancel이 false이면 취소가 불가능한 주문이다.
							if(this.isAbleCancel){
								if(arrItemParentOrderItemId[index-1]){
									if(isOrderAddon){
										return false;
									}else{
										if(reverse){
											return true;
										}else{
											return false;
										}
									}
								}

								//isAblePartial이 false이면 무조건 전체취소만 가능하다.
								if(this.isAblePartial){
									//itemCancellabel이 false이면 전체취소만 가능하다.
									if(itemCancellabel){
										if(items.length <= 1 && items.attr('data-item-quantity') <= 1){
											return false;
										}else{
											return true;
										}
									}else{
										return false;
									}
								}else{
									return false;
								}
							}else{
								if(reverse){
									return true;
								}else{
									return false;
								}
							}
						},
						isOrderPartialVoid:function(reverse){
							//isAbleCancel이 false일때는 취소불가능
							//isAbleCancel이 true 이고, isAblePartial이 true일때 부분취소가능
							//isAbleCancel이 true 이고, isAblePartial이 false일 전체취소만가능
							if(this.isAbleCancel){
								if(this.isAblePartial){
									if(items.length <= 1 && items.attr('data-item-quantity') <= 1){
										return false;
									}else{
										return true;
									}
								}else{
									return false;
								}
							}else{
								if(reverse){
									return true;
								}else{
									return false;
								}
							}
						},
						rtnCause:function(){
							if(this.isAbleCancel){
								if(this.isAblePartial){
									if(items.length <= 1 && items.attr('data-item-quantity') <= 1){
										return '하단의 취소 버튼을 클릭하시면 취소가 완료됩니다.';
									}else{
										return '주문을 취소하실 상품과 수량을 선택해 주세요.';
									}
								}else{
									if(isToApp){
										return '하단의 취소 버튼을 클릭하시면 취소가 완료됩니다.';
									}else if($('input[name=isSamedayDelivery]').val() == 'true'){//당일배송인 경우
										return '하단의 취소 버튼을 클릭하시면 취소가 완료됩니다.';
									}else{
										return decodeURIComponent(orderStatusFormData['restrict-partial']);
									}
								}
							}else{
								return (function(){
									//ErrorCode 01 - fdk결제한 주문이며, 매입전 주문이지만 마이페이지주문 목록에 노출되고 있어 결제취소가 가능하게 되어 있음(결제취소 불가 해야함)
									//조건은 fdk결제이며, 결제 mid가 있으면 취소불가 error msg 출력
									var cause = decodeURIComponent(orderStatusFormData['never-cause']);
									return (cause !== 'undefined') ? cause : '매입 전 취소는 온라인에서 불가능 합니다.';
								})();
							}
						},
						rtnPaymentType:function(paymentType){
							var label = '';
							switch(paymentType){
								case 'CUSTOMER_CREDIT' :
									label = '적립금';
									break;
								case 'GIFT_CARD' :
									label = '기프트카드';
									break;
								case 'CREDIT_CARD' :
									label = '신용카드';
									break;
								case 'MOBILE' :
									label = '휴대폰소액결제';
									break;
								case 'BANK_ACCOUNT' :
									label = '실시간계좌이체';
									break;
								case 'KAKAO_POINT' :
									label = '카카오페이'
									break;
								case 'PAYCO' : // 2019-08-12
									label = '페이코'
									break;
								case 'NAVER_PAY' : // 2020-09-08
									label = '네이버페이'
									break;
							}
							return label;
						},
						price:function(amount){
							return sandbox.utils.price(amount);
						}
					}
				});
			},
			submitCalculator:function(){
				if(!args['data-module-ordercancel'].orderId){
					UIkit.notify('orderId가 없습니다.', {timeout:3000,pos:'top-center',status:'danger'});
					return;
				}

				var formData = $this.find('#cancel-items-form').serialize();
				var url = sandbox.utils.contextPath + '/account/order/partial-cancel-calculator/' + args['data-module-ordercancel'].orderId;
				var transFormData = sandbox.utils.getQueryParams(formData);
				var isFormDataValidateChk = (transFormData.hasOwnProperty('orderItemId') && transFormData.hasOwnProperty('quantity')) ? true:false;

				if(refundAmountComponent.isAbleCancel && isFormDataValidateChk){
					sandbox.utils.ajax(url, 'POST', formData, function(data){
						var data = sandbox.rtnJson(data.responseText, true);
						var result = data['result'];
						if(data['result'] && data['ro']){
							refundAmountComponent.refundPayments = [];
							
							// 오퍼 or 배송비 정책에 따라 취소 금액이 주문금액 보다 큰 상황이 있음
							// data['ro']['refundPayments'][i].totalAmount가 마이너스로 오게 됨
							// 취소 금액 주문 금액 보다 커서 취소가 불가능합니다.


							for(var i=0; i<data['ro']['refundPayments'].length; i++){
								if(data['ro']['refundPayments'][i].paymentType.type !== 'COD'){
									refundAmountComponent.refundPayments.push(data['ro']['refundPayments'][i]);
								}
							}

							//refundAmountComponent.refundAccountNeed = data['ro']['refundAccountNeed'];
							refundAmountComponent.ablePartialVoid = data['ro']['ablePartialVoid'];
							refundAmountComponent.fulfillmentCharge = data['ro']['fulfillmentCharge'];
							refundAmountComponent.ableEntireVoid = data['ro']['ableEntireVoid'];

							//cancelBtn enabled
							$this.find('[data-order-confirm]').removeClass('disabled');
						}else{
							if($modalDeferred !== null){
								$modalDeferred.reject(data['errorMsg']);
							}else{
								UIkit.modal.alert(data['errorMsg']);
							}
						}
					}, false, false, 100);
				}else{
					Method.emptyRefundPayment();
				}
			},
			emptyRefundPayment:function(){
				//계산할 금액 없음
				refundAmountComponent.refundPayments = [];

				//cancelBtn disabled
				$this.find('[data-order-confirm]').addClass('disabled');
			},
			refundAccountValidateChk:function(){
				//refundAccount validate check
				var $deferred = $.Deferred(),
					data = '';

				if(refundAmountComponent.refundAccountNeed){
					//validateChk
					var $form = $this.find('#refund-account-form');
					sandbox.validation.init( $form );
					sandbox.validation.validate( $form );

					if(sandbox.validation.isValid( $form )){
						$deferred.resolve($this.find('#refund-account-form').serialize());
					}else{
						$deferred.reject();
					}
				}else{
					$deferred.resolve();
				}

				return $deferred.promise();
			},
			cancelReasonValidateChk:function(data){
				//cancel reason validateChk
				var defer = $.Deferred();
				var $form = $this.find('#cancel-reason-form');
				var currentData = (data) ? sandbox.utils.getQueryParams(data, 'array') : [];

				if($form.length > 0){
					sandbox.validation.init( $form );
					sandbox.validation.validate( $form );
					if(sandbox.validation.isValid( $form )){
						defer.resolve(sandbox.utils.getQueryParams($form.serialize(), 'array').concat(currentData).join('&'));
					}else{
						defer.reject();
					}
				}else{
					defer.resolve(currentData.join('&'));
				}
				return defer.promise();
			},
			submitCancelOrder:function(appCancelParams){
				if(!args['data-module-ordercancel'].orderId){
					UIkit.notify('orderId가 없습니다.', {timeout:3000,pos:'top-center',status:'danger'});
					return;
				}

				Method.refundAccountValidateChk().then(function(data){
					//cancel reason validateChk
					return Method.cancelReasonValidateChk(data);
				}).then(function(data){
					//orderCancel Item validate check
					var defer = $.Deferred();
					var cancelItemsData = $this.find('#cancel-items-form').serialize();
					var transFormData = sandbox.utils.getQueryParams(cancelItemsData);
					var currentData = sandbox.utils.getQueryParams(data, 'array');
					var isFormDataValidateChk = (transFormData.hasOwnProperty('orderItemId') && transFormData.hasOwnProperty('quantity')) ? true:false;
					if(refundAmountComponent.isAbleCancel && isFormDataValidateChk){
						defer.resolve(sandbox.utils.getQueryParams(cancelItemsData, 'array').concat(currentData).join('&'));
					}else{
						defer.reject('취소할 상품을 선택해주세요.');
					}
					return defer.promise();
				}).then(function(data){
					//submitCancelOrder confirm check
					var defer = $.Deferred();
					var message = (refundAmountComponent.ableEntireVoid) ? '취소 하시겠습니까?' : '선택한 상품을 취소하시겠습니까?';
					if(appCancelParams){
						defer.resolve(data);
					}else{
						UIkit.modal.confirm(message, function(){

							defer.resolve(data);
						},function(){
							defer.reject();
						},{
							labels: {'Ok': '확인', 'Cancel': '취소'}
						});
					}

					return defer.promise();
				}).then(function(data){
					//submitCancelOrder async

					//ctm태깅 추가(확인버튼 클릭시)
					var f_type = $this.find("[data-fulfillmenttype]").data('fulfillmenttype');
					var o_type = $this.find("[data-ordertype]").data('ordertype')

					if(f_type=='PHYSICAL_PICKUP'){
						if(o_type==true){
							click_name  = "inventory: ROPIS_cancellation: submit_final";
						}else{
							click_name  = "inventory: BOPIS_cancellation: submit_final" ;
						};
						endPoint.call('clickEvent', {'area' : 'mypage', 'name' : click_name });
					}else{
						endPoint.call('clickEvent', {'area' : 'mypage', 'name' : 'inventory: ORDER/SHIPPING_cancellation: submit_final' });
					};

					//어시스트 카드 취소시 	태깅 값이 없어서 오류 발생.
					//data-ctm-order-type ctm 관련 값이 있을경우에만 취소 태깅 진행.
					if($this.find('[data-ctm-order-type]').length > 0){
						Method.callAdobeScript();      //  ctm order cancle  태깅추가
					};

					var orderCancelApi = (isToApp)? '/account/order/appCancel/' : ((refundAmountComponent.ableEntireVoid) ? '/account/order/cancel/' : '/account/order/partial-cancel/');
					var url = sandbox.utils.contextPath + orderCancelApi + args['data-module-ordercancel'].orderId;
					var currentData = (appCancelParams) ? appCancelParams : [];
					var mixedData = sandbox.utils.getQueryParams(data, 'array').concat(currentData).join('&');
					return sandbox.utils.promise({
						url:url,
						method:'POST',
						data:mixedData
					});
				}).then(function(data){
					//part of submitCancelOrder complate
					var marketingType = (refundAmountComponent.ableEntireVoid) ? 'VOID' : 'PARTIAL_VOID';
					if( data['result'] == true ){
						var marketingData = _GLOBAL.MARKETING_DATA();
						if( marketingData.useGa == true ){
							var marketingOption = {
								orderType : marketingType,
								orderId : orderId
							};
							Core.ga.processor( marketingOption );
						}
						if($modalDeferred !== null){
							$modalDeferred.resolve(data);
						}else{
							UIkit.modal.alert('주문취소되었습니다.').on('hide.uk.modal', function(){
								sandbox.setLoadingBarState(true);
								sandbox.utils.walkThrough('admin', callBackUrl);
							});
						}
					}else{
						if($modalDeferred !== null) $modalDeferred.reject(data['errorMsg']);
					}
				}).fail(function(error){
					if(error) UIkit.modal.alert(error);
				});
			},
			callAdobeScript:function(){   // ctm 취소 태깅 진행.

				var fulfillmenttype  =  $this.find('[data-fulfillmenttype]').data('fulfillmenttype');
				var ordertype        =  $this.find('[data-ordertype]').data('ordertype');   //false:보피스 , true:로피스는
				var ctmordertype     =  $this.find('[data-ctm-order-type]').data('ctm-order-type').toLowerCase();
				//ctmordertype="com_owned";

				if(ctmordertype=="mixed"){
					ctmordertype="cloud_mixed"
				};

				//var physicaltype ="";

				// switch(fulfillmenttype){
				//	case "PHYSICAL_PICKUP","PHYSICAL_ROPIS" :
				//		if(ordertype=="false"){
				//			physicaltype = "bopis";
				//		}else{
				//			physicaltype = "ropis";
				//		};
				//		break;
				//	case "PHYSICAL_SHIP" :
				//		physicaltype = ctmordertype;
				//		break;
				// };

				var st_retailPrice    		 =  $("[data-order-retailPrice]").data('order-retailprice');  //상품 최종 결제 금액(할인전 금액)
				var st_lastprice 			 =  $("[data-order-lastprice]").data('order-lastprice');   //retailPrice상품 총 결제 금액(쿠폰 먹인후 최종 금액)

				var data = {};
				data.link_name 		 = "Order Cancel";
				data.purchase_id    	 = $("[data-ctm-purchase-id]").data('ctm-purchase-id'); // 구매 (확정) 번호
				data.ctm_order_type 	 = ctmordertype; // 주문형태 기입
				data.products 			 = [];

				var $itemCheckbox = $this.find('.item-checkbox');

				//20190320 아이템별로 할인금액 계산
				var sum_item_price = 0;  //상품에 대한 할인 먹기전 (retail-price 금액) 취소한 최종 금액
				var item_price     = 0; //상품 retail-price

				if( $("[data-component-checkbox]").length > 0 ){  //취소 가능한 상품이 여러개 일경우
					$("[data-ctm-product-type]").each(function(i){
						item_chk = $(this).find("[data-component-checkbox]").hasClass("checked");
						if(item_chk){
							//상품 할인 쿠폰을 먹인경우 retail-price, 일반 일경우 price dom 에서 가져온다.
							item_price 	= ($(this).find(".retail-price").length > 0 ? parseInt($(this).find(".retail-price").text().replace(/[^0-9]/g,"")) : parseInt($(this).find(".price").text().replace(/[^0-9]/g,"")) );
							ea			= ($(this).find(".currentOpt").length > 0 ? parseInt($(this).find(".currentOpt").text()) : 1 );
							sum_item_price = sum_item_price+(item_price*ea);  // retail-price * 취소수량 , 취소 선택한 만큼 누적시켜 준다.
						}
					});
				}else{  //취소가능한 상품이 1개일 경우
					item_price  	= ($("li[data-ctm-product-type]").find(".retail-price").length > 0 ? parseInt($("li[data-ctm-product-type]").find(".retail-price").text().replace(/[^0-9]/g,"")) : parseInt($("li[data-ctm-product-type]").find(".price").text().replace(/[^0-9]/g,"")) );
					ea			    = ($("li[data-ctm-product-type]").find(".currentOpt").length > 0 ? parseInt($("li[data-ctm-product-type]").find(".currentOpt").text()) : 1 );
					sum_item_price = item_price*ea;
				}

				//환불금액 가져오기 (retail-price * 취소 수량 , 환불금액 차이를 계산해서 할인된 금액을 구해온다.)
				var discount_amount = parseInt(sum_item_price)-parseInt($("span[data-marketing]").text().replace(/[^0-9]/g,""));
				data.page_event = {
					discount_amount :  discount_amount,
					order_cancel : true
				}

				//--------------------------------------------------------------------------
				for(var i=0; i < $("#cancel-items-form [data-ctm-product-type]").length; i++){
					if($itemCheckbox.length>1){    //  취소 가능한 상품이 1개 이상일 경우
						//취소수량
						cancel_product_unit =	$itemCheckbox.eq(i).closest("[data-ctm-product-type]").find('[data-component-select]').length > 0 ?  $itemCheckbox.eq(i).closest("[data-ctm-product-type]").find('.currentOpt').text() : 1;
						if($itemCheckbox.eq(i).find('input[type=checkbox]').prop('checked')){
							var product = {
								product_category 		: "",
								product_name 			: $itemCheckbox.eq(i).closest("[data-ctm-product-name]").data('ctm-product-name'),
								product_id 				: $itemCheckbox.eq(i).closest("[data-orderitemid]").data('orderitemid'),
								product_quantity 		: $itemCheckbox.eq(i).closest("[data-item-quantity]").data('item-quantity'),   //주문 수량
								product_unit_price 		: $itemCheckbox.eq(i).closest("[data-ctm-unit-price]").data('ctm-unit-price'),
								cancel_product_unit 	: cancel_product_unit,    //취소수량
								cancel_product_amount	: parseInt($itemCheckbox.eq(i).closest("[data-ctm-unit-price]").data('ctm-unit-price')) * parseInt(cancel_product_unit),  //취소금액
								ctm_product_type 		: $itemCheckbox.eq(i).closest("[data-ctm-product-type]").data('ctm-product-type').toLowerCase(),
							}
							data.products.push(product)
						}
					} else {   // 취소 가능한 상품이 1개 단일 상품일 경우
						//취소수량
						cancel_product_unit =	$this.find("[data-ctm-product-type]").find('[data-component-select]').length > 0 ?  $this.find("[data-ctm-product-type]").find('.currentOpt').text() : 1;
						var product = {
							product_category 		: "",
							product_name 			: $this.find("[data-ctm-product-name]").data('ctm-product-name'),
							product_id 				: $this.find("[data-orderitemid]").data('orderitemid'),
							product_quantity 		: $this.find("[data-item-quantity]").data('item-quantity'),   //주문 수량
							product_unit_price 		: $this.find("[data-ctm-unit-price]").data('ctm-unit-price'),
							cancel_product_unit 	: cancel_product_unit,    //취소수량
							cancel_product_amount 	: parseInt($this.find("[data-ctm-unit-price]").data('ctm-unit-price')) * parseInt(cancel_product_unit),  //취소금액
							ctm_product_type 		: $this.find("[data-ctm-product-type]").data('ctm-product-type').toLowerCase(),
						}
						data.products.push(product)
					}
				}
				endPoint.call('adobe_script',  data )
			 },
			appCreditCardCancel:function(){
				/* assist admin에서 앱카드 당일 취소시 사용 */
				Method.cancelReasonValidateChk().then(function(){
					var appFromData = sandbox.utils.getQueryParams($this.find('#appcancel').serialize().replace(/\+/g, '%20'));
					var arrQueryParams = [
						"callbackScript=Core.getModule('module_ordercancel').callBackCancelFdk",
						"cardCashSe=CARD",
						"delngSe=0",
						"splpc=" + appFromData.totalAmount,
						"vat="+ (appFromData.totalAmount * 1) * 0.1,
						"taxxpt=0",
						"instlmtMonth=" + appFromData.month,
						"aditInfo=order_no%3D" + args['data-module-ordercancel'].orderId,
						"srcConfmNo=" + appFromData.confmNo,
						"srcConfmDe=" + appFromData.paydate
					];
					window.location.href = "seamless://pay=cancel&mode=req&"+arrQueryParams.join('&');
				}).fail(function(error){
					if(error) UIkit.modal.alert(error);
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-ordercancel]',
					attrName:['data-module-ordercancel', 'data-appcard-cancel'],
					moduleName:'module_ordercancel',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				$modalDeferred = null;
				console.log('destroy orderCancel module');
			},
			setDeferred:function(defer){
				$modalDeferred = defer;
			},
			callBackCancelFdk:function(resp){
				/* finpay 결제취소 콜백 */
				var decodeResp = decodeURIComponent(resp);
				var respObj = sandbox.utils.getQueryParams(decodeResp);
				var respArr = sandbox.utils.getQueryParams(decodeResp, 'array');
				if(respObj.setleSuccesAt == 'X'){
					//앱카드취소 실패
					if(respObj.setleMssage === '원거래없음'){
						UIkit.modal.alert('결제 시 사용한 카드가 아니거나 원거래 내역이 존재하지 않습니다.');
					}else{
						UIkit.modal.alert(respObj.setleMssage);
					}
				}else if(respObj.setleSuccesAt == 'O'){
					//앱카드취소 성공
					respArr.push('fdkCardCancel=Y');
					Method.submitCancelOrder(respArr);
				}
			}
		}
	});
})(Core);

(function (Core) {
   Core.register('module_new_gnb', function (sandbox) {	  
	  	   
      var $this;
      var scrollTemp = 0;
      
      var Method = {
         moduleInit: function () {
            $this = $(this);

            var didScroll;
            var lastScrollTop = 0;
            var delta = 5;
            var navbarHeight = $('[data-preheader-area]').outerHeight();            
            
            $(window).scroll(function (event) {
               didScroll = true;
            });
            
            setInterval(function () {
               if (didScroll) {
                  Method.hasScrolled();

                  didScroll = false;
               }
            },  1);
            
            $(window).resize(win_resize);            
            function win_resize(){
            	var win_w = $(window).outerWidth();
            	var body_w = $('html, body').outerWidth();

            	$('[data-module-new-gnb]').css('width', win_w);
            	$('.wrapper').css('width', win_w);
            	$('.footer-contents').css('width', win_w);
            }

            //Website 상단메뉴 활성화
            $('[data-menulink-area]').on('mouseenter', Method.gnbMenuOn);
            
            //Website 상단메뉴 비활성화
            $('[data-nkgnb-area]').on('mouseleave', Method.gnbMenuOff);
            
            //검색창 열기 및 검색
            $('[data-new-searcharea]').on('click', Method.searchSubmit);
            
            //검색창 닫기
            $('[data-new-searchclose]').on('click', Method.searchClose);

            //검색창 입력 시 발생되는 event
            $('[data-newsearch-input]').on('keyup', Method.searchKeyUp);
            
            //Mobile menu 활성화 event
            $('[data-btn-mobilemenu]').click(Method.mobileMenuActive);
            
            //MobileMenu 1depth -> 2depth  
            $('.next_depth').click(Method.mobileMenuFS);

            //MobileMenu 2depth -> 3depth 
            $('.nxt_dp').click(Method.mobileMenuST);
            
            //MobileMenu 2depth -> 1depth
            $('.depth2 .back_m_menu').click(Method.mobileMenuFirstBack);
            
            //MobileMenu 3depth -> 2depth
            $('.depth3 .back_m_menu').click(Method.mobileMenuSecondBack);
            
            //상단 로그인 후 자신의 이름 mouseenter 시 메뉴 활성화
            $('[data-user-dropmenu]').on('mouseenter',Method.signOnUserMenuOn);
            
            //상단 로그인 후 자신의 이름 mouseleave 시 메뉴 비활성화
            $('[data-user-dropmenu], [data-user-area]').on('mouseleave',Method.signOnUserMenuOff);
            
            //Mobile 다시 검색하기 기능
            $('.search_less_txt_link a').on('click',Method.searchSubmit);
            
            //검색어 삭제 버튼
            $('[data-searchclear-btn]').on('click',Method.searchClear);
            
            //mobile -> pc 로 이동시 mobile 관련된 메뉴 및 효과 비활성화
            $(window).resize(Method.mobileEffectOff);
            
            //검색어 삭제 버튼 hide 
            $('[data-searchclear-btn]').on('click',Method.searchHide);
            
            //dim close
            $('[data-dimd-area]').on('click',Method.dimClose);
            
            
                        
         },
         searchKeyUp:function(){
            var currentVal = $(this).val();
            if(currentVal == ''){
               $(this).parents('[data-searchiner-area]').siblings('[data-searchlist-area]').removeClass('active');
               Method.gnbSearchInit();
               $('[data-searchclear-btn]').hide();
            } else{ 
               $(this).parents('[data-searchiner-area]').siblings('[data-searchlist-area]').addClass('active');  
               $('[data-searchclear-btn]').show();                 
            } 
         },
         searchClose:function(){
            $(this).closest('[data-gnbsearchwrap-area]').removeClass('open');
            $('[data-preheader-area]').removeClass('hdn');
            $('.header h1').removeClass('top');
            $('[data-dimd-area]').removeClass('on');
            $('html, body').removeClass('not_soroll');
            $('[data-searchlist-area]').removeClass('active');
            $("[data-newsearch-input]").val('');
            $('.pre_clear_btn').css('display', 'none');
            Method.gnbSearchInit();
         },
         getParameterByName:function(name){
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
             var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                     results = regex.exec(location.search);
             return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
         },
         PopularSearchSave:function(){
            var isPopularSearch = $('[data-search-area]').find('li').is('[data-popular-search]');
            if(isPopularSearch){
               sessionStorage.setItem('PopularSearch', $('[data-popular-search]').parents().html());
            }            
         },
         getPopularSearch:function(){
            return sessionStorage.getItem("PopularSearch");
         },
         gnbSearchInit:function(){
            var gnbBaseHtml = "";
            $('[data-searchlist-area]').find('p').css("display","block");
            $('[data-search-area]').empty();
            $('#ui-id-1').empty()
            $('[data-search-area]').html(Method.getPopularSearch());
         },
         gnbIsSearchList:function(){
            var result = true;
            var gnbSearchResult = $('#ui-id-1').html();
            if($.trim($('#ui-id-1').html())==''){
               result = false;   
            }
            return result;
         },
         hasScrolled:function(){
            var scroll = $(window).scrollTop(); 						//스크롤 최상단
            var pre_height =  $('[data-preheader-area]').outerHeight(); //고객센터 위치
            var all_h = $('.kr_nike').outerHeight(); 					// GNB 전체영역
            var sec_top = $('.section-header').length ? $('.section-header').offset().top : 0;
                 	    
            if(scroll >= sec_top){
               $('.section-header').addClass('fixed');
            }

            if (scroll > scrollTemp && scroll > 36 ) {
               $('.header').removeClass('reset');
               $('.header').addClass('nav_up');
               $('.header').removeClass('fixed');
               $('.section-header').removeClass('sticky');
            } else {
               if (scroll <= pre_height) {
                  $('.header').removeClass('fixed');
                  $('.header').removeClass('nav_up');
                  $('.section-header').removeClass('fixed');
                  $('.section-header').removeClass('sticky');
                  
               } else  if(scroll < scrollTemp ){
            	  $('.header').removeClass('reset');
            	  $('.header').removeClass('nav_up');
                  $('.header').addClass('fixed');
                  $('.section-header').addClass('sticky'); 
               }
            } 
            if(scroll <= 0){
    			$('.header').addClass('reset');
    			$('.header').removeClass('nav_up');
    			$('.header').removeClass('fixed');
    		}
            scrollTemp = scroll 
         },
         searchSubmit:function(){
            var gnbSeatText = $("[data-newsearch-input]").val();
            var searchCheck = false;
            var searchValidate = false
            var searchClickTarget = false
            var searchName = Method.getParameterByName('q');
            var searchNameValidate = false
            
            //검색어 Validate
            if (((typeof gnbSeatText != "undefined") && (typeof gnbSeatText.valueOf() == "string")) && (gnbSeatText.length > 0) && gnbSeatText.trim() != '') {
               searchValidate = true;
            }
            
            //검색 클릭에 대한 target을 확인하여 svg,button의 target 대상만 submit 가능 
            if(event.target.nodeName == 'SPAN' || event.target.nodeName == 'BUTTON'){
               searchClickTarget = true;
            }
            
            //입력된 검색어에 대한 PLP화면에서 다시 검색창을 띄울때 검색되지 않게 설정 
            if( searchValidate && $('[data-gnbsearchwrap-area]').hasClass('open') == false && searchClickTarget){
               searchCheck = true;
            }
            
            /**
             * 검색창 닫기
             * 1. 검색어 입력창에 검색어 없는 경우
             * 2. 이미 검색한 결과가 존재하는 경우 
             * @returns
             */
            if((searchName == gnbSeatText) && searchName.trim() != '' && gnbSeatText.trim() != ''){
               searchNameValidate = true;
            }
            if(((!searchValidate && $('[data-gnbsearchwrap-area]').hasClass('open') == true) ||
                  ( searchValidate && $('[data-gnbsearchwrap-area]').hasClass('open') == true) && searchNameValidate) && searchClickTarget){
               // 입력된 검색어에 대한 PLP화면에서 검색창 화면에 동일한 검색어가 존재하는 경우 검색 클릭 시 닫기
               // 단,지웠다가 동일한 검색어를 다시 입력한 경우 검색이 가능하다.
               if(!Method.gnbIsSearchList()){
                  $(this).closest('[data-gnbsearchwrap-area]').removeClass('open');
                  $('[data-preheader-area]').removeClass('hdn');
                  $('.header h1').removeClass('top');
                  $('[data-dimd-area]').removeClass('on');
                  $('html, body').removeClass('not_soroll');
                  $('[data-searchlist-area]').removeClass('active');
                  return;
               }                  
            }
            
            $('[data-gnbsearchwrap-area]').addClass('open');
            $('[data-preheader-area]').addClass('hdn');
            $('.header h1').addClass('top');
            $('html, body').addClass('not_soroll');
            $("[data-newsearch-input]").focus();   
            if($(window).width() > 960){
            	$('[data-dimd-area]').addClass('on');	
            } 

            $('[data-dimd-area]').click(function(){
               $('[data-gnbsearchwrap-area]').removeClass('open');
               $('[data-dimd-area]').removeClass('on');
               $('[data-preheader-area]').removeClass('hdn');
               $("[data-newsearch-input]").val('');
               $('.pre_clear_btn').css('display', 'none');
               Method.gnbSearchInit();
            });
            
            //검색창이 활성화 된 상태에서만 검색 가능
            if(searchValidate && $('[data-gnbsearchwrap-area]').hasClass('open') == true && !searchCheck && searchClickTarget){
               
               $('#search-form').submit();
            }
            
            //Default 검색어 저장            	
           	Method.PopularSearchSave();

            
         },
         mobileMenuActive:function(){
            $('[data-mobilemenu-area]').addClass('open');
            $('[data-dimd-area]').addClass('on');
            $('.header').addClass('hdn');
            $('html, body').addClass('not_soroll');
            $('html, body').css('overflow-y', 'hidden');
            $('[data-header-area]').removeClass('nav_up');

            $('[data-dimd-area]').click(function(){
               $('[data-mobilemenu-area]').removeClass('open');
               $('.mobile_menu_panel').removeClass('view');
               $('[data-mobilemenuinner-area]').removeClass('rotate');
               $('[data-dimd-area]').removeClass('on');
               $('.header').removeClass('hdn');
               $('[data-mobilemenuinner-area]').find('.mobile_menu_panel').removeClass('rotate');
               $('html, body').removeClass('not_soroll');
               $('html, body').removeAttr('style');
            });          
            $('.mobile_menu').animate({ scrollTop : '0' }, 0);
         },
         mobileMenuFS:function(){
            $(this).closest('[data-mobilemenuinner-area]').addClass('rotate');  
            $(this).parent('li').addClass('on').siblings().removeClass('on');
         },
         mobileMenuST:function(){
            $(this).parent().parent().parent().parent('.depth2').addClass('rotate');
         },
         mobileMenuFirstBack:function(){
            $(this).closest('li').removeClass('open');      
            $(this).parent().parent().parent().parent().parent().removeClass('rotate');
         },
         mobileMenuSecondBack:function(){
            $(this).closest('li').removeClass('open');                  
            $(this).parents('.depth2').removeClass('rotate');
         },
         signOnUserMenuOn:function(){
            $(this).addClass('open');
         },
         signOnUserMenuOff:function(){
            $(this).removeClass('open');
         },
         mobileEffectOff:function(){
            if($(window).width() > 960) {
            // $('[data-dimd-area]').removeClass('on');
               $('[data-mobilemenu-area]').removeClass('open'); 
            // $('html, body').removeClass('not_soroll'); 
               $('.header').removeClass('hdn');
            }                     
            
         },
         gnbMenuOn:function(){
            $(this).parent().addClass('active').siblings().removeClass('active');
            $('[data-dimd-area]').addClass('on');
         },
         gnbMenuOff:function(){
            $(this).find('ul li').removeClass('active');
            $('[data-dimd-area]').removeClass('on');           
         },
         searchClear:function(){
        	 $("[data-newsearch-input]").val('').focus();
        	 $("[data-searchclear-btn]").hide();
        	 Method.gnbSearchInit();
         },
         dimClose:function(){
        	 $('[data-dimd-area]').removeClass('on');  
         }
         
      }

      return {
         init: function () {
            sandbox.uiInit({
               selector: '[data-module-new-gnb]',
               attrName: 'data-module-new-gnb',
               moduleName: 'module_new_gnb',
               handler: { context: this, method: Method.moduleInit }
            });
         }
      }
   });
})(Core);
(function(Core){
	Core.register('module_product', function(sandbox){
		var currentFirstOptValue = '';
		var currentQuantity = 1;
		var itemAttributes = '';
		var miniOptionIS = false;
		var objProductOption = {};
		var minOffsetTop = 30;
		var maxOffsetTop = 0;
		var args = null;
		var $this;
		var imgCurrentIndex;
		var categoryId = '';
		var productId = '';
		var skuId = '';
		var isQuickView = false;
		var isQuantity = true;
		var productOption;
		var quantity;
		var endPoint;
		var privateId;
		var currentSkuData;
		var pickupModal;
		var itemRequest;

		var $optionWrap;
		var $galleryWrap;
		var $productDetailWrap;
		var optionWrapOffsetTop;
		var previousScrollTop = 0;
		var $descriptionWrap;
		var longDescription;

		var isSkuLoadComplete = false;

		var quantityCheck = function(inventoryType, maxQty){
			var obj = {isQuantity:false, maxQty:0};
			if(inventoryType !== 'UNAVAILABLE'){
				if(inventoryType === 'CHECK_QUANTITY'){
					obj.isQuantity = (maxQty > 0) ? true : false;
					obj.maxQty = maxQty;
				}else if(inventoryType === 'ALWAYS_AVAILABLE' || inventoryType === null){
					obj.isQuantity = true;
					obj.maxQty = null;
				}
			}else{
				obj.isQuantity = false;
				obj.maxQty = 0;
			}
			return obj;
		}

		var defaultSkuSetup = function(productOptComponents){
			var skuData, quantityState;
			if(!productOptComponents) return;
			if(quantity){
				if(Array.isArray(productOptComponents)){
					$.each(productOptComponents, function(i){
						skuData = this.getDefaultSkuData()[0];
						quantityState = quantityCheck(skuData.inventoryType, skuData.quantity);
						quantity[i].setMaxQuantity(quantityState.maxQty);
						isQuantity = quantityState.isQuantity;
					});
				}else{
					skuData = productOptComponents.getDefaultSkuData()[0];
					quantityState = quantityCheck(skuData.inventoryType, skuData.quantity);
					quantity.setMaxQuantity(quantityState.maxQty);
					isQuantity = quantityState.isQuantity;
				}
			}
		}

		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];
				categoryId = sandbox.utils.getQueryParams(location.href).categoryid;
				productId = args.productId;
				privateId = args.privateId;
				endPoint = Core.getComponents('component_endpoint');

				// nike 입고 알림 팝업 띄우기
				var isReservation = sandbox.utils.getQueryParams(location.href).hasOwnProperty('restock');
				if(isReservation){
					setTimeout(function(){
						$('.stocked-wrap').find('a[href="#restock-notification"]').trigger('click');
					}, 300);
				}

				var $dim = $('[data-miniOptionDim]');
				var guideModal = UIkit.modal('#guide', {modal:false});
				var commonModal = UIkit.modal('#reservation-modal', {modal:false});
				var miniCartModule = sandbox.getModule('module_minicart');
				var gallery = sandbox.getComponents('component_gallery', {context:$this});
				var $infoHeightWrap = $('[data-info-height]');
				//var customModal = UIkit.modal('#custom-modal', {modal:false}); /* CUSTOM 삭제 */

				$productDetailWrap = $(".product-detail_wrap");
				$galleryWrap = $this.find('.product-gallery-wrap');
				$optionWrap = $this.find('.product-option-container');
				optionWrapOffsetTop = ($optionWrap.length > 0) ? $optionWrap.offset().top : 0;

				var addonProductGroup = {};
				var addonComponents = sandbox.getComponents('component_addon_product_option', {context:$(document)}, function(i){
					var INDEX = 0;
					var key = this.getAddonId();

					if(!addonProductGroup.hasOwnProperty(key)){
						addonProductGroup[key] = [];
						INDEX = 0;
					}else{
						INDEX++;
					}
					addonProductGroup[key].push(this);

					this.addEvent('addToAddOnItem', function(){
						var privateId = arguments[0];
						for(var i=0; i<addonProductGroup[key].length; i++){
							if(i != INDEX){
								addonProductGroup[key][i].setTrigger(privateId);
							}
						}
					});
				});

				quantity = sandbox.getComponents('component_quantity', {context:$(document)}, function(i){
					var INDEX = i;
					this.addEvent('change', function(qty){
						for(var i=0;i<quantity.length;i++){
							if(i !== INDEX){
								quantity[i].setQuantity(qty);
							}
						}
					});
				});


				var currentOptValueId = '';
				productOption = sandbox.getComponents('component_product_option', {context:$(document)}, function(i){ //product Option select components
					var CURRENT_INDEX = i;
					var INDEX = 0;
					var _self = this;
					var key = this.getProductId();


					if(!objProductOption.hasOwnProperty(key)){
						objProductOption[key] = [];
						INDEX = 0;
					}else{
						INDEX++;
					}

					objProductOption[key].push(this);

					this.addEvent('changeFirstOpt', function(firstOptName, optionName, productId, value, valueId, id){
						if(currentOptValueId != valueId){
							currentOptValueId = valueId;

							for(var i=0; i<objProductOption[productId].length; i++){
								if(i != INDEX){
									skuId = '';
									objProductOption[productId][i].setTrigger(optionName, value, valueId);
								}

								if(optionName !== 'COLOR'){
									objProductOption[productId][i].getValidateChk();
								}
							}

							if(optionName === 'COLOR'){
								gallery.setThumb(value);
							}
						}

					});

					this.addEvent('skuComplete', function(skuOpt){
						currentSkuData = skuOpt
						if(quantity){
							var quantityState = quantityCheck(skuOpt.inventoryType, skuOpt.maxQty);
							isQuantity = quantityState.isQuantity;
							skuId = skuOpt.id;

							if(args.isDefaultSku !== 'true'){
								if(Array.isArray(quantity)){
									//quantity[CURRENT_INDEX].setQuantity(1); //cart modify인 경우 수량 초기화 안함
									quantity[CURRENT_INDEX].setMaxQuantity(quantityState.maxQty);
								}else{
									//quantity.setQuantity(1); //cart modify인 경우 수량 초기화 안함
									quantity.setMaxQuantity(quantityState.maxQty);
								}
							}
						}
					});

					this.addEvent('skuLoadComplete', function(skuData){
						//nike 또는 상품의 재고를 비동기로 처리한경우 사용
						isSkuLoadComplete = true;

						/* isDefaultSku - true  ( option이 없는 경우 )  */
						if(args.isDefaultSku === 'true') defaultSkuSetup(productOption);
					});
				});

				/* 매장예약 */
				$('.reservation-btn').click(function(e){
					e.preventDefault();

					if(isSkuLoadComplete){
						Core.Utils.ajax(location.href, 'GET', {
							reservationview:true,
							size:$("input[name=SIZE]:checked").val()
						}, function (data) {
							var domObject = $(data.responseText).find('#reservation-wrap');
							$('#reservation-modal').find('.contents').empty().append(domObject[0].outerHTML);
							Core.moduleEventInjection(domObject[0].outerHTML);
							commonModal.show();
						});
					}
				});

				// 당일배송 자세히보기 버튼
				$this.find('[data-btn-samedaymodal]').click(function(e){
					e.preventDefault();
					Core.ui.modal.open('#detail-sameday', {modal: false, center:false});
					/*
					$('#detail-sameday').find('.uk-close').click(function(e){
						e.preventDefault();
						$('#detail-sameday').css({'display' : '', 'overflow-y' : ''}).removeClass('uk-open');
						$('html').removeClass('uk-modal-page');
					});
					return false;
					*/
				});

				/* CUSTOM 삭제 */

				/* cart Update */
				/* 스티키 모바일 디바이스 쿠키 테스트용 (Staging Only). */
				/*
					$('.flag-sameday').eq(0).html($.cookie('AMCV_F0935E09512D2C270A490D4D@AdobeOrg'))
					document.oncontextmenu=function(){return true;} // 우클릭 허용
					document.onselectstart=function(){return true;} // 드래그 허용
				/* --------------------------------------*/

				//@pck 2020-10-22 sticky v2 적용에 따라 사용하지 않음 (삭제예정)
				/*
				// ^ 팝업 아이콘 toggle
				function updown_turn(){
						$("#pdp_optionsize_updown").toggleClass('uk-active');
						$(".box_popupdown").toggleClass('uk-active');
				}

				// ^ 팝업 아이콘 클릭 이벤트
				$("#pdp_optionsize_updown").click(function(){
                 	$("#pdp_optionsize_sticky").toggle();
					updown_turn();
				});
				*/

				$('[data-add-item]').each(function(i){
					var INDEX = i;
					// wishlist는 동작하지 않도록 제외
					// .sticky_notifyme 모바일 스티키 입고알림 버튼..
					$(this).find('.btn-link:not(".wish-btn")').click(function(e){
						//@pck 2020-10-22 sticky v2 적용에 따라 사용하지 않음  (삭제예정)
						//sticky  장바구니, 바로구매, 패치 버튼 클릭시 상품 업션 sticky 팝업 기능.
						//스티키 #btn_sticky_notifyme 입고알림 버튼..
						/*
						if(	($("#pdp_optionsize_sticky").css('display')=='none') && (!Core.Utils.mobileChk==false)){
							if($(this)[0].hasAttribute("data-not-show-sticky")==false){
								$("#pdp_optionsize_sticky").toggle();
								updown_turn();
								return false;
							}
						}
						*/
						e.preventDefault();
						var _self = $(this);
						var addToCartPromise = Method.moduleValidate(INDEX);
						// THE DRAW Start
						var actionType = _self.attr('action-type');

						if(actionType === 'drawentry'){
							return;
						}else if(actionType === 'drawlogin'){
							Core.Loading.show();
							return;
						}else if(actionType === 'certified'){
							var certificationYnModal = UIkit.modal('#certification-yn-modal', {center:true, bgclose:false, keyboard:false});
							var redirectUrl = $(location).attr('href');
							$.cookie("thedrawCertified", 'thedraw', {expires: 1, path : '/'});
							$.cookie("thedrawRedirectUrl", redirectUrl, {expires: 1, path : '/'});
							certificationYnModal.show();
							return;
						}
						// THE DRAW End

						addToCartPromise.then(function(qty){
							var $form = _self.closest('form');
							itemRequest = BLC.serializeObject($form);
							itemRequest['productId'] = productId;
							itemRequest['quantity'] = qty;

							/* 애드온 상품 추가 */
							var $deferred = $.Deferred();
							var addonProductIndex = 0;
							if(addonComponents){
								for(var key in addonProductGroup){
									if(addonProductGroup[key][0].getValidateChk()){
										var childItems = addonProductGroup[key][0].getChildAddToCartItems();
									    for(var i=0; i<childItems.length; i++){
									        for(var key in childItems[i]){
												itemRequest['childAddToCartItems['+addonProductIndex+'].'+key] = childItems[i][key];
									        }
									    }
										addonProductIndex++;
									}else{
										$deferred.reject();
									}
								}

							}

							$deferred.resolve(itemRequest);
							return $deferred.promise();
						}).then(function(itemRequest){
							var $form = _self.closest('form');
							var actionType = _self.attr('action-type');
							var url = _self.attr('href');

							/*****************************************************************
								유입 channel sessionStorage
								 - channel : 유입된 매체 식별 이름
								 - pid : 상품 식별 code ( productId, style Code, UPC.... )

								사이트 진입시 URL에 channel, pid 가 있을때 매출을 체크 한다.
								channel 만 있을경우에는 모든 상품을 channel 매출로 인지하고
								channel과 pid 둘다 있을경우 해당 상품만 channel 매출로 인지한다.
							*****************************************************************/

							if(sandbox.sessionHistory.getHistory('channel')){
								if(sandbox.sessionHistory.getHistory('pid')){
									if(sandbox.sessionHistory.getHistory('pid') === privateId){
										itemRequest['itemAttributes[channel]'] = sandbox.sessionHistory.getHistory('channel');
									}
								}else{
									itemRequest['itemAttributes[channel]'] = sandbox.sessionHistory.getHistory('channel');
								}
							}

							/* CUSTOM _customproduct.js 기능 이동 */
							Core.Utils.customProduct.addItemRequest(itemRequest);

							Core.Loading.show();
							switch(actionType){
								case 'externalLink' :
									//외부링크
									window.location.href = url;
									break;
								case 'custombuy' :
									Core.Loading.hide();
									var customVal = Core.Utils.customProduct.getCustomBuyVal();
									if(customVal != null && customVal != 'undefined'){
										UIkit.modal.confirm('고객님께서 선택하신 커스텀 서비스는 "'+ customVal +'"입니다.', function(){
											Core.Loading.show();
											BLC.ajax({
												url:url,
												type:"POST",
												dataType:"json",
												data:itemRequest,
												error: function(data){
													Core.Loading.hide();
													UIkit.modal.alert('접속자가 많아 지연되고 있습니다. 다시 시도해주세요.');
													//BLC.defaultErrorHandler(data);
												}
											}, function(data, extraData){
												if(commonModal.active) commonModal.hide();
												if(data.error){
													Core.Loading.hide();
													UIkit.modal.alert(data.error);
													//UIkit.modal.alert('사이즈를 선택하세요.');
												}else {
													_.delay(function () {
														window.location.assign(sandbox.utils.contextPath + '/checkout');
													}, 500);
												}
											});
										}, function(){},
										{
											labels: {'Ok': '확인', 'Cancel': '취소'}
										});
									} else{
										UIkit.modal.confirm('고객님께서는 커스텀 서비스를 선택하지 않으셨습니다. 결제를 진행하시겠습니까?', function(){
											Core.Loading.show();
											BLC.ajax({
												url:url,
												type:"POST",
												dataType:"json",
												data:itemRequest,
												error: function(data){
													Core.Loading.hide();
													UIkit.modal.alert('접속자가 많아 지연되고 있습니다. 다시 시도해주세요.');
													//BLC.defaultErrorHandler(data);
												}
											}, function(data, extraData){
												if(commonModal.active) commonModal.hide();
												if(data.error){
													Core.Loading.hide();
													UIkit.modal.alert(data.error);
													//UIkit.modal.alert('사이즈를 선택하세요.');
												}else {
													_.delay(function () {
														window.location.assign(sandbox.utils.contextPath + '/checkout');
													}, 500);
												}
											});
										}, function(){},
										{
											labels: {'Ok': '확인', 'Cancel': '취소'}
										});
									}
									break;
								default :
									BLC.ajax({
										url:url,
										type:"POST",
										dataType:"json",
										data:itemRequest,
										error: function(data){
											Core.Loading.hide();
											UIkit.modal.alert('접속자가 많아 지연되고 있습니다. 다시 시도해주세요.');
											//BLC.defaultErrorHandler(data);
										}
									}, function(data, extraData){
										if(commonModal.active) commonModal.hide();
										if(data.error){
											Core.Loading.hide();
											UIkit.modal.alert(data.error);
											//UIkit.modal.alert('사이즈를 선택하세요.');
										}else{
											var cartData = $.extend( data, {productId : productId, quantity : itemRequest.quantity, skuId : skuId });
											if(actionType === 'add'){
												miniCartModule.update( function( callbackData ){
													if( callbackData != null ){
														cartData.cartId = callbackData.cartId

														$('#pdp_optionsize_updown').trigger('click');   //모바일 스티키 감추기.
													}
													endPoint.call('addToCart', cartData );


													//EMB productPrice 값 없을경우 예외처리 해야함
													var productCode = $optionWrap.find("[data-model]").data("model");
													var productPrice = $optionWrap.find("[data-price]").data("price");
													var productQuantity = $optionWrap.find("input[name=quantity]").val();
													var widthMatch = matchMedia("all and (max-width: 767px)");
													if (Core.Utils.mobileChk || widthMatch.matches) {
														var mobileChk = 2;
													} else {
														var mobileChk = 1;
													}
													cre('send','AddToCart',{
														id:productCode,
														price:parseInt(productPrice),
														quantity:parseInt(productQuantity),
														currency:'KW',
														event_number:mobileChk
													});
												});

											}else if(actionType === 'modify'){
												var url = Core.Utils.url.removeParamFromURL( Core.Utils.url.getCurrentUrl(), $(this).attr('name') );
												Core.Loading.show();
												endPoint.call( 'cartAddQuantity', cartData );
												_.delay(function(){
													window.location.assign( url );
												}, 500);
											}else if(actionType === 'redirect'){
												endPoint.call( 'buyNow', cartData );
												Core.Loading.show();
												if (_GLOBAL.DEVICE.IS_KAKAO_INAPP && !_GLOBAL.CUSTOMER.ISSIGNIN){
													sandbox.getModule('module_kakao_in_app').submit('/checkout');
												}else{
													_.delay(function(){
														window.location.assign( sandbox.utils.contextPath + '/checkout' );
													}, 500);
												}
											}else if(actionType === 'confirm'){
												Core.Loading.hide();
												// 개인화 작업 추가 confirm

												// 상단 장바구니 아이콘 수량 반영 외 미니카트는 안보이게 처리
												miniCartModule.update( function( callbackData ){
													return {'confirm': true};
												});

												// 개인화 추가. 장바구니 컴펌창 추가
												UIkit.modal.confirm('장바구니에 담겼습니다.', function(){
													_.delay(function(){
														window.location.assign( sandbox.utils.contextPath + '/cart' );
													}, 500);
												}, function(){
													UIkit.modal('#common-modal').hide()
												},
												{
													labels: { 'Ok': '장바구니 가기', 'Cancel': '계속 쇼핑하기' }
												});
											}
										}
									});
								break;
							}
						}).fail(function(msg){
							if(commonModal.active) commonModal.hide();
							if(msg !== '' && msg !== undefined){
								UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'warning'});
							}
						});
					});
				});


				//scrollController
				var scrollArea = sandbox.scrollController(window, document, function(percent){
					var maxOffsetTop = this.getScrollTop($('footer').offset().top);
					var maxHeight = this.setScrollPer(maxOffsetTop);

					if(percent < minOffsetTop && miniOptionIS){
						miniOptionIS = false;
						$('.mini-option-wrap').stop().animate({bottom:-81}, 200);
						$('.mini-option-wrap').find('.info-wrap_product_n').removeClass('active');
						$dim.removeClass('active');
					}else if(percent >= minOffsetTop && percent <= maxOffsetTop && !miniOptionIS){
						miniOptionIS = true;
						$('.mini-option-wrap').stop().animate({bottom:0}, 200);
					}else if(percent > maxOffsetTop && miniOptionIS){
						miniOptionIS = false;
						$('.mini-option-wrap').stop().animate({bottom:-81}, 200);
						$('.mini-option-wrap').find('.info-wrap_product_n').removeClass('active');
						$dim.removeClass('active');
					}
				}, 'miniOption');

				//PDP 상품 설명 영역 스크롤 : 갤러리 영역내 위치 고정
				var summaryScrollController = sandbox.scrollController(window, document, function(per, scrollTop){
					if(sandbox.reSize.getState() === 'pc'){
						if($galleryWrap.height() > $optionWrap.height() && $optionWrap.height() + optionWrapOffsetTop > $(window).height()){

							var galleryHeight = $galleryWrap.height();
							var detailHeight = $productDetailWrap.height();

							//스크롤이 옵션영역 하단에 걸리는 순간
							if( scrollTop > optionWrapOffsetTop + $optionWrap.height() - $(window).height() && scrollTop < optionWrapOffsetTop + galleryHeight - $(window).height() ){
								!$optionWrap.hasClass("fixed") && $optionWrap.removeClass('fixed absolute bottom top').removeAttr("style").addClass('fixed bottom');
							}
							//스크롤이 하단으로 내려갔을 때
							else if( scrollTop >= optionWrapOffsetTop + galleryHeight - $(window).height() ){
								!$optionWrap.hasClass("absolute") && $optionWrap.removeClass('fixed absolute bottom top').removeAttr("style").addClass('absolute').css("bottom", detailHeight - galleryHeight + "px");
							}
							//스크롤이 상단으로 올라갔을 때
							else if( scrollTop <= optionWrapOffsetTop + $optionWrap.height() - $(window).height() ){
								!$optionWrap.hasClass("top") && $optionWrap.removeClass('fixed absolute bottom top').removeAttr("style").addClass('absolute top');
							}
							else {
							    $optionWrap.removeClass('fixed absolute bottom top').removeAttr("style");
							}




						} else {
							//아코디언 정보를 펼친 경우 갤러리 길이 보다 상품옵션이 더 길어 질수 있다
							$optionWrap.removeClass('fixed absolute bottom top').removeAttr("style");
						}
					}
					//스크롤 업/다운 구분을 위해 이전 스크롤 위치 기억
					previousScrollTop = scrollTop;

				}, 'product');

				$('.minioptbtn').click(function(e){
					e.preventDefault();
					$('.mini-option-wrap').find('.info-wrap_product_n').addClass('active');
					$dim.addClass('active');
				});

				$('.mini-option-wrap').on('click', '.close-btn', function(e){
					//console.log('mini-option-wrap');
					e.preventDefault();
					$('.mini-option-wrap').find('.info-wrap_product_n').removeClass('active');
					$dim.removeClass('active');
				});


				//guide option modal
				$this.find('.option-guide').on('click', function(e){
					e.preventDefault();
					guideModal.show();
				});


				$('.uk-quickview-close').click(function(e){
					guideModal.hide();
					isQuickView = true;
				});

				guideModal.off('.uk.modal.product').on({
					'hide.uk.modal.product':function(){
						if(isQuickView){
							setTimeout(function(){
								$('html').addClass('uk-modal-page');
								$('body').css('paddingRight',15);
							});
						}
					}
				});

				var crossSale = $("#crossSale-swiper-container")
				if (crossSale.find(".swiper-wrapper>li").length < 1) {
					crossSale.parent(".category-slider").parent(".related-items").hide();
				}

				//PDP summary에서 상품 설명의 이미지 제거한 내용을 영역에 붙임.
				if($this.find('[data-long-description]').attr('data-long-description')){
					var html = $.parseHTML($this.find('[data-long-description]').attr('data-long-description'));
					$(html).find('div.imgArea').remove().find('script').remove();
				//	$this.find('#pdp-description-summary').empty().append(html);
				}

        		//상품 정보 영역의 높이 줄임처리 (상품정보, 유의사항)
				$infoHeightWrap.each(function(e){
					// e.preventDefault();
					var argmts = Core.Utils.strToJson($(this).attr('data-info-height'), true) || {};
					var pdpInfoSubjectHeight=78;
					var readMoreHeight=65;
					var infoType = argmts.infoType;
					var outerHeight = parseInt(argmts.outerHeight);
					var shortenHeight =  outerHeight-readMoreHeight;
					var contentsHeight = shortenHeight - pdpInfoSubjectHeight;
					var $descriptionWrap;
					if(infoType === 'attention-guide'){
						$descriptionWrap = $(this);
					} else if(infoType === 'product-detail'){
						$descriptionWrap = $(this).closest('.pop-detail-content');
					}

					if(argmts && ($descriptionWrap.outerHeight() > outerHeight || $descriptionWrap.outerHeight() === 0)){
						if(infoType === 'attention-guide'){
							$descriptionWrap.outerHeight(shortenHeight);
							$descriptionWrap.find('.guide-area').height(contentsHeight).css({'overflow':'hidden'});
							$descriptionWrap.find('#read-more').show();
						} else if(infoType === 'product-detail'){
							if($descriptionWrap.find('.conArea').length > 0){
								$descriptionWrap.find('.conArea').height(shortenHeight).width('100%').css({'overflow':'hidden'});
							}

							else if($descriptionWrap.find('.sectionR').length  > 0){
								//$descriptionWrap.find('.sectionR').height(shortenHeight).css({'overflow':'hidden'});
								//상품 설명 두번째 항목까지만 노출하고 이후 항목은 비노출처리 한다.
								//상품 설명 두번째 항목도 2줄까지만 보이도록 multi-line ellipsis 처리 한다.
								$descriptionWrap.find('.sectionR > ul:gt(2)').each(function(){
									$(this).hide();
									$(this).prev("h3") && $(this).prev("h3").hide();
								});
							}

						}
					}
				});

				//1 on 1 이미지 외 상품 설명 제거. 어드민 상품 속성에 porduct1on1이 true인 경우에만 PDP 화면 아래쪽에 표시됨.
				if($this.find('[data-1on1-description]').length > 0){
					var html = $.parseHTML($this.find('[data-long-description]').attr('data-long-description'));
					$(html).find('div.proInfo').remove().find('script').remove();
					$this.find('[data-1on1-description]').empty().append(html);
				}
			},
			moduleValidate:function(index){
				var INDEX = index;
				var deferred = $.Deferred();
				var validateChk = (args.isDefaultSku === 'true') ? true : false;
				var qty = 0;

				if(args.isDefaultSku === 'false'){
					validateChk = sandbox.utils.getValidateChk(productOption, '사이즈를 선택해 주세요.');
				}

				if(Array.isArray(quantity)){
					qty = quantity[INDEX].getQuantity();
				}else{
					qty = quantity.getQuantity();
				}

				if(validateChk && isQuantity && qty != 0){
					deferred.resolve(qty);
				}else if(!isQuantity || qty == 0){
					deferred.reject(args.errMsg);
				}else{
					deferred.reject();
				}

				return deferred.promise();
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-product]',
					attrName:'data-module-product',
					moduleName:'module_product',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				$this = null;
				args = [];
				productOption = null;
				quantity = null;
			},
			getItemRequest:function(){
				return itemRequest;
			},
			getSkuData:function(){
				return currentSkuData;
			}
		}
	});
})(Core);
(function(Core){
	Core.register('module_orderdetail', function(sandbox){
	   var Method = {
		  moduleInit:function(){
			 var $this = $(this);

			 // 당일배송 배송추적 팝업
			 var trackingDto = "";
			 $this.on('click', '[data-deliverycheck]', function(){
				var fgId = $(this).data('deliverycheck');
				var url = sandbox.utils.contextPath+'/account/orders/delivery/tracking' + '?fgId=' + fgId;
				Core.Loading.show();
				BLC.ajax({
				   type : "GET",
				   dataType : "json",
				   url : url,
				},function(data){
					Core.Loading.hide();
				   if(data.result == true){
						var modal = UIkit.modal('#order-delivery-check', {modal:false});
						var trackingDetails = modal.find(".body>table").find("tbody");
						trackingDetails.empty();
						modal.find('.body.info>dl>.referenceNumber').text(data.trackingDto.referenceNumber);
						if(data.trackingDto.trackingDetails !== null){
							trackingDetails.parents('table').show();
							$.each(data.trackingDto.trackingDetails,function(i,item) {
								if(item.stateCode !== "DLV_FAILED"){
									var gYear = item.processDate.substr(0, 4);
									var gMonth = item.processDate.substr(4, 2);
									var gDate = item.processDate.substr(6, 2);
									var gHours = item.processDate.substr(8, 2);
									var gMinutes = item.processDate.substr(10, 2);
									var gSeconds = item.processDate.substr(12, 2);
									var date = gYear + "-" + gMonth + "-" + gDate + " " + gHours + ":" + gMinutes;
									var html = "<tr>";
									html+= "<td>" + date +"</td>";
									if(item.stateCode == 'RECEIVED'){
										html+= "<td>" + (item.processPost!==null?item.processPost:'접수') +"</td>";
									} else{
										html+= "<td>" + item.processPost +"</td>";
									}
									html+= "<td>" + (item.remark!==null?item.remark:'-') +"</td>";
									html+= "</tr>";
									trackingDetails.append(html);
								}
							});
						} else{
							trackingDetails.parents('table').hide();
						}
						modal.show();
				   } else {
					  UIkit.modal.alert('배송추적을 할 수 없습니다.');
				   }
				});
			 });
		  }
	   }
	   return {
		  init:function(){
			 sandbox.uiInit({
				selector:'[data-module-orderdetail]',
				attrName:'data-module-orderdetail',
				moduleName:'module_orderdetail',
				handler:{context:this, method:Method.moduleInit}
			 });
		  }
	   }
	});
 })(Core);

 //주문 상세내역 배송지 정보 변경
 (function(Core){
 	'use strict';

 	Core.register('module_address_change', function(sandbox){
 		var $this, args, modal = null, endPoint;
 		var Method = {
 			moduleInit:function(){
 				// modal layer UIkit 사용
 				$this = $(this);

 				// modal layer UIkit 사용
 				$this = $(this);
 				args = arguments[0];
 				modal = UIkit.modal('#order_change_addresses');
 				endPoint = Core.getComponents('component_endpoint');

				$this.on('click', '#data-address-change', function(e){
 					e.preventDefault();
					modal.show();
 					//Method.modalInit('/kr/ko_kr/account/addresses');
 				});
 			},
 			modalInit:function(url){
 				sandbox.utils.ajax(url, 'GET', {}, function(data){
 					var appendHtml = $(data.responseText).find('.address-form').html();
 					modal.element.find('.contents').empty().append(appendHtml);
 					sandbox.moduleEventInjection(appendHtml);
 					modal.show();
 				});
 			}
 		}

 		return {
 			init:function(){
 				sandbox.uiInit({
 					selector:'[data-module-address-change]',
 					attrName:'data-module-address-change',
 					moduleName:'module_address_change',
 					handler:{context:this, method:Method.moduleInit}
 				});
 			}
 		}
 	});
 })(Core);

 //주소 검색 스크립트
 (function(Core){
	'use strict';

	Core.register('module_order_address_change', function(sandbox){
		var $this, args, endPoint;

		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];
				endPoint = Core.getComponents('component_endpoint');

				var arrComponents = [];
				sandbox.getComponents('component_textfield', {context:$this}, function(){
					this.addEvent('focusout', function(){
						var value = $(this).val();
						if($(this).hasClass('fullName')){
							$this.find('#firstname').val(value);
							$this.find('#lastName').val(value);
						}
					});

					arrComponents.push(this);
				});
				sandbox.getComponents('component_searchfield', {context:$this, resultTemplate:'#address-find-list', isModify:args.isModify}, function(){
					this.addEvent('resultSelect', function(data){
						this.getInputComponent().setValue($(data).data('city') + ' ' + $(data).data('doro'));
						$this.find('#address1').val($(data).data('city') + ' ' + $(data).data('doro')); // 도로명 주소
						$this.find('#postcode').val($(data).data('zip-code5'));

						//상세주소 입력창으로 이동
						$this.find('#address2').focus();
					});

					arrComponents.push(this);
				});

				//배송 메세지.. hidden 에 값 넝어주기.
				$this.find('[data-component-select]').on('change', function(e){
					if($this.find('#selectPersonalMessage option:selected').text() == '직접입력'){
						 $this.find('#div_personalMessageText').removeClass('uk-hidden');   // 직접 입력 배송 메시지 감추기
					}else if($this.find('#selectPersonalMessage option:selected').val()  != ''){
						 $this.find('#div_personalMessageText').addClass('uk-hidden');   // 직접 입력 배송 메세지 오픈
					}
 				});

				//배송지 관리, 기존 주소에서 검색 없이 그냥 수정 후 저장을 누를 경우
				//검색을 통해서 클릭 된것만 저장 될 수 있게 수정
				//hidden addr_save_fild 들어감.
				$(document).on('click','.result-wrap .list', function(e){
					var index = $(this).index();
					var save_addr = $(".result-wrap li").eq(index).find("dd.addr").first().text();
					$this.find('#addr_save_fild').val(save_addr);
				});

				//배송지 이름, 이름 2자 이상 입력 할수 있게 수정.
				var $form = $this.find('.manage-account');
				sandbox.validation.init( $form );

				$this.find('button[type=submit]').off().on('click', function(e){
					e.preventDefault();

					/*
					//휴대폰 번호 체크......
					var hp_defalult = /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})$/;
					var hp_pattern  = /^((01[16789])[1-9][0-9]{6,7})|(010[1-9][0-9]{7})$/;
					var cd_pattern  = /^(1[568][0456789][01456789][0-9]{4})|((01[16789])[1-9][0-9]{6,7})|(010[1-9][0-9]{7})|(050[0-9]{8,9})|((02|0[3-9][0-9])[0-9]{3,4}[0-9]{4})|(0001[568][0456789][01456789][0-9]{4})$/;
					var pattern_chk1 = false;      // false 로 기본 셋팅
					var pattern_chk2 = false;

					var phoneNum = $this.find("input[id='address.phoneNum']").val();

					if(hp_defalult.test(phoneNum)){
						pattern_chk1 = true;
					};

					if(hp_pattern.test(phoneNum)){  //휴대폰 먼저 chk.
						pattern_chk2 = true;
					}else{
						if(cd_pattern.test(phoneNum)){   //휴대폰 패턴이 false 경우, 일반 전화 패턴 chk.
							pattern_chk2 = true;
						};
					};

					if(!pattern_chk1 || !pattern_chk2) {    //검증 pattern_chk1, pattern_chk2 모두 true 이어야만..정상 연락처로....)
						UIkit.modal.alert('배송지 연락처를 정확하게 입력해 주세요!');
						return false;
					}
                    */

					sandbox.validation.validate( $form );
					if(sandbox.validation.isValid( $form )){

						sandbox.setLoadingBarState(true);

						//주소를 검색 없이 직접 수정 후 저장 할 경우 문제 발생, 정확한 주소 입력이 안되는 현상 발생.
						//검색 없이 수정을 할 경우를 대비해서 로직 추가..
						var save_addr = $this.find('#addr_save_fild').val();
						$this.find("#address1").val(save_addr);

						//배송 메세지 저장
						if($this.find('#selectPersonalMessage option:selected').text() == '직접입력'){
							$this.find('#u_personalMessage').val( $this.find('input#personalMessageText').val());
						}else if($this.find('#selectPersonalMessage option:selected').val()  != ''){
							var r_msg = $this.find('#selectPersonalMessage option:selected').text();
							$this.find('#u_personalMessage').val(r_msg);
						}


						//입력된 정보 ajax 전송
						var obj        = $form.serialize();
						var per_url    = sandbox.utils.contextPath + "/account/orders/modify-address";
						var addr_model = UIkit.modal('#order_change_addresses', {modal:false});

						Core.Utils.ajax(per_url, 'POST', obj, function(data){
							var jsonData = Core.Utils.strToJson(data.responseText, true) || {};
							if(jsonData.result==true){
								UIkit.modal.alert(jsonData.message).on('hide.uk.modal', function() {
									sandbox.setLoadingBarState(true);
									location.reload();
							});

							//실패
							}else{
								//	UIkit.notify(args.removeMsg, {timeout:3000,pos:'top-center',status:'warning'});
								addr_model.hide();
								UIkit.modal.alert(jsonData.message).on('hide.uk.modal', function() {
									sandbox.setLoadingBarState(false);
									// location.href = 'repairable?dateType=1';
								});
							}
						});
					}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-order-address-change]',
					attrName:'data-module-order-address-change',
					moduleName:'module_order_address_change',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				$this = null;
				args = null;
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_register', function(sandbox){
		var Method = {
			moduleInit:function(){
				var args = Array.prototype.slice.call(arguments).pop();
				$.extend(Method, args);

				var $this = $(this);
				var $submitBtn = $this.find('button[type="submit"]');

				sandbox.getComponents('component_textfield', {context:$this}, function(){
					this.addEvent('enter', function(e){
						$submitBtn.trigger("click");
					});
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-register]',
					attrName:'data-module-register',
					moduleName:'module_register',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
    Core.register('module_thedraw_order', function(sandbox){
        var args = null;
        var Method = {
            moduleInit:function(){
                var $this = $(this);
                var url = _GLOBAL.SITE.SNKRSCONTEXT_PATH + '/cart/add?directOrder=true';
                var returnUrl = location.pathname;

                $this.find('[data-cart]').on('click', function(){

                    var csrfToken = $this.find('input[name="csrfToken"]').val();
                    var productId = $this.attr('productId');
                    var itemAttributes = $this.attr('itemAttributes');
                    var SIZE = $this.attr('SIZE');
                    var quantity = $this.attr('quantity');
                    var attributename = $this.attr('attributename');

                    //드로우용  Attribute  추가
                    var draw_itemAttributes = $this.attr('draw_itemAttributes');
                    var draw_attributename = $this.attr('draw_attributename');

                    var dataJson = {"productId" : productId,
                        "SIZE" : SIZE,
                        "quantity" : quantity,
                        "csrfToken" : csrfToken,
                        "attributename" : attributename};
                    var name         = 'itemAttributes['+attributename+']';
                    var draw_name    = 'userDefinedFields['+draw_attributename+']';

                    dataJson[name]      = itemAttributes;
                    dataJson[draw_name] = draw_itemAttributes;

                    //드로우 구매하기 버튼 태깅 추가
                    var product_name    = $this.attr('product_name');
                    var product_id      = $this.attr('product_id');
                    var product_unit_price      = $this.attr('product_unit_price');
                    var product_discount_price  = $this.attr('product_discount_price');
                    var click_area  = $this.attr('click_area');

                    data = {};
                    data.click_area = click_area;  // 마이페이지(my page) , 스니커즈pdp(pdp) 두군데 에서 진입

                    data.products = [
    					{
    						product_id : product_id,
    						product_name : product_name,
    						product_unit_price : Number(product_unit_price),
    						product_quantity : 1,   //수량
    						product_discount_price : Number(product_discount_price)
    					}
    				];

                    endPoint.call( 'the_draw', data);  //태깅 콜 발생..


                    BLC.ajax({
                        type : "POST",
                        dataType : "json",
                        url : url,
                        data : dataJson
                    },function(data){
                        if(data.error){
                            sandbox.setLoadingBarState(false);
                            UIkit.modal.alert(data.error).on('hide.uk.modal', function () {
                                window.location.href = returnUrl;
                            });
                        }else{
                            Core.Loading.show();
                            _.delay(function () {
                                window.location.assign(_GLOBAL.SITE.SNKRSCONTEXT_PATH + '/checkout');
                            }, 500);
                        }
                    });
                    return;
                });
            }
        }
        return {
            init:function(){
                sandbox.uiInit({
                    selector:'[data-module-thedraw-order]',
                    attrName:'data-module-thedraw-order',
                    moduleName:'module_thedraw_order',
                    handler:{context:this, method:Method.moduleInit}
                });
            }
        }
    });
})(Core);

(function(Core){
	Core.register('module_review', function(sandbox){
		var $deferred, $this, modal, args, arrQueryString = [], currentProductId, isSignIn;
		var Method = {
			moduleInit:function(){
				args = arguments[0];
				$this = $(this);
				isSignIn = (args.isSignIn === 'true') ? true : false;

				//필터조건 초기화 ( 최신순, 도움순 )
				arrQueryString[2] = sandbox.utils.getQueryParams($('.sort-tabs').find('.sort-item').filter('.active').attr('href'), 'array').join('&');

				//modal init
				// modal = UIkit.modal('#common-modal', {center:true});
				modal = UIkit.modal('#common-modal-large', {center:true});
				modal.off('hide.uk.modal.review').on({
					'hide.uk.modal.review':function(){
						$this.find('.contents').empty();
						if(isSignIn != sandbox.getModule('module_header').getIsSignIn()){
							if(currentProductId) Method.reviewProcessorController(currentProductId);
						}
					}
				});

				endPoint = Core.getComponents('component_endpoint');

				var param = {};
				param.link_name= "Click Links";
				param.click_area = "pdp";
				param.click_name = "review_view more";
				param.page_event = {
					link_click : true
				}

				$this.find('.shorten-toggle').on('click', function(e){
					if($(this).text()=='더보기'){
				  		endPoint.call('adobe_script', param);
			  		};
				});

				// product detail 상품 리뷰 쓰기
				$this.find('.review-write-btn').off('click').on('click', function(e){
					e.preventDefault();

					var target = $(this).attr('href');
					var productId = $(this).attr('data-productid');

					if(!productId){
						UIkit.notify('productID 가 없습니다.', {timeout:3000,pos:'top-center',status:'warning'});
						return;
					}

					Method.reviewTask(target, productId);
				});

				//review filter
				$this.find('a.review-filter').on('click', function(e){
					e.preventDefault();
					var query = sandbox.utils.getQueryParams($(this).attr('href'), 'array').join('&');
					var productId = $(this).attr('data-productid');

					if($(this).hasClass('star')){
						arrQueryString[0] = query;
					}else if($(this).hasClass('hash')){
						arrQueryString[1] = query;
					}else if($(this).hasClass('other')){
						arrQueryString[2] = query;
					}

					Method.reviewProcessorController(productId);
				});

				$this.find('.review-filter-delete').on('click', function (e) {
					e.preventDefault();

					var query = sandbox.utils.getQueryParams($(this).attr('href'), 'array').join('&');
					var productId = $(this).attr('data-productid');

					arrQueryString = [];
					arrQueryString[2] = query;
					Method.reviewProcessorController(productId);
				});

				$this.find('.btn-more-review').on('click', function(e){
					e.preventDefault();
					var productId = $(this).attr('data-productid');

					// 처음 팝업이 열릴때는 리스트를 불러온다.
					var isFirstLoad = UIkit.modal('#detail-review-all').dialog.find('#review-list').find('li').length == 0;

					if (isFirstLoad) {
						Method.reviewProcessorController(productId, function(){
							UIkit.modal('#detail-review-all').show();
						}, 100);
					}else{
						UIkit.modal('#detail-review-all').show();
					}
				})

				Method.eventInitialize(this);

				/* browse history back */
				if(sandbox.utils.mobileChk) {
					$(window).on('popstate', function(e) {
						var data = e.originalEvent.state;
						if(modal && modal.active){
							modal.hide();
						}
					});
				}
			},
			eventInitialize:function(target_el){
				//review feedback
				var feedBack = sandbox.getComponents('component_like', { context: $(target_el).find('.read-list') }, function () {
					this.addEvent('likeFeedBack', function (data) {
						var feedBackTotal = 0;
						if (data.hasOwnProperty('HELPFUL')) {
							feedBackTotal = parseInt(data.HELPFUL);
						}
						if (data.hasOwnProperty('NOTHELPFUL')) {
							feedBackTotal = parseInt(data.NOTHELPFUL);
						}

						var currentFeedBackTotal = parseInt($(this).find('.num').text()); //현재 카운트

						if( currentFeedBackTotal >= feedBackTotal ){ // 2020-06-03 @pck 서버에서 간혹 추천 개수가 현재와 동일하게 오는 경우를 대비해서 서버 값이 미증가 시 강제로 증가
							currentFeedBackTotal++;
                        }else{
                            currentFeedBackTotal = feedBackTotal;
                        }
						$(this).find('.num').text( String(currentFeedBackTotal) );
					});
				});

				$(target_el).find('.read-list, #mypage_review_list').off('click')
					// 상품 리뷰 수정
					.on('click', '.review-modify', function (e) {
						e.preventDefault();
						e.preventDefault();
						var target = $(this).attr('href');
						var url = $(this).attr('data-link');
						var productId = $(this).attr('data-productid');
						var defer = $.Deferred();
						var successMsg = $(this).attr('data-successmsg');
						//review 모달 css 추가
						$(target).addClass('review-write');

						sandbox.utils.promise({
							url: url,
							type: 'GET',
							data: { 'redirectUrl': location.pathname }
						}).then(function (data) {
							$(target).find('.contents').empty().append(data);
							sandbox.moduleEventInjection(data, defer);
							modal.show();
							return defer.promise();
						}).then(function (data) {
							//arrQueryString = [];
							UIkit.notify(successMsg, { timeout: 3000, pos: 'top-center', status: 'success' });
							Method.reviewProcessorController(productId);
						}).fail(function (msg) {
							defer = null;
							UIkit.notify(msg, { timeout: 3000, pos: 'top-center', status: 'danger' });
						});

					})
					.on('click', '.review-remove, .mypage-review-remove', function (e) {
						e.preventDefault();
						var _self = this;
						var url = $(this).attr('href');
						var productId = $(this).attr('data-productid');
						var reviewId = $(this).attr('data-reviewId');
						var successMsg = $(this).attr('data-successmsg');

						//마이페이지 리뷰 삭제인지 pdp 인지 분기처리  버튼 클래스명으로..
						var mypagereview = $(this).hasClass('mypage-review-remove');  //true면  마이페이지

						UIkit.modal.confirm("리뷰 삭제 시 50마일이 차감됩니다.</br>삭제할까요?", function () {
							sandbox.utils.ajax(url, 'GET', {}, function (data) {
								var data = sandbox.rtnJson(data.responseText);
								if (data.result) {
									UIkit.notify(successMsg, { timeout: 3000, pos: 'top-center', status: 'success' });

									location.reload();

									/*
									if (mypagereview) { //마이페이지 에서는 리로드 한다.
										location.reload();
									} else {
										Method.reviewProcessorController(productId);
									}
									*/

								} else {
									UIkit.notify(data.errorMessage, { timeout: 3000, pos: 'top-center', status: 'danger' });
								}
							});
						});
					})
			},
			reviewTask:function(target, productId){
				var defer = $.Deferred();
				currentProductId = productId;

				sandbox.getModule('module_header').setModalHide(true).setLogin(function(data){
					//console.log('review : ', data);
					var isSignIn = data.isSignIn;
					sandbox.utils.promise({
						url:sandbox.utils.contextPath + '/review/reviewWriteCheck',
						type:'GET',
						data:{'productId':productId}
					}).then(function(data){
						//data.expect 기대평
						//data.review 구매평
						if(data.expect || data.review){
							/* review history */
							if(sandbox.utils.mobileChk) history.pushState({page:'review'}, "review", location.href);
							isSignIn = isSignIn;
							return sandbox.utils.promise({
								url:sandbox.utils.contextPath + '/review/write',
								type:'GET',
								data:{'productId':productId, 'redirectUrl':location.pathname, 'isPurchased':data.review}
							});
						}else{
							defer.reject('리뷰를 작성할 수 없습니다.');
						}
					}).then(function(data){
						$(target).addClass('review-write');
						$(target).find('.contents').empty().append(data);
						sandbox.moduleEventInjection(data, defer);
						modal.show();
						return defer.promise();
					}).then(function(data){
						Method.reviewProcessorController(productId);
						modal.hide();
					}).fail(function(msg){
						defer = null;
						UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
						if(modal.isActive()) modal.hide();
					});
				});
			},
			reviewProcessorController:function(productId, callback, delay){
				// 리뷰를 작성한 후 or 리뷰 정렬을 할 때 새로 로드하여 화면 갱신 처리 하는 함수
				var arrData = [];
				var obj = {
					/*'mode':'template',
					'templatePath':'/modules/productListReview',
					'resultVar':'review',*/
					'productId':productId
				}

				for(var key in obj){
					arrData.push(key+'='+obj[key]);
				}

				///processor/execute/review      /review/list, /account/reviewlist
				//console.log(arrQueryString.join('&'));

				//템플릿 캐시로 인해 추가된 로딩바 상태
				sandbox.setLoadingBarState(true);

				_.delay(function(){
					sandbox.utils.ajax(args.api, 'GET', arrData.join('&') + arrQueryString.join('&') + '&mode=template&resultVar=reviewSummaryDto', function(data){
	                    // 탭 선택시 페이지 초기화
	                    sessionStorage.setItem('categoryCurrentPage', 1);

	                    //li 부분만 서버에서 받은 템플릿으로 교체 한다.
						var ulTag = $(args.target).find('#review-list');

						ulTag.empty();
						//PDP의 리뷰서머리 부분을 업데이트 한다.(3개만 표시)
						var ulTagSummary = $('#review-summary');
						ulTagSummary.empty();
	                    $(data.responseText).find('li').each(function(index){
	                    	var li = $(this);
							if(ulTag){
								ulTag.append(li.clone());
							}
							if(ulTagSummary && index < 3){
								ulTagSummary.append(li.clone());
							}
						});

						// 페이징 영역 새로 그리기
						$(args.target).find('#review-paging').empty().append($(data.responseText).find('#review-paging').html());

	                    //다른 텝에서 '더 보기'를 눌러 전체 리뷰를 로드한 경우 버튼이 없으므로 다시 설정
	                    if($this.find('button#load-more').css("display") == "none"){
							$('button#load-more').show();
						}

						sandbox.moduleEventInjection(data.responseText);
						Method.eventInitialize($this);

						if (typeof callback === 'function'){
							callback();
						}
					}, false, false);
				},
				delay || 2500);

			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-review]',
					attrName:'data-module-review',
					moduleName:'module_review',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				$deferred = null;
				$this = null;
				args = null;
				modal = null;

				//console.log('destroy reveiw module');
			},
			setDeferred:function(defer){
				$deferred = defer;
			},
			history:function(){

			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_pageredirect', function(sandbox){

		var Method = {
			moduleInit:function(){
                var $this = $(this);
				// var args = arguments[0];
                //강제 리다이렉트..별 쓸모 없어 보임
                if($this.attr('data-type') === 'COD'){
                document.location = '/mypage';
                }
			}
		}
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-pageredirect]',
					attrName:'data-module-pageredirect',
					moduleName:'module_pageredirect',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	'use strict';

	Core.register('module_shipping_address_write', function(sandbox){
		var $this, args, endPoint;

		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];
				endPoint = Core.getComponents('component_endpoint');

				var arrComponents = [];
				sandbox.getComponents('component_textfield', {context:$this}, function(){
					this.addEvent('focusout', function(){
						var value = $(this).val();
						if($(this).hasClass('fullName')){
							$this.find('#firstname').val(value);
							$this.find('#lastName').val(value);
						}
					});

					arrComponents.push(this);
				});
				sandbox.getComponents('component_searchfield', {context:$this, resultTemplate:'#address-find-list', isModify:args.isModify}, function(){
					this.addEvent('resultSelect', function(data){
						this.getInputComponent().setValue($(data).data('city') + ' ' + $(data).data('doro'));
						$this.find('#address1').val($(data).data('city') + ' ' + $(data).data('doro')); // 도로명 주소
						$this.find('#postcode').val($(data).data('zip-code5'));

						//상세주소 입력창으로 이동
						$this.find('#address2').focus();
					});

					arrComponents.push(this);
				});


				//배송지 관리, 기존 주소에서 검색 없이 그냥 수정 후 저장을 누를 경우
				//엉뚱한 주소가 저장되는 현상 발생, 검색을 통해서 클릭 된것만 저장 될 수 있게 수정
				//hidden addr_save_fild 들어감.
				$(document).on('click','.result-wrap .list', function(e){
					var index = $(this).index();
					var save_addr = $(".result-wrap li").eq(index).find("dd.addr").first().text();

						$this.find('#addr_save_fild').val(save_addr);
				});

				//배송지 이름, 이름 2자 이상 입력 할수 있게 수정.
				var $form = $this.find('.manage-account');
				sandbox.validation.init( $form );

					$this.find('button[type=submit]').off().on('click', function(e){
						e.preventDefault();

						sandbox.validation.validate( $form );
						if(sandbox.validation.isValid( $form )){
							var count = 0;
							$.each(arrComponents, function(i){
								if(!this.getValidateChk()){
									this.setErrorLabel();
								}else{
									count++;
								}
							});

							if(arrComponents.length === count){
								sandbox.setLoadingBarState(true);
								if( args.isModify == "true" ){
									endPoint.call('updateProfile', 'address book:edit shipping');
								}else{
									endPoint.call('updateProfile', 'address book:add shipping');
								}

								//주소를 검색 없이 직접 수정 후 저장 할 경우 문제 발생, 정확한 주소 입력이 안되는 현상 발생.
								//검색 없이 수정을 할 경우를 대비해서 로직 추가..
								var save_addr = $this.find('#addr_save_fild').val();
								$this.find("#address1").val(save_addr);

								$this.find('form').submit();
							}
						}
					});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-shipping-address-write]',
					attrName:'data-module-shipping-address-write',
					moduleName:'module_shipping_address_write',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				$this = null;
				args = null;
			}
		}
	});
})(Core);

// 추천 상품일 경우 해당 장바구니, 주문완료 된 상품의 modelCode 태깅 요청

(function (Core) {
	Core.register('module_personalize', function (sandbox) {

		var Method = {

			moduleInit: function () {
				// swipe 모듈을 따로 만듬
				return;

				var $this = $(this);
				
				var _slidesPerView = 5;

				// 개인화 다이나믹 스와프 기능 PC / iPad / mobile 분기처리

				if (typeof $this.data('module-personalize') === 'object') {
					_slidesPerView = $this.data('module-personalize').slidesPerView
				}
				var md = new MobileDetect(window.navigator.userAgent);
				if (md.mobile() == 'iPad') {
					var crossSaleswiper = new Swiper($this.find('.crossSale-swiper-personalize'), {
						slidesPerView: 'auto',
						slidesPerView: _slidesPerView,
						slidesPerGroup: _slidesPerView,
						spaceBetween: 10,
						pagination: {
							el: '.swiper-pagination',
							clickable: true,
						},
						scrollbar: {
							el: '.swiper-scrollbar',
							hide: true
						},
					});
				} else if (md.mobile()) {
					var crossSaleswiper = new Swiper($this.find('.crossSale-swiper-personalize'), {
						slidesPerView: 'auto',
						spaceBetween: 10,
						pagination: {
							el: '.swiper-pagination',
							clickable: true,
						},
						scrollbar: {
							el: '.swiper-scrollbar',
							hide: true
						},
					});
				} else {
					// PC
					var crossSaleswiper = new Swiper($this.find('.crossSale-swiper-personalize'), {
						slidesPerView: 5,
						slidesPerGroup: 5,
						spaceBetween: 16,
						simulateTouch: false,
						noSwiping: true,
                        noSwipingClass: 'no-swiping'
					});
				}
			}
		}

		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-personalize]',
					attrName: 'data-module-personalize',
					moduleName: 'module_personalize',
					handler: {
						context: this,
						method: Method.moduleInit
					}
				});
			}
		}
	});
})(Core);
(function(Core){
	'use strict';

	Core.register('module_date_filter', function(sandbox){
		var Method = {
			$that:null,
			moduleInit:function(){
				var $this = $(this);
				Method.$that = $this;
				Method.$start = Method.$that.find('#start-date');
				Method.$end = Method.$that.find('#end-date');

				//css로 처리가 안되어 강제아코디언 height auto 추가;
				//꼭 지워야한다.
				setTimeout(function(){
					$this.find('.uk-accordion').css('height','auto');
				}, 100);

				$this.find('[data-date-list] a').on('click', function(){
					var value = $(this).attr('data-date');
					var currentQueryParams = sandbox.utils.getQueryParams(location.href);
					var arrCurrentQuery = [];
					for(var key in currentQueryParams){
						if(key !== 'fgType' && key !== 'ableCod' && key !== 'fulfillType'){
							arrCurrentQuery.push(key+'='+currentQueryParams[key]);
						}
					}

					switch(value){
						case '' :
							window.location.href = location.pathname;
							break;
						case 'ship' :
							window.location.href = location.pathname +'?'+ 'fgType=PHYSICAL_SHIP&fulfillType=type1';
							break;
						case 'pickup' :
							window.location.href = location.pathname +'?'+ 'fgType=PHYSICAL_PICKUP&fulfillType=type2';
							break;
						case 'bopis' :
							window.location.href = location.pathname +'?'+ 'ableCod=exclude&fulfillType=type1';
							break;
						case 'ropis' :
							window.location.href = location.pathname +'?'+ 'ableCod=only&fulfillType=type2';
							break;
					}
				});

				$this.find('[data-search-btn]').on('click', function(){
					if( Method.getValidateDateInput() ){
						var start = Method.$start.val().toString();
						var end = Method.$end.val().toString();

						//alert( start );
						//alert( moment(start, 'YYYYMMDD') );
						//alert( moment(start, 'YYYY.MM.DD').format('YYYYMMDD'));
						Method.searchSubmit( moment(start, 'YYYY.MM.DD').format('YYYYMMDD'), moment(end, 'YYYY.MM.DD').format('YYYYMMDD'), 'detail' );
					}else{
						UIkit.modal.alert( '기간을 선택해 주세요' );
					}
				});

				// 초기화
				$this.find('[data-reset-btn]').on('click', Method.reset);

				// uikit datepicker module 적용
				$this.find('input[class="date"]').each( function(){
					if( !moment($(this).val(), 'YYYY.MM.DD').isValid() ){
						$(this).val('');
					}
					if( $.trim( $(this).val() ) != ''){
						$(this).val( moment($(this).val(), 'YYYYMMDD').format('YYYY.MM.DD'));
					}
					var datepicker = UIkit.datepicker($(this), {
						maxDate : true,
						format : 'YYYY.MM.DD'
					});

					datepicker.on( 'hide.uk.datepicker', function(){
						$(this).trigger('focusout');
						Method.updateDateInput();
					});
				});

				//data-module-date-filter
			},

			// 앞보다 뒤쪽 날짜가 더 뒤면 두값을 서로 변경
			updateDateInput:function(){
				var start = String(Method.$start.val());
				var end = String(Method.$end.val());

				if( $.trim( start ) == '' || $.trim( end ) == ''  ){
					return;
				}

				// 같다면
				//var isSame = moment(Method.$start.val()).isSame(Method.$end.val());
				// 작다면
				//var isBefore = moment(Method.$start.val()).isBefore(Method.$end.val());
				// 크다면

				var isAfter = moment(start, 'YYYY.MM.DD').isAfter(moment(end, 'YYYY.MM.DD'));

				if( isAfter ){
					var temp = Method.$end.val();
					Method.$end.val( Method.$start.val() );
					Method.$start.val( temp );
				}
			},
			getValidateDateInput:function(){
				var start = String(Method.$start.val());
				var end = String(Method.$end.val());

				if( moment( start, 'YYYY.MM.DD' ).isValid() && moment( end, 'YYYY.MM.DD' ).isValid() ){
					return true;
				}
				return false;
			},
			searchSubmit:function( start, end, type ){
				var url = sandbox.utils.url.getCurrentUrl();
				url = sandbox.utils.url.removeParamFromURL( url, 'dateType' );

				// 전체 검색
				if(_.isUndefined( start )){
					url = sandbox.utils.url.removeParamFromURL( url, 'stdDate' );
					url = sandbox.utils.url.removeParamFromURL( url, 'endDate' );
				}else{
					var opt = {
						stdDate : start,
						endDate : end,
						dateType : type
					}

					url = sandbox.utils.url.appendParamsToUrl( url, opt )
				}

				window.location.href = url;

			},
			reset:function(){
				//Method.$start.val('').trigger('focusout');
				//Method.$end.val('').trigger('focusout');
				window.location.href = location.pathname;
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-date-filter]',
					attrName:'data-module-date-filter',
					moduleName:'module_date_filter',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_personalize_switcher', function(sandbox){
		var $this;
		var Method = {

			moduleInit:function(){
				var $this = $(this);

				
				var list = [];

				$this.find('> div').each(function (i, ele) {

					// 개인화 다이나믹 탭메뉴 중 상품이 없는 메뉴는 삭제
					if ($(ele).find('.compoment-dynamic article').hasClass('items-null')) {

						console.log($(ele))

						$(ele)
							.css('display','none')
							.closest('.tab-container-swper')
							.prev('.tab-title-container-swper')
							.find('.uk-display-inline-block li')
							.eq(i)
							.css('display','none')
					}
					
					list.push($(ele).find('.compoment-dynamic article').hasClass('items-null'));
				})

				// 개인화 탭메뉴 중 상품이 전체 없을 때 타이틀 삭제
				if ( _.uniqBy(list, true)[0] ) {

					console.log(_.uniqBy(list, true)[0])
					
				    $this
				        .prev('.tab-title-container-swper')
				        .remove();
				}
			}
		}
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-personalize-switcher]',
					attrName:'data-module-personalize-switcher',
					moduleName:'module_personalize_switcher',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_giftcard_credit', function(sandbox){
		var Method = {
			moduleInit:function(){
				var $this = $(this);
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[ data-module-giftcard-credit]',
					attrName:'data-module-giftcard-credit',
					moduleName:'module_giftcard_credit',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function (Core) {
	'use strict';
	Core.register('module_snkrs_polling', function (sandbox) {
		var $this, args, $form, pollingId, fadeEffectClass, activeClass, activeTargetClass, numberClass, numberEffectClass, $answer1Zone, $answer2Zone, answer1Rate, answer2Rate;
		var Method = {
			moduleInit: function () {
				console.log('init');
				$this = $(this);
				args = arguments[0];
				pollingId = args;
				fadeEffectClass = $(this).attr("fade-effect-class");
				activeClass = $(this).attr("active-class");
				activeTargetClass = $(this).attr("active-target-class");
				numberClass = $(this).attr("number-class");
				numberEffectClass = $(this).attr("number-effect-class");
				$this.find('[module-snkrs-polling-answer]').on('click', Method.submitAnswer);
				
				$answer1Zone = $this.find('[module-snkrs-polling-answer1]');
				$answer2Zone = $this.find('[module-snkrs-polling-answer2]');
				try {
					if ($answer1Zone != null) {
						answer1Rate = Number($answer1Zone.attr("module-snkrs-polling-answer1"));
						answer2Rate = Number($answer2Zone.attr("module-snkrs-polling-answer2"));
					}
				} catch(ex) {
					console.log(ex);
				}
			},
			submitAnswer: function(e) {
				var issignin = $(this).parent('div').data('issignin');
				if(issignin == false){
					var isRequiredLogin = $(this).parent('div').data('required-login') || false;	
					if(isRequiredLogin){
						$('#login-info-polling-modal').find('[data-link-target]').attr('href', Core.Utils.contextPath+'/login?successUrl='+String(window.location.pathname).replace(Core.Utils.contextPath,''));
						Core.ui.modal.open('login-info-polling-modal', { modal:false});
						return; 
					}
				}
				var answer = $(this).attr('module-snkrs-polling-answer');
				$(this).addClass(fadeEffectClass);
				var polling = $(this).parent('div');
				$(this).parent().next('.'+activeTargetClass).addClass(activeClass);
				var pollingNumEffect = $(this).parent().next('.'+numberClass);
		        setTimeout(function(){pollingNumEffect.addClass(numberEffectClass);},1000);
		        setTimeout(function(){
		        	polling.addClass(activeClass);
			        //투표응답 비율은 Max 85 : 15
			        if( answer1Rate != 100 && answer1Rate >= 85) { 
			        	answer1Rate = 85;
			        }
			        if( answer1Rate != 100 && answer1Rate !=0 && answer1Rate <= 15) {
			        	answer1Rate = 15;
			        }
			        if( answer2Rate != 100 && answer2Rate >= 85) {
			        	answer2Rate = 85;
			        }
			        if( answer2Rate != 100 && answer2Rate !=0 && answer2Rate <= 15) {
			        	answer2Rate = 15;
			        }
			        
			        if(answer1Rate != 0){
			        	$answer1Zone.css( { 'width': 'calc('+answer1Rate+'% - 1px)' });
			        }
			        if(answer2Rate != 0){
			        	$answer2Zone.css( { 'width': 'calc('+answer2Rate+'% - 1px)' });
			        }
					
			        if (answer1Rate == 100) {
			        	$answer1Zone.addClass('poll-full');
			        }
			        if (answer1Rate == 0) {
			        	$answer1Zone.css( { 'opacity': '0' });
			        }
			        if (answer2Rate == 100) {
			        	$answer2Zone.addClass('poll-full');
			        }
			        if (answer2Rate == 0) {
			        	$answer2Zone.css( { 'opacity': '0' });
			        }
			        
			        if (answer1Rate > answer2Rate && answer2Rate != 0) {
			        	$answer1Zone.addClass('selected');
			        	$answer2Zone.addClass('not-selected');
			        }
			        if (answer2Rate > answer1Rate && answer1Rate != 0) {
			        	$answer1Zone.addClass('not-selected');
			        	$answer2Zone.addClass('selected');
			        }
			        if (answer2Rate == answer1Rate) {
			        	$answer1Zone.addClass('selected');
			        	$answer2Zone.addClass('selected');
			        }
		        },1000);
		        setTimeout(function(){ 
		        	if(polling.hasClass(activeClass)){
			        	$('[polling-answer-'+answer+']').removeClass('bg');
			        }
		        },1000);
		        
		       
				$this.find('[module-snkrs-polling-answer]').off('click');
				
		        var url = sandbox.utils.contextPath +"/polling/apply";
		        var params = {
		        	pollingId : pollingId,
		        	answer : answer
        		};

				Core.Utils.ajax(url, 'GET', params, function (data) {
					var resultData = data.responseJSON;
					if (resultData.code != '0') {
						UIkit.modal.alert(resultData.message);
					}
				});
			},
			
		}
		return {
			init: function () {
				sandbox.uiInit({
					selector: '[data-module-snkrs-polling]',
					attrName: 'data-module-snkrs-polling',
					moduleName: 'module_snkrs_polling',
					handler: { context: this, method: Method.moduleInit }
				});
			}
		}
	});
})(Core);
(function(Core){
	Core.register('module_image_list', function(sandbox){
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var $item = $this.find('[data-image-item]');
				var total = $item.length;

				$item.on('mouseenter', function(){
					$(this).find('.hover').show();
				});

				$item.on('mouseleave', function(){
					$(this).find('.hover').hide();
				});
				
				if( $this.find('.not').length > 0 ){
				    $item.addClass('uk-width-medium-1-' + total); 
				}
				$this.show();
			},
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-image-list]',
					attrName:'data-module-image-list',
					moduleName:'module_image_list',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_restock', function(sandbox){

		// 입고 알림 신청 슬라이더
		$('.mtopslider').bxSlider({captions: true});

		// UIkit.modal('#restock-notification').show();
		UIkit.modal.dialog.template = '<div class="uk-modal module_restock"><div class="uk-modal-dialog"></div></div>';

		// UIkit confirm clone "confirm_title"
		UIkit.modal.confirm_title = function (content, onconfirm, oncancel) {
			var options = arguments.length > 1 && arguments[arguments.length-1] ? arguments[arguments.length-1] : {};

			onconfirm = UIkit.$.isFunction(onconfirm) ? onconfirm : function(){};
			oncancel  = UIkit.$.isFunction(oncancel) ? oncancel : function(){};
			options   = UIkit.$.extend(true, {bgclose:false, keyboard:false, modal:false, labels:UIkit.modal.labels}, UIkit.$.isFunction(options) ? {}:options);

			var result = '<h1>' + String(content.mainMsg) + '</h1>' + '<p>' + String(content.subMsg) + '</p>';

			var modal = UIkit.modal.dialog(([
				'<div class="uk-margin uk-modal-content">' + result + '</div>',
				'<div class="uk-modal-footer uk-text-center"><button class="uk-button js-modal-confirm-cancel">' + options.labels.Cancel + '</button> <button class="uk-button uk-button-primary js-modal-confirm">'+options.labels.Ok+'</button></div>'
			]).join(""), options);

			modal.element.find(".js-modal-confirm, .js-modal-confirm-cancel").on("click", function(){
				UIkit.$(this).is('.js-modal-confirm') ? onconfirm() : oncancel();
				modal.hide();
			});

			modal.on('show.uk.modal', function(){
				setTimeout(function(){
					modal.element.find('.js-modal-confirm').focus();
				}, 50);
			});

			return modal.show();
		};

		// UIkit alert clone "alert_title"
		UIkit.modal.alert_title = function (content, options) {

			options = UIkit.$.extend(true, {bgclose:false, keyboard:false, modal:false, labels:'확인'}, options);

			if (typeof content === 'object') {
				var result = '<h1>' + String(content.mainMsg) + '</h1>' + '<p>' + String(content.subMsg) + '</p>';
			} else {
				var result = '<h1>' + String(content) + '</h1>';
			}

			var modal = UIkit.modal.dialog(([
				'<div class="uk-margin uk-modal-content">' + result + '</div>',
				'<div class="uk-modal-footer uk-text-center"><button class="uk-button uk-button-primary uk-modal-close">' + options.labels + '</button></div>'
			]).join(""), options);

			modal.on('show.uk.modal', function(){
				setTimeout(function(){
					modal.element.find('button:first').focus();
				}, 50);
			});

			return modal.show();
		};

		var $this = $(this);
		var endPoint, allSkuData, args, formatPhone, NotifyName;
		var Method = {
			moduleInit:function(){
				//SKU 정보에서 재고수량을 확인 하여 입고 알림 가능한 사이즈만 활성화
				//skuData는 productOptionComponent 에서 리턴 받는다,
				//단 출시예정상품(args.isForcedDisplay === 'true')일 경우에는 모든 사이즈를 선택가능하도록 활성화 한다.

				args = arguments[0];
				endPoint = sandbox.getComponents('component_endpoint');

				if(args.isForcedDisplay === 'false'){
					if(sandbox.getComponents('component_product_option', {context:$(document)}) !== undefined){
						sandbox.getComponents('component_product_option', {context:$(document)}, function () {
							this.addEvent('skuLoadComplete', function(data){
								allSkuData = data;
								Method.checkQuantity();

								//입고알림 문자받기 show or hide
								if($("#set-restock-alarm").length > 0 && allSkuData){
									for(var index = 0; allSkuData.length > index; index++){
										if(allSkuData[index].quantity == 0){
											//enable 입고알림문자받기
											$('#set-restock-alarm').show();
											break;
										}
									}
								}

								// ONE SIZE 초기값 설정
								var oneSize = $('#size-grid li');
								if (oneSize.hasClass('ONE')) {
									oneSize.find('a').addClass('selected');
									$('#size-value').text(oneSize.text()).attr('data-sku-id', allSkuData[0].skuId);
								}
							});
						});
					}else{
						//출시된상품이며, 카테고리 리스트 페이지에서 입고알림신청을 받을때 사용된다.
						Core.Utils.ajax(Core.Utils.contextPath + '/productSkuInventory', 'GET', {productId:args.productId}, function(data){
							var responseData = data.responseText;
							allSkuData = Core.Utils.strToJson(responseData).skuPricing || {};
							Method.checkQuantity();
						}, false, true);
					}
				}else{
					//출시예정상품
					var formData = sandbox.utils.getQueryParams($(this).find('#stockAlertForm').serialize());
					sandbox.utils.ajax(sandbox.utils.contextPath + '/restock/beforeLaunch', 'POST', {
						requestUri:args.productUri.replace(sandbox.utils.contextPath, ''),
						csrfToken:formData.csrfToken
					}, function(data){
						allSkuData = sandbox.utils.strToJson(data.responseText);
						Method.checkQuantity();

						if($("#set-restock-alarm").length > 0){
							$('#set-restock-alarm').show();
						}
					}, false, true);
				}

				sandbox.getComponents('component_categoryitem', {context:$(document)}, function () {
					// _self.fireEvent('skuLoadComplete', _self, [allSkuData]);
					this.addEvent('skuLoadComplete', function (data, Notify) {
						allSkuData = data;
						NotifyName = Notify;
						// console.log('allSkuData====>', allSkuData);
						// console.log('Notify====>', NotifyName);
						//Method.checkQuantity();
					});
				});

				sandbox.getComponents('component_launchitem', {context:$(document)}, function () {
					// _self.fireEvent('skuLoadComplete', _self, [allSkuData]);
					this.addEvent('skuLoadComplete', function (data, Notify) {
						allSkuData = data;
						NotifyName = Notify;
						// console.log('allSkuData====>', allSkuData);
						// console.log('Notify====>', NotifyName);
						//Method.checkQuantity();
					});
				});

				sandbox.getComponents('component_gallery', {context:$(document)}, function () {
					this.addEvent('skuLoadComplete', function (Notify) {
						NotifyName = Notify;
						// console.log('Notify====>', NotifyName);
						//Method.checkQuantity();
					});
				});

				//사이즈 선택시 css 변경
				$(this).find('#size-grid li').on('click', function(e){
					if(!$(this).attr('disabled')){
						$(this).parent().find('li a').each(function(){
							//기존에 선택된 사이즈 해지
							$(this).removeClass('selected');
						});
						$(this).find('a').addClass('selected');
						//사이즈 영역에 선택한 사이즈 값 표시
						document.getElementById('size-value').innerHTML= $(this).text();

						//sku id 저장
						var sizeId = $(this).attr('value');
						var forBreak = false;
						for (var idx=0;idx < allSkuData.length;idx++) {
							for(var jdx=0; jdx < allSkuData[idx].selectedOptions.length; jdx++){
								if (allSkuData[idx]['selectedOptions'][jdx] == sizeId) {
									$('#size-value').attr('data-sku-id', allSkuData[idx].skuId);
									forBreak = true;
									break;
								}
							}
							if(forBreak){
								break;
							}
						}

						//사이즈 선택 후 사이즈 선택영역을 숨긴다
						Method.sizeTableOpen();

						//Adobe 태깅 부 추가 2020-04-02 pck (s)
						var param = {};
						var size = $(this).text().trim();
						var sizeRunAvailability = $('input[name="size-run-availability"]').val();

						param.link_name = 'Size Run Selections';
						param.size_run_selection = (size !== '') ? size : '';
						param.size_run_availability = (sizeRunAvailability !== '') ? sizeRunAvailability : '';
						param.page_event = {size_run_select : true}
						endPoint.call('adobe_script', param);
						//Adobe 태깅 부 추가 2020-04-02 pck (e)
					}
				});

				//사이즈 표시 영역 선택
				$(this).find('#size-value-area').on('click', function(){
					//사이즈가 선택된 경우에만 사이즈 리스트를 닫는다.
					if($('#size-value').attr('data-sku-id')){
						Method.sizeTableOpen();
					} else {
						UIkit.modal.alert_title("상품의 사이즈를 선택하셔야 입고 알림 문자를 받으실 수 있습니다.");
					}
					//console.log(allSkuData[$(this).index()].skuId)
				});

				//개인정보 취급 방침 팝업 열기
				$(this).find('#privacyPolicyLink').on('click', function(e){
					$('#layerPrivacyPolicy').show();
				});

				//개인정보 취급 방침 팝업 닫기
				$('[id^="closePolicy"]').each(function(){
					$(this).click(function(){
						$('#layerPrivacyPolicy').hide();
					});
				});

				//입고알림 서비스 신청 하기
				$(this).find('#request-restock-alarm').on('click', function(e){
					//사이즈 선택 확인
					if(!$('#size-value').attr('data-sku-id')){
						UIkit.modal.alert_title("사이즈를 선택하세요.");
						return;
					}
					//휴대전화 번호 입력 확인 targetValue
					var phoneNum = document.getElementById("targetValue").value;

					if(10 > phoneNum.length){
						UIkit.modal.alert_title('휴대폰번호를 정확하게 입력 하셔야<br/>입고 알림 서비스를 이용 하실 수 있습니다.');
						return;
					} else {
						var pattern =  new RegExp('^[0-9]*$', 'g');
						if(!pattern.test(phoneNum)){
							UIkit.modal.alert_title('휴대폰번호를 정확하게 입력 하셔야<br/>입고 알림 서비스를 이용 하실 수 있습니다.');
							return;
						}
					}
					//체크박스 확인
					if(!$('#check-privacy-policy-agree').hasClass('checked')){
						UIkit.modal.alert_title('개인정보 취급방침 이용에 동의 하셔야<br/>입고 알림 서비스를 이용 하실 수 있습니다.');
						return;
					}

					// phone number format
					var tempPhone;
					if(phoneNum.length > 10){
						tempPhone = phoneNum.match(/^(\d{3})(\d{4})(\d{4})$/);
					} else {
						tempPhone = phoneNum.match(/^(\d{3})(\d{3})(\d{4})$/);
					}
					formatPhone = tempPhone[1] + '-' + tempPhone[2] + '-' + tempPhone[3];

					var notify = {
						mainMsg : '입고 알림 신청을 하시겠습니까?',
						subMsg : '고객님께서 수신 동의하신<br/><strong>' + formatPhone + '</strong>(으)로<br/> 알림톡이 발송됩니다.'
					};

					UIkit.modal.confirm_title(notify, function(){
						endPoint.call('clickEvent', {'area' : 'notify me', 'name' : 'confirm' })
						Method.add();
					}, function(){
						endPoint.call('clickEvent', {'area' : 'notify me', 'name' : 'cancel' })
					}, function(){},
					{
						labels: {'Ok': '신청', 'Cancel': ' 취소'}
					});
				});
			},

			//jquery 2.2.4 버전업,  if(allSkuData[idx].selectedOptions.indexOf(optId) > -1){  오류 발생
			// if(allSkuData[idx].selectedOptions[0]==optId){			
			checkQuantity:function(){
				if(allSkuData){
					$('#size-grid').find("li").each(function(index){
						var optId = $(this).attr('value');
						if(allSkuData.length > index){
							for(var idx=0; idx<allSkuData.length; idx++) {
								if(allSkuData[idx].selectedOptions[0]==optId){
									if(allSkuData[idx].quantity <= 0 || args.isForcedDisplay === 'true'){
										//입고알림에서는 재고가 없는 상품을 활성화
										$(this).removeAttr('disabled');
										$(this).find("a").removeClass('sd-out');
									}
								}
							}
						}
					});
				}
	   		},
			add:function(){
				var customerId = $('#request-restock-alarm').attr('data-customer-id');
				var obj = {
					'id' : customerId?customerId:'', //계정
					'skuId' : $('#size-value').attr('data-sku-id'),
					'messageType' : 'KAKAO', //SMS/EMAIL
					'target' : document.getElementById("targetValue").value, // SMS인 경우 번호, EMAIL인 경우 이메일
					'notify': args.isForcedDisplay ? 'COMINGSOON' : ''
				}
				// console.log('obj:', obj);
				sandbox.utils.ajax(sandbox.utils.contextPath + '/restock/add', 'GET',obj, function(data) {
					var data = $.parseJSON( data.responseText );
					if( data.result ){ // result:true
						var notification = UIkit.modal('#restock-notification', {modal:false});
						notification.hide();
						//$('.uk-modal-close').click();
						// $(".sms-complete").show();
						var sucessMsg = {
							mainMsg : '입고 알림 신청이 완료되었습니다.',
							subMsg : '<span>알림 받을 휴대폰 번호<strong>' + formatPhone + '</strong></span>입고 즉시, 알림톡이 발송됩니다.'
						};
						UIkit.modal.alert_title(sucessMsg)
						// UIkit.notify(sucessMsg, {timeout:3000,pos:'top-center', status:'success'});
					}else{
						UIkit.modal.alert_title(data.errorMsg);
						// UIkit.notify(data.errorMsg, {timeout:3000,pos:'top-center',status:'danger'});
					}
				},true);
			},
			sizeTableOpen:function(){
				if($('#size-value-area').hasClass('open')){
					$('#size-value-area').removeClass('open');
					$('#size-list-area').slideUp();
				} else {
					$('#size-value-area').addClass('open');
					$('#size-list-area').show('bind');
				}
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-restock]',
					attrName:'data-module-restock',
					moduleName:'module_restock',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});

})(Core);

(function(Core){
	Core.register('module_certification', function(sandbox){
		var args;
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				//console.log('this:' , $(this));
				//console.log('args:' , arguments);
				var certificationYnModal = UIkit.modal('#certification-yn-modal', {center:true, bgclose:false, keyboard:false});
				certificationYnModal.show();
				args = arguments[0];

				//이전페이지로 이동
				/*$this.find('#btn-go-back').on('click', function(){
					window.history.back();
					return false;
				});*/

				var redirectUrl = args.redirectUrl;
				
				
				//인증화면으로 이동
				$this.find('#btn-go-certification').on('click', function(e){
					e.preventDefault();
					//console.log('go certification');
					/*
					$('#certification_frame').attr('src', sandbox.utils.contextPath + '/personalAuthentication/form');

					UIkit.modal("#certification-modal", {center:true, bgclose:false, keyboard:false} ).show();
					//certificationYnModal.hide();

					//Method.sendSiren24('hideCertificationLayer', '', 'certifymeorder');

					$('#btn-show-certification-yn-modal').off('click').on('click', function(){
						$('#certification_frame').contents().find("body").html('');
						certificationYnModal.show();
					})

*/	
					// 본인인증 처리시 강제 페이지 지정, 드로우에서 구현되었던 것을 유지하느라 기존에 있던 쿠키 이름이 드로우임
					if (_.isEmpty(redirectUrl) == false) {
						$.cookie("thedrawCertified", 'thedraw', { expires: 1, path: '/' });
						$.cookie("thedrawRedirectUrl", redirectUrl, { expires: 1, path: '/' });
					}
					window.open(sandbox.utils.contextPath +"/personalAuthentication/form","crPop","width=430, height=560, resizable=1, scrollbars=no, status=0, titlebar=0, toolbar=0, left=300, top=200");
				});

			},
			/**
			 * 서신평 인증
			 * @param successCallback : 성공콜백
			 * @param errorCallback : 에러콜백
			 * @param storeNo : 스토어번호
			 * sendSiren24(hideCertificationLayer, null, "certifymeorder");
			 * sendSiren24(aa1, aa2, "certifymemember");
			 */
			// sendSiren24:function(successCallback, errorCallback, certifymeMethod){
			// 	$("#retUrlSiren24").val( $("#retUrlSiren24").val() + "?serviceCode="+certifymeMethod+"&successCallback="+successCallback+"&errorCallback="+errorCallback);
			// 	$("#formGetServiceCode").attr("action","https://secure.nike.co.kr/member/getIpinReqInfoAjax.lecs?serviceCode="+certifymeMethod);
			// 	IframeSubmitter.submit($("#formGetServiceCode")[0], "setServiceCodeSiren24", $("#frameCert").attr("name"));
			// },
			//휴대폰 인증 siren 팝업 호출
			setServiceCodeSiren24:function(result){
				if (result.success) {
					$("#reqInfoSiren24").val(result.reqInfo);
					openPopupSiren24();
				} else {
					alert(result.message);
					return;
				}
			},
			//휴대폰 인증 siren 팝업
			openPopupSiren24:function(){
				var CBA_window_Siren24;
				CBA_window_Siren24 = window.open("", "IPINWindowSiren24", "width=430, height=560, resizable=1, scrollbars=no, status=0, titlebar=0, toolbar=0, left=300, top=200");
				if(CBA_window_Siren24 == null){
					alert(" ※ 윈도우 XP SP2 또는 인터넷 익스플로러 7 사용자일 경우에는 \n    화면 상단에 있는 팝업 차단 알림줄을 클릭하여 팝업을 허용해 주시기 바랍니다. \n\n※ MSN,야후,구글 팝업 차단 툴바가 설치된 경우 팝업허용을 해주시기 바랍니다.");
				}
				$("#formCertificationSiren24").attr("target", "IPINWindowSiren24");
				document.getElementById("formCertificationSiren24").submit();
			},

			getIsAuthenticate:function(){
				return (args.certified === 'true') ? true : false;
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-certification]',
					attrName:'data-module-certification',
					moduleName:'module_certification',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			getIsAuthenticate:function(){
				return Method.getIsAuthenticate();
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_restocklist', function(sandbox){
		var $this = $(this);
        var endPoint;
		var Method = {
			moduleInit:function(){
				var args = arguments[0];
				endPoint = Core.getComponents('component_endpoint');

				$(this).on('click', '#restock-delete', function(e){
					e.preventDefault();
					var alarm_id = $(this).find("input[id='hidden-restock-id']").val();

					if(typeof(alarm_id) !== "undefined" && alarm_id !== "" && isNaN(alarm_id) === false){
						UIkit.modal.confirm('입고 알림 신청 내역을 삭제 하시겠습니까?', function(){
							Core.Loading.show();
							Core.Utils.ajax(Core.Utils.contextPath + '/restock/remove', 'GET',{'id':alarm_id}, function(data) {
								var data = $.parseJSON( data.responseText );
								if(data.result) {
									location.reload();
									UIkit.notify("입고 알림 신청이 삭제 되었습니다." , {timeout:3000,pos:'top-center',status:'success'});
								} else {
									UIkit.notify(args.errorMsg, {timeout:3000,pos:'top-center',status:'error'});
								}
							},true);
						}, function(){},
						{
							labels: {'Ok': '확인', 'Cancel': '취소'}
						});												
					}else{
						UIkit.notify("입고 알림 신청 삭제에 실패하였습니다. 잠시 후 다시 시도 해주세요.", {timeout:3000,pos:'top-center',status:'error'});
					}
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-restocklist]',
					attrName:'data-module-restocklist',
					moduleName:'module_restocklist',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_promotion', function(sandbox){
		var endPoint;
		var Method = {
			$that:null,
			$form:null,
			$errorMessage:null,

			moduleInit:function(){
				/*
					@replaceTarget : 결과값이 들어갈 dom
					@errorMessageTarget : error message 가 들어갈 dom
				*/
				$.extend(Method, arguments[0]);

				var $this = $(this);
				Method.$that = $this;
				Method.$form = $this.find("form.promo-form");
				Method.$errorMessage = $this.find(Method.errorMessageTarget);
				endPoint = Core.getComponents('component_endpoint');

				if( Method.$form.length < 1 ){
					return;
				}

				$(this).find("button[type='submit']").on("click", function(e){
					e.preventDefault();
					Method.submitCode();
				});

				$(this).find(".promo-list .btn-delete").on("click", function(e){
					e.preventDefault();
					Method.removeCode( $(this).attr("href") );
				});

				//장바구니, 결제하기 페이지 에서 적용 쿠폰 있을경우,
				//쿠폰 선택시 자동 마킹..기능 추가.
				$this.find("[data-offer-set]").on("click", function(e){
					var code = $(this).data('offer-set');
					Method.$errorMessage.addClass('uk-hidden');
					$("#promoCode").val(code).trigger('keydown');
				});

			},
			removeCode:function(url){
				sandbox.setLoadingBarState(true);
				BLC.ajax({
					url: url,
					type: "GET"
				}, function(data) {
					if (data.error && data.error == "illegalCartOperation") {
						UIkit.modal.alert(data.exception);
						sandbox.setLoadingBarState(false);
					} else {
						window.location.reload();
					}
				});
			},
			submitCode:function(){
				var $form = Method.$form;

				//프로모 코드가  null 일경우 오류 발생.
				if($form.find("#promoCode").val()==""){
					UIkit.modal.alert("프로모션 코드를 입력해 주세요.");
					return;
				};

				sandbox.setLoadingBarState(true);
				BLC.ajax({url: $form.attr('action'),
						type: "POST",
						data: $form.serialize()
					}, function(data, extraData) {

						var endPointData = $.extend(extraData, {
							promoCode : sandbox.utils.url.getQueryStringParams( $form.serialize() ).promoCode
						});

						if (data.error && data.error == 'illegalCartOperation') {
							sandbox.setLoadingBarState(false);
							UIkit.modal.alert(data.exception);
							endPointData.exception = 'illegalCartOperation';

						} else {
							if(!extraData.promoAdded) {
								sandbox.setLoadingBarState(false);
								//welcome2nike 로 끝나는 쿠폰의 경우 에러메세지 치환
								if(Core.utils.string.endsWith(Core.utils.string.toLower(extraData.promoCode), 'welcome2nike') && (extraData.exceptionKey=='error.promo.useless')){
									extraData.exception="장바구니 전체에 5만원 이상 구매 시 적용됩니다"
								}
								Method.$errorMessage.find(".text").html(extraData.exception)
								Method.$errorMessage.removeClass("uk-hidden");

							} else {
								if( _.isElement( Method.replaceTarget) ){
									sandbox.setLoadingBarState(false);
									$(Method.replaceTarget).html( data );
								}else{
									setTimeout(function(){
										window.location.reload();
									}, 500);
								}
							}
						}

						endPoint.call('applyPromoCode', endPointData);
					}
				);
				return false;
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-promotion]',
					attrName:'data-module-promotion',
					moduleName:'module_promotion',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_reviewpage', function(sandbox){
		var $this, modal, args;
		var Method = {

			moduleInit:function(){
				var $this = $(this);
					modal = UIkit.modal('#common-modal-large');

				//나의 상품 리뷰 쓰기  슬라이딩 셋팅
				var md = new MobileDetect(window.navigator.userAgent);

				if (md.mobile()) {  // 모바일 일경우....
				    var crossSaleswiper = new Swiper('#crossSale-swiper-container', {
				        slidesPerView: 'auto',
						slidesPerView: 1,
				        slidesPerGroup: 1,
				        pagination: {
				            el: '.swiper-pagination',
				            //clickable: true,
						  	type: 'progressbar',
				        },
								navigation: {
								nextEl: '.swiper-button-next',
								prevEl: '.swiper-button-prev',
							    },
				    });
				} else {
				    var crossSaleswiper = new Swiper('#crossSale-swiper-container', {
				        slidesPerView: 4,
				        slidesPerGroup: 4,
				        pagination: {
				            el: '.swiper-pagination',
				            clickable: true,
				        },
				    });
				}


				//리뷰 작성
               	$this.find("button[id='data-write-btn']").on('click', function(e){
					var index = 0;  //평점 기본 셋팅...
					var target = $(this).attr('data-target');
					var productId = $(this).attr('data-productid');
					var orderItemId = $(this).attr('data-orderitemid')

					Method.reviewTask(target, productId, orderItemId, index);  //리류작성 모달

                });



			},
			//리류작성 모달..
			reviewTask:function(target, productId, orderItemId, startCount){
				var defer = $.Deferred();

				sandbox.utils.promise({
					url:sandbox.utils.contextPath + '/review/reviewWriteCheck',
					type:'GET',
					data:{'productId':productId, 'orderItemId':orderItemId}
				}).then(function(data){
					//data.expect 기대평
					//data.review 구매평
					if(data.expect || data.review){
						return sandbox.utils.promise({
							url:sandbox.utils.contextPath + '/review/write',
							type:'GET',
							data:{'productId':productId, 'redirectUrl':location.pathname, 'startCount':startCount, 'isPurchased':data.review, 'orderItemId':orderItemId}
						});
					}else{
						$.Deferred().reject('리뷰를 작성할 수 없습니다.');
					}

				}).then(function(data){
					modal.show();

					$(target).addClass('review-write');
					$(target).find('.contents').empty().append(data);
					sandbox.moduleEventInjection(data, defer);

					return defer.promise();
				}).then(function(data){
					Method.reviewProcessorController();
					modal.hide();
				}).fail(function(msg){
					//console.log('write fail');
					defer = null;
					UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
				});
			}
		}
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-reviewpage]',
					attrName:'data-module-reviewpage',
					moduleName:'module_reviewpage',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);




(function(Core){
	Core.register('module_reviewlist', function(sandbox){
		var $this, modal, args;
		var Method = {

			moduleInit:function(){
				var $this = $(this);

				//작성된 리뷰 내용 글자 자르기....
				if($("div#mypage_review_list").length > 0){

					$("div#mypage_review_list").each(function(index){
						str_content = $(this).find('[data-review-text]').data('review-text');

							full_text = Method.content_cut(str_content);   // 내용 파싱... 글자수 200자

							$(this).find('#review_coment').html(full_text);
					});

				}

				//리뷰 더보기, 닫기
				$(document).on("click","a.shorten-toggle", function(e) {
					if($(this).text().trim()=="더보기"){
						var index		= $(this).closest('[data-review-text]').index();
						var full_text 	= $(this).closest('[data-review-text]').data('review-text');   //전체 내용

										  $(this).closest('[data-review-text]').html(full_text+"<a class='shorten-toggle' href='javascript:;' style='font-weight: bold;'> <b>닫기</b></a>");
					} else{
						var index		= $(this).closest('[data-review-text]').index();
						var full_text 	= Method.content_cut($(this).closest('[data-review-text]').data('review-text'));   //전체 내용
										  $(this).closest('[data-review-text]').html(full_text);
					}
				});


			},
			content_cut:function(str){
				if(str.length >= 200){
					return str.substr(0,200)+" ... <a class='shorten-toggle' href='javascript:;' style='font-weight: bold;' data-click-area='pdp' data-click-name='review_view more'> <b>더보기</b></a>";
				} else{
					return str;
				}

			}
		}
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-reviewlist]',
					attrName:'data-module-reviewlist',
					moduleName:'module_reviewlist',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	// var arrLatestKeywordList = []; // sessionStorage 으로 cookie 변경

	Core.register('module_search', function(sandbox){
		var $this, args, clickIS, endPoint, isSaveLatest;

		var setSearchKeyword = function (keyword) {
			//검색 클릭시 태깅 추가.
			var param = {};
				param.pre_onsite_search_phrase = keyword,
				param.page_event = {}
				param.page_event.pre_onsite_search = true;
				endPoint.call('adobe_script',param);
		}

		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];
				clickIS = false;

				endPoint = Core.getComponents('component_endpoint');

				sandbox.getComponents('component_searchfield', {context:$this, resultTemplate:'#search-list', resultWrap:'.etc-search-wrap'}, function(){
					this.addEvent('resultSelect', function(data){

						var text = $(data).text();

						//nike는 인기검색어 앞에 순번이 있어 아이템 선택시 순번 제거 필요.
						// if(text.lastIndexOf('10', 0) === 0){
						// 	text = text.substring(4);
						// } else if(text.match(/^\d/)){
						// 	text = text.substring(3);
						// }

						var endPointData = {
							key : text,
							text : text
						}

						endPoint.call( 'searchSuggestionClick', endPointData );
						this.getInputComponent().setValue(text);
						setSearchKeyword(text);
						location.href = sandbox.utils.contextPath + '/search?q='+ text;
					});

					this.addEvent('beforeSubmit', function(data){
						setSearchKeyword(data);
					});


				});
				
				// sessionStorage 데이터 사용
				var autoSearchKeywordList = JSON.parse(sessionStorage.getItem('autoSearchKeyword'));
				function patchAutocomplete () {
					var oldFn = $.ui.autocomplete.prototype._renderItem;
					$.ui.autocomplete.prototype._renderItem = function (ul, item) {
						var re = new RegExp(this.term + "/*", "i");
						var t = item.label.replace(re, "<span class='highlight'>" + this.term + "</span>");

						var ts = item.value;
						// var pattern = new RegExp(item.label, 'g');
						// arrLatestKeywordList = sandbox.utils.rtnMatchComma(latestKeywordList.replace(pattern, ''));
						// arrLatestKeywordList.unshift(item.label);
						// if(arrLatestKeywordList.length >= args.keywordMaxLen){
						// 	arrLatestKeywordList = arrLatestKeywordList.slice(0, -1);
						// }
						// sessionStorage.setItem('latestSearchKeyword', arrLatestKeywordList.join(','));

						// return $("<li></li>").data("item.autocomplete", item).append("<a data-target=" + item.label + " href='/kr/ko_kr/search?q=" + item.label + "'><em>" + t + "</em></a>").appendTo(ul);



						return $("<li></li>").data("item.autocomplete", item).append("<a data-target='" + item.label + "' href='#'><em>" + t + "</em></a>").appendTo(ul);
					};
				}
				patchAutocomplete();

				$("#search").autocomplete({
					source: function (req, response) {
						var re = $.ui.autocomplete.escapeRegex(req.term);
						var matcher = new RegExp(re + "/*", "i");
						var a = $.grep(autoSearchKeywordList, function (item, index) {
							return matcher.test(item);
						});
						a = a.splice(0, 10);
						response(a);
						$('#ui-id-1').hide();
					},
					minLength:2,
					// autoFocus: true,
					change: function () {
						//console.log('change');
					},
					close: function () {
						//console.log('close');
						//$('.etc-search-wrap').addClass('active');
					},
					focus: function () {
						//console.log('focus');
					},
					open: function () {
						//console.log('open');

						$('#ui-id-gnb').on('click','a',function(event){
							var _target = $(this).data('target');
							setSearchKeyword(_target);
							location.href = sandbox.utils.contextPath + '/search?q='+ _target;
						});
					},
					response: function () {
						//console.log('response');
					},
					search: function () {
						
						setTimeout(function() {
							
							var gnbSearchResult = $('#ui-id-1').html();
							if($.trim($('#ui-id-1').html())!=''){
								$('.search_list').find('p').css("display","none");
								$('ui-id-gnb').empty();
								$('#ui-id-gnb').html($('#ui-id-1').html());
								//$('#ui-id-1').empty();
								
							}
							
						}, 100);

						//console.log('select');
					},
					select: function () {
						//console.log('select');
					}
				});

				$(document).on('click','.search-mask', function(){ //20180516추가
					$('.etc-search-wrap').removeClass('active');
					$("body").css('position','relative');
          			$('.search-mask').fadeOut();
				});

			}
		}



		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-search]',
					attrName:'data-module-search',
					moduleName:'module_search',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_sizeguide', function(sandbox){
		var $this = $(this);
        var endPoint;
		var Method = {
			moduleInit:function(){
				var args = arguments[0];
				endPoint = Core.getComponents('component_endpoint');

				Method.viewSlide('SP_001');

				$this.find('[data-view-slide]').each(function(){
                    $(this).on('click', function(){
						//console.log($(this).data('view-slide'));
					});
				});

			},
			initEventListener:function(chgCode){
				/*sizeChart*/
				var $sizeCategory = $('#view_tgt').find('.size_category');
				var $sizeMenu = $sizeCategory.find('.size_menu');
				var $sizeSubMenu = $sizeMenu.find('.size_sub_menu');
				var $sizeCategoryItem = $sizeCategory.find('>li');
				var $sizeMenuItem = $sizeMenu.find('>li');
				var $sizeSubMenuItem = $sizeSubMenu.find('>li');

				$sizeCategoryItem.find('>a').on('click', function () {
					$sizeCategoryItem.removeClass('on');
					$(this).parent().addClass('on');
					$sizeMenu.hide();
					$(this).parent().find($sizeMenu).show();
					$sizeMenuItem.removeClass('on');
					$sizeSubMenuItem.removeClass('on');
					$(this).parent().find($sizeMenuItem).eq(0).addClass('on');
					$sizeSubMenu.hide();
					$(this).parent().find($sizeSubMenu).eq(0).show();
					if ($(this).parent().find('ul').hasClass('size_sub_menu')) {
						$sizeCategory.height($(this).parent().find($sizeMenu).outerHeight(true) + $(this).parent().find($sizeSubMenu).outerHeight(true));
					} else {
						$sizeCategory.height($(this).parent().find($sizeMenu).outerHeight(true));
					}
					return false;
				});
				$sizeMenuItem.find('>a').on('click', function () {
					$sizeMenuItem.removeClass('on');
					$sizeSubMenuItem.removeClass('on');
					$(this).parent().addClass('on');
					$sizeSubMenu.hide();
					$(this).next().show();
				});
				$sizeSubMenuItem.find('>a').on('click', function () {
					$sizeSubMenuItem.removeClass('on');
					$(this).parent().addClass('on');
				});
				/*table*/
				var $sizeTable = $('#view_tgt').find('.pop_size_table');
				var $sizeTd = $sizeTable.find('tbody td');
				var $sizeTheadTh = $sizeTable.find('thead th');
				var $sizeTdFirst = $sizeTable.find('tbody td').eq(0);
				$sizeTd.on({
					mouseenter: function () {
						var $tdIdx = $(this).index();
						$sizeTheadTh.eq($tdIdx).addClass('highlight');
						$(this).parent().prevAll().each(function () {
							$(this).find('td').eq($tdIdx - 1).addClass('highlight2');
						});
						$(this).prevAll('td').addClass('highlight2');
						$(this).parent().prev('tr').find('td.face-1').addClass('highlight2');
						$(this).parent().prevAll('tr').find('td.face-2').addClass('highlight2');
						$(this).parent().find('th').addClass('highlight');
						$(this).addClass('highlight');
					}, mouseleave: function () {
						var $tdIdx = $(this).index();
						$sizeTheadTh.eq($tdIdx).removeClass('highlight');
						$(this).parent().prevAll().each(function () {
							$(this).find('td').eq($tdIdx - 1).removeClass('highlight2');
						});
						$(this).prevAll('td').removeClass('highlight2');
						$(this).parent().prev('tr').find('td.face-1').removeClass('highlight2');
						$(this).parent().prevAll('tr').find('td.face-2').removeClass('highlight2');
						$(this).parent().find('th').removeClass('highlight');
						$(this).removeClass('highlight');
					}
				});
				/*tab*/
				var $sizeTab = $('#view_tgt').find('.tabbtn');
				var $tabcon = $('#view_tgt').find('.tabcon');
				$sizeTab.find('a').bind('click', function (e) {
					var tar = $(this).attr('href'); 
					$sizeTab.find('a').removeClass('active');
					$(this).addClass('active');
					$tabcon.hide();
					$('#view_tgt').find(tar).show();
					if (tar == '#chart1') {
						$sizeTab.find('.tabbar').stop().animate({ 'left': '0' }, 400);
					} else {
						$sizeTab.find('.tabbar').stop().animate({ 'left': '73px' }, 400);
					}
					return false;
				});
				/*bra table*/
				$(function () {
					$(".one_row td").mouseover(function () {
						$(".us-size").removeClass("highlight");
						$(".one_row").find(".us-size").addClass("highlight");
						$(".indi").removeClass("highlight2");
						$(".one_row .indi").addClass("highlight2");
						if ($(this).hasClass("indi")) {
							$(".col-1, .col-2").removeClass("highlight2");
							$(".one_row").find(".col-1, .col-2").addClass("highlight2");
						}
					});
					$(".two_row td").mouseover(function () {
						$(".us-size").removeClass("highlight");
						$(".two_row").find(".us-size").addClass("highlight");
						$(".indi").removeClass("highlight2");
						$(".two_row .indi").addClass("highlight2");
						if ($(this).hasClass("indi")) {
							$(".col-1, .col-2").removeClass("highlight2");
							$(".two_row").find(".col-1, .col-2").addClass("highlight2");
						}
					});
					$(".three_row td").mouseover(function () {
						$(".us-size").removeClass("highlight");
						$(".three_row").find(".us-size").addClass("highlight");
						$(".indi").removeClass("highlight2");
						$(".three_row .indi").addClass("highlight2");
						if ($(this).hasClass("indi")) {
							$(".col-1, .col-2").removeClass("highlight2");
							$(".three_row").find(".col-1, .col-2").addClass("highlight2");
						}
					});
					$(".four_row td").mouseover(function () {
						$(".us-size").removeClass("highlight");
						$(".four_row").find(".us-size").addClass("highlight");
						$(".indi").removeClass("highlight2");
						$(".four_row .indi").addClass("highlight2");
						if ($(this).hasClass("indi")) {
							$(".col-1, .col-2").removeClass("highlight2");
							$(".four_row").find(".col-1, .col-2").addClass("highlight2");
						}
					});
					$(".five_row td").mouseover(function () {
						$(".us-size").removeClass("highlight");
						$(".five_row").find(".us-size").addClass("highlight");
						$(".indi").removeClass("highlight2");
						$(".five_row .indi").addClass("highlight2");
						if ($(this).hasClass("indi")) {
							$(".col-1, .col-2").removeClass("highlight2");
							$(".five_row").find(".col-1, .col-2").addClass("highlight2");
						}
					});
					$(".indi").mouseover(function () {
						$(".indi_thead").addClass("highlight");
						$(".col-1, .col-2").removeClass("highlight2");
						$(this).addClass("highlight3");
						$(this).mouseleave(function () {
							$(".indi_thead").removeClass("highlight");
							$(".col-1, .col-2").removeClass("highlight2");
							$(this).removeClass("highlight3");
						});
					});
					$(".col-1").mouseenter(function () {
						$(".one_col").addClass("highlight");
						$(this).removeClass("highlight2");
						$(this).mouseleave(function () {
							$(".one_col").removeClass("highlight");
							$(".us-size").removeClass("highlight");
						});
					});
					$(".col-2").mouseenter(function () {
						$(".two_col, .col_head").addClass("highlight");
						$(".indi_thead").addClass("normal");
						$(this).removeClass("highlight2");
						$(this).mouseleave(function () {
							$(".two_col, .col_head").removeClass("highlight");
							$(".indi_thead").removeClass("normal");
							$(".us-size").removeClass("highlight");
						});
					});
				});
			},
			viewSlide:function(chgCode){
				$("#view_tgt").html($("#" + chgCode).html());
				Method.initEventListener(chgCode);
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-sizeguide]',
					attrName:'data-module-sizeguide',
					moduleName:'module_sizeguide',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_dynamicform', function(sandbox){
		var $deferred = null, endPoint;
		var Method = {
			$that:null,
			$form:null,
			moduleInit:function(){
				$.extend(Method, arguments[0]);

				var $this = $(this);
				Method.$that = $this;
				endPoint = Core.getComponents('component_endpoint');

				Method.$form = $this.find("form");
				var $submitBtn = $this.find('button[type="submit"]');

				sandbox.getComponents('component_textfield', {context:$this}, function(){
					this.addEvent('enter', function(e){
						$submitBtn.trigger('click');
					});
				});

				$('[data-uk-datepicker]').each(function () {
					var format = $(this).data().ukDatepicker.format || 'YYYY.MM.DD';
					UIkit.datepicker(this, { "format": format }).on('hide.uk.datepicker', function () {
						// placeholder를 숨기기 위한 이벤트 실행
						if ($(this).val() != '') {
							$(this).keydown();
							// 날짜 선택창이 닫치면 필드 정합성 테스트 진행
							$(this).parsley().validate();
						}
					})
				});

				//  소괄호 입력시 비밀번호가 인코딩 되서 저장되는 문제 발생... (회원가입)
				$this.find('input[id="password"]').on('keyup', function(e){
					if ($(this).val().indexOf('(') != -1  || $(this).val().indexOf(')') != -1 || $(this).val().indexOf('<') != -1 || $(this).val().indexOf('>') != -1) {
						$(this).closest('div').addClass('error');
						$(this).next().html('<span class="parsley-pattern_1">비밀번호에 ( ) < >는 사용할 수 없습니다.</span>');
					}else {
						$this.find('.parsley-pattern_1').html('');
					}
				});

				//  소괄호 입력시 비밀번호가 인코딩 되서 저장되는 문제 발생... (비밀번호 변경)
				$this.find('input[id="newPassword"]').on('keyup', function(e){

					e.preventDefault();
					//sandbox.validation.validate( Method.$form );
					//console.log(sandbox.validation.isValid( Method.$form ) );

					if ($this.find('#newPassword').length > 0) {
						if ($(this).val().indexOf('(') != -1  || $(this).val().indexOf(')') != -1 || $(this).val().indexOf('<') != -1 || $(this).val().indexOf('>') != -1) {
							$(this).closest('div').addClass('error');
							$(this).next().html('<span class="parsley-pattern_1">비밀번호에 ( ) < >는 사용할 수 없습니다.</span>');
						} else {
							$this.find('.parsley-pattern_1').html('');
						}
					}
				});

				// 개인정보 국외제공 동의 체크를 할때만 광고성 정보 수신동의 체크박스 활성화
				// 사용안하기로 함
				
				/* 
				var $transferAgree = $(this).find('input[id="globalMember_transferAgree"]');
				var $receiveAdInfoAgree = $('#globalMember_receiveAdInfoAgree');

				if ($receiveAdInfoAgree.length > 0) {
					var $receiveEmail = $('#receiveEmail');
					var $smsAgree = $('#smsAgree');
					// 광고성 정보 수신동의 하면 이메일과 SMS 수신 동의 처리
					$receiveAdInfoAgree.on('change', function () {
						$receiveEmail.prop('checked', $(this).prop('checked'));
						$smsAgree.prop('checked', $(this).prop('checked'));
					});
					//  회원 정보 수정에서 둘중 하나만 true 라면 광고성 정보 수신동의 체크
					if ($receiveEmail.prop('checked') == true || $smsAgree.prop('checked') == true) {
						// 두옵션 다 체크 시키기 위해 이벤트 실행
						$receiveAdInfoAgree.prop('checked', true).trigger('change');
					}
				}
				if ($transferAgree.length > 0) {
					$transferAgree.on('change', function () {
						if ($(this).prop('checked') == true) {
							$receiveAdInfoAgree.attr('disabled', false)
							$receiveAdInfoAgree.closest('.input-checkbox').removeClass('disabled');
						} else {
							$receiveAdInfoAgree.prop('checked', false);
							$receiveAdInfoAgree.attr('disabled', true);
							$receiveAdInfoAgree.closest('.input-checkbox').addClass('disabled');
							// 체크 처리한 두 옵션체크를 다시 풀기 위해 이벤트 호출
							$receiveAdInfoAgree.trigger('change');
						}
					}).trigger('change');
					// 처음에 광고성 정보 수신 동의 체크박스를 비활성화 시키기 위해 이벤트 호출
				}
				*/
				// 선택적 개인정보 관련 추가
				// 숨겨져 있을 때 값이 전송되지 않도록 disabled 처리
				$this.find('.option-agree').each(function () {
					$(this).find('input').attr('disabled', true);
				});
				$this.find('input[name="isOptionAgree"]').on('click', function(e){
					$this.find('.option-agree').each(function(){
						if ($(this).hasClass('uk-hidden')) {
							$(this).find('input').attr('disabled', false);
						}else{
							$(this).find('input').attr('disabled', true);
						}
						$(this).toggleClass('uk-hidden');
					})
				})

				$submitBtn.on("click", function(e){
					e.preventDefault();
					sandbox.validation.validate( Method.$form );
					if( sandbox.validation.isValid( Method.$form )){

						//Input Custom Regex , 정규식 표현이 사용안됨,
						//Custom  할 경우, 영문.숫자.특수문자 8~16 안내 멘트 동시 나오게 안됨.
						// 소괄호 입력시 인코딩 되서 저장됨..

						if ($this.find('#password').length > 0) {
		 					if ($this.find('#password').val().indexOf('(') != -1  || $this.find('#password').val().indexOf(')') != -1 || $this.find('#password').val().indexOf('<') != -1 || $this.find('#password').val().indexOf('>') != -1) {
								$this.find('#password').focus();
		 						$this.find('#password').closest('div').addClass('error');
		 						$this.find('#password').next().html('<span class="parsley-pattern_1">비밀번호에 ( ) < >는 사용할 수 없습니다.</span>');
		 						return;
		 					}
		 				}

						if ($this.find('#newPassword').length > 0) {
							if ($this.find('#newPassword').val().indexOf('(') != -1  || $this.find('#newPassword').val().indexOf(')') != -1 || $this.find('#newPassword').val().indexOf('<') != -1 || $this.find('#newPassword').val().indexOf('>') != -1) {
								$this.find('#newPassword').closest('div').addClass('error');
								$this.find('#newPassword').next().html('<span class="parsley-pattern_1">비밀번호에 ( ) < >는 사용할 수 없습니다.</span>');
								return;
							}
						}

						if ($this.find('#checkTerms').length > 0) {
							if(!$this.find('#checkTerms').hasClass('checked')){
								UIkit.modal.alert('이용약관에 동의 해주세요.');
								return;
							}
						}
						if ($this.find('#checkPrivacy').length > 0) {
							if(!$this.find('#checkPrivacy').hasClass('checked')){
								UIkit.modal.alert('개인정보 수집 및 이용에 동의해주세요.');
								return;
							}
						}

						var msg = $(this).data('confirm-msg');
						var endPointType = $(this).data('endpoint-type');
						var endPointValue = $(this).data('endpoint-value');
						if( msg != null){
							UIkit.modal.confirm(msg, function(){
								if( endPointType != null ){
									endPoint.call( endPointType, endPointValue );
								}
								Method.submit();
							}, function(){},
							{
								labels: {'Ok': '확인', 'Cancel': '취소'}
							});
						}else{
							if( endPointType != null ){
								endPoint.call( endPointType, endPointValue );
							}

							//소셜 로그인 및 자동 로그인 체크를 위해서 로그인 버튼 클릭시 쿠키를 생성 한다.
							//$.cookie('social_type', name);
							//_adobeAnalyzerScript.js  처리..
							$.cookie('social_type', 'comlogin');  //2019-01.10

							Method.submit();
						}
					}
				});

				sandbox.validation.init( Method.$form );
			},
			SHA256:function(s){

				var chrsz   = 8;
				var hexcase = 0;

				function safe_add (x, y) {
					var lsw = (x & 0xFFFF) + (y & 0xFFFF);
					var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
					return (msw << 16) | (lsw & 0xFFFF);
				}

				function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
				function R (X, n) { return ( X >>> n ); }
				function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
				function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
				function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
				function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
				function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
				function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }

				function core_sha256 (m, l) {
					var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
					var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
					var W = new Array(64);
					var a, b, c, d, e, f, g, h, i, j;
					var T1, T2;

					m[l >> 5] |= 0x80 << (24 - l % 32);
					m[((l + 64 >> 9) << 4) + 15] = l;

					for ( var i = 0; i<m.length; i+=16 ) {
						a = HASH[0];
						b = HASH[1];
						c = HASH[2];
						d = HASH[3];
						e = HASH[4];
						f = HASH[5];
						g = HASH[6];
						h = HASH[7];

						for ( var j = 0; j<64; j++) {
							if (j < 16){W[j] = m[j + i];} else {W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);}

							T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
							T2 = safe_add(Sigma0256(a), Maj(a, b, c));

							h = g;
							g = f;
							f = e;
							e = safe_add(d, T1);
							d = c;
							c = b;
							b = a;
							a = safe_add(T1, T2);
						}

						HASH[0] = safe_add(a, HASH[0]);
						HASH[1] = safe_add(b, HASH[1]);
						HASH[2] = safe_add(c, HASH[2]);
						HASH[3] = safe_add(d, HASH[3]);
						HASH[4] = safe_add(e, HASH[4]);
						HASH[5] = safe_add(f, HASH[5]);
						HASH[6] = safe_add(g, HASH[6]);
						HASH[7] = safe_add(h, HASH[7]);
					}
					return HASH;
				}

				function str2binb (str) {
					var bin = Array();
					var mask = (1 << chrsz) - 1;
					for(var i = 0; i < str.length * chrsz; i += chrsz) {
						bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
					}
					return bin;
				}

				function Utf8Encode(string) {
					string = string.replace(/\r\n/g,"\n");
					var utftext = "";

					for (var n = 0; n < string.length; n++) {

						var c = string.charCodeAt(n);

						if (c < 128) {
							utftext += String.fromCharCode(c);
						}
						else if((c > 127) && (c < 2048)) {
							utftext += String.fromCharCode((c >> 6) | 192);
							utftext += String.fromCharCode((c & 63) | 128);
						}
						else {
							utftext += String.fromCharCode((c >> 12) | 224);
							utftext += String.fromCharCode(((c >> 6) & 63) | 128);
							utftext += String.fromCharCode((c & 63) | 128);
						}

					}

					return utftext;
				}

				function binb2hex (binarray) {
					var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
					var str = "";
					for(var i = 0; i < binarray.length * 4; i++) {
						str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
						hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
					}
					return str;
				}

				s = Utf8Encode(s);
				return binb2hex(core_sha256(str2binb(s), s.length * chrsz));

			},
			submit:function(){
				//Method.$form.submit();

				if( _GLOBAL.PASSWORD_LEGACY_SHA_ENCODER ){
					sandbox.validation.destroy( Method.$form );
					Method.$form.find('input[type="password"]').each( function(){
						$(this).val( Method.SHA256( $(this).val() ));
					});
				}

				if( Method.isAjax === 'true'){
					sandbox.utils.ajax(Method.$form.attr('action'), 'POST', Method.$form.serialize(), function(data){
						var responseData = sandbox.rtnJson(data.responseText, true)['ResponseObject'];
						if(responseData){
							if($deferred){
								if(!responseData.isError || responseData.isError === 'false'){
									$deferred.resolve(responseData);
								}else{
								    if(responseData instanceof Object && responseData.failureType == 'withoutpassword') {
								        $deferred.reject(responseData);
								    } else if(responseData.errorType == 'auth.failure.isSleptException') {
								        window.location.href= Core.Utils.contextPath + responseData.failureUrl;
								    } else {
								      //  $deferred.reject(responseData.errorMap || Method.errMsg);
										// 로그인 실패시 모달 빼고,  메세지 출력.
										//@pck 2020-07-03 회원가입 페이지와 같이 jq_uk-alert-danger객체가 두개이상 있는 케이스가 있음
									    if($("div#jq_uk-alert-danger").length > 0){
											Method.$form.closest('div').find('#jq_uk-alert-danger').show();
											Method.$form.find("input#j_username").val('');
											Method.$form.find("input#j_password").val('');
											Method.$form.find("div.input-textfield").removeClass('value');
                                       }
								    }
								}
							}
						}
					}, true);
				}else{
					Method.$form.submit();
				}
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-dynamicform]',
					attrName:'data-module-dynamicform',
					moduleName:'module_dynamicform',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				$deferred = null;
				console.log('destroy dynamicForm module');
			},
			setDeferred:function(defer){
				$deferred = defer;
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_kakao', function(sandbox){
		var $this, args;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];

				if(args.appid === 'null') console.log('kakao appid is defined');

				Kakao.init(args.appid);
				Kakao.Link.createDefaultButton({
					container:args.btnContainer,
					objectType:'feed',
					content:{
						title:$('title').text(),
						imageUrl:location.origin + args.feedImg,
						link:{
							mobileWebUrl:location.href,
							webUrl:location.href
						}
					},
					buttons:[
						{
							title:'웹으로 보기',
							link: {
								mobileWebUrl:location.href,
								webUrl:location.href
							}
						}
					]
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-kakao]',
					attrName:'data-module-kakao',
					moduleName:'module_kakao',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			destroy:function(){
				console.log('product destory');
			}
		}
	});
})(Core);

/*
@pck 2020-06-24
Sticky Interaction defined
*/
(function () {
    var stickySectionEl = null;
    if (document.querySelector('[data-ui-sticky-section] ') !== null) {
        stickySectionEl = document.querySelector('[data-ui-sticky-section] ');
        stickySectionEl.dataset.uiStickySection = true; //임시로 지정
    }

    function stickyInteraction() {
        // sticky section dom object에 [data-ui-sticky-section] Attr value(boolean)값으로 css 작동
        document.querySelector('.footer-contents').style.padding = "0";

        var targetButtons = document.querySelectorAll('.sticky-buttons .order-wrap > a');
        if (targetButtons !== null) {
            for (idx = 0; targetButtons.length > idx; idx++) {
                targetButtons[idx].addEventListener('click', function () {
                    UIkit.Utils.scrollToElement($(stickySectionEl), {duration: 500, offset: 60});
                });
            }
        }

        var supportPageOffset = window.pageXOffset !== undefined;
        var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
        var scrollOffset = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop; //ie9 미만 브라우저 대응

        function isVisible(element) {
            var scrollDirection = (scrollOffset < window.scrollY) ? 'down' : 'up';
            var docViewTop = $(window).scrollTop();
            var docViewBottom = docViewTop + $(window).height();
            var elementTop = $(element).offset().top;
            var elementBottom = elementTop + $(element).height();
            var headerHeight = $('header').height();
            //console.log('--------------------------------------------------------');
            //console.log('elementBottom : ' + elementBottom + ' / docViewBottom : ' + docViewBottom + ' / elementTop : ' + elementTop  + ' / docViewTop : ' + docViewTop);
            if (scrollDirection == 'down') {
                elementTop -= headerHeight;
            } else {
                elementBottom += headerHeight;
            }
            return ((elementTop <= docViewBottom) && (elementBottom >= docViewTop));
        }

        function findScrollTrigger(windowScrollOffsetY) {
            var stickyHideOffsetTriggers = (document.querySelectorAll('[data-ui-sticky-hide]') !== null) ? document.querySelectorAll('[data-ui-sticky-hide]') : 0;
            var stickyElement = (document.querySelector('[data-ui-sticky-element]') !== null) ? document.querySelector('[data-ui-sticky-element]') : null;
            var stickyElementHeight = (stickyElement !== null) ? stickyElement.offsetHeight : 0;
            var isStickyVisible = true;

            for (idx = 0; stickyHideOffsetTriggers.length > idx; idx++) {
                //console.log('--------------------------------------------------------');
                //console.log('isScrolledIntoView( $(stickyHideOffsetTriggers[' + idx +  '] ) : ' + isVisible( stickyHideOffsetTriggers[idx] ) );
                if (isVisible(stickyHideOffsetTriggers[idx])) {
                    isStickyVisible = false;
                }
            }
            if (isStickyVisible) {
                stickyElement.classList.add('sticky');
            } else {
                stickyElement.classList.remove('sticky');
            }

            scrollOffset = windowScrollOffsetY;
        }

        window.addEventListener('scroll', function (event) {
            window.requestAnimationFrame(function () {
                findScrollTrigger(window.scrollY);
            });
        });

        var delaying = false;
        window.addEventListener('resize', function (event) {
            if (!delaying) {
                window.requestAnimationFrame(function () {
                    findScrollTrigger(window.scrollY);
                    delaying = false;
                });
                delaying = true;
            }
        });
        // A그룹일 때 운영에서 사용될 스크립트 (e)
    }

    document.addEventListener('DOMContentLoaded', function () {
        // data-ui-sticky-section 어튜리뷰트가 존재해야 실행
        if ( stickySectionEl !== null) {
            stickyInteraction();
        }
    });
})();
/*
@pck 2020-06-25
AB Testing functions
*/
(function () {
    var isTestingAB = (typeof _GLOBAL.CUSTOMER.USE_PERSONALIZE !== 'undefined') ? _GLOBAL.CUSTOMER.USE_PERSONALIZE : false;

    function initABTestingUserGroup() {

        this.setCookie = function (name, value, day) {
            var date = new Date();
            var intDay = parseInt(day, 10);
            date.setTime(date.getTime() + intDay * 60 * 60 * 24 * 1000);
            document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/;';
            console.log('cookie object :', value);
        };

        this.getCookie = function (name) {
            var matches = document.cookie.match(new RegExp(
                "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
            ));
            return matches ? decodeURIComponent(matches[1]) : undefined;
        };

        this.deleteCookie = function (name) {
            var date = new Date();
            document.cookie = name + "= " + "; expires=" + date.toUTCString() + "; path=/";
        }

        function getUserGroupByRandomize(ratio) {
            var setRatio = 0.5; // 0 ~ 1 사이에 비율 지정. 기본 값은 5:5 Group A 기준 비율
            setRatio = (ratio !== null) ? ratio : setRatio;

            var result = Math.floor(Math.random() * (100 - 1)) + 1;
            if (result <= (setRatio * 100)) {
                return 'A';
            } else {
                return 'B';
            }
        }

        try {
            var cookieValue = '';

            if (isTestingAB) {
                var nameOfGroupA = (typeof _GLOBAL.CUSTOMER.PERSONALIZE_TNAME_TEST !== 'undefined') ? _GLOBAL.CUSTOMER.PERSONALIZE_TNAME_TEST : '';
                var nameOfGroupB = (typeof _GLOBAL.CUSTOMER.PERSONALIZE_TNAME_CONTROL !== 'undefined') ? _GLOBAL.CUSTOMER.PERSONALIZE_TNAME_CONTROL : '';
                if (nameOfGroupA == '' || nameOfGroupB == '') {
                    throw new Error("할당되지 않은 그룹이름이 존재합니다. 관리자에서 그룹이름을 지정해주세요.");
                }

                cookieValue = this.getCookie('abTestingUserGroup');
                var isSetUserGroup = ((cookieValue == nameOfGroupA) || (cookieValue == nameOfGroupB));
                if (isSetUserGroup) { //기존에 저장된 쿠키 값이 존재할 시에는 쿠키 값 반환
                    if (_dl.customer_tester !== 'undefined') {
                        _dl.customer_tester = cookieValue;
                    }
                    return cookieValue;
                } else { //쿠키가 없을 시에는 생성 후 쿠키 값 반환
                    //getUserGroupByRandomize에서 'A' 또는 'B' 반환
                    switch (getUserGroupByRandomize(0.5)) {
                        case 'A':
                            cookieValue = nameOfGroupA;
                            break;
                        case 'B':
                            cookieValue = nameOfGroupB;
                            break;
                        default:
                            throw new Error("그룹 할당에 실패하였습니다.");
                    }

                    this.setCookie('abTestingUserGroup', cookieValue, 365);
                    //var cookieResult = this.getCookie('abTestingUserGroup');
                    //console.log("init A/B Testing Cookie : " + cookieResult);

                    if (_dl.customer_tester !== 'undefined') {
                        _dl.customer_tester = cookieValue;
                    }
                    return cookieValue;
                }

            } else {

                this.deleteCookie('abTestingUserGroup');
                return false;
            }

        } catch (err) {
            console.log('AB Testing Script Error : ' + err)
            return false;
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if(isTestingAB){
            initABTestingUserGroup();
        }
    });
})();
//슬라이딩 공통 js
//slidlistcnt : 페이지당 노출될 갯수

(function(Core){
	Core.register('module_swiperslide', function(sandbox){
		var $this, pc_slid_itemlist_cnt, mo_slid_itemlist_cnt;
		var Method = {

			moduleInit:function(){
				var $this = $(this);

				var md = new MobileDetect(window.navigator.userAgent);

				//슬라이딩 item 리스트 갯수를 가져온다.
				var pc_slid_itemlist_cnt = Number($this.find('[data-PC-slidlistcnt]').attr('data-PC-slidlistcnt'));
				var mo_slid_itemlist_cnt = Number($this.find('[data-MO-slidlistcnt]').attr('data-MO-slidlistcnt'));

				if (md.mobile()) {  // 모바일 일경우....
				    var crossSaleswiper = new Swiper('#Related-swiper-container', {
				        slidesPerView: 'auto',
						slidesPerView: mo_slid_itemlist_cnt,
				        slidesPerGroup: mo_slid_itemlist_cnt,
				        pagination: {
				            el: '.swiper-pagination',
				            //clickable: true,
						  	type: 'progressbar',
				        },
								navigation: {
								nextEl: '.swiper-button-next',
								prevEl: '.swiper-button-prev',
							    },
				    });
				} else {
				    var crossSaleswiper = new Swiper('#Related-swiper-container', {
				        slidesPerView: pc_slid_itemlist_cnt,
				        slidesPerGroup: pc_slid_itemlist_cnt,
				        pagination: {
				            el: '.swiper-pagination',
				            clickable: true,
				        },
				    });
				}




			}
		}
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-swiperslide]',
					attrName:'data-module-swiperslide',
					moduleName:'module_swiperslide',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

/*
@ 2020-04-27 pck
SNKRS STORY
launch CDP용 Swiper container
*/
(function(Core){
	Core.register('module_snkrs_swiper', function(sandbox){
		var Method = {
			moduleInit:function(){
                var reAutoPlayTimer = null; //중복 이벤트 방지
                var paginationEl = document.querySelector('.snkrs-story-pagination');
                var currentURL = window.location.href;
                var snkrsStorySwiper = null;
                var isTouchSwipe = false;
                var realActiveIndex = 0;

                //공유버튼 처리 부
                var btnShare = document.querySelectorAll('ul.sns-share-list > li > button');
                btnShare.forEach(function(button){
                    button.addEventListener('click', function () {

                        //Kakao 공유버튼 : class="kakao"
                        if(button.classList.contains('kakao')){
                            var kakaoAPI = Core.kakaoApi;
                            if(typeof kakaoAPI == 'object'){
                                kakaoAPI.link(currentURL);
                            }else{
                                console.log('Kakao lib loading err');
                            }
                        }

                        //URL 복사버튼 : class="copy-url"
                        if(button.classList.contains('copy-url')){
                            //클립보드 복사용 임시 DOM생성
                            var tmpDOMforCopy = document.createElement('textarea');
                                tmpDOMforCopy.value = currentURL;
                                document.body.appendChild(tmpDOMforCopy);

                                tmpDOMforCopy.select();
                                tmpDOMforCopy.setSelectionRange(0, 9999);
                                try {
                                    var success = document.execCommand('copy');
                                    tmpDOMforCopy.blur();
                                    if (success) {
                                        alert("URL이 복사 되었습니다.");
                                    } else {
                                        alert('이 브라우저는 지원하지 않습니다.');
                                    }
                                } catch (err) {
                                    alert('이 브라우저는 지원하지 않습니다.');
                                }

                                document.body.removeChild(tmpDOMforCopy); //삭제
                        }

                    });
                });

                snkrsStorySwiper = new Swiper('.snkrs-story-container', {
                    autoplay: {delay: 15000,},
                    speed:500,
                    loop: true,
                    preloadImages: true,
                    updateOnImagesReady: true,
                    pagination: {el: '.snkrs-story-pagination',
                        renderBullet: function (index, className) {
                            if(index == this.realIndex)
                                className += ' completed';
                            return '<li class="' + className + '"></li>';
                        }
                    },
                    navigation: {nextEl: '.snkrs-story-button-next', prevEl: '.snkrs-story-button-prev',},
                    scrollbar: {el: '.snkrs-story-scrollbar',},
                    on: {
                        init: function(){
                            document.querySelector('.snkrs-story-button-prev').addEventListener('click', function(event){
                                snkrsStorySwiper.allowSlidePrev = true;
                                this.setAttribute('style','pointer-events:none;');
                                var el = document.elementFromPoint(event.clientX, event.clientY);
                                if(el.tagName == 'BUTTON'){
                                    snkrsStorySwiper.allowSlidePrev = false;

                                    //@pck 2020-09-21 DATA-CLICK-NAME 미작동 오류로 강제 실행
                                    var name = el.dataset.clickName;
                                    var area = el.dataset.clickArea;
                                    var endPoint = Core.getComponents('component_endpoint');
                                    endPoint.call('clickEvent', {area : area, name : name});

                                    el.onclick();
                                }
                                this.setAttribute('style','pointer-events:auto;');
                            });
                            document.querySelector('.snkrs-story-button-next').addEventListener('click', function(event){
                                snkrsStorySwiper.allowSlideNext = true;
                                this.setAttribute('style','pointer-events:none;');
                                var el = document.elementFromPoint(event.clientX, event.clientY);
                                if(el.tagName == 'BUTTON'){
                                    snkrsStorySwiper.allowSlideNext = false;

                                    //@pck 2020-09-21 DATA-CLICK-NAME 미작동 오류로 강제 실행
                                    var name = el.dataset.clickName;
                                    var area = el.dataset.clickArea;
                                    var endPoint = Core.getComponents('component_endpoint');
                                    endPoint.call('clickEvent', {area : area, name : name});

                                    el.onclick();
                                }
                                this.setAttribute('style','pointer-events:auto;');
                            });

                            //show share modal view
                            document.querySelector('.show-share').addEventListener('click', function(event){
                                document.querySelector('.sns-share-modal-bg').classList.add('show');
                            });
                            //hide share modal view
                            document.querySelector('.sns-share-modal-bg .close').addEventListener('click', function(event){
                                document.querySelector('.sns-share-modal-bg').classList.remove('show');
                            });
                            //DIM Layer prevent
                            document.querySelector('.sns-share-modal-bg').addEventListener('click', function(event){
                                event.preventDefault();
                                document.querySelector('.sns-share-modal-bg').classList.remove('show');
                            });

                            //최초 init 시 index 값 전달
                            param = {}; //초기화
                            param.SNKRS_mobile_index_number = this.realIndex + 1;
                            param.SNKRS_mobile_swipe_type = 'loaded';
                            endPoint.call('snkrsMobileSwipeIndex', param);

                        },
                        slideChange: function(){
                            document.querySelectorAll('.swiper-pagination-bullet').forEach(function(el, index) {
                                el.classList.add('completed');
                                if(index > snkrsStorySwiper.realIndex){
                                    if(el.classList.contains('completed'))
                                    el.classList.remove('completed');
                                }
                            });
                        },
                        slideChangeTransitionEnd: function(event){
                            if(realActiveIndex !== this.realIndex){
                                var swipeDirection = realActiveIndex > this.realIndex ? 'left' : 'right';
                                realActiveIndex = this.realIndex;

                                param = {}; //초기화
                                param.SNKRS_mobile_index_number = realActiveIndex + 1;
                                param.SNKRS_mobile_swipe_type = (isTouchSwipe) ? 'swipe' : '6secs swipe';
                                param.swipe_direction = swipeDirection;
                                endPoint.call('snkrsMobileSwipeIndex', param);
                            }
                            this.autoplay.stop();
                            clearTimeout(reAutoPlayTimer);
                            reAutoPlayTimer = setTimeout(function() {
                                isTouchSwipe = false;
                                snkrsStorySwiper.slideNext();
                                snkrsStorySwiper.autoplay.start();
                                clearTimeout(reAutoPlayTimer);
                            }, 15000); //6초 후에 자동재생 활성화
                        },
                        touchEnd: function(){
                            isTouchSwipe = true;
                        },
                    },
                });

		    }
		}
		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-snkrs-swiper]',
					attrName:'data-module-snkrs-swiper',
					moduleName:'module_snkrs_swiper',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);
(function(Core){ /* BOPIS & LOPIS PICKUP LOCATION LAYER */
    Core.register('module_pickup_location', function(sandbox){
	    var $this,
	        hasLocalNo,
			vueContainer,
	        pickupLocation = {
	            currentLocation: null,
	            storeList:[],
	            locationCodeWrap: false,
	            sortLt: false,
	            sortNa: false,
	            sortQt: false,
	        },
	        pickupConfirm = { isTaskConfirm: false, customer: null, storeInfo: null, itemRequest: null},
	        pickupQuantity = {
	            isTaskQuantity:false,
	            productPrice:0,
	            newValue:0,
	            min:0,
	            max:0,
	            size:0,
	            quantity:{
	                maxQuantity:1,
	                msg:'개 까지 구매가능 합니다.',
	                quantityStateMsg:'상품의 수량이 없습니다.'
	            }
	        },
	        totalPickupLocation = {},
	        args={},
			currentGeoLocation = {},
	        itemRequest,
	        areaMap = new Map();


		// 사용자 위치 정보 조회 (재고 보유 매장의 위치 정보를 얻어와 내주변 정렬하기 위한 기능)
		function findGeoLocation(isOnLoad){
			var vm = this;
			var positionOpt = {
				enableHighAccuracy:false, // 정확도 조건. false == 빠른 응답
				timeout:5000,
				maximumAge:50000
			};

			if(navigator.geolocation){ // 위치정보 사용
				if(vueContainer.GeoLocation){
					Core.Loading.show();
					var _delay = _.delay(function(){
						Core.Loading.hide();
					}, 7000);

					navigator.geolocation.getCurrentPosition(function(position){
						if(currentGeoLocation['latitude'] != position.coords.latitude || currentGeoLocation['longitude'] != position.coords.longitude) {
							currentGeoLocation['latitude']  = position.coords.latitude;  // API RESERVE
							currentGeoLocation['longitude'] = position.coords.longitude; // API RESERVE
						}

						naver.maps.Service.reverseGeocode({
							location:naver.maps.LatLng(currentGeoLocation['latitude'], currentGeoLocation['longitude']),
						}, function(status, response) {
							if(status !== naver.maps.Service.Status.OK){
								return UIkit.notify("내 위치 정보를 찾을 수 없습니다.", {timeout:3000, pos:'top-center',status:'warning'});
							}

							var result = response.result,
							items = result.items;

							var _address = items[2].address.split(' ');
							vueContainer.findLocation = _.drop(_address).join(' ');
							vueContainer.GeoLocation = false;
							vueContainer.currentSortDir = 'asc';
							vueContainer.currentSort = 'locationTarget';
						});

						Core.Loading.hide();
						clearTimeout(_delay);

						//pickupLocation.currentLocation = currentGeoLocation;
						//https://naveropenapi.apigw.ntruss.com/map/v1/geocode
						/*var geoLocation = currentGeoLocation['longitude'] +','+ currentGeoLocation['latitude'];
						sandbox.utils.jsonp('https://openapi.naver.com/v1/map/reversegeocode-js', {clientId:args.mapkey, query:geoLocation}, 'callback', function(data, status){
						if(data.hasOwnProperty('error')){
							UIkit.notify("내 위치 정보를 찾을 수 없습니다.", {timeout:3000, pos:'top-center',status:'warning'});
						}else{
							vueContainer.findLocation = _.drop(data['result']['items'][2].address.split(' ')).join(' ');
							//console.log('geolocationFindLocation => ', vm.findLocation)
							vueContainer.GeoLocation = false;
						}
						});*/
						if(isOnLoad===false){
							loadStoreIfRadioChange();
						}
					}, null, positionOpt);
				}
			}else{
				UIkit.notify("내 위치 정보를 찾을 수 없습니다.", {timeout:3000, pos:'top-center',status:'warning'});
				//showPositionError({"error":"ERROR - Geolocation is not supported by this agent"});
			}
		}

	    // 내 주변순 위도 : 경도
	    function calculateDistance(lat1, lon1, lat2, lon2){
	        var theta = lon1 - lon2;
	        var dist = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));

	        dist = Math.acos(dist);
	        dist = rad2deg(dist);

	        dist = dist * 60 * 1.1515;
	        dist = dist * 1.609344; // 킬로미터 단위적용

	        function deg2rad (deg) {
	            return (deg * Math.PI / 180.0);
	        }

	        function rad2deg (rad) {
	            return (rad * 180 / Math.PI);
	        }
	        return dist;
	    }

		//사이즈 선택 토글이벤트
		var sizeOptionToggle = function (size, friendlyName, skuID){
			$this.find('.size-select-txt').text(friendlyName);
			$this.find('#reservation-size-title-area').removeClass('uk-active').data('click-toggle-on', 'off');
	        $this.find('.uk-accordion-content').removeClass('uk-active');
	        $this.find('.accordion-wrapper').animate({'height':0}, 300, "linear", function () {});

			pickupQuantity.size = parseInt(size);
	        vueContainer.pickupLocation(size, skuID);

	        UIkit.accordion('.uk-accordion', {showfirst:false});
	        $this.find('#idLocationSearch').show();
	    }

	    // template
		Vue.component('pickup-location', {
			props: ['currentLocation', 'locationCodeWrap', 'storeall', 'storeList', 'dp', 'st', 'ls', 'sort', 'toggle', 'sortLt', 'sortNa', 'sortQt', 'findcal'],
			template:
				'<div>\
					<!--/* 지역코드선태 모달창 */-->\
					<div class="location-code-wrap" v-bind:class="{active:locationCodeWrap}">\
						<h2 class="tit"><span class="label">지역선택</span></h2>\
						<a class="uk-close btn-location-code-close" v-on:click="locationCodeClose"></a>\
						<div class="tit2">지역별 가장 가까운 나이키 매장을 찾으실 수 있습니다.</div>\
						<div class="code-wrap_radio">\
							<ul class="p-checkbox">\
								<li>\
									<input type="checkbox" id="storeAll" name="storelocal" v-model="storeall.active" v-on:click="toggle(false)"/>\
									<label for="storeAll" v-on:click="toggle(false)">전체</label>\
								</li>\
								<li v-for="(tag, index) in ls" v-if="tag.view === true">\
									<input type="checkbox" name="storelocal" v-model="tag.active" v-bind:id="\'storelocal\' + index" v-on:click="toggle(true)"/>\
									<label v-bind:for="\'storelocal\' + index" v-on:click="toggle(true)"><span class="label">{{ tag.name }}</span></label>\
								</li>\
							</ul>\
						</div>\
					</div>\
					<div class="dim" v-bind:class="{active:locationCodeWrap}"></div>\
					<div class="current-location-area">\
						<div class="txt">매장상황에 따라 상품수량 및 가격 차이가 있을 수 있습니다.</div>\
						<div class="location-item">\
							<span class="location-addr">\
								<span class="ns-pin-nike icon"></span>\
								<span class="current-location" v-text="findcal">위치정보 없음</span>\
							</span>\
							<a href="#none" class="location-select" v-on:click="locationSelect" data-click-area="inventory" data-click-name="my region">지역 선택</a>\
						</div>\
						<div class="location-item"><a href="https://nike-breeze.zendesk.com/hc/ko/articles/900002641086" target="_blank" data-click-area="Inventory" data-click-name="buy_reserve_info"><span class="location-addr" style="text-decoration:underline">구매하기 예약하기 차이점</span></a></div>\
						<a href="#" v-bind:class="{active:sortLt}"\
									v-on:click="sort(\'locationTarget\')" class="btn-location-self" data-click-area="inventory" data-click-name="nearest store">내 위치</a>\
					</div>\
					<div class="store-list">\
						<!--/* 상품예약 서비스 상점 리스트 */-->\
						<div class="shipping-header">\
							<span class="store-name" v-bind:class="{active:sortNa}" v-on:click="sort(\'name\')">매장명</span>\
							<span class="prd-cnt" v-bind:class="{active:sortQt}" v-on:click="sort(\'quantityNo\')">수량</span>\
						</div>\
						<div class="shipping-body">\
							<template v-if="dp.length">\
								<div v-for="store in dp" class="shipping-list" v-bind:data-locationid="store.id">\
									<div class="column column-addr">\
										<h2 class="tit"><a v-bind:href="\'/kr/ko_kr/store?storeId=\'+store.id" target="_blank" data-click-area="inventory" data-click-name="store info">{{store.name}}</a></h2>\
										<dl class="address-wrap">\
											<dt class="addr-type">도로명</dt>\
											<dd class="addr">({{store.zip}}) {{store.address1}} {{store.address2}}</dd>\
											<dt class="addr-type">연락처</dt>\
											<dd class="addr"><a v-bind:href="\'tel:\'+store.phone" data-click-area="inventory" data-click-name="store phone number">{{store.phone}}</a></dd>\
										</dl>\
									</div>\
									<div class="column column-reserve">\
										<span class="quantity">{{store.quantityNo}}</span>\
										<button v-if="store.pickupOrderType === \'BOTH\' || store.pickupOrderType === \'BOPIS\'"\
												v-on:click="runOrderTask"\
												v-bind:data-locationid="store.id"\
												v-bind:data-maxquantity="store.quantityNo"\
												data-pickup-type="bopis"\
												class="reservation-apply btn-link mini" data-click-area="inventory" data-click-name="BOPIS_choose store"\
												v-bind:data-store-name="store.name"\
												>구매하기</button>\
										<button v-if="store.pickupOrderType === \'BOTH\' || store.pickupOrderType === \'ROPIS\'"\
												v-on:click="runOrderTask"\
												v-bind:data-locationid="store.id"\
												v-bind:data-maxquantity="store.quantityNo"\
												data-pickup-type="lopis"\
												class="pickup-apply btn-link mini" data-click-area="inventory" data-click-name="ROPIS_choose store"\
												v-bind:data-store-name="store.name"\
												>예약하기</button>\
									</div>\
								</div>\
							</template>\
							<template v-else>\
								<div class="less-items uk-text-center">\
									<i class="icon-search color-less x2large"></i><br />\
									해당 지역의 매장정보가 없습니다.\
								</div>\
							</template>\
						</div>\
					</div>\
				</div>',
			methods:{
				currentLocation:function(e){
					e.preventDefault();
					/* 위치기반 서비스 개발 */
					this.$emit('currentLocation');
				},
				runOrderTask:function(e){
					e.preventDefault();
					var storeId = e.target.getAttribute('data-locationid');
					var pickupType = e.target.getAttribute('data-pickup-type');
					var maxQuantity = e.target.getAttribute('data-maxquantity');

				//ctm태깅추가 체크아웃 ..
				var order_type = e.target.getAttribute('data-click-name') // 보피스, 로피스 구분
				var store_name = e.target.getAttribute('data-store-name') // 스토어 이름
				var store_stock = e.target.getAttribute('data-maxquantity') // 사용자 최대 구매 가능 재고

				data = {};
				data.link_name = (order_type=="BOPIS_choose store" ? "Checkout:Bopis" : "Checkout:Ropis");
				data.checkout_serial = "";
				data.checkout_type = _GLOBAL.CUSTOMER.ISSIGNIN ? "registered" : "guest";
				data.member_serial = _GLOBAL.CUSTOMER.ID;
				data.ctm_order_type = (order_type=="BOPIS_choose store" ? "bopis" : "ropis");   // 주문형태 기입
				data.store_name = (store_name !== '' ? store_name : 'NO_STORE_NAME');
				data.store_stock = (store_stock !== '' ? store_stock : 'NO_STORE_STOCK');
				data.products = [{
					product_category: '',
					product_name: $this.find('input[name=name]').val(),
					product_id: $this.find('input[name=model]').val(),
					product_quantity: '1',
					product_unit_price: $this.find('#retailPrice').val(),
					product_discount_price: $this.find('#productPrice').val()
				}];

				data.page_event = {
						checkout : true,
						value_at_checkout : '',
						units_at_checkout : ''
					}
				
				//매장 픽업 서비스 선택 시 Adobe 태깅 
				endPoint.call('adobe_script', data );

					pickupQuantity.min = 1;
					pickupQuantity.newValue = 1;
					pickupQuantity.max = maxQuantity;

					for(var i = 0; i < this.dp.length; i++) {
						if(this.dp[i].id == storeId) {
							pickupConfirm.storeInfo = this.dp[i];
						}
					}

					pickupQuantity.productPrice = sandbox.rtnPrice($this.find('#productPriceDefault').val());
					this.$emit('ordertask', storeId, pickupType, maxQuantity);
				},
				locationCodeClose: function (e) {
					e.preventDefault();
					pickupLocation.locationCodeWrap = false;
					$this.find('#idLocationSearch').removeClass('active');
				},
				locationSelect: function (e) {
					e.preventDefault();
					pickupLocation.locationCodeWrap = true;
					$this.find('#idLocationSearch').addClass('active');
				}
			}
		});

	    Vue.component('pickup-quantity', {
			props:['isTaskQuantity', 'productPrice', 'quantity', 'newValue', 'max', 'min', 'itemRequest'],
			template:
				'<article id="order-count-select" class="order-count" v-bind:class="{active:isTaskQuantity}" v-bind:data-component-quantity="quantity">\
					<a class="uk-close order-count-select-close" v-on:click="cancel"></a>\
					<h2 class="title">수량 선택</h2>\
					<div class="body">\
						<div class="count">\
							<div class="count-box">\
								<input type="number" v-model="newValue" class="label" readonly />\
								<button type="button" id="count-plus" v-on:click="plusBtn" class="plus"><i class="icon-plus"></i><span>1개씩 추가</span></button>\
								<button type="button" id="count-minus" v-on:click="minusBtn" class="minus"><i class="icon-minus"></i><span>1개씩 삭제</span></button>\
							</div>\
							<div class="price-box">{{productPrice}}</div>\
						</div>\
						<p class="msg"></p>\
						<button type="button" class="qty-selected btn-link width-max large" v-on:click="selected">선택완료</button>\
					</div>\
				</article>',
			methods:{
				plusMinusFun:function(operator, num){
					var productPrice = $this.find('#productPrice').val();
					var productPriceDefault = $this.find('#productPriceDefault').val();
					var count = 0;

					if(operator == 'plus') {
						count = parseInt(productPrice) + parseInt(productPriceDefault);
					}else{
						count = parseInt(productPrice) - parseInt(productPriceDefault);
					}

					$this.find('#productPrice').val(count);
					$this.find('#retailPrice').val(count);
					$this.find('#quantity').val(num);

					pickupConfirm.itemRequest.quantity = num;
					pickupConfirm.itemRequest.retailprice = sandbox.rtnPrice(String($this.find('#productPrice').val()));

					this.productPrice = sandbox.rtnPrice(String($this.find('#productPrice').val()));
				},
				plusBtn:function(){
					if(this.max == undefined || (this.newValue < this.max)) {
						this.newValue = this.newValue + 1;
						this.plusMinusFun('plus', this.newValue);
					}
				},
				minusBtn:function(){
					if(this.newValue > this.min) {
						this.newValue = this.newValue - 1;
						this.productPrice = this.productPrice * 2;
						this.plusMinusFun('minus', this.newValue);
					}
				},
				selected:function(e){
					e.preventDefault();
					pickupConfirm.itemRequest.size = pickupQuantity.size;
					this.$emit('selected', 1);
				},
				cancel:function(){
					this.$emit('cancel', 'quantity');
				},
				created:function(){}
			}
		});


		//사용안함
		Vue.component('pickup-confirm', {
			props:['isTaskConfirm', 'customer', 'storeInfo', 'itemRequest'],
			template:
				'<div class="reservation-confirm-wrap" v-if="isTaskConfirm" v-bind:class="{active:isTaskConfirm}">\
					<div class="header">\
						<h2 class="tit">매장상품 {{itemRequest.titleName}} 확인</h2>\
						<span class="description">아래 정보를 확인하시고,{{itemRequest.titleName}} 신청버튼을 누르시면 <br/>매장상품 {{itemRequest.titleName}}이 완료됩니다.</span>\
					</div>\
					<div class="body">\
						<dl v-if="customer.isSignIn !== \'false\'" class="list-grid">\
							<dt class="caption">신청자 정보</dt>\
							<dd class="column">\
								<div class="contents customer">\
									<span><strong>이름: </strong>{{customer.firstName}}</span><br/>\
									<span><strong>휴대폰: </strong>{{customer.phoneNumber}}\
										<a class="btn-link line mini btn-info-edit" href="/kr/ko_kr/account" data-click-area="inventory" data-click-name="change personal info">회원정보 변경</a>\
									</span>\
								</div>\
							</dd>\
						</dl>\
						<dl v-if="storeInfo !== null" class="list-grid">\
							<dt class="caption">매장 정보</dt>\
							<dd class="column">\
								<div class="contents store">\
									<a class="link" v-bind:href="rtnStoreLink(storeInfo.id)" target="_blank">{{storeInfo.name}}</a>\
									<dl class="address-wrap">\
										<dt class="addr-type">도로명</dt>\
										<dd class="addr">({{storeInfo.zip}}) {{storeInfo.address1}} {{storeInfo.address2}}</dd>\
										<dt class="addr-type">연락처</dt>\
										<dd class="addr">{{storeInfo.phone}}</dd>\
									</dl>\
									<span v-if="storeInfo.additionalAttributes.length > 0"><strong>매장영업시간:</strong><br/></span>\
									<span class="description">매장 영업시간 외 {{itemRequest.titleName}}하신 경우, 다음 날 영업시간 내에 {{itemRequest.titleName}}확정 문자가 전송됩니다.</span>\
								</div>\
							</dd>\
						</dl>\
						<dl v-if="itemRequest !== null" class="list-grid">\
							<dt class="caption">{{itemRequest.titleName}} 상품</dt>\
							<dd class="column">\
								<div class="contents product">\
									<div class="product-image"><img v-bind:src="itemRequest.image" v-bind:alt="itemRequest.image" /></div>\
									<div class="product-info">\
										<a class="link" v-bind:href="itemRequest.url" target="_blank">{{itemRequest.name}}</a>\
										<span class="model">{{itemRequest.model}}</span>\
										<span class="option">색상 : {{itemRequest.option}}</span>\
										<span class="size">사이즈 : {{itemRequest.size}}</span>\
										<span class="quantity">수량 : {{itemRequest.quantity}}</span>\
										<span class="price">가격 : {{itemRequest.retailprice}}</span>\
									</div>\
								</div>\
							</dd>\
						</dl>\
					</div>\
					<p class="msg">\
						* {{itemRequest.titleName}} 신청이 완료되면 선택하신 매장으로부터 {{itemRequest.titleName}}확정 문자가 발송됩니다. 방문기간을 확인 하시고, 매장에 방문하셔서 {{itemRequest.titleName}}하신 상품을 결제하시면 구매가 완료됩니다.<br/>\
						* {{itemRequest.titleName}}취소는 {{itemRequest.titleName}}확정 문자수신 후 2시간 이내에 마이페이지 > 매장상품 {{itemRequest.titleName}} 서비스에서 가능합니다.\
					</p>\
					<div class="footer">\
						<a href="javascript:;" class="reservation-confirm-btn btn-link large" data-click-area="inventory" v-on:click="submit">{{itemRequest.titleName}}하기</a>\
						<a href="javascript:;" class="cencel-btn btn-link line large" data-click-area="inventory" v-on:click="cancel">취소</a>\
					</div>\
				</div>',
			methods:{
				submit:function(e){
					e.preventDefault;
					this.$emit('submit');
				},
				cancel:function(e){
					e.preventDefault;
					this.$emit('cancel', 'orderConfirm');
				},
				rtnStoreLink:function(id){
					return '/kr/ko_kr/store?storeId=' + id;
				}
			}
		});

	    var Method = {
	        updateAreaAgencyCnt:function(hasLocalNo, areaMap){
	            try {
	                var countVal, areaId;
	                if(hasLocalNo==false){//지역미선택
	                    $this.find('[data-area-info]').each(function(){
	                        areaId = $(this).attr('value');
	                        countVal = areaMap[areaId];
	                        if(typeof(countVal)==="undefined") {
	                            countVal = "0";
	                        }
	                        $this.find('#area-branch-cnt-' + areaId).text(countVal);
	                    });
	                }else{//지역선택시 해당 지역만 초기화
	                    var areaList = [];
	                    for(var areaId in areaMap){
	                        $this.find('#area-branch-cnt-' + areaId).text(areaMap[areaId]);
	                    }
	                }
	            }catch(e){
	                //alert("지역 초기화중 에러 : "+ e);
	            }
	        },
	        executeOrderCountFinish:function(){
	            sandbox.getModule('module_header').setLogin(function(){
	                var $form = $this.find('form');

	                // form value
	                var itemRequest = BLC.serializeObject($form);
	                // pickupConfirm.itemRequest = itemRequest;

	                sandbox.setLoadingBarState(true);

	                BLC.ajax({
	                    url:$form.attr("action"),
	                    type:"POST",
	                    dataType:"json",
	                    // data: pickupConfirm.itemRequest
	                    data: itemRequest
	                },function (data) {
	                    if(data.error){
	                        sandbox.setLoadingBarState(false);
	                        $this.find('.dim').removeClass('active');
	                        UIkit.modal.alert(data.error);
	                    }else{
	                        Core.Loading.show();
	                        // endPoint.call( 'buyNow', pickupConfirm.itemRequest);
	                        // endPoint.call( 'buyNow', itemRequest);
	                        _.delay(function(){
	                            window.location.assign(sandbox.utils.contextPath +'/checkout' );
	                        }, 500);
	                    }
	                }).fail(function(msg){
	                    if(commonModal.active) commonModal.hide();
	                    Core.Loading.hide();
	                    if(msg !== '' && msg !== undefined){
	                        UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'warning'});
	                    }
	                });
	            });
	        },

	        moduleInit:function(){
	            $this = $(this);
	            args = arguments[0];

	            // vue 컴포넌트 초기화
			    vueContainer = new Vue({
					el:'#idLocationSearch',
					data:{
						'location': pickupLocation,
						'confirm': pickupConfirm,
						'quantity': pickupQuantity,
						'quantityNo': 0,
						'skuIdNe': '',
						'sizeIdNe': '',
						'stateList': [],
						'storeType': [],
						'localSelect': [],
						'dataList': [],
						'inventory': [],
						'storeAll': {'active': true},
						'currentSort': 'quantity',
						'currentSortDir': 'asc',
						'findLocation': '위치정보 없음',
						'tag': false,
						'flag': false,
						'GeoLocation': true
					},

					created:function(){
						var vm = this;
						sandbox.utils.promise({
							url:sandbox.utils.contextPath +'/processor/execute/store',
							method:'GET',
							data:{
								'mode':'template',
								'templatePath':'/page/partials/storeList',
								'isShowMapLocation':false
							},
						}).then(function(data){
							var $defer = $.Deferred();
							var data = sandbox.utils.strToJson(data.replace(/&quot;/g, '"'));
							if (data !== '') {
								vm.dataList = data;
								$defer.resolve(data);
							} else {
								$defer.reject('location info is empty');
			                }

							return $defer.promise();
						}).fail(function(msg){
							UIkit.notify(msg, {timeout:3000,pos:'top-center',status:'danger'});
			            });

						if(!window.naver){
							$.getScript("https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=" + args.mapkey + "&submodules=geocoder");
						}
					},

					computed:{
						storeList:function(s){
							var vm = this;
							var flag = this.flag;

							return this.dataList.filter(function (row, index){
								var _id = row.id;
								var _state = row.state;
								row.locationTarget = calculateDistance(currentGeoLocation.latitude, currentGeoLocation.longitude, row.latitude, row.longitude);
								row.isAbleCod = (args.ableCod === 'true') ? true : false;
								row.isAblePickup = (args.ablePickup === 'true') ? true : false;

								return vm.inventory.some(function(size){
									var _size = size.fulfillmentLocationId;
									if (_id == _size) row.quantityNo = size.quantityAvailable;
									return vm.localSelect.some(function (tag) {
										if(!flag){
											return _id == _size && vm.storeAll.active == true;
										}else{
											return _id == _size && tag.name == _state && tag.active === true;
										}
									});
								});
							}).sort(function(a, b){
								// var modifier = 1;
								if (vm.currentSortDir === 'desc') {
									if (a[vm.currentSort] < b[vm.currentSort]) return 1;
									if (a[vm.currentSort] > b[vm.currentSort]) return -1;
								}else{ // asc
									if(a[vm.currentSort] < b[vm.currentSort]) return -1;
									if(a[vm.currentSort] > b[vm.currentSort]) return 1;
								}
								return 0;
							});
						},
						storeType:function(){
							return this.storeType
						},
						localSelect:function(){
							return this.localSelect
						}
					},

					methods:{
						pickupLocation:function(size, skuId){
							var vm = this;
							this.skuIdNe = skuId;
							this.sizeIdNe = size;

							var obj = {
								'skuId': skuId,
								'json': 'true',
								'fType': 'PHYSICAL_PICKUP',
                                'pageSize': '10000'
							}
							// ajax:function(url, method, data, callback, isCustom, isLoadingBar, delay, dataType, cache){
							sandbox.utils.ajax(sandbox.utils.contextPath + '/processor/execute/pickable_inventory', 'GET', obj, function(data){
								vm.inventory = JSON.parse(data.responseText);

								// 지역 초기화
								vm.dataList.filter(function (row, index) {
									vm.localSelect[index] = { 'active': false, 'view': false, 'id': row.id, 'name': row.state};
								});

								// 사이즈 선택 시 해당 지역만 필터에 노출
								vm.localSelect.filter(function(row){
									var _id = row.id;
									vm.inventory.some(function(size){
										var _size = size.fulfillmentLocationId;
										if (_id == _size) row.view = true;
									});
									if (row.view !== true) row.name = '';
								});
								vm.localSelect = _.unionBy(vm.localSelect, vm.localSelect, 'name');

								// 사이즈 변경 시 초기화
								vm.sort('quantityNo');
								vm.toggle('false');
								vm.storeAll.active = true;
							}, true, false, 1200);
						},
						sort:function(s){
							switch (s) {
								case 'locationTarget':
									findGeoLocation(true);
									break;
								case 'name':
									this.currentSortDir = 'asc';
									this.currentSort = 'name';
									break;
								case 'quantityNo':
									this.currentSortDir = 'desc';
									this.currentSort = 'quantityNo';
									break;
							}
						},
						toggle:function(bools){
							var vm = this;
							this.flag = JSON.parse(bools);

							if(this.flag){ // 지역선택
								vm.storeAll.active = false;
							}else{ // 전체
								vm.localSelect.filter(function(row){
									row.active = false;
								});
								// vm.storeAll = true;
							}
						},
						pickupOrderQuantity:function(storeId, pickupType, maxQuantity){ // 수량 선택
							var $form = $this.find('form');
							var itemRequest = BLC.serializeObject($form);

							var _pickupType = (pickupType === 'lopis') ? true : false;

							itemRequest.isJustReservation = _pickupType
							itemRequest.titleName = (pickupType === 'lopis') ? '예약' : '픽업';

							$this.find('#isJustReservation').val(_pickupType);
							$this.find('#fulfillmentLocationId').val(storeId);

							itemRequest.fulfillmentLocationId = storeId;
							pickupConfirm.itemRequest = itemRequest;
							pickupConfirm.customer = sandbox.getModule('module_header').getCustomerInfo();

							for (var i = 0; i < totalPickupLocation.length; i++) {
								if (totalPickupLocation[i].id == storeId) {
									pickupConfirm.storeInfo = totalPickupLocation[i];
								}
							}

							// pickupQuantity.isTaskQuantity = true; // 수량 선택 활성화
							pickupQuantity.quantity.maxQuantity = pickupQuantity;
							// $this.find('.dim').addClass('active');

							// if (_pickupType) {
							//     pickupConfirm.isTaskConfirm = true;
							// } else {
							//     Method.executeOrderCountFinish();
							// }
							Method.executeOrderCountFinish();
						},
						pickupConfirmShow:function(qty){ // 수량 선택 완료
							pickupQuantity.isTaskQuantity = false;
							$this.find('.dim').removeClass('active');
							pickupConfirm.isTaskConfirm = true;
						},
						orderConfirmSubmit:function(){
							Method.executeOrderCountFinish();
						},
						orderCancel:function(status){
							$this.find('.dim').removeClass('active');

							var _productPriceDefault = $this.find('#productPriceDefault').val();

							// 상품가격 초기화
							$this.find('#productPrice').val(_productPriceDefault);
							$this.find('#retailPrice').val(_productPriceDefault);

							switch (status) {
								case 'orderConfirm' :
									pickupConfirm.isTaskConfirm = false;
									break;
								case 'quantity' :
									pickupQuantity.isTaskQuantity = false;
									break;
							}
						},
					}
				});

				var currentDate = new Date();
	            var reservationModal = UIkit.modal('#reservation-modal', {center:true});
	            //var disabledDays = []; 사용되지 않는 것으로 보입니다. 2020-04-02 pck 
                //var disabledDays = []; 사용되지 않는 것으로 보입니다. 2020-04-02 pck
                //console.log('a')
                var skuData = []; //sandbox.getComponents('component_product_option', {context:$(document)}).getDefaultSkuData();
                sandbox.getComponents('component_product_option', {context:$(document)}, function(i){
                    if (i==0) {
                        skuData = this.getDefaultSkuData();
                    }
                })

                
	            var radioComponent = sandbox.getComponents('component_radio', {context:$this}, function(i){
	                var _self = this;
	                var INDEX = i;

	                this.addEvent('change', function(size, value, id, friendlyName){
	                    var skuID = 0;
	                    var _this = this;
	                    skuData.some(function(size){
	                        if ($(_this).data('id') == size.selectedOptions[0]) skuID = size.skuId;
	                        return skuID;
	                    });
						sizeOptionToggle(size, friendlyName, skuID);

						//Adobe 태깅 부 추가 2020-04-02 pck (s)
						var param = {};
						var sizeRunAvailability = $('input[name="size-run-availability"]').val();

						param.link_name = 'Size Run Selections';
						param.size_run_selection = (size !== '') ? size : '';
						param.size_run_availability = (sizeRunAvailability !== '') ? sizeRunAvailability : '';
						param.page_event = {size_run_select : true}
						endPoint.call('adobe_script', param);
						//Adobe 태깅 부 추가 2020-04-02 pck (e)
	                });

	                // PDP 사이즈값 받아오기
	                var pdp_option_size = $('.size-grid-type .hidden-option').val();
	                if(pdp_option_size){
	                    this.trigger(pdp_option_size, pdp_option_size);
	                }
	            });
	        }
	    }

	    return {
	        init:function(){
	            sandbox.uiInit({
	                selector:'[data-module-pickup-location]',
	                attrName:'data-module-pickup-location',
	                moduleName:'module_pickup_location',
	                handler:{context:this, method:Method.moduleInit}
	            });
	        }
	    }
	});
})(Core);

(function(Core){
	Core.register('module_gnb', function(sandbox){

		var Method = {
			moduleInit:function(){
				var $this = $(this);
				var $oneDepth = $('.onedepth-list');
				var args = arguments[0];

				if(args.type === 'type1'){
					var timeoutId = null

					$oneDepth.on({
						'mouseenter.lnb':function(){
							clearInterval( timeoutId );
							$(this).find('>').addClass('active');
							$(this).siblings().find('>').removeClass('active');
						},
						'mouseleave.lnb':function(){
							var $this = $(this);
							timeoutId = setTimeout( function(){
								$this.find('>').removeClass('active');
							}, 300);
						},
						'click.lnb':function(e){
							var href = $(this).attr("href");
							if( href == "#" || href == "javascript:;" ){
								e.preventDefault();
								$(this).find('>').addClass('active');
							}
						}
					});
				}else if(args.type === 'type2'){
					$oneDepth.on({
						'mouseenter.lnb':function(){
							$(this).find('>').addClass('active');
							$(this).find('.header-menu_twodepth').css({'display':'block'});
							$(this).find('.menu-banner-conts').css({'display':'block'});
						},
						'mouseleave.lnb':function(){
							$(this).find('>').removeClass('active');
							$(this).find('.header-menu_twodepth').removeAttr('style');
							$(this).find('.menu-banner-conts').removeAttr('style');
						},
						'click.lnb':function(e){
							var href = $(this).attr("href");
							if( href == "#" || href == "javascript:;" ){
								e.preventDefault();
								$(this).find('>').addClass('active');
							}
						}
					});
				}

				var $modile = $('#mobile-menu');
				$modile.find('.mobile-onedepth_list').on('click', '> a', function(e){
					if(!$(this).hasClass('link')){
						e.preventDefault();
						$(this).siblings().show().stop().animate({'left':0}, 300);
					}
				});

				$modile.find('.location').on('click', function(e){
					e.preventDefault();
					$(this).parent().stop().animate({'left':-270}, 300, function(){
						$(this).css('left', 270).hide();
					});
				});
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-gnb]',
					attrName:'data-module-gnb',
					moduleName:'module_gnb',
					handler:{context:this, method:Method.moduleInit}
				});
			}
		}
	});
})(Core);

(function(Core){
	Core.register('module_order_customer', function(sandbox){
		var args = null, endPoint;
		var Method = {
			moduleInit:function(){
				var $this = $(this);
				args = arguments[0] || {};
				endPoint = Core.getComponents('component_endpoint');
				Method.$that = $this;
				Method.$submitBtn = $this.find('button[type="submit"]');
				Method.$submitBtn.on("click", Method.checkout );

				sandbox.validation.init( $this.find('#order_info') );

				if( $this.find('input[name="isAlreadyRegistered"]').length > 0){
					endPoint.call('openAlreadyRegistered');
					UIkit.modal.confirm('이미 회원 가입된 아이디 입니다. 로그인 하시겠습니까?', function(){
						window.location.replace(sandbox.utils.contextPath + '/login?successUrl=/checkout');
					}, function(){},
					{
						labels: {'Ok': '로그인', 'Cancel': '비회원 주문'}
					});

				}

				//@pck 2021-03-09 ISMS 조치사항 추가, 비회원 개인정보 동의 체크 추가
				if( $this.find('input[name="isNonMemberCheckAgree"]').length > 0 ){
					$this.find('input[name="isNonMemberCheckAgree"]').on('change', function(){
						var isChecked = $(this).is(':checked');
						if(isChecked){
							$("#btn-next").removeClass('disabled');
						}else{
							$("#btn-next").addClass('disabled');
						}
					});
				}
			},

			checkout:function(e){
				e.preventDefault();

				if (Method.$that.find('[name="isNonMemberCheckAgree"]').length > 0) {
					var isNonMemberCheckAgree = Method.$that.find('[name="isNonMemberCheckAgree"]').is(':checked');
					if( !isNonMemberCheckAgree ){
						UIkit.modal.alert("비회원 개인정보 수집 및 이용에 동의해주세요");
						return;
					}else{
						Method.$that.find('#order_info').submit();
					}
				}else{
					Method.$that.find('#order_info').submit();
				}
			}

		}


		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-order-customer]',
					attrName:'data-module-order-customer',
					moduleName:'module_order_customer',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			getOrderCustomerInfo:function(){
				return {
					name:args.name,
					phoneNum:args.phoneNum,
					emailAddress:args.emailAddress
				}
			}
		}
	});
})(Core);

(function(Core){
	'use strict';

	Core.register('module_returnorder', function(sandbox){
		var Method = {
			$that:null,
			$allCheck:null, // 팝업 전체 선택 체크박스
			$itemList:null, // 선택 해서 popup에 노출되는 아이템 리스트
			$popModal:null,
			$returnBtn:null,
			$returnItemList:null,
			$popSubmitBtn:null,
			$beforeAddress:null,
			$refundAccountInfo:null, //환불정보 입력 폼
			$refundAccountInfoGuide:null, //환불정보 입력 폼 -> 가이드 텍스트 2019-04-12
			$newAddress:null,
			isAble:null,
			isAblePartialVoid:null,
			deliverySearch:null,
			isNewAddress:false,
			isDoubleClickFlag:true,
			isCheckeds:false,
			isRefundAccount:false,
			isMid:false,
			isFdk:false,
			isChangeCustomerAddress:false,
			addressComponent: null,
			// isSearchAddress:true,

			moduleInit:function(){
				var args = Array.prototype.slice.call(arguments).pop();
				$.extend(Method, args);

				var $this = $(this);
				Method.$that = $this;
				Method.$popModal = UIkit.modal("#popup-return");
				Method.$returnBtn = $this.find('[data-return-btn]');
				Method.$popCuntBtn = Method.$popModal.find('[data-cunt-submit]');
				Method.$popSubmitBtn = Method.$popModal.find('[data-return-submit]');
				Method.$popAddressModal = UIkit.modal("#popup-customer-address", {modal: false});
				Method.$beforeAddress = Method.$popModal.dialog.find('[data-before-return-address]');
				Method.$newAddress = Method.$popModal.dialog.find('[data-new-return-address]');
				Method.$refundAccountInfo = Method.$popModal.find('[data-refund-account-info]');
				Method.$refundAccountInfoGuide = Method.$popModal.find('[data-refund-account-info-guide]'); // 2019-04-12
				Method.addressComponent = Core.getComponents('component_customer_address', { context: $this });

				// 반품 사유 변경시
				$this.find('[data-return-reason-type]').on("change", function(){
					Method.updatePaymentInfo( false );
					var val = $(this).val();
					var target = $(this).parents('.container').find('.uk-text-danger');
					if(val == 'COLOR_SIZE_CHANGE' || val == 'NO_PURCHASE_INTENT'){
						target.parent('.uk-form-row').removeClass('uk-hidden');
						target.text('구매자귀책인 경우 주문배송비는 환불되지 않습니다.');
					} else if(val == null || val == ''){
						target.parent('.uk-form-row').addClass('uk-hidden');
					} else{
						target.parent('.uk-form-row').removeClass('uk-hidden');
						target.text('고객님의 책임으로 상품이 멸실 또는 훼손인 경우 반품이 불가합니다.');
					}
				});

				// 전체 선택 체크박스 처리
				Method.$allCheck = Method.$popModal.find('input[name="check-all"]');
				Method.$allCheck.on("change", Method.changeAllCheck );

				// 주문별 전체 반품
				$this.find('[data-return-order-btn]').on('click', function(e){
					e.preventDefault();
					// console.log($(this).closest('[data-return-order]').find('[data-return-order-item]'))
					// Method.openReturnOrderPopup( $(this).closest('[data-return-order]').find('[data-return-order-item]') );
					Method.openReturnOrderPopup($(this).data("orderid"));
				});


				// 반품 신청 노출 여부
				// $this.find('.order-item-wrap').each(function (i) {
				//	var arrWrap = [];
				//	$(this).find('.item-info').each(function (i) {
				//		var arr = [];
				//		$(this).find('ul li').each(function (i) {
				//			arr.push($(this).find('[data-availablequantity]').data('availablequantity') == 0);
				//		});
				//		arrWrap = _.every(arr, Boolean)
				//	});
				//	if (!arrWrap) $(this).find('.item-btn').show();
				// });

				// 반품 신청 노출 여부
				$this.find('.order-item-wrap').each(function (i) {
				var arrWrap = false;
				var item_btn_len  = $(this).find('button').length;  //오더당 반품 버튼 갯수

				$(this).find('.item-info').each(function (i) {
					$(this).find('ul li').each(function (i) {
						if( $(this).find('[data-availablequantity]').data('availablequantity') > 0){

						 arrWrap = true;
						 return false;;
						}
					});
				});
				    if (arrWrap){
				         for(var i=0; i < item_btn_len; i++){
				           if(i<1){
						      $(this).find('.item-btn').eq(0).show();
						    } else {
						      $(this).find('.item-btn').eq(i).hide();
						    }
						 }
					 } else{
 					   $(this).find('.item-btn').hide();
 					}
				});


				// 배송지 선택 버튼
				$this.find('[data-customer-address-btn]').on('click', function(e){
					e.preventDefault();
					Method.$popAddressModal.show();
				});

				// 배송지 선택 모듈 select 이벤트 호출( 배송지 선택했을때 호출됨 )
				Core.getComponents('component_customer_address', {context:$this}, function(){
					this.addEvent('select', function(data){
						Method.updateCustomerAddress( data );
						if( Method.$popAddressModal.isActive()){
							Method.$popAddressModal.hide();
						}
					})
				});

				var addressList = Method.$popAddressModal.find('[data-customer-address-select-btn]');
				// 등록되어있는 배송지가 없다면
				// TODO customer_address compnent에 size 추가 하자
				if( !Core.getModule('module_header').getIsSignIn()){
					$this.find('[data-return-address-type] a').removeClass('uk-active').eq(1).addClass('uk-active');
					Method.updateAddressInput();
					$this.find('[data-return-address-type]').hide();
					$this.find('#return-address').removeClass('uk-margin-top');

					// Method.isSearchAddress = false;

					$this.find('.input-textfield.value > label').hide();

					var nonmemberinfo = $this.find('#NonMemberInfo');
					var newReturnAddress = $this.find('#new-return-address');
					newReturnAddress.find('input[name="addressFirstName"]').val(nonmemberinfo.data('name'));
					newReturnAddress.find('input[name="addressPhone"]').val(nonmemberinfo.data('phonenumber'));
					newReturnAddress.find('input[name="addressLine1"]').val(nonmemberinfo.data('addressline1'));
					newReturnAddress.find('input[name="addressLine2"]').val(nonmemberinfo.data('addressline2'));
					newReturnAddress.find('input[name="addressPostalCode"]').val(nonmemberinfo.data('addresspostalcode'));
					newReturnAddress.find('input[name="addressCity"]').val(nonmemberinfo.data('addresscity'));
				}else{
					// 첫번째 주소 선택
					$this.find('[data-return-address-type]').show();
					$this.find('#return-address').addClass('uk-margin-top');
					// addressList.eq(0).trigger('click');
				}

				// 주소 입력 처리
				var $zipCodeInput = $(this).find('[name="addressPostalCode"]');
				var $cityInput = $(this).find('[name="addressCity"]');

				Method.deliverySearch = sandbox.getComponents('component_searchfield', {context:$this, selector:'.search-field', resultTemplate:"#address-find-list"}, function(){
					// 검색된 내용 선택시 zipcode 처리
					this.addEvent('resultSelect', function(data){
						var zipcode = $(data).data('zip-code5');
						var city = $(data).data('city');
						var doro = $(data).data('doro');

						var $input = this.getInputComponent().setValue( '(' + zipcode + ')' + city + doro );

						$zipCodeInput.val( zipcode );
						$cityInput.val( city.split(' ')[0] );
					});
				});

				// 배송지 입력 타입 버튼 선택시
				$this.find('[data-return-address-type]').on('show.uk.switcher', function(){
					Method.updateAddressInput();
				});

				// 수거메모 선택시
				$this.find('[data-personal-message-select]').on('change', Method.updatePersonalMessage )

				Method.$popSubmitBtn.on('click', Method.returnOrderSubmit );
			},

			updatePersonalMessage:function(e){
				e.preventDefault();
				var $msgContainer = Method.$popModal.dialog.find('[data-personal-message]');
				var $personalMsg = $msgContainer.find('[name="personalMessageText"]');

				var value = $(this).val();
				if(value == ''){
					$personalMsg.val('');
					$msgContainer.addClass('uk-hidden');
				}else if(value == 'dt_1'){
					// 직접입력일 경우
					$personalMsg.val('');
					$msgContainer.removeClass('uk-hidden');
				}else{
					//$personalMsg.val( $(this).find("option:selected").val() + "||" + $(this).find("option:selected").text() );
					$personalMsg.val( $(this).find("option:selected").text());
					$msgContainer.addClass('uk-hidden');
				}
			},
			removeWrongAddress: function (addressId) {
				if (Method.addressComponent != null) {
					// 처음 들어오는건 기본 배송지지만 선택을 해서 변경
					UIkit.modal.alert('배송지가 유효하지 않아 삭제 됩니다. 다른 배송지를 사용하거나 배송지를 새로 입력하세요.').on('hide.uk.modal', function () {
						Core.Loading.show();
						Method.addressComponent.removeAddress(addressId, function (data) {
							window.location.reload();
						});
					});
				}
			},
			// 반품 신청 팝업
			openReturnOrderPopup:function( orderId ){
				var $modal = Method.$popModal;
				var $modalForm = $modal.dialog.find('form');
				Method.$itemList = $modal.dialog.find('[data-return-reason-list]>ul');

				var $reasonItem = $modal.dialog.find('[data-return-reason-item]');
				var $returnAddress = $modal.dialog.find('input[name="return-address"]');

				Method.$itemList.empty();

				var $paymentList = $modal.find('[data-payment-list]');
				var $paymentItem = $modal.find('.uk-hidden[data-payment-item]');

				$paymentList.empty();

                var $newItem1 = Method.getReplacePaymentItem( $paymentItem, "상품금액 합계 : ", '' );
                $newItem1.appendTo( $paymentList );
                var $newItem2 = Method.getReplacePaymentItem( $paymentItem, "주문 배송비 : ", '' );
                $newItem2.appendTo( $paymentList );
                var $newItem3 = Method.getReplacePaymentItem( $paymentItem, "반품 배송비 : ", '' );
                $newItem3.appendTo( $paymentList );

				// sandbox.getModule('module_header').reDirect().setLogin(function(){
					sandbox.utils.promise({
						url:sandbox.utils.contextPath + '/account/orders/returnable/request/' + orderId,
						method:'GET',
					}).then(function(data){
						var defer = $.Deferred();

						$modal.find('#returnReasonItem').remove();
						$modal.find("input[name='never-cause']").remove();
						$modal.find('[data-return-reason-list]').append(data);

						/*
						isAble 				: 주문 취소, 반품 가능 여부
						isRefundAccount 	: 환불 계좌 필요 여부
						isAblePartial   	: 부분 취소, 반품 가능 여부
						*/
						Method.isAble = $modal.find('#returnReasonItem').data('isable');
						Method.isAblePartialVoid = $modal.find('#returnReasonItem').data('isablepartial');
						Method.isRefundAccount = $modal.find('#returnReasonItem').data('isrefundaccount');
						Method.isFdk = $modal.find('#returnReasonItem').data('isfdk');
						Method.isMid = $modal.find('#returnReasonItem').data('ismid');
						Method.isMobilePayment = $modal.find('#returnReasonItem').data('ismobilepayment');

						// 모달창 초기화
						$modal.find('.exception_request').hide();
						$modal.find('.input-checkbox').css({'opacity':1, 'padding-left':18});
						$modal.find('.dynamic-form').show();
						$modal.find('#panel-box').show();

						// 매입전 주문 반품 신청 시 예외처리
						if (Method.isFdk == true && Method.isMid == false) {
							Method.isAble = false;
							$modal.find('.exception_request').text($modal.find('.exception_request').data('deafult-message')).show();
						}else{
							// 매입전 예외처리 이외의 반품 불가능 상태에 대한 메시지 처리
							if( Method.isAble == false ){
								$modal.find('.exception_request').text($modal.find("input[name='never-cause']").val()).show();
							}
						}

						// 반품 불가능시 불필요한 UI 숨김
						if( Method.isAble == false ){
							$modal.find('.input-checkbox').css({'opacity':0, 'padding-left':0});
							$modal.find('.dynamic-form').hide();
							$modal.find('#panel-box').hide();
						}

						// 환불 계좌 필요 여부
						if (Method.isRefundAccount) {
							Method.$refundAccountInfo.show();
						} else {
							Method.$refundAccountInfo.hide();
						}

						// Mobile 주문시, 가이드 텍스트 노출. 2019-04-12 by Kim.H.G
						if (Method.isMobilePayment) Method.$refundAccountInfoGuide.show();

						var $newItem = $reasonItem.removeClass("uk-hidden");
						var $info = $newItem.find('[return-reason-info]');
						var $thumb = $newItem.find('[return-reason-thumb]');
						var $item = $modal.find('[data-return-reason-list]>ul>li');
						var sum_Quantity = 0;  // // 반품 가능 상품이 2개 이상이면 안내멘트 div 노출시킴,

						$item.each(function () {
							// 반품 가능 수량
							var returnableQuantity = $(this).find('input[name="returnableQuantity"]').val();
							// 반품 된 수량
							var returnedQuantity = $(this).find('input[name="returnedQuantity"]').val();

							   sum_Quantity = sum_Quantity+returnedQuantity;

							// 복사된 정보중 수량은 삭제
							$info.find('.opt.quantity').remove();

							if( Method.isAblePartialVoid ){
								var $quantitySelectbox = $(this).find('[return-reason-partials-quantity]').find("select");
								$quantitySelectbox.removeAttr('disabled');

								var isSelected = '';
								for( var i=1; i<=returnedQuantity; i++){
									if(i == returnedQuantity) isSelected = 'selected=selected';
									$quantitySelectbox.append( '<option value="' + i + '" ' + isSelected + '>' + i +'</option>');
									isSelected = '';
								}
							}else{
								var $quantity = $(this).find('[return-reason-order-quantity]').show();
								$quantity.find('input[name="quantity"]').removeAttr('disabled').val(returnedQuantity);
								$quantity.find('[data-quantity]').text(returnedQuantity);
							}
						});


						// 반품 가능 상품이 2개 이상이면 안내멘트 div 노출시킴,
						if(($item.length>1)||(sum_Quantity>1)){
							$modal.find('#jq_etc_guid').show();
						}else{
							$modal.find('#jq_etc_guid').hide();
						};

						// 팝업에서 수량 셀렉트 변경시
						//Method.$itemList.find('select').off('change').on("change", Method.updateStatus );

						Method.updatePaymentInfo( false );

						// 부분반품 불가  / 신청가능
						if( Method.isAblePartialVoid ){
							Method.updateSubmitBtn( false );
						} else {
							Method.updateSubmitBtn( true );
						}

						//Method.updateStatus();

						if( Method.isAblePartialVoid ){
							// console.log( '부분 반품' );
							$modal.find('[data-return-reason-list]>ul>li').find('input[type="checkbox"]').on("change", Method.changeItemCheck );

							// $modal.find('[data-return-reason-list]>ul>li').find('select').on("change", Method.updateStatus );

							Method.updateInfoByIsPartial( true );
							// Method.updateSubmitBtn( true );

							// 전체 취소로 초기화
							Method.$allCheck.prop('checked', false ).trigger('change');
						}else{
							// console.log( '전체 반품' );
							Method.updateInfoByIsPartial( false );
							// Method.updateSubmitBtn( true );
							// Method.updateStatus();
						}

						// 반품주소 default 셑팅
						Method.$beforeAddress.find('[data-user-name]').html($.trim($modal.find('#returnReasonItem').data('returnaddress-fullname')));
						Method.$beforeAddress.find('[data-phone]').html($.trim($modal.find('#returnReasonItem').data('returnaddress-phonenumber')));
						Method.$beforeAddress.find('[data-postalCode]').html($.trim($modal.find('#returnReasonItem').data('returnaddress-postalcode')));
						Method.$beforeAddress.find('[data-address1]').html($.trim($modal.find('#returnReasonItem').data('returnaddress-addressline1')));
						Method.$beforeAddress.find('[data-address2]').html($.trim($modal.find('#returnReasonItem').data('returnaddress-addressline2')));
						
						Method.$beforeAddress.find('input[name="addressId"]').val($.trim($modal.find('#returnReasonItem').data('returnaddress-id')));
						Method.$beforeAddress.find('input[name="addressFirstName"]').val($.trim($modal.find('#returnReasonItem').data('returnaddress-fullname')));
						Method.$beforeAddress.find('input[name="addressPhone"]').val($.trim($modal.find('#returnReasonItem').data('returnaddress-phonenumber')));
						Method.$beforeAddress.find('input[name="addressLine1"]').val($.trim($modal.find('#returnReasonItem').data('returnaddress-addressline1')));
						Method.$beforeAddress.find('input[name="addressLine2"]').val($.trim($modal.find('#returnReasonItem').data('returnaddress-addressline2')));
						Method.$beforeAddress.find('input[name="addressPostalCode"]').val($.trim($modal.find('#returnReasonItem').data('returnaddress-postalcode')));
						Method.$beforeAddress.find('input[name="addressCity"]').val($.trim($modal.find('#returnReasonItem').data('returnaddress-city')));
						
						$modal.show();
						sandbox.validation.reset( $modal.dialog.find('form'));

						sandbox.getComponents('component_select', {context:$modal.dialog}, function(i){
							this.addEvent('change', function(val, $selected, index){
								if($(this).attr('name') == 'accountCode'){
									$(this).closest('.input-btn-group').find('input[name=accountName]').val($selected.text());
								}
								Method.updatePaymentInfo( false );
							});
						});

						sandbox.moduleEventInjection(data, defer);

						Method.$itemList = $modal.dialog.find('[data-return-reason-list]>ul');

						return defer.promise();
					}).then(function(data){
						// UIkit.modal.alert("취소 되었습니다.").on('hide.uk.modal', function() {
						// 	window.location.reload();
						// });
					}).fail(function(error){
						// if(error){
						// 	UIkit.modal.alert(error).on('hide.uk.modal', function() {
						// 		window.location.reload();
						// 	});
						// }else{
						// 	window.location.reload();
						// }
					});
				// });
			},

			// 아이템 단위로 수량 선택할 수 있는 select 노출 처리
			showHideAvailabeQuantity:function( $checkbox ){
				var $cancelQuantity = $checkbox.closest('li').find('[return-reason-partials-quantity]');
				if( $checkbox.prop('checked')){
					$cancelQuantity.slideDown('fast');
				}else{
					$cancelQuantity.slideUp('fast');
				}
			},

			// 부분 반품 가능 여부에 따른 정보 노출 처리
			updateInfoByIsPartial:function( $bool ){
				var $checkAllContainer = Method.$popModal.dialog.find('.container.check-all');
				var $checkboxs = Method.$itemList.find('.checkbox');
				var $info = Method.$popModal.dialog.find('[data-info-text]');

				if( $bool ){
					$checkAllContainer.show();
					$checkboxs.show();
					$info.show();
					Method.$popSubmitBtn.text('선택상품 주문 반품');
				}else{
					$checkAllContainer.hide();
					$checkboxs.hide();
					$info.hide();
					Method.$popSubmitBtn.text('주문 반품');
				}
			},

			// 체크 여부에 따른 리턴 버튼 활성화 처리
			updateRetunBtnStatus:function(){
				var isChecked =  Method.$that.find('[data-return-order]').find('[data-return-order-list]').find('input[type="checkbox"]').is(':checked');
				if( isChecked ){
					Method.$returnBtn.removeAttr('disabled').removeClass('disabled');
					Method.$returnBtn.text('부분 반품하기');
				}else{
					Method.$returnBtn.attr('disabled','true').addClass('disabled');
					Method.$returnBtn.text('부분 반품할 상품을 선택해주세요');
				}
			},

			// modal에서 전체 선텍
			changeAllCheck:function(e){
				var isCheck = $(this).prop('checked');

				// console.log('Method.$itemList : ', Method.$itemList.find('>li'))

				Method.$itemList.find('>li').each( function(){
					$(this).find('input[type="checkbox"]').prop( 'checked', isCheck );
					if( isCheck ){
						// 전체 수량을 선택 시켜 노출
						$(this).find('select[name="quantity"]').val( $(this).find('[data-quantity]').text()).trigger('update');
					}
					Method.showHideAvailabeQuantity( $(this).find('input[type="checkbox"]') );
				});
				Method.updateStatusChecked();

				if (Method.isCheckeds) {
					Method.updatePaymentInfo( false );
					Method.isCheckeds = false;
				}
			},

			// modal에서 체크박스 선택시
			changeItemCheck:function(e){
				Method.showHideAvailabeQuantity( $(this ));
				// Method.updateCheckAll();

				Method.updateStatusChecked();
				if (Method.isCheckeds) {
					Method.updatePaymentInfo( false );
					Method.isCheckeds = false;
				}
			},

			// 아이템 체크박스 변경시 전체 선택 체크박스 상태처리
			updateCheckAll:function(){
				if( Method.$itemList.find('>li').length == Method.$itemList.find('>li').find('input[type="checkbox"]:checked').length ){
					Method.$allCheck.prop( 'checked', true );
				}else{
					Method.$allCheck.prop( 'checked', false );
				}
			},

			// 리턴 상황에 따른 가격정보와
			updatePaymentInfo:function( $bool ){
				var $paymentContainer = Method.$popModal.find('[data-payment-conatiner]');
				$paymentContainer.hide();

				if( $bool ){
					$paymentContainer.show();
					Method.$popCuntBtn.hide();
				}else{
					$paymentContainer.hide();
					Method.$popCuntBtn.show();
				}
			},

			updateStatusChecked:function(){
				var $modal = Method.$popModal;
				// 부분반품이 가능한 경우
				if( Method.isAblePartialVoid ){
					var $items = Method.$itemList.find('>li').find('input[type="checkbox"]:checked').closest('li');
				}else{
					var $items = Method.$itemList.find('>li');
				}

				if( $items.length > 0 ){
					if (Method.isDoubleClickFlag) {
						Method.updateSubmitBtn( true ); // 체크박스 선택 가능
						Method.isDoubleClickFlag = false;
					}
				} else {
					// 아이템 없을때
					// 부분 취소, 반품 가능 여부
					var isablepartial = true;

					if (!isablepartial) {
						Method.updateSubmitBtn( true );
					} else {
						if (!Method.isDoubleClickFlag) {
							Method.updateSubmitBtn( false ); // 체크박스 선택 불가능
							Method.isDoubleClickFlag = true;
						}
					}
				}
			},
			checkHasEmojiReturnReason:function(){
				if (sandbox.utils.has.hasEmojis(Method.$popModal.dialog.find('form').find('input[name="reason"]').val())) {
					sandbox.ui.modal.alert('반품 사유에 이모지를 사용 할 수 없습니다.');
					return false;
				}
				return true;
			},
			// 버튼 활성화/비활성화 처리
			updateSubmitBtn:function( $bool ){
				var $paymentContainer = Method.$popModal.find('[data-payment-conatiner]');

				var _bool = [];
				Method.$popModal.find('[data-return-reason-list]>ul>li').each( function(){
					_bool.push($(this).find('input[type="checkbox"]').attr('disabled') == 'disabled')
				});
				var _disabledCheck = _.every(_bool, Boolean); // true

				if (_disabledCheck) {
					Method.$allCheck.attr('disabled', true).closest('.input-checkbox').addClass('disabled');
				} else {
					Method.$allCheck.attr('disabled', false).closest('.input-checkbox').removeClass('disabled');
				}

				if ($bool) {
					$paymentContainer.hide();
					Method.$popCuntBtn.show();

					// 총 결제금액 버튼
					Method.$popCuntBtn.on('click', function (e) {
						e.preventDefault();
						var $modalForm = Method.$popModal.dialog.find('form');
						sandbox.validation.validate($modalForm);
						if( sandbox.validation.isValid($modalForm)){
							if (!Method.checkHasEmojiReturnReason()) {
								return false;
							}
							Method.updatePaymentInfo(true);
							Method.updateStatus();
						}
					});

					Method.$popSubmitBtn.removeAttr('disabled').removeClass('disabled');
					Method.$popCuntBtn.removeAttr('disabled').removeClass('disabled');
				} else {
					// console.log('버튼 활성화/비활성화 처리 false')
					Method.$popSubmitBtn.attr('disabled','true').addClass('disabled');
					Method.$popCuntBtn.attr('disabled', 'true').addClass('disabled');
					Method.$popCuntBtn.off();
				}
			},

			// 취소 가격 및 추가 정보 입력 여부 처리
			updateStatus:function(){
				//console.log('updateStatus');
				var $modal = Method.$popModal;

				if( Method.isAblePartialVoid ){
					var $items = Method.$itemList.find('li').find('input[type="checkbox"]:checked').closest('li');
				} else {
					var $items = Method.$itemList.find('li');
				}

				var $form = $modal.dialog.find('form');
				var action = $form.attr('action') + '/calculator';
				var $itemForm = Method.getFormByPartialItem( $items );
				var param = $itemForm.serialize() + '&' + $form.serialize();

				if( Method.isAblePartialVoid ){
					if( !Method.getIsAvailablePartialReturn()){
						param += '&entireReturn=true';
					}
				}else{
					param += '&entireReturn=true';
				}

				// console.log('param--', param)
				Core.Utils.ajax( action, 'POST', param, function(data){

					var data = sandbox.rtnJson(data.responseText, true);
					var $paymentList = $modal.find('[data-payment-list]');
					var $paymentItem = $modal.find('.uk-hidden[data-payment-item]');
					$paymentList.empty();

					if( !data ){
						var $newItem = Method.getReplacePaymentItem( $paymentItem, '서버 통신 오류' );
						$newItem.appendTo( $paymentList );
					}

					var result = data.result;

					if( result == true ){
            			// 주문아이템총액
            			var totalItemAmount = data.ro.totalItemAmount;

            			// 반품 배송비
            			var returnFgChargeFeeTotal = data.ro.returnFulfillmentFee;

            			// 추가 배송비
            			var parentFgChargeFeeTotal = data.ro.originFulfillmentChargeFee;

            			// 주문 배송비
            			var parentFgFeeTotal = data.ro.originRefundableFulfillmentFee;

						// 총 환불 예정 금액
						var refundAmountTotal = data.ro.totalRefundableAmount.amount;
						var refundAmountTotalReplace = String(refundAmountTotal).replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');

            			// 결제수단
            			var originPaymentMethod = data.ro.originPaymentMethod;

            			$('.retu-pop-header>.panel-box').html('환불예정금액 (' + originPaymentMethod + ') <span>' + refundAmountTotalReplace + ' 원</span>');

                        // 결제 정보
                        if( totalItemAmount != null
                          || parentFgFeeTotal != null
                          || parentFgChargeFeeTotal != null
                          || returnFgChargeFeeTotal != null ) {

							// 주문아이템총액
							if( totalItemAmount != null && totalItemAmount.amount > 0 ){
								var $newItem = Method.getReplacePaymentItem( $paymentItem, "상품금액 합계 : ", totalItemAmount.amount );
								$newItem.appendTo( $paymentList );
							}

							// 주문 배송비
							if( parentFgFeeTotal != null && parentFgFeeTotal.amount > 0 ){
								var $newItem = Method.getReplacePaymentItem( $paymentItem, "주문 배송비 : ", parentFgFeeTotal.amount );
								$newItem.appendTo( $paymentList );
 							} else{
								var $newItem = Method.getReplacePaymentItem( $paymentItem, "주문 배송비 : ", '' );
								$newItem.appendTo( $paymentList );
 							}

							// 추가 배송비
							if( parentFgChargeFeeTotal != null && parentFgChargeFeeTotal.amount > 0 ){
								var $newItem = Method.getReplacePaymentItem( $paymentItem, "추가 배송비 : ", parentFgChargeFeeTotal.amount );
								$newItem.appendTo( $paymentList );
							}

							// 반품 배송비
							if( returnFgChargeFeeTotal != null && returnFgChargeFeeTotal.amount > 0 ){
		                        var $newItem = Method.getReplacePaymentItem( $paymentItem, "반품 배송비 : ", returnFgChargeFeeTotal.amount );
		                        $newItem.appendTo( $paymentList );
 							} else{
		                        var $newItem = Method.getReplacePaymentItem( $paymentItem, "반품 배송비 : ", '' );
		                        $newItem.appendTo( $paymentList );
 							}
                       } else {
							var $newItem = Method.getReplacePaymentItem( $paymentItem, 'PAYMENTS 정보 오류' );
							$newItem.appendTo( $paymentList );
                        }

						Method.isCheckeds = true;
					}else{
						// var $newItem = Method.getReplacePaymentItem( $paymentItem, data.errorMsg );
						// $newItem.appendTo( $paymentList );
						Method.updatePaymentInfo( false );
						Method.isCheckeds = false;
						UIkit.modal.alert(data.errorMsg).on('hide.uk.modal', function () {
							window.location.reload();
						});
					}
				}, true);
			},

			// 계산 결과 dom 생성
			getReplacePaymentItem:function( $base, type, amount ){
				var $newItem = $base.clone().removeClass("uk-hidden");
				$newItem.find('[data-type]').text( type );
				if( amount ){
					$newItem.find('[data-amount]').text( sandbox.utils.price(amount) );
				}else{
					$newItem.find('[data-amount]').text( sandbox.utils.price(0) );
				}
				return $newItem;
			},

			// 선택된 아이템의 order dom
			getOrderElementByChecked:function($checkbox){
				var $order = $checkbox.closest('[data-return-order]');
				return {
					order : $order,
					allCheckbox : $order.find('input[name="check-all"]'),
					itemList : $order.find('[data-return-order-list]')
				}
			},

			// 배송지 선택으로 주소 입력시
			updateCustomerAddress:function( data ){
				Method.isChangeCustomerAddress = true;
				var $target = Method.$popModal.dialog.find('[data-before-return-address]');
				if( $target.find('[data-user-name]').length > 0 ){
					$target.find('[data-user-name]').html($.trim(data.fullName));
				}

				if( $target.find('[data-phone]').length > 0 ){
					$target.find('[data-phone]').html($.trim(data.phoneNumber));
				}

				if( $target.find('[data-postalCode]').length > 0 ){
					$target.find('[data-postalCode]').html($.trim(data.postalCode));
				}

				if( $target.find('[data-address1]').length > 0 ){
					$target.find('[data-address1]').html($.trim(data.addressLine1));
				}

				if( $target.find('[data-address2]').length > 0 ){
					$target.find('[data-address2]').html($.trim(data.addressLine2));
				}

				// 변경된 값 input 에 적용
				$target.find('input[name="addressId"]').val($.trim(data.id));
				$target.find('input[name="addressFirstName"]').val($.trim(data.fullName));
				$target.find('input[name="addressPhone"]').val($.trim(data.phoneNumber));
				$target.find('input[name="addressLine1"]').val($.trim(data.addressLine1));
				$target.find('input[name="addressLine2"]').val($.trim(data.addressLine2));
				$target.find('input[name="addressPostalCode"]').val($.trim(data.postalCode));
				$target.find('input[name="addressCity"]').val($.trim(data.city));
			},

			// 실제 전송될 주소 정보를 설정하기 위해 불필요 정보 disabled
			updateAddressInput:function(){
				if( Method.$beforeAddress.hasClass('uk-active')){
					Method.isNewAddress = false;
					Method.$beforeAddress.find('input').attr('disabled', false );
					Method.$newAddress.find('input').attr('disabled', true );
				}else{
					Method.isNewAddress = true;
					Method.$beforeAddress.find('input').attr('disabled', true );
					Method.$newAddress.find('input').attr('disabled', false );
				}
			},

			// 선택된 아이템을 하나의 form으로 만들어 리턴
			getFormByPartialItem:function( $items ){
				var $itemForm = $('<form></form>');

				//체크되어있는 아이템 가져와 form에 append
				$items.each( function(){
					var quantity = $(this).find('[name="quantity"]:enabled').val();
					var $newItem = $(this).clone();

					$newItem.find('[name="quantity"]').val(quantity);
					$newItem.appendTo( $itemForm );
				});
				return $itemForm;
			},

			returnOrderSubmit:function(e){
				e.preventDefault();

				var $modalForm = Method.$popModal.dialog.find('form');
				sandbox.validation.validate( $modalForm );

				if( sandbox.validation.isValid( $modalForm )){

					// if (Method.isSearchAddress) {
						if( Method.isNewAddress ){
							if( !Method.deliverySearch.getValidateChk() ){
								UIkit.modal.alert("검색을 통하여 배송지를 입력해주세요.");
								return false;
							}
						}else{
							/*
							// 기본으로 들어가있는 주소는 확인해도 삭제가 불가능하고 새로 선택한 경우에만 검사해서 잘못된 주소를 지운다.
							if (Method.isChangeCustomerAddress) {
								var address1 = Method.$beforeAddress.find('input[name="addressLine1"]').val();
								var addressId = Method.$beforeAddress.find('input[name="addressId"]').val();
								// 최종 주소를 다시 한번 주소 API로 유효성 체크
								var customerAddrssValidationResult = Core.Utils.addressApi.init().isEmpty(address1);
								if (customerAddrssValidationResult) {
									Method.removeWrongAddress(addressId);
									return;
								}
							}
							*/
						}
					// }

					//console.log( $modalForm.attr('action'))
					UIkit.modal.confirm('반품 하시겠습니까?', function(){
						// 주소에 노출된 우편번호 제거
						if( Method.isNewAddress ){
							var $addressLine1 = $modalForm.find('[name="addressLine1"]:visible');
							if( $addressLine1 ){
								var address1 = $addressLine1.val().split(')');
								if( address1.length > 1 ){
									$addressLine1.val( $.trim( address1[1]) );
								}
							}
						}

						if (!Method.checkHasEmojiReturnReason()) {
							return false;
						}

						var isPartial = false;
						var param = '';

						if( Method.isAblePartialVoid ){
							isPartial = true;
							if( !Method.getIsAvailablePartialReturn()){
								isPartial = false;
							}
						}

						// 부분 취소일때는 상품별
						if( isPartial ){
							var $itemForm = Method.getFormByPartialItem( Method.$itemList.find('>li').find('input[type="checkbox"]:checked').closest('li') );
							param = $itemForm.serialize() +'&'+ $modalForm.serialize();
						}else{
							var $itemForm = Method.getFormByPartialItem( Method.$itemList.find('>li'));
							param = $itemForm.serialize() +'&'+ $modalForm.serialize();
							param += '&entireReturn=true';
						}

						// Method.updateSubmitBtn( false );

						Core.Utils.ajax( $modalForm.attr('action'), 'POST', param, function(data){
							var data = sandbox.rtnJson(data.responseText, true);
							var result = data['result'];
							if( result == true ){
								if( _GLOBAL.MARKETING_DATA().useGa == true ){
									var marketingOption = {
										orderType : 'RETURN',
										orderId : data.ro.returnOrderId
									};
									Core.ga.processor( marketingOption );
								}
								UIkit.modal.alert("반품신청이 완료되었습니다.").on('hide.uk.modal', function() {
									window.location.href = sandbox.utils.contextPath + "/account/orders/returned";
								});
							}else{
								UIkit.modal.alert(data['errorMsg']).on('hide.uk.modal', function() {
									window.location.reload();
								});
							}
							//$('.customer-contents').replaceWith($(data.responseText).find('.customer-contents'));

						},true)

					}, function(){},
					{
						labels: {'Ok': '확인', 'Cancel': '취소'}
					});
				}

			},

			// 부분반품 가능 여부 판단
			getIsAvailablePartialReturn:function(){

				var itemList = {};
				var $checkedList = Method.$itemList.find('>li').find('input[type="checkbox"]:checked').closest('li');

				$checkedList.each( function(){
					isAvailable = false;
					var orderItemSize = $(this).find('input[name="orderItemSize"]').val();
					var ableEntireReturn = $(this).find('input[name="ableEntireReturn"]').val();
					var returnableQuantity = $(this).find('input[name="returnableQuantity"]').val();
					var returnedQuantity = $(this).find('input[name="returnedQuantity"]').val();
					var orderId = $(this).find('input[name="orderId"]').val();
					var quantity = $(this).find('[name="quantity"]:not(:disabled)').val();

					if( itemList[orderId] == undefined ){
						itemList[orderId] = {};
						itemList[orderId].ableEntireReturn = ableEntireReturn;
						itemList[orderId].orderItemSize = orderItemSize;
						itemList[orderId].items = [];
					}

					var itemObj = {
						returnedQuantity : Number(returnedQuantity),
						returnableQuantity : Number(returnableQuantity),
						quantity : Number(quantity)
					}

					itemList[orderId].items.push( itemObj );
				})

				//console.log( itemList );

				var isAvailable = false;
				$.each( itemList, function(){
					// 전체 반품이 불가능하거나 현재 주문의 전체 아이템 사이즈와 선택된 아이템 사이즈가 같지 않다면
					// console.log( this.orderItemSize + ' : ' + this.items.length );
					if( this.ableEntireReturn == "false" || this.orderItemSize != this.items.length ){
						//console.log( '전체 반품이 불가능하거나 현재 주문의 전체 아이템 사이즈와 선택된 아이템 사이즈가 같지 않다면')
						isAvailable = true;
					}else{
						$.each( this.items, function(){
							//console.log( this.returnableQuantity + ' : ' + this.quantity);
							if( this.returnedQuantity != 0 || this.returnableQuantity != this.quantity ){
								//console.log('반품된 수량이 있거나 전체 수량이 아닌것 있음');
								isAvailable = true;
								return;
							}
						})
					}

					if( isAvailable == false ){
						//console.log('부분반품 불가능한 order가 있음');
						return false;
					}
				})
				return isAvailable;
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-returnorder]',
					attrName:'data-module-returnorder',
					moduleName:'module_returnorder',
					handler:{
						context:this,
						method:Method.moduleInit
					}
				});
			}
		}
	});
})(Core);