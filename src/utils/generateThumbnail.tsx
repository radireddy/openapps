import React from 'react';
import ReactDOM from 'react-dom/client';
import { toJpeg } from 'html-to-image';
import { AppDefinition, ComponentType } from '@/types';
import { RenderedComponent } from '@/components/RenderedComponent';
import { buildEvaluationScope } from '@/hooks/state/evaluationScope';

const THUMBNAIL_WIDTH = 480;
const THUMBNAIL_HEIGHT = 270;
const JPEG_QUALITY = 0.7;

const noop = () => {};
const noopAsync = async () => {};

/**
 * Generates a JPEG thumbnail of an app's main page by rendering its components
 * offscreen and capturing with html-to-image.
 *
 * @returns base64 data URL of the thumbnail, or empty string on failure / no components
 */
export async function generateThumbnail(appDefinition: AppDefinition): Promise<string> {
  const { components, mainPageId, dataStore } = appDefinition;

  // Get root components for the main page
  const pageComponents = components.filter(c => c.pageId === mainPageId);
  const rootComponents = pageComponents.filter(c => !c.parentId);

  if (rootComponents.length === 0) {
    return '';
  }

  // Build evaluation scope (same as Preview uses)
  const evaluationScope = buildEvaluationScope(appDefinition, dataStore, components, {});

  // Create offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${THUMBNAIL_WIDTH}px`;
  container.style.height = `${THUMBNAIL_HEIGHT}px`;
  container.style.overflow = 'hidden';
  container.style.backgroundColor = appDefinition.theme?.colors?.background || '#ffffff';
  document.body.appendChild(container);

  // Inner wrapper that mirrors Preview layout
  const inner = document.createElement('div');
  inner.style.width = '100%';
  inner.style.minHeight = '100%';
  inner.style.display = 'flex';
  inner.style.flexDirection = 'column';
  inner.style.alignItems = 'stretch';
  inner.style.padding = '8px';
  inner.style.fontFamily = appDefinition.theme?.font?.family || 'Segoe UI, sans-serif';
  inner.style.transform = 'scale(0.5)';
  inner.style.transformOrigin = 'top left';
  inner.style.width = '200%';
  container.appendChild(inner);

  const root = ReactDOM.createRoot(inner);

  try {
    // Render components
    root.render(
      <ThumbnailContent
        rootComponents={rootComponents}
        allComponents={pageComponents}
        evaluationScope={evaluationScope}
        dataStore={dataStore}
      />
    );

    // Wait for render to complete
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 200);
      });
    });

    // Capture as JPEG
    const dataUrl = await toJpeg(container, {
      width: THUMBNAIL_WIDTH,
      height: THUMBNAIL_HEIGHT,
      quality: JPEG_QUALITY,
      cacheBust: true,
    });

    return dataUrl;
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    return '';
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

/**
 * Stateless component that renders the root components for thumbnail capture.
 * Kept as a separate component so React can reconcile it properly.
 */
const ThumbnailContent: React.FC<{
  rootComponents: AppDefinition['components'];
  allComponents: AppDefinition['components'];
  evaluationScope: Record<string, any>;
  dataStore: Record<string, any>;
}> = ({ rootComponents, allComponents, evaluationScope, dataStore }) => (
  <>
    {rootComponents.map(comp => (
      <RenderedComponent
        key={comp.id}
        component={comp}
        allComponents={allComponents}
        selectedComponentIds={[]}
        onSelect={noop as any}
        onUpdate={noop as any}
        onUpdateComponents={noop as any}
        onDelete={noop}
        onDrop={noop as any}
        onReparentCheck={noop}
        mode="preview"
        dataStore={dataStore}
        onUpdateDataStore={noop}
        actions={{
          createRecord: noopAsync as any,
          updateRecord: noopAsync as any,
          deleteRecord: noopAsync as any,
          selectRecord: noop,
          updateVariable: noop,
          submitForm: noop,
          navigateTo: noop,
        }}
        evaluationScope={evaluationScope}
      />
    ))}
  </>
);
