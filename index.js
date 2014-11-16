var fs = require('fs');
var csv = require('csv-parser');
var byline = require('byline');
var through2 = require('through2')

module.exports = function(filename, options, callback){
	if(arguments.length == 2){
		callback = options;
		options = null;
	}

	options = options || {};

	var has_json = false;
	var first    = true;
	var exited   = false;
	var minX = Number.POSITIVE_INFINITY;
	var minY = Number.POSITIVE_INFINITY;
	var maxX = Number.NEGATIVE_INFINITY;
	var maxY = Number.NEGATIVE_INFINITY;
	var getExtent;
	var info = {
		count: 0
	};

	var done = function(err){
		if(!exited){
			exited = true;
			callback(err, err ? null : info);
		}
	}

	var filestream   = fs.createReadStream(filename, { encoding: 'utf8' });
	var csvparser    = csv();
	var geocsvparser = through2(function(line, enc, callback){
		line = line.toString();

		if(first){
			first = false; 
			
			//Detect separator
			info.separator = options.separator || module.exports.detectSeparator(line);
			if(!info.separator){
				return callback("Cant determine CSV separator");
			}
			csvparser.separator = new Buffer(info.separator)[0];

			//Detect fields
			info.headers = line.split(info.separator).map(function(str){
				return str.trim();
			});

			//Detect geometry field
			info.geometry_field = module.exports.detectGeometryField(info.headers);
			if(!info.geometry_field){
				return callback("Unable to determine geometry field in CSV");
			}
			has_json  = info.geometry_field.encoding === 'GeoJSON';
			getExtent = module.exports.getExtentParser(info.geometry_field);

		} else if(has_json) {
			line = module.exports.fixJSONQuoting(line);
		}

		this.push(line+'\n');
		callback();
	});

	filestream.on('error', done);
	geocsvparser.on('error', done);

	var stream = byline(filestream).pipe(geocsvparser).pipe(csvparser);
	
	stream.on('data', function(row_obj){
		info.count++;

		var extent = getExtent(row_obj);
		minX = Math.min(minX, extent.minX);
		minY = Math.min(minY, extent.minY);
		maxX = Math.max(maxX, extent.maxX);
		maxY = Math.max(maxY, extent.maxY);
	});
	stream.on('error', done);
	stream.on('end', function(){
		info.extent = {
			minX: minX,
			minY: minY,
			maxX: maxX,
			maxY: maxY
		}
		done();
	});
}

module.exports.getExtentParser = function(geometry_field){
	if(geometry_field.encoding === 'WKT'){
		var field_wkt = geometry_field.name;
		return function(row){
			return module.exports.getWKTExtent(row[field_wkt]);
		}
	} else if (geometry_field.encoding === 'GeoJSON') {
		var field_json = geometry_field.name;
		return function(row){
			return module.exports.getJSONExtent(row[field_json]);
		}
	} else {
		var field_x = geometry_field.name.x;
		var field_y = geometry_field.name.y;
		return function(row){
			var x = parseFloat(row[field_x]);
			var y = parseFloat(row[field_y]);
			return [x, y, x, y];
		}
	}
}

module.exports.detectGeometryField = function(fieldnames){
	//adapted from: https://github.com/mapnik/mapnik/blob/f42805a5321d42f59b447a70f459058cf2c6cd5c/plugins/input/csv/csv_datasource.cpp#L293
	var result;
	for(var i = 0; i<fieldnames.length; i++){
		var name = fieldnames[i].toLowerCase();
		if(name == 'wkt' || name.indexOf('geom') > -1) {
			result = {
				id: i,
				name: fieldnames[i],
				encoding: "WKT"
			}
			break;
		}
		if(name == 'geojson') {
			result = {
				id: i,
				name: fieldnames[i],
				encoding: "GeoJSON"
			};
			break;
		}
		if(name == 'x'
			|| name == 'lon' 
			|| name == 'lng'
			|| name == 'long'
			|| name.indexOf('longitude') > -1)
		{

			result = result || {
				id: {},
				name: {},
				encoding: "PointFromColumns"
			}
			result.id.x   = i;
			result.name.x = name;
			continue;
		}
		if(name == 'y'
			|| name == 'lat' 
			|| name.indexOf('latitude') > -1)
		{

			result = result || {
				id: {},
				name: {},
				encoding: "PointFromColumns"
			}
			result.id.y   = i;
			result.name.y = name;
			continue;
		}
	}
	return result;
}

module.exports.detectSeparator = function(csv_line) {
	//implemented like: https://github.com/mapnik/mapnik/blob/f42805a5321d42f59b447a70f459058cf2c6cd5c/plugins/input/csv/csv_datasource.cpp#L209

	var separators = [',','\t','|',';'];
	var counts = separators.map(function(separator){
		return csv_line.split(separator).length-1;
	});
	
	var best = null, max = 0; 
	for(i=0; i<4; i++){
		if(counts[i] > max){
			max = counts[i];
			best = separators[i];
		}
	}
	return best;
}

module.exports.fixJSONQuoting = function(csv_line) {
	// TODO: adapt from https://github.com/mapnik/mapnik/blob/14cf32d9c075cf87c228ed74423bb27bfe8ee73e/plugins/input/csv/csv_utils.hpp
	// maybe unnecessary
	return csv_line;
}


module.exports.getJSONExtent=function(str){
	// example inputs: 
	// "{\"type\":\"Point\",\"coordinates\":[30.0,10.0]}" // escaped "
	// '{"type":"Point","coordinates":[30.0,10.0]}' // single quotes no need for escaping "
	// "{""type"":""Point"",""coordinates"":[30.0,10.0]}" // filebakery.com style ""

	//Assumption: coordinate array will be the only array in a JSON object
	//1. Strip away all characters but array text
	//2. Remove any brackets/whitespace, and remove repeated commas (may be unnecessary if no empty sub arrays)
	//3. Parse JSON
	str = str.substring(str.indexOf('['), str.lastIndexOf(']')); 
	str = str.replace(/[\[\]\s]/g, '').replace(/\,{2,}/g, ','); 

	return getArrayExtent(JSON.parse('['+str+']'));
}

module.exports.getWKTExtent=function(str){
	//TODO: optimize
	str = str.substring(str.indexOf('('), str.lastIndexOf(')'));
	str = str.replace(/[\(\)]/g, '')
	str = str.replace(/\ {2,}/g, ' ').replace(/ /g, ',').replace(/\,{2,}/g, ','); 

	console.log(str);

	return getArrayExtent(JSON.parse('['+str+']'));
}

function getArrayExtent(arr) {
	var len = arr.length;
	var dim = len % 3 == 0 ? 3 : 2;

	var minX = Number.POSITIVE_INFINITY;
	var minY = Number.POSITIVE_INFINITY;
	var maxX = Number.NEGATIVE_INFINITY;
	var maxY = Number.NEGATIVE_INFINITY;

	for(var i=0; i<len; i+=dim){
		var x = arr[i];
		var y = arr[i+1];
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	}

	return {minX:minX, minY:minY, maxX:maxX, maxY:maxY};
}