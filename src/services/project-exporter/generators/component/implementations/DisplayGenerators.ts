
import { BaseComponentGenerator } from '../ComponentGeneratorStrategy';
import { AppComponent, AppDefinition, ComponentType } from '../../../../../types';
import { translateExpression } from '../../../utils/expressionTranslator';
import { ComponentGeneratorFactory } from '../ComponentGeneratorFactory';
import { toPascalCase } from '../../../utils/stringUtils';

/**
 * Generator for Label components.
 * Renders text content (static or dynamic expression) inside a styled div.
 * Supports markdown rendering when textRenderer is set to 'markdown'.
 */
export class LabelGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const labelProps = component.props as any;
        const textRenderer = labelProps.textRenderer || 'javascript';
        
        // Map textAlign to justifyContent for flex layout
        const justifyContent = labelProps.textAlign === 'center' ? `'center'` : (labelProps.textAlign === 'right' ? `'flex-end'` : `'flex-start'`);
        
        const style: Record<string, any> = {
            fontSize: translateExpression(labelProps.fontSize, appDef, 'raw-js'),
            fontWeight: translateExpression(labelProps.fontWeight, appDef, 'raw-js'),
            color: translateExpression(labelProps.color, appDef, 'raw-js'),
            textAlign: translateExpression(labelProps.textAlign, appDef, 'raw-js'),
            backgroundColor: translateExpression(labelProps.backgroundColor, appDef, 'raw-js'),
            display: `'flex'`,
            alignItems: `'center'`,
            justifyContent: justifyContent,
        };

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `className="w-full h-full"`
        ];

        // Handle markdown rendering
        if (textRenderer === 'markdown') {
            // For markdown, we need to render HTML using dangerouslySetInnerHTML
            // Build the scope object with all available variables and dataStore
            // Include currentItem and index for List context (they'll be undefined if not in a List, which is fine)
            const scopeObject = `{
                theme,
                dataStore,
                get,
                ${appDef.variables.map(v => `${v.name}`).join(',\n                ')},
                currentItem,
                index
            }`;
            const markdownText = JSON.stringify(labelProps.text || '');
            const markdownHtml = `renderMarkdown(${markdownText}, ${scopeObject})`;
            
            // Return div with dangerouslySetInnerHTML
            const attrsString = attributes.filter(Boolean).join('\n    ');
            return `<div
    ${attrsString}
    dangerouslySetInnerHTML={{ __html: ${markdownHtml} }}
/>`;
        }

        // For javascript or literal renderers, use regular text content
        let textContent = translateExpression(labelProps.text, appDef, 'jsx-children');
        
        // Fix cases where currentItem was converted to get(dataStore, 'currentItem') incorrectly
        // Convert get(dataStore, 'currentItem').property to get(currentItem, 'property')
        // Also handle array access like get(dataStore, 'currentItem').amenities[0]
        const listIterationVars = ['currentItem', 'item', 'row', 'record'];
        for (const varName of listIterationVars) {
            // Handle property access with optional array index
            const pattern = new RegExp(`get\\(dataStore, ['"]${varName}['"]\\)\\.([a-zA-Z_][a-zA-Z0-9_]*)(\\[[^\\]]+\\])?`, 'g');
            textContent = textContent.replace(pattern, (match, propName, arrayAccess) => {
                if (arrayAccess) {
                    // Extract index from array access like [0]
                    const indexMatch = arrayAccess.match(/\[(.+)\]/);
                    if (indexMatch) {
                        const index = indexMatch[1];
                        return `get(${varName}, '${propName}.${index}')`;
                    }
                }
                return `get(${varName}, '${propName}')`;
            });
        }
        
        return this.buildTag('div', attributes, `\n<span style={{ textAlign: ${translateExpression(labelProps.textAlign, appDef, 'raw-js')}, width: '100%', color: ${translateExpression(labelProps.color, appDef, 'raw-js')}, fontSize: ${translateExpression(labelProps.fontSize, appDef, 'raw-js')} }}>${textContent}</span>\n`);
    }
}

/**
 * Generator for Image components.
 * Renders an `<img>` tag with `src`, `alt`, and `object-fit` styles derived from props.
 */
