
import { BaseComponentGenerator } from '../ComponentGeneratorStrategy';
import { AppComponent, AppDefinition, ComponentType } from '../../../../../types';
import { translateExpression } from '../../../utils/expressionTranslator';
import { ComponentGeneratorFactory } from '../ComponentGeneratorFactory';
import { toCamelCase } from '../../../utils/stringUtils';

/**
 * Generator for container components (Container, List).
 * Generates a single flex container div with all styling and child components.
 */
export class ContainerGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const children = allComponents.filter(c => c.parentId === component.id);
        // Sort children by order property for consistent rendering
        const sortedChildren = [...children].sort((a, b) => {
            const orderA = (a.props as any).order ?? 0;
            const orderB = (b.props as any).order ?? 0;
            return orderA - orderB;
        });
        const renderedChildren = sortedChildren
            .map(child => ComponentGeneratorFactory.create(child.type).generate(child, allComponents, appDef))
            .join('\n');

        const containerProps = component.props as any;

        // Format dimension preserving CSS units
        const formatDim = (value: any): string | undefined => {
            if (value === undefined || value === null) return undefined;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed.endsWith('%') || trimmed.endsWith('rem') || trimmed.endsWith('em') ||
                    trimmed.endsWith('vh') || trimmed.endsWith('vw') || trimmed === 'auto' || trimmed.endsWith('px')) {
                    return `'${trimmed}'`;
                }
                const num = parseFloat(trimmed);
                if (!isNaN(num)) return `'${num}px'`;
                return translateExpression(value, appDef, 'raw-js');
            }
            if (typeof value === 'number') return `'${value}px'`;
            return undefined;
        };

        // Build the single flex container style
        const style: Record<string, any> = {
            display: `'flex'`,
            flexDirection: `'${containerProps.flexDirection || 'column'}'`,
            flexWrap: `'${containerProps.flexWrap || 'nowrap'}'`,
            justifyContent: `'${containerProps.justifyContent || 'flex-start'}'`,
            alignItems: `'${containerProps.alignItems || 'stretch'}'`,
            boxSizing: `'border-box'`,
        };

        // Gap
        const gap = containerProps.gap;
        if (gap !== undefined && gap !== null) {
            if (typeof gap === 'number') {
                style.gap = `'${gap}px'`;
            } else if (typeof gap === 'string') {
                const translated = translateExpression(gap, appDef, 'raw-js');
                if (translated && translated !== 'undefined' && translated !== '""') {
                    style.gap = translated;
                }
            }
        }

        // Dimensions
        const widthStyle = formatDim(containerProps.width);
        if (widthStyle) style.width = widthStyle;
        const heightStyle = formatDim(containerProps.height);
        if (heightStyle) style.height = heightStyle;

        // Flex item properties (if container is a child of another flex container)
        if (containerProps.order !== undefined) style.order = containerProps.order;
        if (containerProps.flexGrow !== undefined) style.flexGrow = containerProps.flexGrow;
        if (containerProps.flexShrink !== undefined) style.flexShrink = containerProps.flexShrink;
        if (containerProps.alignSelf) style.alignSelf = `'${containerProps.alignSelf}'`;

        // Background
        const backgroundImage = translateExpression(containerProps.backgroundImage, appDef, 'raw-js');
        const backgroundGradient = translateExpression(containerProps.backgroundGradient, appDef, 'raw-js');
        const backgroundColor = translateExpression(containerProps.backgroundColor, appDef, 'raw-js');

        if (backgroundImage && backgroundImage !== 'undefined' && backgroundImage !== '""') {
            style.backgroundImage = `\`url(\${${backgroundImage}})\``;
            style.backgroundSize = `'cover'`;
            style.backgroundPosition = `'center'`;
            style.backgroundRepeat = `'no-repeat'`;
        } else if (backgroundGradient && backgroundGradient !== 'undefined' && backgroundGradient !== '""') {
            style.background = backgroundGradient;
        } else if (backgroundColor && backgroundColor !== 'undefined' && backgroundColor !== '""') {
            style.backgroundColor = backgroundColor;
        }

        // Spacing
        const padding = translateExpression(containerProps.padding, appDef, 'raw-js');
        if (padding && padding !== 'undefined' && padding !== '""') style.padding = padding;
        const margin = translateExpression(containerProps.margin, appDef, 'raw-js');
        if (margin && margin !== 'undefined' && margin !== '""') style.margin = margin;

        // Opacity & Shadow
        const opacity = translateExpression(containerProps.opacity, appDef, 'raw-js');
        if (opacity !== undefined && opacity !== 'undefined' && opacity !== '""') style.opacity = opacity;
        const boxShadow = translateExpression(containerProps.boxShadow, appDef, 'raw-js');
        if (boxShadow && boxShadow !== 'undefined' && boxShadow !== '""') style.boxShadow = boxShadow;

        // Borders
        ['borderRadius', 'borderWidth', 'borderColor', 'borderStyle',
         'borderTop', 'borderRight', 'borderBottom', 'borderLeft'].forEach(prop => {
            if (containerProps[prop] !== undefined) {
                const value = translateExpression(containerProps[prop], appDef, 'raw-js');
                if (value !== undefined && value !== 'undefined' && value !== '""') {
                    style[prop] = value;
                }
            }
        });

        // Min/Max dimensions
        if (containerProps.minWidth) style.minWidth = formatDim(containerProps.minWidth) || translateExpression(containerProps.minWidth, appDef, 'raw-js');
        if (containerProps.maxWidth) style.maxWidth = formatDim(containerProps.maxWidth) || translateExpression(containerProps.maxWidth, appDef, 'raw-js');
        if (containerProps.minHeight) style.minHeight = formatDim(containerProps.minHeight) || translateExpression(containerProps.minHeight, appDef, 'raw-js');
        if (containerProps.maxHeight) style.maxHeight = formatDim(containerProps.maxHeight) || translateExpression(containerProps.maxHeight, appDef, 'raw-js');

        // Z-index
        if (containerProps.zIndex !== undefined) {
            style.zIndex = translateExpression(containerProps.zIndex, appDef, 'raw-js');
        }

        // Overflow
        style.overflow = `'auto'`;

        // Generate style content
        const styleContent = Object.entries(style)
            .filter(([, value]) => value !== undefined && value !== '""' && value !== "''" && value !== "``" && value !== null)
            .map(([key, value]) => `${toCamelCase(key)}: ${value}`)
            .join(', ');

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            `style={{ ${styleContent} }}`
        ];

        return this.buildTag('div', attributes, `\n${renderedChildren}\n`);
    }
}
