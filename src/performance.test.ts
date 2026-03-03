import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { performance } from 'perf_hooks'; // Use Node's performance for more accuracy in Jest
import { useAppData } from '@/hooks/useAppData';
import { AppDefinition, ComponentType, AppVariableType, AppComponent, AppVariable, LabelProps } from 'types';
import '@testing-library/jest-dom';

/**
 * Generates a complex AppDefinition for performance testing.
 * @param componentCount The number of components to generate. Each component adds ~10 expressions.
 * @returns A complete AppDefinition object.
 */
const generatePerfTestApp = (componentCount: number): AppDefinition => {
    const components: AppComponent[] = [];
    const variables: AppVariable[] = [];
    const varCount = 10;

    // Create variables for expressions to reference
    for (let i = 0; i < varCount; i++) {
        variables.push({
            id: `var${i}`,
            name: `var${i}`,
            type: AppVariableType.NUMBER,
            initialValue: i,
        });
    }

    // Generate components, each with multiple expression-driven properties
    for (let i = 0; i < componentCount; i++) {
        const componentId = `LABEL_${i}`;
        const props: LabelProps = {
            x: (i % 20) * 50,
            y: Math.floor(i / 20) * 25,
            width: 50,
            height: 20,
            // 10 expressions per component
            text: `{{ var0 + ${i} }}`,
            color: `{{ var1 > 5 ? '#ff0000' : '#0000ff' }}`,
            fontSize: `{{ 8 + var2 }}`,
            hidden: `{{ ${i} % 10 === var3 }}`,
            disabled: `{{ ${i} < var4 }}`,
            opacity: `{{ var5 / 10 }}`,
            borderRadius: `{{ var6 }}px`,
            borderWidth: `{{ var7 / 2 }}px`,
            borderColor: `{{ var8 === 8 ? '#00ff00' : '#000000' }}`,
            boxShadow: `{{ var9 }}px {{ var9 }}px {{ var9 }}px #ccc`,
            // Non-expression props
            fontWeight: 'normal',
            textAlign: 'left',
        };
        components.push({
            id: componentId,
            type: ComponentType.LABEL,
            pageId: 'page1',
            props: props as any,
        });
    }

    const totalExpressions = componentCount * 10;

    return {
        id: `perf_app_${componentCount}`,
        name: `Perf Test App (${totalExpressions} expressions)`,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        pages: [{ id: 'page1', name: 'Main Page' }],
        mainPageId: 'page1',
        components,
        dataStore: {},
        variables,
        theme: {} as any, // Theme not needed for this test
    };
};

describe('Performance Benchmark: Expression Evaluation', () => {
    // This test measures the time taken for the app's reactive state to update
    // when a large number of expressions are dependent on that state. It simulates
    // a user action and measures the subsequent re-evaluation time.

    // Note: Test suites have a default timeout (5s in Jest). If benchmarks
    // for very large component counts are added, this may need to be increased.
    it('measures reactive update time for an app with thousands of expressions', () => {
        const componentCounts = [100, 500, 1000, 1500];
        
        console.log("\n--- Expression Evaluation Performance Benchmark ---");
        console.log("Measuring the time to re-evaluate all expressions after a state change.");

        const results: { expressions: number; duration: number }[] = [];

        componentCounts.forEach(count => {
            const appDef = generatePerfTestApp(count);
            const totalExpressions = count * 10;
            const { result } = renderHook(() => useAppData(appDef, jest.fn()));

            // Allow initial render and state setup to complete
            act(() => {});

            // --- Measurement Phase ---
            const startTime = performance.now();

            // Trigger a single state change that will cause all expressions
            // referencing 'var0' to re-evaluate. Because the `evaluationScope` object
            // is recreated, all memoized expressions are re-checked.
            act(() => {
                result.current.actions.updateVariable('var0', 100);
            });

            const endTime = performance.now();
            const duration = endTime - startTime;
            // --- End Measurement ---

            results.push({ expressions: totalExpressions, duration });

            // Ensure the state was actually updated
            expect(result.current.variableState['var0']).toBe(100);

            // Set a reasonable performance expectation: the update should not take
            // longer than 2 seconds, even for the largest test case.
            expect(duration).toBeLessThan(2000);
        });
        
        // --- Reporting ---
        console.log("\nBenchmark Results:");
        console.table(results.map(r => ({
            "Component Count": r.expressions / 10,
            "Total Expressions": r.expressions,
            "Update Duration (ms)": r.duration.toFixed(3),
        })));
        console.log("-------------------------------------------------\n");
    });
});