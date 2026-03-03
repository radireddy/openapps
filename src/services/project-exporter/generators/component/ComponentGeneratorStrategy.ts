
import { AppComponent, AppDefinition, ComponentProps } from '../../../../types';
import { translateExpression } from '../../utils/expressionTranslator';
import { toCamelCase } from '../../utils/stringUtils';

/**
 * Interface for component generation strategies.
 * Each component type implements this strategy to generate its specific React code.
 */
export interface IComponentGeneratorStrategy {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string;
}

/**
 * Abstract base class for component generators.
 * Provides common utility methods for generating JSX tags, standard attributes, and styling.
 */
export abstract class BaseComponentGenerator implements IComponentGeneratorStrategy {
    /**
     * Generates the React JSX code for a specific component.
     */
    abstract generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string;

    /**
     * Generates standard HTML attributes common to all components.
     * This includes `id`, `hidden` (visibility), and `disabled`.
     */
    protected getCommonAttributes(component: AppComponent, appDef: AppDefinition): string[] {
        const attrs = [`id="${component.id}"`];
        
        if (component.props.hidden) {
            attrs.push(`hidden={${translateExpression(component.props.hidden, appDef, 'raw-js')}}`);
        }
        
        const anyProps = component.props as any;
        if (anyProps.disabled !== undefined) {
            attrs.push(`disabled={${translateExpression(anyProps.disabled, appDef, 'raw-js')}}`);
        }

        return attrs;
    }

    /**
     * Generates the `style={{ ... }}` attribute string.
     * Maps low-code layout properties (x, y, width, height) and styling properties (colors, borders)
     * to standard React inline style objects.
     * 
     * @param props The component properties.
     * @param appDef The app definition context.
     * @param additionalStyles Optional map of extra style properties to merge.
     */
    protected generateStyleAttribute(props: ComponentProps, appDef: AppDefinition, additionalStyles: Record<string, any> = {}): string {
        // Format a dimension value preserving CSS units (%, rem, vw, etc.)
        const formatDimensionResponsive = (value: any): string => {
            if (value === undefined || value === null) return undefined as any;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                // Preserve CSS unit values as-is
                if (trimmed.endsWith('%') || trimmed.endsWith('rem') || trimmed.endsWith('em') ||
                    trimmed.endsWith('vh') || trimmed.endsWith('vw') || trimmed === 'auto') {
                    return `'${trimmed}'`;
                }
                // If it ends with px, use as-is
                if (trimmed.endsWith('px')) {
                    return `'${trimmed}'`;
                }
                // Numeric string → add px
                const num = parseFloat(trimmed);
                if (!isNaN(num)) return `'${num}px'`;
                return `'${trimmed}'`;
            }
            if (typeof value === 'number') {
                return `'${value}px'`;
            }
            return undefined as any;
        };

        const anyProps = props as any;

        const baseStyleProps: Record<string, any> = {
            position: `'relative'`,
            width: formatDimensionResponsive(props.width),
            height: formatDimensionResponsive(props.height),
            order: anyProps.order !== undefined ? anyProps.order : undefined,
            flexGrow: anyProps.flexGrow !== undefined ? anyProps.flexGrow : undefined,
            flexShrink: anyProps.flexShrink !== undefined ? anyProps.flexShrink : undefined,
            alignSelf: anyProps.alignSelf ? `'${anyProps.alignSelf}'` : undefined,
            opacity: translateExpression(props.opacity, appDef, 'raw-js'),
            boxShadow: translateExpression(props.boxShadow, appDef, 'raw-js'),
            padding: translateExpression(props.padding, appDef, 'raw-js'),
            margin: translateExpression(props.margin, appDef, 'raw-js'),
        };

        const borderProps = props as any;
        // Unified border properties
        ['borderRadius', 'borderWidth', 'borderColor', 'borderStyle'].forEach(prop => {
             if (borderProps[prop] !== undefined) {
                 baseStyleProps[prop] = translateExpression(borderProps[prop], appDef, 'raw-js');
             }
        });
        // Individual border side properties
        ['borderTop', 'borderRight', 'borderBottom', 'borderLeft'].forEach(prop => {
             if (borderProps[prop] !== undefined) {
                 baseStyleProps[prop] = translateExpression(borderProps[prop], appDef, 'raw-js');
             }
        });

        const finalStyles = { ...baseStyleProps, ...additionalStyles };
        const styleContent = Object.entries(finalStyles)
            .filter(([, value]) => value !== undefined && value !== '""' && value !== "''" && value !== "``" && value !== null)
            .map(([key, value]) => `${toCamelCase(key)}: ${value}`)
            .join(', ');
        
        return `style={{ ${styleContent} }}`;
    }

    /**
     * Helper to construct a well-formatted JSX tag string.
     */
    protected buildTag(tagName: string, attributes: string[], children: string | null = null): string {
        const attrsString = attributes.filter(Boolean).join('\n    ');
        if (children) {
            return `<${tagName}\n    ${attrsString}\n>${children}</${tagName}>`;
        }
        return `<${tagName}\n    ${attrsString}\n/>`;
    }
}
