import { Options } from 'acorn';

export const ACORN_OPTIONS: Options = {
  sourceType: 'module',
  ecmaVersion: 'latest',
};

export enum NodeType {
  ArrayExpression = 'ArrayExpression',
  AssignmentExpression = 'AssignmentExpression',
  BinaryExpression = 'BinaryExpression',
  CallExpression = 'CallExpression',
  ConditionalExpression = 'ConditionalExpression',
  Identifier = 'Identifier',
  ImportDeclaration = 'ImportDeclaration',
  ImportDefaultSpecifier = 'ImportDefaultSpecifier',
  ImportSpecifier = 'ImportSpecifier',
  Literal = 'Literal',
  MemberExpression = 'MemberExpression',
  ObjectExpression = 'ObjectExpression',
  Property = 'Property',
  TaggedTemplateExpression = 'TaggedTemplateExpression',
  TemplateElement = 'TemplateElement',
  TemplateLiteral = 'TemplateLiteral',
  ThisExpression = 'ThisExpression',
};
