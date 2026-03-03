import { AppDefinition, ComponentType, DataStore, AppComponent, ComponentProps } from '@/types';
import { componentRegistry } from '@/components/component-registry/registry';
import { generateAutoResponsiveDefaults } from '@/responsive';
import { generateStructuredContent } from './geminiClient';
import { getAppEditingInstruction } from './systemInstructions';
import { postProcessComponents, wireButtonActions } from './templateGenerationService';

const FORM_COMPONENT_TYPES = [
  'INPUT', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'SWITCH', 'RADIO_GROUP',
  'DATE_PICKER', 'TIME_PICKER', 'SLIDER', 'FILE_UPLOAD', 'RATING',
];

const BOOLEAN_FORM_TYPES = ['CHECKBOX', 'SWITCH'];
const NUMERIC_FORM_TYPES = ['SLIDER', 'RATING'];

/**
 * Generates or modifies the application layout using the Gemini AI model.
 * This is the core app editing/creation service that processes add/update/delete patches.
 */
export async function generateAppLayout(
  prompt: string,
  currentApp: AppDefinition,
  currentPageId: string,
): Promise<AppDefinition | null> {
  const currentPageComponents = currentApp.components.filter(c => c.pageId === currentPageId);
  const rootComponents = currentPageComponents.filter(c => !c.parentId);
  const maxRootOrder = rootComponents.reduce((max, c) => Math.max(max, (c.props as any).order ?? 0), -1);

  const systemInstruction = getAppEditingInstruction(currentApp, currentPageId, maxRootOrder);

  let patch: any;
  try {
    patch = await generateStructuredContent({
      systemInstruction,
      prompt,
    });
  } catch (err: any) {
    const message = err?.message || String(err);
    console.error('[AI Generation] Failed to generate content:', message);
    window.alert(`AI generation failed: ${message}`);
    return null;
  }

  // Lightweight validation: patch must be an object
  if (!patch || typeof patch !== 'object') {
    console.error('[AI Generation] Invalid response: expected an object, got', typeof patch);
    window.alert('AI returned an invalid response. Please try again.');
    return null;
  }

  if (!patch) return null;

  // Log the AI response for debugging
  console.debug('[AI Generation] Received patch:', JSON.stringify(patch, null, 2));

  // Handle legacy 'components' key (some models may still use it)
  if (Array.isArray(patch.components)) {
    if (!Array.isArray(patch.add)) {
      patch.add = [];
    }
    patch.add.push(...patch.components);
    delete patch.components;
  }

  // Validate: prevent accidental full-page regeneration
  // If AI tries to delete all existing components and add new ones, something is wrong
  const existingIds = new Set(currentPageComponents.map(c => c.id));
  const deleteIds = new Set<string>(patch.delete || []);
  const deletingAllExisting = existingIds.size > 0 && [...existingIds].every(id => deleteIds.has(id));
  if (deletingAllExisting && (patch.add?.length || 0) > 0 && existingIds.size > 2) {
    console.warn('[AI Generation] AI attempted to delete all existing components and replace them. This looks like a regeneration instead of an edit. Allowing but logging warning.');
  }

  let currentComponents = [...currentApp.components];
  const dataStoreUpdates: DataStore = {};

  // Initialize dataStore values for new form components
  if (patch.add?.length) {
    patch.add.forEach((comp: any) => {
      if (comp && comp.id && comp.type) {
        if (FORM_COMPONENT_TYPES.includes(comp.type)) {
          if (BOOLEAN_FORM_TYPES.includes(comp.type)) {
            dataStoreUpdates[comp.id] = false;
          } else if (NUMERIC_FORM_TYPES.includes(comp.type)) {
            dataStoreUpdates[comp.id] = (comp.props?.defaultValue ?? 0);
          } else {
            dataStoreUpdates[comp.id] = '';
          }
        }
      }
    });
  }

  // Process deletions (cascade to children)
  if (patch.delete?.length) {
    const idsToDelete = new Set<string>(patch.delete);
    let changed = true;
    while (changed) {
      changed = false;
      const childrenToDelete = currentComponents.filter(c => c.parentId && idsToDelete.has(c.parentId));
      if (childrenToDelete.length > 0) {
        childrenToDelete.forEach(c => idsToDelete.add(c.id));
        changed = true;
      }
    }
    currentComponents = currentComponents.filter(c => !idsToDelete.has(c.id));
  }

  // Process updates — shallow merge of props, preserving all existing props not mentioned
  if (patch.update?.length) {
    const updatesMap = new Map<string, any>();
    for (const u of patch.update) {
      if (u && u.id && u.props && typeof u.props === 'object') {
        updatesMap.set(u.id, u.props);
      }
    }

    currentComponents = currentComponents.map(c => {
      if (updatesMap.has(c.id)) {
        const newProps = updatesMap.get(c.id);
        // Clean up any x/y coordinates the model might send in updates
        delete newProps.x;
        delete newProps.y;
        // Shallow merge: existing props are preserved, only specified props change
        return {
          ...c,
          // Also allow updating parentId through the update operation
          ...(newProps.parentId !== undefined ? { parentId: newProps.parentId || null } : {}),
          props: {
            ...c.props,
            ...newProps,
          } as ComponentProps,
        };
      }
      return c;
    });
  }

  // Process additions — merge with plugin defaults, assign order, generate responsive defaults
  if (patch.add?.length) {
    let nextRootOrder = maxRootOrder + 1;

    // Collect order values already used by existing root components to avoid conflicts
    const usedRootOrders = new Set<number>();
    currentComponents
      .filter(c => c.pageId === currentPageId && !c.parentId)
      .forEach(c => {
        const order = (c.props as any).order;
        if (typeof order === 'number') usedRootOrders.add(order);
      });

    const newComponents = patch.add.map((comp: any) => {
      if (!comp || typeof comp !== 'object' || !comp.id || !comp.type) {
        console.warn('[AI Generation] Skipping invalid component:', comp);
        return null;
      }

      const plugin = componentRegistry[comp.type as ComponentType];
      if (!plugin) {
        console.warn(`[AI Generation] Unknown component type "${comp.type}", adding without plugin defaults.`);
      }
      const defaultProps = plugin?.paletteConfig.defaultProps || {};
      const aiProps = comp.props || {};

      // Clean up any leftover x/y coordinates the model might send
      delete aiProps.x;
      delete aiProps.y;

      // Assign order if not provided for root-level components
      if (aiProps.order === undefined || aiProps.order === null) {
        if (!comp.parentId) {
          // Find next unused order
          while (usedRootOrders.has(nextRootOrder)) {
            nextRootOrder++;
          }
          aiProps.order = nextRootOrder;
          usedRootOrders.add(nextRootOrder);
          nextRootOrder++;
        }
      } else if (!comp.parentId) {
        // AI provided an order — track it
        usedRootOrders.add(aiProps.order);
      }

      const finalComp: AppComponent = {
        id: comp.id,
        type: comp.type,
        parentId: comp.parentId || null,
        pageId: currentPageId,
        props: {
          ...defaultProps,
          ...aiProps,
        } as ComponentProps,
      };

      // Generate auto-responsive defaults (mobile-first overrides)
      const autoResult = generateAutoResponsiveDefaults(finalComp);
      if (autoResult) {
        if (autoResult.baseOverrides) {
          finalComp.props = { ...finalComp.props, ...autoResult.baseOverrides } as ComponentProps;
        }
        if (autoResult.responsive) {
          const existing = (finalComp.props as any).responsive || {};
          finalComp.props = {
            ...finalComp.props,
            responsive: {
              tablet: { ...existing.tablet, ...autoResult.responsive.tablet },
              desktop: { ...existing.desktop, ...autoResult.responsive.desktop },
              large: { ...existing.large, ...autoResult.responsive.large },
            },
          } as ComponentProps;
        }
      }

      return finalComp;
    }).filter((c): c is AppComponent => c !== null);

    // Post-process new components to fix common AI mistakes
    postProcessComponents(newComponents);

    currentComponents.push(...newComponents);
  }

  const newVariables = Array.isArray(patch.variables)
    ? patch.variables
        .filter((v: any) => v && v.id && v.name && v.type)
        .map((v: any) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          initialValue: v.type === 'number' ? Number(v.initialValue) || 0
            : v.type === 'boolean' ? v.initialValue === 'true'
            : v.initialValue ?? '',
        }))
    : [];

  // Initialize dataStore with variable initial values
  const variableDataStore: DataStore = {};
  newVariables.forEach((v: any) => {
    variableDataStore[v.name] = v.initialValue;
  });

  // Second-pass: wire button actions for newly added buttons that lack actionCodeToExecute
  const allVariables = (currentApp.variables || []).concat(newVariables);
  await wireButtonActions(currentComponents, allVariables, prompt);

  const result = {
    ...currentApp,
    components: currentComponents,
    variables: (currentApp.variables || []).concat(newVariables),
    dataStore: {
      ...currentApp.dataStore,
      ...dataStoreUpdates,
      ...variableDataStore,
    },
  };

  console.debug(`[AI Generation] Result: ${result.components.length} total components (added ${patch.add?.length || 0}, updated ${patch.update?.length || 0}, deleted ${patch.delete?.length || 0})`);

  return result;
}
