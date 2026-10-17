/************************************************************************
 Global variables and setting that application uses
************************************************************************/

/* We first check if canvas supported */
if ( Modernizr.canvas ) {
	var canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d');
}

/**
 * There is a new attribute 'download' on anchors that
 * allows to enforce the download of a resource on 'href'
 *
 * See: http://developers.whatwg.org/links.html#downloading-resources
 * Talk: https://github.com/andrewckor/Noise-texture-generator/issues/1
 *
 * If this is not supported, as a fallback have the previous behaviour
 */
var neatDownload = ('download' in document.createElement('a'));

/* We check if localStorage supported to increase the usability and app memory */
var localStorageExists = Modernizr.localstorage;


/************************************************************************
 Main function for generating the noise
************************************************************************/
var generateNoise = function(opacity, density) {

	if ( ! Modernizr.canvas ) {
		return false;
	}
	var x, y,
	 	r, g, b,
	    opacity = opacity,
	    density = Math.floor(density) || 1;

	canvas.width = parseInt($('.x_size_input').val());
	canvas.height = parseInt($('.y_size_input').val());

	/*
	ctx.fillStyle = '#' + $('.color_input').val();
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	*/

	for ( x = 0; x < canvas.width; x += density ) {
		for ( y = 0; y < canvas.height; y += density ) {

			number = Math.floor( Math.random() * 256 );
			ctx.fillStyle = 'rgba(' + number + ',' + number + ',' + number + ',' + opacity + ')';
			ctx.fillRect(x, y, 1, 1);

		}
	}

	$('.final_noise').css('background','url(' + canvas.toDataURL('image/png') + ') center center repeat #' + $('.color_input').val() );

	if (typeof applyNoise == 'function') {
		applyNoise();
	}
}



/************************************************************************
 A plugin that applies custom checkbox on each checkbox
************************************************************************/

$.fn.toCustomCheckbox = function() {

	var theCheckboxes = this;

	theCheckboxes.each(function(){
		/* We cache $(this) */
		var $this = $(this);

		/* We wrap checkbox with a span*/
		$this.wrap('<span>');

		/* We cache the parent */
		var customCheckbox = $this.parent();

		/* We apply the class of custom checkbox */
		customCheckbox.addClass('custom-checkbox').css({'position' : 'relative', 'overflow' : 'hidden'});

		/* We style the real checkbox to behave as hidden */
		$this.css({
			'position'	: 'absolute',
			'top'		: 0,
			'right'		: 0,
			'bottom'	: 0,
			'left' 		: 0,
			'opacity'	: 0
		});

		if( $this.is(':checked') ){
			customCheckbox.addClass('is-checked');
		}

		/* We set the change state functionality */
		$this.on('change',function(){
			customCheckbox.toggleClass('is-checked');
		});

	});

	/* We return the input to enable chaining */
	return this;
};




/************************************************************************
 Noise slider
************************************************************************/

/* Define the sliders of the app */
var sliderMain = $( "#slider" ),
	sliderDensity = $( "#slider-dens" );

var currentSchemaVersion = '2.1b';

/* Default Settings for the app */
var settings = {
	opacity			:	0.05,
	density			:	1,
	color 			:	'f34379',
	width 			:	$('.x_size_input').val(),
	height 			:	$('.y_size_input').val(),
	transparency 	:	$('#transparent-noise').is(':checked') ? true : false,
	fileprefix		: 	'noisy-texture',
	forcedownload	:   false, // Force base64 file download
	schemaversion	:   currentSchemaVersion,
};

if ( localStorageExists ) {

	var ls = window.localStorage;

	if ( ls.getItem('settings') ){

		oldSettings = JSON.parse( ls.getItem('settings') );

		// Migrate settings to new schema if needed
		if ( typeof oldSettings.schemaversion === 'undefined' ||
		     oldSettings.schemaversion !== currentSchemaVersion
		) {
			// Add new settings with default values
			for ( var prop in settings ) {
				if ( typeof oldSettings[prop] === 'undefined' ) {
					oldSettings[prop] = settings[prop];
				}
			}
			oldSettings.schemaversion = currentSchemaVersion;
			ls.setItem('settings', JSON.stringify(oldSettings) );

		}

		settings = oldSettings;

	}else{

		ls.setItem('settings', JSON.stringify(settings) );
	}

}

/* Enable jQueryUI for the main slider */
sliderMain.slider({
		range: "min",
		value: settings.opacity,
		min: 0,
		max: 1,
		step: 0.01,
		slide: function( event, ui ) {
			generateNoise( ui.value, sliderDensity.slider('value') );
			setSettings('opacity', ui.value);
		}
});


/* Enable jQueryUI for the density slider */
sliderDensity.slider({
		range: "min",
		value: settings.density,
		min: 1,
		max: 10,
		step: 0.1,
		slide: function( event, ui ) {
			generateNoise( sliderMain.slider('value'), ui.value);
			setSettings('density', ui.value)
		}
});