export class ImageGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const imgProps = component.props as any;
        
        const style = {
            objectFit: translateExpression(imgProps.objectFit, appDef, 'raw-js') as any,
        };

        // Handle src - ensure URLs are properly handled
        let srcValue = translateExpression(imgProps.src, appDef, 'raw-js');
        
        // Fix cases where currentItem was converted to get(dataStore, 'currentItem') incorrectly
        // Convert get(dataStore, 'currentItem').property to get(currentItem, 'property')
        // Also handle array access like get(dataStore, 'currentItem').amenities[0]
        const listIterationVars = ['currentItem', 'item', 'row', 'record'];
        for (const varName of listIterationVars) {
            // Handle property access with optional array index
            const pattern = new RegExp(`get\\(dataStore, ['"]${varName}['"]\\)\\.([a-zA-Z_][a-zA-Z0-9_]*)(\\[[^\\]]+\\])?`, 'g');
            srcValue = srcValue.replace(pattern, (match, propName, arrayAccess) => {
                if (arrayAccess) {
                    // Extract index from array access like [0]
                    const indexMatch = arrayAccess.match(/\[(.+)\]/);
                    if (indexMatch) {
                        const index = indexMatch[1];
                        return `get(${varName}, '${propName}.${index}')`;
                    }
                }
                return `get(${varName}, '${propName}')`;
            });
        }
        
        // If the result contains // but isn't a valid expression (no +, no function calls), it might be a malformed expression
        // In that case, treat it as a plain string
        if (srcValue.includes('://') && !srcValue.includes('+') && !srcValue.includes('get(') && !srcValue.includes('(') && !srcValue.startsWith('"') && !srcValue.startsWith("'") && !srcValue.startsWith('`')) {
            // It looks like a plain URL or malformed expression, quote it
            srcValue = JSON.stringify(imgProps.src);
        }

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `src={${srcValue}}`,
            `alt={${translateExpression(imgProps.alt, appDef, 'raw-js')}}`
        ];

        return this.buildTag('img', attributes);
    }
}

/**
 * Generator for Divider components.
 * Renders a simple horizontal divider line.
 */
export class DividerGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const dividerProps = component.props as any;
        const style = {
            backgroundColor: translateExpression(dividerProps.color, appDef, 'raw-js'),
        };
        
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `className="w-full h-full"`
        ];
        
        return this.buildTag('div', attributes);
    }
}

/**
 * Generator for Table components.
 * Renders a table with data from a data source.
 */
export class TableGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const tableProps = component.props as any;
        // Data sources removed - tables now use empty array by default
        const dataVar = '[]';
        const selectedRecordKey = tableProps.selectedRecordKey || 'selectedRecord';
        const columns = tableProps.columns ? tableProps.columns.split(',').map((col: string) => {
            const [header, key] = col.split(':');
            return { header: header.trim(), key: key ? key.trim() : header.trim().toLowerCase() };
        }) : [];
        
        const style = {
            overflow: `'auto'`,
            backgroundColor: `'white'`,
        };
        
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `className="w-full h-full overflow-auto bg-white relative"`
        ];
        
        // Generate table structure
        const tableHeader = columns.length > 0 ? columns.map((col: any) => `<th key="${col.header}" scope="col" className="px-6 py-3">${col.header}</th>`).join('\n                    ') : '<th scope="col" className="px-6 py-3">No columns</th>';
        
        const tableBody = `{(() => {
                const data = ${dataVar};
                const selectedRecord = get(dataStore, '${selectedRecordKey}') || null;
                if (!Array.isArray(data) || data.length === 0) {
                    return (
                        <tr>
                            <td colSpan={${columns.length || 1}} className="px-6 py-4 text-center text-gray-400 text-sm">
                                No records found
                            </td>
                        </tr>
                    );
                }
                return data.map((row: any, index: number) => {
                    const isSelected = selectedRecord && selectedRecord.id === row.id;
                    return (
                        <tr 
                            key={row.id || index} 
                            className={\`border-b cursor-pointer hover:bg-gray-100 \${isSelected ? 'bg-blue-100' : 'bg-white'}\`}
                            onClick={() => updateDataStore('${selectedRecordKey}', row)}
                        >
                            ${columns.length > 0 ? columns.map((col: any) => `<td key="${col.key}" className="px-6 py-4">{String(get(row, '${col.key}', ''))}</td>`).join('\n                            ') : '<td className="px-6 py-4">No columns configured</td>'}
                        </tr>
                    );
                });
            })()}`;
        
        const tableContent = `<table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                <tr>
                    ${tableHeader}
                </tr>
            </thead>
            <tbody>
                ${tableBody}
            </tbody>
        </table>`;
        
        return this.buildTag('div', attributes, `\n${tableContent}\n`);
    }
}

