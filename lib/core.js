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
		$.get(filePath, {}, function(data) {
			if(data != null) {
				if( jQuery.type(data) === "string" ) {
					// Made the system resistent to code commenting (it isnt perfect though, an AST / custom JSON parser is needed for that)
					data = data.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1');
					lsd_config[configPath] = JSON.parse(data);
				} else {
					lsd_config[configPath] = (data);
				}
				
				resolve(data);
			} else {
				throw ("Missing filePath data : "+filePath);
			}
		}, "text");
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

///
/// Apply filter state
///
function lsd_applyFilterState() {
	var wrap = $(".lsd_filterStatusBox");
	
	wrap.find(".filter_exists").hide(0, function() {
		for(var key in lsd_state.filter) {
			if( lsd_state.filter[key] ) {
				wrap.find(".filter_"+lsd_alphaNumericOnly(key)).show(0);
			}
		}
	});
	
	
}

function lsd_setupFilterClasses(navObj, jqDom) {
	var hasFilterClass = false;
	var filters = navObj.filters || [];
	filters.forEach(function(filter) {
		hasFilterClass = true;
		jqDom.addClass("filter_"+lsd_alphaNumericOnly(filter));
	});
	if(hasFilterClass) {
		jqDom.addClass("filter_exists");
	} else {
		jqDom.addClass("filter_none");
	}
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
		filterObj.parent = filterList;
		var filterButton = lsd_createFilterButtonHtml(filterObj);
		lsd_setupFilterButton(filterButton, function(status) {
			lsd_state.filter[ lsd_alphaNumericOnly( filterObj.class || filterObj.name ) ] = status;
			
			lsd_applyFilterState();
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
	jqButton.addClass("navBtn_"+lsd_alphaNumericOnly(navObj.name));
	jqButton.addClass("navLvl_"+navLevel);
	
	// Add the filter settings
	lsd_setupFilterClasses(navObj, jqButton);
	
	// Add the nav scrolling support
	jqButton.click(function() {
		lsd_navClickHandling(navObj.name);
	});
	
	// Return the JQ object
	return jqButton;
}

///
/// Handles a navigation button click event
///
/// @param  Relevent name for the navigation
///
function lsd_navClickHandling(name) {
	// Update existing hash
	location.hash = "#"+lsd_alphaNumericOnly(name);
	
	// Scroll to relevent segment
	lsd_scrollToContentName(name);
}

////
/// Load and scroll from hash
///
function lsd_scrollToHash() {
	var hash = location.hash;
	if(hash && hash.length > 0) {
		hash = hash.substring(1);
	}
	
	if(hash && hash.length > 0) {
		lsd_navClickHandling(hash);
	}
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
//  Mark down handling
//
//-----------------------------------------------------------

var lsd_md = new Remarkable({
	html : true,
	breaks : true,
	typographer: true
});

function lsd_markdownToHtml(md) {
	return lsd_md.render(md);
}

//-----------------------------------------------------------
//
//  Actual content loading
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
function lsd_createContentHtml(navObj, navLevel) {
	// null object safety
	navObj = navObj || {}; 
	
	// Generate the JQuery dom
	var jqSection = $('<div class="lsd_sectionBox"></div>');
	
	// Add the NAV button class name and level
	jqSection.addClass("content_"+lsd_alphaNumericOnly(navObj.name));
	jqSection.addClass("contentLvl_"+navLevel);
	jqSection.attr("id", "content_"+lsd_alphaNumericOnly(navObj.name));
	
	// Setup the filters
	lsd_setupFilterClasses(navObj, jqSection);
	
	// Gets and process the title
	var title = navObj.title;
	if( title == null ) {
		title = navObj.name;
	}
	if( title != null && title.length > 0 ) {
		var titleLvl = navLevel + 1;
		var titleDom = $("<h"+titleLvl+" class='lsd_header'>"+navObj.name+"</h"+titleLvl+">");
		jqSection.append(titleDom);
	}
	
	// Get the actual markdown if it exists
	if( navObj.file ) {
		$.get( "./docu-parts/"+navObj.file, {}, function(md) {
			jqSection.append( lsd_markdownToHtml(md) );
		} );
	}
	
	// Return the JQ object
	return jqSection;
}

///
/// Does the recursive content setup inside the wrapper
///
/// @param  The jquery dom to append content to
/// @param  Section object that was used to generate the dom
/// @param  Depth of the section level
///
function lsd_recursiveContentSetup(jqWrap, secObj, level) {
	var cnt = lsd_createContentHtml(secObj, level);
	jqWrap.append(cnt);
	
	var subsections = secObj.subsections || [];
	subsections.forEach(function(subObj) {
		lsd_recursiveContentSetup(jqWrap, subObj, level+1);
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

//
// Scrolls to the content name
//
function lsd_scrollToContentName(name) {
	var body = document.getElementById('body');
	var target = document.getElementById('content_'+lsd_alphaNumericOnly(name));
	var container = document.getElementById("lsd_contentPanel");
	
	if(target) {
		if( $(body).outerWidth() == $(container).outerWidth() ) {
			// Mobile mode? : Scroll the window itself
			window.scrollTo( 0, target.offsetTop - 10 + container.offsetTop );
		} else {
			// Desktop mode? : Scroll the container
			container.scrollTop = target.offsetTop - 10;
		}
	}

	// var scrollTopTarget = $("#content_"+lsd_alphaNumericOnly(name)).offset().top; // - $('#lsd_contentBox').offset().top;
	// console.log(scrollTopTarget);
	// $('#lsd_contentPanel').animate({
	// 	scrollTop: scrollTopTarget
	// }, 2000);
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
		
		lsd_applyFilterState();
	});
}

$(function() {
	lsd_reloadAll();
	
	//
	// Scrolls to the hash point "after" loading 
	//
	// @TODO ? consider optimizing this to listen to a complete setup
	// If we are ever tracking that. 
	// 
	// I mean this is only useful if someone is doing direct changes, 
	// and immediately checking their change result. (ie OODA loop)
	// Which should mean your running this locally. 
	//
	// So 500 ms is plenty, if not tell your boss to replace the computer.
	// I mean seriously, you want to be doing programming on something that slow?
	//
	window.setTimeout(function () {
		lsd_scrollToHash();
	}, 10);
	window.setTimeout(function () {
		lsd_scrollToHash();
	}, 100);
	window.setTimeout(function () {
		lsd_scrollToHash();
	}, 500);
});

//-----------------------------------------------------------
//
//  Utility function
//
//-----------------------------------------------------------

/// @return The filter alpha numeric only value of input (no spaces even)
function lsd_alphaNumericOnly(val) {
	return val.replace( /[^a-zA-Z0-9]/g , "");
}
