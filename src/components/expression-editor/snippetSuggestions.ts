/**
 * Returns snippet completion items for the expression editor.
 * These provide quick-insert templates for common patterns.
 */
export function getSnippetSuggestions(monaco: any): any[] {
  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;

  return [
    {
      label: 'actions.updateVariable',
      kind: CompletionItemKind.Snippet,
      documentation: 'Update an app variable value',
      insertText: "actions.updateVariable('${1:variableName}', ${2:newValue})",
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '0_updateVariable',
    },
    {
      label: 'actions.navigateTo',
      kind: CompletionItemKind.Snippet,
      documentation: 'Navigate to a different page',
      insertText: "actions.navigateTo('${1:pageId}')",
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '0_navigateTo',
    },
    {
      label: 'actions.submitForm',
      kind: CompletionItemKind.Snippet,
      documentation: 'Submit the form',
      insertText: 'actions.submitForm()',
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '0_submitForm',
    },
    {
      label: 'actions.createRecord',
      kind: CompletionItemKind.Snippet,
      documentation: 'Create a new record in a data source',
      insertText: "actions.createRecord('${1:dataSource}', ${2:record})",
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '0_createRecord',
    },
    {
      label: 'actions.updateRecord',
      kind: CompletionItemKind.Snippet,
      documentation: 'Update an existing record',
      insertText: "actions.updateRecord('${1:dataSource}', ${2:recordId}, ${3:updates})",
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '0_updateRecord',
    },
    {
      label: 'actions.deleteRecord',
      kind: CompletionItemKind.Snippet,
      documentation: 'Delete a record from a data source',
      insertText: "actions.deleteRecord('${1:dataSource}', ${2:recordId})",
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '0_deleteRecord',
    },
    {
      label: 'actions.selectRecord',
      kind: CompletionItemKind.Snippet,
      documentation: 'Select a record and store it',
      insertText: "actions.selectRecord('${1:key}', ${2:record})",
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '0_selectRecord',
    },
    {
      label: 'iife',
      kind: CompletionItemKind.Snippet,
      documentation: 'Immediately invoked function expression',
      insertText: [
        '(() => {',
        '  ${1:// your code here}',
        '  return ${2:result};',
        '})()',
      ].join('\n'),
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '1_iife',
    },
    {
      label: 'ternary',
      kind: CompletionItemKind.Snippet,
      documentation: 'Conditional (ternary) expression',
      insertText: '${1:condition} ? ${2:trueValue} : ${3:falseValue}',
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '1_ternary',
    },
    {
      label: 'theme.colors.',
      kind: CompletionItemKind.Snippet,
      documentation: 'Access a theme color token',
      insertText: 'theme.colors.${1|primary,secondary,background,surface,text,border,error,warning,success,info,link|}',
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: '1_themeColors',
    },
  ];
}
