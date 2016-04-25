// Type definitions for ag-grid v4.1.2
// Project: http://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ceolter/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
import { Column } from "../entities/column";
import { RenderedRow } from "./renderedRow";
import { Component } from "../widgets/component";
export declare class RenderedCell extends Component {
    private context;
    private columnApi;
    private gridApi;
    private gridOptionsWrapper;
    private expressionService;
    private selectionRendererFactory;
    private rowRenderer;
    private $compile;
    private templateService;
    private valueService;
    private eventService;
    private columnController;
    private rangeController;
    private focusedCellController;
    private contextMenuFactory;
    private focusService;
    private cellEditorFactory;
    private cellRendererFactory;
    private popupService;
    private cellRendererService;
    private valueFormatterService;
    private static PRINTABLE_CHARACTERS;
    private eGridCell;
    private eSpanWithValue;
    private eCellWrapper;
    private eParentOfValue;
    private gridCell;
    private eParentRow;
    private column;
    private node;
    private rowIndex;
    private editingCell;
    private cellEditorInPopup;
    private hideEditorPopup;
    private scope;
    private eCheckbox;
    private cellEditor;
    private cellRenderer;
    private value;
    private checkboxSelection;
    private renderedRow;
    private firstRightPinned;
    private lastLeftPinned;
    constructor(column: any, node: any, rowIndex: number, scope: any, renderedRow: RenderedRow);
    destroy(): void;
    private setPinnedClasses();
    getParentRow(): HTMLElement;
    setParentRow(eParentRow: HTMLElement): void;
    calculateCheckboxSelection(): any;
    getColumn(): Column;
    private getValue();
    private getDataForRow();
    private setLeftOnCell();
    private addRangeSelectedListener();
    private addHighlightListener();
    private addChangeListener();
    private animateCellWithDataChanged();
    private animateCellWithHighlight();
    private animateCell(cssName);
    private addCellFocusedListener();
    private setWidthOnCell();
    init(): void;
    private onEnterKeyDown();
    private onF2KeyDown();
    private onEscapeKeyDown();
    private onPopupEditorClosed();
    private onTabKeyDown(event);
    private onBackspaceOrDeleteKeyPressed(key);
    private onSpaceKeyPressed();
    private onNavigationKeyPressed(event, key);
    private addKeyPressListener();
    private onKeyDown(event);
    private addKeyDownListener();
    private createCellEditor(keyPress?, charPress?);
    private stopEditingAndFocus();
    startEditingIfEnabled(keyPress?: number, charPress?: string): void;
    private addInCellEditor();
    private addPopupCellEditor();
    focusCell(forceBrowserFocus: boolean): void;
    private stopEditing(reset?);
    private createParams();
    private createEvent(event, eventSource?);
    isCellEditable(): boolean;
    onMouseEvent(eventName: string, mouseEvent: MouseEvent, eventSource: HTMLElement): void;
    private onContextMenu(mouseEvent);
    private onCellDoubleClicked(mouseEvent, eventSource);
    private onMouseDown();
    private onCellClicked(mouseEvent);
    private setInlineEditingClass();
    private populateCell();
    private addStylesFromColDef();
    private addClassesFromColDef();
    private addClassesFromRules();
    private createParentOfValue();
    isVolatile(): boolean;
    refreshCell(animate?: boolean, newData?: boolean): void;
    private putDataIntoCell();
    private formatValue(value);
    private createRendererAndRefreshParams(valueFormatted, cellRendererParams);
    private useCellRenderer(cellRendererKey, cellRendererParams, valueFormatted);
    private addClasses();
}
