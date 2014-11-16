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
	geometry_field: { 
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