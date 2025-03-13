import { XMLParser } from "fast-xml-parser";
var parser = new XMLParser({
    attributeNamePrefix: "",
    htmlEntities: true,
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseTagValue: false,
    trimValues: false,
    tagValueProcessor: function (_, val) { return (val.trim() === "" && val.includes("\n") ? "" : undefined); },
});
parser.addEntity("#xD", "\r");
parser.addEntity("#10", "\n");
export var parse = (function (encoded, ignored) {
    return parser.parse(encoded);
});
