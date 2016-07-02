﻿//INK
// Licence: GPL <http://www.gnu.org/licenses/gpl.html>
//------------------------------------------------------------------------------
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//------------------------------------------------------------------------------

#target photoshop

//@include "InkPrinter.jsx"
//@include "ColorUtils.js"
//@include "Ps2CssUtils.js"
//@include "ColorBlender.js"
//@include "Layers.jsx"

//Photoshop CC
$._ext_INK = {
	version : "1.5.6",
	//prints console msg (debug)
	verbose : true,

	//Save and set units settings into this object
	userPrefs : {},

	//Ink settings. (view init() function)
	settings : {},

	//active document
	doc : {},

	//ink folder
	inkFolder : {},
	inkFolderName : "__ink",

	//selections vars
	selectionsFolderName : "selection",

	//temp vars in here
	temp : {},

	//selected layers IDs array
	selectedIDs : {},

	//current layer into the ink loop
	theArtboard : {},
	theLayer : {},
	theLayerID : {},
	theLayerInkFolder : {}, 
	theLayerBounds : {},

	//store document selection if we are measuring a selection.
	documentSelection : {},

	//array holding rulers references
	rulers : [],

	/*
	 * UI calls this function
	 */
    run : function( args ) 
    {
    	var InkUiArguments = args.split(",");
    	var InkUISettings = [];
    	var InkUICommands = [];

    	for ( var i = 0; i < InkUiArguments.length; i++ )
		{
			//first 10 arguments are settings.
			if ( i <= 10 )
			{
				InkUISettings.push( InkUiArguments[i] );	
			}
			//remaining stuff is commands.
			else
			{
				InkUICommands.push( InkUiArguments[i] );	
			}
			
		}
		
		var commandSettings = { layerDocumentation_printObj:InkUISettings[0],
							    layerDocumentation_printColor:InkUISettings[1],
							    layerDocumentation_printFx:InkUISettings[2],
			                    text_bubble_styling:InkUISettings[3], 
			                    generate_xml:InkUISettings[4],
			                    output_text_color:InkUISettings[5],
			                    measures_color:InkUISettings[6],
			                    text_bubble_color:InkUISettings[7],
			                    text_size:InkUISettings[8],
			                    ruler_stroke:InkUISettings[9],
			                    color_format:InkUISettings[10]
			               	    };
		
		app.activeDocument.suspendHistory( "Ink", "this.Ink( InkUICommands , commandSettings )" );
        return "Ink";
    },

    /*
	 * print messages
	 */
	console : function( msg )
	{
		if ( $._ext_INK.verbose ) {
			$.writeln( msg );	
		}
	},

	/*
	 * display Ink alerts on Photoshop
	 */
	InkAlert : function( msg ) 
	{
		alert( "Ink: " + msg );
	},

	/*
	 * init variables
	 */
	init : function()
	{
		this.console( "Init Ink vars.." );

		InkPrinter.init( this.version );

		this.doc                 = {};
		this.temp                = {};
		this.inkFolder           = {};
		this.selectedIDs         = {};
		this.userPrefs           = {};
		this.settings            = {};

		//prints 'px' next to ruler measure
		this.settings.printUnits = "on";

		//selection based rulers settings
		this.settings.selection  = {};

		//if true, adds the padding 
		//that we use for object rulers. False
		//by the default since i prefer precise
		//selections.
		this.settings.selection.rulerSpacing = false;

		//enable disable certain documentation elements
		this.settings.layerDocumentation                 = {}
		this.settings.layerDocumentation.printObj        = 'on';
		this.settings.layerDocumentation.printColor      = 'on';
		this.settings.layerDocumentation.printFx         = 'on';
		this.settings.layerDocumentation.generateXmlFile = 'on';
		this.settings.layerDocumentation.colorFormat     = 'css'; //'css' || 'hex' 

		//Bubbles style
		this.settings.bubble              = {};
		this.settings.bubble.layerName    = "Bubble";
		this.settings.bubble.styling      = "on";
		this.settings.bubble.alpha        = 75;
		this.settings.bubble.cornerRadius = 0;
		this.settings.bubble.padding      = 13;
		this.settings.bubble.color        = {r:40,g:221,b:185};
		this.settings.bubble.fColor       = {red:0,green:0,blue:0};
		
		//rulers
		this.settings.rulerStroke       = 1;
		this.settings.rulerBraceLength  = this.settings.rulerStroke * 5; //5
		this.settings.rulerColor        = {red:40,green:221,blue:185};
		this.settings.rulerXSpacing     = this.settings.rulerBraceLength + 10;
		this.settings.rulerYSpacing     = this.settings.rulerBraceLength + 10;
		
		//measure text next to ruler
		this.settings.measuresFont      = "ArialMT";
		this.settings.measuresFontColor = {red:40,green:221,blue:185};
		this.settings.measuresFontSize  = 18;
		this.settings.measuresXSpacing  = ( this.settings.rulerBraceLength * 2 ) + ( this.settings.rulerStroke ) + ( this.settings.rulerXSpacing / 2 );
		this.settings.measuresYSpacing  = ( this.settings.rulerBraceLength * 2 ) + ( this.settings.rulerStroke + 1) + this.settings.rulerYSpacing;
		
		//FX Documentation style
		this.settings.fxDocFont         = "ArialMT";
		this.settings.fxDocFontColor    = {red:40,green:221,blue:185};
		this.settings.fxDocFontSize     = 10;
		this.settings.fxDocXSpacing     = this.settings.measuresXSpacing + 40;
		this.settings.fxDocYSpacing     = this.settings.measuresYSpacing + 40;

		//TEXT Documentation style (position is automatically set to bottom of fx.)
		this.settings.textDocFont       = "ArialMT";
		this.settings.textDocFontColor  = {red:40,green:221,blue:185};
		this.settings.textDocFontSize   = 13;

		this.theLayer                   = {};
		this.theLayerInkFolder          = {};
		this.theLayerBounds             = {};
		this.documentSelection          = {};
		this.rulers                     = [];
	},

	//Main Ink actions Hub
	Ink : function( actions, mySettings ) 
	{

		//init vars.
		this.init();

		try
		{
			this.console( "Setting Ink units and rulers.." );

			//store user preferences, set ink prefs.
			this.userPrefs.startRulerUnits        = app.preferences.rulerUnits; 
			this.userPrefs.startTypeUnits         = app.preferences.typeUnits; 
			this.userPrefs.startDisplayDialogs    = app.displayDialogs;

			app.preferences.rulerUnits       = Units.PIXELS; 
			app.preferences.typeUnits        = TypeUnits.PIXELS; 
			app.displayDialogs               = DialogModes.NO;
		} 
		catch ( e )
		{
			this.console( "Cannnot set Ink units and rulers. Continue anyway." );	
		}

		//check id we are calling Ink without open docs.
		try
		{
			this.doc = app.activeDocument;
		} 
		catch ( e )
		{
			this.InkAlert( "Oops! No open Photoshop document." );
			return;
		}

		if ( mySettings != null && mySettings != undefined )
		{
			this.InkSettings( mySettings );
		}

		//lets sort out the actions array.
		var selectionMeasureX  = false;
		var selectionMeasureY  = false;
		var layerMeasureX      = false;
		var layerMeasureY      = false;
		var layerDocumentation = false;

		if ( actions == undefined || actions.length <= 0 )
		{
			this.InkAlert( "Ink() actions arguments missing." );
			return;
		}

		//let's get reference of all selected layer ids before doing anything else.
		this.selectedIDs = this.getSelectedLayersIdx();

	    
		//if ink folder doesnt exist, let's create it.
		this.theArtboard = Layers.getActiveParentArtboard();
	    try {
	    	this.inkFolder = this.theArtboard.ref.layerSets.getByName( this.inkFolderName );	
	    }
	    catch(e) {
	    	this.inkFolder = this.theArtboard.ref.layerSets.add(); 
			this.inkFolder.name = this.inkFolderName;	
	    }

		for ( var a = 0; a < actions.length; a++ )
		{
			if (actions[a] == "layerMeasureX") {
				layerMeasureX = true;
			}
			else if (actions[a] == "layerMeasureY") {
				layerMeasureY = true;
			}
			else if (actions[a] == "selectionMeasureX") {
				selectionMeasureX = true;
			}
			else if (actions[a] == "selectionMeasureY") {
				selectionMeasureY = true;
			}
			else if (actions[a] == "layerDocumentation") {
				layerDocumentation = true;
			}
		}

		this.console( "Ink() with params:" );
		this.console( "layerMeasureX:" + layerMeasureX );
		this.console( "layerMeasureY:" + layerMeasureY );
		this.console( "selectionMeasureX:" + selectionMeasureX );
		this.console( "selectionMeasureY:" + selectionMeasureY );
		this.console( "layerDocumentation:" + layerDocumentation );
		this.console( "----------------------------" );

		if ( selectionMeasureX || selectionMeasureY )
		{
			this.documentSelection = app.activeDocument.selection;

			//if a selection exists, proceed.
			var validSelection;
			try
			{
				var b = this.documentSelection.bounds;
				validSelection = true;
			}
			catch( e )
			{
				validSelection = false;
			}
			if( validSelection )
			{
				if ( selectionMeasureX ) 
				{
					this.measureSelX( this.documentSelection );
				}
				if ( selectionMeasureY ) 
				{
					this.measureSelY( this.documentSelection );
				}
			}
			else
			{
				this.InkAlert( 'Create a selection area to measure first.' );
			}
		}


		if ( layerMeasureX || layerMeasureY || layerDocumentation )
		{

			if( layerDocumentation && app.activeDocument.mode != DocumentMode.RGB )
	        {
	        	this.InkAlert( 'Layer documentation works only on RGB documents.' );
	            return;
	        }

			if ( this.selectedIDs.length <= 0 )
			{
				this.InkAlert( 'No layers selected' );
				return;	
			}

			for( var i = ( this.selectedIDs.length - 1); i >= 0; i-- ) 
			{
				//select next layer from the ids array
				Layers.selectLayerByID( this.selectedIDs[i] );

				//set reference to currently selected layer
				this.theLayer    = this.doc.activeLayer;
				this.theLayerID  = this.selectedIDs[i];
				this.theArtboard = Layers.getActiveParentArtboard();

				//get layer bounds of current layer without effects.
				this.theLayerBounds = this.getLayerBounds( this.theLayer, false );

				//every layer might be part of a different artboard.
				//if ink folder doesnt exist for this artboard, let's create it.
			    try {
			    	this.inkFolder = this.theArtboard.ref.layerSets.getByName( this.inkFolderName );
			    	this.console( ">Found __ink folder for: " + this.theArtboard.name );	
			    }
			    catch(e) {
			    	this.inkFolder = this.theArtboard.ref.layerSets.add(); 
					this.inkFolder.name = this.inkFolderName;	
			    }

				//error type #1
				if ( this.theLayer.isBackgroundLayer || this.theLayer.allLocked || Layers.isEmpty( this.theLayer ) ) 
		    	{
		    		this.InkAlert( "cannot perform actions on this layer." );
		    	}
		    	//error type #2
		    	else if ( this.theLayer.typename == "LayerSet" )
		    	{
		    		this.InkAlert( "cannot perform actions on groups, please select multiple layers instead.'");
		    	}
		    	//target is ok, perform actions
		    	else
		    	{
		    		this.console( "targeting layer: " + this.theLayer.name );

		    		//create layer specific folder into Ink/
		    		this.theLayerInkFolder      = undefined;
					this.theLayerInkFolder      = this.inkFolder.layerSets.add(); 
					this.theLayerInkFolder.name = this.theLayer.name;

		    		if ( layerMeasureX )
		    		{
		    			this.measureX( this.theLayer, this.theLayerInkFolder );
		    		}
		    		if ( layerMeasureY )
		    		{
		    			this.measureY( this.theLayer, this.theLayerInkFolder );
		    		}
		    		if ( layerDocumentation )
		    		{
		    			//documentation( theLayer, theLayerInkFolder );
		    			this.documentTarget( this.theLayer, this.theLayerInkFolder );
		    		}
		    	}
			}

			//end of INK documenting loop. if needed, print xml documentation.
			if ( layerDocumentation && this.settings.layerDocumentation.generateXmlFile == 'on' )
		    {
				InkPrinter.printXML();
			}

		}

		try
		{
			//Reset the application preferences 
			this.console( "Re-Setting user units and rulers.." );
			app.preferences.rulerUnits = this.userPrefs.startRulerUnits; 
			app.preferences.typeUnits  = this.userPrefs.startTypeUnits; 
			app.displayDialogs         = this.userPrefs.startDisplayDialogs;
		}
		catch ( e )
		{
			this.console( "Cannnot re-set user units and rulers." );	
		}

		//garbage collection
		try
		{
			this.gc();
		}
		catch ( e )
		{
			this.console( e.toString() );	
		}
	},

	documentTarget : function( targetLayer, targetLayerInkFolder ) 
	{
		Layers.selectLayerByID(this.theLayerID);

		//target layer documentation and final 
		//textual output is stored into this object
		var layerDocumentation   = {};
		layerDocumentation.obj   = { txt:"" }; 
		layerDocumentation.color = { txt:"" }; 
		layerDocumentation.fx    = { txt:"" }; 

		var documentationOutput  = "";

		//1.layerDocumentation.obj
		//---------------------------------------------------------------------------------------------------------------
		var layerObjXmlStr = "<basic>";

		var layerName = "";
		if ( targetLayer.name.toString().length > 28 ) 
		{
			layerName = targetLayer.name.toString().substr(0,28) + "..";
		} else {
			layerName = targetLayer.name.toString();	
		}

		switch ( targetLayer.kind ) 
		{
			case LayerKind.SOLIDFILL:
				layerDocumentation.obj.txt += "SHAPE LAYER" + "\r";
				layerDocumentation.obj.txt += "name: " +  layerName + "\r";
				layerDocumentation.obj.txt += "opacity: " + Number( Math.round( targetLayer.opacity ) / 100 ) + "\r";
				layerObjXmlStr             += "<kind>Solid Shape</kind>";
				layerObjXmlStr             += "<opacity>" + ( Math.round( targetLayer.opacity ) / 100 ).toString() + "</opacity>";
			break;

			case LayerKind.GRADIENTFILL:
				layerDocumentation.obj.txt += "SHAPE LAYER" + "\r";
				layerDocumentation.obj.txt += "name: " +  layerName + "\r";
				layerDocumentation.obj.txt += "opacity: " + Number( Math.round( targetLayer.opacity ) / 100 ) + "\r";
				layerObjXmlStr             += "<kind>Gradient Shape</kind>";
				layerObjXmlStr             += "<opacity>" + ( Math.round( targetLayer.opacity ) / 100 ).toString() + "</opacity>";
			break;

			case LayerKind.TEXT:
				layerDocumentation.obj.txt += "TEXT LAYER" + "\r";
				layerDocumentation.obj.txt += "name: " +  layerName + "\r";
				layerDocumentation.obj.txt += "opacity: " + Number( Math.round( targetLayer.opacity ) / 100 ) + "\r";
				layerObjXmlStr             += "<kind>Textfield</kind>";
				layerObjXmlStr             += "<opacity>" + ( Math.round( targetLayer.opacity ) / 100 ).toString() + "</opacity>";

				layerDocumentation.obj.txt += "Fonts:" + "\r";
				layerObjXmlStr             += "<fonts>";
				var fontCollection = this.getFonts( this.doc.activeLayer );
				for( var fontItem in fontCollection ) 
				{
					layerDocumentation.obj.txt += ">Name: " + fontCollection[fontItem].font + "\r";
					layerDocumentation.obj.txt += "Style: " + fontCollection[fontItem].style + "\r";
					layerDocumentation.obj.txt += "Size: " + Number( fontCollection[fontItem].size).toFixed(2) + "\r";
					layerDocumentation.obj.txt +=  "Tracking: " + Number( fontCollection[fontItem].tracking ) + "\r";
					layerDocumentation.obj.txt +=  "Leading: " + Number( fontCollection[fontItem].leading ) + "\r";

					layerObjXmlStr             += "<font>";
					layerObjXmlStr             += "<name>" + fontCollection[fontItem].font + "</name>";
					layerObjXmlStr             += "<style>" + fontCollection[fontItem].style + "</style>";
					layerObjXmlStr             += "<size>" + ( Number( fontCollection[fontItem].size).toFixed(2) ).toString() + "</size>";
					layerObjXmlStr             += "<tracking>" + fontCollection[fontItem].tracking + "</tracking>";
					layerObjXmlStr             += "<leading>" + fontCollection[fontItem].leading + "</leading>";

					if ( fontCollection[fontItem].rgbaColor != undefined )
					{
						if ( this.settings.layerDocumentation.colorFormat == "hex" )
						{

							var myhex = ColorUtils.rgbToHex( fontCollection[fontItem].rgbaColor.red,
												             fontCollection[fontItem].rgbaColor.green, 
												             fontCollection[fontItem].rgbaColor.blue );
							myhex    += " (alpha: " + fontCollection[fontItem].rgbaColor.alpha.toString() + ")";
							layerDocumentation.obj.txt += "Color: " + myhex + "\r";
						}
						else //css
						{
							layerDocumentation.obj.txt += "Color: " + Ps2CssUtils.rgbaObjToCSS( fontCollection[fontItem].rgbaColor ) + "\r";
						}
						layerObjXmlStr             += "<color><rgba>";
						layerObjXmlStr             += "<red>" + (Math.round(fontCollection[fontItem].rgbaColor.red)).toString() + "</red>";
			    		layerObjXmlStr             += "<green>" + (Math.round(fontCollection[fontItem].rgbaColor.green)).toString() + "</green>";
			    		layerObjXmlStr             += "<blue>" + (Math.round(fontCollection[fontItem].rgbaColor.blue)).toString() + "</blue>";
			    		layerObjXmlStr             += "<alpha>" +  (fontCollection[fontItem].rgbaColor.alpha).toString() + "</alpha>";
						layerObjXmlStr             += "</rgba></color>";
					}

					//if ( fontCollection[fontItem].color != undefined )
					//{
					//	layerDocumentation.obj.txt += "Color: " + RGBtoString( fontCollection[fontItem].color.rgb.red, fontCollection[fontItem].color.rgb.green, fontCollection[fontItem].color.rgb.blue ) + "\r";
					//}
					layerObjXmlStr             += "</font>";
					
			    }
			    layerObjXmlStr += "</fonts>";

			break;

			case LayerKind.NORMAL:
				layerDocumentation.obj.txt += "RASTER LAYER" + "\r";
				layerDocumentation.obj.txt += "name: " +  layerName + "\r";
				layerDocumentation.obj.txt += "opacity: " + Number( Math.round( targetLayer.opacity ) / 100 ) + "\r";
				layerObjXmlStr             += "<kind>Raster</kind>";
				layerObjXmlStr             += "<opacity>" + ( Math.round( targetLayer.opacity ) / 100 ).toString() + "</opacity>";
			break;

			case LayerKind.SMARTOBJECT:
				layerDocumentation.obj.txt += "SMART OBJECT LAYER" + "\r";
				layerDocumentation.obj.txt += "name: " +  layerName + "\r";
				layerDocumentation.obj.txt += "opacity: " + Number( Math.round( targetLayer.opacity ) / 100 ) + "\r";
				layerObjXmlStr             += "<kind>Smart Object</kind>";
				layerObjXmlStr             += "<opacity>" + ( Math.round( targetLayer.opacity ) / 100 ).toString() + "</opacity>";
			break;

			default:
				//...
		}
		//add to layer main xml
		layerObjXmlStr += "</basic>";
		

		//2.layerDocumentation.fx
		//---------------------------------------------------------------------------------------------------------------
		var layerFxList = this.getLayerFxInfo();

		//if there are no other fx than solid and gradient fill, no need of printing header and other infos.
		var layerFxChk = 0;
		for ( var i = 0; i < layerFxList.length; i++ )
		{
			if ( layerFxList[i].type != "solidFill" && layerFxList[i].type != "gradientFill" ) {
				layerFxChk++;
			}
		} 

		//let's build XML directly for fx, since we already have a list of xml objects.
		var layerFxXML = new XML("<effects></effects>");
		if ( layerFxChk > 0 )
		{
			layerDocumentation.fx.txt += "FX INFO:" + "\r";

			for ( var i = 0; i < layerFxList.length; i++ )
			{
				//solid and gradient fills are handled into color paragraph.
				if ( layerFxList[i].type != "solidFill" && layerFxList[i].type != "gradientFill" )
				{
					//CSS-style fx documentation
					for ( var k = 0; k < layerFxList[i].css.properties.length; k++ )
					{
						layerDocumentation.fx.txt += layerFxList[i].css.properties[k].name + ": " + layerFxList[i].css.properties[k].val + "\r";	
					}

					//PS-style fx documentation. Ignored (we can add a switch here later.)
					//layerDocumentation.fx.txt += layerFxList[i].txt;

					//add to xml output
					layerFxXML.appendChild( layerFxList[i].xml );
				}
			}
		}

		//3.layerDocumentation.color
		//---------------------------------------------------------------------------------------------------------------
		//search for potential solid / gradient fill..
		var solidFillFxID    = this.searchForLayerFxID( layerFxList, "solidFill" );
		var gradientFillFxID = this.searchForLayerFxID( layerFxList, "gradientFill" );

		//init objects
		var myLayerColors            = {};
		myLayerColors.original       = { enabled:false, rgba:{} };
		myLayerColors.solidFillFX    = { enabled:false, rgba:{} };
		myLayerColors.gradientFillFX = { enabled:false, angle:-1, alpha:0, type:"", stops:[] };

		//get layer original color
		var originalColorXMLStr = "<original>";
		switch ( targetLayer.kind ) 
		{
			case LayerKind.SOLIDFILL:
				myLayerColors.original.enabled    = true; 
				var shapeSolidColor               = this.getFillColor();
				myLayerColors.original.rgba.red   = shapeSolidColor.rgb.red;
				myLayerColors.original.rgba.green = shapeSolidColor.rgb.green;
				myLayerColors.original.rgba.blue  = shapeSolidColor.rgb.blue;
				myLayerColors.original.rgba.alpha = ( targetLayer.fillOpacity / 100 );

				originalColorXMLStr     += "<color><rgba>";
				originalColorXMLStr     += "<red>" + Math.round(myLayerColors.original.rgba.red) + "</red>";
				originalColorXMLStr     += "<green>" + Math.round(myLayerColors.original.rgba.green) + "</green>";
				originalColorXMLStr     += "<blue>" + Math.round(myLayerColors.original.rgba.blue) + "</blue>";
				originalColorXMLStr     += "<alpha>" + myLayerColors.original.rgba.alpha + "</alpha>";
				originalColorXMLStr     += "</rgba></color>";
			break;

			case LayerKind.TEXT:
				//you should list fonts colors in _temp or somewhere..
			break;

			default:
				//other kind of layer are not supported now. (gradientFill, smart object, groups..)
		}
		originalColorXMLStr += "</original>";
		
		//get solid / gradient fx
		if ( solidFillFxID != -1 ) 
		{
			myLayerColors.solidFillFX.enabled = true; 
			myLayerColors.solidFillFX.rgba    = { red:layerFxList[solidFillFxID].props.solidColor.rgb.red, 
									   		      green:layerFxList[solidFillFxID].props.solidColor.rgb.green, 
									   			  blue:layerFxList[solidFillFxID].props.solidColor.rgb.blue, 
									   			  alpha:(layerFxList[solidFillFxID].props.opacity / 100) };
		}
		if ( gradientFillFxID != -1 ) 
		{
			myLayerColors.gradientFillFX.enabled  = true; 
			myLayerColors.gradientFillFX.angle    = layerFxList[gradientFillFxID].props.angle; 
			myLayerColors.gradientFillFX.type     = layerFxList[gradientFillFxID].props.type;
			myLayerColors.gradientFillFX.alpha    = layerFxList[gradientFillFxID].props.opacity;
			myLayerColors.gradientFillFX.stops    = ColorUtils.mergeGradientCTStops( layerFxList[gradientFillFxID].props.colorStops,
														             	             layerFxList[gradientFillFxID].props.transparencyStops );
			
			myLayerColors.gradientFillFX.stops    = ColorUtils.averageGradientInOutAlpha( myLayerColors.gradientFillFX.stops, 
																		                  layerFxList[gradientFillFxID].props.opacity );
		}
		var colorFxXMLStr = "<colorFX>";
		if ( this.temp.colorFxPSData != undefined ) 
		{ 
			for ( var i = 0; i < this.temp.colorFxPSData.length; i++ ) 
			{
				colorFxXMLStr += this.temp.colorFxPSData[i].xmlStr;
			}
		}
		colorFxXMLStr += "</colorFX>";

		//blend colors and create css string.
		var colorCSSXMLStr = "<CSS>";
		var layerColorBlend = ColorBlender.blend( myLayerColors.original, 
												  myLayerColors.solidFillFX,
												  myLayerColors.gradientFillFX,
												  true,
												  this.settings.layerDocumentation.colorFormat );
		if ( layerColorBlend.css != "" ) 
		{
			layerDocumentation.color.txt +=  "COLOR INFO: " + "\r";

			if ( layerColorBlend.type == "gradient" ) 
			{
				//let's use the output with line breaks.
				layerDocumentation.color.txt +=  layerColorBlend.css_gr_lb + "\r";
				colorCSSXMLStr   += "<color>" + layerColorBlend.css + "</color>";
			}
			else
			{
				//solid color. let's use the regular one, shouldnt be that long..
				if ( this.settings.layerDocumentation.colorFormat == "hex" )
				{
					layerDocumentation.color.txt +=  layerColorBlend.hex + "\r";
				}
				else
				{
					//css
					layerDocumentation.color.txt +=  layerColorBlend.css + "\r";
				}
				colorCSSXMLStr   += "<color>" + layerColorBlend.css + "</color>";	
			}	
		}
		colorCSSXMLStr   += "</CSS>";

		var layerColorXmlStr = "<color>";
		layerColorXmlStr    += colorCSSXMLStr;
		layerColorXmlStr    += "<Photoshop>" + originalColorXMLStr + colorFxXMLStr + "</Photoshop>";
		layerColorXmlStr    += "</color>";

		//create final XML object for this layer.
		var layerXML      = new XML( '<layer name="' + targetLayer.name + '"></layer>');
		var layerObjXml   = new XML( layerObjXmlStr );
		var layerColorXml = new XML( layerColorXmlStr );
		layerXML.appendChild( layerObjXml );
		layerXML.appendChild( layerColorXml );
		layerXML.appendChild( layerFxXML );
		InkPrinter.appendXML( layerXML );


		//Set documentation final output
		//---------------------------------------------------------------------------------------------------------------
		if ( this.settings.layerDocumentation.printObj == 'on' )
		{
			documentationOutput += layerDocumentation.obj.txt;

			//add white space to the bottom?
			if ( this.settings.layerDocumentation.printColor == 'off' &&  this.settings.layerDocumentation.printFx == "on" )
			{
				documentationOutput += "\r";	
			}
		}
		if ( this.settings.layerDocumentation.printColor == 'on' )
		{
			//add white space to the top?
			if ( this.settings.layerDocumentation.printObj == 'on' )
			{
				if ( layerDocumentation.color.txt != "" ) 
				{
					documentationOutput += "\r";	
				}
			}

			documentationOutput += layerDocumentation.color.txt;

			//add white space to the bottom?
			if ( this.settings.layerDocumentation.printFx == 'on' )
			{
				documentationOutput += "\r"; 	
			}
		}
		if ( this.settings.layerDocumentation.printFx   == 'on' )
		{
			documentationOutput += layerDocumentation.fx.txt;
		}

		//4. draw documentation text field
		//---------------------------------------------------------------------------------------------------------------
		//set text color depending on bubble on | off.
		var docTextFieldColor;
		//set text position depending on bubble on | off
		var docTextFieldStartingX;
		var docTextFieldStartingY;

		if ( this.settings.bubble.styling == "on" )
		{
			docTextFieldColor = this.settings.bubble.fColor;
			docTextFieldStartingX = (this.theLayerBounds.x2 + this.settings.fxDocXSpacing) + this.settings.bubble.padding;
			docTextFieldStartingY = (this.theLayerBounds.y1 + Math.round(this.settings.fxDocFontSize * 0.8) ) + this.settings.bubble.padding;
		}
		else
		{
			docTextFieldColor     = this.settings.fxDocFontColor;
			docTextFieldStartingX = this.theLayerBounds.x2 + this.settings.fxDocXSpacing;
			docTextFieldStartingY = this.theLayerBounds.y1 + Math.round(this.settings.fxDocFontSize * 0.8);
		}

		
		//////////////////////////////////////////////////////////////////////
		//for some reason, this needs to be adjusted with rel position..
		docTextFieldStartingX = docTextFieldStartingX - this.theArtboard.left;
		docTextFieldStartingY = docTextFieldStartingY - this.theArtboard.top;
		//////////////////////////////////////////////////////////////////////

		Layers.createText(this.settings.fxDocFont, this.settings.fxDocFontSize, docTextFieldColor, documentationOutput, docTextFieldStartingX, docTextFieldStartingY, Justification.LEFT, 'Documentation' );
		this.doc.activeLayer.move(targetLayerInkFolder, ElementPlacement.INSIDE);
		
		//register documentation text bounds in case we need to add up a bubble
		var currDocTextLayer  = this.doc.activeLayer;
		var currDocTextBounds = this.doc.activeLayer.bounds;

		if ( this.settings.bubble.styling == "on" )
		{
			var bubbleBounds          = {};
			bubbleBounds.topy         = currDocTextBounds[1] - this.settings.bubble.padding;
			bubbleBounds.topx         = currDocTextBounds[0] - this.settings.bubble.padding;
			bubbleBounds.bottomy      = currDocTextBounds[3] + this.settings.bubble.padding;
			bubbleBounds.bottomx      = currDocTextBounds[2] + this.settings.bubble.padding;
			this.createRoundedRectangle( bubbleBounds, this.settings.bubble.color, this.settings.bubble.alpha, this.settings.bubble.cornerRadius );
			this.doc.activeLayer.move(currDocTextLayer, ElementPlacement.PLACEAFTER);
		}

	},

	/*
	 * Garbage collection
	 */
	gc : function()
	{
		this.console( "garbage collection.. ");
		this.temp              = null;
		this.doc               = null;	
		this.inkFolder         = null;
		this.selectedIDs       = null;
		this.userPrefs         = null;
		this.settings          = null;
		this.theLayer          = null;  
		this.theLayerInkFolder = null; 
		this.theLayerBounds    = null;
		this.documentSelection = null;
		this.rulers            = null;
	},

	getActiveArtboard : function() 
	{  
	    while (true) 
	    {  
	        if ( this.isArtboardLayer() ) 
	        {  
	            return this.doc.activeLayer  
	        }  
	        this.selectForwardLayer();  
	    }  
	},

	isArtboardLayer : function() 
	{  
	    var ref = new ActionReference();  
	    ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));  
	    var isArtboardLayer = executeActionGet(ref).getBoolean(stringIDToTypeID("artboardEnabled"));  
	    return isArtboardLayer  
	},

	selectForwardLayer : function() 
	{  
	    var desc = new ActionDescriptor();  
	    var ref = new ActionReference();  
	    ref.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Frwr'));  
	    desc.putReference(charIDToTypeID('null'), ref);  
	    desc.putBoolean(charIDToTypeID('MkVs'), false);  
	    executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);  
	},    

	//modify Ink Settings by User Interface
	InkSettings : function( mySettings )
	{
		for( var key in mySettings ) 
		{
			if ( key == "layerDocumentation_printObj" )
			{
				this.settings.layerDocumentation.printObj = mySettings[key];
			}
			else if ( key == "layerDocumentation_printColor" )
			{
				this.settings.layerDocumentation.printColor = mySettings[key];
			} 
			else if ( key == "layerDocumentation_printFx" )
			{
				this.settings.layerDocumentation.printFx = mySettings[key];
			}     
			else if ( key == "text_bubble_styling" )
			{
				this.settings.bubble.styling = mySettings[key];
			}
			else if ( key == "generate_xml" )
			{
				this.settings.layerDocumentation.generateXmlFile = mySettings[key];
			}
			else if ( key == "output_text_color" )
			{
				var fontHexColor                = ColorUtils.hexToRgb(mySettings[key]);
				this.settings.fxDocFontColor    = { red:fontHexColor.r, green:fontHexColor.g, blue:fontHexColor.b };
				this.settings.textDocFontColor  = { red:fontHexColor.r, green:fontHexColor.g, blue:fontHexColor.b };
				this.settings.bubble.fColor     = { red:fontHexColor.r, green:fontHexColor.g, blue:fontHexColor.b };
			}
			else if ( key == "measures_color" )
			{
				var fontHexColor                = ColorUtils.hexToRgb(mySettings[key]);
				this.settings.rulerColor        = { red:fontHexColor.r,green:fontHexColor.g,blue:fontHexColor.b };
				this.settings.measuresFontColor = { red:fontHexColor.r,green:fontHexColor.g,blue:fontHexColor.b };
			}
			else if ( key == "text_bubble_color" )
			{
				var fontHexColor               = ColorUtils.hexToRgb(mySettings[key]);
				this.settings.bubble.color     = { r:fontHexColor.r,g:fontHexColor.g,b:fontHexColor.b };
			}
			else if ( key == "text_size" )
			{
				this.settings.measuresFontSize = parseInt(mySettings[key]);
				this.settings.fxDocFontSize    = parseInt(mySettings[key]);
				this.settings.textDocFontSize  = parseInt(mySettings[key]);
			}
			else if ( key == "ruler_stroke" )
			{
				this.settings.rulerStroke      = parseInt(mySettings[key]);
			}
			else if ( key == "color_format" )
			{
				this.settings.layerDocumentation.colorFormat = mySettings[key].toString();
			}
	    }

	    //recalculate vars here.
	    this.settings.rulerBraceLength  = this.settings.rulerStroke * 5;
		this.settings.rulerXSpacing     = this.settings.rulerBraceLength + 10;
		this.settings.rulerYSpacing     = this.settings.rulerBraceLength + 10;
		this.settings.measuresXSpacing  = ( this.settings.rulerBraceLength * 2 ) + ( this.settings.rulerStroke ) + ( this.settings.rulerXSpacing / 2 );
		this.settings.measuresYSpacing  = ( this.settings.rulerBraceLength * 2 ) + ( this.settings.rulerStroke + 1) + this.settings.rulerYSpacing;
	},

	/*
	 * Get bounds for a layer.
	 */
	getLayerBounds : function( targetLayer, withFX ) 
	{
		if ( ! withFX ) 
		{
			//hide all FX to create precise bounding box
			//(Shadows affects layer bounding boxes)
			Layers.disableAllLayerFX();
		}

		var lb   = {};
		lb.x1    = targetLayer.bounds[0];
		lb.x2    = targetLayer.bounds[2];
		lb.y1    = targetLayer.bounds[1];
		lb.y2    = targetLayer.bounds[3];
		lb.w     = lb.x2 - lb.x1;
		lb.h     = lb.y2 - lb.y1;
		lb.halfw = lb.w / 2;
		lb.halfh = lb.h / 2;


		if ( ! withFX ) 
		{
			//re-enable all FX
			Layers.enableAllLayerFX();
		}

		return lb;
	},


	/*
	 * Draw measurement ruler
	 */
	drawRuler : function( direction, x, y, length ) 
	{
		//horizontal ruler
		if ( direction == "h" ) {
			//h main line
			this.drawShape([[x, y], [(x + length), y], [(x + length), ( y + this.settings.rulerStroke ) ], [x, ( y + this.settings.rulerStroke )]],this.settings.rulerColor);
			//v l line
			this.drawShape([[(x + this.settings.rulerStroke), (y - this.settings.rulerBraceLength)], [(x + this.settings.rulerStroke), (y + this.settings.rulerBraceLength + this.settings.rulerStroke)], [x, ( y + this.settings.rulerBraceLength + this.settings.rulerStroke )], [x, (y - this.settings.rulerBraceLength)]],this.settings.rulerColor);
	    	this.doc.activeLayer.merge();
	    	//v r line
			this.drawShape([[(x + length - this.settings.rulerStroke), (y - this.settings.rulerBraceLength)], [(x + length - this.settings.rulerStroke), (y + this.settings.rulerBraceLength + this.settings.rulerStroke)], [(x + length), ( y + this.settings.rulerBraceLength + this.settings.rulerStroke )], [(x+length), (y - this.settings.rulerBraceLength)]],this.settings.rulerColor);
			this.doc.activeLayer.merge();
		}
		//vertical ruler
		else if ( direction == "v" ) {
			//v main line
			this.drawShape([[x, y], [x, (y + length)], [(x + this.settings.rulerStroke), ( y + length ) ], [(x + this.settings.rulerStroke),y]],this.settings.rulerColor);
			//h top line
			this.drawShape([[(x-this.settings.rulerBraceLength),y],[(x + this.settings.rulerBraceLength + this.settings.rulerStroke),y],[(x + this.settings.rulerBraceLength + this.settings.rulerStroke),(y + this.settings.rulerStroke)],[(x - this.settings.rulerBraceLength),(y + this.settings.rulerStroke)]],this.settings.rulerColor);
			this.doc.activeLayer.merge();
	    	//h bottom line
			this.drawShape([[(x-this.settings.rulerBraceLength),(y + length - this.settings.rulerStroke)],[(x + this.settings.rulerBraceLength + this.settings.rulerStroke),(y + length - this.settings.rulerStroke)],[(x + this.settings.rulerBraceLength + this.settings.rulerStroke),(y + length)],[(x - this.settings.rulerBraceLength),(y + length)]],this.settings.rulerColor);
			this.doc.activeLayer.merge();
		}
		this.doc.activeLayer.name = "ruler" + ( this.rulers.length + 1 ).toString();
	},

	/*
	 * Draw a rectangular shape with
	 * given coordinates and rgb color object
	 */
	drawShape : function( coords, rgb )
	{
		var myArtboard      = Layers.getActiveParentArtboard();
		var artLayerRef     = myArtboard.ref.artLayers.add();
		//var artLayerRef     = this.doc.artLayers.add();

		artLayerRef.name    = "line";
		this.doc.selection.select( coords );
		var fillColor       = new SolidColor();
		fillColor.rgb.red   = rgb.red;
		fillColor.rgb.green = rgb.green;
		fillColor.rgb.blue  = rgb.blue;
		this.doc.selection.fill( fillColor, ColorBlendMode.NORMAL, 100, false );
		this.doc.selection.deselect();
	},

	/*
	 * Get active layer effects list
	 */
	getLayerFxInfo : function()
	{
		var fxList = [];

		//retrieve unprocessed data
		var layerStyle = this.getLayerStyles();

		function printHorizontalRuler()
		{
			return("------------------------------" + "\r" );
		}

		if( layerStyle != null ) 
		{
			//let's store solid and gradient fill Ps properties xml 
			//info into _temp. we are gonna reuse those infos later.
			this.temp.colorFxPSData = [];

			for( var fx in layerStyle ) 
		    {
		    	//temporary store fx info into this object
				var fxInfo   = {};
				fxInfo.type  = "";
				fxInfo.props = {};
				fxInfo.txt   = "";
				fxInfo.css   = { properties:[] };
				fxInfo.xml   = new XML('<fx type="' + fx.toString() + '"></fx>');

		    	switch ( fx )
		    	{
		    		case "solidFill" :
		    			//if fx is disabled, skip this fx.
		    			if ( ! layerStyle[fx].enabled ) 
		    			{
		    				this.console( fx + " is disabled." );
		    			}
		    			else
		    			{

		    				this.console( fx + " is enabled." );

			    			fxInfo.type                       = fx;
			    			fxInfo.props.rgbaStr              = ColorUtils.RGBAtoString( layerStyle[fx].color.red, layerStyle[fx].color.grain, layerStyle[fx].color.blue, Math.round(layerStyle[fx].opacity ) );
			    			fxInfo.props.opacity              = layerStyle[fx].opacity;
			    			fxInfo.props.mode                 = layerStyle[fx].mode;
			    			fxInfo.props.solidColor           = new SolidColor();
			    			fxInfo.props.solidColor.rgb.red   = layerStyle[fx].color.red;
				            fxInfo.props.solidColor.rgb.green = layerStyle[fx].color.grain;
				            fxInfo.props.solidColor.rgb.blue  = layerStyle[fx].color.blue;

				            fxInfo.txt                       += "Solid fill fx: " + fxInfo.props.rgbaStr + "\r";
			    			fxInfo.txt                       += "Solid fill mode: " + fxInfo.props.mode + "\r";

				            var PsXmlPropsStr                 = '<fx type="' + fx.toString() + '">';
				            PsXmlPropsStr                    += "<mode>" + fxInfo.props.mode + "</mode>";
			    			PsXmlPropsStr                    += "<color><rgba>";
			    			PsXmlPropsStr                    += "<red>" + Math.round(fxInfo.props.solidColor.rgb.red) + "</red>";
			    			PsXmlPropsStr                    += "<green>" + Math.round(fxInfo.props.solidColor.rgb.green) + "</green>";
			    			PsXmlPropsStr                    += "<blue>" + Math.round(fxInfo.props.solidColor.rgb.blue) + "</blue>";
			    			PsXmlPropsStr                    += "<alpha>" + ( Math.round( fxInfo.props.opacity ) / 100 ) + "</alpha>";
			    			PsXmlPropsStr                    += "</rgba></color>";
			    			PsXmlPropsStr                    += "</fx>";

			    			//type: solidFill | gradientFill
			    			//xml: <Photoshop> fx properties node
			    			this.temp.colorFxPSData.push( { type:fxInfo.type, xmlStr:PsXmlPropsStr } );
			    			
			    			//add to output
			                fxList.push( fxInfo );
		    			}

		    		break;

		    		case "gradientFill" :
		    			//if fx is disabled, skip this fx.
		    			if ( ! layerStyle[fx].enabled ) 
		    			{
		    				this.console( fx + " is disabled." );
		    			}
		    			else
		    			{
		    				this.console( fx + " is enabled." );

			    			fxInfo.type            = fx;
			    			fxInfo.txt            += "Gradient fill fx: " + "\r";

			    			//Main gradient properties.
			    			//Note: i am not documenting the following
			    			//properties to avoid over complexity.
			    			//layerStyle[fx].gradient["name"]
			    			//layerStyle[fx].gradient["gradientForm"]
			    			//layerStyle[fx].gradient["interpolation"]
			    			//layerStyle[fx].dither 
			    			//layerStyle[fx].align

			    			fxInfo.props.mode      = layerStyle[fx].mode;
			    			fxInfo.props.opacity   = layerStyle[fx].opacity;
			    			fxInfo.props.angle     = layerStyle[fx].angle;
			    			fxInfo.props.type      = layerStyle[fx].type;
			    			fxInfo.props.reverse   = layerStyle[fx].reverse;
			    			fxInfo.props.offsetH   = layerStyle[fx].offset.horizontal;
			    			fxInfo.props.offsetV   = layerStyle[fx].offset.vertical;

			    			fxInfo.txt            += "Mode: " + layerStyle[fx].mode + "\r";
			    			fxInfo.txt            += "Opacity: " + layerStyle[fx].opacity + "%\r";
			    			fxInfo.txt            += "Angle: " + layerStyle[fx].angle + "° \r";
			    			fxInfo.txt            += "Type: " + layerStyle[fx].type + "\r";
			    			fxInfo.txt            += "Reverse: " + layerStyle[fx].reverse + "\r";
			    			fxInfo.txt            += "Offset x: " + layerStyle[fx].offset.horizontal + "\r";
			    			fxInfo.txt            += "Offset y: " + layerStyle[fx].offset.vertical + "\r";

			    			var PsXmlPropsStr      = '<fx type="' + fx.toString() + '">';
				            PsXmlPropsStr         += "<mode>" + fxInfo.props.mode + "</mode>";
				            PsXmlPropsStr         += "<opacity>" + fxInfo.props.opacity + "</opacity>";
				            PsXmlPropsStr         += "<angle>" + fxInfo.props.angle + "</angle>";
				            PsXmlPropsStr         += "<type>" + fxInfo.props.type + "</type>";
				            PsXmlPropsStr         += "<offset>";
				            PsXmlPropsStr         += "<horizontal>" + fxInfo.props.offsetH + "</horizontal>";
				            XmlPropsStr           += "<vertical>" + fxInfo.props.offsetV + "</vertical>";
				            PsXmlPropsStr         += "</offset>"

			    			//Gradient color stops
			    			//credits to Michael L Hale for this. http://forums.adobe.com/message/311294
			    			fxInfo.txt              += "Gradient color stops: " + "\r";
			    			fxInfo.props.colorStops  = [];

			    			PsXmlPropsStr           += "<color>";
			    			PsXmlPropsStr           += "<colorStops>";

			    			for( var i = 0; i < layerStyle[fx].gradient["colors"].count; i++ )
			          		{
			          			//get color stop descriptor 
			          			var colorDesc      = layerStyle[fx].gradient["colors"].getObjectValue(i);
			          			var colorStop      = {};
					            colorStop.location = colorDesc.getInteger(stringIDToTypeID('location'));
					            colorStop.midpoint = colorDesc.getInteger(stringIDToTypeID('midpoint'));
					            colorStop.type     = typeIDToStringID(colorDesc.getEnumerationValue(stringIDToTypeID('type')));
					            var colorD         = colorDesc.getObjectValue(stringIDToTypeID('color'));
					            var color          = this.getColorByDocumentMode( colorD );
					            var rgbStr         = ColorUtils.RGBtoString( color.rgb.red, color.rgb.green, color.rgb.blue );

					            //add to colorStops array
					            fxInfo.props.colorStops.push( { rgbStr:rgbStr,
					            								solidColor:color,
					            								location:colorStop.location,
					            								midpoint:colorStop.midpoint } );

					            //add to textual output
					            fxInfo.txt        += "- color stop #" + i.toString() + "\r";
					            fxInfo.txt        += "- " + rgbStr + "\r"; 
					            fxInfo.txt        += "- Location: " + this.convertGradientPSLocation( colorStop.location ) + "% \r"; 
					            fxInfo.txt        += "- Midpoint: " + colorStop.midpoint + "% \r";  

					            PsXmlPropsStr    += "<stop>";
					            PsXmlPropsStr    += "<color><rgb>";
					            PsXmlPropsStr    += "<red>" + (Math.round(color.rgb.red)).toString() + "</red>";
					            PsXmlPropsStr    += "<green>" + (Math.round(color.rgb.green)).toString() + "</green>";
					            PsXmlPropsStr    += "<blue>" + (Math.round(color.rgb.blue)).toString() + "</blue>";
					            PsXmlPropsStr    += "</rgb></color>";
					            PsXmlPropsStr    += "<location>";
					            PsXmlPropsStr    += "<photoshop>" + colorStop.location + "</photoshop>";
					            PsXmlPropsStr    += "<css>" + this.convertGradientPSLocation( colorStop.location ) + "</css>";
					            PsXmlPropsStr    += "</location>";
					            PsXmlPropsStr    += "<midpoint>" + colorStop.midpoint + "</midpoint>";
					            PsXmlPropsStr    += "</stop>";  
			          		}
			          		PsXmlPropsStr           += "</colorStops>";

			          		//Transparency stops
			          		fxInfo.txt                     += "Transparency stops: " + "\r";
			    			fxInfo.props.transparencyStops  = [];
			    			PsXmlPropsStr                  += "<transparencyStops>";

			    			for( var i = 0; i < layerStyle[fx].gradient["transparency"].count; i++ )
			          		{
			          			var transpDesc      = layerStyle[fx].gradient["transparency"].getObjectValue(i);
			          			var transpStop      = {};
			          			transpStop.location = transpDesc.getInteger(stringIDToTypeID('location'));
					            transpStop.midpoint = transpDesc.getInteger(stringIDToTypeID('midpoint'));
					            transpStop.opacity  = transpDesc.getInteger(stringIDToTypeID('opacity'));

					            //add to colorStops array
					            fxInfo.props.transparencyStops.push( { opacity:transpStop.opacity,
					            								   	   location:transpStop.location,
					            								       midpoint:transpStop.midpoint   
																       } );

					            //add to textual output
					            fxInfo.txt        += "- transparency stop #" + i + " \r";
					            fxInfo.txt        += "- Opacity: " + transpStop.opacity + "% \r";
					            fxInfo.txt        += "- Location: " + this.convertGradientPSLocation( transpStop.location ) + "% \r"; 
					            fxInfo.txt        += "- Midpoint: " + colorStop.midpoint + "% \r";

					            PsXmlPropsStr    += "<stop>";
					            PsXmlPropsStr    += "<opacity>" + transpStop.opacity + "</opacity>";
					            PsXmlPropsStr    += "<location>";
					            PsXmlPropsStr    += "<photoshop>" + transpStop.location + "</photoshop>";
					            PsXmlPropsStr    += "<css>" + this.convertGradientPSLocation( transpStop.location ) + "</css>";
					            PsXmlPropsStr    += "</location>";
					            PsXmlPropsStr    += "<midpoint>" + transpStop.midpoint + "</midpoint>";
					            PsXmlPropsStr    += "</stop>";  
			          		}
			          		PsXmlPropsStr += "</transparencyStops>";
			          		PsXmlPropsStr += "</color>";
			          		PsXmlPropsStr += "</fx>";

			          		//type: solidFill | gradientFill
			    			//xml: <Photoshop> fx properties node
			    			this.temp.colorFxPSData.push( { type:fxInfo.type, xmlStr:PsXmlPropsStr } );

			    			//add to output
			                fxList.push( fxInfo );
		    			}

		    		break;

		    		case "dropShadow" :
		    			//if fx is disabled, skip this fx.
		    			if ( ! layerStyle[fx].enabled ) 
		    			{
		    				this.console( fx + " is disabled." );
		    				fxInfo.xml.appendChild(new XML('<enabled>false</enabled>'));
		    			}
		    			else
		    			{
		    				this.console( fx + " is enabled." );

		    				fxInfo.xml.appendChild(new XML('<enabled>true</enabled>'));
		    				var FxXmlProps    = new XML('<properties></properties>');

			    			fxInfo.type                       = fx;
			    			fxInfo.txt                       += "> Drop Shadow fx: " + "\r";

			    			fxInfo.props.rgbaStr              = ColorUtils.RGBAtoString( layerStyle[fx].color.red, layerStyle[fx].color.grain, layerStyle[fx].color.blue, Math.round(layerStyle[fx].opacity ) );
			    			fxInfo.props.mode                 = layerStyle[fx].mode;
			    			fxInfo.props.opacity              = layerStyle[fx].opacity;
			    			fxInfo.props.distance             = layerStyle[fx].distance;
			    			fxInfo.props.blur                 = layerStyle[fx].blur;
			    			fxInfo.props.solidColor           = new SolidColor();
			    			fxInfo.props.solidColor.rgb.red   = layerStyle[fx].color.red;
				            fxInfo.props.solidColor.rgb.green = layerStyle[fx].color.grain;
				            fxInfo.props.solidColor.rgb.blue  = layerStyle[fx].color.blue;
				            fxInfo.props.useGlobalAngle       = layerStyle[fx].useGlobalAngle;
				            //spread? dropShadow.spread = dropShadowDesc .getDouble( cTID("Ckmt"));
				            if ( fxInfo.props.useGlobalAngle ) 
							{
								//retrieve global angle value.°
								var ref = new ActionReference();
								ref.putEnumerated( charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt") ); 
								fxInfo.props.angle = executeActionGet(ref).getInteger(stringIDToTypeID('globalAngle'));
							}
							else
							{
								fxInfo.props.angle = layerStyle[fx].localLightingAngle;
							}
							var dropShadowRGBA = { red:Math.round(fxInfo.props.solidColor.rgb.red),
								 				   green:Math.round(fxInfo.props.solidColor.rgb.green),
												   blue:Math.round(fxInfo.props.solidColor.rgb.blue),
												   alpha: ( Math.round( fxInfo.props.opacity ) / 100 ) };

							fxInfo.css.properties.push( { name:"box-shadow", 
								                          val:Ps2CssUtils.shadowToCSS( false, dropShadowRGBA, fxInfo.props.distance, fxInfo.props.angle, fxInfo.props.blur ) 
								                          } );

			    			fxInfo.txt                       += "Color: " + fxInfo.props.rgbaStr + "\r";
			    			fxInfo.txt                       += "Mode: " + fxInfo.props.mode + "\r";
			    			fxInfo.txt                       += "Distance: " + fxInfo.props.distance + "\r";
			    			fxInfo.txt                       += "Blur: " + fxInfo.props.blur + "\r";
			    			fxInfo.txt                       += "Angle: " + fxInfo.props.angle + "° \r";

			    			var PsXmlPropsStr = "<Photoshop>";
			    			PsXmlPropsStr    += "<color>";
			    			PsXmlPropsStr    += "<rgba>";
			    			PsXmlPropsStr    += "<red>" + Math.round(fxInfo.props.solidColor.rgb.red) + "</red>";
			    			PsXmlPropsStr    += "<green>" + Math.round(fxInfo.props.solidColor.rgb.green) + "</green>";
			    			PsXmlPropsStr    += "<blue>" + Math.round(fxInfo.props.solidColor.rgb.blue) + "</blue>";
			    			PsXmlPropsStr    += "<alpha>" + ( Math.round( fxInfo.props.opacity ) / 100 ) + "</alpha>";
			    			PsXmlPropsStr    += "</rgba>";
			    			PsXmlPropsStr    += "</color>";
			    			PsXmlPropsStr    += "<mode>" + fxInfo.props.mode + "</mode>";
			    			PsXmlPropsStr    += "<distance>" + fxInfo.props.distance + "</distance>";
			    			PsXmlPropsStr    += "<blur>" + fxInfo.props.blur + "</blur>";
			    			PsXmlPropsStr    += "<angle>" + fxInfo.props.angle + "</angle>";
			    			PsXmlPropsStr    += "</Photoshop>";

			    			var CssXmlPropsStr = "<CSS>";
			    			for ( var i=0; i < fxInfo.css.properties.length; i++ ) {
			    				CssXmlPropsStr += "<" + fxInfo.css.properties[i].name + ">" + fxInfo.css.properties[i].val + "</" + fxInfo.css.properties[i].name + ">";
			    			}
			    			CssXmlPropsStr += "</CSS>";

			    			FxXmlProps.appendChild( new XML(PsXmlPropsStr) );
			    			FxXmlProps.appendChild( new XML(CssXmlPropsStr) );
			    			fxInfo.xml.appendChild(FxXmlProps);
			    			//InkPrinter.appendXML( fxInfo.xml );
			    			//InkPrinter.printXML();

			    			//add to output
			                fxList.push( fxInfo );
			    		}
		    		break;

		    		case "innerShadow" :
		    			//if fx is disabled, skip this fx.
		    			if ( ! layerStyle[fx].enabled ) 
		    			{
		    				this.console( fx + " is disabled." );
		    				fxInfo.xml.appendChild(new XML('<enabled>false</enabled>'));
		    			}
		    			else
		    			{
		    				this.console( fx + " is enabled." );

		    				fxInfo.xml.appendChild(new XML('<enabled>true</enabled>'));
		    				var FxXmlProps    = new XML('<properties></properties>');

			    			fxInfo.type                       = fx;
			    			fxInfo.txt                       += "> Inset Shadow fx: " + "\r";

			    			fxInfo.props.rgbaStr              = ColorUtils.RGBAtoString( layerStyle[fx].color.red, layerStyle[fx].color.grain, layerStyle[fx].color.blue, Math.round(layerStyle[fx].opacity ) );
			    			fxInfo.props.mode                 = layerStyle[fx].mode;
			    			fxInfo.props.opacity              = layerStyle[fx].opacity;
			    			fxInfo.props.distance             = layerStyle[fx].distance;
			    			fxInfo.props.blur                 = layerStyle[fx].blur;
			    			fxInfo.props.noise                = layerStyle[fx].noise;
			    			fxInfo.props.solidColor           = new SolidColor();
			    			fxInfo.props.solidColor.rgb.red   = layerStyle[fx].color.red;
				            fxInfo.props.solidColor.rgb.green = layerStyle[fx].color.grain;
				            fxInfo.props.solidColor.rgb.blue  = layerStyle[fx].color.blue;
				            fxInfo.props.useGlobalAngle       = layerStyle[fx].useGlobalAngle;

				            if ( fxInfo.props.useGlobalAngle ) 
							{
								//retrieve global angle value.°
								var ref = new ActionReference();
								ref.putEnumerated( charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt") ); 
								fxInfo.props.angle = executeActionGet(ref).getInteger(stringIDToTypeID('globalAngle'));
							}
							else
							{
								fxInfo.props.angle = layerStyle[fx].localLightingAngle;
							}
							var dropShadowRGBA = { red:Math.round(fxInfo.props.solidColor.rgb.red),
								 				   green:Math.round(fxInfo.props.solidColor.rgb.green),
												   blue:Math.round(fxInfo.props.solidColor.rgb.blue),
												   alpha: ( Math.round( fxInfo.props.opacity ) / 100 ) };

							fxInfo.css.properties.push( { name:"box-shadow", 
								                          val:Ps2CssUtils.shadowToCSS( true, dropShadowRGBA, fxInfo.props.distance, fxInfo.props.angle, fxInfo.props.blur ) 
								                          } ); 

			    			fxInfo.txt                       += "Color: " + fxInfo.props.rgbaStr + "\r";
			    			fxInfo.txt                       += "Mode: " + fxInfo.props.mode + "\r";
			    			fxInfo.txt                       += "Distance: " + fxInfo.props.distance + "\r";
			    			fxInfo.txt                       += "Blur: " + fxInfo.props.blur + "\r";
			    			fxInfo.txt                       += "Angle: " + fxInfo.props.angle + "° \r";

			    			var PsXmlPropsStr = "<Photoshop>";
			    			PsXmlPropsStr    += "<color>";
			    			PsXmlPropsStr    += "<rgba>";
			    			PsXmlPropsStr    += "<red>" + Math.round(fxInfo.props.solidColor.rgb.red) + "</red>";
			    			PsXmlPropsStr    += "<green>" + Math.round(fxInfo.props.solidColor.rgb.green) + "</green>";
			    			PsXmlPropsStr    += "<blue>" + Math.round(fxInfo.props.solidColor.rgb.blue) + "</blue>";
			    			PsXmlPropsStr    += "<alpha>" + ( Math.round( fxInfo.props.opacity ) / 100 ) + "</alpha>";
			    			PsXmlPropsStr    += "</rgba>";
			    			PsXmlPropsStr    += "</color>";
			    			PsXmlPropsStr    += "<mode>" + fxInfo.props.mode + "</mode>";
			    			PsXmlPropsStr    += "<distance>" + fxInfo.props.distance + "</distance>";
			    			PsXmlPropsStr    += "<blur>" + fxInfo.props.blur + "</blur>";
			    			PsXmlPropsStr    += "<angle>" + fxInfo.props.angle + "</angle>";
			    			PsXmlPropsStr    += "</Photoshop>";

			    			var CssXmlPropsStr = "<CSS>";
			    			for ( var i=0; i < fxInfo.css.properties.length; i++ ) {
			    				CssXmlPropsStr += "<" + fxInfo.css.properties[i].name + ">" + fxInfo.css.properties[i].val + "</" + fxInfo.css.properties[i].name + ">";
			    			}
			    			CssXmlPropsStr += "</CSS>";

			    			FxXmlProps.appendChild( new XML(PsXmlPropsStr) );
			    			FxXmlProps.appendChild( new XML(CssXmlPropsStr) );
			    			fxInfo.xml.appendChild(FxXmlProps);
			    			
			    			//add to output
			                fxList.push( fxInfo );

			    		}
		    		break;

		    		case "frameFX" :
		    			//if fx is disabled, skip this fx.
		    			if ( ! layerStyle[fx].enabled ) 
		    			{
		    				this.console( fx + " is disabled." );
		    				fxInfo.xml.appendChild(new XML('<enabled>false</enabled>'));
		    			}
		    			else
		    			{
		    				fxInfo.xml.appendChild(new XML('<enabled>true</enabled>'));
		    				var FxXmlProps    = new XML('<properties></properties>');

			    			fxInfo.type                       = fx;
			    			fxInfo.txt                       += "> Stroke fx: " + "\r";

			    			fxInfo.props.mode                 = layerStyle[fx].mode;
			    			fxInfo.props.type                 = layerStyle[fx].paintType;
			    			fxInfo.props.size                 = layerStyle[fx].size;
			    			fxInfo.props.opacity              = layerStyle[fx].opacity;

			    			fxInfo.txt                       += "Mode: " + fxInfo.props.mode + "\r";
			    			fxInfo.txt                       += "Size: " + fxInfo.props.size + "\r";
			    			fxInfo.txt                       += "Type: " + fxInfo.props.type + "\r";

			    			var PsXmlPropsStr = "<Photoshop>";
			    			PsXmlPropsStr    += "<mode>" + fxInfo.props.mode + "</mode>";
			    			PsXmlPropsStr    += "<type>" + fxInfo.props.type + "</type>";
			    			PsXmlPropsStr    += "<size>" + fxInfo.props.size + "</size>";
			    			PsXmlPropsStr    += "<color>";

			    			//gradients are not supported for borders in CSS. 
			    			//If gradient, let's use the first colorstop.
			    			var frameFxRGBA = {};

			    			if ( fxInfo.props.type == "solidColor" )
			    			{
			    				fxInfo.props.rgbaStr              = ColorUtils.RGBAtoString( layerStyle[fx].color.red, layerStyle[fx].color.grain, layerStyle[fx].color.blue, Math.round(layerStyle[fx].opacity ) );
				    			fxInfo.props.solidColor           = new SolidColor();
				    			fxInfo.props.solidColor.rgb.red   = layerStyle[fx].color.red;
					            fxInfo.props.solidColor.rgb.green = layerStyle[fx].color.grain;
					            fxInfo.props.solidColor.rgb.blue  = layerStyle[fx].color.blue;
					            fxInfo.props.useGlobalAngle       = layerStyle[fx].useGlobalAngle;	
					            fxInfo.txt                       += "Color: " + fxInfo.props.rgbaStr + "\r";

					            frameFxRGBA = { red:Math.round(fxInfo.props.solidColor.rgb.red),
								 				green:Math.round(fxInfo.props.solidColor.rgb.green),
												blue:Math.round(fxInfo.props.solidColor.rgb.blue),
												alpha: ( Math.round( fxInfo.props.opacity ) / 100 ) };

								PsXmlPropsStr    += "<type>Solid</type>";
								PsXmlPropsStr    += "<rgba>";
				    			PsXmlPropsStr    += "<red>" + Math.round(fxInfo.props.solidColor.rgb.red) + "</red>";
				    			PsXmlPropsStr    += "<green>" + Math.round(fxInfo.props.solidColor.rgb.green) + "</green>";
				    			PsXmlPropsStr    += "<blue>" + Math.round(fxInfo.props.solidColor.rgb.blue) + "</blue>";
				    			PsXmlPropsStr    += "<alpha>" + ( Math.round( fxInfo.props.opacity ) / 100 ) + "</alpha>";
				    			PsXmlPropsStr    += "</rgba>";
			    			}
			    			else if ( fxInfo.props.type == "gradientFill" )
			    			{
			    				//color stops.
			    				fxInfo.txt                 += "Gradient color stops: " + "\r";
				    			fxInfo.props.colorStops  = [];

				    			PsXmlPropsStr    += "<type>Gradient</type>";
				    			PsXmlPropsStr    += "<colorStops>";

				    			for( var i = 0; i < layerStyle[fx].gradient["colors"].count; i++ )
				          		{
				          			//get color stop descriptor 
				          			var colorDesc      = layerStyle[fx].gradient["colors"].getObjectValue(i);
				          			var colorStop      = {};
						            colorStop.location = colorDesc.getInteger(stringIDToTypeID('location'));
						            colorStop.midpoint = colorDesc.getInteger(stringIDToTypeID('midpoint'));
						            colorStop.type     = typeIDToStringID(colorDesc.getEnumerationValue(stringIDToTypeID('type')));
						            var colorD         = colorDesc.getObjectValue(stringIDToTypeID('color'));
						            var color          = this.getColorByDocumentMode( colorD );
						            var rgbStr         = RGBtoString( color.rgb.red, color.rgb.green, color.rgb.blue );

						            //add to colorStops array
						            fxInfo.props.colorStops.push( { rgbStr:rgbStr,
						            								solidColor:color,
						            								location:colorStop.location,
						            								midpoint:colorStop.midpoint } );

						            //add to textual output
						            fxInfo.txt        += "- color stop #" + i.toString() + "\r";
						            fxInfo.txt        += "- " + rgbStr + "\r"; 
						            fxInfo.txt        += "- Location: " + this.convertGradientPSLocation( colorStop.location ) + "% \r"; 
						            fxInfo.txt        += "- Midpoint: " + colorStop.midpoint + "% \r"; 

						            PsXmlPropsStr    += "<stop>";
						            PsXmlPropsStr    += "<color><rgb>";
						            PsXmlPropsStr    += "<red>" + (Math.round(color.rgb.red)).toString() + "</red>";
						            PsXmlPropsStr    += "<green>" + (Math.round(color.rgb.green)).toString() + "</green>";
						            PsXmlPropsStr    += "<blue>" + (Math.round(color.rgb.blue)).toString() + "</blue>";
						            PsXmlPropsStr    += "</rgb></color>";
						            PsXmlPropsStr    += "<location>";
						            PsXmlPropsStr    += "<photoshop>" + colorStop.location + "</photoshop>";
						            PsXmlPropsStr    += "<css>" + this.convertGradientPSLocation( colorStop.location ) + "</css>";
						            PsXmlPropsStr    += "</location>";
						            PsXmlPropsStr    += "<midpoint>" + colorStop.midpoint + "</midpoint>";
						            PsXmlPropsStr    += "</stop>";  

						            if ( i == 0 ) 
						            {
						            	frameFxRGBA = { red:Math.round(color.rgb.red),
								 						green:Math.round(color.rgb.green),
														blue:Math.round(color.rgb.blue),
														alpha: ( Math.round( fxInfo.props.opacity ) / 100 ) };
						            }
				          		}
				          		PsXmlPropsStr    += "</colorStops>";

				          		//transparency stops.
				          		//Transparency stops
				          		fxInfo.txt                     += "Transparency stops: " + "\r";
				    			fxInfo.props.transparencyStops  = [];

				    			PsXmlPropsStr    += "<transparencyStops>";

				    			for( var i = 0; i < layerStyle[fx].gradient["transparency"].count; i++ )
				          		{
				          			var transpDesc      = layerStyle[fx].gradient["transparency"].getObjectValue(i);
				          			var transpStop      = {};
				          			transpStop.location = transpDesc.getInteger(stringIDToTypeID('location'));
						            transpStop.midpoint = transpDesc.getInteger(stringIDToTypeID('midpoint'));
						            transpStop.opacity  = transpDesc.getInteger(stringIDToTypeID('opacity'));

						            //add to colorStops array
						            fxInfo.props.transparencyStops.push( { opacity:transpStop.opacity,
						            								   	   location:transpStop.location,
						            								       midpoint:transpStop.midpoint   
																	       } );

						            //add to textual output
						            fxInfo.txt        += "- transparency stop #" + i + " \r";
						            fxInfo.txt        += "- Opacity: " + transpStop.opacity + "% \r";
						            fxInfo.txt        += "- Location: " + this.convertGradientPSLocation( transpStop.location ) + "% \r"; 
						            fxInfo.txt        += "- Midpoint: " + colorStop.midpoint + "% \r";

						            PsXmlPropsStr    += "<stop>";
						            PsXmlPropsStr    += "<opacity>" + transpStop.opacity + "</opacity>";
						            PsXmlPropsStr    += "<location>";
						            PsXmlPropsStr    += "<photoshop>" + transpStop.location + "</photoshop>";
						            PsXmlPropsStr    += "<css>" + this.convertGradientPSLocation( transpStop.location ) + "</css>";
						            PsXmlPropsStr    += "</location>";
						            PsXmlPropsStr    += "<midpoint>" + transpStop.midpoint + "</midpoint>";
						            PsXmlPropsStr    += "</stop>";  
				          		}
				          		PsXmlPropsStr     += "</transparencyStops>";
			    			}

			    			//style: insetFrame || outsetFrame
		    				if ( layerStyle[fx].style == "insetFrame" ) {
		    					fxInfo.css.properties.push({ name:"box-sizing", val:"border-box" });
		    				}
		    				fxInfo.css.properties.push({ name:"border", val:Ps2CssUtils.borderToCSS( fxInfo.props.size, frameFxRGBA  ) });

		    				PsXmlPropsStr     += "</color>";
			    			PsXmlPropsStr     += "</Photoshop>";
			    			var CssXmlPropsStr = "<CSS>";
			    			for ( var i=0; i < fxInfo.css.properties.length; i++ ) {
			    				CssXmlPropsStr += "<" + fxInfo.css.properties[i].name + ">" + fxInfo.css.properties[i].val + "</" + fxInfo.css.properties[i].name + ">";
			    			}
			    			CssXmlPropsStr += "</CSS>";

			    			FxXmlProps.appendChild( new XML(PsXmlPropsStr) );
			    			FxXmlProps.appendChild( new XML(CssXmlPropsStr) );
			    			fxInfo.xml.appendChild(FxXmlProps);

			    			//add to output
			                fxList.push( fxInfo );
				            
		    			}
		    		break;

		    	}
		    }
		}

		return fxList;
	},	




	/*
	 * Convert PS gradient location to % location
	 */
	convertGradientPSLocation : function( location )
	{
		return ( Math.round( ( location / 4096 ) * 100 ) );
	},
	
	/*
	 * Get layer color from descriptor
	 */
	getColorByDocumentMode : function( desc ) 
	{
		var color = new SolidColor();

		switch( app.activeDocument.mode )
		{
			case DocumentMode.GRAYSCALE:
				color.gray.gray = desc.getDouble(charIDToTypeID('Gry '));
			break;
	        case DocumentMode.RGB:
	             color.rgb.red   = desc.getDouble(charIDToTypeID('Rd  '));
	             color.rgb.green = desc.getDouble(charIDToTypeID('Grn '));
	             color.rgb.blue  = desc.getDouble(charIDToTypeID('Bl  '));
	        break;
	        case DocumentMode.CMYK:
	             color.cmyk.cyan    = desc.getDouble(charIDToTypeID('Cyn '));
	             color.cmyk.magenta = desc.getDouble(charIDToTypeID('Mgnt'));
	             color.cmyk.yellow  = desc.getDouble(charIDToTypeID('Ylw '));
	             color.cmyk.black   = desc.getDouble(charIDToTypeID('Blck'));
	        break;
	        case DocumentMode.LAB:
	             color.lab.l = desc.getDouble(charIDToTypeID('Lmnc'));
	             color.lab.a = desc.getDouble(charIDToTypeID('A   '));
	             color.lab.b = desc.getDouble(charIDToTypeID('B   '));
	        break;
		}
		return color;		       
	},	

	/*
	 * Get fonts, leadings, trackings by range.
	 * Credits to Paul Riggot and others Adobe forum users
	 * http://forums.adobe.com/thread/1175041
	 */
	getFonts : function(textLayer) 
	{
		var fonts = [];
		var font_content_detection = false;
		function markReturnedContentText(text) 
		{
			if (font_content_detection) 
			{
				return font_content_detection_symbols[0] + text + font_content_detection_symbols[1] + "\r";
			} 
			else 
			{
				return text;
			}
		}

		if (textLayer.kind == LayerKind.TEXT) 
		{
			//alert( "Text color: " + textLayer.textItem.color );
			//var co = new SolidColor();
			//co = textLayer.textItem.color;


			//app.activeDocument.activeLayer = textLayer;
			var ref = new ActionReference();
			ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
			var layerDesc = executeActionGet(ref);
			var textDesc  = layerDesc.getObjectValue(stringIDToTypeID('textKey'));
			var rangeList = textDesc.getList(stringIDToTypeID('textStyleRange'));
			for (var m = 0; m < rangeList.count; m++) 
			{
				var styleDesc = rangeList.getObjectValue(m).getObjectValue(stringIDToTypeID('textStyle'));
				var aFrom = rangeList.getObjectValue(m).getInteger(stringIDToTypeID('from'));
				var aTo = rangeList.getObjectValue(m).getInteger(stringIDToTypeID('to'));
				if (m > 0) 
				{
					if (rangeList.getObjectValue(m - 1)
					.getInteger(stringIDToTypeID('from')) == aFrom && rangeList.getObjectValue(m - 1)
					.getInteger(stringIDToTypeID('to')) == aTo) continue;
				}
				var theLetters = app.activeDocument.activeLayer.textItem.contents.substring(aFrom, aTo);

				var aFont;
				if (styleDesc.hasKey(stringIDToTypeID('fontPostScriptName'))) 
				{
					aFont = styleDesc.getString(stringIDToTypeID('fontPostScriptName'));
				}
				else
				{
					aFont = "undefined";
					this.InkAlert('I cannot detect one of the fonts of layer "' + this.theLayer.name + '".\r Text range [' + aFrom.toString() + ',' + aTo.toString() + ']' );
					//move to the next font into the loop.
					continue;
				}
				var aStyle     = styleDesc.getString(app.charIDToTypeID("FntS"));
				var aSize      = new UnitValue(styleDesc.getUnitDoubleValue(stringIDToTypeID('size')), "px");

				//var aCaps      = styleDesc.getEnumerationValue(app.stringIDToTypeID("fontCaps"));
				//var aStrikeThrough = styleDesc.getEnumerationValue(app.stringIDToTypeID("strikethrough"));
	            //var aUnderline     = styleDesc.getEnumerationValue(app.stringIDToTypeID("Undl"));
	            //alert( aUnderline );
	            //,  italics = textStyle.getBoolean(sTID("italics"))

				//Check if font has been transformed
				if (textDesc.hasKey(stringIDToTypeID('transform'))) 
				{
					var mFactor = textDesc.getObjectValue(stringIDToTypeID('transform')).getUnitDoubleValue (stringIDToTypeID("yy") );
					aSize = Math.round(aSize * mFactor);
				}
				//get font color
				var colorDesc;
				var aColor;
				var aRgbaColor;

	            try 
	            {
	            	colorDesc = styleDesc.getObjectValue(charIDToTypeID("Clr "));
	            	aColor = this.extractFontColor( colorDesc );
	            	aRgbaColor = { red:Math.round(aColor.rgb.red),
						           green:Math.round(aColor.rgb.green),
						           blue:Math.round(aColor.rgb.blue),
						           alpha:( Math.round(this.doc.activeLayer.fillOpacity ) / 100) };
	            }
	            catch (e) 
	            {
	            	aColor     = undefined;
	            	aRgbaColor = undefined;
	            }

	            //get leading
				if (styleDesc.hasKey(stringIDToTypeID('leading'))) 
				{
					var aLeading = new UnitValue(styleDesc.getUnitDoubleValue(stringIDToTypeID('leading')), "px");
				} 
				else 
				{
					var aLeading = "";
				}

				//get tracking
				if (styleDesc.hasKey(stringIDToTypeID('tracking'))) 
				{
					var aTracking = new UnitValue(styleDesc.getUnitDoubleValue(stringIDToTypeID('tracking')), "px");
				} 
				else 
				{
					var aTracking = "";
				}

				var txt = theLetters;
				var merged = false;
				if (txt.length > 0) 
				{
					for (var x = 0; x < m; x++) 
					{
						try 
						{
							if (fonts[x].font === aFont && fonts[x].size === aSize && fonts[x].color.rgb.hexValue === aColor.rgb.hexValue && fonts[x].leading === aLeading) 
							{
								if (fonts[x].text !== txt) 
								{
									fonts[x].text += markReturnedContentText(txt);
								}
								merged = true;
							}
						} 
						catch (e) {}
					}
					if (!merged) 
					{
						fonts.push({ text: markReturnedContentText(txt),
									 font: aFont,
									 size: aSize,
									 style: aStyle,
									 color: aColor,
									 rgbaColor: aRgbaColor,
									 leading: Math.round(aLeading),
									 tracking: aTracking });
					}
				}
			};
			return fonts;
		}
	},


	/*
	 * Get font color from descriptor
	 */
	extractFontColor : function( colorDesc )
	{
		var color = new SolidColor();

		switch( app.activeDocument.mode )
		{
			case DocumentMode.GRAYSCALE:
				color.gray.gray = colorDesc.getDouble(charIDToTypeID('Gry '));
			break;
	        case DocumentMode.RGB:
	             color.rgb.red   = colorDesc.getDouble(charIDToTypeID('Rd  '));
	             color.rgb.green = colorDesc.getDouble(charIDToTypeID('Grn '));
	             color.rgb.blue  = colorDesc.getDouble(charIDToTypeID('Bl  '));
	        break;
	        case DocumentMode.CMYK:
	             color.cmyk.cyan    = colorDesc.getDouble(charIDToTypeID('Cyn '));
	             color.cmyk.magenta = colorDesc.getDouble(charIDToTypeID('Mgnt'));
	             color.cmyk.yellow  = colorDesc.getDouble(charIDToTypeID('Ylw '));
	             color.cmyk.black   = colorDesc.getDouble(charIDToTypeID('Blck'));
	        break;
	        case DocumentMode.LAB:
	             color.lab.l = colorDesc.getDouble(charIDToTypeID('Lmnc'));
	             color.lab.a = colorDesc.getDouble(charIDToTypeID('A   '));
	             color.lab.b = colorDesc.getDouble(charIDToTypeID('B   '));
	        break;
		}

		return color;
	},
	

	/*
	 * Get active layer fill color
	 */
	getFillColor : function() 
	{
		var fillcolor = undefined;
		try {
			var ref = new ActionReference();
			ref.putEnumerated( stringIDToTypeID( "contentLayer" ), charIDToTypeID( "Ordn" ), charIDToTypeID( "Trgt" ));
			var ref1= executeActionGet( ref );
			var list =  ref1.getList( charIDToTypeID( "Adjs" ) ) ;
			var solidColorLayer = list.getObjectValue(0);        
			var color = solidColorLayer.getObjectValue(charIDToTypeID('Clr ')); 
			fillcolor = new SolidColor;
			fillcolor.rgb.red = color.getDouble(charIDToTypeID('Rd  '));
			fillcolor.rgb.green = color.getDouble(charIDToTypeID('Grn '));
			fillcolor.rgb.blue = color.getDouble(charIDToTypeID('Bl  '));
		}
		catch( e ) {}
		return fillcolor;
	},

	/*
	 * Get Layer styles
	 * credits to tomkrcha: 
	 * https://github.com/tomkrcha/LayerMiner/blob/master/ExportLayerStyle.jsx 
	 */
	getLayerStyles : function()
	{
	   var ref = new ActionReference();
	   ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID( "Ordn" ), charIDToTypeID( "Trgt" ) );
	   var layerDesc = executeActionGet(ref);
	   if(layerDesc.hasKey(stringIDToTypeID('layerEffects')))
	   {
	       stylesDesc = layerDesc.getObjectValue(stringIDToTypeID('layerEffects'));
	       var obj    = this.actionDescriptorToObject(stylesDesc);
	       return obj;
	   }
	},

	/*
	 * Descriptor --> Object
	 * credits to tomkrcha: 
	 * https://github.com/tomkrcha/LayerMiner/blob/master/ExportLayerStyle.jsx 
	 */
	actionDescriptorToObject : function(desc)
	{
		var obj = {};
		var len = desc.count;
		for(var i=0;i<len;i++)
		{
			var key = desc.getKey(i);
			obj[typeIDToStringID(key)] = this.getValueByType(desc,key);
		}
		return obj;
	},

	/*
	 * Get a value from an ActionDescriptor 
	 * credits to tomkrcha: 
	 * https://github.com/tomkrcha/LayerMiner/blob/master/ExportLayerStyle.jsx 
	 */
	getValueByType : function(desc,key)
	{
		var type = desc.getType(key);
		var value = null;
		switch(type)
		{
			case DescValueType.ALIASTYPE:
				value = "alias";
				break;
			case DescValueType.BOOLEANTYPE:
				value = desc.getBoolean(key);
				break;
			case DescValueType.CLASSTYPE:
				value = desc.getClass(key);
				break;
			case DescValueType.OBJECTTYPE:
				value = this.actionDescriptorToObject(desc.getObjectValue(key));//+" - "+desc.getObjectType(key);
				break;
			case DescValueType.ENUMERATEDTYPE:
				value = typeIDToStringID(desc.getEnumerationValue(key));
				break;
			case DescValueType.DOUBLETYPE:
				value = desc.getDouble(key);
				break;
			case DescValueType.INTEGERTYPE:
				value = desc.getInteger(key);
				break;
			case DescValueType.LARGEINTEGERTYPE:
				value = desc.getLargeInteger(key);
				break;
			case DescValueType.LISTTYPE:
				value = desc.getList(key);
				break;
			case DescValueType.RAWTYPE:
	      		// not implemented
				break;
			case DescValueType.REFERENCETYPE:
				value = desc.getReference(key);
				break;
			case DescValueType.STRINGTYPE:
				value = desc.getString(key);
				break;
			case DescValueType.UNITDOUBLE:
				value = desc.getUnitDoubleValue(key);
				break;
		}
		return value;
	},

	/*
	 * Create bubble rounded area
	 */
	createRoundedRectangle : function( tBounds, tColor, tAlpha, tCornerRadius )
	{
	    var idMk = charIDToTypeID( "Mk  " );
	    var desc15 = new ActionDescriptor();
	    var idnull = charIDToTypeID( "null" );
	    var ref6 = new ActionReference();
	    var idcontentLayer = stringIDToTypeID( "contentLayer" );
	    ref6.putClass( idcontentLayer );
	    desc15.putReference( idnull, ref6 );
	    var idUsng = charIDToTypeID( "Usng" );
	    var desc16 = new ActionDescriptor();
	    var idType = charIDToTypeID( "Type" );
	    var desc17 = new ActionDescriptor();
	    var idClr = charIDToTypeID( "Clr " );

	    var desc18 = new ActionDescriptor();
	    var idRd = charIDToTypeID( "Rd  " );
	    desc18.putDouble( idRd, tColor.r );
	    var idGrn = charIDToTypeID( "Grn " );
	    desc18.putDouble( idGrn, tColor.g );
	    var idBl = charIDToTypeID( "Bl  " );
	    desc18.putDouble( idBl, tColor.b );

	    var idRGBC = charIDToTypeID( "RGBC" );
	    desc17.putObject( idClr, idRGBC, desc18 );
	    var idsolidColorLayer = stringIDToTypeID( "solidColorLayer" );
	    desc16.putObject( idType, idsolidColorLayer, desc17 );
	    var idShp = charIDToTypeID( "Shp " );
	    var desc19 = new ActionDescriptor();
	    var idTop = charIDToTypeID( "Top " );
	    var idPxl = charIDToTypeID( "#Pxl" );
	    desc19.putUnitDouble( idTop, idPxl, tBounds.topy );
	    var idLeft = charIDToTypeID( "Left" );
	    var idPxl = charIDToTypeID( "#Pxl" );
	    desc19.putUnitDouble( idLeft, idPxl, tBounds.topx );
	    var idBtom = charIDToTypeID( "Btom" );
	    var idPxl = charIDToTypeID( "#Pxl" );
	    desc19.putUnitDouble( idBtom, idPxl, tBounds.bottomy );
	    var idRght = charIDToTypeID( "Rght" );
	    var idPxl = charIDToTypeID( "#Pxl" );
	    desc19.putUnitDouble( idRght, idPxl, tBounds.bottomx );
	    var idRds = charIDToTypeID( "Rds " );
	    var idPxl = charIDToTypeID( "#Pxl" );
	    desc19.putUnitDouble( idRds, idPxl, tCornerRadius );
	    var idRctn = charIDToTypeID( "Rctn" );
	    desc16.putObject( idShp, idRctn, desc19 );

	    var idstrokeStyle = stringIDToTypeID( "strokeStyle" );
	    var desc20 = new ActionDescriptor();
	    var idstrokeStyleVersion = stringIDToTypeID( "strokeStyleVersion" );
	    desc20.putInteger( idstrokeStyleVersion, 2 );
	    var idstrokeEnabled = stringIDToTypeID( "strokeEnabled" );
	    desc20.putBoolean( idstrokeEnabled, false );
	    var idfillEnabled = stringIDToTypeID( "fillEnabled" );
	    desc20.putBoolean( idfillEnabled, true );
	    var idstrokeStyleLineWidth = stringIDToTypeID( "strokeStyleLineWidth" );
	    var idPnt = charIDToTypeID( "#Pnt" );
	    desc20.putUnitDouble( idstrokeStyleLineWidth, idPnt, 10.000000 );
	    var idstrokeStyleLineDashOffset = stringIDToTypeID( "strokeStyleLineDashOffset" );
	    var idPnt = charIDToTypeID( "#Pnt" );
	    desc20.putUnitDouble( idstrokeStyleLineDashOffset, idPnt, 0.000000 );
	    var idstrokeStyleMiterLimit = stringIDToTypeID( "strokeStyleMiterLimit" );
	    desc20.putDouble( idstrokeStyleMiterLimit, 100.000000 );
	    var idstrokeStyleLineCapType = stringIDToTypeID( "strokeStyleLineCapType" );
	    var idstrokeStyleLineCapType = stringIDToTypeID( "strokeStyleLineCapType" );
	    var idstrokeStyleRoundCap = stringIDToTypeID( "strokeStyleRoundCap" );
	    desc20.putEnumerated( idstrokeStyleLineCapType, idstrokeStyleLineCapType, idstrokeStyleRoundCap );
	    var idstrokeStyleLineJoinType = stringIDToTypeID( "strokeStyleLineJoinType" );
	    var idstrokeStyleLineJoinType = stringIDToTypeID( "strokeStyleLineJoinType" );
	    var idstrokeStyleRoundJoin = stringIDToTypeID( "strokeStyleRoundJoin" );
	    desc20.putEnumerated( idstrokeStyleLineJoinType, idstrokeStyleLineJoinType, idstrokeStyleRoundJoin );
	    var idstrokeStyleLineAlignment = stringIDToTypeID( "strokeStyleLineAlignment" );
	    var idstrokeStyleLineAlignment = stringIDToTypeID( "strokeStyleLineAlignment" );
	    var idstrokeStyleAlignCenter = stringIDToTypeID( "strokeStyleAlignCenter" );
	    desc20.putEnumerated( idstrokeStyleLineAlignment, idstrokeStyleLineAlignment, idstrokeStyleAlignCenter );
	    var idstrokeStyleScaleLock = stringIDToTypeID( "strokeStyleScaleLock" );
	    desc20.putBoolean( idstrokeStyleScaleLock, false );
	    var idstrokeStyleStrokeAdjust = stringIDToTypeID( "strokeStyleStrokeAdjust" );
	    desc20.putBoolean( idstrokeStyleStrokeAdjust, false );
	    var idstrokeStyleLineDashSet = stringIDToTypeID( "strokeStyleLineDashSet" );
	    var list2 = new ActionList();
	    var idNne = charIDToTypeID( "#Nne" );
	    list2.putUnitDouble( idNne, 0.140000 );
	    var idNne = charIDToTypeID( "#Nne" );
	    list2.putUnitDouble( idNne, 1.400000 );
	    desc20.putList( idstrokeStyleLineDashSet, list2 );
	    var idstrokeStyleBlendMode = stringIDToTypeID( "strokeStyleBlendMode" );
	    var idBlnM = charIDToTypeID( "BlnM" );
	    var idNrml = charIDToTypeID( "Nrml" );
	    desc20.putEnumerated( idstrokeStyleBlendMode, idBlnM, idNrml );
	    var idstrokeStyleOpacity = stringIDToTypeID( "strokeStyleOpacity" );
	    var idPrc = charIDToTypeID( "#Prc" );
	    desc20.putUnitDouble( idstrokeStyleOpacity, idPrc, 100.000000 );
	    var idstrokeStyleContent = stringIDToTypeID( "strokeStyleContent" );
	    var desc21 = new ActionDescriptor();
	    var idClr = charIDToTypeID( "Clr " );
	    var desc22 = new ActionDescriptor();
	    var idRd = charIDToTypeID( "Rd  " );
	    desc22.putDouble( idRd, 255.000000 );
	    var idGrn = charIDToTypeID( "Grn " );
	    desc22.putDouble( idGrn, 255.000000 );
	    var idBl = charIDToTypeID( "Bl  " );
	    desc22.putDouble( idBl, 255.000000 );
	    var idRGBC = charIDToTypeID( "RGBC" );
	    desc21.putObject( idClr, idRGBC, desc22 );
	    var idsolidColorLayer = stringIDToTypeID( "solidColorLayer" );
	    desc20.putObject( idstrokeStyleContent, idsolidColorLayer, desc21 );
	    var idstrokeStyleResolution = stringIDToTypeID( "strokeStyleResolution" );
	    desc20.putDouble( idstrokeStyleResolution, 72.000000 );
	    var idstrokeStyle = stringIDToTypeID( "strokeStyle" );
	    desc16.putObject( idstrokeStyle, idstrokeStyle, desc20 );
	    var idcontentLayer = stringIDToTypeID( "contentLayer" );
	    desc15.putObject( idUsng, idcontentLayer, desc16 );
	    executeAction( idMk, desc15, DialogModes.NO );

	    //set opacity
	    var idsetd = charIDToTypeID( "setd" );
	    var desc36 = new ActionDescriptor();
	    var idnull = charIDToTypeID( "null" );
	    var ref18 = new ActionReference();
	    var idLyr = charIDToTypeID( "Lyr " );
	    var idOrdn = charIDToTypeID( "Ordn" );
	    var idTrgt = charIDToTypeID( "Trgt" );
	    ref18.putEnumerated( idLyr, idOrdn, idTrgt );
	    desc36.putReference( idnull, ref18 );
	    var idT = charIDToTypeID( "T   " );
	    var desc37 = new ActionDescriptor();
	    var idOpct = charIDToTypeID( "Opct" );
	    var idPrc = charIDToTypeID( "#Prc" );
	    desc37.putUnitDouble( idOpct, idPrc, tAlpha );
	    var idLyr = charIDToTypeID( "Lyr " );
	    desc36.putObject( idT, idLyr, desc37 );
	    executeAction( idsetd, desc36, DialogModes.NO );

	    this.doc.activeLayer.name = this.settings.bubble.layerName;
	},
	

	/*
	 * returns an array of 
	 * selected layer references
	 */
	getSelectedLayersIdx : function() 
	{
		var selectedLayers = new Array;
		var ref = new ActionReference();
		ref.putEnumerated( charIDToTypeID('Dcmn'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
		var desc = executeActionGet(ref);

		if( desc.hasKey( stringIDToTypeID( 'targetLayers' ) ) )
		{
			desc = desc.getList( stringIDToTypeID( 'targetLayers' ));
			var c = desc.count
			var selectedLayers = new Array();
			for(var i=0;i<c;i++)
			{
				try
				{
					activeDocument.backgroundLayer;
					selectedLayers.push(  desc.getReference( i ).getIndex() );
				} 
				catch(e)
				{
				selectedLayers.push(  desc.getReference( i ).getIndex()+1 );
			}
		}
		} else 
		{
			var ref = new ActionReference();
			ref.putProperty( charIDToTypeID('Prpr') , charIDToTypeID( 'ItmI' ));
			ref.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
			try
			{
				activeDocument.backgroundLayer;
				selectedLayers.push( executeActionGet(ref).getInteger(charIDToTypeID( 'ItmI' ))-1);
			} catch(e)
			{
				selectedLayers.push( executeActionGet(ref).getInteger(charIDToTypeID( 'ItmI' )));
			}
		}
		return selectedLayers;
	},

	measureSelX : function( targetSelection )
	{
		var layerX1     = targetSelection.bounds[0];
		var layerY1     = targetSelection.bounds[1];
		var layerX2     = targetSelection.bounds[2];
		var layerY2     = targetSelection.bounds[3];
		var layerW      = layerX2 - layerX1;
		var layerH      = layerY2 - layerY1;
		var layerHalfW  = layerW / 2;
		var layerHalfH  = layerH / 2;

		//create a selection ink folder
		var selectionFolder      = this.inkFolder.layerSets.add(); 
		selectionFolder.name     = this.selectionsFolderName;

		//ruler
		if ( this.settings.selection.rulerSpacing ) 
		{
			this.drawRuler( "h", layerX1 , (layerY2 + this.settings.rulerYSpacing) , ( layerX2 - layerX1 ) );
		} else 
		{
			this.drawRuler( "h", layerX1 , layerY2 , ( layerX2 - layerX1 ) );	
		}
		
		this.rulers.push( { ref:this.doc.activeLayer, type:"h", txtRef:undefined } );
		this.doc.activeLayer.move(selectionFolder, ElementPlacement.INSIDE);

		//text
		var measureTxt;
		if ( this.settings.printUnits == "on" ) {
			measureTxt = layerW.toString();
		}
		else {
			measureTxt = Number(layerW);
		}

		//measure txt position
		var measureTxtX = layerX1 + layerHalfW;
		var measureTxtY = layerY2 + this.settings.rulerYSpacing + this.settings.rulerBraceLength + this.settings.measuresFontSize;

		Layers.createText(this.settings.measuresFont, this.settings.measuresFontSize, this.settings.measuresFontColor, measureTxt, measureTxtX, measureTxtY, Justification.CENTER, layerW.toString());
		this.doc.activeLayer.move(selectionFolder, ElementPlacement.INSIDE);
		this.rulers[this.rulers.length-1].txtRef =  this.doc.activeLayer;

		//set selection back.
		app.activeDocument.selection.select( [ [layerX1,layerY1],[layerX2,layerY1],[layerX2,layerY2],[layerX1,layerY2] ] );
	},

	/* 
	 * Measure selection height 
	 */
	measureSelY : function( targetSelection )
	{
		var layerX1     = targetSelection.bounds[0];
		var layerY1     = targetSelection.bounds[1];
		var layerX2     = targetSelection.bounds[2];
		var layerY2     = targetSelection.bounds[3];
		var layerW      = layerX2 - layerX1;
		var layerH      = layerY2 - layerY1;
		var layerHalfW  = layerW / 2;
		var layerHalfH  = layerH / 2;

		//create a selection ink folder
		var selectionFolder      = this.inkFolder.layerSets.add(); 
		selectionFolder.name     = this.selectionsFolderName;

		//ruler
		if ( this.settings.selection.rulerSpacing ) 
		{
			this.drawRuler( "v", (layerX2 + this.settings.rulerXSpacing) , layerY1, ( layerY2 - layerY1 ) );
		} else 
		{
			this.drawRuler( "v", layerX2 , layerY1, ( layerY2 - layerY1 ) );	
		}

		this.rulers.push( { ref:this.doc.activeLayer, type:"v", txtRef:undefined } );
		this.doc.activeLayer.move(selectionFolder, ElementPlacement.INSIDE);

		//text
		var measureTxt;
		if ( this.settings.printUnits == "on" ) {
			measureTxt = layerH.toString();
		}
		else {
			measureTxt = Number(layerH);
		}

		//measure txt position
		var measureTxtX = layerX2 + this.settings.measuresXSpacing + this.settings.rulerBraceLength;
		var measureTxtY = layerY1 + layerHalfH + Math.round(this.settings.measuresFontSize * 0.25);

		Layers.createText(this.settings.measuresFont, this.settings.measuresFontSize, this.settings.measuresFontColor, layerH.toString(), measureTxtX, measureTxtY, Justification.LEFT, layerH.toString());
		this.doc.activeLayer.move(selectionFolder, ElementPlacement.INSIDE);
		this.rulers[this.rulers.length-1].txtRef =  this.doc.activeLayer;	

		//set selection back.
		app.activeDocument.selection.select( [ [layerX1,layerY1],[layerX2,layerY1],[layerX2,layerY2],[layerX1,layerY2] ] );	
	},

	/* 
	 * Measure layer width 
	 */
	measureX : function( targetLayer, targetLayerInkFolder ) 
	{
		//ruler
		this.drawRuler( "h", this.theLayerBounds.x1 , (this.theLayerBounds.y2 + this.settings.rulerYSpacing) , ( this.theLayerBounds.x2 - this.theLayerBounds.x1 ) );
		this.rulers.push( { ref:this.doc.activeLayer, type:"h", txtRef:undefined } );
		this.doc.activeLayer.move(targetLayerInkFolder, ElementPlacement.INSIDE);

		//text
		var measureTxt;
		if ( this.settings.printUnits == "on" ) {
			measureTxt = this.theLayerBounds.w.toString();
		}
		else {
			measureTxt = Number(this.theLayerBounds.w);
		}
		
		//measure txt position
		var measureTxtX = this.theLayerBounds.x1 + this.theLayerBounds.halfw;
		var measureTxtY = this.theLayerBounds.y2 + this.settings.rulerYSpacing + this.settings.rulerBraceLength + this.settings.measuresFontSize;
		
		Layers.createText(this.settings.measuresFont, this.settings.measuresFontSize, this.settings.measuresFontColor, measureTxt, measureTxtX, measureTxtY, Justification.CENTER, this.theLayerBounds.w.toString());
		this.doc.activeLayer.move(targetLayerInkFolder, ElementPlacement.INSIDE);
		this.rulers[this.rulers.length-1].txtRef =  this.doc.activeLayer;
	},

	/* 
	 * Measure layer height
	 */
	measureY : function( targetLayer, targetLayerInkFolder ) 
	{
		//ruler
		this.drawRuler( "v", (this.theLayerBounds.x2 + this.settings.rulerXSpacing) , this.theLayerBounds.y1, ( this.theLayerBounds.y2 - this.theLayerBounds.y1 ) );
		this.rulers.push( { ref:this.doc.activeLayer, type:"v", txtRef:undefined } );
		this.doc.activeLayer.move(targetLayerInkFolder, ElementPlacement.INSIDE);

		//text
		var measureTxt;
		if ( this.settings.printUnits == "on" ) 
		{
			measureTxt = this.theLayerBounds.h.toString();
		}
		else 
		{
			measureTxt = Number(this.theLayerBounds.h);
		}

		//measure txt position
		var measureTxtX = this.theLayerBounds.x2 + this.settings.measuresXSpacing + this.settings.rulerBraceLength;
		var measureTxtY = this.theLayerBounds.y1 + this.theLayerBounds.halfh + Math.round(this.settings.measuresFontSize * 0.25);

		Layers.createText(this.settings.measuresFont, this.settings.measuresFontSize, this.settings.measuresFontColor, measureTxt, measureTxtX, measureTxtY, Justification.LEFT, this.theLayerBounds.h.toString());
		this.doc.activeLayer.move(targetLayerInkFolder, ElementPlacement.INSIDE);
		this.rulers[this.rulers.length-1].txtRef =  this.doc.activeLayer;	
	},

	/*
	 * Debug utils
	 */
	printObjectProps : function( obj, indent )
	{
	    for( var key in obj ) 
	    {
	        this.console( indent +  key + ": " + obj[key] );
	    }
	},


	/*
	 * look for an FX inside layer fx list
	 * fx type can be: "dropShadow","innerShadow","frameFX","gradientFill","solidFill"
	 */
	searchForLayerFxID : function( fxList, type ) 
	{
		var layerFxID = -1;
		for ( var i = 0; i < fxList.length; i++ ) 
		{
			if ( type == fxList[i].type ) 
			{
				layerFxID = i;
				break;
			}
		}
		return layerFxID;
	},
};

//for internal testing.
//$._ext_INK.run('on,on,on,on,on,#ffffff,#ff0000,#ff0000,10,1,hex,layerMeasureX,layerMeasureY,layerDocumentation');
