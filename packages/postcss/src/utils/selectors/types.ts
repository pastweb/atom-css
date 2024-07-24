import type { ChildNode } from 'postcss';

export type MediaRule = ChildNode & {
  type: 'atrule';
  name: 'media';
  params: string;
  nodes: ChildNode[];
};

export type ContainerRule = ChildNode & {
  type: 'atrule';
  name: 'container';
  nodes: ChildNode[];
};
