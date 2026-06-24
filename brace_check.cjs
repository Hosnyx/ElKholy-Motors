const fs = require('fs');

const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

function countOccurrences(string, subString) {
  return string.split(subString).length - 1;
}

console.log("<div> count:", countOccurrences(content, "<div") - countOccurrences(content, "</div"));
console.log("{ count:", countOccurrences(content, "{") - countOccurrences(content, "}"));
console.log("( count:", countOccurrences(content, "(") - countOccurrences(content, ")"));
