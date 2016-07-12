//-----------------------------------------------------------
//
//  Configuration loading from config folder
//
//-----------------------------------------------------------

/// Global lsd configuration object
window.lsd_config = window.lsd_config || {};

/// Load the config file, and insert into lsd_config
///
/// @param   URI to the JSON file to load
/// @param   Storage name in lsd_config
///
/// @return  Promise object for the loaded data
function lsd_loadConfigFile(filePath, configPath) {
	return new Promise(function(resolve, reject) {
		$.getJSON(filePath, {}, function(data) {
			if(data != null) {
				lsd_config[configPath] = data;
				resolve(data);
			} else {
				throw ("Missing filePath data : "+filePath);
			}
		});
	});
}

/// Load the config file set, where file name and storage name is same
///
/// @param   Array of configuration name to load
///
/// @return  Promise object for the loaded data
function lsd_loadConfigSet(nameArray) {
	var promises = [];
	nameArray.forEach(function(name) {
		promises.push(
			lsd_loadConfigFile("./config/"+name+".json", name)
		);
	});
	return Promise.all(promises);
}

/// Load the entire predefined configuration set
function lsd_loadAllConfig() {
	return lsd_loadConfigSet(["filter"]).then(function(config) {
		lsd_config._cached = true;
	});
}

/// Load the cached config, else throw an exception
function lsd_cachedConfig() {
	if( lsd_config._cached ) {
		return lsd_config;
	}
	throw "Invalid call : Config is not yet loaded / cached";
}

//-----------------------------------------------------------
//
//  Filter selection handling
//
//-----------------------------------------------------------

///
/// Setup the filter button, and its interection
///
/// @param  jquery dom, or search selector of the button
/// @param  on change function responder
///
function lsd_setupFilterButton(jqButton, changeFunction) {
	jqButton = $(jqButton);
	jqButton.click(function() {
		// Get the current selection status and flips it
		var selected = !(jqButton.hasClass("selected"));
		
		if( selected ) {
			jqButton.addClass("selected");
			jqButton.find(".material-icons").html("check_box");
		} else {
			jqButton.removeClass("selected");
			jqButton.find(".material-icons").html("check_box_outline_blank");
		}
		
		if( changeFunction ) {
			changeFunction(selected);
		}
	});
}

function lsd_loadFilterFromConfig() {
	lsd_cachedConfig();
}

//-----------------------------------------------------------
//
//  Global on start running
//
//-----------------------------------------------------------
$(function() {
	lsd_loadAllConfig().then(function(config) {
		lsd_loadFilterFromConfig();
	});
});
