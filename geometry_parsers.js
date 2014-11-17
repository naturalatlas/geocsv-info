/**
 * Methods that return a flattened coordinate array
 *
 * Note: these could use some optimizing
 *
 * 2D: [x0, y0, x1, y1]
 * 3D: [x0, y0, z0, x1, y1, z1]
 */
module.exports = {

	WKT: function(str) {
		str = str.substring(str.indexOf('('), str.lastIndexOf(')')).replace(/\ {2,}/g, ' ');

		var is3d = /[\w\-\+\.]\s[\w\-\+\.]+\s[\w\-\+\.]/.test(str);

		str = str.replace(/[\(\)]/g, '');
		str = str.replace(/ /g, ',').replace(/\,{2,}/g, ',');

		return {
			dim: is3d ? 3 : 2,
			arr: JSON.parse('[' + str + ']')
		};
	},

	GeoJSON: function(str) {
		str = str.substring(str.indexOf('['), str.lastIndexOf(']')).replace(/ /g, '');

		var is3d = /[\w\-\+\.],[\w\-\+\.]+,[\w\-\+\.]/.test(str);

		str = str.replace(/[\[\]]/g, '').replace(/\,{2,}/g, ',');

		return {
			dim: is3d ? 3 : 2,
			arr: JSON.parse('[' + str + ']')
		};
	}

};