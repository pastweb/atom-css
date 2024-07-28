import postcss from 'postcss';
import { createFilter } from '@rollup/pluginutils';
import { resolveOptions, generateHash, countAncestors, processRules, nestSelectors, flatSelectors } from './utils';
import { ANIMATION_NAME_RE, CLASS_NAME_RE, GLOBAL_ANIMATION_RE, AT_RULES } from './constants';
import type { PluginCreator, Rule, AtRule } from 'postcss';
import { Options, ResolvedUtilityOptions } from './types';

// Create the plugin
export const plugin: PluginCreator<Options> = (options: Options = {}) => {
  // Set default options if necessary
  const opts = resolveOptions(options);
  const { test: { include, exclude } } = opts;
  const testFilter = (include || exclude) && createFilter(include, exclude);
  const getScope = (...args: string[]) => `_${generateHash(opts.scope.length, ...args)}`;
  const varScope = opts.scope.cssVariables.key && getScope(opts.scope.cssVariables.key) || '';

  return {
    postcssPlugin: 'postcss-utility-modules',
    // The Once method is called once for the root node at the end of the processing
    async Once(root, { result }) {
      const filePath = result.opts.from || 'unknown';

      if (testFilter && !testFilter(filePath)) return;

      const css = root.toString();
      // Object to store original class names and their suffixed names (modules)
      const modules: Record<string, string> = {};
      // Object to store original animation names and their suffixed names (modules)
      let hasKeyframes = false;
      const keyframes: Record<string, string> = {};
      // Object to store original CSS variable names and their suffixed names
      let hasScopedVars = false;
      const cssVarModules: Record<string, string> = {};
      // Object to store utility class name and its own css
      const utilityModules: Record<string, Rule | AtRule> = {};
      // Set of classNames already processed for the utility functionality
      const rules: Record<string, { ancestors: number, rule: Rule | AtRule}[]> = {};
      // unused keyframes names if usedClasses option is set
      const unusedAnimations: Set<string> = new Set();

      if (!opts.scope.classNames && opts.scope.cssVariables.key && opts.utility) return;
      // Generate a unique suffix for this file
      const suffix = getScope(css);

      const { include, exclude } = opts.scope.cssVariables;
      const varsFilter = (include || exclude) && createFilter(include, exclude);

      // nest selectors
      nestSelectors(root);
      
      root.walkRules(rule => {
        if (rule.selector === ':root' && opts.scope.cssVariables.key) {
          // Generate unique id scope for CSS variables in :root
          rule.walkDecls(decl => {
            if (!decl.prop.startsWith('--')) return;
            if (varsFilter && !varsFilter(decl.prop)) return;

            const originalProp = decl.prop;
            const suffixedProp = `${originalProp}${varScope}`;
            cssVarModules[originalProp] = suffixedProp;
            decl.prop = suffixedProp;
          });

          hasScopedVars = true;
        } else {
          const scopedVars = opts.scope.cssVariables.key && hasScopedVars;

          if (opts.usedClasses && /^&?\.\w+/.test(rule.selector)) {
            const className = rule.selector.replace(/^&?\./, '');

            if (!opts.usedClasses.test(className)) {
              // remove unused classes and animations
              rule.walkDecls(decl => {
                const { prop, value } = decl;
                
                if (!/^animation(-name)?$/.test(prop)) return;
                
                let animations: string[] = [];
                
                if (prop === 'animation-name') animations.push(value);
                else animations = value.split(',').map(a => a.trim().match(ANIMATION_NAME_RE)![0]);

                animations.forEach(a => unusedAnimations.add(a));
              });

              let parent = rule.parent || null;
              rule.remove();

              while (parent) {
                if (parent.nodes && parent.nodes.length) break;
                const r = parent;
                parent = r.parent as any || null;
                r.remove();
              }

              return;
            } else {
              // remove animations from unusedAnimations for used classes
              rule.walkDecls(decl => {
                const { prop, value } = decl;

                if (!/^animation(-name)?$/.test(prop)) return;

                let animations: string[] = [];

                if (prop === 'animation-name') animations.push(value);
                else animations = value.split(',').map(a => a.trim().match(ANIMATION_NAME_RE)![0]);

                animations.forEach(a => {
                  if (GLOBAL_ANIMATION_RE.test(a) && !opts.scope.classNames) {
                    const cleaned = a.replace(GLOBAL_ANIMATION_RE, '');
                    decl.value = decl.value.replace(new RegExp(a.replace('(', '\\(').replace(')', '\\)')), cleaned);
                  } else unusedAnimations.delete(a);
                });
              });
            }
          }

          // handle animations and cssVars names
          if (opts.scope.classNames || scopedVars) {
            rule.walkDecls(decl => {
              if (/^animation(-name)?$/.test(decl.prop)) {
                let animations: string[] = [];
                
                if (decl.prop === 'animation') {
                  animations = decl.value.split(',')
                    .map(a => a.trim()
                    .match(ANIMATION_NAME_RE)![0]);
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

                hasKeyframes = true;
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

          // store rules must be processed for utility
          if (opts.utility) {
            if (!rule.parent || !rule.selector.startsWith('.')) return;
            
            const ancestors = countAncestors(rule);
            
            if (ancestors === null) return;
            
            rules[rule.selector] = rules[rule.selector] || [];
            rules[rule.selector].push({ ancestors, rule });
          }
        }
      });

      root.walkAtRules(rule => {
        if (rule.name === 'keyframes') {
          const keyframesName = rule.params;

          // remove keyframes if marked as unused
          if (unusedAnimations.has(keyframesName)) {
            rule.remove();
            return;
          }

          // Apply suffixed names to keyframes rules
          if (opts.scope.classNames && hasKeyframes && keyframes[keyframesName]) {
            rule.params = keyframes[keyframesName];
            return;
          }
        }

        if (opts.utility && AT_RULES.has(rule.name)) {
          const { container, layer, media, scope, supports } = (opts.utility as ResolvedUtilityOptions).atRules;
          let processRule = false;
          
          if (container && rule.name === 'container') processRule = true;
          if (layer && rule.name === 'layer') processRule = true;
          if (media && rule.name === 'media') processRule = true;
          if (scope && rule.name === 'scope') processRule = true;
          if (supports && rule.name === 'supports') processRule = true;
          if (!processRule) return;

          const ancestors = countAncestors(rule);
          // skip AtRules at the root level
          if (!ancestors) return;
          
          const ruleName = `${rule.name}${rule.params ? ` ${rule.params}` : ''}`;
          rules[ruleName] = rules[ruleName] || [];
          rules[ruleName].push({ ancestors, rule });
        }
      });

      if (opts.utility) {
        const utility = opts.utility as ResolvedUtilityOptions;
        const { mode, output, getUtilityModules, property, value } = utility;
        const propFilter = property && (property.include || property.exclude) ? createFilter(property.include, property.exclude) : undefined;
        const valFilter = value && (value.include || value.exclude) ? createFilter(value.include, value.exclude) : undefined;
        // Process rules from the deepest
        for (const key of Object.keys(rules).reverse()) {
          const sorted = rules[key].sort((a, b) => a.ancestors - b.ancestors);
          const [ lower ] = sorted;
          const selected: (Rule | AtRule)[] = [];
          
          for (const { ancestors, rule } of sorted) {
            if (ancestors > lower.ancestors) break;
            selected.push(rule);
          }

          const isAtRule = lower.rule.type === 'atrule';
          const selector = isAtRule ?
            ((lower.rule as AtRule).parent as Rule).selector :
            (lower.rule as Rule).selector;
          
          processRules(selector, isAtRule, selected, mode, opts.scope.length, modules, utilityModules, propFilter, valFilter);
        }
        
        if (getUtilityModules) {
          const uModules = Object.entries(utilityModules).reduce((acc, [className, rule]) => ({ ...acc, [className]: rule.toString() }), {});
          await getUtilityModules(filePath, uModules);
        }
      }

      if (opts.scope.classNames) {
        const { classNames } = opts.scope;
        // if Utiliy option is set, root could not have any rule nodes
        Object.entries(modules).forEach(([ className, classes ]) => {
          const suffixedClassName = typeof classNames === 'function' ? `${classNames(className, filePath, css)}${suffix}`: `${className}${suffix}`;
          modules[className] = classes.replace(new RegExp(`^${className}`), suffixedClassName);
        });

        root.walkRules(rule => {
          rule.selector = rule.selector.replace(CLASS_NAME_RE, (match, prefix, globalContent, className) => {
            if (globalContent) return globalContent; // Return just the class name without :global
            if (!className) return match;
            
            const suffixedClassName = typeof classNames === 'function' ? classNames(className, filePath, css): `${className}${suffix}`;
            
            if (!modules[className]) modules[className] = suffixedClassName;
            else if (new RegExp(`^${className}( |$)`).test(modules[className])) {
              modules[className] = modules[className].replace(new RegExp(`^${className}`), suffixedClassName);
            }

            return `.${suffixedClassName}`;
          });
        });
      }

      flatSelectors(root, opts.selectors !== 'flat');

      if (opts.utility && typeof opts.utility !== 'boolean' && opts.utility.output) {
        Object.values(utilityModules).forEach(rule => root.append(rule));
      }

      if (opts.scope.classNames || opts.utility) {
        await opts.getModules(filePath, modules);
      }
    },
  };
};

// Set the plugin name
plugin.postcss = true;
