var fs = require('fs');
var csv = require('csv-parser');
var byline = require('byline');
var through2 = require('through2');
var coordinateParsers = require('./geometry_parsers.js');

module.exports = function(filename, options, callback){
	if(arguments.length == 2){
		callback = options;
		options = null;
	}

	options = options || {};

	fs.stat(filename, function(err, stats) {
		if(err) return callback(err);

		var filesize = stats.size;
		var estimate = options.estimate; 
		var row_estimate = 0;
		var rows_to_skip = 0;
		var warning  = null;
		var has_json = false;
		var first    = true;
		var exited   = false;
		var minX = Number.POSITIVE_INFINITY;
		var minY = Number.POSITIVE_INFINITY;
		var maxX = Number.NEGATIVE_INFINITY;
		var maxY = Number.NEGATIVE_INFINITY;
		var getExtent;
		var info = {
			count: 0,
			tested: 0,
			filesize: filesize
		};

		var done = function(err){
			if(!exited){
				exited = true;
				callback(err || warning || null, err ? null : info);
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
					return callback("Can't determine CSV separator");
				}
				csvparser.separator = new Buffer(info.separator)[0];

				//Detect fields
				info.headers = line.split(info.separator);

				//Detect geometry field
				info.geometryField = module.exports.detectGeometryField(info.headers);
				if(!info.geometryField){
					return callback("Unable to determine geometry field in CSV");
				}
				has_json  = info.geometryField.encoding === 'GeoJSON';
				getExtent = module.exports.getExtentParser(info.geometryField);
			} else {
				info.count++;

				if(estimate){
				 	if(rows_to_skip-- < 1){
						row_estimate += filesize/(Math.max(line.length,10));
						if(info.count > 1) row_estimate /= 2; 
						rows_to_skip = Math.floor(row_estimate / estimate);
					} else {
						return callback();
					}
				}

				if(has_json) {
					try {
						line = module.exports.fixJSONQuoting(line);
					} catch(err) {
						return callback("Unable to parse JSON geometry in CSV");
					}
				}
			}

			this.push(line+'\n');
			callback();
		});

		filestream.on('error', done);
		geocsvparser.on('error', done);

		var stream = byline(filestream).pipe(geocsvparser).pipe(csvparser);
		
		stream.on('data', function(row_obj){
			info.tested++;

			if(!info.fields){
				info.fields = {};
				info.headers.forEach(function(fieldname){
					var is_number = /^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(row_obj[fieldname]);
					info.fields[fieldname] = is_number ? 'Number' : 'String'; 
				});
			}

			var extent; 
			try {
				extent = getExtent(row_obj);
			} catch(err) {
				warning = "Invalid geometry at feature "+(info.count-1);
				extent  = null;
			}

			if(extent){
				minX = Math.min(minX, extent.minX);
				minY = Math.min(minY, extent.minY);
				maxX = Math.max(maxX, extent.maxX);
				maxY = Math.max(maxY, extent.maxY);
			}
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

	});
}

module.exports.getExtentParser = function(geometryField){
	if(geometryField.encoding === 'PointFromColumns') {
		var field_x = geometryField.name.x;
		var field_y = geometryField.name.y;
		return function(row){
			var x = parseFloat(row[field_x]);
			var y = parseFloat(row[field_y]);
			return {minX: x, minY: y, maxX: x, maxY: y};
		}
	} else {
		var parseCoordinates = coordinateParsers[geometryField.encoding];
		var field_geom = geometryField.name;
		return function(row){
			var coordinates;
			coordinates = parseCoordinates(row[field_geom])
			return getArrayExtent(coordinates);
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
			result.name.x = fieldnames[i];
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
			result.name.y = fieldnames[i];
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
	//normalizes geometry quoting to 'filebakery style' which is supported by csv-parser

	var chunks = csv_line.match(/(.*)["']{(.*)}['"](.*)/);

	if(chunks.length > 2){
		chunks[2] = '"{'+chunks[2].replace(/\\?"+/g,'""')+'}"';
		return (chunks[1]||'')+chunks[2]+(chunks[3]||'');
	} else {
		return csv_line;
	}
}

function getArrayExtent(coords) {
	var dim = coords.dim;
	var arr = coords.arr;
	var len = arr.length;

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