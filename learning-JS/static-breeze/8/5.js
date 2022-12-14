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

				// nike ?????? ?????? ?????? ?????????
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
				//var customModal = UIkit.modal('#custom-modal', {modal:false}); /* CUSTOM ?????? */

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
									//quantity[CURRENT_INDEX].setQuantity(1); //cart modify??? ?????? ?????? ????????? ??????
									quantity[CURRENT_INDEX].setMaxQuantity(quantityState.maxQty);
								}else{
									//quantity.setQuantity(1); //cart modify??? ?????? ?????? ????????? ??????
									quantity.setMaxQuantity(quantityState.maxQty);
								}
							}
						}
					});

					this.addEvent('skuLoadComplete', function(skuData){
						//nike ?????? ????????? ????????? ???????????? ??????????????? ??????
						isSkuLoadComplete = true;

						/* isDefaultSku - true  ( option??? ?????? ?????? )  */
						if(args.isDefaultSku === 'true') defaultSkuSetup(productOption);
					});
				});

				/* ???????????? */
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

				// ???????????? ??????????????? ??????
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

				/* CUSTOM ?????? */

				/* cart Update */
				/* ????????? ????????? ???????????? ?????? ???????????? (Staging Only). */
				/*
					$('.flag-sameday').eq(0).html($.cookie('AMCV_F0935E09512D2C270A490D4D@AdobeOrg'))
					document.oncontextmenu=function(){return true;} // ????????? ??????
					document.onselectstart=function(){return true;} // ????????? ??????
				/* --------------------------------------*/

				//@pck 2020-10-22 sticky v2 ????????? ?????? ???????????? ?????? (????????????)
				/*
				// ^ ?????? ????????? toggle
				function updown_turn(){
						$("#pdp_optionsize_updown").toggleClass('uk-active');
						$(".box_popupdown").toggleClass('uk-active');
				}

				// ^ ?????? ????????? ?????? ?????????
				$("#pdp_optionsize_updown").click(function(){
                 	$("#pdp_optionsize_sticky").toggle();
					updown_turn();
				});
				*/

				$('[data-add-item]').each(function(i){
					var INDEX = i;
					// wishlist??? ???????????? ????????? ??????
					// .sticky_notifyme ????????? ????????? ???????????? ??????..
					$(this).find('.btn-link:not(".wish-btn")').click(function(e){
						//@pck 2020-10-22 sticky v2 ????????? ?????? ???????????? ??????  (????????????)
						//sticky  ????????????, ????????????, ?????? ?????? ????????? ?????? ?????? sticky ?????? ??????.
						//????????? #btn_sticky_notifyme ???????????? ??????..
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

							/* ????????? ?????? ?????? */
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
								?????? channel sessionStorage
								 - channel : ????????? ?????? ?????? ??????
								 - pid : ?????? ?????? code ( productId, style Code, UPC.... )

								????????? ????????? URL??? channel, pid ??? ????????? ????????? ?????? ??????.
								channel ??? ?????????????????? ?????? ????????? channel ????????? ????????????
								channel??? pid ?????? ???????????? ?????? ????????? channel ????????? ????????????.
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

							/* CUSTOM _customproduct.js ?????? ?????? */
							Core.Utils.customProduct.addItemRequest(itemRequest);

							Core.Loading.show();
							switch(actionType){
								case 'externalLink' :
									//????????????
									window.location.href = url;
									break;
								case 'custombuy' :
									Core.Loading.hide();
									var customVal = Core.Utils.customProduct.getCustomBuyVal();
									if(customVal != null && customVal != 'undefined'){
										UIkit.modal.confirm('??????????????? ???????????? ????????? ???????????? "'+ customVal +'"?????????.', function(){
											Core.Loading.show();
											BLC.ajax({
												url:url,
												type:"POST",
												dataType:"json",
												data:itemRequest,
												error: function(data){
													Core.Loading.hide();
													UIkit.modal.alert('???????????? ?????? ???????????? ????????????. ?????? ??????????????????.');
													//BLC.defaultErrorHandler(data);
												}
											}, function(data, extraData){
												if(commonModal.active) commonModal.hide();
												if(data.error){
													Core.Loading.hide();
													UIkit.modal.alert(data.error);
													//UIkit.modal.alert('???????????? ???????????????.');
												}else {
													_.delay(function () {
														window.location.assign(sandbox.utils.contextPath + '/checkout');
													}, 500);
												}
											});
										}, function(){},
										{
											labels: {'Ok': '??????', 'Cancel': '??????'}
										});
									} else{
										UIkit.modal.confirm('?????????????????? ????????? ???????????? ???????????? ??????????????????. ????????? ?????????????????????????', function(){
											Core.Loading.show();
											BLC.ajax({
												url:url,
												type:"POST",
												dataType:"json",
												data:itemRequest,
												error: function(data){
													Core.Loading.hide();
													UIkit.modal.alert('???????????? ?????? ???????????? ????????????. ?????? ??????????????????.');
													//BLC.defaultErrorHandler(data);
												}
											}, function(data, extraData){
												if(commonModal.active) commonModal.hide();
												if(data.error){
													Core.Loading.hide();
													UIkit.modal.alert(data.error);
													//UIkit.modal.alert('???????????? ???????????????.');
												}else {
													_.delay(function () {
														window.location.assign(sandbox.utils.contextPath + '/checkout');
													}, 500);
												}
											});
										}, function(){},
										{
											labels: {'Ok': '??????', 'Cancel': '??????'}
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
											UIkit.modal.alert('???????????? ?????? ???????????? ????????????. ?????? ??????????????????.');
											//BLC.defaultErrorHandler(data);
										}
									}, function(data, extraData){
										if(commonModal.active) commonModal.hide();
										if(data.error){
											Core.Loading.hide();
											UIkit.modal.alert(data.error);
											//UIkit.modal.alert('???????????? ???????????????.');
										}else{
											var cartData = $.extend( data, {productId : productId, quantity : itemRequest.quantity, skuId : skuId });
											if(actionType === 'add'){
												miniCartModule.update( function( callbackData ){
													if( callbackData != null ){
														cartData.cartId = callbackData.cartId

														$('#pdp_optionsize_updown').trigger('click');   //????????? ????????? ?????????.
													}
													endPoint.call('addToCart', cartData );


													//EMB productPrice ??? ???????????? ???????????? ?????????
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
												// ????????? ?????? ?????? confirm

												// ?????? ???????????? ????????? ?????? ?????? ??? ??????????????? ???????????? ??????
												miniCartModule.update( function( callbackData ){
													return {'confirm': true};
												});

												// ????????? ??????. ???????????? ????????? ??????
												UIkit.modal.confirm('??????????????? ???????????????.', function(){
													_.delay(function(){
														window.location.assign( sandbox.utils.contextPath + '/cart' );
													}, 500);
												}, function(){
													UIkit.modal('#common-modal').hide()
												},
												{
													labels: { 'Ok': '???????????? ??????', 'Cancel': '?????? ????????????' }
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

				//PDP ?????? ?????? ?????? ????????? : ????????? ????????? ?????? ??????
				var summaryScrollController = sandbox.scrollController(window, document, function(per, scrollTop){
					if(sandbox.reSize.getState() === 'pc'){
						if($galleryWrap.height() > $optionWrap.height() && $optionWrap.height() + optionWrapOffsetTop > $(window).height()){

							var galleryHeight = $galleryWrap.height();
							var detailHeight = $productDetailWrap.height();

							//???????????? ???????????? ????????? ????????? ??????
							if( scrollTop > optionWrapOffsetTop + $optionWrap.height() - $(window).height() && scrollTop < optionWrapOffsetTop + galleryHeight - $(window).height() ){
								!$optionWrap.hasClass("fixed") && $optionWrap.removeClass('fixed absolute bottom top').removeAttr("style").addClass('fixed bottom');
							}
							//???????????? ???????????? ???????????? ???
							else if( scrollTop >= optionWrapOffsetTop + galleryHeight - $(window).height() ){
								!$optionWrap.hasClass("absolute") && $optionWrap.removeClass('fixed absolute bottom top').removeAttr("style").addClass('absolute').css("bottom", detailHeight - galleryHeight + "px");
							}
							//???????????? ???????????? ???????????? ???
							else if( scrollTop <= optionWrapOffsetTop + $optionWrap.height() - $(window).height() ){
								!$optionWrap.hasClass("top") && $optionWrap.removeClass('fixed absolute bottom top').removeAttr("style").addClass('absolute top');
							}
							else {
							    $optionWrap.removeClass('fixed absolute bottom top').removeAttr("style");
							}




						} else {
							//???????????? ????????? ?????? ?????? ????????? ?????? ?????? ??????????????? ??? ?????? ?????? ??????
							$optionWrap.removeClass('fixed absolute bottom top').removeAttr("style");
						}
					}
					//????????? ???/?????? ????????? ?????? ?????? ????????? ?????? ??????
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

				//PDP summary?????? ?????? ????????? ????????? ????????? ????????? ????????? ??????.
				if($this.find('[data-long-description]').attr('data-long-description')){
					var html = $.parseHTML($this.find('[data-long-description]').attr('data-long-description'));
					$(html).find('div.imgArea').remove().find('script').remove();
				//	$this.find('#pdp-description-summary').empty().append(html);
				}

        		//?????? ?????? ????????? ?????? ???????????? (????????????, ????????????)
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
								//?????? ?????? ????????? ??????????????? ???????????? ?????? ????????? ??????????????? ??????.
								//?????? ?????? ????????? ????????? 2???????????? ???????????? multi-line ellipsis ?????? ??????.
								$descriptionWrap.find('.sectionR > ul:gt(2)').each(function(){
									$(this).hide();
									$(this).prev("h3") && $(this).prev("h3").hide();
								});
							}

						}
					}
				});

				//1 on 1 ????????? ??? ?????? ?????? ??????. ????????? ?????? ????????? porduct1on1??? true??? ???????????? PDP ?????? ???????????? ?????????.
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
					validateChk = sandbox.utils.getValidateChk(productOption, '???????????? ????????? ?????????.');
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