/**
 * Generator for List components.
 * Renders a list with data-driven repetition using template children.
 */
export class ListGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const listProps = component.props as any;
        
        // Get template children - these are the components that will be repeated for each item
        const templateChildrenIds = listProps.templateChildren || [];
        let templateChildren = allComponents.filter(c => templateChildrenIds.includes(c.id));
        
        // Fallback: if templateChildrenIds is empty, use all children with parentId === component.id
        // This matches the behavior in the runtime List component
        if (templateChildren.length === 0) {
            templateChildren = allComponents.filter(c => c.parentId === component.id);
        }
        
        // Evaluate data expression
        const dataExpression = translateExpression(listProps.data || '[]', appDef, 'raw-js');
        
        // Evaluate template height and item spacing
        const templateHeight = translateExpression(listProps.templateHeight || 120, appDef, 'raw-js');
        const itemSpacing = translateExpression(listProps.itemSpacing || 8, appDef, 'raw-js');
        
        // Evaluate empty state text
        const emptyState = translateExpression(listProps.emptyState || 'No items found', appDef, 'raw-js');
        
        // Evaluate item key expression (for React keys)
        const itemKeyExpr = listProps.itemKey ? translateExpression(listProps.itemKey, appDef, 'raw-js') : 'index';
        
        // Build scope object for expression evaluation
        const scopeObject = `{
            theme,
            dataStore,
            get,
            ${appDef.variables.map(v => `${v.name}`).join(',\n            ')}
        }`;
        
        // Helper function to recursively generate template children with dynamic IDs
        // The generated code will be inserted into a template literal where ${index} is available
        const generateTemplateChildrenRecursive = (children: AppComponent[], parentIdPrefix: string): string => {
            if (children.length === 0) {
                return '';
            }
            
            return children.map(child => {
                const childGenerator = ComponentGeneratorFactory.create(child.type);
                const nestedChildren = allComponents.filter(c => c.parentId === child.id);
                
                // Check if this is a container component
                const isContainer = child.type === ComponentType.CONTAINER ||
                                   child.type === ComponentType.LIST;
                
                if (isContainer) {
                    // For containers, we need to generate children separately and inject them
                    // First generate nested children code
                    const nestedCode = nestedChildren.length > 0
                        ? generateTemplateChildrenRecursive(nestedChildren, child.id)
                        : '';
                    
                    // Generate container with a temporary ID
                    const tempChild: AppComponent = {
                        ...child,
                        id: `${child.id}_IDX_PLACEHOLDER`,
                        parentId: `${parentIdPrefix}_IDX_PLACEHOLDER`,
                    };
                    
                    // Generate container code
                    let containerCode = childGenerator.generate(tempChild, allComponents, appDef);
                    
                    // Replace placeholder in id attribute - convert from string to template literal
                    // We need \\${index} to produce \${index} in the output, which becomes ${index} when evaluated
                    containerCode = containerCode.replace(/id="([^"]*)_IDX_PLACEHOLDER"/g, (match, prefix) => {
                        return `id={\`${prefix}_item_\\\${index}\`}`;
                    });
                    containerCode = containerCode.replace(/id='([^']*)_IDX_PLACEHOLDER'/g, (match, prefix) => {
                        return `id={\`${prefix}_item_\\\${index}\`}`;
                    });
                    
                    // Replace any remaining placeholders
                    containerCode = containerCode.replace(/_IDX_PLACEHOLDER/g, `_item_\${index}`);
                    containerCode = containerCode.replace(/IDX_PLACEHOLDER/g, `\${index}`);
                    
                    // Inject nested children into the container
                    // Containers have structure: <div ...><div ...>...</div></div>
                    // We need to inject children before the inner closing </div>
                    if (nestedCode) {
                        // Find the inner div closing tag (second to last </div>)
                        const divMatches = containerCode.match(/<\/div>/g);
                        if (divMatches && divMatches.length >= 2) {
                            // Find the position of the second-to-last </div>
                            let pos = containerCode.length;
                            for (let i = 0; i < divMatches.length - 1; i++) {
                                pos = containerCode.lastIndexOf('</div>', pos - 1);
                            }
                            // Insert nested children before this closing tag
                            containerCode = containerCode.substring(0, pos) + '\n' + nestedCode + '\n' + containerCode.substring(pos);
                        }
                    }
                    
                    return containerCode;
                } else {
                    // For non-containers, generate directly with ID substitution
                    const tempChild: AppComponent = {
                        ...child,
                        id: `${child.id}_IDX_PLACEHOLDER`,
                        parentId: `${parentIdPrefix}_IDX_PLACEHOLDER`,
                    };
                    
                    let childCode = childGenerator.generate(tempChild, allComponents, appDef);
                    
                    // Replace placeholder in id attribute - convert from string to template literal
                    // Pattern: id="COMPONENT_ID_IDX_PLACEHOLDER" -> id={`COMPONENT_ID_item_${index}`}
                    // Note: We need to escape $ so it becomes a literal ${index} in the generated code
                    childCode = childCode.replace(/id="([^"]*)_IDX_PLACEHOLDER"/g, (match, prefix) => {
                        return `id={\`${prefix}_item_\${index}\`}`;
                    });
                    childCode = childCode.replace(/id='([^']*)_IDX_PLACEHOLDER'/g, (match, prefix) => {
                        return `id={\`${prefix}_item_\${index}\`}`;
                    });
                    
                    // For buttons, replace handler name with inline handler
                    // Button generator creates: onClick={handleComponentIdClick}
                    // The handler name will be: handleComponentIdIdxPlaceholderClick (with placeholder)
                    // We need: onClick={() => { /* handler body */ }}
                    if (child.type === ComponentType.BUTTON) {
                        const btnProps = child.props as any;
                        // The handler name includes the placeholder: handleButtonIdIdxPlaceholderClick
                        // Use tempChild.id to match what ButtonGenerator actually generated
                        const handlerNameWithPlaceholder = `handle${toPascalCase(tempChild.id)}Click`;
                        let handlerBody = 'console.warn("Button in list item - handler not implemented")';
                        
                        switch(btnProps.actionType) {
                            case 'alert':
                                handlerBody = `alert(${translateExpression(btnProps.actionAlertMessage, appDef, 'raw-js')})`;
                                break;
                            case 'updateVariable':
                                if (btnProps.actionVariableName) {
                                    const setterName = `set${toPascalCase(btnProps.actionVariableName)}`;
                                    const valueExpr = translateExpression(btnProps.actionVariableValue, appDef, 'raw-js') || 'undefined';
                                    if (valueExpr.includes(btnProps.actionVariableName)) {
                                        handlerBody = `${setterName}((${btnProps.actionVariableName}) => ${valueExpr})`;
                                    } else {
                                        handlerBody = `${setterName}(${valueExpr})`;
                                    }
                                }
                                break;
                            case 'executeCode':
                                if (btnProps.actionCodeToExecute) {
                                    handlerBody = translateExpression(btnProps.actionCodeToExecute, appDef, 'code-block');
                                }
                                break;
                        }
                        
                        // Replace handler reference with inline handler
                        // Escape special regex characters in handler name
                        const escapedHandlerName = handlerNameWithPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        childCode = childCode.replace(
                            new RegExp(`onClick=\\{${escapedHandlerName}\\}`, 'g'),
                            `onClick={() => { ${handlerBody} }}`
                        );
                    }
                    
                    // Replace any remaining placeholders in other contexts
                    // Use \${index} so it becomes ${index} in the generated code (evaluated at runtime)
                    childCode = childCode.replace(/_IDX_PLACEHOLDER/g, `_item_\${index}`);
                    childCode = childCode.replace(/IDX_PLACEHOLDER/g, `\${index}`);
                    
                    // Non-containers shouldn't have nested children, but handle it just in case
                    if (nestedChildren.length > 0) {
                        const nestedCode = generateTemplateChildrenRecursive(nestedChildren, child.id);
                        return childCode + '\n' + nestedCode;
                    }
                    
                    return childCode;
                }
            }).join('\n');
        };
        
        // Generate template children code
        const templateChildrenCode = templateChildren.length > 0
            ? generateTemplateChildrenRecursive(templateChildren, component.id)
            : '';
        
        // Container style with overflow for scrolling
        // Note: Don't override width/height/position here - let generateStyleAttribute use the actual component dimensions
        // The List component should be absolutely positioned with fixed width/height from props
        const containerStyle = {
            overflowY: `'auto'`,
        };
        
        // Ensure the List component uses absolute positioning (override any position prop that might be set)
        // The List container itself should be absolutely positioned, not relatively positioned
        const listPropsWithAbsolutePosition = {
            ...component.props,
            position: undefined, // Remove any position prop to use the default 'absolute' from generateStyleAttribute
        };
        
        // Build the list container
        // Note: List component should use absolute positioning with fixed width/height from props
        // The className "w-full h-full" would override the width, so we remove it
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(listPropsWithAbsolutePosition, appDef, containerStyle)
        ];
        
        // Generate list content
        // Note: dataExpression is already translated JavaScript code, so we evaluate it directly
        const listContent = `{(() => {
            const data = (() => {
                try {
                    return ${dataExpression};
                } catch (error) {
                    return [];
                }
            })();
            const listData = Array.isArray(data) ? data.filter(item => item != null) : [];
            const templateHeight = typeof ${templateHeight} === 'number' ? ${templateHeight} : (typeof ${templateHeight} === 'string' ? parseFloat(${templateHeight}) || 120 : 120);
            const itemSpacing = typeof ${itemSpacing} === 'number' ? ${itemSpacing} : (typeof ${itemSpacing} === 'string' ? parseFloat(${itemSpacing}) || 8 : 8);
            const totalHeight = listData.length > 0 
                ? (templateHeight + itemSpacing) * listData.length - itemSpacing 
                : templateHeight;
            
            if (listData.length === 0) {
                return (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: \`\${templateHeight}px\`,
                            color: '#6b7280',
                            fontSize: '14px',
                        }}
                    >
                        {${emptyState} || 'No items found'}
                    </div>
                );
            }
            
            return (
                <div style={{ position: 'relative', width: '100%', minHeight: \`\${totalHeight}px\` }}>
                    {listData.map((currentItem, index) => {
                        // Safety check: skip if currentItem is null or undefined
                        if (currentItem == null) {
                            return null;
                        }
                        const itemKey = ${itemKeyExpr === 'index' ? 'String(index)' : `(() => {
                            try {
                                const keyScope = { ...${scopeObject}, currentItem, index };
                                const keyResult = ${itemKeyExpr};
                                return String(keyResult ?? index);
                            } catch (error) {
                                return String(index);
                            }
                        })()`};
                        const topOffset = index * (templateHeight + itemSpacing);
                        const itemScope = { ...${scopeObject}, currentItem, index };
                        
                        return (
                            <div
                                key={itemKey}
                                style={{
                                    position: 'absolute',
                                    top: \`\${topOffset}px\`,
                                    left: '0',
                                    width: '100%',
                                    height: \`\${templateHeight}px\`,
                                }}
                                ${listProps.onItemClick ? `onClick={() => {
                                    try {
                                        const clickScope = { ...itemScope, actions };
                                        ${translateExpression(listProps.onItemClick, appDef, 'code-block')};
                                    } catch (error) {
                                        console.error('Error executing onItemClick:', error);
                                    }
                                }}` : ''}
                            >
                                ${templateChildrenCode || '<!-- No template children -->'}
                            </div>
                        );
                    })}
                </div>
            );
        })()}`;
        
        return this.buildTag('div', attributes, `\n${listContent}\n`);
    }
}

/**
 * Fallback generator for unknown or unsupported component types.
 * Renders a visual placeholder with an error style to alert the developer.
 */
export class FallbackGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const style = {
            backgroundColor: `'#fef2f2'`,
            border: `'1px dashed #ef4444'`,
            display: `'flex'`,
            alignItems: `'center'`,
            justifyContent: `'center'`,
            fontSize: `'10px'`,
            color: `'#b91c1c'`,
        };
        const attributes = [
             ...this.getCommonAttributes(component, appDef),
             this.generateStyleAttribute(component.props, appDef, style)
        ];
        return this.buildTag('div', attributes, `Unsupported Component: ${component.type}`);
    }
}
