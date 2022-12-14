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

						// ???????????? ?????????
						var param = {};
						var	index = $('a[productcategory]').index(this);
						param.productcategory = $(this).attr('productcategory');  //???????????? ??????
						param.product_id = $("input[name='productmodel']").eq(index).val();  // ?????????

						endPoint.call('crossSaleClick', param);

						window.location.href = $(this).attr('href') + '?fm=cs';

					} else if( $(this).closest(".customer-order").find('.product-item').length > 0 ){
						// ??????????????? ?????????
						endPoint.call('wishlistClick');
						window.location.href = $(this).attr('href');
					}

					else{
						// ?????? ???????????? ??????????????? false??? ?????? ???
						var isRequiredLogin = $(this).data('required-login') || false;
						if(isRequiredLogin){
							$('#login-info-modal').find('[data-link-target]').attr('href', Core.Utils.contextPath+'/login?successUrl='+String($(this).attr('href')).replace(Core.Utils.contextPath,''));
							Core.ui.modal.open('login-info-modal', { modal:false});
							return;
						}

						// @pck 2020-11-26 ?????? reinit ??? ??? ?????? ??????????????? args??? ????????? ??? ???????????? ?????? ?????????
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
						window.location.href = $(this).attr('href');
					}
				});

				// PW ????????? NOTIFY ME ?????? ??????
				/*
				* @pck 2021-02-16 SNKRS _launchcategory.js ?????? ?????????
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

				// @pck 2020-11-18 ?????? ??? ?????? ????????? ?????? ?????? *snkrs upcoming?????? list item?????? ????????? ?????? ?????? ?????? ??????
				$this.find('[data-tag-pw-rank-product-id]').click(function(e){
					// Tagging ?????? ????????? array ??????
					listElements = 	document.querySelectorAll('[data-tag-pw-list] [data-tag-pw-list-item]').length > 0 ?
						document.querySelectorAll('[data-tag-pw-list] [data-tag-pw-list-item]') : null;

					var tagPWRankProductId = this.dataset.tagPwRankProductId; //???????????? ?????? ??? ????????? data-tag-pw-rank-product-id=MODEL_ID ?????? ???

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