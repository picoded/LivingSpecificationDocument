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
	return lsd_loadConfigSet(["proj", "filter", "section"]).then(function(config) {
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
//  State mapping handling
//
//-----------------------------------------------------------

/// Global lsd configuration object
window.lsd_state = window.lsd_state || {};
lsd_state.filter = lsd_state.filter || {};

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
/// @param  indicate if change function should be called once on setup.
///
function lsd_setupFilterButton(jqButton, changeFunction, callChangeOnSetup) {
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
	
	if( callChangeOnSetup && changeFunction ) {
		changeFunction( (jqButton.hasClass("selected")) );
	}
}

/// 
/// Creates the filter button, and returns it
///
/// @param  Object which represents a single filter option
///
/// @return  The JQ Dom node of the generated HTML
///
function lsd_createFilterButtonHtml(filterObj) {
	// null object safety
	filterObj = filterObj || {}; 
	
	// Generate the JQuery dom
	var jqButton = $('<button type="button" class="list-group-item"><i class="material-icons">check_box_outline_blank</i>'+filterObj.name+'</button>');
	
	// Apply auto selected if needed
	if( filterObj.default == true ) {
		jqButton.addClass("selected");
		jqButton.find(".material-icons").html("check_box");
	}
	
	// Add the filter button class
	jqButton.addClass("filterBtn_"+lsd_alphaNumericOnly(filterObj.name));
	
	// Return the JQ object
	return jqButton;
}

///
/// Create and setup the filter set
///
/// @param  Filter set object
///
/// @return  The JQ Dom node of the generated HTML
///
function lsd_createFilterSet(filterSetObj) {
	// null object safety
	filterSetObj = filterSetObj || {}; 
	
	// Generate the JQ dom
	var jqSet = $('<div class="lsd_filterSet"><h2>'+filterSetObj.name+'</h2><div class="list-group"></div></div>');
	var childWrapper = jqSet.find(".list-group");
	
	// Add the filter set class
	jqSet.addClass("filterSet_"+lsd_alphaNumericOnly(filterSetObj.name));
	
	var filterList = filterSetObj.filters || [];
	filterList.forEach(function(filterObj) {
		var filterButton = lsd_createFilterButtonHtml(filterObj);
		lsd_setupFilterButton(filterButton, function(status) {
			lsd_state.filter[filterObj.name] = status;
		}, true);
		childWrapper.append(filterButton);
	});
	
	return jqSet;
}

///
/// Load the project title from config
///
function lsd_loadProjTitle() {
	$("#lsd_title").html(lsd_config.proj.title);
	$("title").html(lsd_config.proj.title);
}

///
/// Does the initial setup from config
///
function lsd_setupFilterFromConfig() {
	// Safety check
	lsd_cachedConfig(); 
	
	// The project title
	lsd_loadProjTitle();
	
	// Filter panel
	var wrapper = $("#lsd_dynFilterBox");
	wrapper.html(""); //clear any existing content
	(lsd_config.filter || []).forEach(function(filterSetObj){
		wrapper.append( lsd_createFilterSet(filterSetObj) );
	});
}

//-----------------------------------------------------------
//
//  Section navigator 
//
//-----------------------------------------------------------

/// 
/// Creates the filter button, and returns it
///
/// @param  Object which represents a single filter option
/// @param  Depth of the section level
///
/// @return  The JQ Dom node of the generated HTML
///
function lsd_createNavButtonHtml(navObj, navLevel) {
	// null object safety
	navObj = navObj || {}; 
	
	// Generate the JQuery dom
	var jqButton = $('<button type="button" class="list-group-item">'+navObj.name+'</button>');
	
	// disable from NAV
	if( navObj.disableNav ) {
		jqButton.style("display","none");
	}
	
	// Add the NAV button class name and level
	jqButton.addClass("navBtn_"+navObj.name);
	jqButton.addClass("navLvl_"+navLevel);
	
	// Return the JQ object
	return jqButton;
}

///
/// Does the recursive setup of the navigator panel
///
/// @param  The jquery dom to append section buttons to
/// @param  Section object that was used to generate the dom
/// @param  Depth of the section level
///
function lsd_recursiveNavSetup(jqWrap, secObj, level) {
	var btn = lsd_createNavButtonHtml(secObj, level);
	jqWrap.append(btn);
	
	var subsections = secObj.subsections || [];
	subsections.forEach(function(subObj) {
		lsd_recursiveNavSetup(jqWrap, subObj, level+1);
	});
}

///
/// Does the initial setup from config
///
function lsd_setupNavFromConfig() {
	// Safety check
	lsd_cachedConfig();
	
	// Filter panel
	var wrapper = $("#lsd_navBox");
	wrapper.html(""); //clear any existing content
	(lsd_config.section || []).forEach(function(secObj){
		lsd_recursiveNavSetup(wrapper,secObj,0);
	});
}

//-----------------------------------------------------------
//
//  Actual content loading
//
//-----------------------------------------------------------

///
/// Does the recursive content setup inside the wrapper
///
/// @param  The jquery dom to append content to
/// @param  Section object that was used to generate the dom
/// @param  Depth of the section level
///
function lsd_recursiveContentSetup(jqWrap, secObj, level) {
	//var btn = lsd_createNavButtonHtml(secObj, level);
	//jqWrap.append(btn);
	
	var subsections = secObj.subsections || [];
	subsections.forEach(function(subObj) {
		//lsd_recursiveNavSetup(jqWrap, subObj, level+1);
	});
}

///
/// Does the actual content loading
///
function lsd_setupContent() {
	// Safety check
	lsd_cachedConfig();
	
	// Filter panel
	var wrapper = $("#lsd_contentBox");
	wrapper.html(""); //clear any existing content
	(lsd_config.section || []).forEach(function(secObj){
		lsd_recursiveContentSetup(wrapper,secObj,0);
	});
}

//-----------------------------------------------------------
//
//  Global on start running setup
//
//-----------------------------------------------------------

///
/// Refresh and reload everything
///
function lsd_reloadAll() {
	lsd_loadAllConfig().then(function(config) {
		lsd_setupFilterFromConfig();
		lsd_setupNavFromConfig();
		lsd_setupContent();
	});
}

$(function() {
	lsd_reloadAll();
});

//-----------------------------------------------------------
//
//  Utility function
//
//-----------------------------------------------------------

/// @return The filter alpha numeric only value of input (no spaces even)
function lsd_alphaNumericOnly(val) {
	return val.replace( /[^a-zA-Z0-9]/ , "");
}
