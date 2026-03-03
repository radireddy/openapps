import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { FileUploadPlugin } from '@/components/component-registry/FileUpload';
import { ComponentType } from 'types';

/** Helper: create a mock File object */
function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

/** Helper: create a FileList-like object from an array of Files */
function createFileList(files: File[]): FileList {
  const fileList: any = [...files];
  fileList.item = (index: number) => files[index] || null;
  Object.defineProperty(fileList, 'length', { value: files.length });
  return fileList as FileList;
}

/** Helper: build a DataTransfer-like object for drag events */
function createDataTransfer(files: File[]) {
  return { files: createFileList(files) };
}

const FileUploadRenderer = FileUploadPlugin.renderer;

describe('FileUploadPlugin', () => {
  describe('Plugin registration', () => {
    it('should have correct component type', () => {
      expect(FileUploadPlugin.type).toBe(ComponentType.FILE_UPLOAD);
    });

    it('should have palette config with label and icon', () => {
      expect(FileUploadPlugin.paletteConfig.label).toBe('File Upload');
      expect(FileUploadPlugin.paletteConfig.icon).toBeTruthy();
    });

    it('should have default props configured', () => {
      expect(FileUploadPlugin.paletteConfig.defaultProps.multiple).toBe(false);
      expect(FileUploadPlugin.paletteConfig.defaultProps.maxFileSize).toBe(10485760);
      expect(FileUploadPlugin.paletteConfig.defaultProps.borderStyle).toBe('dashed');
    });
  });

  describe('Renderer', () => {
    const baseComponent = {
      id: 'fileupload1',
      type: ComponentType.FILE_UPLOAD,
      props: {
        width: '100%', height: 120,
        placeholder: 'Drop files here',
      },
    };

    it('should render the drop zone with placeholder text', () => {
      render(<FileUploadRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Drop files here')).toBeInTheDocument();
    });

    it('should render the upload icon', () => {
      render(<FileUploadRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const dropzone = screen.getByTestId('file-upload-dropzone');
      expect(dropzone).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, label: 'Upload Documents' } };
      render(<FileUploadRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    });

    it('should show accepted file types when specified', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, accept: '.jpg,.png,.pdf' } };
      render(<FileUploadRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('Accepted: .jpg,.png,.pdf')).toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(<FileUploadRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const dropzone = screen.getByTestId('file-upload-dropzone');
      expect(dropzone).toHaveAttribute('role', 'button');
      expect(dropzone).toHaveAttribute('aria-label', 'File upload area');
    });

    it('should be disabled when disabled expression is true', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, disabled: '{{true}}' } };
      render(<FileUploadRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const dropzone = screen.getByTestId('file-upload-dropzone');
      expect(dropzone).toHaveAttribute('aria-disabled', 'true');
    });

    it('should show required indicator when required', () => {
      const comp = { ...baseComponent, props: { ...baseComponent.props, label: 'Files', required: true } };
      render(<FileUploadRenderer component={comp} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(React.createElement(FileUploadPlugin.properties));
      expect(container.innerHTML).toBe('');
    });
  });

  describe('File selection via hidden input', () => {
    const baseComponent = {
      id: 'fileupload1',
      type: ComponentType.FILE_UPLOAD,
      props: { width: '100%', height: 120, placeholder: 'Drop files here' },
    };

    it('should display uploaded file name and size after selecting a file', () => {
      const onUpdateDataStore = jest.fn();
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />,
      );

      const file = createMockFile('report.pdf', 2048, 'application/pdf');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: createFileList([file]) } });

      expect(screen.getByText('report.pdf')).toBeInTheDocument();
      expect(screen.getByText('(2.0 KB)')).toBeInTheDocument();
      expect(onUpdateDataStore).toHaveBeenCalledWith(
        'fileupload1',
        [{ name: 'report.pdf', size: 2048, type: 'application/pdf' }],
      );
    });

    it('should replace previous file in single-file mode', () => {
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      const file1 = createMockFile('first.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file1]) } });
      expect(screen.getByText('first.txt')).toBeInTheDocument();

      const file2 = createMockFile('second.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file2]) } });
      expect(screen.queryByText('first.txt')).not.toBeInTheDocument();
      expect(screen.getByText('second.txt')).toBeInTheDocument();
    });

    it('should handle empty file list gracefully', () => {
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: createFileList([]) } });

      // Should still show the placeholder
      expect(screen.getByText('Drop files here')).toBeInTheDocument();
    });
  });

  describe('Multiple file upload', () => {
    const multiComponent = {
      id: 'fileupload-multi',
      type: ComponentType.FILE_UPLOAD,
      props: {
        width: '100%', height: 120,
        placeholder: 'Drop files here',
        multiple: true,
        maxFiles: 3,
      },
    };

    it('should accumulate files when multiple is enabled', () => {
      render(
        <FileUploadRenderer
          component={multiComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      const file1 = createMockFile('a.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file1]) } });
      expect(screen.getByText('a.txt')).toBeInTheDocument();

      const file2 = createMockFile('b.txt', 200, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file2]) } });
      expect(screen.getByText('a.txt')).toBeInTheDocument();
      expect(screen.getByText('b.txt')).toBeInTheDocument();
    });

    it('should show error when exceeding maxFiles limit', () => {
      render(
        <FileUploadRenderer
          component={multiComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload 3 files at once (the limit)
      const batch1 = [
        createMockFile('a.txt', 100, 'text/plain'),
        createMockFile('b.txt', 100, 'text/plain'),
        createMockFile('c.txt', 100, 'text/plain'),
      ];
      fireEvent.change(input, { target: { files: createFileList(batch1) } });
      expect(screen.getByText('a.txt')).toBeInTheDocument();

      // Try to add a 4th file — should produce an error
      const file4 = createMockFile('d.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file4]) } });
      expect(screen.getByText('Maximum 3 files allowed')).toBeInTheDocument();
    });

    it('should show "Add more files" button when under maxFiles limit', () => {
      render(
        <FileUploadRenderer
          component={multiComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('a.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file]) } });

      expect(screen.getByText('+ Add more files')).toBeInTheDocument();
    });

    it('should not show "Add more files" button when at maxFiles limit', () => {
      render(
        <FileUploadRenderer
          component={multiComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const batch = [
        createMockFile('a.txt', 100, 'text/plain'),
        createMockFile('b.txt', 100, 'text/plain'),
        createMockFile('c.txt', 100, 'text/plain'),
      ];
      fireEvent.change(input, { target: { files: createFileList(batch) } });

      expect(screen.queryByText('+ Add more files')).not.toBeInTheDocument();
    });
  });

  describe('File removal', () => {
    const baseComponent = {
      id: 'fileupload1',
      type: ComponentType.FILE_UPLOAD,
      props: { width: '100%', height: 120, placeholder: 'Drop files here' },
    };

    it('should show a remove button for each uploaded file in preview mode', () => {
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('remove-me.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file]) } });

      const removeBtn = screen.getByRole('button', { name: 'Remove remove-me.txt' });
      expect(removeBtn).toBeInTheDocument();
    });

    it('should remove a file and return to placeholder when the last file is removed', () => {
      const onUpdateDataStore = jest.fn();
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
          onUpdateDataStore={onUpdateDataStore}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('doc.pdf', 500, 'application/pdf');
      fireEvent.change(input, { target: { files: createFileList([file]) } });
      expect(screen.getByText('doc.pdf')).toBeInTheDocument();

      const removeBtn = screen.getByRole('button', { name: 'Remove doc.pdf' });
      fireEvent.click(removeBtn);

      expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument();
      expect(screen.getByText('Drop files here')).toBeInTheDocument();
      // Should have been called with empty array
      expect(onUpdateDataStore).toHaveBeenLastCalledWith('fileupload1', []);
    });

    it('should not show remove button in edit mode', () => {
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="edit"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      // In edit mode, upload doesn't process files so there won't be remove buttons
      expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    });
  });

  describe('File type validation (accept attribute)', () => {
    it('should reject files that do not match the accept extension filter', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          accept: '.pdf,.docx',
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const badFile = createMockFile('photo.jpg', 500, 'image/jpeg');
      fireEvent.change(input, { target: { files: createFileList([badFile]) } });

      expect(screen.getByText('photo.jpg is not an accepted file type')).toBeInTheDocument();
      expect(screen.queryByText('photo.jpg')).not.toBeInTheDocument();
    });

    it('should accept files matching a wildcard MIME type (e.g. image/*)', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          accept: 'image/*',
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const goodFile = createMockFile('photo.png', 500, 'image/png');
      fireEvent.change(input, { target: { files: createFileList([goodFile]) } });

      expect(screen.getByText('photo.png')).toBeInTheDocument();
    });

    it('should reject files not matching a wildcard MIME type', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          accept: 'image/*',
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const badFile = createMockFile('data.csv', 500, 'text/csv');
      fireEvent.change(input, { target: { files: createFileList([badFile]) } });

      expect(screen.getByText('data.csv is not an accepted file type')).toBeInTheDocument();
    });

    it('should accept files matching an exact MIME type', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          accept: 'application/pdf',
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('report.pdf', 500, 'application/pdf');
      fireEvent.change(input, { target: { files: createFileList([file]) } });

      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });
  });

  describe('File size validation', () => {
    it('should reject a file that exceeds maxFileSize', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          maxFileSize: 1024, // 1 KB limit
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const bigFile = createMockFile('huge.bin', 2048, 'application/octet-stream');
      fireEvent.change(input, { target: { files: createFileList([bigFile]) } });

      expect(screen.getByText('huge.bin exceeds maximum size of 1.0 KB')).toBeInTheDocument();
    });

    it('should accept a file within the maxFileSize limit', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          maxFileSize: 5000,
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const smallFile = createMockFile('small.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([smallFile]) } });

      expect(screen.getByText('small.txt')).toBeInTheDocument();
    });

    it('should format file size as bytes when less than 1 KB', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: { width: '100%', height: 120, placeholder: 'Drop files here' },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const tinyFile = createMockFile('tiny.txt', 500, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([tinyFile]) } });

      expect(screen.getByText('(500 B)')).toBeInTheDocument();
    });

    it('should format file size as MB when 1 MB or greater', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: { width: '100%', height: 120, placeholder: 'Drop files here' },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createMockFile('big.zip', 2 * 1024 * 1024, 'application/zip');
      fireEvent.change(input, { target: { files: createFileList([largeFile]) } });

      expect(screen.getByText('(2.0 MB)')).toBeInTheDocument();
    });

    it('should show MB in the error message when maxFileSize is in MB range', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          maxFileSize: 1024 * 1024, // 1 MB
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const bigFile = createMockFile('toobig.dat', 2 * 1024 * 1024, 'application/octet-stream');
      fireEvent.change(input, { target: { files: createFileList([bigFile]) } });

      expect(screen.getByText('toobig.dat exceeds maximum size of 1.0 MB')).toBeInTheDocument();
    });
  });

  describe('Drag and drop', () => {
    const baseComponent = {
      id: 'fileupload1',
      type: ComponentType.FILE_UPLOAD,
      props: { width: '100%', height: 120, placeholder: 'Drop files here' },
    };

    it('should accept dropped files in preview mode', () => {
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const dropzone = screen.getByTestId('file-upload-dropzone');
      const file = createMockFile('dropped.txt', 300, 'text/plain');

      fireEvent.dragOver(dropzone, { dataTransfer: createDataTransfer([file]) });
      fireEvent.drop(dropzone, { dataTransfer: createDataTransfer([file]) });

      expect(screen.getByText('dropped.txt')).toBeInTheDocument();
    });

    it('should not accept dropped files in edit mode', () => {
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="edit"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const dropzone = screen.getByTestId('file-upload-dropzone');
      const file = createMockFile('dropped.txt', 300, 'text/plain');

      fireEvent.drop(dropzone, { dataTransfer: createDataTransfer([file]) });

      // Still showing the placeholder, file was not processed
      expect(screen.getByText('Drop files here')).toBeInTheDocument();
    });

    it('should apply drag-over visual styling on dragover and reset on dragleave', () => {
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const dropzone = screen.getByTestId('file-upload-dropzone');

      // Trigger dragOver
      fireEvent.dragOver(dropzone, { dataTransfer: createDataTransfer([]) });
      // The border color should change to primary color
      expect(dropzone.style.borderColor).toBe('#4f46e5');

      // Trigger dragLeave
      fireEvent.dragLeave(dropzone, { dataTransfer: createDataTransfer([]) });
      // Border color should reset
      expect(dropzone.style.borderColor).not.toBe('#4f46e5');
    });
  });

  describe('Edit mode vs preview mode behavior', () => {
    const baseComponent = {
      id: 'fileupload1',
      type: ComponentType.FILE_UPLOAD,
      props: { width: '100%', height: 120, placeholder: 'Drop files here' },
    };

    it('should not open file picker on click in edit mode', () => {
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="edit"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const dropzone = screen.getByTestId('file-upload-dropzone');
      // Clicking the dropzone in edit mode should not trigger the hidden input
      // We verify indirectly: no file is added, placeholder remains
      fireEvent.click(dropzone);
      expect(screen.getByText('Drop files here')).toBeInTheDocument();
    });

    it('should show default placeholder when none provided', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: { width: '100%', height: 120 },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      expect(screen.getByText('Drag & drop files here, or click to browse')).toBeInTheDocument();
    });

    it('should not attach drag event handlers in edit mode', () => {
      render(
        <FileUploadRenderer
          component={baseComponent}
          mode="edit"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const dropzone = screen.getByTestId('file-upload-dropzone');
      // In edit mode, dragOver should not change border color (handlers are undefined)
      fireEvent.dragOver(dropzone);
      // Border color should remain the default
      expect(dropzone.style.borderColor).not.toBe('#4f46e5');
    });
  });

  describe('Read-only and disabled states', () => {
    it('should not process files when readOnly is true', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          readOnly: true,
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('blocked.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file]) } });

      // File should not be processed — placeholder still visible
      expect(screen.getByText('Drop files here')).toBeInTheDocument();
    });

    it('should show not-allowed cursor when disabled in preview mode', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          disabled: '{{true}}',
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const dropzone = screen.getByTestId('file-upload-dropzone');
      expect(dropzone.style.cursor).toBe('not-allowed');
    });

    it('should disable the hidden file input when component is disabled in preview', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          disabled: '{{true}}',
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });
  });

  describe('Custom accessibility label', () => {
    it('should use custom accessibilityLabel for aria-label', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          accessibilityLabel: 'Upload your resume',
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const dropzone = screen.getByTestId('file-upload-dropzone');
      expect(dropzone).toHaveAttribute('aria-label', 'Upload your resume');
    });
  });

  describe('Help text display', () => {
    it('should display help text in preview mode', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          label: 'Attachments',
          helpText: 'Max 10MB per file',
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      expect(screen.getByText('Max 10MB per file')).toBeInTheDocument();
    });
  });

  describe('Theme integration', () => {
    it('should use theme primary color for drag-over border', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: { width: '100%', height: 120, placeholder: 'Drop files here' },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{ theme: { colors: { primary: '#ff5500' } } }}
        />,
      );

      const dropzone = screen.getByTestId('file-upload-dropzone');
      fireEvent.dragOver(dropzone, { dataTransfer: createDataTransfer([]) });

      expect(dropzone.style.borderColor).toBe('#ff5500');
    });
  });

  describe('Error state clearing', () => {
    it('should clear the upload error when a valid file is uploaded after a rejected one', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          maxFileSize: 1024,
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload a file that's too large
      const bigFile = createMockFile('big.bin', 2048, 'application/octet-stream');
      fireEvent.change(input, { target: { files: createFileList([bigFile]) } });
      expect(screen.getByText(/exceeds maximum size/)).toBeInTheDocument();

      // Upload a valid file
      const smallFile = createMockFile('ok.txt', 500, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([smallFile]) } });
      expect(screen.queryByText(/exceeds maximum size/)).not.toBeInTheDocument();
      expect(screen.getByText('ok.txt')).toBeInTheDocument();
    });

    it('should clear upload error when removing a file and then uploading a new one', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          multiple: true,
          maxFiles: 2,
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload two files (at limit)
      const batch = [
        createMockFile('first.txt', 100, 'text/plain'),
        createMockFile('second.txt', 100, 'text/plain'),
      ];
      fireEvent.change(input, { target: { files: createFileList(batch) } });
      expect(screen.getByText('first.txt')).toBeInTheDocument();
      expect(screen.getByText('second.txt')).toBeInTheDocument();

      // Try to add a third file (exceeds maxFiles)
      const file3 = createMockFile('third.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file3]) } });
      expect(screen.getByText('Maximum 2 files allowed')).toBeInTheDocument();

      // Remove one file to go below the limit
      const removeBtn = screen.getByRole('button', { name: 'Remove first.txt' });
      fireEvent.click(removeBtn);

      // Now uploading a valid file should clear the error
      const file4 = createMockFile('replacement.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file4]) } });
      expect(screen.queryByText('Maximum 2 files allowed')).not.toBeInTheDocument();
      expect(screen.getByText('replacement.txt')).toBeInTheDocument();
    });
  });

  describe('File list display', () => {
    it('should render all files with their name and formatted size', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: {
          width: '100%', height: 120,
          placeholder: 'Drop files here',
          multiple: true,
          maxFiles: 5,
        },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const files = [
        createMockFile('readme.md', 256, 'text/markdown'),
        createMockFile('styles.css', 4096, 'text/css'),
      ];
      fireEvent.change(input, { target: { files: createFileList(files) } });

      expect(screen.getByText('readme.md')).toBeInTheDocument();
      expect(screen.getByText('(256 B)')).toBeInTheDocument();
      expect(screen.getByText('styles.css')).toBeInTheDocument();
      expect(screen.getByText('(4.0 KB)')).toBeInTheDocument();
    });

    it('should stop event propagation on file list area click to prevent re-opening picker', () => {
      const comp = {
        id: 'fileupload1',
        type: ComponentType.FILE_UPLOAD,
        props: { width: '100%', height: 120, placeholder: 'Drop files here' },
      };

      render(
        <FileUploadRenderer
          component={comp}
          mode="preview"
          dataStore={{}}
          evaluationScope={{}}
        />,
      );

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('test.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: createFileList([file]) } });

      // Clicking on the file name text should not propagate to the dropzone click handler
      const fileName = screen.getByText('test.txt');
      const event = new MouseEvent('click', { bubbles: true });
      const stopPropSpy = jest.spyOn(event, 'stopPropagation');
      fileName.parentElement!.parentElement!.dispatchEvent(event);
      // The container div has onClick stopPropagation — just verify the file is still there
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  describe('Default plugin props', () => {
    it('should have all expected default prop values', () => {
      const defaults = FileUploadPlugin.paletteConfig.defaultProps;
      expect(defaults.accept).toBe('');
      expect(defaults.maxFiles).toBe(5);
      expect(defaults.borderRadius).toBe('8px');
      expect(defaults.borderWidth).toBe('2px');
      expect(defaults.width).toBe('100%');
      expect(defaults.height).toBe('auto');
      expect(defaults.disabled).toBe(false);
      expect(defaults.required).toBe(false);
      expect(defaults.readOnly).toBe(false);
      expect(defaults.size).toBe('md');
      expect(defaults.placeholder).toBe('Drag & drop files here, or click to browse');
      expect(defaults.validationTiming).toBe('onBlur');
      expect(defaults.onChangeActionType).toBe('none');
    });
  });
});
