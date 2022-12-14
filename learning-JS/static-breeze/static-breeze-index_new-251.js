if (typeof jQuery != 'undefined') {
	$.cookie("USERID", _GLOBAL.CUSTOMER.ID, { path: '/' });
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
		var offset = 350;   // ???????????? ???????????? ???????????? ????????? ??????????
		var duration = 60;   // top?????? ????????????????????? animate ?????? (???????????????, default??? 400. ????????? ????????? 500)

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

		// ?????? ??????????????? ?????????????????? ?????? ???????????? ?????? ????????? ??????
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


		// ?????? submit ??? loding ??????
		$('form').on( 'submit', function(){
			if($(this).attr('data-isLoadingBar') === 'false') return;
			Core.Loading.show();
		});

		// ???????????? ????????? ????????? ??????
		if (_.isFunction($('img[usemap]').rwdImageMaps)) {
			$('img[usemap]').rwdImageMaps();
		}

		/* UIKit modal override */
		UIkit.modal.alert = function(content, options) {
		    var modal = UIkit.modal.dialog(([
		        '<div class="uk-margin uk-modal-content">'+String(content)+'</div>',
		        '<div class="uk-modal-footer uk-text-right"><button class="button small uk-modal-close">??????</button></div>'
		    ]).join(""), UIkit.$.extend({bgclose:false, keyboard:false}, options)).show();
		    return modal;
		};

		UIkit.modal.confirm = function(content, options) {
		    var modal = UIkit.modal.dialog(([
		        '<div class="uk-margin uk-modal-content">'+String(content)+'</div>',
		        '<div class="uk-modal-footer uk-text-right"><button class="button small uk-modal-close">??????</button></div>'
		    ]).join(""), UIkit.$.extend({bgclose:false, keyboard:false}, options)).show();
		    return modal;
		};
	
		// ???????????? ??????????????? ??????????????? ????????? ?????? ???????????????

		if ((String(window.location.pathname).indexOf('/checkout') > -1)) {
			var oldCartId = $.cookie('oldCartId');
			if (oldCartId != 'none' && typeof oldCartId != "undefined" ) {	
				var callRedirect = false;
				var cartId = $("input[name='cartId']").val();
				// ????????? ?????? ????????? ????????? ????????? ????????? - ????????? ?????? ?????? ????????? ????????? ????????? ???
				if (!cartId) { 
					callRedirect = true;
				}else{
					// ????????? ?????? ?????? ?????? ?????? ?????? ?????? ????????? - /checkout/request ??? ????????? ?????? ?????? ??????
					if (cartId == oldCartId) {
						callRedirect = true;
					}
				}
				if (callRedirect){
					Core.Loading.show();
					$('.less-items .redirect').removeClass('uk-hidden');
					// ?????? ??????????????? ??? ?????? adobe analytics ?????? page url??? /request ??? ?????? ?????? ????????? ?????? ?????? ????????? ???????????????
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
		
		
		/* ?????? ???????????? ????????? ???????????? ?????? ??????????????? ????????? ???????????? ????????? */
		
		var e = {},
			d = Core.Utils.url.getCurrentUrl();
		d.replace( new RegExp( "([^?=&]+)(=([^&]*))?", "g" ), function ( g, f, i, h ) {
			e[ f ] = decodeURIComponent(h);
		} );

		var url = e;

		if( url.tftest ){

			// ?????? ????????????
			// localhost:8080/checkout?tftest=true
			$(this).find("div[data-attribute-name='SHOES_SIZE']").find(".input-radio").eq(0).trigger('click');
			/*
			$(".option-wrap:eq(0)").find('[class^="product-option_"]' ).each( function(){

			});
			*/

			// $("[data-brz-components-type]").find("select").find("option:eq(1)").attr("selected", "selected");

			$(".option-wrap:eq(0)").find('.select-box' ).each( function(){
				console.log( $(this));
				console.log( $(this).data("brz-components-type"));
				if( $(this).data("brz-components-type") == "SIZE"){
					console.log( 'update')
					$(this).find("select").find("option:eq(1)").attr("selected", "selected").trigger('change');
				}
			});
			

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

			// ???????????? ?????? ??????
			if( url.email ){
				$('input[name="emailAddress"]').val( url.email );
				$('input[name="phoneNumber"]').val( url.phone );
				//$('[data-order-info-submit-btn]').trigger( 'click' );
			}

			if( url.name ){
				// ????????? ?????? ??????
				$('input[name="address.fullName"]').val( url.name );
				$('input[name="address.phonePrimary.phoneNumber"]').val( url.phone );
				$('input[name="address.addressLine1"]').val( url.addr1 );
				$('input[name="address.addressLine2"]').val( url.addr2 );
				$('input[name="address.postalCode"]').val( url.pcode );
				$('input[name="fulfillmentOptionId"]').eq(0).attr("checked", true);
				//$('[data-order-shipping-submit-btn]').trigger( 'click' );
			}

			if( url.gift ){
				$('input[name="giftCardNumber"]').val( url.gift );
				$('#applyGiftcard_form').submit();
			}

			if( url.complete ){
				$('input[name="isCheckoutAgree"]').prop('checked', true);
				$('[data-checkout-btn]').trigger('click');
			}
		}

		$("[data-issoldout]").each( function( index, data ) {
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
	}
});