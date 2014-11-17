geocsv-info
===========

node.js utility for finding out more information about a spatial csv file

## Example

```js
var geocsvinfo = require('geocsv-info');

geocsvinfo('example.csv', function(err, info){
	console.log(info);
}); 

//result
info = { 
	count: 3,
	separator: '|',
	headers: [ 'id', 'name', 'wkt' ],
	fields: {
		id: 'Number',
		name: 'String',
		wkt: 'String'
	},
	geometryField: { 
		id: 2, 
		name: 'wkt', 
		encoding: 'WKT' 
	},
	extent: { minX: 10, minY: 10, maxX: 45, maxY: 40 } 
};
```

## Supported Geometry Encoding

- `'WKT'`
- `'GeoJSON'`
- `'PointFromColumns'` *(latitude/longitude)*

## Options

- `'separator'` : *char*
	+ *use specified character as separator instead of autodetecting it*
- `'estimate'` : *int*
	+ *max # of features to compute extent from*

## Output

- `count`: *int*
	+ total # of features
- `filesize`: *int*
	+ total filesize in bytes
- `separator`: *char*
- `headers`: *string[]*
	+ list of all field names
- `fields`: *object*
	+ an object mapping each fieldname to its basic type (`"Number"` or `"String"`). includes geometry fields interpreted as if it was a normal csv
- `geometryField`: *object*
	+ `encoding`: `"WKT"`, `"GeoJSON"`, or `"PointFromColumns"`
	+ `name`: *string | object* 
		+ string for WKT, GeoJSON encoding
		+ object with `x`, `y` properties for geometry with PointFromColumns encoding
	+ `id`: *int | object* 
		+ field index
		+ int for WKT, GeoJSON encoding
		+ object with `x`, `y` properties for geometry with PointFromColumns encoding
- `extent`: *object*
	+ `minX` : *number*
	+ `minY` : *number*
	+ `maxX` : *number*
	+ `maxY` : *number* 