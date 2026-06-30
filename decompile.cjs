const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const code = fs.readFileSync('Spreadsheet.compiled.js', 'utf8');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
});

function getChildElements(childrenNode) {
  if (t.isArrayExpression(childrenNode)) {
     return childrenNode.elements.map(buildJsxNode).filter(Boolean);
  } else {
     const ch = buildJsxNode(childrenNode);
     return ch ? [ch] : [];
  }
}

function buildJsxNode(node) {
  if (!node) return null;
  // If it's a jsxDEV call:
  if (t.isCallExpression(node) && t.isIdentifier(node.callee, { name: 'jsxDEV' })) {
    const args = node.arguments;
    const typeArg = args[0];
    const propsArg = args[1];
    
    let elementName;
    if (t.isStringLiteral(typeArg)) {
      elementName = t.jsxIdentifier(typeArg.value);
    } else if (t.isIdentifier(typeArg)) {
      elementName = t.jsxIdentifier(typeArg.name);
    } else if (t.isMemberExpression(typeArg)) {
      elementName = t.jsxMemberExpression(t.jsxIdentifier(typeArg.object.name), t.jsxIdentifier(typeArg.property.name));
    } else if (t.isArrowFunctionExpression(typeArg) || t.isFunctionExpression(typeArg)) {
      elementName = t.jsxIdentifier("FunctionComp");
    } else {
      elementName = t.jsxIdentifier("Unknown");
    }
    
    const opening = t.jsxOpeningElement(elementName, []);
    const closing = t.jsxClosingElement(elementName);
    const children = [];
    
    if (t.isObjectExpression(propsArg)) {
      for (const prop of propsArg.properties) {
        if (t.isObjectProperty(prop)) {
          const keyName = prop.key.name || prop.key.value;
          if (keyName === 'children') {
             const childNodes = getChildElements(prop.value);
             for(let ch of childNodes) {
               if (Array.isArray(ch)) { ch.forEach(x => children.push(x)); }
               else { children.push(ch); }
             }
          } else {
             // add attribute
             let attrValue;
             if (t.isStringLiteral(prop.value)) {
               attrValue = prop.value;
             } else {
               attrValue = t.jsxExpressionContainer(prop.value);
             }
             opening.attributes.push(t.jsxAttribute(t.jsxIdentifier(keyName), attrValue));
          }
        }
      }
    }
    
    // Check if it's completely empty
    if (children.length === 0) {
      opening.selfClosing = true;
      return t.jsxElement(opening, null, [], true);
    }

    return t.jsxElement(opening, closing, children, false);
  }
  
  if (t.isStringLiteral(node)) {
    return t.jsxText(node.value);
  }
  
  if (t.isLogicalExpression(node) && node.operator === '&&') {
     // jsxExpressionContainer
     return t.jsxExpressionContainer(node);
  }
  if (t.isConditionalExpression(node)) {
     return t.jsxExpressionContainer(node);
  }
  if (t.isCallExpression(node)) {
    return t.jsxExpressionContainer(node);
  }
  if (t.isIdentifier(node)) {
    return t.jsxExpressionContainer(node);
  }
  if (t.isObjectExpression(node) || t.isArrayExpression(node)) {
    return t.jsxExpressionContainer(node);
  }
  
  return t.jsxExpressionContainer(node);
}

traverse(ast, {
  CallExpression(path) {
    if (t.isIdentifier(path.node.callee, { name: 'jsxDEV' })) {
       const jsxNode = buildJsxNode(path.node);
       if (jsxNode) {
          path.replaceWith(jsxNode);
       }
    }
  }
});

const output = generate(ast, {}).code;
fs.writeFileSync('Spreadsheet.decompiled.tsx', output);
console.log('Decompiled!');
