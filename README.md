# geocsv-info
[![NPM version](http://img.shields.io/npm/v/geocsv-info.svg)](https://www.npmjs.org/package/geocsv-info)
[![Build Status](http://img.shields.io/travis/naturalatlas/geocsv-info/master.svg)](https://travis-ci.org/naturalatlas/geocsv-info)
[![Coverage Status](http://img.shields.io/coveralls/naturalatlas/geocsv-info/master.svg)](https://coveralls.io/r/naturalatlas/geocsv-info)

A utility for finding out more information about a spatial CSV file.

```sh
$ npm install geocsv-info --save
```

## Example

```js
var geocsvinfo = require('geocsv-info');

geocsvinfo('example.csv', function(err, info){
	console.log(info);
}); 
```

### Output

```js
{ 
	count: 3,
	separator: '|',
	headers: ['id', 'name', 'wkt'],
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
	extent: {
        minX: 10,
        minY: 10,
        maxX: 45,
        maxY: 40
    } 
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

## License

Copyright &copy; 2013 [Brandon Reavis](http://github.com/brandonreavis)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
