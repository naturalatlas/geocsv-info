var geocsvinfo = require('../index.js');
var assert = require('chai').assert;
var path = require('path');

var f = function(filename){
	return path.resolve(__dirname,'data',filename);
};

describe('geocsvinfo()', function(){
	it('should return error if file not found', function(done){
		geocsvinfo('bad filename', function(err, info){
			assert.isNotNull(err);
			done();
		});
	});
	it('should return an error if file doesnt have geometry', function(done){
		geocsvinfo(f('./nonspatial.csv'), function(err, info){
			assert.isNotNull(err);
			assert(err.indexOf('Unable to determine geometry field') == 0, 'threw an unable to determine geometry field error');
			done();
		});
	});
	describe('separator detection', function(){
		it('should recognize pipe separator', function(done){
			geocsvinfo(f('./separators/pipes.csv'), function(err, info){
				assert.isNull(err);
				assert.equal(info.separator, '|');
				done();
			});
		});
		it('should recognize semicolon separator', function(done){
			geocsvinfo(f('./separators/semicolons.csv'), function(err, info){
				assert.isNull(err);
				assert.equal(info.separator, ';');
				done();
			});
		});
		it('should recognize comma separator', function(done){
			geocsvinfo(f('./separators/commas.csv'), function(err, info){
				assert.isNull(err);
				assert.equal(info.separator, ',');
				done();
			});
		});
		it('should recognize tab separator', function(done){
			geocsvinfo(f('./separators/tabs.csv'), function(err, info){
				assert.isNull(err);
				assert.equal(info.separator, '\t');
				done();
			});
		});
		it('should use separator option', function(done){
			var opts = {separator: ' '};
			geocsvinfo(f('./separators/spaces.csv'), opts, function(err, info){
				assert.isNull(err);
				assert.equal(info.separator, ' ');
				done();
			});
		});
		it('should return error if unable to detect separator', function(done){
			geocsvinfo(f('./separators/spaces.csv'), function(err, info){
				assert.equal(err, "Can't determine CSV separator");
				assert.isNull(info);
				done();
			});
		});
	});
	describe('WKT extent computation', function(){
		it('should work with 2D geometry', function(done){
			geocsvinfo(f('./wkt/wkt.csv'), function(err, info){
				assert.isNull(err);
				assert.deepEqual(info.extent, {
					minX: 10,
					maxX: 45,
					minY: -50,
					maxY: 55
				});
				done();
			});
		});
		it('should work with 3D geometry', function(done){
			geocsvinfo(f('./wkt/wkt_3d.csv'), function(err, info){
				assert.isNull(err);
				assert.deepEqual(info.extent, {
					minX: 10,
					maxX: 40,
					minY: 15,
					maxY: 45
				});
				done();
			});
		});
		it('should return error if invalid geometry', function(done){
			geocsvinfo(f('./wkt/wkt_invalid.csv'), function(err, info){
				assert.isNotNull(err);
				assert(err.indexOf('Invalid geometry') == 0, 'invalid geometry error');
				done();
			});
		});
	});

	describe('GeoJSON extent computation', function(){
		it('should work with 3D geometry', function(done){
			geocsvinfo(f('./geojson/geojson_3d.csv'), function(err, info){
				assert.isNull(err);
				assert.deepEqual(info.extent, {
					minX: 100,
					maxX: 105,
					minY: 0,
					maxY: 1
				});
				done();
			});
		});
		it('should work with geometry wrapped in single quotes', function(done){
			geocsvinfo(f('./geojson/geojson_single.csv'), function(err, info){
				assert.isNull(err);
				assert.deepEqual(info.extent, {
					minX: 100,
					maxX: 105,
					minY: 0,
					maxY: 1
				});
				done();
			});
		});
		it('should work with geometry using  quotes escaped with a quote', function(done){
			geocsvinfo(f('./geojson/geojson_filebakery.csv'), function(err, info){
				assert.isNull(err);
				assert.deepEqual(info.extent, {
					minX: 100,
					maxX: 105,
					minY: 0,
					maxY: 1
				});
				done();
			});
		});
		it('should work with geometry using  quotes escaped with a backslash', function(done){
			geocsvinfo(f('./geojson/geojson_escaped.csv'), function(err, info){
				assert.isNull(err);
				assert.deepEqual(info.extent, {
					minX: 100,
					maxX: 105,
					minY: 0,
					maxY: 1
				});
				done();
			});
		});
		it('should return error if invalid geometry', function(done){
			geocsvinfo(f('./geojson/geojson_invalid.csv'), function(err, info){
				assert.isNotNull(err);
				assert(err.indexOf('Invalid geometry') == 0, 'invalid geometry error');
				done();
			});
		});
	});
	describe('w/ PointFromColumns geometry', function(){
		it('should work with latitude/longitude columns', function(done){
			geocsvinfo(f('./pointfromcolumns/pointfromcolumns_latitudelongitude.csv'), function(err, info){
				assert.isNull(err);
					assert.deepEqual(info.extent, {
					minX: -113,
					maxX: -110,
					minY: 43,
					maxY: 46
				});
				done();
			});
		});
		it('should work with lat/lng columns', function(done){
			geocsvinfo(f('./pointfromcolumns/pointfromcolumns_latlng.csv'), function(err, info){
				assert.isNull(err);
					assert.deepEqual(info.extent, {
					minX: -113,
					maxX: -110,
					minY: 43,
					maxY: 46
				});
				done();
			});
		});
		it('should work with lat/lon columns', function(done){
			geocsvinfo(f('./pointfromcolumns/pointfromcolumns_latlon.csv'), function(err, info){
				assert.isNull(err);
					assert.deepEqual(info.extent, {
					minX: -113,
					maxX: -110,
					minY: 43,
					maxY: 46
				});
				done();
			});
		});
		it('should work with x/y columns', function(done){
			geocsvinfo(f('./pointfromcolumns/pointfromcolumns_yx.csv'), function(err, info){
				assert.isNull(err);
					assert.deepEqual(info.extent, {
					minX: -113,
					maxX: -110,
					minY: 43,
					maxY: 46
				});
				done();
			});
		});
	});
});
