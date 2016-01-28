/* jshint node:true */

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var defaultFilename = 'jshint-output.log';

var wrStream;
var filename;

module.exports = function(results, data, opts) {
  opts = opts || {};
  opts.filename = opts.filename || defaultFilename;

  if (wrStream && filename !== opts.filename) {
    wrStream.end();
    wrStream = null;
  }

  if (!wrStream) {
    var directoryPath = path.dirname(opts.filename);
    mkdirp.sync(directoryPath);
    wrStream = fs.createWriteStream(opts.filename);
    filename = opts.filename;
  }

  wrStream.write(jslint_xml(results));
};

// https://github.com/jshint/jshint/blob/master/src/reporters/jslint_xml.js
function jslint_xml(results) {
  "use strict";

  var files = {},
    out = [],
    pairs = {
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
      "<": "&lt;",
      ">": "&gt;"
    },
    file, i, issue;

  function encode(s) {
    for (var r in pairs) {
      if (typeof(s) !== "undefined") {
        s = s.replace(new RegExp(r, "g"), pairs[r]);
      }
    }
    return s || "";
  }


  results.forEach(function(result) {
    result.file = result.file.replace(/^\.\//, '');
    if (!files[result.file]) {
      files[result.file] = [];
    }
    files[result.file].push(result.error);
  });

  out.push("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
  out.push("<jslint>");

  for (file in files) {
    out.push("\t<file name=\"" + file + "\">");
    for (i = 0; i < files[file].length; i++) {
      issue = files[file][i];
      out.push("\t\t<issue line=\"" + issue.line +
        "\" char=\"" + issue.character +
        "\" reason=\"" + encode(issue.reason) +
        "\" evidence=\"" + encode(issue.evidence) +
        (issue.code ? "\" severity=\"" + encode(issue.code.charAt(0)) : "") +
        "\" />");
    }
    out.push("\t</file>");
  }

  out.push("</jslint>");

  return out.join("\n") + "\n";
}