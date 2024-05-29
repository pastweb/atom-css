import { resolveOptions, generateHash, getUtilityClassName, removeClassIfEmpty, extractClassName } from './utils';
import { ANIMATION_NAME_RE, CLASS_NAME_RE, GLOBAL_ANIMATION_RE } from './constants';
import * as postcss from 'postcss';
import type { PluginCreator, Rule, Declaration } from 'postcss';
import { Options, ResolvedUtilityOptions } from './types';

// Create the plugin
export const plugin: PluginCreator<Options> = (options: Options = {}) => {
  // Set default options if necessary
  const opts = resolveOptions(options);
  const getScope = (...args: string[]) => `_${generateHash(opts.scopeLength, ...args)}`;

  return {
    postcssPlugin: 'postcss-utility-modules',
    // The Once method is called once for the root node at the end of the processing
    async Once(root, { result }) {
      const filePath = result.opts.from || 'unknown';
      const css = root.toString();
      // Object to store original class names and their suffixed names (modules)
      const modules: Record<string, string> = {};
      // Object to store original animation names and their suffixed names (modules)
      const keyframes: Record<string, string> = {};
      // Object to store original CSS variable names and their suffixed names
      const cssVarModules: Record<string, string> = {};
      // Object to store utility class name and its own css
      const utilityModules: Record<string, Rule> = {};

      if (!opts.modules && opts.scopedCSSVariables && opts.utility) return;
      // Generate a unique suffix for this file
      const suffix = getScope(css);

      root.walkRules(rule => {
        if (rule.selector === ':root' && opts.scopedCSSVariables) {
          // Generate unique id scope for CSS variables in :root
          rule.walkDecls(decl => {
            if (!decl.prop.startsWith('--')) return;
            
            const originalProp = decl.prop;
            const suffixedProp = `${originalProp}${getScope(opts.scopedCSSVariables)}`;
            cssVarModules[originalProp] = suffixedProp;
            decl.prop = suffixedProp;
          });
        } else {
          
          const scopedVars = opts.scopedCSSVariables && Object.keys(cssVarModules).length;
          if (opts.modules || scopedVars) {
            rule.walkDecls(decl => {
              if (decl.prop === 'animation' || decl.prop === 'animation-name') {
                let animations: string[] = [];
                
                if (decl.prop === 'animation') {
                  animations = decl.value
                    .split(',')
                    .map(a => a.trim().match(ANIMATION_NAME_RE)![0])
                } else if (decl.prop === 'animation-name') {
                  animations.push(decl.value);
                }

                if (animations.length) {
                  animations.forEach(a => {
                    const suffixed = !GLOBAL_ANIMATION_RE.test(a);
                    const name = suffixed ? `${a}${suffix}` : a.replace(GLOBAL_ANIMATION_RE, '');
                    decl.value = decl.value.replace(new RegExp(suffixed ? a : `global\\(${name}\\)`, 'g'), name);
                    
                    if (suffixed && !keyframes[a]) keyframes[a] = name;
                  });
                }
              }

              if (scopedVars) {
                // Process declarations to suffix CSS variables in var() functions
                decl.value = decl.value.replace(/var\((--[\w-]+)\)/g, (match, cssVar) => {
                  const suffixedVar = cssVarModules[cssVar] || cssVar;
                  return `var(${suffixedVar})`;
                });
              }
            });
          }

          if (opts.modules) {
            // Add a suffix to each class name if not preceded by :global
            rule.selectors = rule.selectors.map(selector =>
              selector.replace(CLASS_NAME_RE, (match, prefix, globalContent, globalClassName, className) => {
                if (globalContent) return globalContent; // Return just the class name without :global
                if (globalClassName) return `.${globalClassName}`; // Return just the class name without :global
                if (!className) return match;

                const suffixedClassName = `${className}${suffix}`;
                if (!modules[className]) modules[className] = suffixedClassName;
                return `.${suffixedClassName}`;
              })
            );
          }

          // Process utility classes
          if (opts.utility) {
            const { mode } = (opts.utility as ResolvedUtilityOptions);

            root.walkRules(rule => {
              if (!rule.selector.startsWith('.')) return;

              const { unscoped } = extractClassName(rule.selector);
              
              rule.each(node => {
                if (node.type !== 'decl') return;

                const decl = node as Declaration;
                const { prop, value } = decl;
                const utilityClassName = getUtilityClassName(mode, prop, value);
                const utilityRule = postcss.rule({ selector: `.${utilityClassName}` });
                utilityRule.append(decl.clone());
                decl.remove(); // Remove the processed declaration from the original rule
                if (!utilityModules[utilityClassName]) utilityModules[utilityClassName] = utilityRule;
                modules[unscoped] = modules[unscoped] ? `${modules[unscoped]} ${utilityClassName}` : utilityClassName;
              });

              removeClassIfEmpty(rule, modules);
            });
          }
        }
      });

      // Apply suffixed names to keyframes rules
      root.walkAtRules('keyframes', atRule => {
        const originalName = atRule.params;
        if (!keyframes[originalName]) return;
        atRule.params = keyframes[originalName];
      });

      await opts.getModules(filePath, modules);

      if (opts.utility) {
        const utility = opts.utility as ResolvedUtilityOptions;
        if (utility.output) Object.values(utilityModules).forEach(rule => root.append(rule));
        
        if (utility.getUtilityModules) {
          const uModules = Object.entries(utilityModules).reduce((acc, [className, rule]) => ({ ...acc, [className]: rule.toString() }), {});
          await utility.getUtilityModules(filePath, uModules);
        }
      }
    },
  };
};

// Set the plugin name
plugin.postcss = true;