/* We set the default values from settings */
$('.color_input').val(settings.color);
$('.x_size_input').val(settings.width);
$('.y_size_input').val(settings.height);
if( settings.transparency ){
	$('#transparent-noise').attr('checked', true);
}

/* Enable colopicker */
$('.color_input').ColorPicker({
	color: '#' + settings.color,
	onShow: function (colpkr) {
		$(colpkr).fadeIn(500);
		return false;
	},
	onHide: function (colpkr) {
		$(colpkr).fadeOut(500);
		return false;
	},
	onChange: function (hsb, hex, rgb) {
		$('.color_input').val(hex);
		generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
		setSettings('color', hex);
	}
});

/* We trach the color change */
$('.color_input').on('change', function(){
	generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
	setSettings('color', $(this).val());
	var thisValue = $(this).val();
	$(this).val(thisValue);
});

/* We trach the color typing */
$('.color_input').on('keyup', function(){
	generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
	setSettings('color', $(this).val());
});

/* When the page loads, the function runs for first time */
generateNoise( sliderMain.slider('value'), sliderDensity.slider('value') );


/* Check if the user type the canvas size inside the desirable limits */
$('.x_size_input').on('keyup', function(){

	var currentValue = $(this).val();

	if( parseInt(currentValue) > 300 ){

		$(this).val('300');
		generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
		setSettings('width', 300);

	}else if( parseInt(currentValue) < 0 ){

		$(this).val('30');
		generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
		setSettings('width', 30);

	}


});


/* Check if the user type the canvas size inside the desirable limits */
$('.y_size_input').on('keyup', function(){

	var currentValue = $(this).val();
	if( parseInt(currentValue) > 300 ){

		$(this).val('300');
		generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
		setSettings('height', 300);

	}else if( parseInt(currentValue) < 0 ){

		$(this).val('30');
		generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
		setSettings('height', 30);

	}


});


/* If the canvas size change from user, a new canvas generated */
$('.x_size_input').change(function(){

		var currentValue = $(this).val();
		setSettings('width', currentValue);

		if( parseInt(currentValue) > 300 ){

			$(this).val('300');
			generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
			setSettings('width', 300);

		}else if( parseInt(currentValue) < 0 ){

			$(this).val('30');
			generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
			setSettings('width', 30);

		}

		generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
});

$('.y_size_input').change(function(){

		var currentValue = $(this).val();
		setSettings('height', currentValue);

		if( parseInt(currentValue) > 300 ){

			$(this).val('300');
			generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
			setSettings('height', 300);

		}else if( parseInt(currentValue) < 0 ){

			$(this).val('30');
			generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
			setSettings('height', 30);

		}

		generateNoise( sliderMain.slider('value'), sliderMain.slider('value') );
});


/* We set the custom checkboxes */
$('input[type=checkbox]').toCustomCheckbox();
$('#transparent-noise').on('change', function(){
	$(this).is(':checked') ? setSettings('transparency', true) : setSettings('transparency', false);
});



var setSettings = function(key, value){
	if( localStorageExists ){
		settings[key] = value;
		ls.setItem('settings', JSON.stringify(settings) );
	}
};


var applyNoise = function(that){
	var realNoise = new Image();
	realNoise.src = canvas.toDataURL('image/png');

	realNoise.onload = function(){
		var tempCanvas = document.createElement('canvas'),
			tempctx = tempCanvas.getContext('2d');

		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;

		if( ! $('#transparent-noise').is(':checked') ){
			tempctx.fillStyle = '#' + $('.color_input').val();
			tempctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
		}
		tempctx.drawImage(realNoise, 0, 0);

		var dataUrl = tempCanvas.toDataURL('image/png');

		$('.download_button')
			.data('href', dataUrl);

		// Magic
		if( neatDownload ){
			$('.download_button')
				.attr('href', dataUrl)
				// Generate a unique name based on options
				.attr('download',
					settings['fileprefix'] +
					'-' + $('.x_size_input').val() + 'x' + $('.y_size_input').val() +
					'-o' + sliderMain.slider('value') * 100 +
					'-d' + sliderDensity.slider('value') * 10 +
					'-c-' + $('.color_input').val() +
					'-t' + ($('#transparent-noise').is(':checked')?1:0) +
					'.png'
				);
		} else if ( that ) {
			// Experimental feature to force file download of base64 data (Off by default)
			if ( settings['forcedownload'] ) {
				var burl = dataUrl.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
				location.href = burl;
			} else {
				window.location = $('.download_button').data('href');
			}
		}
	};
};


$('#transparent-noise').on('change',function(){
	applyNoise();
});

applyNoise();

// Check on the start of file for neatDownload
if ( !neatDownload ) {
	$('.download_button').on('click', function(e){
		applyNoise(this);
		e.preventDefault();
	});
}
